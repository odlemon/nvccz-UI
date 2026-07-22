import { apiClient } from "./api-client"
import { createIdempotencyKey } from "@/lib/lp-portal/format"
import { LP_PORTAL_USE_MOCK } from "@/lib/lp-portal/config"
import { mockLpPortalApi } from "@/lib/lp-portal/mock-api"

// ── Envelopes ──────────────────────────────────────────────────────────

export interface LpPortalMeta {
  requestId?: string
}

export interface LpPortalResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
  meta?: LpPortalMeta
}

export interface LpListData<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface LpApiErrorBody {
  code?: string
  message?: string
  fieldErrors?: Record<string, string>
  details?: Record<string, string>
  retryable?: boolean
}

// ── Session ────────────────────────────────────────────────────────────

export interface LpSessionFund {
  fundId: string
  publicReference: string
  fundName: string
  shortName: string
  operatingModel: "PRIVATE_CAPITAL" | "OPEN_ENDED"
  currencyCode: string
  shareClass: string | null
  asOfDate: string
  valuationStatus: string
  investorAccountReference: string
  commitmentAmount: string
}

export interface LpSession {
  client: {
    id: string
    legalName: string
    email: string
    investorId: string
    displayName?: string
  }
  lpRole: "VIEWER" | "SIGNATORY" | "MANAGER"
  presentationCurrency: string
  defaultAsOfDate: string
  defaultValuationStatus: string
  funds: LpSessionFund[]
  unreadCounts: {
    requests: number
    messages: number
    notices: number
    notifications: number
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────

export interface LpDashboardKpis {
  totalCommitment: string
  paidIn: string
  unfunded: string
  currentNav: string
  distributions: string
  netIrr: string
  tvpi: string
  dpi: string
  rvpi: string
  investmentCount: number
}

export interface LpOpenEndedSummary {
  accountValue: string
  unitsHeld: string
  navPerUnit: string
  ytdReturn: string
}

export interface LpOpenEndedHistoryPoint {
  label: string
  navPerUnit: string
  date?: string
}

export interface LpDashboardData {
  asOfDate: string
  valuationStatus: string
  kpis: LpDashboardKpis
  openEndedSummary?: LpOpenEndedSummary | null
  openEndedHistory?: { points: LpOpenEndedHistoryPoint[] }
}

export interface LpDashboardAction {
  id: string
  type: string
  severity: string
  title: string
  fundId: string
  relatedRecordId: string
  href: string
  dueDate: string | null
  amount?: string
  fundName?: string
  label?: string
}

export interface LpRecentActivity {
  id: string
  type: string
  title: string
  fundId: string
  amount: string
  status: string
  at: string
}

// ── Capital calls ──────────────────────────────────────────────────────

export interface LpCapitalCall {
  id: string
  callNo: number
  fundId: string
  fundName: string
  issueDate: string
  dueDate: string
  currencyCode: string
  amount: string
  paid: string
  outstanding: string
  status: string
  acknowledgedAt: string | null
}

export interface LpCapitalCallWiring {
  bankName: string
  accountName: string
  accountNumber: string | null
  accountNumberMasked: string
  abaRouting: string
  reference: string
  raw: string | null
}

export interface LpCapitalCallTimelineStep {
  code: string
  at: string | null
  completed: boolean
}

export interface LpCapitalCallDetail extends LpCapitalCall {
  wiring: LpCapitalCallWiring
  timeline: LpCapitalCallTimelineStep[]
}

export interface LpCapitalCallSummary {
  openCount: number
  outstanding: string
  overdue: string
  paidYtd: string
  currencyCode: string
  paidCallCount?: number
  dueSoonCount?: number
  dueSoonAmount?: string
  totalDistributions?: string
  upcomingDistributionNotices?: { count: number; amount?: string }
}

export interface LpCapitalCallDocument {
  id: string
  name: string
  category: string
  publishedDate: string
  checksumSha256: string
  status: string
}

// ── Distributions ──────────────────────────────────────────────────────

export interface LpDistribution {
  id: string
  reference: string
  fundId: string
  fundName: string
  paymentDate: string
  type: string
  currencyCode: string
  gross: string
  adjustments: string
  netPaid: string
  status: string
  destinationBankMasked: string | null
  documentId: string | null
}

// ── Account activity / ledger ──────────────────────────────────────────

export interface LpAccountActivityEntry {
  entryId: string
  entryType: string
  fundId: string
  fundName: string
  transactionDate: string
  amount: string
  currency: string
  description: string
  status: string
  structure?: string
  operatingModel?: "PRIVATE_CAPITAL" | "OPEN_ENDED"
}

export interface LpLedgerDocument {
  id: string
  name: string
  publishedDate: string
  size?: number
}

export interface LpLedgerDetail {
  entryType: string
  allocation?: {
    id: string
    clientId: string
    currentCallAmount: string
    amountPaid: string
    status: string
  }
  payments: unknown[]
  callNoticeDocumentId?: string | null
  documents?: LpLedgerDocument[]
}

// ── Dealing ────────────────────────────────────────────────────────────

export interface LpBankAccount {
  id: string
  label: string
  bankName: string
  accountName: string
  accountNumberMasked: string
  currencyCode: string
  isDefault: boolean
  fundId: string | null
  status: string
}

export interface LpDealingRules {
  minBalanceAmount: string
  minBalanceUnits: string
  noticeDays: number
  dealingFrequency: string
  nextEligibleDealingDate: string
  settlementLagDays: number
  subscription: {
    mgmtFeeRate: string
    otherFeeFlat: string
    maxFileMb: number
  }
  redemption: {
    feeRate: string
    modes: Array<"AMOUNT" | "UNITS" | "FULL">
  }
}

export interface LpDealingCompliance {
  accreditedInvestor: boolean
  kycStatus: string
  noUnsettledCapitalCalls?: boolean
  noLegalHolds: boolean
  blockers: string[]
  termsUrl?: string | null
  holdReason?: string | null
}

export interface LpDealingOverview {
  fundId: string
  shareClass: string
  asOfDate: string
  valuationStatus: string
  navPerUnit: string
  accountValue: string
  unitsHeld: string
  availableToRedeemValue: string
  availableUnits: string
  pendingSubscriptions: string
  pendingRedemptions: string
  rules: LpDealingRules & { compliance?: LpDealingCompliance }
  compliance: LpDealingCompliance
}

export interface LpDealingRequest {
  id: string
  fundId: string
  fundName?: string
  shareClass?: string
  requestType: "SUBSCRIPTION" | "REDEMPTION"
  status: string
  amount: string
  units: string
  redemptionMode: string | null
  currencyCode: string
  requestedDealingDate: string
  estimateSnapshotId: string
  isEstimate: boolean
  createdAt: string
  notes?: string | null
}

export interface LpSubscriptionEstimate {
  estimateSnapshotId: string
  navPerUnit: string
  estimatedUnits: string
  managementFee: string
  otherFees: string
  estimatedTotalInvestment: string
  isEstimate: boolean
  disclaimer: string
}

export interface LpRedemptionEstimate {
  estimateSnapshotId: string
  estimatedUnitsToCancel: string
  estimatedSettlementAmount: string
  earliestDealingDate: string
  estimatedSettlementDate: string
  noticeDays: number
  aboveMinBalance: boolean
  isEstimate: boolean
  redemptionFee: string
  disclaimer: string
}

// ── Performance ────────────────────────────────────────────────────────

export interface LpPerformanceMetrics {
  totalCommitment: string
  paidIn: string
  distributions: string
  currentNav: string
  netIrr: string
  tvpi: string
  dpi: string
  rvpi: string
}

export interface LpPerformanceByFundRow {
  fundId: string
  fundName: string
  netIrr: string
  tvpi: string
  dpi: string
  rvpi: string
  nav: string
  paidIn: string
  distributions: string
  operatingModel?: "PRIVATE_CAPITAL" | "OPEN_ENDED"
  structure?: string
}

export interface LpOpenEndedMetrics {
  ytdReturn: string
  navPerUnit: string
  unitsHeld: string
  accountValue: string
}

export interface LpPerformanceData {
  asOfDate: string
  valuationStatus: string
  period: string
  calculationDate: string
  version: string
  sourceModule: string
  reportingCurrency: string
  approvedBy: string | null
  metrics: LpPerformanceMetrics
  byFund: LpPerformanceByFundRow[]
  benchmark: unknown | null
  openEndedMetrics?: LpOpenEndedMetrics
}

export interface LpPerformanceHistoryPoint {
  date: string
  label: string
  nav: string
  paidIn: string
  distributions: string
}

export interface LpPerformanceHistory {
  asOfDate: string
  valuationStatus: string
  range: string
  points: LpPerformanceHistoryPoint[]
}

export interface LpBenchmarkSeries {
  metric: string
  asOfDate: string
  valuationStatus: string
  series: Array<{ date: string; label: string; value: string }>
  note: string
}

export interface LpJobStatus {
  jobId: string
  jobType: string
  status: string
  result?: unknown
  downloadUrl?: string | null
  errorMessage?: string | null
  createdAt: string
  completedAt?: string | null
}

// ── Documents ──────────────────────────────────────────────────────────

export interface LpDocument {
  id: string
  name: string
  fundId: string
  fundName: string
  category: string
  period: string | null
  publishedDate: string
  version: string
  status: string
  accessScope: string
  checksumSha256: string
  permissions: string[]
  sourceType?: string
  sourceRefId?: string
  fileSizeBytes?: number
  pageCount?: number
  mimeType?: string
  history?: Array<{ user: string; action: string; at: string; ip: string }>
}

export interface LpDocumentsSummaryCategoryCount {
  category: string
  count: number
}

export interface LpDocumentsSummary {
  total?: number
  byCategory?: LpDocumentsSummaryCategoryCount[]
  newThisWeek?: number
  requiresSignature?: number
  secureDownloadsYtd?: number
}

export interface LpVaultDocument {
  documentId: string
  category: string
  title: string
  fundId: string
  fundName: string
  publishedAt: string
  sourceType: string
  sha256: string
}

// ── Notices ────────────────────────────────────────────────────────────

export interface LpNotice {
  id: string
  title: string
  status: string
  fundId: string
  fundName?: string
  shareClass: string | null
  publishedAt: string
  acknowledgedAt: string | null
  category?: string
  kind?: string
  requiresAcknowledgement?: boolean
  preview?: string
  body?: string
  openedAt?: string | null
}

// ── Requests & messages ────────────────────────────────────────────────

export interface LpServiceRequestAttachment {
  id: string
  name: string
  size: number
  downloadUrl?: string
}

export interface LpRequestAttachment {
  id: string
  name: string
  size: number
  mimeType?: string
  uploadedAt: string
}

export interface LpServiceRequest {
  id: string
  reference: string
  type: string
  fundId: string
  fundName: string
  status: string
  subject: string
  description: string
  createdAt: string
  updatedAt: string
  priority?: string
  submittedBy?: string
  attachments?: LpServiceRequestAttachment[]
  messages?: Array<{
    id: string
    authorType: string
    authorId: string
    body: string
    createdAt: string
    attachments?: LpServiceRequestAttachment[]
  }>
}

export interface LpMessageThreadSummary {
  id: string
  subject: string
  fundId: string
  fundName: string
  relatedType: string
  relatedId: string
  status: string
  lastMessageAt: string
  lastMessagePreview: string
  unreadCount: number
}

export interface LpMessageThreadParticipant {
  name: string
  initials?: string
  role?: string
}

export interface LpMessageThreadDetail {
  id: string
  subject: string
  fundId: string
  fundName: string
  relatedType: string
  relatedId: string
  status: string
  participants?: LpMessageThreadParticipant[]
  messages: Array<{
    id: string
    authorType: string
    authorId: string
    body: string
    readAt: string | null
    createdAt: string
    attachments?: LpServiceRequestAttachment[]
  }>
}

// ── Organisation & settings ─────────────────────────────────────────────

export interface LpColleague {
  membershipId: string
  userId: string
  email: string
  name: string
  lpRole: string
  fundIds: string[]
  isActive: boolean
  status: string
  revokedAt: string | null
  mfaEnabled?: boolean
  lastActiveAt?: string | null
}

export interface LpOrganisation {
  id: string
  legalName: string
  investorId: string
  email: string
  country: string
  phone: string
  address: string
  status: string
  lpRole: string
  colleagues: LpColleague[]
}

export interface LpNotificationPreferences {
  emailCapitalCalls: boolean
  emailDistributions: boolean
  emailDocuments: boolean
  emailMessages: boolean
  emailNotices: boolean
  inAppCapitalCalls?: boolean
  inAppDistributions?: boolean
  inAppDocuments?: boolean
  inAppMessages?: boolean
  inAppNotices?: boolean
  digest?: "daily" | "weekly" | "off" | null
}

export interface LpSettings {
  notifications: LpNotificationPreferences
  mfa: {
    requireMfaForLp: boolean
    issuerName: string
    enabled: boolean
    enabledAt: string | null
    manageUrl?: string | null
    sessionsUrl?: string | null
    passwordUrl?: string | null
  }
  presentationCurrency: string
  defaultAsOfPreference?: string
}

export interface LpDisplaySettings {
  presentationCurrency?: string
  defaultAsOfPreference?: string
}

export interface LpNotificationItem {
  id: string
  title: string
  href: string
  fundName?: string
  createdAt: string
  type?: string
  read?: boolean
}

export interface LpBankInstructionChange {
  id: string
  fundId: string
  fundName?: string
  bankName?: string
  accountNumberMasked: string
  requestedBy: string
  submittedAt: string
  status: string
}

export interface LpRealtimeInfo {
  enabled: boolean
  wsUrl?: string
  namespace?: string
  events?: string[]
  pollingIntervalMs?: number
}

// ── Legacy reports (thin list) ───────────────────────────────────────────

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
  status: string
  deliveredAt: string
  transportMethod: string
  metrics: LpReportMetrics
}

export interface LpReportsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

// ── Legacy dashboard shape (old components) ────────────────────────────

export interface LpClientInfo {
  id: string
  legalName: string
  email: string
  investorId: string
}

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

export interface LpDashboard {
  client: LpClientInfo
  lpRole: string | null
  presentationCurrency: "USD" | "ZIG"
  funds: LpFundSummary[]
  exchangeRateWidget: null
  latestReports: unknown[]
}

export type LpVaultCategory =
  | "TAX"
  | "AUDIT"
  | "PERFORMANCE_REPORT"
  | "CALL_NOTICE"
  | "MANUAL"
  | "QUARTERLY_STATEMENT"
  | "LEGAL"

export interface LpVaultVerifyResult {
  documentId: string
  verified: boolean
  expectedSha256: string
  actualSha256: string
}

export type LedgerEntryType = "CAPITAL_CALL" | "DISTRIBUTION" | "FEE" | "OTHER"

export interface LpLedgerEntry {
  entryId: string
  entryType: string
  fundId: string
  fundName: string
  transactionDate: string
  amount: string
  currency: string
  description: string
  status: string
}

export interface LpLedgerEntryDetail extends LpLedgerDetail {
  entryId?: string
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") q.append(key, String(value))
  }
  const qs = q.toString()
  return qs ? `?${qs}` : ""
}

