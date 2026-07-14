"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Copy, ArrowUpRight, Loader2, Search, Sliders, Plus, Info } from "lucide-react"
import { toast } from "sonner"
import { formatMoney, fpaApi, type FpaScenario } from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSelectedModelId, setSelectedScenarioId, setSelectedVersionId } from "@/lib/store/slices/fpaSlice"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import {
  mockScenarioAssumptions,
  mockScenarioCompareValues,
  mockSensitivity,
  SRD_SCENARIO_NAMES,
} from "@/components/fpa/mock-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const R = "rounded-lg"

function mergeWithSrdScenarios(apiList: FpaScenario[], modelId: string): FpaScenario[] {
  const byNorm = new Map(apiList.map((s) => [s.name.toLowerCase().replace(/[^a-z0-9]/g, ""), s]))
  const merged = [...apiList]
  for (const name of SRD_SCENARIO_NAMES) {
    const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "")
    const exists = [...byNorm.keys()].some(
      (k) => k.includes(norm.replace("case", "")) || norm.includes(k.replace("case", "")),
    )
    if (!exists) {
      merged.push({
        id: `srd-${norm}`,
        modelId,
        name,
        scenarioType: name.includes("Base") ? "BASE" : name.includes("Upside") ? "UPSIDE" : name.includes("Downside") ? "DOWNSIDE" : "WHAT_IF",
        isDefault: name === "Base Case",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as FpaScenario)
    }
  }
  return merged
}

function getScenarioMockValues(name: string) {
  if (mockScenarioCompareValues[name]) return mockScenarioCompareValues[name]
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "")
  for (const [key, vals] of Object.entries(mockScenarioCompareValues)) {
    const kn = key.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (norm.includes(kn.replace("case", "")) || kn.includes(norm.replace("case", ""))) return vals
  }
  if (norm.includes("upside") || norm.includes("best")) return mockScenarioCompareValues["Upside Case"]
  if (norm.includes("downside")) return mockScenarioCompareValues["Downside Case"]
  if (norm.includes("base")) return mockScenarioCompareValues["Base Case"]
  return null
}

const TONE_COLORS = {
  budget: { border: "border-[#7c3aed]/30", bg: "bg-[#f9f5ff]", text: "text-[#6941c6]", dot: "#7c3aed" },
  forecast: { border: "border-[#2563eb]/30", bg: "bg-[#eff8ff]", text: "text-[#175cd3]", dot: "#2563eb" },
  best: { border: "border-[#12b76a]/30", bg: "bg-[#edfcf2]", text: "text-[#087443]", dot: "#12b76a" },
  base: { border: "border-[#3538cd]/30", bg: "bg-[#eef4ff]", text: "text-[#3538cd]", dot: "#3b82f6" },
  downside: { border: "border-[#f04438]/30", bg: "bg-[#fef3f2]", text: "text-[#b42318]", dot: "#f04438" },
  generic: { border: "border-[#667085]/30", bg: "bg-[#f8fafc]", text: "text-[#344054]", dot: "#667085" },
}

function getToneStyle(name: string) {
  const n = name.toLowerCase()
  if (n.includes("budget")) return TONE_COLORS.budget
  if (n.includes("forecast")) return TONE_COLORS.forecast
  if (n.includes("best") || n.includes("upside")) return TONE_COLORS.best
  if (n.includes("base")) return TONE_COLORS.base
  if (n.includes("downside") || n.includes("cost reduction")) return TONE_COLORS.downside
  if (n.includes("fx")) return TONE_COLORS.forecast
  if (n.includes("hiring")) return TONE_COLORS.best
  if (n.includes("fundraising") || n.includes("expansion")) return TONE_COLORS.best
  return TONE_COLORS.generic
}

function scenarioInherits(name: string): string {
  const n = name.toLowerCase()
  if (n.includes("copy")) return "Base Case"
  if (n.includes("upside") || n.includes("expansion") || n.includes("fundraising")) return "Base Case"
  if (n.includes("downside") || n.includes("fx") || n.includes("hiring") || n.includes("cost")) return "Base Case"
  return "None (Root)"
}

