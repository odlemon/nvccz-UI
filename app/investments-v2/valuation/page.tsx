'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatCard } from '@/components/arcus/stat-card'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

const valRuns = [
  { id: 'VAL-1842', portfolio: 'Equity World', valDate: '07 Jul 2026', runTime: '10:15:22', nav: 142850200, grossAV: 148200000, netAV: 142850200, unrealPnl: 4820500, realPnl: 1240000, cashBal: 18200000, status: 'validated', method: 'Mark-to-Market', fxDate: '07 Jul 2026' },
  { id: 'VAL-1841', portfolio: 'Multi Asset', valDate: '07 Jul 2026', runTime: '10:12:08', nav: 87320000, grossAV: 90100000, netAV: 87320000, unrealPnl: 1840200, realPnl: 480200, cashBal: 11200000, status: 'validated', method: 'Mark-to-Market', fxDate: '07 Jul 2026' },
  { id: 'VAL-1840', portfolio: 'Fixed Income', valDate: '07 Jul 2026', runTime: '10:10:45', nav: 56100000, grossAV: 57200000, netAV: 56100000, unrealPnl: -210400, realPnl: 90000, cashBal: 6800000, status: 'validated', method: 'Amortised Cost', fxDate: '07 Jul 2026' },
  { id: 'VAL-1839', portfolio: 'Asia Select', valDate: '07 Jul 2026', runTime: '09:55:14', nav: 33450000, grossAV: 34200000, netAV: 33450000, unrealPnl: 820700, realPnl: 220700, cashBal: 4200000, status: 'pending', method: 'Mark-to-Market', fxDate: '07 Jul 2026' },
]

const navTrend = [
  { date: 'Jun 1', equity: 139.2, multiAsset: 85.4, fixedIncome: 56.8, asia: 32.1 },
  { date: 'Jun 15', equity: 140.8, multiAsset: 86.1, fixedIncome: 56.5, asia: 32.8 },
  { date: 'Jul 1', equity: 141.9, multiAsset: 86.8, fixedIncome: 56.2, asia: 33.1 },
  { date: 'Jul 7', equity: 142.85, multiAsset: 87.32, fixedIncome: 56.10, asia: 33.45 },
]

const exceptions = [
  { id: 'VE-0041', portfolio: 'Asia Select', ticker: 'BABA', issue: 'Stale Price — Last price 3 days old', severity: 'high', status: 'pending' },
  { id: 'VE-0040', portfolio: 'Fixed Income', ticker: 'HY-BOND', issue: 'Price deviation > 5% from previous close', severity: 'medium', status: 'investigating' },
  { id: 'VE-0039', portfolio: 'Multi Asset', ticker: 'GOLD', issue: 'FX rate mismatch — source vs approved rate', severity: 'low', status: 'resolved' },
]

const tabs = ['NAV Runs', 'P&L Runs', 'Price Validation', 'FX Conversion', 'Exceptions']

