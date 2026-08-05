import { apiClient } from "./api-client"
import type { Holding, PriceTick, RoutingHop, Security } from "./investments-api"
import { idempotencyHeaders } from "./investment-ops-helpers"
import type { OpsPaged } from "./investment-ops-helpers"
export {
  unwrapList,
  unwrapPaged,
  newIdempotencyKey,
  idempotencyHeaders,
  moneyAsString,
  formatMoneyDisplay,
  formatOpsError,
  qs,
} from "./investment-ops-helpers"
export type { OpsEnvelope, OpsPaged } from "./investment-ops-helpers"


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
  /** Decimal string from BE (legacy number still accepted by adapters). */
  nav: string | number
  valuationDate: string | null
  pnl: string | number
  pnlPct: string | number
  periodRealizedPnl: string | number
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
  value: string | number
  pct: string | number
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
  value: string | number
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
  nav: string | number
  pnl: string | number
  cashBalance?: string | number | null
  cashPct?: string | number | null
  securitiesValue?: string | number | null
  interestIncome?: string | number | null
  dividendIncome?: string | number | null
  marginBalance?: string | number | null
  marginUsed?: string | number | null
  startDate: string
  valuationDate: string | null
  baseCurrency: string
  portfolioManager: string
  status: string
  [key: string]: unknown
}

export interface PortfolioTransaction {
  id: string
  type?: "PURCHASE" | "SALE" | string
  transactionType?: string
  tradeRef?: string
  transactionRef?: string
  symbol: string
  quantity: string | number
  price?: string | number
  unitPrice?: string | number
  netAmount?: string | number | null
  status: string
  tradeDate: string
  journalEntryId: string | null
  realizedPnl?: string | number | null
  orderId?: string | null
  executionId?: string | null
  tradeId?: string | null
  documentId?: string | null
  valuationRunId?: string | null
  currencyCode?: string
}

export interface ExposureByExchange {
  key: string
  value: number
  pct: number
}

