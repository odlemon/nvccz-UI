/**
 * Fundraising full-flow browser QA (Playwright).
 * Login → walk every /fundraising tab → write FE + BE issue MDs.
 *
 * Run: node scripts/qa-fundraising-flow.mjs
 * FE default: http://localhost:3001 (override APP_URL)
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
loadEnvLocal()

const BASE = process.env.APP_URL || 'http://localhost:3001'
const API = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api').replace(/\/$/, '')
const EMAIL = 'admin@nts.com'
const PASSWORD = 'admin123'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ROUTES = [
  { path: '/fundraising', name: 'Dashboard' },
  { path: '/fundraising/campaigns', name: 'Campaigns' },
  { path: '/fundraising/investors', name: 'Investors' },
  { path: '/fundraising/contacts', name: 'Contacts' },
  { path: '/fundraising/pipeline', name: 'Pipeline' },
  { path: '/fundraising/mandates', name: 'Mandates' },
  { path: '/fundraising/due-diligence', name: 'Due Diligence' },
  { path: '/fundraising/data-rooms', name: 'Data Rooms' },
  { path: '/fundraising/communications', name: 'Communications' },
  { path: '/fundraising/meetings', name: 'Meetings & Tasks' },
  { path: '/fundraising/documents', name: 'Documents' },
  { path: '/fundraising/agreements', name: 'Agreements' },
  { path: '/fundraising/commitments', name: 'Commitments' },
  { path: '/fundraising/onboarding', name: 'Onboarding' },
  { path: '/fundraising/placement-agents', name: 'Placement Agents' },
  { path: '/fundraising/forecasts', name: 'Forecasts' },
  { path: '/fundraising/reports', name: 'Reports' },
  { path: '/fundraising/approvals', name: 'Approvals' },
  { path: '/fundraising/audit', name: 'Audit' },
  { path: '/fundraising/settings', name: 'Settings' },
]

const feIssues = []
const beIssues = []
const notes = []

const pushFe = (sev, tab, title, detail) =>
  feIssues.push({ sev, tab, title, detail, at: new Date().toISOString() })
const pushBe = (sev, tab, title, detail) =>
  beIssues.push({ sev, tab, title, detail, at: new Date().toISOString() })

function classifyApi(status, url, bodyText) {
  const path = url.includes('/api') ? url.slice(url.indexOf('/api')) : url
  let code
  try {
    code = JSON.parse(bodyText || '{}')?.error?.code
  } catch {
    /* ignore */
  }
  return { path, status, code, bodySnippet: (bodyText || '').slice(0, 400) }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 120000 })
  // Wait for client hydration — early submit becomes a native form request and never hits :3002.
  await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).first().waitFor({ timeout: 60000 })
  await sleep(2000)
  const email = page.locator('input[type="email"]').first()
  const password = page.locator('input[type="password"]').first()
  await email.fill(EMAIL)
  await password.fill(PASSWORD)
  if ((await email.inputValue()) !== EMAIL || !(await password.inputValue())) {
    throw new Error('Login inputs cleared after fill (page not hydrated)')
  }
  await page.locator('button[type="submit"]').first().click()
  try {
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 })
  } catch {
    const body = await page.locator('body').innerText().catch(() => '')
    throw new Error(`Still on login: ${body.slice(0, 400)}`)
  }
  await sleep(1500)
  notes.push(`Logged in → ${page.url()}`)
}

async function probeTab(page, route, apiHits) {
  const tab = route.name
  const before = apiHits.length
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  } catch (e) {
    pushFe('high', tab, 'Navigation timeout/error', e.message)
  }
  await sleep(3500)

  const snap = await page.evaluate(() => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      h1: document.querySelector('h1')?.innerText?.trim() || '',
      snippet: text.slice(0, 350).replace(/\s+/g, ' '),
      loaders: document.querySelectorAll('[class*="animate-spin"], .animate-spin').length,
      tables: document.querySelectorAll('table tbody tr').length,
      empty: /no (data|results|campaigns|investors|records|items|meetings|documents)/i.test(text),
      errBanner: /something went wrong|failed to load|network error|unauthorized|forbidden/i.test(text),
      redirectedToLogin: /\/login/.test(location.href),
    }
  })

  if (snap.redirectedToLogin) {
    pushFe('critical', tab, 'Redirected to login', `Lost session on ${route.path}`)
    return
  }
  if (snap.errBanner) pushFe('high', tab, 'Error copy visible on page', snap.snippet)
  if (snap.loaders > 0) {
    await sleep(4500)
    const still = await page.locator('[class*="animate-spin"], .animate-spin').count()
    if (still > 0) pushFe('medium', tab, 'Spinner stuck after wait', `${still} spinner(s)`)
  }

  const hits = apiHits.slice(before).filter((h) => /fundraising|investors|auth\/login/i.test(h.url))
  if (hits.length === 0) {
    pushFe('medium', tab, 'No fundraising/investors API calls observed', route.path)
  }
  for (const h of hits) {
    if (h.failed) {
      pushBe('critical', tab, `Request failed ${h.method} ${h.path}`, h.failed)
      continue
    }
    if (h.status >= 500) pushBe('high', tab, `HTTP ${h.status} ${h.method} ${h.path}`, h.bodySnippet)
    else if (h.status === 404) pushBe('high', tab, `HTTP 404 ${h.method} ${h.path}`, 'Missing endpoint?')
    else if (h.status === 401 || h.status === 403)
      pushBe('high', tab, `HTTP ${h.status} ${h.method} ${h.path}`, h.bodySnippet)
    else if (h.status >= 400) {
      const known = [
        'ACTIVATION_REQUIREMENTS_UNMET',
        'STAGE_GATE_FAILED',
        'CAMPAIGN_NOT_ACTIVE',
        'VALIDATION_ERROR',
        'COMPLIANCE_BLOCKED',
      ].includes(h.code)
      if (known) notes.push(`${tab}: domain ${h.code} on ${h.path}`)
      else pushBe('medium', tab, `HTTP ${h.status} ${h.method} ${h.path}`, `${h.code || ''} ${h.bodySnippet}`)
    }
  }

  try {
    const btn = page
      .locator('button')
      .filter({ hasText: /add |new |create |log |schedule |board|overview|export/i })
      .first()
    if (await btn.count()) {
      const label = (await btn.innerText()).trim().slice(0, 60)
      await btn.click({ timeout: 3000 }).catch(() => {})
      await sleep(1200)
      notes.push(`${tab}: clicked "${label}"`)
      await page.keyboard.press('Escape')
      await sleep(400)
    }
  } catch (e) {
    pushFe('low', tab, 'Click interaction error', e.message)
  }

  notes.push(
    `${tab}: h1="${snap.h1}" rows=${snap.tables} empty=${snap.empty} api=${hits.length}`
  )
}

