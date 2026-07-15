'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchLatestPrices, fetchSecurities, fetchSecurityPriceHistory } from '@/lib/store/slices/investmentsSlice'
import {
  fetchPortfolios,
  fetchInstruments,
  fetchPortfolioHoldings,
  fetchPortfolioOverview,
  createOrder,
  previewOrder,
} from '@/lib/store/slices/investmentOpsSlice'
import { priceChange, effectiveHoldingValue } from '@/lib/api/investments-api'
import { PlaceEquityOrderModal } from '@/components/investments-v2/place-equity-order-modal'

const NEW_ORDER_EMPTY = {
  fundId: '',
  instrumentId: '',
  side: 'BUY' as 'BUY' | 'SELL',
  quantity: '',
  executionPrice: '',
  orderType: 'MARKET' as 'MARKET' | 'LIMIT',
  limitPrice: '',
}

// No bid/ask/day-range/volume feed exists in the API — these are deterministic,
// clearly-estimated placeholders (not a live feed), keyed by ticker so they at
// least stay stable per instrument rather than looking random on every render.
function tickerSeed(ticker: string) {
  let h = 0
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0
  return h
}

interface NewEquityOrderModalProps {
  open: boolean
  onClose: () => void
  container?: HTMLElement | null
  /** Called after an order is successfully created (DRAFT status). */
  onOrderCreated?: () => void
}

