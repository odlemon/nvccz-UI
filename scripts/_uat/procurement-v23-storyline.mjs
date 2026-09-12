/**
 * Procurement V23 — the whole storyline, A to Z, through the UI as the people who do each step.
 *
 *   node scripts/_uat/procurement-v23-storyline.mjs [--base=https://dev.matanho.com] [--out=dir]
 *
 * The same twenty steps as design-refs/procurement-v23/PROCUREMENT_TEST_WALKTHROUGH.md: plan, requisition
 * (draft, return, correct, approve), RFQ, vendor quotations through the portal page, scoring, award, PO,
 * goods received and inspected, AI invoice capture, invoice approval, payment, journal posting, contract,
 * document versions, audit trail — plus the refusals along the way. Every page is reached from the sidebar
 * after another page (the way a person gets there), and every outcome is verified through the API.
 * A step whose inputs an earlier step failed to produce is skipped with the reason, not failed.
 *
 * Dev only. It writes a full procure-to-pay chain. Run it with the dev mail guard on.
 *   Env: API, STAFF_BASE, NEXT_PUBLIC_API_BASE_URL (all dev), UAT_LOAD_TIMEOUT_MS,
 *        UAT_MINT_VENDOR_TOKEN_CMD — a command that prints a vendor RFQ token for "{vendorId} {rfqId}"
 *        (step 8 is skipped without it; vendor links are emailed, and dev email is blocked).
 */
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { chromium } from "playwright"
import { API, PASSWORD, seedAuth, STAFF_BASE } from "./_routes.mjs"

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const BASE = arg("base") || STAFF_BASE
const OUT = path.resolve(arg("out") || ".procurement-storyline")
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 120000)
const MINT = process.env.UAT_MINT_VENDOR_TOKEN_CMD || ""
const VENDOR_BASE = process.env.UAT_VENDOR_BASE || BASE.replace("://dev.", "://dev.vendor.")
const PDF = path.resolve("scripts/_uat/fixtures/test-invoice.pdf")
const RUN = String(Date.now()).slice(-7)
fs.mkdirSync(OUT, { recursive: true })

const U = {
  mgr: "proc.mgr@nts.local",
  officer: "proc.officer@nts.local",
  buyer: "proc.buyer@nts.local",
  requester: "proc.requester@nts.local",
  head: "perf.deptmgr@nts.local",
  ap: "proc.ap@nts.local",
  finance: "payroll.finmgr@nts.local",
  auditor: "payroll.intaudit@nts.local",
}
/** The invoice PDF's lines; the requisition, the quotations and the PO carry the same three. */
const LINES = [
  { itemName: "A4 Bond Paper (ream)", quantity: 40, unit: "Ream", price: 6.5 },
  { itemName: "Ballpoint Pens (box of 50)", quantity: 12, unit: "Box", price: 14.25 },
  { itemName: "Lever Arch Files", quantity: 25, unit: "Each", price: 3.8 },
]
const PAGE_PATHS = {
  dashboard: "/procurement-v23", plan: "/procurement-v23/plan", approvals: "/procurement-v23/approvals",
  requisitions: "/procurement-v23/requisitions", tenders: "/procurement-v23/tenders", quotations: "/procurement-v23/quotations",
  evaluation: "/procurement-v23/evaluation", vendors: "/procurement-v23/vendors", contracts: "/procurement-v23/contracts",
  orders: "/procurement-v23/purchase-orders", receiving: "/procurement-v23/goods-received", invoices: "/procurement-v23/invoices",
  intake: "/procurement-v23/intake", accounts: "/procurement-v23/accounts", documents: "/procurement-v23/documents",
  audit: "/procurement-v23/audit", settings: "/procurement-v23/settings",
}

// ------------------------------------------------------------------ API
const tokens = {}
async function token(email) {
  if (!tokens[email]) {
    const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: PASSWORD, portal: "staff" }) })
    const j = await r.json().catch(() => ({}))
    tokens[email] = j.token || j?.data?.token
    if (!tokens[email]) throw new Error(`sign in ${email}: ${r.status}`)
  }
  return tokens[email]
}
async function api(email, p) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const r = await fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${await token(email)}` } })
      const j = await r.json().catch(() => ({}))
      return j?.data ?? j
    } catch (e) {
      if (attempt === 3) throw e
      await new Promise((res) => setTimeout(res, 5000))
    }
  }
}
const list = (d) => (Array.isArray(d) ? d : d?.items ?? d?.rows ?? d?.data ?? [])

// ------------------------------------------------------------------ browser
const browser = await chromium.launch()
const contexts = {}
async function contextFor(email) {
  if (!contexts[email]) {
    contexts[email] = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
    await seedAuth(contexts[email], BASE, email, "staff")
  }
  return contexts[email]
}

/** Open a page the way a person does: another procurement page first, then the sidebar. */
async function openVia(email, pageId) {
  const ctx = await contextFor(email)
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  const start = pageId === "approvals" ? "settings" : "approvals"
  await page.goto(`${BASE}${PAGE_PATHS[start]}`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("#nav .nav-item", { timeout: LOAD })
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: LOAD })
  await page.locator(`#nav .nav-item[data-page="${pageId}"]`).first().click()
  await page.waitForFunction((p) => location.pathname === p, PAGE_PATHS[pageId], { timeout: LOAD })
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: LOAD })
  await page.waitForTimeout(2000)
  return { page, errors }
}

