'use client'

import { type ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Loader2,
  Percent,
  Plus,
  Scale,
  Search,
  Settings,
  Download,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import { ReconApiBanner, ReconNavTabs } from '@/components/investments-v2/recon-ui'
import { useRefetchLoading } from '@/components/investments-v2/hooks/use-refetch-loading'
import { RefetchOverlay } from '@/components/investments-v2/ui/refetch-overlay'
import { OpsKpiSkeleton, ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import { unwrapList } from '@/lib/api/investment-ops-helpers'
import {
  mapFundSummaryKpis,
  mapFundWorkspace,
  mapActiveReconciliationRules,
  formatBatchLabel,
  formatWorkspaceLineRef,
  mapImportLineErrors,
  opsErrorDetails,
  opsErrorMessage,
  requireOpsData,
  resolvePortfolioName,
  resolveCashAccountLabel,
  mapBatchReconcileLabels,
  mapCashAccountOptions,
  formatActivity,
  type FundBreakRow,
  type FundSuggestion,
  type FundWorkspaceEntry,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type ResultTab = 'Matched' | 'Breaks' | 'Unmatched'

const SESSION_KEY = 'investments-v2.cash-recon.session'

type CashReconSession = {
  batchId: string | null
  fundFilter: string
  autoMatch: boolean
}

function loadCashSession(): CashReconSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CashReconSession
  } catch {
    return null
  }
}

function saveCashSession(session: CashReconSession) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* quota / private mode */
  }
}

