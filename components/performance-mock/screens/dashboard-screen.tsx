"use client"

import { useId, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Download,
  Flag,
  Target,
  Gauge,
  ShieldAlert,
  Network,
  User,
  Rocket,
  Users,
} from "lucide-react"
import { KpiAnalyticsMockScreen } from "@/components/performance-mock/screens/kpi-analytics-screen"
import {
  PmAvatar,
  PmButton,
  PmCard,
  PmFilterSelect,
  PmProgress,
  PmStatusPill,
} from "@/components/performance-mock/primitives"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const PURPLE = "#7C3AED"

const trajectory = [
  { m: "Jan", actual: 58, target: 62 },
  { m: "Feb", actual: 60, target: 65 },
  { m: "Mar", actual: 62, target: 68 },
  { m: "Apr", actual: 64, target: 72 },
  { m: "May", actual: 68, target: 75 },
  { m: "Jun", actual: 74, target: 78 },
  { m: "Jul", actual: 78, target: 82 },
]

const TRAJECTORY_RANGES = ["3 months", "6 months", "12 months"]

function ActualPointLabel({ x, y, value }: { x?: number; y?: number; value?: number | string }) {
  if (x == null || y == null || value == null) return null
  return (
    <text x={x} y={y + 16} textAnchor="middle" fill="#4C1D95" fontSize={10} fontWeight={600}>
      {value}%
    </text>
  )
}

function TargetEndLabel({
  x,
  y,
  value,
  index,
  lastIndex,
}: {
  x?: number
  y?: number
  value?: number | string
  index?: number
  lastIndex: number
}) {
  if (x == null || y == null || value == null || index !== lastIndex) return null
  return (
    <text x={x + 2} y={y - 10} textAnchor="middle" fill="#6D28D9" fontSize={10} fontWeight={600}>
      {value}%
    </text>
  )
}

const healthSlices = [
  { name: "On track", value: 68, color: "#4EBA6F" },
  { name: "At risk", value: 22, color: "#F3A022" },
  { name: "Off track", value: 10, color: "#E05353" },
]

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px] font-bold"
    >
      {value}%
    </text>
  )
}

const teamPerf = [
  { name: "Sales", value: 86, color: "#4EBA6F" },
  { name: "Finance", value: 81, color: "#4EBA6F" },
  { name: "Operations", value: 76, color: "#F3A022" },
  { name: "People", value: 72, color: "#F3A022" },
]

const projects = [
  { name: "Southern Africa Expansion", owner: "Rumbidzai Chaza", due: "30 Sep 2026", progress: 68, status: "On track" as const, icon: Rocket },
  { name: "Performance Review Cycle", owner: "Tatenda Mlambo", due: "15 Aug 2026", progress: 45, status: "At risk" as const, icon: ClipboardCheck },
  { name: "ISO 27001 Readiness", owner: "Farai Muchenje", due: "31 Oct 2026", progress: 82, status: "On track" as const, icon: ShieldAlert },
  { name: "Client Retention Programme", owner: "Chipo Dube", due: "20 Sep 2026", progress: 61, status: "Watch" as const, icon: Users },
]

const upcoming = [
  { date: "18 Jul", title: "Q3 target review", tone: "purple" as const },
  { date: "22 Jul", title: "Executive reviews due", tone: "blue" as const },
  { date: "29 Jul", title: "Strategy check-in", tone: "orange" as const },
  { date: "31 Jul", title: "Timesheet submission", tone: "red" as const },
]

const SPARK = "#7C3AED"
const INK = "#0F172A"

