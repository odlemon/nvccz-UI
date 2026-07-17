'use client'

import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { buttonClass, Field, inputClass, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { cn } from '@/lib/utils'

const tabs = ['Orderbook', 'New', 'Pending', 'Executed', 'Cancelled', 'Failed', 'Rejected', 'Settled']
const orders = [
  { ref: 'ORD-260717-041', masterRef: 'ZSE-EQ-DELTA', blotter: 'July ZSE Income', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', instrument: 'Delta Corporation Ltd', side: 'BUY', type: 'LIMIT', qty: 12500, filled: 5000, execPrice: 840, limitPrice: 842.5, gross: '10,531,250', broker: 'Imara Securities', trader: 'T. Moyo', tradeDate: '17 Jul 2026', valueDate: '21 Jul', approval: 'CIO approved', routing: 'At broker', created: '17 Jul 13:32', status: 'Pending' },
  { ref: 'ORD-260717-040', masterRef: 'ZSE-EQ-INNSCOR', blotter: 'July ZSE Income', portfolio: 'Growth Equity Fund', ticker: 'INNSCOR', instrument: 'Innscor Africa Ltd', side: 'SELL', type: 'MARKET', qty: 8400, filled: 8400, execPrice: 721.2, limitPrice: null, gross: '6,058,080', broker: 'IH Securities', trader: 'N. Sibanda', tradeDate: '17 Jul 2026', valueDate: '21 Jul', approval: 'Approved', routing: 'Filled', created: '17 Jul 12:48', status: 'Executed' },
  { ref: 'ORD-260717-039', masterRef: 'ZSE-EQ-CBZ', blotter: 'Liquidity rebalance', portfolio: 'Pension Preservation', ticker: 'CBZ', instrument: 'CBZ Holdings Ltd', side: 'BUY', type: 'STOP LIMIT', qty: 22000, filled: 0, execPrice: null, limitPrice: 315.75, gross: '6,946,500', broker: 'Morgan & Co', trader: 'A. Ncube', tradeDate: '17 Jul 2026', valueDate: '22 Jul', approval: 'Not submitted', routing: 'Not routed', created: '17 Jul 11:19', status: 'New' },
  { ref: 'ORD-260716-038', masterRef: 'ZSE-EQ-ECO', blotter: 'Client mandate 77', portfolio: 'Arcus Balanced Fund', ticker: 'ECO', instrument: 'Econet Wireless Zimbabwe', side: 'BUY', type: 'LIMIT', qty: 17000, filled: 17000, execPrice: 298.1, limitPrice: 300, gross: '5,067,700', broker: 'Imara Securities', trader: 'T. Moyo', tradeDate: '16 Jul 2026', valueDate: '18 Jul', approval: 'Approved', routing: 'Completed', created: '16 Jul 15:06', status: 'Settled' },
  { ref: 'ORD-260716-037', masterRef: 'ZSE-EQ-FBC', blotter: 'Growth rotation', portfolio: 'Growth Equity Fund', ticker: 'FBC', instrument: 'FBC Holdings Ltd', side: 'SELL', type: 'MARKET', qty: 9500, filled: 0, execPrice: null, limitPrice: null, gross: '1,770,800', broker: 'IH Securities', trader: 'N. Sibanda', tradeDate: '16 Jul 2026', valueDate: '18 Jul', approval: 'Rejected', routing: 'Not routed', created: '16 Jul 14:20', status: 'Rejected' },
  { ref: 'ORD-260716-036', masterRef: 'ZSE-EQ-NMB', blotter: 'Liquidity rebalance', portfolio: 'Pension Preservation', ticker: 'NMB', instrument: 'NMBZ Holdings Ltd', side: 'SELL', type: 'LIMIT', qty: 32000, filled: 0, execPrice: null, limitPrice: 103.2, gross: '3,302,400', broker: 'Morgan & Co', trader: 'A. Ncube', tradeDate: '16 Jul 2026', valueDate: '18 Jul', approval: 'Approved', routing: 'Cancelled by PM', created: '16 Jul 10:07', status: 'Cancelled' },
  { ref: 'ORD-260715-035', masterRef: 'ZSE-EQ-OKZIM', blotter: 'July ZSE Income', portfolio: 'Arcus Balanced Fund', ticker: 'OKZIM', instrument: 'OK Zimbabwe Ltd', side: 'BUY', type: 'DAY', qty: 18000, filled: 0, execPrice: null, limitPrice: 82.1, gross: '1,477,800', broker: 'Imara Securities', trader: 'T. Moyo', tradeDate: '15 Jul 2026', valueDate: '17 Jul', approval: 'Approved', routing: 'Broker rejected', created: '15 Jul 09:41', status: 'Failed' },
]

const tone = (status: string) => status === 'Executed' || status === 'Settled' ? 'green' : status === 'Pending' ? 'amber' : status === 'New' ? 'blue' : 'red'

export default function OrderbookPage() {
  const [tab, setTab] = useState('Orderbook')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Newest first')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<(typeof orders)[number] | null>(null)
  const [newBlotter, setNewBlotter] = useState(false)
  const [blotters, setBlotters] = useState([
    { name: 'July ZSE Income', orders: 14, owner: 'T. Moyo', portfolio: 'Arcus Balanced Fund', updated: '2 min ago' },
    { name: 'Liquidity rebalance', orders: 8, owner: 'A. Ncube', portfolio: 'Pension Preservation', updated: '38 min ago' },
  ])
  const [blotterName, setBlotterName] = useState('')
  const [defaultPortfolio, setDefaultPortfolio] = useState('Arcus Balanced Fund')
  const [owner, setOwner] = useState('You')
  const filtered = useMemo(() => {
    const rows = orders.filter((order) => (tab === 'Orderbook' || order.status === tab) && `${order.ref} ${order.ticker} ${order.portfolio}`.toLowerCase().includes(search.toLowerCase()))
    return [...rows].sort((a, b) => sort === 'Oldest first' ? a.ref.localeCompare(b.ref) : sort === 'Largest value' ? Number(b.gross.replaceAll(',', '')) - Number(a.gross.replaceAll(',', '')) : sort === 'Status' ? a.status.localeCompare(b.status) : b.ref.localeCompare(a.ref))
  }, [tab, search, sort])
  const pageSize = 4
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const changeTab = (value: string) => { setTab(value); setPage(1) }

  return (
    <OrdersPage title="Orderbook" description="Review the full order lifecycle, blotters and immutable status history."
      actions={<button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500')} onClick={() => setNewBlotter(true)}><Plus className="h-3.5 w-3.5" /> New Blotter</button>}>
      <OrdersCard title="Open Blotters" eyebrow="Working sets">
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {blotters.map((item) => <button key={item.name} onClick={() => { setSearch(item.name); setTab('Orderbook'); setPage(1) }} className="rounded-full border border-white/[0.07] bg-[#070d17] p-3 text-left transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]">
            <div className="flex justify-between"><span className="text-[11px] font-semibold">{item.name}</span><Pill tone="blue">{item.orders} orders</Pill></div>
            <div className="mt-3 flex justify-between text-[9px] text-slate-500"><span>{item.owner} · {item.portfolio}</span><span>{item.updated}</span></div>
          </button>)}
        </div>
      </OrdersCard>

      <OrdersCard title="All orders" eyebrow={`${filtered.length} records`} actions={<div className="flex flex-wrap gap-2">
        <div className="relative"><Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search order, ticker, portfolio" className={cn(inputClass, 'w-60 pl-8')} /></div>
        <div className="flex items-center gap-2"><span className="text-[9px] uppercase tracking-wider text-slate-600">Sort by</span><SelectField value={sort} onChange={(value) => { setSort(value); setPage(1) }} className="w-40"><option>Newest first</option><option>Oldest first</option><option>Largest value</option><option>Status</option></SelectField></div>
      </div>}>
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
          {tabs.map((item) => <button key={item} onClick={() => changeTab(item)} className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:text-white', tab === item && 'bg-blue-600 text-white')}>{item}</button>)}
        </div>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead><tr><th>Order ref</th><th>Status</th><th>Blotter</th><th>Portfolio / fund</th><th>Instrument / master ref</th><th>Side</th><th>Type</th><th className="text-right">Qty / filled</th><th className="text-right">Exec / limit</th><th className="text-right">Consideration</th><th>Broker</th><th>Trader</th><th>Trade / value date</th><th>Approval</th><th>Routing</th></tr></thead>
            <tbody>{pageRows.map((order) => <tr key={order.ref} onClick={() => setSelected(order)} className={cn('cursor-pointer', selected?.ref === order.ref && 'bg-blue-500/10')}>
              <td className="font-mono text-blue-300">{order.ref}</td><td><Pill tone={tone(order.status) as any}>{order.status}</Pill></td><td className="text-slate-400">{order.blotter}</td><td>{order.portfolio}</td>
              <td><b>{order.ticker}</b><span className="ml-2 text-slate-500">{order.instrument}</span><div className="font-mono text-[9px] text-slate-600">{order.masterRef}</div></td><td className={order.side === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{order.side}</td><td>{order.type}</td>
              <td className="text-right font-mono">{order.qty.toLocaleString()} / {order.filled.toLocaleString()}</td><td className="text-right font-mono">{order.execPrice?.toFixed(2) ?? '—'} / {order.limitPrice?.toFixed(2) ?? 'MKT'}</td><td className="text-right font-mono">{order.gross}</td><td>{order.broker}</td><td>{order.trader}</td><td>{order.tradeDate}<div className="text-[9px] text-slate-600">VD {order.valueDate}</div></td><td><Pill tone={order.approval.includes('Rejected') ? 'red' : order.approval.includes('Not') ? 'slate' : 'green'}>{order.approval}</Pill></td><td>{order.routing}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 text-[10px] text-slate-500"><span>Showing {pageRows.length} of {filtered.length} orders</span><div className="flex gap-1">{Array.from({ length: pageCount }, (_, index) => index + 1).map((n) => <button key={n} onClick={() => setPage(n)} className={cn('h-7 w-7 rounded-full hover:bg-white/10', page === n && 'bg-blue-600 text-white')}>{n}</button>)}</div></div>
      </OrdersCard>

      {selected && <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#09111e] p-5 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[9px] uppercase tracking-widest text-blue-400">Order detail</p><h2 className="mt-1 font-mono text-base">{selected.ref}</h2></div><button className={buttonClass} onClick={() => setSelected(null)}>Close</button></div>
        <div className="mt-6 grid grid-cols-2 gap-3">{Object.entries({ Portfolio: selected.portfolio, Instrument: `${selected.ticker} · ${selected.masterRef}`, Side: selected.side, Quantity: selected.qty.toLocaleString(), Broker: selected.broker, Trader: selected.trader, Approval: selected.approval, Routing: selected.routing, 'Trade date': selected.tradeDate, 'Value date': selected.valueDate }).map(([label, value]) => <div key={label} className="rounded-[16px] bg-white/[0.035] p-3"><div className="text-[9px] uppercase text-slate-600">{label}</div><div className="mt-1 text-[11px]">{value}</div></div>)}</div>
        <h3 className="mt-6 text-[11px] font-semibold">Status history</h3>
        <div className="mt-3 space-y-4 border-l border-white/10 pl-4">
          {[
            ['Pending Settlement', 'S. Dube', '17 Jul 15:21', 'Execution matched and queued for settlement', 'Executed'],
            ['Executed', selected.trader, '17 Jul 15:02', 'Broker fill recorded against routed order', 'Partially Executed'],
            ['Partially Executed', selected.trader, '17 Jul 14:26', 'First broker fill received', 'Sent to Broker'],
            ['Sent to Broker', selected.trader, '17 Jul 14:03', `Routed to ${selected.broker}`, 'Approved'],
            ['Approved', 'R. Chirwa', '17 Jul 13:58', 'Four-eye approval completed', 'Compliance Review'],
            ['Compliance Review', 'P. Dube', '17 Jul 13:44', 'All mandate checks completed', 'Submitted'],
            ['Submitted', selected.trader, selected.created, 'Submitted for review', 'Draft'],
          ].map(([next, user, time, reason, old]) => <div key={`${next}-${time}`} className="relative"><span className="absolute -left-[20px] top-1 h-2 w-2 rounded-full bg-blue-400" /><div className="flex gap-2"><Pill tone={tone(String(next)) as any}>{old} → {next}</Pill></div><div className="mt-1 text-[10px] text-slate-300">{reason}</div><div className="mt-1 text-[9px] text-slate-600">{user} · {time}</div></div>)}
        </div>
      </div>}

      <Modal open={newBlotter} onClose={() => setNewBlotter(false)} title="New blotter" subtitle="Create a local working set for related orders."
        footer={<><button className={buttonClass} onClick={() => setNewBlotter(false)}>Cancel</button><button disabled={!blotterName} className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={() => { setBlotters((items) => [...items, { name: blotterName, orders: 0, owner, portfolio: defaultPortfolio, updated: 'Now' }]); setBlotterName(''); setNewBlotter(false) }}>Create blotter</button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Blotter name"><input className={inputClass} value={blotterName} onChange={(e) => setBlotterName(e.target.value)} placeholder="e.g. August income rotation" /></Field><Field label="Default portfolio"><SelectField value={defaultPortfolio} onChange={setDefaultPortfolio}><option>Arcus Balanced Fund</option><option>Growth Equity Fund</option></SelectField></Field><Field label="Owner"><SelectField value={owner} onChange={setOwner}><option>You</option><option>T. Moyo</option><option>A. Ncube</option></SelectField></Field><Field label="Trade date"><input className={inputClass} type="date" defaultValue="2026-07-17" /></Field></div>
      </Modal>
    </OrdersPage>
  )
}
