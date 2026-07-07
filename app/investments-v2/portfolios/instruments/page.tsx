'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { SecurityFormDialog } from '@/components/investments-v2/security-form-dialog'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Search, Loader2, Plus, Pencil } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchSecurities } from '@/lib/store/slices/investmentsSlice'
import { useRolePermissions } from '@/lib/hooks/useRolePermissions'
import type { Security } from '@/lib/api/investments-api'

const EXCHANGES = ['All', 'ZSE', 'VFEX', 'SECZIM', 'NASDAQ', 'NYSE'] as const

const PAGE_SIZE = 12

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
}

export default function InstrumentsPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { securities, securitiesLoading } = useAppSelector((s) => s.investments)
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess('investments', 'investments-portfolios-instruments')

  const [exchange, setExchange] = useState<(typeof EXCHANGES)[number]>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Security | null>(null)

  const openAdd = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }
  const openEdit = (e: React.MouseEvent, sec: Security) => {
    e.stopPropagation()
    setEditTarget(sec)
    setDialogOpen(true)
  }

  useEffect(() => {
    dispatch(fetchSecurities(exchange === 'All' ? undefined : { exchange }))
  }, [dispatch, exchange])

  useEffect(() => {
    setPage(1)
  }, [exchange, search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return securities
    return securities.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    )
  }, [securities, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const uniqueExchanges = useMemo(() => new Set(securities.map((s) => s.exchangeCode)).size, [securities])
  const uniqueCurrencies = useMemo(() => new Set(securities.map((s) => s.listingCurrencyCode)).size, [securities])
  const activeCount = useMemo(() => securities.filter((s) => s.isActive).length, [securities])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Instruments"
        actions={
          isAdmin ? (
            <button
              onClick={openAdd}
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
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Securities', value: securities.length },
            { label: 'Active', value: activeCount },
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

        {/* Exchange filter + search */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {EXCHANGES.map((ex) => (
              <button key={ex} onClick={() => setExchange(ex)} className={cn('cat-pill', exchange === ex && 'active')}>
                {ex}
              </button>
            ))}
          </div>
          <div
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol or name..."
              className="bg-transparent text-xs outline-none w-44"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Instruments table card */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
              Securities Master
            </span>
            {securitiesLoading && <Spinner />}
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
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Exchange</th>
                    <th>Currency</th>
                    <th>ISIN</th>
                    <th>Status</th>
                    <th>Listed</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((sec) => (
                    <tr
                      key={sec.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/investments-v2/portfolios/prices?securityId=${sec.id}`)}
                    >
                      <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                        {sec.symbol}
                      </td>
                      <td style={{ color: 'var(--foreground)' }}>{sec.name}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{sec.exchangeCode}</td>
                      <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {sec.listingCurrencyCode}
                      </td>
                      <td className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {sec.isin ?? '—'}
                      </td>
                      <td>
                        <StatusBadge status={sec.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {sec.createdAt ? new Date(sec.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] hover:underline" style={{ color: '#3b82f6' }}>
                            View Prices
                          </span>
                          {isAdmin && (
                            <button
                              onClick={(e) => openEdit(e, sec)}
                              className="opacity-60 hover:opacity-100"
                              style={{ color: 'var(--muted-foreground)' }}
                              title="Edit security"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
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

      <SecurityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        onSaved={() => dispatch(fetchSecurities(exchange === 'All' ? undefined : { exchange }))}
      />
    </div>
  )
}
