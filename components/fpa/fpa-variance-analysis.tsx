"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaDrawer } from "./fpa-drawer"
import { FpaStatusBadge } from "./fpa-status-badge"
import {
  asNumber,
  formatMoney,
  fpaApi,
  type FpaVarianceResult,
} from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { cn } from "@/lib/utils"

function formatVar(value: number): string {
  const abs = Math.abs(value).toFixed(1)
  return value < 0 ? `(${abs})` : abs
}

export function FpaVarianceAnalysis() {
  const { selectedModelId, selectedVersionId, selectedScenarioId } = useAppSelector((s) => s.fpa)
  const { canInvestigateVariance, canAddCommentary } = useFpaPermissions()
  const [results, setResults] = useState<FpaVarianceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [commentary, setCommentary] = useState("")

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.listVarianceResults({ modelId: selectedModelId, limit: 200 })
      if (!res.success) throw new Error(res.message || "Variance list failed")
      setResults(res.data || [])
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/variance/results",
        method: "GET",
        message: errorMessage(err),
        impact: "Variance table empty",
        response: err,
      })
      toast.error(errorMessage(err))
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    logFpaGap({
      category: "missing",
      path: "/v1/fpa/variance/results",
      method: "GET",
      message: "No KPI sparks, monthly trend series, or commentary-request queue in variance payloads",
      impact: "Trend chart and commentary-request table empty",
    })
  }, [])

  const calculate = async () => {
    if (!selectedModelId || !selectedVersionId || !selectedScenarioId) {
      toast.error("Model, version, and scenario required")
      return
    }
    setBusy(true)
    try {
      const res = await fpaApi.calculateVariance({
        modelId: selectedModelId,
        versionId: selectedVersionId,
        scenarioId: selectedScenarioId,
        varianceType: "ACTUAL_VS_BUDGET",
      })
      if (!res.success) throw new Error(res.message || "Calculate failed")
      toast.success(`Calculated ${res.data?.count ?? 0} variance rows`)
      if (res.data?.results?.length) setResults(res.data.results)
      else await load()
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/variance/calculate",
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot recalculate variance",
        request: { selectedModelId, selectedVersionId, selectedScenarioId },
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const selected = results.find((r) => r.id === selectedId) || null

  const kpis = useMemo(() => {
    if (!results.length) return []
    const totalVar = results.reduce((s, r) => s + asNumber(r.varianceAmount), 0)
    const fav = results.filter((r) => String(r.direction).toUpperCase().includes("FAV")).length
    const unfav = results.length - fav
    const needComment = results.filter((r) => r.commentaryRequired).length
    return [
      { label: "Rows", value: String(results.length), delta: "" },
      { label: "Net variance", value: formatMoney(totalVar), delta: "" },
      { label: "Favourable", value: String(fav), delta: "" },
      { label: "Unfavourable", value: String(unfav), delta: "" },
      { label: "Need commentary", value: String(needComment), delta: "" },
    ]
  }, [results])

  const tornado = useMemo(() => {
    const byName = new Map<string, number>()
    for (const r of results) {
      const name = r.lineItem?.name || r.lineItem?.code || r.lineItemId.slice(0, 8)
      byName.set(name, (byName.get(name) || 0) + asNumber(r.varianceAmount))
    }
    return [...byName.entries()]
      .map(([dept, value]) => ({ dept, value: value / 1_000_000 }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 10)
  }, [results])

  const saveCommentary = async () => {
    if (!selected || !commentary.trim()) return
    setBusy(true)
    try {
      const res = await fpaApi.addVarianceCommentary(selected.id, {
        commentary: commentary.trim(),
        body: commentary.trim(),
      })
      if (!res.success) throw new Error(res.message || "Commentary failed")
      toast.success("Commentary saved")
      setCommentary("")
      await load()
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/variance/${selected.id}/commentary`,
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot add variance commentary",
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col">
      <FpaPageHeader
        title="Variance Analysis"
        actions={
          <button
            type="button"
            disabled={busy || !selectedModelId || !canInvestigateVariance}
            onClick={() => void calculate()}
            className="h-9 rounded-full bg-[#2563eb] px-3 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy ? "Working…" : "Calculate"}
          </button>
        }
      />

      <div className="px-4 sm:px-5 py-3 border-b border-[#e2e8f0] bg-white flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#64748b]">
          Using selection: model / version / scenario from header
        </span>
        <button
          type="button"
          className="h-8 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] px-2.5 text-xs text-[#64748b] ml-auto"
          onClick={() => void load()}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 min-h-0">
        <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-4">
          {!selectedModelId ? (
            <p className="text-sm text-[#94a3b8]">Select a model to load variance.</p>
          ) : loading ? (
            <div className="flex items-center gap-2 py-12 text-[#64748b]">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading variance…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {kpis.length === 0 ? (
                  <p className="text-sm text-[#94a3b8] col-span-5">
                    No results yet. Click Calculate to run ACTUAL_VS_BUDGET.
                  </p>
                ) : (
                  kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-md border border-[#e2e8f0] bg-white p-4">
                      <p className="text-xs text-[#64748b]">{kpi.label}</p>
                      <p className="text-xl font-semibold text-[#0f172a] tabular-nums mt-2">{kpi.value}</p>
                    </div>
                  ))
                )}
              </div>

              <section className="rounded-md border border-[#e2e8f0] bg-white overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#e2e8f0]">
                  <h2 className="text-sm font-semibold text-[#0f172a]">Variance results</h2>
                </div>
                {results.length === 0 ? (
                  <p className="p-6 text-sm text-[#94a3b8]">No variance rows.</p>
                ) : (
                  <table className="w-full border-collapse text-xs min-w-[800px]">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                        <th className="text-left px-4 py-2.5 font-medium">Line item</th>
                        <th className="px-3 py-2.5 text-left font-medium">Period</th>
                        <th className="px-3 py-2.5 text-right font-medium">Actual</th>
                        <th className="px-3 py-2.5 text-right font-medium">Plan</th>
                        <th className="px-3 py-2.5 text-right font-medium">Variance</th>
                        <th className="px-3 py-2.5 text-right font-medium">Var %</th>
                        <th className="px-3 py-2.5 text-left font-medium">Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row) => {
                        const amt = asNumber(row.varianceAmount)
                        const pct = asNumber(row.variancePercent)
                        return (
                          <tr
                            key={row.id}
                            onClick={() => {
                              setSelectedId(row.id)
                              setDrawerOpen(true)
                              setCommentary(row.comments?.[0]?.commentary || row.comments?.[0]?.body || "")
                            }}
                            className={cn(
                              "border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc]",
                              selectedId === row.id && drawerOpen && "bg-[#eff6ff]",
                            )}
                          >
                            <td className="px-4 py-2.5 font-medium text-[#0f172a]">
                              {row.lineItem?.name || row.lineItem?.code || row.lineItemId.slice(0, 8)}
                            </td>
                            <td className="px-3 py-2.5 text-[#475569]">{row.periodDate?.slice(0, 10)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(row.actualValue)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-[#64748b]">
                              {formatMoney(row.planValue)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right tabular-nums font-medium",
                                amt >= 0 ? "text-[#16a34a]" : "text-[#dc2626]",
                              )}
                            >
                              {formatVar(amt / 1_000_000)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right tabular-nums",
                                pct >= 0 ? "text-[#16a34a]" : "text-[#dc2626]",
                              )}
                            >
                              {pct >= 0 ? "+" : ""}
                              {pct.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2.5">
                              <FpaStatusBadge tone={amt >= 0 ? "success" : "danger"}>
                                {row.direction}
                              </FpaStatusBadge>
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
                  Variance trend time series not provided by API.
                </section>
                <section className="rounded-md border border-[#e2e8f0] bg-white p-4">
                  <h2 className="text-sm font-semibold text-[#0f172a] mb-1">Variance breakdown</h2>
                  <p className="text-xs text-[#64748b] mb-3">By line item ($M)</p>
                  {tornado.length === 0 ? (
                    <p className="text-xs text-[#94a3b8]">No data</p>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tornado} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                          <YAxis
                            type="category"
                            dataKey="dept"
                            tick={{ fontSize: 10, fill: "#0f172a" }}
                            width={110}
                          />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {tornado.map((entry, i) => (
                              <Cell key={i} fill={entry.value >= 0 ? "#16a34a" : "#dc2626"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>

        <FpaDrawer
          open={drawerOpen && !!selected}
          onClose={() => setDrawerOpen(false)}
          title="Variance Detail"
          badge={
            selected ? (
              <FpaStatusBadge tone={asNumber(selected.varianceAmount) >= 0 ? "success" : "danger"}>
                {asNumber(selected.variancePercent).toFixed(1)}%
              </FpaStatusBadge>
            ) : undefined
          }
          footer={
            <button
              type="button"
              disabled={busy || !commentary.trim() || !canAddCommentary}
              onClick={() => void saveCommentary()}
              className="w-full h-9 rounded-full bg-[#2563eb] text-xs font-medium text-white disabled:opacity-50"
            >
              Save Commentary
            </button>
          }
        >
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-[#64748b]">Line item</p>
                <p className="font-medium text-[#0f172a]">
                  {selected.lineItem?.name || selected.lineItemId}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-[#f8fafc] border border-[#e2e8f0] p-2.5 text-center">
                  <p className="text-[10px] text-[#64748b]">Actual</p>
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(selected.actualValue)}</p>
                </div>
                <div className="rounded-md bg-[#f8fafc] border border-[#e2e8f0] p-2.5 text-center">
                  <p className="text-[10px] text-[#64748b]">Plan</p>
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(selected.planValue)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Commentary</p>
                <textarea
                  className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-xs"
                  rows={4}
                  value={commentary}
                  onChange={(e) => setCommentary(e.target.value)}
                />
              </div>
            </div>
          )}
        </FpaDrawer>
      </div>
    </div>
  )
}
