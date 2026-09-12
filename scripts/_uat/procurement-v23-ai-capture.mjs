/**
 * AI Invoice Capture, driven through the UI as the Accountant.
 *
 *   node scripts/_uat/procurement-v23-ai-capture.mjs <path-to-invoice.pdf> [--base=http://localhost:3001]
 *
 * Signs in, opens the page from the sidebar, uploads a real PDF, and checks that what the model
 * read is rendered for checking and carried into the capture form. Writes a screenshot beside the
 * run so the rendering can be eyeballed.
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { seedAuth, STAFF_BASE } from "./_routes.mjs"

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const PDF = process.argv[2]
const BASE = arg("base") || STAFF_BASE
const OUT = path.resolve(arg("out") || ".procurement-ai-capture")
const EMAIL = arg("user") || "proc.ap@nts.local"
const WAIT = Number(process.env.UAT_EXTRACT_TIMEOUT_MS || 180000)

if (!PDF || !fs.existsSync(PDF)) {
  console.error("Pass the path to a PDF invoice as the first argument.")
  process.exit(1)
}
fs.mkdirSync(OUT, { recursive: true })

const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` · ${detail}` : ""}`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
try {
  await seedAuth(context, BASE, EMAIL, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))

  await page.goto(`${BASE}/procurement-v23`, { waitUntil: "domcontentloaded", timeout: 90000 })
  await page.waitForSelector("#nav .nav-item", { timeout: 90000 })
  await page.waitForTimeout(2500)

  const navItem = page.locator('#nav .nav-item[data-page="intake"]')
  record("sidebar offers AI Invoice Capture", (await navItem.count()) > 0, `${await navItem.count()} entry`)

  await navItem.first().click()
  await page.waitForSelector("#aiInvoiceCaptureV23", { timeout: 30000 })
  const heading = (await page.locator(".page-head h1").first().textContent())?.trim()
  record("the page opens", heading === "AI Invoice Capture", `heading "${heading}"`)

  const emptyState = (await page.locator("#aiInvoiceResultV23").textContent())?.trim() || ""
  record("honest empty state before any upload", /Nothing read yet/i.test(emptyState), emptyState.slice(0, 80))

  const poOptions = await page.locator("#aiInvoicePoV23 option").count()
  record("purchase orders are offered", poOptions > 0, `${poOptions} option(s) incl. the no-PO choice`)

  await page.setInputFiles('#aiInvoiceCaptureV23 input[name="document"]', PDF)
  if (poOptions > 1) await page.locator("#aiInvoicePoV23").selectOption({ index: 1 })

  await page.locator('[data-action="confirm-extract-invoice-v23"]').click()
  await page.waitForFunction(
    () => !/Nothing read yet/i.test(document.querySelector("#aiInvoiceResultV23")?.textContent || ""),
    null,
    { timeout: WAIT },
  )
  await page.waitForTimeout(1200)

  const read = (await page.locator("#aiInvoiceResultV23").textContent())?.trim() || ""
  record("the invoice number was read", /INV-SW-4471/.test(read), read.match(/INV-[A-Z0-9-]+/)?.[0] || "not found")
  record("a confidence figure is shown", /\d+% confidence/.test(read), read.match(/\d+% confidence/)?.[0] || "none")
  record("invoice lines were read", /A4 Bond Paper/i.test(read), /A4 Bond Paper/i.test(read) ? "line descriptions present" : "no lines")
  record("the reading was filed", /Filed as VIN-/.test(read) || /Not filed/.test(read), read.match(/Filed as (VIN-[0-9-]+)/)?.[1] || "not filed")
  // The runtime's money() rounds to whole dollars, which showed a $6.50 unit price as "$7" on the
  // one screen meant for comparing figures with the PDF.
  record("amounts are shown to the cent", /\$6\.50/.test(read) && /\$260\.00/.test(read), read.match(/\$[\d,]+\.\d{2}/g)?.slice(0, 4).join(" ") || "no cent amounts found")

  await page.screenshot({ path: path.join(OUT, "ai-capture-read.png"), fullPage: true })

  const capture = page.locator('#aiInvoiceResultV23 [data-action="capture-invoice-v5"]')
  if (await capture.count()) {
    await capture.first().click()
    await page.waitForSelector("#invoiceCaptureV23", { timeout: 30000 })
    await page.waitForTimeout(800)
    const modal = (await page.locator("#invoiceCaptureV23").textContent())?.trim() || ""
    const date = await page.locator('#invoiceCaptureV23 [name="invoiceDate"]').inputValue()
    record("capture form says it was prefilled", /Prefilled from the read invoice/i.test(modal), modal.slice(0, 90))
    record("the invoice date came from the PDF", date === "2026-09-08", `date "${date}"`)
    await page.screenshot({ path: path.join(OUT, "ai-capture-prefilled-form.png"), fullPage: true })
  } else {
    record("capture form opens from the reading", false, "no Capture this invoice button")
  }

  record("no page errors", errors.length === 0, errors.slice(0, 2).join(" | ") || "none")
} finally {
  await browser.close()
}

const passed = results.filter((r) => r.ok).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
console.log(`screenshots in ${OUT}`)
process.exit(passed === results.length ? 0 : 1)
