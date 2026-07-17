"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { FrOpportunityWizard } from "@/components/fundraising/fundraising-create-wizards"
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
import { fundraisingApi, asNumber, toastFrError } from "@/lib/api/fundraising-api"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapOpportunityRow, moneyLabel } from "@/lib/fundraising/mappers"
import { FrTableSkeleton } from "@/components/fundraising/fundraising-modals"
import { stageChipClass } from "./dashboard-mock-data"
import {
  type ActivityItem,
  type PipelineFilter,
  type PipelineKpi,
  type PipelineStage,
  type UpcomingItem,
} from "./pipeline-mock-data"
import { FundraisingPipelineBoard } from "./fundraising-pipeline-board"

type PipelineViewMode = "overview" | "board"
const CARD = "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STAGE_COLORS = ["#2563eb", "#0284c7", "#0ea5e9", "#16a34a", "#7c3aed", "#8b5cf6"]

const CAMPAIGN_TYPE_BY_FILTER: Record<PipelineFilter, string | undefined> = {
  all: undefined,
  vc: "VC_FUNDRAISE",
  pe: "PE_FUNDRAISE",
  am: "INSTITUTIONAL_MANDATE",
}

const FILTERS: { id: PipelineFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vc", label: "VC Fund" },
  { id: "pe", label: "PE Fund" },
  { id: "am", label: "Asset Management" },
]

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

function oppInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

function safePersonName(value: unknown, fallback = "Name unavailable") {
  const name = typeof value === "string" ? value.trim() : ""
  return name && !UUID_PATTERN.test(name) ? name : fallback
}

function embeddedPersonName(raw: Record<string, any>, key: "owner" | "user", mapped?: string) {
  const person = raw[key] || (key === "owner" ? raw.assignedOwner : raw.actor)
  const embedded =
    person && typeof person === "object"
      ? person.fullName ||
        person.displayName ||
        person.name ||
        [person.firstName, person.lastName].filter(Boolean).join(" ")
      : undefined
  return safePersonName(
    embedded ||
      raw[`${key}Name`] ||
      (key === "user" ? raw.actorName : raw.assignedOwnerName) ||
      mapped,
  )
}

