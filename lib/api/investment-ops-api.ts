import { apiClient } from "./api-client"
import type { Holding, PriceTick, RoutingHop, Security } from "./investments-api"

// ─── Response wrapper ────────────────────────────────────────────────────────
interface InvestmentOpsResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardPortfolioSummary {
  fundId: string
  name: string
  nav: number
  valuationDate: string | null
  pnl: number
  pnlPct: number
  periodRealizedPnl: number
  baseCurrency: string
  status: "OK" | "STALE" | string
  lastRecalculation: string | null
  period: string
  periodStart: string
  periodEnd: string
}

export interface DashboardSummary {
  portfolios: DashboardPortfolioSummary[]
  period: string
  periodStart: string
  periodEnd: string
}

export interface AllocationBucket {
  value: number
  pct: number
}

export interface DashboardAllocation {
  equities: AllocationBucket
  cash: AllocationBucket
  bonds: AllocationBucket
  funds: AllocationBucket
  commodities: AllocationBucket
  crypto: AllocationBucket
  alternatives: AllocationBucket
  other: AllocationBucket
}

export interface CurrencyExposureEntry {
  currency: string
  value: number
}

export interface FundSnapshot {
  id: string
  fundId: string
  asOf: string
  navBaseCurrency: string
  unrealizedPnlUsd: string
  unrealizedPnlZig: string
  realizedPnlUsd: string
  realizedPnlZig: string
  fxRateUsed: string
  fxRateSource: string
  status: string
  createdAt: string
}

export interface OpsFund {
  id: string
  name: string
  fundPurpose: string
  baseCurrencyCode: string
  latestSnapshot: FundSnapshot | null
}

// ─── Portfolios ───────────────────────────────────────────────────────────────
export interface PortfolioOverview {
  fundId: string
  name: string
  nav: number
  pnl: number
  startDate: string
  valuationDate: string | null
  baseCurrency: string
  portfolioManager: string
  status: string
}

export interface PortfolioTransaction {
  id: string
  type: "PURCHASE" | "SALE"
  tradeRef: string
  symbol: string
  quantity: number
  price: number
  status: string
  tradeDate: string
  journalEntryId: string | null
  realizedPnl: number | null
}

export interface ExposureByExchange {
  key: string
  value: number
  pct: number
}

export interface PortfolioExposure {
  byExchange: ExposureByExchange[]
  topHoldings: Holding[]
}

