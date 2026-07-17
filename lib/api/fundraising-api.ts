/**
 * Fundraising & Investor Relations API client.
 * Mounts: /fundraising, /investors — never /v1 or /fundraising/deals.
 * Contract: design-refs/fundraising-frontend-api.md
 */
import { apiClient, ApiError, type ApiResponse } from '@/lib/api/api-client'
import { toast } from 'sonner'

const FR = '/fundraising'
const INV = '/investors'

// ─── helpers ─────────────────────────────────────────────────────────────────

export function asNumber(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : fallback
}

export function unwrapData<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === 'object' && 'success' in (res as object) && 'data' in (res as object)) {
    return (res as ApiResponse<T>).data as T
  }
  return res as T
}

export type FrErrorBody = {
  code?: string
  message?: string
  unmetRequirements?: string[]
  unmet?: string[]
}

export function getFrError(err: unknown): FrErrorBody {
  if (err instanceof ApiError) {
    const body = err.response?.error ?? err.response ?? {}
    return {
      code: body.code ?? body.error?.code,
      message: body.message ?? err.message,
      unmetRequirements: body.unmetRequirements ?? body.error?.unmetRequirements,
      unmet: body.unmet ?? body.error?.unmet,
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return { message: String((err as Error).message) }
  }
  return { message: 'Request failed' }
}

/** Toast domain errors; returns structured body for UI checklists. */
export function toastFrError(err: unknown, fallback = 'Request failed'): FrErrorBody {
  const body = getFrError(err)
  const code = body.code
  const checklist = body.unmetRequirements?.length
    ? body.unmetRequirements
    : body.unmet?.length
      ? body.unmet
      : null

  if (code === 'STAGE_GATE_FAILED') {
    toast.error(body.message || 'Stage gate requirements not met', {
      description: checklist?.slice(0, 6).join(' · '),
      duration: 8000,
    })
  } else if (code === 'ACTIVATION_REQUIREMENTS_UNMET') {
    toast.error(body.message || 'Campaign cannot be activated', {
      description: checklist?.slice(0, 6).join(' · '),
      duration: 8000,
    })
  } else if (code === 'COMPLIANCE_BLOCKED') {
    toast.error(body.message || 'Blocked by compliance')
  } else if (code === 'CAMPAIGN_NOT_ACTIVE') {
    toast.error(body.message || 'Campaign must be ACTIVE first')
  } else if (code === 'VALIDATION_ERROR') {
    toast.error(body.message || 'Validation failed')
  } else if (code?.endsWith('_NOT_FOUND')) {
    toast.error(body.message || 'Not found')
  } else if (code === 'FUND_REQUIRED') {
    toast.error(body.message || 'Fund is required for this campaign type')
  } else if (code === 'STAGE_IN_USE') {
    toast.error(body.message || 'Stage is in use and cannot be deleted')
  } else if (code === 'SETTINGS_NOT_FOUND') {
    toast.error(body.message || 'Settings not found')
  } else {
    toast.error(body.message || fallback)
  }
  return body
}

function qs(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

// ─── types (loose; UI maps to view models) ───────────────────────────────────

export type FrPaginated<T> = {
  items: T[]
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
}

export type FrInvestor = Record<string, any>
export type FrContact = Record<string, any>
export type FrCampaign = Record<string, any>
export type FrOpportunity = Record<string, any>
export type FrBoard = {
  campaignId: string
  columns: Array<{
    stage: Record<string, any>
    cards: FrOpportunity[]
    totals?: Record<string, any>
  }>
}

// ─── Investors ───────────────────────────────────────────────────────────────

async function listInvestors(params?: {
  q?: string
  status?: string
  investorType?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiResponse<FrPaginated<FrInvestor>>>(
    `${INV}${qs(params)}`
  )
  return unwrapData(res)
}

async function createInvestor(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<FrInvestor>>(INV, body)
  return unwrapData(res)
}

async function getInvestor(investorId: string) {
  const res = await apiClient.get<ApiResponse<FrInvestor>>(`${INV}/${investorId}`)
  return unwrapData(res)
}

async function patchInvestor(investorId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<FrInvestor>>(`${INV}/${investorId}`, body)
  return unwrapData(res)
}

async function getInvestor360(investorId: string) {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(`${INV}/${investorId}/360`)
  return unwrapData(res)
}

async function getRelationshipSummary(investorId: string) {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(
    `${INV}/${investorId}/relationship-summary`
  )
  return unwrapData(res)
}

async function createContact(investorId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<FrContact>>(
    `${INV}/${investorId}/contacts`,
    body
  )
  return unwrapData(res)
}

async function patchContact(
  investorId: string,
  contactId: string,
  body: Record<string, any>
) {
  const res = await apiClient.patch<ApiResponse<FrContact>>(
    `${INV}/${investorId}/contacts/${contactId}`,
    body
  )
  return unwrapData(res)
}

async function archiveContact(investorId: string, contactId: string) {
  const res = await apiClient.post<ApiResponse<FrContact>>(
    `${INV}/${investorId}/contacts/${contactId}/archive`
  )
  return unwrapData(res)
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

async function getDashboard(params?: { campaignId?: string; campaignType?: string }) {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(
    `${FR}/dashboard${qs(params)}`
  )
  return unwrapData(res)
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

async function listCampaigns(params?: {
  campaignType?: string
  status?: string
  fundId?: string
}) {
  const res = await apiClient.get<ApiResponse<FrCampaign[] | FrPaginated<FrCampaign>>>(
    `${FR}/campaigns${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<FrCampaign>).items ?? []
}

async function createCampaign(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<FrCampaign>>(`${FR}/campaigns`, body)
  return unwrapData(res)
}

async function getCampaign(campaignId: string) {
  const res = await apiClient.get<ApiResponse<FrCampaign>>(`${FR}/campaigns/${campaignId}`)
  return unwrapData(res)
}

async function patchCampaign(campaignId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<FrCampaign>>(
    `${FR}/campaigns/${campaignId}`,
    body
  )
  return unwrapData(res)
}

async function activateCampaign(campaignId: string) {
  const res = await apiClient.post<ApiResponse<FrCampaign>>(
    `${FR}/campaigns/${campaignId}/activate`
  )
  return unwrapData(res)
}

async function getCampaignDashboard(campaignId: string) {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(
    `${FR}/campaigns/${campaignId}/dashboard`
  )
  return unwrapData(res)
}

async function getCampaignBoard(campaignId: string) {
  const res = await apiClient.get<ApiResponse<FrBoard>>(
    `${FR}/campaigns/${campaignId}/board`
  )
  return unwrapData(res)
}

async function getCampaignMetrics(campaignId: string) {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(
    `${FR}/campaigns/${campaignId}/metrics`
  )
  return unwrapData(res)
}

async function pauseCampaign(campaignId: string, reason: string) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/campaigns/${campaignId}/pause`,
    { reason },
  )
  return unwrapData(res)
}

async function submitCampaignForApproval(campaignId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/campaigns/${campaignId}/submit-for-approval`,
    body,
  )
  return unwrapData(res)
}

type CampaignOpsResource = 'templates' | 'distribution-lists' | 'events' | 'materials'

async function listCampaignOps(campaignId: string, resource: CampaignOpsResource) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/campaigns/${campaignId}/${resource}`,
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createCampaignOps(
  campaignId: string,
  resource: CampaignOpsResource,
  body: Record<string, any>,
  file?: File,
) {
  if (file) {
    const form = new FormData()
    form.append('file', file)
    Object.entries(body).forEach(([key, value]) => {
      if (value != null) form.append(key, typeof value === 'string' ? value : JSON.stringify(value))
    })
    const res = await apiClient.postFormData<ApiResponse<any>>(
      `${FR}/campaigns/${campaignId}/${resource}`,
      form,
    )
    return unwrapData(res)
  }
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/campaigns/${campaignId}/${resource}`,
    body,
  )
  return unwrapData(res)
}

// ─── Opportunities ───────────────────────────────────────────────────────────

async function listOpportunities(params?: {
  campaignId?: string
  campaignType?: string
  investorId?: string
  status?: string
  stageCode?: string
  ownerId?: string
}) {
  const res = await apiClient.get<ApiResponse<FrOpportunity[] | FrPaginated<FrOpportunity>>>(
    `${FR}/opportunities${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<FrOpportunity>).items ?? []
}

async function createOpportunity(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<FrOpportunity>>(`${FR}/opportunities`, body)
  return unwrapData(res)
}

async function getOpportunity(opportunityId: string) {
  const res = await apiClient.get<ApiResponse<FrOpportunity>>(
    `${FR}/opportunities/${opportunityId}`
  )
  return unwrapData(res)
}

async function patchOpportunity(opportunityId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<FrOpportunity>>(
    `${FR}/opportunities/${opportunityId}`,
    body
  )
  return unwrapData(res)
}

async function transitionOpportunity(
  opportunityId: string,
  body: { toStageCode?: string; toStageId?: string; reason?: string }
) {
  const res = await apiClient.post<ApiResponse<FrOpportunity>>(
    `${FR}/opportunities/${opportunityId}/transition`,
    body
  )
  return unwrapData(res)
}

async function assignOpportunity(opportunityId: string, opportunityOwnerId: string) {
  const res = await apiClient.post<ApiResponse<FrOpportunity>>(
    `${FR}/opportunities/${opportunityId}/assign`,
    { opportunityOwnerId }
  )
  return unwrapData(res)
}

async function markOpportunityLost(opportunityId: string, lostReason: string) {
  const res = await apiClient.post<ApiResponse<FrOpportunity>>(
    `${FR}/opportunities/${opportunityId}/mark-lost`,
    { lostReason }
  )
  return unwrapData(res)
}

async function setOpportunityStatus(
  opportunityId: string,
  body: { status: string; reason?: string }
) {
  const res = await apiClient.post<ApiResponse<FrOpportunity>>(
    `${FR}/opportunities/${opportunityId}/set-status`,
    body
  )
  return unwrapData(res)
}

async function getOpportunityTimeline(opportunityId: string) {
  const res = await apiClient.get<ApiResponse<{ opportunityId: string; events: any[] }>>(
    `${FR}/opportunities/${opportunityId}/timeline`
  )
  return unwrapData(res)
}

async function getOpportunityChecklist(opportunityId: string, stageId?: string) {
  const res = await apiClient.get<ApiResponse<any>>(
    `${FR}/opportunities/${opportunityId}/checklist${qs({ stageId })}`
  )
  return unwrapData(res)
}

async function patchOpportunityChecklist(
  opportunityId: string,
  body: { items: Array<Record<string, any>> }
) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `${FR}/opportunities/${opportunityId}/checklist`,
    body
  )
  return unwrapData(res)
}

async function getCommercialTerms(opportunityId: string) {
  const res = await apiClient.get<ApiResponse<any>>(
    `${FR}/opportunities/${opportunityId}/commercial-terms`
  )
  return unwrapData(res)
}

async function putCommercialTerms(opportunityId: string, body: Record<string, any>) {
  const res = await apiClient.put<ApiResponse<any>>(
    `${FR}/opportunities/${opportunityId}/commercial-terms`,
    body
  )
  return unwrapData(res)
}

// ─── Communications / Tasks ──────────────────────────────────────────────────

async function listCommunications(params?: {
  campaignId?: string
  opportunityId?: string
  investorId?: string
  external?: boolean
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/communications${qs(params as any)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createCommunication(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/communications`, body)
  return unwrapData(res)
}

async function getCommunication(communicationId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/communications/${communicationId}`)
  return unwrapData(res)
}

async function listTasks(params?: {
  campaignId?: string
  opportunityId?: string
  investorId?: string
}) {
  const res = await apiClient.get<ApiResponse<{
    performanceTasks?: any[]
    internalTaskCommunications?: any[]
  }>>(`${FR}/tasks${qs(params)}`)
  return unwrapData(res)
}

async function createTask(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/tasks`, body)
  return unwrapData(res)
}

async function patchTask(taskId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/tasks/${taskId}`, body)
  return unwrapData(res)
}

// ─── Commitments / Closings ──────────────────────────────────────────────────

async function listCommitments(params?: {
  campaignId?: string
  investorId?: string
  opportunityId?: string
  status?: string
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/commitments${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createCommitment(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/commitments`, body)
  return unwrapData(res)
}

async function getCommitment(commitmentId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/commitments/${commitmentId}`)
  return unwrapData(res)
}

async function patchCommitment(commitmentId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `${FR}/commitments/${commitmentId}`,
    body
  )
  return unwrapData(res)
}

async function admitCommitment(commitmentId: string, body?: { closingId?: string }) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/commitments/${commitmentId}/admit`,
    body ?? {}
  )
  return unwrapData(res)
}

async function fundCommitment(
  commitmentId: string,
  body: { fundedAmount: number; accountingStatus?: string }
) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/commitments/${commitmentId}/fund`,
    body
  )
  return unwrapData(res)
}

async function listClosings(params?: { campaignId?: string; status?: string }) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/closings${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createClosing(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/closings`, body)
  return unwrapData(res)
}

async function getClosing(closingId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/closings/${closingId}`)
  return unwrapData(res)
}

async function patchClosing(closingId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/closings/${closingId}`, body)
  return unwrapData(res)
}

async function postClosingReadiness(closingId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/closings/${closingId}/readiness`,
    body
  )
  return unwrapData(res)
}

// ─── Mandates / RFPs ─────────────────────────────────────────────────────────

async function listMandates() {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(`${FR}/mandates`)
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createMandate(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/mandates`, body)
  return unwrapData(res)
}

async function getMandate(mandateId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/mandates/${mandateId}`)
  return unwrapData(res)
}

async function patchMandate(mandateId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/mandates/${mandateId}`, body)
  return unwrapData(res)
}

async function activateMandate(mandateId: string) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/mandates/${mandateId}/activate`)
  return unwrapData(res)
}

async function listRfps() {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(`${FR}/rfps`)
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createRfp(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/rfps`, body)
  return unwrapData(res)
}

async function getRfp(rfpId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/rfps/${rfpId}`)
  return unwrapData(res)
}

async function patchRfp(rfpId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/rfps/${rfpId}`, body)
  return unwrapData(res)
}

async function convertRfpToMandate(rfpId: string) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/rfps/${rfpId}/convert-to-mandate`)
  return unwrapData(res)
}

// ─── Approvals ───────────────────────────────────────────────────────────────

async function listApprovals(params?: { status?: string; objectType?: string }) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/approvals${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function decideApproval(
  approvalId: string,
  body: { decision: 'APPROVED' | 'REJECTED'; decisionNotes?: string }
) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/approvals/${approvalId}/decide`,
    body
  )
  return unwrapData(res)
}

// ─── DDQ / KYC ───────────────────────────────────────────────────────────────

async function listDdqTemplates() {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(`${FR}/ddq/templates`)
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createDdqTemplate(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/ddq/templates`, body)
  return unwrapData(res)
}

