'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CircleDollarSign,
  Download,
  Eye,
  FileStack,
  FileText,
  Info,
  Loader2,
  Mail,
  Network,
  Upload,
  Wallet,
} from 'lucide-react'
import { ReconApiBanner, ReconNavTabs, ViewSegment } from '@/components/investments-v2/recon-ui'
import { useRefetchLoading } from '@/components/investments-v2/hooks/use-refetch-loading'
import { RefetchOverlay } from '@/components/investments-v2/ui/refetch-overlay'
import { OpsListSkeleton, ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import {
  mapCashAccountOptions,
  mapStatements,
  mapStatementsSummary,
  opsErrorMessage,
  requireOpsData,
  resolveCashAccountLabel,
  displayLabel,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { formatMoneyDisplay, unwrapList } from '@/lib/api/investment-ops-helpers'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type StatementView = 'client' | 'investor'
type StatementRow = ReturnType<typeof mapStatements>['items'][number]

const investorFilters = [
  { label: 'Fund', value: 'All funds' },
  { label: 'Investor / Client', value: 'All investors' },
  { label: 'Class', value: 'All classes' },
  { label: 'Period', value: 'All periods' },
  { label: 'Delivery Channel', value: 'Email' },
  { label: 'Status', value: 'All' },
]

const clientFilters = [
  { label: 'Client', key: 'client' as const, value: 'All clients' },
  { label: 'Account', key: 'account' as const, value: 'All accounts' },
  { label: 'Currency', key: 'currency' as const, value: 'All' },
  { label: 'Status', key: 'status' as const, value: 'All' },
]

function defaultPeriodRange() {
  const now = new Date()
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const to = now
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { periodFrom: iso(from), periodTo: iso(to) }
}

export default function StatementsPage() {
  const [statementView, setStatementView] = useState<StatementView>('client')
  const [selectedId, setSelectedId] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { isRefetching, withRefetch } = useRefetchLoading()
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<
    'generate' | 'preview' | 'approve' | 'email' | 'download' | null
  >(null)
  const busy = busyAction !== null
  const [rows, setRows] = useState<StatementRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState(mapStatementsSummary(null))
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [detail, setDetail] = useState<StatementRow | null>(null)
  const [cashAccounts, setCashAccounts] = useState<{ id: string; label: string; clientOrVehicleId?: string }[]>([])
  const [accountFilter, setAccountFilter] = useState('All accounts')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currencyFilter, setCurrencyFilter] = useState('All')
  const pageSize = 8
  const isInvestor = statementView === 'investor'

  useEffect(() => {
    stockPickerCashApi.listClientCashAccounts({ page: 1, pageSize: 100 }).then((res) => {
      if (res.success && res.data) {
        const raw = unwrapList<{ id?: string; clientOrVehicleId?: string }>(res.data)
        const byId = new Map(raw.map((r) => [String(r.id ?? ''), r]))
        setCashAccounts(
          mapCashAccountOptions(res.data).map((a) => {
            const hit = byId.get(a.id)
            return {
              ...a,
              clientOrVehicleId: hit?.clientOrVehicleId != null ? String(hit.clientOrVehicleId) : undefined,
            }
          }),
        )
      }
    }).catch(() => undefined)
  }, [])

  const selectedAccountId = useMemo(() => {
    if (accountFilter === 'All accounts') return undefined
    return cashAccounts.find((a) => a.label === accountFilter)?.id
  }, [accountFilter, cashAccounts])

  const loadList = useCallback(
    async (p = page) => {
      setLoading(true)
      setError(null)
      try {
        const params: Record<string, string | number | undefined> = {
          page: p,
          pageSize,
        }
        // Investor segment uses INVESTOR_CAPITAL statementType when supported.
        if (isInvestor) params.statementType = 'INVESTOR_CAPITAL'
        else params.statementType = 'PERIODIC'
        if (selectedAccountId) params.cashAccountId = selectedAccountId
        if (statusFilter !== 'All') params.status = statusFilter.toUpperCase().replace(/\s+/g, '_')
        if (currencyFilter !== 'All') params.currency = currencyFilter

        const [listRes, sumRes] = await Promise.all([
          stockPickerCashApi.listClientStatements(params),
          stockPickerCashApi.getClientStatementsSummary(params).catch(() => null),
        ])
        const listData = requireOpsData(listRes, 'client statements')
        const mapped = mapStatements(listData)
        setRows(
          mapped.items.map((row) => ({
            ...row,
            account:
              row.account !== '—'
                ? row.account
                : resolveCashAccountLabel(row.cashAccountId, cashAccounts),
          })),
        )
        setTotal(mapped.total)
        setTotalPages(Math.max(1, mapped.totalPages || Math.ceil((mapped.total || 0) / pageSize) || 1))
        setSelectedId((prev) => {
          if (prev && mapped.items.some((r) => r.id === prev)) return prev
          return mapped.items[0]?.id ?? ''
        })
        if (sumRes && typeof sumRes === 'object' && 'success' in sumRes && (sumRes as { success?: boolean }).success) {
          const sumData = requireOpsData(sumRes as Parameters<typeof requireOpsData>[0], 'statements summary') as Record<
            string,
            unknown
          >
          setSummary(mapStatementsSummary(sumData))
        } else {
          setSummary(mapStatementsSummary(null))
        }
      } catch (e) {
        setError(opsErrorMessage(e, 'Unable to load client statements'))
        setRows([])
        setTotal(0)
        setTotalPages(1)
        setSelectedId('')
        setSummary(mapStatementsSummary(null))
      } finally {
        setLoading(false)
      }
    },
    [cashAccounts, currencyFilter, isInvestor, page, selectedAccountId, statusFilter],
  )

  const loadPreview = useCallback(async (id: string) => {
    setBusyAction('preview')
    setActionMsg(null)
    try {
      const previewRes = await stockPickerCashApi.previewClientStatement(id)
      const data = requireOpsData(previewRes, 'statement preview') as Record<string, unknown>
      const html =
        (typeof data.previewHtml === 'string' && data.previewHtml) ||
        (typeof data.html === 'string' && data.html) ||
        null
      if (html) {
        setPreviewHtml(html)
        setActionMsg('Preview loaded.')
      } else {
        setPreviewHtml(null)
        setActionMsg('No preview HTML returned — showing summary panel.')
      }
    } catch (e) {
      setPreviewHtml(null)
      setActionMsg(opsErrorMessage(e, 'Preview failed'))
    } finally {
      setBusyAction(null)
    }
  }, [])

  useEffect(() => {
    void withRefetch(() => loadList(page))
  }, [loadList, page, withRefetch])

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null

  useEffect(() => {
    if (!selected?.id) {
      setDetail(null)
      setPreviewHtml(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [stmtRes, previewRes] = await Promise.all([
          stockPickerCashApi.getClientStatement(selected.id),
          stockPickerCashApi.previewClientStatement(selected.id).catch(() => null),
        ])
        if (cancelled) return
        if (stmtRes?.success && stmtRes.data) {
          const mapped = mapStatements({ items: [stmtRes.data], total: 1, page: 1, pageSize: 1, totalPages: 1 })
          setDetail(mapped.items[0] ?? selected)
        } else {
          setDetail(selected)
        }
        const previewData =
          previewRes && typeof previewRes === 'object' && 'data' in previewRes
            ? (previewRes as { data?: { previewHtml?: string } }).data
            : null
        setPreviewHtml(previewData?.previewHtml ?? null)
      } catch {
        if (!cancelled) {
          setDetail(selected)
          setPreviewHtml(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selected])

  const preview = detail ?? selected
  const readyPct =
    summary.total > 0 ? Math.round((summary.ready / summary.total) * 100) : summary.ready > 0 ? 100 : 0
  const from = rows.length === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total || rows.length)

  const generateBatch = async () => {
    setBusyAction('generate')
    setActionMsg(null)
    try {
      let clientOrVehicleId = selected?.clientOrVehicleId
      let currency = selected?.currency ?? 'USD'
      const range = defaultPeriodRange()

      const accountsRes = await stockPickerCashApi.listClientCashAccounts({ page: 1, pageSize: 100 })
      const accountsData = requireOpsData(accountsRes, 'client cash accounts')
      const accounts = unwrapList<{ id?: string; baseCurrency?: string; clientOrVehicleId?: string }>(accountsData)

      let cashAccountIds: string[] = []
      if (selected?.cashAccountId) {
        cashAccountIds = [selected.cashAccountId]
      } else {
        cashAccountIds = accounts.map((a) => a.id).filter((id): id is string => Boolean(id))
      }

      if (!cashAccountIds.length) {
        setActionMsg('Generate requires at least one cashAccountId — none available from selection or account list.')
        return
      }

      const firstAccount = accounts.find((a) => a.id === cashAccountIds[0]) ?? accounts[0]
      currency = String(firstAccount?.baseCurrency ?? currency)
      clientOrVehicleId = clientOrVehicleId || String(firstAccount?.clientOrVehicleId ?? '')

      const payload: Record<string, unknown> = {
        clientOrVehicleId: clientOrVehicleId || undefined,
        currency,
        periodFrom: selected?.periodFrom?.slice(0, 10) || range.periodFrom,
        periodTo: selected?.periodTo?.slice(0, 10) || range.periodTo,
        statementType: isInvestor ? 'INVESTOR_CAPITAL' : 'PERIODIC',
      }

      if (cashAccountIds.length > 1) {
        payload.cashAccountIds = cashAccountIds
      } else {
        payload.cashAccountId = cashAccountIds[0]
      }

      await stockPickerCashApi.generateClientStatement(payload)
      setActionMsg('Statement generated.')
      await loadList(page)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Generate failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const approveSelected = async () => {
    if (!selected) return
    setBusyAction('approve')
    setActionMsg(null)
    try {
      await stockPickerCashApi.approveClientStatement(selected.id, { expectedVersion: selected.version })
      setActionMsg('Statement approved.')
      await loadList(page)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Approve failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const emailSelected = async () => {
    if (!selected) return
    setBusyAction('email')
    setActionMsg(null)
    try {
      await stockPickerCashApi.emailClientStatement(selected.id, {})
      setActionMsg('Email delivery queued.')
      await loadList(page)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Email failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const downloadSelected = async () => {
    if (!selected) return
    setBusyAction('download')
    setActionMsg(null)
    try {
      const result = await stockPickerCashApi.downloadClientStatement(selected.id, { acceptPdf: true })

      const defaultFileName =
        selected.period && selected.period !== '—'
          ? `statement-${selected.period.replace(/\s+/g, '-')}.pdf`
          : `statement-${selected.id}.pdf`

      const triggerBlobDownload = (blob: Blob, fileName?: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName ?? defaultFileName
        a.click()
        URL.revokeObjectURL(url)
        setActionMsg('Download started.')
      }

      const decodeBase64Pdf = (raw: string, fileName?: string) => {
        const cleaned = raw.replace(/^data:application\/pdf;base64,/i, '').replace(/\s+/g, '')
        const binary = atob(cleaned)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
        // Guard against non-PDF payloads labeled as base64
        const head = String.fromCharCode(...bytes.slice(0, 5))
        if (!head.startsWith('%PDF')) {
          setActionMsg('Download did not contain a valid PDF.')
          return
        }
        triggerBlobDownload(new Blob([bytes], { type: 'application/pdf' }), fileName ?? defaultFileName)
      }

      const handleJsonPayload = (parsed: {
        success?: boolean
        data?: { contentBase64?: string; downloadUrl?: string | null; fileName?: string }
        contentBase64?: string
        downloadUrl?: string | null
        fileName?: string
        message?: string
      }) => {
        if (parsed.success === false) {
          setActionMsg(parsed.message || 'Download failed')
          return
        }
        const payload = parsed.data ?? parsed
        if (payload.contentBase64) {
          decodeBase64Pdf(String(payload.contentBase64), payload.fileName)
          return
        }
        if (payload.downloadUrl) {
          window.open(String(payload.downloadUrl), '_blank', 'noopener,noreferrer')
          setActionMsg('Download link opened.')
          return
        }
        setActionMsg('Download response did not include a file or URL.')
      }

      if (result instanceof Blob) {
        const buf = await result.arrayBuffer()
        const bytes = new Uint8Array(buf)
        const head = String.fromCharCode(...bytes.slice(0, 5))
        const type = (result.type || '').toLowerCase()
        if (head.startsWith('%PDF') || type.includes('pdf')) {
          triggerBlobDownload(new Blob([buf], { type: 'application/pdf' }), defaultFileName)
          return
        }
        // JSON (or mislabeled) envelope — common when Accept asks for pdf but BE returns base64 JSON
        const text = new TextDecoder().decode(bytes)
        try {
          handleJsonPayload(JSON.parse(text))
        } catch {
          setActionMsg('Download returned unreadable content.')
        }
        return
      }

      handleJsonPayload(result as {
        success?: boolean
        data?: { contentBase64?: string; downloadUrl?: string | null; fileName?: string }
        contentBase64?: string
        downloadUrl?: string | null
        fileName?: string
        message?: string
      })
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Download failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const cashLines =
    preview?.movementLines?.length
      ? [
          { label: 'Opening Cash', amount: preview.openingCash },
          ...preview.movementLines,
          { label: 'Closing Cash', amount: preview.closingCash },
        ]
      : preview
        ? [
            { label: 'Opening Cash', amount: preview.openingCash },
            { label: 'Closing Cash', amount: preview.closingCash },
          ]
        : []

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: C.text }}>
                {isInvestor ? 'Investor Statements' : 'Client Statements'}
              </h1>
              <ViewSegment
                value={statementView}
                onChange={(id) => {
                  setStatementView(id)
                  setSelectedId('')
                  setPage(1)
                }}
                options={[
                  { id: 'client', label: 'Client' },
                  { id: 'investor', label: 'Investor' },
                ]}
              />
            </div>
            <p className="mt-1.5 text-[13px] leading-snug" style={{ color: C.muted }}>
              {isInvestor
                ? 'Generate and manage investor statements across funds, investors, and account classes.'
                : 'Generate and deliver client cash statements from the trading cash ledger.'}
            </p>
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />
        {actionMsg ? (
          <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            {actionMsg}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:items-end">
          <FilterField
            label="Account"
            value={accountFilter}
            options={['All accounts', ...cashAccounts.map((a) => a.label)]}
            onChange={(v) => {
              setAccountFilter(v)
              setPage(1)
            }}
          />
          <FilterField
            label="Currency"
            value={currencyFilter}
            options={['All', 'USD', 'ZWL', 'ZWG']}
            onChange={(v) => {
              setCurrencyFilter(v)
              setPage(1)
            }}
          />
          <FilterField
            label="Status"
            value={statusFilter}
            options={['All', 'Draft', 'Pending Approval', 'Approved', 'Delivered']}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          />
          <button
            type="button"
            className="h-9 justify-self-start text-[12px] font-medium"
            style={{ color: C.blueLink }}
            onClick={() => {
              setAccountFilter('All accounts')
              setCurrencyFilter('All')
              setStatusFilter('All')
              setPage(1)
            }}
          >
            Reset
          </button>
        </section>

        {/* KPIs — live summary only; investor capital fields not on client-statements API */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {isInvestor ? (
            <>
              <Kpi
                icon={<Wallet className="h-4 w-4 text-[#60A5FA]" />}
                iconBg="rgba(59,130,246,0.15)"
                label="Draft"
                value={String(summary.draft)}
                trend="From statements summary"
              />
              <Kpi
                icon={<Network className="h-4 w-4 text-[#34D399]" />}
                iconBg="rgba(16,185,129,0.15)"
                label="Pending Approval"
                value={String(summary.pendingApproval)}
                trend="Status counts from summary"
              />
              <Kpi
                icon={<CircleDollarSign className="h-4 w-4 text-[#FBBF24]" />}
                iconBg="rgba(245,158,11,0.15)"
                label="Approved"
                value={String(summary.approved)}
                trend="—"
              />
              <Kpi
                icon={<FileText className="h-4 w-4 text-[#C084FC]" />}
                iconBg="rgba(168,85,247,0.15)"
                label="Delivered"
                value={String(summary.delivered)}
                trend="—"
              />
              <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
                <div className="flex items-start gap-3">
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'rgba(16,185,129,0.15)' }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px]" style={{ color: C.muted }}>
                      Statements Ready
                    </p>
                    <p className="mt-1 font-mono text-[18px] font-semibold leading-none" style={{ color: C.text }}>
                      {summary.ready}{' '}
                      <span className="text-[12px] font-normal" style={{ color: C.muted2 }}>
                        of {summary.total || total || '—'}
                      </span>
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: C.control }}>
                        <div className="h-full rounded-full" style={{ width: `${readyPct}%`, background: C.green }} />
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: C.greenSoft }}>
                        {readyPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </>
          ) : (
            <>
              <Kpi
                icon={<Wallet className="h-4 w-4 text-[#60A5FA]" />}
                iconBg="rgba(59,130,246,0.15)"
                label="Client Cash Covered"
                value={summary.clientCashCovered ? `USD ${summary.clientCashCovered}` : '—'}
                trend="When summary provides totalCash"
              />
              <Kpi
                icon={<Network className="h-4 w-4 text-[#34D399]" />}
                iconBg="rgba(16,185,129,0.15)"
                label="Accounts in Scope"
                value={summary.accountsInScope != null ? String(summary.accountsInScope) : String(total || '—')}
                trend="Statement runs"
              />
              <Kpi
                icon={<CircleDollarSign className="h-4 w-4 text-[#FBBF24]" />}
                iconBg="rgba(245,158,11,0.15)"
                label="Period Movements"
                value={summary.periodMovements ? `USD ${summary.periodMovements}` : '—'}
                trend={summary.periodMovements ? 'From statements summary' : 'When summary provides movementTotal'}
              />
              <Kpi
                icon={<FileText className="h-4 w-4 text-[#C084FC]" />}
                iconBg="rgba(168,85,247,0.15)"
                label="Pending Delivery"
                value={String(summary.pendingDelivery)}
                trend="Draft + pending approval"
              />
              <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
                <div className="flex items-start gap-3">
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'rgba(16,185,129,0.15)' }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px]" style={{ color: C.muted }}>
                      Statements Ready
                    </p>
                    <p className="mt-1 font-mono text-[18px] font-semibold leading-none" style={{ color: C.text }}>
                      {summary.ready}{' '}
                      <span className="text-[12px] font-normal" style={{ color: C.muted2 }}>
                        of {summary.total || total || '—'}
                      </span>
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: C.control }}>
                        <div className="h-full rounded-full" style={{ width: `${readyPct}%`, background: C.green }} />
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: C.greenSoft }}>
                        {readyPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </>
          )}
        </section>

        {/* Body */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article
            className="flex min-h-[520px] flex-col overflow-hidden rounded-[12px] border"
            style={{ background: C.card, borderColor: C.cardBorder }}
          >
            <div className="flex items-center gap-2.5 border-b px-4 py-3.5" style={{ borderColor: C.cardBorder }}>
              <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>
                Statement Schedule & History
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.muted, color: C.muted, border: `1px solid ${C.cardBorder}` }}
              >
                {total} Runs
              </span>
            </div>

            <div className="relative flex-1 overflow-x-auto">
              <RefetchOverlay active={isRefetching} rows={6} cols={6} />
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                    {(isInvestor
                      ? ['Period', 'As At Date', 'Account', 'Status', 'Investors', 'Generated By', 'Generated On']
                      : ['Period', 'As At Date', 'Account', 'Status', 'Clients', 'Generated By', 'Generated On']
                    ).map((h) => (
                      <th key={h} className="px-3 py-3 text-[11px] font-medium" style={{ color: C.muted2 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <ReconTableSkeleton rows={6} cols={6} />
                      </td>
                    </tr>
                  ) : null}
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-[12px]" style={{ color: C.muted2 }}>
                        {error
                          ? 'Unable to load statements.'
                          : isInvestor
                            ? 'No investor statements returned. Confirm statementType=INVESTOR_CAPITAL on /client-statements.'
                            : 'No client statements for this segment.'}
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className="cursor-pointer"
                      style={{
                        borderBottom: `1px solid ${C.rowBorder}`,
                        background: selected?.id === row.id ? 'rgba(37,99,235,0.08)' : undefined,
                      }}
                    >
                      <td className="px-3 py-3 text-[12px] font-medium" style={{ color: C.text }}>
                        {row.period}
                      </td>
                      <td className="px-3 py-3 text-[12px]" style={{ color: C.muted }}>
                        {row.asAt}
                      </td>
                      <td className="px-3 py-3 text-[12px]" style={{ color: C.muted }}>
                        {row.account}
                      </td>
                      <td className="px-3 py-3">
                        <RunStatus status={row.status} />
                      </td>
                      <td className="px-3 py-3 font-mono text-[12px]" style={{ color: C.muted }}>
                        {isInvestor ? row.investors : row.clients}
                      </td>
                      <td className="px-3 py-3 text-[12px]" style={{ color: C.muted }}>
                        {row.generatedBy}
                      </td>
                      <td className="px-3 py-3 text-[12px]" style={{ color: C.muted2 }}>
                        {row.generatedOn}
                      </td>
                    </tr>
                  ))
                    : null}
                </tbody>
              </table>
            </div>

            <div
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderTop: `1px solid ${C.cardBorder}` }}
            >
              <p className="text-[12px]" style={{ color: C.muted2 }}>
                Showing {from} to {to} of {total} runs
              </p>
              <div className="flex items-center gap-1">
                <PagerBtn disabled={page === 1} onClick={() => setPage(1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PagerBtn>
                {Array.from({ length: Math.min(6, totalPages) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-medium"
                    style={
                      page === n
                        ? { background: C.blue, color: '#fff' }
                        : { color: C.muted, background: 'transparent' }
                    }
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 6 ? (
                  <span className="px-1 text-[12px]" style={{ color: C.muted2 }}>
                    …
                  </span>
                ) : null}
                <PagerBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </PagerBtn>
                <PagerBtn disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </PagerBtn>
              </div>
            </div>
          </article>

          <article
            className="flex min-h-[520px] flex-col rounded-[12px] border p-4"
            style={{ background: C.card, borderColor: C.cardBorder }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyAction === 'generate'}
                onClick={() => void generateBatch()}
                className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-semibold text-white disabled:opacity-50"
                style={{ background: C.blue }}
              >
                {busyAction === 'generate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileStack className="h-3.5 w-3.5" />}
                {busyAction === 'generate' ? 'Generating…' : 'Generate Batch'}
              </button>
              <OutlineBtn
                icon={<Eye className="h-3.5 w-3.5" />}
                label="Preview"
                loading={busyAction === 'preview'}
                disabled={!selected || (busyAction !== null && busyAction !== 'preview')}
                onClick={() => selected && void loadPreview(selected.id)}
              />
              <OutlineBtn
                icon={<Check className="h-3.5 w-3.5" />}
                label="Approve"
                loading={busyAction === 'approve'}
                disabled={!selected || (busyAction !== null && busyAction !== 'approve')}
                onClick={() => void approveSelected()}
              />
              <OutlineBtn
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                loading={busyAction === 'email'}
                disabled={!selected || (busyAction !== null && busyAction !== 'email')}
                onClick={() => void emailSelected()}
              />
              <OutlineBtn
                icon={<Download className="h-3.5 w-3.5" />}
                label="Download PDF"
                loading={busyAction === 'download'}
                disabled={!selected || (busyAction !== null && busyAction !== 'download')}
                onClick={() => void downloadSelected()}
              />
            </div>

            <div
              className="flex flex-1 flex-col rounded-[10px] border p-5"
              style={{ background: C.doc, borderColor: C.cardBorder }}
            >
              {!preview ? (
                <div className="flex flex-1 flex-col items-center justify-center p-4" style={{ color: C.muted2 }}>
                  {loading ? (
                    <div className="w-full max-w-md">
                      <OpsListSkeleton rows={5} />
                    </div>
                  ) : (
                    <p className="text-[13px]">Select a statement run to preview.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: C.rowBorder }}>
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-[14px] font-bold"
                        style={{ background: 'rgba(59,130,246,0.18)', color: '#93C5FD' }}
                      >
                        Z
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.14em]" style={{ color: C.text }}>
                          ZAMBEZI ASSET MANAGEMENT
                        </p>
                        <p className="mt-0.5 text-[10px]" style={{ color: C.muted2 }}>
                          {isInvestor ? 'Private Markets' : 'Stock Picker · Client Cash'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold" style={{ color: C.text }}>
                        {isInvestor ? 'Investor Statement' : 'Client Cash Statement'}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                        {preview.period}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: C.muted2 }}>
                        As at {preview.asAt}
                      </p>
                    </div>
                  </div>

                  {previewHtml ? (
                    <div
                      className="mt-4 max-h-[420px] flex-1 overflow-auto rounded-[8px] border p-3 text-[12px]"
                      style={{ borderColor: C.rowBorder, color: C.text }}
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  ) : isInvestor ? (
                    <div className="mt-4 flex-1 space-y-3 text-[12px]" style={{ color: C.muted2 }}>
                      <p>
                        Investor capital-account lines are not returned by `/client-statements`. Showing cash envelope when
                        present.
                      </p>
                      <p className="font-mono" style={{ color: C.text }}>
                        Opening {formatMoneyDisplay(preview.openingCashRaw ?? preview.openingCash)} · Closing{' '}
                        {formatMoneyDisplay(preview.closingCashRaw ?? preview.closingCash)} {preview.currency}
                      </p>
                      <p>Account: {resolveCashAccountLabel(preview.cashAccountId, cashAccounts)} · Type: {preview.statementType}</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 border-b py-4 md:grid-cols-3" style={{ borderColor: C.rowBorder }}>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted2 }}>
                            Client / Account
                          </p>
                          <p className="mt-1.5 text-[12px] font-semibold" style={{ color: C.text }}>
                            {preview.clientName !== '—' ? preview.clientName : displayLabel(preview.clientOrVehicleId, 'Client account')}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: C.muted2 }}>
                            Account {resolveCashAccountLabel(preview.cashAccountId, cashAccounts)}
                            <br />
                            Base currency {preview.currency}
                          </p>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          {[
                            ['Statement Type', preview.statementType],
                            ['Currency', preview.currency],
                            ['Status', preview.status],
                            ['Version', String(preview.version ?? '—')],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-3">
                              <span style={{ color: C.muted2 }}>{k}</span>
                              <span className="font-mono" style={{ color: C.text }}>
                                {v}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted2 }}>
                            Statement period
                          </p>
                          <p className="mt-1.5 text-[12px] font-semibold" style={{ color: C.text }}>
                            {preview.period}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: C.muted2 }}>
                            Cash movements from statement sections
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex-1">
                        <h3 className="mb-3 text-[13px] font-semibold" style={{ color: C.text }}>
                          Cash Movement Summary
                        </h3>
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                              <th className="pb-2 font-medium" style={{ color: C.muted2 }}>
                                Description
                              </th>
                              <th className="pb-2 text-right font-medium" style={{ color: C.muted2 }}>
                                Amount ({preview.currency})
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cashLines.map((line) => {
                              const closing = line.label === 'Closing Cash'
                              return (
                                <tr
                                  key={line.label}
                                  style={{ borderBottom: closing ? undefined : `1px solid ${C.rowBorder}` }}
                                >
                                  <td
                                    className={cn('py-2', closing && 'pt-2.5 text-[12px] font-semibold')}
                                    style={{ color: closing ? C.text : C.muted }}
                                  >
                                    {line.label}
                                  </td>
                                  <td
                                    className={cn(
                                      'py-2 text-right font-mono',
                                      closing && 'pt-2.5 text-[12px] font-semibold',
                                    )}
                                    style={{ color: C.text }}
                                  >
                                    {line.amount}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <p className="mt-4 flex items-start gap-1.5 text-[10px]" style={{ color: C.muted2 }}>
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    This statement is computer generated and does not require a signature.
                  </p>
                </>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

function FilterField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full items-center rounded-[8px] border px-3 text-[12px] outline-none"
        style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function Kpi({
  icon,
  iconBg,
  label,
  value,
  trend,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string
  trend: string
}) {
  return (
    <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: iconBg }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[12px]" style={{ color: C.muted }}>
            {label}
          </p>
          <p className="mt-1 font-mono text-[15px] font-semibold leading-snug tracking-tight" style={{ color: C.text }}>
            {value}
          </p>
          <p className="mt-2 text-[11px]" style={{ color: C.green }}>
            {trend}
          </p>
        </div>
      </div>
    </article>
  )
}

function OutlineBtn({
  icon,
  label,
  chevron,
  onClick,
  disabled,
  loading,
}: {
  icon: ReactNode
  label: string
  chevron?: boolean
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] disabled:opacity-50"
      style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
    >
      <span style={{ color: C.muted }}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}</span>
      {label}
      {chevron && <ChevronDown className="h-3 w-3" style={{ color: C.muted2 }} />}
    </button>
  )
}

type StatementRunStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Delivered' | 'Ready for Release' | 'Released'

function RunStatus({ status }: { status: StatementRunStatus }) {
  const styles: Record<StatementRunStatus, { bg: string; color: string; label: string }> = {
    Draft: { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8', label: 'Draft' },
    'Pending Approval': { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24', label: 'Pending Approval' },
    Approved: { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA', label: 'Approved' },
    Delivered: { bg: 'rgba(16,185,129,0.15)', color: ReconAccent.greenSoft, label: 'Delivered' },
    'Ready for Release': { bg: 'rgba(16,185,129,0.15)', color: ReconAccent.greenSoft, label: 'Ready for Release' },
    Released: { bg: 'rgba(16,185,129,0.15)', color: ReconAccent.greenSoft, label: 'Released' },
  }
  const tone = styles[status] ?? styles['Ready for Release']
  const showCheck = status === 'Released' || status === 'Delivered' || status === 'Approved'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: tone.bg, color: tone.color }}
    >
      {showCheck ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      {tone.label}
    </span>
  )
}

function PagerBtn({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn('flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30')}
      style={{ color: C.muted }}
    >
      {children}
    </button>
  )
}
