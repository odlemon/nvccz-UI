// Autonomous FP&A Model Planning UI QA via Playwright (headless Chromium).
// Run: node qa-fpa-ui.mjs   (dev server must be up on http://localhost:3000)
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const EMAIL = 'admin@nts.com'
const PASS = 'admin123'
const OUT = 'qa-artifacts'
mkdirSync(OUT, { recursive: true })

const report = {
  startedAt: new Date().toISOString(),
  steps: [],
  consoleErrors: [],
  pageErrors: [],
  networkFailures: [],
  nonOkResponses: [],
  fpaApiGaps: [],
  screenshots: [],
}
const log = (msg, data) => {
  const entry = { t: new Date().toISOString(), msg, ...(data ? { data } : {}) }
  report.steps.push(entry)
  console.log(`• ${msg}`, data ? JSON.stringify(data) : '')
}
const shot = async (page, name) => {
  const p = `${OUT}/${name}.png`
  await page.screenshot({ path: p, fullPage: false })
  report.screenshots.push(p)
  log(`screenshot: ${name}`)
}

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  page.on('console', (m) => {
    if (m.type() === 'error') report.consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => report.pageErrors.push(String(e)))
  page.on('requestfailed', (r) =>
    report.networkFailures.push({ url: r.url(), failure: r.failure()?.errorText }),
  )
  page.on('response', async (r) => {
    const u = r.url()
    if (u.includes('/api/') && r.status() >= 400) {
      let body = ''
      try { body = (await r.text()).slice(0, 500) } catch {}
      report.nonOkResponses.push({ url: u, status: r.status(), body })
    }
  })
  // Auto-accept window.prompt/confirm (create-scenario uses window.prompt)
  page.on('dialog', async (d) => {
    log(`dialog(${d.type()}): "${d.message()}" -> accept "QA Scenario"`)
    try { await d.accept('QA Scenario') } catch {}
  })

  // 1. Login
  log('goto /login')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await shot(page, '01-login')
  // heuristic login form fill
  const emailSel = 'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="mail" i]'
  const passSel = 'input[type="password"]'
  if (await page.locator(emailSel).count()) {
    await page.fill(emailSel, EMAIL)
    await page.fill(passSel, PASS)
    const submit = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first()
    await submit.click().catch(() => page.keyboard.press('Enter'))
    log('submitted login form')
  } else {
    log('NO email input found on /login — dumping visible text', {
      body: (await page.locator('body').innerText()).slice(0, 400),
    })
  }
  await page.waitForTimeout(2500)
  await shot(page, '02-after-login')

  // 2. Models list
  log('goto /forecasting/models')
  await page.goto(`${BASE}/forecasting/models`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await shot(page, '03-models')

  // pick first model link
  const modelLink = page.locator('a[href*="/forecasting/models/"]').first()
  if (await modelLink.count()) {
    const href = await modelLink.getAttribute('href')
    log('opening model', { href })
    await modelLink.click()
    await page.waitForTimeout(2500)
  } else {
    log('no model link found; navigating by assumption to /worksheet')
  }
  await shot(page, '04-worksheet')

  // current url
  const wsUrl = page.url()
  log('worksheet url', { wsUrl })

  // 3. Switch a scenario tab (click any scenario-named button in chrome)
  const scenarioTab = page.locator('button:has-text("Base Case"), button:has-text("Upside"), button:has-text("Budget"), button:has-text("Forecast")').first()
  if (await scenarioTab.count()) {
    await scenarioTab.click().catch((e) => log('scenario tab click failed', { e: String(e) }))
    await page.waitForTimeout(1500)
    log('clicked a scenario tab')
    await shot(page, '05-scenario-switched')
  } else {
    log('no recognizable scenario tab to click')
  }

  // 4. Compare mode
  const compareBtn = page.locator('button:has-text("Compare")').first()
  if (await compareBtn.count()) {
    await compareBtn.click().catch((e) => log('compare click failed', { e: String(e) }))
    await page.waitForTimeout(2500)
    log('clicked Compare')
  } else {
    // fallback: append ?view=compare
    const sep = wsUrl.includes('?') ? '&' : '?'
    await page.goto(`${wsUrl}${sep}view=compare`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    log('navigated to ?view=compare')
  }
  await shot(page, '06-compare')

  // 5. Edit an assumption (if present)
  const editAssump = page.locator('button:has-text("Edit Assumptions"), button:has-text("Edit Drivers")').first()
  if (await editAssump.count()) {
    await editAssump.click().catch(() => {})
    await page.waitForTimeout(800)
    const input = page.locator('dialog input, [role="dialog"] input').first()
    if (await input.count()) {
      await input.fill('5.5').catch(() => {})
      const save = page.locator('button:has-text("Save"), button:has-text("Save Changes")').first()
      await save.click().catch(() => {})
      await page.waitForTimeout(1500)
      log('edited + saved an assumption')
    } else {
      log('assumption dialog had no inputs')
    }
    await shot(page, '07-assumption-edit')
  } else {
    log('no Edit Assumptions button found in compare')
  }

  // 6. Standalone Scenarios page: create / copy / promote
  log('goto /forecasting/scenarios')
  await page.goto(`${BASE}/forecasting/scenarios`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await shot(page, '08-scenarios-list')

  const newBtn = page.locator('button:has-text("New Scenario")').first()
  if (await newBtn.count()) {
    await newBtn.click().catch(() => {})
    await page.waitForTimeout(1500)
    log('clicked New Scenario (dialog auto-filled "QA Scenario")')
    await shot(page, '09-scenario-created')
  } else {
    log('no New Scenario button')
  }

  const dupBtn = page.locator('button:has-text("Duplicate")').first()
  if (await dupBtn.count()) {
    await dupBtn.click().catch(() => {})
    await page.waitForTimeout(1500)
    log('clicked Duplicate')
    await shot(page, '10-scenario-duplicated')
  }

  const promoBtn = page.locator('button:has-text("Promote")').first()
  if (await promoBtn.count()) {
    await promoBtn.click().catch(() => {})
    await page.waitForTimeout(1500)
    log('clicked Promote')
    await shot(page, '11-scenario-promoted')
  }

  // 7. Collect FP&A API gaps from sessionStorage
  try {
    const gaps = await page.evaluate(() => {
      try { return JSON.parse(sessionStorage.getItem('fpa-api-gaps') || '[]') } catch { return [] }
    })
    report.fpaApiGaps = gaps
    log('collected fpa-api-gaps', { count: gaps.length })
  } catch (e) {
    log('could not read fpa-api-gaps', { e: String(e) })
  }

  await browser.close()
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
  log('DONE — wrote qa-artifacts/report.json')
}

run().catch((e) => {
  console.error('FATAL', e)
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
  process.exit(1)
})
