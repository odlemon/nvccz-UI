'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts'
import { Folder, FolderOpen, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchFunds, fetchFundHoldings, fetchFundPnL, setSelectedFundId } from '@/lib/store/slices/investmentsSlice'
import { effectiveHoldingValue } from '@/lib/api/investments-api'
import { fetchOrderbook, type MockOrder } from '@/lib/mock/orders-mock-data'

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
  holdings: any[]
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
        <td style={{ color: 'var(--foreground)', fontWeight: 600 }}>{holdings.length}</td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>{fmt(total)}</td>
        <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>0.00</td>
        <td style={{ color: 'var(--muted-foreground)' }}>—</td>
      </tr>
      {expanded && holdings.map((h) => (
        <tr key={h.id} style={{ background: 'rgba(59,130,246,0.05)' }}>
          <td style={{ color: 'var(--muted-foreground)', paddingLeft: '2.5rem' }} className="text-[11px]">
            {h.security?.symbol ?? h.securityId.slice(0, 8)}
          </td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {fmt(effectiveHoldingValue(h))}
          </td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {h.quantity.toLocaleString()}
          </td>
          <td className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {h.security?.name ?? '—'}
          </td>
          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {h.wac?.toFixed(4) ?? '—'}
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
  const { funds, fundsLoading, selectedFundId, holdings, holdingsLoading, pnl } = useAppSelector(s => s.investments)
  const [orders, setOrders] = useState<MockOrder[] | null>(null)
  const [activePage, setActivePage] = useState(1)

  useEffect(() => {
    dispatch(fetchFunds())
  }, [dispatch])

  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchFundHoldings(selectedFundId))
    dispatch(fetchFundPnL({ fundId: selectedFundId }))
  }, [dispatch, selectedFundId])

  useEffect(() => {
    dispatch(fetchOrderbook()).unwrap().then(setOrders)
  }, [dispatch])

  const selectedFund = funds.find(f => f.id === selectedFundId)

  // Group holdings by exchange
  const groupedHoldings = useMemo(() => {
    if (!holdings.length) return []
    const groups: Record<string, any[]> = {}
    let grandTotal = 0
    for (const h of holdings) {
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
  }, [holdings])

  // Country distribution (mock — based on exchange)
  const countryRings = useMemo(() => {
    const totals: Record<string, number> = {}
    let grand = 0
    for (const h of holdings) {
      const key = h.security?.exchangeCode ?? 'Other'
      const val = effectiveHoldingValue(h)
      totals[key] = (totals[key] ?? 0) + val
      grand += val
    }
    const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#0ea5e9']
    const radii = [68, 53, 38, 23]
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, val], i) => ({
        label,
        pct: grand > 0 ? Math.round((val / grand) * 100) : 0,
        color: colors[i],
        r: radii[i],
      }))
  }, [holdings])

  // Sector bars (mock — use exchange as sector proxy)
  const sectorBars = useMemo(() => {
    const totals: Record<string, number> = {}
    let grand = 0
    for (const h of holdings) {
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
  }, [holdings])

  // Currency pie
  const currencyPie = useMemo(() => {
    const totals: Record<string, number> = {}
    let grand = 0
    for (const h of holdings) {
      const cur = h.wacCurrencyCode ?? 'USD'
      const val = effectiveHoldingValue(h)
      totals[cur] = (totals[cur] ?? 0) + val
      grand += val
    }
    const colors = ['#3b82f6', '#8b5cf6', '#6366f1', '#0ea5e9']
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, val], i) => ({
        name,
        value: grand > 0 ? Math.round((val / grand) * 100) : 0,
        color: colors[i],
      }))
  }, [holdings])

  const totalNav = holdings.reduce((s, h) => s + effectiveHoldingValue(h), 0)
  const totalPnl = holdings.reduce((s, h) => s + (h.unrealizedPnl ?? 0), 0)

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Portfolios" />

      {/* ── Fund folder tabs ── */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-4 flex-shrink-0 overflow-x-auto">
        {fundsLoading ? (
          <Spinner />
        ) : funds.length === 0 ? (
          <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No funds available</span>
        ) : (
          funds.map((fund) => (
            <button
              key={fund.id}
              onClick={() => dispatch(setSelectedFundId(fund.id))}
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

        {!selectedFund ? (
          <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
            Select a fund to view holdings
          </div>
        ) : (
          <>
            {/* ── Portfolio composition card ── */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <div className="flex items-center gap-2 flex-wrap">
                  <Folder className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{selectedFund.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: 'var(--muted-foreground)' }}>
                    NAV <span className="font-mono" style={{ color: '#3b82f6' }}>
                      {holdingsLoading ? '...' : `${fmt(totalNav)} ${selectedFund.base_currency}`}
                    </span>
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    P&L <span className="font-mono" style={{ color: totalPnl >= 0 ? '#10b981' : '#f43f5e' }}>
                      {holdingsLoading ? '...' : `${totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)} ${selectedFund.base_currency}`}
                    </span>
                  </span>
                  {holdingsLoading && <Spinner />}
                </div>
                <button className="btn-white text-[12px] py-1 px-4">Recalculate</button>
              </div>

              {/* Composition table with collapsible accordions */}
              <div className="overflow-x-auto">
                {holdingsLoading ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : groupedHoldings.length === 0 ? (
                  <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                    No holdings data
                  </div>
                ) : (
                  <table className="arcus-table">
                    <thead>
                      <tr>
                        <th>Asset Class / Security</th>
                        <th>Total Value</th>
                        <th>In%</th>
                        <th>Positions</th>
                        <th>Exposure</th>
                        <th>P&amp;L</th>
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
              {!holdingsLoading && holdings.length > 0 && (
                <div className="grid grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--border)' }}>
                  {/* Country rings */}
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

                  {/* Sector bars */}
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

                  {/* Currency pie */}
                  <div className="p-4 flex items-center gap-4">
                    {currencyPie.length > 0 ? (
                      <>
                        <ResponsiveContainer width={110} height={110}>
                          <PieChart>
                            <Pie data={currencyPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
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

            {/* ── Orders section ── */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
                  Orders{orders ? `(${orders.length})` : ''}
                </span>
                <button className="btn-white text-[12px] py-1 px-4">New Position</button>
              </div>
              <div className="overflow-x-auto">
                {!orders ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : orders.length === 0 ? (
                  <div className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No orders available</div>
                ) : (
                  <table className="arcus-table">
                    <thead>
                      <tr>
                        <th>Order Ref</th>
                        <th>Security</th>
                        <th>Side</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Filled</th>
                        <th className="text-right">Price</th>
                        <th>Venue</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 10).map((order, i) => (
                        <tr key={order.id}>
                          <td className="font-mono text-[12px]" style={{ color: 'var(--foreground)' }}>{order.orderRef}</td>
                          <td>
                            <div className="flex flex-col">
                              <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
                                {order.securitySymbol}
                              </span>
                              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                {order.securityName}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={cn(
                              'text-[11px] px-2 py-0.5 rounded-full font-medium',
                              order.side === 'BUY' ? 'bg-[#10b98114] text-[#10b981]' : 'bg-[#f43f5e14] text-[#f43f5e]'
                            )}>
                              {order.side}
                            </span>
                          </td>
                          <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                            {order.quantity.toLocaleString()}
                          </td>
                          <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                            {order.filledQuantity.toLocaleString()}
                            <span className="ml-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                              ({order.quantity ? Math.round((order.filledQuantity / order.quantity) * 100) : 0}%)
                            </span>
                          </td>
                          <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {order.limitPrice != null ? order.limitPrice.toFixed(2) : order.avgFillPrice != null ? order.avgFillPrice.toFixed(2) : 'Market'}
                          </td>
                          <td style={{ color: 'var(--muted-foreground)' }}>{order.venue}</td>
                          <td>
                            <span className={cn(
                              'text-[11px] px-2 py-0.5 rounded-full font-medium',
                              order.status === 'FILLED' ? 'bg-[#10b98114] text-[#10b981]' :
                              order.status === 'WORKING' || order.status === 'PARTIAL' ? 'bg-[#3b82f614] text-[#3b82f6]' :
                              'bg-[#64748b14] text-[#64748b]'
                            )}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {orders && orders.length > 10 && (
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    Showing 10 out of {orders.length} results
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="pg-btn" onClick={() => setActivePage(Math.max(1, activePage - 1))}>‹</button>
                    {[1,2,3,4].map(p => (
                      <button key={p} onClick={() => setActivePage(p)} className={cn('pg-btn', activePage === p && 'active')}>
                        {p}
                      </button>
                    ))}
                    <button className="pg-btn" onClick={() => setActivePage(Math.min(4, activePage + 1))}>›</button>
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
