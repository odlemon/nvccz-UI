import type { Holding } from '@/lib/api/investments-api'
import type {
  ComplianceResultItem,
  ComplianceRule,
  ModelPortfolio,
  ModelPortfolioDrift,
  OpsFund,
  OpsTrade,
  Order,
  PortfolioOverview,
  SimulationRun,
} from '@/lib/api/investment-ops-api'
import { formatMoneyDisplay, unwrapList, unwrapPaged } from '@/lib/api/investment-ops-helpers'

const DASH = '—'

function n(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(num) ? num : null
}

function fmtNum(value: unknown, digits = 2): string {
  const num = n(value)
  if (num == null) return DASH
  return num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function fmtInt(value: unknown): string {
  const num = n(value)
  if (num == null) return DASH
  return num.toLocaleString('en-US')
}

function fmtDate(value: unknown): string {
  if (value == null || value === '') return DASH
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function titleCaseStatus(raw: string): string {
  const s = raw.trim()
  if (!s) return DASH
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Map API order status → orderbook tab labels. */
export function mapOrderUiStatus(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'DRAFT') return 'New'
  if (u === 'SUBMITTED' || u === 'APPROVED' || u === 'SENT_TO_BROKER') return 'Pending'
  if (u === 'EXECUTED') return 'Executed'
  if (u === 'REJECTED') return 'Rejected'
  if (u === 'CANCELLED') return 'Cancelled'
  if (u.includes('FAIL')) return 'Failed'
  if (u.includes('SETTLE')) return 'Settled'
  return titleCaseStatus(String(status ?? DASH))
}

function mapTradeUiStatus(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'EXECUTED' || u === 'SETTLED') return 'Executed'
  if (u === 'ROUTING' || u === 'DRAFT') return 'Pending'
  if (u.includes('PARTIAL')) return 'Partial'
  return titleCaseStatus(String(status ?? DASH))
}

function mapSettlement(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'SETTLED') return 'Settled'
  if (u.includes('FAIL') || u.includes('UNMATCH')) return 'Unmatched'
  if (u === 'PENDING' || !u) return 'Pending'
  return titleCaseStatus(String(status ?? DASH))
}

function mapAccounting(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'POSTED') return 'Posted'
  if (u === 'NOT_POSTED' || !u) return 'Unposted'
  return titleCaseStatus(String(status ?? DASH))
}

function mapConfirmation(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'CONFIRMED') return 'Confirmed'
  if (u === 'DISPATCHED') return 'Awaiting'
  return titleCaseStatus(String(status ?? 'Awaiting'))
}

export type BlotterTradeRow = {
  id: string
  apiId: string
  order: string
  portfolio: string
  ticker: string
  name: string
  side: string
  qty: number
  price: number
  gross: number
  fees: number
  /** Taxes are not on OpsTrade today — null renders as —. */
  taxes: number | null
  net: number
  broker: string
  custodian: string
  tradeDate: string
  valueDate: string
  status: string
  settlement: string
  accounting: string
  confirmation: string
}

export function mapBlotterTrades(data: unknown, fundNameById?: Record<string, string>): BlotterTradeRow[] {
  return unwrapList<OpsTrade>(data).map((t) => {
    const qty = n(t.quantity) ?? 0
    const price = n(t.executionPrice) ?? 0
    const fees = n(t.fees) ?? 0
    const taxes = n(t.taxes)
    const gross = n(t.grossConsideration) ?? qty * price
    const net = n(t.netConsideration) ?? gross - fees - (taxes ?? 0)
    const ext = t as OpsTrade & { fundName?: string | null }
    return {
      id: String(t.tradeRef ?? t.id ?? DASH),
      apiId: String(t.id ?? ''),
      order: String(t.orderRef ?? t.orderId ?? DASH),
      portfolio: String(t.fund?.name ?? ext.fundName ?? fundNameById?.[t.fundId] ?? DASH),
      ticker: String(t.security?.symbol ?? DASH),
      name: String(t.security?.name ?? DASH),
      side: String(t.side ?? DASH),
      qty,
      price,
      gross,
      fees,
      taxes,
      net,
      broker: String(t.brokerName ?? t.brokerProfileId ?? DASH),
      custodian: String(t.custodianName ?? t.custodianProfileId ?? DASH),
      tradeDate: fmtDate(t.executedAt ?? t.createdAt),
      valueDate: fmtDate(t.valueDate ?? t.settledAt),
      status: mapTradeUiStatus(t.status),
      settlement: mapSettlement(t.settlementStatus),
      accounting: mapAccounting(t.accountingStatus),
      confirmation: mapConfirmation(t.confirmationStatus),
    }
  })
}

