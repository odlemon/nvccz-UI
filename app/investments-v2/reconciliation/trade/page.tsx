'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Check, Download, Loader2, Upload } from 'lucide-react'
import { ReconApiBanner, ReconNavTabs, reconCard, reconInput, reconPill, reconPrimaryPill } from '@/components/investments-v2/recon-ui'
import {
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type TradeReconBatch,
  type TradeReconException,
  type TradeReconLeg,
  type TradeReconMatch,
} from '@/lib/api/investment-ops-api'
import { R as C } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STEPS = [
  'Create batch',
  'Ingest broker',
  'Ingest bank / custodian',
  'Run match',
  'Matches & complete',
] as const

const SESSION_KEY = 'investments-v2.trade-recon.session'

type TradeReconSession = {
  step: number
  fundId: string
  asOfDate: string
  batchId: string | null
  brokerCsv: string
  custodianCsv: string
  writeOffReason: string
  tradeFilter: string
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function exceptionsFromBatch(batch: TradeReconBatch | null): TradeReconException[] {
  if (!batch) return []
  if (Array.isArray(batch.exceptions)) return batch.exceptions
  const nested = batch.summary?.exceptions
  if (Array.isArray(nested)) return nested as TradeReconException[]
  return []
}

function loadSession(): TradeReconSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TradeReconSession
  } catch {
    return null
  }
}

function saveSession(session: TradeReconSession) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* quota / private mode */
  }
}

function clearSession() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

function dash(v: unknown): string {
  const s = v == null ? '' : String(v).trim()
  return s || '—'
}

function isoDate(v: unknown): string | null {
  if (v == null || v === '') return null
  const s = String(v)
  if (s.length >= 10) return s.slice(0, 10)
  return s
}

type ReconLine = {
  source?: string
  instrumentSymbol?: string | null
  side?: string | null
  quantity?: string | number | null
  price?: string | number | null
  tradeDate?: string | null
  externalRef?: string | null
  currencyCode?: string | null
  matchedTradeRef?: string | null
  _matchedTradeId?: string | null
  matchedTradeId?: string | null
}

function lineToLeg(line: ReconLine | undefined | null): TradeReconLeg | null {
  if (!line) return null
  return {
    symbol: line.instrumentSymbol ?? null,
    side: line.side ?? null,
    qty: line.quantity != null ? String(line.quantity) : null,
    price: line.price != null ? String(line.price) : null,
    date: isoDate(line.tradeDate),
    ref: line.externalRef ?? null,
    currency: line.currencyCode ?? null,
  }
}

function findMatchedLine(lines: ReconLine[], source: 'BROKER' | 'CUSTODIAN', match: TradeReconMatch): ReconLine | undefined {
  const src = source
  const tradeId = String(match.id ?? '').replace(/^match_/, '')
  return (
    lines.find(
      (l) =>
        String(l.source ?? '').toUpperCase() === src &&
        match.tradeRef &&
        String(l.matchedTradeRef ?? '') === String(match.tradeRef),
    ) ||
    lines.find(
      (l) =>
        String(l.source ?? '').toUpperCase() === src &&
        tradeId &&
        String(l._matchedTradeId ?? l.matchedTradeId ?? '') === tradeId,
    )
  )
}

function mergeLeg(primary?: TradeReconLeg | null, fallback?: TradeReconLeg | null): TradeReconLeg {
  return {
    symbol: primary?.symbol ?? fallback?.symbol ?? null,
    side: primary?.side ?? fallback?.side ?? null,
    qty: primary?.qty ?? fallback?.qty ?? null,
    price: primary?.price ?? fallback?.price ?? null,
    date: isoDate(primary?.date) ?? isoDate(fallback?.date),
    ref: primary?.ref ?? fallback?.ref ?? null,
    currency: primary?.currency ?? fallback?.currency ?? null,
  }
}

function legsForMatch(match: TradeReconMatch, batch: TradeReconBatch | null): {
  us: TradeReconLeg
  broker: TradeReconLeg
  custodian: TradeReconLeg
} {
  const lines = Array.isArray(batch?.lines) ? (batch!.lines as ReconLine[]) : []
  const brokerLine = findMatchedLine(lines, 'BROKER', match)
  const custodianLine = findMatchedLine(lines, 'CUSTODIAN', match)
  const usFallback: TradeReconLeg = {
    symbol: match.symbol ?? null,
    side: match.side ?? null,
    qty: match.internalQty ?? null,
    price: match.price ?? null,
    date: isoDate(batch?.asOfDate),
    ref: match.tradeRef ?? null,
    currency: null,
  }
  const brokerFallback: TradeReconLeg = {
    ...lineToLeg(brokerLine),
    qty: match.brokerQty ?? lineToLeg(brokerLine)?.qty ?? null,
  }
  const custodianFallback: TradeReconLeg = {
    ...lineToLeg(custodianLine),
    qty: match.custodianQty ?? lineToLeg(custodianLine)?.qty ?? null,
  }
  const broker = mergeLeg(match.broker, brokerFallback)
  const custodian = mergeLeg(match.custodian, custodianFallback)
  const us = mergeLeg(match.us, usFallback)
  if (!us.currency) us.currency = broker.currency ?? custodian.currency ?? null
  if (!us.date) us.date = broker.date ?? custodian.date ?? isoDate(batch?.asOfDate)
  return { us, broker, custodian }
}

