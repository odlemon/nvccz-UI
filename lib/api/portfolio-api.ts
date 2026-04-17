import { apiClient, ApiResponse } from './api-client'

export interface PortfolioFinancialReport {
  id: string
  portfolioCompanyId: string
  submittedById?: string | null
  reportType:
    | 'BALANCE_SHEET'
    | 'INCOME_STATEMENT'
    | 'CASHFLOW_STATEMENT'
    | 'INCOME_STATEMENTS'
    | 'CASHFLOW_STATEMENTS'
    | 'STATEMENT_OF_FINANCIAL_POSITION'
    | 'BUSINESS_PLAN'
    | 'OPERATIONAL_KPIS'
  periodType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  periodStart: string
  periodEnd: string
  reportingPeriod?: string | null
  title: string
  description?: string | null
  reportUrl?: string | null
  fileUrl?: string | null
  templateVersion?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  reviewerId: string | null
  reviewedAt: string | null
  reviewerComment: string | null
  createdAt: string
  updatedAt: string
  submittedByFirstName?: string | null
  submittedByLastName?: string | null
  totalRevenue?: number | null
  netProfit?: number | null
  cashFlowNet?: number | null
  data?: Record<string, any> | null
}

export interface ReviewFinancialReportRequest {
  action: 'ACCEPT' | 'REJECT'
  comment: string
}

// Portfolio Dashboard Types
export interface PortfolioMetrics {
  totalInvested: number
  availableForDrawdown: number
  fundGrossIRR: number
  lpNetIRR: number
  tvpi: number
}

export interface PerformanceOverview {
  paidIn: number
  totalInvestment: number
  managementExpenses: number
  otherExpenses: number
  realizedProceedsAndIncome: number
  fmvUnrealizedPortfolio: number
}

export interface JCurvePoint {
  year: number
  contribution: number
  distribution: number
  cumulativeAmount: number
}

export interface DealAllocation {
  sector: string
  investmentCost: number
  percentage: number
}

export interface IrrByQuarter {
  quarter: string
  quarterNumber: number
  year: number
  investorNetIRR: number
  fundNetIRR: number
  fundGrossIRR: number
}

export interface PortfolioSummaryItem {
  companyId: string
  name: string
  initialInvestment: string
  mainIndustry: string
  commitReserves: number
  currentOwnership: number | null
  totalInvestmentCost: number
  currentInvestmentCost: number
  realized: number
  fairMarketValue: number
  totalValue: number
  multiplesOfCost: number
  grossIRR: number
  totalRevenue: number
  netProfit: number
  cashFlowNet: number
}

export interface PortfolioTotals {
  totalInvestmentCost: number
  currentInvestmentCost: number
  realized: number
  fairMarketValue: number
  totalValue: number
  multiplesOfCost: number
  grossIRR: number
}

export interface PortfolioDashboardData {
  metrics: PortfolioMetrics
  performanceOverview: PerformanceOverview
  jCurve: JCurvePoint[]
  dealAllocation: DealAllocation[]
  irrByQuarter: IrrByQuarter[]
  portfolioSummary: PortfolioSummaryItem[]
  totals: PortfolioTotals
}

export interface PortfolioDashboardParams {
  year?: number
  currencyId?: string
  asOfDate?: string
  fundId?: string
}

class PortfolioApiService {
  async getCompanyFinancialReports(companyId: string): Promise<ApiResponse<PortfolioFinancialReport[]>> {
    return apiClient.get(`/portfolio-companies/${companyId}/financial-reports`)
  }

  async reviewFinancialReport(companyId: string, reportId: string, data: ReviewFinancialReportRequest): Promise<ApiResponse> {
    return apiClient.post(`/portfolio-companies/${companyId}/financial-reports/${reportId}/review`, data)
  }

  async getDashboard(params: PortfolioDashboardParams = {}): Promise<ApiResponse<PortfolioDashboardData>> {
    const queryParams = new URLSearchParams()
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.currencyId) queryParams.append('currencyId', params.currencyId)
    if (params.asOfDate) queryParams.append('asOfDate', params.asOfDate)
    if (params.fundId) queryParams.append('fundId', params.fundId)

    const queryString = queryParams.toString()
    return apiClient.get<ApiResponse<PortfolioDashboardData>>(
      `/portfolio/dashboard${queryString ? `?${queryString}` : ''}`
    )
  }
}

export const portfolioApi = new PortfolioApiService()
