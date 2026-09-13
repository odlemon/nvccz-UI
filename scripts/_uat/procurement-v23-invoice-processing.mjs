/**
 * The invoice processing screen (SRD §7): read an invoice, check it beside its document, and flag it for review (dev).
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *   UAT_DELETE_INVOICES_CMD="python dev_api_node.py dev_delete_invoices.mjs {ids}" \
 *     node scripts/_uat/procurement-v23-invoice-processing.mjs
 *
 * As Accounts Payable, against the demo order PO_20260908_0004 with the supplier's own PDF: the document shows with the
 * values read highlighted, the capture form is prefilled beside it, and Flag for review saves the invoice with the
 * reason. The reason is on the invoice, the Finance Manager is alerted with it, and Invoices to review lists it.
 * Refusals: flagging needs a reason, and a requester cannot flag. The invoice is removed afterwards.
 */
import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PDF = path.join(HERE, "fixtures", "invoices", "msasa-boardroom.pdf")
const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const DELETE = process.env.UAT_DELETE_INVOICES_CMD || ""
const OUT = path.resolve(process.env.OUT || ".")
const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
async function login(email) {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123", portal: "staff" }) })
  const j = await r.json().catch(() => ({}))
  return { id: (j.user || j?.data?.user || {}).id, auth: { Authorization: `Bearer ${j.token || j?.data?.token}` } }
}
const ap = await login("proc.ap@nts.local")
const finmgr = await login("payroll.finmgr@nts.local")
const requester = await login("proc.requester@nts.local")
const list = async (p, who) => {
  const j = await (await fetch(API + p, { headers: who.auth })).json().catch(() => ({}))
  return Array.isArray(j?.data) ? j.data : j?.data?.notifications ?? []
}
const created = []
const note = `UAT processing: the chair price is above the quote ${Date.now()}`

const browser = await chromium.launch()
try {
  const before = new Set((await list("/procurement/invoices?limit=200", ap)).map((i) => i.id))
  const context = await browser.newContext({ viewport: { width: 1500, height: 1100 } })
  await seedAuth(context, BASE, "proc.ap@nts.local", "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/procurement-v23/intake`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("#aiInvoiceCaptureV23", { timeout: LOAD })
  await page.waitForFunction(() => [...document.querySelectorAll("#aiInvoicePoV23 option")].some((o) => /PO_20260908_0004/.test(o.textContent || "")), null, { timeout: LOAD })
  const po = await page.$$eval("#aiInvoicePoV23 option", (os) => os.find((o) => /PO_20260908_0004/.test(o.textContent || ""))?.value)
  await page.setInputFiles('#aiInvoiceCaptureV23 input[name="document"]', PDF)
  await page.locator("#aiInvoicePoV23").selectOption(po)
  await page.locator('[data-action="confirm-extract-invoice-v23"]').click()
  await page.waitForSelector("#aiInvoiceResultV23 #invoiceCaptureV23", { timeout: 240000 })
  await page.waitForTimeout(1500)

  check((await page.locator("#aiInvoiceResultV23 [data-doc-scroll] img").count()) > 0, "the supplier's PDF is shown beside the form")
  const fields = await page.$$eval("#aiInvoiceResultV23 .pr23-hl", (hs) => hs.map((h) => h.dataset.hlField))
  check(["invoiceNumber", "totalAmount"].every((f) => fields.includes(f)), "the invoice number and total are highlighted where they are printed", fields.join(", "))
  check(/Prefilled from the read invoice/.test(await page.locator("#aiInvoiceResultV23 #invoiceCaptureV23").innerText()), "the form is prefilled from the reading")
  await page.screenshot({ path: path.join(OUT, "invoice-processing.png"), fullPage: true })

  await page.locator('#aiInvoiceResultV23 [data-action="confirm-capture-flag-invoice-v23"]').click()
  check(await page.waitForFunction(() => /Say why the invoice needs review/.test(document.body.innerText), null, { timeout: 20000 }).then(() => true).catch(() => false), "flagging without a reason is refused")
  await page.locator("#invoiceReviewNoteV23").fill(note)
  await page.locator('#aiInvoiceResultV23 [data-action="confirm-capture-flag-invoice-v23"]').click()
  check(await page.waitForFunction(() => /flagged for review/.test(document.body.innerText), null, { timeout: 90000 }).then(() => true).catch(() => false), "Flag for review saves the invoice and says so")

  let invoice
  for (let i = 0; i < 12 && !invoice; i++) {
    invoice = (await list("/procurement/invoices?limit=200", ap)).find((x) => !before.has(x.id) && x.reviewNote === note)
    if (!invoice) await new Promise((r) => setTimeout(r, 5000))
  }
  if (invoice) created.push(invoice.id)
  check(Boolean(invoice) && invoice.reviewFlaggedById === ap.id && invoice.reviewFlaggedAt, "the reason, who and when are on the invoice", invoice?.invoiceNumber)

  let alerted
  for (let i = 0; i < 12 && !alerted; i++) {
    alerted = (await list("/homepage/notifications?limit=100", finmgr)).find((n) => n.type === "PROCUREMENT_INVOICE_FLAGGED" && n.relatedEntityId === invoice?.id && (n.data?.reasons ?? []).some((r) => /Flagged for review/.test(r.message ?? r)))
    if (!alerted) await new Promise((r) => setTimeout(r, 5000))
  }
  check(Boolean(alerted), "the Finance Manager is alerted with the reason", alerted?.title)

  await page.goto(`${BASE}/procurement-v23/invoices`, { waitUntil: "domcontentloaded", timeout: LOAD })
  check(await page.waitForFunction(({ n, t }) => document.body.innerText.includes(n) && document.body.innerText.includes(t), { n: invoice?.invoiceNumber ?? "none", t: note }, { timeout: LOAD }).then(() => true).catch(() => false), "Invoices to review lists it with the reason")

  const empty = await fetch(`${API}/procurement/invoices/${invoice?.id}/flag`, { method: "POST", headers: { ...ap.auth, "Content-Type": "application/json" }, body: JSON.stringify({ note: "  " }) })
  check(empty.status === 400, "the flag endpoint refuses an empty reason", String(empty.status))
  const notAllowed = await fetch(`${API}/procurement/invoices/${invoice?.id}/flag`, { method: "POST", headers: { ...requester.auth, "Content-Type": "application/json" }, body: JSON.stringify({ note: "UAT" }) })
  check(notAllowed.status === 403, "a requester cannot flag an invoice", String(notAllowed.status))
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
  if (DELETE && created.length) {
    try {
      execSync(DELETE.replace("{ids}", created.join(",")), { stdio: "pipe", timeout: 300000 })
      console.log(`removed ${created.length} test invoice(s)`)
    } catch (e) {
      console.log(`could not remove ${created.join(",")}: ${String(e.message).slice(0, 160)}`)
    }
  }
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
