import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
const email = process.env.ACCOUNTING_TEST_EMAIL, password = process.env.ACCOUNTING_TEST_PASSWORD
if (!email || !password) throw new Error('Set local synthetic test credentials in ACCOUNTING_TEST_EMAIL and ACCOUNTING_TEST_PASSWORD.')
const out = 'test-artifacts/accounting-receivables'
mkdirSync(out, { recursive: true })
const result = { invoice: {}, customer: {}, pagination: {}, actions: {}, errors: [] }
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport:{ width:1600, height:1000 }, acceptDownloads:true })
const page = await context.newPage()
if (process.env.ACCOUNTING_PROXY_PORT) {
  await page.route('http://localhost:3001/**', async route => {
    const target = new URL(route.request().url()); target.port = process.env.ACCOUNTING_PROXY_PORT
    const response = await route.fetch({ url:target.href, timeout:120000 })
    await route.fulfill({ response })
  })
}
if (process.env.ACCOUNTING_API_PROXY_PORT) {
  await page.route('http://127.0.0.1:3019/**', async route => {
    if (route.request().url().includes('/socket.io/')) return route.continue()
    if (!/\/api\/(auth|accounting|cashbook|roles)\//.test(route.request().url())) return route.continue()
    const target = new URL(route.request().url()); target.port = process.env.ACCOUNTING_API_PROXY_PORT
    try {
      const response = await route.fetch({ url:target.href, timeout:15000 })
      await route.fulfill({ response })
    } catch { await route.fulfill({ status:503, contentType:'application/json', body:'{"success":false,"message":"Local test API unavailable"}' }).catch(() => {}) }
  })
}
page.on('pageerror', e => result.errors.push(e.message))
page.on('requestfailed', r => result.errors.push({ request:r.url(), failure:r.failure()?.errorText }))
try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(`${base}/login`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(1500)
    await page.locator('input[type=email], input[name=email], input#email').first().type(email)
    await page.locator('input[type=password]').first().type(password)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(url => !url.pathname.endsWith('/login'), { waitUntil:'domcontentloaded', timeout:15000 }).catch(() => {})
    if (!page.url().endsWith('/login')) break
    result.errors.push({ at:'login', attempt, message:(await page.locator('body').innerText()).slice(0,450) })
  }
  if (page.url().endsWith('/login')) throw new Error('Local login did not complete after three attempts')
  await page.goto(`${base}/accounting/receivables`, { waitUntil:'domcontentloaded' })
  const mount = page.locator('#ac52LegacyReceivablesSlot')
  await mount.getByRole('button', { name:'Sales Invoices', exact:true }).waitFor({ timeout:45000 })
  await mount.locator('table tbody tr').first().waitFor({ timeout:30000 })
  const first = mount.locator('table tbody tr').first()
  const customerName = await first.locator('td').nth(2).locator('span[title]').first().getAttribute('title')
  const currency = 'USD'
  result.actions.invoiceMenu = await first.getByRole('button').count()
  result.actions.rowColor = await first.evaluate(el => getComputedStyle(el).backgroundColor)
  await first.hover()
  result.actions.rowHoverColor = await first.evaluate(el => getComputedStyle(el).backgroundColor)
  await first.click()
  await page.getByRole('dialog').waitFor()
  result.actions.invoiceDrawer = true
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state:'hidden' })
  await mount.getByRole('button', { name:'Create Invoice' }).click()
  await page.getByRole('dialog').waitFor()
  result.actions.createInvoiceModal = true
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state:'hidden' })
  await first.locator('td').last().getByRole('button').click()
  result.actions.invoiceMenuItems = await page.getByRole('menuitem').allTextContents()
  await page.keyboard.press('Escape')
  await mount.getByRole('button', { name:'Bulk Upload' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  const [template] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name:'Download template' }).click()])
  await template.saveAs(`${out}/invoice-template.csv`)
  result.invoice.template = template.suggestedFilename()
  const input = dialog.locator('input[type=file]')
  const header = 'Invoice Ref,Customer,Invoice Date,Currency,Description,Item Description,Quantity,Unit Price,Taxable\n'
  await input.setInputFiles({ name:'invalid.csv', mimeType:'text/csv', buffer:Buffer.from(header+'INV-UAT,Unknown Customer,2026-01-15,USD,Service,Consulting,1,100,No\n') })
  await dialog.getByText('Customer "Unknown Customer" was not found.').waitFor()
  result.invoice.invalidBlocked = await dialog.getByRole('button', { name:/Import \d/ }).isDisabled()
  await input.setInputFiles({ name:'valid.csv', mimeType:'text/csv', buffer:Buffer.from(header+`INV-UAT,${customerName},2026-01-15,${currency},Service,Consulting,1,100,No\n`) })
  await dialog.getByText('1 of 1 valid').waitFor({ timeout:10000 }).catch(async e => { result.errors.push({ at:'invoice-preview', text:(await dialog.innerText()).slice(0,1200) }); throw e })
  let invoicePayload = null
  await page.route('**/api/accounting/invoices', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    invoicePayload = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({ status:201, contentType:'application/json', body:JSON.stringify({ success:true, data:{ id:'synthetic-import' } }) })
  })
  await dialog.getByRole('button', { name:'Import 1' }).click()
  await dialog.getByText('INV-UAT: Created as draft').waitFor()
  result.invoice.validPayload = invoicePayload && { customerId:!!invoicePayload.customerId, currencyId:!!invoicePayload.currencyId,
    invoiceDate:invoicePayload.invoiceDate, amount:invoicePayload.amount, itemCount:invoicePayload.items?.length, isTaxable:invoicePayload.isTaxable }
  await dialog.getByRole('button', { name:'Done' }).click()

  await mount.getByRole('button', { name:'Credit Notes', exact:true }).click()
  await mount.locator('table tbody tr').first().waitFor({ timeout:30000 })
  result.actions.creditMenu = await mount.locator('table tbody tr').first().getByRole('button').count()
  await mount.locator('table tbody tr').first().click()
  await page.getByRole('dialog').waitFor()
  result.actions.creditDrawer = true
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state:'hidden' })
  await mount.getByRole('button', { name:'Customers', exact:true }).click()
  await mount.locator('table tbody tr').first().waitFor({ timeout:30000 })
  await mount.locator('table tbody tr').first().click()
  await page.getByRole('dialog').waitFor()
  result.actions.customerDrawer = true
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state:'hidden' })
  await mount.getByRole('button', { name:'Bulk Upload' }).click()
  const customerDialog = page.getByRole('dialog')
  const [customerTemplate] = await Promise.all([page.waitForEvent('download'), customerDialog.getByRole('button', { name:'Download template' }).click()])
  await customerTemplate.saveAs(`${out}/customer-template.csv`)
  result.customer.template = customerTemplate.suggestedFilename()
  const customerInput = customerDialog.locator('input[type=file]')
  const customerHeader = 'Name,Tax Number,Contact Person,Email,Phone,Address,Payment Terms\n'
  await customerInput.setInputFiles({ name:'invalid-customers.csv', mimeType:'text/csv', buffer:Buffer.from(customerHeader+'UAT Customer,,,,,,\nUAT Customer,,X,not-email,,,30\n') })
  await customerDialog.getByText('Email is invalid.').waitFor()
  result.customer.invalidBlocked = await customerDialog.getByRole('button', { name:/Import \d/ }).isDisabled()
  await customerInput.setInputFiles({ name:'valid-customers.csv', mimeType:'text/csv', buffer:Buffer.from(customerHeader+'UAT Synthetic Import,,,uat@example.test,,,30\n') })
  await customerDialog.getByText('1 of 1 valid').waitFor()
  let customerPayload = null
  await page.route('**/api/accounting/customers', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    customerPayload = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({ status:201, contentType:'application/json', body:JSON.stringify({ success:true, data:{ id:'synthetic-customer' } }) })
  })
  await customerDialog.getByRole('button', { name:'Import 1' }).click()
  await customerDialog.getByText('UAT Synthetic Import: Created').waitFor()
  result.customer.validPayload = customerPayload
  await customerDialog.getByRole('button', { name:'Done' }).click()
  result.pagination.customersPage1 = await mount.getByText(/Showing 1 to 10 of/).count()
  await mount.getByRole('button', { name:'2', exact:true }).click()
  await page.waitForTimeout(1000)
  result.pagination.customersPage2 = await mount.getByText(/Showing 11 to/).count()
  let creditFixtureCalls = 0
  await page.route('**/api/accounting/credit-notes?**', async route => {
    if (route.request().method() !== 'GET') return route.continue()
    const original = new URL(route.request().url()), target = new URL(original)
    target.port = process.env.ACCOUNTING_API_PROXY_PORT || target.port
    target.searchParams.set('page', '1')
    const response = await route.fetch({ url:target.href })
    const body = await response.json()
    const source = body.data?.creditNotes || []
    if (!source.length) return route.fulfill({ response })
    const all = Array.from({ length:23 }, (_, i) => ({ ...source[i % source.length], id:`fixture-credit-${i + 1}`, creditNoteNumber:`CN-FIXTURE-${String(i + 1).padStart(2,'0')}` }))
    const pageNumber = Number(original.searchParams.get('page') || 1), limit = Number(original.searchParams.get('limit') || 10)
    creditFixtureCalls++
    await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ ...body, data:{ ...body.data, creditNotes:all.slice((pageNumber-1)*limit,pageNumber*limit), total:23, page:pageNumber, totalPages:Math.ceil(23/limit) } }) })
  })
  await mount.getByRole('button', { name:'Credit Notes', exact:true }).click()
  await mount.getByText('Showing 1 to 10 of 23 entries').waitFor({ timeout:30000 })
  await page.evaluate(() => { window.__creditFixtureContent = document.querySelector('[data-receivables-root]') })
  await mount.getByRole('button', { name:'2', exact:true }).click()
  await mount.getByText('Showing 11 to 20 of 23 entries').waitFor({ timeout:10000 }).catch(async e => { result.pagination.creditFixtureDebug = { calls:creditFixtureCalls, url:page.url(), stableContent:await page.evaluate(() => window.__creditFixtureContent === document.querySelector('[data-receivables-root]')), text:(await mount.innerText()).slice(-1000) }; throw e })
  result.pagination.creditFixture = { calls:creditFixtureCalls, page2Rows:await mount.locator('table tbody tr').count(), page2Label:true }
  await mount.getByRole('button', { name:'Sales Invoices', exact:true }).click()
  await mount.getByRole('link', { name:'Receipts & ageing' }).click()
  await page.waitForURL('**/accounting/receivables/workflows', { timeout:30000 })
  await page.locator('[data-al="ar-tab"]').first().waitFor({ timeout:30000 })
  result.actions.workflowsRoute = page.url().endsWith('/accounting/receivables/workflows')
  result.actions.workflowsTabs = await page.locator('[data-al="ar-tab"]').allTextContents()
} finally {
  writeFileSync(`${out}/interactions.json`, JSON.stringify(result,null,2))
  await page.unrouteAll({ behavior:'ignoreErrors' })
  await browser.close()
}
console.log(JSON.stringify(result,null,2))
