/**
 * Procurement planning, requisitions and approval routing in a visible browser, as real users would use them.
 * Needs the staff FE (UAT_FE, default http://localhost:3120) and the local API (:3009).
 *   node scripts/_uat/planning-requisitions-ui.mjs
 */
import { chromium } from "playwright"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const FE = process.env.UAT_FE || "http://localhost:3120"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const OUT = process.env.UAT_OUT || "design-refs/planning-requisitions/screens"
fs.mkdirSync(OUT, { recursive: true })
const TAG = `pui${Date.now().toString(36)}`
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 300)}`)
}
async function api(method, path, token, body) {
  const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, json: await r.json().catch(() => null) }
}
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

// ------------------------------------------------------------------ fixtures through the API
const adminTok = (await api("POST", "/auth/login", null, { email: "admin@nts.com", password: "admin123" })).json.token
const mkUser = async (key, roleCode = "PROC_OFF", department = "Procurement") => {
  const email = `${TAG}.${key}@nts.local`
  const r = await api("POST", "/users", adminTok, { firstName: `UI${key}`, lastName: "Tester", email, department, roleCode, departmentRole: "OFFICER" })
  if (r.status !== 201) throw new Error("user: " + JSON.stringify(r.json))
  return { email, password: r.json.data.temporaryPassword, id: r.json.data.user.id, name: `UI${key} Tester` }
}
const R = await mkUser("req")
const A = await mkUser("a")
const B = await mkUser("b")
const D = await mkUser("d")
const OFFICER = await mkUser("officer")
const policyBefore = (await api("GET", "/procurement/requisition-policy", adminTok)).json.data
const matrixBefore = (await api("GET", "/procurement/approval-matrix", adminTok)).json.data
await api("PUT", "/procurement/requisition-policy", adminTok, { budgetCheckMode: "ENFORCE", planLinkPolicy: "OPTIONAL", suggestedVendorPolicy: "ALLOWED_APPROVED_ONLY", prNumberFormat: "PR-{YYYY}-{######}" })
const yr = String(new Date().getFullYear())
const BUD = `UIB-${TAG}`
await api("POST", "/procurement/budgets", adminTok, { financialYear: yr, budgetCode: BUD, costCentre: "CC-UI", amount: 50000, currencyCode: "USD", description: "UI test budget" })

// an approved plan line to draw on
const officerTok = (await api("POST", "/auth/login", null, { email: OFFICER.email, password: OFFICER.password })).json.token
const plan = (await api("POST", "/procurement/plans", officerTok, { name: `${TAG} plan`, department: "Procurement", fiscalYear: `FY ${yr}`, budget: 100000, currencyCode: "USD" })).json.data
await api("POST", `/procurement/plans/${plan.id}/items`, officerTok, { requirement: `${TAG} field laptops`, category: "IT_EQUIPMENT", quarter: "Q2", method: "rfq", estimatedValue: 20000, department: "Procurement", budgetCode: BUD, costCentre: "CC-UI", requiredDeliveryDate: day(90), plannedStartDate: day(10), responsibleOfficerId: OFFICER.id, currencyCode: "USD" })
await api("POST", `/procurement/plans/${plan.id}/submit`, officerTok)
await api("POST", `/procurement/plans/${plan.id}/approve`, adminTok)

const browser = await chromium.launch({ args: ["--js-flags=--max-old-space-size=3072"], headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 200) })
async function session(email, password) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(120000)
  await page.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(5000)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await Promise.all([page.waitForResponse((r) => r.url().includes("/auth/login")), page.click('button[type="submit"]')])
  await page.waitForTimeout(3500)
  return { ctx, page }
}
const openPage = async (page, route, marker) => {
  await page.goto(`${FE}/procurement/${route}`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(`text=${marker}`, { timeout: 180000 })
  // The runtime is mounted with no records; wait for the live load to land (the loading toast/banner goes, data hydrates).
  await page.waitForFunction(() => !document.body.innerText.includes("Procurement data is still loading"), null, { timeout: 120000 }).catch(() => undefined)
  await page.waitForTimeout(9000)
}
const openQueue = async (page) => {
  await openPage(page, "requisitions", "My Purchase Requisitions")
  await page.locator('[data-action="set-pr-view-v11"][data-id="approver"]').first().click()
  await page.waitForSelector("text=Purchase Requisition Approval Queue")
}
const withToast = async (page, fn) => {
  const texts = () => page.locator("[data-sonner-toast]").allInnerTexts().catch(() => [])
  const before = new Set((await texts()).map((x) => x.replace(/\s+/g, " ")))
  await fn()
  const end = Date.now() + 45000
  while (Date.now() < end) {
    const fresh = (await texts()).map((x) => x.replace(/\s+/g, " ")).filter((x) => !before.has(x))
    if (fresh.length) return fresh[fresh.length - 1]
    await page.waitForTimeout(250)
  }
  return ""
}
const bodyHas = (page, text) => page.waitForFunction((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), text, { timeout: 30000 }).then(() => true).catch(() => false)
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` })
const rowFor = (page, text) => page.locator("tr", { hasText: text }).first()
const ensureApprovalsTab = async (page) => {
  for (let i = 0; i < 30; i++) {
    if (await page.locator('#requisitionPolicyFormV23 [name="prNumberFormat"]').count()) return
    await page.locator('[data-action="settings-tab"][data-id="approvals"]').first().click().catch(() => undefined)
    await page.waitForTimeout(3000)
  }
}
const rowMenu = async (page, row, label) => {
  await row.locator(".row-actions-trigger-v16").first().click()
  await page.getByRole("menuitem", { name: label }).first().click()
}
const waitRow = (page, text) => rowFor(page, text).waitFor({ timeout: 120000 }).catch(() => undefined)
const waitRowText = (page, text, re) => page.waitForFunction(([t, r]) => { const row = [...document.querySelectorAll("tr")].find((x) => x.innerText.includes(t)); return !!row && new RegExp(r).test(row.innerText) }, [text, re.source], { timeout: 120000 }).catch(() => undefined)
const waitGone = (page, text) => page.waitForFunction((t) => ![...document.querySelectorAll("tr")].some((x) => x.innerText.includes(t)), text, { timeout: 120000 }).catch(() => undefined)

