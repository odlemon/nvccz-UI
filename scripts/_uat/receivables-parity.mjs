import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const base = process.env.ACCOUNTING_BASE_URL || 'http://localhost:3001'
const email = process.env.ACCOUNTING_TEST_EMAIL
const password = process.env.ACCOUNTING_TEST_PASSWORD
if (!email || !password) throw new Error('Set ACCOUNTING_TEST_EMAIL and ACCOUNTING_TEST_PASSWORD for a synthetic local account.')
const out = 'test-artifacts/accounting-receivables'
mkdirSync(out, { recursive: true })
const viewport = { width: 1600, height: 1000 }
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport, acceptDownloads: true })
const page = await context.newPage()
if (process.env.ACCOUNTING_API_PROXY_PORT) {
  await page.route('http://127.0.0.1:3019/**', async route => {
    if (route.request().url().includes('/socket.io/')) return route.continue()
    const target = new URL(route.request().url()); target.port = process.env.ACCOUNTING_API_PROXY_PORT
    const response = await route.fetch({ url:target.href })
    await route.fulfill({ response })
  })
}
const result = { routes: {}, tabs: {}, downloads: [], errors: [] }
page.on('pageerror', e => result.errors.push(e.message))
page.on('requestfailed', r => result.errors.push({ request:r.url(), failure:r.failure()?.errorText }))
try {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('input[type=email], input[name=email], input#email').first().type(email)
  await page.locator('input[type=password]').first().type(password)
  await page.locator('button[type=submit]').first().click()
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(async error => {
    result.errors.push({ route:'login', url:page.url(), body:(await page.locator('body').innerText()).slice(0,1000), error:error.message })
    throw error
  })
  for (const [name, path, selector] of [['legacy', '/accounting-legacy/invoices', '[data-receivables-root]'], ['restored', '/accounting/receivables', '#ac52LegacyReceivablesSlot']]) {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
    const mount = page.locator(selector)
    await mount.waitFor({ state: 'visible', timeout: 45000 }).catch(async error => {
      result.errors.push({ route:name, url:page.url(), body:(await page.locator('body').innerText()).slice(0,1500), error:error.message })
      await page.screenshot({ path: `${out}/${name}-failure.png` })
      throw error
    })
    await mount.getByRole('button', { name: 'Sales Invoices', exact: true }).waitFor({ timeout: 45000 })
    await mount.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(7000)
    result.routes[name] = await page.evaluate(sel => {
      const mount = document.querySelector(sel)
      const measure = s => {
        const el = mount?.querySelector(s); if (!el) return null
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return { x:r.x,y:r.y,width:r.width,height:r.height,fontSize:cs.fontSize,lineHeight:cs.lineHeight,letterSpacing:cs.letterSpacing,fontWeight:cs.fontWeight,textTransform:cs.textTransform }
      }
      const rect = mount?.getBoundingClientRect()
      const shell = document.querySelector('.accounting-v52-root')?.getBoundingClientRect()
      const work = document.querySelector('.accounting-v52-root #main')?.getBoundingClientRect()
      return { component: !!mount?.querySelector('.space-y-6'), hostCount: document.querySelectorAll('[data-ac52-legacy-host="ac52LegacyReceivablesSlot"]').length,
        mount: rect && {x:rect.x,y:rect.y,width:rect.width,height:rect.height}, shellWidth:shell?.width, workArea: work && {x:work.x,y:work.y,width:work.width},
        mainTab:measure('button'), table:measure('table'), header:measure('table th'), firstRow:measure('table tbody tr'),
        buttons:[...mount.querySelectorAll('button')].map(x=>x.textContent?.trim()).filter(Boolean).slice(0,40) }
    }, selector)
    await mount.screenshot({ path: `${out}/${name}.png` })
    if (name !== 'restored') continue
    await page.evaluate(() => { window.__receivablesAuditHost = document.querySelector('[data-ac52-legacy-host="ac52LegacyReceivablesSlot"]'); window.__receivablesAuditContent = document.querySelector('[data-receivables-root]') })
    result.routes.restored.cssomLeaks = await page.evaluate(() => {
      const mount = document.querySelector('#ac52LegacyReceivablesSlot'), hits = []
      const inspect = rules => { for (const rule of Array.from(rules || [])) {
        if (rule.cssRules) { inspect(rule.cssRules); continue }
        if (!rule.selectorText?.includes('.accounting-v52-root')) continue
        for (const selector of rule.selectorText.split(',')) {
          const at = selector.indexOf('.accounting-v52-root'); if (at < 0) continue
          const part = selector.slice(at + '.accounting-v52-root'.length).trim(); if (!part) continue
          try { if (mount?.querySelector(part)) hits.push(selector.trim()) } catch {}
        }
      }}
      for (const sheet of Array.from(document.styleSheets)) try { inspect(sheet.cssRules) } catch {}
      return [...new Set(hits)]
    })
    for (const main of ['Sales Invoices', 'Credit Notes', 'Customers']) {
      await mount.getByRole('button', { name: main, exact: true }).click()
      await page.waitForTimeout(1200)
      result.tabs[main] = { rows: await mount.locator('table tbody tr').count(), headers: await mount.locator('table th').allTextContents(), exports: await mount.getByRole('group', { name:/Export/ }).getByRole('button').count() }
      if (main === 'Sales Invoices') for (const sub of ['All Invoices','Drafts','Sent','Paid','Void']) {
        await mount.getByRole('button', { name: sub, exact: true }).click()
        await page.waitForTimeout(250)
        result.tabs[`Sales/${sub}`] = await mount.locator('table tbody tr').count()
      }
      if (main === 'Credit Notes') for (const sub of ['All Credit Notes','Drafts','Sent','Applied']) {
        await mount.getByRole('button', { name: sub, exact: true }).click()
        await page.waitForTimeout(250)
        result.tabs[`Credit/${sub}`] = await mount.locator('table tbody tr').count()
      }
      const group = mount.getByRole('group', { name:/Export/ })
      for (const format of ['PDF','Excel','CSV']) {
        const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), group.getByRole('button', { name:`Export as ${format}` }).click()])
        const path = `${out}/${main.toLowerCase().replaceAll(' ','-')}-${format.toLowerCase()}.${format === 'PDF' ? 'pdf' : format === 'Excel' ? 'xlsx' : 'csv'}`
        await download.saveAs(path)
        result.downloads.push({ main, format, name:download.suggestedFilename(), path })
      }
    }
    result.routes.restored.hostCountAfterTabs = await page.locator('[data-ac52-legacy-host="ac52LegacyReceivablesSlot"]').count()
    result.routes.restored.sameHostAfterTabs = await page.evaluate(() => window.__receivablesAuditHost === document.querySelector('[data-ac52-legacy-host="ac52LegacyReceivablesSlot"]'))
    result.routes.restored.sameContentAfterTabs = await page.evaluate(() => window.__receivablesAuditContent === document.querySelector('[data-receivables-root]'))
  }
} finally {
  writeFileSync(`${out}/audit.json`, JSON.stringify(result,null,2))
  await page.unrouteAll({ behavior:'ignoreErrors' })
  await browser.close()
}
console.log(JSON.stringify(result,null,2))
