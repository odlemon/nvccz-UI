/**
 * Responsive sweep — every screen in the three modules, at three viewports.
 *
 * Roadmap X.10, and the parts of X.9 that are measurable without interaction.
 * Doing 59 screens x 3 viewports by hand is not repeatable, and the brief needs
 * this re-run on every verification cycle, so it lives in a script.
 *
 * Per screen and viewport it reports:
 *   - horizontal PAGE scroll        the roadmap's pass/fail criterion
 *   - the outermost overflowing element, so the cause is named not just flagged
 *   - tables sitting outside an overflow-x container
 *   - interactive controls positioned entirely off-screen
 *   - leaf text clipped by its own box
 *
 * MEASUREMENT NOTE. The viewport is read from `document.documentElement.clientWidth`,
 * never `window.innerWidth`. Under device emulation innerWidth reported 457 against a
 * real 375 layout, which made an earlier hand-run of these checks 82px too lenient and
 * reported the fundraising module clean when every one of its screens scrolled sideways.
 *
 * Run:  node scripts/_uat/responsive-sweep.mjs [--module=payroll|fundraising|lp|all]
 *                                              [--viewports=375,768,1440] [--headed]
 * Exit: 0 = no screen fails, 1 = at least one does
 */
import { chromium } from "playwright"

const arg = (n, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : d
}
const flag = (n) => process.argv.includes(`--${n}`)

const STAFF_BASE = process.env.STAFF_BASE || "http://localhost:3001"
const LP_BASE = process.env.LP_BASE || "http://localhost:3110"
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const PASSWORD = "admin123"
const VIEWPORTS = arg("viewports", "375,768,1440").split(",").map((v) => Number(v.trim()))
const ONLY = arg("module", "all")

const PAYROLL = ["", "employees", "onboarding", "runs", "inputs", "exceptions", "approvals", "close",
  "components", "calendar", "tax", "training", "leave", "vendors", "vault", "reports", "audit",
  "access", "settings", "mypay"]
const FUNDRAISING = ["", "campaigns", "investors", "contacts", "pipeline", "mandates", "due-diligence",
  "data-rooms", "communications", "meetings", "documents", "agreements", "commitments", "onboarding",
  "placement-agents", "forecasts", "reports", "approvals", "audit", "settings"]
const LP = ["", "capital-activity", "capital-calls", "distributions", "performance", "dealing",
  "subscriptions-redemptions", "documents", "vault", "ledger", "notices", "messages", "requests",
  "colleagues", "organisation", "account-activity", "reports", "settings"]

const MODULES = [
  { id: "payroll", portal: "staff", base: STAFF_BASE, user: "perf.sysadmin@nts.local", routes: PAYROLL.map((r) => "/payroll" + (r ? "/" + r : "")) },
  { id: "fundraising", portal: "staff", base: STAFF_BASE, user: "perf.sysadmin@nts.local", routes: FUNDRAISING.map((r) => "/fundraising" + (r ? "/" + r : "")) },
  { id: "lp", portal: "lp", base: LP_BASE, user: "lp.test@arcus.co.zw", routes: LP.map((r) => "/lp-portal" + (r ? "/" + r : "")) },
].filter((m) => ONLY === "all" || ONLY === m.id)

/**
 * Deliberate route aliases: older LP paths that redirect to a merged screen.
 * Confirmed in the page files themselves: dealing/page.tsx is a bare
 * `redirect("/lp-portal/subscriptions-redemptions")`. Landing somewhere else is
 * only a failure when it was not intended.
 */
const ALIASES = {
  "/lp-portal/capital-calls": "/lp-portal/capital-activity",
  "/lp-portal/distributions": "/lp-portal/capital-activity",
  "/lp-portal/dealing": "/lp-portal/subscriptions-redemptions",
  "/lp-portal/vault": "/lp-portal/documents",
  "/lp-portal/ledger": "/lp-portal/account-activity",
  "/lp-portal/messages": "/lp-portal/requests",
  "/lp-portal/colleagues": "/lp-portal/organisation",
  "/lp-portal/reports": "/lp-portal/documents",
}

