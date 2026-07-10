'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchOrders } from '@/lib/store/slices/investmentOpsSlice'
import type { OrderStatus } from '@/lib/api/investment-ops-api'

// ── Orderbook sub-tabs ────────────────────────────────────────────
const obTabs = ['Orderbook', 'New', 'Pending', 'Executed'] as const
type ObTab = typeof obTabs[number]

function matchesTab(status: OrderStatus, tab: ObTab) {
  if (tab === 'Orderbook') return true
  if (tab === 'New') return status === 'DRAFT'
  if (tab === 'Pending') return status === 'SUBMITTED' || status === 'APPROVED' || status === 'SENT_TO_BROKER'
  if (tab === 'Executed') return status === 'EXECUTED'
  return true
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  SENT_TO_BROKER: 'Sent to Broker',
  EXECUTED: 'Executed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const statusColor: Record<string, string> = {
  DRAFT: '#3b82f6',
  SUBMITTED: '#f59e0b',
  APPROVED: '#64748b',
  SENT_TO_BROKER: '#f59e0b',
  EXECUTED: '#10b981',
  REJECTED: '#ef4444',
  CANCELLED: '#ef4444',
}

// ── Open blotter rows (no backing endpoint yet) ──────────────────
const openBlotters = [
  { name: 'Simulation - EW_Securities', transaction: '', tradedate: '24 Apr, 20', id: 11 },
]

const PAGE_SIZE = 12

export default function OrderbookPage() {
  const dispatch = useAppDispatch()
  const { portfolios, orders, ordersTotal, ordersLoading } = useAppSelector((s) => s.investmentOps)
  const [obTab, setObTab] = useState<ObTab>('Orderbook')
  const [activePage, setActivePage] = useState(1)

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchOrders({ page: activePage, pageSize: PAGE_SIZE }))
  }, [dispatch, activePage])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  const rows = useMemo(() => orders.filter((o) => matchesTab(o.status, obTab)), [orders, obTab])
  const pageCount = Math.max(1, Math.ceil(ordersTotal / PAGE_SIZE))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Open Blotters ── */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-white text-[13px] font-semibold">Open Blotters</span>
          </div>
          <table className="arcus-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Transaction</th>
                <th>Tradedate</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {openBlotters.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: '#e2e8f0' }} className="font-medium">{row.name}</td>
                  <td style={{ color: '#64748b' }}>{row.transaction}</td>
                  <td style={{ color: '#64748b' }}>{row.tradedate}</td>
                  <td style={{ color: '#94a3b8' }} className="font-mono">{row.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Orderbook ── */}
        <div className="arcus-card">
          {/* Card header with title + sort + new blotter */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0">
            <span className="text-white text-[13px] font-semibold">Orderbook</span>
            <div className="flex items-center gap-2">
              <button className="sort-pill text-[11px]">
                Sort by: New <ChevronDown className="w-3 h-3" />
              </button>
              <button className="btn-white text-[12px] py-1 px-4">New Blotter</button>
            </div>
          </div>

          {/* Underline sub-tabs */}
          <div className="flex items-center gap-0 px-4 mt-2 pill-tabs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {obTabs.map(t => (
              <button
                key={t}
                onClick={() => setObTab(t)}
                className={cn('pill-tab', obTab === t && 'active')}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Instrument</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Price</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="cursor-pointer">
                    <td>
                      <span className="text-[12px] font-medium" style={{ color: statusColor[o.status] ?? '#94a3b8' }}>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{fundName(o.fundId)}</td>
                    <td style={{ color: '#e2e8f0' }} className="font-mono font-medium">{o.instrument?.ticker ?? o.instrument?.instrumentCode ?? '—'}</td>
                    <td style={{ color: '#94a3b8' }}>{o.instrument?.fullName ?? o.instrument?.shortName ?? '—'}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{Number(o.quantity).toLocaleString()}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{Number(o.limitPrice ?? o.executionPrice).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                    <td style={{ color: '#64748b' }}>{o.orderType}</td>
                  </tr>
                ))}
                {rows.length === 0 && !ordersLoading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No orders found.</td>
                  </tr>
                )}
                {ordersLoading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>Loading…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[11px]" style={{ color: '#64748b' }}>Showing {rows.length} out of {ordersTotal} results</span>
            <div className="flex items-center gap-1">
              <button className="pg-btn" onClick={() => setActivePage(Math.max(1, activePage - 1))}>‹</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setActivePage(p)} className={cn('pg-btn', activePage === p && 'active')}>{p}</button>
              ))}
              <button className="pg-btn" onClick={() => setActivePage(Math.min(pageCount, activePage + 1))}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
