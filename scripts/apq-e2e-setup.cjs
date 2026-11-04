/* eslint-disable */
/**
 * Create the two identities needed to test the Accounting Approval Queue end-to-end as REAL users (local/dev only).
 * Idempotent (upserts). Uses the backend's Prisma client + .env by absolute path (this file lives in the frontend
 * workspace, which the sandbox lets us write), same pattern as create-ceo-user.cjs; bcryptjs so the server's bcrypt
 * verifies the hash unchanged.
 *
 * What it sets up, matched to the traced backend contract:
 *
 *  1) REQUESTER — a non-privileged finance preparer, so a Chart-of-Accounts edit is routed to CFO approval instead of
 *     applied directly:
 *       - ChartOfAccountsController.updateChartOfAccounts branches on isModulePrivilegedUser(user) = isAdminViewer OR
 *         roleCode ADMIN OR isCfoUser. This role's code/name carry NONE of "admin"/"administrator"/"super_admin"/"cfo"/
 *         "chief financial officer", so it is NOT privileged -> a change becomes a MASTER_DATA_COA ApprovalRequest (HTTP 202).
 *       - The accounting guard's ACCOUNTING_DEFAULT needs { write: [manage_accounting] } for PUT /accounting/chart-of-accounts/:id,
 *         and the live COA page only shows "Change" when AL.can('manage_accounting'). So the role JSON carries manage_accounting
 *         (+ view_* so it can open the module). userHasEffectivePermission falls through to roleHasPermissionInJson for it.
 *
 *  2) CFO APPROVER — the queue item must be ACTIONABLE by whoever logs in, and ApprovalService.approverCanActOnApproval lets
 *     only the assigned approverId act on a MASTER_DATA_COA (guardApprove is a no-op for it). The stage routes to every user
 *     whose User.roleCode === "CFO" AT REQUEST-CREATION TIME, so this user must exist before the request is raised. roleCode is
 *     set on the User row (that is the column the router query filters on), on top of a real CFO role.
 *
 * Usage: node scripts/apq-e2e-setup.cjs
 */
const BE = 'C:/Users/lysp/Downloads/nvccz';
require(BE + '/node_modules/dotenv').config({ path: BE + '/.env' });
const { PrismaClient } = require(BE + '/node_modules/@prisma/client');
const bcrypt = require(BE + '/node_modules/bcryptjs');
const prisma = new PrismaClient();

const PASS = 'ApqTest!2026';
const REQ_EMAIL = 'apq.preparer@nts.local';
const CFO_EMAIL = 'apq.cfo@nts.com';
const perm = (name) => ({ name, value: true });

async function ensurePreparerRole() {
  let role = await prisma.role.findFirst({ where: { OR: [{ code: 'APQ_PREPARER' }, { name: 'APQ Preparer (E2E)' }] } });
  const perms = [perm('view_dashboard'), perm('view_reports'), perm('view_accounting'), perm('manage_accounting')];
  if (role) { role = await prisma.role.update({ where: { id: role.id }, data: { code: 'APQ_PREPARER', permissions: perms } }); }
  else { role = await prisma.role.create({ data: { name: 'APQ Preparer (E2E)', code: 'APQ_PREPARER', description: 'Non-privileged finance preparer for Approval Queue E2E (COA edits route to CFO).', permissions: perms } }); }
  return role;
}

async function ensureCfoRole() {
  // Prefer the role an existing roleCode=CFO user already carries, then a CFO-coded role, then by name. Never invent a
  // second CFO role if the platform already has one (the CFO effective-permission path keys off code/signal, not a new row).
  const existingCfoUser = await prisma.user.findFirst({ where: { roleCode: 'CFO' }, select: { roleId: true } });
  if (existingCfoUser && existingCfoUser.roleId) {
    const r = await prisma.role.findUnique({ where: { id: existingCfoUser.roleId } });
    if (r) return r;
  }
  let role = await prisma.role.findFirst({ where: { OR: [{ code: 'CFO' }, { name: 'CFO' }, { name: 'Chief Financial Officer' }] } });
  if (!role) role = await prisma.role.create({ data: { name: 'Chief Financial Officer', code: 'CFO', description: 'CFO', permissions: [perm('view_accounting'), perm('manage_accounting'), perm('manage_ledger')] } });
  return role;
}

async function upsertUser(email, name, roleId, roleCode) {
  const [firstName, lastName] = name.split(' ');
  const hash = bcrypt.hashSync(PASS, 10);
  return prisma.user.upsert({
    where: { email },
    create: { email, password: hash, firstName, lastName, roleId, roleCode, status: 'ACTIVE', mustChangePassword: false, effectiveDate: new Date('2020-01-01') },
    update: { password: hash, roleId, roleCode, status: 'ACTIVE', mustChangePassword: false, effectiveDate: new Date('2020-01-01'), endDate: null },
  });
}

async function main() {
  const prepRole = await ensurePreparerRole();
  const cfoRole = await ensureCfoRole();
  const prep = await upsertUser(REQ_EMAIL, 'Pat Preparer', prepRole.id, 'APQ_PREPARER');
  const cfo = await upsertUser(CFO_EMAIL, 'Cathy CFO', cfoRole.id, 'CFO');

  const privCheck = (u) => ({ roleCode: u.roleCode, privileged: ['ADMIN', 'CFO'].includes(String(u.roleCode || '').toUpperCase()) });
  console.log('[apq] requester:', REQ_EMAIL, '/', PASS, privCheck(prep));
  console.log('[apq] approver :', CFO_EMAIL, '/', PASS, privCheck(cfo));

  const cfg = await prisma.procurementApprovalConfig.findFirst({ where: { isActive: true, stages: { some: { stageType: 'MASTER_DATA_COA' } } }, include: { stages: { where: { stageType: 'MASTER_DATA_COA' } } } });
  console.log('[apq] MASTER_DATA_COA config:', cfg ? `present (${cfg.name}) -> routes to roleCode=${cfg.stages[0].roleCode}` : 'MISSING — COA changes will fail closed (503)');
  const cfoCount = await prisma.user.count({ where: { roleCode: 'CFO' } });
  console.log(`[apq] users now holding roleCode=CFO: ${cfoCount} (a new COA request fans one Approval row to each)`);
  console.log('\nLogins (http://localhost:3001/login):');
  console.log(`  requester (raises COA change): ${REQ_EMAIL} / ${PASS}  -> /accounting/chart-governance`);
  console.log(`  approver  (CFO, decides):      ${CFO_EMAIL} / ${PASS}  -> /accounting/approvals`);
  console.log(`  admin   (posts journals):      admin@nts.com / admin123 -> /accounting/approvals\n`);
}

main().catch((e) => { console.error('[apq] FAILED:', (e && e.stack) || e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