async function listDdqCases(params?: {
  investorId?: string
  campaignId?: string
  opportunityId?: string
  status?: string
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/ddq/cases${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createDdqCase(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/ddq/cases`, body)
  return unwrapData(res)
}

async function getDdqCase(caseId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/ddq/cases/${caseId}`)
  return unwrapData(res)
}

async function patchDdqCase(caseId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/ddq/cases/${caseId}`, body)
  return unwrapData(res)
}

async function uploadDdqEvidence(caseId: string, itemId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await apiClient.postFormData<ApiResponse<any>>(
    `${FR}/ddq/cases/${caseId}/items/${itemId}/evidence`,
    fd
  )
  return unwrapData(res)
}

async function listKycCases(params?: { investorId?: string; status?: string }) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/kyc-cases${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createKycCase(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/kyc-cases`, body)
  return unwrapData(res)
}

async function getKycCase(caseId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/kyc-cases/${caseId}`)
  return unwrapData(res)
}

async function patchKycCase(caseId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/kyc-cases/${caseId}`, body)
  return unwrapData(res)
}

// ─── Data rooms ──────────────────────────────────────────────────────────────

async function listDataRooms(campaignId: string) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/campaigns/${campaignId}/data-rooms`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createDataRoom(campaignId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/campaigns/${campaignId}/data-rooms`,
    body
  )
  return unwrapData(res)
}

