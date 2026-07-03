import { apiClient } from "./api-client"

// ─── Response wrapper ────────────────────────────────────────────────────────
interface DisplayResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

// ─── Widget ───────────────────────────────────────────────────────────────────
export interface PrimaryRate {
  source: string
  label: string
  avg: string
  bid: string
  ask: string
  changePct: number | null
  format: string
}

export interface ComparisonRate {
  source: string
  avg: string
  spreadAbsolute: string
  spreadPct: number
}

export interface FxWidget {
  pair: string
  asOfDate: string
  context: string
  primary: PrimaryRate | null
  comparison: ComparisonRate | null
  meta: {
    fetchedAt: string
    stale: boolean
    configId: string
  }
}

// ─── Compare ──────────────────────────────────────────────────────────────────
export interface RateQuote {
  source: string
  from: string
  to: string
  asOfDate: string
  fetchedAt: string
  bid: string
  ask: string
  avg: string
  previousAvg: string | null
  changePct: number | null
}

export interface FxCompare {
  pair: string
  asOfDate: string
  street: RateQuote | null
  official: RateQuote | null
  spread: {
    absolute: number
    pct: number
  } | null
  meta: {
    streetStale: boolean
    officialStale: boolean
  }
}

// ─── Configs ──────────────────────────────────────────────────────────────────
export interface DisplayFormat {
  decimals: number
  showBidAsk: boolean
  showSpread: boolean
  labelTemplate: string
  showChangePct: boolean
}

export interface ExchangeRateDisplayConfig {
  id: string
  contextCode: string
  fromCurrencyCode: string
  toCurrencyCode: string
  primarySourceCode: string
  comparisonSourceCode: string
  displayFormat: DisplayFormat
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ManualQuotePayload {
  fromCurrencyCode: string
  toCurrencyCode: string
  avg: number
  bid: number
  ask: number
  asOfDate: string
}

// ─── Service class ────────────────────────────────────────────────────────────
class ExchangeRateDisplayApiService {
  private readonly BASE = "/exchange-rate-display"

  async getWidget(params: { context: string; from?: string; to?: string; asOfDate?: string }): Promise<DisplayResponse<FxWidget>> {
    const q = new URLSearchParams()
    q.append("context", params.context)
    if (params.from) q.append("from", params.from)
    if (params.to) q.append("to", params.to)
    if (params.asOfDate) q.append("asOfDate", params.asOfDate)
    return apiClient.get(`${this.BASE}/widget?${q.toString()}`)
  }

  async compareRates(params?: { from?: string; to?: string; asOfDate?: string }): Promise<DisplayResponse<FxCompare>> {
    const q = new URLSearchParams()
    if (params?.from) q.append("from", params.from)
    if (params?.to) q.append("to", params.to)
    if (params?.asOfDate) q.append("asOfDate", params.asOfDate)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/rates/compare${qs ? `?${qs}` : ""}`)
  }

  async getRateHistory(params: { source: string; from?: string; to?: string; dateFrom?: string; dateTo?: string }): Promise<DisplayResponse<RateQuote[]>> {
    const q = new URLSearchParams()
    q.append("source", params.source)
    if (params.from) q.append("from", params.from)
    if (params.to) q.append("to", params.to)
    if (params.dateFrom) q.append("dateFrom", params.dateFrom)
    if (params.dateTo) q.append("dateTo", params.dateTo)
    return apiClient.get(`${this.BASE}/rates/history?${q.toString()}`)
  }

  async listConfigs(): Promise<DisplayResponse<ExchangeRateDisplayConfig[]>> {
    return apiClient.get(`${this.BASE}/configs`)
  }

  async createConfig(data: Omit<ExchangeRateDisplayConfig, "id" | "createdAt" | "updatedAt">): Promise<DisplayResponse<ExchangeRateDisplayConfig>> {
    return apiClient.post(`${this.BASE}/configs`, data)
  }

  async updateConfig(id: string, data: Partial<ExchangeRateDisplayConfig>): Promise<DisplayResponse<ExchangeRateDisplayConfig>> {
    return apiClient.put(`${this.BASE}/configs/${id}`, data)
  }

  async runIngest(): Promise<DisplayResponse<any>> {
    return apiClient.post(`${this.BASE}/ingest/run`, {})
  }

  async postManualQuote(data: ManualQuotePayload): Promise<DisplayResponse<any>> {
    return apiClient.post(`${this.BASE}/quotes/manual`, data)
  }
}

export const exchangeRateDisplayApi = new ExchangeRateDisplayApiService()
