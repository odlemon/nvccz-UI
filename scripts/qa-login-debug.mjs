import { chromium } from 'playwright'

const BASE = process.env.APP_URL || 'http://localhost:3001'

;(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage()
  const api = []
  const consoleLogs = []
  page.on('console', (msg) => consoleLogs.push(`${msg.type()}: ${msg.text()}`))
  page.on('pageerror', (err) => consoleLogs.push(`pageerror: ${err.message}`))
  page.on('response', async (res) => {
    const u = res.url()
    if (!/localhost:3002/.test(u)) return
    let t = ''
    try {
      t = await res.text()
    } catch {}
    api.push(
      `${res.status()} ${res.request().method()} ${u.replace('http://localhost:3002', '')} :: ${t
        .slice(0, 180)
        .replace(/\s+/g, ' ')}`,
    )
  })

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 120000 })
  // Wait for client hydration — premature fill/submit becomes a native form POST/GET and never hits the API.
  await page.waitForSelector('button[type="submit"]:has-text("Sign in")', { timeout: 60000 })
  await page.waitForTimeout(2000)

  const email = page.locator('input[type="email"]').first()
  const password = page.locator('input[type="password"]').first()
  await email.fill('admin@nts.com')
  await password.fill('admin123')
  // Confirm controlled inputs kept values after hydrate
  const emailVal = await email.inputValue()
  const passVal = await password.inputValue()
  console.log('filled', { emailVal, passLen: passVal.length })

  await page.locator('button[type="submit"]').first().click()

  try {
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 })
  } catch {}
  await page.waitForTimeout(2000)
  console.log('URL', page.url())
  console.log('API HITS:')
  api.forEach((a) => console.log(' ', a))
  if (consoleLogs.length) {
    console.log('CONSOLE (last 15):')
    consoleLogs.slice(-15).forEach((l) => console.log(' ', l))
  }
  await browser.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
