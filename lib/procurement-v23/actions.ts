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
  uploadProcurementDocumentVersion,
  uploadProcurementDocuments,
  approveGoodsReceivedNote,
  approveProcurementInvoice,
  approveRequisition,
  captureProcurementInvoice,
  createGoodsReceivedNote,
  createPurchaseOrder,
  createRequisition,
  createRfq,
  createVendor,
  extractInvoiceForCapture,
  payProcurementInvoice,
  postJournalEntry,
  readProcurementError,
  rejectGoodsReceivedNote,
  rejectProcurementInvoice,
  rejectQuotation,
  rejectRequisition,
  scoreQuotation,
  sendPurchaseOrder,
  submitRequisition,
  updateRequisition,
} from "@/lib/api/procurement-v23-api"
import type { ProcurementV23LivePayload } from "@/lib/procurement-v23/live-loaders"

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
  "save-pr-v11",
  "submit-pr-v11",
  "approve-pr-v11",
  "confirm-reject-pr-v11",
  "approve-prompt-v6",
  "confirm-reject-approval-v6",
  "register-vendor-confirm",
  "register-vendor-confirm-v6",
  "send-po-v6",
  "create-send-tender-v13",
  "create-send-tender-from-preview-v13",
  "save-scores",
  "save-bid-winner-v6",
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
  "submit-plan",
  "save-contract-v6",
  "activate-contract-v23",
  "terminate-contract-v23",
  "confirm-upload-document-v5",
  "confirm-upload-document-v6",
  "confirm-upload-version-v11",
  "post-journal",
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
  // An RFQ is created when it is sent; the backend keeps no unsent drafts.
  "save-tender",
  "save-tender-v13",
  "submit-recommendation",
  "submit-quote-recommendation-v5",
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
  "create-report-template-v5",
  "create-role-confirm",
  "esign-sign-v6",
  "esign-remind-v6",
  // Vendor Registry "Run now": no reminder automation exists on the backend.
  "run-compliance-reminders-v6",
  "run-reminder-automation-v7",
  // OCR extraction of an uploaded invoice is not connected; manual capture is.
  "extract-invoice-v5",
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
  "run-ocr",
  "scan-delivery",
  "upload-document",
  // A second sweep, of the runtime's switch-case handlers: each toasts a finished outcome, some
  // with invented figures ("OCR confidence 94.2%", "three dormant assignments"), and saves nothing.
  "vendor-save-draft",
  "vendor-submit-bid",
  "extract-invoice",
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
  // Reading an invoice costs an LLM call and stores an intake, so the grant is checked before the upload.
  "run-ocr-v5": { grants: ["intake.manage"], what: "capturing supplier invoices" },
  "upload-invoice-v5": { grants: ["intake.manage"], what: "capturing supplier invoices" },
}

