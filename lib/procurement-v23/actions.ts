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
  captureProcurementInvoice,
  createGoodsReceivedNote,
  createRequisition,
  createRfq,
  createVendor,
  readProcurementError,
  rejectGoodsReceivedNote,
  rejectQuotation,
  rejectRequisition,
  scoreQuotation,
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
  "create-send-tender-v13",
  "create-send-tender-from-preview-v13",
  "save-scores",
  "save-bid-winner-v6",
  "create-grn-confirm",
  "confirm-capture-invoice-v5",
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
  // OCR extraction of an uploaded invoice is not connected; manual capture is.
  "extract-invoice-v5",
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

      // ------------------------------------------------------------ tender builder
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

      default:
        return { handled: false }
    }
  } catch (err) {
    return { handled: true, error: errorText(err, "The procurement request failed.") }
  }
}
