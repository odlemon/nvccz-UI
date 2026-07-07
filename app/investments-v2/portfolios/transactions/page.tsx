'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Filter, Download, Search } from 'lucide-react'

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
  Buy: '#10b981',
  Sell: '#ef4444',
  Dividend: '#3b82f6',
  Coupon: '#3b82f6',
  FX: '#f59e0b',
  Fee: '#ef4444',
  Subscription: '#10b981',
  Redemption: '#ef4444',
}

const PAGE_SIZE = 12

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = typeFilter === 'All' || t.type === typeFilter
      const matchSearch =
        !search ||
        t.ticker.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase())
      return matchType && matchSearch
    })
  }, [typeFilter, search])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Transactions" />
      <PortfoliosSubNav />

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {txnTypes.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn('cat-pill', typeFilter === t && 'active')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded px-2.5 py-1.5"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-xs outline-none w-32"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
              style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
              style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
              Transactions
            </span>
          </div>
          <div className="overflow-x-auto">
            {pageRows.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                No transactions found{search ? ` matching "${search}"` : ''}.
              </div>
            ) : (
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
                  {pageRows.map((txn) => (
                    <tr key={txn.id} className="cursor-pointer">
                      <td className="font-mono text-[11px]" style={{ color: '#3b82f6' }}>
                        {txn.id}
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{txn.portfolio}</td>
                      <td className="font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                        {txn.ticker}
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{txn.name}</td>
                      <td>
                        <span className="text-xs font-semibold" style={{ color: typeColors[txn.type] ?? 'var(--muted-foreground)' }}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {txn.qty.toLocaleString()}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {txn.price.toFixed(2)}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {txn.gross.toLocaleString()}
                      </td>
                      <td className="text-right font-mono" style={{ color: '#f59e0b' }}>
                        {txn.fee || '—'}
                      </td>
                      <td className="text-right font-mono font-medium" style={{ color: 'var(--foreground)' }}>
                        {txn.net.toLocaleString()}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {txn.currency}
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{txn.tradeDate}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{txn.valDate}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{txn.broker}</td>
                      <td>
                        <StatusBadge status={txn.settlStatus} />
                      </td>
                      <td>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: txn.posted ? '#10b981' : '#f59e0b' }}
                        >
                          {txn.posted ? 'Posted' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Showing {pageRows.length} out of {filtered.length} results
              </span>
              <div className="flex items-center gap-1">
                <button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={cn('pg-btn', page === p && 'active')}>
                    {p}
                  </button>
                ))}
                <button
                  className="pg-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
