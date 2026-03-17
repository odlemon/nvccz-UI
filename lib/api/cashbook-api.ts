import { apiClient } from './api-client'
import { AccountingResponse } from './chart-of-accounts-api'

// --- CASHBOOK TYPES ---
export interface CashbookBank {
    id: string
    name: string
    accountNumber: string
    currencyId: string
    glAccountId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    glAccount: {
        id: string
        accountNo: string
        accountName: string
        accountType: string
        financialStatement: string
        notes: string
        parentId: string | null
        isActive: boolean
        createdAt: string
        updatedAt: string
    }
    currency: {
        id: string
        code: string
        name: string
        symbol: string
        isActive: boolean
        isDefault: boolean
        createdAt: string
        updatedAt: string
    }
}

export interface CashbookEntry {
    id: string
    bankId: string
    transactionDate: string
    description: string
    amount: string
    type: 'RECEIPT' | 'PAYMENT'
    reference: string
    status: string
    counterpartyType: 'CUSTOMER' | 'VENDOR' | 'GL' | 'SUPPLIER'
    glAccountId: string | null
    customerId: string | null
    vendorId: string | null
    journalEntryId: string | null
    isReconciled: boolean
    reconciledAt: string | null
    reconciledById: string | null
    createdById: string
    createdAt: string
    updatedAt: string
    customer?: any
    vendor?: any
    glAccount?: any
    bank?: any
}

export interface CashbookBankPosition {
    bankId: string
    balance: number
    currencyId: string
    lastTransactionDate?: string
    openingBalance: number
    closingBalance: number
    totalReceipts: number
    totalPayments: number
    reconciledBalance: number
    unreconciledBalance: number
}

// --- CASHBOOK REPORT TYPES ---
export interface CashbookCashFlowEntry {
    id: string
    date: string
    type: 'RECEIPT' | 'PAYMENT'
    description: string
    amount: number
    reference: string
    counterparty: string
    bank: string
}

export interface CashbookCashFlowSummary {
    totalReceipts: number
    totalPayments: number
    netCashFlow: number
}

export interface CashbookCashFlowReport {
    period: {
        startDate: string
        endDate: string
    }
    summary: CashbookCashFlowSummary
    entries: CashbookCashFlowEntry[]
}

export interface CashbookBalanceCheckBank {
    id: string
    name: string
    accountNumber: string
    currency: string
}

export interface CashbookBalanceCheckCashbook {
    totalReceipts: number
    totalPayments: number
    netBalance: number
    entryCount: number
    reconciledCount: number
    unreconciledCount: number
}

export interface CashbookBalanceCheckReconciliation {
    totalReceipts: number
    totalPayments: number
    netBalance: number
    reconciliationCount: number
    matchedTransactions: number
    unmatchedTransactions: number
}

export interface CashbookBalanceCheckDifferences {
    receiptDifference: number
    paymentDifference: number
    netDifference: number
    isBalanced: boolean
}

export interface CashbookBalanceCheckStatus {
    isBalanced: boolean
    hasUnreconciledEntries: boolean
    hasUnmatchedTransactions: boolean
    needsAttention: boolean
}

export interface CashbookBalanceCheckSummary {
    message: string
    recommendations: string[]
}

export interface CashbookBalanceCheckReport {
    bank: CashbookBalanceCheckBank
    period: {
        startDate: string
        endDate: string
    }
    cashbook: CashbookBalanceCheckCashbook
    bankReconciliation: CashbookBalanceCheckReconciliation
    differences: CashbookBalanceCheckDifferences
    status: CashbookBalanceCheckStatus
    summary: CashbookBalanceCheckSummary
}

// --- CASHBOOK TRANSACTION TYPES ---
export interface CashbookTransaction {
    id: string
    bankId: string
    transactionDate: string
    description: string
    amount: string
    type: 'RECEIPT' | 'PAYMENT'
    reference: string
    status: string
    counterpartyType: 'CUSTOMER' | 'VENDOR' | 'GL' | 'SUPPLIER'
    glAccountId: string | null
    customerId: string | null
    vendorId: string | null
    journalEntryId: string | null
    isReconciled: boolean
    reconciledAt: string | null
    reconciledById: string | null
    createdById: string
    createdAt: string
    updatedAt: string
    isReversed?: boolean
    reversedAt?: string | null
    reversedById?: string | null
    reversalId?: string | null
    originalTransactionId?: string | null
    bank?: CashbookBank
    customer?: any
    vendor?: any
    glAccount?: any
}

// --- OPEN ITEMS TYPES ---
export interface OpenItem {
    id: string
    customerId?: string
    vendorId?: string
    invoiceNumber: string
    dueDate: string
    originalAmount: string
    outstandingAmount: string
    currency: string
    description: string
    status: string
}

export interface Allocation {
    openItemId: string
    allocatedAmount: number
    discountAmount: number
    description: string
}

// --- CASHBOOK API ---
class CashbookApiService {
    // Cashbook Banks
    async getCashbookBanks(params?: { currencyId?: string }): Promise<AccountingResponse<CashbookBank[]>> {
        const query = params?.currencyId ? `?currencyId=${params.currencyId}` : ''
        return apiClient.get<AccountingResponse<CashbookBank[]>>(`/cashbook/banks${query}`)
    }

