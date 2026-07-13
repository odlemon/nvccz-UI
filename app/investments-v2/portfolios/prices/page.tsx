'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { SecurityFormDialog } from '@/components/investments-v2/security-form-dialog'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { RefreshCw, Search, Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchSecurities, fetchLatestPrices, fetchSecurityPriceHistory } from '@/lib/store/slices/investmentsSlice'
import { fetchIngestBatches, fetchIngestBatchDetail } from '@/lib/store/slices/investmentOpsSlice'
import { priceChange, type Security } from '@/lib/api/investments-api'
import { useRolePermissions } from '@/lib/hooks/useRolePermissions'

const EXCHANGES = ['All', 'ZSE', 'VFEX', 'SECZIM', 'NASDAQ', 'NYSE'] as const
const PAGE_SIZE = 12
const VIEWS = ['prices', 'batches'] as const

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

export default function PricesPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusedSecurityId = searchParams.get('securityId')

  const { securities, securitiesLoading, latestPrices, pricesLoading, priceHistoryCache, priceHistoryLoadingIds } =
    useAppSelector((s) => s.investments)
  const { ingestBatches, ingestBatchesLoading, ingestBatchDetail, ingestBatchDetailLoading } = useAppSelector(
    (s) => s.investmentOps
  )
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess('investments', 'investments-portfolios-prices')

  const [view, setView] = useState<(typeof VIEWS)[number]>('prices')
  const [exchange, setExchange] = useState<(typeof EXCHANGES)[number]>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
  }, [dispatch])

  useEffect(() => {
    if (view === 'batches') dispatch(fetchIngestBatches())
  }, [dispatch, view])

  const toggleBatch = (id: string) => {
    if (expandedBatchId === id) {
      setExpandedBatchId(null)
      return
    }
    setExpandedBatchId(id)
    dispatch(fetchIngestBatchDetail(id))
  }

  // Auto-expand the security passed via ?securityId= (e.g. linked from Instruments)
  useEffect(() => {
    if (focusedSecurityId) {
      setExpandedId(focusedSecurityId)
      dispatch(fetchSecurityPriceHistory(focusedSecurityId))
    }
  }, [dispatch, focusedSecurityId])

  useEffect(() => {
    setPage(1)
  }, [exchange, search])

  const toggleExpand = (sec: Security) => {
    if (expandedId === sec.id) {
      setExpandedId(null)
      if (focusedSecurityId) router.push('/investments-v2/portfolios/prices')
      return
    }
    setExpandedId(sec.id)
    if (!priceHistoryCache[sec.id]) dispatch(fetchSecurityPriceHistory(sec.id))
  }

  const rows = useMemo(() => {
    return securities
      .filter((s) => exchange === 'All' || s.exchangeCode === exchange)
      .map((sec) => {
        const tick = latestPrices[sec.symbol] ?? latestPrices[sec.id]
        const change = priceChange(tick)
        return { security: sec, tick, change }
      })
  }, [securities, latestPrices, exchange])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.security.symbol.toLowerCase().includes(q) || r.security.name.toLowerCase().includes(q)
    )
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pricedCount = rows.filter((r) => r.tick).length
  const liveCount = rows.filter((r) => r.tick?.tickFrequency === 'LIVE').length
  const staleCount = rows.filter((r) => {
    if (!r.tick) return false
    const ageMs = Date.now() - new Date(r.tick.pricedAt).getTime()
    return ageMs > 1000 * 60 * 60 * 24 * 2 // >2 days old
  }).length
  const lastBatchAt = rows.reduce<string | null>((latest, r) => {
    if (!r.tick) return latest
    if (!latest || new Date(r.tick.pricedAt) > new Date(latest)) return r.tick.pricedAt
    return latest
  }, null)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Prices"
        actions={
          isAdmin ? (
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: '#2563eb' }}
            >
              <Plus className="w-3.5 h-3.5" /> New Security
            </button>
          ) : undefined
        }
      />
      <PortfoliosSubNav />

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">
        {/* View toggle */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setView('prices')} className={cn('cat-pill', view === 'prices' && 'active')}>
            Latest Prices
          </button>
          <button onClick={() => setView('batches')} className={cn('cat-pill', view === 'batches' && 'active')}>
            Ingest Batches
          </button>
        </div>

        {view === 'batches' ? (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
                Ingest Batches
              </span>
              {ingestBatchesLoading && <Spinner />}
            </div>
            <div className="overflow-x-auto">
              {ingestBatchesLoading && ingestBatches.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner />
                </div>
              ) : ingestBatches.length === 0 ? (
                <div className="py-10 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                  No ingest batches available.
                </div>
              ) : (
                <table className="arcus-table">
                  <thead>
                    <tr>
                      <th />
                      <th>Source Type</th>
                      <th>Source Code</th>
                      <th>As Of</th>
                      <th className="text-right">Records</th>
                      <th>Status</th>
                      <th>Source Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingestBatches.map((batch) => {
                      const isExpanded = expandedBatchId === batch.id
                      return (
                        <Fragment key={batch.id}>
                          <tr className={cn('cursor-pointer', isExpanded && 'bg-[#3b82f614]')} onClick={() => toggleBatch(batch.id)}>
                            <td className="w-6">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                              )}
                            </td>
                            <td style={{ color: 'var(--foreground)' }}>{batch.sourceType}</td>
                            <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                              {batch.sourceCode}
                            </td>
                            <td style={{ color: 'var(--muted-foreground)' }}>{new Date(batch.asOfDate).toLocaleDateString()}</td>
                            <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                              {batch.recordCount.toLocaleString()}
                            </td>
                            <td>
                              <StatusBadge status={batch.status === 'COMPLETED' ? 'active' : 'pending'} />
                            </td>
                            <td>
                              <StatusBadge status={batch.sourceStatus === 'OK' ? 'active' : 'stale'} />
                            </td>
                            <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                              {new Date(batch.createdAt).toLocaleString()}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <div
                                  className="px-6 py-3 space-y-2"
                                  style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid var(--border)' }}
                                >
                                  {ingestBatchDetailLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Spinner />
                                    </div>
                                  ) : ingestBatchDetail?.batch.id !== batch.id ? (
                                    <div className="py-3 text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                      Loading batch detail…
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-4 text-[11px]">
                                        <span style={{ color: 'var(--muted-foreground)' }}>
                                          Checksum:{' '}
                                          <span style={{ color: ingestBatchDetail.checksumValid ? '#10b981' : '#ef4444' }}>
                                            {ingestBatchDetail.checksumValid ? 'Valid' : 'Mismatch'}
                                          </span>
                                        </span>
                                        <span className="font-mono truncate" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
                                          {batch.sha256Checksum}
                                        </span>
                                      </div>
                                      <table className="arcus-table">
                                        <thead>
                                          <tr>
                                            <th>Symbol</th>
                                            <th className="text-right">Price</th>
                                            <th className="text-right">Prev Close</th>
                                            <th className="text-right">Deviation %</th>
                                            <th>Validation</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {ingestBatchDetail.batch.priceTicks.map((tick) => (
                                            <tr key={tick.id}>
                                              <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                                                {tick.security.symbol}
                                              </td>
                                              <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                                                {Number(tick.price).toFixed(4)}
                                              </td>
                                              <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                                {tick.previousClose != null ? Number(tick.previousClose).toFixed(4) : '—'}
                                              </td>
                                              <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                                {tick.deviationPct != null ? `${(Number(tick.deviationPct) * 100).toFixed(2)}%` : '—'}
                                              </td>
                                              <td>
                                                <StatusBadge status={tick.validationStatus} />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <>
        {/* Status strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Instruments Priced', value: pricedCount, color: 'var(--foreground)' },
            { label: 'Live Ticks', value: liveCount, color: '#10b981' },
            { label: 'Stale (>2 days)', value: staleCount, color: staleCount > 0 ? '#f59e0b' : '#10b981' },
            {
              label: 'Last Batch',
              value: lastBatchAt ? new Date(lastBatchAt).toLocaleString() : '—',
              color: '#3b82f6',
            },
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

        {/* Exchange filter + search + refresh */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {EXCHANGES.map((ex) => (
              <button key={ex} onClick={() => setExchange(ex)} className={cn('cat-pill', exchange === ex && 'active')}>
                {ex}
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
                placeholder="Filter by symbol or name..."
                className="bg-transparent text-xs outline-none w-44"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            <button
              onClick={() => dispatch(fetchLatestPrices())}
              disabled={pricesLoading}
              className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: '#2563eb' }}
            >
              <RefreshCw className={cn('w-3 h-3', pricesLoading && 'animate-spin')} />
              {pricesLoading ? 'Fetching...' : 'Refresh Prices'}
            </button>
          </div>
        </div>

        {/* Latest prices — collapsible accordion table */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
              Latest Market Prices
            </span>
            {(securitiesLoading || pricesLoading) && <Spinner />}
          </div>
          <div className="overflow-x-auto">
            {securitiesLoading && securities.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : pageRows.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                No securities found{search ? ` matching "${search}"` : ''}.
              </div>
            ) : (
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th />
                    <th>Ticker</th>
                    <th>Name / Exchange</th>
                    <th>CCY</th>
                    <th className="text-right">Prev Close</th>
                    <th className="text-right">Current Price</th>
                    <th className="text-right">Change</th>
                    <th className="text-right">Change %</th>
                    <th>Validation</th>
                    <th>Source</th>
                    <th>Priced At</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ security: sec, tick, change }) => {
                    const isExpanded = expandedId === sec.id
                    const history = priceHistoryCache[sec.id] ?? []
                    const historyLoading = !!priceHistoryLoadingIds[sec.id]
                    return (
                      <Fragment key={sec.id}>
                        <tr
                          className={cn('cursor-pointer', isExpanded && 'bg-[#3b82f614]')}
                          onClick={() => toggleExpand(sec)}
                        >
                          <td className="w-6">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                            )}
                          </td>
                          <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                            {sec.symbol}
                          </td>
                          <td>
                            <div className="flex flex-col leading-tight">
                              <span style={{ color: 'var(--foreground)' }}>{sec.name}</span>
                              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                {sec.exchangeCode}
                              </span>
                            </div>
                          </td>
                          <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {sec.listingCurrencyCode}
                          </td>
                          <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {change.prevClose != null ? change.prevClose.toFixed(4) : '—'}
                          </td>
                          <td className="text-right font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                            {change.price != null ? change.price.toFixed(4) : '—'}
                          </td>
                          <td
                            className="text-right font-mono"
                            style={{
                              color: change.abs == null ? 'var(--muted-foreground)' : change.abs >= 0 ? '#10b981' : '#ef4444',
                            }}
                          >
                            {change.abs != null ? `${change.abs >= 0 ? '+' : ''}${change.abs.toFixed(4)}` : '—'}
                          </td>
                          <td
                            className="text-right font-mono"
                            style={{
                              color: change.pct == null ? 'var(--muted-foreground)' : change.pct >= 0 ? '#10b981' : '#ef4444',
                            }}
                          >
                            {change.pct != null ? `${change.pct >= 0 ? '+' : ''}${change.pct.toFixed(2)}%` : '—'}
                          </td>
                          <td>{tick ? <StatusBadge status={tick.validationStatus} /> : '—'}</td>
                          <td>{tick ? <StatusBadge status={tick.sourceStatus === 'OK' ? 'active' : 'stale'} /> : '—'}</td>
                          <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                            {tick ? new Date(tick.pricedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${sec.id}-history`}>
                            <td colSpan={11} className="p-0">
                              <div
                                className="px-6 py-3"
                                style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid var(--border)' }}
                              >
                                {historyLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Spinner />
                                  </div>
                                ) : history.length === 0 ? (
                                  <div className="py-3 text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                    No price history available for {sec.symbol}.
                                  </div>
                                ) : (
                                  <table className="arcus-table">
                                    <thead>
                                      <tr>
                                        <th>Priced At</th>
                                        <th>Price Type</th>
                                        <th className="text-right">Price</th>
                                        <th className="text-right">Prev Close</th>
                                        <th className="text-right">Deviation %</th>
                                        <th>Frequency</th>
                                        <th>Validation</th>
                                        <th>Source</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {history.map((h) => (
                                        <tr key={h.id}>
                                          <td className="font-mono text-[11px]" style={{ color: 'var(--foreground)' }}>
                                            {new Date(h.pricedAt).toLocaleString()}
                                          </td>
                                          <td style={{ color: 'var(--muted-foreground)' }}>{h.priceType}</td>
                                          <td className="text-right font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                                            {Number(h.price).toFixed(4)}
                                          </td>
                                          <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                            {h.previousClose != null ? Number(h.previousClose).toFixed(4) : '—'}
                                          </td>
                                          <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                            {h.deviationPct != null ? `${Number(h.deviationPct).toFixed(2)}%` : '—'}
                                          </td>
                                          <td style={{ color: 'var(--muted-foreground)' }}>{h.tickFrequency}</td>
                                          <td>
                                            <StatusBadge status={h.validationStatus} />
                                          </td>
                                          <td>
                                            <StatusBadge status={h.sourceStatus === 'OK' ? 'active' : 'stale'} />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredRows.length > PAGE_SIZE && (
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Showing {pageRows.length} out of {filteredRows.length} results
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
          </>
        )}
      </div>

      <SecurityFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editTarget={null} onSaved={() => dispatch(fetchSecurities())} />
    </div>
  )
}
