'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Plus, Filter, Download, X } from 'lucide-react'

const blotterData = [
  { id: 'TRD-4821', portfolio: 'Equity World', ticker: 'NVDA', instrument: 'NVIDIA Corp', side: 'BUY', qty: 500, execPrice: 127.42, gross: 63710, fee: 190, net: 63900, broker: 'Goldman Sachs', custodian: 'Citi Custody', tradeDate: '07 Jul 2026', valDate: '09 Jul 2026', settlStatus: 'pending', acctStatus: 'not posted', confStatus: 'confirmed' },
  { id: 'TRD-4820', portfolio: 'Asia Select', ticker: 'TSM', instrument: 'TSMC', side: 'BUY', qty: 300, execPrice: 182.50, gross: 54750, fee: 165, net: 54915, broker: 'CLSA', custodian: 'HSBC Custody', tradeDate: '05 Jul 2026', valDate: '07 Jul 2026', settlStatus: 'settled', acctStatus: 'posted', confStatus: 'confirmed' },
  { id: 'TRD-4819', portfolio: 'Equity World', ticker: 'META', instrument: 'Meta Platforms', side: 'BUY', qty: 150, execPrice: 562.38, gross: 84357, fee: 253, net: 84610, broker: 'Morgan Stanley', custodian: 'Citi Custody', tradeDate: '04 Jul 2026', valDate: '07 Jul 2026', settlStatus: 'settled', acctStatus: 'posted', confStatus: 'confirmed' },
  { id: 'TRD-4818', portfolio: 'Multi Asset', ticker: 'GOLD', instrument: 'Gold ETF', side: 'BUY', qty: 500, execPrice: 186.40, gross: 93200, fee: 280, net: 93480, broker: 'JP Morgan', custodian: 'BNY Custody', tradeDate: '04 Jul 2026', valDate: '07 Jul 2026', settlStatus: 'settled', acctStatus: 'posted', confStatus: 'confirmed' },
  { id: 'TRD-4817', portfolio: 'Equity World', ticker: 'BHP', instrument: 'BHP Group Ltd', side: 'SELL', qty: 1000, execPrice: 44.28, gross: 44280, fee: 133, net: 44147, broker: 'Macquarie', custodian: 'Citi Custody', tradeDate: '06 Jul 2026', valDate: '08 Jul 2026', settlStatus: 'settled', acctStatus: 'posted', confStatus: 'confirmed' },
]

const newOrderFields = {
  portfolio: 'Equity World',
  ticker: '',
  instrument: '',
  side: 'BUY',
  qty: '',
  orderType: 'MARKET',
  limitPrice: '',
  broker: '',
  currency: 'USD',
  notes: '',
}

export default function TradeBlotterPage() {
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [formData, setFormData] = useState(newOrderFields)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Trade Blotter" subtitle="Executed & Pending Trades" showPeriod={false} />

      {/* Module sub-tabs */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0">
        {['Trade Blotter', 'Orderbook', 'Trading', 'Compliance', 'Simulation', 'Models'].map((t) => (
          <a key={t} href={t === 'Trade Blotter' ? '/orders/blotter' : t === 'Orderbook' ? '/orders/orderbook' : t === 'Trading' ? '/orders/trading' : '#'}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              t === 'Trade Blotter' ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7A95]">{blotterData.length} trades · 07 Jul 2026</div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]"
            >
              <Plus className="w-3 h-3" /> New Order
            </button>
          </div>
        </div>

        {/* New Order Modal */}
        {showNewOrder && (
          <div className="bg-[#0D1526] border border-[#2563EB]/40 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-[#E8EDF5]">New Order Entry</div>
              <button onClick={() => setShowNewOrder(false)} className="text-[#6B7A95] hover:text-[#EF4444]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Portfolio', key: 'portfolio', type: 'select', options: ['Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select'] },
                { label: 'Ticker / ISIN', key: 'ticker', type: 'text', placeholder: 'e.g. NVDA' },
                { label: 'Side', key: 'side', type: 'select', options: ['BUY', 'SELL'] },
                { label: 'Quantity', key: 'qty', type: 'number', placeholder: '0' },
                { label: 'Order Type', key: 'orderType', type: 'select', options: ['MARKET', 'LIMIT', 'STOP', 'GTC', 'FOK'] },
                { label: 'Limit Price', key: 'limitPrice', type: 'number', placeholder: '0.00' },
                { label: 'Broker', key: 'broker', type: 'select', options: ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Citi', 'Macquarie', 'CLSA'] },
                { label: 'Currency', key: 'currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'JPY', 'ZAR'] },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={(formData as any)[field.key]}
                      onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                    >
                      {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(formData as any)[field.key]}
                      onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                    />
                  )}
                </div>
              ))}
              <div className="col-span-4">
                <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Notes</label>
                <input
                  placeholder="Trade notes or instructions..."
                  className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex-1 text-[10px] text-[#6B7A95]">
                Estimated consideration: <span className="text-[#C8D3E8] font-mono">Calculating...</span>
                &nbsp;·&nbsp; Compliance check: <span className="text-[#10B981]">Passed</span>
              </div>
              <button className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]" onClick={() => setShowNewOrder(false)}>Cancel</button>
              <button className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8]">Submit Order</button>
            </div>
          </div>
        )}

        {/* Blotter table */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Trade ID</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Exec Price</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">Fees</th>
                  <th className="text-right">Net</th>
                  <th>Broker</th>
                  <th>Custodian</th>
                  <th>Trade Date</th>
                  <th>Val Date</th>
                  <th>Settlement</th>
                  <th>Accounting</th>
                  <th>Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {blotterData.map((t) => (
                  <tr key={t.id} className="cursor-pointer">
                    <td className="text-[#60A5FA] font-mono text-[11px]">{t.id}</td>
                    <td className="text-[#A8B4C8]">{t.portfolio}</td>
                    <td className="text-[#C8D3E8] font-mono font-semibold">{t.ticker}</td>
                    <td className="text-[#A8B4C8]">{t.instrument}</td>
                    <td>
                      <span className={cn('text-xs font-bold', t.side === 'BUY' ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                        {t.side}
                      </span>
                    </td>
                    <td className="text-right font-mono">{t.qty.toLocaleString()}</td>
                    <td className="text-right font-mono">{t.execPrice.toFixed(2)}</td>
                    <td className="text-right font-mono">{t.gross.toLocaleString()}</td>
                    <td className="text-right font-mono text-[#F59E0B]">{t.fee}</td>
                    <td className="text-right font-mono">{t.net.toLocaleString()}</td>
                    <td className="text-[#A8B4C8]">{t.broker}</td>
                    <td className="text-[#6B7A95]">{t.custodian}</td>
                    <td className="text-[#6B7A95]">{t.tradeDate}</td>
                    <td className="text-[#6B7A95]">{t.valDate}</td>
                    <td><StatusBadge status={t.settlStatus} /></td>
                    <td><StatusBadge status={t.acctStatus} /></td>
                    <td><StatusBadge status={t.confStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
