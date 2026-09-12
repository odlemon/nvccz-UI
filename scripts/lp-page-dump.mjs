/**
 * LP Portal — headless page dump.
 *
 * Third sibling of `perf-page-dump.mjs` / `accounting-page-dump.mjs`, and it exists for the
 * same reason: the rendered DOM is the only trustworthy statement of what a screen shows.
 *
 * Two things differ from the other two portals:
 *   - The LP portal is a SEPARATE deployment on its own port (`npm run dev:lp` -> :3110,
 *     NEXT_PUBLIC_PORTAL=lp, distDir .next-lp). Pointing this at the staff port silently
 *     dumps the staff app instead, so the portal identity is asserted before anything else.
 *   - Login must carry `portal: "lp"`. The API refuses LP accounts on the staff portal
 *     ("LP accounts must use the LP portal.", see src/utils/portalAuth.ts), so the ordinary
 *     staff login body returns 403 here.
 *
 * It also records which /api/lp-portal/* calls each screen makes, which is what tells us
 * whether a screen is on live data or still being served by the mock store.
 *
 * USAGE
 *   node scripts/lp-page-dump.mjs --role=manager
 *   node scripts/lp-page-dump.mjs --pages=dashboard,documents --role=viewer --json
 */
import { chromium } from "playwright"
import fs from "fs"
import path from "path"

/** The three seeded LP accounts, which differ by lpRole (MANAGER vs VIEWER). */
const ROLES = {
  manager: "lp.test@arcus.co.zw",
  signatory: "lp.signatory@example.com",
  viewer: "lp.viewer@example.com",
}
const PASSWORD = "admin123"

/**
 * Current LP screens. /investments is excluded for the same reason as the legacy paths:
 * it is a compatibility redirect map, not a screen. The legacy paths (/ledger, /vault, /reports, /colleagues,
 * /capital-calls, /distributions, /dealing, /messages) are redirect stubs onto these and are
 * deliberately not listed — they are superseded, not part of this module.
 */
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

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const flag = (name) => process.argv.includes(`--${name}`)

const BASE = arg("base", process.env.LP_BASE || "http://localhost:3110")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const ROLE = arg("role", "manager")
const OUT = path.resolve(arg("out", ".lp-dumps"))
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

// ---- assert we are pointed at the LP portal, not the staff app on another port ------------
// A staff build answers /lp-portal by redirecting to the external LP URL; an LP build sends an
// unauthenticated caller to /login. Getting this wrong produces a full dump of the wrong
// application, which is worse than failing outright.
{
  const res = await fetch(`${BASE}/lp-portal`, { redirect: "manual" }).catch(() => null)
  if (!res) {
    console.error(`No server at ${BASE}. Start it with: npm run dev:lp`)
    process.exit(1)
  }
  const loc = res.headers.get("location") || ""
  if (res.status >= 300 && res.status < 400 && !/\/login/.test(loc)) {
    console.error(`${BASE} does not look like the LP portal (redirects to "${loc}").`)
    console.error("Expected a redirect to /login. Is this the staff build? Use: npm run dev:lp")
    process.exit(1)
  }
}

const browser = await chromium.launch({ headless: !flag("headed") })
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(60000)

