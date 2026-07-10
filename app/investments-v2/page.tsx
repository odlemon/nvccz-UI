'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchDashboardSummary,
  fetchDashboardAllocation,
  fetchDashboardCurrencyExposure,
  fetchDashboardFunds,
  recalculateDashboard,
  setOpsSelectedFundId,
} from '@/lib/store/slices/investmentOpsSlice'
import { PageHeader } from '@/components/investments-v2/page-header'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtDec(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PERIOD_OPTIONS: Array<'MTD' | 'QTD' | 'YTD'> = ['MTD', 'QTD', 'YTD']

const DOT_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#e879f9', '#f97316']

const ALLOCATION_COLORS: Record<string, string> = {
  equities: '#8b5cf6',
  cash: '#3b82f6',
  bonds: '#6366f1',
  funds: '#4338ca',
  commodities: '#e879f9',
  crypto: '#f97316',
  alternatives: '#10b981',
  other: '#64748b',
}

// ── Concentric rings SVG ──────────────────────────────────────────────────────
interface Ring { r: number; pct: number; color: string; width: number }
function ConcentricRings({ rings }: { rings: Ring[] }) {
  const cx = 80, cy = 80
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const dash = (ring.pct / 100) * circ
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={ring.width} />
            <circle
              cx={cx} cy={cy} r={ring.r}
              fill="none" stroke={ring.color} strokeWidth={ring.width}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        )
      })}
    </svg>
  )
}

const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--foreground)' }} className="font-semibold">{fmtDec(payload[0].value)}%</div>
        <div style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      </div>
    )
  }
  return null
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

// ── Period dropdown ───────────────────────────────────────────────────────────
function PeriodPill({ value, onChange }: { value: string; onChange: (v: 'MTD' | 'QTD' | 'YTD') => void }) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={e => onChange(e.target.value as 'MTD' | 'QTD' | 'YTD')}
        className="sort-pill text-[11px] appearance-none pr-5 cursor-pointer"
        style={{ background: 'transparent' }}
      >
        {PERIOD_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" />
    </div>
  )
}