export type OrderbookRow = {
  ref: string
  apiId: string
  masterRef: string
  blotter: string
  portfolio: string
  ticker: string
  instrument: string
  side: string
  type: string
  qty: number
  filled: number
  execPrice: number | null
  limitPrice: number | null
  gross: string
  grossValue: number
  broker: string
  trader: string
  tradeDate: string
  valueDate: string
  approval: string
  routing: string
  created: string
  status: string
  rawStatus: string
}

function mapApprovalLabel(order: Order): string {
  const latest = order.approvals?.[0]
  if (latest?.status) return titleCaseStatus(latest.status)
  if (order.approvedAt) return 'Approved'
  const u = String(order.status ?? '').toUpperCase()
  if (u === 'DRAFT') return 'Not submitted'
  if (u === 'REJECTED') return 'Rejected'
  if (u === 'SUBMITTED') return 'Pending approval'
  return titleCaseStatus(String(order.status ?? DASH))
}

function mapRoutingLabel(status: string): string {
  const u = status.toUpperCase()
  if (u === 'SENT_TO_BROKER') return 'At broker'
  if (u === 'EXECUTED') return 'Filled'
  if (u === 'CANCELLED') return 'Cancelled'
  if (u === 'REJECTED') return 'Not routed'
  if (u === 'DRAFT' || u === 'SUBMITTED') return 'Not routed'
  if (u === 'APPROVED') return 'Ready to route'
  return titleCaseStatus(status)
}

export function mapOrderbookOrders(data: unknown, fundNameById?: Record<string, string>): OrderbookRow[] {
  const items = unwrapPaged<Order>(data).items.length
    ? unwrapPaged<Order>(data).items
    : unwrapList<Order>(data)

  return items.map((o) => {
    const qty = n(o.quantity) ?? 0
    const execPrice = n(o.executionPrice)
    const limitPrice = n(o.limitPrice)
    const px = execPrice ?? limitPrice ?? 0
    const grossValue = qty * px
    const uiStatus = mapOrderUiStatus(o.status)
    const filledQty = n(o.filledQuantity)
    const filled =
      filledQty != null
        ? filledQty
        : String(o.status).toUpperCase() === 'EXECUTED'
          ? qty
          : 0
    const fundName =
      o.fundName ??
      (o.fund && typeof o.fund === 'object' ? o.fund.name : undefined) ??
      fundNameById?.[o.fundId] ??
      o.fundId
    return {
      ref: String(o.orderRef ?? o.id ?? DASH),
      apiId: String(o.id ?? ''),
      masterRef: String(o.instrument?.instrumentCode ?? o.instrumentId ?? DASH),
      blotter: String(o.notes ?? DASH),
      portfolio: String(fundName ?? DASH),
      ticker: String(o.instrument?.ticker ?? DASH),
      instrument: String(o.instrument?.fullName ?? o.instrument?.shortName ?? DASH),
      side: String(o.side ?? DASH),
      type: String(o.orderType ?? DASH),
      qty,
      filled,
      execPrice,
      limitPrice,
      gross: formatMoneyDisplay(grossValue, 0),
      grossValue,
      broker: String(o.brokerName ?? o.brokerProfileId ?? DASH),
      trader: String(o.createdById ?? DASH),
      tradeDate: fmtDate(o.tradeDate ?? o.submittedAt ?? o.createdAt),
      valueDate: fmtDate(o.valueDate),
      approval: mapApprovalLabel(o),
      routing: mapRoutingLabel(String(o.status ?? '')),
      created: fmtDate(o.createdAt),
      status: uiStatus,
      rawStatus: String(o.status ?? ''),
    }
  })
}

export type TradingPositionRow = {
  portfolio: string
  fundId: string
  reference: string
  shortName: string
  quantity: string
  open: string
  price: string
  tr: string
  currency: string
  industry: string
  type: string
}

