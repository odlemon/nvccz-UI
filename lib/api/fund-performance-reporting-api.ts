import { apiClient } from './api-client'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

// ── Templates ──────────────────────────────────────────────────────────
export type ReportLevel = 'INVESTOR' | 'BOARD'

export interface ReportTemplate {
  id: string
  fundId: string
  name: string
  reportLevel: ReportLevel
  description: string | null
  sectionConfig: string[]
  isActive: boolean
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReportTemplateRequest {
  name: string
  reportLevel: ReportLevel
  description?: string
  fundId: string
}
export type UpdateReportTemplateRequest = Partial<CreateReportTemplateRequest>

// ── Schedules ──────────────────────────────────────────────────────────
// Only QUARTERLY has been observed in a real sample — other values are inferred from the field's name.
export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL'

export interface ReportSchedule {
  id: string
  fundId: string
  templateId: string
  name: string
  periodType: PeriodType
  cronExpression: string | null
  timezone: string
  dayOfMonth: number
  hourOfDay: number
  isActive: boolean
  nextRunAt: string | null
  distributionListId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReportScheduleRequest {
  fundId: string
  templateId: string
  name: string
  periodType: PeriodType
  dayOfMonth: number
  hourOfDay: number
  timezone: string
  distributionListId: string
}
export type UpdateReportScheduleRequest = Partial<CreateReportScheduleRequest>

// ── Distribution Lists ────────────────────────────────────────────────
// Named ReportDistributionList (not "Distribution") to avoid clashing with the
// unrelated LP cash-distribution domain in lib/api/lp-fees-distributions-api.ts.
export type DistributionListSourceType = 'COMMITMENT_COHORT' | 'ROLE_BOUND'

export interface ReportDistributionList {
  id: string
  fundId: string
  name: string
  sourceType: DistributionListSourceType
  roleCodes: string[] | null
  cohortFilter: Record<string, any> | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReportDistributionListRequest {
  fundId: string
  name: string
  sourceType: DistributionListSourceType
  roleCodes?: string[]
  cohortFilter?: Record<string, any>
}
export type UpdateReportDistributionListRequest = Partial<CreateReportDistributionListRequest>

// ── Runs — PLACEHOLDER shapes, never sampled successfully; correct once confirmed ──
export type RunStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface FundReportRun {
  id: string
  fundId: string
  templateId: string
  status: RunStatus
  periodStart: string
  periodEnd: string
  totalRecipients: number | null
  sentCount: number | null
  failedCount: number | null
  progress: number | null
  createdAt: string
  completedAt: string | null
}

export interface CreateFundReportRunRequest {
  fundId: string
  templateId: string
  periodStart: string
  periodEnd: string
  distributionListId: string
}

export type RunEventType = 'SENT' | 'BOUNCE' | 'COMPLAINT' | 'DOWNLOAD'

export interface RunDeliveryLog {
  id: string
  runId: string
  eventType: RunEventType
  recipientEmail: string
  jobId: string | null
  createdAt: string
  metadata: Record<string, any> | null
}

export type TransportMethod = 'DIRECT_ATTACH' | 'SECURE_LINK'

export interface RunRecipient {
  id: string
  runId: string
  clientId: string
  lpLegalName: string
  email: string
  pdfStatus: string
  transportMethod: TransportMethod
  deliveryStatus: string
  sentAt: string | null
}

// ── Audit — PLACEHOLDER shape, never sampled with real data ──
export interface FundReportAuditEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  diff: Record<string, any> | null
  actorId: string | null
  createdAt: string
}

class FundPerformanceReportingApiService {
  private readonly BASE = '/fund-reporting'

