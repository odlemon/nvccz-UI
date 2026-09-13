/**
 * Procurement V23 workflows beyond the 17 actions steps: the rest of every form a person fills in,
 * the second half of each approval (reject as well as approve), and the checks that must refuse.
 *
 * Every step works through the real screens as a seeded persona and then checks the outcome through
 * the API. A step arranges its own starting records through the API where the screen under test is
 * not the one that creates them. Local only: it writes records, and it sends no email only because
 * the local API blocks mail.
 *
 * Run:  node scripts/_uat/procurement-v23-workflows.mjs [--only=W1,W4]
 */
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const staff = MODULES.find((m) => m.portal === "staff")
const API = process.env.API || "http://127.0.0.1:3009/api"
const PASSWORD = "admin123"
const RUN = Date.now()
const PDF = { name: "uat.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") }
const results = []

function record(ok, step, detail) {
  results.push({ ok, step, detail })
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${step.padEnd(58)} ${detail}`)
}

const tokens = {}
async function token(email) {
  if (!tokens[email]) {
    const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: PASSWORD, portal: "staff" }) }).then((x) => x.json())
    tokens[email] = r.token || r?.data?.token
  }
  return tokens[email]
}
async function api(email, path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${await token(email)}` } })
  return (await res.json().catch(() => ({})))?.data
}
async function apiCall(email, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token(email)}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, data: json?.data, message: json?.message }
}
const list = (d) => (Array.isArray(d) ? d : d?.vendors ?? d?.items ?? [])

async function session(email, route) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  await seedAuth(context, staff.base, email, staff.portal)
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 200)))
  await page.goto(staff.base + route, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForSelector(".procurement-v23-root", { timeout: 150000 })
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: 150000 })
  await page.waitForTimeout(800)
  return { browser, page, errors }
}

/** Toasts from both the host (sonner) and the runtime, whichever speaks. */
async function toasts(page) {
  await page.waitForSelector("[data-sonner-toast], #toasts .toast", { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(500)
  return page.$$eval("[data-sonner-toast], #toasts .toast", (els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim()).join(" | ")).catch(() => "")
}
const suffix = (errors) => (errors.length ? ` · page errors: ${errors.join(" / ")}` : "")
const visible = async (page, selector, timeout = 15000) => Boolean(await page.waitForSelector(selector, { state: "visible", timeout }).catch(() => null))

/** Open a register row's action menu and return the actions it offers. */
async function rowMenu(page, rowText) {
  const row = page.locator("table tbody tr", { hasText: rowText }).first()
  await row.waitFor({ timeout: 20000 })
  const trigger = row.locator('[data-action="row-actions-v16"]')
  if (await trigger.count()) {
    await trigger.first().click()
    await page.waitForTimeout(400)
  }
  return page.$$eval("[data-action]", (els) => [...new Set(els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.dataset.action))])
}

async function arrangeRequisition(title, { submit = true, approve = false } = {}) {
  const requester = "proc.requester@nts.local"
  const access = await api(requester, "/procurement/me/access")
  const made = await apiCall(requester, "POST", "/procurement/requisitions", {
    title, department: access?.department, priority: "MEDIUM",
    items: [{ itemName: "UAT workflow item", quantity: 4, unit: "Each", unitPrice: 75 }],
  })
  if (made.status !== 201) throw new Error(`could not arrange a requisition: ${made.status} ${made.message}`)
  if (submit) await apiCall(requester, "PUT", `/procurement/requisitions/${made.data.id}/submit`)
  if (approve) await apiCall("perf.deptmgr@nts.local", "PUT", `/procurement/requisitions/${made.data.id}/approve`, {})
  return (await api(requester, `/procurement/requisitions/${made.data.id}`)) ?? made.data
}

const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.slice(7) || "").split(",").map((s) => s.trim()).filter(Boolean)
async function step(label, fn) {
  if (ONLY.length && !ONLY.includes(label.split(" ")[0])) return
  const opened = []
  const open = async (email, route) => {
    const s = await session(email, route)
    opened.push(s.browser)
    return s
  }
  try {
    await fn(open, label)
  } catch (err) {
    record(false, label, `threw: ${String(err?.message || err).split("\n")[0]}`)
  } finally {
    for (const b of opened) await b.close().catch(() => {})
  }
}

