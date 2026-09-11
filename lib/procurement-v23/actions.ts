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
  approveGoodsReceivedNote,
  approveProcurementInvoice,
  approveRequisition,
  createRequisition,
  createVendor,
  readProcurementError,
  rejectGoodsReceivedNote,
  rejectQuotation,
  rejectRequisition,
  sendPurchaseOrder,
  submitRequisition,
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
  "approve-pr-v11",
  "confirm-reject-pr-v11",
  "approve-prompt-v6",
  "confirm-reject-approval-v6",
  "register-vendor-confirm",
  "register-vendor-confirm-v6",
  "send-po-v6",
] as const

/**
 * Write actions whose runtime handler only edits the in-browser demo store and toasts success.
 * Until each is connected it is refused with that said plainly, so nobody believes a tender was
 * issued or a receipt recorded when nothing was saved.
 */
export const NOT_YET_LIVE_ACTIONS = [
  "create-tender-confirm",
  "create-send-tender-v13",
  "create-send-tender-from-preview-v13",
  "save-tender",
  "save-tender-v13",
  "confirm-bid-winner-v6",
  "save-bid-winner-v6",
  "submit-recommendation",
  "submit-quote-recommendation-v5",
  "create-grn-confirm",
  "confirm-capture-invoice-v5",
  "approve-invoice",
  "approve-match-v5",
  "submit-po-v6",
  "save-po-v6",
  "confirm-send-selected-po-v11",
  "save-pr-v11",
  "create-plan-confirm",
  "create-plan-confirm-v5",
  "submit-plan",
  "save-plan-item",
  "save-plan-line-v6",
  "save-contract-v6",
  "save-and-esign-contract-v6",
  "post-journal",
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
  "run-report-template-v5",
  "create-report-template-v5",
  "create-role-confirm",
  "esign-sign-v6",
  "esign-remind-v6",
  // Vendor Registry "Run now": no reminder automation exists on the backend.
  "run-compliance-reminders-v6",
  "run-reminder-automation-v7",
])

/**
 * True for an action that would record something the backend never receives. In a live session
 * these are refused with that said, rather than letting the runtime report a save that did not happen.
 */
export function isUnconnectedWrite(action: string): boolean {
  if ((LIVE_ACTIONS as readonly string[]).includes(action)) return false
  return /^(confirm|save|submit)-/.test(action) || UNCONNECTED_TERMINAL_STEPS.has(action)
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
          items: [{ itemName, quantity, unit: val('#prForm [name="uom"]') || undefined }],
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
          default:
            return { handled: true, error: "This approval type is not connected to the backend yet." }
        }
        closeRuntimeOverlay()
        const done: Record<string, string> = {
          requisition: `${p.record} approved.`,
          award: `${p.record} awarded; the purchase order has been raised.`,
          grn: `${p.record} accepted on inspection.`,
          invoice: `${p.record} approved for payment.`,
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
            return { handled: true, error: "Rejecting a procurement invoice is not supported by the backend yet. Nothing was changed." }
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

      default:
        return { handled: false }
    }
  } catch (err) {
    return { handled: true, error: errorText(err, "The procurement request failed.") }
  }
}
