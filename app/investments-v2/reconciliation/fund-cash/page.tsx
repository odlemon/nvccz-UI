'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileWarning,
  Filter,
  Info,
  Landmark,
  ListFilter,
  Percent,
  Scale,
  Search,
  Settings,
  Upload,
  X,
} from 'lucide-react'
import { ReconApiBanner, ReconNavTabs } from '@/components/investments-v2/recon-ui'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import { unwrapList } from '@/lib/api/investment-ops-helpers'
import {
  mapFundSummaryKpis,
  mapFundWorkspace,
  opsErrorMessage,
  requireOpsData,
  type FundBreakRow,
  type FundSuggestion,
  type FundWorkspaceEntry,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type ResultTab = 'Matched' | 'Breaks' | 'Unmatched'

function formatAmt(n: number) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-${abs}` : abs
}

export default function FundCashReconciliationPage() {
  const [autoMatch, setAutoMatch] = useState(true)
  const [resultTab, setResultTab] = useState<ResultTab>('Breaks')
  const [selectedInternal, setSelectedInternal] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [selectedBreak, setSelectedBreak] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [comment, setComment] = useState('')
  const [internalQ, setInternalQ] = useState('')
  const [bankQ, setBankQ] = useState('')
  const [breakQ, setBreakQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [batchStatus, setBatchStatus] = useState<string>('—')
  const [kpis, setKpis] = useState(mapFundSummaryKpis(null))
  const [internalEntries, setInternalEntries] = useState<FundWorkspaceEntry[]>([])
  const [bankEntries, setBankEntries] = useState<FundWorkspaceEntry[]>([])
  const [breakRows, setBreakRows] = useState<FundBreakRow[]>([])
  const [matchedRows, setMatchedRows] = useState<FundBreakRow[]>([])
  const [unmatchedRows, setUnmatchedRows] = useState<FundBreakRow[]>([])
  const [suggestions, setSuggestions] = useState<FundSuggestion[]>([])
  const [rules, setRules] = useState<{ label: string; mode: string }[]>([])
  const [counts, setCounts] = useState({ matched: 0, breaks: 0, unmatched: 0 })

  const loadWorkspace = useCallback(async (id: string) => {
    const [wsRes, sumRes, batchSumRes] = await Promise.all([
      stockPickerCashApi.getBatchWorkspace(id),
      stockPickerCashApi.getFundCashSummary().catch(() => null),
      stockPickerCashApi.getBatchSummary(id).catch(() => null),
    ])
    const ws = requireOpsData(wsRes, 'batch workspace')
    const mapped = mapFundWorkspace(ws)
    setInternalEntries(mapped.internal)
    setBankEntries(mapped.external)
    setBreakRows(mapped.breaks)
    setMatchedRows(mapped.matched)
    setUnmatchedRows(mapped.unmatched)
    setSuggestions(mapped.suggestions)
    setCounts({
      matched: mapped.matchedCount,
      breaks: mapped.breakCount,
      unmatched: mapped.unmatchedCount,
    })
    setSelectedInternal(mapped.internal[0]?.id ?? '')
    setSelectedBank(mapped.external[0]?.id ?? '')
    setSelectedBreak(mapped.breaks[0]?.id ?? mapped.matched[0]?.id ?? '')
    const fundSummary = sumRes?.success && sumRes.data ? requireOpsData(sumRes, 'fund summary') : null
    const batchSummary =
      batchSumRes?.success && batchSumRes.data ? (requireOpsData(batchSumRes, 'batch summary') as Record<string, unknown>) : null
    setKpis(mapFundSummaryKpis(fundSummary, batchSummary))
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [batchesRes, rulesRes] = await Promise.all([
        stockPickerCashApi.listReconciliationBatches({ page: 1, pageSize: 20, reconType: 'CASH_STATEMENT' }),
        stockPickerCashApi.getActiveReconciliationRules().catch(() => null),
      ])
      const batchesData = requireOpsData(batchesRes, 'reconciliation batches')
      const batches = unwrapList<{ id: string; status?: string }>(batchesData)
      const batch = batches[0]
      if (!batch) {
        setBatchId(null)
        setBatchStatus('No batch')
        setInternalEntries([])
        setBankEntries([])
        setBreakRows([])
        setMatchedRows([])
        setUnmatchedRows([])
        setSuggestions([])
        setCounts({ matched: 0, breaks: 0, unmatched: 0 })
        const fundRes = await stockPickerCashApi.getFundCashSummary().catch(() => null)
        if (fundRes?.success && fundRes.data) {
          setKpis(mapFundSummaryKpis(requireOpsData(fundRes, 'fund summary')))
        }
      } else {
        setBatchId(batch.id)
        setBatchStatus(String(batch.status ?? 'OPEN'))
        await loadWorkspace(batch.id)
      }
      if (rulesRes?.success && rulesRes.data) {
        const list = unwrapList<Record<string, unknown>>(rulesRes.data)
        setRules(
          list.map((r) => ({
            label: String(r.name ?? r.label ?? r.ruleKey ?? 'Rule'),
            mode: String(r.mode ?? r.action ?? (r.autoMatch ? 'Auto-match' : 'Review')),
          })),
        )
      } else {
        setRules([])
      }
    } catch (e) {
      setError(opsErrorMessage(e, 'Unable to load fund cash reconciliation'))
      setInternalEntries([])
      setBankEntries([])
      setBreakRows([])
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [loadWorkspace])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const internalRows = useMemo(
    () =>
      internalEntries.filter(
        (r) => !internalQ || `${r.description} ${r.id}`.toLowerCase().includes(internalQ.toLowerCase()),
      ),
    [internalEntries, internalQ],
  )
  const bankRows = useMemo(
    () => bankEntries.filter((r) => !bankQ || `${r.description} ${r.id}`.toLowerCase().includes(bankQ.toLowerCase())),
    [bankEntries, bankQ],
  )
  const resultRows = resultTab === 'Matched' ? matchedRows : resultTab === 'Unmatched' ? unmatchedRows : breakRows
  const breaks = useMemo(
    () => resultRows.filter((r) => !breakQ || `${r.type} ${r.details} ${r.id}`.toLowerCase().includes(breakQ.toLowerCase())),
    [breakQ, resultRows],
  )
  const activeBreak = breaks.find((b) => b.id === selectedBreak) ?? breaks[0]
  const internalTotal = internalEntries.reduce((s, r) => s + r.amount, 0)
  const bankTotal = bankEntries.reduce((s, r) => s + r.amount, 0)

  const runRecon = async () => {
    if (!batchId) {
      setActionMsg('No reconciliation batch available to run.')
      return
    }
    setBusy(true)
    setActionMsg(null)
    try {
      await stockPickerCashApi.runReconciliationBatch(batchId)
      if (autoMatch) {
        await stockPickerCashApi.autoMatchBatch(batchId)
      }
      setActionMsg(autoMatch ? 'Reconciliation run + auto-match completed.' : 'Reconciliation run completed.')
      await loadWorkspace(batchId)
      setBatchStatus('RUNNING')
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Run failed'))
    } finally {
      setBusy(false)
    }
  }

  const confirmSuggestion = async (s: FundSuggestion) => {
    if (!batchId || !s.internalLineId || !s.externalLineId) {
      setActionMsg('Suggestion missing line ids for confirm.')
      return
    }
    setBusy(true)
    try {
      await stockPickerCashApi.confirmMatches({
        batchId,
        topology: 'ONE_TO_ONE',
        links: [
          {
            internalLineId: s.internalLineId,
            externalLineId: s.externalLineId,
            matchedAmount: '0.00',
          },
        ],
      })
      setActionMsg('Match confirmed.')
      await loadWorkspace(batchId)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Confirm match failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1680px] space-y-4">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Fund Cash Reconciliation</h1>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              Reconcile internal fund cash ledger against bank and custodian statements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GhostBtn icon={<Settings className="h-3.5 w-3.5" />}>Reconciliation Rules</GhostBtn>
            <GhostBtn icon={<Upload className="h-3.5 w-3.5" />}>Import Statements</GhostBtn>
            <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold text-white" style={{ background: C.blue }}>
              Actions
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />
        {actionMsg ? (
          <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">{actionMsg}</div>
        ) : null}

        <section className="flex flex-wrap items-end gap-3 rounded-[12px] border p-3" style={{ background: C.card, borderColor: C.cardBorder }}>
          <Field label="Fund" value={kpis.fundsLabel} className="min-w-[180px] flex-1" />
          <Field label="Batch" value={batchId ?? '—'} className="min-w-[180px] flex-1" />
          <Field label="Source" value="All" className="min-w-[120px]" />
          <label className="block min-w-[150px]">
            <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>As At</span>
            <span className="flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder }}>
              <Calendar className="h-3.5 w-3.5" style={{ color: C.muted }} />
              Today
            </span>
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-3 pb-0.5">
            <label className="inline-flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
              Auto-match
              <button
                type="button"
                role="switch"
                aria-checked={autoMatch}
                onClick={() => setAutoMatch((v) => !v)}
                className={cn('relative h-5 w-9 rounded-full transition', autoMatch ? 'bg-[#2563EB]' : 'bg-[#334155]')}
              >
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition', autoMatch ? 'left-4' : 'left-0.5')} />
              </button>
            </label>
            <button
              type="button"
              disabled={busy || !batchId}
              onClick={() => void runRecon()}
              className="inline-flex h-9 items-center rounded-full px-4 text-[12px] font-semibold text-white disabled:opacity-50"
              style={{ background: C.blue }}
            >
              {busy ? 'Running…' : 'Run Reconciliation'}
            </button>
            <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: C.greenSoft }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {batchStatus}
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi icon={<Landmark className="h-4 w-4 text-[#60A5FA]" />} iconBg="rgba(59,130,246,0.15)" label="Fund" value={kpis.fundsLabel} sub={kpis.totalCash} subTone={C.muted2} />
          <Kpi icon={<AlertTriangle className="h-4 w-4 text-[#F87171]" />} iconBg="rgba(239,68,68,0.15)" label="Open Breaks" value={String(kpis.openBreaks || counts.breaks)} sub="From fund-cash-summary / workspace" subTone={C.red} />
          <Kpi icon={<Scale className="h-4 w-4 text-[#FBBF24]" />} iconBg="rgba(245,158,11,0.15)" label="Unreconciled Value" value={kpis.unreconciledValue} sub="Open break variance" subTone={C.red} />
          <Kpi icon={<FileWarning className="h-4 w-4 text-[#C084FC]" />} iconBg="rgba(168,85,247,0.15)" label="Unmatched Items" value={String(kpis.awaitingStatements || counts.unmatched)} sub={kpis.awaitingValue} subTone={C.muted2} />
          <Kpi icon={<Percent className="h-4 w-4 text-[#34D399]" />} iconBg="rgba(16,185,129,0.15)" label="Reconciled % (Value)" value={kpis.matchRate} sub={kpis.matchRateTrend ? `${kpis.matchRateTrend} vs prior 7d` : 'Match rate'} subTone={C.green} />
        </section>

        <section className={cn('grid gap-3', panelOpen ? 'xl:grid-cols-[1fr_1fr_1fr_320px]' : 'xl:grid-cols-3')}>
          <Pane step={1} title="Internal Fund Cash Entries" count={internalEntries.length} source="Source: Internal ledger" total={formatAmt(internalTotal)} search={internalQ} onSearch={setInternalQ}>
            <EntryTable rows={internalRows} selectedId={selectedInternal} onSelect={setSelectedInternal} footer={`Showing ${internalRows.length} of ${internalEntries.length}`} />
          </Pane>
          <Pane step={2} title="Bank Statement Lines" count={bankEntries.length} source="Source: External statements" total={formatAmt(bankTotal)} search={bankQ} onSearch={setBankQ}>
            <EntryTable rows={bankRows} selectedId={selectedBank} onSelect={setSelectedBank} footer={`Showing ${bankRows.length} of ${bankEntries.length}`} />
          </Pane>
          <article className="flex min-h-[420px] flex-col overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="border-b px-3 py-3" style={{ borderColor: C.cardBorder }}>
              <div className="mb-2 flex items-center gap-2">
                <StepBadge n={3} />
                <h3 className="text-[13px] font-semibold">Matched Results / Break Analysis</h3>
              </div>
              <div className="flex flex-wrap gap-1 rounded-full border p-1" style={{ borderColor: C.controlBorder, background: C.control }}>
                {([
                  ['Matched', counts.matched, ReconAccent.green],
                  ['Breaks', counts.breaks, ReconAccent.red],
                  ['Unmatched', counts.unmatched, ReconAccent.amber],
                ] as const).map(([tab, count, tone]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setResultTab(tab)}
                    className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium', resultTab === tab ? 'bg-white' : '')}
                    style={{ color: resultTab === tab ? C.card : C.muted }}
                  >
                    {tab}
                    <span className="rounded-full px-1.5 text-[10px] font-semibold" style={{ color: tone, background: `${tone}22` }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <SearchField value={breakQ} onChange={setBreakQ} placeholder="Search breaks..." />
                <GhostBtn icon={<Filter className="h-3.5 w-3.5" />} compact>Filters</GhostBtn>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {breaks.length === 0 ? (
                <p className="px-3 py-8 text-center text-[12px]" style={{ color: C.muted2 }}>No {resultTab.toLowerCase()} items.</p>
              ) : (
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr style={{ color: C.muted2, borderBottom: `1px solid ${C.rowBorder}` }}>
                      {['ID', 'Date', 'Type', 'Details', 'Amount'].map((h) => (
                        <th key={h} className="px-2 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {breaks.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedBreak(row.id)
                          setPanelOpen(true)
                        }}
                        className="cursor-pointer"
                        style={{
                          borderBottom: `1px solid ${C.rowBorder}`,
                          background: selectedBreak === row.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                        }}
                      >
                        <td className="px-2 py-2 font-mono" style={{ color: C.blueLink }}>{row.id}</td>
                        <td className="px-2 py-2">{row.date}</td>
                        <td className="px-2 py-2">{row.type}</td>
                        <td className="px-2 py-2" style={{ color: C.muted }}>{row.details}</td>
                        <td className="px-2 py-2 text-right font-mono">{formatAmt(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          {panelOpen && activeBreak ? (
            <aside className="flex max-h-[640px] flex-col overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
              <div className="flex items-center justify-between border-b px-3 py-3" style={{ borderColor: C.cardBorder }}>
                <h3 className="text-[13px] font-semibold">Break Details</h3>
                <button type="button" onClick={() => setPanelOpen(false)} className="rounded-full p-1" style={{ color: C.muted }} aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[12px]">
                <p className="font-semibold">{activeBreak.type}</p>
                <p style={{ color: C.muted }}>{activeBreak.details}</p>
                <p className="font-mono">{formatAmt(activeBreak.amount)}</p>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="h-9 w-full rounded-full border px-3 text-[11px] outline-none"
                  style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                />
              </div>
              <div className="space-y-2 border-t p-3" style={{ borderColor: C.cardBorder }}>
                <button
                  type="button"
                  disabled={busy || !activeBreak.id}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      await stockPickerCashApi.markBreakReviewed(activeBreak.id, { notes: comment || undefined })
                      setActionMsg('Break marked reviewed.')
                      if (batchId) await loadWorkspace(batchId)
                    } catch (e) {
                      setActionMsg(opsErrorMessage(e, 'Mark reviewed failed'))
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="h-9 w-full rounded-full text-[11px] font-semibold text-white disabled:opacity-50"
                  style={{ background: C.blue }}
                >
                  Mark as Reviewed
                </button>
              </div>
            </aside>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[13px] font-semibold">Matching Suggestions</h3>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ border: `1px solid ${C.cardBorder}`, color: C.muted }}>
                {suggestions.length}
              </span>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-[12px]" style={{ color: C.muted2 }}>No suggestions.</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <div key={`${s.internal}-${s.bank}`} className="rounded-[10px] border p-3" style={{ borderColor: C.rowBorder, background: C.control }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{s.internal}</p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: C.muted2 }}>{s.bank}</p>
                        <p className="mt-1 text-[10px]" style={{ color: C.muted2 }}>{s.reason}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void confirmSuggestion(s)}
                        className="shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                        style={{ background: C.blue }}
                      >
                        Match
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: C.page }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.confidence)}%`, background: C.green }} />
                      </div>
                      <span className="text-[10px] font-medium" style={{ color: C.greenSoft }}>{s.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-3 flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold">Reconciliation Rules (Active)</h3>
              <Info className="h-3 w-3" style={{ color: C.muted2 }} />
            </div>
            {rules.length === 0 ? (
              <p className="text-[12px]" style={{ color: C.muted2 }}>No active rules returned.</p>
            ) : (
              <ul className="space-y-2.5">
                {rules.map((rule) => (
                  <li key={rule.label} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-3.5 w-3.5" style={{ color: C.greenSoft }} />
                      {rule.label}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: C.muted, background: C.control }}>
                      {rule.mode}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
    </main>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>{label}</span>
      <span className="flex h-9 items-center justify-between gap-2 rounded-[8px] border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder }}>
        <span className="truncate">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: C.muted2 }} />
      </span>
    </label>
  )
}

