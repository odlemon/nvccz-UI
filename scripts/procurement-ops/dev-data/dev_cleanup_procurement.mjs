// Remove test procurement records from the DEV database, with the accounting postings they created.
//
//   node dev_cleanup_procurement.mjs            dry run: what would go, and anything that blocks it
//   node dev_cleanup_procurement.mjs --apply    delete, in one transaction
//
// A record is test data when it, or the chain it belongs to, is named by the suites ("UAT …", "Storyline …",
// "E2E …") or uses a test vendor (@vendors.example.test). Chains are followed both ways: requisition -> RFQ ->
// quotations -> purchase order -> GRN -> invoice -> payment, and anything raised against a test vendor.
// A paid invoice posted an expense journal and a cashbook payment (with its own journal); both go with it.
// Anything else that points at those rows (a reconciliation, a statement line, a non-procurement expense)
// blocks the run: nothing is deleted and the blocker is printed.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")
// --all: every procurement record, not only test-named ones (rebuilding the dev demo dataset from nothing).
const ALL = process.argv.includes("--all")
const TEST = /^(UAT|Storyline|E2E)\b|^UAT-/i
const isTest = (v) => ALL || TEST.test(String(v ?? "").trim())
console.log(`scope: ${ALL ? "ALL procurement records" : "test-named records"}`)
const ids = (rows) => rows.map((r) => r.id)
const uniq = (xs) => [...new Set(xs.filter(Boolean))]

async function safeCount(label, fn) {
  try {
    return [label, await fn()]
  } catch (e) {
    return [label, `n/a (${String(e.message).split("\n")[0].slice(0, 80)})`]
  }
}

