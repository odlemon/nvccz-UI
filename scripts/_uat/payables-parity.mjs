import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
const email = process.env.ACCOUNTING_TEST_EMAIL
const password = process.env.ACCOUNTING_TEST_PASSWORD
if (!email || !password) throw new Error('Set ACCOUNTING_TEST_EMAIL and ACCOUNTING_TEST_PASSWORD for a synthetic local account.')
const out = 'test-artifacts/accounting-payables'
mkdirSync(out, { recursive: true })
const viewport = { width: 1600, height: 1000 }
const parts = {
  heading: 'h2',
  mainTab: 'button:has-text("Purchase Invoices")',
  statusTab: 'button:has-text("All Invoices")',
  filters: 'h3:has-text("Advanced Filters")',
  table: 'table',
  tableHeader: 'table thead th',
  firstRow: 'table tbody tr',
  createButton: 'button:has-text("Create Purchase Invoice")',
}
const styles = ['fontSize', 'lineHeight', 'letterSpacing', 'fontWeight', 'textTransform']

async function login(browser) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('input[type=email], input[name=email], input#email').first().type(email)
  await page.locator('input[type=password]').first().type(password)
  await page.locator('button[type=submit]').first().click()
  await page.waitForURL('**/home', { waitUntil: 'domcontentloaded', timeout: 45000 })
  const state = await context.storageState()
  await context.close()
  return state
}

async function route(browser, storageState, pathname, restored) {
  const context = await browser.newContext({ viewport, storageState, acceptDownloads: true })
  const page = await context.newPage()
  const requests = []
  page.on('request', request => { if (/purchase-invoices|cashbook\/vendors|pending-review/.test(request.url())) requests.push(request.url().replace(/\?.*/, '')) })
  await page.goto(`${base}${pathname}`, { waitUntil: 'domcontentloaded' })
  const mount = restored ? page.locator('#ac52LegacyPayablesSlot') : page.locator('[data-payables-root]')
  await mount.waitFor({ state: 'visible', timeout: 45000 })
  await mount.getByRole('heading', { name: 'Purchases' }).waitFor({ timeout: 30000 })
  await mount.locator('table thead th').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(7000)
  return { context, page, mount, requests, restored }
}

async function metrics(session) {
  const values = {}
  const rootRect = await session.mount.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })
  for (const [name, selector] of Object.entries(parts)) {
    const locator = session.mount.locator(selector).first()
    if (!await locator.count()) { values[name] = null; continue }
    values[name] = await locator.evaluate((element, props) => {
      const r = element.getBoundingClientRect(), s = getComputedStyle(element)
      return { x: r.x, y: r.y, width: r.width, height: r.height, ...Object.fromEntries(props.map(prop => [prop, s[prop]])) }
    }, styles)
  }
  return { rootRect, values }
}

async function cssomLeakSweep(session) {
  return session.page.evaluate(() => {
    const mount = document.querySelector('#ac52LegacyPayablesSlot')
    if (!mount) return []
    const hits = []
    const inspect = rules => {
      for (const rule of Array.from(rules || [])) {
        if (rule.cssRules) { inspect(rule.cssRules); continue }
        if (!rule.selectorText?.includes('.accounting-v52-root')) continue
        for (const selector of rule.selectorText.split(',')) {
          const at = selector.indexOf('.accounting-v52-root')
          if (at < 0) continue
          const part = selector.slice(at + '.accounting-v52-root'.length).trim()
          if (!part) continue
          try { if (mount.querySelector(part)) hits.push(selector.trim()) } catch { /* pseudo-element or invalid split */ }
        }
      }
    }
    for (const sheet of Array.from(document.styleSheets)) {
      try { inspect(sheet.cssRules) } catch { /* cross-origin sheet */ }
    }
    return [...new Set(hits)]
  })
}

