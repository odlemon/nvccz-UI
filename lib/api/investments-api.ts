import { apiClient } from "./api-client"

// ─── Response wrapper ────────────────────────────────────────────────────────
interface InvestmentsResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

// ─── Securities ───────────────────────────────────────────────────────────────
export interface Security {
  id: string
  symbol: string
  isin?: string | null
  exchangeCode: "ZSE" | "VFEX" | "SECZIM" | "NYSE" | "NASDAQ" | "LSE" | string
  name: string
  listingCurrencyCode: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PriceTick {
  id: string
  securityId: string
  batchId: string
  priceType: string
  price: string
  previousClose: string | null
  deviationPct: string | null
  validationStatus: "APPROVED" | "PENDING_REVIEW" | "REJECTED"
  tickFrequency: "LIVE" | "DELAYED_15M" | "EOD" | string
  fxRateUsed: string
  fxRateSource: string
  sourceStatus: "OK" | "FALLBACK"
  pricedAt: string
  reviewedById?: string | null
  reviewedAt?: string | null
  createdAt: string
}

export interface LatestPriceEntry {
  security: Security
  latestTick: PriceTick
}

export function priceChange(tick?: PriceTick | null) {
  if (!tick) return { price: null as number | null, prevClose: null as number | null, abs: null as number | null, pct: null as number | null, direction: "FLAT" as const }
  const price = Number(tick.price)
  const prevClose = tick.previousClose != null ? Number(tick.previousClose) : null
  if (prevClose == null || prevClose === 0) return { price, prevClose, abs: null, pct: null, direction: "FLAT" as const }
  const abs = price - prevClose
  const pct = (abs / prevClose) * 100
  return { price, prevClose, abs, pct, direction: abs > 0 ? "UP" as const : abs < 0 ? "DOWN" as const : "FLAT" as const }
}

// ─── Portfolio / Funds ────────────────────────────────────────────────────────
export interface Fund {
  id: string
  name: string
  base_currency: string
  nav?: number
  nav_updated_at?: string
  manager_user_id?: string
}

export interface Holding {
  id: string
  fundId: string
  securityId: string
  quantity: number
  wac: number
  wacCurrencyCode: string
  lastValuationAt?: string | null
  createdAt?: string
  updatedAt?: string
  security?: Security
  currentPrice?: number | null
  marketValue?: number | null
  unrealizedPnl?: number | null
}

// Market value if a valuation has run, else cost basis (wac * qty) as an estimate.
export function effectiveHoldingValue(h: Holding): number {
  return h.marketValue ?? h.wac * h.quantity
}

export function holdingCostBasis(h: Holding): number {
  return h.wac * h.quantity
}

export interface PortfolioPnL {
  unrealized: {
    usd: number
    zig: number
    fxRateUsed: number
    fxRateSource: string
  } | null
  realized: {
    usd: number
    zig: number
  } | null
  snapshot: {
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
}

// ─── Trades ───────────────────────────────────────────────────────────────────
export interface Trade {
  id: string
  tradeRef: string
  fundId: string
  securityId: string
  side: "BUY" | "SELL"
  quantity: string
  executionPrice: string
  executionCurrencyCode: string
  fees: string
  status:
    | "DRAFT"
    | "EXECUTED"
    | "ROUTING"
    | "SETTLED"
    | "SETTLEMENT_FAILED"
    | "CANCELLED"
  idempotencyKey?: string | null
  executedAt?: string | null
  settledAt?: string | null
  executedById?: string | null
  createdAt?: string
  updatedAt?: string
  security?: Security
  routingHops?: RoutingHop[]
}

export interface RoutingHop {
  id: string
  tradeId: string
  target: "BROKER" | "CUSTODIAN" | "CORE_BANKING" | "ACCOUNTING_GL"
  status: "STAGED" | "DISPATCHED" | "CONFIRMED" | "RETRYING" | "FAILED"
  attemptCount: number
  externalRef?: string | null
  payloadRef?: string | null
  receiptRef?: string | null
  lastError?: string | null
  nextRetryAt?: string | null
  dispatchedAt?: string | null
  confirmedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export function isSkippedInternal(hop: RoutingHop): boolean {
  return hop.externalRef === "SKIPPED_INTERNAL" || hop.payloadRef === "custodian-routing-disabled"
}

// ─── Market Data Admin ────────────────────────────────────────────────────────
export interface IngestBatch {
  batch_id: string
  source_code: string
  record_count: number
  ingest_date: string
  sha256_hash?: string
  source_status: "OK" | "FALLBACK"
  checksum_valid?: boolean
  created_at?: string
}

export interface ValidationQueueItem {
  tick_id: string
  security_id: string
  ticker: string
  exchange?: string
  proposed_price: number
  previous_close: number
  deviation_percent: number
  price_date: string
  validation_status: "PENDING_REVIEW"
}

// ─── Service class ────────────────────────────────────────────────────────────
class InvestmentsApiService {
  private readonly BASE_MARKET = "/investments/market-data"
  private readonly BASE_PORT   = "/investments/portfolio"
  private readonly BASE_TRADES = "/investments/trades"

