'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatCard } from '@/components/arcus/stat-card'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, createValuationRun, fetchValuationExceptions } from '@/lib/store/slices/investmentOpsSlice'
import { fetchSecurities } from '@/lib/store/slices/investmentsSlice'

// NAV trend chart stays a mock proxy — no history/trend endpoint has been provided yet.
const navTrend = [
  { date: 'Jun 1', equity: 139.2, multiAsset: 85.4, fixedIncome: 56.8, asia: 32.1 },
  { date: 'Jun 15', equity: 140.8, multiAsset: 86.1, fixedIncome: 56.5, asia: 32.8 },
  { date: 'Jul 1', equity: 141.9, multiAsset: 86.8, fixedIncome: 56.2, asia: 33.1 },
  { date: 'Jul 7', equity: 142.85, multiAsset: 87.32, fixedIncome: 56.10, asia: 33.45 },
]

function runStatusBadge(status: string) {
  if (status === 'COMPLETED') return 'validated'
  if (status === 'COMPLETED_WITH_EXCEPTIONS') return 'warning'
  return status.toLowerCase().replace(/_/g, ' ')
}

const tabs = ['NAV Runs', 'P&L Runs', 'Price Validation', 'FX Conversion', 'Exceptions']

export default function ValuationPage() {
  const dispatch = useAppDispatch()
  const { portfolios, selectedFundId, valuationRuns, valuationRunning, valuationExceptions, valuationExceptionsLoading } =
    useAppSelector((s) => s.investmentOps)
  const { securities } = useAppSelector((s) => s.investments)
  const [activeTab, setActiveTab] = useState('NAV Runs')

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchSecurities())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchValuationExceptions({ fundId: selectedFundId ?? undefined }))
  }, [dispatch, selectedFundId])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'
  const ticker = (securityId: string | null) => (securityId ? securities.find((s) => s.id === securityId)?.symbol ?? '—' : '—')

  const handleRun = () => {
    if (!selectedFundId) return
    dispatch(createValuationRun({ fundId: selectedFundId, costBasisMethod: 'WAC' }))
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
            {t === 'Exceptions' && valuationExceptions.length > 0 && (
              <span className="ml-1.5 bg-[#EF4444] text-white text-[9px] rounded-full px-1.5">{valuationExceptions.length}</span>
            )}
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
                  disabled={valuationRunning || !selectedFundId}
                  className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  <RefreshCw className={cn('w-3 h-3', valuationRunning && 'animate-spin')} />
                  {valuationRunning ? 'Running Valuation...' : 'Run Valuation'}
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

            {/* Valuation runs table — session history only, no list-all-runs endpoint exists */}
            <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06]">
                <div className="text-xs font-semibold text-[#E8EDF5]">Valuation Runs</div>
              </div>
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Portfolio</th>
                    <th>Val Date</th>
                    <th className="text-right">NAV</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th className="text-right">Exceptions</th>
                  </tr>
                </thead>
                <tbody>
                  {valuationRuns.map(r => (
                    <tr key={r.id}>
                      <td className="text-[#60A5FA] font-mono text-[11px]">{r.id}</td>
                      <td className="text-[#A8B4C8]">{fundName(r.fundId)}</td>
                      <td className="text-[#6B7A95]">{new Date(r.asOf).toLocaleString()}</td>
                      <td className="text-right font-mono">{Number(r.navBaseCurrency).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="text-[#6B7A95] text-xs">{r.parametersJson.costBasisMethod}</td>
                      <td><StatusBadge status={runStatusBadge(r.status)} /></td>
                      <td className="text-right font-mono" style={{ color: r.exceptions.length > 0 ? '#F59E0B' : '#6B7A95' }}>{r.exceptions.length}</td>
                    </tr>
                  ))}
                  {valuationRuns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No valuation runs yet this session — click "Run Valuation" above.</td>
                    </tr>
                  )}
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
                </tr>
              </thead>
              <tbody>
                {valuationExceptions.map(e => (
                  <tr key={e.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{e.id}</td>
                    <td className="text-[#A8B4C8]">{fundName(e.fundId)}</td>
                    <td className="text-[#C8D3E8] font-mono font-semibold">{ticker(e.securityId)}</td>
                    <td className="text-[#A8B4C8]">{e.exceptionType} — {e.message}</td>
                    <td className="text-[10px] text-[#4B5A72]">—</td>
                    <td><StatusBadge status={e.status.toLowerCase()} /></td>
                  </tr>
                ))}
                {valuationExceptions.length === 0 && !valuationExceptionsLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No valuation exceptions.</td>
                  </tr>
                )}
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
