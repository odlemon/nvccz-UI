"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { fpaApi, type FpaModelType, type FpaTimeGranularity } from "@/lib/api/fpa-api"
import { CurrencySelect } from "@/components/performance/currency-select"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useAppDispatch } from "@/lib/store"
import { bootstrapFpaSelection, fetchFpaModels } from "@/lib/store/slices/fpaSlice"

const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"
const FIELD_AREA =
  "mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] bg-white min-h-[72px] resize-none"

type Props = {
  open: boolean
  onClose: () => void
}

function defaultYearBounds() {
  const y = new Date().getFullYear()
  return {
    start: `${y}-01-01`,
    end: `${y}-12-31`,
  }
}

/**
 * Light create modal for Model Builder list — structure/formulas come on the detail page.
 */
export function BuilderCreateModelModal({ open, onClose }: Props) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const bounds = defaultYearBounds()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [modelType, setModelType] = useState<FpaModelType>("BUDGET")
  const [baseCurrency, setBaseCurrency] = useState("USD")
  const [startPeriod, setStartPeriod] = useState(bounds.start)
  const [endPeriod, setEndPeriod] = useState(bounds.end)
  const [timeGranularity, setTimeGranularity] = useState<FpaTimeGranularity>("MONTHLY")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!open) return null

  const reset = () => {
    const b = defaultYearBounds()
    setName("")
    setDescription("")
    setModelType("BUDGET")
    setBaseCurrency("USD")
    setStartPeriod(b.start)
    setEndPeriod(b.end)
    setTimeGranularity("MONTHLY")
    setErr(null)
    setBusy(false)
  }

  const handleClose = () => {
    if (busy) return
    reset()
    onClose()
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setErr("Name is required")
      return
    }
    if (!startPeriod || !endPeriod) {
      setErr("Planning start and end are required")
      return
    }
    if (new Date(endPeriod) <= new Date(startPeriod)) {
      setErr("Planning end must be after start")
      return
    }

    setBusy(true)
    setErr(null)
    try {
      const res = await fpaApi.createModel({
        name: trimmed,
        description: description.trim() || undefined,
        modelType,
        baseCurrency,
        startPeriod,
        endPeriod,
        timeGranularity,
      })
      if (!res.success || !res.data?.id) {
        throw new Error(res.message || "Create failed")
      }
      const newId = res.data.id
      toast.success("Model created")
      await dispatch(fetchFpaModels())
      await dispatch(bootstrapFpaSelection(newId))
      reset()
      onClose()
      router.push(`/forecasting/model-builder/${newId}`)
    } catch (e) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/models",
        method: "POST",
        message: errorMessage(e),
        impact: "Cannot create model from Builder list",
        response: e,
      })
      setErr(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-labelledby="builder-create-title"
        className="w-full max-w-lg rounded-xl border border-[#e2e8f0] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <h2 id="builder-create-title" className="text-sm font-semibold text-[#0f172a]">
            New model
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-[12px] text-[#64748b]">
            Create the model shell here. Add modules, formulas, and publish on the Builder detail
            page.
          </p>

          <label className="block text-[11px] font-medium text-[#64748b]">
            Name <span className="text-[#b91c1c]">*</span>
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FY2026 Financial Model"
              autoFocus
            />
          </label>

          <label className="block text-[11px] font-medium text-[#64748b]">
            Description
            <textarea
              className={FIELD_AREA}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={2}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-[11px] font-medium text-[#64748b]">
              Model type <span className="text-[#b91c1c]">*</span>
              <select
                className={FIELD}
                value={modelType}
                onChange={(e) => setModelType(e.target.value as FpaModelType)}
              >
                <option value="BUDGET">Budget</option>
                <option value="FORECAST">Forecast</option>
                <option value="ROLLING_FORECAST">Rolling forecast</option>
              </select>
            </label>

            <label className="block text-[11px] font-medium text-[#64748b]">
              Base currency <span className="text-[#b91c1c]">*</span>
              <div className="mt-1">
                <CurrencySelect value={baseCurrency} onChange={setBaseCurrency} />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-[11px] font-medium text-[#64748b]">
              Planning start <span className="text-[#b91c1c]">*</span>
              <input
                type="date"
                className={FIELD}
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
              />
            </label>
            <label className="block text-[11px] font-medium text-[#64748b]">
              Planning end <span className="text-[#b91c1c]">*</span>
              <input
                type="date"
                className={FIELD}
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
              />
            </label>
          </div>

          <label className="block text-[11px] font-medium text-[#64748b]">
            Time granularity <span className="text-[#b91c1c]">*</span>
            <select
              className={FIELD}
              value={timeGranularity}
              onChange={(e) => setTimeGranularity(e.target.value as FpaTimeGranularity)}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </label>

          {err && <p className="text-[12px] text-[#b91c1c]">{err}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            className="h-9 rounded-full border border-[#e2e8f0] px-4 text-[13px] font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void handleCreate()}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