// ---------------------------------------------------------------- W1 draft requisition, edited, then submitted
await step("W1 Requester saves a draft, edits it and submits it", async (open, label) => {
  const email = "proc.requester@nts.local"
  const title = `UAT WF draft ${RUN}`
  const { page, errors } = await open(email, "/procurement-v23/requisitions")
  await page.click('[data-action="create-requisition"]')
  await page.waitForSelector("#prForm")
  // Category is required (cycle seven): choose the first real one; option 0 is "Choose a category".
  await page.selectOption('#prForm select[name="category"]', { index: 1 })
  await page.fill('#prForm [name="title"]', title)
  await page.fill('#prForm [name="item"]', "Printer paper")
  await page.fill('#prForm [name="qty"]', "10")
  await page.fill('#prForm [name="motivation"]', "Paper for the Operations office.")
  await page.click('[data-action="save-pr"]')
  const saveToast = await toasts(page)
  const draft = list(await api(email, "/procurement/requisitions/my")).find((r) => r.title === title)
  if (draft?.status !== "DRAFT") return record(false, label, `save draft -> ${draft?.status ?? "nothing saved"} · "${saveToast}"${suffix(errors)}`)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: 60000 })
  await page.waitForTimeout(1200)
  const offered = await rowMenu(page, draft.requisitionNumber)
  const editAction = ["edit-pr-v11", "edit-record-v5", "edit-pr"].find((a) => offered.includes(a))
  if (!editAction) return record(false, label, `${draft.requisitionNumber} DRAFT saved, but its row offers no edit (menu: ${offered.filter((a) => /pr|edit|submit|view/.test(a)).join(", ")})${suffix(errors)}`)
  await page.click(`[data-action="${editAction}"][data-id="${draft.requisitionNumber}"]`)
  await page.waitForTimeout(800)
  const formButtons = await page.$$eval(":is(#modalLayer.open, #drawerLayer.open) [data-action]", (els) => els.map((e) => `${e.dataset.action}:${e.textContent.trim()}`))
  const titleField = page.locator(':is(#modalLayer.open, #drawerLayer.open) input[name="title"]').first()
  if (await titleField.count()) await titleField.fill(`${title} edited`)
  const submitAction = ["submit-pr", "submit-pr-v11", "save-pr-v11"].find((a) => formButtons.some((b) => b.startsWith(`${a}:`)))
  if (!submitAction) return record(false, label, `${draft.requisitionNumber}: edit form has no submit (buttons: ${formButtons.join(" | ")})${suffix(errors)}`)
  await page.click(`:is(#modalLayer.open, #drawerLayer.open) [data-action="${submitAction}"]`)
  const submitToast = await toasts(page)
  const mine = list(await api(email, "/procurement/requisitions/my"))
  const same = mine.find((r) => r.id === draft.id)
  const duplicates = mine.filter((r) => String(r.title).startsWith(title)).length
  record(
    same?.status === "PENDING_APPROVAL" && duplicates === 1,
    label,
    `${draft.requisitionNumber}: ${editAction} > ${submitAction} -> ${same?.status}, title "${same?.title}", ${duplicates} requisition(s) with this title · "${submitToast}"${suffix(errors)}`,
  )
})

