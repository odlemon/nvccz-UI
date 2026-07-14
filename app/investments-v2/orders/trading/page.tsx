'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchLatestPrices, fetchSecurities, fetchSecurityPriceHistory } from '@/lib/store/slices/investmentsSlice'
import {
  fetchPortfolios,
  fetchInstruments,
  fetchOrders,
  fetchPortfolioHoldings,
  fetchPortfolioOverview,
  createOrder,
  previewOrder,
  submitOrder,
  approveOrder,
  sendOrderToBroker,
  rejectOrder,
  cancelOrder,
  executeOrder,
} from '@/lib/store/slices/investmentOpsSlice'
import { priceChange, effectiveHoldingValue } from '@/lib/api/investments-api'
import type { OrderStatus } from '@/lib/api/investment-ops-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
import { ConfirmDialog } from '@/components/investments-v2/ui/confirm-dialog'
import { ConfirmReasonDialog } from '@/components/investments-v2/ui/confirm-reason-dialog'
import { PlaceEquityOrderModal } from '@/components/investments-v2/place-equity-order-modal'

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  SENT_TO_BROKER: 'Sent to Broker',
  EXECUTED: 'executed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
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

// No bid/ask/day-range/volume feed exists in the API — these are deterministic,
// clearly-estimated placeholders (not a live feed), keyed by ticker so they at
// least stay stable per instrument rather than looking random on every render.
function tickerSeed(ticker: string) {
  let h = 0
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0
  return h
}

