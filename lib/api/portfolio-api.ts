import { apiClient, ApiResponse } from './api-client'

export interface PortfolioFinancialReport {
  id: string
  portfolioCompanyId: string
  submittedById: string
  reportType: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASHFLOW_STATEMENT'
  periodType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  periodStart: string
  periodEnd: string
  title: string
  description: string
  reportUrl: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  reviewerId: string | null
  reviewedAt: string | null
  reviewerComment: string | null
  createdAt: string
  updatedAt: string
  submittedByFirstName: string
  submittedByLastName: string
}

export interface ReviewFinancialReportRequest {
  action: 'ACCEPT' | 'REJECT'
  comment: string
}

// Portfolio Dashboard Types
export interface PortfolioMetric {
  title: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface PerformanceOverviewPoint {
  period: string
  value: number
}

export interface JCurvePoint {
  year: number
  value: number
}

export interface DealAllocation {
  sector: string
  amount: number
  percentage: number
}

export interface IrrByQuarter {
  quarter: string
  irr: number
}

export interface PortfolioSummaryItem {
  id: string
  company: string
  sector: string
  invested: number
  currentValue: number
  irr: number
  status: 'ACTIVE' | 'EXITED' | 'WRITTEN_OFF'
}

export interface PortfolioDashboardData {
  metrics: PortfolioMetric[]
  performanceOverview: PerformanceOverviewPoint[]
  jCurve: JCurvePoint[]
  dealAllocation: DealAllocation[]
  irrByQuarter: IrrByQuarter[]
  portfolioSummary: PortfolioSummaryItem[]
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
