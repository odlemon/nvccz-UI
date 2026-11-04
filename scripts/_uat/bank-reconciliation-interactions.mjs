import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { config } from 'dotenv'
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(here, '../..')
const backendRoot = resolve(frontendRoot, '../nvccz')
config({ path: join(backendRoot, '.env'), override: false })
process.env.TS_NODE_PROJECT ||= join(backendRoot, 'tsconfig.json')
const backendRequire = createRequire(join(backendRoot, 'package.json'))
const { PrismaClient } = backendRequire('@prisma/client')
const bcrypt = backendRequire('bcrypt')
const pdfParse = backendRequire('pdf-parse')
const XLSX = backendRequire(join(frontendRoot, 'node_modules/xlsx'))
// pdf-lib is a frontend dependency. The backend's CBZ parser is TypeScript, which plain
// node cannot require; this script instead writes a statement in the exact layout that
// parser reads, and the API parses that PDF for real through its own service.
const { PDFDocument, StandardFonts } = backendRequire(join(frontendRoot, 'node_modules/pdf-lib'))

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
// The staff portal's API for THIS workspace is 3019 (.env.local: NEXT_PUBLIC_API_BASE_URL).
// Port 3009 belongs to a different project on this machine, so a 3009 default tests the
// wrong backend and its 401/403 answers prove nothing about this workflow.
const apiBase = process.env.ACCOUNTING_API_BASE_URL || 'http://127.0.0.1:3019/api'
// Generated documents are Matanho-branded on loopback/dev hosts and NVCCZ-branded in
// production (lib/accounting-v52/export.ts). Assert whatever this host should produce.
const DEV_HOST = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i
const DEV_HOST_NAME = /(^|[.-])(dev|development|stage|staging|uat|test|local)([.-]|$)|\.local$/i
const hostname = new URL(base).hostname.toLowerCase()
const expectedBrand = (DEV_HOST.test(hostname) || DEV_HOST_NAME.test(hostname))
  ? { name: 'Matanho', logo: '/new_logo.png' }
  : { name: process.env.EXPECTED_ORG_NAME || 'NVCCZ', logo: process.env.EXPECTED_ORG_LOGO || '/nvccz-logo.png' }
const artifactDir = join(frontendRoot, 'test-artifacts/accounting-bank-reconciliation')
const run = randomBytes(5).toString('hex').toUpperCase()
const email = `bank-rec-${run.toLowerCase()}@example.test`
const blockedEmail = `bank-rec-blocked-${run.toLowerCase()}@example.test`
const reopenDeniedEmail = `bank-rec-no-reopen-${run.toLowerCase()}@example.test`
const flatOnlyEmail = `bank-rec-flat-${run.toLowerCase()}@example.test`
const password = randomBytes(24).toString('base64url')
const blockedPassword = randomBytes(24).toString('base64url')
const reopenDeniedPassword = randomBytes(24).toString('base64url')
const flatOnlyPassword = randomBytes(24).toString('base64url')
const prisma = new PrismaClient()
const evidence = { checks: {}, exports: [], errors: [], findings: [], apiErrors: [], requests: {}, races: [], uploads: [], finishes: [], finishAttempts: [], dialogs: [], brand: expectedBrand }
const mark = (name, value = true) => { evidence.checks[name] = value }
const startedAt = new Date()
let fixture = null
let browser = null
// Disposable period-lock bookkeeping: only rows this run created are removed, and a
// pre-existing real lock is refused rather than overwritten.
const lockFixture = { createdLockIds: [], restoredLocks: [], legacyLockIds: [] }

