import { apiClient } from './api-client'
import { AccountingResponse } from './chart-of-accounts-api'

// --- RECONCILIATION TYPES ---

export interface ReconciliationEntry {
    id: string
    transactionDate: string
    type: 'RECEIPT' | 'PAYMENT'
    description: string
    reference: string
    amount: number
    received: number
    paid: number
    signedAmount: number
    status: string
    isReconciled: boolean
    counterpartyType: string
    counterparty: string
    cashbookReconciliationSessionId: string | null
}

export interface ReconciliationSessionLine {
    id: string
    cashbookEntryId: string
    selected: boolean
    entry: ReconciliationEntry & {
        stats?: {
            selectedForSession: boolean
            posted: boolean
            reconciledOnBooks: boolean
            clearedByThisSession: boolean
            reconciliationSessionId: string | null
        }
    }
}

export interface ReconciliationTotals {
    openingBalance: number
    totalSelectedReceived: number
    totalSelectedPaid: number
    reconciledBalance: number
    statementEndBalance: number
    difference: number
}

export interface ReconciliationSession {
    id: string
    bankId: string
    status: 'DRAFT' | 'FINALIZED' | 'CANCELLED'
    statementDate: string
    statementEndBalance: number
    reference: string
    openingBalance: number
    closingBalance: number
    priorClosingBalanceFromLastFinalized: number
    createdById: string
    finishedById: string | null
    finishedAt: string | null
    createdAt: string
    updatedAt: string
    totals: ReconciliationTotals
    lines: ReconciliationSessionLine[]
}

export interface CreateSessionRequest {
    statementDate: string
    statementEndBalance: number
    reference?: string
    openingBalance?: number
    selectedEntryIds?: string[]
}

export interface UpdateSessionRequest {
    statementDate?: string
    statementEndBalance?: number
    reference?: string
    openingBalance?: number
    lines?: Array<{ cashbookEntryId: string; selected: boolean }>
}

// --- RECONCILIATION API ---
class ReconciliationApiService {
    // Get candidate entries for a bank
    async getReconciliationEntries(bankId: string, asOf: string, includeReconciled?: boolean): Promise<AccountingResponse<ReconciliationEntry[]>> {
        const params = new URLSearchParams({ asOf })
        if (includeReconciled) params.append('includeReconciled', 'true')
        return apiClient.get<AccountingResponse<ReconciliationEntry[]>>(
            `/cashbook/reconciliation/banks/${bankId}/entries?${params.toString()}`
        )
    }

    // List sessions for a bank
    async listSessions(bankId: string): Promise<AccountingResponse<ReconciliationSession[]>> {
        return apiClient.get<AccountingResponse<ReconciliationSession[]>>(
            `/cashbook/reconciliation/banks/${bankId}/sessions`
        )
    }

    // Create a draft session
    async createDraftSession(bankId: string, data: CreateSessionRequest): Promise<AccountingResponse<ReconciliationSession>> {
        return apiClient.post<AccountingResponse<ReconciliationSession>>(
            `/cashbook/reconciliation/banks/${bankId}/sessions`,
            data
        )
    }

    // Get a single session
    async getSession(sessionId: string): Promise<AccountingResponse<ReconciliationSession>> {
        return apiClient.get<AccountingResponse<ReconciliationSession>>(
            `/cashbook/reconciliation/sessions/${sessionId}`
        )
    }

    // Update a draft session
    async updateDraftSession(sessionId: string, data: UpdateSessionRequest): Promise<AccountingResponse<ReconciliationSession>> {
        return apiClient.patch<AccountingResponse<ReconciliationSession>>(
            `/cashbook/reconciliation/sessions/${sessionId}`,
            data
        )
    }

    // Finish a session (finalize)
    async finishSession(sessionId: string): Promise<AccountingResponse<ReconciliationSession>> {
        return apiClient.post<AccountingResponse<ReconciliationSession>>(
            `/cashbook/reconciliation/sessions/${sessionId}/finish`
        )
    }

    // Discard a session
    async discardSession(sessionId: string): Promise<AccountingResponse<{ id: string; status: string }>> {
        return apiClient.post<AccountingResponse<{ id: string; status: string }>>(
            `/cashbook/reconciliation/sessions/${sessionId}/discard`
        )
    }

    // Get reconciliation display (legacy/summary)
    async getReconciliationDisplay(bankId: string, periodEndDate: string): Promise<AccountingResponse<any>> {
        return apiClient.get<AccountingResponse<any>>(
            `/cashbook/reconciliation/display?bankId=${bankId}&periodEndDate=${periodEndDate}`
        )
    }
}

export const reconciliationApi = new ReconciliationApiService()
