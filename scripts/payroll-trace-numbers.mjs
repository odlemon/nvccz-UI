/**
 * Payroll V6 — trace every rendered number back to an API payload.
 *
 * The page dumper proves a screen renders and calls the API. It does NOT prove
 * the numbers on screen came from those calls: this module shipped with an
 * Employees KPI of '128' and a gross of 264,720 sitting directly above a run
 * table that was already rendering live rows, and the two looked identical.
 * This closes that gap.
 *
 * For each screen it captures the rendered text of `#content` plus the JSON
 * bodies of every /api/payroll call the screen made, then reports which
 * on-screen numbers cannot be found in any payload.
 *
 * An unmatched number is NOT automatically a defect — many are legitimately
 * derived (sums, percentages, counts, rounded money). The point is to produce a
 * short list someone has to explain, rather than eyeballing a dense screen and
 * hoping. Anything on that list is either traced to a derivation or is
 * hardcoded and gets fixed.
 *
 * USAGE
 *   node scripts/payroll-trace-numbers.mjs --role=sysadmin
 *   node scripts/payroll-trace-numbers.mjs --role=hr --pages=overview,employees
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
  overview: "/payroll-v6",
  employees: "/payroll-v6/employees",
  onboarding: "/payroll-v6/onboarding",
  runs: "/payroll-v6/runs",
  inputs: "/payroll-v6/inputs",
  exceptions: "/payroll-v6/exceptions",
  approvals: "/payroll-v6/approvals",
  close: "/payroll-v6/close",
  components: "/payroll-v6/components",
  calendar: "/payroll-v6/calendar",
  tax: "/payroll-v6/tax",
  training: "/payroll-v6/training",
  leave: "/payroll-v6/leave",
  vendors: "/payroll-v6/vendors",
  vault: "/payroll-v6/vault",
  reports: "/payroll-v6/reports",
  audit: "/payroll-v6/audit",
  access: "/payroll-v6/access",
  settings: "/payroll-v6/settings",
  mypay: "/payroll-v6/mypay",
}

const arg = (n, d) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : d
}
const BASE = arg("base", process.env.PAYROLL_BASE || "http://localhost:3001")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const ROLE = arg("role", "sysadmin")
const OUT = path.resolve(arg("out", ".payroll-trace"))
const WANT = arg("pages", "all")
const ids =
  WANT === "all" ? Object.keys(PAGES) : WANT.split(",").map((s) => s.trim()).filter(Boolean)

if (!ROLES[ROLE]) {
  console.error(`unknown --role=${ROLE}. Known: ${Object.keys(ROLES).join(", ")}`)
  process.exit(1)
}

fs.mkdirSync(OUT, { recursive: true })

/**
 * Every numeric token in a payload, plus the roundings a UI legitimately
 * applies, so a formatted figure still matches its source.
 */
function collectNumbers(node, out) {
  if (node === null || node === undefined) return
  if (Array.isArray(node)) return node.forEach((v) => collectNumbers(v, out))
  if (typeof node === "object") return Object.values(node).forEach((v) => collectNumbers(v, out))
  const s = String(node)
  if (s.trim() !== "" && !Number.isNaN(Number(s))) {
    const n = Number(s)
    out.add(String(n))
    out.add(String(Math.round(n)))
    out.add(n.toFixed(2))
    out.add(n.toFixed(1))
    out.add(String(Math.round(n * 100) / 100))
    out.add(String(Math.round(n / 1000)))
    out.add(String(Math.round(n / 1_000_000)))
    out.add((n * 100).toFixed(0)) // fraction rendered as a whole percent
    out.add((n * 100).toFixed(1))
  }
}

/**
 * Totals a payroll screen may legitimately compute from rows it was given:
 * sums and counts over the numeric fields of every array in the payload.
 * Without this, a correct "total gross" column footer scores as untraced.
 */
function addDerivedAggregates(node, out, depth = 0) {
  if (depth > 4 || node === null || typeof node !== "object") return
  if (Array.isArray(node)) {
    out.add(String(node.length))
    const sums = new Map()
    for (const row of node) {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        for (const [k, v] of Object.entries(row)) {
          const n = Number(v)
          if (Number.isFinite(n) && String(v).trim() !== "") {
            sums.set(k, (sums.get(k) ?? 0) + n)
          }
        }
      }
      addDerivedAggregates(row, out, depth + 1)
    }
    for (const total of sums.values()) {
      out.add(String(total))
      out.add(total.toFixed(2))
      out.add(String(Math.round(total)))
    }
    return
  }
  for (const v of Object.values(node)) addDerivedAggregates(v, out, depth + 1)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } })

