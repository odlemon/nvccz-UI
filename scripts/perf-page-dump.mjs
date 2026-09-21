/**
 * Performance module — headless page dump.
 *
 * WHY THIS EXISTS
 * ---------------
 * The vendored `matanho-performance-runtime.js` is 2.2 MB of stacked generations. Each
 * "layer" wraps `window.render` and may take over a page id entirely, so the function you
 * find by grepping is very often NOT the one that renders. Patching a dead layer produces a
 * confident-looking diff and zero visible change — that has already happened twice.
 *
 * The only reliable oracle is the rendered DOM. This script loads a real page in a real
 * browser, as a real logged-in user, and dumps what is actually on screen. Use it BEFORE
 * writing a patch (to find the true anchor strings) and AFTER (to prove the values changed).
 *
 * It is safe to run several copies concurrently: each invocation launches its own browser
 * and writes its own files.
 *
 * USAGE
 *   node scripts/perf-page-dump.mjs --pages=strategy,scorecards
 *   node scripts/perf-page-dump.mjs --pages=all --role=hr --out=.perf-dumps
 *   node scripts/perf-page-dump.mjs --pages=vault --role=employee --json
 *
 * OPTIONS
 *   --pages=a,b,c   page ids (see PAGES below) or `all`. Default: all.
 *   --role=KEY      sysadmin | exec | hr | deptmgr | employee. Default: sysadmin.
 *   --base=URL      dev server. Default $PERF_BASE or http://localhost:3130
 *   --out=DIR       output directory. Default .perf-dumps/
 *   --json          also write the structured JSON next to the text dump.
 *   --headed        show the browser (debugging only).
 *
 * OUTPUT (per page): `<out>/<role>__<page>.txt` containing
 *   - the page path and HTTP status
 *   - console errors and failed requests seen during load
 *   - the workspace's visible text
 *   - every number-like token found in the workspace, deduped
 *
 * The number list is the point: a number in there that no endpoint can produce is a
 * fabricated value and must be replaced with an em dash by a patch in scripts/perf-patches/.
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

/** page id -> route. Mirrors lib/performance-v22-mock/nav.ts. */
const PAGES = {
  dashboard: "/performance",
  strategy: "/performance/strategy",
  themes: "/performance/themes",
  risks: "/performance/risks",
  scorecards: "/performance/scorecards",
  objectives: "/performance/objectives",
  tasks: "/performance/tasks",
  contracts: "/performance/contracts",
  reviews: "/performance/reviews",
  corrective: "/performance/corrective",
  reports: "/performance/reports",
  vault: "/performance/vault",
  alerts: "/performance/alerts",
  access: "/performance/access",
  departments: "/performance/departments",
  integrations: "/performance/integrations",
  kpiAnalytics: "/performance/kpi-analytics",
  kpiManagement: "/performance/kpi-management",
  bscPillars: "/performance/bsc-pillars",
  performanceReports: "/performance/performance-reports",
  settings: "/performance/settings",
  timesheets: "/performance/timesheets",
}

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const flag = (name) => process.argv.includes(`--${name}`)

const BASE = arg("base", process.env.PERF_BASE || "http://localhost:3130")
const ROLE = arg("role", "sysadmin")
const OUT = path.resolve(arg("out", ".perf-dumps"))
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
//
// Authenticate through the API and set the same three cookies the login page sets, rather
// than driving the login form.
//
// Why: `page.fill` succeeds on a NOT-yet-hydrated input, so filling the form proves nothing
// about whether React is listening. Clicking Sign in before hydration runs the form's native
// submit (`action="#"`), which makes no request, shows no error, and just leaves you on
// /login. Under load — several of these running at once against one dev server — hydration
// can take long enough that this happens every time. Cookies remove the race entirely.
//
// The shapes below mirror `lib/store/slices/authSlice.ts`: `token` raw, `user` and
// `userProfile` as URI-encoded JSON. `userProfile` is what `access.ts` reads to decide the
// user's real tier, so it must be the full profile from `GET /users/:id`, not the login
// payload's trimmed user object.
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
  let workspaceFound = false

  // Retry the mount. The dev server recompiles the 2.2 MB runtime whenever it is patched, and
  // a navigation that lands mid-recompile aborts its RSC fetch and never mounts. That is a
  // build-timing artefact, not a page defect, and reporting it as an empty page would be a
  // false negative — so try again rather than record a blank dump.
  for (let mountAttempt = 1; mountAttempt <= 3; mountAttempt++) {
    try {
      resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 })
      await page.waitForSelector("#workspace", { timeout: 45000 })
      workspaceFound = true
      break
    } catch {
      // Includes the navigation itself timing out, which happens when several of these run
      // against one dev server while it is recompiling. Back off and try again.
      if (mountAttempt < 3) await page.waitForTimeout(5000 * mountAttempt)
    }
  }

  // The runtime renders synchronously, then the host's live-data fetch resolves and triggers
  // a second render. Settle so the dump reflects the POST-live-data state, not the first paint.
  await page.waitForTimeout(2500)

  const data = await page.evaluate(() => {
    const w = document.querySelector("#workspace")
    const text = w ? w.innerText.replace(/\n{3,}/g, "\n\n") : document.body.innerText.slice(0, 4000)
    // Number-like tokens: percentages, decimals, thousands, plain integers, currency.
    const nums = Array.from(
      new Set((text.match(/[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:%|pp|hrs?|days?|min)?/g) || []).map((s) => s.trim())),
    )
    const live = window.__PERF_LIVE__
    const scopes = live && live.data
      ? Object.fromEntries(
          Object.entries(live.data).map(([k, v]) => [
            k,
            v && v.error ? `ERROR: ${v.error}` : Array.isArray(v && v.data) ? v.data.length : v && v.data ? "object" : "null",
          ]),
        )
      : null
    return {
      title: (document.querySelector("#workspace h1") || {}).innerText || null,
      bridgeReady: !!(live && live.ready),
      scopes,
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
    `STATUS    ${resp ? resp.status() : "?"}${workspaceFound ? "" : "   (NO #workspace — page did not mount)"}`,
    `ROLE      ${ROLE} (${ROLES[ROLE]})`,
    `H1        ${data.title || "(none)"}`,
    `BRIDGE    ready=${data.bridgeReady}`,
    data.scopes ? `SCOPES    ${JSON.stringify(data.scopes)}` : "SCOPES    (bridge absent)",
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

  summary.push({ id, nums: data.nums.length, errors: errors.length, failed: failed.length, mounted: workspaceFound })
  console.log(
    `  ${id.padEnd(20)} numbers=${String(data.nums.length).padStart(3)}  consoleErr=${errors.length}  failedReq=${failed.length}` +
      (workspaceFound ? "" : "  !! NOT MOUNTED"),
  )
}

await browser.close()
console.log(`\ndumps in ${OUT}`)
