'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Filter, Download, Search, Loader2, Folder, FolderOpen } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchPortfolioTransactions, setOpsSelectedFundId } from '@/lib/store/slices/investmentOpsSlice'

const TXN_TYPES = ['All', 'PURCHASE', 'SALE'] as const

const PAGE_SIZE = 12

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

export default function TransactionsPage() {
  const dispatch = useAppDispatch()
  const { portfolios, portfoliosLoading, selectedFundId, portfolioTransactions, portfolioTransactionsLoading } =
    useAppSelector((s) => s.investmentOps)

  const [typeFilter, setTypeFilter] = useState<(typeof TXN_TYPES)[number]>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    if (selectedFundId) dispatch(fetchPortfolioTransactions(selectedFundId))
  }, [dispatch, selectedFundId])

  const filtered = useMemo(() => {
    return portfolioTransactions.filter((t) => {
      const matchType = typeFilter === 'All' || t.type === typeFilter
      const matchSearch =
        !search ||
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.tradeRef.toLowerCase().includes(search.toLowerCase())
      return matchType && matchSearch
    })
  }, [portfolioTransactions, typeFilter, search])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, search, selectedFundId])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Transactions" />
      <PortfoliosSubNav />

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">
        {/* Fund tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {portfoliosLoading ? (
            <Spinner />
          ) : portfolios.length === 0 ? (
            <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>No funds available</span>
          ) : (
            portfolios.map((fund) => (
              <button
                key={fund.id}
                onClick={() => dispatch(setOpsSelectedFundId(fund.id))}
                className={cn('folder-tab', selectedFundId === fund.id && 'active')}
              >
                {selectedFundId === fund.id ? (
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                {fund.name}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {TXN_TYPES.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn('cat-pill', typeFilter === t && 'active')}>
                {t === 'All' ? 'All' : t === 'PURCHASE' ? 'Buy' : 'Sell'}
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
                placeholder="Search symbol or trade ref..."
                className="bg-transparent text-xs outline-none w-40"
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
            {portfolioTransactionsLoading && <Spinner />}
          </div>
          <div className="overflow-x-auto">
            {portfolioTransactionsLoading && portfolioTransactions.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : pageRows.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                No transactions found{search ? ` matching "${search}"` : ''}.
              </div>
            ) : (
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Trade Ref</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Price</th>
                    <th>Status</th>
                    <th>Trade Date</th>
                    <th>Journal Entry</th>
                    <th className="text-right">Realized P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((txn) => (
                    <tr key={txn.id} className="cursor-pointer">
                      <td className="font-mono text-[11px]" style={{ color: '#3b82f6' }}>
                        {txn.tradeRef}
                      </td>
                      <td className="font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                        {txn.symbol}
                      </td>
                      <td>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: txn.type === 'PURCHASE' ? '#10b981' : '#ef4444' }}
                        >
                          {txn.type === 'PURCHASE' ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {txn.quantity.toLocaleString()}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {txn.price.toFixed(4)}
                      </td>
                      <td>
                        <StatusBadge status={txn.status.toLowerCase().replace(/_/g, ' ')} />
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{new Date(txn.tradeDate).toLocaleDateString()}</td>
                      <td className="font-mono text-[11px]" style={{ color: txn.journalEntryId ? '#10b981' : 'var(--muted-foreground)' }}>
                        {txn.journalEntryId ? 'Posted' : '—'}
                      </td>
                      <td
                        className="text-right font-mono"
                        style={{ color: txn.realizedPnl == null ? 'var(--muted-foreground)' : txn.realizedPnl >= 0 ? '#10b981' : '#ef4444' }}
                      >
                        {txn.realizedPnl != null ? `${txn.realizedPnl >= 0 ? '+' : ''}${txn.realizedPnl.toLocaleString()}` : '—'}
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
