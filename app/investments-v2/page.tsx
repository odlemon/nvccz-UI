'use client'

import { useEffect, useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Lock, ChevronDown, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchFunds,
  fetchFundHoldings,
  fetchFundPnL,
  setSelectedFundId,
  setPnlPeriod,
} from '@/lib/store/slices/investmentsSlice'
import { effectiveHoldingValue } from '@/lib/api/investments-api'
import { PageHeader } from '@/components/investments-v2/page-header'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtDec(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PERIOD_OPTIONS: Array<'MTD' | 'QTD' | 'YTD'> = ['MTD', 'QTD', 'YTD']

const DOT_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#e879f9', '#f97316']

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
    funds, fundsLoading,
    selectedFundId,
    holdings, holdingsLoading,
    pnl, pnlLoading,
    pnlPeriod,
  } = useAppSelector(s => s.investments)

  // Initial load
  useEffect(() => {
    dispatch(fetchFunds())
  }, [dispatch])

  // Load holdings + PnL when fund or period changes
  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchFundHoldings(selectedFundId))
    dispatch(fetchFundPnL({ fundId: selectedFundId, period: pnlPeriod }))
  }, [dispatch, selectedFundId, pnlPeriod])

  // ── Derived data ────────────────────────────────────────────────────────────

  // Portfolios table: group holdings by asset_class
  const portfolioRows = useMemo(() => {
    if (!holdings.length) return []
    const groups: Record<string, { nav: number; pnl: number; count: number }> = {}
    for (const h of holdings) {
      const key = h.security?.exchangeCode ?? 'Unknown'
      if (!groups[key]) groups[key] = { nav: 0, pnl: 0, count: 0 }
      groups[key].nav += effectiveHoldingValue(h)
      groups[key].pnl += h.unrealizedPnl ?? 0
      groups[key].count++
    }
    return Object.entries(groups).map(([name, g], i) => ({
      name,
      nav: g.nav,
      pnl: g.pnl,
      pnlPct: g.nav > 0 ? (g.pnl / g.nav) * 100 : 0,
      count: g.count,
      dot: DOT_COLORS[i % DOT_COLORS.length],
    }))
  }, [holdings])

  // Currency exposure: group by currency
  const currencyBars = useMemo(() => {
    if (!holdings.length) return []
    const totals: Record<string, number> = {}
    let grand = 0
    for (const h of holdings) {
      const cur = h.wacCurrencyCode ?? 'USD'
      const val = effectiveHoldingValue(h)
      totals[cur] = (totals[cur] ?? 0) + val
      grand += val
    }
    const entries = Object.entries(totals)
      .map(([name, val]) => ({ name, value: grand > 0 ? (val / grand) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
    const top4 = entries.slice(0, 4)
    const otherVal = entries.slice(4).reduce((s, e) => s + e.value, 0)
    if (otherVal > 0) top4.push({ name: 'Others', value: otherVal })
    const maxVal = Math.max(...top4.map(e => e.value))
    return top4.map(e => ({ ...e, highlight: e.value === maxVal }))
  }, [holdings])

  // Asset allocation (concentric rings) by security type
  const assetAllocationRings = useMemo(() => {
    if (!holdings.length) return []
    const totals: Record<string, number> = {}
    let grand = 0
    for (const h of holdings) {
      const key = h.security?.exchangeCode ?? 'Other'
      const val = effectiveHoldingValue(h)
      totals[key] = (totals[key] ?? 0) + val
      grand += val
    }
    const colors = ['#8b5cf6', '#3b82f6', '#6366f1', '#4338ca', '#e879f9']
    const radii = [68, 53, 38, 23, 12]
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, val], i) => ({
        label,
        pct: grand > 0 ? Math.round((val / grand) * 100) : 0,
        color: colors[i],
        r: radii[i],
        width: 10,
      }))
  }, [holdings])

  // Allocation by Security (if we have per-security data)
  const securityRows = useMemo(() => {
    return holdings
      .filter(h => h.security)
      .map((h, i) => ({
        name: h.security!.name ?? h.security!.symbol,
        symbol: h.security!.symbol,
        value: effectiveHoldingValue(h),
        pnl: h.unrealizedPnl ?? 0,
        dot: DOT_COLORS[i % DOT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [holdings])

  const topCurrency = currencyBars[0]
  const selectedFund = funds.find(f => f.id === selectedFundId)

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Fund selector row */}
        {funds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Fund:</span>
            <FundPill funds={funds} selectedId={selectedFundId} onChange={id => dispatch(setSelectedFundId(id))} />
            {selectedFund && (
              <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                Base currency: <span style={{ color: 'var(--foreground)' }}>{selectedFund.base_currency}</span>
              </span>
            )}
            {(holdingsLoading || fundsLoading) && <Spinner />}
          </div>
        )}

        {/* ── Row 1: Portfolios table + Asset Allocation ── */}
        <div className="grid grid-cols-[1fr_280px] gap-4">

          {/* Portfolios card */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Portfolios</span>
              <div className="flex items-center gap-2">
                <PeriodPill value={pnlPeriod} onChange={v => dispatch(setPnlPeriod(v))} />
                <button className="btn-white text-[12px] py-1 px-4">Recalculate</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {holdingsLoading ? (
                <div className="flex items-center justify-center py-8"><Spinner /></div>
              ) : portfolioRows.length === 0 ? (
                <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                  {fundsLoading ? 'Loading funds…' : 'No holdings data available'}
                </div>
              ) : (
                <table className="arcus-table">
                  <thead>
                    <tr>
                      <th>Asset Class</th>
                      <th>Market Value</th>
                      <th>Positions</th>
                      <th>Unrealized P&amp;L</th>
                      <th>In %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioRows.map((row) => (
                      <tr key={row.name}>
                        <td className="font-medium" style={{ color: 'var(--foreground)' }}>{row.name}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                            {fmt(row.nav)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted-foreground)' }}>{row.count}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[12px]"
                            style={{ color: row.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                            {row.pnl >= 0 ? '+' : ''}{fmtDec(row.pnl)}
                          </span>
                        </td>
                        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                          {row.pnlPct.toFixed(2)}%
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
              <PeriodPill value={pnlPeriod} onChange={v => dispatch(setPnlPeriod(v))} />
            </div>
            <div className="flex items-center justify-center my-2">
              {holdingsLoading ? (
                <div className="w-[160px] h-[160px] flex items-center justify-center"><Spinner /></div>
              ) : assetAllocationRings.length > 0 ? (
                <ConcentricRings rings={assetAllocationRings} />
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-[11px]" style={{ color: '#c4b5fd' }}>
                  No data
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {assetAllocationRings.map(r => (
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
              <PeriodPill value={pnlPeriod} onChange={v => dispatch(setPnlPeriod(v))} />
            </div>
            <div className="p-4">
              {holdingsLoading ? (
                <div className="flex items-center justify-center h-[200px]"><Spinner /></div>
              ) : currencyBars.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                  No holdings data
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
              <div className="flex items-center gap-2">
                <PeriodPill value={pnlPeriod} onChange={v => dispatch(setPnlPeriod(v))} />
                <button className="btn-white text-[12px] py-1 px-4">New Valuation</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {fundsLoading ? (
                <div className="flex items-center justify-center py-8"><Spinner /></div>
              ) : funds.length === 0 ? (
                <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No funds available</div>
              ) : (
                <table className="arcus-table">
                  <thead>
                    <tr>
                      <th>Fund Name</th>
                      <th>NAV</th>
                      <th>Currency</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map((fund, i) => (
                      <tr
                        key={fund.id}
                        className="cursor-pointer"
                        onClick={() => dispatch(setSelectedFundId(fund.id))}
                        style={fund.id === selectedFundId ? { background: 'rgba(59,130,246,0.08)' } : undefined}
                      >
                        <td style={{ color: 'var(--foreground)' }} className="font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                            {fund.name}
                          </span>
                        </td>
                        <td className="font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>
                          {fund.nav != null ? fmt(fund.nav) : '—'}
                        </td>
                        <td style={{ color: 'var(--muted-foreground)' }}>{fund.base_currency}</td>
                        <td style={{ color: 'var(--muted-foreground)' }}>
                          {fund.nav_updated_at ? new Date(fund.nav_updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button className="w-6 h-6 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity">
                            <Lock className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Allocation by Security (only if holdings have security data) ── */}
        {securityRows.length > 0 && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Allocation by Security</span>
              <PeriodPill value={pnlPeriod} onChange={v => dispatch(setPnlPeriod(v))} />
            </div>
            <div className="overflow-x-auto">
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Security</th>
                    <th>Symbol</th>
                    <th>Market Value</th>
                    <th>Unrealized P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {securityRows.map((row, i) => (
                    <tr key={row.symbol ?? i}>
                      <td style={{ color: 'var(--foreground)' }} className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                          {row.name}
                        </span>
                      </td>
                      <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{row.symbol}</td>
                      <td className="font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>{fmt(row.value)}</td>
                      <td className="font-mono text-[12px]" style={{ color: row.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                        {row.pnl >= 0 ? '+' : ''}{fmtDec(row.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PnL summary strip */}
        {pnl && (
          <div className="grid grid-cols-2 gap-4">
            <div className="arcus-card p-4">
              <div className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>Unrealized P&amp;L ({pnlPeriod})</div>
              <div className="text-[20px] font-mono font-semibold"
                style={{ color: (pnl.unrealized?.usd ?? 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                {(pnl.unrealized?.usd ?? 0) >= 0 ? '+' : ''}{fmtDec(pnl.unrealized?.usd ?? 0)}
              </div>
              {pnl.unrealized && (
                <div className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  FX rate {pnl.unrealized.fxRateUsed?.toFixed(4)} ({pnl.unrealized.fxRateSource})
                </div>
              )}
            </div>
            <div className="arcus-card p-4">
              <div className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>Realized P&amp;L (All-time)</div>
              <div className="text-[20px] font-mono font-semibold"
                style={{ color: (pnl.realized?.usd ?? 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                {(pnl.realized?.usd ?? 0) >= 0 ? '+' : ''}{fmtDec(pnl.realized?.usd ?? 0)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
