'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Filter, Download, Search, Loader2, Folder, FolderOpen } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchPortfolioTransactions, setOpsSelectedFundId } from '@/lib/store/slices/investmentOpsSlice'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
import { useSortedPaginated } from '@/components/investments-v2/ui/use-sorted-paginated'
import { SortableTh } from '@/components/investments-v2/ui/sortable-th'
import { TablePagination } from '@/components/investments-v2/ui/table-pagination'

const TXN_TYPES = ['All', 'PURCHASE', 'SALE'] as const

type TxnSortKey = 'tradeRef' | 'symbol' | 'quantity' | 'price' | 'tradeDate' | 'realizedPnl'

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

export default function TransactionsPage() {
  const dispatch = useAppDispatch()
  const { portfolios, portfoliosLoading, selectedFundId, portfolioTransactions, portfolioTransactionsLoading } =
    useAppSelector((s) => s.investmentOps)
  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [typeFilter, setTypeFilter] = useState<(typeof TXN_TYPES)[number]>('All')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

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
      const tradeDate = new Date(t.tradeDate)
      const matchFrom = !dateFrom || tradeDate >= dateFrom
      const matchTo = !dateTo || tradeDate <= new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1)
      return matchType && matchSearch && matchFrom && matchTo
    })
  }, [portfolioTransactions, typeFilter, search, dateFrom, dateTo])

  const getTxnSortValue = (t: (typeof portfolioTransactions)[number], key: TxnSortKey) => {
    if (key === 'tradeDate') return new Date(t.tradeDate).getTime()
    if (key === 'realizedPnl') return t.realizedPnl ?? 0
    return t[key]
  }
  const {
    pageRows,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
    totalPages,
    totalRows,
  } = useSortedPaginated<(typeof portfolioTransactions)[number], TxnSortKey>(filtered, getTxnSortValue, 'tradeDate', 12)

  const handleExport = () => {
    exportRowsToCsv(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Trade Ref', 'Symbol', 'Type', 'Quantity', 'Price', 'Status', 'Trade Date', 'Journal Entry', 'Realized P&L'],
      filtered.map((txn) => [
        txn.tradeRef,
        txn.symbol,
        txn.type === 'PURCHASE' ? 'BUY' : 'SELL',
        txn.quantity,
        txn.price,
        txn.status,
        new Date(txn.tradeDate).toLocaleString(),
        txn.journalEntryId ? new Date(txn.tradeDate).toLocaleString() : '',
        txn.realizedPnl ?? '',
      ])
    )
  }

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
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
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
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
            <Button variant="outline" size="pill" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="w-3 h-3" /> Filter
            </Button>
            <Button variant="outline" size="pill" onClick={handleExport}>
              <Download className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap arcus-card px-4 py-3">
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Trade date range:</span>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" className="w-40" allowFutureDates container={themeContainer} />
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" className="w-40" allowFutureDates container={themeContainer} />
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined) }}>
                Clear
              </Button>
            )}
          </div>
        )}

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
                    <SortableTh col="tradeRef" label="Trade Ref" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh col="symbol" label="Symbol" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Type</th>
                    <SortableTh col="quantity" label="Quantity" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                    <SortableTh col="price" label="Price" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                    <th>Status</th>
                    <SortableTh col="tradeDate" label="Trade Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Journal Entry</th>
                    <SortableTh col="realizedPnl" label="Realized P&L" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
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
                      <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(txn.tradeDate).toLocaleString()}
                      </td>
                      <td className="font-mono text-[11px]" style={{ color: txn.journalEntryId ? '#10b981' : 'var(--muted-foreground)' }}>
                        {txn.journalEntryId ? new Date(txn.tradeDate).toLocaleString() : '—'}
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

          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} rowsShown={pageRows.length} totalRows={totalRows} />
        </div>
      </div>
    </div>
  )
}
