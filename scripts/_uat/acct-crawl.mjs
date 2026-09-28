// Accounting sweep, stage 1: open every Accounting page as a signed-in user and record what it shows — title, text, buttons,
// tabs — with console errors, failed requests and a screenshot. Output: design-refs/accounting-sweep/crawl/<page>.{json,png}.
// Usage: node scripts/_uat/acct-crawl.mjs [email] [page,page…]
import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const FE = process.env.ACCT_FE || "http://localhost:3120"
const email = process.argv[2] || "admin@nts.com"
const only = process.argv[3] ? process.argv[3].split(",") : null
const PAGES = ["", "ceo", "approvals", "close", "general-ledger", "journals", "recurring", "trial-balance", "chart-governance", "cash-book", "bank-reconciliation", "short-term-investments", "payables", "vendors", "receivables", "expenses", "assets", "inventory", "tax", "fx-revaluation", "consolidation", "reports", "timesheets", "integrations", "audit", "vault", "access", "settings"].filter((p) => !only || only.includes(p || "home"))
const out = path.resolve("design-refs/accounting-sweep/crawl", email.split("@")[0])
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
const P = await ctx.newPage(); P.setDefaultTimeout(120000)
let bucket = { console: [], failed: [] }
P.on("console", (m) => { if (m.type() === "error") bucket.console.push(m.text().slice(0, 240)) })
P.on("pageerror", (e) => bucket.console.push("PAGEERROR " + String(e.message).slice(0, 240)))
P.on("response", (r) => { if (r.status() >= 400 && /\/api\//.test(r.url())) bucket.failed.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, "").slice(0, 160)}`) })

for (let i = 0; i < 3; i++) {
  try {
    await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded", timeout: 180000 }); await P.waitForTimeout(2500)
    await P.fill('input[type="email"]', email); await P.fill('input[type="password"]', "admin123")
    await Promise.all([P.waitForURL((u) => !/\/login/.test(String(u)), { timeout: 60000 }), P.click('button[type="submit"]')])
    break
  } catch (e) { if (i === 2) throw e }
}

for (const pg of PAGES) {
  bucket = { console: [], failed: [] }
  const url = `${FE}/accounting${pg ? "/" + pg : ""}`
  const t0 = Date.now()
  try { await P.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 }) } catch (e) { bucket.console.push("NAV " + e.message.split("\n")[0]) }
  // settle: the page has content and the network has been quiet for a moment
  await P.waitForSelector(".accounting-v52-root", { timeout: 120000 }).catch(() => {})
  await P.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {})
  await P.waitForTimeout(2500)
  const info = await P.evaluate(() => {
    const root = document.querySelector(".accounting-v52-root") || document.body
    const vis = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
    const txt = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim()
    const main = root.querySelector("main, .main, #workspace, .workspace, .content") || root
    return {
      url: location.pathname,
      title: txt(main.querySelector("h1") || document.createElement("i")),
      headings: [...main.querySelectorAll("h1,h2,h3")].filter(vis).map(txt).filter(Boolean).slice(0, 40),
      tabs: [...main.querySelectorAll('[role="tab"], .tab, .tabs button, .v12-tab, [class*="tab-btn"]')].filter(vis).map(txt).filter(Boolean).slice(0, 30),
      buttons: [...new Set([...main.querySelectorAll("button, a.btn, [data-action]")].filter(vis).map((b) => `${txt(b).slice(0, 50)}${b.dataset && b.dataset.action ? " {" + b.dataset.action + "}" : ""}`).filter(Boolean))].slice(0, 120),
      text: txt(main).slice(0, 6000),
    }
  }).catch((e) => ({ error: String(e) }))
  info.ms = Date.now() - t0
  info.console = bucket.console.slice(0, 30); info.failed = [...new Set(bucket.failed)].slice(0, 40)
  const name = pg || "home"
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(info, null, 2))
  await P.screenshot({ path: path.join(out, `${name}.png`), fullPage: false }).catch(() => {})
  console.log(`${name.padEnd(24)} ${String(info.ms).padStart(6)}ms  "${(info.title || "").slice(0, 50)}"  buttons=${(info.buttons || []).length} failed=${info.failed.length} errors=${info.console.length}`)
}
await browser.close()
