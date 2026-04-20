import { apiClient, ApiResponse } from './api-client'

export interface KPICreateRequest {
  name: string
  description?: string
  type: 'Percentage' | 'Metric' | 'Count'
  isReverseKpi?: boolean
  unit?: string
  hasUnit?: boolean
  unitCategory?: string
  unitSymbol?: string
  unitPosition?: 'prefix' | 'suffix'
  targetValue?: number
  currentValue?: number
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'hr'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  departmentId?: string
  catalogDepartmentName?: string | null
  code?: string
  accountType?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | null
  accountNumber?: string | null
  journalEntryType?: 'Debit' | 'Credit' | null
  isFinancial?: boolean
  weightValue: number
  isActive: boolean
}

export interface KPIUpdateRequest {
  name?: string
  description?: string
  type?: 'Percentage' | 'Metric' | 'Count'
  isReverseKpi?: boolean
  unit?: string
  hasUnit?: boolean
  unitCategory?: string
  unitSymbol?: string
  unitPosition?: 'prefix' | 'suffix'
  targetValue?: number
  currentValue?: number
  category?: 'sales' | 'marketing' | 'operations' | 'finance' | 'hr'
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  departmentId?: string
  catalogDepartmentName?: string | null
  code?: string
  accountType?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | null
  accountNumber?: string | null
  journalEntryType?: 'Debit' | 'Credit' | null
  isFinancial?: boolean
  weightValue?: number
  isActive?: boolean
}

export interface KPI {
  id: string
  name: string
  description?: string
  type: 'Percentage' | 'Metric' | 'Count'
  isReverseKpi?: boolean
  unit?: string
  hasUnit?: boolean
  unitCategory?: string
  unitSymbol?: string
  unitPosition?: 'prefix' | 'suffix'
  targetValue?: number
  currentValue?: number
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'hr'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  departmentId?: string
  departmentName?: string
  catalogDepartmentName?: string | null
  code?: string
  accountType?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | null
  accountNumber?: string | null
  journalEntryType?: 'Debit' | 'Credit' | null
  isFinancial?: boolean
  hardcodedDetails?: any
  weightValue: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  performanceGoals?: any[]
  _count?: {
    performanceGoals: number
  }
}

export interface PerformanceGoal {
  id: string
  title: string
  description: string
  type: 'company' | 'department' | 'individual'
  category: string
  status: string
  priority: string
  targetValue: string
  currentValue: string
  percentValueAchieved: string
  departmentId?: string
  parentGoalId?: string
  startDate: string
  endDate: string
}

export interface KPIsResponse {
  success: boolean
  count: number
  kpis: KPI[]
}

export interface KPIResponse {
  success: boolean
  kpi: KPI
}

export interface KPIFilters {
  type?: string
  category?: string
  departmentId?: string
  isActive?: boolean
  frequency?: string
}

export const kpiApiService = {
  async getKPIs(filters?: KPIFilters): Promise<KPIsResponse> {
    const queryParams = new URLSearchParams()
    if (filters?.type) {
      queryParams.append('type', filters.type)
    }
    if (filters?.category) {
      queryParams.append('category', filters.category)
    }
    if (filters?.departmentId) {
      queryParams.append('departmentId', filters.departmentId)
    }
    if (filters?.isActive !== undefined) {
      queryParams.append('isActive', filters.isActive.toString())
    }
    if (filters?.frequency) {
      queryParams.append('frequency', filters.frequency)
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/kpis?${queryString}` : '/kpis'

    return apiClient.get<KPIsResponse>(url)
  },

  async getKPI(id: string): Promise<KPIResponse> {
    return apiClient.get<KPIResponse>(`/kpis/${id}`)
  },

  async createKPI(data: KPICreateRequest): Promise<KPIResponse> {
    return apiClient.post<KPIResponse>('/kpis', data)
  },

  async updateKPI(id: string, data: KPIUpdateRequest): Promise<KPIResponse> {
    return apiClient.put<KPIResponse>(`/kpis/${id}`, data)
  },

  async deleteKPI(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/kpis/${id}`)
  },

  // Get all available KPIs
  async getAvailableKPIs(): Promise<{
    success: boolean
    message: string
    data: any[]
    total: number
  }> {
    return apiClient.get('/performance/kpis')
  },

  // Get KPIs by department name
  async getKPIsByDepartment(departmentName: string): Promise<{
    success: boolean
    message: string
    data: any[]
    total: number
    department: string
  }> {
    return apiClient.get(`/performance/kpis/department/${departmentName}`)
  },

  // Get KPIs by account type
  async getKPIsByAccountType(accountType: string): Promise<{
    success: boolean
    message: string
    data: any[]
    total: number
    accountType: string
  }> {
    return apiClient.get(`/performance/kpis/account-type/${accountType}`)
  },

  // Get KPI statistics
  async getKPIStatistics(): Promise<{
    success: boolean
    message: string
    data: {
      total: number
      financial: number
      nonFinancial: number
      byDepartment: Array<{ department: string; count: number }>
      byAccountType: Array<{ accountType: string; count: number }>
    }
  }> {
    return apiClient.get('/performance/kpis/statistics')
  },

  async getFinancialKPIs(): Promise<{
    success: boolean
    message: string
    data: any[]
    total: number
  }> {
    return apiClient.get('/performance/kpis/financial')
  },

  getKPIAnalytics: async (params?: {
    kpiId?: string
    department?: string
    startDate?: string
    endDate?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.kpiId) queryParams.append('kpiId', params.kpiId)
    if (params?.department) queryParams.append('department', params.department)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const response = await apiClient.get<any>(`/performance/analytics/kpi?${queryParams.toString()}`)
    return response.data
  },

  async getDashboardAnalytics() {
    const response = await apiClient.get('/performance/analytics/dashboard')
    return response.data
  },

  async getDepartmentComparison() {
    const response = await apiClient.get('/performance/analytics/departments/comparison')
    return response.data
  },
}

export const kpiApi = kpiApiService

export default kpiApiService