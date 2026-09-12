/**
 * Payroll V6 module — headless page dump.
 *
 * Adapted from scripts/accounting-page-dump.mjs (the closest analogue: another
 * vendored `matanho-*-runtime.js` module hydrated React-side). Written for the
 * same reason — for a runtime that paints imperatively, the rendered DOM is the
 * only reliable oracle, not the source.
 *
 * Two differences from the accounting dumper:
 *   - payroll-v6 renders its page into `#content` (see the runtime's render(),
 *     which writes `$('#content').innerHTML`), not `#main`.
 *   - it records EVERY /api/ response body, not just failures. That is the
 *     point of this module's audit: an on-screen number has to be matched back
 *     to a payload, so the payloads have to be captured alongside the DOM.
 *     scripts/payroll-trace-numbers.mjs consumes the JSON this writes.
 *
 * USAGE
 *   node scripts/payroll-page-dump.mjs --pages=overview,employees
 *   node scripts/payroll-page-dump.mjs --pages=all --role=hr --out=.payroll-dumps
 *
 * OPTIONS
 *   --pages=<ids|all>  --role=<sysadmin|exec|hr|deptmgr|employee>
 *   --base=<url>       --out=<dir>   --headed
 */
import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const ROLES = {
  sysadmin: "perf.sysadmin@nts.local",
  exec: "perf.exec@nts.local",
  hr: "perf.hr@nts.local",
  deptmgr: "perf.deptmgr@nts.local",
  employee: "perf.employee@nts.local",
}
const PASSWORD = "admin123"

/** page id -> route. Mirrors lib/payroll-v6-mock/nav.ts (PR6_PAGE_TO_PATH). */
const PAGES = {
  overview: "/payroll",
  employees: "/payroll/employees",
  onboarding: "/payroll/onboarding",
  runs: "/payroll/runs",
  inputs: "/payroll/inputs",
  exceptions: "/payroll/exceptions",
  approvals: "/payroll/approvals",
  close: "/payroll/close",
  components: "/payroll/components",
  calendar: "/payroll/calendar",
  tax: "/payroll/tax",
  training: "/payroll/training",
  leave: "/payroll/leave",
  vendors: "/payroll/vendors",
  vault: "/payroll/vault",
  reports: "/payroll/reports",
  audit: "/payroll/audit",
  access: "/payroll/access",
  settings: "/payroll/settings",
  mypay: "/payroll/mypay",
}

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const flag = (name) => process.argv.includes(`--${name}`)

const BASE = arg("base", process.env.PAYROLL_BASE || "http://localhost:3001")
const ROLE = arg("role", "sysadmin")
const OUT = path.resolve(arg("out", ".payroll-dumps"))
const WANT = arg("pages", "all")
const pageIds =
  WANT === "all" ? Object.keys(PAGES) : WANT.split(",").map((s) => s.trim()).filter(Boolean)

if (!ROLES[ROLE]) {
  console.error(`unknown --role=${ROLE}. Known: ${Object.keys(ROLES).join(", ")}`)
  process.exit(1)
}
for (const id of pageIds) {
  if (!PAGES[id]) {
    console.error(`unknown page id "${id}". Known: ${Object.keys(PAGES).join(", ")}`)
    process.exit(1)
  }
}

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: !flag("headed") })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(60000)