// ---------------------------------------------------------------- W2 department head rejects with a reason
await step("W2 Operations head rejects a requisition with a reason", async (open, label) => {
  const head = "perf.deptmgr@nts.local"
  const pr = await arrangeRequisition(`UAT WF reject ${RUN}`)
  const { page, errors } = await open(head, "/procurement-v23/requisitions")
  const offered = await rowMenu(page, pr.requisitionNumber)
  // A department head decides from the Review modal: Reject or return, or Approve requisition.
  if (!offered.includes("review-pr-v11")) return record(false, label, `${pr.requisitionNumber}: no Review control (menu: ${offered.filter((a) => /pr|reject|approve|review/.test(a)).join(", ")})${suffix(errors)}`)
  await page.click(`[data-action="review-pr-v11"][data-id="${pr.requisitionNumber}"]`)
  if (!(await visible(page, `[data-action="reject-pr-v11"][data-id="${pr.requisitionNumber}"]`))) return record(false, label, `${pr.requisitionNumber}: Review opened without Reject or return${suffix(errors)}`)
  await page.click(`[data-action="reject-pr-v11"][data-id="${pr.requisitionNumber}"]`)
  await page.waitForSelector("#rejectPrFormV11")
  const reason = `Quantity is not justified ${RUN}`
  await page.fill('#rejectPrFormV11 [name="reason"]', reason)
  await page.click(`[data-action="confirm-reject-pr-v11"][data-id="${pr.requisitionNumber}"]`)
  const toast = await toasts(page)
  const after = await api(head, `/procurement/requisitions/${pr.id}`)
  record(
    after?.status === "REJECTED" && String(after?.rejectionReason ?? "").includes(String(RUN)),
    label,
    `${pr.requisitionNumber} -> ${after?.status}, reason "${String(after?.rejectionReason ?? "").slice(0, 60)}" · "${toast}"${suffix(errors)}`,
  )
})

// ---------------------------------------------------------------- W3 requester corrects a rejected requisition
await step("W3 Requester corrects a rejected requisition and resubmits it", async (open, label) => {
  const email = "proc.requester@nts.local"
  // Only one this suite rejected (W2, "UAT WF …"): dev also carries the demo dataset, whose records are not the suite's to change.
  const pr = list(await api(email, "/procurement/requisitions/my")).find((r) => r.status === "REJECTED" && String(r.title).startsWith("UAT WF"))
  if (!pr) return record(false, label, "no rejected UAT WF requisition — W2 rejects one")
  const { page, errors } = await open(email, "/procurement-v23/requisitions")
  const offered = await rowMenu(page, pr.requisitionNumber)
  const editAction = ["edit-pr-v11", "resubmit-pr-v11", "edit-record-v5"].find((a) => offered.includes(a))
  if (!editAction) return record(false, label, `${pr.requisitionNumber} REJECTED: its row offers no way to correct or resubmit (menu: ${offered.filter((a) => /pr|edit|submit|view/.test(a)).join(", ")})${suffix(errors)}`)
  await page.click(`[data-action="${editAction}"][data-id="${pr.requisitionNumber}"]`)
  await page.waitForTimeout(800)
  // The API refuses a resubmission with nothing changed since the rejection, so correct it first.
  const titleField = page.locator(':is(#modalLayer.open, #drawerLayer.open) input[name="title"]').first()
  if (await titleField.count()) await titleField.fill(`${pr.title} (corrected ${RUN})`)
  const buttons = await page.$$eval(":is(#modalLayer.open, #drawerLayer.open) [data-action]", (els) => els.map((e) => e.dataset.action))
  const submitAction = ["submit-pr", "submit-pr-v11", "save-pr-v11"].find((a) => buttons.includes(a))
  if (!submitAction) return record(false, label, `${pr.requisitionNumber}: ${editAction} opened no submit (buttons: ${buttons.join(", ")})${suffix(errors)}`)
  await page.click(`:is(#modalLayer.open, #drawerLayer.open) [data-action="${submitAction}"]`)
  const toast = await toasts(page)
  const after = await api(email, `/procurement/requisitions/${pr.id}`)
  record(after?.status === "PENDING_APPROVAL", label, `${pr.requisitionNumber}: ${editAction} > ${submitAction} -> ${after?.status} · "${toast}"${suffix(errors)}`)
})

