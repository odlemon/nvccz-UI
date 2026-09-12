import { formatMoneyDisplay, moneyAsString } from '@/lib/api/investment-ops-helpers'
import type { Holding, Security } from '@/lib/api/investments-api'
import { effectiveHoldingValue, holdingCostBasis } from '@/lib/api/investments-api'
import type { OpsFund, PortfolioOverview, PortfolioTransaction } from '@/lib/api/investment-ops-api'

export type FundTab = { id: string; name: string }

function looksLikeDbId(value: string): boolean {
  const s = value.trim()
  if (!s) return false
  return /^c[a-z0-9]{10,}$/i.test(s) || /^[0-9a-f-]{36}$/i.test(s) || /^cm[a-z0-9]{10,}$/i.test(s)
}

function displayPersonName(...candidates: unknown[]): string {
  for (const raw of candidates) {
    const s = String(raw ?? '').trim()
    if (s && !looksLikeDbId(s)) return s
  }
  return '—'
}

export function mapFundTabs(raw: unknown): FundTab[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' && raw && Array.isArray((raw as { items?: unknown }).items)
      ? ((raw as { items: unknown[] }).items)
      : []
  return list
    .map((item) => {
      const row = item as Partial<OpsFund> & { fundId?: string; id?: string; name?: string }
      const id = String(row.id ?? row.fundId ?? '')
      const name = String(row.name ?? '').trim()
      if (!id || !name) return null
      return { id, name }
    })
    .filter((x): x is FundTab => Boolean(x))
}

export function formatShortDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return raw
  }
}

export function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return raw
  }
}

export type HoldingOrderRow = {
  id: string
  transaction: string
  type: string
  reference: string
  quantity: string
  cost: string
  price: string
  value: string
  fx: string
  nav: string
}

export function mapHoldingToOrderRow(h: Holding): HoldingOrderRow {
  const sec = h.security
  const symbol = sec?.symbol ?? h.securityId ?? '—'
  const name = sec?.name ?? symbol
  const value = effectiveHoldingValue(h)
  const cost = holdingCostBasis(h)
  const price = h.currentPrice ?? h.wac
  return {
    id: h.id,
    transaction: name,
    type: 'A',
    reference: `${symbol} ${sec?.exchangeCode ? `${sec.exchangeCode} ` : ''}Equity`.trim(),
    quantity: Number(h.quantity).toLocaleString('en-US'),
    cost: `-${formatMoneyDisplay(cost)}`,
    price: Number(price).toFixed(4),
    value: formatMoneyDisplay(value),
    fx: '1.0000',
    nav: formatMoneyDisplay(value),
  }
}

export type OverviewMetrics = {
  total: string
  cash: string
  securityPct: string
  cashPct: string
  positions: number
  valueDate: string
  hasNav: boolean
  interest: string
  dividend: string
  margin: string
}

function overviewMoneyField(overview: PortfolioOverview | null, keys: string[]): string {
  if (!overview) return '—'
  for (const key of keys) {
    const raw = overview[key]
    if (raw != null && raw !== '' && Number.isFinite(Number(raw))) {
      return formatMoneyDisplay(raw)
    }
  }
  return '—'
}

export function mapExposureSlices(
  items: Array<{ key: string; pct: number }> | undefined,
  colors: string[],
): Array<{ label: string; value: number; color: string; visual?: number }> {
  if (!items?.length) return []
  return items.map((item, i) => {
    const pct = Number(item.pct) || 0
    return {
      label: item.key,
      value: Math.round(pct),
      visual: Math.max(pct, 1),
      color: colors[i % colors.length],
    }
  })
}

