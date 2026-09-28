// Employee claims in the browser, one claim through four people: the employee (no Accounting rights) opens Employee
// Claims, starts a claim, adds an item and submits it; the line manager approves it from "Waiting for you"; the finance
// reviewer reviews it; a finance manager approves it for payment (with a note when the policy flags it) and pays it.
// Each sees only the steps that are theirs. Posts one small USD claim and its payment on the dev books.
// Usage: node scripts/_uat/acct-ui-claims.mjs     env: ACCT_FE (default http://localhost:3120)
import { chromium } from "playwright"

const FE = process.env.ACCT_FE || "http://localhost:3120"
const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const title = `UAT UI claim ${Date.now().toString().slice(-6)}`
const amount = (10 + (Date.now() % 900) / 100).toFixed(2)

const browser = await chromium.launch()
const errors = []
async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
  const P = await ctx.newPage(); P.setDefaultTimeout(120000)
  P.on("pageerror", (e) => errors.push(`${email}: ${String(e.message).slice(0, 200)}`))
  for (let i = 0; i < 3; i++) {
    try {
      await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded", timeout: 180000 }); await P.waitForTimeout(2000)
      await P.fill('input[type="email"]', email); await P.fill('input[type="password"]', "admin123")
      await Promise.all([P.waitForURL((u) => !/\/login/.test(String(u)), { timeout: 60000 }), P.click('button[type="submit"]')])
      break
    } catch (e) { if (i === 2) throw e }
  }
  await P.goto(`${FE}/accounting/claims`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await P.waitForFunction(() => { const c = window.AccLive && window.AccLive.cache["clm-opts"]; return c && c.state !== "loading" && document.querySelector(".accounting-v52-root .v28-page [data-al='clm-new']") }, null, { timeout: 150000 })
  await P.waitForTimeout(1500)
  return { ctx, P }
}
const acts = (P) => P.evaluate(() => [...new Set([...document.querySelectorAll("#alOverlay [data-al]")].map((b) => b.dataset.al))].filter((a) => a !== "close" && a !== "form-submit"))
const submitForm = async (P) => {
  // the dialog is replaced (closed, or the claim shown again): wait for this one to go, or for its error
  await P.evaluate(() => { window.__clmOv = document.getElementById("alOverlay") })
  await P.click('#alOverlay [data-al="form-submit"]')
  await P.waitForFunction(() => !window.__clmOv.isConnected || window.__clmOv.querySelector("#alFormError:not([hidden])"), null, { timeout: 120000 })
  const err = await P.evaluate(() => window.__clmOv.isConnected ? window.__clmOv.querySelector("#alFormError").innerText : "")
  if (err) throw new Error(`form refused: ${err}`)
}
async function openClaim(P, tab) {
  if (tab) { await P.click(`[data-al="clm-tab"][data-t="${tab}"]`); await P.waitForTimeout(2500) }
  const row = P.locator("tr", { hasText: title }).first()
  await row.waitFor({ timeout: 120000 })
  await row.locator('[data-al="clm-open"]').click()
  await P.waitForSelector("#alOverlay .al-modal-wide", { timeout: 120000 }); await P.waitForTimeout(500)
}
const apiStatus = async () => {
  const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "perf.employee@nts.local", password: "admin123" }) })).json()
  const list = await (await fetch(`${API}/accounting/claims`, { headers: { Authorization: `Bearer ${r.token}` } })).json()
  return (list.data || []).find((c) => c.title === title) || {}
}

