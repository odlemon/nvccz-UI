/**
 * Procurement V23 API client.
 *
 * Backend route contract (nvccz — src/routes/procurementRoutes.ts, vendorQuotationRoutes.ts,
 * vendorRoutes.ts, procurementApprovalConfigRoutes.ts):
 *
 *   GET    /procurement/me/access                         effective procurement.* grants + department role
 *   GET    /procurement/dashboard                         commitment accounting and register counts
 *   GET    /procurement/requisitions                      every department (procurement.requisitions.view),
 *                                                         else the caller's own department (HEAD/DEPUTY)
 *   GET    /procurement/requisitions/my                   the caller's own, drafts included
 *   GET    /procurement/requisitions/pending-approval     department head's queue
 *   GET    /procurement/requisitions/:id
 *   POST   /procurement/requisitions                      {title, department, priority, justification, requiredDate,
 *                                                         deliveryLocation, budgetCode, items[{itemName, quantity, unit}]}
 *   POST   /procurement/requisitions/:id/attachments       multipart `files[]`; owner-gated, not procurement.documents.manage
 *   GET    /procurement/requisitions/:id/attachments
 *   PUT    /procurement/requisitions/:id/submit
 *   PUT    /procurement/requisitions/:id/approve          the requisition's department HEAD or DEPUTY
 *   PUT    /procurement/requisitions/:id/reject           {rejectionReason}
 *   GET    /procurement/rfq                               RFQ register
 *   POST   /procurement/rfq                               {purchaseRequisitionId, title, vendorIds[], rfqDeadline, ...}
 *   GET    /procurement/rfqs/:id/comparison-matrix
 *   GET    /vendor-quotations                             quotations received from vendors
 *   POST   /vendor-quotations/:id/accept                  the award: accepts the quotation and raises the PO
 *   POST   /vendor-quotations/:id/reject                  {rejectionReason, reviewNotes}
 *   PUT    /vendor-quotations/:id/evaluation              {score 0-100, notes}: the evaluation team's technical score
 *   GET    /procurement/purchase-orders[/:id]
 *   POST   /procurement/purchase-orders                   {vendorId, items[{itemName, quantity, unitPrice}], ...}
 *   POST   /procurement/purchase-orders/:id/send
 *   GET    /procurement/purchase-orders/:id/pdf
 *   GET    /procurement/goods-received-notes[/:id]
 *   POST   /procurement/goods-received-notes              {purchaseOrderId, receivedDate, items[{purchaseOrderItemId,
 *                                                          quantityReceived, quantityAccepted, quantityRejected}]}
 *   PUT    /procurement/goods-received-notes/:id/approve  {qualityNotes}
 *   PUT    /procurement/goods-received-notes/:id/reject   {rejectionReason, qualityNotes}
 *   GET    /procurement/invoices
 *   POST   /procurement/invoices                          staff capture {purchaseOrderId, vendorId, invoiceDate, dueDate, items[]}
 *   PUT    /procurement/invoices/:id/approve              {isTaxable}
 *   POST   /procurement/invoices/:id/payment              multipart: proofOfPayment, paymentAmount, paymentDate,
 *                                                         paymentMethod (CASH|BANK), bankAccountId, paymentReference
 *   GET    /procurement/payments
 *   GET    /accounting/vendors, POST, PUT /:id            vendor master, shared with accounting
 *   POST   /accounting/vendors/:id/blacklist              {blacklistReason}
 *   POST   /accounting/vendors/:id/unblacklist
 *   GET    /procurement-approval-configs
 *   GET    /procurement/audit-events                      procurement audit trail, newest first (procurement.audit.view)
 *
 * Authorisation: every route is staff-only, and most carry a procurement.* permission
 * (nvccz src/config/procurementPermissions.ts). A 403 means the role lacks the grant, not that
 * the endpoint is broken — surface it, never swallow it.
 *
 * NOTE: lib/api/procurement-api.ts and procurement-api-v2.ts belong to the frozen legacy
 * /procurement module. Nothing here modifies or imports them.
 *
 * Spec: design-refs/procurement-v23-backend-asks.md
 */
import { apiClient, type ApiResponse } from "@/lib/api/api-client"
import { toast } from "sonner"

/** Strip the {success, data} envelope the backend wraps most payloads in. */
export function unwrapData<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "success" in (res as object) && "data" in (res as object)) {
    return (res as ApiResponse<T>).data as T
  }
  return res as T
}

type ErrorBody = { status?: number; message?: string; error?: string; code?: string }

export function readProcurementError(err: unknown): ErrorBody {
  const anyErr = err as any
  const status = anyErr?.status ?? anyErr?.response?.status
  const body = anyErr?.data ?? anyErr?.response?.data ?? {}
  return {
    status,
    message: body?.message ?? anyErr?.message,
    error: body?.error,
    code: body?.code,
  }
}

/**
 * Map a procurement API failure onto a toast the user can act on. A 403 is reported as a
 * permission problem rather than a generic failure — a control that quietly does nothing is
 * the defect this module is being fixed for.
 */
export function toastProcurementError(err: unknown, fallback = "Request failed"): ErrorBody {
  const body = readProcurementError(err)
  if (body.status === 403) {
    toast.error("Not permitted", {
      description: body.message || "Your role does not have the procurement permission this action needs.",
      duration: 7000,
    })
    return body
  }
  if (body.status === 401) {
    toast.error("Session expired", { description: "Sign in again to continue." })
    return body
  }
  toast.error(body.message || fallback, { description: body.error, duration: body.status === 400 ? 8000 : 7000 })
  return body
}

// ---------------------------------------------------------------------------
// Types (shapes verified against live responses; records stay loose on purpose)
// ---------------------------------------------------------------------------

export type ProcurementAccess = {
  userId: string
  email: string
  name: string
  roleName: string | null
  roleCode: string | null
  department: string | null
  departmentRole: string | null
  isPrivileged: boolean
  /** User Master: which procurement areas the person works in, and how far their authority reaches. */
  procurementFunction?: string | null
  accessProfile?: string | null
  approvalLevel?: number | null
  approvalLimit?: number | null
  delegatedApprover?: { id: string; name: string } | null
  costCentre?: string | null
  branch?: string | null
  businessUnit?: string | null
  sodRestrictions?: string[]
  permissions: string[]
}

export type ProcurementRecord = Record<string, any>

const list = async (path: string): Promise<ProcurementRecord[]> => {
  const data = unwrapData(await apiClient.get<ApiResponse<ProcurementRecord[]>>(path))
  return Array.isArray(data) ? data : []
}

/**
 * Every record of a register. The API answers a list in pages (50 unless told otherwise), so a plain list shows only the newest 50 and
 * the rest never appear. This reads page after page (200 at a time) until the register is exhausted; the page then pages what it holds.
 * An endpoint that ignores paging returns the same rows again: the repeat is noticed and the read stops.
 */
const LIST_PAGE = 200
const listAll = async (path: string, maxRows = 5000): Promise<ProcurementRecord[]> => {
  const sep = path.includes("?") ? "&" : "?"
  const at = (offset: number) => list(`${path}${sep}limit=${LIST_PAGE}&offset=${offset}`)
  const rows: ProcurementRecord[] = []
  const seen = new Set<string>()
  const take = (page: ProcurementRecord[]) => {
    let added = 0
    for (const r of page) {
      const id = String((r as { id?: unknown }).id ?? "")
      if (id && seen.has(id)) continue
      if (id) seen.add(id)
      rows.push(r)
      added += 1
    }
    return added
  }
  // The first page alone answers most registers; when it is full, the rest are read four pages at a time rather than one after another.
  const first = await at(0)
  take(first)
  if (first.length < LIST_PAGE) return rows
  const BATCH = 4
  for (let offset = LIST_PAGE; offset < maxRows; offset += BATCH * LIST_PAGE) {
    const pages = await Promise.all(Array.from({ length: BATCH }, (_, k) => at(offset + k * LIST_PAGE)))
    let added = 0
    let last = false
    for (const page of pages) {
      added += take(page)
      if (page.length < LIST_PAGE) last = true
    }
    if (last || added === 0) break
  }
  return rows
}

const one = async (path: string): Promise<ProcurementRecord> =>
  unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>(path))

// ---------------------------------------------------------------------------
// Access and dashboard
// ---------------------------------------------------------------------------

export async function getMyProcurementAccess(): Promise<ProcurementAccess> {
  return unwrapData(await apiClient.get<ApiResponse<ProcurementAccess>>("/procurement/me/access"))
}

export async function getProcurementDashboard(): Promise<ProcurementRecord> {
  return one("/procurement/dashboard")
}

// ---------------------------------------------------------------------------
// Requisitions
// ---------------------------------------------------------------------------

export const listRequisitions = () => listAll("/procurement/requisitions")
export const listMyRequisitions = () => list("/procurement/requisitions/my")
export const listRequisitionsAwaitingMyApproval = () => list("/procurement/requisitions/pending-approval")
export const getRequisition = (id: string) => one(`/procurement/requisitions/${encodeURIComponent(id)}`)

