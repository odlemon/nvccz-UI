import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3001';
const OUT = 'C:\\Users\\lysp\\AppData\\Local\\Temp\\fpa-qa';
fs.mkdirSync(OUT, { recursive: true });

const logs = [];
const errors = [];
const gaps = [];

function log(...a) { console.log(...a); logs.push(a.join(' ')); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Find an element by visible text and click it (UI interaction, not API).
async function clickByText(page, selector, text, timeout = 8000) {
  const handle = await page.waitForFunction(
    (sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      const el = els.find(e => (e.innerText || e.textContent || '').toLowerCase().includes(txt.toLowerCase()));
      return el || null;
    },
    { timeout },
    selector, text
  ).catch(() => null);
  if (!handle) return false;
  const el = await handle.asElement();
  if (!el) return false;
  await el.click();
  return true;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => {
    const t = msg.text();
    log('[console]', msg.type(), t.slice(0, 300));
    if (/FP&A API gap/.test(t)) gaps.push(t);
  });
  page.on('pageerror', (err) => { errors.push(String(err)); log('[pageerror]', String(err).slice(0, 300)); });
  page.on('requestfailed', (req) => {
    const u = req.url();
    if (/fpa|auth/i.test(u)) log('[reqfailed]', u, req.failure()?.errorText);
  });

  try {
    // 1. Home
    log('=== 1. Open app ===');
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: `${OUT}/01-home.png` });

    // 2. Login via UI form
    log('=== 2. Login (UI) ===');
    const emailSel = 'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="mail" i]';
    await page.waitForSelector(emailSel, { timeout: 10000 }).catch(() => {});
    const hasEmail = await page.$(emailSel);
    if (hasEmail) {
      await page.type(emailSel, 'admin@nts.com', { delay: 20 });
      const pwSel = 'input[type="password"]';
      await page.waitForSelector(pwSel, { timeout: 5000 });
      await page.type(pwSel, 'admin123', { delay: 20 });
      // Click the real "Sign in" submit button (type=submit)
      const clicked = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(x => /sign ?in/i.test((x.innerText || '').trim()));
        if (b) { b.click(); return (b.innerText || '').trim(); }
        const f = document.querySelector('form'); if (f) { f.requestSubmit ? f.requestSubmit() : f.submit(); return 'form.submit'; }
        return 'none';
      });
      log('clicked:', clicked);
      // Wait (poll) for the URL to leave /login (login + fetchUserDetails + redirect can take >10s)
      let redirected = false;
      for (let i = 0; i < 30; i++) {
        const u = page.url();
        if (!u.includes('/login')) { redirected = true; break; }
        await sleep(1000);
      }
      log('redirected off /login:', redirected, '| url:', page.url());
    } else {
      log('no email field found on this page — maybe already at app or different route');
    }
    await sleep(1500);
    await page.screenshot({ path: `${OUT}/02-after-login.png` });
    log('url after login:', page.url());
    // Confirm auth cookie present (token cookie key defaults to 'token')
    const authInfo = await page.evaluate(() => {
      const c = document.cookie.split('; ').find(x => x.startsWith('token='));
      return { hasTokenCookie: !!c, url: location.href };
    });
    log('auth cookie present:', authInfo.hasTokenCookie);

    // 3. Go to Model Planning models list
    log('=== 3. Model Planning models ===');
    await page.goto(`${BASE}/forecasting/models`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => log('nav err', e.message));
    await sleep(2500);
    await page.screenshot({ path: `${OUT}/03-models.png` });

    // Find a worksheet link
    const wsHref = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('a[href*="worksheet"]'));
      return a.length ? a[0].getAttribute('href') : null;
    });
    log('first worksheet href:', wsHref);

    if (wsHref) {
      // 4. Open worksheet (Planning)
      log('=== 4. Planning worksheet ===');
      await page.goto(new URL(wsHref, BASE).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(4000);
      await page.screenshot({ path: `${OUT}/04-worksheet-planning.png` });
      // Capture KPI strip + selectors presence
      const planningInfo = await page.evaluate(() => {
        return {
          kpiCount: document.querySelectorAll('[class*="KpiCard"], [class*="kpi"]').length,
          hasGrid: !!document.querySelector('table'),
          scenarioTabs: Array.from(document.querySelectorAll('button')).map(b => b.innerText).filter(t => /Case|Scenario|Forecast|Budget/i.test(t)).slice(0, 12),
          bodyText: (document.body.innerText || '').slice(0, 500),
        };
      });
      log('planningInfo:', JSON.stringify(planningInfo, null, 2));

      // 5. Compare view
      log('=== 5. Compare view ===');
      const sep = wsHref.includes('?') ? '&' : '?';
      await page.goto(`${new URL(wsHref, BASE).href}${sep}view=compare`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(4500);
      await page.screenshot({ path: `${OUT}/05-compare.png` });
      // Try to multi-select scenarios if checkboxes/dropdown present
      await clickByText(page, 'button', 'Compare', 2000).catch(() => {});
      await sleep(2000);
      await page.screenshot({ path: `${OUT}/06-compare-selected.png` });
      const compareInfo = await page.evaluate(() => ({
        hasTable: !!document.querySelector('table'),
        hasWaterfall: /waterfall|bridge/i.test(document.body.innerText || ''),
        hasSensitivity: /sensitivity/i.test(document.body.innerText || ''),
        hasAssumptions: /assumption/i.test(document.body.innerText || ''),
        emptyStates: Array.from(document.querySelectorAll('p')).map(p => p.innerText).filter(t => /appear|when|load|empty|not on this model|—/i.test(t)).slice(0, 6),
        bodyText: (document.body.innerText || '').slice(0, 400),
      }));
      log('compareInfo:', JSON.stringify(compareInfo, null, 2));
    }

    // 6. Standalone Scenarios page
    log('=== 6. Scenarios page ===');
    await page.goto(`${BASE}/forecasting/scenarios`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => log('nav err', e.message));
    await sleep(3500);
    await page.screenshot({ path: `${OUT}/07-scenarios.png` });
    const scenInfo = await page.evaluate(() => ({
      scenarioCards: Array.from(document.querySelectorAll('h4, [class*="scenario"]')).map(e => e.innerText).filter(Boolean).slice(0, 15),
      hasCreate: /new scenario|create/i.test(document.body.innerText || ''),
      hasDuplicate: /duplicate/i.test(document.body.innerText || ''),
      hasPromote: /promote/i.test(document.body.innerText || ''),
      bodyText: (document.body.innerText || '').slice(0, 400),
    }));
    log('scenInfo:', JSON.stringify(scenInfo, null, 2));

    // 7. Collect fpa-api-gaps from sessionStorage
    log('=== 7. fpa-api-gaps ===');
    const stored = await page.evaluate(() => {
      try { return JSON.parse(sessionStorage.getItem('fpa-api-gaps') || '[]'); } catch { return []; }
    });
    log('stored gaps count:', stored.length);
    fs.writeFileSync(`${OUT}/gaps.json`, JSON.stringify(stored, null, 2));
    stored.slice(0, 30).forEach(g => log('  GAP:', g.method, g.path, '|', g.category, '|', (g.message || '').slice(0, 120)));

  } catch (e) {
    log('FATAL', e.message);
    errors.push(e.message);
  } finally {
    fs.writeFileSync(`${OUT}/qa-log.txt`, logs.join('\n'));
    fs.writeFileSync(`${OUT}/qa-errors.txt`, errors.join('\n'));
    await browser.close();
    log('=== DONE. Artifacts in', OUT, '===');
  }
})();
