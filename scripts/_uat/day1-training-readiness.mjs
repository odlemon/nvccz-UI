import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const FE = process.env.UAT_FE || 'http://localhost:3001'
const API = process.env.UAT_API || 'http://127.0.0.1:3009/api'
if (![FE, API].every(u => ['localhost', '127.0.0.1'].includes(new URL(u).hostname))) throw new Error('Local training targets only')
const password = process.env.UAT_TEST_PASSWORD
if (!password) throw new Error('UAT_TEST_PASSWORD is required')
const out = path.resolve('test-artifacts/day1-training')
await fs.mkdir(out, { recursive: true })
const results = []
const browser = await chromium.launch({ headless: true })
let context, page, pageErrors = []
async function check(name, fn) {
  const start = Date.now()
  try {
    const detail = await fn()
    results.push({ name, passed: true, detail, durationMs: Date.now() - start })
    console.log(`PASS ${name}`)
  } catch (e) {
    let observed = ''
    try {
      observed = (await page.locator('[data-sonner-toast], [role="alert"]').allTextContents()).join(' ').slice(0,600)
      await page.screenshot({path:path.join(out,`${name.replace(/[^a-z0-9-]/gi,'-')}-failure.png`),mask:[page.locator('input')]})
    } catch {}
    results.push({ name, passed: false, error: String(e.message).split('\n').slice(0,3).join(' '), observed, url:page?.url(), durationMs: Date.now() - start })
    console.log(`FAIL ${name}: ${String(e.message).split('\n')[0]}`)
  }
  await fs.writeFile(path.join(out,'results.json'), JSON.stringify({ environment: FE, testedAt: new Date().toISOString(), results }, null, 2))
}
async function login(email) {
  if (context) await context.close()
  context = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
  page = await context.newPage()
  page.setDefaultTimeout(45000)
  pageErrors = []
  page.on('pageerror', e => pageErrors.push(e.message.slice(0,300)))
  await page.goto(`${FE}/login`, { waitUntil:'domcontentloaded', timeout:120000 })
  // The login form rerenders after password state changes. Placeholder locators
  // remain attached to the controlled inputs; generic type selectors previously
  // allowed the email value to be cleared during that rerender.
  await page.getByPlaceholder('name@matanho.com').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  const loginResponse = page.waitForResponse(r => r.url().includes('/auth/login') && r.request().method() === 'POST', { timeout: 60000 })
  await page.getByRole('button',{name:'Sign in',exact:true}).click()
  const response = await loginResponse
  if (!response.ok()) throw new Error(`Login API returned ${response.status()}`)
  await page.waitForURL(u=>u.pathname!=='/login', {timeout:60000, waitUntil:'commit'})
  if(!page.url().endsWith('/home')) throw new Error(`Login redirected to ${new URL(page.url()).pathname}`)
  await page.getByRole('button',{name:'Switch module',exact:true}).waitFor()
}
async function shot(name) { await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true}) }
async function go(route, ready) {
  await page.goto(`${FE}${route}`,{waitUntil:'domcontentloaded',timeout:120000})
  if (ready) await page.getByText(ready,{exact:false}).first().waitFor({timeout:90000})
}
async function toasts() {
  return page.locator('[data-sonner-toast][data-type="error"], [data-sonner-toast][data-type="warning"]').allTextContents()
}
async function homeFrom(route, name) {
  await go(route)
  const home = page.locator('a[href="/home"]')
  await home.first().waitFor({timeout:90000})
  await home.first().click()
  await page.waitForURL('**/home')
  return { returnedHome:true, errors:await toasts() }
}
try {
  await check('admin-login',async()=>{await login('admin@nts.com'); await shot('admin-home'); return {home:page.url(),errors:await toasts()} })
  if(!results[0].passed) throw new Error('Administrator login must pass before workflow checks')
  await check('admin-module-picker',async()=>{
    await page.getByRole('button',{name:'Switch module',exact:true}).click()
    await page.getByRole('heading',{name:'Select Module',exact:true}).waitFor()
    const labels=await page.locator('[role="dialog"] button').allTextContents()
    await shot('admin-modules')
    await page.getByRole('button',{name:'Close',exact:true}).click()
    return labels
  })
  await check('fund-retrieve-persistence',async()=>{
    await go('/portfolio/funds','LOCAL-BROWSER-UAT-FUND-1792067231459')
    const row=page.locator('tr').filter({hasText:'LOCAL-BROWSER-UAT-FUND-1792067231459'})
    if(await row.count()!==1) throw new Error('Training fund is not unique')
    const text=await row.innerText(); await shot('fund-retrieved')
    await page.reload(); await row.waitFor(); return {row:text,errors:await toasts()}
  })
  await check('lp-retrieve-linked-fund',async()=>{
    await go('/portfolio/lps','LOCAL-BROWSER-UAT-LP-1792068168474')
    await page.locator('tr').filter({hasText:'LOCAL-BROWSER-UAT-LP-1792068168474'}).click()
    await page.getByRole('heading',{name:'Investor contact',exact:true}).waitFor()
    await page.getByRole('tab',{name:'Commitments',exact:true}).click()
    await page.getByRole('heading',{name:'Commitment Register',exact:true}).waitFor()
    const text=await page.locator('tr').filter({hasText:'LOCAL-BROWSER-UAT-FUND-1792067231459'}).innerText()
    await shot('lp-linked-fund'); return {row:text,errors:await toasts()}
  })
  await check('deal-retrieve-and-dd-gates',async()=>{
    await go('/portfolio/deals','Arcus Demo Investee Co')
    await page.locator('tr').filter({hasText:'Arcus Demo Investee Co'}).getByRole('button',{name:'Open',exact:true}).click()
    await page.getByRole('button',{name:'Due Diligence',exact:true}).waitFor()
    await page.getByRole('button',{name:'Due Diligence',exact:true}).click()
    await page.getByRole('heading',{name:'Assessment criteria',exact:true}).waitFor()
    const criteria=await page.getByRole('heading',{name:'Assessment criteria',exact:true}).locator('..').innerText()
    await shot('due-diligence-record')
    return {route:page.url(),criteria,completeDisabled:await page.getByRole('button',{name:'Complete DD',exact:true}).isDisabled(),errors:await toasts(),pageErrors}
  })
  await check('portfolio-companies',async()=>{
    await go('/portfolio/companies','Portfolio Companies')
    await page.locator('tbody tr').first().waitFor({timeout:90000})
    const rows=await page.locator('tbody tr').allTextContents()
    await shot('portfolio-companies'); return {rows,errors:await toasts(),pageErrors}
  })
  for(const [route,name] of [['/fundraising/investors','investor-relations'],['/accounting/reports','accounting-reports'],['/forecasting','fpa']]) {
    await check(name,async()=>{
      await go(route)
      await page.locator('h1,h2').first().waitFor({timeout:120000})
      await shot(name)
      return {route:page.url(),headings:await page.locator('h1,h2,h3').allTextContents(),errors:await toasts(),pageErrors}
    })
  }
  for(const route of ['/portfolio','/fundraising','/accounting','/forecasting','/payroll','/procurement','/events']) {
    await check(`home-navigation:${route}`,()=>homeFrom(route))
  }
  for(const [key,role,restricted] of [['tino','CEO',false],['sophia','CFO',false],['ropa','FIN_ASST',false],['brendon','INV_ANALYST',true],['natsai','INV_ANALYST',true],['vongai','INV_ANALYST',true],['gilbert','PORTFOLIO_MGR',true]]) {
    await check(`role:${key}`,async()=>{
      await login(`uat.${key}@nts.local`)
      await page.getByRole('button',{name:'Switch module',exact:true}).click()
      await page.getByRole('heading',{name:'Select Module',exact:true}).waitFor()
      const modules=await page.locator('[role="dialog"] button').allTextContents()
      await shot(`${key}-modules`)
      await page.getByRole('button',{name:'Close',exact:true}).click()
      await go('/payroll')
      const payrollText=await page.locator('body').innerText()
      await shot(`${key}-payroll`)
      const payrollDenied=/Access unavailable|Access denied|not have access|not authorized/i.test(payrollText)
      const apiLogin=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`uat.${key}@nts.local`,password,portal:'staff'})})
      const auth=await apiLogin.json()
      const headers={Authorization:`Bearer ${auth.token}`}
      const status={}
      for(const endpoint of ['/users','/payroll/employees','/procurement/requisitions/my','/procurement/requisitions','/accounting/me']) {
        const response=await fetch(`${API}${endpoint}`,{headers}); status[endpoint]=response.status
      }
      return {role,restricted,modules,payrollDenied,apiStatus:status,errors:await toasts(),pageErrors}
    })
  }
} finally {
  await browser.close()
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({environment:FE,testedAt:new Date().toISOString(),results},null,2))
}
if(results.some(r=>!r.passed)) process.exitCode=1
