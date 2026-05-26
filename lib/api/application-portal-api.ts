import { apiClient, ApiResponse } from './api-client'

// Profile Interfaces
export interface ApplicantProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  userDepartment: string | null
  roleCode: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileResponse {
  success: boolean
  message: string
  data: ApplicantProfile
  timestamp: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  email?: string
}

// Application Interfaces
export interface ApplicationDocument {
  id: string
  documentType: string
  fileName: string
  fileUrl: string
  fileSize: number
  isRequired: boolean
  isSubmitted: boolean
  uploadedAt: string
}

export interface Reviewer {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface DueDiligenceReview {
  id: string
  applicationId: string
  reviewerId: string
  marketResearchViable: boolean
  marketResearchComments: string
  financialViable: boolean
  financialComments: string
  competitiveOpportunities: boolean
  competitiveComments: string
  managementTeamQualified: boolean
  managementComments: string
  legalCompliant: boolean
  legalComments: string
  riskTolerable: boolean
  riskComments: string
  overallScore: string
  recommendation: string
  finalComments: string
  status: string
  createdAt: string
  updatedAt: string
  completedAt: string
  reviewer: Reviewer
}

export interface BoardReview {
  id: string
  applicationId: string
  reviewerId: string
  investmentApproved: boolean
  investmentRejected: boolean
  conditionalApproval: boolean
  recommendationReport: string
  additionalInformation: string | null
  decisionReason: string
  conditions: string | null
  nextSteps: string
  overallScore: string
  finalComments: string
  status: string
  createdAt: string
  updatedAt: string
  completedAt: string
  reviewer: Reviewer
}

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
  fundId: string | null
  currentStage: string
  submittedAt: string
  updatedAt: string
  initialScreeningScore: string | null
  screeningOutcome: string | null
  dueDiligenceScore: string
  boardDecision: string
  createdAt: string
  fund: any | null
  documents: ApplicationDocument[]
  dueDiligenceReview: DueDiligenceReview | null
  boardReview: BoardReview | null
  termSheet: any | null
}

export interface ApplicationResponse {
  success: boolean
  message: string
  data: Application
  timestamp: string
}

// Timeline Interfaces
export interface TimelineEvent {
  event: string
  date: string
  status: string
  description: string
}

export interface ApplicationTimeline {
  applicationId: string
  currentStage: string
  timeline: TimelineEvent[]
}

export interface TimelineResponse {
  success: boolean
  message: string
  data: ApplicationTimeline
  timestamp: string
}

// Portfolio Company Interfaces
export interface PortfolioCompany {
  id: string
  userId: string
  name: string
  registrationNumber: string
  industry: string
  foundingDate: string
  address: string
  website: string | null
  description: string
  logoUrl: string | null
  status: string
  companySize: string
  employeeCount: number | null
  annualRevenue: number | null
  fundingStage: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  socialMedia: any
  fundId: string | null
  startDate: string | null
  endDate: string | null
  capTable: any | null
  financialKpis: any | null
  financialHistoryExcel: string | null
  eSign: string | null
  createdAt: string
  updatedAt: string
  fund: any | null
}

export interface PortfolioCompanyResponse {
  success: boolean
  message: string
  data: PortfolioCompany
  timestamp: string
}

export interface UpdateCompanyRequest {
  name?: string
  industry?: string
  foundingDate?: string
  address?: string
  website?: string
  description?: string
  logoUrl?: string
  companySize?: string
  employeeCount?: number
  annualRevenue?: number
  fundingStage?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  socialMedia?: any
}

export interface UpdateCompanyResponse {
  success: boolean
  message: string
  data: {
    id: string
    name: string
    industry: string
    status: string
    updatedAt: string
  }
}

// Letterhead Interfaces
export interface Letterhead {
  id: string
  portfolioCompanyId: string
  legalName: string
  registrationNumber: string | null
  taxNumber: string | null
  email: string | null
  phone: string | null
  website: string | null
  logoUrl: string | null
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string | null
  country: string
  addressLabel: string | null
  twitter: string | null
  facebook: string | null
  linkedin: string | null
  instagram: string | null
  createdAt: string
  updatedAt: string
}

export interface LetterheadResponse {
  success: boolean
  message?: string
  data: Letterhead
}

export interface UpdateLetterheadRequest {
  legalName?: string
  registrationNumber?: string | null
  taxNumber?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  line1?: string
  line2?: string | null
  city?: string
  state?: string | null
  postalCode?: string | null
  country?: string
  addressLabel?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  instagram?: string | null
}

// Dashboard Interfaces
export interface DashboardApplication {
  id: string
  currentStage: string
  submittedAt: string
  businessName: string
  requestedAmount: string
  industry: string
  businessStage: string
}

