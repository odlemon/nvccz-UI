"use client"

import Link from "next/link"
import { useEffect, useId, useMemo, useState, type ReactNode } from "react"
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Crosshair,
  DollarSign,
  Download,
  GitCompare,
  MoreHorizontal,
  Lock,
  Percent,
  Pencil,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { KpiSparkline } from "@/components/fpa/kpi-sparkline"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { FpaScenario, FpaVersion } from "@/lib/api/fpa-api"
import { formatMoney } from "@/lib/api/fpa-api"

export type PlanningKpi = {
  label: string
  value: string
  delta?: string
  deltaTone?: "up" | "down" | "neutral"
  spark?: number[]
  sparkColor?: string
}

export type PlanningDriverRow = {
  id: string
  name: string
  value: string | number
  unit?: string | null
  prior?: string | number | null
  /** Column header hint from BE, e.g. "FY2025 Actual". */
  priorPeriodLabel?: string | null
  changeLabel?: string
  changeTone?: "up" | "down" | "neutral"
}

export type PlanningTrendPoint = {
  label: string
  revenueActual?: number
  revenuePlan?: number
  opexActual?: number
  opexPlan?: number
}

export type PlanningCycleOption = {
  id: string
  name: string
}

export type PlanningWorkflowStep = {
  id: string
  label: string
  status: "done" | "active" | "pending"
  actor: string
  when: string
}

export type PlanningWorkspaceView = "planning" | "compare"

type Props = {
  versions: FpaVersion[]
  versionId: string | null
  scenarios: FpaScenario[]
  scenarioId: string | null
  modelId: string
  kpis: PlanningKpi[]
  currency?: string
  cycles?: PlanningCycleOption[]
  cycleId?: string | null
  /** Display name when cycle list is empty but a cycle is bound (e.g. from URL). */
  cycleName?: string | null
  /** ISO / period date — last closed actual month (from cycle or grid). */
  actualsCutoff?: string | null
  /** ISO / period date — first forecast month (from cycle). */
  forecastStart?: string | null
  onCycleChange?: (id: string) => void
  drivers: PlanningDriverRow[]
  canEditDrivers: boolean
  onVersionChange: (id: string) => void
  onScenarioChange: (id: string) => void
  onRefresh: () => void
  onExport: () => void | Promise<void>
  onDriverSave: (
    id: string,
    value: number,
  ) => Promise<void | { needsGridReload?: boolean }>
  /** Fired once after a multi-driver Save — parent should refresh grid/KPIs at most once. */
  onDriversSaved?: (needsGridReload: boolean) => Promise<void>
  trendPoints?: PlanningTrendPoint[]
  workflowSteps?: PlanningWorkflowStep[]
  viewByLabel?: string
  viewByOptions?: Array<{ id: string; label: string }>
  onViewByChange?: (id: string) => void
  /** Workspace view mode — Planning Workspace vs Scenario Comparison */
  workspaceView?: PlanningWorkspaceView
  onWorkspaceViewChange?: (view: PlanningWorkspaceView) => void
  /** When true, hide scenario single-select tabs (compare view manages multi-select). */
  hideScenarioTabs?: boolean
  /** When true, hide KPI strip (compare view renders its own). */
  hideKpis?: boolean
  /** Compare mode: selected scenario ids for multi-select. */
  compareScenarioIds?: string[]
  onCompareScenarioIdsChange?: (ids: string[]) => void
}

const KPI_THEMES: Record<
  string,
  { color: string; bg: string; Icon: typeof DollarSign; showSpark: boolean }
> = {
  Revenue: { color: "#3b82f6", bg: "#eff6ff", Icon: DollarSign, showSpark: true },
  Opex: { color: "#8b5cf6", bg: "#f5f3ff", Icon: Wallet, showSpark: true },
  "Gross Margin": { color: "#8b5cf6", bg: "#f5f3ff", Icon: Percent, showSpark: true },
  EBITDA: { color: "#14b8a6", bg: "#f0fdfa", Icon: BarChart3, showSpark: true },
  "Cash Runway": { color: "#06b6d4", bg: "#ecfeff", Icon: Calendar, showSpark: false },
  Headcount: { color: "#7c3aed", bg: "#f5f3ff", Icon: Users, showSpark: false },
  "Variance to Plan": { color: "#6366f1", bg: "#eef2ff", Icon: Crosshair, showSpark: true },
}

const REV_COLOR = "#3b82f6"
const OPEX_COLOR = "#8b5cf6"
const REF_Y_TICKS = [0, 25, 50, 75, 100, 125, 150] as const
/** Shared ~8px radius across the planning worksheet (matches design). */
const R = "rounded-lg"
const PILL_TRIGGER =
  `h-7 min-w-0 w-auto ${R} border-[#d0d5dd] bg-white px-2.5 py-0 text-[11px] font-medium text-[#344054] shadow-none focus-visible:ring-1 focus-visible:ring-[#93c5fd]`

function shortPeriodLabel(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
  }
  if (/^\d{4}-\d{2}/.test(iso)) {
    const [y, m] = iso.slice(0, 7).split("-")
    const dt = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
    return dt.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
  }
  return iso
}

