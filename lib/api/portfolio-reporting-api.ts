import { apiClient, ApiResponse } from './api-client'

export type ReportingFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'

export interface ReportingScheduleConfig {
  id: string
  name: string
  description?: string
  frequency: ReportingFrequency
  autoOpenCalendar: boolean
  dueDateOffsetDaysAfterPeriodEnd: number
  openCalendarAfterPeriodEndDays: number
  defaultAttachmentOptionIds?: string[]
  customMonthEnds?: number[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReportingScheduleRequest {
  name: string
  description?: string
  frequency: ReportingFrequency
  autoOpenCalendar: boolean
  dueDateOffsetDaysAfterPeriodEnd: number
  openCalendarAfterPeriodEndDays: number
  defaultAttachmentOptionIds?: string[]
  customMonthEnds?: number[] | null
}

class PortfolioReportingApiService {
  async getScheduleConfigs(): Promise<ApiResponse<ReportingScheduleConfig[]>> {
    return apiClient.get('/portfolio-companies/reporting/schedule-configs')
  }

  async getScheduleConfigById(id: string): Promise<ApiResponse<ReportingScheduleConfig>> {
    return apiClient.get(`/portfolio-companies/reporting/schedule-configs/${id}`)
  }

  async createScheduleConfig(data: CreateReportingScheduleRequest): Promise<ApiResponse<ReportingScheduleConfig>> {
    return apiClient.post('/portfolio-companies/reporting/schedule-configs', data)
  }

  async updateScheduleConfig(id: string, data: Partial<CreateReportingScheduleRequest>): Promise<ApiResponse<ReportingScheduleConfig>> {
    return apiClient.put(`/portfolio-companies/reporting/schedule-configs/${id}`, data)
  }

  async deleteScheduleConfig(id: string): Promise<ApiResponse> {
    return apiClient.delete(`/portfolio-companies/reporting/schedule-configs/${id}`)
  }
}

export const portfolioReportingApi = new PortfolioReportingApiService()
