/**
 * Quotations, bid opening, evaluation and award (SRD 15-20) in a visible browser, as each real user would use them.
 * Needs the staff FE (UAT_FE, default :3120), the vendor portal build (UAT_PORTAL, default :3140) and the local API (:3009).
 *   node scripts/_uat/sourcing-evaluation-ui.mjs
 */
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const FE = process.env.UAT_FE || "http://localhost:3120"
const PORTAL = process.env.UAT_PORTAL || "http://localhost:3140"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const BE = process.env.UAT_BE_DIR || "C:/Users/lysp/Downloads/nvccz"
const MYSQL = process.env.MYSQL_EXE || "C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe"
const OUT = process.env.UAT_OUT || "design-refs/sourcing-evaluation/screens"
const PDF = path.resolve("scripts/_uat/fixtures/test-invoice.pdf")
fs.mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 300)}`)
}
async function api(method, p, token, body) {
  const r = await fetch(`${API}${p}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const text = await r.text()
  return { status: r.status, json: (() => { try { return JSON.parse(text) } catch { return null } })(), text }
}
const sql = (q) => execFileSync(MYSQL, ["-uarcus_dev", "-plocaldev_arcus_2026", "arcus_dev", "-N", "-e", q], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()

console.log("setting up staff, suppliers and the event ...")
const out = execFileSync("npx", ["ts-node", "--transpile-only", "-r", "dotenv/config", "scripts/_uat/sourcing-ui-setup.ts"], { cwd: BE, encoding: "utf8", shell: true, timeout: 300000 })
const fx = JSON.parse(out.trim().split("\n").filter((l) => l.startsWith("{")).pop())
const link = (token) => `${PORTAL}/vendor-quotations/rfq-respond?token=${encodeURIComponent(token)}&rfqNumber=${encodeURIComponent(fx.rfqNumber)}`

// One browser window, one tab, for the whole run: it is launched once, parked off-screen so it does not sit on top of the user's
// work (UAT_SHOW=1 brings it on screen), and each role signs in in that same tab.
const parked = process.env.UAT_SHOW === "1" ? [] : ["--window-position=-2400,0", "--window-size=1500,1000"]
const browser = await chromium.launch({ args: ["--js-flags=--max-old-space-size=3072", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", ...parked], headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 150) })
const ctx0 = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const P = await ctx0.newPage()
P.setDefaultTimeout(120000)
let curSeen = []
P.on("response", async (r) => { if (r.url().includes("/api/")) { const body = await r.text().catch(() => ""); curSeen.push({ url: r.url(), body }) } })
let cur = null
const bodyText = (page) => page.locator("body").innerText()
const bodyHas = (page, text, ms = 45000) => page.waitForFunction((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), text, { timeout: ms }).then(() => true).catch(() => false)
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
const withToast = async (page, fn) => {
  const texts = () => page.locator("[data-sonner-toast]").allInnerTexts().catch(() => [])
  const before = new Set((await texts()).map((x) => x.replace(/\s+/g, " ")))
  await fn()
  const end = Date.now() + 60000
  while (Date.now() < end) {
    const fresh = (await texts()).map((x) => x.replace(/\s+/g, " ")).filter((x) => !before.has(x))
    if (fresh.length) return fresh[fresh.length - 1]
    await page.waitForTimeout(250)
  }
  return ""
}
/** A role's handle. Nothing is opened here: `as(S)` signs that role in, in the shared tab. */
async function session(u) {
  return { u, page: P, seen: [], ctx: { close: async () => {} } }
}
/** Switch the shared tab to this role: clear the login, sign in as them. A role already signed in is left as it is. */
const as = async (S) => {
  if (cur === S) return
  cur = S
  curSeen = S ? S.seen : []
  await ctx0.clearCookies()
  await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
  await P.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* */ } })
  if (!S) return
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
      await P.waitForTimeout(4500)
      await P.fill('input[type="email"]', S.u.email)
      await P.fill('input[type="password"]', S.u.password)
      await Promise.all([P.waitForResponse((r) => r.url().includes("/auth/login"), { timeout: 45000 }), P.click('button[type="submit"]')])
      break
    } catch (e) {
      if (attempt === 3) throw e
    }
  }
  await P.waitForTimeout(3500)
}
/** Opens the event from the Quotation Comparison register, waiting for the live data to land. */
async function openEvent(page, tab) {
  await page.goto(`${FE}/procurement/quotations`, { waitUntil: "domcontentloaded" })
  const row = page.locator("[data-quote-row-v7]", { hasText: fx.title }).first()
  await row.waitFor({ timeout: 180000 })
  await row.click()
  await bodyHas(page, "Award recommendation")
  await page.waitForFunction(() => !document.body.innerText.includes("Loading the event"), null, { timeout: 90000 }).catch(() => undefined)
  if (tab) await gotoTab(page, tab)
}
const gotoTab = async (page, tab) => {
  await page.locator(`[data-action="sourcing-tab-v23"][data-tab="${tab}"]`).first().click()
  await page.waitForTimeout(800)
}
const priceMarkers = ["222.22", "33.33", "1,111.10"]

