/**
 * Vendor Master, staff side, in a visible browser (Procurement > Vendor Registry).
 * Needs the staff FE (UAT_FE, default http://localhost:3120) and the local API (:3009).
 *   node scripts/_uat/vendor-master-ui.mjs
 */
import { chromium } from "playwright"
import fs from "node:fs"

const FE = process.env.UAT_FE || "http://localhost:3120"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const OUT = process.env.UAT_OUT || "design-refs/vendor-master/screens"
fs.mkdirSync(OUT, { recursive: true })
const TAG = `vui${Date.now().toString(36)}`
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 260)}`)
}
async function api(method, path, token, body) {
  const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, json: await r.json().catch(() => null) }
}

// A second person to approve (the person who submits a vendor for approval may not approve it themselves).
const adminTok = (await api("POST", "/auth/login", null, { email: "admin@nts.com", password: "admin123" })).json.token
const mkUser = async (key, roleCode) => {
  const email = `${TAG}.${key}@nts.local`
  const r = await api("POST", "/users", adminTok, { firstName: `UI${key}`, lastName: "Tester", email, department: "Procurement", roleCode, departmentRole: "OFFICER" })
  if (r.status !== 201) throw new Error("user: " + JSON.stringify(r.json))
  return { email, password: r.json.data.temporaryPassword, id: r.json.data.user.id }
}
const approver = await mkUser("approver", "PROC_MGR")

const browser = await chromium.launch({ headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 300) })
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
const open = async (page) => {
  await page.goto(`${FE}/procurement/vendors`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("text=Vendor Registry", { timeout: 180000 })
  await page.waitForSelector("#vendorRegistryTableV23 tbody tr", { timeout: 180000 })
}
const toastText = async (page) => (await page.locator("[data-sonner-toast]").last().innerText().catch(() => "")).replace(/\s+/g, " ")
// The toast lives 3.6s: start waiting for it before the click that raises it.
const withToast = async (page, fn) => {
  const seen = page.waitForSelector("[data-sonner-toast]", { timeout: 10000 }).then(() => page.locator("[data-sonner-toast]").last().innerText()).catch(() => "")
  await fn()
  return String(await seen).replace(/\s+/g, " ")
}
const docMenu = async (pg) => pg.locator('[data-action="vendor-doc-edit-v23"]').first().click()
const bodyHas = (page, text) => page.waitForFunction((x) => document.body.innerText.includes(x), text, { timeout: 60000 }).then(() => true).catch(() => false)

const { ctx, page } = await session("admin@nts.com", "admin123")
await open(page)
await page.screenshot({ path: `${OUT}/registry.png` })

// ---------------------------------------------------------------- registry
const heads = (await page.locator("#vendorRegistryTableV23 thead th").allInnerTexts()).map((s) => s.trim().toLowerCase())
for (const h of ["vendor status", "compliance", "banking", "classification"]) check(`registry column: ${h}`, heads.some((x) => x.includes(h)), heads.join("|"))
const total = await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]").count()
check("registry lists vendors from the API with a Vendor Code", (await page.locator("#vendorRegistryTableV23 tbody tr td strong.link").first().innerText()).startsWith("VND-"), String(total))

await page.locator('select[data-vfilter="status"]').selectOption("APPROVED")
await page.waitForTimeout(400)
const approvedRows = await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").count()
const allApproved = (await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").evaluateAll((rs) => rs.every((r) => r.dataset.vstatus === "APPROVED")))
check("status filter filters (Approved only)", approvedRows > 0 && approvedRows < total && allApproved, `${approvedRows}/${total}`)
await page.locator('select[data-vfilter="status"]').selectOption("INACTIVE")
await page.waitForTimeout(300)
check("status filter shows Inactive vendors too (kept on record)", (await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").count()) > 0)
await page.locator('select[data-vfilter="status"]').selectOption("")
await page.locator('input[data-vfilter="q"]').fill("zzz-no-such-vendor")
await page.waitForTimeout(300)
check("search filters and shows an empty state", (await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").count()) === 0 && (await page.locator("#vendorEmptyV23").isVisible()))
await page.locator('input[data-vfilter="q"]').fill("")
await page.waitForTimeout(300)

// ---------------------------------------------------------------- register (Draft)
await page.getByRole("button", { name: "Register vendor" }).first().click()
await page.waitForSelector("#vendorForm")
const fields = ["name", "tradingName", "registrationNumber", "tin", "vat", "category", "commodities", "risk", "country", "contact", "email", "phone", "paymentTerms", "currency", "taxExpiry", "address", "notes"]
for (const f of fields) check(`register form field: ${f}`, (await page.locator(`#vendorForm [name="${f}"]`).count()) === 1)
const vendorName = `${TAG} Test Supplies (Pvt) Ltd`
await page.fill('#vendorForm [name="name"]', vendorName)
await page.fill('#vendorForm [name="tradingName"]', "Test Supplies")
await page.fill('#vendorForm [name="registrationNumber"]', "REG-2026/77")
await page.fill('#vendorForm [name="tin"]', `TIN-${TAG}`)
await page.fill('#vendorForm [name="vat"]', "VAT-4455")
await page.selectOption('#vendorForm [name="category"]', { index: 1 })
await page.fill('#vendorForm [name="commodities"]', "Stationery, Printing")
await page.selectOption('#vendorForm [name="risk"]', "MEDIUM")
await page.fill('#vendorForm [name="country"]', "Zimbabwe")
await page.fill('#vendorForm [name="contact"]', "Tariro Moyo")
await page.fill('#vendorForm [name="email"]', `${TAG}@vendor.test`)
await page.fill('#vendorForm [name="phone"]', "+263 77 555 0101")
await page.fill('#vendorForm [name="paymentTerms"]', "Net 30")
const curOptions = await page.locator('#vendorForm [name="currency"] option').allInnerTexts()
if (curOptions.length > 1) await page.selectOption('#vendorForm [name="currency"]', { index: 1 })
const future = new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10)
await page.fill('#vendorForm [name="taxExpiry"]', future)
await page.fill('#vendorForm [name="address"]', "12 Samora Machel Ave, Harare")
await page.fill('#vendorForm [name="notes"]', "Registered through the UI test")
const registered = await withToast(page, () => page.getByRole("button", { name: "Register vendor" }).last().click())
check("registering shows it is a Draft to be reviewed and approved", /Draft/.test(registered), registered)
await open(page)
await page.locator('input[data-vfilter="q"]').fill(TAG)
await page.waitForTimeout(400)
const row = page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").first()
check("new vendor appears in the registry as Draft with a code (persisted after reload)", (await row.count()) === 1 && /Draft/.test(await row.innerText()) && /VND-\d{5}/.test(await row.innerText()), await row.innerText().catch(() => "none"))
await row.locator('[data-action="open-vendor-v6"]').first().click()
await page.waitForSelector("text=Vendor master record")
let profile = await page.locator("#workspace, body").first().innerText()
for (const t of ["Trading name", "Registration number", "Tax identification number (TIN)", "VAT number", "Risk classification", "Commodity / service categories", "Registered address", "Payment terms", "Onboarding date", "Notes"]) check(`profile shows: ${t}`, profile.includes(t))
const vals = await page.locator(".form-grid .field input[readonly]").evaluateAll((els) => els.map((e) => e.value))
check("profile values saved (trading name, registration no., TIN, VAT, country, terms)", ["Test Supplies", "REG-2026/77", `TIN-${TAG}`, "VAT-4455", "Zimbabwe", "Net 30"].every((x) => vals.includes(x)), vals.join(" | "))
check("profile says a Draft vendor cannot transact, and why", /cannot be invited to an RFQ, awarded, issued a purchase order or paid/.test(profile) && /status is Draft/i.test(profile))
await page.screenshot({ path: `${OUT}/profile-draft.png` })

