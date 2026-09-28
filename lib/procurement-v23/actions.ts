/**
 * Procurement V23 write actions.
 *
 * The host (components/procurement-v23-mock/procurement-v23-app.tsx) claims clicks on the
 * action ids below before the runtime sees them and routes them here. Anything else keeps the
 * runtime's own behaviour — view state, filters, drawers and the forms these actions submit.
 *
 * Contract for a handler:
 *   handled  — the action was claimed (the runtime's mock path was suppressed)
 *   reload   — the caller should re-run the live loaders afterwards
 *   message  — success text to surface
 *   error    — failure text to surface; never fail silently, because a control that looks
 *              live and quietly does nothing is the defect this module is being fixed for
 *
 * Every handler checks the grant first and says why it refuses, so a role without it sees an
 * explanation rather than a dead button or a 403.
 */
import {
  acceptQuotation,
  addProcurementPlanItem,
  createProcurementContract,
  createProcurementPlan,
  decideProcurementPlan,
  setProcurementContractStatus,
  submitProcurementPlan,
  updateProcurementContract,
  updateProcurementPlan,
  updateProcurementPlanItem,
  uploadProcurementDocumentVersion,
  uploadProcurementDocuments,
  setProcurementDocumentStatus,
  approveGoodsReceivedNote,
  approveProcurementInvoice,
  approveRequisition,
  captureProcurementInvoice,
  createGoodsReceivedNote,
  createPurchaseOrder,
  createRequisition,
  createRfq,
  createVendor,
  deleteVendor,
  changeVendorStatus,
  uploadVendorDocument,
  updateVendorDocument,
  createVendorBank,
  runVendorComplianceCycle,
  extendRfqClosing,
  reopenRfq,
  extractInvoiceForCapture,
  payProcurementInvoice,
  postJournalEntry,
  readProcurementError,
  rejectGoodsReceivedNote,
  rejectProcurementInvoice,
  rejectQuotation,
  rejectRequisition,
  saveApprovalMatrix,
  saveInvoiceAutoApproval,
  saveRequisitionPolicy,
  saveProcurementBudget,
  uploadRequisitionAttachments,
  removeRequisitionAttachment,
  returnRequisition,
  commentOnRequisition,
  delegateRequisitionApproval,
  sendPurchaseOrder,
  submitRequisition,
  updateRequisition,
  updateVendor,
  approveVendorRegistration,
  declineVendorRegistration,
  openRfqBids,
  captureQuotation,
  setRfqFxRate,
  setEvaluationCriteria,
  applyDefaultEvaluationCriteria,
  setEvaluationCommittee,
  declareEvaluation,
  saveEvaluationScores,
  submitEvaluationScorecard,
  saveEvaluationDeclarationOption,
  prepareAwardRecommendation,
  submitAwardRecommendation,
  decideAwardRecommendation,
  downloadQuotationDocument,
  transitionInvoiceHandoff,
  matchProcurementInvoice,
  downloadPurchaseOrderPdf,
  getInvoiceHandoff,
  submitPoForApproval,
  decidePoApproval,
  uploadReceiptFiles,
  aiExtractDocument,
  decideAiField,
  completeAiReview,
  discardAiExtraction,
  aiExtractionSource,
  getAiExtraction,
  delegateApproval,
  createAppRole,
  runComplianceReminders,
  updateProcurementSettings,
  getAiUsageSummary,
  enqueueRpaJob,
} from "@/lib/api/procurement-v23-api"
import type { ProcurementV23LivePayload } from "@/lib/procurement-v23/live-loaders"

/** The API's error code (for example MATCH_EXCEPTIONS), when the failure carried one. */
function errorCode(e: unknown): string {
  const anyErr = e as any
  return String(anyErr?.response?.code ?? anyErr?.response?.data?.code ?? anyErr?.data?.code ?? "")
}

/** Save a blob the API returned as a file. */
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

const p2pHost = () => (window as unknown as { __pr23P2p?: Record<string, (...a: any[]) => any> }).__pr23P2p

/** Who a requisition now waits on, from the route the API returns with it: "step 2 of 2, Finance Manager (Blessing Sibanda)". */
function routeNext(rec: Record<string, any> | null | undefined): string | null {
  const route = rec?.approvalRoute
  if (!route?.waitingOn) return null
  const names = (route.waitingOn.approvers ?? []).map((p: { name: string }) => p.name).join(", ")
  const step = route.totalSteps > 1 ? `step ${route.currentPosition} of ${route.totalSteps}, ` : ""
  return `${step}${route.waitingOn.who}${names ? ` (${names})` : ""}`
}

/** An approval that completes a step but not the route says where the requisition went next. */
function approvedMessage(id: string, rec: Record<string, any> | null | undefined): string {
  const next = routeNext(rec)
  return String(rec?.status ?? "").toUpperCase() === "PENDING_APPROVAL" && next
    ? `${id} approved at your step. It now waits for ${next}.`
    : `${id} approved.`
}

/** The §11 header fields of a requisition form, read from whichever form (#prForm or #editPrFormV11) is on screen. */
function requisitionHeader(form: string, clearable: boolean) {
  const v = (name: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`${form} [name="${name}"]`)?.value ?? "").trim()
  const pick = (name: string) => v(name) || (clearable ? null : undefined)
  return {
    currencyId: v("currencyId") || undefined,
    requiredDate: pick("requiredDate"),
    procurementMethod: pick("procurementMethod"),
    riskLevel: pick("riskLevel"),
    exceptionType: pick("exceptionType"),
    budgetCode: pick("budgetCode"),
    costCentre: pick("costCentre"),
    branch: pick("branch"),
    businessUnit: pick("businessUnit"),
    deliveryLocation: pick("deliveryLocation"),
    planItemId: pick("planItem"),
    suggestedVendorId: document.querySelector(`${form} [name="suggestedVendor"]`) ? pick("suggestedVendor") : undefined,
  }
}

/** Every line on a requisition form. Without live lines the form itself is the single line. */
function requisitionLines(form: string) {
  const lineRows = [...document.querySelectorAll<HTMLElement>(`${form} [data-pr-line]`)]
  const formEl = document.querySelector<HTMLElement>(form)
  return (lineRows.length ? lineRows : formEl ? [formEl] : []).map((row) => {
    const field = (n: string) => ((row.querySelector(`[name="${n}"]`) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "").trim()
    const estimate = Number(field("price"))
    return {
      itemName: field("item"),
      quantity: Number(field("qty")),
      unit: field("uom") || undefined,
      // The requester's unit estimate; it stays internal and is never copied onto an RFQ.
      unitPrice: estimate > 0 ? estimate : undefined,
    }
  })
}

/** Reject, return for amendment, or comment on a requisition in approval, each with the comment it needs. */
async function decideRequisition(recordId: string, display: string, decision: string, reason: string): Promise<ProcurementActionResult> {
  if (!reason) return { handled: true, error: "Write your comments first." }
  if (decision === "return") {
    await returnRequisition(recordId, reason)
    closeRuntimeOverlay()
    return { handled: true, reload: true, message: `${display} returned to its requester for amendment.` }
  }
  if (decision === "comment") {
    await commentOnRequisition(recordId, reason)
    closeRuntimeOverlay()
    return { handled: true, reload: true, message: `Comment recorded on ${display}.` }
  }
  await rejectRequisition(recordId, reason)
  closeRuntimeOverlay()
  return { handled: true, reload: true, message: `${display} rejected with your reason.` }
}

/** The files chosen on a requisition form. */
function pickedFiles(form: string): File[] {
  const input = document.querySelector<HTMLInputElement>(`${form} [name="attachments"]`)
  return input?.files ? [...input.files] : []
}

export type ProcurementActionDetail = {
  action: string
  dataset: Record<string, string | undefined>
}

export type ProcurementActionResult = {
  handled: boolean
  reload?: boolean
  message?: string
  error?: string
}

/** Wired to the live API in this build. */
export const LIVE_ACTIONS = [
  "submit-pr",
  "save-pr",
  "save-approval-matrix-v23",
  "confirm-delegate-pr-v23",
  "remove-pr-attachment-v23",
  "save-requisition-policy-v23",
  "save-budget-v23",
  "save-invoice-auto-approval-v23",
  "confirm-capture-approve-invoice-v23",
  "confirm-capture-flag-invoice-v23",
  "save-pr-v11",
  "submit-pr-v11",
  "approve-pr-v11",
  "confirm-reject-pr-v11",
  "approve-prompt-v6",
  "confirm-reject-approval-v6",
  "register-vendor-confirm",
  "register-vendor-confirm-v6",
  "save-vendor-profile-v23",
  "delete-vendor-v23",
  "extend-rfq-closing-v23",
  "reopen-rfq-v23",
  "approve-vendor-registration-v23",
  "confirm-decline-vendor-registration-v23",
  "send-po-v6",
  "create-send-tender-v13",
  "create-send-tender-from-preview-v13",
  // SRD §40: an event saved as a Draft sends nothing until it is approved and published
  "save-tender-v13",
  "open-bids-v23",
  "save-criteria-v23",
  "default-criteria-v23",
  "save-committee-v23",
  "capture-quotation-v23",
  "save-fx-v23",
  "declare-v23",
  "save-scores-v23",
  "submit-scorecard-v23",
  "prepare-recommendation-v23",
  "submit-recommendation-v23",
  "decide-recommendation-v23",
  "finalise-award-v23",
  "save-declaration-wording-v23",
  "download-quotation-doc-v23",
  "submit-po-approval-v23",
  "download-po-pdf-v23",
  "approve-invoice-v23",
  "confirm-override-approve-v23",
  "rematch-invoice-v23",
  "confirm-return-invoice-v23",
  "save-p2p-settings-v23",
  "save-ai-settings-v23",
  "ai-extract-v23",
  "ai-decide-v23",
  "ai-complete-v23",
  "ai-discard-v23",
  "ai-source-v23",
  "confirm-delegate-approval-v6",
  "delegate-approval-v6",
  "create-delegation-v6",
  "create-role-confirm",
  "finance-handoff-v23",
  "extract-invoice",
  "extract-invoice-v5",
  "run-ocr",
  "run-ocr-v5",
  "create-grn-confirm",
  "confirm-capture-invoice-v5",
  "confirm-extract-invoice-v23",
  "pr-to-rfq",
  "save-po-v6",
  "submit-po-v6",
  "confirm-record-payment-v23",
  "confirm-send-selected-po-v11",
  "save-plan-v5",
  "create-plan-confirm-v5",
  "save-plan-item",
  "save-plan-item-edit-v23",
  "submit-plan",
  "save-contract-v6",
  "activate-contract-v23",
  "terminate-contract-v23",
  "confirm-upload-document-v5",
  "confirm-upload-document-v6",
  "confirm-upload-version-v11",
  "confirm-doc-upload-v23",
  "doc-status-v23",
  "confirm-doc-version-v23",
  "post-journal",
  "run-compliance-reminders-v6",
  "confirm-vendor-status-v23",
  "save-vendor-document-v23",
  "save-vendor-bank-v23",
  "run-reminder-automation-v7",
  "preview-built-report-v5",
  "create-report-template-v5",
  "save-procurement-settings-v23",
  "enqueue-rpa-job-v23",
  "view-ai-usage-v23",
] as const

/**
 * Runtime controls that only open a confirmation, whose own final step is wired. They match
 * the confirm-/save-/submit- family by name but save nothing themselves.
 */
const RUNTIME_OPENERS = new Set<string>(["confirm-bid-winner-v6"])

/**
 * Write actions whose runtime handler only edits the in-browser demo store and toasts success.
 * Until each is connected it is refused with that said plainly, so nobody believes a tender was
 * issued or a receipt recorded when nothing was saved.
 */
export const NOT_YET_LIVE_ACTIONS = [
  "create-tender-confirm",
  "save-tender",
  "approve-invoice",
  "approve-match-v5",
  "create-plan-confirm",
  "save-plan-line-v6",
  "save-and-esign-contract-v6",
  "confirm-asset-transfer",
  "send-invitations",
] as const

/**
 * Terminal steps that only change the runtime's in-browser store and toast success, beyond the
 * confirm-/save-/submit- family. Openers (buttons that only show a form) are not listed: the form
 * is harmless, and its own confirm step is refused.
 */
const UNCONNECTED_TERMINAL_STEPS = new Set<string>([
  ...NOT_YET_LIVE_ACTIONS,
  "approve-access-v5",
  "approve-esign",
  "approve-match-v5",
  "approve-pr",
  "approve-record",
  "delete-document",
  "delete-record",
  "sync-accounting",
  "esign-sign-v6",
  "esign-remind-v6",
  // Found by a static sweep of the runtime's handlers: each edits the in-browser store or
  // announces success, and none has a backend behind it yet.
  "apply-signature-v6",
  "send-esign",
  "send-esign-envelope-v6",
  "esign-decline-v6",
  "esign-reminder-v6",
  "capitalise-asset",
  "duplicate-role-v6",
  "add-sod-rule-v6",
  "run-user-sod-v6",
  "import-idp-groups-v6",
  "toggle-permission",
  "toggle-rbac-v5",
  "toggle-rbac-v6",
  "resolve-vendor-message-v6",
  "send-vendor-doc-request-v6",
  "send-vendor-message-v6",
  "send-vendor-link",
  "create-match-exception-v5",
  "import-plan",
  "scan-delivery",
  "upload-document",
  // A second sweep, of the runtime's switch-case handlers: each toasts a finished outcome, some
  // with invented figures ("OCR confidence 94.2%", "three dormant assignments"), and saves nothing.
  "vendor-save-draft",
  "vendor-submit-bid",
  "flag-invoice",
  "email-po",
  "new-folder",
  "access-review",
  "archive-record",
  "validate-plan-v5",
  // The fixture OCR queue listed files nobody uploaded (invoice_aug_001.pdf, medequip_44019.pdf) and
  // its buttons announced captures that never happened. In a live session "Run OCR" now opens AI
  // Invoice Capture, which reads a real PDF; these two belong to that fixture modal, which no longer opens.
  "capture-ocr-item-v5",
  "process-ocr-ready-v5",
  // Found by the full UI census: the eSign envelope modal is a sample, and opening its tabs crashed
  // the page; the vendor inbox crashed on an empty mailbox (vendor messaging is not connected); the
  // Actuals vs Plan filter announced a recalculation that never ran.
  "signature-queue",
  "open-vendor-inbox-v6",
  "open-vendor-message-v6",
  "apply-plan-actual-filter-v6",
  // Document Vault "Request replacement" announced a controlled request to the document's source;
  // nothing is sent anywhere.
  "request-source-document-v19",
  // Cycle nine audit: "Validate import" announced "12 line items passed" for a CSV nobody read, and the report
  // builder previewed the sample RPT-0104.
  "validate-pr-import",
])

/**
 * True for an action that would record something the backend never receives. In a live session
 * these are refused with that said, rather than letting the runtime report a save that did not happen.
 */
export function isUnconnectedWrite(action: string): boolean {
  if ((LIVE_ACTIONS as readonly string[]).includes(action)) return false
  if (RUNTIME_OPENERS.has(action)) return false
  return /^(confirm|save|submit)-/.test(action) || UNCONNECTED_TERMINAL_STEPS.has(action)
}

/**
 * Buttons that open a form the role could never complete. Refused before the form opens, so nobody
 * fills in a purchase order only to be told at the end that their role cannot raise one.
 * Capture invoice is not listed: its grant is decided by the intake route, and the API says so.
 */
const OPENER_GRANTS: Record<string, { grants: string[]; what: string }> = {
  "create-po-v6": { grants: ["orders.manage"], what: "raising purchase orders" },
  "create-tender": { grants: ["rfq.manage"], what: "creating tenders and RFQs" },
  "record-grn": { grants: ["receiving.manage"], what: "recording goods receipts" },
  "record-payment-v23": { grants: ["invoices.pay"], what: "recording invoice payments" },
  "create-plan-v5": { grants: ["plans.manage"], what: "creating procurement plans" },
  "add-plan-item": { grants: ["plans.manage"], what: "changing procurement plans" },
  "create-contract-v6": { grants: ["contracts.manage"], what: "creating contracts" },
  "upload-document-v5": { grants: ["documents.manage"], what: "filing documents in the vault" },
  "upload-document-v6": { grants: ["documents.manage"], what: "filing documents in the vault" },
  "register-vendor-v6": { grants: ["vendors.manage"], what: "registering vendors" },
  "edit-vendor-v6": { grants: ["vendors.manage"], what: "changing vendor details" },
  // Reading an invoice costs an LLM call and stores an intake, so the grant is checked before the upload.
  "run-ocr-v5": { grants: ["intake.manage"], what: "capturing supplier invoices" },
  "upload-invoice-v5": { grants: ["intake.manage"], what: "capturing supplier invoices" },
}

/**
 * Openers of features with no backend, refused to every role before the form opens. Their final steps
 * were already refused, but the forms themselves showed the vendored sample people and addresses
 * (signer "Tendai Moyo · CEO", delegates "Tinashe Chaka · CFO", recipient approver@matanho.co.zw), and
 * the vendor form preview offered "Submit to Matanho" to staff. Found by the cycle seven census.
 */
const NOT_BUILT_OPENERS: Record<string, string> = {
  "esign-new-v6": "eSignature is not connected yet, so no envelope can be sent from here.",
  "send-approval-doc-v13": "Sending documents by email is not connected yet. Download the PDF and send it from your mail.",
  // Vault and preview "Send": prefilled procurement.approver@matanho.africa and toasted "Document sent".
  "send-doc-v11": "Sending documents by email is not connected yet. Download the PDF and send it from your mail.",
  "send-document": "Sending documents by email is not connected yet. Download the PDF and send it from your mail.",
  // Related record offered the sample TN-2026-014, PO-2026-0584 and CTR-2026-081.
  "message-vendor-v6": "Vendor messaging is not connected yet. Contact the vendor from your mail for now.",
  // Its Send request was refused, and the form proposed a due date already past (5 Aug 2026).
  "request-vendor-docs-v6": "Requesting documents from vendors is not connected yet. Ask the vendor by mail, then file what they send in the Document Vault.",
  // The profile's "Send compliance reminder" opens the same document request.
  "send-vendor-reminder-v6": "Use Run compliance reminders on the Vendor Registry to email tax-clearance expiry alerts.",
  // Found by the cycle nine audit of every control the census met that actions.ts did not name: each opens a form
  // whose only save is refused (so the sweep left a form with nothing to press), or shows sample content.
  "import-pr": "Importing requisition lines from CSV is not available. Add the lines on the requisition form.",
  "add-note": "Internal notes are not recorded. Use the requisition's justification or the approval comment.",
  "schedule-report-v5": "Report schedules are not stored. Run a report template when you need it.",
  "import-quotations-v5": "Quotations arrive from the vendor portal, from the link in the RFQ; they are not imported here.",
  "upload-record-file-v5": "Attach documents to a record from the Document Vault.",
  "invite-vendors": "Vendors are invited when the RFQ is created and sent, from the tender builder.",
  "vendor-bid-preview": "Vendors fill in their quotation on the vendor portal, from the link in their RFQ.",
  "view-history": "A record's history is in Audit & Compliance.",
  "create-template-v5": "Document templates are not editable here; purchase orders use the organisation's letterhead.",
  "edit-document": "Document templates are not editable here; purchase orders use the organisation's letterhead.",
  "edit-doc-v11": "Controlled documents are not edited here. Upload a new version from the Document Vault.",
  "edit-approval-doc-v13": "Approval documents are generated from the record and are not edited here.",
  "upload-version": "Upload a new version from the Document Vault.",
  // Previewed a sample tender pack (pass mark, committee, email subject, "edit and send it from the Document Vault")
  // built from fields the RFQ does not store.
  "preview-tender-v13": "The RFQ is sent from the form. Vendors see its lines and closing date in their quotation form.",
}

/**
 * True for a control a live session does not offer at all: an opener for something not built, or a step that would save
 * nothing. The bridge removes these from pages, modals and drawers as they render (window.__pr23IsUnconnected), so no
 * control answers "not connected" after the click. A role's missing permission is not this: those still explain.
 */
export function hasNoBackend(action: string): boolean {
  return Boolean(NOT_BUILT_OPENERS[action]) || isUnconnectedWrite(action)
}

/** The refusal to show for an opener the signed-in role cannot complete, or null to let it open. */
export function refusedOpener(action: string, live: ProcurementV23LivePayload | null): string | null {
  if (NOT_BUILT_OPENERS[action]) return NOT_BUILT_OPENERS[action]
  const rule = OPENER_GRANTS[action]
  const access = live?.access
  if (!rule || !access || access.isPrivileged) return null
  const perms = new Set(access.permissions ?? [])
  return rule.grants.some((g) => perms.has(`procurement.${g}`)) ? null : `Your role does not have permission for ${rule.what}.`
}

function val(selector: string): string {
  const el = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)
  return (el?.value ?? "").trim()
}

