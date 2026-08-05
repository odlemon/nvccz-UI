import type { Holding } from '@/lib/api/investments-api'
import {
  investmentOpsApi,
  type ComplianceResultItem,
  type ComplianceRule,
  type ModelPortfolio,
  type ModelPortfolioDrift,
  type OpsFund,
  type OpsTrade,
  type Order,
  type PortfolioOverview,
  type SimulationRun,
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

function qtyField(primary: unknown, fallback: unknown): string {
  const num = n(primary)
  if (num != null) return num.toLocaleString('en-US')
  const fb = n(fallback)
  if (fb != null) return fb.toLocaleString('en-US')
  return DASH
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

function fmtDateTime(value: unknown): string {
  if (value == null || value === '') return DASH
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

/** Map API order status → client lifecycle labels (broker outside system). */
export function mapOrderUiStatus(
  status: string | null | undefined,
  openBroker?: { outcome?: string } | null,
): string {
  if (openBroker?.outcome) {
    const o = String(openBroker.outcome).toUpperCase()
    if (o === 'COUNTER') return 'Counter-offer'
    if (o === 'FILLED') return 'Broker fill'
    if (o === 'UNABLE') return 'Broker unable'
    if (o === 'PARTIAL') return 'Partial fill'
  }
  const u = String(status ?? '').toUpperCase()
  if (u === 'DRAFT') return 'Draft'
  if (u === 'SUBMITTED' || u === 'COMPLIANCE_REVIEW' || u === 'CHECKED') return 'Submitted'
  if (u === 'APPROVED') return 'Approved'
  if (u === 'SENT_TO_BROKER' || u === 'ROUTED') return 'Sent to Broker'
  if (u === 'BROKER_CONFIRMATION_RECORDED' || u === 'CONFIRMATION_RECORDED') return 'Confirmation Recorded'
  if (u.includes('PARTIAL')) return 'Partially Executed'
  if (u === 'EXECUTED') return 'Executed'
  if (u === 'PENDING_SETTLEMENT' || u === 'PENDING SETTLEMENT') return 'Pending Settlement'
  if (u.includes('FAIL')) return 'Failed'
  if (u === 'SETTLED') return 'Settled'
  if (u.includes('SETTLE') && !u.includes('PENDING')) return 'Settled'
  if (u === 'REJECTED') return 'Rejected'
  if (u === 'CANCELLED') return 'Cancelled'
  if (u.includes('ARCHIVE')) return 'Archived'
  return titleCaseStatus(String(status ?? DASH))
}

/**
 * Orderbook tabs — pending instructions until executed.
 * Trade blotter holds executed trades only (separate screen).
 */
export const ORDERBOOK_LIFECYCLE_TABS = [
  'Orderbook',
  'Draft',
  'Submitted',
  'Approved',
  'Sent to Broker',
  'Confirmation Recorded',
  'Partially Executed',
  'Executed',
  'Pending Settlement',
  'Settled',
  'Cancelled',
  'Failed',
  'Rejected',
  'Archived',
] as const

/** Statuses that belong on blotter / closed queues — not the default Orderbook inbox. */
const ORDERBOOK_INBOX_EXCLUDED = new Set([
  'Executed',
  'Pending Settlement',
  'Settled',
  'Cancelled',
  'Failed',
  'Rejected',
  'Archived',
])

export function orderMatchesLifecycleTab(uiStatus: string, tab: string): boolean {
  const awaitingBrokerDecision = new Set([
    'Confirmation Recorded',
    'Counter-offer',
    'Broker fill',
    'Broker unable',
    'Partial fill',
  ])
  // Default inbox = pending instructions only (broker-outside model).
  if (tab === 'Orderbook') return !ORDERBOOK_INBOX_EXCLUDED.has(uiStatus)
  if (tab === 'Submitted') return uiStatus === 'Submitted' || uiStatus === 'Compliance Review'
  if (tab === 'Sent to Broker') return uiStatus === 'Sent to Broker'
  if (tab === 'Confirmation Recorded') return awaitingBrokerDecision.has(uiStatus)
  return uiStatus === tab
}

/** Deep link from blotter trade → cash ledger filtered by trade (BA-RC-2). */
export function cashLedgerDeepLink(opts: { tradeId?: string | null; fundId?: string | null }): string {
  const q = new URLSearchParams()
  if (opts.tradeId) q.set('tradeId', opts.tradeId)
  if (opts.fundId) q.set('fundId', opts.fundId)
  const qs = q.toString()
  return `/investments-v2/reconciliation/cash-ledger${qs ? `?${qs}` : ''}`
}

/** Deep link from blotter trade → reconciliation (BA-TR-4). */
export function reconDeepLink(opts: { tradeId?: string | null; fundId?: string | null }): string {
  const q = new URLSearchParams()
  q.set('tab', 'trade')
  if (opts.tradeId) q.set('tradeId', opts.tradeId)
  if (opts.fundId) q.set('fundId', opts.fundId)
  return `/investments-v2/reconciliation/trade?${q.toString()}`
}

function mapTradeUiStatus(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u.includes('PARTIAL')) return 'Partially Executed'
  if (u === 'SETTLED') return 'Settled'
  if (u === 'EXECUTED') return 'Executed'
  if (u === 'PENDING_SETTLEMENT') return 'Pending Settlement'
  if (u === 'ROUTING' || u === 'DRAFT') return 'Pending'
  return titleCaseStatus(String(status ?? DASH))
}

function mapSettlement(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'SETTLED') return 'Settled'
  if (u.includes('FAIL') || u.includes('UNMATCH')) return 'Unmatched'
  if (u === 'PENDING' || u === 'PENDING_SETTLEMENT' || !u) return 'Pending Settlement'
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
  orderId: string | null
  fundId: string | null
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
  createdAt: string
  sortKey: number
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
      orderId: t.orderId != null ? String(t.orderId) : null,
      fundId: t.fundId != null ? String(t.fundId) : null,
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
      tradeDate: fmtDateTime(t.executedAt ?? t.createdAt),
      valueDate: fmtDate(t.valueDate ?? t.settledAt),
      status: mapTradeUiStatus(t.status),
      settlement: mapSettlement(t.settlementStatus),
      accounting: mapAccounting(t.accountingStatus),
      confirmation: mapConfirmation(t.confirmationStatus),
      createdAt: String(t.createdAt ?? t.executedAt ?? ''),
      sortKey: new Date(String(t.executedAt ?? t.createdAt ?? 0)).getTime() || 0,
    }
  })
}

