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

export interface ReconciliationWorkbench {
    session: ReconciliationSession
    bank: { id: string; name: string; accountNumber: string; currency?: { code: string } }
    statement: null | { id: string; fileName: string | null; openingBalance: number; closingBalance: number; totalDebits: number; totalCredits: number; importedAt: string; lastAutoMatchAt: string | null }
    items: Array<{ id: string; date: string; description: string; reference: string | null; debit: number; credit: number; matched: boolean; entry: null | { id: string; reference: string; description: string; date: string; amount: number; type: string } }>
    entries: Array<ReconciliationEntry & { ticked: boolean }>
    summary: { openingBalance: number | null; tickedReceipts: number; tickedPayments: number; clearedBalance: number | null; statementEndBalance: number; difference: number | null; outstandingReceipts: number; outstandingPayments: number; statementLines: number; matchedLines: number; canFinish: boolean; blockers: string[] }
}

export interface ReconciliationImportPreview {
    preview: true
    statementDate: string
    lines: number
    openingBalance: number
    closingBalance: number
    totalDebits: number
    totalCredits: number
    items: Array<{ row: number; transactionDate: string; valueDate: string | null; reference: string | null; description: string; debitAmount: number; creditAmount: number; balance: number | null }>
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
    async workbench(sessionId: string): Promise<ReconciliationWorkbench> {
        const response = await apiClient.get<AccountingResponse<ReconciliationWorkbench>>(`/cashbook/reconciliation/sessions/${sessionId}/workbench`)
        return response.data
    }
    async previewStatement(sessionId: string, file: File): Promise<ReconciliationImportPreview> {
        const body = new FormData(); body.append('file', file)
        const response = await apiClient.post<AccountingResponse<ReconciliationImportPreview>>(`/cashbook/reconciliation/sessions/${sessionId}/statement?preview=1`, body)
        return response.data
    }
    async previewBankStatement(bankId: string, file: File): Promise<ReconciliationImportPreview> {
        const body = new FormData(); body.append('file', file)
        const response = await apiClient.post<AccountingResponse<ReconciliationImportPreview>>(`/cashbook/reconciliation/banks/${bankId}/statement/preview`, body)
        return response.data
    }
    async importStatement(sessionId: string, file: File) {
        const body = new FormData(); body.append('file', file)
        return apiClient.post<AccountingResponse<{ statementId: string; lines: number }>>(`/cashbook/reconciliation/sessions/${sessionId}/statement`, body)
    }
    async autoMatch(sessionId: string) { return apiClient.post<AccountingResponse<{ matched: number; examined: number }>>(`/cashbook/reconciliation/sessions/${sessionId}/auto-match`, {}) }
    async tick(sessionId: string, cashbookEntryId: string, selected: boolean) { return apiClient.post(`/cashbook/reconciliation/sessions/${sessionId}/tick`, { cashbookEntryId, selected }) }
    async match(sessionId: string, itemId: string, cashbookEntryId: string) { return apiClient.post(`/cashbook/reconciliation/sessions/${sessionId}/lines/${itemId}/match`, { cashbookEntryId }) }
    async unmatch(sessionId: string, itemId: string) { return apiClient.post(`/cashbook/reconciliation/sessions/${sessionId}/lines/${itemId}/unmatch`, {}) }
    async book(sessionId: string, itemId: string, glAccountId: string, description?: string) { return apiClient.post(`/cashbook/reconciliation/sessions/${sessionId}/lines/${itemId}/book`, { glAccountId, description }) }
    async reopen(sessionId: string, reason: string) { return apiClient.post(`/cashbook/reconciliation/sessions/${sessionId}/reopen`, { reason }) }
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
