// Below-threshold API response
export interface BelowThresholdApplicationsResponse {
  success: boolean;
  data: {
    applications: Application[];
  };
}
export type ExtendedApplication = Application & {
  portfolioCompanyId: string;
  fundId: string;
  portfolioCompany: {
    id: string;
    name: string;
    industry: string;
    status: string;
  };
  investmentImplementation: {
    id: string;
    portfolioCompanyId: string;
    disbursementMode?: 'MILESTONE_BASED' | 'ONE_TIME';
    totalCommittedAmount?: number;
  } | null;
  disbursements: any[];
};
import { apiClient } from './api-client'

export interface Application {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress: string
  businessName: string
  businessDescription: string
  industry: string
  businessStage: string
  foundingDate: string
  requestedAmount: string
  currentStage: string
  submittedAt: string | null
  updatedAt: string
  createdAt: string
  applicationProgress: number
  documents: Array<{
    id: string
    documentType: string
    fileName: string
    isRequired: boolean
    isSubmitted: boolean
  }>
}

export interface ApplicationCreateRequest {
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress: string
  businessName: string
  businessDescription: string
  industry: string
  businessStage: string
  foundingDate: string
  requestedAmount: number
  fundId?: string
  files: File[]
  documentTypes: string[]
}

export interface ApplicationsResponse {
  success: boolean
  data: {
    applications: Application[]
  }
}

export interface ApplicationCreateResponse {
  success: boolean
  data: Application
  message?: string
}

export interface InvestmentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  userDepartment: string
  departmentRole: string
  roleCode: string
  role: {
    id: string
    name: string
    description: string
  }
  createdAt: string
  updatedAt: string
}

export interface InvestmentUsersResponse {
  success: boolean
  message: string
  data: InvestmentUser[]
  timestamp: string
}

export interface TaskAssignmentRequest {
  assigneeId: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  category: string
}

export interface TaskAssignmentResponse {
  success: boolean
  message: string
  data: {
    task: any
    dueDiligence: {
      id: string
      applicationId: string
    }
  }
  timestamp: string
}

export interface TaskActivityRequest {
  title: string
  description: string
  valueCollected?: number
  documents?: File[]
}

export interface TaskActivityResponse {
  success: boolean
  message: string
  data: any
  timestamp: string
}

export interface ActivityApprovalRequest {
  approved: boolean
  comments: string
}

export interface ActivityApprovalResponse {
  success: boolean
  message: string
  data: {
    id: string
    approvalStatus: string
    approvedBy: string
    approvedAt: string
    documents: Array<{
      fileName: string
      fileUrl: string
      fileSize: number
    }>
  }
  timestamp: string
}

export interface ActivityDetailResponse {
  success: boolean
  message: string
  data: {
    id: string
    userId: string
    activityType: string
    title: string
    description: string
    monetaryValueAchieved: string | null
    percentValueAchieved: string | null
    createdAt: string
    task: any
    user: any
    documents: any[]
    approvalStatus: string
  }
  timestamp: string
}

class ApplicationsApiService {
  // Get all applications (use light for Deal Flow / pipeline lists)
  async getAll(params?: {
    light?: boolean
    page?: number
    limit?: number
    paginate?: boolean
    stage?: string
    fundId?: string
  }): Promise<ApplicationsResponse> {
    const q = new URLSearchParams()
    if (params?.light) q.set('light', 'true')
    if (params?.paginate || params?.page != null || params?.limit != null) {
      q.set('paginate', 'true')
      if (params.page != null) q.set('page', String(params.page))
      if (params.limit != null) q.set('limit', String(params.limit))
    }
    if (params?.stage) q.set('stage', params.stage)
    if (params?.fundId) q.set('fundId', params.fundId)
    const qs = q.toString()
    return apiClient.get<ApplicationsResponse>(qs ? `/applications?${qs}` : '/applications')
  }

  // ── New Flow APIs ──────────────────────────────────────────────────

