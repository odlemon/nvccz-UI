import { apiClient } from './api-client'
import type { FxWidget } from './exchange-rate-display-api'

interface LpPortalResponse<T = any> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

// ── Dashboard ──────────────────────────────────────────────────────────
export interface LpClientInfo {
  id: string
  legalName: string
  email: string
  investorId: string
}

// PLACEHOLDER — sample dashboard had zero funds; item shape inferred from the
// confirmed reports[].metrics shape below (same NAV/IRR metric set).
export interface LpFundSummary {
  fundId: string
  fundName: string
  commitment: number
  paidIn: number
  distributions: number
  nav: number
  dpi: number
  tvpi: number
  rvpi: number
  netIrr: number
  currencyCode: string
}

export interface LpLatestReport {
  jobId: string
  fundName: string
  periodEnd: string
  reportLevel: string
  deliveredAt: string
}

export interface LpDashboard {
  client: LpClientInfo
  lpRole: string | null
  presentationCurrency: 'USD' | 'ZIG'
  funds: LpFundSummary[]
  exchangeRateWidget: FxWidget | null
  latestReports: LpLatestReport[]
}

// ── Ledger — PLACEHOLDER, list sampled empty, detail only 404'd ──
export type LedgerEntryType = 'CAPITAL_CALL' | 'DISTRIBUTION' | 'FEE' | 'OTHER'

export interface LpLedgerEntry {
  id: string
  fundId: string
  type: LedgerEntryType
  amount: number
  currencyCode: string
  valueDate: string
  description: string
  createdAt: string
}

export interface LpLedgerEntryDetail extends LpLedgerEntry {
  bankConfirmationRef?: string
  bankConfirmationDate?: string
  callNoticeDocumentId?: string
}

// ── Vault ──────────────────────────────────────────────────────────────
export type LpVaultCategory =
  | 'TAX'
  | 'AUDIT'
  | 'PERFORMANCE_REPORT'
  | 'CALL_NOTICE'
  | 'MANUAL'
  | 'QUARTERLY_STATEMENT'

export interface LpVaultDocument {
  documentId: string
  category: LpVaultCategory
  title: string
  fundId: string
  fundName: string
  publishedAt: string
  sourceType: 'FUND_REPORT_SYNC' | 'GP_UPLOAD' | string
  sha256: string
}

// PLACEHOLDER — never sampled, only generic boilerplate.
export interface LpVaultVerifyResult {
  documentId: string
  sha256: string
  verified: boolean
  checkedAt: string
}

// ── Reports — confirmed rich shape ──
export interface LpReportMetrics {
  dpi: number
  nav: number
  rvpi: number
  tvpi: number
  fundId: string
  netIrr: number
  clientId: string
  fundName: string
  periodEnd: string
  lpLegalName: string
  periodStart: string
  totalPaidIn: number
  currencyCode: string
  holdingsSummary: string
  totalCommitment: number
  totalDistributions: number
  unfundedCommitment: number
}

export interface LpReport {
  jobId: string
  runId: string
  fundName: string
  templateName: string
  reportLevel: string
  periodStart: string
  periodEnd: string
  status: 'DELIVERED' | 'PENDING' | 'FAILED' | string
  deliveredAt: string
  transportMethod: 'DIRECT_ATTACH' | 'SECURE_LINK'
  metrics: LpReportMetrics
}

export interface LpReportsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

// ── Colleagues — PLACEHOLDER, list sampled empty, invite only 404'd ──
export interface LpColleague {
  membershipId: string
  userId: string
  email: string
  firstName?: string
  lastName?: string
  lpRole: string
  status: string
  invitedAt: string
}

class LpPortalApiService {
  private readonly BASE = '/lp-portal'

  // All methods intentionally omit `clientId` — that query param is
  // GP-staff-impersonation-only. A real LP hitting their own portal has it
  // resolved server-side from their auth token via lp_user_relations.

  getDashboard(params: { fundId?: string; presentationCurrency?: 'USD' | 'ZIG' } = {}): Promise<LpPortalResponse<LpDashboard>> {
    const q = new URLSearchParams()
    if (params.fundId) q.append('fundId', params.fundId)
    if (params.presentationCurrency) q.append('presentationCurrency', params.presentationCurrency)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/dashboard${qs ? `?${qs}` : ''}`)
  }

  getLedger(params: { fundId?: string; currencyCode?: string } = {}): Promise<LpPortalResponse<LpLedgerEntry[]>> {
    const q = new URLSearchParams()
    if (params.fundId) q.append('fundId', params.fundId)
    if (params.currencyCode) q.append('currencyCode', params.currencyCode)
    const qs = q.toString()
    return apiClient.get(`${this.BASE}/ledger${qs ? `?${qs}` : ''}`)
  }

  getLedgerEntry(entryId: string): Promise<LpPortalResponse<LpLedgerEntryDetail>> {
    return apiClient.get(`${this.BASE}/ledger/${entryId}`)
  }

  getVault(category?: LpVaultCategory): Promise<LpPortalResponse<LpVaultDocument[]>> {
    return apiClient.get(`${this.BASE}/vault${category ? `?category=${category}` : ''}`)
  }

  downloadVaultDocument(documentId: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/vault/${documentId}/download`, { responseType: 'blob' })
  }

  verifyVaultDocument(documentId: string): Promise<LpPortalResponse<LpVaultVerifyResult>> {
    return apiClient.get(`${this.BASE}/vault/${documentId}/verify`)
  }

  getReports(fundId?: string): Promise<LpPortalResponse<LpReport[]> & { pagination: LpReportsPagination }> {
    return apiClient.get(`${this.BASE}/reports${fundId ? `?fundId=${fundId}` : ''}`)
  }

  downloadReport(jobId: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/reports/${jobId}/download`, { responseType: 'blob' })
  }

  getColleagues(): Promise<LpPortalResponse<LpColleague[]>> {
    return apiClient.get(`${this.BASE}/colleagues`)
  }

  inviteColleague(email: string): Promise<LpPortalResponse<LpColleague>> {
    return apiClient.post(`${this.BASE}/colleagues`, { email })
  }

  revokeColleague(membershipId: string): Promise<LpPortalResponse<unknown>> {
    return apiClient.patch(`${this.BASE}/colleagues/${membershipId}/revoke`)
  }
}

export const lpPortalApi = new LpPortalApiService()
