'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ReferenceLine, Cell
} from 'recharts'
import { Info, TrendingUp, TrendingDown, ArrowUp, ArrowDown, X, ChevronDown, MoreHorizontal } from 'lucide-react'

const kpis = [
  { label: 'Actual Revenue', value: '$125.8M', delta: '+4.2% vs Budget', positive: true, trend: [9, 10, 11, 12, 11, 13, 14] },
  { label: 'Budget Revenue', value: '$121.5M', delta: '+3.6% vs Budget', positive: true, trend: [10, 10, 11, 11, 12, 12, 12] },
  { label: 'Revenue Variance', value: '$4.3M', positive: true, isVariance: true, trend: null },
  { label: 'Opex Variance', value: '$(2.7M)', positive: false, isVariance: true, trend: null },
  { label: 'EBITDA Variance', value: '$7.0M', positive: true, isVariance: true, trend: null },
]

const deptRows = [
  { dept: 'Total Company', actual: '$125.8M', budget: '$121.5M', forecast: '$127.2M', varBudget: '$4.1M', varPct: '3.6%', varForecast: '($1.5M)', commentary: '3/8', positive: true },
  { dept: 'Marketing', actual: '$8.2M', budget: '$8.1M', forecast: '$8.0M', varBudget: '$0.1M', varPct: '1.2%', varForecast: '$0.1M', commentary: '1/2', positive: true, highlighted: true },
  { dept: 'Sales', actual: '$32.5M', budget: '$31.2M', forecast: '$30.1M', varBudget: '$1.3M', varPct: '4.2%', varForecast: '($0.4M)', commentary: '2/3', positive: true },
  { dept: 'Product Development', actual: '$16.2M', budget: '$15.0M', forecast: '$15.0M', varBudget: '($1.2M)', varPct: '-7.4%', varForecast: '($0.2M)', commentary: '1/2', positive: false, highlighted: true },
  { dept: 'Customer Success', actual: '$4.8M', budget: '$4.5M', forecast: '$4.7M', varBudget: '$0.3M', varPct: '6.7%', varForecast: '$0.1M', commentary: '2/2', positive: true },
  { dept: 'IT', actual: '$6.4M', budget: '$6.1M', forecast: '$6.3M', varBudget: '($0.3M)', varPct: '-4.9%', varForecast: '$0.3M', commentary: '0/1', positive: false },
  { dept: 'Finance', actual: '$3.6M', budget: '$4.6M', forecast: '$4.7M', varBudget: '$0.9M', varPct: '-2.5%', varForecast: '($0.1M)', commentary: '1/1', positive: false },
  { dept: 'People & Culture', actual: '$2.8M', budget: '$2.7M', forecast: '$2.7M', varBudget: '($0.1M)', varPct: '7.7%', varForecast: '($0.1M)', commentary: '0/1', positive: true },
  { dept: 'Legal', actual: '$1.3M', budget: '$1.3M', forecast: '$1.3M', varBudget: '($0.0M)', varPct: '0.0%', varForecast: '($0.1M)', commentary: '0/1', positive: true },
  { dept: 'Operations', actual: '$19.0M', budget: '$11.3M', forecast: '$19.4M', varBudget: '($0.4M)', varPct: '0.2%', varForecast: '($0.4M)', commentary: '2/1', positive: false },
  { dept: 'Shared Services', actual: '$11.3M', budget: '$11.4M', forecast: '$11.7M', varBudget: '($0.2M)', varPct: '-4.2%', varForecast: '($0.4M)', commentary: '1/2', positive: false },
]

const trendData = [
  { month: 'Jun\'24', varBudget: 2, varForecast: -1 },
  { month: 'Aug\'24', varBudget: 3, varForecast: 1 },
  { month: 'Oct\'24', varBudget: 1, varForecast: -2 },
  { month: 'Dec\'24', varBudget: 4, varForecast: 2 },
  { month: 'Feb\'25', varBudget: -1, varForecast: 0 },
  { month: 'Apr\'25', varBudget: 3, varForecast: -1 },
  { month: 'May\'25', varBudget: 4.3, varForecast: 1.3 },
]

const deptVarianceData = [
  { dept: 'Sales', value: 1.3 },
  { dept: 'Operations', value: 0.95 },
  { dept: 'Finance', value: 0.4 },
  { dept: 'Legal', value: 0.2 },
  { dept: 'Facilities', value: 0.05 },
  { dept: 'People & Culture', value: -0.2 },
  { dept: 'R&D', value: -0.3 },
  { dept: 'Shared Services', value: -0.3 },
  { dept: 'Product Development', value: -1.2 },
]