/** Runs in the page. Returns everything the roadmap asks about for one screen. */
const CHECK = `(() => {
  // Toasts are not layout. This sweep reuses one page across routes, and a
  // sonner toast raised on the previous screen is still animating in from the
  // right when the next one is measured — it reported "1 portal items need ..."
  // as an unreachable control on 16 LP screens at 768. A fresh page at the same
  // viewport has no such element. Removed before measuring rather than
  // pattern-matched afterwards.
  document.querySelectorAll('[data-sonner-toaster],[data-sonner-toast],.toaster,.toasts,[class*="toast" i]').forEach((n) => n.remove());
  const vw = document.documentElement.clientWidth;
  const vis = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05; };
  const inScroller = (el) => { let p = el.parentElement; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; p = p.parentElement; } return false; };
  // Off-canvas and transient chrome. A drawer parks off-screen by design, and a
  // toast slides in from the right — caught mid-animation it sits past the
  // viewport and looks like an unreachable control. The LP sweep reported "1
  // portal items need ..." on 16 screens at 768 for exactly that reason; the
  // live page has no such element and no offscreen control at all.
  const transient = (el) => !!el.closest('[data-sonner-toast],[data-sonner-toaster],.toaster,.toasts,[role=status],[aria-live]');
  const offCanvas = (el) => /drawer|offcanvas|sheet/i.test((el.className || '').toString()) || transient(el);
  const over = [...document.querySelectorAll('body *')].filter((el) => {
    if (!vis(el) || offCanvas(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right > vw + 1 && !inScroller(el);
  });
  const outermost = over.filter((el) => !over.includes(el.parentElement)).slice(0, 3).map((el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.className || '').toString().slice(0, 44),
    right: Math.round(el.getBoundingClientRect().right),
    txt: (el.innerText || '').trim().slice(0, 20),
  }));
  const looseTables = [...document.querySelectorAll('table')]
    .filter((t) => !inScroller(t) && t.getBoundingClientRect().width > vw + 1)
    .map((t) => Math.round(t.getBoundingClientRect().width));
  // A control inside a horizontal scroller is reachable by scrolling that
  // container, which is the pattern the roadmap asks for -- payroll's row
  // actions live in .table-wrap (clientWidth 349, scrollWidth 704) and are
  // correct. Only controls with no way to reach them count.
  const offscreen = [...new Set([...document.querySelectorAll('button,a[href],[role=button]')]
    .filter((el) => { if (!vis(el) || inScroller(el) || transient(el)) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= vw - 2; })
    .map((el) => (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 20)).filter(Boolean))];
  const truncated = [...new Set([...document.querySelectorAll('body *')]
    .filter((el) => vis(el) && el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && (el.innerText || '').trim().length > 4)
    .map((el) => (el.innerText || '').trim().slice(0, 22)))];
  const bodyText = (document.body.innerText || '').trim();
  return {
    vw,
    docWidth: document.documentElement.scrollWidth,
    pageScroll: document.documentElement.scrollWidth > vw + 1,
    outermost,
    looseTables,
    offscreen: offscreen.slice(0, 4),
    truncated: truncated.slice(0, 4),
    textLength: bodyText.length,
    looksEmpty: bodyText.length < 200,
  };
})()`

async function seedAuth(context, base, email, portal) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, portal }),
  })
  const login = await res.json().catch(() => ({}))
  const token = login.token || login?.data?.token
  if (!token) throw new Error(`login failed for ${email} (${portal}): ${res.status} ${JSON.stringify(login).slice(0, 140)}`)
  const user = login.user || login?.data?.user || {}
  const slim = {
    id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email,
    roleCode: user.roleCode, roleName: user.roleName ?? user.role?.name ?? null,
    role: user.role ? { id: user.role.id, name: user.role.name } : null,
  }
  const { hostname } = new URL(base)
  const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
  // Both the plain and the per-portal cookie names: run-portal-dev.mjs gives each
  // portal its own key so they stop sharing one session on localhost, and a server
  // started another way still uses the plain one.
  await context.addCookies([
    { name: "token", value: token, ...common },
    { name: `token_${portal}`, value: token, ...common },
    { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
    { name: "userProfile", value: encodeURIComponent(JSON.stringify(slim)), ...common },
    { name: `userProfile_${portal}`, value: encodeURIComponent(JSON.stringify(slim)), ...common },
  ])
}