async function getDataRoom(dataRoomId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/data-rooms/${dataRoomId}`)
  return unwrapData(res)
}

async function patchDataRoom(dataRoomId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/data-rooms/${dataRoomId}`, body)
  return unwrapData(res)
}

async function createDataRoomFolder(dataRoomId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/data-rooms/${dataRoomId}/folders`,
    body
  )
  return unwrapData(res)
}

async function uploadDataRoomDocument(
  dataRoomId: string,
  file: File,
  fields?: Record<string, string>
) {
  const fd = new FormData()
  fd.append('file', file)
  if (fields) {
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  }
  const res = await apiClient.postFormData<ApiResponse<any>>(
    `${FR}/data-rooms/${dataRoomId}/documents`,
    fd
  )
  return unwrapData(res)
}

async function downloadDataRoomDocument(dataRoomId: string, documentId: string) {
  return apiClient.get<Blob>(
    `${FR}/data-rooms/${dataRoomId}/documents/${documentId}/download`,
    { responseType: 'blob' }
  )
}

async function grantDataRoomAccess(dataRoomId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/data-rooms/${dataRoomId}/access`,
    body
  )
  return unwrapData(res)
}

// ─── Agreements ──────────────────────────────────────────────────────────────

async function listAgreements(params?: {
  opportunityId?: string
  investorId?: string
  campaignId?: string
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/agreements${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createAgreement(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/agreements`, body)
  return unwrapData(res)
}

async function getAgreement(agreementId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/agreements/${agreementId}`)
  return unwrapData(res)
}

async function uploadAgreementVersion(agreementId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await apiClient.postFormData<ApiResponse<any>>(
    `${FR}/agreements/${agreementId}/versions`,
    fd
  )
  return unwrapData(res)
}

async function addSignatory(agreementId: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/agreements/${agreementId}/signatories`,
    body
  )
  return unwrapData(res)
}

async function signSignatory(
  agreementId: string,
  signatoryId: string,
  body: { certificateRef: string }
) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/agreements/${agreementId}/signatories/${signatoryId}/sign`,
    body
  )
  return unwrapData(res)
}

// ─── Placement agents ────────────────────────────────────────────────────────

async function listPlacementAgents() {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/placement-agents`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createPlacementAgent(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/placement-agents`, body)
  return unwrapData(res)
}

