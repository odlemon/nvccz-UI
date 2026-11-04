import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
const email = process.env.ACCOUNTING_TEST_EMAIL
const password = process.env.ACCOUNTING_TEST_PASSWORD
if (!email || !password) throw new Error('Set ACCOUNTING_TEST_EMAIL and ACCOUNTING_TEST_PASSWORD for a synthetic local account.')
const out = 'test-artifacts/accounting-payables'
mkdirSync(out, { recursive: true })
const report = { checks: {}, downloads: [], errors: [] }
const check = async (name, fn) => { try { report.checks[name] = await fn() } catch (error) { report.errors.push(`${name}: ${error.message.split('\n')[0]}`); report.checks[name] = false } console.log(`Checked: ${name}: ${JSON.stringify(report.checks[name])}`) }

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true })
const page = await context.newPage()
try {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('input[type=email], input[name=email], input#email').first().type(email)
  await page.locator('input[type=password]').first().type(password)
  await page.locator('button[type=submit]').first().click()
  await page.waitForURL('**/home', { waitUntil: 'domcontentloaded', timeout: 45000 })

  if (!process.env.PAYABLES_FIXTURE_ONLY) {
  const delayInvoice = async route => { await new Promise(resolve => setTimeout(resolve, 900)); await route.continue() }
  await page.route('**/accounting/purchase-invoices?*', delayInvoice)
  await page.goto(`${base}/accounting/payables`, { waitUntil: 'domcontentloaded' })
  const root = page.locator('#ac52LegacyPayablesSlot')
  await root.getByRole('heading', { name: 'Purchases' }).waitFor({ timeout: 45000 })
  await check('invoice skeleton during fetch', async () => { await root.locator('.animate-pulse').first().waitFor({ state: 'visible', timeout: 3000 }); return true })
  await root.locator('[title="Click to view invoice details"]').first().waitFor({ state: 'visible', timeout: 30000 })
  await page.unroute('**/accounting/purchase-invoices?*', delayInvoice)
  await root.getByRole('button', { name: 'Export as PDF' }).waitFor({ timeout: 30000 })
  await page.waitForTimeout(7000)

  await check('advanced filters expand and collapse', async () => {
    await root.getByText('Advanced Filters').click()
    const expanded = await root.getByRole('button', { name: 'Clear Filters' }).isVisible()
    await root.getByText('Advanced Filters').click()
    return expanded && !await root.getByRole('button', { name: 'Clear Filters' }).isVisible()
  })
  await check('status tabs switch', async () => {
    for (const name of ['Drafts', 'Posted', 'Pending Payment', 'Paid', 'All Invoices']) await root.getByRole('button', { name, exact: true }).click()
    return await root.getByRole('button', { name: 'All Invoices', exact: true }).getAttribute('class').then(value => value.includes('border-orange-600'))
  })
  await root.getByRole('button', { name: 'Export as PDF' }).waitFor({ timeout: 30000 })
  await check('main tab hover state', async () => {
    const tab = root.getByRole('button', { name: 'Vendors', exact: true })
    const before = await tab.evaluate(el => getComputedStyle(el).color)
    await tab.hover()
    const after = await tab.evaluate(el => getComputedStyle(el).color)
    return before !== after
  })
  await check('create invoice modal opens and closes', async () => {
    await root.getByRole('button', { name: 'Create Purchase Invoice' }).click()
    await page.getByRole('dialog').getByText('Create Purchase Invoice').first().waitFor({ timeout: 10000 })
    await page.keyboard.press('Escape')
    return true
  })
  await check('invoice detail drawer opens', async () => {
    const link = root.locator('[title="Click to view invoice details"]').first()
    if (!await link.count()) return 'No invoice row available'
    await link.click()
    await page.getByRole('dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.keyboard.press('Escape')
    return true
  })
  await check('draft invoice Edit/Delete/Submit dialogs', async () => {
    await root.getByRole('button', { name: 'Drafts', exact: true }).click()
    await page.waitForTimeout(1000)
    const link = root.locator('[title="Click to view invoice details"]').first()
    if (!await link.count()) return 'No draft invoice row available'
    const actions = {}
    for (const action of ['Edit', 'Delete', 'Submit']) {
      await root.locator('[title="Click to view invoice details"]').first().click()
      await page.getByRole('dialog').first().getByRole('button', { name: action, exact: true }).click()
      await page.getByText(`${action} Purchase Invoice`, { exact: true }).waitFor({ state: 'visible', timeout: 10000 })
      actions[action.toLowerCase()] = true
      await page.goto(`${base}/accounting/payables`, { waitUntil: 'domcontentloaded' })
      await root.getByRole('button', { name: 'Drafts', exact: true }).click()
      await root.locator('[title="Click to view invoice details"]').first().waitFor({ timeout: 30000 })
    }
    return actions
  })
  await page.goto(`${base}/accounting/payables`, { waitUntil: 'domcontentloaded' })
  await root.getByRole('button', { name: 'Bulk Upload' }).waitFor({ timeout: 30000 })
  await check('invoice bulk upload preview and disabled import', async () => {
    await root.getByRole('button', { name: 'Bulk Upload' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Bulk Upload Purchase Invoices' })
    await dialog.waitFor({ state: 'visible', timeout: 10000 })
    const [template] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Download template' }).click()])
    report.downloads.push({ tab: 'invoice-template', name: template.suggestedFilename() })
    await dialog.locator('input[type=file]').setInputFiles({ name: 'invalid-invoices.csv', mimeType: 'text/csv', buffer: Buffer.from('Invoice Ref,Vendor\nBILL-001,Missing Vendor\n') })
    await dialog.getByText(/Missing columns?/).waitFor({ timeout: 10000 })
    const disabled = await dialog.getByRole('button', { name: /^Import 0 invoices$/ }).isDisabled()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    return disabled
  })

  for (const label of ['PDF', 'Excel', 'CSV']) await check(`invoice ${label} download`, async () => {
    const promise = page.waitForEvent('download', { timeout: 45000 })
    await root.getByRole('button', { name: `Export as ${label}` }).click()
    const download = await promise
    const path = `${out}/invoice-export.${label === 'Excel' ? 'xlsx' : label.toLowerCase()}`
    await download.saveAs(path)
    report.downloads.push({ tab: 'invoices', format: label, name: download.suggestedFilename(), path })
    return true
  })

  await root.getByRole('button', { name: 'Vendors', exact: true }).click()
  await root.getByRole('button', { name: 'Export as PDF' }).waitFor({ timeout: 30000 })
  await check('vendor pager changes page', async () => {
    const label = root.getByText(/Showing \d+ to \d+ of \d+ entries/).first()
    const before = await label.textContent()
    await root.getByRole('button', { name: '2', exact: true }).click()
    const after = await label.textContent()
    await root.getByRole('button', { name: '1', exact: true }).click()
    return before !== after
  })
  await check('vendor action menu opens', async () => {
    await root.locator('table tbody tr').first().locator('button').last().click()
    const menu = page.getByRole('menu')
    await menu.waitFor({ state: 'visible', timeout: 10000 })
    const labels = await menu.getByRole('menuitem').allTextContents()
    await page.keyboard.press('Escape')
    return labels
  })
  await page.goto(`${base}/accounting/payables`, { waitUntil: 'domcontentloaded' })
  await root.getByRole('button', { name: 'Vendors', exact: true }).click()
  await root.locator('table tbody tr button').first().waitFor({ timeout: 30000 })
  await check('vendor View/Edit/Delete dialogs', async () => {
    const actions = {}
    for (const action of ['View', 'Edit', 'Delete']) {
      console.log(`Vendor action: ${action}`)
      await root.locator('table tbody tr').first().locator('button').last().click()
      console.log(`Vendor menu opened: ${action}`)
      await page.getByRole('menuitem', { name: action, exact: true }).click()
      console.log(`Vendor menu item clicked: ${action}`)
      actions[action] = action === 'Delete'
        ? await page.getByText('Delete Vendor', { exact: true }).isVisible()
        : await page.getByRole('dialog').count() > 0
      await page.goto(`${base}/accounting/payables`, { waitUntil: 'domcontentloaded' })
      await root.getByRole('button', { name: 'Vendors', exact: true }).click()
      await root.locator('table tbody tr button').first().waitFor({ timeout: 30000 })
    }
    return actions
  })
  await check('vendor bulk upload preview and disabled import', async () => {
    await root.getByRole('button', { name: 'Bulk Upload' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Bulk Upload Vendors' })
    await dialog.waitFor({ state: 'visible', timeout: 10000 })
    const [template] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Download template' }).click()])
    report.downloads.push({ tab: 'vendor-template', name: template.suggestedFilename() })
    await dialog.locator('input[type=file]').setInputFiles({ name: 'invalid-vendors.csv', mimeType: 'text/csv', buffer: Buffer.from('Name,Email\nTest Vendor,invalid-email\n') })
    await dialog.getByText('Email format is invalid.').waitFor({ timeout: 10000 })
    const disabled = await dialog.getByRole('button', { name: /^Import 0 vendors$/ }).isDisabled()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    return disabled
  })
  for (const label of ['PDF', 'Excel', 'CSV']) await check(`vendor ${label} download`, async () => {
    const promise = page.waitForEvent('download', { timeout: 45000 })
    await root.getByRole('button', { name: `Export as ${label}` }).click()
    const download = await promise
    const path = `${out}/vendor-export.${label === 'Excel' ? 'xlsx' : label.toLowerCase()}`
    await download.saveAs(path)
    report.downloads.push({ tab: 'vendors', format: label, name: download.suggestedFilename(), path })
    return true
  })
  await check('pending approvals tab opens', async () => {
    await root.getByRole('button', { name: 'Pending Approvals', exact: true }).click()
    await root.getByRole('button', { name: 'Export as PDF' }).waitFor({ timeout: 30000 })
    return true
  })
  }

  await check('invoice backend pagination and page size', async () => {
    const fixturePage = await context.newPage()
    let fixtureSample
    await fixturePage.route('**/accounting/purchase-invoices?*', async route => {
      const requestUrl = new URL(route.request().url())
      if (!report.fixtureRequests) report.fixtureRequests = []
      report.fixtureRequests.push(requestUrl.pathname + requestUrl.search)
      const currentPage = Number(requestUrl.searchParams.get('page') || 1)
      const limit = Number(requestUrl.searchParams.get('limit') || 10)
      const original = await route.fetch()
      const body = await original.json()
      const sample = body.data?.invoices?.[0] || fixtureSample
      if (sample) fixtureSample = sample
      if (!report.fixture) report.fixture = { keys: Object.keys(body), dataKeys: Object.keys(body.data || {}), sample: Boolean(sample), requestUrl: requestUrl.pathname + requestUrl.search }
      if (!sample) { await route.fulfill({ response: original }); return }
      const all = Array.from({ length: 23 }, (_, i) => ({ ...sample, id: `page-fixture-${i + 1}`, invoiceNumber: `PAGE-FIXTURE-${String(i + 1).padStart(2, '0')}` }))
      await route.fulfill({ response: original, json: { ...body, data: { ...body.data, invoices: all.slice((currentPage - 1) * limit, currentPage * limit), page: currentPage, total: all.length, totalPages: Math.ceil(all.length / limit) } } })
    })
    await fixturePage.goto(`${base}/accounting/payables`, { waitUntil: 'domcontentloaded' })
    const fixtureRoot = fixturePage.locator('#ac52LegacyPayablesSlot')
    await fixtureRoot.getByText('PAGE-FIXTURE-01').waitFor({ timeout: 30000 })
    await fixturePage.waitForTimeout(7000)
    console.log('Fixture: initial page loaded')
    await fixtureRoot.getByRole('button', { name: '2', exact: true }).click()
    await fixturePage.waitForTimeout(2000)
    report.fixtureAfterPage2 = (await fixtureRoot.innerText()).slice(-1400)
    await fixtureRoot.getByText('PAGE-FIXTURE-11').waitFor({ timeout: 30000 })
    console.log('Fixture: page two loaded')
    const pageTwo = await fixtureRoot.getByText(/Showing 11 to 20 of 23 entries/).count() > 0
    await fixtureRoot.getByRole('combobox').filter({ hasText: '10' }).last().click()
    await fixturePage.getByRole('option', { name: '20', exact: true }).click()
    await fixtureRoot.getByText(/Showing 1 to 20 of 23 entries/).waitFor({ timeout: 30000 })
    const resized = await fixtureRoot.getByText('PAGE-FIXTURE-20').count() > 0
    await fixturePage.close()
    return { pageTwo, resized }
  })
  writeFileSync(`${out}/interactions.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await context.close(); await browser.close() }
