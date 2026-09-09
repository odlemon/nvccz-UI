/**
 * Accounting (accounting-v52) module — headless page dump.
 *
 * Sibling of `scripts/perf-page-dump.mjs`, and written for the same reason: the only reliable
 * oracle for a vendored `matanho-*-runtime.js` module is the rendered DOM, not the source.
 *
 * Two differences from the performance dumper, both structural rather than stylistic:
 *   - accounting-v52 mounts its page into `#main` (see `components/accounting-v52-mock/shell.ts`),
 *     not `#workspace`.
 *   - it has no `window.__PERF_LIVE__`-style bridge global. Live data is fetched React-side
 *     (`lib/accounting-v52/live-loaders.ts` -> `runtime.hydrate()`), so there are no scope
 *     counters to report; the console/network capture and the on-screen number list carry the
 *     signal instead.
 *
 * USAGE
 *   node scripts/accounting-page-dump.mjs --pages=timesheets,journals
 *   node scripts/accounting-page-dump.mjs --pages=all --role=hr --out=.acc-dumps
 *
 * OPTIONS mirror perf-page-dump.mjs: --pages --role --base --out --json --headed
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

/** page id -> route. Mirrors lib/accounting-v52-mock/nav.ts (AC52_PAGE_TO_PATH). */
const PAGES = {
  overview: "/accounting",
  ceo: "/accounting/ceo",
  approvals: "/accounting/approvals",
  close: "/accounting/close",
  ledger: "/accounting/general-ledger",
  journals: "/accounting/journals",
  cash: "/accounting/cash-book",
  reconciliation: "/accounting/bank-reconciliation",
  payables: "/accounting/payables",
  receivables: "/accounting/receivables",
  expenses: "/accounting/expenses",
  timesheets: "/accounting/timesheets",
  recurring: "/accounting/recurring",
  inventory: "/accounting/inventory",
  assets: "/accounting/assets",
  investments: "/accounting/short-term-investments",
  reports: "/accounting/reports",
  trialbalance: "/accounting/trial-balance",
  compliance: "/accounting/tax",
  fx: "/accounting/fx-revaluation",
  consolidation: "/accounting/consolidation",
  coa: "/accounting/chart-governance",
  vault: "/accounting/vault",
  audit: "/accounting/audit",
  access: "/accounting/access",
  integrations: "/accounting/integrations",
  settings: "/accounting/settings",
}

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const flag = (name) => process.argv.includes(`--${name}`)

const BASE = arg("base", process.env.PERF_BASE || "http://localhost:3001")
const ROLE = arg("role", "sysadmin")
const OUT = path.resolve(arg("out", ".acc-dumps"))
const WANT = arg("pages", "all")
const pageIds = WANT === "all" ? Object.keys(PAGES) : WANT.split(",").map((s) => s.trim()).filter(Boolean)

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

// ---- auth ---------------------------------------------------------------------------------
// Same cookie-seeding approach as perf-page-dump.mjs — driving the login form races hydration.
async function seedAuthCookies(email, password) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"

  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const login = await loginRes.json().catch(() => ({}))
  const token = login.token || (login.data && login.data.token)
  if (!token) throw new Error(`API login failed for ${email}: ${loginRes.status} ${JSON.stringify(login).slice(0, 200)}`)

  const user = login.user || (login.data && login.data.user) || {}
  let profile = user
  if (user.id) {
    const profRes = await fetch(`${apiBase}/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const prof = await profRes.json().catch(() => ({}))
    if (prof && prof.data) profile = prof.data
  }

  const { hostname } = new URL(BASE)
  const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
  await context.addCookies([
    { name: "token", value: token, ...common },
    { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
    { name: "userProfile", value: encodeURIComponent(JSON.stringify(profile)), ...common },
  ])
  return profile
}

const profile = await seedAuthCookies(ROLES[ROLE], PASSWORD)
console.log(
  `authenticated as ${ROLE} (${ROLES[ROLE]})` +
    (profile && profile.roleCode ? ` roleCode=${profile.roleCode}` : "") +
    (profile && profile.role && profile.role.name ? ` role="${profile.role.name}"` : ""),
)

// ---- dump ------------------------------------------------------------------------------
const summary = []

for (const id of pageIds) {
  const errors = []
  const failed = []
  const onConsole = (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 400))
  }
  const onFailed = (r) => failed.push(`${r.failure()?.errorText || "failed"} ${r.url().slice(0, 160)}`)
  const onResponse = (r) => {
    if (r.status() >= 400 && r.url().includes("/api/")) failed.push(`${r.status()} ${r.url().slice(0, 160)}`)
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
      await page.waitForSelector("#main", { timeout: 45000 })
      mounted = true
      break
    } catch {
      if (attempt < 3) await page.waitForTimeout(5000 * attempt)
    }
  }

  // The runtime paints synchronously, then the React host's scope fetches resolve and hydrate.
  // Settle so the dump reflects the hydrated state rather than the first paint.
  await page.waitForTimeout(3000)

  const data = await page.evaluate(() => {
    const w = document.querySelector("#main")
    const text = w ? w.innerText.replace(/\n{3,}/g, "\n\n") : document.body.innerText.slice(0, 4000)
    const nums = Array.from(
      new Set((text.match(/[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:%|pp|hrs?|days?|min)?/g) || []).map((s) => s.trim())),
    )
    return {
      title: (document.querySelector("#main h1") || document.querySelector("#main h2") || {}).innerText || null,
      text,
      nums,
    }
  })

  page.off("console", onConsole)
  page.off("requestfailed", onFailed)
  page.off("response", onResponse)

  const file = path.join(OUT, `${ROLE}__${id}.txt`)
  const body = [
    `PAGE      ${id}`,
    `URL       ${url}`,
    `STATUS    ${resp ? resp.status() : "?"}${mounted ? "" : "   (NO #main — page did not mount)"}`,
    `ROLE      ${ROLE} (${ROLES[ROLE]})`,
    `TITLE     ${data.title || "(none)"}`,
    "",
    `CONSOLE ERRORS (${errors.length})`,
    ...errors.map((e) => "  " + e),
    "",
    `FAILED / 4xx REQUESTS (${failed.length})`,
    ...failed.map((f) => "  " + f),
    "",
    `NUMBERS ON SCREEN (${data.nums.length})`,
    "  " + data.nums.join("  |  "),
    "",
    "--------------------------------- VISIBLE TEXT ---------------------------------",
    data.text,
  ].join("\n")
  fs.writeFileSync(file, body, "utf8")

  if (flag("json")) {
    fs.writeFileSync(file.replace(/\.txt$/, ".json"), JSON.stringify({ id, url, ...data, errors, failed }, null, 2), "utf8")
  }

  summary.push({ id, nums: data.nums.length, errors: errors.length, failed: failed.length, mounted })
  console.log(
    `  ${id.padEnd(16)} numbers=${String(data.nums.length).padStart(3)}  consoleErr=${errors.length}  failedReq=${failed.length}` +
      (mounted ? "" : "  !! NOT MOUNTED"),
  )
}

await browser.close()
console.log(`\ndumps in ${OUT}`)
