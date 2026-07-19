import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  investmentOpsApi,
  unwrapList,
  unwrapPaged,
  type DashboardSummary,
  type DashboardAllocation,
  type CurrencyExposureEntry,
  type OpsFund,
  type PortfolioOverview,
  type PortfolioTransaction,
  type PortfolioExposure,
  type InstrumentType,
  type Instrument,
  type IngestBatch,
  type IngestBatchDetail,
  type Order,
  type OrderPreview,
  type OpsTrade,
  type ComplianceRule,
  type SimulationRun,
  type SimulationScenario,
  type ModelPortfolio,
  type ModelPortfolioDrift,
  type ValuationRun,
  type ValuationException,
  type ReconciliationBatch,
  type AccountingEvent,
  type JournalEntry,
  type OpsDocument,
  type ReportTemplate,
  type GeneratedReport,
  type ReportRun,
  type SetupFund,
  type StakeholderProfile,
  type CommissionRate,
  type SetupMarket,
  type SetupCurrency,
  type SetupCountry,
  type SetupIssuer,
  type PriceSource,
  type SetupSettings,
} from "@/lib/api/investment-ops-api"
import type { Holding, RoutingHop } from "@/lib/api/investments-api"

// ─── State ────────────────────────────────────────────────────────────────────
interface InvestmentOpsState {
  selectedFundId: string | null

  // Dashboard
  dashboardSummary: DashboardSummary | null
  dashboardSummaryLoading: boolean
  dashboardAllocation: DashboardAllocation | null
  dashboardAllocationLoading: boolean
  dashboardCurrencyExposure: CurrencyExposureEntry[]
  dashboardCurrencyExposureLoading: boolean
  dashboardFunds: OpsFund[]
  dashboardFundsLoading: boolean
  recalculating: boolean

  // Portfolios
  portfolios: OpsFund[]
  portfoliosLoading: boolean
  portfolioOverview: PortfolioOverview | null
  portfolioOverviewLoading: boolean
  portfolioHoldings: Holding[]
  portfolioHoldingsLoading: boolean
  portfolioTransactions: PortfolioTransaction[]
  portfolioTransactionsLoading: boolean
  portfolioExposure: PortfolioExposure | null
  portfolioExposureLoading: boolean
  portfolioRecalculating: boolean

  // Instruments
  instrumentTypes: InstrumentType[]
  instrumentTypesLoading: boolean
  instruments: Instrument[]
  instrumentsTotal: number
  instrumentsLoading: boolean

  // Market Data — Ingest Batches
  ingestBatches: IngestBatch[]
  ingestBatchesLoading: boolean
  ingestBatchDetail: IngestBatchDetail | null
  ingestBatchDetailLoading: boolean

  // Orders
  orders: Order[]
  ordersTotal: number
  ordersLoading: boolean
  orderCreating: boolean
  orderPreview: OrderPreview | null
  orderPreviewLoading: boolean
  orderActionLoadingById: Record<string, boolean>

  // Trades
  opsTrades: OpsTrade[]
  opsTradesLoading: boolean
  opsTradeDetail: OpsTrade | null
  opsTradeDetailLoading: boolean
  tradeActionLoadingById: Record<string, boolean>
  hopActionLoadingById: Record<string, boolean>
  tradeRoutingHopsLoadingById: Record<string, boolean>

  // Compliance
  complianceRules: ComplianceRule[]
  complianceRulesLoading: boolean
  complianceRuleCreating: boolean
  complianceOverrideSubmittingByOrderId: Record<string, boolean>

  // Simulation
  simulationRun: SimulationRun | null
  simulationRunning: boolean

  // Model Portfolios
  modelPortfolios: ModelPortfolio[]
  modelPortfoliosLoading: boolean
  modelPortfolioCreating: boolean
  modelPortfolioDriftById: Record<string, ModelPortfolioDrift>
  modelPortfolioDriftLoadingById: Record<string, boolean>

  // Valuation
  valuationRuns: ValuationRun[]
  valuationRunsLoading: boolean
  valuationRunning: boolean
  valuationExceptions: ValuationException[]
  valuationExceptionsLoading: boolean

  // Reconciliation
  reconciliationBatches: ReconciliationBatch[]
  reconciliationBatchesLoading: boolean
  reconciliationRunning: boolean
  selectedReconBatch: ReconciliationBatch | null
  selectedReconBatchLoading: boolean
  reconItemResolvingById: Record<string, boolean>

  // Accounting
  accountingEvents: AccountingEvent[]
  accountingEventsTotal: number
  accountingEventsLoading: boolean
  accountingEventActionLoadingById: Record<string, boolean>
  journalEntries: JournalEntry[]
  journalEntriesLoading: boolean
  selectedJournalEntry: JournalEntry | null
  selectedJournalEntryLoading: boolean

  // Documents
  documents: OpsDocument[]
  documentsLoading: boolean
  documentCreating: boolean

  // Reports
  reportTemplates: ReportTemplate[]
  reportTemplatesLoading: boolean
  generatedReports: GeneratedReport[]
  reportGenerating: boolean
  reportRuns: ReportRun[]
  reportRunsTotal: number
  reportRunsLoading: boolean

  // Setup — Funds
  setupFunds: SetupFund[]
  setupFundsLoading: boolean
  setupFundCreating: boolean
  selectedSetupFund: SetupFund | null
  selectedSetupFundLoading: boolean
  fundConfigSaving: boolean
  fundManagerAssigning: boolean

  // Setup — Brokers / Custodians / Commissions / Markets
  brokers: StakeholderProfile[]
  brokersLoading: boolean
  brokerCreating: boolean
  custodians: StakeholderProfile[]
  custodiansLoading: boolean
  custodianCreating: boolean
  commissions: CommissionRate[]
  commissionsLoading: boolean
  commissionCreating: boolean
  markets: SetupMarket[]
  marketsLoading: boolean
  marketCreating: boolean

  // Setup — Currencies / Countries / Issuers / Price Sources / Settings
  setupCurrencies: SetupCurrency[]
  setupCurrenciesLoading: boolean
  setupCurrencyCreating: boolean
  countries: SetupCountry[]
  countriesLoading: boolean
  countryCreating: boolean
  issuers: SetupIssuer[]
  issuersLoading: boolean
  issuerCreating: boolean
  priceSources: PriceSource[]
  priceSourcesLoading: boolean
  setupSettings: SetupSettings | null
  setupSettingsLoading: boolean
  setupSettingsSaving: boolean
}