export async function createRequisition(body: {
  title: string
  department: string
  description?: string
  priority?: string
  justification?: string
  sourcingCategory?: string
  /** SRD §7 "Project/Cost Center"; omitted or null for none. */
  projectId?: string | null
  branch?: string | null
  businessUnit?: string | null
  budgetCode?: string | null
  costCentre?: string | null
  deliveryLocation?: string | null
  planItemId?: string | null
  /** SRD §11 header: currency, required date, method, risk, exception and the optional suggested vendor. */
  currencyId?: string | null
  requiredDate?: string | null
  procurementMethod?: string | null
  riskLevel?: string | null
  exceptionType?: string | null
  suggestedVendorId?: string | null
  /** unitPrice is the requester's estimate; the backend keeps it internal and never copies it onto an RFQ. */
  items: { itemName: string; description?: string; quantity: number; unit?: string; unitPrice?: number }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/requisitions", body))
}

/** SRD §11 "Attachments": files already attached to a requisition (requester and approvers both). */
export async function listRequisitionAttachments(id: string): Promise<ProcurementRecord[]> {
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord[]>>(`/procurement/requisitions/${encodeURIComponent(id)}/attachments`))
}

export async function submitRequisition(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/submit`))
}

/**
 * The requester corrects their own DRAFT or REJECTED requisition: PUT /procurement/requisitions/:id
 * {title, justification, sourcingCategory, items[]}. Resubmitting a rejected one needs a real change.
 */
export async function updateRequisition(
  id: string,
  body: {
    title?: string
    justification?: string | null
    sourcingCategory?: string | null
    projectId?: string | null
    branch?: string | null
    businessUnit?: string | null
    budgetCode?: string | null
    costCentre?: string | null
    deliveryLocation?: string | null
    planItemId?: string | null
    currencyId?: string | null
    requiredDate?: string | null
    procurementMethod?: string | null
    riskLevel?: string | null
    exceptionType?: string | null
    suggestedVendorId?: string | null
    items?: { itemName: string; description?: string | null; quantity: number; unit?: string | null; unitPrice?: number }[]
  },
): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}`, body))
}

export async function approveRequisition(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/approve`))
}

export async function rejectRequisition(id: string, rejectionReason: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/reject`, { rejectionReason }),
  )
}

/** SRD §12: an approver sends the requisition back to its requester to amend (not a rejection). */
export async function returnRequisition(id: string, reason: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/return`, { reason }))
}

export async function commentOnRequisition(id: string, comment: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/comments`, { comment }))
}

export async function delegateRequisitionApproval(id: string, delegatedToId: string, reason: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/delegate`, { delegatedToId, reason }),
  )
}

export type DelegateCandidates = {
  canDelegate: boolean
  step: string
  amount: number
  people: { id: string; name: string; role: string | null; department: string | null; eligible: boolean; reason: string | null }[]
}
export async function getDelegateCandidates(id: string): Promise<DelegateCandidates> {
  return unwrapData(await apiClient.get<ApiResponse<DelegateCandidates>>(`/procurement/requisitions/${encodeURIComponent(id)}/delegate-candidates`))
}

export type RequisitionDecision = {
  id: string
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "RETURNED" | "COMMENTED" | "DELEGATED" | "ESCALATED" | "RESUBMITTED"
  stepNumber: number | null
  stepName: string | null
  actor: { id: string; name: string; email: string | null } | null
  onBehalfOf: { id: string; name: string } | null
  comments: string | null
  previousStatus: string | null
  resultingStatus: string | null
  detail: Record<string, any> | null
  at: string
}
/** The requisition's decision history: user, action, date/time, comments, previous and resulting status. */
export const listRequisitionDecisions = (id: string) => list(`/procurement/requisitions/${encodeURIComponent(id)}/decisions`)

export type RequisitionPosition = {
  currency: string | null
  estimatedTotal: number
  budget: { budgetCode: string; costCentre: string | null; financialYear: string; amount: number; committed: number; available: number } | null
  plan: { planNumber: string; requirement: string; planned: number; consumedByOthers: number; remaining: number } | null
}
export async function getRequisitionPosition(id: string): Promise<RequisitionPosition> {
  return unwrapData(await apiClient.get<ApiResponse<RequisitionPosition>>(`/procurement/requisitions/${encodeURIComponent(id)}/position`))
}

export type RequisitionAttachment = { id: string; fileName: string; fileUrl: string; mimeType: string | null; fileSizeBytes: number | null; createdAt: string }

/** Attach files to a draft, rejected or returned requisition (requester only): pdf, doc(x), xls(x), csv, png, jpg, txt; 15 MB each. */
export async function uploadRequisitionAttachments(id: string, files: File[]): Promise<RequisitionAttachment[]> {
  const form = new FormData()
  for (const f of files) form.append("files", f)
  return unwrapData(await apiClient.postFormData<ApiResponse<RequisitionAttachment[]>>(`/procurement/requisitions/${encodeURIComponent(id)}/attachments`, form))
}

export async function removeRequisitionAttachment(id: string, attachmentId: string): Promise<void> {
  await apiClient.delete(`/procurement/requisitions/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`)
}

export type RequisitionContext = {
  attachments: RequisitionAttachment[]
  decisions: RequisitionDecision[]
  position: RequisitionPosition
  delegate: DelegateCandidates | null
}
/** Decision history, budget/plan position and delegate candidates for many requisitions in one call. */
export async function getRequisitionContext(ids: string[]): Promise<Record<string, RequisitionContext>> {
  return unwrapData(await apiClient.post<ApiResponse<Record<string, RequisitionContext>>>("/procurement/requisitions/context", { ids }))
}

export type RequisitionOptions = {
  procurementMethods: string[]
  riskLevels: string[]
  exceptionTypes: string[]
  currencies: { id: string; code: string; name: string; symbol: string; isDefault: boolean }[]
  policy: { suggestedVendorPolicy: string; budgetCheckMode: string; planLinkPolicy: string }
}
export async function getRequisitionOptions(): Promise<RequisitionOptions> {
  return unwrapData(await apiClient.get<ApiResponse<RequisitionOptions>>("/procurement/requisition-options"))
}

export type RequisitionPolicy = { suggestedVendorPolicy: string; budgetCheckMode: string; planLinkPolicy: string; prNumberFormat: string }
export async function getRequisitionPolicy(): Promise<RequisitionPolicy> {
  return unwrapData(await apiClient.get<ApiResponse<RequisitionPolicy>>("/procurement/requisition-policy"))
}
export async function saveRequisitionPolicy(body: Partial<RequisitionPolicy>): Promise<RequisitionPolicy> {
  return unwrapData(await apiClient.put<ApiResponse<RequisitionPolicy>>("/procurement/requisition-policy", body))
}

export type BudgetInput = {
  financialYear: string
  budgetCode: string
  costCentre?: string
  department?: string
  description?: string
  amount: number
  currencyCode?: string
  status?: string
}
export const listProcurementBudgets = () => list("/procurement/budgets")
export async function saveProcurementBudget(body: BudgetInput, id?: string): Promise<ProcurementRecord> {
  return unwrapData(
    id
      ? await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/budgets/${encodeURIComponent(id)}`, body)
      : await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/budgets", body),
  )
}

/** Lines of approved plans a requisition may draw on, with what is left on each. */
export const listAvailablePlanLines = () => list("/procurement/plans/available-lines")

// ---------------------------------------------------------------------------
// Sourcing: RFQs and quotations
// ---------------------------------------------------------------------------

export const listRfqs = () => listAll("/procurement/rfq")
export const listQuotations = () => listAll("/vendor-quotations")

export async function createRfq(body: {
  purchaseRequisitionId?: string
  title: string
  description?: string
  vendorIds: string[]
  rfqDeadline?: string
  expectedDeliveryDate?: string
  deliveryAddress?: string
  specialRequirements?: string
  visibility?: "INVITED_ONLY" | "PUBLIC_LISTING"
  /** Keep the event as a Draft: nothing is sent until it is approved and published (SRD §40). */
  saveAsDraft?: boolean
  /** RFQ | RFP | TENDER | DIRECT */
  procurementMethod?: string
  /** USD, ZiG or ZAR: the currency vendors quote in. The API resolves it to the currency's id. */
  reportingCurrencyCode?: string
  /** 0-1 each; the evaluation weighting of price against everything else. */
  priceWeight?: number
  technicalWeight?: number
  items?: { itemName: string; description?: string; quantity: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/rfq", body))
}

/** PATCH /rfqs/:id/closing {newClosingAt}: the only field an already-published RFQ can still change. */
export async function extendRfqClosing(id: string, newClosingAt: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.patch<ApiResponse<ProcurementRecord>>(`/procurement/rfqs/${encodeURIComponent(id)}/closing`, { newClosingAt }))
}

/** GET /procurement/currencies: the active currencies an RFQ can be quoted in ({code, name}). */
export async function listProcurementCurrencies(): Promise<ProcurementRecord[]> {
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord[]>>("/procurement/currencies"))
}

/** GET /departments: the org's departments ({id, name, ...}), for the plan and plan-item Department pickers. */
export async function listDepartments(): Promise<ProcurementRecord[]> {
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord[]>>("/departments"))
}