/** Close the runtime's open modal through its own control; the runtime owns that DOM. */
function closeRuntimeOverlay() {
  document
    .querySelector<HTMLElement>('[data-action="close-overlay"], [data-action="close-modal-v6"]')
    ?.click()
}

function errorText(err: unknown, fallback: string): string {
  const body = readProcurementError(err)
  if (body.status === 403) return body.message || "Your role does not have the procurement permission this action needs."
  return body.message || fallback
}

const refuse = (what: string): ProcurementActionResult => ({
  handled: true,
  error: `Your role does not have permission for ${what}.`,
})

/** "a, b, c" -> ["a","b","c"]; empty -> undefined. */
function commaList(text: string): string[] | undefined {
  const list = String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
  return list.length ? list : undefined
}

export async function handleProcurementV23Action(
  detail: ProcurementActionDetail,
  ctx: { live: ProcurementV23LivePayload | null },
): Promise<ProcurementActionResult> {
  const action = detail.action
  const live = ctx.live
  const perms = new Set(live?.permissions ?? [])
  const has = (p: string) => perms.has(`procurement.${p}`)
  const rows = (key: string) => ((live?.hydrate?.[key] as any[]) ?? [])
  const byDisplayId = (key: string, id?: string) => rows(key).find((r) => r.id === id || r.recordId === id)

  if (isUnconnectedWrite(action)) {
    return {
      handled: true,
      error: "This step is not connected to the backend yet, so nothing was saved.",
    }
  }

  if (!live) {
    return { handled: true, error: "Procurement data is still loading. Try again in a moment." }
  }

  try {
    switch (action) {
      // -------------------------------------------------------------- requisitions
      case "save-pr":
      case "submit-pr": {
        const form = document.querySelector<HTMLFormElement>("#prForm")
        if (form && !form.reportValidity()) return { handled: true }
        // An admin has no department of their own but can still raise a requisition, against
        // whichever department they choose on the form (__pr23RequisitionDepartmentField).
        const department = live.access?.department || (live.access?.isPrivileged ? val('#prForm [name="cost"]') : "")
        if (!department) {
          return {
            handled: true,
            error: "Your account is not assigned to a department, and a requisition is raised against one. Ask an administrator to set your department.",
          }
        }
        const title = val('#prForm [name="title"]')
        const lines = requisitionLines("#prForm")
        const missing: string[] = []
        if (!title) missing.push("requirement title")
        if (!lines.length || lines.some((l) => !l.itemName)) missing.push(lines.length > 1 ? "an item on every line" : "line item")
        if (lines.some((l) => !(l.quantity > 0))) missing.push("a quantity above zero on every line")
        if (missing.length) return { handled: true, error: `Cannot raise the requisition — missing ${missing.join(", ")}.` }

        const created = await createRequisition({
          title,
          department,
          priority: "MEDIUM",
          justification: val('#prForm [name="motivation"]') || undefined,
          sourcingCategory: val('#prForm [name="category"]') || undefined,
          projectId: val('#prForm [name="project"]') || undefined,
          ...requisitionHeader("#prForm", false),
          items: lines,
        })
        const number = created?.requisitionNumber ?? "The requisition"
        const files = pickedFiles("#prForm")
        if (files.length) {
          try {
            await uploadRequisitionAttachments(created.id, files)
          } catch (err) {
            closeRuntimeOverlay()
            return { handled: true, reload: true, error: `${number} was saved as a draft, but its attachments were not uploaded: ${errorText(err, "the upload failed")}. Open it and attach them again.` }
          }
        }
        if (action === "save-pr") {
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${number} saved as a draft.` }
        }
        let submitted: Record<string, any>
        try {
          submitted = await submitRequisition(created.id)
        } catch (err) {
          // The requisition exists as a draft by now; say so, or the requester raises it a second time.
          closeRuntimeOverlay()
          return { handled: true, reload: true, error: `${number} was saved as a draft but not submitted: ${errorText(err, "the submission failed")}` }
        }
        closeRuntimeOverlay()
        const next = routeNext(submitted)
        return {
          handled: true,
          reload: true,
          message: next ? `${number} submitted for approval: ${next}.` : `${number} submitted for approval.`,
        }
      }

      case "save-pr-v11":
      case "submit-pr-v11": {
        // The requester corrects their own draft, rejected or returned requisition, then saves it or submits it.
        const r = byDisplayId("requisitions", detail.dataset.id)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        const raw = String(r.rawStatus ?? "").toUpperCase()
        if (raw !== "DRAFT" && raw !== "REJECTED" && raw !== "RETURNED") {
          return { handled: true, error: `${r.id} is ${String(r.status).toLowerCase()} and can no longer be changed by its requester.` }
        }
        const form = document.querySelector<HTMLFormElement>("#editPrFormV11")
        if (form && !form.reportValidity()) return { handled: true }
        const title = val('#editPrFormV11 [name="title"]')
        if (!title) return { handled: true, error: "A requirement title is required." }
        const lines = requisitionLines("#editPrFormV11").filter((l) => l.itemName || l.quantity)
        const hasLines = Boolean(document.querySelector("#editPrFormV11 [data-pr-line]"))
        if (hasLines && (!lines.length || lines.some((l) => !l.itemName || !(l.quantity > 0)))) {
          return { handled: true, error: "Every line needs an item and a quantity above zero." }
        }
        await updateRequisition(r.recordId, {
          title,
          justification: val('#editPrFormV11 [name="justification"]') || null,
          ...(document.querySelector('#editPrFormV11 [name="project"]') ? { projectId: val('#editPrFormV11 [name="project"]') || null } : {}),
          ...requisitionHeader("#editPrFormV11", true),
          ...(hasLines ? { items: lines } : {}),
        })
        const picked = pickedFiles("#editPrFormV11")
        if (picked.length) await uploadRequisitionAttachments(r.recordId, picked)
        if (action === "save-pr-v11") {
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${r.id} saved.` }
        }
        const submitted = await submitRequisition(r.recordId)
        closeRuntimeOverlay()
        const next = routeNext(submitted)
        const verb = raw === "DRAFT" ? "submitted" : raw === "RETURNED" ? "amended and resubmitted" : "corrected and resubmitted"
        const warnings = Array.isArray(submitted?.gateWarnings) && submitted.gateWarnings.length ? ` Note: ${submitted.gateWarnings.join(" ")}` : ""
        return {
          handled: true,
          reload: true,
          message: `${next ? `${r.id} ${verb} for approval: ${next}.` : `${r.id} ${verb} for approval.`}${warnings}`,
        }
      }

      case "approve-pr-v11": {
        const r = byDisplayId("requisitions", detail.dataset.id)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        const decided = await approveRequisition(r.recordId)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: approvedMessage(r.id, decided) }
      }

      case "confirm-reject-pr-v11": {
        const r = byDisplayId("requisitions", detail.dataset.id)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        const form = document.querySelector<HTMLFormElement>("#rejectPrFormV11")
        if (form && !form.reportValidity()) return { handled: true }
        return await decideRequisition(r.recordId, String(r.id), val('#rejectPrFormV11 [name="decision"]'), val('#rejectPrFormV11 [name="reason"]'))
      }

      // ----------------------------------------------------------- approval matrix
      case "save-approval-matrix-v23": {
        if (!live.access?.isPrivileged) {
          return { handled: true, error: "Only an administrator or the Chief Financial Officer can change the approval matrix." }
        }
        const stepRows = [...document.querySelectorAll<HTMLElement>("#approvalMatrixFormV23 [data-matrix-step]")]
        if (!stepRows.length) return { handled: true, error: "The route needs at least one step." }
        const steps = stepRows.map((row) => {
          const field = (n: string) =>
            ((row.querySelector(`[name="${n}"]`) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "").trim()
          const kind = field("kind") as "DEPARTMENT_HEAD" | "ROLE" | "USER"
          const above = field("aboveAmount")
          const minLevel = field("minApprovalLevel")
          const multi = (n: string) => [...(row.querySelectorAll<HTMLOptionElement>(`[name="${n}"] option:checked`) ?? [])].map((o) => o.value)
          const list = (n: string) =>
            field(n)
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          const amt = (n: string) => (field(n) === "" ? null : Number(field(n)))
          return {
            canDelegate: Boolean(row.querySelector<HTMLInputElement>('[name="canDelegate"]')?.checked),
            matchRules: {
              departments: multi("ruleDepartments"),
              methods: multi("ruleMethods"),
              riskLevels: multi("ruleRiskLevels"),
              exceptionTypes: multi("ruleExceptionTypes"),
              businessUnits: list("ruleBusinessUnits"),
              costCentres: list("ruleCostCentres"),
              categories: list("ruleCategories"),
              branches: list("ruleBranches"),
              amountMin: amt("ruleAmountMin"),
              amountMax: amt("ruleAmountMax"),
            },
            kind,
            department: kind === "DEPARTMENT_HEAD" ? field("department") || null : null,
            deputy: kind === "DEPARTMENT_HEAD" && field("deputy") === "DEPUTY",
            roleCode: kind === "ROLE" ? field("roleCode") || null : null,
            userId: kind === "USER" ? field("userId") || null : null,
            aboveAmount: above === "" ? null : Number(above),
            minApprovalLevel: minLevel === "" ? null : Number(minLevel),
          }
        })
        const stage = document.querySelector<HTMLElement>("#approvalMatrixFormV23")?.dataset.stage || undefined
        await saveApprovalMatrix(steps, stage)
        closeRuntimeOverlay()
        return {
          handled: true,
          reload: true,
          message: stage
            ? `Award route saved with ${steps.length} step${steps.length === 1 ? "" : "s"}. It applies to recommendations submitted from now on.`
            : `Approval route saved with ${steps.length} step${steps.length === 1 ? "" : "s"}. It applies to requisitions submitted from now on.`,
        }
      }

      case "remove-pr-attachment-v23": {
        const recordId = String(detail.dataset.id ?? "")
        const attachmentId = String(detail.dataset.attachment ?? "")
        if (!recordId || !attachmentId) return { handled: true, error: "Open the requisition again; that attachment was not found." }
        await removeRequisitionAttachment(recordId, attachmentId)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Attachment removed." }
      }

      case "confirm-delegate-pr-v23": {
        const recordId = String(detail.dataset.id ?? "")
        const r = rows("requisitions").find((x) => x.recordId === recordId)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        const form = document.querySelector<HTMLFormElement>("#delegateRequisitionFormV23")
        if (form && !form.reportValidity()) return { handled: true }
        const delegatedToId = val('#delegateRequisitionFormV23 [name="delegate"]')
        if (!delegatedToId) return { handled: true, error: "Choose who to delegate to." }
        const reason = val('#delegateRequisitionFormV23 [name="reason"]')
        const after = await delegateRequisitionApproval(recordId, delegatedToId, reason)
        closeRuntimeOverlay()
        const next = routeNext(after)
        return { handled: true, reload: true, message: `${r.id} delegated${next ? `: it now waits for ${next}` : ""}.` }
      }

      case "save-requisition-policy-v23": {
        if (!live.access?.isPrivileged) return { handled: true, error: "Only an administrator or the Chief Financial Officer can change the requisition policy." }
        const f = (n: string) => val(`#requisitionPolicyFormV23 [name="${n}"]`)
        const saved = await saveRequisitionPolicy({
          prNumberFormat: f("prNumberFormat"),
          budgetCheckMode: f("budgetCheckMode"),
          planLinkPolicy: f("planLinkPolicy"),
          suggestedVendorPolicy: f("suggestedVendorPolicy"),
        })
        return { handled: true, reload: true, message: `Requisition policy saved. Numbers now follow ${saved.prNumberFormat}.` }
      }

      case "save-budget-v23": {
        if (!live.access?.isPrivileged) return { handled: true, error: "Only an administrator or the Chief Financial Officer can change budgets." }
        const form = document.querySelector<HTMLFormElement>("#budgetFormV23")
        if (form && !form.reportValidity()) return { handled: true }
        const f = (n: string) => val(`#budgetFormV23 [name="${n}"]`)
        const id = f("id")
        await saveProcurementBudget(
          {
            financialYear: f("financialYear"),
            budgetCode: f("budgetCode"),
            costCentre: f("costCentre"),
            description: f("description") || undefined,
            amount: Number(f("amount")),
            currencyCode: f("currencyCode") || undefined,
            status: f("status") || "ACTIVE",
          },
          id || undefined,
        )
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: id ? "Budget updated." : "Budget added." }
      }

      case "save-invoice-auto-approval-v23": {
        if (!live.access?.isPrivileged) {
          return { handled: true, error: "Only an administrator or the Chief Financial Officer can change automatic invoice approval." }
        }
        const enabled = Boolean(document.querySelector<HTMLInputElement>('#invoiceAutoApprovalFormV23 [name="enabled"]')?.checked)
        const limitText = val('#invoiceAutoApprovalFormV23 [name="limit"]')
        const saved = await saveInvoiceAutoApproval({ enabled, limit: limitText === "" ? null : Number(limitText) })
        const limit = saved.limit != null ? ` up to $${saved.limit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""
        return {
          handled: true,
          reload: true,
          message: saved.enabled
            ? `Invoices that match exactly are now approved automatically${limit}.`
            : "Automatic approval is off: every invoice waits for a person to approve it.",
        }
      }

      // ----------------------------------------------------------- approval centre
      case "approve-prompt-v6": {
        const p = rows("approvalPromptsV6").find((x) => x.id === detail.dataset.id)
        if (!p) return { handled: true, error: "That approval is no longer pending. Refresh and try again." }
        switch (p.kind) {
          case "requisition": {
            const decided = await approveRequisition(p.targetId)
            closeRuntimeOverlay()
            return { handled: true, reload: true, message: approvedMessage(String(p.record ?? p.id), decided) }
          }
          case "recommendation":
            await decideAwardRecommendation(p.targetId, "APPROVE", val("#approvalCommentV6") || undefined)
            break
          case "po-approval":
            await decidePoApproval(p.targetId, "APPROVE", val("#approvalCommentV6") || undefined)
            break
          case "award":
            if (!has("rfq.award")) return refuse("awarding quotations")
            await acceptQuotation(p.targetId, val("#approvalCommentV6") || undefined)
            break
          case "grn":
            if (!has("receiving.approve")) return refuse("approving goods receipts")
            await approveGoodsReceivedNote(p.targetId, val("#approvalCommentV6") || undefined)
            break
          case "invoice":
            if (!has("invoices.approve")) return refuse("approving invoices")
            try {
              await approveProcurementInvoice(p.targetId, true)
            } catch (e) {
              // Open match exceptions: someone with the override grant may approve over them, with a written reason.
              if (errorCode(e) === "MATCH_EXCEPTIONS" && has("invoices.override_match")) {
                closeRuntimeOverlay()
                ;(window as unknown as { __pr23OverrideModal?: (id: string, m: string) => void }).__pr23OverrideModal?.(p.targetId, (e as Error).message)
                return { handled: true }
              }
              throw e
            }
            break
          case "plan":
            if (!has("plans.approve")) return refuse("approving procurement plans")
            await decideProcurementPlan(p.targetId, "approve")
            break
          default:
            return { handled: true, error: "This approval type is not connected to the backend yet." }
        }
        closeRuntimeOverlay()
        const done: Record<string, string> = {
          requisition: `${p.record} approved.`,
          recommendation: `Your approval of the ${p.record} award recommendation is recorded.`,
          "po-approval": `Your approval of ${p.record} is recorded.`,
          award: `${p.record} awarded; the purchase order has been raised.`,
          grn: `${p.record} accepted on inspection.`,
          invoice: `${p.record} approved for payment.`,
          plan: `${p.record} approved as the plan baseline.`,
        }
        return { handled: true, reload: true, message: done[p.kind] }
      }

      case "confirm-reject-approval-v6": {
        const p = rows("approvalPromptsV6").find((x) => x.id === detail.dataset.id)
        if (!p) return { handled: true, error: "That approval is no longer pending. Refresh and try again." }
        const form = document.querySelector<HTMLFormElement>("#rejectApprovalFormV6")
        if (form && !form.reportValidity()) return { handled: true }
        const decision = val('#rejectApprovalFormV6 [name="decision"]')
        const reason = val('#rejectApprovalFormV6 [name="reason"]')
        if (!reason) return { handled: true, error: "A reason is required." }
        if (p.kind === "requisition") return await decideRequisition(p.targetId, String(p.record ?? p.id), decision, reason)
        const withDecision = decision && decision !== "reject" ? `${decision}: ${reason}` : reason
        switch (p.kind) {
          case "recommendation":
            await decideAwardRecommendation(p.targetId, "REJECT", reason)
            break
          case "po-approval":
            await decidePoApproval(p.targetId, "REJECT", reason)
            break
          case "award":
            if (!has("quotations.manage")) return refuse("rejecting quotations")
            await rejectQuotation(p.targetId, withDecision)
            break
          case "grn":
            if (!has("receiving.approve")) return refuse("rejecting goods receipts")
            await rejectGoodsReceivedNote(p.targetId, withDecision)
            break
          case "invoice":
            if (!has("invoices.approve")) return refuse("rejecting invoices")
            await rejectProcurementInvoice(p.targetId, withDecision)
            break
          case "plan":
            if (!has("plans.approve")) return refuse("rejecting procurement plans")
            await decideProcurementPlan(p.targetId, "reject", withDecision)
            break
          default:
            return { handled: true, error: "This approval type is not connected to the backend yet." }
        }
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${p.record} rejected with your reason.` }
      }

      // ------------------------------------------------------------------ vendors
      case "register-vendor-confirm":
      case "register-vendor-confirm-v6": {
        // The V6 register button opens #vendorFormV6; older layers used #vendorRegisterFormV6, and
        // the base page #vendorForm. Read whichever is on screen, as the runtime's own handler does.
        const formId =
          action === "register-vendor-confirm-v6"
            ? document.querySelector("#vendorFormV6")
              ? "#vendorFormV6"
              : "#vendorRegisterFormV6"
            : "#vendorForm"
        const form = document.querySelector<HTMLFormElement>(formId)
        if (form && !form.reportValidity()) return { handled: true }
        const name = val(`${formId} [name="name"]`) || val(`${formId} [name="legalName"]`)
        if (!name) return { handled: true, error: "Cannot register the vendor — the legal name is required." }
        const created = await createVendor({
          name,
          category: val(`${formId} [name="category"]`) || undefined,
          bpNumber: val(`${formId} [name="bp"]`) || undefined,
          vatNumber: val(`${formId} [name="vat"]`) || undefined,
          taxNumber: val(`${formId} [name="tin"]`) || undefined,
          registrationNumber: val(`${formId} [name="registrationNumber"]`) || undefined,
          commodityCategories: commaList(val(`${formId} [name="commodities"]`)),
          notes: val(`${formId} [name="notes"]`) || undefined,
          settlementCurrencyCode: val(`${formId} [name="currency"]`) || undefined,
          contactPerson: val(`${formId} [name="contact"]`) || undefined,
          email: val(`${formId} [name="email"]`) || undefined,
          phone: val(`${formId} [name="phone"]`) || undefined,
          address: val(`${formId} [name="address"]`) || undefined,
          paymentTerms: val(`${formId} [name="paymentTerms"]`) || undefined,
          taxClearanceExpiryDate: val(`${formId} [name="taxExpiry"]`) || val(`${formId} [name="itf"]`) || undefined,
          country: val(`${formId} [name="country"]`) || undefined,
          tradingName: val(`${formId} [name="tradingName"]`) || val(`${formId} [name="trading"]`) || undefined,
          riskRating: val(`${formId} [name="risk"]`) || val(`${formId} [name="riskRating"]`) || undefined,
        })
        closeRuntimeOverlay()
        // Bank details are held back on purpose: they are owned by finance
        // (procurement.vendors.banks.manage) and are the field a payment-redirection fraud changes.
        const bankTyped = val(`${formId} [name="accountNumber"]`) || val(`${formId} [name="bank"]`)
        const cleared = String(created?.taxComplianceStatus ?? "").toUpperCase() === "ACTIVE"
        return {
          handled: true,
          reload: true,
          message: `${created?.vendorCode ? `${created.vendorCode} ` : ""}${created?.name ?? name} registered as a Draft${cleared ? " with a valid tax clearance" : ""}. Submit it for review, then have someone else approve it, before it can be used.${bankTyped ? " Bank details were not saved here; Finance records them." : ""}`,
        }
      }

      case "approve-vendor-registration-v23": {
        // A vendor that registered itself on the vendor portal (Vendor Registry, self-registrations awaiting review).
        if (!has("vendors.approve")) return refuse("approving vendor registrations")
        const reg = rows("vendorRegistrationsV23").find((x) => x.id === detail.dataset.id)
        if (!reg) return { handled: true, error: "That registration is no longer awaiting review. Refresh and try again." }
        await approveVendorRegistration(String(reg.id))
        return { handled: true, reload: true, message: `${reg.name} is approved: an active vendor that can be invited to RFQs, and emailed to say so.` }
      }

      case "confirm-decline-vendor-registration-v23": {
        if (!has("vendors.approve")) return refuse("declining vendor registrations")
        const F = "#declineVendorRegistrationFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        const reg = rows("vendorRegistrationsV23").find((x) => x.id === val(`${F} [name="vendorId"]`))
        if (!reg) return { handled: true, error: "That registration is no longer awaiting review. Refresh and try again." }
        const reason = val(`${F} [name="reason"]`)
        if (!reason) return { handled: true, error: "Say why the registration is declined; the vendor is told." }
        await declineVendorRegistration(String(reg.id), reason)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${reg.name}: registration declined, and the vendor emailed the reason.` }
      }

      case "save-vendor-profile-v23": {
        // The live Edit profile form (bridge __pr23VendorEditModal): only the fields the vendor record keeps.
        if (!has("vendors.manage")) return refuse("changing vendor details")
        const F = "#vendorEditFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        const v = byDisplayId("vendors", val(`${F} [name="vendorId"]`))
        if (!v) return { handled: true, error: "That vendor is no longer in the registry. Refresh and try again." }
        const name = val(`${F} [name="name"]`)
        if (!name) return { handled: true, error: "The vendor's legal name is required." }
        const taxExpiry = val(`${F} [name="taxExpiry"]`)
        const updated = await updateVendor(String(v.recordId), {
          name,
          // The API normalises it (Office Supplies -> OFFICE_SUPPLIES), the form RFQs match invitations on.
          category: val(`${F} [name="category"]`) || undefined,
          contactPerson: val(`${F} [name="contact"]`),
          email: val(`${F} [name="email"]`),
          phone: val(`${F} [name="phone"]`),
          address: val(`${F} [name="address"]`),
          paymentTerms: val(`${F} [name="paymentTerms"]`),
          country: val(`${F} [name="country"]`) || null,
          tradingName: val(`${F} [name="tradingName"]`) || null,
          riskRating: val(`${F} [name="risk"]`) || null,
          registrationNumber: val(`${F} [name="registrationNumber"]`) || null,
          taxNumber: val(`${F} [name="tin"]`) || undefined,
          vatNumber: val(`${F} [name="vat"]`) || null,
          commodityCategories: commaList(val(`${F} [name="commodities"]`)) ?? [],
          notes: val(`${F} [name="notes"]`) || null,
          settlementCurrencyCode: val(`${F} [name="currency"]`) || null,
          // A cleared date is left as it was: the tax clearance is replaced, not removed, from here.
          ...(taxExpiry ? { taxClearanceExpiryDate: taxExpiry } : {}),
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${updated?.name ?? name} updated.` }
      }

      case "confirm-vendor-status-v23": {
        // The status move from the vendor's profile: permission per move, reason where required, audited by the API.
        const F = "#vendorStatusFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        const v = byDisplayId("vendors", val(`${F} [name="vendorId"]`))
        if (!v) return { handled: true, error: "That vendor is no longer in the registry. Refresh and try again." }
        const to = val(`${F} [name="to"]`)
        const moved = await changeVendorStatus(String(v.recordId), to, val(`${F} [name="reason"]`) || undefined)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${v.name} is now ${String((moved as any)?.lifecycleStatus ?? to).replace(/_/g, " ").toLowerCase()}.` }
      }

      case "save-vendor-document-v23": {
        if (!has("vendors.manage")) return refuse("managing vendor documents")
        const F = "#vendorDocFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        const v = byDisplayId("vendors", val(`${F} [name="vendorId"]`))
        if (!v) return { handled: true, error: "That vendor is no longer in the registry. Refresh and try again." }
        const docId = val(`${F} [name="docId"]`)
        const notify = val(`${F} [name="notify"]`)
        const dates = {
          expiryDate: val(`${F} [name="expiryDate"]`) || null,
          issueDate: val(`${F} [name="issueDate"]`) || null,
          documentNumber: val(`${F} [name="number"]`) || null,
          notifyDaysBefore: notify === "" ? null : Number(notify),
        }
        if (docId) {
          await updateVendorDocument(docId, dates)
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${v.name}: document expiry and alert saved.` }
        }
        const file = document.querySelector<HTMLInputElement>(`${F} [name="file"]`)?.files?.[0]
        if (!file) return { handled: true, error: "Choose the document file to upload." }
        await uploadVendorDocument(String(v.recordId), file, {
          documentType: val(`${F} [name="documentType"]`),
          expiryDate: dates.expiryDate || undefined,
          issueDate: dates.issueDate || undefined,
          documentNumber: dates.documentNumber || undefined,
          notifyDaysBefore: notify || undefined,
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `Document uploaded for ${v.name}.` }
      }

      case "save-vendor-bank-v23": {
        // Bank details are Finance's: procurement.vendors.banks.manage (the API enforces it as well).
        if (!has("vendors.banks.manage") && !live.access?.isPrivileged) return refuse("recording vendor bank details")
        const F = "#vendorBankFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        const v = byDisplayId("vendors", val(`${F} [name="vendorId"]`))
        if (!v) return { handled: true, error: "That vendor is no longer in the registry. Refresh and try again." }
        await createVendorBank(String(v.recordId), {
          bankName: val(`${F} [name="bankName"]`),
          accountName: val(`${F} [name="accountName"]`),
          accountNumber: val(`${F} [name="accountNumber"]`),
          branchCode: val(`${F} [name="branchCode"]`),
          swiftCode: val(`${F} [name="swiftCode"]`),
          iban: val(`${F} [name="iban"]`) || undefined,
          currencyCode: val(`${F} [name="currencyCode"]`),
          isPrimary: Boolean(document.querySelector<HTMLInputElement>(`${F} [name="isPrimary"]`)?.checked),
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `Bank account recorded for ${v.name}.` }
      }

      case "delete-vendor-v23": {
        if (!has("vendors.manage")) return refuse("removing vendors")
        const v = byDisplayId("vendors", detail.dataset.id)
        if (!v) return { handled: true, error: "That vendor is no longer in the registry. Refresh and try again." }
        if (!window.confirm(`Remove ${v.name} from the vendor registry?\n\nA vendor with orders, invoices or quotations is made Inactive and kept on record; only a vendor with no history is deleted.`)) return { handled: true }
        const removed = await deleteVendor(String(v.recordId))
        return {
          handled: true,
          reload: true,
          message: removed.message || `${v.name} removed from the vendor registry.`,
        }
      }

      // ---------------------------------------------------------- purchase orders
      case "send-po-v6": {
        const o = byDisplayId("orders", detail.dataset.id)
        if (!o) return { handled: true, error: "That purchase order is no longer in your register. Refresh and try again." }
        if (!has("orders.send")) return refuse("sending purchase orders")
        const raw = String(o.rawStatus ?? "").toUpperCase()
        if (raw !== "DRAFT" && raw !== "APPROVED") {
          return { handled: true, error: `${o.id} has already been dispatched (${o.status}). Nothing was sent again.` }
        }
        await sendPurchaseOrder(o.recordId)
        return { handled: true, reload: true, message: `${o.id} sent to ${o.vendor}.` }
      }

      case "confirm-send-selected-po-v11": {
        if (!has("orders.send")) return refuse("sending purchase orders")
        // The runtime lists the selection in the confirmation it opened.
        const ids = [...document.querySelectorAll<HTMLElement>(".selected-po-list-v11 span")]
          .map((e) => (e.textContent ?? "").trim())
          .filter(Boolean)
        if (!ids.length) return { handled: true, error: "Select one or more purchase orders first." }
        const sent: string[] = []
        const skipped: string[] = []
        const failed: string[] = []
        for (const id of ids) {
          const o = byDisplayId("orders", id)
          const raw = String(o?.rawStatus ?? "").toUpperCase()
          if (!o || (raw !== "DRAFT" && raw !== "APPROVED")) {
            skipped.push(o ? `${id} (${o.status})` : id)
            continue
          }
          try {
            await sendPurchaseOrder(o.recordId)
            sent.push(id)
          } catch (err) {
            failed.push(`${id}: ${errorText(err, "not sent")}`)
          }
        }
        closeRuntimeOverlay()
        const summary = [
          sent.length ? `Sent ${sent.join(", ")}.` : "",
          skipped.length ? `Already dispatched, not sent again: ${skipped.join(", ")}.` : "",
          failed.length ? `Not sent: ${failed.join("; ")}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
        return sent.length ? { handled: true, reload: true, message: summary } : { handled: true, reload: true, error: summary }
      }

      // ---------------------------------------------------------- direct purchase order
      case "save-po-v6":
      case "submit-po-v6": {
        if (!has("orders.manage")) return refuse("raising purchase orders")
        const form = document.querySelector<HTMLFormElement>("#poFormV23")
        if (!form) return { handled: true, error: "Open Create PO again; the purchase order form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const requisitionId = val('#poFormV23 [name="requisition"]')
        const vendorId = val('#poFormV23 [name="vendor"]')
        const vendor = rows("vendors").find((v) => v.recordId === vendorId)
        const source = rows("requisitions").find((r) => r.recordId === requisitionId)
        const items = [...form.querySelectorAll<HTMLTableRowElement>("[data-po-line]")]
          .map((row) => ({
            itemName: (row.querySelector<HTMLInputElement>("[data-po-name]")?.value ?? "").trim(),
            unit: (row.querySelector<HTMLInputElement>("[data-po-unit]")?.value ?? "").trim() || undefined,
            quantity: Number(row.querySelector<HTMLInputElement>("[data-po-qty]")?.value || 0),
            unitPrice: Number(row.querySelector<HTMLInputElement>("[data-po-price]")?.value || 0),
          }))
          .filter((l) => l.itemName)
        if (!source) return { handled: true, error: "Select the approved requisition this order is raised from." }
        if (!vendor) return { handled: true, error: "Select the vendor." }
        if (!items.length) return { handled: true, error: "The order needs at least one line." }
        if (items.some((l) => !(l.quantity > 0) || !(l.unitPrice > 0))) {
          return { handled: true, error: "Every line needs a quantity and a unit price above zero." }
        }
        // A PO is sent by email; refuse before creating anything rather than leave a draft behind an error.
        if (action === "submit-po-v6" && !String(vendor.email ?? "").includes("@")) {
          return {
            handled: true,
            error: `${vendor.name} has no email address on file, so the order cannot be sent. Save it as a draft, or add the vendor's email in Vendor Registry first.`,
          }
        }
        const delivery = val('#poFormV23 [name="delivery"]')
        const po = await createPurchaseOrder({
          requisitionId,
          vendorId,
          expectedDeliveryDate: delivery ? new Date(delivery).toISOString() : undefined,
          paymentTerms: val('#poFormV23 [name="paymentTerms"]') || undefined,
          shippingAddress: val('#poFormV23 [name="shippingAddress"]') || undefined,
          costCentre: val('#poFormV23 [name="costCentre"]') || undefined,
          budgetCode: val('#poFormV23 [name="budgetCode"]') || undefined,
          glCode: val('#poFormV23 [name="glCode"]') || undefined,
          purchaseConditions: val('#poFormV23 [name="purchaseConditions"]') || undefined,
          items,
        })
        const number = po?.poNumber ?? "The purchase order"
        closeRuntimeOverlay()
        if (action === "save-po-v6") {
          return { handled: true, reload: true, message: `${number} saved as a draft for ${vendor.name}, from ${source.id}. Send it from the register when it is ready.` }
        }
        if (!has("orders.send")) {
          return { handled: true, reload: true, message: `${number} saved as a draft. Your role cannot send purchase orders, so the procurement desk sends it.` }
        }
        await sendPurchaseOrder(po.id)
        return { handled: true, reload: true, message: `${number} raised from ${source.id} and sent to ${vendor.name}.` }
      }

      // ------------------------------------------------------------ tender builder
      case "pr-to-rfq": {
        // The runtime toasted "RFQ draft created" and created nothing. Open the real tender
        // builder instead, whose sources are the approved requisitions awaiting sourcing.
        if (!has("rfq.manage")) return refuse("raising RFQs")
        closeRuntimeOverlay()
        const ui = (window as unknown as { MatanhoProcurementUI?: { createTender?: () => void } }).MatanhoProcurementUI
        requestAnimationFrame(() => ui?.createTender?.())
        return { handled: true }
      }

      case "save-tender-v13":
      case "create-send-tender-v13":
      case "create-send-tender-from-preview-v13": {
        const saveAsDraft = action === "save-tender-v13"
        if (!has("rfq.manage")) return refuse(saveAsDraft ? "saving RFQs" : "sending RFQs")
        const form = document.querySelector<HTMLFormElement>("#tenderFormV13")
        if (!form) {
          return { handled: true, error: "Go back to the form to send the RFQ; the preview does not carry the vendor selection." }
        }
        if (!form.reportValidity()) return { handled: true }
        const fd = new FormData(form)
        const requisitionId = String(fd.get("source") ?? "")
        const title = String(fd.get("title") ?? "").trim()
        const weights = ["technicalWeight", "commercialWeight", "deliveryWeight", "riskWeight"].map((k) => Number(fd.get(k) || 0))
        const weightTotal = weights.reduce((a, b) => a + b, 0)
        if (weightTotal !== 100) return { handled: true, error: `Evaluation weights must total 100% (currently ${weightTotal}%).` }
        // In "all eligible" mode the runtime ticks every visible eligible vendor, so checked is the recipient list either way.
        const vendorIds = [...form.querySelectorAll<HTMLInputElement>('input[name="vendors"]:checked')].map((x) => x.value).filter(Boolean)
        const lines = [...form.querySelectorAll<HTMLTableRowElement>("#rfxLinesV13 tr")]
          .map((row) => ({
            itemName: (row.querySelector<HTMLInputElement>('[name="lineDescription"]')?.value ?? "").trim(),
            description: (row.querySelector<HTMLInputElement>('[name="lineSpec"]')?.value ?? "").trim() || undefined,
            unit: row.querySelector<HTMLSelectElement>('[name="lineUom"]')?.value || undefined,
            quantity: Number(row.querySelector<HTMLInputElement>('[name="lineQty"]')?.value || 0),
          }))
          .filter((l) => l.itemName && l.quantity > 0)
        const missing: string[] = []
        if (!title) missing.push("a title")
        if (!requisitionId && !lines.length) missing.push("an approved requisition or at least one line")
        if (!vendorIds.length) missing.push("at least one eligible vendor")
        if (missing.length) return { handled: true, error: `Cannot ${saveAsDraft ? "save" : "send"} the RFQ — it needs ${missing.join(", ")}.` }

        const close = String(fd.get("close") ?? "")
        // Vendors cannot quote after the closing date, so an RFQ sent with one already past is dead on arrival.
        if (close && new Date(close).getTime() <= Date.now()) {
          return { handled: true, error: "The closing date has already passed. Choose a future closing date and send again." }
        }
        const source = rows("requisitions").find((r) => r.recordId === requisitionId)
        const commercial = weights[1]
        const methodRaw = String(fd.get("method") ?? "").trim()
        const procurementMethod =
          /open\s*tender|tender/i.test(methodRaw) ? "TENDER"
          : /rfp|proposal/i.test(methodRaw) ? "RFP"
          : /direct/i.test(methodRaw) ? "DIRECT"
          : "RFQ"
        const created = await createRfq({
          purchaseRequisitionId: requisitionId || undefined,
          title,
          description: [fd.get("objective"), fd.get("scope")].map((v) => String(v ?? "").trim()).filter(Boolean).join("\n\n") || undefined,
          vendorIds,
          rfqDeadline: close ? new Date(close).toISOString() : undefined,
          items: lines.length ? lines : undefined,
          visibility: methodRaw === "Open tender" ? "PUBLIC_LISTING" : "INVITED_ONLY",
          procurementMethod,
          saveAsDraft: saveAsDraft || undefined,
          reportingCurrencyCode: String(fd.get("currency") ?? "").trim().toUpperCase() || undefined,
          // The backend weighs price against everything else: commercial is price, and
          // technical, delivery and risk together are the non-price share.
          priceWeight: commercial / 100,
          technicalWeight: (100 - commercial) / 100,
        })
        closeRuntimeOverlay()
        const count = vendorIds.length
        if (saveAsDraft) {
          return { handled: true, reload: true, message: `${created?.rfqNumber ?? "The RFQ"} saved as a draft. Nothing is sent until it is approved and published.` }
        }
        return {
          handled: true,
          reload: true,
          message: `${created?.rfqNumber ?? "The RFQ"} sent to ${count} vendor${count === 1 ? "" : "s"}${!lines.length && source ? `, with the lines of ${source.id}` : ""}.`,
        }
      }

      case "extend-rfq-closing-v23": {
        // The vendored Edit button on a tender row opened a generic fixture form with no way to
        // save at all -- the only field a published tender can actually change is when it closes.
        if (!has("rfq.manage")) return refuse("changing tenders and RFQs")
        const form = document.querySelector<HTMLFormElement>("#editTenderFormV23")
        if (!form) return { handled: true, error: "Open Edit again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const t = byDisplayId("tenders", val('#editTenderFormV23 [name="tenderId"]'))
        if (!t) return { handled: true, error: "That tender is no longer in the register. Refresh and try again." }
        const newClosingAt = val('#editTenderFormV23 [name="closing"]')
        if (new Date(newClosingAt).getTime() <= Date.now()) {
          return { handled: true, error: "Choose a future closing date and time." }
        }
        await extendRfqClosing(t.recordId, new Date(newClosingAt).toISOString())
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${t.id} closing date updated.` }
      }

      case "reopen-rfq-v23": {
        // After the deadline: a formal, reasoned, audited reopen. The API refuses without a reason or a future deadline.
        if (!has("rfq.manage")) return refuse("reopening tenders and RFQs")
        const F = "#editTenderFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (!form) return { handled: true, error: "Open Reopen again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const t = byDisplayId("tenders", val(`${F} [name="tenderId"]`))
        if (!t) return { handled: true, error: "That tender is no longer in the register. Refresh and try again." }
        const newClosingAt = val(`${F} [name="closing"]`)
        if (new Date(newClosingAt).getTime() <= Date.now()) return { handled: true, error: "Choose a future closing date and time." }
        await reopenRfq(t.recordId, new Date(newClosingAt).toISOString(), val(`${F} [name="reason"]`))
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${t.id} reopened. Every invited supplier has a fresh link and can submit a revised quotation until the new deadline.` }
      }

      // ------------------------------------------------------- sourcing: opening, evaluation, award (SRD §15-§20)
      case "open-bids-v23": {
        const F = "#openBidsFormV23"
        const rfqId = val(`${F} [name="rfqId"]`)
        if (!rfqId) return { handled: true, error: "Open the bids from the event's page." }
        const attendees = [...document.querySelectorAll<HTMLElement>(`${F} [data-attendee-row]`)]
          .map((row) => {
            const field = (n: string) => ((row.querySelector(`[name="${n}"]`) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "").trim()
            const userId = field("attendeeUser")
            const name = field("attendeeName")
            const role = field("attendeeRole") || undefined
            return userId ? { userId, role } : name ? { name, role, external: true } : null
          })
          .filter((a): a is { userId: string; role: string | undefined } => a !== null)
        await openRfqBids(rfqId, { attendees, notes: val(`${F} [name="notes"]`) || undefined })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "The bids are opened and the opening is recorded with its attendees." }
      }

      case "save-criteria-v23": {
        const F = "#criteriaFormV23"
        const rfqId = val(`${F} [name="rfqId"]`)
        const criteria = [...document.querySelectorAll<HTMLElement>(`${F} [data-criterion-row]`)].map((row) => {
          const f = (n: string) => ((row.querySelector(`[name="${n}"]`) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "").trim()
          const kind = f("cKind") as "SCORED" | "PASS_FAIL" | "PRICE"
          return {
            name: f("cName"),
            kind,
            weight: kind === "PASS_FAIL" ? 0 : Number(f("cWeight") || 0),
            maxScore: kind === "SCORED" ? Number(f("cMax") || 10) : undefined,
            mandatory: Boolean(row.querySelector<HTMLInputElement>('[name="cMandatory"]')?.checked),
          }
        })
        if (criteria.some((c) => !c.name)) return { handled: true, error: "Every criterion needs a name." }
        await setEvaluationCriteria(rfqId, {
          criteria,
          evaluationMode: val(`${F} [name="evaluationMode"]`) || undefined,
          passRule: val(`${F} [name="passRule"]`) || undefined,
          minEvaluators: Number(val(`${F} [name="minEvaluators"]`) || 1),
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Evaluation criteria saved." }
      }

      case "default-criteria-v23": {
        await applyDefaultEvaluationCriteria(String(detail.dataset.id ?? ""))
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "The standard criteria are applied." }
      }

      case "save-committee-v23": {
        const F = "#committeeFormV23"
        const rfqId = val(`${F} [name="rfqId"]`)
        const members = [...document.querySelectorAll<HTMLElement>(`${F} [data-member-row]`)]
          .filter((row) => row.querySelector<HTMLInputElement>('[name="member"]')?.checked)
          .map((row) => ({ userId: String(row.dataset.user), role: row.querySelector<HTMLSelectElement>('[name="role"]')?.value || "MEMBER" }))
        if (!members.length) return { handled: true, error: "Choose at least one committee member." }
        await setEvaluationCommittee(rfqId, members)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `Committee saved with ${members.length} member${members.length === 1 ? "" : "s"}.` }
      }

      case "capture-quotation-v23": {
        const F = "#captureFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (!form) return { handled: true, error: "Open Capture quotation again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const rfqId = val(`${F} [name="rfqId"]`)
        const items = [...document.querySelectorAll<HTMLElement>(`${F} [data-capture-line]`)]
          .map((row) => {
            const f = (n: string) => ((row.querySelector(`[name="${n}"]`) as HTMLInputElement | null)?.value ?? "").trim()
            return { itemName: f("item"), quantity: Number(f("qty")), unit: f("uom") || undefined, unitPrice: Number(f("price")) }
          })
          .filter((l) => l.itemName)
        if (!items.length || items.some((l) => !(l.quantity > 0) || !(l.unitPrice >= 0))) {
          return { handled: true, error: "Every line needs a quantity and a unit price." }
        }
        const files = (name: string) => [...(document.querySelector<HTMLInputElement>(`${F} [name="${name}"]`)?.files ?? [])]
        const documents = files("documents")
        if (!documents.length) return { handled: true, error: "Attach the supplier's original quotation (PDF)." }
        const num = (n: string) => (val(`${F} [name="${n}"]`) === "" ? null : Number(val(`${F} [name="${n}"]`)))
        const vat = num("vatRate")
        await captureQuotation(
          rfqId,
          {
            vendorId: val(`${F} [name="vendorId"]`),
            channel: val(`${F} [name="channel"]`),
            receivedAt: new Date(val(`${F} [name="receivedAt"]`)).toISOString(),
            reason: val(`${F} [name="reason"]`) || undefined,
            currencyCode: val(`${F} [name="currencyCode"]`),
            vatRate: vat == null ? null : vat / 100,
            quotationReference: val(`${F} [name="quotationReference"]`) || undefined,
            quotationDate: val(`${F} [name="quotationDate"]`) || undefined,
            validUntil: val(`${F} [name="validUntil"]`) || undefined,
            paymentTerms: val(`${F} [name="paymentTerms"]`) || undefined,
            deliveryTime: val(`${F} [name="deliveryTime"]`) || undefined,
            deliveryPeriodDays: num("deliveryPeriodDays"),
            notes: val(`${F} [name="notes"]`) || undefined,
            declaredTotalAmount: num("declaredTotalAmount"),
            items,
          },
          documents,
          files("technicalDocuments"),
        )
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Quotation captured. It is recorded like a portal submission, with the original document kept." }
      }

      case "save-fx-v23": {
        const F = "#fxFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        await setRfqFxRate(val(`${F} [name="rfqId"]`), { currency: val(`${F} [name="currency"]`), rate: Number(val(`${F} [name="rate"]`)), reason: val(`${F} [name="reason"]`) })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Exchange rate recorded with your reason." }
      }

      case "declare-v23": {
        const F = "#declarationFormV23"
        const code = document.querySelector<HTMLInputElement>(`${F} [name="code"]:checked`)?.value
        if (!code) return { handled: true, error: "Choose the declaration that applies to you." }
        await declareEvaluation(val(`${F} [name="rfqId"]`), { code, details: val(`${F} [name="details"]`) || undefined })
        return { handled: true, reload: true, message: "Declaration recorded." }
      }

      case "save-scores-v23": {
        const [rfqId, quotationId] = String(detail.dataset.id ?? "").split("|")
        const block = document.querySelector<HTMLElement>(`[data-scorecard-quote="${CSS.escape(quotationId)}"]`)
        if (!block) return { handled: true, error: "Open the scorecard again." }
        const scores: { criterionId: string; score?: number | null; passed?: boolean | null }[] = []
        block.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-criterion]").forEach((el) => {
          const criterionId = String(el.dataset.criterion)
          if (el.value === "") return
          if (el.getAttribute("name") === "pass") scores.push({ criterionId, passed: el.value === "true" })
          else scores.push({ criterionId, score: Number(el.value) })
        })
        if (!scores.length) return { handled: true, error: "Enter at least one mark before saving." }
        await saveEvaluationScores(rfqId, { quotationId, scores, comment: block.querySelector<HTMLTextAreaElement>('[name="comment"]')?.value.trim() || undefined })
        return { handled: true, reload: true, message: "Your marks are saved." }
      }

      case "submit-scorecard-v23": {
        await submitEvaluationScorecard(String(detail.dataset.id ?? ""))
        return { handled: true, reload: true, message: "Scorecard submitted. It is now fixed and counted in the committee result." }
      }

      case "prepare-recommendation-v23": {
        const F = "#recommendationFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        await prepareAwardRecommendation(val(`${F} [name="rfqId"]`), {
          quotationId: val(`${F} [name="quotationId"]`),
          justification: val(`${F} [name="justification"]`),
          deviations: val(`${F} [name="deviations"]`) || undefined,
          supportingDocumentIds: [...document.querySelectorAll<HTMLInputElement>(`${F} [name="doc"]:checked`)].map((c) => c.value),
        })
        return { handled: true, reload: true, message: "Recommendation saved as a draft. Submit it for approval when it is ready." }
      }

      case "submit-recommendation-v23": {
        await submitAwardRecommendation(String(detail.dataset.id ?? ""))
        return { handled: true, reload: true, message: "Recommendation submitted to the award approvers." }
      }

      case "decide-recommendation-v23": {
        const [rfqId, decision] = String(detail.dataset.id ?? "").split("|")
        const comments = val("#recDecisionCommentV23")
        if (decision === "REJECT" && !comments) return { handled: true, error: "Write the reason for rejecting the recommendation." }
        await decideAwardRecommendation(rfqId, decision === "REJECT" ? "REJECT" : "APPROVE", comments || undefined)
        return { handled: true, reload: true, message: decision === "REJECT" ? "Recommendation rejected." : "Your approval is recorded." }
      }

      case "finalise-award-v23": {
        const [, quotationId] = String(detail.dataset.id ?? "").split("|")
        if (!has("rfq.award")) return refuse("awarding quotations")
        const result = await acceptQuotation(quotationId)
        const po = (result as any)?.purchaseOrder?.poNumber
        return { handled: true, reload: true, message: `Award finalised${po ? `; ${po} raised` : ""}.` }
      }

      case "save-declaration-wording-v23": {
        const F = "#declarationWordingFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        await saveEvaluationDeclarationOption({
          id: val(`${F} [name="id"]`) || undefined,
          label: val(`${F} [name="label"]`),
          statement: val(`${F} [name="statement"]`),
          effect: val(`${F} [name="effect"]`),
          requiresDetails: Boolean(document.querySelector<HTMLInputElement>(`${F} [name="requiresDetails"]`)?.checked),
          active: Boolean(document.querySelector<HTMLInputElement>(`${F} [name="active"]`)?.checked),
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Declaration wording saved. It applies to declarations made from now on." }
      }

      case "download-quotation-doc-v23": {
        const blob = await downloadQuotationDocument(String(detail.dataset.path ?? ""))
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = String(detail.dataset.name || "quotation.pdf")
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        return { handled: true }
      }

      case "confirm-delegate-approval-v6": {
        const promptId = String(detail.dataset.id ?? "")
        const prompt = rows("approvalPromptsV6").find((p) => p.id === promptId)
        if (!prompt?.targetId) return { handled: true, error: "Open the approval prompt again." }
        const form = document.querySelector<HTMLFormElement>("#delegateApprovalFormV6")
        const delegateSelect = form?.elements.namedItem("delegate") as HTMLSelectElement | null
        const delegatedToId =
          delegateSelect?.selectedOptions?.[0]?.dataset?.userId ||
          val("[name='delegatedToId']") ||
          delegateSelect?.value
        if (!delegatedToId || delegatedToId.includes("·")) {
          return {
            handled: true,
            error: "Pick a delegate user id (staff user). Sample names in the demo list are not live users.",
          }
        }
        await delegateApproval({
          entityId: String(prompt.targetId),
          delegatedToId: String(delegatedToId),
          reason: val("[name='reason']") || undefined,
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${prompt.record} delegated.` }
      }

      case "create-role-confirm": {
        const name = val("[name='roleName']") || val("#roleName")
        const description = val("[name='description']") || undefined
        if (!name) return { handled: true, error: "Enter a role name." }
        const permsRaw = val("[name='permissionsJson']")
        let permissions: unknown = ["procurement.requisitions.view"]
        if (permsRaw) {
          try {
            permissions = JSON.parse(permsRaw)
          } catch {
            return { handled: true, error: "permissionsJson must be valid JSON." }
          }
        }
        await createAppRole({ name, description, permissions })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `Role "${name}" created.` }
      }

      case "finance-handoff-v23": {
        // §25: a move along the permitted order (nothing is skipped), recorded with who and when. The server decides who may.
        const invoiceId = String(detail.dataset.id ?? "")
        const to = String(detail.dataset.status || "").toUpperCase() as "READY_FOR_FINANCE" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "PAID" | "CLOSED"
        if (!invoiceId || !to) return { handled: true, error: "Choose the invoice and the step." }
        const h = await transitionInvoiceHandoff(invoiceId, to)
        return { handled: true, reload: true, message: `${h.invoiceNumber} is now ${String(h.status).replace(/_/g, " ").toLowerCase()}.` }
      }

      case "confirm-return-invoice-v23": {
        const F = "#returnInvoiceFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        const h = await transitionInvoiceHandoff(val(`${F} [name="invoiceId"]`), "REJECTED", val(`${F} [name="reason"]`))
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${h.invoiceNumber} returned with your reason.` }
      }

      case "approve-invoice-v23": {
        if (!has("invoices.approve")) return refuse("approving invoices")
        const id = String(detail.dataset.id ?? "")
        try {
          await approveProcurementInvoice(id, true)
        } catch (e) {
          if (errorCode(e) === "MATCH_EXCEPTIONS" && has("invoices.override_match")) {
            closeRuntimeOverlay()
            ;(window as unknown as { __pr23OverrideModal?: (id: string, m: string) => void }).__pr23OverrideModal?.(id, (e as Error).message)
            return { handled: true }
          }
          throw e
        }
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Invoice approved. It is now Ready for Finance." }
      }

      case "confirm-override-approve-v23": {
        if (!has("invoices.override_match")) return refuse("approving invoices over match exceptions")
        const F = "#matchOverrideFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (form && !form.reportValidity()) return { handled: true }
        await approveProcurementInvoice(val(`${F} [name="invoiceId"]`), true, val(`${F} [name="reason"]`))
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Invoice approved over its match exceptions. Your reason is recorded." }
      }

      case "rematch-invoice-v23": {
        await matchProcurementInvoice(String(detail.dataset.id ?? ""))
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "The three-way match was re-run." }
      }

      case "submit-po-approval-v23": {
        if (!has("orders.manage") && !has("orders.send")) return refuse("submitting purchase orders for approval")
        const r = await submitPoForApproval(String(detail.dataset.id ?? ""))
        return { handled: true, reload: true, message: `${r.poNumber} submitted for approval.` }
      }

      case "download-po-pdf-v23": {
        const blob = await downloadPurchaseOrderPdf(String(detail.dataset.id ?? ""))
        saveBlob(blob, `${String(detail.dataset.name || "purchase-order")}.pdf`)
        return { handled: true }
      }

      case "save-p2p-settings-v23": {
        if (!has("audit.view")) return refuse("changing matching settings")
        const F = "#p2pMatchFormV23"
        const num = (n: string) => {
          const v = val(`${F} [name="${n}"]`)
          return v === "" ? undefined : Number(v)
        }
        await updateProcurementSettings({
          matchPriceVariancePct: num("matchPriceVariancePct"),
          matchValueTolerancePct: num("matchValueTolerancePct"),
          matchTaxTolerancePct: num("matchTaxTolerancePct"),
          matchQtyTolerancePct: num("matchQtyTolerancePct"),
          matchAmountToleranceAbs: num("matchAmountToleranceAbs"),
          overDeliveryTolerancePct: num("overDeliveryTolerancePct"),
          matchEnforcement: val(`${F} [name="matchEnforcement"]`),
          poApprovalRequired: Boolean(document.querySelector<HTMLInputElement>(`${F} [name="poApprovalRequired"]`)?.checked),
        })
        return { handled: true, reload: true, message: "Matching settings saved. They apply to the next match and receipt." }
      }

      case "save-ai-settings-v23": {
        if (!has("audit.view")) return refuse("changing AI settings")
        const F = "#p2pAiFormV23"
        const lim = (n: string) => {
          const v = val(`${F} [name="${n}"]`)
          return v === "" ? null : Number(v)
        }
        await updateProcurementSettings({
          aiEnabled: Boolean(document.querySelector<HTMLInputElement>(`${F} [name="aiEnabled"]`)?.checked),
          aiMonthlyDocumentLimit: lim("aiMonthlyDocumentLimit"),
          aiMonthlyCallLimit: lim("aiMonthlyCallLimit"),
          aiAllowedRoleCodes: val(`${F} [name="aiAllowedRoleCodes"]`),
          aiAllowedDocumentTypes: [...document.querySelectorAll<HTMLInputElement>(`${F} [name="aiType"]:checked`)].map((c) => c.value),
        })
        return { handled: true, reload: true, message: "AI settings saved." }
      }

      // ------------------------------------------------- AI document review (§29): a proposal, then a person's decision
      case "ai-extract-v23": {
        if (!has("ai.use")) return refuse("using AI document review")
        const F = "#aiReviewFormV23"
        const file = document.querySelector<HTMLInputElement>(`${F} [name="document"]`)?.files?.[0]
        if (!file) return { handled: true, error: "Choose the document to read." }
        const ex = await aiExtractDocument(file, val(`${F} [name="documentType"]`) || "OTHER")
        p2pHost()?.aiPut?.(ex, true)
        return { handled: true, reload: true, message: `Read ${file.name}. These are suggestions: check each value against the document.` }
      }

      case "ai-decide-v23": {
        const [id, key, decision] = String(detail.dataset.id ?? "").split("|")
        const raw = document.querySelector<HTMLInputElement>(`[data-ai-input="${CSS.escape(key)}"]`)?.value ?? ""
        if ((decision === "CORRECT" || decision === "MANUAL") && !raw.trim()) return { handled: true, error: "Enter the value first." }
        const ex = await decideAiField(id, key, decision as "ACCEPT" | "CORRECT" | "REJECT" | "MANUAL", raw.trim() || undefined)
        p2pHost()?.aiPut?.(ex, false)
        return { handled: true }
      }

      case "ai-complete-v23": {
        const ex = await completeAiReview(String(detail.dataset.id ?? ""))
        p2pHost()?.aiPut?.(ex, false)
        return { handled: true, message: "Review complete. Only the values you confirmed are usable." }
      }

      case "ai-discard-v23": {
        const ex = await discardAiExtraction(String(detail.dataset.id ?? ""))
        p2pHost()?.aiPut?.(ex, false)
        return { handled: true, message: "The reading was discarded." }
      }

      case "ai-source-v23": {
        const blob = await aiExtractionSource(String(detail.dataset.id ?? ""))
        window.open(URL.createObjectURL(blob), "_blank", "noopener")
        return { handled: true }
      }

      case "extract-invoice":
      case "extract-invoice-v5":
      case "run-ocr":
      case "run-ocr-v5": {
        // Alias into the live AI capture extract path (PDF or bitmap OCR on the server).
        if (!has("intake.manage")) return refuse("capturing supplier invoices")
        const fileInput =
          document.querySelector<HTMLInputElement>('#aiInvoiceCaptureV23 [name="document"]') ||
          document.querySelector<HTMLInputElement>('input[type="file"][name="document"]')
        const file = fileInput?.files?.[0]
        if (!file) {
          return {
            handled: true,
            error: "Open AI Invoice Capture and attach the supplier invoice (PDF or scan/photo), then run extract again.",
          }
        }
        const fd = new FormData()
        fd.append("document", file)
        const result = await extractInvoiceForCapture(fd)
        const apply = (window as unknown as { __pr23ApplyExtraction?: (r: unknown) => void }).__pr23ApplyExtraction
        if (typeof apply === "function") apply(result)
        return {
          handled: true,
          message: `Invoice read at ${Math.round(Number(result.payload?.overallConfidence ?? 0) * 100)}% confidence. Check fields, then save.`,
        }
      }

      // ------------------------------------------------------------ goods received
      case "create-grn-confirm": {
        if (!has("receiving.manage")) return refuse("recording goods received")
        const F = "#grnFormV23"
        const form = document.querySelector<HTMLFormElement>(F)
        if (!form) return { handled: true, error: "Open Record receipt again; the receipt form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const poId = val("#grnPoV23")
        const po = rows("orders").find((o) => o.recordId === poId)
        const attr = (name: string, id: string) => form.querySelector<HTMLInputElement>(`[${name}="${CSS.escape(id)}"]`)
        const items: Array<Record<string, any>> = []
        for (const row of [...form.querySelectorAll<HTMLElement>("[data-grn-row]")]) {
          const id = String(row.dataset.grnRow)
          const service = form.querySelector<HTMLSelectElement>(`[data-grn-line-type="${CSS.escape(id)}"]`)?.value === "SERVICE"
          if (service) {
            const amount = Number(attr("data-grn-svc-amount", id)?.value || 0)
            if (!(amount > 0)) continue // a service line nothing was confirmed on is left off
            const files = [...(attr("data-grn-svc-file", id)?.files ?? [])]
            items.push({
              purchaseOrderItemId: id,
              lineType: "SERVICE",
              milestoneDescription: attr("data-grn-milestone", id)?.value.trim() || undefined,
              servicePeriodStart: attr("data-grn-svc-start", id)?.value || undefined,
              servicePeriodEnd: attr("data-grn-svc-end", id)?.value || undefined,
              serviceAmount: amount,
              serviceEvidence: files.length ? await uploadReceiptFiles(files) : [],
              quantityReceived: 0,
              quantityAccepted: 0,
              quantityRejected: 0,
            })
          } else {
            const received = Number(attr("data-grn-received", id)?.value || 0)
            if (!(received > 0)) continue
            items.push({
              purchaseOrderItemId: id,
              lineType: "GOODS",
              quantityReceived: received,
              quantityAccepted: Number(attr("data-grn-accepted", id)?.value || 0),
              quantityRejected: Number(attr("data-grn-rejected", id)?.value || 0),
            })
          }
        }
        if (!items.length) return { handled: true, error: "Enter a received quantity, or a confirmed service amount, on at least one line." }
        const files = [...(form.querySelector<HTMLInputElement>('[name="receiptFiles"]')?.files ?? [])]
        const received = val(`${F} [name="receivedDate"]`)
        const grn = await createGoodsReceivedNote({
          purchaseOrderId: poId,
          receivedDate: received ? new Date(received).toISOString() : undefined,
          deliveryNoteNumber: val(`${F} [name="deliveryNoteNumber"]`) || undefined,
          locationName: val(`${F} [name="locationName"]`) || undefined,
          comments: val(`${F} [name="comments"]`) || undefined,
          attachmentUrls: files.length ? await uploadReceiptFiles(files) : undefined,
          items: items as any,
        })
        closeRuntimeOverlay()
        const isService = items.every((l) => l.lineType === "SERVICE")
        return {
          handled: true,
          reload: true,
          message: `${grn?.grnNumber ?? (isService ? "The service receipt" : "The goods received note")} recorded against ${po?.id ?? "the purchase order"} and sent for inspection approval.`,
        }
      }

      // ----------------------------------------------------------- invoice capture
      case "confirm-capture-invoice-v5":
      case "confirm-capture-approve-invoice-v23":
      case "confirm-capture-flag-invoice-v23": {
        if (!has("intake.manage")) return refuse("capturing supplier invoices")
        // The invoice processing screen (SRD §7) saves, saves and approves, or saves and flags for review.
        const flagging = action === "confirm-capture-flag-invoice-v23"
        const approving = action === "confirm-capture-approve-invoice-v23"
        const reviewNote = flagging ? val("#invoiceReviewNoteV23") : ""
        if (flagging && !reviewNote) return { handled: true, error: "Say why the invoice needs review before flagging it." }
        if (approving && !has("invoices.approve")) return refuse("approving invoices")
        const form = document.querySelector<HTMLFormElement>("#invoiceCaptureV23")
        if (!form) return { handled: true, error: "Open Capture invoice again; the capture form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const poId = val("#invoicePoV23")
        const po = rows("orders").find((o) => o.recordId === poId)
        if (!po?.vendorId) return { handled: true, error: "Select the purchase order the invoice is for." }
        const items = [...form.querySelectorAll<HTMLInputElement>("[data-inv-qty]")]
          .map((input) => {
            const id = String(input.dataset.invQty)
            return {
              itemName: input.dataset.invName ?? "",
              quantity: Number(input.value || 0),
              unitPrice: Number(form.querySelector<HTMLInputElement>(`[data-inv-price="${CSS.escape(id)}"]`)?.value || 0),
            }
          })
          .filter((l) => l.itemName && l.quantity > 0)
        if (!items.length) return { handled: true, error: "Enter an invoiced quantity on at least one line." }
        if (items.some((l) => !(l.unitPrice > 0))) return { handled: true, error: "Every invoiced line needs a unit price above zero." }
        const invoiceDate = val('#invoiceCaptureV23 [name="invoiceDate"]')
        const dueDate = val('#invoiceCaptureV23 [name="dueDate"]')
        const supplierInvoiceNumber = val('#invoiceCaptureV23 [name="supplierInvoiceNumber"]')
        if (!supplierInvoiceNumber) return { handled: true, error: "Enter the supplier's invoice number, as printed on their invoice." }
        const optionalNumber = (n: string) => {
          const v = val(`#invoiceCaptureV23 [name="${n}"]`)
          return v === "" ? undefined : Number(v)
        }
        // The supplier's document read on AI Invoice Capture goes with the invoice, and its reading is reused, when it
        // was read for this order (or before any order was chosen). Captures made from a reading used to drop the PDF.
        const reading =
          (window as unknown as {
            __pr23ReadingFor?: (po: string) => { documentUrl: string; documentType: string; intakeId: string | null } | null
          }).__pr23ReadingFor?.(poId) ?? null
        const invoice = await captureProcurementInvoice({
          purchaseOrderId: poId,
          vendorId: String(po.vendorId),
          invoiceDate: new Date(invoiceDate).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          currencyId: po.currencyId ?? undefined,
          documentPath: reading?.documentUrl,
          documentType: reading?.documentType,
          readingIntakeId: reading?.intakeId ?? undefined,
          reviewNote: reviewNote || undefined,
          supplierInvoiceNumber,
          grnId: val('#invoiceCaptureV23 [name="grnId"]') || undefined,
          paymentTerms: val('#invoiceCaptureV23 [name="paymentTerms"]') || undefined,
          taxAmount: optionalNumber("statedTax"),
          totalAmount: optionalNumber("statedTotal"),
          items,
        })
        ;(window as unknown as { __pr23ClearReading?: () => void }).__pr23ClearReading?.()
        const captured = invoice?.invoiceNumber ?? "The invoice"
        if (approving && invoice?.id) {
          await approveProcurementInvoice(invoice.id, true)
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${captured} captured against ${po.id} and approved for payment.` }
        }
        closeRuntimeOverlay()
        return {
          handled: true,
          reload: true,
          message: flagging
            ? `${captured} captured against ${po.id} and flagged for review: ${reviewNote}`
            : `${captured} captured against ${po.id} and sent to Finance for approval.`,
        }
      }

      // ------------------------------------------------- AI invoice capture (reading the PDF)
      // Reads the supplier's PDF and prefills the capture form. Nothing is saved here: the
      // operator checks every field and saves through confirm-capture-invoice-v5 as before.
      case "confirm-extract-invoice-v23": {
        if (!has("intake.manage")) return refuse("capturing supplier invoices")
        const form = document.querySelector<HTMLFormElement>("#aiInvoiceCaptureV23")
        if (!form) return { handled: true, error: "Open AI Invoice Capture again; the upload form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const file = form.querySelector<HTMLInputElement>('[name="document"]')?.files?.[0]
        if (!file) return { handled: true, error: "Attach the supplier's invoice PDF first." }
        if (!/\.(pdf|png|jpe?g|webp|tiff?)$/i.test(file.name)) {
          return {
            handled: true,
            error: "Upload the invoice as a PDF, or as a scan or photo (PNG, JPEG, WEBP or TIFF).",
          }
        }
        const fd = new FormData()
        fd.append("document", file)
        const poId = val("#aiInvoicePoV23")
        if (poId) fd.append("purchaseOrderId", poId)

        const result = await extractInvoiceForCapture(fd)
        const lineCount = result.payload?.lines?.length ?? 0
        if (!lineCount && !result.payload?.invoiceNumber) {
          return {
            handled: true,
            error: "Nothing could be read from that document. Check it is the supplier's invoice, or capture it by hand.",
          }
        }
        // The runtime owns the page's DOM, so the bridge does the filling in.
        const apply = (window as unknown as { __pr23ApplyExtraction?: (r: unknown) => void }).__pr23ApplyExtraction
        if (typeof apply === "function") apply(result)

        const pct = Math.round(Number(result.payload?.overallConfidence ?? 0) * 100)
        const read = `Read ${lineCount} line${lineCount === 1 ? "" : "s"} at ${pct}% confidence`
        return {
          handled: true,
          message: result.lowConfidence
            ? `${read} — below the ${Math.round(result.threshold * 100)}% threshold, so check every field before you save.`
            : `${read}. Check the fields against the PDF, then save the invoice.`,
        }
      }

      // ---------------------------------------------------------------- annual plans
      case "save-plan-v5":
      case "create-plan-confirm-v5": {
        if (!has("plans.manage")) return refuse("creating or changing procurement plans")
        const form = document.querySelector<HTMLFormElement>("#planFormV23")
        if (!form) return { handled: true, error: "Open the plan form again; it is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const recordId = val('#planFormV23 [name="recordId"]')
        const body = {
          name: val('#planFormV23 [name="name"]'),
          department: (() => {
            const d = val('#planFormV23 [name="department"]')
            return d && d !== "All departments" ? d : undefined
          })(),
          businessUnit: val('#planFormV23 [name="businessUnit"]') || undefined,
          fiscalYear: val('#planFormV23 [name="fiscalYear"]') || undefined,
          budget: Number(val('#planFormV23 [name="budget"]') || 0),
          currencyCode: val('#planFormV23 [name="currency"]') || undefined,
          notes: val('#planFormV23 [name="notes"]') || undefined,
        }
        if (!(body.budget > 0)) return { handled: true, error: "The plan needs a budget ceiling above zero." }
        const lines = [...form.querySelectorAll<HTMLTableRowElement>("[data-plan-line]")]
          .map((row) => ({
            description: (row.querySelector<HTMLInputElement>("[data-plan-desc]")?.value ?? "").trim(),
            category: row.querySelector<HTMLSelectElement>("[data-plan-cat]")?.value || undefined,
            quarter: row.querySelector<HTMLSelectElement>("[data-plan-q]")?.value || undefined,
            method: row.querySelector<HTMLSelectElement>("[data-plan-method]")?.value || undefined,
            estimatedValue: Number(row.querySelector<HTMLInputElement>("[data-plan-value]")?.value || 0),
          }))
          .filter((l) => l.description)
        const plan = recordId ? await updateProcurementPlan(recordId, body) : await createProcurementPlan(body)
        for (const line of lines) await addProcurementPlanItem(plan.id, line)
        closeRuntimeOverlay()
        const count = lines.length
        return {
          handled: true,
          reload: true,
          message: `${plan.planNumber} ${recordId ? "updated" : "created as a draft"}${count ? ` with ${count} line${count === 1 ? "" : "s"}` : ""}. Submit it for budget approval when it is complete.`,
        }
      }

      case "save-plan-item": {
        if (!has("plans.manage")) return refuse("changing procurement plans")
        const form = document.querySelector<HTMLFormElement>("#planItemFormV23")
        if (!form) return { handled: true, error: "Open Add plan item again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const plan = await addProcurementPlanItem(val('#planItemFormV23 [name="plan"]'), {
          description: val('#planItemFormV23 [name="description"]'),
          category: val('#planItemFormV23 [name="category"]') || undefined,
          quarter: val('#planItemFormV23 [name="quarter"]') || undefined,
          method: val('#planItemFormV23 [name="method"]') || undefined,
          businessUnit: val('#planItemFormV23 [name="businessUnit"]') || undefined,
          budgetCode: val('#planItemFormV23 [name="budgetCode"]') || undefined,
          costCentre: val('#planItemFormV23 [name="costCentre"]') || undefined,
          currencyCode: val('#planItemFormV23 [name="lineCurrency"]') || undefined,
          plannedStartDate: val('#planItemFormV23 [name="plannedStartDate"]') || undefined,
          requiredDeliveryDate: val('#planItemFormV23 [name="requiredDeliveryDate"]') || undefined,
          responsibleOfficerId: val('#planItemFormV23 [name="responsibleOfficerId"]') || undefined,
          estimatedValue: Number(val('#planItemFormV23 [name="estimatedValue"]') || 0),
          department: (() => {
            const d = val('#planItemFormV23 [name="department"]')
            return d && d !== "Same as the plan's" ? d : undefined
          })(),
        })
        closeRuntimeOverlay()
        const fmt = (n: unknown) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        return { handled: true, reload: true, message: `Line added to ${plan.planNumber}: ${fmt(plan.plannedValue)} planned against a budget of ${fmt(plan.budget)}.` }
      }

      case "save-plan-item-edit-v23": {
        if (!has("plans.manage")) return refuse("changing procurement plans")
        const form = document.querySelector<HTMLFormElement>("#planItemEditFormV23")
        if (!form) return { handled: true, error: "Open Edit again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const itemId = val('#planItemEditFormV23 [name="itemId"]')
        const planId = val('#planItemEditFormV23 [name="planId"]')
        const plan = await updateProcurementPlanItem(planId, itemId, {
          description: val('#planItemEditFormV23 [name="description"]'),
          category: val('#planItemEditFormV23 [name="category"]') || undefined,
          quarter: val('#planItemEditFormV23 [name="quarter"]') || undefined,
          method: val('#planItemEditFormV23 [name="method"]') || undefined,
          businessUnit: val('#planItemEditFormV23 [name="businessUnit"]') || undefined,
          budgetCode: val('#planItemEditFormV23 [name="budgetCode"]') || undefined,
          costCentre: val('#planItemEditFormV23 [name="costCentre"]') || undefined,
          currencyCode: val('#planItemEditFormV23 [name="lineCurrency"]') || undefined,
          plannedStartDate: val('#planItemEditFormV23 [name="plannedStartDate"]') || undefined,
          requiredDeliveryDate: val('#planItemEditFormV23 [name="requiredDeliveryDate"]') || undefined,
          responsibleOfficerId: val('#planItemEditFormV23 [name="responsibleOfficerId"]') || undefined,
          estimatedValue: Number(val('#planItemEditFormV23 [name="estimatedValue"]') || 0),
          department: (() => {
            const d = val('#planItemEditFormV23 [name="department"]')
            return d && d !== "Same as the plan's" ? d : undefined
          })(),
        })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${plan.planNumber}: line updated.` }
      }

      case "submit-plan": {
        if (!has("plans.manage")) return refuse("submitting procurement plans")
        const ui = (window as unknown as { MatanhoProcurementUI?: { getSnapshot?: () => Record<string, unknown> } }).MatanhoProcurementUI
        const openId = String(ui?.getSnapshot?.()?.planDetail ?? "")
        const editable = rows("plans").filter((p) => ["DRAFT", "REJECTED"].includes(String(p.rawStatus)))
        const plan = openId ? rows("plans").find((p) => p.id === openId) : editable.length === 1 ? editable[0] : undefined
        if (!plan) {
          return {
            handled: true,
            error: editable.length ? "Open the plan you want to submit, then submit it from its workspace." : "No draft plan is waiting to be submitted.",
          }
        }
        if (!["DRAFT", "REJECTED"].includes(String(plan.rawStatus))) {
          return { handled: true, error: `${plan.id} is ${String(plan.status).toLowerCase()} and cannot be submitted again.` }
        }
        const out = await submitProcurementPlan(plan.recordId)
        return { handled: true, reload: true, message: `${out.planNumber} submitted for budget approval.` }
      }

      // ---------------------------------------------------------------- contracts
      case "save-contract-v6": {
        if (!has("contracts.manage")) return refuse("creating contracts")
        const form = document.querySelector<HTMLFormElement>("#contractFormV23")
        if (!form) return { handled: true, error: "Open the contract form again; it is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const recordId = val('#contractFormV23 [name="recordId"]')
        const quotationId = val('#contractFormV23 [name="quotation"]')
        const body = {
          title: val('#contractFormV23 [name="title"]'),
          value: Number(val('#contractFormV23 [name="value"]') || 0),
          currencyCode: val('#contractFormV23 [name="currency"]') || undefined,
          startDate: val('#contractFormV23 [name="start"]') || undefined,
          endDate: val('#contractFormV23 [name="end"]') || undefined,
          paymentTerms: val('#contractFormV23 [name="paymentTerms"]') || undefined,
          scope: val('#contractFormV23 [name="scope"]') || undefined,
        }
        const saved = recordId
          ? await updateProcurementContract(recordId, body)
          : await createProcurementContract({ ...body, ...(quotationId ? { quotationId } : { vendorId: val('#contractFormV23 [name="vendor"]') }) })
        closeRuntimeOverlay()
        return {
          handled: true,
          reload: true,
          message: `${saved.contractNumber} ${recordId ? "saved" : "created as a draft"} for ${saved.vendorName ?? "the vendor"}. Activate it once it is signed.`,
        }
      }

      case "activate-contract-v23":
      case "terminate-contract-v23": {
        if (!has("contracts.manage")) return refuse("changing contracts")
        const id = String(detail.dataset.id ?? "")
        if (!rows("contractsV6").some((x) => x.recordId === id)) {
          return { handled: true, error: "That contract is no longer in the register. Refresh and try again." }
        }
        const activating = action === "activate-contract-v23"
        const out = await setProcurementContractStatus(id, activating ? "activate" : "terminate")
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${out.contractNumber} ${activating ? "is now active" : "was terminated"}.` }
      }

      // ---------------------------------------------------------------- journals
      case "post-journal": {
        // Paying an invoice creates its expense journal as PENDING. Posting is an accounting decision,
        // so the ledger's own permission check decides who may; a refusal is shown as it comes back.
        const j = byDisplayId("journals", detail.dataset.id)
        if (!j) return { handled: true, error: "That journal is no longer in the queue. Refresh and try again." }
        if (String(j.status).toUpperCase() !== "PENDING") {
          return { handled: true, error: `${j.id} is already ${String(j.status).toLowerCase()}; nothing was posted again.` }
        }
        await postJournalEntry(j.recordId)
        return { handled: true, reload: true, message: `${j.id} posted to the ledger.` }
      }

      // ---------------------------------------------------------------- document vault
      case "confirm-upload-document-v5":
      case "confirm-upload-document-v6": {
        if (!has("documents.manage")) return refuse("uploading documents")
        const formId = action === "confirm-upload-document-v5" ? "#uploadDocumentFormV5" : "#documentUploadFormV6"
        const form = document.querySelector<HTMLFormElement>(formId)
        if (!form) return { handled: true, error: "Open Upload document again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const files = [...(form.querySelector<HTMLInputElement>('[name="files"]')?.files ?? [])]
        if (!files.length) return { handled: true, error: "Attach at least one file." }
        const field = (n: string) => val(`${formId} [name="${n}"]`)
        const fd = new FormData()
        for (const f of files) fd.append("files", f)
        const folder = field("folder") || "General"
        fd.append("folder", folder)
        const extra: Record<string, string> = {
          name: field("name"),
          documentType: field("type"),
          relatedRecord: field("record"),
          classification: field("classification"),
          source: field("source"),
          description: field("description"),
        }
        for (const [k, v] of Object.entries(extra)) if (v) fd.append(k, v)
        const created = await uploadProcurementDocuments(fd)
        closeRuntimeOverlay()
        const n = Array.isArray(created) ? created.length : files.length
        return { handled: true, reload: true, message: `${n} document${n === 1 ? "" : "s"} filed in ${folder} for review.` }
      }

      // SRD §32: the vault's own upload and new-version forms. The file type and size are checked here so the message
      // is immediate; the server checks them again on the file's content.
      case "confirm-doc-upload-v23": {
        if (!has("documents.manage")) return refuse("uploading documents")
        const form = document.querySelector<HTMLFormElement>("#docUploadFormV23")
        if (!form) return { handled: true, error: "Open Upload document again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const files = [...(form.querySelector<HTMLInputElement>('[name="files"]')?.files ?? [])]
        if (!files.length) return { handled: true, error: "Attach at least one file." }
        const unsupported = files.find((f) => !/\.(pdf|docx|xlsx|xls|csv|jpg|jpeg|png)$/i.test(f.name))
        if (unsupported) return { handled: true, error: `${unsupported.name} is not a supported format. Upload a PDF, DOCX, XLSX, XLS, CSV, JPG, JPEG or PNG file.` }
        const large = files.find((f) => f.size > 100 * 1024 * 1024)
        if (large) return { handled: true, error: `${large.name} is larger than the 100 MB limit.` }
        const fd = new FormData()
        for (const f of files) fd.append("files", f)
        const f = (n: string) => val(`#docUploadFormV23 [name="${n}"]`)
        const folder = f("folder") || "General"
        fd.append("folder", folder)
        for (const [k, v] of Object.entries({ name: f("name"), documentType: f("type"), relatedRecord: f("record"), classification: f("classification"), description: f("description") })) if (v) fd.append(k, v)
        const created = await uploadProcurementDocuments(fd)
        closeRuntimeOverlay()
        const n = Array.isArray(created) ? created.length : files.length
        return { handled: true, reload: true, message: `${n} document${n === 1 ? "" : "s"} filed in ${folder} for review.` }
      }

      case "doc-status-v23": {
        if (!has("documents.manage")) return refuse("changing a document's status")
        const status = String(detail.dataset.status) as "approved" | "archived"
        const out = await setProcurementDocumentStatus(String(detail.dataset.id), status)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${out.name ?? "The document"} is now ${status === "approved" ? "approved" : "archived"}.` }
      }

      case "confirm-doc-version-v23": {
        if (!has("documents.manage")) return refuse("uploading document versions")
        const form = document.querySelector<HTMLFormElement>("#docVersionFormV23")
        if (!form) return { handled: true, error: "Open Upload new version again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const file = form.querySelector<HTMLInputElement>('[name="file"]')?.files?.[0]
        if (!file) return { handled: true, error: "Attach the new version's file." }
        if (!/\.(pdf|docx|xlsx|xls|csv|jpg|jpeg|png)$/i.test(file.name)) return { handled: true, error: `${file.name} is not a supported format. Upload a PDF, DOCX, XLSX, XLS, CSV, JPG, JPEG or PNG file.` }
        if (file.size > 100 * 1024 * 1024) return { handled: true, error: `${file.name} is larger than the 100 MB limit.` }
        const fd = new FormData()
        fd.append("file", file)
        const note = val('#docVersionFormV23 [name="note"]')
        if (note) fd.append("note", note)
        const out = await uploadProcurementDocumentVersion(String(detail.dataset.id), fd)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${out.name ?? "The document"} is now ${out.version}, awaiting review. The earlier versions are kept.` }
      }

      case "confirm-upload-version-v11": {
        if (!has("documents.manage")) return refuse("uploading document versions")
        const form = document.querySelector<HTMLFormElement>("#uploadVersionFormV11")
        if (!form) return { handled: true, error: "Open Upload version again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const file = form.querySelector<HTMLInputElement>('[name="file"]')?.files?.[0]
        if (!file) return { handled: true, error: "Attach the new version's file." }
        const doc = byDisplayId("documents", detail.dataset.id)
        if (doc) {
          const fd = new FormData()
          fd.append("file", file)
          const out = await uploadProcurementDocumentVersion(doc.recordId, fd)
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${doc.name} is now ${out.version}, awaiting review.` }
        }
        // This preview is a tender pack, plan, evaluation or other record rendered live from its
        // own data -- there is no stored file behind it yet to version. Store the upload as the
        // vault's first document for that record instead of refusing.
        const name = document.querySelector("#modalTitle")?.textContent?.trim() || detail.dataset.id || "Uploaded document"
        const fd = new FormData()
        fd.append("files", file)
        fd.append("folder", "General")
        fd.append("name", name)
        const ref = detail.dataset.id ?? ""
        fd.append("relatedRecord", ref)
        const note = val('#uploadVersionFormV11 [name="note"]')
        if (note) fd.append("description", note)
        try {
          await uploadProcurementDocuments(fd)
        } catch (err) {
          // A generated record's id ("TPL-PLAN-01") is a label, not a record number the server can link to: file it unlinked, naming the record.
          if (!/No record numbered/i.test(String((err as { message?: string })?.message ?? ""))) throw err
          const plain = new FormData()
          plain.append("files", file)
          plain.append("folder", "General")
          plain.append("name", name)
          plain.append("description", [note, `Filed against ${ref}`].filter(Boolean).join(" · "))
          await uploadProcurementDocuments(plain)
        }
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${name} filed in the Document Vault, linked to ${detail.dataset.id}.` }
      }

      // ------------------------------------------------------------ invoice payment
      case "confirm-record-payment-v23": {
        if (!has("invoices.pay")) return refuse("paying invoices")
        const form = document.querySelector<HTMLFormElement>("#paymentFormV23")
        if (!form) return { handled: true, error: "Open Record payment again; the payment form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const invoiceId = val("#paymentInvoiceV23")
        const inv = rows("invoices").find((i) => i.recordId === invoiceId)
        if (!inv?.payable) return { handled: true, error: "That invoice is no longer awaiting payment. Refresh and try again." }
        const proof = form.querySelector<HTMLInputElement>('[name="proof"]')?.files?.[0]
        if (!proof) return { handled: true, error: "Attach the proof of payment." }
        const method = val('#paymentFormV23 [name="method"]') || "BANK"
        const bankId = val('#paymentFormV23 [name="bank"]')
        if (!bankId) {
          return { handled: true, error: "Choose the account the payment was made from. If none is listed, Accounting must add one in Cashbook first." }
        }
        const paymentDate = val('#paymentFormV23 [name="paymentDate"]')
        const fd = new FormData()
        fd.append("proofOfPayment", proof)
        fd.append("paymentAmount", String(inv.outstanding ?? inv.amount))
        fd.append("paymentDate", new Date(paymentDate).toISOString())
        fd.append("paymentMethod", method)
        fd.append("bankAccountId", bankId)
        const reference = val('#paymentFormV23 [name="reference"]')
        if (reference) fd.append("paymentReference", reference)
        const notes = val('#paymentFormV23 [name="notes"]')
        if (notes) fd.append("notes", notes)
        await payProcurementInvoice(invoiceId, fd)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${inv.id} paid to ${inv.vendor}. Its expense journal was created and awaits posting in Accounts.` }
      }

      case "run-compliance-reminders-v6":
      case "run-reminder-automation-v7": {
        if (!has("vendors.manage") && !has("vendors.approve") && !live.access?.isPrivileged) {
          return refuse("running the vendor compliance check")
        }
        // Brings every vendor's status in step with today's dates and sends the pre-expiry alerts to authorised users.
        const r = await runVendorComplianceCycle()
        const alerts = Number(r?.notifications ?? 0)
        return {
          handled: true,
          reload: true,
          message: `Compliance check done: ${Number(r?.synced ?? 0)} vendor(s) brought up to date, ${alerts} alert${alerts === 1 ? "" : "s"} sent to ${Number(r?.recipients ?? 0)} authorised user(s) (${Number(r?.expiring ?? 0)} expiring, ${Number(r?.expired ?? 0)} expired).`,
        }
      }

      case "preview-built-report-v5":
      case "create-report-template-v5":
      case "build-report-v5":
      case "build-report": {
        const w = window as unknown as { __pr23ExportFile?: (format: string, title: string) => void }
        const name =
          val('#reportBuilderV5 [name="name"]') ||
          detail.dataset.id ||
          "Procurement register export"
        if (typeof w.__pr23ExportFile === "function") {
          w.__pr23ExportFile("xls", name)
          closeRuntimeOverlay()
          return { handled: true, message: `${name} exported from live procurement records.` }
        }
        return {
          handled: true,
          error: "Open Reports Vault and use Run on a template to export the live registers.",
        }
      }

      case "save-procurement-settings-v23": {
        if (!has("audit.view")) return refuse("changing procurement settings")
        const F = "#procurementSettingsFormV23"
        const body: Record<string, unknown> = {}
        const num = (name: string) => {
          const v = val(`${F} [name="${name}"]`)
          if (v === "") return
          const n = Number(v)
          if (Number.isFinite(n)) body[name] = n
        }
        num("matchPriceVariancePct")
        num("matchQtyTolerancePct")
        num("overDeliveryTolerancePct")
        const prFmt = val(`${F} [name="prNumberFormat"]`)
        if (prFmt) body.prNumberFormat = prFmt
        const poFmt = val(`${F} [name="poNumberFormat"]`)
        if (poFmt) body.poNumberFormat = poFmt
        const rfqFmt = val(`${F} [name="rfqNumberFormat"]`)
        if (rfqFmt) body.rfqNumberFormat = rfqFmt
        const fx = val(`${F} [name="consolidationFxCurrencyId"]`)
        if (fx) body.consolidationFxCurrencyId = fx
        await updateProcurementSettings(body)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: "Procurement settings saved." }
      }

      case "enqueue-rpa-job-v23": {
        if (!has("audit.view")) return refuse("enqueueing RPA jobs")
        const jobType = val('#rpaJobFormV23 [name="jobType"]') || detail.dataset.id || "GENERIC"
        await enqueueRpaJob({ jobType, payload: { source: "procurement-v23" } })
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `RPA job queued (${jobType}).` }
      }

      case "view-ai-usage-v23": {
        if (!has("audit.view")) return refuse("viewing AI usage")
        const summary = await getAiUsageSummary(30)
        const parts = Array.isArray((summary as any)?.byFeature)
          ? (summary as any).byFeature.map((f: any) => `${f.feature}: ${f.units} unit(s)`).join("; ")
          : "No AI usage recorded in the last 30 days."
        return { handled: true, message: parts || "No AI usage recorded in the last 30 days." }
      }

      default:
        return { handled: false }
    }
  } catch (err) {
    return { handled: true, error: errorText(err, "The procurement request failed.") }
  }
}
