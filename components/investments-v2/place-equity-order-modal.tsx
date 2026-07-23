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
  type ApprovalRoute,
  type Instrument,
  type OrderPreview,
  type OpsFund,
} from '@/lib/api/investment-ops-api'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import { mapComplianceOutcomeLabel } from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface PlaceEquityOrderModalProps {
  open: boolean
  onClose: () => void
  onComplete?: () => void
}

type Side = 'BUY' | 'SELL'
type ChartPeriod = '1D' | '1W' | '1M' | '3M' | '1Y'
type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'

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
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [quantity, setQuantity] = useState('10000')
  const [limitPrice, setLimitPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [timeInForce, setTimeInForce] = useState('Day')
  const [validity, setValidity] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [brokerId, setBrokerId] = useState('')
  const [custodianId, setCustodianId] = useState('')
  const [settlementAccountId, setSettlementAccountId] = useState('')
  const [approvalRouteId, setApprovalRouteId] = useState('')
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([])
  const [custodians, setCustodians] = useState<{ id: string; name: string }[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<{ id: string; name: string }[]>([])
  const [fundCashAvailable, setFundCashAvailable] = useState<number | null>(null)
  const [fundCashCurrency, setFundCashCurrency] = useState('USD')
  const [fundCashLoading, setFundCashLoading] = useState(false)
  const [fundCashLabel, setFundCashLabel] = useState<string | null>(null)
  const [approvalRoutes, setApprovalRoutes] = useState<{ id: string; name: string }[]>([])
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1D')
  const [skipConfirmation, setSkipConfirmation] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [submitAsDraft, setSubmitAsDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [funds, setFunds] = useState<OpsFund[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [preview, setPreview] = useState<OrderPreview | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [historyPoints, setHistoryPoints] = useState<number[]>([])
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

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
  const stopPx = Math.max(0, Number(stopPrice) || 0)
  const limitPx = Math.max(0, Number(limitPrice) || 0)
  const executionPrice =
    orderType === 'MARKET'
      ? lastPrice
      : orderType === 'STOP'
        ? stopPx
        : limitPx
  const orderValue = shares * executionPrice
  const fees = feeAmount
  const taxes = taxAmount
  const feesAndTaxes = feeAmount + taxAmount
  const consideration = netAmount ?? (side === 'BUY' ? orderValue + feesAndTaxes : Math.max(0, orderValue - feesAndTaxes))
  const cashShortfall =
    side === 'BUY' &&
    fundCashAvailable != null &&
    Number.isFinite(consideration) &&
    consideration > fundCashAvailable
  const exposureImpact = n(est.exposure?.exposureImpactPct) ?? n(est.exposureImpactPct)
  const chartPoints = historyPoints.length >= 2 ? historyPoints : lastPrice > 0 ? [lastPrice * 0.99, lastPrice] : []
  const chartChange =
    chartPoints.length >= 2 ? chartPoints[chartPoints.length - 1]! - chartPoints[0]! : 0
  const pricedOk =
    orderType === 'MARKET'
      ? lastPrice > 0
      : orderType === 'STOP'
        ? stopPx > 0
        : orderType === 'STOP_LIMIT'
          ? stopPx > 0 && limitPx > 0
          : limitPx > 0
  const isValid = Boolean(fundId && instrumentId && shares > 0 && pricedOk)
  const canPlace = isValid && (reviewed || skipConfirmation) && !!preview?.id
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
      const [fundsRes, instrRes, brokersRes, custodiansRes, routesRes, cashRes] = await Promise.all([
        investmentOpsApi.listPortfolios(),
        investmentOpsApi.listInstruments({ page: 1, pageSize: 200, status: 'ACTIVE' }),
        investmentOpsApi.listBrokers().catch(() => null),
        investmentOpsApi.listCustodians().catch(() => null),
        investmentOpsApi.listApprovalRoutes({ pageSize: 100 }).catch(() => null),
        stockPickerCashApi.listClientCashAccounts({ pageSize: 100 }).catch(() => null),
      ])
      if (fundsRes.success === false) throw new Error(formatOpsError(fundsRes))
      if (instrRes.success === false) throw new Error(formatOpsError(instrRes))
      const nextFunds = unwrapList<OpsFund>(fundsRes.data)
      const nextInstr = unwrapList<Instrument>(instrRes.data)
      setFunds(nextFunds)
      setInstruments(nextInstr)
      if (brokersRes && brokersRes.success !== false) {
        const rows = unwrapList<{ id?: string; name?: string }>(brokersRes.data)
          .map((b) => ({ id: String(b.id ?? ''), name: String(b.name ?? b.id ?? 'Broker') }))
          .filter((b) => b.id)
        setBrokers(rows)
        setBrokerId((prev) => prev || rows[0]?.id || '')
      }
      if (custodiansRes && custodiansRes.success !== false) {
        const rows = unwrapList<{ id?: string; name?: string }>(custodiansRes.data)
          .map((c) => ({ id: String(c.id ?? ''), name: String(c.name ?? c.id ?? 'Custodian') }))
          .filter((c) => c.id)
        setCustodians(rows)
        setCustodianId((prev) => prev || rows[0]?.id || '')
      }
      if (routesRes && routesRes.success !== false) {
        const rows = unwrapList<ApprovalRoute>(routesRes.data)
          .map((r) => ({ id: String(r.id ?? ''), name: String(r.name ?? r.id ?? 'Route') }))
          .filter((r) => r.id)
        setApprovalRoutes(rows)
        setApprovalRouteId((prev) => prev || rows[0]?.id || '')
      }
      if (cashRes && (cashRes as { success?: boolean }).success !== false) {
        const rows = unwrapList<{ id?: string; accountNumber?: string; clientName?: string }>(
          (cashRes as { data?: unknown }).data,
        )
          .map((a) => ({
            id: String(a.id ?? ''),
            name: String(a.accountNumber ?? a.clientName ?? a.id ?? 'Cash account'),
          }))
          .filter((a) => a.id)
        setSettlementAccounts(rows)
        // Do NOT auto-select — these may be recon client cash accounts, not fund settlement cash.
        // Sending a wrong settlementAccountId makes preview fail with "Persisted available cash is insufficient".
      }
      if (!fundId && nextFunds[0]?.id) setFundId(nextFunds[0].id)
      if (!instrumentId && nextInstr[0]?.id) {
        setInstrumentId(nextInstr[0].id)
        if (nextInstr[0].latestPrice != null) {
          setLimitPrice(String(nextInstr[0].latestPrice))
          setStopPrice(String(nextInstr[0].latestPrice))
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
    setSettlementAccountId('')
    void loadMeta()
  }, [open, loadMeta])

  useEffect(() => {
    if (!open || !fundId) {
      setFundCashAvailable(null)
      setFundCashLabel(null)
      return
    }
    let cancelled = false
    setFundCashLoading(true)
    setFundCashLabel(null)
    void (async () => {
      try {
        const [overviewRes, fundCashRes] = await Promise.all([
          investmentOpsApi.getPortfolioOverview(fundId).catch(() => null),
          stockPickerCashApi.getFundCashSummary({ fundId }).catch(() => null),
        ])
        if (cancelled) return

        const overview =
          overviewRes && overviewRes.success !== false ? (overviewRes.data as Record<string, unknown> | undefined) : null
        const fundCash =
          fundCashRes && fundCashRes.success !== false ? (fundCashRes.data as Record<string, unknown> | undefined) : null

        const pick = (...vals: unknown[]) => {
          for (const v of vals) {
            const num = n(v)
            if (num != null) return num
          }
          return null
        }

        const available = pick(
          fundCash?.orderEligibleAvailableCash,
          fundCash?.totalOrderEligibleAvailableCash,
          fundCash?.availableCash,
          fundCash?.available,
          overview?.orderEligibleAvailableCash,
          overview?.availableCash,
          overview?.cashBalance,
        )
        const ccy = String(
          fundCash?.currency ??
            fundCash?.baseCurrency ??
            overview?.baseCurrency ??
            fund?.baseCurrencyCode ??
            'USD',
        )
        setFundCashAvailable(available)
        setFundCashCurrency(ccy)
        if (available == null) {
          setFundCashLabel('Available cash not returned for this fund')
        } else {
          setFundCashLabel(null)
        }
      } catch {
        if (!cancelled) {
          setFundCashAvailable(null)
          setFundCashLabel('Could not load fund cash')
        }
      } finally {
        if (!cancelled) setFundCashLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, fundId, fund?.baseCurrencyCode])

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
    setSettlementAccountId('')
    onClose()
  }

  const buildPreviewPayload = () => ({
    fundId,
    instrumentId,
    side,
    quantity: String(shares),
    orderType,
    limitPrice:
      orderType === 'LIMIT' || orderType === 'STOP_LIMIT' ? String(limitPx || executionPrice) : undefined,
    stopPrice: orderType === 'STOP' || orderType === 'STOP_LIMIT' ? String(stopPx) : undefined,
    tradeCurrency: currency,
    settlementCurrency: currency,
    valueDate: validity || undefined,
    notes: `TIF=${timeInForce}`,
    brokerProfileId: brokerId || undefined,
    custodianProfileId: custodianId || undefined,
    // Only send when user explicitly picks one — empty means use fund default cash
    ...(settlementAccountId ? { settlementAccountId } : {}),
    approvalRouteId: approvalRouteId || undefined,
  })

  const runPreview = async () => {
    if (!isValid || !fundId || !instrumentId) return
    if (orderType === 'MARKET' && lastPrice <= 0) {
      setError('Instrument has no validated price. Switch to Limit or approve a price first (SRD 7.1 / 7.5).')
      return
    }
    setPreviewing(true)
    setError(null)
    try {
      const res = await investmentOpsApi.previewOrder(buildPreviewPayload())
      if (res.success === false || !res.data?.id || !res.data?.inputHash) {
        throw new Error(formatOpsError(res, 'Order preview failed'))
      }
      setPreview(res.data)
      setReviewed(true)
      setPreviewModalOpen(true)
    } catch (e) {
      setPreview(null)
      setReviewed(false)
      const raw = e instanceof Error ? e.message : 'Order preview failed'
      const isCash =
        /insufficient/i.test(raw) && /cash/i.test(raw)
      setError(
        isCash
          ? `${raw}. This fund’s order-eligible cash in the ledger is below the order cost (or a wrong settlement account was selected). Clear Settlement account (leave Optional), try a tiny Limit buy, or ask BE to top up / re-seed available cash for this portfolio.`
          : raw,
      )
    } finally {
      setPreviewing(false)
    }
  }

  const placeOrder = async () => {
    if (!isValid) return
    if (!reviewed && !skipConfirmation) {
      setError('Review the pre-trade panel first (SRD 8.5) — click Review Order before placing.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      let commit = preview
      if (!commit?.id || !commit.inputHash) {
        const res = await investmentOpsApi.previewOrder(buildPreviewPayload())
        if (res.success === false || !res.data?.id || !res.data?.inputHash) {
          throw new Error(formatOpsError(res, 'Order preview failed'))
        }
        commit = res.data
        setPreview(commit)
        setReviewed(true)
      }
      const created = await investmentOpsApi.createOrder({
        previewId: String(commit.id),
        inputHash: String(commit.inputHash),
      })
      if (created.success === false || !created.data?.id) {
        throw new Error(formatOpsError(created, 'Create order failed'))
      }
      const createdVersion = created.data.version ?? created.data.auditVersion
      if (submitAsDraft) {
        toast.success('Order saved as Draft — submit from Orderbook when ready.')
        onComplete?.()
        close()
        return
      }
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
      toast.success('Order submitted — status Draft → Submitted. Continue approval on Orderbook.')
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

  const complianceOutcomeRaw =
    preview?.complianceJson?.outcome ?? preview?.compliancePreview?.outcome ?? null
  const complianceSrdLabel =
    (preview?.complianceJson as { srdLabel?: string } | undefined)?.srdLabel ??
    (preview?.compliancePreview as { srdLabel?: string } | undefined)?.srdLabel ??
    null
  const complianceOutcome = complianceOutcomeRaw
    ? mapComplianceOutcomeLabel(String(complianceOutcomeRaw), complianceSrdLabel)
    : null
  const complianceMessage =
    preview?.complianceJson?.message ?? preview?.compliancePreview?.message ?? null

  return (
    <>
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
              checked={submitAsDraft}
              onChange={(event) => setSubmitAsDraft(event.target.checked)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            Save as Draft (skip auto-submit)
          </label>
          <label className="equity-order-footer-label flex items-center gap-2 text-[9px]">
            <input
              type="checkbox"
              checked={skipConfirmation}
              onChange={(event) => setSkipConfirmation(event.target.checked)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            Remember review for this session
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
            {previewing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reviewing…
              </>
            ) : reviewed ? (
              'Re-preview'
            ) : (
              'Review Order'
            )}
          </button>
          <button
            type="button"
            disabled={!canPlace || submitting || previewing}
            onClick={() => void placeOrder()}
            className={cn(
              'equity-order-button flex h-9 items-center gap-2 rounded-full px-5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40',
              side === 'BUY' ? 'equity-order-button-buy' : 'equity-order-button-sell',
            )}
            title={!reviewed && !skipConfirmation ? 'Review Order first' : undefined}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Placing…
              </>
            ) : (
              <>
                {submitAsDraft ? 'Save Draft' : `Place ${side === 'BUY' ? 'Buy' : 'Sell'} Order`} <ArrowRight className="h-3.5 w-3.5" />
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
                {chartPoints.map((point, index) => {
                  const x = (index / Math.max(chartPoints.length - 1, 1)) * 430
                  const range = Math.max(chartGeometry.max - chartGeometry.min, 1)
                  const y = 20 + ((chartGeometry.max - point) / range) * 92
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r={hoverIdx === index ? 5 : 3}
                      className="equity-order-chart-line fill-current"
                      onMouseEnter={() => setHoverIdx(index)}
                      onMouseLeave={() => setHoverIdx(null)}
                    />
                  )
                })}
                {hoverIdx != null && chartPoints[hoverIdx] != null && (
                  <text x={12} y={18} className="fill-current text-[10px] font-mono equity-order-value">
                    {chartPoints[hoverIdx]!.toFixed(4)}
                  </text>
                )}
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
                    setSettlementAccountId('')
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
                {fundId ? (
                  <p
                    className={cn(
                      'mt-1.5 text-[9px]',
                      cashShortfall ? 'text-amber-300' : 'text-slate-400',
                    )}
                    title="Order-eligible cash from the fund ledger (what pre-trade uses to check buys). Leave Settlement account empty unless you know the fund’s settlement cash account."
                  >
                    {fundCashLoading
                      ? 'Loading available cash…'
                      : fundCashAvailable != null
                        ? `Available cash: ${fundCashCurrency} ${fundCashAvailable.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : fundCashLabel ?? 'Available cash: —'}
                    {side === 'BUY' && !fundCashLoading && Number.isFinite(orderValue) && orderValue > 0 ? (
                      <span className="text-slate-500">
                        {' '}
                        · Est. order ~{currency}{' '}
                        {consideration.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : null}
                    {cashShortfall ? (
                      <span className="block text-amber-200">
                        Order looks larger than available cash — lower qty/price or ask BE to top up this fund.
                      </span>
                    ) : null}
                  </p>
                ) : null}
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
                <div className="equity-order-segment grid grid-cols-2 gap-1 rounded-[14px] p-1 sm:grid-cols-4">
                  {(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'] as const).map((value) => (
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
                      {value === 'STOP_LIMIT' ? 'Stop Limit' : value[0] + value.slice(1).toLowerCase()}
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
              {(orderType === 'STOP' || orderType === 'STOP_LIMIT') && (
                <div>
                  <Label help>Stop price ({currency})</Label>
                  <input
                    type="number"
                    min="0"
                    value={stopPrice}
                    onChange={(event) => {
                      setStopPrice(event.target.value)
                      setReviewed(false)
                      setPreview(null)
                    }}
                    className={fieldClass}
                  />
                  <p className="equity-order-muted mt-1 text-[8px]">Triggers when market reaches this price</p>
                </div>
              )}
              {orderType !== 'STOP' && (
                <div>
                  <Label help>
                    {orderType === 'STOP_LIMIT' ? `Limit price (${currency})` : `Price (${currency})`}
                  </Label>
                  <input
                    type="number"
                    min="0"
                    value={orderType === 'MARKET' ? lastPrice || '' : limitPrice}
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
                      : orderType === 'STOP_LIMIT'
                        ? 'Limit after stop triggers'
                        : 'Enter limit price'}
                  </p>
                </div>
              )}
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
              <div>
                <Label help>Broker</Label>
                <SelectField
                  value={brokerId}
                  onChange={(value) => {
                    setBrokerId(value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option value="">Select broker…</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div>
                <Label help>Custodian</Label>
                <SelectField
                  value={custodianId}
                  onChange={(value) => {
                    setCustodianId(value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option value="">Select custodian…</option>
                  {custodians.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div>
                <Label help>Settlement account</Label>
                <SelectField
                  value={settlementAccountId}
                  onChange={(value) => {
                    setSettlementAccountId(value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option value="">Optional — use fund default cash</option>
                  {settlementAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </SelectField>
                <p className="mt-1 text-[9px] text-slate-500">
                  Leave empty unless you know the fund settlement account. A recon client cash account can cause “insufficient cash”.
                </p>
              </div>
              <div>
                <Label help>Approval route</Label>
                <SelectField
                  value={approvalRouteId}
                  onChange={(value) => {
                    setApprovalRouteId(value)
                    setReviewed(false)
                    setPreview(null)
                  }}
                >
                  <option value="">Optional…</option>
                  {approvalRoutes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
            <div className="equity-order-fees mt-3 space-y-1.5 border-t pt-3 text-[8px]">
              <div className="flex justify-between">
                <span className="equity-order-label">Est. gross</span>
                <span className="font-mono">
                  <Money value={orderValue} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="equity-order-label">Est. fees</span>
                <span className="font-mono">
                  <Money value={fees} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="equity-order-label">Est. taxes</span>
                <span className="font-mono">
                  <Money value={taxes} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="equity-order-label">Settlement amount</span>
                <span className="font-mono">
                  <Money value={consideration} currency={currency} />
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
                  <span className="font-mono">
                    {preview
                      ? side === 'BUY'
                        ? `−${consideration.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : `+${consideration.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="equity-order-label">Exposure impact</span>
                  <span className="font-mono">{exposureImpact != null ? `${exposureImpact.toFixed(2)}%` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="equity-order-label">Compliance</span>
                  <span className="font-mono">{complianceOutcome ?? '—'}</span>
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
            {reviewed && preview && (
              <div className="equity-order-reviewed rounded-xl border px-4 py-3 text-[9px]">
                <p className="font-medium text-emerald-300">Preview ready</p>
                <p className="mt-1 opacity-80">Review the summary, then place your order when ready.</p>
                <button
                  type="button"
                  className="equity-order-button equity-order-button-secondary mt-2 h-8 rounded-full px-4 text-[9px]"
                  onClick={() => setPreviewModalOpen(true)}
                >
                  View preview summary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>

      <Modal
        open={previewModalOpen && !!preview}
        onClose={() => setPreviewModalOpen(false)}
        title="Order preview"
        subtitle={`${side} ${shares.toLocaleString()} ${instrument?.ticker ?? 'shares'}`}
        width="max-w-md"
        footer={
          <button
            type="button"
            className="equity-order-button equity-order-button-secondary h-9 rounded-full px-5 text-[10px]"
            onClick={() => setPreviewModalOpen(false)}
          >
            Close
          </button>
        }
      >
        <div className="space-y-3 text-[10px]">
          <div className="flex justify-between">
            <span className="equity-order-label">Portfolio</span>
            <span>{fund?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="equity-order-label">Order type</span>
            <span>{orderType}</span>
          </div>
          <div className="flex justify-between">
            <span className="equity-order-label">Quantity</span>
            <span className="font-mono">{shares.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="equity-order-label">Price</span>
            <span className="font-mono">{executionPrice.toFixed(4)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="equity-order-label">Est. fees / tax</span>
            <span className="font-mono">{fees.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 font-semibold">
            <span>{side === 'BUY' ? 'Total consideration' : 'Net proceeds'}</span>
            <span className="font-mono">{consideration.toFixed(2)} {currency}</span>
          </div>
          {complianceOutcome && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="equity-order-label">Compliance</p>
              <p className="mt-1">{complianceOutcome}{complianceMessage ? ` — ${complianceMessage}` : ''}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