/** The award. Accepting a quotation raises its purchase order. */
export async function acceptQuotation(id: string, reviewNotes?: string): Promise<ProcurementRecord> {
  const q = reviewNotes ? `?reviewNotes=${encodeURIComponent(reviewNotes)}` : ""
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/vendor-quotations/${encodeURIComponent(id)}/accept${q}`))
}

// ---------------------------------------------------------------------------
// Sourcing: capture, opening, evaluation, comparison, recommendation (SRD §15-§20)
// Access to submissions is decided by the server; a sealed event returns a count and nothing else.
// ---------------------------------------------------------------------------

export type SourcingCriterion = {
  id: string
  code: string
  name: string
  category: string
  kind: "PASS_FAIL" | "SCORED" | "PRICE"
  weight: number
  maxScore: number
  mandatory: boolean
  description?: string | null
}

export type SourcingState = {
  rfq: {
    id: string
    rfqNumber: string
    title: string
    status: string
    closingAt: string | null
    sealedBidding: boolean
    evaluationMode: "SINGLE_ENVELOPE" | "TWO_ENVELOPE"
    passRule: "ALL" | "MAJORITY"
    minEvaluators: number
    bidOpenedAt: string | null
    criteriaLockedAt: string | null
  }
  phase: "OPEN" | "CLOSED_SEALED" | "OPENED"
  level: "COUNT" | "EVALUATOR" | "FULL"
  priceVisible: boolean
  reason: string | null
  submissions: number
  can: { open: boolean; capture: boolean; manage: boolean; award: boolean }
  me: { role: string; declaration: string | null; declaredAt: string | null; recused: boolean; scorecardSubmittedAt: string | null } | null
  criteria: SourcingCriterion[]
  committee: { userId: string; name: string; department: string | null; role: string; declared: boolean; declaration: string | null; recused: boolean; scorecardSubmittedAt: string | null }[]
  declarationOptions: { code: string; label: string; statement: string; effect: "CLEAR" | "DISCLOSED" | "RECUSE"; requiresDetails: boolean }[]
  settings: { requireDeclaration: boolean; hasDefaultCriteria: boolean }
  opening: {
    openedAt: string
    openedBy: { id: string; name: string | null }
    notes: string | null
    submissionsCount: number
    reportingCurrencyCode: string | null
    attendees: { id: string; userId: string | null; name: string; role: string | null; external: boolean }[]
    recordSha256: string | null
  } | null
  recommendation: SourcingRecommendation | null
  invitedSuppliers: { id: string; name: string; code: string | null }[]
  captureChannels: string[]
  people?: { id: string; name: string; department: string | null }[]
}

export type SourcingRecommendation = {
  id: string
  version: number
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUPERSEDED"
  recommendedQuotation: { id: string; quotationNumber: string; companyName: string | null; vendorName: string | null } | null
  recommendedAmount: number
  currencyCode: string | null
  justification: string | null
  deviations: string | null
  evaluationSummary: any
  supportingDocuments: { id: string; fileName: string }[] | null
  preparedBy: { id: string; name: string | null }
  submittedAt: string | null
  decidedAt: string | null
  decisionComments: string | null
  route: { requestId: string; status: string; steps: { stepNumber: number; name: string; status: string; approvers: { id: string; name: string; status: string }[] }[] } | null
  decisions: RequisitionDecision[]
}

export type SourcingComparison = {
  rfq: { id: string; rfqNumber: string; title: string; status: string; closingAt: string | null; bidOpenedAt: string | null; evaluationMode: string; sealedBidding: boolean }
  phase: "OPEN" | "CLOSED_SEALED" | "OPENED"
  sealed: boolean
  level: "COUNT" | "EVALUATOR" | "FULL"
  priceVisible: boolean
  priceNotice?: string | null
  reason: string | null
  submissions: number
  autoSelection: false
  autoSelectionNotice: string
  columns: {
    quotationId: string
    quotationNumber: string
    quotationReference: string | null
    quotationDate: string | null
    supplier: { id: string | null; name: string; code: string | null }
    submittedAt: string
    submissionMethod: string
    submissionMethodLabel: string
    captureChannel: string | null
    status: string
    disqualified: boolean
    failedCriteria: string[]
    advisoryRank: number | null
    integrity: string
    comparable: boolean | null
    comparabilityNote: string | null
  }[]
  rows: { key: string; label: string; values: Record<string, any> }[]
  documents: Record<string, { id: string; fileName: string; envelope: string; version: number; status: string; sha256: string; uploadedVia: string; submittedAt: string; downloadPath: string }[]>
  opening: SourcingState["opening"]
  fx: { reportingCurrencyCode: string | null; basis: string; asOf: string; rates: { currency: string; rate: number | null; source: string; reason?: string; note?: string }[] } | null
  evaluation?: { criteria: SourcingCriterion[]; complete: boolean; countedEvaluators: number; pendingEvaluators: string[]; resultsWithheld: boolean; minEvaluators: number; committee: any[] }
  advisory: { advisory: true; notice: string; ranking: { quotationId: string; supplier: string; rank: number }[] } | null
  recommendation: SourcingRecommendation | null
}

export type SourcingConsolidation = {
  criteria: SourcingCriterion[]
  committee: { userId: string; name: string; role: string; declaration: string | null; recused: boolean; scorecardSubmittedAt: string | null }[]
  countedEvaluators: number
  pendingEvaluators: string[]
  minEvaluators: number
  complete: boolean
  passRule: string
  resultsWithheld: boolean
  reportingCurrencyCode: string | null
  rows: { quotationId: string; technicalScore: number | null; commercialScore: number | null; totalScore: number | null; compliance: string; disqualified: boolean; failedCriteria: string[]; advisoryRank: number | null; perCriterion: any[]; comparableAmount: number | null }[]
  individual?: { userId: string; name: string; scores: { quotationId: string; criterionId: string; score: number | null; passed: boolean | null; comment: string | null }[] }[]
}

export type MyScorecard = {
  submittedAt: string | null
  scores: { quotationId: string; criterionId: string; score: number | null; passed: boolean | null; comment: string | null }[]
  notes: { quotationId: string; comment: string | null }[]
}

const rfqPath = (id: string) => `/procurement/rfqs/${encodeURIComponent(id)}`

export async function getRfqSourcing(id: string): Promise<SourcingState> {
  return unwrapData(await apiClient.get<ApiResponse<SourcingState>>(`${rfqPath(id)}/sourcing`))
}
export async function getRfqComparison(id: string): Promise<SourcingComparison> {
  return unwrapData(await apiClient.get<ApiResponse<SourcingComparison>>(`${rfqPath(id)}/comparison-matrix`))
}
export async function getRfqConsolidation(id: string): Promise<SourcingConsolidation> {
  return unwrapData(await apiClient.get<ApiResponse<SourcingConsolidation>>(`${rfqPath(id)}/evaluation/consolidation`))
}
export async function getMyScorecard(id: string): Promise<MyScorecard> {
  return unwrapData(await apiClient.get<ApiResponse<MyScorecard>>(`${rfqPath(id)}/evaluation/my-scorecard`))
}

/** §16 formal bid opening: an authorised user, after the deadline, with attendees recorded. */
export async function openRfqBids(id: string, body: { attendees: { userId?: string; name?: string; role?: string; external?: boolean }[]; notes?: string }) {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`${rfqPath(id)}/open`, body))
}
export async function setRfqFxRate(id: string, body: { currency: string; rate: number; reason: string }) {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`${rfqPath(id)}/fx-rate`, body))
}

export type CaptureQuotationInput = {
  vendorId: string
  channel: string
  receivedAt: string
  reason?: string
  currencyCode: string
  vatRate?: number | null
  quotationReference?: string
  quotationDate?: string
  validUntil?: string
  paymentTerms?: string
  deliveryTerms?: string
  deliveryTime?: string
  deliveryPeriodDays?: number | null
  notes?: string
  declaredSubtotal?: number | null
  declaredTaxAmount?: number | null
  declaredTotalAmount?: number | null
  items: { itemName: string; quantity: number; unit?: string; unitPrice: number }[]
}

/** §15: a quotation received through an approved alternative channel, captured on the supplier's behalf with the original document. */
export async function captureQuotation(id: string, payload: CaptureQuotationInput, documents: File[], technicalDocuments: File[] = []) {
  const form = new FormData()
  form.append("payload", JSON.stringify(payload))
  for (const f of documents) form.append("documents", f)
  for (const f of technicalDocuments) form.append("technicalDocuments", f)
  return unwrapData(await apiClient.postFormData<ApiResponse<ProcurementRecord>>(`${rfqPath(id)}/quotations/capture`, form))
}

export type CriterionInput = { name: string; code?: string; category?: string; kind: "PASS_FAIL" | "SCORED" | "PRICE"; weight?: number; maxScore?: number; mandatory?: boolean; description?: string }
export async function setEvaluationCriteria(id: string, body: { criteria: CriterionInput[]; evaluationMode?: string; passRule?: string; minEvaluators?: number }) {
  return unwrapData(await apiClient.put<ApiResponse<SourcingCriterion[]>>(`${rfqPath(id)}/evaluation/criteria`, body))
}
export async function applyDefaultEvaluationCriteria(id: string) {
  return unwrapData(await apiClient.post<ApiResponse<SourcingCriterion[]>>(`${rfqPath(id)}/evaluation/criteria/default`))
}
export async function setEvaluationCommittee(id: string, members: { userId: string; role?: string }[]) {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord[]>>(`${rfqPath(id)}/evaluation/committee`, { members }))
}
export async function declareEvaluation(id: string, body: { code: string; details?: string }) {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`${rfqPath(id)}/evaluation/declaration`, body))
}
export async function saveEvaluationScores(
  id: string,
  body: { quotationId: string; scores: { criterionId: string; score?: number | null; passed?: boolean | null; comment?: string }[]; comment?: string },
) {
  return unwrapData(await apiClient.put<ApiResponse<MyScorecard>>(`${rfqPath(id)}/evaluation/scores`, body))
}
export async function submitEvaluationScorecard(id: string) {
  return unwrapData(await apiClient.post<ApiResponse<MyScorecard>>(`${rfqPath(id)}/evaluation/scorecard/submit`))
}
export const listEvaluationDeclarationOptions = () => list("/procurement/evaluation-declaration-options")
export async function saveEvaluationDeclarationOption(body: { id?: string; label: string; statement: string; effect: string; requiresDetails?: boolean; active?: boolean; sortOrder?: number }) {
  return unwrapData(
    body.id
      ? await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/evaluation-declaration-options/${encodeURIComponent(body.id)}`, body)
      : await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/evaluation-declaration-options", body),
  )
}