function rowsFromAnalytics(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== "object") return []
  const record = value as Record<string, any>
  const rows = record.stages || record.items || record.data || record.funnel
  return Array.isArray(rows) ? rows : []
}

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
  const [createOppOpen, setCreateOppOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null)
  const [rawOpportunities, setRawOpportunities] = useState<Record<string, any>[]>([])
  const [funnelAnalytics, setFunnelAnalytics] = useState<unknown>(null)
  const [rawMeetings, setRawMeetings] = useState<Record<string, any>[]>([])
  const [rawCommitments, setRawCommitments] = useState<Record<string, any>[]>([])
  const [rawActivity, setRawActivity] = useState<Record<string, any>[]>([])
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)

  async function loadOverview() {
    setLoading(true)
    try {
      const campaignType = CAMPAIGN_TYPE_BY_FILTER[filter]
      const [dash, opps, funnel, meetings, commitments, audit] = await Promise.all([
        fundraisingApi.getDashboard(campaignType ? { campaignType } : undefined),
        fundraisingApi.listOpportunities(campaignType ? { campaignType } : undefined),
        fundraisingApi.getAnalyticsFunnel(),
        fundraisingApi.listMeetings({ pageSize: 100 }),
        fundraisingApi.listCommitments(),
        fundraisingApi.listAuditLogs({ limit: 100 }),
      ])
      setDashboard(dash)
      setRawOpportunities(opps ?? [])
      setFunnelAnalytics(funnel)
      setRawMeetings(meetings ?? [])
      setRawCommitments(commitments ?? [])
      setRawActivity(audit ?? [])
      setLoadedAt(new Date())
    } catch (err) {
      toastFrError(err, "Could not load pipeline overview")
      setDashboard(null)
      setRawOpportunities([])
      setFunnelAnalytics(null)
      setRawMeetings([])
      setRawCommitments([])
      setRawActivity([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === "overview") loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filter])

  const opportunities = useMemo(() => rawOpportunities.map(mapOpportunityRow), [rawOpportunities])
  const opportunityIds = useMemo(
    () => new Set(rawOpportunities.map((row) => String(row.id))),
    [rawOpportunities],
  )
  const campaignIds = useMemo(
    () => new Set(rawOpportunities.map((row) => String(row.campaignId || "")).filter(Boolean)),
    [rawOpportunities],
  )

  const isInCurrentScope = (row: Record<string, any>) => {
    if (filter === "all") return true
    const opportunityId = String(row.opportunityId || row.opportunity?.id || "")
    const campaignId = String(row.campaignId || row.campaign?.id || "")
    return opportunityIds.has(opportunityId) || campaignIds.has(campaignId)
  }

  const kpis: PipelineKpi[] = useMemo(() => {
    const targetTotal = asNumber(dashboard?.targetTotal)
    const signedTotal = asNumber(dashboard?.signedTotal)
    const fundedTotal = asNumber(dashboard?.fundedTotal)
    const weightedPipeline = asNumber(dashboard?.weightedPipeline)
    const coverageRatio = asNumber(dashboard?.coverageRatio)
    const softCircleTotal = rawOpportunities.reduce((s, o) => s + asNumber(o.softCircleAmount), 0)
    const pct = (v: number) => (targetTotal > 0 ? Math.min(100, Math.round((v / targetTotal) * 100)) : 0)

    return [
      { id: "target", label: "Target Raise", value: moneyLabel(targetTotal), meta: "Dashboard target", pct: 100, icon: "target", accent: "#7c3aed", bar: "#8b5cf6" },
      { id: "soft", label: "Soft Circles", value: moneyLabel(softCircleTotal), meta: `${pct(softCircleTotal)}% of target`, pct: pct(softCircleTotal), icon: "users", accent: "#2563eb", bar: "#3b82f6" },
      { id: "signed", label: "Signed", value: moneyLabel(signedTotal), meta: `${pct(signedTotal)}% of target`, pct: pct(signedTotal), icon: "shield", accent: "#0ea5e9", bar: "#38bdf8" },
      { id: "funded", label: "Funded", value: moneyLabel(fundedTotal), meta: `${pct(fundedTotal)}% of target`, pct: pct(fundedTotal), icon: "handshake", accent: "#16a34a", bar: "#22c55e" },
      { id: "weighted", label: "Weighted Pipeline", value: moneyLabel(weightedPipeline), meta: "Probability-adjusted", pct: pct(weightedPipeline), icon: "coins", accent: "#65a30d", bar: "#84cc16" },
      { id: "coverage", label: "Coverage Ratio", value: coverageRatio ? `${coverageRatio.toFixed(2)}×` : "—", meta: "vs target", pct: Math.min(100, Math.round(coverageRatio * 50)), icon: "pie", accent: "#7c3aed", bar: "#a78bfa" },
    ]
  }, [dashboard, rawOpportunities])

  const stages: PipelineStage[] = useMemo(() => {
    const analyticRows = rowsFromAnalytics(funnelAnalytics).filter((row) => {
      if (filter === "all") return true
      const campaignId = String(row.campaignId || row.campaign?.id || "")
      return campaignIds.has(campaignId)
    })
    const sourceRows: Array<{ name: string; count: number; amount: number }> =
      analyticRows.length > 0
        ? analyticRows.map((row) => ({
            name: String(row.stageName || row.name || row.stageCode || row.code || "Unspecified"),
            count: asNumber(row.count ?? row.opportunityCount),
            amount: asNumber(row.amount ?? row.totalAmount ?? row.pipelineAmount),
          }))
        : Array.from(
            rawOpportunities.reduce((map, row) => {
              const name = String(row.stage?.name || row.stageName || row.stageCode || "Unspecified")
              const current = map.get(name) || { name, count: 0, amount: 0 }
              current.count += 1
              current.amount += asNumber(
                row.proposedAmount ?? row.indicativeAmount ?? row.softCircleAmount ?? row.expectedAum,
              )
              map.set(name, current)
              return map
            }, new Map<string, { name: string; count: number; amount: number }>())
              .values(),
          )
    const totalCount = sourceRows.reduce((sum, row) => sum + row.count, 0)
    return sourceRows.map((row, index) => ({
      name: row.name,
      count: row.count,
      amount: moneyLabel(row.amount),
      amountNum: row.amount,
      pct: totalCount > 0 ? Math.round((row.count / totalCount) * 100) : 0,
      color: STAGE_COLORS[index % STAGE_COLORS.length],
    }))
  }, [funnelAnalytics, filter, campaignIds, rawOpportunities])

  const totalPipeline = useMemo(
    () => moneyLabel(stages.reduce((sum, stage) => sum + stage.amountNum, 0)),
    [stages],
  )

  const meetings: UpcomingItem[] = useMemo(
    () =>
      rawMeetings
        .filter(isInCurrentScope)
        .filter((row) => String(row.status || "").toUpperCase() === "SCHEDULED")
        .sort(
          (a, b) =>
            new Date(a.scheduledStart || 0).getTime() - new Date(b.scheduledStart || 0).getTime(),
        )
        .map((row, index) => {
          const start = row.scheduledStart ? new Date(row.scheduledStart) : null
          const validStart = start && !Number.isNaN(start.getTime()) ? start : null
          const type = String(row.meetingType || "").toUpperCase()
          return {
            id: String(row.id),
            title: row.title || "Meeting",
            subtitle:
              row.investor?.legalName ||
              row.investor?.name ||
              row.investorName ||
              row.location ||
              "Fundraising meeting",
            date: validStart ? validStart.toLocaleDateString() : "Date unavailable",
            time: validStart
              ? validStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—",
            tone: (["purple", "green", "indigo", "blue", "amber", "sky"] as const)[index % 6],
            kind: type === "PHONE" ? "call" : type === "IN_PERSON" ? "people" : "meeting",
            location: row.location,
            owner: embeddedPersonName(row, "owner"),
            notes: row.agenda || row.description || row.notes,
            status: row.status,
          }
        }),
    [rawMeetings, filter, opportunityIds, campaignIds],
  )

  const activity: ActivityItem[] = useMemo(
    () =>
      rawActivity.filter(isInCurrentScope).map((row, index) => {
        const at = row.createdAt || row.timestamp || row.occurredAt
        const action = row.summary || row.action || "Updated"
        const object = row.objectName || row.objectType || "fundraising record"
        return {
          id: String(row.id ?? index),
          parts: [{ text: `${action} ${object}` }],
          actor: embeddedPersonName(row, "user"),
          when: at ? new Date(at).toLocaleString() : "Time unavailable",
          tone: (["blue", "green", "purple", "sky", "amber"] as const)[index % 5],
          detail: typeof row.details === "string" ? row.details : undefined,
        }
      }),
    [rawActivity, filter, opportunityIds, campaignIds],
  )

  const capitalRaw = useMemo(() => {
    const events = new Map<string, { month: string; at: number; committed: number; funded: number }>()
    rawCommitments.filter(isInCurrentScope).forEach((row) => {
      const amount = asNumber(row.commitmentAmount ?? row.amount)
      const fundedAmount = asNumber(row.fundedAmount ?? row.amountFunded)
      const signedAt = row.signedAt || row.commitmentDate
      const fundedAt = row.fundedAt || row.fundingDate || row.fullyFundedAt
      const add = (dateValue: unknown, key: "committed" | "funded", value: number) => {
        if (!dateValue || value <= 0) return
        const date = new Date(String(dateValue))
        if (Number.isNaN(date.getTime())) return
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const current = events.get(monthKey) || {
          month: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
          at: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          committed: 0,
          funded: 0,
        }
        current[key] += value / 1_000_000
        events.set(monthKey, current)
      }
      add(signedAt, "committed", amount)
      add(fundedAt, "funded", fundedAmount)
    })
    let committed = 0
    let funded = 0
    const target = asNumber(dashboard?.targetTotal) / 1_000_000
    return Array.from(events.values())
      .sort((a, b) => a.at - b.at)
      .map((row) => {
        committed += row.committed
        funded += row.funded
        return { month: row.month, committed, funded, target }
      })
  }, [rawCommitments, dashboard, filter, opportunityIds, campaignIds])

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
  const yMax = Math.max(
    1,
    ...capitalSeries.flatMap((row) => [row.target, row.committed, row.funded]),
  )

  function exportPipeline() {
    exportFundraisingCsv(
      opportunities.map((row) => ({
        investor: row.investor,
        campaign: row.campaign,
        stage: row.stage,
        proposedTicket: row.proposed !== "—" ? row.proposed : row.indicative,
        probability: `${row.probability}%`,
        owner: embeddedPersonName(row.raw, "owner", row.owner),
        nextStep: row.nextAction,
        daysInStage: row.ageDays,
      })),
      [
        { key: "investor", label: "Investor" },
        { key: "campaign", label: "Campaign" },
        { key: "stage", label: "Stage" },
        { key: "proposedTicket", label: "Proposed Ticket" },
        { key: "probability", label: "Probability" },
        { key: "owner", label: "Owner" },
        { key: "nextStep", label: "Next Step" },
        { key: "daysInStage", label: "Days in Stage" },
      ],
      "fundraising-pipeline",
    )
  }

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
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm"
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
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-10 px-6 flex-1 sm:flex-none gap-2 shadow-sm"
              onClick={exportPipeline}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              type="button"
              variant="gradient-info"
              className="rounded-full h-10 px-6 shadow-sm font-semibold text-xs gap-2 flex-1 sm:flex-none"
              onClick={() => setCreateOppOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Opportunity
            </Button>
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
              {loadedAt ? `Loaded ${loadedAt.toLocaleString()}` : "Loading live data…"}
            </p>
          )}
        </div>
      </div>

      {viewMode === "board" ? (
        <FundraisingPipelineBoard />
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
            <button type="button" className="rounded-full p-1 text-[#cbd5e1]" aria-label="More">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          {stages.length > 0 ? (
            <PipelineFunnel stages={stages} />
          ) : (
            <p className="py-12 text-center text-sm text-[#94a3b8]">No pipeline stage data.</p>
          )}
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
              className="h-8 shrink-0 rounded-full border border-[#e2e8f0] bg-white pl-3 pr-7 text-xs text-[#475569] outline-none shadow-sm appearance-none bg-[length:12px] bg-[right_0.55rem_center] bg-no-repeat"
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
            {capitalSeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-[#94a3b8]">
                No dated commitment or funding series is available.
              </div>
            ) : (
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
                          x={Number(x)}
                          y={Number(y)}
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
                        x={x == null ? undefined : Number(x)}
                        y={y == null ? undefined : Number(y)}
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
                        x={x == null ? undefined : Number(x)}
                        y={y == null ? undefined : Number(y)}
                        value={`US$${lastPoint.funded.toFixed(1)}M`}
                        color="#16a34a"
                        dy={14}
                      />
                    )
                  }}
                />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className={cn(CARD, "lg:col-span-12 xl:col-span-3 p-4")}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[#0f172a]">Upcoming Meetings & Tasks</h2>
            <button
              type="button"
              onClick={() => setMeetingsOpen(true)}
              className="rounded-full px-2 py-1 text-xs font-medium text-[#2563eb] hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="divide-y divide-[#eeeeee]">
            {meetings.length === 0 ? (
              <li className="py-10 text-center text-sm text-[#94a3b8]">No upcoming meetings.</li>
            ) : (
              meetings.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <MeetingRow item={item} />
                </li>
              ))
            )}
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
                {loading ? (
                  <FrTableSkeleton columns={8} rows={6} />
                ) : opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
                      No opportunities yet.
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
                            {oppInitials(row.investor)}
                          </div>
                          <span className="text-sm font-medium text-[#0f172a]">{row.investor}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3 text-xs text-[#64748b]">{row.campaign}</td>
                      <td className="px-2.5 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                            stageChipClass(row.stage),
                          )}
                        >
                          {row.stage}
                        </span>
                      </td>
                      <td className="px-2.5 py-3 text-sm font-medium text-[#0f172a] tabular-nums whitespace-nowrap">
                        {row.proposed !== "—" ? row.proposed : row.indicative}
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
                            {oppInitials(embeddedPersonName(row.raw, "owner", row.owner))}
                          </div>
                          <span className="text-xs text-[#475569] whitespace-nowrap">
                            {embeddedPersonName(row.raw, "owner", row.owner)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3">
                        <p className="text-xs font-medium text-[#334155] whitespace-nowrap">{row.nextAction}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">{row.ageDays}d in stage</td>
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
              className="rounded-full px-2 py-1 text-left text-xs font-medium text-[#2563eb] hover:underline sm:text-right"
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
              className="rounded-full px-2 py-1 text-xs font-medium text-[#2563eb] hover:underline"
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
              {meetings.length === 0 ? (
                <li className="py-10 text-center text-sm text-[#94a3b8]">No upcoming meetings.</li>
              ) : (
                meetings.map((item) => (
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
                ))
              )}
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
              {opportunities.length} opportunities loaded
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto">
            <div className="divide-y divide-[#f1f5f9]">
              {opportunities.map((row) => (
                <div key={row.id} className="px-5 py-4 hover:bg-[#fafbfc]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#eef2ff] text-[#4f46e5] text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {oppInitials(row.investor)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <p className="text-sm font-semibold text-[#0f172a]">{row.investor}</p>
                        <span className="text-sm font-medium text-[#0f172a] tabular-nums">
                          {row.proposed !== "—" ? row.proposed : row.indicative}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                        <span>{row.campaign}</span>
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                            stageChipClass(row.stage),
                          )}
                        >
                          {row.stage}
                        </span>
                        <span>Owner: {embeddedPersonName(row.raw, "owner", row.owner)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <ProbText value={row.probability} />
                        <p className="text-xs text-[#475569]">Next: {row.nextAction}</p>
                        <p className="text-xs text-[#94a3b8]">{row.ageDays}d in stage</p>
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

      <FrOpportunityWizard open={createOppOpen} onOpenChange={setCreateOppOpen} onCreated={loadOverview} />
    </div>
  )
}