type LegKey = 'us' | 'broker' | 'custodian'

const LEG_PANELS: { key: LegKey; title: string; source: string; panel: string; heading: string }[] = [
  {
    key: 'us',
    title: 'Internal',
    source: 'Blotter',
    panel: 'border-sky-500/30 bg-sky-500/[0.06]',
    heading: 'text-sky-300',
  },
  {
    key: 'broker',
    title: 'Broker',
    source: 'Broker statement',
    panel: 'border-violet-500/30 bg-violet-500/[0.06]',
    heading: 'text-violet-300',
  },
  {
    key: 'custodian',
    title: 'Bank / Custodian',
    source: 'Custodian statement',
    panel: 'border-cyan-500/30 bg-cyan-500/[0.06]',
    heading: 'text-cyan-300',
  },
]

/** Ref is informational — each party has its own reference, so it never counts as a break. */
const COMPARE_FIELDS: { key: keyof TradeReconLeg; label: string }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'side', label: 'Side' },
  { key: 'qty', label: 'Quantity' },
  { key: 'price', label: 'Price' },
  { key: 'date', label: 'Trade date' },
  { key: 'currency', label: 'Currency' },
]

function canonical(value: string): string {
  const n = Number(value)
  if (value.trim() !== '' && Number.isFinite(n)) return String(n)
  return value.trim().toUpperCase()
}

type FieldComparison = {
  values: Record<LegKey, string>
  differs: Record<LegKey, boolean>
  disagree: boolean
}

function compareField(legs: Record<LegKey, TradeReconLeg>, key: keyof TradeReconLeg): FieldComparison {
  const values: Record<LegKey, string> = {
    us: dash(legs.us[key]),
    broker: dash(legs.broker[key]),
    custodian: dash(legs.custodian[key]),
  }
  const present = LEG_PANELS.map((p) => p.key).filter((k) => values[k] !== '—')
  const reference = values.us !== '—' ? values.us : present.length ? values[present[0]] : '—'
  const differs: Record<LegKey, boolean> = { us: false, broker: false, custodian: false }
  let disagree = false
  for (const k of present) {
    if (canonical(values[k]) !== canonical(reference)) {
      differs[k] = true
      disagree = true
    }
  }
  return { values, differs, disagree }
}

function legIsEmpty(leg: TradeReconLeg): boolean {
  return COMPARE_FIELDS.every((f) => dash(leg[f.key]) === '—') && dash(leg.ref) === '—'
}

function MatchComparison({ match, batch }: { match: TradeReconMatch; batch: TradeReconBatch | null }) {
  const legs = legsForMatch(match, batch)
  const comparisons = COMPARE_FIELDS.map((field) => ({ field, ...compareField(legs, field.key) }))
  const breakCount = comparisons.filter((c) => c.disagree).length
  const detailFields = comparisons.filter((c) => c.field.key !== 'qty' && c.field.key !== 'price')

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-background/40">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold">{dash(match.symbol)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{dash(match.tradeRef)}</span>
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            {String(match.how ?? 'AUTO')}
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium',
            breakCount === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400',
          )}
        >
          {breakCount === 0 ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {breakCount === 0
            ? 'All three agree'
            : `${breakCount} field${breakCount === 1 ? '' : 's'} differ`}
        </span>
      </header>

      <div className="grid gap-3 p-3 md:grid-cols-3">
        {LEG_PANELS.map((panel) => {
          const leg = legs[panel.key]
          const empty = legIsEmpty(leg)
          const qty = comparisons.find((c) => c.field.key === 'qty')
          const price = comparisons.find((c) => c.field.key === 'price')
          return (
            <section key={panel.key} className={cn('rounded-2xl border p-3', panel.panel)}>
              <div className="flex items-baseline justify-between gap-2">
                <h4 className={cn('text-[12px] font-semibold', panel.heading)}>{panel.title}</h4>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{panel.source}</span>
              </div>

              {empty ? (
                <p className="py-6 text-center text-[11px] text-muted-foreground">No statement line</p>
              ) : (
                <>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        'font-mono text-[20px] font-semibold leading-none',
                        qty?.differs[panel.key] && 'text-amber-400',
                      )}
                    >
                      {qty?.values[panel.key] ?? '—'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">@</span>
                    <span
                      className={cn(
                        'font-mono text-[13px]',
                        price?.differs[panel.key] && 'text-amber-400',
                      )}
                    >
                      {price?.values[panel.key] ?? '—'}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1.5">
                    {detailFields.map((c) => (
                      <div key={c.field.key} className="flex items-baseline justify-between gap-2">
                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {c.field.label}
                        </dt>
                        <dd
                          className={cn(
                            'font-mono text-[11px]',
                            c.differs[panel.key] && 'text-amber-400',
                          )}
                        >
                          {c.values[panel.key]}
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-2 border-t border-border/50 pt-1.5">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Ref</dt>
                      <dd className="max-w-[60%] truncate font-mono text-[10px] text-muted-foreground" title={dash(leg.ref)}>
                        {dash(leg.ref)}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </section>
          )
        })}
      </div>
    </article>
  )
}

export default function TradeReconPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-full bg-background p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
          <p className="text-[13px]" style={{ color: C.muted }}>
            Loading trade recon…
          </p>
        </main>
      }
    >
      <TradeReconPageInner />
    </Suspense>
  )
}

