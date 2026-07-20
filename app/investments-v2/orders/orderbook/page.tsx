'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Search } from 'lucide-react'
import { OpsCardGridSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { PlaceEquityOrderModal } from '@/components/investments-v2/place-equity-order-modal'
import { buttonClass, Field, inputClass, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { formatOpsError, investmentOpsApi, unwrapList, type OpsBlotter } from '@/lib/api/investment-ops-api'
import {
  fundNameMap,
  mapFundOptions,
  mapOrderbookOrders,
  type OrderbookRow,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'

const tabs = ['Orderbook', 'New', 'Pending', 'Executed', 'Cancelled', 'Failed', 'Rejected', 'Settled']

const tone = (status: string) =>
  status === 'Executed' || status === 'Settled' ? 'green' : status === 'Pending' ? 'amber' : status === 'New' ? 'blue' : 'red'

type BlotterCard = {
  id: string
  name: string
  orders: number
  owner: string
  portfolio: string
  updated: string
}

function mapBlotterCards(data: unknown, fundNameById: Record<string, string>): BlotterCard[] {
  return unwrapList<OpsBlotter>(data).map((b) => {
    const fundId = b.fundId != null ? String(b.fundId) : ''
    return {
      id: String(b.id ?? ''),
      name: String(b.name ?? b.title ?? 'Untitled blotter'),
      orders: Number(b.orderCount ?? 0),
      owner: String(b.ownerName ?? b.createdByName ?? '—'),
      portfolio: fundId ? fundNameById[fundId] ?? fundId : '—',
      updated: b.updatedAt
        ? new Date(String(b.updatedAt)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : b.createdAt
          ? new Date(String(b.createdAt)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—',
    }
  })
}

export default function OrderbookPage() {
  const [orders, setOrders] = useState<OrderbookRow[]>([])
  const [fundOptions, setFundOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('Orderbook')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Newest first')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<OrderbookRow | null>(null)
  const [newBlotter, setNewBlotter] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [blotters, setBlotters] = useState<BlotterCard[]>([])
  const [blotterName, setBlotterName] = useState('')
  const [defaultPortfolioId, setDefaultPortfolioId] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [lifeBusy, setLifeBusy] = useState(false)
  const [lifeError, setLifeError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersRes, portfoliosRes, blottersRes] = await Promise.all([
        investmentOpsApi.listOrders({ page: 1, pageSize: 200 }),
        investmentOpsApi.listPortfolios(),
        investmentOpsApi.listBlotters({ pageSize: 100 }),
      ])
      if (ordersRes.success === false) {
        throw new Error(formatOpsError(ordersRes, 'Failed to load orders'))
      }
      if (blottersRes.success === false) {
        throw new Error(formatOpsError(blottersRes, 'Failed to load blotters'))
      }
      const names = fundNameMap(portfoliosRes.data)
      const funds = mapFundOptions(portfoliosRes.data)
      setFundOptions(funds)
      setDefaultPortfolioId((prev) => prev || funds[0]?.id || '')
      const rows = mapOrderbookOrders(ordersRes.data, names)
      setOrders(rows)
      setSelected((prev) => (prev ? rows.find((r) => r.apiId === prev.apiId) ?? null : null))
      setBlotters(mapBlotterCards(blottersRes.data, names))
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load orders'))
      setOrders([])
      setBlotters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const rows = orders.filter(
      (order) =>
        (tab === 'Orderbook' || order.status === tab) &&
        `${order.ref} ${order.ticker} ${order.portfolio} ${order.blotter}`.toLowerCase().includes(search.toLowerCase()),
    )
    return [...rows].sort((a, b) =>
      sort === 'Oldest first'
        ? a.ref.localeCompare(b.ref)
        : sort === 'Largest value'
          ? b.grossValue - a.grossValue
          : sort === 'Status'
            ? a.status.localeCompare(b.status)
            : b.ref.localeCompare(a.ref),
    )
  }, [orders, tab, search, sort])

  const pageSize = 4
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const changeTab = (value: string) => {
    setTab(value)
    setPage(1)
  }

  const createBlotter = async () => {
    if (!blotterName.trim()) return
    setCreateBusy(true)
    setCreateError(null)
    try {
      const res = await investmentOpsApi.createBlotter({
        name: blotterName.trim(),
        fundId: defaultPortfolioId || undefined,
      })
      if (res.success === false) {
        throw new Error(formatOpsError(res, 'Failed to create blotter'))
      }
      setBlotterName('')
      setNewBlotter(false)
      await load()
    } catch (e) {
      setCreateError(formatOpsError(e, 'Failed to create blotter'))
    } finally {
      setCreateBusy(false)
    }
  }

  const runLifecycle = async (action: 'submit' | 'approve' | 'cancel' | 'send' | 'execute' | 'reject') => {
    if (!selected?.apiId) return
    setLifeBusy(true)
    setLifeError(null)
    try {
      const body = { expectedVersion: selected.version }
      let res
      if (action === 'submit') res = await investmentOpsApi.submitOrder(selected.apiId, body)
      else if (action === 'approve') res = await investmentOpsApi.approveOrder(selected.apiId, body)
      else if (action === 'send') {
        res = await investmentOpsApi.sendOrderToBroker(selected.apiId, {
          expectedVersion: selected.version,
        })
      } else if (action === 'execute') {
        const price = selected.execPrice ?? selected.limitPrice
        res = await investmentOpsApi.executeOrder(selected.apiId, {
          expectedVersion: selected.version,
          quantity: selected.qty,
          ...(price != null ? { price } : {}),
        })
      } else if (action === 'reject') {
        const reason = window.prompt('Reject reason (required):')
        if (!reason?.trim()) return
        res = await investmentOpsApi.rejectOrder(selected.apiId, {
          reason: reason.trim(),
          expectedVersion: selected.version,
        })
      } else {
        const reason = window.prompt('Cancel reason (required):')
        if (!reason?.trim()) return
        res = await investmentOpsApi.cancelOrder(selected.apiId, reason.trim())
      }
      if (res.success === false) throw new Error(formatOpsError(res, `Failed to ${action} order`))
      await load()
    } catch (e) {
      setLifeError(formatOpsError(e, `Failed to ${action} order`))
    } finally {
      setLifeBusy(false)
    }
  }

  const raw = selected?.rawStatus?.toUpperCase() ?? ''

  return (
    <OrdersPage
      title="Orderbook"
      description="Review the full order lifecycle, blotters and immutable status history."
      actions={
        <div className="flex flex-wrap gap-2">
          <button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500')} onClick={() => setShowOrder(true)}>
            <Plus className="h-3.5 w-3.5" /> New order
          </button>
          <button className={cn(buttonClass)} onClick={() => setNewBlotter(true)}>
            <Plus className="h-3.5 w-3.5" /> New Blotter
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {error}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <OrdersCard title="Open Blotters" eyebrow="Working sets">
        {loading ? (
          <OpsCardGridSkeleton count={6} />
        ) : (
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {blotters.length === 0 && (
            <p className="col-span-full px-2 py-6 text-center text-[11px] text-slate-500">No blotters yet. Create one to group related orders.</p>
          )}
          {blotters.map((item) => (
            <button
              key={item.id || item.name}
              onClick={() => {
                setSearch(item.name)
                setTab('Orderbook')
                setPage(1)
              }}
              className="rounded-full border border-white/[0.07] bg-[#070d17] p-3 text-left transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]"
            >
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold">{item.name}</span>
                <Pill tone="blue">{item.orders} orders</Pill>
              </div>
              <div className="mt-3 flex justify-between text-[9px] text-slate-500">
                <span>
                  {item.owner} · {item.portfolio}
                </span>
                <span>{item.updated}</span>
              </div>
            </button>
          ))}
        </div>
        )}
      </OrdersCard>

      <OrdersCard
        title="All orders"
        eyebrow={loading ? 'Loading…' : `${filtered.length} records`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
              <input className={cn(inputClass, 'w-56 pl-8')} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or ticker" />
            </div>
            <SelectField value={sort} onChange={setSort}>
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>Largest value</option>
              <option>Status</option>
            </SelectField>
          </div>
        }
      >
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeTab(item)}
              className={cn(
                'h-8 shrink-0 rounded-full px-3 text-[10px]',
                tab === item ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                {['Ref', 'Portfolio', 'Instrument', 'Side', 'Qty', 'Px', 'Gross', 'Broker', 'Trader', 'Dates', 'Approval', 'Routing'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={12} className="p-0">
                    <OpsTableSkeleton rows={8} cols={8} />
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((order) => (
                  <tr
                    key={order.apiId || order.ref}
                    onClick={() => {
                      setLifeError(null)
                      setSelected(order)
                    }}
                    className={cn('cursor-pointer hover:bg-white/[0.03]', selected?.apiId === order.apiId && 'bg-blue-500/10')}
                  >
                    <td className="font-mono">{order.ref}</td>
                    <td>{order.portfolio}</td>
                    <td>
                      {order.ticker}
                      <div className="text-[9px] text-slate-600">{order.instrument}</div>
                    </td>
                    <td>{order.side}</td>
                    <td className="text-right font-mono">{order.qty.toLocaleString()}</td>
                    <td className="text-right font-mono">
                      {order.execPrice?.toFixed(2) ?? '—'} / {order.limitPrice?.toFixed(2) ?? 'MKT'}
                    </td>
                    <td className="text-right font-mono">{order.gross}</td>
                    <td>{order.broker}</td>
                    <td>{order.trader}</td>
                    <td>
                      {order.tradeDate}
                      <div className="text-[9px] text-slate-600">VD {order.valueDate}</div>
                    </td>
                    <td>
                      <Pill tone={order.approval.includes('Rejected') ? 'red' : order.approval.includes('Not') ? 'slate' : 'green'}>{order.approval}</Pill>
                    </td>
                    <td>{order.routing}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 text-[10px] text-slate-500">
          <span>
            Showing {pageRows.length} of {filtered.length} orders
          </span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={cn('h-7 w-7 rounded-full hover:bg-white/10', page === n && 'bg-blue-600 text-white')}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </OrdersCard>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#09111e] p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-blue-400">Order detail</p>
              <h2 className="mt-1 font-mono text-base">{selected.ref}</h2>
            </div>
            <button className={buttonClass} onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {Object.entries({
              Portfolio: selected.portfolio,
              Instrument: `${selected.ticker} · ${selected.masterRef}`,
              Side: selected.side,
              Quantity: selected.qty.toLocaleString(),
              Broker: selected.broker,
              Trader: selected.trader,
              Approval: selected.approval,
              Routing: selected.routing,
              'Trade date': selected.tradeDate,
              'Value date': selected.valueDate,
              Status: selected.status,
              Version: String(selected.version),
            }).map(([label, value]) => (
              <div key={label} className="rounded-[16px] bg-white/[0.035] p-3">
                <div className="text-[9px] uppercase text-slate-600">{label}</div>
                <div className="mt-1 text-[11px]">{value}</div>
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-[11px] font-semibold">Lifecycle actions</h3>
          {lifeError && <p className="mt-2 text-[10px] text-rose-300">{lifeError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {raw === 'DRAFT' && (
              <button type="button" disabled={lifeBusy} className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={() => void runLifecycle('submit')}>
                {lifeBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Submit
              </button>
            )}
            {raw === 'SUBMITTED' && (
              <button type="button" disabled={lifeBusy} className={cn(buttonClass, 'border-emerald-400/40 text-emerald-300')} onClick={() => void runLifecycle('approve')}>
                {lifeBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Approve
              </button>
            )}
            {(raw === 'APPROVED' || raw === 'SUBMITTED' || raw === 'SENT_TO_BROKER' || raw === 'ROUTED') && (
              <button type="button" disabled={lifeBusy} className={cn(buttonClass)} onClick={() => void runLifecycle('send')}>
                Send to broker
              </button>
            )}
            {(raw === 'APPROVED' || raw === 'SENT_TO_BROKER' || raw === 'ROUTED') && (
              <button
                type="button"
                disabled={lifeBusy}
                className={cn(buttonClass, 'bg-emerald-600 text-white')}
                onClick={() => void runLifecycle('execute')}
              >
                {lifeBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Execute (create trade)
              </button>
            )}
            {(raw === 'SUBMITTED' || raw === 'APPROVED') && (
              <button type="button" disabled={lifeBusy} className={cn(buttonClass, 'border-rose-400/30 text-rose-300')} onClick={() => void runLifecycle('reject')}>
                Reject
              </button>
            )}
            {!['CANCELLED', 'EXECUTED', 'SETTLED', 'REJECTED'].includes(raw) && (
              <button type="button" disabled={lifeBusy} className={cn(buttonClass, 'border-rose-400/30 text-rose-300')} onClick={() => void runLifecycle('cancel')}>
                Cancel
              </button>
            )}
          </div>
          {(raw === 'APPROVED' || raw === 'SENT_TO_BROKER' || raw === 'ROUTED') && (
            <p className="mt-2 text-[9px] text-slate-500">
              Send to broker alone does not create a blotter trade. Use Execute to create the trade, then Confirm/Settle on the blotter.
            </p>
          )}

          <h3 className="mt-6 text-[11px] font-semibold">Status</h3>
          <div className="mt-3 space-y-4 border-l border-white/10 pl-4">
            <div className="relative">
              <span className="absolute -left-[20px] top-1 h-2 w-2 rounded-full bg-blue-400" />
              <Pill tone={tone(selected.status) as 'green' | 'amber' | 'blue' | 'red'}>{selected.rawStatus || selected.status}</Pill>
              <div className="mt-1 text-[10px] text-slate-300">Current API status</div>
              <div className="mt-1 text-[9px] text-slate-600">Created {selected.created}</div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={newBlotter}
        onClose={() => setNewBlotter(false)}
        title="New blotter"
        subtitle="Create a working set for related orders via the blotters API."
        footer={
          <>
            <button className={buttonClass} onClick={() => setNewBlotter(false)}>
              Cancel
            </button>
            <button
              disabled={!blotterName.trim() || createBusy}
              className={cn(buttonClass, 'bg-blue-600 text-white')}
              onClick={() => void createBlotter()}
            >
              {createBusy ? 'Creating…' : 'Create blotter'}
            </button>
          </>
        }
      >
        {createError && <p className="mb-3 text-[11px] text-rose-300">{createError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Blotter name">
            <input className={inputClass} value={blotterName} onChange={(e) => setBlotterName(e.target.value)} placeholder="e.g. August income rotation" />
          </Field>
          <Field label="Default portfolio">
            <SelectField value={defaultPortfolioId} onChange={setDefaultPortfolioId}>
              {fundOptions.length === 0 && <option value="">—</option>}
              {fundOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </Modal>

      <PlaceEquityOrderModal open={showOrder} onClose={() => setShowOrder(false)} onComplete={() => void load()} />
    </OrdersPage>
  )
}