  // ── Securities ─────────────────────────────────────────────────────────────
  async listSecurities(params?: { exchange?: string; asset_class?: string; is_tracked?: boolean }): Promise<InvestmentsResponse<Security[]>> {
    const q = new URLSearchParams()
    if (params?.exchange)    q.append("exchange", params.exchange)
    if (params?.asset_class) q.append("asset_class", params.asset_class)
    if (params?.is_tracked !== undefined) q.append("is_tracked", String(params.is_tracked))
    const qs = q.toString()
    return apiClient.get(`${this.BASE_MARKET}/securities${qs ? `?${qs}` : ""}`)
  }

  async createSecurity(data: Omit<Security, "id" | "createdAt" | "updatedAt">): Promise<InvestmentsResponse<Security>> {
    return apiClient.post(`${this.BASE_MARKET}/securities`, data)
  }

  async updateSecurity(id: string, data: Partial<Security>): Promise<InvestmentsResponse<Security>> {
    return apiClient.put(`${this.BASE_MARKET}/securities/${id}`, data)
  }

  async getLatestPrices(): Promise<InvestmentsResponse<LatestPriceEntry[]>> {
    return apiClient.get(`${this.BASE_MARKET}/prices/latest`)
  }

  async getSecurityPrices(id: string, params?: { from?: string; to?: string }): Promise<InvestmentsResponse<PriceTick[]>> {
    const q = new URLSearchParams()
    if (params?.from) q.append("from", params.from)
    if (params?.to)   q.append("to", params.to)
    const qs = q.toString()
    return apiClient.get(`${this.BASE_MARKET}/securities/${id}/prices${qs ? `?${qs}` : ""}`)
  }

  async getWatchlist(): Promise<InvestmentsResponse<Security[]>> {
    return apiClient.get(`${this.BASE_MARKET}/portfolio/watchlist`)
  }

  async updateWatchlist(securityIds: string[]): Promise<InvestmentsResponse<any>> {
    return apiClient.put(`${this.BASE_MARKET}/portfolio/watchlist`, { security_ids: securityIds })
  }

  async runIngest(sourceCode: string): Promise<InvestmentsResponse<{ records_processed: number; batch_id: string }>> {
    return apiClient.post(`${this.BASE_MARKET}/ingest/run`, { sourceCode })
  }

  async listIngestBatches(params?: { source?: string; from?: string; to?: string }): Promise<InvestmentsResponse<IngestBatch[]>> {
    const q = new URLSearchParams()
    if (params?.source) q.append("source", params.source)
    if (params?.from)   q.append("from", params.from)
    if (params?.to)     q.append("to", params.to)
    const qs = q.toString()
    return apiClient.get(`${this.BASE_MARKET}/ingest/batches${qs ? `?${qs}` : ""}`)
  }