export interface PortfolioExposure {
  byExchange?: ExposureByExchange[]
  byCountry?: ExposureByExchange[]
  bySector?: ExposureByExchange[]
  byCurrency?: ExposureByExchange[]
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
  createdByName?: string | null
  approvedById: string | null
  approvedAt: string | null
  listedEquitySecurityId: string | null
  latestPrice?: string | number | null
  pricedAt?: string | null
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
  | "BROKER_CONFIRMATION_RECORDED"
  | "PARTIALLY_EXECUTED"
  | "EXECUTED"
  | "PENDING_SETTLEMENT"
  | "SETTLED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED"
  | "ARCHIVED"
  | string

export type BrokerConfirmationOutcome = "FILLED" | "COUNTER" | "UNABLE" | "PARTIAL"

export type BrokerConfirmationStatus = "RECORDED" | "ACCEPTED" | "REJECTED" | string

/** BA-TR-2 — external broker confirmation entity */
export interface BrokerConfirmation {
  id: string
  orderId: string
  outcome: BrokerConfirmationOutcome | string
  status?: BrokerConfirmationStatus
  quantity: string | number
  price: string | number
  currencyCode?: string | null
  brokerReference?: string | null
  tradeDate?: string | null
  valueDate?: string | null
  notes?: string | null
  attachmentFileId?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

/** BA-TR-2 accept envelope */
export type BrokerConfirmationAcceptResult = {
  order?: Order
  trade?: OpsTrade | Record<string, unknown>
  confirmation?: BrokerConfirmation
  tradeId?: string | null
  status?: string
}

/** BA-TR-4 blotter → recon handoff */
export type TradeReconciliationSummary = {
  tradeId: string
  internalMatched?: boolean
  brokerStatementMatched?: boolean
  custodianMatched?: boolean
  openExceptionIds?: string[]
  deepLink?: string
  [key: string]: unknown
}

/** BA-RC-1 trade 3-way recon */
export type TradeReconTemplate = {
  code: string
  name?: string
  side?: "BROKER" | "CUSTODIAN" | string
  [key: string]: unknown
}

export type TradeReconMatch = {
  id: string
  how?: 'AUTO' | 'MANUAL' | string
  status?: string
  symbol?: string | null
  side?: string | null
  tradeRef?: string | null
  internalQty?: string | null
  brokerQty?: string | null
  custodianQty?: string | null
  price?: string | null
  [key: string]: unknown
}

export type TradeReconBatch = {
  id: string
  fundId?: string
  fundName?: string | null
  displayLabel?: string | null
  asOfDate?: string
  status?: string
  brokerTemplateCode?: string
  custodianTemplateCode?: string
  matchedCount?: number
  exceptionCount?: number
  brokerLineCount?: number
  custodianLineCount?: number
  matches?: TradeReconMatch[]
  exceptions?: TradeReconException[]
  summary?: Record<string, unknown>
  [key: string]: unknown
}

export type TradeReconException = {
  id: string
  code?: string
  status?: string
  symbol?: string
  instrumentSymbol?: string
  side?: string
  message?: string
  internalQty?: string | number
  brokerQty?: string | number
  custodianQty?: string | number
  internalQuantity?: string | number
  brokerQuantity?: string | number
  custodianQuantity?: string | number
  tradeRef?: string | null
  tradeId?: string | null
  [key: string]: unknown
}

export type ClientAccountReconciliation = {
  fundId?: string
  breaks?: Array<Record<string, unknown>>
  [key: string]: unknown
}

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
  fundName?: string | null
  fund?: { id?: string; name?: string } | null
  instrumentId: string
  securityId: string | null
  side: "BUY" | "SELL"
  quantity: string
  filledQuantity?: string | number | null
  orderType: "MARKET" | "LIMIT" | string
  limitPrice: string | null
  executionPrice: string
  tradeCurrency: string
  settlementCurrency: string | null
  brokerProfileId: string | null
  custodianProfileId: string | null
  brokerName?: string | null
  custodianName?: string | null
  /** Settlement / cash account used for custodian authorisation (Phase 1). */
  settlementAccountId?: string | null
  settlementAccountName?: string | null
  valueDate: string | null
  tradeDate: string | null
  status: OrderStatus
  complianceStatus: "PASSED" | "BREACH" | "WARNING" | null
  notes: string | null
  tradeId: string | null
  ownerName?: string | null
  createdByName?: string | null
  createdById: string
  submittedAt: string | null
  approvedAt: string | null
  /** BA-TR-1 */
  sentToBrokerAt?: string | null
  sentToBrokerChannel?: string | null
  sentToBrokerNotes?: string | null
  createdAt: string
  updatedAt: string
  /** Optimistic concurrency — present on create/lifecycle responses. */
  version?: number
  auditVersion?: number
  instrument: Instrument
  approvals?: OrderApproval[]
  complianceResults?: OrderComplianceResult[]
  complianceRuns?: unknown[]
  /** Open broker confirmation awaiting AM accept/reject (list enrichment). */
  openBrokerConfirmation?: {
    id: string
    outcome: BrokerConfirmationOutcome | string
    status?: string
    quantity?: string | null
    price?: string | null
    currencyCode?: string | null
    brokerReference?: string | null
    recordedAt?: string | null
  } | null
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
  id?: string
  orderId?: string
  inputHash?: string
  revisionNo?: number
  estimatedJson?: Record<string, any>
  complianceJson?: {
    outcome?: string
    message?: string
    checks?: OrderComplianceCheck[]
  }
  /** Legacy flattened preview shape (older clients). */
  grossConsideration?: number
  fees?: number
  taxes?: number
  settlementAmount?: number
  portfolioWeightAfterPct?: number
  cashImpact?: number
  nav?: number
  instrumentStatus?: string
  compliancePreview?: {
    outcome: "PASSED" | "BREACH" | "WARNING" | string
    message: string
    checks: OrderComplianceCheck[]
  }
  [key: string]: any
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
  orderRef?: string | null
  orderId?: string | null
  fundId: string
  fundName?: string | null
  securityId: string
  side: "BUY" | "SELL"
  quantity: string
  filledQuantity?: string | number | null
  executionPrice: string
  executionCurrencyCode: string
  fees: string
  taxes?: string | number | null
  feesBreakdown?: Record<string, unknown> | null
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
  settlementStatus: "SETTLED" | "SETTLEMENT_FAILED" | "PENDING" | "PENDING_SETTLEMENT" | string
  grossConsideration: number | string
  netConsideration: number | string
  brokerProfileId: string | null
  custodianProfileId: string | null
  brokerId?: string | null
  custodianId?: string | null
  brokerName?: string | null
  custodianName?: string | null
  valueDate: string | null
  tradeDate?: string | null
  price?: string | number | null
}

/** Flat pre-trade compliance result from GET /compliance/results */
export interface ComplianceResultItem {
  id: string
  /** Alias some payloads use for the same row id */
  complianceResultId?: string | null
  orderId: string
  orderRef?: string | null
  fundId?: string | null
  instrumentTicker?: string | null
  side?: string | null
  ruleId?: string | null
  ruleName?: string | null
  ruleType?: string | null
  limitDisplay?: string | null
  currentDisplay?: string | null
  afterTradeDisplay?: string | null
  outcome: string
  /** SRD display label from BE (e.g. "Requires Override") */
  srdLabel?: string | null
  createdAt?: string | null
  [key: string]: unknown
}

/** POST /orders/:id/execute envelope (legacy / internal accept). Prefer BA-TR-2 accept. */
export type OrderExecuteResult = Order & {
  order?: Order
  trade?: unknown
  tradeId?: string | null
  status?: string
  filledQuantity?: string | number | null
  remainingQuantity?: string | number | null
  confirmation?: BrokerConfirmation
}

export interface OpsBlotter {
  id: string
  name?: string
  title?: string
  notes?: string | null
  status?: string
  fundId?: string | null
  orderCount?: number
  ownerName?: string | null
  createdByName?: string | null
  createdById?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface ApprovalRoute {
  id: string
  name?: string
  fundId?: string | null
  minAmount?: string | number | null
  maxAmount?: string | number | null
  requiredApprovals?: number
  isActive?: boolean
  steps?: unknown[]
  [key: string]: unknown
}

export interface FundSetupLimits {
  hardLimitEnabled?: boolean
  positiveCashRequired?: boolean
  limits?: Array<Record<string, unknown>>
  [key: string]: unknown
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

export interface PortfolioFolder {
  id: string
  fundId: string
  name: string
  path?: string
  parentId?: string | null
  sortOrder?: number
  version?: number
  isArchived?: boolean
  [key: string]: unknown
}

export interface OrderConfiguration {
  fundId: string
  settlementPolicyJson?: Record<string, unknown>
  approvalPolicyJson?: Record<string, unknown>
  routingPolicyJson?: Record<string, unknown>
  version?: number
  [key: string]: unknown
}

export interface FileUploadSession {
  uploadSessionId?: string
  fileId?: string
  status?: string
  maxBytes?: number
  allowedMimeTypes?: string[]
  [key: string]: unknown
}

export interface SetupInstrumentType {
  id: string
  typeCode: string
  displayName: string
  isActive?: boolean
  version?: number
  isArchived?: boolean
  [key: string]: unknown
}

export interface SetupTag {
  id: string
  code: string
  name: string
  isActive?: boolean
  version?: number
  isArchived?: boolean
  [key: string]: unknown
}

export interface SetupCorporateActionMapping {
  id: string
  [key: string]: unknown
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
  version?: number
  parameterSchema?: {
    type?: string
    required?: string[]
    properties?: Record<
      string,
      {
        type?: string | string[]
        description?: string
        enum?: string[]
        format?: string
      }
    >
  }
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
  costBasisMethod?: string | null
  pricingSource?: string | null
  settlementCycle?: string | null
  cutoffTime?: string | null
  cutoff?: string | null
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
  decimalPlaces?: number
  decimals?: number
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
  linkedFundId?: string | null
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
  realizedPnl?: string | number | null
  unrealizedPnl?: string | number | null
  totalPnl?: string | number | null
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