// ─── Instruments ──────────────────────────────────────────────────────────────
export interface InstrumentType {
  id: string
  typeCode: string
  displayName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Instrument {
  id: string
  instrumentCode: string
  shortName: string
  fullName: string
  ticker: string
  isin: string | null
  bloombergCode: string | null
  reutersCode: string | null
  internalRef: string | null
  exchangeCode: string
  marketCode: string | null
  countryCode: string | null
  issuerName: string | null
  issuerId: string | null
  instrumentTypeCode: string
  subCategory: string | null
  sector: string | null
  industry: string | null
  listingCurrencyCode: string
  pricingSource: string | null
  valuationMethod: string
  stalePriceThresholdHours: number
  decimalPrecision: number
  maturityDate: string | null
  couponRate: number | null
  couponFrequency: string | null
  status: string
  complianceRestriction: string | null
  createdById: string | null
  approvedById: string | null
  approvedAt: string | null
  listedEquitySecurityId: string | null
  auditVersion: number
  createdAt: string
  updatedAt: string
}

export interface InstrumentListResult {
  items: Instrument[]
  page?: number
  pageSize?: number
  total?: number
  [key: string]: any
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "SENT_TO_BROKER"
  | "EXECUTED"
  | "REJECTED"
  | "CANCELLED"
  | string

export interface OrderApproval {
  id: string
  orderId: string
  approvalType: string
  status: string
  approverId: string
  reason: string | null
  oldStatus: string
  newStatus: string
  createdAt: string
}

export interface OrderComplianceResult {
  id: string
  orderId: string
  ruleId: string | null
  outcome: "PASSED" | "BREACH" | "WARNING" | string
  message: string
  overrideReason: string | null
  overrideById: string | null
  overrideDocumentId: string | null
  createdAt: string
}

export interface Order {
  id: string
  orderRef: string
  fundId: string
  instrumentId: string
  securityId: string | null
  side: "BUY" | "SELL"
  quantity: string
  orderType: "MARKET" | "LIMIT" | string
  limitPrice: string | null
  executionPrice: string
  tradeCurrency: string
  settlementCurrency: string | null
  brokerProfileId: string | null
  custodianProfileId: string | null
  valueDate: string | null
  tradeDate: string | null
  status: OrderStatus
  complianceStatus: "PASSED" | "BREACH" | "WARNING" | null
  notes: string | null
  tradeId: string | null
  createdById: string
  submittedAt: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  instrument: Instrument
  approvals?: OrderApproval[]
  complianceResults?: OrderComplianceResult[]
}

export interface OrderListResult {
  items: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OrderComplianceCheck {
  ruleId: string
  ruleType: string
  outcome: "PASSED" | "BREACH" | "WARNING" | string
  message: string
}

export interface OrderPreview {
  grossConsideration: number
  fees: number
  taxes: number
  settlementAmount: number
  portfolioWeightAfterPct: number
  cashImpact: number
  nav: number
  instrumentStatus: string
  compliancePreview: {
    outcome: "PASSED" | "BREACH" | "WARNING" | string
    message: string
    checks: OrderComplianceCheck[]
  }
}

// ─── Trades ───────────────────────────────────────────────────────────────────
export interface OpsFundRef {
  id: string
  name: string
  description: string | null
  totalAmount: string
  remainingAmount: string
  minInvestment: string
  maxInvestment: string
  focusIndustries: string[]
  applicationStart: string
  applicationEnd: string
  status: string
  fundPurpose: string
  createdById: string
  createdAt: string
  updatedAt: string
  managementFeeRate: string | null
  managementFeeBase: string | null
  managementFeeFrequency: string | null
  managementFeeStartDate: string | null
  carryRate: string | null
  hurdleRate: string | null
  hurdleType: string | null
  catchUpRate: string | null
  waterfallType: string | null
}

export interface OpsTrade {
  id: string
  tradeRef: string
  fundId: string
  securityId: string
  side: "BUY" | "SELL"
  quantity: string
  executionPrice: string
  executionCurrencyCode: string
  fees: string
  status: "DRAFT" | "EXECUTED" | "ROUTING" | "SETTLED" | "SETTLEMENT_FAILED" | "CANCELLED" | string
  idempotencyKey: string | null
  executedAt: string | null
  settledAt: string | null
  executedById: string | null
  createdAt: string
  updatedAt: string
  security: Security
  fund?: OpsFundRef
  routingHops: RoutingHop[]
  accountingStatus: "NOT_POSTED" | "POSTED" | string
  confirmationStatus: "DISPATCHED" | "CONFIRMED" | string
  settlementStatus: "SETTLED" | "SETTLEMENT_FAILED" | "PENDING" | string
  grossConsideration: number
  netConsideration: number
  brokerProfileId: string | null
  custodianProfileId: string | null
  valueDate: string | null
}

// ─── Compliance ───────────────────────────────────────────────────────────────
export interface ComplianceRule {
  id: string
  fundId: string | null
  ruleCode: string
  ruleName: string
  ruleType: string
  thresholdValue: string
  thresholdUnit: string | null
  instrumentTypeCode: string | null
  sectorCode: string | null
  countryCode: string | null
  issuerName: string | null
  esgFlag: boolean | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Simulation ───────────────────────────────────────────────────────────────
export interface SimulationScenario {
  side: "BUY" | "SELL"
  instrumentId: string
  quantity: number
  price: number
}

export interface SimulationComplianceCheck {
  ruleId: string
  message: string
  outcome: "PASSED" | "BREACH" | "WARNING" | string
  ruleType: string
}

export interface SimulationResult {
  navBefore: number
  navAfter: number
  navImpact: number
  cashImpact: number
  estimatedFees: number
  exposureImpactPct: number
  compliance: {
    checks: SimulationComplianceCheck[]
    message: string
    outcome: "PASSED" | "BREACH" | "WARNING" | string
  }
}

export interface SimulationRun {
  id: string
  fundId: string
  scenarioJson: SimulationScenario
  resultJson: SimulationResult
  status: "COMPLETED" | string
  createdById: string
  createdAt: string
}

// ─── Accounting ───────────────────────────────────────────────────────────────
export interface AccountingEvent {
  id: string
  fundId: string
  sourceType: string
  sourceId: string
  eventType: string
  status: "POSTED" | string
  journalEntryId: string | null
  tradeRef: string
  amount: number
  currencyCode: string
  postedAt: string | null
  createdAt: string
}

export interface AccountingEventListResult {
  items: AccountingEvent[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ChartOfAccount {
  id: string
  accountNo: string
  accountName: string
  accountType: string
  naturalBalance: "DEBIT" | "CREDIT" | string
  financialStatement: string
  notes: string | null
  parentId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface JournalEntryLine {
  id: string
  journalEntryId: string
  chartOfAccountId: string
  debitAmount: string
  creditAmount: string
  description: string
  vatAmount: string | null
  createdAt: string
  recordedCurrencyId: string | null
  chartOfAccount: ChartOfAccount
}

export interface CurrencyRef {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  transactionDate: string
  referenceNumber: string
  description: string
  totalAmount: string
  currencyId: string
  status: "POSTED" | string
  auditTrailSequenceNumber: number
  createdById: string
  createdAt: string
  updatedAt: string
  usdZwgRateSnapshot: string | null
  journalEntryLines: JournalEntryLine[]
  currency?: CurrencyRef
}

// ─── Documents ────────────────────────────────────────────────────────────────
export interface OpsDocument {
  id: string
  fundId: string
  documentType: string
  title: string
  fileRef: string
  orderId: string | null
  tradeId: string | null
  versionNo: number
  approvalStatus: "PENDING" | string
  uploadedById: string
  createdAt: string
  updatedAt: string
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface ReportTemplate {
  code: string
  name: string
  description: string
  scopeType: string
  supportedFormats: string[]
  requiresFundId: boolean
  requiresClientId: boolean
  hasDocxTemplate: boolean
}

export interface GeneratedReport {
  id: string
  fundId: string | null
  clientId: string | null
  scopeType: string
  reportType: string
  format: string
  status: "COMPLETED" | string
  fileRef: string
  parametersJson: Record<string, any>
  requestedById: string
  completedAt: string | null
  createdAt: string
}

export interface ReportRun {
  id: string
  fundId: string | null
  fundName: string | null
  clientId: string | null
  clientName: string | null
  scopeType: string
  reportType: string
  reportTypeName: string
  format: string
  status: "COMPLETED" | string
  parameters: Record<string, any>
  requestedBy: { id: string; name: string; email: string }
  createdAt: string
  completedAt: string | null
  downloadAvailable: boolean
}

export interface ReportRunListResult {
  items: ReportRun[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export interface ListedEquityFundConfig {
  id: string
  fundId: string
  baseCurrencyCode: string
  trustBankId: string | null
  coaMappingJson: Record<string, any>
  brokerProfileId: string | null
  custodianProfileId: string | null
  createdAt: string
  updatedAt: string
}

export interface SetupFund {
  id: string
  name: string
  description: string | null
  totalAmount: string
  remainingAmount: string
  minInvestment: string
  maxInvestment: string
  focusIndustries: string[]
  applicationStart: string
  applicationEnd: string
  status: string
  fundPurpose: string
  createdById: string
  createdAt: string
  updatedAt: string
  managementFeeRate: string | null
  managementFeeBase: string | null
  managementFeeFrequency: string | null
  managementFeeStartDate: string | null
  carryRate: string | null
  hurdleRate: string | null
  hurdleType: string | null
  catchUpRate: string | null
  waterfallType: string | null
  listedEquityFundConfig?: ListedEquityFundConfig
}

export interface FundManagerAssignment {
  id: string
  fundId: string
  userId: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StakeholderProfile {
  id: string
  profileType: "BROKER" | "CUSTODIAN" | string
  name: string
  contactEmail: string
  deliveryMode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CommissionRate {
  id: string
  stakeholderProfileId: string
  instrumentTypeCode: string | null
  rateBps: string
  flatFee: string | null
  currencyCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SetupMarket {
  id: string
  marketCode: string
  marketName: string
  countryCode: string
  exchangeCode: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SetupCurrency {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface SetupCountry {
  id: string
  countryCode: string
  countryName: string
  region: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SetupIssuer {
  id: string
  issuerCode: string
  legalName: string
  countryCode: string
  sector: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PriceSource {
  sourceCode: string
  displayName: string
  isEnabled: boolean
  apiStatus: string
  lastSuccessfulRun: string | null
  ticksToday: number
  failedRequests: number
  retryCount: number
  message: string
}

export interface SetupSettings {
  stale_price_hours?: { hours: number }
  four_eye_orders?: { enabled: boolean }
  default_valuation_method?: { method: string }
  [key: string]: any
}

// ─── Reconciliation ───────────────────────────────────────────────────────────
export interface ReconciliationItem {
  id: string
  batchId: string
  status: "MATCHED" | "UNMATCHED" | string
  internalRef: string | null
  externalRef: string | null
  internalAmount: string | null
  externalAmount: string | null
  variance: string | null
  message: string
  resolvedById: string | null
  resolvedAt: string | null
  resolutionReason: string | null
  resolutionDocumentId: string | null
  createdAt: string
}

export interface ReconciliationBatch {
  id: string
  fundId: string
  reconType: "HOLDINGS" | "CUSTODIAN_POSITION" | string
  asOfDate: string
  status: "COMPLETED" | string
  matchedCount: number
  unmatchedCount: number
  externalFileName: string | null
  createdById: string
  completedAt: string | null
  createdAt: string
  items?: ReconciliationItem[]
}

// ─── Model Portfolios ─────────────────────────────────────────────────────────
export interface ModelPortfolioAllocation {
  id: string
  modelPortfolioId: string
  allocationType: string
  allocationKey: string
  targetWeightPct: string
  createdAt: string
}

export interface ModelPortfolio {
  id: string
  name: string
  strategyCode: string | null
  baseCurrencyCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  allocations: ModelPortfolioAllocation[]
}

export interface ModelPortfolioDriftEntry {
  allocationType: string
  key: string
  targetWeightPct: number
  liveWeightPct: number
  driftPct: number
  rebalanceAction: string
}

export interface ModelPortfolioDrift {
  model: ModelPortfolio
  fundId: string
  drift: ModelPortfolioDriftEntry[]
  recommendations: ModelPortfolioDriftEntry[]
}

// ─── Valuation ────────────────────────────────────────────────────────────────
export interface ValuationException {
  id: string
  valuationRunId: string
  fundId: string
  instrumentId: string | null
  securityId: string | null
  exceptionType: string
  message: string
  status: "OPEN" | string
  resolvedById: string | null
  resolutionAction: string | null
  resolutionNote: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface ValuationRun {
  id: string
  fundId: string
  asOf: string
  status: "COMPLETED" | "COMPLETED_WITH_EXCEPTIONS" | string
  navBaseCurrency: string
  errorMessage: string | null
  parametersJson: { costBasisMethod: string; [key: string]: any }
  startedById: string
  completedAt: string | null
  createdAt: string
  exceptions: ValuationException[]
}

// ─── Market Data — Ingest Batches ─────────────────────────────────────────────
export interface IngestBatch {
  id: string
  sourceType: string
  sourceCode: string
  asOfDate: string
  rawPayloadRef: string
  sha256Checksum: string
  recordCount: number
  status: "COMPLETED" | "PARTIAL" | string
  sourceStatus: "OK" | "FALLBACK" | string
  errorMessage: string | null
  createdAt: string
}

export interface IngestPriceTick extends PriceTick {
  security: Security
}

export interface IngestBatchDetail {
  batch: IngestBatch & { priceTicks: IngestPriceTick[] }
  checksumValid: boolean
  recomputedChecksum: string
}

// ─── Service class ────────────────────────────────────────────────────────────
class InvestmentOpsApiService {
  private readonly BASE = "/investment-ops"

  // ── Dashboard ───────────────────────────────────────────────────────────────
  async getDashboardSummary(params?: { period?: string; startDate?: string }): Promise<InvestmentOpsResponse<DashboardSummary>> {
    const q = new URLSearchParams()
    if (params?.period) q.append("period", params.period)
    if (params?.startDate) q.append("startDate", params.startDate)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/dashboard/summary${qs ? `?${qs}` : ""}`)
  }

  async getDashboardAllocation(fundId: string): Promise<InvestmentOpsResponse<DashboardAllocation>> {
    return apiClient.get(`${this.BASE}/dashboard/allocation?fundId=${fundId}`)
  }

  async getDashboardCurrencyExposure(fundId: string): Promise<InvestmentOpsResponse<CurrencyExposureEntry[]>> {
    return apiClient.get(`${this.BASE}/dashboard/currency-exposure?fundId=${fundId}`)
  }

  async getDashboardFunds(): Promise<InvestmentOpsResponse<OpsFund[]>> {
    return apiClient.get(`${this.BASE}/dashboard/funds`)
  }

  async recalculateDashboard(fundId: string): Promise<InvestmentOpsResponse<FundSnapshot[]>> {
    return apiClient.post(`${this.BASE}/dashboard/recalculate`, { fundId })
  }

  // ── Portfolios ──────────────────────────────────────────────────────────────
  async listPortfolios(): Promise<InvestmentOpsResponse<OpsFund[]>> {
    return apiClient.get(`${this.BASE}/portfolios`)
  }

  async getPortfolioOverview(fundId: string): Promise<InvestmentOpsResponse<PortfolioOverview>> {
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/overview`)
  }

  async getPortfolioHoldings(fundId: string): Promise<InvestmentOpsResponse<Holding[]>> {
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/holdings`)
  }

  async getPortfolioTransactions(fundId: string): Promise<InvestmentOpsResponse<PortfolioTransaction[]>> {
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/transactions`)
  }

  async getPortfolioExposure(fundId: string): Promise<InvestmentOpsResponse<PortfolioExposure>> {
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/exposure`)
  }

  async recalculatePortfolio(fundId: string): Promise<InvestmentOpsResponse<FundSnapshot>> {
    return apiClient.post(`${this.BASE}/portfolios/${fundId}/recalculate`, {})
  }

  // ── Instruments ──────────────────────────────────────────────────────────────
  async getInstrumentTypes(): Promise<InvestmentOpsResponse<InstrumentType[]>> {
    return apiClient.get(`${this.BASE}/instruments/types`)
  }

  async listInstruments(params?: {
    type?: string
    exchange?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<InstrumentListResult>> {
    const q = new URLSearchParams()
    if (params?.type) q.append("type", params.type)
    if (params?.exchange) q.append("exchange", params.exchange)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/instruments${qs ? `?${qs}` : ""}`)
  }

  // ── Market Data — Ingest Batches ──────────────────────────────────────────────
  async listIngestBatches(): Promise<InvestmentOpsResponse<IngestBatch[]>> {
    return apiClient.get(`${this.BASE}/market-data/ingest/batches`)
  }

  async getIngestBatchDetail(id: string): Promise<InvestmentOpsResponse<IngestBatchDetail>> {
    return apiClient.get(`${this.BASE}/market-data/ingest/batches/${id}`)
  }

  // ── Orders ───────────────────────────────────────────────────────────────────
  async listOrders(params?: { fundId?: string; status?: string; page?: number; pageSize?: number }): Promise<InvestmentOpsResponse<OrderListResult>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/orders${qs ? `?${qs}` : ""}`)
  }

  async createOrder(data: {
    fundId: string
    instrumentId: string
    side: "BUY" | "SELL"
    quantity: number
    executionPrice: number
    orderType: "MARKET" | "LIMIT"
    limitPrice?: number
  }): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders`, data)
  }

  async previewOrder(data: {
    fundId: string
    instrumentId: string
    side: "BUY" | "SELL"
    quantity: number
    executionPrice: number
  }): Promise<InvestmentOpsResponse<OrderPreview>> {
    return apiClient.post(`${this.BASE}/orders/preview`, data)
  }

  async getOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.get(`${this.BASE}/orders/${id}`)
  }

  async submitOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/submit`, {})
  }

  async approveOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/approve`, {})
  }

  async sendOrderToBroker(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/send-to-broker`, {})
  }

  async rejectOrder(id: string, reason: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/reject`, { reason })
  }

  async cancelOrder(id: string, reason: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/cancel`, { reason })
  }

  async complianceCheckOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/compliance-check`, {})
  }

  async executeOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/execute`, {})
  }

  // ── Trades ───────────────────────────────────────────────────────────────────
  async listTrades(params?: { fundId?: string }): Promise<InvestmentOpsResponse<OpsTrade[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/trades${qs ? `?${qs}` : ""}`)
  }

  async getTradeDetail(id: string): Promise<InvestmentOpsResponse<OpsTrade>> {
    return apiClient.get(`${this.BASE}/trades/${id}`)
  }

  async executeTrade(id: string): Promise<InvestmentOpsResponse<OpsTrade>> {
    return apiClient.post(`${this.BASE}/trades/${id}/execute`, {})
  }

  async getTradeRoutingHops(id: string): Promise<InvestmentOpsResponse<RoutingHop[]>> {
    return apiClient.get(`${this.BASE}/trades/${id}/routing-hops`)
  }

  async confirmRoutingHop(tradeId: string, hopId: string): Promise<InvestmentOpsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE}/trades/${tradeId}/routing-hops/${hopId}/confirm`, {})
  }

  async retryRoutingHop(tradeId: string, hopId: string): Promise<InvestmentOpsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE}/trades/${tradeId}/routing-hops/${hopId}/retry`, {})
  }

