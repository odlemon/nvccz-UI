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
  pagination?: { page: number; limit: number; total: number; totalPages: number }
  filterOptions?: { industries: string[]; funds: Array<{ id: string; name: string }> }
}

class PortfolioCompaniesApiService {
  async getAll(): Promise<PortfolioCompaniesResponse> {
    return apiClient.get<PortfolioCompaniesResponse>('/portfolio-companies')
  }

  async getAllWithInvestments(): Promise<PortfolioCompaniesResponse> {
    return apiClient.get<PortfolioCompaniesResponse>('/portfolio-companies/with-investments')
  }

  async getWithInvestmentsPage(params: { page: number; limit: number; search?: string; industry?: string; fundId?: string; status?: string }): Promise<PortfolioCompaniesResponse> {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
    return apiClient.get<PortfolioCompaniesResponse>(`/portfolio-companies/with-investments?${query.toString()}`)
  }

  async getDocumentOrganisation(id: string): Promise<{ success: boolean; data: any }> {
    return apiClient.get(`/portfolio-companies/${encodeURIComponent(id)}/document-organisation`)
  }

  async getReportingAudit(id: string): Promise<{ success: boolean; data: any }> {
    return apiClient.get(`/portfolio-companies/${encodeURIComponent(id)}/reporting-audit`)
  }

  async getFinancialReports(id: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get(`/portfolio-companies/${encodeURIComponent(id)}/financial-reports`)
  }

  async getCompanyDocuments(id: string): Promise<{ success: boolean; data: { documents: any[]; requests: any[]; folders: string[] } }> {
    return apiClient.get(`/portfolio-companies/${encodeURIComponent(id)}/company-documents`)
  }

  async requestCompanyDocument(id: string, data: { title: string; folder: string; dueDate?: string }): Promise<{ success: boolean; data: any }> {
    return apiClient.post(`/portfolio-companies/${encodeURIComponent(id)}/company-document-requests`, data)
  }

  async uploadCompanyDocument(id: string, file: File, folder: string): Promise<{ success: boolean; data: any }> {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', folder)
    return apiClient.post(`/portfolio-companies/${encodeURIComponent(id)}/company-documents`, body)
  }

  async getCompanyActivity(id: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get(`/portfolio-companies/${encodeURIComponent(id)}/activity`)
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