export type OrderbookRow = {
  ref: string
  apiId: string
  tradeId: string | null
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
  brokerProfileId: string | null
  custodian: string
  custodianProfileId: string | null
  settlementAccountId: string | null
  settlementAccount: string
  /** ISO date yyyy-mm-dd when known */
  valueDateIso: string | null
  trader: string
  tradeDate: string
  valueDate: string
  approval: string
  routing: string
  created: string
  createdAt: string
  status: string
  rawStatus: string
  brokerOutcome: string | null
  brokerOfferQty: string | null
  brokerOfferPrice: string | null
  brokerOfferCurrency: string | null
  version: number
}

/** Deep-link to Accounting Events focused on this trade (no resolve API). */
export function accountingDeepLink(trade: Pick<BlotterTradeRow, 'id' | 'apiId' | 'fundId'>): string {
  const q = new URLSearchParams()
  q.set('tab', 'events')
  if (trade.id && trade.id !== DASH) q.set('tradeRef', trade.id)
  if (trade.apiId) q.set('tradeId', trade.apiId)
  if (trade.fundId) q.set('fundId', trade.fundId)
  q.set('select', '1')
  return `/investments-v2/accounting?${q.toString()}`
}

/** Deep-link to Trade Blotter focused on this order's trade. */
export function blotterDeepLink(order: Pick<OrderbookRow, 'tradeId' | 'apiId' | 'ref'>): string {
  const q = new URLSearchParams()
  if (order.tradeId) q.set('tradeId', order.tradeId)
  if (order.apiId) q.set('orderId', order.apiId)
  if (order.ref && order.ref !== DASH) q.set('orderRef', order.ref)
  // Always select detail panel on arrival
  q.set('select', '1')
  return `/investments-v2/orders/blotter?${q.toString()}`
}

export function orderHasBlotterLink(order: Pick<OrderbookRow, 'tradeId' | 'rawStatus' | 'apiId'>): boolean {
  return Boolean(order.tradeId && String(order.tradeId).trim())
}

/**
 * Resolve the listed-equity trade id for an orderbook row.
 * Needed because GET /trades often returns orderRef: null.
 */
export async function resolveOrderTradeId(order: {
  tradeId?: string | null
  apiId?: string | null
  ref?: string | null
}): Promise<{ tradeId: string | null; orderId: string | null; reason?: string }> {
  if (order.tradeId && String(order.tradeId).trim()) {
    return { tradeId: String(order.tradeId), orderId: order.apiId ?? null }
  }

  let orderId = order.apiId ?? null

  // Fresh GET — list rows can lag / omit tradeId after execute
  if (orderId) {
    try {
      const res = await investmentOpsApi.getOrder(orderId)
      if (res.success !== false && res.data) {
        const tid = res.data.tradeId
        if (tid != null && String(tid).trim()) {
          return { tradeId: String(tid), orderId }
        }
      }
    } catch {
      /* fall through */
    }
  }

  // Lookup by orderRef when id missing or tradeId still empty
  if (order.ref && order.ref !== DASH) {
    try {
      const list = await investmentOpsApi.listOrders({ page: 1, pageSize: 200 })
      if (list.success !== false && list.data) {
        const items = unwrapPaged<Order>(list.data).items.length
          ? unwrapPaged<Order>(list.data).items
          : unwrapList<Order>(list.data)
        const hit = items.find((o) => String(o.orderRef ?? '') === order.ref || String(o.id) === order.ref)
        if (hit) {
          orderId = String(hit.id)
          if (hit.tradeId != null && String(hit.tradeId).trim()) {
            return { tradeId: String(hit.tradeId), orderId }
          }
        }
      }
    } catch {
      /* fall through */
    }
  }

  return {
    tradeId: null,
    orderId,
    reason:
      'Order has no tradeId yet (seeded PENDING_SETTLEMENT without a trade, or execute not finished).',
  }
}

