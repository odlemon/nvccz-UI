"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Coins,
  Columns3,
  Download,
  Handshake,
  Info,
  LayoutDashboard,
  MoreHorizontal,
  Phone,
  PieChart as PieChartIcon,
  Plane,
  Plus,
  Shield,
  Target,
  Users,
} from "lucide-react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ACTIVITY_BY_FILTER,
  CAPITAL_BY_FILTER,
  KPIS_BY_FILTER,
  STAGES_BY_FILTER,
  TOP_OPPORTUNITIES,
  TOTAL_PIPELINE_BY_FILTER,
  UPCOMING_BY_FILTER,
  type ActivityItem,
  type PipelineFilter,
  type PipelineStage,
  type UpcomingItem,
} from "./pipeline-mock-data"
import { FundraisingPipelineBoard } from "./fundraising-pipeline-board"

type PipelineViewMode = "overview" | "board"
const CARD = "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const FILTERS: { id: PipelineFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vc", label: "VC Fund" },
  { id: "pe", label: "PE Fund" },
  { id: "am", label: "Asset Management" },
]

const STAGE_TONE: Record<string, string> = {
  blue: "bg-[#3b82f6] text-white",
  navy: "bg-[#1e3a8a] text-white",
  sky: "bg-[#bae6fd] text-[#0c4a6e]",
  green: "bg-[#22c55e] text-white",
  vivid: "bg-[#2563eb] text-white",
  purple: "bg-[#8b5cf6] text-white",
}

function probabilityColor(value: number) {
  if (value >= 70) return "#16a34a"
  if (value >= 55) return "#2563eb"
  if (value >= 45) return "#0284c7"
  if (value >= 35) return "#3b82f6"
  return "#7c3aed"
}

const AVATAR_TONES = [
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#ede9fe] text-[#6d28d9]",
  "bg-[#ffedd5] text-[#c2410c]",
  "bg-[#e0e7ff] text-[#4338ca]",
  "bg-[#fce7f3] text-[#be185d]",
]

/** Solid icon tiles matching the Upcoming Meetings design. */
const MEETING_ICON_TILE: Record<string, string> = {
  purple: "bg-[#7c3aed] text-white",
  green: "bg-[#16a34a] text-white",
  indigo: "bg-[#6366f1] text-white",
  blue: "bg-[#2563eb] text-white",
  amber: "bg-[#d97706] text-white",
  sky: "bg-[#0284c7] text-white",
}

const KPI_ICONS = {
  target: Target,
  users: Users,
  shield: Shield,
  handshake: Handshake,
  coins: Coins,
  pie: PieChartIcon,
}

const MEETING_ICONS = {
  meeting: CalendarDays,
  task: CheckSquare,
  people: Users,
  travel: Plane,
  call: Phone,
  prep: CheckCircle2,
}

function ProbText({ value }: { value: number }) {
  return (
    <span className="text-sm font-semibold tabular-nums" style={{ color: probabilityColor(value) }}>
      {value}%
    </span>
  )
}

function MeetingRow({ item, dense = false }: { item: UpcomingItem; dense?: boolean }) {
  const Icon = MEETING_ICONS[item.kind] || ClipboardList
  return (
    <div className={cn("flex items-center gap-3", dense ? "py-3" : "py-3.5")}>
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          MEETING_ICON_TILE[item.tone],
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#0f172a] truncate leading-snug">{item.title}</p>
        <p className="text-xs text-[#94a3b8] truncate mt-0.5">{item.subtitle}</p>
      </div>
      <div className="text-right shrink-0 pl-2">
        <p className="text-xs text-[#94a3b8] leading-tight">{item.date}</p>
        <p className="text-xs font-medium text-[#475569] mt-0.5 leading-tight">{item.time}</p>
      </div>
    </div>
  )
}

const ACTIVITY_DOT: Record<ActivityItem["tone"], string> = {
  purple: "bg-[#8b5cf6]",
  green: "bg-[#22c55e]",
  blue: "bg-[#3b82f6]",
  sky: "bg-[#0ea5e9]",
  amber: "bg-[#f59e0b]",
}

