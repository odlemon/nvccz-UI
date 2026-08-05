'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import { OpsPanelSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchAccountingEvents,
  fetchJournalEntries,
  fetchJournalEntryDetail,
  fetchPortfolios,
  reverseAccountingEvent,
} from '@/lib/store/slices/investmentOpsSlice'
import { ConfirmReasonDialog } from '@/components/investments-v2/ui/confirm-reason-dialog'
import { formatMoneyDisplay, formatOpsError, investmentOpsApi, unwrapList, type AccountingEvent, type JournalEntry } from '@/lib/api/investment-ops-api'
import { cn } from '@/lib/utils'

const tabs = ['Accounting Events', 'Journals', 'Ledger Exports']

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function money(value: unknown, currency = 'USD') {
  const raw = formatMoneyDisplay(value)
  return currency === 'USD' ? `$${raw}` : `${currency} ${raw}`
}

function Drop({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex h-8 min-w-[140px] items-center justify-between rounded-full border border-[#354257] bg-[#101927] px-3 text-[10px] text-[#d4dbe5]">
        {value}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 min-w-full rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] ${o === value ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[.07]'}`}
            >
              {o}
              {o === value && <Check className="ml-3 h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Badge({ value }: { value: string }) {
  const upper = value.toUpperCase()
  const tone = ['POSTED', 'COMPLETED', 'APPROVED', 'READY', 'BALANCED'].some((x) => upper.includes(x))
    ? 'bg-emerald-400/10 text-emerald-300'
    : upper.includes('FAILED')
      ? 'bg-rose-400/10 text-rose-300'
      : 'bg-amber-400/10 text-amber-300'
  return <span className={`rounded-full px-2 py-1 text-[9px] ${tone}`}>{formatStatus(value)}</span>
}

function AccountingPageInner() {
  const searchParams = useSearchParams()
  const deepTab = searchParams.get('tab')
  const deepTradeRef = searchParams.get('tradeRef')
  const deepTradeId = searchParams.get('tradeId')
  const deepFundId = searchParams.get('fundId')
  const wantSelect = searchParams.get('select') === '1' || Boolean(deepTradeRef || deepTradeId)
  const hasDeepLink = Boolean(deepTradeRef || deepTradeId || deepTab === 'events' || deepTab === 'journals')

  const dispatch = useAppDispatch()
  const {
    portfolios,
    accountingEvents,
    accountingEventsTotal,
    accountingEventsLoading,
    accountingEventActionLoadingById,
    journalEntries,
    journalEntriesLoading,
    selectedJournalEntry,
    selectedJournalEntryLoading,
  } = useAppSelector((s) => s.investmentOps)

  const [tab, setTab] = useState('Accounting Events')
  const [portfolioFilter, setPortfolioFilter] = useState('All portfolios')
  const [status, setStatus] = useState('All statuses')
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reverseEvent, setReverseEvent] = useState<AccountingEvent | null>(null)
  const [reason, setReason] = useState('')
  const [journalPosting, setJournalPosting] = useState(false)
  const [journalLifecycleBusy, setJournalLifecycleBusy] = useState(false)
  const [journalRejectOpen, setJournalRejectOpen] = useState(false)
  const [ledgerCreating, setLedgerCreating] = useState(false)
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date()
    d.setUTCDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [ledgerExports, setLedgerExports] = useState<Record<string, unknown>[]>([])
  const [ledgerExportsLoading, setLedgerExportsLoading] = useState(false)
  const [ledgerDownloadId, setLedgerDownloadId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [deepLinkMsg, setDeepLinkMsg] = useState<string | null>(null)
  const deepLinkApplied = useRef<string | null>(null)
  const deepLinkFailed = useRef<string | null>(null)
  const preferredJournalId = useRef<string | null>(null)

  const selectedFundId = useMemo(() => {
    if (portfolioFilter === 'All portfolios') return undefined
    return portfolios.find((p) => p.name === portfolioFilter)?.id
  }, [portfolioFilter, portfolios])

  // Apply fund filter from blotter deep-link once portfolios are loaded
  useEffect(() => {
    if (!deepFundId || portfolios.length === 0) return
    const fund = portfolios.find((p) => p.id === deepFundId)
    if (fund) setPortfolioFilter(fund.name)
  }, [deepFundId, portfolios])

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    Promise.all([
      dispatch(fetchPortfolios()),
      dispatch(fetchAccountingEvents({ fundId: selectedFundId, pageSize: 100 })),
      dispatch(fetchJournalEntries({ fundId: selectedFundId })),
    ]).then((results) => {
      if (cancelled) return
      if (results.some((r) => r.meta.requestStatus === 'rejected')) {
        setLoadError('Unable to load accounting data from the server.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch, selectedFundId])

  useEffect(() => {
    // Don't steal focus when deep-linking a specific journal/trade
    if (preferredJournalId.current || deepTradeRef || deepTradeId) return
    if (journalEntries[0] && !selectedJournalEntry) {
      dispatch(fetchJournalEntryDetail(journalEntries[0].id))
    }
  }, [dispatch, journalEntries, selectedJournalEntry, deepTradeRef, deepTradeId])

  // Focus accounting event / journal from Blotter deep-link
  useEffect(() => {
    if (!hasDeepLink || accountingEventsLoading) return
    const key = `${deepTab ?? ''}|${deepTradeRef ?? ''}|${deepTradeId ?? ''}|${deepFundId ?? ''}`
    if (deepLinkApplied.current === key || deepLinkFailed.current === key) return

    if (deepTab === 'journals' && !deepTradeRef && !deepTradeId) {
      deepLinkApplied.current = key
      setTab('Journals')
      return
    }

    if (!deepTradeRef && !deepTradeId) {
      if (deepTab === 'events') {
        deepLinkApplied.current = key
        setTab('Accounting Events')
      }
      return
    }

    if (accountingEvents.length === 0 && !accountingEventsLoading) {
      const fundReady =
        !deepFundId || portfolios.some((p) => p.id === deepFundId && p.name === portfolioFilter)
      if (!fundReady) return
      deepLinkFailed.current = key
      setTab('Accounting Events')
      setDeepLinkMsg(
        `No accounting event found for trade ${deepTradeRef || deepTradeId}. It may still be posting.`,
      )
      return
    }

    const match =
      accountingEvents.find(
        (e) =>
          (deepTradeRef &&
            (e.tradeRef === deepTradeRef ||
              e.tradeRef?.toLowerCase() === deepTradeRef.toLowerCase() ||
              e.sourceId === deepTradeRef)) ||
          (deepTradeId && (e.sourceId === deepTradeId || e.id === deepTradeId)),
      ) ?? null

    if (!match) {
      const fundReady =
        !deepFundId || portfolios.some((p) => p.id === deepFundId && p.name === portfolioFilter)
      if (!fundReady || accountingEventsLoading) return
      deepLinkFailed.current = key
      setTab('Accounting Events')
      if (deepTradeRef) setSearch(deepTradeRef)
      setDeepLinkMsg(
        `Could not find accounting event for ${deepTradeRef || deepTradeId}. Check portfolio filter or wait for settle/post.`,
      )
      return
    }

    deepLinkApplied.current = key
    setSelectedEventId(match.id)
    setStatus('All statuses')
    if (wantSelect) {
      setSearch(match.tradeRef || deepTradeRef || match.id)
    }
    if (match.journalEntryId && wantSelect) {
      preferredJournalId.current = match.journalEntryId
      dispatch(fetchJournalEntryDetail(match.journalEntryId))
      setTab('Journals')
      setDeepLinkMsg(
        `Opened journal for ${match.tradeRef || match.id} (${match.eventType}). Switch to Accounting Events to see the event row.`,
      )
    } else {
      setTab('Accounting Events')
      setDeepLinkMsg(`Focused accounting event for ${match.tradeRef || match.id} (${match.eventType}).`)
    }
  }, [
    hasDeepLink,
    accountingEventsLoading,
    accountingEvents,
    deepTab,
    deepTradeRef,
    deepTradeId,
    deepFundId,
    wantSelect,
    dispatch,
    portfolios,
    portfolioFilter,
  ])

  useEffect(() => {
    if (!selectedEventId || tab !== 'Accounting Events') return
    const el = document.getElementById(selectedEventId)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedEventId, tab])
  useEffect(() => {
    if (tab !== 'Ledger Exports') return
    let cancelled = false
    setLedgerExportsLoading(true)
    investmentOpsApi
      .listLedgerExports({ fundId: selectedFundId, pageSize: 100 })
      .then((res) => {
        if (cancelled) return
        if (!res.success) {
          setLedgerExports([])
          return
        }
        setLedgerExports(unwrapList(res.data))
      })
      .catch(() => {
        if (!cancelled) setLedgerExports([])
      })
      .finally(() => {
        if (!cancelled) setLedgerExportsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab, selectedFundId])

  const fundName = (id: string) => portfolios.find((p) => p.id === id)?.name ?? '—'

  const statusOptions = useMemo(() => {
    const fromApi = Array.from(new Set(accountingEvents.map((e) => e.status).filter(Boolean)))
    return ['All statuses', ...fromApi]
  }, [accountingEvents])

  const filtered = useMemo(() => {
    return accountingEvents.filter((e) => {
      if (status !== 'All statuses' && e.status !== status) return false
      if (!search) return true
      const hay = `${e.id} ${e.tradeRef} ${e.sourceId} ${e.eventType} ${e.sourceType}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  }, [accountingEvents, search, status])

  const journal: JournalEntry | null = selectedJournalEntry
  const lines = journal?.journalEntryLines ?? []
  const debitTotal = lines.reduce((sum, line) => sum + Number(String(line.debitAmount || 0).replace(/,/g, '')), 0)
  const creditTotal = lines.reduce((sum, line) => sum + Number(String(line.creditAmount || 0).replace(/,/g, '')), 0)
  const isBalanced = lines.length > 0 && Math.abs(debitTotal - creditTotal) < 0.005

  const readyCount = accountingEvents.filter((e) => e.status?.toUpperCase().includes('READY')).length
  const failedCount = accountingEvents.filter((e) => e.status?.toUpperCase().includes('FAILED')).length
  const postedCount = accountingEvents.filter((e) => e.status?.toUpperCase() === 'POSTED').length

  const confirmReversal = async () => {
    if (!reverseEvent || !reason.trim()) return
    setActionError(null)
    try {
      await dispatch(reverseAccountingEvent({ id: reverseEvent.id, reason: reason.trim() })).unwrap()
      setReverseEvent(null)
      setReason('')
      dispatch(fetchAccountingEvents({ fundId: selectedFundId, pageSize: 100 }))
      dispatch(fetchJournalEntries({ fundId: selectedFundId }))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reverse accounting event')
    }
  }

  const selectJournal = (id: string) => {
    dispatch(fetchJournalEntryDetail(id))
  }

  const journalVersion = (j: JournalEntry) =>
    Number((j as JournalEntry & { version?: number; auditVersion?: number }).version ?? (j as JournalEntry & { auditVersion?: number }).auditVersion ?? j.auditTrailSequenceNumber ?? 0) || undefined

  const runJournalLifecycle = async (action: 'submit' | 'approve' | 'reject' | 'post', rejectReason?: string) => {
    if (!journal) return
    setActionError(null)
    setJournalLifecycleBusy(true)
    try {
      const expectedVersion = journalVersion(journal)
      let res
      if (action === 'submit') res = await investmentOpsApi.submitJournal(journal.id, { expectedVersion })
      else if (action === 'approve') res = await investmentOpsApi.approveJournal(journal.id, { expectedVersion })
      else if (action === 'reject') {
        if (!rejectReason?.trim()) return
        res = await investmentOpsApi.rejectJournal(journal.id, { reason: rejectReason.trim(), expectedVersion })
      } else {
        res = await investmentOpsApi.postJournal(journal.id, { expectedVersion })
      }
      if (!res.success) throw new Error(formatOpsError(res))
      dispatch(fetchJournalEntries({ fundId: selectedFundId }))
      dispatch(fetchJournalEntryDetail(journal.id))
      dispatch(fetchAccountingEvents({ fundId: selectedFundId, pageSize: 100 }))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : `Failed to ${action} journal`)
    } finally {
      setJournalLifecycleBusy(false)
      setJournalPosting(false)
    }
  }

  const postSelectedJournal = async () => {
    setJournalPosting(true)
    await runJournalLifecycle('post')
  }

  const createExport = async () => {
    const fundId = selectedFundId || portfolios[0]?.id
    if (!fundId) {
      setActionError('Select a portfolio (or ensure at least one portfolio exists) before creating a ledger export.')
      return
    }
    setActionError(null)
    setLedgerCreating(true)
    try {
      const res = await investmentOpsApi.createLedgerExport({
        fundId,
        from: exportFrom,
        to: exportTo,
        format: 'CSV',
      })
      if (!res.success) throw new Error(formatOpsError(res))
      const list = await investmentOpsApi.listLedgerExports({ fundId: selectedFundId, pageSize: 100 })
      if (list.success) setLedgerExports(unwrapList(list.data))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to create ledger export')
    } finally {
      setLedgerCreating(false)
    }
  }

  const downloadExport = async (id: string, batchRef?: string) => {
    setActionError(null)
    setLedgerDownloadId(id)
    try {
      const blob = await investmentOpsApi.downloadLedgerExport(id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${batchRef || id}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to download ledger export')
    } finally {
      setLedgerDownloadId(null)
    }
  }

  const cellValue = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = row[key]
      if (value != null && value !== '') return String(value)
    }
    return '—'
  }

  const journalStatus = journal?.status?.toUpperCase() ?? ''
  const journalDraftish = journal && ['DRAFT', 'NEW', 'OPEN', ''].includes(journalStatus)
  const journalSubmitted = journal && ['SUBMITTED', 'PENDING_APPROVAL', 'IN_REVIEW'].includes(journalStatus)
  const journalApproved = journal && ['APPROVED', 'READY', 'READY_TO_POST'].includes(journalStatus)
  const journalPostable = journal && !['POSTED', 'REVERSED', 'REJECTED'].includes(journalStatus) && (journalApproved || journalDraftish || journalSubmitted || isBalanced)

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(120deg,#182434,#101a29_58%,#0b1421)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Books &amp; records</p>
              <h1 className="mt-1 text-lg font-semibold">Investment accounting</h1>
              <p className="mt-1 text-[11px] text-[#8f9caf]">Control accounting events, balanced journals, postings and ledger delivery.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Events', String(accountingEventsTotal || accountingEvents.length)],
                ['Ready to post', String(readyCount)],
                ['Failed', String(failedCount)],
                ['Posted', String(postedCount)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3">
                  <p className="text-[9px] text-[#728197]">{l}</p>
                  <p className="mt-1 text-[15px] font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-white/[.05] bg-[#090f18]/70 p-1">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${tab === t ? 'bg-white text-[#101722]' : 'text-[#8e9bad] hover:bg-white/[.06] hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {loadError && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{loadError}</div>}
        {actionError && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{actionError}</div>}
        {deepLinkMsg && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[12px] text-blue-100">
            {deepLinkMsg}
            <button type="button" className="ml-3 rounded-full border border-white/10 px-3 py-1 text-[10px]" onClick={() => setDeepLinkMsg(null)}>
              Dismiss
            </button>
          </div>
        )}

        {tab === 'Accounting Events' && (
          <Card title="Accounting event register" subtitle="Trade Settlement · Dividend · Coupon Accrual · Fee · FX Revaluation · Corporate Action">
            <Toolbar>
              <div className="flex h-8 items-center gap-2 rounded-full border border-[#354257] bg-[#101927] px-3">
                <Search className="h-3 w-3 text-[#718096]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" className="w-28 bg-transparent text-[10px] outline-none" />
              </div>
              <Drop
                value={portfolioFilter}
                options={['All portfolios', ...portfolios.map((p) => p.name)]}
                onChange={setPortfolioFilter}
              />
              <Drop value={status} options={statusOptions} onChange={setStatus} />
            </Toolbar>
            <Table
              headers={['Event ID', 'Event type', 'Portfolio', 'Reference', 'Event date', 'Amount', 'Journal', 'Status', '']}
              loading={accountingEventsLoading}
              empty="No accounting events returned by the API."
              rows={filtered.map((e) => ({
                key: e.id,
                selected: selectedEventId === e.id,
                cells: [
                  `${e.eventType} · ${formatDate(e.postedAt || e.createdAt)}`,
                  e.eventType,
                  fundName(e.fundId),
                  e.tradeRef || e.sourceId || '—',
                  formatDate(e.postedAt || e.createdAt),
                  money(e.amount, e.currencyCode),
                  e.journalEntryId ? 'Linked journal' : '—',
                  <Badge key="s" value={e.status} />,
                  <button
                    key="r"
                    type="button"
                    disabled={e.status?.toUpperCase() === 'REVERSED' || !!accountingEventActionLoadingById[e.id]}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setReverseEvent(e)
                    }}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] hover:bg-white/10 disabled:opacity-40"
                  >
                    {e.status?.toUpperCase() === 'REVERSED' ? 'Reversed' : accountingEventActionLoadingById[e.id] ? '…' : 'Reverse'}
                  </button>,
                ],
                onClick: () => {
                  setSelectedEventId(e.id)
                  if (e.journalEntryId) {
                    preferredJournalId.current = e.journalEntryId
                    dispatch(fetchJournalEntryDetail(e.journalEntryId))
                  }
                },
              }))}
            />
          </Card>
        )}

        {tab === 'Journals' && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
            <Card title="Journal entries" subtitle="Select a journal to inspect its double-entry lines">
              <Table
                headers={['Journal', 'Reference', 'Description', 'Currency', 'Total', 'Status']}
                loading={journalEntriesLoading}
                empty="No journal entries returned by the API."
                rows={journalEntries.map((j) => ({
                  key: j.id,
                  selected: selectedJournalEntry?.id === j.id,
                  onClick: () => selectJournal(j.id),
                  cells: [
                    <span key="j" className="text-[#68a9ff]">
                      {j.referenceNumber || j.description || 'Journal entry'}
                    </span>,
                    j.referenceNumber || '—',
                    j.description || '—',
                    j.currency?.code || '—',
                    money(j.totalAmount, j.currency?.code || 'USD'),
                    <Badge key="s" value={j.status} />,
                  ],
                }))}
              />
            </Card>
            <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(145deg,#142030,#0d1623)] p-5">
              {selectedJournalEntryLoading && <OpsPanelSkeleton />}
              {!journal && !selectedJournalEntryLoading && (
                <p className="text-[11px] text-[#8290a4]">Select a journal to inspect lines.</p>
              )}
              {journal && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-[#8290a4]">{journal.referenceNumber || 'Journal entry'}</p>
                      <h2 className="mt-1 text-[12px] font-semibold">{journal.description || 'Journal entry'}</h2>
                    </div>
                    <Badge value={lines.length === 0 ? journal.status : isBalanced ? 'Balanced' : 'Out of balance'} />
                  </div>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.06]">
                    <table className="w-full text-[10px]">
                      <thead className="bg-[#09111d] text-[#718096]">
                        <tr>
                          <th className="p-3 text-left">Account</th>
                          <th className="p-3 text-right">Debit</th>
                          <th className="p-3 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[.05]">
                        {lines.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-[#8290a4]">
                              No journal lines on this entry.
                            </td>
                          </tr>
                        ) : (
                          lines.map((line) => (
                            <tr key={line.id}>
                              <td className="p-3 text-[#c6d0dc]">
                                {line.chartOfAccount
                                  ? `${line.chartOfAccount.accountNo} · ${line.chartOfAccount.accountName}`
                                  : line.description || line.chartOfAccountId}
                              </td>
                              <td className="p-3 text-right font-mono text-emerald-300">{money(line.debitAmount)}</td>
                              <td className="p-3 text-right font-mono text-rose-300">{money(line.creditAmount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {lines.length > 0 && (
                        <tfoot className="border-t border-white/10 bg-[#09111d] font-semibold">
                          <tr>
                            <td className="p-3">Totals</td>
                            <td className="p-3 text-right font-mono">{money(debitTotal)}</td>
                            <td className="p-3 text-right font-mono">{money(creditTotal)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                  {lines.length > 0 && (
                    <div
                      className={`mt-4 rounded-2xl border p-3 text-[10px] ${
                        isBalanced
                          ? 'border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300'
                          : 'border-rose-400/20 bg-rose-400/[.06] text-rose-300'
                      }`}
                    >
                      <Check className="mr-2 inline h-3.5 w-3.5" />
                      {isBalanced
                        ? 'Debit equals credit. Journal is balanced.'
                        : `Debits and credits differ by ${money(Math.abs(debitTotal - creditTotal))}.`}
                    </div>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    {journalDraftish && (
                      <button
                        type="button"
                        disabled={!isBalanced || journalLifecycleBusy}
                        onClick={() => void runJournalLifecycle('submit')}
                        className="h-10 w-full rounded-full border border-blue-400/40 text-[10px] font-semibold text-blue-200 disabled:opacity-50"
                      >
                        {journalLifecycleBusy ? 'Working…' : 'Submit journal'}
                      </button>
                    )}
                    {journalSubmitted && (
                      <>
                        <button
                          type="button"
                          disabled={journalLifecycleBusy}
                          onClick={() => void runJournalLifecycle('approve')}
                          className="h-10 w-full rounded-full border border-emerald-400/40 text-[10px] font-semibold text-emerald-200 disabled:opacity-50"
                        >
                          {journalLifecycleBusy ? 'Working…' : 'Approve journal'}
                        </button>
                        <button
                          type="button"
                          disabled={journalLifecycleBusy}
                          onClick={() => setJournalRejectOpen(true)}
                          className="h-10 w-full rounded-full border border-rose-400/30 text-[10px] font-semibold text-rose-300 disabled:opacity-50"
                        >
                          Reject journal
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={!journalPostable || journalPosting || journalLifecycleBusy || !isBalanced}
                      onClick={postSelectedJournal}
                      className="h-10 w-full rounded-full bg-[#2f87fa] text-[10px] font-semibold disabled:opacity-50"
                    >
                      {journalPosting || journalLifecycleBusy ? 'Posting…' : 'Post journal'}
                    </button>
                    <p className="text-[9px] text-[#718096]">Workflow: submit → approve → post (post may still work when BE allows direct post).</p>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {tab === 'Ledger Exports' && (
          <Card title="Ledger export history" subtitle="Create a CSV export of posted accounting events and journal lines">
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-white/[.05] bg-[#09111d]/50 p-4">
              <Drop
                value={portfolioFilter}
                options={['All portfolios', ...portfolios.map((p) => p.name)]}
                onChange={setPortfolioFilter}
              />
              <label className="block">
                <span className="mb-1.5 block text-[9px] text-[#718096]">From</span>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="h-9 rounded-full border border-[#354257] bg-[#101927] px-3 text-[10px] outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[9px] text-[#718096]">To</span>
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="h-9 rounded-full border border-[#354257] bg-[#101927] px-3 text-[10px] outline-none"
                />
              </label>
              <button
                type="button"
                disabled={ledgerCreating || !exportFrom || !exportTo}
                onClick={() => void createExport()}
                className="h-9 rounded-full bg-[#2f87fa] px-5 text-[10px] font-semibold text-white disabled:opacity-40"
              >
                {ledgerCreating ? 'Creating…' : 'Create ledger export'}
              </button>
              <p className="text-[9px] text-[#718096]">
                Uses selected portfolio filter, or the first portfolio when filter is All.
              </p>
            </div>
            <Table
              headers={['Export', 'Portfolio', 'Reference', 'Status', '']}
              loading={ledgerExportsLoading}
              empty="No ledger exports returned by the API."
              rows={ledgerExports.map((row) => {
                const id = cellValue(row, ['id'])
                const exportLabel = cellValue(row, ['exportBatchRef', 'reference', 'batchRef']) || 'Ledger export'
                const portfolio =
                  cellValue(row, ['fundName', 'portfolio']) !== '—'
                    ? cellValue(row, ['fundName', 'portfolio'])
                    : fundName(cellValue(row, ['fundId']))
                return [
                  exportLabel,
                  portfolio,
                  cellValue(row, ['exportBatchRef', 'reference']),
                  <Badge key="s" value={cellValue(row, ['status'])} />,
                  <button
                    key="d"
                    type="button"
                    disabled={ledgerDownloadId === id}
                    onClick={() => downloadExport(id, exportLabel !== '—' ? exportLabel : undefined)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] hover:bg-white/10 disabled:opacity-40"
                  >
                    {ledgerDownloadId === id ? '…' : 'Download'}
                  </button>,
                ]
              })}
            />
          </Card>
        )}
      </div>

      {reverseEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setReverseEvent(null)}>
          <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-[24px] border border-white/10 bg-[#111a28]">
            <div className="flex items-center justify-between border-b border-white/[.07] p-5">
              <div>
                <h2 className="text-sm font-semibold">Reverse accounting event</h2>
                <p className="mt-1 text-[10px] text-[#7890ad]">
                  {reverseEvent.eventType} · {reverseEvent.tradeRef || formatDate(reverseEvent.postedAt || reverseEvent.createdAt)}
                </p>
              </div>
              <button type="button" onClick={() => setReverseEvent(null)} className="rounded-full p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-2xl bg-[#09111d] p-4 text-[10px] text-[#96a3b4]">
                A balanced counter-entry will be created on the server. The original event remains linked in the audit trail.
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-[10px]">Reversal reason</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-[#354257] bg-[#0b1420] p-3 text-[10px] outline-none focus:border-[#2f87fa]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/[.07] p-4">
              <button type="button" onClick={() => setReverseEvent(null)} className="rounded-full border border-white/10 px-4 py-2 text-[10px]">
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason || !!accountingEventActionLoadingById[reverseEvent.id]}
                onClick={confirmReversal}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-[10px] font-semibold disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                Create reversal
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmReasonDialog
        open={journalRejectOpen}
        onOpenChange={setJournalRejectOpen}
        title="Reject journal"
        description={journal ? `Reject journal ${journal.journalRef ?? journal.id}?` : ''}
        reasonLabel="Rejection reason"
        confirmLabel="Reject journal"
        onConfirm={(r) => void runJournalLifecycle('reject', r)}
      />
    </main>
  )
}

export default function AccountingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#070b12] p-6 text-white">
          <OpsPanelSkeleton />
        </main>
      }
    >
      <AccountingPageInner />
    </Suspense>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-visible rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
      <div className="border-b border-white/[.06] p-4">
        <h2 className="text-[12px] font-semibold">{title}</h2>
        <p className="text-[9px] text-[#718096]">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-2 border-b border-white/[.05] p-3">{children}</div>
}

function Table({
  headers,
  rows,
  loading,
  empty,
}: {
  headers: string[]
  rows:
    | React.ReactNode[][]
    | Array<{
        key: string
        cells: React.ReactNode[]
        selected?: boolean
        onClick?: () => void
      }>
  loading?: boolean
  empty?: string
}) {
  const normalized = rows.map((row, i) => {
    if (Array.isArray(row)) {
      return { key: String(i), cells: row, selected: false, onClick: undefined as (() => void) | undefined }
    }
    return row
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-[10px]">
        <thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]">
          <tr>
            {headers.map((h, i) => (
              <th key={`${h}-${i}`} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[.045]">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="p-0">
                <OpsTableSkeleton rows={6} cols={headers.length} />
              </td>
            </tr>
          ) : normalized.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-[#8290a4]">
                {empty || 'No rows.'}
              </td>
            </tr>
          ) : (
            normalized.map((row) => (
              <tr
                key={row.key}
                id={row.key}
                className={cn(
                  'transition hover:bg-white/[.035]',
                  row.onClick && 'cursor-pointer',
                  row.selected && 'bg-blue-500/10 ring-1 ring-inset ring-blue-400/30',
                )}
                onClick={row.onClick}
              >
                {row.cells.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-[#c5cfdb] first:font-mono first:text-[#68a9ff]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