  async getPortfolioPositions(fundId: string): Promise<InvestmentOpsResponse<any>> {
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/positions`)
  }

  async getPortfolioTransactions(
    fundId: string,
    params?: { page?: number; pageSize?: number; status?: string; type?: string },
  ): Promise<InvestmentOpsResponse<PortfolioTransaction[] | InstrumentListResult>> {
    const q = new URLSearchParams()
    if (params?.page) q.append('page', String(params.page))
    if (params?.pageSize) q.append('pageSize', String(params.pageSize))
    if (params?.status) q.append('status', params.status)
    if (params?.type) q.append('type', params.type)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/transactions${qs ? `?${qs}` : ''}`)
  }

  async getPortfolioExposure(fundId: string): Promise<InvestmentOpsResponse<PortfolioExposure>> {
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/exposure`)
  }

  async recalculatePortfolio(fundId: string): Promise<InvestmentOpsResponse<FundSnapshot>> {
    return apiClient.post(`${this.BASE}/portfolios/${fundId}/recalculate`, {})
  }

  async createPortfolio(data: {
    name: string
    baseCurrencyCode: string
    description?: string
    totalAmount?: string | number
    status?: string
    valuationPolicyJson?: Record<string, unknown>
    settlementPolicyJson?: Record<string, unknown>
    approvalPolicyJson?: Record<string, unknown>
  }): Promise<InvestmentOpsResponse<OpsFund>> {
    return apiClient.post(`${this.BASE}/portfolios`, data, { headers: idempotencyHeaders() })
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

  async createInstrument(data: {
    ticker: string
    shortName: string
    fullName?: string
    instrumentTypeCode: string
    exchangeCode: string
    marketCode?: string
    countryCode?: string
    listingCurrencyCode: string
    valuationMethod?: string
    isin?: string
    sector?: string
    industry?: string
    pricingSource?: string
  }): Promise<InvestmentOpsResponse<Instrument>> {
    return apiClient.post(`${this.BASE}/instruments`, data, { headers: idempotencyHeaders() })
  }

  async submitInstrument(id: string, body: { expectedVersion?: number } = {}): Promise<InvestmentOpsResponse<Instrument>> {
    return apiClient.post(`${this.BASE}/instruments/${id}/submit`, body, { headers: idempotencyHeaders() })
  }

  async approveInstrument(id: string, body: { expectedVersion?: number } = {}): Promise<InvestmentOpsResponse<Instrument>> {
    return apiClient.post(`${this.BASE}/instruments/${id}/approve`, body, { headers: idempotencyHeaders() })
  }

  // ── Market Data — Prices & Ingest ─────────────────────────────────────────────
  async getLatestPrices(params?: {
    search?: string
    exchangeCode?: string
  }): Promise<InvestmentOpsResponse<any[]>> {
    const q = new URLSearchParams()
    if (params?.search) q.append("search", params.search)
    if (params?.exchangeCode) q.append("exchangeCode", params.exchangeCode)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/market-data/prices/latest${qs ? `?${qs}` : ""}`)
  }

  async getPriceHistory(
    securityId: string,
    params?: { from?: string; to?: string; page?: number; pageSize?: number; limit?: number },
  ): Promise<
    InvestmentOpsResponse<{
      items?: { pricedAt?: string; price?: string | number }[]
      series?: { pricedAt?: string; price?: string | number }[]
      maxRangeDays?: number
      page?: number
      pageSize?: number
      total?: number
      [key: string]: unknown
    }>
  > {
    const q = new URLSearchParams()
    if (params?.from) q.append("from", params.from)
    if (params?.to) q.append("to", params.to)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    else if (params?.limit) q.append("pageSize", String(params.limit))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/market-data/prices/${securityId}/history${qs ? `?${qs}` : ""}`)
  }

  async postManualPrice(data: {
    securityId: string
    price: string | number
    priceType?: string
  }): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/market-data/prices/manual`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async uploadPrices(data: {
    csvText: string
    sourceCode?: string
  }): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/market-data/prices/upload`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async listValidationQueue(): Promise<InvestmentOpsResponse<Record<string, unknown>[] | OpsPaged<Record<string, unknown>>>> {
    return apiClient.get(`${this.BASE}/market-data/validation-queue`)
  }

  async approveValidationTick(
    tickId: string,
    body: { reason?: string; expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/market-data/validation-queue/${tickId}/approve`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectValidationTick(
    tickId: string,
    body: { reason: string; expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/market-data/validation-queue/${tickId}/reject`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async listIngestBatches(): Promise<InvestmentOpsResponse<IngestBatch[]>> {
    return apiClient.get(`${this.BASE}/market-data/ingest/batches`)
  }

  async getIngestBatchDetail(id: string): Promise<InvestmentOpsResponse<IngestBatchDetail>> {
    return apiClient.get(`${this.BASE}/market-data/ingest/batches/${id}`)
  }

  async runMarketDataIngest(data: Record<string, unknown> = {}): Promise<InvestmentOpsResponse<IngestBatch>> {
    return apiClient.post(`${this.BASE}/market-data/ingest/run`, data, {
      headers: idempotencyHeaders(),
    })
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
    previewId: string
    inputHash: string
  }): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders`, data, { headers: idempotencyHeaders() })
  }

  async previewOrder(data: {
    fundId: string
    instrumentId: string
    side: "BUY" | "SELL"
    quantity: number | string
    orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT" | string
    limitPrice?: number | string | null
    stopPrice?: number | string | null
    executionPrice?: number | string
    tradeCurrency?: string
    settlementCurrency?: string
    tradeDate?: string
    valueDate?: string
    notes?: string
    brokerProfileId?: string | null
    custodianProfileId?: string | null
    settlementAccountId?: string | null
    approvalRouteId?: string | null
  }): Promise<InvestmentOpsResponse<OrderPreview>> {
    return apiClient.post(`${this.BASE}/orders/preview`, data, { headers: idempotencyHeaders() })
  }

  async getOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.get(`${this.BASE}/orders/${id}`)
  }