  // Templates
  getTemplates(fundId: string, reportLevel?: ReportLevel): Promise<ApiResponse<ReportTemplate[]>> {
    const q = new URLSearchParams({ fundId })
    if (reportLevel) q.append('reportLevel', reportLevel)
    return apiClient.get(`${this.BASE}/templates?${q.toString()}`)
  }
  createTemplate(data: CreateReportTemplateRequest): Promise<ApiResponse<ReportTemplate>> {
    return apiClient.post(`${this.BASE}/templates`, data)
  }
  updateTemplate(id: string, data: UpdateReportTemplateRequest): Promise<ApiResponse<ReportTemplate>> {
    return apiClient.put(`${this.BASE}/templates/${id}`, data)
  }
  /** Soft delete (isActive=false) */
  deactivateTemplate(id: string): Promise<ApiResponse<ReportTemplate>> {
    return apiClient.delete(`${this.BASE}/templates/${id}`)
  }

  // Schedules
  // NOTE: known backend bug — errors with "Field fund is required to return data,
  // got null instead." when the fund has zero schedules. Surface the raw message,
  // do not swallow it.
  getSchedules(fundId: string): Promise<ApiResponse<ReportSchedule[]>> {
    return apiClient.get(`${this.BASE}/schedules?fundId=${fundId}`)
  }
  createSchedule(data: CreateReportScheduleRequest): Promise<ApiResponse<ReportSchedule>> {
    return apiClient.post(`${this.BASE}/schedules`, data)
  }
  updateSchedule(id: string, data: UpdateReportScheduleRequest): Promise<ApiResponse<ReportSchedule>> {
    return apiClient.put(`${this.BASE}/schedules/${id}`, data)
  }
  deactivateSchedule(id: string): Promise<ApiResponse<ReportSchedule>> {
    return apiClient.delete(`${this.BASE}/schedules/${id}`)
  }

  // Distribution Lists
  getDistributionLists(fundId: string): Promise<ApiResponse<ReportDistributionList[]>> {
    return apiClient.get(`${this.BASE}/distribution-lists?fundId=${fundId}`)
  }
  createDistributionList(data: CreateReportDistributionListRequest): Promise<ApiResponse<ReportDistributionList>> {
    return apiClient.post(`${this.BASE}/distribution-lists`, data)
  }
  updateDistributionList(id: string, data: UpdateReportDistributionListRequest): Promise<ApiResponse<ReportDistributionList>> {
    return apiClient.put(`${this.BASE}/distribution-lists/${id}`, data)
  }
  deactivateDistributionList(id: string): Promise<ApiResponse<ReportDistributionList>> {
    return apiClient.delete(`${this.BASE}/distribution-lists/${id}`)
  }

  // Runs
  getRuns(fundId: string, limit?: number): Promise<ApiResponse<FundReportRun[]>> {
    const q = new URLSearchParams({ fundId })
    if (limit) q.append('limit', String(limit))
    return apiClient.get(`${this.BASE}/runs?${q.toString()}`)
  }
  /** May reject with a 400 "No eligible recipients for this run" — surface verbatim. */
  triggerRun(data: CreateFundReportRunRequest): Promise<ApiResponse<FundReportRun>> {
    return apiClient.post(`${this.BASE}/runs`, data)
  }
  getRun(runId: string): Promise<ApiResponse<FundReportRun>> {
    return apiClient.get(`${this.BASE}/runs/${runId}`)
  }
  getRunLogs(runId: string): Promise<ApiResponse<RunDeliveryLog[]>> {
    return apiClient.get(`${this.BASE}/runs/${runId}/logs`)
  }
  getRunRecipients(runId: string): Promise<ApiResponse<RunRecipient[]>> {
    return apiClient.get(`${this.BASE}/runs/${runId}/recipients`)
  }

  // Audit
  getAudit(entityType: string, entityId: string): Promise<ApiResponse<FundReportAuditEntry[]>> {
    return apiClient.get(`${this.BASE}/audit?entityType=${entityType}&entityId=${entityId}`)
  }

  /**
   * Public tokenized PDF download (>10MB attachments). No auth header required —
   * intentionally NOT routed through apiClient. Returns a bare URL for <a href>/window.open.
   */
  getDownloadUrl(token: string): string {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3009/api'
    return `${base}${this.BASE}/download/${token}`
  }
}

export const fundPerformanceReportingApi = new FundPerformanceReportingApiService()