const loginRes = await fetch(`${API_BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: ROLES[ROLE], password: PASSWORD }),
})
const login = await loginRes.json()
if (!login.token) {
  console.error(`login failed for ${ROLES[ROLE]}: ${JSON.stringify(login).slice(0, 200)}`)
  process.exit(1)
}
const user = login.user || {}

// Keep the profile cookie small: the full /users/:id payload is ~5.7KB, over
// the 4KB cookie limit, and addCookies rejects it outright.
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

const failures = []
const report = []

for (const id of ids) {
  const payloadNumbers = new Set()
  const endpoints = []

  const onResponse = async (r) => {
    if (!r.url().includes("/api/payroll")) return
    endpoints.push(r.url().replace(API_BASE, "").split("?")[0])
    try {
      const j = await r.json()
      const body = j?.data ?? j
      collectNumbers(body, payloadNumbers)
      addDerivedAggregates(body, payloadNumbers)
    } catch {
      /* non-JSON responses carry no numbers to match */
    }
  }
  page.on("response", onResponse)

  try {
    await page.goto(BASE + PAGES[id], { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector("#content", { timeout: 60000 })
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
  } catch {}
  await page.waitForTimeout(3000)

  let text = await page.evaluate(
    () => (document.querySelector("#content") || document.body).innerText,
  )

  // A cold `next dev` compiles each route on first hit, which can outlast the
  // settle: the screen is then captured before it has issued a single request
  // and scores "0 numbers, 0 untraced" — a pass, for a page that never loaded.
  // Once compiled a reload is fast, so retry once and believe the second run.
  if (endpoints.length === 0) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {})
    await page.waitForSelector("#content", { timeout: 60000 }).catch(() => {})
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(3500)
    text = await page.evaluate(
      () => (document.querySelector("#content") || document.body).innerText,
    )
  }
  page.off("response", onResponse)

  // Only free-standing numbers, and not the ones inside a date or a clock time. Scanning the raw
  // text mined digits out of record ids — the cuid `cmtu17exj001dunw05vum616a` contributed a
  // phantom "616" to the untraced list — and out of timestamps, which buried the values that
  // actually need explaining. Same fix as scripts/lp-trace-numbers.mjs.
  const scannable = text
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)?/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
  const raw = scannable.match(/(?<![A-Za-z0-9])\d[\d,]*(?:\.\d+)?(?![A-Za-z0-9])/g) || []
  const onScreen = [...new Set(raw.map((s) => s.replace(/,/g, "")))]
  const unmatched = onScreen.filter((s) => {
    const n = Number(s)
    if (!Number.isFinite(n)) return false
    if (n === 0) return false // zero is everywhere and proves nothing
    if (n >= 1900 && n <= 2100 && Number.isInteger(n)) return false // years
    if (Number.isInteger(n) && n <= 31) return false // day-of-month, small counts, axis ticks
    return (
      !payloadNumbers.has(String(n)) &&
      !payloadNumbers.has(n.toFixed(2)) &&
      !payloadNumbers.has(n.toFixed(1))
    )
  })

  const errState =
    /Request failed|Something went wrong|Failed to load|Try Again|Unauthorized/i.exec(text)
  const problems = []
  if (endpoints.length === 0) problems.push("no /api/payroll calls were made")
  if (errState) problems.push(`error state on screen: "${errState[0]}"`)
  if (onScreen.length === 0 && endpoints.length === 0) problems.push("no numbers rendered at all")
  if (problems.length) failures.push({ id, problems })

  fs.writeFileSync(
    path.join(OUT, `${ROLE}__${id}.txt`),
    [
      `PAGE       ${id}`,
      `ROLE       ${ROLE} (${ROLES[ROLE]})`,
      `RESULT     ${problems.length ? "FAILED - " + problems.join("; ") : "rendered"}`,
      `ENDPOINTS  ${endpoints.length}`,
      ...[...new Set(endpoints)].map((e) => "  " + e),
      "",
      `NUMBERS ON SCREEN        ${onScreen.length}`,
      `NOT FOUND IN PAYLOADS    ${unmatched.length}`,
      ...unmatched.map((u) => "  " + u),
      "",
      "--- rendered text ---",
      text,
    ].join("\n"),
    "utf8",
  )

  report.push({ id, endpoints: endpoints.length, numbers: onScreen.length, untraced: unmatched.length, unmatched })
  console.log(
    `  ${id.padEnd(12)} endpoints=${String(endpoints.length).padStart(2)}  numbers=${String(onScreen.length).padStart(3)}  untraced=${String(unmatched.length).padStart(3)}` +
      (unmatched.length ? `  -> ${unmatched.slice(0, 10).join(", ")}` : "") +
      (problems.length ? `  ** FAILED: ${problems.join("; ")}` : ""),
  )
}

await browser.close()

const totalUntraced = report.reduce((s, r) => s + r.untraced, 0)
console.log(`\ntotal untraced across ${ids.length} page(s): ${totalUntraced}`)
if (failures.length) {
  console.log(`${failures.length} page(s) did not render:`)
  for (const x of failures) console.log(`  ${x.id}: ${x.problems.join("; ")}`)
  process.exitCode = 1
}
console.log(`traces in ${OUT}`)
