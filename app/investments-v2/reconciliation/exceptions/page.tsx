'use client'

import { type ReactNode, useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Columns3,
  FilePenLine,
  Lock,
  Search,
  Send,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { ReconApiBanner, ReconNavTabs } from '@/components/investments-v2/recon-ui'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import {
  mapExceptionTimeline,
  mapExceptions,
  mapExceptionsSummary,
  opsErrorMessage,
  requireOpsData,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type ExceptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
type ExceptionStatus = 'Pending Approval' | 'Investigating' | 'Overdue'
type ExceptionRow = ReturnType<typeof mapExceptions>['items'][number]
type TimelineItem = ReturnType<typeof mapExceptionTimeline>[number]
type PanelTab = 'Timeline' | 'Comments' | 'Attachments' | 'Audit Trail'

const severityStyle: Record<ExceptionSeverity, { bg: string; color: string; border: string }> = {
  Critical: { bg: 'rgba(244,63,94,0.12)', color: ReconAccent.redSoft, border: 'rgba(244,63,94,0.28)' },
  High: { bg: 'rgba(245,158,11,0.12)', color: ReconAccent.amberSoft, border: 'rgba(245,158,11,0.28)' },
  Medium: { bg: 'rgba(234,179,8,0.12)', color: '#FACC15', border: 'rgba(234,179,8,0.28)' },
  Low: { bg: 'rgba(34,197,94,0.12)', color: ReconAccent.greenSoft, border: 'rgba(34,197,94,0.28)' },
}

const statusStyle: Record<ExceptionStatus, { bg: string; color: string; border: string }> = {
  'Pending Approval': { bg: 'rgba(245,158,11,0.08)', color: ReconAccent.amberSoft, border: 'rgba(245,158,11,0.45)' },
  Investigating: { bg: 'rgba(59,130,246,0.08)', color: ReconAccent.blueSoft, border: 'rgba(59,130,246,0.45)' },
  Overdue: { bg: 'rgba(244,63,94,0.08)', color: ReconAccent.redSoft, border: 'rgba(244,63,94,0.45)' },
}

const ageColor = (severity: ExceptionSeverity) => severityStyle[severity].color

export default function ExceptionsApprovalsPage() {
  const [selectedId, setSelectedId] = useState('')
  const [page, setPage] = useState(1)
  const [panelTab, setPanelTab] = useState<PanelTab>('Timeline')
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState<'approve' | 'info' | 'reject' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<ExceptionRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState(mapExceptionsSummary(null))
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [search, setSearch] = useState('')
  const pageSize = 20

  const loadList = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, sumRes] = await Promise.all([
        stockPickerCashApi.listExceptions({ page: p, pageSize }),
        stockPickerCashApi.getExceptionsSummary().catch(() => null),
      ])
      const listData = requireOpsData(listRes, 'exceptions')
      const mapped = mapExceptions(listData)
      setRows(mapped.items)
      setTotal(mapped.total)
      setTotalPages(Math.max(1, mapped.totalPages || 1))
      setSelectedId((prev) => prev || mapped.items[0]?.id || '')
      if (sumRes?.success && sumRes.data) {
        setSummary(mapExceptionsSummary(requireOpsData(sumRes, 'exceptions summary') as Record<string, unknown>))
      } else {
        setSummary(mapExceptionsSummary(null))
      }
    } catch (e) {
      setError(opsErrorMessage(e, 'Unable to load exceptions'))
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void loadList(page)
  }, [loadList, page])

  useEffect(() => {
    if (!selectedId) {
      setTimeline([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await stockPickerCashApi.getExceptionTimeline(selectedId)
        if (cancelled) return
        const data = (res as { success?: boolean; data?: unknown })?.data ?? res
        setTimeline(mapExceptionTimeline(data))
      } catch {
        if (!cancelled) setTimeline([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase()
    if (!q) return true
    return `${r.id} ${r.account} ${r.client} ${r.reason} ${r.title}`.toLowerCase().includes(q)
  })
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0]
  const canSubmit = decision !== null && !!selected && !busy

  const submitDecision = async () => {
    if (!selected || !decision) return
    setBusy(true)
    setActionMsg(null)
    try {
      const version = selected.version
      if (decision === 'approve') {
        await stockPickerCashApi.approveException(selected.id, { expectedVersion: version })
      } else if (decision === 'reject') {
        await stockPickerCashApi.rejectException(selected.id, {
          reason: notes || 'Rejected from exceptions screen',
          expectedVersion: version,
        })
      } else {
        await stockPickerCashApi.requestExceptionInfo(selected.id, {
          notes: notes || 'Additional information requested',
          expectedVersion: version,
        })
      }
      setActionMsg('Decision submitted.')
      setDecision(null)
      setNotes('')
      await loadList(page)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Submit decision failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1680px] space-y-4">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Reconciliation Exceptions & Approvals</h1>
              <span className="inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium" style={{ background: C.muted, borderColor: C.cardBorder, color: C.muted }}>
                Stock Picker
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug" style={{ color: C.muted }}>
              Identify, investigate and resolve reconciliation exceptions requiring analyst action.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
              <Calendar className="h-3.5 w-3.5" style={{ color: C.muted }} />
              <span>All dates</span>
              <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
            </button>
            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
              <Upload className="h-3.5 w-3.5" style={{ color: C.muted }} />
              Export
              <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
            </button>
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />
        {actionMsg ? <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">{actionMsg}</div> : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<ShieldAlert className="h-4 w-4 text-[#FB7185]" />} iconBg="rgba(244,63,94,0.15)" label="Critical / High" value={String(summary.critical)} amount={`USD ${summary.criticalAmount}`} trend={`Open ${summary.open ?? 0}`} trendColor="#FB7185" />
          <KpiCard icon={<Clock3 className="h-4 w-4 text-[#FBBF24]" />} iconBg="rgba(245,158,11,0.15)" label="Overdue Approvals" value={String(summary.overdue)} amount={`USD ${summary.overdueAmount}`} trend="From exceptions summary" trendColor="#FB7185" />
          <KpiCard icon={<FilePenLine className="h-4 w-4 text-[#FACC15]" />} iconBg="rgba(234,179,8,0.15)" label="Pending Adjustments" value={String(summary.pending)} amount={`USD ${summary.pendingAmount}`} trend={`Investigating ${summary.investigating ?? 0}`} trendColor="#FBBF24" />
          <KpiCard icon={<Send className="h-4 w-4 text-[#4ADE80]" />} iconBg="rgba(34,197,94,0.15)" label="Straight-Through Match Rate" value={summary.stpRate} trend="From summary when provided" trendColor="#4ADE80" />
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <article className="overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.rowBorder }}>
              <h2 className="text-[14px] font-semibold">Exceptions ({total})</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-9 w-[220px] items-center gap-2 rounded-full border px-3" style={{ background: C.control, borderColor: C.controlBorder }}>
                  <Search className="h-3.5 w-3.5 shrink-0" style={{ color: C.muted2 }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exceptions..." className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#64748B]" style={{ color: C.text }} />
                </label>
                <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
                  <Columns3 className="h-3.5 w-3.5" style={{ color: C.muted }} />
                  Columns
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-[12px]">
                <thead>
                  <tr style={{ color: C.muted2, borderBottom: `1px solid ${C.rowBorder}` }}>
                    {['Severity', 'Account', 'Client', 'Source', 'Exception Reason', 'Amount Difference', 'Age', 'Assigned To', 'Status'].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-[11px] font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3.5 py-10 text-center text-[12px]" style={{ color: C.muted2 }}>
                        {error ? 'Unable to load exceptions.' : 'No exceptions found.'}
                      </td>
                    </tr>
                  ) : null}
                  {filtered.map((row) => {
                    const active = row.id === selected?.id
                    const sev = severityStyle[row.severity]
                    const st = statusStyle[row.status]
                    return (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedId(row.id)
                          setDecision(null)
                        }}
                        className="cursor-pointer border-b transition-colors"
                        style={{ borderColor: C.rowBorder, background: active ? 'rgba(59,130,246,0.08)' : 'transparent' }}
                      >
                        <td className="px-3.5 py-3">
                          <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}>
                            {row.severity}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[11px]" style={{ color: C.blueLink }}>{row.account}</td>
                        <td className="px-3.5 py-3 whitespace-nowrap">{row.client}</td>
                        <td className="px-3.5 py-3" style={{ color: C.muted }}>{row.source}</td>
                        <td className="px-3.5 py-3 whitespace-nowrap">{row.reason}</td>
                        <td className="px-3.5 py-3">
                          <p className="font-medium whitespace-nowrap">USD {row.diffUsd}</p>
                          <p className="mt-0.5 text-[11px] whitespace-nowrap" style={{ color: C.muted2 }}>ZWL {row.diffZwl}</p>
                        </td>
                        <td className="px-3.5 py-3 font-medium" style={{ color: ageColor(row.severity) }}>{row.ageDays}d</td>
                        <td className="px-3.5 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.assignee}</td>
                        <td className="px-3.5 py-3">
                          <span className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.rowBorder }}>
              <p className="text-[12px]" style={{ color: C.muted2 }}>Page {page} of {totalPages} · {total} exceptions</p>
              <div className="flex items-center gap-1">
                <PageBtn ariaLabel="Previous" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PageBtn>
                <PageBtn ariaLabel="Next" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </PageBtn>
              </div>
            </div>
          </article>

          {selected ? (
            <DetailPanel
              row={selected}
              panelTab={panelTab}
              onTabChange={setPanelTab}
              notes={notes}
              onNotesChange={setNotes}
              decision={decision}
              onDecision={setDecision}
              canSubmit={canSubmit}
              timeline={timeline}
              onSubmit={() => void submitDecision()}
              busy={busy}
            />
          ) : (
            <article className="flex items-center justify-center rounded-[12px] border p-8 text-[12px]" style={{ background: C.card, borderColor: C.cardBorder, color: C.muted2 }}>
              Select an exception to review.
            </article>
          )}
        </section>
      </div>
    </main>
  )
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  amount,
  trend,
  trendColor,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string
  amount?: string
  trend: string
  trendColor: string
}) {
  return (
    <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ background: iconBg }}>{icon}</span>
        <span className="text-[12px] font-medium" style={{ color: C.muted }}>{label}</span>
      </div>
      <p className="mt-3 font-mono text-[18px] font-semibold leading-none">{value}</p>
      {amount ? <p className="mt-1.5 font-mono text-[11px]" style={{ color: C.muted2 }}>{amount}</p> : null}
      <p className="mt-3 text-[11px]" style={{ color: trendColor }}>{trend}</p>
    </article>
  )
}

function PageBtn({ children, active, disabled, onClick, ariaLabel }: { children: ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void; ariaLabel?: string }) {
  return (
    <button type="button" aria-label={ariaLabel} disabled={disabled} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] disabled:opacity-30" style={active ? { background: C.blue, color: '#fff' } : { color: C.muted }}>
      {children}
    </button>
  )
}