/** The newest toast whose text matches, or every toast text seen if none does. */
async function toast(page, re, timeout = 30000) {
  const end = Date.now() + timeout
  const seen = new Set()
  while (Date.now() < end) {
    const now = await page.locator("[data-sonner-toast], #toasts .toast").allTextContents().catch(() => [])
    for (const t of now) if (t.trim()) seen.add(t.trim())
    const hit = [...seen].find((t) => re.test(t))
    if (hit) return hit
    await page.waitForTimeout(300)
  }
  return `(no matching toast; saw ${JSON.stringify([...seen].map((t) => t.slice(0, 120)))})`
}

/** Click a row's control, directly or through the row's actions menu. */
async function rowAction(page, rowText, actions, id = rowText) {
  const direct = page.locator(actions.map((a) => `[data-action="${a}"][data-id="${id}"]`).join(", ")).first()
  if (await direct.isVisible().catch(() => false)) return direct.click()
  const row = page.locator("table tbody tr", { hasText: rowText }).first()
  await row.waitFor({ timeout: 30000 })
  // Most registers fold row buttons into the ⋮ menu; the Document Vault has its own document menu.
  await row.locator('[data-action="row-actions-v16"], [data-action="doc-menu-v11"]').first().click()
  await page.waitForTimeout(500)
  const item = page.locator(`${actions.map((a) => `[data-action="${a}"]`).join(", ")} >> visible=true`).first()
  if (!(await item.count())) {
    const offered = await page.$$eval(".row-actions-menu-v16 [data-action], .document-actions-menu-v11 [data-action]", (els) => els.map((e) => e.dataset.action)).catch(() => [])
    throw new Error(`row "${rowText}" offers none of ${actions.join("/")} (menu: ${offered.join(", ")})`)
  }
  return item.click()
}

/** An approval prompt's Approve, scrolled into view. */
async function approvePrompt(page, id) {
  const control = page.locator(`[data-action="approve-prompt-v6"][data-id="${id}"]`).first()
  await control.waitFor({ state: "attached", timeout: 30000 })
  await control.scrollIntoViewIfNeeded()
  await control.click()
}

