"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  RefreshCw,
  ThumbsUp,
  MessageCircle,
  Columns3,
  Download,
  Calendar,
  Building2,
  Plus,
} from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmPageHeader, PmSelectChip, PmStatusPill, PmAvatar } from "@/components/performance-mock/primitives"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const PURPLE = "#8B5CF6"
const PURPLE_DEEP = "#7C3AED"
const GREEN = "#10B981"
const ORANGE = "#F59E0B"
const RED = "#EF4444"

const trendData = [
  { month: "Jan", rate: 58 },
  { month: "Feb", rate: 61 },
  { month: "Mar", rate: 64 },
  { month: "Apr", rate: 68 },
  { month: "May", rate: 71 },
  { month: "Jun", rate: 73 },
  { month: "Jul", rate: 76.4 },
  { month: "Aug", rate: 74 },
  { month: "Sep", rate: 77 },
  { month: "Oct", rate: 79 },
  { month: "Nov", rate: 81 },
  { month: "Dec", rate: 83 },
]

const targetVsActual = [
  { dept: "Financial", target: 78, actual: 85 },
  { dept: "Operations", target: 72, actual: 64 },
  { dept: "ICT", target: 68, actual: 72 },
  { dept: "People & Culture", target: 65, actual: 72 },
  { dept: "Client Experience", target: 72, actual: 76 },
]

const distribution = [
  { name: "On Track", value: 32, pct: 66.7, color: GREEN },
  { name: "At Risk", value: 10, pct: 20.8, color: ORANGE },
  { name: "Off Track", value: 6, pct: 12.5, color: RED },
]

const alerts = [
  { icon: AlertCircle, tone: "danger" as const, title: "6 KPIs are off track", desc: "Immediate attention required", time: "2h ago", bg: "#FEF2F2", color: RED },
  { icon: AlertTriangle, tone: "warning" as const, title: "10 KPIs are at risk", desc: "Monitor closely this week", time: "4h ago", bg: "#FFFBEB", color: ORANGE },
  { icon: Clock, tone: "purple" as const, title: "3 KPIs due for review", desc: "Review cycle in progress", time: "1d ago", bg: "#F5F3FF", color: PURPLE },
  { icon: RefreshCw, tone: "info" as const, title: "Data update required", desc: "4 KPIs need manual update", time: "2d ago", bg: "#EFF6FF", color: "#2563EB" },
]

const departments = ["Financial", "Operations", "ICT", "People & Culture", "Client Experience"]
const heatmap = [
  { period: "Jan 2026", values: [72.1, 68.4, 60.3, 64.2, 70.5] },
  { period: "Apr 2026", values: [74.8, 71.2, 66.7, 66.6, 70.5] },
  { period: "Jul 2026", values: [79.2, 75.6, 68.4, 64.5, 76.2] },
]

function heatColor(v: number) {
  if (v >= 75) return { bg: "#D1FAE5", text: "#047857" }
  if (v >= 68) return { bg: "#FEF3C7", text: "#B45309" }
  return { bg: "#FEE2E2", text: "#B91C1C" }
}

const topKpis = [
  { name: "Revenue Growth", dept: "Financial", value: 92.5 },
  { name: "Cost Optimization", dept: "Operations", value: 89.3 },
  { name: "Customer Satisfaction", dept: "Client Experience", value: 87.6 },
  { name: "System Uptime", dept: "ICT", value: 85.4 },
  { name: "Employee Engagement", dept: "People & Culture", value: 83.1 },
]

const bottomKpis = [
  { name: "Portfolio Diversification", dept: "Financial", value: 45.2 },
  { name: "Project Delivery Timelines", dept: "Operations", value: 48.7 },
  { name: "IT Security Compliance", dept: "ICT", value: 52.1 },
  { name: "Employee Turnover Rate", dept: "People & Culture", value: 55.3 },
  { name: "NPS Response Rate", dept: "Client Experience", value: 57.8 },
]