function Kpi({ icon, iconBg, label, value, sub, subTone }: { icon: ReactNode; iconBg: string; label: string; value: string; sub: string; subTone: string }) {
  return (
    <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ background: iconBg }}>{icon}</span>
        <span className="text-[12px] font-medium" style={{ color: C.muted }}>{label}</span>
      </div>
      <p className="mt-3 font-mono text-[16px] font-semibold">{value}</p>
      <p className="mt-1 text-[11px]" style={{ color: subTone }}>{sub}</p>
    </article>
  )
}

function Pane({
  step,
  title,
  count,
  source,
  total,
  search,
  onSearch,
  children,
}: {
  step: number
  title: string
  count: number
  source: string
  total: string
  search: string
  onSearch: (v: string) => void
  children: ReactNode
}) {
  return (
    <article className="flex min-h-[420px] flex-col overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="border-b px-3 py-3" style={{ borderColor: C.cardBorder }}>
        <div className="mb-1 flex items-center gap-2">
          <StepBadge n={step} />
          <h3 className="text-[13px] font-semibold">
            {title}{' '}
            <span className="font-normal" style={{ color: C.muted2 }}>({count})</span>
          </h3>
        </div>
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
          <span style={{ color: C.muted2 }}>{source}</span>
          <span className="font-mono font-medium">{total}</span>
        </div>
        <div className="flex gap-2">
          <SearchField value={search} onChange={onSearch} placeholder="Search entries..." />
          <GhostBtn icon={<ListFilter className="h-3.5 w-3.5" />} compact>Filters</GhostBtn>
        </div>
      </div>
      {children}
    </article>
  )
}

