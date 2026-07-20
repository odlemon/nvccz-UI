"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Coins,
  Crosshair,
  DollarSign,
  Download,
  FileDown,
  FileText,
  Info,
  Landmark,
  SlidersHorizontal,
} from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ChartPeriod = "SI" | "1Y" | "3Y" | "5Y" | "10Y" | "MAX"
type BenchmarkMetric = "Net IRR" | "TVPI"

const AS_OF = "May 31, 2025"

const historyFull = [
  { label: "Jun '20", nav: 28, paidIn: 32, dist: 0 },
  { label: "Dec '20", nav: 38, paidIn: 42, dist: 2 },
  { label: "Jun '21", nav: 52, paidIn: 58, dist: 6 },
  { label: "Dec '21", nav: 68, paidIn: 74, dist: 12 },
  { label: "Jun '22", nav: 86, paidIn: 92, dist: 20 },
  { label: "Dec '22", nav: 104, paidIn: 110, dist: 30 },
  { label: "Jun '23", nav: 128, paidIn: 125, dist: 42 },
  { label: "Dec '23", nav: 148, paidIn: 138, dist: 54 },
  { label: "Jun '24", nav: 168, paidIn: 148, dist: 64 },
  { label: "Dec '24", nav: 182, paidIn: 152, dist: 72 },
  { label: "May '25", nav: 198.76, paidIn: 156.42, dist: 78.34 },
]

const benchmarkBars = [
  { name: "Arcus Growth Fund V L.P.", value: 18.7, fill: "#0055d4" },
  { name: "Cambridge Associates U.S. PE Index", value: 14.2, fill: "#06b6d4" },
  { name: "Russell 3000 Index", value: 12.7, fill: "#8b5cf6" },
  { name: "S&P 500 Index", value: 11.9, fill: "#f97316" },
]

const capitalFlow = [
  { name: "Paid-In Capital", value: -156.42, fill: "#0046b5", kind: "paidIn" },
  { name: "Capital Calls", value: -156.42, fill: "#00aeef", kind: "inflow" },
  { name: "Distributions", value: 78.34, fill: "#34a853", kind: "outflow" },
  { name: "Current NAV", value: 198.76, fill: "#0046b5", kind: "nav" },
]

const fundRows = [
  {
    fund: "Arcus Growth Fund V L.P.",
    structure: "Closed-End",
    netIrr: "18.7%",
    tvpi: "1.27x",
    nav: "$198.76M",
    benchmark: "CA U.S. PE Index",
    asOf: "May 31, 2025",
  },
  {
    fund: "Arcus Growth Fund IV L.P.",
    structure: "Closed-End",
    netIrr: "22.1%",
    tvpi: "1.45x",
    nav: "$142.38M",
    benchmark: "CA U.S. PE Index",
    asOf: "May 31, 2025",
  },
  {
    fund: "Arcus Opportunities Fund II L.P.",
    structure: "Closed-End",
    netIrr: "16.3%",
    tvpi: "1.18x",
    nav: "$67.29M",
    benchmark: "CA U.S. PE Index",
    asOf: "May 31, 2025",
  },
  {
    fund: "Arcus Credit Opportunities Fund II L.P.",
    structure: "Credit",
    netIrr: "9.8%",
    tvpi: "1.09x",
    nav: "$95.00M",
    benchmark: "CA U.S. Direct Lending Index",
    asOf: "May 31, 2025",
  },
  {
    fund: "Arcus Strategic Income Fund L.P.",
    structure: "Open-End",
    netIrr: "8.6%",
    tvpi: "—",
    nav: "$24.68M",
    benchmark: "HFRI Fund Weighted Comp. Index",
    asOf: "May 31, 2025",
  },
]

function moneyM(value: number) {
  return `$${value.toFixed(2)}M`
}

function InfoHint({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={cn("rounded-full text-[#94a3b8] hover:text-[#64748b]", className)}
      aria-label={`${label} info`}
      onClick={() => toast.message(label)}
    >
      <Info className="size-3.5" />
    </button>
  )
}

function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  helper,
  trend,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  helper: string
  trend?: boolean
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            iconBg,
            iconColor,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <p className="truncate text-[12px] font-semibold text-[#0f172a]">{label}</p>
              <InfoHint label={label} />
            </div>
            {trend && (
              <ArrowUp className="mt-0.5 size-3.5 shrink-0 text-[#10b981]" strokeWidth={2.75} />
            )}
          </div>
          <p className="mt-1.5 text-[20px] font-bold leading-6 tracking-[-0.03em] tabular-nums text-[#0f172a]">
            {value}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[#94a3b8]">{helper}</p>
        </div>
      </div>
    </div>
  )
}

