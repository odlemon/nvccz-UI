/**
 * Procurement V23 live loaders.
 *
 * Fetches the module's records from the API and adapts them into the shapes the vendored
 * runtime renders, for `MatanhoProcurementUI.hydrate()`. The runtime accepts thirteen
 * collections natively; scripts/patch-procurement-runtime.mjs opens the rest (GRNs, approval
 * prompts, contracts and the other versioned stores) so none of their demo records survive.
 *
 * Three rules, as in the payroll loaders:
 *
 *  1. Per-call isolation. Each request goes through `safe()`, which records the failure and
 *     falls back, so a 403 on a register the role cannot see never blanks the module.
 *  2. No invented values. A field is copied from a payload or derived from one, and the
 *     derivation is stated. Where the backend holds nothing, a number is null (the patched
 *     `money` renders an em dash) and text is an em dash — never the fixture's value.
 *  3. Every collection the runtime shipped with demo records is replaced — with [] when no
 *     backend stands behind it — so a live session never shows a demo record as if it were ours.
 */
import {
  getCompanyProfile,
  getMyProcurementAccess,
  getProcurementDashboard,
  getRfqComparison,
  listProcurementAuditEvents,
  listGoodsReceivedNotes,
  listMyRequisitions,
  listProcurementInvoices,
  listPurchaseOrders,
  listQuotations,
  listRequisitions,
  listRequisitionsAwaitingMyApproval,
  listRfqs,
  listBanks,
  listProcurementContracts,
  listProcurementDocuments,
  listProcurementPlans,
  listVendors,
  type ProcurementAccess,
  type ProcurementRecord,
} from "@/lib/api/procurement-v23-api"
import { IS_CUSTOM_BRAND, ORG_NAME } from "@/lib/branding"

export type LoaderError = { source: string; message: string; status?: number }

export type LiveKpi = { value: string | number; sub: string }

export type LiveBank = { id: string; name: string; accountNumber: string | null; currencyId: string | null }

export type ProcurementV23LivePayload = {
  ready: boolean
  access: ProcurementAccess | null
  /** The access call itself failed — not the same as holding no grants. */
  accessUnavailable: boolean
  permissions: string[]
  /** Passed straight to MatanhoProcurementUI.hydrate(). Every value is structured-clone safe. */
  hydrate: Record<string, unknown>
  /** Live figures for KPI cards, keyed by the card's label. Read by the runtime bridge. */
  kpis: Record<string, LiveKpi>
  /** Sidebar badge counts keyed by page id; null renders no badge. */
  navCounts: Record<string, number | null>
  /** Bank and cash accounts a payment can be made from; empty without procurement.invoices.pay. */
  banks?: LiveBank[]
  errors: LoaderError[]
}

const errors: LoaderError[] = []

async function safe<T>(source: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const anyErr = err as any
    errors.push({
      source,
      message: anyErr?.data?.message ?? anyErr?.message ?? "Request failed",
      status: anyErr?.status ?? anyErr?.response?.status,
    })
    return fallback
  }
}

/** Shown wherever the backend genuinely has no value for a displayed text field. */
export const DASH = "—"

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const sum = (rows: ProcurementRecord[], pick: (r: ProcurementRecord) => unknown): number =>
  rows.reduce((total, r) => total + (num(pick(r)) ?? 0), 0)

function fmtDate(v: unknown): string {
  if (!v) return DASH
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function personName(u: any): string {
  if (!u) return DASH
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || DASH
}

function titleCase(v: unknown): string {
  const s = String(v ?? "").trim()
  if (!s) return DASH
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

// ---------------------------------------------------------------------------
// Status vocabularies. The runtime colours a status by its words (approved/ready -> green,
// pending/review -> amber, rejected/blocked -> red, anything else -> blue), so each label
// is chosen to read truthfully and colour correctly.
// ---------------------------------------------------------------------------

const REQUISITION_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending department head",
  PENDING_VC_EXECUTIVE_REVIEW: "Pending CFO review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RFQ_SENT: "Sourcing: RFQ sent",
  CONVERTED_TO_PO: "Converted to PO",
  CANCELLED: "Cancelled",
}

const PO_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  SENT: "Sent to vendor",
  ACKNOWLEDGED: "Acknowledged",
  PARTIALLY_RECEIVED: "Part received",
  PARTIALLY_DELIVERED: "Part received",
  DELIVERED: "Delivered",
  BILLED: "Billed",
  CANCELLED: "Cancelled",
}

const GRN_STATUS: Record<string, string> = {
  RECEIVED: "Pending inspection",
  APPROVED: "Accepted",
  REJECTED: "Rejected",
}

function invoiceStatus(inv: ProcurementRecord): string {
  const s = String(inv.status ?? "").toUpperCase()
  const pay = String(inv.paymentStatus ?? "").toUpperCase()
  if (pay === "PAID" || s === "PAID") return "Paid"
  if (s === "APPROVED") return "Approved"
  if (s === "REJECTED") return "Blocked"
  if (s === "DRAFT" || s === "PENDING" || s === "PENDING_APPROVAL") return "Pending approval"
  return titleCase(s)
}

/** ProcurementInvoice.matchingStatus, set by the backend three-way match (ProcurementInvoiceMatchService). */
function matchLabel(v: unknown): string {
  const s = String(v ?? "").toUpperCase()
  if (s === "MATCHED") return "Matched"
  if (s === "PENDING" || !s) return "Match pending"
  if (s === "AWAITING_RECEIPT") return "Awaiting receipt"
  if (s === "NO_PO") return "No purchase order"
  if (s === "DISCREPANCY" || s.includes("MISMATCH") || s.includes("VARIANCE") || s.includes("EXCEPTION")) return "Match variance"
  return titleCase(s)
}

