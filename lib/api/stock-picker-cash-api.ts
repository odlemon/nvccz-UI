/**
 * Stock Picker Cash API — `/api/investment-ops` cash surface from design-refs/recon.md.
 * Do NOT use `/api/investment-ops/reconciliation/*` (holdings/trade §22) for cash matching.
 */
import { apiClient } from './api-client'
import {
  idempotencyHeaders,
  newIdempotencyKey,
  qs,
  type OpsEnvelope,
  type OpsPaged,
} from './investment-ops-helpers'

const BASE = '/investment-ops'

export type CashOverview = {
  accountCount: number
  totalPostedSettledCash: string
  totalOrderEligibleAvailableCash: string
  totalActiveReservations: string
  byCurrency: { currency: string; postedSettledCash: string; orderEligibleAvailableCash: string }[]
  unhealthyAccounts: number
}

export type ClientCashAccount = {
  id: string
  accountNumber?: string
  clientName?: string
  baseCurrency?: string
  accountType?: string
  provider?: string
  status?: string
  version?: number
  [key: string]: unknown
}

export type CashLedgerLine = {
  id: string
  valueDate?: string
  postedAt?: string
  portfolioId?: string
  cashAccountId?: string
  currency?: string
  type?: string
  description?: string
  debit?: string
  credit?: string
  balance?: string
  runningBalance?: string
  accountPurpose?: string
  status?: string
  approvalStatus?: string
  /** BA-RC-2 — linked trade when journal was backfilled from settle */
  tradeId?: string | null
  [key: string]: unknown
}

export type CashJournal = {
  id: string
  status?: string
  version?: number
  [key: string]: unknown
}

export type ReconciliationBatch = {
  id: string
  reconType?: string
  status?: string
  portfolioId?: string
  fundId?: string
  asOf?: string
  version?: number
  [key: string]: unknown
}

export type BatchWorkspace = {
  unmatchedInternal?: unknown[]
  unmatchedExternal?: unknown[]
  suggested?: unknown[]
  suggestions?: unknown[]
  matchSuggestions?: unknown[]
  matches?: unknown[]
  breaks?: unknown[]
  internal?: unknown[]
  external?: unknown[]
  results?: unknown[]
  lastRunAt?: string
  lastReconciledAt?: string
  runAt?: string
  completedAt?: string
  updatedAt?: string
  status?: string
  [key: string]: unknown
}

export type FundCashSummary = {
  fundId?: string
  asOf?: string
  totalCash?: string
  matchedCount?: number
  unmatchedCount?: number
  breakCount?: number
  exceptionCount?: number
  openBreaks?: number
  matchRate?: string | number
  trendVsPrior7d?: { matchRatePp?: string | number; [key: string]: unknown }
  [key: string]: unknown
}

export type BrokerCustodianItem = {
  id: string
  security?: string
  overallStatus?: string
  internalStatus?: string
  brokerStatus?: string
  custodianStatus?: string
  difference?: string
  differenceAmount?: string
  internalAmount?: string | number
  brokerAmount?: string | number
  custodianAmount?: string | number
  [key: string]: unknown
}

export type ReconException = {
  id: string
  severity?: string
  status?: string
  category?: string
  amountDifference?: string
  currency?: string
  assignedToId?: string
  overdue?: boolean
  version?: number
  [key: string]: unknown
}

export type DailyCashMovementPoint = {
  date: string
  net: string | number
  close: string | number
  [key: string]: unknown
}

export type ClientStatement = {
  id: string
  status?: string
  periodFrom?: string
  periodTo?: string
  cashAccountId?: string
  currency?: string
  statementType?: string
  version?: number
  [key: string]: unknown
}

class StockPickerCashApi {
  // ── Overview / accounts ────────────────────────────────────────────────────
  async getCashOverview(params?: { legalEntityId?: string; currency?: string }) {
    return apiClient.get<OpsEnvelope<CashOverview>>(
      `${BASE}/cash-overview${qs(params ?? {})}`,
    )
  }

  async getCashOverviewDailyMovement(params?: {
    from?: string
    to?: string
    currency?: string
    portfolioId?: string
    cashAccountId?: string
  }) {
    return apiClient.get<OpsEnvelope<{ items: DailyCashMovementPoint[] } | DailyCashMovementPoint[]>>(
      `${BASE}/cash-overview/daily-movement${qs(params ?? {})}`,
    )
  }

