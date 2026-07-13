"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Copy, ArrowUpRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import {
  asNumber,
  formatMoney,
  fpaApi,
  type FpaScenario,
} from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  setSelectedModelId,
  setSelectedScenarioId,
  setSelectedVersionId,
} from "@/lib/store/slices/fpaSlice"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { cn } from "@/lib/utils"

const TONES = ["blue", "green", "red", "amber", "slate"] as const
const TONE_STYLES = {
  blue: { border: "border-[#2563eb]/30", bg: "bg-[#eff6ff]" },
  green: { border: "border-[#16a34a]/30", bg: "bg-[#f0fdf4]" },
  red: { border: "border-[#dc2626]/30", bg: "bg-[#fef2f2]" },
  amber: { border: "border-[#d97706]/30", bg: "bg-[#fffbeb]" },
  slate: { border: "border-[#64748b]/30", bg: "bg-[#f8fafc]" },
} as const

type CompareRow = {
  code: string
  left: number
  right: number
  delta: number
  deltaPct: number | null
  /** When true, higher values are favourable (revenue). When false, higher is unfavourable (cost). */
  higherIsFavourable: boolean
}

function higherIsFavourable(code: string): boolean {
  const c = code.toUpperCase()
  if (
    c.includes("COGS") ||
    c.includes("OPEX") ||
    c.includes("EXPENSE") ||
    c.includes("COST") ||
    c.includes("CAPEX") ||
    c.includes("TAX")
  ) {
    return false
  }
  return true
}