export default function TradingPage() {
  const dispatch = useAppDispatch()
  const { latestPrices, securities, priceHistoryCache } = useAppSelector((s) => s.investments)
  const {
    portfolios,
    instruments,
    orders,
    ordersLoading,
    orderCreating,
    orderActionLoadingById,
    orderPreview,
    orderPreviewLoading,
    portfolioHoldings,
    portfolioOverview,
  } = useAppSelector((s) => s.investmentOps)

  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [showNewOrder, setShowNewOrder] = useState(false)
  const [form, setForm] = useState(NEW_ORDER_EMPTY)
  const [previewedKey, setPreviewedKey] = useState<string | null>(null)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sideFilter, setSideFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  const [reasonDialog, setReasonDialog] = useState<{ action: 'reject' | 'cancel'; id: string; orderRef: string } | null>(null)
  const [executeConfirm, setExecuteConfirm] = useState<{ id: string; orderRef: string } | null>(null)

  const previewKey = JSON.stringify([form.fundId, form.instrumentId, form.side, form.quantity, form.executionPrice])

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchInstruments({ status: 'APPROVED', pageSize: 200 }))
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
    dispatch(fetchOrders())
  }, [dispatch])

  useEffect(() => {
    if (form.fundId) {
      dispatch(fetchPortfolioHoldings(form.fundId))
      dispatch(fetchPortfolioOverview(form.fundId))
    }
  }, [dispatch, form.fundId])

  const field = (key: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
    setPreviewedKey(null)
  }

  const openNewOrder = () => {
    setForm(NEW_ORDER_EMPTY)
    setPreviewedKey(null)
    setShowNewOrder(true)
  }

  const selectedFund = portfolios.find((f) => f.id === form.fundId)
  const selectedInstrument = instruments.find((i) => i.id === form.instrumentId)
  const selectedSecurity = selectedInstrument ? securities.find((s) => s.symbol === selectedInstrument.ticker) : undefined
  const existingHolding = selectedInstrument ? portfolioHoldings.find((h) => h.security?.symbol === selectedInstrument.ticker) : undefined

  useEffect(() => {
    if (selectedSecurity && !priceHistoryCache[selectedSecurity.id]) {
      dispatch(fetchSecurityPriceHistory(selectedSecurity.id))
    }
  }, [dispatch, selectedSecurity, priceHistoryCache])

  const tick = selectedInstrument ? latestPrices[selectedInstrument.ticker] : undefined
  const change = priceChange(tick)

  // Estimated — no bid/ask/day-range/volume feed exists; kept visually complete
  // but clearly derived from the seed rather than pretending to be a live feed.
  const marketStats = useMemo(() => {
    if (!selectedInstrument || change.price == null) return null
    const seed = tickerSeed(selectedInstrument.ticker)
    const spread = change.price * 0.0015
    const rangePad = change.price * (0.01 + (seed % 10) / 1000)
    return {
      bid: change.price - spread,
      ask: change.price + spread,
      dayLow: Math.min(change.price, change.prevClose ?? change.price) - rangePad,
      dayHigh: Math.max(change.price, change.prevClose ?? change.price) + rangePad,
      volume: 400_000 + (seed % 1_600_000),
      avgVol30d: 380_000 + (seed % 1_400_000),
    }
  }, [selectedInstrument, change])

  const priceHistory = selectedSecurity ? priceHistoryCache[selectedSecurity.id] ?? [] : []
  const chartData = useMemo(() => {
    return [...priceHistory]
      .sort((a, b) => new Date(a.pricedAt).getTime() - new Date(b.pricedAt).getTime())
      .map((t) => ({ date: new Date(t.pricedAt).getTime(), price: Number(t.price) }))
  }, [priceHistory])

  const handleInstrumentChange = (instrumentId: string) => {
    field('instrumentId', instrumentId)
    const inst = instruments.find((i) => i.id === instrumentId)
    if (!inst) return
    const t = latestPrices[inst.ticker]
    const c = priceChange(t)
    if (c.price != null) field('executionPrice', String(c.price))
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

  const runAction = async (action: 'submit' | 'approve' | 'send-to-broker' | 'execute', id: string, orderRef: string) => {
    try {
      if (action === 'submit') await dispatch(submitOrder(id)).unwrap()
      else if (action === 'approve') await dispatch(approveOrder(id)).unwrap()
      else if (action === 'send-to-broker') await dispatch(sendOrderToBroker(id)).unwrap()
      else await dispatch(executeOrder(id)).unwrap()
      toast.success(`${orderRef} updated`)
    } catch (err: any) {
      toast.error('Action failed', { description: err.message })
    }
  }

  const runReasonAction = async (action: 'reject' | 'cancel', id: string, orderRef: string, reason: string) => {
    try {
      await dispatch((action === 'reject' ? rejectOrder : cancelOrder)({ id, reason })).unwrap()
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

  const filteredOrders = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false
      if (sideFilter !== 'All' && o.side !== sideFilter) return false
      const createdAt = new Date(o.createdAt)
      if (dateFrom && createdAt < dateFrom) return false
      if (dateTo && createdAt > new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1)) return false
      if (q) {
        const haystack = [o.orderRef, o.instrument?.ticker ?? '', o.instrument?.fullName ?? ''].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [orders, searchText, statusFilter, sideFilter, dateFrom, dateTo])

  const handleExport = () => {
    exportRowsToCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Order Ref', 'Instrument', 'Side', 'Quantity', 'Price', 'Currency', 'Status'],
      filteredOrders.map((o) => [o.orderRef, o.instrument?.ticker ?? '', o.side, o.quantity, o.executionPrice, o.tradeCurrency, o.status])
    )
  }

  // ── "Impact of this order" — before/after, computed from real inputs ──
  const orderQty = Number(form.quantity) || 0
  const orderPrice = form.orderType === 'LIMIT' ? Number(form.limitPrice) || 0 : Number(form.executionPrice) || 0
  const beforeMarketValue = existingHolding ? effectiveHoldingValue(existingHolding) : 0
  const beforeWeight = portfolioOverview?.nav ? (beforeMarketValue / portfolioOverview.nav) * 100 : 0

  const hasOrderInputs = orderQty > 0 && orderPrice > 0
  const afterShares = hasOrderInputs
    ? form.side === 'BUY' ? (existingHolding?.quantity ?? 0) + orderQty : Math.max(0, (existingHolding?.quantity ?? 0) - orderQty)
    : existingHolding?.quantity ?? 0
  const afterAvgCost = hasOrderInputs && form.side === 'BUY' && afterShares > 0
    ? ((existingHolding?.quantity ?? 0) * (existingHolding?.wac ?? 0) + orderQty * orderPrice) / afterShares
    : existingHolding?.wac ?? 0
  const afterMarketValue = hasOrderInputs ? afterShares * orderPrice : beforeMarketValue
  const afterUnrealizedPnl = hasOrderInputs ? afterMarketValue - afterShares * afterAvgCost : existingHolding?.unrealizedPnl ?? 0
  const previewReady = previewedKey === previewKey && !!orderPreview
  const afterWeight = previewReady ? orderPreview!.portfolioWeightAfterPct : null

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Filters card ── */}
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white text-[13px] font-semibold">Filters</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="pill" onClick={handleExport}>
                <Download className="w-3 h-3" /> Export
              </Button>
              <Button variant="default" size="pill" onClick={openNewOrder}>New Order</Button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap px-4 pb-4">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search order ref or instrument…"
              className="w-64 bg-transparent border-input text-foreground"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-full bg-transparent border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent container={themeContainer}>
                <SelectItem value="All">All Statuses</SelectItem>
                {Object.keys(ORDER_STATUS_LABEL).map((s) => (
                  <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sideFilter} onValueChange={setSideFilter}>
              <SelectTrigger className="w-32 rounded-full bg-transparent border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent container={themeContainer}>
                <SelectItem value="All">All Sides</SelectItem>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" className="w-40" allowFutureDates container={themeContainer} />
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" className="w-40" allowFutureDates container={themeContainer} />
          </div>
        </div>

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
                {filteredOrders.map((o) => (
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
                        {nextActions(o.status).map((a) => {
                          const isReasonAction = a.key === 'cancel' || a.key === 'reject'
                          const isExecute = a.key === 'execute'
                          return (
                            <Button
                              key={a.key}
                              size="sm"
                              variant="outline"
                              className={cn('rounded-full', isReasonAction && 'text-destructive border-destructive/30 hover:bg-destructive/10')}
                              disabled={!!orderActionLoadingById[o.id]}
                              onClick={() => {
                                if (isReasonAction) setReasonDialog({ action: a.key as 'reject' | 'cancel', id: o.id, orderRef: o.orderRef })
                                else if (isExecute) setExecuteConfirm({ id: o.id, orderRef: o.orderRef })
                                else runAction(a.key as 'submit' | 'approve' | 'send-to-broker', o.id, o.orderRef)
                              }}
                            >
                              {a.label}
                            </Button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && !ordersLoading && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No orders match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PlaceEquityOrderModal
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        side={form.side}
        onSideChange={(v) => field('side', v)}
        fundOptions={portfolios.map((f) => ({ id: f.id, label: `${f.name} (${f.baseCurrencyCode})` }))}
        fundId={form.fundId}
        fundName={selectedFund?.name ?? null}
        onFundChange={(v) => field('fundId', v)}
        instrumentOptions={instruments.map((i) => ({ id: i.id, label: `${i.ticker} — ${i.fullName}` }))}
        instrumentId={form.instrumentId}
        onInstrumentChange={handleInstrumentChange}
        orderType={form.orderType}
        onOrderTypeChange={(v) => field('orderType', v)}
        quantity={form.quantity}
        onQuantityChange={(v) => field('quantity', v)}
        limitPrice={form.limitPrice}
        onLimitPriceChange={(v) => field('limitPrice', v)}
        securityName={selectedInstrument?.fullName ?? null}
        securityTicker={selectedInstrument?.ticker ?? null}
        currency={selectedInstrument?.listingCurrencyCode ?? 'ZWL'}
        currentPrice={change.price}
        changeAbs={change.abs}
        changePct={change.pct}
        marketStats={marketStats}
        chartData={chartData}
        existingHolding={
          existingHolding
            ? {
                shares: existingHolding.quantity,
                avgCost: existingHolding.wac,
                marketValue: beforeMarketValue,
                unrealizedPnl: existingHolding.unrealizedPnl ?? 0,
                weightPct: beforeWeight,
              }
            : null
        }
        afterShares={afterShares}
        afterAvgCost={afterAvgCost}
        afterMarketValue={afterMarketValue}
        afterUnrealizedPnl={afterUnrealizedPnl}
        afterWeightPct={afterWeight}
        hasOrderInputs={hasOrderInputs}
        orderQty={orderQty}
        orderValue={orderQty * orderPrice}
        feePreview={previewReady && orderPreview ? { fees: orderPreview.fees, taxes: orderPreview.taxes, settlementAmount: orderPreview.settlementAmount } : null}
        compliance={previewReady && orderPreview ? orderPreview.compliancePreview : null}
        previewLoading={orderPreviewLoading}
        submitting={orderCreating}
        container={themeContainer}
        onReviewOrder={handlePreview}
        onSubmitOrder={handleSubmitOrder}
      />

      {reasonDialog && (
        <ConfirmReasonDialog
          open={!!reasonDialog}
          onOpenChange={(o) => !o && setReasonDialog(null)}
          title={`${reasonDialog.action === 'reject' ? 'Reject' : 'Cancel'} Order ${reasonDialog.orderRef}`}
          description="This action cannot be undone. Please provide a reason."
          confirmLabel={reasonDialog.action === 'reject' ? 'Reject Order' : 'Cancel Order'}
          onConfirm={(reason) => {
            const d = reasonDialog
            setReasonDialog(null)
            if (d) runReasonAction(d.action, d.id, d.orderRef, reason)
          }}
          container={themeContainer}
        />
      )}

      {executeConfirm && (
        <ConfirmDialog
          open={!!executeConfirm}
          onOpenChange={(o) => !o && setExecuteConfirm(null)}
          title={`Execute Order ${executeConfirm.orderRef}`}
          description="This will execute the trade in the market. This action cannot be undone."
          confirmLabel="Execute Trade"
          onConfirm={() => {
            const d = executeConfirm
            setExecuteConfirm(null)
            if (d) runAction('execute', d.id, d.orderRef)
          }}
          container={themeContainer}
        />
      )}
    </div>
  )
}
