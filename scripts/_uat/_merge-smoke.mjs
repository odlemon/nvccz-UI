// Post-merge smoke: each staff route loads without a page error or the Next error overlay and draws content.
import { chromium } from "playwright"
const FE = process.env.FE || "http://localhost:3120"
const ROUTES = (process.env.ROUTES || "/home,/payroll,/payroll/employees,/payroll/runs,/accounting,/accounting/claims,/procurement,/procurement/requisitions,/procurement/tenders,/procurement/vendors,/procurement/orders,/performance,/portfolio,/admin,/admin/users").split(",")
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } }); const P = await ctx.newPage(); P.setDefaultTimeout(180000)
await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded" }); await P.waitForTimeout(2000)
await P.fill('input[type="email"]', "perf.sysadmin@nts.local"); await P.fill('input[type="password"]', "admin123")
await Promise.all([P.waitForURL((u) => !/\/login/.test(String(u)), { timeout: 240000 }), P.click('button[type="submit"]')])
let bad = 0
for (const r of ROUTES) {
  const errs = []; const h = (e) => errs.push(String(e.message).slice(0, 140)); P.on("pageerror", h)
  let status = 0, text = "", overlay = false
  try {
    const resp = await P.goto(`${FE}${r}`, { waitUntil: "domcontentloaded", timeout: 240000 }); status = resp ? resp.status() : 0
    await P.waitForTimeout(Number(process.env.WAIT||9000))
    text = await P.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim())
    overlay = /Application error|Internal Server Error|This page could not be found|Unhandled Runtime Error/i.test(text)
  } catch (e) { errs.push("nav: " + e.message.split("\n")[0]) }
  P.off("pageerror", h)
  const ok = status < 400 && !overlay && !errs.length && text.length > 120
  if (!ok) bad++
  console.log(`${ok ? "PASS" : "FAIL"}  ${r}  status=${status} chars=${text.length}${overlay ? " OVERLAY" : ""} ${errs.join(" | ")}${ok ? "" : "  :: " + text.slice(0, 120)}`)
}
await b.close(); console.log(`\n${ROUTES.length - bad}/${ROUTES.length} routes ok`)