// ---------------------------------------------------------------- W4 goods receipt inspection: approve one, reject one
for (const decision of ["approve", "reject"]) {
  await step(`W4${decision === "approve" ? "a" : "b"} Procurement Manager ${decision}s a goods receipt inspection`, async (open, label) => {
    const email = "proc.mgr@nts.local"
    const officer = "proc.officer@nts.local"
    // Receipts on test purchase orders only (a UAT vendor): the demo dataset's receipt waiting on inspection stays as it is.
    const testPos = list(await api(officer, "/procurement/purchase-orders")).filter((o) => /^UAT\b/.test(String(o.vendor?.name ?? "")))
    const testPoIds = new Set(testPos.map((o) => o.id))
    let pending = list(await api(email, "/procurement/goods-received-notes")).filter((g) => String(g.status).toUpperCase() === "RECEIVED" && testPoIds.has(g.purchaseOrderId ?? g.purchaseOrder?.id))
    if (!pending.length) {
      // Each inspection consumes a receipt, so arrange one rather than depend on what an earlier run left.
      const po = testPos.find(
        (o) => ["SENT", "ACKNOWLEDGED", "PARTIALLY_DELIVERED"].includes(String(o.status).toUpperCase()) && (o.items ?? []).length,
      )
      if (!po) return record(false, label, "no dispatched UAT purchase order to receive against")
      const made = await apiCall(officer, "POST", "/procurement/goods-received-notes", {
        purchaseOrderId: po.id,
        receivedDate: new Date().toISOString(),
        items: po.items.map((i) => ({ purchaseOrderItemId: i.id, quantityReceived: Number(i.quantity), quantityAccepted: Number(i.quantity), quantityRejected: 0 })),
      })
      if (made.status !== 201) return record(false, label, `could not arrange a goods receipt: ${made.status} ${made.message}`)
      pending = [made.data]
    }
    const grn = pending[0]
    const { page, errors } = await open(email, "/procurement-v23/approvals")
    const id = `RECEIPT-${grn.grnNumber}`
    if (decision === "approve") {
      const control = `[data-action="approve-prompt-v6"][data-id="${id}"]`
      if (!(await visible(page, control))) return record(false, label, `no approve control for ${id}${suffix(errors)}`)
      await page.click(control)
    } else {
      const review = `[data-action="open-approval-v6"][data-id="${id}"]`
      if (!(await visible(page, review))) return record(false, label, `no review control for ${id}${suffix(errors)}`)
      await page.click(review)
      await page.click(`[data-action="reject-approval-v6"][data-id="${id}"]`)
      await page.waitForSelector("#rejectApprovalFormV6")
      await page.selectOption('#rejectApprovalFormV6 [name="decision"]', "Reject").catch(() => {})
      await page.fill('#rejectApprovalFormV6 [name="reason"]', `Two units damaged on arrival ${RUN}`)
      await page.click(`[data-action="confirm-reject-approval-v6"][data-id="${id}"]`)
    }
    const toast = await toasts(page)
    const after = list(await api(email, "/procurement/goods-received-notes")).find((g) => g.id === grn.id)
    const want = decision === "approve" ? "APPROVED" : "REJECTED"
    record(String(after?.status).toUpperCase() === want, label, `${grn.grnNumber} -> ${after?.status} (quality ${after?.qualityStatus ?? "-"}) · "${toast}"${suffix(errors)}`)
  })
}

// ---------------------------------------------------------------- W5 Finance approves an invoice
await step("W5 Finance Manager approves a captured invoice (Approval Centre)", async (open, label) => {
  const ap = "proc.ap@nts.local"
  const finance = "payroll.finmgr@nts.local"
  // A UAT vendor's invoice only: the demo dataset's invoice waiting on Finance stays waiting.
  const isTestVendor = (name) => /^UAT\b/.test(String(name ?? ""))
  let draft = list(await api(ap, "/procurement/invoices")).find((i) => i.status === "DRAFT" && isTestVendor(i.vendor?.name))
  if (!draft) {
    const po = list(await api(ap, "/procurement/purchase-orders")).find((o) => ["SENT", "ACKNOWLEDGED", "PARTIALLY_DELIVERED", "DELIVERED"].includes(o.status) && (o.items ?? []).length && isTestVendor(o.vendor?.name))
    if (!po) return record(false, label, "no dispatched UAT purchase order to invoice")
    const cap = await apiCall(ap, "POST", "/procurement/invoices", {
      purchaseOrderId: po.id, vendorId: po.vendorId, invoiceDate: new Date().toISOString(), dueDate: new Date(Date.now() + 30 * 864e5).toISOString(),
      currencyId: po.currencyId ?? undefined,
      items: po.items.map((i) => ({ itemName: i.itemName, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), unit: i.unit ?? undefined })),
    })
    if (cap.status !== 201) return record(false, label, `could not arrange an invoice: ${cap.status} ${cap.message}`)
    draft = cap.data
  }
  const { page, errors } = await open(finance, "/procurement-v23/approvals")
  const control = `[data-action="approve-prompt-v6"][data-id="INVOICE-${draft.invoiceNumber}"]`
  if (!(await visible(page, control))) return record(false, label, `no approve control for INVOICE-${draft.invoiceNumber}${suffix(errors)}`)
  await page.click(control)
  const toast = await toasts(page)
  const after = list(await api(finance, "/procurement/invoices")).find((i) => i.id === draft.id)
  record(after?.status === "APPROVED", label, `${draft.invoiceNumber} -> ${after?.status}, match ${after?.matchingStatus} · "${toast}"${suffix(errors)}`)
})

