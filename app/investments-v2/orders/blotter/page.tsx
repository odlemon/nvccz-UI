'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, FileCheck, Loader2, Plus, Search } from 'lucide-react'
import { NewEquityOrderModal } from '@/components/investments-v2/new-equity-order-modal'
import { buttonClass, inputClass, Metric, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import {
  formatCompact,
  fundNameMap,
  mapBlotterTrades,
  type BlotterTradeRow,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'

export default function TradeBlotterPage() {
  const [trades, setTrades] = useState<BlotterTradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<BlotterTradeRow | null>(null)
  const [showOrder, setShowOrder] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tradesRes, portfoliosRes] = await Promise.all([
        investmentOpsApi.listTrades(),
        investmentOpsApi.listPortfolios(),
      ])
      if (tradesRes.success === false) {
        throw new Error(tradesRes.message || tradesRes.error || 'Failed to load trades')
      }
      const names = fundNameMap(portfoliosRes.data)
      const rows = mapBlotterTrades(tradesRes.data, names)
      setTrades(rows)
      setSelected((prev) => (prev ? rows.find((r) => r.apiId === prev.apiId) ?? null : null))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades')
      setTrades([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () =>
      trades.filter(
        (trade) =>
          (status === 'All' || trade.status === status) &&
          `${trade.id} ${trade.order} ${trade.ticker} ${trade.portfolio}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [trades, status, query],
  )

  const money = (value: number | null | undefined) =>
    value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 2 })
  const updateSelected = (patch: Partial<BlotterTradeRow>) => {
    if (!selected) return
    const updated = { ...selected, ...patch }
    setSelected(updated)
    setTrades((items) => items.map((item) => (item.apiId === updated.apiId ? updated : item)))
  }

  const grossTotal = trades.reduce((sum, t) => sum + t.gross, 0)
  const executedCount = trades.filter((t) => t.status === 'Executed').length
  const pendingCount = trades.filter((t) => t.status === 'Pending' || t.status === 'Partial').length
  const unmatchedCount = trades.filter((t) => t.settlement === 'Unmatched').length

  return (
    <OrdersPage
      title="Trade Blotter"
      description="Executed and pending trades, confirmations and local settlement workflow."
      actions={
        <button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white')} onClick={() => setShowOrder(true)}>
          <Plus className="h-3.5 w-3.5" /> New order
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Gross traded" value={loading ? '…' : formatCompact(grossTotal)} detail="All loaded trades" />
        <Metric label="Executed" value={loading ? '…' : String(executedCount)} tone="text-emerald-300" />
        <Metric label="Pending" value={loading ? '…' : String(pendingCount)} tone="text-amber-300" />
        <Metric label="Unmatched" value={loading ? '…' : String(unmatchedCount)} tone="text-red-300" />
      </div>

      <OrdersCard
        title="Trades"
        eyebrow="Settlement workspace"
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
              <input className={cn(inputClass, 'w-56 pl-8')} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trade or ticker" />
            </div>
            <SelectField className="w-36" value={status} onChange={setStatus}>
              <option>All</option>
              <option>Executed</option>
              <option>Partial</option>
              <option>Pending</option>
            </SelectField>
          </div>
        }
      >
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Trade / order</th>
                <th>Portfolio</th>
                <th>Instrument</th>
                <th>Side</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Exec price</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Fees</th>
                <th className="text-right">Taxes</th>
                <th className="text-right">Net</th>
                <th>Broker</th>
                <th>Custodian</th>
                <th>Trade date</th>
                <th>Value date</th>
                <th>Status</th>
                <th>Settlement</th>
                <th>Accounting</th>
                <th>Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-[11px] text-slate-500">
                    <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
                    Loading trades…
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-[11px] text-slate-500">
                    No trades found.
                  </td>
                </tr>
              )}
              {!loading &&
                visible.map((trade) => (
                  <tr key={trade.apiId || trade.id} className="cursor-pointer" onClick={() => setSelected(trade)}>
                    <td>
                      <div className="font-mono text-blue-300">{trade.id}</div>
                      <div className="text-[9px] text-slate-600">{trade.order}</div>
                    </td>
                    <td>{trade.portfolio}</td>
                    <td>
                      <b>{trade.ticker}</b>
                      <span className="ml-2 text-slate-500">{trade.name}</span>
                    </td>
                    <td className={trade.side === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{trade.side}</td>
                    <td className="text-right font-mono">{trade.qty.toLocaleString()}</td>
                    <td className="text-right font-mono">{trade.price.toFixed(2)}</td>
                    <td className="text-right font-mono">{money(trade.gross)}</td>
                    <td className="text-right font-mono">{money(trade.fees)}</td>
                    <td className="text-right font-mono">{money(trade.taxes)}</td>
                    <td className="text-right font-mono">{money(trade.net)}</td>
                    <td>{trade.broker}</td>
                    <td>{trade.custodian}</td>
                    <td>{trade.tradeDate}</td>
                    <td>{trade.valueDate}</td>
                    <td>
                      <Pill tone={trade.status === 'Executed' ? 'green' : 'amber'}>{trade.status}</Pill>
                    </td>
                    <td>
                      <Pill tone={trade.settlement === 'Settled' ? 'green' : trade.settlement === 'Unmatched' ? 'red' : 'amber'}>
                        {trade.settlement}
                      </Pill>
                    </td>
                    <td>
                      <Pill tone={trade.accounting === 'Posted' ? 'green' : 'slate'}>{trade.accounting}</Pill>
                    </td>
                    <td>
                      <Pill tone={trade.confirmation === 'Confirmed' ? 'green' : 'slate'}>{trade.confirmation}</Pill>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </OrdersCard>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#09111e] p-5 shadow-2xl">
          <div className="flex justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-blue-400">Trade detail</div>
              <h2 className="mt-1 font-mono text-base">{selected.id}</h2>
            </div>
            <button className={buttonClass} onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <div className="mt-5 rounded-[22px] border border-white/[0.07] bg-gradient-to-br from-[#101b30] to-[#080e18] p-4">
            <div className="flex items-center justify-between">
              <div>
                <b className="text-lg">{selected.ticker}</b>
                <p className="text-[10px] text-slate-500">{selected.name}</p>
              </div>
              <Pill tone={selected.side === 'BUY' ? 'green' : 'red'}>
                {selected.side} {selected.qty.toLocaleString()}
              </Pill>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-[10px]">
              <div>
                <span className="text-slate-600">Gross</span>
                <p className="mt-1 font-mono">{money(selected.gross)}</p>
              </div>
              <div>
                <span className="text-slate-600">Fees + tax</span>
                <p className="mt-1 font-mono">{money(selected.fees + (selected.taxes ?? 0))}</p>
              </div>
              <div>
                <span className="text-slate-600">Net</span>
                <p className="mt-1 font-mono">{money(selected.net)}</p>
              </div>
            </div>
          </div>
          <h3 className="mt-6 text-[11px] font-semibold">Settlement & confirmation</h3>
          <div className="mt-3 space-y-3">
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">Broker confirmation</p>
                  <p className="mt-1 text-[9px] text-slate-500">Match price, quantity and broker reference.</p>
                </div>
                <Pill tone={selected.confirmation === 'Confirmed' ? 'green' : 'amber'}>{selected.confirmation}</Pill>
              </div>
              <button
                disabled={selected.confirmation === 'Confirmed'}
                className={cn(buttonClass, 'mt-3 w-full')}
                onClick={() => updateSelected({ confirmation: 'Confirmed' })}
              >
                <FileCheck className="h-3.5 w-3.5" /> Confirm trade
              </button>
            </div>
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">Custodian settlement</p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    {selected.custodian} · {selected.valueDate}
                  </p>
                </div>
                <Pill tone={selected.settlement === 'Settled' ? 'green' : 'amber'}>{selected.settlement}</Pill>
              </div>
              <button
                disabled={selected.settlement === 'Settled'}
                className={cn(buttonClass, 'mt-3 w-full border-emerald-400/30 text-emerald-300')}
                onClick={() => updateSelected({ settlement: 'Settled' })}
              >
                <Check className="h-3.5 w-3.5" /> Mark settled
              </button>
            </div>
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">Accounting posting</p>
                  <p className="mt-1 text-[9px] text-slate-500">Create the local trade-date accounting marker.</p>
                </div>
                <Pill tone={selected.accounting === 'Posted' ? 'green' : 'slate'}>{selected.accounting}</Pill>
              </div>
              <button
                disabled={selected.accounting === 'Posted'}
                className={cn(buttonClass, 'mt-3 w-full border-blue-400/30 text-blue-300')}
                onClick={() => updateSelected({ accounting: 'Posted' })}
              >
                <Check className="h-3.5 w-3.5" /> Mark posted
              </button>
            </div>
          </div>
        </div>
      )}
      <NewEquityOrderModal
        open={showOrder}
        onClose={() => setShowOrder(false)}
        onOrderCreated={() => {
          setShowOrder(false)
          void load()
        }}
      />
    </OrdersPage>
  )
}