const commentaryRequests = [
  { dept: 'Product Development', area: 'Headcount', owner: 'Devon Lane', variance: '($0.80M)', due: 'May 30, 2025', status: 'Overdue' },
  { dept: 'Shared Services', area: 'Professional Fees', owner: 'Carly Fisher', variance: '($0.30M)', due: 'May 30, 2025', status: 'Overdue' },
  { dept: 'Finance', area: 'Other Opex', owner: 'Jane Cooper', variance: '($0.10M)', due: 'May 28, 2025', status: 'In Progress' },
  { dept: 'Sales', area: 'Commissions', owner: 'Wade Warren', variance: '$1.00M', due: 'May 28, 2025', status: 'In Progress' },
  { dept: 'Marketing', area: 'Advertising', owner: 'Jane Cooper', variance: '$0.40M', due: 'May 28, 2025', status: 'Submitted' },
]

function Spark({ data, color }: { data: number[], color: string }) {
  const pts = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width={64} height={28}>
      <LineChart data={pts} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function statusBadge(s: string) {
  const map: Record<string, { bg: string; color: string }> = {
    Overdue: { bg: '#fef2f2', color: '#dc2626' },
    'In Progress': { bg: '#fffbeb', color: '#d97706' },
    Submitted: { bg: '#f0fdf4', color: '#16a34a' },
  }
  const style = map[s] || { bg: '#f1f5f9', color: '#64748b' }
  return <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>{s}</span>
}

export default function VariancePage() {
  const [showDrawer, setShowDrawer] = useState(true)
  const [selectedDept, setSelectedDept] = useState('Product Development')

  return (
    <DashboardShell>
      <TopBar title="Variance Analysis" scenario="Base Case" version="Working" period="May 2025" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#f0f2f5' }}>

          {/* Header + Filters */}
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-base font-bold text-slate-800">Variance Analysis</h1>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {[
              { label: 'Entity', value: 'All Entities (4)' },
              { label: 'Department', value: 'All Departments' },
              { label: 'Version', value: 'Working' },
              { label: 'Period', value: 'May 2025' },
              { label: 'View', value: 'Department View' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1">
                <label className="text-xs text-slate-400">{f.label}</label>
                <select className="text-xs px-2 py-1 rounded border ml-1" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                  <option>{f.value}</option>
                </select>
              </div>
            ))}
            <button className="ml-auto text-xs px-3 py-1.5 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#fff' }}>
              Reset Filters
            </button>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            {kpis.map((k, i) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                <p className="text-xs text-slate-400 mb-1">{k.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold text-slate-800">{k.value}</p>
                  {k.trend && <Spark data={k.trend} color={k.positive ? '#2563eb' : '#dc2626'} />}
                  {k.isVariance && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: k.positive ? '#dcfce7' : '#fee2e2' }}>
                      {k.positive ? <ArrowUp size={14} style={{ color: '#16a34a' }} /> : <ArrowDown size={14} style={{ color: '#dc2626' }} />}
                    </div>
                  )}
                </div>
                {k.delta && (
                  <p className="text-xs mt-1" style={{ color: k.positive ? '#16a34a' : '#dc2626' }}>
                    {k.positive ? '▲' : '▼'} {k.delta}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Actual vs Budget + Variance Trend */}
          <div className="grid grid-cols-12 gap-3 mb-3">
            {/* Actual vs Budget Table */}
            <div className="col-span-7 rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-xs font-semibold text-slate-700">Actual vs Budget vs Forecast</span>
                <Info size={11} className="text-slate-400" />
                <MoreHorizontal size={13} className="text-slate-400 cursor-pointer ml-auto" />
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8' }}>
                    <th className="text-left font-medium pb-2">Department</th>
                    <th className="text-right font-medium pb-2">Actual<br /><span style={{ fontSize: 9 }}>May 2025</span></th>
                    <th className="text-right font-medium pb-2">Budget<br /><span style={{ fontSize: 9 }}>May 2025</span></th>
                    <th className="text-right font-medium pb-2">Forecast<br /><span style={{ fontSize: 9 }}>May 2025</span></th>
                    <th className="text-right font-medium pb-2">Var to Budget $</th>
                    <th className="text-right font-medium pb-2">Var %</th>
                    <th className="text-right font-medium pb-2">Var to Forecast</th>
                    <th className="text-center font-medium pb-2">Commentary</th>
                  </tr>
                </thead>
                <tbody>
                  {deptRows.map((r, i) => (
                    <tr key={i}
                      onClick={() => { setSelectedDept(r.dept); setShowDrawer(true) }}
                      className="cursor-pointer"
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        backgroundColor: r.highlighted ? '#fff7ed' : undefined,
                        fontWeight: i === 0 ? 600 : 400,
                      }}>
                      <td className="py-1.5 text-slate-700" style={{ color: r.highlighted ? '#dc2626' : undefined }}>{r.dept}</td>
                      <td className="py-1.5 text-right text-slate-700">{r.actual}</td>
                      <td className="py-1.5 text-right text-slate-700">{r.budget}</td>
                      <td className="py-1.5 text-right text-slate-700">{r.forecast}</td>
                      <td className="py-1.5 text-right font-semibold" style={{ color: r.positive ? '#16a34a' : '#dc2626' }}>{r.varBudget}</td>
                      <td className="py-1.5 text-right font-semibold" style={{ color: r.positive ? '#16a34a' : '#dc2626' }}>{r.varPct}</td>
                      <td className="py-1.5 text-right text-slate-500">{r.varForecast}</td>
                      <td className="py-1.5 text-center text-slate-400">{r.commentary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Variance Trend + Dept Breakdown */}
            <div className="col-span-5 flex flex-col gap-3">
              {/* Trend */}
              <div className="rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', flex: 1 }}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-slate-700">Variance Trend (Total Company)</span>
                  <Info size={11} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-blue-500"></span><span className="text-xs text-slate-400">Var to Budget ($M)</span></div>
                  <div className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-slate-400 border-dashed border-t-2"></span><span className="text-xs text-slate-400">Var to Forecast ($M)</span></div>
                </div>
                <div style={{ height: 100 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      <ReferenceLine y={0} stroke="#e2e8f0" />
                      <Bar dataKey="varBudget" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="varForecast" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dept breakdown */}
              <div className="rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', flex: 1 }}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-slate-700">Variance Breakdown by Department (Var to Budget $M)</span>
                </div>
                <div style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptVarianceData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
                      <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} domain={[-1.5, 1.5]} />
                      <YAxis type="category" dataKey="dept" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `$${v}M`} />
                      <ReferenceLine x={0} stroke="#e2e8f0" />
                      <Bar dataKey="value" maxBarSize={12} radius={[0, 2, 2, 0]}>
                        {deptVarianceData.map((entry, i) => (
                          <Cell key={i} fill={entry.value < 0 ? '#dc2626' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Commentary Requests */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-slate-700">Commentary Requests</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8' }}>
                  <th className="text-left font-medium pb-2">Department</th>
                  <th className="text-left font-medium pb-2">Variance Area</th>
                  <th className="text-left font-medium pb-2">Owner</th>
                  <th className="text-right font-medium pb-2">Variance $</th>
                  <th className="text-left font-medium pb-2 pl-4">Due Date</th>
                  <th className="text-left font-medium pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {commentaryRequests.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td className="py-1.5 text-slate-700">{r.dept}</td>
                    <td className="py-1.5 text-slate-500">{r.area}</td>
                    <td className="py-1.5 text-slate-500">{r.owner}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: r.variance.startsWith('$') && !r.variance.startsWith('$(') ? '#16a34a' : '#dc2626' }}>
                      {r.variance}
                    </td>
                    <td className="py-1.5 text-slate-500 pl-4">{r.due}</td>
                    <td className="py-1.5">{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="text-xs mt-2" style={{ color: '#2563eb' }}>View all commentary requests</button>
          </div>
        </div>

        {/* Variance Detail Drawer */}
        {showDrawer && (
          <div className="w-56 shrink-0 border-l flex flex-col" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-xs font-semibold text-slate-700">Variance Detail</span>
              <X size={13} className="text-slate-400 cursor-pointer" onClick={() => setShowDrawer(false)} />
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">{selectedDept} — Headcount</p>
                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>$(0.80M)</p>
                <p className="text-xs" style={{ color: '#dc2626' }}>-7.4% vs Budget</p>
              </div>

              <div className="flex gap-1 border-b" style={{ borderColor: '#e2e8f0' }}>
                {['Details', 'History'].map(t => (
                  <button key={t} className="text-xs pb-1.5 px-1"
                    style={{ color: t === 'Details' ? '#2563eb' : '#94a3b8', borderBottom: t === 'Details' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: t === 'Details' ? 600 : 400 }}>
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Explanation</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Lower headcount due to delayed hiring for Senior Engineers and Product Designers. Open roles are expected to be filled in Q3. Savings partially offset by contractor extensions.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Corrective Action</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Re-profile hiring plan into Q3 and Q4. Reallocate budget to contractor spend in the interim to maintain delivery.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Supporting Details</p>
                {[
                  { label: 'Actual', value: '$15.00M', color: undefined },
                  { label: 'Budget', value: '$15.00M', color: undefined },
                  { label: 'Forecast', value: '$15.30M', color: undefined },
                  { label: 'Var to Budget', value: '$(0.80M)', color: '#dc2626' },
                  { label: 'Var %', value: '-7.4%', color: '#dc2626' },
                  { label: 'Var to Forecast', value: '$(0.30M)', color: '#dc2626' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-0.5">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-semibold" style={{ color: color || '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div>
                {[
                  { label: 'Owner', value: 'Devon Lane' },
                  { label: 'Due Date', value: 'May 30, 2025' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-0.5">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-medium text-slate-700">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-400">Status</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>Overdue</span>
                </div>
              </div>

              <button className="text-xs w-full text-center py-1.5 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                Add Comment
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