// ---------------------------------------------------------------- W6 purchase order: save a draft, send it, send selected
async function draftPoThroughForm(page, requisition, vendorId) {
  await page.click('[data-action="create-po-v6"]')
  await page.waitForSelector("#poFormV23")
  await page.selectOption("#poSourceV23", requisition.id)
  await page.selectOption('#poFormV23 [name="vendor"]', vendorId)
  await page.waitForSelector("#poLinesV23 [data-po-price]")
  await page.click('[data-action="save-po-v6"]')
  return toasts(page)
}
const mailableVendor = async (email) => list(await api(email, "/accounting/vendors")).find((v) => !v.isBlacklisted && String(v.email ?? "").includes("@"))

await step("W6a Procurement Officer saves a purchase order as a draft, then sends it", async (open, label) => {
  const officer = "proc.officer@nts.local"
  const pr = await arrangeRequisition(`UAT WF PO draft ${RUN}`, { approve: true })
  const vendor = await mailableVendor(officer)
  const { page, errors } = await open(officer, "/procurement-v23/purchase-orders")
  const saveToast = await draftPoThroughForm(page, pr, vendor.id)
  const po = list(await api(officer, "/procurement/purchase-orders")).find((p) => p.requisitionId === pr.id)
  if (po?.status !== "DRAFT") return record(false, label, `save draft -> ${po?.status ?? "no PO"} · "${saveToast}"${suffix(errors)}`)
  await page.waitForTimeout(1500)
  const offered = await rowMenu(page, po.poNumber)
  if (!offered.includes("send-po-v6")) return record(false, label, `${po.poNumber} DRAFT, but its row offers no send (menu: ${offered.filter((a) => /po|send/.test(a)).join(", ")})${suffix(errors)}`)
  await page.click(`[data-action="send-po-v6"][data-id="${po.poNumber}"]`)
  const toast = await toasts(page)
  const after = list(await api(officer, "/procurement/purchase-orders")).find((p) => p.id === po.id)
  record(after?.status === "SENT", label, `${po.poNumber} DRAFT -> ${after?.status} · "${saveToast}" · "${toast}"${suffix(errors)}`)
})

await step("W6b Procurement Officer sends two draft purchase orders with Send selected", async (open, label) => {
  const officer = "proc.officer@nts.local"
  const vendor = await mailableVendor(officer)
  const prs = [await arrangeRequisition(`UAT WF bulk 1 ${RUN}`, { approve: true }), await arrangeRequisition(`UAT WF bulk 2 ${RUN}`, { approve: true })]
  const { page, errors } = await open(officer, "/procurement-v23/purchase-orders")
  for (const pr of prs) {
    await draftPoThroughForm(page, pr, vendor.id)
    await page.waitForTimeout(1500)
  }
  const pos = list(await api(officer, "/procurement/purchase-orders")).filter((p) => prs.some((r) => r.id === p.requisitionId))
  if (pos.length !== 2 || pos.some((p) => p.status !== "DRAFT")) return record(false, label, `arranged drafts: ${pos.map((p) => `${p.poNumber} ${p.status}`).join(", ") || "none"}${suffix(errors)}`)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: 60000 })
  await page.waitForTimeout(1500)
  for (const p of pos) await page.check(`input.po-select-v11[value="${p.poNumber}"]`)
  await page.click('[data-action="send-selected-po-v11"]')
  await page.waitForSelector('[data-action="confirm-send-selected-po-v11"]')
  await page.click('[data-action="confirm-send-selected-po-v11"]')
  const toast = await toasts(page)
  const after = list(await api(officer, "/procurement/purchase-orders")).filter((p) => pos.some((x) => x.id === p.id))
  record(after.length === 2 && after.every((p) => p.status === "SENT"), label, `${after.map((p) => `${p.poNumber} ${p.status}`).join(", ")} · "${toast}"${suffix(errors)}`)
})

