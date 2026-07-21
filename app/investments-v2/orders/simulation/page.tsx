'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Beaker, Loader2, RotateCcw } from 'lucide-react'
import { OpsPanelSkeleton } from '@/components/investments-v2/loading-skeletons'
import { buttonClass, Field, inputClass, Metric, OrdersCard, OrdersPage, Pill, SelectField } from '@/components/investments-v2/orders-ui'
import { investmentOpsApi, unwrapList } from '@/lib/api/investment-ops-api'
import type { Instrument } from '@/lib/api/investment-ops-api'
import {
  formatCompact,
  mapFundOptions,
  mapSimulationResult,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { formatMoneyDisplay } from '@/lib/api/investment-ops-helpers'
import { cn } from '@/lib/utils'

export default function SimulationPage() {
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [fundId, setFundId] = useState('')
  const [instrumentId, setInstrumentId] = useState('')
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState('LIMIT')
  const [scenario, setScenario] = useState('Base case')
  const [mode, setMode] = useState('Single order')
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<ReturnType<typeof mapSimulationResult>>(null)

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true)
    setMetaError(null)
    try {
      const [portfoliosRes, instrumentsRes] = await Promise.all([
        investmentOpsApi.listPortfolios(),
        investmentOpsApi.listInstruments({ page: 1, pageSize: 100 }),
      ])
      const fundList = mapFundOptions(portfoliosRes.data)
      const instrumentsFinal = unwrapList<Instrument>(instrumentsRes.data)
      setFunds(fundList)
      setInstruments(instrumentsFinal)
      setFundId((prev) => prev || fundList[0]?.id || '')
      setInstrumentId((prev) => prev || instrumentsFinal[0]?.id || '')
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : 'Failed to load simulation inputs')
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  const selectedInstrument = instruments.find((i) => i.id === instrumentId)
  const gross = (Number(quantity) || 0) * (Number(price) || 0)

  const scenarioPrice = useMemo(() => {
    const base = Number(price) || 0
    if (scenario === 'Price +5%') return base * 1.05
    if (scenario === 'Price -5%') return base * 0.95
    return base
  }, [price, scenario])

  const reset = () => {
    setSide('BUY')
    setQuantity('')
    setPrice('')
    setType('LIMIT')
    setScenario('Base case')
    setMode('Single order')
    setResult(null)
    setRunError(null)
    setFundId(funds[0]?.id || '')
    setInstrumentId(instruments[0]?.id || '')
  }

  const run = async () => {
    if (!fundId || !instrumentId || !quantity || !price) return
    setRunning(true)
    setRunError(null)
    setResult(null)
    try {
      const res = await investmentOpsApi.runSimulation({
        fundId,
        scenario: {
          side,
          instrumentId,
          quantity: Number(quantity),
          price: scenarioPrice,
        },
      })
      if (res.success === false) {
        throw new Error(res.message || res.error || 'Simulation failed')
      }
      setResult(mapSimulationResult(res.data))
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setRunning(false)
    }
  }

  const canRun = !!fundId && !!instrumentId && Number(quantity) > 0 && Number(price) > 0 && !running

  return (
    <OrdersPage
      title="Order simulation"
      description="Model portfolio impact without creating, routing or executing an order."
      actions={<Pill tone="violet">What-if only · no execution</Pill>}
    >
      {metaError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {metaError}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => void loadMeta()}>
            Retry
          </button>
        </div>
      )}
      {runError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">{runError}</div>
      )}

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <OrdersCard title="Scenario inputs" eyebrow="Hypothetical trade">
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-1">
            {loadingMeta && <OpsPanelSkeleton />}
            {!loadingMeta && (
              <>
            <Field label="Scenario">
              <SelectField value={scenario} onChange={(value) => { setScenario(value); setResult(null) }}>
                <option>Base case</option>
                <option>Price +5%</option>
                <option>Price -5%</option>
                <option>Stress liquidity</option>
              </SelectField>
            </Field>
            <Field label="Simulation mode">
              <SelectField value={mode} onChange={(value) => { setMode(value); setResult(null) }}>
                <option>Single order</option>
                <option>Portfolio rebalance</option>
              </SelectField>
            </Field>
            <Field label="Portfolio">
              <SelectField value={fundId} onChange={(value) => { setFundId(value); setResult(null) }}>
                {funds.length === 0 && <option value="">No funds</option>}
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field label="Instrument">
              <SelectField value={instrumentId} onChange={(value) => { setInstrumentId(value); setResult(null) }}>
                {instruments.length === 0 && <option value="">No instruments</option>}
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.ticker || i.instrumentCode} · {i.shortName || i.fullName}
                  </option>
                ))}
              </SelectField>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Side">
                <SelectField value={side} onChange={(value) => { setSide(value as 'BUY' | 'SELL'); setResult(null) }}>
                  <option>BUY</option>
                  <option>SELL</option>
                </SelectField>
              </Field>
              <Field label="Order type">
                <SelectField value={type} onChange={(value) => { setType(value); setResult(null) }}>
                  <option>MARKET</option>
                  <option>LIMIT</option>
                  <option>STOP LIMIT</option>
                </SelectField>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity">
                <input className={inputClass} type="number" value={quantity} onChange={(e) => { setQuantity(e.target.value); setResult(null) }} />
              </Field>
              <Field label="Assumed price">
                <input className={inputClass} type="number" value={price} onChange={(e) => { setPrice(e.target.value); setResult(null) }} />
              </Field>
            </div>
            {scenario !== 'Base case' && (
              <p className="text-[10px] text-slate-500">
                Scenario price: <span className="font-mono text-slate-300">{scenarioPrice.toFixed(4)}</span>
                {selectedInstrument?.listingCurrencyCode ? ` ${selectedInstrument.listingCurrencyCode}` : ''}
              </p>
            )}
            <div className="flex gap-2">
              <button className={cn(buttonClass, 'flex-1')} onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button disabled={!canRun} className={cn(buttonClass, 'flex-1 bg-violet-600 text-white')} onClick={() => void run()}>
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Beaker className="h-3.5 w-3.5" />}
                {running ? 'Running…' : 'Run simulation'}
              </button>
            </div>
              </>
            )}
          </div>
        </OrdersCard>

        <div className="space-y-4 transition">
          {!result && !running && (
            <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-16 text-center text-[11px] text-slate-500">
              Run a simulation to see NAV, cash, exposure and compliance impact. No placeholder results are shown.
            </div>
          )}
          {running && (
            <div className="rounded-[24px] border border-white/10 px-6 py-16 text-center text-[11px] text-slate-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Running simulation…
            </div>
          )}
          {result && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
                <Metric label="NAV after" value={formatCompact(result.navAfter)} detail={formatCompact(result.navImpact)} />
                <Metric label="NAV before" value={formatCompact(result.navBefore)} />
                <Metric label="Cash impact" value={formatCompact(result.cashImpact)} tone={result.cashImpact < 0 ? 'text-amber-300' : 'text-emerald-300'} />
                <Metric label="Est. fees" value={formatMoneyDisplay(result.estimatedFees)} />
                <Metric label="Exposure impact" value={`${(Number(result.exposureImpactPct) || 0).toFixed(2)}%`} />
                <Metric label="Compliance" value={result.complianceOutcome} tone={result.complianceOutcome === 'PASSED' ? 'text-emerald-300' : 'text-amber-300'} />
              </div>
              <OrdersCard title="Before vs after" eyebrow={`Simulation · ${result.createdAt}`}>
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  {[
                    ['NAV', formatCompact(result.navBefore), formatCompact(result.navAfter), formatCompact(result.navImpact)],
                    ['Cash impact', '—', formatCompact(result.cashImpact), formatCompact(result.cashImpact)],
                    ['Exposure', '—', `${(Number(result.exposureImpactPct) || 0).toFixed(2)}%`, `${(Number(result.exposureImpactPct) || 0) >= 0 ? '+' : ''}${(Number(result.exposureImpactPct) || 0).toFixed(2)}%`],
                    ['Mode', mode, scenario, type],
                  ].map(([label, before, after, delta]) => (
                    <div key={label} className="rounded-[18px] border border-white/[0.06] bg-black/15 p-4">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
                      <div className="mt-3 grid grid-cols-3 text-center">
                        <div>
                          <span className="text-[9px] text-slate-600">Before</span>
                          <p className="font-mono text-sm">{before}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-600">After</span>
                          <p className="font-mono text-sm">{after}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-600">Change</span>
                          <p className={cn('font-mono text-sm', String(delta).startsWith('-') ? 'text-amber-300' : 'text-emerald-300')}>{delta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </OrdersCard>
              <div className="grid gap-4 lg:grid-cols-2">
                <OrdersCard title="Costs">
                  <div className="space-y-2 p-4">
                    {[
                      ['Gross consideration (inputs)', gross],
                      ['Estimated fees', result.estimatedFees],
                      ['Cash impact', result.cashImpact],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-mono">{formatMoneyDisplay(value)}</span>
                      </div>
                    ))}
                  </div>
                </OrdersCard>
                <OrdersCard title="Compliance">
                  <div className="space-y-2 p-4">
                    {result.checks.length === 0 && (
                      <div className="flex items-center justify-between rounded-[14px] bg-black/15 p-2.5">
                        <span className="text-[10px]">{result.complianceMessage || 'No detailed checks returned'}</span>
                        <Pill tone={result.complianceOutcome === 'PASSED' ? 'green' : result.complianceOutcome === 'WARNING' ? 'amber' : 'red'}>
                          {result.complianceOutcome}
                        </Pill>
                      </div>
                    )}
                    {result.checks.map((check) => (
                      <div key={`${check.rule}-${check.status}`} className="flex items-center justify-between rounded-[14px] bg-black/15 p-2.5">
                        <span className="text-[10px]">{check.rule}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-slate-500">{check.ruleType}</span>
                          <Pill tone={check.status === 'PASSED' || check.status === 'PASS' ? 'green' : check.status === 'WARNING' ? 'amber' : 'red'}>
                            {check.status}
                          </Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                </OrdersCard>
              </div>
            </>
          )}
        </div>
      </div>
    </OrdersPage>
  )
}