  async submitOrder(
    id: string,
    body: { expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/submit`, body, { headers: idempotencyHeaders() })
  }

  async approveOrder(
    id: string,
    body: { expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/approve`, body, { headers: idempotencyHeaders() })
  }

  async sendOrderToBroker(
    id: string,
    body: {
      expectedVersion?: number | string
      sentAt?: string
      channel?: string
      notes?: string
      venueCode?: string
      brokerProfileId?: string | null
      /** Phase-1 custodian authorisation (confirm at send). */
      custodianProfileId?: string | null
      settlementAccountId?: string | null
      valueDate?: string | null
    } = {},
  ): Promise<
    InvestmentOpsResponse<{
      order?: Order
      route?: unknown
      instruction?: {
        instructionId?: string
        status?: string
        toEmail?: string | null
        deliveryError?: string | null
        replyUrl?: string
        expiresAt?: string
      }
    } & Order>
  > {
    return apiClient.post(`${this.BASE}/orders/${id}/send-to-broker`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async listBrokerMessages(
    orderId: string,
  ): Promise<
    InvestmentOpsResponse<{
      messages: Array<{
        id: string
        direction: string
        channel: string
        kind: string
        body?: string | null
        actorLabel?: string | null
        createdAt: string
        payloadJson?: Record<string, unknown> | null
      }>
      latestInstruction: {
        id: string
        status: string
        toEmail?: string | null
        deliveryError?: string | null
        replyUrl: string
        sentAt?: string | null
        expiresAt?: string
        repliedAt?: string | null
      } | null
    }>
  > {
    return apiClient.get(`${this.BASE}/orders/${orderId}/broker-messages`)
  }

  async rejectOrder(
    id: string,
    data: { reason: string; expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/reject`, data, { headers: idempotencyHeaders() })
  }

  async cancelOrder(id: string, reason: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/cancel`, { reason })
  }

  async complianceCheckOrder(id: string): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/compliance-check`, {})
  }

  /** Creates listedEquityTrade + sets order.tradeId (A17 blotter path). */
  async executeOrder(
    id: string,
    body: {
      expectedVersion?: number | string
      quantity?: string | number
      partialFillQuantity?: string | number
      filledQuantity?: string | number
      price?: string | number
      executionPrice?: string | number
    } = {},
  ): Promise<InvestmentOpsResponse<OrderExecuteResult>> {
    return apiClient.post(`${this.BASE}/orders/${id}/execute`, body, { headers: idempotencyHeaders() })
  }

  /**
   * BA-TR-2 — record external broker confirmation (primary path; prefer over ad-hoc execute).
   */
  async recordBrokerConfirmation(
    orderId: string,
    body: {
      expectedVersion?: number | string
      outcome: BrokerConfirmationOutcome
      quantity: string | number
      price: string | number
      currencyCode?: string
      brokerReference?: string
      tradeDate?: string
      valueDate?: string
      notes?: string
      attachmentFileId?: string | null
    },
  ): Promise<InvestmentOpsResponse<BrokerConfirmation | { confirmation?: BrokerConfirmation; order?: Order }>> {
    return apiClient.post(`${this.BASE}/orders/${orderId}/broker-confirmations`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async listBrokerConfirmations(
    orderId: string,
  ): Promise<InvestmentOpsResponse<BrokerConfirmation[] | OpsPaged<BrokerConfirmation>>> {
    return apiClient.get(`${this.BASE}/orders/${orderId}/broker-confirmations`)
  }

  /** BA-TR-2 — accept confirmation → create trade on blotter. */
  async acceptBrokerConfirmation(
    orderId: string,
    confirmationId: string,
    body: { expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<BrokerConfirmationAcceptResult | OrderExecuteResult>> {
    return apiClient.post(
      `${this.BASE}/orders/${orderId}/broker-confirmations/${confirmationId}/accept`,
      body,
      { headers: idempotencyHeaders() },
    )
  }

  /** BA-TR-2 — reject confirmation / keep looking → order SENT_TO_BROKER. */
  async rejectBrokerConfirmation(
    orderId: string,
    confirmationId: string,
    body: { reason: string; expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<{ order?: Order; confirmation?: BrokerConfirmation } | Order>> {
    return apiClient.post(
      `${this.BASE}/orders/${orderId}/broker-confirmations/${confirmationId}/reject`,
      body,
      { headers: idempotencyHeaders() },
    )
  }

  /** BA-T4 — fail order (reason required). */
  async failOrder(
    id: string,
    data: { reason: string; expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/fail`, data, { headers: idempotencyHeaders() })
  }