async function tabInventory(session) {
  const tabs = ['All Invoices', 'Drafts', 'Posted', 'Pending Payment', 'Paid']
  const result = {}
  for (const tab of tabs) {
    await session.mount.getByRole('button', { name: tab, exact: true }).click()
    if (session.restored) await session.mount.getByRole('group', { name: /Export/ }).waitFor({ state: 'visible', timeout: 30000 })
    else await session.mount.getByRole('button', { name: 'Export', exact: true }).first().waitFor({ state: 'visible', timeout: 30000 })
    await session.page.waitForTimeout(1200)
    result[tab] = {
      headers: await session.mount.locator('table thead th').allTextContents(),
      rows: await session.mount.locator('table tbody tr').count(),
      exportButtons: await session.mount.getByRole('group', { name: /Export/ }).getByRole('button').count(),
      pageControls: await session.mount.getByText(/Showing \d+ to \d+ of \d+ entries/).count(),
    }
  }
  await session.mount.getByRole('button', { name: 'Vendors', exact: true }).click()
  for (const tab of ['All Vendors', 'Pending Approvals']) {
    await session.mount.getByRole('button', { name: tab, exact: true }).click()
    if (tab === 'All Vendors') {
      if (session.restored) await session.mount.getByRole('group', { name: /Export/ }).waitFor({ state: 'visible', timeout: 30000 })
      else await session.mount.getByRole('button', { name: 'Export', exact: true }).first().waitFor({ state: 'visible', timeout: 30000 })
    }
    await session.page.waitForTimeout(1200)
    result[tab] = {
      headers: await session.mount.locator('table thead th').allTextContents(),
      rows: await session.mount.locator('table tbody tr').count(),
      exportButtons: await session.mount.getByRole('group', { name: /Export/ }).getByRole('button').count(),
      cards: await session.mount.locator('div.border-l-4').count(),
    }
  }
  return result
}

const browser = await chromium.launch({ headless: true })
try {
  const state = await login(browser)
  const legacy = await route(browser, state, '/accounting-legacy/payables', false)
  const restored = await route(browser, state, '/accounting/payables', true)
  const before = { legacy: await metrics(legacy), restored: await metrics(restored) }
  const width = before.legacy.rootRect.width
  const widthPin = await restored.page.addStyleTag({ content: `#ac52LegacyPayablesSlot { width:${width}px !important; max-width:none !important; } #ac52LegacyPayablesSlot .al-export { visibility:hidden !important; } #ac52LegacyPayablesSlot [data-payables-new] { display:none !important; }` })
  await legacy.mount.getByRole('button', { name: 'Export', exact: true }).first().evaluate(element => { element.style.visibility = 'hidden' }).catch(() => {})
  await restored.page.waitForTimeout(500)
  const after = { legacy: await metrics(legacy), restored: await metrics(restored) }
  const diff = Object.fromEntries(Object.keys(parts).map(name => [name,
    after.legacy.values[name] && after.restored.values[name]
      ? Object.fromEntries(Object.keys(after.legacy.values[name]).filter(key => after.legacy.values[name][key] !== after.restored.values[name][key]).map(key => [key, [after.legacy.values[name][key], after.restored.values[name][key]]]))
      : [after.legacy.values[name], after.restored.values[name]]]))
  await legacy.mount.screenshot({ path: `${out}/legacy.png`, animations: 'disabled' })
  await restored.mount.locator('[data-payables-root]').screenshot({ path: `${out}/restored-pinned.png`, animations: 'disabled' })
  const styleLeaks = await cssomLeakSweep(restored)
  await widthPin.evaluate(element => element.remove())
  await legacy.mount.getByRole('button', { name: 'Export', exact: true, includeHidden: true }).first().evaluate(element => { element.style.visibility = '' }).catch(() => {})
  const inventories = { legacy: await tabInventory(legacy), restored: await tabInventory(restored) }
  const host = await restored.page.evaluate(() => {
    const slot = document.querySelector('#ac52LegacyPayablesSlot')
    const host = slot?.querySelector('[data-ac52-legacy-host]')
    window.__payablesHost = host
    return { count: slot?.querySelectorAll('[data-ac52-legacy-host]').length || 0, id: host?.getAttribute('data-ac52-legacy-host') || '' }
  })
  await restored.page.waitForTimeout(7000)
  host.stable = await restored.page.evaluate(() => window.__payablesHost === document.querySelector('#ac52LegacyPayablesSlot [data-ac52-legacy-host]'))
  const report = { viewport, before, after, diff, styleLeaks, inventories, host, requestCounts: { legacy: legacy.requests.length, restored: restored.requests.length } }
  writeFileSync(`${out}/parity.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ width: { legacy: before.legacy.rootRect.width, restored: before.restored.rootRect.width }, diff, styleLeakCount: styleLeaks.length, host, inventories }, null, 2))
  await legacy.context.close()
  await restored.context.close()
} finally { await browser.close() }