export function mapOverviewMetrics(
  overview: PortfolioOverview | null,
  holdings: Holding[],
): OverviewMetrics {
  const holdingsValue = holdings.reduce((sum, h) => sum + effectiveHoldingValue(h), 0)
  const navRaw = overview?.nav
  const hasNav = navRaw != null && Number.isFinite(Number(navRaw)) && Number(navRaw) > 0
  // Prefer API NAV; if absent, show holdings MV only when holdings exist (never invent a fake NAV).
  const totalValue = hasNav ? Number(navRaw) : holdings.length > 0 ? holdingsValue : NaN
  const hasTotal = Number.isFinite(totalValue)

  const cashRaw = overview?.cashBalance
  const hasCash = cashRaw != null && cashRaw !== '' && Number.isFinite(Number(cashRaw))
  const cashPctRaw = overview?.cashPct
  const hasCashPct = cashPctRaw != null && cashPctRaw !== '' && Number.isFinite(Number(cashPctRaw))
  const secRaw = overview?.securitiesValue
  const hasSec = secRaw != null && secRaw !== '' && Number.isFinite(Number(secRaw))

  let securityPct = '—'
  if (hasSec && hasNav && Number(navRaw) > 0) {
    securityPct = `${((Number(secRaw) / Number(navRaw)) * 100).toFixed(2)}%`
  } else if (hasCashPct && hasNav) {
    securityPct = `${(100 - Number(cashPctRaw)).toFixed(2)}%`
  } else if (hasNav && Number(navRaw) > 0) {
    securityPct = `${((holdingsValue / Number(navRaw)) * 100).toFixed(2)}%`
  } else if (hasTotal && totalValue > 0 && holdings.length > 0) {
    securityPct = '100.00%'
  }

  return {
    total: hasTotal ? formatMoneyDisplay(totalValue) : '—',
    cash: hasCash ? formatMoneyDisplay(cashRaw) : '—',
    securityPct,
    cashPct: hasCashPct
      ? `${Number(cashPctRaw).toFixed(2)}%`
      : hasCash && hasNav && Number(navRaw) > 0
        ? `${((Number(cashRaw) / Number(navRaw)) * 100).toFixed(2)}%`
        : '—',
    positions: holdings.length,
    valueDate: formatShortDate(overview?.valuationDate),
    hasNav: hasNav,
    interest: overviewMoneyField(overview, ['interestIncome', 'interest', 'accruedInterest']),
    dividend: overviewMoneyField(overview, ['dividendIncome', 'dividend', 'dividends']),
    margin: overviewMoneyField(overview, ['marginUsed', 'marginBalance', 'margin', 'marginExposure']),
  }
}

export type PositionRow = {
  id: string
  instrumentId?: string
  portfolioId: string
  portfolio: string
  ticker: string
  name: string
  type: 'Holding' | 'Cash'
  sector: string
  currency: string
  quantity: number
  cost: number
  price: number
  value: number
  pnl: number
  weight: number
  date: string
}

export function enrichPositionsWithInstruments(
  rows: PositionRow[],
  instruments: Array<{ id: string; name: string; symbol: string }>,
): PositionRow[] {
  if (!instruments.length) return rows
  const byId = new Map(instruments.map((i) => [i.id, i]))
  const bySymbol = new Map(instruments.map((i) => [i.symbol.toUpperCase(), i]))
  return rows.map((row) => {
    const match =
      (row.instrumentId ? byId.get(row.instrumentId) : undefined) ??
      byId.get(row.ticker) ??
      bySymbol.get(row.ticker.toUpperCase())
    if (!match) return row
    const displayName = match.name || match.symbol
    const looksLikeId =
      !row.name ||
      row.name === '—' ||
      row.name === row.ticker ||
      row.name === row.instrumentId ||
      row.name === row.id
    if (looksLikeId) {
      return {
        ...row,
        name: displayName,
        ticker: match.symbol || row.ticker,
        instrumentId: row.instrumentId ?? match.id,
      }
    }
    return row
  })
}