function mapApprovalLabel(order: Order): string {
  const open = order.openBrokerConfirmation
  if (open?.outcome) return 'Awaiting your decision'
  const latest = order.approvals?.[0]
  if (latest?.status) return titleCaseStatus(latest.status)
  if (order.approvedAt) return 'Approved'
  const u = String(order.status ?? '').toUpperCase()
  if (u === 'DRAFT') return 'Not submitted'
  if (u === 'REJECTED') return 'Rejected'
  if (u === 'SUBMITTED') return 'Pending approval'
  return titleCaseStatus(String(order.status ?? DASH))
}

function mapRoutingLabel(
  status: string,
  openBroker?: Order['openBrokerConfirmation'],
): string {
  if (openBroker?.outcome) {
    const o = String(openBroker.outcome).toUpperCase()
    const qty = openBroker.quantity ?? ''
    const px = openBroker.price ?? ''
    const ccy = openBroker.currencyCode ? ` ${openBroker.currencyCode}` : ''
    if (o === 'COUNTER') return `Counter ${qty} @ ${px}${ccy}`
    if (o === 'FILLED') return `Fill ${qty} @ ${px}${ccy} — accept?`
    if (o === 'UNABLE') return 'Unable to fill'
    if (o === 'PARTIAL') return `Partial ${qty} @ ${px}${ccy}`
  }
  const u = status.toUpperCase()
  if (u === 'BROKER_CONFIRMATION_RECORDED' || u === 'CONFIRMATION_RECORDED') return 'Broker replied'
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
    const uiStatus = mapOrderUiStatus(o.status, o.openBrokerConfirmation)
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
      brokerProfileId:
        o.brokerProfileId != null && String(o.brokerProfileId).trim()
          ? String(o.brokerProfileId)
          : null,
      custodian: String(o.custodianName ?? o.custodianProfileId ?? DASH),
      custodianProfileId: o.custodianProfileId != null && String(o.custodianProfileId).trim() ? String(o.custodianProfileId) : null,
      settlementAccountId:
        o.settlementAccountId != null && String(o.settlementAccountId).trim()
          ? String(o.settlementAccountId)
          : null,
      settlementAccount: String(o.settlementAccountName ?? o.settlementAccountId ?? DASH),
      valueDateIso: o.valueDate ? String(o.valueDate).slice(0, 10) : null,
      trader: String(o.ownerName ?? o.createdByName ?? o.createdById ?? DASH),
      tradeDate: fmtDateTime(o.tradeDate ?? o.submittedAt ?? o.createdAt),
      valueDate: fmtDate(o.valueDate),
      approval: mapApprovalLabel(o),
      routing: mapRoutingLabel(String(o.status ?? ''), o.openBrokerConfirmation),
      created: fmtDate(o.createdAt),
      createdAt: String(o.createdAt ?? ''),
      status: uiStatus,
      rawStatus: String(o.status ?? ''),
      brokerOutcome: o.openBrokerConfirmation?.outcome
        ? String(o.openBrokerConfirmation.outcome).toUpperCase()
        : null,
      brokerOfferQty: o.openBrokerConfirmation?.quantity ?? null,
      brokerOfferPrice: o.openBrokerConfirmation?.price ?? null,
      brokerOfferCurrency: o.openBrokerConfirmation?.currencyCode ?? null,
      tradeId: o.tradeId != null && String(o.tradeId).trim() ? String(o.tradeId) : null,
      version: Number(o.version ?? o.auditVersion ?? 1) || 1,
    }
  })
}

/**
 * When BE leaves order.status at PENDING_SETTLEMENT after blotter settle,
 * promote the orderbook row to Settled using the linked trade's settlement.
 */