function vendorStatus(v: ProcurementRecord): string {
  if (v.isBlacklisted) return "Blacklisted"
  const tax = String(v.taxComplianceStatus ?? "").toUpperCase()
  // ACTIVE is what the backend sets when a valid ITF263 expiry is on file.
  if (tax === "ACTIVE" || tax === "COMPLIANT" || tax === "VALID") return "Prequalified"
  if (tax === "EXPIRED" || tax === "EXPIRING" || tax === "EXPIRING_SOON") return "Conditional"
  return "Compliance review"
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Collections with no backend behind them yet. Emptied so the demo records never show. */
const NO_BACKEND_YET = [
  "assets",
  "reports",
  "notifications",
  "approvals",
  "accessRequests",
  "signatureEnvelopesV6",
  "vendorMessagesV6",
  "vendorRequestsV6",
  "planActualsV6",
  "departmentBudgetsV6",
  "rbacUsersV6",
  "vendorAuditTrailV19",
  "quotationNormalisationsV19",
  "complianceReminderLogV7",
] as const

export async function loadProcurementV23LiveData(): Promise<ProcurementV23LivePayload> {
  errors.length = 0

  const access = await safe<ProcurementAccess | null>("me/access", getMyProcurementAccess, null)
  const accessUnavailable = access === null && errors.some((e) => e.source === "me/access")
  const perms = new Set(access?.permissions ?? [])
  const has = (p: string) => perms.has(`procurement.${p}`)
  // Whether an empty register means "none exist" or "not yours to see": a KPI that says "No procurement plan has been
  // approved yet" to Accounts Payable, who cannot read plans, states something false.
  const plansVisible = has("plans.view") || has("plans.manage") || has("plans.approve")
  const isDeptApprover = access?.departmentRole === "HEAD" || access?.departmentRole === "DEPUTY"
  // The organisation's requisitions load only for these; anyone else sees just their own.
  const allRequisitionsVisible = has("requisitions.view") || isDeptApprover

  const [
    allRequisitions,
    myRequisitions,
    awaitingMe,
    rfqs,
    quotations,
    orders,
    grns,
    invoices,
    vendors,
    dashboard,
    auditRows,
    bankRows,
    documentRows,
    contractRows,
    planRows,
    companyProfile,
  ] = await Promise.all([
    // Every department for the desk; a department head sees their own department.
    has("requisitions.view") || isDeptApprover
      ? safe("requisitions", listRequisitions, [] as ProcurementRecord[])
      : Promise.resolve([] as ProcurementRecord[]),
    // Everyone raises requisitions, so everyone sees their own, drafts included.
    safe("requisitions/my", listMyRequisitions, [] as ProcurementRecord[]),
    isDeptApprover
      ? safe("requisitions/pending-approval", listRequisitionsAwaitingMyApproval, [] as ProcurementRecord[])
      : Promise.resolve([] as ProcurementRecord[]),
    has("rfq.view") ? safe("rfq", listRfqs, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("quotations.view") ? safe("vendor-quotations", listQuotations, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("orders.view") ? safe("purchase-orders", listPurchaseOrders, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("receiving.view") ? safe("goods-received-notes", listGoodsReceivedNotes, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("invoices.view") ? safe("invoices", listProcurementInvoices, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("vendors.view") ? safe("vendors", listVendors, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("dashboard.view") ? safe("dashboard", getProcurementDashboard, null) : Promise.resolve(null),
    has("audit.view") ? safe("audit-events", listProcurementAuditEvents, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    // Payment needs an account to pay from; only the role that pays reads them.
    has("invoices.pay") ? safe("cashbook/banks", listBanks, [] as ProcurementRecord[]) : Promise.resolve([] as ProcurementRecord[]),
    has("documents.view") || has("documents.manage")
      ? safe("procurement/documents", listProcurementDocuments, [] as ProcurementRecord[])
      : Promise.resolve([] as ProcurementRecord[]),
    has("contracts.view") || has("contracts.manage")
      ? safe("procurement/contracts", listProcurementContracts, [] as ProcurementRecord[])
      : Promise.resolve([] as ProcurementRecord[]),
    has("plans.view") || has("plans.manage") || has("plans.approve")
      ? safe("procurement/plans", listProcurementPlans, [] as ProcurementRecord[])
      : Promise.resolve([] as ProcurementRecord[]),
    // The letterhead on generated documents. None set up yet (404) is not a load failure, and
    // without it the letterhead carries the organisation's name only.
    getCompanyProfile().catch(() => null),
  ])

  // One register of requisitions: the full list where the role has it, plus the caller's own
  // (drafts are never in the full list).
  const reqById = new Map<string, ProcurementRecord>()
  for (const r of [...allRequisitions, ...myRequisitions, ...awaitingMe]) reqById.set(r.id, r)
  const requisitionRows = [...reqById.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  const departmentOfRequisition = (id: unknown) => (id ? reqById.get(String(id))?.department ?? DASH : DASH)

  const quotesByRfq = new Map<string, ProcurementRecord[]>()
  for (const q of quotations) {
    if (!q.procurementRfqId) continue
    const list = quotesByRfq.get(q.procurementRfqId) ?? []
    list.push(q)
    quotesByRfq.set(q.procurementRfqId, list)
  }

  const liveOrders = orders.filter((o) => String(o.status).toUpperCase() !== "CANCELLED")
  const spendByVendor = new Map<string, number>()
  for (const o of liveOrders) spendByVendor.set(o.vendorId, (spendByVendor.get(o.vendorId) ?? 0) + (num(o.totalAmount) ?? 0))

  // ----------------------------------------------------------------- requisitions
  // Requisitions the caller can decide: a department head's own queue, or every pending one for a
  // privileged role. The approver view lists only these, never another department's requests.
  const decidableIds = new Set(
    (isDeptApprover
      ? awaitingMe
      : access?.isPrivileged
        ? requisitionRows.filter((r) => String(r.status).toUpperCase() === "PENDING_APPROVAL")
        : []
    ).map((r) => r.id),
  )
  const requisitionsView = requisitionRows.map((r) => ({
    id: r.requisitionNumber ?? r.id,
    recordId: r.id,
    awaitingMe: decidableIds.has(r.id),
    title: r.title ?? DASH,
    // The backend has no legal-entity dimension on a requisition; its department is the
    // closest real owner, and the column shows that rather than a fixture entity.
    entity: r.department ?? DASH,
    type: r.portfolioCompanyId ? "Investee" : "Internal",
    category: r.sourcingCategory ? titleCase(r.sourcingCategory) : DASH,
    // Line estimates are the requester's own; 0 means "not estimated", not "free".
    amount: num(r.totalAmount) || null,
    // No budget check exists on the backend; nothing is asserted either way.
    budget: DASH,
    status: REQUISITION_STATUS[String(r.status).toUpperCase()] ?? titleCase(r.status),
    rawStatus: r.status,
    owner: personName(r.requestedBy),
    department: r.department ?? null,
    priority: r.priority ?? null,
    requestedById: r.requestedById ?? null,
    // Prefills the requester's edit form with what they wrote, not the runtime's sample motivation.
    justification: r.justification ?? null,
    items: (r.items ?? []).map((i: any) => ({ itemName: i.itemName, quantity: num(i.quantity), unit: i.unit ?? null, unitPrice: num(i.unitPrice) || null })),
  }))

  // ----------------------------------------------------------------- tenders (RFQs)
  const now = Date.now()
  const tendersView = rfqs.map((t) => {
    const bids = (quotesByRfq.get(t.procurementRfqId ?? t.id) ?? []).filter((q) => String(q.status).toUpperCase() !== "DRAFT")
    const awarded = bids.some((q) => String(q.status).toUpperCase() === "ACCEPTED")
    const closed = t.closingAt ? new Date(t.closingAt).getTime() < now : false
    // An RFQ carries no category or estimate of its own; the requisition it was raised from carries both.
    const source = t.requisitionId ? reqById.get(String(t.requisitionId)) : undefined
    return {
      id: t.rfqNumber ?? t.id,
      recordId: t.procurementRfqId ?? t.id,
      title: t.title ?? DASH,
      entity: departmentOfRequisition(t.requisitionId),
      category: source?.sourcingCategory ? titleCase(source.sourcingCategory) : DASH,
      // The requester's estimate; the quotations carry the prices, shown in evaluation.
      value: num(source?.totalAmount) || null,
      stage: awarded ? "Awarded" : bids.length ? "Evaluation" : closed ? "Closed" : "Published",
      close: fmtDate(t.closingAt),
      bids: bids.length,
      // An RFQ invites named vendors; it is an open tender only when publicly listed.
      method: t.visibility === "PUBLIC_LISTING" ? "Open tender" : "Request for quotation",
      owner: personName(t.createdBy),
      requisition: t.requisition?.requisitionNumber ?? null,
      rawStatus: t.status,
      closingAt: t.closingAt ?? null,
    }
  })

  // ----------------------------------------------------------------- vendors
  const vendorsView = vendors.map((v) => ({
    id: v.id,
    recordId: v.id,
    name: v.name ?? DASH,
    category: v.category ? titleCase(v.category) : DASH,
    country: DASH,
    bp: v.bpNumber ?? DASH,
    vat: v.taxNumber ?? DASH,
    currency: DASH,
    status: vendorStatus(v),
    // The runtime prints `${rating} / 5`, so an unrated vendor must be a dash, not null.
    rating: num(v.vendorRating) ?? DASH,
    itf: v.taxClearanceExpiryDate ? `Valid to ${fmtDate(v.taxClearanceExpiryDate)}` : "Missing",
    // Derived: the total of this vendor's purchase orders that are not cancelled.
    spend: spendByVendor.get(v.id) ?? 0,
    email: v.email ?? DASH,
    contact: v.contactPerson ?? DASH,
    phone: v.phone ?? DASH,
    paymentTerms: v.paymentTerms ?? DASH,
    taxExpiry: v.taxClearanceExpiryDate ? String(v.taxClearanceExpiryDate).slice(0, 10) : null,
    companyProfileDate: null,
    complianceDocs: [],
    whtRate: null,
    isBlacklisted: Boolean(v.isBlacklisted),
  }))

  // ----------------------------------------------------------------- purchase orders
  const ordersView = orders.map((o) => ({
    id: o.poNumber ?? o.id,
    recordId: o.id,
    vendor: o.vendor?.name ?? DASH,
    vendorId: o.vendorId ?? null,
    entity: departmentOfRequisition(o.requisitionId),
    amount: num(o.totalAmount),
    status: PO_STATUS[String(o.status).toUpperCase()] ?? titleCase(o.status),
    rawStatus: o.status,
    delivery: fmtDate(o.expectedDeliveryDate),
    // PO lines are not classified as fixed assets on the backend.
    asset: false,
    currency: o.currency?.code ?? null,
    requisition: o.requisition?.requisitionNumber ?? null,
    // What was bought and its category, from the requisition: the invoice match names its sources with it for
    // roles that cannot open RFQs, and spend by category groups on it.
    sourceTitle: o.requisition?.title ?? null,
    spendCategory: o.requisitionId && reqById.get(String(o.requisitionId))?.sourcingCategory
      ? titleCase(reqById.get(String(o.requisitionId))?.sourcingCategory)
      : null,
    quotation: o.quotation?.quotationNumber ?? null,
    // The RFQ this order was awarded from, which links it into the invoice match chain.
    rfq: o.quotation?.rfqNumber ?? null,
    acknowledged: Boolean(o.vendorAcknowledgedAt),
    currencyId: o.currencyId ?? null,
    sentAt: o.sentAt ?? null,
    // For the monthly commitment chart.
    orderDate: o.orderDate ?? o.createdAt ?? null,
    items: (o.items ?? []).map((i: any) => ({
      id: i.id,
      itemName: i.itemName,
      quantity: num(i.quantity),
      unitPrice: num(i.unitPrice),
      received: num(i.quantityReceived),
    })),
  }))

  // ----------------------------------------------------------------- goods received
  const grnsView = grns.map((g) => {
    const poItems = new Map<string, any>((g.purchaseOrder?.items ?? []).map((i: any) => [i.id, i]))
    const lines = (g.items ?? []).map((i: any) => ({ ...i, po: poItems.get(i.purchaseOrderItemId) }))
    const names = lines.map((l: any) => l.po?.itemName).filter(Boolean)
    return {
      id: g.grnNumber ?? g.id,
      recordId: g.id,
      po: g.purchaseOrder?.poNumber ?? DASH,
      item: names.length ? `${names[0]}${names.length > 1 ? ` +${names.length - 1} more` : ""}` : DASH,
      entity: departmentOfRequisition(g.purchaseOrder?.requisitionId),
      // Derived: accepted quantity at the PO line's unit price.
      value: lines.reduce((t: number, l: any) => t + (num(l.quantityAccepted) ?? 0) * (num(l.po?.unitPrice) ?? 0), 0),
      status: GRN_STATUS[String(g.status).toUpperCase()] ?? titleCase(g.status),
      rawStatus: g.status,
      asset: false,
      transferred: false,
      quality: titleCase(g.qualityStatus),
      receivedBy: personName(g.receivedBy),
      received: fmtDate(g.receivedDate),
    }
  })

  // ----------------------------------------------------------------- invoices
  // What the LLM read from the supplier's document, compared with the invoice as captured (ProcurementInvoiceReadingService).
  const readingOf = (inv: any) => {
    const o = inv.ocrData
    if (!o || typeof o !== "object" || !o.status) {
      return inv.documentPath ? { status: "PENDING", agrees: null, differences: [] as string[], supplierInvoiceNumber: null, fromOcr: false, message: null } : null
    }
    return {
      status: String(o.status),
      agrees: typeof o.comparison?.agrees === "boolean" ? o.comparison.agrees : null,
      differences: Array.isArray(o.comparison?.differences) ? o.comparison.differences.map((d: any) => String(d?.message ?? "")) : ([] as string[]),
      supplierInvoiceNumber: o.supplierInvoiceNumber ?? null,
      fromOcr: Boolean(o.fromOcr),
      message: o.message ?? null,
    }
  }
  const readingSentence = (inv: any) => {
    const r = readingOf(inv)
    if (!r) return "No supplier document is attached."
    if (r.status === "PENDING") return "The supplier's document is being read."
    if (r.status !== "READ") return `The supplier's document could not be read${r.message ? `: ${r.message}` : ""}.`
    const ref = r.supplierInvoiceNumber ? ` (supplier's invoice ${r.supplierInvoiceNumber})` : ""
    return r.agrees
      ? `The supplier's document${ref} agrees with the captured invoice.`
      : `The supplier's document${ref} differs from the capture: ${r.differences.slice(0, 3).join("; ")}${r.differences.length > 3 ? ` and ${r.differences.length - 3} more` : ""}.`
  }
  const invoicesView = invoices.map((inv) => ({
    id: inv.invoiceNumber ?? inv.id,
    recordId: inv.id,
    vendor: inv.vendor?.name ?? DASH,
    po: inv.purchaseOrder?.poNumber ?? DASH,
    amount: num(inv.totalAmount),
    match: matchLabel(inv.matchingStatus),
    tax: (num(inv.taxAmount) ?? 0) > 0 ? `VAT ${money(num(inv.taxAmount) ?? 0)}` : "No VAT",
    status: invoiceStatus(inv),
    rawStatus: inv.status,
    paymentStatus: inv.paymentStatus ?? null,
    due: fmtDate(inv.dueDate),
    vendorId: inv.vendorId ?? null,
    currency: inv.currency?.code ?? null,
    // Full payment of a Finance-approved invoice. The backend does not yet record how much of a
    // part-paid invoice is outstanding, so a part-paid invoice is not offered for another payment.
    payable:
      String(inv.status).toUpperCase() === "APPROVED" &&
      !["PAID", "PARTIALLY_PAID"].includes(String(inv.paymentStatus ?? "").toUpperCase()),
    outstanding: num(inv.totalAmount),
    matchFlags: Array.isArray(inv.aiDiscrepancies?.flags) ? inv.aiDiscrepancies.flags : [],
    reading: readingOf(inv),
    readingSentence: readingSentence(inv),
    journal: inv.journalEntry?.referenceNumber ?? null,
    journalStatus: inv.journalEntry?.status ?? null,
    // For the monthly charts: when it was invoiced, and when it was paid.
    invoiceDate: inv.invoiceDate ?? null,
    paidAt: inv.paymentDate ?? null,
  }))

  // ----------------------------------------------------------------- journal queue
  // Paying an invoice creates its expense recognition journal (ProcurementService.payProcurementInvoice)
  // as PENDING; the queue lists those real journals, and a pending one is posted from here.
  const journalsView = invoices
    .filter((inv) => inv.journalEntry?.referenceNumber)
    .map((inv) => ({
      id: inv.journalEntry.referenceNumber,
      recordId: inv.journalEntry.id,
      source: `Invoice ${inv.invoiceNumber ?? inv.id} · ${inv.vendor?.name ?? DASH}`,
      debit: (num(inv.taxAmount) ?? 0) > 0 ? "Expense + VAT input" : "Expense",
      credit: "Accounts payable",
      amount: num(inv.totalAmount) ?? 0,
      status: titleCase(inv.journalEntry.status ?? "POSTED"),
    }))

  // ----------------------------------------------------------------- quotations and evaluation
  const openQuote = (s: unknown) => ["SUBMITTED", "UNDER_REVIEW"].includes(String(s ?? "").toUpperCase())
  const quotationsView = quotations.map((q) => ({
    id: q.quotationNumber ?? q.id,
    recordId: q.id,
    rfq: q.rfqNumber ?? null,
    rfqId: q.procurementRfqId ?? null,
    vendor: q.companyName || q.vendorName || DASH,
    vendorId: q.vendorId ?? null,
    amount: num(q.totalAmount),
    rawStatus: String(q.status ?? "").toUpperCase(),
    status: titleCase(q.status),
    open: openQuote(q.status),
    // Only the evaluation team's score counts; a vendor's own declarations are not a score.
    evaluationScore: num((q.technicalScoreJson as any)?.evaluation?.score),
    submitted: fmtDate(q.submittedAt),
    currency: q.currencyCode ?? null,
    priceScore: null,
    weighted: null,
  }))

  // The comparison matrix, for every tender with bids (in evaluation or already awarded), supplies
  // the RFQ's weights and the price and weighted scores. A weighted score is shown only once every
  // bid is scored.
  const withBids = tendersView.filter((t) => t.bids > 0)
  const matrices = await Promise.all(
    withBids.map((t) => safe(`comparison/${t.id}`, () => getRfqComparison(String(t.recordId)), null as ProcurementRecord | null)),
  )
  const evaluationLive: Record<string, unknown> = {}
  withBids.forEach((t, index) => {
    const m = matrices[index]
    if (!m) return
    const complete = Boolean(m.evaluationComplete)
    const rows = ((m.rows ?? []) as any[]).map((r) => {
      const q = r.quotation ?? {}
      const c = r.comparison ?? {}
      return {
        recordId: q.id,
        id: q.quotationNumber ?? q.id,
        vendor: q.companyName || q.vendor?.name || q.vendorName || DASH,
        amount: num(q.totalAmount),
        rawStatus: String(q.status ?? "").toUpperCase(),
        status: titleCase(q.status),
        open: openQuote(q.status),
        evaluationScore: num(c.evaluationScore),
        priceScore: num(c.priceScore),
        weighted: complete ? num(c.compositeScore) : null,
        deliveryTime: q.deliveryTime ?? null,
        paymentTerms: q.paymentTerms ?? null,
        reviewedAt: q.reviewedAt ?? null,
        // Line totals are quantity × unit price as quoted, excluding VAT.
        items: ((q.items ?? []) as any[]).map((i) => ({
          itemName: i.itemName,
          quantity: num(i.quantity),
          unitPrice: num(i.unitPrice),
          lineTotal: (num(i.quantity) ?? 0) * (num(i.unitPrice) ?? 0),
        })),
      }
    })
    rows.sort((a, b) =>
      complete ? (b.weighted ?? -1) - (a.weighted ?? -1) : (a.amount ?? Infinity) - (b.amount ?? Infinity),
    )
    const first = (m.rows ?? [])[0]?.comparison ?? {}
    evaluationLive[t.id] = {
      rows,
      priceWeight: num(first.priceWeight ?? m.rfq?.priceWeight),
      technicalWeight: num(first.technicalWeight ?? m.rfq?.technicalWeight),
      complete,
    }
  })

  // ----------------------------------------------------------------- contracts & awards
  // Contracts from the register (GET /procurement/contracts), followed by awards (accepted
  // quotations) that have no contract yet, which say "Awarded" and carry no invented terms.
  const tenderByNumber = new Map(tendersView.map((t) => [t.id, t]))
  const poByQuotation = new Map(orders.filter((o) => o.quotationId).map((o) => [o.quotationId, o]))
  const CONTRACT_STATUS: Record<string, string> = { DRAFT: "Draft", ACTIVE: "Active", EXPIRED: "Expired", TERMINATED: "Terminated" }
  const contracted = new Set(contractRows.filter((c) => c.quotationId && c.status !== "TERMINATED").map((c) => c.quotationId))
  const contractsView = [
    ...contractRows.map((c) => {
      const tender = c.rfqNumber ? tenderByNumber.get(c.rfqNumber) : undefined
      return {
        id: c.contractNumber ?? c.id,
        recordId: c.id,
        kind: "contract",
        tender: c.rfqNumber ?? DASH,
        title: c.title ?? DASH,
        vendor: c.vendorName ?? DASH,
        vendorId: c.vendorId ?? null,
        entity: tender?.entity ?? DASH,
        value: num(c.value) ?? 0,
        currency: c.currencyCode ?? null,
        start: c.startDate ? String(c.startDate).slice(0, 10) : DASH,
        end: c.endDate ? String(c.endDate).slice(0, 10) : DASH,
        status: CONTRACT_STATUS[String(c.effectiveStatus ?? c.status).toUpperCase()] ?? titleCase(c.status),
        rawStatus: c.status,
        quotationId: c.quotationId ?? null,
        paymentTerms: c.paymentTerms ?? null,
        scope: c.scope ?? null,
      }
    }),
    ...quotations
      .filter((q) => String(q.status).toUpperCase() === "ACCEPTED" && !contracted.has(q.id))
      .map((q) => {
        const tender = q.rfqNumber ? tenderByNumber.get(q.rfqNumber) : undefined
        const po = poByQuotation.get(q.id)
        return {
          id: po?.poNumber ?? q.quotationNumber ?? q.id,
          recordId: q.id,
          kind: "award",
          tender: q.rfqNumber ?? DASH,
          title: tender?.title ?? DASH,
          vendor: q.companyName || q.vendorName || DASH,
          vendorId: q.vendorId ?? null,
          entity: tender?.entity ?? DASH,
          // The quotations list withholds prices on a sealed RFQ, so an award there has no total of its own;
          // its purchase order carries the awarded value. Without this a contract raised from it saved 0.
          value: num(q.totalAmount) ?? num(po?.totalAmount) ?? 0,
          currency: q.currencyCode ?? null,
          start: q.reviewedAt ? String(q.reviewedAt).slice(0, 10) : DASH,
          end: DASH,
          status: "Awarded",
          rawStatus: "AWARDED",
          quotationId: q.id,
          quotation: q.quotationNumber ?? null,
        }
      }),
  ]

  // ----------------------------------------------------------------- annual plans
  const PLAN_STATUS: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Under review", APPROVED: "Approved", REJECTED: "Rejected" }
  const yearOf = (fy: unknown) => Number(String(fy ?? "").match(/(\d{4})/)?.[1] ?? 0)
  const plansView = planRows.map((p) => {
    const year = yearOf(p.fiscalYear)
    // Derived: purchase orders (not cancelled) raised in the plan's year for its department.
    const committed = liveOrders
      .filter(
        (o) =>
          (!year || new Date(o.orderDate ?? o.createdAt).getFullYear() === year) &&
          (!p.department || departmentOfRequisition(o.requisitionId) === p.department),
      )
      .reduce((t, o) => t + (num(o.totalAmount) ?? 0), 0)
    return {
      id: p.planNumber ?? p.id,
      recordId: p.id,
      name: p.name ?? DASH,
      entity: p.department ?? "All departments",
      department: p.department ?? null,
      fiscalYear: p.fiscalYear ?? null,
      budget: num(p.budget) ?? 0,
      planned: num(p.plannedValue) ?? 0,
      committed,
      status: PLAN_STATUS[String(p.status).toUpperCase()] ?? titleCase(p.status),
      rawStatus: p.status,
      version: `v${p.version ?? 1}.0`,
      owner: DASH,
      createdById: p.createdById ?? null,
      notes: p.notes ?? null,
      rejectionReason: p.rejectionReason ?? null,
    }
  })
  const planItemsView = planRows.flatMap((p) =>
    (p.items ?? []).map((i: any, idx: number) => ({
      id: `${p.planNumber ?? p.id}-L${idx + 1}`,
      recordId: i.id,
      planRecordId: p.id,
      plan: p.planNumber ?? p.id,
      description: i.description ?? DASH,
      entity: i.department ?? p.department ?? "All departments",
      category: i.category ?? DASH,
      quarter: i.quarter ?? DASH,
      method: i.method ?? DASH,
      budget: num(i.estimatedValue) ?? 0,
      status: titleCase(i.status),
    })),
  )

  // ----------------------------------------------------------------- document vault
  const DOCUMENT_STATUS: Record<string, string> = { UNDER_REVIEW: "Under review", APPROVED: "Approved", ARCHIVED: "Archived" }
  const esc = (v: unknown) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)
  const documentsView = documentRows.map((d) => ({
    id: `DOC-${String(d.id).slice(-6).toUpperCase()}`,
    recordId: d.id,
    name: d.name ?? DASH,
    type: d.documentType ?? "Supporting document",
    version: d.version ?? "v1.0",
    owner: d.uploadedByName ?? DASH,
    status: DOCUMENT_STATUS[String(d.status).toUpperCase()] ?? titleCase(d.status),
    rawStatus: d.status,
    date: fmtDate(d.createdAt),
    folder: d.folder ?? "General",
    relatedRecord: d.relatedRecord ?? null,
    classification: d.classification ?? null,
    fileUrl: d.fileUrl ?? null,
    // The runtime's preview renders `content`; a stored file has no rendered body, so link to it.
    content:
      `<h1>${esc(d.name ?? "Document")}</h1>` +
      `<p><strong>Folder:</strong> ${esc(d.folder ?? "General")} · <strong>Version:</strong> ${esc(d.version ?? "v1.0")}</p>` +
      (d.relatedRecord ? `<p><strong>Related record:</strong> ${esc(d.relatedRecord)}</p>` : "") +
      (d.description ? `<p>${esc(d.description)}</p>` : "") +
      `<p><a href="${esc(d.fileUrl ?? "#")}" target="_blank" rel="noopener">Open the stored file</a> (${esc(d.mimeType ?? "file")}, ${Math.max(1, Math.round((Number(d.fileSizeBytes) || 0) / 1024))} KB)</p>`,
  }))

  // ----------------------------------------------------------------- approval prompts
  // Built only from decisions the signed-in user can actually take, each pointing at a real
  // record. The approve/reject handlers route on `kind`.
  const approverName = access?.name ?? DASH
  const prompt = (p: Record<string, unknown>) => ({
    approver: approverName,
    due: DASH,
    priority: "Normal",
    status: "Awaiting me",
    esign: false,
    ...p,
  })
  const prompts: Record<string, unknown>[] = []

  const pendingReqs = isDeptApprover
    ? awaitingMe
    : access?.isPrivileged
      ? requisitionRows.filter((r) => String(r.status).toUpperCase() === "PENDING_APPROVAL")
      : []
  for (const r of pendingReqs) {
    prompts.push(
      prompt({
        id: `PR-${r.requisitionNumber ?? r.id}`,
        kind: "requisition",
        targetId: r.id,
        type: "Purchase requisition",
        record: r.requisitionNumber ?? r.id,
        title: r.title ?? DASH,
        entity: r.department ?? DASH,
        amount: num(r.totalAmount) || null,
        role: "Department head",
        reason: r.justification || "Requisition submitted for department approval.",
      }),
    )
  }

  if (has("rfq.award")) {
    for (const t of rfqs) {
      const bids = (quotesByRfq.get(t.procurementRfqId ?? t.id) ?? []).filter((q) => ["SUBMITTED", "UNDER_REVIEW"].includes(String(q.status).toUpperCase()))
      const decided = (quotesByRfq.get(t.procurementRfqId ?? t.id) ?? []).some((q) => String(q.status).toUpperCase() === "ACCEPTED")
      if (!bids.length || decided) continue
      const lowest = [...bids].sort((a, b) => (num(a.totalAmount) ?? Infinity) - (num(b.totalAmount) ?? Infinity))[0]
      prompts.push(
        prompt({
          id: `AWARD-${t.rfqNumber ?? t.id}`,
          kind: "award",
          targetId: lowest.id,
          type: "Tender award",
          record: t.rfqNumber ?? t.id,
          title: `Award to ${lowest.companyName || lowest.vendorName || "vendor"}`,
          entity: departmentOfRequisition(t.requisitionId),
          amount: num(lowest.totalAmount),
          role: "Procurement Manager",
          // Stated plainly: the recommendation is the lowest total, nothing more.
          reason: `Lowest total of ${bids.length} submitted quotation${bids.length === 1 ? "" : "s"} (${lowest.quotationNumber ?? lowest.id}). Approving accepts it and raises the purchase order.`,
        }),
      )
    }
  }

  if (has("receiving.approve")) {
    for (const g of grns.filter((x) => String(x.status).toUpperCase() === "RECEIVED")) {
      prompts.push(
        prompt({
          id: `RECEIPT-${g.grnNumber ?? g.id}`,
          kind: "grn",
          targetId: g.id,
          type: "Goods receipt",
          record: g.grnNumber ?? g.id,
          title: `Inspect and accept receipt against ${g.purchaseOrder?.poNumber ?? "PO"}`,
          entity: departmentOfRequisition(g.purchaseOrder?.requisitionId),
          // The receipt's value as the Receiving register shows it; the Approval Centre card read "Value —".
          amount: grnsView.find((x) => x.id === (g.grnNumber ?? g.id))?.value || null,
          role: "Procurement Manager",
          reason: `Received ${fmtDate(g.receivedDate)} by ${personName(g.receivedBy)}.`,
        }),
      )
    }
  }

  if (has("invoices.approve")) {
    for (const inv of invoices.filter((x) => ["DRAFT", "PENDING", "PENDING_APPROVAL"].includes(String(x.status).toUpperCase()))) {
      prompts.push(
        prompt({
          id: `INVOICE-${inv.invoiceNumber ?? inv.id}`,
          kind: "invoice",
          targetId: inv.id,
          type: "Invoice",
          record: inv.invoiceNumber ?? inv.id,
          title: `Approve ${inv.vendor?.name ?? "vendor"} invoice for payment`,
          // The department whose requisition the order was raised from.
          entity: departmentOfRequisition(orders.find((o) => o.id === inv.purchaseOrderId)?.requisitionId),
          amount: num(inv.totalAmount),
          role: "Finance Manager",
          // The approver sees what the LLM read from the supplier's own document beside the capture.
          reason: `Against ${inv.purchaseOrder?.poNumber ?? "no purchase order"}; three-way match ${matchLabel(inv.matchingStatus).toLowerCase()}. ${readingSentence(inv)}`,
        }),
      )
    }
  }

  if (has("plans.approve")) {
    // The plan's author cannot decide it (the API refuses), so it is not offered to them.
    for (const p of plansView.filter((x) => x.rawStatus === "SUBMITTED" && x.createdById !== access?.userId)) {
      prompts.push(
        prompt({
          id: `PLAN-${p.id}`,
          kind: "plan",
          targetId: p.recordId,
          type: "Procurement plan",
          record: p.id,
          title: `Approve ${p.name}`,
          entity: p.entity,
          amount: p.budget,
          role: "Finance Manager",
          reason: `${p.fiscalYear ?? ""} plan: ${planItemsView.filter((i) => i.planRecordId === p.recordId).length} line(s) planned at ${money(p.planned)} against a budget of ${money(p.budget)}.`,
        }),
      )
    }
  }

  // ----------------------------------------------------------------- every open approval
  // The Approval Centre's "All open approvals": each approval still open in the registers this role can read,
  // whoever it waits on, oldest first. "Awaiting me" (the prompts above) is the subset this person can decide.
  const mineIds = new Set(prompts.map((p) => String(p.id)))
  const firstDate = (...ds: unknown[]) => {
    for (const d of ds) if (d && !Number.isNaN(new Date(String(d)).getTime())) return new Date(String(d)).toISOString()
    return null
  }
  const approvalGroup: Record<string, unknown>[] = []
  const open = (p: Record<string, unknown>) => approvalGroup.push({ ...p, mine: mineIds.has(String(p.id)) })
  for (const r of requisitionRows.filter((x) => String(x.status).toUpperCase() === "PENDING_APPROVAL")) {
    open({
      id: `PR-${r.requisitionNumber ?? r.id}`,
      type: "Purchase requisition",
      record: r.requisitionNumber ?? r.id,
      title: r.title ?? DASH,
      entity: r.department ?? DASH,
      amount: num(r.totalAmount) || null,
      waitingOn: r.department ? `Head of ${r.department}` : "Department head",
      // Not updatedAt: any later edit would restart the clock.
      since: firstDate(r.submittedAt, r.createdAt),
      page: "requisitions",
    })
  }
  for (const t of rfqs) {
    const all = quotesByRfq.get(t.procurementRfqId ?? t.id) ?? []
    const bids = all.filter((q) => ["SUBMITTED", "UNDER_REVIEW"].includes(String(q.status).toUpperCase()))
    if (!bids.length || all.some((q) => String(q.status).toUpperCase() === "ACCEPTED")) continue
    const lowest = [...bids].sort((a, b) => (num(a.totalAmount) ?? Infinity) - (num(b.totalAmount) ?? Infinity))[0]
    open({
      id: `AWARD-${t.rfqNumber ?? t.id}`,
      type: "Tender award",
      record: t.rfqNumber ?? t.id,
      title: `Award to ${lowest.companyName || lowest.vendorName || "vendor"}`,
      entity: departmentOfRequisition(t.requisitionId),
      amount: num(lowest.totalAmount),
      waitingOn: "Procurement Manager",
      since: firstDate(...bids.map((q) => q.submittedAt).sort()),
      page: "evaluation",
    })
  }
  for (const g of grns.filter((x) => String(x.status).toUpperCase() === "RECEIVED")) {
    open({
      id: `RECEIPT-${g.grnNumber ?? g.id}`,
      type: "Goods receipt",
      record: g.grnNumber ?? g.id,
      title: `Inspect and accept receipt against ${g.purchaseOrder?.poNumber ?? "PO"}`,
      entity: departmentOfRequisition(g.purchaseOrder?.requisitionId),
      // The receipt's value as the Receiving register shows it.
      amount: grnsView.find((x) => x.id === (g.grnNumber ?? g.id))?.value || null,
      waitingOn: "Procurement Manager",
      since: firstDate(g.receivedDate, g.createdAt),
      page: "receiving",
    })
  }
  for (const inv of invoices.filter((x) => ["DRAFT", "PENDING", "PENDING_APPROVAL"].includes(String(x.status).toUpperCase()))) {
    open({
      id: `INVOICE-${inv.invoiceNumber ?? inv.id}`,
      type: "Invoice",
      record: inv.invoiceNumber ?? inv.id,
      title: `Approve ${inv.vendor?.name ?? "vendor"} invoice for payment`,
      entity: departmentOfRequisition(orders.find((o) => o.id === inv.purchaseOrderId)?.requisitionId),
      amount: num(inv.totalAmount),
      waitingOn: "Finance Manager",
      since: firstDate(inv.createdAt, inv.invoiceDate),
      page: "invoices",
    })
  }
  for (const p of plansView.filter((x) => x.rawStatus === "SUBMITTED")) {
    const raw = planRows.find((x) => x.id === p.recordId)
    open({
      id: `PLAN-${p.id}`,
      type: "Procurement plan",
      record: p.id,
      title: `Approve ${p.name}`,
      entity: p.entity,
      amount: p.budget,
      waitingOn: "Finance Manager",
      since: firstDate(raw?.submittedAt, raw?.updatedAt, raw?.createdAt),
      page: "plan",
    })
  }
  // A decision offered to this person that no register above lists (a department head's own queue).
  for (const p of prompts) {
    if (!approvalGroup.some((g) => g.id === p.id)) approvalGroup.push({ ...p, mine: true, waitingOn: "You", since: null, page: "approvals" })
  }
  approvalGroup.sort((a, b) => String(a.since ?? "9").localeCompare(String(b.since ?? "9")))

  // ----------------------------------------------------------------- audit trail
  // The audit page renders tuples: [id, event, record, actor, time, class].
  const AUDIT_ENTITY: Record<string, string> = {
    PurchaseRequisition: "requisition",
    ProcurementRfq: "RFQ",
    RFQ: "RFQ",
    VendorQuotation: "quotation",
    PurchaseOrder: "purchase order",
    GoodsReceivedNote: "goods receipt",
    ProcurementInvoice: "invoice",
    Vendor: "vendor",
    ProcurementPlan: "plan",
    ProcurementContract: "contract",
    ProcurementDocument: "document",
    VendorInvoiceIntake: "invoice reading",
  }
  // RFQ rows are written against the RFQ number rather than its id; name the RFQ the way other rows name theirs.
  const rfqAuditLabel = (number: unknown) => {
    const t = tendersView.find((x) => x.id === number)
    return t ? `${t.id} · ${t.title}` : null
  }
  const auditEventsLive = auditRows.map((a) => {
    const act = String(a.action ?? "")
    const cls = /APPROVE|REJECT|BLACKLIST|PAYMENT|SEND|SCORE/.test(act)
      ? "Controlled"
      : /DELETE|CANCEL/.test(act)
        ? "High priority"
        : /CREATE|UPDATE|SUBMIT/.test(act)
          ? "Workflow"
          : "System"
    const when = a.occurredAt
      ? new Date(a.occurredAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
      : DASH
    return [
      `AUD-${String(a.id).slice(-8).toUpperCase()}`,
      `${titleCase(act)} ${AUDIT_ENTITY[a.entityType] ?? titleCase(a.entityType)}`,
      a.entityLabel ?? (a.entityType === "RFQ" ? rfqAuditLabel(a.entityId) : null) ?? a.entityId ?? DASH,
      a.actorName ?? "System",
      when,
      cls,
    ]
  })

  // ----------------------------------------------------------------- KPI figures
  // Keyed by card label. Where the backend can answer, the figure is computed here and the
  // derivation is in the sub-text; where it cannot, the card says so.
  const unknown = (sub: string): LiveKpi => ({ value: DASH, sub })
  const countBy = <T,>(rows: T[], test: (r: T) => boolean) => rows.filter(test).length
  const reqStatus = (s: string) => countBy(requisitionRows, (r) => String(r.status).toUpperCase() === s)
  const openRfqs = tendersView.filter((t) => t.stage === "Published" || t.stage === "Evaluation")
  const committed = sum(liveOrders, (o) => o.totalAmount)
  const weekAhead = now + 7 * 86400000
  const approvedDurations = requisitionRows
    .filter((r) => r.approvedAt && r.createdAt)
    .map((r) => new Date(r.approvedAt).getTime() - new Date(r.createdAt).getTime())
    .filter((ms) => ms >= 0)
    .sort((a, b) => a - b)
  const medianDays = approvedDurations.length
    ? approvedDurations[Math.floor(approvedDurations.length / 2)] / 86400000
    : null
  const today = new Date().toDateString()
  const grnOnTime = grns.filter((g) => g.receivedDate && g.purchaseOrder?.expectedDeliveryDate)
  const onTime = grnOnTime.filter((g) => new Date(g.receivedDate).getTime() <= new Date(g.purchaseOrder.expectedDeliveryDate).getTime())

  // Figures the full UI census found blank although the records answer them.
  const payableInvoices = invoices.filter(
    (i) => String(i.status).toUpperCase() === "APPROVED" && !["PAID", "PARTIALLY_PAID"].includes(String(i.paymentStatus ?? "").toUpperCase()),
  )
  const apOutstanding = sum(payableInvoices, (i) => i.totalAmount)
  const paidInvoices = invoices.filter((i) => String(i.paymentStatus ?? "").toUpperCase() === "PAID")
  const paidTotal = sum(paidInvoices, (i) => i.totalAmount)
  const approvedPlans = plansView.filter((p) => p.rawStatus === "APPROVED")
  const approvedBudget = approvedPlans.reduce((t, p) => t + p.budget, 0)
  // Remaining and variance compare one fiscal year's orders with that year's approved plans; orders of
  // one year against another year's plan mean nothing.
  const thisYear = new Date().getFullYear()
  const yearBudget = approvedPlans.filter((p) => yearOf(p.fiscalYear) === thisYear).reduce((t, p) => t + p.budget, 0)
  const yearCommitted = sum(
    liveOrders.filter((o) => new Date(o.orderDate ?? o.createdAt).getFullYear() === thisYear),
    (o) => o.totalAmount,
  )
  // Savings on an award: the highest submitted bid less the accepted one, for each awarded RFQ.
  const savings = [...quotesByRfq.values()].reduce((t, all) => {
    const bids = all.filter((q) => String(q.status).toUpperCase() !== "DRAFT")
    const accepted = bids.find((q) => String(q.status).toUpperCase() === "ACCEPTED")
    if (!accepted) return t
    const highest = Math.max(...bids.map((q) => num(q.totalAmount) ?? 0))
    return t + Math.max(0, highest - (num(accepted.totalAmount) ?? 0))
  }, 0)

  const kpis: Record<string, LiveKpi> = {
    // Command centre
    "Approved plan": approvedPlans.length
      ? {
          value: money(approvedBudget),
          sub: `${approvedPlans.length} approved plan${approvedPlans.length === 1 ? "" : "s"} (${[...new Set(approvedPlans.map((p) => p.fiscalYear).filter(Boolean))].join(", ") || "no fiscal year"})`,
        }
      : unknown(plansVisible ? "No procurement plan has been approved yet" : "Procurement plans are not visible to your role"),
    "Committed spend": { value: money(committed), sub: `${liveOrders.length} purchase order${liveOrders.length === 1 ? "" : "s"}, not cancelled` },
    "Open tenders": { value: openRfqs.length, sub: `${tendersView.filter((t) => t.stage === "Evaluation").length} with quotations in` },
    Vendors: { value: vendorsView.length, sub: `${vendorsView.filter((v) => v.isBlacklisted).length} blacklisted` },
    // Requisitions
    "Budget warnings": unknown("Requisitions are not budget-checked yet"),
    "Approved for sourcing": { value: reqStatus("APPROVED"), sub: "Approved and not yet sent to RFQ" },
    "Returned drafts": { value: reqStatus("DRAFT") + reqStatus("REJECTED"), sub: "Drafts and rejected requests" },
    "Median approval time": medianDays === null
      ? unknown(allRequisitionsVisible ? "No requisition has been approved yet" : "Your role sees only its own requisitions")
      : {
          value:
            medianDays < 1 / 24
              ? `${Math.max(1, Math.round(medianDays * 1440))} min`
              : medianDays < 1
                ? `${(medianDays * 24).toFixed(1)} hours`
                : `${medianDays.toFixed(1)} days`,
          sub: `Submission to approval, across ${approvedDurations.length} approved`,
        },
    "Department isolation": { value: "Enforced", sub: "Department heads see their own department" },
    // Tenders
    "Active tenders": { value: openRfqs.length, sub: "Published or in evaluation" },
    "Vendor invitations": unknown("Invitation counts are not returned by the RFQ register"),
    "Secure submissions": { value: quotations.length, sub: "Quotations received through vendor links" },
    "Closing this week": {
      value: tendersView.filter((t) => t.closingAt && new Date(t.closingAt).getTime() >= now && new Date(t.closingAt).getTime() <= weekAhead).length,
      sub: "RFQs closing in the next 7 days",
    },
    Clarifications: unknown("Clarifications are not loaded yet"),
    // Evaluation
    "Awaiting evaluation": { value: tendersView.filter((t) => t.stage === "Evaluation").length, sub: "RFQs with quotations and no award" },
    // Receiving
    "Receipts today": { value: countBy(grns, (g) => new Date(g.receivedDate).toDateString() === today), sub: "Goods received notes dated today" },
    "Pending inspection": { value: countBy(grns, (g) => String(g.status).toUpperCase() === "RECEIVED"), sub: "Awaiting quality approval" },
    Discrepancies: { value: countBy(grns, (g) => String(g.status).toUpperCase() === "REJECTED"), sub: "Receipts rejected on inspection" },
    "Third-party GRNs": { value: countBy(grns, (g) => g.submittedByInvestee === true), sub: "Recorded through the investee portal" },
    "On-time receipt": grnOnTime.length
      ? { value: `${Math.round((onTime.length / grnOnTime.length) * 100)}%`, sub: `${onTime.length} of ${grnOnTime.length} by the PO delivery date` }
      : unknown("No receipt has a PO delivery date to compare"),
    // Purchase orders
    "Awaiting acknowledgement": { value: countBy(orders, (o) => String(o.status).toUpperCase() === "SENT" && !o.vendorAcknowledgedAt), sub: "Sent, not yet acknowledged by the vendor" },
    // Vendors
    "Registered vendors": { value: vendorsView.length, sub: `${new Set(vendorsView.map((v) => v.category).filter((c) => c !== DASH)).size} categories` },
    Prequalified: { value: vendorsView.filter((v) => v.status === "Prequalified").length, sub: "Valid tax clearance on file" },
    "Compliance review": { value: vendorsView.filter((v) => v.status === "Compliance review").length, sub: "Tax clearance not yet verified" },
    Blacklisted: { value: vendorsView.filter((v) => v.isBlacklisted).length, sub: "Excluded from invitations" },
    // Audit
    "Events today": has("audit.view")
      ? {
          value: auditRows.filter((a) => new Date(a.occurredAt).toDateString() === today).length,
          sub: auditRows.length >= 200 ? "Within the latest 200 procurement events" : "Procurement events recorded today",
        }
      : unknown("The audit trail is not visible to your role"),
    // Both are enforced by the API: separate grants for award, approval and payment, and a
    // staff-only gate that refuses external portal accounts.
    "SoD controls": { value: "Enforced", sub: "Award, approval and payment are separate grants" },
    "Entity isolation": { value: "Enforced", sub: "External portal accounts are refused" },
    // Annual plans
    "Consolidated budget": {
      value: money(plansView.filter((p) => p.rawStatus !== "REJECTED").reduce((t, p) => t + p.budget, 0)),
      sub: `${plansView.length} plan${plansView.length === 1 ? "" : "s"} on record`,
    },
    "Submitted plans": {
      value: `${plansView.filter((p) => ["SUBMITTED", "APPROVED"].includes(String(p.rawStatus))).length} of ${plansView.length}`,
      sub: "Submitted or approved",
    },
    "Budget coverage": (() => {
      const budget = plansView.reduce((t, p) => t + p.budget, 0)
      const planned = plansView.reduce((t, p) => t + p.planned, 0)
      return budget > 0
        ? { value: `${Math.round((planned / budget) * 1000) / 10}%`, sub: "Planned lines against plan budgets" }
        : unknown("No plan has a budget yet")
    })(),
    "Strategic tenders": unknown("Tenders are not linked to plan lines"),
    "Plan amendments": {
      value: plansView.reduce((t, p) => t + Math.max(0, Number(String(p.version).replace(/[^0-9.]/g, "")) - 1), 0),
      sub: "Resubmissions after rejection",
    },
    "Unfunded exposure": {
      value: money(plansView.reduce((t, p) => t + Math.max(0, p.planned - p.budget), 0)),
      sub: "Planned beyond each plan budget",
    },
    // Contracts
    // The runtime summed every row in the register, terminated contracts included — and a terminated
    // contract's award comes back as an award awaiting a contract, so its value was counted twice.
    "Contract value": (() => {
      const active = contractsView.filter((c) => c.kind === "contract" && c.status === "Active")
      const awards = contractsView.filter((c) => c.kind === "award")
      return {
        value: money([...active, ...awards].reduce((t, c) => t + (c.value || 0), 0)),
        sub: `${active.length} active contract${active.length === 1 ? "" : "s"} and ${awards.length} award${awards.length === 1 ? "" : "s"} awaiting a contract`,
      }
    })(),
    "Renewals in 90 days": {
      value: contractsView.filter(
        (c) => c.kind === "contract" && c.rawStatus === "ACTIVE" && c.end !== DASH && new Date(c.end).getTime() - Date.now() < 90 * 864e5,
      ).length,
      sub: "Active contracts ending within 90 days",
    },
    "Vendor obligations": unknown("Obligations are not tracked on contracts yet"),
    // Cards the full UI census found blank although the records answer them.
    "Pending approvals": { value: prompts.length, sub: "Decisions waiting for you: requisitions, awards, receipts, invoices and plans" },
    "AP exposure": {
      value: money(apOutstanding),
      sub: `${payableInvoices.length} approved invoice${payableInvoices.length === 1 ? "" : "s"} not yet paid`,
    },
    "AP liability": { value: money(apOutstanding), sub: "Approved supplier invoices not yet paid" },
    "Invoices captured": {
      value: invoices.length,
      sub: `${countBy(invoices, (i) => String(i.status).toUpperCase() === "DRAFT")} awaiting Finance approval`,
    },
    Matched: { value: countBy(invoices, (i) => String(i.matchingStatus).toUpperCase() === "MATCHED"), sub: "Purchase order, receipt and invoice agree" },
    Exceptions: {
      value: countBy(
        invoices,
        (i) => ["DISCREPANCY", "AWAITING_RECEIPT", "NO_PO"].includes(String(i.matchingStatus).toUpperCase()) && String(i.status).toUpperCase() !== "REJECTED",
      ),
      sub: "Discrepancy, awaiting receipt or no purchase order",
    },
    "VAT input": {
      value: money(sum(invoices.filter((i) => String(i.status).toUpperCase() === "APPROVED"), (i) => i.taxAmount)),
      sub: "VAT on approved supplier invoices",
    },
    "Invoice exposure": {
      value: money(
        sum(
          invoices.filter((i) => String(i.status).toUpperCase() !== "REJECTED" && String(i.paymentStatus ?? "").toUpperCase() !== "PAID"),
          (i) => i.totalAmount,
        ),
      ),
      sub: "Captured or approved and not yet paid",
    },
    "WHT required": unknown("Withholding tax is not calculated on procurement invoices"),
    "WHT payable": unknown("Withholding tax is not calculated on procurement invoices"),
    "Journal queue": { value: journalsView.filter((j) => j.status === "Pending").length, sub: "Payment journals awaiting posting to the ledger" },
    "Asset transfer queue": unknown("Fixed-asset transfers are not recorded in procurement"),
    "Accounting API": { value: "Ledger", sub: "Invoice payments create journals in the accounting ledger" },
    "SoD checks": { value: "Enforced", sub: "Authors cannot approve their own plans; decisions are role-bound" },
    "eSign coverage": unknown("eSignature is not connected"),
    "Value in market": {
      value: money(
        sum(
          openRfqs.flatMap((t) => {
            const r = requisitionsView.find((x) => x.id === t.requisition)
            return r ? [r] : []
          }),
          (r) => r.amount,
        ),
      ),
      sub: "Requisition estimates behind open RFQs",
    },
    Committed: { value: money(committed), sub: `${liveOrders.length} purchase order${liveOrders.length === 1 ? "" : "s"}, not cancelled` },
    "Actual spend": { value: money(paidTotal), sub: `${paidInvoices.length} paid invoice${paidInvoices.length === 1 ? "" : "s"}` },
    Remaining: yearBudget > 0
      ? { value: money(yearBudget - yearCommitted), sub: `FY ${thisYear} approved plan budgets less FY ${thisYear} commitments` }
      : unknown(plansVisible ? `No approved plan covers FY ${thisYear}` : "Procurement plans are not visible to your role"),
    Variance: yearBudget > 0
      ? { value: `${Math.round((yearCommitted / yearBudget) * 1000) / 10}%`, sub: `FY ${thisYear} commitments as a share of its approved plan budgets` }
      : unknown(plansVisible ? `No approved plan covers FY ${thisYear}` : "Procurement plans are not visible to your role"),
    Forecast: unknown("Spend forecasting is not available"),
    "Technical threshold": unknown("No scoring threshold is configured for RFQs"),
    "Potential savings": { value: money(savings), sub: "Accepted quotation against the highest bid, across awarded RFQs" },
    "Recommendations due": { value: tendersView.filter((t) => t.stage === "Evaluation").length, sub: "RFQs with quotations and no award" },
    "Recommendations pending": { value: tendersView.filter((t) => t.stage === "Evaluation").length, sub: "RFQs with quotations and no award" },
    "Committee sessions": unknown("Evaluation committees are not recorded"),
    "Declarations complete": unknown("Conflict-of-interest declarations are not recorded"),
    "Evaluated value": {
      value: money(sum(quotations.filter((q) => ["SUBMITTED", "UNDER_REVIEW"].includes(String(q.status).toUpperCase())), (q) => q.totalAmount)),
      sub: "Open quotations on RFQs awaiting award",
    },
    "Events with quotations": {
      value: tendersView.filter((t) => t.bids > 0).length,
      sub: `${tendersView.filter((t) => t.stage === "Evaluation").length} awaiting award`,
    },
    "Published reports": unknown("Report runs are exported, not stored"),
    "Scheduled deliveries": unknown("Report schedules are not stored"),
    "Board packs": unknown("Board packs are not stored"),
    "Downloads this month": unknown("Report downloads are not logged"),
    "Data freshness": { value: "Live", sub: "Registers load from the API when the page opens" },
    // Audit & Compliance: nothing measures these yet, and "no live source" said too little.
    "Accounting accuracy": unknown("Journal accuracy is not measured in procurement"),
    "Document retrieval": unknown("Vault retrieval is not measured"),
    "Immutable records": unknown("Record immutability is not attested yet"),
  }

  const hydrate: Record<string, unknown> = {
    requisitions: requisitionsView,
    tenders: tendersView,
    vendors: vendorsView,
    orders: ordersView,
    grns: grnsView,
    invoices: invoicesView,
    approvalPromptsV6: prompts,
    approvalGroupV23: approvalGroup,
    currentUserV6: { name: access?.name ?? DASH, role: access?.roleName ?? DASH },
    auditEventsLive,
    complianceReminderSettingsV7: NO_REMINDER_AUTOMATION,
    quotationsLive: quotationsView,
    evaluationLive,
    contractsV6: contractsView,
    plans: plansView,
    planItems: planItemsView,
    documents: documentsView,
    journals: journalsView,
    // Generated documents carry the organisation's letterhead (GET /company-profile), never the runtime's
    // fixture company. Without a profile, the organisation's name only; the Matanho logo only on Matanho.
    letterhead: (() => {
      const p = (companyProfile ?? {}) as Record<string, any>
      const addresses: any[] = Array.isArray(p.addresses) ? p.addresses : []
      const a = addresses.find((x) => x.isActive) ?? addresses[0]
      const company = p.legalName || ORG_NAME
      return {
        company,
        division: "Procurement",
        address: a ? [a.line1, a.line2, a.city, a.country].filter(Boolean).join(", ") : "",
        contact: [p.email, p.phone, p.website].filter(Boolean).join(" · "),
        registration: [p.registrationNumber && `Registration no. ${p.registrationNumber}`, p.taxNumber && `Tax no. ${p.taxNumber}`]
          .filter(Boolean)
          .join(" · "),
        footer: `Controlled document · ${company}`,
        color: "#6657d9",
        showLogo: !IS_CUSTOM_BRAND,
      }
    })(),
  }
  for (const key of NO_BACKEND_YET) hydrate[key] = []

  // Sidebar badges: work waiting on someone, counted from the records above.
  const orNull = (n: number) => n || null
  const navCounts: Record<string, number | null> = {
    approvals: orNull(prompts.length),
    // What the page opens on for this user: requisitions awaiting their decision or, with none to decide, their
    // own requests still in approval. Counting every pending requisition put a badge over a manager's empty queue.
    requisitions: orNull(
      requisitionsView.filter((r) => String(r.rawStatus).toUpperCase() === "PENDING_APPROVAL" && r.awaitingMe).length ||
        requisitionsView.filter(
          (r) => String(r.rawStatus).toUpperCase() === "PENDING_APPROVAL" && Boolean(access?.userId) && r.requestedById === access?.userId,
        ).length,
    ),
    tenders: orNull(openRfqs.length),
    evaluation: orNull(tendersView.filter((t) => t.stage === "Evaluation").length),
    orders: orNull(countBy(orders, (o) => String(o.status).toUpperCase() === "SENT" && !o.vendorAcknowledgedAt)),
    receiving: orNull(countBy(grns, (g) => String(g.status).toUpperCase() === "RECEIVED")),
    invoices: orNull(invoicesView.filter((i) => i.status === "Pending approval").length),
  }

  return {
    ready: true,
    access,
    accessUnavailable,
    permissions: access?.permissions ?? [],
    hydrate,
    kpis,
    navCounts,
    banks: bankRows
      .filter((b) => b.isActive !== false)
      .map((b) => ({ id: String(b.id), name: String(b.name ?? b.id), accountNumber: b.accountNumber ?? null, currencyId: b.currencyId ?? null })),
    errors: [...errors],
  }
}

/**
 * The vendor page shows a reminder schedule with a last and next run. No reminder automation
 * exists on the backend, so it says so rather than showing the fixture's runs.
 */
const NO_REMINDER_AUTOMATION = {
  enabled: false,
  cadence: "Not configured",
  thresholds: DASH,
  vendorChannel: DASH,
  internalRecipients: DASH,
  lastRun: "Never run",
  nextRun: "Not scheduled",
}

/** What the runtime is hydrated with before the first live load lands: no demo records at all. */
export const EMPTY_PROCUREMENT_HYDRATE: Record<string, unknown> = {
  ...Object.fromEntries(
    ["requisitions", "tenders", "vendors", "orders", "grns", "invoices", "approvalPromptsV6", "approvalGroupV23", "auditEventsLive", "quotationsLive", "plans", "planItems", "documents", "journals", ...NO_BACKEND_YET].map((k) => [k, []]),
  ),
  complianceReminderSettingsV7: NO_REMINDER_AUTOMATION,
  evaluationLive: {},
}