function formatCapitalY(v: number) {
  if (v === 0) return "$0"
  if (v < 0) return `($${Math.abs(v)}M)`
  return `$${v}M`
}

function CapitalAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number
  y?: number
  payload?: { value?: string }
}) {
  const name = payload?.value ?? ""
  const lines =
    name === "Paid-In Capital"
      ? ["Paid-In", "Capital"]
      : name === "Capital Calls"
        ? ["Capital", "Calls"]
        : name === "Current NAV"
          ? ["Current", "NAV"]
          : [name]
  return (
    <text x={x} y={y + 8} textAnchor="middle" fill="#6b7280" fontSize={10}>
      {lines.map((line, i) => (
        <tspan key={`${name}-${line}`} x={x} dy={i === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function CapitalBarLabel({
  x,
  y,
  width,
  height,
  value,
}: {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
}) {
  if (x == null || y == null || width == null || value == null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  const px = Number(x)
  const py = Number(y)
  const pw = Number(width)
  const ph = Math.abs(Number(height ?? 0))
  const label = numeric < 0 ? `($${Math.abs(numeric).toFixed(2)}M)` : `$${numeric.toFixed(2)}M`
  const labelY = numeric < 0 ? py + ph + 14 : py - 8
  return (
    <text
      x={px + pw / 2}
      y={labelY}
      textAnchor="middle"
      fill="#111827"
      fontSize={11}
      fontWeight={700}
    >
      {label}
    </text>
  )
}

function EndLabel({
  x,
  y,
  value,
  index,
  lastIndex,
  fill,
  textFill = "#ffffff",
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
  const width = 58
  const height = 18
  return (
    <g transform={`translate(${Number(x) + 8}, ${Number(y) - height / 2})`}>
      <rect width={width} height={height} rx={4} fill={fill} />
      <text
        x={width / 2}
        y={height / 2 + 3.5}
        textAnchor="middle"
        fill={textFill}
        fontSize={9}
        fontWeight={700}
      >
        {moneyM(numeric)}
      </text>
    </g>
  )
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  )
}

export function LpPerformanceScreen() {
  const [fund, setFund] = React.useState("growth-v")
  const [period, setPeriod] = React.useState("si")
  const [benchmark, setBenchmark] = React.useState("cambridge")
  const [chartPeriod, setChartPeriod] = React.useState<ChartPeriod>("SI")
  const [benchMetric, setBenchMetric] = React.useState<BenchmarkMetric>("Net IRR")

  const chartData = React.useMemo(() => {
    if (chartPeriod === "1Y") return historyFull.slice(-4)
    if (chartPeriod === "3Y") return historyFull.slice(-7)
    if (chartPeriod === "5Y") return historyFull.slice(-9)
    return historyFull
  }, [chartPeriod])

  const lastIndex = chartData.length - 1

  const downloadReport = () => {
    const body = [
      "Arcus Investor Performance Report",
      `As of: ${AS_OF}`,
      "Valuation Status: FINAL",
      "Mock report — LP Portal.",
    ].join("\n")
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "lp-performance-report.txt"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Performance report downloaded (mock).")
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Performance</h1>
        <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
          Measure long-term value creation and investor returns across your private markets portfolio.
        </p>
      </div>

      {/* Filters — labels above, valuation status card on the right */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto] lg:items-end">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#374151]">
            Fund / Account
          </label>
          <Select value={fund} onValueChange={setFund}>
            <SelectTrigger className="h-10 w-full rounded-lg border-[#e5e7eb] bg-white text-[13px] text-[#0f172a] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="growth-v">Arcus Growth Fund V L.P.</SelectItem>
              <SelectItem value="buyout-iv">Arcus Buyout Fund IV, L.P.</SelectItem>
              <SelectItem value="all">All Funds</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#374151]">Period</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-10 w-full rounded-lg border-[#e5e7eb] bg-white text-[13px] text-[#0f172a] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Since Inception</SelectItem>
              <SelectItem value="5y">5 Years</SelectItem>
              <SelectItem value="3y">3 Years</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#374151]">Benchmark</label>
          <Select value={benchmark} onValueChange={setBenchmark}>
            <SelectTrigger className="h-10 w-full rounded-lg border-[#e5e7eb] bg-white text-[13px] text-[#0f172a] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cambridge">Cambridge Associates U.S. PE Index</SelectItem>
              <SelectItem value="sp500">S&P 500</SelectItem>
              <SelectItem value="russell">Russell 3000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex h-10 min-w-[148px] flex-col justify-center rounded-lg border border-[#e5e7eb] bg-white px-3.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
            Valuation Status
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-bold text-[#0f172a]">
            <span className="size-2 shrink-0 rounded-full bg-[#10b981]" />
            FINAL
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<DollarSign className="size-4" strokeWidth={2.25} />}
          iconBg="bg-[#dcfce7]"
          iconColor="text-[#16a34a]"
          label="Net IRR"
          value="18.7%"
          helper="Since Inception"
          trend
        />
        <KpiCard
          icon={<BarChart3 className="size-4" strokeWidth={2.25} />}
          iconBg="bg-[#ffedd5]"
          iconColor="text-[#ea580c]"
          label="TVPI"
          value="1.27x"
          helper="Since Inception"
          trend
        />
        <KpiCard
          icon={<Coins className="size-4" strokeWidth={2.25} />}
          iconBg="bg-[#dbeafe]"
          iconColor="text-[#2563eb]"
          label="DPI"
          value="0.50x"
          helper="Since Inception"
          trend
        />
        <KpiCard
          icon={<SlidersHorizontal className="size-4" strokeWidth={2.25} />}
          iconBg="bg-[#ffedd5]"
          iconColor="text-[#ea580c]"
          label="RVPI"
          value="0.77x"
          helper="Since Inception"
          trend
        />
        <KpiCard
          icon={<Crosshair className="size-4" strokeWidth={2.25} />}
          iconBg="bg-[#dbeafe]"
          iconColor="text-[#2563eb]"
          label="Current NAV"
          value="$198.76M"
          helper={`As of ${AS_OF}`}
        />
        <KpiCard
          icon={<Landmark className="size-4" strokeWidth={2.25} />}
          iconBg="bg-[#dbeafe]"
          iconColor="text-[#1d4ed8]"
          label="Paid-In Capital"
          value="$156.42M"
          helper="Since Inception"
        />
      </div>

      {/* Open-ended metrics */}
      <section className="rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-semibold text-[#0f172a]">
              Open-Ended / Hedge Fund Account Metrics
            </h2>
            <InfoHint label="Open-Ended Metrics" />
          </div>
          <span className="shrink-0 text-[12px] text-[#9ca3af]">As of {AS_OF}</span>
        </div>
        <div className="mt-4 grid gap-0 border-t border-[#f3f4f6] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "YTD Return", value: "8.6%", helper: "Year to Date", trend: true },
            { label: "NAV per Unit", value: "$10.4539", helper: `As of ${AS_OF}` },
            { label: "Units Held", value: "2,468,311.45", helper: `As of ${AS_OF}` },
            { label: "Account Value", value: "$24.68M", helper: `As of ${AS_OF}` },
          ].map((item, i) => (
            <div
              key={item.label}
              className={cn(
                "px-5 py-4",
                i > 0 && "lg:border-l lg:border-[#e5e7eb]",
                i % 2 === 1 && "sm:border-l sm:border-[#e5e7eb]",
              )}
            >
              <div className="flex items-center gap-1">
                <p className="text-[12px] font-medium text-[#6b7280]">{item.label}</p>
                <InfoHint label={item.label} />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[20px] font-bold tabular-nums tracking-[-0.03em] text-[#0f172a]">
                {item.value}
                {item.trend && (
                  <ArrowUp className="size-3.5 text-[#10b981]" strokeWidth={2.75} />
                )}
              </p>
              <p className="mt-1 text-[11px] text-[#9ca3af]">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts row */}
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <section className="flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[14px] font-semibold text-[#111827]">Performance History</h2>
                <InfoHint label="Performance History" />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-[#6b7280]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-4 rounded-full bg-[#0055d4]" />
                  NAV
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t-2 border-dashed border-[#49b2e1]" />
                  Cumulative Paid-In
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-4 rounded-full bg-[#10b981]" />
                  Distributions
                </span>
              </div>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
              {(["SI", "1Y", "3Y", "5Y", "10Y", "MAX"] as ChartPeriod[]).map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChartPeriod(p)}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-semibold transition",
                    i > 0 && "border-l border-[#e5e7eb]",
                    chartPeriod === p
                      ? "bg-[#e8f0fe] text-[#0055d4]"
                      : "bg-white text-[#4b5563] hover:bg-[#f9fafb]",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-1 h-[300px] min-h-0 flex-1 px-2 pb-1 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 18, right: 78, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="perfNavFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0055d4" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#0055d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 250]}
                  ticks={[0, 50, 100, 150, 200, 250]}
                  tickFormatter={(v) => (v === 0 ? "$0" : `$${v}M`)}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  label={{
                    value: "USD (Millions)",
                    position: "insideTopLeft",
                    offset: 0,
                    dy: -12,
                    style: { fontSize: 10, fill: "#9ca3af" },
                  }}
                />
                <RechartsTooltip
                  formatter={(value: number, name: string) => [moneyM(value), name]}
                  contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="nav"
                  stroke="none"
                  fill="url(#perfNavFill)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="nav"
                  name="NAV"
                  stroke="#0055d4"
                  strokeWidth={2.25}
                  dot={false}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="nav"
                    content={(props) => (
                      <EndLabel {...props} lastIndex={lastIndex} fill="#0055d4" />
                    )}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="paidIn"
                  name="Cumulative Paid-In"
                  stroke="#49b2e1"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="paidIn"
                    content={(props) => (
                      <EndLabel
                        {...props}
                        lastIndex={lastIndex}
                        fill="#dbeafe"
                        textFill="#1d4ed8"
                      />
                    )}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="dist"
                  name="Distributions"
                  stroke="#10b981"
                  strokeWidth={2.25}
                  dot={false}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="dist"
                    content={(props) => (
                      <EndLabel {...props} lastIndex={lastIndex} fill="#10b981" />
                    )}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto px-5 pb-4 pt-1">
            <SectionLink href="/lp-portal/account-activity">View Full Performance Details</SectionLink>
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-2 px-5 pt-5">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[14px] font-semibold text-[#111827]">Benchmark Comparison</h2>
              <InfoHint label="Benchmark Comparison" />
            </div>
            <Select
              value={benchMetric}
              onValueChange={(v) => setBenchMetric(v as BenchmarkMetric)}
            >
              <SelectTrigger className="h-8 w-[104px] rounded-md border-[#e5e7eb] bg-white text-[12px] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Net IRR">Net IRR</SelectItem>
                <SelectItem value="TVPI">TVPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col px-5">
            <div className="flex flex-1 flex-col justify-center gap-5">
              {benchmarkBars.map((row) => (
                <div key={row.name} className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="inline-flex min-w-0 items-center gap-2 text-[#374151]">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.fill }}
                      />
                      <span
                        className={cn(
                          "truncate",
                          row.name.startsWith("Arcus") ? "font-semibold text-[#111827]" : "",
                        )}
                      >
                        {row.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-[#111827]">
                      {row.value}%
                    </span>
                  </div>
                  <div className="relative h-3.5">
                    <div className="absolute inset-0 flex">
                      {[0, 1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="h-full flex-1 border-l border-[#f3f4f6] first:border-l-0"
                        />
                      ))}
                    </div>
                    <div
                      className="relative h-full rounded-full"
                      style={{
                        width: `${(row.value / 30) * 100}%`,
                        backgroundColor: row.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-transparent pt-1">
              <div className="flex justify-between px-0.5 text-[10px] text-[#9ca3af]">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
                <span>30%</span>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#9ca3af]">Since Inception</p>
            </div>
          </div>

          <div className="mt-auto px-5 pb-4 pt-3">
            <SectionLink href="/lp-portal/performance">View Rolling Returns</SectionLink>
          </div>
        </section>
      </div>

      {/* Capital activity + fund table */}
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]">
        <section className="flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-3 px-5 pt-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[14px] font-semibold text-[#111827]">
                  Capital Activity (Cash Flow)
                </h2>
                <InfoHint label="Capital Activity" />
              </div>
              <p className="mt-1 text-[11px] text-[#9ca3af]">USD (Millions)</p>
            </div>
            <span className="shrink-0 pt-0.5 text-[12px] text-[#9ca3af]">Since Inception</span>
          </div>

          <div className="h-[280px] min-h-0 flex-1 px-1 pb-1 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={capitalFlow}
                margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={<CapitalAxisTick />}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={40}
                />
                <YAxis
                  domain={[-200, 200]}
                  ticks={[-200, -100, 0, 100, 200]}
                  tickFormatter={formatCapitalY}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <ReferenceLine y={78.34} stroke="#cbd5e1" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="#d1d5db" />
                <RechartsTooltip
                  formatter={(value: number) => formatCapitalY(value)}
                  contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 11 }}
                />
                <Bar dataKey="value" maxBarSize={52} isAnimationActive={false}>
                  {capitalFlow.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                  <LabelList dataKey="value" content={<CapitalBarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-2 pt-1 text-[11px] text-[#6b7280]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-[2px] bg-[#00aeef]" />
              Inflows (Calls)
              <InfoHint label="Inflows (Calls)" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-[2px] bg-[#34a853]" />
              Outflows (Distributions)
              <InfoHint label="Outflows (Distributions)" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-[2px] bg-[#0046b5]" />
              Ending Value (NAV)
            </span>
          </div>

          <div className="mt-auto px-5 pb-4 pt-2">
            <SectionLink href="/lp-portal/capital-activity">View Cash Flow Details</SectionLink>
          </div>
        </section>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[14px] font-semibold text-[#111827]">Performance by Fund</h2>
              <InfoHint label="Performance by Fund" />
            </div>
            <SectionLink href="/lp-portal/investments">View All Funds</SectionLink>
          </div>
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[11px] font-semibold text-[#111827]">
                  <th className="px-5 py-2.5 font-semibold">Fund</th>
                  <th className="px-3 py-2.5 font-semibold">Structure</th>
                  <th className="px-3 py-2.5 font-semibold">Net IRR</th>
                  <th className="px-3 py-2.5 font-semibold">TVPI / Return</th>
                  <th className="px-3 py-2.5 font-semibold">NAV / Account Value</th>
                  <th className="px-3 py-2.5 font-semibold">Benchmark</th>
                  <th className="px-5 py-2.5 font-semibold">As Of</th>
                </tr>
              </thead>
              <tbody>
                {fundRows.map((row) => (
                  <tr key={row.fund} className="border-b border-[#f3f4f6] last:border-0">
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-[#0056d2] hover:underline"
                        onClick={() => toast.message(row.fund)}
                      >
                        {row.fund}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[#4b5563]">{row.structure}</td>
                    <td className="px-3 py-3 tabular-nums text-[#111827]">{row.netIrr}</td>
                    <td className="px-3 py-3 tabular-nums text-[#111827]">{row.tvpi}</td>
                    <td className="px-3 py-3 font-medium tabular-nums text-[#111827]">{row.nav}</td>
                    <td className="px-3 py-3 text-[#4b5563]">{row.benchmark}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-[#4b5563]">{row.asOf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-auto px-5 pb-4 pt-3 text-[11px] italic leading-4 text-[#9ca3af]">
            Performance is net of fees, expenses and carried interest, if applicable.
          </div>
        </section>
      </div>

      {/* Footer utility cards */}
      <div className="grid items-stretch gap-4 md:grid-cols-3">
        <section className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#2563eb]">
            <FileText className="size-[18px]" strokeWidth={1.75} />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <h3 className="text-[14px] font-semibold text-[#111827]">Performance Methodology</h3>
            <InfoHint label="Performance Methodology" />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#6b7280]">
            Performance is calculated in accordance with the Global Investment Performance Standards
            (GIPS®) and based on capital flows and valuations as of the valuation date.
          </p>
          <button
            type="button"
            className="mt-auto inline-flex items-center gap-1 pt-4 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            onClick={() => toast.message("Opening methodology (mock).")}
          >
            View Methodology <ArrowRight className="size-3.5" />
          </button>
        </section>

        <section className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#2563eb]">
            <FileText className="size-[18px]" strokeWidth={1.75} />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <h3 className="text-[14px] font-semibold text-[#111827]">Valuation Notes</h3>
            <InfoHint label="Valuation Notes" />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#6b7280]">
            All investments are valued in good faith pursuant to the fund&apos;s valuation policy.
            The most recent valuation is as of {AS_OF}.
          </p>
          <button
            type="button"
            className="mt-auto inline-flex items-center gap-1 pt-4 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            onClick={() => toast.message("Opening valuation notes (mock).")}
          >
            View Valuation Notes <ArrowRight className="size-3.5" />
          </button>
        </section>

        <section className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#2563eb]">
            <FileDown className="size-[18px]" strokeWidth={1.75} />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <h3 className="text-[14px] font-semibold text-[#111827]">Download Performance Report</h3>
            <InfoHint label="Download Performance Report" />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#6b7280]">
            Download the comprehensive performance report including detailed returns, cash flows and
            benchmark analysis.
          </p>
          <div className="mt-auto pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full border-[#d1d5db] bg-white px-4 text-[12px] font-medium text-[#2563eb] shadow-none hover:bg-[#f9fafb] hover:text-[#1d4ed8]"
              onClick={downloadReport}
            >
              <Download className="size-3.5 text-[#2563eb]" />
              Download Report
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
