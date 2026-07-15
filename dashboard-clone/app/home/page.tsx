'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
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

const cashRunwayData = [
  { month: 'May\'25', value: 38.4 },
  { month: 'Aug\'25', value: 34.2 },
  { month: 'Nov\'25', value: 29.8 },
  { month: 'Feb\'26', value: 25.1 },
]

const budgetWorkflowData = [
  { name: 'Submitted', value: 72, color: '#2563eb' },
  { name: 'In Review', value: 18, color: '#f59e0b' },
  { name: 'Approved', value: 10, color: '#10b981' },
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
  return (
    <DashboardShell>
      <TopBar title="FP&A Home" scenario="Base Case" version="Working" period="May 2025" />
      <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#f0f2f5' }}>

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {kpis.map((k, i) => (
            <div key={i} className="rounded-lg p-3 flex flex-col gap-1" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{k.label}</span>
                <MoreHorizontal size={12} className="text-slate-400 cursor-pointer" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold text-slate-800">{k.value}</span>
                <Spark data={kpiSparks[i]} color="#2563eb" />
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
          <div className="col-span-5 rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Revenue vs Expense Trend</span>
                <Info size={11} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                Last 12 Months ▾
              </div>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: '#2563eb' }}></span><span className="text-xs text-slate-500">Revenue</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block border-dashed border-t-2" style={{ borderColor: '#10b981' }}></span><span className="text-xs text-slate-500">Total Expenses</span></div>
            </div>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueExpenseData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} width={32} />
                  <Tooltip formatter={(v: number) => `$${v}M`} contentStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Comparison */}
          <div className="col-span-4 rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-slate-700">Scenario Comparison</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: '#94a3b8' }}>
                  <th className="text-left font-medium pb-1.5">Scenario</th>
                  <th className="text-right font-medium pb-1.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Base Case</span></th>
                  <th className="text-right font-medium pb-1.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>Upside</span></th>
                  <th className="text-right font-medium pb-1.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>Downside</span></th>
                </tr>
              </thead>
              <tbody>
                {scenarioRows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td className="py-1.5 font-medium text-slate-700">{r.metric}</td>
                    <td className="py-1.5 text-right">
                      <div className="font-semibold text-slate-800">{r.base}</div>
                      <div style={{ color: '#16a34a', fontSize: 10 }}>{r.baseD}</div>
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="font-semibold text-slate-800">{r.upside}</div>
                      <div style={{ color: '#16a34a', fontSize: 10 }}>{r.upsideD}</div>
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="font-semibold text-slate-800">{r.downside}</div>
                      <div style={{ color: '#dc2626', fontSize: 10 }}>{r.downsideD}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>All scenarios calculated for May 2025</p>
          </div>

          {/* Budget Workflow Progress */}
          <div className="col-span-3 rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-slate-700">Budget Workflow Progress</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={budgetWorkflowData} cx={35} cy={35} innerRadius={24} outerRadius={36} dataKey="value" startAngle={90} endAngle={-270}>
                      {budgetWorkflowData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div className="font-bold text-slate-800" style={{ fontSize: 14 }}>72%</div>
                  <div style={{ fontSize: 8, color: '#94a3b8' }}>Complete</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {budgetWorkflowData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }}></span>
                      <span className="text-xs text-slate-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              Next: <span className="text-slate-600">Marketing budget in review</span>
            </p>
          </div>
        </div>

        {/* Row 3: Departments + Cash Runway + Recent Activity */}
        <div className="grid grid-cols-12 gap-3 mb-3">
          {/* Departments Over Budget */}
          <div className="col-span-5 rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Departments Over Budget</span>
                <Info size={11} className="text-slate-400" />
              </div>
              <span className="text-xs text-slate-400">May 2025</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
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
                  <tr key={i} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="py-1.5 font-medium text-slate-700">{r.dept}</td>
                    <td className="py-1.5 text-right text-slate-600">{r.budget}</td>
                    <td className="py-1.5 text-right text-slate-600">{r.actual}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: '#dc2626' }}>{r.variance}</td>
                    <td className="py-1.5 pl-2 text-slate-600">{r.owner}</td>
                    <td className="py-1.5 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Over Budget</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="text-xs mt-2" style={{ color: '#2563eb' }}>View all departments</button>
          </div>

          {/* Cash Runway */}
          <div className="col-span-4 rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Cash Runway</span>
                <Info size={11} className="text-slate-400" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>Base Case ▾</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-slate-800">14.2</span>
              <span className="text-xs text-slate-500">months</span>
              <span className="text-xs" style={{ color: '#16a34a' }}>▲ 1.1 mo vs Apr 2025</span>
            </div>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashRunwayData} margin={{ top: 0, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} domain={[0, 50]} width={38} />
                  <ReferenceLine y={20} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: '12 Mo Target', position: 'insideTopRight', fontSize: 8, fill: '#94a3b8' }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button className="text-xs mt-1" style={{ color: '#2563eb' }}>View cash flow</button>
          </div>

          {/* Recent Activity */}
          <div className="col-span-3 rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Recent Activity</span>
                <Info size={11} className="text-slate-400" />
              </div>
              <button className="text-xs" style={{ color: '#2563eb' }}>View all</button>
            </div>
            <div className="flex flex-col gap-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ backgroundColor: a.color }}>
                    {a.user[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 leading-tight">{a.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{a.user} &middot; {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Open Tasks */}
        <div className="rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-700">Open Tasks</span>
              <Info size={11} className="text-slate-400" />
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
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
                <tr key={i} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td className="py-1.5 text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-slate-300" />
                    {r.task}
                  </td>
                  <td className="py-1.5 text-slate-500">{r.module}</td>
                  <td className="py-1.5 text-slate-500">{r.owner}</td>
                  <td className="py-1.5 text-slate-500">{r.due}</td>
                  <td className="py-1.5">{priorityBadge(r.priority)}</td>
                  <td className="py-1.5">{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="text-xs mt-2" style={{ color: '#2563eb' }}>View all tasks</button>
        </div>

      </div>
    </DashboardShell>
  )
}
