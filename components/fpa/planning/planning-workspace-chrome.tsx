"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Check,
  Copy,
  Download,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FpaScenario, FpaVersion } from "@/lib/api/fpa-api"
import { asNumber, formatMoney } from "@/lib/api/fpa-api"

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
  onCycleChange?: (id: string) => void
  drivers: PlanningDriverRow[]
  canEditDrivers: boolean
  onVersionChange: (id: string) => void
  onScenarioChange: (id: string) => void
  onRefresh: () => void
  onDriverSave: (id: string, value: number) => Promise<void>
  trendPoints?: PlanningTrendPoint[]
  workflowSteps?: PlanningWorkflowStep[]
  viewByLabel?: string
}

const DEMO_CYCLES: PlanningCycleOption[] = [
  { id: "fy2026-budget", name: "FY2026 Budget" },
  { id: "fy2026-q3-rf", name: "FY2026 Q3 Rolling Forecast" },
]

const DEMO_KPIS: PlanningKpi[] = [
  {
    label: "Revenue",
    value: "$128.4M",
    delta: "↑ 8.7% vs Plan",
    deltaTone: "up",
    spark: [98, 102, 105, 108, 112, 115, 118, 120, 122, 124, 126, 128],
    sparkColor: "#2563eb",
  },
  {
    label: "Opex",
    value: "$72.6M",
    delta: "↑ 6.3% vs Plan",
    deltaTone: "up",
    spark: [58, 60, 61, 63, 64, 66, 67, 68, 69, 70, 71, 73],
    sparkColor: "#7c3aed",
  },
  {
    label: "EBITDA",
    value: "$55.8M",
    delta: "↑ 12.4% vs Plan",
    deltaTone: "up",
    spark: [38, 40, 42, 44, 46, 48, 49, 51, 52, 53, 54, 56],
    sparkColor: "#0d9488",
  },
  {
    label: "Cash Runway",
    value: "14.6 Months",
    delta: "↓ 1.1 MoM",
    deltaTone: "down",
    spark: [16.2, 16.0, 15.8, 15.6, 15.4, 15.2, 15.0, 14.9, 14.8, 14.7, 14.65, 14.6],
    sparkColor: "#2563eb",
  },
  {
    label: "Variance to Plan",
    value: "$3.9M",
    delta: "↑ 2.1% of Revenue",
    deltaTone: "up",
    spark: [1.2, 1.5, 1.8, 2.0, 2.4, 2.6, 2.9, 3.1, 3.3, 3.5, 3.7, 3.9],
    sparkColor: "#16a34a",
  },
]

const DEMO_DRIVERS: PlanningDriverRow[] = [
  {
    id: "d1",
    name: "Volume Growth",
    prior: "4.2%",
    value: "6.5%",
    changeLabel: "+2.3 pp",
    changeTone: "up",
  },
  {
    id: "d2",
    name: "Price Change",
    prior: "1.8%",
    value: "2.5%",
    changeLabel: "+0.7 pp",
    changeTone: "up",
  },
  {
    id: "d3",
    name: "Headcount Plan",
    prior: "248",
    value: "272",
    changeLabel: "+24",
    changeTone: "up",
  },
  {
    id: "d4",
    name: "Inflation (US)",
    prior: "3.1%",
    value: "2.4%",
    changeLabel: "−0.7 pp",
    changeTone: "down",
  },
  {
    id: "d5",
    name: "FX Rate (USD/EUR)",
    prior: "1.08",
    value: "1.12",
    changeLabel: "+0.04",
    changeTone: "up",
  },
]