const initialState: InvestmentOpsState = {
  selectedFundId: null,

  dashboardSummary: null,
  dashboardSummaryLoading: false,
  dashboardAllocation: null,
  dashboardAllocationLoading: false,
  dashboardCurrencyExposure: [],
  dashboardCurrencyExposureLoading: false,
  dashboardFunds: [],
  dashboardFundsLoading: false,
  recalculating: false,

  portfolios: [],
  portfoliosLoading: false,
  portfolioOverview: null,
  portfolioOverviewLoading: false,
  portfolioHoldings: [],
  portfolioHoldingsLoading: false,
  portfolioTransactions: [],
  portfolioTransactionsLoading: false,
  portfolioExposure: null,
  portfolioExposureLoading: false,
  portfolioRecalculating: false,

  instrumentTypes: [],
  instrumentTypesLoading: false,
  instruments: [],
  instrumentsTotal: 0,
  instrumentsLoading: false,

  ingestBatches: [],
  ingestBatchesLoading: false,
  ingestBatchDetail: null,
  ingestBatchDetailLoading: false,

  orders: [],
  ordersTotal: 0,
  ordersLoading: false,
  orderCreating: false,
  orderPreview: null,
  orderPreviewLoading: false,
  orderActionLoadingById: {},

  opsTrades: [],
  opsTradesLoading: false,
  opsTradeDetail: null,
  opsTradeDetailLoading: false,
  tradeActionLoadingById: {},
  hopActionLoadingById: {},
  tradeRoutingHopsLoadingById: {},

  complianceRules: [],
  complianceRulesLoading: false,
  complianceRuleCreating: false,
  complianceOverrideSubmittingByOrderId: {},

  simulationRun: null,
  simulationRunning: false,

  modelPortfolios: [],
  modelPortfoliosLoading: false,
  modelPortfolioCreating: false,
  modelPortfolioDriftById: {},
  modelPortfolioDriftLoadingById: {},

  valuationRuns: [],
  valuationRunsLoading: false,
  valuationRunning: false,
  valuationExceptions: [],
  valuationExceptionsLoading: false,

  reconciliationBatches: [],
  reconciliationBatchesLoading: false,
  reconciliationRunning: false,
  selectedReconBatch: null,
  selectedReconBatchLoading: false,
  reconItemResolvingById: {},

  accountingEvents: [],
  accountingEventsTotal: 0,
  accountingEventsLoading: false,
  accountingEventActionLoadingById: {},
  journalEntries: [],
  journalEntriesLoading: false,
  selectedJournalEntry: null,
  selectedJournalEntryLoading: false,

  documents: [],
  documentsLoading: false,
  documentCreating: false,

  reportTemplates: [],
  reportTemplatesLoading: false,
  generatedReports: [],
  reportGenerating: false,
  reportRuns: [],
  reportRunsTotal: 0,
  reportRunsLoading: false,

  setupFunds: [],
  setupFundsLoading: false,
  setupFundCreating: false,
  selectedSetupFund: null,
  selectedSetupFundLoading: false,
  fundConfigSaving: false,
  fundManagerAssigning: false,

  brokers: [],
  brokersLoading: false,
  brokerCreating: false,
  custodians: [],
  custodiansLoading: false,
  custodianCreating: false,
  commissions: [],
  commissionsLoading: false,
  commissionCreating: false,
  markets: [],
  marketsLoading: false,
  marketCreating: false,

  setupCurrencies: [],
  setupCurrenciesLoading: false,
  setupCurrencyCreating: false,
  countries: [],
  countriesLoading: false,
  countryCreating: false,
  issuers: [],
  issuersLoading: false,
  issuerCreating: false,
  priceSources: [],
  priceSourcesLoading: false,
  setupSettings: null,
  setupSettingsLoading: false,
  setupSettingsSaving: false,
}

