/**
 * Procurement V23 across its edges, read-only (dev): what leaves the module (exports and downloads), what accounting
 * shows of it, and what an invited vendor sees on the vendor portal. Nothing is confirmed or submitted.
 *
 *   API=… STAFF_BASE=… NEXT_PUBLIC_API_BASE_URL=… UAT_MINT_VENDOR_TOKEN_CMD="python mint_vendor_token.py {vendorId} {rfqId}" \
 *     node scripts/_uat/procurement-v23-crossmodule.mjs --out=<dir> [--only=exports,accounting,portal]
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth, STAFF_BASE } from "./_routes.mjs"

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const OUT = path.resolve(arg("out") || ".procurement-crossmodule")
const ONLY = (arg("only") || "").split(",").filter(Boolean)
const want = (part) => !ONLY.length || ONLY.includes(part)
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const MINT = process.env.UAT_MINT_VENDOR_TOKEN_CMD || ""
const VENDOR_BASE = process.env.UAT_VENDOR_BASE || STAFF_BASE.replace("://dev.", "://dev.vendor.")
fs.mkdirSync(path.join(OUT, "downloads"), { recursive: true })

// Sample records from the vendored runtimes and the retired UAT dataset: none may leave the module or show in accounting.
const SAMPLE = /TechNova|AfriCloud|Mukushi|Dube & Partners|ZimTech|MedEquip|GreenGrid|NetShield|Matanho Holdings|Kariba Agro|Lumina Health|Tendai Moyo|Tinashe Chaka|TN-2026-014|PO-2026-0584|CTR-2026-081|BILL-2026-03|RFQ-FIN-2026/
const results = []
const check = (ok, what, detail = "") => {
  results.push({ ok, what, detail })
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}

async function session(browser, email) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  await seedAuth(context, STAFF_BASE, email, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)))
  return { context, page, errors }
}

async function openLive(page, route) {
  await page.goto(STAFF_BASE + route, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: LOAD }).catch(() => {})
  await page.waitForTimeout(2500)
}

async function apiRows(email, p) {
  const login = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123", portal: "staff" }) })).json()
  const r = await fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${login.token || login?.data?.token}` } })
  const j = await r.json().catch(() => ({}))
  const d = j?.data ?? j
  return Array.isArray(d) ? d : Object.values(d ?? {}).find(Array.isArray) ?? []
}

const browser = await chromium.launch()
try {
  // ------------------------------------------------------------------ 1. exports and downloads
  if (want("exports")) {
    const PAGES = [
      ["proc.mgr@nts.local", "approvals", "/procurement-v23/approvals"],
      ["proc.mgr@nts.local", "plan", "/procurement-v23/plan"],
      ["proc.mgr@nts.local", "quotations", "/procurement-v23/quotations"],
      ["proc.mgr@nts.local", "evaluation", "/procurement-v23/evaluation"],
      ["proc.mgr@nts.local", "vendors", "/procurement-v23/vendors"],
      ["proc.mgr@nts.local", "orders", "/procurement-v23/purchase-orders"],
      ["proc.mgr@nts.local", "reports", "/procurement-v23/reports"],
      ["proc.ap@nts.local", "accounts", "/procurement-v23/accounts"],
      ["proc.ap@nts.local", "invoices", "/procurement-v23/invoices"],
      ["payroll.intaudit@nts.local", "audit", "/procurement-v23/audit"],
      ["proc.officer@nts.local", "documents", "/procurement-v23/documents"],
    ]
    for (const [email, id, route] of PAGES) {
      console.log(`\n== exports on ${id} as ${email}`)
      const { context, page, errors } = await session(browser, email)
      await openLive(page, route)
      const controls = await page.evaluate(() => {
        const seen = new Set()
        return [...document.querySelectorAll('[data-action^="export"], [data-action^="download"]')]
          .filter((el) => el.getBoundingClientRect().width > 0 && !el.closest("#modalLayer, #drawerLayer"))
          .map((el) => ({ action: el.dataset.action, id: el.dataset.id || "", label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40) }))
          .filter((c) => (seen.has(c.action) ? false : seen.add(c.action)))
      })
      if (!controls.length) console.log("  (no visible export or download control on this page)")
      for (const c of controls.slice(0, 6)) {
        const mark = errors.length
        const locator = page.locator(`[data-action="${c.action}"]${c.id ? `[data-id="${c.id}"]` : ""} >> visible=true`).first()
        const download = page.waitForEvent("download", { timeout: 12000 }).catch(() => null)
        await locator.scrollIntoViewIfNeeded().catch(() => {})
        await locator.click({ timeout: 8000 }).catch(() => {})
        const file = await download
        if (!file) {
          const toast = await page.$$eval("[data-sonner-toast], #toasts .toast", (els) => els.map((e) => e.textContent.trim()).join(" | ")).catch(() => "")
          const modal = await page.locator("#modalLayer.open").count()
          check(Boolean(toast) || modal > 0, `${id}: "${c.label || c.action}" (${c.action}) does something`, toast ? `toast "${toast.slice(0, 100)}"` : modal ? "opens a form" : "no download, no toast, no form")
          if (modal) await page.keyboard.press("Escape")
          continue
        }
        const name = file.suggestedFilename()
        const target = path.join(OUT, "downloads", `${id}--${name}`)
        await file.saveAs(target).catch(() => {})
        const buf = fs.existsSync(target) ? fs.readFileSync(target) : Buffer.alloc(0)
        const head = buf.slice(0, 8).toString("latin1")
        const text = buf.toString("latin1")
        const kind = /\.pdf$/i.test(name) ? (head.startsWith("%PDF") ? "pdf" : "BAD pdf") : /\.(csv|xls|json)$/i.test(name) ? name.split(".").pop() : "other"
        const sample = text.match(SAMPLE)
        const uat = /UAT P2P|UAT WF|Storyline/.test(text)
        check(buf.length > 60 && !kind.startsWith("BAD") && !sample && !uat && errors.length === mark, `${id}: ${c.action} downloads ${name}`, `${buf.length} bytes · ${kind}${sample ? ` · sample text "${sample[0]}"` : ""}${uat ? " · test record names" : ""}${errors.length > mark ? ` · page error ${errors.slice(mark).join(" | ")}` : ""}`)
      }
      check(errors.length === 0, `${id}: no page errors`, errors.slice(0, 2).join(" | "))
      await context.close()
    }
  }

  // ------------------------------------------------------------------ 2. accounting shows procurement
  if (want("accounting")) {
    console.log("\n== accounting as payroll.finmgr@nts.local")
    const invoices = await apiRows("proc.ap@nts.local", "/procurement/invoices")
    const paid = invoices.find((i) => String(i.paymentStatus).toUpperCase() === "PAID")
    const { context, page, errors } = await session(browser, "payroll.finmgr@nts.local")
    const PAGES = [
      ["journals", "/accounting/journals", [paid?.invoiceNumber].filter(Boolean)],
      ["general-ledger", "/accounting/general-ledger", [paid?.invoiceNumber].filter(Boolean)],
      ["payables", "/accounting/payables", []],
      ["cash-book", "/accounting/cash-book", []],
      ["approvals", "/accounting/approvals", []],
    ]
    for (const [id, route, mustShow] of PAGES) {
      const mark = errors.length
      await page.goto(STAFF_BASE + route, { waitUntil: "domcontentloaded", timeout: LOAD })
      await page.waitForTimeout(14000)
      const body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ")
      const sample = body.match(SAMPLE)
      const missing = mustShow.filter((m) => !body.includes(m))
      await page.screenshot({ path: path.join(OUT, `accounting-${id}.png`) })
      check(!/Application error/i.test(body) && body.length > 300, `accounting ${id} renders`, `${body.length} characters`)
      check(!sample, `accounting ${id} shows no sample record`, sample ? `"${sample[0]}"` : "")
      if (mustShow.length) check(!missing.length, `accounting ${id} shows the paid procurement invoice's postings`, missing.length ? `missing ${missing.join(", ")}` : mustShow.join(", "))
      check(errors.length === mark, `accounting ${id}: no page errors`, errors.slice(mark, mark + 2).join(" | "))
    }
    await context.close()
  }

  // ------------------------------------------------------------------ 3. vendor portal, as an invited vendor
  if (want("portal")) {
    console.log("\n== vendor portal")
    if (!MINT) {
      check(false, "vendor portal link can be produced", "UAT_MINT_VENDOR_TOKEN_CMD not set")
    } else {
      const rfqs = await apiRows("proc.mgr@nts.local", "/procurement/rfq")
      const open = rfqs.find((r) => String(r.status).toUpperCase() === "OPEN" && /welcome packs/i.test(r.title)) ?? rfqs.find((r) => String(r.status).toUpperCase() === "OPEN")
      const vendors = await apiRows("proc.mgr@nts.local", "/accounting/vendors")
      const invited = vendors.find((v) => v.name === "Jacaranda Office Supplies (Pvt) Ltd")
      if (!open || !invited) {
        check(false, "an open demo RFQ and an invited demo vendor exist", `rfq ${open?.rfqNumber ?? "none"} · vendor ${invited?.name ?? "none"}`)
      } else {
        const token = execSync(MINT.replace("{vendorId}", invited.id).replace("{rfqId}", open.procurementRfqId ?? open.id), { encoding: "utf8", timeout: 180000 }).trim()
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
        const page = await context.newPage()
        const errors = []
        page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)))
        await page.goto(`${VENDOR_BASE}/vendor-quotations/rfq-respond?token=${encodeURIComponent(token)}&rfqNumber=${encodeURIComponent(open.rfqNumber)}`, { waitUntil: "domcontentloaded", timeout: LOAD })
        await page.waitForTimeout(8000)
        const body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ")
        await page.screenshot({ path: path.join(OUT, "vendor-portal.png"), fullPage: true })
        check(body.includes(open.rfqNumber), "the portal page names the RFQ", open.rfqNumber)
        check(/Branded client welcome pack|welcome pack/i.test(body) || open.title.split(" ").some((w) => w.length > 5 && body.includes(w)), "the portal page shows what is being quoted for", body.slice(0, 160))
        check(!SAMPLE.test(body), "the portal page shows no sample record", (body.match(SAMPLE) || [""])[0])
        check(errors.length === 0, "vendor portal: no page errors", errors.slice(0, 2).join(" | "))
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
fs.writeFileSync(path.join(OUT, "crossmodule.json"), JSON.stringify(results, null, 2))
const failed = results.filter((r) => !r.ok).length
console.log(`\n=== RESULT === ${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