/** §20: prepare the recommendation (amount and currency come from the quotation), submit it into the award route, decide it. */
export async function prepareAwardRecommendation(id: string, body: { quotationId: string; justification: string; deviations?: string; supportingDocumentIds?: string[] }) {
  return unwrapData(await apiClient.post<ApiResponse<SourcingRecommendation>>(`${rfqPath(id)}/recommendation`, body))
}
export async function submitAwardRecommendation(id: string) {
  return unwrapData(await apiClient.post<ApiResponse<SourcingRecommendation>>(`${rfqPath(id)}/recommendation/submit`))
}
export async function decideAwardRecommendation(id: string, decision: "APPROVE" | "REJECT", comments?: string) {
  return unwrapData(await apiClient.post<ApiResponse<SourcingRecommendation>>(`${rfqPath(id)}/recommendation/decide`, { decision, comments }))
}

export type AwardQueueItem = {
  recommendationId: string
  rfqId: string
  rfqNumber: string
  title: string
  version: number
  supplier: string | null
  quotationId: string
  quotationNumber: string
  amount: number
  currencyCode: string | null
  deviations?: string | null
  preparedById?: string
}
/** Recommendations waiting for my decision, and approved ones waiting to be finalised as an award. */
export async function getAwardQueue(): Promise<{ toDecide: AwardQueueItem[]; toAward: AwardQueueItem[] }> {
  return unwrapData(await apiClient.get<ApiResponse<{ toDecide: AwardQueueItem[]; toAward: AwardQueueItem[] }>>("/procurement/rfqs/award-queue"))
}

/** Downloads a quotation document through the authorised endpoint (never by a stored address). */
export async function downloadQuotationDocument(downloadPath: string): Promise<Blob> {
  return (await apiClient.get<Blob>(downloadPath.replace(/^\/api/, ""), { responseType: "blob" })) as Blob
}

export type HandoffState = "READY_FOR_FINANCE" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "PAID" | "CLOSED"

export type InvoiceHandoff = {
  invoiceId: string
  invoiceNumber: string
  status: HandoffState | null
  approved: boolean
  /** The states it can go to next, in the only order allowed. */
  next: HandoffState[]
  /** Of those, the moves the signed-in user may make. */
  canDo: HandoffState[]
  history: { at: string; from: HandoffState | null; to: HandoffState; by: string | null; comment: string | null }[]
  returnReason: string | null
}

/** §25 finance handoff: READY_FOR_FINANCE, SUBMITTED, ACCEPTED, PAID, CLOSED (SUBMITTED may be returned as REJECTED). No state is skipped. */
export async function getInvoiceHandoff(id: string): Promise<InvoiceHandoff> {
  return unwrapData(await apiClient.get<ApiResponse<InvoiceHandoff>>(`/procurement/invoices/${encodeURIComponent(id)}/finance-handoff`))
}

export async function transitionInvoiceHandoff(id: string, to: HandoffState, comment?: string): Promise<InvoiceHandoff> {
  return unwrapData(await apiClient.post<ApiResponse<InvoiceHandoff>>(`/procurement/invoices/${encodeURIComponent(id)}/finance-handoff`, { to, comment }))
}

/** §12 delegate a pending approval (entityId = GRN / invoice / etc.). */
export async function delegateApproval(body: {
  entityId: string
  delegatedToId: string
  reason?: string
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/approvals/delegate`, body))
}

/** Admin: create a role with a permission set (§5–6). */
export async function createAppRole(body: {
  name: string
  description?: string
  permissions: unknown
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/roles`, body))
}

export async function rejectQuotation(id: string, rejectionReason: string, reviewNotes?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/vendor-quotations/${encodeURIComponent(id)}/reject`, { rejectionReason, reviewNotes }),
  )
}

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

export const listPurchaseOrders = () => listAll("/procurement/purchase-orders")
export const getPurchaseOrder = (id: string) => one(`/procurement/purchase-orders/${encodeURIComponent(id)}`)

export async function createPurchaseOrder(body: {
  vendorId: string
  requisitionId?: string
  quotationId?: string
  currencyId?: string
  expectedDeliveryDate?: string
  shippingAddress?: string
  paymentTerms?: string
  deliveryTerms?: string
  /** §21: taken from the requisition, the budget line and the award when left out. */
  costCentre?: string
  budgetCode?: string
  glCode?: string
  purchaseConditions?: string
  items: { itemName: string; description?: string; quantity: number; unitPrice: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/purchase-orders", body))
}

export type PoApprovalRecord = {
  poId: string
  poNumber: string
  approvalStatus: "NOT_REQUIRED" | "REQUIRED" | "PENDING" | "APPROVED" | "REJECTED"
  approvedAt: string | null
  approvals: { stage: string; label: string; status: string; decisions: { at: string; action: string; actor: string | null; step: string | null; comments: string | null }[] }[]
}
export type PoQueueItem = { id: string; poNumber: string; vendor: string | null; amount: number; currencyCode: string | null }

export const getPoApprovals = async (id: string) => unwrapData(await apiClient.get<ApiResponse<PoApprovalRecord>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/approvals`))
export const submitPoForApproval = async (id: string) => unwrapData(await apiClient.post<ApiResponse<PoApprovalRecord>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/submit-for-approval`))
export const decidePoApproval = async (id: string, decision: "APPROVE" | "REJECT", comments?: string) =>
  unwrapData(await apiClient.post<ApiResponse<PoApprovalRecord>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/approval/decide`, { decision, comments }))
export const getPoApprovalQueue = async (): Promise<PoQueueItem[]> => unwrapData(await apiClient.get<ApiResponse<PoQueueItem[]>>("/procurement/purchase-orders/approval-queue"))

export type P2pConfig = {
  brand: { key: "matanho" | "nvccz"; name: string; hasLogo: boolean }
  settings: {
    overDeliveryTolerancePct: number
    matchPriceVariancePct: number
    matchQtyTolerancePct: number
    matchValueTolerancePct: number
    matchTaxTolerancePct: number
    matchAmountToleranceAbs: number
    matchEnforcement: "ENFORCE" | "WARN"
    poApprovalRequired: boolean
    aiEnabled: boolean
    aiMonthlyDocumentLimit: number | null
    aiMonthlyCallLimit: number | null
    aiAllowedRoleCodes: string[]
    aiAllowedDocumentTypes: string[]
  }
}
export const getP2pConfig = async () => unwrapData(await apiClient.get<ApiResponse<P2pConfig>>("/procurement/p2p/config"))

export async function sendPurchaseOrder(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/send`))
}

// ---------------------------------------------------------------------------
// Receiving
// ---------------------------------------------------------------------------

export async function listGoodsReceivedNotes(): Promise<ProcurementRecord[]> {
  return listAll("/procurement/goods-received-notes")
}

export const getGoodsReceivedNote = (id: string) => one(`/procurement/goods-received-notes/${encodeURIComponent(id)}`)

export async function createGoodsReceivedNote(body: {
  purchaseOrderId: string
  receivedDate?: string
  items: {
    purchaseOrderItemId: string
    quantityReceived: number
    quantityAccepted: number
    quantityRejected: number
    lineType?: string
    milestoneDescription?: string
    /** A service receipt: the period it was completed in, the amount confirmed and the evidence (platform files). */
    servicePeriodStart?: string
    servicePeriodEnd?: string
    serviceAmount?: number
    serviceEvidence?: ReceiptFile[]
  }[]
  deliveryNoteNumber?: string
  locationName?: string
  comments?: string
  attachmentUrls?: ReceiptFile[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/goods-received-notes", body))
}

export type ReceiptFile = { fileName: string; url: string; mimeType?: string | null; size?: number }

/** Stage a receipt's files (delivery note, photos, service evidence) in the platform file store. */
export async function uploadReceiptFiles(files: File[]): Promise<ReceiptFile[]> {
  const form = new FormData()
  for (const f of files) form.append("files", f)
  return unwrapData(await apiClient.postFormData<ApiResponse<ReceiptFile[]>>("/procurement/goods-received-notes/upload", form))
}

export async function approveGoodsReceivedNote(id: string, qualityNotes?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/goods-received-notes/${encodeURIComponent(id)}/approve`, { qualityNotes }),
  )
}

