import { apiClient } from './api-client'

// ── Shared types ───────────────────────────────────────────────────────

export interface Currency {
  code: string
  symbol: string
}

export interface JournalEntryRef {
  id: string
  referenceNumber: string
  transactionDate: string
  status: string
  auditTrailSequenceNumber?: number
}

// ── Fee Policy ─────────────────────────────────────────────────────────

export interface FundFeePolicy {
  id: string
  name: string
  managementFeeRate: number | null
  managementFeeBase: 'COMMITTED' | 'INVESTED' | 'NAV' | null
  managementFeeFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | null
  managementFeeStartDate: string | null
  carryRate: number | null
  hurdleRate: number | null
  hurdleType: 'PREFERRED_RETURN' | 'NONE' | null
  catchUpRate: number | null
  waterfallType: 'EUROPEAN' | 'AMERICAN' | null
}

export interface FundFeePolicyUpsertRequest {
  managementFeeRate?: number | null
  managementFeeBase?: 'COMMITTED' | 'INVESTED' | 'NAV' | null
  managementFeeFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | null
  managementFeeStartDate?: string | null
  carryRate?: number | null
  hurdleRate?: number | null
  hurdleType?: 'PREFERRED_RETURN' | 'NONE' | null
  catchUpRate?: number | null
  waterfallType?: 'EUROPEAN' | 'AMERICAN' | null
}

// ── Management Fees ────────────────────────────────────────────────────

export interface FeeAllocationPayment {
  id: string
  amount: string
  recordedAt: string
}

export interface FeeAllocation {
  id: string
  lpLegalNameSnapshot: string
  commitmentSnapshot: string
  shareOfFee: string
  amountPaid: string
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID'
  statusLabel: string
  client: { id: string; legalName: string; email: string }
  payments: FeeAllocationPayment[]
}

export interface InvoiceDispatch {
  sentCount: number
  failedCount: number
  skippedCount: number
}

export interface ManagementFeePeriod {
  id: string
  periodStart: string
  periodEnd: string
  feeBase: 'COMMITTED' | 'INVESTED' | 'NAV'
  feeBaseAmount: string
  rate: string
  totalFee: string
  status: 'ACCRUED' | 'INVOICED' | 'PARTIALLY_PAID' | 'PAID'
  statusLabel: string
  invoicesSentAt: string | null
  journalEntryId: string | null
  currency: Currency
  _count: { allocations: number }
  notes?: string | null
  fund?: { name: string }
  journalEntry?: JournalEntryRef
  allocations?: FeeAllocation[]
  invoiceDispatch?: InvoiceDispatch
}

export interface AccrueFeeRequest {
  periodStart: string
  periodEnd: string
  transactionDate?: string
  feeBase?: 'COMMITTED' | 'INVESTED' | 'NAV'
  rateOverride?: number
  feeBaseAmountOverride?: number
  notes?: string
}

// ── Distributions ──────────────────────────────────────────────────────

export interface DistributionAllocationPayment {
  id: string
  amount: string
  recordedAt: string
}

export interface DistributionAllocation {
  id: string
  lpLegalNameSnapshot: string
  commitmentSnapshot: string
  paidInSnapshot: string
  shareAmount: string
  amountPaid: string
  status: string
  statusLabel: string
  client: { id: string; legalName: string; email: string }
  payments: DistributionAllocationPayment[]
}

export interface NoticeDispatch {
  sentCount?: number
  failedCount?: number
  skippedCount?: number
}

export interface Distribution {
  id: string
  distributionDate: string
  source: 'DIVIDEND' | 'EXIT_PROCEEDS' | 'INTEREST' | 'OTHER'
  grossAmount: string
  carryAmount: string
  netToLPs: string
  hurdleAppliedAmount: string
  status: 'DECLARED' | 'NOTICES_SENT' | 'PARTIALLY_PAID' | 'PAID'
  statusLabel: string
  noticesSentAt: string | null
  journalEntryId: string | null
  currency: Currency
  _count: { allocations: number }
  notes?: string | null
  sourceCompanyId?: string | null
  sourceDividendId?: string | null
  fund?: { name: string }
  sourceCompany?: { id: string; name: string } | null
  journalEntry?: { referenceNumber: string }
  allocations?: DistributionAllocation[]
  noticeDispatch?: NoticeDispatch
}

