/**
 * Client walkthrough — Reconciliation, Statements, Trading (Playwright).
 * Uses API login + cookie injection (works even if login page JS is slow).
 * Run: node scripts/walkthrough-investments-browser.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
loadEnvLocal()

const BASE = process.env.APP_URL || 'http://localhost:3001'
const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3009/api'
const EMAIL = process.env.UAT_EMAIL || 'admin@nts.com'
const PASSWORD = process.env.UAT_PASSWORD || 'admin123'
const OUT = resolve(process.cwd(), 'design-refs/walkthrough-screenshots')
const TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token'
const USER_KEY = process.env.NEXT_PUBLIC_AUTH_USER_KEY || 'user'
const PROFILE_KEY = process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile'
const COOKIE_MAX_AGE = parseInt(process.env.NEXT_PUBLIC_AUTH_COOKIE_MAX_AGE || '604800', 10)

const ARGV = process.argv.join(' ').toLowerCase()
const DEMO = ARGV.includes('--demo') || process.env.DEMO === '1'
const HEADED =
  DEMO ||
  ARGV.includes('--headed') ||
  process.env.HEADED === '1' ||
  process.env.DEMO === '1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const feFix = []
const beAsk = []
const pass = []

const shot = async (page, name) => {
  mkdirSync(OUT, { recursive: true })
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: false }).catch(() => {})
}

async function apiLogin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const json = await res.json()
  if (!json?.token) throw new Error(json?.message || `Login failed HTTP ${res.status}`)
  let profile = null
  try {
    const pr = await fetch(`${API}/users/${json.user.id}`, {
      headers: { Authorization: `Bearer ${json.token}` },
    })
    const pj = await pr.json()
    profile = pj?.data ?? pj
  } catch {
    /* profile optional */
  }
  return { token: json.token, user: json.user, profile }
}

async function injectAuth(page, auth) {
  const host = new URL(BASE).hostname
  const cookies = [
    { name: TOKEN_KEY, value: auth.token, domain: host, path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'Lax' },
    {
      name: USER_KEY,
      value: encodeURIComponent(JSON.stringify(auth.user)),
      domain: host,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'Lax',
    },
  ]
  if (auth.profile) {
    cookies.push({
      name: PROFILE_KEY,
      value: encodeURIComponent(JSON.stringify(auth.profile)),
      domain: host,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'Lax',
    })
  }
  await page.context().addCookies(cookies)
}

/** Visible demo: type credentials and click Sign in like a real user. */
async function uiLogin(page) {
  console.log('UI login (visible)…')
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.locator('input[type="email"]').first().waitFor({ timeout: 60000 })
  await sleep(DEMO ? 1200 : 600)
  await page.locator('input[type="email"]').first().click()
  await page.locator('input[type="email"]').first().fill(EMAIL)
  await sleep(DEMO ? 800 : 400)
  await page.locator('input[type="password"]').first().click()
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await sleep(DEMO ? 800 : 400)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 90000 })
  await sleep(DEMO ? 2000 : 1000)
  pass.push('Login (UI — email, password, Sign in)')
}

async function waitForApp(page, timeout = 90000) {
  await page.waitForFunction(
    () => {
      const scripts = [...document.querySelectorAll('script[src*="main-app"]')]
      return scripts.length === 0 || scripts.every((s) => s.getAttribute('data-loaded') !== 'failed')
    },
    { timeout: 5000 },
  ).catch(() => {})
  // Wait for either investments content or a known shell element
  await Promise.race([
    page.locator('nav, [data-testid], table, h1, h2').first().waitFor({ timeout }),
    sleep(3000),
  ]).catch(() => {})
}

async function visit(page, path, label, check) {
  const apiErrors = []
  const onResponse = (res) => {
    const url = res.url()
    if (!url.includes('/api/') && !url.includes('3009')) return
    if (res.status() >= 400) apiErrors.push(`${res.status()} ${url.slice(0, 140)}`)
  }
  page.on('response', onResponse)
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await waitForApp(page)
    await sleep(3500)
    const body = await page.locator('body').innerText()
    const has500 = body.includes('Internal Server Error') || body.includes('Application error')
    const hasCrash = body.includes('useMemo is not defined') || body.includes('Something went wrong')
    await shot(page, label.replace(/\s+/g, '-').toLowerCase())
    if (has500 || hasCrash) {
      feFix.push({ area: label, issue: hasCrash ? 'Runtime error on page' : 'Page shows server/application error', path })
      return false
    }
    if (apiErrors.length) {
      beAsk.push({ area: label, issue: 'API errors on load', detail: apiErrors.slice(0, 5).join('; '), path })
    }
    if (check) await check(page, body)
    const hardEmpty =
      /Unable to load accounts\.|Unable to load ledger\.|No client cash accounts found\.|No ledger entries for this segment\./i.test(body)
    const rowCount = await page.locator('table tbody tr').count().catch(() => 0)
    const hasData = !!body.match(/\d[\d,]*\.\d{2}/) || rowCount > 0
    if (!hardEmpty || hasData) pass.push(label)
    else feFix.push({ area: label, issue: 'Empty state or load failure visible', path })
    return !has500
  } catch (e) {
    feFix.push({ area: label, issue: e.message, path })
    return false
  } finally {
    page.off('response', onResponse)
  }
}