const r2 = (n) => Math.round(n * 100) / 100
const moneyText = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const statementDay = (iso) => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${String(Number(y) - 2000).padStart(2, '0')}` }
/** Escapes a rendered number ("1,198,900.07") for use inside a locator regex. */
const re = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * A synthetic statement, laid out exactly as `CBZStatementPdfParser.ts` reads a CBZ PDF:
 * one page, the `Posting` table above `Summary Of Statement`, transaction date left of
 * x=35, value date 45-85, description 85-250, reference 250-395, debit 395-460, credit
 * 460-530, balance beyond 530, and exactly four money cells under the summary heading in
 * opening / debit / credit / closing order.
 *
 * The client's supplied statement is deliberately not used as a fixture: its account
 * number would be written to the local bank record and shown in the bank selector of
 * every screenshot. Everything generated here is invented and safe to keep.
 */
const STATEMENT_DATE = '2026-10-20'
const STATEMENT_LINES = [
  { date: '2026-10-01', dir: 'C', amount: 150000.00, description: 'UAT customer receipt one' },
  { date: '2026-10-03', dir: 'D', amount: 45250.50, description: 'UAT supplier payment one' },
  { date: '2026-10-06', dir: 'C', amount: 78900.00, description: 'UAT customer receipt two' },
  { date: '2026-10-09', dir: 'D', amount: 12345.67, description: 'UAT supplier payment two' },
  { date: '2026-10-13', dir: 'D', amount: 3004.00, description: 'UAT rent payment' },
  { date: '2026-10-15', dir: 'C', amount: 21700.25, description: 'UAT customer receipt three' },
  { date: '2026-10-18', dir: 'C', amount: 9999.99, description: 'UAT interest received' },
  { date: '2026-10-20', dir: 'D', amount: 1000.00, description: 'UAT utility payment' },
]

function buildStatementModel(accountNumber, currencyCode) {
  const opening = 1000000
  let balance = opening
  let debits = 0
  let credits = 0
  const lines = STATEMENT_LINES.map((line, index) => {
    const debitAmount = line.dir === 'D' ? line.amount : 0
    const creditAmount = line.dir === 'C' ? line.amount : 0
    balance = r2(balance + creditAmount - debitAmount)
    debits = r2(debits + debitAmount)
    credits = r2(credits + creditAmount)
    return {
      transactionDate: `${line.date}T12:00:00.000Z`,
      reference: `UAT-${line.dir}${index + 1}-${run}`,
      description: line.description,
      debitAmount,
      creditAmount,
      balance,
    }
  })
  return { accountNumber, currencyCode, opening, closing: balance, debits, credits, lines, statementDate: STATEMENT_DATE }
}

async function buildStatementPdf(stmt) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const at = (text, x, y) => page.drawText(text, { x, y, size: 9, font })
  at('CBZ BANK - SYNTHETIC TEST STATEMENT', 50, 800)
  at('Account Number', 50, 780)
  at(stmt.accountNumber, 50, 766)
  at('Currency', 300, 780)
  at(stmt.currencyCode, 300, 766)
  at('Statement Period', 420, 780)
  at('01 OCT 2026 - 20 OCT 2026', 420, 766)
  at('Posting', 50, 700)
  at('Transaction Date', 10, 686)
  at('Value Date', 50, 686)
  at('Description', 90, 686)
  at('Reference', 260, 686)
  at('Debit', 400, 686)
  at('Credit', 470, 686)
  at('Balance', 540, 686)
  let y = 660
  for (const line of stmt.lines) {
    const day = statementDay(line.transactionDate)
    at(day, 10, y)
    at(day, 60, y)
    at(line.description, 90, y)
    at(line.reference, 260, y)
    if (line.debitAmount) at(moneyText(line.debitAmount), 400, y)
    if (line.creditAmount) at(moneyText(line.creditAmount), 470, y)
    at(moneyText(line.balance), 540, y)
    y -= 22
  }
  const summaryY = y - 40
  at('Summary Of Statement', 50, summaryY)
  at('Opening Balance', 60, summaryY - 20)
  at('Total Debits', 200, summaryY - 20)
  at('Total Credits', 340, summaryY - 20)
  at('Closing Balance', 470, summaryY - 20)
  at(moneyText(stmt.opening), 60, summaryY - 38)
  at(moneyText(stmt.debits), 200, summaryY - 38)
  at(moneyText(stmt.credits), 340, summaryY - 38)
  at(moneyText(stmt.closing), 470, summaryY - 38)
  return Buffer.from(await doc.save())
}

/** The bank statement template the workbench accepts for CSV import (ISO dates: the CSV
 *  date parser only understands what `new Date()` does).
 *
 *  Money goes out as plain `1027696.24`, never as the rendered `1,027,696.24`: the backend
 *  splits the line on commas first (`parseCSVLine` in BankStatementUploadService.ts) and only
 *  then strips thousands separators, so an unquoted grouped amount becomes three fields and the
 *  parser reads an opening balance of `1`. Real bank CSVs quote those fields; the cheapest
 *  faithful fixture is one that does not need quoting. */
const csvMoney = (value) => Number(value).toFixed(2)
function buildStatementCsv({ accountNumber, currencyCode, opening, closing, rows }) {
  return [
    `Account Number,${accountNumber}`,
    `Account Currency,${currencyCode}`,
    `Opening Balance,${csvMoney(opening)}`,
    `Closing Balance,${csvMoney(closing)}`,
    '',
    'Transaction Date,Value Date,Reference,Description,Debit,Credit,Balance',
    ...rows.map((r) => `${r.date},${r.date},${r.reference},"${r.description}",${r.debit || ''},${r.credit || ''},${csvMoney(r.balance)}`),
  ].join('\n')
}

async function prepareFixture() {
  // 12 digits keeps the parser's `^\d{8,20}$` account-number rule happy.
  const accountNumber = `9${String(Date.now()).slice(-11)}`
  const currency = await prisma.currency.findFirst({
    where: { isActive: true, code: { in: ['USD', 'ZWL', 'ZWG', 'EUR', 'GBP', 'ZAR'] } },
    orderBy: { code: 'asc' },
    select: { id: true, code: true },
  })
  const bankTemplate = await prisma.bank.findFirst({ where: { isActive: true, glAccountId: { not: null }, currencyId: currency?.id }, select: { glAccountId: true } })
  if (!currency || !bankTemplate?.glAccountId) throw new Error('An active statement currency (USD/ZWL/ZWG/EUR/GBP/ZAR) and an active bank carrying a GL account are required for the disposable fixture.')
  const stmt = buildStatementModel(accountNumber, currency.code)
  const pdfBuffer = await buildStatementPdf(stmt)
  // Validate the fixture document with the same reader the API uses before letting the API
  // reject it: a 400 on upload is either a bad document or a truncated transfer, and this
  // fingerprint (byte count + hash + header/tail markers) is what tells them apart afterwards.
  const pdfSelfCheck = await pdfParse(pdfBuffer)
  mark('synthetic statement PDF is a valid one-page document', pdfSelfCheck.numpages === 1)
  evidence.pdfFixture = {
    bytes: pdfBuffer.length,
    sha256: createHash('sha256').update(pdfBuffer).digest('hex').slice(0, 16),
    header: pdfBuffer.subarray(0, 8).toString('latin1'),
    tail: pdfBuffer.subarray(-12).toString('latin1').trim(),
  }
  // Same arithmetic the API enforces on import: opening + money in - money out = closing.
  if (r2(stmt.opening + stmt.credits - stmt.debits) !== stmt.closing) throw new Error('The generated fixture statement does not add up.')
  const clashingBank = await prisma.bank.findUnique({ where: { accountNumber }, select: { id: true } })
  if (clashingBank) throw new Error('A bank already carries this generated account number; refusing to alter an existing fixture.')

  // The bank reconciliation route is guarded by its module action, matching the API's
  // bank_reconciliation permission. A flat legacy grant must be sufficient to open the route.
  const moduleView = { name: 'accounting.bank_reconciliation.view', value: true }
  const rolePermissions = [
    moduleView,
    { name: 'bank_reconciliation', value: true },
    { name: 'manage_ledger', value: true },
    { name: 'manage_accounting', value: true },
    { name: 'view_accounting', value: true },
  ]
  // Can open the module, cannot reconcile: the write control must disappear and the API must 403.
  const viewOnlyPermissions = [moduleView, { name: 'view_accounting', value: true }]
  // Can reconcile but not post to the ledger, so reopen is the control that must be refused.
  const deniedPermissions = [moduleView, { name: 'bank_reconciliation', value: true }, { name: 'view_accounting', value: true }]
  const roleData = async (label, code, permissions) => prisma.role.create({
    data: { name: `UAT ${label} ${run}`, code: `${code}_${run}`, level: 2, department: 'Finance', permissions },
  })
  const [role, blockedRole, noReopenRole, flatOnlyRole] = await Promise.all([
    roleData('Bank Reconciliation', `UAT_REC_${run}`, rolePermissions),
    roleData('Bank Reconciliation Denied', `UAT_REC_DENY_${run}`, viewOnlyPermissions),
    roleData('Bank Reconciliation No Reopen', `UAT_REC_NO_REOPEN_${run}`, deniedPermissions),
    roleData('Bank Reconciliation Flat Grant', `UAT_REC_FLAT_${run}`, [{ name: 'bank_reconciliation', value: true }, { name: 'view_accounting', value: true }]),
  ])
  const userData = async (userEmail, userPassword, userRole) => prisma.user.create({
    data: {
      firstName: 'Reconciliation', lastName: 'UAT', email: userEmail,
      password: await bcrypt.hash(userPassword, 10), roleId: userRole.id,
      roleCode: userRole === role ? 'CFO' : userRole === noReopenRole ? 'FIN_MGR' : 'FIN_MEM',
      userDepartment: 'Finance', status: 'ACTIVE', mustChangePassword: false,
    },
  })
  const [user, blockedUser, noReopenUser, flatOnlyUser] = await Promise.all([
    userData(email, password, role),
    userData(blockedEmail, blockedPassword, blockedRole),
    userData(reopenDeniedEmail, reopenDeniedPassword, noReopenRole),
    userData(flatOnlyEmail, flatOnlyPassword, flatOnlyRole),
  ])
  const bank = await prisma.bank.create({
    data: {
      name: `UAT Bank Reconciliation ${run}`,
      accountNumber,
      currencyId: currency.id,
      glAccountId: bankTemplate.glAccountId,
      isActive: true,
    },
  })
  // Posted unreconciled cashbook lines that mirror the statement, so auto-match has a real
  // book side to work against. Written directly to the fixture bank: no existing record of
  // another account is touched, and every row is deleted again in cleanupFixture().
  const entries = stmt.lines.map((line) => ({
    bankId: bank.id,
    transactionDate: new Date(line.transactionDate),
    type: line.creditAmount > 0 ? 'RECEIPT' : 'PAYMENT',
    amount: line.creditAmount || line.debitAmount,
    reference: line.reference,
    description: line.description,
    status: 'POSTED',
    counterpartyType: 'GL',
    glAccountId: bankTemplate.glAccountId,
    createdById: user.id,
  }))
  entries.push({
    bankId: bank.id,
    transactionDate: new Date('2026-10-19T12:00:00.000Z'),
    type: 'RECEIPT', amount: 2.22,
    reference: `UAT-OPEN-${run}`, description: 'UAT outstanding cashbook line',
    status: 'POSTED', counterpartyType: 'GL', glAccountId: bankTemplate.glAccountId, createdById: user.id,
  })
  await prisma.cashbookEntry.createMany({ data: entries })
  const expense = await prisma.chartOfAccounts.findFirst({ where: { isActive: true, accountType: 'Expense' }, select: { id: true } })
  if (!expense) throw new Error('No active expense GL account is available for the bank-only booking fixture.')
  fixture = { run, roleIds: [role.id, blockedRole.id, noReopenRole.id, flatOnlyRole.id], userIds: [user.id, blockedUser.id, noReopenUser.id, flatOnlyUser.id], bankId: bank.id, userId: user.id, expenseGlAccountId: expense.id, itemCount: stmt.lines.length, opening: stmt.opening, closing: stmt.closing, debits: stmt.debits, credits: stmt.credits, accountNumber, currencyCode: currency.code }
  process.env.ACCOUNTING_TEST_EMAIL = email
  process.env.ACCOUNTING_TEST_PASSWORD = password
  process.env.BANK_REC_DENIED_EMAIL = blockedEmail
  process.env.BANK_REC_DENIED_PASSWORD = blockedPassword
  process.env.BANK_REC_NO_REOPEN_EMAIL = reopenDeniedEmail
  process.env.BANK_REC_NO_REOPEN_PASSWORD = reopenDeniedPassword
  process.env.BANK_REC_FLAT_EMAIL = flatOnlyEmail
  process.env.BANK_REC_FLAT_PASSWORD = flatOnlyPassword
  return { pdfBuffer, stmt }
}

/**
 * Lock the BANK module over a statement date so `finish` must be refused, then release
 * it. Uses the fiscal period the running service resolves (module_period_locks) and
 * falls back to the legacy period_lockouts row when no fiscal period covers the date.
 */
async function applyBankPeriodLock(statementDate) {
  const d = new Date(statementDate)
  const fp = await prisma.fiscalPeriod.findFirst({
    where: { startDate: { lte: d }, endDate: { gte: d } },
    select: { id: true, name: true },
  })
  if (fp) {
    const existing = await prisma.modulePeriodLock.findUnique({
      where: { moduleCode_fiscalPeriodId: { moduleCode: 'BANK', fiscalPeriodId: fp.id } },
    })
    if (existing && existing.lockStatus !== 'OPEN') throw new Error('A real BANK lock already covers the statement date; refusing to alter it.')
    if (existing) {
      await prisma.modulePeriodLock.update({ where: { id: existing.id }, data: { lockStatus: 'LOCKED', reason: `UAT disposable ${run}` } })
      lockFixture.restoredLocks.push(existing.id)
    } else {
      const created = await prisma.modulePeriodLock.create({
        data: { moduleCode: 'BANK', fiscalPeriodId: fp.id, lockStatus: 'LOCKED', reason: `UAT disposable ${run}`, updatedById: fixture.userId },
      })
      lockFixture.createdLockIds.push(created.id)
    }
    return { mode: 'module', label: fp.name }
  }
  const year = d.getUTCFullYear(), month = d.getUTCMonth() + 1
  const existing = await prisma.periodLockout.findUnique({ where: { year_month: { year, month } } })
  if (existing?.isLocked) throw new Error('The legacy month is already locked locally; refusing to alter it.')
  const row = existing
    ? await prisma.periodLockout.update({ where: { id: existing.id }, data: { isLocked: true, reason: `UAT disposable ${run}`, lockedBy: fixture.userId, lockedAt: new Date() } })
    : await prisma.periodLockout.create({ data: { year, month, isLocked: true, reason: `UAT disposable ${run}`, lockedBy: fixture.userId, createdById: fixture.userId, lockedAt: new Date() } })
  lockFixture.legacyLockIds.push(row.id)
  return { mode: 'legacy', label: `${year}-${String(month).padStart(2, '0')}` }
}

async function releaseBankPeriodLock() {
  for (const id of lockFixture.createdLockIds) await prisma.modulePeriodLock.deleteMany({ where: { id } })
  for (const id of lockFixture.restoredLocks) await prisma.modulePeriodLock.update({ where: { id }, data: { lockStatus: 'OPEN', reason: null } })
  for (const id of lockFixture.legacyLockIds) await prisma.periodLockout.deleteMany({ where: { id } })
  lockFixture.createdLockIds = []; lockFixture.restoredLocks = []; lockFixture.legacyLockIds = []
}

async function cleanupFixture() {
  if (!fixture) return
  await releaseBankPeriodLock().catch(() => {})
  const sessionIds = (await prisma.cashbookReconciliationSession.findMany({ where: { bankId: fixture.bankId }, select: { id: true } })).map(x => x.id)
  const links = sessionIds.length ? await prisma.$queryRawUnsafe(`SELECT bank_statement_id FROM cashbook_reconciliation_statements WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`, ...sessionIds) : []
  for (const row of links) {
    await prisma.bankStatementItem.deleteMany({ where: { statementId: row.bank_statement_id } })
    await prisma.bankStatement.deleteMany({ where: { id: row.bank_statement_id } })
  }
  if (sessionIds.length) {
    await prisma.$executeRawUnsafe(`DELETE FROM cashbook_reconciliation_statements WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`, ...sessionIds)
    await prisma.cashbookReconciliationSessionLine.deleteMany({ where: { sessionId: { in: sessionIds } } })
    await prisma.cashbookReconciliationSession.deleteMany({ where: { id: { in: sessionIds } } })
  }
  await prisma.bankStatementItem.deleteMany({ where: { statement: { bankId: fixture.bankId } } })
  const cashbook = await prisma.cashbookEntry.findMany({ where: { bankId: fixture.bankId }, select: { id: true, journalEntryId: true } })
  const journalIds = cashbook.map(x => x.journalEntryId).filter(Boolean)
  await prisma.cashbookEntry.deleteMany({ where: { bankId: fixture.bankId } })
  if (journalIds.length) {
    await prisma.journalEntryLine.deleteMany({ where: { journalEntryId: { in: journalIds } } })
    await prisma.journalEntry.deleteMany({ where: { id: { in: journalIds } } })
  }
  await prisma.auditLog.deleteMany({ where: { userId: { in: fixture.userIds } } })
  // A refused finish writes period-lock audit rows and may queue a posting exception.
  await prisma.periodLockAuditLog.deleteMany({ where: { performedById: { in: fixture.userIds } } }).catch(() => {})
  await prisma.postingException.deleteMany({ where: { targetModule: 'BANK', sourceDocumentId: { in: [...sessionIds, fixture.bankId] } } }).catch(() => {})
  await prisma.bank.deleteMany({ where: { id: fixture.bankId } })
  await prisma.user.deleteMany({ where: { id: { in: fixture.userIds } } })
  await prisma.role.deleteMany({ where: { id: { in: fixture.roleIds } } })
  fixture = null
}

/**
 * Logs in through the real browser form and returns the storage state.
 *
 * Two hazards fixed here, both measured rather than assumed:
 * - The login route is server-rendered first and React attaches the submit handler later.
 *   A click inside that window does a native document POST to /login (the browser drops the
 *   `action="#"` fragment, reloads the form empty) and the app's own /auth/login call never
 *   happens - which is exactly how this audit failed three times in a row. Wait until React
 *   owns the form, then use placeholder locators: they stay bound to the controlled inputs,
 *   whereas generic `input[type=…]` + `type()` let react-hook-form clear the email when the
 *   password state change rerendered the form.
 * - The landing route is a `window.location.href` full page load chosen by role. Waiting
 *   for that URL meant the check depended on the /home compile (minutes in dev) and on a
 *   role redirect map that has nothing to do with reconciliation. The auth token is
 *   written to cookies by authSlice before the redirect, so the response is the real
 *   signal and the module route is navigated to directly afterwards.
 */
async function login(context, userEmail, userPassword) {
  const page = await context.newPage()
  page.setDefaultTimeout(90000)
  const pageErrors = []
  const authTraffic = []
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 250)))
  page.on('request', r => { if (r.url().includes('/auth/')) authTraffic.push(`${r.method()} ${r.url()} sent`) })
  page.on('requestfailed', r => { if (r.url().includes('/auth/')) authTraffic.push(`${r.method()} ${r.url()} FAILED ${r.failure()?.errorText}`) })
  // authSlice writes the JWT into the `token` cookie (lib/store/slices/authSlice.ts) and it is
  // that cookie, not the response object, which authenticates every later request made from
  // this context. Depending on one response's body shape alone made the run flaky: the app
  // can complete a login the assertion never recognises, and the retry then fails because
  // /login no longer renders a form for an already signed-in browser. Start from an empty jar
  // so a cookie found below can only have come from this attempt.
  await context.clearCookies()
  const tokenCookieName = process.env.ACCOUNTING_AUTH_COOKIE_KEY || 'token'
  const cookieToken = async () => (await context.cookies()).find(c => c.name === tokenCookieName)?.value || null
  let token = null
  for (let attempt = 1; attempt <= 3 && !token; attempt++) {
    await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 180000 })
    try {
      await page.getByPlaceholder('name@matanho.com').waitFor({ timeout: 90000 })
      await page.waitForFunction(() => {
        const form = document.querySelector('form')
        return !!form && Object.keys(form).some(key => key.startsWith('__reactProps$'))
      }, null, { timeout: 120000 })
    } catch (error) {
      // The form not appearing has several distinct causes on a dev server (route still
      // compiling, an error overlay replacing the page, a different document at /login), and
      // "waitFor timed out" names none of them. Record the structure, never the typed values.
      const formProbe = await page.evaluate(() => ({
        url: window.location.pathname + window.location.search,
        title: document.title.slice(0, 80),
        forms: document.querySelectorAll('form').length,
        placeholders: Array.from(document.querySelectorAll('input')).map(i => i.placeholder).slice(0, 6),
        hydrated: (() => { const f = document.querySelector('form'); return !!f && Object.keys(f).some(k => k.startsWith('__reactProps$')) })(),
        devErrorOverlay: Boolean(document.querySelector('nextjs__container_errors, [data-nextjs-dialog], .error-overlay')),
        bodyHead: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160),
      })).catch(() => null)
      evidence.errors.push({ at: 'login', attempt, stage: 'form-not-visible-or-unhydrated', message: String(error.message).split('\n')[0], probe: formProbe })
      continue
    }
    await page.getByPlaceholder('name@matanho.com').fill(userEmail)
    await page.getByPlaceholder('Enter your password').fill(userPassword)
    // Read the values back: if a rerender dropped either one, the click would post nothing.
    const filled = await page.evaluate(() => Array.from(document.querySelectorAll('form input')).filter(i => i.type === 'email' || i.type === 'password').map(i => i.value.length))
    if (!filled.every(len => len > 0)) throw new Error(`Login inputs were not both retained before submit (lengths ${JSON.stringify(filled)}).`)
    const loginResponse = page.waitForResponse(r => r.url().includes('/auth/login') && r.request().method() === 'POST', { timeout: 90000 })
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    let response
    try {
      response = await loginResponse
    } catch {
      // No response arrived. Say which of the two real causes it was: the browser never
      // submitted (values lost to the form rerender, or client validation refused) or the
      // request left and died at the network layer (wrong API port, CORS, connection refused).
      const formState = await page.evaluate(() => ({
        values: Array.from(document.querySelectorAll('form input')).map(i => `${i.type}=${i.value ? 'set' : 'EMPTY'}`),
        banner: Array.from(document.querySelectorAll('form div, form p')).map(d => d.textContent?.trim()).filter(t => t && t.length < 120).slice(0, 4),
      }))
      evidence.errors.push({ at: 'login', attempt, message: `No /auth/login response. traffic=${JSON.stringify(authTraffic.slice(-4))} form=${JSON.stringify(formState)}` })
      continue
    }
    const body = await response.json().catch(() => null)
    if (!response.ok()) {
      // A refused login is a real answer: report it and retry immediately.
      evidence.errors.push({ at: 'login', attempt, status: response.status(), message: String(body?.message || body?.error || '').slice(0, 200) })
      continue
    }
    // The app has now handled a 2xx login; give its cookie write a moment and read the token
    // from the jar. If nothing appears, record what actually came back (keys and content type,
    // never the body itself, which would carry a live JWT into the artifacts).
    for (let tick = 0; tick < 20; tick++) {
      token = await cookieToken()
      if (token) break
      await page.waitForTimeout(500)
    }
    token = token || body?.data?.token || body?.token || null
    if (!token) {
      evidence.errors.push({
        at: 'login', attempt, status: response.status(),
        url: response.url(), contentType: response.headers()['content-type'] || '',
        bodyKeys: body && typeof body === 'object' ? Object.keys(body) : typeof body,
        message: String(body?.message || body?.error || '').slice(0, 200),
      })
    }
  }
  await page.close()
  if (!token) throw new Error(`Browser login for ${userEmail} never returned a token in three attempts. Page errors: ${pageErrors.join(' | ') || 'none'}`)
  mark('browser login issued a token')
  return await context.storageState()
}

async function routeToBank(page, pathname) {
  // A dev-mode Next server compiles an App Router route on its first request, which took
  // well over a minute for these routes on this machine; a 30-45s wait therefore proved
  // nothing except that the compile was slow. Route entry gets compile-sized budgets, and
  // the interaction waits further down keep their tight values because the page is already
  // built by then - a real regression there still fails fast.
  page.setDefaultTimeout(120000)
  await page.goto(`${base}${pathname}`, { waitUntil: 'domcontentloaded', timeout: 300000 })
  const mount = pathname.includes('-legacy') ? page.locator('[data-bank-reconciliation-module]') : page.locator('#ac52LegacyReconciliationSlot [data-bank-reconciliation-module]')
  try {
    await mount.waitFor({ state: 'visible', timeout: 240000 })
  } catch (error) {
    // "The module did not render" has at least four different causes on this app - a
    // ModuleGuard denial, an auth redirect, a guard spinner that never settles, and a
    // dev-mode runtime error - so record which one it was instead of a bare timeout. Only
    // structural signals are captured: no screenshot and no free text from a bank list.
    evidence.routeFailure = await page.evaluate((slot) => ({
      url: window.location.pathname,
      accessDenied: /Access denied|do not have permission/i.test(document.body.innerText),
      guardSpinner: Boolean(document.querySelector('.animate-spin')),
      devErrorOverlay: Boolean(document.querySelector('nextjs__container_errors, [data-nextjs-dialog], .error-overlay')),
      devErrorText: (document.querySelector('nextjs__container_errors_label, [data-nextjs-dialog] h2')?.innerText || '').slice(0, 300),
      headings: Array.from(document.querySelectorAll('h1,h2')).map(h => h.textContent?.trim().slice(0, 60)).slice(0, 6),
      slotPresent: Boolean(document.querySelector(slot)),
      modulePresent: Boolean(document.querySelector('[data-bank-reconciliation-module]')),
    }), pathname.includes('-legacy') ? '[data-bank-reconciliation-module]' : '#ac52LegacyReconciliationSlot')
    throw error
  }
  await mount.getByRole('heading', { name: 'Bank Reconciliation' }).waitFor({ timeout: 120000 })
  const combobox = mount.getByRole('combobox').first()
  await combobox.click()
  await page.getByRole('option', { name: new RegExp(`UAT Bank Reconciliation ${run}`) }).click()
  // Either the list has rows or it says it is empty: wait for whichever of the two arrives so a
  // resumed draft does not cost a full empty-state timeout on every mount.
  await Promise.race([
    mount.locator('tbody tr').first().waitFor({ timeout: 60000 }),
    mount.getByText('No reconciliation sessions found for this bank.', { exact: true }).waitFor({ timeout: 60000 }),
  ]).catch(() => {})
  await page.waitForTimeout(7000)
  return mount
}

/** Hand a statement file to the workbench's upload input and ledger what was actually sent.
 *  Playwright cannot expose a multipart body (`postDataBuffer()` is null for file uploads) and
 *  reports no Content-Length for them either, so the only trustworthy per-upload fingerprint is
 *  the one taken here, from the bytes this script built. The API's answer is attached to it in
 *  the response listener above. */
async function uploadStatement(mount, { name, mimeType, buffer }) {
  const record = { file: name, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex').slice(0, 16) }
  evidence.uploads.push(record)
  await mount.getByLabel('Choose bank statement').setInputFiles({ name, mimeType, buffer })
  return record
}

/**
 * Arm the next native confirm/prompt, record that it really fired, and accept it. Playwright
 * auto-dismisses a dialog that has no listener, so an un-armed confirm silently cancels the
 * action it was guarding; recording the message also proves which dialog the click raised.
 */
function armDialog(page, promptText) {
  page.once('dialog', (dialog) => {
    evidence.dialogs.push({ type: dialog.type(), text: String(dialog.message()).slice(0, 80) })
    dialog.accept(promptText).catch(() => {})
  })
}

/**
 * Click Finish Reconciliation and report what the API answered.
 *
 * Two runs of this audit reported a successful-looking finish that had never been sent, because
 * the wait was for the text `Reconciliation finalized` and that toast was still mounted from the
 * previous finalize. The reliable signals are the POST /finish answer and the session row, so
 * both are taken here; the toast count is kept as a separate observation, never as proof.
 */
async function finishSession(page, mount, label) {
  const before = evidence.finishes.length
  const dialogsBefore = evidence.dialogs.length
  armDialog(page)
  await mount.getByRole('button', { name: 'Finish Reconciliation' }).click()
  const deadline = Date.now() + 45000
  while (Date.now() < deadline && evidence.finishes.length === before) await new Promise((done) => setTimeout(done, 200))
  const record = {
    label,
    asked: evidence.finishes.length > before,
    status: evidence.finishes[before]?.status ?? null,
    message: evidence.finishes[before]?.message ?? null,
    toastCount: await page.getByText('Reconciliation finalized', { exact: true }).count().catch(() => -1),
    dialogs: evidence.dialogs.slice(dialogsBefore),
  }
  if (!record.asked) {
    // No request left the browser: say what the screen actually offered instead of failing blind.
    const state = await uiState(mount, page)
    record.alert = state.alert
    record.toasts = state.toasts
    record.buttons = await mount.locator('button').evaluateAll((list) => list.map((b) => b.textContent?.trim()).filter(Boolean).slice(0, 20)).catch(() => [])
    record.api = evidence.apiErrors.slice(-3)
  }
  evidence.finishAttempts.push(record)
  return record
}

async function exportFile(page, mount, groupName, kind) {
  const group = mount.getByRole('group', { name: `Export ${groupName}` })
  const downloadWaiter = page.waitForEvent('download')
  await group.getByRole('button', { name: `Export as ${kind}` }).click()
  const download = await downloadWaiter
  const path = await download.path()
  const bytes = await readFile(path)
  if (kind === 'PDF') {
    if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error(`${groupName} PDF is invalid.`)
    const doc = await pdfParse(bytes)
    if (!doc.numpages) throw new Error(`${groupName} PDF has no pages.`)
    // The brand line is drawn into the page and the same name is set as creator/author,
    // so a document that silently fell back to the wrong organisation fails here.
    if (!doc.text.includes(expectedBrand.name)) throw new Error(`${groupName} PDF is missing the ${expectedBrand.name} brand.`)
    const creator = String(doc.info?.Creator || doc.info?.Author || '')
    if (creator && !creator.includes(expectedBrand.name)) throw new Error(`${groupName} PDF metadata names ${creator}, not ${expectedBrand.name}.`)
  } else if (kind === 'Excel') {
    const book = XLSX.read(bytes, { type: 'buffer' })
    if (!book.SheetNames.length || !XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 }).length) throw new Error(`${groupName} XLSX content is missing.`)
  } else if (!bytes.toString('utf8').split(/\r?\n/)[0].includes('Date') && !bytes.toString('utf8').split(/\r?\n/)[0].includes('Statement')) {
    throw new Error(`${groupName} CSV headers are missing.`)
  }
  // Statement rows carry the client's transaction descriptions; never keep exported copies.
  await rm(path, { force: true }).catch(() => {})
  evidence.exports.push(`${groupName}:${kind}`)
}

const styleProbe = (root) => {
  const parts = ['h1', 'p', 'table thead th', 'button[role=combobox]']
  return Object.fromEntries(parts.map((selector) => {
    const el = root.querySelector(selector); if (!el) return [selector, null]
    const cs = getComputedStyle(el), r = el.getBoundingClientRect()
    return [selector, { x:r.x,y:r.y,width:r.width,height:r.height,fontSize:cs.fontSize,lineHeight:cs.lineHeight,letterSpacing:cs.letterSpacing,fontWeight:cs.fontWeight,textTransform:cs.textTransform }]
  }))
}

/**
 * What the module is showing right now: its inline error panel plus any transient toasts. The
 * workbench reports a failed action only through a toast that disappears after a few seconds, so
 * an interaction timeout needs this snapshot to say why rather than just `waitFor` expiring.
 * The fixture data is synthetic, so the captured text is safe to keep in the artifact.
 */
const uiState = async (mount, page) => ({
  alert: await mount.locator('[role="alert"]').first().innerText().catch(() => null),
  toasts: await page.evaluate(() => Array.from(document.querySelectorAll('[data-sonner-toast], [role="status"]')).map(t => (t.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 140)).filter(Boolean).slice(0, 5)).catch(() => []),
})

async function apiToken(userEmail, userPassword) {
  const response = await fetch(`${apiBase}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: userPassword, portal: 'staff' }) })
  const body = await response.json().catch(() => null)
  const token = body?.data?.token || body?.token
  if (!token) throw new Error(`Fixture login for ${userEmail} returned no token.`)
  return token
}

