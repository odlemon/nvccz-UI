import { chromium } from 'playwright'

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true })
const page = await context.newPage()
const result = { tabs: [], downloads: [], searchRequest: false, sortChanged: false, drawerOpened: false }
try {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('input[type=email], input[name=email], input#email').first().type(process.env.ACCOUNTING_TEST_EMAIL || 'admin@nts.com')
  await page.locator('input[type=password]').first().type(process.env.ACCOUNTING_TEST_PASSWORD || 'admin123')
  await page.locator('button[type=submit]').first().click()
  await page.waitForURL('**/home', { waitUntil: 'domcontentloaded', timeout: 45000 })
  page.on('request', request => { if (request.url().includes('/cashbook/entries?') && request.url().includes('search=')) result.searchRequest = true })
  await page.goto(`${base}/accounting/cash-book`, { waitUntil: 'domcontentloaded' })
  const root = page.locator('#ac52LegacyCashSlot')
  await root.getByRole('heading', { name: 'Cashbook Management' }).waitFor({ timeout: 45000 })
  await root.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(7000)
  const before = (await root.locator('table tbody tr').first().textContent() || '').trim()
  await root.locator('table thead th').first().click()
  await page.waitForTimeout(300)
  const after = (await root.locator('table tbody tr').first().textContent() || '').trim()
  result.sortChanged = before !== after
  await root.locator('input[placeholder="Search entries..."]').fill('CASHFLOW-UAT')
  await page.waitForTimeout(1200)
  await root.locator('input[placeholder="Search entries..."]').fill('')
  await page.waitForTimeout(1200)
  const firstRow = root.locator('table tbody tr').first()
  if (await firstRow.count() && !(await firstRow.textContent() || '').includes('No entries found')) {
    await firstRow.click()
    result.drawerOpened = await page.getByRole('dialog').count() > 0
    await page.keyboard.press('Escape')
  }
  for (const tab of ['Single Entries', 'Batch', 'Cashbook Transfers', 'Entry Types', 'Contra Entries']) {
    await root.getByRole('button', { name: tab, exact: true }).click()
    await root.getByRole('group', { name: /Export/ }).waitFor({ state: 'visible', timeout: 30000 })
    const buttons = await root.getByRole('group', { name: /Export/ }).getByRole('button').count()
    result.tabs.push({ tab, exportButtons: buttons })
  }
  await root.getByRole('button', { name: 'Single Entries', exact: true }).click()
  await page.waitForTimeout(1000)
  for (const label of ['PDF', 'Excel', 'CSV']) {
    const promise = page.waitForEvent('download', { timeout: 45000 })
    await root.getByRole('button', { name: `Export as ${label}` }).click()
    const download = await promise
    result.downloads.push({ label, filename: download.suggestedFilename() })
  }
  console.log(JSON.stringify(result, null, 2))
} finally {
  await context.close()
  await browser.close()
}