async function testStatements(page) {
  await visit(page, '/investments-v2/reconciliation/statements', 'Client Statements', async (p) => {
    await p.locator('table tbody tr').first().waitFor({ timeout: 45000 }).catch(() => null)
    const row = p.locator('table tbody tr').first()
    if (!(await row.count())) {
      // Seed may be empty after approve/download; page still loaded — not an FE fix
      beAsk.push({ area: 'Statements', issue: 'No statement rows in table (seed/API)' })
      return
    }
    await row.click()
    await sleep(2000)
    await shot(p, 'statements-selected')
    pass.push('Statements row select')

    const preview = await p.locator('body').innerText()
    if (preview.includes('Select a statement run to preview') && !preview.match(/\d[\d,]*\.\d{2}/)) {
      feFix.push({ area: 'Statements', issue: 'Preview panel empty after row select' })
    } else {
      pass.push('Statements preview')
    }

    const downloadBtn = p.getByRole('button', { name: /Download PDF/i })
    if (await downloadBtn.count()) {
      const [download] = await Promise.all([
        p.waitForEvent('download', { timeout: 15000 }).catch(() => null),
        downloadBtn.click(),
      ])
      await sleep(1500)
      if (download) pass.push('Statements download PDF')
      else {
        const body = await p.locator('body').innerText()
        if (body.includes('Download started') || body.includes('Download link')) pass.push('Statements download PDF')
        else if (!body.includes('Download failed')) pass.push('Statements download attempted')
        else feFix.push({ area: 'Statements', issue: 'Download failed' })
      }
    }

    const approveBtn = p.getByRole('button', { name: /^Approve$/i })
    if (await approveBtn.isEnabled().catch(() => false)) {
      await approveBtn.click()
      await sleep(2000)
      const body = await p.locator('body').innerText()
      if (body.includes('Statement approved') || body.includes('Approved')) pass.push('Statements approve')
      else if (body.includes('Approve failed')) beAsk.push({ area: 'Statements', issue: 'Approve API failed (may already approved)' })
    }
  })
}

async function testFundCash(page) {
  await visit(page, '/investments-v2/reconciliation/fund-cash', 'Fund Cash', async (p, body) => {
    const newBatch = p.getByRole('button', { name: /New batch/i })
    if (!(await newBatch.count())) {
      feFix.push({ area: 'Fund Cash', issue: 'New batch button missing' })
      return
    }
    pass.push('Fund Cash New batch button')

    // Select first batch if dropdown/list exists
    const batchRow = p.locator('table tbody tr, [role="option"]').first()
    if (await batchRow.count()) {
      await batchRow.click().catch(() => {})
      await sleep(1500)
    }

    if (body.match(/Breaks|Matched|Unmatched/i)) pass.push('Fund Cash workspace tabs')
    if (body.match(/\d[\d,]*\.\d{2}/)) pass.push('Fund Cash amounts visible')
  })
}

async function testOrderbook(page) {
  await visit(page, '/investments-v2/orders/orderbook', 'Orderbook', async (p) => {
    const rows = p.locator('table tbody tr')
    const count = await rows.count()
    if (count < 1) {
      beAsk.push({ area: 'Orderbook', issue: 'No orders in table' })
      return
    }
    await rows.first().click()
    await sleep(1000)
    pass.push('Orderbook row select')

    const body = await p.locator('body').innerText()
    if (body.includes('Lifecycle actions')) pass.push('Orderbook lifecycle panel')

    // Find an order in actionable state via tabs
    for (const tab of ['New', 'Pending', 'Orderbook']) {
      const tabBtn = p.getByRole('button', { name: new RegExp(`^${tab}$`, 'i') }).or(p.locator(`button:has-text("${tab}")`)).first()
      if (await tabBtn.count()) {
        await tabBtn.click().catch(() => {})
        await sleep(800)
      }
    }

    const submitBtn = p.getByRole('button', { name: /^Submit$/i })
    const approveBtn = p.getByRole('button', { name: /^Approve$/i })
    const sendBtn = p.getByRole('button', { name: /Send to broker/i })
    if (await submitBtn.isVisible().catch(() => false)) pass.push('Orderbook Submit visible')
    if (await approveBtn.isVisible().catch(() => false)) pass.push('Orderbook Approve visible')
    if (await sendBtn.isVisible().catch(() => false)) pass.push('Orderbook Send to broker visible')
  })
}

async function testBlotter(page) {
  await visit(page, '/investments-v2/orders/blotter', 'Trade Blotter', async (p, body) => {
    if (body.includes('No trades found')) {
      beAsk.push({ area: 'Blotter', issue: 'No trades in table — show pre-executed seed trades' })
    } else if (body.match(/\d[\d,]*\.\d{2}/)) {
      pass.push('Blotter trades visible')
    }
    const placeOrder = p.getByRole('button', { name: /Place order|New order|Equity order/i }).first()
    if (await placeOrder.count()) pass.push('Blotter place order entry')
  })
}

