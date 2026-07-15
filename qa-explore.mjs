// Browser exploration of the FP&A app using system Chrome via Playwright.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';
const EMAIL = 'admin@nts.com';
const PASS = 'admin123';
const OUT = path.join(process.cwd(), 'qa-explore');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[explore]', ...a);

const apiCalls = [];
const consoleErrors = [];

async function fillLogin(page) {
  // Email: try several selectors, pick the first present.
  const emailSel = [
    'input[type="email"]',
    'input[name="email"]',
    'input[autocomplete="email"]',
    'input[name="username"]',
  ].join(',');
  const passSel = ['input[type="password"]', 'input[name="password"]'].join(',');

  await page.waitForSelector(emailSel, { timeout: 15000 });
  await page.fill(emailSel, EMAIL);
  await page.fill(passSel, PASS);
  await page.screenshot({ path: OUT + '01-login-filled.png', fullPage: true });

  // Submit: button whose text mentions sign in / login / submit.
  const btn = page.locator('button', { hasText: /sign\s?in|log\s?in|submit/i }).first();
  await btn.click({ timeout: 10000 });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('response', (res) => {
    const u = res.url();
    if (/api|auth|fpa|models|scenarios/i.test(u)) {
      apiCalls.push(`${res.status()} ${res.request().method()} ${u}`);
    }
  });
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 300)));

  // 1. Login
  log('opening /login');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: OUT + '00-login.png', fullPage: true });
  await fillLogin(page);

  // 2. Wait for redirect off /login
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  } catch (e) {
    log('WARN: still on /login after submit — dumping form state');
  }
  await sleep(2500);
  const afterLoginUrl = page.url();
  log('after-login URL:', afterLoginUrl);
  await page.screenshot({ path: OUT + '02-after-login.png', fullPage: true });

  // 3. Navigate Forecasting routes
  const routes = [
    ['forecasting', '/forecasting'],
    ['models', '/forecasting/models'],
    ['scenarios', '/forecasting/scenarios'],
  ];
  for (const [label, path] of routes) {
    log('navigating ->', path);
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 25000 });
    } catch (e) {
      log('nav timeout on', path, '- continuing');
    }
    await sleep(3000);
    const title = await page.title().catch(() => '?');
    const h1 = await page.locator('h1, h2').first().innerText().catch(() => '(none)');
    const bodyLen = (await page.locator('body').innerText().catch(() => '')).length;
    log(`  [${label}] title="${title}" heading="${h1}" bodyLen=${bodyLen}`);
    const safe = label.replace(/[^a-z0-9]/gi, '-');
    await page.screenshot({ path: OUT + `03-${safe}.png`, fullPage: true });
  }

  // 4. Try to reach a model worksheet if models exist
  // Grab a model id from the models API via the page's token is complex; instead
  // look for worksheet links in the models page DOM.
  const worksheetLink = await page
    .locator('a[href*="/worksheet"]')
    .first()
    .getAttribute('href')
    .catch(() => null);
  if (worksheetLink) {
    log('found worksheet link:', worksheetLink);
    try {
      await page.goto(`${BASE}${worksheetLink}`, { waitUntil: 'networkidle', timeout: 25000 });
      await sleep(3000);
      await page.screenshot({ path: OUT + '04-worksheet.png', fullPage: true });
    } catch (e) {
      log('worksheet nav failed:', e.message.slice(0, 120));
    }
  } else {
    log('no /worksheet link found on models page');
  }

  // 5. Report
  console.log('\n===== EXPLORATION REPORT =====');
  console.log('After-login URL:', afterLoginUrl);
  console.log('\n-- API calls seen --');
  console.log(apiCalls.join('\n') || '(none)');
  console.log('\n-- Console errors --');
  console.log(consoleErrors.join('\n') || '(none)');
  console.log('\n-- Screenshots in', OUT, '--');
  fs.readdirSync(OUT).forEach((f) => console.log('  ', f));

  await browser.close();
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