function renderMd(kind, issues, extra) {
  const lines = [
    `# Fundraising ${kind} issues`,
    '',
    `**Captured:** ${new Date().toISOString()}`,
    `**App:** ${BASE}`,
    `**API:** ${API}`,
    `**Login:** ${EMAIL}`,
    '',
    extra,
    '',
    '## Summary',
    '',
    '| Severity | Count |',
    '|----------|------:|',
    `| critical | ${issues.filter((i) => i.sev === 'critical').length} |`,
    `| high | ${issues.filter((i) => i.sev === 'high').length} |`,
    `| medium | ${issues.filter((i) => i.sev === 'medium').length} |`,
    `| low | ${issues.filter((i) => i.sev === 'low').length} |`,
    `| **total** | **${issues.length}** |`,
    '',
  ]
  if (!issues.length) {
    lines.push('_No issues recorded in this pass._', '')
    return lines.join('\n')
  }
  lines.push('## Issues', '')
  issues.forEach((i, idx) => {
    lines.push(`### ${idx + 1}. [${i.sev}] ${i.tab} — ${i.title}`, '')
    lines.push(`- **When:** ${i.at}`)
    lines.push('- **Detail:**', '', '```', String(i.detail || '').slice(0, 1200), '```', '')
  })
  return lines.join('\n')
}

;(async () => {
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) pushBe('critical', 'Preflight', 'Login API failed', `${r.status} ${JSON.stringify(j).slice(0, 300)}`)
    else notes.push('API login preflight OK')
  } catch (e) {
    pushBe('critical', 'Preflight', 'API unreachable at ' + API, e.message)
  }

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox'],
  })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const apiHits = []

  page.on('response', async (res) => {
    const url = res.url()
    if (!/localhost:3002|\/api\//.test(url)) return
    if (!/fundraising|investors|auth\/login/i.test(url)) return
    let bodyText = ''
    try {
      bodyText = await res.text()
    } catch {
      /* ignore */
    }
    apiHits.push({
      method: res.request().method(),
      url,
      status: res.status(),
      ...classifyApi(res.status(), url, bodyText),
    })
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (!/localhost:3002|\/api\//.test(url)) return
    if (!/fundraising|investors|auth/i.test(url)) return
    apiHits.push({
      method: req.method(),
      url,
      status: 0,
      path: url,
      failed: req.failure()?.errorText || 'failed',
    })
  })
  page.on('pageerror', (err) => pushFe('high', 'Runtime', 'Unhandled page error', err.message))
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text()
      if (/favicon|React DevTools/i.test(t)) return
      pushFe('low', 'Console', 'console.error', t.slice(0, 400))
    }
  })

  try {
    await login(page)
  } catch (e) {
    pushFe('critical', 'Login', 'Could not complete browser login', e.message)
  }

  if (!feIssues.some((i) => i.tab === 'Login' && i.sev === 'critical')) {
    for (const route of ROUTES) {
      try {
        await probeTab(page, route, apiHits)
      } catch (e) {
        pushFe('high', route.name, 'Tab probe crashed', e.message)
      }
    }
  }

  await browser.close()

  mkdirSync(resolve('design-refs'), { recursive: true })
  const fePath = resolve('design-refs/fundraising-frontend-qa-issues.md')
  const bePath = resolve('design-refs/fundraising-backend-qa-issues.md')
  writeFileSync(
    fePath,
    renderMd(
      'frontend QA',
      feIssues,
      [
        'Browser walk of Fundraising after login. **FE** = UI crash, stuck spinner, missing control, client routing, console errors without a clear API failure.',
        '',
        '### Session notes',
        '',
        ...notes.map((n) => `- ${n}`),
      ].join('\n')
    )
  )
  writeFileSync(
    bePath,
    renderMd(
      'backend QA',
      beIssues,
      [
        'Network issues against `NEXT_PUBLIC_API_BASE_URL`. **BE** = connection refused, 4xx/5xx (except expected domain codes), missing endpoints, auth failures.',
        '',
        'Expected domain codes (not bugs unless blocking): `ACTIVATION_REQUIREMENTS_UNMET`, `STAGE_GATE_FAILED`, `CAMPAIGN_NOT_ACTIVE`, `VALIDATION_ERROR`, `COMPLIANCE_BLOCKED`.',
      ].join('\n')
    )
  )

  console.log(`\nWrote:\n  ${fePath} (${feIssues.length})\n  ${bePath} (${beIssues.length})\n`)
  process.exit(
    feIssues.some((i) => i.sev === 'critical') || beIssues.some((i) => i.sev === 'critical') ? 1 : 0
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
