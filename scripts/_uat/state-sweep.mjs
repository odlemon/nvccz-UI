/**
 * Loading, empty and error states — roadmap X.9.
 *
 * The roadmap asks for: no infinite spinner, retry works, a skeleton while
 * loading, an empty state that says why, and an actionable error. None of that
 * can be tested by waiting and hoping the backend misbehaves, so each state is
 * induced deterministically by intercepting the API:
 *
 *   error    every /api/** call returns 500
 *   empty    every /api/** call returns its OWN real payload, emptied in place
 *   loading  every /api/** call is held for 6s, and the page is WATCHED for the
 *            whole time it waits
 *
 * A screen fails when it goes blank, spins forever, or says nothing at all —
 * the three ways a data-loading surface leaves a user stuck.
 *
 * Run:  node scripts/_uat/state-sweep.mjs [--module=payroll|fundraising|lp|all]
 *                                         [--states=error,empty,loading]
 * Exit: 0 = every screen handles every state, 1 = at least one does not
 */
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const arg = (n, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : d
}
const flag = (n) => process.argv.includes(`--${n}`)

const ONLY = arg("module", "all")
const STATES = arg("states", "error,empty,loading").split(",").map((s) => s.trim())
const mods = MODULES.filter((m) => ONLY === "all" || ONLY === m.id)

/**
 * Empty a real response without changing its shape: collections become [],
 * numbers become 0, strings/booleans/nulls stay as they are.
 *
 * Fulfilling every endpoint with a flat {success,data:[]} instead — which is
 * what this sweep did first — is its own bug. A screen expecting
 * {data:{items:[],total:0}} gets an array, throws on the mismatch, and keeps
 * whatever it was holding. That reads as "fixtures surviving behind live data",
 * the exact defect this codebase has a history of, when it is really just the
 * stub being the wrong shape. Emptying the genuine payload keeps the contract.
 */
const deepEmpty = (v) => {
  if (Array.isArray(v)) return []
  if (v && typeof v === "object") {
    const out = {}
    for (const [k, val] of Object.entries(v)) out[k] = deepEmpty(val)
    return out
  }
  return typeof v === "number" ? 0 : v
}

/** Vocabulary a screen uses when it is being honest about its state. */
const READ = `(() => {
  // Toasts are READ here, not removed. The responsive sweep strips them because
  // they are not layout; this one must not, because these modules report a
  // failed data load through a toast ("Could not load 3 payroll data sources")
  // rather than an inline panel. Deleting it first and then calling the screen
  // silent would be counting the product as broken for telling the user.
  const toastText = ((window.__uatToasts || []).join(' ') + ' ' +
    [...document.querySelectorAll('[data-sonner-toast],[class*="toast" i]')]
      .map((n) => n.innerText || '').join(' ')).trim();
  const main = document.querySelector('main') || document.body;
  const text = (main.innerText || '').trim();
  const lower = (text + ' ' + toastText).toLowerCase();
  // DATA rows only. A header row and a full-width "No contacts match your
  // filters." row both match 'tbody tr, [role=row]', and counting either as
  // data turns a correct empty state into a fabricated-fixtures finding --
  // which is what it did on 20 screens before this filter existed.
  const rowsOf = () => [...document.querySelectorAll('tbody tr, [role=row]')]
    .filter((el) => !el.closest('thead') && !el.querySelector('th, [role=columnheader]'))
    .map((el) => (el.innerText || '').replace(/\\s+/g, ' ').trim())
    .filter((t) => t && !/^(no |none|nothing|empty|not found|0 result)/i.test(t));
  const spinner = !!document.querySelector(
    '[class*="animate-spin"],[class*="skeleton" i],[data-loading],[aria-busy="true"],[role="progressbar"]'
  );
  return {
    chars: text.length,
    spinner,
    // "failed" does not match "failure", and the interception's own message is
    // "Simulated upstream failure" -- the first version of this regex listed
    // "failed" and scored 20 honest screens silent. Match the stem instead.
    saysError: /error|fail|could not|couldn.t|unable|went wrong|unavailable|problem/.test(lower),
    viaToast: /error|fail|could not|couldn.t|unable/.test(toastText.toLowerCase()),
    saysRetry: /retry|try again|reload|refresh/.test(lower),
    saysEmpty: /no |none|nothing|empty|not found|0 result|no records|no data|yet\\b/.test(lower),
    rows: rowsOf().length,
    firstRow: (rowsOf()[0] || '').slice(0, 90),
    sample: text.slice(0, 120).replace(/\\s+/g, ' '),
  };
})()`