const commentsSeed = [
  {
    id: "1",
    name: "Tariro Moyo",
    src: PM_PHOTOS.tariro,
    time: "2h ago",
    tag: "Finance",
    tagBg: "#F3E8FF",
    tagColor: PURPLE,
    text: "Revenue growth tracking ahead of plan. Suggest locking Q3 stretch target.",
    likes: 12,
    replies: 3,
  },
  {
    id: "2",
    name: "Nyasha Dube",
    src: PM_PHOTOS.nyasha,
    time: "5h ago",
    tag: "Operations",
    tagBg: "#FFEDD5",
    tagColor: "#EA580C",
    text: "Delivery timelines slipped on 2 programs — root cause is vendor lead times.",
    likes: 8,
    replies: 5,
  },
  {
    id: "3",
    name: "Tawanda Chikore",
    src: PM_PHOTOS.tawanda,
    time: "1d ago",
    tag: "ICT",
    tagBg: "#DBEAFE",
    tagColor: "#2563EB",
    text: "Uptime recovered after weekend patch. Security compliance still flagged.",
    likes: 15,
    replies: 2,
  },
]

type RowStatus = "On Track" | "At Risk" | "Off Track"

type KpiRow = {
  id: number
  name: string
  owner: string
  ownerSrc: string
  department: string
  target: string
  actual: string
  variance: number
  spark: number[]
  status: RowStatus
  updated: string
}

