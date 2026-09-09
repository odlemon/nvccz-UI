/**
 * Fundraising — trace every rendered number back to an API payload.
 *
 * The page dumper proves a screen renders and calls the API. It does NOT prove the numbers on
 * screen came from those calls: a hardcoded KPI sits happily next to a live one and looks
 * identical. This closes that gap.
 *
 * For each screen it captures both the rendered text and the JSON bodies of every
 * /api/fundraising and /api/investors call the screen made, then reports which on-screen
 * numbers cannot be found in any of those payloads.
 *
 * A number being unmatched is NOT automatically a defect — plenty are legitimately derived
 * (percentages, sums, page indices, formatted/rounded money, dates). The point is to produce a
 * short list a human has to explain, instead of eyeballing a dense screen and hoping. Anything
 * on that list is either traced to a derivation or is hardcoded.
 *
 * USAGE
 *   node scripts/fundraising-trace-numbers.mjs
 *   node scripts/fundraising-trace-numbers.mjs --role=exec --pages=dashboard,commitments
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
const BASE = arg("base", process.env.FR_BASE || "http://localhost:3001")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const ROLE = arg("role", "sysadmin")
const OUT = path.resolve(arg("out", ".fr-trace"))
const WANT = arg("pages", "all")
const ids = WANT === "all" ? Object.keys(PAGES) : WANT.split(",").map((s) => s.trim()).filter(Boolean)

fs.mkdirSync(OUT, { recursive: true })

/**
 * Every numeric token appearing anywhere in a payload, as strings, for membership testing.
 * Prisma serialises Decimal as a string, so String(node) covers both "12000000" and 12000000.
 * The extra forms cover the ways money is commonly displayed: rounded, scaled to millions or
 * thousands, or turned into a whole percent.
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
    out.add(n.toFixed(1))
    out.add(n.toFixed(2))
    out.add(String(Math.round(n * 100) / 100))
    out.add(String(Math.round(n / 1_000)))
    out.add((n / 1_000).toFixed(1))
    out.add((n / 1_000).toFixed(2))
    out.add(String(Math.round(n / 1_000_000)))
    out.add((n / 1_000_000).toFixed(1))
    out.add((n / 1_000_000).toFixed(2))
    out.add((n * 100).toFixed(0))
    out.add((n * 100).toFixed(1))
    out.add(String(Math.round(n * 100)))
  }
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
const token = login.token || login?.data?.token
if (!token) throw new Error(`API login failed for ${ROLES[ROLE]}`)
const user = login.user || login?.data?.user || {}
let profile = user
if (user.id) {
  const p = await (
    await fetch(`${API_BASE}/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
  ).json().catch(() => ({}))
  if (p?.data) profile = p.data
}
const { hostname } = new URL(BASE)
const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
await context.addCookies([
  { name: "token", value: token, ...common },
  { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
  { name: "userProfile", value: encodeURIComponent(JSON.stringify(profile)), ...common },
])

const page = await context.newPage()
page.setDefaultTimeout(60000)

console.log(`\nFundraising number trace — ${BASE} as ${ROLE}\n`)
const summary = []

for (const id of ids) {
  const payloadNumbers = new Set()
  const endpoints = []
  const onResponse = async (r) => {
    const u = r.url()
    if (!u.includes("/api/fundraising") && !u.includes("/api/investors")) return
    endpoints.push(`${r.status()} ${u.replace(API_BASE, "").split("?")[0]}`)
    try {
      const j = await r.json()
      collectNumbers(j.data ?? j, payloadNumbers)
    } catch {}
  }
  page.on("response", onResponse)

  try {
    await page.goto(BASE + PAGES[id], { waitUntil: "domcontentloaded", timeout: 90000 })
    await page.waitForSelector("h1, main", { timeout: 45000 })
  } catch {}
  await page.waitForTimeout(4500)

  const text = await page.evaluate(() => (document.querySelector("main") || document.body).innerText)
  page.off("response", onResponse)

  // Strip separators so "1,250,000.00" tests as 1250000. Dates and years are excluded up
  // front: they are not the kind of number this is looking for.
  const raw = text.match(/\d[\d,]*(?:\.\d+)?/g) || []
  const onScreen = [...new Set(raw.map((s) => s.replace(/,/g, "")))]
  const unmatched = onScreen.filter((s) => {
    const n = Number(s)
    if (!Number.isFinite(n)) return false
    if (n === 0) return false                                        // zero proves nothing
    if (n >= 1900 && n <= 2100 && Number.isInteger(n)) return false  // years
    if (Number.isInteger(n) && n <= 31) return false                 // day-of-month, small counts
    return !payloadNumbers.has(String(n)) && !payloadNumbers.has(n.toFixed(2))
  })

  fs.writeFileSync(
    path.join(OUT, `${ROLE}__${id}.txt`),
    [
      `PAGE       ${id}`,
      `ROLE       ${ROLE}`,
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
  summary.push({ id, untraced: unmatched.length })
  console.log(
    `  ${id.padEnd(18)} endpoints=${String(endpoints.length).padStart(2)}  numbers=${String(onScreen.length).padStart(3)}` +
      `  untraced=${unmatched.length}${unmatched.length ? "  -> " + unmatched.slice(0, 10).join(", ") : ""}`,
  )
}

await browser.close()
const dirty = summary.filter((s) => s.untraced)
console.log(`\ntraces in ${OUT}`)
console.log(
  dirty.length
    ? `${dirty.length}/${summary.length} screens have untraced numbers to explain`
    : `all ${summary.length} screens fully traced`,
)