export async function rejectGoodsReceivedNote(id: string, rejectionReason: string, qualityNotes?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/goods-received-notes/${encodeURIComponent(id)}/reject`, {
      rejectionReason,
      qualityNotes,
    }),
  )
}

// ---------------------------------------------------------------------------
// Invoices and payments
// ---------------------------------------------------------------------------

export const listProcurementInvoices = () => listAll("/procurement/invoices")

export async function listProcurementPayments(): Promise<ProcurementRecord[]> {
  const data = unwrapData(await apiClient.get<ApiResponse<{ payments?: ProcurementRecord[] }>>("/procurement/payments"))
  return Array.isArray(data?.payments) ? data.payments : []
}

export async function captureProcurementInvoice(body: {
  purchaseOrderId: string
  vendorId: string
  invoiceDate: string
  dueDate?: string
  currencyId?: string
  /** The supplier's document (from AI Invoice Capture); the API reads it with the LLM and compares it with the capture. */
  documentPath?: string
  documentType?: string
  /** The intake holding the reading already made of that document, so it is not read twice. */
  readingIntakeId?: string
  /** Captured and flagged for review in one step, with why (SRD §7 Invoice Processing). */
  reviewNote?: string
  /** §23: the supplier's own invoice number (required), the receipt it bills, its stated figures and payment terms. */
  supplierInvoiceNumber: string
  grnId?: string
  paymentTerms?: string
  subtotal?: number
  taxAmount?: number
  totalAmount?: number
  items: { itemName: string; description?: string; quantity: number; unitPrice: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/invoices", body))
}

export type ExtractedInvoiceLine = { description: string; quantity: number; unitPrice: number; lineTotal: number }

/** What the model read off the invoice PDF. Every field may be null: nothing is assumed. */
export type ExtractedInvoice = {
  invoiceNumber: string | null
  invoiceDate: string | null
  currencyCode: string | null
  dueDate?: string | null
  supplierName?: string | null
  supplierTaxNumber?: string | null
  purchaseOrderReference?: string | null
  subtotal?: number | null
  taxRate?: number | null
  taxAmount?: number | null
  totalAmount?: number | null
  /** Figures that do not add up, or a total that could not be read. */
  checks?: { code: string; message: string }[]
  /** The text came from OCR of a scan or photo. */
  readFromOcr?: boolean
  lines: ExtractedInvoiceLine[]
  taxTreatment?: "VAT_15" | "ZERO_RATED" | "EXEMPT" | "UNKNOWN"
  fieldConfidence?: Record<string, number>
  overallConfidence: number
}

export type InvoiceExtraction = {
  payload: ExtractedInvoice | null
  documentUrl: string
  intake: { id: string; intakeNumber: string; status: string; taxParseStatus?: string | null } | null
  /** Whether the extraction was stored (it is, once the vendor is known). */
  storedIntake: boolean
  /** Below the confidence threshold: the operator is told to check every field. */
  lowConfidence: boolean
  threshold: number
  /**
   * The document as page images with the read values' positions (SRD §7 Invoice Processing). Null when it could not be
   * rendered; `note` says why a file type cannot be shown.
   */
  preview?: {
    pages: { image: string; width: number; height: number }[]
    highlights: { field: string; label: string; page: number; left: number; top: number; width: number; height: number }[]
    note: string | null
  } | null
}

/**
 * POST /procurement/suite06/extract-for-capture — multipart `document` (PDF) and an optional
 * `purchaseOrderId`. Reads the invoice and hands the fields back for the capture form to
 * prefill; nothing is captured until the operator saves, which still goes through
 * POST /procurement/invoices.
 */
export async function extractInvoiceForCapture(form: FormData): Promise<InvoiceExtraction> {
  return unwrapData(
    await apiClient.postFormData<ApiResponse<InvoiceExtraction>>("/procurement/suite06/extract-for-capture", form),
  )
}

/** POST /procurement/invoices/:id/flag {note}: SRD §7 "Flag for Review" on an open invoice. */
export async function flagProcurementInvoice(id: string, note: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/flag`, { note }))
}

export type RequisitionProject = { id: string; name: string; clientName: string | null; projectType: string | null; status: string }

/** GET /procurement/requisition-projects: what a requisition can be charged to (SRD §7 "Project/Cost Center"). */
export const listRequisitionProjects = () => list("/procurement/requisition-projects") as Promise<RequisitionProject[]>

export type RequisitionLineSuggestion = {
  itemName: string
  unit: string | null
  lastPrice: number | null
  lastOrdered: string | null
  lastPo: string | null
  standardCost: number | null
  vendors: { id: string; name: string; orders: number; lastPrice: number | null; source: "orders" | "inventory" }[]
}

/** GET /procurement/requisitions/line-suggestions?q=: items bought before, their last price and vendors (SRD §3). */
export async function requisitionLineSuggestions(q: string): Promise<RequisitionLineSuggestion[]> {
  return list(`/procurement/requisitions/line-suggestions?q=${encodeURIComponent(q)}`) as Promise<RequisitionLineSuggestion[]>
}

export async function approveProcurementInvoice(id: string, isTaxable = true, matchOverrideReason?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/approve`, { isTaxable, matchOverrideReason }),
  )
}

/** PUT /procurement/invoices/:id/reject — an invoice awaiting approval; reason required. */
export async function rejectProcurementInvoice(id: string, rejectionReason: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/reject`, {
      rejectionReason,
    }),
  )
}

/** POST /procurement/invoices/:id/match — re-run the three-way match (invoice vs PO vs accepted receipts). */
export async function matchProcurementInvoice(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/match`))
}

/** GET /cashbook/banks — the bank and cash accounts a payment can be made from (Accounting owns them). */
export const listBanks = () => list("/cashbook/banks")

/**
 * Post a PENDING journal to the ledger: PATCH /accounting/journal-entries/:id/post. Paying a
 * procurement invoice creates its expense journal as PENDING; the accounting grants decide who posts.
 */
export async function postJournalEntry(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.patch<ApiResponse<ProcurementRecord>>(`/accounting/journal-entries/${encodeURIComponent(id)}/post`, {}))
}

/**
 * The organisation's letterhead identity: GET /company-profile (legalName, registrationNumber,
 * taxNumber, email, phone, website, logoUrl, addresses[]). A 404 means none is set up yet.
 */
export async function getCompanyProfile(): Promise<ProcurementRecord | null> {
  try {
    return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>("/company-profile"))
  } catch (err) {
    if (readProcurementError(err).status === 404) return null
    throw err
  }
}

// ---------------------------------------------------------------------------
// Registers: document vault, contracts, annual plans (nvccz src/routes/procurementRegistersRoutes.ts)
// ---------------------------------------------------------------------------

export const listProcurementDocuments = () => list("/procurement/documents")

export async function uploadProcurementDocuments(form: FormData): Promise<ProcurementRecord[]> {
  return unwrapData(await apiClient.postFormData<ApiResponse<ProcurementRecord[]>>("/procurement/documents", form))
}

export async function uploadProcurementDocumentVersion(id: string, form: FormData): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.postFormData<ApiResponse<ProcurementRecord>>(`/procurement/documents/${encodeURIComponent(id)}/version`, form))
}

export async function setProcurementDocumentStatus(id: string, status: "under_review" | "approved" | "archived"): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.patch<ApiResponse<ProcurementRecord>>(`/procurement/documents/${encodeURIComponent(id)}/status`, { status }))
}

export const listProcurementContracts = () => list("/procurement/contracts")

export type ContractInput = {
  title?: string
  vendorId?: string
  quotationId?: string
  value?: number
  currencyCode?: string
  startDate?: string
  endDate?: string
  paymentTerms?: string
  scope?: string
}

export async function createProcurementContract(body: ContractInput): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/contracts", body))
}

export async function updateProcurementContract(id: string, body: ContractInput): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/contracts/${encodeURIComponent(id)}`, body))
}

export async function setProcurementContractStatus(id: string, next: "activate" | "terminate"): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/contracts/${encodeURIComponent(id)}/${next}`))
}

export const listProcurementPlans = () => list("/procurement/plans")

export type PlanInput = { name?: string; department?: string; businessUnit?: string; fiscalYear?: string; budget?: number; currencyCode?: string; notes?: string }
export type PlanItemInput = {
  description: string
  requirement?: string
  category?: string
  quarter?: string
  method?: string
  estimatedValue?: number
  department?: string
  businessUnit?: string
  budgetCode?: string
  costCentre?: string
  plannedStartDate?: string
  requiredDeliveryDate?: string
  responsibleOfficerId?: string
  currencyCode?: string
}

export async function createProcurementPlan(body: PlanInput): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/plans", body))
}

export async function updateProcurementPlan(id: string, body: PlanInput): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/plans/${encodeURIComponent(id)}`, body))
}