export function mapHoldingsToPositions(
  holdings: Holding[],
  fund: FundTab,
  totalNav?: number | null,
): PositionRow[] {
  const values = holdings.map((h) => effectiveHoldingValue(h))
  const sum = values.reduce((a, b) => a + b, 0)
  const denom = totalNav != null && totalNav > 0 ? totalNav : sum

  return holdings.map((h, idx) => {
    const sec = (h.instrument ?? h.security) as Security | undefined
    const value = values[idx] ?? 0
    const cost = h.wac
    const price = h.currentPrice ?? h.wac
    const pnl = h.unrealizedPnl ?? (price - cost) * h.quantity
    return {
      id: h.id,
      instrumentId: h.securityId || sec?.id,
      portfolioId: fund.id,
      portfolio: fund.name,
      ticker: sec?.symbol ?? h.securityId ?? '—',
      name: sec?.name ?? sec?.symbol ?? h.securityId ?? '—',
      type: 'Holding' as const,
      sector: '—',
      currency: h.wacCurrencyCode || sec?.listingCurrencyCode || 'USD',
      quantity: Number(h.quantity) || 0,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      value,
      pnl: Number(pnl) || 0,
      weight: denom > 0 ? (value / denom) * 100 : 0,
      date: formatShortDate(h.lastValuationAt ?? h.updatedAt ?? h.createdAt),
    }
  })
}

export function mapInstrumentsLookup(raw: unknown[]): Array<{ id: string; name: string; symbol: string }> {
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    return {
      id: String(row.id ?? ''),
      name: String(row.fullName ?? row.shortName ?? row.ticker ?? '—'),
      symbol: String(row.ticker ?? row.instrumentCode ?? '—'),
    }
  })
}

/**
 * Maps `GET /portfolios/:fundId/positions` payload:
 * `{ valuationRunId, asOf, navBaseCurrency, items: [...] }` or bare item arrays.
 */
export function mapValuedPositionsPayload(
  raw: unknown,
  fund: FundTab,
): PositionRow[] {
  if (raw == null) return []

  let items: unknown[] = []
  let navHint: number | null = null
  let asOf: string | undefined

  if (Array.isArray(raw)) {
    items = raw
  } else if (typeof raw === 'object') {
    const envelope = raw as {
      items?: unknown[]
      navBaseCurrency?: string | number
      asOf?: string
    }
    items = Array.isArray(envelope.items) ? envelope.items : []
    const navNum = Number(envelope.navBaseCurrency)
    navHint = Number.isFinite(navNum) && navNum > 0 ? navNum : null
    asOf = envelope.asOf
  }

  const parsed = items.map((item, index) => {
    const row = item as Record<string, unknown>
    const instrument = (row.instrument ?? row.security ?? {}) as Record<string, unknown>
    const qty = Number(row.quantity)
    const price = Number(row.price ?? row.currentPrice)
    const marketValue = Number(row.baseMarketValue ?? row.marketValue)
    const value = Number.isFinite(marketValue)
      ? marketValue
      : Number.isFinite(qty) && Number.isFinite(price)
        ? qty * price
        : 0
    const cost = Number(row.averageCost ?? row.wac ?? row.cost ?? 0)
    const pnl = Number(row.unrealizedPnl ?? row.unrealizedPnlBase ?? value - cost * (Number.isFinite(qty) ? qty : 0))
    const instrumentId = String(row.instrumentId ?? row.securityId ?? '')
    const ticker = String(
      instrument.symbol ?? instrument.ticker ?? row.symbol ?? (instrumentId || '—'),
    )
    const name = String(
      instrument.name ??
        instrument.shortName ??
        instrument.fullName ??
        (instrumentId ? instrumentId : ticker),
    )
    return {
      id: String(row.id ?? `pos-${index}`),
      instrumentId: instrumentId || undefined,
      portfolioId: fund.id,
      portfolio: fund.name,
      ticker,
      name,
      type: 'Holding' as const,
      sector: String(instrument.sector ?? row.sector ?? '—'),
      currency: String(
        instrument.listingCurrencyCode ?? row.currencyCode ?? row.currency ?? 'USD',
      ),
      quantity: Number.isFinite(qty) ? qty : 0,
      cost: Number.isFinite(cost) ? cost : 0,
      price: Number.isFinite(price) ? price : 0,
      value,
      pnl: Number.isFinite(pnl) ? pnl : 0,
      weight: 0,
      date: formatShortDate(String(row.asOf ?? asOf ?? row.valuedAt ?? row.updatedAt ?? '')),
    }
  })

  const sum = parsed.reduce((a, r) => a + r.value, 0)
  const denom = navHint != null && navHint > 0 ? navHint : sum
  return parsed.map((row) => ({
    ...row,
    weight: denom > 0 ? (row.value / denom) * 100 : 0,
  }))
}