try {
  // ------------------------------------------------------------------ select
  const vendors = await prisma.vendor.findMany({ select: { id: true, name: true, email: true } })
  const vendorIds = ids(vendors.filter((v) => isTest(v.name) || /@vendors\.example\.test$/i.test(v.email ?? "")))

  const reqs = await prisma.purchaseRequisition.findMany({ select: { id: true, title: true } })
  const reqIds = ids(reqs.filter((r) => isTest(r.title)))

  const rfqs = await prisma.procurementRfq.findMany({ select: { id: true, title: true, requisitionId: true } })
  const rfqIds = ids(rfqs.filter((r) => isTest(r.title) || reqIds.includes(r.requisitionId)))

  const quotes = await prisma.vendorQuotation.findMany({ select: { id: true, procurementRfqId: true, vendorId: true } })
  const quoteIds = ids(quotes.filter((q) => rfqIds.includes(q.procurementRfqId) || vendorIds.includes(q.vendorId)))

  const pos = await prisma.purchaseOrder.findMany({ select: { id: true, requisitionId: true, quotationId: true, vendorId: true } })
  const poIds = ids(pos.filter((p) => reqIds.includes(p.requisitionId) || quoteIds.includes(p.quotationId) || vendorIds.includes(p.vendorId)))

  const grns = await prisma.goodsReceivedNote.findMany({ where: { purchaseOrderId: { in: poIds } }, select: { id: true } })
  const grnIds = ids(grns)

  const invoices = await prisma.procurementInvoice.findMany({
    where: { OR: [{ purchaseOrderId: { in: poIds } }, { vendorId: { in: vendorIds } }] },
    select: { id: true, journalEntryId: true, cashbookEntryId: true },
  })
  const invoiceIds = ids(invoices)
  const cashbookIds = uniq(invoices.map((i) => i.cashbookEntryId))
  const cashbook = await prisma.cashbookEntry.findMany({
    where: { OR: [{ id: { in: cashbookIds } }, { vendorId: { in: vendorIds } }] },
    select: { id: true, journalEntryId: true },
  })
  const cbIds = ids(cashbook)
  const journalIds = uniq([...invoices.map((i) => i.journalEntryId), ...cashbook.map((c) => c.journalEntryId)])

  const intakes = await prisma.vendorInvoiceIntake.findMany({
    where: { OR: [{ vendorId: { in: vendorIds } }, { sourcePurchaseOrderId: { in: poIds } }, { goodsReceivedNoteId: { in: grnIds } }] },
    select: { id: true },
  })
  const intakeIds = ids(intakes)

  const plans = await prisma.procurementPlan.findMany({ select: { id: true, name: true } })
  const planIds = ids(plans.filter((p) => isTest(p.name)))
  const contracts = await prisma.procurementContract.findMany({ select: { id: true, title: true } })
  const contractIds = ids(contracts.filter((c) => isTest(c.title)))
  const docs = await prisma.procurementDocument.findMany({ select: { id: true, name: true } })
  const docIds = ids(docs.filter((d) => isTest(d.name)))

  const plan = {
    vendors: vendorIds.length, requisitions: reqIds.length, rfqs: rfqIds.length, quotations: quoteIds.length,
    purchaseOrders: poIds.length, grns: grnIds.length, invoices: invoiceIds.length, intakes: intakeIds.length,
    plans: planIds.length, contracts: contractIds.length, documents: docIds.length,
    cashbookEntries: cbIds.length, journalEntries: journalIds.length,
  }
  console.log("to remove:", JSON.stringify(plan))

  // ------------------------------------------------------------------ blockers
  const blockers = Object.fromEntries(
    await Promise.all([
      safeCount("expenses on test vendors or journals", () => prisma.expense.count({ where: { OR: [{ vendorId: { in: vendorIds } }, { journalEntryId: { in: journalIds } }] } })),
      safeCount("accounting invoices on test vendors or journals", () => prisma.invoice.count({ where: { OR: [{ vendorId: { in: vendorIds } }, { journalEntryId: { in: journalIds } }] } })),
      safeCount("inventory items supplied by test vendors", () => prisma.inventoryItem.count({ where: { supplierId: { in: vendorIds } } })),
      safeCount("statements of account", () => prisma.statementOfAccount.count({ where: { vendorId: { in: vendorIds } } })),
      safeCount("employees reimbursed through test vendors", () => prisma.employee.count({ where: { reimbursementVendorId: { in: vendorIds } } })),
      safeCount("fund disbursements", () => prisma.fundDisbursement.count({ where: { cashbookEntryId: { in: cbIds } } })),
      safeCount("reconciliation session lines", () => prisma.cashbookReconciliationSessionLine.count({ where: { cashbookEntryId: { in: cbIds } } })),
      safeCount("bank statement matches", () => prisma.bankStatementItem.count({ where: { matchedTransactionId: { in: cbIds } } })),
      safeCount("reconciliation mismatches", () => prisma.reconciliationMismatch.count({ where: { transactionId: { in: cbIds } } })),
      safeCount("contra entries", () => prisma.contraEntry.count({ where: { cashbookEntryId: { in: cbIds } } })),
      safeCount("purchase invoices on test vendors", () => prisma.purchaseInvoice.count({ where: { vendorId: { in: vendorIds } } })),
      safeCount("cashbook reversals of test payments", () => prisma.cashbookEntry.count({ where: { originalTransactionId: { in: cbIds }, id: { notIn: cbIds } } })),
    ]),
  )
  const receipts = await safeCount("receipts for test vendors", () => prisma.receipt.count({ where: { vendorId: { in: vendorIds } } }))
  console.log("blockers:", JSON.stringify(blockers))
  console.log("receipts (removed with their vendor):", JSON.stringify(receipts[1]))
  const blocking = Object.entries(blockers).filter(([, n]) => typeof n === "number" && n > 0)
  if (blocking.length) {
    console.log(`REFUSED: ${blocking.map(([k, n]) => `${n} ${k}`).join("; ")}`)
    process.exit(2)
  }

  const deletedIds = [vendorIds, reqIds, rfqIds, quoteIds, poIds, grnIds, invoiceIds, intakeIds, planIds, contractIds, docIds, cbIds, journalIds].flat()
  // RFQ creations are audited against the RFQ number (entityType "RFQ") with the RFQ's id in newValues, so matching
  // on entityId alone left every removed test RFQ's "Create RFQ" row in the Internal Auditor's trail.
  const rfqAuditIds = (await prisma.auditLog.findMany({ where: { entityType: "RFQ" }, select: { id: true, newValues: true } }))
    .filter((a) => rfqIds.includes(a.newValues?.procurementRfqId))
    .map((a) => a.id)
  const auditWhere = { OR: [{ entityId: { in: deletedIds } }, { id: { in: rfqAuditIds } }] }
  const auditCount = await prisma.auditLog.count({ where: auditWhere })
  const notifCount = await prisma.notification.count({ where: { relatedEntityId: { in: deletedIds } } })
  console.log(`audit rows about them: ${auditCount} · notifications about them: ${notifCount}`)

  if (!APPLY) {
    console.log("dry run: nothing deleted (pass --apply)")
    process.exit(0)
  }

  // ------------------------------------------------------------------ delete, children first
  const n = await prisma.$transaction(
    async (tx) => {
      const out = {}
      const del = async (label, fn) => { out[label] = (await fn()).count }
      if (typeof receipts[1] === "number") await del("receipts", () => tx.receipt.deleteMany({ where: { vendorId: { in: vendorIds } } }))
      await del("intakes", () => tx.vendorInvoiceIntake.deleteMany({ where: { id: { in: intakeIds } } }))
      await tx.vendorQuotation.updateMany({ where: { invoiceId: { in: invoiceIds } }, data: { invoiceId: null } })
      await del("invoices", () => tx.procurementInvoice.deleteMany({ where: { id: { in: invoiceIds } } }))
      await tx.cashbookEntry.updateMany({ where: { originalTransactionId: { in: cbIds } }, data: { originalTransactionId: null } })
      await del("paymentAllocations", () => tx.paymentAllocation.deleteMany({ where: { cashbookEntryId: { in: cbIds } } }))
      await del("cashbookEntries", () => tx.cashbookEntry.deleteMany({ where: { id: { in: cbIds } } }))
      await del("journalEntries", () => tx.journalEntry.deleteMany({ where: { id: { in: journalIds } } }))
      await del("grnItems", () => tx.goodsReceivedNoteItem.deleteMany({ where: { grnId: { in: grnIds } } }))
      await del("grns", () => tx.goodsReceivedNote.deleteMany({ where: { id: { in: grnIds } } }))
      await tx.purchaseInvoice.updateMany({ where: { sourcePurchaseOrderId: { in: poIds } }, data: { sourcePurchaseOrderId: null } })
      await tx.purchaseOrder.updateMany({ where: { amendmentOfPoId: { in: poIds } }, data: { amendmentOfPoId: null } })
      await del("purchaseOrders", () => tx.purchaseOrder.deleteMany({ where: { id: { in: poIds } } }))
      await del("quotations", () => tx.vendorQuotation.deleteMany({ where: { id: { in: quoteIds } } }))
      await del("rfqs", () => tx.procurementRfq.deleteMany({ where: { id: { in: rfqIds } } }))
      await del("requisitions", () => tx.purchaseRequisition.deleteMany({ where: { id: { in: reqIds } } }))
      await del("plans", () => tx.procurementPlan.deleteMany({ where: { id: { in: planIds } } }))
      await del("contracts", () => tx.procurementContract.deleteMany({ where: { id: { in: contractIds } } }))
      await del("documents", () => tx.procurementDocument.deleteMany({ where: { id: { in: docIds } } }))
      await del("vendorBanks", () => tx.vendorBank.deleteMany({ where: { vendorId: { in: vendorIds } } }))
      await del("vendorKyc", () => tx.vendorKycDocument.deleteMany({ where: { vendorId: { in: vendorIds } } }))
      await del("vendorAttachments", () => tx.vendorDocumentAttachment.deleteMany({ where: { vendorId: { in: vendorIds } } }))
      await del("vendors", () => tx.vendor.deleteMany({ where: { id: { in: vendorIds } } }))
      await del("auditRows", () => tx.auditLog.deleteMany({ where: auditWhere }))
      await del("notifications", () => tx.notification.deleteMany({ where: { relatedEntityId: { in: deletedIds } } }))
      return out
    },
    { timeout: 300000, maxWait: 60000 },
  )
  console.log("deleted:", JSON.stringify(n))

  const left = {
    vendors: await prisma.vendor.count({ where: { id: { in: vendorIds } } }),
    requisitions: await prisma.purchaseRequisition.count({ where: { id: { in: reqIds } } }),
    purchaseOrders: await prisma.purchaseOrder.count({ where: { id: { in: poIds } } }),
    journalEntries: await prisma.journalEntry.count({ where: { id: { in: journalIds } } }),
  }
  console.log("left behind:", JSON.stringify(left))
} finally {
  await prisma.$disconnect()
}