function idemHeaders(key?: string): HeadersInit {
  return { "Idempotency-Key": key ?? createIdempotencyKey() }
}

class LpPortalApiService {
  private readonly BASE = "/lp-portal"

  getSession(): Promise<LpPortalResponse<LpSession>> {
    return apiClient.get(`${this.BASE}/session`)
  }

  getDashboard(params: {
    fundId?: string
    asOfDate?: string
    presentationCurrency?: string
  } = {}): Promise<LpPortalResponse<LpDashboardData>> {
    return apiClient.get(`${this.BASE}/dashboard${buildQuery(params)}`)
  }

  getDashboardActions(): Promise<LpPortalResponse<{ items: LpDashboardAction[] }>> {
    return apiClient.get(`${this.BASE}/dashboard/actions`)
  }

  getDashboardRecentActivity(limit = 10): Promise<LpPortalResponse<{ items: LpRecentActivity[] }>> {
    return apiClient.get(`${this.BASE}/dashboard/activity/recent${buildQuery({ limit })}`)
  }

  getRealtime(): Promise<LpPortalResponse<LpRealtimeInfo>> {
    return apiClient.get(`${this.BASE}/realtime`)
  }

  getNotifications(limit = 10): Promise<LpPortalResponse<{ items: LpNotificationItem[] }>> {
    return apiClient.get(`${this.BASE}/notifications${buildQuery({ limit })}`)
  }

