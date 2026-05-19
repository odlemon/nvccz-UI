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

export interface SchedulePreviewPeriod {
  reportingPeriod: string
  reportingPeriodLabel: string
  periodEndDate: string
  reportingOpensOn: string
  submissionDueDate: string
  reminderTMinus3On: string
  overdueAlertOn: string
  calendarAlreadyOpened: boolean
  openWindowReached: boolean
  isSubmissionOverdue: boolean
  automationWouldOpenOnTick: boolean
}

export interface SchedulePreviewResult {
  asOfDate: string
  count: number
  config: {
    id: string
    name: string
    frequency: string
    autoOpenCalendar: boolean
    openCalendarAfterPeriodEndDays: number
    dueDateOffsetDaysAfterPeriodEnd: number
  }
  offsetsExplanation: Record<string, string>
  reminderScheduleNote: string
  periods: SchedulePreviewPeriod[]
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

  async previewScheduleConfig(
    id: string,
    params?: { asOfDate?: string; count?: number }
  ): Promise<ApiResponse<SchedulePreviewResult>> {
    const qs = new URLSearchParams()
    if (params?.asOfDate) qs.set('asOfDate', params.asOfDate)
    if (params?.count) qs.set('count', String(params.count))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return apiClient.get(`/portfolio-companies/reporting/schedule-configs/${id}/preview${query}`)
  }
}

export const portfolioReportingApi = new PortfolioReportingApiService()