async function getPlacementAgent(agentId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/placement-agents/${agentId}`)
  return unwrapData(res)
}

async function patchPlacementAgent(agentId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `${FR}/placement-agents/${agentId}`,
    body
  )
  return unwrapData(res)
}

async function assignPlacementOpportunity(agentId: string, opportunityId: string) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/placement-agents/${agentId}/assign-opportunity`,
    { opportunityId }
  )
  return unwrapData(res)
}

// ─── Forecasts / Analytics / Reports / Audit ─────────────────────────────────

async function listForecastScenarios(params?: { campaignId?: string }) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/forecasts/scenarios${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createForecastScenario(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/forecasts/scenarios`, body)
  return unwrapData(res)
}

async function getAnalyticsFunnel(params?: { campaignId?: string }) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/analytics/funnel${qs(params)}`)
  return unwrapData(res)
}

async function getAnalyticsSource(params?: { campaignId?: string }) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/analytics/source${qs(params)}`)
  return unwrapData(res)
}

async function getAnalyticsOwnerPerformance(params?: { campaignId?: string }) {
  const res = await apiClient.get<ApiResponse<any>>(
    `${FR}/analytics/owner-performance${qs(params)}`
  )
  return unwrapData(res)
}

async function getAnalyticsStageAgeing(params?: { campaignId?: string }) {
  const res = await apiClient.get<ApiResponse<any>>(
    `${FR}/analytics/stage-ageing${qs(params)}`
  )
  return unwrapData(res)
}

async function getReport(reportKey: string, params?: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<any>>(
    `${FR}/reports/${reportKey}${qs(params)}`
  )
  return unwrapData(res)
}

async function listAuditLogs(params?: {
  objectType?: string
  objectId?: string
  userId?: string
  action?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
  limit?: number
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/audit-logs${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function exportAuditLogs(params?: Record<string, string | number | undefined>) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/audit-logs/export${qs(params as any)}`)
  return unwrapData(res)
}