/**
 * Watch the whole held window rather than sampling one instant.
 *
 * A skeleton that appears at 2.2s is a real skeleton; a single read at 1.5s
 * scores it missing. That is the same sampling error that made an entire
 * module look like it never reports failure, so it is fixed the same way:
 * observe over time, do not snapshot.
 */
const WATCH_LOADING = `(async () => {
  let spinner = false, chars = 0, sample = '';
  for (let i = 0; i < 18; i++) {
    const main = document.querySelector('main') || document.body;
    const text = (main.innerText || '').trim();
    if (text.length > chars) { chars = text.length; sample = text.slice(0, 120).replace(/\\s+/g, ' '); }
    if (document.querySelector(
      '[class*="animate-spin"],[class*="skeleton" i],[data-loading],[aria-busy="true"],[role="progressbar"]'
    )) spinner = true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return { spinner, chars, sample, rows: 0, saysError: false, saysEmpty: false, saysRetry: false, viaToast: false };
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

    // Record toasts as they appear, rather than sampling once at the end.
    // Sonner dismisses after a few seconds, so a single read after the page
    // settles misses them: /fundraising/investors toasts at ~2s and was scored
    // silent, which made an entire module look like it never reports a failure.
    await page.addInitScript(() => {
      window.__uatToasts = []
      const capture = () => {
        document.querySelectorAll("[data-sonner-toast]").forEach((n) => {
          const t = (n.innerText || "").replace(/\s+/g, " ").trim()
          if (t && !window.__uatToasts.includes(t)) window.__uatToasts.push(t)
        })
      }
      new MutationObserver(capture).observe(document.documentElement, { childList: true, subtree: true })
      setInterval(capture, 250)
    })

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
            await r.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ success: false, message: "Simulated upstream failure" }),
            })
          } else if (state === "empty") {
            let body = JSON.stringify({ success: true, data: [] })
            try {
              const real = await r.fetch()
              body = JSON.stringify(deepEmpty(JSON.parse(await real.text())))
            } catch {
              // Non-JSON (a file stream) or a genuinely failing call: fall back
              // to the generic empty envelope rather than aborting the check.
            }
            await r.fulfill({ status: 200, contentType: "application/json", body })
          } else {
            await new Promise((res) => setTimeout(res, 6000))
            await r.continue()
          }
        })

        let r
        try {
          await page.goto(mod.base + route, { waitUntil: "domcontentloaded" })
          if (state === "loading") {
            r = await page.evaluate(WATCH_LOADING)
          } else {
            await page
              .waitForFunction(() => (document.body.innerText || "").trim().length > 60, null, { timeout: 25000 })
              .catch(() => {})
            await page.waitForTimeout(900)
            r = await page.evaluate(READ)
          }
        } catch (e) {
          failures.push({ mod: mod.id, route, state, why: `did not load: ${String(e.message).slice(0, 50)}` })
          console.log(`  ${state.padEnd(7)} ${route.padEnd(34)} LOAD FAILED`)
          continue
        }

        let why = null
        if (state === "error") {
          // Silence is the failure, not brevity. "Performance / Simulated
          // upstream failure / Try Again" is 48 characters and is the correct
          // answer; testing the length threshold first called it blank. Ask
          // whether the screen SAID something before asking how much it said.
          if (!r.saysError && r.chars < 60) why = `blank and silent (${r.chars} chars) with every API call failing`
          else if (!r.saysError) why = `no error message shown — "${r.sample.slice(0, 60)}"`
        } else if (state === "empty") {
          if (r.chars < 60) why = `blank (${r.chars} chars) with empty data`
          else if (r.rows > 0) why = `${r.rows} data row(s) with every collection empty — first: "${r.firstRow}"`
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
              : state === "loading"
                ? r.spinner
                  ? " (skeleton)"
                  : ` (shell only, ${r.chars} chars)`
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
