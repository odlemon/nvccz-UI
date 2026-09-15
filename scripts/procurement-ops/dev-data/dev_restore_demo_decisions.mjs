// DEV only: put two demo records back where the demo storyline expects them, after a manual decision on dev.
// On 13 Sep 2026 at 19:21 (CAT) the Admin NTS account approved the FY 2027 plan and returned the projector requisition
// for correction. demo_integrity.mjs expects the plan waiting on Finance and the requisition waiting on the department head.
//
//   python dev_api_node.py dev_restore_demo_decisions.mjs            dry run: what would change
//   python dev_api_node.py dev_restore_demo_decisions.mjs --apply    change it, in one transaction
//
// Refuses anywhere but the dev database, and refuses if either record is no longer in the state that decision left it.
// Audit rows stay (the decisions happened); the notifications announcing them are removed.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

if (!/arcus_dev/.test(process.env.DATABASE_URL || "")) {
  console.log("REFUSED: this is not the dev database")
  process.exit(2)
}
const REQ_ID = "cmtzc7w1602uznu01fa519rai" // REQ_20260911_0008 · Training room projector replacement
const PLAN_ID = "cmtzc7ugk02ktnu01cw66my7o" // APP-2027-001 · FY 2027 Operations Procurement Plan
const FROM = new Date("2026-09-13T17:21:00Z")
const TO = new Date("2026-09-13T17:23:00Z")

try {
  const req = await prisma.purchaseRequisition.findUnique({ where: { id: REQ_ID }, select: { requisitionNumber: true, title: true, status: true, rejectionReason: true } })
  const plan = await prisma.procurementPlan.findUnique({ where: { id: PLAN_ID }, select: { name: true, status: true, approvedAt: true, approvedById: true, submittedAt: true } })
  console.log(`requisition: ${req?.requisitionNumber} ${req?.status} · reason ${String(req?.rejectionReason ?? "").slice(0, 80)}`)
  console.log(`plan: ${plan?.name} ${plan?.status} · approvedAt ${plan?.approvedAt?.toISOString?.() ?? "-"}`)
  if (req?.status !== "REJECTED" || plan?.status !== "APPROVED") {
    console.log("REFUSED: the records are not in the state the 19:21 decisions left them; nothing changed")
    process.exit(3)
  }
  const requests = await prisma.approvalRequest.findMany({ where: { entityId: REQ_ID, status: "REJECTED", rejectedAt: { gte: FROM, lte: TO } }, select: { id: true, status: true, currentStep: true, totalSteps: true } })
  const requestIds = requests.map((r) => r.id)
  const approvals = requestIds.length
    ? await prisma.approval.findMany({ where: { requestId: { in: requestIds }, updatedAt: { gte: FROM, lte: TO } }, select: { id: true, status: true, stageId: true, approverId: true } })
    : []
  const notes = await prisma.notification.findMany({ where: { relatedEntityId: { in: [REQ_ID, PLAN_ID] }, createdAt: { gte: FROM, lte: TO } }, select: { id: true, type: true, title: true } })
  console.log(`approval request(s) to reopen: ${requests.map((r) => `${r.id} step ${r.currentStep}/${r.totalSteps}`).join(", ") || "none"}`)
  console.log(`approval rows back to PENDING: ${approvals.map((a) => `${a.status}`).join(", ") || "none"} (${approvals.length})`)
  console.log(`notifications to remove: ${notes.length} (${[...new Set(notes.map((n) => n.type))].join(", ")})`)
  if (!APPLY) {
    console.log("dry run: nothing changed (add --apply)")
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.purchaseRequisition.update({ where: { id: REQ_ID }, data: { status: "PENDING_APPROVAL", rejectionReason: null, rejectionContentFingerprint: null } })
      if (requestIds.length) {
        await tx.approvalRequest.updateMany({ where: { id: { in: requestIds } }, data: { status: "PENDING", rejectedAt: null, rejectionReason: null, completedAt: null } })
        await tx.approval.updateMany({ where: { id: { in: approvals.map((a) => a.id) } }, data: { status: "PENDING", rejectedAt: null, approvedAt: null, comments: null, delegatedToId: null, delegatedAt: null } })
      }
      await tx.procurementPlan.update({ where: { id: PLAN_ID }, data: { status: "SUBMITTED", approvedAt: null, approvedById: null } })
      if (notes.length) await tx.notification.deleteMany({ where: { id: { in: notes.map((n) => n.id) } } })
    })
    const after = await prisma.purchaseRequisition.findUnique({ where: { id: REQ_ID }, select: { status: true } })
    const planAfter = await prisma.procurementPlan.findUnique({ where: { id: PLAN_ID }, select: { status: true } })
    console.log(`restored: requisition ${after?.status}, plan ${planAfter?.status}`)
  }
} finally {
  await prisma.$disconnect()
}