  /** Step 2: Assign lead analyst (SCREENING_PENDING or SCREENING) */
  async assignAnalyst(applicationId: string, analystUserId: string): Promise<any> {
    return apiClient.patch(`/applications/${applicationId}/assigned-analyst`, { analystUserId })
  }

  /** Step 3: Analyst screening score (stage SCREENING, caller = assigned analyst) */
  async analystScreening(applicationId: string, score: number): Promise<any> {
    return apiClient.post(`/applications/${applicationId}/analyst-screening`, { score })
  }

  /** Step 4: Trigger AI shortlisting (stage SCREENING_PENDING) */
  async triggerShortlisting(applicationId: string): Promise<any> {
    return apiClient.post(`/applications/${applicationId}/trigger-shortlisting`, {})
  }

  /** Step 5a: Upload RBZ Exchange Control document */
  async uploadRbzDocument(applicationId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.postFormData(`/applications/${applicationId}/rbz-exchange-control-document`, formData)
  }

  /** Step 5b: Set KYC verified (statutory compliance) */
  async setStatutoryCompliance(applicationId: string, kycVerified: boolean): Promise<any> {
    return apiClient.patch(`/applications/${applicationId}/statutory-compliance`, { kycVerified })
  }

  /** Step 6a: Get collaboration messages */
  async getCollaborationMessages(applicationId: string): Promise<any> {
    return apiClient.get(`/applications/${applicationId}/collaboration/messages`)
  }

  /** Step 6b: Post collaboration message */
  async postCollaborationMessage(applicationId: string, content: string, mentionUserIds?: string[]): Promise<any> {
    return apiClient.post(`/applications/${applicationId}/collaboration/messages`, { content, mentionUserIds })
  }

