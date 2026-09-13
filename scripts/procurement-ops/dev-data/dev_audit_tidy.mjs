// The procurement audit trail on the DEV database names only records that exist. Dev only.
//
//   python dev_api_node.py dev_audit_tidy.mjs            dry run: what would change
//   python dev_api_node.py dev_audit_tidy.mjs --apply    change it
//
// Test runs create records and the cleanup removes them; rows about a removed record stayed behind and filled the
// Internal Auditor's page with test activity ("Create RFQ RFQ_20260913_0004" dozens of times). RFQ rows are written
// against the RFQ number (entityType "RFQ") with the RFQ's id in newValues, so a renumbered demo RFQ's rows also
// pointed at a number nobody has, stamped with the day the dataset was rebuilt.
//
// Removes rows whose record no longer exists; points each RFQ row at its RFQ's current number, and moves an RFQ's
// creation row to the RFQ's own creation time.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

if (!/arcus_dev/.test(process.env.DATABASE_URL || "")) {
  console.log("REFUSED: this is not the dev database")
  process.exit(2)
}

// entityType -> the delegate holding that record, as ProcurementAuditController lists them.
const MODELS = {
  PurchaseRequisition: "purchaseRequisition",
  ProcurementRfq: "procurementRfq",
  VendorQuotation: "vendorQuotation",
  PurchaseOrder: "purchaseOrder",
  GoodsReceivedNote: "goodsReceivedNote",
  ProcurementInvoice: "procurementInvoice",
  Vendor: "vendor",
  ProcurementPlan: "procurementPlan",
  ProcurementContract: "procurementContract",
  ProcurementDocument: "procurementDocument",
  VendorInvoiceIntake: "vendorInvoiceIntake",
}

try {
  const existing = new Set()
  for (const delegate of Object.values(MODELS)) {
    for (const r of await prisma[delegate].findMany({ select: { id: true } })) existing.add(r.id)
  }
  const rfqs = await prisma.procurementRfq.findMany({ select: { id: true, rfqNumber: true, createdAt: true } })
  const rfqById = new Map(rfqs.map((r) => [r.id, r]))
  const rfqByNumber = new Map(rfqs.map((r) => [r.rfqNumber, r]))

  const rows = await prisma.auditLog.findMany({
    where: { entityType: { in: [...Object.keys(MODELS), "RFQ"] } },
    select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, newValues: true },
  })

  const remove = []
  const updates = []
  for (const row of rows) {
    if (row.entityType !== "RFQ") {
      if (!existing.has(row.entityId)) remove.push(row)
      continue
    }
    const rfq = rfqById.get(row.newValues?.procurementRfqId) ?? rfqByNumber.get(row.entityId)
    if (!rfq) {
      remove.push(row)
      continue
    }
    const data = {}
    if (row.entityId !== rfq.rfqNumber) data.entityId = rfq.rfqNumber
    // A creation row written a minute or more after the RFQ's own creation time is a rebuilt, backdated record.
    if (/CREATE/i.test(row.action) && row.createdAt.getTime() - rfq.createdAt.getTime() > 60000) data.createdAt = rfq.createdAt
    if (Object.keys(data).length) updates.push({ row, data })
  }

  const byType = {}
  for (const r of remove) byType[r.entityType] = (byType[r.entityType] ?? 0) + 1
  console.log(`procurement audit rows: ${rows.length}`)
  console.log(`about records that no longer exist: ${remove.length} ${JSON.stringify(byType)}`)
  console.log(`RFQ rows to re-point or re-time: ${updates.length}`)
  for (const u of updates.slice(0, 12)) console.log(`  ${u.row.entityId} -> ${JSON.stringify({ ...u.data, createdAt: u.data.createdAt?.toISOString() })}`)

  if (!APPLY) {
    console.log("dry run: nothing changed (pass --apply)")
    process.exit(0)
  }
  const removed = await prisma.auditLog.deleteMany({ where: { id: { in: remove.map((r) => r.id) } } })
  for (const u of updates) await prisma.auditLog.update({ where: { id: u.row.id }, data: u.data })
  console.log(`removed ${removed.count}; updated ${updates.length}`)
} finally {
  await prisma.$disconnect()
}