export async function addProcurementPlanItem(id: string, body: PlanItemInput): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/plans/${encodeURIComponent(id)}/items`, body))
}

export async function updateProcurementPlanItem(id: string, itemId: string, body: Partial<PlanItemInput>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/plans/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`, body))
}

export async function submitProcurementPlan(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/plans/${encodeURIComponent(id)}/submit`))
}

export async function decideProcurementPlan(id: string, decision: "approve" | "reject", reason?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/plans/${encodeURIComponent(id)}/${decision}`, reason ? { reason } : {}),
  )
}

export async function payProcurementInvoice(id: string, form: FormData): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.postFormData<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/payment`, form))
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

/** Every vendor in every status (the registry filters by status itself), with its settlement currency. */
export const listVendors = () =>
  list("/accounting/vendors?status=DRAFT,PENDING_REVIEW,PENDING_APPROVAL,APPROVED,SUSPENDED,BLOCKED,EXPIRED,INACTIVE&include=settlementCurrency,kyc,banks")
export const getVendor = (id: string) => one(`/accounting/vendors/${encodeURIComponent(id)}`)

export async function createVendor(body: Record<string, unknown>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/accounting/vendors", body))
}

export async function updateVendor(id: string, body: Record<string, unknown>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}`, body))
}

/**
 * Vendors who registered themselves on the vendor portal and wait for staff review
 * (GET /accounting/vendors/pending-review, procurement.vendors.view).
 */
export const listPendingVendorRegistrations = () => list("/accounting/vendors/pending-review")

/** Approve a self-registration: the vendor becomes active and is emailed (procurement.vendors.approve). */
export async function approveVendorRegistration(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/approve-registration`, {}))
}

/** Decline a self-registration with a reason: the vendor is deactivated and emailed (procurement.vendors.approve). */
export async function declineVendorRegistration(id: string, reason: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/decline-registration`, { reason }))
}

export async function blacklistVendor(id: string, blacklistReason: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/blacklist`, { blacklistReason }),
  )
}

export async function unblacklistVendor(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/unblacklist`))
}

/**
 * Remove a vendor. One with any transaction history is made Inactive and kept (`deactivated: true`); only a vendor
 * nothing ever referenced is deleted.
 */
export async function deleteVendor(id: string): Promise<{ deactivated: boolean; message: string }> {
  const res: any = await apiClient.delete(`/accounting/vendors/${encodeURIComponent(id)}`)
  return { deactivated: Boolean(res?.deactivated), message: String(res?.message ?? "") }
}

export type VendorStatusOptions = {
  statuses: { code: string; label: string }[]
  risk: string[]
  documentTypes: { code: string; label: string }[]
  expiryNoticeDays: number
  /** From each status, the moves allowed: who needs which permission, and whether a reason is required. */
  transitions: Record<string, { to: string; label: string; needs: "manage" | "approve"; reasonRequired: boolean }[]>
}

/** Option lists for vendor forms: statuses, risk classes, document types, default expiry lead time. */
export async function getVendorStatusOptions(): Promise<VendorStatusOptions> {
  return unwrapData(await apiClient.get<ApiResponse<VendorStatusOptions>>("/accounting/vendors/status-options"))
}

/** POST /accounting/vendors/:id/status: the only way a vendor's status changes (permission by move, reason where required, audited). */
export async function changeVendorStatus(id: string, status: string, reason?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/status`, { status, reason }),
  )
}

/** A vendor's full record: profile, documents with expiry state, compliance, what it may be used for, its history. */
export const getVendorDetail = (id: string) => one(`/accounting/vendors/${encodeURIComponent(id)}`)

export async function uploadVendorDocument(
  vendorId: string,
  file: File,
  meta: { documentType: string; expiryDate?: string; issueDate?: string; documentNumber?: string; notifyDaysBefore?: string },
): Promise<ProcurementRecord> {
  const form = new FormData()
  form.append("file", file)
  form.append("documentType", meta.documentType)
  for (const k of ["expiryDate", "issueDate", "documentNumber", "notifyDaysBefore"] as const) {
    if (meta[k]) form.append(k, meta[k] as string)
  }
  return unwrapData(await apiClient.postFormData<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(vendorId)}/kyc-documents`, form))
}

/** Set or renew a document's expiry, issue date, number and notice period. */
export async function updateVendorDocument(
  documentId: string,
  meta: { expiryDate?: string | null; issueDate?: string | null; documentNumber?: string | null; notifyDaysBefore?: number | string | null },
): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/accounting/vendors/kyc-documents/${encodeURIComponent(documentId)}`, meta))
}

export const listVendorBanks = (vendorId: string) => list(`/accounting/vendors/${encodeURIComponent(vendorId)}/banks`)

export async function createVendorBank(vendorId: string, body: Record<string, unknown>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(vendorId)}/banks`, body))
}

/** Run the expiry sync and send the pre-expiry notifications now (also runs on a schedule). */
export async function runVendorComplianceCycle(): Promise<Record<string, number>> {
  return unwrapData(await apiClient.post<ApiResponse<Record<string, number>>>("/accounting/vendors/compliance-cycle"))
}

/** Default lead time (days) for the pre-expiry notice. */
export async function saveVendorDocumentSettings(expiryNoticeDays: number): Promise<{ expiryNoticeDays: number }> {
  return unwrapData(await apiClient.put<ApiResponse<{ expiryNoticeDays: number }>>("/accounting/vendors/document-settings", { expiryNoticeDays }))
}

/** Formal reopen of a sourcing event after its deadline: a reason and a future deadline; audited. */
export async function reopenRfq(rfqId: string, newClosingAt: string, reason: string): Promise<Record<string, unknown>> {
  return unwrapData(await apiClient.post<ApiResponse<Record<string, unknown>>>(`/procurement/rfqs/${encodeURIComponent(rfqId)}/reopen`, { newClosingAt, reason }))
}

// ---------------------------------------------------------------------------
// Approval configuration
// ---------------------------------------------------------------------------

export const listApprovalConfigs = () => list("/procurement-approval-configs")

/** One step of a requisition's approval route, as the requisition endpoints attach it (`approvalRoute`). */
export type ApprovalRouteStep = {
  position: number
  stepNumber: number
  name: string
  kind: "DEPARTMENT_HEAD" | "ROLE" | "USER"
  who: string
  /** The step applies only above this total; null for every requisition. */
  aboveAmount: number | null
  approvers: { id: string; name: string; status?: string; note?: string | null }[]
  status: "APPROVED" | "REJECTED" | "WAITING" | "UPCOMING" | "NOT_REACHED"
  decidedBy: string | null
  decidedById: string | null
  /** Set when an administrator decided a step assigned to someone else. */
  onBehalfOf: string | null
  decidedAt: string | null
  comments: string | null
}

export type ApprovalRoute = {
  requestId: string
  status: string
  submittedAt: string
  totalSteps: number
  currentPosition: number | null
  waitingOn: { who: string; approvers: { id: string; name: string }[] } | null
  steps: ApprovalRouteStep[]
}

export type ApprovalMatrixStep = {
  stepNumber: number
  name: string
  kind: "DEPARTMENT_HEAD" | "ROLE" | "USER"
  who: string
  aboveAmount: number | null
  /** A fixed department; null means the requester's own department. */
  department: string | null
  deputy: boolean
  roleCode: string | null
  userId: string | null
  /** Approvers on this step must hold at least this approval level (User Master); null = any. */
  minApprovalLevel: number | null
  canDelegate: boolean
  matchRules: ApprovalMatchRules
  /** Who holds the step today. */
  people: string[]
}

export type InvoiceAutoApproval = { enabled: boolean; limit: number | null; updatedAt: string | null }

export type ApprovalMatrix = {
  canEdit: boolean
  /** SRD §6.6: whether an exactly matching invoice, its document agreeing, is approved without a person. */
  invoiceAutoApproval: InvoiceAutoApproval
  configId: string | null
  updatedAt: string | null
  steps: ApprovalMatrixStep[]
  departmentRoutes: { department: string; name: string; steps: ApprovalMatrixStep[] }[]
  departments: string[]
  roles: { code: string; name: string; people: number }[]
  /** Staff who can be named on a step; only returned to someone who can edit. */
  people: { id: string; name: string; role: string | null; department: string | null }[]
  permissionDecisions: { label: string; permission: string; roles: { name: string; people: number }[] }[]
}

export type ApprovalMatrixStepInput = {
  kind: "DEPARTMENT_HEAD" | "ROLE" | "USER"
  department?: string | null
  deputy?: boolean
  roleCode?: string | null
  userId?: string | null
  aboveAmount?: number | null
  minApprovalLevel?: number | null
  /** Whether the approver on this step may hand it to someone else (authorised users only). */
  canDelegate?: boolean
  /** Routing conditions: the step applies only when every set list/range matches; empty means any. */
  matchRules?: Partial<ApprovalMatchRules>
}