// ── Fund selector dropdown ────────────────────────────────────────────────────
function FundPill({ funds, selectedId, onChange }: {
  funds: Array<{ id: string; name: string }>
  selectedId: string | null
  onChange: (id: string) => void
}) {
  return (
    <div className="relative inline-flex">
      <select
        value={selectedId ?? ''}
        onChange={e => onChange(e.target.value)}
        className="sort-pill text-[11px] appearance-none pr-5 cursor-pointer"
        style={{ background: 'transparent', maxWidth: '160px' }}
      >
        {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const {
    dashboardFunds, dashboardFundsLoading,
    selectedFundId,
    dashboardSummary, dashboardSummaryLoading,
    dashboardAllocation, dashboardAllocationLoading,
    dashboardCurrencyExposure, dashboardCurrencyExposureLoading,
    recalculating,
  } = useAppSelector(s => s.investmentOps)

  const [period, setPeriod] = useState<'MTD' | 'QTD' | 'YTD'>('MTD')

  // Initial load
  useEffect(() => {
    dispatch(fetchDashboardFunds())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchDashboardSummary({ period }))
  }, [dispatch, period])

  // Load allocation + currency exposure when fund changes
  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchDashboardAllocation(selectedFundId))
    dispatch(fetchDashboardCurrencyExposure(selectedFundId))
  }, [dispatch, selectedFundId])

  const handleRecalculate = async () => {
    if (!selectedFundId) return
    await dispatch(recalculateDashboard(selectedFundId))
    dispatch(fetchDashboardSummary({ period }))
    dispatch(fetchDashboardAllocation(selectedFundId))
    dispatch(fetchDashboardCurrencyExposure(selectedFundId))
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const portfolioRows = dashboardSummary?.portfolios ?? []

  const currencyBars = useMemo(() => {
    if (!dashboardCurrencyExposure.length) return []
    const grand = dashboardCurrencyExposure.reduce((s, e) => s + e.value, 0)
    const entries = dashboardCurrencyExposure
      .map(e => ({ name: e.currency, value: grand > 0 ? (e.value / grand) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
    const maxVal = Math.max(...entries.map(e => e.value))
    return entries.map(e => ({ ...e, highlight: e.value === maxVal }))
  }, [dashboardCurrencyExposure])

  const allocationRings = useMemo(() => {
    if (!dashboardAllocation) return []
    const radii = [68, 53, 38, 23, 12, 8, 4]
    return Object.entries(dashboardAllocation)
      .filter(([, bucket]) => bucket.value > 0)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, radii.length)
      .map(([label, bucket], i) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        pct: Math.round(bucket.pct),
        color: ALLOCATION_COLORS[label] ?? DOT_COLORS[i % DOT_COLORS.length],
        r: radii[i],
        width: 10,
      }))
  }, [dashboardAllocation])

  const topCurrency = currencyBars[0]
  const selectedFundRow = portfolioRows.find(p => p.fundId === selectedFundId)

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Fund selector row */}
        {dashboardFunds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Fund:</span>
            <FundPill funds={dashboardFunds} selectedId={selectedFundId} onChange={id => dispatch(setOpsSelectedFundId(id))} />
            {selectedFundRow && (
              <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                Base currency: <span style={{ color: 'var(--foreground)' }}>{selectedFundRow.baseCurrency}</span>
              </span>
            )}
            {(dashboardSummaryLoading || dashboardFundsLoading) && <Spinner />}
          </div>
        )}

        {/* ── Row 1: Portfolios table + Asset Allocation ── */}
        <div className="grid grid-cols-[1fr_280px] gap-4">

          {/* Portfolios card */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Portfolios</span>
              <div className="flex items-center gap-2">
                <PeriodPill value={period} onChange={setPeriod} />
                <button onClick={handleRecalculate} disabled={recalculating} className="btn-white text-[12px] py-1 px-4 flex items-center gap-1.5 disabled:opacity-60">
                  <RefreshCw className={cn('w-3 h-3', recalculating && 'animate-spin')} />
                  Recalculate
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {dashboardSummaryLoading ? (
                <div className="flex items-center justify-center py-8"><Spinner /></div>
              ) : portfolioRows.length === 0 ? (
                <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                  No portfolio data available
                </div>
              ) : (
                <table className="arcus-table">
                  <thead>
                    <tr>
                      <th>Fund</th>
                      <th>NAV</th>
                      <th>P&amp;L</th>
                      <th>In %</th>
                      <th>Status</th>
                      <th>Last Recalc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioRows.map((row, i) => (
                      <tr
                        key={row.fundId}
                        className="cursor-pointer"
                        onClick={() => dispatch(setOpsSelectedFundId(row.fundId))}
                        style={row.fundId === selectedFundId ? { background: 'rgba(59,130,246,0.08)' } : undefined}
                      >
                        <td className="font-medium" style={{ color: 'var(--foreground)' }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                            {row.name}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>
                            {fmt(row.nav)} {row.baseCurrency}
                          </span>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[12px]"
                            style={{ color: row.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                            {row.pnl >= 0 ? '+' : ''}{fmtDec(row.pnl)}
                          </span>
                        </td>
                        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                          {row.pnlPct.toFixed(2)}%
                        </td>
                        <td>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                            style={row.status === 'OK'
                              ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
                              : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          {row.lastRecalculation ? new Date(row.lastRecalculation).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Asset Allocation card */}
          <div className="rounded-2xl p-4 flex flex-col" style={{ background: 'linear-gradient(145deg, #2d1f6e 0%, #3730a3 50%, #1e1b4b 100%)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-[13px] font-semibold">Asset Allocation</span>
            </div>
            <div className="flex items-center justify-center my-2">
              {dashboardAllocationLoading ? (
                <div className="w-[160px] h-[160px] flex items-center justify-center"><Spinner /></div>
              ) : allocationRings.length > 0 ? (
                <ConcentricRings rings={allocationRings} />
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-[11px]" style={{ color: '#c4b5fd' }}>
                  No data
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {allocationRings.map(r => (
                <div key={r.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-[11px]" style={{ color: '#c4b5fd' }}>{r.label} ({r.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Currency Exposure + Funds ── */}
        <div className="grid grid-cols-[1fr_1fr] gap-4">

          {/* Currency Exposure */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Currency Exposure</span>
            </div>
            <div className="p-4">
              {dashboardCurrencyExposureLoading ? (
                <div className="flex items-center justify-center h-[200px]"><Spinner /></div>
              ) : currencyBars.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                  No exposure data
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={currencyBars} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="25%">
                      <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CurrencyTooltip />} cursor={false} />
                      <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={42}>
                        {currencyBars.map((entry, i) => (
                          <Cell key={i} fill={entry.highlight ? '#3b82f6' : '#1e2d45'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {topCurrency && (
                    <div className="flex justify-center mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
                        {topCurrency.name}: {topCurrency.value.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Funds */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Funds</span>
            </div>
            <div className="overflow-x-auto">
              {dashboardFundsLoading ? (
                <div className="flex items-center justify-center py-8"><Spinner /></div>
              ) : dashboardFunds.length === 0 ? (
                <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No funds available</div>
              ) : (
                <table className="arcus-table">
                  <thead>
                    <tr>
                      <th>Fund Name</th>
                      <th>NAV</th>
                      <th>Currency</th>
                      <th>Status</th>
                      <th>Last Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardFunds.map((fund, i) => (
                      <tr
                        key={fund.id}
                        className="cursor-pointer"
                        onClick={() => dispatch(setOpsSelectedFundId(fund.id))}
                        style={fund.id === selectedFundId ? { background: 'rgba(59,130,246,0.08)' } : undefined}
                      >
                        <td style={{ color: 'var(--foreground)' }} className="font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                            {fund.name}
                          </span>
                        </td>
                        <td className="font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>
                          {fund.latestSnapshot ? fmt(Number(fund.latestSnapshot.navBaseCurrency)) : '—'}
                        </td>
                        <td style={{ color: 'var(--muted-foreground)' }}>{fund.baseCurrencyCode}</td>
                        <td>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                            style={fund.latestSnapshot?.status === 'OK'
                              ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
                              : { background: 'rgba(100,116,139,0.15)', color: '#64748b' }}
                          >
                            {fund.latestSnapshot?.status ?? 'STALE'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted-foreground)' }}>
                          {fund.latestSnapshot ? new Date(fund.latestSnapshot.asOf).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* PnL summary strip */}
        {selectedFundRow && (
          <div className="grid grid-cols-2 gap-4">
            <div className="arcus-card p-4">
              <div className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>P&amp;L ({period})</div>
              <div className="text-[20px] font-mono font-semibold"
                style={{ color: selectedFundRow.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                {selectedFundRow.pnl >= 0 ? '+' : ''}{fmtDec(selectedFundRow.pnl)}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {selectedFundRow.pnlPct.toFixed(2)}% of NAV
              </div>
            </div>
            <div className="arcus-card p-4">
              <div className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>Realized P&amp;L ({period})</div>
              <div className="text-[20px] font-mono font-semibold"
                style={{ color: selectedFundRow.periodRealizedPnl >= 0 ? '#10b981' : '#f43f5e' }}>
                {selectedFundRow.periodRealizedPnl >= 0 ? '+' : ''}{fmtDec(selectedFundRow.periodRealizedPnl)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
