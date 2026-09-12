/**
 * Income Tax (CIT+CGT) filing packs — backend contract: /api/tax-return-packs
 * (nvccz/src/routes/taxReturnPackRoutes.ts, TaxReturnPackController, model TaxReturnPack
 * in prisma/schema.prisma). Full compile -> reconcile -> sign-off -> GL-post -> PDF flow;
 * this file only wraps the read surface accounting-v52's Compliance & Tax page needs today.
 */
import { apiClient } from './api-client'

export interface TaxReturnPack {
  id: string
  forecastEntityId: string
  fundId: string | null
  taxYear: number
  taxPeriod: string
  taxRegime: string
  status: string
  periodStart: string
  periodEnd: string
  filingDueDate: string | null
  accountingProfit: string | null
  taxableIncome: string | null
  citLiability: string | null
  cgtLiability: string | null
  totalTaxLiability: string | null
  vatOutputTax: string | null
  vatInputTax: string | null
  vatNetPayable: string | null
  compiledById: string | null
  compiledAt: string | null
  submittedById: string | null
  approvedById: string | null
  approvedAt: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  forecastEntity?: { id: string; name: string; type: string }
  fund?: { id: string; name: string } | null
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export async function getTaxReturnPacks(params?: { forecastEntityId?: string; taxYear?: number; status?: string }): Promise<ApiRes<TaxReturnPack[]>> {
  const qs = new URLSearchParams()
  if (params?.forecastEntityId) qs.set('forecastEntityId', params.forecastEntityId)
  if (params?.taxYear) qs.set('taxYear', String(params.taxYear))
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString()
  return apiClient.get<ApiRes<TaxReturnPack[]>>(`/tax-return-packs${query ? `?${query}` : ''}`)
}

export async function createTaxReturnPack(input: {
  forecastEntityId: string
  taxYear: number
  taxPeriod: 'ANNUAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  taxRegime: 'ZIMRA_CIT' | 'ZIMRA_VAT' | 'ZIMRA_WHT' | 'ZIMRA_SAFT'
}): Promise<ApiRes<TaxReturnPack>> {
  return apiClient.post<ApiRes<TaxReturnPack>>('/tax-return-packs', input)
}

export async function compileTaxReturnPack(packId: string): Promise<ApiRes<TaxReturnPack>> {
  return apiClient.post<ApiRes<TaxReturnPack>>(`/tax-return-packs/${packId}/compile`, {})
}

/**
 * Forecast entities — backend contract: GET /api/forecast-entities (nvccz/src/routes/forecastEntityRoutes.ts).
 * Only used here to resolve a default entity for provisioning a new tax pack; the full
 * entity CRUD surface belongs to FP&A, not accounting-v52.
 */
export interface ForecastEntitySummary {
  id: string
  name: string
  isDefault: boolean
  isActive: boolean
}

export async function getForecastEntities(): Promise<ApiRes<ForecastEntitySummary[]>> {
  return apiClient.get<ApiRes<ForecastEntitySummary[]>>('/forecast-entities')
}
