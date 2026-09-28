// Accounting live pages by role, in the browser: each role signs in once, opens each live page and we record which
// actions it is offered (the page's data-al controls), or that it is refused. Expectations follow the permission tiers
// (design-refs/accounting-sweep/RBAC.md); a role's Finance Manager row is read from /accounting/me rather than assumed.
// Usage: node scripts/_uat/acct-ui-roles.mjs     env: ACCT_FE (default http://localhost:3120), ACCT_ROLES=acct.cfo,…
import { chromium } from "playwright"

const FE = process.env.ACCT_FE || "http://localhost:3120"
const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => (await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json()).token
const api = async (t, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: body && JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data } }
const J = (x) => JSON.stringify(x).slice(0, 300)

// fixtures: a live investment with draft interest; a draft journal by someone other than the approvers
const officerT = await login("acct.officer@nts.local"), fmT = await login("perf.finmgr@nts.local")
const [cur, banks, coa] = await Promise.all([api(officerT, "GET", "/accounting/currencies"), api(officerT, "GET", "/cashbook/banks"), api(officerT, "GET", "/accounting/chart-of-accounts")])
const usd = cur.data.find((c) => c.code === "USD"), bank = banks.data.find((b) => b.currencyId === usd.id && b.glAccountId), acc = (no) => coa.data.find((a) => a.accountNo === no).id
const today = new Date().toISOString().slice(0, 10)
const inst = await api(officerT, "POST", "/accounting/short-term-investments/instruments", { name: `UAT STI UI ${Date.now() % 100000}`, category: "Money Market", broker: "UAT Broker UI", principal: 10000, currencyId: usd.id, compoundingMethod: "SIMPLE", dayCountConvention: "ACTUAL_365", settlementBankId: bank.id, principalGlAccountId: acc("1150"), accruedInterestGlAccountId: acc("1160"), interestIncomeGlAccountId: acc("4110"), negativeYieldExpenseGlAccountId: acc("5150"), startDateIso: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), initialApyPercent: 8 })
const draft = await api(officerT, "POST", "/accounting/journal-entries", { transactionDate: today, referenceNumber: `UATUI-${Date.now() % 100000}`, description: "UAT UI roles draft", currencyId: usd.id, journalEntryLines: [{ chartOfAccountId: acc("5090"), debitAmount: 10, creditAmount: 0 }, { chartOfAccountId: acc("1100"), debitAmount: 0, creditAmount: 10 }] })
const draftId = draft.data && (draft.data.id || (draft.data.journalEntry && draft.data.journalEntry.id))
check("set-up: a live investment and a draft journal", inst.status === 201 && !!draftId, `${inst.status} ${draft.status}`)