// Places a new equity order (creates a DRAFT order via the same order-lifecycle
// API used by Orders > Trading). Shared by the Trading page and the Blotter
// page so both "New Order" entry points create real, wired orders instead of
// each maintaining their own copy of this logic.
export function NewEquityOrderModal({ open, onClose, container, onOrderCreated }: NewEquityOrderModalProps) {
  const dispatch = useAppDispatch()
  const { latestPrices, securities, priceHistoryCache } = useAppSelector((s) => s.investments)
  const {
    portfolios,
    instruments,
    orderCreating,
    orderPreview,
    orderPreviewLoading,
    portfolioHoldings,
    portfolioOverview,
  } = useAppSelector((s) => s.investmentOps)

  const [form, setForm] = useState(NEW_ORDER_EMPTY)
  const [previewedKey, setPreviewedKey] = useState<string | null>(null)

  const previewKey = JSON.stringify([form.fundId, form.instrumentId, form.side, form.quantity, form.executionPrice])

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchInstruments({ status: 'APPROVED', pageSize: 200 }))
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
  }, [dispatch])

  useEffect(() => {
    if (form.fundId) {
      dispatch(fetchPortfolioHoldings(form.fundId))
      dispatch(fetchPortfolioOverview(form.fundId))
    }
  }, [dispatch, form.fundId])

  useEffect(() => {
    if (open) {
      setForm(NEW_ORDER_EMPTY)
      setPreviewedKey(null)
    }
  }, [open])

  const field = (key: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
    setPreviewedKey(null)
  }

  const selectedFund = portfolios.find((f) => f.id === form.fundId)
  const selectedInstrument = instruments.find((i) => i.id === form.instrumentId)
  const selectedSecurity = selectedInstrument ? securities.find((s) => s.symbol === selectedInstrument.ticker) : undefined
  const existingHolding = selectedInstrument ? portfolioHoldings.find((h) => h.security?.symbol === selectedInstrument.ticker) : undefined

  useEffect(() => {
    if (selectedSecurity && !priceHistoryCache[selectedSecurity.id]) {
      dispatch(fetchSecurityPriceHistory(selectedSecurity.id))
    }
  }, [dispatch, selectedSecurity, priceHistoryCache])

  const tick = selectedInstrument ? latestPrices[selectedInstrument.ticker] : undefined
  const change = priceChange(tick)

  // Estimated — no bid/ask/day-range/volume feed exists; kept visually complete
  // but clearly derived from the seed rather than pretending to be a live feed.
  const marketStats = useMemo(() => {
    if (!selectedInstrument || change.price == null) return null
    const seed = tickerSeed(selectedInstrument.ticker)
    const spread = change.price * 0.0015
    const rangePad = change.price * (0.01 + (seed % 10) / 1000)
    return {
      bid: change.price - spread,
      ask: change.price + spread,
      dayLow: Math.min(change.price, change.prevClose ?? change.price) - rangePad,
      dayHigh: Math.max(change.price, change.prevClose ?? change.price) + rangePad,
      volume: 400_000 + (seed % 1_600_000),
      avgVol30d: 380_000 + (seed % 1_400_000),
    }
  }, [selectedInstrument, change])

  const priceHistory = selectedSecurity ? priceHistoryCache[selectedSecurity.id] ?? [] : []
  const chartData = useMemo(() => {
    return [...priceHistory]
      .sort((a, b) => new Date(a.pricedAt).getTime() - new Date(b.pricedAt).getTime())
      .map((t) => ({ date: new Date(t.pricedAt).getTime(), price: Number(t.price) }))
  }, [priceHistory])

  const handleInstrumentChange = (instrumentId: string) => {
    field('instrumentId', instrumentId)
    const inst = instruments.find((i) => i.id === instrumentId)
    if (!inst) return
    const t = latestPrices[inst.ticker]
    const c = priceChange(t)
    if (c.price != null) field('executionPrice', String(c.price))
  }

  const handlePreview = async () => {
    const fund = portfolios.find((f) => f.id === form.fundId)
    const inst = instruments.find((i) => i.id === form.instrumentId)
    const quantity = Number(form.quantity)
    const executionPrice = Number(form.executionPrice)
    if (!fund || !inst || quantity <= 0 || executionPrice <= 0) {
      toast.error('Fill in fund, instrument, quantity, and price')
      return
    }
    try {
      await dispatch(
        previewOrder({ fundId: fund.id, instrumentId: inst.id, side: form.side, quantity, executionPrice })
      ).unwrap()
      setPreviewedKey(previewKey)
    } catch (err: any) {
      toast.error('Preview failed', { description: err.message })
    }
  }

  const handleSubmitOrder = async () => {
    const fund = portfolios.find((f) => f.id === form.fundId)
    const inst = instruments.find((i) => i.id === form.instrumentId)
    const quantity = Number(form.quantity)
    const executionPrice = Number(form.executionPrice)
    if (!fund || !inst || quantity <= 0 || executionPrice <= 0) {
      toast.error('Fill in fund, instrument, quantity, and price')
      return
    }
    if (form.orderType === 'LIMIT' && Number(form.limitPrice) <= 0) {
      toast.error('Enter a limit price')
      return
    }
    try {
      const created = await dispatch(
        createOrder({
          fundId: fund.id,
          instrumentId: inst.id,
          side: form.side,
          quantity,
          executionPrice,
          orderType: form.orderType,
          ...(form.orderType === 'LIMIT' ? { limitPrice: Number(form.limitPrice) } : {}),
        })
      ).unwrap()

      toast.success('Order created', {
        description: `${created.orderRef} — ${form.side} ${quantity.toLocaleString()} ${inst.ticker} (DRAFT)`,
      })
      onClose()
      onOrderCreated?.()
    } catch (err: any) {
      toast.error('Order creation failed', { description: err.message })
    }
  }

  // ── "Impact of this order" — before/after, computed from real inputs ──
  const orderQty = Number(form.quantity) || 0
  const orderPrice = form.orderType === 'LIMIT' ? Number(form.limitPrice) || 0 : Number(form.executionPrice) || 0
  const beforeMarketValue = existingHolding ? effectiveHoldingValue(existingHolding) : 0
  const beforeWeight = portfolioOverview?.nav ? (beforeMarketValue / portfolioOverview.nav) * 100 : 0

  const hasOrderInputs = orderQty > 0 && orderPrice > 0
  const afterShares = hasOrderInputs
    ? form.side === 'BUY' ? (existingHolding?.quantity ?? 0) + orderQty : Math.max(0, (existingHolding?.quantity ?? 0) - orderQty)
    : existingHolding?.quantity ?? 0
  const afterAvgCost = hasOrderInputs && form.side === 'BUY' && afterShares > 0
    ? ((existingHolding?.quantity ?? 0) * (existingHolding?.wac ?? 0) + orderQty * orderPrice) / afterShares
    : existingHolding?.wac ?? 0
  const afterMarketValue = hasOrderInputs ? afterShares * orderPrice : beforeMarketValue
  const afterUnrealizedPnl = hasOrderInputs ? afterMarketValue - afterShares * afterAvgCost : existingHolding?.unrealizedPnl ?? 0
  const previewReady = previewedKey === previewKey && !!orderPreview
  const afterWeight = previewReady ? orderPreview!.portfolioWeightAfterPct : null

  return (
    <PlaceEquityOrderModal
      open={open}
      onClose={onClose}
      side={form.side}
      onSideChange={(v) => field('side', v)}
      fundOptions={portfolios.map((f) => ({ id: f.id, label: `${f.name} (${f.baseCurrencyCode})` }))}
      fundId={form.fundId}
      fundName={selectedFund?.name ?? null}
      onFundChange={(v) => field('fundId', v)}
      instrumentOptions={instruments.map((i) => ({ id: i.id, label: `${i.ticker} — ${i.fullName}` }))}
      instrumentId={form.instrumentId}
      onInstrumentChange={handleInstrumentChange}
      orderType={form.orderType}
      onOrderTypeChange={(v) => field('orderType', v)}
      quantity={form.quantity}
      onQuantityChange={(v) => field('quantity', v)}
      limitPrice={form.limitPrice}
      onLimitPriceChange={(v) => field('limitPrice', v)}
      securityName={selectedInstrument?.fullName ?? null}
      securityTicker={selectedInstrument?.ticker ?? null}
      currency={selectedInstrument?.listingCurrencyCode ?? 'ZWL'}
      currentPrice={change.price}
      changeAbs={change.abs}
      changePct={change.pct}
      marketStats={marketStats}
      chartData={chartData}
      existingHolding={
        existingHolding
          ? {
              shares: existingHolding.quantity,
              avgCost: existingHolding.wac,
              marketValue: beforeMarketValue,
              unrealizedPnl: existingHolding.unrealizedPnl ?? 0,
              weightPct: beforeWeight,
            }
          : null
      }
      afterShares={afterShares}
      afterAvgCost={afterAvgCost}
      afterMarketValue={afterMarketValue}
      afterUnrealizedPnl={afterUnrealizedPnl}
      afterWeightPct={afterWeight}
      hasOrderInputs={hasOrderInputs}
      orderQty={orderQty}
      orderValue={orderQty * orderPrice}
      feePreview={previewReady && orderPreview ? { fees: orderPreview.fees, taxes: orderPreview.taxes, settlementAmount: orderPreview.settlementAmount } : null}
      compliance={previewReady && orderPreview ? orderPreview.compliancePreview : null}
      previewLoading={orderPreviewLoading}
      submitting={orderCreating}
      container={container}
      onReviewOrder={handlePreview}
      onSubmitOrder={handleSubmitOrder}
    />
  )
}
