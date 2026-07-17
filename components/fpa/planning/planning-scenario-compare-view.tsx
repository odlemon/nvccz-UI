"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Loader2,
  BarChart3,
  Tag,
  FileText,
  Percent,
  Wallet,
  TrendingUp,
  Building,
  Users,
  Columns,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  asNumber,
  formatMoney,
  fpaApi,
  type FpaDriver,
  type FpaDriverBulkUpdateItem,
  type FpaScenario,
  type FpaScenarioCompareAssumption,
  type FpaScenarioCompareSensitivityRow,
  type FpaScenarioCompareWaterfall,
} from "@/lib/api/fpa-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import {
  assumptionCellDriverId,
  assumptionCellValue,
  emptyCompareSkeleton,
  isEnrichedCompareResult,
  isLegacyPairCompareResult,
  mapCompareResultToRows,
  type CompareMetricRow,
} from "@/lib/fpa/scenario-compare"
import type { PlanningKpi } from "@/components/fpa/planning/planning-workspace-chrome"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Canonical metric order for the compare table (SRD / design). */
type MetricRow = CompareMetricRow

type Props = {
  modelId: string
  versionId: string | null
  scenarios: FpaScenario[]
  /** Seed / focus scenario from worksheet chrome */
  scenarioId: string | null
  /** MPC / planning cycle scope for compare when on worksheet. */
  cycleId?: string | null
  currency?: string
  /** Controlled multi-select (header “N selected”). */
  selectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  /** Push remapped KPIs up to the worksheet strip. */
  onKpisChange?: (kpis: PlanningKpi[]) => void
}

function formatMetric(n: number | null | undefined, opts?: { pct?: boolean; count?: boolean }) {
  if (n == null || !Number.isFinite(n)) return "—"
  if (opts?.pct) return `${n.toFixed(1)}%`
  if (opts?.count) return Math.round(n).toLocaleString("en-US")
  return formatMoney(n) || "—"
}

function getMetricIcon(code: string) {
  const c = code.toUpperCase()
  if (c.includes("REVENUE")) return <BarChart3 className="w-4 h-4 text-[#9e77ed] shrink-0" />
  if (c.includes("COGS")) return <Tag className="w-4 h-4 text-[#667085] shrink-0" />
  if (c.includes("GROSS_PROFIT")) return <FileText className="w-4 h-4 text-[#1570ef] shrink-0" />
  if (c.includes("GROSS_MARGIN")) return <Percent className="w-4 h-4 text-[#f79009] shrink-0" />
  if (c.includes("OPEX")) return <Wallet className="w-4 h-4 text-[#7f56d9] shrink-0" />
  if (c.includes("EBITDA_MARGIN")) return <Percent className="w-4 h-4 text-[#667085] shrink-0" />
  if (c.includes("EBITDA")) return <TrendingUp className="w-4 h-4 text-[#f04438] shrink-0" />
  if (c.includes("CAPEX")) return <Building className="w-4 h-4 text-[#1570ef] shrink-0" />
  if (c.includes("HEADCOUNT")) return <Users className="w-4 h-4 text-[#1570ef] shrink-0" />
  return null
}

function getScenarioColor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes("budget")) return "#7c3aed" // Purple
  if (n.includes("forecast")) return "#2563eb" // Dark blue
  if (n.includes("best") || n.includes("upside")) return "#12b76a" // Green
  if (n.includes("base")) return "#3b82f6" // Blue
  if (n.includes("downside")) return "#f04438" // Red
  return "#667085" // Grey
}

