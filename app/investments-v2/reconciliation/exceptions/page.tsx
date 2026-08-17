'use client'

import { type ReactNode, useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePenLine,
  Loader2,
  Lock,
  Search,
  Send,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { ReconApiBanner, ReconNavTabs } from '@/components/investments-v2/recon-ui'
import { useRefetchLoading } from '@/components/investments-v2/hooks/use-refetch-loading'
import { RefetchOverlay } from '@/components/investments-v2/ui/refetch-overlay'
import { OpsListSkeleton, ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import { formatOpsError, investmentOpsApi, unwrapList } from '@/lib/api/investment-ops-api'
import {
  mapCashAccountOptions,
  mapExceptionTimeline,
  mapExceptions,
  mapExceptionsSummary,
  opsErrorMessage,
  requireOpsData,
  resolveCashAccountLabel,
  resolvePortfolioName,
  isMaskedAccountLabel,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type ExceptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
type ExceptionStatus = 'Pending Approval' | 'Investigating' | 'Overdue' | 'Resolved' | 'Closed' | 'Rejected'
type ExceptionRow = ReturnType<typeof mapExceptions>['items'][number]
type TimelineItem = ReturnType<typeof mapExceptionTimeline>[number]
type PanelTab = 'Timeline' | 'Comments' | 'Attachments' | 'Audit Trail'
type ExceptionComment = { id?: string; body?: string; createdAt?: string; authorName?: string }
type ExceptionAttachment = { id?: string; fileId?: string; fileName?: string; note?: string; createdAt?: string; authorName?: string }

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
  Resolved: { bg: 'rgba(34,197,94,0.08)', color: ReconAccent.greenSoft, border: 'rgba(34,197,94,0.45)' },
  Closed: { bg: 'rgba(100,116,139,0.08)', color: C.muted2, border: 'rgba(100,116,139,0.45)' },
  Rejected: { bg: 'rgba(244,63,94,0.08)', color: ReconAccent.redSoft, border: 'rgba(244,63,94,0.45)' },
}

const ageColor = (severity: ExceptionSeverity) => severityStyle[severity].color

function usdLabel(amount: string | undefined) {
  if (!amount || amount === '—' || /^nan$/i.test(amount)) return '—'
  return amount.startsWith('USD') ? amount : `USD ${amount}`
}

function bufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function ExceptionsApprovalsPage() {
  const [selectedId, setSelectedId] = useState('')
  const [page, setPage] = useState(1)
  const [panelTab, setPanelTab] = useState<PanelTab>('Timeline')
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState<'approve' | 'info' | 'reject' | null>(null)
  const [loading, setLoading] = useState(true)
  const { isRefetching, withRefetch } = useRefetchLoading()
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<ExceptionRow[]>([])
  const [cashAccounts, setCashAccounts] = useState<{ id: string; label: string }[]>([])
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState(mapExceptionsSummary(null))
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All severities')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [comments, setComments] = useState<ExceptionComment[]>([])
  const [attachments, setAttachments] = useState<ExceptionAttachment[]>([])
  const [auditEvents, setAuditEvents] = useState<TimelineItem[]>([])
  const [collabLoading, setCollabLoading] = useState(false)
  const [collabError, setCollabError] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [attachFileId, setAttachFileId] = useState('')
  const [attachFileName, setAttachFileName] = useState('')
  const [attachNote, setAttachNote] = useState('')
  const [attachLocalFile, setAttachLocalFile] = useState<File | null>(null)
  const [collabSubmitting, setCollabSubmitting] = useState(false)
  const pageSize = 20

  useEffect(() => {
    stockPickerCashApi.listClientCashAccounts({ page: 1, pageSize: 200 }).then((res) => {
      if (res.success && res.data) {
        const next = mapCashAccountOptions(res.data)
        setCashAccounts((prev) =>
          prev.length === next.length && prev.every((p, i) => p.id === next[i]?.id && p.label === next[i]?.label)
            ? prev
            : next,
        )
      }
    }).catch(() => undefined)
    investmentOpsApi.listPortfolios().then((res) => {
      if (res.success !== false) {
        setPortfolios(
          unwrapList<{ id?: string; name?: string }>(res.data).map((p) => ({
            id: String(p.id ?? ''),
            name: String(p.name ?? p.id ?? 'Fund'),
          })).filter((p) => p.id),
        )
      }
    }).catch(() => undefined)
  }, [])

  const loadList = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const severity =
        severityFilter === 'All severities'
          ? undefined
          : severityFilter.toUpperCase()
      const status =
        statusFilter === 'All statuses'
          ? undefined
          : statusFilter === 'Pending Approval'
            ? 'PENDING_APPROVAL'
            : statusFilter === 'Overdue'
              ? 'OVERDUE'
              : 'OPEN'
      const [listRes, sumRes] = await Promise.all([
        stockPickerCashApi.listExceptions({
          page: p,
          pageSize,
          ...(severity ? { severity } : {}),
          ...(status ? { status } : {}),
        }),
        stockPickerCashApi.getExceptionsSummary().catch(() => null),
      ])
      const listData = requireOpsData(listRes, 'exceptions')
      const mapped = mapExceptions(listData)
      setRows(
        mapped.items.map((row) => ({
          ...row,
          account: resolveCashAccountLabel(
            row.cashAccountId,
            cashAccounts,
            isMaskedAccountLabel(row.account) ? '—' : row.account,
          ),
          portfolio:
            row.portfolio !== '—'
              ? row.portfolio
              : resolvePortfolioName(row.portfolioId, portfolios),
        })),
      )
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
  }, [cashAccounts, page, portfolios, severityFilter, statusFilter])

  useEffect(() => {
    void withRefetch(() => loadList(page))
  }, [loadList, page, withRefetch])

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

  useEffect(() => {
    if (!selectedId) {
      setComments([])
      setAttachments([])
      setAuditEvents([])
      setCollabError(null)
      return
    }
    if (panelTab === 'Timeline') return

    let cancelled = false
    setCollabLoading(true)
    setCollabError(null)
    ;(async () => {
      try {
        if (panelTab === 'Comments') {
          const res = await stockPickerCashApi.listExceptionComments(selectedId)
          if (cancelled) return
          if ((res as { success?: boolean }).success === false) {
            throw new Error((res as { message?: string }).message || 'Failed to load comments')
          }
          const data = (res as { data?: unknown }).data ?? res
          setComments(unwrapList<ExceptionComment>(data))
        } else if (panelTab === 'Attachments') {
          const res = await stockPickerCashApi.listExceptionAttachments(selectedId)
          if (cancelled) return
          if ((res as { success?: boolean }).success === false) {
            throw new Error((res as { message?: string }).message || 'Failed to load attachments')
          }
          const data = (res as { data?: unknown }).data ?? res
          setAttachments(unwrapList<ExceptionAttachment>(data))
        } else if (panelTab === 'Audit Trail') {
          const res = await stockPickerCashApi.getExceptionAudit(selectedId)
          if (cancelled) return
          if ((res as { success?: boolean }).success === false) {
            throw new Error((res as { message?: string }).message || 'Failed to load audit trail')
          }
          const data = (res as { data?: unknown }).data ?? res
          setAuditEvents(mapExceptionTimeline(data))
        }
      } catch (e) {
        if (!cancelled) {
          setCollabError(opsErrorMessage(e, `Unable to load ${panelTab.toLowerCase()}`))
          if (panelTab === 'Comments') setComments([])
          if (panelTab === 'Attachments') setAttachments([])
          if (panelTab === 'Audit Trail') setAuditEvents([])
        }
      } finally {
        if (!cancelled) setCollabLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, panelTab])

  const reloadComments = async () => {
    if (!selectedId) return
    const res = await stockPickerCashApi.listExceptionComments(selectedId)
    if ((res as { success?: boolean }).success === false) {
      throw new Error((res as { message?: string }).message || 'Failed to load comments')
    }
    const data = (res as { data?: unknown }).data ?? res
    setComments(unwrapList<ExceptionComment>(data))
  }

  const reloadAttachments = async () => {
    if (!selectedId) return
    const res = await stockPickerCashApi.listExceptionAttachments(selectedId)
    if ((res as { success?: boolean }).success === false) {
      throw new Error((res as { message?: string }).message || 'Failed to load attachments')
    }
    const data = (res as { data?: unknown }).data ?? res
    setAttachments(unwrapList<ExceptionAttachment>(data))
  }

  const submitComment = async () => {
    if (!selectedId || !commentBody.trim()) return
    setCollabSubmitting(true)
    setCollabError(null)
    try {
      const res = await stockPickerCashApi.postExceptionComment(selectedId, { body: commentBody.trim() })
      if ((res as { success?: boolean }).success === false) {
        throw new Error((res as { message?: string }).message || 'Failed to post comment')
      }
      setCommentBody('')
      await reloadComments()
      setActionMsg('Comment posted.')
    } catch (e) {
      setCollabError(opsErrorMessage(e, 'Failed to post comment'))
    } finally {
      setCollabSubmitting(false)
    }
  }

  const submitAttachment = async () => {
    if (!selectedId) return
    if (!attachLocalFile && !attachFileId.trim()) return
    setCollabSubmitting(true)
    setCollabError(null)
    try {
      let fileId = attachFileId.trim()
      let fileName = attachFileName.trim()
      if (attachLocalFile) {
        const selected = rows.find((r) => r.id === selectedId)
        const raw = selected?.raw as Record<string, unknown> | undefined
        let fundId = String(raw?.fundId ?? raw?.['portfolioId'] ?? '')
        if (!fundId) {
          const portfoliosRes = await investmentOpsApi.listPortfolios()
          const first = unwrapList<{ id?: string }>(portfoliosRes.data)[0]
          fundId = String(first?.id ?? '')
        }
        if (!fundId) throw new Error('No fundId available for file upload. Seed portfolios or ensure the exception includes fundId.')
        const buffer = await attachLocalFile.arrayBuffer()
        const uploadRes = await investmentOpsApi.uploadBinaryFile({
          fundId,
          fileName: attachLocalFile.name,
          mimeType: attachLocalFile.type || 'application/octet-stream',
          contentBase64: bufferToBase64(buffer),
          byteSize: attachLocalFile.size,
          checksumSha256: await sha256Hex(buffer),
        })
        if (!uploadRes.success || !uploadRes.data?.fileId) {
          throw new Error(formatOpsError(uploadRes, 'File upload failed'))
        }
        fileId = uploadRes.data.fileId
        fileName = fileName || attachLocalFile.name
      }
      const res = await stockPickerCashApi.postExceptionAttachment(selectedId, {
        fileId,
        ...(fileName ? { fileName } : {}),
        ...(attachNote.trim() ? { note: attachNote.trim() } : {}),
      })
      if ((res as { success?: boolean }).success === false) {
        throw new Error((res as { message?: string }).message || 'Failed to attach file')
      }
      setAttachFileId('')
      setAttachFileName('')
      setAttachNote('')
      setAttachLocalFile(null)
      await reloadAttachments()
      setActionMsg('Attachment linked.')
    } catch (e) {
      setCollabError(opsErrorMessage(e, 'Failed to attach file'))
    } finally {
      setCollabSubmitting(false)
    }
  }

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase()
    if (!q) return true
    return `${r.id} ${r.account} ${r.client} ${r.reason} ${r.title}`.toLowerCase().includes(q)
  })
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0]
  const isTerminal =
    selected != null &&
    (['Resolved', 'Closed', 'Rejected'].includes(selected.status) ||
      String((selected.raw as { status?: string } | undefined)?.status ?? '').toUpperCase().includes('RESOLV') ||
      String((selected.raw as { status?: string } | undefined)?.status ?? '').toUpperCase().includes('REJECT') ||
      String((selected.raw as { status?: string } | undefined)?.status ?? '').toUpperCase().includes('CLOS'))
  const canSubmit = decision !== null && !!selected && !busy && !isTerminal

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
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Exceptions</h1>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug" style={{ color: C.muted }}>
              Breaks that did not auto-clear. Open a row to investigate, attach evidence, then approve or reject.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              value={severityFilter}
              options={['All severities', 'Critical', 'High', 'Medium', 'Low']}
              onChange={(v) => {
                setSeverityFilter(v)
                setPage(1)
              }}
            />
            <FilterSelect
              value={statusFilter}
              options={['All statuses', 'Pending Approval', 'Investigating', 'Overdue']}
              onChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            />
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />
        {actionMsg ? <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">{actionMsg}</div> : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<ShieldAlert className="h-4 w-4 text-[#FB7185]" />}
            iconBg="rgba(244,63,94,0.15)"
            label="Critical / High"
            value={String(summary.critical)}
            amount={usdLabel(summary.criticalAmount)}
            trend={`${summary.open} open`}
            trendColor="#FB7185"
          />
          <KpiCard
            icon={<Clock3 className="h-4 w-4 text-[#FBBF24]" />}
            iconBg="rgba(245,158,11,0.15)"
            label="Overdue Approvals"
            value={String(summary.overdue)}
            amount={usdLabel(summary.overdueAmount)}
            trend={summary.overdue === 0 ? 'None past SLA' : 'Past decision deadline'}
            trendColor="#FB7185"
          />
          <KpiCard
            icon={<FilePenLine className="h-4 w-4 text-[#FACC15]" />}
            iconBg="rgba(234,179,8,0.15)"
            label="Pending Adjustments"
            value={String(summary.pending)}
            amount={usdLabel(summary.pendingAmount)}
            trend={`${summary.investigating} investigating`}
            trendColor="#FBBF24"
          />
          <KpiCard
            icon={<Send className="h-4 w-4 text-[#4ADE80]" />}
            iconBg="rgba(34,197,94,0.15)"
            label="Straight-through match"
            value={summary.stpRate}
            trend={
              summary.matchLinks > 0
                ? `${summary.autoConfirmed} of ${summary.matchLinks} auto-confirmed`
                : 'No match links yet'
            }
            trendColor="#4ADE80"
          />
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
              </div>
            </div>

            <div className="relative overflow-x-auto">
              <RefetchOverlay active={isRefetching} rows={7} cols={9} />
              <table className="w-full min-w-[1080px] text-left text-[12px]">
                <thead>
                  <tr style={{ color: C.muted2, borderBottom: `1px solid ${C.rowBorder}` }}>
                    {['Severity', 'Account', 'Client', 'Source', 'Exception Reason', 'Amount Difference', 'Age', 'Assigned To', 'Status'].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-[11px] font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <ReconTableSkeleton rows={7} cols={9} />
                      </td>
                    </tr>
                  ) : null}
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3.5 py-10 text-center text-[12px]" style={{ color: C.muted2 }}>
                        {error ? 'Unable to load exceptions.' : 'No exceptions found.'}
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? filtered.map((row) => {
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
                  })
                    : null}
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
              comments={comments}
              attachments={attachments}
              auditEvents={auditEvents}
              collabLoading={collabLoading}
              collabError={collabError}
              commentBody={commentBody}
              onCommentBodyChange={setCommentBody}
              attachFileId={attachFileId}
              onAttachFileIdChange={setAttachFileId}
              attachFileName={attachFileName}
              onAttachFileNameChange={setAttachFileName}
              attachNote={attachNote}
              onAttachNoteChange={setAttachNote}
              attachLocalFile={attachLocalFile}
              onAttachLocalFileChange={setAttachLocalFile}
              collabSubmitting={collabSubmitting}
              onSubmitComment={() => void submitComment()}
              onSubmitAttachment={() => void submitAttachment()}
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

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border py-0 pl-3 pr-8 text-[12px] outline-none"
        style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: C.muted2 }} />
    </label>
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
  comments,
  attachments,
  auditEvents,
  collabLoading,
  collabError,
  commentBody,
  onCommentBodyChange,
  attachFileId,
  onAttachFileIdChange,
  attachFileName,
  onAttachFileNameChange,
  attachNote,
  onAttachNoteChange,
  attachLocalFile,
  onAttachLocalFileChange,
  collabSubmitting,
  onSubmitComment,
  onSubmitAttachment,
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
  comments: ExceptionComment[]
  attachments: ExceptionAttachment[]
  auditEvents: TimelineItem[]
  collabLoading: boolean
  collabError: string | null
  commentBody: string
  onCommentBodyChange: (v: string) => void
  attachFileId: string
  onAttachFileIdChange: (v: string) => void
  attachFileName: string
  onAttachFileNameChange: (v: string) => void
  attachNote: string
  onAttachNoteChange: (v: string) => void
  attachLocalFile: File | null
  onAttachLocalFileChange: (f: File | null) => void
  collabSubmitting: boolean
  onSubmitComment: () => void
  onSubmitAttachment: () => void
  onSubmit: () => void
  busy: boolean
}) {
  const sev = severityStyle[row.severity]
  const st = statusStyle[row.status] ?? statusStyle.Investigating
  const isTerminal =
    ['Resolved', 'Closed', 'Rejected'].includes(row.status) ||
    String((row.raw as { status?: string } | undefined)?.status ?? '').toUpperCase().includes('RESOLV') ||
    String((row.raw as { status?: string } | undefined)?.status ?? '').toUpperCase().includes('REJECT') ||
    String((row.raw as { status?: string } | undefined)?.status ?? '').toUpperCase().includes('CLOS')
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
            ['Portfolio', row.portfolio],
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
        {collabError && panelTab !== 'Timeline' ? (
          <p className="rounded-[8px] border px-3 py-2 text-[11px]" style={{ borderColor: 'rgba(244,63,94,0.35)', color: '#FB7185', background: 'rgba(244,63,94,0.08)' }}>
            {collabError}
          </p>
        ) : null}
        {panelTab === 'Timeline' && (
          collabLoading ? (
            <OpsListSkeleton rows={4} />
          ) : timeline.length === 0 ? (
            <p className="text-[12px]" style={{ color: C.muted2 }}>No timeline events.</p>
          ) : (
            <TimelineList items={timeline} />
          )
        )}
        {panelTab === 'Comments' && (
          collabLoading ? (
            <OpsListSkeleton rows={4} />
          ) : (
            <>
              {comments.length === 0 ? (
                <p className="text-[12px]" style={{ color: C.muted2 }}>No comments yet. Add the first note below.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((item, idx) => (
                    <li key={item.id ?? `cmt-${idx}`} className="rounded-[10px] border px-3 py-2.5" style={{ borderColor: C.rowBorder, background: C.control }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-medium">{item.authorName || 'Analyst'}</p>
                        <p className="shrink-0 text-[10px]" style={{ color: C.muted2 }}>{formatCollabWhen(item.createdAt)}</p>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.muted }}>{item.body || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2 border-t pt-4" style={{ borderColor: C.rowBorder }}>
                <label className="block">
                  <span className="mb-1.5 block text-[12px]" style={{ color: C.muted }}>Add comment</span>
                  <textarea
                    value={commentBody}
                    onChange={(e) => onCommentBodyChange(e.target.value)}
                    rows={3}
                    placeholder="Share investigation notes…"
                    className="w-full resize-none rounded-[10px] border px-3 py-2.5 text-[12px] outline-none"
                    style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                  />
                </label>
                <button
                  type="button"
                  disabled={!commentBody.trim() || collabSubmitting}
                  onClick={onSubmitComment}
                  className="inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-white disabled:opacity-50"
                  style={{ background: ReconAccent.blue }}
                >
                  {collabSubmitting ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </>
          )
        )}
        {panelTab === 'Attachments' && (
          collabLoading ? (
            <OpsListSkeleton rows={3} />
          ) : (
            <>
              {attachments.length === 0 ? (
                <p className="text-[12px]" style={{ color: C.muted2 }}>No attachments linked. Add a file reference below.</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((item, idx) => (
                    <li key={item.id ?? `att-${idx}`} className="rounded-[10px] border px-3 py-2.5" style={{ borderColor: C.rowBorder, background: C.control }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-[11px]" style={{ color: C.blueLink }}>{item.fileName || item.fileId || 'File'}</p>
                        <p className="shrink-0 text-[10px]" style={{ color: C.muted2 }}>{formatCollabWhen(item.createdAt)}</p>
                      </div>
                      {item.fileId ? <p className="mt-1 text-[10px]" style={{ color: C.muted2 }}>fileId: {item.fileId}</p> : null}
                      {item.note ? <p className="mt-1 text-[11px]" style={{ color: C.muted }}>{item.note}</p> : null}
                      {item.authorName ? <p className="mt-1 text-[10px]" style={{ color: C.muted2 }}>by {item.authorName}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-3 border-t pt-4" style={{ borderColor: C.rowBorder }}>
                <label className="block">
                  <span className="mb-1.5 block text-[12px]" style={{ color: C.muted }}>Local file</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      onAttachLocalFileChange(file)
                      if (file && !attachFileName.trim()) onAttachFileNameChange(file.name)
                    }}
                    className="block w-full text-[11px]"
                    style={{ color: C.muted }}
                  />
                  {attachLocalFile ? (
                    <p className="mt-1 text-[10px]" style={{ color: C.muted2 }}>Selected: {attachLocalFile.name}</p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px]" style={{ color: C.muted }}>File name (optional)</span>
                  <input
                    value={attachFileName}
                    onChange={(e) => onAttachFileNameChange(e.target.value)}
                    placeholder="broker-statement.pdf"
                    className="h-9 w-full rounded-full border px-3 text-[12px] outline-none"
                    style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px]" style={{ color: C.muted }}>Note (optional)</span>
                  <input
                    value={attachNote}
                    onChange={(e) => onAttachNoteChange(e.target.value)}
                    placeholder="Supporting evidence for variance"
                    className="h-9 w-full rounded-full border px-3 text-[12px] outline-none"
                    style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                  />
                </label>
                <details className="text-[11px]" style={{ color: C.muted2 }}>
                  <summary className="cursor-pointer">Advanced: paste existing fileId</summary>
                  <input
                    value={attachFileId}
                    onChange={(e) => onAttachFileIdChange(e.target.value)}
                    placeholder="file_…"
                    className="mt-2 h-9 w-full rounded-full border px-3 font-mono text-[11px] outline-none"
                    style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                  />
                </details>
                <button
                  type="button"
                  disabled={(!attachLocalFile && !attachFileId.trim()) || collabSubmitting}
                  onClick={onSubmitAttachment}
                  className="inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-white disabled:opacity-50"
                  style={{ background: ReconAccent.blue }}
                >
                  {collabSubmitting ? 'Uploading…' : attachLocalFile ? 'Upload & attach' : 'Link attachment'}
                </button>
              </div>
            </>
          )
        )}
        {panelTab === 'Audit Trail' && (
          collabLoading ? (
            <OpsListSkeleton rows={4} />
          ) : auditEvents.length === 0 ? (
            <p className="text-[12px]" style={{ color: C.muted2 }}>No audit events recorded for this exception.</p>
          ) : (
            <TimelineList items={auditEvents} />
          )
        )}
      </div>

      <div className="mt-auto space-y-3 border-t px-4 py-4" style={{ borderColor: C.rowBorder }}>
        <p className="text-[12px] font-semibold">Approval Actions</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={isTerminal || busy} onClick={() => onDecision('approve')} className={cn('inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-white disabled:opacity-50')} style={{ background: decision === 'approve' ? '#059669' : '#10B981' }}>
            Approve & Adjust
          </button>
          <button type="button" disabled={isTerminal || busy} onClick={() => onDecision('info')} className="inline-flex h-9 items-center rounded-full border px-4 text-[12px] font-medium disabled:opacity-50" style={{ background: decision === 'info' ? 'rgba(59,130,246,0.15)' : 'transparent', borderColor: '#3B82F6', color: '#60A5FA' }}>
            Request More Info
          </button>
          <button type="button" disabled={isTerminal || busy} onClick={() => onDecision('reject')} className="inline-flex h-9 items-center rounded-full border px-4 text-[12px] font-medium disabled:opacity-50" style={{ background: decision === 'reject' ? 'rgba(244,63,94,0.12)' : 'transparent', borderColor: '#F43F5E', color: '#FB7185' }}>
            Reject
          </button>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[12px]" style={{ color: C.muted }}>Approval Notes (optional)</span>
          <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} disabled={isTerminal || busy} placeholder="Add notes for your decision..." className="w-full resize-none rounded-[10px] border px-3 py-2.5 text-[12px] outline-none disabled:opacity-50" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }} />
        </label>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-medium disabled:opacity-60"
          style={{ background: canSubmit ? ReconAccent.blue : C.cardBorder, color: canSubmit ? '#F8FAFC' : C.muted2 }}
        >
          {!canSubmit && !busy ? <Lock className="h-3.5 w-3.5" /> : busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {busy ? 'Submitting…' : 'Submit Decision'}
        </button>
      </div>
    </aside>
  )
}

function formatCollabWhen(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-0 pl-1">
      {items.map((item, idx) => {
        const last = idx === items.length - 1
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
}
