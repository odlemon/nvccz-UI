// DEV only. Spreads the demo dataset (demo-manifest.json, written by dev_demo_dataset.mjs) over the past weeks,
// so it reads like real activity instead of everything happening in one morning.
//
//   node dev_demo_backdate.mjs            show the plan
//   node dev_demo_backdate.mjs --apply    write it
//
// Each chain moves in business order: raised, approved, sourced, quoted, ordered, received, invoiced, paid.
// Only date fields a record already has are changed (a pending requisition gains no approval date); closing,
// delivery, validity and due dates move with their stage; the audit rows about each record follow it.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pkg from "@prisma/client"
const { PrismaClient, Prisma } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")
const HERE = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "demo-manifest.json"), "utf8"))

const DAY = 86400000
const at = (daysAgo, hour = 10, minute = 0) => {
  const d = new Date(Date.now() - daysAgo * DAY)
  d.setUTCHours(hour - 2, minute, 0, 0) // Harare is UTC+2
  return d
}
const plus = (d, days) => new Date(d.getTime() + days * DAY)

const models = Prisma.dmmf?.datamodel?.models ?? []
const dateFields = (model) => new Set((models.find((m) => m.name === model)?.fields ?? []).filter((f) => f.type === "DateTime").map((f) => f.name))
const delegate = (model) => model[0].toLowerCase() + model.slice(1)
const plan = []
const touched = new Map() // entityId -> { model, stamps }

/** Set the given date fields on one record: always createdAt/updatedAt, other stage fields only when already set. */
async function stamp(model, id, stamps) {
  if (!id) return
  const fields = dateFields(model)
  const current = await prisma[delegate(model)].findUnique({ where: { id }, select: Object.fromEntries([...fields].map((f) => [f, true])) })
  if (!current) return
  const data = {}
  for (const [f, when] of Object.entries(stamps)) {
    if (!fields.has(f) || !when) continue
    if (["createdAt", "updatedAt", "orderDate", "startDate", "endDate", "closingAt", "expectedDeliveryDate", "validUntil", "dueDate", "invoiceDate", "receivedDate", "transactionDate"].includes(f) || current[f] != null) data[f] = when
  }
  // The last thing that happened to the record, never a date it looks forward to.
  const FORWARD = new Set(["expectedDeliveryDate", "validUntil", "dueDate", "startDate", "endDate", "closingAt", "validityEndDate"])
  const latest = Object.entries(data).filter(([f, d]) => !FORWARD.has(f) && d <= new Date()).map(([, d]) => d).sort((a, b) => b - a)[0]
  if (fields.has("updatedAt") && latest) data.updatedAt = latest
  plan.push(`${model} ${id.slice(-6)}: ${Object.entries(data).map(([k, v]) => `${k}=${v.toISOString().slice(0, 16)}`).join(" ")}`)
  touched.set(id, { model, stamps: { ...stamps, ...data } })
  if (APPLY && Object.keys(data).length) await prisma[delegate(model)].update({ where: { id }, data })
}

