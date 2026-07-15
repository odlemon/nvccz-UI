'use client'

import { useMemo, useState } from 'react'
import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useForecastingTheme } from '@/components/fpna/theme-provider'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, ReferenceLine
} from 'recharts'
import { MoreHorizontal, TrendingUp, TrendingDown, Info, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const revenueExpenseData = [
  { month: 'Jun\'24', revenue: 88, expense: 66 },
  { month: 'Aug\'24', revenue: 92, expense: 68 },
  { month: 'Oct\'24', revenue: 96, expense: 70 },
  { month: 'Dec\'24', revenue: 100, expense: 72 },
  { month: 'Feb\'25', revenue: 108, expense: 75 },
  { month: 'Apr\'25', revenue: 116, expense: 80 },
  { month: 'May\'25', revenue: 125.8, expense: 86.4 },
]

const revenuePeriods = [
  { label: 'Last 3 Months', months: 3 },
  { label: 'Last 6 Months', months: 5 },
  { label: 'Last 12 Months', months: 7 },
]

const cashRunwayData = [
  { month: 'May\'25', value: 38.4 },
  { month: 'Aug\'25', value: 34.2 },
  { month: 'Nov\'25', value: 29.8 },
  { month: 'Feb\'26', value: 25.1 },
]

const budgetWorkflowData = [
  { name: 'Submitted', value: 72 },
  { name: 'In Review', value: 18 },
  { name: 'Approved', value: 10 },
]

const kpiSparks = [
  [{ v: 10 }, { v: 14 }, { v: 12 }, { v: 16 }, { v: 15 }, { v: 18 }, { v: 20 }], // Revenue - upward
  [{ v: 16 }, { v: 17 }, { v: 18 }, { v: 17 }, { v: 19 }, { v: 20 }, { v: 22 }], // EBITDA - upward
  [{ v: 30 }, { v: 32 }, { v: 35 }, { v: 34 }, { v: 36 }, { v: 37 }, { v: 38 }], // Closing Cash - upward
  [{ v: 14 }, { v: 13 }, { v: 14 }, { v: 15 }, { v: 14 }, { v: 14 }, { v: 14 }], // Cash Runway - flat
  [{ v: 82 }, { v: 84 }, { v: 83 }, { v: 85 }, { v: 86 }, { v: 86 }, { v: 87 }], // Forecast Accuracy - upward
]

function Spark({ data, color }: { data: { v: number }[], color: string }) {
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const kpis = [
  { label: 'Revenue Forecast', value: '$125.8M', delta: '+4.2% vs Apr 2025', positive: true },
  { label: 'EBITDA', value: '$23.6M', delta: '+6.1% vs Apr 2025', positive: true },
  { label: 'Closing Cash', value: '$38.4M', delta: '+8.7% vs Apr 2025', positive: true },
  { label: 'Cash Runway', value: '14.2 months', delta: '+1.1 mo vs Apr 2025', positive: true },
  { label: 'Forecast Accuracy', value: '87.3%', delta: '+3.6 pp vs Apr 2025', positive: true },
]

const scenarioRows = [
  {
    metric: 'Revenue', base: '$125.8M', baseD: '+4.2%', upside: '$138.3M', upsideD: '+14.6%',
    downside: '$113.2M', downsideD: '-6.3%',
  },
  {
    metric: 'EBITDA', base: '$23.6M', baseD: '+6.1%', upside: '$29.1M', upsideD: '+18.4%',
    downside: '$17.2M', downsideD: '-20.8%',
  },
  {
    metric: 'Cash Runway', base: '14.2 months', baseD: '+1.1 mo', upside: '17.6 months', upsideD: '+4.5 mo',
    downside: '10.2 months', downsideD: '-3.9 mo',
  },
]

const deptRows = [
  { dept: 'Marketing', budget: '$8.30M', actual: '$9.45M', variance: '+$1.25M (26.2%)', owner: 'Jane Cooper' },
  { dept: 'Sales', budget: '$12.30M', actual: '$13.48M', variance: '+$1.18M (9.4%)', owner: 'Wade Warren' },
  { dept: 'Product Development', budget: '$15.00M', actual: '$16.72M', variance: '+$1.72M (31.5%)', owner: 'Devon Lane' },
  { dept: 'Customer Success', budget: '$4.80M', actual: '$5.21M', variance: '+$0.41M (8.5%)', owner: 'Esther Howard' },
  { dept: 'IT', budget: '$6.40M', actual: '$6.88M', variance: '+$0.48M (7.5%)', owner: 'Cody Fisher' },
]

const taskRows = [
  { task: 'Review Q2 Marketing Budget', module: 'Budgeting', owner: 'Jane Cooper', due: 'May 23, 2025', priority: 'High', status: 'In Progress' },
  { task: 'Update Headcount Plan', module: 'Workforce', owner: 'Wade Warren', due: 'May 26, 2025', priority: 'High', status: 'Not Started' },
  { task: 'Finalize Revenue Forecast Assumptions', module: 'Revenue', owner: 'Cody Fisher', due: 'May 28, 2025', priority: 'High', status: 'In Progress' },
  { task: 'Review Vendor Spend', module: 'Expenses', owner: 'Esther Howard', due: 'May 30, 2025', priority: 'Medium', status: 'Not Started' },
  { task: 'Prepare Cash Flow Commentary', module: 'Cash Flow', owner: 'Devon Lane', due: 'May 30, 2025', priority: 'Low', status: 'Not Started' },
]

const recentActivity = [
  { text: 'Marketing budget submitted for review', user: 'Jane Cooper', time: '3h ago', color: '#2563eb' },
  { text: 'FY26 Base Case revenue updated', user: 'Wade Warren', time: '9h ago', color: '#f59e0b' },
  { text: 'New assumption added: Churn Rate', user: 'Devon Lane', time: '1d ago', color: '#10b981' },
  { text: 'Sales forecast updated for Q2', user: 'Esther Howard', time: '1d ago', color: '#8b5cf6' },
  { text: 'Q1 Forecast Accuracy improved to 87.3%', user: 'System', time: '2d ago', color: '#6b7280' },
]

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    High: '#fee2e2',
    Medium: '#fef3c7',
    Low: '#dcfce7',
  }
  const textMap: Record<string, string> = {
    High: '#991b1b',
    Medium: '#92400e',
    Low: '#166534',
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: map[p], color: textMap[p] }}>
      {p}
    </span>
  )
}