const kpiRows: KpiRow[] = [
  { id: 1, name: "Revenue Growth Rate", owner: "Tariro Moyo", ownerSrc: PM_PHOTOS.tariro, department: "Financial", target: "$25.0M", actual: "$27.1M", variance: 8.4, spark: [62, 65, 68, 72, 78, 85], status: "On Track", updated: "18 Jul 2026" },
  { id: 2, name: "Operating Margin", owner: "Farai Moyo", ownerSrc: PM_PHOTOS.farai, department: "Financial", target: "18.0%", actual: "18.5%", variance: 2.8, spark: [70, 72, 74, 76, 78, 80], status: "On Track", updated: "18 Jul 2026" },
  { id: 3, name: "Project On-Time Delivery", owner: "Tawanda Chikore", ownerSrc: PM_PHOTOS.tawanda, department: "Operations", target: "92%", actual: "88.4%", variance: -3.9, spark: [90, 88, 86, 85, 84, 82], status: "At Risk", updated: "17 Jul 2026" },
  { id: 4, name: "System Availability", owner: "Tendai Sibanda", ownerSrc: PM_PHOTOS.tendai, department: "ICT", target: "99.5%", actual: "99.7%", variance: 0.2, spark: [98, 99, 99, 100, 99, 100], status: "On Track", updated: "18 Jul 2026" },
  { id: 5, name: "Employee Engagement", owner: "Chipo Ncube", ownerSrc: PM_PHOTOS.chipo, department: "People & Culture", target: "80%", actual: "83%", variance: 3.8, spark: [74, 76, 78, 80, 81, 83], status: "On Track", updated: "16 Jul 2026" },
  { id: 6, name: "Customer NPS", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, department: "Client Experience", target: "55", actual: "48", variance: -12.7, spark: [58, 55, 52, 50, 49, 48], status: "Off Track", updated: "15 Jul 2026" },
  { id: 7, name: "Cost-to-Income Ratio", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, department: "Financial", target: "45%", actual: "43.2%", variance: 4.0, spark: [48, 47, 46, 45, 44, 43], status: "On Track", updated: "18 Jul 2026" },
  { id: 8, name: "Security Compliance Score", owner: "Tendai Sibanda", ownerSrc: PM_PHOTOS.tendai, department: "ICT", target: "95%", actual: "88%", variance: -7.4, spark: [94, 92, 90, 89, 88, 88], status: "At Risk", updated: "14 Jul 2026" },
]

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const chart = data.map((v, i) => ({ i, v }))
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart}>
          <Line type="monotone" dataKey="v" stroke={up ? GREEN : RED} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CircularMini({ value, size = 44, color = PURPLE }: { value: number; size?: number; color?: string }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EDE9FE" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  deltaNeutral,
  icon,
  iconBg,
  iconColor,
  ring,
}: {
  label: string
  value: string
  delta: string
  deltaPositive?: boolean
  deltaNeutral?: boolean
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
  ring?: number
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#6B7280] truncate">{label}</p>
          <p className="mt-1.5 text-xl leading-none font-bold text-[#111827] tracking-tight">{value}</p>
          <p
            className={cn(
              "mt-2 text-xs font-semibold inline-flex items-center gap-0.5",
              deltaNeutral ? "text-[#6B7280]" : deltaPositive ? "text-[#10B981]" : "text-[#EF4444]"
            )}
          >
            {!deltaNeutral && (deltaPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />)}
            {delta}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">vs June 2026</p>
        </div>
        {ring !== undefined ? (
          <CircularMini value={ring} />
        ) : (
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardCreativeView() {
  const deptBars = [
    { name: "Fin", score: 85, fill: PURPLE },
    { name: "Ops", score: 64, fill: ORANGE },
    { name: "ICT", score: 72, fill: "#8B5CF6" },
    { name: "P&C", score: 72, fill: GREEN },
    { name: "CX", score: 76, fill: "#6366F1" },
  ]
  const weekly = [
    { day: "Mon", on: 28, risk: 8, off: 4 },
    { day: "Tue", on: 30, risk: 9, off: 5 },
    { day: "Wed", on: 29, risk: 10, off: 5 },
    { day: "Thu", on: 31, risk: 9, off: 6 },
    { day: "Fri", on: 32, risk: 10, off: 6 },
  ]
  const radial = [{ name: "score", value: 76.4, fill: PURPLE }]
  const sparklines = [
    { label: "Financial", value: "85%", delta: "+4.2%", up: true, data: [70, 72, 74, 78, 82, 85] },
    { label: "Operations", value: "64%", delta: "-3.1%", up: false, data: [72, 70, 68, 66, 65, 64] },
    { label: "ICT", value: "72%", delta: "+1.8%", up: true, data: [66, 67, 69, 70, 71, 72] },
    { label: "People & Culture", value: "72%", delta: "+2.4%", up: true, data: [64, 66, 68, 69, 70, 72] },
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Health score", value: "76.4", hint: "Company-wide", color: PURPLE, bg: "#F5F3FF" },
          { label: "Momentum", value: "+8.7%", hint: "vs last month", color: GREEN, bg: "#ECFDF5" },
          { label: "Attention", value: "16", hint: "At risk + off track", color: ORANGE, bg: "#FFFBEB" },
          { label: "Updates due", value: "4", hint: "Need manual entry", color: "#2563EB", bg: "#EFF6FF" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-[#6B7280]">{m.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">{m.hint}</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: m.bg }}>
              <div className="h-full rounded-full w-3/4" style={{ backgroundColor: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Organisation Pulse</h3>
              <p className="text-xs text-[#6B7280]">Completion momentum across the year</p>
            </div>
            <span className="h-7 px-2.5 rounded-lg bg-[#F3E8FF] text-[#7C3AED] text-xs font-semibold inline-flex items-center">YTD</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB" }} />
                <Area type="monotone" dataKey="rate" stroke={PURPLE} strokeWidth={3} fill="url(#pulseFill)" dot={{ r: 3.5, fill: PURPLE, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-[#111827] mb-1">Health Score</h3>
          <p className="text-xs text-[#6B7280] mb-2">Live organisational index</p>
          <div className="h-40 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="68%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#EDE9FE" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-[#111827]">76.4</p>
              <p className="text-[10px] text-[#9CA3AF]">/ 100</p>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
            {[
              { n: "32", l: "On track", c: GREEN },
              { n: "10", l: "At risk", c: ORANGE },
              { n: "6", l: "Off track", c: RED },
            ].map((s) => (
              <div key={s.l} className="rounded-lg bg-[#F9FAFB] p-2 text-center">
                <p className="text-sm font-bold" style={{ color: s.c }}>
                  {s.n}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Department Snapshot</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB" }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {deptBars.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#111827] mb-1">Status flow this week</h3>
          <p className="text-xs text-[#6B7280] mb-3">On track · At risk · Off track</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB" }} />
                <Bar dataKey="on" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                <Bar dataKey="risk" stackId="a" fill={ORANGE} />
                <Bar dataKey="off" stackId="a" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-4 rounded-xl border border-[#E5E7EB] bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#5B21B6] p-4 shadow-sm text-white">
          <h3 className="text-sm font-semibold mb-1">This week’s focus</h3>
          <p className="text-xs text-white/80 mb-4">Prioritise the 6 off-track KPIs before month close.</p>
          <div className="space-y-3">
            {[
              { label: "NPS recovery plan", pct: 40 },
              { label: "Security compliance uplift", pct: 55 },
              { label: "Delivery timeline root-cause", pct: 70 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {sparklines.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#6B7280]">{s.label}</p>
                <p className="text-xl font-bold text-[#111827] mt-0.5">{s.value}</p>
                <p className={cn("text-[11px] font-semibold mt-1", s.up ? "text-[#10B981]" : "text-[#EF4444]")}>{s.delta}</p>
              </div>
              <Sparkline data={s.data} up={s.up} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KpiAnalyticsMockScreen() {
  const [view, setView] = useState<"dashboard" | "analytics">("analytics")
  const [month, setMonth] = useState("July 2026")
  const [dept, setDept] = useState("All Departments")
  const [comparedTo, setComparedTo] = useState("June 2026")
  const [metric, setMetric] = useState("Completion Rate")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [page, setPage] = useState(1)
  const [comments, setComments] = useState(commentsSeed)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setCommentText] = useState("")
  const pageSize = 5

  const filteredRows = useMemo(() => {
    return kpiRows.filter((r) => {
      if (statusFilter !== "All Status" && r.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!`${r.name} ${r.owner} ${r.department}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [search, statusFilter])

  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  const addComment = () => {
    if (!commentText.trim()) return
    setComments((prev) => [
      {
        id: String(Date.now()),
        name: "Adm. User",
        src: PM_PHOTOS.admin,
        time: "Just now",
        tag: "General",
        tagBg: "#F3E8FF",
        tagColor: PURPLE_DEEP,
        text: commentText.trim(),
        likes: 0,
        replies: 0,
      },
      ...prev,
    ])
    setCommentText("")
    setCommentOpen(false)
  }

  const toggleLike = (id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c)))
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "KPI Analytics"]} />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="KPI Analytics"
          subtitle="Track, analyze and optimize performance across the organization."
          actions={
            <>
              <PmSelectChip
                icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={month}
                onClick={() => setMonth(month === "July 2026" ? "June 2026" : "July 2026")}
              />
              <PmSelectChip
                icon={<Building2 className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={dept}
                onClick={() => setDept(dept === "All Departments" ? "Financial" : "All Departments")}
              />
              <PmButton variant="primary" className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]">
                <Download className="h-3.5 w-3.5" /> Export Report
              </PmButton>
            </>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className={cn(
                "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                view === "dashboard" ? "bg-[#8B5CF6] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
              )}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setView("analytics")}
              className={cn(
                "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                view === "analytics" ? "bg-[#8B5CF6] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
              )}
            >
              KPI Analytics
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span>Compared to</span>
            <PmSelectChip label={comparedTo} onClick={() => setComparedTo(comparedTo === "June 2026" ? "May 2026" : "June 2026")} />
          </div>
        </div>

        {view === "dashboard" ? (
          <DashboardCreativeView />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <StatCard label="Overall Completion Rate" value="76.4%" delta="+ 8.7%" deltaPositive ring={76.4} />
              <StatCard
                label="Total KPIs"
                value="48"
                delta="No change"
                deltaNeutral
                icon={<LayoutGrid className="h-5 w-5" />}
                iconBg="#F3E8FF"
                iconColor={PURPLE}
              />
              <StatCard
                label="On Track"
                value="32"
                delta="+ 4"
                deltaPositive
                icon={<CheckCircle2 className="h-5 w-5" />}
                iconBg="#D1FAE5"
                iconColor={GREEN}
              />
              <StatCard
                label="At Risk"
                value="10"
                delta="+ 2"
                deltaPositive={false}
                icon={<AlertTriangle className="h-5 w-5" />}
                iconBg="#FEF3C7"
                iconColor={ORANGE}
              />
              <StatCard
                label="Off Track"
                value="6"
                delta="+ 1"
                deltaPositive={false}
                icon={<TrendingDown className="h-5 w-5" />}
                iconBg="#FEE2E2"
                iconColor={RED}
              />
              <StatCard
                label="Completion Rate"
                value="76.4%"
                delta="+ 8.7%"
                deltaPositive
                icon={<BarChart3 className="h-5 w-5" />}
                iconBg="#F3E8FF"
                iconColor={PURPLE}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Trend */}
              <div className="xl:col-span-5 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-[#111827]">KPI Trend Over Time</h3>
                  <PmSelectChip label={metric} onClick={() => setMetric(metric === "Completion Rate" ? "On Track %" : "Completion Rate")} />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="kpiTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={PURPLE} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={PURPLE} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                        formatter={(v: number) => [`${v}%`, metric]}
                      />
                      <Area type="monotone" dataKey="rate" stroke={PURPLE_DEEP} strokeWidth={3} fill="url(#kpiTrendFill)" activeDot={{ r: 6, fill: PURPLE_DEEP, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Target vs Actual */}
              <div className="xl:col-span-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-[#111827] mb-4">Target vs Actual</h3>
                <div className="space-y-3">
                  {targetVsActual.map((row) => (
                    <div key={row.dept}>
                      <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                        <span className="font-medium text-[#374151] truncate">{row.dept}</span>
                        <span className="font-bold text-[#111827] shrink-0">{row.actual.toFixed(1)}%</span>
                      </div>
                      <div className="space-y-1">
                        <div className="relative h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-[#D1D5DB]" style={{ width: `${row.target}%` }} />
                        </div>
                        <div className="relative h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${row.actual}%`, backgroundColor: PURPLE }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] mt-1">
                        <span>Target {row.target}%</span>
                        <span className="text-[#8B5CF6] font-medium">Actual {row.actual}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribution */}
              <div className="xl:col-span-2 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-[#111827] mb-2">Performance Distribution</h3>
                <div className="h-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={42} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                        {distribution.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-lg font-bold text-[#111827]">48</p>
                    <p className="text-[10px] text-[#9CA3AF]">KPI(s)</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-1">
                  {distribution.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[#6B7280]">
                        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-semibold text-[#111827]">
                        {d.value} · {d.pct}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-[#EF4444] font-medium">Benchmark: 70.0%</p>
              </div>

              {/* Alerts */}
              <div className="xl:col-span-2 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#111827]">Alerts & Notifications</h3>
                  <button type="button" className="text-xs font-medium text-[#8B5CF6] hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-2.5">
                  {alerts.map((a) => {
                    const Icon = a.icon
                    return (
                      <div key={a.title} className="rounded-lg p-2.5 flex items-start gap-2.5" style={{ backgroundColor: a.bg }}>
                        <div className="h-7 w-7 rounded-lg bg-white/80 flex items-center justify-center shrink-0" style={{ color: a.color }}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#111827] leading-snug">{a.title}</p>
                          <p className="text-[11px] text-[#6B7280]">{a.desc}</p>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">{a.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Heatmap */}
              <div className="xl:col-span-5 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm overflow-x-auto">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Department Heatmap</h3>
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr>
                      <th className="text-left text-[#9CA3AF] font-semibold pb-2 pr-2">Period</th>
                      {departments.map((d) => (
                        <th key={d} className="text-center text-[#9CA3AF] font-semibold pb-2 px-1">
                          {d.split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.map((row) => (
                      <tr key={row.period}>
                        <td className="py-1.5 pr-2 text-[#6B7280] font-medium whitespace-nowrap">{row.period}</td>
                        {row.values.map((v, i) => {
                          const c = heatColor(v)
                          return (
                            <td key={i} className="p-1">
                              <div
                                className="rounded-lg h-10 flex items-center justify-center font-semibold"
                                style={{ backgroundColor: c.bg, color: c.text }}
                              >
                                {v.toFixed(1)}%
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top / Bottom */}
              <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#111827]">Top 5 KPIs</h3>
                    <button type="button" className="text-xs font-medium text-[#8B5CF6]">
                      View all
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {topKpis.map((k, i) => (
                      <div key={k.name} className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#111827] truncate">{k.name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{k.dept}</p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                        <span className="text-xs font-bold text-[#111827] w-10 text-right">{k.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#111827]">Bottom 5 KPIs</h3>
                    <button type="button" className="text-xs font-medium text-[#8B5CF6]">
                      View all
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {bottomKpis.map((k, i) => (
                      <div key={k.name} className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#111827] truncate">{k.name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{k.dept}</p>
                        </div>
                        <ArrowDownRight className="h-3.5 w-3.5 text-[#EF4444] shrink-0" />
                        <span className="text-xs font-bold text-[#111827] w-10 text-right">{k.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Commentary */}
              <div className="xl:col-span-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#111827]">Recent Commentary</h3>
                  <button type="button" className="text-xs font-medium text-[#8B5CF6]">
                    View all
                  </button>
                </div>
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <img src={c.src} alt={c.name} className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#111827]">{c.name}</span>
                          <span className="text-[10px] text-[#9CA3AF]">{c.time}</span>
                          <span className="h-5 px-1.5 rounded-md text-[10px] font-semibold inline-flex items-center" style={{ backgroundColor: c.tagBg, color: c.tagColor }}>
                            {c.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{c.text}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#9CA3AF]">
                          <button type="button" onClick={() => toggleLike(c.id)} className="inline-flex items-center gap-1 hover:text-[#8B5CF6]">
                            <ThumbsUp className="h-3 w-3" /> {c.likes}
                          </button>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {c.replies}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {commentOpen ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      placeholder="Share a performance insight…"
                      className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#C4B5FD] focus:ring-2 focus:ring-[#EDE9FE] resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <PmButton variant="outline" className="flex-1" onClick={() => setCommentOpen(false)}>
                        Cancel
                      </PmButton>
                      <PmButton variant="primary" className="flex-1 !bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={addComment}>
                        Post
                      </PmButton>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCommentOpen(true)}
                    className="mt-3 w-full h-8 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Commentary
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9]">
                <h3 className="text-sm font-semibold text-[#111827]">KPI Performance Details</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center h-9 w-64 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm">
                    <Search className="h-4 w-4 text-[#9CA3AF] mr-2" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Search KPI, owner or department..."
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9CA3AF]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#374151] bg-white"
                  >
                    {["All Status", "On Track", "At Risk", "Off Track"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="h-9 px-3 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] inline-flex items-center gap-1.5 bg-white">
                    <Columns3 className="h-3.5 w-3.5" /> Columns
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[1000px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] bg-[#FAFAFB] border-b border-[#F1F5F9]">
                      {["#", "KPI Name", "Owner", "Department", "Target", "Actual", "Variance", "Trend (vs Jun)", "Status", "Last Updated"].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r.id} className="border-b border-[#F8FAFC] hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-3 py-2 text-[#9CA3AF]">{r.id}</td>
                        <td className="px-3 py-2 font-semibold text-[#111827] whitespace-nowrap">{r.name}</td>
                        <td className="px-3 py-2">
                          <PmAvatar initials={r.owner.slice(0, 2)} name={r.owner} src={r.ownerSrc} size="sm" />
                        </td>
                        <td className="px-3 py-2 text-[#6B7280] whitespace-nowrap">{r.department}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{r.target}</td>
                        <td className="px-3 py-2 font-semibold text-[#111827]">{r.actual}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                              r.variance >= 0 ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"
                            )}
                          >
                            {r.variance >= 0 ? "+" : ""}
                            {r.variance.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Sparkline data={r.spark} up={r.variance >= 0} />
                        </td>
                        <td className="px-3 py-2">
                          <PmStatusPill
                            label={r.status}
                            tone={r.status === "On Track" ? "success" : r.status === "At Risk" ? "warning" : "danger"}
                          />
                        </td>
                        <td className="px-3 py-2 text-[#9CA3AF] whitespace-nowrap">{r.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9]">
                <p className="text-xs text-[#6B7280]">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} KPIs
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "h-8 w-8 rounded-lg text-sm font-semibold",
                        page === n ? "bg-[#8B5CF6] text-white" : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="text-[#9CA3AF] px-1">…</span>}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