export function mapTradingPositions(
  holdings: unknown,
  portfolioName: string,
  fundId: string,
): TradingPositionRow[] {
  return unwrapList<Holding>(holdings).map((h) => ({
    portfolio: portfolioName || DASH,
    fundId,
    reference: String(h.security?.symbol ?? h.securityId ?? DASH),
    shortName: String(h.security?.name ?? h.security?.symbol ?? DASH),
    quantity: fmtInt(h.quantity),
    open: DASH,
    price: h.currentPrice != null ? fmtNum(h.currentPrice) : DASH,
    tr: h.unrealizedPnl != null ? fmtNum(h.unrealizedPnl) : DASH,
    currency: String(h.wacCurrencyCode ?? h.security?.listingCurrencyCode ?? DASH),
    industry: DASH,
    type: h.security ? 'Equity' : DASH,
  }))
}

export function mapPortfolioNavSummary(overview: PortfolioOverview | null | undefined) {
  if (!overview) {
    return { nav: DASH, securities: DASH, cash: DASH, asOf: DASH }
  }
  return {
    nav: formatMoneyDisplay(overview.nav),
    securities:
      overview.securitiesValue != null && overview.securitiesValue !== ''
        ? formatMoneyDisplay(overview.securitiesValue)
        : DASH,
    cash:
      overview.cashBalance != null && overview.cashBalance !== ''
        ? formatMoneyDisplay(overview.cashBalance)
        : DASH,
    asOf: fmtDate(overview.valuationDate),
  }
}

export type ComplianceRuleRow = {
  id: string
  category: string
  rule: string
  scope: string
  threshold: string
  status: string
  fundId: string | null
  ruleCode: string
  ruleType: string
  isActive: boolean
}

export function mapComplianceRules(data: unknown, fundNameById?: Record<string, string>): ComplianceRuleRow[] {
  return unwrapList<ComplianceRule>(data).map((r) => {
    const unit = r.thresholdUnit ? ` ${r.thresholdUnit}` : ''
    const scope =
      (r.fundId && fundNameById?.[r.fundId]) ||
      (r.fundId ? r.fundId : null) ||
      r.instrumentTypeCode ||
      r.sectorCode ||
      r.countryCode ||
      'All portfolios'
    return {
      id: String(r.id),
      category: String(r.ruleType ?? DASH),
      rule: String(r.ruleName ?? r.ruleCode ?? DASH),
      scope: String(scope),
      threshold: `${formatMoneyDisplay(r.thresholdValue, 2).replace(/\.00$/, '')}${unit}`,
      status: r.isActive ? 'Active' : 'Inactive',
      fundId: r.fundId,
      ruleCode: String(r.ruleCode ?? DASH),
      ruleType: String(r.ruleType ?? DASH),
      isActive: Boolean(r.isActive),
    }
  })
}

export type ComplianceResultRow = {
  id: string
  orderRef: string
  fundId: string
  ticker: string
  side: string
  ruleName: string
  ruleType: string
  limitDisplay: string
  currentDisplay: string
  afterTradeDisplay: string
  outcome: string
  createdAt: string
}

export function mapComplianceResults(data: unknown): ComplianceResultRow[] {
  return unwrapList<ComplianceResultItem>(data).map((r) => ({
    id: String(r.id ?? ''),
    orderRef: String(r.orderRef ?? r.orderId ?? DASH),
    fundId: String(r.fundId ?? DASH),
    ticker: String(r.instrumentTicker ?? DASH),
    side: String(r.side ?? DASH),
    ruleName: String(r.ruleName ?? r.ruleId ?? DASH),
    ruleType: String(r.ruleType ?? DASH),
    limitDisplay: r.limitDisplay != null && r.limitDisplay !== '' ? String(r.limitDisplay) : DASH,
    currentDisplay: r.currentDisplay != null && r.currentDisplay !== '' ? String(r.currentDisplay) : DASH,
    afterTradeDisplay:
      r.afterTradeDisplay != null && r.afterTradeDisplay !== '' ? String(r.afterTradeDisplay) : DASH,
    outcome: String(r.outcome ?? DASH),
    createdAt: fmtDate(r.createdAt),
  }))
}

