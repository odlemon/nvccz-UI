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
 *   5. Procurement Officer confirms a GRN in the unconnected modal       -> refused, no GRN created
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

async function session(email, route) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await seedAuth(context, staff.base, email, staff.portal)
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 200)))
  await page.goto(staff.base + route, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".procurement-v23-root", { timeout: 60000 })
  // The live load has landed once the host has published the caller's access.
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: 60000 })
  await page.waitForTimeout(800)
  return { browser, page, errors }
}

async function toasts(page) {
  await page.waitForSelector("[data-sonner-toast]", { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(400)
  return page.$$eval("[data-sonner-toast]", (els) => els.map((e) => e.textContent.trim()).join(" | ")).catch(() => "")
}

const suffix = (errors) => (errors.length ? ` · page errors: ${errors.join(" / ")}` : "")

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
  await page.waitForSelector(control, { timeout: 20000 })
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
  await page.waitForSelector(control, { timeout: 20000 })
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
await step("5 Unconnected GRN confirm is refused, nothing saved", async (open) => {
  const label = "5 Unconnected GRN confirm is refused, nothing saved"
  const email = "proc.officer@nts.local"
  const before = ((await api(email, "/procurement/goods-received-notes")) ?? []).length
  const { page, errors } = await open(email, "/procurement-v23/goods-received")
  await page.click('[data-action="record-grn"]')
  await page.waitForSelector('[data-action="create-grn-confirm"]')
  await page.click('[data-action="create-grn-confirm"]')
  const toast = await toasts(page)
  const after = ((await api(email, "/procurement/goods-received-notes")) ?? []).length
  record(/not connected/i.test(toast) && after === before, label, `GRNs ${before} -> ${after} · "${toast}"${suffix(errors)}`)
})

const failed = results.filter((r) => !r.ok)
console.log(`\n=== RESULT === ${results.length - failed.length}/${results.length} verified through the API`)
process.exit(failed.length ? 1 : 0)
