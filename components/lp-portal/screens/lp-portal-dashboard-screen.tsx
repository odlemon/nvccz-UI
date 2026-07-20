"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Crosshair,
  DollarSign,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Gauge,
  Info,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
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
import { Button } from "@/components/ui/button"
import { useLpPortal } from "@/components/lp-portal/lp-portal-context"
import { cn } from "@/lib/utils"

type ChartPeriod = "SI" | "3Y" | "1Y" | "YTD"

const periods: Array<{ id: ChartPeriod; label: string }> = [
  { id: "SI", label: "Since Inception" },
  { id: "3Y", label: "3Y" },
  { id: "1Y", label: "1Y" },
  { id: "YTD", label: "YTD" },
]

const kpis = [
  {
    label: "Total Commitment",
    value: "$312.50M",
    helper: "18 Investments",
    href: "/lp-portal/investments",
    icon: Gauge,
    iconBg: "bg-[#eaf2ff]",
    iconColor: "text-[#2563eb]",
  },
  {
    label: "Paid-In Capital",
    value: "$156.42M",
    helper: "50.1% of Commitment",
    icon: Crosshair,
    iconBg: "bg-[#eaf2ff]",
    iconColor: "text-[#2563eb]",
  },
  {
    label: "Unfunded Commitment",
    value: "$156.08M",
    helper: "49.9% of Commitment",
    icon: FilePlus2,
    iconBg: "bg-[#eaf2ff]",
    iconColor: "text-[#2563eb]",
  },
  {
    label: "Current NAV",
    value: "$198.76M",
    helper: "1.27x TVPI",
    icon: CircleDollarSign,
    iconBg: "bg-[#f3e8ff]",
    iconColor: "text-[#7c3aed]",
  },
  {
    label: "Distributions",
    value: "$78.34M",
    helper: "0.50x DPI",
    icon: TrendingUp,
    iconBg: "bg-[#fff1e8]",
    iconColor: "text-[#f97316]",
  },
  {
    label: "Net IRR",
    value: "18.7%",
    helper: "Since Inception",
    icon: DollarSign,
    iconBg: "bg-[#e6fbf7]",
    iconColor: "text-[#0d9488]",
  },
] as const

const historyData = [
  { date: "Jun '20", nav: 22, paidIn: 14 },
  { date: "Sep '20", nav: 31, paidIn: 22 },
  { date: "Dec '20", nav: 42, paidIn: 30 },
  { date: "Mar '21", nav: 55, paidIn: 38 },
  { date: "Jun '21", nav: 68, paidIn: 46 },
  { date: "Sep '21", nav: 82, paidIn: 55 },
  { date: "Dec '21", nav: 96, paidIn: 64 },
  { date: "Mar '22", nav: 108, paidIn: 74 },
  { date: "Jun '22", nav: 118, paidIn: 82 },
  { date: "Sep '22", nav: 128, paidIn: 90 },
  { date: "Dec '22", nav: 124, paidIn: 96 },
  { date: "Mar '23", nav: 138, paidIn: 104 },
  { date: "Jun '23", nav: 146, paidIn: 110 },
  { date: "Sep '23", nav: 152, paidIn: 118 },
  { date: "Dec '23", nav: 158, paidIn: 126 },
  { date: "Mar '24", nav: 176, paidIn: 132 },
  { date: "Jun '24", nav: 182, paidIn: 138 },
  { date: "Sep '24", nav: 196, paidIn: 144 },
  { date: "Dec '24", nav: 188, paidIn: 150 },
  { date: "Mar '25", nav: 202, paidIn: 154 },
  { date: "May '25", nav: 198.76, paidIn: 156.42 },
]

const historyTicks = ["Jun '20", "Dec '20", "Jun '21", "Dec '21", "Jun '22", "Dec '22", "Jun '23", "Dec '23", "Jun '24", "Dec '24", "May '25"]