export function syncOrderbookStatusFromTrades(
  orders: OrderbookRow[],
  trades: BlotterTradeRow[],
): OrderbookRow[] {
  if (!orders.length || !trades.length) return orders
  const byTradeId = new Map(trades.map((t) => [t.apiId, t]))
  const byOrderId = new Map<string, BlotterTradeRow>()
  const byOrderRef = new Map<string, BlotterTradeRow>()
  for (const t of trades) {
    if (t.orderId) byOrderId.set(t.orderId, t)
    if (t.order && t.order !== DASH) byOrderRef.set(t.order.toLowerCase(), t)
  }

  return orders.map((order) => {
    const trade =
      (order.tradeId ? byTradeId.get(order.tradeId) : undefined) ||
      byOrderId.get(order.apiId) ||
      (order.ref !== DASH ? byOrderRef.get(order.ref.toLowerCase()) : undefined)
    if (!trade) return order

    const tradeSettled = trade.settlement === 'Settled' || trade.status === 'Settled'
    if (!tradeSettled) return order
    if (order.status === 'Settled') return order

    // Only promote late lifecycle statuses — never overwrite Cancelled/Failed/etc.
    const late =
      order.status === 'Pending Settlement' ||
      order.status === 'Executed' ||
      order.status === 'Partially Executed' ||
      order.rawStatus.toUpperCase().includes('SETTLE') ||
      order.rawStatus.toUpperCase() === 'EXECUTED' ||
      order.rawStatus.toUpperCase().includes('PARTIAL')
    if (!late) return order

    return {
      ...order,
      status: 'Settled',
      rawStatus: 'SETTLED',
      tradeId: order.tradeId || trade.apiId,
      routing: 'Settled',
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
  return unwrapList<Holding>(holdings).map((h) => {
    const sec = (h.instrument ?? h.security) as { symbol?: string; name?: string; listingCurrencyCode?: string } | undefined
    return {
      portfolio: portfolioName || DASH,
      fundId,
      reference: String(sec?.symbol ?? h.securityId ?? DASH),
      shortName: String(sec?.name ?? sec?.symbol ?? DASH),
      quantity: fmtInt(h.quantity),
      open: qtyField(h.openQuantity, h.quantity),
      price: h.currentPrice != null ? fmtNum(h.currentPrice) : DASH,
      tr: h.unrealizedPnl != null ? fmtNum(h.unrealizedPnl) : DASH,
      currency: String(h.wacCurrencyCode ?? sec?.listingCurrencyCode ?? DASH),
      industry: DASH,
      type: sec ? 'Equity' : DASH,
    }
  })
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
  orderId: string | null
  orderRef: string
  fundId: string
  ticker: string
  side: string
  ruleName: string
  ruleType: string
  limitDisplay: string
  currentDisplay: string
  afterTradeDisplay: string
  /** Display label (prefers API `srdLabel`) */
  outcome: string
  /** Canonical API outcome code when present */
  outcomeCode: string
  createdAt: string
}

/** BA-T1 — map API outcomes / legacy BREACH to SRD six labels. */
export function mapComplianceOutcomeLabel(outcome: string | null | undefined, srdLabel?: string | null): string {
  if (srdLabel != null && String(srdLabel).trim()) return String(srdLabel).trim()
  const raw = String(outcome ?? '').toUpperCase().replace(/\s+/g, '_')
  const map: Record<string, string> = {
    PASSED: 'Passed',
    PASS: 'Passed',
    WARNING: 'Warning',
    WARN: 'Warning',
    FAILED: 'Failed',
    FAIL: 'Failed',
    BREACH: 'Failed',
    REQUIRES_OVERRIDE: 'Requires Override',
    APPROVED_WITH_EXCEPTION: 'Approved with Exception',
    REJECTED: 'Rejected',
  }
  return map[raw] ?? (outcome ? titleCaseStatus(String(outcome)) : DASH)
}

export function normalizeComplianceOutcomeCode(outcome: string | null | undefined): string {
  const raw = String(outcome ?? '').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'PASS') return 'PASSED'
  if (raw === 'WARN') return 'WARNING'
  if (raw === 'FAIL' || raw === 'BREACH') return 'FAILED'
  return raw
}

export function mapComplianceResults(data: unknown): ComplianceResultRow[] {
  return unwrapList<ComplianceResultItem>(data).map((r) => {
    const nested =
      r.result && typeof r.result === 'object' && r.result !== null
        ? (r.result as { id?: string | null })
        : null
    const resultId =
      (r.complianceResultId != null && String(r.complianceResultId).trim()
        ? String(r.complianceResultId)
        : null) ||
      (nested?.id != null && String(nested.id).trim() ? String(nested.id) : null) ||
      String(r.id ?? '')
    return {
      id: resultId,
      orderId: r.orderId ? String(r.orderId) : null,
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
      outcome: mapComplianceOutcomeLabel(r.outcome, r.srdLabel),
      outcomeCode: normalizeComplianceOutcomeCode(r.outcome),
      createdAt: fmtDate(r.createdAt),
    }
  })
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
    exposureImpactPct: n(r.exposureImpactPct) ?? 0,
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
