'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  Filter,
  Info,
  Search,
  Settings,
  Upload,
  X,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ReconApiBanner, ReconNavTabs } from '@/components/investments-v2/recon-ui'
import { ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import {
  buildBrokerQueueColumns,
  mapBrokerWorkspace,
  opsErrorMessage,
  requireOpsData,
  type BrokerUiRow,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type ReconStatus = 'Matched' | 'Potential' | 'Exception'
type SideCell = BrokerUiRow['internal']

const statusTone: Record<ReconStatus, string> = {
  Matched: ReconAccent.green,
  Potential: ReconAccent.blue,
  Exception: ReconAccent.amber,
}

export default function BrokerCustodianPage() {
  const [autoMatch, setAutoMatch] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<BrokerUiRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState({ new: 0, potential: 0, matched: 0, exception: 0, escalated: 0, total: 0 })

  const load = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const res = await stockPickerCashApi.getBrokerCustodianWorkspace({ page: p, pageSize: 50 })
      const data = requireOpsData(res, 'broker-custodian workspace')
      const mapped = mapBrokerWorkspace(data)
      setRows(mapped.items)
      setTotal(mapped.total)
      setTotalPages(Math.max(1, mapped.totalPages || 1))
      setCounts(mapped.counts)
      setSelectedId((prev) => prev || mapped.items[0]?.id || '')
    } catch (e) {
      setError(opsErrorMessage(e, 'Unable to load broker & custodian workspace'))
      setRows([])
      setTotal(0)
      setCounts({ new: 0, potential: 0, matched: 0, exception: 0, escalated: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load(page)
  }, [load, page])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      `${r.internal.security} ${r.internal.reference} ${r.broker.reference} ${r.custodian.reference} ${r.detail?.isin ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [rows, search])

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0]
  const queueColumns = useMemo(() => buildBrokerQueueColumns(rows, counts), [rows, counts])
  const matchRate =
    counts.total > 0 ? Math.round((counts.matched / counts.total) * 1000) / 10 : 0
  const completionData = [
    { name: 'done', value: matchRate || 0 },
    { name: 'rest', value: Math.max(0, 100 - (matchRate || 0)) },
  ]

  const runAction = async (kind: 'confirm' | 'escalate' | 'clear') => {
    if (!selected) return
    setBusy(true)
    setActionMsg(null)
    try {
      if (kind === 'confirm') {
        await stockPickerCashApi.confirmBrokerCustodianMatches({ itemIds: [selected.id] })
        setActionMsg('Match confirmed.')
      } else if (kind === 'escalate') {
        await stockPickerCashApi.escalateBrokerCustodianItem(selected.id, { notes: comment || undefined })
        setActionMsg('Item escalated.')
      } else {
        await stockPickerCashApi.clearBrokerCustodianItem(selected.id, {
          reason: comment || 'Cleared from broker-custodian workspace',
        })
        setActionMsg('Item cleared.')
      }
      setComment('')
      await load(page)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Action failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1720px] space-y-4">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Broker & Custodian Reconciliation</h1>
              <Info className="h-4 w-4 shrink-0" style={{ color: C.muted2 }} />
            </div>
            <p className="mt-1.5 text-[13px] leading-snug" style={{ color: C.muted }}>
              Reconcile internal ledger positions with broker and custodian statements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
              <Filter className="h-3.5 w-3.5" style={{ color: C.muted }} />
              Filters
            </button>
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />
        {actionMsg ? <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">{actionMsg}</div> : null}

        <section className="flex flex-wrap items-center gap-2.5">
          <Control icon={<Calendar className="h-3.5 w-3.5" style={{ color: C.muted }} />} value="All dates" wide />
          <Control value="All Accounts" />
          <Control value="All Brokers" />
          <Control value="All Custodians" />
          <Control value="All Currencies" />
          <Control value="All Statuses" />
          <div className="ml-auto flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
              Auto-match
              <button type="button" role="switch" aria-checked={autoMatch} onClick={() => setAutoMatch((v) => !v)} className="relative h-5 w-9 rounded-full transition-colors" style={{ background: autoMatch ? C.blue : C.controlBorder }}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ left: autoMatch ? 18 : 2 }} />
              </button>
            </label>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border" style={{ background: C.control, borderColor: C.controlBorder, color: C.muted }} aria-label="Settings">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={<CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />} iconBg="rgba(34,197,94,0.15)" label="Matched Items" value={String(counts.matched)} amount="—" trend="Live workspace counts" trendColor={C.greenSoft} />
          <Kpi icon={<CircleHelp className="h-4 w-4 text-[#60A5FA]" />} iconBg="rgba(59,130,246,0.15)" label="Unmatched Items (Potential)" value={String(counts.potential)} amount="—" trend="Live workspace counts" trendColor={C.blueLink} />
          <Kpi icon={<AlertTriangle className="h-4 w-4 text-[#FBBF24]" />} iconBg="rgba(245,158,11,0.15)" label="Exceptions" value={String(counts.exception)} amount="—" trend="Live workspace counts" trendColor={C.red} />
          <Kpi icon={<FileText className="h-4 w-4 text-[#C084FC]" />} iconBg="rgba(168,85,247,0.15)" label="New" value={String(counts.new)} amount="—" footer={<span className="text-[12px]" style={{ color: C.muted2 }}>Queue</span>} />
          <Kpi icon={<Building2 className="h-4 w-4 text-[#818CF8]" />} iconBg="rgba(129,140,248,0.15)" label="Escalated" value={String(counts.escalated)} amount="—" footer={<span className="text-[12px]" style={{ color: C.muted2 }}>Queue</span>} />
          <article className="rounded-[12px] border px-3 py-3.5" style={{ background: C.card, borderColor: C.cardBorder }}>
            <p className="text-[11px] font-medium leading-snug" style={{ color: C.muted }}>Reconciliation Completion Rate</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-[76px] w-[76px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={completionData} dataKey="value" innerRadius={24} outerRadius={36} stroke="none" startAngle={90} endAngle={-270}>
                      <Cell fill={ReconAccent.green} />
                      <Cell fill={C.controlBorder} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-[13px] font-semibold tracking-tight">{matchRate || 0}%</span>
                </div>
              </div>
              <p className="text-[12px]" style={{ color: C.muted2 }}>of {counts.total} items</p>
            </div>
          </article>
        </section>

        <section className={cn('grid gap-3', panelOpen ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : 'grid-cols-1')}>
          <div className="min-w-0 space-y-3">
            <article className="overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
              <div className="flex flex-col gap-3 border-b px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: C.rowBorder }}>
                <h2 className="text-[14px] font-semibold">
                  Reconciliation Workspace{' '}
                  <span className="font-normal" style={{ color: C.muted2 }}>({total} items)</span>
                </h2>
                <label className="flex h-9 w-[220px] items-center gap-2 rounded-full border px-3" style={{ background: C.control, borderColor: C.controlBorder }}>
                  <Search className="h-3.5 w-3.5 shrink-0" style={{ color: C.muted2 }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ISIN, Security..." className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#64748B]" style={{ color: C.text }} />
                </label>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <ReconTableSkeleton rows={8} cols={6} className="px-4 py-6" />
                ) : filtered.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[12px]" style={{ color: C.muted2 }}>
                    {error ? 'Unable to load workspace.' : 'No broker/custodian items.'}
                  </p>
                ) : (
                  <div className="grid min-w-[1280px] grid-cols-3">
                    <SideTable title="Internal Ledger" rows={filtered} side="internal" selectedId={selected?.id} onSelect={(id) => { setSelectedId(id); setPanelOpen(true) }} />
                    <SideTable title="Broker Statement" rows={filtered} side="broker" selectedId={selected?.id} onSelect={(id) => { setSelectedId(id); setPanelOpen(true) }} bordered />
                    <SideTable title="Custodian Statement" rows={filtered} side="custodian" selectedId={selected?.id} onSelect={(id) => { setSelectedId(id); setPanelOpen(true) }} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.rowBorder }}>
                <p className="text-[12px]" style={{ color: C.muted2 }}>Page {page} of {totalPages} · {total} items</p>
                <div className="flex flex-wrap items-center gap-1">
                  <PageBtn ariaLabel="Previous" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </PageBtn>
                  <PageBtn ariaLabel="Next" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </PageBtn>
                </div>
              </div>
            </article>

            <section className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
              <h2 className="mb-3.5 text-[14px] font-semibold">
                Reconciliation Queue{' '}
                <span className="font-normal" style={{ color: C.muted2 }}>({counts.total} items)</span>
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {queueColumns.map((col) => (
                  <div key={col.id} className="flex min-h-[220px] flex-col rounded-[12px] border p-2.5" style={{ background: col.tint, borderColor: `${col.accent}55` }}>
                    <div className="mb-2.5 flex items-center gap-2 px-1 pt-0.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: col.accent }} />
                      <span className="truncate text-[12px] font-semibold leading-none">
                        {col.label}{' '}
                        <span className="font-medium tabular-nums" style={{ color: C.muted }}>({col.count})</span>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      {col.cards.length === 0 ? (
                        <p className="px-1 py-4 text-[11px]" style={{ color: C.muted2 }}>Empty</p>
                      ) : (
                        col.cards.map((card) => (
                          <div key={card.id} className="rounded-[10px] border px-3 py-2.5" style={{ background: C.control, borderColor: `${col.accent}38` }}>
                            <p className="truncate text-[12px] font-semibold leading-snug">{card.security}</p>
                            <p className="mt-1 font-mono text-[10px] leading-none" style={{ color: C.muted2 }}>{card.reference}</p>
                            <div className="mt-2.5 flex items-end justify-between gap-2">
                              <p className="text-[11px] leading-none" style={{ color: C.muted2 }}>{card.date}</p>
                              <p className="shrink-0 text-[12px] font-semibold tabular-nums leading-none">USD {card.amount}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button type="button" className="mt-2.5 w-full py-1 text-center text-[11px] font-medium" style={{ color: C.muted2 }}>{col.more}</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {panelOpen && selected ? (
            <div className="xl:sticky xl:top-4 xl:self-start">
              <ExceptionPanel
                row={selected}
                comment={comment}
                onCommentChange={setComment}
                onClose={() => setPanelOpen(false)}
                busy={busy}
                onConfirm={() => void runAction('confirm')}
                onEscalate={() => void runAction('escalate')}
                onClear={() => void runAction('clear')}
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function Control({ value, icon, wide }: { value: string; icon?: ReactNode; wide?: boolean }) {
  return (
    <button type="button" className={cn('inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]', wide && 'min-w-[230px]')} style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
      {icon}
      <span className="truncate">{value}</span>
      <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0" style={{ color: C.muted2 }} />
    </button>
  )
}

function Kpi({
  icon,
  iconBg,
  label,
  value,
  amount,
  trend,
  trendColor,
  footer,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string
  amount: string
  trend?: string
  trendColor?: string
  footer?: ReactNode
}) {
  return (
    <article className="rounded-[12px] border px-3 py-3.5" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ background: iconBg }}>{icon}</span>
        <span className="text-[11px] font-medium leading-snug" style={{ color: C.muted }}>{label}</span>
      </div>
      <p className="mt-2 font-mono text-[18px] font-semibold leading-none">{value}</p>
      <p className="mt-1.5 font-mono text-[11px]" style={{ color: C.muted2 }}>{amount}</p>
      {footer ?? (trend ? <p className="mt-2 text-[11px]" style={{ color: trendColor }}>{trend}</p> : null)}
    </article>
  )
}

function SideTable({
  title,
  rows,
  side,
  selectedId,
  onSelect,
  bordered,
}: {
  title: string
  rows: BrokerUiRow[]
  side: 'internal' | 'broker' | 'custodian'
  selectedId?: string
  onSelect: (id: string) => void
  bordered?: boolean
}) {
  return (
    <div style={bordered ? { borderLeft: `1px solid ${C.rowBorder}`, borderRight: `1px solid ${C.rowBorder}` } : undefined}>
      <div className="border-b px-3 py-2.5 text-[12px] font-semibold" style={{ borderColor: C.rowBorder }}>{title}</div>
      <div className="divide-y" style={{ borderColor: C.rowBorder }}>
        {rows.map((row) => {
          const cell = row[side] as SideCell
          const active = row.id === selectedId
          return (
            <button
              key={`${side}-${row.id}`}
              type="button"
              onClick={() => onSelect(row.id)}
              className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
              style={{ background: active ? 'rgba(59,130,246,0.08)' : 'transparent', borderBottom: `1px solid ${C.rowBorder}` }}
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium">{cell.security}</p>
                <p className="mt-0.5 font-mono text-[10px]" style={{ color: C.blueLink }}>{cell.reference}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: C.muted2 }}>{cell.date}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold tabular-nums">{cell.amount == null ? '—' : `USD ${cell.amount}`}</p>
                {cell.status ? (
                  <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: statusTone[cell.status], background: `${statusTone[cell.status]}22` }}>
                    {cell.status}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PageBtn({ children, active, disabled, onClick, ariaLabel }: { children: ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] disabled:opacity-30"
      style={active ? { background: C.blue, color: '#fff' } : { color: C.muted }}
    >
      {children}
    </button>
  )
}

function ExceptionPanel({
  row,
  comment,
  onCommentChange,
  onClose,
  busy,
  onConfirm,
  onEscalate,
  onClear,
}: {
  row: BrokerUiRow
  comment: string
  onCommentChange: (v: string) => void
  onClose: () => void
  busy: boolean
  onConfirm: () => void
  onEscalate: () => void
  onClear: () => void
}) {
  const detail = row.detail
  const sides: { label: string; cell: SideCell }[] = [
    { label: 'Internal Ledger', cell: row.internal },
    { label: 'Broker Statement', cell: row.broker },
    { label: 'Custodian Statement', cell: row.custodian },
  ]

  return (
    <aside className="flex max-h-[920px] flex-col overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.rowBorder }}>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}>
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-[14px] font-semibold">Exception Details</h3>
        </div>
        <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ color: C.muted }} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[16px] font-semibold">{row.internal.security}</h4>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium" style={{ color: statusTone[row.overallStatus], borderColor: `${statusTone[row.overallStatus]}66`, background: `${statusTone[row.overallStatus]}18` }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusTone[row.overallStatus] }} />
            {row.overallStatus}
          </span>
        </div>

        <div className="space-y-2.5">
          {sides.map(({ label, cell }) => (
            <div key={label} className="rounded-[10px] border px-3 py-2.5" style={{ background: C.control, borderColor: C.controlBorder }}>
              <p className="text-[11px]" style={{ color: C.muted2 }}>{label}</p>
              <div className="mt-1 flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px]" style={{ color: C.blueLink }}>{cell.reference}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: C.muted }}>{cell.date}</p>
                </div>
                <p className="text-[12px] font-semibold tabular-nums">{cell.amount == null ? '—' : `USD ${cell.amount}`}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[10px] border px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.35)' }}>
          <p className="text-[11px]" style={{ color: C.muted }}>Difference</p>
          <p className="mt-0.5 text-[15px] font-semibold" style={{ color: '#F87171' }}>USD {detail?.differenceUsd ?? row.difference}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]">
          {[
            ['ISIN', detail?.isin ?? '—'],
            ['Currency', detail?.currency ?? 'USD'],
            ['Quantity', detail?.quantity ?? '—'],
            ['Price', detail?.price ?? '—'],
            ['Trade Date', detail?.tradeDate ?? '—'],
            ['Settle Date', detail?.settleDate ?? '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px]" style={{ color: C.muted2 }}>{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={2}
          placeholder="Add a comment / reason..."
          className="w-full resize-none rounded-[10px] border px-3 py-2 text-[12px] outline-none"
          style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
        />
      </div>

      <div className="space-y-2 border-t px-4 py-4" style={{ borderColor: C.rowBorder }}>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={onConfirm} className="inline-flex h-9 flex-1 items-center justify-center rounded-full px-3 text-[12px] font-medium text-white disabled:opacity-50" style={{ background: '#2563EB' }}>
            Match
          </button>
          <button type="button" disabled={busy} onClick={onEscalate} className="inline-flex h-9 flex-1 items-center justify-center rounded-full px-3 text-[12px] font-medium text-white disabled:opacity-50" style={{ background: '#D97706' }}>
            Escalate
          </button>
        </div>
        <button type="button" disabled={busy} onClick={onClear} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-medium text-white disabled:opacity-50" style={{ background: '#059669' }}>
          <Check className="h-4 w-4" />
          Mark Cleared
        </button>
      </div>
    </aside>
  )
}
