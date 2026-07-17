'use client'

import { useMemo, useState } from 'react'
import { Check, FileCheck, Plus, Search } from 'lucide-react'
import { NewEquityOrderModal } from '@/components/investments-v2/new-equity-order-modal'
import { buttonClass, inputClass, Metric, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { cn } from '@/lib/utils'

const initialTrades = [
  { id: 'TRD-260717-019', order: 'ORD-260717-040', portfolio: 'Growth Equity Fund', ticker: 'INNSCOR', name: 'Innscor Africa Ltd', side: 'SELL', qty: 8400, price: 721.2, gross: 6058080, fees: 22718, taxes: 12116, net: 6023246, broker: 'IH Securities', custodian: 'CBZ Custody', tradeDate: '17 Jul 2026', valueDate: '21 Jul 2026', status: 'Executed', settlement: 'Pending', accounting: 'Unposted', confirmation: 'Awaiting' },
  { id: 'TRD-260717-018', order: 'ORD-260717-041', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', name: 'Delta Corporation Ltd', side: 'BUY', qty: 5000, price: 840, gross: 4200000, fees: 15750, taxes: 8400, net: 4224150, broker: 'Imara Securities', custodian: 'Stanbic Custody', tradeDate: '17 Jul 2026', valueDate: '21 Jul 2026', status: 'Partial', settlement: 'Unmatched', accounting: 'Pending match', confirmation: 'Awaiting' },
  { id: 'TRD-260716-017', order: 'ORD-260716-038', portfolio: 'Arcus Balanced Fund', ticker: 'ECO', name: 'Econet Wireless Zimbabwe', side: 'BUY', qty: 17000, price: 298.1, gross: 5067700, fees: 19004, taxes: 10135, net: 5096839, broker: 'Imara Securities', custodian: 'Stanbic Custody', tradeDate: '16 Jul 2026', valueDate: '18 Jul 2026', status: 'Executed', settlement: 'Settled', accounting: 'Posted', confirmation: 'Confirmed' },
  { id: 'TRD-260716-016', order: 'ORD-260716-035', portfolio: 'Pension Preservation', ticker: 'OKZIM', name: 'OK Zimbabwe Ltd', side: 'SELL', qty: 45000, price: 81.4, gross: 3663000, fees: 13736, taxes: 7326, net: 3641938, broker: 'Morgan & Co', custodian: 'CBZ Custody', tradeDate: '16 Jul 2026', valueDate: '18 Jul 2026', status: 'Pending', settlement: 'Not started', accounting: 'Not ready', confirmation: 'Draft' },
]

export default function TradeBlotterPage() {
  const [trades, setTrades] = useState(initialTrades)
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<(typeof trades)[number] | null>(null)
  const [showOrder, setShowOrder] = useState(false)
  const visible = useMemo(() => trades.filter((trade) => (status === 'All' || trade.status === status) && `${trade.id} ${trade.order} ${trade.ticker} ${trade.portfolio}`.toLowerCase().includes(query.toLowerCase())), [trades, status, query])
  const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2 })
  const updateSelected = (patch: Partial<(typeof trades)[number]>) => {
    if (!selected) return
    const updated = { ...selected, ...patch }
    setSelected(updated)
    setTrades((items) => items.map((item) => item.id === updated.id ? updated : item))
  }

  return (
    <OrdersPage title="Trade Blotter" description="Executed and pending trades, confirmations and local settlement workflow."
      actions={<button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white')} onClick={() => setShowOrder(true)}><Plus className="h-3.5 w-3.5" /> New order</button>}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Gross traded" value="19.19m" detail="ZWL · today" /><Metric label="Executed" value="3" tone="text-emerald-300" /><Metric label="Pending" value="1" tone="text-amber-300" /><Metric label="Unmatched" value="1" tone="text-red-300" /></div>
      <OrdersCard title="Trades" eyebrow="Settlement workspace" actions={<div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" /><input className={cn(inputClass, 'w-56 pl-8')} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trade or ticker" /></div><SelectField className="w-36" value={status} onChange={setStatus}><option>All</option><option>Executed</option><option>Partial</option><option>Pending</option></SelectField></div>}>
        <div className={tableWrapClass}><table className={tableClass}>
          <thead><tr><th>Trade / order</th><th>Portfolio</th><th>Instrument</th><th>Side</th><th className="text-right">Quantity</th><th className="text-right">Exec price</th><th className="text-right">Gross</th><th className="text-right">Fees</th><th className="text-right">Taxes</th><th className="text-right">Net</th><th>Broker</th><th>Custodian</th><th>Trade date</th><th>Value date</th><th>Status</th><th>Settlement</th><th>Accounting</th><th>Confirmation</th></tr></thead>
          <tbody>{visible.map((trade) => <tr key={trade.id} className="cursor-pointer" onClick={() => setSelected(trade)}>
            <td><div className="font-mono text-blue-300">{trade.id}</div><div className="text-[9px] text-slate-600">{trade.order}</div></td><td>{trade.portfolio}</td><td><b>{trade.ticker}</b><span className="ml-2 text-slate-500">{trade.name}</span></td><td className={trade.side === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{trade.side}</td><td className="text-right font-mono">{trade.qty.toLocaleString()}</td><td className="text-right font-mono">{trade.price.toFixed(2)}</td><td className="text-right font-mono">{money(trade.gross)}</td><td className="text-right font-mono">{money(trade.fees)}</td><td className="text-right font-mono">{money(trade.taxes)}</td><td className="text-right font-mono">{money(trade.net)}</td><td>{trade.broker}</td><td>{trade.custodian}</td><td>{trade.tradeDate}</td><td>{trade.valueDate}</td><td><Pill tone={trade.status === 'Executed' ? 'green' : 'amber'}>{trade.status}</Pill></td><td><Pill tone={trade.settlement === 'Settled' ? 'green' : trade.settlement === 'Unmatched' ? 'red' : 'amber'}>{trade.settlement}</Pill></td><td><Pill tone={trade.accounting === 'Posted' ? 'green' : 'slate'}>{trade.accounting}</Pill></td><td><Pill tone={trade.confirmation === 'Confirmed' ? 'green' : 'slate'}>{trade.confirmation}</Pill></td>
          </tr>)}</tbody>
        </table></div>
      </OrdersCard>

      {selected && <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#09111e] p-5 shadow-2xl">
        <div className="flex justify-between"><div><div className="text-[9px] uppercase tracking-widest text-blue-400">Trade detail</div><h2 className="mt-1 font-mono text-base">{selected.id}</h2></div><button className={buttonClass} onClick={() => setSelected(null)}>Close</button></div>
        <div className="mt-5 rounded-[22px] border border-white/[0.07] bg-gradient-to-br from-[#101b30] to-[#080e18] p-4"><div className="flex items-center justify-between"><div><b className="text-lg">{selected.ticker}</b><p className="text-[10px] text-slate-500">{selected.name}</p></div><Pill tone={selected.side === 'BUY' ? 'green' : 'red'}>{selected.side} {selected.qty.toLocaleString()}</Pill></div><div className="mt-4 grid grid-cols-3 gap-3 text-[10px]"><div><span className="text-slate-600">Gross</span><p className="mt-1 font-mono">{money(selected.gross)}</p></div><div><span className="text-slate-600">Fees + tax</span><p className="mt-1 font-mono">{money(selected.fees + selected.taxes)}</p></div><div><span className="text-slate-600">Net</span><p className="mt-1 font-mono">{money(selected.net)}</p></div></div></div>
        <h3 className="mt-6 text-[11px] font-semibold">Settlement & confirmation</h3>
        <div className="mt-3 space-y-3">
          <div className="rounded-[18px] border border-white/[0.07] p-4"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium">Broker confirmation</p><p className="mt-1 text-[9px] text-slate-500">Match price, quantity and broker reference.</p></div><Pill tone={selected.confirmation === 'Confirmed' ? 'green' : 'amber'}>{selected.confirmation}</Pill></div><button disabled={selected.confirmation === 'Confirmed'} className={cn(buttonClass, 'mt-3 w-full')} onClick={() => updateSelected({ confirmation: 'Confirmed' })}><FileCheck className="h-3.5 w-3.5" /> Confirm trade</button></div>
          <div className="rounded-[18px] border border-white/[0.07] p-4"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium">Custodian settlement</p><p className="mt-1 text-[9px] text-slate-500">{selected.custodian} · {selected.valueDate}</p></div><Pill tone={selected.settlement === 'Settled' ? 'green' : 'amber'}>{selected.settlement}</Pill></div><button disabled={selected.settlement === 'Settled'} className={cn(buttonClass, 'mt-3 w-full border-emerald-400/30 text-emerald-300')} onClick={() => updateSelected({ settlement: 'Settled' })}><Check className="h-3.5 w-3.5" /> Mark settled</button></div>
          <div className="rounded-[18px] border border-white/[0.07] p-4"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium">Accounting posting</p><p className="mt-1 text-[9px] text-slate-500">Create the local trade-date accounting marker.</p></div><Pill tone={selected.accounting === 'Posted' ? 'green' : 'slate'}>{selected.accounting}</Pill></div><button disabled={selected.accounting === 'Posted'} className={cn(buttonClass, 'mt-3 w-full border-blue-400/30 text-blue-300')} onClick={() => updateSelected({ accounting: 'Posted' })}><Check className="h-3.5 w-3.5" /> Mark posted</button></div>
        </div>
      </div>}
      <NewEquityOrderModal open={showOrder} onClose={() => setShowOrder(false)} onOrderCreated={() => setShowOrder(false)} />
    </OrdersPage>
  )
}