async function runBrowser(pdfBuffer, stmt) {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true })
  const state = await login(context, process.env.ACCOUNTING_TEST_EMAIL, process.env.ACCOUNTING_TEST_PASSWORD)
  await context.close()

  const flatLoginContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const flatState = await login(flatLoginContext, process.env.BANK_REC_FLAT_EMAIL, process.env.BANK_REC_FLAT_PASSWORD)
  await flatLoginContext.close()

  const legacyContext = await browser.newContext({ viewport: { width: 1600, height: 1000 }, storageState: flatState, acceptDownloads: true })
  const legacyPage = await legacyContext.newPage()
  const legacyMount = await routeToBank(legacyPage, '/accounting-legacy/bank-reconciliation')
  mark('legacy route admits finance user with flat bank reconciliation grant')
  const legacyBox = await legacyMount.boundingBox()
  // An ElementHandle must be handed to page.evaluate; a locator's evaluate(el => el)
  // serialises to undefined and the probe then throws on root.querySelector.
  const legacyHandle = await legacyMount.elementHandle()
  const legacyMetrics = await legacyPage.evaluate(styleProbe, legacyHandle)
  const legacyShot = await legacyMount.screenshot()
  // The brand asset check still needs the legacy page; closing the context first would
  // throw "Target page, context or browser has been closed".
  const logoResponse = await legacyPage.request.get(`${base}${expectedBrand.logo}`)
  mark(`brand logo asset served (${expectedBrand.logo})`, logoResponse.status() === 200 && (logoResponse.headers()['content-type'] || '').startsWith('image'))
  evidence.brandAsset = { path: expectedBrand.logo, status: logoResponse.status(), bytes: Number(logoResponse.headers()['content-length'] || (await logoResponse.body()).length) }
  await legacyContext.close()

  const restoredContext = await browser.newContext({ viewport: { width: 1600, height: 1000 }, storageState: state, acceptDownloads: true })
  const page = await restoredContext.newPage()
  // Every API call this page makes, counted, plus any that overlapped the same endpoint (a
  // request race is what the Redux stale-response guard is meant to absorb). Session and
  // statement ids are collapsed to `:id` so the artifact holds shapes, not row identifiers.
  const normalisePath = (u) => new URL(u).pathname.replace(/\/[0-9a-z]{15,}/gi, '/:id')
  const inFlight = new Map()
  page.on('request', (request) => {
    if (!request.url().includes('/api/')) return
    const key = `${request.method()} ${normalisePath(request.url())}`
    inFlight.set(key, (inFlight.get(key) || 0) + 1)
    if (inFlight.get(key) > 1) evidence.races.push(key)
  })
  // Keep a rolling record of every API call that answered an error. UI waits fail for reasons
  // the DOM does not always show; the failing request and its message do.
  page.on('response', async (response) => {
    if (!response.url().includes('/api/')) return
    const key = `${response.request().method()} ${normalisePath(response.url())}`
    inFlight.set(key, Math.max(0, (inFlight.get(key) || 1) - 1))
    evidence.requests[key] = (evidence.requests[key] || 0) + 1
    if (key.startsWith('POST ') && key.endsWith('/statement')) {
      const record = evidence.uploads[evidence.uploads.length - 1]
      if (record) {
        const body = await response.json().catch(() => null)
        // One upload can answer twice: the `?preview=1` read and then the import POST. Keep both
        // answers against the file that caused them instead of only the first.
        const answer = { status: response.status(), message: String(body?.message || body?.error || '').slice(0, 160) }
        ;(record.answers = record.answers || []).push(answer)
        record.status = answer.status
        record.message = answer.message
      }
    }
    if (key.startsWith('POST ') && key.endsWith('/finish')) {
      // Finish is asserted from this answer below. The success toast alone cannot prove a
      // finish happened, because a previous finalize's toast can still be on screen.
      const body = await response.json().catch(() => null)
      evidence.finishes.push({ status: response.status(), message: String(body?.message || body?.error || '').slice(0, 200) })
    }
    if (response.status() < 400) return
    const message = await response.json().then(body => String(body?.message || body?.error || '')).catch(() => '')
    evidence.apiErrors.push(`${response.status()} ${key}${message ? ` - ${message.slice(0, 160)}` : ''}`)
    evidence.apiErrors = evidence.apiErrors.slice(-12)
  })
  const restoredMount = await routeToBank(page, '/accounting/bank-reconciliation')
  mark('restored route uses same React component', await restoredMount.getAttribute('data-bank-reconciliation-module') !== null)
  const host = await page.locator('[data-ac52-legacy-host="ac52LegacyReconciliationSlot"]').elementHandle()
  const hostCount = await page.locator('[data-ac52-legacy-host="ac52LegacyReconciliationSlot"]').count()
  await page.waitForTimeout(6500)
  mark('one stable portal host', hostCount === 1 && await host.evaluate(el => el.isConnected))
  mark('one module mount', await page.locator('#ac52LegacyReconciliationSlot [data-bank-reconciliation-module]').count() === 1)
  const restoredBox = await restoredMount.boundingBox()
  const naturalRestoredWidth = restoredBox?.width || 0
  await page.addStyleTag({ content: `#ac52LegacyReconciliationSlot [data-bank-reconciliation-module]{width:${legacyBox.width}px!important;max-width:none!important;margin-left:0!important;margin-right:0!important}` })
  const restoredHandle = await restoredMount.elementHandle()
  const restoredMetrics = await page.evaluate(styleProbe, restoredHandle)
  const restoredShot = await restoredMount.screenshot()
  await mkdir(artifactDir, { recursive: true })
  await writeFile(join(artifactDir, 'legacy-session-list.png'), legacyShot)
  await writeFile(join(artifactDir, 'restored-session-list-pinned.png'), restoredShot)
  mark('DOM metrics captured', Boolean(legacyMetrics.h1 && restoredMetrics.h1))
  // The restored route is width-pinned to the legacy measurement above, so the natural
  // (unpinned) width has to be recorded separately or the comparison proves nothing.
  evidence.metrics = { legacyNaturalWidth: legacyBox?.width, restoredNaturalWidth: naturalRestoredWidth, legacy: legacyMetrics, restoredPinned: restoredMetrics }

  const shellLeaks = await page.evaluate(() => {
    const root = document.querySelector('#ac52LegacyReconciliationSlot [data-bank-reconciliation-module]')
    const probes = ['h1','p','button','table','thead','th','td','input','select','label','span','strong','small','a','li']
    const leaks = []
    for (const sheet of Array.from(document.styleSheets)) {
      let rules; try { rules = sheet.cssRules } catch { continue }
      for (const rule of Array.from(rules)) {
        if (!rule.selectorText) continue
        for (const part of probes) {
          try { if (root.querySelector(part) && root.querySelector(part).matches(rule.selectorText)) { leaks.push(rule.selectorText); break } } catch {}
        }
      }
    }
    return [...new Set(leaks)]
  })
  evidence.cssomLeaks = shellLeaks.length
  // The selectors themselves are what a reviewer needs in order to scope them; the count alone
  // cannot be acted on. These are stylesheet text, never bank data.
  evidence.cssomLeakSelectors = shellLeaks.slice(0, 12)

  // ---- Session 1 (generated PDF): create, preview, import, duplicate refusal, match.
  const reference = `REC-UAT-${run}`
  const openingText = moneyText(stmt.opening)
  const closingText = moneyText(stmt.closing)
  await restoredMount.getByRole('button', { name: 'New Reconciliation' }).click()
  await restoredMount.getByLabel(/Statement Date/).fill(stmt.statementDate)
  await restoredMount.getByLabel(/Opening Balance/).fill(String(stmt.opening))
  await restoredMount.getByLabel(/Statement End Balance/).fill(String(stmt.closing))
  // The reference is what the draft row is found by after a reload; without it the
  // session is unlocatable in the list and the resume step cannot run.
  await restoredMount.getByLabel(/^Reference/).fill(reference)
  await restoredMount.getByRole('button', { name: 'Start Reconciliation' }).click()
  await restoredMount.getByRole('button', { name: 'Auto-match' }).waitFor({ timeout: 30000 })
  const created = await prisma.cashbookReconciliationSession.findFirst({ where: { bankId: fixture.bankId, reference }, select: { id: true, status: true } })
  if (!created) throw new Error('Start Reconciliation did not persist a draft session.')
  const sessionId = created.id
  mark('draft session persisted through the API', created.status === 'DRAFT')

  await uploadStatement(restoredMount, { name: 'uat-statement.pdf', mimeType: 'application/pdf', buffer: pdfBuffer })
  await restoredMount.getByText(/Import preview · 8 rows/).waitFor({ timeout: 45000 }).catch(async (error) => {
    const state = await uiState(restoredMount, page)
    throw new Error(`The statement PDF never previewed (${String(error.message).split('\n')[0]}). fixture=${JSON.stringify(evidence.pdfFixture)} sent=${JSON.stringify(evidence.uploads.slice(-2))} alert=${JSON.stringify(state.alert)} toasts=${JSON.stringify(state.toasts)} api=${JSON.stringify(evidence.apiErrors.slice(-3))}`)
  })
  mark('PDF statement parses and previews eight lines')
  mark('PDF preview totals correct', await restoredMount.getByText(new RegExp(`Opening ${re(openingText)} · Debits ${re(moneyText(stmt.debits))} · Credits ${re(moneyText(stmt.credits))} · Closing ${re(closingText)}`)).count() === 1)
  // The preview table is exportable before anything is written; these rows are synthetic.
  await exportFile(page, restoredMount, 'Statement preview', 'PDF')
  await exportFile(page, restoredMount, 'Statement preview', 'Excel')
  await exportFile(page, restoredMount, 'Statement preview', 'CSV')
  await restoredMount.getByRole('button', { name: 'Import statement' }).click()
  await restoredMount.getByText(/Statement imported · 8 lines/).waitFor({ timeout: 30000 }).catch(async (error) => {
    const state = await uiState(restoredMount, page)
    throw new Error(`Statement import did not render its summary line (${String(error.message).split('\n')[0]}). alert=${JSON.stringify(state.alert)} toasts=${JSON.stringify(state.toasts)} api=${JSON.stringify(evidence.apiErrors.slice(-3))}`)
  })
  mark('statement import persisted', (await prisma.bankStatementItem.count({ where: { statement: { bankId: fixture.bankId } } })) === 8)

  // Importing the same statement twice must be refused, not duplicated.
  await uploadStatement(restoredMount, { name: 'uat-statement-duplicate.pdf', mimeType: 'application/pdf', buffer: pdfBuffer })
  await restoredMount.getByRole('button', { name: 'Import statement' }).click()
  await page.getByText(/already imported/i).waitFor({ timeout: 30000 })
  mark('duplicate statement import is refused', (await prisma.bankStatementItem.count({ where: { statement: { bankId: fixture.bankId } } })) === 8)
  await restoredMount.getByRole('button', { name: 'Auto-match' }).click()
  await restoredMount.getByText(/8 matched/).waitFor({ timeout: 30000 })
  mark('PDF lines auto-match to posted cashbook entries')

  // Manual unmatch / match and tick / untick persist through the workbench APIs.
  const statementTable = restoredMount.locator('section').filter({ hasText: /^Bank statement ·/ }).first()
  await statementTable.getByRole('button', { name: 'Unmatch', exact: true }).first().click()
  await restoredMount.getByText(/7 matched/).waitFor({ timeout: 20000 })
  await statementTable.getByRole('button', { name: 'Match', exact: true }).first().click()
  const matchDialog = restoredMount.getByRole('dialog', { name: 'Match statement line' })
  await matchDialog.waitFor({ state: 'visible', timeout: 15000 })
  await matchDialog.getByRole('button').first().click()
  mark('match dialog closes without choosing', await matchDialog.isHidden())
  await statementTable.getByRole('button', { name: 'Match', exact: true }).first().click()
  await matchDialog.waitFor({ state: 'visible', timeout: 15000 })
  // The close button and the candidate list are both buttons; pick a candidate by the
  // fixture reference rather than a positional index that changes with the data.
  await matchDialog.getByRole('button').filter({ hasText: 'UAT-' }).first().click()
  await restoredMount.getByText(/8 matched/).waitFor({ timeout: 20000 })
  mark('manual match and unmatch')
  const extraClear = restoredMount.getByRole('checkbox', { name: new RegExp(`Clear UAT-OPEN-${run}`) })
  const clearedNow = async () => {
    const line = await restoredMount.getByText(/Cleared /).first().innerText()
    const found = line.match(/Cleared\s+([\d,]+\.\d{2})/)
    if (!found) throw new Error(`The workbench summary has no cleared balance: ${line.slice(0, 140)}`)
    return Number(found[1].replace(/,/g, ''))
  }
  // The tick box is a controlled input whose `checked` value only comes back with the next
  // workbench fetch, so Playwright's `check()` fails its own post-click state assertion
  // ("Clicking the checkbox did not change its state") before the round trip lands. Click, then
  // wait for the recomputed balance. The expected figure is measured from the summary rather
  // than assumed, because which cashbook entry the manual re-match picked depends on the
  // candidate order - what is under test here is that a tick moves the cleared balance by
  // exactly that entry's amount and the state persists through the API.
  const baselineCleared = await clearedNow()
  mark('cleared balance equals the statement closing once everything is matched', baselineCleared === r2(stmt.closing))
  evidence.clearedBaseline = baselineCleared
  try {
    await extraClear.click()
    await restoredMount.getByText(new RegExp(`Cleared ${re(moneyText(r2(baselineCleared + 2.22)))}`)).waitFor({ timeout: 20000 })
    mark('cashbook tick persists through the workbench API', await extraClear.isChecked())
    await extraClear.click()
    await restoredMount.getByText(new RegExp(`Cleared ${re(moneyText(baselineCleared))}`)).waitFor({ timeout: 20000 })
    mark('cashbook untick persists through the workbench API', !(await extraClear.isChecked()))
  } catch (error) {
    // The summary line is derived from the fixture bank's synthetic amounts only, so recording
    // it turns a balance-model mismatch into a named difference instead of a bare timeout.
    evidence.summaryLine = await restoredMount.getByText(/Cleared /).first().innerText().catch(() => null)
    throw new Error(`${String(error.message).split('\n')[0]} (cleared-balance step; summary was ${JSON.stringify(evidence.summaryLine)}, baseline ${baselineCleared})`)
  }
  await restoredMount.getByRole('button', { name: 'Save Draft' }).click()
  await page.getByText('Draft saved', { exact: true }).waitFor({ timeout: 20000 })
  await restoredMount.getByRole('button', { name: 'Back to Sessions' }).click()
  // Re-navigate the route so the list is refetched from the server, then resume the draft.
  const resumedMount = await routeToBank(page, '/accounting/bank-reconciliation')
  // Data rows are addressed off the DOM, not off the accessibility tree. ProcurementDataTable
  // renders every clickable body row with role="button" (it sets the role explicitly when an
  // `onView` handler is passed, which the session list always does), so getByRole('row') only
  // ever sees the header <tr> - which is exactly how a populated list looked like zero rows.
  const draftRow = resumedMount.locator('tbody tr').filter({ hasText: reference }).first()
  await draftRow.waitFor({ timeout: 30000 }).catch(async (error) => {
    // This list is built entirely from the fixture bank, so its row text is safe to keep. It is
    // the difference between "the saved draft is missing from the list" and "the reference
    // column is not what this locator expects", and a skeleton still on screen says the list
    // never finished loading rather than that it came back empty.
    const rows = await resumedMount.locator('tbody tr').allInnerTexts().catch(() => [])
    const roleRows = await resumedMount.getByRole('row').count().catch(() => -1)
    const domRows = await resumedMount.locator('tbody tr').count().catch(() => -1)
    const skeletons = await resumedMount.locator('.animate-pulse, [data-slot="skeleton"]').count().catch(() => -1)
    const state = await uiState(resumedMount, page)
    evidence.rowAddressability = { roleRows, domRows }
    throw new Error(`Draft ${reference} never appeared in the session list (${String(error.message).split('\n')[0]}). rows=${JSON.stringify(rows.slice(0, 6))} roleRows=${roleRows} domRows=${domRows} skeletons=${skeletons} alert=${JSON.stringify(state.alert)} emptyText=${await resumedMount.getByText(/No reconciliation sessions/).count().catch(() => -1)} api=${JSON.stringify(evidence.apiErrors.slice(-3))} traffic=${JSON.stringify(evidence.requests)}`)
  })
  await draftRow.click()
  await resumedMount.getByRole('button', { name: 'Finish Reconciliation' }).waitFor({ state: 'visible', timeout: 30000 }).catch(async (error) => {
    const buttons = await resumedMount.locator('button').evaluateAll(list => list.map(b => b.textContent?.trim()).filter(Boolean).slice(0, 20)).catch(() => [])
    const state = await uiState(resumedMount, page)
    throw new Error(`The resumed draft showed no Finish control (${String(error.message).split('\n')[0]}). buttons=${JSON.stringify(buttons)} alert=${JSON.stringify(state.alert)} api=${JSON.stringify(evidence.apiErrors.slice(-3))}`)
  })
  const templateLink = resumedMount.getByRole('link', { name: 'Download CSV template' })
  const templateHref = await templateLink.getAttribute('href')
  const templateResponse = await page.request.get(`${base}${templateHref}`)
  const templateText = await templateResponse.text()
  evidence.statementTemplate = { status: templateResponse.status(), href: templateHref, hasRequiredColumns: templateText.includes('Transaction Date,Value Date,Reference,Description,Debit,Credit,Balance') }
  mark('bank statement CSV template is available from the draft workspace', templateHref === '/templates/bank-reconciliation-statement-template.csv' && templateResponse.status() === 200 && evidence.statementTemplate.hasRequiredColumns)
  mark('draft resumes after reload', (await prisma.cashbookReconciliationSession.findUnique({ where: { id: sessionId }, select: { status: true } })).status === 'DRAFT')

  // A locked BANK period must refuse the finish, and refuse it without side effects.
  const lock = await applyBankPeriodLock(`${stmt.statementDate}T12:00:00.000Z`)
  const lockedFinish = await finishSession(page, resumedMount, 'locked period')
  const lockTextShown = await page.getByText(/is locked/i).waitFor({ timeout: 30000 }).then(() => true).catch(() => false)
  const afterLockedFinish = await prisma.cashbookReconciliationSession.findUnique({ where: { id: sessionId }, select: { status: true } })
  evidence.lockedFinish = { httpStatus: lockedFinish.status, message: lockedFinish.message, uiLockText: lockTextShown, dbStatus: afterLockedFinish?.status || null }
  mark(`finish blocked by ${lock.mode} BANK period lock (${lock.label})`, afterLockedFinish?.status === 'DRAFT' && lockedFinish.asked && lockedFinish.status >= 400 && lockTextShown)
  await releaseBankPeriodLock()

  const firstFinish = await finishSession(page, resumedMount, 'first finalize')
  const finalized = await prisma.cashbookReconciliationSession.findUnique({ where: { id: sessionId }, select: { status: true } })
  mark('finish persists finalized state', finalized?.status === 'FINALIZED' && firstFinish.status === 200)
  mark('finish requires every statement line matched', (await prisma.bankStatementItem.count({ where: { statement: { bankId: fixture.bankId }, isMatched: false } })) === 0)
  mark('finish reconciles exactly the cleared cashbook entries', (await prisma.cashbookEntry.count({ where: { bankId: fixture.bankId, isReconciled: true } })) === stmt.lines.length)

  // Reopen is denied to a reconciliation operator without ledger management.
  const noReopenToken = await apiToken(process.env.BANK_REC_NO_REOPEN_EMAIL, process.env.BANK_REC_NO_REOPEN_PASSWORD)
  const deniedReopen = await page.request.post(`${apiBase}/cashbook/reconciliation/sessions/${sessionId}/reopen`, { headers: { Authorization: `Bearer ${noReopenToken}` }, data: { reason: 'UAT denial check' } })
  mark('reopen blocked without manage_ledger', deniedReopen.status() === 403)

  // Arm the response before the click. The reason prompt is answered by the dialog handler, so
  // the reopen's HTTP answer is the only thing that separates a refused reopen from a workbench
  // that accepted it and then failed to refresh back into draft editing.
  armDialog(page, 'UAT authorized reopen check')
  const reopenWait = page.waitForResponse(r => r.url().includes('/reopen') && r.request().method() === 'POST', { timeout: 30000 })
  await resumedMount.getByRole('button', { name: 'Reopen' }).click()
  const reopened = await reopenWait
  const reopenedBody = await reopened.json().catch(() => null)
  evidence.reopen = { status: reopened.status(), message: String(reopenedBody?.message || reopenedBody?.error || '').slice(0, 160) }
  mark(`authorized reopen answered ${reopened.status()}`, reopened.ok())
  await resumedMount.getByRole('button', { name: 'Save Draft' }).waitFor({ timeout: 30000 }).catch(async (error) => {
    const state = await uiState(resumedMount, page)
    throw new Error(`The reopened session never returned to draft editing (${String(error.message).split('\n')[0]}). reopen=${JSON.stringify(evidence.reopen)} alert=${JSON.stringify(state.alert)} toasts=${JSON.stringify(state.toasts)} api=${JSON.stringify(evidence.apiErrors.slice(-3))}`)
  })
  mark('authorized reopen works', (await prisma.cashbookReconciliationSession.findUnique({ where: { id: sessionId }, select: { status: true } })).status === 'DRAFT')

  // The reopened draft is the natural place for the workbench row exports: those two
  // tables are what a reconciler signs off. Files are validated in memory and deleted.
  await exportFile(page, resumedMount, 'Bank statement', 'PDF')
  await exportFile(page, resumedMount, 'Bank statement', 'Excel')
  await exportFile(page, resumedMount, 'Bank statement', 'CSV')
  await exportFile(page, resumedMount, 'Cashbook', 'PDF')
  await exportFile(page, resumedMount, 'Cashbook', 'Excel')
  await exportFile(page, resumedMount, 'Cashbook', 'CSV')
  mark('workbench rows export in three formats')

  // A reopened reconciliation has to be finished again before the next statement can
  // start: the API keeps one open reconciliation per bank account.
  const reopenedFinish = await finishSession(page, resumedMount, 'reopened finalize')
  const refinalized = (await prisma.cashbookReconciliationSession.findUnique({ where: { id: sessionId }, select: { status: true } })).status
  mark('reopened session finishes again', refinalized === 'FINALIZED' && reopenedFinish.status === 200)

  // ---- Session 2 (CSV): row validation, prior-closing continuity, bank-only booking.
  const csvReference = `${reference}-CSV`
  const csvOpening = stmt.closing
  const csvClosing = r2(stmt.closing - 1)
  await resumedMount.getByRole('button', { name: 'Back to Sessions' }).click()
  await resumedMount.getByRole('button', { name: 'New Reconciliation' }).click()
  await resumedMount.getByLabel(/Statement Date/).fill('2026-10-21')
  await resumedMount.getByLabel(/Opening Balance/).fill(String(csvOpening))
  await resumedMount.getByLabel(/Statement End Balance/).fill(String(csvClosing))
  await resumedMount.getByLabel(/^Reference/).fill(csvReference)
  await resumedMount.getByRole('button', { name: 'Start Reconciliation' }).click()
  await resumedMount.getByRole('button', { name: 'Auto-match' }).waitFor({ timeout: 30000 })
  const csvSession = await prisma.cashbookReconciliationSession.findFirst({ where: { bankId: fixture.bankId, reference: csvReference }, select: { id: true } })
  if (!csvSession) throw new Error('The CSV session draft was not created.')

  // Fingerprint the generated CSV the same way the PDF was fingerprinted, so a refusal that
  // quotes an opening balance of `1.00` is immediately recognisable as a broken fixture rather
  // than a broken validation rule.
  const csvProbe = buildStatementCsv({ accountNumber: fixture.accountNumber, currencyCode: fixture.currencyCode, opening: csvOpening, closing: csvClosing, rows: [{ date: '2026-10-21', reference: `UAT-SHAPE-${run}`, description: 'shape probe', debit: 1, balance: csvClosing }] }).split('\n')
  const probeFields = (label) => csvProbe.find((l) => l.startsWith(label))?.split(',') || []
  evidence.csvFixture = { bytes: Buffer.byteLength(csvProbe.join('\n')), openingField: probeFields('Opening Balance'), closingField: probeFields('Closing Balance') }
  mark('synthetic statement CSV carries machine-readable money fields',
    Number(evidence.csvFixture.openingField?.[1]) === r2(csvOpening) && evidence.csvFixture.openingField.length === 2
    && Number(evidence.csvFixture.closingField?.[1]) === r2(csvClosing) && evidence.csvFixture.closingField.length === 2)

  // Bad rows are refused on the preview, before anything is written to the database.
  const badRows = [
    { name: 'uat-both-sides.csv', rows: [{ date: '2026-10-21', reference: `UAT-BOTH-${run}`, description: 'UAT invalid line', debit: 1, credit: 1, balance: csvClosing }], expect: /a debit or a credit, not both/i },
    { name: 'uat-late-line.csv', rows: [{ date: '2026-11-05', reference: `UAT-LATE-${run}`, description: 'UAT line after the statement date', debit: 1, balance: csvClosing }], expect: /dated after this reconciliation/i },
    // Opens 500 above the last finalized closing: the missing statement in between blocks it.
    { name: 'uat-wrong-opening.csv', rows: [{ date: '2026-10-21', reference: `UAT-GAP-${run}`, description: 'UAT wrong opening', debit: 1, balance: r2(csvOpening + 499) }], opening: r2(csvOpening + 500), closing: r2(csvOpening + 499), expect: /a statement is missing in between/i },
  ]
  for (const bad of badRows) {
    const badCsv = buildStatementCsv({ accountNumber: fixture.accountNumber, currencyCode: fixture.currencyCode, opening: bad.opening ?? csvOpening, closing: bad.closing ?? csvClosing, rows: bad.rows })
    await uploadStatement(resumedMount, { name: bad.name, mimeType: 'text/csv', buffer: Buffer.from(badCsv) })
    // Whichever refusal comes back, the expected one is the only pass condition; naming the
    // refusal actually received is what tells a wrong rule apart from a wrong fixture.
    await page.getByText(bad.expect).waitFor({ timeout: 30000 }).catch(async (error) => {
      const state = await uiState(resumedMount, page)
      throw new Error(`The bad row "${bad.name}" was not refused with ${bad.expect} (${String(error.message).split('\n')[0]}). received=${JSON.stringify(state.alert || state.toasts)} csv=${JSON.stringify(badCsv.split('\n').slice(0, 4).join(' | '))} api=${JSON.stringify(evidence.apiErrors.slice(-3))}`)
    })
  }
  mark('statement row validation refuses bad lines', (await resumedMount.getByText(/Import preview/).count()) === 0)
  mark('refused statements write nothing', (await prisma.bankStatement.count({ where: { bankId: fixture.bankId } })) === 1)

  const feeCsv = buildStatementCsv({ accountNumber: fixture.accountNumber, currencyCode: fixture.currencyCode, opening: csvOpening, closing: csvClosing, rows: [{ date: '2026-10-21', reference: `UAT-FEE-${run}`, description: 'UAT bank charge', debit: 1, balance: csvClosing }] })
  await uploadStatement(resumedMount, { name: 'uat-bank-charge.csv', mimeType: 'text/csv', buffer: Buffer.from(feeCsv) })
  await resumedMount.getByText(/Import preview · 1 rows/).waitFor({ timeout: 30000 })
  mark('CSV preview totals correct', (await resumedMount.getByText(new RegExp(`Opening ${re(moneyText(csvOpening))} · Debits ${re(moneyText(1))} · Credits ${re(moneyText(0))} · Closing ${re(moneyText(csvClosing))}`)).count()) === 1)
  await resumedMount.getByRole('button', { name: 'Import statement' }).click()
  await resumedMount.getByText(/Statement imported · 1 lines/).waitFor({ timeout: 30000 })
  mark('CSV statement import persisted', (await prisma.bankStatementItem.count({ where: { statement: { bankId: fixture.bankId }, reference: `UAT-FEE-${run}` } })) === 1)

  // The bank-only charge has no cashbook line, so it is booked through the workbench.
  const feeTable = resumedMount.locator('section').filter({ hasText: /^Bank statement ·/ }).first()
  await feeTable.getByRole('button', { name: 'Book', exact: true }).click()
  const bookDialog = resumedMount.getByRole('dialog', { name: 'Book bank-only item' })
  await bookDialog.waitFor({ state: 'visible', timeout: 15000 })
  await bookDialog.getByRole('button').first().click()
  mark('book dialog closes without choosing', await bookDialog.isHidden())
  await feeTable.getByRole('button', { name: 'Book', exact: true }).click()
  await bookDialog.waitFor({ state: 'visible', timeout: 15000 })
  await bookDialog.locator('select').selectOption(fixture.expenseGlAccountId)
  await bookDialog.getByRole('button', { name: 'Book and match' }).click()
  await page.getByText('Bank-only item booked', { exact: true }).waitFor({ timeout: 30000 })
  const bookedEntry = await prisma.cashbookEntry.findFirst({ where: { bankId: fixture.bankId, reference: { contains: `UAT-FEE-${run}` } }, select: { id: true, status: true, journalEntryId: true } })
  mark('bank-only item posts through CashbookService', bookedEntry?.status === 'POSTED' && Boolean(bookedEntry?.journalEntryId))
  await resumedMount.getByText(new RegExp(`Cleared ${re(moneyText(csvClosing))}`)).waitFor({ timeout: 30000 })
  mark('bank-only booking brings the cleared balance to the statement')
  const csvFinish = await finishSession(page, resumedMount, 'CSV bank-only finalize')
  const csvFinalized = (await prisma.cashbookReconciliationSession.findUnique({ where: { id: csvSession.id }, select: { status: true } })).status
  mark('CSV bank-only workflow finalizes', csvFinalized === 'FINALIZED' && csvFinish.status === 200)

  // ---- Session 3: a draft can be thrown away, and it disappears from the list.
  await resumedMount.getByRole('button', { name: 'Back to Sessions' }).click()
  await resumedMount.getByRole('button', { name: 'New Reconciliation' }).click()
  await resumedMount.getByLabel(/Statement Date/).fill('2026-10-22')
  await resumedMount.getByLabel(/Opening Balance/).fill(String(csvClosing))
  await resumedMount.getByLabel(/Statement End Balance/).fill(String(csvClosing))
  const discardReference = `${reference}-DISCARD`
  await resumedMount.getByLabel(/^Reference/).fill(discardReference)
  await resumedMount.getByRole('button', { name: 'Start Reconciliation' }).click()
  await resumedMount.getByRole('button', { name: 'Discard' }).waitFor({ timeout: 30000 })
  const discardSession = await prisma.cashbookReconciliationSession.findFirst({ where: { bankId: fixture.bankId, reference: discardReference }, select: { id: true } })
  if (!discardSession) throw new Error('The discard-test draft was not created.')
  // The confirm handler has to be armed before the click, or the dialog is auto-dismissed.
  armDialog(page)
  await resumedMount.getByRole('button', { name: 'Discard' }).click()
  await page.getByText('Draft discarded', { exact: true }).waitFor({ timeout: 30000 })
  await resumedMount.getByRole('button', { name: 'New Reconciliation' }).waitFor({ timeout: 20000 })
  mark('draft discard persists', (await prisma.cashbookReconciliationSession.findUnique({ where: { id: discardSession.id }, select: { status: true } }))?.status === 'CANCELLED')
  // The sessions list refetches asynchronously after returning from the workbench. Wait for
  // another known fixture row before measuring either row semantics or absence of the discarded
  // draft; otherwise both checks can pass vacuously while the table is still unmounted.
  const knownSessionRow = resumedMount.locator('tbody tr').filter({ hasText: csvReference }).first()
  await knownSessionRow.waitFor({ state: 'visible', timeout: 30000 })
  // Measured, so the claim is evidence and not an assumption: the same table answers a different
  // row count depending on whether it is addressed by role or by the DOM.
  evidence.rowAddressability = {
    roleRows: await resumedMount.getByRole('row').count().catch(() => -1),
    domRows: await resumedMount.locator('tbody tr').count().catch(() => -1),
  }
  mark('session rows preserve accessible table row semantics', evidence.rowAddressability.domRows >= 1 && evidence.rowAddressability.roleRows === evidence.rowAddressability.domRows + 1)
  const accessibleFinishedRow = resumedMount.getByRole('row').filter({ hasText: csvReference }).first()
  await accessibleFinishedRow.focus()
  await accessibleFinishedRow.press('Enter')
  await resumedMount.getByRole('button', { name: 'Back to Sessions' }).waitFor({ timeout: 30000 })
  mark('session row opens from keyboard', true)
  await resumedMount.getByRole('button', { name: 'Back to Sessions' }).click()
  await resumedMount.locator('tbody tr').filter({ hasText: csvReference }).first().waitFor({ timeout: 30000 })

  // A cancelled draft must disappear from the list, and the check has to count real rows.
  mark('cancelled draft leaves the session list', (await resumedMount.locator('tbody tr').filter({ hasText: discardReference }).count()) === 0)
  mark('a new draft can start after the discard', (await resumedMount.getByRole('button', { name: 'New Reconciliation' }).count()) === 1)

  // ---- Session list exports (three formats) from the sessions view.
  await exportFile(page, resumedMount, 'reconciliation sessions', 'PDF')
  await exportFile(page, resumedMount, 'reconciliation sessions', 'Excel')
  await exportFile(page, resumedMount, 'reconciliation sessions', 'CSV')
  mark('session list exports in three formats')

  // ---- A finished session opens read-only and its rows still export.
  const finishedRow = resumedMount.locator('tbody tr').filter({ hasText: csvReference }).first()
  await finishedRow.click()
  await resumedMount.getByRole('button', { name: 'Back to Sessions' }).waitFor({ timeout: 30000 })
  // A finalized workbench builds its footer from two independent signals - the session status and
  // the manage_ledger permission - so each condition is measured on its own. "The read-only view
  // still offers a write control" and "Reopen never appeared because permissions had not settled"
  // are different faults, and one ANDed boolean cannot tell them apart.
  await resumedMount.getByText(/Statement imported ·/).waitFor({ timeout: 30000 }).catch(() => {})
  await resumedMount.getByRole('button', { name: 'Reopen' }).waitFor({ timeout: 30000 }).catch(() => {})
  evidence.finishedReadOnly = {
    saveDraft: await resumedMount.getByRole('button', { name: 'Save Draft' }).count(),
    finish: await resumedMount.getByRole('button', { name: 'Finish Reconciliation' }).count(),
    fileInput: await resumedMount.getByLabel('Choose bank statement').count(),
    reopen: await resumedMount.getByRole('button', { name: 'Reopen' }).count(),
    importedBanner: await resumedMount.getByText(/Statement imported ·/).count(),
  }
  mark('finished session opens read-only',
    evidence.finishedReadOnly.saveDraft === 0
    && evidence.finishedReadOnly.finish === 0
    && evidence.finishedReadOnly.fileInput === 0
    && evidence.finishedReadOnly.reopen === 1)
  await exportFile(page, resumedMount, 'Bank statement', 'PDF')
  await exportFile(page, resumedMount, 'Cashbook', 'Excel')
  mark('finished session rows still export')
  await resumedMount.getByRole('button', { name: 'Back to Sessions' }).click()
  await resumedMount.locator('tbody tr').filter({ hasText: csvReference }).first().waitFor({ timeout: 30000 })
  mark('finished-session drawer is removed in favor of the read-only workbench', (await resumedMount.getByRole('dialog').count()) === 0 && (await page.getByRole('dialog').count()) === 0)

  // ---- Permission gating over the API: every reconciliation route needs the action.
  const blockedToken = await apiToken(process.env.BANK_REC_DENIED_EMAIL, process.env.BANK_REC_DENIED_PASSWORD)
  const operatorToken = await apiToken(process.env.ACCOUNTING_TEST_EMAIL, process.env.ACCOUNTING_TEST_PASSWORD)
  const deniedRead = await page.request.get(`${apiBase}/cashbook/reconciliation/status`, { headers: { Authorization: `Bearer ${blockedToken}` } })
  const deniedWrite = await page.request.post(`${apiBase}/cashbook/reconciliation/banks/${fixture.bankId}/sessions`, { headers: { Authorization: `Bearer ${blockedToken}` }, data: { statementDate: '2026-10-23', statementEndBalance: csvClosing, openingBalance: csvClosing } })
  const deniedWorkbench = await page.request.get(`${apiBase}/cashbook/reconciliation/sessions/${csvSession.id}/workbench`, { headers: { Authorization: `Bearer ${blockedToken}` } })
  const allowedWorkbench = await page.request.get(`${apiBase}/cashbook/reconciliation/sessions/${csvSession.id}/workbench`, { headers: { Authorization: `Bearer ${operatorToken}` } })
  mark('bank reconciliation read permission enforced by API', deniedRead.status() === 403)
  mark('bank reconciliation write permission enforced by API', deniedWrite.status() === 403)
  mark('workbench read enforced by API', deniedWorkbench.status() === 403)
  mark('authorized workbench read succeeds', allowedWorkbench.status() === 200)
  evidence.deniedApi = { read: deniedRead.status(), write: deniedWrite.status(), workbench: deniedWorkbench.status(), authorizedWorkbench: allowedWorkbench.status() }

  // The same gate in the UI: an operator without the action gets no write control.
  const deniedLoginContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const deniedState = await login(deniedLoginContext, process.env.BANK_REC_DENIED_EMAIL, process.env.BANK_REC_DENIED_PASSWORD)
  await deniedLoginContext.close()
  const deniedContext = await browser.newContext({ viewport: { width: 1600, height: 1000 }, storageState: deniedState })
  const deniedPage = await deniedContext.newPage()
  await deniedPage.goto(`${base}/accounting-legacy/bank-reconciliation`, { waitUntil: 'domcontentloaded', timeout: 300000 })
  await deniedPage.getByText('Access denied', { exact: true }).waitFor({ timeout: 60000 })
  mark('legacy route denies user without bank reconciliation permission')
  await deniedPage.goto(`${base}/accounting/bank-reconciliation`, { waitUntil: 'domcontentloaded', timeout: 300000 })
  deniedPage.setDefaultTimeout(120000)
  const deniedMount = deniedPage.locator('#ac52LegacyReconciliationSlot [data-bank-reconciliation-module]')
  await deniedMount.getByRole('heading', { name: 'Bank Reconciliation' }).waitFor({ timeout: 240000 })
  await deniedMount.getByRole('combobox').first().click()
  await deniedPage.getByRole('option', { name: new RegExp(`UAT Bank Reconciliation ${run}`) }).click()
  await deniedPage.waitForTimeout(4000)
  const deniedUi = { newReconciliation: await deniedMount.getByRole('button', { name: 'New Reconciliation' }).count(), startReconciliation: null }
  if (deniedUi.newReconciliation) {
    await deniedMount.getByRole('button', { name: 'New Reconciliation' }).click()
    await deniedPage.waitForTimeout(1500)
    deniedUi.startReconciliation = await deniedMount.getByRole('button', { name: 'Start Reconciliation' }).count()
  }
  evidence.deniedUi = deniedUi
  mark('reconciliation write controls hidden from unauthorized operator', deniedUi.newReconciliation === 1 && deniedUi.startReconciliation === 0)
  await deniedContext.close()

  await restoredContext.close()
}

