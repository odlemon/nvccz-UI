"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { fpaApi, type FpaModel, type FpaTimeGranularity } from "@/lib/api/fpa-api"
import { CurrencySelect } from "@/components/performance/currency-select"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"

type Props = {
  open: boolean
  model: FpaModel | null
  canEdit: boolean
  onClose: () => void
  onSaved: (model: FpaModel) => void
}

function isoDate(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

/** Edit calendar + base currency after create (PUT /models/:id). */
export function BuilderModelSettingsDialog({
  open,
  model,
  canEdit,
  onClose,
  onSaved,
}: Props) {
  const [baseCurrency, setBaseCurrency] = useState("USD")
  const [startPeriod, setStartPeriod] = useState("")
  const [endPeriod, setEndPeriod] = useState("")
  const [timeGranularity, setTimeGranularity] = useState<FpaTimeGranularity>("MONTHLY")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !model) return
    setBaseCurrency(model.baseCurrency || "USD")
    setStartPeriod(isoDate(model.startPeriod))
    setEndPeriod(isoDate(model.endPeriod))
    setTimeGranularity((model.timeGranularity as FpaTimeGranularity) || "MONTHLY")
    setErr(null)
    setBusy(false)
  }, [open, model])

  if (!open || !model) return null

  const handleSave = async () => {
    if (!canEdit) {
      setErr("This workspace is locked or you cannot edit model settings")
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
      const res = await fpaApi.updateModel(model.id, {
        baseCurrency,
        startPeriod,
        endPeriod,
        timeGranularity,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Update failed")
      toast.success("Calendar & currency saved")
      onSaved(res.data)
      onClose()
    } catch (e) {
      const msg = errorMessage(e)
      const locked = /409|MODEL_LOCKED|published|archived|locked/i.test(msg)
      if (!locked) {
        logFpaGap({
          category: "broken",
          path: `/v1/fpa/models/${model.id}`,
          method: "PUT",
          message: msg,
          impact: "Cannot update calendar/currency after create",
          response: e,
        })
      }
      setErr(
        locked
          ? "Published or archived models cannot change calendar or currency. Reopen a draft workspace, or create a new version."
          : msg,
      )
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-labelledby="builder-settings-title"
        className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <h2 id="builder-settings-title" className="text-sm font-semibold text-[#0f172a]">
            Calendar & currency
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <p className="text-[12px] text-[#64748b]">
            Update the planning horizon and base currency for{" "}
            <span className="font-medium text-[#0f172a]">{model.name}</span>.
          </p>

          <label className="block text-[11px] font-medium text-[#64748b]">
            Base currency <span className="text-[#b91c1c]">*</span>
            <div className="mt-1">
              <CurrencySelect
                value={baseCurrency}
                onChange={setBaseCurrency}
                disabled={!canEdit || busy}
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px] font-medium text-[#64748b]">
              Planning start <span className="text-[#b91c1c]">*</span>
              <input
                type="date"
                className={FIELD}
                value={startPeriod}
                disabled={!canEdit || busy}
                onChange={(e) => setStartPeriod(e.target.value)}
              />
            </label>
            <label className="block text-[11px] font-medium text-[#64748b]">
              Planning end <span className="text-[#b91c1c]">*</span>
              <input
                type="date"
                className={FIELD}
                value={endPeriod}
                disabled={!canEdit || busy}
                onChange={(e) => setEndPeriod(e.target.value)}
              />
            </label>
          </div>

          <label className="block text-[11px] font-medium text-[#64748b]">
            Time granularity <span className="text-[#b91c1c]">*</span>
            <select
              className={FIELD}
              value={timeGranularity}
              disabled={!canEdit || busy}
              onChange={(e) => setTimeGranularity(e.target.value as FpaTimeGranularity)}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </label>

          {err ? <p className="text-[12px] text-[#b91c1c]">{err}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-9 rounded-full border border-[#e2e8f0] px-4 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !canEdit}
            onClick={() => void handleSave()}
            className="h-9 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 text-xs font-medium text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