  async cancelRoutingHop(tradeId: string, hopId: string): Promise<InvestmentOpsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE}/trades/${tradeId}/routing-hops/${hopId}/cancel`, {})
  }

  async getSettlementDocument(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/trades/${id}/settlement-document`, { responseType: "blob" })
  }

  // ── Compliance ───────────────────────────────────────────────────────────────
  async listComplianceRules(params?: { fundId?: string }): Promise<InvestmentOpsResponse<ComplianceRule[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/compliance/rules${qs ? `?${qs}` : ""}`)
  }

  async createComplianceRule(data: {
    ruleCode: string
    ruleName: string
    ruleType: string
    thresholdValue: number
    fundId?: string
  }): Promise<InvestmentOpsResponse<ComplianceRule>> {
    return apiClient.post(`${this.BASE}/compliance/rules`, data)
  }

  async createComplianceOverride(data: { orderId: string; reason: string }): Promise<InvestmentOpsResponse<any>> {
    return apiClient.post(`${this.BASE}/compliance/overrides`, data)
  }

  // ── Simulation ───────────────────────────────────────────────────────────────
  async runSimulation(data: { fundId: string; scenario: SimulationScenario }): Promise<InvestmentOpsResponse<SimulationRun>> {
    return apiClient.post(`${this.BASE}/simulation/run`, data)
  }

  async getSimulationRun(id: string): Promise<InvestmentOpsResponse<SimulationRun>> {
    return apiClient.get(`${this.BASE}/simulation/runs/${id}`)
  }

  // ── Model Portfolios ─────────────────────────────────────────────────────────
  async listModelPortfolios(): Promise<InvestmentOpsResponse<ModelPortfolio[]>> {
    return apiClient.get(`${this.BASE}/model-portfolios`)
  }

  async createModelPortfolio(data: {
    name: string
    allocations: Array<{ allocationType: string; allocationKey: string; targetWeightPct: number }>
  }): Promise<InvestmentOpsResponse<ModelPortfolio>> {
    return apiClient.post(`${this.BASE}/model-portfolios`, data)
  }

  async getModelPortfolioDrift(modelId: string, fundId: string): Promise<InvestmentOpsResponse<ModelPortfolioDrift>> {
    return apiClient.get(`${this.BASE}/model-portfolios/${modelId}/drift?fundId=${fundId}`)
  }

  // ── Valuation ────────────────────────────────────────────────────────────────
  async createValuationRun(data: { fundId: string; costBasisMethod: string }): Promise<InvestmentOpsResponse<ValuationRun>> {
    return apiClient.post(`${this.BASE}/valuation/runs`, data)
  }

  async getValuationRun(id: string): Promise<InvestmentOpsResponse<ValuationRun>> {
    return apiClient.get(`${this.BASE}/valuation/runs/${id}`)
  }

  async listValuationExceptions(params?: { fundId?: string }): Promise<InvestmentOpsResponse<ValuationException[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/valuation/exceptions${qs ? `?${qs}` : ""}`)
  }

  // ── Reconciliation ───────────────────────────────────────────────────────────
  async runReconciliation(data: { fundId: string; reconType: string }): Promise<InvestmentOpsResponse<ReconciliationBatch>> {
    return apiClient.post(`${this.BASE}/reconciliation/run`, data)
  }

  async uploadReconciliation(data: {
    fundId: string
    reconType: string
    csvText: string
    fileName: string
  }): Promise<InvestmentOpsResponse<ReconciliationBatch>> {
    return apiClient.post(`${this.BASE}/reconciliation/upload`, data)
  }

  async listReconciliationBatches(params?: { fundId?: string }): Promise<InvestmentOpsResponse<ReconciliationBatch[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/reconciliation/batches${qs ? `?${qs}` : ""}`)
  }

  async getReconciliationBatchDetail(id: string): Promise<InvestmentOpsResponse<ReconciliationBatch>> {
    return apiClient.get(`${this.BASE}/reconciliation/batches/${id}`)
  }

  async resolveReconciliationItem(id: string, reason: string): Promise<InvestmentOpsResponse<ReconciliationItem>> {
    return apiClient.post(`${this.BASE}/reconciliation/items/${id}/resolve`, { reason })
  }

  // ── Accounting ───────────────────────────────────────────────────────────────
  async listAccountingEvents(params?: {
    fundId?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<AccountingEventListResult>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/accounting/events${qs ? `?${qs}` : ""}`)
  }

  async reverseAccountingEvent(id: string, reason: string): Promise<InvestmentOpsResponse<AccountingEvent>> {
    return apiClient.post(`${this.BASE}/accounting/events/${id}/reverse`, { reason })
  }

  async listJournalEntries(params?: { fundId?: string }): Promise<InvestmentOpsResponse<JournalEntry[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/accounting/journals${qs ? `?${qs}` : ""}`)
  }

  async getJournalEntry(id: string): Promise<InvestmentOpsResponse<JournalEntry>> {
    return apiClient.get(`${this.BASE}/accounting/journals/${id}`)
  }

  // ── Documents ─────────────────────────────────────────────────────────────────
  async listDocuments(params?: { fundId?: string; documentType?: string }): Promise<InvestmentOpsResponse<OpsDocument[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.documentType) q.append("documentType", params.documentType)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/documents${qs ? `?${qs}` : ""}`)
  }

  async createDocument(data: {
    fundId: string
    documentType: string
    title: string
    fileRef: string
  }): Promise<InvestmentOpsResponse<OpsDocument>> {
    return apiClient.post(`${this.BASE}/documents`, data)
  }

  async downloadDocument(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/documents/${id}/download`, { responseType: "blob" })
  }

  // ── Reports ───────────────────────────────────────────────────────────────────
  async listReportTemplates(): Promise<InvestmentOpsResponse<ReportTemplate[]>> {
    return apiClient.get(`${this.BASE}/reports/templates`)
  }

  async generateReport(data: {
    fundId?: string
    clientId?: string
    reportType: string
    format: string
    parameters: Record<string, any>
  }): Promise<InvestmentOpsResponse<GeneratedReport>> {
    return apiClient.post(`${this.BASE}/reports/generate`, data)
  }

  async downloadReport(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/reports/${id}/download`, { responseType: "blob" })
  }

  async listReports(params?: {
    fundId?: string
    reportType?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<ReportRunListResult>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.reportType) q.append("reportType", params.reportType)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/reports${qs ? `?${qs}` : ""}`)
  }

  // ── Setup — Funds ────────────────────────────────────────────────────────────
  async listSetupFunds(): Promise<InvestmentOpsResponse<SetupFund[]>> {
    return apiClient.get(`${this.BASE}/setup/funds`)
  }

  async createSetupFund(data: {
    name: string
    description?: string
    baseCurrencyCode: string
  }): Promise<InvestmentOpsResponse<SetupFund>> {
    return apiClient.post(`${this.BASE}/setup/funds`, data)
  }

  async getSetupFund(id: string): Promise<InvestmentOpsResponse<SetupFund>> {
    return apiClient.get(`${this.BASE}/setup/funds/${id}`)
  }

  async updateSetupFund(id: string, data: { name?: string; description?: string; status?: string }): Promise<InvestmentOpsResponse<SetupFund>> {
    return apiClient.put(`${this.BASE}/setup/funds/${id}`, data)
  }

  async updateSetupFundConfig(
    id: string,
    data: {
      baseCurrencyCode?: string
      trustBankId?: string
      brokerProfileId?: string
      custodianProfileId?: string
      coaMappingJson?: Record<string, any>
    }
  ): Promise<InvestmentOpsResponse<ListedEquityFundConfig>> {
    return apiClient.put(`${this.BASE}/setup/funds/${id}/config`, data)
  }

  async assignFundManager(fundId: string, data: { userId: string; role: string }): Promise<InvestmentOpsResponse<FundManagerAssignment>> {
    return apiClient.post(`${this.BASE}/setup/funds/${fundId}/managers`, data)
  }

  // ── Setup — Brokers / Custodians ─────────────────────────────────────────────
  async listBrokers(): Promise<InvestmentOpsResponse<StakeholderProfile[]>> {
    return apiClient.get(`${this.BASE}/setup/brokers`)
  }

  async createBroker(data: { name: string; contactEmail: string }): Promise<InvestmentOpsResponse<StakeholderProfile>> {
    return apiClient.post(`${this.BASE}/setup/brokers`, data)
  }

  async listCustodians(): Promise<InvestmentOpsResponse<StakeholderProfile[]>> {
    return apiClient.get(`${this.BASE}/setup/custodians`)
  }

  async createCustodian(data: { name: string; contactEmail: string }): Promise<InvestmentOpsResponse<StakeholderProfile>> {
    return apiClient.post(`${this.BASE}/setup/custodians`, data)
  }

  // ── Setup — Commissions ──────────────────────────────────────────────────────
  async listCommissions(): Promise<InvestmentOpsResponse<CommissionRate[]>> {
    return apiClient.get(`${this.BASE}/setup/commissions`)
  }

  async createCommission(data: { stakeholderProfileId: string; rateBps: number }): Promise<InvestmentOpsResponse<CommissionRate>> {
    return apiClient.post(`${this.BASE}/setup/commissions`, data)
  }

  // ── Setup — Markets ───────────────────────────────────────────────────────────
  async listMarkets(): Promise<InvestmentOpsResponse<SetupMarket[]>> {
    return apiClient.get(`${this.BASE}/setup/markets`)
  }

  async createMarket(data: { marketCode: string; marketName: string; countryCode: string }): Promise<InvestmentOpsResponse<SetupMarket>> {
    return apiClient.post(`${this.BASE}/setup/markets`, data)
  }

  // ── Setup — Currencies ───────────────────────────────────────────────────────
  async listCurrencies(): Promise<InvestmentOpsResponse<SetupCurrency[]>> {
    return apiClient.get(`${this.BASE}/setup/currencies`)
  }

  async createCurrency(data: { code: string; name: string; symbol: string }): Promise<InvestmentOpsResponse<SetupCurrency>> {
    return apiClient.post(`${this.BASE}/setup/currencies`, data)
  }

  // ── Setup — Countries ─────────────────────────────────────────────────────────
  async listCountries(): Promise<InvestmentOpsResponse<SetupCountry[]>> {
    return apiClient.get(`${this.BASE}/setup/countries`)
  }

  async createCountry(data: { countryCode: string; countryName: string; region: string }): Promise<InvestmentOpsResponse<SetupCountry>> {
    return apiClient.post(`${this.BASE}/setup/countries`, data)
  }

  // ── Setup — Issuers ───────────────────────────────────────────────────────────
  async listIssuers(params?: { countryCode?: string }): Promise<InvestmentOpsResponse<SetupIssuer[]>> {
    const q = new URLSearchParams()
    if (params?.countryCode) q.append("countryCode", params.countryCode)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/setup/issuers${qs ? `?${qs}` : ""}`)
  }

  async createIssuer(data: { issuerCode: string; legalName: string; countryCode: string }): Promise<InvestmentOpsResponse<SetupIssuer>> {
    return apiClient.post(`${this.BASE}/setup/issuers`, data)
  }

  // ── Setup — Price Sources ─────────────────────────────────────────────────────
  async listPriceSources(): Promise<InvestmentOpsResponse<PriceSource[]>> {
    return apiClient.get(`${this.BASE}/setup/price-sources`)
  }

  // ── Setup — Settings ──────────────────────────────────────────────────────────
  async getSettings(): Promise<InvestmentOpsResponse<SetupSettings>> {
    return apiClient.get(`${this.BASE}/setup/settings`)
  }

  async updateSettings(data: SetupSettings): Promise<InvestmentOpsResponse<SetupSettings>> {
    return apiClient.put(`${this.BASE}/setup/settings`, data)
  }
}

export const investmentOpsApi = new InvestmentOpsApiService()
