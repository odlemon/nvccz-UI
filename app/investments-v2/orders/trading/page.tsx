'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Download, X } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
import { ConfirmDialog } from '@/components/investments-v2/ui/confirm-dialog'
import { ConfirmReasonDialog } from '@/components/investments-v2/ui/confirm-reason-dialog'

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

  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [showNewOrder, setShowNewOrder] = useState(false)
  const [form, setForm] = useState(NEW_ORDER_EMPTY)
  const [previewedKey, setPreviewedKey] = useState<string | null>(null)
  const [fundComboOpen, setFundComboOpen] = useState(false)
  const [instrumentComboOpen, setInstrumentComboOpen] = useState(false)

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

  const selectedFund = portfolios.find((f) => f.id === form.fundId)
  const selectedInstrument = instruments.find((i) => i.id === form.instrumentId)

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
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-full">
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
              <SelectTrigger className="w-32 rounded-full">
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
                <Select value={form.fundId} onValueChange={(v) => field('fundId', v)}>
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Select fund…" />
                  </SelectTrigger>
                  <SelectContent container={themeContainer}>
                    {portfolios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name} ({f.baseCurrencyCode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Instrument</label>
                <Popover open={instrumentComboOpen} onOpenChange={setInstrumentComboOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={instrumentComboOpen} className="w-full justify-between rounded-full font-normal">
                      <span className="truncate">{selectedInstrument ? `${selectedInstrument.ticker} — ${selectedInstrument.fullName}` : 'Select instrument…'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start" container={themeContainer}>
                    <Command>
                      <CommandInput placeholder="Search ticker or name…" />
                      <CommandList>
                        <CommandEmpty>No instruments found.</CommandEmpty>
                        <CommandGroup>
                          {instruments.map((i) => (
                            <CommandItem
                              key={i.id}
                              value={`${i.ticker} ${i.fullName}`}
                              onSelect={() => {
                                handleInstrumentChange(i.id)
                                setInstrumentComboOpen(false)
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', form.instrumentId === i.id ? 'opacity-100' : 'opacity-0')} />
                              {i.ticker} — {i.fullName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Side</label>
                <Select value={form.side} onValueChange={(v) => field('side', v)}>
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent container={themeContainer}>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Quantity</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => field('quantity', e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Execution Price</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.executionPrice}
                  onChange={(e) => field('executionPrice', e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Order Type</label>
                <Select value={form.orderType} onValueChange={(v) => field('orderType', v)}>
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent container={themeContainer}>
                    <SelectItem value="MARKET">MARKET</SelectItem>
                    <SelectItem value="LIMIT">LIMIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.orderType === 'LIMIT' && (
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Limit Price</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.limitPrice}
                    onChange={(e) => field('limitPrice', e.target.value)}
                    className="font-mono"
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
              <Button variant="outline" size="pill" onClick={handlePreview} disabled={orderPreviewLoading}>
                {orderPreviewLoading ? 'Checking…' : 'Preview'}
              </Button>
              <Button variant="outline" size="pill" onClick={() => setShowNewOrder(false)}>Cancel</Button>
              <Button variant="default" size="pill" onClick={handleSubmitOrder} disabled={orderCreating}>
                {orderCreating ? 'Creating…' : 'Create Order'}
              </Button>
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