try {
  const { pdfBuffer, stmt } = await prepareFixture()
  mark('fixture contains eight matching synthetic entries', fixture.itemCount === 8)
  mark('statement arithmetic', r2(fixture.opening + fixture.credits - fixture.debits) === fixture.closing)
  await runBrowser(pdfBuffer, stmt)
} catch (error) {
  evidence.errors.push(error instanceof Error ? error.message.split('\n')[0] : 'UAT failed')
} finally {
  if (browser) await browser.close().catch(() => {})
  await cleanupFixture().catch(() => { evidence.errors.push('Disposable fixture cleanup reported an error.') })
  await prisma.$disconnect()
  delete process.env.ACCOUNTING_TEST_EMAIL
  delete process.env.ACCOUNTING_TEST_PASSWORD
  delete process.env.BANK_REC_DENIED_EMAIL
  delete process.env.BANK_REC_DENIED_PASSWORD
  delete process.env.BANK_REC_NO_REOPEN_EMAIL
  delete process.env.BANK_REC_NO_REOPEN_PASSWORD
  delete process.env.BANK_REC_FLAT_EMAIL
  delete process.env.BANK_REC_FLAT_PASSWORD
  await mkdir(artifactDir, { recursive: true })
  await writeFile(join(artifactDir, 'interactions.json'), JSON.stringify(evidence, null, 2), 'utf8')
  const failures = Object.entries(evidence.checks).filter(([, value]) => value !== true).map(([name]) => name)
  console.log(JSON.stringify({ seconds: Math.round((new Date() - startedAt) / 1000), checks: Object.keys(evidence.checks).length, passed: Object.keys(evidence.checks).length - failures.length, failed: failures, errors: evidence.errors.length, exports: evidence.exports.length, findings: evidence.findings.length, cleanup: fixture === null }))
  if (evidence.errors.length || failures.length) process.exitCode = 1
}