const CANONICAL_METRICS = [
  { code: "REVENUE", label: "Revenue", match: /revenue/i },
  { code: "COGS", label: "COGS", match: /cogs|cost\s*of\s*(goods|sales)/i },
  { code: "GROSS_PROFIT", label: "Gross Profit", match: /gross\s*profit/i },
  { code: "GROSS_MARGIN", label: "Gross Margin", match: /gross\s*margin/i, pct: true },
  { code: "OPEX", label: "Opex", match: /opex|operating\s*exp/i },
  { code: "EBITDA", label: "EBITDA", match: /ebitda/i },
  { code: "EBITDA_MARGIN", label: "EBITDA Margin", match: /ebitda\s*margin/i, pct: true },
  { code: "CAPEX", label: "Capex", match: /capex|capital\s*exp/i },
  { code: "HEADCOUNT", label: "Headcount (FTE)", match: /headcount|fte/i, count: true },
] as const

type ScenarioValues = Record<string, number | null>

type MetricRow = {
  code: string
  label: string
  isPct?: boolean
  isCount?: boolean
  byScenario: ScenarioValues
  varianceAbs: number | null
  variancePct: number | null
}

const DEMO_ASSUMPTIONS = mockScenarioAssumptions

export function FpaScenarioComparison() {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const { selectedModelId, selectedVersionId, selectedScenarioId, scenarios } = useAppSelector((s) => s.fpa)

  const [list, setList] = useState<FpaScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [anchorId, setAnchorId] = useState<string | null>(null)
  
  // Interactive Controls
  const [searchQuery, setSearchQuery] = useState("")
  const [metricUnit, setMetricUnit] = useState<"$" | "%">("$")
  
  // Waterfall configuration state
  const [waterfallBars, setWaterfallBars] = useState([
    { label: "Base Case", value: 125.8, displayValue: "125.8M", type: "total" as const },
    { label: "Price", value: 4.2, displayValue: "+4.2M", type: "increase" as const },
    { label: "Volume", value: 5.1, displayValue: "+5.1M", type: "increase" as const },
    { label: "Mix", value: -2.2, displayValue: "(2.2M)", type: "decrease" as const },
    { label: "FX", value: -1.8, displayValue: "(1.8M)", type: "decrease" as const },
    { label: "Opex", value: -0.7, displayValue: "(0.7M)", type: "decrease" as const },
    { label: "Upside Case", value: 138.3, displayValue: "138.3M", type: "total" as const },
  ])
  const [isWaterfallModalOpen, setIsWaterfallModalOpen] = useState(false)
  const [tempWaterfallBars, setTempWaterfallBars] = useState<typeof waterfallBars>([])

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
      const raw = res.data?.length ? res.data : scenarios
      const data = mergeWithSrdScenarios(raw, selectedModelId)
      setList(data)
      setSelectedIds((prev) => {
        if (prev.length) return prev.filter((id) => data.some((s) => s.id === id))
        return data.map((s) => s.id)
      })
      setAnchorId((prev) => {
        if (prev && data.some((s) => s.id === prev)) return prev
        const base = data.find((s) => /base/i.test(s.name))
        return base?.id || selectedScenarioId || data[0]?.id || null
      })
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/scenarios",
        method: "GET",
        message: errorMessage(err),
        impact: "Scenarios tab shows demo data",
        response: err,
      })
      setList(mergeWithSrdScenarios(scenarios, selectedModelId))
    } finally {
      setLoading(false)
    }
  }, [selectedModelId, scenarios, selectedScenarioId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedModelId && list.length === 0) {
      const demo = mergeWithSrdScenarios([], "demo")
      setList(demo)
      setSelectedIds(demo.map((s) => s.id))
      setAnchorId(demo.find((s) => /base/i.test(s.name))?.id ?? null)
      setLoading(false)
    }
  }, [selectedModelId, list.length])

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  // Duplicate scenario in local state instantly
  const duplicateScenario = (sId: string) => {
    const target = list.find((s) => s.id === sId)
    if (!target) return
    const newScenario: FpaScenario = {
      ...target,
      id: `copy-${Date.now()}`,
      name: `${target.name} Copy`,
      scenarioType: target.scenarioType,
    }
    setList((prev) => [...prev, newScenario])
    setSelectedIds((prev) => [...prev, newScenario.id])
    toast.success(`Duplicated scenario: "${target.name}"`)
  }

  // Promote scenario in local state instantly
  const promoteScenario = (sId: string) => {
    const target = list.find((s) => s.id === sId)
    if (!target) return
    setList((prev) =>
      prev.map((s) =>
        s.id === sId
          ? { ...s, name: `${s.name} (Active Forecast)`, scenarioType: "FORECAST" }
          : s,
      ),
    )
    toast.success(`Promoted scenario: "${target.name}" to Active Forecast`)
  }

  // Build the comparison matrix rows with overlays
  const tableRows = useMemo(() => {
    const others = selectedIds.filter((id) => id !== anchorId)
    const activeScenarios = list.filter((s) => selectedIds.includes(s.id))

    return CANONICAL_METRICS.map((m) => {
      const byScenario: ScenarioValues = {}
      for (const sId of selectedIds) {
        const s = list.find((x) => x.id === sId)
        const name = s?.name || sId
        const value = getScenarioMockValues(name)?.[m.code] ?? null
        byScenario[sId] = value
      }

      const anchorVal = byScenario[anchorId || ""]
      const primaryOther = others[0]
      const otherVal = primaryOther != null ? byScenario[primaryOther] : null
      let varianceAbs: number | null = null
      let variancePct: number | null = null

      if (anchorVal != null && otherVal != null) {
        varianceAbs = otherVal - anchorVal
        variancePct = anchorVal !== 0 ? (varianceAbs / Math.abs(anchorVal)) * 100 : null
      }

      return {
        code: m.code,
        label: m.label,
        isPct: "pct" in m && m.pct,
        isCount: "count" in m && m.count,
        byScenario,
        varianceAbs,
        variancePct,
      }
    })
  }, [list, selectedIds, anchorId])

  // Filtered rows for Metric Table Search
  const filteredRows = useMemo(() => {
    return tableRows.filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [tableRows, searchQuery])

  // Process driver assumptions visually for range tracks
  const assumptionMatrix = useMemo(() => {
    const driverList = [
      { name: "Revenue Growth", unit: "% YoY" },
      { name: "Price Change", unit: "% YoY" },
      { name: "Volume Growth", unit: "% YoY" },
      { name: "Opex Growth", unit: "% YoY" },
      { name: "Tax Rate", unit: "%" },
      { name: "FX Rate (USD/EUR)", unit: "" },
    ]

    const activeScenarios = list.filter((s) => selectedIds.includes(s.id))

    return driverList.map((driver) => {
      const byScenario: Record<string, string> = {}
      const valMap = DEMO_ASSUMPTIONS[driver.name]

      for (const s of activeScenarios) {
        let rawVal: number | undefined
        if (valMap) {
          rawVal = valMap[s.name]
          if (rawVal === undefined) {
            for (const [k, v] of Object.entries(valMap)) {
              if (s.name.toLowerCase().includes(k.toLowerCase().split(" ")[0])) {
                rawVal = v
                break
              }
            }
          }
        }
        let valStr = "—"
        if (rawVal !== undefined) {
          valStr = driver.unit.includes("%")
            ? `${rawVal.toFixed(1)}%`
            : rawVal.toFixed(2)
          if (rawVal < 0 && driver.unit.includes("%")) {
            valStr = `(${Math.abs(rawVal).toFixed(1)}%)`
          }
        }
        byScenario[s.id] = valStr
      }

      return {
        name: driver.name,
        unit: driver.unit || null,
        byScenario,
      }
    })
  }, [list, selectedIds])

  const openWaterfallConfig = () => {
    setTempWaterfallBars([...waterfallBars])
    setIsWaterfallModalOpen(true)
  }

  const saveWaterfallConfig = () => {
    // Dynamic recalculation of the bridge final sum
    const nextBars = [...tempWaterfallBars]
    const budgetVal = nextBars[0].value
    const adjustments = nextBars.slice(1, -1)
    const finalVal = adjustments.reduce((acc, curr) => acc + curr.value, budgetVal)

    nextBars[nextBars.length - 1] = {
      ...nextBars[nextBars.length - 1],
      value: Number(finalVal.toFixed(1)),
      displayValue: `${finalVal.toFixed(1)}M`,
    }

    // Format display values
    const finalFormatted = nextBars.map((bar, idx) => {
      if (bar.type === "total") return bar
      return {
        ...bar,
        displayValue: bar.value >= 0 ? `+${bar.value.toFixed(1)}M` : `(${Math.abs(bar.value).toFixed(1)}M)`,
      }
    })

    setWaterfallBars(finalFormatted)
    setIsWaterfallModalOpen(false)
    toast.success("Waterfall bridge updated successfully")
  }

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col w-full">
      <div className="bg-white border-b border-[#e4e7ec] w-full">
        <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-semibold text-[#101828]">Scenarios</h1>
            <p className="text-[12px] text-[#667085] mt-0.5">SRD §16 · Compare strategic cases before promoting to forecast</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full h-9 px-4 text-xs"
              onClick={() => {
                setSelectedIds(list.map((s) => s.id))
                toast.message(`${list.length} scenarios selected for comparison`)
              }}
            >
              Select All
            </Button>
            <Button variant="gradient-info" className="rounded-full h-9 px-4 text-xs shadow-sm" onClick={() => toast.message("Create scenario", { description: "Opens model builder scenario wizard" })}>
              <Plus className="size-3.5" />
              New Scenario
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 w-full flex-1">
        {!selectedModelId ? (
          <p className="text-sm text-[#667085]">
            Select a model in the global header to load live scenario data. Showing SRD demo scenarios below.
          </p>
        ) : null}
        {(selectedModelId || list.length > 0) && !loading ? (
          <>
            {/* Scenarios Cards list with inheritances */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-[#101828]">Available Planning Scenarios</h3>
                <span className="text-[11px] text-[#667085]">{selectedIds.length} selected · {list.length} total (SRD set)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {list.map((s) => {
                  const on = selectedIds.includes(s.id)
                  const tone = getToneStyle(s.name)
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelected(s.id)}
                      className={cn(
                        "rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]",
                        on ? `${tone.border} ${tone.bg} shadow-sm ring-1 ring-offset-0 ring-[#2563eb]/25` : "border-[#eaecf0] bg-white",
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-[13px] font-bold text-[#101828] truncate">{s.name}</h4>
                          <span
                            className={cn(
                              "text-[8.5px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shrink-0",
                              on ? "bg-white/80" : "bg-[#f2f4f7] text-[#667085]",
                            )}
                            style={{ color: on ? tone.text : undefined }}
                          >
                            {s.scenarioType || "Draft"}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#667085] mt-1.5">
                          Inherits: <span className="font-semibold">{scenarioInherits(s.name)}</span>
                        </p>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center justify-between border-t border-[#f2f4f7] pt-2.5 mt-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => duplicateScenario(s.id)}
                          className="text-[10.5px] font-semibold text-[#2563eb] hover:underline inline-flex items-center gap-0.5"
                        >
                          <Copy className="w-2.5 h-2.5" /> Duplicate
                        </button>
                        {!s.name.includes("Forecast") && (
                          <button
                            type="button"
                            onClick={() => promoteScenario(s.id)}
                            className="text-[10.5px] font-semibold text-[#2563eb] hover:underline inline-flex items-center gap-0.5"
                          >
                            <ArrowUpRight className="w-2.5 h-2.5" /> Promote
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Metric Comparison Table Card */}
            <section className="rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#eaecf0] flex flex-wrap items-center justify-between gap-3 bg-white">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#101828]">Metric Side-by-Side Analysis</h2>
                  <p className="text-[12px] text-[#667085] mt-0.5">Variance compared to anchor scenario: <span className="font-semibold">{list.find(x => x.id === anchorId)?.name || "Anchor"}</span></p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Search Metrics */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98a2b3]" />
                    <input
                      type="text"
                      placeholder="Search metrics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 w-44 rounded-lg border border-[#d0d5dd] pl-8 pr-3 text-xs text-[#101828] placeholder:text-[#98a2b3] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  {/* Anchor Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-[#344054]">
                    <span>Anchor:</span>
                    <select
                      className="h-8 rounded-lg border border-[#d0d5dd] px-2 text-xs font-semibold bg-white cursor-pointer"
                      value={anchorId || ""}
                      onChange={(e) => setAnchorId(e.target.value)}
                    >
                      {list.filter(x => selectedIds.includes(x.id)).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit toggle */}
                  <div className="inline-flex rounded-lg border border-[#d0d5dd] p-0.5 bg-[#f9fafb]">
                    <button
                      type="button"
                      onClick={() => setMetricUnit("%")}
                      className={cn(
                        "px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-colors",
                        metricUnit === "%" ? "bg-white text-[#101828] shadow-sm" : "text-[#667085]",
                      )}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetricUnit("$")}
                      className={cn(
                        "px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-colors",
                        metricUnit === "$" ? "bg-white text-[#101828] shadow-sm" : "text-[#667085]",
                      )}
                    >
                      $
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px] min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-[#475467]">
                      <th className="text-left px-5 py-2 font-semibold w-1/4">Metric</th>
                      {list.filter(s => selectedIds.includes(s.id)).map((s) => (
                        <th key={s.id} className="px-4 py-2 text-right font-semibold whitespace-nowrap">
                          {s.name}
                        </th>
                      ))}
                      <th className="px-4 py-2 text-right font-semibold w-28">Variance $</th>
                      <th className="px-4 py-2 text-right font-semibold w-24">Variance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaecf0]">
                    {filteredRows.map((row) => (
                      <tr key={row.code} className="hover:bg-[#f9fafb]/55 transition-colors">
                        <td className="px-5 py-2 font-medium text-[#101828]">{row.label}</td>
                        {list.filter(s => selectedIds.includes(s.id)).map((s) => {
                          const val = row.byScenario[s.id]
                          const anchorVal = row.byScenario[anchorId || ""]
                          let displayVal = formatMetric(val, { pct: row.isPct, count: row.isCount })

                          if (metricUnit === "%" && s.id !== anchorId && val != null && anchorVal != null && anchorVal !== 0) {
                            if (row.isPct) {
                              const pp = val - anchorVal
                              displayVal = `${pp >= 0 ? "+" : ""}${pp.toFixed(1)} pp`
                            } else {
                              const pct = ((val - anchorVal) / Math.abs(anchorVal)) * 100
                              displayVal = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
                            }
                          }

                          return (
                            <td key={s.id} className="px-4 py-2 text-right tabular-nums text-[#344054]">
                              {displayVal}
                            </td>
                          )
                        })}
                        <td className="px-4 py-2 text-right tabular-nums font-semibold text-[#101828]">
                          {row.varianceAbs == null ? "—" : row.isPct ? `${row.varianceAbs >= 0 ? "+" : ""}${row.varianceAbs.toFixed(1)} pp` : formatMetric(row.varianceAbs, { pct: row.isPct, count: row.isCount })}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold text-[#101828]">
                          {row.variancePct == null ? "—" : `${row.variancePct >= 0 ? "+" : ""}${row.variancePct.toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Waterfall configuration + Assumptions track */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
              {/* Waterfall bridge */}
              <section className="xl:col-span-5 rounded-xl border border-[#eaecf0] bg-white p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#101828]">Waterfall Bridge Variance</h3>
                    <p className="text-[11px] text-[#667085] mt-0.5">Budget 2026 → Upside Case</p>
                  </div>
                  <button
                    type="button"
                    onClick={openWaterfallConfig}
                    className="h-7 inline-flex items-center gap-1 rounded-md border border-[#d0d5dd] px-2.5 text-[11px] font-medium text-[#344054] hover:bg-[#f9fafb]"
                  >
                    <Sliders className="w-3 h-3 text-[#475467]" />
                    Configure
                  </button>
                </div>

                <div className="flex-1 min-h-[190px] flex items-center justify-center">
                  <WaterfallChart bars={waterfallBars} />
                </div>
              </section>

              {/* Assumptions ranges tracks */}
              <section className="xl:col-span-7 rounded-xl border border-[#eaecf0] bg-white p-4 shadow-sm flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-[14px] font-semibold text-[#101828]">Scenario Assumptions Ranges</h3>
                  <p className="text-[11px] text-[#667085] mt-0.5">Visual representation of growth drivers across selected scenarios</p>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse min-w-[500px]">
                    <thead>
                      <tr className="text-left text-[#667085] border-b border-[#eaecf0] bg-white">
                        <th className="py-2 pr-3 font-semibold w-1/4">Driver</th>
                        {list.filter(s => selectedIds.includes(s.id)).map((s) => (
                          <th key={s.id} className="py-2 px-1 font-semibold text-center w-16">
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assumptionMatrix.map((row) => {
                        const numericVals = list
                          .filter(s => selectedIds.includes(s.id))
                          .map((s) => {
                            const raw = row.byScenario[s.id]
                            if (!raw || raw === "—") return null
                            return parseFloat(raw.replace(/[()%\s]/g, "")) * (raw.includes("(") ? -1 : 1)
                          })
                          .filter((v): v is number => v !== null && !isNaN(v))

                        const max = numericVals.length ? Math.max(...numericVals) : 100
                        const min = numericVals.length ? Math.min(...numericVals) : 0
                        const range = Math.max(max - min, 1e-6)

                        return (
                          <tr key={row.name} className="hover:bg-[#f9fafb] transition-colors">
                            <td className="py-2.5 pr-3 font-medium text-[#344054] text-[12px]">
                              {row.name}
                            </td>
                            {list.filter(s => selectedIds.includes(s.id)).map((s) => {
                              const valStr = row.byScenario[s.id] || "—"
                              let pct = 50
                              if (valStr !== "—") {
                                const valNum = parseFloat(valStr.replace(/[()%\s]/g, "")) * (valStr.includes("(") ? -1 : 1)
                                if (!isNaN(valNum)) {
                                  pct = ((valNum - min) / range) * 100
                                  pct = Math.max(0, Math.min(100, pct))
                                }
                              }

                              return (
                                <td key={s.id} className="py-2 px-0 relative w-16">
                                  <div className="text-[11px] font-semibold text-[#101828] text-center mb-1.5 tabular-nums">
                                    {valStr}
                                  </div>
                                  <div className="h-[2px] bg-[#eaecf0] w-full relative">
                                    {valStr !== "—" ? (
                                      <span
                                        className="absolute -translate-y-1/2 w-2 h-2 rounded-full -translate-x-1/2 border border-white"
                                        style={{
                                          left: `${pct}%`,
                                          backgroundColor: getToneStyle(s.name).dot,
                                          top: "1px",
                                        }}
                                      />
                                    ) : null}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Sensitivity matrix — SRD §7.4 */}
            <section className={`${R} border border-[#e4e7ec] bg-white p-4 shadow-sm w-full`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#101828]">Sensitivity Drivers</h3>
                  <p className="text-[11px] text-[#667085] mt-0.5">EBITDA impact at low / base / high assumption bands</p>
                </div>
                <button type="button" onClick={() => toast.message("Sensitivity matrix", { description: "Driver shocks applied to Base Case revenue model" })} className="text-[#98a2b3] hover:text-[#667085]">
                  <Info className="size-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[#e4e7ec] text-left text-xs text-[#667085] bg-[#f9fafb]">
                      <th className="px-4 py-3 font-medium">Driver</th>
                      <th className="px-4 py-3 font-medium text-right">Low</th>
                      <th className="px-4 py-3 font-medium text-right">Base</th>
                      <th className="px-4 py-3 font-medium text-right">High</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSensitivity.map((row) => (
                      <tr
                        key={row.driver}
                        className="border-t border-[#f2f4f7] hover:bg-[#f9fafb] cursor-pointer"
                        onClick={() => toast.message(row.driver, { description: `Low ${row.low} · Base ${row.mid} · High ${row.high}` })}
                      >
                        <td className="px-4 py-3 font-medium text-[#101828]">{row.driver}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#f04438]">{row.low}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.mid}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#12b76a]">{row.high}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : loading ? (
          <div className="flex items-center gap-2 py-12 text-[#64748b]">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading scenarios…
          </div>
        ) : null}
      </div>

      {/* Waterfall Bridge configuration dialog */}
      <Dialog open={isWaterfallModalOpen} onOpenChange={setIsWaterfallModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              Configure Bridge Values (USD M)
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {tempWaterfallBars.map((bar, idx) => {
              const isReadOnly = idx === 0 || idx === tempWaterfallBars.length - 1
              return (
                <div key={bar.label} className="flex items-center justify-between gap-4">
                  <span className="text-[13px] font-semibold text-[#344054] inline-flex items-center gap-1.5">
                    {bar.label}
                    {isReadOnly && (
                      <span className="text-[9px] bg-[#f2f4f7] text-[#667085] px-1.5 py-0.5 rounded-full font-bold uppercase">
                        {idx === 0 ? "Start" : "Result"}
                      </span>
                    )}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isReadOnly}
                    value={bar.value}
                    onChange={(e) => {
                      const nextVal = parseFloat(e.target.value) || 0
                      setTempWaterfallBars((prev) =>
                        prev.map((b, i) => (i === idx ? { ...b, value: nextVal } : b)),
                      )
                    }}
                    className="h-9 w-24 rounded-lg border border-[#d0d5dd] px-3 text-[13px] text-[#101828] text-right focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 disabled:bg-[#f9fafb] disabled:text-[#98a2b3]"
                  />
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setIsWaterfallModalOpen(false)}
              className="h-9 rounded-full border border-[#d0d5dd] px-4 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveWaterfallConfig}
              className="h-9 rounded-full bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Save Parameters
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatMetric(n: number | null | undefined, opts?: { pct?: boolean; count?: boolean }) {
  if (n == null || !Number.isFinite(n)) return "—"
  if (opts?.pct) return `${n.toFixed(1)}%`
  if (opts?.count) return Math.round(n).toLocaleString("en-US")
  return formatMoney(n) || "—"
}

function WaterfallChart({ bars }: { bars: Array<{ label: string; value: number; displayValue: string; type: "total" | "increase" | "decrease" }> }) {
  const scaleMax = 140
  const ticks = [0, 20, 40, 60, 80, 100, 120, 140]

  const margin = { top: 22, bottom: 25, left: 35, right: 10 }
  const w = 480
  const h = 180
  const chartHeight = h - margin.top - margin.bottom
  const barWidth = 38
  const spacing = (w - margin.left - margin.right - bars.length * barWidth) / (bars.length - 1)

  const startValue = bars[0].value
  let current = startValue

  const computedBars = bars.map((bar, i) => {
    const x = margin.left + i * (barWidth + spacing)
    let y = 0
    let height = 0
    let color = ""

    if (bar.type === "total") {
      height = (bar.value / scaleMax) * chartHeight
      y = margin.top + chartHeight - height
      color = "#2563eb"
    } else {
      const startY = current
      const endY = current + bar.value
      current = endY

      const valMax = Math.max(startY, endY)
      const valMin = Math.min(startY, endY)

      y = margin.top + (1 - valMax / scaleMax) * chartHeight
      height = ((valMax - valMin) / scaleMax) * chartHeight
      color = bar.value >= 0 ? "#12b76a" : "#f04438"
    }

    return {
      ...bar,
      x,
      y,
      height,
      color,
    }
  })

  const connectors: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let i = 0; i < computedBars.length - 1; i++) {
    const b1 = computedBars[i]
    const b2 = computedBars[i + 1]
    let y = 0
    if (b2.type === "total") {
      y = b2.y
    } else {
      y = b2.value >= 0 ? b2.y + b2.height : b2.y
    }
    connectors.push({
      x1: b1.x + barWidth,
      y1: y,
      x2: b2.x,
      y2: y,
    })
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {ticks.map((tick) => {
        const y = margin.top + (1 - tick / scaleMax) * chartHeight
        return (
          <g key={tick}>
            <line
              x1={margin.left}
              y1={y}
              x2={w - margin.right}
              y2={y}
              stroke="#eaecf0"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <text
              x={margin.left - 6}
              y={y + 3.5}
              textAnchor="end"
              className="fill-[#667085] text-[9px] font-medium"
            >
              {tick}
            </text>
          </g>
        )
      })}

      <text x={5} y={12} className="fill-[#667085] text-[9px] font-semibold">
        USD M
      </text>

      {connectors.map((c, i) => (
        <line
          key={i}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          stroke="#98a2b3"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      ))}

      {computedBars.map((bar) => {
        const isUp = bar.value >= 0
        const isTotal = bar.type === "total"
        const labelY = isTotal ? bar.y - 5 : isUp ? bar.y - 5 : bar.y + bar.height + 11

        const labelColor = isTotal
          ? "fill-[#101828] font-bold"
          : isUp
            ? "fill-[#079455] font-semibold"
            : "fill-[#d92d20] font-semibold"

        return (
          <g key={bar.label}>
            <rect
              x={bar.x}
              y={bar.y}
              width={barWidth}
              height={bar.height}
              fill={bar.color}
              rx={1.5}
            />
            <text
              x={bar.x + barWidth / 2}
              y={labelY}
              textAnchor="middle"
              className={cn("text-[9px] tabular-nums", labelColor)}
            >
              {bar.displayValue}
            </text>
            <text
              x={bar.x + barWidth / 2}
              y={h - 6}
              textAnchor="middle"
              className="fill-[#667085] text-[8.5px] font-medium"
            >
              {bar.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