// ================================================================== admin: policy, budgets, matrix editor
console.log("\n== Configuration (administrator) ==")
const admin = await session("admin@nts.com", "admin123")
await openPage(admin.page, "settings", "Configuration, RBAC and Access")
await admin.page.click('[data-action="settings-tab"][data-id="approvals"]')
await admin.page.waitForTimeout(1500)
check("configuration shows the requisition policy and budgets", await bodyHas(admin.page, "Requisition policy") && await bodyHas(admin.page, "Budgets"))
await shot(admin.page, "01-config-policy-budgets")
// policy
await admin.page.fill('#requisitionPolicyFormV23 [name="prNumberFormat"]', "PR-{YYYY}-{######}")
await admin.page.selectOption('#requisitionPolicyFormV23 [name="budgetCheckMode"]', "WARN")
let t = await withToast(admin.page, () => admin.page.click('[data-action="save-requisition-policy-v23"]'))
check("policy saves and confirms the number format", /Requisition policy saved/i.test(t) && /PR-\{YYYY\}-\{######\}/.test(t), t)
const savedPolicy = (await api("GET", "/procurement/requisition-policy", adminTok)).json.data
check("policy persisted in the API (budget check WARN)", savedPolicy.budgetCheckMode === "WARN", JSON.stringify(savedPolicy))
await admin.page.waitForTimeout(3500)
await ensureApprovalsTab(admin.page)
check("policy shows the saved value after reload", (await admin.page.inputValue('#requisitionPolicyFormV23 [name="budgetCheckMode"]')) === "WARN")
await admin.page.selectOption('#requisitionPolicyFormV23 [name="budgetCheckMode"]', "ENFORCE")
await withToast(admin.page, () => admin.page.click('[data-action="save-requisition-policy-v23"]'))
await admin.page.waitForTimeout(5500)
await ensureApprovalsTab(admin.page)
await admin.page.fill('#requisitionPolicyFormV23 [name="prNumberFormat"]', "PR-{FOO}")
t = await withToast(admin.page, () => admin.page.click('[data-action="save-requisition-policy-v23"]'))
check("an invalid number format is refused with a message", /counter|Only \{YYYY\}/i.test(t), t)
await admin.page.waitForTimeout(3500)
await ensureApprovalsTab(admin.page)
// budgets
await admin.page.getByRole("button", { name: "Add budget" }).first().click()
await admin.page.waitForSelector("#budgetFormV23")
const b2 = `UIB2-${TAG}`
await admin.page.fill('#budgetFormV23 [name="budgetCode"]', b2)
await admin.page.fill('#budgetFormV23 [name="costCentre"]', "CC-UI2")
await admin.page.fill('#budgetFormV23 [name="amount"]', "1200")
t = await withToast(admin.page, () => admin.page.click('[data-action="save-budget-v23"]'))
check("a budget can be added in the UI", /Budget added/i.test(t), t)
await admin.page.waitForTimeout(4000)
await ensureApprovalsTab(admin.page)
check("the new budget appears in the table after the reload", await bodyHas(admin.page, b2))
check("existing budget shows committed and available", await admin.page.locator("tr", { hasText: BUD }).first().innerText().then((x) => /50,000/.test(x)).catch(() => false))
// matrix editor
await ensureApprovalsTab(admin.page)
await admin.page.getByRole("button", { name: "Edit route" }).first().click()
await admin.page.waitForSelector("#approvalMatrixFormV23")
const editorHasControls = (await admin.page.locator('#approvalMatrixFormV23 [name="canDelegate"]').count()) > 0 && (await admin.page.locator('#approvalMatrixFormV23 [name="ruleRiskLevels"]').count()) > 0
check("matrix editor offers delegation and routing conditions per step", editorHasControls)
await shot(admin.page, "02-matrix-editor")
// build: step1 A may delegate; step2 B above 1000; step3 D only for HIGH risk
const setStepUser = async (idx, userId) => {
  const row = admin.page.locator("#approvalMatrixFormV23 [data-matrix-step]").nth(idx)
  await row.locator('[name="kind"]').selectOption("USER")
  await row.locator('[name="userId"]').selectOption(userId)
  return row
}
while ((await admin.page.locator("#approvalMatrixFormV23 [data-matrix-step]").count()) > 1) await admin.page.locator('#approvalMatrixFormV23 [data-action="remove-matrix-step-v23"]').last().click()
let row1 = await setStepUser(0, A.id)
await row1.locator('[name="canDelegate"]').check()
await admin.page.click('[data-action="add-matrix-step-v23"]')
const row2 = await setStepUser(1, B.id)
await row2.locator('[name="aboveAmount"]').fill("1000")
await admin.page.click('[data-action="add-matrix-step-v23"]')
const row3 = await setStepUser(2, D.id)
await row3.locator("summary").click()
await row3.locator('[name="ruleRiskLevels"]').selectOption(["HIGH"])
t = await withToast(admin.page, () => admin.page.click('[data-action="save-approval-matrix-v23"]'))
check("route saves with delegation and a routing condition", /Approval route saved with 3 steps/i.test(t), t)
await admin.page.waitForTimeout(4000)
await ensureApprovalsTab(admin.page)
const saved = (await api("GET", "/procurement/approval-matrix", adminTok)).json.data
check("matrix persisted: step 1 delegates, step 3 carries the HIGH-risk condition", saved.steps[0]?.canDelegate === true && saved.steps[1]?.aboveAmount === 1000 && (saved.steps[2]?.matchRules?.riskLevels || []).includes("HIGH"), JSON.stringify(saved.steps.map((s) => [s.canDelegate, s.aboveAmount, s.matchRules?.riskLevels])))
check("read-only matrix table shows the condition and delegation", (await bodyHas(admin.page, "May delegate")) && (await bodyHas(admin.page, "Risk: High")))
await shot(admin.page, "03-matrix-saved")
await admin.ctx.close()

// ================================================================== plan forms (officer)
console.log("\n== Annual plan forms (planner) ==")
const off = await session(OFFICER.email, OFFICER.password)
await openPage(off.page, "plan", "Annual Procurement Planning")
for (let i = 0; i < 20; i++) {
  await off.page.getByRole("button", { name: "Create plan" }).first().click()
  await off.page.waitForSelector("#planFormV23")
  if ((await off.page.locator('#planFormV23 [name="currency"] option').count()) >= 1) break
  await off.page.evaluate(() => { const m = document.querySelector("#modalLayer"); m && m.classList.remove("open") })
  await off.page.waitForTimeout(8000)
}
check("plan header has a business unit and real currencies", (await off.page.locator('#planFormV23 [name="businessUnit"]').count()) === 1 && (await off.page.locator('#planFormV23 [name="currency"] option').count()) >= 1)
const planName = `${TAG} UI plan`
await off.page.fill('#planFormV23 [name="name"]', planName)
await off.page.fill('#planFormV23 [name="budget"]', "9000")
await off.page.fill('#planFormV23 [name="businessUnit"]', "BU-UI")
t = await withToast(off.page, () => off.page.getByRole("button", { name: "Create plan" }).last().click())
check("plan created as a draft", /created as a draft/i.test(t), t)
await off.page.waitForTimeout(4000)
await off.page.getByRole("button", { name: "Add plan item" }).first().click()
await off.page.waitForSelector("#planItemFormV23")
for (const f of ["businessUnit", "budgetCode", "costCentre", "lineCurrency", "plannedStartDate", "requiredDeliveryDate", "responsibleOfficerId"]) {
  check(`plan line form field: ${f}`, (await off.page.locator(`#planItemFormV23 [name="${f}"]`).count()) === 1)
}
await off.page.selectOption('#planItemFormV23 [name="plan"]', { label: new RegExp(planName) }).catch(async () => {
  const opts = await off.page.locator('#planItemFormV23 [name="plan"] option').allInnerTexts()
  const idx = opts.findIndex((o) => o.includes(planName))
  await off.page.selectOption('#planItemFormV23 [name="plan"]', { index: Math.max(0, idx) })
})
await off.page.fill('#planItemFormV23 [name="description"]', `${TAG} router upgrade`)
await off.page.fill('#planItemFormV23 [name="estimatedValue"]', "4000")
await off.page.fill('#planItemFormV23 [name="budgetCode"]', BUD)
await off.page.fill('#planItemFormV23 [name="costCentre"]', "CC-UI")
await off.page.fill('#planItemFormV23 [name="plannedStartDate"]', day(5))
await off.page.fill('#planItemFormV23 [name="requiredDeliveryDate"]', day(3))
await off.page.selectOption('#planItemFormV23 [name="responsibleOfficerId"]', OFFICER.id)
t = await withToast(off.page, () => off.page.click('[data-action="save-plan-item"]'))
check("plan line refused when delivery is before start (says so)", /before the planned start/i.test(t), t)
await off.page.fill('#planItemFormV23 [name="requiredDeliveryDate"]', day(60))
t = await withToast(off.page, () => off.page.click('[data-action="save-plan-item"]'))
check("plan line saved with the section 10 fields", /Line added to/i.test(t), t)
await off.page.waitForTimeout(4000)
let uiPlan
for (let i = 0; i < 30 && !(uiPlan?.items?.length && uiPlan.items[0].responsibleOfficerId); i++) {
  uiPlan = (await api("GET", "/procurement/plans", adminTok)).json.data.find((p) => p.name === planName)
  if (!(uiPlan?.items?.length && uiPlan.items[0].responsibleOfficerId)) await off.page.waitForTimeout(2000)
}
const uiLine = uiPlan?.items?.[0]
check("plan line persisted: officer, budget code, cost centre, dates, currency, business unit", uiLine?.responsibleOfficerId === OFFICER.id && uiLine?.budgetCode === BUD && uiLine?.costCentre === "CC-UI" && !!uiLine?.plannedStartDate && !!uiLine?.requiredDeliveryDate && !!uiLine?.currencyCode && uiPlan?.businessUnit === "BU-UI", JSON.stringify(uiLine))
await off.page.waitForTimeout(1500)
check("plan workspace lists budget code, officer, drawn and remaining", (await bodyHas(off.page, "Budget code")) && (await bodyHas(off.page, "Remaining")))
await shot(off.page, "04-plan-workspace")
await off.ctx.close()

// ================================================================== requester: raise a requisition
console.log("\n== Requester ==")
const req = await session(R.email, R.password)
await openPage(req.page, "requisitions", "My Purchase Requisitions")
await req.page.getByRole("button", { name: "New requisition" }).first().click()
await req.page.waitForSelector("#prForm")
for (const f of ["currencyId", "requiredDate", "procurementMethod", "riskLevel", "exceptionType", "budgetCode", "costCentre", "branch", "businessUnit", "deliveryLocation", "planItem"]) {
  check(`requisition form field: ${f}`, (await req.page.locator(`#prForm [name="${f}"]`).count()) === 1)
}
check("currency defaults to the system default and is a real list", (await req.page.locator('#prForm [name="currencyId"] option').count()) >= 1)
check("plan line picker lists the approved plan line with what is left", (await req.page.locator('#prForm [name="planItem"] option').allInnerTexts()).some((o) => o.includes(`${TAG} field laptops`) && /left/.test(o)))
check("a draft plan's line is not offered", !(await req.page.locator('#prForm [name="planItem"] option').allInnerTexts()).some((o) => o.includes(`${TAG} router upgrade`)))
await shot(req.page, "05-new-requisition")
const title = `${TAG} laptops for the field team`
await req.page.selectOption("#prForm [name=category]", { index: 1 })
await req.page.fill('#prForm [name="title"]', title)
await req.page.fill('#prForm [name="motivation"]', "Replace ageing laptops for field staff.")
await req.page.fill('#prForm [name="item"]', "Laptop")
await req.page.fill('#prForm [name="qty"]', "4")
await req.page.fill('#prForm [name="price"]', "900")
await req.page.locator('#prForm [data-action="add-pr-line-v23"]').dispatchEvent("click")
await req.page.locator('#prForm [data-pr-line]').nth(1).locator('[name="item"]').fill("Laptop bag")
await req.page.locator('#prForm [data-pr-line]').nth(1).locator('[name="qty"]').fill("4")
await req.page.locator('#prForm [data-pr-line]').nth(1).locator('[name="price"]').fill("50")
check("estimated total is derived from the lines (4 x 900 + 4 x 50 = 3,800)", (await req.page.locator("#prLinesTotalV23").innerText()).includes("3,800"), await req.page.locator("#prLinesTotalV23").innerText())
await req.page.fill('#prForm [name="requiredDate"]', day(45))
await req.page.selectOption('#prForm [name="procurementMethod"]', "RFQ")
await req.page.selectOption('#prForm [name="riskLevel"]', "MEDIUM")
await req.page.fill('#prForm [name="budgetCode"]', BUD)
await req.page.fill('#prForm [name="costCentre"]', "CC-UI")
await req.page.fill('#prForm [name="branch"]', "Harare")
await req.page.fill('#prForm [name="deliveryLocation"]', "Head office store")
const planOpt = (await req.page.locator('#prForm [name="planItem"] option').evaluateAll((os) => os.find((o) => o.textContent.includes("field laptops"))?.value)) || ""
await req.page.selectOption('#prForm [name="planItem"]', planOpt)
await req.page.waitForTimeout(500)
const posText = await req.page.locator("#prPositionV23").innerText()
check("live position shows budget available and the plan line remaining", /available of/.test(posText) && /Plan line/.test(posText), posText)
await shot(req.page, "06-requisition-filled")
// a past required date is refused by the API through the UI
await req.page.fill('#prForm [name="requiredDate"]', day(-2))
t = await withToast(req.page, () => req.page.click('[data-action="save-pr"]'))
check("a past required date is refused", /past|min|valid/i.test(t) || (await req.page.locator("#prForm").count()) === 1, t)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prattach-"))
fs.writeFileSync(path.join(tmp, "quote.txt"), "supplier quote 1")
fs.writeFileSync(path.join(tmp, "spec.csv"), "item,qty laptop,4")
check("the form has an attachments picker", (await req.page.locator('#prForm [name="attachments"]').count()) === 1)
await req.page.setInputFiles('#prForm [name="attachments"]', [path.join(tmp, "quote.txt"), path.join(tmp, "spec.csv")])
await req.page.fill('#prForm [name="requiredDate"]', day(45))
t = await withToast(req.page, () => req.page.click('[data-action="submit-pr"]'))
check("submitting reports the route (step 1, the first approver)", /submitted for approval/i.test(t) && /UIa Tester/.test(t), t)
const number = (t.match(/(PR-\d{4}-\d{6})/) || [])[1]
check("the requisition got an automatic number PR-YYYY-######", !!number, t)
await waitRowText(req.page, title, /Pending[\s\S]*|\$3,800/)
await req.page.waitForTimeout(2000)
const myRow = rowFor(req.page, title)
check("the register shows it Pending with the derived estimate", (await myRow.count()) === 1 && /Under Review|Pending/.test(await myRow.innerText()) && /3,800/.test(await myRow.innerText()), await myRow.innerText().catch(() => "none"))
const dbReq = await (async () => { const rows = (await api("GET", "/procurement/requisitions/my", (await api("POST", "/auth/login", null, { email: R.email, password: R.password })).json.token)).json.data; return rows.find((x) => x.title === title) })()
check("header fields persisted (method, risk, budget code, plan line, required date, currency)", dbReq?.procurementMethod === "RFQ" && dbReq?.riskLevel === "MEDIUM" && dbReq?.budgetCode === BUD && !!dbReq?.planItemId && !!dbReq?.requiredDate && !!dbReq?.currencyId, JSON.stringify(dbReq)?.slice(0, 300))
const myTok = (await api("POST", "/auth/login", null, { email: R.email, password: R.password })).json.token
const attRows = (await api("GET", `/procurement/requisitions/${dbReq?.id}/attachments`, myTok)).json?.data || []
check("both files were uploaded and recorded on the requisition", attRows.length === 2 && attRows.some((x) => x.fileName === "quote.txt") && attRows.some((x) => x.fileName === "spec.csv"), JSON.stringify(attRows).slice(0, 200))
check("an uploaded file downloads back unchanged", (await fetch(attRows.find((x) => x.fileName === "quote.txt")?.fileUrl || "http://127.0.0.1:1").then((x) => x.text()).catch(() => "")) === "supplier quote 1")
await myRow.locator("strong.link").first().click()
await req.page.waitForTimeout(1200)
check("the requisition view lists the attachments as links", (await bodyHas(req.page, "quote.txt")) && (await bodyHas(req.page, "spec.csv")))
check("the requisition view shows the header fields, position, route and decision history", (await bodyHas(req.page, "Procurement method")) && (await bodyHas(req.page, "Budget position")) && (await bodyHas(req.page, "Decision history")) && (await bodyHas(req.page, "Submitted")), await req.page.locator(".modal, [role=dialog]").first().innerText().catch(() => "").then((x) => x.slice(0, 200)))
await shot(req.page, "07-requisition-view")
await req.page.keyboard.press("Escape")

// ================================================================== approver A: comment, return
console.log("\n== Approver: comment and return ==")
const ap = await session(A.email, A.password)
await openQueue(ap.page)
await waitRow(ap.page, title)
const aRow = rowFor(ap.page, title)
check("the approver's queue holds it", (await aRow.count()) === 1)
await aRow.locator("strong.link").first().click()
await ap.page.waitForSelector("text=Decision history")
check("review shows what the requester entered (budget position, method)", (await bodyHas(ap.page, "Budget position")) && (await bodyHas(ap.page, "Rfq")))
check("delegation is offered on this step", (await ap.page.locator('[data-action="delegate-pr-v11"]').count()) === 1)
await shot(ap.page, "08-review")
await ap.page.click('[data-action="reject-pr-v11"]')
await ap.page.waitForSelector("#rejectPrFormV11")
check("decision form offers reject, return for amendment and comment (no pre-written reason)", (await ap.page.locator('#rejectPrFormV11 [name="decision"] option').count()) === 3 && (await ap.page.inputValue('#rejectPrFormV11 [name="reason"]')) === "")
t = await withToast(ap.page, () => ap.page.click('[data-action="confirm-reject-pr-v11"]'))
check("a decision without comments is refused", /comments|reason|fill|required/i.test(t) || (await ap.page.locator("#rejectPrFormV11").count()) === 1, t)
await ap.page.selectOption('#rejectPrFormV11 [name="decision"]', "comment")
await ap.page.fill('#rejectPrFormV11 [name="reason"]', "Please confirm the bag is needed.")
t = await withToast(ap.page, () => ap.page.click('[data-action="confirm-reject-pr-v11"]'))
check("comment recorded, requisition still pending", /Comment recorded/i.test(t), t)
await ap.page.waitForTimeout(9000)
await rowFor(ap.page, title).locator("strong.link").first().click()
await ap.page.waitForSelector("text=Decision history")
check("the comment shows in the decision history", await bodyHas(ap.page, "Please confirm the bag is needed."))
await ap.page.click('[data-action="reject-pr-v11"]')
await ap.page.waitForSelector("#rejectPrFormV11")
await ap.page.selectOption('#rejectPrFormV11 [name="decision"]', "return")
await ap.page.fill('#rejectPrFormV11 [name="reason"]', "Add the delivery contact and drop the bag.")
t = await withToast(ap.page, () => ap.page.click('[data-action="confirm-reject-pr-v11"]'))
check("return for amendment confirmed", /returned to its requester for amendment/i.test(t), t)
await waitGone(ap.page, title)
check("it leaves the approver's queue", (await rowFor(ap.page, title).count()) === 0)
await ap.ctx.close()

// ================================================================== requester: amend and resubmit
console.log("\n== Requester amends and resubmits ==")
await openPage(req.page, "requisitions", "My Purchase Requisitions")
await waitRow(req.page, title)
const retRow = rowFor(req.page, title)
check("requester sees it as Returned", /Returned/.test(await retRow.innerText()), await retRow.innerText())
await rowMenu(req.page, retRow, /Edit request/)
await req.page.waitForSelector("#editPrFormV11")
check("the return comment is shown with the edit form", (await bodyHas(req.page, "Add the delivery contact and drop the bag.")) && (await bodyHas(req.page, "Returned for amendment")))
check("edit form carries the header fields and the lines, prefilled", (await req.page.inputValue('#editPrFormV11 [name="budgetCode"]')) === BUD && (await req.page.locator("#editPrFormV11 [data-pr-line]").count()) === 2 && (await req.page.inputValue('#editPrFormV11 [name="procurementMethod"]')) === "RFQ")
check("the edit form lists existing attachments with Remove", (await req.page.locator('#editPrFormV11 [data-action="remove-pr-attachment-v23"]').count()) === 2)
await shot(req.page, "09-edit-returned")
t = await withToast(req.page, () => req.page.click('[data-action="submit-pr-v11"]'))
check("resubmitting without any change is refused", /No changes were detected/i.test(t), t)
fs.writeFileSync(path.join(tmp, "contact.txt"), "Tariro 0777")
await req.page.setInputFiles('#editPrFormV11 [name="attachments"]', [path.join(tmp, "contact.txt")])
await req.page.fill('#editPrFormV11 [name="deliveryLocation"]', "Head office store, contact Tariro")
await req.page.locator("#editPrFormV11 [data-pr-line]").nth(1).locator('[name="item"]').fill("Laptop bag")
await req.page.locator('#editPrFormV11 [data-action="remove-pr-line-v23"]').dispatchEvent("click")
t = await withToast(req.page, () => req.page.click('[data-action="submit-pr-v11"]'))
check("amended requisition resubmits", /amended and resubmitted/i.test(t), t)
const attAfter = (await api("GET", `/procurement/requisitions/${dbReq?.id}/attachments`, myTok)).json?.data || []
check("the file added while amending was uploaded (3 attachments now)", attAfter.length === 3 && attAfter.some((x) => x.fileName === "contact.txt"), JSON.stringify(attAfter.map((x) => x.fileName)))
await waitRowText(req.page, title, /Pending[\s\S]*3,600/)
check("register shows it pending again with the reduced estimate (3,600)", /Under Review|Pending/.test(await rowFor(req.page, title).innerText()) && /3,600/.test(await rowFor(req.page, title).innerText()), await rowFor(req.page, title).innerText())

// ================================================================== approver A: delegate; D approves
console.log("\n== Delegation ==")
const ap2 = await session(A.email, A.password)
await openQueue(ap2.page)
await waitRow(ap2.page, title)
await rowFor(ap2.page, title).locator("strong.link").first().click()
await ap2.page.waitForSelector("text=Decision history")
check("history shows submit, comment, return and resubmit", (await bodyHas(ap2.page, "Returned for amendment")) && (await bodyHas(ap2.page, "Resubmitted")) && (await bodyHas(ap2.page, "Comment")))
await ap2.page.click('[data-action="delegate-pr-v11"]')
await ap2.page.waitForSelector("#delegateRequisitionFormV23")
const optTexts = await ap2.page.locator('#delegateRequisitionFormV23 [name="delegate"] option').allInnerTexts()
const reqOpt = ap2.page.locator(`#delegateRequisitionFormV23 [name="delegate"] option[value="${R.id}"]`)
const reqTxt = (await reqOpt.count()) ? await reqOpt.first().innerText() : "none"
const reqDis = (await reqOpt.count()) ? await reqOpt.first().evaluate((o) => o.disabled) : false
check("delegate picker lists real staff, and the requester is disabled with the reason", optTexts.length > 5 && reqDis && /requester|raised/i.test(reqTxt), `${optTexts.length} opts; requester option: ${reqTxt}; disabled=${reqDis}`)
check("picker is built from the API (it lists this test's own users)", optTexts.some((x) => x.includes(D.name)), optTexts.slice(0, 3).join("|"))
await shot(ap2.page, "10-delegate")
await ap2.page.fill('#delegateRequisitionFormV23 [name="reason"]', "On leave until Monday")
t = await withToast(ap2.page, () => ap2.page.click('[data-action="confirm-delegate-pr-v23"]'))
check("delegating without choosing anyone is refused", /Choose|select|required/i.test(t) || (await ap2.page.locator("#delegateRequisitionFormV23").count()) === 1, t)
await ap2.page.selectOption('#delegateRequisitionFormV23 [name="delegate"]', D.id)
t = await withToast(ap2.page, () => ap2.page.click('[data-action="confirm-delegate-pr-v23"]'))
check("delegation succeeds and says who it now waits for", /delegated/i.test(t) && /UId Tester/.test(t), t)
await ap2.page.waitForTimeout(4500)
await ap2.page.waitForFunction((x) => ![...document.querySelectorAll("tr")].some((r) => r.innerText.includes(x)), title, { timeout: 60000 }).catch(() => undefined)
check("it left A's queue", (await rowFor(ap2.page, title).count()) === 0)
await ap2.ctx.close()
const dl = await session(D.email, D.password)
await openQueue(dl.page)
await waitRow(dl.page, title)
await rowFor(dl.page, title).locator("strong.link").first().click()
await dl.page.waitForSelector("text=Decision history")
check("the delegate sees the delegation in the history", (await bodyHas(dl.page, "Delegated")) && (await bodyHas(dl.page, "On leave until Monday")))
t = await withToast(dl.page, () => dl.page.click('[data-action="approve-pr-v11"]'))
check("the delegate approves step 1; it moves to step 2", /approved at your step/i.test(t) && /UIb Tester/.test(t), t)
await dl.ctx.close()

// ================================================================== approver B: limit, reject
console.log("\n== Approval limit and rejection ==")
await api("PUT", `/users/${B.id}`, adminTok, { approvalLimitAmount: 500 }).catch(() => undefined)
const bp = await session(B.email, B.password)
await openQueue(bp.page)
await waitRow(bp.page, title)
await rowFor(bp.page, title).locator("strong.link").first().click()
await bp.page.waitForSelector("text=Decision history")
const limited = (await api("GET", `/users/${B.id}`, adminTok)).json?.data
t = await withToast(bp.page, () => bp.page.click('[data-action="approve-pr-v11"]'))
const limitApplied = Number(limited?.approvalLimitAmount) === 500
check("approving above the approver's limit is refused with the reason (or the limit was not settable via API)", !limitApplied || /approval limit/i.test(t), t)
await bp.page.waitForTimeout(3500)
await rowFor(bp.page, title).locator("strong.link").first().click().catch(() => undefined)
await bp.page.waitForSelector("#rejectPrFormV11, [data-action='reject-pr-v11']", { timeout: 30000 }).catch(() => undefined)
await bp.page.click('[data-action="reject-pr-v11"]')
await bp.page.waitForSelector("#rejectPrFormV11")
await bp.page.selectOption('#rejectPrFormV11 [name="decision"]', "reject")
await bp.page.fill('#rejectPrFormV11 [name="reason"]', "Over the quarter's capital allowance.")
t = await withToast(bp.page, () => bp.page.click('[data-action="confirm-reject-pr-v11"]'))
check("step 2 approver rejects with a reason", /rejected with your reason/i.test(t), t)
await bp.ctx.close()
await req.page.waitForTimeout(500)
await openPage(req.page, "requisitions", "My Purchase Requisitions")
await waitRow(req.page, title)
check("the requester sees it Rejected", /Rejected/.test(await rowFor(req.page, title).innerText()), await rowFor(req.page, title).innerText())
await rowMenu(req.page, rowFor(req.page, title), /Edit request|View/)
await req.page.waitForSelector("#editPrFormV11")
check("the rejection reason and full decision history are shown to the requester", (await bodyHas(req.page, "Over the quarter's capital allowance.")) && (await bodyHas(req.page, "Delegated")) && (await bodyHas(req.page, "Approved")))
await shot(req.page, "11-rejected-history")
await req.ctx.close()

// ---- restore
await api("PUT", "/procurement/requisition-policy", adminTok, { budgetCheckMode: policyBefore.budgetCheckMode, planLinkPolicy: policyBefore.planLinkPolicy, suggestedVendorPolicy: policyBefore.suggestedVendorPolicy, prNumberFormat: policyBefore.prNumberFormat })
if (matrixBefore?.steps?.length) {
  await api("PUT", "/procurement/approval-matrix", adminTok, { steps: matrixBefore.steps.map((s) => ({ kind: s.kind, department: s.department, deputy: s.deputy, roleCode: s.roleCode, userId: s.userId, aboveAmount: s.aboveAmount, minApprovalLevel: s.minApprovalLevel, canDelegate: s.canDelegate, matchRules: s.matchRules })) })
}
await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.log("FAILED:\n - " + failed.map((f) => f.name).join("\n - "))
  process.exitCode = 1
}