export type TxnRow = {
  id: string
  portfolioId: string
  portfolio: string
  ref: string
  date: string
  type: string
  instrument: string
  description: string
  quantity: number | null
  price: number | null
  amount: number
  currency: string
  status: string
  tradeRef: string
  valuationRef: string
  journalRef: string
  documentRef: string
  tradeId: string | null
  orderId: string | null
  journalEntryId: string | null
  documentId: string | null
  valuationRunId: string | null
}

function titleCaseType(raw: string): string {
  const normalized = raw.replace(/_/g, ' ').toLowerCase()
  if (normalized === 'purchase') return 'Purchase'
  if (normalized === 'sale') return 'Sale'
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase())
}

function titleCaseStatus(raw: string): string {
  const u = raw.toUpperCase()
  if (u === 'POSTED') return 'Posted'
  if (u === 'PENDING') return 'Pending'
  if (u === 'REVERSED') return 'Reversed'
  return titleCaseType(raw)
}

export function mapPortfolioTransactions(
  raw: unknown[],
  fund: FundTab,
): TxnRow[] {
  return raw.map((item, index) => {
    const row = item as Partial<PortfolioTransaction> & Record<string, unknown>
    const qty = row.quantity != null ? Number(row.quantity) : null
    const price = row.price != null ? Number(row.price) : null
    const net =
      row.realizedPnl != null
        ? Number(row.realizedPnl)
        : row.netAmount != null
          ? Number(row.netAmount)
          : qty != null && price != null
            ? qty * price * (String(row.type ?? '').toUpperCase().includes('SALE') ? 1 : -1)
            : 0
    const typeRaw = String(row.type ?? row.transactionType ?? 'Transaction')
    return {
      id: String(row.id ?? `txn-${index}`),
      portfolioId: fund.id,
      portfolio: fund.name,
      ref: String(row.tradeRef ?? row.transactionRef ?? row.id ?? `TXN-${index}`),
      date: formatDateTime(String(row.tradeDate ?? '')),
      type: titleCaseType(typeRaw),
      instrument: String(row.symbol ?? row.instrument ?? '—'),
      description: String(row.symbol ?? row.transactionType ?? typeRaw),
      quantity: qty != null && Number.isFinite(qty) ? qty : null,
      price: price != null && Number.isFinite(price) ? price : null,
      amount: Number.isFinite(net) ? net : 0,
      currency: String(row.currencyCode ?? 'USD'),
      status: titleCaseStatus(String(row.status ?? 'Posted')),
      tradeRef: String(row.tradeId ?? row.tradeRef ?? row.transactionRef ?? '—'),
      valuationRef: row.valuationRunId ? String(row.valuationRunId) : '—',
      journalRef: String(row.journalEntryId ?? '—'),
      documentRef: row.documentId ? String(row.documentId) : '—',
      tradeId: row.tradeId != null ? String(row.tradeId) : null,
      orderId: row.orderId != null ? String(row.orderId) : null,
      journalEntryId: row.journalEntryId != null ? String(row.journalEntryId) : null,
      documentId: row.documentId != null ? String(row.documentId) : null,
      valuationRunId: row.valuationRunId != null ? String(row.valuationRunId) : null,
    }
  })
}

export type InstrumentRow = {
  id: string
  symbol: string
  name: string
  isin: string
  sedol: string
  type: string
  category: string
  sector: string
  market: string
  currency: string
  price: number | null
  /** Display label (Title Case for known statuses). */
  status: string
  /** API status token: DRAFT | PENDING_APPROVAL | ACTIVE | … */
  rawStatus: string
  auditVersion: number
  restriction: string
  issuer: string
  country: string
  source: string
  createdBy: string
  updated: string
  coupon?: number
  maturity?: string
  faceValue?: number
}

