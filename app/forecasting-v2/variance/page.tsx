'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useForecastingTheme } from '@/components/fpna/theme-provider'
import { useThemeContainer } from '@/components/fpna/use-theme-container'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ReferenceLine, Cell
} from 'recharts'
import { Info, ArrowUp, ArrowDown, X, MoreHorizontal } from 'lucide-react'

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

const departmentOptions = Array.from(new Set(deptRows.map(r => r.dept)))

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

function statusBadge(s: string, theme: 'light' | 'dark') {
  const map: Record<string, { bgLight: string; bgDark: string; colorLight: string; colorDark: string }> = {
    Overdue: { bgLight: '#fef2f2', bgDark: 'rgba(239, 68, 68, 0.15)', colorLight: '#dc2626', colorDark: '#f87171' },
    'In Progress': { bgLight: '#fffbeb', bgDark: 'rgba(217, 119, 6, 0.15)', colorLight: '#d97706', colorDark: '#fbbf24' },
    Submitted: { bgLight: '#f0fdf4', bgDark: 'rgba(22, 163, 74, 0.15)', colorLight: '#16a34a', colorDark: '#4ade80' },
  }
  const entry = map[s] || { bgLight: '#f1f5f9', bgDark: 'rgba(100, 116, 139, 0.15)', colorLight: '#64748b', colorDark: '#94a3b8' }
  const bg = theme === 'dark' ? entry.bgDark : entry.bgLight
  const color = theme === 'dark' ? entry.colorDark : entry.colorLight
  return <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: bg, color }}>{s}</span>
}

