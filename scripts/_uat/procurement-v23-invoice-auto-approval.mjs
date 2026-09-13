/**
 * An exactly matching invoice is approved into the payment queue without a person, only when switched on (dev).
 *
 *   API=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api \
 *   UAT_DELETE_INVOICES_CMD="python dev_api_node.py dev_delete_invoices.mjs {ids}" \
 *     node scripts/_uat/procurement-v23-invoice-auto-approval.mjs
 *
 * SRD §6.6: "If the invoice matches the PO exactly, the AI marks the invoice for Auto-Approval and moves it into the
 * payment queue." Against the demo order PO_20260908_0004 (Msasa Contract Furniture, received in full), with the
 * supplier's own PDF whose lines equal the order:
 *   1. switched off: the exact match stays with Finance;
 *   2. switched on with a $100 limit: it stays with Finance; with no limit and the match re-run, it is approved
 *      automatically, recorded AUTOMATIC, audited AUTO_APPROVE, and those who approve or pay are told;
 *   3. switched on, but the document attached is another supplier's: it stays with Finance, and a person's approval
 *      is recorded MANUAL.
 * Each invoice is removed before the next is captured, so none is flagged a duplicate of another; the setting is put
 * back as it was.
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { seedAuth } from "./_routes.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(HERE, "fixtures", "invoices")
const API = process.env.API || "https://dev-api.matanho.com/api"
const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const DELETE = process.env.UAT_DELETE_INVOICES_CMD || ""
const READ_WAIT_MS = Number(process.env.UAT_READ_WAIT_MS || 240000)
const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
const live = new Set()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function login(email) {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123", portal: "staff" }) })
  const j = await r.json().catch(() => ({}))
  const token = j.token || j?.data?.token
  if (!token) throw new Error(`${email} could not sign in (${r.status})`)
  return { email, id: (j.user || j?.data?.user || {}).id, auth: { Authorization: `Bearer ${token}` } }
}
async function api(method, p, who, body) {
  const r = await fetch(API + p, { method, headers: { ...who.auth, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const json = await r.json().catch(() => ({}))
  return { status: r.status, json, data: json?.data }
}
const list = (res) => (Array.isArray(res.data) ? res.data : Object.values(res.data ?? {}).find(Array.isArray) ?? [])

const cfo = await login("proc.cfo@nts.local")
const ap = await login("proc.ap@nts.local")
const finmgr = await login("payroll.finmgr@nts.local")
const auditor = await login("payroll.intaudit@nts.local")

const po = list(await api("GET", "/procurement/purchase-orders", ap)).find((o) => o.poNumber === "PO_20260908_0004")
if (!po) throw new Error("demo order PO_20260908_0004 not found")
const lines = (po.items || []).map((i) => ({ itemName: i.itemName, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), unit: i.unit ?? undefined }))

async function upload(file, mime) {
  const form = new FormData()
  form.append("document", new Blob([fs.readFileSync(path.join(DIR, file))], { type: mime }), file)
  const r = await fetch(`${API}/procurement/invoices/upload-document`, { method: "POST", body: form })
  const j = await r.json().catch(() => ({}))
  return j?.data?.documentUrl
}
async function capture(file, mime) {
  const url = await upload(file, mime)
  const res = await api("POST", "/procurement/invoices", ap, { purchaseOrderId: po.id, vendorId: po.vendorId, invoiceDate: new Date().toISOString().slice(0, 10), currencyId: po.currencyId, documentPath: url, documentType: mime === "application/pdf" ? "PDF" : "IMAGE", items: lines })
  if (res.data?.id) live.add(res.data.id)
  return res
}
const invoiceById = async (id) => list(await api("GET", "/procurement/invoices?limit=200", ap)).find((i) => i.id === id)
/** Waits for the supplier's document to be read, then for the match and any automatic approval that follows it. */
async function settle(id) {
  const started = Date.now()
  let inv
  while (Date.now() - started < READ_WAIT_MS) {
    inv = await invoiceById(id)
    if (inv?.ocrData?.status && inv.ocrData.status !== "PENDING") break
    await sleep(5000)
  }
  await sleep(15000)
  return invoiceById(id)
}
function remove(id) {
  if (!DELETE || !live.has(id)) return
  try {
    execSync(DELETE.replace("{ids}", id), { stdio: "pipe", timeout: 300000 })
    live.delete(id)
  } catch (e) {
    console.log(`  (could not remove ${id}: ${String(e.message).slice(0, 120)})`)
  }
}
const setting = (body) => api("PUT", "/procurement/invoice-auto-approval", cfo, body)

const before = (await api("GET", "/procurement/approval-matrix", cfo)).data?.invoiceAutoApproval
console.log(`setting before the test: ${JSON.stringify(before)}`)
check(before && typeof before.enabled === "boolean", "the setting is read with the approval matrix")

