import { apiClient } from './api-client'

// Base response type
export interface AccountingResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp: string
}

// Chart of Accounts interfaces
export interface ChartOfAccount {
  id: string
  accountNo: string
  accountName: string
  accountType: string
  financialStatement: string
  notes?: string | null
  parentId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateChartOfAccountRequest {
  accountNo: string
  accountName: string
  accountType: string
  financialStatement: string
  notes?: string
  parentId?: string
  isActive?: boolean
}

class ChartOfAccountsApiService {
  // Chart of Accounts
  async getChartOfAccounts(params?: {
    accountType?: string
    isActive?: boolean
    parentId?: string
  }): Promise<ChartOfAccount[]> {
    // apiClient.get() returns the raw {success,message,data,timestamp} envelope —
    // unwrap it here so callers get the array the signature promises.
    const response = await apiClient.get<AccountingResponse<ChartOfAccount[]>>('/accounting/chart-of-accounts', { params })
    return response.data
  }

  async getChartOfAccountById(id: string): Promise<AccountingResponse<ChartOfAccount>> {
    const response = await apiClient.get(`/accounting/chart-of-accounts/${id}`)
    return response.data
  }

  async createChartOfAccount(data: CreateChartOfAccountRequest): Promise<AccountingResponse<ChartOfAccount>> {
    const response = await apiClient.post('/accounting/chart-of-accounts', data)
    return response.data
  }

  async updateChartOfAccount(id: string, data: CreateChartOfAccountRequest): Promise<AccountingResponse<ChartOfAccount>> {
    const response = await apiClient.put(`/accounting/chart-of-accounts/${id}`, data)
    return response.data
  }

  async deleteChartOfAccount(id: string): Promise<AccountingResponse<any>> {
    const response = await apiClient.delete(`/accounting/chart-of-accounts/${id}`)
    return response.data
  }
}

export const chartOfAccountsApi = new ChartOfAccountsApiService()