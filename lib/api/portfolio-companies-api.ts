import { apiClient } from './api-client'

export interface PortfolioCompany {
  id: string
  name: string
  registrationNumber: string
  industry: string
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'CLOSED'
  fund: {
    id: string
    name: string
    description: string
  } | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  totalInvested: number
  disbursements: Array<{
    id: string
    amount: string
    disbursementDate: string
    disbursementType: string
    status: string
  }>
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface PortfolioCompaniesResponse {
  success: boolean
  data: PortfolioCompany[]
}

class PortfolioCompaniesApiService {
  async getAll(): Promise<PortfolioCompaniesResponse> {
    return apiClient.get<PortfolioCompaniesResponse>('/portfolio-companies')
  }

  async getAllWithInvestments(): Promise<PortfolioCompaniesResponse> {
    return apiClient.get<PortfolioCompaniesResponse>('/portfolio-companies/with-investments')
  }

  async getById(id: string): Promise<{ success: boolean; data: PortfolioCompany }> {
    return apiClient.get<{ success: boolean; data: PortfolioCompany }>(`/portfolio-companies/${id}`)
  }

  /** Admin create — POST /portfolio-companies/admin */
  async adminCreate(data: {
    name: string
    industry?: string
    fund_id?: string
    registrationNumber?: string
    status?: string
    [key: string]: unknown
  }): Promise<{ success: boolean; data: PortfolioCompany; message?: string }> {
    return apiClient.post('/portfolio-companies/admin', data)
  }
}

export const portfolioCompaniesApi = new PortfolioCompaniesApiService()