try {
  // the employee
  const E = await as("perf.employee@nts.local")
  let s = await E.P.evaluate(() => ({ tabs: [...document.querySelectorAll('[data-al="clm-tab"]')].map((b) => b.dataset.t), denied: !!document.querySelector(".al-denied") }))
  check("an employee without Accounting rights opens Employee Claims, with their own claims only", !s.denied && s.tabs.includes("mine") && !s.tabs.includes("waiting") && !s.tabs.includes("all"), JSON.stringify(s))
  await E.P.click('[data-al="clm-new"]'); await E.P.fill('#alForm [name="title"]', title); await submitForm(E.P)
  await E.P.waitForSelector("#alOverlay .al-modal-wide", { timeout: 120000 })
  let a = await acts(E.P)
  check("the new claim opens with Add item, Submit and Withdraw, and no approval steps", ["clm-add", "clm-submit", "clm-withdraw"].every((x) => a.includes(x)) && !a.some((x) => ["clm-mgr", "clm-review", "clm-approve", "clm-pay"].includes(x)), JSON.stringify(a))
  await E.P.click('#alOverlay [data-al="clm-add"]')
  await E.P.fill('#alForm [name="description"]', "Taxi to client"); await E.P.fill('#alForm [name="amount"]', amount); await submitForm(E.P)
  await E.P.waitForSelector("#alOverlay .al-modal-wide", { timeout: 120000 }); await E.P.waitForTimeout(500)
  const hasLine = await E.P.locator("#alOverlay tr", { hasText: "Taxi to client" }).count()
  await E.P.click('#alOverlay [data-al="clm-submit"]'); await E.P.waitForTimeout(4000)
  check("the employee adds the item and submits the claim", hasLine > 0 && (await apiStatus()).status === "SUBMITTED", JSON.stringify(await apiStatus()))
  await E.ctx.close()

  // the line manager
  const M = await as("acct.cfo@nts.local")
  await openClaim(M.P, "waiting")
  a = await acts(M.P)
  check("the line manager sees it waiting and can approve or return it", a.includes("clm-mgr") && a.includes("clm-return") && !a.includes("clm-submit"), JSON.stringify(a))
  await M.P.click('#alOverlay [data-al="clm-mgr"]'); await M.P.waitForTimeout(4000)
  check("the line manager approves it", (await apiStatus()).status === "MANAGER_APPROVED", (await apiStatus()).status)
  await M.ctx.close()

  // the finance reviewer
  const R = await as("acct.accountant@nts.local")
  await openClaim(R.P, "waiting")
  a = await acts(R.P)
  const picker = await R.P.locator("#alOverlay [data-clm-acc]").count()
  check("the finance reviewer can pick the expense account and review or return it", a.includes("clm-review") && picker > 0 && !a.includes("clm-approve"), JSON.stringify(a))
  await R.P.click('#alOverlay [data-al="clm-review"]'); await R.P.waitForTimeout(4000)
  check("the finance reviewer reviews it", (await apiStatus()).status === "REVIEWED", (await apiStatus()).status)
  await R.ctx.close()

  // the finance manager
  const F = await as("perf.finmgr@nts.local")
  await openClaim(F.P, "waiting")
  a = await acts(F.P)
  check("a finance manager can approve, return or reject it", ["clm-approve", "clm-return", "clm-reject"].every((x) => a.includes(x)), JSON.stringify(a))
  await F.P.click('#alOverlay [data-al="clm-approve"]'); await F.P.waitForSelector("#alOverlay #alForm", { state: "attached", timeout: 60000 })
  if (await F.P.locator('#alForm [name="exceptionNote"]').count()) await F.P.fill('#alForm [name="exceptionNote"]', "UAT: checked with the employee")
  await submitForm(F.P); await F.P.waitForTimeout(2500)
  const approved = await apiStatus()
  check("a finance manager approves it for payment and it is posted", approved.status === "APPROVED" && approved.journalEntryId, JSON.stringify(approved).slice(0, 300))
  await openClaim(F.P, "waiting")
  a = await acts(F.P)
  await F.P.click('#alOverlay [data-al="clm-pay"]'); await F.P.waitForSelector("#alOverlay #alForm", { state: "attached", timeout: 60000 })
  await F.P.fill('#alForm [name="bankReference"]', "UAT-UI"); await submitForm(F.P); await F.P.waitForTimeout(2500)
  const paid = await apiStatus()
  check("a finance manager pays it from a bank account in its currency", a.includes("clm-pay") && paid.status === "REIMBURSED" && paid.reimbursementJournalId, `${JSON.stringify(a)} ${paid.status}`)
  await F.ctx.close()
  check("no script errors", !errors.length, errors.join(" | "))
} catch (e) {
  check("the walkthrough ran to the end", false, e.message.split("\n")[0])
} finally {
  await browser.close()
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