function TradeReconPageInner() {
  const searchParams = useSearchParams()
  const deepTradeId = searchParams.get('tradeId')
  const deepFundId = searchParams.get('fundId')
  const saved = useMemo(() => loadSession(), [])

  const [step, setStep] = useState(() => Math.min(saved?.step ?? 0, STEPS.length - 1))
  const [error, setError] = useState<string | null>(null)
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [fundId, setFundId] = useState(saved?.fundId ?? '')
  const [asOfDate, setAsOfDate] = useState(
    () => saved?.asOfDate ?? new Date().toISOString().slice(0, 10),
  )
  const [batch, setBatch] = useState<TradeReconBatch | null>(null)
  const [brokerCsv, setBrokerCsv] = useState(saved?.brokerCsv ?? '')
  const [custodianCsv, setCustodianCsv] = useState(saved?.custodianCsv ?? '')
  const [writeOffReason, setWriteOffReason] = useState(saved?.writeOffReason ?? '')
  const [tradeFilter, setTradeFilter] = useState(saved?.tradeFilter ?? deepTradeId ?? '')
  const [sessionReady, setSessionReady] = useState(!saved?.batchId)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const busy = busyAction != null
  const [batchList, setBatchList] = useState<TradeReconBatch[]>([])
  const [batchListFilter, setBatchListFilter] = useState<'ALL' | 'DRAFT' | 'COMPLETED'>('ALL')
  const [batchListLoading, setBatchListLoading] = useState(false)

  useEffect(() => {
    if (deepTradeId) setTradeFilter(deepTradeId)
  }, [deepTradeId])

  const refreshBatch = useCallback(async (id: string) => {
    const res = await investmentOpsApi.getTradeReconBatch(id)
    if (res.success === false) throw new Error(formatOpsError(res, 'Failed to load batch'))
    if (res.data) setBatch(res.data)
    return res.data ?? null
  }, [])

  const refreshBatchList = useCallback(async (fund?: string) => {
    setBatchListLoading(true)
    try {
      const res = await investmentOpsApi.listTradeReconBatches({
        fundId: fund || undefined,
        limit: 50,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Failed to load batches'))
      const payload = res.data as { items?: TradeReconBatch[] } | TradeReconBatch[] | null | undefined
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : unwrapList<TradeReconBatch>(payload)
      setBatchList(items)
    } catch (e) {
      console.warn(e)
    } finally {
      setBatchListLoading(false)
    }
  }, [])

  const stepForStatus = (status?: string) => {
    const s = String(status ?? '').toUpperCase()
    if (s === 'COMPLETED' || s === 'MATCHED') return 4
    if (s === 'INGESTED') return 3
    if (s === 'OPEN') return 1
    return 0
  }

  useEffect(() => {
    void investmentOpsApi.listPortfolios().then(async (fundsRes) => {
      let rows: { id: string; name: string }[] = []
      if (fundsRes.success !== false) {
        rows = unwrapList<{ id?: string; name?: string }>(fundsRes.data)
          .map((f) => ({ id: String(f.id ?? ''), name: String(f.name ?? f.id ?? 'Fund') }))
          .filter((f) => f.id)
        setFunds(rows)
        if (deepFundId && rows.some((r) => r.id === deepFundId)) setFundId(deepFundId)
        else if (!fundId && rows[0]) setFundId(rows[0].id)
      }

      if (saved?.batchId) {
        try {
          const restored = await investmentOpsApi.getTradeReconBatch(saved.batchId)
          if (restored.success !== false && restored.data) {
            setBatch(restored.data)
            if (restored.data.fundId) setFundId(String(restored.data.fundId))
          } else {
            clearSession()
            setStep(0)
          }
        } catch {
          clearSession()
          setStep(0)
        }
      }
      setSessionReady(true)
      void refreshBatchList()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, [deepFundId])

  useEffect(() => {
    if (!sessionReady) return
    saveSession({
      step,
      fundId,
      asOfDate,
      batchId: batch?.id ?? null,
      brokerCsv,
      custodianCsv,
      writeOffReason,
      tradeFilter,
    })
  }, [
    sessionReady,
    step,
    fundId,
    asOfDate,
    batch?.id,
    brokerCsv,
    custodianCsv,
    writeOffReason,
    tradeFilter,
  ])

  const allExceptions = useMemo(() => exceptionsFromBatch(batch), [batch])
  const openExceptions = useMemo(
    () => allExceptions.filter((e) => String(e.status ?? 'OPEN').toUpperCase() === 'OPEN'),
    [allExceptions],
  )
  const resolvedExceptions = useMemo(
    () => allExceptions.filter((e) => String(e.status ?? 'OPEN').toUpperCase() !== 'OPEN'),
    [allExceptions],
  )
  const matchRows = useMemo((): TradeReconMatch[] => {
    const fromApi = Array.isArray(batch?.matches) ? (batch!.matches as TradeReconMatch[]) : []
    if (fromApi.length) return fromApi
    // Fallback: manual matches only if API older than matches payload
    return resolvedExceptions
      .filter((e) => String(e.status).toUpperCase() === 'MATCHED')
      .map((e) => ({
        id: `manual_${e.id}`,
        how: 'MANUAL',
        status: 'MATCHED',
        symbol: (e.symbol ?? e.instrumentSymbol ?? null) as string | null,
        tradeRef: (e.tradeRef ?? null) as string | null,
        internalQty: (e.internalQty ?? e.internalQuantity ?? null) as string | null,
        brokerQty: (e.brokerQty ?? e.brokerQuantity ?? null) as string | null,
        custodianQty: (e.custodianQty ?? e.custodianQuantity ?? null) as string | null,
      }))
  }, [batch, resolvedExceptions])
  const exceptions = useMemo(() => {
    if (!tradeFilter.trim()) return openExceptions
    const q = tradeFilter.toLowerCase()
    return openExceptions.filter(
      (e) =>
        String(e.symbol ?? e.instrumentSymbol ?? '').toLowerCase().includes(q) ||
        String(e.tradeRef ?? '').toLowerCase().includes(q) ||
        String(e.code ?? '').toLowerCase().includes(q) ||
        String(e.message ?? '').toLowerCase().includes(q),
    )
  }, [openExceptions, tradeFilter])
  const filteredMatches = useMemo(() => {
    if (!tradeFilter.trim()) return matchRows
    const q = tradeFilter.toLowerCase()
    return matchRows.filter(
      (m) =>
        String(m.symbol ?? '').toLowerCase().includes(q) ||
        String(m.tradeRef ?? '').toLowerCase().includes(q) ||
        String(m.how ?? '').toLowerCase().includes(q),
    )
  }, [matchRows, tradeFilter])
  const openExceptionCount = openExceptions.length
  const resolvedExceptionCount = resolvedExceptions.length
  const cleanMatchedCount = Math.max(Number(batch?.matchedCount ?? 0), matchRows.length)
  const batchPhase = useMemo(() => {
    const raw = String(batch?.status ?? '').toUpperCase()
    if (raw === 'COMPLETED') {
      return { label: 'Completed', detail: 'This reconciliation batch is closed.', tone: 'ok' as const }
    }
    if (raw === 'MATCHED' || raw === 'INGESTED' || cleanMatchedCount > 0 || allExceptions.length > 0) {
      if (openExceptionCount > 0) {
        return {
          label: 'Needs review',
          detail: `${cleanMatchedCount} clean match${cleanMatchedCount === 1 ? '' : 'es'} · ${openExceptionCount} still need action`,
          tone: 'warn' as const,
        }
      }
      if (raw === 'MATCHED' || cleanMatchedCount > 0) {
        return {
          label: 'Ready to complete',
          detail: 'All exceptions cleared — you can complete the batch.',
          tone: 'ok' as const,
        }
      }
    }
    if (raw === 'OPEN' || raw === 'CREATED' || !raw) {
      return { label: 'In progress', detail: 'Create the batch, then ingest statements and run match.', tone: 'muted' as const }
    }
    return {
      label: raw.replace(/_/g, ' ') || 'In progress',
      detail: 'Continue the steps below.',
      tone: 'muted' as const,
    }
  }, [batch?.status, cleanMatchedCount, openExceptionCount, allExceptions.length])

  const run = async (action: string, label: string, fn: () => Promise<void>) => {
    setBusyAction(action)
    setError(null)
    try {
      await fn()
    } catch (e) {
      const msg = formatOpsError(e, label)
      setError(msg)
      toast.error(msg)
    } finally {
      setBusyAction(null)
    }
  }

  const openBatch = async (id: string) => {
    await run('open-batch', 'Open batch failed', async () => {
      const data = await refreshBatch(id)
      if (!data) throw new Error('Batch not found')
      if (data.fundId) setFundId(String(data.fundId))
      if (data.asOfDate) setAsOfDate(String(data.asOfDate).slice(0, 10))
      setStep(stepForStatus(data.status))
      toast.message(
        String(data.status).toUpperCase() === 'COMPLETED'
          ? 'Opened completed batch'
          : 'Resumed draft batch',
      )
    })
  }

  const createBatch = () =>
    run('create', 'Create batch failed', async () => {
      if (!fundId) throw new Error('Select a fund')
      const res = await investmentOpsApi.createTradeReconBatch({
        fundId,
        asOfDate,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Create batch failed'))
      const created = res.data
      if (!created?.id) throw new Error('Batch created without id')
      setBatch(created)
      toast.success('Reconciliation batch created')
      setStep(1)
      void refreshBatchList()
    })

  const ingestBroker = () =>
    run('ingest-broker', 'Broker ingest failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      if (!brokerCsv.trim()) throw new Error('Paste or upload broker CSV')
      const batchId = batch.id
      const res = await investmentOpsApi.ingestTradeReconBroker(batchId, {
        csvText: brokerCsv,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Broker ingest failed'))
      if (res.data?.id) setBatch(res.data)
      else await refreshBatch(batchId)
      toast.success('Broker statement ingested')
      setStep(2)
    })

  const ingestCustodian = () =>
    run('ingest-custodian', 'Custodian ingest failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      if (!custodianCsv.trim()) throw new Error('Paste or upload custodian CSV')
      const batchId = batch.id
      const res = await investmentOpsApi.ingestTradeReconCustodian(batchId, {
        csvText: custodianCsv,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Custodian ingest failed'))
      if (res.data?.id) setBatch(res.data)
      else await refreshBatch(batchId)
      toast.success('Custodian statement ingested')
      setStep(3)
    })

  const runMatch = () =>
    run('match', 'Match failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      const batchId = batch.id
      const res = await investmentOpsApi.runTradeReconMatch(batchId)
      if (res.success === false) throw new Error(formatOpsError(res, 'Match failed'))
      if (res.data?.id) setBatch(res.data)
      else await refreshBatch(batchId)
      const next = res.data
      const matched = Number(next?.matchedCount ?? 0)
      const open = exceptionsFromBatch(next).filter(
        (e) => String(e.status ?? 'OPEN').toUpperCase() === 'OPEN',
      ).length
      toast.success(
        open > 0
          ? `Match finished: ${matched} clean, ${open} need review`
          : `Match finished: ${matched} clean — ready to complete`,
      )
      setStep(4)
    })

  const completeBatch = () =>
    run('complete', 'Complete failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      if (openExceptionCount > 0) {
        throw new Error(
          `Clear ${openExceptionCount} open exception${openExceptionCount === 1 ? '' : 's'} first (manual match or write off)`,
        )
      }
      const batchId = batch.id
      const res = await investmentOpsApi.completeTradeReconBatch(batchId)
      if (res.success === false) throw new Error(formatOpsError(res, 'Complete failed'))
      if (res.data?.id) setBatch(res.data)
      else await refreshBatch(batchId)
      toast.success('Batch completed')
      setStep(4)
      clearSession()
      void refreshBatchList()
    })

  const manualMatch = (exceptionId: string) =>
    run(`manual:${exceptionId}`, 'Manual match failed', async () => {
      const res = await investmentOpsApi.manualMatchTradeReconException(exceptionId, {
        reason: writeOffReason.trim() || 'Manual match — accepted without statement line',
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Manual match failed'))
      if (batch?.id) await refreshBatch(batch.id)
      toast.success('Marked as matched — removed from open list')
    })

  const writeOff = (exceptionId: string) =>
    run(`writeoff:${exceptionId}`, 'Write-off failed', async () => {
      if (!writeOffReason.trim()) {
        toast.error('Enter a write-off reason above first')
        throw new Error('Write-off reason required')
      }
      const res = await investmentOpsApi.writeOffTradeReconException(exceptionId, {
        reason: writeOffReason.trim(),
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Write-off failed'))
      if (batch?.id) await refreshBatch(batch.id)
      toast.success('Written off — removed from open list')
    })

  const downloadBlankTemplate = (side: 'broker' | 'custodian') => {
    const path =
      side === 'broker'
        ? '/demo-templates/trade-recon/broker-blank-template.csv'
        : '/demo-templates/trade-recon/custodian-blank-template.csv'
    const a = document.createElement('a')
    a.href = path
    a.download = side === 'broker' ? 'broker-statement-template.csv' : 'custodian-statement-template.csv'
    a.click()
    toast.message(`Downloaded ${side} blank template`)
  }

  const startOver = () => {
    clearSession()
    setBatch(null)
    setStep(0)
    setBrokerCsv('')
    setCustodianCsv('')
    setWriteOffReason('')
    setError(null)
    toast.message('Started a new reconciliation session')
    void refreshBatchList()
  }

  const filteredBatchList = useMemo(() => {
    return batchList.filter((b) => {
      const s = String(b.status ?? '').toUpperCase()
      const bucket = String((b as { bucket?: string }).bucket ?? '').toUpperCase()
      const isDraft =
        bucket === 'DRAFT' || s === 'OPEN' || s === 'INGESTED' || s === 'MATCHED'
      const isCompleted = bucket === 'COMPLETED' || s === 'COMPLETED'
      if (batchListFilter === 'DRAFT') return isDraft
      if (batchListFilter === 'COMPLETED') return isCompleted
      return true
    })
  }, [batchList, batchListFilter])

  const statusChip = (status?: string) => {
    const s = String(status ?? '').toUpperCase()
    if (s === 'COMPLETED') return 'bg-emerald-500/15 text-emerald-400'
    if (s === 'MATCHED') return 'bg-amber-500/15 text-amber-400'
    if (s === 'INGESTED') return 'bg-sky-500/15 text-sky-400'
    return 'bg-muted text-muted-foreground'
  }

  const batchLabel = useMemo(() => {
    if (!batch) return null
    const fundLabel =
      (batch.fundName && String(batch.fundName).trim()) ||
      funds.find((f) => f.id === batch.fundId)?.name ||
      funds.find((f) => f.id === fundId)?.name ||
      null
    const asOfRaw = batch.asOfDate || asOfDate
    const asOf = asOfRaw
      ? new Date(String(asOfRaw)).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—'
    if (batch.displayLabel && String(batch.displayLabel).trim() && !String(batch.displayLabel).startsWith('Portfolio ·')) {
      return String(batch.displayLabel)
    }
    return `${fundLabel || 'Portfolio'} · ${asOf}`
  }, [batch, funds, fundId, asOfDate])

  const canIngestCustodian = Boolean(batch?.id) && Boolean(custodianCsv.trim()) && !busy

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Trade match</h1>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              Internal blotter × Broker statement × Bank/custodian statement. Upload both external sides, run match, clear exceptions.
            </p>
            {deepTradeId ? (
              <p className="mt-1 text-[11px]" style={{ color: C.blueLink }}>
                Focused from blotter{deepTradeId.startsWith('TXN-') ? ` · ${deepTradeId}` : ''}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {batch ? (
              <button type="button" className={cn(reconPill, 'h-9')} onClick={startOver}>
                Start over
              </button>
            ) : null}
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={!sessionReady} error={error} />

        <section className={`${reconCard} space-y-3 p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[13px] font-semibold">Batches</h2>
              <p className="text-[11px]" style={{ color: C.muted }}>
                Drafts (in progress) and completed reconciliations. Click a row to open.
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
              <button
                type="button"
                className={cn(reconPill, 'h-8')}
                disabled={batchListLoading || busy}
                onClick={() => void refreshBatchList()}
              >
                {batchListLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Refresh
              </button>
            </div>
          </div>
          {batchListLoading && filteredBatchList.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">Loading batches…</p>
          ) : filteredBatchList.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              No {batchListFilter === 'ALL' ? '' : batchListFilter.toLowerCase() + ' '}batches yet.
            </p>
          ) : (
            <div className="max-h-[220px] overflow-auto overscroll-contain rounded-xl border border-border/50">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 z-[1] bg-card">
                  <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Portfolio</th>
                    <th className="px-3 py-2">As of</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Matched</th>
                    <th className="px-3 py-2">Exceptions</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredBatchList.map((b) => {
                    const active = batch?.id === b.id
                    const asOf = b.asOfDate
                      ? new Date(String(b.asOfDate)).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'
                    return (
                      <tr
                        key={b.id}
                        className={cn(
                          'border-b border-border/50',
                          active && 'bg-primary/10',
                        )}
                      >
                        <td className="px-3 py-2 font-medium">
                          {String(b.fundName ?? funds.find((f) => f.id === b.fundId)?.name ?? 'Portfolio')}
                        </td>
                        <td className="px-3 py-2">{asOf}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                              statusChip(b.status),
                            )}
                          >
                            {String(b.status ?? '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono">{Number(b.matchedCount ?? 0)}</td>
                        <td className="px-3 py-2 font-mono">{Number(b.exceptionCount ?? 0)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            className={cn(reconPill, 'h-7 px-3 text-[10px]')}
                            onClick={() => void openBatch(b.id)}
                          >
                            {busyAction === 'open-batch' && batch?.id === b.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            {String(b.status).toUpperCase() === 'COMPLETED' ? 'View' : 'Resume'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <nav className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(Math.min(i, STEPS.length - 1))}
              className={cn(
                'h-8 rounded-full px-3 text-[11px]',
                step === i ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {batch ? (
          <div className={`${reconCard} space-y-3 px-4 py-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-primary">{batchLabel}</p>
                <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                  {batchPhase.detail}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex h-8 items-center rounded-full px-3 text-[11px] font-semibold',
                  batchPhase.tone === 'ok' && 'bg-emerald-500/15 text-emerald-400',
                  batchPhase.tone === 'warn' && 'bg-amber-500/15 text-amber-400',
                  batchPhase.tone === 'muted' && 'bg-muted text-muted-foreground',
                )}
              >
                {batchPhase.tone === 'warn' ? (
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                ) : batchPhase.tone === 'ok' ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : null}
                Status: {batchPhase.label}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Clean matches</p>
                <p className="mt-0.5 text-[18px] font-semibold text-emerald-400">{cleanMatchedCount}</p>
                <p className="text-[10px] text-muted-foreground">Internal = Broker = Bank/custodian</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Need attention</p>
                <p
                  className={cn(
                    'mt-0.5 text-[18px] font-semibold',
                    openExceptionCount > 0 ? 'text-amber-400' : 'text-muted-foreground',
                  )}
                >
                  {openExceptionCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Open exceptions to clear</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolved by you</p>
                <p className="mt-0.5 text-[18px] font-semibold text-foreground">{resolvedExceptionCount}</p>
                <p className="text-[10px] text-muted-foreground">Manual match or write-off</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 0 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">Create batch</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-[11px]">
                <span style={{ color: C.muted }}>Fund</span>
                <select className={reconInput} value={fundId} onChange={(e) => setFundId(e.target.value)}>
                  <option value="">Select fund…</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-[11px]">
                <span style={{ color: C.muted }}>As of date</span>
                <input className={reconInput} type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
              </label>
            </div>
            <button
              type="button"
              disabled={busy || !fundId}
              className={cn(reconPrimaryPill, 'h-10 px-6')}
              onClick={() => void createBatch()}
            >
              {busyAction === 'create' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {busyAction === 'create' ? 'Creating…' : 'Create batch'}
            </button>
          </section>
        )}

        {step === 1 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">Ingest broker statement</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={reconPill} onClick={() => downloadBlankTemplate('broker')}>
                <Download className="h-3.5 w-3.5" />
                Download blank template
              </button>
              <label className={cn(reconPill, 'cursor-pointer')}>
                <Upload className="h-3.5 w-3.5" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void readFileAsText(f).then(setBrokerCsv).catch((err) => toast.error(String(err)))
                  }}
                />
              </label>
            </div>
            <textarea
              className={cn(reconInput, 'min-h-[180px] rounded-[16px] py-3 font-mono text-[11px]')}
              value={brokerCsv}
              onChange={(e) => setBrokerCsv(e.target.value)}
              placeholder="symbol,side,quantity,price,trade_date,broker_ref,currency"
            />
            <div className="flex gap-2">
              <button type="button" className={reconPill} onClick={() => setStep(0)}>
                Back
              </button>
              <button
                type="button"
                disabled={busy || !batch?.id || !brokerCsv.trim()}
                className={cn(reconPrimaryPill, 'h-10 min-w-[140px] px-6')}
                onClick={() => void ingestBroker()}
              >
                {busyAction === 'ingest-broker' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {busyAction === 'ingest-broker' ? 'Ingesting…' : 'Ingest broker'}
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">Ingest bank / custodian statement</h2>
            {!batch?.id ? (
              <p className="text-[12px] text-amber-400">
                Batch session was lost — go back and create/ingest broker again, or click Start over.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={reconPill} onClick={() => downloadBlankTemplate('custodian')}>
                <Download className="h-3.5 w-3.5" />
                Download blank template
              </button>
              <label className={cn(reconPill, 'cursor-pointer')}>
                <Upload className="h-3.5 w-3.5" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void readFileAsText(f).then(setCustodianCsv).catch((err) => toast.error(String(err)))
                  }}
                />
              </label>
            </div>
            <textarea
              className={cn(reconInput, 'min-h-[180px] rounded-[16px] py-3 font-mono text-[11px]')}
              value={custodianCsv}
              onChange={(e) => setCustodianCsv(e.target.value)}
              placeholder="symbol,side,quantity,price,trade_date,custodian_ref,currency"
            />
            <div className="flex gap-2">
              <button type="button" className={reconPill} onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                disabled={!canIngestCustodian}
                title={
                  !batch?.id
                    ? 'Create a batch and ingest broker first'
                    : !custodianCsv.trim()
                      ? 'Paste or upload custodian CSV first'
                      : undefined
                }
                className={cn(reconPrimaryPill, 'h-10 min-w-[150px] px-6')}
                onClick={() => void ingestCustodian()}
              >
                {busyAction === 'ingest-custodian' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {busyAction === 'ingest-custodian' ? 'Ingesting…' : 'Ingest custodian'}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">Run match</h2>
            <p className="text-[12px]" style={{ color: C.muted }}>
              Compares blotter trades for this fund/date to your broker and custodian CSVs. Clean three-way hits
              count as matches; everything else becomes an exception to review.
            </p>
            {busyAction === 'match' ? (
              <p className="flex items-center gap-2 text-[12px] text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Matching blotter to statements…
              </p>
            ) : null}
            <div className="flex gap-2">
              <button type="button" className={reconPill} disabled={busy} onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                disabled={busy || !batch?.id}
                className={cn(reconPrimaryPill, 'h-10 min-w-[140px] px-6')}
                onClick={() => void runMatch()}
              >
                {busyAction === 'match' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {busyAction === 'match' ? 'Matching…' : 'Run match'}
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold">Matches &amp; complete</h2>
                <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                  Each match compares Internal (blotter) vs Broker vs Bank/custodian. Clear open exceptions, then Complete.
                </p>
              </div>
              <input
                className={cn(reconInput, 'w-56')}
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                placeholder="Filter symbol / trade ref…"
              />
            </div>

            <div className="grid items-stretch gap-4">
              {/* Matches */}
              <div className="flex min-h-0 min-w-0 flex-col space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-emerald-400">
                    Matches ({filteredMatches.length})
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Internal vs Broker vs Bank/custodian</span>
                </div>
                {filteredMatches.length === 0 ? (
                  <p className="py-10 text-center text-[12px] text-muted-foreground">
                    No matches yet — run match or manually match an exception.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredMatches.map((m) => (
                      <MatchComparison key={m.id} match={m} batch={batch} />
                    ))}
                  </div>
                )}
              </div>

              {/* Exceptions */}
              <div className="flex min-h-0 min-w-0 flex-col space-y-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-amber-400">
                    Exceptions ({exceptions.length})
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Need a decision</span>
                </div>
                <label className="block shrink-0 space-y-1 text-[11px]">
                  <span style={{ color: C.muted }}>Reason (required for write-off)</span>
                  <input
                    className={reconInput}
                    value={writeOffReason}
                    onChange={(e) => setWriteOffReason(e.target.value)}
                    placeholder="Investigated — broker late correction"
                  />
                </label>
                <p className="shrink-0 text-[11px]" style={{ color: C.muted }}>
                  <strong className="text-foreground">Manual match</strong> moves the row to Matches.{' '}
                  <strong className="text-foreground">Write off</strong> closes it without matching.
                </p>
                {resolvedExceptionCount > 0 ? (
                  <p className="shrink-0 text-[10px] text-muted-foreground">
                    {resolvedExceptionCount} resolved (written off / manual) — not shown as open.
                  </p>
                ) : null}
                {exceptions.length === 0 ? (
                  <p className="py-10 text-center text-[12px] text-muted-foreground">
                    {openExceptionCount === 0
                      ? 'No open exceptions — ready to complete.'
                      : 'No rows match this filter.'}
                  </p>
                ) : (
                  <div className="max-h-[min(52vh,420px)] overflow-auto overscroll-contain rounded-xl border border-border/40">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 z-[1] bg-card">
                        <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-2 py-2">Code</th>
                          <th className="px-2 py-2">Symbol</th>
                          <th className="px-2 py-2">Trade ref</th>
                          <th className="px-2 py-2">Int</th>
                          <th className="px-2 py-2">Brk</th>
                          <th className="px-2 py-2">Csd</th>
                          <th className="px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exceptions.map((ex) => (
                          <tr key={ex.id} className="border-b border-border/50">
                            <td className="px-2 py-2 font-mono text-[10px] text-amber-500">
                              {String(ex.code ?? '—')}
                            </td>
                            <td className="px-2 py-2">{String(ex.symbol ?? ex.instrumentSymbol ?? '—')}</td>
                            <td className="px-2 py-2 font-mono text-[10px]">{String(ex.tradeRef ?? '—')}</td>
                            <td className="px-2 py-2 font-mono">
                              {String(ex.internalQty ?? ex.internalQuantity ?? '—')}
                            </td>
                            <td className="px-2 py-2 font-mono">
                              {String(ex.brokerQty ?? ex.brokerQuantity ?? '—')}
                            </td>
                            <td className="px-2 py-2 font-mono">
                              {String(ex.custodianQty ?? ex.custodianQuantity ?? '—')}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  disabled={busy}
                                  className={cn(reconPill, 'h-7 min-w-[96px] px-2 text-[10px]')}
                                  onClick={() => void manualMatch(ex.id)}
                                >
                                  {busyAction === `manual:${ex.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  {busyAction === `manual:${ex.id}` ? 'Saving…' : 'Manual match'}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  className={cn(reconPill, 'h-7 min-w-[84px] px-2 text-[10px]')}
                                  onClick={() => void writeOff(ex.id)}
                                >
                                  {busyAction === `writeoff:${ex.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  {busyAction === `writeoff:${ex.id}` ? 'Saving…' : 'Write off'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={reconPill} disabled={busy} onClick={() => setStep(3)}>
                Back
              </button>
              {String(batch?.status ?? '').toUpperCase() === 'COMPLETED' ? (
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-500/15 px-4 text-[12px] font-medium text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Batch completed
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy || !batch?.id}
                  title={
                    openExceptionCount > 0
                      ? `Clear ${openExceptionCount} open exception${openExceptionCount === 1 ? '' : 's'} first`
                      : 'Mark this reconciliation batch complete'
                  }
                  className={cn(reconPrimaryPill, 'h-10 min-w-[150px] px-6')}
                  onClick={() => void completeBatch()}
                >
                  {busyAction === 'complete' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {busyAction === 'complete'
                    ? 'Completing…'
                    : openExceptionCount > 0
                      ? `Complete (${openExceptionCount} open)`
                      : 'Complete batch'}
                </button>
              )}
              {openExceptionCount > 0 && String(batch?.status ?? '').toUpperCase() !== 'COMPLETED' ? (
                <span className="text-[11px] text-amber-400">
                  Manual match or write off open rows before complete will succeed.
                </span>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
