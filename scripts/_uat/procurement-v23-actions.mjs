/**
 * Procurement V23 — do the connected controls reach the API when used through the real UI?
 *
 * Each step signs in as the persona who would do the work, uses the screen the way a person
 * would (click, fill, confirm), then asks the API whether the record really changed. A success
 * toast is not accepted as evidence on its own.
 *
 *   1. Operations head approves PR-B from the Approval Centre           -> requisition APPROVED
 *   2. Procurement Manager awards RFQ-B from the Approval Centre         -> quotation ACCEPTED, PO raised
 *   3. Operations member raises a requisition through the form           -> PENDING_APPROVAL, own department
 *   4. Procurement Officer registers a vendor through the V6 form        -> vendor exists
 *   5. Accountant runs OCR extraction, which is not connected            -> refused, no invoice created
 *   6. Procurement Officer sends an RFQ from PR-E in the tender builder  -> RFQ linked to PR-E
 *   7. Procurement Officer scores RFQ-C's bids in Bid Evaluation         -> evaluation scores stored, complete
 *   8. Procurement Manager awards RFQ-C from the award panel             -> chosen quotation ACCEPTED, PO raised, RFQ AWARDED
 *   9. Procurement Officer records a GRN against PO-B (live form)        -> GRN RECEIVED
 *  10. Accountant captures the supplier invoice for PO-B (live form)     -> invoice DRAFT
 *  11. Finance Manager rejects a DRAFT invoice from the Approval Centre -> invoice REJECTED, reason stored
 *  12. Procurement Officer raises a PO from an approved requisition     -> PO SENT, requisition CONVERTED_TO_PO
 *  13. Accountant records payment of an approved invoice               -> invoice PAID, journal posted
 *
 * Needs the dataset from nvccz/scripts/_uat/procurement-p2p-flow.mjs (PR-B pending approval,
 * RFQ-B with two quotations). Records made here are titled "UAT P2P" so the flow's --reset
 * removes them; the vendor is kept, like the flow's own vendors.
 *
 * Run:  node scripts/_uat/procurement-v23-actions.mjs
 * Exit: 0 = every step verified through the API, 1 = at least one did not
 */
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const staff = MODULES.find((m) => m.portal === "staff")
const API = process.env.API || "http://127.0.0.1:3009/api"
const PASSWORD = "admin123"
const RUN = Date.now()
const results = []

function record(ok, step, detail) {
  results.push({ ok, step, detail })
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${step.padEnd(52)} ${detail}`)
}

const tokens = {}
async function api(email, path) {
  if (!tokens[email]) {
    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD, portal: "staff" }),
    }).then((x) => x.json())
    tokens[email] = r.token || r?.data?.token
  }
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${tokens[email]}` } })
  const body = await res.json().catch(() => ({}))
  return body?.data
}

/**
 * Every step opens a fresh browser, which re-downloads the ~1.2 MB (compressed) V23 bundle. Over a
 * slow link to dev that is 60-120 s per page, so immutable /_next/static files are kept in memory
 * for the run and served to later browsers. UAT_CACHE_STATIC=0 turns it off.
 */
const STATIC_CACHE = new Map()
async function serveStatic(route) {
  const url = route.request().url()
  const hit = STATIC_CACHE.get(url)
  if (hit) return route.fulfill({ status: 200, headers: hit.headers, body: hit.body })
  const res = await route.fetch()
  const body = await res.body()
  // The body arrives decoded, so the transfer headers no longer describe it.
  const headers = Object.fromEntries(Object.entries(res.headers()).filter(([k]) => !/^(content-encoding|content-length|transfer-encoding)$/i.test(k)))
  if (res.status() === 200) STATIC_CACHE.set(url, { headers, body })
  return route.fulfill({ status: res.status(), headers, body })
}

async function session(email, route) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  if (process.env.UAT_CACHE_STATIC !== "0") await context.route(/\/_next\/static\//, serveStatic)
  await seedAuth(context, staff.base, email, staff.portal)
  const page = await context.newPage()
  // A remote run (dev over the internet, often while the VPS builds) needs more than the local
  // defaults: UAT_TIMEOUT_MS for actions and navigation, UAT_LOAD_TIMEOUT_MS for the first render.
  page.setDefaultTimeout(Number(process.env.UAT_TIMEOUT_MS || 30000))
  const loadTimeout = Number(process.env.UAT_LOAD_TIMEOUT_MS || 60000)
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 200)))
  await page.goto(staff.base + route, { waitUntil: "domcontentloaded", timeout: loadTimeout })
  await page.waitForSelector(".procurement-v23-root", { timeout: loadTimeout })
  // The live load has landed once the host has published the caller's access.
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: loadTimeout })
  await page.waitForTimeout(800)
  return { browser, page, errors }
}