const PAGES = {
  investments: { path: "/accounting/short-term-investments", ready: '[data-al="sti-tab"], .al-denied, .al-error' },
  journals: { path: "/accounting/journals", ready: '[data-al="je-tab"], .al-denied, .al-error' },
  close: { path: "/accounting/close", ready: '[data-close-period], .al-denied, .al-error' },
  reconciliation: { path: "/accounting/bank-reconciliation", ready: '.accounting-v52-root .v28-panel, .al-denied, .al-error' },
  cash: { path: "/accounting/cash-book", ready: '[data-cash-f], .al-denied, .al-error' },
  assets: { path: "/accounting/assets", ready: '[data-al="asset-tab"], .al-denied, .al-error' },
  receivables: { path: "/accounting/receivables", ready: '[data-al="ar-tab"], .al-denied, .al-error' },
  fx: { path: "/accounting/fx-revaluation", ready: '.accounting-v52-root .v28-kpis, .al-denied, .al-error' },
}
const STI_ALL = ["sti-new", "sti-accrue", "sti-rate", "sti-liquidate", "sti-void", "sti-settings", "sti-approve-all"]
const CLOSE_ALL = ["close-add", "close-lock", "close-unlock", "close-standard"]
// [email, label, { page: [want, never] }, denied]
const ROLES = [
  ["acct.cfo@nts.local", "CFO", { investments: [["sti-new", "sti-accrue", "sti-approve-all", "sti-settings", "sti-open", "sti-rate", "sti-liquidate", "sti-void", "sti-approve"], []], journals: [["je-new", "je-open", "je-post"], []], close: [["close-add"], []], reconciliation: [["rec-start"], []], cash: [["cash-new", "cash-transfer", "cash-void"], []], assets: [["asset-new", "asset-run", "asset-dispose", "asset-open"], []], receivables: [["ar-new", "ar-receipt", "ar-customer"], []], fx: [["fx-add", "fx-fetch"], []] }, false],
  ["perf.finmgr@nts.local", "Finance Manager", { investments: [["sti-open"], []], journals: [["je-new", "je-open", "je-post"], []], close: [["close-add"], []], reconciliation: [["rec-start"], []], cash: [["cash-new", "cash-void"], []], assets: [["asset-new", "asset-run", "asset-dispose"], []], receivables: [["ar-new", "ar-receipt"], []], fx: [["fx-add", "fx-fetch"], []] }, false],
  ["acct.officer@nts.local", "Finance Officer (treasury preparer)", { investments: [["sti-new", "sti-accrue", "sti-open", "sti-rate", "sti-liquidate"], ["sti-void", "sti-settings", "sti-approve-all", "sti-approve"]], journals: [["je-new", "je-open"], ["je-post"]], close: [[], CLOSE_ALL], reconciliation: [["rec-start"], []], cash: [["cash-new"], ["cash-void"]], assets: [["asset-new", "asset-open"], ["asset-run", "asset-dispose"]], receivables: [["ar-new", "ar-receipt"], []], fx: [["fx-add"], ["fx-fetch"]] }, false],
  ["acct.accountant@nts.local", "Accountant", { investments: [["sti-open"], ["sti-void", "sti-settings", "sti-approve-all"]], journals: [["je-new", "je-open"], ["je-post"]], close: [[], CLOSE_ALL], reconciliation: [["rec-start"], []], cash: [["cash-new"], ["cash-void"]], assets: [["asset-new"], ["asset-run", "asset-dispose"]], receivables: [["ar-new", "ar-receipt"], []], fx: [["fx-add"], ["fx-fetch"]] }, false],
  ["acct.assistant@nts.local", "Finance Assistant", { investments: [["sti-open"], STI_ALL], journals: [["je-new", "je-open"], ["je-post"]], close: [[], CLOSE_ALL], reconciliation: [[], ["rec-start"]], cash: [["cash-new"], ["cash-void"]], assets: [["asset-new"], ["asset-run", "asset-dispose"]], receivables: [["ar-new"], []], fx: [["fx-add"], ["fx-fetch"]] }, false],
  ["acct.auditor@nts.local", "Internal Auditor", { investments: [["sti-open"], STI_ALL], journals: [["je-open"], ["je-new", "je-post"]], close: [[], CLOSE_ALL], reconciliation: [[], ["rec-start"]], cash: [[], ["cash-new", "cash-void", "cash-transfer"]], assets: [["asset-open"], ["asset-new", "asset-run", "asset-dispose"]], receivables: [[], ["ar-new", "ar-receipt", "ar-customer"]], fx: [[], ["fx-add", "fx-fetch", "fx-correct"]] }, false],
  ["perf.employee@nts.local", "Employee outside finance", { investments: [[], ["sti-new", "sti-open"]], journals: [[], ["je-new", "je-open"]], close: [[], CLOSE_ALL], reconciliation: [[], ["rec-start"]], cash: [[], ["cash-new", "cash-void"]], assets: [[], ["asset-new", "asset-open"]], receivables: [[], ["ar-new", "ar-receipt"]], fx: [[], ["fx-add"]] }, true],
]
const fmKeys = (await api(fmT, "GET", "/accounting/me")).data.keys
ROLES[1][2].investments[0].push(...(fmKeys.includes("accounting.treasury.manage") ? ["sti-new", "sti-rate", "sti-liquidate"] : []), ...(fmKeys.includes("accounting.treasury.approve") ? ["sti-void", "sti-approve-all", "sti-settings"] : []))
const pick = process.env.ACCT_ROLES ? process.env.ACCT_ROLES.split(",") : null
const RUN = pick ? ROLES.filter((r) => pick.some((p) => r[0].startsWith(p))) : ROLES

const browser = await chromium.launch()
try {
  for (const [email, label, pages, denied] of RUN) {
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
    for (const [key, spec] of Object.entries(PAGES)) {
      const [want, never] = pages[key]
      let seen = null
      for (let i = 0; i < 2 && !seen; i++) {
        try {
          await P.goto(`${FE}${spec.path}`, { waitUntil: "domcontentloaded", timeout: 180000 })
          await P.waitForFunction((sel) => document.querySelector(sel) && window.AccLive && window.AccLive.cache.me && window.AccLive.cache.me.state !== "loading", spec.ready, { timeout: 150000 }).catch(() => {})
          await P.waitForTimeout(1500)
          seen = await P.evaluate(() => ({ acts: [...new Set([...document.querySelectorAll(".accounting-v52-root [data-al]")].map((b) => b.dataset.al))], denied: !!document.querySelector(".al-denied"), error: (document.querySelector(".al-error") || {}).textContent || "" }))
        } catch (e) { if (i === 1) seen = { acts: [], denied: false, error: `could not open: ${e.message.split("\n")[0]}` } }
      }
      const extra = never.filter((a) => seen.acts.includes(a))
      if (denied) check(`${label} · ${key}: refused`, (seen.denied || !seen.acts.length) && !extra.length, J(seen))
      else {
        const missing = want.filter((a) => !seen.acts.includes(a))
        check(`${label} · ${key}: offered exactly its actions`, !seen.denied && !seen.error && !missing.length && !extra.length, `missing ${missing} extra ${extra} ${seen.denied ? "DENIED " : ""}${seen.error}`)
      }
    }
    check(`${label}: no script errors`, !errors.length, errors.join(" | "))
    await ctx.close()
  }
} finally {
  await browser.close()
  if (inst.data && inst.data.id) await api(fmT, "POST", `/accounting/short-term-investments/instruments/${inst.data.id}/void`, { reason: "UAT clean-up" })
  if (draftId) await api(officerT, "POST", `/accounting/journal-entries/${draftId}/discard`, { reason: "UAT clean-up" })
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
