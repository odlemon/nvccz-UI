/**
 * Does the payroll module show vendored demo content during normal operation?
 *
 * `matanho-payroll-runtime.js` is an auto-extracted client port and ships with
 * its own demo dataset. `lib/payroll-v6/live-loaders.ts` fetches real data and
 * the bridge overlays it onto specific call sites. Anything the bridge does not
 * claim keeps rendering the vendored fixtures — and a fixture is indistinguishable
 * from live data to whoever is reading the screen. This repo has a documented
 * history of exactly that ("hardcoded values masquerading as live data").
 *
 * String presence alone is not evidence. "Anti-Money Laundering" is in the
 * runtime AND is a real course in the database; "Chipo Ndlovu" is a fixture name
 * AND a real employee. So each screen is judged on a comparison instead:
 *
 *   fixtureOnly   in the runtime source, and NOT in the live API response
 *   live          in the live API response
 *
 * A screen is dirty when a fixtureOnly value is on it. A screen that shows live
 * values and no fixtureOnly values is wired. Both are reported, because
 * "shows neither" means the markers are stale and the result means nothing.
 *
 * The API is left healthy throughout: this is the product on a normal day.
 *
 * Run:  node scripts/_uat/payroll-fixture-probe.mjs
 * Exit: 0 = no vendored demo content on screen, 1 = at least one screen shows it
 */
import { readFileSync } from "node:fs"
import { chromium } from "playwright"
import { MODULES, seedAuth, API, PASSWORD } from "./_routes.mjs"

const RUNTIME = "components/payroll-v6-mock/matanho-payroll-runtime.js"
const runtimeSrc = readFileSync(RUNTIME, "utf8")
const mod = MODULES.find((m) => m.id === "payroll")

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: mod.user, password: PASSWORD, portal: "staff" }),
}).then((r) => r.json())
const token = login.token || login?.data?.token
if (!token) throw new Error("login failed")

const apiText = async (path) => {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  return r.ok ? JSON.stringify(await r.json()) : ""
}

/**
 * `endpoint` is the source live-loaders reads for this screen, or null when the
 * screen has no backing source at all — which is itself the finding.
 */
const SCREENS = [
  {
    route: "/payroll/access",
    endpoint: null,
    // "Chipo Ndlovu" is deliberately NOT a marker. They are a real employee, but
    // the API carries firstName and lastName as separate fields, so the full name
    // never appears contiguously in the JSON and a substring test misfiles them as
    // fixture-only. The four names below are absent from the employee list
    // entirely, in any arrangement.
    candidates: ["Tariro Moyo", "Precious Ncube", "Kudzai Maseko", "Tawanda Chirenje"],
    liveProbe: "/payroll/employees",
  },
  {
    route: "/payroll/vault",
    endpoint: null,
    candidates: ["June 2026 Payroll Control Pack", "DOC-001"],
  },
  {
    route: "/payroll/training",
    endpoint: "/payroll/compliance/courses",
    candidates: ["Anti-Money Laundering", "94.5%", "Occupational Safety", "Code of Conduct"],
  },
  {
    route: "/payroll/calendar",
    endpoint: "/payroll/pay-groups",
    candidates: ["Jul 2026", "Monthly Staff", "September 2026"],
  },
  {
    route: "/payroll/components",
    endpoint: "/payroll/allowance-types",
    candidates: ["208,640", "Housing Allowance", "Basic Salary"],
  },
  {
    route: "/payroll/tax",
    endpoint: "/payroll/tax-rules",
    candidates: ["ZW-PAYE-2026.06"],
  },
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await seedAuth(context, mod.base, mod.user, mod.portal)
const page = await context.newPage()
page.setDefaultTimeout(90000)

let dirty = 0
for (const screen of SCREENS) {
  const liveBlob = screen.endpoint
    ? await apiText(screen.endpoint)
    : screen.liveProbe
      ? await apiText(screen.liveProbe)
      : ""

  const fixtureOnly = screen.candidates.filter((c) => runtimeSrc.includes(c) && !liveBlob.includes(c))
  const liveValues = screen.candidates.filter((c) => liveBlob.includes(c))

  await page.goto(mod.base + screen.route, { waitUntil: "domcontentloaded" })
  await page
    .waitForFunction(() => (document.body.innerText || "").trim().length > 200, null, { timeout: 40000 })
    .catch(() => {})
  await page.waitForTimeout(2500)
  const text = await page.evaluate(() => {
    const m = document.querySelector("main") || document.body
    return (m.innerText || "").replace(/\s+/g, " ")
  })

  const shownFixture = fixtureOnly.filter((c) => text.includes(c))
  const shownLive = liveValues.filter((c) => text.includes(c))

  let verdict
  if (shownFixture.length) {
    verdict = "FIXTURE"
    dirty += 1
  } else if (shownLive.length) verdict = "live   "
  else verdict = "unknown"

  console.log(`${verdict}  ${screen.route.padEnd(22)} ${screen.endpoint ?? "(no backing source in live-loaders)"}`)
  if (shownFixture.length) console.log(`         on screen, not in the API: ${shownFixture.join(", ")}`)
  if (shownLive.length) console.log(`         on screen, from the API:     ${shownLive.join(", ")}`)
  if (verdict === "unknown")
    console.log(`         neither — markers are stale, this row proves nothing`)
}

await browser.close()
console.log(`\n${SCREENS.length} screens checked, ${dirty} showing values that exist only in the vendored runtime`)
process.exit(dirty ? 1 : 0)