// ------------------------------------------------------------------ steps
const results = []
const ctx = {}
async function step(n, title, needs, fn) {
  const label = `${String(n).padStart(2)} ${title}`
  const missing = needs.filter((k) => ctx[k] == null)
  if (missing.length) {
    results.push({ n, title, ok: false, skipped: true, detail: `skipped: needs ${missing.join(", ")}` })
    console.log(`  SKIP  ${label} · needs ${missing.join(", ")}`)
    return
  }
  const opened = []
  const track = async (email, pageId) => {
    const o = await openVia(email, pageId)
    opened.push(o)
    return o
  }
  try {
    const detail = await fn(track)
    const errs = opened.flatMap((o) => o.errors)
    const ok = detail.ok && errs.length === 0
    results.push({ n, title, ok, detail: `${detail.text}${errs.length ? ` · page errors: ${errs.slice(0, 2).join(" | ")}` : ""}` })
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} · ${results.at(-1).detail}`)
    if (!ok) for (const [i, o] of opened.entries()) await o.page.screenshot({ path: path.join(OUT, `step${n}-${i}.png`) }).catch(() => {})
  } catch (e) {
    const msg = String(e?.message || e).split("\n")[0].slice(0, 240)
    results.push({ n, title, ok: false, detail: `threw: ${msg}` })
    console.log(`  FAIL  ${label} · threw: ${msg}`)
    for (const [i, o] of opened.entries()) await o.page.screenshot({ path: path.join(OUT, `step${n}-${i}.png`) }).catch(() => {})
  } finally {
    for (const o of opened) await o.page.close().catch(() => {})
  }
}

try {
  await step(1, "Procurement Manager creates and submits the annual plan; no self-approval", [], async (open) => {
    const name = `Storyline plan ${RUN}`
    const { page } = await open(U.mgr, "plan")
    await page.click('[data-action="create-plan-v5"]')
    await page.waitForSelector("#planFormV23")
    await page.fill('#planFormV23 [name="name"]', name)
    await page.fill('#planFormV23 [name="department"]', "Operations")
    await page.fill('#planFormV23 [name="budget"]', "150000")
    await page.fill("#planFormV23 [data-plan-line] [data-plan-desc] >> nth=0", "Office stationery")
    await page.fill("#planFormV23 [data-plan-line] [data-plan-value] >> nth=0", "42000")
    await page.click('[data-action="create-plan-confirm-v5"]')
    const t1 = await toast(page, /created as a draft/i)
    let plan = list(await api(U.mgr, "/procurement/plans")).find((p) => p.name === name)
    if (plan?.status !== "DRAFT") return { ok: false, text: `create -> ${plan?.status ?? "nothing saved"} · "${t1}"` }
    await page.waitForTimeout(1500)
    await page.click(`[data-action="open-plan-detail-v5"][data-id="${plan.planNumber}"] >> nth=0`)
    await page.waitForSelector('[data-action="submit-plan"]', { timeout: 30000 })
    await page.click('[data-action="submit-plan"] >> nth=0')
    const t2 = await toast(page, /submitted for budget approval/i)
    plan = list(await api(U.mgr, "/procurement/plans")).find((p) => p.id === plan.id)
    const approvals = await open(U.mgr, "approvals")
    const selfApprove = await approvals.page.locator(`[data-action="approve-prompt-v6"][data-id="PLAN-${plan.planNumber}"]`).count()
    ctx.plan = plan.status === "SUBMITTED" ? plan : null
    return { ok: plan.status === "SUBMITTED" && selfApprove === 0, text: `${plan.planNumber} DRAFT -> ${plan.status}; author offered approve: ${selfApprove ? "YES" : "no"} · "${t2}"` }
  })

  await step(2, "Finance Manager approves the plan", ["plan"], async (open) => {
    const { page } = await open(U.finance, "approvals")
    await approvePrompt(page, `PLAN-${ctx.plan.planNumber}`)
    const t = await toast(page, /approved as the plan baseline/i)
    const after = list(await api(U.finance, "/procurement/plans")).find((p) => p.id === ctx.plan.id)
    return { ok: after?.status === "APPROVED", text: `${ctx.plan.planNumber} -> ${after?.status} · "${t}"` }
  })

  await step(3, "Requester raises a three-line requisition, saves a draft, edits and submits it", [], async (open) => {
    const title = `Storyline stationery restock ${RUN}`
    const { page } = await open(U.requester, "requisitions")
    await page.click('[data-action="create-requisition"]')
    await page.waitForSelector("#prForm")
    await page.fill('#prForm [name="title"]', title)
    const categories = await page.$$eval('#prForm select[name="category"] option', (os) => os.map((o) => o.value))
    if (!categories.includes("Office Supplies")) return { ok: false, text: `the Category list does not offer Office Supplies (${categories.join(", ")})` }
    await page.selectOption('#prForm select[name="category"]', "Office Supplies")
    const addLine = page.locator('#prForm [data-action="add-pr-line-v23"]')
    if (!(await addLine.count())) return { ok: false, text: "the New requisition form has no Add line" }
    for (let i = 1; i < LINES.length; i += 1) await addLine.click()
    const rows = page.locator("#prForm [data-pr-line]")
    if ((await rows.count()) !== LINES.length) return { ok: false, text: `expected ${LINES.length} lines on the form, found ${await rows.count()}` }
    for (const [i, l] of LINES.entries()) {
      await rows.nth(i).locator('[name="item"]').fill(l.itemName)
      await rows.nth(i).locator('[name="qty"]').fill(String(l.quantity))
      await rows.nth(i).locator('[name="price"]').fill(String(l.price))
    }
    const total = (await page.locator("#prLinesTotalV23").textContent())?.trim()
    await page.fill('#prForm [name="motivation"]', "Quarterly stationery restock for the Operations office.")
    await page.click('[data-action="save-pr"]')
    const t1 = await toast(page, /saved as a draft/i)
    let req = list(await api(U.requester, "/procurement/requisitions/my")).find((r) => r.title === title)
    if (req?.status !== "DRAFT" || (req.items ?? []).length !== LINES.length) {
      return { ok: false, text: `save draft -> ${req?.status ?? "nothing saved"}, ${(req?.items ?? []).length} line(s) · "${t1}" · form total "${total}"` }
    }
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: LOAD })
    await page.waitForTimeout(1500)
    await rowAction(page, req.requisitionNumber, ["edit-pr-v11", "edit-record-v5", "edit-pr"])
    await page.waitForTimeout(800)
    await page.locator(':is(#modalLayer.open, #drawerLayer.open) input[name="title"]').first().fill(`${title} (edited)`)
    await page.locator(':is(#modalLayer.open, #drawerLayer.open) :is([data-action="submit-pr-v11"], [data-action="submit-pr"])').first().click()
    const t2 = await toast(page, /submitted to the .* department head/i)
    req = await api(U.requester, `/procurement/requisitions/${req.id}`)
    ctx.req = req?.status === "PENDING_APPROVAL" ? req : null
    return { ok: Boolean(ctx.req), text: `${req.requisitionNumber}: ${(req.items ?? []).length} lines, form total "${total}", DRAFT -> ${req?.status} · "${t2}"` }
  })

  await step(4, "Department head returns it with a reason", ["req"], async (open) => {
    const { page } = await open(U.head, "requisitions")
    const n = ctx.req.requisitionNumber
    await rowAction(page, n, ["review-pr-v11"])
    await page.click(`[data-action="reject-pr-v11"][data-id="${n}"]`)
    await page.waitForSelector("#rejectPrFormV11")
    await page.fill('#rejectPrFormV11 [name="reason"]', `Please confirm the quantity of pens ${RUN}`)
    await page.click(`[data-action="confirm-reject-pr-v11"][data-id="${n}"]`)
    const t = await toast(page, /returned to the requester/i)
    const after = await api(U.head, `/procurement/requisitions/${ctx.req.id}`)
    return { ok: after?.status === "REJECTED", text: `${n} -> ${after?.status}, reason "${String(after?.rejectionReason ?? "").slice(0, 50)}" · "${t}"` }
  })

  await step(5, "Requester corrects and resubmits", ["req"], async (open) => {
    const { page } = await open(U.requester, "requisitions")
    const n = ctx.req.requisitionNumber
    await rowAction(page, n, ["edit-pr-v11", "resubmit-pr-v11", "edit-record-v5"])
    await page.waitForTimeout(800)
    await page.locator(':is(#modalLayer.open, #drawerLayer.open) input[name="title"]').first().fill(`Storyline stationery restock ${RUN} (pens confirmed)`)
    await page.locator(':is(#modalLayer.open, #drawerLayer.open) :is([data-action="submit-pr-v11"], [data-action="submit-pr"])').first().click()
    const t = await toast(page, /resubmitted|submitted to/i)
    const after = await api(U.requester, `/procurement/requisitions/${ctx.req.id}`)
    return { ok: after?.status === "PENDING_APPROVAL", text: `${n} -> ${after?.status} · "${t}"` }
  })

  await step(6, "Department head approves", ["req"], async (open) => {
    const { page } = await open(U.head, "requisitions")
    const n = ctx.req.requisitionNumber
    await rowAction(page, n, ["review-pr-v11"])
    await page.click(`[data-action="approve-pr-v11"][data-id="${n}"]`)
    const t = await toast(page, /approved/i)
    const after = await api(U.head, `/procurement/requisitions/${ctx.req.id}`)
    ctx.approvedReq = after?.status === "APPROVED" ? after : null
    return { ok: Boolean(ctx.approvedReq), text: `${n} -> ${after?.status} · "${t}"` }
  })

  await step(7, "Procurement Officer sends an RFQ to two vendors", ["approvedReq"], async (open) => {
    const vendors = list(await api(U.officer, "/accounting/vendors"))
    const pick = ["UAT P2P Stationery World", "UAT P2P Office Supplies Ltd"].map((name) => vendors.find((v) => v.name === name)).filter(Boolean)
    if (pick.length !== 2) return { ok: false, text: "the two UAT P2P vendors are not registered — rebuild the dataset" }
    const title = `Storyline stationery RFQ ${RUN}`
    const { page } = await open(U.officer, "tenders")
    await page.click('[data-action="create-tender"]')
    await page.waitForSelector("#tenderFormV13")
    await page.selectOption('#tenderFormV13 [name="source"]', ctx.approvedReq.id)
    await page.fill('#tenderFormV13 [name="title"]', title)
    const inWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    for (const el of await page.$$("#tenderFormV13 [required]")) {
      const kind = await el.evaluate((n) => (n.tagName === "INPUT" ? n.type : n.tagName.toLowerCase()))
      if (await el.evaluate((n) => Boolean(n.value)) || ["checkbox", "radio", "select"].includes(kind)) continue
      if (kind === "date") await el.fill(inWeek)
      else if (kind === "datetime-local") await el.fill(`${inWeek}T12:00`)
      else if (kind === "number") await el.fill("1")
      else await el.fill("Storyline")
    }
    // The builder shows only vendors matching the chosen category, and in "all eligible" mode ticks every one
    // of them. Both vendors are Office Supplies: choose that category, then a controlled shortlist of the two.
    const category = page.locator('#tenderFormV13 select[name="category"]')
    if (await category.count()) {
      const value = await category.evaluate((sel) => [...sel.options].find((o) => /office/i.test(o.textContent || o.value))?.value ?? null)
      if (value != null) await category.selectOption(value)
    }
    const selectedScope = page.locator('#tenderFormV13 input[name="inviteScope"][value="selected"]')
    if (await selectedScope.count()) await selectedScope.check()
    await page.waitForTimeout(500)
    const boxes = page.locator('#tenderFormV13 input[name="vendors"]:checked')
    for (let i = (await boxes.count()) - 1; i >= 0; i -= 1) await boxes.nth(i).uncheck().catch(() => {})
    const ticks = []
    for (const v of pick) {
      const box = page.locator(`#tenderFormV13 input[name="vendors"][value="${v.id}"]`)
      if (!(await box.count())) { ticks.push(`${v.name}: not listed`); continue }
      if (!(await box.isVisible())) { ticks.push(`${v.name}: hidden by the category filter`); continue }
      if (await box.isDisabled()) { ticks.push(`${v.name}: not eligible`); continue }
      await box.check()
      ticks.push(`${v.name}: ticked`)
    }
    const ticked = await page.locator('#tenderFormV13 input[name="vendors"]:checked').count()
    if (ticked !== 2) return { ok: false, text: `expected exactly the two vendors ticked, got ${ticked} (${ticks.join("; ")})` }
    await page.click('[data-action="create-send-tender-v13"]')
    const t = await toast(page, /sent to/i)
    const rfq = list(await api(U.officer, "/procurement/rfq")).find((r) => r.title === title)
    ctx.rfq = rfq ? { ...rfq, vendors: pick } : null
    return { ok: Boolean(rfq) && ticked === 2, text: `${rfq ? `${rfq.rfqNumber} from ${ctx.approvedReq.requisitionNumber}` : "no RFQ"}, ${ticked} vendor(s) ticked · "${t}"` }
  })

  await step(8, "Two vendors submit quotations through the vendor portal page", ["rfq"], async () => {
    if (!MINT) return { ok: false, text: "UAT_MINT_VENDOR_TOKEN_CMD not set — vendor links cannot be produced on dev" }
    const prices = [[6.5, 14.25, 3.8], [7, 15, 4.1]]
    const done = []
    for (const [vi, v] of ctx.rfq.vendors.entries()) {
      const tok = execSync(MINT.replace("{vendorId}", v.id).replace("{rfqId}", ctx.rfq.procurementRfqId ?? ctx.rfq.id), { encoding: "utf8", timeout: 180000 }).trim()
      if (tok.split(".").length !== 2) return { ok: false, text: `no vendor link for ${v.name}` }
      const vctx = await browser.newContext({ viewport: { width: 1300, height: 1000 } })
      const page = await vctx.newPage()
      const errs = []
      page.on("pageerror", (e) => errs.push(String(e.message || e)))
      const byLabel = (label, nth = 0, tag = "input") => page.locator(`xpath=(//label[starts-with(normalize-space(.), "${label}")])[${nth + 1}]/following-sibling::${tag}[1]`)
      try {
        await page.goto(`${VENDOR_BASE}/vendor-quotations/rfq-respond?token=${encodeURIComponent(tok)}&rfqNumber=${encodeURIComponent(ctx.rfq.rfqNumber)}`, { waitUntil: "domcontentloaded", timeout: LOAD })
        await page.waitForSelector("text=Submit Quotation", { timeout: LOAD })
        await byLabel("Company Name").fill(v.name)
        await byLabel("Contact Person Name").fill(vi ? "Rudo Chikore" : "Tendai Moyo")
        await byLabel("Email Address").fill(v.email || `storyline${vi}@vendors.example.test`)
        await byLabel("Phone Number").fill(`+263 242 000 00${vi}`)
        for (const [i, l] of LINES.entries()) {
          if (i > 0) await page.getByRole("button", { name: /Add Item/ }).click()
          await byLabel("Item Name", i).fill(l.itemName)
          await byLabel("Quantity", i).fill(String(l.quantity))
          await byLabel("Unit Price", i).fill(String(prices[vi][i]))
        }
        await byLabel("Delivery Time").fill(vi ? "14 business days" : "10 business days")
        await byLabel("Quote Valid Until", 0, "button").click()
        await page.locator('[data-radix-popper-content-wrapper] button[aria-label*="next" i], [role="dialog"] button[name="next-month"]').first().click({ timeout: 10000 })
        await page.locator("[data-radix-popper-content-wrapper] button").filter({ hasText: /^15$/ }).first().click({ timeout: 10000 })
        await page.keyboard.press("Escape")
        await page.getByRole("button", { name: /Submit Quotation/ }).click()
        await page.waitForFunction(() => /submitted|thank you|received/i.test(document.body.innerText) && !document.querySelector("form"), null, { timeout: LOAD })
        done.push(v.name)
      } catch (e) {
        await page.screenshot({ path: path.join(OUT, `step8-vendor${vi}.png`) }).catch(() => {})
        return { ok: false, text: `${v.name}: ${String(e?.message || e).split("\n")[0].slice(0, 160)}` }
      } finally {
        await vctx.close()
      }
    }
    const quotes = list(await api(U.officer, "/vendor-quotations")).filter((q) => q.rfqNumber === ctx.rfq.rfqNumber)
    ctx.quotes = quotes.length === 2 ? quotes : null
    return { ok: quotes.length === 2, text: `${ctx.rfq.rfqNumber}: portal submissions from ${done.join(", ")} -> ${quotes.map((q) => `${q.quotationNumber} ${q.status} ${q.totalAmount}`).join(", ") || "none recorded"}` }
  })

  await step(9, "Procurement Officer scores the bids", ["rfq", "quotes"], async (open) => {
    const { page } = await open(U.officer, "evaluation")
    await page.click(`[data-action="open-evaluation"][data-id="${ctx.rfq.rfqNumber}"]`)
    await page.waitForSelector("[data-score-quote]", { timeout: 30000 })
    const inputs = await page.$$("[data-score-quote]")
    const scores = [80, 70, 75]
    for (let i = 0; i < inputs.length; i += 1) await inputs[i].fill(String(scores[i % scores.length]))
    await page.click('[data-action="save-scores"]')
    const t = await toast(page, /scores saved/i)
    const matrix = await api(U.officer, `/procurement/rfqs/${ctx.rfq.procurementRfqId ?? ctx.rfq.id}/comparison-matrix`)
    return { ok: matrix?.evaluationComplete === true, text: `${inputs.length} bids scored, evaluation complete=${matrix?.evaluationComplete} · "${t}"` }
  })

  await step(10, "Procurement Manager awards the winner; a purchase order is raised", ["rfq", "quotes"], async (open) => {
    const { page } = await open(U.mgr, "evaluation")
    await page.click(`[data-action="open-evaluation"][data-id="${ctx.rfq.rfqNumber}"]`)
    await page.waitForSelector('.award-panel-v6 [name="awardWinnerV6"]', { timeout: 30000 })
    const recommended = page.locator('label.award-option-v6:has-text("System recommendation") input[name="awardWinnerV6"]')
    const choice = (await recommended.count()) ? recommended.first() : page.locator('[name="awardWinnerV6"]').first()
    await choice.check()
    await page.click('[data-action="confirm-bid-winner-v6"]')
    await page.waitForSelector('[data-action="save-bid-winner-v6"]', { timeout: 30000 })
    await page.click('[data-action="save-bid-winner-v6"]')
    const t = await toast(page, /awarded to/i)
    const accepted = list(await api(U.mgr, "/vendor-quotations")).find((q) => q.rfqNumber === ctx.rfq.rfqNumber && q.status === "ACCEPTED")
    const po = list(await api(U.mgr, "/procurement/purchase-orders")).find((p) => accepted && p.quotationId === accepted.id)
    ctx.award = accepted ?? null
    ctx.po = po ?? null
    return { ok: Boolean(accepted && po), text: `${accepted ? `${accepted.quotationNumber} (${accepted.companyName})` : "nothing accepted"} -> ${po ? `${po.poNumber} ${po.status}` : "no PO"} · "${t}"` }
  })

  await step(11, "Purchase order is sent; the Buyer is refused Create PO", ["po"], async (open) => {
    let po = list(await api(U.officer, "/procurement/purchase-orders")).find((p) => p.id === ctx.po.id)
    let sendText = `already ${po?.status}`
    if (po?.status === "DRAFT") {
      const { page } = await open(U.officer, "orders")
      await rowAction(page, po.poNumber, ["send-po-v6"])
      sendText = await toast(page, /sent to/i)
      po = list(await api(U.officer, "/procurement/purchase-orders")).find((p) => p.id === ctx.po.id)
    }
    const buyer = await open(U.buyer, "orders")
    await buyer.page.click('[data-action="create-po-v6"]')
    const refusal = await toast(buyer.page, /does not have permission/i, 10000)
    const formOpened = await buyer.page.locator("#poFormV23").isVisible().catch(() => false)
    return { ok: po?.status === "SENT" && /permission/i.test(refusal) && !formOpened, text: `${po?.poNumber} ${po?.status} (${sendText}); Buyer: ${formOpened ? "FORM OPENED" : "refused"} "${refusal}"` }
  })

  await step(12, "Procurement Officer records the goods received note", ["po"], async (open) => {
    const { page } = await open(U.officer, "receiving")
    await page.click('[data-action="record-grn"]')
    await page.waitForSelector("#grnFormV23")
    await page.selectOption("#grnPoV23", ctx.po.id)
    await page.waitForSelector("#grnLinesV23 [data-grn-received]", { timeout: 30000 })
    await page.click('[data-action="create-grn-confirm"]')
    const t = await toast(page, /recorded against/i)
    const grn = list(await api(U.officer, "/procurement/goods-received-notes")).find((g) => g.purchaseOrderId === ctx.po.id)
    ctx.grn = grn?.status === "RECEIVED" ? grn : null
    return { ok: Boolean(ctx.grn), text: `${grn ? `${grn.grnNumber} ${grn.status}, ${grn.items?.length ?? 0} line(s)` : "no GRN"} · "${t}"` }
  })

  await step(13, "Procurement Manager accepts the goods on inspection", ["grn"], async (open) => {
    const { page } = await open(U.mgr, "approvals")
    await approvePrompt(page, `RECEIPT-${ctx.grn.grnNumber}`)
    const t = await toast(page, /accepted on inspection/i)
    const after = list(await api(U.mgr, "/procurement/goods-received-notes")).find((g) => g.id === ctx.grn.id)
    return { ok: String(after?.status).toUpperCase() === "APPROVED", text: `${ctx.grn.grnNumber} -> ${after?.status} · "${t}"` }
  })

  await step(14, "Accountant captures the invoice with AI; saved values match the PDF", ["po"], async (open) => {
    const { page } = await open(U.ap, "intake")
    await page.waitForFunction((id) => [...document.querySelectorAll("#aiInvoicePoV23 option")].some((o) => o.value === id), ctx.po.id, { timeout: 90000 })
    await page.setInputFiles('#aiInvoiceCaptureV23 input[name="document"]', PDF)
    await page.selectOption("#aiInvoicePoV23", ctx.po.id)
    await page.click('[data-action="confirm-extract-invoice-v23"]')
    await page.waitForFunction(() => !/Nothing read yet/i.test(document.querySelector("#aiInvoiceResultV23")?.textContent || ""), null, { timeout: 240000 })
    await page.waitForTimeout(1000)
    await page.locator('#aiInvoiceResultV23 [data-action="capture-invoice-v5"]').first().click()
    await page.waitForSelector("#invoiceCaptureV23", { timeout: 60000 })
    await page.waitForTimeout(800)
    const prices = await page.$$eval("#invoiceCaptureV23 [data-inv-price]", (els) => els.map((e) => Number(e.value)))
    const date = await page.locator('#invoiceCaptureV23 [name="invoiceDate"]').inputValue()
    await page.click('[data-action="confirm-capture-invoice-v5"]')
    const t = await toast(page, /captured against/i)
    const inv = list(await api(U.ap, "/procurement/invoices")).filter((i) => i.purchaseOrderId === ctx.po.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
    const lines = (inv?.items ?? []).map((l) => `${Number(l.quantity)}x${Number(l.unitPrice).toFixed(2)}`)
    const want = LINES.map((l) => `${l.quantity}x${l.price.toFixed(2)}`)
    ctx.invoice = inv?.status === "DRAFT" ? inv : null
    return {
      ok: Boolean(ctx.invoice) && date === "2026-09-08" && JSON.stringify(prices) === JSON.stringify(LINES.map((l) => l.price)) && JSON.stringify(lines) === JSON.stringify(want),
      text: `prefilled date ${date}, prices [${prices.join(", ")}] -> ${inv ? `${inv.invoiceNumber} ${inv.status}, lines ${lines.join(" ")}, total ${inv.totalAmount}` : "no invoice"} · "${t}"`,
    }
  })

  await step(15, "Finance Manager approves the invoice", ["invoice"], async (open) => {
    const { page } = await open(U.finance, "approvals")
    await approvePrompt(page, `INVOICE-${ctx.invoice.invoiceNumber}`)
    const t = await toast(page, /approved for payment/i)
    const after = list(await api(U.finance, "/procurement/invoices")).find((i) => i.id === ctx.invoice.id)
    ctx.approvedInvoice = after?.status === "APPROVED" ? after : null
    return { ok: Boolean(ctx.approvedInvoice), text: `${ctx.invoice.invoiceNumber} -> ${after?.status}, match ${after?.matchingStatus} · "${t}"` }
  })

  await step(16, "Accountant records the payment with proof", ["approvedInvoice"], async (open) => {
    const { page } = await open(U.ap, "invoices")
    await page.click('[data-action="record-payment-v23"]')
    await page.waitForSelector("#paymentFormV23")
    await page.selectOption("#paymentInvoiceV23", ctx.invoice.id)
    await page.fill('#paymentFormV23 [name="reference"]', `STORY-PAY-${RUN}`)
    await page.setInputFiles('#paymentFormV23 [name="proof"]', { name: "proof.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") })
    await page.click('[data-action="confirm-record-payment-v23"]')
    const t = await toast(page, /paid to/i)
    const after = list(await api(U.ap, "/procurement/invoices")).find((i) => i.id === ctx.invoice.id)
    ctx.paid = after?.paymentStatus === "PAID" ? after : null
    return { ok: Boolean(ctx.paid), text: `${ctx.invoice.invoiceNumber} payment ${after?.paymentStatus}, journal ${after?.journalEntry?.referenceNumber ?? "?"} · "${t}"` }
  })

  await step(17, "Accountant posts the expense journal from Accounts", ["paid"], async (open) => {
    const { page } = await open(U.ap, "accounts")
    const tab = page.locator('[data-action="account-tab"][data-id="journals"]')
    if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(800) }
    const journal = await page.evaluate((inv) => (window.MatanhoProcurementUI?.getSnapshot?.()?.journals || []).find((j) => String(j.id).endsWith(inv)), ctx.invoice.invoiceNumber)
    if (!journal) return { ok: false, text: `no journal for ${ctx.invoice.invoiceNumber} in the queue` }
    await rowAction(page, journal.id, ["post-journal"])
    const t = await toast(page, /posted to the ledger/i)
    const entry = await api(U.ap, `/accounting/journal-entries/${journal.recordId}`)
    const status = entry?.journalEntry?.status ?? entry?.status
    return { ok: status === "POSTED", text: `${journal.id} -> ${status} · "${t}"` }
  })

  await step(18, "Procurement Manager creates a contract from the award and activates it", ["award"], async (open) => {
    const title = `Storyline stationery supply agreement ${RUN}`
    const { page } = await open(U.mgr, "contracts")
    await page.click('[data-action="create-contract-v6"]')
    await page.waitForSelector("#contractFormV23")
    const options = await page.$$eval("#contractSourceV23 option", (os) => os.map((o) => o.value).filter(Boolean))
    if (!options.includes(ctx.award.id)) return { ok: false, text: `the award ${ctx.award.quotationNumber} is not offered (options ${options.length})` }
    await page.selectOption("#contractSourceV23", ctx.award.id)
    await page.fill('#contractFormV23 [name="title"]', title)
    await page.click('[data-action="save-contract-v6"]')
    await toast(page, /saved|draft|created/i, 15000)
    const created = list(await api(U.mgr, "/procurement/contracts")).find((c) => c.title === title)
    if (!created) return { ok: false, text: "no contract saved" }
    await page.waitForFunction((n) => (window.MatanhoProcurementUI?.getSnapshot?.()?.contractsV6 || []).some((c) => c.id === n), created.contractNumber, { timeout: 30000 })
    await page.waitForTimeout(1200)
    await rowAction(page, created.contractNumber, ["edit-contract-v6"])
    await page.click(`[data-action="activate-contract-v23"][data-id="${created.id}"]`)
    const t = await toast(page, /now active/i)
    const after = list(await api(U.mgr, "/procurement/contracts")).find((c) => c.id === created.id)
    ctx.contract = after
    return { ok: after?.status === "ACTIVE", text: `${created.contractNumber} -> ${after?.status}, value ${after?.value} · "${t}"` }
  })

  await step(19, "Procurement Officer files a document, then a new version", [], async (open) => {
    const name = `Storyline RFQ pack ${RUN}`
    const { page } = await open(U.officer, "documents")
    await page.click('[data-action="upload-document-v5"] >> nth=0')
    await page.waitForSelector("#uploadDocumentFormV5")
    await page.setInputFiles('#uploadDocumentFormV5 [name="files"]', { name: "rfq-pack.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") })
    await page.fill('#uploadDocumentFormV5 [name="name"]', name)
    await page.selectOption('#uploadDocumentFormV5 [name="folder"]', "Tenders & Bids")
    await page.click('[data-action="confirm-upload-document-v5"]')
    const t1 = await toast(page, /filed in/i)
    const doc = list(await api(U.officer, "/procurement/documents")).find((d) => d.name === name)
    if (!doc) return { ok: false, text: `no document · "${t1}"` }
    await page.waitForTimeout(2000)
    await rowAction(page, name, ["upload-doc-version-v11"], doc.id)
    await page.waitForSelector("#uploadVersionFormV11")
    await page.setInputFiles('#uploadVersionFormV11 [name="file"]', PDF)
    await page.click('[data-action="confirm-upload-version-v11"]')
    const t2 = await toast(page, /is now v/i)
    const after = list(await api(U.officer, "/procurement/documents")).find((d) => d.id === doc.id)
    ctx.doc = after
    return { ok: Boolean(after && after.version !== doc.version), text: `${name}: ${doc.version} -> ${after?.version} · "${t2}"` }
  })

  await step(20, "Internal Auditor finds the storyline in Audit & Compliance and is refused changes", [], async (open) => {
    const { page } = await open(U.auditor, "audit")
    const rows = await page.$$eval("tbody tr", (trs) => trs.map((r) => (r.textContent || "").replace(/\s+/g, " ")))
    const want = [
      ["plan approval", ctx.plan && new RegExp(`Approve plan.*${ctx.plan.planNumber}`)],
      ["requisition approval", ctx.req && new RegExp(`Approve requisition.*${ctx.req.requisitionNumber}`)],
      ["vendor portal submission", ctx.quotes && /Submit quotation.*vendor portal/],
      ["contract activation", ctx.contract && new RegExp(`Approve contract.*${ctx.contract.contractNumber}`)],
      ["payment", ctx.paid && new RegExp(`Payment invoice.*${ctx.invoice?.invoiceNumber}`)],
    ].filter(([, re]) => re)
    const found = want.map(([label, re]) => [label, rows.some((r) => re.test(r))])
    const plan = await open(U.auditor, "plan")
    await plan.page.click('[data-action="create-plan-v5"]')
    const refusal = await toast(plan.page, /does not have permission/i, 10000)
    return {
      ok: found.every(([, ok]) => ok) && /permission/i.test(refusal),
      text: `${found.map(([l, ok]) => `${l} ${ok ? "found" : "MISSING"}`).join(", ")}; Create plan: "${refusal}"`,
    }
  })
} finally {
  await browser.close()
}

fs.writeFileSync(path.join(OUT, "storyline.json"), JSON.stringify({ run: RUN, base: BASE, results }, null, 2))
const passed = results.filter((r) => r.ok).length
console.log(`=== RESULT === ${passed}/${results.length} storyline steps passed${results.some((r) => r.skipped) ? ` (${results.filter((r) => r.skipped).length} skipped)` : ""}`)
process.exit(passed === results.length ? 0 : 1)
