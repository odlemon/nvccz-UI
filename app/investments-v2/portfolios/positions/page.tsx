'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { cn } from '@/lib/utils'
import { Filter, Download, ChevronDown, ChevronUp, Loader2, Folder, FolderOpen } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchPortfolioHoldings, setOpsSelectedFundId } from '@/lib/store/slices/investmentOpsSlice'
import { effectiveHoldingValue, type Holding } from '@/lib/api/investments-api'

type SortKey = 'ticker' | 'marketValue' | 'unrealizedPnl'
const PAGE_SIZE = 12

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

export default function PositionsPage() {
  const dispatch = useAppDispatch()
  const { portfolios, portfoliosLoading, selectedFundId, portfolioHoldings, portfolioHoldingsLoading } = useAppSelector(
    (s) => s.investmentOps
  )
  const [sortKey, setSortKey] = useState<SortKey>('marketValue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    if (selectedFundId) dispatch(fetchPortfolioHoldings(selectedFundId))
  }, [dispatch, selectedFundId])

  useEffect(() => {
    setPage(1)
  }, [selectedFundId])

  const sorted = useMemo(() => {
    return [...portfolioHoldings].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'ticker') return dir * (a.security?.symbol ?? '').localeCompare(b.security?.symbol ?? '')
      if (sortKey === 'marketValue') return dir * (effectiveHoldingValue(a) - effectiveHoldingValue(b))
      return dir * ((a.unrealizedPnl ?? 0) - (b.unrealizedPnl ?? 0))
    })
  }, [portfolioHoldings, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const totalMktValue = portfolioHoldings.reduce((s, h) => s + effectiveHoldingValue(h), 0)
  const totalUnrealPnl = portfolioHoldings.reduce((s, h) => s + (h.unrealizedPnl ?? 0), 0)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-2.5 h-2.5 opacity-30" />
    return sortDir === 'desc' ? (
      <ChevronDown className="w-2.5 h-2.5" style={{ color: '#3b82f6' }} />
    ) : (
      <ChevronUp className="w-2.5 h-2.5" style={{ color: '#3b82f6' }} />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Positions" />
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

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Market Value', value: `${(totalMktValue / 1000).toFixed(1)}k`, color: 'var(--foreground)' },
            {
              label: 'Total Unrealised P&L',
              value: `${totalUnrealPnl >= 0 ? '+' : ''}${totalUnrealPnl.toFixed(2)}`,
              color: totalUnrealPnl >= 0 ? '#10b981' : '#ef4444',
            },
            { label: 'Open Positions', value: portfolioHoldings.length, color: 'var(--foreground)' },
          ].map((s) => (
            <div key={s.label} className="arcus-card px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {s.label}
              </div>
              <div className="text-lg font-semibold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
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

        {/* Positions table card */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
              Portfolio Positions
            </span>
            {portfolioHoldingsLoading && <Spinner />}
          </div>
          <div className="overflow-x-auto">
            {portfolioHoldingsLoading && portfolioHoldings.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : pageRows.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                No holdings for this fund.
              </div>
            ) : (
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>
                      <button className="flex items-center gap-1" onClick={() => handleSort('ticker')}>
                        Ticker <SortIcon col="ticker" />
                      </button>
                    </th>
                    <th>Name</th>
                    <th>Exchange</th>
                    <th>CCY</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Avg Cost</th>
                    <th className="text-right">Mkt Price</th>
                    <th className="text-right">
                      <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('marketValue')}>
                        Mkt Value <SortIcon col="marketValue" />
                      </button>
                    </th>
                    <th className="text-right">
                      <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('unrealizedPnl')}>
                        Unrealised P&L <SortIcon col="unrealizedPnl" />
                      </button>
                    </th>
                    <th>Sector</th>
                    <th>Weight</th>
                    <th>Open Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((h: Holding) => (
                    <tr key={h.id} className="cursor-pointer">
                      <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                        {h.security?.symbol ?? '—'}
                      </td>
                      <td style={{ color: 'var(--foreground)' }}>{h.security?.name ?? '—'}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{h.security?.exchangeCode ?? '—'}</td>
                      <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {h.wacCurrencyCode}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {h.quantity.toLocaleString()}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {h.wac.toFixed(4)}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {h.currentPrice != null ? h.currentPrice.toFixed(4) : '—'}
                      </td>
                      <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                        {h.marketValue != null ? h.marketValue.toLocaleString() : '—'}
                      </td>
                      <td
                        className="text-right font-mono"
                        style={{ color: h.unrealizedPnl == null ? 'var(--muted-foreground)' : h.unrealizedPnl >= 0 ? '#10b981' : '#ef4444' }}
                      >
                        {h.unrealizedPnl != null ? `${h.unrealizedPnl >= 0 ? '+' : ''}${h.unrealizedPnl.toLocaleString()}` : '—'}
                      </td>
                      {/* Fields not carried by the holdings endpoint — honest placeholder, not fabricated */}
                      <td style={{ color: 'var(--muted-foreground)' }}>—</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>—</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>—</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                    <td colSpan={7} className="text-[11px] font-medium px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>
                      Total ({sorted.length} positions)
                    </td>
                    <td className="text-right font-mono font-semibold px-3 py-2" style={{ color: 'var(--foreground)' }}>
                      {totalMktValue.toLocaleString()}
                    </td>
                    <td
                      className="text-right font-mono font-semibold px-3 py-2"
                      style={{ color: totalUnrealPnl >= 0 ? '#10b981' : '#ef4444' }}
                    >
                      {totalUnrealPnl >= 0 ? '+' : ''}
                      {totalUnrealPnl.toLocaleString()}
                    </td>
                    <td colSpan={3} className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Showing {pageRows.length} out of {sorted.length} results
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
