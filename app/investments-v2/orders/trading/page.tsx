'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { ChevronDown, Calendar, MoreHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchLatestPrices } from '@/lib/store/slices/investmentsSlice'
import {
  fetchPortfolios,
  fetchInstruments,
  fetchOrders,
  createOrder,
  previewOrder,
  submitOrder,
  approveOrder,
  sendOrderToBroker,
  rejectOrder,
  cancelOrder,
  executeOrder,
} from '@/lib/store/slices/investmentOpsSlice'
import { priceChange } from '@/lib/api/investments-api'
import type { OrderStatus } from '@/lib/api/investment-ops-api'

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  SENT_TO_BROKER: 'Sent to Broker',
  EXECUTED: 'executed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

function DropdownField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px]" style={{ color: '#64748b' }}>{label}</label>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[12.5px]" style={{ color: '#94a3b8' }}>{value}</span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#64748b' }} />
      </div>
    </div>
  )
}

const NEW_ORDER_EMPTY = {
  fundId: '',
  instrumentId: '',
  side: 'BUY' as 'BUY' | 'SELL',
  quantity: '',
  executionPrice: '',
  orderType: 'MARKET' as 'MARKET' | 'LIMIT',
  limitPrice: '',
}

export default function TradingPage() {
  const dispatch = useAppDispatch()
  const { latestPrices } = useAppSelector((s) => s.investments)
  const {
    portfolios,
    instruments,
    orders,
    ordersLoading,
    orderCreating,
    orderActionLoadingById,
    orderPreview,
    orderPreviewLoading,
  } = useAppSelector((s) => s.investmentOps)

  const [longShort, setLongShort] = useState<'Long' | 'Short'>('Long')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [form, setForm] = useState(NEW_ORDER_EMPTY)
  const [previewedKey, setPreviewedKey] = useState<string | null>(null)

  const previewKey = JSON.stringify([form.fundId, form.instrumentId, form.side, form.quantity, form.executionPrice])

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchInstruments({ status: 'APPROVED', pageSize: 200 }))
    dispatch(fetchLatestPrices())
    dispatch(fetchOrders())
  }, [dispatch])

  const field = (key: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
    setPreviewedKey(null)
  }

  const openNewOrder = () => {
    setForm(NEW_ORDER_EMPTY)
    setPreviewedKey(null)
    setShowNewOrder(true)
  }

  const handleInstrumentChange = (instrumentId: string) => {
    field('instrumentId', instrumentId)
    const inst = instruments.find((i) => i.id === instrumentId)
    if (!inst) return
    const tick = latestPrices[inst.ticker]
    const change = priceChange(tick)
    if (change.price != null) field('executionPrice', String(change.price))
  }

  const handlePreview = async () => {
    const fund = portfolios.find((f) => f.id === form.fundId)
    const inst = instruments.find((i) => i.id === form.instrumentId)
    const quantity = Number(form.quantity)
    const executionPrice = Number(form.executionPrice)
    if (!fund || !inst || quantity <= 0 || executionPrice <= 0) {
      toast.error('Fill in fund, instrument, quantity, and price')
      return
    }
    try {
      await dispatch(
        previewOrder({ fundId: fund.id, instrumentId: inst.id, side: form.side, quantity, executionPrice })
      ).unwrap()
      setPreviewedKey(previewKey)
    } catch (err: any) {
      toast.error('Preview failed', { description: err.message })
    }
  }

  const handleSubmitOrder = async () => {
    const fund = portfolios.find((f) => f.id === form.fundId)
    const inst = instruments.find((i) => i.id === form.instrumentId)
    const quantity = Number(form.quantity)
    const executionPrice = Number(form.executionPrice)
    if (!fund || !inst || quantity <= 0 || executionPrice <= 0) {
      toast.error('Fill in fund, instrument, quantity, and price')
      return
    }
    if (form.orderType === 'LIMIT' && Number(form.limitPrice) <= 0) {
      toast.error('Enter a limit price')
      return
    }
    try {
      const created = await dispatch(
        createOrder({
          fundId: fund.id,
          instrumentId: inst.id,
          side: form.side,
          quantity,
          executionPrice,
          orderType: form.orderType,
          ...(form.orderType === 'LIMIT' ? { limitPrice: Number(form.limitPrice) } : {}),
        })
      ).unwrap()

      toast.success('Order created', {
        description: `${created.orderRef} — ${form.side} ${quantity.toLocaleString()} ${inst.ticker} (DRAFT)`,
      })
      setShowNewOrder(false)
    } catch (err: any) {
      toast.error('Order creation failed', { description: err.message })
    }
  }

  const handleAction = async (action: 'submit' | 'approve' | 'send-to-broker' | 'execute' | 'reject' | 'cancel', id: string, orderRef: string) => {
    try {
      if (action === 'reject' || action === 'cancel') {
        const reason = window.prompt(`Reason for ${action === 'reject' ? 'rejecting' : 'cancelling'} ${orderRef}:`)
        if (!reason) return
        await dispatch((action === 'reject' ? rejectOrder : cancelOrder)({ id, reason })).unwrap()
      } else if (action === 'submit') {
        await dispatch(submitOrder(id)).unwrap()
      } else if (action === 'approve') {
        await dispatch(approveOrder(id)).unwrap()
      } else if (action === 'send-to-broker') {
        await dispatch(sendOrderToBroker(id)).unwrap()
      } else {
        await dispatch(executeOrder(id)).unwrap()
      }
      toast.success(`${orderRef} updated`)
    } catch (err: any) {
      toast.error('Action failed', { description: err.message })
    }
  }

  const nextActions = (status: OrderStatus): Array<{ key: 'submit' | 'approve' | 'send-to-broker' | 'execute' | 'reject' | 'cancel'; label: string }> => {
    switch (status) {
      case 'DRAFT':
        return [{ key: 'submit', label: 'Submit' }, { key: 'cancel', label: 'Cancel' }]
      case 'SUBMITTED':
        return [{ key: 'approve', label: 'Approve' }, { key: 'reject', label: 'Reject' }]
      case 'APPROVED':
        return [{ key: 'send-to-broker', label: 'Send to Broker' }, { key: 'cancel', label: 'Cancel' }]
      case 'SENT_TO_BROKER':
        return [{ key: 'execute', label: 'Execute' }, { key: 'cancel', label: 'Cancel' }]
      default:
        return []
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Filters card ── */}
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white text-[13px] font-semibold">Filters</span>
            <button onClick={openNewOrder} className="btn-white text-[12px] py-1 px-4">New Order</button>
          </div>

          {/* Filter chips row */}
          <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
            {['All Portfolios', 'Default View', 'From: 11 Oct, 21', 'As of: 11 Oct, 21'].map((chip, i) => (
              <button key={i} className="sort-pill text-[11px]">
                {chip} <ChevronDown className="w-3 h-3" />
              </button>
            ))}
            <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            </button>
          </div>

          {/* 3-column filter grid */}
          <div className="grid grid-cols-3 gap-4 px-4 pb-4">
            {/* Row 1 */}
            <DropdownField label="Closed Positions" value="Exclude" />
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Quantity from/to</label>
              <div className="flex items-center px-3 py-2 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <input placeholder="Enter text" className="bg-transparent outline-none text-[12.5px] w-full" style={{ color: '#94a3b8' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Quantity</label>
              <div className="flex items-center gap-4 px-3 py-2 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)', height: '38px' }}>
                {(['Long','Short'] as const).map(v => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setLongShort(v)}
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center cursor-pointer"
                      style={{ borderColor: longShort === v ? '#3b82f6' : '#64748b' }}
                    >
                      {longShort === v && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />}
                    </div>
                    <span className="text-[12px]" style={{ color: longShort === v ? '#e2e8f0' : '#64748b' }}>{v}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Expiry/Maturity from/to</label>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[12.5px]" style={{ color: '#64748b' }}>Select</span>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              </div>
            </div>
            <DropdownField label="Portfolio" value="No filter" />
            <DropdownField label="Folder" value="No filter" />

            {/* Row 3 */}
            <DropdownField label="Instrument type" value="No filter" />
            <DropdownField label="Currency" value="No filter" />
            <DropdownField label="Industry" value="No filter" />
          </div>
        </div>

        {/* New Order panel — appears inline above Orders, same visual language as Blotter's New Order entry */}
        {showNewOrder && (
          <div className="arcus-card" style={{ borderColor: 'rgba(59,130,246,0.4)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-white text-[13px] font-semibold">New Order Entry</span>
              <button onClick={() => setShowNewOrder(false)} className="text-[#64748b] hover:text-[#ef4444]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Fund</label>
                <select
                  value={form.fundId}
                  onChange={(e) => field('fundId', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="" disabled>Select fund…</option>
                  {portfolios.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.baseCurrencyCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Instrument</label>
                <select
                  value={form.instrumentId}
                  onChange={(e) => handleInstrumentChange(e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="" disabled>Select instrument…</option>
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>{i.ticker} — {i.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Side</label>
                <select
                  value={form.side}
                  onChange={(e) => field('side', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => field('quantity', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Execution Price</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.executionPrice}
                  onChange={(e) => field('executionPrice', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Order Type</label>
                <select
                  value={form.orderType}
                  onChange={(e) => field('orderType', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </div>
              {form.orderType === 'LIMIT' && (
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Limit Price</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.limitPrice}
                    onChange={(e) => field('limitPrice', e.target.value)}
                    className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Preview panel — cash impact + compliance checks, before creating */}
            {previewedKey === previewKey && orderPreview && (
              <div className="mx-4 mb-4 p-3 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: 'Gross Consideration', value: orderPreview.grossConsideration },
                    { label: 'Fees + Taxes', value: orderPreview.fees + orderPreview.taxes },
                    { label: 'Settlement Amount', value: orderPreview.settlementAmount },
                    { label: 'Weight After', value: orderPreview.portfolioWeightAfterPct, suffix: '%' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>{s.label}</div>
                      <div className="text-xs font-mono font-semibold" style={{ color: '#e2e8f0' }}>
                        {s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {s.suffix ?? ''}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2 text-[11px]">
                  <span style={{ color: '#64748b' }}>Cash impact:</span>
                  <span className="font-mono" style={{ color: orderPreview.cashImpact >= 0 ? '#10b981' : '#ef4444' }}>
                    {orderPreview.cashImpact >= 0 ? '+' : ''}{orderPreview.cashImpact.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ color: '#64748b' }}>· NAV after:</span>
                  <span className="font-mono" style={{ color: '#e2e8f0' }}>{orderPreview.nav.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px]" style={{ color: '#64748b' }}>Compliance:</span>
                  <StatusBadge status={orderPreview.compliancePreview.outcome === 'PASSED' ? 'passed' : orderPreview.compliancePreview.outcome === 'BREACH' ? 'breach' : 'warning'} />
                  <span className="text-[11px]" style={{ color: '#94a3b8' }}>{orderPreview.compliancePreview.message}</span>
                </div>
                {orderPreview.compliancePreview.checks.length > 0 && (
                  <ul className="space-y-1">
                    {orderPreview.compliancePreview.checks.map((c, i) => (
                      <li key={c.ruleId + i} className="flex items-center gap-2 text-[10px]">
                        <StatusBadge status={c.outcome === 'PASSED' ? 'passed' : c.outcome === 'BREACH' ? 'breach' : 'warning'} />
                        <span style={{ color: '#64748b' }}>{c.ruleType}</span>
                        <span style={{ color: '#94a3b8' }}>{c.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 px-4 pb-4">
              <div className="flex-1 text-[10px]" style={{ color: '#64748b' }}>
                Creates a draft order pending compliance review and approval — it will not route to the broker until approved.
              </div>
              <button
                onClick={handlePreview}
                disabled={orderPreviewLoading}
                className="bg-[#1e2330] text-[#60a5fa] text-xs px-3 py-1.5 rounded border border-[#3b82f6]/30 hover:bg-[#252b3a] disabled:opacity-60"
              >
                {orderPreviewLoading ? 'Checking…' : 'Preview'}
              </button>
              <button className="bg-[#1e2330] text-[#94a3b8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#252b3a]" onClick={() => setShowNewOrder(false)}>Cancel</button>
              <button
                onClick={handleSubmitOrder}
                disabled={orderCreating}
                className="bg-[#2563eb] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {orderCreating ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        <div className="arcus-card">
          <div className="flex items-center gap-6 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white text-[13px] font-semibold">Orders</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Total:</span>
              <span className="font-mono" style={{ color: '#3b82f6' }}>{orders.length}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Draft:</span>
              <span className="font-mono" style={{ color: '#64748b' }}>{orders.filter((o) => o.status === 'DRAFT').length}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Pending Approval:</span>
              <span className="font-mono" style={{ color: '#f59e0b' }}>{orders.filter((o) => o.status === 'SUBMITTED').length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Price</th>
                  <th>CCY</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ color: '#94a3b8' }} className="font-mono text-[11px]">{o.orderRef}</td>
                    <td style={{ color: '#e2e8f0' }} className="font-medium font-mono">{o.instrument?.ticker ?? '—'}</td>
                    <td>
                      <span className={cn('text-xs font-bold', o.side === 'BUY' ? 'text-[#10b981]' : 'text-[#ef4444]')}>
                        {o.side}
                      </span>
                    </td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{Number(o.quantity).toLocaleString()}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{Number(o.executionPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: '#64748b' }} className="font-mono">{o.tradeCurrency}</td>
                    <td><StatusBadge status={ORDER_STATUS_LABEL[o.status] ?? o.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {nextActions(o.status).map((a) => (
                          <button
                            key={a.key}
                            disabled={!!orderActionLoadingById[o.id]}
                            onClick={() => handleAction(a.key, o.id, o.orderRef)}
                            className="text-[10px] px-2 py-1 rounded border border-white/[0.08] hover:bg-[#1e2330] disabled:opacity-50"
                            style={{ color: a.key === 'reject' || a.key === 'cancel' ? '#ef4444' : '#60a5fa' }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !ordersLoading && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No orders yet.</td>
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