export type ModelAllocationRow = {
  dimension: string
  asset: string
  target: number
  live: number | null
  drift: number | null
  recommendation: string
}

export type ModelRow = {
  id: string
  name: string
  strategy: string
  risk: string
  mandate: string
  portfolio: string
  fundId: string | null
  allocations: ModelAllocationRow[]
  updated: string
  isActive: boolean
  currency: string
}

function dimensionLabel(allocationType: string): string {
  const u = allocationType.toUpperCase()
  if (u.includes('ASSET')) return 'Asset class'
  if (u.includes('SEC') || u.includes('INSTR')) return 'Security'
  if (u.includes('SECT')) return 'Sector'
  if (u.includes('CURR')) return 'Currency'
  return titleCaseStatus(allocationType)
}

export function mapModelPortfolios(data: unknown): ModelRow[] {
  return unwrapList<ModelPortfolio>(data).map((m) => ({
    id: String(m.id),
    name: String(m.name ?? DASH),
    strategy: String(m.strategyCode ?? DASH),
    risk: DASH,
    mandate: DASH,
    portfolio: DASH,
    fundId: m.linkedFundId ?? null,
    allocations: (m.allocations ?? []).map((a) => ({
      dimension: dimensionLabel(String(a.allocationType ?? '')),
      asset: String(a.allocationKey ?? DASH),
      target: n(a.targetWeightPct) ?? 0,
      live: null,
      drift: null,
      recommendation: DASH,
    })),
    updated: fmtDate(m.updatedAt ?? m.createdAt),
    isActive: Boolean(m.isActive),
    currency: String(m.baseCurrencyCode ?? DASH),
  }))
}

export function applyModelDrift(model: ModelRow, drift: ModelPortfolioDrift | null | undefined): ModelRow {
  if (!drift) return model
  const byKey = new Map(
    (drift.drift ?? []).map((d) => [`${d.allocationType}|${d.key}`, d]),
  )
  const recByKey = new Map(
    (drift.recommendations ?? []).map((d) => [`${d.allocationType}|${d.key}`, d]),
  )
  return {
    ...model,
    fundId: drift.fundId ?? model.fundId,
    allocations: model.allocations.map((a) => {
      const match =
        [...byKey.values()].find(
          (d) =>
            dimensionLabel(d.allocationType) === a.dimension &&
            String(d.key).toLowerCase() === a.asset.toLowerCase(),
        ) ??
        byKey.get(`${a.dimension}|${a.asset}`)
      const rec = match
        ? recByKey.get(`${match.allocationType}|${match.key}`)
        : undefined
      return {
        ...a,
        live: match ? match.liveWeightPct : a.live,
        drift: match ? match.driftPct : a.drift,
        recommendation: String(rec?.rebalanceAction ?? match?.rebalanceAction ?? a.recommendation),
      }
    }),
  }
}

export function mapSimulationResult(run: SimulationRun | null | undefined) {
  if (!run?.resultJson) return null
  const r = run.resultJson
  return {
    id: run.id,
    status: String(run.status ?? DASH),
    navBefore: r.navBefore,
    navAfter: r.navAfter,
    navImpact: r.navImpact,
    cashImpact: r.cashImpact,
    estimatedFees: r.estimatedFees,
    exposureImpactPct: r.exposureImpactPct,
    complianceOutcome: String(r.compliance?.outcome ?? DASH),
    complianceMessage: String(r.compliance?.message ?? DASH),
    checks: (r.compliance?.checks ?? []).map((c) => ({
      rule: String(c.message || c.ruleType || c.ruleId || DASH),
      status: String(c.outcome ?? DASH),
      ruleType: String(c.ruleType ?? DASH),
    })),
    createdAt: fmtDate(run.createdAt),
  }
}

export function mapFundOptions(data: unknown): { id: string; name: string }[] {
  return unwrapList<OpsFund>(data).map((f) => ({
    id: String(f.id),
    name: String(f.name ?? f.id),
  }))
}

export function fundNameMap(data: unknown): Record<string, string> {
  const map: Record<string, string> = {}
  for (const f of unwrapList<OpsFund>(data)) {
    map[f.id] = String(f.name ?? f.id)
  }
  return map
}

export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return DASH
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}m`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return formatMoneyDisplay(value)
}
