import { apiClient } from './api-client'

// ── Types ──────────────────────────────────────────────────────────────

export interface CapitalCallAllocationPayment {
  id: string
  capitalCallAllocationId: string
  amount: string
  recordedAt: string
  createdAt: string
  cumulativePaidThroughThisPayment?: number
  remainingOnCallAfterThisPayment?: number
}

export interface CapitalCallAllocationClient {
  id: string
  legalName: string
  email: string
}

export interface CapitalCallAllocation {
  id: string
  capitalCallId: string
  clientId: string
  investmentCommitmentId: string
  lpLegalNameSnapshot: string
  totalCommitmentSnapshot: string
  uncalledCapitalBeforeSnapshot: string
  currentCallAmount: string
  amountPaid: string
  status: string
  createdAt: string
  updatedAt: string
  client: CapitalCallAllocationClient
  payments: CapitalCallAllocationPayment[]
  statusLabel: string
}

export interface CapitalCallJournalEntry {
  id: string
  referenceNumber: string
  transactionDate: string
  status: string
  auditTrailSequenceNumber: number
}

export interface CapitalCall {
  id: string
  fundId: string
  currencyId: string
  callPercent: string
  paymentDueDate: string
  bankInstructions: string
  transactionDate: string
  journalEntryId: string
  status: string
  noticesSentAt: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  fund: { name: string }
  currency: { code: string; symbol: string }
  allocations: CapitalCallAllocation[]
  journalEntry: CapitalCallJournalEntry
  statusLabel: string
}

export interface CapitalCallSummaryRow {
  id: string
  callPercent: string
  paymentDueDate: string
  transactionDate: string
  status: string
  noticesSentAt: string | null
  journalEntryId: string
  createdAt: string
  _count: { allocations: number }
  statusLabel: string
}

export interface LpSummaryRow {
  clientId: string
  legalName: string
  email: string
  commitmentId: string
  currency: string
  totalCommitment: number
  cumulativeCalled: number
  uncalledCommitmentBalance: number
  amountReceivedTowardCalls: number
  outstandingCallBalance: number
  uncalledCapitalNetOfReceipts: number
}

export interface NoticeData {
  fundId: string
  capitalCallId: string
  allocationId: string
  fundName: string
  lpLegalName: string
  currencyCode: string
  currencySymbol: string
  callPercent: number
  totalCommitment: number
  uncalledCapital: number
  uncalledCapitalBeforeThisCall: number
  currentCallAmount: number
  paymentDueDate: string
  bankInstructions: string
  emailSubjectHint: string
}

export interface PaymentContext {
  fundId: string
  fundName: string
  capitalCallId: string
  callPercent: number
  paymentDueDate: string
  callTransactionDate: string
  currencyCode: string
  currencySymbol: string
  journalEntry: CapitalCallJournalEntry
  allocation: {
    id: string
    lpLegalNameSnapshot: string
    clientId: string
    clientLegalName: string
    clientEmail: string
    totalCommitmentSnapshot: number
    uncalledCapitalBeforeSnapshot: number
    currentCallAmount: number
    amountPaidToDate: number
    remainingOnCall: number
    status: string
    statusLabel: string
  }
}

// ── API ────────────────────────────────────────────────────────────────

