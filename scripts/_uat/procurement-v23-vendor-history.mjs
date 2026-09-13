/**
 * A vendor's history on its profile (SRD §3 "vendor history: past POs, invoices received, flagged discrepancies" and §2
 * vendor performance), checked against the API on dev. Read-only.
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-vendor-history.mjs
 *
 * As the Procurement Manager, for the vendor with the most orders and invoices: the profile's Purchase orders, Invoices
 * received and On-time delivery figures equal what the registers say; every order, invoice and priced item is listed;
 * and nothing on the profile says it has no source or is not connected.
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
const [orders, invoices, grns] = await Promise.all([
  get("/procurement/purchase-orders"),
  get("/procurement/invoices?limit=200"),
  get("/procurement/goods-received-notes"),
])

const liveOrders = orders.filter((o) => String(o.status).toUpperCase() !== "CANCELLED")
const vendorIds = [...new Set([...liveOrders.map((o) => o.vendorId), ...invoices.map((i) => i.vendorId)].filter(Boolean))]
const historyOf = (vendorId) => {
  const vOrders = liveOrders.filter((o) => o.vendorId === vendorId)
  const poIds = new Set(vOrders.map((o) => o.id))
  const vInvoices = invoices.filter((i) => i.vendorId === vendorId)
  const vGrns = grns.filter((g) => poIds.has(g.purchaseOrderId ?? g.purchaseOrder?.id))
  const timed = vGrns.filter((g) => g.receivedDate && g.purchaseOrder?.expectedDeliveryDate)
  const onTime = timed.filter((g) => new Date(g.receivedDate) <= new Date(g.purchaseOrder.expectedDeliveryDate)).length
  const flagged = vInvoices.filter((i) => (i.aiDiscrepancies?.flags ?? []).length > 0 || i.ocrData?.comparison?.agrees === false).length
  const items = [...new Set(vOrders.flatMap((o) => (o.items ?? []).filter((it) => Number(it.unitPrice) > 0 && String(it.itemName ?? "").trim()).map((it) => String(it.itemName).trim())))]
  const name = vOrders[0]?.vendor?.name || vInvoices[0]?.vendor?.name
  return { vendorId, name, orders: vOrders, invoices: vInvoices, timed: timed.length, onTime, flagged, items }
}
const target = vendorIds.map(historyOf).filter((h) => h.name && h.orders.length).sort((a, b) => b.orders.length + b.invoices.length - (a.orders.length + a.invoices.length))[0]
if (!target) {
  console.log("No vendor with a purchase order on dev.")
  process.exit(1)
}
console.log(`vendor ${target.name}: ${target.orders.length} order(s), ${target.invoices.length} invoice(s) (${target.flagged} flagged), ${target.onTime} of ${target.timed} timed receipt(s) on time, ${target.items.length} priced item(s)`)

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await seedAuth(context, BASE, EMAIL, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/procurement/vendors`, { waitUntil: "domcontentloaded", timeout: LOAD })
  const row = page.locator("#workspace table tbody tr", { hasText: target.name }).first()
  await row.waitFor({ timeout: LOAD })

  // The compliance chips and their filter count the same vendors: "Expired / missing" is no tax clearance on file or one
  // already past (the filter once read the row chip "Missing" and showed none of the vendors its chip counted).
  const vendors = await get("/accounting/vendors")
  const expiredOrMissing = vendors.filter((v) => !v.taxClearanceExpiryDate || new Date(v.taxClearanceExpiryDate).getTime() < Date.now()).length
  const expiredChip = page.locator('[data-action="vendor-compliance-filter-v6"][data-id="Expired"]').first()
  if (await expiredChip.count()) {
    await expiredChip.click()
    const said = await page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast], #toasts .toast")].map((t) => t.innerText).find((t) => /vendors have expired or missing tax clearance/.test(t)) || null, null, { timeout: 15000 }).then((h) => h.jsonValue()).catch(() => null)
    const shownRows = await page.$$eval("#workspace table tbody tr", (trs) => trs.filter((t) => t.querySelector(".vendor-doc-chip-v6") && t.style.display !== "none").length)
    check(new RegExp(`^[^0-9]*${expiredOrMissing} of ${vendors.length} vendors`).test((said || "").replace(/\s+/g, " ").replace(/^.*?(\d+ of \d+ vendors)/, "$1")) && shownRows === expiredOrMissing, "the Expired / missing filter shows the vendors its chip counts", `${said ? said.replace(/\s+/g, " ") : "no toast"} · ${shownRows} rows shown · API ${expiredOrMissing} of ${vendors.length}`)
    await expiredChip.click()
    await page.waitForTimeout(500)
  } else check(false, "the Expired / missing filter shows the vendors its chip counts", "no compliance chip on the registry")
  await row.locator("td").first().click()
  const opened = await page.waitForFunction(() => /Item prices over time/.test(document.querySelector("#workspace")?.innerText || ""), null, { timeout: 60000 }).then(() => true).catch(() => false)
  check(opened, "the vendor's row opens its profile with the history")
  const ws = (await page.locator("#workspace").innerText()).replace(/\s+/g, " ")
  check(ws.includes(target.name), "the profile is this vendor's", target.name)

  const kpis = await page.$$eval("#workspace .kpi", (cards) =>
    Object.fromEntries(cards.map((c) => [c.querySelector(".kpi-label")?.innerText.trim(), { value: c.querySelector(".kpi-value")?.innerText.trim(), sub: c.querySelector(".kpi-sub")?.innerText.trim() }])),
  )
  const po = kpis["Purchase orders"]
  check(po && Number(po.value) === target.orders.length && /ordered, not cancelled/.test(po.sub || ""), "Purchase orders equals the register", `${po?.value} · ${po?.sub} (expected ${target.orders.length})`)
  const inv = kpis["Invoices received"]
  check(inv && Number(inv.value) === target.invoices.length && (inv.sub || "").startsWith(`${target.flagged} flagged for review`), "Invoices received and flagged equal the register", `${inv?.value} · ${inv?.sub} (expected ${target.invoices.length}, ${target.flagged} flagged)`)
  const ot = kpis["On-time delivery"]
  const expectPct = target.timed ? `${Math.round((target.onTime / target.timed) * 100)}%` : "—"
  const expectSub = target.timed ? `${target.onTime} of ${target.timed} receipts by the order's delivery date` : "No receipt against a delivery date yet"
  check(ot && ot.value === expectPct && ot.sub === expectSub, "On-time delivery equals the receipts against the delivery date", `${ot?.value} · ${ot?.sub} (expected ${expectPct} · ${expectSub})`)

  const shownOrders = target.orders.slice(0, 8).map((o) => o.poNumber)
  check(shownOrders.every((n) => ws.includes(n)), "every order is listed", shownOrders.filter((n) => !ws.includes(n)).join(", ") || shownOrders.join(", "))
  const shownInvoices = target.invoices.slice(0, 8).map((i) => i.invoiceNumber)
  check(shownInvoices.every((n) => ws.includes(n)), "every invoice is listed", shownInvoices.filter((n) => !ws.includes(n)).join(", ") || shownInvoices.join(", ") || "none")
  const shownItems = target.items.slice(0, 10)
  check(shownItems.every((n) => ws.includes(n)), "every priced item has its price history", shownItems.filter((n) => !ws.includes(n)).join(", ") || shownItems.join(", "))
  check(!/No live source|not connected/i.test(ws), "nothing on the profile says it has no source or is not connected")
  await page.screenshot({ path: path.join(OUT, "vendor-history.png"), fullPage: false }).catch(() => {})
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
  await context.close()
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
