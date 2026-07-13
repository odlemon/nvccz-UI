'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts'
import { Folder, FolderOpen, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPortfolios,
  fetchPortfolioOverview,
  fetchPortfolioHoldings,
  fetchPortfolioTransactions,
  fetchPortfolioExposure,
  fetchDashboardCurrencyExposure,
  recalculatePortfolio,
  setOpsSelectedFundId,
} from '@/lib/store/slices/investmentOpsSlice'
import { effectiveHoldingValue, type Holding } from '@/lib/api/investments-api'

const DOT_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#e879f9', '#f97316']

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

// ── Country rings chart ────────────────────────────────────────────
interface Ring { r: number; pct: number; color: string }
function CountryRings({ rings }: { rings: Ring[] }) {
  const cx = 70, cy = 70
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const dash = (ring.pct / 100) * circ
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
            <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke={ring.color} strokeWidth={9}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Collapsible accordion row for holdings ────────────────────────
function HoldingsAccordion({ label, holdings, total, pct, dot }: {
  label: string
  holdings: Holding[]
  total: number
  pct: string
  dot: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="cursor-pointer hover:bg-[rgba(139,92,246,0.08)]" onClick={() => setExpanded(!expanded)}>
        <td style={{ color: 'var(--foreground)' }} className="font-medium">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {label}
          </div>
        </td>
        <td>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
            {fmt(total)}
          </span>
        </td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>{pct}</td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>—</td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>—</td>
        <td style={{ color: 'var(--foreground)', fontWeight: 600 }}>{holdings.length}</td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>{fmt(total)}</td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>0.00</td>
        <td style={{ color: 'var(--muted-foreground)' }}>—</td>
      </tr>
      {expanded && holdings.map((h) => (
        <tr key={h.id} style={{ background: 'rgba(59,130,246,0.05)' }}>
          <td style={{ color: 'var(--muted-foreground)', paddingLeft: '2.5rem' }} className="text-[11px]">
            <div className="flex flex-col leading-tight">
              <span>{h.security?.symbol ?? h.securityId.slice(0, 8)}</span>
              {h.security?.name && <span className="text-[10px] opacity-70">{h.security.name}</span>}
            </div>
          </td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {fmt(effectiveHoldingValue(h))}
          </td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>—</td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>—</td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>—</td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {h.quantity.toLocaleString()}
          </td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {fmt(effectiveHoldingValue(h))}
          </td>
          <td className="font-mono text-[11px]" style={{ color: h.unrealizedPnl && h.unrealizedPnl >= 0 ? '#10b981' : '#f43f5e' }}>
            {h.unrealizedPnl != null ? fmt(h.unrealizedPnl) : '—'}
          </td>
          <td className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {h.lastValuationAt ? new Date(h.lastValuationAt).toLocaleDateString() : '—'}
          </td>
        </tr>
      ))}
    </>
  )
}

export default function PortfoliosPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios, portfoliosLoading,
    selectedFundId,
    portfolioOverview, portfolioOverviewLoading,
    portfolioHoldings, portfolioHoldingsLoading,
    portfolioTransactions, portfolioTransactionsLoading,
    portfolioExposure,
    dashboardCurrencyExposure,
    portfolioRecalculating,
  } = useAppSelector(s => s.investmentOps)
  const [activePage, setActivePage] = useState(1)

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchPortfolioOverview(selectedFundId))
    dispatch(fetchPortfolioHoldings(selectedFundId))
    dispatch(fetchPortfolioTransactions(selectedFundId))
    dispatch(fetchPortfolioExposure(selectedFundId))
    dispatch(fetchDashboardCurrencyExposure(selectedFundId))
  }, [dispatch, selectedFundId])

  const handleRecalculate = async () => {
    if (!selectedFundId) return
    await dispatch(recalculatePortfolio(selectedFundId))
    dispatch(fetchPortfolioOverview(selectedFundId))
    dispatch(fetchPortfolioHoldings(selectedFundId))
    dispatch(fetchPortfolioExposure(selectedFundId))
  }

  // Group holdings by exchange (unchanged logic, real data source now)
  const groupedHoldings = useMemo(() => {
    if (!portfolioHoldings.length) return []
    const groups: Record<string, Holding[]> = {}
    let grandTotal = 0
    for (const h of portfolioHoldings) {
      const key = h.security?.exchangeCode ?? 'Cash'
      if (!groups[key]) groups[key] = []
      groups[key].push(h)
      grandTotal += effectiveHoldingValue(h)
    }
    return Object.entries(groups).map(([label, items], i) => {
      const total = items.reduce((s, h) => s + effectiveHoldingValue(h), 0)
      return {
        label,
        holdings: items,
        total,
        pct: grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(2) + '%' : '0.00%',
        dot: DOT_COLORS[i % DOT_COLORS.length],
      }
    })
  }, [portfolioHoldings])

  // Country/exchange rings — now real, from getPortfolioExposure().byExchange
  const countryRings = useMemo(() => {
    if (!portfolioExposure?.byExchange.length) return []
    const radii = [68, 58, 48, 38, 28, 18]
    return portfolioExposure.byExchange
      .slice(0, 6)
      .map((e, i) => ({ label: e.key, pct: Math.round(e.pct), color: DOT_COLORS[i % DOT_COLORS.length], r: radii[i] }))
  }, [portfolioExposure])

  // Sector bars — still a client-derived proxy (no sector-exposure endpoint provided yet)
  const sectorBars = useMemo(() => {
    const totals: Record<string, number> = {}
    let grand = 0
    for (const h of portfolioHoldings) {
      const key = h.security?.exchangeCode ?? 'Other'
      const val = effectiveHoldingValue(h)
      totals[key] = (totals[key] ?? 0) + val
      grand += val
    }
    const bars = Object.entries(totals)
      .map(([name, val]) => ({ name: name.slice(0, 3), value: grand > 0 ? (val / grand) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
    const maxVal = Math.max(...bars.map(b => b.value))
    return bars.map(b => ({ ...b, highlight: b.value === maxVal }))
  }, [portfolioHoldings])

  // Currency pie — real, from getDashboardCurrencyExposure(fundId)
  const currencyPie = useMemo(() => {
    if (!dashboardCurrencyExposure.length) return []
    const grand = dashboardCurrencyExposure.reduce((s, e) => s + e.value, 0)
    const colors = ['#4F7FEA', '#93B4F5', '#9B7FD6', '#D9E0F5']
    return dashboardCurrencyExposure
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((e, i) => ({ name: e.currency, value: grand > 0 ? Math.round((e.value / grand) * 100) : 0, color: colors[i] }))
  }, [dashboardCurrencyExposure])

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Portfolios" />
      <PortfoliosSubNav />

      {/* ── Fund folder tabs ── */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-4 flex-shrink-0 overflow-x-auto">
        {portfoliosLoading ? (
          <Spinner />
        ) : portfolios.length === 0 ? (
          <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No funds available</span>
        ) : (
          portfolios.map((fund) => (
            <button
              key={fund.id}
              onClick={() => dispatch(setOpsSelectedFundId(fund.id))}
              className={cn('folder-tab', selectedFundId === fund.id && 'active')}
            >
              {selectedFundId === fund.id
                ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                : <Folder className="w-3.5 h-3.5 flex-shrink-0" />}
              {fund.name}
            </button>
          ))
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">

        {!portfolioOverview ? (
          <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
            {portfolioOverviewLoading ? 'Loading…' : 'Select a fund to view holdings'}
          </div>
        ) : (
          <>
            {/* ── Portfolio composition card ── */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <div className="flex items-center gap-2 flex-wrap">
                  <Folder className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{portfolioOverview.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: 'var(--muted-foreground)' }}>
                    NAV <span className="font-mono" style={{ color: '#3b82f6' }}>
                      {fmt(portfolioOverview.nav)} {portfolioOverview.baseCurrency}
                    </span>
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    P&L <span className="font-mono" style={{ color: portfolioOverview.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                      {portfolioOverview.pnl >= 0 ? '+' : ''}{fmt(portfolioOverview.pnl)} {portfolioOverview.baseCurrency}
                    </span>
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    Manager <span style={{ color: 'var(--foreground)' }}>{portfolioOverview.portfolioManager}</span>
                  </span>
                  {portfolioHoldingsLoading && <Spinner />}
                </div>
                <button onClick={handleRecalculate} disabled={portfolioRecalculating} className="btn-white text-[12px] py-1 px-4 flex items-center gap-1.5 disabled:opacity-60">
                  <RefreshCw className={cn('w-3 h-3', portfolioRecalculating && 'animate-spin')} />
                  Recalculate
                </button>
              </div>

              {/* Composition table with collapsible accordions */}
              <div className="overflow-x-auto">
                {portfolioHoldingsLoading ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : groupedHoldings.length === 0 ? (
                  <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                    No holdings data
                  </div>
                ) : (
                  <table className="arcus-table">
                    <thead>
                      <tr>
                        <th>Included</th>
                        <th>Total</th>
                        <th>In%</th>
                        <th>Interest</th>
                        <th>Dividend</th>
                        <th>Positions</th>
                        <th>Exposure</th>
                        <th>Margin</th>
                        <th>Valuedate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedHoldings.map((group) => (
                        <HoldingsAccordion
                          key={group.label}
                          label={group.label}
                          holdings={group.holdings}
                          total={group.total}
                          pct={group.pct}
                          dot={group.dot}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── 3 inline charts ── */}
              {!portfolioHoldingsLoading && portfolioHoldings.length > 0 && (
                <div
                  className="grid grid-cols-3 gap-0"
                  style={{
                    borderTop: '1px solid var(--border)',
                    background:
                      'radial-gradient(circle at 15% 30%, rgba(99,102,241,0.10), transparent 60%), radial-gradient(circle at 85% 70%, rgba(139,92,246,0.08), transparent 55%)',
                  }}
                >
                  {/* Country/exchange rings — real */}
                  <div className="flex gap-4 p-4 items-center" style={{ borderRight: '1px solid var(--border)' }}>
                    {countryRings.length > 0 ? (
                      <>
                        <CountryRings rings={countryRings} />
                        <div className="space-y-1.5">
                          {countryRings.map(r => (
                            <div key={r.label} className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                {r.label}({r.pct}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>No data</div>
                    )}
                  </div>

                  {/* Sector bars — still derived (no sector-exposure endpoint yet) */}
                  <div className="p-4 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
                    {sectorBars.length > 0 ? (
                      <>
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height={130}>
                            <BarChart data={sectorBars} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="20%">
                              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis hide />
                              <Tooltip
                                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                                cursor={false}
                              />
                              <Bar dataKey="value" radius={[4, 4, 4, 4]} maxBarSize={24}>
                                {sectorBars.map((e, i) => (
                                  <Cell key={i} fill={e.highlight ? '#3b82f6' : '#1e2d45'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        {sectorBars[0] && (
                          <div className="flex justify-center mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
                              {sectorBars[0].value.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>No data</div>
                    )}
                  </div>

                  {/* Currency pie — real */}
                  <div className="p-4 flex items-center gap-4">
                    {currencyPie.length > 0 ? (
                      <>
                        <ResponsiveContainer width={110} height={110}>
                          <PieChart>
                            <Pie data={currencyPie} cx="50%" cy="50%" outerRadius={52} paddingAngle={1} dataKey="value" strokeWidth={0}>
                              {currencyPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5">
                          {currencyPie.map(c => (
                            <div key={c.name} className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                {c.name}({c.value}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>No data</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Recent Transactions ── */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
                  Recent Transactions{portfolioTransactions.length ? ` (${portfolioTransactions.length})` : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                {portfolioTransactionsLoading ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : portfolioTransactions.length === 0 ? (
                  <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No transactions available</div>
                ) : (
                  <table className="arcus-table">
                    <thead>
                      <tr>
                        <th>Trade Ref</th>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Price</th>
                        <th>Status</th>
                        <th>Trade Date</th>
                        <th className="text-right">Realized P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioTransactions.slice((activePage - 1) * 10, activePage * 10).map((txn) => (
                        <tr key={txn.id}>
                          <td className="font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>{txn.tradeRef}</td>
                          <td className="font-mono text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>{txn.symbol}</td>
                          <td>
                            <span className={cn(
                              'text-[11px] px-2 py-0.5 rounded-full font-medium',
                              txn.type === 'PURCHASE' ? 'bg-[#10b98114] text-[#10b981]' : 'bg-[#f43f5e14] text-[#f43f5e]'
                            )}>
                              {txn.type === 'PURCHASE' ? 'BUY' : 'SELL'}
                            </span>
                          </td>
                          <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                            {txn.quantity.toLocaleString()}
                          </td>
                          <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {txn.price.toFixed(4)}
                          </td>
                          <td>
                            <span className={cn(
                              'text-[11px] px-2 py-0.5 rounded-full font-medium',
                              txn.status === 'SETTLED' ? 'bg-[#10b98114] text-[#10b981]' :
                              txn.status === 'SETTLEMENT_FAILED' ? 'bg-[#f43f5e14] text-[#f43f5e]' :
                              'bg-[#64748b14] text-[#64748b]'
                            )}>
                              {txn.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--muted-foreground)' }}>{new Date(txn.tradeDate).toLocaleDateString()}</td>
                          <td className="text-right font-mono" style={{ color: txn.realizedPnl != null && txn.realizedPnl >= 0 ? '#10b981' : txn.realizedPnl != null ? '#f43f5e' : 'var(--muted-foreground)' }}>
                            {txn.realizedPnl != null ? fmt(txn.realizedPnl) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {portfolioTransactions.length > 10 && (
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    Showing {Math.min(10, portfolioTransactions.length - (activePage - 1) * 10)} out of {portfolioTransactions.length} results
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="pg-btn" onClick={() => setActivePage(p => Math.max(1, p - 1))}>‹</button>
                    {Array.from({ length: Math.ceil(portfolioTransactions.length / 10) }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setActivePage(p)} className={cn('pg-btn', activePage === p && 'active')}>
                        {p}
                      </button>
                    ))}
                    <button className="pg-btn" onClick={() => setActivePage(p => Math.min(Math.ceil(portfolioTransactions.length / 10), p + 1))}>›</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
