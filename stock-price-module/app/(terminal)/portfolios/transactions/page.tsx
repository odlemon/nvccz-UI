'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Filter, Download, Search } from 'lucide-react'

const instrumentTabs = ['Overview', 'Instruments', 'Prices', 'Positions', 'Transactions']

const txnTypes = ['All', 'Buy', 'Sell', 'Dividend', 'Coupon', 'FX', 'Fee', 'Subscription', 'Redemption']

const transactions = [
  { id: 'TXN-8421', portfolio: 'Equity World', ticker: 'NVDA', name: 'NVIDIA Corp', type: 'Buy', qty: 500, price: 127.42, gross: 63710, fee: 190, net: 63900, currency: 'USD', tradeDate: '07 Jul 2026', valDate: '09 Jul 2026', broker: 'Goldman Sachs', custodian: 'Citi Custody', settlStatus: 'pending', posted: false },
  { id: 'TXN-8420', portfolio: 'Asia Select', ticker: 'TSM', name: 'TSMC ADR', type: 'Buy', qty: 300, price: 182.50, gross: 54750, fee: 165, net: 54915, currency: 'USD', tradeDate: '05 Jul 2026', valDate: '07 Jul 2026', broker: 'CLSA', custodian: 'HSBC Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8419', portfolio: 'Equity World', ticker: 'META', name: 'Meta Platforms', type: 'Buy', qty: 150, price: 562.38, gross: 84357, fee: 253, net: 84610, currency: 'USD', tradeDate: '04 Jul 2026', valDate: '07 Jul 2026', broker: 'Morgan Stanley', custodian: 'Citi Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8418', portfolio: 'Multi Asset', ticker: 'GOLD', name: 'iShares Gold ETF', type: 'Buy', qty: 500, price: 186.40, gross: 93200, fee: 280, net: 93480, currency: 'USD', tradeDate: '04 Jul 2026', valDate: '07 Jul 2026', broker: 'JP Morgan', custodian: 'BNY Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8417', portfolio: 'Equity World', ticker: 'BHP', name: 'BHP Group', type: 'Sell', qty: 1000, price: 44.28, gross: 44280, fee: 133, net: 44147, currency: 'AUD', tradeDate: '06 Jul 2026', valDate: '08 Jul 2026', broker: 'Macquarie', custodian: 'Citi Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8416', portfolio: 'Equity World', ticker: 'MSFT', name: 'Microsoft Corp', type: 'Dividend', qty: 1200, price: 0.75, gross: 900, fee: 0, net: 900, currency: 'USD', tradeDate: '01 Jul 2026', valDate: '01 Jul 2026', broker: '—', custodian: 'Citi Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8415', portfolio: 'Fixed Income', ticker: 'UST10Y', name: 'US Treasury 10Y', type: 'Coupon', qty: 100, price: 225.00, gross: 22500, fee: 0, net: 22500, currency: 'USD', tradeDate: '15 Jun 2026', valDate: '15 Jun 2026', broker: '—', custodian: 'Citi Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8414', portfolio: 'Multi Asset', ticker: 'USD/ZAR', name: 'FX Conversion', type: 'FX', qty: 1, price: 18.42, gross: 184200, fee: 420, net: 183780, currency: 'ZAR', tradeDate: '02 Jul 2026', valDate: '02 Jul 2026', broker: 'Citi FX', custodian: 'BNY Custody', settlStatus: 'settled', posted: true },
  { id: 'TXN-8413', portfolio: 'New Portfolio', ticker: 'CASH', name: 'Initial Subscription', type: 'Subscription', qty: 1, price: 12000000, gross: 12000000, fee: 0, net: 12000000, currency: 'USD', tradeDate: '01 Jul 2026', valDate: '01 Jul 2026', broker: '—', custodian: 'Citi Custody', settlStatus: 'settled', posted: true },
]

const typeColors: Record<string, string> = {
  Buy: 'text-[#10B981]',
  Sell: 'text-[#EF4444]',
  Dividend: 'text-[#60A5FA]',
  Coupon: 'text-[#60A5FA]',
  FX: 'text-[#F59E0B]',
  Fee: 'text-[#EF4444]',
  Subscription: 'text-[#10B981]',
  Redemption: 'text-[#EF4444]',
}

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter(t => {
    const matchType = typeFilter === 'All' || t.type === typeFilter
    const matchSearch = !search || t.ticker.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Portfolio Management" subtitle="Transactions" showPeriod />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto">
        {instrumentTabs.map(t => (
          <a key={t}
            href={t === 'Overview' ? '/portfolios' : t === 'Instruments' ? '/portfolios/instruments' : t === 'Prices' ? '/portfolios/prices' : t === 'Positions' ? '/portfolios/positions' : '#'}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              t === 'Transactions' ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {txnTypes.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn('px-3 py-1 rounded text-xs font-medium transition-colors',
                  typeFilter === t ? 'bg-[#1E3A5F] text-[#60A5FA]' : 'text-[#6B7A95] hover:bg-[#111C30] hover:text-[#A8B4C8]')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#111C30] border border-white/[0.06] rounded px-2.5 py-1.5">
              <Search className="w-3 h-3 text-[#4B5A72]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-[#A8B4C8] text-xs outline-none w-32 placeholder:text-[#4B5A72]" />
            </div>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">Fees</th>
                  <th className="text-right">Net Amount</th>
                  <th>CCY</th>
                  <th>Trade Date</th>
                  <th>Val Date</th>
                  <th>Broker</th>
                  <th>Settlement</th>
                  <th>Posted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(txn => (
                  <tr key={txn.id} className="cursor-pointer">
                    <td className="text-[#60A5FA] font-mono text-[11px]">{txn.id}</td>
                    <td className="text-[#A8B4C8]">{txn.portfolio}</td>
                    <td className="text-[#C8D3E8] font-mono font-semibold">{txn.ticker}</td>
                    <td className="text-[#A8B4C8]">{txn.name}</td>
                    <td>
                      <span className={cn('text-xs font-semibold', typeColors[txn.type] ?? 'text-[#A8B4C8]')}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="text-right font-mono">{txn.qty.toLocaleString()}</td>
                    <td className="text-right font-mono">{txn.price.toFixed(2)}</td>
                    <td className="text-right font-mono">{txn.gross.toLocaleString()}</td>
                    <td className="text-right font-mono text-[#F59E0B]">{txn.fee || '—'}</td>
                    <td className="text-right font-mono font-medium text-[#E8EDF5]">{txn.net.toLocaleString()}</td>
                    <td className="text-[#A8B4C8] font-mono">{txn.currency}</td>
                    <td className="text-[#6B7A95]">{txn.tradeDate}</td>
                    <td className="text-[#6B7A95]">{txn.valDate}</td>
                    <td className="text-[#A8B4C8]">{txn.broker}</td>
                    <td><StatusBadge status={txn.settlStatus} /></td>
                    <td>
                      <span className={cn('text-[10px] font-medium', txn.posted ? 'text-[#10B981]' : 'text-[#F59E0B]')}>
                        {txn.posted ? 'Posted' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06]">
            <div className="text-[10px] text-[#6B7A95]">Showing {filtered.length} of {transactions.length} transactions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