export interface DeclareDistributionRequest {
  distributionDate: string
  source: 'DIVIDEND' | 'EXIT_PROCEEDS' | 'INTEREST' | 'OTHER'
  grossAmount: number
  sourceCompanyId?: string
  sourceDividendId?: string
  carryRateOverride?: number
  currencyCode?: string
  notes?: string
}

export interface AllocationPaymentRequest {
  amount: number
  transactionDate?: string
  cashChartOfAccountId?: string
}

// ── API service ────────────────────────────────────────────────────────

export const lpFeesApi = {
  // 1. Get fee policy
  getFeePolicy: (fundId: string): Promise<{ success: boolean; data: FundFeePolicy }> =>
    apiClient.get(`/funds/${fundId}/fee-policy`),

  // 2. Upsert fee policy
  upsertFeePolicy: (
    fundId: string,
    data: FundFeePolicyUpsertRequest
  ): Promise<{ success: boolean; message?: string; data: FundFeePolicy }> =>
    apiClient.put(`/funds/${fundId}/fee-policy`, data),

  // 3. List management fee periods
  listFeePeriods: (fundId: string): Promise<{ success: boolean; data: ManagementFeePeriod[] }> =>
    apiClient.get(`/funds/${fundId}/management-fees`),

  // 4. Accrue management fee
  accrueFee: (
    fundId: string,
    data: AccrueFeeRequest
  ): Promise<{ success: boolean; message?: string; data: ManagementFeePeriod }> =>
    apiClient.post(`/funds/${fundId}/management-fees`, data),

  // 5. Get fee period detail
  getFeePeriod: (
    fundId: string,
    periodId: string
  ): Promise<{ success: boolean; data: ManagementFeePeriod }> =>
    apiClient.get(`/funds/${fundId}/management-fees/${periodId}`),

  // 6. Send fee invoices
  sendInvoices: (
    fundId: string,
    periodId: string
  ): Promise<{ success: boolean; message?: string; data: any }> =>
    apiClient.post(`/funds/${fundId}/management-fees/${periodId}/send-invoices`, {}),

  // 7. Record LP payment for fee allocation
  recordFeePayment: (
    fundId: string,
    periodId: string,
    allocationId: string,
    data: AllocationPaymentRequest
  ): Promise<{ success: boolean; message?: string; data: ManagementFeePeriod }> =>
    apiClient.post(
      `/funds/${fundId}/management-fees/${periodId}/allocations/${allocationId}/payments`,
      data
    ),

  // 8. List distributions
  listDistributions: (fundId: string): Promise<{ success: boolean; data: Distribution[] }> =>
    apiClient.get(`/funds/${fundId}/distributions`),

  // 9. Declare distribution
  declareDistribution: (
    fundId: string,
    data: DeclareDistributionRequest
  ): Promise<{ success: boolean; message?: string; data: Distribution }> =>
    apiClient.post(`/funds/${fundId}/distributions`, data),

  // 10. Get distribution detail
  getDistribution: (
    fundId: string,
    distributionId: string
  ): Promise<{ success: boolean; data: Distribution }> =>
    apiClient.get(`/funds/${fundId}/distributions/${distributionId}`),

  // 11. Send distribution notices
  sendNotices: (
    fundId: string,
    distributionId: string
  ): Promise<{ success: boolean; message?: string; data: any }> =>
    apiClient.post(`/funds/${fundId}/distributions/${distributionId}/send-notices`, {}),

  // 12. Record LP payout for distribution allocation
  recordPayout: (
    fundId: string,
    distributionId: string,
    allocationId: string,
    data: AllocationPaymentRequest
  ): Promise<{ success: boolean; message?: string; data: Distribution }> =>
    apiClient.post(
      `/funds/${fundId}/distributions/${distributionId}/allocations/${allocationId}/payouts`,
      data
    ),
}