export default function VariancePage() {
  const { theme } = useForecastingTheme()
  const { ref: themeRef, container: themeContainer } = useThemeContainer()

  const [showDrawer, setShowDrawer] = useState(true)
  const [selectedDept, setSelectedDept] = useState('Product Development')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [activeTab, setActiveTab] = useState<'Details' | 'History'>('Details')
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<string[]>([])

  // Semantic favourable/unfavourable colors — kept distinct from the theme
  // vars (which cover chrome) since they encode meaning, but tuned per
  // theme so they read correctly against light vs dark card backgrounds.
  const favorableColor = theme === 'dark' ? '#4ade80' : '#16a34a'
  const unfavorableColor = theme === 'dark' ? '#f87171' : '#dc2626'
  const favorableBg = theme === 'dark' ? 'rgba(74, 222, 128, 0.15)' : '#dcfce7'
  const unfavorableBg = theme === 'dark' ? 'rgba(248, 113, 113, 0.15)' : '#fee2e2'
  const highlightBg = theme === 'dark' ? 'rgba(217, 119, 6, 0.12)' : '#fff7ed'
  const seriesColors = {
    budget: theme === 'dark' ? '#3b82f6' : '#2563eb',
    forecast: theme === 'dark' ? '#94a3b8' : '#64748b',
  }

  const filteredDeptRows = deptFilter === 'All Departments'
    ? deptRows
    : deptRows.filter(r => r.dept === deptFilter)

  const handleAddComment = () => {
    if (!commentText.trim()) return
    setComments(prev => [...prev, commentText.trim()])
    setCommentText('')
  }

  return (
    <DashboardShell>
      <TopBar title="Variance Analysis" scenario="Base Case" version="Working" period="May 2025" />
      <div ref={themeRef} className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 bg-background">

          {/* Header + Filters */}
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-base font-bold text-foreground">Variance Analysis</h1>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Entity</label>
              <select className="text-xs px-2 py-1 rounded border ml-1 bg-card text-foreground border-border">
                <option>All Entities (4)</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Department</label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-auto min-w-[8rem] h-7 ml-1 text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={themeContainer}>
                  <SelectItem value="All Departments">All Departments</SelectItem>
                  {departmentOptions.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Version</label>
              <select className="text-xs px-2 py-1 rounded border ml-1 bg-card text-foreground border-border">
                <option>Working</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Period</label>
              <select className="text-xs px-2 py-1 rounded border ml-1 bg-card text-foreground border-border">
                <option>May 2025</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">View</label>
              <select className="text-xs px-2 py-1 rounded border ml-1 bg-card text-foreground border-border">
                <option>Department View</option>
              </select>
            </div>

            <Button variant="outline" size="pill" className="ml-auto" onClick={() => setDeptFilter('All Departments')}>
              Reset Filters
            </Button>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            {kpis.map((k, i) => (
              <div key={i} className="rounded-lg p-3 bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold text-foreground">{k.value}</p>
                  {k.trend && <Spark data={k.trend} color={k.positive ? seriesColors.budget : unfavorableColor} />}
                  {k.isVariance && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: k.positive ? favorableBg : unfavorableBg }}>
                      {k.positive ? <ArrowUp size={14} style={{ color: favorableColor }} /> : <ArrowDown size={14} style={{ color: unfavorableColor }} />}
                    </div>
                  )}
                </div>
                {k.delta && (
                  <p className="text-xs mt-1" style={{ color: k.positive ? favorableColor : unfavorableColor }}>
                    {k.positive ? '▲' : '▼'} {k.delta}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Actual vs Budget + Variance Trend */}
          <div className="grid grid-cols-12 gap-3 mb-3">
            {/* Actual vs Budget Table */}
            <div className="col-span-7 rounded-lg p-4 bg-card border border-border">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-xs font-semibold text-foreground">Actual vs Budget vs Forecast</span>
                <Info size={11} className="text-muted-foreground" />
                <MoreHorizontal size={13} className="text-muted-foreground cursor-pointer ml-auto" />
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ color: 'var(--muted-foreground)' }}>
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
                  {filteredDeptRows.map((r, i) => (
                    <tr key={i}
                      onClick={() => { setSelectedDept(r.dept); setShowDrawer(true) }}
                      className="cursor-pointer"
                      style={{
                        borderBottom: '1px solid var(--muted)',
                        backgroundColor: r.highlighted ? highlightBg : undefined,
                        fontWeight: i === 0 ? 600 : 400,
                      }}>
                      <td className="py-1.5 text-foreground" style={{ color: r.highlighted ? unfavorableColor : undefined }}>{r.dept}</td>
                      <td className="py-1.5 text-right text-foreground">{r.actual}</td>
                      <td className="py-1.5 text-right text-foreground">{r.budget}</td>
                      <td className="py-1.5 text-right text-foreground">{r.forecast}</td>
                      <td className="py-1.5 text-right font-semibold" style={{ color: r.positive ? favorableColor : unfavorableColor }}>{r.varBudget}</td>
                      <td className="py-1.5 text-right font-semibold" style={{ color: r.positive ? favorableColor : unfavorableColor }}>{r.varPct}</td>
                      <td className="py-1.5 text-right text-muted-foreground">{r.varForecast}</td>
                      <td className="py-1.5 text-center text-muted-foreground">{r.commentary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Variance Trend + Dept Breakdown */}
            <div className="col-span-5 flex flex-col gap-3">
              {/* Trend */}
              <div className="rounded-lg p-4 bg-card border border-border" style={{ flex: 1 }}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-foreground">Variance Trend (Total Company)</span>
                  <Info size={11} className="text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: seriesColors.budget }}></span>
                    <span className="text-xs text-muted-foreground">Var to Budget ($M)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 inline-block border-dashed border-t-2" style={{ borderColor: seriesColors.forecast }}></span>
                    <span className="text-xs text-muted-foreground">Var to Forecast ($M)</span>
                  </div>
                </div>
                <div style={{ height: 100 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                      <ReferenceLine y={0} stroke="var(--border)" />
                      <Bar dataKey="varBudget" fill={seriesColors.budget} radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="varForecast" fill={seriesColors.forecast} radius={[2, 2, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dept breakdown */}
              <div className="rounded-lg p-4 bg-card border border-border" style={{ flex: 1 }}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-foreground">Variance Breakdown by Department (Var to Budget $M)</span>
                </div>
                <div style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptVarianceData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} domain={[-1.5, 1.5]} />
                      <YAxis type="category" dataKey="dept" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={{ fontSize: 11, backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }} formatter={(v: number) => `$${v}M`} />
                      <ReferenceLine x={0} stroke="var(--border)" />
                      <Bar dataKey="value" maxBarSize={12} radius={[0, 2, 2, 0]}>
                        {deptVarianceData.map((entry, i) => (
                          <Cell key={i} fill={entry.value < 0 ? unfavorableColor : favorableColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Commentary Requests */}
          <div className="rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-foreground">Commentary Requests</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border" style={{ color: 'var(--muted-foreground)' }}>
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
                  <tr key={i} style={{ borderBottom: '1px solid var(--muted)' }}>
                    <td className="py-1.5 text-foreground">{r.dept}</td>
                    <td className="py-1.5 text-muted-foreground">{r.area}</td>
                    <td className="py-1.5 text-muted-foreground">{r.owner}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: r.variance.startsWith('$') && !r.variance.startsWith('$(') ? favorableColor : unfavorableColor }}>
                      {r.variance}
                    </td>
                    <td className="py-1.5 text-muted-foreground pl-4">{r.due}</td>
                    <td className="py-1.5">{statusBadge(r.status, theme)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="link" size="pill" className="mt-2 px-0">
              View all commentary requests
            </Button>
          </div>
        </div>

        {/* Variance Detail Drawer */}
        {showDrawer && (
          <div className="w-56 shrink-0 border-l flex flex-col bg-card border-border">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground">Variance Detail</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowDrawer(false)}>
                <X size={13} className="text-muted-foreground" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{selectedDept} — Headcount</p>
                <p className="text-2xl font-bold" style={{ color: unfavorableColor }}>$(0.80M)</p>
                <p className="text-xs" style={{ color: unfavorableColor }}>-7.4% vs Budget</p>
              </div>

              <div className="flex gap-1 border-b border-border">
                {(['Details', 'History'] as const).map(t => (
                  <Button
                    key={t}
                    variant="ghost"
                    size="pill"
                    onClick={() => setActiveTab(t)}
                    className="h-auto rounded-none pb-1.5 px-1"
                    style={{
                      color: activeTab === t ? 'var(--primary)' : 'var(--muted-foreground)',
                      borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                      fontWeight: activeTab === t ? 600 : 400,
                    }}>
                    {t}
                  </Button>
                ))}
              </div>

              {activeTab === 'Details' ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Explanation</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Lower headcount due to delayed hiring for Senior Engineers and Product Designers. Open roles are expected to be filled in Q3. Savings partially offset by contractor extensions.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Corrective Action</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Re-profile hiring plan into Q3 and Q4. Reallocate budget to contractor spend in the interim to maintain delivery.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Supporting Details</p>
                    {[
                      { label: 'Actual', value: '$15.00M', color: undefined as string | undefined },
                      { label: 'Budget', value: '$15.00M', color: undefined as string | undefined },
                      { label: 'Forecast', value: '$15.30M', color: undefined as string | undefined },
                      { label: 'Var to Budget', value: '$(0.80M)', color: unfavorableColor },
                      { label: 'Var %', value: '-7.4%', color: unfavorableColor },
                      { label: 'Var to Forecast', value: '$(0.30M)', color: unfavorableColor },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-semibold" style={{ color: color || 'var(--foreground)' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    {[
                      { label: 'Owner', value: 'Devon Lane' },
                      { label: 'Due Date', value: 'May 30, 2025' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-muted-foreground">Status</span>
                      {statusBadge('Overdue', theme)}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No history entries yet for {selectedDept}.
                </p>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Add Comment</p>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="text-xs rounded-lg bg-background border-border text-foreground min-h-[60px]"
                />
                <Button variant="outline" size="pill" className="w-full mt-2" onClick={handleAddComment}>
                  Add Comment
                </Button>
                {comments.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {comments.map((c, i) => (
                      <div key={i} className="text-xs rounded-md p-2 bg-muted text-foreground">
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