  // Capital calls
  getCapitalCalls(params: {
    fundId?: string
    status?: string
    page?: number
    pageSize?: number
  } = {}): Promise<LpPortalResponse<LpListData<LpCapitalCall>>> {
    return apiClient.get(`${this.BASE}/capital-calls${buildQuery(params)}`)
  }

  getCapitalCall(id: string): Promise<LpPortalResponse<LpCapitalCallDetail>> {
    return apiClient.get(`${this.BASE}/capital-calls/${id}`)
  }

  getCapitalCallSummary(fundId?: string): Promise<LpPortalResponse<LpCapitalCallSummary>> {
    return apiClient.get(`${this.BASE}/capital-calls/summary${buildQuery({ fundId })}`)
  }

  getCapitalCallDocuments(id: string): Promise<LpPortalResponse<LpCapitalCallDocument[]>> {
    return apiClient.get(`${this.BASE}/capital-calls/${id}/documents`)
  }

  acknowledgeCapitalCall(id: string, idempotencyKey?: string): Promise<LpPortalResponse<{ acknowledgedAt: string }>> {
    return apiClient.post(`${this.BASE}/capital-calls/${id}/acknowledge`, {}, { headers: idemHeaders(idempotencyKey) })
  }

  uploadPaymentConfirmation(
    id: string,
    formData: FormData,
    idempotencyKey?: string,
  ): Promise<LpPortalResponse<{ id: string; fileName: string; sha256: string; amountClaimed: string; uploadedAt: string }>> {
    return apiClient.post(`${this.BASE}/capital-calls/${id}/payment-confirmations`, formData, {
      headers: idemHeaders(idempotencyKey),
    })
  }

