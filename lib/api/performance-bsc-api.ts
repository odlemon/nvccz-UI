import { apiClient } from "./api-client"

export interface BscPeriodFields {
  frequency?: string
  periodLabel?: string
  periodStart?: string
  periodEnd?: string
  responsibleUserId?: string
}

export interface ContractCreatePayload {
  periodYear?: number
  periodLabel?: string
  periodStart?: string
  periodEnd?: string
  title?: string
  subjectUserId?: string
  reviewerUserId?: string
  approverUserId?: string
  departmentName?: string
  firstName?: string
  lastName?: string
  createdById?: string
}

const appendFormValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return
  if (value instanceof File) {
    formData.append(key, value)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => appendFormValue(formData, key, item))
    return
  }
  if (typeof value === "object") {
    formData.append(key, JSON.stringify(value))
    return
  }
  formData.append(key, String(value))
}

const toFormData = (payload: Record<string, unknown>) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => appendFormValue(formData, key, value))
  return formData
}

export const performanceBscApiService = {
  // Flow 1: BSC digital data entry
  recordFinancialOutcomeRoi(payload: {
    goalId: string
    netProfit: number
    totalCapitalInvested: number
    currencyCode?: string
    skipCeoBoardMirror?: boolean
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/financial-outcome-roi", payload)
  },

  recordInternalProcessFundingRate(payload: {
    goalId: string
    projectsFunded: number
    projectsApproved: number
    fundId?: string
    targetPercent?: number
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/internal-process-funding-rate", payload)
  },

  recordStakeholderSurvey(payload: {
    goalId: string
    averageScore?: number
    surveyAverageScore?: number
    meanScore?: number
    scoreTotal?: number
    scaleMaximum?: number
    totalScalePoints?: number
    maxScore?: number
    previousAverageScore?: number
    previousSurveyAverageScore?: number
    previousMeanScore?: number
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/stakeholder-survey", payload)
  },

  recordPartnershipsSigned(payload: {
    goalId: string
    incrementBy?: number
    mouFile?: File
    signedMouDocumentUrl?: string
    mouDocumentUrl?: string
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/partnerships-signed", toFormData(payload as unknown as Record<string, unknown>))
  },

  recordServiceDeliveryCustomerCharter(payload: {
    goalId: string
    addPercent?: number
    charterAvailableLocalLanguages?: boolean
    supportingDocuments?: File[]
    supportingDocumentUrls?: string[] | string
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/service-delivery-customer-charter", toFormData(payload as unknown as Record<string, unknown>))
  },

  recordJobsCreatedAggregate(payload: {
    goalId: string
    totalFullTimeJobs: number
    fundId?: string
    excludeStatuses?: string[]
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/jobs-created-aggregate", payload)
  },

  recordResourceBudgetAlignment(payload: {
    goalId: string
    actualSpend: number
    strategicAllocation: number
    criticalOverspendPercent?: number
    currencyCode?: string
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/resource-budget-alignment", payload)
  },

  recordInclusionDiversityReporting(payload: {
    goalId: string
    groupCounts?: Record<string, number>
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/inclusion-diversity-reporting", payload)
  },

  recordAccountingPeriodFromGl(payload: {
    periodStart: string
    periodEnd: string
    revenueGoalId?: string
    netProfitGoalId?: string
    currencyCode?: string
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/accounting-period-from-gl", payload)
  },

  recordStatutoryReportsOutput(payload: {
    goalId: string
    incrementBy?: number
    evidenceFile?: File
    evidenceDocumentUrl?: string
    documentUrl?: string
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/statutory-reports-output", toFormData(payload as unknown as Record<string, unknown>))
  },

  recordGovernanceChecklistScore(payload: {
    goalId: string
    complianceItemsMet?: number
    itemsMet?: number
    totalGovernanceRequirements?: number
    totalItems?: number
    requirementsTotal?: number
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/governance-checklist-score", payload)
  },

  recordProcurementPlanCompliance(payload: {
    goalId: string
    actualProcured?: number
    closedPurchaseOrdersValue?: number
    annualPlanned?: number
    approvedAnnualPlanValue?: number
    currencyCode?: string
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/procurement-plan-compliance", payload)
  },

  recordEaseOfDoingBusinessProgress(payload: {
    goalId: string
    innovationsCompleted?: number
    completedCount?: number
    targetInnovations?: number
    targetCount?: number
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/ease-of-doing-business-progress", payload)
  },

  recordSkillsDevelopmentProgress(payload: {
    goalId: string
    completedCount?: number
    certificatesApproved?: number
    targetCount?: number
    planTargetCount?: number
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/skills-development-progress", payload)
  },

  recordCsrParticipationRate(payload: {
    goalId: string
    participantsCompleted?: number
    attendedCount?: number
    participantsEligible?: number
    eligibleCount?: number
  } & BscPeriodFields) {
    return apiClient.post("/performance/bsc-entry/csr-participation-rate", payload)
  },

  // Flow 2: workflow
  createBudgetVarianceReport(payload: {
    performanceGoalId?: string
    goalId?: string
    narrative?: string
    varianceAnalysis?: string
    periodLabel?: string
    periodStart?: string
    periodEnd?: string
    actualSpend?: number
    strategicAllocation?: number
  }) {
    return apiClient.post("/performance/bsc-workflow/budget-variance-reports", payload)
  },

  getBudgetVarianceReportsByGoal(goalId: string) {
    return apiClient.get(`/performance/bsc-workflow/budget-variance-reports/by-goal/${goalId}`)
  },

  createStatutorySubmission(payload: {
    goalId: string
    evidenceFile?: File
    evidenceDocumentUrl?: string
    documentUrl?: string
    incrementBy?: number
    frequency?: string
    periodLabel?: string
  }) {
    return apiClient.post("/performance/bsc-workflow/statutory-submissions", toFormData(payload as unknown as Record<string, unknown>))
  },

  managerSignOffStatutorySubmission(id: string, payload?: { note?: string; managerSignOffNote?: string }) {
    return apiClient.post(`/performance/bsc-workflow/statutory-submissions/${id}/manager-sign-off`, payload || {})
  },

  getStatutorySubmissionsByGoal(goalId: string) {
    return apiClient.get(`/performance/bsc-workflow/statutory-submissions/by-goal/${goalId}`)
  },

  recordTrainingCertificate(payload: {
    goalId: string
    incrementBy?: number
    frequency?: string
    periodLabel?: string
    periodStart?: string
    periodEnd?: string
  }) {
    return apiClient.post("/performance/bsc-workflow/training-certificate-recorded", payload)
  },

  // Flow 3: contracts
  createBoardContract(payload: ContractCreatePayload) {
    return apiClient.post("/performance/contracts/board", payload)
  },

  createCeoContract(payload: ContractCreatePayload) {
    return apiClient.post("/performance/contracts/ceo", payload)
  },

  createDepartmentContract(payload: ContractCreatePayload & { departmentName: string }) {
    return apiClient.post("/performance/contracts/department", payload)
  },

  createEmployeeContract(payload: ContractCreatePayload & { subjectUserId: string }) {
    return apiClient.post("/performance/contracts/employee", payload)
  },
}