async function chain(key, c) {
  const A = c.age
  const raised = at(A, 9, 12)
  const approved = at(A - 1, 11, 40)
  const rfqSent = at(A - 2, 10, 5)
  const quoted = at(Math.max(A - 5, 1), 15, 30)
  const ordered = at(Math.max(A - 7, 1), 9, 50)
  const received = at(Math.max(A - 14, 1), 13, 20)
  const inspected = at(Math.max(A - 14, 1), 16, 5)
  const invoiced = at(Math.max(A - 16, 1), 10, 45)
  const paid = at(Math.max(A - 30, 0), 11, 15)

  await stamp("PurchaseRequisition", c.requisition, { createdAt: raised, submittedAt: at(A, 9, 30), approvedAt: approved })
  if (c.rfq) {
    const closes = c.quotations?.length ? plus(rfqSent, 7) : null
    await stamp("ProcurementRfq", c.rfq, { createdAt: rfqSent, closingAt: closes, expectedDeliveryDate: c.po ? plus(ordered, 14) : null })
  }
  for (const [i, q] of (c.quotations ?? []).entries()) {
    const when = new Date(quoted.getTime() + i * 3 * 3600000)
    await stamp("VendorQuotation", q, { createdAt: when, submittedAt: when, validUntil: plus(when, 45), reviewedAt: plus(when, 1), evaluatedAt: plus(when, 1), acceptedAt: c.po ? ordered : null })
  }
  if (c.po) await stamp("PurchaseOrder", c.po, { createdAt: ordered, orderDate: ordered, approvedAt: ordered, sentAt: at(Math.max(A - 7, 1), 11, 10), dispatchedAt: at(Math.max(A - 7, 1), 11, 10), expectedDeliveryDate: plus(ordered, 14) })
  if (c.grn) await stamp("GoodsReceivedNote", c.grn, { createdAt: received, receivedDate: received, approvedAt: inspected, inspectedAt: inspected })
  if (c.invoice) {
    await stamp("ProcurementInvoice", c.invoice, { createdAt: invoiced, invoiceDate: invoiced, dueDate: plus(invoiced, 30), approvedAt: at(Math.max(A - 18, 1), 14, 0), receivedDate: invoiced, processedDate: paid, paymentDate: paid })
    const inv = await prisma.procurementInvoice.findUnique({ where: { id: c.invoice }, select: { journalEntryId: true, cashbookEntryId: true } })
    if (inv?.journalEntryId) await stamp("JournalEntry", inv.journalEntryId, { createdAt: paid, transactionDate: paid })
    if (inv?.cashbookEntryId) {
      await stamp("CashbookEntry", inv.cashbookEntryId, { createdAt: paid, transactionDate: paid, date: paid, paymentDate: paid, postedAt: paid })
      const cb = await prisma.cashbookEntry.findUnique({ where: { id: inv.cashbookEntryId }, select: { journalEntryId: true } })
      if (cb?.journalEntryId) await stamp("JournalEntry", cb.journalEntryId, { createdAt: paid, transactionDate: paid })
    }
  }
  if (c.contract) {
    const signed = at(Math.max(A - 6, 1), 15, 0)
    const start = plus(signed, 3)
    await stamp("ProcurementContract", c.contract, { createdAt: signed, activatedAt: plus(signed, 1), startDate: start, endDate: plus(start, 365) })
  }
}