function ActivityRow({
  item,
  showDetail = false,
}: {
  item: ActivityItem
  showDetail?: boolean
}) {
  return (
    <div className="relative flex gap-3">
      <span
        className={cn(
          "relative z-10 mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white shrink-0",
          ACTIVITY_DOT[item.tone],
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[#0f172a] leading-snug">
          {item.parts.map((part, i) =>
            part.bold ? (
              <span key={i} className="font-semibold">
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
        <div className="mt-1.5 flex items-baseline justify-between gap-3 text-[11px] text-[#94a3b8]">
          <span className="truncate">{item.actor}</span>
          <span className="shrink-0 tabular-nums whitespace-nowrap">{item.when}</span>
        </div>
        {showDetail && item.detail && (
          <p className="mt-1.5 text-[11px] text-[#64748b] leading-relaxed">{item.detail}</p>
        )}
      </div>
    </div>
  )
}

function ActivityTimeline({
  items,
  showDetail = false,
}: {
  items: ActivityItem[]
  showDetail?: boolean
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#94a3b8] py-6 text-center">No recent activity.</p>
  }

  return (
    <ol className="relative space-y-5">
      {items.length > 1 && (
        <span
          aria-hidden
          className="absolute left-[5px] top-[11px] bottom-[11px] w-px bg-[#e2e8f0]"
        />
      )}
      {items.map((item) => (
        <li key={item.id}>
          <ActivityRow item={item} showDetail={showDetail} />
        </li>
      ))}
    </ol>
  )
}


/** Centered trapezoid funnel matching the design (even taper, labels in-band). */
function PipelineFunnel({ stages }: { stages: PipelineStage[] }) {
  const n = stages.length
  const rowH = 38
  const gap = 5
  const viewW = 480
  const labelW = 126
  const pctW = 44
  const funnelLeft = labelW
  const funnelRight = viewW - pctW
  const funnelW = funnelRight - funnelLeft
  const viewH = n * rowH + (n - 1) * gap

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-auto" role="img" aria-label="Pipeline by stage funnel">
      {stages.map((stage, i) => {
        const topRatio = 1 - i * (0.55 / Math.max(n - 1, 1))
        const bottomRatio = 1 - (i + 1) * (0.55 / Math.max(n - 1, 1))
        const topW = funnelW * topRatio
        const bottomW = funnelW * Math.max(0.35, bottomRatio)
        const y = i * (rowH + gap)
        const topX = funnelLeft + (funnelW - topW) / 2
        const bottomX = funnelLeft + (funnelW - bottomW) / 2
        const midY = y + rowH / 2 + 1
        const midX = funnelLeft + funnelW / 2
        const path = [
          `M ${topX} ${y}`,
          `L ${topX + topW} ${y}`,
          `L ${bottomX + bottomW} ${y + rowH}`,
          `L ${bottomX} ${y + rowH}`,
          "Z",
        ].join(" ")

        return (
          <g key={stage.name}>
            <text
              x={labelW - 10}
              y={midY}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize="11"
            >
              {stage.name}
            </text>
            <path d={path} fill={stage.color} />
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="600"
            >
              {`${stage.count}   ${stage.amount}`}
            </text>
            <text
              x={viewW - 2}
              y={midY}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize="11"
              fontWeight="500"
            >
              {stage.pct}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ChartEndLabel({
  x,
  y,
  value,
  color,
  dy = -8,
}: {
  x?: number
  y?: number
  value: string
  color: string
  dy?: number
}) {
  if (x == null || y == null) return null
  return (
    <text
      x={x + 10}
      y={y + dy}
      fill={color}
      fontSize="11"
      fontWeight="600"
      dominantBaseline="middle"
    >
      {value}
    </text>
  )
}

function yTicksFor(max: number) {
  if (max <= 25) return [0, 5, 10, 15, 20, 25]
  if (max <= 60) return [0, 15, 30, 45, 60]
  if (max <= 120) return [0, 30, 60, 90, 120]
  const step = Math.ceil(max / 4 / 5) * 5
  return [0, step, step * 2, step * 3, step * 4]
}

export function FundraisingPipeline() {
  const [viewMode, setViewMode] = useState<PipelineViewMode>("overview")
  const [filter, setFilter] = useState<PipelineFilter>("all")
  const [chartMode, setChartMode] = useState<"cumulative" | "monthly">("cumulative")
  const [meetingsOpen, setMeetingsOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [oppsOpen, setOppsOpen] = useState(false)

  const kpis = KPIS_BY_FILTER[filter]
  const stages = STAGES_BY_FILTER[filter]
  const totalPipeline = TOTAL_PIPELINE_BY_FILTER[filter]
  const meetings = UPCOMING_BY_FILTER[filter]
  const activity = ACTIVITY_BY_FILTER[filter]

  const capitalRaw = CAPITAL_BY_FILTER[filter]
  const capitalSeries = useMemo(() => {
    if (chartMode === "cumulative") return capitalRaw
    return capitalRaw.map((row, i) => {
      const prev = capitalRaw[i - 1]
      return {
        ...row,
        committed: i === 0 ? row.committed : Math.max(0, +(row.committed - (prev?.committed ?? 0)).toFixed(1)),
        funded: i === 0 ? row.funded : Math.max(0, +(row.funded - (prev?.funded ?? 0)).toFixed(1)),
      }
    })
  }, [capitalRaw, chartMode])

  const lastPoint = capitalSeries[capitalSeries.length - 1]
  const yMax = Math.max(...capitalSeries.map((r) => r.target)) || 60

  const opportunities = useMemo(() => {
    if (filter === "all") return TOP_OPPORTUNITIES
    return TOP_OPPORTUNITIES.filter((o) => o.fundType === filter)
  }, [filter])

  return (
    <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 min-w-0">
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#0f172a]">
            {viewMode === "board" ? "Pipeline Board" : "Fundraising Pipeline"}
          </h1>
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Fund type filter">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-[#4f46e5] text-white shadow-sm"
                    : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              type="button"
              className="inline-flex h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-[#4f46e5] px-5 text-sm font-medium text-white hover:bg-[#4338ca] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Opportunity
            </button>
            <div className="relative flex-1 sm:flex-none min-w-[148px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                {viewMode === "board" ? (
                  <Columns3 className="w-4 h-4" />
                ) : (
                  <LayoutDashboard className="w-4 h-4" />
                )}
              </span>
              <select
                className="h-10 w-full appearance-none rounded-full border border-[#e2e8f0] bg-white pl-9 pr-8 text-sm font-medium text-[#334155] outline-none shadow-sm"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as PipelineViewMode)}
                aria-label="Pipeline view"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                }}
              >
                <option value="overview">Overview</option>
                <option value="board">Board View</option>
              </select>
            </div>
          </div>
          {viewMode === "overview" && (
            <p className="text-xs text-[#94a3b8] flex items-center gap-1.5 sm:justify-end">
              <CalendarDays className="w-3.5 h-3.5" />
              As at 20 May 2025
            </p>
          )}
        </div>
      </div>

      {viewMode === "board" ? (
        <FundraisingPipelineBoard filter={filter} />
      ) : (
        <>
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon]
          return (
            <div key={kpi.id} className={cn(CARD, "p-3 sm:p-3.5")}>
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${kpi.accent}18`, color: kpi.accent }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2.5 text-[11px] font-medium text-[#94a3b8]">{kpi.label}</p>
              <p className="mt-0.5 text-lg sm:text-xl font-semibold tracking-tight text-[#0f172a] tabular-nums">
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[11px] text-[#64748b]">{kpi.meta}</p>
              <div className="mt-2.5 h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${kpi.pct}%`, backgroundColor: kpi.bar }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className={cn(CARD, "lg:col-span-5 xl:col-span-3 p-4")}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#0f172a]">Pipeline by Stage</h2>
            <button type="button" className="text-[#cbd5e1]" aria-label="More">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <PipelineFunnel stages={stages} />
          <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">Total Pipeline</span>
            <span className="font-semibold text-[#0f172a] tabular-nums">{totalPipeline}</span>
          </div>
        </section>

        <section className={cn(CARD, "lg:col-span-7 xl:col-span-6 p-4 sm:p-5")}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-sm font-semibold text-[#0f172a]">Capital Raised Over Time</h2>
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#93c5fd] text-white shrink-0"
                title="Cumulative committed and funded capital versus fundraising target"
              >
                <Info className="w-2.5 h-2.5" strokeWidth={3} />
              </span>
            </div>
            <select
              className="h-8 shrink-0 rounded-lg border border-[#e2e8f0] bg-white pl-3 pr-7 text-xs text-[#475569] outline-none shadow-sm appearance-none bg-[length:12px] bg-[right_0.55rem_center] bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              }}
              value={chartMode}
              onChange={(e) => setChartMode(e.target.value as "cumulative" | "monthly")}
              aria-label="Chart view"
            >
              <option value="cumulative">Cumulative</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 pb-2 text-[11px] text-[#64748b]">
            <span className="inline-flex items-center gap-2">
              <span className="relative w-7 h-px bg-[#3b82f6]">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              </span>
              Committed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="relative w-7 h-px bg-[#22c55e]">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              </span>
              Funded
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-7 border-t border-dashed border-[#8b5cf6]" />
              Target
            </span>
          </div>

          <div className="h-[240px] sm:h-[300px] mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={capitalSeries} margin={{ top: 18, right: 78, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="committedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fundedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  dy={8}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  ticks={yTicksFor(yMax)}
                  domain={[0, yMax]}
                  tickFormatter={(v) => `US$${v}M`}
                  width={58}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                  }}
                  formatter={(value: number, name: string) => [`US$${Number(value).toFixed(1)}M`, name]}
                />
                <Area
                  type="monotone"
                  dataKey="committed"
                  fill="url(#committedFill)"
                  stroke="none"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="funded"
                  fill="url(#fundedFill)"
                  stroke="none"
                  isAnimationActive={false}
                />
                {chartMode === "cumulative" && (
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke="#8b5cf6"
                    strokeDasharray="6 5"
                    strokeWidth={1.75}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                    label={(props) => {
                      const { index, x, y } = props
                      if (index !== capitalSeries.length - 1 || x == null || y == null) return null
                      return (
                        <ChartEndLabel
                          x={x}
                          y={y}
                          value={`US$${Number(lastPoint.target).toFixed(1)}M`}
                          color="#8b5cf6"
                          dy={0}
                        />
                      )
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="committed"
                  name="Committed"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5.5, strokeWidth: 0 }}
                  label={(props) => {
                    const { index, x, y } = props
                    if (index !== capitalSeries.length - 1) return null
                    return (
                      <ChartEndLabel
                        x={x}
                        y={y}
                        value={`US$${lastPoint.committed.toFixed(1)}M`}
                        color="#2563eb"
                        dy={-12}
                      />
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="funded"
                  name="Funded"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                  activeDot={{ r: 5.5, strokeWidth: 0 }}
                  label={(props) => {
                    const { index, x, y } = props
                    if (index !== capitalSeries.length - 1) return null
                    return (
                      <ChartEndLabel
                        x={x}
                        y={y}
                        value={`US$${lastPoint.funded.toFixed(1)}M`}
                        color="#16a34a"
                        dy={14}
                      />
                    )
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={cn(CARD, "lg:col-span-12 xl:col-span-3 p-4")}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[#0f172a]">Upcoming Meetings & Tasks</h2>
            <button
              type="button"
              onClick={() => setMeetingsOpen(true)}
              className="text-xs font-medium text-[#2563eb] hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="divide-y divide-[#eeeeee]">
            {meetings.slice(0, 5).map((item) => (
              <li key={item.id}>
                <MeetingRow item={item} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className={cn(CARD, "xl:col-span-8 overflow-hidden")}>
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-[#0f172a]">Top Investor Opportunities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-[#eef2f7] text-xs text-[#94a3b8]">
                  <th className="px-4 py-2.5 font-medium">Investor</th>
                  <th className="px-2.5 py-2.5 font-medium">Type</th>
                  <th className="px-2.5 py-2.5 font-medium">Stage</th>
                  <th className="px-2.5 py-2.5 font-medium">Proposed Ticket</th>
                  <th className="px-2.5 py-2.5 font-medium">Probability</th>
                  <th className="px-2.5 py-2.5 font-medium">Owner</th>
                  <th className="px-2.5 py-2.5 font-medium">Next Step</th>
                  <th className="px-4 py-2.5 font-medium">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
                      No opportunities for this filter.
                    </td>
                  </tr>
                ) : (
                  opportunities.slice(0, 6).map((row, idx) => (
                    <tr key={row.id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0",
                              AVATAR_TONES[idx % AVATAR_TONES.length],
                            )}
                          >
                            {row.initials}
                          </div>
                          <span className="text-sm font-medium text-[#0f172a]">{row.investor}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3 text-xs text-[#64748b]">{row.type}</td>
                      <td className="px-2.5 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                            STAGE_TONE[row.stageTone],
                          )}
                        >
                          {row.stage}
                        </span>
                      </td>
                      <td className="px-2.5 py-3 text-sm font-medium text-[#0f172a] tabular-nums whitespace-nowrap">
                        {row.ticket}
                      </td>
                      <td className="px-2.5 py-3">
                        <ProbText value={row.probability} />
                      </td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center shrink-0",
                              AVATAR_TONES[(idx + 2) % AVATAR_TONES.length],
                            )}
                          >
                            {row.ownerInitials}
                          </div>
                          <span className="text-xs text-[#475569] whitespace-nowrap">{row.owner}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3">
                        <p className="text-xs font-medium text-[#334155] whitespace-nowrap">{row.nextStep}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5 whitespace-nowrap">{row.nextDate}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">{row.lastContact}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#94a3b8]">
              Showing 1 to {Math.min(6, opportunities.length)} of {opportunities.length} opportunities
            </p>
            <button
              type="button"
              onClick={() => setOppsOpen(true)}
              className="text-xs font-medium text-[#2563eb] hover:underline text-left sm:text-right"
            >
              View all opportunities →
            </button>
          </div>
        </section>

        <section className={cn(CARD, "xl:col-span-4 p-4")}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0f172a]">Recent Activity</h2>
            <button
              type="button"
              onClick={() => setActivityOpen(true)}
              className="text-xs font-medium text-[#2563eb] hover:underline"
            >
              View all
            </button>
          </div>
          <ActivityTimeline items={activity.slice(0, 5)} />
        </section>
      </div>

      {/* View all — Meetings */}
      <Dialog open={meetingsOpen} onOpenChange={setMeetingsOpen}>
        <DialogContent className="max-w-lg rounded-[12px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9]">
            <DialogTitle className="text-base font-semibold text-[#0f172a]">
              Upcoming Meetings & Tasks
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748b]">
              {meetings.length} items for the current fund filter
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto px-5">
            <ul className="divide-y divide-[#eeeeee] pb-2">
              {meetings.map((item) => (
                <li key={item.id} className="py-1">
                  <MeetingRow item={item} dense />
                  {(item.owner || item.notes || item.status || item.location) && (
                    <div className="ml-12 mb-3 rounded-lg bg-[#f8fafc] border border-[#f1f5f9] px-3 py-2 space-y-1">
                      {item.status && (
                        <p className="text-[11px] text-[#64748b]">
                          Status: <span className="font-medium text-[#334155]">{item.status}</span>
                        </p>
                      )}
                      {item.owner && (
                        <p className="text-[11px] text-[#64748b]">
                          Owner: <span className="font-medium text-[#334155]">{item.owner}</span>
                        </p>
                      )}
                      {item.location && (
                        <p className="text-[11px] text-[#64748b]">
                          Location: <span className="font-medium text-[#334155]">{item.location}</span>
                        </p>
                      )}
                      {item.notes && <p className="text-[11px] text-[#475569] leading-relaxed">{item.notes}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* View all — Activity */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="max-w-lg rounded-[12px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9]">
            <DialogTitle className="text-base font-semibold text-[#0f172a]">Recent Activity</DialogTitle>
            <DialogDescription className="text-xs text-[#64748b]">
              Full activity log for the current filter
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto px-5 py-4">
            <ActivityTimeline items={activity} showDetail />
          </div>
        </DialogContent>
      </Dialog>

      {/* View all — Opportunities */}
      <Dialog open={oppsOpen} onOpenChange={setOppsOpen}>
        <DialogContent className="max-w-3xl rounded-[12px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9]">
            <DialogTitle className="text-base font-semibold text-[#0f172a]">
              Investor Opportunities
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748b]">
              {opportunities.length} opportunities for the current filter
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto">
            <div className="divide-y divide-[#f1f5f9]">
              {opportunities.map((row) => (
                <div key={row.id} className="px-5 py-4 hover:bg-[#fafbfc]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#eef2ff] text-[#4f46e5] text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {row.initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <p className="text-sm font-semibold text-[#0f172a]">{row.investor}</p>
                        <span className="text-sm font-medium text-[#0f172a] tabular-nums">{row.ticket}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                        <span>{row.type}</span>
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                            STAGE_TONE[row.stageTone],
                          )}
                        >
                          {row.stage}
                        </span>
                        <span>Owner: {row.owner}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <ProbText value={row.probability} />
                        <p className="text-xs text-[#475569]">
                          Next: {row.nextStep} · {row.nextDate}
                        </p>
                        <p className="text-xs text-[#94a3b8]">Last contact {row.lastContact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
