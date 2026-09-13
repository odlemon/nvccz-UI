/**
 * Every invoice that arrives with a document is read by the LLM and compared with the invoice as captured (dev).
 *
 *   API=https://dev-api.matanho.com/api UAT_MINT_PO_TOKEN_CMD="python mint_vendor_po_token.py {vendorId} {poId}" \
 *   UAT_DELETE_INVOICES_CMD="python dev_api_node.py dev_delete_invoices.mjs {ids}" \
 *     node scripts/_uat/procurement-v23-invoice-documents.mjs
 *
 * Three invoices against the demo order PO_20260908_0004 (Msasa Contract Furniture), each removed afterwards:
 *   A. Accounts Payable captures it with the supplier's text PDF and the same lines — the reading must agree.
 *   B. The vendor submits through its invoice link with a SCANNED copy (OCR) but types a lower chair price — the reading
 *      must find the price, subtotal, VAT and total differences.
 *   C. Accounts Payable captures it with a photo of ANOTHER supplier's invoice — the reading must say the document is
 *      from another supplier.
 * And the refusals: an unsupported file type is refused on upload.
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(HERE, "fixtures", "invoices")
const API = process.env.API || "https://dev-api.matanho.com/api"
const MINT = process.env.UAT_MINT_PO_TOKEN_CMD || ""
const DELETE = process.env.UAT_DELETE_INVOICES_CMD || ""
const READ_WAIT_MS = Number(process.env.UAT_READ_WAIT_MS || 240000)
const results = []
const check = (ok, what, detail = "") => {
  results.push(ok)
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
const created = []

async function login(email) {
  const j = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123", portal: "staff" }) })).json()
  const token = j.token || j?.data?.token
  if (!token) throw new Error(`${email} could not sign in`)
  return { Authorization: `Bearer ${token}` }
}
const ap = await login("proc.ap@nts.local")
const rows = async (p, auth = ap) => {
  const j = await (await fetch(API + p, { headers: auth })).json()
  const d = j?.data ?? j
  return Array.isArray(d) ? d : Object.values(d ?? {}).find(Array.isArray) ?? []
}

async function upload(file, mime) {
  const form = new FormData()
  form.append("document", new Blob([fs.readFileSync(path.join(DIR, file))], { type: mime }), file)
  const r = await fetch(`${API}/procurement/invoices/upload-document`, { method: "POST", body: form })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, url: j?.data?.documentUrl, message: j?.message }
}

async function waitForReading(invoiceId) {
  const started = Date.now()
  while (Date.now() - started < READ_WAIT_MS) {
    const inv = (await rows("/procurement/invoices")).find((i) => i.id === invoiceId)
    const o = inv?.ocrData
    if (o && o.status && o.status !== "PENDING") return { inv, o, seconds: Math.round((Date.now() - started) / 1000) }
    await new Promise((r) => setTimeout(r, 5000))
  }
  return { inv: null, o: null, seconds: Math.round(READ_WAIT_MS / 1000) }
}

const po = (await rows("/procurement/purchase-orders")).find((o) => o.poNumber === "PO_20260908_0004")
if (!po) throw new Error("demo order PO_20260908_0004 not found")
const lines = (po.items || []).map((i) => ({ itemName: i.itemName, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), unit: i.unit ?? undefined }))
console.log(`order ${po.poNumber} · ${po.vendor?.name} · ${lines.map((l) => `${l.quantity}×${l.itemName.slice(0, 20)}@${l.unitPrice}`).join(", ")}`)

try {
  // ------------------------------------------------------------------ refusal: file type
  console.log("\n== upload refuses what is not an invoice document")
  const bad = new FormData()
  bad.append("document", new Blob([Buffer.from("not an invoice")], { type: "text/plain" }), "notes.txt")
  const badRes = await fetch(`${API}/procurement/invoices/upload-document`, { method: "POST", body: bad })
  check(badRes.status === 400, "a .txt file is refused", `${badRes.status} ${(await badRes.json().catch(() => ({})))?.message ?? ""}`)

  // ------------------------------------------------------------------ A. staff capture, text PDF, agrees
  console.log("\n== A. Accounts Payable captures with the supplier's PDF; same lines")
  const a = await upload("msasa-boardroom.pdf", "application/pdf")
  check(a.status === 201 && a.url, "the PDF uploads", `${a.status} ${a.message ?? ""}`)
  const aRes = await fetch(`${API}/procurement/invoices`, {
    method: "POST",
    headers: { ...ap, "Content-Type": "application/json" },
    body: JSON.stringify({ purchaseOrderId: po.id, vendorId: po.vendorId, invoiceDate: "2026-09-13", currencyId: po.currencyId, documentPath: a.url, documentType: "PDF", items: lines }),
  })
  const aInv = (await aRes.json().catch(() => ({})))?.data
  if (aInv?.id) created.push(aInv.id)
  check(aRes.status === 201 && aInv?.id, "the invoice is captured", `${aRes.status} ${aInv?.invoiceNumber ?? ""}`)
  if (aInv?.id) {
    const { o, seconds } = await waitForReading(aInv.id)
    check(o?.status === "READ", "the document is read by the LLM on its own", `${o?.status ?? "not read"} after ${seconds}s · model ${o?.model ?? "?"}`)
    check(o?.supplierInvoiceNumber === "MCF-INV-10482", "the supplier's own invoice number is kept", String(o?.supplierInvoiceNumber))
    check(o?.comparison?.agrees === true, "the reading agrees with the capture", (o?.comparison?.differences || []).map((d) => d.message).join(" | ") || "no differences")
  }

  // ------------------------------------------------------------------ B. vendor portal, scanned copy, price typed lower
  console.log("\n== B. the vendor submits a scanned copy but types a lower chair price")
  if (!MINT) check(false, "a vendor invoice link can be minted", "UAT_MINT_PO_TOKEN_CMD not set")
  else {
    const token = execSync(MINT.replace("{vendorId}", po.vendorId).replace("{poId}", po.id), { encoding: "utf8", timeout: 180000 }).trim()
    const b = await upload("msasa-boardroom-scanned.pdf", "application/pdf")
    check(b.status === 201 && b.url, "the scanned PDF uploads", `${b.status} ${b.message ?? ""}`)
    const typed = lines.map((l) => (/chair/i.test(l.itemName) ? { ...l, unitPrice: 280 } : l))
    const bRes = await fetch(`${API}/procurement/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorPortalToken: token, documentPath: b.url, documentType: "PDF", items: typed }),
    })
    const bBody = await bRes.json().catch(() => ({}))
    const bInv = bBody?.data
    if (bInv?.id) created.push(bInv.id)
    check(bRes.status === 201 && bInv?.id, "the vendor's invoice is accepted at once (reading does not hold it up)", `${bRes.status} ${bInv?.invoiceNumber ?? bBody?.message ?? ""}`)
    if (bInv?.id) {
      const { o, seconds } = await waitForReading(bInv.id)
      check(o?.status === "READ", "the scanned document is read (OCR, then the LLM)", `${o?.status ?? "not read"} after ${seconds}s${o?.message ? ` · ${o.message}` : ""}`)
      check(o?.fromOcr === true, "the reading says it came from OCR", String(o?.fromOcr))
      const diffs = (o?.comparison?.differences || []).map((d) => d.field)
      check(diffs.includes("linePrice"), "the chair price difference is found", (o?.comparison?.differences || []).map((d) => d.message).join(" | "))
      check(diffs.includes("totalAmount") || diffs.includes("subtotal"), "the totals difference is found", diffs.join(", "))
      check(!diffs.includes("supplier"), "the supplier is recognised as the order's vendor", diffs.join(", "))
    }
  }

  // ------------------------------------------------------------------ C. staff capture, another supplier's photo
  console.log("\n== C. Accounts Payable attaches a photo of another supplier's invoice")
  const c = await upload("jacaranda-photo.jpg", "image/jpeg")
  check(c.status === 201 && c.url, "the photo uploads", `${c.status} ${c.message ?? ""}`)
  const cRes = await fetch(`${API}/procurement/invoices`, {
    method: "POST",
    headers: { ...ap, "Content-Type": "application/json" },
    body: JSON.stringify({ purchaseOrderId: po.id, vendorId: po.vendorId, invoiceDate: "2026-09-13", currencyId: po.currencyId, documentPath: c.url, documentType: "IMAGE", items: lines }),
  })
  const cInv = (await cRes.json().catch(() => ({})))?.data
  if (cInv?.id) created.push(cInv.id)
  check(cRes.status === 201 && cInv?.id, "the invoice is captured", `${cRes.status} ${cInv?.invoiceNumber ?? ""}`)
  if (cInv?.id) {
    const { o, seconds } = await waitForReading(cInv.id)
    check(o?.status === "READ", "the photo is read (OCR, then the LLM)", `${o?.status ?? "not read"} after ${seconds}s${o?.message ? ` · ${o.message}` : ""}`)
    const diffs = o?.comparison?.differences || []
    check(diffs.some((d) => d.field === "supplier" && /Jacaranda/i.test(String(d.read))), "the reading says the document is from another supplier", diffs.map((d) => d.message).slice(0, 3).join(" | "))
    check(diffs.some((d) => d.field === "purchaseOrder"), "the reading says the document quotes another order", diffs.filter((d) => d.field === "purchaseOrder").map((d) => d.message).join(""))
  }

  // ------------------------------------------------------------------ D. the same supplier invoice captured twice
  console.log("\n== D. the supplier's PDF from A is captured a second time")
  if (created[0]) {
    const d = await upload("msasa-boardroom.pdf", "application/pdf")
    const dRes = await fetch(`${API}/procurement/invoices`, {
      method: "POST",
      headers: { ...ap, "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseOrderId: po.id, vendorId: po.vendorId, invoiceDate: "2026-09-13", currencyId: po.currencyId, documentPath: d.url, documentType: "PDF", items: lines }),
    })
    const dInv = (await dRes.json().catch(() => ({})))?.data
    if (dInv?.id) created.push(dInv.id)
    check(dRes.status === 201 && dInv?.id, "the second capture is accepted (a person decides)", `${dRes.status} ${dInv?.invoiceNumber ?? ""}`)
    if (dInv?.id) {
      const { inv } = await waitForReading(dInv.id)
      const dup = (inv?.aiDiscrepancies?.flags || []).find((f) => f.type === "POSSIBLE_DUPLICATE")
      check(Boolean(dup) && dup.otherInvoiceId === created[0], "it is flagged as a possible duplicate of the first", dup ? `${dup.otherInvoiceNumber}: ${dup.reason}` : JSON.stringify(inv?.aiDiscrepancies?.flags ?? []))
      check(String(inv?.matchingStatus).toUpperCase() === "DISCREPANCY", "its match status is a discrepancy", String(inv?.matchingStatus))
    }
  }

  // ------------------------------------------------------------------ alerts reach a reviewer
  console.log("\n== alerts: a reviewer is told, in the app, why each flagged invoice needs review")
  {
    const ids = new Set(created.slice(1))
    let found = []
    const started = Date.now()
    while (Date.now() - started < 60000) {
      const j = await (await fetch(`${API}/homepage/notifications?limit=50`, { headers: ap })).json().catch(() => ({}))
      const list = (j?.data?.notifications ?? j?.data ?? j?.notifications ?? []).filter?.((n) => n.type === "PROCUREMENT_INVOICE_FLAGGED") ?? []
      found = list.filter((n) => ids.has(n.relatedEntityId))
      if (found.length >= Math.min(2, ids.size)) break
      await new Promise((r) => setTimeout(r, 5000))
    }
    check(found.length >= Math.min(2, ids.size), "Accounts Payable has an in-app alert for the flagged invoices", `${found.length} of ${ids.size} · ${found.map((n) => n.title).join(" | ")}`)
    const sample = found[0]
    check(Boolean(sample?.data?.path) && Array.isArray(sample?.data?.reasons) && sample.data.reasons.length > 0, "each alert links to the invoices page and lists its reasons", sample ? `${sample.data.path} · ${sample.data.reasons.slice(0, 2).join(" | ")}` : "none")
  }

  // ------------------------------------------------------------------ re-read on demand
  if (created[0]) {
    console.log("\n== reading again on demand")
    const r = await fetch(`${API}/procurement/invoices/${created[0]}/read`, { method: "POST", headers: ap })
    const j = await r.json().catch(() => ({}))
    check(r.status === 200 && j?.data?.status === "READ", "POST /invoices/:id/read reads it again", `${r.status} ${j?.message ?? ""}`)
  }
} finally {
  if (created.length) {
    console.log(`\n== removing the ${created.length} test invoice(s)`)
    if (DELETE) {
      try {
        console.log("  " + execSync(DELETE.replace("{ids}", created.join(" ")), { encoding: "utf8", timeout: 300000 }).trim().split("\n").slice(-1)[0])
      } catch (e) {
        console.log(`  FAILED to remove: ${String(e.message).slice(0, 200)} — ids ${created.join(" ")}`)
        results.push(false)
      }
    } else {
      console.log(`  UAT_DELETE_INVOICES_CMD not set — remove by hand: ${created.join(" ")}`)
      results.push(false)
    }
  }
}
const failed = results.filter((x) => !x).length
console.log(`\n=== RESULT === ${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
