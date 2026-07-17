"use client"

/**
 * Model Planning — list of planning (budget) cycles.
 *
 * This is the content of the "Model Planning" nav item (/forecasting/models).
 * The table mirrors the Model Builder list style (uppercase header, zebra rows,
 * hover, Open button with ArrowUpRight icon).
 *
 * A "planning cycle" is a distinct entity from the Budgeting tab's "budget cycle"
 * (FpaBudgetCycle). The worksheet accepts `cycleId` query param to scope to a cycle.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaStatusBadge } from "./fpa-status-badge"
import { BUDGET_STATUS_LABEL, statusTone } from "@/components/fpa/budget/budget-constants"
import { fpaApi, type FpaModelPlanningCycle } from "@/lib/api/fpa-api"
import { FpaModelPlanningCycleCreateModal } from "./fpa-model-planning-cycle-create-modal"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { cn } from "@/lib/utils"

function fmtPeriod(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const BTN_PRIMARY =
  "h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8]"
const BTN_GHOST =
  "h-8 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-3 text-[11px] font-medium text-[#0f172a] hover:bg-[#f8fafc]"

function worksheetHrefFor(cycle: FpaModelPlanningCycle): string {
  const qs = new URLSearchParams()
  qs.set("cycleId", cycle.id)
  if (cycle.sourceModelVersionId) qs.set("versionId", cycle.sourceModelVersionId)
  if (cycle.baseScenarioId) qs.set("scenarioId", cycle.baseScenarioId)
  if (cycle.cycle_name) qs.set("cycleName", cycle.cycle_name)
  return `/forecasting/models/${cycle.sourceModelId}/worksheet?${qs.toString()}`
}

export function FpaPlanningCyclesList() {
  const router = useRouter()
  const [cycles, setCycles] = useState<FpaModelPlanningCycle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fpaApi.listModelPlanningCycles({})
      if (!res.success || !res.data) throw new Error(res.message || "listModelPlanningCycles failed")
      setCycles(res.data.items || [])
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/model-planning/cycles",
        method: "GET",
        message: errorMessage(err),
        impact: "Planning cycle list failed",
        response: err,
      })
      const msg = errorMessage(err, "Failed to load planning cycles")
      setError(msg)
      toast.error(msg)
      setCycles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const openCycle = (c: FpaModelPlanningCycle) => router.push(worksheetHrefFor(c))

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Model Planning"
        hideFilters
        hideSearch
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className={BTN_PRIMARY}>
            <Plus className="w-3.5 h-3.5" />
            New planning cycle
          </button>
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
            <button type="button" className="ml-3 underline" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        )}

        {loading && cycles.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-[#64748b] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading planning cycles…
          </div>
        ) : cycles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-10 text-center max-w-lg mx-auto shadow-sm">
            <p className="text-sm font-medium text-[#0f172a]">No planning cycles yet</p>
            <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
              Create a planning cycle to start collecting budgets and driver assumptions from department owners.
            </p>
            <button type="button" onClick={() => setCreateOpen(true)} className={cn(BTN_PRIMARY, "mt-4")}>
              <Plus className="w-3.5 h-3.5" /> New planning cycle
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-left text-[11px] uppercase tracking-wide text-[#64748b] border-b border-[#e2e8f0]">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Fiscal Year</th>
                    <th className="px-4 py-3 font-medium">Horizon</th>
                    <th className="px-4 py-3 font-medium">Last updated</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((c, i) => (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-[#f1f5f9] cursor-pointer transition-colors last:border-b-0",
                        i % 2 === 1 ? "bg-[#fcfcfd]" : "bg-white",
                        "hover:bg-[#eff6ff]/60",
                      )}
                      onClick={() => openCycle(c)}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-[#0f172a]">{c.cycle_name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <FpaStatusBadge tone={statusTone(c.status)}>
                          {BUDGET_STATUS_LABEL[c.status] || c.status}
                        </FpaStatusBadge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-0.5 text-[11px] font-medium text-[#475569]">
                          {c.planningType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#475569] tabular-nums">FY{c.financialYear}</td>
                      <td className="px-4 py-3.5 text-[#475569] whitespace-nowrap text-[13px]">
                        {c.planningHorizon ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#64748b] whitespace-nowrap text-[13px]">
                        {fmtDateTime(c.updatedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link href={worksheetHrefFor(c)} className={BTN_GHOST}>
                          Open
                          <ArrowUpRight className="w-3 h-3 text-[#94a3b8]" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <FpaModelPlanningCycleCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={(cycle) => {
            setCreateOpen(false)
            router.push(worksheetHrefFor(cycle))
          }}
        />
      )}
    </div>
  )
}