/** The refusal to show for an opener the signed-in role cannot complete, or null to let it open. */
export function refusedOpener(action: string, live: ProcurementV23LivePayload | null): string | null {
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
        const department = live.access?.department
        if (!department) {
          return {
            handled: true,
            error: "Your account is not assigned to a department, and a requisition is raised against one. Ask an administrator to set your department.",
          }
        }
        const title = val('#prForm [name="title"]')
        const itemName = val('#prForm [name="item"]')
        const quantity = Number(val('#prForm [name="qty"]'))
        const missing: string[] = []
        if (!title) missing.push("requirement title")
        if (!itemName) missing.push("line item")
        if (!(quantity > 0)) missing.push("a quantity above zero")
        if (missing.length) return { handled: true, error: `Cannot raise the requisition — missing ${missing.join(", ")}.` }

        const created = await createRequisition({
          title,
          department,
          priority: "MEDIUM",
          justification: val('#prForm [name="motivation"]') || undefined,
          sourcingCategory: val('#prForm [name="category"]') || undefined,
          items: [
            {
              itemName,
              quantity,
              unit: val('#prForm [name="uom"]') || undefined,
              // The requester's unit estimate; it stays internal and is never copied onto an RFQ.
              unitPrice: Number(val('#prForm [name="price"]')) > 0 ? Number(val('#prForm [name="price"]')) : undefined,
            },
          ],
        })
        const number = created?.requisitionNumber ?? "The requisition"
        if (action === "save-pr") {
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${number} saved as a draft.` }
        }
        await submitRequisition(created.id)
        closeRuntimeOverlay()
        return {
          handled: true,
          reload: true,
          message: `${number} submitted to the ${department} department head for approval.`,
        }
      }

      case "save-pr-v11":
      case "submit-pr-v11": {
        // The requester corrects their own draft or rejected requisition, then saves it or submits it.
        const r = byDisplayId("requisitions", detail.dataset.id)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        const raw = String(r.rawStatus ?? "").toUpperCase()
        if (raw !== "DRAFT" && raw !== "REJECTED") {
          return { handled: true, error: `${r.id} is ${String(r.status).toLowerCase()} and can no longer be changed by its requester.` }
        }
        const form = document.querySelector<HTMLFormElement>("#editPrFormV11")
        if (form && !form.reportValidity()) return { handled: true }
        const title = val('#editPrFormV11 [name="title"]')
        if (!title) return { handled: true, error: "A requirement title is required." }
        await updateRequisition(r.recordId, { title, justification: val('#editPrFormV11 [name="justification"]') || null })
        if (action === "save-pr-v11") {
          closeRuntimeOverlay()
          return { handled: true, reload: true, message: `${r.id} saved.` }
        }
        await submitRequisition(r.recordId)
        closeRuntimeOverlay()
        const head = r.department ? `the ${r.department} department head` : "the department head"
        return {
          handled: true,
          reload: true,
          message: raw === "REJECTED" ? `${r.id} corrected and resubmitted to ${head}.` : `${r.id} submitted to ${head} for approval.`,
        }
      }

      case "approve-pr-v11": {
        const r = byDisplayId("requisitions", detail.dataset.id)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        await approveRequisition(r.recordId)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${r.id} approved.` }
      }

      case "confirm-reject-pr-v11": {
        const r = byDisplayId("requisitions", detail.dataset.id)
        if (!r) return { handled: true, error: "That requisition is no longer in your register. Refresh and try again." }
        const form = document.querySelector<HTMLFormElement>("#rejectPrFormV11")
        if (form && !form.reportValidity()) return { handled: true }
        const decision = val('#rejectPrFormV11 [name="decision"]')
        const reason = val('#rejectPrFormV11 [name="reason"]')
        if (!reason) return { handled: true, error: "A reason is required to reject a requisition." }
        // The backend has one outcome, REJECTED, which the requester can correct and resubmit.
        // "Return" and "request information" are recorded in the reason rather than invented as states.
        await rejectRequisition(r.recordId, decision && decision !== "Reject requisition" ? `${decision}: ${reason}` : reason)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${r.id} returned to the requester with your reason.` }
      }

      // ----------------------------------------------------------- approval centre
      case "approve-prompt-v6": {
        const p = rows("approvalPromptsV6").find((x) => x.id === detail.dataset.id)
        if (!p) return { handled: true, error: "That approval is no longer pending. Refresh and try again." }
        switch (p.kind) {
          case "requisition":
            await approveRequisition(p.targetId)
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
            await approveProcurementInvoice(p.targetId, true)
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
        const withDecision = decision && decision !== "Reject" ? `${decision}: ${reason}` : reason
        switch (p.kind) {
          case "requisition":
            await rejectRequisition(p.targetId, withDecision)
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
          contactPerson: val(`${formId} [name="contact"]`) || undefined,
          email: val(`${formId} [name="email"]`) || undefined,
          phone: val(`${formId} [name="phone"]`) || undefined,
          address: val(`${formId} [name="address"]`) || undefined,
          taxClearanceExpiryDate: val(`${formId} [name="taxExpiry"]`) || val(`${formId} [name="itf"]`) || undefined,
        })
        closeRuntimeOverlay()
        // Bank details are held back on purpose: they are owned by finance
        // (procurement.vendors.banks.manage) and are the field a payment-redirection fraud changes.
        const bankTyped = val(`${formId} [name="accountNumber"]`) || val(`${formId} [name="bank"]`)
        const cleared = String(created?.taxComplianceStatus ?? "").toUpperCase() === "ACTIVE"
        return {
          handled: true,
          reload: true,
          message: `${created?.name ?? name} registered${cleared ? " with a valid tax clearance" : " and placed in compliance review"}.${bankTyped ? " Bank details were not saved here; Finance records them." : ""}`,
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

      case "create-send-tender-v13":
      case "create-send-tender-from-preview-v13": {
        if (!has("rfq.manage")) return refuse("sending RFQs")
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
            unit: row.querySelector<HTMLSelectElement>('[name="lineUom"]')?.value || undefined,
            quantity: Number(row.querySelector<HTMLInputElement>('[name="lineQty"]')?.value || 0),
          }))
          .filter((l) => l.itemName && l.quantity > 0)
        const missing: string[] = []
        if (!title) missing.push("a title")
        if (!requisitionId && !lines.length) missing.push("an approved requisition or at least one line")
        if (!vendorIds.length) missing.push("at least one eligible vendor")
        if (missing.length) return { handled: true, error: `Cannot send the RFQ — it needs ${missing.join(", ")}.` }

        const close = String(fd.get("close") ?? "")
        // Vendors cannot quote after the closing date, so an RFQ sent with one already past is dead on arrival.
        if (close && new Date(close).getTime() <= Date.now()) {
          return { handled: true, error: "The closing date has already passed. Choose a future closing date and send again." }
        }
        const source = rows("requisitions").find((r) => r.recordId === requisitionId)
        const commercial = weights[1]
        const created = await createRfq({
          purchaseRequisitionId: requisitionId || undefined,
          title,
          description: [fd.get("objective"), fd.get("scope")].map((v) => String(v ?? "").trim()).filter(Boolean).join("\n\n") || undefined,
          vendorIds,
          rfqDeadline: close ? new Date(close).toISOString() : undefined,
          items: lines.length ? lines : undefined,
          visibility: String(fd.get("method")) === "Open tender" ? "PUBLIC_LISTING" : "INVITED_ONLY",
          // The backend weighs price against everything else: commercial is price, and
          // technical, delivery and risk together are the non-price share.
          priceWeight: commercial / 100,
          technicalWeight: (100 - commercial) / 100,
        })
        closeRuntimeOverlay()
        const count = vendorIds.length
        return {
          handled: true,
          reload: true,
          message: `${created?.rfqNumber ?? "The RFQ"} sent to ${count} vendor${count === 1 ? "" : "s"}${!lines.length && source ? `, with the lines of ${source.id}` : ""}.`,
        }
      }

      // ------------------------------------------------------- evaluation and award
      case "save-scores": {
        if (!has("quotations.manage")) return refuse("scoring quotations")
        const inputs = [...document.querySelectorAll<HTMLInputElement>("[data-score-quote]")]
        const changed = inputs.filter((i) => i.value.trim() !== "" && i.value.trim() !== (i.dataset.scoreWas ?? ""))
        if (!changed.length) return { handled: true, error: "Enter or change at least one technical score before saving." }
        if (changed.some((i) => !(Number(i.value) >= 0 && Number(i.value) <= 100))) {
          return { handled: true, error: "Technical scores must be between 0 and 100." }
        }
        for (const input of changed) {
          await scoreQuotation(String(input.dataset.scoreQuote), { score: Number(input.value) })
        }
        const n = changed.length
        return { handled: true, reload: true, message: `Technical score${n === 1 ? "" : "s"} saved for ${n} bid${n === 1 ? "" : "s"}.` }
      }

      case "save-bid-winner-v6": {
        if (!has("rfq.award")) return refuse("awarding quotations")
        const [tenderId, quotationId] = String(detail.dataset.id ?? "").split("|")
        const quote = rows("quotationsLive").find((q) => q.recordId === quotationId)
        if (!quote) return { handled: true, error: "Select a bidder from this tender's open quotations." }
        if (!quote.open) return { handled: true, error: `${quote.id} is ${String(quote.status).toLowerCase()} and cannot be awarded.` }
        const result = await acceptQuotation(quotationId, val("#awardRationaleV6") || undefined)
        closeRuntimeOverlay()
        const po = (result as any)?.purchaseOrder?.poNumber
        return { handled: true, reload: true, message: `${tenderId} awarded to ${quote.vendor}${po ? `; ${po} raised` : ""}.` }
      }

      // ------------------------------------------------------------ goods received
      case "create-grn-confirm": {
        if (!has("receiving.manage")) return refuse("recording goods received")
        const form = document.querySelector<HTMLFormElement>("#grnFormV23")
        if (!form) return { handled: true, error: "Open Record GRN again; the receipt form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const poId = val("#grnPoV23")
        const po = rows("orders").find((o) => o.recordId === poId)
        const qty = (attr: string, id: string) =>
          Number(form.querySelector<HTMLInputElement>(`[${attr}="${CSS.escape(id)}"]`)?.value || 0)
        const items = [...form.querySelectorAll<HTMLInputElement>("[data-grn-received]")]
          .map((input) => {
            const id = String(input.dataset.grnReceived)
            return {
              purchaseOrderItemId: id,
              quantityReceived: Number(input.value || 0),
              quantityAccepted: qty("data-grn-accepted", id),
              quantityRejected: qty("data-grn-rejected", id),
            }
          })
          .filter((l) => l.quantityReceived > 0)
        if (!items.length) return { handled: true, error: "Enter a received quantity on at least one line." }
        if (items.some((l) => Math.abs(l.quantityAccepted + l.quantityRejected - l.quantityReceived) > 1e-9)) {
          return { handled: true, error: "On each line, accepted plus rejected must equal the quantity received." }
        }
        const received = val('#grnFormV23 [name="receivedDate"]')
        const grn = await createGoodsReceivedNote({
          purchaseOrderId: poId,
          receivedDate: received ? new Date(received).toISOString() : undefined,
          items,
        })
        closeRuntimeOverlay()
        return {
          handled: true,
          reload: true,
          message: `${grn?.grnNumber ?? "The goods received note"} recorded against ${po?.id ?? "the purchase order"} and sent for inspection approval.`,
        }
      }

      // ----------------------------------------------------------- invoice capture
      case "confirm-capture-invoice-v5": {
        if (!has("intake.manage")) return refuse("capturing supplier invoices")
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
        const invoice = await captureProcurementInvoice({
          purchaseOrderId: poId,
          vendorId: String(po.vendorId),
          invoiceDate: new Date(invoiceDate).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          currencyId: po.currencyId ?? undefined,
          items,
        })
        closeRuntimeOverlay()
        return {
          handled: true,
          reload: true,
          message: `${invoice?.invoiceNumber ?? "The invoice"} captured against ${po.id} and sent to Finance for approval.`,
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
        if (!/\.pdf$/i.test(file.name)) {
          return {
            handled: true,
            error: "The invoice has to be a PDF. A photograph or a scan has to be saved as a PDF carrying selectable text before it can be read.",
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
            error: "Nothing could be read from that PDF — most likely a scan with no text layer. Capture this invoice by hand.",
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
          department: val('#planFormV23 [name="department"]') || undefined,
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
          estimatedValue: Number(val('#planItemFormV23 [name="estimatedValue"]') || 0),
          department: val('#planItemFormV23 [name="department"]') || undefined,
        })
        closeRuntimeOverlay()
        const fmt = (n: unknown) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        return { handled: true, reload: true, message: `Line added to ${plan.planNumber}: ${fmt(plan.plannedValue)} planned against a budget of ${fmt(plan.budget)}.` }
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

      case "confirm-upload-version-v11": {
        if (!has("documents.manage")) return refuse("uploading document versions")
        const form = document.querySelector<HTMLFormElement>("#uploadVersionFormV11")
        if (!form) return { handled: true, error: "Open Upload version again; the form is not on screen." }
        if (!form.reportValidity()) return { handled: true }
        const doc = byDisplayId("documents", detail.dataset.id)
        if (!doc) {
          return { handled: true, error: "Only a stored vault document takes a new version; templates and generated records have no stored file." }
        }
        const file = form.querySelector<HTMLInputElement>('[name="file"]')?.files?.[0]
        if (!file) return { handled: true, error: "Attach the new version's file." }
        const fd = new FormData()
        fd.append("file", file)
        const out = await uploadProcurementDocumentVersion(doc.recordId, fd)
        closeRuntimeOverlay()
        return { handled: true, reload: true, message: `${doc.name} is now ${out.version}, awaiting review.` }
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

      default:
        return { handled: false }
    }
  } catch (err) {
    return { handled: true, error: errorText(err, "The procurement request failed.") }
  }
}
