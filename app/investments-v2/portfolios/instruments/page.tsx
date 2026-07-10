'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Search, Loader2, ChevronDown } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchInstrumentTypes, fetchInstruments } from '@/lib/store/slices/investmentOpsSlice'

const EXCHANGES = ['All', 'ZSE', 'VFEX', 'SECZIM', 'NASDAQ', 'NYSE'] as const
const PAGE_SIZE = 12

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

export default function InstrumentsPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { instruments, instrumentsLoading, instrumentsTotal, instrumentTypes } = useAppSelector((s) => s.investmentOps)

  const [exchange, setExchange] = useState<(typeof EXCHANGES)[number]>('All')
  const [type, setType] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchInstrumentTypes())
  }, [dispatch])

  useEffect(() => {
    dispatch(
      fetchInstruments({
        exchange: exchange === 'All' ? undefined : exchange,
        type: type === 'All' ? undefined : type,
        status: 'APPROVED',
        page,
        pageSize: PAGE_SIZE,
      })
    )
  }, [dispatch, exchange, type, page])

  useEffect(() => {
    setPage(1)
  }, [exchange, type])

  const filtered = search.trim()
    ? instruments.filter(
        (i) =>
          i.ticker.toLowerCase().includes(search.toLowerCase()) ||
          i.fullName.toLowerCase().includes(search.toLowerCase()) ||
          i.instrumentCode.toLowerCase().includes(search.toLowerCase())
      )
    : instruments

  const totalPages = Math.max(1, Math.ceil(instrumentsTotal / PAGE_SIZE))
  const uniqueExchanges = new Set(instruments.map((i) => i.exchangeCode)).size
  const uniqueCurrencies = new Set(instruments.map((i) => i.listingCurrencyCode)).size

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Instruments" />
      <PortfoliosSubNav />

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Instruments', value: instrumentsTotal },
            { label: 'On This Page', value: instruments.length },
            { label: 'Exchanges Covered', value: uniqueExchanges },
            { label: 'Currencies Covered', value: uniqueCurrencies },
          ].map((s) => (
            <div key={s.label} className="arcus-card px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {s.label}
              </div>
              <div className="text-lg font-semibold font-mono" style={{ color: 'var(--foreground)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Exchange + type filters + search */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {EXCHANGES.map((ex) => (
                <button key={ex} onClick={() => setExchange(ex)} className={cn('cat-pill', exchange === ex && 'active')}>
                  {ex}
                </button>
              ))}
            </div>
            <div className="relative inline-flex">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="sort-pill text-[11px] appearance-none pr-5 cursor-pointer"
                style={{ background: 'transparent' }}
              >
                <option value="All">All Types</option>
                {instrumentTypes.map((t) => (
                  <option key={t.id} value={t.typeCode}>
                    {t.displayName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" />
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter this page..."
              className="bg-transparent text-xs outline-none w-44"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Instruments table card */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
              Instrument Master
            </span>
            {instrumentsLoading && <Spinner />}
          </div>
          <div className="overflow-x-auto">
            {instrumentsLoading && instruments.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                No instruments found{search ? ` matching "${search}"` : ''}.
              </div>
            ) : (
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Ticker</th>
                    <th>Full Name</th>
                    <th>Exchange</th>
                    <th>Type</th>
                    <th>Sector</th>
                    <th>Industry</th>
                    <th>Currency</th>
                    <th>Valuation Method</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inst) => (
                    <tr
                      key={inst.id}
                      className={cn('cursor-pointer', !inst.listedEquitySecurityId && 'cursor-default')}
                      onClick={() =>
                        inst.listedEquitySecurityId &&
                        router.push(`/investments-v2/portfolios/prices?securityId=${inst.listedEquitySecurityId}`)
                      }
                    >
                      <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {inst.instrumentCode}
                      </td>
                      <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                        {inst.ticker}
                      </td>
                      <td style={{ color: 'var(--foreground)' }}>{inst.fullName}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{inst.exchangeCode}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{inst.instrumentTypeCode}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{inst.sector ?? '—'}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{inst.industry ?? '—'}</td>
                      <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {inst.listingCurrencyCode}
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{inst.valuationMethod}</td>
                      <td>
                        <StatusBadge status={inst.status.toLowerCase()} />
                      </td>
                      <td>
                        {inst.listedEquitySecurityId && (
                          <span className="text-[10px] hover:underline" style={{ color: '#3b82f6' }}>
                            View Prices
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Server-side pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Page {page} of {totalPages} · {instrumentsTotal} instruments
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