export interface DashboardPortfolioCompany {
  id: string
  name: string
  status: string
  industry: string
  fundingStage: string
}

export interface DashboardSummary {
  hasApplication: boolean
  hasPortfolioCompany: boolean
  hasReceivedInvestment: boolean
  applicationStage: string
  companyStatus: string
  applicationProgress: number
  requestedAmount: number
  approvedAmount: number
}

export interface Dashboard {
  hasReceivedInvestment: boolean
  application: DashboardApplication | null
  portfolioCompany: DashboardPortfolioCompany | null
  recentActivities: any[]
  summary: DashboardSummary
}

export interface DashboardResponse {
  success: boolean
  message: string
  data: Dashboard
  timestamp: string
}

// Investment Interfaces
export interface InvestmentDetails {
  fund: any | null
  startDate: string | null
  endDate: string | null
  capTable: any | null
  financialKpis: any | null
}

export interface Investment {
  portfolioCompany: PortfolioCompany
  termSheet: any | null
  investment: InvestmentDetails
}

export interface InvestmentResponse {
  success: boolean
  message: string
  data: Investment
  timestamp: string
}

// Investment Implementation Interfaces
export interface InitiateInvestmentImplementationRequest {
  portfolioCompanyId: string
  applicationId: string
  fundId: string | null
  implementationPlan: string
  notes?: string
}

export interface InitiateInvestmentImplementationResponse {
  success: boolean
  message: string
  data: {
    id: string
    portfolioCompanyId: string
    applicationId: string
    fundId: string | null
    implementationPlan: string
    notes: string | null
    status: string
    createdAt: string
  }
}

// Valuation Interfaces
export interface ValuationActivity {
  id: string
  activityType: string
  title: string
  description: string
  createdAt: string
}

export interface Valuation {
  id: string
  valuationDate: string
  valuationAmount: number
  valuationMethod: string
  status: string
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  valuationActivities: ValuationActivity[]
}

export interface ValuationsResponse {
  success: boolean
  message: string
  data: Valuation[]
}

// Reports Interfaces
export interface Report {
  id: string
  title: string
  type: string
  period: string
  status: string
  generatedAt: string
  downloadUrl: string
}

export interface ReportsData {
  portfolioCompany: {
    id: string
    name: string
    industry: string
  }
  reports: Report[]
}

export interface ReportsResponse {
  success: boolean
  message: string
  data: ReportsData
  timestamp: string
}

// Term Sheet Interfaces
export interface TermSheet {
  id: string
  applicationId: string
  title: string
  version: string
  status: string
  investmentAmount: number | string
  equityPercentage: number | null
  valuation: number | null
  keyTerms: string | null
  conditions: string | null
  timeline: string | null
  documentUrl: string | null
  documentFileName: string | null
  documentSize: number | null
  isDraft: boolean
  isFinal: boolean
  isSigned: boolean
  signedAt: string | null
  applicantSignatureUrl?: string | null
  applicantSignatureFileName?: string | null
  applicantSignedById?: string | null
  applicantSignedAt?: string | null
  investorSignatureUrl?: string | null
  investorSignatureFileName?: string | null
  investorSignedById?: string | null
  investorSignedAt?: string | null
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  application?: {
    id: string
    businessName: string
    applicantName: string
    currentStage: string
  }
}

export interface SignTermSheetResponse {
  success: boolean
  message: string
  data: {
    id: string
    applicationId: string
    status: string
    isSigned: boolean
    signedAt: string
    investmentAmount: number
    equityPercentage: number
    valuation: number
  }
}

export interface MyTermSheetsResponse {
  success: boolean
  message: string
  data: {
    termSheets: TermSheet[]
    total: number
    page: number
    totalPages: number
  }
}

// Financial Reports Interfaces
export type FinancialReportType =
  | 'BALANCE_SHEET'
  | 'INCOME_STATEMENT'
  | 'CASHFLOW_STATEMENT'
  | 'INCOME_STATEMENTS'
  | 'CASHFLOW_STATEMENTS'
  | 'STATEMENT_OF_FINANCIAL_POSITION'
  | 'BUSINESS_PLAN'
  | 'OPERATIONAL_KPIS'
export type PeriodType = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'

export interface FinancialReport {
  id: string
  portfolioCompanyId: string
  companyName: string
  reportType: FinancialReportType
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  reportingPeriod?: string | null
  title: string
  description: string | null
  reportUrl: string | null
  fileUrl?: string | null
  storagePath?: string | null
  templateVersion: string
  status: 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  totalRevenue?: number | null
  netProfit?: number | null
  cashFlowNet?: number | null
  createdAt: string
  updatedAt: string
  reviewerId?: string | null
  reviewedAt?: string | null
  reviewerComment?: string | null
  isDraft: boolean
  canSubmit: boolean
  canUploadFile?: boolean
  canDownload: boolean
  data?: Record<string, any>
}

