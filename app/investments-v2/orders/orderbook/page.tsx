'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Search } from 'lucide-react'
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
      owner: '—',
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
  const [blotters, setBlotters] = useState<BlotterCard[]>([])
  const [blotterName, setBlotterName] = useState('')
  const [defaultPortfolioId, setDefaultPortfolioId] = useState('')
  const [owner, setOwner] = useState('You')
  const [createBusy, setCreateBusy] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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

  return (
    <OrdersPage
      title="Orderbook"
      description="Review the full order lifecycle, blotters and immutable status history."
      actions={
        <button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500')} onClick={() => setNewBlotter(true)}>
          <Plus className="h-3.5 w-3.5" /> New Blotter
        </button>
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
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {blotters.length === 0 && !loading && (
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
      </OrdersCard>

      <OrdersCard
        title="All orders"
        eyebrow={loading ? 'Loading…' : `${filtered.length} records`}
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search order, ticker, portfolio"
                className={cn(inputClass, 'w-60 pl-8')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider text-slate-600">Sort by</span>
              <SelectField
                value={sort}
                onChange={(value) => {
                  setSort(value)
                  setPage(1)
                }}
                className="w-40"
              >
                <option>Newest first</option>
                <option>Oldest first</option>
                <option>Largest value</option>
                <option>Status</option>
              </SelectField>
            </div>
          </div>
        }
      >
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => changeTab(item)}
              className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:text-white', tab === item && 'bg-blue-600 text-white')}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Order ref</th>
                <th>Status</th>
                <th>Blotter</th>
                <th>Portfolio / fund</th>
                <th>Instrument / master ref</th>
                <th>Side</th>
                <th>Type</th>
                <th className="text-right">Qty / filled</th>
                <th className="text-right">Exec / limit</th>
                <th className="text-right">Consideration</th>
                <th>Broker</th>
                <th>Trader</th>
                <th>Trade / value date</th>
                <th>Approval</th>
                <th>Routing</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-[11px] text-slate-500">
                    <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
                    Loading orders…
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-[11px] text-slate-500">
                    No orders found.
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((order) => (
                  <tr key={order.apiId || order.ref} onClick={() => setSelected(order)} className={cn('cursor-pointer', selected?.apiId === order.apiId && 'bg-blue-500/10')}>
                    <td className="font-mono text-blue-300">{order.ref}</td>
                    <td>
                      <Pill tone={tone(order.status) as 'green' | 'amber' | 'blue' | 'red'}>{order.status}</Pill>
                    </td>
                    <td className="text-slate-400">{order.blotter}</td>
                    <td>{order.portfolio}</td>
                    <td>
                      <b>{order.ticker}</b>
                      <span className="ml-2 text-slate-500">{order.instrument}</span>
                      <div className="font-mono text-[9px] text-slate-600">{order.masterRef}</div>
                    </td>
                    <td className={order.side === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{order.side}</td>
                    <td>{order.type}</td>
                    <td className="text-right font-mono">
                      {order.qty.toLocaleString()} / {order.filled.toLocaleString()}
                    </td>
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
            }).map(([label, value]) => (
              <div key={label} className="rounded-[16px] bg-white/[0.035] p-3">
                <div className="text-[9px] uppercase text-slate-600">{label}</div>
                <div className="mt-1 text-[11px]">{value}</div>
              </div>
            ))}
          </div>
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
          <Field label="Owner">
            <SelectField value={owner} onChange={setOwner}>
              <option>You</option>
            </SelectField>
          </Field>
          <Field label="Trade date">
            <input className={inputClass} type="date" />
          </Field>
        </div>
      </Modal>
    </OrdersPage>
  )
}