function formatInstrumentStatus(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'INACTIVE':
      return 'Inactive'
    case 'DRAFT':
      return 'Draft'
    case 'PENDING_APPROVAL':
      return 'Pending approval'
    case 'ARCHIVED':
      return 'Archived'
    case 'SUSPENDED':
      return 'Suspended'
    default:
      return status.replace(/_/g, ' ')
  }
}

function formatInstrumentIdentifiers(raw: Record<string, unknown>): { primary: string; secondary: string } {
  const isin = String(raw.isin ?? '').trim()
  const bloomberg = String(raw.bloombergCode ?? '').trim()
  const reuters = String(raw.reutersCode ?? '').trim()
  const internal = String(raw.internalRef ?? '').trim()
  const instrumentCode = String(raw.instrumentCode ?? '').trim()
  const ticker = String(raw.ticker ?? '').trim()
  const primary =
    isin && isin !== '—'
      ? isin
      : bloomberg || reuters || internal || instrumentCode || (ticker ? `Ticker ${ticker}` : '—')
  const secondary =
    bloomberg && primary !== bloomberg
      ? `BBG ${bloomberg}`
      : reuters && primary !== reuters
        ? `RIC ${reuters}`
        : internal && primary !== internal
          ? internal
          : instrumentCode && primary !== instrumentCode
            ? instrumentCode
            : ''
  return { primary, secondary }
}

export function mapInstrumentRow(raw: Record<string, unknown>): InstrumentRow {
  const typeCode = String(raw.instrumentTypeCode ?? raw.type ?? '—')
  const status = String(raw.status ?? '—')
  const restriction = String(raw.complianceRestriction ?? 'None')
  const auditVersionRaw = raw.auditVersion ?? raw.version ?? raw.expectedVersion
  const ids = formatInstrumentIdentifiers(raw)
  const createdBy = displayPersonName(raw.createdByName, raw.createdBy, raw.createdById)
  return {
    id: String(raw.id ?? ''),
    symbol: String(raw.ticker ?? raw.instrumentCode ?? '—'),
    name: String(raw.fullName ?? raw.shortName ?? raw.ticker ?? '—'),
    isin: ids.primary,
    sedol: ids.secondary || '—',
    type: typeCode.replace(/_/g, ' '),
    category: String(raw.subCategory ?? typeCode),
    sector: String(raw.sector ?? '—'),
    market: String(raw.exchangeCode ?? raw.marketCode ?? '—'),
    currency: String(raw.listingCurrencyCode ?? 'USD'),
    price:
      raw.latestPrice != null && raw.latestPrice !== '' && Number.isFinite(Number(raw.latestPrice))
        ? Number(raw.latestPrice)
        : null,
    status: formatInstrumentStatus(status),
    rawStatus: status,
    auditVersion: Number.isFinite(Number(auditVersionRaw)) ? Number(auditVersionRaw) : 1,
    restriction:
      restriction === 'null' || !restriction || restriction === 'NONE' ? 'None' : restriction,
    issuer: String(raw.issuerName ?? '—'),
    country: String(raw.countryCode ?? '—'),
    source: String(raw.pricingSource ?? '—'),
    createdBy,
    updated: formatDateTime(String(raw.pricedAt ?? raw.updatedAt ?? raw.createdAt ?? '')),
    coupon: raw.couponRate != null ? Number(raw.couponRate) : undefined,
    maturity: raw.maturityDate ? formatShortDate(String(raw.maturityDate)) : undefined,
  }
}

export type PriceRow = {
  id: string
  ticker: string
  name: string
  market: string
  currency: string
  price: number
  previous: number | null
  source: string
  status: string
  time: string
  priceDate: string
  /** Present when API returned a real tick id (required for approve/reject). */
  canReview: boolean
  auditVersion: number
  issue?: string
  flag?: string
}

function mapValidationStatus(raw: string): string {
  const u = raw.toUpperCase()
  if (u === 'APPROVED') return 'Approved'
  if (u === 'PENDING' || u === 'PENDING_REVIEW') return 'Pending'
  if (u === 'VALIDATED') return 'Validated'
  if (u === 'REJECTED') return 'Rejected'
  if (u === 'STALE') return 'Stale'
  if (u === 'ESTIMATED') return 'Estimated'
  return titleCaseType(raw)
}