const accountTrend = [
  { date: "Jun '22", value: 8.45 },
  { date: "Aug '22", value: 8.72 },
  { date: "Oct '22", value: 8.68 },
  { date: "Dec '22", value: 8.91 },
  { date: "Feb '23", value: 8.83 },
  { date: "Apr '23", value: 9.04 },
  { date: "Jun '23", value: 8.58 },
  { date: "Aug '23", value: 8.52 },
  { date: "Oct '23", value: 8.76 },
  { date: "Dec '23", value: 8.69 },
  { date: "Feb '24", value: 8.72 },
  { date: "Apr '24", value: 8.93 },
  { date: "Jun '24", value: 9.16 },
  { date: "Aug '24", value: 8.96 },
  { date: "Oct '24", value: 9.27 },
  { date: "Dec '24", value: 9.08 },
  { date: "Feb '25", value: 9.24 },
  { date: "Apr '25", value: 9.35 },
  { date: "May '25", value: 9.9987 },
]

const capitalPosition = [
  { name: "Paid-In Capital", value: 156.42, display: "$156.42M", percent: "50.1%", color: "#1a56db" },
  { name: "Unfunded Commitment", value: 156.08, display: "$156.08M", percent: "49.9%", color: "#2dd4bf" },
  { name: "Distributed", value: 78.34, display: "$78.34M", percent: "25.1%", color: "#bfdbfe" },
  { name: "Remaining Value", value: 120.42, display: "$120.42M", percent: "38.5%", color: "#9ca3af" },
]

const recentActivity = [
  { type: "Capital Call", fund: "Arcus Growth Fund V, L.P.", amount: "$3,250,000", date: "May 28, 2025", direction: "down" as const },
  { type: "Distribution", fund: "Arcus Buyout Fund IV, L.P.", amount: "$1,875,000", date: "May 23, 2025", direction: "up" as const },
  { type: "Capital Call", fund: "Arcus Infrastructure Fund II, L.P.", amount: "$2,100,000", date: "May 21, 2025", direction: "down" as const },
  { type: "Distribution", fund: "Arcus Credit Opportunities Fund", amount: "$950,000", date: "May 19, 2025", direction: "up" as const },
  { type: "Distribution", fund: "Arcus Growth Fund V, L.P.", amount: "$1,420,000", date: "May 15, 2025", direction: "up" as const },
]

const actions = [
  { title: "Capital Call Due", fund: "Arcus Growth Fund V, L.P.", label: "$3,250,000", due: "Due Jun 05, 2025", href: "/lp-portal/capital-activity", icon: ArrowDownToLine, tone: "red" as const },
  { title: "Subscription Document", fund: "Arcus Co-Investment Fund I, L.P.", label: "Review & Sign", due: "Due Jun 07, 2025", href: "/lp-portal/documents", icon: FileCheck2, tone: "orange" as const },
  { title: "KYC Update Required", fund: "Arcus Capital Partners LP", label: "Update", due: "Due Jun 15, 2025", href: "/lp-portal/settings", icon: ShieldCheck, tone: "blue" as const },
]

const documents = [
  { name: "Arcus Growth Fund V – Q1 2025 Report", date: "May 20, 2025", type: "Report" },
  { name: "Notice: Holiday Schedule – Jun 2025", date: "May 16, 2025", type: "Notice" },
  { name: "Arcus Buyout Fund IV – Annual Report 2024", date: "May 12, 2025", type: "Report" },
]

function Panel({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  )
}

