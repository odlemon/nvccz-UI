'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchOrders,
  submitOrder,
  approveOrder,
  sendOrderToBroker,
  rejectOrder,
  cancelOrder,
  executeOrder,
} from '@/lib/store/slices/investmentOpsSlice'
import type { OrderStatus } from '@/lib/api/investment-ops-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
import { ConfirmDialog } from '@/components/investments-v2/ui/confirm-dialog'
import { ConfirmReasonDialog } from '@/components/investments-v2/ui/confirm-reason-dialog'
import { NewEquityOrderModal } from '@/components/investments-v2/new-equity-order-modal'

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  SENT_TO_BROKER: 'Sent to Broker',
  EXECUTED: 'executed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

export default function TradingPage() {
  const dispatch = useAppDispatch()
  const { orders, ordersLoading, orderActionLoadingById } = useAppSelector((s) => s.investmentOps)

  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [showNewOrder, setShowNewOrder] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sideFilter, setSideFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  const [reasonDialog, setReasonDialog] = useState<{ action: 'reject' | 'cancel'; id: string; orderRef: string } | null>(null)
  const [executeConfirm, setExecuteConfirm] = useState<{ id: string; orderRef: string } | null>(null)

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

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
              <Button variant="default" size="pill" onClick={() => setShowNewOrder(true)}>New Order</Button>
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

      <NewEquityOrderModal
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        container={themeContainer}
        onOrderCreated={() => dispatch(fetchOrders())}
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
