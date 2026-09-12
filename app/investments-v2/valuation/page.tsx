'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Play, RefreshCw, ShieldAlert, X } from 'lucide-react'
import { OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  createValuationRun,
  fetchPortfolios,
  fetchValuationExceptions,
  fetchValuationRuns,
} from '@/lib/store/slices/investmentOpsSlice'
import {
  formatMoneyDisplay,
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type ValuationRun,
} from '@/lib/api/investment-ops-api'
import { formatValuationRunLabel } from '@/lib/investments-v2/adapters/cash-recon-adapter'

const tabs = ['NAV Runs', 'P&L Runs', 'Price Validation', 'FX Conversion', 'Valuation Exceptions']

const METHOD_OPTIONS = [
  { label: 'Weighted average cost', value: 'WAC' },
  { label: 'FIFO', value: 'FIFO' },
  { label: 'LIFO', value: 'LIFO' },
  { label: 'Amortised cost', value: 'AMORTISED_COST' },
]

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function navDisplay(run: ValuationRun) {
  const nav = run.navBaseCurrency
  if (nav == null || nav === '') return '—'
  const n = Number(String(nav).replace(/,/g, ''))
  if (!Number.isFinite(n)) return String(nav)
  return `$${formatMoneyDisplay(n)}`
}

function pnlColumn(value?: string | number | null) {
  if (value == null || value === '') return '—'
  return `$${formatMoneyDisplay(value)}`
}

function pnlDisplay(run: ValuationRun) {
  if (run.totalPnl != null && run.totalPnl !== '') {
    return `$${formatMoneyDisplay(run.totalPnl)}`
  }
  const realized = run.realizedPnl
  const unrealized = run.unrealizedPnl
  if ((realized == null || realized === '') && (unrealized == null || unrealized === '')) return '—'
  const r = Number(String(realized ?? 0).replace(/,/g, ''))
  const u = Number(String(unrealized ?? 0).replace(/,/g, ''))
  if (!Number.isFinite(r) && !Number.isFinite(u)) return '—'
  return `$${formatMoneyDisplay((Number.isFinite(r) ? r : 0) + (Number.isFinite(u) ? u : 0))}`
}

function cellValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && value !== '') return String(value)
  }
  return '—'
}

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
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
      <button type="button" onClick={() => setOpen(!open)} className="flex h-9 w-full min-w-[150px] items-center justify-between rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px] text-[#d4dbe5] hover:border-[#52637a]">
        {value}
        <ChevronDown className={`h-3 w-3 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 min-w-full rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">
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
  const tone =
    ['COMPLETED', 'APPROVED', 'RESOLVED'].some((x) => upper.includes(x) && !upper.includes('EXCEPTION'))
      ? 'bg-emerald-400/10 text-emerald-300'
      : upper.includes('RUNNING') || upper.includes('PENDING')
        ? 'bg-blue-400/10 text-blue-300'
        : 'bg-amber-400/10 text-amber-300'
  return <span className={`rounded-full px-2 py-1 text-[9px] ${tone}`}>{formatStatus(value)}</span>
}

export default function ValuationPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    portfoliosLoading,
    valuationRuns,
    valuationRunsLoading,
    valuationRunning,
    valuationExceptions,
    valuationExceptionsLoading,
  } = useAppSelector((s) => s.investmentOps)

  const [tab, setTab] = useState('NAV Runs')
  const [fundId, setFundId] = useState('')
  const [method, setMethod] = useState(METHOD_OPTIONS[0].label)
  const [asOfLocal, setAsOfLocal] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [lastCreated, setLastCreated] = useState<ValuationRun | null>(null)
  const [modal, setModal] = useState<(typeof valuationExceptions)[number] | null>(null)
  const [selectedRunId, setSelectedRunId] = useState('')
  const [runInputsLoading, setRunInputsLoading] = useState(false)
  const [runInputsError, setRunInputsError] = useState<string | null>(null)
  const [runPrices, setRunPrices] = useState<Record<string, unknown>[]>([])
  const [runFxRates, setRunFxRates] = useState<Record<string, unknown>[]>([])
  const [exceptionReason, setExceptionReason] = useState('')
  const [overridePrice, setOverridePrice] = useState('')
  const [exceptionActionLoading, setExceptionActionLoading] = useState(false)
  const [exceptionActionError, setExceptionActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    Promise.all([
      dispatch(fetchPortfolios()),
      dispatch(fetchValuationRuns({})),
      dispatch(fetchValuationExceptions({})),
    ]).then((results) => {
      if (cancelled) return
      if (results.some((r) => r.meta.requestStatus === 'rejected')) {
        setLoadError('Unable to load valuation data from the server.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  useEffect(() => {
    if (!fundId && portfolios[0]?.id) setFundId(portfolios[0].id)
  }, [portfolios, fundId])

  useEffect(() => {
    if (!selectedRunId && valuationRuns[0]?.id) setSelectedRunId(valuationRuns[0].id)
  }, [valuationRuns, selectedRunId])

  useEffect(() => {
    if ((tab !== 'Price Validation' && tab !== 'FX Conversion') || !selectedRunId) return
    let cancelled = false
    setRunInputsLoading(true)
    setRunInputsError(null)
    investmentOpsApi
      .getValuationRunInputs(selectedRunId)
      .then((res) => {
        if (cancelled) return
        if (!res.success) {
          setRunInputsError(formatOpsError(res))
          setRunPrices([])
          setRunFxRates([])
          return
        }
        const data = res.data
        const inputs = unwrapList<Record<string, unknown>>(data)
        const pricesFromData = Array.isArray(data?.prices) ? (data.prices as Record<string, unknown>[]) : []
        const fxFromData = Array.isArray(data?.fxRates) ? (data.fxRates as Record<string, unknown>[]) : []
        const pricesFromInputs = inputs.filter((row) => String(row.inputType ?? row.type ?? '').toUpperCase().includes('PRICE'))
        const fxFromInputs = inputs.filter((row) => String(row.inputType ?? row.type ?? '').toUpperCase().includes('FX'))
        setRunPrices(pricesFromData.length ? pricesFromData : pricesFromInputs.length ? pricesFromInputs : inputs)
        setRunFxRates(fxFromData.length ? fxFromData : fxFromInputs)
      })
      .catch((e) => {
        if (cancelled) return
        setRunInputsError(e instanceof Error ? e.message : 'Failed to load run inputs')
        setRunPrices([])
        setRunFxRates([])
      })
      .finally(() => {
        if (!cancelled) setRunInputsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab, selectedRunId])

  const fundName = (id: string) => portfolios.find((p) => p.id === id)?.name ?? '—'
  const runLabel = (run: ValuationRun) => formatValuationRunLabel(run)
  const methodValue = METHOD_OPTIONS.find((m) => m.label === method)?.value ?? METHOD_OPTIONS[0].value

  const fundOptions = useMemo(
    () => (portfolios.length ? portfolios.map((p) => p.name) : ['No portfolios available']),
    [portfolios],
  )
  const selectedFundName = portfolios.find((p) => p.id === fundId)?.name ?? fundOptions[0]
  const selectedRunLabel = runLabel(valuationRuns.find((r) => r.id === selectedRunId) ?? valuationRuns[0] ?? { id: selectedRunId })
  const runOptions = useMemo(
    () => (valuationRuns.length ? valuationRuns.map((r) => runLabel(r)) : ['No runs available']),
    [valuationRuns],
  )
  const selectRunByLabel = (label: string) => {
    const run = valuationRuns.find((r) => runLabel(r) === label)
    if (run) setSelectedRunId(run.id)
  }

  const openExceptions = valuationExceptions.filter((e) => e.status?.toUpperCase() === 'OPEN' || !e.resolvedAt)
  const completedRuns = valuationRuns.filter((r) => r.status?.toUpperCase().includes('COMPLETED')).length

  const run = async () => {
    if (!fundId) {
      setRunError('Select a portfolio before running valuation.')
      return
    }
    setRunError(null)
    setLastCreated(null)
    try {
      const created = await dispatch(
        createValuationRun({
          fundId,
          costBasisMethod: methodValue,
          asOf: asOfLocal ? new Date(asOfLocal).toISOString().slice(0, 10) : undefined,
          processNow: true,
        }),
      ).unwrap()
      let detail = created
      try {
        const refreshed = await investmentOpsApi.getValuationRun(created.id)
        if (refreshed.success && refreshed.data) detail = refreshed.data
      } catch {
        // keep create payload if detail refresh fails
      }
      setLastCreated(detail)
      dispatch(fetchValuationRuns({}))
      dispatch(fetchValuationExceptions({ fundId }))
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Failed to create valuation run')
    }
  }

  const openExceptionModal = (exception: (typeof valuationExceptions)[number]) => {
    setModal(exception)
    setExceptionReason('')
    setOverridePrice('')
    setExceptionActionError(null)
  }

  const resolveException = async () => {
    if (!modal || !exceptionReason.trim()) return
    setExceptionActionLoading(true)
    setExceptionActionError(null)
    try {
      const res = await investmentOpsApi.resolveValuationException(modal.id, { reason: exceptionReason.trim() })
      if (!res.success) throw new Error(formatOpsError(res))
      setModal(null)
      dispatch(fetchValuationExceptions({ fundId: modal.fundId }))
      dispatch(fetchValuationRuns({}))
    } catch (e) {
      setExceptionActionError(e instanceof Error ? e.message : 'Failed to resolve exception')
    } finally {
      setExceptionActionLoading(false)
    }
  }

  const overrideException = async () => {
    if (!modal || !exceptionReason.trim() || !overridePrice.trim()) return
    setExceptionActionLoading(true)
    setExceptionActionError(null)
    try {
      const res = await investmentOpsApi.overrideValuationException(modal.id, {
        reason: exceptionReason.trim(),
        overrideValue: overridePrice.trim(),
        overridePrice: overridePrice.trim(),
      })
      if (!res.success) throw new Error(formatOpsError(res))
      setModal(null)
      dispatch(fetchValuationExceptions({ fundId: modal.fundId }))
      dispatch(fetchValuationRuns({}))
    } catch (e) {
      setExceptionActionError(e instanceof Error ? e.message : 'Failed to override exception')
    } finally {
      setExceptionActionLoading(false)
    }
  }

  const escalateException = async () => {
    if (!modal || !exceptionReason.trim()) return
    setExceptionActionLoading(true)
    setExceptionActionError(null)
    try {
      const res = await investmentOpsApi.escalateValuationException(modal.id, { reason: exceptionReason.trim() })
      if (!res.success) throw new Error(formatOpsError(res))
      setModal(null)
      dispatch(fetchValuationExceptions({ fundId: modal.fundId }))
    } catch (e) {
      setExceptionActionError(e instanceof Error ? e.message : 'Failed to escalate exception')
    } finally {
      setExceptionActionLoading(false)
    }
  }

  const approveOverride = async () => {
    if (!modal) return
    setExceptionActionLoading(true)
    setExceptionActionError(null)
    try {
      const res = await investmentOpsApi.approveValuationOverride(modal.id, {
        reason: exceptionReason.trim() || undefined,
      })
      if (!res.success) throw new Error(formatOpsError(res))
      setModal(null)
      dispatch(fetchValuationExceptions({ fundId: modal.fundId }))
    } catch (e) {
      setExceptionActionError(e instanceof Error ? e.message : 'Failed to approve override')
    } finally {
      setExceptionActionLoading(false)
    }
  }

  const rejectOverride = async () => {
    if (!modal || !exceptionReason.trim()) return
    setExceptionActionLoading(true)
    setExceptionActionError(null)
    try {
      const res = await investmentOpsApi.rejectValuationOverride(modal.id, { reason: exceptionReason.trim() })
      if (!res.success) throw new Error(formatOpsError(res))
      setModal(null)
      dispatch(fetchValuationExceptions({ fundId: modal.fundId }))
    } catch (e) {
      setExceptionActionError(e instanceof Error ? e.message : 'Failed to reject override')
    } finally {
      setExceptionActionLoading(false)
    }
  }

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(120deg,#182434,#101a29_58%,#0b1421)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Investment operations</p>
              <h1 className="mt-1 text-lg font-semibold">Valuation control centre</h1>
              <p className="mt-1 text-[11px] text-[#8f9caf]">Run reproducible NAV and P&amp;L calculations against approved market references.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['NAV runs', String(valuationRuns.length)],
                ['Completed', String(completedRuns)],
                ['Open exceptions', String(openExceptions.length)],
                ['Portfolios', String(portfolios.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3">
                  <p className="text-[9px] text-[#728197]">{label}</p>
                  <p className="mt-1 text-[15px] font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-border bg-muted p-1">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}
              >
                {t}
                {t === 'Valuation Exceptions' && openExceptions.length > 0 && (
                  <span className="ml-2 rounded-full bg-rose-500/20 px-1.5 text-rose-300">{openExceptions.length}</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {loadError && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{loadError}</div>
        )}
        {tab === 'NAV Runs' && (
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(145deg,#142030,#0d1623)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[12px] font-semibold">New valuation run</h2>
                  <p className="text-[9px] text-[#718096]">Required run inputs</p>
                </div>
                <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[9px] text-blue-300">NAV + P&amp;L</span>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] text-[#9ba8b8]">Portfolio</span>
                  <Dropdown
                    value={selectedFundName}
                    options={fundOptions}
                    onChange={(name) => {
                      const found = portfolios.find((p) => p.name === name)
                      if (found) setFundId(found.id)
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] text-[#9ba8b8]">Cost basis methodology</span>
                  <Dropdown value={method} options={METHOD_OPTIONS.map((m) => m.label)} onChange={setMethod} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] text-[#9ba8b8]">Valuation date &amp; cut-off</span>
                  <input
                    type="datetime-local"
                    value={asOfLocal}
                    onChange={(e) => setAsOfLocal(e.target.value)}
                    className="h-9 w-full rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px] outline-none focus:border-[#2f87fa]"
                  />
                </label>
              </div>
              <div className="mt-5 rounded-2xl border border-white/[.05] bg-[#09111d] p-4 text-[10px] text-[#8290a4]">
                <p className="flex justify-between">
                  <span>Selected fund</span>
                  <strong className="text-[#d6deea]">{fundId ? fundName(fundId) : '—'}</strong>
                </p>
                <p className="mt-2 flex justify-between">
                  <span>Method code</span>
                  <strong className="text-[#d6deea]">{methodValue}</strong>
                </p>
                <p className="mt-2 flex justify-between">
                  <span>Price / FX references</span>
                  <strong className="text-[#d6deea]">Set by valuation policy</strong>
                </p>
              </div>
              {runError && <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] p-3 text-[10px] text-rose-200">{runError}</div>}
              <button
                type="button"
                disabled={valuationRunning || !fundId}
                onClick={run}
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2f87fa] text-[10px] font-semibold text-white transition hover:bg-[#2277e6] disabled:opacity-60"
              >
                {valuationRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : lastCreated ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {valuationRunning ? 'Running valuation…' : lastCreated ? 'Run completed' : 'Run valuation'}
              </button>
              {lastCreated && (
                <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-300">{runLabel(lastCreated)}</span>
                    <Badge value={lastCreated.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[#8290a4]">
                    <p>
                      NAV output
                      <br />
                      <strong className="text-[#e1e8f0]">{navDisplay(lastCreated)}</strong>
                    </p>
                    <p>
                      As of
                      <br />
                      <strong className="text-[#e1e8f0]">{formatDate(lastCreated.asOf)}</strong>
                    </p>
                    <p>
                      Methodology
                      <br />
                      <strong className="text-[#e1e8f0]">{lastCreated.parametersJson?.costBasisMethod ?? methodValue}</strong>
                    </p>
                    <p>
                      Exceptions
                      <br />
                      <strong className="text-amber-300">{lastCreated.exceptions?.length ?? 0}</strong>
                    </p>
                  </div>
                </div>
              )}
            </section>
            <section className="min-w-0 overflow-hidden rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
              <div className="border-b border-white/[.06] p-4">
                <h2 className="text-[12px] font-semibold">NAV run history</h2>
                <p className="text-[9px] text-[#718096]">Inputs, outputs and exception counts for each calculation</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[930px] text-left text-[10px]">
                  <thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]">
                    <tr>
                      {['Run', 'Portfolio', 'As of', 'Method', 'Price / FX references', 'NAV output', 'P&L output', 'Exceptions', 'Status'].map((x) => (
                        <th key={x} className="px-4 py-3 font-medium">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[.045]">
                    {valuationRunsLoading || portfoliosLoading ? (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <OpsTableSkeleton rows={7} cols={9} />
                        </td>
                      </tr>
                    ) : valuationRuns.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-[#8290a4]">
                          No valuation runs yet. Create a run to populate this history.
                        </td>
                      </tr>
                    ) : (
                      valuationRuns.map((row) => (
                        <tr key={row.id} className="transition hover:bg-white/[.035]">
                          <td className="px-4 py-3">{runLabel(row)}</td>
                          <td className="px-4 py-3">{fundName(row.fundId)}</td>
                          <td className="px-4 py-3 text-[#8290a4]">{formatDate(row.asOf)}</td>
                          <td className="px-4 py-3">{row.parametersJson?.costBasisMethod ?? '—'}</td>
                          <td className="px-4 py-3 text-[#8290a4]">Policy governed</td>
                          <td className="px-4 py-3 font-mono">{navDisplay(row)}</td>
                          <td className="px-4 py-3 font-mono text-[#8290a4]">{pnlDisplay(row)}</td>
                          <td className="px-4 py-3 text-center">{row.exceptions?.length ?? 0}</td>
                          <td className="px-4 py-3">
                            <Badge value={row.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === 'P&L Runs' && (
          <TableCard
            title="P&L calculation runs"
            subtitle="Same GET /valuation/runs list — P&L columns (total, realised, unrealised) are included on each run"
            headers={['Run', 'Portfolio', 'As of', 'Method', 'Total P&L', 'Realised P&L', 'Unrealised P&L', 'NAV output', 'Status']}
            empty="No valuation runs returned by GET /valuation/runs."
            loading={valuationRunsLoading}
            rows={valuationRuns.map((r) => [
              runLabel(r),
              fundName(r.fundId),
              formatDate(r.asOf),
              r.parametersJson?.costBasisMethod ?? '—',
              pnlColumn(r.totalPnl) !== '—' ? pnlColumn(r.totalPnl) : pnlDisplay(r),
              pnlColumn(r.realizedPnl),
              pnlColumn(r.unrealizedPnl),
              navDisplay(r),
              <Badge key="b" value={r.status} />,
            ])}
          />
        )}

        {tab === 'Price Validation' && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[12px] font-semibold">Approved price references</h2>
                <p className="text-[9px] text-[#718096]">Validation against tolerance, freshness and source policy</p>
              </div>
              <label className="flex items-center gap-2 text-[10px] text-[#9ba8b8]">
                Run
                <Dropdown value={selectedRunLabel} options={runOptions} onChange={selectRunByLabel} />
              </label>
            </div>
            {runInputsError && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[10px] text-rose-200">{runInputsError}</div>}
            <TableCard
              title="Price inputs"
              subtitle={`Run ${selectedRunLabel}`}
              headers={['Instrument', 'Price', 'Source', 'As of', 'Status']}
              empty="No price inputs returned for the selected run."
              loading={runInputsLoading}
              rows={runPrices.map((row) => [
                cellValue(row, ['symbol', 'ticker', 'instrumentCode', 'instrumentId', 'id']),
                cellValue(row, ['price', 'overridePrice', 'value']),
                cellValue(row, ['source', 'pricingSource', 'priceSource']),
                cellValue(row, ['asOf', 'pricedAt', 'effectiveAt']),
                cellValue(row, ['status', 'validationStatus']),
              ])}
            />
          </div>
        )}

        {tab === 'FX Conversion' && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[12px] font-semibold">Approved FX references</h2>
                <p className="text-[9px] text-[#718096]">Rates used to translate positions into portfolio base currency</p>
              </div>
              <label className="flex items-center gap-2 text-[10px] text-[#9ba8b8]">
                Run
                <Dropdown value={selectedRunLabel} options={runOptions} onChange={selectRunByLabel} />
              </label>
            </div>
            {runInputsError && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[10px] text-rose-200">{runInputsError}</div>}
            <TableCard
              title="FX inputs"
              subtitle={`Run ${selectedRunLabel}`}
              headers={['Pair', 'Rate', 'Source', 'As of']}
              empty="No FX inputs returned for the selected run."
              loading={runInputsLoading}
              rows={runFxRates.map((row) => [
                cellValue(row, ['pair', 'currencyPair', 'fromCurrency', 'baseCurrency', 'id']),
                cellValue(row, ['rate', 'fxRate', 'value']),
                cellValue(row, ['source', 'fxRateSource', 'priceSource']),
                cellValue(row, ['asOf', 'effectiveAt', 'pricedAt']),
              ])}
            />
          </div>
        )}

        {tab === 'Valuation Exceptions' && (
          <TableCard
            title="Valuation exceptions"
            subtitle="Items requiring resolution or controlled override"
            headers={['Exception', 'Type', 'Fund', 'Issue', 'Run', 'Status', '']}
            empty="No valuation exceptions returned by the API."
            loading={valuationExceptionsLoading}
            rows={valuationExceptions.map((r) => [
              r.message || r.exceptionType,
              r.exceptionType,
              fundName(r.fundId),
              r.message || '—',
              r.valuationRunId
                ? runLabel(valuationRuns.find((run) => run.id === r.valuationRunId) ?? { id: r.valuationRunId })
                : '—',
              <Badge key="b" value={r.status} />,
              <button
                key="a"
                type="button"
                onClick={() => openExceptionModal(r)}
                className="rounded-full bg-[#2f87fa] px-3 py-1.5 text-[9px] text-white"
              >
                View
              </button>,
            ])}
          />
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setModal(null)}>
          <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-[24px] border border-white/10 bg-[#111a28] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[.07] p-5">
              <div>
                <h2 className="text-sm font-semibold">Valuation exception</h2>
                <p className="mt-1 text-[10px] text-[#7890ad]">
                  {modal.exceptionType} · {fundName(modal.fundId)}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)} className="rounded-full p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-2xl bg-[#09111d] p-4 text-[10px] text-[#96a3b4]">
                <ShieldAlert className="mb-2 h-4 w-4 text-amber-300" />
                {modal.message || 'No additional message from the API.'}
                <p className="mt-2 text-[#d4dce7]">Fund: {fundName(modal.fundId)}</p>
                <p className="mt-1 text-[#d4dce7]">
                  Run:{' '}
                  {modal.valuationRunId
                    ? runLabel(valuationRuns.find((run) => run.id === modal.valuationRunId) ?? { id: modal.valuationRunId })
                    : '—'}
                </p>
                <p className="mt-1">
                  Status: <Badge value={modal.status} />
                </p>
              </div>
              <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-3 text-[10px] text-amber-100">
                Resolve with a reason, or submit a controlled price override when policy allows.
              </div>
              <label className="block">
                <span className="mb-2 block text-[10px] text-[#a9b5c4]">Reason</span>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#354257] bg-[#0b1420] p-3 text-[10px] outline-none focus:border-[#2f87fa]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] text-[#a9b5c4]">Override price (optional)</span>
                <input
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  placeholder="e.g. 4.50"
                  className="h-9 w-full rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px] outline-none focus:border-[#2f87fa]"
                />
              </label>
              {exceptionActionError && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] p-3 text-[10px] text-rose-200">{exceptionActionError}</div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-white/[.07] p-4">
              <button type="button" onClick={() => setModal(null)} className="rounded-full border border-white/10 px-4 py-2 text-[10px]">
                Close
              </button>
              <button
                type="button"
                disabled={!exceptionReason.trim() || exceptionActionLoading}
                onClick={() => void escalateException()}
                className="rounded-full border border-fuchsia-400/30 px-4 py-2 text-[10px] text-fuchsia-200 disabled:opacity-40"
              >
                Escalate
              </button>
              <button
                type="button"
                disabled={exceptionActionLoading}
                onClick={() => void approveOverride()}
                className="rounded-full border border-emerald-400/30 px-4 py-2 text-[10px] text-emerald-200 disabled:opacity-40"
              >
                Approve override
              </button>
              <button
                type="button"
                disabled={!exceptionReason.trim() || exceptionActionLoading}
                onClick={() => void rejectOverride()}
                className="rounded-full border border-rose-400/30 px-4 py-2 text-[10px] text-rose-300 disabled:opacity-40"
              >
                Reject override
              </button>
              <button
                type="button"
                disabled={!overridePrice.trim() || !exceptionReason.trim() || exceptionActionLoading}
                onClick={overrideException}
                className="rounded-full border border-amber-400/30 px-4 py-2 text-[10px] text-amber-200 disabled:opacity-40"
              >
                {exceptionActionLoading ? 'Submitting…' : 'Override'}
              </button>
              <button
                type="button"
                disabled={!exceptionReason.trim() || exceptionActionLoading}
                onClick={resolveException}
                className="rounded-full bg-[#2f87fa] px-4 py-2 text-[10px] font-semibold text-white disabled:opacity-40"
              >
                {exceptionActionLoading ? 'Submitting…' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function EmptyPanel({ title, subtitle, message }: { title: string; subtitle: string; message: string }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
      <div className="border-b border-white/[.06] p-4">
        <h2 className="text-[12px] font-semibold">{title}</h2>
        <p className="text-[9px] text-[#718096]">{subtitle}</p>
      </div>
      <div className="px-4 py-12 text-center text-[11px] text-[#8290a4]">{message}</div>
    </section>
  )
}

function TableCard({
  title,
  subtitle,
  headers,
  rows,
  empty,
  loading,
}: {
  title: string
  subtitle: string
  headers: string[]
  rows: React.ReactNode[][]
  empty: string
  loading?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
      <div className="border-b border-white/[.06] p-4">
        <h2 className="text-[12px] font-semibold">{title}</h2>
        <p className="text-[9px] text-[#718096]">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-[10px]">
          <thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-[#8290a4]">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="transition hover:bg-white/[.035]">
                  {row.map((cell, j) => (
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
    </section>
  )
}