  /** Step 6c: Post collaboration comment with optional attachments */
  async postCollaborationComment(applicationId: string, content: string, attachments?: File[]): Promise<any> {
    const formData = new FormData()
    formData.append('content', content)
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file))
    }
    return apiClient.postFormData(`/applications/${applicationId}/collaboration/comments`, formData)
  }

  /** Step 7: Initiate due diligence (stage SCREENING → ACTIVE_DD) */
  async initiateDueDiligence(applicationId: string): Promise<any> {
    return apiClient.post(`/applications/${applicationId}/due-diligence/initiate`, {})
  }

  /** Get application status */
  async getStatus(applicationId: string): Promise<any> {
    return apiClient.get(`/applications/status/${applicationId}`)
  }

  // Create a new application with FormData
  async create(applicationData: ApplicationCreateRequest): Promise<ApplicationCreateResponse> {
    const formData = new FormData()

    // Append text fields
    formData.append('applicantName', applicationData.applicantName)
    formData.append('applicantEmail', applicationData.applicantEmail)
    formData.append('applicantPhone', applicationData.applicantPhone)
    formData.append('applicantAddress', applicationData.applicantAddress)
    formData.append('businessName', applicationData.businessName)
    formData.append('businessDescription', applicationData.businessDescription)
    formData.append('industry', applicationData.industry)
    formData.append('businessStage', applicationData.businessStage)
    formData.append('foundingDate', applicationData.foundingDate)
    formData.append('requestedAmount', applicationData.requestedAmount.toString())

    if (applicationData.fundId) {
      formData.append('fundId', applicationData.fundId)
    }

    // Append files
    applicationData.files.forEach((file) => {
      formData.append('files', file)
    })

    // Append document types as JSON string
    formData.append('documentTypes', JSON.stringify(applicationData.documentTypes))

    // Don't set Content-Type header - let browser set it automatically with boundary
    return apiClient.post<ApplicationCreateResponse>('/applications', formData)
  }

  /**
   * Public draft upload — no applicationId. Files go to media storage; returns URLs
   * to attach later via createWithDocumentUrls.
   */
  async uploadDocuments(
    files: File[],
    documentTypes: string[],
    applicationId?: string,
  ): Promise<{
    success: boolean
    message?: string
    data?: {
      applicationId?: string
      documents: Array<{
        id?: string
        documentType: string
        fileName: string
        fileUrl: string
        fileSize: number
        filePath?: string
      }>
    }
  }> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('documentTypes', JSON.stringify(documentTypes))
    if (applicationId) formData.append('applicationId', applicationId)
    return apiClient.post('/applications/upload-documents', formData)
  }

  /** Create application using already-uploaded media URLs (public JSON body). */
  async createWithDocumentUrls(payload: {
    applicantName: string
    applicantEmail: string
    applicantPhone: string
    applicantAddress: string
    businessName: string
    businessDescription: string
    industry: string
    businessStage: string
    foundingDate: string
    requestedAmount: number
    fundId?: string
    applicationFormData?: Record<string, unknown>
    documents: Array<{
      documentType: string
      fileName: string
      fileUrl: string
      fileSize: number
      isRequired?: boolean
    }>
  }): Promise<ApplicationCreateResponse> {
    return apiClient.post<ApplicationCreateResponse>('/applications', payload)
  }

  /** Analyst clarification request — backend emails the applicant. */
  async requestClarification(
    applicationId: string,
    body: { subject: string; message: string; recipientEmail?: string },
  ): Promise<{ success: boolean; message?: string; data?: unknown }> {
    return apiClient.post(`/applications/${applicationId}/request-clarification`, body)
  }

  // Get a single application by ID
  async getById(id: string, opts?: { light?: boolean }): Promise<ApplicationCreateResponse> {
    const qs = opts?.light ? '?light=true' : ''
    return apiClient.get<ApplicationCreateResponse>(`/applications/${id}${qs}`)
  }

  // Update an application
  async update(id: string, applicationData: Partial<ApplicationCreateRequest>): Promise<ApplicationCreateResponse> {
    return apiClient.put<ApplicationCreateResponse>(`/applications/${id}`, applicationData)
  }

  // Delete an application
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete<{ success: boolean; message?: string }>(`/applications/${id}`)
  }

  // Get investment department users
  async getInvestmentUsers(): Promise<InvestmentUsersResponse> {
    return apiClient.get<InvestmentUsersResponse>('/applications/due-diligence/investments-users')
  }

  // Get below-threshold applications
  async getBelowThresholdApplications(page: number = 1, limit: number = 10): Promise<BelowThresholdApplicationsResponse> {
    return apiClient.get<BelowThresholdApplicationsResponse>(`/applications/below-threshold?page=${page}&limit=${limit}`);
  }

  // Assign task to user for due diligence
  async assignDueDiligenceTask(applicationId: string, taskData: TaskAssignmentRequest): Promise<TaskAssignmentResponse> {
    return apiClient.post<TaskAssignmentResponse>(`/applications/${applicationId}/due-diligence/assign-task`, taskData)
  }

  /** Change application workflow stage */
  async changeStage(
    applicationId: string,
    body: { newStage: string; notes?: string },
  ): Promise<ApplicationCreateResponse> {
    return apiClient.post<ApplicationCreateResponse>(`/applications/${applicationId}/change-stage`, body)
  }

  // Create activity for a task
  async createTaskActivity(taskId: string, activityData: TaskActivityRequest): Promise<TaskActivityResponse> {
    const formData = new FormData()

    formData.append('title', activityData.title)
    formData.append('description', activityData.description)

    if (activityData.valueCollected !== undefined) {
      formData.append('valueCollected', activityData.valueCollected.toString())
    }

    if (activityData.documents && activityData.documents.length > 0) {
      activityData.documents.forEach((file) => {
        formData.append('documents', file)
      })
    }

    return apiClient.post<TaskActivityResponse>(`/activities/task/${taskId}`, formData)
  }

  // Get activity detail for approval
  async getActivityForApproval(activityId: string): Promise<ActivityDetailResponse> {
    return apiClient.get<ActivityDetailResponse>(`/activities/${activityId}/approval`)
  }

  // Approve activity
  async approveActivity(activityId: string, approvalData: ActivityApprovalRequest): Promise<ActivityApprovalResponse> {
    return apiClient.post<ActivityApprovalResponse>(`/activities/${activityId}/approve`, approvalData)
  }
}

export const applicationsApi = new ApplicationsApiService()
