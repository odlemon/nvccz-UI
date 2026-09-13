/**
 * Procurement invoices paid from Accounting Payables, from the records (dev).
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/accounting-v52-payables.mjs
 *
 * Needs an approved, unpaid procurement invoice from a UAT vendor: scripts/procurement-ops/dev_p2p_flow.py (without
 * --pay) leaves one. As Accounts Payable:
 *   - Payables shows the invoice in the bill register and the payment queue, and none of the prototype's sample bills
 *     or figures;
 *   - the bill workspace shows its real lines against the order, its amounts and who approved it;
 *   - Pay refuses without a proof of payment, then pays with one;
 *   - the bill reads Paid, and procurement shows the invoice paid with its payment journal.
 * The payment is on a UAT vendor's invoice, which dev_cleanup_procurement.mjs removes with its journal and cashbook
 * entry.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const OUT = path.resolve(process.env.OUT || ".accounting-payables")
const PROOF = path.join(HERE, "fixtures", "invoices", "msasa-boardroom.pdf")
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
async function login(email) {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123", portal: "staff" }) })
  const j = await r.json().catch(() => ({}))
  const token = j.token || j?.data?.token
  if (!token) throw new Error(`${email} could not sign in (${r.status})`)
  return { Authorization: `Bearer ${token}` }
}
const ap = await login("proc.ap@nts.local")
const invoices = async () => {
  const j = await (await fetch(`${API}/procurement/invoices?limit=200`, { headers: ap })).json().catch(() => ({}))
  return Array.isArray(j?.data) ? j.data : []
}
const target = (await invoices()).find(
  (i) => /\bUAT\b/.test(i.vendor?.name ?? "") && String(i.status).toUpperCase() === "APPROVED" && String(i.paymentStatus).toUpperCase() !== "PAID",
)
if (!target) {
  console.log("No approved, unpaid UAT procurement invoice on dev. Run scripts/procurement-ops/dev_p2p_flow.py first.")
  process.exit(1)
}
console.log(`invoice ${target.invoiceNumber} · ${target.vendor?.name} · ${target.totalAmount} · PO ${target.purchaseOrder?.poNumber ?? "none"}`)

const SAMPLE = /BILL-2026-0318|Dube & Partners|\$270\.8k|Chipo Ndlovu|Professional and custody services|Cloud infrastructure subscription|96% of supplier spend/
const browser = await chromium.launch()
const waitText = (page, re, timeout = LOAD) =>
  page.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout }).then(() => true).catch(() => false)
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await seedAuth(context, BASE, "proc.ap@nts.local", "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/accounting/payables`, { waitUntil: "domcontentloaded", timeout: LOAD })
  check(await waitText(page, /Payables · Procurement to Payment/), "Payables opens for Accounts Payable")
  // The landing counts the queue; the invoice itself is listed on the Bills and Payment queue tabs below.
  check(await waitText(page, /Approved, awaiting payment\s+[1-9]\d* invoices?/), "the landing counts it as approved, awaiting payment")
  check(await waitText(page, /\$\s?[1-9][\d,.]*[kKmM]?\s+Approved to pay/, 30000), "and Approved to pay is not nil")
  check((await page.locator("#v5ProfileMenu").count()) === 0 && !/Tariro Moyo/.test(await page.evaluate(() => document.body.innerText)), "no prototype profile menu or demo user on the page")
  // Every Accounting style is scoped to .accounting-v52-root: a prototype layer appended to <body> renders unstyled.
  const strays = await page.evaluate(() => [...document.body.children].filter((el) => /^v\d+/.test(el.id || "") || [...el.classList].some((c) => /^v\d+-/.test(c))).map((el) => el.id || el.className))
  check(strays.length === 0, "no Accounting layer sits outside the module root, unstyled", strays.join(", "))
  check(!SAMPLE.test(await page.evaluate(() => document.body.innerText)), "no sample bill or figure is shown")

  await page.locator('[data-v28="tab"][data-key="ap"][data-id="bills"]').first().click()
  const row = page.locator(`tr[data-v28="ap-bill"][data-id="${target.invoiceNumber}"]`)
  await row.first().waitFor({ timeout: 60000 })
  const rowText = await row.first().innerText()
  check(/Procurement/.test(rowText) && /Approved/.test(rowText), "the bill register says it came from procurement and is approved", rowText.replace(/\s+/g, " ").slice(0, 160))

  await page.locator('[data-v28="tab"][data-key="ap"][data-id="queue"]').first().click()
  check(await waitText(page, /Payment queue/, 30000), "the payment queue opens")
  check((await page.locator(`[data-v28="aplive-pay"][data-id="${target.invoiceNumber}"]`).count()) > 0, "the invoice is in the payment queue with a Pay button")

  await page.locator('[data-v28="tab"][data-key="ap"][data-id="bills"]').first().click()
  await page.locator(`tr[data-v28="ap-bill"][data-id="${target.invoiceNumber}"]`).first().click()
  check(await waitText(page, /Invoice lines against the order/, 30000), "the bill workspace opens with the invoice lines")
  const detail = await page.evaluate(() => document.body.innerText)
  const firstItem = target.items?.[0]?.itemName
  check(firstItem && detail.includes(firstItem), "it shows the invoice's own lines", firstItem)
  check(/Approved by|Approved automatically/.test(detail), "it says who approved it")
  check(!SAMPLE.test(detail), "and no sample match, coding or approver")
  await page.screenshot({ path: path.join(OUT, "bill-workspace.png"), fullPage: true })

  await page.locator(`[data-v28="aplive-pay"][data-id="${target.invoiceNumber}"]`).first().click()
  await page.waitForSelector("#ac52PayBank", { timeout: 30000 })
  check((await page.locator("#ac52PayBank option").count()) > 0, "the payment offers the live bank accounts")
  check(await page.locator("#ac52PayAmount").evaluate((el) => el.readOnly), "the amount is the full outstanding balance")
  await page.locator("#ac52PayRef").fill(`UAT-PAY-${Date.now()}`)
  await page.locator(`[data-v28="aplive-pay-confirm"][data-id="${target.invoiceNumber}"]`).click()
  check(await waitText(page, /Attach the proof of payment/, 10000), "paying without a proof of payment is refused")
  await page.locator("#ac52PayProof").setInputFiles(PROOF)
  await page.screenshot({ path: path.join(OUT, "pay-modal.png"), fullPage: false })
  await page.locator(`[data-v28="aplive-pay-confirm"][data-id="${target.invoiceNumber}"]`).click()
  check(await waitText(page, new RegExp(`${target.invoiceNumber} paid`), 120000), "the payment is confirmed")

  let after
  for (let i = 0; i < 12; i++) {
    after = (await invoices()).find((x) => x.id === target.id)
    if (String(after?.paymentStatus).toUpperCase() === "PAID") break
    await new Promise((r) => setTimeout(r, 5000))
  }
  check(String(after?.paymentStatus).toUpperCase() === "PAID", "procurement shows the invoice paid", after?.paymentStatus)
  check(Boolean(after?.journalEntry?.referenceNumber || after?.journalEntryId), "with its payment journal", after?.journalEntry?.referenceNumber ?? after?.journalEntryId ?? "none")
  check(Boolean(after?.paymentReference?.startsWith("UAT-PAY-")), "and the bank reference entered in Accounting", after?.paymentReference)

  await page.goto(`${BASE}/accounting/payables`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await waitText(page, /Payables · Procurement to Payment/)
  await page.locator('[data-v28="tab"][data-key="ap"][data-id="bills"]').first().click()
  const paidRow = page.locator(`tr[data-v28="ap-bill"][data-id="${target.invoiceNumber}"]`)
  await paidRow.first().waitFor({ timeout: 60000 })
  check(/Paid/.test(await paidRow.first().innerText()), "the bill register reads Paid")
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
  await context.close()
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}

const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
console.log(`screenshots in ${OUT}`)
process.exit(passed === results.length ? 0 : 1)