  downloadCapitalCallNotice(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/capital-calls/${id}/notice/download`, { responseType: "blob" })
  }

  // Distributions
  getDistributions(params: {
    fundId?: string
    page?: number
    pageSize?: number
  } = {}): Promise<LpPortalResponse<LpListData<LpDistribution>>> {
    return apiClient.get(`${this.BASE}/distributions${buildQuery(params)}`)
  }

  getDistribution(id: string): Promise<LpPortalResponse<LpDistribution>> {
    return apiClient.get(`${this.BASE}/distributions/${id}`)
  }

  downloadDistribution(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/distributions/${id}/download`, { responseType: "blob" })
  }

  downloadDistributionStatement(params: { fundId?: string; asOfDate?: string }): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/distributions/statement/download${buildQuery(params)}`, {
      responseType: "blob",
    })
  }

  // Account activity & ledger
  getAccountActivity(params: {
    fundId?: string
    from?: string
    to?: string
    currency?: string
    page?: number
    pageSize?: number
  } = {}): Promise<LpPortalResponse<LpListData<LpAccountActivityEntry>>> {
    return apiClient.get(`${this.BASE}/account-activity${buildQuery(params)}`)
  }

  exportAccountActivity(params: {
    fundId?: string
    from?: string
    to?: string
    format?: "csv" | "xlsx" | "pdf"
  }): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/account-activity/export${buildQuery(params)}`, { responseType: "blob" })
  }

  getLedger(params: {
    fundId?: string
    from?: string
    to?: string
    currency?: string
  } = {}): Promise<LpPortalResponse<LpLedgerEntry[]>> {
    return apiClient.get(`${this.BASE}/ledger${buildQuery(params)}`)
  }

  getLedgerEntry(entryId: string): Promise<LpPortalResponse<LpLedgerDetail>> {
    return apiClient.get(`${this.BASE}/ledger/${entryId}`)
  }

  // Dealing
  getDealingBankAccounts(fundId?: string): Promise<LpPortalResponse<LpBankAccount[]>> {
    return apiClient.get(`${this.BASE}/dealing/bank-accounts${buildQuery({ fundId })}`)
  }

  getDealingOverview(fundId: string): Promise<LpPortalResponse<LpDealingOverview>> {
    return apiClient.get(`${this.BASE}/dealing/overview${buildQuery({ fundId })}`)
  }

  getDealingRules(fundId: string): Promise<LpPortalResponse<LpDealingRules & { fundId: string; compliance: LpDealingCompliance }>> {
    return apiClient.get(`${this.BASE}/dealing/rules${buildQuery({ fundId })}`)
  }

  getDealingRequests(params: {
    fundId?: string
    type?: "SUBSCRIPTION" | "REDEMPTION"
    page?: number
    pageSize?: number
  } = {}): Promise<LpPortalResponse<LpListData<LpDealingRequest>>> {
    return apiClient.get(`${this.BASE}/dealing/requests${buildQuery(params)}`)
  }

  exportDealingRequests(params: {
    fundId?: string
    type?: "SUBSCRIPTION" | "REDEMPTION"
    format?: "csv" | "xlsx"
  } = {}): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/dealing/requests/export${buildQuery(params)}`, {
      responseType: "blob",
    })
  }

  estimateSubscription(body: {
    fundId: string
    shareClass: string
    amount: string
    currency: string
  }): Promise<LpPortalResponse<LpSubscriptionEstimate>> {
    return apiClient.post(`${this.BASE}/dealing/subscriptions/estimate`, body)
  }

  submitSubscription(
    body: Record<string, unknown> | FormData,
    idempotencyKey?: string,
  ): Promise<LpPortalResponse<LpDealingRequest>> {
    return apiClient.post(`${this.BASE}/dealing/subscriptions`, body, { headers: idemHeaders(idempotencyKey) })
  }

  estimateRedemption(body: {
    fundId: string
    shareClass: string
    mode: "AMOUNT" | "UNITS" | "FULL"
    amount?: string
    units?: string
    full?: boolean
    earliestDealingDate: string
  }): Promise<LpPortalResponse<LpRedemptionEstimate>> {
    return apiClient.post(`${this.BASE}/dealing/redemptions/estimate`, body)
  }

  submitRedemption(body: Record<string, unknown>, idempotencyKey?: string): Promise<LpPortalResponse<LpDealingRequest>> {
    return apiClient.post(`${this.BASE}/dealing/redemptions`, body, { headers: idemHeaders(idempotencyKey) })
  }

  // Performance & jobs
  getPerformance(params: {
    fundId?: string
    period?: string
    asOfDate?: string
  } = {}): Promise<LpPortalResponse<LpPerformanceData>> {
    return apiClient.get(`${this.BASE}/performance${buildQuery(params)}`)
  }

  getPerformanceHistory(params: { fundId?: string; period?: string }): Promise<LpPortalResponse<LpPerformanceHistory>> {
    return apiClient.get(`${this.BASE}/performance/history${buildQuery(params)}`)
  }

  getPerformanceByFund(asOfDate?: string): Promise<LpPortalResponse<{ asOfDate: string; valuationStatus: string; funds: LpPerformanceByFundRow[] }>> {
    return apiClient.get(`${this.BASE}/performance/by-fund${buildQuery({ asOfDate })}`)
  }

  getPerformanceBenchmarks(params: {
    fundId?: string
    metric?: string
    benchmarkId?: string
  } = {}): Promise<LpPortalResponse<LpBenchmarkSeries>> {
    return apiClient.get(`${this.BASE}/performance/benchmarks${buildQuery(params)}`)
  }

  requestPerformanceReport(body: { fundId?: string; asOfDate?: string; period?: string }, idempotencyKey?: string): Promise<LpPortalResponse<{ jobId: string; status: string; createdAt: string }>> {
    return apiClient.post(`${this.BASE}/jobs/performance-report`, body, { headers: idemHeaders(idempotencyKey) })
  }

  getJob(jobId: string): Promise<LpPortalResponse<LpJobStatus>> {
    return apiClient.get(`${this.BASE}/jobs/${jobId}`)
  }

  downloadPerformanceReport(params: { fundId?: string }): Promise<LpPortalResponse<{ jobId: string; status: string; createdAt: string }>> {
    return apiClient.get(`${this.BASE}/performance/report/download${buildQuery(params)}`)
  }

  // Documents & vault
  getDocuments(params: {
    category?: string
    fundId?: string
    q?: string
    page?: number
    pageSize?: number
  } = {}): Promise<LpPortalResponse<LpListData<LpDocument>>> {
    return apiClient.get(`${this.BASE}/documents${buildQuery(params)}`)
  }

  getDocumentsSummary(): Promise<LpPortalResponse<LpDocumentsSummary>> {
    return apiClient.get(`${this.BASE}/documents/summary`)
  }

  getDocument(id: string): Promise<LpPortalResponse<LpDocument>> {
    return apiClient.get(`${this.BASE}/documents/${id}`)
  }

  downloadDocument(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/documents/${id}/download`, { responseType: "blob" })
  }

  previewDocument(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/documents/${id}/preview`, { responseType: "blob" })
  }

  getVault(params: { category?: string; fundId?: string; search?: string } = {}): Promise<LpPortalResponse<LpVaultDocument[]>> {
    return apiClient.get(`${this.BASE}/vault${buildQuery(params)}`)
  }

  downloadVaultDocument(documentId: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/vault/${documentId}/download`, { responseType: "blob" })
  }

  verifyVaultDocument(documentId: string): Promise<LpPortalResponse<LpVaultVerifyResult>> {
    return apiClient.get(`${this.BASE}/vault/${documentId}/verify`)
  }

  // Notices
  getNotices(params: { page?: number; pageSize?: number } = {}): Promise<LpPortalResponse<LpListData<LpNotice>>> {
    return apiClient.get(`${this.BASE}/notices${buildQuery(params)}`)
  }

  getNotice(id: string): Promise<LpPortalResponse<LpNotice>> {
    return apiClient.get(`${this.BASE}/notices/${id}`)
  }

  acknowledgeNotice(id: string, idempotencyKey?: string): Promise<LpPortalResponse<{ acknowledgedAt: string }>> {
    return apiClient.post(`${this.BASE}/notices/${id}/acknowledge`, {}, { headers: idemHeaders(idempotencyKey) })
  }

  // Requests & messages
  getRequests(params: { status?: string; page?: number; pageSize?: number } = {}): Promise<LpPortalResponse<LpListData<LpServiceRequest>>> {
    return apiClient.get(`${this.BASE}/requests${buildQuery(params)}`)
  }

  getRequest(reference: string): Promise<LpPortalResponse<LpServiceRequest>> {
    return apiClient.get(`${this.BASE}/requests/${reference}`)
  }

  createRequest(
    body: {
      type: string
      fundId?: string
      subject: string
      description: string
      priority?: string
      attachmentIds?: string[]
    },
    idempotencyKey?: string,
  ): Promise<LpPortalResponse<LpServiceRequest>> {
    return apiClient.post(`${this.BASE}/requests`, body, { headers: idemHeaders(idempotencyKey) })
  }

  uploadRequestAttachment(
    formData: FormData,
    idempotencyKey?: string,
  ): Promise<LpPortalResponse<LpRequestAttachment>> {
    return apiClient.post(`${this.BASE}/requests/attachments`, formData, {
      headers: idemHeaders(idempotencyKey),
    })
  }

  replyToRequest(
    reference: string,
    body: { body: string; attachmentIds?: string[] },
  ): Promise<LpPortalResponse<{ id: string; authorType: string; body: string; createdAt: string }>> {
    return apiClient.post(`${this.BASE}/requests/${reference}/messages`, body)
  }

  getMessages(params: { page?: number; pageSize?: number } = {}): Promise<LpPortalResponse<LpListData<LpMessageThreadSummary>>> {
    return apiClient.get(`${this.BASE}/messages${buildQuery(params)}`)
  }

  getMessageThread(id: string): Promise<LpPortalResponse<LpMessageThreadDetail>> {
    return apiClient.get(`${this.BASE}/messages/${id}`)
  }

  markMessageThreadRead(id: string): Promise<LpPortalResponse<{ threadId: string; markedRead: number }>> {
    return apiClient.post(`${this.BASE}/messages/${id}/read`, {})
  }

  replyToMessageThread(
    id: string,
    body: { body: string; attachmentIds?: string[] },
  ): Promise<LpPortalResponse<{ id: string; authorType: string; body: string; createdAt: string }>> {
    return apiClient.post(`${this.BASE}/messages/${id}/replies`, body)
  }

  // Organisation & settings
  getOrganisation(): Promise<LpPortalResponse<LpOrganisation>> {
    return apiClient.get(`${this.BASE}/organisation`)
  }

  getColleagues(): Promise<LpPortalResponse<LpColleague[]>> {
    return apiClient.get(`${this.BASE}/colleagues`)
  }

  inviteColleague(
    body: { email: string; role: string; fundIds: string[] },
    idempotencyKey?: string,
  ): Promise<LpPortalResponse<{ id: string; userId: string; clientId: string; lpRole: string; fundIds: string[]; isActive: boolean; invitedById: string }>> {
    return apiClient.post(`${this.BASE}/colleagues`, body, { headers: idemHeaders(idempotencyKey) })
  }

  updateColleague(
    membershipId: string,
    body: { role?: string; fundIds?: string[] },
  ): Promise<LpPortalResponse<{ id: string; userId: string; clientId: string; lpRole: string; fundIds: string[]; isActive: boolean }>> {
    return apiClient.patch(`${this.BASE}/colleagues/${membershipId}`, body)
  }

  revokeColleague(membershipId: string): Promise<LpPortalResponse<{ membershipId: string; userId: string; revokedById: string }>> {
    return apiClient.patch(`${this.BASE}/colleagues/${membershipId}/revoke`)
  }

  getBankInstructionChanges(): Promise<LpPortalResponse<LpBankInstructionChange[]>> {
    return apiClient.get(`${this.BASE}/bank-instructions/changes`)
  }

  submitBankInstructionChange(
    body: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<LpPortalResponse<LpBankInstructionChange>> {
    return apiClient.post(`${this.BASE}/bank-instructions/changes`, body, {
      headers: idemHeaders(idempotencyKey),
    })
  }

  getSettings(): Promise<LpPortalResponse<LpSettings>> {
    return apiClient.get(`${this.BASE}/settings`)
  }

  getMfaSettings(): Promise<LpPortalResponse<LpSettings["mfa"]>> {
    return apiClient.get(`${this.BASE}/settings/mfa`)
  }

  updateNotificationSettings(
    body: Partial<LpNotificationPreferences>,
  ): Promise<LpPortalResponse<LpNotificationPreferences>> {
    return apiClient.patch(`${this.BASE}/settings/notifications`, body)
  }

  updateDisplaySettings(body: LpDisplaySettings): Promise<LpPortalResponse<LpDisplaySettings>> {
    return apiClient.patch(`${this.BASE}/settings/display`, body)
  }

  // Legacy reports list
  getReports(params: { fundId?: string; page?: number; limit?: number } = {}): Promise<
    LpPortalResponse<{ data: LpReport[]; pagination: LpReportsPagination }>
  > {
    return apiClient.get(`${this.BASE}/reports${buildQuery(params)}`)
  }

  downloadReport(jobId: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.BASE}/reports/${jobId}/download`, { responseType: "blob" })
  }
}

export const lpPortalApi = LP_PORTAL_USE_MOCK
  ? (mockLpPortalApi as unknown as LpPortalApiService)
  : new LpPortalApiService()