export interface UploadFinancialReportRequest {
  file: File
  reportType: FinancialReportType
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  title: string
  description: string
  templateVersion: string
}

export interface SubmitFinancialReportsRequest {
  reportIds: string[]
}

export interface SubmitPeriodKPIsRequest {
  periodStart: string
  periodEnd: string
  totalRevenue: number
  netProfit: number
  cashFlowNet: number
}

export interface ReportingRequestItem {
  id: string
  portfolioCompanyId?: string
  companyName?: string
  reportingPeriod: string
  dueDate: string
  status?: string
  lastRequestedAt?: string
  portalStatus?: string
  mandatoryAttachments?: Array<{ name: string; formats: string[] }>
}

export interface ReportingRequestsResponse extends ApiResponse {
  data: ReportingRequestItem[]
}

export interface FinancialReportDraftRequest {
  reportingPeriod: string
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  title: string
  description?: string
  templateVersion?: string
  data: Record<string, any>
}

export interface FinancialReportDraftResponse extends ApiResponse {
  data: {
    id: string
    status: string
    reportType: string
    reportingPeriod: string
  }
}

export interface FinancialReportDetailResponse extends ApiResponse {
  data: FinancialReport & {
    data?: Record<string, any>
    reviewerComment?: string | null
    canUploadFile?: boolean
  }
}

export interface FinancialReportsResponse extends ApiResponse {
  data: FinancialReport[]
}

interface PaginatedFinancialReportsData {
  page: number
  limit: number
  total: number
  items: FinancialReport[]
}

const normalizeFinancialReportsResponse = (response: any): FinancialReportsResponse => {
  const rawData = response?.data
  const items = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.items)
    ? rawData.items
    : []

  return {
    ...response,
    data: items,
  } as FinancialReportsResponse
}

const normalizeReportingRequestsResponse = (response: any): ReportingRequestsResponse => {
  const rawData = Array.isArray(response?.data) ? response.data : []
  const normalized: ReportingRequestItem[] = rawData.map((item: any, idx: number) => {
    const reportingPeriod = item?.reportingPeriod || ''
    const dueDate = item?.dueDate || ''
    const syntheticId = item?.id || `${item?.portfolioCompanyId || 'request'}-${reportingPeriod || idx}`

    return {
      ...item,
      id: syntheticId,
      reportingPeriod,
      dueDate,
      mandatoryAttachments: Array.isArray(item?.mandatoryAttachments) ? item.mandatoryAttachments : [],
    }
  })

  return {
    ...response,
    data: normalized,
  } as ReportingRequestsResponse
}

export interface UploadFinancialReportResponse extends ApiResponse {
  data: {
    id: string
    reportUrl: string
  }
}