export function PlanningWorkspaceChrome({
  versions,
  versionId,
  scenarios,
  scenarioId,
  modelId,
  kpis,
  currency = "USD",
  cycles,
  cycleId,
  cycleName,
  onCycleChange,
  onVersionChange,
  onScenarioChange,
  onRefresh,
  onExport,
  viewByLabel = "Total Company",
  viewByOptions,
  onViewByChange,
  workspaceView = "planning",
  onWorkspaceViewChange,
  hideScenarioTabs = false,
  hideKpis = false,
  compareScenarioIds,
  onCompareScenarioIdsChange,
  actualsCutoff = null,
  forecastStart = null,
}: Props) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [scenariosMenuOpen, setScenariosMenuOpen] = useState(false)
  const [localCycle, setLocalCycle] = useState(cycleId || "")
  const [localViewBy, setLocalViewBy] = useState(viewByLabel)
  const inCompare = workspaceView === "compare"

  useEffect(() => {
    setLocalCycle(cycleId || "")
  }, [cycleId])

  useEffect(() => {
    setLocalViewBy(viewByLabel)
  }, [viewByLabel])

  const cycleOptions = cycles ?? []
  const activeCycle = cycleId ?? localCycle
  const activeCycleLabel =
    cycleOptions.find((c) => c.id === activeCycle)?.name ||
    (cycleName || "").trim() ||
    null
  const actualsCutoffLabel = shortPeriodLabel(actualsCutoff)
  const forecastStartLabel = shortPeriodLabel(forecastStart)

  // Prefer live KPIs; do not invent demo metrics when API returns empty.
  const displayKpis = enrichKpis(kpis.length ? kpis.slice(0, 5) : [])

  const scenariosHref = `/forecasting/scenarios?modelId=${encodeURIComponent(modelId)}${
    versionId ? `&versionId=${encodeURIComponent(versionId)}` : ""
  }${scenarioId ? `&scenarioId=${encodeURIComponent(scenarioId)}` : ""}`

  const selectedVersion = versions.find((v) => v.id === versionId)
  const versionIsLatest = (() => {
    if (!selectedVersion) return false
    const st = String(selectedVersion.status || "").toUpperCase()
    return st === "LOCKED" || st === "PUBLISHED" || /working/i.test(selectedVersion.name)
  })()

  const scenarioTabs = useMemo(() => {
    return scenarios
  }, [scenarios])

  const selectedCompareIds = useMemo(() => {
    if (!inCompare) return []
    if (compareScenarioIds?.length) {
      return compareScenarioIds.filter((id) => scenarioTabs.some((s) => s.id === id))
    }
    return scenarioTabs.slice(0, 5).map((s) => s.id)
  }, [inCompare, compareScenarioIds, scenarioTabs])

  const toggleCompareScenario = (id: string) => {
    const next = selectedCompareIds.includes(id)
      ? selectedCompareIds.filter((x) => x !== id)
      : [...selectedCompareIds, id]
    if (next.length < 1) {
      toast.message("Keep at least one scenario selected")
      return
    }
    onCompareScenarioIdsChange?.(next)
  }

  const activeScenario = scenarioId || scenarioTabs[0]?.id
  const viewByList =
    viewByOptions?.length
      ? viewByOptions
      : [{ id: "total", label: localViewBy || "Total Company" }]
  const showTabs = !hideScenarioTabs

  return (
    <div className="space-y-3">
      {/* Header toolbar — Model Version · Planning Cycle · Scenarios · Compare · Actions */}
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        <label className="text-[11px] font-medium text-[#667085]">
          Model Version
          <div className="relative mt-1">
            <Select value={versionId || undefined} onValueChange={onVersionChange}>
              <SelectTrigger
                className={cn(
                  "h-10 min-w-[200px] rounded-full border-[#d0d5dd] bg-white pl-3 text-[13px] font-semibold text-[#101828] shadow-none",
                  versionIsLatest ? "pr-20" : "pr-9",
                )}
              >
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className={R}>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {versionIsLatest ? (
              <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 rounded-full bg-[#dcfae6] px-1.5 py-0.5 text-[9px] font-semibold text-[#079455]">
                Latest
              </span>
            ) : null}
          </div>
        </label>

        <div className="hidden sm:block w-px h-10 mb-0.5 bg-[#e4e7ec]" aria-hidden />

        <label className="text-[11px] font-medium text-[#667085]">
          Planning Cycle
          {cycleOptions.length ? (
            <Select
              value={activeCycle || undefined}
              onValueChange={(id) => {
                setLocalCycle(id)
                onCycleChange?.(id)
              }}
            >
              <SelectTrigger
                className="mt-1 h-10 min-w-[180px] rounded-full border-[#d0d5dd] bg-white px-3 text-[13px] font-semibold text-[#101828] shadow-none"
              >
                <SelectValue placeholder="Select cycle" />
              </SelectTrigger>
              <SelectContent className={R}>
                {cycleOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : activeCycleLabel ? (
            <div
              className="mt-1 flex h-10 min-w-[180px] items-center rounded-full border border-[#d0d5dd] bg-white px-3 text-[13px] font-semibold text-[#101828]"
              title={activeCycleLabel}
            >
              <span className="truncate">{activeCycleLabel}</span>
            </div>
          ) : (
            <div
              className="mt-1 flex h-10 min-w-[180px] items-center rounded-full border border-dashed border-[#d0d5dd] px-3 text-[12px] text-[#667085]"
            >
              No cycle selected
            </div>
          )}
        </label>

        {inCompare && scenarioTabs.length ? (
          <label className="text-[11px] font-medium text-[#667085]">
            Scenarios
            <DropdownMenu open={scenariosMenuOpen} onOpenChange={setScenariosMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mt-1 h-10 min-w-[140px] inline-flex items-center justify-between gap-2 rounded-full border border-[#d0d5dd] bg-white px-3 text-[13px] font-semibold text-[#101828]"
                >
                  <span>{selectedCompareIds.length} selected</span>
                  <ChevronDown className="size-4 text-[#667085]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={`w-56 ${R}`}>
                <DropdownMenuLabel>Compare scenarios</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {scenarioTabs.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s.id}
                    checked={selectedCompareIds.includes(s.id)}
                    onCheckedChange={() => toggleCompareScenario(s.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {s.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </label>
        ) : null}

        {showTabs ? (
          <div
            className={cn(
              `inline-flex h-10 items-stretch ${R} border border-[#d0d5dd] bg-white overflow-hidden`,
              "ml-0 sm:ml-1 max-w-full overflow-x-auto",
            )}
          >
            {scenarioTabs.length ? (
              scenarioTabs.slice(0, inCompare ? 5 : undefined).map((s, i) => {
                const active = activeScenario === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onScenarioChange(s.id)}
                    className={cn(
                      "relative h-full px-3.5 text-[13px] font-medium transition-colors whitespace-nowrap",
                      i > 0 && "border-l border-[#e4e7ec]",
                      active
                        ? "bg-[#eff8ff] text-[#1570ef]"
                        : "bg-white text-[#344054] hover:bg-[#f9fafb]",
                    )}
                  >
                    {s.name}
                    {active ? (
                      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#1570ef]" />
                    ) : null}
                  </button>
                )
              })
            ) : (
              <span className="px-3.5 self-center text-[12px] text-[#98a2b3]">
                No scenarios yet
              </span>
            )}
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onWorkspaceViewChange?.(inCompare ? "planning" : "compare")}
            className={cn(
              "h-10 inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold border",
              inCompare
                ? "bg-[#eff8ff] text-[#1570ef] border-[#b2ddff] hover:bg-[#eff8ff]"
                : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]",
            )}
          >
            <GitCompare
              className={cn("size-4", inCompare ? "text-white" : "text-[#1570ef]")}
              strokeWidth={2}
            />
            Compare
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((o) => !o)}
              className="h-10 inline-flex items-stretch rounded-full bg-[#1570ef] text-white hover:bg-[#175cd3] overflow-hidden"
            >
              <span className="inline-flex items-center px-3.5 text-[13px] font-semibold">
                Actions
              </span>
              <span className="w-px self-stretch bg-white/35 my-2" aria-hidden />
              <span className="inline-flex items-center px-2.5">
                <ChevronDown className="size-4" strokeWidth={2.25} />
              </span>
            </button>
            {actionsOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close actions"
                  onClick={() => setActionsOpen(false)}
                />
                <div
                  className={`absolute right-0 top-full z-20 mt-1 w-56 ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}
                >
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] text-[#101828]"
                    onClick={() => {
                      onWorkspaceViewChange?.("planning")
                      setActionsOpen(false)
                    }}
                  >
                    Planning Workspace
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] text-[#101828]"
                    onClick={() => {
                      onWorkspaceViewChange?.("compare")
                      setActionsOpen(false)
                    }}
                  >
                    Scenario Comparison
                  </button>
                  <div className="my-1 border-t border-[#f2f4f7]" />
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] inline-flex items-center gap-2 text-[#101828]"
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href)
                      toast.success("Link copied")
                      setActionsOpen(false)
                    }}
                  >
                    <Copy className="size-3.5 text-[#667085]" /> Copy link
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] inline-flex items-center gap-2 text-[#101828]"
                    onClick={() => {
                      onRefresh()
                      setActionsOpen(false)
                    }}
                  >
                    <RefreshCw className="size-3.5 text-[#667085]" /> Refresh calc
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] inline-flex items-center gap-2 text-[#101828]"
                    onClick={() => {
                      setActionsOpen(false)
                      void onExport()
                    }}
                  >
                    <Download className="size-3.5 text-[#667085]" /> Export grid CSV
                  </button>
                  <Link
                    href={scenariosHref}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] inline-flex items-center gap-2 text-[#101828]"
                    onClick={() => setActionsOpen(false)}
                  >
                    <Sparkles className="size-3.5 text-[#667085]" /> Open full scenarios page
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {(actualsCutoffLabel || forecastStartLabel) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-[12px]">
          <Lock className="size-3.5 text-[#667085] shrink-0" />
          <span className="font-medium text-[#344054]">Actual vs forecast</span>
          {actualsCutoffLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f4f7] px-2.5 py-0.5 text-[11px] font-medium text-[#475467]">
              Actuals through <strong className="text-[#101828]">{actualsCutoffLabel}</strong>
              <span className="text-[#98a2b3]">· read-only</span>
            </span>
          ) : null}
          {forecastStartLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eff8ff] px-2.5 py-0.5 text-[11px] font-medium text-[#175cd3]">
              Forecast from <strong>{forecastStartLabel}</strong>
              <span className="text-[#53b1fd]">· editable inputs</span>
            </span>
          ) : actualsCutoffLabel ? (
            <span className="text-[11px] text-[#667085]">
              Months after cutoff are forecast (editable inputs).
            </span>
          ) : null}
        </div>
      )}

      {/* KPI strip rendered by parent when splitting with the collab rail */}
      {!hideKpis ? (
        <PlanningWorkspaceKpiStrip
          kpis={displayKpis}
          currency={currency}
          viewByLabel={localViewBy}
          viewByOptions={viewByList}
          onViewByChange={(id) => {
            const opt = viewByList.find((o) => o.id === id)
            if (!opt) return
            setLocalViewBy(opt.label)
            onViewByChange?.(id)
          }}
          onRefresh={onRefresh}
        />
      ) : null}
    </div>
  )
}

/** KPI strip — nestable under the planning header or inside the left body column. */
export function PlanningWorkspaceKpiStrip({
  kpis,
  currency = "USD",
  viewByLabel = "Total Company",
  viewByOptions,
  onViewByChange,
  onRefresh,
  showFooter = true,
}: {
  kpis: PlanningKpi[]
  currency?: string
  viewByLabel?: string
  viewByOptions?: Array<{ id: string; label: string }>
  onViewByChange?: (id: string) => void
  onRefresh?: () => void
  /** When false, omit View-by controls (compare mode). */
  showFooter?: boolean
}) {
  const [localViewBy, setLocalViewBy] = useState(viewByLabel)
  useEffect(() => {
    setLocalViewBy(viewByLabel)
  }, [viewByLabel])

  const displayKpis = enrichKpis(kpis.length ? kpis.slice(0, 5) : [])
  const viewByList =
    viewByOptions?.length
      ? viewByOptions
      : [{ id: "total", label: localViewBy || "Total Company" }]

  return (
    <div className="rounded-lg border border-[#e4e7ec] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {displayKpis.length ? (
          displayKpis.map((k) => <KpiCard key={k.label} kpi={k} />)
        ) : (
          <p className="col-span-full py-8 text-center text-[12px] text-[#98a2b3]">
            No KPI data available for this selection.
          </p>
        )}
      </div>
      {showFooter ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#98a2b3]">
          <span>All values in {currency}</span>
          <div className="inline-flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-[#667085]">
              View by
              <Select
                value={viewByList.find((o) => o.label === localViewBy)?.id || viewByList[0]?.id}
                onValueChange={(id) => {
                  const opt = viewByList.find((o) => o.id === id)
                  if (!opt) return
                  setLocalViewBy(opt.label)
                  onViewByChange?.(id)
                }}
              >
                <SelectTrigger
                  className={`h-8 min-w-[130px] w-auto ${R} border-[#d0d5dd] bg-white px-2.5 text-[12px] font-medium text-[#344054] shadow-none`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewByList.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d0d5dd] bg-white text-[#667085] hover:bg-[#f9fafb]"
              onClick={onRefresh}
              aria-label="Refresh KPIs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 text-[11px] text-[#98a2b3]">All values in {currency}</p>
      )}
    </div>
  )
}

/** Bottom row under the planning grid — trend + drivers; workflow as horizontal footer. */
export function PlanningWorkspaceInsights({
  drivers,
  canEditDrivers,
  onDriverSave,
  onDriversSaved,
  trendPoints = [],
  workflowSteps,
}: Pick<
  Props,
  | "drivers"
  | "canEditDrivers"
  | "onDriverSave"
  | "onDriversSaved"
  | "trendPoints"
  | "workflowSteps"
>) {
  const displayDrivers = mapDrivers(drivers)
  const displayTrend = useMemo(() => {
    if (trendPoints.length < 2) return []
    return trendPoints
  }, [trendPoints])
  const displayWorkflow = workflowSteps?.length ? workflowSteps : []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-start">
        <TrendChartCard points={displayTrend} />
        <DriverAssumptionsCard
          drivers={displayDrivers}
          canEdit={canEditDrivers}
          onSave={onDriverSave}
          onSaved={onDriversSaved}
        />
      </div>
      <WorkflowStatusBar steps={displayWorkflow} />
    </div>
  )
}

function enrichKpis(kpis: PlanningKpi[]): PlanningKpi[] {
  return kpis.map((k) => {
    const theme = KPI_THEMES[k.label]
    return {
      ...k,
      spark:
        k.spark && k.spark.length > 1
          ? k.spark
          : theme?.showSpark === false
            ? undefined
            : k.spark,
      sparkColor: k.sparkColor || theme?.color || "#3b82f6",
      deltaTone:
        k.deltaTone ||
        (k.delta?.includes("↓") || k.delta?.includes("▼") ? "down" : k.delta ? "up" : "neutral"),
    }
  })
}

function KpiCard({ kpi }: { kpi: PlanningKpi }) {
  const theme = KPI_THEMES[kpi.label] || {
    color: kpi.sparkColor || "#3b82f6",
    bg: "#f8fafc",
    Icon: DollarSign,
    showSpark: true,
  }
  const Icon = theme.Icon
  const tone =
    kpi.deltaTone === "down"
      ? "text-[#f04438]"
      : kpi.deltaTone === "up"
        ? "text-[#12b76a]"
        : "text-[#667085]"
  const showSpark = theme.showSpark && kpi.spark && kpi.spark.length > 1

  const deltaParts = (() => {
    const raw = String(kpi.delta || "").trim()
    if (!raw) return null
    const down = raw.includes("↓") || kpi.deltaTone === "down"
    const up = raw.includes("↑") || (!down && kpi.deltaTone === "up")
    const text = raw.replace(/^[↑↓]\s*/, "")
    return { up, down, text }
  })()

  return (
    <div className="rounded-lg border border-[#e4e7ec] bg-white px-3.5 pt-3 pb-2.5 min-h-[132px] flex flex-col shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: theme.bg, color: theme.color }}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <p className="text-[12px] font-semibold text-[#475467]">{kpi.label}</p>
      </div>

      <p className="mt-2.5 text-[22px] font-semibold text-[#101828] tabular-nums leading-none tracking-tight">
        {kpi.value}
      </p>

      {deltaParts ? (
        <p className={cn("mt-1.5 text-[12px] font-medium inline-flex items-center gap-0.5", tone)}>
          {deltaParts.up ? <ArrowUp className="size-3.5 shrink-0" strokeWidth={2.5} /> : null}
          {deltaParts.down ? <ArrowDown className="size-3.5 shrink-0" strokeWidth={2.5} /> : null}
          <span>{deltaParts.text}</span>
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] text-[#98a2b3]">—</p>
      )}

      <div className="mt-auto pt-2">
        {showSpark ? (
          <Sparkline values={kpi.spark!} color={theme.color} />
        ) : (
          <div className="h-[24px]" aria-hidden />
        )}
      </div>
    </div>
  )
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  return (
    <KpiSparkline
      values={values}
      color={color}
      variant="area"
      width={120}
      height={24}
      strokeWidth={1.25}
      showDots={false}
    />
  )
}

function parseDriverNumber(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const n = Number(String(raw).replace(/[^0-9.\-]/g, ""))
  return Number.isFinite(n) ? n : null
}

function isPercentDriver(name: string, unit?: string | null, sample?: string | number | null) {
  return (
    /%|pp|percent/i.test(String(unit || "")) ||
    /%/.test(String(sample ?? "")) ||
    /growth|inflation|price\s*change|margin/i.test(name)
  )
}

function lowerIsBetterDriver(name: string) {
  return /inflation|cost|churn|attrition|interest\s*rate|days\s*sales/i.test(name)
}

function computeDriverChange(
  name: string,
  prior: string | number | null | undefined,
  plan: string | number | null | undefined,
  unit?: string | null,
): {
  changeLabel: string
  changeTone: "up" | "down" | "neutral"
  direction: "up" | "down" | "flat"
  magnitude: string
  isPp: boolean
} {
  const a = parseDriverNumber(prior)
  const b = parseDriverNumber(plan)
  if (a == null || b == null) {
    return {
      changeLabel: "—",
      changeTone: "neutral",
      direction: "flat",
      magnitude: "—",
      isPp: false,
    }
  }
  const delta = b - a
  if (Math.abs(delta) < 1e-9) {
    return {
      changeLabel: "—",
      changeTone: "neutral",
      direction: "flat",
      magnitude: "—",
      isPp: false,
    }
  }
  const direction = delta > 0 ? ("up" as const) : ("down" as const)
  const abs = Math.abs(delta)
  const isPp = isPercentDriver(name, unit, prior) || isPercentDriver(name, unit, plan)
  const magnitude = isPp
    ? abs.toFixed(1)
    : Number.isInteger(abs) || Math.abs(abs - Math.round(abs)) < 1e-9
      ? String(Math.round(abs))
      : abs.toFixed(2)
  const arrow = direction === "up" ? "↑" : "↓"
  const changeLabel = isPp ? `${arrow} ${magnitude} pp` : `${arrow} ${magnitude}`
  const favorable = lowerIsBetterDriver(name) ? delta < 0 : delta > 0
  return {
    changeLabel,
    changeTone: favorable ? "up" : "down",
    direction,
    magnitude,
    isPp,
  }
}

function formatDriverDisplay(
  raw: string | number | null | undefined,
  name: string,
  unit?: string | null,
): string {
  if (raw == null || raw === "") return "—"
  const s = String(raw).trim()
  if (!s) return "—"
  if (/%/.test(s)) return s
  const n = parseDriverNumber(s)
  if (n == null) return s
  if (isPercentDriver(name, unit, s) && !/%/.test(s)) {
    return `${Number.isInteger(n) ? n : n.toFixed(1)}%`
  }
  // Avoid float noise like 11.020000000000001
  if (!Number.isInteger(n)) {
    return String(Number(n.toFixed(2)))
  }
  return String(n)
}

function mapDrivers(drivers: PlanningDriverRow[]): PlanningDriverRow[] {
  return drivers.map((d) => {
    const computed = computeDriverChange(d.name, d.prior, d.value, d.unit)
    return {
      ...d,
      changeLabel: d.changeLabel || computed.changeLabel,
      changeTone: d.changeTone || computed.changeTone,
    }
  })
}

function niceTicks(maxVal: number, count = 7): number[] {
  const capped = Math.max(maxVal, 1)
  const rawStep = capped / (count - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const candidates = [1, 2, 2.5, 5, 10].map((n) => n * mag)
  const step = candidates.find((c) => c >= rawStep) || candidates[candidates.length - 1]
  const top = Math.ceil(capped / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return ticks
}

function trendValue(
  p: PlanningTrendPoint,
  metric: "revenue" | "opex",
  prefer: "actual" | "plan" | "any",
): number | undefined {
  if (metric === "revenue") {
    if (prefer === "actual") return p.revenueActual
    if (prefer === "plan") return p.revenuePlan ?? p.revenueActual
    return p.revenueActual ?? p.revenuePlan
  }
  if (prefer === "actual") return p.opexActual
  if (prefer === "plan") return p.opexPlan ?? p.opexActual
  return p.opexActual ?? p.opexPlan
}

function aggregateQuarterly(points: PlanningTrendPoint[]): PlanningTrendPoint[] {
  const groups: PlanningTrendPoint[][] = []
  for (let i = 0; i < points.length; i += 3) {
    groups.push(points.slice(i, i + 3))
  }
  return groups.map((group, qi) => {
    const avg = (pick: (p: PlanningTrendPoint) => number | undefined) => {
      const vals = group.map(pick).filter((n): n is number => typeof n === "number" && Number.isFinite(n))
      if (!vals.length) return undefined
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }
    return {
      label: `Q${qi + 1}`,
      revenueActual: avg((p) => p.revenueActual),
      revenuePlan: avg((p) => p.revenuePlan),
      opexActual: avg((p) => p.opexActual),
      opexPlan: avg((p) => p.opexPlan),
    }
  })
}

function TrendChartCard({ points }: { points: PlanningTrendPoint[] }) {
  const gid = useId().replace(/:/g, "")
  const revFillId = `revAreaFill-${gid}`
  const opexFillId = `opexAreaFill-${gid}`

  const defaultCutoff = useMemo(() => {
    let last = -1
    points.forEach((p, i) => {
      if (p.revenueActual != null || p.opexActual != null) last = i
    })
    if (last >= 0) return points[last].label
    const may = points.find((p) => p.label === "May")
    return may?.label || points[Math.min(4, points.length - 1)]?.label || "May"
  }, [points])

  const [actualsThrough, setActualsThrough] = useState(defaultCutoff)
  const [frequency, setFrequency] = useState<"Monthly" | "Quarterly">("Monthly")
  const [showRevenue, setShowRevenue] = useState(true)
  const [showOpex, setShowOpex] = useState(true)
  const [showArea, setShowArea] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    setActualsThrough(defaultCutoff)
  }, [defaultCutoff])

  const monthPoints = points
  const displayPoints = useMemo(() => {
    if (frequency === "Quarterly") return aggregateQuarterly(monthPoints)
    return monthPoints
  }, [frequency, monthPoints])

  const cutoffIndex = useMemo(() => {
    if (frequency === "Quarterly") {
      const mi = monthPoints.findIndex((p) => p.label === actualsThrough)
      if (mi < 0) return Math.min(1, displayPoints.length - 1)
      return Math.min(Math.floor(mi / 3), displayPoints.length - 1)
    }
    const idx = displayPoints.findIndex((p) => p.label === actualsThrough)
    return idx >= 0 ? idx : Math.min(4, displayPoints.length - 1)
  }, [actualsThrough, displayPoints, frequency, monthPoints])

  const seriesPoints = useMemo(() => {
    return displayPoints.map((p, i) => {
      const isActual = i <= cutoffIndex
      return {
        label: p.label,
        isActual,
        revenue: trendValue(p, "revenue", isActual ? "any" : "plan"),
        opex: trendValue(p, "opex", isActual ? "any" : "plan"),
      }
    })
  }, [displayPoints, cutoffIndex])

  const w = 640
  const h = 200
  const padL = 48
  const padR = 16
  const padT = 12
  const padB = 26
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  const seriesVals = seriesPoints.flatMap((p) => {
    const out: number[] = []
    if (showRevenue && typeof p.revenue === "number") out.push(p.revenue)
    if (showOpex && typeof p.opex === "number") out.push(p.opex)
    return out
  })
  const yMaxData = seriesVals.length ? Math.max(...seriesVals) : 1
  const useRefScale = yMaxData >= 40 && yMaxData <= 160
  const yTicks = useRefScale ? [...REF_Y_TICKS] : niceTicks(yMaxData * 1.08, 7)
  const yMax = yTicks[yTicks.length - 1] || 1

  const toX = (i: number) =>
    padL + (displayPoints.length <= 1 ? plotW / 2 : (i / (displayPoints.length - 1)) * plotW)
  const toY = (v: number) => padT + plotH - (v / yMax) * plotH

  const buildPath = (vals: Array<number | undefined>, from: number, to: number) => {
    const pts: string[] = []
    for (let i = from; i <= to; i++) {
      const v = vals[i]
      if (typeof v !== "number") continue
      pts.push(`${toX(i)},${toY(v)}`)
    }
    return pts.join(" ")
  }

  const areaPath = (vals: Array<number | undefined>) => {
    const coords: Array<{ x: number; y: number }> = []
    vals.forEach((v, i) => {
      if (typeof v === "number") coords.push({ x: toX(i), y: toY(v) })
    })
    if (coords.length < 2) return null
    const first = coords[0]
    const last = coords[coords.length - 1]
    const body = coords.map((c) => `${c.x},${c.y}`).join(" L ")
    return `M ${first.x},${toY(0)} L ${body} L ${last.x},${toY(0)} Z`
  }

  const revVals = seriesPoints.map((p) => p.revenue)
  const opexVals = seriesPoints.map((p) => p.opex)

  const exportCsv = () => {
    const rows = [
      ["Period", "Revenue", "Opex", "Band"].join(","),
      ...seriesPoints.map((p) =>
        [p.label, p.revenue ?? "", p.opex ?? "", p.isActual ? "Actual" : "Plan"].join(","),
      ),
    ]
    void navigator.clipboard.writeText(rows.join("\n"))
    toast.success("Chart data copied to clipboard")
  }

  const resetFilters = () => {
    setActualsThrough(defaultCutoff)
    setFrequency("Monthly")
    setShowRevenue(true)
    setShowOpex(true)
    setShowArea(true)
    toast.message("Chart filters reset")
  }

  if (!points.length) {
    return (
      <section className="rounded-lg border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] flex flex-col h-[300px] max-h-[300px] overflow-hidden">
        <h3 className="text-[14px] font-semibold text-[#101828]">Revenue vs Expense Trend</h3>
        <p className="mt-8 text-[12px] text-[#98a2b3] text-center">
          Trend will appear when the planning grid has period values.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] flex flex-col h-[300px] max-h-[300px] overflow-hidden">
      <h3 className="text-[14px] font-semibold text-[#101828] shrink-0">Revenue vs Expense Trend</h3>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667085] shrink-0">
        <LegendDot color={REV_COLOR} label="Revenue (Actual)" />
        <LegendDot color={REV_COLOR} label="Revenue (Plan)" dashed />
        <LegendDot color={OPEX_COLOR} label="Opex (Actual)" />
        <LegendDot color={OPEX_COLOR} label="Opex (Plan)" dashed />
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[188px] shrink-0 mt-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Revenue versus operating expense trend"
      >
        <defs>
          <linearGradient id={revFillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={REV_COLOR} stopOpacity="0.18" />
            <stop offset="55%" stopColor={REV_COLOR} stopOpacity="0.06" />
            <stop offset="100%" stopColor={REV_COLOR} stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={opexFillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={OPEX_COLOR} stopOpacity="0.16" />
            <stop offset="55%" stopColor={OPEX_COLOR} stopOpacity="0.05" />
            <stop offset="100%" stopColor={OPEX_COLOR} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal grid */}
        {yTicks.map((v) => (
          <g key={`h-${v}`}>
            <line
              x1={padL}
              y1={toY(v)}
              x2={w - padR}
              y2={toY(v)}
              stroke="#eaecf0"
              strokeWidth="1"
            />
            <text x={padL - 8} y={toY(v) + 3.5} fontSize="10" fill="#98a2b3" textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {/* Vertical month guides */}
        {seriesPoints.map((p, i) => (
          <line
            key={`v-${p.label}`}
            x1={toX(i)}
            y1={padT}
            x2={toX(i)}
            y2={padT + plotH}
            stroke="#f2f4f7"
            strokeWidth="1"
          />
        ))}

        <text
          x={14}
          y={padT + plotH / 2}
          fontSize="10"
          fill="#98a2b3"
          textAnchor="middle"
          transform={`rotate(-90 14 ${padT + plotH / 2})`}
        >
          USD (M)
        </text>

        {showArea && showOpex && areaPath(opexVals) ? (
          <path d={areaPath(opexVals)!} fill={`url(#${opexFillId})`} />
        ) : null}
        {showArea && showRevenue && areaPath(revVals) ? (
          <path d={areaPath(revVals)!} fill={`url(#${revFillId})`} />
        ) : null}

        {showOpex ? (
          <>
            <polyline
              fill="none"
              stroke={OPEX_COLOR}
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPath(opexVals, 0, cutoffIndex)}
            />
            {cutoffIndex < displayPoints.length - 1 ? (
              <polyline
                fill="none"
                stroke={OPEX_COLOR}
                strokeWidth="2.25"
                strokeDasharray="5 4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={buildPath(opexVals, cutoffIndex, displayPoints.length - 1)}
              />
            ) : null}
          </>
        ) : null}

        {showRevenue ? (
          <>
            <polyline
              fill="none"
              stroke={REV_COLOR}
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPath(revVals, 0, cutoffIndex)}
            />
            {cutoffIndex < displayPoints.length - 1 ? (
              <polyline
                fill="none"
                stroke={REV_COLOR}
                strokeWidth="2.25"
                strokeDasharray="5 4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={buildPath(revVals, cutoffIndex, displayPoints.length - 1)}
              />
            ) : null}
          </>
        ) : null}

        {seriesPoints.map((p, i) => {
          const markers: ReactNode[] = []
          const addMarker = (val: number | undefined, color: string, key: string) => {
            if (typeof val !== "number") return
            if (p.isActual) {
              markers.push(
                <circle
                  key={key}
                  cx={toX(i)}
                  cy={toY(val)}
                  r="3.75"
                  fill={color}
                  stroke="#fff"
                  strokeWidth="1.25"
                />,
              )
            } else {
              markers.push(
                <rect
                  key={key}
                  x={toX(i) - 3.5}
                  y={toY(val) - 3.5}
                  width="7"
                  height="7"
                  fill={color}
                  stroke="#fff"
                  strokeWidth="1.25"
                  transform={`rotate(45 ${toX(i)} ${toY(val)})`}
                />,
              )
            }
          }
          if (showRevenue) addMarker(p.revenue, REV_COLOR, `r-${i}`)
          if (showOpex) addMarker(p.opex, OPEX_COLOR, `o-${i}`)
          return (
            <g key={p.label}>
              {markers}
              <text x={toX(i)} y={h - 8} fontSize="10" fill="#98a2b3" textAnchor="middle">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2.5 border-t border-[#eaecf0] shrink-0">
        <label className="inline-flex items-center gap-1.5 text-[12px] text-[#667085]">
          Actuals through
          <Select value={actualsThrough} onValueChange={setActualsThrough}>
            <SelectTrigger className={PILL_TRIGGER} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthPoints.map((p) => (
                <SelectItem key={p.label} value={p.label}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="inline-flex items-center gap-1.5 text-[12px] text-[#667085]">
          Frequency
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as "Monthly" | "Quarterly")}
          >
            <SelectTrigger className={PILL_TRIGGER} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <div className="ml-auto inline-flex items-center gap-2">
          <Popover open={editOpen} onOpenChange={setEditOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-7 inline-flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-2 text-[11px] font-medium text-[#1570ef] hover:bg-[#f9fafb]"
              >
                <Pencil className="size-3" />
                Edit Chart
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3 space-y-2">
              <p className="text-[12px] font-semibold text-[#0f172a]">Chart series</p>
              <label className="flex items-center gap-2 text-[12px] text-[#475569]">
                <input
                  type="checkbox"
                  checked={showRevenue}
                  onChange={(e) => setShowRevenue(e.target.checked)}
                  className="rounded border-[#d0d5dd]"
                />
                Show Revenue
              </label>
              <label className="flex items-center gap-2 text-[12px] text-[#475569]">
                <input
                  type="checkbox"
                  checked={showOpex}
                  onChange={(e) => setShowOpex(e.target.checked)}
                  className="rounded border-[#d0d5dd]"
                />
                Show Opex
              </label>
              <label className="flex items-center gap-2 text-[12px] text-[#475569]">
                <input
                  type="checkbox"
                  checked={showArea}
                  onChange={(e) => setShowArea(e.target.checked)}
                  className="rounded border-[#d0d5dd]"
                />
                Area fill
              </label>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More chart actions"
                className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[#d0d5dd] bg-white text-[#667085] hover:bg-[#f8fafc]"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportCsv}>
                <Copy className="size-3.5" />
                Copy CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast.message("Download", {
                    description: "Export chart image from Reports when available.",
                  })
                }
              >
                <Download className="size-3.5" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showRevenue}
                onCheckedChange={(v) => setShowRevenue(v === true)}
              >
                Revenue series
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showOpex}
                onCheckedChange={(v) => setShowOpex(v === true)}
              >
                Opex series
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetFilters}>Reset filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  )
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="20" height="10" aria-hidden>
        <line
          x1="0"
          y1="5"
          x2="20"
          y2="5"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "4 3" : undefined}
        />
        {!dashed ? (
          <circle cx="10" cy="5" r="2.5" fill="#fff" stroke={color} strokeWidth="1.5" />
        ) : (
          <rect
            x="7.5"
            y="2.5"
            width="5"
            height="5"
            fill="#fff"
            stroke={color}
            strokeWidth="1.25"
            transform="rotate(45 10 5)"
          />
        )}
      </svg>
      {label}
    </span>
  )
}

function DriverAssumptionsCard({
  drivers,
  canEdit,
  onSave,
  onSaved,
}: {
  drivers: PlanningDriverRow[]
  canEdit: boolean
  onSave: (
    id: string,
    value: number,
  ) => Promise<void | { needsGridReload?: boolean }>
  onSaved?: (needsGridReload: boolean) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState(drivers)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Don't wipe in-progress edits when parent re-renders with the same drivers.
    if (editing || saving) return
    setRows(drivers)
    setDrafts({})
  }, [drivers, editing, saving])

  const startEdit = () => {
    if (!rows.length) {
      toast.message("No drivers on this model yet", {
        description: "Open the Drivers library to add assumptions, then refresh.",
      })
      return
    }
    if (!canEdit) {
      toast.message("Drivers are read-only for your role")
      return
    }
    const next: Record<string, string> = {}
    for (const d of rows) next[d.id] = String(d.value)
    setDrafts(next)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDrafts({})
    setEditing(false)
  }

  const updateDraft = (id: string, raw: string) => {
    setDrafts((prev) => ({ ...prev, [id]: raw }))
  }

  const displayRows = rows.map((d) => {
    const draft = editing ? drafts[d.id] : undefined
    const planValue = draft != null ? draft : d.value
    const change = computeDriverChange(d.name, d.prior, planValue, d.unit)
    return {
      ...d,
      planValue,
      ...change,
    }
  })

  const priorColLabel =
    rows.find((d) => d.priorPeriodLabel)?.priorPeriodLabel || "Prior actual"
  const planColLabel = "Plan"

  const commitAll = async () => {
    setSaving(true)
    try {
      const updates: PlanningDriverRow[] = []
      let changedCount = 0
      let needsGridReload = false

      for (const d of rows) {
        const raw = drafts[d.id]
        if (raw == null) {
          updates.push(d)
          continue
        }
        const n = parseDriverNumber(raw)
        if (n == null) {
          updates.push(d)
          continue
        }
        const prev = parseDriverNumber(String(d.value))
        const unchanged = prev != null && Math.abs(prev - n) < 1e-9
        const pct =
          isPercentDriver(d.name, d.unit, d.prior) || isPercentDriver(d.name, d.unit, d.value)
        const display = pct ? `${n}%` : String(n)

        if (unchanged) {
          updates.push({
            ...d,
            value: display,
          })
          continue
        }

        const result = await onSave(d.id, n)
        if (result && result.needsGridReload) needsGridReload = true
        changedCount += 1

        const change = computeDriverChange(d.name, d.prior, display, d.unit)
        updates.push({
          ...d,
          value: display,
          changeLabel: change.changeLabel,
          changeTone: change.changeTone,
        })
      }

      setRows(updates)
      setEditing(false)
      setDrafts({})

      if (changedCount > 0 && onSaved) {
        await onSaved(needsGridReload)
      }

      if (changedCount === 0) {
        toast.message("No driver changes to save")
      } else {
        toast.success(changedCount === 1 ? "Driver saved" : `${changedCount} drivers saved`)
      }
    } catch {
      toast.error("Could not save driver changes")
    } finally {
      setSaving(false)
    }
  }

  const cell = "border border-[#e4e7ec] px-2.5 py-1.5"
  const changeColor = (tone: "up" | "down" | "neutral") =>
    tone === "down" ? "text-[#f04438]" : tone === "up" ? "text-[#12b76a]" : "text-[#98a2b3]"

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.05)] flex flex-col h-[300px] max-h-[300px] overflow-hidden">
      <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
        <h3 className="text-[14px] font-semibold text-[#101828]">Driver Assumptions</h3>
        {editing ? (
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="h-7 rounded-full border border-[#d0d5dd] bg-white px-2 text-[11px] font-medium text-[#667085] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void commitAll()}
              disabled={saving}
              className="h-7 rounded-full border border-[#d0d5dd] bg-white px-2 text-[11px] font-medium text-[#1570ef] hover:bg-[#f5faff] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : rows.length > 0 ? (
          <button
            type="button"
            onClick={startEdit}
            disabled={!canEdit}
            className="h-7 inline-flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-2 text-[11px] font-medium text-[#1570ef] hover:bg-[#f9fafb] disabled:opacity-50"
          >
            <Pencil className="size-3 text-[#1570ef]" strokeWidth={2} />
            Edit Drivers
          </button>
        ) : (
          <Link
            href="/forecasting/drivers"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 inline-flex items-center rounded-full border border-[#d0d5dd] bg-white px-2 text-[11px] font-medium text-[#1570ef] hover:bg-[#f9fafb]"
          >
            Add drivers
          </Link>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-[#e4e7ec]">
        {!displayRows.length ? (
          <p className="text-[12px] text-[#98a2b3] py-6 text-center px-2">
            No drivers on this model yet.{" "}
            <Link
              href="/forecasting/drivers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1570ef] hover:underline"
            >
              Open Drivers library
            </Link>
          </p>
        ) : (
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-[#f9fafb] text-[#101828]">
                <th className={cn(cell, "text-left font-semibold bg-[#f9fafb]")}>Driver</th>
                <th
                  className={cn(
                    cell,
                    "text-center font-semibold whitespace-nowrap bg-[#f9fafb]",
                  )}
                >
                  {priorColLabel}
                </th>
                <th
                  className={cn(
                    cell,
                    "text-center font-semibold whitespace-nowrap bg-[#f9fafb]",
                  )}
                >
                  {planColLabel}
                </th>
                <th className={cn(cell, "text-center font-semibold bg-[#f9fafb]")}>Change</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((d) => (
                <tr key={d.id} className="bg-white hover:bg-[#f9fafb] transition-colors">
                  <td className={cn(cell, "font-medium text-[#101828]")}>{d.name}</td>
                  <td className={cn(cell, "text-center tabular-nums text-[#475467]")}>
                    {formatDriverDisplay(d.prior, d.name, d.unit)}
                  </td>
                  <td
                    className={cn(cell, "text-center")}
                    onDoubleClick={() => {
                      if (!editing && canEdit) startEdit()
                    }}
                    title={canEdit && !editing ? "Double-click to edit plan values" : undefined}
                  >
                    {editing ? (
                      <input
                        type="text"
                        value={drafts[d.id] ?? String(d.value)}
                        onChange={(e) => updateDraft(d.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitAll()
                          if (e.key === "Escape") cancelEdit()
                        }}
                        className="h-7 w-[5.25rem] mx-auto block rounded border border-[#84caff] bg-white px-1.5 text-center tabular-nums text-[#101828] outline-none focus:ring-2 focus:ring-[#b2ddff]"
                        aria-label={`${d.name} plan value`}
                      />
                    ) : (
                      <span className="tabular-nums text-[#101828]">
                        {formatDriverDisplay(d.planValue, d.name, d.unit)}
                      </span>
                    )}
                  </td>
                  <td className={cn(cell, "text-center")}>
                    {d.direction === "flat" ? (
                      <span className="text-[#98a2b3]">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center gap-1 tabular-nums font-semibold",
                          changeColor(d.changeTone),
                        )}
                      >
                        {d.direction === "up" ? (
                          <ArrowUp className="size-3.5 shrink-0" strokeWidth={2.5} />
                        ) : (
                          <ArrowDown className="size-3.5 shrink-0" strokeWidth={2.5} />
                        )}
                        <span>
                          {d.magnitude}
                          {d.isPp ? " pp" : ""}
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-2 shrink-0 text-[11px] text-[#98a2b3]">pp = percentage points</p>
    </section>
  )
}

function workflowConnectorClass(
  from: PlanningWorkflowStep["status"],
  to: PlanningWorkflowStep["status"],
) {
  if (from === "done" && to === "done") return "bg-[#2e90fa]"
  if (from === "done" && to === "active") return "bg-gradient-to-r from-[#2e90fa] to-[#7c3aed]"
  return "bg-[#e4e7ec]"
}

function workflowStepTitleClass(status: PlanningWorkflowStep["status"]) {
  if (status === "active") return "text-[#7c3aed]"
  if (status === "done") return "text-[#101828]"
  return "text-[#667085]"
}

function workflowStatusBadge(status: PlanningWorkflowStep["status"]) {
  if (status === "done")
    return {
      label: "Completed",
      className: "bg-[#eff8ff] text-[#175cd3] border-[#b2ddff]",
    }
  if (status === "active")
    return {
      label: "In progress",
      className: "bg-[#f4f3ff] text-[#5925dc] border-[#d9d6fe]",
    }
  return {
    label: "Pending",
    className: "bg-[#f9fafb] text-[#667085] border-[#e4e7ec]",
  }
}

function WorkflowStatusBar({ steps }: { steps: PlanningWorkflowStep[] }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const doneCount = steps.filter((s) => s.status === "done").length
  const activeStep = steps.find((s) => s.status === "active")

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-[14px] font-semibold text-[#101828]">Workflow Status</h3>
        {steps.length ? (
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="h-8 inline-flex items-center rounded-full border border-[#d0d5dd] bg-white px-2.5 text-[12px] font-medium text-[#1570ef] hover:bg-[#f9fafb]"
          >
            View Workflow Details
          </button>
        ) : null}
      </div>

      {!steps.length ? (
        <div className="flex flex-wrap items-center justify-center gap-3 py-4 text-center">
          <p className="text-[12px] text-[#98a2b3]">
            No planning cycle selected. Open a cycle from Model Planning to track Draft → Approved.
          </p>
          <Link
            href="/forecasting/models"
            className="h-8 inline-flex items-center rounded-full bg-[#1570ef] px-4 text-[12px] font-medium text-white hover:bg-[#175cd3]"
          >
            Open Model Planning
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
          {steps.map((step, i) => {
            const last = i === steps.length - 1
            const next = steps[i + 1]
            return (
              <li key={step.id} className="relative flex sm:flex-1 gap-3 sm:flex-col sm:items-start">
                {!last && next ? (
                  <span
                    className={cn(
                      "hidden sm:block absolute top-[13px] left-[28px] right-0 h-[2px]",
                      workflowConnectorClass(step.status, next.status),
                    )}
                    aria-hidden
                  />
                ) : null}

                <span
                  className={cn(
                    "relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                    step.status === "done" && "bg-[#2e90fa] text-white",
                    step.status === "active" && "bg-[#7c3aed] text-white",
                    step.status === "pending" &&
                      "bg-white text-[#667085] border-2 border-[#d0d5dd]",
                  )}
                >
                  {step.status === "done" ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </span>

                <div className="min-w-0 sm:mt-2 sm:pr-4">
                  <p
                    className={cn(
                      "text-[13px] font-semibold leading-tight",
                      workflowStepTitleClass(step.status),
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[12px] text-[#667085] mt-1 leading-snug">{step.actor}</p>
                  {step.when ? (
                    <p className="text-[12px] text-[#98a2b3] mt-0.5 leading-snug">{step.when}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#e4e7ec]">
            <DialogTitle className="text-[16px] text-[#101828]">Workflow details</DialogTitle>
            <DialogDescription className="text-[13px] text-[#667085]">
              {activeStep
                ? `Currently at ${activeStep.label} · ${doneCount} of ${steps.length} stages complete`
                : doneCount === steps.length
                  ? "All stages complete"
                  : `${doneCount} of ${steps.length} stages complete`}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 max-h-[60vh] overflow-auto space-y-3">
            {steps.map((step, i) => {
              const badge = workflowStatusBadge(step.status)
              return (
                <div
                  key={step.id}
                  className="rounded-lg border border-[#e4e7ec] bg-white p-3.5 flex gap-3"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                      step.status === "done" && "bg-[#2e90fa] text-white",
                      step.status === "active" && "bg-[#7c3aed] text-white",
                      step.status === "pending" &&
                        "bg-white text-[#667085] border-2 border-[#d0d5dd]",
                    )}
                  >
                    {step.status === "done" ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "text-[13px] font-semibold",
                          workflowStepTitleClass(step.status),
                        )}
                      >
                        {step.label}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                      <div>
                        <dt className="text-[#98a2b3]">Owner / team</dt>
                        <dd className="text-[#344054] font-medium">{step.actor || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[#98a2b3]">Date</dt>
                        <dd className="text-[#344054] font-medium">{step.when || "—"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="px-5 py-3 border-t border-[#e4e7ec] bg-[#f9fafb] sm:justify-between gap-2">
            <Link
              href="/forecasting/workflow"
              className="h-9 inline-flex items-center justify-center rounded-full border border-[#d0d5dd] bg-white px-3 text-[12px] font-medium text-[#344054] hover:bg-white"
              onClick={() => setDetailsOpen(false)}
            >
              Open workflow board
            </Link>
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="h-9 inline-flex items-center justify-center rounded-full bg-[#1570ef] px-3 text-[12px] font-medium text-white hover:bg-[#175cd3]"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function formatCashRunway(months: number | null | undefined): string {
  if (months == null || Number.isNaN(months)) return "—"
  if (months <= 0) return "Cash Generative"
  return `${months.toFixed(1)} Months`
}

/** Keep formatMoney available for callers that previously imported from chrome. */
export { formatMoney }