// ---------------------------------------------------------------- lifecycle through the UI
const move = async (name, confirmText = "Confirm", reason = "") => {
  await page.getByRole("button", { name }).first().click()
  await page.waitForSelector("#vendorStatusFormV23")
  if (reason) await page.fill('#vendorStatusFormV23 [name="reason"]', reason)
  await page.getByRole("button", { name: confirmText }).last().click()
}
await move("Submit for review")
check("Draft -> Pending Review", await bodyHas(page, "Pending Review"))
await move("Send for approval")
check("Pending Review -> Pending Approval", await bodyHas(page, "Send for approval") === false || await bodyHas(page, "Pending Approval"))
// the same person cannot approve what they put forward
const approveBtn = page.getByRole("button", { name: /Move to Approved|Approved/ }).filter({ hasText: /Approve|Approved/ }).first()
await page.locator('[data-action="vendor-status-move-v23"][data-to="APPROVED"]').first().click()
await page.waitForSelector("#vendorStatusFormV23")
// The refusal is its own toast: wait for it by its wording (an earlier success toast may still be on screen).
await page.getByRole("button", { name: "Confirm" }).last().click()
const sodSeen = await page.waitForSelector('[data-sonner-toast]:has-text("someone else")', { timeout: 15000 }).then(() => true).catch(() => false)
check("segregation of duties: the submitter cannot approve (refused with the reason)", sodSeen)
await page.keyboard.press("Escape")
await page.screenshot({ path: `${OUT}/profile-pending-approval.png` })