const DEMO_TREND: PlanningTrendPoint[] = [
  { label: "Jan", revenueActual: 9.8, revenuePlan: 9.5, opexActual: 5.4, opexPlan: 5.6 },
  { label: "Feb", revenueActual: 10.1, revenuePlan: 9.8, opexActual: 5.5, opexPlan: 5.7 },
  { label: "Mar", revenueActual: 10.4, revenuePlan: 10.0, opexActual: 5.7, opexPlan: 5.8 },
  { label: "Apr", revenueActual: 10.6, revenuePlan: 10.3, opexActual: 5.8, opexPlan: 5.9 },
  { label: "May", revenueActual: 10.9, revenuePlan: 10.5, opexActual: 5.9, opexPlan: 6.0 },
  { label: "Jun", revenuePlan: 10.8, opexPlan: 6.1 },
  { label: "Jul", revenuePlan: 11.0, opexPlan: 6.2 },
  { label: "Aug", revenuePlan: 11.2, opexPlan: 6.3 },
  { label: "Sep", revenuePlan: 11.4, opexPlan: 6.4 },
  { label: "Oct", revenuePlan: 11.6, opexPlan: 6.5 },
  { label: "Nov", revenuePlan: 11.8, opexPlan: 6.6 },
  { label: "Dec", revenuePlan: 12.0, opexPlan: 6.7 },
]

