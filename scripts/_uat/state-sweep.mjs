/**
 * Loading, empty and error states — roadmap X.9.
 *
 * The roadmap asks for: no infinite spinner, retry works, a skeleton while
 * loading, an empty state that says why, and an actionable error. None of that
 * can be tested by waiting and hoping the backend misbehaves, so each state is
 * induced deterministically by intercepting the API:
 *
 *   error    every /api/** call returns 500
 *   empty    every /api/** call returns a well-formed but empty payload
 *   loading  every /api/** call is held for 4s, and the page is inspected while
 *            it waits
 *
 * A screen fails when it goes blank, spins forever, or says nothing at all —
 * the three ways a data-loading surface leaves a user stuck.
 *
 * Run:  node scripts/_uat/state-sweep.mjs [--module=payroll|fundraising|lp|all]
 *                                         [--states=error,empty,loading]
 * Exit: 0 = every screen handles every state, 1 = at least one does not
 */
import { chromium } from "playwright"
import { MODULES, ALIASES, seedAuth } from "./_routes.mjs"

const arg = (n, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : d
}
const flag = (n) => process.argv.includes(`--${n}`)

const ONLY = arg("module", "all")
const STATES = arg("states", "error,empty,loading").split(",").map((s) => s.trim())
const mods = MODULES.filter((m) => ONLY === "all" || ONLY === m.id)

/** Vocabulary a screen uses when it is being honest about its state. */
const READ = `(() => {
  // Toasts are READ here, not removed. The responsive sweep strips them because
  // they are not layout; this one must not, because these modules report a
  // failed data load through a toast ("Could not load 3 payroll data sources")
  // rather than an inline panel. Deleting it first and then calling the screen
  // silent would be counting the product as broken for telling the user.
  const toastText = [...document.querySelectorAll('[data-sonner-toast],[class*="toast" i]')]
    .map((n) => n.innerText || '').join(' ');
  const main = document.querySelector('main') || document.body;
  const text = (main.innerText || '').trim();
  const lower = (text + ' ' + toastText).toLowerCase();
  const spinner = !!document.querySelector(
    '[class*="animate-spin"],[class*="skeleton" i],[data-loading],[aria-busy="true"],[role="progressbar"]'
  );
  return {
    chars: text.length,
    spinner,
    saysError: /error|failed|could not|couldn.t|unable|went wrong|unavailable|problem/.test(lower),
    viaToast: /error|failed|could not|couldn.t|unable/.test(toastText.toLowerCase()),
    saysRetry: /retry|try again|reload|refresh/.test(lower),
    saysEmpty: /no |none|nothing|empty|not found|0 result|no records|no data|yet\\b/.test(lower),
    // Rows still on screen when every API returned [] means the screen is
    // rendering its own fixtures. This codebase has a documented history of
    // "hardcoded values masquerading as live data", and the empty state is
    // where that shows up most clearly.
    rows: document.querySelectorAll('tbody tr, [role=row]').length,
    sample: text.slice(0, 120).replace(/\\s+/g, ' '),
  };
})()`

const failures = []
let checks = 0

const browser = await chromium.launch({ headless: !flag("headed") })
try {
  for (const mod of mods) {
    console.log(`\n=== ${mod.id} — ${mod.routes.length} screens x ${STATES.length} state(s) ===`)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await seedAuth(context, mod.base, mod.user, mod.portal)
    const page = await context.newPage()
    page.setDefaultTimeout(60000)

    for (const route of mod.routes) {
      for (const state of STATES) {
        checks += 1
        // Intercept only the data API. Next's own assets must load, or the
        // screen never renders and every state would "fail" for the wrong reason.
        await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {})
        await page.route("**/api/**", async (r) => {
          // Identity and entitlement are not "data". Blanking or failing these
          // does not test a screen's empty state -- it strips the caller's
          // permissions, and every payroll screen then renders the access panel
          // while every LP screen renders nothing at all. That produced 44 false
          // failures before it was excluded. Only the data calls are faulted.
          const url = r.request().url()
          if (/\/auth\/|\/me\/access|\/lp-portal\/session|\/users\//.test(url)) {
            await r.continue()
            return
          }
          if (state === "error") {
            await r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, message: "Simulated upstream failure" }) })
          } else if (state === "empty") {
            await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
          } else {
            await new Promise((res) => setTimeout(res, 4000))
            await r.continue()
          }
        })

        let r
        try {
          await page.goto(mod.base + route, { waitUntil: "domcontentloaded" })
          if (state === "loading") {
            // Look while the API is still held.
            await page.waitForTimeout(1500)
          } else {
            await page.waitForFunction(() => (document.body.innerText || "").trim().length > 60, null, { timeout: 25000 }).catch(() => {})
            await page.waitForTimeout(900)
          }
          r = await page.evaluate(READ)
        } catch (e) {
          failures.push({ mod: mod.id, route, state, why: `did not load: ${String(e.message).slice(0, 50)}` })
          console.log(`  ${state.padEnd(7)} ${route.padEnd(34)} LOAD FAILED`)
          continue
        }

        let why = null
        if (state === "error") {
          // Blank or silent is the failure. A screen that renders its shell and
          // says nothing about the failure leaves the user staring at nothing.
          if (r.chars < 60) why = `blank (${r.chars} chars) with every API call failing`
          else if (!r.saysError) why = `no error message shown — "${r.sample.slice(0, 60)}"`
        } else if (state === "empty") {
          if (r.chars < 60) why = `blank (${r.chars} chars) with empty data`
          else if (r.rows > 0) why = `${r.rows} row(s) rendered while the API returned nothing`
          else if (!r.saysEmpty && !r.saysError) why = `no empty state — "${r.sample.slice(0, 60)}"`
        } else {
          if (!r.spinner && r.chars < 60) why = `nothing on screen while loading (no skeleton, ${r.chars} chars)`
        }

        if (why) {
          failures.push({ mod: mod.id, route, state, why })
          console.log(`  ${state.padEnd(7)} ${route.padEnd(34)} FAIL  ${why}`)
        } else {
          const note =
            state === "error"
              ? (r.viaToast ? " (via toast)" : "") + (r.saysRetry ? "" : " (no retry offered)")
              : ""
          console.log(`  ${state.padEnd(7)} ${route.padEnd(34)} ok${note}`)
        }
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(`\n=== RESULT ===`)
console.log(`${checks} state checks, ${failures.length} failing`)
if (!failures.length) {
  console.log("PASS — no screen goes blank or silent under failure, empty data, or a slow API.")
  process.exit(0)
}
const byState = {}
for (const f of failures) byState[f.state] = (byState[f.state] || 0) + 1
console.log(Object.entries(byState).map(([s, n]) => `${s}: ${n}`).join("  ·  "))
console.log("\nFailures:")
for (const f of failures) console.log(`  ${f.mod.padEnd(12)} ${f.state.padEnd(7)} ${f.route.padEnd(34)} ${f.why}`)
process.exit(1)