function formatAmt(n: number) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-${abs}` : abs
}

export default function FundCashReconciliationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-full bg-background p-5 sm:p-6">
          <p className="text-[13px] text-muted-foreground">Loading cash match…</p>
        </main>
      }
    >
      <FundCashReconciliationInner />
    </Suspense>
  )
}

function FundCashReconciliationInner() {
  const searchParams = useSearchParams()
  const deepFundId = searchParams.get('fundId')
  const saved = useMemo(() => loadCashSession(), [])
  const [autoMatch, setAutoMatch] = useState(saved?.autoMatch ?? true)
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
  const { isRefetching, withRefetch } = useRefetchLoading()
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<
    'run' | 'confirm' | 'match' | 'unmatch' | 'review' | null
  >(null)
  const busy = busyAction !== null
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)
  const [scopeAccountId, setScopeAccountId] = useState('all')
  const [batchId, setBatchId] = useState<string | null>(saved?.batchId ?? null)
  const [batchLabel, setBatchLabel] = useState('—')
  const [batchStatus, setBatchStatus] = useState<string>('—')
  const [fundFilter, setFundFilter] = useState(saved?.fundFilter ?? 'All funds')
  const [batches, setBatches] = useState<
    {
      id: string
      label: string
      cashAccountId?: string
      currency?: string
      periodFrom?: string
      periodTo?: string
      status?: string
      updatedAt?: string
    }[]
  >([])
  const [kpis, setKpis] = useState(mapFundSummaryKpis(null))
  const [internalEntries, setInternalEntries] = useState<FundWorkspaceEntry[]>([])
  const [bankEntries, setBankEntries] = useState<FundWorkspaceEntry[]>([])
  const [breakRows, setBreakRows] = useState<FundBreakRow[]>([])
  const [matchedRows, setMatchedRows] = useState<FundBreakRow[]>([])
  const [unmatchedRows, setUnmatchedRows] = useState<FundBreakRow[]>([])
  const [suggestions, setSuggestions] = useState<FundSuggestion[]>([])
  const [rules, setRules] = useState<{ label: string; mode: string }[]>([])
  const [counts, setCounts] = useState({ matched: 0, breaks: 0, unmatched: 0 })
  const [batchOpen, setBatchOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [cashAccounts, setCashAccounts] = useState<{ id: string; label: string; currency?: string; fundId?: string }[]>([])
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([])
  const [layouts, setLayouts] = useState<{ id: string; name: string }[]>([])
  const [batchAccountId, setBatchAccountId] = useState('')
  const [batchCurrency, setBatchCurrency] = useState('USD')
  const [batchFrom, setBatchFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [batchTo, setBatchTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [batchBusy, setBatchBusy] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [importAccountId, setImportAccountId] = useState('')
  const [importProviderId, setImportProviderId] = useState('')
  const [importLayoutId, setImportLayoutId] = useState('')
  const [importCurrency, setImportCurrency] = useState('USD')
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importErrors, setImportErrors] = useState<{ line?: string; field?: string; code?: string; message?: string }[]>([])
  const [unmatchReason, setUnmatchReason] = useState('')
  const [batchListFilter, setBatchListFilter] = useState<'ALL' | 'DRAFT' | 'COMPLETED'>('ALL')
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null)
  const selectedBatchIdRef = useRef<string | null>(saved?.batchId ?? null)

  const loadWorkspace = useCallback(async (id: string) => {
    setWorkspaceLoading(true)
    try {
      const summaryFundId = fundFilter !== 'All funds' ? funds.find((f) => f.name === fundFilter)?.id : undefined
      const [wsRes, sumRes, batchSumRes] = await Promise.all([
        stockPickerCashApi.getBatchWorkspace(id),
        stockPickerCashApi.getFundCashSummary(summaryFundId ? { fundId: summaryFundId } : undefined).catch(() => null),
        stockPickerCashApi.getBatchSummary(id).catch(() => null),
      ])
      const ws = requireOpsData(wsRes, 'batch workspace') as Record<string, unknown>
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
      setSelectedInternal(mapped.internal.find((e) => String(e.matchStatus ?? '').toUpperCase() !== 'MATCHED')?.id ?? mapped.internal[0]?.id ?? '')
      setSelectedBank(mapped.external.find((e) => String(e.matchStatus ?? '').toUpperCase() !== 'MATCHED')?.id ?? mapped.external[0]?.id ?? '')
      setSelectedBreak(
        mapped.breaks[0]?.id ?? mapped.matched[0]?.id ?? mapped.unmatched[0]?.id ?? '',
      )
      const runAt =
        ws.lastRunAt ??
        ws.lastReconciledAt ??
        ws.runAt ??
        ws.completedAt ??
        ws.updatedAt ??
        (batchSumRes?.success && batchSumRes.data
          ? (requireOpsData(batchSumRes, 'batch summary') as Record<string, unknown>).lastRunAt ??
            (requireOpsData(batchSumRes, 'batch summary') as Record<string, unknown>).updatedAt
          : undefined)
      if (runAt) setLastRunAt(formatActivity(runAt))
      if (ws.status) setBatchStatus(String(ws.status))
      const fundSummary = sumRes?.success && sumRes.data ? requireOpsData(sumRes, 'fund summary') : null
      const batchSummary =
        batchSumRes?.success && batchSumRes.data
          ? (requireOpsData(batchSumRes, 'batch summary') as Record<string, unknown>)
          : null
      const fundId = (fundSummary as { fundId?: string } | null)?.fundId
      setKpis(
        mapFundSummaryKpis(
          fundSummary,
          batchSummary,
          resolvePortfolioName(fundId, funds),
        ),
      )
      return mapped
    } finally {
      setWorkspaceLoading(false)
    }
  }, [fundFilter, funds])

  const selectBatch = useCallback(
    async (id: string | null) => {
      selectedBatchIdRef.current = id
      if (!id) {
        setBatchId(null)
        setBatchLabel('No batch')
        setBatchStatus('No batch')
        setLastRunAt(null)
        setInternalEntries([])
        setBankEntries([])
        setBreakRows([])
        setMatchedRows([])
        setUnmatchedRows([])
        setSuggestions([])
        setCounts({ matched: 0, breaks: 0, unmatched: 0 })
        return
      }
      const b = batches.find((x) => x.id === id)
      setBatchId(id)
      setBatchLabel(b?.label ?? '—')
      setBatchStatus(String(b?.status ?? 'OPEN'))
      await loadWorkspace(id)
    },
    [batches, loadWorkspace],
  )

  const loadMasters = useCallback(async () => {
    try {
      const [accountsRes, fundsRes, providersRes, layoutsRes] = await Promise.all([
        stockPickerCashApi.listClientCashAccounts({ page: 1, pageSize: 100 }),
        investmentOpsApi.listPortfolios().catch(() => null),
        stockPickerCashApi.listSetupProviders({ page: 1, pageSize: 100 }).catch(() => null),
        stockPickerCashApi.listSetupFileLayouts({ page: 1, pageSize: 100 }).catch(() => null),
      ])
      if (accountsRes.success) {
        const rawAccounts = unwrapList<Record<string, unknown>>(accountsRes.data)
        const rows = mapCashAccountOptions(accountsRes.data).map((a) => {
          const raw = rawAccounts.find((r) => String(r.id) === a.id)
          return {
            ...a,
            currency:
              raw?.baseCurrency != null
                ? String(raw.baseCurrency)
                : raw?.currency != null
                  ? String(raw.currency)
                  : 'USD',
            fundId: raw?.fundId != null ? String(raw.fundId) : undefined,
          }
        })
        // Keep prior reference when unchanged — avoids refresh↔masters loops
        setCashAccounts((prev) =>
          prev.length === rows.length &&
          prev.every((p, i) => p.id === rows[i]?.id && p.label === rows[i]?.label && p.currency === rows[i]?.currency)
            ? prev
            : rows,
        )
        setBatchAccountId((prev) => prev || rows[0]?.id || '')
        setImportAccountId((prev) => prev || rows[0]?.id || '')
        if (rows[0]?.currency) {
          setBatchCurrency((prev) => (prev === 'USD' || !prev ? rows[0]!.currency! : prev))
          setImportCurrency((prev) => (prev === 'USD' || !prev ? rows[0]!.currency! : prev))
        }
      }
      if (fundsRes && fundsRes.success !== false) {
        const fundRows = unwrapList<{ id?: string; name?: string }>(fundsRes.data).map((f) => ({
          id: String(f.id ?? ''),
          name: String(f.name ?? f.id ?? 'Fund'),
        })).filter((f) => f.id)
        setFunds((prev) =>
          prev.length === fundRows.length && prev.every((p, i) => p.id === fundRows[i]?.id && p.name === fundRows[i]?.name)
            ? prev
            : fundRows,
        )
      }
      if (providersRes && (providersRes as { success?: boolean }).success !== false) {
        const provRows = unwrapList<Record<string, unknown>>((providersRes as { data?: unknown }).data).map((p) => ({
          id: String(p.id ?? p.providerId ?? ''),
          name: String(p.name ?? p.code ?? p.id ?? 'Provider'),
        })).filter((p) => p.id)
        setProviders((prev) =>
          prev.length === provRows.length && prev.every((p, i) => p.id === provRows[i]?.id && p.name === provRows[i]?.name)
            ? prev
            : provRows,
        )
        setImportProviderId((prev) => prev || provRows[0]?.id || '')
      }
      if (layoutsRes && (layoutsRes as { success?: boolean }).success !== false) {
        const layoutRows = unwrapList<Record<string, unknown>>((layoutsRes as { data?: unknown }).data).map((l) => ({
          id: String(l.id ?? l.layoutId ?? ''),
          name: String(l.name ?? l.code ?? l.id ?? 'Layout'),
        })).filter((l) => l.id)
        setLayouts((prev) =>
          prev.length === layoutRows.length && prev.every((p, i) => p.id === layoutRows[i]?.id && p.name === layoutRows[i]?.name)
            ? prev
            : layoutRows,
        )
        setImportLayoutId((prev) => prev || layoutRows[0]?.id || '')
      }
    } catch {
      /* masters optional for read of existing batches */
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Masters are loaded once on mount (and on explicit actions) — not here.
      // Calling setCashAccounts/setFunds inside refresh caused an infinite reload loop.
      const fundId = fundFilter !== 'All funds' ? funds.find((f) => f.name === fundFilter)?.id : undefined
      const [batchesRes, rulesRes] = await Promise.all([
        stockPickerCashApi.listReconciliationBatches({
          page: 1,
          pageSize: 50,
          reconType: 'CASH_STATEMENT',
          ...(fundId ? { fundId } : {}),
        }),
        stockPickerCashApi.getActiveReconciliationRules().catch(() => null),
      ])
      const batchesData = requireOpsData(batchesRes, 'reconciliation batches')
      const batchItems = unwrapList<{
        id: string
        status?: string
        periodFrom?: string
        periodTo?: string
        currency?: string
        cashAccountId?: string
        updatedAt?: string
      }>(batchesData)
      const mappedBatches = batchItems.map((b) => ({
        id: b.id,
        label: formatBatchLabel(b, resolveCashAccountLabel(b.cashAccountId, cashAccounts)),
        cashAccountId: b.cashAccountId,
        currency: b.currency,
        periodFrom: b.periodFrom,
        periodTo: b.periodTo,
        status: b.status,
        updatedAt: b.updatedAt,
      }))
      setBatches(mappedBatches)
      const scoped =
        scopeAccountId === 'all'
          ? mappedBatches
          : mappedBatches.filter((b) => b.cashAccountId === scopeAccountId)
      const keepId = selectedBatchIdRef.current
      const batch =
        (keepId ? mappedBatches.find((b) => b.id === keepId) : undefined) ??
        scoped[0] ??
        mappedBatches[0]
      if (!batch) {
        selectedBatchIdRef.current = null
        setBatchId(null)
        setBatchLabel('No batch')
        setBatchStatus('No batch')
        setLastRunAt(null)
        setInternalEntries([])
        setBankEntries([])
        setBreakRows([])
        setMatchedRows([])
        setUnmatchedRows([])
        setSuggestions([])
        setCounts({ matched: 0, breaks: 0, unmatched: 0 })
        const fundRes = await stockPickerCashApi
          .getFundCashSummary(fundId ? { fundId } : undefined)
          .catch(() => null)
        if (fundRes?.success && fundRes.data) {
          setKpis(mapFundSummaryKpis(requireOpsData(fundRes, 'fund summary')))
        }
      } else {
        selectedBatchIdRef.current = batch.id
        setBatchId(batch.id)
        setBatchLabel(batch.label)
        setBatchStatus(String(batch.status ?? 'OPEN'))
        await loadWorkspace(batch.id)
      }
      if (rulesRes?.success && rulesRes.data) {
        const mappedRules = mapActiveReconciliationRules(requireOpsData(rulesRes, 'active rules'))
        setRules(mappedRules)
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
  }, [cashAccounts, fundFilter, funds, loadWorkspace, scopeAccountId])

  const currencyOptions = useMemo(() => {
    const fromAccounts = cashAccounts.map((a) => a.currency).filter(Boolean) as string[]
    return Array.from(new Set(['USD', 'ZWL', 'ZWG', ...fromAccounts]))
  }, [cashAccounts])

  const scopedBatches = useMemo(
    () =>
      scopeAccountId === 'all'
        ? batches
        : batches.filter((b) => b.cashAccountId === scopeAccountId),
    [batches, scopeAccountId],
  )

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === batchId) ?? null,
    [batchId, batches],
  )

  const filteredBatchList = useMemo(() => {
    return batches.filter((b) => {
      const status = String(b.status ?? '').toUpperCase()
      const completed = status === 'COMPLETED' || status === 'CLOSED'
      if (batchListFilter === 'DRAFT') return !completed
      if (batchListFilter === 'COMPLETED') return completed
      return true
    })
  }, [batches, batchListFilter])

  useEffect(() => {
    void loadMasters()
  }, [loadMasters])

  useEffect(() => {
    if (!deepFundId || funds.length === 0) return
    const match = funds.find((f) => f.id === deepFundId)
    if (!match) return
    setFundFilter((prev) => (prev === match.name ? prev : match.name))
  }, [deepFundId, funds])

  useEffect(() => {
    void withRefetch(refresh)
  }, [refresh, withRefetch])

  useEffect(() => {
    saveCashSession({
      batchId,
      fundFilter,
      autoMatch,
    })
  }, [batchId, fundFilter, autoMatch])

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
    setBusyAction('run')
    setActionMsg(null)
    try {
      await stockPickerCashApi.runReconciliationBatch(batchId)
      if (autoMatch) {
        await stockPickerCashApi.autoMatchBatch(batchId)
      }
      setLastRunAt(formatActivity(new Date().toISOString()))
      setActionMsg(autoMatch ? 'Reconciliation run + auto-match completed.' : 'Reconciliation run completed.')
      const mapped = await loadWorkspace(batchId)
      if (mapped.matchedCount > 0) setResultTab('Matched')
      else if (mapped.unmatchedCount > 0) setResultTab('Unmatched')
      else if (mapped.breakCount > 0) setResultTab('Breaks')
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Run failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const confirmSuggestion = async (s: FundSuggestion) => {
    if (!batchId || !s.internalLineId || !s.externalLineId) {
      setActionMsg('Suggestion missing line ids for confirm.')
      return
    }
    if (s.hardRuleFailed || s.band === 'none') {
      setActionMsg('Hard-rule failure or weak score — cannot confirm this suggestion (SRD 12.4).')
      return
    }
    if (s.band === 'weak') {
      setActionMsg('Weak suggestion (0.65–0.85) is for investigation only — not confirmable without authorization.')
      return
    }
    setBusyAction('confirm')
    try {
      const internalAmt = Math.abs(internalEntries.find((e) => e.id === s.internalLineId)?.amount ?? 0)
      const externalAmt = Math.abs(bankEntries.find((e) => e.id === s.externalLineId)?.amount ?? 0)
      const matchedAmount =
        s.matchedAmount ||
        String(Math.min(internalAmt || externalAmt, externalAmt || internalAmt) || 0)
      await stockPickerCashApi.confirmMatches({
        batchId,
        topology: 'ONE_TO_ONE',
        links: [
          {
            internalLineId: s.internalLineId,
            externalLineId: s.externalLineId,
            matchedAmount,
          },
        ],
      })
      setActionMsg('Match confirmed.')
      await loadWorkspace(batchId)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Confirm match failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const manualMatchSelected = async () => {
    if (!batchId || !selectedInternal || !selectedBank) {
      setActionMsg('Select one internal line and one bank line to match.')
      return
    }
    const internalRow = internalEntries.find((e) => e.id === selectedInternal)
    const bankRow = bankEntries.find((e) => e.id === selectedBank)
    if (String(internalRow?.matchStatus ?? '').toUpperCase() === 'MATCHED' || String(bankRow?.matchStatus ?? '').toUpperCase() === 'MATCHED') {
      setActionMsg('Those lines are already matched. Pick unmatched lines, or unmatch first.')
      return
    }
    setBusyAction('match')
    try {
      const internalAmt = Math.abs(internalEntries.find((e) => e.id === selectedInternal)?.amount ?? 0)
      const externalAmt = Math.abs(bankEntries.find((e) => e.id === selectedBank)?.amount ?? 0)
      const matchedAmount = String(Math.min(internalAmt || externalAmt, externalAmt || internalAmt) || 0)
      await stockPickerCashApi.manualMatch({
        batchId,
        topology: 'ONE_TO_ONE',
        links: [
          {
            internalLineId: selectedInternal,
            externalLineId: selectedBank,
            matchedAmount,
          },
        ],
        reason: comment || 'Manual match',
      })
      setActionMsg('Manual match created.')
      setComment('')
      await loadWorkspace(batchId)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Manual match failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const unmatchSelected = async () => {
    const linkId = selectedBreak || matchedRows.find((m) => m.id)?.id
    if (!linkId) {
      setActionMsg('Select a matched row to unmatch.')
      return
    }
    if (!unmatchReason.trim()) {
      setActionMsg('Unmatch requires a reason (SRD REC-003).')
      return
    }
    setBusyAction('unmatch')
    try {
      await stockPickerCashApi.reverseMatch(linkId, { reason: unmatchReason.trim() })
      setActionMsg('Match reversed — original link retained in history.')
      setUnmatchReason('')
      if (batchId) await loadWorkspace(batchId)
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Unmatch failed'))
    } finally {
      setBusyAction(null)
    }
  }

  const resetImportReview = () => {
    setImportFileName('')
    setImportErrors([])
    setImportError(null)
  }

  const applyImportFailure = (e: unknown, fallback: string) => {
    const details = opsErrorDetails(e)
    const fromDetails = details?.errors != null ? mapImportLineErrors(details.errors) : []
    setImportErrors(fromDetails)
    const msg = opsErrorMessage(e, fallback)
    setImportError(fromDetails.length ? `${msg}` : msg)
  }

  const ingestViaLegacySteps = async (payload: Record<string, unknown>) => {
    const createRes = await stockPickerCashApi.createExternalStatementImport(payload)
    const created = requireOpsData(createRes, 'create statement import') as { id?: string }
    if (!created.id) throw new Error('Import created without id')
    const validateRes = await stockPickerCashApi.validateExternalStatementImport(created.id, {})
    const validated = requireOpsData(validateRes, 'validate statement import') as Record<string, unknown>
    const failed =
      String(validated.status ?? '').toUpperCase() === 'VALIDATION_FAILED' ||
      validated.valid === false ||
      (Array.isArray(validated.errors) && (validated.errors as unknown[]).length > 0)
    if (failed) {
      const errs = mapImportLineErrors(validated.errors)
      const err = new Error(
        errs.length
          ? errs.map((x) => `${x.line ? `Line ${x.line}` : x.code || 'File'}: ${x.message}`).join('; ')
          : 'Statement file failed validation',
      ) as Error & { details?: { errors: unknown } }
      err.details = { errors: validated.errors }
      throw err
    }
    const movements = String(
      (validated.controlTotals as { movements?: unknown } | undefined)?.movements ?? '0.00',
    )
    await stockPickerCashApi.submitExternalStatementImport(created.id)
    const commitRes = await stockPickerCashApi.commitExternalStatementImport(created.id, {
      controlOpening: '0.00',
      controlClosing: movements,
    })
    const committed = requireOpsData(commitRes, 'commit statement import') as { matchingBatchId?: string }
    // Live API still auto-creates a one-day batch and matches there, which hides
    // lines on the batch the user is actually looking at. Drop that stray batch.
    if (committed.matchingBatchId && committed.matchingBatchId !== batchId) {
      await stockPickerCashApi.deleteReconciliationBatch(committed.matchingBatchId).catch(() => null)
    }
  }

  const ingestStatementFile = async (file: File) => {
    if (!importAccountId || !importProviderId) {
      setImportError('Cash account and provider are required')
      return
    }
    setImportBusy(true)
    setImportError(null)
    setImportErrors([])
    setImportFileName(file.name)
    try {
      const rawContent = await file.text()
      const buf = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
      const fileHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const payload = {
        providerId: importProviderId,
        cashAccountId: importAccountId,
        currency: importCurrency || 'USD',
        fileName: file.name,
        fileHash,
        rawContent,
      }
      try {
        await stockPickerCashApi.ingestExternalStatementImport(payload)
      } catch (e) {
        const status = e && typeof e === 'object' && 'status' in e ? Number((e as { status: number }).status) : 0
        const msg = opsErrorMessage(e, '')
        const ingestMissing =
          status === 404 ||
          status === 405 ||
          (/ingest/i.test(msg) && /not found|cannot post|cannot get/i.test(msg))
        if (!ingestMissing) throw e
        await ingestViaLegacySteps(payload)
      }
      setImportOpen(false)
      resetImportReview()
      setActionMsg('Statement imported. Next: Run Reconciliation.')
      await refresh()
    } catch (e) {
      applyImportFailure(e, 'Import failed')
    } finally {
      setImportBusy(false)
    }
  }

  const createBatch = async () => {
    if (!batchAccountId) {
      setBatchError('Select a cash account')
      return
    }
    setBatchBusy(true)
    setBatchError(null)
    try {
      const res = await stockPickerCashApi.createReconciliationBatch({
        cashAccountId: batchAccountId,
        currency: batchCurrency || 'USD',
        periodFrom: batchFrom,
        periodTo: batchTo,
        reconType: 'CASH_STATEMENT',
        autoMatchEnabled: autoMatch,
      })
      const data = requireOpsData(res, 'create reconciliation batch') as { id?: string }
      if (!data.id) throw new Error('Batch created without id')
      selectedBatchIdRef.current = data.id
      setBatchId(data.id)
      setBatchOpen(false)
      setActionMsg('Batch created. Next: Import Statements, then Run Reconciliation.')
      await refresh()
      await selectBatch(data.id)
    } catch (e) {
      setBatchError(opsErrorMessage(e, 'Failed to create batch'))
    } finally {
      setBatchBusy(false)
    }
  }

  const deleteBatch = async (id: string) => {
    if (!window.confirm('Delete this cash match batch? Matches on it will be cleared. Bank statement files stay.')) {
      return
    }
    setDeleteBusyId(id)
    try {
      const res = await stockPickerCashApi.deleteReconciliationBatch(id)
      if (res && 'success' in res && res.success === false) {
        throw new Error(opsErrorMessage(res, 'Failed to delete batch'))
      }
      if (selectedBatchIdRef.current === id) {
        selectedBatchIdRef.current = null
        setBatchId(null)
        setBatchLabel('No batch')
      }
      setActionMsg('Batch deleted.')
      await refresh()
    } catch (e) {
      setActionMsg(opsErrorMessage(e, 'Failed to delete batch'))
    } finally {
      setDeleteBusyId(null)
    }
  }

  const reconcileLabels = mapBatchReconcileLabels(batchStatus, counts.breaks, counts.unmatched)

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1680px] space-y-4">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Cash match</h1>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              Our cash ledger vs bank statement (custodian trust account cash).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GhostBtn
              icon={<Settings className="h-3.5 w-3.5" />}
              onClick={() => setActionMsg(rules.length ? `Active rules: ${rules.map((r) => r.label).join(', ')}` : 'No active rules returned by API.')}
            >
              Reconciliation Rules
            </GhostBtn>
            <GhostBtn icon={<Upload className="h-3.5 w-3.5" />} onClick={() => {
              resetImportReview()
              if (selectedBatch?.cashAccountId) setImportAccountId(selectedBatch.cashAccountId)
              if (selectedBatch?.currency) setImportCurrency(selectedBatch.currency)
              setImportOpen(true)
            }}>
              Import Statements
            </GhostBtn>
            <button
              type="button"
              onClick={() => { setBatchError(null); setBatchOpen(true) }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold text-white"
              style={{ background: C.blue }}
            >
              New batch
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={false} error={error} />
        {actionMsg ? (
          <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">{actionMsg}</div>
        ) : null}

        <section className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[13px] font-semibold">Batches</h2>
              <p className="text-[11px]" style={{ color: C.muted }}>
                Drafts stay here until you finish. Click a row to resume.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'DRAFT', 'COMPLETED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={cn(
                    'h-8 rounded-full px-3 text-[11px]',
                    batchListFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-muted text-muted-foreground',
                  )}
                  onClick={() => setBatchListFilter(f)}
                >
                  {f === 'ALL' ? 'All' : f === 'DRAFT' ? 'Drafts' : 'Completed'}
                </button>
              ))}
            </div>
          </div>
          {filteredBatchList.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              No {batchListFilter === 'ALL' ? '' : `${batchListFilter.toLowerCase()} `}batches yet. Click New batch to start.
            </p>
          ) : (
            <div className="mt-3 max-h-[220px] overflow-auto overscroll-contain rounded-xl border border-border/50">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 z-[1]" style={{ background: C.card }}>
                  <tr className="border-b border-border text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>
                    <th className="px-3 py-2">Account</th>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">Currency</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredBatchList.map((b) => {
                    const active = batchId === b.id
                    const completed = ['COMPLETED', 'CLOSED'].includes(String(b.status ?? '').toUpperCase())
                    return (
                      <tr
                        key={b.id}
                        className={cn('border-b border-border/50', active && 'bg-primary/10')}
                      >
                        <td className="px-3 py-2 font-medium">
                          {resolveCashAccountLabel(b.cashAccountId, cashAccounts, b.label)}
                        </td>
                        <td className="px-3 py-2">
                          {b.periodFrom || b.periodTo
                            ? `${shortDateLabel(b.periodFrom)} – ${shortDateLabel(b.periodTo)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">{b.currency || '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                              completed
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400',
                            )}
                          >
                            {String(b.status ?? 'OPEN').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="h-7 rounded-full px-3 text-[10px] font-medium"
                              style={{ background: C.control, color: C.text }}
                              onClick={() => void selectBatch(b.id)}
                            >
                              {active ? 'Open' : 'Resume'}
                            </button>
                            <button
                              type="button"
                              disabled={deleteBusyId != null}
                              className="inline-flex h-7 items-center gap-1 rounded-full px-3 text-[10px] font-medium text-rose-300 disabled:opacity-50"
                              style={{ background: 'rgba(244,63,94,0.12)' }}
                              onClick={() => void deleteBatch(b.id)}
                            >
                              {deleteBusyId === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {loading ? (
          <div className="space-y-3">
            <OpsKpiSkeleton count={5} />
            <div className="grid gap-3 xl:grid-cols-3">
              <div className="overflow-hidden rounded-[12px] border border-border"><ReconTableSkeleton rows={6} cols={4} /></div>
              <div className="overflow-hidden rounded-[12px] border border-border"><ReconTableSkeleton rows={6} cols={4} /></div>
              <div className="overflow-hidden rounded-[12px] border border-border"><ReconTableSkeleton rows={6} cols={4} /></div>
            </div>
          </div>
        ) : (
        <>
        <section className="flex flex-wrap items-end gap-3 rounded-[12px] border p-3" style={{ background: C.card, borderColor: C.cardBorder }}>
          <label className="block min-w-[180px] flex-1">
            <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>Fund</span>
            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="h-9 w-full rounded-[8px] border px-3 text-[12px] outline-none"
              style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
            >
              <option value="All funds">All funds</option>
              {funds.map((f) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </label>
          <label className="block min-w-[220px] flex-1">
            <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>Batch</span>
            <select
              value={batchId ?? ''}
              onChange={(e) => {
                void selectBatch(e.target.value || null)
              }}
              className="h-9 w-full rounded-[8px] border px-3 text-[12px] outline-none"
              style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
            >
              {scopedBatches.length === 0 && <option value="">No batch</option>}
              {scopedBatches.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="block min-w-[180px]">
            <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>Scope (cash account)</span>
            <select
              value={scopeAccountId}
              onChange={(e) => {
                const next = e.target.value
                setScopeAccountId(next)
                const nextBatch =
                  next === 'all'
                    ? batches[0]
                    : batches.find((b) => b.cashAccountId === next)
                if (nextBatch) void selectBatch(nextBatch.id)
              }}
              className="h-9 w-full rounded-[8px] border px-3 text-[12px] outline-none"
              style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
            >
              <option value="all">All accounts in fund</option>
              {cashAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </label>
          <label className="block min-w-[150px]">
            <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>As At</span>
            <span className="flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder }}>
              <Calendar className="h-3.5 w-3.5" style={{ color: C.muted }} />
              {selectedBatch?.periodTo ? shortDateLabel(selectedBatch.periodTo) : 'Today'}
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
              disabled={busyAction === 'run' || !batchId}
              onClick={() => void runRecon()}
              className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-semibold text-white disabled:opacity-50"
              style={{ background: C.blue }}
            >
              {busyAction === 'run' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {busyAction === 'run' ? 'Running…' : 'Run Reconciliation'}
            </button>
            <span className="inline-flex flex-col items-end gap-0.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5" style={{ color: reconcileLabels.balanced === 'Balanced' ? C.greenSoft : C.amber }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {reconcileLabels.balanced}
              </span>
              <span style={{ color: reconcileLabels.fullyReconciled === 'Fully reconciled' ? C.greenSoft : C.muted2 }}>
                {reconcileLabels.fullyReconciled} · {batchStatus}
              </span>
              {lastRunAt && (
                <span style={{ color: C.muted2 }}>Last run: {lastRunAt}</span>
              )}
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

        <section className={cn('relative grid gap-3', panelOpen ? 'xl:grid-cols-[1fr_1fr_1fr_320px]' : 'xl:grid-cols-3')}>
          <RefetchOverlay active={isRefetching || workspaceLoading} rows={6} cols={4} className="rounded-[12px]" />
          {workspaceLoading ? (
            <>
              <div className="overflow-hidden rounded-[12px] border border-border"><ReconTableSkeleton rows={6} cols={4} /></div>
              <div className="overflow-hidden rounded-[12px] border border-border"><ReconTableSkeleton rows={6} cols={4} /></div>
              <div className="overflow-hidden rounded-[12px] border border-border"><ReconTableSkeleton rows={6} cols={4} /></div>
            </>
          ) : (
          <>
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
                      {['Date', 'Type', 'Details', 'Amount'].map((h) => (
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
          </>
          )}

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
                  disabled={busyAction === 'match' || busyAction !== null && busyAction !== 'match' || !selectedInternal || !selectedBank}
                  onClick={() => void manualMatchSelected()}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full text-[11px] font-semibold text-white disabled:opacity-50"
                  style={{ background: C.blue }}
                >
                  {busyAction === 'match' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Confirm manual match
                </button>
                <input
                  value={unmatchReason}
                  onChange={(e) => setUnmatchReason(e.target.value)}
                  placeholder="Unmatch reason (required)"
                  className="h-8 w-full rounded-full border px-3 text-[11px] outline-none"
                  style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                />
                <button
                  type="button"
                  disabled={busyAction === 'unmatch' || (busyAction !== null && busyAction !== 'unmatch') || !unmatchReason.trim()}
                  onClick={() => void unmatchSelected()}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border text-[11px] font-semibold disabled:opacity-50"
                  style={{ borderColor: C.cardBorder, color: C.red }}
                >
                  {busyAction === 'unmatch' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Unmatch (reversal)
                </button>
                <button
                  type="button"
                  disabled={busyAction === 'review' || (busyAction !== null && busyAction !== 'review') || !activeBreak.id}
                  onClick={async () => {
                    setBusyAction('review')
                    try {
                      await stockPickerCashApi.markBreakReviewed(activeBreak.id, { notes: comment || undefined })
                      setActionMsg('Break marked reviewed.')
                      if (batchId) await loadWorkspace(batchId)
                    } catch (e) {
                      setActionMsg(opsErrorMessage(e, 'Mark reviewed failed'))
                    } finally {
                      setBusyAction(null)
                    }
                  }}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full text-[11px] font-semibold text-white disabled:opacity-50"
                  style={{ background: C.control }}
                >
                  {busyAction === 'review' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
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
              <span className="text-[10px]" style={{ color: C.muted2 }}>
                ≥95% auto · 85–95% confirm · 65–85% investigate · &lt;65% none
              </span>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-[12px]" style={{ color: C.muted2 }}>No suggestions.</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s) => {
                  const bandLabel =
                    s.hardRuleFailed ? 'Hard rule blocked' : s.band === 'auto' ? 'Auto-match eligible' : s.band === 'suggested' ? 'Suggested' : s.band === 'weak' ? 'Weak (investigate)' : 'Below threshold'
                  const canConfirm = !s.hardRuleFailed && (s.band === 'auto' || s.band === 'suggested')
                  return (
                  <div key={`${s.internal}-${s.bank}`} className="rounded-[10px] border p-3" style={{ borderColor: C.rowBorder, background: C.control }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{s.internal}</p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: C.muted2 }}>{s.bank}</p>
                        <p className="mt-1 text-[10px]" style={{ color: C.muted2 }}>{s.reason}</p>
                        <p className="mt-1 text-[10px] font-medium" style={{ color: s.hardRuleFailed ? C.red : C.muted }}>
                          {bandLabel}
                          {s.hardRuleReason ? ` — ${s.hardRuleReason}` : ''}
                        </p>
                        {(s.scoreAmount != null ||
                          s.scoreDate != null ||
                          s.scoreReference != null ||
                          s.scoreCounterparty != null) && (
                          <p className="mt-1 text-[9px]" style={{ color: C.muted2 }}>
                            Amt {s.scoreAmount != null ? Math.round(Number(s.scoreAmount) * 100) : '—'}%
                            {s.weightAmount != null ? `×${Math.round(Number(s.weightAmount) * 100)}` : ''}
                            {s.weightedAmount != null ? `=${Math.round(Number(s.weightedAmount) * 100)}` : ''}
                            {' · '}Date {s.scoreDate != null ? Math.round(Number(s.scoreDate) * 100) : '—'}%
                            {s.weightDate != null ? `×${Math.round(Number(s.weightDate) * 100)}` : ''}
                            {' · '}Ref {s.scoreReference != null ? Math.round(Number(s.scoreReference) * 100) : '—'}%
                            {' · '}Cpty{' '}
                            {s.scoreCounterparty != null ? Math.round(Number(s.scoreCounterparty) * 100) : '—'}%
                          </p>
                        )}
                        {s.hardFailures && s.hardFailures.length > 0 && (
                          <ul className="mt-1 list-disc pl-3 text-[9px] text-rose-300">
                            {s.hardFailures.map((h) => (
                              <li key={h}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={(busyAction !== null && busyAction !== 'confirm') || !canConfirm}
                        onClick={() => void confirmSuggestion(s)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                        style={{ background: C.blue }}
                      >
                        {busyAction === 'confirm' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {canConfirm ? 'Confirm' : 'Blocked'}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: C.page }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.confidence)}%`, background: C.green }} />
                      </div>
                      <span className="text-[10px] font-medium" style={{ color: C.greenSoft }}>{s.confidence}%</span>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </article>

          <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-3 flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold">Reconciliation Rules (Active)</h3>
              <Info className="h-3 w-3" style={{ color: C.muted2 }} />
            </div>
            {rules.length === 0 ? (
              <p className="text-[12px]" style={{ color: C.muted2 }}>
                No active reconciliation rules configured. Seed match-weight and hard rules via setup.
              </p>
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
        </>
        )}
      </div>

      {batchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setBatchOpen(false)}>
          <div className="w-full max-w-md rounded-[16px] border p-5" style={{ background: C.card, borderColor: C.cardBorder }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">New reconciliation batch</h2>
              <button type="button" onClick={() => setBatchOpen(false)} className="rounded-full p-1"><X className="h-4 w-4" /></button>
            </div>
            {batchError && <p className="mt-3 text-[11px] text-rose-300">{batchError}</p>}
            <div className="mt-4 space-y-3">
              <label className="block text-[11px]" style={{ color: C.muted2 }}>
                Cash account
                <select
                  value={batchAccountId}
                  onChange={(e) => {
                    const id = e.target.value
                    setBatchAccountId(id)
                    const acct = cashAccounts.find((a) => a.id === id)
                    if (acct?.currency) setBatchCurrency(acct.currency)
                  }}
                  className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]"
                  style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                >
                  <option value="">Select…</option>
                  {cashAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px]" style={{ color: C.muted2 }}>
                Currency
                <select
                  value={batchCurrency}
                  onChange={(e) => setBatchCurrency(e.target.value)}
                  className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]"
                  style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px]" style={{ color: C.muted2 }}>
                  From
                  <input type="date" value={batchFrom} onChange={(e) => setBatchFrom(e.target.value)} className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }} />
                </label>
                <label className="block text-[11px]" style={{ color: C.muted2 }}>
                  To
                  <input type="date" value={batchTo} onChange={(e) => setBatchTo(e.target.value)} className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }} />
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <GhostBtn onClick={() => setBatchOpen(false)}>Cancel</GhostBtn>
              <button type="button" disabled={batchBusy} onClick={() => void createBatch()} className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-semibold text-white disabled:opacity-50" style={{ background: C.blue }}>
                {batchBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {batchBusy ? 'Creating…' : 'Create batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setImportOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[16px] border p-5" style={{ background: C.card, borderColor: C.cardBorder }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Import bank statement</h2>
              <button type="button" onClick={() => setImportOpen(false)} className="rounded-full p-1"><X className="h-4 w-4" /></button>
            </div>
            {importError && <p className="mt-3 text-[11px] text-rose-300">{importError}</p>}

            <div className="mt-4 space-y-3">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[12px] font-medium"
                style={{ borderColor: C.cardBorder, color: C.text }}
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = '/demo-templates/cash-recon/bank-statement-template.csv'
                  a.download = 'bank-statement-template.csv'
                  a.click()
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Download blank template
              </button>
              <label className="block text-[11px]" style={{ color: C.muted2 }}>
                Cash account
                <select value={importAccountId} onChange={(e) => setImportAccountId(e.target.value)} className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
                  <option value="">Select…</option>
                  {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </label>
              <label className="block text-[11px]" style={{ color: C.muted2 }}>
                Provider
                <select value={importProviderId} onChange={(e) => setImportProviderId(e.target.value)} className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
                  <option value="">Select…</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="block text-[11px]" style={{ color: C.muted2 }}>
                Currency
                <select
                  value={importCurrency}
                  onChange={(e) => setImportCurrency(e.target.value)}
                  className="mt-1 h-9 w-full rounded-full border px-3 text-[12px]"
                  style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className={cn('mt-2 flex h-28 cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed text-[11px]', importBusy && 'pointer-events-none opacity-70')} style={{ borderColor: C.controlBorder, color: C.muted }}>
                {importBusy ? (
                  <Loader2 className="mb-2 h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="mb-2 h-5 w-5" />
                )}
                {importBusy ? 'Importing…' : 'Select CSV'}
                <span className="mt-1 text-[10px]" style={{ color: C.muted2 }}>
                  File is validated and posted in one step
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,text/csv"
                  className="hidden"
                  disabled={importBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void ingestStatementFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
              {importFileName && !importBusy && (
                <p className="text-[11px]" style={{ color: C.muted }}>{importFileName}</p>
              )}
              {importErrors.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-[12px] border p-3" style={{ borderColor: C.cardBorder }}>
                  <p className="mb-1 text-[11px] font-medium text-rose-300">Fix these and choose the file again</p>
                  {importErrors.map((err, i) => (
                    <p key={`${err.code}-${i}`} className="text-[11px] text-rose-200">
                      {err.line ? `Line ${err.line}` : err.field ? err.field : 'File'}
                      {err.code ? ` [${err.code}]` : ''}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function shortDateLabel(value: unknown) {
  if (value == null || value === '') return 'Today'
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
                {['Date', 'Description', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const matched = String(row.matchStatus ?? '').toUpperCase() === 'MATCHED'
                return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  className="cursor-pointer"
                  style={{
                    borderBottom: `1px solid ${C.rowBorder}`,
                    background: selectedId === row.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                    opacity: matched ? 0.7 : 1,
                  }}
                >
                  <td className="px-2 py-2">{row.date}</td>
                  <td className="px-2 py-2">{formatWorkspaceLineRef(row.description, row.id, index)}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatAmt(row.amount)}</td>
                  <td className="px-2 py-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: matched ? C.greenSoft : C.amber,
                        background: matched ? `${C.greenSoft}22` : `${C.amber}22`,
                      }}
                    >
                      {matched ? 'Matched' : 'Open'}
                    </span>
                  </td>
                </tr>
                )
              })}
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

function GhostBtn({ children, icon, compact, onClick }: { children: ReactNode; icon?: ReactNode; compact?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-full border text-[11px]', compact ? 'h-8 px-2.5' : 'h-9 px-3')}
      style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
    >
      {icon && <span style={{ color: C.muted }}>{icon}</span>}
      {children}
    </button>
  )
}
