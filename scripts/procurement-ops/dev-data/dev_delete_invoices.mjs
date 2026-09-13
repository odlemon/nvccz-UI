// Remove procurement invoices a test created on the DEV database, by id. Dev only.
//
//   python dev_api_node.py dev_delete_invoices.mjs <invoiceId> [<invoiceId> ...]
//
// For tests that capture invoices against the demo purchase orders (which the name-based cleanup keeps). Refuses an
// invoice that was approved, paid or posted, so a demo invoice cannot be removed by mistake.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()

if (!/arcus_dev/.test(process.env.DATABASE_URL || "")) {
  console.log("REFUSED: this is not the dev database")
  process.exit(2)
}
const ids = process.argv.slice(2).filter((a) => /^[a-z0-9]{20,40}$/i.test(a))
if (!ids.length) {
  console.log("no invoice ids given")
  process.exit(0)
}
try {
  const rows = await prisma.procurementInvoice.findMany({
    where: { id: { in: ids } },
    select: { id: true, invoiceNumber: true, status: true, paymentStatus: true, journalEntryId: true, cashbookEntryId: true },
  })
  const blocked = rows.filter((r) => String(r.status).toUpperCase() === "APPROVED" || String(r.paymentStatus).toUpperCase() !== "PENDING" || r.journalEntryId || r.cashbookEntryId)
  if (blocked.length) {
    console.log(`REFUSED: approved, paid or posted: ${blocked.map((r) => r.invoiceNumber).join(", ")}`)
    process.exit(2)
  }
  const found = rows.map((r) => r.id)
  const result = await prisma.$transaction(async (tx) => {
    await tx.vendorQuotation.updateMany({ where: { invoiceId: { in: found } }, data: { invoiceId: null } })
    const items = await tx.procurementInvoiceItem.deleteMany({ where: { invoiceId: { in: found } } })
    const invoices = await tx.procurementInvoice.deleteMany({ where: { id: { in: found } } })
    const audit = await tx.auditLog.deleteMany({ where: { entityId: { in: found } } })
    const notifications = await tx.notification.deleteMany({ where: { relatedEntityId: { in: found } } })
    return { invoices: invoices.count, items: items.count, audit: audit.count, notifications: notifications.count }
  })
  console.log(`deleted ${JSON.stringify(result)} · ${rows.map((r) => r.invoiceNumber).join(", ") || "none found"}`)
} finally {
  await prisma.$disconnect()
}
