/**
 * Full-length screenshots of every Procurement V23 page as each persona, for a person to read.
 *
 * The module scrolls inside its own layout, so a normal full-page screenshot stops at the fold.
 * Each page is first rendered in a viewport as tall as its content. Read-only: nothing is clicked.
 *
 * Run:  node scripts/_uat/procurement-v23-screens.mjs --out=<dir> [--users=a@x,b@y] [--pages=plan,invoices]
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const staff = MODULES.find((m) => m.portal === "staff")
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean)

const USERS = list(arg("users")).length ? list(arg("users")) : [
  "proc.mgr@nts.local", "perf.sysadmin@nts.local", "proc.officer@nts.local", "proc.buyer@nts.local",
  "proc.requester@nts.local", "perf.deptmgr@nts.local", "proc.ap@nts.local", "payroll.finmgr@nts.local",
  "payroll.cfo@nts.local", "payroll.intaudit@nts.local",
]
const PAGES = [
  ["dashboard", "/procurement-v23"], ["plan", "/procurement-v23/plan"], ["approvals", "/procurement-v23/approvals"],
  ["requisitions", "/procurement-v23/requisitions"], ["tenders", "/procurement-v23/tenders"],
  ["quotations", "/procurement-v23/quotations"], ["evaluation", "/procurement-v23/evaluation"],
  ["vendors", "/procurement-v23/vendors"], ["contracts", "/procurement-v23/contracts"],
  ["orders", "/procurement-v23/purchase-orders"], ["receiving", "/procurement-v23/goods-received"],
  ["invoices", "/procurement-v23/invoices"], ["accounts", "/procurement-v23/accounts"],
  ["documents", "/procurement-v23/documents"], ["reports", "/procurement-v23/reports"],
  ["audit", "/procurement-v23/audit"], ["settings", "/procurement-v23/settings"], ["analytics", "/procurement-v23/analytics"],
].filter(([id]) => !list(arg("pages")).length || list(arg("pages")).includes(id))
const OUT = path.resolve(arg("out") || ".procurement-screens")
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
for (const email of USERS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await seedAuth(context, staff.base, email, staff.portal)
  const page = await context.newPage()
  for (const [id, route] of PAGES) {
    const file = path.join(OUT, `${email.split("@")[0].replace(/\./g, "-")}--${id}.png`)
    try {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(staff.base + route, { waitUntil: "domcontentloaded", timeout: 90000 })
      await page.waitForSelector(".procurement-v23-root", { timeout: 60000 })
      await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: 45000 }).catch(() => {})
      await page.waitForTimeout(1500)
      // The tallest scrolling region decides how tall the page really is.
      const height = await page.evaluate(() => {
        let best = document.documentElement.scrollHeight
        for (const el of document.querySelectorAll("*")) {
          const s = getComputedStyle(el)
          if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 20) best = Math.max(best, el.scrollHeight + el.getBoundingClientRect().top)
        }
        return Math.ceil(best)
      })
      await page.setViewportSize({ width: 1440, height: Math.min(Math.max(height, 900), 9000) })
      await page.waitForTimeout(600)
      await page.screenshot({ path: file, fullPage: true })
      console.log(`${email} ${id} ${height}px`)
    } catch (e) {
      console.log(`${email} ${id} FAILED ${String(e.message || e).split("\n")[0].slice(0, 160)}`)
    }
  }
  await context.close()
}
await browser.close()
