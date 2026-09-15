/**
 * How well the LLM reads supplier invoices, measured against invoices whose correct reading is known.
 *
 *   API=https://dev-api.matanho.com/api node scripts/_uat/procurement-v23-invoice-reading.mjs [--files=a.pdf,b.png] [--with-po]
 *
 * Each fixture in scripts/_uat/fixtures/invoices (built by make_invoices.py, truth in truth.json) is sent to
 * POST /procurement/suite06/extract-for-capture as Accounts Payable, exactly as the AI Invoice Capture page sends it,
 * and every field the reader returns is compared with the truth: invoice number, date, currency, each line's
 * quantity, unit price and amount, and — where the reader returns them — supplier, purchase order, subtotal, VAT and
 * total. Without --with-po nothing is stored (no intake); with it, the purchase order is passed and an intake is
 * stored, as the page does once an order is chosen.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(HERE, "fixtures", "invoices")
const API = process.env.API || "https://dev-api.matanho.com/api"
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const WITH_PO = process.argv.includes("--with-po")
const truth = JSON.parse(fs.readFileSync(path.join(DIR, "truth.json"), "utf8"))
const files = (arg("files") || Object.keys(truth).join(",")).split(",").filter(Boolean)
const OUT = path.resolve(arg("out") || ".procurement-invoice-reading")
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (ok, what, detail = "") => {
  results.push({ ok, what, detail })
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
const near = (a, b, tol = 0.011) => a != null && b != null && Math.abs(Number(a) - Number(b)) <= tol
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2)
const similar = (a, b) => {
  const A = new Set(words(a)), B = words(b)
  return B.length ? B.filter((w) => A.has(w)).length / B.length : 0
}

const login = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "proc.ap@nts.local", password: "admin123", portal: "staff" }) })).json()
const token = login.token || login?.data?.token
if (!token) throw new Error("Accounts Payable could not sign in")
const auth = { Authorization: `Bearer ${token}` }
const orders = await (async () => {
  const j = await (await fetch(`${API}/procurement/purchase-orders`, { headers: auth })).json()
  const d = j?.data ?? j
  return Array.isArray(d) ? d : Object.values(d ?? {}).find(Array.isArray) ?? []
})()

const MIME = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }
const summary = []
for (const file of files) {
  const t = truth[file]
  if (!t) {
    check(false, `${file}: has a truth record`)
    continue
  }
  console.log(`\n== ${file} (${t.kind}${t.layout ? `, ${t.layout} layout` : ""})`)
  const buf = fs.readFileSync(path.join(DIR, file))
  const form = new FormData()
  form.append("document", new Blob([buf], { type: MIME[path.extname(file).toLowerCase()] || "application/octet-stream" }), file)
  const po = WITH_PO && t.purchaseOrder ? orders.find((o) => o.poNumber === t.purchaseOrder) : null
  if (po) form.append("purchaseOrderId", po.id)
  const started = Date.now()
  const res = await fetch(`${API}/procurement/suite06/extract-for-capture`, { method: "POST", headers: auth, body: form })
  const seconds = Math.round((Date.now() - started) / 100) / 10
  const body = await res.json().catch(() => ({}))
  fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify({ status: res.status, seconds, body }, null, 2))
  if (res.status !== 200 || !body?.data?.payload) {
    check(false, `${file}: the reader returns a reading`, `${res.status} in ${seconds}s — ${body?.message || "no payload"}`)
    summary.push({ file, kind: t.kind, status: res.status, seconds, score: 0, of: 0 })
    continue
  }
  const p = body.data.payload
  let score = 0, of = 0
  const field = (ok, what, detail) => { of++; if (ok) score++; check(ok, `${file}: ${what}`, detail) }
  field(p.invoiceNumber === t.invoiceNumber, "invoice number", `read ${JSON.stringify(p.invoiceNumber)}, is ${t.invoiceNumber}`)
  field(String(p.invoiceDate || "").slice(0, 10) === t.invoiceDate, "invoice date", `read ${JSON.stringify(p.invoiceDate)}, is ${t.invoiceDate}`)
  field(String(p.currencyCode || "").toUpperCase() === t.currency, "currency", `read ${JSON.stringify(p.currencyCode)}, is ${t.currency}`)
  const lines = Array.isArray(p.lines) ? p.lines : []
  field(lines.length === t.lines.length, "number of lines", `read ${lines.length}, is ${t.lines.length}`)
  const lineFaults = []
  t.lines.forEach((want, i) => {
    const got = lines.find((l) => similar(l.description, want.description) >= 0.6) || lines[i]
    if (!got) return lineFaults.push(`line ${i + 1} missing`)
    if (!near(got.quantity, want.quantity)) lineFaults.push(`line ${i + 1} qty ${got.quantity}≠${want.quantity}`)
    if (!near(got.unitPrice, want.unitPrice)) lineFaults.push(`line ${i + 1} price ${got.unitPrice}≠${want.unitPrice}`)
    if (!near(got.lineTotal, want.lineTotal)) lineFaults.push(`line ${i + 1} amount ${got.lineTotal}≠${want.lineTotal}`)
    if (similar(got.description, want.description) < 0.6) lineFaults.push(`line ${i + 1} description "${String(got.description).slice(0, 40)}"`)
  })
  field(lineFaults.length === 0, "every line's description, quantity, unit price and amount", lineFaults.slice(0, 4).join("; ") || `${t.lines.length} lines exact`)
  // Fields the reader may not return yet: counted, so a gap shows in the score.
  field(similar(p.supplierName, t.supplier) >= 0.75, "supplier", `read ${JSON.stringify(p.supplierName ?? null)}, is ${t.supplier}`)
  if (t.purchaseOrder) field(p.purchaseOrderReference === t.purchaseOrder, "purchase order reference", `read ${JSON.stringify(p.purchaseOrderReference ?? null)}, is ${t.purchaseOrder}`)
  field(near(p.subtotal, t.subtotal), "subtotal", `read ${p.subtotal ?? null}, is ${t.subtotal}`)
  field(near(p.taxAmount, t.taxAmount), "VAT amount", `read ${p.taxAmount ?? null}, is ${t.taxAmount}`)
  field(near(p.totalAmount, t.total), "total", `read ${p.totalAmount ?? null}, is ${t.total}`)
  check(Number(p.overallConfidence) >= 0.8, `${file}: confident reading of a clean invoice`, `confidence ${p.overallConfidence} · ${body.data.lowConfidence ? "flagged low" : "not flagged"} · stored intake ${body.data.storedIntake}`)
  console.log(`  -- ${score}/${of} fields right in ${seconds}s`)
  summary.push({ file, kind: t.kind, status: res.status, seconds, score, of })
}

console.log("\n== summary")
for (const s of summary) console.log(`  ${s.file.padEnd(32)} ${String(s.kind).padEnd(28)} ${s.status} ${String(s.seconds).padStart(5)}s  ${s.score}/${s.of}`)
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ summary, results }, null, 2))
const failed = results.filter((r) => !r.ok).length
console.log(`\n=== RESULT === ${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
