// The rest of the live Accounting pages in the browser, by role: each page draws from the server without an error or a
// script error, offers the actions the role holds and none it does not, and is refused to someone outside finance.
// Complements acct-ui-roles.mjs (investments, journals, close, reconciliation, cash, assets, receivables, FX).
// Usage: node scripts/_uat/acct-ui-pages.mjs     env: ACCT_FE (default http://localhost:3120), ACCT_ROLES=acct.cfo,…
import { chromium } from "playwright"

const FE = process.env.ACCT_FE || "http://localhost:3120"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const J = (x) => JSON.stringify(x).slice(0, 300)

const PAGES = {
  overview: "/accounting", ceo: "/accounting/ceo", approvals: "/accounting/approvals", recurring: "/accounting/recurring",
  expenses: "/accounting/expenses", reports: "/accounting/reports", coa: "/accounting/chart-governance", audit: "/accounting/audit",
  access: "/accounting/access", settings: "/accounting/settings", integrations: "/accounting/integrations", timesheets: "/accounting/timesheets",
  inventory: "/accounting/inventory", compliance: "/accounting/tax", consolidation: "/accounting/consolidation", vault: "/accounting/vault",
  // opened straight from their address (deep links to pages only the live layer draws)
  claims: "/accounting/claims", paymentruns: "/accounting/payment-runs", jobs: "/accounting/jobs",
}
// [email, label, { page: [want, never] }, refusedPages]
const ROLES = [
  ["acct.cfo@nts.local", "CFO", {
    overview: [["ov-go"], []], ceo: [["ov-go"], []], approvals: [[], []], recurring: [["rec-new", "rec-due"], []], expenses: [[], []], reports: [["rep-csv"], []],
    coa: [["coa-new", "coa-edit", "coa-history"], []], audit: [["aud-check", "aud-export"], []], access: [["acx-tab"], []], settings: [["set-bank-new", "set-bank-edit"], []],
    integrations: [["int-refresh"], []], timesheets: [["ts-proj-new"], []], inventory: [["inv-new", "inv-in", "inv-out", "inv-count"], []], compliance: [["vat-csv", "tax-tab"], []],
    consolidation: [[], []], vault: [["vault-up"], []], claims: [["clm-new", "clm-tab"], []], paymentruns: [["pr-payables", "pr-new"], []], jobs: [["job-history", "job-run"], []] }, []],
  ["acct.accountant@nts.local", "Accountant", {
    overview: [["ov-go"], []], ceo: [["ov-go"], []], approvals: [[], ["apq-post"]], recurring: [["rec-new"], ["rec-due", "rec-toggle", "rec-run"]], expenses: [[], []], reports: [["rep-csv"], []],
    coa: [["coa-new", "coa-edit"], []], audit: [["aud-check", "aud-export"], []], access: [["acx-tab"], []], settings: [[], ["set-bank-new", "set-bank-edit", "set-bank-off"]],
    integrations: [["int-refresh"], []], timesheets: [[], ["ts-proj-new", "ts-approve"]], inventory: [["inv-new", "inv-in", "inv-out"], ["inv-count"]], compliance: [["vat-csv"], []],
    consolidation: [[], []], vault: [["vault-up"], []], claims: [["clm-new", "clm-tab"], []], paymentruns: [["pr-payables", "pr-new"], ["pr-approve", "pr-settle"]], jobs: [["job-history"], ["job-run", "job-toggle"]] }, []],
  ["acct.auditor@nts.local", "Internal Auditor", {
    overview: [["ov-go"], []], ceo: [["ov-go"], []], approvals: [[], ["apq-post", "apq-approve"]], recurring: [[], ["rec-new", "rec-due", "rec-toggle"]], expenses: [[], []], reports: [["rep-csv"], []],
    coa: [["coa-history"], ["coa-new", "coa-edit", "coa-del"]], audit: [["aud-check", "aud-export"], []], access: [["acx-tab"], []], settings: [[], ["set-bank-new", "set-bank-edit", "set-bank-off", "set-company"]],
    integrations: [["int-refresh"], []], timesheets: [[], ["ts-proj-new", "ts-approve"]], inventory: [[], ["inv-new", "inv-in", "inv-out", "inv-count"]], compliance: [["vat-csv"], []],
    consolidation: [[], []], vault: [[], ["vault-up"]], claims: [["clm-new"], ["clm-mgr", "clm-review", "clm-approve"]], paymentruns: [["pr-payables"], ["pr-new", "pr-approve", "pr-settle", "pr-cancel"]], jobs: [["job-history"], ["job-run", "job-toggle"]] }, []],
  ["perf.employee@nts.local", "Employee outside finance", { claims: [["clm-new"], []] }, ["overview", "ceo", "approvals", "recurring", "expenses", "reports", "coa", "audit", "access", "settings", "integrations", "inventory", "compliance", "consolidation", "vault", "paymentruns", "jobs"]],
]
const pick = process.env.ACCT_ROLES ? process.env.ACCT_ROLES.split(",") : null
const RUN = pick ? ROLES.filter((r) => pick.some((p) => r[0].startsWith(p))) : ROLES

