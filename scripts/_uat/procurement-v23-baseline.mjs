/**
 * Procurement V23 baseline: what every page renders before any live wiring.
 *
 * Per page: the heading, page and console errors, which vendored demo records are on
 * screen, and which [data-action] controls the page offers. Once per run: the runtime's
 * integration surface (base action-handler keys, UI API methods, state snapshot keys).
 *
 * The local database holds no requisitions, purchase orders, RFQs, GRNs or invoices, so a
 * demo record id on screen cannot have come from the API.
 *
 * Run:  node scripts/_uat/procurement-v23-baseline.mjs [--user=<email>] [--out=<file.json>] [--shots=<dir>]
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const staff = MODULES.find((m) => m.portal === "staff")
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const USER = arg("user") || "perf.sysadmin@nts.local"
const OUT = arg("out")
const SHOTS = arg("shots")
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true })

const PAGES = [
  ["dashboard", "/procurement-v23"],
  ["plan", "/procurement-v23/plan"],
  ["approvals", "/procurement-v23/approvals"],
  ["requisitions", "/procurement-v23/requisitions"],
  ["tenders", "/procurement-v23/tenders"],
  ["evaluation", "/procurement-v23/evaluation"],
  ["vendors", "/procurement-v23/vendors"],
  ["contracts", "/procurement-v23/contracts"],
  ["orders", "/procurement-v23/purchase-orders"],
  ["receiving", "/procurement-v23/goods-received"],
  ["invoices", "/procurement-v23/invoices"],
  ["accounts", "/procurement-v23/accounts"],
  ["documents", "/procurement-v23/documents"],
  ["reports", "/procurement-v23/reports"],
  ["audit", "/procurement-v23/audit"],
  ["settings", "/procurement-v23/settings"],
  ["analytics", "/procurement-v23/analytics"],
]

// First record of each fixture array in the runtime's state store, plus the demo owner.
const MARKERS = [
  "PLAN-26-GRP", "PPI-0001", "PR-X8F2-0187", "TN-2026-014", "VEN-00482", "TechNova Solutions",
  "PO-2026-0584", "GRN-2026-0219", "INV-98431", "JE-P2P-00881", "FA-000882", "DOC-00184",
  "RPT-0104", "T. Moyo",
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await seedAuth(context, staff.base, USER, staff.portal)
const page = await context.newPage()
page.setDefaultTimeout(60000)

const errors = []
page.on("pageerror", (e) => errors.push({ kind: "pageerror", text: String(e.message || e).slice(0, 300) }))
page.on("console", (m) => { if (m.type() === "error") errors.push({ kind: "console", text: m.text().slice(0, 300) }) })

const result = { user: USER, base: staff.base, surface: null, pages: [] }

for (const [id, route] of PAGES) {
  errors.length = 0
  await page.goto(staff.base + route, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".procurement-v23-root", { timeout: 60000 }).catch(() => {})
  await page.waitForFunction(() => (document.querySelector(".procurement-v23-root")?.innerText || "").length > 200, null, { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1500)

  const m = await page.evaluate((markers) => {
    const root = document.querySelector(".procurement-v23-root")
    const text = root?.innerText || ""
    const heading = [...(root?.querySelectorAll("h1, h2") || [])].map((h) => h.innerText.trim()).find(Boolean) || null
    const actions = [...new Set([...(root?.querySelectorAll("[data-action]") || [])].map((el) => el.dataset.action))].sort()
    return {
      url: location.pathname,
      heading,
      textLength: text.length,
      demoOnScreen: markers.filter((mk) => text.includes(mk)),
      actions,
    }
  }, MARKERS)

  if (!result.surface) {
    result.surface = await page.evaluate(() => {
      const ui = window.MatanhoProcurementUI
      let snapshotKeys = null
      try { snapshotKeys = Object.keys(ui?.getSnapshot?.() || {}) } catch {}
      return {
        baseHandlerKeys: Object.keys(window.MatanhoProcurementHandlers || {}).sort(),
        uiApi: ui ? Object.keys(ui).sort() : null,
        snapshotKeys,
        namespaces: Object.keys(window).filter((k) => /^MatanhoProcurement/.test(k)).sort(),
      }
    })
  }

  result.pages.push({ id, route, ...m, errors: [...errors] })
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${id}.png`) })
  console.log(
    `${id.padEnd(13)} ${String(m.textLength).padStart(6)} chars  demo=${m.demoOnScreen.length}  actions=${m.actions.length}  errors=${errors.length}  "${(m.heading || "").slice(0, 50)}"`,
  )
}

await browser.close()

const s = result.surface
console.log(`\nbase handler keys: ${s.baseHandlerKeys.length} · UI API: ${(s.uiApi || []).join(", ")}`)
console.log(`snapshot keys: ${(s.snapshotKeys || []).join(", ")}`)
const allActions = new Set(result.pages.flatMap((p) => p.actions))
const unbound = [...allActions].filter((a) => !s.baseHandlerKeys.includes(a)).sort()
console.log(`actions seen on pages: ${allActions.size} · without a base handler (handled by a later layer, or dead): ${unbound.length}`)
console.log(`  ${unbound.join(", ")}`)
const withDemo = result.pages.filter((p) => p.demoOnScreen.length)
console.log(`pages showing vendored demo records: ${withDemo.length}/${result.pages.length}`)

if (OUT) {
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
  console.log(`wrote ${OUT}`)
}
