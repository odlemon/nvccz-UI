'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, Loader2, Upload } from 'lucide-react'
import { ReconApiBanner, ReconNavTabs, reconCard, reconInput, reconPill, reconPrimaryPill } from '@/components/investments-v2/recon-ui'
import {
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type TradeReconBatch,
  type TradeReconException,
  type TradeReconTemplate,
} from '@/lib/api/investment-ops-api'
import { R as C } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STEPS = [
  'Create batch',
  'Ingest broker',
  'Ingest custodian',
  'Run match',
  'Exceptions',
  'Complete',
] as const

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

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [templates, setTemplates] = useState<TradeReconTemplate[]>([])
  const [fundId, setFundId] = useState('')
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [brokerTemplate, setBrokerTemplate] = useState('BROKER_ZSE_CSV_V1')
  const [custodianTemplate, setCustodianTemplate] = useState('CUSTODIAN_CSD_CSV_V1')
  const [batch, setBatch] = useState<TradeReconBatch | null>(null)
  const [brokerCsv, setBrokerCsv] = useState('')
  const [custodianCsv, setCustodianCsv] = useState('')
  const [writeOffReason, setWriteOffReason] = useState('')
  const [tradeFilter, setTradeFilter] = useState(deepTradeId ?? '')

  useEffect(() => {
    if (deepTradeId) setTradeFilter(deepTradeId)
  }, [deepTradeId])

  useEffect(() => {
    void Promise.all([
      investmentOpsApi.listPortfolios(),
      investmentOpsApi.listTradeReconTemplates().catch(() => null),
    ]).then(([fundsRes, tmplRes]) => {
      if (fundsRes.success !== false) {
        const rows = unwrapList<{ id?: string; name?: string }>(fundsRes.data)
          .map((f) => ({ id: String(f.id ?? ''), name: String(f.name ?? f.id ?? 'Fund') }))
          .filter((f) => f.id)
        setFunds(rows)
        if (deepFundId && rows.some((r) => r.id === deepFundId)) setFundId(deepFundId)
        else if (!fundId && rows[0]) setFundId(rows[0].id)
      }
      if (tmplRes && tmplRes.success !== false) {
        const tmpls = unwrapList<TradeReconTemplate>(tmplRes.data)
        setTemplates(tmpls)
        const broker = tmpls.find((t) => String(t.side ?? t.code).toUpperCase().includes('BROKER'))
        const cust = tmpls.find((t) => String(t.side ?? t.code).toUpperCase().includes('CUSTODIAN'))
        if (broker?.code) setBrokerTemplate(String(broker.code))
        if (cust?.code) setCustodianTemplate(String(cust.code))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, [deepFundId])

  const brokerTemplates = useMemo(
    () =>
      templates.filter((t) => String(t.side ?? t.code).toUpperCase().includes('BROKER')).length
        ? templates.filter((t) => String(t.side ?? t.code).toUpperCase().includes('BROKER'))
        : templates,
    [templates],
  )
  const custodianTemplates = useMemo(
    () =>
      templates.filter((t) => String(t.side ?? t.code).toUpperCase().includes('CUSTODIAN')).length
        ? templates.filter((t) => String(t.side ?? t.code).toUpperCase().includes('CUSTODIAN'))
        : templates,
    [templates],
  )

  const exceptions = useMemo(() => {
    const rows = exceptionsFromBatch(batch)
    if (!tradeFilter.trim()) return rows
    const q = tradeFilter.toLowerCase()
    return rows.filter(
      (e) =>
        String(e.tradeId ?? '').toLowerCase().includes(q) ||
        String(e.symbol ?? '').toLowerCase().includes(q) ||
        String(e.id).toLowerCase().includes(q),
    )
  }, [batch, tradeFilter])

  const refreshBatch = useCallback(async (id: string) => {
    const res = await investmentOpsApi.getTradeReconBatch(id)
    if (res.success === false) throw new Error(formatOpsError(res, 'Failed to load batch'))
    if (res.data) setBatch(res.data)
    return res.data ?? null
  }, [])

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      const msg = formatOpsError(e, label)
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const createBatch = () =>
    run('Create batch failed', async () => {
      if (!fundId) throw new Error('Select a fund')
      const res = await investmentOpsApi.createTradeReconBatch({
        fundId,
        asOfDate,
        brokerTemplateCode: brokerTemplate || undefined,
        custodianTemplateCode: custodianTemplate || undefined,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Create batch failed'))
      const created = res.data
      if (!created?.id) throw new Error('Batch created without id')
      setBatch(created)
      toast.success(`Batch ${created.id} created`)
      setStep(1)
    })

  const ingestBroker = () =>
    run('Broker ingest failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      if (!brokerCsv.trim()) throw new Error('Paste or upload broker CSV')
      const res = await investmentOpsApi.ingestTradeReconBroker(batch.id, {
        csvText: brokerCsv,
        templateCode: brokerTemplate || undefined,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Broker ingest failed'))
      if (res.data) setBatch(res.data)
      else await refreshBatch(batch.id)
      toast.success('Broker statement ingested')
      setStep(2)
    })

  const ingestCustodian = () =>
    run('Custodian ingest failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      if (!custodianCsv.trim()) throw new Error('Paste or upload custodian CSV')
      const res = await investmentOpsApi.ingestTradeReconCustodian(batch.id, {
        csvText: custodianCsv,
        templateCode: custodianTemplate || undefined,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Custodian ingest failed'))
      if (res.data) setBatch(res.data)
      else await refreshBatch(batch.id)
      toast.success('Custodian statement ingested')
      setStep(3)
    })

  const runMatch = () =>
    run('Match failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      const res = await investmentOpsApi.runTradeReconMatch(batch.id)
      if (res.success === false) throw new Error(formatOpsError(res, 'Match failed'))
      if (res.data) setBatch(res.data)
      else await refreshBatch(batch.id)
      toast.success('Match complete')
      setStep(4)
    })

  const completeBatch = () =>
    run('Complete failed', async () => {
      if (!batch?.id) throw new Error('Create a batch first')
      const res = await investmentOpsApi.completeTradeReconBatch(batch.id)
      if (res.success === false) throw new Error(formatOpsError(res, 'Complete failed'))
      if (res.data) setBatch(res.data)
      else await refreshBatch(batch.id)
      toast.success('Batch completed')
      setStep(5)
    })

  const manualMatch = (exceptionId: string) =>
    run('Manual match failed', async () => {
      const res = await investmentOpsApi.manualMatchTradeReconException(exceptionId, {})
      if (res.success === false) throw new Error(formatOpsError(res, 'Manual match failed'))
      if (batch?.id) await refreshBatch(batch.id)
      toast.success('Exception manually matched')
    })

  const writeOff = (exceptionId: string) =>
    run('Write-off failed', async () => {
      if (!writeOffReason.trim()) throw new Error('Write-off reason required')
      const res = await investmentOpsApi.writeOffTradeReconException(exceptionId, {
        reason: writeOffReason.trim(),
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Write-off failed'))
      if (batch?.id) await refreshBatch(batch.id)
      toast.success('Exception written off')
      setWriteOffReason('')
    })

  const loadDemo = async (side: 'broker' | 'custodian', kind: 'happy' | 'qty-mismatch' | 'missing') => {
    const path = `/demo-templates/trade-recon/${side}-${kind}.csv`
    try {
      const res = await fetch(path)
      if (!res.ok) throw new Error(`Demo file missing (${path})`)
      const text = await res.text()
      if (side === 'broker') setBrokerCsv(text)
      else setCustodianCsv(text)
      toast.message(`Loaded ${side} ${kind} demo`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load demo')
    }
  }

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1100px] space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Trade recon</h1>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              Three-way batch: internal blotter × broker statement × custodian statement. Ingest files, match, clear exceptions.
            </p>
            {deepTradeId ? (
              <p className="mt-1 text-[11px]" style={{ color: C.blueLink }}>
                Focused from blotter trade {deepTradeId}
              </p>
            ) : null}
          </div>
          <Link
            href="/investments-v2/reconciliation/broker-custodian"
            className={cn(reconPill, 'h-9')}
          >
            Legacy match queue
          </Link>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={false} error={error} />

        <nav className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'h-8 rounded-full px-3 text-[11px]',
                step === i ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted text-muted-foreground',
              )}
            >
              {i + 1}. {label}
            </button>
          ))}
        </nav>

        {batch ? (
          <div className={`${reconCard} px-4 py-3 text-[12px]`}>
            Batch <span className="font-mono text-primary">{batch.id}</span>
            {batch.status ? ` · ${batch.status}` : ''}
            {batch.matchedCount != null ? ` · matched ${batch.matchedCount}` : ''}
            {batch.exceptionCount != null ? ` · exceptions ${batch.exceptionCount}` : ''}
          </div>
        ) : null}

        {/* Step 0 — create */}
        {step === 0 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">1. Create batch</h2>
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
              <label className="space-y-1 text-[11px]">
                <span style={{ color: C.muted }}>Broker template</span>
                <select className={reconInput} value={brokerTemplate} onChange={(e) => setBrokerTemplate(e.target.value)}>
                  {(brokerTemplates.length ? brokerTemplates : [{ code: 'BROKER_ZSE_CSV_V1', name: 'BROKER_ZSE_CSV_V1' }]).map(
                    (t) => (
                      <option key={String(t.code)} value={String(t.code)}>
                        {String(t.name ?? t.code)}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="space-y-1 text-[11px]">
                <span style={{ color: C.muted }}>Custodian template</span>
                <select
                  className={reconInput}
                  value={custodianTemplate}
                  onChange={(e) => setCustodianTemplate(e.target.value)}
                >
                  {(custodianTemplates.length
                    ? custodianTemplates
                    : [{ code: 'CUSTODIAN_CSD_CSV_V1', name: 'CUSTODIAN_CSD_CSV_V1' }]
                  ).map((t) => (
                    <option key={String(t.code)} value={String(t.code)}>
                      {String(t.name ?? t.code)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" disabled={busy || !fundId} className={cn(reconPrimaryPill, 'h-10 px-6')} onClick={() => void createBatch()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Create batch
            </button>
          </section>
        )}

        {/* Step 1 — broker */}
        {step === 1 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">2. Ingest broker statement</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={reconPill} onClick={() => void loadDemo('broker', 'happy')}>
                Demo happy
              </button>
              <button type="button" className={reconPill} onClick={() => void loadDemo('broker', 'qty-mismatch')}>
                Demo qty mismatch
              </button>
              <button type="button" className={reconPill} onClick={() => void loadDemo('broker', 'missing')}>
                Demo missing
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
                className={cn(reconPrimaryPill, 'h-10 px-6')}
                onClick={() => void ingestBroker()}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Ingest broker
              </button>
            </div>
          </section>
        )}

        {/* Step 2 — custodian */}
        {step === 2 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">3. Ingest custodian statement</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={reconPill} onClick={() => void loadDemo('custodian', 'happy')}>
                Demo happy
              </button>
              <button type="button" className={reconPill} onClick={() => void loadDemo('custodian', 'qty-mismatch')}>
                Demo qty mismatch
              </button>
              <button type="button" className={reconPill} onClick={() => void loadDemo('custodian', 'missing')}>
                Demo missing
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
                disabled={busy || !batch?.id || !custodianCsv.trim()}
                className={cn(reconPrimaryPill, 'h-10 px-6')}
                onClick={() => void ingestCustodian()}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Ingest custodian
              </button>
            </div>
          </section>
        )}

        {/* Step 3 — match */}
        {step === 3 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">4. Run match</h2>
            <p className="text-[12px]" style={{ color: C.muted }}>
              Compare internal blotter trades to broker and custodian lines. Breaks become exceptions
              (`QTY_MISMATCH`, `PRICE_MISMATCH`, `MISSING_*`, `DUPLICATE`).
            </p>
            <div className="flex gap-2">
              <button type="button" className={reconPill} onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                disabled={busy || !batch?.id}
                className={cn(reconPrimaryPill, 'h-10 px-6')}
                onClick={() => void runMatch()}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Run match
              </button>
            </div>
          </section>
        )}

        {/* Step 4 — exceptions */}
        {step === 4 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[14px] font-semibold">5. Exceptions</h2>
              <input
                className={cn(reconInput, 'w-56')}
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                placeholder="Filter trade / symbol…"
              />
            </div>
            <label className="block space-y-1 text-[11px]">
              <span style={{ color: C.muted }}>Write-off reason (for write-off actions)</span>
              <input
                className={reconInput}
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                placeholder="Investigated — broker late correction"
              />
            </label>
            {exceptions.length === 0 ? (
              <p className="py-8 text-center text-[12px]" style={{ color: C.muted2 }}>
                No exceptions returned — proceed to complete, or re-run match after ingesting mismatch demos.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Symbol</th>
                      <th className="px-2 py-2">Trade</th>
                      <th className="px-2 py-2">Internal</th>
                      <th className="px-2 py-2">Broker</th>
                      <th className="px-2 py-2">Custodian</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map((ex) => (
                      <tr key={ex.id} className="border-b border-border/60">
                        <td className="px-2 py-2 font-mono text-amber-600">{String(ex.code ?? '—')}</td>
                        <td className="px-2 py-2">{String(ex.symbol ?? '—')}</td>
                        <td className="px-2 py-2 font-mono">{String(ex.tradeId ?? '—')}</td>
                        <td className="px-2 py-2 font-mono">{String(ex.internalQty ?? '—')}</td>
                        <td className="px-2 py-2 font-mono">{String(ex.brokerQty ?? '—')}</td>
                        <td className="px-2 py-2 font-mono">{String(ex.custodianQty ?? '—')}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              className={cn(reconPill, 'h-7 px-2 text-[10px]')}
                              onClick={() => void manualMatch(ex.id)}
                            >
                              Manual match
                            </button>
                            <button
                              type="button"
                              disabled={busy || !writeOffReason.trim()}
                              className={cn(reconPill, 'h-7 px-2 text-[10px]')}
                              onClick={() => void writeOff(ex.id)}
                            >
                              Write off
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" className={reconPill} onClick={() => setStep(3)}>
                Back
              </button>
              <button type="button" className={cn(reconPrimaryPill, 'h-10 px-6')} onClick={() => setStep(5)}>
                Continue to complete
              </button>
            </div>
          </section>
        )}

        {/* Step 5 — complete */}
        {step === 5 && (
          <section className={`${reconCard} space-y-4 p-5`}>
            <h2 className="text-[14px] font-semibold">6. Complete batch</h2>
            <p className="text-[12px]" style={{ color: C.muted }}>
              Mark the reconciliation batch complete when matches and exceptions are handled.
            </p>
            <div className="flex gap-2">
              <button type="button" className={reconPill} onClick={() => setStep(4)}>
                Back
              </button>
              <button
                type="button"
                disabled={busy || !batch?.id}
                className={cn(reconPrimaryPill, 'h-10 px-6')}
                onClick={() => void completeBatch()}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Complete batch
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