try {
  for (const [key, id] of Object.entries(manifest.vendors)) await stamp("Vendor", id, { createdAt: at(120 - Object.keys(manifest.vendors).indexOf(key) * 9, 10, 0) })
  await stamp("ProcurementPlan", manifest.plans.fy2026, { createdAt: at(74, 9, 0), submittedAt: at(70, 16, 0), approvedAt: at(66, 11, 30), decidedAt: at(66, 11, 30) })
  await stamp("ProcurementPlan", manifest.plans.fy2027, { createdAt: at(6, 9, 0), submittedAt: at(4, 15, 20) })
  for (const [key, c] of Object.entries(manifest.chains)) {
    if (key === "other") continue
    await chain(key, c)
  }
  const o = manifest.chains.other
  if (o) {
    await stamp("PurchaseRequisition", o.approvedAwaitingSourcing, { createdAt: at(4, 9, 5), submittedAt: at(4, 9, 20), approvedAt: at(3, 10, 15) })
    for (const [i, id] of o.pendingApproval.entries()) await stamp("PurchaseRequisition", id, { createdAt: at(2 - i, 11, 0), submittedAt: at(2 - i, 11, 25) })
    await stamp("PurchaseRequisition", o.draft, { createdAt: at(1, 14, 40) })
    await stamp("PurchaseRequisition", o.rejected, { createdAt: at(8, 9, 45), submittedAt: at(8, 10, 0), rejectedAt: at(7, 12, 30) })
  }

  // Numbers carry the day they were issued (REQ_YYYYMMDD_0001). A record moved back in time takes that day's
  // number; the daily sequence suffix is kept, so numbers stay unique, and the API's next number for any day is
  // still one past the highest suffix it finds for that day.
  const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "")
  const NUMBERS = [
    ["PurchaseRequisition", "requisitionNumber", ["createdAt"]],
    ["ProcurementRfq", "rfqNumber", ["createdAt"]],
    ["VendorQuotation", "quotationNumber", ["submittedAt", "createdAt"]],
    ["PurchaseOrder", "poNumber", ["orderDate", "createdAt"]],
    ["GoodsReceivedNote", "grnNumber", ["receivedDate", "createdAt"]],
    ["ProcurementInvoice", "invoiceNumber", ["invoiceDate", "createdAt"]],
  ]
  const renamed = new Map()
  for (const [model, field, dateKeys] of NUMBERS) {
    for (const [id, t] of touched) {
      if (t.model !== model) continue
      const rec = await prisma[delegate(model)].findUnique({ where: { id }, select: { [field]: true } })
      const old = rec?.[field]
      const when = dateKeys.map((k) => t.stamps[k]).find(Boolean)
      if (!old || !when || !/_\d{8}_\d{4}$/.test(old)) continue
      const next = old.replace(/_\d{8}_(\d{4})$/, `_${ymd(when)}_$1`)
      if (next === old) continue
      renamed.set(old, next)
      if (APPLY) await prisma[delegate(model)].update({ where: { id }, data: { [field]: next } })
    }
  }
  // Every copy of a renamed number follows it.
  const swap = (text) => {
    if (text == null) return text
    let out = String(text)
    for (const [a, b] of renamed) out = out.split(a).join(b)
    return out
  }
  const swapJson = (v) => (v == null ? v : JSON.parse(swap(JSON.stringify(v))))
  const copies = []
  async function follow(model, where, textFields, jsonFields = []) {
    const rows = await prisma[delegate(model)].findMany({ where, select: Object.fromEntries(["id", ...textFields, ...jsonFields].map((f) => [f, true])) })
    for (const r of rows) {
      const data = {}
      for (const f of textFields) if (r[f] != null && swap(r[f]) !== r[f]) data[f] = swap(r[f])
      for (const f of jsonFields) if (r[f] != null && JSON.stringify(swapJson(r[f])) !== JSON.stringify(r[f])) data[f] = swapJson(r[f])
      if (!Object.keys(data).length) continue
      copies.push(`${model} ${r.id.slice(-6)}: ${Object.keys(data).join(", ")}`)
      if (APPLY) await prisma[delegate(model)].update({ where: { id: r.id }, data })
    }
  }
  if (renamed.size) {
    const ids = [...touched.keys()]
    const idsOf = (model) => [...touched].filter(([, t]) => t.model === model).map(([id]) => id)
    await follow("VendorQuotation", { rfqNumber: { in: [...renamed.keys()] } }, ["rfqNumber"])
    await follow("ProcurementContract", { rfqNumber: { in: [...renamed.keys()] } }, ["rfqNumber"])
    await follow("JournalEntry", { id: { in: idsOf("JournalEntry") } }, ["referenceNumber", "description"])
    await follow("CashbookEntry", { id: { in: idsOf("CashbookEntry") } }, ["description", "reference"])
    await follow("ProcurementDocument", {}, ["name", "relatedRecord", "description"])
    await follow("Notification", { relatedEntityId: { in: ids } }, ["title", "message"], ["data"])
    await follow("AuditLog", { entityId: { in: ids } }, [], ["oldValues", "newValues"])
  }
  console.log(`renumbered: ${[...renamed].map(([a, b]) => `${a} -> ${b}`).join(", ") || "none"}`)
  console.log(`copies updated: ${copies.length}${copies.length ? `\n  ${copies.join("\n  ")}` : ""}`)

  // Audit rows follow their record: each action lands on the matching stage, in the order it happened.
  const ACTION_FIELD = [
    [/CREATE|REGISTER|RAISE/i, ["createdAt"]],
    [/SUBMIT/i, ["submittedAt", "createdAt"]],
    [/REJECT/i, ["rejectedAt", "updatedAt"]],
    [/APPROV|ACCEPT|AWARD|ACTIVAT|DECIDE/i, ["approvedAt", "acceptedAt", "activatedAt", "decidedAt", "updatedAt"]],
    [/SEND|SENT|PUBLISH/i, ["sentAt", "createdAt"]],
    [/RECEIV/i, ["receivedDate", "createdAt"]],
    [/PAY/i, ["paymentDate", "paidAt", "updatedAt"]],
    [/POST/i, ["transactionDate", "updatedAt"]],
    [/SCORE|EVALUAT/i, ["evaluatedAt", "reviewedAt", "updatedAt"]],
  ]
  let auditMoved = 0
  const auditRows = await prisma.auditLog.findMany({ where: { entityId: { in: [...touched.keys()] } }, select: { id: true, entityId: true, action: true, createdAt: true }, orderBy: { createdAt: "asc" } })
  const seen = new Map()
  for (const row of auditRows) {
    const t = touched.get(row.entityId)
    const fieldsFor = ACTION_FIELD.find(([rx]) => rx.test(row.action))?.[1] ?? ["updatedAt", "createdAt"]
    const base = fieldsFor.map((f) => t.stamps[f]).find(Boolean) ?? t.stamps.createdAt
    if (!base) continue
    const n = seen.get(row.entityId) ?? 0
    seen.set(row.entityId, n + 1)
    const when = new Date(Math.min(base.getTime() + n * 90000, Date.now()))
    if (APPLY) await prisma.auditLog.update({ where: { id: row.id }, data: { createdAt: when } })
    auditMoved++
  }

  console.log(plan.join("\n"))
  console.log(`\n${touched.size} records ${APPLY ? "backdated" : "would be backdated"}; ${auditMoved} audit rows ${APPLY ? "moved" : "would move"}`)
  if (!models.length) console.log("WARNING: Prisma.dmmf not available; no fields were recognised")
} finally {
  await prisma.$disconnect()
}
