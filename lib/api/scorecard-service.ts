import { apiClient } from "./api-client"

export interface ScorecardIndicator {
  id?: string
  section?: string
  indicatorName?: string
  formulaType?: string
  unit?: string
  targetValue?: number | null
  stretchTargetValue?: number | null
  computedActual?: number | null
  allowableVariance?: number | null
  isReverseKpi?: boolean
  isPendingApproval?: boolean
  excludedFromScoring?: boolean
  missingValue?: boolean
  originalWeight?: number | null
  weight?: number | null
  rawRating?: number | null
  progressPct?: number | null
  effectiveWeight?: number | null
  weightedScore?: number | null
}

export interface ScorecardSection {
  label: string
  weight: number
  sectionScore: number
  performanceLabel: string
  indicators: ScorecardIndicator[]
}

export interface AgreedRatingSummary {
  section: string
  heading: string
  sectionScore: number
  label: string
}

export interface ScorecardContract {
  id: string
  title: string
  periodLabel?: string
  stretchScoringEnabled?: boolean
  reviewerId?: string | null
  reviewerName?: string | null
}

export interface ScorecardDocumentHeader {
  organisationName?: string
  organisationLogoUrl?: string | null
  governmentCrestUrl?: string | null
  documentTitle?: string
  contractParty1?: string
  contractParty2?: string
  reviewPeriod?: string
  reviewerName?: string | null
  reviewerTitle?: string | null
  dateGenerated?: string
  [key: string]: unknown
}

export interface ScorecardDocumentSectionRow {
  index?: number
  indicatorName?: string
  formulaMeasure?: string
  unit?: string
  target?: number | null
  computedActual?: number | null
  allowableVariance?: number | null
  rawRating?: number | null
  weight?: number | null
  effectiveWeight?: number | null
  weightedScore?: number | null
  rowSeverity?: string
  isPendingApproval?: boolean
  excludedFromScoring?: boolean
  missingValue?: boolean
}

export interface ScorecardDocumentSectionTable {
  sectionLabel?: string
  rows?: ScorecardDocumentSectionRow[]
  sectionScore?: number
  performanceLabel?: string
}

export interface ScorecardDocument {
  header?: ScorecardDocumentHeader
  sectionTables?: Record<string, ScorecardDocumentSectionTable>
  agreedRatingsSummary?: AgreedRatingSummary[]
  governanceNarrative?: {
    label?: string
    content?: string | null
  }
  qualitativeSections?: Record<string, unknown>
  signatureBlock?: Record<string, unknown>
  subtotals?: {
    finalScore?: number
    performanceLabel?: string
  }
  status?: string
  [key: string]: unknown
}

