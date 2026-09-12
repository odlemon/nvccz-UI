import { apiClient, ApiResponse } from './api-client'

export interface Fund {
  id: string
  name: string
  description: string
  totalAmount: string
  remainingAmount: string
  minInvestment: string
  maxInvestment: string
  focusIndustries: string[]
  applicationStart: string
  applicationEnd: string
  status: string
  createdById: string
  createdAt: string
  updatedAt: string
  managementFeeRate?: string | null
  carryRate?: string | null
  hurdleRate?: string | null
  fundDisbursements?: FundDisbursement[]
}

export interface FundDisbursement {
  id: string
  amount: string
  disbursementDate: string
  disbursementType: string
  status: string
  notes: string
  transactionReference: string
  approvedAt: string | null
  disbursedAt: string | null
  investmentImplementation?: {
    id: string
    portfolioCompany: {
      id: string
      name: string
    }
  }
}

export interface FundsListResponse {
  success: boolean
  data: {
    funds: Fund[]
    total: number
    page: number
    totalPages: number
  }
}

export interface FundResponse {
  success: boolean
  data: Fund
  message?: string
}

export const fundsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string; industry?: string }): Promise<FundsListResponse> => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    if (params?.search) query.append('search', params.search)
    if (params?.status) query.append('status', params.status)
    if (params?.industry) query.append('industry', params.industry)
    const qs = query.toString()
    const url = qs ? `/funds?${qs}` : '/funds'
    return apiClient.get<FundsListResponse>(url)
  },

  create: async (data: {
    name: string
    description: string
    totalAmount: number
    minInvestment: number
    maxInvestment: number
    focusIndustries: string[]
    applicationStart: string
    applicationEnd: string
    status?: 'OPEN' | 'CLOSED' | 'PAUSED'
    managementFeeRate?: number
    carryRate?: number
    hurdleRate?: number
    vintageYear?: number
    currencyCode?: string
    geography?: string
  }): Promise<FundResponse> => {
    return apiClient.post<FundResponse>('/funds', data)
  },

  update: async (
    fundId: string,
    data: Partial<{
      name: string
      description: string
      totalAmount: number
      minInvestment: number
      maxInvestment: number
      focusIndustries: string[]
      status: 'OPEN' | 'CLOSED' | 'PAUSED'
      managementFeeRate: number
      carryRate: number
      hurdleRate: number
      vintageYear: number
      currencyCode: string
      geography: string
    }>,
  ): Promise<FundResponse> => {
    return apiClient.put<FundResponse>(`/funds/${fundId}`, data)
  },

  getPerformanceSnapshots: async (
    fundId: string,
  ): Promise<{
    success: boolean
    data: Array<{
      id: string
      fundId: string
      asOfDate: string
      totalCommitment: string
      calledCapital: string
      distributedCapital: string
      nav: string
      grossIrr: string | null
      netIrr: string | null
      tvpi: string | null
      dpi: string | null
    }>
  }> => {
    return apiClient.get(`/funds/${fundId}/performance-snapshots`)
  },

  getDocuments: async (
    fundId: string,
  ): Promise<{
    success: boolean
    data: Array<{
      id: string
      fundId: string
      name: string
      category: string
      fileUrl: string
      mimeType: string | null
      fileSizeBytes: number | null
      createdAt: string
      uploadedBy: { id: string; firstName: string; lastName: string } | null
    }>
  }> => {
    return apiClient.get(`/funds/${fundId}/documents`)
  },

  uploadDocument: async (
    fundId: string,
    file: File,
    category?: string,
  ): Promise<{ success: boolean; data?: unknown; message?: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    if (category) formData.append('category', category)
    return apiClient.postFormData(`/funds/${fundId}/documents`, formData)
  },
}