const DEMO_WORKFLOW: PlanningWorkflowStep[] = [
  { id: "w1", label: "Draft", status: "done", actor: "Sarah Delgado", when: "May 12" },
  { id: "w2", label: "Submitted", status: "done", actor: "Michael Chen", when: "May 12" },
  {
    id: "w3",
    label: "Under Review",
    status: "active",
    actor: "FP&A Team",
    when: "Due May 19",
  },
  {
    id: "w4",
    label: "Approved",
    status: "pending",
    actor: "James Whitaker",
    when: "Due May 26",
  },
]

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
  onCycleChange,
  onVersionChange,
  onScenarioChange,
  onRefresh,
  viewByLabel = "Total Company",
}: Props) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [localCycle, setLocalCycle] = useState(cycleId || DEMO_CYCLES[0].id)

  const cycleOptions = cycles?.length ? cycles : DEMO_CYCLES
  const activeCycle = cycleId || localCycle

  const displayKpis = kpis.length ? enrichKpis(kpis) : DEMO_KPIS

  const compareHref = `/forecasting/scenarios?modelId=${encodeURIComponent(modelId)}${
    versionId ? `&versionId=${encodeURIComponent(versionId)}` : ""
  }${scenarioId ? `&scenarioId=${encodeURIComponent(scenarioId)}` : ""}`

  const scenarioTabs = useMemo(() => {
    if (scenarios.length) return scenarios
    return [
      { id: "demo-budget", name: "Budget 2026" },
      { id: "demo-fq3", name: "Forecast Q3" },
      { id: "demo-best", name: "Best Case" },
      { id: "demo-base", name: "Base Case" },
      { id: "demo-down", name: "Downside" },
    ] as FpaScenario[]
  }, [scenarios])

  const activeScenario = scenarioId || scenarioTabs[0]?.id

  return (
    <div className="space-y-3">
      {/* Version · Cycle · Scenarios · Actions */}
      <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[11px] font-medium text-[#64748b]">
              Model Version
              <Select value={versionId || undefined} onValueChange={onVersionChange}>
                <SelectTrigger className="mt-1 h-9 min-w-[200px] rounded-full border-[#e2e8f0] text-[13px] font-medium text-[#0f172a]">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => {
                    const locked = String(v.status).toUpperCase() === "LOCKED"
                    const published = String(v.status).toUpperCase() === "PUBLISHED"
                    const latest = locked || published || /working/i.test(v.name)
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="inline-flex items-center gap-2">
                          {v.name}
                          {latest ? (
                            <span className="rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-semibold text-[#15803d]">
                              Latest
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </label>

            <label className="text-[11px] font-medium text-[#64748b]">
              Planning Cycle
              <Select
                value={activeCycle}
                onValueChange={(id) => {
                  setLocalCycle(id)
                  onCycleChange?.(id)
                }}
              >
                <SelectTrigger className="mt-1 h-9 min-w-[180px] rounded-full border-[#e2e8f0] text-[13px] font-medium text-[#0f172a]">
                  <SelectValue placeholder="Cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycleOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={compareHref}
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3.5 text-[12px] font-medium text-[#475569] hover:bg-[#f8fafc]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
              Compare
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActionsOpen((o) => !o)}
                className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8] shadow-sm"
              >
                Actions
                <MoreHorizontal className="w-3.5 h-3.5 opacity-80" />
              </button>
              {actionsOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close actions"
                    onClick={() => setActionsOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-md">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc] inline-flex items-center gap-2 text-[#0f172a]"
                      onClick={() => {
                        void navigator.clipboard.writeText(window.location.href)
                        toast.success("Link copied")
                        setActionsOpen(false)
                      }}
                    >
                      <Copy className="w-3.5 h-3.5 text-[#64748b]" /> Copy link
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc] inline-flex items-center gap-2 text-[#0f172a]"
                      onClick={() => {
                        onRefresh()
                        setActionsOpen(false)
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#64748b]" /> Refresh calc
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc] inline-flex items-center gap-2 text-[#0f172a]"
                      onClick={() => {
                        toast.message("Use Export in the grid toolbar for CSV export.")
                        setActionsOpen(false)
                      }}
                    >
                      <Download className="w-3.5 h-3.5 text-[#64748b]" /> Export grid CSV
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#f1f5f9] pt-3">
          {scenarioTabs.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onScenarioChange(s.id)}
              className={cn(
                "h-8 rounded-full px-3.5 text-[12px] font-medium border transition-colors",
                activeScenario === s.id
                  ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm"
                  : "bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f8fafc]",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {displayKpis.map((k) => (
            <KpiCard key={k.label} kpi={k} />
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94a3b8]">
          <span>All values in {currency}</span>
          <div className="inline-flex items-center gap-2">
            <span>
              View by{" "}
              <button
                type="button"
                className="font-medium text-[#475569] hover:text-[#2563eb]"
                onClick={() => toast.message("Entity / department filter — coming with cycles API")}
              >
                {viewByLabel}
              </button>
            </span>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              onClick={onRefresh}
              aria-label="Refresh KPIs"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Bottom row under the planning grid — trend, drivers, workflow. */
export function PlanningWorkspaceInsights({
  drivers,
  canEditDrivers,
  onDriverSave,
  trendPoints = [],
  workflowSteps,
}: Pick<
  Props,
  "drivers" | "canEditDrivers" | "onDriverSave" | "trendPoints" | "workflowSteps"
>) {
  const displayDrivers = drivers.length ? mapDrivers(drivers) : DEMO_DRIVERS
  const displayTrend = trendPoints.length >= 3 ? trendPoints : DEMO_TREND
  const displayWorkflow = workflowSteps?.length ? workflowSteps : DEMO_WORKFLOW

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
      <TrendChartCard points={displayTrend} />
      <DriverAssumptionsCard
        drivers={displayDrivers}
        canEdit={canEditDrivers && drivers.length > 0}
        onSave={onDriverSave}
      />
      <WorkflowStatusCard steps={displayWorkflow} />
    </div>
  )
}

function enrichKpis(kpis: PlanningKpi[]): PlanningKpi[] {
  const colors = ["#2563eb", "#7c3aed", "#0d9488", "#2563eb", "#16a34a"]
  return kpis.map((k, i) => ({
    ...k,
    sparkColor: k.sparkColor || colors[i % colors.length],
    deltaTone: k.deltaTone || (k.delta?.includes("↓") ? "down" : k.delta ? "up" : "neutral"),
  }))
}

function mapDrivers(drivers: PlanningDriverRow[]): PlanningDriverRow[] {
  return drivers.map((d) => {
    if (d.changeLabel) return d
    const cur = asNumber(d.value)
    const prior = d.prior != null ? asNumber(d.prior) : null
    if (prior == null || !Number.isFinite(cur) || !Number.isFinite(prior)) {
      return { ...d, changeLabel: "—", changeTone: "neutral" as const }
    }
    const delta = cur - prior
    const unit = String(d.unit || "")
    const isPct = /%|pp|percent/i.test(unit) || /%/.test(String(d.value))
    const label = isPct
      ? `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} pp`
      : `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    return {
      ...d,
      changeLabel: label,
      changeTone: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
    }
  })
}

function KpiCard({ kpi }: { kpi: PlanningKpi }) {
  const tone =
    kpi.deltaTone === "down"
      ? "text-[#dc2626]"
      : kpi.deltaTone === "up"
        ? "text-[#16a34a]"
        : "text-[#64748b]"

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-3 py-2.5 min-h-[92px] flex flex-col">
      <p className="text-[11px] font-medium text-[#64748b]">{kpi.label}</p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[18px] font-semibold text-[#0f172a] tabular-nums leading-tight truncate">
            {kpi.value}
          </p>
          {kpi.delta ? (
            <p className={cn("text-[11px] font-medium mt-0.5", tone)}>{kpi.delta}</p>
          ) : null}
        </div>
        {kpi.spark && kpi.spark.length > 1 ? (
          <Sparkline values={kpi.spark} color={kpi.sparkColor || "#2563eb"} />
        ) : null}
      </div>
    </div>
  )
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 72
  const h = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1e-6)
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={w} height={h} className="shrink-0 mt-0.5" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

function TrendChartCard({ points }: { points: PlanningTrendPoint[] }) {
  const w = 420
  const h = 180
  const padL = 36
  const padR = 12
  const padT = 16
  const padB = 28
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  const series = points.flatMap((p) =>
    [p.revenueActual, p.revenuePlan, p.opexActual, p.opexPlan].filter(
      (n): n is number => typeof n === "number" && Number.isFinite(n),
    ),
  )
  const yMin = Math.min(...series, 0)
  const yMax = Math.max(...series, 1)
  const ySpan = Math.max(yMax - yMin, 1e-6)

  const toX = (i: number) => padL + (i / Math.max(points.length - 1, 1)) * plotW
  const toY = (v: number) => padT + plotH - ((v - yMin) / ySpan) * plotH

  const line = (key: keyof PlanningTrendPoint, dashed?: boolean) => {
    const coords = points
      .map((p, i) => {
        const v = p[key]
        if (typeof v !== "number") return null
        return `${toX(i)},${toY(v)}`
      })
      .filter(Boolean)
      .join(" ")
    if (!coords) return null
    return (
      <polyline
        fill="none"
        stroke={key.startsWith("revenue") ? "#2563eb" : "#7c3aed"}
        strokeWidth="1.75"
        strokeDasharray={dashed ? "4 3" : undefined}
        strokeLinejoin="round"
        points={coords}
      />
    )
  }

  return (
    <section className="xl:col-span-5 rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm flex flex-col min-h-[260px]">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-[13px] font-semibold text-[#0f172a]">Revenue vs Expense Trend</h3>
        <button
          type="button"
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
          onClick={() => toast.message("Chart editor — coming soon")}
        >
          Edit Chart
        </button>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-[#64748b] mb-1">
        <LegendDot color="#2563eb" label="Revenue Actual" />
        <LegendDot color="#2563eb" label="Revenue Plan" dashed />
        <LegendDot color="#7c3aed" label="Opex Actual" />
        <LegendDot color="#7c3aed" label="Opex Plan" dashed />
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full flex-1 min-h-[160px]" preserveAspectRatio="xMidYMid meet">
        {[0, 0.5, 1].map((t) => {
          const v = yMin + t * ySpan
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={toY(v)}
                x2={w - padR}
                y2={toY(v)}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text x={padL - 4} y={toY(v) + 3} fontSize="8" fill="#94a3b8" textAnchor="end">
                {v.toFixed(0)}
              </text>
            </g>
          )
        })}
        {line("revenuePlan", true)}
        {line("opexPlan", true)}
        {line("revenueActual")}
        {line("opexActual")}
        {points.map((p, i) => (
          <text
            key={p.label}
            x={toX(i)}
            y={h - 8}
            fontSize="8"
            fill="#94a3b8"
            textAnchor="middle"
          >
            {p.label}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#94a3b8] pt-1 border-t border-[#f1f5f9]">
        <span>
          Actuals through <span className="font-medium text-[#64748b]">May</span>
        </span>
        <span>
          Frequency <span className="font-medium text-[#64748b]">Monthly</span>
        </span>
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
      <svg width="16" height="8" aria-hidden>
        <line
          x1="0"
          y1="4"
          x2="16"
          y2="4"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? "3 2" : undefined}
        />
      </svg>
      {label}
    </span>
  )
}

function DriverAssumptionsCard({
  drivers,
  canEdit,
  onSave,
}: {
  drivers: PlanningDriverRow[]
  canEdit: boolean
  onSave: (id: string, value: number) => Promise<void>
}) {
  return (
    <section className="xl:col-span-4 rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm flex flex-col min-h-[260px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-[#0f172a]">Driver Assumptions</h3>
        <Link
          href="/forecasting/drivers"
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          Edit Drivers
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left text-[#94a3b8] border-b border-[#e2e8f0]">
              <th className="py-1.5 pr-2 font-medium">Driver</th>
              <th className="py-1.5 pr-2 font-medium text-right">FY2025 Actual</th>
              <th className="py-1.5 pr-2 font-medium text-right">FY2026 Plan</th>
              <th className="py-1.5 font-medium text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {drivers.slice(0, 8).map((d) => (
              <tr key={d.id} className="border-b border-[#f1f5f9]">
                <td className="py-2 pr-2 font-medium text-[#0f172a]">{d.name}</td>
                <td className="py-2 pr-2 text-right tabular-nums text-[#64748b]">
                  {d.prior != null ? String(d.prior) : "—"}
                </td>
                <td className="py-2 pr-2 text-right">
                  {canEdit ? (
                    <input
                      type="text"
                      className="h-7 w-[4.5rem] ml-auto block rounded-md border border-[#e2e8f0] px-1.5 text-right tabular-nums text-[#0f172a]"
                      defaultValue={String(d.value)}
                      onBlur={(e) => {
                        const n = Number(String(e.target.value).replace(/[^0-9.\-]/g, ""))
                        if (!Number.isFinite(n)) return
                        void onSave(d.id, n)
                      }}
                    />
                  ) : (
                    <span className="tabular-nums text-[#0f172a] font-medium">{String(d.value)}</span>
                  )}
                </td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums font-medium",
                    d.changeTone === "down"
                      ? "text-[#dc2626]"
                      : d.changeTone === "up"
                        ? "text-[#16a34a]"
                        : "text-[#64748b]",
                  )}
                >
                  {d.changeLabel || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function WorkflowStatusCard({ steps }: { steps: PlanningWorkflowStep[] }) {
  return (
    <section className="xl:col-span-3 rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm flex flex-col min-h-[260px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#0f172a]">Workflow Status</h3>
        <Link
          href="/forecasting/workflow"
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View Details
        </Link>
      </div>
      <ol className="flex-1 space-y-0">
        {steps.map((step, i) => {
          const last = i === steps.length - 1
          return (
            <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
              {!last ? (
                <span
                  className="absolute left-[11px] top-6 bottom-0 w-px bg-[#e2e8f0]"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  step.status === "done" && "bg-[#2563eb] text-white",
                  step.status === "active" && "bg-[#7c3aed] text-white",
                  step.status === "pending" && "bg-[#f1f5f9] text-[#94a3b8] border border-[#e2e8f0]",
                )}
              >
                {step.status === "done" ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[12px] font-semibold text-[#0f172a] leading-tight">{step.label}</p>
                <p className="text-[11px] text-[#64748b] mt-0.5 truncate">{step.actor}</p>
                <p className="text-[10px] text-[#94a3b8]">{step.when}</p>
              </div>
            </li>
          )
        })}
      </ol>
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