// ─── Settings (FE gaps) ──────────────────────────────────────────────────────

async function getSettings() {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(`${FR}/settings`)
  return unwrapData(res)
}

async function patchSettings(body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<Record<string, any>>>(`${FR}/settings`, body)
  return unwrapData(res)
}

async function createPipelineStage(pipelineKey: string, body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/settings/pipelines/${pipelineKey}/stages`,
    body
  )
  return unwrapData(res)
}

async function patchPipelineStage(
  pipelineKey: string,
  stageId: string,
  body: Record<string, any>
) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `${FR}/settings/pipelines/${pipelineKey}/stages/${stageId}`,
    body
  )
  return unwrapData(res)
}

async function deletePipelineStage(pipelineKey: string, stageId: string) {
  const res = await apiClient.delete<ApiResponse<any>>(
    `${FR}/settings/pipelines/${pipelineKey}/stages/${stageId}`
  )
  return unwrapData(res)
}

async function patchStageGates(body: { gates: Array<Record<string, any>> }) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/settings/stage-gates`, body)
  return unwrapData(res)
}

async function patchAmountTypes(body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/settings/amount-types`, body)
  return unwrapData(res)
}

async function patchNotificationSettings(body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/settings/notifications`, body)
  return unwrapData(res)
}

// ─── Meetings (dedicated resource) ───────────────────────────────────────────

