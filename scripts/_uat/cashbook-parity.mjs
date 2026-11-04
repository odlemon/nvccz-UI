import { chromium } from 'playwright'

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
const email = process.env.ACCOUNTING_TEST_EMAIL || 'admin@nts.com'
const password = process.env.ACCOUNTING_TEST_PASSWORD || 'admin123'
const viewport = { width: 1600, height: 1000 }
const tabs = ['Single Entries', 'Batch', 'Cashbook Transfers', 'Entry Types', 'Contra Entries']
const cssProps = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor', 'padding', 'borderRadius', 'height']

async function openRoute(browser, route, restored) {
  const context = await browser.newContext({ viewport, acceptDownloads: true })
  const page = await context.newPage()
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('input[type=email], input[name=email], input#email').first().type(email)
  await page.locator('input[type=password]').first().type(password)
  await page.locator('button[type=submit]').first().click()
  await page.waitForURL('**/home', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  const root = restored
    ? page.locator('#ac52LegacyCashSlot')
    : page.locator('div.space-y-6.p-6').filter({ has: page.getByRole('heading', { name: 'Cashbook Management' }) }).first()
  await root.waitFor({ state: 'visible', timeout: 45000 })
  await root.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(7000)
  return { context, page, root }
}

async function snapshot(session, collectTabs = true) {
  const { page, root } = session
  await root.getByRole('button', { name: 'Single Entries', exact: true }).click()
  await root.locator('table').first().waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(7000)
  const result = { width: await root.evaluate(el => el.getBoundingClientRect().width), tabs: {}, styles: {} }
  const style = async locator => locator.first().evaluate((el, props) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(props.map(p => [p, s[p]]))
  }, cssProps)
  result.styles.title = await style(root.getByRole('heading', { name: 'Cashbook Management' }))
  result.styles.tab = await style(root.getByRole('button', { name: 'Single Entries' }))
  result.styles.table = await style(root.locator('table').first())
  for (const name of collectTabs ? tabs : []) {
    console.error(`Checking ${name}`)
    await root.getByRole('button', { name, exact: true }).click()
    await root.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(7000)
    result.tabs[name] = {
      headers: await root.locator('table thead th').allTextContents(),
      rows: await root.locator('table tbody tr').count(),
      firstRow: ((await root.locator('table tbody tr').count() ? await root.locator('table tbody tr').first().textContent() : '') || '').replace(/\s+/g, ' ').trim(),
      pager: await root.getByText(/Showing \d+ (?:to|–) \d+ of \d+/).count(),
      exports: await root.getByRole('group', { name: new RegExp('Export') }).count(),
    }
  }
  return result
}

const browser = await chromium.launch({ headless: true })
try {
  const legacy = await openRoute(browser, '/accounting-legacy/cash-book', false)
  const restored = await openRoute(browser, '/accounting/cash-book', true)
  const legacyUnpinned = await snapshot(legacy)
  const restoredUnpinned = await snapshot(restored)
  await restored.page.addStyleTag({ content: `#ac52LegacyCashSlot { width: ${legacyUnpinned.width}px !important; max-width: none !important; }` })
  await restored.page.waitForTimeout(500)
  const restoredPinned = await snapshot(restored, false)
  const differences = Object.fromEntries(Object.keys(legacyUnpinned.styles).map(key => [key,
    Object.fromEntries(cssProps.filter(prop => legacyUnpinned.styles[key][prop] !== restoredPinned.styles[key][prop])
      .map(prop => [prop, [legacyUnpinned.styles[key][prop], restoredPinned.styles[key][prop]]]))]))
  console.log(JSON.stringify({ legacy: legacyUnpinned, restoredUnpinned, restoredPinned, styleDifferencesAfterWidthPin: differences }, null, 2))
  await legacy.context.close()
  await restored.context.close()
} finally {
  await browser.close()
}