function Sparkline({ points }: { points: number[] }) {
  const gid = useId().replace(/:/g, "")
  const w = 172
  const h = 28
  const padX = 2
  const padY = 3
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const xy = points.map((v, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2)
    const y = h - padY - ((v - min) / span) * (h - padY * 2)
    return [x, y] as const
  })
  const line = xy.map(([x, y]) => `${x},${y}`).join(" ")
  const area = `M ${xy[0][0]},${h} L ${xy.map(([x, y]) => `${x},${y}`).join(" L ")} L ${xy[xy.length - 1][0]},${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2.5 w-full h-7" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SPARK} stopOpacity="0.28" />
          <stop offset="100%" stopColor={SPARK} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <polyline
        fill="none"
        stroke={SPARK}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.55} fill={SPARK} />
      ))}
    </svg>
  )
}

function MetricGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const IconTrendChart = () => (
  <MetricGlyph>
    <path d="M4.5 3.5v14.4a1.6 1.6 0 0 0 1.6 1.6H20.5" />
    <path d="m8 14.6 2.9-3.1 2.3 2.1 4.4-4.9" />
    <path d="M13.9 8.7h3.7v3.7" />
  </MetricGlyph>
)

const IconBullseye = () => (
  <MetricGlyph>
    <circle cx="10.8" cy="13.2" r="7.1" />
    <circle cx="10.8" cy="13.2" r="3.5" />
    <circle cx="10.8" cy="13.2" r="1" fill="currentColor" stroke="none" />
    <path d="M15.9 8.1 20 4" />
    <path d="M17.3 4h2.7v2.7" />
  </MetricGlyph>
)

const IconGaugeDial = () => (
  <MetricGlyph>
    <path d="M3.6 17.8a8.4 8.4 0 1 1 16.8 0" />
    <path d="M6.4 11.6l1 .8M12 8.4v1.4M17.6 11.6l-1 .8" />
    <path d="m12.7 15.9 3.1-3.7" />
    <circle cx="11.7" cy="17" r="1.5" />
  </MetricGlyph>
)

const IconChecklistBox = () => (
  <MetricGlyph>
    <rect x="4.6" y="3.6" width="14.8" height="16.8" rx="3.2" />
    <path d="m8.4 9.4 1.5 1.5 3.1-3.3" />
    <path d="m8.4 15.2 1.5 1.5 3.1-3.3" />
  </MetricGlyph>
)

const IconTwoPeople = () => (
  <MetricGlyph>
    <circle cx="9" cy="8.6" r="3.2" />
    <path d="M3.8 18.6a5.2 5.2 0 0 1 10.4 0" />
    <circle cx="17.2" cy="8.8" r="2.5" />
    <path d="M15.9 18.6h4.7a4.4 4.4 0 0 0-3.1-4.2" />
  </MetricGlyph>
)

const IconUserTrend = () => (
  <MetricGlyph>
    <circle cx="10" cy="8.2" r="3.4" />
    <path d="M4.7 19.4v-.5a5.4 5.4 0 0 1 8.1-4.6" />
    <path d="M11.6 19.4h3.6l2.6-2.6" />
    <path d="M15.2 16.8h2.6v2.6" />
  </MetricGlyph>
)

const metrics: {
  label: string
  value: string
  of?: string
  trend: ReactNode
  icon: ReactNode
  spark: number[]
  goTo: string
}[] = [
  {
    label: "Overall performance",
    value: "78%",
    icon: <IconTrendChart />,
    trend: (
      <span className="inline-flex items-center gap-0.5 text-[#16A34A]">
        <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
        4%
        <span className="ml-0.5 text-[#9CA3AF]">vs June</span>
      </span>
    ),
    spark: [6, 5, 6, 4, 3, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 9],
    goTo: "analytics",
  },
  {
    label: "Goals on track",
    value: "18",
    of: "24",
    icon: <IconBullseye />,
    trend: <span className="text-[#9CA3AF]">75%</span>,
    spark: [5, 6, 5, 4, 5, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 8],
    goTo: "/performance/goals",
  },
  {
    label: "KPIs on target",
    value: "42",
    of: "56",
    icon: <IconGaugeDial />,
    trend: <span className="text-[#F59E0B]">8 need attention</span>,
    spark: [5, 4, 4, 3, 3, 4, 5, 4, 5, 5, 6, 5, 6, 7, 7, 8],
    goTo: "analytics",
  },
  {
    label: "Tasks completed",
    value: "164",
    of: "212",
    icon: <IconChecklistBox />,
    trend: <span className="text-[#9CA3AF]">77%</span>,
    spark: [4, 5, 3, 4, 3, 5, 4, 4, 5, 6, 5, 7, 6, 8, 7, 8],
    goTo: "/performance/tasks",
  },
  {
    label: "Reviews due",
    value: "12",
    icon: <IconTwoPeople />,
    trend: <span className="text-[#DC2626]">3 overdue</span>,
    spark: [5, 4, 6, 3, 4, 5, 3, 6, 4, 5, 7, 4, 5, 4, 5, 6],
    goTo: "/performance/reviews",
  },
  {
    label: "Team utilisation",
    value: "82%",
    icon: <IconUserTrend />,
    trend: <span className="text-[#9CA3AF]">1,248h logged</span>,
    spark: [4, 5, 4, 5, 3, 4, 5, 4, 3, 5, 4, 6, 5, 7, 6, 7],
    goTo: "/performance/timesheets",
  },
]

const COMPANIES = ["Company", "Commercial", "Operations", "People & Culture"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const YEARS = ["2024", "2025", "2026"]

export function DashboardMockScreen() {
  const router = useRouter()
  const [view, setView] = useState<"dashboard" | "analytics">("dashboard")
  const [company, setCompany] = useState("Company")
  const [month, setMonth] = useState("July")
  const [year, setYear] = useState("2026")
  const [trajRange, setTrajRange] = useState("6 months")

  const [activeDialog, setActiveDialog] = useState<"corrective" | "timesheet" | "review" | null>(null)
  const [overdueCount, setOverdueCount] = useState(3)
  const [timesheetCount, setTimesheetCount] = useState(2)
  const [reviewCount, setReviewCount] = useState(5)

  const [correctiveActions, setCorrectiveActions] = useState([
    { id: "ca-1", title: "Complete Q3 Statutory Audit checklists", due: "Due 5 days ago", owner: "Jane Doe", resolved: false },
    { id: "ca-2", title: "Revise Risk Register with department heads", due: "Due 2 days ago", owner: "John Smith", resolved: false },
    { id: "ca-3", title: "Review Supplier SLA contract margins", due: "Due 1 day ago", owner: "Mark Johnson", resolved: false },
  ])

  const [timesheets, setTimesheets] = useState([
    { id: "ts-1", employee: "John Doe", department: "Engineering", hours: 40, weekEnding: "Week ending July 20", status: "pending" },
    { id: "ts-2", employee: "Alice Smith", department: "Marketing", hours: 38, weekEnding: "Week ending July 20", status: "pending" },
  ])

  const [reviews, setReviews] = useState([
    { id: "rev-1", title: "Mid-year Performance Review: Sales Team", due: "Due in 2 days", status: "Pending Feedback" },
    { id: "rev-2", title: "Self-Evaluation: Mark Spencer", due: "Due in 3 days", status: "Draft" },
    { id: "rev-3", title: "Peer Feedback: Sarah Connor", due: "Due in 4 days", status: "Not Started" },
    { id: "rev-4", title: "Manager Sign-off: Alex Johnson", due: "Due in 5 days", status: "Ready for Sign-off" },
    { id: "rev-5", title: "CFO Checkpoint: Global Operations", due: "Due in 5 days", status: "Not Started" },
  ])

  const trajectoryData =
    trajRange === "3 months" ? trajectory.slice(-3) : trajRange === "12 months" ? trajectory : trajectory

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-4">
        {/* Title row — left only (matches client crop) */}
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">Performance Dashboard</h1>
          <p className="mt-0.5 text-xs text-[#6B7280] max-w-2xl">
            Strategy execution, delivery and people performance in one view.
          </p>
        </div>

        {/* Controls row — tabs + filters left, export right */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setView("dashboard")}
                className={cn(
                  "h-8 px-3.5 rounded-full text-xs font-semibold transition-colors",
                  view === "dashboard" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#111827] hover:bg-[#F9FAFB]"
                )}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setView("analytics")}
                className={cn(
                  "h-8 px-3.5 rounded-full text-xs font-semibold transition-colors",
                  view === "analytics" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#111827] hover:bg-[#F9FAFB]"
                )}
              >
                KPI Analytics
              </button>
            </div>
            <PmFilterSelect
              icon={<Building2 className="h-3.5 w-3.5 text-[#6B7280]" />}
              value={company}
              options={COMPANIES}
              onChange={setCompany}
            />
            <PmFilterSelect
              icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
              value={month}
              options={MONTHS}
              onChange={setMonth}
            />
            <PmFilterSelect value={year} options={YEARS} onChange={setYear} />
          </div>
          <PmButton
            variant="outline"
            onClick={() =>
              toast("Snapshot exported", {
                description: `${company} · ${month} ${year} — download started.`,
              })
            }
          >
            <Download className="h-3.5 w-3.5" /> Export snapshot
          </PmButton>
        </div>

        {view === "analytics" ? (
          <KpiAnalyticsMockScreen embedded />
        ) : (
          <>
        {/* Metric strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {metrics.map((m) => (
            <PmCard
              key={m.label}
              className="p-3"
              onClick={() => (m.goTo === "analytics" ? setView("analytics") : router.push(m.goTo))}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-[#F3F0FF] text-[#5B21B6] flex items-center justify-center">
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#4B5563] truncate">{m.label}</p>
                  <p className="mt-0.5 text-xl font-bold tracking-tight leading-tight" style={{ color: INK }}>
                    {m.value}
                    {m.of && (
                      <>
                        <span className="mx-1 text-sm font-normal text-[#9CA3AF]">of</span>
                        {m.of}
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium">{m.trend}</p>
                </div>
              </div>
              <Sparkline points={m.spark} />
            </PmCard>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <PmCard className="xl:col-span-8 p-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Performance trajectory</h3>
              <div className="flex flex-1 items-center justify-center gap-4 text-[11px] text-[#6B7280]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-5 rounded-full bg-[#7C3AED]" />
                  Actual
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0 w-5 border-t-[1.5px] border-dashed border-[#7C3AED]" />
                  Target
                </span>
              </div>
              <PmFilterSelect value={trajRange} options={TRAJECTORY_RANGES} onChange={setTrajRange} />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectoryData} margin={{ top: 18, right: 22, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="trajActualFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.28} />
                      <stop offset="55%" stopColor="#A78BFA" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1.5 4" vertical={false} />
                  <XAxis
                    dataKey="m"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB", length: 4 }}
                    tickMargin={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    label={{
                      value: "%",
                      position: "top",
                      offset: 8,
                      fill: "#9CA3AF",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                    formatter={(value: number, name: string) => [`${value}%`, name === "actual" ? "Actual" : "Target"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="none"
                    fill="url(#trajActualFill)"
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#7C3AED"
                    strokeDasharray="5 4"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: "#FFFFFF", stroke: "#7C3AED", strokeWidth: 1.8 }}
                    activeDot={{ r: 4, fill: "#FFFFFF", stroke: "#7C3AED", strokeWidth: 2 }}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="target"
                      content={(props) => (
                        <TargetEndLabel {...props} lastIndex={trajectoryData.length - 1} />
                      )}
                    />
                  </Line>
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#7C3AED", stroke: "#7C3AED", strokeWidth: 0 }}
                    activeDot={{ r: 4.5, fill: "#7C3AED" }}
                    isAnimationActive={false}
                  >
                    <LabelList dataKey="actual" content={ActualPointLabel} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </PmCard>

          <PmCard className="xl:col-span-4 p-5">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-4">Performance health</h3>
            
            <div className="flex items-center justify-between gap-6">
              {/* Donut Chart */}
              <div className="w-[140px] h-[140px] relative flex items-center justify-center shrink-0">
                <PieChart width={140} height={140}>
                  <Pie
                    data={healthSlices}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={62}
                    paddingAngle={0}
                    labelLine={false}
                    label={renderCustomizedLabel}
                    isAnimationActive={false}
                  >
                    {healthSlices.map((s) => (
                      <Cell key={s.name} fill={s.color} stroke="#FFFFFF" strokeWidth={1.5} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[26px] font-bold text-[#0F172A] leading-none">76</p>
                  <p className="text-[9px] font-semibold text-[#64748B] mt-0.5">Health score</p>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-3.5 pl-2 pr-2">
                {healthSlices.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-[12px] font-medium text-[#475569]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-bold text-[#1E293B]">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] my-4" />

            {/* Bottom Row Stats */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <Target className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#0F172A] leading-tight">24</div>
                  <div className="text-[11px] text-[#64748B]">Goals</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <Gauge className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#0F172A] leading-tight">56</div>
                  <div className="text-[11px] text-[#64748B]">KPIs</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#0F172A] leading-tight">14</div>
                  <div className="text-[11px] text-[#64748B]">Corrective actions</div>
                </div>
              </div>
            </div>
          </PmCard>
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Strategy execution */}
          <PmCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#0F172A]">Strategy execution</h3>
              <button
                type="button"
                className="text-[11px] font-bold text-[#7C3AED] hover:underline"
                onClick={() => toast.message("Redirecting to Strategy Map...")}
              >
                Open strategy map
              </button>
            </div>

            <div className="flex gap-3">
              {/* Left Vertical Connector */}
              <div className="w-8 flex flex-col items-center justify-between py-3 relative shrink-0">
                <div className="absolute top-6 bottom-6 w-[1.5px] border-l-[1.5px] border-dashed border-[#C7D2FE]" />
                
                {/* Company circle */}
                <div className="h-7 w-7 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#6366F1] z-10 shrink-0">
                  <Building2 className="h-3.5 w-3.5" />
                </div>

                {/* Dept circle */}
                <div className="h-7 w-7 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#6366F1] z-10 shrink-0">
                  <Network className="h-3.5 w-3.5" />
                </div>

                {/* Individual circle */}
                <div className="h-7 w-7 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#6366F1] z-10 shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Right side Cards list */}
              <div className="flex-1 space-y-2.5">
                {/* Card 1 */}
                <div className="border border-[#E2E8F0] bg-white rounded-lg p-2.5 flex items-center justify-between shadow-sm min-h-[54px] hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block leading-none">Company goal</span>
                    <span className="text-[12.5px] font-bold text-[#0F172A] mt-1.5 block leading-none">Sustainable growth</span>
                  </div>
                  <span className="text-sm font-bold text-[#4EBA6F]">78%</span>
                </div>

                {/* Card 2 */}
                <div className="border border-[#E2E8F0] bg-white rounded-lg p-2.5 flex items-center justify-between shadow-sm min-h-[54px] hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block leading-none">Department objective</span>
                    <span className="text-[12.5px] font-bold text-[#0F172A] mt-1.5 block leading-none">Expand Southern Africa</span>
                  </div>
                  <span className="text-sm font-bold text-[#F3A022]">64%</span>
                </div>

                {/* Card 3 */}
                <div className="border border-[#E2E8F0] bg-white rounded-lg p-2.5 flex items-center justify-between shadow-sm min-h-[54px] hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block leading-none">Individual goal</span>
                    <span className="text-[12.5px] font-bold text-[#0F172A] mt-1.5 block leading-none">Win 12 enterprise accounts</span>
                  </div>
                  <span className="text-sm font-bold text-[#F3A022]">67%</span>
                </div>
              </div>
            </div>
          </PmCard>

          {/* Priorities & exceptions */}
          <PmCard className="p-5">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-4">Priorities & exceptions</h3>
            
            <div className="space-y-2.5">
              {/* Row 1 */}
              <button
                type="button"
                onClick={() => setActiveDialog("corrective")}
                className="w-full border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white rounded-lg p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="h-7 w-7 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] shrink-0">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#0F172A] w-5 shrink-0">{overdueCount}</span>
                <span className="text-xs font-semibold text-[#475569] flex-1">Overdue corrective actions</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => setView("analytics")}
                className="w-full border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white rounded-lg p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="h-7 w-7 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B] shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#0F172A] w-5 shrink-0">8</span>
                <span className="text-xs font-semibold text-[#475569] flex-1">KPIs below threshold</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => setActiveDialog("timesheet")}
                className="w-full border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white rounded-lg p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="h-7 w-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#0F172A] w-5 shrink-0">{timesheetCount}</span>
                <span className="text-xs font-semibold text-[#475569] flex-1">Timesheets awaiting approval</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => setActiveDialog("review")}
                className="w-full border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white rounded-lg p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="h-7 w-7 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#0F172A] w-5 shrink-0">{reviewCount}</span>
                <span className="text-xs font-semibold text-[#475569] flex-1">Reviews due this week</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
              </button>
            </div>
          </PmCard>

          {/* Team performance */}
          <PmCard className="p-5">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-4">Team performance</h3>
            
            <div className="space-y-2.5">
              {teamPerf.map((t) => (
                <div key={t.name} className="border border-[#E2E8F0] bg-white rounded-lg p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <span className="w-16 text-xs font-bold text-[#475569] leading-none shrink-0">{t.name}</span>
                  <span className="w-10 text-xs font-extrabold text-right shrink-0 leading-none" style={{ color: t.color }}>{t.value}%</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${t.value}%`, background: t.color }} />
                    </div>
                  </div>
                  <span className="w-14 text-right text-[11px] font-extrabold leading-none shrink-0" style={{ color: t.color }}>
                    {t.value >= 80 ? "On track" : "At risk"}
                  </span>
                </div>
              ))}
            </div>
          </PmCard>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          {/* Projects & delivery */}
          <PmCard className="xl:col-span-6 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#0F172A]">Projects & delivery</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#9CA3AF] text-left text-[11px] font-bold">
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Owner</th>
                    <th className="pb-3 font-semibold">Due date</th>
                    <th className="pb-3 font-semibold">Progress</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.name} className="border-t border-[#F1F5F9]">
                      <td className="py-3 pr-2 font-bold text-[#0F172A]">
                        <div className="flex items-center gap-2">
                          <p.icon className="h-4 w-4 text-[#7C3AED] shrink-0" />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-[#475569] font-medium">{p.owner}</td>
                      <td className="py-3 pr-2 text-[#64748B] whitespace-nowrap">{p.due}</td>
                      <td className="py-3 pr-2 min-w-[120px]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-extrabold text-[#0F172A] w-8">{p.progress}%</span>
                          <PmProgress value={p.progress} color="#7C3AED" className="flex-1" />
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <PmStatusPill
                          label={p.status}
                          tone={p.status === "On track" ? "success" : p.status === "At risk" ? "warning" : "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PmCard>

          {/* Review cycle */}
          <PmCard className="xl:col-span-3 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-[#0F172A]">Review cycle</h3>
                <span className="text-[11px] font-semibold text-[#7C3AED]">Q2 Executive Review</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Radial Gauge */}
                <div className="w-[95px] h-[95px] relative flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 36 36" className="h-[95px] w-[95px] -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke={PURPLE}
                      strokeWidth="2.5"
                      strokeDasharray={`${67 * 0.942} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[19px] font-bold text-[#0F172A] leading-none">67%</p>
                    <p className="text-[8px] font-semibold text-[#64748B] mt-1">Complete</p>
                  </div>
                </div>

                {/* Info List */}
                <div className="flex-1 space-y-2.5 pl-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] border-b border-[#F1F5F9] pb-2">
                    <Users className="h-4 w-4 text-[#7C3AED]" />
                    <span>24 <span className="font-medium text-[#64748B]">Employees</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] border-b border-[#F1F5F9] pb-2">
                    <Clock className="h-4 w-4 text-[#7C3AED]" />
                    <span>8 <span className="font-medium text-[#64748B]">Pending</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                    <Calendar className="h-4 w-4 text-[#7C3AED]" />
                    <span><span className="font-bold text-[#0F172A]">Due</span> <span className="font-medium text-[#64748B]">22 Jul 2026</span></span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/performance/reviews")}
              className="mt-5 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs py-2.5 rounded-lg text-center transition-colors"
            >
              Open reviews
            </button>
          </PmCard>

          {/* Upcoming timeline */}
          <PmCard className="xl:col-span-3 p-5">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-4">Upcoming</h3>
            <div className="space-y-2.5 relative">
              {upcoming.map((u, idx) => (
                <div
                  key={u.title}
                  className="border border-[#E2E8F0] bg-white rounded-lg p-2.5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-4 shrink-0">
                      {idx < upcoming.length - 1 && (
                        <div className="absolute top-4 left-1.5 h-[34px] w-[1px] bg-[#C7D2FE] z-0" />
                      )}
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-[#7C3AED] bg-white z-10" />
                    </div>
                    <span className="text-[13px] font-bold text-[#0F172A] w-10 shrink-0">{u.date}</span>
                    <span className="text-xs font-semibold text-[#475569]">{u.title}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
                </div>
              ))}
            </div>
          </PmCard>
        </div>
          </>
        )}
      </div>

      {/* Interactive Exception Dialogs */}
      {activeDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <h3 className="font-bold text-[#0F172A] text-[15px]">
                {activeDialog === "corrective" && "Overdue Corrective Actions"}
                {activeDialog === "timesheet" && "Timesheets Awaiting Approval"}
                {activeDialog === "review" && "Reviews Due This Week"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                className="text-[#94A3B8] hover:text-[#475569] text-xs font-bold px-2 py-1 rounded hover:bg-[#F1F5F9]"
              >
                Close
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[300px] overflow-y-auto space-y-3.5">
              {activeDialog === "corrective" && (
                correctiveActions.length === 0 ? (
                  <p className="text-sm text-[#64748B] text-center py-4">No overdue corrective actions.</p>
                ) : (
                  correctiveActions.map((ca) => (
                    <div key={ca.id} className="flex items-start gap-3 p-3 border border-[#E2E8F0] rounded-lg bg-[#FAF5FF]/30">
                      <input
                        type="checkbox"
                        checked={ca.resolved}
                        onChange={() => {
                          setCorrectiveActions(prev => prev.filter(item => item.id !== ca.id))
                          setOverdueCount(c => c - 1)
                          toast.success("Corrective action resolved")
                        }}
                        className="mt-0.5 rounded border-[#D0D5DD] text-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{ca.title}</h4>
                        <p className="text-[10px] text-[#EF4444] font-semibold mt-0.5">{ca.due} · Owner: {ca.owner}</p>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeDialog === "timesheet" && (
                timesheets.length === 0 ? (
                  <p className="text-sm text-[#64748B] text-center py-4">No timesheets awaiting approval.</p>
                ) : (
                  timesheets.map((ts) => (
                    <div key={ts.id} className="p-3 border border-[#E2E8F0] rounded-lg bg-[#EFF6FF]/20 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-[#0F172A]">{ts.employee}</h4>
                          <p className="text-[10px] text-[#64748B]">{ts.department} · {ts.weekEnding}</p>
                        </div>
                        <span className="text-xs font-bold text-[#3B82F6]">{ts.hours} hrs</span>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setTimesheets(prev => prev.filter(item => item.id !== ts.id))
                            setTimesheetCount(c => c - 1)
                            toast.error(`Timesheet for ${ts.employee} rejected`)
                          }}
                          className="h-7 px-2.5 rounded-md border border-[#FCA5A5] text-[11px] font-bold text-[#DC2626] hover:bg-[#FEF2F2]"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimesheets(prev => prev.filter(item => item.id !== ts.id))
                            setTimesheetCount(c => c - 1)
                            toast.success(`Timesheet for ${ts.employee} approved`)
                          }}
                          className="h-7 px-2.5 rounded-md bg-[#3B82F6] text-[11px] font-bold text-white hover:bg-[#2563EB]"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeDialog === "review" && (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3 border border-[#E2E8F0] rounded-lg bg-white flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">{rev.title}</h4>
                      <p className="text-[10px] text-[#64748B] mt-0.5">{rev.due} · {rev.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success(`Reminder notification sent for "${rev.title}"`)
                      }}
                      className="h-7 px-2.5 rounded-md border border-[#D0D5DD] text-[11px] font-bold text-[#475569] hover:bg-[#F9FAFB] shrink-0"
                    >
                      Remind
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-[#F9FAFB] border-t border-[#F1F5F9] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                className="h-8.5 px-4 rounded-lg bg-[#0F172A] text-xs font-semibold text-white hover:bg-[#1E293B]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