// ================================================================ 1. route one: the supplier portal (Alpha)
console.log("\n== Quotation through the supplier portal ==")
{
  await as(null)
  const page = P
  await page.goto(link(fx.tokenA), { waitUntil: "domcontentloaded" })
  await page.waitForSelector("text=Quoted Items", { timeout: 240000 })
  const prices = page.locator('input[type="number"][step="0.01"]')
  await prices.nth(0).fill("300")
  await prices.nth(1).fill("50")
  await page.locator('input[name="currencyCode"]').fill("USD")
  await page.locator('input[name="quotationReference"]').fill(`ALP-${fx.TAG}`)
  await page.locator('input[name="deliveryTime"]').fill("21 days from order")
  await page.locator('input[name="deliveryPeriodDays"]').fill("21")
  check("the portal form asks for reference, date and delivery period", (await page.locator('input[name="quotationDate"]').count()) === 1 && (await page.locator('input[name="quotationReference"]').count()) === 1)
  await page.locator("label:has-text('Quote Valid Until')").locator("xpath=following::button[1]").click()
  await page.waitForTimeout(400)
  const days = page.locator('[role="gridcell"] button:not([disabled])')
  await days.nth(Math.max(0, (await days.count()) - 2)).click()
  await page.keyboard.press("Escape").catch(() => undefined)
  await page.locator('[data-testid="portal-file-input"]').setInputFiles(PDF)
  await page.waitForSelector("text=test-invoice.pdf", { timeout: 60000 })
  await page.getByRole("button", { name: /Review and submit/ }).click()
  await page.waitForSelector('[data-testid="confirm-submission"]')
  await page.locator('[data-testid="confirm-submission"]').click()
  await page.waitForSelector('[data-testid="receipt-number"]', { timeout: 60000 })
  check("the supplier receives a receipt for the portal submission", /^QUO_/.test((await page.locator('[data-testid="receipt-number"]').innerText()).trim()))
  await shot(page, "01-portal-receipt")
}

// ================================================================ 2. manager: sealed overview, capture (route two), criteria, committee
console.log("\n== Procurement manager: set-up and capture ==")
const mgr = await session(fx.manager)
await as(mgr)
await openEvent(mgr.page)
check("the overview says the event is sealed and counts the submissions (Alpha portal + Bravo portal)", (await bodyHas(mgr.page, "Sealed until the deadline")) && (await bodyHas(mgr.page, "2 submissions")))
await shot(mgr.page, "02-manager-sealed-overview")
await gotoTab(mgr.page, "comparison")
let txt = await bodyText(mgr.page)
check("the comparison shows nothing of the submissions while sealed", /Sealed/.test(txt) && !priceMarkers.some((m) => txt.includes(m)) && !txt.includes("Alpha Supplies") && !txt.includes("Bravo Traders"))
await gotoTab(mgr.page, "overview")