async function toasts(page) {
  await page.waitForSelector("[data-sonner-toast]", { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(400)
  return page.$$eval("[data-sonner-toast]", (els) => els.map((e) => e.textContent.trim()).join(" | ")).catch(() => "")
}

const suffix = (errors) => (errors.length ? ` · page errors: ${errors.join(" / ")}` : "")

async function promptOnScreen(page, selector) {
  return Boolean(await page.waitForSelector(selector, { timeout: 20000 }).catch(() => null))
}

/**
 * When an expected Approval Centre prompt is missing, report what was there instead — the prompt
 * ids on screen, the ids in the runtime's state, and any toast (a loader failure raises one) —
 * so an intermittent miss leaves evidence rather than a bare timeout.
 */
async function explainMissingPrompt(page, selector, errors) {
  const onScreen = await page.$$eval('[data-action="approve-prompt-v6"]', (els) => [...new Set(els.map((e) => e.dataset.id))]).catch(() => [])
  const inState = await page
    .evaluate(() => (window.MatanhoProcurementUI?.getSnapshot?.()?.approvalPromptsV6 || []).map((p) => p.id))
    .catch(() => null)
  const toast = await page.$$eval("[data-sonner-toast]", (els) => els.map((e) => e.textContent.trim()).join(" | ")).catch(() => "")
  return `no ${selector} on screen · prompts on screen [${onScreen.join(", ")}] · in state [${inState ? inState.join(", ") : "unreadable"}] · toasts "${toast}"${suffix(errors)}`
}

// --only=4 or --only=3,4 runs just those steps (steps 1 and 2 consume PR-B and RFQ-B).
const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.slice(7) || "").split(",").map((s) => s.trim()).filter(Boolean)

/** Run one step; a thrown error fails that step only, and its browser is always closed. */
async function step(label, fn) {
  if (ONLY.length && !ONLY.includes(label.split(" ")[0])) return
  const opened = []
  const open = async (email, route) => {
    const s = await session(email, route)
    opened.push(s.browser)
    return s
  }
  try {
    await fn(open)
  } catch (err) {
    record(false, label, `threw: ${String(err?.message || err).split("\n")[0]}`)
  } finally {
    for (const b of opened) await b.close().catch(() => {})
  }
}

// ------------------------------------------------------------------ 1. department head approves
await step("1 Operations head approves PR-B (Approval Centre)", async (open) => {
  const label = "1 Operations head approves PR-B (Approval Centre)"
  const email = "perf.deptmgr@nts.local"
  const pending = (await api(email, "/procurement/requisitions/pending-approval")) ?? []
  const target = pending.find((r) => String(r.title).startsWith("UAT P2P printer toner"))
  if (!target) return record(false, label, "no pending UAT requisition — run the p2p flow with --reset")
  const { page, errors } = await open(email, "/procurement-v23/approvals")
  const control = `[data-action="approve-prompt-v6"][data-id="PR-${target.requisitionNumber}"]`
  if (!(await promptOnScreen(page, control))) return record(false, label, await explainMissingPrompt(page, control, errors))
  await page.click(control)
  const toast = await toasts(page)
  const after = await api(email, `/procurement/requisitions/${target.id}`)
  record(after?.status === "APPROVED", label, `${target.requisitionNumber} -> ${after?.status} · "${toast}"${suffix(errors)}`)
})

// ------------------------------------------------------------------ 2. manager awards
await step("2 Procurement Manager awards RFQ-B (Approval Centre)", async (open) => {
  const label = "2 Procurement Manager awards RFQ-B (Approval Centre)"
  const email = "proc.mgr@nts.local"
  const rfq = ((await api(email, "/procurement/rfq")) ?? []).find((r) => String(r.title).startsWith("UAT P2P RFQ meeting room screen"))
  if (!rfq) return record(false, label, "no UAT RFQ-B — run the p2p flow with --reset")
  const { page, errors } = await open(email, "/procurement-v23/approvals")
  const control = `[data-action="approve-prompt-v6"][data-id="AWARD-${rfq.rfqNumber}"]`
  if (!(await promptOnScreen(page, control))) return record(false, label, await explainMissingPrompt(page, control, errors))
  await page.click(control)
  const toast = await toasts(page)
  const quotes = (await api(email, "/vendor-quotations")) ?? []
  const accepted = quotes.find((q) => q.procurementRfqId === (rfq.procurementRfqId ?? rfq.id) && q.status === "ACCEPTED")
  const po = ((await api(email, "/procurement/purchase-orders")) ?? []).find((p) => accepted && p.quotationId === accepted.id)
  record(
    Boolean(accepted && po),
    label,
    `${rfq.rfqNumber} -> ${accepted ? `${accepted.quotationNumber} (${accepted.companyName}) accepted` : "nothing accepted"}, ${po ? `${po.poNumber} ${po.status}` : "no PO"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 3. requester raises a requisition
await step("3 Operations member raises a requisition (form)", async (open) => {
  const label = "3 Operations member raises a requisition (form)"
  const email = "proc.requester@nts.local"
  const title = `UAT P2P V23 form requisition ${RUN}`
  const { page, errors } = await open(email, "/procurement-v23/requisitions")
  await page.click('[data-action="create-requisition"]')
  await page.waitForSelector("#prForm")
  await page.fill('#prForm [name="title"]', title)
  await page.fill('#prForm [name="item"]', "Whiteboard markers")
  await page.fill('#prForm [name="qty"]', "24")
  await page.fill('#prForm [name="motivation"]', "Restock for the Operations training room.")
  await page.click('[data-action="submit-pr"]')
  const toast = await toasts(page)
  const created = ((await api(email, "/procurement/requisitions/my")) ?? []).find((r) => r.title === title)
  record(
    created?.status === "PENDING_APPROVAL" && created?.department === "Operations",
    label,
    `${created ? `${created.requisitionNumber} ${created.status}, department ${created.department}, ${created.items?.length ?? 0} line` : "not created"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 4. officer registers a vendor
await step("4 Procurement Officer registers a vendor (V6 form)", async (open) => {
  const label = "4 Procurement Officer registers a vendor (V6 form)"
  const email = "proc.officer@nts.local"
  const name = `UAT P2P V23 Form Vendor ${RUN}`
  const { page, errors } = await open(email, "/procurement-v23/vendors")
  // The live vendor page's header button is register-vendor-v6 (the base page's register-vendor is not rendered).
  await page.click('[data-action="register-vendor-v6"]')
  const form = "#vendorFormV6, #vendorRegisterFormV6"
  await page.waitForSelector(form)
  const formId = (await page.$("#vendorFormV6")) ? "#vendorFormV6" : "#vendorRegisterFormV6"
  const inYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  const values = {
    name, trading: name, country: "Zimbabwe", bp: `UAT-BP-${RUN}`, vat: `UAT-VAT-${RUN}`,
    contact: "Form Tester", email: `uat.form.${RUN}@vendors.example.test`, phone: "+263771000099",
    address: "1 Uat Road, Harare", bank: "UAT Bank", branch: "001", accountName: name, accountNumber: "000111222", taxExpiry: inYear,
  }
  for (const [field, value] of Object.entries(values)) {
    const el = await page.$(`${formId} [name="${field}"]`)
    if (el && (await el.evaluate((n) => n.tagName !== "SELECT"))) await el.fill(value)
  }
  // Anything else the form marks required: a plain value, or a one-page PDF for a file field.
  for (const el of await page.$$(`${formId} [required]`)) {
    const kind = await el.evaluate((n) => (n.tagName === "INPUT" ? n.type : n.tagName.toLowerCase()))
    const empty = await el.evaluate((n) => (n.type === "file" ? n.files.length === 0 : !n.value))
    if (!empty) continue
    if (kind === "file") await el.setInputFiles({ name: "uat.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") })
    else if (kind === "date") await el.fill(inYear)
    else if (kind !== "checkbox" && kind !== "select") await el.fill("UAT")
  }
  await page.click('[data-action="register-vendor-confirm-v6"]')
  const toast = await toasts(page)
  const vendor = ((await api(email, "/accounting/vendors")) ?? []).find((v) => v.name === name)
  record(
    Boolean(vendor),
    label,
    `${formId}: ${vendor ? `created, email ${vendor.email}, BP ${vendor.bpNumber}, tax ${vendor.taxComplianceStatus}` : "not created"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 5. unconnected step is refused
// OCR extraction of an uploaded invoice has no backend behind it (manual capture does, step 10).
await step("5 Unconnected OCR extraction is refused, nothing saved", async (open) => {
  const label = "5 Unconnected OCR extraction is refused, nothing saved"
  const email = "proc.ap@nts.local"
  const before = ((await api(email, "/procurement/invoices")) ?? []).length
  const { page, errors } = await open(email, "/procurement-v23/invoices")
  await page.click('[data-action="upload-invoice-v5"]')
  await page.waitForSelector('[data-action="extract-invoice-v5"]')
  await page.click('[data-action="extract-invoice-v5"]')
  const toast = await toasts(page)
  const after = ((await api(email, "/procurement/invoices")) ?? []).length
  record(/not connected/i.test(toast) && after === before, label, `invoices ${before} -> ${after} · "${toast}"${suffix(errors)}`)
})

// ------------------------------------------------------------------ 6. tender builder
await step("6 Procurement Officer sends an RFQ from PR-E (tender builder)", async (open) => {
  const label = "6 Procurement Officer sends an RFQ from PR-E (tender builder)"
  const email = "proc.officer@nts.local"
  const pr = ((await api(email, "/procurement/requisitions")) ?? []).find((r) => String(r.title).startsWith("UAT P2P projector lamps") && r.status === "APPROVED")
  if (!pr) return record(false, label, "no approved PR-E — run the p2p flow with --reset")
  const { page, errors } = await open(email, "/procurement-v23/tenders")
  await page.click('[data-action="create-tender"]')
  await page.waitForSelector("#tenderFormV13")
  await page.selectOption('#tenderFormV13 [name="source"]', pr.id)
  const title = `UAT P2P V23 builder RFQ ${RUN}`
  await page.fill('#tenderFormV13 [name="title"]', title)
  const inWeek = new Date(Date.now() + 7 * 86400000)
  for (const el of await page.$$("#tenderFormV13 [required]")) {
    const kind = await el.evaluate((n) => (n.tagName === "INPUT" ? n.type : n.tagName.toLowerCase()))
    const empty = await el.evaluate((n) => !n.value)
    if (!empty || kind === "checkbox" || kind === "radio" || kind === "select") continue
    if (kind === "date") await el.fill(inWeek.toISOString().slice(0, 10))
    else if (kind === "datetime-local") await el.fill(`${inWeek.toISOString().slice(0, 10)}T12:00`)
    else if (kind === "number") await el.fill("1")
    else await el.fill("UAT")
  }
  const recipients = await page.$$eval('#tenderFormV13 input[name="vendors"]:checked', (els) => els.length)
  await page.click('[data-action="create-send-tender-v13"]')
  const toast = await toasts(page)
  const rfq = ((await api(email, "/procurement/rfq")) ?? []).find((r) => r.title === title)
  // A closing date already past would leave vendors unable to quote.
  const closesInFuture = Boolean(rfq?.closingAt && new Date(rfq.closingAt).getTime() > Date.now())
  record(
    Boolean(rfq && rfq.requisitionId === pr.id && closesInFuture),
    label,
    `${rfq ? `${rfq.rfqNumber} from ${pr.requisitionNumber}, ${recipients} recipient(s) ticked, closes ${String(rfq.closingAt).slice(0, 16)}` : "not created"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 7. scoring
const rfqCOf = async (email) => ((await api(email, "/procurement/rfq")) ?? []).find((r) => String(r.title).startsWith("UAT P2P RFQ filing cabinets"))

await step("7 Procurement Officer scores RFQ-C bids (Bid Evaluation)", async (open) => {
  const label = "7 Procurement Officer scores RFQ-C bids (Bid Evaluation)"
  const email = "proc.officer@nts.local"
  const rfq = await rfqCOf(email)
  if (!rfq) return record(false, label, "no RFQ-C — run the p2p flow with --reset")
  const { page, errors } = await open(email, "/procurement-v23/evaluation")
  await page.click(`[data-action="open-evaluation"][data-id="${rfq.rfqNumber}"]`)
  await page.waitForSelector("[data-score-quote]", { timeout: 20000 })
  const inputs = await page.$$("[data-score-quote]")
  const scores = [80, 70, 90]
  for (let i = 0; i < inputs.length; i += 1) await inputs[i].fill(String(scores[i % scores.length]))
  await page.click('[data-action="save-scores"]')
  const toast = await toasts(page)
  const matrix = await api(email, `/procurement/rfqs/${rfq.procurementRfqId ?? rfq.id}/comparison-matrix`)
  const got = (matrix?.rows ?? []).map((r) => r.comparison?.evaluationScore)
  record(
    inputs.length > 0 && got.length === inputs.length && got.every((s) => s != null) && matrix?.evaluationComplete === true,
    label,
    `${inputs.length} score inputs · stored evaluation scores [${got.join(", ")}] · complete=${matrix?.evaluationComplete} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 8. award from the evaluation workspace
await step("8 Procurement Manager awards RFQ-C (award panel)", async (open) => {
  const label = "8 Procurement Manager awards RFQ-C (award panel)"
  const email = "proc.mgr@nts.local"
  const rfq = await rfqCOf(email)
  if (!rfq) return record(false, label, "no RFQ-C — run the p2p flow with --reset")
  const { page, errors } = await open(email, "/procurement-v23/evaluation")
  await page.click(`[data-action="open-evaluation"][data-id="${rfq.rfqNumber}"]`)
  await page.waitForSelector('.award-panel-v6 [name="awardWinnerV6"]', { timeout: 20000 })
  const recommended = page.locator('label.award-option-v6:has-text("System recommendation") input[name="awardWinnerV6"]')
  const choice = (await recommended.count()) ? recommended.first() : page.locator('[name="awardWinnerV6"]').first()
  const chosenId = await choice.getAttribute("value")
  await choice.check()
  await page.click('[data-action="confirm-bid-winner-v6"]')
  await page.waitForSelector('[data-action="save-bid-winner-v6"]', { timeout: 20000 })
  await page.click('[data-action="save-bid-winner-v6"]')
  const toast = await toasts(page)
  const quotes = ((await api(email, "/vendor-quotations")) ?? []).filter((q) => q.procurementRfqId === (rfq.procurementRfqId ?? rfq.id))
  const accepted = quotes.find((q) => q.status === "ACCEPTED")
  const po = ((await api(email, "/procurement/purchase-orders")) ?? []).find((p) => accepted && p.quotationId === accepted.id)
  const matrix = await api(email, `/procurement/rfqs/${rfq.procurementRfqId ?? rfq.id}/comparison-matrix`)
  record(
    Boolean(accepted && accepted.id === chosenId && po && matrix?.rfq?.status === "AWARDED" && matrix?.rfq?.awardedQuotationId === accepted.id),
    label,
    `chose ${chosenId} · accepted ${accepted?.quotationNumber ?? "none"} (${accepted?.companyName ?? "-"}) · ${po?.poNumber ?? "no PO"} · RFQ ${matrix?.rfq?.status}/${matrix?.rfq?.awardedQuotationId === accepted?.id ? "award recorded" : "award not recorded"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 9. record a GRN
const poBOf = async (email) => {
  const rfqs = (await api(email, "/procurement/rfq")) ?? []
  const rfqB = rfqs.find((r) => String(r.title).startsWith("UAT P2P RFQ meeting room screen"))
  return ((await api(email, "/procurement/purchase-orders")) ?? []).find((p) => rfqB && p.quotation?.rfqNumber === rfqB.rfqNumber)
}

await step("9 Procurement Officer records a GRN against PO-B (live form)", async (open) => {
  const label = "9 Procurement Officer records a GRN against PO-B (live form)"
  const email = "proc.officer@nts.local"
  const po = await poBOf(email)
  if (!po) return record(false, label, "no PO for RFQ-B — step 2 must award it first")
  const before = ((await api(email, "/procurement/goods-received-notes")) ?? []).filter((g) => g.purchaseOrderId === po.id).length
  const { page, errors } = await open(email, "/procurement-v23/goods-received")
  await page.click('[data-action="record-grn"]')
  await page.waitForSelector("#grnFormV23")
  await page.selectOption("#grnPoV23", po.id)
  await page.waitForSelector("#grnLinesV23 [data-grn-received]")
  await page.click('[data-action="create-grn-confirm"]')
  const toast = await toasts(page)
  const grns = ((await api(email, "/procurement/goods-received-notes")) ?? []).filter((g) => g.purchaseOrderId === po.id)
  const grn = grns[0]
  record(
    grns.length === before + 1 && grn?.status === "RECEIVED",
    label,
    `${po.poNumber}: GRNs ${before} -> ${grns.length}${grn ? `, ${grn.grnNumber} ${grn.status}, ${grn.items?.length ?? 0} line(s)` : ""} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 10. capture an invoice
await step("10 Accountant captures the invoice for PO-B (live form)", async (open) => {
  const label = "10 Accountant captures the invoice for PO-B (live form)"
  const email = "proc.ap@nts.local"
  const po = await poBOf("proc.officer@nts.local")
  if (!po) return record(false, label, "no PO for RFQ-B — step 2 must award it first")
  const before = ((await api(email, "/procurement/invoices")) ?? []).filter((i) => i.purchaseOrderId === po.id).length
  const { page, errors } = await open(email, "/procurement-v23/invoices")
  await page.click('[data-action="capture-invoice-v5"]')
  await page.waitForSelector("#invoiceCaptureV23")
  await page.selectOption("#invoicePoV23", po.id)
  await page.waitForSelector("#invoiceLinesV23 [data-inv-qty]")
  await page.click('[data-action="confirm-capture-invoice-v5"]')
  const toast = await toasts(page)
  const invoices = ((await api(email, "/procurement/invoices")) ?? []).filter((i) => i.purchaseOrderId === po.id)
  const inv = invoices[0]
  record(
    invoices.length === before + 1 && inv?.status === "DRAFT",
    label,
    `${po.poNumber}: invoices ${before} -> ${invoices.length}${inv ? `, ${inv.invoiceNumber} ${inv.status} total ${inv.totalAmount}` : ""} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 11. reject an invoice
await step("11 Finance Manager rejects an invoice (Approval Centre)", async (open) => {
  const label = "11 Finance Manager rejects an invoice (Approval Centre)"
  const email = "payroll.finmgr@nts.local"
  const target = ((await api(email, "/procurement/invoices")) ?? []).find((i) => String(i.status).toUpperCase() === "DRAFT")
  if (!target) return record(false, label, "no DRAFT invoice to reject — step 10 captures one")
  const { page, errors } = await open(email, "/procurement-v23/approvals")
  const id = `INVOICE-${target.invoiceNumber}`
  const review = `[data-action="open-approval-v6"][data-id="${id}"]`
  if (!(await promptOnScreen(page, review))) return record(false, label, await explainMissingPrompt(page, review, errors))
  await page.click(review)
  await page.click(`[data-action="reject-approval-v6"][data-id="${id}"]`)
  await page.waitForSelector("#rejectApprovalFormV6")
  await page.selectOption('#rejectApprovalFormV6 [name="decision"]', "Reject")
  await page.fill('#rejectApprovalFormV6 [name="reason"]', `UAT P2P invoice does not match the delivery ${RUN}`)
  await page.click(`[data-action="confirm-reject-approval-v6"][data-id="${id}"]`)
  const toast = await toasts(page)
  const after = ((await api(email, "/procurement/invoices")) ?? []).find((i) => i.id === target.id)
  const reason = String(after?.rejectionReason ?? "")
  record(
    after?.status === "REJECTED" && (!("rejectionReason" in (after ?? {})) || reason.includes(String(RUN))),
    label,
    `${target.invoiceNumber} -> ${after?.status}${reason ? `, reason "${reason.slice(0, 60)}"` : ""} · "${toast}"${suffix(errors)}`,
  )
})

/** Any method, for arranging a step's starting state through the API (not for verifying the UI). */
async function apiCall(email, method, path, body) {
  await api(email, "/procurement/me/access")
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[email]}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, data: json?.data, message: json?.message }
}

// ------------------------------------------------------------------ 12. direct purchase order
await step("12 Procurement Officer raises and sends a PO from an approved requisition (Create PO form)", async (open) => {
  const label = "12 Procurement Officer raises and sends a PO from an approved requisition (Create PO form)"
  const requester = "proc.requester@nts.local"
  const officer = "proc.officer@nts.local"
  // Arrange: an approved requisition with an estimate, raised and approved through the API.
  const access = await api(requester, "/procurement/me/access")
  const made = await apiCall(requester, "POST", "/procurement/requisitions", {
    title: `UAT P2P V23 direct PO ${RUN}`,
    department: access?.department,
    priority: "MEDIUM",
    items: [{ itemName: "UAT P2P office chairs", quantity: 6, unit: "Each", unitPrice: 120 }],
  })
  if (made.status !== 201) return record(false, label, `could not arrange a requisition: ${made.status} ${made.message}`)
  await apiCall(requester, "PUT", `/procurement/requisitions/${made.data.id}/submit`)
  const approved = await apiCall("perf.deptmgr@nts.local", "PUT", `/procurement/requisitions/${made.data.id}/approve`, {})
  if (approved.data?.status !== "APPROVED") return record(false, label, `could not approve ${made.data.requisitionNumber}: ${approved.status} ${approved.message}`)

  const { page, errors } = await open(officer, "/procurement-v23/purchase-orders")
  await page.click('[data-action="create-po-v6"]')
  await page.waitForSelector("#poFormV23")
  await page.selectOption("#poSourceV23", made.data.id)
  // A PO is sent by email, so pick a vendor that has one.
  const vendors = (await api(officer, "/accounting/vendors")) ?? []
  const mailable = (Array.isArray(vendors) ? vendors : vendors.vendors ?? []).find((v) => !v.isBlacklisted && String(v.email ?? "").includes("@"))
  if (!mailable) return record(false, label, "no vendor with an email address to send to")
  await page.selectOption('#poFormV23 [name="vendor"]', mailable.id)
  await page.waitForSelector("#poLinesV23 [data-po-price]")
  const prefilled = await page.inputValue("#poLinesV23 [data-po-price]")
  await page.click('[data-action="submit-po-v6"]')
  const toast = await toasts(page)
  const po = ((await api(officer, "/procurement/purchase-orders")) ?? []).find((p) => p.requisitionId === made.data.id)
  const req = await api(officer, `/procurement/requisitions/${made.data.id}`)
  record(
    po?.status === "SENT" && req?.status === "CONVERTED_TO_PO" && Number(prefilled) === 120,
    label,
    `${made.data.requisitionNumber} (estimate prefilled ${prefilled}) -> ${po ? `${po.poNumber} ${po.status} total ${po.totalAmount}` : "no PO"}, requisition ${req?.status} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 13. pay an invoice
await step("13 Accountant records payment of an approved invoice (Record payment form)", async (open) => {
  const label = "13 Accountant records payment of an approved invoice (Record payment form)"
  const ap = "proc.ap@nts.local"
  const finance = "payroll.finmgr@nts.local"
  let invoices = (await api(ap, "/procurement/invoices")) ?? []
  let target = invoices.find((i) => i.status === "APPROVED" && !["PAID", "PARTIALLY_PAID"].includes(i.paymentStatus))
  if (!target) {
    // Arrange: accounts payable captures an invoice against a dispatched PO if none is waiting,
    // then Finance approves it, so there is one to pay.
    let draft = invoices.find((i) => i.status === "DRAFT")
    if (!draft) {
      const orders = (await api(ap, "/procurement/purchase-orders")) ?? []
      const po = orders.find((o) => ["SENT", "ACKNOWLEDGED", "PARTIALLY_DELIVERED", "DELIVERED"].includes(o.status) && (o.items ?? []).length)
      if (!po) return record(false, label, "no dispatched PO to invoice — run the p2p flow first")
      const captured = await apiCall(ap, "POST", "/procurement/invoices", {
        purchaseOrderId: po.id,
        vendorId: po.vendorId,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 864e5).toISOString(),
        currencyId: po.currencyId ?? undefined,
        items: po.items.map((i) => ({ itemName: i.itemName, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), unit: i.unit ?? undefined })),
      })
      if (captured.status !== 201) return record(false, label, `could not capture an invoice on ${po.poNumber}: ${captured.status} ${captured.message}`)
      draft = captured.data
    }
    const ok = await apiCall(finance, "PUT", `/procurement/invoices/${draft.id}/approve`, { isTaxable: true })
    if (ok.status !== 200) return record(false, label, `could not approve ${draft.invoiceNumber}: ${ok.status} ${ok.message}`)
    target = { ...draft, status: "APPROVED" }
  }
  const { page, errors } = await open(ap, "/procurement-v23/invoices")
  await page.click('[data-action="record-payment-v23"]')
  await page.waitForSelector("#paymentFormV23")
  await page.selectOption("#paymentInvoiceV23", target.id)
  const amount = await page.inputValue("#paymentAmountV23")
  await page.fill('#paymentFormV23 [name="reference"]', `UAT-V23-PAY-${RUN}`)
  await page.setInputFiles('#paymentFormV23 [name="proof"]', { name: "uat-proof.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") })
  await page.click('[data-action="confirm-record-payment-v23"]')
  const toast = await toasts(page)
  const after = ((await api(ap, "/procurement/invoices")) ?? []).find((i) => i.id === target.id)
  record(
    after?.paymentStatus === "PAID" && Number(amount) === Number(target.totalAmount),
    label,
    `${target.invoiceNumber} amount ${amount} -> payment ${after?.paymentStatus}, journal ${after?.journalEntry?.referenceNumber ?? "none"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 14. annual plan
await step("14 Procurement Manager creates an annual plan with a line (plan form)", async (open) => {
  const label = "14 Procurement Manager creates an annual plan with a line (plan form)"
  const email = "proc.mgr@nts.local"
  const name = `UAT P2P plan ${RUN}`
  const { page, errors } = await open(email, "/procurement-v23/plan")
  await page.click('[data-action="create-plan-v5"]')
  await page.waitForSelector("#planFormV23")
  await page.fill('#planFormV23 [name="name"]', name)
  await page.fill('#planFormV23 [name="department"]', "Operations")
  await page.fill('#planFormV23 [name="budget"]', "150000")
  await page.fill("#planFormV23 [data-plan-line] [data-plan-desc] >> nth=0", "UAT P2P laptops refresh")
  await page.fill("#planFormV23 [data-plan-line] [data-plan-value] >> nth=0", "42000")
  await page.click('[data-action="create-plan-confirm-v5"]')
  const toast = await toasts(page)
  const plan = ((await api(email, "/procurement/plans")) ?? []).find((p) => p.name === name)
  record(
    plan?.status === "DRAFT" && plan.items?.length === 1 && Number(plan.budget) === 150000,
    label,
    `${plan ? `${plan.planNumber} ${plan.status}, ${plan.items?.length} line(s), planned ${plan.plannedValue}` : "no plan"} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 15. submit and approve the plan
await step("15 Plan submitted by its author, approved by the Finance Manager (Approval Centre)", async (open) => {
  const label = "15 Plan submitted by its author, approved by the Finance Manager (Approval Centre)"
  const author = "proc.mgr@nts.local"
  const finance = "payroll.finmgr@nts.local"
  const plan = ((await api(author, "/procurement/plans")) ?? []).find((p) => p.name === `UAT P2P plan ${RUN}`)
  if (!plan) return record(false, label, "no plan from step 14")
  {
    const { page, errors } = await open(author, "/procurement-v23/plan")
    await page.click(`[data-action="open-plan-detail-v5"][data-id="${plan.planNumber}"] >> nth=0`)
    await page.waitForSelector('[data-action="submit-plan"]')
    await page.click('[data-action="submit-plan"] >> nth=0')
    const toast = await toasts(page)
    const submitted = ((await api(author, "/procurement/plans")) ?? []).find((p) => p.id === plan.id)
    if (submitted?.status !== "SUBMITTED") return record(false, label, `submit -> ${submitted?.status} · "${toast}"${suffix(errors)}`)
  }
  const { page, errors } = await open(finance, "/procurement-v23/approvals")
  const control = `[data-action="approve-prompt-v6"][data-id="PLAN-${plan.planNumber}"]`
  if (!(await promptOnScreen(page, control))) return record(false, label, await explainMissingPrompt(page, control, errors))
  await page.click(control)
  const toast = await toasts(page)
  const after = ((await api(finance, "/procurement/plans")) ?? []).find((p) => p.id === plan.id)
  record(after?.status === "APPROVED", label, `${plan.planNumber} -> ${after?.status} · "${toast}"${suffix(errors)}`)
})

// ------------------------------------------------------------------ 16. contract from an award
await step("16 Procurement Manager creates a contract from an award and activates it", async (open) => {
  const label = "16 Procurement Manager creates a contract from an award and activates it"
  const email = "proc.mgr@nts.local"
  const title = `UAT P2P supply agreement ${RUN}`
  const { page, errors } = await open(email, "/procurement-v23/contracts")
  await page.click('[data-action="create-contract-v6"]')
  await page.waitForSelector("#contractFormV23")
  const awards = await page.$$eval("#contractSourceV23 option", (os) => os.map((o) => o.value).filter(Boolean))
  if (!awards.length) return record(false, label, `no uncontracted award to contract${suffix(errors)}`)
  await page.selectOption("#contractSourceV23", awards[0])
  await page.fill('#contractFormV23 [name="title"]', title)
  await page.click('[data-action="save-contract-v6"]')
  const saveToast = await toasts(page)
  const created = ((await api(email, "/procurement/contracts")) ?? []).find((c) => c.title === title)
  if (!created) return record(false, label, `no contract saved · "${saveToast}"${suffix(errors)}`)
  // Saving reloads the register; a menu opened before that re-render lands is closed by it. Wait
  // until the runtime holds the new contract, then let the redraw settle.
  await page.waitForFunction(
    (n) => (window.MatanhoProcurementUI?.getSnapshot?.()?.contractsV6 || []).some((c) => c.id === n),
    created.contractNumber,
    { timeout: 30000 },
  )
  await page.waitForTimeout(1200)
  // Row actions sit behind each row's menu button (a later runtime layer folds them into it).
  const row = page.locator("table tbody tr", { hasText: created.contractNumber })
  await row.first().waitFor()
  await row.first().locator('[data-action="row-actions-v16"]').click()
  await page.click(`[data-action="edit-contract-v6"][data-id="${created.contractNumber}"]`)
  await page.waitForSelector(`[data-action="activate-contract-v23"][data-id="${created.id}"]`)
  await page.click(`[data-action="activate-contract-v23"][data-id="${created.id}"]`)
  const toast = await toasts(page)
  const after = ((await api(email, "/procurement/contracts")) ?? []).find((c) => c.id === created.id)
  record(
    after?.status === "ACTIVE" && after.quotationId === awards[0],
    label,
    `${created.contractNumber} ${after?.status}, value ${after?.value}, vendor ${after?.vendorName} · "${toast}"${suffix(errors)}`,
  )
})

// ------------------------------------------------------------------ 17. document vault upload
await step("17 Procurement Officer files a document in the vault (Upload document form)", async (open) => {
  const label = "17 Procurement Officer files a document in the vault (Upload document form)"
  const email = "proc.officer@nts.local"
  const name = `UAT P2P tender pack ${RUN}`
  const { page, errors } = await open(email, "/procurement-v23/documents")
  await page.click('[data-action="upload-document-v5"] >> nth=0')
  await page.waitForSelector("#uploadDocumentFormV5")
  await page.setInputFiles('#uploadDocumentFormV5 [name="files"]', { name: "uat-tender-pack.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") })
  await page.fill('#uploadDocumentFormV5 [name="name"]', name)
  await page.selectOption('#uploadDocumentFormV5 [name="folder"]', "Tenders & Bids")
  await page.click('[data-action="confirm-upload-document-v5"]')
  const toast = await toasts(page)
  const doc = ((await api(email, "/procurement/documents")) ?? []).find((d) => d.name === name)
  record(
    Boolean(doc && doc.folder === "Tenders & Bids" && doc.fileUrl),
    label,
    `${doc ? `${doc.name} ${doc.version} ${doc.status} in ${doc.folder}` : "no document"} · "${toast}"${suffix(errors)}`,
  )
})

const failed = results.filter((r) => !r.ok)
console.log(`\n=== RESULT === ${results.length - failed.length}/${results.length} verified through the API`)
process.exit(failed.length ? 1 : 0)
