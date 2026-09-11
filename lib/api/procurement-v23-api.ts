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
 *   POST   /procurement/requisitions                      {title, department, priority, justification, items[{itemName, quantity, unit}]}
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
  permissions: string[]
}

export type ProcurementRecord = Record<string, any>

const list = async (path: string): Promise<ProcurementRecord[]> => {
  const data = unwrapData(await apiClient.get<ApiResponse<ProcurementRecord[]>>(path))
  return Array.isArray(data) ? data : []
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

export const listRequisitions = () => list("/procurement/requisitions")
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
  items: { itemName: string; description?: string; quantity: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/requisitions", body))
}

export async function submitRequisition(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/submit`))
}

export async function approveRequisition(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/approve`))
}

export async function rejectRequisition(id: string, rejectionReason: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/requisitions/${encodeURIComponent(id)}/reject`, { rejectionReason }),
  )
}

// ---------------------------------------------------------------------------
// Sourcing: RFQs and quotations
// ---------------------------------------------------------------------------

export const listRfqs = () => list("/procurement/rfq")
export const getRfqComparison = (rfqId: string) => one(`/procurement/rfqs/${encodeURIComponent(rfqId)}/comparison-matrix`)
export const listQuotations = () => list("/vendor-quotations")

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
  /** 0-1 each; the evaluation weighting of price against everything else. */
  priceWeight?: number
  technicalWeight?: number
  items?: { itemName: string; description?: string; quantity: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/rfq", body))
}

/** The award. Accepting a quotation raises its purchase order. */
export async function acceptQuotation(id: string, reviewNotes?: string): Promise<ProcurementRecord> {
  const q = reviewNotes ? `?reviewNotes=${encodeURIComponent(reviewNotes)}` : ""
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/vendor-quotations/${encodeURIComponent(id)}/accept${q}`))
}

/** The evaluation team's technical score for a bid (0-100). Allowed only while the bid is open. */
export async function scoreQuotation(id: string, body: { score: number; notes?: string }): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/vendor-quotations/${encodeURIComponent(id)}/evaluation`, body))
}

export async function rejectQuotation(id: string, rejectionReason: string, reviewNotes?: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/vendor-quotations/${encodeURIComponent(id)}/reject`, { rejectionReason, reviewNotes }),
  )
}

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

export const listPurchaseOrders = () => list("/procurement/purchase-orders")
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
  items: { itemName: string; description?: string; quantity: number; unitPrice: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/purchase-orders", body))
}

export async function sendPurchaseOrder(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/procurement/purchase-orders/${encodeURIComponent(id)}/send`))
}

// ---------------------------------------------------------------------------
// Receiving
// ---------------------------------------------------------------------------

export async function listGoodsReceivedNotes(): Promise<ProcurementRecord[]> {
  return list("/procurement/goods-received-notes")
}

export const getGoodsReceivedNote = (id: string) => one(`/procurement/goods-received-notes/${encodeURIComponent(id)}`)

export async function createGoodsReceivedNote(body: {
  purchaseOrderId: string
  receivedDate?: string
  items: { purchaseOrderItemId: string; quantityReceived: number; quantityAccepted: number; quantityRejected: number }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/goods-received-notes", body))
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

export const listProcurementInvoices = () => list("/procurement/invoices")

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
  items: { itemName: string; description?: string; quantity: number; unitPrice: number; unit?: string }[]
}): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/procurement/invoices", body))
}

export async function approveProcurementInvoice(id: string, isTaxable = true): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.put<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/approve`, { isTaxable }),
  )
}

export async function payProcurementInvoice(id: string, form: FormData): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.postFormData<ApiResponse<ProcurementRecord>>(`/procurement/invoices/${encodeURIComponent(id)}/payment`, form))
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export const listVendors = () => list("/accounting/vendors")
export const getVendor = (id: string) => one(`/accounting/vendors/${encodeURIComponent(id)}`)

export async function createVendor(body: Record<string, unknown>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>("/accounting/vendors", body))
}

export async function updateVendor(id: string, body: Record<string, unknown>): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.put<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}`, body))
}

export async function blacklistVendor(id: string, blacklistReason: string): Promise<ProcurementRecord> {
  return unwrapData(
    await apiClient.post<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/blacklist`, { blacklistReason }),
  )
}

export async function unblacklistVendor(id: string): Promise<ProcurementRecord> {
  return unwrapData(await apiClient.post<ApiResponse<ProcurementRecord>>(`/accounting/vendors/${encodeURIComponent(id)}/unblacklist`))
}

// ---------------------------------------------------------------------------
// Approval configuration
// ---------------------------------------------------------------------------

export const listApprovalConfigs = () => list("/procurement-approval-configs")

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/** Newest first: {id, occurredAt, action, entityType, entityId, entityLabel, actorName}. */
export const listProcurementAuditEvents = () => list("/procurement/audit-events?limit=200")

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