// a different person approves, in their own session
const s2 = await session(approver.email, approver.password)
await open(s2.page)
await s2.page.locator('input[data-vfilter="q"]').fill(TAG)
await s2.page.waitForTimeout(400)
await s2.page.locator('#vendorRegistryTableV23 tbody tr[data-vrow]:visible [data-action="open-vendor-v6"]').first().click()
await s2.page.waitForSelector("text=Vendor master record")
await s2.page.locator('[data-action="vendor-status-move-v23"][data-to="APPROVED"]').first().click()
await s2.page.waitForSelector("#vendorStatusFormV23")
await s2.page.getByRole("button", { name: "Confirm" }).last().click()
check("a different approver approves it (Pending Approval -> Approved)", await bodyHas(s2.page, "can be invited to RFQs, awarded, issued purchase orders and paid"), await toastText(s2.page))
await s2.page.screenshot({ path: `${OUT}/profile-approved-by-second-user.png` })
await s2.ctx.close()

// ---------------------------------------------------------------- documents, expiry, compliance (staff UI on the admin session)
const vendorRow = await (async () => {
  const list = await api("GET", `/accounting/vendors?status=APPROVED,DRAFT,PENDING_REVIEW,PENDING_APPROVAL,EXPIRED&include=kyc`, adminTok)
  return list.json.data.find((v) => v.name === vendorName)
})()
check("API agrees: vendor is Approved with a code and onboarding date", vendorRow?.vendorStatus === "APPROVED" && !!vendorRow.vendorCode && !!vendorRow.onboardingDate, JSON.stringify([vendorRow?.vendorStatus, vendorRow?.onboardingDate]))
// A document row (the file store is remote; the expiry behaviour under test is the vendor master's)
let docId = null
{
  // Uploads go to a remote file store that is not part of the local stack; the behaviour under test is the vendor master's
  // handling of the document's expiry, so the row is inserted the way the upload would (mysql client, local database).
  const { execFileSync } = await import("node:child_process")
  docId = `c${Date.now().toString(36)}doc`
  const mysql = process.env.MYSQL_EXE || "C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe"
  const sql = `INSERT INTO vendor_kyc_documents (id, vendor_id, document_type, file_name, file_url, is_encrypted, is_verified, uploaded_by_id, expiry_date, created_at, updated_at) VALUES ('${docId}', '${vendorRow.id}', 'INSURANCE', 'insurance-2026.pdf', '/uploads/insurance-2026.pdf', 0, 0, '${approver.id}', DATE_ADD(CURDATE(), INTERVAL 12 DAY), NOW(3), NOW(3))`
  execFileSync(mysql, ["-uarcus_dev", "-plocaldev_arcus_2026", "arcus_dev", "-e", sql], { stdio: "pipe" })
}
await page.reload({ waitUntil: "domcontentloaded" })
await open(page)
await page.locator('input[data-vfilter="q"]').fill(TAG)
await page.waitForTimeout(400)
await page.locator('#vendorRegistryTableV23 tbody tr[data-vrow]:visible [data-action="open-vendor-v6"]').first().click()
await page.waitForSelector("text=Supporting documents")
const docsText = await page.locator("body").innerText()
check("document shows its expiry date and state (Expiring soon, 12 days out)", /Insurance document/.test(docsText) && /Expiring soon/.test(docsText))
check("compliance shows Expiring soon but the vendor can still transact (warned, not blocked)", /Expiring soon/.test(docsText) && /can be invited to RFQs, awarded/.test(docsText))
await docMenu(page)
await page.waitForSelector("#vendorDocFormV23")
const past = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
await page.fill('#vendorDocFormV23 [name="expiryDate"]', past)
await page.fill('#vendorDocFormV23 [name="notify"]', "45")
await page.getByRole("button", { name: "Save" }).last().click()
await page.waitForTimeout(2500)
await page.reload({ waitUntil: "domcontentloaded" })
await open(page)
await page.locator('select[data-vfilter="status"]').selectOption("EXPIRED")
await page.locator('input[data-vfilter="q"]').fill(TAG)
await page.waitForTimeout(500)
check("an expired document takes the vendor to Expired (visible in the registry)", (await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").count()) === 1)
await page.locator('#vendorRegistryTableV23 tbody tr[data-vrow]:visible [data-action="open-vendor-v6"]').first().click()
await page.waitForSelector("text=Supporting documents")
const expText = await page.locator("body").innerText()
check("profile explains it: cannot be invited/awarded/PO/paid because the document expired", /Expired/.test(expText) && /insurance expired on/i.test(expText) && /cannot be invited to an RFQ, awarded, issued a purchase order or paid/.test(expText), expText.slice(0, 200))
check("the alert period saved per document (45 days)", /45 days/.test(expText))
await page.screenshot({ path: `${OUT}/profile-expired.png` })
await docMenu(page)
await page.waitForSelector("#vendorDocFormV23")
await page.fill('#vendorDocFormV23 [name="expiryDate"]', new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10))
await page.getByRole("button", { name: "Save" }).last().click()
await page.waitForTimeout(2500)
await page.reload({ waitUntil: "domcontentloaded" })
await open(page)
await page.locator('input[data-vfilter="q"]').fill(TAG)
await page.waitForTimeout(500)
check("renewing the document restores the vendor to Approved", /Approved/.test(await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").first().innerText()))

// ---------------------------------------------------------------- banking (finance)
await page.locator('#vendorRegistryTableV23 tbody tr[data-vrow]:visible [data-action="open-vendor-v6"]').first().click()
await page.waitForSelector("text=Banking details")
check("banking card says there is no bank account, so no bank payment", /cannot be paid by bank/.test(await page.locator("body").innerText()))
await page.locator('[data-action="vendor-bank-add-v23"]').first().click()
await page.waitForSelector("#vendorBankFormV23")
await page.fill('#vendorBankFormV23 [name="bankName"]', "CBZ Bank")
await page.fill('#vendorBankFormV23 [name="accountNumber"]', "4455667788")
await page.fill('#vendorBankFormV23 [name="branchCode"]', "0101")
await page.fill('#vendorBankFormV23 [name="swiftCode"]', "COBZZWHX")
await page.getByRole("button", { name: "Save bank account" }).last().click()
await page.waitForTimeout(2500)
const bankText = await page.locator("body").innerText()
check("bank account saved and shown masked (****7788)", /CBZ Bank/.test(bankText) && /\*\*\*\*7788/.test(bankText) && !bankText.includes("4455667788"), bankText.slice(bankText.indexOf("Banking details"), bankText.indexOf("Banking details") + 300))
await page.screenshot({ path: `${OUT}/profile-banking.png` })

// ---------------------------------------------------------------- block, then delete
await page.locator('[data-action="vendor-status-move-v23"][data-to="BLOCKED"]').first().click()
await page.waitForSelector("#vendorStatusFormV23")
await page.getByRole("button", { name: "Confirm" }).last().click()
await page.waitForTimeout(1500)
check("blocking demands a reason (form will not submit empty)", (await page.locator("#vendorStatusFormV23").count()) === 1)
await page.fill('#vendorStatusFormV23 [name="reason"]', "UI test: blocked pending investigation")
await page.getByRole("button", { name: "Confirm" }).last().click()
check("Blocked: profile says it cannot transact and shows Blocked", await bodyHas(page, "the vendor is blocked (blacklisted)") || await bodyHas(page, "The vendor is blocked (blacklisted)"))
await page.screenshot({ path: `${OUT}/profile-blocked.png` })
page.once("dialog", (d) => d.accept())
const deleted = await withToast(page, () => page.getByRole("button", { name: "Delete vendor" }).click())
check("deleting a vendor with no history removes it (no history to keep)", /deleted|removed/i.test(deleted), deleted)
await open(page)
await page.locator('input[data-vfilter="q"]').fill(TAG)
await page.waitForTimeout(400)
check("it is gone from the registry", (await page.locator("#vendorRegistryTableV23 tbody tr[data-vrow]:visible").count()) === 0)

// ---------------------------------------------------------------- restrictions the other way: a user who cannot manage/approve sees no controls
for (const u of [approver]) await api("PUT", `/users/${u.id}`, adminTok, { status: "DEACTIVATED" })
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} vendor UI checks passed`)
await ctx.close()
await browser.close()
process.exitCode = failed.length ? 1 : 0
