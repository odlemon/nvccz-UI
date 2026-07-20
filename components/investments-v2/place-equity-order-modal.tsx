'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Modal, SelectField } from '@/components/investments-v2/orders-ui'
import { OpsListSkeleton } from '@/components/investments-v2/loading-skeletons'
import {
  investmentOpsApi,
  formatOpsError,
  unwrapList,
  type Instrument,
  type OrderPreview,
  type OpsFund,
} from '@/lib/api/investment-ops-api'
import { cn } from '@/lib/utils'

export interface PlaceEquityOrderModalProps {
  open: boolean
  onClose: () => void
  onComplete?: () => void
}

type Side = 'BUY' | 'SELL'
type ChartPeriod = '1D' | '1W' | '1M' | '3M' | '1Y'

const fieldClass = 'equity-order-field h-9 w-full rounded-full px-3 text-[10px] outline-none transition'
const panelClass = 'equity-order-panel rounded-xl'

function Label({ children, help = false }: { children: React.ReactNode; help?: boolean }) {
  return (
    <span className="equity-order-label mb-1.5 flex items-center gap-1 text-[9px]">
      {children}
      {help && <CircleHelp className="h-3 w-3" />}
    </span>
  )
}

function Money({ value, currency = 'USD' }: { value: number; currency?: string }) {
  return (
    <>
      {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
    </>
  )
}

function n(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(num) ? num : null
}

function periodFrom(period: ChartPeriod): string {
  const d = new Date()
  if (period === '1D') d.setDate(d.getDate() - 1)
  else if (period === '1W') d.setDate(d.getDate() - 7)
  else if (period === '1M') d.setMonth(d.getMonth() - 1)
  else if (period === '3M') d.setMonth(d.getMonth() - 3)
  else d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().slice(0, 10)
}

export function PlaceEquityOrderModal({ open, onClose, onComplete }: PlaceEquityOrderModalProps) {
  const [side, setSide] = useState<Side>('BUY')
  const [fundId, setFundId] = useState('')
  const [instrumentId, setInstrumentId] = useState('')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [quantity, setQuantity] = useState('10000')
  const [limitPrice, setLimitPrice] = useState('')
  const [timeInForce, setTimeInForce] = useState('Day')
  const [validity, setValidity] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1D')
  const [skipConfirmation, setSkipConfirmation] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [funds, setFunds] = useState<OpsFund[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [preview, setPreview] = useState<OrderPreview | null>(null)
  const [historyPoints, setHistoryPoints] = useState<number[]>([])

  const instrument = instruments.find((item) => item.id === instrumentId) ?? null
  const fund = funds.find((item) => item.id === fundId) ?? null
  const currency = instrument?.listingCurrencyCode || 'USD'
  const lastPrice =
    n(instrument?.latestPrice) ??
    n((preview?.estimatedJson as { approvedPrice?: { price?: string } } | undefined)?.approvedPrice?.price) ??
    n(limitPrice) ??
    0

  const est = (preview?.estimatedJson ?? {}) as Record<string, any>
  const holdingBefore = n(est.holding?.quantityBefore) ?? 0
  const holdingAfter = n(est.holding?.quantityAfter)
  const wacBefore = n(est.holding?.wac) ?? 0
  const cashBefore = n(est.cash?.balanceBefore)
  const feeAmount = n(est.feesAndTaxes?.feeAmount) ?? 0
  const taxAmount = n(est.feesAndTaxes?.taxAmount) ?? 0
  const netAmount = n(est.settlement?.netAmount)
  const weightAfter = n(est.exposure?.securityWeightAfterPct)

  const shares = Math.max(0, Number(quantity) || 0)
  const executionPrice = orderType === 'MARKET' ? lastPrice : Math.max(0, Number(limitPrice) || 0)
  const orderValue = shares * executionPrice
  const fees = feeAmount + taxAmount
  const consideration = netAmount ?? (side === 'BUY' ? orderValue + fees : Math.max(0, orderValue - fees))
  const chartPoints = historyPoints.length >= 2 ? historyPoints : lastPrice > 0 ? [lastPrice * 0.99, lastPrice] : []
  const chartChange =
    chartPoints.length >= 2 ? chartPoints[chartPoints.length - 1]! - chartPoints[0]! : 0
  const isValid = Boolean(fundId && instrumentId && shares > 0 && (orderType === 'MARKET' || executionPrice > 0))
  const missingMastersHint =
    !loadingMeta && !loadError
      ? funds.length === 0
        ? 'No portfolios returned by the API. Funds are seeded outside this ticket — cannot place an order without a fund.'
        : instruments.length === 0
          ? 'No ACTIVE instruments. Create an instrument, then Submit → Approve on Instrument registry.'
          : null
      : null

  const chartGeometry = useMemo(() => {
    if (!chartPoints.length) {
      return { line: '', area: '', min: 0, max: 0 }
    }
    const min = Math.min(...chartPoints)
    const max = Math.max(...chartPoints)
    const range = Math.max(max - min, 1)
    const coordinates = chartPoints.map((point, index) => {
      const x = (index / Math.max(chartPoints.length - 1, 1)) * 430
      const y = 20 + ((max - point) / range) * 92
      return [x, y] as const
    })
    const line = coordinates.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    return { line, area: `${line} L430 128 L0 128 Z`, min, max }
  }, [chartPoints])

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true)
    setLoadError(null)
    try {
      const [fundsRes, instrRes] = await Promise.all([
        investmentOpsApi.listPortfolios(),
        investmentOpsApi.listInstruments({ page: 1, pageSize: 200, status: 'ACTIVE' }),
      ])
      if (fundsRes.success === false) throw new Error(formatOpsError(fundsRes))
      if (instrRes.success === false) throw new Error(formatOpsError(instrRes))
      const nextFunds = unwrapList<OpsFund>(fundsRes.data)
      const nextInstr = unwrapList<Instrument>(instrRes.data)
      setFunds(nextFunds)
      setInstruments(nextInstr)
      if (!fundId && nextFunds[0]?.id) setFundId(nextFunds[0].id)
      if (!instrumentId && nextInstr[0]?.id) {
        setInstrumentId(nextInstr[0].id)
        if (nextInstr[0].latestPrice != null) {
          setLimitPrice(String(nextInstr[0].latestPrice))
        } else {
          setOrderType('LIMIT')
        }
      } else if (nextInstr.length === 0) {
        setInstrumentId('')
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load order options')
      setFunds([])
      setInstruments([])
    } finally {
      setLoadingMeta(false)
    }
  }, [fundId, instrumentId])

  useEffect(() => {
    if (!open) return
    void loadMeta()
  }, [open, loadMeta])

  useEffect(() => {
    if (!open || !instrument?.listedEquitySecurityId) {
      setHistoryPoints([])
      return
    }
    let cancelled = false
    void investmentOpsApi
      .getPriceHistory(instrument.listedEquitySecurityId, { from: periodFrom(chartPeriod), limit: 60 })
      .then((res) => {
        if (cancelled || res.success === false) return
        const series = res.data?.series ?? res.data?.items
        const raw = Array.isArray(series) ? series : unwrapList<{ price?: string | number }>(res.data)
        const pts = raw.map((p) => n(p.price)).filter((v): v is number => v != null)
        setHistoryPoints(pts)
      })
      .catch(() => {
        if (!cancelled) setHistoryPoints([])
      })
    return () => {
      cancelled = true
    }
  }, [open, instrument?.listedEquitySecurityId, chartPeriod])

  const close = () => {
    setReviewed(false)
    setPreview(null)
    setError(null)
    onClose()
  }

  const runPreview = async () => {
    if (!isValid || !fundId || !instrumentId) return
    setPreviewing(true)
    setError(null)
    try {
      const res = await investmentOpsApi.previewOrder({
        fundId,
        instrumentId,
        side,
        quantity: String(shares),
        orderType,
        limitPrice: orderType === 'LIMIT' ? String(executionPrice) : undefined,
        tradeCurrency: currency,
        settlementCurrency: currency,
        valueDate: validity || undefined,
        notes: `TIF=${timeInForce}`,
      })
      if (res.success === false || !res.data?.id || !res.data?.inputHash) {
        throw new Error(formatOpsError(res, 'Order preview failed'))
      }
      setPreview(res.data)
      setReviewed(true)
    } catch (e) {
      setPreview(null)
      setReviewed(false)
      setError(e instanceof Error ? e.message : 'Order preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const placeOrder = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    try {
      let commit = preview
      if (!commit?.id || !commit.inputHash) {
        const res = await investmentOpsApi.previewOrder({
          fundId,
          instrumentId,
          side,
          quantity: String(shares),
          orderType,
          limitPrice: orderType === 'LIMIT' ? String(executionPrice) : undefined,
          tradeCurrency: currency,
          settlementCurrency: currency,
          valueDate: validity || undefined,
          notes: `TIF=${timeInForce}`,
        })
        if (res.success === false || !res.data?.id || !res.data?.inputHash) {
          throw new Error(formatOpsError(res, 'Order preview failed'))
        }
        commit = res.data
        setPreview(commit)
      }
      const created = await investmentOpsApi.createOrder({
        previewId: String(commit.id),
        inputHash: String(commit.inputHash),
      })
      if (created.success === false || !created.data?.id) {
        throw new Error(formatOpsError(created, 'Create order failed'))
      }
      const createdVersion = created.data.version ?? created.data.auditVersion
      // Move draft into the approval pipeline when possible
      try {
        const submitted = await investmentOpsApi.submitOrder(
          created.data.id,
          createdVersion != null ? { expectedVersion: createdVersion } : {},
        )
        if (submitted.success === false) {
          setError(
            `Order created as draft, but submit failed: ${formatOpsError(submitted, 'submit rejected')}. Open orderbook to submit/approve.`,
          )
          onComplete?.()
          return
        }
      } catch (submitErr) {
        setError(
          `Order created as draft, but submit failed: ${formatOpsError(submitErr, 'submit rejected')}. Open orderbook to submit/approve.`,
        )
        onComplete?.()
        return
      }
      onComplete?.()
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Place order failed')
    } finally {
      setSubmitting(false)
    }
  }

  const setOrderSide = (value: Side) => {
    setSide(value)
    setReviewed(false)
    setPreview(null)
  }

  const complianceOutcome =
    preview?.complianceJson?.outcome ?? preview?.compliancePreview?.outcome ?? null
  const complianceMessage =
    preview?.complianceJson?.message ?? preview?.compliancePreview?.message ?? null

  return (
    <Modal
      open={open}
      onClose={close}
      title="Place Equity Order"
      width="max-w-[980px]"
      footer={
        <div className="equity-order-footer flex w-full flex-wrap items-center justify-end gap-2">
          <label className="equity-order-footer-label mr-auto flex items-center gap-2 text-[9px]">
            <input
              type="checkbox"
              checked={skipConfirmation}
              onChange={(event) => setSkipConfirmation(event.target.checked)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            Don&apos;t show confirmation again
          </label>
          <button
            type="button"
            onClick={close}
            className="equity-order-button equity-order-button-secondary h-9 rounded-full px-5 text-[10px] font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || previewing || submitting}
            onClick={() => void runPreview()}
            className="equity-order-button equity-order-button-review h-9 rounded-full px-5 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {previewing ? 'Previewing…' : reviewed ? 'Re-preview' : 'Review Order'}
          </button>
          <button
            type="button"
            disabled={!isValid || submitting || previewing}
            onClick={() => void placeOrder()}
            className={cn(
              'equity-order-button flex h-9 items-center gap-2 rounded-full px-5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40',
              side === 'BUY' ? 'equity-order-button-buy' : 'equity-order-button-sell',
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Placing…
              </>
            ) : (
              <>
                Place {side === 'BUY' ? 'Buy' : 'Sell'} Order <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="equity-order-ticket">
        {(loadError || error || missingMastersHint) && (
          <div
            className={`mb-2 rounded-xl border px-3 py-2 text-[10px] ${
              loadError || error
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-100'
            }`}
          >
            {error || loadError || missingMastersHint}
          </div>
        )}
        {loadingMeta && (
          <div className="mb-2">
            <OpsListSkeleton rows={3} />
          </div>
        )}
        {!loadingMeta && instrument && lastPrice <= 0 && orderType === 'MARKET' && (
          <div className="mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[10px] text-amber-100">
            No approved mark on this instrument. Prefer Limit + enter a price, or post/approve a price first.
          </div>
        )}

        <section className={cn(panelClass, 'equity-order-market mb-2.5 grid overflow-hidden lg:grid-cols-[1.02fr_1.18fr]')}>
          <div className="p-4">
            <p className="equity-order-title text-[11px] font-semibold">
              {instrument ? `${instrument.shortName || instrument.fullName} (${instrument.ticker})` : 'Select instrument'}
            </p>
            <div className="mt-2.5 grid grid-cols-[1fr_auto_auto] items-center gap-5">
              <div>
                <p className="equity-order-price font-mono text-xl font-semibold">
                  {currency} {lastPrice > 0 ? lastPrice.toFixed(4) : '—'}
                </p>
                <p
                  className={cn(
                    'mt-1 flex items-center gap-1.5 text-[10px] font-medium',
                    chartChange >= 0 ? 'equity-order-positive' : 'equity-order-negative',
                  )}
                >
                  {chartPoints.length >= 2 ? (
                    <>
                      {chartChange >= 0 ? '+' : '−'}
                      {Math.abs(chartChange).toFixed(4)}
                      {chartChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    </>
                  ) : (
                    <span className="equity-order-muted">No history series</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="equity-order-chart relative min-h-40 border-t p-3 pt-4 lg:border-l lg:border-t-0">
            <select
              aria-label="Chart period"
              value={chartPeriod}
              onChange={(event) => setChartPeriod(event.target.value as ChartPeriod)}
              className="equity-order-period absolute left-3 top-3 z-10 h-7 rounded-full px-2.5 text-[8px] font-medium outline-none"
            >
              {(['1D', '1W', '1M', '3M', '1Y'] as ChartPeriod[]).map((period) => (
                <option key={period}>{period}</option>
              ))}
            </select>
            {chartGeometry.line ? (
              <svg viewBox="0 0 480 140" className="mt-2 h-32 w-full" preserveAspectRatio="none" aria-label={`${chartPeriod} price chart`}>
                <defs>
                  <linearGradient id="equity-order-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop className="equity-order-chart-fill-start" offset="0" />
                    <stop className="equity-order-chart-fill-end" offset="1" />
                  </linearGradient>
                </defs>
                {[32, 64, 96].map((y) => (
                  <line className="equity-order-chart-grid" key={y} x1="0" y1={y} x2="430" y2={y} />
                ))}
                <path d={chartGeometry.area} fill="url(#equity-order-chart-fill)" />
                <path
                  className={cn('equity-order-chart-line', chartChange < 0 && 'is-negative')}
                  d={chartGeometry.line}
                  fill="none"
                />
              </svg>
            ) : (
              <div className="mt-10 text-center text-[10px] text-slate-500">Price history unavailable for this security</div>
            )}
          </div>
        </section>

        <div className="grid gap-2.5 lg:grid-cols-[.91fr_1.14fr]">
          <section className={cn(panelClass, 'p-3')}>
            <div className="equity-order-segment grid grid-cols-2 gap-1 rounded-full p-1">
              {(['BUY', 'SELL'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderSide(value)}
                  className={cn(
                    'h-8 rounded-full text-[9px] font-semibold transition',
                    side === value
                      ? value === 'BUY'
                        ? 'equity-order-tab-buy text-white'
                        : 'equity-order-tab-sell text-white'
                      : 'equity-order-tab-idle',
                  )}
                >
                  {value === 'BUY' ? 'Buy' : 'Sell'}
                </button>
              ))}
            </div>
            <h3 className="equity-order-heading mt-3 text-[10px] font-semibold">Order Details</h3>
            <div className="mt-2.5 space-y-2.5">
              <div>
                <Label help>Portfolio</Label>
                <SelectField
                  value={fundId}
                  onChange={(value) => {
                    setFundId(value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option value="">Select fund…</option>
                  {funds.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div>
                <Label help>Instrument</Label>
                <SelectField
                  value={instrumentId}
                  onChange={(value) => {
                    setInstrumentId(value)
                    const next = instruments.find((i) => i.id === value)
                    if (next?.latestPrice != null) setLimitPrice(String(next.latestPrice))
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option value="">Select instrument…</option>
                  {instruments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.ticker} — {item.shortName || item.fullName}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div>
                <Label help>Order Type</Label>
                <div className="equity-order-segment grid grid-cols-2 gap-1 rounded-full p-1">
                  {(['MARKET', 'LIMIT'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setOrderType(value)
                        setReviewed(false)
                        setPreview(null)
                      }}
                      className={cn(
                        'h-7 rounded-full text-[8px] font-medium transition',
                        orderType === value ? 'equity-order-tab-buy text-white' : 'equity-order-tab-idle',
                      )}
                    >
                      {value[0] + value.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label help>Quantity</Label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value)
                      setReviewed(false)
                      setPreview(null)
                    }}
                    className={cn(fieldClass, 'pr-14')}
                  />
                  <span className="equity-order-label absolute right-3 top-2.5 text-[8px]">Shares</span>
                </div>
              </div>
              <div>
                <Label help>Price ({currency})</Label>
                <input
                  type="number"
                  min="0"
                  value={orderType === 'MARKET' ? (lastPrice || '') : limitPrice}
                  disabled={orderType === 'MARKET'}
                  onChange={(event) => {
                    setLimitPrice(event.target.value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                  className={fieldClass}
                />
                <p className="equity-order-muted mt-1 text-[8px]">
                  {orderType === 'MARKET'
                    ? lastPrice
                      ? 'Market order uses latest approved mark when available'
                      : 'No latest price on instrument — BE may reject MARKET until a mark exists'
                    : 'Enter limit price'}
                </p>
              </div>
              <div>
                <Label help>Time in Force</Label>
                <SelectField
                  value={timeInForce}
                  onChange={(value) => {
                    setTimeInForce(value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option>Day</option>
                  <option>Good Till Cancelled</option>
                  <option>Fill or Kill</option>
                </SelectField>
              </div>
              <div>
                <Label help>Validity / value date</Label>
                <div className="relative">
                  <input
                    type="date"
                    value={validity}
                    onChange={(event) => {
                      setValidity(event.target.value)
                      setReviewed(false)
                      setPreview(null)
                    }}
                    className={cn(fieldClass, 'pr-10')}
                  />
                  <CalendarDays className="equity-order-muted pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5" />
                </div>
              </div>
            </div>
            <div className="equity-order-fees mt-3 space-y-1.5 border-t pt-3 text-[8px]">
              <div className="flex justify-between">
                <span className="equity-order-label">Est. fees / taxes</span>
                <span className="font-mono">
                  <Money value={fees} currency={currency} />
                </span>
              </div>
              <div className="equity-order-fee-total flex justify-between border-t pt-2 text-[9px] font-semibold">
                <span>{side === 'BUY' ? 'Total consideration' : 'Net proceeds'}</span>
                <span className="font-mono">
                  <Money value={consideration} currency={currency} />
                </span>
              </div>
            </div>
            <div
              className={cn(
                'equity-order-status mt-3 flex items-center gap-3 rounded-xl border p-3',
                isValid ? 'is-valid' : 'is-invalid',
              )}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-[9px] font-medium">
                  {complianceOutcome
                    ? `Compliance: ${complianceOutcome}${complianceMessage ? ` — ${complianceMessage}` : ''}`
                    : isValid
                      ? 'Ready to preview against live Investment Ops'
                      : 'Select fund, instrument and quantity'}
                </p>
                <p className="mt-1 text-[8px] opacity-75">
                  {fund ? `Fund: ${fund.name}` : 'No fund selected'}
                  {cashBefore != null ? ` · Cash before: ${cashBefore.toLocaleString()}` : ''}
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-2.5">
            <section className={cn(panelClass, 'p-4')}>
              <h3 className="equity-order-heading text-[10px] font-semibold">Existing Holding (from preview)</h3>
              <div className="equity-order-holding-top mt-3 grid grid-cols-1 sm:grid-cols-3">
                {[
                  ['Current Shares', preview ? holdingBefore.toLocaleString() : '—'],
                  ['Avg. Cost', preview && wacBefore ? wacBefore.toFixed(4) : '—'],
                  ['Cash before', cashBefore != null ? cashBefore.toLocaleString() : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="equity-order-metric">
                    <p className="equity-order-label text-[8px]">{label}</p>
                    <p className="equity-order-value mt-1.5 font-mono text-[10px]">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={cn(panelClass, 'p-4')}>
              <h3 className="equity-order-heading text-[10px] font-semibold">
                Impact of This Order ({side === 'BUY' ? 'Buy' : 'Sell'} {shares.toLocaleString()} Shares)
              </h3>
              <div className="mt-3 space-y-2 text-[9px]">
                <div className="flex justify-between">
                  <span className="equity-order-label">Shares after</span>
                  <span className="font-mono">{holdingAfter != null ? holdingAfter.toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="equity-order-label">Weight after</span>
                  <span className="font-mono">{weightAfter != null ? `${weightAfter.toFixed(2)}%` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="equity-order-label">Cash impact</span>
                  <span className="font-mono">{est.cash?.impact != null ? String(est.cash.impact) : '—'}</span>
                </div>
              </div>
              <div className="equity-order-callout mt-2.5 flex items-start gap-3 rounded-xl border p-3">
                {side === 'BUY' ? (
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p className="text-[8px] leading-4">
                  {preview
                    ? 'Impact figures come from POST /orders/preview estimatedJson.'
                    : 'Run Review Order to load live cash, fees and holding impact from the API.'}
                </p>
              </div>
            </section>

            <section className={cn(panelClass, 'p-4')}>
              <h3 className="equity-order-heading text-[10px] font-semibold">Order Summary</h3>
              <div className="mt-3 space-y-2 text-[8px]">
                <div className="flex justify-between gap-4">
                  <span className="equity-order-label">Order value</span>
                  <span className="font-mono">
                    <Money value={orderValue} currency={currency} />
                  </span>
                </div>
                <div className="equity-order-summary-total flex justify-between gap-4 border-t pt-2 text-[9px] font-semibold">
                  <span>{side === 'BUY' ? 'Total Consideration' : 'Net Proceeds'}</span>
                  <span className="equity-order-accent font-mono">
                    <Money value={consideration} currency={currency} />
                  </span>
                </div>
              </div>
            </section>
            {reviewed && (
              <div className="equity-order-reviewed rounded-xl border px-4 py-3 text-[9px]">
                Preview ready ({preview?.id}). Place order commits via previewId + inputHash.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
