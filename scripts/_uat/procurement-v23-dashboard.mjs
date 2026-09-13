/**
 * The Command Centre carries the SRD §7 dashboard cards, from the records (dev). Read-only.
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-dashboard.mjs
 *
 * As the Procurement Manager, each card is checked against the API rather than against the page's own figures:
 *   Awaiting my approval   the count of requisitions waiting on this person (their pending-approval queue)
 *   Spend by department    order value per department for the selected range, the exact amount on hover, and a
 *                          range change that re-draws it
 *   Invoices to review     every open invoice with a match flag, no purchase order, or a disagreeing reading
 *   Recent POs             the latest orders by order date, each with a quick view
 */
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const EMAIL = process.env.UAT_USER || "proc.mgr@nts.local"
const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}

const login = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: "admin123", portal: "staff" }) })).json()
const auth = { Authorization: `Bearer ${login.token || login?.data?.token}` }
const get = async (p) => {
  const j = await (await fetch(API + p, { headers: auth })).json().catch(() => ({}))
  return Array.isArray(j?.data) ? j.data : []
}
const [queue, orders, invoices, requisitions] = await Promise.all([
  get("/procurement/requisitions/pending-approval"),
  get("/procurement/purchase-orders"),
  get("/procurement/invoices?limit=200"),
  get("/procurement/requisitions"),
])
const live = orders.filter((o) => String(o.status).toUpperCase() !== "CANCELLED")
const deptOf = (o) => requisitions.find((r) => r.id === o.requisitionId)?.department || "No department"
const quarterStart = (() => { const n = new Date(); return new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1) })()
const yearStart = new Date(new Date().getFullYear(), 0, 1)
const spend = (start) => {
  const m = new Map()
  for (const o of live) {
    const d = o.orderDate || o.createdAt
    if (start && (!d || new Date(d) < start)) continue
    m.set(deptOf(o), (m.get(deptOf(o)) ?? 0) + Number(o.totalAmount || 0))
  }
  return m
}
const cents = (v) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const open = ["DRAFT", "PENDING", "PENDING_APPROVAL"]
const flagged = invoices.filter((i) => {
  if (!open.includes(String(i.status).toUpperCase())) return false
  const flags = i.aiDiscrepancies?.flags ?? []
  const reading = i.ocrData
  return flags.length > 0 || String(i.matchingStatus).toUpperCase() === "NO_PO" || (reading?.status === "READ" && reading?.comparison?.agrees === false)
})

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await seedAuth(context, BASE, EMAIL, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/procurement-v23`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("[data-dash-awaiting]", { timeout: LOAD })
  await page.waitForTimeout(3000)

  const count = Number((await page.locator("[data-dash-awaiting]").first().innerText()).trim())
  check(count === queue.length, "Awaiting my approval counts the requisitions waiting on me", `card ${count}, queue ${queue.length}`)
  check((await page.locator('[data-page="approvals"]').count()) > 0, "and links to the approval list")

  const bars = async () => page.$$eval("[data-dash-spend] .bar-row", (rs) => rs.map((r) => [r.querySelector("span")?.textContent?.trim(), r.getAttribute("title")]))
  const expectQ = spend(quarterStart)
  const q = await bars()
  const qOk = [...expectQ.entries()].filter(([, v]) => v > 0).every(([d, v]) => q.some(([label, title]) => label === d && title === `${d}: ${cents(v)}`)) && q.length === [...expectQ.values()].filter((v) => v > 0).length
  check(qOk || (!q.length && ![...expectQ.values()].some((v) => v > 0)), "Spend by department this quarter matches the orders, to the cent on hover", JSON.stringify(q).slice(0, 200))
  await page.selectOption("[data-dash-range]", "year")
  await page.waitForTimeout(1200)
  const expectY = spend(yearStart)
  const y = await bars()
  const yOk = [...expectY.entries()].filter(([, v]) => v > 0).every(([d, v]) => y.some(([label, title]) => label === d && title === `${d}: ${cents(v)}`))
  check(yOk, "changing the range to this year re-draws it from the year's orders", JSON.stringify(y).slice(0, 200))
  await page.selectOption("[data-dash-range]", "all")
  await page.waitForTimeout(1200)
  const all = await bars()
  const expectAll = spend(null)
  check([...expectAll.entries()].filter(([, v]) => v > 0).every(([d, v]) => all.some(([label, title]) => label === d && title === `${d}: ${cents(v)}`)), "all time covers every order", JSON.stringify(all).slice(0, 200))

  const reviewText = await page.locator("[data-dash-review]").first().innerText()
  if (flagged.length) {
    check(flagged.slice(0, 5).every((i) => reviewText.includes(i.invoiceNumber)), "Invoices to review lists the flagged invoices", flagged.map((i) => i.invoiceNumber).join(", "))
    check(/Price above the order|Item not on the order|Quantity above|Possible duplicate|Supplier's document differs|No purchase order/.test(reviewText), "each with a brief reason", reviewText.replace(/\s+/g, " ").slice(0, 160))
  } else {
    check(/Nothing to review/.test(reviewText), "Invoices to review says nothing is flagged, as the API agrees")
  }

  const recentText = await page.locator("[data-dash-recent-pos]").first().innerText()
  const latest = [...live].sort((a, b) => String(b.orderDate || b.createdAt).localeCompare(String(a.orderDate || a.createdAt))).slice(0, Math.min(6, live.length))
  check(latest.every((o) => recentText.includes(o.poNumber)), "Recent purchase orders shows the latest orders", latest.map((o) => o.poNumber).join(", "))
  check((await page.locator('[data-dash-recent-pos] [data-action="preview-po-v6"], [data-dash-recent-pos] .row-actions-trigger-v16').count()) > 0 || !latest.length, "each with a quick view")
  await page.screenshot({ path: path.resolve(process.env.OUT || ".", "dashboard-srd.png"), fullPage: true }).catch(() => {})
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
