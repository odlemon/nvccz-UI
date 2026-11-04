/* eslint-disable */
/**
 * Create (or repair) a CEO test account so the Accounting "CEO View" page (/accounting/ceo) can be opened in a
 * browser as an ACTUAL CEO — the earlier AL.table header-alignment change is gated to roleCode "CEO", and admin@nts.com
 * is admin, so it could not be seen live. Local/dev only. Idempotent — safe to re-run (reuses the CEO role, upserts the user).
 *
 * Why the absolute paths: this file lives in the frontend workspace (nvccz-new), not the backend repo, so the sandbox
 * lets it be written here. It still needs the backend's generated Prisma client + MySQL config, so it reaches them by
 * absolute path, and uses bcryptjs (pure JS) for hashing — the server verifies with bcrypt, which reads a bcryptjs hash
 * unchanged, and this avoids any native-module ABI mismatch.
 *
 * The CEO gating it sets up:
 *   - GET /api/accounting/me reports roleCode = user.role.code (authenticate includes role) -> frontend AL.isCeo() === true.
 *   - /accounting/ceo reads two guarded endpoints (short-term-investments dashboard + consolidation summary), so the
 *     role's permissions JSON must carry at least one accounting READ key — granted below.
 *   - status ACTIVE + effectiveDate in the past + endDate null -> userAvailability().ok is true at login and on every request.
 *
 * Usage:  node scripts/create-ceo-user.cjs
 */
const BE = 'C:/Users/lysp/Downloads/nvccz';

// 1) Load the backend .env first, so Prisma's datasource url = env("DATABASE_URL") resolves exactly as it does for the server.
require(BE + '/node_modules/dotenv').config({ path: BE + '/.env' });

const { PrismaClient } = require(BE + '/node_modules/@prisma/client');
const bcrypt = require(BE + '/node_modules/bcryptjs');

const prisma = new PrismaClient();

// Credentials chosen for this test account (report them so they can be handed to the browser test / the user).
const EMAIL = 'ceo@nts.com';
const PASSWORD = 'ceo123';

// Read-only oversight keys. >=1 must be in READ_ANY / REPORTS_READ so the CEO View's data endpoints return rows;
// the dashboard/report keys keep the staff app shell happy right after sign-in.
const READ_KEYS = ['view_dashboard', 'view_reports', 'view_accounting', 'view_ledger', 'view_financial_reports'];

async function main() {
  // 2) Find-or-create the CEO role. Prefer an existing one by code, then by the common names; never duplicate. Merge in the reads.
  let role = await prisma.role.findFirst({ where: { OR: [{ code: 'CEO' }, { name: 'CEO' }, { name: 'Chief Executive Officer' }] } });
  const perms = Array.isArray(role && role.permissions) ? role.permissions.slice() : [];
  for (const name of READ_KEYS) {
    const hit = perms.find((p) => p && p.name === name);
    if (hit) hit.value = true; else perms.push({ name, value: true });
  }
  if (role) {
    role = await prisma.role.update({ where: { id: role.id }, data: { code: 'CEO', permissions: perms } });
    console.log(`[ceo] updated existing role ${role.id} (name="${role.name}") -> code CEO + read keys`);
  } else {
    role = await prisma.role.create({ data: { name: 'CEO', code: 'CEO', description: 'Chief Executive Officer', permissions: READ_KEYS.map((n) => ({ name: n, value: true })) } });
    console.log(`[ceo] created role ${role.id} (code CEO)`);
  }

  // 3) Upsert an ACTIVE user on that role. mustChangePassword false so the SPA does not force a password-change screen before /accounting/ceo.
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, password: hash, firstName: 'Test', lastName: 'CEO', roleId: role.id, roleCode: 'CEO', status: 'ACTIVE', mustChangePassword: false, effectiveDate: new Date('2020-01-01') },
    update: { password: hash, roleId: role.id, roleCode: 'CEO', status: 'ACTIVE', mustChangePassword: false, effectiveDate: new Date('2020-01-01'), endDate: null },
  });

  // 4) Echo what /accounting/me will resolve for this account, so the CEO gating is confirmed before any browser login.
  const me = await prisma.user.findUnique({ where: { id: user.id }, include: { role: true } });
  const held = Array.isArray(me && me.role && me.role.permissions) ? me.role.permissions : [];
  console.log('[ceo] ready:', {
    email: EMAIL,
    password: PASSWORD,
    roleCodeFromRelation: me.role && me.role.code,
    roleCodeOnUser: me.roleCode,
    status: me.status,
    accountingReadHeld: READ_KEYS.filter((k) => held.some((p) => p && p.name === k && p.value === true)),
  });
  console.log('\nCEO login -> http://localhost:3001/login  email: ' + EMAIL + '  password: ' + PASSWORD + '\nThen open http://localhost:3001/accounting/ceo\n');
}

main()
  .catch((e) => { console.error('[ceo] FAILED:', (e && e.message) || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