async function seedAuthCookies(email, password) {
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `portal` is required: the API rejects LP accounts on the staff portal.
    body: JSON.stringify({ email, password, portal: "lp" }),
  })
  const login = await loginRes.json().catch(() => ({}))
  const token = login.token || (login.data && login.data.token)
  if (!token) {
    throw new Error(`LP login failed for ${email}: ${loginRes.status} ${JSON.stringify(login).slice(0, 200)}`)
  }

  const user = login.user || (login.data && login.data.user) || {}
  let profile = user
  if (user.id) {
    const profRes = await fetch(`${API_BASE}/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
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
  return { profile, user }
}

const { user } = await seedAuthCookies(ROLES[ROLE], PASSWORD)
console.log(`authenticated as ${ROLE} (${ROLES[ROLE]}) roleCode=${user.roleCode || "?"}`)

const summary = []

for (const id of pageIds) {
  const errors = []
  const failed = []
  const lpCalls = new Set()
  const onConsole = (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 400))
  }
  const onFailed = (r) => failed.push(`${r.failure()?.errorText || "failed"} ${r.url().slice(0, 160)}`)
  const onResponse = (r) => {
    const u = r.url()
    if (u.includes("/api/lp-portal")) lpCalls.add(`${r.status()} ${u.replace(API_BASE, "").split("?")[0]}`)
    if (r.status() >= 400 && u.includes("/api/")) failed.push(`${r.status()} ${u.slice(0, 160)}`)
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
      await page.waitForSelector("h1, [role=main], main", { timeout: 45000 })
      mounted = true
      break
    } catch {
      if (attempt < 3) await page.waitForTimeout(4000 * attempt)
    }
  }
  await page.waitForTimeout(3500)

  const data = await page.evaluate(() => {
    const root = document.querySelector("main") || document.body
    const text = root.innerText.replace(/\n{3,}/g, "\n\n")
    const nums = Array.from(
      new Set((text.match(/[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:%|x|bps|M|K|B)?/g) || []).map((s) => s.trim())),
    )
    // Controls are the functional surface: each is something a user can do, and therefore
    // something that must eventually reach a real endpoint.
    const controls = Array.from(
      document.querySelectorAll("button, a[href], [role=button], input, select, textarea"),
    )
      .map((el) =>
        (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "")
          .trim()
          .replace(/\s+/g, " "),
      )
      .filter((t) => t && t.length < 60)
    return {
      title: (document.querySelector("h1") || {}).innerText || null,
      landed: location.pathname,
      text,
      nums,
      controls: Array.from(new Set(controls)),
    }
  })

  page.off("console", onConsole)
  page.off("requestfailed", onFailed)
  page.off("response", onResponse)

  const file = path.join(OUT, `${ROLE}__${id}.txt`)
  fs.writeFileSync(
    file,
    [
      `PAGE      ${id}`,
      `URL       ${url}  (landed: ${data.landed})`,
      `STATUS    ${resp ? resp.status() : "?"}${mounted ? "" : "   (DID NOT MOUNT)"}`,
      `ROLE      ${ROLE} (${ROLES[ROLE]})`,
      `H1        ${data.title || "(none)"}`,
      "",
      `LP API CALLS (${lpCalls.size})   <- empty means this screen is still on the mock store`,
      ...Array.from(lpCalls).map((c) => "  " + c),
      "",
      `CONSOLE ERRORS (${errors.length})`,
      ...errors.map((e) => "  " + e),
      "",
      `FAILED / 4xx REQUESTS (${failed.length})`,
      ...failed.map((f) => "  " + f),
      "",
      `CONTROLS (${data.controls.length})`,
      "  " + data.controls.join("  |  "),
      "",
      `NUMBERS ON SCREEN (${data.nums.length})`,
      "  " + data.nums.join("  |  "),
      "",
      "--------------------------------- VISIBLE TEXT ---------------------------------",
      data.text,
    ].join("\n"),
    "utf8",
  )

  if (flag("json")) {
    fs.writeFileSync(
      file.replace(/\.txt$/, ".json"),
      JSON.stringify({ id, url, ...data, lpCalls: [...lpCalls], errors, failed }, null, 2),
      "utf8",
    )
  }

  summary.push({ id, lpCalls: lpCalls.size, controls: data.controls.length, errors: errors.length, failed: failed.length, mounted })
  console.log(
    `  ${id.padEnd(26)} lpApiCalls=${String(lpCalls.size).padStart(2)}  controls=${String(data.controls.length).padStart(3)}  consoleErr=${errors.length}  failedReq=${failed.length}` +
      (mounted ? "" : "  !! NOT MOUNTED"),
  )
}

await browser.close()
console.log(`\ndumps in ${OUT}`)
