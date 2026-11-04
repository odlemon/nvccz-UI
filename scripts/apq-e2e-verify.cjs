/* eslint-disable */
/**
 * READ-ONLY verification snapshot for the Approval Queue end-to-end test. Prints the two target Chart-of-Accounts rows,
 * every MASTER_DATA_COA approval request (with its proposed change, status and per-approver Approval rows), and the
 * status of any journal entries whose id/reference is passed as argv. Run it before and after the browser actions to
 * prove the backend records actually change. Usage: node scripts/apq-e2e-verify.cjs [journalIdOrRef ...]
 */
const BE = 'C:/Users/lysp/Downloads/nvccz';
require(BE + '/node_modules/dotenv').config({ path: BE + '/.env' });
const { PrismaClient } = require(BE + '/node_modules/@prisma/client');
const prisma = new PrismaClient();

const APPROVE_TARGET = 'cmtpzsymr0001uni4ssn64dqe'; // Petty Cash #1010 — expect notes CHANGED after CFO approves
const REJECT_TARGET = 'cmtpzsymx0002uni47acqq9qu';  // Petty Cash / Cash Clearing #1030 — expect notes UNCHANGED after CFO rejects

async function acct(id, label) {
  const a = await prisma.chartOfAccounts.findUnique({ where: { id }, select: { id: true, accountNo: true, accountName: true, notes: true, isActive: true, updatedAt: true } });
  console.log(`  [${label}] #${a && a.accountNo} "${a && a.accountName}" notes=${JSON.stringify(a && a.notes)} active=${a && a.isActive} updatedAt=${a && a.updatedAt}`);
}

async function main() {
  console.log('=== target COA rows ===');
  await acct(APPROVE_TARGET, 'approve-target');
  await acct(REJECT_TARGET, 'reject-target');

  console.log('\n=== MASTER_DATA_COA approval requests ===');
  const reqs = await prisma.approvalRequest.findMany({
    where: { stageType: 'MASTER_DATA_COA' },
    include: { approvals: { include: { approver: { select: { email: true } }, stage: { select: { stepNumber: true } } } }, requestedBy: { select: { email: true } } },
    orderBy: { requestDate: 'desc' }, take: 20,
  });
  if (!reqs.length) console.log('  (none yet)');
  for (const r of reqs) {
    const ed = r.entityData || {};
    console.log(`  req=${r.id} entity=${r.entityId} status=${r.status} step=${r.currentStep}/${r.totalSteps} requestedBy=${r.requestedBy && r.requestedBy.email} proposal=${JSON.stringify({ notes: ed.notes, accountName: ed.accountName, isActive: ed.isActive })} completedAt=${r.completedAt || '-'}`);
    for (const ap of r.approvals) console.log(`      approval=${ap.id} approver=${ap.approver.email} step=${ap.stage.stepNumber} status=${ap.status}${ap.comments ? ` comment=${JSON.stringify(String(ap.comments).slice(0, 40))}` : ''}`);
  }

  const args = process.argv.slice(2);
  if (args.length) {
    console.log('\n=== journals by id-or-reference ===');
    for (const k of args) {
      const j = await prisma.journalEntry.findFirst({ where: { OR: [{ id: k }, { referenceNumber: k }] }, select: { id: true, referenceNumber: true, status: true, totalAmount: true, postedAt: true, _count: { select: { journalEntryLines: true } } } });
      console.log(`  ${k}: ${j ? `ref=${j.referenceNumber} status=${j.status} lines=${j._count.journalEntryLines} postedAt=${j.postedAt || '-'}` : 'NOT FOUND'}`);
    }
  }
}

main().catch((e) => { console.error('[verify] FAILED:', (e && e.stack) || e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