function PanelHeader({
  title,
  subtitle,
  action,
  badge,
}: {
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="flex min-h-10 items-start justify-between gap-3 px-3.5 pt-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-[#111827]">
          {title}
          <span className="flex size-3.5 items-center justify-center rounded-full border border-[#d1d5db] text-[9px] font-medium text-[#9ca3af]">
            i
          </span>
          {badge}
        </h2>
        {subtitle && <div className="mt-0.5 text-[12px] text-[#6b7280]">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

function SmallLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-[#2563eb] hover:text-blue-700">
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  )
}

function downloadMockDocument(document: (typeof documents)[number]) {
  const body = `${document.name}\nPublished: ${document.date}\nType: ${document.type}\n\nMock LP Portal document.`
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }))
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = `${document.name.replace(/[^\w -]/g, "")}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

function EndValueLabel({
  x,
  y,
  value,
  index,
  lastIndex,
  fill,
  textFill = "#fff",
}: {
  x?: number | string
  y?: number | string
  value?: number | string
  index?: number
  lastIndex: number
  fill: string
  textFill?: string
}) {
  if (index !== lastIndex || x == null || y == null || value == null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  const label = `$${numeric.toFixed(2)}M`
  const width = 62
  const height = 20
  const px = Number(x)
  const py = Number(y)
  return (
    <g transform={`translate(${px + 8}, ${py - height / 2})`}>
      <rect width={width} height={height} rx={4} fill={fill} />
      <text x={width / 2} y={height / 2 + 3.5} textAnchor="middle" fill={textFill} fontSize={9} fontWeight={700}>
        {label}
      </text>
    </g>
  )
}

export function LpPortalDashboardScreen() {
  const { selectedFund, asOfDate } = useLpPortal()
  const [period, setPeriod] = React.useState<ChartPeriod>("SI")

  const visibleChartData = React.useMemo(() => {
    if (period === "YTD") return historyData.slice(-3)
    if (period === "1Y") return historyData.slice(-6)
    if (period === "3Y") return historyData.slice(-13)
    return historyData
  }, [period])

  const lastIndex = visibleChartData.length - 1

  const formattedDate = React.useMemo(
    () => new Date(`${asOfDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    [asOfDate],
  )

  React.useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : ""
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }))
    }
  }, [])

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">
          {selectedFund ? selectedFund.shortName : "Dashboard"}
        </h1>
        <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
          {selectedFund
            ? `Overview of your investment in ${selectedFund.name}`
            : "Overview of your investments and accounts"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const helperClassName = "mt-3 text-[12px] font-medium leading-4 text-[#2563eb]"
          const helper = "href" in kpi && kpi.href ? (
            <Link href={kpi.href} className={cn(helperClassName, "hover:text-blue-700")}>
              {kpi.helper}
            </Link>
          ) : (
            <p className={helperClassName}>{kpi.helper}</p>
          )

          return (
            <Panel key={kpi.label} className="min-h-[118px] px-4 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", kpi.iconBg, kpi.iconColor)}>
                    <Icon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <span className="truncate text-[13px] font-medium leading-4 text-[#475569]">{kpi.label}</span>
                </div>
                <button
                  type="button"
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[#94a3b8] transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label={`${kpi.label} information`}
                  title={kpi.label}
                >
                  <Info className="size-3.5" strokeWidth={2} />
                </button>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-7 tracking-[-0.03em] text-[#0f172a]">{kpi.value}</p>
              {helper}
            </Panel>
          )
        })}
      </div>

      <div className="grid gap-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold leading-5 text-[#0f172a]">
                Investment Value History
                <button
                  type="button"
                  className="flex size-4 items-center justify-center rounded-full text-[#94a3b8] hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Investment value history information"
                  title="Investment Value History"
                >
                  <Info className="size-3.5" strokeWidth={2} />
                </button>
              </h2>
              <p className="mt-1 text-[11px] leading-4 text-[#64748b]">
                Since Inception <span className="mx-1 text-[#cbd5e1]">•</span> As of {formattedDate}{" "}
                <span className="mx-1 text-[#cbd5e1]">•</span> Valuation:{" "}
                <span className="font-semibold text-[#334155]">FINAL</span>
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white p-0.5">
              {periods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={cn(
                    "h-7 rounded-full px-3 text-[11px] font-medium transition-colors",
                    period === item.id
                      ? "border border-[#93c5fd] bg-[#eff6ff] text-[#2563eb]"
                      : "border border-transparent text-[#64748b] hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-5 px-4 text-[11px] text-[#64748b]">
            <span className="flex items-center gap-2">
              <i className="h-[2px] w-4 rounded-full bg-[#1d4ed8]" />
              NAV
            </span>
            <span className="flex items-center gap-2">
              <i className="w-4 border-t-2 border-dashed border-[#38bdf8]" />
              Paid-In Capital
            </span>
          </div>

          <div className="mt-1 h-[250px] w-full px-1 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={visibleChartData} margin={{ top: 12, right: 74, left: 2, bottom: 4 }}>
                <defs>
                  <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.14} />
                    <stop offset="55%" stopColor="#2563eb" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="0" />
                <XAxis
                  dataKey="date"
                  ticks={historyTicks.filter((tick) => visibleChartData.some((point) => point.date === tick))}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 250]}
                  ticks={[0, 50, 100, 150, 200, 250]}
                  tickFormatter={(value) => (value === 0 ? "$0" : `$${value}M`)}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${Number(value).toFixed(2)}M`,
                    name === "nav" ? "NAV" : "Paid-In Capital",
                  ]}
                  labelStyle={{ color: "#64748b", fontSize: 11 }}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#e2e8f0",
                    fontSize: 11,
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Area type="monotone" dataKey="nav" fill="url(#historyFill)" stroke="none" isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="nav"
                  name="nav"
                  stroke="#1d4ed8"
                  strokeWidth={2.25}
                  dot={false}
                  activeDot={{ r: 4, fill: "#1d4ed8", stroke: "#fff", strokeWidth: 2 }}
                >
                  <LabelList
                    dataKey="nav"
                    content={(props) => (
                      <EndValueLabel {...props} lastIndex={lastIndex} fill="#1d4ed8" />
                    )}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="paidIn"
                  name="paidIn"
                  stroke="#38bdf8"
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3.5, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
                >
                  <LabelList
                    dataKey="paidIn"
                    content={(props) => (
                      <EndValueLabel {...props} lastIndex={lastIndex} fill="#7dd3fc" textFill="#0c4a6e" />
                    )}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="px-4 pb-4 pt-1">
            <SmallLink href="/lp-portal/performance">View Performance</SmallLink>
          </div>
        </Panel>

        <Panel id="open-ended-account" className="min-h-[318px]">
          <PanelHeader
            title="Open-Ended / Hedge Fund Account"
            action={<span className="pt-0.5 text-[12px] text-[#6b7280]">As of {formattedDate}</span>}
          />
          <div className="mx-3.5 mt-1 grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-100 pb-3">
            <div className="pr-3">
              <p className="text-[8px] font-medium text-slate-600">Account Value</p>
              <p className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-slate-900">$24.68M</p>
            </div>
            <div className="px-3">
              <p className="text-[8px] font-medium text-slate-600">Units Held</p>
              <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-slate-900">2,468,311.45</p>
            </div>
            <div className="pl-3">
              <p className="text-[8px] font-medium text-slate-600">NAV Per Unit</p>
              <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-slate-900">$9.9987</p>
            </div>
          </div>
          <div className="h-[198px] px-1 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accountTrend} margin={{ top: 8, right: 16, left: -7, bottom: 0 }}>
                <defs>
                  <linearGradient id="accountFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf1f5" />
                <XAxis dataKey="date" interval={3} tick={{ fontSize: 8, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis
                  domain={[6, 12]}
                  ticks={[6, 8, 10, 12]}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  tick={{ fontSize: 8, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  formatter={(value: number) => [`$${Number(value).toFixed(4)}`, "NAV Per Unit"]}
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 10 }}
                />
                <Area type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={2} fill="url(#accountFill)" dot={false} activeDot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-3.5 pb-3">
            <SmallLink href="/lp-portal/account-activity?structure=open-ended">View Account Details</SmallLink>
          </div>
        </Panel>
      </div>

      <div className="grid gap-2.5 xl:grid-cols-3">
        <Panel id="capital-position">
          <div className="px-4 pt-3.5">
            <h2 className="flex items-center gap-1.5 text-[14px] font-semibold leading-5 text-[#0f172a]">
              Capital Position
              <button
                type="button"
                className="flex size-4 items-center justify-center rounded-full text-[#94a3b8] hover:bg-slate-100 hover:text-slate-600"
                aria-label="Capital position information"
                title="Capital Position"
              >
                <Info className="size-3.5" strokeWidth={2} />
              </button>
            </h2>
            <p className="mt-0.5 text-[11px] leading-4 text-[#64748b]">As of {formattedDate}</p>
          </div>

          <div className="flex items-center gap-3 px-3 pb-2 pt-3">
            <div className="relative h-[148px] w-[148px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capitalPosition}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={1.5}
                    stroke="#fff"
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {capitalPosition.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, item) => [
                      `$${Number(value).toFixed(2)}M`,
                      (item?.payload as (typeof capitalPosition)[number])?.name ?? "Value",
                    ]}
                    contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] leading-3 text-[#64748b]">Total Commitment</span>
                <span className="mt-1 text-[16px] font-bold leading-5 tracking-[-0.02em] text-[#0f172a]">$312.50M</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {capitalPosition.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="flex w-full items-start gap-2 rounded-md text-left transition-colors hover:bg-slate-50"
                  title={`${item.name}: ${item.display}`}
                >
                  <i className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] leading-4 text-[#334155]">{item.name}</span>
                    <span className="mt-0.5 block text-[12px] font-semibold leading-4 text-[#0f172a]">
                      {item.display}{" "}
                      <span className="font-normal text-[#94a3b8]">({item.percent})</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-3.5 pt-1">
            <SmallLink href="/lp-portal/capital-activity">View Capital Summary</SmallLink>
          </div>
        </Panel>

        <Panel className="min-h-[288px]">
          <PanelHeader
            title="Recent Capital Activity"
            action={
              <Link
                href="/lp-portal/account-activity"
                className="text-[12px] font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
              >
                View All
              </Link>
            }
          />
          <div className="mt-1 divide-y divide-[#f3f4f6]">
            {recentActivity.map((activity) => (
              <Link
                key={`${activity.type}-${activity.fund}-${activity.date}`}
                href="/lp-portal/capital-activity"
                className="group flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f9fafb]"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    activity.direction === "down" ? "bg-[#dbeafe] text-[#2563eb]" : "bg-[#dcfce7] text-[#16a34a]",
                  )}
                >
                  {activity.direction === "down" ? (
                    <ArrowDownToLine className="size-3.5" />
                  ) : (
                    <ArrowUpRight className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-[#111827]">{activity.type}</span>
                  <span className="block truncate text-[11px] text-[#6b7280]">{activity.fund}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[12px] font-semibold text-[#111827]">{activity.amount}</span>
                  <span className="block text-[11px] text-[#9ca3af]">{activity.date}</span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-[#cbd5e1] group-hover:text-[#2563eb]" />
              </Link>
            ))}
          </div>
          <div className="px-4 pb-3.5 pt-2">
            <SmallLink href="/lp-portal/account-activity">View All Activity</SmallLink>
          </div>
        </Panel>

        <div className="grid min-h-[288px] gap-4">
          <Panel>
            <PanelHeader
              title="Actions Required"
              badge={
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
                  {actions.length}
                </span>
              }
              action={
                <Link
                  href="/lp-portal/requests"
                  className="text-[12px] font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                >
                  View All
                </Link>
              }
            />
            <div className="divide-y divide-[#f3f4f6]">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f9fafb]"
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        action.tone === "red"
                          ? "bg-red-50 text-red-500"
                          : action.tone === "orange"
                            ? "bg-orange-50 text-orange-500"
                            : "bg-blue-50 text-blue-600",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-[#111827]">{action.title}</span>
                      <span className="block truncate text-[11px] text-[#6b7280]">{action.fund}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[12px] font-semibold text-[#111827]">{action.label}</span>
                      <span className="block text-[11px] font-medium text-[#dc2626]">{action.due}</span>
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-[#cbd5e1] group-hover:text-[#2563eb]" />
                  </Link>
                )
              })}
            </div>
          </Panel>

          <Panel id="notices">
            <PanelHeader
              title="Latest Documents & Notices"
              action={
                <Link
                  href="/lp-portal/notices"
                  className="text-[12px] font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                >
                  View All
                </Link>
              }
            />
            <div className="divide-y divide-[#f3f4f6]">
              {documents.map((document) => (
                <div key={document.name} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb]">
                    <FileText className="size-3.5" />
                  </span>
                  <Link
                    href={document.type === "Notice" ? "/lp-portal/notices" : "/lp-portal/documents"}
                    className="min-w-0 flex-1 hover:text-[#2563eb]"
                  >
                    <span className="block truncate text-[12px] font-semibold text-[#111827]">
                      {document.name}
                    </span>
                    <span className="block text-[11px] text-[#9ca3af]">
                      {document.date} <span className="mx-1">·</span> {document.type}
                    </span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadMockDocument(document)}
                    className="size-8 shrink-0 rounded-full text-[#2563eb] hover:bg-[#eff6ff]"
                    aria-label={`Download ${document.name}`}
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