  /** BA-T4 — archive terminal order. */
  async archiveOrder(
    id: string,
    data: { reason?: string; expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<Order>> {
    return apiClient.post(`${this.BASE}/orders/${id}/archive`, data, { headers: idempotencyHeaders() })
  }

  async listApplicableApprovalRoutes(
    orderId: string,
  ): Promise<InvestmentOpsResponse<OpsPaged<ApprovalRoute> | ApprovalRoute[]>> {
    return apiClient.get(`${this.BASE}/orders/${orderId}/applicable-approval-routes`)
  }

  // ── Trades ───────────────────────────────────────────────────────────────────
  async listTrades(params?: {
    fundId?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsTrade[] | OpsPaged<OpsTrade>>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.status) q.append("status", params.status)
    if (params?.page != null) q.append("page", String(params.page))
    if (params?.pageSize != null) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/trades${qs ? `?${qs}` : ""}`)
  }

  async getTradeDetail(id: string): Promise<InvestmentOpsResponse<OpsTrade>> {
    return apiClient.get(`${this.BASE}/trades/${id}`)
  }

  async executeTrade(id: string): Promise<InvestmentOpsResponse<OpsTrade>> {
    return apiClient.post(`${this.BASE}/trades/${id}/execute`, {}, { headers: idempotencyHeaders() })
  }

  async confirmTrade(
    id: string,
    data: { externalOrderRef?: string; expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<OpsTrade>> {
    return apiClient.post(`${this.BASE}/trades/${id}/confirm`, data, { headers: idempotencyHeaders() })
  }

  /** BA-TR-3 — custodian settlement. */
  async settleTrade(
    id: string,
    data: {
      allowDeferredAccounting?: boolean
      expectedVersion?: number | string
      settledAt?: string
      custodianReference?: string
    } = {},
  ): Promise<InvestmentOpsResponse<{ order?: Order; trade?: OpsTrade } | OpsTrade>> {
    return apiClient.post(
      `${this.BASE}/trades/${id}/settle`,
      data,
      { headers: idempotencyHeaders() },
    )
  }

  /** BA-TR-4 — blotter → recon handoff. */
  async getTradeReconciliationSummary(
    tradeId: string,
  ): Promise<InvestmentOpsResponse<TradeReconciliationSummary>> {
    return apiClient.get(`${this.BASE}/trades/${tradeId}/reconciliation-summary`)
  }

  async getTradeRoutingHops(id: string): Promise<InvestmentOpsResponse<RoutingHop[]>> {
    return apiClient.get(`${this.BASE}/trades/${id}/routing-hops`)
  }

  async confirmRoutingHop(tradeId: string, hopId: string): Promise<InvestmentOpsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE}/trades/${tradeId}/routing-hops/${hopId}/confirm`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async retryRoutingHop(tradeId: string, hopId: string): Promise<InvestmentOpsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE}/trades/${tradeId}/routing-hops/${hopId}/retry`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async cancelRoutingHop(tradeId: string, hopId: string): Promise<InvestmentOpsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE}/trades/${tradeId}/routing-hops/${hopId}/cancel`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async getSettlementDocument(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/trades/${id}/settlement-document`, { responseType: "blob" })
  }

  // ── Portfolio folders ────────────────────────────────────────────────────────
  async listPortfolioFolders(
    fundId: string,
    params?: { includeArchived?: boolean },
  ): Promise<InvestmentOpsResponse<PortfolioFolder[]>> {
    const q = new URLSearchParams()
    if (params?.includeArchived != null) q.append("includeArchived", String(params.includeArchived))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/portfolios/${fundId}/folders${qs ? `?${qs}` : ""}`)
  }

  async createPortfolioFolder(
    fundId: string,
    data: { name: string; parentId?: string | null; sortOrder?: number },
  ): Promise<InvestmentOpsResponse<PortfolioFolder>> {
    return apiClient.post(`${this.BASE}/portfolios/${fundId}/folders`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async reorderPortfolioFolders(
    fundId: string,
    data: { orderedIds: string[] } | { items: Array<{ id: string; sortOrder: number; parentId?: string | null }> },
  ): Promise<InvestmentOpsResponse<PortfolioFolder[]>> {
    return apiClient.put(`${this.BASE}/portfolios/${fundId}/folders/reorder`, data)
  }

  async getFolder(id: string): Promise<InvestmentOpsResponse<PortfolioFolder>> {
    return apiClient.get(`${this.BASE}/folders/${id}`)
  }

  async updateFolder(
    id: string,
    data: { name?: string; parentId?: string | null; sortOrder?: number; expectedVersion?: number },
  ): Promise<InvestmentOpsResponse<PortfolioFolder>> {
    return apiClient.patch(`${this.BASE}/folders/${id}`, data)
  }

  async archiveFolder(id: string, data: { expectedVersion?: number } = {}): Promise<InvestmentOpsResponse<PortfolioFolder>> {
    return apiClient.post(`${this.BASE}/folders/${id}/archive`, data, { headers: idempotencyHeaders() })
  }

  async restoreFolder(id: string, data: { expectedVersion?: number } = {}): Promise<InvestmentOpsResponse<PortfolioFolder>> {
    return apiClient.post(`${this.BASE}/folders/${id}/restore`, data, { headers: idempotencyHeaders() })
  }

  // ── Order configuration ──────────────────────────────────────────────────────
  async getOrderConfiguration(fundId: string): Promise<InvestmentOpsResponse<OrderConfiguration>> {
    return apiClient.get(`${this.BASE}/orders/configuration/${fundId}`)
  }

  async updateOrderConfiguration(
    fundId: string,
    data: Partial<OrderConfiguration> & { expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<OrderConfiguration>> {
    return apiClient.patch(`${this.BASE}/orders/configuration/${fundId}`, data)
  }

  // ── Files ────────────────────────────────────────────────────────────────────
  async createFileUploadSession(data: {
    fundId: string
    fileName: string
    mimeType: string
    byteSize: number
    checksumSha256?: string | null
  }): Promise<InvestmentOpsResponse<FileUploadSession>> {
    return apiClient.post(`${this.BASE}/files/upload-sessions`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async uploadFileContent(data: {
    uploadSessionId: string
    contentBase64: string
    checksumSha256?: string
  }): Promise<InvestmentOpsResponse<{ fileId: string; status?: string }>> {
    return apiClient.post(`${this.BASE}/files`, data, { headers: idempotencyHeaders() })
  }

  async completeFileUpload(fileId: string): Promise<InvestmentOpsResponse<{ fileId: string; status?: string }>> {
    return apiClient.post(`${this.BASE}/files/${fileId}/complete`, {}, { headers: idempotencyHeaders() })
  }

  async getFileStatus(fileId: string): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.get(`${this.BASE}/files/${fileId}/status`)
  }

  /** Convenience: session → base64 body → complete → fileId */
  async uploadBinaryFile(params: {
    fundId: string
    fileName: string
    mimeType: string
    contentBase64: string
    byteSize: number
    checksumSha256?: string | null
  }): Promise<InvestmentOpsResponse<{ fileId: string }>> {
    const session = await this.createFileUploadSession({
      fundId: params.fundId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      byteSize: params.byteSize,
      checksumSha256: params.checksumSha256 ?? null,
    })
    if (!session.success || !session.data) return session as InvestmentOpsResponse<{ fileId: string }>
    const uploadSessionId = session.data.uploadSessionId || session.data.fileId
    const uploaded = await this.uploadFileContent({
      uploadSessionId,
      contentBase64: params.contentBase64,
      checksumSha256: params.checksumSha256 ?? undefined,
    })
    if (!uploaded.success || !uploaded.data?.fileId) {
      return uploaded as InvestmentOpsResponse<{ fileId: string }>
    }
    const completed = await this.completeFileUpload(uploaded.data.fileId)
    if (!completed.success) return completed as InvestmentOpsResponse<{ fileId: string }>
    return { success: true, data: { fileId: uploaded.data.fileId } }
  }

  // ── Compliance ───────────────────────────────────────────────────────────────
  async listComplianceRules(params?: { fundId?: string }): Promise<InvestmentOpsResponse<ComplianceRule[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/compliance/rules${qs ? `?${qs}` : ""}`)
  }

  async listComplianceResults(params?: {
    fundId?: string
    orderId?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsPaged<ComplianceResultItem> | ComplianceResultItem[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.orderId) q.append("orderId", params.orderId)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/compliance/results${qs ? `?${qs}` : ""}`)
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

  async createComplianceOverride(data: {
    complianceResultId?: string
    resultId?: string
    orderId?: string
    orderRef?: string
    reasonCode?: string
    reason: string
  }): Promise<InvestmentOpsResponse<any>> {
    return apiClient.post(`${this.BASE}/compliance/overrides`, data, { headers: idempotencyHeaders() })
  }

  async listComplianceOverrides(params?: {
    fundId?: string
    orderId?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsPaged<Record<string, unknown>> | Record<string, unknown>[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.orderId) q.append("orderId", params.orderId)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/compliance/overrides${qs ? `?${qs}` : ""}`)
  }

  async approveComplianceOverride(
    id: string,
    body: { expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/compliance/overrides/${id}/approve`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectComplianceOverride(
    id: string,
    body: { reason: string; expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/compliance/overrides/${id}/reject`, body, {
      headers: idempotencyHeaders(),
    })
  }

  // ── Blotters ─────────────────────────────────────────────────────────────────
  async listBlotters(params?: {
    fundId?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsPaged<OpsBlotter> | OpsBlotter[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/blotters${qs ? `?${qs}` : ""}`)
  }

  async createBlotter(data: {
    name: string
    fundId?: string
    notes?: string
  }): Promise<InvestmentOpsResponse<OpsBlotter>> {
    return apiClient.post(`${this.BASE}/blotters`, data, { headers: idempotencyHeaders() })
  }

  async addBlotterOrder(
    blotterId: string,
    data: { orderId: string },
  ): Promise<InvestmentOpsResponse<OpsBlotter>> {
    return apiClient.post(`${this.BASE}/blotters/${blotterId}/orders`, data, {
      headers: idempotencyHeaders(),
    })
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
    linkedFundId?: string
  }): Promise<InvestmentOpsResponse<ModelPortfolio>> {
    return apiClient.post(`${this.BASE}/model-portfolios`, data, { headers: idempotencyHeaders() })
  }

  async updateModelPortfolio(
    id: string,
    data: {
      name?: string
      allocations?: Array<{ allocationType: string; allocationKey: string; targetWeightPct: number }>
      linkedFundId?: string | null
    },
  ): Promise<InvestmentOpsResponse<ModelPortfolio>> {
    return apiClient.patch(`${this.BASE}/model-portfolios/${id}`, data)
  }

  async getModelPortfolioDrift(modelId: string, fundId: string): Promise<InvestmentOpsResponse<ModelPortfolioDrift>> {
    return apiClient.get(`${this.BASE}/model-portfolios/${modelId}/drift?fundId=${fundId}`)
  }

  // ── Valuation ────────────────────────────────────────────────────────────────
  async listValuationRuns(params?: {
    fundId?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<{ items: ValuationRun[]; page: number; pageSize: number; total: number; totalPages: number } | ValuationRun[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/valuation/runs${qs ? `?${qs}` : ""}`)
  }

  async createValuationRun(data: {
    fundId: string
    costBasisMethod: string
    asOf?: string
    processNow?: boolean
  }): Promise<InvestmentOpsResponse<ValuationRun>> {
    return apiClient.post(`${this.BASE}/valuation/runs`, data)
  }

  async getValuationRun(id: string): Promise<InvestmentOpsResponse<ValuationRun>> {
    return apiClient.get(`${this.BASE}/valuation/runs/${id}`)
  }

  async listValuationExceptions(params?: { fundId?: string; status?: string }): Promise<InvestmentOpsResponse<ValuationException[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.status) q.append("status", params.status)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/valuation/exceptions${qs ? `?${qs}` : ""}`)
  }

  async getValuationRunInputs(id: string): Promise<
    InvestmentOpsResponse<{
      inputs?: unknown
      prices?: unknown[]
      fxRates?: unknown[]
      [key: string]: unknown
    }>
  > {
    return apiClient.get(`${this.BASE}/valuation/runs/${id}/inputs`)
  }

  async resolveValuationException(
    id: string,
    data: { reason?: string; note?: string; [key: string]: unknown } = {},
  ): Promise<InvestmentOpsResponse<ValuationException>> {
    return apiClient.post(`${this.BASE}/valuation/exceptions/${id}/resolve`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async overrideValuationException(
    id: string,
    data: { overrideValue?: string | number; reason?: string; [key: string]: unknown },
  ): Promise<InvestmentOpsResponse<ValuationException>> {
    return apiClient.post(`${this.BASE}/valuation/exceptions/${id}/override`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async escalateValuationException(
    id: string,
    data: { reason?: string; [key: string]: unknown } = {},
  ): Promise<InvestmentOpsResponse<ValuationException>> {
    return apiClient.post(`${this.BASE}/valuation/exceptions/${id}/escalate`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async approveValuationOverride(
    id: string,
    data: { reason?: string; expectedVersion?: number } = {},
  ): Promise<InvestmentOpsResponse<ValuationException>> {
    return apiClient.post(`${this.BASE}/valuation/exceptions/${id}/approve-override`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectValuationOverride(
    id: string,
    data: { reason: string; expectedVersion?: number },
  ): Promise<InvestmentOpsResponse<ValuationException>> {
    return apiClient.post(`${this.BASE}/valuation/exceptions/${id}/reject-override`, data, {
      headers: idempotencyHeaders(),
    })
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

  async submitJournal(
    id: string,
    data: { expectedVersion?: number } = {},
  ): Promise<InvestmentOpsResponse<JournalEntry>> {
    return apiClient.post(`${this.BASE}/accounting/journals/${id}/submit`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async postJournal(
    id: string,
    data: { expectedVersion?: number } = {},
  ): Promise<InvestmentOpsResponse<JournalEntry>> {
    return apiClient.post(`${this.BASE}/accounting/journals/${id}/post`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async approveJournal(
    id: string,
    data: { expectedVersion?: number } = {},
  ): Promise<InvestmentOpsResponse<JournalEntry>> {
    return apiClient.post(`${this.BASE}/accounting/journals/${id}/approve`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectJournal(
    id: string,
    data: { reason: string; expectedVersion?: number },
  ): Promise<InvestmentOpsResponse<JournalEntry>> {
    return apiClient.post(`${this.BASE}/accounting/journals/${id}/reject`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async listAccountingReversals(params?: {
    fundId?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsPaged<Record<string, unknown>> | Record<string, unknown>[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/accounting/reversals${qs ? `?${qs}` : ""}`)
  }

  async listLedgerExports(params?: {
    fundId?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsPaged<Record<string, unknown>> | Record<string, unknown>[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/accounting/ledger-exports${qs ? `?${qs}` : ""}`)
  }

  async createLedgerExport(data: {
    fundId: string
    from: string
    to: string
    format?: string
  }): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(
      `${this.BASE}/accounting/ledger-exports`,
      { format: "CSV", ...data },
      { headers: idempotencyHeaders() },
    )
  }

  async downloadLedgerExport(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/accounting/ledger-exports/${id}/download`, {
      responseType: "blob",
    })
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
    fileRef?: string
    fileId?: string
  }): Promise<InvestmentOpsResponse<OpsDocument>> {
    return apiClient.post(`${this.BASE}/documents`, data, { headers: idempotencyHeaders() })
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
    return apiClient.post(`${this.BASE}/reports/generate`, data, {
      headers: idempotencyHeaders(),
    })
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
      costBasisMethod?: string
      pricingSource?: string
      settlementCycle?: string
      cutoffTime?: string
      cutoff?: string
    }
  ): Promise<InvestmentOpsResponse<ListedEquityFundConfig>> {
    return apiClient.put(`${this.BASE}/setup/funds/${id}/config`, data)
  }

  async getFundLimits(fundId: string): Promise<InvestmentOpsResponse<FundSetupLimits>> {
    return apiClient.get(`${this.BASE}/setup/funds/${fundId}/limits`)
  }

  async putFundLimits(
    fundId: string,
    data: FundSetupLimits,
  ): Promise<InvestmentOpsResponse<FundSetupLimits>> {
    return apiClient.put(`${this.BASE}/setup/funds/${fundId}/limits`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async assignFundManager(fundId: string, data: { userId: string; role: string }): Promise<InvestmentOpsResponse<FundManagerAssignment>> {
    return apiClient.post(`${this.BASE}/setup/funds/${fundId}/managers`, data)
  }

  // ── Approval routes ──────────────────────────────────────────────────────────
  async listApprovalRoutes(params?: {
    fundId?: string
    page?: number
    pageSize?: number
  }): Promise<InvestmentOpsResponse<OpsPaged<ApprovalRoute> | ApprovalRoute[]>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    if (params?.page) q.append("page", String(params.page))
    if (params?.pageSize) q.append("pageSize", String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/approval-routes${qs ? `?${qs}` : ""}`)
  }

  async createApprovalRoute(data: Record<string, unknown>): Promise<InvestmentOpsResponse<ApprovalRoute>> {
    return apiClient.post(`${this.BASE}/approval-routes`, data, { headers: idempotencyHeaders() })
  }

  async updateApprovalRoute(
    id: string,
    data: Record<string, unknown>,
  ): Promise<InvestmentOpsResponse<ApprovalRoute>> {
    return apiClient.put(`${this.BASE}/approval-routes/${id}`, data)
  }

  async deleteApprovalRoute(id: string): Promise<InvestmentOpsResponse<unknown>> {
    return apiClient.delete(`${this.BASE}/approval-routes/${id}`)
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

  // ── Setup — Instrument types / tags / corporate actions ──────────────────────
  async listSetupInstrumentTypes(): Promise<InvestmentOpsResponse<SetupInstrumentType[] | OpsPaged<SetupInstrumentType>>> {
    return apiClient.get(`${this.BASE}/setup/instrument-types`)
  }

  async createSetupInstrumentType(data: {
    typeCode: string
    displayName: string
    isActive?: boolean
  }): Promise<InvestmentOpsResponse<SetupInstrumentType>> {
    return apiClient.post(`${this.BASE}/setup/instrument-types`, data, { headers: idempotencyHeaders() })
  }

  async listSetupTags(): Promise<InvestmentOpsResponse<SetupTag[] | OpsPaged<SetupTag>>> {
    return apiClient.get(`${this.BASE}/setup/tags`)
  }

  async createSetupTag(data: {
    code: string
    name: string
    isActive?: boolean
  }): Promise<InvestmentOpsResponse<SetupTag>> {
    return apiClient.post(`${this.BASE}/setup/tags`, data, { headers: idempotencyHeaders() })
  }

  async updateSetupTag(
    id: string,
    data: { name?: string; code?: string; isActive?: boolean; expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<SetupTag>> {
    return apiClient.patch(`${this.BASE}/setup/tags/${id}`, data, { headers: idempotencyHeaders() })
  }

  async listCorporateActionMappings(): Promise<
    InvestmentOpsResponse<SetupCorporateActionMapping[] | OpsPaged<SetupCorporateActionMapping>>
  > {
    return apiClient.get(`${this.BASE}/setup/corporate-action-mappings`)
  }

  async createCorporateActionMapping(
    data: Record<string, unknown>,
  ): Promise<InvestmentOpsResponse<SetupCorporateActionMapping>> {
    return apiClient.post(`${this.BASE}/setup/corporate-action-mappings`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async updateCorporateActionMapping(
    id: string,
    data: Record<string, unknown> & { expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<SetupCorporateActionMapping>> {
    return apiClient.patch(`${this.BASE}/setup/corporate-action-mappings/${id}`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async listInstrumentSubcategories(): Promise<
    InvestmentOpsResponse<Array<Record<string, unknown>> | OpsPaged<Record<string, unknown>>>
  > {
    return apiClient.get(`${this.BASE}/setup/instrument-subcategories`)
  }

  async createInstrumentSubcategory(data: {
    code?: string
    name?: string
    displayName?: string
    instrumentTypeCode?: string
    isActive?: boolean
    [key: string]: unknown
  }): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/setup/instrument-subcategories`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async updateInstrumentSubcategory(
    id: string,
    data: Record<string, unknown> & { expectedVersion?: number | string },
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.patch(`${this.BASE}/setup/instrument-subcategories/${id}`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async archiveInstrumentSubcategory(
    id: string,
    body: { expectedVersion?: number | string } = {},
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/setup/instrument-subcategories/${id}/archive`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async listCouponFrequencies(): Promise<
    InvestmentOpsResponse<Array<Record<string, unknown>> | OpsPaged<Record<string, unknown>>>
  > {
    return apiClient.get(`${this.BASE}/setup/coupon-frequencies`)
  }

  async createCouponFrequency(data: {
    code?: string
    name?: string
    displayName?: string
    periodsPerYear?: number | string
    [key: string]: unknown
  }): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/setup/coupon-frequencies`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async listSetupIcons(): Promise<
    InvestmentOpsResponse<Array<Record<string, unknown>> | OpsPaged<Record<string, unknown>>>
  > {
    return apiClient.get(`${this.BASE}/setup/icons`)
  }

  async createSetupIcon(data: {
    code?: string
    name?: string
    label?: string
    [key: string]: unknown
  }): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/setup/icons`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async updateSetupIcon(
    id: string,
    data: Record<string, unknown>,
  ): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.patch(`${this.BASE}/setup/icons/${id}`, data)
  }

  async archiveSetupIcon(id: string): Promise<InvestmentOpsResponse<Record<string, unknown>>> {
    return apiClient.post(`${this.BASE}/setup/icons/${id}/archive`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async listAccountingPostingStatus(params?: {
    fundId?: string
  }): Promise<
    InvestmentOpsResponse<{
      byStatus?: Record<string, number>
      counts?: Record<string, number>
      total?: number
      recentFailures?: Array<Record<string, unknown>>
      [key: string]: unknown
    }>
  > {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/accounting/posting-status${qs ? `?${qs}` : ""}`)
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

  // ── BA-RC-1 — Trade 3-way reconciliation ─────────────────────────────────────
  async listTradeReconTemplates(): Promise<InvestmentOpsResponse<TradeReconTemplate[]>> {
    return apiClient.get(`${this.BASE}/trade-reconciliation/templates`)
  }

  async listTradeReconBatches(params?: {
    fundId?: string
    status?: string
    limit?: number
  }): Promise<InvestmentOpsResponse<{ items: TradeReconBatch[]; total: number }>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append('fundId', params.fundId)
    if (params?.status) q.append('status', params.status)
    if (params?.limit != null) q.append('limit', String(params.limit))
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/trade-reconciliation/batches${qs ? `?${qs}` : ''}`)
  }

  async createTradeReconBatch(body: {
    fundId: string
    asOfDate: string
    brokerTemplateCode?: string
    custodianTemplateCode?: string
  }): Promise<InvestmentOpsResponse<TradeReconBatch>> {
    return apiClient.post(`${this.BASE}/trade-reconciliation/batches`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async getTradeReconBatch(id: string): Promise<InvestmentOpsResponse<TradeReconBatch>> {
    return apiClient.get(`${this.BASE}/trade-reconciliation/batches/${id}`)
  }

  async ingestTradeReconBroker(
    batchId: string,
    body: { csvText: string; templateCode?: string },
  ): Promise<InvestmentOpsResponse<TradeReconBatch>> {
    return apiClient.post(`${this.BASE}/trade-reconciliation/batches/${batchId}/ingest-broker`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async ingestTradeReconCustodian(
    batchId: string,
    body: { csvText: string; templateCode?: string },
  ): Promise<InvestmentOpsResponse<TradeReconBatch>> {
    return apiClient.post(`${this.BASE}/trade-reconciliation/batches/${batchId}/ingest-custodian`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async runTradeReconMatch(batchId: string): Promise<InvestmentOpsResponse<TradeReconBatch>> {
    return apiClient.post(`${this.BASE}/trade-reconciliation/batches/${batchId}/run-match`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async completeTradeReconBatch(batchId: string): Promise<InvestmentOpsResponse<TradeReconBatch>> {
    return apiClient.post(`${this.BASE}/trade-reconciliation/batches/${batchId}/complete`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async manualMatchTradeReconException(
    exceptionId: string,
    body: Record<string, unknown> = {},
  ): Promise<InvestmentOpsResponse<TradeReconException>> {
    return apiClient.post(
      `${this.BASE}/trade-reconciliation/exceptions/${exceptionId}/manual-match`,
      body,
      { headers: idempotencyHeaders() },
    )
  }

  async writeOffTradeReconException(
    exceptionId: string,
    body: { reason: string },
  ): Promise<InvestmentOpsResponse<TradeReconException>> {
    return apiClient.post(
      `${this.BASE}/trade-reconciliation/exceptions/${exceptionId}/write-off`,
      body,
      { headers: idempotencyHeaders() },
    )
  }

  /** BA-RC-3 — client account recon (holdings vs settled trades). */
  async getClientAccountReconciliation(params?: {
    fundId?: string
  }): Promise<InvestmentOpsResponse<ClientAccountReconciliation>> {
    const q = new URLSearchParams()
    if (params?.fundId) q.append("fundId", params.fundId)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/client-account-reconciliation${qs ? `?${qs}` : ""}`)
  }
}

export const investmentOpsApi = new InvestmentOpsApiService()
