/* eslint-disable */
/**
 * READ-ONLY inspection of the approval-queue backing state, to plan an end-to-end test. It mutates nothing.
 * Reaches the backend's Prisma client + .env by absolute path (this file lives in the frontend workspace, which the
 * sandbox allows writing to) — same pattern as create-ceo-user.cjs.
 *
 * Usage: node scripts/apq-e2e-inspect.cjs
 */
const BE = 'C:/Users/lysp/Downloads/nvccz';
require(BE + '/node_modules/dotenv').config({ path: BE + '/.env' });
const { PrismaClient } = require(BE + '/node_modules/@prisma/client');
const prisma = new PrismaClient();

const line = (s) => console.log(s);
const hdr = (s) => console.log('\n=== ' + s + ' ===');

async function main() {
  hdr('admin + a couple of identities');
  for (const email of ['admin@nts.com']) {
    const u = await prisma.user.findFirst({ where: { email }, include: { role: true } });
    if (u) line(`${email}: id=${u.id} roleCode=${u.roleCode} roleId=${u.roleId} role.name=${u.role && u.role.name} role.code=${u.role && u.role.code} status=${u.status}`);
    else line(`${email}: NOT FOUND`);
  }

  hdr('users by approver-relevant roleCode (CFO / ADMIN)');
  for (const rc of ['CFO', 'ADMIN']) {
    const us = await prisma.user.findMany({ where: { roleCode: rc }, select: { id: true, email: true, status: true, roleCode: true } });
    line(`roleCode=${rc}: ${us.length} user(s)`);
    us.forEach((u) => line(`   - ${u.email} [${u.status}] ${u.id}`));
  }

  hdr('MASTER_DATA_COA approval config + stages');
  const cfgs = await prisma.procurementApprovalConfig.findMany({
    where: { stages: { some: { stageType: 'MASTER_DATA_COA' } } },
    include: { stages: { where: { stageType: 'MASTER_DATA_COA' }, orderBy: { stepNumber: 'asc' } } },
  });
  if (!cfgs.length) line('NO config has a MASTER_DATA_COA stage (COA edits by non-privileged users will FAIL CLOSED / 202 never returned).');
  cfgs.forEach((c) => {
    line(`config ${c.id} "${c.name}" isActive=${c.isActive} department=${c.department}`);
    c.stages.forEach((s) => line(`   step ${s.stepNumber} "${s.stepName}" stepType=${s.stepType} roleCode=${s.roleCode} userId=${s.userId} departmentId=${s.departmentId} amountThreshold=${s.amountThreshold}`));
  });

  hdr('PENDING approval requests, grouped by stageType');
  const reqGroups = await prisma.approvalRequest.groupBy({ by: ['stageType', 'status'], where: { status: 'PENDING' }, _count: { _all: true } });
  if (!reqGroups.length) line('no PENDING approval requests at all');
  reqGroups.forEach((g) => line(`   ${g.stageType}: ${g._count._all}`));

  hdr('PENDING Approval rows currently assigned (what /me/queue would surface), first 20');
  const assigned = await prisma.approval.findMany({
    where: { status: 'PENDING', request: { status: 'PENDING' } },
    include: { approver: { select: { email: true, roleCode: true } }, request: { select: { stageType: true } }, stage: { select: { stepNumber: true, stepName: true } } },
    orderBy: { createdAt: 'asc' }, take: 20,
  });
  if (!assigned.length) line('nobody has any approval-request item on their queue');
  assigned.forEach((a) => line(`   approval=${a.id} approver=${a.approver && a.approver.email} [${a.approver && a.approver.roleCode}] stageType=${a.request.stageType} step=${a.stage.stepNumber}`));

  hdr('PENDING journal entries (the kind:journal queue feed) — count + samples not created by admin');
  const admin = await prisma.user.findFirst({ where: { email: 'admin@nts.com' }, select: { id: true } });
  const pjCount = await prisma.journalEntry.count({ where: { status: 'PENDING' } });
  const pjOther = await prisma.journalEntry.count({ where: { status: 'PENDING', NOT: { createdById: admin.id } } });
  line(`PENDING journals total=${pjCount}, NOT created by admin=${pjOther}`);
  const samples = await prisma.journalEntry.findMany({
    where: { status: 'PENDING', NOT: { createdById: admin.id } },
    select: { id: true, referenceNumber: true, description: true, totalAmount: true, status: true, createdById: true, createdAt: true },
    orderBy: { createdAt: 'asc' }, take: 12,
  });
  samples.forEach((j) => line(`   ${j.id} ref=${j.referenceNumber} amt=${j.totalAmount} "${(j.description || '').slice(0, 46)}" by=${j.createdById}`));

  hdr('a few COA accounts a non-privileged requester could propose an edit to');
  const coa = await prisma.chartOfAccounts.findMany({
    where: { isActive: true },
    select: { id: true, accountNo: true, accountName: true, accountType: true, notes: true, isActive: true },
    orderBy: { accountNo: 'asc' }, take: 8,
  });
  coa.forEach((a) => line(`   ${a.id} #${a.accountNo} "${a.accountName}" type=${a.accountType} notes=${(a.notes || '').slice(0, 40)} active=${a.isActive}`));
}

main()
  .catch((e) => { console.error('[inspect] FAILED:', (e && e.stack) || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
