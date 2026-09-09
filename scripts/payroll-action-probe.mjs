/**
 * Payroll V6 — click a control in the real UI and report what actually happened.
 *
 * The dumper proves a screen renders; the tracer proves its numbers are real.
 * Neither proves a BUTTON does anything. This clicks a `[data-action]` control
 * as a given role and reports the API calls it produced and the toast it
 * raised, which is what separates a live control from a silent no-op.
 *
 * USAGE
 *   node scripts/payroll-action-probe.mjs --role=sysadmin --page=runs --action=create-run
 *   node scripts/payroll-action-probe.mjs --role=hr --page=approvals --action=approve-payroll
 *
 * A control that is legitimately view-state produces no API call and no toast —
 * that is a pass, reported as VIEW-STATE. A control that produces neither and
 * claims to save is the defect this exists to catch.
 */
import { chromium } from "playwright"

const ROLES = {
  sysadmin: "perf.sysadmin@nts.local",
  exec: "perf.exec@nts.local",
  hr: "perf.hr@nts.local",
  deptmgr: "perf.deptmgr@nts.local",
  employee: "perf.employee@nts.local",
}
const PASSWORD = "admin123"

const PAGES = {
  overview: "/payroll-v6",
  employees: "/payroll-v6/employees",
  runs: "/payroll-v6/runs",
  approvals: "/payroll-v6/approvals",
  close: "/payroll-v6/close",
  inputs: "/payroll-v6/inputs",
  mypay: "/payroll-v6/mypay",
  components: "/payroll-v6/components",
  tax: "/payroll-v6/tax",
  leave: "/payroll-v6/leave",
}

const arg = (n, d) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : d
}

const BASE = arg("base", process.env.PAYROLL_BASE || "http://localhost:3001")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const ROLE = arg("role", "sysadmin")
const PAGE = arg("page", "runs")
const ACTION = arg("action", "")
const FIELD = arg("field", "") // e.g. runPeriod=July 2031

if (!ROLES[ROLE] || !PAGES[PAGE] || !ACTION) {
  console.error("usage: --role=<role> --page=<page> --action=<data-action id> [--field=id=value]")
  process.exit(1)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } })

const login = await (
  await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ROLES[ROLE], password: PASSWORD }),
  })
).json()
if (!login.token) {
  console.error(`login failed for ${ROLES[ROLE]}`)
  process.exit(1)
}
const user = login.user || {}
const slim = {
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  roleCode: user.roleCode,
  roleName: user.roleName ?? null,
}
const { hostname } = new URL(BASE)
const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
await context.addCookies([
  { name: "token", value: login.token, ...common },
  { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
  { name: "userProfile", value: encodeURIComponent(JSON.stringify(slim)), ...common },
])

const page = await context.newPage()
page.setDefaultTimeout(60000)

await page.goto(BASE + PAGES[PAGE], { waitUntil: "domcontentloaded" })
await page.waitForSelector("#content", { timeout: 60000 })
// Let the loaders resolve and hydrate before touching anything.
await page.waitForTimeout(5000)

// Only traffic caused by the click counts, so start recording now.
const calls = []
page.on("response", async (r) => {
  const url = r.url()
  if (!url.includes("/api/payroll")) return
  const req = r.request()
  calls.push(`${req.method()} ${r.status()} ${url.replace(/^https?:\/\/[^/]+/, "").split("?")[0]}`)
})

const before = await page.evaluate(() => document.querySelector("#content").innerText.length)

// Some actions live behind a modal opened by another control (e.g. create-run
// is inside the "New run" dialog), so open it if the action is not on screen.
// Some actions only exist inside a modal. The modal markup lives in the shell
// and is present-but-hidden even when closed, so searching first would find an
// unclickable copy and the click would look like a silent no-op. Open the
// dialog first whenever one is known, then take the VISIBLE element.
const OPENERS = {
  "create-run": "new-run",
  "save-run": "new-run",
  "record-decision": "approval-decision",
  "complete-onboarding": "new-employee",
  "save-onboarding": "new-employee",
  "confirm-upload": "upload-document",
  "confirm-create-document": "create-document",
}
const opener = OPENERS[ACTION]
let modalOpened = null
if (opener) {
  const o = await page.$(`[data-action="${opener}"]`)
  if (o) {
    await o.click({ force: true })
    await page.waitForTimeout(2500)
    modalOpened = await page.evaluate(() => {
      const m = document.querySelector("#modal")
      return m ? m.className : null
    })
  }
}
let found = await page.$(`[data-action="${ACTION}"]:visible`)
if (!found) found = await page.$(`[data-action="${ACTION}"]`)

if (!found) {
  console.log(`ACTION      ${ACTION}`)
  console.log(`ROLE        ${ROLE}`)
  console.log(`PAGE        ${PAGE}`)
  console.log(`RESULT      NOT PRESENT — no [data-action="${ACTION}"] on this screen for this role`)
  await browser.close()
  process.exit(0)
}

if (FIELD) {
  const [id, ...rest] = FIELD.split("=")
  const value = rest.join("=")
  const ok = await page.evaluate((id) => !!document.querySelector(`#${id}`), id)
  console.log(`FIELD       #${id} present: ${ok}`)
  await page.evaluate(
    ([id, value]) => {
      const el = document.querySelector(`#${id}`)
      if (el) {
        el.value = value
        el.dispatchEvent(new Event("input", { bubbles: true }))
      }
    },
    [id, value],
  )
}

// force: the modal backdrop overlays the dialog's own buttons, so a plain
// click waits on actionability and never lands -- which reads as a silent
// no-op and is exactly the false negative this script must not produce.
await found.click({ force: true })
// Give the request and the toast time to land.
await page.waitForTimeout(5000)

const toasts = await page.evaluate(() => {
  const seen = new Set()
  for (const t of document.querySelectorAll("[data-sonner-toast], .toast, .toast-stack > *")) {
    const txt = (t.innerText || "").replace(/\s+/g, " ").trim()
    if (txt) seen.add(txt)
  }
  return Array.from(seen)
})
const after = await page.evaluate(() => document.querySelector("#content").innerText.length)

const apiCalls = calls.filter((c) => !c.startsWith("GET 200 /api/payroll/me/access"))

console.log(`ACTION      ${ACTION}`)
console.log(`ROLE        ${ROLE} (${ROLES[ROLE]})`)
console.log(`PAGE        ${PAGE}`)
console.log(`API CALLS   ${apiCalls.length}`)
for (const c of apiCalls) console.log(`  ${c}`)
console.log(`TOASTS      ${toasts.length}`)
for (const t of toasts) console.log(`  ${t}`)
console.log(`CONTENT     ${before} -> ${after} chars`)
if (opener) console.log(`MODAL       opened via "${opener}" -> ${modalOpened ?? "(no #modal)"}`)

const writes = apiCalls.filter((c) => !c.startsWith("GET"))
let verdict
if (writes.length) verdict = "LIVE — reached a write endpoint"
else if (toasts.length) verdict = "REFUSED / MESSAGED — no write, but the UI said so"
else if (after !== before) verdict = "VIEW-STATE — changed the screen, no API call"
else verdict = "SILENT NO-OP — no API call, no message, no visible change"
console.log(`VERDICT     ${verdict}`)

await browser.close()