function DetailPanel({
  row,
  panelTab,
  onTabChange,
  notes,
  onNotesChange,
  decision,
  onDecision,
  canSubmit,
  timeline,
  onSubmit,
  busy,
}: {
  row: ExceptionRow
  panelTab: PanelTab
  onTabChange: (t: PanelTab) => void
  notes: string
  onNotesChange: (v: string) => void
  decision: 'approve' | 'info' | 'reject' | null
  onDecision: (d: 'approve' | 'info' | 'reject' | null) => void
  canSubmit: boolean
  timeline: TimelineItem[]
  onSubmit: () => void
  busy: boolean
}) {
  const sev = severityStyle[row.severity]
  const st = statusStyle[row.status]
  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'Timeline', label: 'Timeline' },
    { id: 'Comments', label: 'Comments' },
    { id: 'Attachments', label: 'Attachments' },
    { id: 'Audit Trail', label: 'Audit Trail' },
  ]

  return (
    <aside className="flex flex-col overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="border-b px-4 py-4" style={{ borderColor: C.rowBorder }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}>{row.severity}</span>
          <span className="inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px]" style={{ background: C.muted, borderColor: C.cardBorder, color: C.muted }}>{row.id}</span>
          <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ background: st.bg, color: st.color, borderColor: st.border }}>{row.status}</span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold leading-tight">{row.title}</h3>
            <p className="mt-1 text-[12px]" style={{ color: C.muted }}>{row.account} • {row.client}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[16px] font-semibold leading-tight">USD {row.diffUsd}</p>
            <p className="mt-1 text-[12px]" style={{ color: C.muted2 }}>ZWL {row.diffZwl}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
          {[
            ['Source', row.source],
            ['Custodian', row.custodian],
            ['Instrument', row.instrument],
            ['Quantity', row.quantity],
            ['Trade Date', row.tradeDate],
            ['Settle Date', row.settleDate],
            ['Assigned To', row.assignee],
            ['Approver', row.approver],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px]" style={{ color: C.muted2 }}>{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b px-4" style={{ borderColor: C.rowBorder }}>
        {tabs.map((tab) => {
          const active = panelTab === tab.id
          return (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className="shrink-0 border-b-2 py-3 text-[12px] font-medium" style={{ borderColor: active ? C.blue : 'transparent', color: active ? C.text : C.muted2 }}>
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {panelTab === 'Timeline' && (
          timeline.length === 0 ? (
            <p className="text-[12px]" style={{ color: C.muted2 }}>No timeline events.</p>
          ) : (
            <ol className="relative space-y-0 pl-1">
              {timeline.map((item, idx) => {
                const last = idx === timeline.length - 1
                const amber = item.tone === 'amber'
                return (
                  <li key={`${item.title}-${idx}`} className="relative flex gap-3 pb-5 last:pb-0">
                    {!last ? <span className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background: 'rgba(59,130,246,0.35)' }} /> : null}
                    <span
                      className="relative z-[1] mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
                      style={{
                        background: amber ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.15)',
                        borderColor: amber ? 'rgba(245,158,11,0.55)' : 'rgba(59,130,246,0.45)',
                        color: amber ? '#FBBF24' : '#60A5FA',
                      }}
                    >
                      {amber ? <Clock3 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium leading-snug">{item.title}</p>
                        <p className="shrink-0 text-right text-[11px]" style={{ color: C.muted2 }}>{item.when}</p>
                      </div>
                      <p className="mt-0.5 text-[11px]" style={{ color: C.muted }}>{item.who}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )
        )}
        {panelTab !== 'Timeline' && (
          <p className="text-[12px]" style={{ color: C.muted2 }}>{panelTab} content is not exposed as a dedicated cash API yet.</p>
        )}
      </div>

      <div className="mt-auto space-y-3 border-t px-4 py-4" style={{ borderColor: C.rowBorder }}>
        <p className="text-[12px] font-semibold">Approval Actions</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onDecision('approve')} className={cn('inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-white')} style={{ background: decision === 'approve' ? '#059669' : '#10B981' }}>
            Approve & Adjust
          </button>
          <button type="button" onClick={() => onDecision('info')} className="inline-flex h-9 items-center rounded-full border px-4 text-[12px] font-medium" style={{ background: decision === 'info' ? 'rgba(59,130,246,0.15)' : 'transparent', borderColor: '#3B82F6', color: '#60A5FA' }}>
            Request More Info
          </button>
          <button type="button" onClick={() => onDecision('reject')} className="inline-flex h-9 items-center rounded-full border px-4 text-[12px] font-medium" style={{ background: decision === 'reject' ? 'rgba(244,63,94,0.12)' : 'transparent', borderColor: '#F43F5E', color: '#FB7185' }}>
            Reject
          </button>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[12px]" style={{ color: C.muted }}>Approval Notes (optional)</span>
          <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} placeholder="Add notes for your decision..." className="w-full resize-none rounded-[10px] border px-3 py-2.5 text-[12px] outline-none" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }} />
        </label>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-medium disabled:opacity-60"
          style={{ background: canSubmit ? ReconAccent.blue : C.cardBorder, color: canSubmit ? '#F8FAFC' : C.muted2 }}
        >
          {!canSubmit && !busy ? <Lock className="h-3.5 w-3.5" /> : null}
          {busy ? 'Submitting…' : 'Submit Decision'}
        </button>
      </div>
    </aside>
  )
}