export interface SavedScorecardRecord {
  id: string
  scorecardType: string
  status: string
  subjectUserId?: string
  departmentName?: string | null
  periodLabel?: string
  periodStart?: string
  periodEnd?: string
  finalScore?: string | number | null
  warnings?: string[]
  sections?: Record<string, unknown>
  matrixRows?: Array<Record<string, unknown>>
  rollupSummary?: Array<Record<string, unknown>> | null
  qualitativeSections?: Record<string, unknown>
  signatureState?: Record<string, unknown>
  documentPayload?: Record<string, unknown>
  isLocked?: boolean
  documentLockedAt?: string | null
  archivedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ScorecardGoal {
  id?: string
  goalName?: string
  title?: string
  kpiOrMeasure?: string
  targetValue?: number | string | null
  selectedActualValue?: number | string | null
  directActualValue?: number | string | null
  currentValue?: number | string | null
  progressPct?: number | string
  progressPercentage?: number | string
  selectedProgressPct?: number | string
  rawRating?: number | null
  weight?: number | string
  effectiveWeight?: number | string
  weightedScore?: number | string
  status?: string
  stage?: string
  scorecardPillar?: string | null
  isPendingApproval?: boolean
  isReverseKpi?: boolean
  excludedFromScoring?: boolean
  missingValue?: boolean
}

export interface DepartmentScorecard {
  scorecardType: "DEPARTMENT"
  access: {
    canView: boolean
    canGenerate: boolean
  }
  department: {
    id: string
    name: string
    managerId?: string | null
    managerName?: string | null
  }
  contract?: ScorecardContract | null
  warnings: string[]
  goals: ScorecardGoal[]
  scores: {
    departmentScore: number | string
    performanceLabel: string
  }
  rollupSummary?: Array<{
    employeeId: string
    employeeName: string
    finalScore: number | null
    rollupWeight: number
    weightedContribution: number | null
  }>
  employeeRollupSummary?: Array<{
    employeeId: string
    employeeName: string
    finalScore: number | null
    rollupWeight: number
    weightedContribution: number | null
  }>
  document?: ScorecardDocument & {
    performanceMatrix?: Array<Record<string, unknown>>
  }
  savedRecord?: SavedScorecardRecord | null
}

export interface UserScorecard {
  scorecardType: "EMPLOYEE"
  access: {
    canView: boolean
    canGenerate: boolean
  }
  employee: {
    id: string
    name: string
    email: string
    department: string | null
    role: string | null
  }
  contract?: ScorecardContract | null
  warnings: string[]
  goals: ScorecardGoal[]
  scores: {
    resultsDeliveryScore: number | string | null
    budgetScore: number | string | null
    finalScore: number | string
    performanceLabel: string
  }
  document?: ScorecardDocument & {
    performanceMatrix?: Array<Record<string, unknown>>
    taskSummary?: Array<Record<string, unknown>>
  }
  savedRecord?: SavedScorecardRecord | null
}

export interface ContractScorecard {
  scorecardType: "CEO" | "BOARD"
  access: {
    canView: boolean
    canGenerate: boolean
  }
  ceo?: {
    id: string
    name: string
    title: string
  }
  board?: {
    chairpersonId: string
    chairpersonName: string
    chairpersonTitle: string
  }
  contract?: ScorecardContract | null
  warnings: string[]
  sections: Record<string, ScorecardSection>
  agreedRatingsSummary?: AgreedRatingSummary[]
  scores?: {
    sectionScores?: Record<string, number>
    sectionBlendScore?: number
    budgetScore?: number | null
    finalScore?: number
    performanceLabel?: string
  }
  document?: ScorecardDocument
  savedRecord?: SavedScorecardRecord | null
}

export interface OrgBscGoal {
  goalId: string
  goalName: string
  goalWeight: number
  effectiveWeight: number
  targetValue: number | null
  actualValue: number | null
  progressPct: number | null
  status: string
  isReverseKpi: boolean
  isPendingApproval: boolean
  missingValue: boolean
  excludedFromScoring: boolean
  dataQualityAlert: boolean
  dataSource: string | null
  lastSyncedAt: string | null
  periodEnd: string | null
  daysRemaining: number | null
  departmentBreakdown: Array<{
    departmentId: string | null
    departmentName: string
    departmentProgress: number
    departmentStatus: string
  }>
}

export interface OrgBscPillar {
  pillarCode: string
  pillarLabel: string
  pillarWeight: number
  pillarScore: number
  pillarStatus: string
  trendVsPreviousPeriod: number | null
  dataQualityAlert: boolean
  goals: OrgBscGoal[]
}

export interface OrgBscScorecard {
  viewType: "ORG_BSC"
  organisationName: string
  reviewPeriod: string
  periodStart: string
  periodEnd: string
  lastUpdated: string
  ceoVision: {
    statement: string | null
    strategyDocumentUrl: string | null
  }
  orgBscScore: number
  orgBscStatus: string
  warnings: string[]
  alerts: Array<{
    type: string
    goalId?: string
    goalName?: string
    pillar?: string
    message: string
    triggeredAt?: string
  }>
  pillars: OrgBscPillar[]
  access?: {
    canView: boolean
    drillDownToDepartment: boolean
    drillDownToIndividual: boolean
  }
  overallScore?: number
}

export interface ScorecardGeneratePayload {
  periodStart?: string
  periodEnd?: string
  periodLabel?: string
  sectionBlendMode?: "redistribute" | "penalise"
  departmentId?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface ScorecardQueryParams {
  periodStart?: string
  periodEnd?: string
  periodLabel?: string
  sectionBlendMode?: "redistribute" | "penalise"
}

interface EmployeesForGenerationResponse {
  period: {
    periodStart: string
    periodEnd: string
    periodLabel: string
  }
  employees: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    userDepartment: string | null
    departmentRole: string | null
    roleCode: string | null
    roleName: string | null
  }>
}

const buildQuery = (params?: ScorecardQueryParams) => {
  if (!params) return ""

  const queryParams = new URLSearchParams()
  if (params.periodStart) queryParams.append("periodStart", params.periodStart)
  if (params.periodEnd) queryParams.append("periodEnd", params.periodEnd)
  if (params.periodLabel) queryParams.append("periodLabel", params.periodLabel)
  if (params.sectionBlendMode) queryParams.append("sectionBlendMode", params.sectionBlendMode)

  const qs = queryParams.toString()
  return qs ? `?${qs}` : ""
}

export const scorecardApiService = {
  async getDepartmentScorecard(departmentName: string, params?: ScorecardQueryParams): Promise<ApiResponse<DepartmentScorecard>> {
    const encodedDepartment = encodeURIComponent(departmentName)
    return apiClient.get(`/performance/scorecards/department/${encodedDepartment}${buildQuery(params)}`)
  },

  async generateDepartmentScorecard(departmentName: string, payload: ScorecardGeneratePayload = {}): Promise<ApiResponse<DepartmentScorecard>> {
    const encodedDepartment = encodeURIComponent(departmentName)
    return apiClient.post(`/performance/scorecards/department/${encodedDepartment}/generate`, payload)
  },

  async getDepartmentScorecardById(departmentId: string, params?: ScorecardQueryParams): Promise<ApiResponse<DepartmentScorecard>> {
    return apiClient.get(`/performance/scorecards/department/by-id/${departmentId}${buildQuery(params)}`)
  },

  async generateDepartmentScorecardById(departmentId: string, payload: ScorecardGeneratePayload = {}): Promise<ApiResponse<DepartmentScorecard>> {
    return apiClient.post(`/performance/scorecards/department/byid/${departmentId}/generate`, payload)
  },

  async getUserScorecard(params?: ScorecardQueryParams): Promise<ApiResponse<UserScorecard>> {
    return apiClient.get(`/performance/scorecards/user${buildQuery(params)}`)
  },

  async getEmployeeScorecard(employeeId: string, params?: ScorecardQueryParams): Promise<ApiResponse<UserScorecard>> {
    return apiClient.get(`/performance/scorecards/employee/${employeeId}${buildQuery(params)}`)
  },

  async generateEmployeeScorecard(employeeId: string, payload: ScorecardGeneratePayload = {}): Promise<ApiResponse<UserScorecard>> {
    return apiClient.post(`/performance/scorecards/employee/${employeeId}/generate`, payload)
  },

  async getCeoScorecard(params?: ScorecardQueryParams): Promise<ApiResponse<ContractScorecard>> {
    return apiClient.get(`/performance/scorecards/ceo${buildQuery(params)}`)
  },

  async generateCeoScorecard(payload: ScorecardGeneratePayload = {}): Promise<ApiResponse<ContractScorecard>> {
    return apiClient.post(`/performance/scorecards/ceo/generate`, payload)
  },

  async getBoardScorecard(params?: ScorecardQueryParams): Promise<ApiResponse<ContractScorecard>> {
    return apiClient.get(`/performance/scorecards/board${buildQuery(params)}`)
  },

  async generateBoardScorecard(payload: ScorecardGeneratePayload = {}): Promise<ApiResponse<ContractScorecard>> {
    return apiClient.post(`/performance/scorecards/board/generate`, payload)
  },

  async getOrgBscScorecard(params?: ScorecardQueryParams): Promise<ApiResponse<OrgBscScorecard>> {
    return apiClient.get(`/performance/scorecards/org-bsc${buildQuery(params)}`)
  },

  async finalizeScorecard(scorecardId: string): Promise<ApiResponse<SavedScorecardRecord>> {
    return apiClient.post(`/performance/scorecards/${scorecardId}/finalize`, {})
  },

  async getAllDepartmentScorecards(): Promise<ApiResponse<DepartmentScorecard[]>> {
    return apiClient.get(`/performance/scorecards/departments`)
  },

  async getEmployeesForGeneration(periodLabel: string): Promise<ApiResponse<EmployeesForGenerationResponse>> {
    const queryParams = new URLSearchParams()
    queryParams.append("periodLabel", periodLabel)
    return apiClient.get(`/performance/scorecards/employees-for-generation?${queryParams.toString()}`)
  },
}