const failures = []
const rows = []

const browser = await chromium.launch({ headless: !flag("headed") })
try {
  for (const mod of MODULES) {
    console.log(`\n=== ${mod.id} — ${mod.routes.length} screens x ${VIEWPORTS.length} viewports ===`)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await seedAuth(context, mod.base, mod.user, mod.portal)
    const page = await context.newPage()
    page.setDefaultTimeout(60000)

    for (const route of mod.routes) {
      for (const width of VIEWPORTS) {
        await page.setViewportSize({ width, height: width < 500 ? 812 : 900 })
        let r
        try {
          await page.goto(mod.base + route, { waitUntil: "domcontentloaded" })
          // Wait for content rather than a fixed timeout. A dev server compiles
          // each route on first hit, which takes far longer than any timeout
          // worth hard-coding: an earlier version waited 3500ms on the first
          // viewport and 1200ms on the rest, and reported 35 screens as
          // "renders empty" that were simply still compiling. The giveaway was
          // that the same route passed at one viewport and failed at another.
          await page
            .waitForFunction(() => (document.body.innerText || "").trim().length > 200, null, { timeout: 45000 })
            .catch(() => {})
          await page.waitForTimeout(700)
          r = await page.evaluate(CHECK)
        } catch (e) {
          failures.push({ module: mod.id, route, width, why: `did not load: ${String(e.message).slice(0, 60)}` })
          console.log(`  ${String(width).padStart(4)}  ${route.padEnd(34)} LOAD FAILED`)
          continue
        }
        // Did we land on the screen we asked for? Without this the sweep measures
        // whatever it was redirected to and calls it a pass:
        // /lp-portal/performance bounces to /lp-portal and was scored "ok"
        // because the dashboard it landed on has content.
        const landed = new URL(page.url()).pathname
        const problems = []
        // Either the requested route or its known alias target is fine. A
        // client-side redirect may not have completed by the time we measure,
        // so an aliased route legitimately reports as either one.
        const expected = ALIASES[route] || route
        if (landed !== route && landed !== expected) problems.push(`redirected to ${landed}`)
        if (r.pageScroll) problems.push(`page scrolls (${r.docWidth} vs ${r.vw})`)
        if (r.looseTables.length) problems.push(`table ${r.looseTables[0]}px not in a scroll container`)
        if (r.offscreen.length) problems.push(`offscreen: ${r.offscreen.join(", ")}`)
        if (r.looksEmpty) problems.push(`renders empty (${r.textLength} chars)`)

        rows.push({ module: mod.id, route, width, ok: problems.length === 0, problems, truncated: r.truncated })
        if (problems.length) {
          failures.push({ module: mod.id, route, width, why: problems.join(" · "), outermost: r.outermost })
          console.log(`  ${String(width).padStart(4)}  ${route.padEnd(34)} FAIL  ${problems.join(" · ")}`)
          if (r.outermost.length) console.log(`        cause: <${r.outermost[0].tag} class="${r.outermost[0].cls}"> right=${r.outermost[0].right}`)
        } else {
          const note = r.truncated.length ? `  (clipped text: ${r.truncated.slice(0, 2).join(", ")})` : ""
          console.log(`  ${String(width).padStart(4)}  ${route.padEnd(34)} ok${note}`)
        }
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(`\n=== RESULT ===`)
console.log(`${rows.length} screen/viewport checks, ${failures.length} failing`)
const clipped = rows.filter((r) => r.truncated.length)
if (clipped.length) console.log(`${clipped.length} with clipped text (reported, not failed — legibility, judged case by case)`)
if (!failures.length) {
  console.log("PASS — no page-level horizontal scroll, no loose tables, no offscreen controls, no empty screens.")
  process.exit(0)
}
console.log("\nFailures:")
for (const f of failures) console.log(`  ${f.module.padEnd(12)} ${String(f.width).padStart(4)}  ${f.route.padEnd(34)} ${f.why}`)
process.exit(1)