function statusBadge(s: string) {
  if (s === 'In Progress') return <span className="text-xs" style={{ color: '#2563eb' }}>{s}</span>
  if (s === 'Not Started') return <span className="text-xs" style={{ color: '#94a3b8' }}>{s}</span>
  return <span className="text-xs" style={{ color: '#10b981' }}>{s}</span>
}

export default function HomePage() {
  const { theme } = useForecastingTheme()

  // Revenue vs Expense period filter — slices the existing mock series.
  const [revenuePeriodIdx, setRevenuePeriodIdx] = useState(revenuePeriods.length - 1)
  const activePeriod = revenuePeriods[revenuePeriodIdx]
  const filteredRevenueExpenseData = useMemo(
    () => revenueExpenseData.slice(-activePeriod.months),
    [activePeriod]
  )
  const cycleRevenuePeriod = () => setRevenuePeriodIdx((i) => (i + 1) % revenuePeriods.length)

  // Cash Runway scenario toggle — reuses the existing scenarioRows mock data.
  const cashRunwayScenarioRow = scenarioRows.find((r) => r.metric === 'Cash Runway')!
  const cashRunwayScenarios = [
    { key: 'base', label: 'Base Case', value: cashRunwayScenarioRow.base, delta: cashRunwayScenarioRow.baseD, positive: true },
    { key: 'upside', label: 'Upside', value: cashRunwayScenarioRow.upside, delta: cashRunwayScenarioRow.upsideD, positive: true },
    { key: 'downside', label: 'Downside', value: cashRunwayScenarioRow.downside, delta: cashRunwayScenarioRow.downsideD, positive: false },
  ]
  const [cashRunwayScenarioIdx, setCashRunwayScenarioIdx] = useState(0)
  const activeCashRunwayScenario = cashRunwayScenarios[cashRunwayScenarioIdx]
  const cycleCashRunwayScenario = () => setCashRunwayScenarioIdx((i) => (i + 1) % cashRunwayScenarios.length)

  // Theme-conditional chart series colors.
  const seriesColors = {
    spark: theme === 'dark' ? '#3b82f6' : '#2563eb',
    revenue: theme === 'dark' ? '#3b82f6' : '#2563eb',
    expense: theme === 'dark' ? '#34d399' : '#10b981',
    cashRunwayBar: theme === 'dark' ? '#3b82f6' : '#2563eb',
    referenceLine: theme === 'dark' ? '#64748b' : '#94a3b8',
    workflow: {
      Submitted: theme === 'dark' ? '#3b82f6' : '#2563eb',
      'In Review': theme === 'dark' ? '#fbbf24' : '#f59e0b',
      Approved: theme === 'dark' ? '#34d399' : '#10b981',
    } as Record<string, string>,
  }

  const chartGridStroke = 'var(--border)'
  const chartAxisTick = { fontSize: 9, fill: 'var(--muted-foreground)' }
  const chartTooltipStyle = {
    fontSize: 11,
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
  }

  return (
    <DashboardShell>
      <TopBar title="FP&A Home" scenario="Base Case" version="Working" period="May 2025" />
      <div className="flex-1 overflow-y-auto p-4 bg-background">

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {kpis.map((k, i) => (
            <div key={i} className="rounded-lg p-3 flex flex-col gap-1 bg-card border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                  <MoreHorizontal size={12} />
                </Button>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold text-foreground">{k.value}</span>
                <Spark data={kpiSparks[i]} color={seriesColors.spark} />
              </div>
              <div className="flex items-center gap-1">
                {k.positive
                  ? <TrendingUp size={11} style={{ color: '#16a34a' }} />
                  : <TrendingDown size={11} style={{ color: '#dc2626' }} />}
                <span className="text-xs" style={{ color: k.positive ? '#16a34a' : '#dc2626' }}>{k.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Revenue Chart + Scenario + Workflow */}
        <div className="grid grid-cols-12 gap-3 mb-3">
          {/* Revenue vs Expense */}
          <div className="col-span-5 rounded-lg p-3 bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">Revenue vs Expense Trend</span>
                <Info size={11} className="text-muted-foreground" />
              </div>
              <Button variant="outline" size="pill" onClick={cycleRevenuePeriod}>
                {activePeriod.label} &#9662;
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: seriesColors.revenue }}></span><span className="text-xs text-muted-foreground">Revenue</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block border-dashed border-t-2" style={{ borderColor: seriesColors.expense }}></span><span className="text-xs text-muted-foreground">Total Expenses</span></div>
            </div>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredRevenueExpenseData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="month" tick={chartAxisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={chartAxisTick} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} width={32} />
                  <Tooltip formatter={(v: number) => `$${v}M`} contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="revenue" stroke={seriesColors.revenue} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke={seriesColors.expense} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Comparison */}
          <div className="col-span-4 rounded-lg p-3 bg-card border border-border">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-foreground">Scenario Comparison</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium pb-1.5">Scenario</th>
                  <th className="text-right font-medium pb-1.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Base Case</span></th>
                  <th className="text-right font-medium pb-1.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>Upside</span></th>
                  <th className="text-right font-medium pb-1.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>Downside</span></th>
                </tr>
              </thead>
              <tbody>
                {scenarioRows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-1.5 font-medium text-foreground">{r.metric}</td>
                    <td className="py-1.5 text-right">
                      <div className="font-semibold text-foreground">{r.base}</div>
                      <div style={{ color: '#16a34a', fontSize: 10 }}>{r.baseD}</div>
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="font-semibold text-foreground">{r.upside}</div>
                      <div style={{ color: '#16a34a', fontSize: 10 }}>{r.upsideD}</div>
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="font-semibold text-foreground">{r.downside}</div>
                      <div style={{ color: '#dc2626', fontSize: 10 }}>{r.downsideD}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-2 text-muted-foreground">All scenarios calculated for May 2025</p>
          </div>

          {/* Budget Workflow Progress */}
          <div className="col-span-3 rounded-lg p-3 bg-card border border-border">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-foreground">Budget Workflow Progress</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={budgetWorkflowData} cx={35} cy={35} innerRadius={24} outerRadius={36} dataKey="value" startAngle={90} endAngle={-270}>
                      {budgetWorkflowData.map((d, i) => <Cell key={i} fill={seriesColors.workflow[d.name]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div className="font-bold text-foreground" style={{ fontSize: 14 }}>72%</div>
                  <div className="text-muted-foreground" style={{ fontSize: 8 }}>Complete</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {budgetWorkflowData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: seriesColors.workflow[d.name] }}></span>
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">
              Next: <span className="text-foreground">Marketing budget in review</span>
            </p>
          </div>
        </div>

        {/* Row 3: Departments + Cash Runway + Recent Activity */}
        <div className="grid grid-cols-12 gap-3 mb-3">
          {/* Departments Over Budget */}
          <div className="col-span-5 rounded-lg p-3 bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">Departments Over Budget</span>
                <Info size={11} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">May 2025</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground" style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left font-medium pb-1.5">Department</th>
                  <th className="text-right font-medium pb-1.5">Budget</th>
                  <th className="text-right font-medium pb-1.5">Actual</th>
                  <th className="text-right font-medium pb-1.5">Variance</th>
                  <th className="text-left font-medium pb-1.5 pl-2">Owner</th>
                  <th className="text-center font-medium pb-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {deptRows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-1.5 font-medium text-foreground">{r.dept}</td>
                    <td className="py-1.5 text-right text-foreground">{r.budget}</td>
                    <td className="py-1.5 text-right text-foreground">{r.actual}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: '#dc2626' }}>{r.variance}</td>
                    <td className="py-1.5 pl-2 text-foreground">{r.owner}</td>
                    <td className="py-1.5 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Over Budget</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" size="pill" className="mt-2">View all departments</Button>
          </div>

          {/* Cash Runway */}
          <div className="col-span-4 rounded-lg p-3 bg-card border border-border">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">Cash Runway</span>
                <Info size={11} className="text-muted-foreground" />
              </div>
              <Button variant="outline" size="pill" onClick={cycleCashRunwayScenario}>
                {activeCashRunwayScenario.label} &#9662;
              </Button>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-foreground">{activeCashRunwayScenario.value.split(' ')[0]}</span>
              <span className="text-xs text-muted-foreground">months</span>
              <span className="text-xs" style={{ color: activeCashRunwayScenario.positive ? '#16a34a' : '#dc2626' }}>
                {activeCashRunwayScenario.positive ? '▲' : '▼'} {activeCashRunwayScenario.delta} vs Apr 2025
              </span>
            </div>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashRunwayData} margin={{ top: 0, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                  <XAxis dataKey="month" tick={chartAxisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={chartAxisTick} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} domain={[0, 50]} width={38} />
                  <ReferenceLine y={20} stroke={seriesColors.referenceLine} strokeDasharray="4 2" label={{ value: '12 Mo Target', position: 'insideTopRight', fontSize: 8, fill: seriesColors.referenceLine }} />
                  <Bar dataKey="value" fill={seriesColors.cashRunwayBar} radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Button variant="outline" size="pill" className="mt-1">View cash flow</Button>
          </div>

          {/* Recent Activity */}
          <div className="col-span-3 rounded-lg p-3 bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">Recent Activity</span>
                <Info size={11} className="text-muted-foreground" />
              </div>
              <Button variant="outline" size="pill">View all</Button>
            </div>
            <div className="flex flex-col gap-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ backgroundColor: a.color }}>
                    {a.user[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-tight">{a.text}</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">{a.user} &middot; {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Open Tasks */}
        <div className="rounded-lg p-3 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-foreground">Open Tasks</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground" style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left font-medium pb-1.5">Task</th>
                <th className="text-left font-medium pb-1.5">Module</th>
                <th className="text-left font-medium pb-1.5">Owner</th>
                <th className="text-left font-medium pb-1.5">Due Date</th>
                <th className="text-left font-medium pb-1.5">Priority</th>
                <th className="text-left font-medium pb-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {taskRows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5 text-foreground flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-muted-foreground" />
                    {r.task}
                  </td>
                  <td className="py-1.5 text-muted-foreground">{r.module}</td>
                  <td className="py-1.5 text-muted-foreground">{r.owner}</td>
                  <td className="py-1.5 text-muted-foreground">{r.due}</td>
                  <td className="py-1.5">{priorityBadge(r.priority)}</td>
                  <td className="py-1.5">{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="outline" size="pill" className="mt-2">View all tasks</Button>
        </div>

      </div>
    </DashboardShell>
  )
}
