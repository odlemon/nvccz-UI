"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Building2,
  Calendar,
  Filter,
  Info,
  RefreshCw,
  TrendingUp,
  Wallet,
  Briefcase,
  Percent,
  Layers,
  AlertCircle,
  FileText,
} from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmMetricCard, PmPageHeader, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"
import {
  allocation,
  capitalCalls,
  dashboardMetrics,
  distributionsVsContributions,
  fundTrend,
  lpActivity,
  recentDeals,
  reportingSchedule,
  topFunds,
} from "@/lib/performance-mock/fixtures/dashboard"

const metricIcons = [
  <TrendingUp key="1" className="h-4 w-4" />,
  <Briefcase key="2" className="h-4 w-4" />,
  <Building2 key="3" className="h-4 w-4" />,
  <Percent key="4" className="h-4 w-4" />,
  <Layers key="5" className="h-4 w-4" />,
  <Wallet key="6" className="h-4 w-4" />,
  <AlertCircle key="7" className="h-4 w-4" />,
  <FileText key="8" className="h-4 w-4" />,
]

export function DashboardMockScreen() {
  const [period, setPeriod] = useState("May 1 – May 31, 2025")
  const [trendPeriod, setTrendPeriod] = useState("Trailing 12 Months")
  const [cashPeriod, setCashPeriod] = useState("YTD")
  const [filterOpen, setFilterOpen] = useState(false)
  const [strategyFilter, setStrategyFilter] = useState("All")

  const filteredFunds = useMemo(() => {
    if (strategyFilter === "All") return topFunds
    return topFunds.filter((f) => f.strategy === strategyFilter)
  }, [strategyFilter])

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Dashboard"]} searchPlaceholder="Search funds, LPs, reports…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Performance Management Dashboard"
          subtitle="Track portfolio, funds, investor activity and reporting performance in one place."
          actions={
            <>
              <PmSelectChip icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />} label={period} onClick={() => setPeriod(period.includes("May") ? "Apr 1 – Apr 30, 2025" : "May 1 – May 31, 2025")} />
              <PmButton variant="outline" onClick={() => setFilterOpen((v) => !v)}>
                <Filter className="h-3.5 w-3.5" /> Filters
              </PmButton>
              <PmButton variant="outline" onClick={() => { window.location.href = "/performance/kpi-analytics" }}>
                KPI Analytics
              </PmButton>
              <button type="button" className="h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] hover:bg-[#F9FAFB]" aria-label="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </>
          }
        />

        {filterOpen && (
          <PmCard className="p-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[#6B7280] mr-1">Strategy:</span>
            {["All", "Growth", "Venture", "Buyout", "Credit", "Real Assets"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStrategyFilter(s)}
                className={`h-8 px-3 rounded-lg text-xs font-medium border ${strategyFilter === s ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]" : "bg-white border-[#E5E7EB] text-[#374151]"}`}
              >
                {s}
              </button>
            ))}
          </PmCard>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {dashboardMetrics.map((m, i) => (
            <PmMetricCard
              key={m.id}
              label={m.label}
              value={m.value}
              trend={m.trend}
              trendPositive={m.trendPositive}
              icon={<span style={{ color: m.iconColor }}>{metricIcons[i]}</span>}
              iconBg={m.iconBg}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <PmCard className="xl:col-span-5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-[#111827]">Fund Performance Trend</h3>
                <Info className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </div>
              <PmSelectChip label={trendPeriod} onClick={() => setTrendPeriod(trendPeriod.includes("12") ? "YTD" : "Trailing 12 Months")} />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fundTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 40]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[1, 3]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="irr" name="IRR Net" stroke="#2563EB" strokeWidth={2} dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="tvpi" name="TVPI Net" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PmCard>

          <PmCard className="xl:col-span-4 p-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Portfolio Allocation</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="h-44 w-44 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                      {allocation.map((a) => (
                        <Cell key={a.name} fill={a.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-[#6B7280]">Total AUM</p>
                  <p className="text-sm font-bold text-[#111827]">$2.48B</p>
                </div>
              </div>
              <div className="flex-1 w-full space-y-2">
                {allocation.map((a) => (
                  <div key={a.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                    <span className="flex-1 text-[#475569] truncate">{a.name}</span>
                    <span className="font-semibold text-[#111827]">${(a.value / 1000).toFixed(2)}B</span>
                    <span className="text-[#6B7280] w-8 text-right">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </PmCard>

          <PmCard className="xl:col-span-3 p-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">LP Activity Summary</h3>
            <div className="space-y-3">
              {lpActivity.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#6B7280]">{row.label}</p>
                    <p className="text-sm font-semibold text-[#111827]">{row.value}</p>
                  </div>
                  <span className={`text-[11px] font-medium ${row.up ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {row.up ? "▲" : "▼"} {row.trend}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" className="mt-4 text-sm font-medium text-[#2563EB] hover:underline">
              View LP Details →
            </button>
          </PmCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <TableCard
            title="Recent Applications / Deals"
            link="View all deals →"
            headers={["Company", "Strategy", "Stage", "Amount", "Submitted", "Status"]}
            rows={recentDeals.map((d) => [d.company, d.strategy, d.stage, d.amount, d.submitted, <PmStatusPill key={d.company} label={d.status} tone={d.tone} />])}
          />
          <TableCard
            title="Recent Capital Call Activity"
            link="View all calls →"
            headers={["Fund", "Call No.", "Amount", "Called", "Due", "Status"]}
            rows={capitalCalls.map((c) => [c.fund, c.callNo, c.amount, c.called, c.due, <PmStatusPill key={c.callNo} label={c.status} tone={c.tone} />])}
          />
          <TableCard
            title="Upcoming Reporting Schedule"
            link="View all reports →"
            headers={["Report", "Fund", "Due Date", "Status"]}
            rows={reportingSchedule.map((r) => [r.report, r.fund, r.due, <PmStatusPill key={r.report} label={r.status} tone={r.tone} />])}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <PmCard className="p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Top Performing Funds</h3>
              <button type="button" className="text-sm font-medium text-[#2563EB]">View all funds →</button>
            </div>
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                  {["Fund", "Vintage", "Strategy", "Net IRR", "TVPI", "DPI", "AUM"].map((h) => (
                    <th key={h} className="pb-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((f) => (
                  <tr key={f.fund} className="border-t border-[#F1F5F9]">
                    <td className="py-2.5 font-medium text-[#111827]">{f.fund}</td>
                    <td className="py-2.5 text-[#6B7280]">{f.vintage}</td>
                    <td className="py-2.5 text-[#6B7280]">{f.strategy}</td>
                    <td className="py-2.5 font-semibold text-[#111827]">{f.irr}</td>
                    <td className="py-2.5">{f.tvpi}</td>
                    <td className="py-2.5">{f.dpi}</td>
                    <td className="py-2.5">{f.aum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PmCard>

          <PmCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Distributions vs Contributions</h3>
              <PmSelectChip label={cashPeriod} onClick={() => setCashPeriod(cashPeriod === "YTD" ? "Trailing 12M" : "YTD")} />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionsVsContributions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="contributions" name="Contributions" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="distributions" name="Distributions" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PmCard>
        </div>
      </div>
    </div>
  )
}

function TableCard({
  title,
  link,
  headers,
  rows,
}: {
  title: string
  link: string
  headers: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <PmCard className="p-4 overflow-x-auto">
      <h3 className="text-sm font-semibold text-[#111827] mb-3">{title}</h3>
      <table className="w-full text-left text-xs min-w-[420px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
            {headers.map((h) => (
              <th key={h} className="pb-2 font-semibold pr-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#F1F5F9]">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-2 text-[#374151] whitespace-nowrap">
                  {j === 0 ? <span className="font-medium text-[#111827]">{cell}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="mt-3 text-sm font-medium text-[#2563EB] hover:underline">
        {link}
      </button>
    </PmCard>
  )
}
