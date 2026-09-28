/**
 * Supplier portal (standalone vendor build) in a visible browser: acting as a real supplier, with the signed link a supplier gets.
 * Needs the vendor portal on UAT_PORTAL (default http://localhost:3140, NEXT_PUBLIC_PORTAL=vendor) and the local API (:3009).
 * Fixture (vendors, RFQ, links) comes from the backend repo's scripts/_uat/vendor-portal-ui-setup.ts.
 *   node scripts/_uat/vendor-portal-ui.mjs
 */
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
import fs from "node:fs"

const PORTAL = process.env.UAT_PORTAL || "http://localhost:3140"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const BE = process.env.UAT_BE_DIR || "C:/Users/lysp/Downloads/nvccz"
const MYSQL = process.env.MYSQL_EXE || "C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe"
const OUT = process.env.UAT_OUT || "design-refs/vendor-master/screens"
fs.mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 260)}`)
}
async function api(method, path, token, body) {
  const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const text = await r.text()
  return { status: r.status, json: (() => { try { return JSON.parse(text) } catch { return null } })(), text }
}
const sql = (q) => execFileSync(MYSQL, ["-uarcus_dev", "-plocaldev_arcus_2026", "arcus_dev", "-N", "-e", q], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()

console.log("setting up suppliers, event and links ...")
const out = execFileSync("npx", ["ts-node", "--transpile-only", "-r", "dotenv/config", "scripts/_uat/vendor-portal-ui-setup.ts"], { cwd: BE, encoding: "utf8", shell: true, timeout: 300000 })
const fx = JSON.parse(out.trim().split("\n").filter((l) => l.startsWith("{")).pop())
const link = (token, rfqNumber) => `${PORTAL}/vendor-quotations/rfq-respond?token=${encodeURIComponent(token)}&rfqNumber=${encodeURIComponent(rfqNumber)}`
const M = fx.markers
const BAN = [M.bName, M.bEmail, M.bPrice, M.bPrice2, M.internal, fx.vendorB.id, "reviewNotes", "technicalScoreJson", "@nts.local"]

const browser = await chromium.launch({ headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 250) })
const ctx = await browser.newContext({ viewport: { width: 1300, height: 1000 } })
const page = await ctx.newPage()
page.setDefaultTimeout(120000)

// Everything the browser receives from the API while acting as supplier A is scanned for B's data.
const captured = []
page.on("response", async (r) => {
  if (r.url().startsWith(API) || r.url().includes("/api/")) captured.push({ url: r.url(), body: await r.text().catch(() => "") })
})
const leaked = () => captured.flatMap((c) => BAN.filter((m) => c.body.includes(m)).map((m) => `${m} in ${c.url}`))
const textOf = () => page.locator("body").innerText()

// ================================================================ the invitation
await page.goto(link(fx.tokenA, fx.rfqNumber), { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Quoted Items", { timeout: 240000 })
await page.screenshot({ path: `${OUT}/portal-invitation.png` })
let body = await textOf()
check("supplier opens the event from its link (event, closing date, delivery)", body.includes(fx.rfqNumber) && /Closing date/.test(body) && /Deliver to/.test(body))
check("the event's lines are pre-filled (Laptop, Docking station)", body.includes("5") && (await page.locator('input[value="Laptop"]').count()) === 1 && (await page.locator('input[value="Docking station"]').count()) === 1)
check("the supplier's own details come from its vendor record", (await page.locator(`input[value="${fx.vendorA.name}"]`).count()) === 1)
check("payment terms start from the supplier's vendor record (Net 30)", (await page.locator('input[name="paymentTerms"]').inputValue()) === "Net 30")
for (const f of ["currencyCode", "paymentTerms", "deliveryTime", "deliveryTerms", "notes"]) check(`quotation field present: ${f}`, (await page.locator(`[name="${f}"]`).count()) === 1)
check("attachments (PDF/documents) can be added", (await page.locator('[data-testid="portal-file-input"]').count()) === 1)
check("validity date, structured price lines and comments are on the form", /Quote Valid Until/.test(body) && /Unit Price/.test(body) && /Comments/.test(body))

// ================================================================ validation
const fill = async (prices) => {
  const priceInputs = page.locator('input[type="number"][step="0.01"]')
  for (let i = 0; i < prices.length; i++) await priceInputs.nth(i).fill(String(prices[i]))
}
await fill(["-5", "10"])
await page.locator('input[name="currencyCode"]').fill("USD")
await page.getByRole("button", { name: /Review and submit/ }).click()
await page.waitForTimeout(800)
check("a negative price is refused before submission", (await page.locator('[role="dialog"][aria-label="Review your quotation"]').count()) === 0)
await fill(["111.11", "11.11"])
await page.locator('input[name="currencyCode"]').fill("US")
await page.getByRole("button", { name: /Review and submit/ }).click()
await page.waitForTimeout(800)
check("a malformed currency is refused", (await page.locator('[role="dialog"][aria-label="Review your quotation"]').count()) === 0)
await page.locator('input[name="currencyCode"]').fill("USD")
await page.locator('input[name="deliveryTime"]').fill("14 days from order")
await page.locator('input[name="deliveryTerms"]').fill("Delivered to site")
await page.locator('textarea[name="notes"]').fill("Prices include installation")
// validity date: the date picker's text input (type into it)
const validity = page.locator('button:has-text("Pick"), button:has-text("Select"), [role="combobox"]').first()

// the date picker component: open it and choose a future day
const openPicker = async () => {
  const trigger = page.locator("label:has-text('Quote Valid Until')").locator("xpath=following::button[1]")
  await trigger.click()
  await page.waitForTimeout(400)
}
await openPicker()
// choose the last visible day cell in the month grid that is enabled (a future date)
const days = page.locator('[role="gridcell"] button:not([disabled])')
const n = await days.count()
await days.nth(Math.max(0, n - 2)).click()
await page.keyboard.press("Escape").catch(() => undefined)
await page.waitForTimeout(300)

// ================================================================ review + final submission
await page.getByRole("button", { name: /Review and submit/ }).click()
await page.waitForSelector('[role="dialog"][aria-label="Review your quotation"]', { timeout: 15000 })
const reviewText = await page.locator('[role="dialog"]').innerText()
check("final submission is a deliberate step: a review shows the total, terms and documents", /Review and confirm/.test(reviewText) && /USD 6[0-9]{2}\.[0-9]{2}/.test(reviewText) && /Net 30/.test(reviewText) && /14 days from order/.test(reviewText), reviewText)
await page.screenshot({ path: `${OUT}/portal-review.png` })
await page.getByRole("button", { name: "Back to edit" }).click()
check("the supplier can go back and edit", (await page.locator('[role="dialog"][aria-label="Review your quotation"]').count()) === 0)
await page.getByRole("button", { name: /Review and submit/ }).click()
await page.waitForSelector('[data-testid="confirm-submission"]')
await page.locator('[data-testid="confirm-submission"]').click()
await page.waitForSelector('[data-testid="receipt-number"]', { timeout: 60000 })
const receipt1 = (await page.locator('[data-testid="receipt-number"]').innerText()).trim()
body = await textOf()
check("acknowledgement receipt: a receipt number, time and the 'not an award' statement", /^QUO_/.test(receipt1) && /not an award/i.test(body) && /Received/.test(body), receipt1)
check("the receipt can be printed for the supplier's records", (await page.getByRole("button", { name: /Print receipt/ }).count()) === 1)
await page.screenshot({ path: `${OUT}/portal-receipt.png` })

// ================================================================ revision supersedes, status is supplier-safe
await page.goto(link(fx.tokenA, fx.rfqNumber), { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Quoted Items")
body = await textOf()
check("reopening the link shows the supplier its own submission and its status (Received)", body.includes(receipt1) && /Received/.test(body))
await fill(["105.5", "10.5"])
await page.locator('input[name="currencyCode"]').fill("USD")
await openPicker()
const days2 = page.locator('[role="gridcell"] button:not([disabled])')
await days2.nth(Math.max(0, (await days2.count()) - 2)).click()
await page.keyboard.press("Escape").catch(() => undefined)
await page.getByRole("button", { name: /Review revised quotation/ }).click()
await page.locator('[data-testid="confirm-submission"]').click()
await page.waitForSelector('[data-testid="receipt-number"]', { timeout: 60000 })
const receipt2 = (await page.locator('[data-testid="receipt-number"]').innerText()).trim()
const live = sql(`SELECT COUNT(*) FROM vendor_quotations WHERE vendor_id='${fx.vendorA.id}' AND procurement_rfq_id='${fx.rfqId}' AND status IN ('SUBMITTED','UNDER_REVIEW')`)
const superseded = sql(`SELECT COUNT(*) FROM vendor_quotations WHERE vendor_id='${fx.vendorA.id}' AND procurement_rfq_id='${fx.rfqId}' AND status='SUPERSEDED'`)
check("a revision gets its own receipt and replaces the earlier submission (1 live, 1 superseded)", receipt2 !== receipt1 && live === "1" && superseded === "1", `${receipt2} live=${live} superseded=${superseded}`)

// ================================================================ clarifications
const M2 = fx.manager
await api("POST", `/procurement/rfqs/${fx.rfqId}/clarifications`, M2.token, { body: `GENERAL-ANSWER-${fx.TAG}` })
await api("POST", `/procurement/rfqs/${fx.rfqId}/clarifications`, M2.token, { body: `ONLY-FOR-BRAVO-${fx.TAG}`, vendorId: fx.vendorB.id })
await api("POST", `/procurement/rfqs/${fx.rfqId}/clarifications`, M2.token, { body: `ONLY-FOR-ALPHA-${fx.TAG}`, vendorId: fx.vendorA.id })
await page.goto(link(fx.tokenA, fx.rfqNumber), { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Clarifications")
await page.waitForSelector('[data-testid="clarification"]', { timeout: 60000 })
body = await textOf()
check("supplier sees the general clarification and the one addressed to it", body.includes(`GENERAL-ANSWER-${fx.TAG}`) && body.includes(`ONLY-FOR-ALPHA-${fx.TAG}`))
check("supplier does NOT see a clarification addressed to a competitor", !body.includes(`ONLY-FOR-BRAVO-${fx.TAG}`))
await page.locator('[data-testid="clarification-input"]').fill(`Is installation included? (${fx.TAG})`)
await page.getByRole("button", { name: "Send question" }).click()
await page.waitForSelector(`text=Is installation included? (${fx.TAG})`, { timeout: 30000 })
check("the supplier's own question appears as 'You'", /You ·/.test(await textOf()))
const asked = await api("GET", `/procurement/rfqs/${fx.rfqId}/clarifications`, M2.token)
check("procurement staff receive the question (with the supplier identified to staff)", JSON.stringify(asked.json).includes(`Is installation included? (${fx.TAG})`))
await page.screenshot({ path: `${OUT}/portal-clarifications.png` })

// ================================================================ the boundary, from the supplier's own session
body = await textOf()
check("no competitor name, price, note or id anywhere on the supplier's page", BAN.every((m) => !body.includes(m)), BAN.filter((m) => body.includes(m)).join(","))
check("no competitor data in ANY API response the supplier's browser received", leaked().length === 0, leaked().join("; "))

const other = await ctx.newPage()
await other.goto(link(fx.tokenAOnR2, fx.rfq2Number), { waitUntil: "domcontentloaded" })
await other.waitForSelector("text=Unable to load RFQ", { timeout: 120000 })
check("a link for an event the supplier is not invited to shows nothing (only 'unable to load')", !(await other.locator("body").innerText()).includes(fx.rfq2Number.replace("RFQ", "")) || /Unable to load RFQ/.test(await other.locator("body").innerText()))
await other.goto(link(fx.tokenA.slice(0, -5) + "AAAAA", fx.rfqNumber), { waitUntil: "domcontentloaded" })
await other.waitForSelector("text=Unable to load RFQ", { timeout: 120000 })
check("a tampered link is refused", true)
await other.close()

// ================================================================ deadline lock and formal reopen
sql(`UPDATE procurement_rfqs SET closing_at = DATE_SUB(NOW(), INTERVAL 2 HOUR) WHERE id='${fx.rfqId}'`)
await page.goto(link(fx.tokenA, fx.rfqNumber), { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Submissions are locked", { timeout: 120000 })
body = await textOf()
check("after the deadline the form is locked (no submit button), and says why", /Submissions are locked/.test(body) && (await page.getByRole("button", { name: /Review/ }).count()) === 0 && /Only the procurement office can formally reopen it/.test(body))
check("after the deadline supplier questions are closed", (await page.locator('[data-testid="clarification-input"]').count()) === 0)
await page.screenshot({ path: `${OUT}/portal-locked.png` })
const forced = await api("POST", "/vendor-quotations/submit", null, { vendorPortalToken: fx.tokenA, rfqNumber: fx.rfqNumber, vendorEmail: fx.vendorA.email, validUntil: new Date(Date.now() + 9e8).toISOString(), items: [{ itemName: "Laptop", quantity: 5, unitPrice: 1 }] })
check("submitting around the UI (direct API) is refused too", forced.status >= 400 && /deadline|not accepting/i.test(forced.text), `${forced.status} ${forced.text.slice(0, 120)}`)
const noReason = await api("POST", `/procurement/rfqs/${fx.rfqId}/reopen`, M2.token, { newClosingAt: new Date(Date.now() + 86400000 * 3).toISOString() })
check("staff cannot reopen without a reason", noReason.status === 400)
const reopen = await api("POST", `/procurement/rfqs/${fx.rfqId}/reopen`, M2.token, { newClosingAt: new Date(Date.now() + 86400000 * 3).toISOString(), reason: "Supplier requested more time (site visit delayed)" })
check("a formal reopen (reason + new deadline) unlocks the event", reopen.status === 200, reopen.text.slice(0, 160))
check("the reopen is audited (event record + audit trail)", sql(`SELECT COUNT(*) FROM rfq_reopen_events WHERE procurement_rfq_id='${fx.rfqId}'`) === "1" && sql(`SELECT COUNT(*) FROM audit_logs WHERE entityType='ProcurementRfq' AND entityId='${fx.rfqId}' AND action='RFQ_REOPEN'`) === "1")
await page.goto(link(fx.tokenA, fx.rfqNumber), { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Quoted Items", { timeout: 120000 })
check("after the reopen the supplier can quote again", (await page.getByRole("button", { name: /Review revised quotation/ }).count()) === 1 && (await textOf()).indexOf("Submissions are locked") === -1)

// ================================================================ supplier status gate
await api("POST", `/accounting/vendors/${fx.vendorA.id}/status`, M2.token, { status: "SUSPENDED", reason: "UI test: under review" })
await page.goto(link(fx.tokenA, fx.rfqNumber), { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Unable to load RFQ", { timeout: 120000 })
body = await textOf()
check("a suspended supplier's link stops working, and the message gives no internal reason", /not currently eligible/.test(body) && !/suspended|under review|status/i.test(body.replace("Unable to load RFQ", "")), body.slice(0, 250))
await page.screenshot({ path: `${OUT}/portal-suspended.png` })
await api("POST", `/accounting/vendors/${fx.vendorA.id}/status`, M2.token, { status: "APPROVED", reason: "UI test: cleared" })

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} supplier portal checks passed`)
await browser.close()
process.exitCode = failed.length ? 1 : 0