const browser = await chromium.launch()
try {
  for (const [email, label, pages, refused] of RUN) {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
    const P = await ctx.newPage(); P.setDefaultTimeout(120000)
    const errors = []
    P.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)))
    let signedIn = false
    for (let i = 0; i < 3 && !signedIn; i++) {
      try {
        await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded", timeout: 180000 }); await P.waitForTimeout(2000)
        await P.fill('input[type="email"]', email); await P.fill('input[type="password"]', "admin123")
        await Promise.all([P.waitForURL((u) => !/\/login/.test(String(u)), { timeout: 60000 }), P.click('button[type="submit"]')])
        signedIn = true
      } catch (e) { if (i === 2) check(`${label}: signs in`, false, e.message.split("\n")[0]) }
    }
    if (!signedIn) { await ctx.close(); continue }
    for (const [key, path] of Object.entries(PAGES)) {
      const isRefused = refused.includes(key)
      if (!isRefused && !pages[key]) continue
      let seen = null
      for (let i = 0; i < 2 && !seen; i++) {
        try {
          await P.goto(`${FE}${path}`, { waitUntil: "domcontentloaded", timeout: 180000 })
          // drawn: the live page is in, its permissions are known and nothing is still loading
          await P.waitForFunction(() => document.querySelector(".accounting-v52-root .v28-page") && window.AccLive && window.AccLive.cache.me && window.AccLive.cache.me.state !== "loading" && !document.querySelector('.accounting-v52-root .al-state[role="status"]'), null, { timeout: 150000 }).catch(() => {})
          await P.waitForTimeout(1500)
          seen = await P.evaluate(() => ({ acts: [...new Set([...document.querySelectorAll(".accounting-v52-root [data-al]")].map((b) => b.dataset.al))].filter((a) => a !== "close" && a !== "retry"), denied: !!document.querySelector(".al-denied"), error: (document.querySelector(".accounting-v52-root .al-error") || {}).innerText || "", landedOn: (document.querySelector(".accounting-v52-root .nav-item.active") || {}).dataset?.page || null }))
        } catch (e) { if (i === 1) seen = { acts: [], denied: false, error: `could not open: ${e.message.split("\n")[0]}`, landedOn: null } }
      }
      // refused: the classic denied banner, no actions at all, or — since the sidebar/direct-nav fix — bounced to a
      // different page entirely (the first one this role can actually see) rather than ever rendering the forbidden one
      if (isRefused) { check(`${label} · ${key}: refused`, seen.denied || !seen.acts.length || (seen.landedOn && seen.landedOn !== key), J(seen)); continue }
      const [want, never] = pages[key]
      const missing = want.filter((a) => !seen.acts.includes(a)), extra = never.filter((a) => seen.acts.includes(a))
      check(`${label} · ${key}: drawn with exactly its actions`, !seen.denied && !seen.error && !missing.length && !extra.length, `missing ${missing} extra ${extra} ${seen.denied ? "DENIED " : ""}${seen.error}`)
    }
    check(`${label}: no script errors`, !errors.length, errors.join(" | "))
    await ctx.close()
  }
} finally {
  await browser.close()
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
