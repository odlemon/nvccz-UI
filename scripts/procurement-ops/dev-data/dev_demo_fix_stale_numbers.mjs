// DEV only. Document numbers copied into an invoice's JSON before the demo was backdated still carry the old day
// (the three-way match stored on an invoice named GRN_20260913_0001, which became GRN_20260820_0001).
//
//   node dev_demo_fix_stale_numbers.mjs            show what would change
//   node dev_demo_fix_stale_numbers.mjs --apply    write it
//
// Each number is remapped from the invoice's own chain, not by asking whether a record carries it: a test run
// creating today's GRN_…_0001 would otherwise make a stale copy look current. GRN numbers become the GRNs on the
// invoice's own purchase order (same daily suffix, or the only one), the PO number its order's, the invoice number
// its own. Only the demo vendors' invoices are touched.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

const DEMO_VENDORS = [
  "Jacaranda Office Supplies (Pvt) Ltd", "Granite Ridge Stationers (Pvt) Ltd", "Msasa Contract Furniture (Pvt) Ltd",
  "Kopje Office Furniture (Pvt) Ltd", "Baobab Networks & Computing (Pvt) Ltd", "Kestrel Technology Solutions (Pvt) Ltd",
  "Sable Facilities Management (Pvt) Ltd", "Hillside Building Services (Pvt) Ltd", "Mopani Fleet Services (Pvt) Ltd",
]
const TOKEN = /\b(PO|GRN|INV)_(\d{8})_(\d{4})\b/g

try {
  const vendors = await prisma.vendor.findMany({ where: { name: { in: DEMO_VENDORS } }, select: { id: true } })
  const invoices = await prisma.procurementInvoice.findMany({
    where: { vendorId: { in: vendors.map((v) => v.id) } },
    select: { id: true, invoiceNumber: true, purchaseOrderId: true, aiDiscrepancies: true, ocrData: true },
  })
  let changed = 0
  for (const inv of invoices) {
    const po = inv.purchaseOrderId
      ? await prisma.purchaseOrder.findUnique({ where: { id: inv.purchaseOrderId }, select: { poNumber: true } })
      : null
    const grns = inv.purchaseOrderId
      ? (await prisma.goodsReceivedNote.findMany({ where: { purchaseOrderId: inv.purchaseOrderId }, select: { grnNumber: true } })).map((g) => g.grnNumber)
      : []
    const remap = (token, prefix, _day, suffix) => {
      if (prefix === "INV") return inv.invoiceNumber
      if (prefix === "PO") return po?.poNumber ?? token
      if (grns.includes(token)) return token
      const sameSuffix = grns.filter((n) => n.endsWith(`_${suffix}`))
      if (sameSuffix.length === 1) return sameSuffix[0]
      return grns.length === 1 ? grns[0] : token
    }
    const data = {}
    const swaps = new Set()
    for (const field of ["aiDiscrepancies", "ocrData"]) {
      if (inv[field] == null) continue
      const before = JSON.stringify(inv[field])
      const after = before.replace(TOKEN, (...m) => {
        const next = remap(...m)
        if (next !== m[0]) swaps.add(`${m[0]} -> ${next}`)
        return next
      })
      if (after !== before) data[field] = JSON.parse(after)
    }
    console.log(`${inv.invoiceNumber} (PO ${po?.poNumber ?? "-"}, GRNs ${grns.join(", ") || "-"}): ${swaps.size ? [...swaps].join(", ") : "nothing stale"}`)
    if (!Object.keys(data).length) continue
    changed++
    if (APPLY) await prisma.procurementInvoice.update({ where: { id: inv.id }, data })
  }
  console.log(`${changed} demo invoice(s) ${APPLY ? "updated" : "would be updated"}`)
} finally {
  await prisma.$disconnect()
}