export type ApprovalMatchRules = {
  departments: string[]
  businessUnits: string[]
  costCentres: string[]
  categories: string[]
  branches: string[]
  methods: string[]
  riskLevels: string[]
  exceptionTypes: string[]
  amountMin: number | null
  amountMax: number | null
}

/** GET /procurement/approval-matrix: the requisition route in force. Every member of staff may read it. */
export async function getApprovalMatrix(stage?: string): Promise<ApprovalMatrix> {
  return unwrapData(await apiClient.get<ApiResponse<ApprovalMatrix>>(`/procurement/approval-matrix${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`))
}

/**
 * PUT /procurement/approval-matrix {steps}: replaces the route. Administrator or CFO only; it applies to requisitions
 * submitted from then on, and ones already waiting keep the route they were given.
 */
export async function saveApprovalMatrix(steps: ApprovalMatrixStepInput[], stage?: string): Promise<ApprovalMatrix> {
  return unwrapData(await apiClient.put<ApiResponse<ApprovalMatrix>>(`/procurement/approval-matrix${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`, { steps }))
}

/** PUT /procurement/invoice-auto-approval {enabled, limit}: administrator or CFO. A null limit means no limit. */
export async function saveInvoiceAutoApproval(body: { enabled: boolean; limit: number | null }): Promise<InvoiceAutoApproval> {
  return unwrapData(await apiClient.put<ApiResponse<InvoiceAutoApproval>>("/procurement/invoice-auto-approval", body))
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/** Newest first: {id, occurredAt, action, entityType, entityId, entityLabel, actorName}. */
export const listProcurementAuditEvents = () => list("/procurement/audit-events?limit=200")

// ---------------------------------------------------------------------------
// SRD §32 document vault: detail, preview, file, versions. §33 audit trail: paged, filtered, exported.
// ---------------------------------------------------------------------------

export type DocumentPreview = {
  id: string
  name: string
  filename: string
  version: string
  versionNo: number
  kind: "pdf" | "image" | "docx" | "sheet" | "csv" | "unsupported" | null
  mime?: string | null
  html?: string
  message?: string
}

export const getProcurementDocument = async (id: string): Promise<ProcurementRecord> =>
  unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>(`/procurement/documents/${encodeURIComponent(id)}`))

export const getProcurementDocumentPreview = async (id: string, versionNo?: number): Promise<DocumentPreview> =>
  unwrapData(await apiClient.get<ApiResponse<DocumentPreview>>(`/procurement/documents/${encodeURIComponent(id)}/preview${versionNo ? `?version=${versionNo}` : ""}`))

/** The stored bytes of a document (or one of its versions), fetched with the caller's credentials. inline = a preview, attachment = a download. */
export async function fetchProcurementDocumentFile(id: string, opts: { versionNo?: number; disposition?: "inline" | "attachment" } = {}): Promise<{ blob: Blob; filename: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
  const q = new URLSearchParams({ disposition: opts.disposition ?? "inline" })
  if (opts.versionNo) q.set("version", String(opts.versionNo))
  const res = await fetch(`${base}/procurement/documents/${encodeURIComponent(id)}/file?${q}`, { headers: authHeader() })
  if (!res.ok) {
    let message = `The file could not be opened (${res.status})`
    try { message = (await res.json())?.message || message } catch { /* not JSON */ }
    throw Object.assign(new Error(message), { status: res.status })
  }
  const cd = res.headers.get("content-disposition") || ""
  const name = decodeURIComponent(cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || cd.match(/filename="([^"]+)"/i)?.[1] || "document")
  return { blob: await res.blob(), filename: name }
}

export type AuditQuery = { page?: number; pageSize?: number; eventType?: string; userId?: string; entityType?: string; from?: string; to?: string; q?: string }
export type AuditPage = { data: ProcurementRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

const auditParams = (p: AuditQuery) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && String(v) !== "") q.set(k, String(v))
  return q.toString()
}

export async function queryProcurementAudit(p: AuditQuery): Promise<AuditPage> {
  const res = await apiClient.get<{ success: boolean; data: ProcurementRecord[]; pagination: AuditPage["pagination"] }>(`/procurement/audit-events?${auditParams(p)}`)
  return { data: res.data ?? [], pagination: res.pagination ?? { page: 1, pageSize: p.pageSize ?? 25, total: (res.data ?? []).length, totalPages: 1 } }
}

export const getProcurementAuditEvent = async (id: string): Promise<ProcurementRecord> =>
  unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>(`/procurement/audit-events/${encodeURIComponent(id)}`))

export const getProcurementAuditFacets = async (p: Pick<AuditQuery, "from" | "to"> = {}): Promise<{ eventTypes: { value: string; label: string; count: number }[]; actors: { id: string; name: string; count: number }[]; entityTypes: string[] }> =>
  unwrapData(await apiClient.get<ApiResponse<any>>(`/procurement/audit-events/facets?${auditParams(p)}`))

export async function downloadProcurementAuditCsv(p: AuditQuery): Promise<Blob> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
  const res = await fetch(`${base}/procurement/audit-events/export?${auditParams({ ...p, page: undefined, pageSize: undefined })}`, { headers: authHeader() })
  if (!res.ok) throw Object.assign(new Error(`The audit trail could not be exported (${res.status})`), { status: res.status })
  return res.blob()
}

// ---------------------------------------------------------------------------
// NTS remaining (ex-SmartStream): settings, reminders, RPA, AI usage, conflicts
// ---------------------------------------------------------------------------

export async function getProcurementSettings(): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>("/procurement/settings"))
}

export async function updateProcurementSettings(body: Record<string, unknown>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>("/procurement/settings", body))
}

export async function runComplianceReminders(): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/compliance-reminders/run", {}))
}

export async function listRpaJobs(params?: { status?: string; take?: number; skip?: number }): Promise<ProcurementRecord> {
  const q = new URLSearchParams()
  if (params?.status) q.set("status", params.status)
  if (params?.take != null) q.set("take", String(params.take))
  if (params?.skip != null) q.set("skip", String(params.skip))
  const qs = q.toString()
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>(`/procurement/rpa-jobs${qs ? `?${qs}` : ""}`))
}

export async function enqueueRpaJob(body: { jobType: string; payload?: object }): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/rpa-jobs", body))
}

export type AiUsageSummary = {
  days: number
  enabled: boolean
  limits: { monthlyDocuments: number | null; monthlyCalls: number | null }
  thisMonth: { since: string; documents: number; calls: number }
  totals: { documentsProcessed: number; modelCalls: number; failures: number; blocked: number }
  byUser: { key: string; documents: number; calls: number; failures: number; blocked: number }[]
  byDocumentType: { key: string; documents: number; calls: number; failures: number; blocked: number }[]
  byFeature: { key: string; documents: number; calls: number; failures: number; blocked: number }[]
  recent: { at: string; user: string; feature: string; documentType: string | null; documentName: string | null; status: "SUCCESS" | "FAILED" | "BLOCKED"; modelCalls: number; model: string | null; durationMs: number | null; error: string | null }[]
}
export async function getAiUsageSummary(days = 30): Promise<AiUsageSummary> {
  return unwrapData(await apiClient.get<ApiResponse<AiUsageSummary>>(`/procurement/ai/usage?days=${days}`))
}

export type AiStatus = {
  enabled: boolean
  canUse: boolean
  reason: string | null
  supportedDocumentTypes: string[]
  allowedDocumentTypes: string[]
  restrictedToRoles: string[]
  limits: { monthlyDocuments: number | null; monthlyCalls: number | null }
  month: { since: string; documents: number; calls: number }
}
export type AiField = {
  key: string
  label: string
  origin: "AI" | "HUMAN"
  aiValue: string | null
  evidence: string | null
  page: number | null
  sourceVerified: boolean | null
  status: "PENDING" | "ACCEPTED" | "CORRECTED" | "REJECTED" | "MANUAL" | "MISSING"
  humanValue: string | null
  /** ORIGINAL is the document itself; AI_EXTRACTED is a proposal; HUMAN_CONFIRMED is a person's confirmation. */
  provenance: "AI_EXTRACTED" | "HUMAN_CONFIRMED" | "REJECTED"
  confirmedValue: string | null
}
export type AiExtraction = {
  id: string
  documentType: string
  fileName: string | null
  status: "PENDING_REVIEW" | "REVIEWED" | "DISCARDED"
  createdAt: string
  model: string | null
  label: string
  summary: string | null
  fields: AiField[]
  missing: { key: string; label: string }[]
  inconsistencies: { source: "AI" | "CHECK"; message: string }[]
  undecided: number
  hasSource: boolean
  confirmed?: Record<string, string>
}
export const getAiStatus = async () => unwrapData(await apiClient.get<ApiResponse<AiStatus>>("/procurement/ai/status"))
export async function aiExtractDocument(file: File, documentType: string): Promise<AiExtraction> {
  const form = new FormData()
  form.append("document", file)
  form.append("documentType", documentType)
  return unwrapData(await apiClient.postFormData<ApiResponse<AiExtraction>>("/procurement/ai/extract", form))
}
export const listAiExtractions = async () => unwrapData(await apiClient.get<ApiResponse<AiExtraction[]>>("/procurement/ai/extractions"))
export const getAiExtraction = async (id: string) => unwrapData(await apiClient.get<ApiResponse<AiExtraction>>(`/procurement/ai/extractions/${encodeURIComponent(id)}`))
export const decideAiField = async (id: string, key: string, action: "ACCEPT" | "CORRECT" | "REJECT" | "MANUAL", value?: string) =>
  unwrapData(await apiClient.put<ApiResponse<AiExtraction>>(`/procurement/ai/extractions/${encodeURIComponent(id)}/fields/${encodeURIComponent(key)}`, { action, value }))