// ─── Thunks — Dashboard ─────────────────────────────────────────────────────
export const fetchDashboardSummary = createAsyncThunk(
  "investmentOps/fetchDashboardSummary",
  async (params: { period?: string; startDate?: string } = {}) => {
    const res = await investmentOpsApi.getDashboardSummary(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch dashboard summary")
    return res.data as DashboardSummary
  }
)

export const fetchDashboardAllocation = createAsyncThunk(
  "investmentOps/fetchDashboardAllocation",
  async (fundId: string) => {
    const res = await investmentOpsApi.getDashboardAllocation(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch allocation")
    return res.data as DashboardAllocation
  }
)

export const fetchDashboardCurrencyExposure = createAsyncThunk(
  "investmentOps/fetchDashboardCurrencyExposure",
  async (fundId: string) => {
    const res = await investmentOpsApi.getDashboardCurrencyExposure(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch currency exposure")
    return unwrapList(res.data)
  }
)

export const fetchDashboardFunds = createAsyncThunk(
  "investmentOps/fetchDashboardFunds",
  async () => {
    const res = await investmentOpsApi.getDashboardFunds()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch funds")
    return unwrapList(res.data)
  }
)

export const recalculateDashboard = createAsyncThunk(
  "investmentOps/recalculateDashboard",
  async (fundId: string) => {
    const res = await investmentOpsApi.recalculateDashboard(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Recalculation failed")
    return res.data
  }
)

// ─── Thunks — Portfolios ────────────────────────────────────────────────────
export const fetchPortfolios = createAsyncThunk(
  "investmentOps/fetchPortfolios",
  async () => {
    const res = await investmentOpsApi.listPortfolios()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch portfolios")
    return unwrapList(res.data)
  }
)

export const fetchPortfolioOverview = createAsyncThunk(
  "investmentOps/fetchPortfolioOverview",
  async (fundId: string) => {
    const res = await investmentOpsApi.getPortfolioOverview(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch portfolio overview")
    return res.data as PortfolioOverview
  }
)

export const fetchPortfolioHoldings = createAsyncThunk(
  "investmentOps/fetchPortfolioHoldings",
  async (fundId: string) => {
    const res = await investmentOpsApi.getPortfolioHoldings(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch holdings")
    return unwrapList(res.data)
  }
)

export const fetchPortfolioTransactions = createAsyncThunk(
  "investmentOps/fetchPortfolioTransactions",
  async (fundId: string) => {
    const res = await investmentOpsApi.getPortfolioTransactions(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch transactions")
    return unwrapList(res.data)
  }
)

export const fetchPortfolioExposure = createAsyncThunk(
  "investmentOps/fetchPortfolioExposure",
  async (fundId: string) => {
    const res = await investmentOpsApi.getPortfolioExposure(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch exposure")
    return res.data as PortfolioExposure
  }
)

export const recalculatePortfolio = createAsyncThunk(
  "investmentOps/recalculatePortfolio",
  async (fundId: string) => {
    const res = await investmentOpsApi.recalculatePortfolio(fundId)
    if (!res.success) throw new Error(res.error || res.message || "Recalculation failed")
    return res.data
  }
)

// ─── Thunks — Instruments ───────────────────────────────────────────────────
export const fetchInstrumentTypes = createAsyncThunk(
  "investmentOps/fetchInstrumentTypes",
  async () => {
    const res = await investmentOpsApi.getInstrumentTypes()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch instrument types")
    return unwrapList(res.data)
  }
)

export const fetchInstruments = createAsyncThunk(
  "investmentOps/fetchInstruments",
  async (params: { type?: string; exchange?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const res = await investmentOpsApi.listInstruments(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch instruments")
    return res.data ?? { items: [] }
  }
)

// ─── Thunks — Market Data / Ingest Batches ──────────────────────────────────
export const fetchIngestBatches = createAsyncThunk(
  "investmentOps/fetchIngestBatches",
  async () => {
    const res = await investmentOpsApi.listIngestBatches()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch ingest batches")
    return unwrapList(res.data)
  }
)

export const fetchIngestBatchDetail = createAsyncThunk(
  "investmentOps/fetchIngestBatchDetail",
  async (id: string) => {
    const res = await investmentOpsApi.getIngestBatchDetail(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch ingest batch detail")
    return res.data as IngestBatchDetail
  }
)

// ─── Thunks — Orders ─────────────────────────────────────────────────────────
export const fetchOrders = createAsyncThunk(
  "investmentOps/fetchOrders",
  async (params: { fundId?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const res = await investmentOpsApi.listOrders(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch orders")
    return res.data ?? { items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }
  }
)

export const createOrder = createAsyncThunk(
  "investmentOps/createOrder",
  async (data: Parameters<typeof investmentOpsApi.createOrder>[0]) => {
    const res = await investmentOpsApi.createOrder(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create order")
    return res.data as Order
  }
)

export const previewOrder = createAsyncThunk(
  "investmentOps/previewOrder",
  async (data: Parameters<typeof investmentOpsApi.previewOrder>[0]) => {
    const res = await investmentOpsApi.previewOrder(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to preview order")
    return res.data as OrderPreview
  }
)

export const fetchOrder = createAsyncThunk(
  "investmentOps/fetchOrder",
  async (id: string) => {
    const res = await investmentOpsApi.getOrder(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch order")
    return res.data as Order
  }
)

export const submitOrder = createAsyncThunk(
  "investmentOps/submitOrder",
  async (id: string) => {
    const res = await investmentOpsApi.submitOrder(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to submit order")
    return res.data as Order
  }
)

export const approveOrder = createAsyncThunk(
  "investmentOps/approveOrder",
  async (id: string) => {
    const res = await investmentOpsApi.approveOrder(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to approve order")
    return res.data as Order
  }
)

export const sendOrderToBroker = createAsyncThunk(
  "investmentOps/sendOrderToBroker",
  async (id: string) => {
    const res = await investmentOpsApi.sendOrderToBroker(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to send order to broker")
    return res.data as Order
  }
)

export const rejectOrder = createAsyncThunk(
  "investmentOps/rejectOrder",
  async ({ id, reason }: { id: string; reason: string }) => {
    const res = await investmentOpsApi.rejectOrder(id, reason)
    if (!res.success) throw new Error(res.error || res.message || "Failed to reject order")
    return res.data as Order
  }
)

export const cancelOrder = createAsyncThunk(
  "investmentOps/cancelOrder",
  async ({ id, reason }: { id: string; reason: string }) => {
    const res = await investmentOpsApi.cancelOrder(id, reason)
    if (!res.success) throw new Error(res.error || res.message || "Failed to cancel order")
    return res.data as Order
  }
)

export const executeOrder = createAsyncThunk(
  "investmentOps/executeOrder",
  async (id: string) => {
    const res = await investmentOpsApi.executeOrder(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to execute order")
    return res.data as Order
  }
)

// ─── Thunks — Trades ─────────────────────────────────────────────────────────
export const fetchOpsTrades = createAsyncThunk(
  "investmentOps/fetchOpsTrades",
  async (params: { fundId?: string } = {}) => {
    const res = await investmentOpsApi.listTrades(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch trades")
    return unwrapList(res.data)
  }
)

export const fetchOpsTradeDetail = createAsyncThunk(
  "investmentOps/fetchOpsTradeDetail",
  async (id: string) => {
    const res = await investmentOpsApi.getTradeDetail(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch trade detail")
    return res.data as OpsTrade
  }
)

export const executeTrade = createAsyncThunk(
  "investmentOps/executeTrade",
  async (id: string) => {
    const res = await investmentOpsApi.executeTrade(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to execute trade")
    return res.data as OpsTrade
  }
)

export const fetchTradeRoutingHops = createAsyncThunk(
  "investmentOps/fetchTradeRoutingHops",
  async (tradeId: string) => {
    const res = await investmentOpsApi.getTradeRoutingHops(tradeId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch routing hops")
    return { tradeId, hops: (res.data as RoutingHop[]) ?? [] }
  }
)

export const confirmRoutingHop = createAsyncThunk(
  "investmentOps/confirmRoutingHop",
  async ({ tradeId, hopId }: { tradeId: string; hopId: string }) => {
    const res = await investmentOpsApi.confirmRoutingHop(tradeId, hopId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to confirm routing hop")
    return { tradeId, hop: res.data as RoutingHop }
  }
)

export const retryRoutingHop = createAsyncThunk(
  "investmentOps/retryRoutingHop",
  async ({ tradeId, hopId }: { tradeId: string; hopId: string }) => {
    const res = await investmentOpsApi.retryRoutingHop(tradeId, hopId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to retry routing hop")
    return { tradeId, hop: res.data as RoutingHop }
  }
)

export const cancelRoutingHop = createAsyncThunk(
  "investmentOps/cancelRoutingHop",
  async ({ tradeId, hopId }: { tradeId: string; hopId: string }) => {
    const res = await investmentOpsApi.cancelRoutingHop(tradeId, hopId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to cancel routing hop")
    return { tradeId, hop: res.data as RoutingHop }
  }
)

function applyHopUpdate(state: InvestmentOpsState, tradeId: string, hop: RoutingHop) {
  const idx = state.opsTrades.findIndex((t) => t.id === tradeId)
  if (idx >= 0) {
    const hopIdx = state.opsTrades[idx].routingHops.findIndex((h) => h.id === hop.id)
    if (hopIdx >= 0) state.opsTrades[idx].routingHops[hopIdx] = hop
  }
  if (state.opsTradeDetail?.id === tradeId) {
    const hopIdx = state.opsTradeDetail.routingHops.findIndex((h) => h.id === hop.id)
    if (hopIdx >= 0) state.opsTradeDetail.routingHops[hopIdx] = hop
  }
}

// ─── Thunks — Compliance ────────────────────────────────────────────────────
export const fetchComplianceRules = createAsyncThunk(
  "investmentOps/fetchComplianceRules",
  async (params: { fundId?: string } = {}) => {
    const res = await investmentOpsApi.listComplianceRules(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch compliance rules")
    return unwrapList(res.data)
  }
)

export const createComplianceRule = createAsyncThunk(
  "investmentOps/createComplianceRule",
  async (data: Parameters<typeof investmentOpsApi.createComplianceRule>[0]) => {
    const res = await investmentOpsApi.createComplianceRule(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create compliance rule")
    return res.data as ComplianceRule
  }
)

export const createComplianceOverride = createAsyncThunk(
  "investmentOps/createComplianceOverride",
  async (data: { orderId: string; reason: string }) => {
    const res = await investmentOpsApi.createComplianceOverride(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to submit override request")
    return res.data
  }
)

// ─── Thunks — Simulation ────────────────────────────────────────────────────
export const runSimulation = createAsyncThunk(
  "investmentOps/runSimulation",
  async (data: { fundId: string; scenario: SimulationScenario }) => {
    const res = await investmentOpsApi.runSimulation(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to run simulation")
    return res.data as SimulationRun
  }
)

export const fetchSimulationRun = createAsyncThunk(
  "investmentOps/fetchSimulationRun",
  async (id: string) => {
    const res = await investmentOpsApi.getSimulationRun(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch simulation run")
    return res.data as SimulationRun
  }
)

// ─── Thunks — Model Portfolios ──────────────────────────────────────────────
export const fetchModelPortfolios = createAsyncThunk(
  "investmentOps/fetchModelPortfolios",
  async () => {
    const res = await investmentOpsApi.listModelPortfolios()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch model portfolios")
    return unwrapList(res.data)
  }
)

export const createModelPortfolio = createAsyncThunk(
  "investmentOps/createModelPortfolio",
  async (data: Parameters<typeof investmentOpsApi.createModelPortfolio>[0]) => {
    const res = await investmentOpsApi.createModelPortfolio(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create model portfolio")
    return res.data as ModelPortfolio
  }
)

export const fetchModelPortfolioDrift = createAsyncThunk(
  "investmentOps/fetchModelPortfolioDrift",
  async ({ modelId, fundId }: { modelId: string; fundId: string }) => {
    const res = await investmentOpsApi.getModelPortfolioDrift(modelId, fundId)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch model drift")
    return { modelId, drift: res.data as ModelPortfolioDrift }
  }
)

// ─── Thunks — Valuation ─────────────────────────────────────────────────────
export const fetchValuationRuns = createAsyncThunk(
  "investmentOps/fetchValuationRuns",
  async (params: { fundId?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const res = await investmentOpsApi.listValuationRuns(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch valuation runs")
    return unwrapList<ValuationRun>(res.data)
  }
)

export const createValuationRun = createAsyncThunk(
  "investmentOps/createValuationRun",
  async (data: { fundId: string; costBasisMethod: string; asOf?: string; processNow?: boolean }) => {
    const res = await investmentOpsApi.createValuationRun(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to run valuation")
    return res.data as ValuationRun
  }
)

export const fetchValuationExceptions = createAsyncThunk(
  "investmentOps/fetchValuationExceptions",
  async (params: { fundId?: string; status?: string } = {}) => {
    const res = await investmentOpsApi.listValuationExceptions(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch valuation exceptions")
    return unwrapList<ValuationException>(res.data)
  }
)

// ─── Thunks — Reconciliation ────────────────────────────────────────────────
export const fetchReconciliationBatches = createAsyncThunk(
  "investmentOps/fetchReconciliationBatches",
  async (params: { fundId?: string } = {}) => {
    const res = await investmentOpsApi.listReconciliationBatches(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch reconciliation batches")
    return unwrapList(res.data)
  }
)

export const runReconciliation = createAsyncThunk(
  "investmentOps/runReconciliation",
  async (data: { fundId: string; reconType: string }) => {
    const res = await investmentOpsApi.runReconciliation(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to run reconciliation")
    return res.data as ReconciliationBatch
  }
)

export const uploadReconciliation = createAsyncThunk(
  "investmentOps/uploadReconciliation",
  async (data: { fundId: string; reconType: string; csvText: string; fileName: string }) => {
    const res = await investmentOpsApi.uploadReconciliation(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to upload reconciliation file")
    return res.data as ReconciliationBatch
  }
)

export const fetchReconciliationBatchDetail = createAsyncThunk(
  "investmentOps/fetchReconciliationBatchDetail",
  async (id: string) => {
    const res = await investmentOpsApi.getReconciliationBatchDetail(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch reconciliation batch")
    return res.data as ReconciliationBatch
  }
)

export const resolveReconciliationItem = createAsyncThunk(
  "investmentOps/resolveReconciliationItem",
  async ({ id, reason }: { id: string; reason: string }) => {
    const res = await investmentOpsApi.resolveReconciliationItem(id, reason)
    if (!res.success) throw new Error(res.error || res.message || "Failed to resolve reconciliation item")
    return res.data
  }
)

// ─── Thunks — Accounting ────────────────────────────────────────────────────
export const fetchAccountingEvents = createAsyncThunk(
  "investmentOps/fetchAccountingEvents",
  async (params: { fundId?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const res = await investmentOpsApi.listAccountingEvents(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch accounting events")
    return unwrapPaged<AccountingEvent>(res.data, params.page ?? 1, params.pageSize ?? 50)
  }
)

export const reverseAccountingEvent = createAsyncThunk(
  "investmentOps/reverseAccountingEvent",
  async ({ id, reason }: { id: string; reason: string }) => {
    const res = await investmentOpsApi.reverseAccountingEvent(id, reason)
    if (!res.success) throw new Error(res.error || res.message || "Failed to reverse accounting event")
    return res.data as AccountingEvent
  }
)

export const fetchJournalEntries = createAsyncThunk(
  "investmentOps/fetchJournalEntries",
  async (params: { fundId?: string } = {}) => {
    const res = await investmentOpsApi.listJournalEntries(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch journal entries")
    return unwrapList<JournalEntry>(res.data)
  }
)

export const fetchJournalEntryDetail = createAsyncThunk(
  "investmentOps/fetchJournalEntryDetail",
  async (id: string) => {
    const res = await investmentOpsApi.getJournalEntry(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch journal entry")
    return res.data as JournalEntry
  }
)

// ─── Thunks — Documents ─────────────────────────────────────────────────────
export const fetchDocuments = createAsyncThunk(
  "investmentOps/fetchDocuments",
  async (params: { fundId?: string; documentType?: string } = {}) => {
    const res = await investmentOpsApi.listDocuments(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch documents")
    return unwrapList<OpsDocument>(res.data)
  }
)

export const createDocument = createAsyncThunk(
  "investmentOps/createDocument",
  async (data: Parameters<typeof investmentOpsApi.createDocument>[0]) => {
    const res = await investmentOpsApi.createDocument(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create document")
    return res.data as OpsDocument
  }
)

// ─── Thunks — Reports ───────────────────────────────────────────────────────
export const fetchReportTemplates = createAsyncThunk(
  "investmentOps/fetchReportTemplates",
  async () => {
    const res = await investmentOpsApi.listReportTemplates()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch report templates")
    return unwrapList(res.data)
  }
)

export const generateReport = createAsyncThunk(
  "investmentOps/generateReport",
  async (data: Parameters<typeof investmentOpsApi.generateReport>[0]) => {
    const res = await investmentOpsApi.generateReport(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to generate report")
    return res.data as GeneratedReport
  }
)

export const fetchReports = createAsyncThunk(
  "investmentOps/fetchReports",
  async (params: { fundId?: string; reportType?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const res = await investmentOpsApi.listReports(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch reports")
    return res.data ?? { items: [], page: 1, pageSize: 50, total: 0, totalPages: 1 }
  }
)

// ─── Thunks — Setup: Funds ───────────────────────────────────────────────────
export const fetchSetupFunds = createAsyncThunk(
  "investmentOps/fetchSetupFunds",
  async () => {
    const res = await investmentOpsApi.listSetupFunds()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch funds")
    return unwrapList(res.data)
  }
)

export const createSetupFund = createAsyncThunk(
  "investmentOps/createSetupFund",
  async (data: Parameters<typeof investmentOpsApi.createSetupFund>[0]) => {
    const res = await investmentOpsApi.createSetupFund(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create fund")
    return res.data as SetupFund
  }
)

export const fetchSetupFund = createAsyncThunk(
  "investmentOps/fetchSetupFund",
  async (id: string) => {
    const res = await investmentOpsApi.getSetupFund(id)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch fund")
    return res.data as SetupFund
  }
)

export const updateSetupFund = createAsyncThunk(
  "investmentOps/updateSetupFund",
  async ({ id, data }: { id: string; data: Parameters<typeof investmentOpsApi.updateSetupFund>[1] }) => {
    const res = await investmentOpsApi.updateSetupFund(id, data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to update fund")
    return res.data as SetupFund
  }
)

export const updateSetupFundConfig = createAsyncThunk(
  "investmentOps/updateSetupFundConfig",
  async ({ id, data }: { id: string; data: Parameters<typeof investmentOpsApi.updateSetupFundConfig>[1] }) => {
    const res = await investmentOpsApi.updateSetupFundConfig(id, data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to update fund config")
    return { id, config: res.data }
  }
)

export const assignFundManager = createAsyncThunk(
  "investmentOps/assignFundManager",
  async ({ fundId, data }: { fundId: string; data: { userId: string; role: string } }) => {
    const res = await investmentOpsApi.assignFundManager(fundId, data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to assign fund manager")
    return res.data
  }
)

// ─── Thunks — Setup: Brokers / Custodians / Commissions / Markets ───────────
export const fetchBrokers = createAsyncThunk(
  "investmentOps/fetchBrokers",
  async () => {
    const res = await investmentOpsApi.listBrokers()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch brokers")
    return unwrapList<StakeholderProfile>(res.data)
  }
)

export const createBroker = createAsyncThunk(
  "investmentOps/createBroker",
  async (data: Parameters<typeof investmentOpsApi.createBroker>[0]) => {
    const res = await investmentOpsApi.createBroker(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create broker")
    return res.data as StakeholderProfile
  }
)

export const fetchCustodians = createAsyncThunk(
  "investmentOps/fetchCustodians",
  async () => {
    const res = await investmentOpsApi.listCustodians()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch custodians")
    return unwrapList<StakeholderProfile>(res.data)
  }
)

export const createCustodian = createAsyncThunk(
  "investmentOps/createCustodian",
  async (data: Parameters<typeof investmentOpsApi.createCustodian>[0]) => {
    const res = await investmentOpsApi.createCustodian(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create custodian")
    return res.data as StakeholderProfile
  }
)

export const fetchCommissions = createAsyncThunk(
  "investmentOps/fetchCommissions",
  async () => {
    const res = await investmentOpsApi.listCommissions()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch commissions")
    return unwrapList<CommissionRate>(res.data)
  }
)

export const createCommission = createAsyncThunk(
  "investmentOps/createCommission",
  async (data: Parameters<typeof investmentOpsApi.createCommission>[0]) => {
    const res = await investmentOpsApi.createCommission(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create commission")
    return res.data as CommissionRate
  }
)

export const fetchMarkets = createAsyncThunk(
  "investmentOps/fetchMarkets",
  async () => {
    const res = await investmentOpsApi.listMarkets()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch markets")
    return unwrapList<SetupMarket>(res.data)
  }
)

export const createMarket = createAsyncThunk(
  "investmentOps/createMarket",
  async (data: Parameters<typeof investmentOpsApi.createMarket>[0]) => {
    const res = await investmentOpsApi.createMarket(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create market")
    return res.data as SetupMarket
  }
)

// ─── Thunks — Setup: Currencies ──────────────────────────────────────────────
export const fetchSetupCurrencies = createAsyncThunk(
  "investmentOps/fetchSetupCurrencies",
  async () => {
    const res = await investmentOpsApi.listCurrencies()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch currencies")
    return unwrapList<SetupCurrency>(res.data)
  }
)

export const createSetupCurrency = createAsyncThunk(
  "investmentOps/createSetupCurrency",
  async (data: Parameters<typeof investmentOpsApi.createCurrency>[0]) => {
    const res = await investmentOpsApi.createCurrency(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create currency")
    return res.data as SetupCurrency
  }
)

// ─── Thunks — Setup: Countries ───────────────────────────────────────────────
export const fetchCountries = createAsyncThunk(
  "investmentOps/fetchCountries",
  async () => {
    const res = await investmentOpsApi.listCountries()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch countries")
    return unwrapList<SetupCountry>(res.data)
  }
)

export const createCountry = createAsyncThunk(
  "investmentOps/createCountry",
  async (data: Parameters<typeof investmentOpsApi.createCountry>[0]) => {
    const res = await investmentOpsApi.createCountry(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create country")
    return res.data as SetupCountry
  }
)

// ─── Thunks — Setup: Issuers ─────────────────────────────────────────────────
export const fetchIssuers = createAsyncThunk(
  "investmentOps/fetchIssuers",
  async (params: { countryCode?: string } = {}) => {
    const res = await investmentOpsApi.listIssuers(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch issuers")
    return unwrapList<SetupIssuer>(res.data)
  }
)

export const createIssuer = createAsyncThunk(
  "investmentOps/createIssuer",
  async (data: Parameters<typeof investmentOpsApi.createIssuer>[0]) => {
    const res = await investmentOpsApi.createIssuer(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create issuer")
    return res.data as SetupIssuer
  }
)

// ─── Thunks — Setup: Price Sources / Settings ────────────────────────────────
export const fetchPriceSources = createAsyncThunk(
  "investmentOps/fetchPriceSources",
  async () => {
    const res = await investmentOpsApi.listPriceSources()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch price sources")
    return unwrapList<PriceSource>(res.data)
  }
)

export const fetchSetupSettings = createAsyncThunk(
  "investmentOps/fetchSetupSettings",
  async () => {
    const res = await investmentOpsApi.getSettings()
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch settings")
    const data = res.data
    // Setup stubs sometimes return `{ items: [{ id }] }` instead of a settings map.
    if (data == null) return null
    if (Array.isArray(data) || (typeof data === "object" && Array.isArray((data as { items?: unknown }).items))) {
      return null
    }
    return data as SetupSettings
  }
)

export const updateSetupSettings = createAsyncThunk(
  "investmentOps/updateSetupSettings",
  async (data: SetupSettings) => {
    const res = await investmentOpsApi.updateSettings(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to update settings")
    return res.data as SetupSettings
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────
const investmentOpsSlice = createSlice({
  name: "investmentOps",
  initialState,
  reducers: {
    setOpsSelectedFundId(state, action: PayloadAction<string | null>) {
      state.selectedFundId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => { state.dashboardSummaryLoading = true })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => { state.dashboardSummaryLoading = false; state.dashboardSummary = action.payload })
      .addCase(fetchDashboardSummary.rejected, (state) => { state.dashboardSummaryLoading = false })

      .addCase(fetchDashboardAllocation.pending, (state) => { state.dashboardAllocationLoading = true })
      .addCase(fetchDashboardAllocation.fulfilled, (state, action) => { state.dashboardAllocationLoading = false; state.dashboardAllocation = action.payload })
      .addCase(fetchDashboardAllocation.rejected, (state) => { state.dashboardAllocationLoading = false })

      .addCase(fetchDashboardCurrencyExposure.pending, (state) => { state.dashboardCurrencyExposureLoading = true })
      .addCase(fetchDashboardCurrencyExposure.fulfilled, (state, action) => { state.dashboardCurrencyExposureLoading = false; state.dashboardCurrencyExposure = action.payload })
      .addCase(fetchDashboardCurrencyExposure.rejected, (state) => { state.dashboardCurrencyExposureLoading = false })

      .addCase(fetchDashboardFunds.pending, (state) => { state.dashboardFundsLoading = true })
      .addCase(fetchDashboardFunds.fulfilled, (state, action) => {
        state.dashboardFundsLoading = false
        state.dashboardFunds = action.payload
        if (!state.selectedFundId && action.payload.length > 0) state.selectedFundId = action.payload[0].id
      })
      .addCase(fetchDashboardFunds.rejected, (state) => { state.dashboardFundsLoading = false })

      .addCase(recalculateDashboard.pending, (state) => { state.recalculating = true })
      .addCase(recalculateDashboard.fulfilled, (state) => { state.recalculating = false })
      .addCase(recalculateDashboard.rejected, (state) => { state.recalculating = false })

      .addCase(fetchPortfolios.pending, (state) => { state.portfoliosLoading = true })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.portfoliosLoading = false
        state.portfolios = action.payload
        if (!state.selectedFundId && action.payload.length > 0) state.selectedFundId = action.payload[0].id
      })
      .addCase(fetchPortfolios.rejected, (state) => { state.portfoliosLoading = false })

      .addCase(fetchPortfolioOverview.pending, (state) => { state.portfolioOverviewLoading = true })
      .addCase(fetchPortfolioOverview.fulfilled, (state, action) => { state.portfolioOverviewLoading = false; state.portfolioOverview = action.payload })
      .addCase(fetchPortfolioOverview.rejected, (state) => { state.portfolioOverviewLoading = false })

      .addCase(fetchPortfolioHoldings.pending, (state) => { state.portfolioHoldingsLoading = true })
      .addCase(fetchPortfolioHoldings.fulfilled, (state, action) => { state.portfolioHoldingsLoading = false; state.portfolioHoldings = action.payload })
      .addCase(fetchPortfolioHoldings.rejected, (state) => { state.portfolioHoldingsLoading = false })

      .addCase(fetchPortfolioTransactions.pending, (state) => { state.portfolioTransactionsLoading = true })
      .addCase(fetchPortfolioTransactions.fulfilled, (state, action) => { state.portfolioTransactionsLoading = false; state.portfolioTransactions = action.payload })
      .addCase(fetchPortfolioTransactions.rejected, (state) => { state.portfolioTransactionsLoading = false })

      .addCase(fetchPortfolioExposure.pending, (state) => { state.portfolioExposureLoading = true })
      .addCase(fetchPortfolioExposure.fulfilled, (state, action) => { state.portfolioExposureLoading = false; state.portfolioExposure = action.payload })
      .addCase(fetchPortfolioExposure.rejected, (state) => { state.portfolioExposureLoading = false })

      .addCase(recalculatePortfolio.pending, (state) => { state.portfolioRecalculating = true })
      .addCase(recalculatePortfolio.fulfilled, (state) => { state.portfolioRecalculating = false })
      .addCase(recalculatePortfolio.rejected, (state) => { state.portfolioRecalculating = false })

      .addCase(fetchInstrumentTypes.pending, (state) => { state.instrumentTypesLoading = true })
      .addCase(fetchInstrumentTypes.fulfilled, (state, action) => { state.instrumentTypesLoading = false; state.instrumentTypes = action.payload })
      .addCase(fetchInstrumentTypes.rejected, (state) => { state.instrumentTypesLoading = false })

      .addCase(fetchInstruments.pending, (state) => { state.instrumentsLoading = true })
      .addCase(fetchInstruments.fulfilled, (state, action) => {
        state.instrumentsLoading = false
        state.instruments = action.payload.items ?? []
        state.instrumentsTotal = action.payload.total ?? action.payload.items?.length ?? 0
      })
      .addCase(fetchInstruments.rejected, (state) => { state.instrumentsLoading = false })

      .addCase(fetchIngestBatches.pending, (state) => { state.ingestBatchesLoading = true })
      .addCase(fetchIngestBatches.fulfilled, (state, action) => { state.ingestBatchesLoading = false; state.ingestBatches = action.payload })
      .addCase(fetchIngestBatches.rejected, (state) => { state.ingestBatchesLoading = false })

      .addCase(fetchIngestBatchDetail.pending, (state) => { state.ingestBatchDetailLoading = true })
      .addCase(fetchIngestBatchDetail.fulfilled, (state, action) => { state.ingestBatchDetailLoading = false; state.ingestBatchDetail = action.payload })
      .addCase(fetchIngestBatchDetail.rejected, (state) => { state.ingestBatchDetailLoading = false })

      .addCase(fetchOrders.pending, (state) => { state.ordersLoading = true })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.ordersLoading = false
        state.orders = action.payload.items ?? []
        state.ordersTotal = action.payload.total ?? action.payload.items?.length ?? 0
      })
      .addCase(fetchOrders.rejected, (state) => { state.ordersLoading = false })

      .addCase(createOrder.pending, (state) => { state.orderCreating = true })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderCreating = false
        state.orders = [action.payload, ...state.orders]
        state.ordersTotal += 1
      })
      .addCase(createOrder.rejected, (state) => { state.orderCreating = false })

      .addCase(previewOrder.pending, (state) => { state.orderPreviewLoading = true })
      .addCase(previewOrder.fulfilled, (state, action) => { state.orderPreviewLoading = false; state.orderPreview = action.payload })
      .addCase(previewOrder.rejected, (state) => { state.orderPreviewLoading = false })

      .addCase(fetchOrder.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })

      // Order lifecycle transitions (submit/approve/send-to-broker/execute) — per-id loading + in-place row update.
      .addCase(submitOrder.pending, (state, action) => { state.orderActionLoadingById[action.meta.arg] = true })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.orderActionLoadingById[action.payload.id] = false
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })
      .addCase(submitOrder.rejected, (state, action) => { state.orderActionLoadingById[action.meta.arg] = false })

      .addCase(approveOrder.pending, (state, action) => { state.orderActionLoadingById[action.meta.arg] = true })
      .addCase(approveOrder.fulfilled, (state, action) => {
        state.orderActionLoadingById[action.payload.id] = false
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })
      .addCase(approveOrder.rejected, (state, action) => { state.orderActionLoadingById[action.meta.arg] = false })

      .addCase(sendOrderToBroker.pending, (state, action) => { state.orderActionLoadingById[action.meta.arg] = true })
      .addCase(sendOrderToBroker.fulfilled, (state, action) => {
        state.orderActionLoadingById[action.payload.id] = false
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })
      .addCase(sendOrderToBroker.rejected, (state, action) => { state.orderActionLoadingById[action.meta.arg] = false })

      .addCase(executeOrder.pending, (state, action) => { state.orderActionLoadingById[action.meta.arg] = true })
      .addCase(executeOrder.fulfilled, (state, action) => {
        state.orderActionLoadingById[action.payload.id] = false
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })
      .addCase(executeOrder.rejected, (state, action) => { state.orderActionLoadingById[action.meta.arg] = false })

      // reject/cancel take { id, reason } — key the loading map off meta.arg.id
      .addCase(rejectOrder.pending, (state, action) => { state.orderActionLoadingById[action.meta.arg.id] = true })
      .addCase(rejectOrder.fulfilled, (state, action) => {
        state.orderActionLoadingById[action.payload.id] = false
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })
      .addCase(rejectOrder.rejected, (state, action) => { state.orderActionLoadingById[action.meta.arg.id] = false })

      .addCase(cancelOrder.pending, (state, action) => { state.orderActionLoadingById[action.meta.arg.id] = true })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.orderActionLoadingById[action.payload.id] = false
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })
      .addCase(cancelOrder.rejected, (state, action) => { state.orderActionLoadingById[action.meta.arg.id] = false })

      .addCase(fetchOpsTrades.pending, (state) => { state.opsTradesLoading = true })
      .addCase(fetchOpsTrades.fulfilled, (state, action) => { state.opsTradesLoading = false; state.opsTrades = action.payload })
      .addCase(fetchOpsTrades.rejected, (state) => { state.opsTradesLoading = false })

      .addCase(fetchOpsTradeDetail.pending, (state) => { state.opsTradeDetailLoading = true })
      .addCase(fetchOpsTradeDetail.fulfilled, (state, action) => { state.opsTradeDetailLoading = false; state.opsTradeDetail = action.payload })
      .addCase(fetchOpsTradeDetail.rejected, (state) => { state.opsTradeDetailLoading = false })

      .addCase(executeTrade.pending, (state, action) => { state.tradeActionLoadingById[action.meta.arg] = true })
      .addCase(executeTrade.fulfilled, (state, action) => {
        state.tradeActionLoadingById[action.payload.id] = false
        const idx = state.opsTrades.findIndex((t) => t.id === action.payload.id)
        if (idx >= 0) state.opsTrades[idx] = action.payload
        if (state.opsTradeDetail?.id === action.payload.id) state.opsTradeDetail = action.payload
      })
      .addCase(executeTrade.rejected, (state, action) => { state.tradeActionLoadingById[action.meta.arg] = false })

      .addCase(fetchTradeRoutingHops.pending, (state, action) => { state.tradeRoutingHopsLoadingById[action.meta.arg] = true })
      .addCase(fetchTradeRoutingHops.fulfilled, (state, action) => {
        const { tradeId, hops } = action.payload
        state.tradeRoutingHopsLoadingById[tradeId] = false
        const idx = state.opsTrades.findIndex((t) => t.id === tradeId)
        if (idx >= 0) state.opsTrades[idx].routingHops = hops
        if (state.opsTradeDetail?.id === tradeId) state.opsTradeDetail.routingHops = hops
      })
      .addCase(fetchTradeRoutingHops.rejected, (state, action) => { state.tradeRoutingHopsLoadingById[action.meta.arg] = false })

      .addCase(confirmRoutingHop.pending, (state, action) => { state.hopActionLoadingById[action.meta.arg.hopId] = true })
      .addCase(confirmRoutingHop.fulfilled, (state, action) => {
        state.hopActionLoadingById[action.payload.hop.id] = false
        applyHopUpdate(state, action.payload.tradeId, action.payload.hop)
      })
      .addCase(confirmRoutingHop.rejected, (state, action) => { state.hopActionLoadingById[action.meta.arg.hopId] = false })

      .addCase(retryRoutingHop.pending, (state, action) => { state.hopActionLoadingById[action.meta.arg.hopId] = true })
      .addCase(retryRoutingHop.fulfilled, (state, action) => {
        state.hopActionLoadingById[action.payload.hop.id] = false
        applyHopUpdate(state, action.payload.tradeId, action.payload.hop)
      })
      .addCase(retryRoutingHop.rejected, (state, action) => { state.hopActionLoadingById[action.meta.arg.hopId] = false })

      .addCase(cancelRoutingHop.pending, (state, action) => { state.hopActionLoadingById[action.meta.arg.hopId] = true })
      .addCase(cancelRoutingHop.fulfilled, (state, action) => {
        state.hopActionLoadingById[action.payload.hop.id] = false
        applyHopUpdate(state, action.payload.tradeId, action.payload.hop)
      })
      .addCase(cancelRoutingHop.rejected, (state, action) => { state.hopActionLoadingById[action.meta.arg.hopId] = false })

      .addCase(fetchComplianceRules.pending, (state) => { state.complianceRulesLoading = true })
      .addCase(fetchComplianceRules.fulfilled, (state, action) => { state.complianceRulesLoading = false; state.complianceRules = action.payload })
      .addCase(fetchComplianceRules.rejected, (state) => { state.complianceRulesLoading = false })

      .addCase(createComplianceRule.pending, (state) => { state.complianceRuleCreating = true })
      .addCase(createComplianceRule.fulfilled, (state, action) => {
        state.complianceRuleCreating = false
        state.complianceRules = [action.payload, ...state.complianceRules]
      })
      .addCase(createComplianceRule.rejected, (state) => { state.complianceRuleCreating = false })

      .addCase(createComplianceOverride.pending, (state, action) => { state.complianceOverrideSubmittingByOrderId[action.meta.arg.orderId] = true })
      .addCase(createComplianceOverride.fulfilled, (state, action) => { state.complianceOverrideSubmittingByOrderId[action.meta.arg.orderId] = false })
      .addCase(createComplianceOverride.rejected, (state, action) => { state.complianceOverrideSubmittingByOrderId[action.meta.arg.orderId] = false })

      .addCase(runSimulation.pending, (state) => { state.simulationRunning = true })
      .addCase(runSimulation.fulfilled, (state, action) => { state.simulationRunning = false; state.simulationRun = action.payload })
      .addCase(runSimulation.rejected, (state) => { state.simulationRunning = false })

      .addCase(fetchSimulationRun.pending, (state) => { state.simulationRunning = true })
      .addCase(fetchSimulationRun.fulfilled, (state, action) => { state.simulationRunning = false; state.simulationRun = action.payload })
      .addCase(fetchSimulationRun.rejected, (state) => { state.simulationRunning = false })

      .addCase(fetchModelPortfolios.pending, (state) => { state.modelPortfoliosLoading = true })
      .addCase(fetchModelPortfolios.fulfilled, (state, action) => { state.modelPortfoliosLoading = false; state.modelPortfolios = action.payload })
      .addCase(fetchModelPortfolios.rejected, (state) => { state.modelPortfoliosLoading = false })

      .addCase(createModelPortfolio.pending, (state) => { state.modelPortfolioCreating = true })
      .addCase(createModelPortfolio.fulfilled, (state, action) => {
        state.modelPortfolioCreating = false
        state.modelPortfolios = [action.payload, ...state.modelPortfolios]
      })
      .addCase(createModelPortfolio.rejected, (state) => { state.modelPortfolioCreating = false })

      .addCase(fetchModelPortfolioDrift.pending, (state, action) => { state.modelPortfolioDriftLoadingById[action.meta.arg.modelId] = true })
      .addCase(fetchModelPortfolioDrift.fulfilled, (state, action) => {
        state.modelPortfolioDriftLoadingById[action.payload.modelId] = false
        state.modelPortfolioDriftById[action.payload.modelId] = action.payload.drift
      })
      .addCase(fetchModelPortfolioDrift.rejected, (state, action) => { state.modelPortfolioDriftLoadingById[action.meta.arg.modelId] = false })

      .addCase(fetchValuationRuns.pending, (state) => { state.valuationRunsLoading = true })
      .addCase(fetchValuationRuns.fulfilled, (state, action) => { state.valuationRunsLoading = false; state.valuationRuns = action.payload })
      .addCase(fetchValuationRuns.rejected, (state) => { state.valuationRunsLoading = false })

      .addCase(createValuationRun.pending, (state) => { state.valuationRunning = true })
      .addCase(createValuationRun.fulfilled, (state, action) => {
        state.valuationRunning = false
        state.valuationRuns = [action.payload, ...state.valuationRuns.filter((r) => r.id !== action.payload.id)]
      })
      .addCase(createValuationRun.rejected, (state) => { state.valuationRunning = false })

      .addCase(fetchValuationExceptions.pending, (state) => { state.valuationExceptionsLoading = true })
      .addCase(fetchValuationExceptions.fulfilled, (state, action) => { state.valuationExceptionsLoading = false; state.valuationExceptions = action.payload })
      .addCase(fetchValuationExceptions.rejected, (state) => { state.valuationExceptionsLoading = false })

      .addCase(fetchReconciliationBatches.pending, (state) => { state.reconciliationBatchesLoading = true })
      .addCase(fetchReconciliationBatches.fulfilled, (state, action) => { state.reconciliationBatchesLoading = false; state.reconciliationBatches = action.payload })
      .addCase(fetchReconciliationBatches.rejected, (state) => { state.reconciliationBatchesLoading = false })

      .addCase(runReconciliation.pending, (state) => { state.reconciliationRunning = true })
      .addCase(runReconciliation.fulfilled, (state, action) => {
        state.reconciliationRunning = false
        state.selectedReconBatch = action.payload
        state.reconciliationBatches = [action.payload, ...state.reconciliationBatches]
      })
      .addCase(runReconciliation.rejected, (state) => { state.reconciliationRunning = false })

      .addCase(uploadReconciliation.pending, (state) => { state.reconciliationRunning = true })
      .addCase(uploadReconciliation.fulfilled, (state, action) => {
        state.reconciliationRunning = false
        state.selectedReconBatch = action.payload
        state.reconciliationBatches = [action.payload, ...state.reconciliationBatches]
      })
      .addCase(uploadReconciliation.rejected, (state) => { state.reconciliationRunning = false })

      .addCase(fetchReconciliationBatchDetail.pending, (state) => { state.selectedReconBatchLoading = true })
      .addCase(fetchReconciliationBatchDetail.fulfilled, (state, action) => { state.selectedReconBatchLoading = false; state.selectedReconBatch = action.payload })
      .addCase(fetchReconciliationBatchDetail.rejected, (state) => { state.selectedReconBatchLoading = false })

      .addCase(resolveReconciliationItem.pending, (state, action) => { state.reconItemResolvingById[action.meta.arg.id] = true })
      .addCase(resolveReconciliationItem.fulfilled, (state, action) => {
        state.reconItemResolvingById[action.meta.arg.id] = false
        const item = action.payload
        if (item && state.selectedReconBatch?.items) {
          const idx = state.selectedReconBatch.items.findIndex((i) => i.id === item.id)
          if (idx >= 0) state.selectedReconBatch.items[idx] = item
        }
      })
      .addCase(resolveReconciliationItem.rejected, (state, action) => { state.reconItemResolvingById[action.meta.arg.id] = false })

      .addCase(fetchAccountingEvents.pending, (state) => { state.accountingEventsLoading = true })
      .addCase(fetchAccountingEvents.fulfilled, (state, action) => {
        state.accountingEventsLoading = false
        state.accountingEvents = action.payload.items ?? []
        state.accountingEventsTotal = action.payload.total ?? action.payload.items?.length ?? 0
      })
      .addCase(fetchAccountingEvents.rejected, (state) => { state.accountingEventsLoading = false })

      .addCase(reverseAccountingEvent.pending, (state, action) => { state.accountingEventActionLoadingById[action.meta.arg.id] = true })
      .addCase(reverseAccountingEvent.fulfilled, (state, action) => {
        state.accountingEventActionLoadingById[action.payload.id] = false
        const idx = state.accountingEvents.findIndex((e) => e.id === action.payload.id)
        if (idx >= 0) state.accountingEvents[idx] = action.payload
      })
      .addCase(reverseAccountingEvent.rejected, (state, action) => { state.accountingEventActionLoadingById[action.meta.arg.id] = false })

      .addCase(fetchJournalEntries.pending, (state) => { state.journalEntriesLoading = true })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => { state.journalEntriesLoading = false; state.journalEntries = action.payload })
      .addCase(fetchJournalEntries.rejected, (state) => { state.journalEntriesLoading = false })

      .addCase(fetchJournalEntryDetail.pending, (state) => { state.selectedJournalEntryLoading = true })
      .addCase(fetchJournalEntryDetail.fulfilled, (state, action) => {
        state.selectedJournalEntryLoading = false
        state.selectedJournalEntry = action.payload
        const idx = state.journalEntries.findIndex((j) => j.id === action.payload.id)
        if (idx >= 0) state.journalEntries[idx] = action.payload
      })
      .addCase(fetchJournalEntryDetail.rejected, (state) => { state.selectedJournalEntryLoading = false })

      .addCase(fetchDocuments.pending, (state) => { state.documentsLoading = true })
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.documentsLoading = false; state.documents = action.payload })
      .addCase(fetchDocuments.rejected, (state) => { state.documentsLoading = false })

      .addCase(createDocument.pending, (state) => { state.documentCreating = true })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documentCreating = false
        state.documents = [action.payload, ...state.documents]
      })
      .addCase(createDocument.rejected, (state) => { state.documentCreating = false })

      .addCase(fetchReportTemplates.pending, (state) => { state.reportTemplatesLoading = true })
      .addCase(fetchReportTemplates.fulfilled, (state, action) => { state.reportTemplatesLoading = false; state.reportTemplates = action.payload })
      .addCase(fetchReportTemplates.rejected, (state) => { state.reportTemplatesLoading = false })

      .addCase(generateReport.pending, (state) => { state.reportGenerating = true })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.reportGenerating = false
        state.generatedReports = [action.payload, ...state.generatedReports]
      })
      .addCase(generateReport.rejected, (state) => { state.reportGenerating = false })

      .addCase(fetchReports.pending, (state) => { state.reportRunsLoading = true })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reportRunsLoading = false
        state.reportRuns = action.payload.items ?? []
        state.reportRunsTotal = action.payload.total ?? action.payload.items?.length ?? 0
      })
      .addCase(fetchReports.rejected, (state) => { state.reportRunsLoading = false })

      .addCase(fetchSetupFunds.pending, (state) => { state.setupFundsLoading = true })
      .addCase(fetchSetupFunds.fulfilled, (state, action) => { state.setupFundsLoading = false; state.setupFunds = action.payload })
      .addCase(fetchSetupFunds.rejected, (state) => { state.setupFundsLoading = false })

      .addCase(createSetupFund.pending, (state) => { state.setupFundCreating = true })
      .addCase(createSetupFund.fulfilled, (state, action) => {
        state.setupFundCreating = false
        state.setupFunds = [action.payload, ...state.setupFunds]
      })
      .addCase(createSetupFund.rejected, (state) => { state.setupFundCreating = false })

      .addCase(fetchSetupFund.pending, (state) => { state.selectedSetupFundLoading = true })
      .addCase(fetchSetupFund.fulfilled, (state, action) => {
        state.selectedSetupFundLoading = false
        state.selectedSetupFund = action.payload
        const idx = state.setupFunds.findIndex((f) => f.id === action.payload.id)
        if (idx >= 0) state.setupFunds[idx] = action.payload
      })
      .addCase(fetchSetupFund.rejected, (state) => { state.selectedSetupFundLoading = false })

      .addCase(updateSetupFund.fulfilled, (state, action) => {
        const idx = state.setupFunds.findIndex((f) => f.id === action.payload.id)
        if (idx >= 0) state.setupFunds[idx] = action.payload
        if (state.selectedSetupFund?.id === action.payload.id) state.selectedSetupFund = action.payload
      })

      .addCase(updateSetupFundConfig.pending, (state) => { state.fundConfigSaving = true })
      .addCase(updateSetupFundConfig.fulfilled, (state, action) => {
        state.fundConfigSaving = false
        const { id, config } = action.payload
        if (state.selectedSetupFund?.id === id) state.selectedSetupFund.listedEquityFundConfig = config
        const idx = state.setupFunds.findIndex((f) => f.id === id)
        if (idx >= 0) state.setupFunds[idx].listedEquityFundConfig = config
      })
      .addCase(updateSetupFundConfig.rejected, (state) => { state.fundConfigSaving = false })

      .addCase(assignFundManager.pending, (state) => { state.fundManagerAssigning = true })
      .addCase(assignFundManager.fulfilled, (state) => { state.fundManagerAssigning = false })
      .addCase(assignFundManager.rejected, (state) => { state.fundManagerAssigning = false })

      .addCase(fetchBrokers.pending, (state) => { state.brokersLoading = true })
      .addCase(fetchBrokers.fulfilled, (state, action) => { state.brokersLoading = false; state.brokers = action.payload })
      .addCase(fetchBrokers.rejected, (state) => { state.brokersLoading = false })

      .addCase(createBroker.pending, (state) => { state.brokerCreating = true })
      .addCase(createBroker.fulfilled, (state, action) => {
        state.brokerCreating = false
        state.brokers = [action.payload, ...state.brokers]
      })
      .addCase(createBroker.rejected, (state) => { state.brokerCreating = false })

      .addCase(fetchCustodians.pending, (state) => { state.custodiansLoading = true })
      .addCase(fetchCustodians.fulfilled, (state, action) => { state.custodiansLoading = false; state.custodians = action.payload })
      .addCase(fetchCustodians.rejected, (state) => { state.custodiansLoading = false })

      .addCase(createCustodian.pending, (state) => { state.custodianCreating = true })
      .addCase(createCustodian.fulfilled, (state, action) => {
        state.custodianCreating = false
        state.custodians = [action.payload, ...state.custodians]
      })
      .addCase(createCustodian.rejected, (state) => { state.custodianCreating = false })

      .addCase(fetchCommissions.pending, (state) => { state.commissionsLoading = true })
      .addCase(fetchCommissions.fulfilled, (state, action) => { state.commissionsLoading = false; state.commissions = action.payload })
      .addCase(fetchCommissions.rejected, (state) => { state.commissionsLoading = false })

      .addCase(createCommission.pending, (state) => { state.commissionCreating = true })
      .addCase(createCommission.fulfilled, (state, action) => {
        state.commissionCreating = false
        state.commissions = [action.payload, ...state.commissions]
      })
      .addCase(createCommission.rejected, (state) => { state.commissionCreating = false })

      .addCase(fetchMarkets.pending, (state) => { state.marketsLoading = true })
      .addCase(fetchMarkets.fulfilled, (state, action) => { state.marketsLoading = false; state.markets = action.payload })
      .addCase(fetchMarkets.rejected, (state) => { state.marketsLoading = false })

      .addCase(createMarket.pending, (state) => { state.marketCreating = true })
      .addCase(createMarket.fulfilled, (state, action) => {
        state.marketCreating = false
        state.markets = [action.payload, ...state.markets]
      })
      .addCase(createMarket.rejected, (state) => { state.marketCreating = false })

      .addCase(fetchSetupCurrencies.pending, (state) => { state.setupCurrenciesLoading = true })
      .addCase(fetchSetupCurrencies.fulfilled, (state, action) => { state.setupCurrenciesLoading = false; state.setupCurrencies = action.payload })
      .addCase(fetchSetupCurrencies.rejected, (state) => { state.setupCurrenciesLoading = false })

      .addCase(createSetupCurrency.pending, (state) => { state.setupCurrencyCreating = true })
      .addCase(createSetupCurrency.fulfilled, (state, action) => {
        state.setupCurrencyCreating = false
        state.setupCurrencies = [action.payload, ...state.setupCurrencies]
      })
      .addCase(createSetupCurrency.rejected, (state) => { state.setupCurrencyCreating = false })

      .addCase(fetchCountries.pending, (state) => { state.countriesLoading = true })
      .addCase(fetchCountries.fulfilled, (state, action) => { state.countriesLoading = false; state.countries = action.payload })
      .addCase(fetchCountries.rejected, (state) => { state.countriesLoading = false })

      .addCase(createCountry.pending, (state) => { state.countryCreating = true })
      .addCase(createCountry.fulfilled, (state, action) => {
        state.countryCreating = false
        state.countries = [action.payload, ...state.countries]
      })
      .addCase(createCountry.rejected, (state) => { state.countryCreating = false })

      .addCase(fetchIssuers.pending, (state) => { state.issuersLoading = true })
      .addCase(fetchIssuers.fulfilled, (state, action) => { state.issuersLoading = false; state.issuers = action.payload })
      .addCase(fetchIssuers.rejected, (state) => { state.issuersLoading = false })

      .addCase(createIssuer.pending, (state) => { state.issuerCreating = true })
      .addCase(createIssuer.fulfilled, (state, action) => {
        state.issuerCreating = false
        state.issuers = [action.payload, ...state.issuers]
      })
      .addCase(createIssuer.rejected, (state) => { state.issuerCreating = false })

      .addCase(fetchPriceSources.pending, (state) => { state.priceSourcesLoading = true })
      .addCase(fetchPriceSources.fulfilled, (state, action) => { state.priceSourcesLoading = false; state.priceSources = action.payload })
      .addCase(fetchPriceSources.rejected, (state) => { state.priceSourcesLoading = false })

      .addCase(fetchSetupSettings.pending, (state) => { state.setupSettingsLoading = true })
      .addCase(fetchSetupSettings.fulfilled, (state, action) => { state.setupSettingsLoading = false; state.setupSettings = action.payload })
      .addCase(fetchSetupSettings.rejected, (state) => { state.setupSettingsLoading = false })

      .addCase(updateSetupSettings.pending, (state) => { state.setupSettingsSaving = true })
      .addCase(updateSetupSettings.fulfilled, (state, action) => { state.setupSettingsSaving = false; state.setupSettings = action.payload })
      .addCase(updateSetupSettings.rejected, (state) => { state.setupSettingsSaving = false })
  },
})

export const { setOpsSelectedFundId } = investmentOpsSlice.actions
export default investmentOpsSlice.reducer