function mapSource(raw: string): string {
  const u = raw.toUpperCase().replace(/-/g, '_')
  if (u.includes('MANUAL')) return 'Manual Override'
  if (u.includes('VENDOR')) return 'Vendor Feed'
  if (u.includes('FILE') || u.includes('UPLOAD')) return 'File Upload'
  if (u.includes('SEED')) return 'Seed data'
  if (u === 'ZSE' || u.includes('MANSA') || u.includes('API') || u === 'OK') return 'API Confirmed'
  return titleCaseType(raw || 'API Confirmed')
}

function classifyPriceDate(pricedAt: string): string {
  if (!pricedAt) return 'Older'
  try {
    const d = new Date(pricedAt)
    if (Number.isNaN(d.getTime())) return 'Older'
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startTick = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.round((startToday.getTime() - startTick.getTime()) / 86400000)
    if (diffDays <= 0) return 'Today'
    if (diffDays === 1) return 'Previous business day'
    return 'Older'
  } catch {
    return 'Older'
  }
}

/** Accepts either latest-tick list or `{ security, latestTick }` entries. */
export function mapLatestPriceRow(raw: Record<string, unknown>, index: number): PriceRow | null {
  const nestedTick = raw.latestTick as Record<string, unknown> | undefined
  const security = (raw.security ?? nestedTick?.security ?? {}) as Record<string, unknown>
  const tick = nestedTick ?? raw

  const price = Number(tick.price)
  if (!Number.isFinite(price)) return null

  const apiId = String(tick.id ?? raw.id ?? '').trim()
  const validationStatus = String(tick.validationStatus ?? tick.validation_status ?? '').toUpperCase()
  const reviewableFlag = tick.reviewable ?? tick.isReviewable
  const canReview =
    Boolean(apiId) &&
    (reviewableFlag === true ||
      (reviewableFlag !== false &&
        ['PENDING', 'PENDING_REVIEW', 'VALIDATED'].includes(validationStatus)))
  const versionRaw = tick.version ?? tick.auditVersion ?? raw.version ?? raw.auditVersion
  const prevRaw = tick.previousClose ?? tick.previous_close
  const previous = prevRaw != null && prevRaw !== '' ? Number(prevRaw) : null
  const status = mapValidationStatus(String(tick.validationStatus ?? tick.validation_status ?? 'Approved'))
  const pricedAt = String(tick.pricedAt ?? tick.priced_at ?? '')
  const ticker = String(security.symbol ?? security.ticker ?? tick.symbol ?? raw.symbol ?? '—')
  const name = String(security.name ?? security.shortName ?? ticker)
  const deviation = tick.deviationPct != null ? Number(tick.deviationPct) : null
  const sourceRaw = String(
    tick.sourceCode ?? tick.fxRateSource ?? tick.sourceStatus ?? raw.sourceCode ?? 'API',
  )

  return {
    id: canReview ? apiId : `price-${index}`,
    ticker,
    name,
    market: String(security.exchangeCode ?? security.market ?? raw.exchangeCode ?? '—'),
    currency: String(security.listingCurrencyCode ?? raw.listingCurrencyCode ?? 'USD'),
    price,
    previous: previous != null && Number.isFinite(previous) ? previous : null,
    source: mapSource(sourceRaw),
    status,
    time: formatDateTime(pricedAt),
    priceDate: classifyPriceDate(pricedAt),
    canReview,
    auditVersion: Number.isFinite(Number(versionRaw)) ? Number(versionRaw) : 1,
    issue: status === 'Stale' ? 'Stale price' : status === 'Pending' ? 'Pending approval' : undefined,
    flag:
      deviation != null && Number.isFinite(deviation) && Math.abs(deviation) >= 5
        ? `${deviation.toFixed(2)}% movement exceeds tolerance.`
        : status === 'Stale'
          ? 'Price age exceeds market stale threshold.'
          : undefined,
  }
}

export { formatMoneyDisplay, moneyAsString }
