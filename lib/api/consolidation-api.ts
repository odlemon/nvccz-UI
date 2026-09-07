/**
 * Group Consolidation — backend contract: GET /api/accounting/consolidation/summary
 * (nvccz/src/routes/consolidationRoutes.ts, BalanceSheetController.getConsolidationSummary,
 * ConsolidatedReportService.getConsolidationSummary). Every active ForecastEntity's own GL
 * summary, plus a combined total and a manually-flagged-elimination-journal-netted
 * "consolidated" total. Today there is exactly one real ForecastEntity, so multi-entity
 * and eliminations sections are honestly empty until a second entity is created and posted to.
 */
import { apiClient } from './api-client'

export interface ConsolidationEntitySummary {
  forecastEntityId: string
  entityName: string
  entityType: string
  balanceSheet: {
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    isBalanced: boolean
  }
  incomeStatement: {
    revenue: number
    expenses: number
    netIncome: number
  }
}

export interface ConsolidationTotals {
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  revenue: number
  expenses: number
  netIncome: number
}

export interface ConsolidationSummary {
  scope: 'MULTI_ENTITY' | 'SINGLE_ENTITY'
  asOfDate: string
  period: { startDate: string; endDate: string }
  consolidationCurrencyId: string
  entities?: ConsolidationEntitySummary[]
  entity?: ConsolidationEntitySummary
  eliminations?: ConsolidationTotals
  combinedBeforeEliminations?: ConsolidationTotals
  consolidated?: ConsolidationTotals
  generatedAt: string
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export async function getConsolidationSummary(): Promise<ApiRes<ConsolidationSummary>> {
  return apiClient.get<ApiRes<ConsolidationSummary>>('/accounting/consolidation/summary')
}
