/**
 * Procurement V23 at tablet and phone widths, read-only. For each page: does the page scroll sideways, are controls
 * clipped off-screen or covered, is the navigation reachable. Screenshots for a person to read.
 *
 *   node scripts/_uat/procurement-v23-responsive.mjs --out=<dir> [--users=a@x,b@y] [--pages=approvals,invoices]
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { seedAuth, STAFF_BASE } from "./_routes.mjs"

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean)
const OUT = path.resolve(arg("out") || ".procurement-responsive")
const USERS = list(arg("users")).length ? list(arg("users")) : ["proc.mgr@nts.local", "proc.requester@nts.local"]
const PAGES = [
  ["dashboard", "/procurement-v23"], ["approvals", "/procurement-v23/approvals"], ["requisitions", "/procurement-v23/requisitions"],
  ["tenders", "/procurement-v23/tenders"], ["vendors", "/procurement-v23/vendors"], ["orders", "/procurement-v23/purchase-orders"],
  ["invoices", "/procurement-v23/invoices"], ["documents", "/procurement-v23/documents"], ["audit", "/procurement-v23/audit"],
].filter(([id]) => !list(arg("pages")).length || list(arg("pages")).includes(id))
const WIDTHS = [["tablet", 768, 1024], ["phone", 390, 844]]
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
fs.mkdirSync(OUT, { recursive: true })

const rows = []
const browser = await chromium.launch()
try {
  for (const email of USERS) {
    for (const [label, width, height] of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 })
      await seedAuth(context, STAFF_BASE, email, "staff")
      const page = await context.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)))
      for (const [id, route] of PAGES) {
        const mark = errors.length
        try {
          await page.goto(STAFF_BASE + route, { waitUntil: "domcontentloaded", timeout: LOAD })
          await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: LOAD }).catch(() => {})
          await page.waitForTimeout(2500)
          const m = await page.evaluate(() => {
            const vw = window.innerWidth
            const root = document.querySelector(".procurement-v23-root")
            // What the viewport can scroll. body.scrollWidth also counts the closed side drawer parked off-screen, which
            // no one can scroll to, and reported 799px of "sideways scroll" on pages that do not scroll.
            const docOverflow = document.documentElement.scrollWidth - vw
            // Controls in the page head and KPI cards that run past the viewport's right edge.
            const clipped = [...document.querySelectorAll(".page-head [data-action], .page-head button, .grid.kpis > *")]
              .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 2 || r.left < -2) })
              .map((el) => (el.textContent || "").trim().slice(0, 30))
            // Head buttons covered by something else at their centre.
            const covered = [...document.querySelectorAll(".page-head [data-action]")]
              .filter((el) => {
                const r = el.getBoundingClientRect()
                if (!r.width || r.right > vw || r.bottom > window.innerHeight) return false
                const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
                return hit && hit !== el && !el.contains(hit)
              })
              .map((el) => (el.textContent || "").trim().slice(0, 30))
            const navToggle = document.querySelector('[data-action="toggle-mobile-menu"], [data-action="mobile-menu"], [data-action="toggle-sidebar"]')
            const nav = document.querySelector("#nav")
            const navVisible = nav ? nav.getBoundingClientRect().width > 0 && getComputedStyle(nav).visibility !== "hidden" : false
            return {
              heading: document.querySelector(".page-head h1")?.textContent?.trim() || null,
              docOverflow,
              clipped,
              covered,
              navReachable: navVisible || Boolean(navToggle),
              rendered: Boolean(root && root.innerText.length > 200),
            }
          })
          const file = `${email.split("@")[0].replace(/\./g, "-")}--${label}--${id}.png`
          await page.screenshot({ path: path.join(OUT, file) })
          const problems = []
          if (!m.rendered) problems.push("did not render")
          if (m.docOverflow > 4) problems.push(`page scrolls sideways by ${m.docOverflow}px`)
          if (m.clipped.length) problems.push(`clipped: ${m.clipped.join(" | ")}`)
          if (m.covered.length) problems.push(`covered: ${m.covered.join(" | ")}`)
          if (!m.navReachable) problems.push("no way to reach the navigation")
          if (errors.length > mark) problems.push(`page errors: ${errors.slice(mark).join(" | ")}`)
          rows.push({ email, label, id, heading: m.heading, problems, file })
          console.log(`${problems.length ? "ISSUE" : "ok   "} ${email.padEnd(26)} ${label.padEnd(6)} ${id.padEnd(12)} ${problems.join(" · ")}`)
        } catch (e) {
          rows.push({ email, label, id, problems: [`could not load: ${String(e.message).slice(0, 120)}`] })
          console.log(`ISSUE ${email.padEnd(26)} ${label.padEnd(6)} ${id.padEnd(12)} could not load: ${String(e.message).slice(0, 120)}`)
        }
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
}
fs.writeFileSync(path.join(OUT, "responsive.json"), JSON.stringify(rows, null, 2))
const issues = rows.filter((r) => r.problems.length)
console.log(`=== RESULT === ${rows.length - issues.length}/${rows.length} page views without a layout problem`)
