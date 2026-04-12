import { apiClient } from './api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvestmentCategory = 'Money market' | 'T-Bill' | 'Commercial Paper'
export type CompoundingMethod = 'SIMPLE' | 'COMPOUND_DAILY' | 'COMPOUND_MONTHLY'
export type DayCountConvention = 'ACTUAL_360' | 'ACTUAL_365' | 'THIRTY_360'
export type InstrumentStatus = 'ACTIVE' | 'SETTLED' | 'VOIDED'
export type PostingMode = 'DRAFT' | 'APPROVED'
export type AlertType = 'PENDING_APPROVAL' | 'CAPITAL_EROSION' | 'RATE_CHANGE'

export interface STISettings {
  id: string
  postingMode: PostingMode
  lastAccrualWatermark: string
  fiscalTimezone: string
  createdAt: string
  updatedAt: string
}

export interface UpdateSTISettingsRequest {
  postingMode?: PostingMode
  fiscalTimezone?: string
}

export interface STICurrency {
  id: string
  code: string
}

export interface STIBank {
  id: string
  name: string
  accountNumber: string
}

export interface STIInstrument {
  id: string
  name: string
  category: InvestmentCategory
  broker: string
  status: InstrumentStatus
  principal: string
  currencyId: string
  functionalCurrencyId: string | null
  compoundingMethod: CompoundingMethod
  dayCountConvention: DayCountConvention
  dayCountLocked: boolean
  settlementBankId: string
  principalGlAccountId: string
  accruedInterestGlAccountId: string
  interestIncomeGlAccountId: string
  negativeYieldExpenseGlAccountId: string
  unrealizedFxGlAccountId: string | null
  realizedFxGlAccountId: string | null
  startDate: string
  maturityDate: string
  capitalErosion: boolean
  liquidationJournalEntryId: string | null
  liquidationDate: string | null
  liquidationCashReceived: string | null
  carryingFunctionalAtSettlement: string | null
  voidedAt: string | null
  voidedById: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  currency: STICurrency
  settlementBank: STIBank
}

export interface CreateInstrumentRequest {
  name: string
  category: InvestmentCategory
  broker: string
  principal: number
  currencyId: string
  functionalCurrencyId?: string
  compoundingMethod: CompoundingMethod
  dayCountConvention: DayCountConvention
  settlementBankId: string
  principalGlAccountId: string
  accruedInterestGlAccountId: string
  interestIncomeGlAccountId: string
  negativeYieldExpenseGlAccountId: string
  unrealizedFxGlAccountId?: string
  realizedFxGlAccountId?: string
  startDate: string
  maturityDate: string
  apy: number
}

export interface UpdateInstrumentRequest {
  name?: string
  category?: string
  broker?: string
  maturityDateIso?: string
  dayCountConvention?: string
  functionalCurrencyId?: string
  unrealizedFxGlAccountId?: string
  realizedFxGlAccountId?: string
}

export interface LiquidateRequest {
  settlementIso: string
  cashReceived: number
}

export interface RateEntry {
  id: string
  instrumentId: string
  apy: string | number
  effectiveFrom: string
  effectiveTo: string | null
  createdById: string
  createdAt: string
}

export interface AccrualEntry {
  id: string
  instrumentId: string
  accrualDate: string
  amount: string
  journalEntryId: string | null
  journalStatus: string | null
  createdAt: string
}

export interface AuditTrailEntry {
  id: string
  instrumentId: string
  field: string
  oldValue: string
  newValue: string
  changedById: string
  changedAt: string
}

// Dashboard types
export interface PortfolioSummary {
  principalTotal: number
  accruedInterestTotal: number
  carryingTotal: number
}

export interface NetYield {
  accruedInterestTotal: number
  monthToDate: number
}

export interface DashboardInstrument {
  instrumentId: string
  instrumentName: string
  broker: string
  currencyCode: string
  principal: number
  accruedInterest: number
  carryingValue: number
  maturityDate: string
  projectedMaturityValueInstrumentCcy: number
  apyAsOf: number
  status: string
}

export interface DailyYield {
  accrualDate: string
  amountSum: number
}

export interface MaturityBuckets {
  within30Days: number
  days31to60: number
  days61to90: number
  over90Days: number
}

export interface SettlementVariance {
  instrumentId: string
  instrumentName: string
  settlementDate: string
  expectedSettledAmountInstrumentCcy: number
  actualSettledAmountInstrumentCcy: number
  varianceInstrumentCcy: number
}

export interface DashboardAlert {
  type: AlertType
  instrumentId: string
  instrumentName: string
  message: string
  triggeredAt: string
}

