/**
 * Analytics from the records: pipeline, category, matching, and spend with cash requirements and insights (dev).
 * Read-only.
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-analytics.mjs
 *
 * As the Procurement Manager, the figures shown are checked against the API's records, and none of the vendored page's
 * sample panels (a 287-record funnel, sample owners, bidders and report deliveries) may appear.
 */
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const EMAIL = process.env.UAT_USER || "proc.mgr@nts.local"
const OUT = path.resolve(process.env.OUT || ".")
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
const [orders, invoices, requisitions] = await Promise.all([get("/procurement/purchase-orders"), get("/procurement/invoices?limit=200"), get("/procurement/requisitions")])
const up = (v) => String(v ?? "").toUpperCase()
const n = (v) => Number(v || 0)
const cents = (v) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const live = orders.filter((o) => up(o.status) !== "CANCELLED")
const unpaid = invoices.filter((i) => ["APPROVED", "DRAFT", "PENDING", "PENDING_APPROVAL"].includes(up(i.status)) && !["PAID", "PARTIALLY_PAID"].includes(up(i.paymentStatus)))
const approvedUnpaid = unpaid.filter((i) => up(i.status) === "APPROVED").reduce((t, i) => t + n(i.totalAmount), 0)
const awaiting = unpaid.filter((i) => up(i.status) !== "APPROVED").reduce((t, i) => t + n(i.totalAmount), 0)
const invoicedByPo = new Map()
for (const i of invoices) if (i.purchaseOrderId && up(i.status) !== "REJECTED") invoicedByPo.set(i.purchaseOrderId, (invoicedByPo.get(i.purchaseOrderId) ?? 0) + n(i.totalAmount))
const openCommitments = live
  .filter((o) => ["APPROVED", "SENT", "ACKNOWLEDGED", "PARTIALLY_DELIVERED", "DELIVERED"].includes(up(o.status)))
  .reduce((t, o) => t + Math.max(0, n(o.totalAmount) - (invoicedByPo.get(o.id) ?? 0)), 0)
const today = new Date()
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
const committedThisMonth = live.filter((o) => new Date(o.orderDate || o.createdAt) >= monthStart).reduce((t, o) => t + n(o.totalAmount), 0)
const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
const dept = new Map()
for (const o of live) {
  if (new Date(o.orderDate || o.createdAt) < quarterStart) continue
  const d = requisitions.find((r) => r.id === o.requisitionId)?.department || "No department"
  dept.set(d, (dept.get(d) ?? 0) + n(o.totalAmount))
}
const pendingReqs = requisitions.filter((r) => up(r.status) === "PENDING_APPROVAL").length
const invoicesAwaiting = invoices.filter((i) => ["DRAFT", "PENDING", "PENDING_APPROVAL"].includes(up(i.status))).length
const SAMPLE = /287 active|TechNova|AfriCloud|Vendor clarification|Evaluation Committees|Department Heads|Sourcing Officers|diagnostic equipment/

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await seedAuth(context, BASE, EMAIL, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  const text = () => page.evaluate(() => document.body.innerText)

  await page.goto(`${BASE}/procurement/analytics`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForFunction(() => /Spend, Cash & Insights/.test(document.body.innerText), null, { timeout: LOAD })
  await page.waitForTimeout(4000)
  let t = await text()
  check(!SAMPLE.test(t), "no sample figure, owner or bidder is shown")
  check(t.includes(cents(approvedUnpaid)), "approved invoices not yet paid match the invoices", cents(approvedUnpaid))
  check(t.includes(cents(awaiting)), "invoices awaiting approval match", cents(awaiting))
  check(t.includes(cents(openCommitments)), "orders not yet invoiced match", cents(openCommitments))
  check(t.includes(cents(committedThisMonth)), "committed this month matches", cents(committedThisMonth))
  const deptRows = [...dept.entries()].filter(([, v]) => v > 0)
  check(deptRows.every(([d, v]) => t.includes(d) && t.includes(cents(v))) || (!deptRows.length && /No order was placed this quarter/.test(t)), "top-spending departments this quarter match the orders", deptRows.map(([d, v]) => `${d} ${cents(v)}`).join(", ") || "none")
  check(/Cash requirements/.test(t) && /Timing unknown/.test(t) && /Most reliable vendors/.test(t) && /Cost per item over time/.test(t) && /Items bought above their estimate/.test(t) && /Unusual spending/.test(t), "cash requirements and every insight are there")
  await page.screenshot({ path: path.join(OUT, "analytics-spend.png"), fullPage: true }).catch(() => {})

  // A chart drill-down is how a person reaches each context: the runtime's own chart-drill-v5 action.
  const open = async (ctx) => {
    await page.evaluate((c) => {
      const b = document.createElement("button")
      b.dataset.action = "chart-drill-v5"
      b.dataset.id = c
      b.dataset.label = ""
      document.querySelector("#workspace").appendChild(b)
      b.click()
    }, ctx)
    await page.waitForTimeout(2500)
    return text()
  }
  t = await open("cycle-status")
  check(/Procurement Pipeline & Cycle Status/.test(t) && !SAMPLE.test(t), "the pipeline view opens without sample queues")
  const stageCount = async (label) => page.evaluate((l) => {
    const row = [...document.querySelectorAll("#workspace table tbody tr")].find((r) => r.innerText.startsWith(l))
    return row ? Number(row.children[1]?.innerText) : null
  }, label)
  check((await stageCount("Requisitions awaiting approval")) === pendingReqs, "requisitions awaiting approval match", `${await stageCount("Requisitions awaiting approval")} vs ${pendingReqs}`)
  check((await stageCount("Invoices awaiting approval")) === invoicesAwaiting, "invoices awaiting approval match", `${await stageCount("Invoices awaiting approval")} vs ${invoicesAwaiting}`)

  t = await open("category-spend")
  check(/Category Spend & Supplier Concentration/.test(t) && /Category register/.test(t) && !SAMPLE.test(t), "the category view opens from the records")

  t = await open("invoice-exception")
  const unmatched = invoices.filter((i) => ["DRAFT", "PENDING", "PENDING_APPROVAL"].includes(up(i.status)) && up(i.matchingStatus) !== "MATCHED")
  check(/Three-Way Match & Exceptions/.test(t) && unmatched.every((i) => t.includes(i.invoiceNumber)), "the exception register lists every open unmatched invoice", unmatched.map((i) => i.invoiceNumber).join(", ") || "none")

  t = await open("report-usage")
  check(/Report runs and downloads are not logged/.test(t), "report usage says it is not recorded")
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
