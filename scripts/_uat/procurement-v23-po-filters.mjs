/**
 * The purchase order register filters by vendor, order date and status (SRD §5 Phase 2), on dev. Read-only.
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-po-filters.mjs
 *
 * As the Procurement Officer: each filter narrows the register to the orders that match it (checked against the API's
 * orders, not the page's own count), a range with no order shows the empty row, Clear restores every order, each row
 * shows its order date, and no eSignature control remains on the page.
 */
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}

const login = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "proc.officer@nts.local", password: "admin123", portal: "staff" }) })).json()
const auth = { Authorization: `Bearer ${login.token || login?.data?.token}` }
const orders = ((await (await fetch(`${API}/procurement/purchase-orders`, { headers: auth })).json())?.data ?? []).filter((o) => String(o.status).toUpperCase() !== "CANCELLED")
console.log(`${orders.length} purchase order(s) from the API`)

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await seedAuth(context, BASE, "proc.officer@nts.local", "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/procurement-v23/purchase-orders`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("#poFiltersV23", { timeout: LOAD })
  const rows = () => page.$$eval("#workspace table tbody tr", (trs) => trs.filter((t) => !t.classList.contains("pr23-empty-row")).map((t) => t.innerText.replace(/\s+/g, " ")))
  await page.waitForFunction((n) => document.querySelectorAll("#workspace table tbody tr:not(.pr23-empty-row)").length >= n, orders.length, { timeout: LOAD }).catch(() => {})
  const all = await rows()
  check(all.length === orders.length, "the register lists every order", `${all.length} rows, ${orders.length} orders`)
  check(orders.every((o) => all.some((r) => r.includes(o.poNumber))), "each order is there by number")
  const withDate = orders.filter((o) => o.orderDate || o.createdAt)
  check(withDate.every((o) => all.some((r) => r.includes(o.poNumber) && /\d{2} [A-Z][a-z]{2} \d{4}/.test(r))), "each row shows its order date")
  check((await page.locator('[data-action="esign-new-v6"], [data-action="signature-queue"]').count()) === 0, "no eSignature action is offered")
  check(!/eSign coverage/.test(await page.evaluate(() => document.body.innerText)), "no eSignature coverage card")

  const vendor = orders[0]?.vendor?.name
  if (vendor) {
    await page.selectOption('[data-po-filter="vendor"]', vendor)
    await page.waitForTimeout(800)
    const expect = orders.filter((o) => o.vendor?.name === vendor).map((o) => o.poNumber)
    const got = await rows()
    check(got.length === expect.length && expect.every((n) => got.some((r) => r.includes(n))), "the vendor filter shows that vendor's orders only", `${vendor}: ${got.length} of ${expect.length}`)
    await page.click('[data-action="po-filters-reset-v23"]')
    await page.waitForTimeout(800)
  }

  const status = await page.$$eval('[data-po-filter="status"] option', (os) => os.map((o) => o.value).filter(Boolean)[0])
  if (status) {
    await page.selectOption('[data-po-filter="status"]', status)
    await page.waitForTimeout(800)
    const got = await rows()
    check(got.length > 0 && got.every((r) => r.includes(status)), "the status filter shows orders in that status only", `${status}: ${got.length}`)
    await page.click('[data-action="po-filters-reset-v23"]')
    await page.waitForTimeout(800)
  }

  const days = withDate.map((o) => new Date(o.orderDate || o.createdAt).toISOString().slice(0, 10)).sort()
  if (days.length) {
    const from = days[days.length - 1]
    await page.fill('[data-po-filter="from"]', from)
    await page.dispatchEvent('[data-po-filter="from"]', "change")
    await page.waitForTimeout(800)
    const expect = withDate.filter((o) => new Date(o.orderDate || o.createdAt).toISOString().slice(0, 10) >= from).map((o) => o.poNumber)
    const got = await rows()
    check(got.length === expect.length && expect.every((n) => got.some((r) => r.includes(n))), "ordered-from keeps the orders on or after that day", `from ${from}: ${got.length} of ${expect.length}`)
    await page.fill('[data-po-filter="to"]', "2000-01-01")
    await page.dispatchEvent('[data-po-filter="to"]', "change")
    await page.waitForTimeout(800)
    check(/No purchase order matches these filters/.test(await page.evaluate(() => document.body.innerText)), "a range with no order says so")
    await page.click('[data-action="po-filters-reset-v23"]')
    await page.waitForTimeout(800)
  }
  check((await rows()).length === orders.length, "Clear filters restores every order")
  await page.screenshot({ path: path.resolve(process.env.OUT || ".", "po-filters.png"), fullPage: true }).catch(() => {})
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
