import { apiClient } from './api-client'
import { AccountingResponse } from './chart-of-accounts-api'

// --- VAT REPORT TYPES ---
export interface VatOutputTaxAuditEntry {
    id: string
    invoiceNumber: string
    invoiceDate: string
    customerName: string
    description: string
    netAmount: number
    vatRate: number
    vatAmount: number
    totalAmount: number
    currencyCode: string
}

export interface VatOutputTaxAuditReport {
    period: {
        startDate: string
        endDate: string
    }
    entries: VatOutputTaxAuditEntry[]
    totals: {
        totalNetAmount: number
        totalVatAmount: number
        totalGrossAmount: number
    }
}

// --- VAT API ---
class VatApiService {
    async getOutputTaxAuditReport(params: {
        startDate: string
        endDate: string
        currencyId?: string
    }): Promise<AccountingResponse<VatOutputTaxAuditReport>> {
        const queryParams = new URLSearchParams()
        queryParams.append('startDate', params.startDate)
        queryParams.append('endDate', params.endDate)
        if (params.currencyId) queryParams.append('currencyId', params.currencyId)
        return apiClient.get<AccountingResponse<VatOutputTaxAuditReport>>(
            `/vat/report/output-tax-audit?${queryParams.toString()}`
        )
    }
}

export const vatApi = new VatApiService()