async function listMeetings(params?: {
  campaignId?: string
  investorId?: string
  opportunityId?: string
  ownerId?: string
  from?: string
  to?: string
  meetingType?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/meetings${qs(params)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createMeeting(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/meetings`, body)
  return unwrapData(res)
}

async function getMeeting(meetingId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/meetings/${meetingId}`)
  return unwrapData(res)
}

async function patchMeeting(meetingId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/meetings/${meetingId}`, body)
  return unwrapData(res)
}

async function cancelMeeting(meetingId: string, body?: { reason?: string }) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/meetings/${meetingId}/cancel`,
    body ?? {}
  )
  return unwrapData(res)
}

async function completeMeeting(meetingId: string, body?: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(
    `${FR}/meetings/${meetingId}/complete`,
    body ?? {}
  )
  return unwrapData(res)
}

// ─── Documents (unified index) ───────────────────────────────────────────────

async function listDocuments(params?: {
  campaignId?: string
  investorId?: string
  opportunityId?: string
  category?: string
  q?: string
  confidential?: boolean
  sourceType?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/documents${qs(params as any)}`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function createDocument(body: Record<string, any>, file?: File) {
  if (file) {
    const fd = new FormData()
    fd.append('file', file)
    Object.entries(body).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, typeof v === 'string' ? v : JSON.stringify(v))
    })
    const res = await apiClient.postFormData<ApiResponse<any>>(`${FR}/documents`, fd)
    return unwrapData(res)
  }
  const res = await apiClient.post<ApiResponse<any>>(`${FR}/documents`, body)
  return unwrapData(res)
}

async function getDocument(documentId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/documents/${documentId}`)
  return unwrapData(res)
}

async function patchDocument(documentId: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${FR}/documents/${documentId}`, body)
  return unwrapData(res)
}

async function downloadDocument(documentId: string) {
  return apiClient.get<Blob>(`${FR}/documents/${documentId}/download`, {
    responseType: 'blob',
  })
}

async function exportDocuments(params?: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/documents/export${qs(params as any)}`)
  return unwrapData(res)
}

async function exportDdqCase(caseId: string) {
  const res = await apiClient.get<ApiResponse<any>>(`${FR}/ddq/cases/${caseId}/export`)
  return unwrapData(res)
}

// ─── Extras ──────────────────────────────────────────────────────────────────

async function getCampaignEngagement(campaignId: string) {
  const res = await apiClient.get<ApiResponse<Record<string, any>>>(
    `${FR}/campaigns/${campaignId}/engagement`
  )
  return unwrapData(res)
}

async function getForecastScenarioCurve(scenarioId: string) {
  const res = await apiClient.get<ApiResponse<{
    scenarioId: string
    monthlyProjection: Array<{ month: string; cumulativeSigned: number }>
  }>>(`${FR}/forecasts/scenarios/${scenarioId}/curve`)
  return unwrapData(res)
}