// ---------------------------------------------------------------- W7 contract: terminate an active one
await step("W7 Procurement Manager terminates an active contract", async (open, label) => {
  const email = "proc.mgr@nts.local"
  // A contract the suites created ("UAT …" / "Storyline …"): dev's demo contract is not the suite's to terminate.
  const active = list(await api(email, "/procurement/contracts")).find((c) => c.status === "ACTIVE" && /^(UAT|Storyline)\b/.test(String(c.title)))
  if (!active) return record(false, label, "no active UAT contract to terminate — actions and the storyline each create one")
  const { page, errors } = await open(email, "/procurement-v23/contracts")
  const offered = await rowMenu(page, active.contractNumber)
  if (!offered.includes("edit-contract-v6")) return record(false, label, `${active.contractNumber}: no open/edit control (menu: ${offered.filter((a) => /contract/.test(a)).join(", ")})${suffix(errors)}`)
  await page.click(`[data-action="edit-contract-v6"][data-id="${active.contractNumber}"]`)
  const control = `[data-action="terminate-contract-v23"][data-id="${active.id}"]`
  if (!(await visible(page, control))) return record(false, label, `${active.contractNumber} ACTIVE: no Terminate in its workspace${suffix(errors)}`)
  await page.click(control)
  const toast = await toasts(page)
  const after = list(await api(email, "/procurement/contracts")).find((c) => c.id === active.id)
  record(after?.status === "TERMINATED", label, `${active.contractNumber} -> ${after?.status} · "${toast}"${suffix(errors)}`)
})

