/**
 * LP Portal — trace every rendered number back to an API payload.
 *
 * The page dumper proves a screen renders and calls the API. It does NOT prove the numbers on
 * screen came from those calls: a hardcoded KPI sits happily next to a live one and looks
 * identical. This closes that gap.
 *
 * For each screen it captures both the rendered text and the JSON bodies of every
 * /api/lp-portal call the screen made, then reports which on-screen numbers cannot be found in
 * any of those payloads.
 *
 * A number being unmatched is NOT automatically a defect — plenty are legitimately derived
 * (percentages, sums, page indices, formatted/rounded money, dates). The point is to produce a
 * short list a human has to explain, instead of eyeballing a dense screen and hoping. Anything
 * on that list is either traced to a derivation or is hardcoded.
 *
 * USAGE
 *   node scripts/lp-trace-numbers.mjs --role=manager
 *   node scripts/lp-trace-numbers.mjs --role=manager --pages=dashboard
 */
import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const ROLES = {
  manager: "lp.test@arcus.co.zw",
  signatory: "lp.signatory@example.com",
  viewer: "lp.viewer@example.com",
}
const PASSWORD = "admin123"

const PAGES = {
  dashboard: "/lp-portal",
  performance: "/lp-portal/performance",
  "account-activity": "/lp-portal/account-activity",
  "capital-activity": "/lp-portal/capital-activity",
  "subscriptions-redemptions": "/lp-portal/subscriptions-redemptions",
  documents: "/lp-portal/documents",
  requests: "/lp-portal/requests",
  notices: "/lp-portal/notices",
  organisation: "/lp-portal/organisation",
  settings: "/lp-portal/settings",
}

const arg = (n, d) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : d
}
const BASE = arg("base", process.env.LP_BASE || "http://localhost:3110")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const ROLE = arg("role", "manager")
const OUT = path.resolve(arg("out", ".lp-trace"))
const WANT = arg("pages", "all")
const ids = WANT === "all" ? Object.keys(PAGES) : WANT.split(",").map((s) => s.trim()).filter(Boolean)

fs.mkdirSync(OUT, { recursive: true })

/** Every numeric token appearing anywhere in a payload, as strings, for membership testing. */
function collectNumbers(node, out) {
  if (node === null || node === undefined) return
  if (Array.isArray(node)) return node.forEach((v) => collectNumbers(v, out))
  if (typeof node === "object") return Object.values(node).forEach((v) => collectNumbers(v, out))
  const s = String(node)
  if (s.trim() !== "" && !Number.isNaN(Number(s))) {
    const n = Number(s)
    out.add(String(n))
    // money is commonly shown rounded, scaled to millions, or as a whole percent
    out.add(String(Math.round(n)))
    out.add(n.toFixed(2))
    out.add(String(Math.round(n * 100) / 100))
    out.add(String(Math.round(n / 1_000_000)))
    out.add((n / 1_000_000).toFixed(2))
    out.add((n * 100).toFixed(1))
    out.add(String(Math.round(n * 100)))
  }
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1500, height: 1100 } })