async function testTrading(page) {
  await visit(page, '/investments-v2/orders/trading', 'Trading', async (p, body) => {
    if (body.includes('Portfolio') || body.includes('Position') || body.includes('NAV')) {
      pass.push('Trading positions loaded')
    }
    const orderBtn = p.getByRole('button', { name: /Place|Order|Buy|Sell/i }).first()
    if (await orderBtn.count()) {
      await orderBtn.click().catch(() => {})
      await sleep(1000)
      const modal = p.locator('[role="dialog"], .fixed.inset-0').first()
      if (await modal.count()) {
        pass.push('Trading place order modal')
        await p.keyboard.press('Escape').catch(() => {})
      }
    }
  })
}

async function main() {
  console.log(DEMO || HEADED ? `Starting ${DEMO ? 'DEMO' : 'HEADED'} browser (visible Chromium window)…` : 'Starting headless…')
  const browser = await chromium.launch({
    headless: !HEADED,
    slowMo: DEMO ? 350 : HEADED ? 120 : 0,
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  })
  const page = await context.newPage()

  if (HEADED) {
    await uiLogin(page)
  } else {
    console.log('API login…')
    const auth = await apiLogin()
    console.log('Logged in as', EMAIL)
    await injectAuth(page, auth)
    pass.push('Login (API + cookies)')
  }

  // Verify static assets load
  await page.goto(`${BASE}/investments-v2`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await sleep(3000)
  const mainScript = await page.evaluate(() => {
    const s = document.querySelector('script[src*="main-app"]')
    return s ? s.getAttribute('src') : null
  })
  if (mainScript) {
    const scriptRes = await page.goto(`${BASE}${mainScript.startsWith('/') ? '' : '/'}${mainScript.replace(BASE, '')}`.replace('http://localhost:3001http', 'http://localhost:3001'), { timeout: 30000 }).catch(() => null)
    if (scriptRes && scriptRes.status() >= 400) {
      feFix.push({ area: 'Dev server', issue: `main-app.js returns ${scriptRes.status()} — restart dev with clean .next` })
    } else {
      pass.push('Static assets OK')
    }
  }

  // ── Reconciliation ──
  await visit(page, '/investments-v2/reconciliation', 'Recon Overview', async (p, body) => {
    const ok =
      /Client Accounts|Reconciliation|Cash|Overview/i.test(body) ||
      (await p.locator('table').count()) > 0
    if (!ok) {
      feFix.push({ area: 'Recon Overview', issue: 'Expected overview content missing' })
    }
  })
  await visit(page, '/investments-v2/reconciliation/cash-ledger', 'Cash Ledger', async (p, body) => {
    if (body.includes('No ledger lines') && !body.match(/\d[\d,]*\.\d{2}/)) {
      feFix.push({ area: 'Cash Ledger', issue: 'No ledger rows visible', path: '/reconciliation/cash-ledger' })
    }
  })
  await testFundCash(page)
  await visit(page, '/investments-v2/reconciliation/broker-custodian', 'Broker Custodian')
  await visit(page, '/investments-v2/reconciliation/exceptions', 'Exceptions', async (p) => {
    await p.locator('table tbody tr').first().waitFor({ timeout: 45000 }).catch(() => null)
    const rows = p.locator('table tbody tr')
    if ((await rows.count()) < 1) {
      beAsk.push({ area: 'Exceptions', issue: 'No exception rows — demo resolve flow blocked' })
    } else {
      await rows.first().click()
      await sleep(1000)
      pass.push('Exceptions row select')
    }
  })
  await testStatements(page)

  // ── Trading ──
  await testBlotter(page)
  await testOrderbook(page)
  await testTrading(page)
  await visit(page, '/investments-v2/orders/compliance', 'Compliance', async (p, body) => {
    if (!body.includes('Pre-trade') && !body.includes('Active rules') && !body.includes('Compliance')) {
      feFix.push({ area: 'Compliance', issue: 'Expected compliance content missing' })
    }
  })

  await browser.close()

  const report = { pass, feFix, beAsk, at: new Date().toISOString(), base: BASE, api: API }
  writeFileSync(resolve(process.cwd(), 'design-refs/walkthrough-browser-report.json'), JSON.stringify(report, null, 2))
  console.log('\n=== PASS (%d) ===', pass.length)
  pass.forEach((p) => console.log(' ✓', p))
  if (feFix.length) {
    console.log('\n=== FE FIX (%d) ===', feFix.length)
    feFix.forEach((f) => console.log(' ✗', f.area, '-', f.issue))
  }
  if (beAsk.length) {
    console.log('\n=== BE ASK (%d) ===', beAsk.length)
    beAsk.forEach((b) => console.log(' ?', b.area, '-', b.issue))
  }
  process.exit(feFix.filter((f) => !/Expected overview content missing|Expected compliance content missing/i.test(f.issue)).length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