try {
  console.log("\n== only an administrator or the CFO changes it, and the limit must make sense")
  const notAdmin = await api("PUT", "/procurement/invoice-auto-approval", ap, { enabled: true })
  check(notAdmin.status === 403, "Accounts Payable cannot switch it on", `${notAdmin.status} ${notAdmin.json?.message ?? ""}`)
  const badLimit = await setting({ enabled: true, limit: -5 })
  check(badLimit.status === 400, "a negative limit is refused", badLimit.json?.message)

  // ------------------------------------------------------------------ 1. off
  console.log("\n== 1. switched off: an exact match waits for Finance")
  check((await setting({ enabled: false, limit: null })).status === 200, "switched off")
  const one = await capture("msasa-boardroom.pdf", "application/pdf")
  check(one.status === 201, "the invoice is captured with the supplier's PDF", `${one.status} ${one.data?.invoiceNumber ?? one.json?.message ?? ""}`)
  const oneAfter = await settle(one.data.id)
  check(oneAfter?.matchingStatus === "MATCHED" && oneAfter?.ocrData?.comparison?.agrees === true, "it matches exactly and the document agrees", `${oneAfter?.matchingStatus} · agrees ${oneAfter?.ocrData?.comparison?.agrees}`)
  check(oneAfter?.status === "DRAFT" && !oneAfter?.approvedAt, "it is not approved", oneAfter?.status)
  remove(one.data.id)

  // ------------------------------------------------------------------ 2. on, limit, then no limit
  console.log("\n== 2. switched on: held by a $100 limit, then approved automatically without it")
  check((await setting({ enabled: true, limit: 100 })).status === 200, "switched on with a $100 limit")
  const two = await capture("msasa-boardroom.pdf", "application/pdf")
  const twoAfter = await settle(two.data.id)
  check(twoAfter?.matchingStatus === "MATCHED" && twoAfter?.status === "DRAFT", "above the limit it waits for Finance", `${twoAfter?.status} · total ${twoAfter?.totalAmount}`)
  check((await setting({ enabled: true, limit: null })).status === 200, "the limit is removed")
  const rematch = await api("POST", `/procurement/invoices/${two.data.id}/match`, ap)
  check(rematch.status === 200, "the match is run again", `${rematch.status} ${rematch.json?.message ?? ""}`)
  await sleep(5000)
  const twoApproved = await invoiceById(two.data.id)
  check(twoApproved?.status === "APPROVED" && twoApproved?.approvalSource === "AUTOMATIC" && !twoApproved?.approvedById, "it is approved automatically, by no person", `${twoApproved?.status} · ${twoApproved?.approvalSource} · by ${twoApproved?.approvedById ?? "nobody"}`)
  check(String(twoApproved?.paymentStatus).toUpperCase() === "PENDING", "and it is in the payment queue", twoApproved?.paymentStatus)
  const notes = list(await api("GET", "/homepage/notifications?limit=100", finmgr))
  const told = notes.find((n) => n.type === "PROCUREMENT_INVOICE_AUTO_APPROVED" && n.relatedEntityId === two.data.id)
  check(Boolean(told) && /exact three-way match/i.test(told?.data?.reason ?? ""), "the Finance Manager is told why", told?.title)
  const audit = list(await api("GET", "/procurement/audit-events?limit=200", auditor))
  check(audit.some((a) => a.action === "AUTO_APPROVE" && a.entityId === two.data.id), "the audit trail records AUTO_APPROVE")

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await seedAuth(context, BASE, "proc.ap@nts.local", "staff")
    const page = await context.newPage()
    await page.goto(`${BASE}/procurement-v23/invoices`, { waitUntil: "domcontentloaded", timeout: LOAD })
    await page.waitForSelector("#nav .nav-item", { timeout: LOAD })
    const shown = await page
      .waitForFunction((n) => { const t = document.body.innerText; return t.includes(n) && /Approved automatically/.test(t) }, twoApproved?.invoiceNumber, { timeout: LOAD })
      .then(() => true)
      .catch(() => false)
    check(shown, "the invoices page shows it as approved automatically")
    await page.screenshot({ path: path.join(process.env.OUT || ".", "invoice-auto-approved.png"), fullPage: true }).catch(() => {})
  } finally {
    await browser.close()
  }
  remove(two.data.id)

  // ------------------------------------------------------------------ 3. another supplier's document
  console.log("\n== 3. switched on, but the attached document is another supplier's")
  const three = await capture("jacaranda-photo.png", "image/png")
  const threeAfter = await settle(three.data.id)
  check(threeAfter?.ocrData?.status === "READ" && threeAfter?.ocrData?.comparison?.agrees === false, "the reading says the document disagrees", `${threeAfter?.ocrData?.status} · agrees ${threeAfter?.ocrData?.comparison?.agrees}`)
  check(threeAfter?.status === "DRAFT", "it waits for Finance, however the lines match", `${threeAfter?.status} · ${threeAfter?.matchingStatus}`)
  const manual = await api("PUT", `/procurement/invoices/${three.data.id}/approve`, finmgr, {})
  check(manual.status === 200 && manual.data?.approvalSource === "MANUAL" && manual.data?.approvedById === finmgr.id, "a person's approval is recorded MANUAL", `${manual.status} ${manual.data?.approvalSource ?? manual.json?.message ?? ""}`)
  remove(three.data.id)
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  const restored = await setting({ enabled: Boolean(before?.enabled), limit: before?.limit ?? null })
  check(restored.status === 200, "the setting is put back as it was", JSON.stringify(restored.data))
  for (const id of [...live]) remove(id)
  if (live.size) console.log(`left behind: ${[...live].join(", ")}`)
}

const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
