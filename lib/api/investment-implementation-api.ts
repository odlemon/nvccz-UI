import { apiClient } from './api-client'

export interface InvestmentImplementationData {
  id: string
  portfolioCompanyId: string
  applicationId: string
  fundId: string
  implementationPlan: string
  notes: string
  disbursementMode: 'MILESTONE_BASED' | 'ONE_TIME'
  totalCommittedAmount: number
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  milestones?: MilestoneData[]
  checklist?: ChecklistData,
  fundDisbursements?: any[]
}

export interface MilestoneData {
  id: string
  investmentImplementationId: string
  title: string
  description: string
  amount: number
  dueDate: string
  deliverables: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ChecklistData {
  id: string
  investmentImplementationId: string
  finalDueDiligence: boolean
  contractsSigned: boolean
  fundsDisbursed: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DisbursementSummaryData {
  totalCommittedAmount: number
  totalDisbursedAmount: number
  remainingCommittedAmount: number
  undrawnCommittedAmount?: number
  disbursementCount: number
  disbursementMode: string
  complianceCleared?: boolean
  kycVerified?: boolean
  disbursementBlockedReason?: string
  disbursements: Array<{
    id: string
    trancheIndex?: number
    cfoApprovalStatusLabel?: string
    milestoneId?: string
    amount: string
    status: string
    disbursementType: string
    disbursementDate: string
    approvedAt?: string
    transactionReference?: string
    disbursedById?: string
    disbursedAt?: string
  }>
}

export interface DisbursementBank {
  id: string
  name: string
  accountNumber: string
  currencyId: string
  currencyCode: string
  currencyName: string
  glAccount: {
    id: string
    accountNo: string
    accountName: string
    accountType: string
  }
}

export interface PendingDisbursement {
  id: string
  trancheIndex: number
  amount: string
  status: string
  cfoApprovalStatusLabel: string
  disbursementType: string
  disbursementDate: string
  investmentImplementation?: any
}

export interface InvestmentImplementationCreateRequest {
  portfolioCompanyId: string
  applicationId: string
  fundId: string
  implementationPlan: string
  notes?: string
  disbursementMode: 'MILESTONE_BASED' | 'ONE_TIME'
  totalCommittedAmount?: number
  disbursementPeriods?: Array<{
    label: string
    dueDate: string
    amount?: number
  }>
}

export interface MilestoneCreateRequest {
  title: string
  description: string
  amount: number
  dueDate: string
  deliverables: string
}

export interface ChecklistUpdateRequest {
  finalDueDiligence: boolean
  contractsSigned: boolean
  fundsDisbursed: boolean
  notes?: string
}

export interface InvestmentImplementationResponse {
  success: boolean
  message: string
  data: InvestmentImplementationData
  timestamp: string
}

export interface DisbursementSummaryResponse {
  success: boolean
  message: string
  data: DisbursementSummaryData
}

class InvestmentImplementationApiService {
  // Initiate investment implementation
  async initiate(data: InvestmentImplementationCreateRequest): Promise<InvestmentImplementationResponse> {
    return apiClient.post<InvestmentImplementationResponse>('/investment-implementations/initiate', data)
  }

  // Get investment implementation by application ID
  async getByApplicationId(applicationId: string): Promise<InvestmentImplementationResponse> {
    return apiClient.get<InvestmentImplementationResponse>(`/investment-implementations/${applicationId}`)
  }

  // Get investment implementation by ID
  async getById(id: string): Promise<InvestmentImplementationResponse> {
    return apiClient.get<InvestmentImplementationResponse>(`/investment-implementations/${id}`)
  }

  // Update investment implementation
  async update(applicationId: string, data: Partial<InvestmentImplementationCreateRequest>): Promise<InvestmentImplementationResponse> {
    return apiClient.put<InvestmentImplementationResponse>(`/investment-implementations/${applicationId}`, data)
  }

  // Create milestone
  async createMilestone(implementationId: string, data: MilestoneCreateRequest): Promise<any> {
    return apiClient.post<any>(`/investment-implementations/${implementationId}/milestones`, data)
  }

  // Update checklist
  async updateChecklist(implementationId: string, data: ChecklistUpdateRequest): Promise<any> {
    return apiClient.put<any>(`/investment-implementations/${implementationId}/checklist`, data)
  }

  // Get disbursement summary
  async getDisbursementSummary(implementationId: string): Promise<DisbursementSummaryResponse> {
    return apiClient.get<DisbursementSummaryResponse>(`/investment-implementations/${implementationId}/disbursement-summary`)
  }

  // ── CFO Disbursement Flow ──────────────────────────────────────────

  /** Get signed term sheets ready for implementation */
  async getSignedTermSheets(page = 1, limit = 10): Promise<any> {
    return apiClient.get(`/investment-implementations/signed-term-sheets?page=${page}&limit=${limit}`)
  }

  /** List banks + GL accounts for CFO disbursement picker */
  async getDisbursementBanks(paymentCurrencyId?: string): Promise<{ success: boolean; data: DisbursementBank[] }> {
    const qs = paymentCurrencyId ? `?paymentCurrencyId=${paymentCurrencyId}` : ''
    return apiClient.get(`/investment-implementations/disbursement-banks${qs}`)
  }

  /** List pending disbursement requests */
  async getPendingDisbursements(): Promise<{ success: boolean; data: PendingDisbursement[] }> {
    return apiClient.get('/investment-implementations/disbursements/pending')
  }

  /** CFO: Approve or reject disbursement */
  async disbursementDecision(
    disbursementId: string,
    decision: 'APPROVE' | 'REJECT',
    bankId?: string,
    reason?: string
  ): Promise<any> {
    const body: any = { decision }
    if (decision === 'APPROVE' && bankId) body.bankId = bankId
    if (decision === 'REJECT' && reason) body.reason = reason
    return apiClient.post(`/investment-implementations/disbursements/${disbursementId}/decision`, body)
  }

  /** Create disbursement tranche with paymentCurrencyId */
  async createDisbursement(data: {
    investmentImplementationId: string
    amount: number
    disbursementDate: string
    disbursementType: string
    notes?: string
    paymentCurrencyId?: string
  }): Promise<any> {
    return apiClient.post('/investment-implementations/disbursements', data)
  }
}

export const investmentImplementationApi = new InvestmentImplementationApiService()

