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
  getMyProcurementAccess,
  getProcurementDashboard,
  listGoodsReceivedNotes,
  listMyRequisitions,
  listProcurementInvoices,
  listPurchaseOrders,
  listQuotations,
  listRequisitions,
  listRequisitionsAwaitingMyApproval,
  listRfqs,
  listVendors,
  type ProcurementAccess,
  type ProcurementRecord,
} from "@/lib/api/procurement-v23-api"

export type LoaderError = { source: string; message: string; status?: number }

export type LiveKpi = { value: string | number; sub: string }

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

function matchLabel(v: unknown): string {
  const s = String(v ?? "").toUpperCase()
  if (s === "MATCHED") return "Matched"
  if (s === "PENDING" || !s) return "Match pending"
  if (s.includes("MISMATCH") || s.includes("VARIANCE") || s.includes("EXCEPTION")) return "Match variance"
  return titleCase(s)
}

function vendorStatus(v: ProcurementRecord): string {
  if (v.isBlacklisted) return "Blacklisted"
  const tax = String(v.taxComplianceStatus ?? "").toUpperCase()
  if (tax === "COMPLIANT" || tax === "VALID") return "Prequalified"
  if (tax === "EXPIRED" || tax === "EXPIRING" || tax === "EXPIRING_SOON") return "Conditional"
  return "Compliance review"
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Collections with no backend behind them yet. Emptied so the demo records never show. */
const NO_BACKEND_YET = [
  "plans",
  "planItems",
  "journals",
  "assets",
  "documents",
  "reports",
  "notifications",
  "approvals",
  "accessRequests",
  "contractsV6",
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
  const isDeptApprover = access?.departmentRole === "HEAD" || access?.departmentRole === "DEPUTY"

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
  const requisitionsView = requisitionRows.map((r) => ({
    id: r.requisitionNumber ?? r.id,
    recordId: r.id,
    title: r.title ?? DASH,
    // The backend has no legal-entity dimension on a requisition; its department is the
    // closest real owner, and the column shows that rather than a fixture entity.
    entity: r.department ?? DASH,
    type: r.portfolioCompanyId ? "Investee" : "Internal",
    category: r.sourcingCategory ? titleCase(r.sourcingCategory) : DASH,
    // Requisition lines carry no price, so 0 means "not priced", not "free".
    amount: num(r.totalAmount) || null,
    // No budget check exists on the backend; nothing is asserted either way.
    budget: DASH,
    status: REQUISITION_STATUS[String(r.status).toUpperCase()] ?? titleCase(r.status),
    rawStatus: r.status,
    owner: personName(r.requestedBy),
    department: r.department ?? null,
    priority: r.priority ?? null,
    requestedById: r.requestedById ?? null,
    items: (r.items ?? []).map((i: any) => ({ itemName: i.itemName, quantity: num(i.quantity), unit: i.unit ?? null })),
  }))

  // ----------------------------------------------------------------- tenders (RFQs)
  const now = Date.now()
  const tendersView = rfqs.map((t) => {
    const bids = (quotesByRfq.get(t.procurementRfqId ?? t.id) ?? []).filter((q) => String(q.status).toUpperCase() !== "DRAFT")
    const awarded = bids.some((q) => String(q.status).toUpperCase() === "ACCEPTED")
    const closed = t.closingAt ? new Date(t.closingAt).getTime() < now : false
    return {
      id: t.rfqNumber ?? t.id,
      recordId: t.procurementRfqId ?? t.id,
      title: t.title ?? DASH,
      entity: departmentOfRequisition(t.requisitionId),
      category: DASH,
      // An RFQ carries no estimated value; the quotations carry prices, shown in evaluation.
      value: null,
      stage: awarded ? "Awarded" : bids.length ? "Evaluation" : closed ? "Closed" : "Published",
      close: fmtDate(t.closingAt),
      bids: bids.length,
      // An RFQ invites named vendors, which is a restricted process unless publicly listed.
      method: t.visibility === "PUBLIC_LISTING" ? "Open tender" : "Restricted tender",
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
    quotation: o.quotation?.quotationNumber ?? null,
    sentAt: o.sentAt ?? null,
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
        id: `REQ:${r.id}`,
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
          id: `QUO:${lowest.id}`,
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
          id: `GRN:${g.id}`,
          kind: "grn",
          targetId: g.id,
          type: "Goods receipt",
          record: g.grnNumber ?? g.id,
          title: `Inspect and accept receipt against ${g.purchaseOrder?.poNumber ?? "PO"}`,
          entity: departmentOfRequisition(g.purchaseOrder?.requisitionId),
          amount: null,
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
          id: `INV:${inv.id}`,
          kind: "invoice",
          targetId: inv.id,
          type: "Invoice",
          record: inv.invoiceNumber ?? inv.id,
          title: `Approve ${inv.vendor?.name ?? "vendor"} invoice for payment`,
          entity: DASH,
          amount: num(inv.totalAmount),
          role: "Finance Manager",
          reason: `Against ${inv.purchaseOrder?.poNumber ?? "no purchase order"}; three-way match ${matchLabel(inv.matchingStatus).toLowerCase()}.`,
        }),
      )
    }
  }

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

  const kpis: Record<string, LiveKpi> = {
    // Command centre
    "Approved plan": unknown("No procurement plan is recorded yet"),
    "Committed spend": { value: money(committed), sub: `${liveOrders.length} purchase order${liveOrders.length === 1 ? "" : "s"}, not cancelled` },
    "Open tenders": { value: openRfqs.length, sub: `${tendersView.filter((t) => t.stage === "Evaluation").length} with quotations in` },
    Vendors: { value: vendorsView.length, sub: `${vendorsView.filter((v) => v.isBlacklisted).length} blacklisted` },
    // Requisitions
    "Budget warnings": unknown("Requisitions are not budget-checked yet"),
    "Approved for sourcing": { value: reqStatus("APPROVED"), sub: "Approved and not yet sent to RFQ" },
    "Returned drafts": { value: reqStatus("DRAFT") + reqStatus("REJECTED"), sub: "Drafts and rejected requests" },
    "Median approval time": medianDays === null
      ? unknown("No requisition has been approved yet")
      : { value: `${medianDays < 1 ? medianDays.toFixed(2) : medianDays.toFixed(1)} days`, sub: `Across ${approvedDurations.length} approved` },
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
  }

  const hydrate: Record<string, unknown> = {
    requisitions: requisitionsView,
    tenders: tendersView,
    vendors: vendorsView,
    orders: ordersView,
    grns: grnsView,
    invoices: invoicesView,
    approvalPromptsV6: prompts,
    currentUserV6: { name: access?.name ?? DASH, role: access?.roleName ?? DASH },
  }
  for (const key of NO_BACKEND_YET) hydrate[key] = []

  // Sidebar badges: work waiting on someone, counted from the records above.
  const orNull = (n: number) => n || null
  const navCounts: Record<string, number | null> = {
    approvals: orNull(prompts.length),
    requisitions: orNull(reqStatus("PENDING_APPROVAL")),
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
    errors: [...errors],
  }
}

/** What the runtime is hydrated with before the first live load lands: no demo records at all. */
export const EMPTY_PROCUREMENT_HYDRATE: Record<string, unknown> = Object.fromEntries(
  ["requisitions", "tenders", "vendors", "orders", "grns", "invoices", "approvalPromptsV6", ...NO_BACKEND_YET].map((k) => [k, []]),
)
