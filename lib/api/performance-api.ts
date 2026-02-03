import { apiClient as api } from "./api-client"
import type { ApiResponse } from "./api-client"

// Performance Dashboard Types
export interface SummaryCard {
  title: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface MonthlyProductivityPoint {
  month: string
  productivity: number
  target: number
  isCurrent?: boolean
}

export interface PerformanceDistribution {
  category?: string
  name?: string
  count: number
  percentage?: number
  value?: number
  color?: string
}

export interface WorkerPerformance {
  id?: string
  name: string
  role: string
  performance: number
  tasks?: number
  completionRate?: number
  timeWorked?: number
  tasksCompleted?: number
}

export interface BudgetTrackerItem {
  category: string
  budget: number
  actual: number
  variance: number
}

export interface BudgetData {
  totalBudget: number
  totalSpend: number
  remaining: number
}

export interface EmployeeOfMonth {
  id?: string
  name: string
  role: string
  achievement?: string
  photoUrl?: string
  totalTimeWorked?: number
  activeTime?: number
  extraTime?: number
  pauseTime?: number
  email?: string
  phone?: string
}

export interface PerformanceDashboardData {
  summaryCards?: SummaryCard[]
  pendingTasks?: number
  inProgress?: number
  completed?: number
  completionRate?: number
  monthlyProductivity?: MonthlyProductivityPoint[]
  monthlyProductivityData?: MonthlyProductivityPoint[]
  performanceDistribution?: PerformanceDistribution[]
  workerPerformance?: WorkerPerformance[]
  workerInsights?: WorkerPerformance[]
  budgetTracker?: BudgetTrackerItem[]
  budget?: BudgetData
  employeeOfTheMonth?: EmployeeOfMonth | null
  employeeOfMonth?: EmployeeOfMonth | null
}

export interface PerformanceDashboardParams {
  month?: number
  year?: number
}

export const performanceApi = {
  // ...existing methods...

  getKPIAnalytics: async (params?: {
    kpiId?: string
    department?: string
    startDate?: string
    endDate?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.kpiId) queryParams.append("kpiId", params.kpiId)
    if (params?.department) queryParams.append("department", params.department)
    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)

    const response = await api.get<ApiResponse>(`/performance/analytics/kpi?${queryParams.toString()}`)
    return response.data
  },

  getDashboard: async (params: PerformanceDashboardParams = {}) => {
    const queryParams = new URLSearchParams()
    if (params.month) queryParams.append("month", params.month.toString())
    if (params.year) queryParams.append("year", params.year.toString())

    const queryString = queryParams.toString()
    const response = await api.get<ApiResponse<PerformanceDashboardData>>(
      `/performance/dashboard${queryString ? `?${queryString}` : ''}`
    )
    return response
  },
}