function EntryTable({
  rows,
  selectedId,
  onSelect,
  footer,
}: {
  rows: FundWorkspaceEntry[]
  selectedId: string
  onSelect: (id: string) => void
  footer: string
}) {
  return (
    <>
      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-[12px]" style={{ color: C.muted2 }}>No entries.</p>
        ) : (
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr style={{ color: C.muted2, borderBottom: `1px solid ${C.rowBorder}` }}>
                {['ID', 'Date', 'Description', 'Amount'].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  className="cursor-pointer"
                  style={{
                    borderBottom: `1px solid ${C.rowBorder}`,
                    background: selectedId === row.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                  }}
                >
                  <td className="px-2 py-2 font-mono" style={{ color: C.blueLink }}>{row.id}</td>
                  <td className="px-2 py-2">{row.date}</td>
                  <td className="px-2 py-2">{row.description}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatAmt(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="border-t px-3 py-2 text-[11px]" style={{ borderColor: C.cardBorder, color: C.muted2 }}>{footer}</div>
    </>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: C.blue }}>
      {n}
    </span>
  )
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-8 flex-1 items-center gap-2 rounded-full border px-2.5" style={{ background: C.control, borderColor: C.controlBorder }}>
      <Search className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[11px] outline-none" style={{ color: C.text }} />
    </label>
  )
}

function GhostBtn({ children, icon, compact }: { children: ReactNode; icon?: ReactNode; compact?: boolean }) {
  return (
    <button
      type="button"
      className={cn('inline-flex items-center gap-1.5 rounded-full border text-[11px]', compact ? 'h-8 px-2.5' : 'h-9 px-3')}
      style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
    >
      {icon && <span style={{ color: C.muted }}>{icon}</span>}
      {children}
    </button>
  )
}