export const completeAiReview = async (id: string) => unwrapData(await apiClient.post<ApiResponse<AiExtraction>>(`/procurement/ai/extractions/${encodeURIComponent(id)}/complete`))
export const discardAiExtraction = async (id: string) => unwrapData(await apiClient.post<ApiResponse<AiExtraction>>(`/procurement/ai/extractions/${encodeURIComponent(id)}/discard`))
/** The original document, for viewing beside the extracted values. */
export async function aiExtractionSource(id: string): Promise<Blob> {
  return (await apiClient.get<Blob>(`/procurement/ai/extractions/${encodeURIComponent(id)}/source`, { responseType: "blob" })) as Blob
}

export async function getConsolidationFx(currencyId?: string): Promise<ProcurementRecord> {
  const q = currencyId ? `?currencyId=${encodeURIComponent(currencyId)}` : ""
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>(`/procurement/consolidation-fx${q}`))
}

export async function runDeptIsolationProbe(): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.get<ApiResponse<ProcurementRecord>>("/procurement/authz/dept-isolation-probe"))
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

/** Bearer token from the auth cookie, for the one call apiClient cannot make: a binary download. */
function authHeader(): Record<string, string> {
  if (typeof document === "undefined") return {}
  const key = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "token"
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`))?.split("=")[1]
  return raw ? { Authorization: `Bearer ${decodeURIComponent(raw)}` } : {}
}

/** The PO document the backend renders. */
export async function downloadPurchaseOrderPdf(id: string): Promise<Blob> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
  const res = await fetch(`${base}/procurement/purchase-orders/${encodeURIComponent(id)}/pdf`, { headers: authHeader() })
  if (!res.ok) throw Object.assign(new Error(`Purchase order PDF failed (${res.status})`), { status: res.status })
  return res.blob()
}

// ---------------------------------------------------------------------------
// SRD §34-§40: notifications, dashboards, reports, currency, numbering, statuses
// (nvccz src/controllers/ProcurementInsightsController.ts; spec: design-refs/notifications-reports/)
//
//   GET/PUT /procurement/notification-rules      the 14 event rules (on/off, in-app, email, thresholds)
//   GET     /procurement/notification-log        every decision the dispatcher took, paged and filterable
//   GET/PUT /procurement/numbering               reference formats;  GET/PUT /procurement/fx, GET/POST/DELETE /procurement/fx/rates
//   GET     /procurement/reports[/:key][/export] the 15 reports, screen and PDF / CSV / XLSX
//   GET     /procurement/dashboards/{me,procurement,executive}
//   GET     /procurement/statuses, /status-history;  PUT|POST .../cancel|close|approve|publish (lifecycle actions)
// ---------------------------------------------------------------------------

export type DashboardQuery = { preset?: string; from?: string; to?: string; convertTo?: string }
const dashParams = (p: DashboardQuery) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v) q.set(k, String(v))
  return q.toString()
}
export const getMyDashboard = async (): Promise<any> => unwrapData(await apiClient.get<ApiResponse<any>>("/procurement/dashboards/me"))
export const getProcurementDashboardLive = async (p: DashboardQuery = {}): Promise<any> => unwrapData(await apiClient.get<ApiResponse<any>>(`/procurement/dashboards/procurement?${dashParams(p)}`))
export const getExecutiveDashboardLive = async (p: DashboardQuery = {}): Promise<any> => unwrapData(await apiClient.get<ApiResponse<any>>(`/procurement/dashboards/executive?${dashParams(p)}`))

export type ReportFilters = Record<string, string | undefined>
export const listProcurementReports = async (): Promise<any[]> => unwrapData(await apiClient.get<ApiResponse<any[]>>("/procurement/reports"))
export const runProcurementReport = async (key: string, filters: ReportFilters, page = 1, pageSize = 25, convertTo?: string): Promise<any> =>
  unwrapData(await apiClient.get<ApiResponse<any>>(`/procurement/reports/${encodeURIComponent(key)}?${dashParams({ ...filters, convertTo, page: String(page), pageSize: String(pageSize) } as any)}`))
export async function downloadProcurementReport(key: string, format: "csv" | "xlsx" | "pdf", filters: ReportFilters, convertTo?: string): Promise<{ blob: Blob; filename: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
  const res = await fetch(`${base}/procurement/reports/${encodeURIComponent(key)}/export?${dashParams({ ...filters, convertTo, format } as any)}`, { headers: authHeader() })
  if (!res.ok) {
    let message = `The report could not be exported (${res.status})`
    try { message = (await res.json())?.message || message } catch { /* not json */ }
    throw Object.assign(new Error(message), { status: res.status })
  }
  const name = /filename="?([^";]+)"?/i.exec(res.headers.get("content-disposition") || "")?.[1] || `${key}.${format}`
  return { blob: await res.blob(), filename: name }
}

export const getNotificationRules = async (): Promise<any[]> => unwrapData(await apiClient.get<ApiResponse<any[]>>("/procurement/notification-rules"))
export const saveNotificationRules = async (rules: Record<string, unknown>): Promise<any[]> => unwrapData(await apiClient.put<ApiResponse<any[]>>("/procurement/notification-rules", { rules }))
export const getNotificationLog = async (p: Record<string, string | number | undefined> = {}): Promise<any> => unwrapData(await apiClient.get<ApiResponse<any>>(`/procurement/notification-log?${dashParams(p as any)}`))
export const getNumberingFormats = async (): Promise<any[]> => unwrapData(await apiClient.get<ApiResponse<any[]>>("/procurement/numbering"))
export const saveNumberingFormats = async (formats: Record<string, string>): Promise<any[]> => unwrapData(await apiClient.put<ApiResponse<any[]>>("/procurement/numbering", { formats }))
export const getFxConfig = async (): Promise<any> => unwrapData(await apiClient.get<ApiResponse<any>>("/procurement/fx"))
export const saveFxConfig = async (body: Record<string, unknown>): Promise<any> => unwrapData(await apiClient.put<ApiResponse<any>>("/procurement/fx", body))
export const listFxRates = async (): Promise<any[]> => unwrapData(await apiClient.get<ApiResponse<any[]>>("/procurement/fx/rates"))
export const saveFxRate = async (body: { from: string; to: string; rate: number; date: string }): Promise<any> => unwrapData(await apiClient.post<ApiResponse<any>>("/procurement/fx/rates", body))
export const deleteFxRate = async (id: string): Promise<any> => unwrapData(await apiClient.delete<ApiResponse<any>>(`/procurement/fx/rates/${encodeURIComponent(id)}`))
export const getStatusVocabulary = async (): Promise<any[]> => unwrapData(await apiClient.get<ApiResponse<any[]>>("/procurement/statuses"))

/** Lifecycle actions (SRD §40): the server refuses any move the status map does not allow, and says why. */
export const cancelRequisitionRecord = async (id: string, reason: string) => unwrapData(await apiClient.put<ApiResponse<any>>(`/procurement/requisitions/${encodeURIComponent(id)}/cancel`, { reason }))
export const closeRequisitionRecord = async (id: string, reason?: string) => unwrapData(await apiClient.put<ApiResponse<any>>(`/procurement/requisitions/${encodeURIComponent(id)}/close`, { reason }))
export const approveRfqDraft = async (id: string) => unwrapData(await apiClient.post<ApiResponse<any>>(`/procurement/rfqs/${encodeURIComponent(id)}/approve`, {}))
export const publishRfqEvent = async (id: string) => unwrapData(await apiClient.post<ApiResponse<any>>(`/procurement/rfqs/${encodeURIComponent(id)}/publish`, {}))
export const closeRfqEvent = async (id: string) => unwrapData(await apiClient.post<ApiResponse<any>>(`/procurement/rfqs/${encodeURIComponent(id)}/close`, {}))
export const cancelRfqEvent = async (id: string, reason: string) => unwrapData(await apiClient.post<ApiResponse<any>>(`/procurement/rfqs/${encodeURIComponent(id)}/cancel`, { reason }))
export const cancelPurchaseOrderRecord = async (id: string, reason: string) => unwrapData(await apiClient.put<ApiResponse<any>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/cancel`, { reason }))
export const closePurchaseOrderRecord = async (id: string, reason?: string) => unwrapData(await apiClient.put<ApiResponse<any>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/close`, { reason }))
export const runNotificationJobs = async (): Promise<any> => unwrapData(await apiClient.post<ApiResponse<any>>("/procurement/notification-jobs/run", {}))