export function FpaScenarioComparison() {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const {
    selectedModelId,
    selectedVersionId,
    selectedScenarioId,
    scenarios,
    models,
  } = useAppSelector((s) => s.fpa)
  const { canCreateScenario } = useFpaPermissions()
  const [list, setList] = useState<FpaScenario[]>([])
  const [compareRows, setCompareRows] = useState<CompareRow[]>([])
  const [leftName, setLeftName] = useState("")
  const [rightName, setRightName] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [anchorId, setAnchorId] = useState<string | null>(null)

  useEffect(() => {
    const mid = searchParams.get("modelId")
    const vid = searchParams.get("versionId")
    const sid = searchParams.get("scenarioId")
    if (mid) dispatch(setSelectedModelId(mid))
    if (vid) dispatch(setSelectedVersionId(vid))
    if (sid) dispatch(setSelectedScenarioId(sid))
  }, [searchParams, dispatch])

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setList([])
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.listScenarios(selectedModelId)
      if (!res.success) throw new Error(res.message || "Scenarios failed")
      const data = res.data?.length ? res.data : scenarios
      setList(data)
      setSelectedIds((prev) => {
        if (prev.length) return prev.filter((id) => data.some((s) => s.id === id))
        const seed = selectedScenarioId && data.some((s) => s.id === selectedScenarioId)
          ? [selectedScenarioId]
          : data.slice(0, 2).map((s) => s.id)
        return seed
      })
      setAnchorId((prev) => {
        if (prev && data.some((s) => s.id === prev)) return prev
        const budget = data.find((s) => /budget/i.test(s.name) || /budget/i.test(s.scenarioType || ""))
        return budget?.id || selectedScenarioId || data[0]?.id || null
      })
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/scenarios",
        method: "GET",
        message: errorMessage(err),
        impact: "Scenario comparison empty",
        response: err,
      })
      toast.error(errorMessage(err))
      setList(scenarios)
    } finally {
      setLoading(false)
    }
  }, [selectedModelId, scenarios, selectedScenarioId])

  const compareTargetId = useMemo(() => {
    const others = selectedIds.filter((id) => id !== anchorId)
    return others[0] || null
  }, [selectedIds, anchorId])

  const runCompare = useCallback(async () => {
    if (!anchorId || !selectedVersionId || !compareTargetId) {
      setCompareRows([])
      return
    }
    try {
      const res = await fpaApi.compareScenarios(anchorId, {
        versionId: selectedVersionId,
        compareScenarioId: compareTargetId,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Compare failed")
      setLeftName(res.data.left?.name || "Budget")
      setRightName(res.data.right?.name || "Compare")
      setCompareRows(
        (res.data.rows || []).map((r) => {
          const left = asNumber(r.left)
          const right = asNumber(r.right)
          const delta = asNumber(r.delta)
          return {
            code: r.code,
            left,
            right,
            delta,
            deltaPct: left !== 0 ? (delta / Math.abs(left)) * 100 : null,
            higherIsFavourable: higherIsFavourable(r.code),
          }
        }),
      )
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/scenarios/${anchorId}/compare`,
        method: "POST",
        message: errorMessage(err),
        impact: "Metric comparison table empty",
        request: { versionId: selectedVersionId, compareScenarioId: compareTargetId },
        response: err,
      })
      setCompareRows([])
      toast.error(errorMessage(err, "Scenario compare failed"))
    }
  }, [anchorId, selectedVersionId, compareTargetId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void runCompare()
  }, [runCompare])

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  const duplicate = async () => {
    if (!selectedScenarioId || !selectedVersionId) return
    setBusy(true)
    try {
      const base = list.find((s) => s.id === selectedScenarioId)
      const res = await fpaApi.copyScenario(selectedScenarioId, {
        versionId: selectedVersionId,
        name: `${base?.name || "Scenario"} Copy`,
        scenarioType: base?.scenarioType,
      })
      if (!res.success) throw new Error(res.message || "Copy failed")
      toast.success(`Duplicated (${res.data?.cellsCopied ?? 0} cells)`)
      await load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const promote = async () => {
    if (!selectedScenarioId) {
      toast.error("Select a scenario first")
      return
    }
    setBusy(true)
    try {
      const res = await fpaApi.promoteScenario(selectedScenarioId, {
        versionId: selectedVersionId || undefined,
      })
      if (!res.success) throw new Error(res.message || "Promote failed")
      toast.success("Scenario promoted to forecast")
      await load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const kpiCards = useMemo(() => {
    if (!compareRows.length) return []
    const pick = (re: RegExp) => compareRows.find((r) => re.test(r.code))
    return [pick(/REVENUE/), pick(/EBITDA/), pick(/CASH|CLOSING/), pick(/OPEX|EXPENSE/)].filter(
      Boolean,
    ) as CompareRow[]
  }, [compareRows])

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Scenario Comparison"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || !selectedScenarioId || !canCreateScenario}
              onClick={() => void duplicate()}
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 text-xs text-[#475569] disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void promote()}
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 text-xs text-[#475569] disabled:opacity-50"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Promote to Forecast
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-5 space-y-4 max-w-[1600px]">
        {!selectedModelId ? (
          <p className="text-sm text-[#94a3b8]">
            Select a model in Model Planning, then open Compare — or pick a model from the global
            header.
            {models[0] ? (
              <>
                {" "}
                <button
                  type="button"
                  className="text-[#2563eb] underline"
                  onClick={() => dispatch(setSelectedModelId(models[0].id))}
                >
                  Use {models[0].name}
                </button>
              </>
            ) : null}
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 py-12 text-[#64748b]">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading scenarios…
          </div>
        ) : (
          <>
            <div className="rounded-md border border-[#e2e8f0] bg-white px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#64748b]">
                  {selectedIds.length} selected · Variance vs anchor (Budget)
                </p>
                <Link
                  href="/forecasting/workflow"
                  className="text-[11px] text-[#2563eb] hover:underline"
                >
                  Approvals managed in Workflow
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((s, i) => {
                  const on = selectedIds.includes(s.id)
                  const tone = TONES[i % TONES.length]
                  const style = TONE_STYLES[tone]
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSelected(s.id)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left min-w-[140px]",
                        on ? style.border : "border-[#e2e8f0]",
                        on ? style.bg : "bg-white",
                      )}
                    >
                      <p className="text-xs font-semibold text-[#0f172a]">{s.name}</p>
                      <p className="text-[10px] text-[#64748b] mt-0.5">{s.scenarioType}</p>
                      {anchorId === s.id && (
                        <p className="text-[10px] text-[#2563eb] mt-1">Anchor</p>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#64748b]">Anchor (vs Budget)</span>
                <select
                  className="h-8 rounded-full border border-[#e2e8f0] px-2"
                  value={anchorId || ""}
                  onChange={(e) => setAnchorId(e.target.value || null)}
                >
                  {list.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="text-[#64748b]">Compare to</span>
                <select
                  className="h-8 rounded-full border border-[#e2e8f0] px-2"
                  value={compareTargetId || ""}
                  onChange={(e) => {
                    const id = e.target.value
                    if (!id) return
                    setSelectedIds((prev) => {
                      const withoutTargets = prev.filter((x) => x === anchorId || x === id)
                      if (!withoutTargets.includes(id)) return [...withoutTargets, id]
                      return withoutTargets.length ? withoutTargets : [anchorId!, id]
                    })
                  }}
                >
                  {list
                    .filter((s) => s.id !== anchorId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="h-8 rounded-full border border-[#e2e8f0] px-2"
                  onClick={() => void runCompare()}
                >
                  Refresh compare
                </button>
              </div>
            </div>

            {kpiCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {kpiCards.map((k) => {
                  const favourable =
                    (k.delta >= 0 && k.higherIsFavourable) ||
                    (k.delta < 0 && !k.higherIsFavourable)
                  return (
                    <div
                      key={k.code}
                      className="rounded-md border border-[#e2e8f0] bg-white px-3 py-2.5"
                    >
                      <p className="text-[10px] text-[#94a3b8]">{k.code}</p>
                      <p className="text-sm font-semibold tabular-nums text-[#0f172a]">
                        {formatMoney(k.right)}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] mt-0.5",
                          favourable ? "text-[#16a34a]" : "text-[#dc2626]",
                        )}
                      >
                        {formatMoney(k.delta)} vs Budget
                        {k.deltaPct != null ? ` (${k.deltaPct.toFixed(1)}%)` : ""}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            <section className="rounded-md border border-[#e2e8f0] bg-white overflow-x-auto">
              <div className="px-4 py-3 border-b border-[#e2e8f0]">
                <h2 className="text-sm font-semibold text-[#0f172a]">Metric Comparison</h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {leftName || "Budget"} vs {rightName || "Scenario"} · variance vs Budget
                </p>
              </div>
              {compareRows.length === 0 ? (
                <p className="p-6 text-sm text-[#94a3b8]">
                  No comparison rows. Select an anchor and at least one other scenario.
                </p>
              ) : (
                <table className="w-full border-collapse text-xs min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                      <th className="text-left px-4 py-2.5 font-medium">Metric</th>
                      <th className="px-4 py-2.5 text-right font-medium">{leftName || "Budget"}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{rightName || "Scenario"}</th>
                      <th className="px-4 py-2.5 text-right font-medium">Variance $</th>
                      <th className="px-4 py-2.5 text-right font-medium">Variance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row) => {
                      const favourable =
                        (row.delta >= 0 && row.higherIsFavourable) ||
                        (row.delta < 0 && !row.higherIsFavourable)
                      return (
                        <tr key={row.code} className="border-b border-[#f1f5f9]">
                          <td className="px-4 py-2.5 font-medium text-[#0f172a]">{row.code}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {formatMoney(row.left)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {formatMoney(row.right)}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-2.5 text-right tabular-nums",
                              favourable ? "text-[#16a34a]" : "text-[#dc2626]",
                            )}
                          >
                            {formatMoney(row.delta)}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-2.5 text-right tabular-nums",
                              favourable ? "text-[#16a34a]" : "text-[#dc2626]",
                            )}
                          >
                            {row.deltaPct == null ? "—" : `${row.deltaPct.toFixed(1)}%`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="rounded-md border border-dashed border-[#e2e8f0] bg-white p-6 text-sm text-[#94a3b8]">
                Variance waterfall / bridge — not returned by compare API. Edit Bridge stays hidden.
              </section>
              <section className="rounded-md border border-dashed border-[#e2e8f0] bg-white p-6 text-sm text-[#94a3b8]">
                Scenario assumption sliders require min/max from the drivers API. Use Model Planning
                drivers panel for numeric overrides.
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