// route two: capture on behalf of Charlie
await mgr.page.locator('[data-action="capture-modal-v23"]').first().click()
await mgr.page.waitForSelector("#captureFormV23")
const cap = "#captureFormV23"
await mgr.page.selectOption(`${cap} [name="vendorId"]`, fx.vendorC.id)
await mgr.page.selectOption(`${cap} [name="channel"]`, "EMAIL")
const nowLocal = new Date(Date.now() - 3600000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
await mgr.page.fill(`${cap} [name="receivedAt"]`, nowLocal)
await mgr.page.fill(`${cap} [name="reason"]`, "Supplier emailed the quotation; the portal link had expired for them")
await mgr.page.fill(`${cap} [name="quotationReference"]`, `CHC-${fx.TAG}`)
await mgr.page.selectOption(`${cap} [name="currencyCode"]`, "USD")
await mgr.page.fill(`${cap} [name="validUntil"]`, new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
await mgr.page.fill(`${cap} [name="paymentTerms"]`, "Net 30")
await mgr.page.fill(`${cap} [name="deliveryTime"]`, "7 days")
await mgr.page.fill(`${cap} [name="deliveryPeriodDays"]`, "7")
const lineRows = mgr.page.locator(`${cap} [data-capture-line]`)
// Without lines pre-filled from the event the first row is blank: fill two.
while ((await lineRows.count()) < 2) await mgr.page.click('[data-action="add-capture-line-v23"]')
for (const [i, [name, qty, price]] of [["Laptop", "5", "200"], ["Docking station", "5", "30"]].entries()) {
  const row = lineRows.nth(i)
  await row.locator('[name="item"]').fill(name)
  await row.locator('[name="qty"]').fill(qty)
  await row.locator('[name="price"]').fill(price)
}
// a wrong stated total is refused; the right one (5*200 + 5*30 = 1150, plus 15% VAT = 1322.50) reconciles
await mgr.page.fill(`${cap} [name="declaredTotalAmount"]`, "999")
await mgr.page.fill(`${cap} [name="vatRate"]`, "15")
let t = await withToast(mgr.page, () => mgr.page.click('[data-action="capture-quotation-v23"]'))
check("capture without the original document is refused with a message", /original quotation/i.test(t), t)
await mgr.page.locator(`${cap} [name="documents"]`).setInputFiles(PDF)
t = await withToast(mgr.page, () => mgr.page.click('[data-action="capture-quotation-v23"]'))
check("a stated total that does not reconcile with the lines is refused", /reconcile|does not match|total/i.test(t), t)
await mgr.page.fill(`${cap} [name="declaredTotalAmount"]`, "1322.5")
t = await withToast(mgr.page, () => mgr.page.click('[data-action="capture-quotation-v23"]'))
check("capture on the supplier's behalf succeeds once the total reconciles", /Quotation captured/i.test(t), t)
await mgr.page.waitForTimeout(6000)
check("the event now holds 3 submissions", await bodyHas(mgr.page, "3 submissions"))
const captured = sql(`SELECT submission_method, capture_channel, quotation_reference FROM vendor_quotations WHERE vendor_id='${fx.vendorC.id}' AND procurement_rfq_id='${fx.rfqId}' AND status<>'SUPERSEDED' LIMIT 1`)
check("the captured quotation records its method, channel and reference", /STAFF_CAPTURE\s+EMAIL\s+CHC-/.test(captured), captured)

// criteria (weights 40 price / 60 technical, plus a mandatory pass-fail) and the committee
await mgr.page.locator('[data-action="criteria-modal-v23"]').first().click()
await mgr.page.waitForSelector("#criteriaFormV23")
await mgr.page.click('[data-action="add-criterion-row-v23"]')
const crow = mgr.page.locator("#criteriaFormV23 [data-criterion-row]").last()
await crow.locator('[name="cName"]').fill("Valid tax clearance")
await crow.locator('[name="cKind"]').selectOption("PASS_FAIL")
await crow.locator('[name="cMandatory"]').check()
await mgr.page.fill('#criteriaFormV23 [name="minEvaluators"]', "2")
await mgr.page.fill('#criteriaFormV23 [data-criterion-row]:nth-child(1) [name="cWeight"]', "50")
t = await withToast(mgr.page, () => mgr.page.click('[data-action="save-criteria-v23"]'))
check("weights that do not total 100 are refused", /100/.test(t), t)
await mgr.page.fill('#criteriaFormV23 [data-criterion-row]:nth-child(1) [name="cWeight"]', "40")
t = await withToast(mgr.page, () => mgr.page.click('[data-action="save-criteria-v23"]'))
check("criteria save (price 40, technical 60, one mandatory pass/fail)", /Evaluation criteria saved/i.test(t), t)
await mgr.page.waitForTimeout(6000)
await mgr.page.locator('[data-action="committee-modal-v23"]').first().click()
await mgr.page.waitForSelector("#committeeFormV23")
for (const [u, chair] of [[fx.ev1, true], [fx.ev2, false], [fx.ev3, false]]) {
  const row = mgr.page.locator(`#committeeFormV23 [data-user="${u.id}"]`)
  await row.locator('[name="member"]').check()
  if (chair) await row.locator('[name="role"]').selectOption("CHAIR")
}
t = await withToast(mgr.page, () => mgr.page.click('[data-action="save-committee-v23"]'))
check("the committee is appointed", /Committee saved with 3 members/i.test(t), t)
await mgr.page.waitForTimeout(6000)
check("criteria and committee show on the overview after reload", (await bodyHas(mgr.page, "Valid tax clearance")) && (await bodyHas(mgr.page, SUFFIX(fx.ev2.name))))
function SUFFIX(n) { return n }
await shot(mgr.page, "03-setup-overview")

// ================================================================ 3. pre-deadline confidentiality
console.log("\n== Before the deadline: nobody sees the submissions ==")
const ev1 = await session(fx.ev1)
await as(ev1)
await openEvent(ev1.page)
await gotoTab(ev1.page, "comparison")
txt = await bodyText(ev1.page)
check("an evaluator on the committee sees only a sealed notice before the deadline", /Sealed/.test(txt) && !priceMarkers.some((m) => txt.includes(m)) && !txt.includes("Alpha Supplies"))
check("no price or supplier reached the evaluator's browser", !ev1.seen.some((r) => /Alpha Supplies|Bravo Traders|222\.22|1322\.5|"unitPrice"/.test(r.body)))
await shot(ev1.page, "04-evaluator-sealed")
const openDenied = await api("POST", `/procurement/rfqs/${fx.rfqId}/open`, fx.ev1.token, { attendees: [] })
check("an evaluator cannot open the bids (server)", openDenied.status === 403, openDenied.status)
const officerSees = await api("GET", `/procurement/rfqs/${fx.rfqId}/comparison-matrix`, fx.officer.token)
check("even the procurement officer sees a count only while sealed", officerSees.status === 200 && !/Bravo|222\.22/.test(officerSees.text), officerSees.status)
const adminTok = (await api("POST", "/auth/login", null, { email: "admin@nts.com", password: "admin123" })).json.token
const adminSees = await api("GET", `/procurement/rfqs/${fx.rfqId}/comparison-matrix`, adminTok)
check("even the administrator sees a count only while sealed", adminSees.status === 200 && !/Bravo|222\.22/.test(adminSees.text), adminSees.status)
const byst = await session(fx.bystander)
await as(byst)
await openEvent(byst.page).catch(() => undefined)
txt = await bodyText(byst.page)
check("a user with no role on the event is refused", !priceMarkers.some((m) => txt.includes(m)) && (/no role|could not be loaded|not released/i.test(txt) || !txt.includes(fx.title)), txt.slice(0, 200))
await byst.ctx.close()

// ================================================================ 4. the deadline passes; formal opening
console.log("\n== Bid opening ==")
sql(`UPDATE procurement_rfqs SET closing_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 MINUTE) WHERE id='${fx.rfqId}'`)
await as(mgr)
await openEvent(mgr.page)
const awaiting = await bodyHas(mgr.page, "Awaiting opening")
txt = await bodyText(mgr.page)
check("after the deadline the event reads 'awaiting opening' and still shows no prices", awaiting && !priceMarkers.some((m) => txt.includes(m)))
const offTok = fx.officer.token
const denied = await api("POST", `/procurement/rfqs/${fx.rfqId}/open`, offTok, { attendees: [{ userId: fx.ev1.id }] })
check("the procurement officer cannot open bids (no opening authority)", denied.status === 403, denied.status)
await mgr.page.locator('[data-action="open-bids-modal-v23"]').first().click()
await mgr.page.waitForSelector("#openBidsFormV23")
t = await withToast(mgr.page, () => mgr.page.click('[data-action="open-bids-v23"]'))
check("opening without attendees is refused", /attendee/i.test(t), t)
await mgr.page.locator('#openBidsFormV23 [data-attendee-row]').nth(0).locator('[name="attendeeUser"]').selectOption(fx.officer.id)
await mgr.page.locator('#openBidsFormV23 [data-attendee-row]').nth(1).locator('[name="attendeeName"]').fill("Observer from Internal Audit")
await mgr.page.locator('#openBidsFormV23 [data-attendee-row]').nth(1).locator('[name="attendeeRole"]').fill("Internal Audit")
t = await withToast(mgr.page, () => mgr.page.click('[data-action="open-bids-v23"]'))
check("bids are opened with attendees on record", /bids are opened/i.test(t), t)
await mgr.page.waitForTimeout(7000)
txt = await bodyText(mgr.page)
check("the opening record shows who opened, when and who was present", /opened by/i.test(txt) && txt.includes("Internal Audit") && txt.includes(fx.officer.name.split(" ")[0]))
await shot(mgr.page, "05-opening-record")
const ver = await api("GET", `/procurement/rfqs/${fx.rfqId}/opening/verify`, fx.manager.token)
check("the opening record verifies against its hash", ver.status === 200 && JSON.stringify(ver.json).match(/true/), ver.text.slice(0, 200))
const again = await api("POST", `/procurement/rfqs/${fx.rfqId}/open`, fx.manager.token, { attendees: [{ userId: fx.officer.id }] })
check("a second opening is refused (immutable)", again.status >= 400, again.status)

// ================================================================ 5. declarations gate scoring; scoring; recusal
console.log("\n== Declarations and scoring ==")
await as(ev1)
await openEvent(ev1.page, "comparison")
txt = await bodyText(ev1.page)
check("an evaluator who has not declared still cannot see the submissions", !priceMarkers.some((m) => txt.includes(m)) && !txt.includes("Alpha Supplies"))
const scoreBeforeDecl = await api("PUT", `/procurement/rfqs/${fx.rfqId}/evaluation/scores`, fx.ev1.token, { quotationId: "x", scores: [] })
check("scoring before declaring is refused by the server", scoreBeforeDecl.status >= 400, scoreBeforeDecl.status)
await gotoTab(ev1.page, "evaluation")
check("the evaluation tab asks for a declaration first", await bodyHas(ev1.page, "Your declaration"))
t = await withToast(ev1.page, () => ev1.page.click('[data-action="declare-v23"]'))
check("declaring without choosing is refused", /Choose the declaration/i.test(t), t)
await ev1.page.locator('#declarationFormV23 input[name="code"]').first().check()
t = await withToast(ev1.page, () => ev1.page.click('[data-action="declare-v23"]'))
check("evaluator one confirms no conflict", /Declaration recorded/i.test(t), t)

const ev2 = await session(fx.ev2)
await as(ev2)
await openEvent(ev2.page, "evaluation")
await ev2.page.locator('#declarationFormV23 input[name="code"]').nth(1).check()
t = await withToast(ev2.page, () => ev2.page.click('[data-action="declare-v23"]'))
check("a disclosed conflict needs details", /describe the conflict|detail/i.test(t), t)
await ev2.page.fill('#declarationFormV23 [name="details"]', "Distant relative works at Bravo Traders; no financial interest")
t = await withToast(ev2.page, () => ev2.page.click('[data-action="declare-v23"]'))
check("evaluator two discloses a conflict with details and may score", /Declaration recorded/i.test(t), t)

const ev3 = await session(fx.ev3)
await as(ev3)
await openEvent(ev3.page, "evaluation")
await ev3.page.locator('#declarationFormV23 input[name="code"]').nth(2).check()
await ev3.page.fill('#declarationFormV23 [name="details"]', "I sit on the board of Charlie Couriers")
t = await withToast(ev3.page, () => ev3.page.click('[data-action="declare-v23"]'))
check("evaluator three recuses", /Declaration recorded/i.test(t), t)
await ev3.page.waitForTimeout(6000)
await openEvent(ev3.page, "comparison")
txt = await bodyText(ev3.page)
check("a recused evaluator sees no submissions", !priceMarkers.some((m) => txt.includes(m)) && !txt.includes("Alpha Supplies") && !ev3.seen.slice(-12).some((r) => /Alpha Supplies|Bravo Traders/.test(r.body)))
await ev3.ctx.close()

const scoreAs = async (S, marks, label) => {
  await as(S)
  await openEvent(S.page, "evaluation")
  await S.page.waitForSelector("[data-scorecard-quote]", { timeout: 90000 })
  check(`${label} sees all three submissions to score`, (await S.page.locator("[data-scorecard-quote]").count()) === 3)
  for (const [supplier, tech, tax] of marks) {
    const block = S.page.locator("[data-scorecard-quote]", { hasText: supplier })
    await block.locator('input[name="score"]').first().fill(String(tech))
    await block.locator('select[name="pass"]').first().selectOption(tax ? "true" : "false")
    await block.locator('textarea[name="comment"]').fill(`${label}: marked ${supplier}`)
    const tt = await withToast(S.page, () => block.locator('[data-action="save-scores-v23"]').click())
    check(`${label} saves marks for ${supplier}`, /marks are saved/i.test(tt), tt)
    await S.page.waitForTimeout(5000)
    await S.page.waitForSelector("[data-scorecard-quote]")
  }
}
// Alpha 300*5+50*5 = 1750(+VAT); Bravo 222.22*5+33.33*5 = 1277.75; Charlie 200*5+30*5 = 1150. Charlie fails the mandatory criterion.
await scoreAs(ev1, [["Alpha Supplies", 8, true], ["Bravo Traders", 6, true], ["Charlie Couriers", 9, false]], "evaluator one")
await scoreAs(ev2, [["Alpha Supplies", 6, true], ["Bravo Traders", 8, true], ["Charlie Couriers", 9, true]], "evaluator two")
await as(ev1)
await openEvent(ev1.page, "evaluation")
await shot(ev1.page, "06-scorecard")
const early = await api("GET", `/procurement/rfqs/${fx.rfqId}/evaluation/consolidation`, fx.ev1.token)
check("an evaluator sees no committee result before submitting their own scorecard", early.json?.data?.resultsWithheld === true || !early.json?.data?.rows?.some((r) => r.totalScore != null), early.text.slice(0, 200))
t = await withToast(ev1.page, () => ev1.page.click('[data-action="submit-scorecard-v23"]'))
check("evaluator one submits a scorecard", /Scorecard submitted/i.test(t), t)
await ev1.page.waitForTimeout(6000)
const edit = await api("PUT", `/procurement/rfqs/${fx.rfqId}/evaluation/scores`, fx.ev1.token, { quotationId: "x", scores: [{ criterionId: "x", score: 1 }] })
check("a submitted scorecard cannot be changed", edit.status >= 400, edit.status)
await as(ev2)
await openEvent(ev2.page, "evaluation")
await ev2.page.waitForSelector("[data-scorecard-quote]")
t = await withToast(ev2.page, () => ev2.page.click('[data-action="submit-scorecard-v23"]'))
check("evaluator two submits a scorecard", /Scorecard submitted/i.test(t), t)
await ev2.ctx.close()

// ================================================================ 6. consolidation, comparison, drill-through
console.log("\n== Consolidation and comparison ==")
await as(mgr)
await openEvent(mgr.page, "evaluation")
await bodyHas(mgr.page, "Committee result")
txt = await bodyText(mgr.page)
check("the committee result is consolidated without overwriting individual scorecards", /Individual scorecards/.test(txt) && txt.includes(fx.ev1.name) && txt.includes(fx.ev2.name))
check("a supplier that fails the mandatory criterion is excluded and unranked", /Excluded/.test(txt))
check("the evaluation is complete and the recused member is not counted", /The evaluation is complete/.test(txt) && /2 scorecards counted/.test(txt))
await shot(mgr.page, "07-consolidation")
const cons = (await api("GET", `/procurement/rfqs/${fx.rfqId}/evaluation/consolidation`, fx.manager.token)).json.data
const byName = async (n) => (await api("GET", `/procurement/rfqs/${fx.rfqId}/comparison-matrix`, fx.manager.token)).json.data.columns.find((c) => c.supplier.name.includes(n))
const colA = await byName("Alpha"), colB = await byName("Bravo"), colC = await byName("Charlie")
const rowOf = (c) => cons.rows.find((r) => r.quotationId === c.quotationId)
// Technical: only the scored criterion (weight 60): average of the evaluators' marks/10*100. Alpha (8+6)/2=7 -> 70; Bravo (6+8)/2=7 -> 70.
check("technical score equals the average of the evaluators' marks (Alpha 70, Bravo 70)", Math.abs(rowOf(colA).technicalScore - 70) < 0.01 && Math.abs(rowOf(colB).technicalScore - 70) < 0.01, JSON.stringify([rowOf(colA).technicalScore, rowOf(colB).technicalScore]))
// Price mark: lowest qualified total = 100. Bravo 1277.75*1.15 vs Alpha 1750*1.15 -> Alpha 1277.75/1750*100 = 73.01. Total = (40*mark + 60*70)/100.
const alphaPrice = (1277.75 / 1750) * 100
check("commercial score is relative to the lowest qualified bid (Bravo 100, Alpha 73.01)", Math.abs(rowOf(colB).commercialScore - 100) < 0.05 && Math.abs(rowOf(colA).commercialScore - alphaPrice) < 0.05, JSON.stringify([rowOf(colA).commercialScore, rowOf(colB).commercialScore]))
check("total is the weighted sum (Bravo 82, Alpha 71.2)", Math.abs(rowOf(colB).totalScore - 82) < 0.05 && Math.abs(rowOf(colA).totalScore - (0.4 * alphaPrice + 0.6 * 70)) < 0.05, JSON.stringify([rowOf(colA).totalScore, rowOf(colB).totalScore]))
check("the disqualified supplier has no total and no rank", rowOf(colC).disqualified === true && rowOf(colC).totalScore == null && rowOf(colC).advisoryRank == null)

await gotoTab(mgr.page, "comparison")
await bodyHas(mgr.page, "Original documents")
txt = await bodyText(mgr.page)
for (const label of ["Quoted Amount", "Currency", "VAT", "Delivery Period", "Payment Terms", "Quotation Validity", "Compliance Status", "Technical Score", "Commercial Score", "Total Score"]) {
  check(`comparison row: ${label}`, txt.toLowerCase().includes(label.toLowerCase()))
}
check("suppliers are columns with their submission method (portal / captured)", /vendor portal/i.test(txt) && /captured by procurement/i.test(txt))
check("the ranking is labelled advisory and nothing is selected", /advisory ranking/i.test(txt))
await shot(mgr.page, "08-comparison")
const [download] = await Promise.all([mgr.page.waitForEvent("download", { timeout: 60000 }), mgr.page.locator('[data-action="download-quotation-doc-v23"]').first().click()])
const saved = path.join(OUT, "_download.pdf")
await download.saveAs(saved)
check("drill-through opens the supplier's original document", fs.statSync(saved).size > 100 && fs.readFileSync(saved).subarray(0, 4).toString() === "%PDF")
fs.rmSync(saved, { force: true })

// ================================================================ 7. recommendation, approval, award
console.log("\n== Award recommendation ==")
await gotoTab(mgr.page, "recommendation")
await bodyHas(mgr.page, "Prepare the award recommendation")
const form = "#recommendationFormV23"
const bravoOption = await mgr.page.locator(`${form} [name="quotationId"] option`, { hasText: "Bravo" }).first().getAttribute("value")
const alphaOption = await mgr.page.locator(`${form} [name="quotationId"] option`, { hasText: "Alpha" }).first().getAttribute("value")
check("a disqualified supplier is not offered for recommendation", (await mgr.page.locator(`${form} [name="quotationId"] option`, { hasText: "Charlie" }).count()) === 0)
await mgr.page.selectOption(`${form} [name="quotationId"]`, alphaOption)
await mgr.page.fill(`${form} [name="justification"]`, "Alpha is preferred for its delivery record and after-sales support across our sites.")
t = await withToast(mgr.page, () => mgr.page.click('[data-action="prepare-recommendation-v23"]'))
check("recommending a bid that is not the top-ranked needs a stated deviation", /deviation/i.test(t), t)
await mgr.page.selectOption(`${form} [name="quotationId"]`, bravoOption)
t = await withToast(mgr.page, () => mgr.page.click('[data-action="prepare-recommendation-v23"]'))
check("the recommendation is saved as a draft", /saved as a draft/i.test(t), t)
await mgr.page.waitForTimeout(6000)
await bodyHas(mgr.page, "Submit for approval")
txt = await bodyText(mgr.page)
check("the recommendation carries supplier, amount, currency, justification and evaluation summary", /recommended supplier/i.test(txt) && /recommended amount/i.test(txt) && /evaluation summary/i.test(txt) && /procurement justification/i.test(txt))
check("the award cannot be finalised before approval", (await mgr.page.locator('[data-action="finalise-award-v23"]').count()) === 0)
const early2 = await api("POST", `/vendor-quotations/${colB.quotationId}/accept`, fx.manager.token)
check("the server also refuses an award before approval", early2.status >= 400, early2.status)
t = await withToast(mgr.page, () => mgr.page.locator('[data-action="submit-recommendation-v23"]').first().click())
check("the recommendation is submitted to the award approvers", /submitted to the award approvers/i.test(t), t)
await mgr.page.waitForTimeout(6000)
await shot(mgr.page, "09-recommendation-pending")

const appr = await session(fx.approver)
await as(appr)
await appr.page.goto(`${FE}/procurement/approvals`, { waitUntil: "domcontentloaded" })
check("the approver finds the recommendation in the Approval Centre", await bodyHas(appr.page, "Award recommendation", 180000))
await shot(appr.page, "10-approver-centre")
const byst2 = await api("POST", `/procurement/rfqs/${fx.rfqId}/recommendation/decide`, fx.bystander.token, { decision: "APPROVE" })
check("someone who is not on the route cannot approve it", byst2.status >= 400, byst2.status)
const selfApprove = await api("POST", `/procurement/rfqs/${fx.rfqId}/recommendation/decide`, fx.manager.token, { decision: "APPROVE" })
check("the preparer cannot approve their own recommendation", selfApprove.status >= 400, selfApprove.status)
await openEvent(appr.page, "recommendation")
await bodyHas(appr.page, "Approval route")
t = await withToast(appr.page, () => appr.page.locator('[data-action="decide-recommendation-v23"][data-id$="REJECT"]').first().click())
check("rejecting without a reason is refused", /reason/i.test(t), t)
t = await withToast(appr.page, () => appr.page.locator('[data-action="decide-recommendation-v23"][data-id$="APPROVE"]').first().click())
check("the approver approves the recommendation", /approval is recorded/i.test(t), t)
await appr.page.waitForTimeout(6000)
await shot(appr.page, "11-recommendation-approved")
await as(mgr)
await openEvent(mgr.page, "recommendation")
await bodyHas(mgr.page, "Finalise the award")
t = await withToast(mgr.page, () => mgr.page.locator('[data-action="finalise-award-v23"]').first().click())
check("the award is finalised after approval and raises the purchase order", /Award finalised/i.test(t), t)
await mgr.page.waitForTimeout(6000)
const status = sql(`SELECT status FROM vendor_quotations WHERE id='${colB.quotationId}'`)
check("the awarded quotation is accepted in the database", /ACCEPTED/.test(status), status)
const audit = sql(`SELECT GROUP_CONCAT(DISTINCT action) FROM audit_logs WHERE entityId IN ('${fx.rfqId}','${colA.quotationId}','${colB.quotationId}','${colC.quotationId}')`)
const need = ["OPEN_BIDS", "DECLARE", "RECUSE", "SCORE", "SUBMIT_SCORECARD", "PREPARE_RECOMMENDATION", "SUBMIT_RECOMMENDATION", "APPROVE_RECOMMENDATION", "AWARD_FINALISE", "CAPTURE_QUOTATION"]
check("the whole process is audited (opening, declarations, scores, recommendation, approval, award, capture)", need.every((n) => audit.includes(n)), `missing: ${need.filter((n) => !audit.includes(n)).join(",")}`)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) { console.log("FAILED:\n" + failed.map((f) => " - " + f.name).join("\n")); process.exitCode = 1 }
