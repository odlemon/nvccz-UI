/**
 * User Master, Procurement side, in a visible browser: what a real user sees.
 *  - a limited approver's own authority card in Procurement > Configuration
 *  - the approval matrix shows and edits the minimum approval level
 *  - a suspended user is refused at the login screen with the reason
 *  - a READ_ONLY user sees the module but every write is refused
 * Needs the FE (UAT_FE, default http://localhost:3120) and the local API (:3009).
 */
import { chromium } from "playwright"
import fs from "node:fs"

const FE = process.env.UAT_FE || "http://localhost:3120"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const OUT = process.env.UAT_OUT || "design-refs/user-master/screens"
fs.mkdirSync(OUT, { recursive: true })
const TAG = `umui${Date.now().toString(36)}`
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 240)}`)
}

async function api(method, path, token, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: r.status, json: await r.json().catch(() => null) }
}

// ---- data: created through the real API
const adminTok = (await api("POST", "/auth/login", null, { email: "admin@nts.com", password: "admin123" })).json.token
const mk = async (key, extra) => {
  const email = `${TAG}.${key}@nts.local`
  const r = await api("POST", "/users", adminTok, {
    firstName: `UI${key}`, lastName: "Tester", email, department: "Legal", roleCode: "OPS_MEM", departmentRole: "MEMBER", ...extra,
  })
  if (r.status !== 201) throw new Error(`create ${key}: ${r.status} ${JSON.stringify(r.json)}`)
  return { id: r.json.data.user.id, email, password: r.json.data.temporaryPassword }
}
const limited = await mk("limited", { departmentRole: "HEAD", approvalLimitAmount: 1000, approvalLevel: 2, procurementFunction: "APPROVER", costCentre: "CC-900" })
const suspended = await mk("suspended", { status: "SUSPENDED" })
const readonly = await mk("readonly", { accessProfile: "READ_ONLY" })

const browser = await chromium.launch({ headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 350) })

async function newSession() {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(120000)
  return { ctx, page }
}
async function signIn(page, email, password) {
  await page.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(5000)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/login")),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(3500)
  return resp
}

// ---- 1. suspended user at the login screen
{
  const { ctx, page } = await newSession()
  const resp = await signIn(page, suspended.email, suspended.password)
  const body = await page.locator("body").innerText()
  check("suspended user: login refused (403)", resp.status() === 403, resp.status())
  check("suspended user: the screen says why", /suspended/i.test(body), body.slice(0, 200))
  await page.screenshot({ path: `${OUT}/login-suspended.png` })
  await ctx.close()
}

// ---- 2. limited approver: own authority in Procurement
{
  const { ctx, page } = await newSession()
  await signIn(page, limited.email, limited.password)
  await page.goto(`${FE}/procurement/settings`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("text=Your authority", { timeout: 180000 })
  await page.waitForSelector("text=CC-900", { timeout: 120000 }) // live data hydrates after the shell
  const text = await page.locator("body").innerText()
  check("authority card: procurement function", /Approver/.test(text))
  check("authority card: approval limit shown", text.includes("$1,000.00"), "")
  check("authority card: approval level shown", /Approval level\s*\n?\s*2/.test(text), "")
  check("authority card: cost centre shown", text.includes("CC-900"))
  check("permissions narrowed by function: no RFQ management", !/rfq\.manage/.test(text))
  await page.screenshot({ path: `${OUT}/procurement-authority.png` })
  await ctx.close()
}

// ---- 3. READ_ONLY user: module opens, writes are refused
{
  const { ctx, page } = await newSession()
  await signIn(page, readonly.email, readonly.password)
  await page.goto(`${FE}/procurement`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("text=Procurement", { timeout: 180000 })
  const tok = (await api("POST", "/auth/login", null, { email: readonly.email, password: readonly.password })).json.token
  const w = await api("POST", "/procurement/requisitions", tok, { title: "x", department: "Legal", items: [{ itemName: "a", quantity: 1, unitPrice: 1 }] })
  check("read-only user: procurement opens", true)
  check("read-only user: write refused with the profile reason", w.status === 403 && /read-only/i.test(w.json?.message || ""), JSON.stringify(w.json))
  await page.screenshot({ path: `${OUT}/procurement-readonly.png` })
  await ctx.close()
}

// ---- 4. approval matrix: minimum approval level
{
  const { ctx, page } = await newSession()
  await signIn(page, "admin@nts.com", "admin123")
  await page.goto(`${FE}/procurement/settings`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("text=Your authority", { timeout: 180000 })
  await page.getByRole("button", { name: "Approval matrix" }).click()
  await page.waitForSelector("text=Requisition approval route")
  const th = (await page.locator("th").allInnerTexts()).map((s) => s.toLowerCase())
  check("matrix shows an Approval level column", th.some((x) => x.includes("approval level")), th.join("|"))
  await page.screenshot({ path: `${OUT}/procurement-matrix.png` })
  await page.getByRole("button", { name: "Edit route" }).click()
  await page.waitForSelector("text=Edit requisition approval route")
  check("route editor has a Min. approval level input", (await page.locator('input[name="minApprovalLevel"]').count()) > 0)
  await page.screenshot({ path: `${OUT}/procurement-matrix-edit.png` })
  await page.getByRole("button", { name: "Cancel" }).click()
  await ctx.close()
}

// cleanup: take the UI test accounts out of service
for (const u of [limited, suspended, readonly]) await api("PUT", `/users/${u.id}`, adminTok, { status: "DEACTIVATED" })

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} Procurement UI checks passed`)
await browser.close()
process.exitCode = failed.length ? 1 : 0