async function listPlacementCommissions(agentId: string) {
  const res = await apiClient.get<ApiResponse<any[] | FrPaginated<any>>>(
    `${FR}/placement-agents/${agentId}/commissions`
  )
  const data = unwrapData(res)
  if (Array.isArray(data)) return data
  return (data as FrPaginated<any>).items ?? []
}

async function getCommitmentChecklist(commitmentId: string) {
  const res = await apiClient.get<ApiResponse<any>>(
    `${FR}/commitments/${commitmentId}/checklist`
  )
  return unwrapData(res)
}

async function patchCommitmentChecklistItem(
  commitmentId: string,
  itemId: string,
  body: { isComplete: boolean }
) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `${FR}/commitments/${commitmentId}/checklist/${itemId}`,
    body
  )
  return unwrapData(res)
}

// ─── export ──────────────────────────────────────────────────────────────────

export const fundraisingApi = {
  // investors
  listInvestors,
  createInvestor,
  getInvestor,
  patchInvestor,
  getInvestor360,
  getRelationshipSummary,
  createContact,
  patchContact,
  archiveContact,
  // dashboard / campaigns
  getDashboard,
  listCampaigns,
  createCampaign,
  getCampaign,
  patchCampaign,
  activateCampaign,
  getCampaignDashboard,
  getCampaignBoard,
  getCampaignMetrics,
  pauseCampaign,
  submitCampaignForApproval,
  listCampaignOps,
  createCampaignOps,
  // opportunities
  listOpportunities,
  createOpportunity,
  getOpportunity,
  patchOpportunity,
  transitionOpportunity,
  assignOpportunity,
  markOpportunityLost,
  setOpportunityStatus,
  getOpportunityTimeline,
  getOpportunityChecklist,
  patchOpportunityChecklist,
  getCommercialTerms,
  putCommercialTerms,
  // comms / tasks
  listCommunications,
  createCommunication,
  getCommunication,
  listTasks,
  createTask,
  patchTask,
  // commitments / closings
  listCommitments,
  createCommitment,
  getCommitment,
  patchCommitment,
  admitCommitment,
  fundCommitment,
  listClosings,
  createClosing,
  getClosing,
  patchClosing,
  postClosingReadiness,
  // mandates / rfps
  listMandates,
  createMandate,
  getMandate,
  patchMandate,
  activateMandate,
  listRfps,
  createRfp,
  getRfp,
  patchRfp,
  convertRfpToMandate,
  // approvals
  listApprovals,
  decideApproval,
  // ddq / kyc
  listDdqTemplates,
  createDdqTemplate,
  listDdqCases,
  createDdqCase,
  getDdqCase,
  patchDdqCase,
  uploadDdqEvidence,
  listKycCases,
  createKycCase,
  getKycCase,
  patchKycCase,
  // data rooms
  listDataRooms,
  createDataRoom,
  getDataRoom,
  patchDataRoom,
  createDataRoomFolder,
  uploadDataRoomDocument,
  downloadDataRoomDocument,
  grantDataRoomAccess,
  // agreements
  listAgreements,
  createAgreement,
  getAgreement,
  uploadAgreementVersion,
  addSignatory,
  signSignatory,
  // placement
  listPlacementAgents,
  createPlacementAgent,
  getPlacementAgent,
  patchPlacementAgent,
  assignPlacementOpportunity,
  // forecasts / analytics / reports / audit
  listForecastScenarios,
  createForecastScenario,
  getAnalyticsFunnel,
  getAnalyticsSource,
  getAnalyticsOwnerPerformance,
  getAnalyticsStageAgeing,
  getReport,
  listAuditLogs,
  exportAuditLogs,
  // settings
  getSettings,
  patchSettings,
  createPipelineStage,
  patchPipelineStage,
  deletePipelineStage,
  patchStageGates,
  patchAmountTypes,
  patchNotificationSettings,
  // meetings
  listMeetings,
  createMeeting,
  getMeeting,
  patchMeeting,
  cancelMeeting,
  completeMeeting,
  // documents index
  listDocuments,
  createDocument,
  getDocument,
  patchDocument,
  downloadDocument,
  exportDocuments,
  exportDdqCase,
  // extras
  getCampaignEngagement,
  getForecastScenarioCurve,
  listPlacementCommissions,
  getCommitmentChecklist,
  patchCommitmentChecklistItem,
}