// API Service
export const applicationPortalApiService = {
  // Profile endpoints
  async getProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/applicant/profile')
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    return apiClient.put<ProfileResponse>('/applicant/profile', data)
  },

  // Application endpoints
  async getApplication(): Promise<ApplicationResponse> {
    return apiClient.get<ApplicationResponse>('/applicant/application')
  },

  async getApplicationTimeline(): Promise<TimelineResponse> {
    return apiClient.get<TimelineResponse>('/applicant/application/timeline')
  },

  // Portfolio Company endpoints
  async getCompany(): Promise<PortfolioCompanyResponse> {
    return apiClient.get<PortfolioCompanyResponse>('/applicant/company')
  },

  async updateCompany(data: UpdateCompanyRequest): Promise<UpdateCompanyResponse> {
    return apiClient.put<UpdateCompanyResponse>('/applicant/company', data)
  },

  // Letterhead endpoints (scoped to a portfolio-company id)
  async getLetterhead(portfolioCompanyId: string): Promise<LetterheadResponse> {
    return apiClient.get<LetterheadResponse>(`/portfolio-companies/${portfolioCompanyId}/letterhead`)
  },

  async updateLetterhead(portfolioCompanyId: string, data: UpdateLetterheadRequest): Promise<LetterheadResponse> {
    return apiClient.put<LetterheadResponse>(`/portfolio-companies/${portfolioCompanyId}/letterhead`, data)
  },

  async deleteLetterhead(portfolioCompanyId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/portfolio-companies/${portfolioCompanyId}/letterhead`)
  },

  async uploadLetterheadLogo(portfolioCompanyId: string, file: File): Promise<LetterheadResponse> {
    const formData = new FormData()
    formData.append('logo', file)
    return apiClient.post<LetterheadResponse>(
      `/portfolio-companies/${portfolioCompanyId}/letterhead/logo`,
      formData
    )
  },

  // Dashboard endpoint
  async getDashboard(): Promise<DashboardResponse> {
    return apiClient.get<DashboardResponse>('/applicant/dashboard')
  },

  // Investment endpoint
  async getInvestment(): Promise<InvestmentResponse> {
    return apiClient.get<InvestmentResponse>('/applicant/investment')
  },

  // Investment Implementation endpoints
  async initiateInvestmentImplementation(data: InitiateInvestmentImplementationRequest): Promise<InitiateInvestmentImplementationResponse> {
    return apiClient.post<InitiateInvestmentImplementationResponse>('/investment-implementations/initiate', data)
  },

  // Valuations endpoint
  async getValuations(): Promise<ValuationsResponse> {
    return apiClient.get<ValuationsResponse>('/applicant/valuations')
  },

  // Reports endpoint
  async getReports(): Promise<ReportsResponse> {
    return apiClient.get<ReportsResponse>('/applicant/reports')
  },

  // Term Sheet endpoints
  async signTermSheet(termSheetId: string, signature: Blob | File): Promise<SignTermSheetResponse> {
    const formData = new FormData();
    formData.append('signature', signature, 'signature.png');
    return apiClient.post<SignTermSheetResponse>(`/term-sheets/${termSheetId}/sign`, formData);
  },

  async getMyTermSheets(params?: { page?: number; limit?: number }): Promise<MyTermSheetsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = queryString ? `/term-sheets/my?${queryString}` : '/term-sheets/my'

    return apiClient.get<MyTermSheetsResponse>(url)
  },

  // Financial Reports endpoints
  async getFinancialReports(): Promise<FinancialReportsResponse> {
    const response = await apiClient.get<ApiResponse<FinancialReport[] | PaginatedFinancialReportsData>>('/applicant/financial-reports')
    return normalizeFinancialReportsResponse(response)
  },

  async downloadFinancialReportTemplate(reportType: FinancialReportType): Promise<string> {
    // The response for this endpoint is a CSV string, not JSON.
    // We configure the request to handle a text response directly.
    const response = await apiClient.get<string>(`/applicant/financial-reports/template/${reportType}`, {
      responseType: 'text',
    })
    return response
  },

  async uploadFinancialReport(data: UploadFinancialReportRequest): Promise<UploadFinancialReportResponse> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('reportType', data.reportType)
    formData.append('periodType', data.periodType)
    formData.append('periodStart', data.periodStart)
    formData.append('periodEnd', data.periodEnd)
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('templateVersion', data.templateVersion)

    return apiClient.post<UploadFinancialReportResponse>('/applicant/financial-reports', formData)
  },

  async submitFinancialReports(data: SubmitFinancialReportsRequest): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/applicant/financial-reports/submit', data)
  },

  async submitPeriodKPIs(data: SubmitPeriodKPIsRequest): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/applicant/financial-reports/period-kpis', data)
  },

  async getReportingRequests(): Promise<ReportingRequestsResponse> {
    const response = await apiClient.get<ReportingRequestsResponse>('/applicant/reporting/requests')
    return normalizeReportingRequestsResponse(response)
  },

  async createIncomeStatementDraft(data: FinancialReportDraftRequest): Promise<FinancialReportDraftResponse> {
    return apiClient.post<FinancialReportDraftResponse>('/applicant/financial-reports/income-statement/draft', data)
  },

  async createBalanceSheetDraft(data: FinancialReportDraftRequest): Promise<FinancialReportDraftResponse> {
    return apiClient.post<FinancialReportDraftResponse>('/applicant/financial-reports/balance-sheet/draft', data)
  },

  async createCashFlowDraft(data: FinancialReportDraftRequest): Promise<FinancialReportDraftResponse> {
    return apiClient.post<FinancialReportDraftResponse>('/applicant/financial-reports/cash-flow/draft', data)
  },

  async getFinancialReportById(reportId: string): Promise<FinancialReportDetailResponse> {
    return apiClient.get<FinancialReportDetailResponse>(`/applicant/financial-reports/${reportId}`)
  },

  async updateFinancialReportData(reportId: string, data: Record<string, any>): Promise<ApiResponse> {
    return apiClient.patch<ApiResponse>(`/applicant/financial-reports/${reportId}/data`, { data })
  },

  async uploadFinancialReportFile(reportId: string, file: File): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<ApiResponse>(`/applicant/financial-reports/${reportId}/file`, formData)
  },

  async submitFinancialReportBundle(reportId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/applicant/financial-reports/submit/${reportId}`)
  },
}

export const applicationPortalApi = applicationPortalApiService

export default applicationPortalApiService