// ---------------------------------------------------------------- W8 plan: Finance rejects, author adds a line and resubmits
await step("W8 Finance rejects a plan; its author adds a line and resubmits", async (open, label) => {
  const author = "proc.mgr@nts.local"
  const finance = "payroll.finmgr@nts.local"
  const name = `UAT WF plan ${RUN}`
  {
    const { page } = await open(author, "/procurement-v23/plan")
    await page.click('[data-action="create-plan-v5"]')
    await page.waitForSelector("#planFormV23")
    await page.fill('#planFormV23 [name="name"]', name)
    await page.fill('#planFormV23 [name="department"]', "Operations")
    await page.fill('#planFormV23 [name="budget"]', "90000")
    await page.fill("#planFormV23 [data-plan-line] [data-plan-desc] >> nth=0", "UAT WF desks")
    await page.fill("#planFormV23 [data-plan-line] [data-plan-value] >> nth=0", "30000")
    await page.click('[data-action="create-plan-confirm-v5"]')
    await toasts(page)
  }
  const plan = list(await api(author, "/procurement/plans")).find((p) => p.name === name)
  if (!plan) return record(false, label, "plan form saved nothing")
  const submitted = await apiCall(author, "POST", `/procurement/plans/${plan.id}/submit`)
  if (submitted.status >= 300) return record(false, label, `could not arrange submission: ${submitted.status} ${submitted.message}`)
  {
    const { page, errors } = await open(finance, "/procurement-v23/approvals")
    const id = `PLAN-${plan.planNumber}`
    if (!(await visible(page, `[data-action="open-approval-v6"][data-id="${id}"]`))) return record(false, label, `no review control for ${id}${suffix(errors)}`)
    await page.click(`[data-action="open-approval-v6"][data-id="${id}"]`)
    await page.click(`[data-action="reject-approval-v6"][data-id="${id}"]`)
    await page.waitForSelector("#rejectApprovalFormV6")
    await page.selectOption('#rejectApprovalFormV6 [name="decision"]', "Reject").catch(() => {})
    await page.fill('#rejectApprovalFormV6 [name="reason"]', `Add the chairs line ${RUN}`)
    await page.click(`[data-action="confirm-reject-approval-v6"][data-id="${id}"]`)
    const toast = await toasts(page)
    const rejected = list(await api(finance, "/procurement/plans")).find((p) => p.id === plan.id)
    if (rejected?.status !== "REJECTED") return record(false, label, `reject -> ${rejected?.status} · "${toast}"${suffix(errors)}`)
  }
  const { page, errors } = await open(author, "/procurement-v23/plan")
  await page.click('[data-action="add-plan-item"] >> nth=0')
  if (!(await visible(page, "#planItemFormV23"))) return record(false, label, `REJECTED ok; Add plan item opened no form${suffix(errors)}`)
  await page.selectOption('#planItemFormV23 [name="plan"]', { label: new RegExp(plan.planNumber) }).catch(async () => {
    const value = await page.$$eval('#planItemFormV23 [name="plan"] option', (os, n) => os.find((o) => o.textContent.includes(n))?.value, plan.planNumber)
    if (value) await page.selectOption('#planItemFormV23 [name="plan"]', value)
  })
  await page.fill('#planItemFormV23 [name="description"]', "UAT WF chairs")
  await page.fill('#planItemFormV23 [name="estimatedValue"]', "12000")
  await page.click('[data-action="save-plan-item"]')
  const itemToast = await toasts(page)
  await page.waitForTimeout(1500)
  await page.click(`[data-action="open-plan-detail-v5"][data-id="${plan.planNumber}"] >> nth=0`)
  await page.waitForSelector('[data-action="submit-plan"]')
  await page.click('[data-action="submit-plan"] >> nth=0')
  const toast = await toasts(page)
  const after = list(await api(author, "/procurement/plans")).find((p) => p.id === plan.id)
  record(
    after?.status === "SUBMITTED" && (after.items?.length ?? 0) === 2,
    label,
    `${plan.planNumber}: REJECTED -> line added (${after?.items?.length} lines) -> ${after?.status} · "${itemToast}" · "${toast}"${suffix(errors)}`,
  )
})

// ---------------------------------------------------------------- W9 document: upload a new version
await step("W9 Procurement Officer uploads a new version of a vault document", async (open, label) => {
  const email = "proc.officer@nts.local"
  const doc = list(await api(email, "/procurement/documents")).find((d) => /^(UAT|Storyline)\b/.test(String(d.name)))
  if (!doc) return record(false, label, "no UAT vault document — actions step 17 files one")
  const display = `DOC-${String(doc.id).slice(-6).toUpperCase()}`
  const { page, errors } = await open(email, "/procurement-v23/documents")
  const row = page.locator("table tbody tr", { hasText: doc.name }).first()
  await row.waitFor()
  await row.locator('[data-action="doc-menu-v11"], [data-action="row-actions-v16"]').first().click()
  await page.waitForTimeout(400)
  const control = page.locator('[data-action="upload-doc-version-v11"] >> visible=true').first()
  if (!(await control.count())) return record(false, label, `${doc.name}: its menu offers no Upload version${suffix(errors)}`)
  await control.click()
  await page.waitForSelector("#uploadVersionFormV11")
  await page.setInputFiles('#uploadVersionFormV11 [name="file"]', PDF)
  await page.click('[data-action="confirm-upload-version-v11"]')
  const toast = await toasts(page)
  const after = list(await api(email, "/procurement/documents")).find((d) => d.id === doc.id)
  record(after && after.version !== doc.version, label, `${doc.name} (${display}) ${doc.version} -> ${after?.version} · "${toast}"${suffix(errors)}`)
})