const login = await (
  await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ROLES[ROLE], password: PASSWORD, portal: "lp" }),
  })
).json()
const user = login.user || {}
let profile = user
if (user.id) {
  const p = await (await fetch(`${API_BASE}/users/${user.id}`, { headers: { Authorization: `Bearer ${login.token}` } })).json().catch(() => ({}))
  if (p?.data) profile = p.data
}
const { hostname } = new URL(BASE)
const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
await context.addCookies([
  { name: "token", value: login.token, ...common },
  { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
  { name: "userProfile", value: encodeURIComponent(JSON.stringify(profile)), ...common },
])

const page = await context.newPage()
page.setDefaultTimeout(60000)

/** Pages that did not actually render; see where this is populated below. */
const failures = []

for (const id of ids) {
  const payloadNumbers = new Set()
  const endpoints = []
  const onResponse = async (r) => {
    if (!r.url().includes("/api/lp-portal")) return
    endpoints.push(r.url().replace(API_BASE, "").split("?")[0])
    try {
      const j = await r.json()
      collectNumbers(j.data ?? j, payloadNumbers)
    } catch {}
  }
  page.on("response", onResponse)

  try {
    await page.goto(BASE + PAGES[id], { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector("h1, main", { timeout: 60000 })
    // A cold `next dev` dist dir compiles each route on first hit, which on this codebase runs
    // from 9 to 50 seconds. A flat settle timer expires long before the first fetch is even
    // issued, and the screen is then scored as "0 numbers, 0 untraced" — a pass, for a page that
    // never loaded. So wait for the screen's own traffic to arrive and go quiet instead.
    await page.waitForFunction(
      () => !document.body.innerText.match(/Loading|Skeleton/i),
      { timeout: 60000 },
    ).catch(() => {})
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
  } catch {}
  await page.waitForTimeout(2500)

  let text = await page.evaluate(() => (document.querySelector("main") || document.body).innerText)

  // A route compiling for the first time can still be mid-build when the settle expires, so the
  // screen is captured before it has issued a single request. That is indistinguishable in the
  // output from a screen that is genuinely broken, and it made the same page pass and fail on
  // consecutive runs. Once the route is compiled a reload is fast, so retry once and believe the
  // second attempt.
  if (endpoints.length === 0) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {})
    await page.waitForSelector("h1, main", { timeout: 60000 }).catch(() => {})
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(3000)
    text = await page.evaluate(() => (document.querySelector("main") || document.body).innerText)
  }
  page.off("response", onResponse)

  // Strip separators so "1,250,000.00" tests as 1250000. Dates and years are excluded up front:
  // they are not the kind of number this is looking for.
  // Only free-standing numbers, and not the ones inside a date or a clock time. Without the
  // letter guards this mined digits out of record ids - a cuid like `cmtmb6qa9000hunq81c92cnd9`
  // yielded 9000, 81 and 92 - and without stripping timestamps first, "Sep 4, 2026, 3:58 AM"
  // contributed a phantom 58 to four different screens. Both classes are noise that buries the
  // handful of values actually worth explaining.
  const scannable = text
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)?/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
  const raw = scannable.match(/(?<![A-Za-z0-9])\d[\d,]*(?:\.\d+)?(?![A-Za-z0-9])/g) || []
  const onScreen = [...new Set(raw.map((s) => s.replace(/,/g, "")))]
  const unmatched = onScreen.filter((s) => {
    const n = Number(s)
    if (!Number.isFinite(n)) return false
    if (n === 0) return false                    // zero is everywhere and proves nothing
    if (n >= 1900 && n <= 2100 && Number.isInteger(n)) return false   // years
    if (Number.isInteger(n) && n <= 31) return false                  // day-of-month, counts, page nums
    return !payloadNumbers.has(String(n)) && !payloadNumbers.has(n.toFixed(2))
  })

  // A page that rendered nothing produces "0 numbers on screen, 0 untraced", which reads as a
  // clean pass and is the exact opposite of one. Anything that did not actually render is called
  // out as a failure here instead of being allowed to score green by being empty.
  const errState = /Request failed|Something went wrong|Failed to load|Try Again|Unauthorized/i.exec(text)
  const problems = []
  if (endpoints.length === 0) problems.push("no /api/lp-portal calls were made")
  if (errState) problems.push(`error state on screen: "${errState[0]}"`)
  // Not every screen carries numbers (Settings legitimately does not), so an empty number list is
  // only evidence of a failure when the screen also fetched nothing.
  if (onScreen.length === 0 && endpoints.length === 0) problems.push("no numbers rendered at all")
  if (problems.length) failures.push({ id, problems })

  fs.writeFileSync(
    path.join(OUT, `${ROLE}__${id}.txt`),
    [
      `PAGE       ${id}`,
      `ROLE       ${ROLE}`,
      `RESULT     ${problems.length ? "FAILED - " + problems.join("; ") : "rendered"}`,
      `ENDPOINTS  ${endpoints.length}`,
      ...endpoints.map((e) => "  " + e),
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
  console.log(`  ${id.padEnd(26)} endpoints=${String(endpoints.length).padStart(2)}  numbers=${String(onScreen.length).padStart(3)}  untraced=${unmatched.length}${unmatched.length ? "  -> " + unmatched.slice(0, 8).join(", ") : ""}${problems.length ? "  ** FAILED: " + problems.join("; ") : ""}`)
}

await browser.close()
if (failures.length) {
  console.log(`
${failures.length} of ${ids.length} page(s) did not render:`)
  for (const x of failures) console.log(`  ${x.id}: ${x.problems.join("; ")}`)
  process.exitCode = 1
} else {
  console.log(`
all ${ids.length} page(s) rendered with live endpoint traffic`)
}
console.log(`\ntraces in ${OUT}`)