// ---- auth -----------------------------------------------------------------
// Cookie seeding rather than driving the login form, which races hydration.
async function seedAuthCookies(email, password) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"

  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const login = await loginRes.json().catch(() => ({}))
  const token = login.token || (login.data && login.data.token)
  if (!token) {
    throw new Error(
      `API login failed for ${email}: ${loginRes.status} ${JSON.stringify(login).slice(0, 200)}`,
    )
  }

  const user = login.user || (login.data && login.data.user) || {}
  let profile = user
  if (user.id) {
    const profRes = await fetch(`${apiBase}/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const prof = await profRes.json().catch(() => ({}))
    if (prof && prof.data) profile = prof.data
  }

  // The full /users/:id profile encodes to ~5.7KB, which is over the 4KB cookie
  // limit and makes addCookies fail with "Invalid cookie fields". Seed only the
  // identity fields the app shell needs — payroll entitlement is read live from
  // /payroll/me/access, not from this cookie.
  const slimProfile = {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    roleCode: profile.roleCode,
    roleName: profile.roleName ?? profile.role?.name ?? null,
    role: profile.role ? { id: profile.role.id, name: profile.role.name } : null,
  }

  const { hostname } = new URL(BASE)
  const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
  await context.addCookies([
    { name: "token", value: token, ...common },
    { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
    { name: "userProfile", value: encodeURIComponent(JSON.stringify(slimProfile)), ...common },
  ])
  return slimProfile
}

const profile = await seedAuthCookies(ROLES[ROLE], PASSWORD)
console.log(
  `authenticated as ${ROLE} (${ROLES[ROLE]})` +
    (profile && profile.roleCode ? ` roleCode=${profile.roleCode}` : "") +
    (profile && profile.role && profile.role.name ? ` role="${profile.role.name}"` : ""),
)

// ---- dump -----------------------------------------------------------------
const summary = []

for (const id of pageIds) {
  const errors = []
  const failed = []
  /** Every /api/ response this page made: url, status, and parsed body. */
  const apiCalls = []

  const onConsole = (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 400))
  }
  // Next.js aborts its own RSC prefetches on navigation (…?_rsc=…). Those are
  // routine and would otherwise drown out the failures that matter, so only
  // real request failures are recorded.
  const onFailed = (r) => {
    const url = r.url()
    if (/[?&]_rsc=/.test(url)) return
    failed.push(`${r.failure()?.errorText || "failed"} ${url.slice(0, 160)}`)
  }
  const onResponse = async (r) => {
    const url = r.url()
    if (!url.includes("/api/")) return
    if (r.status() >= 400) failed.push(`${r.status()} ${url.slice(0, 160)}`)
    let body = null
    try {
      const text = await r.text()
      try {
        body = JSON.parse(text)
      } catch {
        body = text.slice(0, 2000)
      }
    } catch {
      body = "(body unavailable)"
    }
    apiCalls.push({ url: url.replace(/^https?:\/\/[^/]+/, ""), status: r.status(), body })
  }

  page.on("console", onConsole)
  page.on("requestfailed", onFailed)
  page.on("response", onResponse)

  const url = BASE + PAGES[id]
  let resp = null
  let mounted = false

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 })
      await page.waitForSelector("#content", { timeout: 45000 })
      mounted = true
      break
    } catch {
      if (attempt < 3) await page.waitForTimeout(5000 * attempt)
    }
  }

  // The runtime paints synchronously; the host's loaders then resolve and
  // hydrate. Settle so the dump reflects hydrated state, not first paint.
  await page.waitForTimeout(4000)

  const data = await page.evaluate(() => {
    const w = document.querySelector("#content")
    const text = w ? w.innerText.replace(/\n{3,}/g, "\n\n") : document.body.innerText.slice(0, 4000)
    const nums = Array.from(
      new Set(
        (text.match(/[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:%|pp|hrs?|days?|min)?/g) || []).map((s) =>
          s.trim(),
        ),
      ),
    )
    const nav = Array.from(document.querySelectorAll("#nav .nav-item")).map((b) => ({
      page: b.getAttribute("data-page"),
      label: (b.querySelector(".nav-label") || {}).innerText || null,
      badge: (b.querySelector(".nav-count") || {}).innerText || null,
    }))
    const actions = Array.from(new Set(
      Array.from(document.querySelectorAll("#content [data-action]")).map((e) =>
        e.getAttribute("data-action"),
      ),
    ))
    return {
      title: (document.querySelector("#content h1") || document.querySelector("#content h2") || {})
        .innerText || null,
      text,
      nums,
      nav,
      actions,
    }
  })

  page.off("console", onConsole)
  page.off("requestfailed", onFailed)
  page.off("response", onResponse)

  const file = path.join(OUT, `${ROLE}__${id}.txt`)
  const body = [
    `PAGE      ${id}`,
    `URL       ${url}`,
    `STATUS    ${resp ? resp.status() : "?"}${mounted ? "" : "   (NO #content — page did not mount)"}`,
    `ROLE      ${ROLE} (${ROLES[ROLE]})`,
    `TITLE     ${data.title || "(none)"}`,
    "",
    `CONSOLE ERRORS (${errors.length})`,
    ...errors.map((e) => "  " + e),
    "",
    `FAILED / 4xx REQUESTS (${failed.length})`,
    ...failed.map((f) => "  " + f),
    "",
    `API CALLS (${apiCalls.length})`,
    ...apiCalls.map((c) => `  ${String(c.status).padEnd(4)} ${c.url}`),
    "",
    `SIDEBAR BADGES`,
    ...data.nav.filter((n) => n.badge).map((n) => `  ${n.page}: ${n.badge}`),
    "",
    `ACTIONS PRESENT (${data.actions.length})`,
    "  " + data.actions.join("  |  "),
    "",
    `NUMBERS ON SCREEN (${data.nums.length})`,
    "  " + data.nums.join("  |  "),
    "",
    "--------------------------------- VISIBLE TEXT ---------------------------------",
    data.text,
  ].join("\n")
  fs.writeFileSync(file, body, "utf8")

  // The JSON carries the API payloads; payroll-trace-numbers.mjs reads these.
  fs.writeFileSync(
    file.replace(/\.txt$/, ".json"),
    JSON.stringify({ id, url, role: ROLE, ...data, errors, failed, apiCalls }, null, 2),
    "utf8",
  )

  summary.push({
    id,
    nums: data.nums.length,
    errors: errors.length,
    failed: failed.length,
    api: apiCalls.length,
    mounted,
  })
  console.log(
    `  ${id.padEnd(12)} numbers=${String(data.nums.length).padStart(3)}  api=${String(apiCalls.length).padStart(2)}  consoleErr=${errors.length}  failedReq=${failed.length}` +
      (mounted ? "" : "  !! NOT MOUNTED"),
  )
}

await browser.close()

const bad = summary.filter((s) => !s.mounted || s.errors > 0)
console.log(`\ndumps in ${OUT}`)
if (bad.length) {
  console.log(`pages with problems: ${bad.map((b) => b.id).join(", ")}`)
}
