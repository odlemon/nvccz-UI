/**
 * Fundraising — headless dump of every screen.
 *
 * For each of the 20 fundraising screens this captures:
 *   - the rendered text of <main>
 *   - every /api/... request the screen made, with status
 *   - console errors and failed requests seen during load
 *   - whether the screen rendered real content or an empty shell
 *
 * It answers "does this screen load, call the API, and show something" — it does NOT
 * prove the numbers came from those calls. Use fundraising-trace-numbers.mjs for that.
 *
 * USAGE
 *   node scripts/fundraising-page-dump.mjs
 *   node scripts/fundraising-page-dump.mjs --role=exec --pages=dashboard,pipeline
 *   node scripts/fundraising-page-dump.mjs --headed
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

const PAGES = {
  dashboard: "/fundraising",
  campaigns: "/fundraising/campaigns",
  investors: "/fundraising/investors",
  contacts: "/fundraising/contacts",
  pipeline: "/fundraising/pipeline",
  mandates: "/fundraising/mandates",
  "due-diligence": "/fundraising/due-diligence",
  "data-rooms": "/fundraising/data-rooms",
  communications: "/fundraising/communications",
  meetings: "/fundraising/meetings",
  documents: "/fundraising/documents",
  agreements: "/fundraising/agreements",
  commitments: "/fundraising/commitments",
  onboarding: "/fundraising/onboarding",
  "placement-agents": "/fundraising/placement-agents",
  forecasts: "/fundraising/forecasts",
  reports: "/fundraising/reports",
  approvals: "/fundraising/approvals",
  audit: "/fundraising/audit",
  settings: "/fundraising/settings",
}

const arg = (n, d) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : d
}
const flag = (n) => process.argv.includes(`--${n}`)

const BASE = arg("base", process.env.FR_BASE || "http://localhost:3001")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const ROLE = arg("role", "sysadmin")
const OUT = path.resolve(arg("out", ".fr-dump"))
const WANT = arg("pages", "all")

if (!ROLES[ROLE]) {
  console.error(`unknown --role=${ROLE}. Known: ${Object.keys(ROLES).join(", ")}`)
  process.exit(1)
}
const pageIds = WANT === "all" ? Object.keys(PAGES) : WANT.split(",").map((s) => s.trim()).filter(Boolean)
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

// Authenticate through the API and set the same three cookies the login page sets, rather
// than driving the login form: page.fill succeeds on a not-yet-hydrated input, so filling the
// form proves nothing about whether React is listening. Same approach as perf-page-dump.mjs.
async function seedAuthCookies(email, password) {
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const login = await loginRes.json().catch(() => ({}))
  const token = login.token || (login.data && login.data.token)
  if (!token) throw new Error(`API login failed for ${email}: ${loginRes.status}`)

  const user = login.user || (login.data && login.data.user) || {}
  let profile = user
  if (user.id) {
    const prof = await (
      await fetch(`${API_BASE}/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
    ).json().catch(() => ({}))
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
  `\nFundraising dump — ${BASE} as ${ROLE} (${ROLES[ROLE]})` +
    (profile?.roleCode ? ` roleCode=${profile.roleCode}` : ""),
)

const summary = []

for (const id of pageIds) {
  const errors = []
  const failed = []
  const calls = []

  const onConsole = (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 400))
  }
  const onPageError = (e) => errors.push(`PAGEERROR ${String(e).slice(0, 400)}`)
  const onFailed = (r) => failed.push(`${r.failure()?.errorText || "failed"} ${r.url().slice(0, 160)}`)
  const onResponse = (r) => {
    const u = r.url()
    if (!u.includes("/api/")) return
    const short = u.replace(API_BASE, "").split("?")[0]
    calls.push(`${r.status()} ${short}`)
    if (r.status() >= 400) failed.push(`${r.status()} ${short}`)
  }

  page.on("console", onConsole)
  page.on("pageerror", onPageError)
  page.on("requestfailed", onFailed)
  page.on("response", onResponse)

  let navError = null
  try {
    await page.goto(BASE + PAGES[id], { waitUntil: "domcontentloaded", timeout: 90000 })
    await page.waitForSelector("h1, main", { timeout: 45000 })
  } catch (e) {
    navError = String(e).slice(0, 200)
  }
  await page.waitForTimeout(4500)

  const info = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body
    const text = main.innerText || ""
    return {
      text,
      url: location.pathname,
      rows: document.querySelectorAll("table tbody tr").length,
      buttons: document.querySelectorAll("button").length,
      tablists: document.querySelectorAll('[role="tablist"]').length,
      headings: Array.from(document.querySelectorAll("h1,h2")).map((h) => h.innerText.trim()).slice(0, 12),
    }
  })

  page.off("console", onConsole)
  page.off("pageerror", onPageError)
  page.off("requestfailed", onFailed)
  page.off("response", onResponse)

  const nums = [...new Set((info.text.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((s) => s.replace(/,/g, "")))]
  // An "empty shell" is a page that rendered chrome but no substance: very little text and
  // no table rows. Distinguishing this from a legitimately empty state matters, so both the
  // text length and the row count are reported rather than a single verdict.
  const shell = info.text.trim().length < 400 && info.rows === 0

  fs.writeFileSync(
    path.join(OUT, `${ROLE}__${id}.txt`),
    [
      `PAGE        ${id}   ${PAGES[id]}`,
      `LANDED ON   ${info.url}`,
      `ROLE        ${ROLE} (${ROLES[ROLE]})`,
      navError ? `NAV ERROR   ${navError}` : null,
      `HEADINGS    ${info.headings.join(" | ")}`,
      `TABLE ROWS  ${info.rows}`,
      `BUTTONS     ${info.buttons}`,
      `TABLISTS    ${info.tablists}`,
      `TEXT CHARS  ${info.text.trim().length}`,
      `EMPTY SHELL ${shell ? "YES" : "no"}`,
      "",
      `API CALLS   ${calls.length}`,
      ...calls.map((c) => "  " + c),
      "",
      `CONSOLE ERRORS  ${errors.length}`,
      ...errors.map((e) => "  " + e),
      "",
      `FAILED REQUESTS ${failed.length}`,
      ...failed.map((f) => "  " + f),
      "",
      "--- rendered text ---",
      info.text,
    ].filter(Boolean).join("\n"),
    "utf8",
  )

  summary.push({ id, calls: calls.length, errors: errors.length, failed: failed.length, shell, rows: info.rows })
  console.log(
    `  ${id.padEnd(18)} api=${String(calls.length).padStart(2)} rows=${String(info.rows).padStart(3)}` +
      ` consoleErr=${errors.length} failedReq=${failed.length}${shell ? "  ** EMPTY SHELL **" : ""}` +
      (info.url !== PAGES[id] ? `  ** LANDED ${info.url} **` : ""),
  )
}

await browser.close()

const bad = summary.filter((s) => s.errors || s.failed || s.shell)
console.log(`\ndumps in ${OUT}`)
console.log(
  bad.length
    ? `${bad.length}/${summary.length} screens need attention: ${bad.map((b) => b.id).join(", ")}`
    : `all ${summary.length} screens clean`,
)