export interface STIDashboard {
  asOf: string
  portfolio: PortfolioSummary
  netYield: NetYield
  instruments: DashboardInstrument[]
  dailyYieldInMonth: DailyYield[]
  maturityBuckets: MaturityBuckets
  settlementVariance: SettlementVariance[]
  alerts: DashboardAlert[]
}

// ─── API Response wrapper ────────────────────────────────────────────────────

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Helper to extract the real error message from backend responses
function extractErrorMessage(e: any): string {
  // ApiError from api-client stores the parsed response in .response
  if (e?.response?.error) return e.response.error
  if (e?.response?.message) return e.response.message
  if (e?.message) return e.message
  return 'An unexpected error occurred'
}

export { extractErrorMessage }

// ─── API Functions ───────────────────────────────────────────────────────────

const BASE = '/accounting/short-term-investments'

// Settings
export async function getSTISettings(): Promise<ApiRes<STISettings>> {
  return apiClient.get<ApiRes<STISettings>>(`${BASE}/settings`)
}

export async function updateSTISettings(body: UpdateSTISettingsRequest): Promise<ApiRes<STISettings>> {
  return apiClient.patch<ApiRes<STISettings>>(`${BASE}/settings`, body)
}

// Dashboard
export async function getSTIDashboard(params: {
  asOfIso?: string
  broker?: string
  currencyId?: string
}): Promise<ApiRes<STIDashboard>> {
  const qs = new URLSearchParams()
  if (params.asOfIso) qs.set('asOfIso', params.asOfIso)
  if (params.broker) qs.set('broker', params.broker)
  if (params.currencyId) qs.set('currencyId', params.currencyId)
  const query = qs.toString()
  return apiClient.get<ApiRes<STIDashboard>>(`${BASE}/dashboard${query ? `?${query}` : ''}`)
}

// Instruments CRUD
export async function getInstruments(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<ApiRes<STIInstrument[]>> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.search) qs.set('search', params.search)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return apiClient.get<ApiRes<STIInstrument[]>>(`${BASE}/instruments${query ? `?${query}` : ''}`)
}

export async function getInstrument(id: string): Promise<ApiRes<STIInstrument>> {
  return apiClient.get<ApiRes<STIInstrument>>(`${BASE}/instruments/${id}`)
}

export async function createInstrument(body: CreateInstrumentRequest): Promise<ApiRes<STIInstrument>> {
  return apiClient.post<ApiRes<STIInstrument>>(`${BASE}/instruments`, body)
}

export async function updateInstrument(id: string, body: UpdateInstrumentRequest): Promise<ApiRes<STIInstrument>> {
  return apiClient.patch<ApiRes<STIInstrument>>(`${BASE}/instruments/${id}`, body)
}

export async function deleteInstrument(id: string): Promise<ApiRes<STIInstrument>> {
  return apiClient.delete<ApiRes<STIInstrument>>(`${BASE}/instruments/${id}`)
}

export async function liquidateInstrument(id: string, body: LiquidateRequest): Promise<ApiRes<STIInstrument>> {
  return apiClient.post<ApiRes<STIInstrument>>(`${BASE}/instruments/${id}/liquidate`, body)
}

export async function voidInstrument(id: string): Promise<ApiRes<STIInstrument>> {
  return apiClient.post<ApiRes<STIInstrument>>(`${BASE}/instruments/${id}/void`, {})
}

// APY Rate history
export async function getRateHistory(instrumentId: string): Promise<ApiRes<RateEntry[]>> {
  return apiClient.get<ApiRes<RateEntry[]>>(`${BASE}/instruments/${instrumentId}/apy-rates`)
}

export async function addRate(instrumentId: string, body: { effectiveFromIso: string; apy: number }): Promise<ApiRes<RateEntry>> {
  return apiClient.post<ApiRes<RateEntry>>(`${BASE}/instruments/${instrumentId}/apy-rates`, body)
}

// Accruals
export async function getAccruals(instrumentId: string): Promise<ApiRes<AccrualEntry[]>> {
  return apiClient.get<ApiRes<AccrualEntry[]>>(`${BASE}/instruments/${instrumentId}/accruals`)
}

export async function approveAccruals(instrumentId: string): Promise<ApiRes<any>> {
  return apiClient.post<ApiRes<any>>(`${BASE}/accruals/${instrumentId}/approve`, {})
}

// Audit trail
export async function getAuditTrail(instrumentId: string): Promise<ApiRes<AuditTrailEntry[]>> {
  return apiClient.get<ApiRes<AuditTrailEntry[]>>(`${BASE}/instruments/${instrumentId}/audit-trail`)
}

// Manual accrual run
export async function runAccruals(body?: { asOfIso?: string }): Promise<ApiRes<{ processed: number }>> {
  return apiClient.post<ApiRes<{ processed: number }>>(`${BASE}/run-accruals`, body || {})
}