export function PlanningScenarioCompareView({
  modelId,
  versionId,
  scenarios,
  scenarioId,
  cycleId,
  currency = "USD",
  selectedIds: controlledIds,
  onSelectedIdsChange,
  onKpisChange,
}: Props) {
  const [internalIds, setInternalIds] = useState<string[]>([])
  const selectedIds = controlledIds ?? internalIds
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [rows, setRows] = useState<MetricRow[]>([])
  const [loading, setLoading] = useState(false)
  /** True when BE still returns legacy left/right pair (not enriched metrics[]). */
  const [compareLegacyPair, setCompareLegacyPair] = useState(false)
  const [metricUnit, setMetricUnit] = useState<"$" | "%">("$")
  const [waterfallMetric, setWaterfallMetric] = useState<"revenue" | "ebitda" | "opex">("revenue")
  const [assumptionDrivers, setAssumptionDrivers] = useState<
    Array<{ scenarioId: string; scenarioName: string; drivers: FpaDriver[] }>
  >([])
  const [apiAssumptions, setApiAssumptions] = useState<FpaScenarioCompareAssumption[]>([])
  const [apiWaterfall, setApiWaterfall] = useState<FpaScenarioCompareWaterfall | null>(null)
  const [apiSensitivity, setApiSensitivity] = useState<FpaScenarioCompareSensitivityRow[]>([])
  const [savingAssumptions, setSavingAssumptions] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editDriverName, setEditDriverName] = useState("")
  const [editScenarioValues, setEditScenarioValues] = useState<Record<string, string>>({})
  const [visibleScenarioIds, setVisibleScenarioIds] = useState<string[]>([])
  const [showVarianceAbs, setShowVarianceAbs] = useState(true)
  const [showVariancePct, setShowVariancePct] = useState(true)
  const [bridgeOpen, setBridgeOpen] = useState(false)
  const [bridgeSourceId, setBridgeSourceId] = useState("")
  const [bridgeTargetId, setBridgeTargetId] = useState("")
  const [bridgeMetric, setBridgeMetric] = useState<"revenue" | "ebitda" | "opex">("revenue")

  // Seed selection when uncontrolled; keep anchor in sync.
  useEffect(() => {
    if (!scenarios.length) {
      if (!controlledIds) setInternalIds([])
      setAnchorId(null)
      return
    }
    if (!controlledIds) {
      setInternalIds((prev) => {
        const valid = prev.filter((id) => scenarios.some((s) => s.id === id))
        if (valid.length >= 2) return valid
        const budget = scenarios.find(
          (s) => /budget/i.test(s.name) || /budget/i.test(s.scenarioType || ""),
        )
        const seed = new Set<string>()
        if (budget) seed.add(budget.id)
        if (scenarioId && scenarios.some((s) => s.id === scenarioId)) seed.add(scenarioId)
        for (const s of scenarios) {
          if (seed.size >= Math.min(5, scenarios.length)) break
          seed.add(s.id)
        }
        return Array.from(seed)
      })
    }
    setAnchorId((prev) => {
      if (scenarioId && scenarios.some((s) => s.id === scenarioId)) return scenarioId
      if (prev && scenarios.some((s) => s.id === prev)) return prev
      const budget = scenarios.find(
        (s) => /budget/i.test(s.name) || /budget/i.test(s.scenarioType || ""),
      )
      return budget?.id || scenarios[0]?.id || null
    })
  }, [scenarios, scenarioId, controlledIds])

  const selectedScenarios = useMemo(
    () => scenarios.filter((s) => selectedIds.includes(s.id)),
    [scenarios, selectedIds],
  )
  const visibleScenarios = useMemo(
    () => selectedScenarios.filter((s) => visibleScenarioIds.includes(s.id)),
    [selectedScenarios, visibleScenarioIds],
  )

  useEffect(() => {
    setVisibleScenarioIds((prev) => {
      const valid = prev.filter((id) => selectedIds.includes(id))
      const anchor = anchorId && selectedIds.includes(anchorId) ? anchorId : selectedIds[0]
      const comparison = selectedIds.find((id) => id !== anchor)
      if (!anchor || !comparison) return selectedIds
      const next = new Set(valid)
      next.add(anchor)
      if (![...next].some((id) => id !== anchor)) next.add(comparison)
      return selectedIds.filter((id) => next.has(id))
    })
    const source = anchorId && selectedIds.includes(anchorId) ? anchorId : selectedIds[0] || ""
    setBridgeSourceId(source)
    setBridgeTargetId((prev) =>
      prev && selectedIds.includes(prev) && prev !== source
        ? prev
        : selectedIds.find((id) => id !== source) || "",
    )
  }, [selectedIds, anchorId])

  const runCompare = useCallback(async () => {
    const selected = scenarios.filter((s) => selectedIds.includes(s.id))
    if (!versionId || !anchorId || selectedIds.length < 2) {
      setRows(emptyCompareSkeleton(selected))
      setApiAssumptions([])
      setApiWaterfall(null)
      setApiSensitivity([])
      setCompareLegacyPair(false)
      return
    }
    const others = selectedIds.filter((id) => id !== anchorId)
    if (!others.length) {
      setRows(emptyCompareSkeleton(selected))
      setCompareLegacyPair(false)
      return
    }

    setLoading(true)
    try {
      const res = await fpaApi.compareScenarios(anchorId, {
        versionId,
        scenarioIds: selectedIds,
        anchorScenarioId: anchorId,
        cycleId: cycleId || undefined,
        includeAssumptions: true,
        includeWaterfall: true,
        includeSensitivity: true,
        waterfallMetric:
          waterfallMetric === "revenue"
            ? "REVENUE"
            : waterfallMetric === "opex"
              ? "OPEX"
              : "EBITDA",
        waterfallFromScenarioId: anchorId,
        waterfallToScenarioId: others[0],
        compareScenarioId: others[0],
      })
      if (!res.success || !res.data) {
        throw new Error(res.message || "Compare failed")
      }
      const data = res.data
      const enriched = isEnrichedCompareResult(data)
      const legacy = isLegacyPairCompareResult(data)
      setCompareLegacyPair(legacy)
      const mapIds = enriched ? selectedIds : legacy ? [anchorId, others[0]] : selectedIds
      setRows(mapCompareResultToRows(data, mapIds, anchorId, others[0]))
      setApiAssumptions(Array.isArray(data.assumptions) ? data.assumptions : [])
      setApiWaterfall(data.waterfall ?? null)
      setApiSensitivity(Array.isArray(data.sensitivity) ? data.sensitivity : [])
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/scenarios/${anchorId}/compare`,
        method: "POST",
        message: errorMessage(err),
        impact: "Scenario compare: trying legacy pair compares",
        response: err,
      })
      try {
        const results = await Promise.all(
          others.map(async (compareId) => {
            const res = await fpaApi.compareScenarios(anchorId, {
              versionId,
              cycleId: cycleId || undefined,
              compareScenarioId: compareId,
              scenarioIds: [anchorId, compareId],
            })
            if (!res.success || !res.data) throw new Error(res.message || "Compare failed")
            return { compareId, data: res.data }
          }),
        )
        let merged = emptyCompareSkeleton(selected)
        for (const { compareId, data } of results) {
          const part = mapCompareResultToRows(data, [anchorId, compareId], anchorId, compareId)
          merged = merged.map((row) => {
            const hit = part.find((p) => p.code === row.code)
            if (!hit) return row
            return {
              ...row,
              byScenario: {
                ...row.byScenario,
                [anchorId]: hit.byScenario[anchorId] ?? row.byScenario[anchorId],
                [compareId]: hit.byScenario[compareId] ?? null,
              },
              varianceAbs: compareId === others[0] ? hit.varianceAbs : row.varianceAbs,
              variancePct: compareId === others[0] ? hit.variancePct : row.variancePct,
            }
          })
        }
        setRows(merged)
        setCompareLegacyPair(true)
        setApiAssumptions([])
        setApiWaterfall(null)
        setApiSensitivity([])
      } catch (err2) {
        logFpaGap({
          category: "broken",
          path: `/v1/fpa/scenarios/${anchorId}/compare`,
          method: "POST",
          message: errorMessage(err2),
          impact: "Scenario compare empty",
          response: err2,
        })
        setRows(emptyCompareSkeleton(selected))
        setCompareLegacyPair(false)
        setApiAssumptions([])
        setApiWaterfall(null)
        setApiSensitivity([])
      }
    } finally {
      setLoading(false)
    }
  }, [versionId, anchorId, selectedIds, scenarios, waterfallMetric, cycleId])

  useEffect(() => {
    void runCompare()
  }, [runCompare])

  const reloadAssumptionDrivers = useCallback(async () => {
    if (!modelId || !selectedIds.length) {
      setAssumptionDrivers([])
      return
    }
    const packs = await Promise.all(
      selectedIds.map(async (id) => {
        const s = scenarios.find((x) => x.id === id)
        const name = s?.name || id
        try {
          const res = await fpaApi.listDrivers({
            modelId,
            versionId: versionId || undefined,
            scenarioId: id,
          })
          return {
            scenarioId: id,
            scenarioName: name,
            drivers: res.success && Array.isArray(res.data) ? res.data : [],
          }
        } catch {
          return { scenarioId: id, scenarioName: name, drivers: [] as FpaDriver[] }
        }
      }),
    )
    setAssumptionDrivers(packs)
  }, [modelId, versionId, selectedIds, scenarios])

  useEffect(() => {
    let cancelled = false
    void reloadAssumptionDrivers().catch(() => {
      if (!cancelled) setAssumptionDrivers([])
    })
    return () => {
      cancelled = true
    }
  }, [reloadAssumptionDrivers])

  const kpis = useMemo((): PlanningKpi[] => {
    const pick = (re: RegExp) => rows.find((r) => re.test(r.code) || re.test(r.label))
    const revenue = pick(/^REVENUE$/)
    const ebitda = pick(/^EBITDA$/)
    const margin = pick(/GROSS_MARGIN/)
    const headcount = pick(/HEADCOUNT/)
    const anchorLabel = scenarios.find((s) => s.id === anchorId)?.name || "anchor"
    const mk = (row: MetricRow | undefined, label: string): PlanningKpi => {
      if (!row || row.varianceAbs == null) {
        return { label, value: "—" }
      }
      const tone =
        (row.varianceAbs >= 0 && row.higherIsFavourable) ||
        (row.varianceAbs < 0 && !row.higherIsFavourable)
          ? "up"
          : "down"
      const primaryOther =
        selectedIds.find((id) => id !== anchorId) || selectedIds[1] || selectedIds[0]
      const display =
        primaryOther != null
          ? formatMetric(row.byScenario[primaryOther], {
              pct: row.isPct,
              count: row.isCount,
            })
          : "—"
      const arrow = row.varianceAbs >= 0 ? "↑" : "↓"
      const delta = row.isPct
        ? `${arrow} ${Math.abs(row.varianceAbs).toFixed(1)}pp vs ${anchorLabel}`
        : row.variancePct != null
          ? `${arrow} ${Math.abs(row.variancePct).toFixed(1)}% vs ${anchorLabel}`
          : `${arrow} ${formatMetric(Math.abs(row.varianceAbs), {
              pct: row.isPct,
              count: row.isCount,
            })} vs ${anchorLabel}`
      return {
        label,
        value: display,
        delta,
        deltaTone: tone,
      }
    }
    return [
      mk(revenue, "Revenue"),
      mk(margin, "Gross Margin"),
      mk(ebitda, "EBITDA"),
      { label: "Cash Runway", value: "—", deltaTone: "neutral" },
      mk(headcount, "Headcount"),
    ]
  }, [rows, selectedIds, anchorId, scenarios])

  useEffect(() => {
    onKpisChange?.(kpis)
  }, [kpis, onKpisChange])

  const assumptionMatrix = useMemo(() => {
    if (apiAssumptions.length) {
      return apiAssumptions.map((a) => {
        const byScenario: Record<string, string> = {}
        const unit = a.unit || "%"
        for (const sId of selectedIds) {
          const raw = assumptionCellValue(a.byScenario?.[sId])
          if (raw == null || !Number.isFinite(raw)) byScenario[sId] = "—"
          else if (String(unit).includes("%")) {
            byScenario[sId] = raw < 0 ? `(${Math.abs(raw).toFixed(1)}%)` : `${raw.toFixed(1)}%`
          } else byScenario[sId] = raw.toFixed(2)
        }
        return { name: a.driverName, code: a.driverCode, unit: unit || null, byScenario }
      })
    }

    const driverNames = new Map<string, { name: string; code: string; unit: string }>()
    for (const pack of assumptionDrivers) {
      for (const d of pack.drivers) {
        const key = d.code || d.name
        if (!driverNames.has(key)) {
          driverNames.set(key, { name: d.name, code: d.code, unit: d.unit || "%" })
        }
      }
    }
    return Array.from(driverNames.values()).map((driver) => {
      const byScenario: Record<string, string> = {}
      for (const sId of selectedIds) {
        const sName = scenarios.find((s) => s.id === sId)?.name || sId
        const pack = assumptionDrivers.find((p) => p.scenarioId === sId)
        const live = pack?.drivers.find(
          (d) =>
            d.code === driver.code || d.name?.toLowerCase() === driver.name.toLowerCase(),
        )
        const raw = live?.value != null ? asNumber(live.value) : null
        if (raw == null || !Number.isFinite(raw)) byScenario[sId] = "—"
        else if (String(driver.unit).includes("%")) {
          byScenario[sId] = raw < 0 ? `(${Math.abs(raw).toFixed(1)}%)` : `${raw.toFixed(1)}%`
        } else byScenario[sId] = raw.toFixed(2)
      }
      return {
        name: driver.name,
        code: driver.code,
        unit: driver.unit || null,
        byScenario,
      }
    })
  }, [apiAssumptions, assumptionDrivers, selectedIds, scenarios])

  const anchorName =
    selectedScenarios.find((s) => s.id === anchorId)?.name || "Anchor scenario"
  const persistableDriverNames = new Set([
    ...apiAssumptions.filter((a) => Boolean(a.driverCode)).map((a) => a.driverName),
    ...assumptionDrivers.flatMap((pack) =>
      pack.drivers.filter((d) => Boolean(d.id || d.code)).map((d) => d.name),
    ),
  ])
  const firstEditableDriver =
    assumptionMatrix.find((row) => persistableDriverNames.has(row.name))?.name || ""

  const openEditDialogForDriver = (driverName: string) => {
    if (!driverName || !persistableDriverNames.has(driverName)) {
      toast.error("This assumption has no persistent driver id or code")
      return
    }
    setEditDriverName(driverName)
    const currentVals: Record<string, string> = {}
    const apiRow = apiAssumptions.find((a) => a.driverName === driverName)
    for (const sId of selectedIds) {
      const sName = scenarios.find((s) => s.id === sId)?.name || sId
      const fromApi = apiRow ? assumptionCellValue(apiRow.byScenario?.[sId]) : null
      const pack = assumptionDrivers.find((p) => p.scenarioId === sId)
      const live = pack?.drivers.find(
        (d) =>
          d.name?.toLowerCase() === driverName.toLowerCase() ||
          d.code === apiRow?.driverCode,
      )
      const raw = fromApi ?? (live?.value != null ? asNumber(live.value) : null)
      currentVals[sName] = raw != null ? String(raw) : ""
    }
    setEditScenarioValues(currentVals)
    setIsEditOpen(true)
  }

  const toggleScenarioColumn = (id: string) => {
    if (id === anchorId) {
      toast.message("The anchor scenario column is required")
      return
    }
    setVisibleScenarioIds((prev) => {
      if (!prev.includes(id)) return selectedIds.filter((candidate) => prev.includes(candidate) || candidate === id)
      const remaining = prev.filter((candidate) => candidate !== id)
      if (!remaining.some((candidate) => candidate !== anchorId)) {
        toast.message("Keep at least one comparison column")
        return prev
      }
      return remaining
    })
  }

  const resetColumns = () => {
    setVisibleScenarioIds(selectedIds)
    setShowVarianceAbs(true)
    setShowVariancePct(true)
  }

  const saveAssumptions = async () => {
    if (!versionId) {
      toast.error("Select a version before saving assumptions")
      return
    }
    setSavingAssumptions(true)
    const updates: FpaDriverBulkUpdateItem[] = []
    for (const [sName, strVal] of Object.entries(editScenarioValues)) {
      const s = scenarios.find((x) => x.name === sName)
      if (!s) continue
      const cleaned = strVal.replace(/[()%\s]/g, "")
      const val = parseFloat(cleaned) * (strVal.includes("(") ? -1 : 1)
      if (Number.isNaN(val)) continue
      const apiRow = apiAssumptions.find((a) => a.driverName === editDriverName)
      const cellId = apiRow ? assumptionCellDriverId(apiRow.byScenario?.[s.id]) : null
      const pack = assumptionDrivers.find((p) => p.scenarioId === s.id)
      const live = pack?.drivers.find(
        (d) =>
          d.name?.toLowerCase() === editDriverName.toLowerCase() ||
          d.code === apiRow?.driverCode,
      )
      const driverId = cellId || live?.id || null
      const driverCode = apiRow?.driverCode || live?.code || null
      if (driverId) {
        updates.push({
          driverId,
          value: val,
          scenarioId: s.id,
          unit: apiRow?.unit || live?.unit || "%",
        })
      } else if (driverCode) {
        updates.push({
          code: driverCode,
          scenarioId: s.id,
          value: val,
          unit: apiRow.unit || "%",
          name: apiRow.driverName,
        })
      }
    }
    if (!updates.length) {
      setSavingAssumptions(false)
      toast.error("No persistable assumption updates")
      return
    }
    try {
      const bulk = await fpaApi.bulkUpdateDrivers(modelId, { versionId, updates })
      const bulkComplete =
        bulk.success &&
        bulk.data != null &&
        Number(bulk.data.updated) >= updates.length
      if (!bulkComplete) {
        for (const u of updates) {
          if (!u.driverId) {
            throw new Error(`Driver ${u.code || editDriverName} has no persistent id`)
          }
          const single = await fpaApi.updateDriver(u.driverId, { value: u.value, unit: u.unit })
          if (!single.success) {
            throw new Error(single.message || `Could not persist ${u.driverId}`)
          }
        }
      }
      await Promise.all([runCompare(), reloadAssumptionDrivers()])
      setIsEditOpen(false)
      toast.success("Assumptions saved")
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${modelId}/drivers/bulk`,
        method: "PUT",
        message: errorMessage(err),
        impact: "Assumption edits not persisted",
        response: err,
      })
      toast.error("Could not save assumptions")
    } finally {
      setSavingAssumptions(false)
    }
  }

  return (
    <div className="space-y-3">
      {compareLegacyPair ? (
        <div className="rounded-xl border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-[12px] text-[#b54708]">
          Compare is on the <strong>legacy pair</strong> API (anchor vs first other only). Multi-column
          metrics, assumptions, waterfall, and sensitivity need the enriched Stage 4 contract — see{" "}
          <code className="text-[11px]">design-refs/fpa-model-planning-stage4-backend-asks.md</code>.
        </div>
      ) : null}
      {/* Metric comparison table */}
      <section className="rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden">
        {/* Header toolbar matches design */}
        <div className="px-5 py-3.5 border-b border-[#eaecf0] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-[16px] font-semibold text-[#101828]">Scenario Comparison</h2>
            <p className="text-[12px] text-[#667085] mt-0.5">
              All values in {currency}
              {selectedIds.length >= 3 ? ` · ${selectedIds.length} scenarios` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Toggle unit group */}
            <div className="inline-flex rounded-full border border-[#d0d5dd] p-0.5 bg-[#f9fafb]">
              <button
                type="button"
                onClick={() => setMetricUnit("%")}
                className={cn(
                  "px-3 py-1 text-[12px] font-medium rounded-full transition-colors",
                  metricUnit === "%"
                    ? "bg-white text-[#101828] shadow-sm"
                    : "text-[#667085] hover:text-[#101828]",
                )}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setMetricUnit("$")}
                className={cn(
                  "px-3 py-1 text-[12px] font-medium rounded-full transition-colors",
                  metricUnit === "$"
                    ? "bg-white text-[#101828] shadow-sm"
                    : "text-[#667085] hover:text-[#101828]",
                )}
              >
                $
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 rounded-full border border-[#d0d5dd] bg-white px-3 text-[12px] font-medium text-[#344054] hover:bg-[#f9fafb]"
                >
                  <Columns className="w-3.5 h-3.5 text-[#475467]" />
                  Columns
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Scenario columns</DropdownMenuLabel>
                {selectedScenarios.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s.id}
                    checked={visibleScenarioIds.includes(s.id)}
                    disabled={s.id === anchorId}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={() => toggleScenarioColumn(s.id)}
                  >
                    {s.name}{s.id === anchorId ? " (anchor)" : ""}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Variance columns</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showVarianceAbs}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) => setShowVarianceAbs(checked === true)}
                >
                  Absolute variance
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showVariancePct}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) => setShowVariancePct(checked === true)}
                >
                  Percentage variance
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={resetColumns}
                  className="w-full rounded-full px-2 py-1.5 text-left text-[12px] font-medium text-[#1570ef] hover:bg-[#f9fafb]"
                >
                  Reset columns
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!versionId ? (
          <p className="p-6 text-[13px] text-[#94a3b8]">Select a model version to compare scenarios.</p>
        ) : selectedIds.length < 2 ? (
          <p className="p-6 text-[13px] text-[#94a3b8]">
            Select at least two scenarios to compare.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px] min-w-[800px]">
              <thead>
                <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-[#475467]">
                  <th
                    rowSpan={2}
                    className="text-left px-5 py-1.5 font-semibold sticky left-0 bg-[#f9fafb] min-w-[200px]"
                  >
                    Metric
                  </th>
                  {visibleScenarios.map((s) => (
                    <th
                      key={s.id}
                      rowSpan={2}
                      className="px-4 py-1.5 text-right font-semibold whitespace-nowrap"
                    >
                      <div>{s.name}</div>
                      {s.name.includes("Budget") ? (
                        <div className="text-[11px] font-normal text-[#667085] mt-0.5">(Plan)</div>
                      ) : s.name.includes("Forecast") ? (
                        <div className="text-[11px] font-normal text-[#667085] mt-0.5">
                          (Current)
                        </div>
                      ) : null}
                    </th>
                  ))}
                  {showVarianceAbs || showVariancePct ? (
                    <th
                      colSpan={Number(showVarianceAbs) + Number(showVariancePct)}
                      className="px-4 py-1 text-center font-semibold border-b border-[#eaecf0]"
                    >
                      Variance to {anchorName}
                    </th>
                  ) : null}
                </tr>
                <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-[#475467]">
                  {showVarianceAbs ? <th className="px-4 py-1 text-right font-semibold w-24">$</th> : null}
                  {showVariancePct ? <th className="px-4 py-1 text-right font-semibold w-20">%</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0]">
                {rows.map((row) => {
                  const favourable =
                    row.varianceAbs == null
                      ? null
                      : (row.varianceAbs >= 0 && row.higherIsFavourable) ||
                        (row.varianceAbs < 0 && !row.higherIsFavourable)
                  return (
                    <tr key={row.code} className="hover:bg-[#f9fafb]/55 transition-colors">
                      <td className="px-5 py-1.5 font-medium text-[#101828] sticky left-0 bg-white flex items-center gap-2.5">
                        {getMetricIcon(row.code)}
                        <span>{row.label}</span>
                      </td>
                      {visibleScenarios.map((s) => {
                        const isCurrentColumn = s.name.includes("Forecast")
                        const val = row.byScenario[s.id]
                        const anchorVal = row.byScenario[anchorId || ""]

                        let displayVal = formatMetric(val, {
                          pct: row.isPct,
                          count: row.isCount,
                        })

                        // Relative % change formatting when % is active
                        if (
                          metricUnit === "%" &&
                          s.id !== anchorId &&
                          val != null &&
                          anchorVal != null &&
                          anchorVal !== 0
                        ) {
                          if (row.isPct) {
                            const ppDiff = val - anchorVal
                            displayVal = `${ppDiff >= 0 ? "+" : ""}${ppDiff.toFixed(1)} pp`
                          } else {
                            const pctChange = ((val - anchorVal) / Math.abs(anchorVal)) * 100
                            displayVal = `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}%`
                          }
                        }

                        return (
                          <td
                            key={s.id}
                            className={cn(
                              "px-4 py-1.5 text-right tabular-nums",
                              isCurrentColumn
                                ? "text-[#1570ef] font-semibold text-[13.5px]"
                                : "text-[#344054]",
                            )}
                          >
                            {displayVal}
                          </td>
                        )
                      })}
                      {/* Variance $ */}
                      {showVarianceAbs ? <td
                        className={cn(
                          "px-4 py-1.5 text-right tabular-nums font-semibold",
                          favourable === true && "text-[#12b76a]",
                          favourable === false && "text-[#f04438]",
                          favourable == null && "text-[#667085]",
                        )}
                      >
                        {row.varianceAbs == null
                          ? "—"
                          : row.isPct
                            ? `${row.varianceAbs >= 0 ? "+" : ""}${row.varianceAbs.toFixed(1)} pp`
                            : formatMetric(row.varianceAbs, {
                                pct: row.isPct,
                                count: row.isCount,
                              })}
                      </td> : null}
                      {/* Variance % */}
                      {showVariancePct ? <td
                        className={cn(
                          "px-4 py-1.5 text-right tabular-nums font-semibold",
                          favourable === true && "text-[#12b76a]",
                          favourable === false && "text-[#f04438]",
                          favourable == null && "text-[#667085]",
                        )}
                      >
                        {row.variancePct != null
                          ? `${row.variancePct >= 0 ? "+" : ""}${row.variancePct.toFixed(1)}%`
                          : "—"}
                      </td> : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Waterfall + Assumptions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
        {/* Waterfall Bridge Section */}
        <section className="xl:col-span-5 rounded-xl border border-[#eaecf0] bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-[#101828]">
              Variance to Plan (Waterfall)
            </h3>
            <p className="text-[11px] text-[#667085] mt-0.5">All values in USD</p>
          </div>

          <div className="flex-1 min-h-[190px] flex items-center justify-center">
            <WaterfallChart metric={waterfallMetric} apiWaterfall={apiWaterfall} />
          </div>

          <div className="mt-3 pt-3 border-t border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#667085]">Bridge by</span>
              <select
                value={waterfallMetric}
                onChange={(e) => setWaterfallMetric(e.target.value as any)}
                className="h-7 rounded-full border border-[#d0d5dd] px-2 text-[11px] font-semibold text-[#344054] bg-white cursor-pointer"
              >
                <option value="revenue">Revenue</option>
                <option value="ebitda">EBITDA</option>
                <option value="opex">Opex</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setBridgeOpen(true)}
              disabled={selectedIds.length < 2}
              className="h-7 rounded-full border border-[#d0d5dd] px-2.5 text-[11px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-50"
            >
              Edit Bridge
            </button>
          </div>
        </section>

        {/* Scenario Assumptions Section */}
        <section className="xl:col-span-7 rounded-xl border border-[#eaecf0] bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#101828]">Scenario Assumptions</h3>
            <button
              type="button"
              onClick={() => openEditDialogForDriver(editDriverName || firstEditableDriver)}
              disabled={!firstEditableDriver}
              className="h-7 inline-flex items-center rounded-full border border-[#d0d5dd] px-2.5 text-[11px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-50"
            >
              Edit Assumptions
            </button>
          </div>

          {!assumptionMatrix.length ? (
            <p className="flex-1 flex items-center justify-center text-[12px] text-[#94a3b8] text-center px-4">
              No drivers returned for the selected scenarios.
            </p>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-left text-[#667085] border-b border-[#eaecf0] bg-white">
                    <th className="py-2 pr-3 font-semibold w-1/4">Driver</th>
                    {selectedScenarios.map((s) => (
                      <th
                        key={s.id}
                        className="py-2 px-1 font-semibold text-center whitespace-nowrap w-16"
                      >
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assumptionMatrix.map((row) => {
                    // Extract min/max values for calculating the dot percentage
                    const numericVals = selectedScenarios
                      .map((s) => {
                        const raw = row.byScenario[s.id];
                        if (!raw || raw === "—") return null;
                        return parseFloat(raw.replace(/[()%\s]/g, "")) * (raw.includes("(") ? -1 : 1);
                      })
                      .filter((v): v is number => v !== null && !isNaN(v))

                    const max = numericVals.length ? Math.max(...numericVals) : 100
                    const min = numericVals.length ? Math.min(...numericVals) : 0
                    const range = Math.max(max - min, 1e-6)

                    return (
                      <tr
                        key={row.name}
                        onClick={() => {
                          if (persistableDriverNames.has(row.name)) openEditDialogForDriver(row.name)
                        }}
                        className={cn(
                          "hover:bg-[#f9fafb] transition-colors",
                          persistableDriverNames.has(row.name) && "cursor-pointer",
                        )}
                        title={
                          persistableDriverNames.has(row.name)
                            ? "Click to edit driver assumptions"
                            : "Read-only: no persistent driver id or code"
                        }
                      >
                        {/* Driver label column */}
                        <td className="py-2 pr-3 font-medium text-[#344054] text-[12px]">
                          <div>{row.name}</div>
                          {row.unit ? (
                            <div className="text-[10px] text-[#667085] font-normal mt-0.5">
                              {row.unit}
                            </div>
                          ) : null}
                        </td>
                        {/* Scenario columns with track ranges */}
                        {selectedScenarios.map((s) => {
                          const valStr = row.byScenario[s.id] || "—"
                          let pct = 50
                          if (valStr !== "—") {
                            const valNum =
                              parseFloat(valStr.replace(/[()%\s]/g, "")) *
                              (valStr.includes("(") ? -1 : 1)
                            if (!isNaN(valNum)) {
                              pct = ((valNum - min) / range) * 100
                              // Clamp percentage
                              pct = Math.max(0, Math.min(100, pct))
                            }
                          }

                          return (
                            <td key={s.id} className="py-2 px-0 relative w-16">
                              {/* Numerical value representation */}
                              <div className="text-[11px] font-semibold text-[#101828] text-center mb-1.5 tabular-nums">
                                {valStr}
                              </div>
                              {/* Horizontal track range */}
                              <div className="h-[2px] bg-[#eaecf0] w-full relative">
                                {valStr !== "—" ? (
                                  <span
                                    className="absolute -translate-y-1/2 w-2 h-2 rounded-full -translate-x-1/2 border border-white"
                                    style={{
                                      left: `${pct}%`,
                                      backgroundColor: getScenarioColor(s.name),
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
          )}
        </section>
      </div>

      {/* Interactive assumptions dialog */}
      <section className="rounded-xl border border-[#eaecf0] bg-white p-4 shadow-sm">
        <h3 className="text-[14px] font-semibold text-[#101828] mb-2">Sensitivity Matrix</h3>
        <SensitivityBoard rows={apiSensitivity} />
      </section>

      <Dialog open={bridgeOpen} onOpenChange={setBridgeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              Configure waterfall bridge
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <label className="block text-[12px] font-medium text-[#344054]">
              Source scenario
              <select
                value={bridgeSourceId}
                onChange={(event) => {
                  const source = event.target.value
                  setBridgeSourceId(source)
                  if (bridgeTargetId === source) {
                    setBridgeTargetId(selectedIds.find((id) => id !== source) || "")
                  }
                }}
                className="mt-1 h-10 w-full rounded-full border border-[#d0d5dd] bg-white px-3 text-[13px]"
              >
                {selectedScenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block text-[12px] font-medium text-[#344054]">
              Target scenario
              <select
                value={bridgeTargetId}
                onChange={(event) => setBridgeTargetId(event.target.value)}
                className="mt-1 h-10 w-full rounded-full border border-[#d0d5dd] bg-white px-3 text-[13px]"
              >
                {selectedScenarios
                  .filter((s) => s.id !== bridgeSourceId)
                  .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block text-[12px] font-medium text-[#344054]">
              Metric
              <select
                value={bridgeMetric}
                onChange={(event) => setBridgeMetric(event.target.value as typeof bridgeMetric)}
                className="mt-1 h-10 w-full rounded-full border border-[#d0d5dd] bg-white px-3 text-[13px]"
              >
                <option value="revenue">Revenue</option>
                <option value="ebitda">EBITDA</option>
                <option value="opex">Opex</option>
              </select>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setBridgeOpen(false)}
              className="h-9 rounded-full border border-[#d0d5dd] px-4 text-[13px] font-semibold text-[#344054]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!bridgeSourceId || !bridgeTargetId || bridgeSourceId === bridgeTargetId}
              onClick={() => {
                const nextIds = [
                  bridgeSourceId,
                  bridgeTargetId,
                  ...selectedIds.filter((id) => id !== bridgeSourceId && id !== bridgeTargetId),
                ]
                setAnchorId(bridgeSourceId)
                setWaterfallMetric(bridgeMetric)
                if (controlledIds) onSelectedIdsChange?.(nextIds)
                else setInternalIds(nextIds)
                setBridgeOpen(false)
              }}
              className="h-9 rounded-full bg-[#2563eb] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Apply bridge
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              Edit Assumptions: {editDriverName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedScenarios.map((s) => {
              const sName = s.name
              return (
                <div key={s.id} className="flex items-center justify-between gap-4">
                  <span className="text-[13px] font-medium text-[#344054] inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getScenarioColor(sName) }}
                    />
                    {sName}
                  </span>
                  <input
                    type="text"
                    value={editScenarioValues[sName] || ""}
                    onChange={(e) =>
                      setEditScenarioValues((prev) => ({
                        ...prev,
                        [sName]: e.target.value,
                      }))
                    }
                    placeholder="e.g. 5.0% or 1.09"
                    className="h-9 w-28 rounded-lg border border-[#d0d5dd] px-3 text-[13px] text-[#101828] text-right focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  />
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="h-9 rounded-full border border-[#d0d5dd] px-4 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveAssumptions()}
              disabled={savingAssumptions}
              className="h-9 rounded-full bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {savingAssumptions ? "Saving…" : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WaterfallChart({
  metric = "revenue",
  apiWaterfall,
}: {
  metric?: "revenue" | "ebitda" | "opex"
  apiWaterfall?: FpaScenarioCompareWaterfall | null
}) {
  void metric
  const fromApi =
    apiWaterfall?.steps?.length
      ? apiWaterfall.steps.map((s, i, arr) => {
          const isEnd = i === 0 || i === arr.length - 1 || s.key === "anchor" || s.key === "result"
          const delta = s.delta != null ? asNumber(s.delta) : null
          const value = s.value != null ? asNumber(s.value) : delta != null ? delta : 0
          const millions = value / 1_000_000
          if (isEnd && s.value != null) {
            return {
              label: s.label,
              value: millions,
              displayValue: `${millions.toFixed(1)}M`,
              type: "total" as const,
            }
          }
          const d = delta ?? value
          const m = d / 1_000_000
          return {
            label: s.label,
            value: m,
            displayValue: m >= 0 ? `+${m.toFixed(1)}M` : `(${Math.abs(m).toFixed(1)}M)`,
            type: (m >= 0 ? "increase" : "decrease") as "increase" | "decrease",
          }
        })
      : null

  if (!fromApi?.length) {
    return (
      <p className="text-[12px] text-[#94a3b8] text-center px-4">
        Waterfall data will appear when the compare API returns a bridge for this selection.
      </p>
    )
  }

  const bars = fromApi
  const scaleMax = Math.max(40, ...bars.map((b) => Math.abs(b.value))) * 1.15
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((scaleMax / 4) * i))

  const margin = { top: 22, bottom: 25, left: 35, right: 10 }
  const w = 480
  const h = 180
  const chartHeight = h - margin.top - margin.bottom
  const barWidth = 38
  const spacing =
    bars.length > 1
      ? (w - margin.left - margin.right - bars.length * barWidth) / (bars.length - 1)
      : 0

  let current = bars[0]?.type === "total" ? bars[0].value : 0
  const computedBars = bars.map((bar, i) => {
    const x = margin.left + i * (barWidth + spacing)
    let y = 0
    let height = 0
    let color = ""
    if (bar.type === "total") {
      height = (Math.abs(bar.value) / scaleMax) * chartHeight
      y = margin.top + chartHeight - height
      color = "#2563eb"
      current = bar.value
    } else {
      const startY = current
      const endY = current + bar.value
      current = endY
      const valMax = Math.max(startY, endY)
      const valMin = Math.min(startY, endY)
      y = margin.top + (1 - valMax / scaleMax) * chartHeight
      height = Math.max(((valMax - valMin) / scaleMax) * chartHeight, 2)
      color = bar.type === "increase" ? "#12b76a" : "#f04438"
    }
    return { ...bar, x, y, height, color }
  })

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
              className="fill-[#667085] text-[9px] font-medium tabular-nums"
            >
              {tick}
            </text>
          </g>
        )
      })}
      <text x={5} y={12} className="fill-[#667085] text-[9px] font-semibold">
        USD M
      </text>
      {computedBars.map((bar) => (
        <g key={bar.label}>
          <rect x={bar.x} y={bar.y} width={barWidth} height={bar.height} fill={bar.color} rx={1.5} />
          <text
            x={bar.x + barWidth / 2}
            y={bar.type === "decrease" ? bar.y + bar.height + 11 : bar.y - 5}
            textAnchor="middle"
            className={cn(
              "text-[9px] tabular-nums",
              bar.type === "total"
                ? "fill-[#101828] font-bold"
                : bar.type === "increase"
                  ? "fill-[#079455] font-semibold"
                  : "fill-[#d92d20] font-semibold",
            )}
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
      ))}
    </svg>
  )
}

function SensitivityBoard({ rows }: { rows: FpaScenarioCompareSensitivityRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-[12px] text-[#94a3b8] px-1 py-2">
        Sensitivity matrix will load when the compare API returns sensitivity rows.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="text-left text-[#667085] border-b border-[#eaecf0]">
            <th className="py-2 pr-3 font-semibold">Driver</th>
            <th className="py-2 px-2 font-semibold text-right">Low</th>
            <th className="py-2 px-2 font-semibold text-right">Base</th>
            <th className="py-2 px-2 font-semibold text-right">High</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.driverCode} className="border-b border-[#f2f4f7]">
              <td className="py-2 pr-3 font-medium text-[#344054]">{r.driverName}</td>
              <td className="py-2 px-2 text-right tabular-nums text-[#f04438]">
                {r.low}
                {r.unit || "%"}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-[#344054]">
                {r.base}
                {r.unit || "%"}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-[#12b76a]">
                {r.high}
                {r.unit || "%"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
