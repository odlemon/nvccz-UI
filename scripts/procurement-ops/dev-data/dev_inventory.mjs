// Read-only inventory of procurement data on the dev database, and what links it to accounting.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()

const TEST = /^(UAT|Storyline|E2E|Test\b|TEST)/i
const row = (label, total, test) => console.log(`${label.padEnd(34)} total ${String(total).padStart(5)}   test-named ${String(test).padStart(5)}   other ${String(total - test).padStart(5)}`)

async function count(label, model, field) {
  const all = await prisma[model].findMany({ select: { id: true, [field]: true } })
  const test = all.filter((r) => TEST.test(String(r[field] ?? "")))
  row(label, all.length, test.length)
  const others = all.filter((r) => !TEST.test(String(r[field] ?? ""))).slice(0, 6).map((r) => r[field])
  if (others.length) console.log(`   other examples: ${JSON.stringify(others)}`)
  return { all, test }
}

try {
  const vendors = await prisma.vendor.findMany({ select: { id: true, name: true, email: true } })
  const testVendors = vendors.filter((v) => TEST.test(v.name) || /example\.test$/i.test(v.email ?? ""))
  row("vendors", vendors.length, testVendors.length)
  console.log(`   other vendors: ${JSON.stringify(vendors.filter((v) => !testVendors.includes(v)).map((v) => `${v.name} <${v.email}>`).slice(0, 12))}`)

  await count("purchase_requisitions", "purchaseRequisition", "title")
  await count("procurement_rfqs", "procurementRfq", "title")
  const q = await prisma.vendorQuotation.count(); console.log(`vendor_quotations                  total ${q}`)
  const po = await prisma.purchaseOrder.count(); console.log(`purchase_orders                    total ${po}`)
  const grn = await prisma.goodsReceivedNote.count(); console.log(`goods_received_notes               total ${grn}`)
  await count("procurement_plans", "procurementPlan", "name").catch(async () => count("procurement_plans", "procurementPlan", "title"))
  await count("procurement_contracts", "procurementContract", "title").catch((e) => console.log("contracts:", e.message.slice(0, 120)))
  await count("procurement_documents", "procurementDocument", "name").catch(async () => count("procurement_documents", "procurementDocument", "title"))
  for (const [label, model] of [["procurement_invoices", "procurementInvoice"], ["purchase_invoices", "purchaseInvoice"], ["purchase_invoice_payments", "purchaseInvoicePayment"], ["vendor_invoice_intakes", "vendorInvoiceIntake"]]) {
    console.log(`${label.padEnd(34)} total ${await prisma[model].count()}`)
  }

  const pi = await prisma.purchaseInvoice.findMany({ select: { journalEntryId: true, paymentJournalEntryId: true, cashbookEntryId: true } })
  const pri = await prisma.procurementInvoice.findMany({ select: { journalEntryId: true, cashbookEntryId: true } })
  const pay = await prisma.purchaseInvoicePayment.findMany({ select: { cashbookEntryId: true } })
  const je = new Set([...pi.flatMap((x) => [x.journalEntryId, x.paymentJournalEntryId]), ...pri.map((x) => x.journalEntryId)].filter(Boolean))
  const cb = new Set([...pi.map((x) => x.cashbookEntryId), ...pri.map((x) => x.cashbookEntryId), ...pay.map((x) => x.cashbookEntryId)].filter(Boolean))
  console.log(`journal entries linked to procurement invoices/payments: ${je.size} · cashbook entries: ${cb.size}`)
  const jeAll = await prisma.journalEntry.count()
  const jeProc = await prisma.journalEntry.findMany({ where: { OR: [{ referenceNumber: { contains: "INV_" } }, { description: { contains: "UAT" } }, { description: { contains: "Storyline" } }, { referenceNumber: { startsWith: "JE-P2P" } }] }, select: { referenceNumber: true, description: true, status: true } })
  console.log(`journal_entries total ${jeAll}; test/procurement-looking ${jeProc.length}: ${JSON.stringify(jeProc.slice(0, 8).map((j) => `${j.referenceNumber} ${j.status} ${j.description.slice(0, 50)}`))}`)

  const people = await prisma.user.findMany({
    where: { email: { endsWith: "@nts.local" } },
    select: { email: true, firstName: true, lastName: true, isActive: true, department: { select: { name: true } } },
  }).catch(async () => prisma.user.findMany({ where: { email: { endsWith: "@nts.local" } }, select: { email: true, firstName: true, lastName: true } }))
  console.log(`\npersonas @nts.local: ${people.length}`)
  for (const p of people.filter((p) => /^(proc|perf\.deptmgr|payroll\.(finmgr|intaudit|cfo)|perf\.sysadmin)/.test(p.email))) console.log(`   ${p.email.padEnd(28)} ${p.firstName} ${p.lastName}   ${p.department?.name ?? ""}`)

  const cp = await prisma.companyProfile.findMany({ select: { id: true, legalName: true } })
  console.log(`\ncompany_profile rows: ${JSON.stringify(cp)}`)
  const al = await prisma.auditLog.count().catch(() => "n/a")
  console.log(`audit_logs total: ${al}`)
} finally {
  await prisma.$disconnect()
}