  async listClientCashAccounts(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<ClientCashAccount> | ClientCashAccount[]>>(
      `${BASE}/client-cash-accounts${qs(params ?? {})}`,
    )
  }

  async getClientCashAccount(accountId: string) {
    return apiClient.get<OpsEnvelope<ClientCashAccount>>(`${BASE}/client-cash-accounts/${accountId}`)
  }

  async createClientCashAccount(data: Record<string, unknown>, idempotencyKey?: string) {
    return apiClient.post<OpsEnvelope<ClientCashAccount>>(`${BASE}/client-cash-accounts`, data, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  }

  async submitClientCashAccount(accountId: string, body?: { expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<ClientCashAccount>>(
      `${BASE}/client-cash-accounts/${accountId}/submit`,
      body ?? {},
      { headers: idempotencyHeaders() },
    )
  }

  async approveClientCashAccount(accountId: string, body?: { expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<ClientCashAccount>>(
      `${BASE}/client-cash-accounts/${accountId}/approve`,
      body ?? {},
      { headers: idempotencyHeaders() },
    )
  }

  async rejectClientCashAccount(accountId: string, body: { reason: string; expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<ClientCashAccount>>(
      `${BASE}/client-cash-accounts/${accountId}/reject`,
      body,
      { headers: idempotencyHeaders() },
    )
  }

  async getCashPosition(
    portfolioId: string,
    params: { cashAccountId: string; currency?: string; asOf?: string },
  ) {
    return apiClient.get<OpsEnvelope<Record<string, unknown>>>(
      `${BASE}/portfolios/${portfolioId}/cash-position${qs(params)}`,
    )
  }

  async getCashExplanation(
    portfolioId: string,
    params: { cashAccountId: string; currency?: string },
  ) {
    return apiClient.get<OpsEnvelope<Record<string, unknown>>>(
      `${BASE}/portfolios/${portfolioId}/cash-explanation${qs(params)}`,
    )
  }

  // ── Ledger / journals ──────────────────────────────────────────────────────
  /** BA-RC-2: pass `tradeId` to filter journals linked from trade settle. */
  async getCashLedger(params?: {
    page?: number
    pageSize?: number
    view?: string
    accountPurpose?: string
    portfolioId?: string
    currency?: string
    to?: string
    from?: string
    tradeId?: string
    [key: string]: string | number | undefined
  }) {
    return apiClient.get<OpsEnvelope<OpsPaged<CashLedgerLine> | CashLedgerLine[]>>(
      `${BASE}/cash-ledger${qs(params ?? {})}`,
    )
  }

  async createCashJournal(data: Record<string, unknown>, idempotencyKey?: string) {
    return apiClient.post<OpsEnvelope<CashJournal>>(`${BASE}/cash-journals`, data, {
      headers: idempotencyHeaders(idempotencyKey ?? newIdempotencyKey('cj')),
    })
  }

  async getCashJournal(id: string) {
    return apiClient.get<OpsEnvelope<CashJournal>>(`${BASE}/cash-journals/${id}`)
  }

  async submitCashJournal(id: string, body?: { expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<CashJournal>>(`${BASE}/cash-journals/${id}/submit`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async approveCashJournal(id: string, body?: { expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<CashJournal>>(`${BASE}/cash-journals/${id}/approve`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectCashJournal(id: string, body: { reason: string; expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<CashJournal>>(`${BASE}/cash-journals/${id}/reject`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async reverseCashJournal(id: string, body: { reason: string; expectedVersion?: number }) {
    return apiClient.post<OpsEnvelope<CashJournal>>(`${BASE}/cash-journals/${id}/reverse`, body, {
      headers: idempotencyHeaders(),
    })
  }

  // ── Reservations ───────────────────────────────────────────────────────────
  async listCashReservations(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<Record<string, unknown>> | Record<string, unknown>[]>>(
      `${BASE}/cash-reservations${qs(params ?? {})}`,
    )
  }

  async createCashReservation(data: Record<string, unknown>) {
    return apiClient.post<OpsEnvelope<Record<string, unknown>>>(`${BASE}/cash-reservations`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async approveCashReservation(id: string, body?: { expectedVersion?: number }) {
    return apiClient.post(`${BASE}/cash-reservations/${id}/approve`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async consumeCashReservation(id: string, body?: Record<string, unknown>) {
    return apiClient.post(`${BASE}/cash-reservations/${id}/consume`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async releaseCashReservation(id: string, body?: Record<string, unknown>) {
    return apiClient.post(`${BASE}/cash-reservations/${id}/release`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  // ── External statements ────────────────────────────────────────────────────
  async createExternalStatementImport(data: Record<string, unknown>) {
    return apiClient.post(`${BASE}/external-statements/imports`, data, {
      headers: idempotencyHeaders(),
    })
  }

  /** One-shot: upload CSV, validate on the server, commit if valid. */
  async ingestExternalStatementImport(data: Record<string, unknown>) {
    return apiClient.post(`${BASE}/external-statements/imports/ingest`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async getExternalStatementImport(id: string) {
    return apiClient.get(`${BASE}/external-statements/imports/${id}`)
  }

  async validateExternalStatementImport(
    id: string,
    body: {
      controlOpening?: string | number
      controlClosing?: string | number
      requireControlTotals?: boolean
    } = {},
  ) {
    return apiClient.post(`${BASE}/external-statements/imports/${id}/validate`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async submitExternalStatementImport(id: string) {
    return apiClient.post(`${BASE}/external-statements/imports/${id}/submit`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async commitExternalStatementImport(
    id: string,
    body: {
      controlOpening?: string | number
      controlClosing?: string | number
    } = {},
  ) {
    return apiClient.post(`${BASE}/external-statements/imports/${id}/commit`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectExternalStatementImport(id: string, body: { reason: string }) {
    return apiClient.post(`${BASE}/external-statements/imports/${id}/reject`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async listExternalStatementImportErrors(id: string) {
    return apiClient.get(`${BASE}/external-statements/imports/${id}/errors`)
  }

  async listExternalStatementImports(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<Record<string, unknown>> | Record<string, unknown>[]>>(
      `${BASE}/external-statements/imports${qs(params ?? {})}`,
    )
  }

  // ── Period close / GL export ───────────────────────────────────────────────
  async listPeriodControls(period: string, params?: { legalEntityId?: string }) {
    return apiClient.get(
      `${BASE}/cash-periods/${encodeURIComponent(period)}/controls${qs(params ?? {})}`,
    )
  }

  async periodPrecheck(period: string, body?: Record<string, unknown>) {
    return apiClient.post(`${BASE}/cash-periods/${encodeURIComponent(period)}/precheck`, body ?? {})
  }

  async periodClose(period: string, body?: Record<string, unknown>, idempotencyKey?: string) {
    return apiClient.post(`${BASE}/cash-periods/${encodeURIComponent(period)}/close`, body ?? {}, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  }

  async periodReopenRequest(period: string, body?: Record<string, unknown>) {
    return apiClient.post(
      `${BASE}/cash-periods/${encodeURIComponent(period)}/reopen-request`,
      body ?? {},
    )
  }

  async periodRestate(period: string, body?: Record<string, unknown>, idempotencyKey?: string) {
    return apiClient.post(`${BASE}/cash-periods/${encodeURIComponent(period)}/restate`, body ?? {}, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  }

  async createGlExport(data: Record<string, unknown>, idempotencyKey?: string) {
    return apiClient.post(`${BASE}/cash-gl-exports`, data, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  }

  async getGlExport(id: string) {
    return apiClient.get(`${BASE}/cash-gl-exports/${id}`)
  }

  async retryGlExport(id: string, idempotencyKey?: string) {
    return apiClient.post(`${BASE}/cash-gl-exports/${id}/retry`, {}, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  }

  // ── Cash reconciliation batches ────────────────────────────────────────────
  async createReconciliationBatch(data: Record<string, unknown>) {
    return apiClient.post<OpsEnvelope<ReconciliationBatch>>(`${BASE}/reconciliation-batches`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async listReconciliationBatches(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<ReconciliationBatch> | ReconciliationBatch[]>>(
      `${BASE}/reconciliation-batches${qs(params ?? {})}`,
    )
  }

  async getReconciliationBatch(id: string) {
    return apiClient.get<OpsEnvelope<ReconciliationBatch>>(`${BASE}/reconciliation-batches/${id}`)
  }

  async deleteReconciliationBatch(id: string) {
    return apiClient.delete<OpsEnvelope<{ id: string; deleted?: boolean }>>(
      `${BASE}/reconciliation-batches/${id}`,
    )
  }

  async runReconciliationBatch(id: string) {
    return apiClient.post<OpsEnvelope<ReconciliationBatch>>(`${BASE}/reconciliation-batches/${id}/run`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async getBatchWorkspace(id: string) {
    return apiClient.get<OpsEnvelope<BatchWorkspace>>(`${BASE}/reconciliation-batches/${id}/workspace`)
  }

  async getBatchSummary(id: string) {
    return apiClient.get<OpsEnvelope<Record<string, unknown>>>(
      `${BASE}/reconciliation-batches/${id}/summary`,
    )
  }

  async autoMatchBatch(id: string) {
    return apiClient.post(`${BASE}/reconciliation-batches/${id}/auto-match`, {}, {
      headers: idempotencyHeaders(),
    })
  }

  async getActiveReconciliationRules() {
    return apiClient.get(`${BASE}/reconciliation-rules/active`)
  }

  async getFundCashSummary(params?: { fundId?: string; asOf?: string }) {
    return apiClient.get<OpsEnvelope<FundCashSummary>>(`${BASE}/fund-cash-summary${qs(params ?? {})}`)
  }

  // ── Matches / breaks ───────────────────────────────────────────────────────
  async confirmMatches(data: Record<string, unknown>) {
    return apiClient.post(`${BASE}/matches/confirm`, data, { headers: idempotencyHeaders() })
  }

  async manualMatch(data: Record<string, unknown>) {
    return apiClient.post(`${BASE}/matches/manual`, data, { headers: idempotencyHeaders() })
  }

  async reverseMatch(linkId: string, body?: Record<string, unknown>) {
    return apiClient.post(`${BASE}/matches/${linkId}/reverse`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async getBreak(breakId: string) {
    return apiClient.get(`${BASE}/reconciliation-breaks/${breakId}`)
  }

  async adjustInternalBreak(breakId: string, body: Record<string, unknown>) {
    return apiClient.post(`${BASE}/reconciliation-breaks/${breakId}/adjust-internal`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async markBreakReviewed(breakId: string, body?: Record<string, unknown>) {
    return apiClient.post(`${BASE}/reconciliation-breaks/${breakId}/mark-reviewed`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async commentOnBreak(breakId: string, body: { body: string }) {
    return apiClient.post(`${BASE}/reconciliation-breaks/${breakId}/comments`, body, {
      headers: idempotencyHeaders(),
    })
  }

  // ── Broker & custodian ─────────────────────────────────────────────────────
  async getBrokerCustodianWorkspace(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<BrokerCustodianItem> | BrokerCustodianItem[]>>(
      `${BASE}/broker-custodian/workspace${qs(params ?? {})}`,
    )
  }

  async confirmBrokerCustodianMatches(body: { itemIds: string[] }) {
    return apiClient.post(`${BASE}/broker-custodian/matches/confirm`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async escalateBrokerCustodianItem(id: string, body: { assignedToId?: string; notes?: string }) {
    return apiClient.post(`${BASE}/broker-custodian/items/${id}/escalate`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async clearBrokerCustodianItem(id: string, body: { reason: string }) {
    return apiClient.post(`${BASE}/broker-custodian/items/${id}/clear`, body, {
      headers: idempotencyHeaders(),
    })
  }

  // ── Exceptions ─────────────────────────────────────────────────────────────
  async listExceptions(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<ReconException> | ReconException[]>>(
      `${BASE}/reconciliation-exceptions${qs(params ?? {})}`,
    )
  }

  async getExceptionsSummary(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<Record<string, unknown>>>(
      `${BASE}/reconciliation-exceptions/summary${qs(params ?? {})}`,
    )
  }

  async getException(id: string) {
    return apiClient.get<OpsEnvelope<ReconException>>(`${BASE}/reconciliation-exceptions/${id}`)
  }

  async getExceptionTimeline(id: string) {
    return apiClient.get(`${BASE}/reconciliation-exceptions/${id}/timeline`)
  }

  async assignException(id: string, body: { assignedToId: string; expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/assign`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async investigateException(id: string, body?: { notes?: string; expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/investigate`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async proposeExceptionResolution(id: string, body: Record<string, unknown>) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/propose-resolution`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async approveException(id: string, body?: { expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/approve`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async rejectException(id: string, body: { reason: string; expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/reject`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async requestExceptionInfo(id: string, body: { notes: string; expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/request-info`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async closeException(id: string, body?: { expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/close`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async reopenException(id: string, body: { reason: string; expectedVersion?: number }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/reopen`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async listExceptionComments(id: string) {
    return apiClient.get<OpsEnvelope<Array<Record<string, unknown>> | OpsPaged<Record<string, unknown>>>>(
      `${BASE}/reconciliation-exceptions/${id}/comments`,
    )
  }

  async postExceptionComment(id: string, body: { body: string }) {
    return apiClient.post<OpsEnvelope<{ id: string; body: string; createdAt?: string; authorName?: string }>>(
      `${BASE}/reconciliation-exceptions/${id}/comments`,
      body,
      { headers: idempotencyHeaders() },
    )
  }

  async listExceptionAttachments(id: string) {
    return apiClient.get<OpsEnvelope<Array<Record<string, unknown>> | OpsPaged<Record<string, unknown>>>>(
      `${BASE}/reconciliation-exceptions/${id}/attachments`,
    )
  }

  async postExceptionAttachment(id: string, body: { fileId: string; fileName?: string; note?: string }) {
    return apiClient.post(`${BASE}/reconciliation-exceptions/${id}/attachments`, body, {
      headers: idempotencyHeaders(),
    })
  }

  async getExceptionAudit(id: string) {
    return apiClient.get(`${BASE}/reconciliation-exceptions/${id}/audit`)
  }

  // ── Client statements ──────────────────────────────────────────────────────
  async listClientStatements(params?: Record<string, string | number | undefined>) {
    return apiClient.get<OpsEnvelope<OpsPaged<ClientStatement> | ClientStatement[]>>(
      `${BASE}/client-statements${qs(params ?? {})}`,
    )
  }

  async getClientStatementsSummary(params?: Record<string, string | number | undefined>) {
    return apiClient.get(`${BASE}/client-statements/summary${qs(params ?? {})}`)
  }

  async getClientStatement(id: string) {
    return apiClient.get<OpsEnvelope<ClientStatement>>(`${BASE}/client-statements/${id}`)
  }

  async previewClientStatement(id: string) {
    return apiClient.get(`${BASE}/client-statements/${id}/preview`)
  }

  async downloadClientStatement(id: string, opts?: { acceptPdf?: boolean }) {
    if (opts?.acceptPdf) {
      // Binary PDF — must use blob or apiClient JSON-parses and corrupts the file
      return apiClient.get<Blob>(`${BASE}/client-statements/${id}/download`, {
        headers: { Accept: 'application/pdf, application/json' },
        responseType: 'blob',
      })
    }
    return apiClient.get<
      | Blob
      | OpsEnvelope<{ contentBase64?: string; downloadUrl?: string | null; fileName?: string }>
    >(`${BASE}/client-statements/${id}/download`)
  }

  async generateClientStatement(data: Record<string, unknown>) {
    return apiClient.post<OpsEnvelope<ClientStatement>>(`${BASE}/client-statements/generate`, data, {
      headers: idempotencyHeaders(),
    })
  }

  async approveClientStatement(id: string, body?: { expectedVersion?: number }) {
    return apiClient.post(`${BASE}/client-statements/${id}/approve`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  async emailClientStatement(id: string, body?: Record<string, unknown>) {
    return apiClient.post(`${BASE}/client-statements/${id}/email`, body ?? {}, {
      headers: idempotencyHeaders(),
    })
  }

  // ── Cash setup catalogs ────────────────────────────────────────────────────
  async listSetupProviders(params?: Record<string, string | number | undefined>) {
    return apiClient.get(`${BASE}/setup/providers${qs(params ?? {})}`)
  }

  async listSetupFileLayouts(params?: Record<string, string | number | undefined>) {
    return apiClient.get(`${BASE}/setup/file-layouts${qs(params ?? {})}`)
  }
}

export const stockPickerCashApi = new StockPickerCashApi()
