import { apiClient } from './api-client'

export interface MemoSections {
  dealTerms: string
  overallScore: number | null
  recommendation: string
  companyOverview: string
  executiveSummary: string
  investmentThesis: string
  financialAnalysis: string
  marketOpportunity: string
  risksAndMitigants: string
  additionalInformation: string
}

export interface MemoUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type MemoVersionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED'
export type MemoWorkflowStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED'

export interface MemoVersionSummary {
  id: string
  versionNumber: number
  versionStatus: MemoVersionStatus
  validationPassed: boolean
  changeSummary: string | null
  submittedAt: string | null
  createdAt: string
  attachmentUrl: string | null
  attachmentFileName: string | null
  createdBy: MemoUser
  hasAttachment?: boolean
}

export interface MemoVersion extends MemoVersionSummary {
  memoId: string
  sections: MemoSections
  attachmentSha256: string | null
  validationErrors: string[] | null
}

export interface MemoHeader {
  id: string
  applicationId: string
  boardReviewId: string | null
  workflowStatus: MemoWorkflowStatus
  currentVersionId: string | null
  approvedVersionId: string | null
  approvedAt: string | null
  approvedBy?: MemoUser | string | null
  approvedById?: string | null
  latestVersion?: MemoVersionSummary
  createdAt?: string
  updatedAt?: string
}

export interface ValidationResult {
  passed: boolean
  errors: string[]
}

export interface ApprovalHistoryEntry {
  id: string
  memoId: string
  versionId: string
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  actorId: string
  comment: string | null
  createdAt: string
  actor: MemoUser
  version: {
    id: string
    versionNumber: number
    versionStatus: MemoVersionStatus
  }
}

interface MemoResponse<T = any> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

class InvestmentMemoApiService {
  private readonly BASE = '/investment-memos'

  async getHeader(applicationId: string): Promise<MemoResponse<MemoHeader>> {
    return apiClient.get(`${this.BASE}/${applicationId}`)
  }

  async getVersions(applicationId: string): Promise<MemoResponse<MemoVersionSummary[]>> {
    return apiClient.get(`${this.BASE}/${applicationId}/versions`)
  }

  async getVersion(applicationId: string, versionId: string): Promise<MemoResponse<MemoVersion>> {
    return apiClient.get(`${this.BASE}/${applicationId}/versions/${versionId}`)
  }

  async createVersion(applicationId: string, changeSummary?: string): Promise<MemoResponse<MemoVersion>> {
    return apiClient.post(`${this.BASE}/${applicationId}/versions`, { changeSummary })
  }

  async saveVersion(
    applicationId: string,
    versionId: string,
    data: { sections: Partial<MemoSections>; changeSummary?: string },
    validate: boolean
  ): Promise<MemoResponse<MemoVersion>> {
    return apiClient.put(`${this.BASE}/${applicationId}/versions/${versionId}?validate=${validate}`, data)
  }

  async validateVersion(applicationId: string, versionId: string): Promise<MemoResponse<ValidationResult>> {
    return apiClient.get(`${this.BASE}/${applicationId}/versions/${versionId}/validate`)
  }

  async submitVersion(applicationId: string, versionId: string): Promise<MemoResponse<MemoHeader>> {
    return apiClient.post(`${this.BASE}/${applicationId}/versions/${versionId}/submit`, {})
  }

  async approveVersion(applicationId: string, versionId: string, comment: string): Promise<MemoResponse<MemoHeader>> {
    return apiClient.post(`${this.BASE}/${applicationId}/versions/${versionId}/approve`, { comment })
  }

  async rejectVersion(applicationId: string, versionId: string, comment: string): Promise<MemoResponse<MemoHeader>> {
    return apiClient.post(`${this.BASE}/${applicationId}/versions/${versionId}/reject`, { comment })
  }

  async uploadAttachment(applicationId: string, versionId: string, file: File): Promise<MemoResponse<MemoVersion>> {
    const formData = new FormData()
    formData.append('file', file)
    // Must NOT set Content-Type manually — the browser needs to add its own
    // multipart boundary, which a hardcoded header strips out.
    return apiClient.postFormData(`${this.BASE}/${applicationId}/versions/${versionId}/attachment`, formData)
  }

  async getApprovalHistory(applicationId: string): Promise<MemoResponse<ApprovalHistoryEntry[]>> {
    return apiClient.get(`${this.BASE}/${applicationId}/approval-history`)
  }
}

export const investmentMemoApi = new InvestmentMemoApiService()
