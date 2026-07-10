'use client'

import { Fragment, useEffect, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { cn } from '@/lib/utils'
import { Plus, Filter, Download, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPortfolios,
  fetchOpsTrades,
  executeTrade,
  fetchTradeRoutingHops,
  confirmRoutingHop,
  retryRoutingHop,
  cancelRoutingHop,
} from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import type { RoutingHop } from '@/lib/api/investments-api'

function settlementBadgeStatus(s: string) {
  if (s === 'SETTLED') return 'settled'
  if (s === 'SETTLEMENT_FAILED') return 'failed'
  return s.toLowerCase().replace(/_/g, ' ')
}
function accountingBadgeStatus(s: string) {
  return s === 'POSTED' ? 'posted' : 'not posted'
}
function confirmationBadgeStatus(s: string) {
  if (s === 'CONFIRMED') return 'confirmed'
  if (s === 'DISPATCHED') return 'pending'
  return s.toLowerCase().replace(/_/g, ' ')
}

function hopBadgeStatus(s: string) {
  if (s === 'CONFIRMED') return 'confirmed'
  if (s === 'DISPATCHED') return 'pending'
  if (s === 'FAILED') return 'failed'
  if (s === 'RETRYING') return 'review'
  return s.toLowerCase().replace(/_/g, ' ')
}

function hopActions(status: string): Array<{ key: 'confirm' | 'retry' | 'cancel'; label: string }> {
  const actions: Array<{ key: 'confirm' | 'retry' | 'cancel'; label: string }> = []
  if (status === 'DISPATCHED') actions.push({ key: 'confirm', label: 'Confirm' })
  if (status === 'FAILED' || status === 'RETRYING') actions.push({ key: 'retry', label: 'Retry' })
  if (status !== 'CONFIRMED') actions.push({ key: 'cancel', label: 'Cancel' })
  return actions
}

const newOrderFields = {
  portfolio: 'Equity World',
  ticker: '',
  instrument: '',
  side: 'BUY',
  qty: '',
  orderType: 'MARKET',
  limitPrice: '',
  broker: '',
  currency: 'USD',
  notes: '',
}

export default function TradeBlotterPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    opsTrades,
    opsTradesLoading,
    tradeActionLoadingById,
    hopActionLoadingById,
    tradeRoutingHopsLoadingById,
  } = useAppSelector((s) => s.investmentOps)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [formData, setFormData] = useState(newOrderFields)
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  const [settlementErrorById, setSettlementErrorById] = useState<Record<string, string>>({})
  const [settlementDownloadingById, setSettlementDownloadingById] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchOpsTrades())
  }, [dispatch])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  const toggleTrade = (id: string) => {
    if (expandedTradeId === id) {
      setExpandedTradeId(null)
      return
    }
    setExpandedTradeId(id)
    dispatch(fetchTradeRoutingHops(id))
  }

  const handleHopAction = (key: 'confirm' | 'retry' | 'cancel', tradeId: string, hopId: string) => {
    if (key === 'confirm') dispatch(confirmRoutingHop({ tradeId, hopId }))
    if (key === 'retry') dispatch(retryRoutingHop({ tradeId, hopId }))
    if (key === 'cancel') dispatch(cancelRoutingHop({ tradeId, hopId }))
  }

  const handleDownloadSettlement = async (tradeId: string, tradeRef: string) => {
    setSettlementErrorById((p) => ({ ...p, [tradeId]: '' }))
    setSettlementDownloadingById((p) => ({ ...p, [tradeId]: true }))
    try {
      const blob = await investmentOpsApi.getSettlementDocument(tradeId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tradeRef}-settlement.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setSettlementErrorById((p) => ({ ...p, [tradeId]: err?.message || 'Failed to download settlement document' }))
    } finally {
      setSettlementDownloadingById((p) => ({ ...p, [tradeId]: false }))
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Trade Blotter" subtitle="Executed & Pending Trades" showPeriod={false} />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7A95]">{opsTradesLoading ? 'Loading…' : `${opsTrades.length} trades`}</div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]"
            >
              <Plus className="w-3 h-3" /> New Order
            </button>
          </div>
        </div>

        {/* New Order Modal */}
        {showNewOrder && (
          <div className="bg-[#0D1526] border border-[#2563EB]/40 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-[#E8EDF5]">New Order Entry</div>
              <button onClick={() => setShowNewOrder(false)} className="text-[#6B7A95] hover:text-[#EF4444]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Portfolio', key: 'portfolio', type: 'select', options: ['Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select'] },
                { label: 'Ticker / ISIN', key: 'ticker', type: 'text', placeholder: 'e.g. NVDA' },
                { label: 'Side', key: 'side', type: 'select', options: ['BUY', 'SELL'] },
                { label: 'Quantity', key: 'qty', type: 'number', placeholder: '0' },
                { label: 'Order Type', key: 'orderType', type: 'select', options: ['MARKET', 'LIMIT', 'STOP', 'GTC', 'FOK'] },
                { label: 'Limit Price', key: 'limitPrice', type: 'number', placeholder: '0.00' },
                { label: 'Broker', key: 'broker', type: 'select', options: ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Citi', 'Macquarie', 'CLSA'] },
                { label: 'Currency', key: 'currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'JPY', 'ZAR'] },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={(formData as any)[field.key]}
                      onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                    >
                      {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(formData as any)[field.key]}
                      onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                    />
                  )}
                </div>
              ))}
              <div className="col-span-4">
                <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Notes</label>
                <input
                  placeholder="Trade notes or instructions..."
                  className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex-1 text-[10px] text-[#6B7A95]">
                Estimated consideration: <span className="text-[#C8D3E8] font-mono">Calculating...</span>
                &nbsp;·&nbsp; Compliance check: <span className="text-[#10B981]">Passed</span>
              </div>
              <button className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]" onClick={() => setShowNewOrder(false)}>Cancel</button>
              <button className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8]">Submit Order</button>
            </div>
          </div>
        )}

        {/* Blotter table */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th />
                  <th>Trade ID</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Exec Price</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">Fees</th>
                  <th className="text-right">Net</th>
                  <th>Broker</th>
                  <th>Custodian</th>
                  <th>Trade Date</th>
                  <th>Val Date</th>
                  <th>Settlement</th>
                  <th>Accounting</th>
                  <th>Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {opsTrades.map((t) => {
                  const isExpanded = expandedTradeId === t.id
                  const hopsLoading = !!tradeRoutingHopsLoadingById[t.id]
                  const settlementError = settlementErrorById[t.id]
                  const settlementDownloading = !!settlementDownloadingById[t.id]
                  return (
                    <Fragment key={t.id}>
                      <tr className={cn('cursor-pointer', isExpanded && 'bg-[#3b82f614]')} onClick={() => toggleTrade(t.id)}>
                        <td className="w-6">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#6B7A95]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#6B7A95]" />
                          )}
                        </td>
                        <td className="text-[#60A5FA] font-mono text-[11px]">{t.tradeRef}</td>
                        <td className="text-[#A8B4C8]">{fundName(t.fundId)}</td>
                        <td className="text-[#C8D3E8] font-mono font-semibold">{t.security?.symbol ?? '—'}</td>
                        <td className="text-[#A8B4C8]">{t.security?.name ?? '—'}</td>
                        <td>
                          <span className={cn('text-xs font-bold', t.side === 'BUY' ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                            {t.side}
                          </span>
                        </td>
                        <td className="text-right font-mono">{Number(t.quantity).toLocaleString()}</td>
                        <td className="text-right font-mono">{Number(t.executionPrice).toFixed(2)}</td>
                        <td className="text-right font-mono">{t.grossConsideration.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-right font-mono text-[#F59E0B]">{Number(t.fees)}</td>
                        <td className="text-right font-mono">{t.netConsideration.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-[#A8B4C8]">{t.brokerProfileId ?? '—'}</td>
                        <td className="text-[#6B7A95]">{t.custodianProfileId ?? '—'}</td>
                        <td className="text-[#6B7A95]">{t.executedAt ? new Date(t.executedAt).toLocaleDateString() : '—'}</td>
                        <td className="text-[#6B7A95]">{t.valueDate ? new Date(t.valueDate).toLocaleDateString() : '—'}</td>
                        <td><StatusBadge status={settlementBadgeStatus(t.settlementStatus)} /></td>
                        <td><StatusBadge status={accountingBadgeStatus(t.accountingStatus)} /></td>
                        <td><StatusBadge status={confirmationBadgeStatus(t.confirmationStatus)} /></td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={18} className="p-0">
                            <div className="px-6 py-3 space-y-3" style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="flex items-center gap-2">
                                {t.status === 'DRAFT' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); dispatch(executeTrade(t.id)) }}
                                    disabled={!!tradeActionLoadingById[t.id]}
                                    className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50"
                                  >
                                    Execute Trade
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDownloadSettlement(t.id, t.tradeRef) }}
                                  disabled={settlementDownloading}
                                  className="flex items-center gap-1.5 text-[#A8B4C8] hover:text-white text-xs px-3 py-1.5 bg-[#111C30] border border-white/[0.08] rounded disabled:opacity-50"
                                >
                                  <Download className="w-3 h-3" /> {settlementDownloading ? 'Downloading…' : 'Download Settlement Document'}
                                </button>
                                {settlementError && <span className="text-[11px] text-[#EF4444]">{settlementError}</span>}
                              </div>

                              <table className="arcus-table">
                                <thead>
                                  <tr>
                                    <th>Target</th>
                                    <th>Status</th>
                                    <th className="text-right">Attempts</th>
                                    <th>External Ref</th>
                                    <th>Last Error</th>
                                    <th>Dispatched At</th>
                                    <th>Confirmed At</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.routingHops.map((hop: RoutingHop) => (
                                    <tr key={hop.id}>
                                      <td className="text-[#A8B4C8]">{hop.target}</td>
                                      <td><StatusBadge status={hopBadgeStatus(hop.status)} /></td>
                                      <td className="text-right font-mono">{hop.attemptCount}</td>
                                      <td className="text-[#6B7A95] font-mono text-[11px]">{hop.externalRef ?? '—'}</td>
                                      <td className="text-[#EF4444] text-[11px]">{hop.lastError ?? '—'}</td>
                                      <td className="text-[#6B7A95] text-[11px]">{hop.dispatchedAt ? new Date(hop.dispatchedAt).toLocaleString() : '—'}</td>
                                      <td className="text-[#6B7A95] text-[11px]">{hop.confirmedAt ? new Date(hop.confirmedAt).toLocaleString() : '—'}</td>
                                      <td>
                                        <div className="flex items-center gap-1.5">
                                          {hopActions(hop.status).map((a) => (
                                            <button
                                              key={a.key}
                                              disabled={!!hopActionLoadingById[hop.id]}
                                              onClick={(e) => { e.stopPropagation(); handleHopAction(a.key, t.id, hop.id) }}
                                              className="text-[10px] px-2 py-1 rounded border border-white/[0.08] hover:bg-[#1e2330] disabled:opacity-50"
                                              style={{ color: a.key === 'cancel' ? '#ef4444' : '#60a5fa' }}
                                            >
                                              {a.label}
                                            </button>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {hopsLoading && t.routingHops.length === 0 && (
                                    <tr>
                                      <td colSpan={8} className="text-center py-4 text-[11px]" style={{ color: '#64748b' }}>Loading routing hops…</td>
                                    </tr>
                                  )}
                                  {!hopsLoading && t.routingHops.length === 0 && (
                                    <tr>
                                      <td colSpan={8} className="text-center py-4 text-[11px]" style={{ color: '#64748b' }}>No routing hops for this trade.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {opsTrades.length === 0 && !opsTradesLoading && (
                  <tr>
                    <td colSpan={18} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No trades yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