export const capitalCallsApi = {
  /** 1b. List capital calls for a fund */
  list: async (fundId: string): Promise<{ success: boolean; data: CapitalCallSummaryRow[] }> => {
    return apiClient.get(`/funds/${fundId}/capital-calls`)
  },

  /** 1a. Initiate a capital call */
  initiate: async (
    fundId: string,
    data: {
      callPercent: number
      paymentDueDate: string
      transactionDate: string
      bankInstructions: string
    }
  ): Promise<{ success: boolean; message: string; data: CapitalCall }> => {
    return apiClient.post(`/funds/${fundId}/capital-calls`, data)
  },

  /** 3. LP summary */
  lpSummary: async (
    fundId: string
  ): Promise<{ success: boolean; data: { fundId: string; byLp: LpSummaryRow[] } }> => {
    return apiClient.get(`/funds/${fundId}/capital-calls/lp-summary`)
  },

  /** 4. Get one capital call detail */
  detail: async (
    fundId: string,
    capitalCallId: string
  ): Promise<{ success: boolean; data: CapitalCall }> => {
    return apiClient.get(`/funds/${fundId}/capital-calls/${capitalCallId}`)
  },

  /** 5. Notice JSON for an allocation */
  notice: async (
    fundId: string,
    capitalCallId: string,
    allocationId: string
  ): Promise<{ success: boolean; data: NoticeData }> => {
    return apiClient.get(
      `/funds/${fundId}/capital-calls/${capitalCallId}/allocations/${allocationId}/notice`
    )
  },

  /** 6. Send notices (HTML + PDF) to all LPs */
  sendNotices: async (
    fundId: string,
    capitalCallId: string
  ): Promise<{ success: boolean; message: string; data: CapitalCall }> => {
    return apiClient.post(`/funds/${fundId}/capital-calls/${capitalCallId}/send-notices`)
  },

  /** 7a. Record payment on allocation */
  recordPayment: async (
    fundId: string,
    capitalCallId: string,
    allocationId: string,
    amount: number
  ): Promise<{ success: boolean; message: string; data: CapitalCall }> => {
    return apiClient.post(
      `/funds/${fundId}/capital-calls/${capitalCallId}/allocations/${allocationId}/payments`,
      { amount }
    )
  },

  /** 7b. Payment ledger for allocation */
  paymentLedger: async (
    fundId: string,
    capitalCallId: string,
    allocationId: string
  ): Promise<{
    success: boolean
    data: { context: PaymentContext; payments: CapitalCallAllocationPayment[] }
  }> => {
    return apiClient.get(
      `/funds/${fundId}/capital-calls/${capitalCallId}/allocations/${allocationId}/payments`
    )
  },
}

// ── LPs (Clients) ──────────────────────────────────────────────────────

export interface ClientCreateRequest {
  investor_id?: string
  type?: 'individual' | 'entity' | 'trust' | string
  legal_name: string
  email: string
  country?: string
  phone?: string
  address?: string
  tax_id?: string
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE'
  notes?: string
  // Optional initial commitment
  fund_id?: string
  amount?: number
  currency?: string
  effective_date?: string
}

export interface ClientRecord {
  id: string
  investorId: string
  type: string
  legalName: string
  email: string
  country: string
  phone: string | null
  address: string | null
  taxId: string | null
  status: string
  /** null means the client has not yet been linked to a portal User account — prerequisite for LP Portal access */
  userId?: string | null
  createdAt: string
  updatedAt: string
  investmentCommitments?: Array<{
    id: string
    clientId: string
    fundId: string
    amount: string
    currency: string
    effectiveDate: string
    status: string
    notes: string | null
    createdAt: string
    updatedAt: string
    fund?: { id: string; name: string; description: string; status: string }
  }>
}

// GET /clients uses a distinct wrapper shape (data.clients + sibling pagination
// fields) rather than the usual `data` = array-directly convention.
export interface ClientsListResponse {
  success: boolean
  data: {
    clients: ClientRecord[]
    total: number
    page: number
    totalPages: number
  }
}

export const clientsApi = {
  /** 0a. Create LP (client) + optional fund commitment */
  create: async (
    body: ClientCreateRequest
  ): Promise<{ success: boolean; message: string; data: ClientRecord }> => {
    return apiClient.post('/clients', body)
  },

  /** 0b. Add/update commitment on existing LP */
  update: async (
    id: string,
    body: Partial<ClientCreateRequest>
  ): Promise<{ success: boolean; message: string; data: ClientRecord }> => {
    return apiClient.put(`/clients/${id}`, body)
  },

  /** List/search clients — used by LP Management's client pickers */
  list: async (params?: { page?: number; search?: string }): Promise<ClientsListResponse> => {
    const q = new URLSearchParams()
    if (params?.page) q.append('page', String(params.page))
    if (params?.search) q.append('search', params.search)
    const qs = q.toString()
    return apiClient.get(`/clients${qs ? `?${qs}` : ''}`)
  },

  /** Links a Client to a User account — prerequisite for LP portal access */
  linkUser: async (
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string; data: ClientRecord }> => {
    return apiClient.put(`/clients/${id}/link-user`, { userId })
  },
}