    // Cashbook Entries
    async getCashbookEntries(params: {
        bankId: string
        type?: 'RECEIPT' | 'PAYMENT'
        status?: string
        startDate?: string
        endDate?: string
        currencyId?: string
    }): Promise<AccountingResponse<CashbookEntry[]>> {
        const { bankId, ...query } = params
        const queryString = Object.keys(query).length
            ? '?' + new URLSearchParams(
                Object.entries(query)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, String(v)])
            ).toString()
            : ''
        return apiClient.get<AccountingResponse<CashbookEntry[]>>(`/cashbook/entries${queryString}`)
    }

    // Create Receipt
    async createCashbookReceipt(data: any): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/receipts', data)
    }

    // Create Payment
    async createCashbookPayment(data: any): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/payments', data)
    }

    // Cashbook Bank Position
    async getCashbookBankPosition(bankId: string): Promise<AccountingResponse<CashbookBankPosition>> {
        return apiClient.get<AccountingResponse<CashbookBankPosition>>(`/cashbook/${bankId}/position`)
    }

    // Cashbook Reports
    async getCashbookCashFlowReport(params: { bankId: string; startDate: string; endDate: string }): Promise<AccountingResponse<CashbookCashFlowReport>> {
        const queryString = `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
        return apiClient.get<AccountingResponse<CashbookCashFlowReport>>(`/cashbook/reports/cashflow${queryString}`)
    }

    async getCashbookBalanceCheck(params: { bankId: string; startDate: string; endDate: string }): Promise<AccountingResponse<CashbookBalanceCheckReport>> {
        const queryString = `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
        return apiClient.get<AccountingResponse<CashbookBalanceCheckReport>>(`/cashbook/balance-check${queryString}`)
    }

    // Cashbook Batches
    async getCashbookBatches(params?: { currencyId?: string }): Promise<AccountingResponse<any[]>> {
        const query = params?.currencyId ? `?currencyId=${params.currencyId}` : ''
        return apiClient.get<AccountingResponse<any[]>>(`/cashbook/batches${query}`)
    }

    async postCashbookBatch(batchId: string): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>(`/cashbook/batches/${batchId}/post`)
    }

    async createCashbookBatchImport(file: File): Promise<AccountingResponse<any>> {
        const formData = new FormData()
        formData.append('file', file)
        return apiClient.post<AccountingResponse<any>>('/cashbook/batches/import', formData)
    }

    // Open Items
    async getOpenItemsForCustomer(customerId: string): Promise<AccountingResponse<OpenItem[]>> {
        return apiClient.get<AccountingResponse<OpenItem[]>>(`/cashbook/open-items/customers/${customerId}`)
    }

    async getOpenItemsForSupplier(supplierId: string): Promise<AccountingResponse<OpenItem[]>> {
        return apiClient.get<AccountingResponse<OpenItem[]>>(`/cashbook/open-items/suppliers/${supplierId}`)
    }

    // Match Open Items
    async matchOpenItems(entryId: string, allocations: Allocation[]): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>(`/cashbook/open-items/match/${entryId}`, { allocations })
    }

    // Get Transaction Reversal History
    async getTransactionReversalHistory(transactionId: string): Promise<AccountingResponse<any[]>> {
        return apiClient.get<AccountingResponse<any[]>>(`/cashbook/transactions/${transactionId}/reversal-history`)
    }

    // Reverse Transaction
    async reverseTransaction(transactionId: string, data: any): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>(`/cashbook/transactions/${transactionId}/reverse`, data)
    }

    // Get Cashbook Transfers
    async getCashbookTransfers(params: {
        page?: number
        limit?: number
        fromBankId?: string
        toBankId?: string
        dateFrom?: string
        dateTo?: string
        currencyId?: string
    }): Promise<AccountingResponse<any[]>> {
        const queryString = new URLSearchParams(
            Object.entries(params)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
        ).toString()
        return apiClient.get<AccountingResponse<any[]>>(`/cashbook/transfers?${queryString}`)
    }

    // Create Cashbook Transfer
    async createCashbookTransfer(data: {
        fromBankId: string
        toBankId: string
        amount: number
        transferDate: string
        description: string
        reference: string
        projectCode?: string
    }): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/transfers', data)
    }

    // Cashbook Transactions
    async getCashbookTransactions(params?: {
        type?: 'RECEIPT' | 'PAYMENT'
        status?: string
        bankId?: string
        page?: number
        limit?: number
    }): Promise<AccountingResponse<{ reversals: CashbookTransaction[]; pagination: any }>> {
        const queryParams = new URLSearchParams()
        if (params?.type) queryParams.append('type', params.type)
        if (params?.status) queryParams.append('status', params.status)
        if (params?.bankId) queryParams.append('bankId', params.bankId)
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())

        return apiClient.get<AccountingResponse<{ reversals: CashbookTransaction[]; pagination: any }>>(`/cashbook/transactions?${queryParams.toString()}`)
    }

    // Entry Types Management
    async getEntryTypes(filters?: { transactionType?: string; isActive?: boolean }): Promise<AccountingResponse<any[]>> {
        const queryParams = new URLSearchParams()
        if (filters?.transactionType) queryParams.append('transactionType', filters.transactionType)
        if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString())
        return apiClient.get<AccountingResponse<any[]>>(`/cashbook/entry-types?${queryParams.toString()}`)
    }

    async createEntryType(data: {
        name: string
        description?: string
        transactionType: 'RECEIPT' | 'PAYMENT'
        counterpartyType: 'GL' | 'CUSTOMER' | 'SUPPLIER'
        defaultGlAccountId?: string
        isActive?: boolean
        requiresProjectCode?: boolean
        requiresReference?: boolean
        autoGenerateReference?: boolean
        referencePrefix?: string
        debitCreditLogic?: 'AUTO' | 'MANUAL'
        defaultDebitCredit?: 'DEBIT' | 'CREDIT'
    }): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/entry-types', data)
    }

    async updateEntryType(id: string, data: Partial<{
        name: string
        description?: string
        transactionType: 'RECEIPT' | 'PAYMENT'
        counterpartyType: 'GL' | 'CUSTOMER' | 'SUPPLIER'
        defaultGlAccountId?: string
        isActive?: boolean
        requiresProjectCode?: boolean
        requiresReference?: boolean
        autoGenerateReference?: boolean
        referencePrefix?: string
        debitCreditLogic?: 'AUTO' | 'MANUAL'
        defaultDebitCredit?: 'DEBIT' | 'CREDIT'
    }>): Promise<AccountingResponse<any>> {
        return apiClient.put<AccountingResponse<any>>(`/cashbook/entry-types/${id}`, data)
    }

    async deleteEntryType(id: string): Promise<AccountingResponse<any>> {
        return apiClient.delete<AccountingResponse<any>>(`/cashbook/entry-types/${id}`)
    }

    // Period Lockout Management
    async getPeriods(filters?: { year?: number; isLocked?: boolean }): Promise<AccountingResponse<any[]>> {
        const queryParams = new URLSearchParams()
        if (filters?.year) queryParams.append('year', filters.year.toString())
        if (filters?.isLocked !== undefined) queryParams.append('isLocked', filters.isLocked.toString())
        return apiClient.get<AccountingResponse<any[]>>(`/cashbook/periods?${queryParams.toString()}`)
    }

    async lockPeriod(data: { period: string; isLocked: boolean; reason?: string }): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/periods/lock', data)
    }

    async getPeriodStatus(period: string): Promise<AccountingResponse<any>> {
        return apiClient.get<AccountingResponse<any>>(`/cashbook/periods/${period}/status`)
    }

    async validateTransactionDate(transactionDate: string): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/periods/validate-date', { transactionDate })
    }

    // Contra Entry Management
    async getContraConfigs(filters?: { entryType?: string; glAccountId?: string; isEnabled?: boolean }): Promise<AccountingResponse<any[]>> {
        const queryParams = new URLSearchParams()
        if (filters?.entryType) queryParams.append('entryType', filters.entryType)
        if (filters?.glAccountId) queryParams.append('glAccountId', filters.glAccountId)
        if (filters?.isEnabled !== undefined) queryParams.append('isEnabled', filters.isEnabled.toString())
        return apiClient.get<AccountingResponse<any[]>>(`/cashbook/contra/configs?${queryParams.toString()}`)
    }

    async configureContraEntry(data: {
        entryType: 'RECEIPT' | 'PAYMENT'
        glAccountId: string
        contraType: 'DETAILED' | 'SUMMARY'
        isEnabled: boolean
    }): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/contra/configure', data)
    }

    async updateContraConfig(id: string, data: Partial<{
        entryType: 'RECEIPT' | 'PAYMENT'
        glAccountId: string
        contraType: 'DETAILED' | 'SUMMARY'
        isEnabled: boolean
    }>): Promise<AccountingResponse<any>> {
        return apiClient.put<AccountingResponse<any>>(`/cashbook/contra/configure/${id}`, data)
    }

    async deleteContraConfig(id: string): Promise<AccountingResponse<any>> {
        return apiClient.delete<AccountingResponse<any>>(`/cashbook/contra/configure/${id}`)
    }

    // Generate Contra Entry
    async generateContraEntry(cashbookEntryId: string): Promise<AccountingResponse<any>> {
        return apiClient.post<AccountingResponse<any>>('/cashbook/contra/generate', { cashbookEntryId })
    }

    // Export Cashbook Audit
    async exportCashbookAudit(params: { year: number; month: number; bankId?: string | null }): Promise<Blob> {
        const queryParams = new URLSearchParams()
        queryParams.append('year', params.year.toString())
        queryParams.append('month', params.month.toString())
        if (params.bankId) {
            queryParams.append('bankId', params.bankId)
        } else {
            queryParams.append('bankId', 'null')
        }

        return apiClient.get<Blob>(`/cashbook/export-audit?${queryParams.toString()}`, {
            responseType: 'blob'
        })
    }
}

export const cashbookApi = new CashbookApiService()