  async getIngestBatch(id: string): Promise<InvestmentsResponse<IngestBatch>> {
    return apiClient.get(`${this.BASE_MARKET}/ingest/batches/${id}`)
  }

  async getValidationQueue(): Promise<InvestmentsResponse<ValidationQueueItem[]>> {
    return apiClient.get(`${this.BASE_MARKET}/validation-queue`)
  }

  async approveValidationTick(tickId: string): Promise<InvestmentsResponse<any>> {
    return apiClient.post(`${this.BASE_MARKET}/validation-queue/${tickId}/approve`, {})
  }

  async rejectValidationTick(tickId: string, reason: string): Promise<InvestmentsResponse<any>> {
    return apiClient.post(`${this.BASE_MARKET}/validation-queue/${tickId}/reject`, { reason })
  }

  // ── Portfolio ───────────────────────────────────────────────────────────────
  async listFunds(): Promise<InvestmentsResponse<Fund[]>> {
    return apiClient.get(`${this.BASE_PORT}/funds`)
  }

  async getFundHoldings(fundId: string): Promise<InvestmentsResponse<Holding[]>> {
    return apiClient.get(`${this.BASE_PORT}/funds/${fundId}/holdings`)
  }

  async getFundPnL(fundId: string, params?: { period?: "MTD" | "QTD" | "YTD" }): Promise<InvestmentsResponse<PortfolioPnL>> {
    const qs = params?.period ? `?period=${params.period}` : ""
    return apiClient.get(`${this.BASE_PORT}/funds/${fundId}/pnl${qs}`)
  }

  async getFundValuations(fundId: string): Promise<InvestmentsResponse<any>> {
    return apiClient.get(`${this.BASE_PORT}/funds/${fundId}/valuations`)
  }

  async runValuation(fundId: string): Promise<InvestmentsResponse<{ records_updated: number }>> {
    return apiClient.post(`${this.BASE_PORT}/funds/${fundId}/valuations/run`, {})
  }

  // ── Trades ──────────────────────────────────────────────────────────────────
  async listTrades(params?: { status?: string; fund_id?: string; page?: number; limit?: number }): Promise<InvestmentsResponse<Trade[]>> {
    const q = new URLSearchParams()
    if (params?.status)   q.append("status", params.status)
    if (params?.fund_id)  q.append("fund_id", params.fund_id)
    if (params?.page)     q.append("page", String(params.page))
    if (params?.limit)    q.append("limit", String(params.limit))
    const qs = q.toString()
    return apiClient.get(`${this.BASE_TRADES}${qs ? `?${qs}` : ""}`)
  }

  async createTrade(data: {
    fundId: string; securityId: string
    side: "BUY" | "SELL"; quantity: number
    executionPrice: number; executionCurrencyCode: string
    fees?: number
  }): Promise<InvestmentsResponse<Trade>> {
    return apiClient.post(this.BASE_TRADES, data)
  }

  async getTrade(id: string): Promise<InvestmentsResponse<Trade>> {
    return apiClient.get(`${this.BASE_TRADES}/${id}`)
  }

  async executeTrade(id: string): Promise<InvestmentsResponse<Trade>> {
    return apiClient.post(`${this.BASE_TRADES}/${id}/execute`, {})
  }

  async getRoutingHops(id: string): Promise<InvestmentsResponse<RoutingHop[]>> {
    return apiClient.get(`${this.BASE_TRADES}/${id}/routing-hops`)
  }

  async retryHop(tradeId: string, hopId: string): Promise<InvestmentsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE_TRADES}/${tradeId}/routing-hops/${hopId}/retry`, {})
  }

  async confirmHop(tradeId: string, hopId: string): Promise<InvestmentsResponse<RoutingHop>> {
    return apiClient.post(`${this.BASE_TRADES}/${tradeId}/routing-hops/${hopId}/confirm`, {})
  }

  async getSettlementDocument(id: string): Promise<InvestmentsResponse<any>> {
    return apiClient.get(`${this.BASE_TRADES}/${id}/settlement-document`)
  }
}

export const investmentsApi = new InvestmentsApiService()