export default function ValuationPage() {
  const [activeTab, setActiveTab] = useState('NAV Runs')
  const [running, setRunning] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => setRunning(false), 3000)
  }

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Valuation" />

      {/* Sub-tabs */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
            {t === 'Exceptions' && <span className="ml-1.5 bg-[#EF4444] text-white text-[9px] rounded-full px-1.5">2</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Total NAV" value="$319.72M" subValue="All portfolios" change={0.55} highlight />
          <StatCard label="Gross Asset Value" value="$329.70M" subValue="Before liabilities" />
          <StatCard label="Total Unrealised P&L" value="+$7.27M" change={2.32} />
          <StatCard label="Total Realised P&L" value="+$2.03M" subValue="YTD" />
          <StatCard label="Valuation Exceptions" value="2" subValue="Pending resolution" />
        </div>

        {activeTab === 'NAV Runs' && (
          <>
            {/* NAV trend chart */}
            <div className="bg-[#0D1526] border border-white/[0.06] rounded-md p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-semibold text-[#E8EDF5]">NAV Trend by Portfolio</div>
                  <div className="text-[10px] text-[#4B5A72]">USD millions · Last 5 weeks</div>
                </div>
                <button
                  onClick={handleRun}
                  className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]"
                >
                  <RefreshCw className={cn('w-3 h-3', running && 'animate-spin')} />
                  {running ? 'Running Valuation...' : 'Run All Valuations'}
                </button>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={navTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    {[['equity', '#3B82F6'], ['multiAsset', '#10B981'], ['fixedIncome', '#06B6D4'], ['asia', '#F59E0B']].map(([key, color]) => (
                      <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#6B7A95', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7A95', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                  <Tooltip contentStyle={{ background: '#111C30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 11 }} formatter={(v: any) => [`$${v}M`]} />
                  {[
                    { key: 'equity', color: '#3B82F6', label: 'Equity World' },
                    { key: 'multiAsset', color: '#10B981', label: 'Multi Asset' },
                    { key: 'fixedIncome', color: '#06B6D4', label: 'Fixed Income' },
                    { key: 'asia', color: '#F59E0B', label: 'Asia Select' },
                  ].map(s => (
                    <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={1.5} fill={`url(#grad-${s.key})`} dot={false} name={s.label} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Valuation runs table */}
            <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06]">
                <div className="text-xs font-semibold text-[#E8EDF5]">Valuation Runs — 07 Jul 2026</div>
              </div>
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Portfolio</th>
                    <th>Val Date</th>
                    <th>Run Time</th>
                    <th className="text-right">NAV</th>
                    <th className="text-right">Gross AV</th>
                    <th className="text-right">Unrealised P&L</th>
                    <th className="text-right">Realised P&L</th>
                    <th className="text-right">Cash</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {valRuns.map(r => (
                    <tr key={r.id}>
                      <td className="text-[#60A5FA] font-mono text-[11px]">{r.id}</td>
                      <td className="text-[#A8B4C8]">{r.portfolio}</td>
                      <td className="text-[#6B7A95]">{r.valDate}</td>
                      <td className="text-[#6B7A95] font-mono">{r.runTime}</td>
                      <td className="text-right font-mono">{(r.nav / 1000000).toFixed(2)}M</td>
                      <td className="text-right font-mono">{(r.grossAV / 1000000).toFixed(2)}M</td>
                      <td className={cn('text-right font-mono', r.unrealPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                        {r.unrealPnl >= 0 ? '+' : ''}{(r.unrealPnl / 1000).toFixed(0)}k
                      </td>
                      <td className="text-right font-mono text-[#10B981]">+{(r.realPnl / 1000).toFixed(0)}k</td>
                      <td className="text-right font-mono">{(r.cashBal / 1000000).toFixed(2)}M</td>
                      <td className="text-[#6B7A95] text-xs">{r.method}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'Exceptions' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Valuation Exceptions</div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Exception ID</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Issue</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map(e => (
                  <tr key={e.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{e.id}</td>
                    <td className="text-[#A8B4C8]">{e.portfolio}</td>
                    <td className="text-[#C8D3E8] font-mono font-semibold">{e.ticker}</td>
                    <td className="text-[#A8B4C8]">{e.issue}</td>
                    <td>
                      <span className={cn('text-[10px] font-medium',
                        e.severity === 'high' ? 'text-[#EF4444]' :
                        e.severity === 'medium' ? 'text-[#F59E0B]' : 'text-[#60A5FA]')}>
                        {e.severity.toUpperCase()}
                      </span>
                    </td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      {e.status !== 'resolved' && (
                        <button className="text-[10px] text-[#60A5FA] hover:underline">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'P&L Runs' || activeTab === 'Price Validation' || activeTab === 'FX Conversion') && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[#4B5A72] text-sm mb-1">{activeTab}</div>
              <div className="text-[#6B7A95] text-xs">Select a valuation run to view {activeTab.toLowerCase()} details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