// ---------------------------------------------------------------- N1–N4 controls that must refuse
await step("N1 A requisition without a title is refused and nothing is saved", async (open, label) => {
  const email = "proc.requester@nts.local"
  const before = list(await api(email, "/procurement/requisitions/my")).length
  const { page, errors } = await open(email, "/procurement-v23/requisitions")
  await page.click('[data-action="create-requisition"]')
  await page.waitForSelector("#prForm")
  // Category is required (cycle seven): choose the first real one; option 0 is "Choose a category".
  await page.selectOption('#prForm select[name="category"]', { index: 1 })
  await page.fill('#prForm [name="item"]', "Pens")
  await page.fill('#prForm [name="qty"]', "5")
  await page.click('[data-action="submit-pr"]')
  const toast = await toasts(page)
  const invalid = await page.$$eval("#prForm :invalid", (els) => els.map((e) => e.name)).catch(() => [])
  const after = list(await api(email, "/procurement/requisitions/my")).length
  record(after === before && (invalid.length > 0 || /missing/i.test(toast)), label, `requisitions ${before} -> ${after}; invalid fields [${invalid.join(", ")}] · "${toast}"${suffix(errors)}`)
})

await step("N2 A plan's author cannot approve their own plan", async (open, label) => {
  const author = "proc.mgr@nts.local"
  const me = (await api(author, "/procurement/me/access"))?.userId
  const plans = list(await api(author, "/procurement/plans"))
  const ours = plans.filter((p) => /^(UAT|Storyline)\b/.test(String(p.name)))
  const submitted = ours.find((p) => p.status === "SUBMITTED" && p.createdById === me) ?? ours.find((p) => p.status === "SUBMITTED")
  if (!submitted) return record(false, label, "no submitted plan — W8 resubmits one")
  const { page, errors } = await open(author, "/procurement-v23/approvals")
  const control = `[data-action="approve-prompt-v6"][data-id="PLAN-${submitted.planNumber}"]`
  const offered = await visible(page, control, 6000)
  let toast = ""
  if (offered) {
    await page.click(control)
    toast = await toasts(page)
  }
  const after = list(await api(author, "/procurement/plans")).find((p) => p.id === submitted.id)
  record(after?.status === "SUBMITTED", label, `${submitted.planNumber}: approve control ${offered ? "shown" : "not shown"} to its author -> ${after?.status}${toast ? ` · "${toast}"` : ""}${suffix(errors)}`)
})

await step("N3 A payment without proof of payment is refused", async (open, label) => {
  const ap = "proc.ap@nts.local"
  const target = list(await api(ap, "/procurement/invoices")).find((i) => i.status === "APPROVED" && !["PAID", "PARTIALLY_PAID"].includes(i.paymentStatus))
  if (!target) return record(false, label, "no approved unpaid invoice — W5 approves one")
  const { page, errors } = await open(ap, "/procurement-v23/invoices")
  await page.click('[data-action="record-payment-v23"]')
  await page.waitForSelector("#paymentFormV23")
  await page.selectOption("#paymentInvoiceV23", target.id)
  await page.fill('#paymentFormV23 [name="reference"]', `UAT-WF-NOPROOF-${RUN}`)
  await page.click('[data-action="confirm-record-payment-v23"]')
  const toast = await toasts(page)
  const after = list(await api(ap, "/procurement/invoices")).find((i) => i.id === target.id)
  record(!["PAID", "PARTIALLY_PAID"].includes(after?.paymentStatus), label, `${target.invoiceNumber} payment ${after?.paymentStatus} · "${toast}"${suffix(errors)}`)
})

await step("N4 A Buyer is not offered purchase order creation", async (open, label) => {
  const { page, errors } = await open("proc.buyer@nts.local", "/procurement-v23/purchase-orders")
  const shown = await visible(page, '[data-action="create-po-v6"]', 5000)
  let toast = ""
  if (shown) {
    await page.click('[data-action="create-po-v6"]')
    await page.waitForTimeout(800)
    const formOpen = await visible(page, "#poFormV23", 3000)
    toast = await toasts(page)
    return record(!formOpen, label, `Create PO shown to the Buyer; form ${formOpen ? "opened" : "refused"} · "${toast}"${suffix(errors)}`)
  }
  record(true, label, `Create PO not shown${suffix(errors)}`)
})

const failed = results.filter((r) => !r.ok)
console.log(`\n=== RESULT === ${results.length - failed.length}/${results.length} workflows verified through the API`)
process.exit(failed.length ? 1 : 0)
