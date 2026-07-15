import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3001';
const OUT = 'C:\\Users\\lysp\\AppData\\Local\\Temp\\fpa-qa';
fs.mkdirSync(OUT, { recursive: true });

const logs = [];
const errors = [];
const netlog = []; // captured fpa api request/response summaries
function log(...a) { console.log(...a); logs.push(a.join(' ')); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function clickByText(page, selector, text, timeout = 6000) {
  const h = await page.waitForFunction((sel, txt) => {
    const el = Array.from(document.querySelectorAll(sel)).find(e => (e.innerText || e.textContent || '').toLowerCase().includes(txt.toLowerCase()));
    return el || null;
  }, { timeout }, selector, text).catch(() => null);
  if (!h) return false;
  const el = await h.asElement(); if (!el) return false;
  await el.click(); return true;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' || /FP&A API gap/.test(t)) { log('[console.error]', t.slice(0, 300)); }
  });
  page.on('pageerror', (e) => { errors.push(String(e)); log('[pageerror]', String(e).slice(0, 200)); });
  // Capture the app's own FP&A API calls (observing, not invoking)
  page.on('response', async (res) => {
    const u = res.url();
    if (!/api\/v1\/fpa/.test(u) && !/\/auth\/login/.test(u)) return;
    const method = res.request().method();
    let body = '';
    try {
      const ct = res.headers()['content-type'] || '';
      if (ct.includes('json')) {
        const j = await res.json().catch(() => null);
        body = safeSummary(j);
      }
    } catch {}
    netlog.push(`${method} ${res.status()} ${u.replace(BASE, '')}\n   ${body}`);
  });

  function safeSummary(j) {
    if (!j) return '(no json)';
    if (j.data && j.data.waterfall) {
      const wf = j.data.waterfall;
      return `waterfall:${JSON.stringify({ metricCode: wf.metricCode, stepCount: Array.isArray(wf.steps) ? wf.steps.length : 'n/a', stepsSample: (wf.steps||[]).slice(0,3) })}`;
    }
    if (j.data && j.data.metrics) return `metrics[${j.data.metrics.length}]`;
    if (j.data && Array.isArray(j.data)) return `array[${j.data.length}]`;
    if (j.data) return `dataKeys:${Object.keys(j.data).join(',')}`;
    return `success:${j.success}`;
  }

  try {
    // 1. Login
    log('=== 1. Login ===');
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1500);
    await page.type('input[type="email"]', 'admin@nts.com', { delay: 20 });
    await page.type('input[type="password"]', 'admin123', { delay: 20 });
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => /sign ?in/i.test((x.innerText||'').trim()));
      if (b) b.click();
    });
    let ok = false;
    for (let i = 0; i < 30; i++) { if (!page.url().includes('/login')) { ok = true; break; } await sleep(1000); }
    log('authed:', ok, '|', page.url());

    // 2. Models list
    log('=== 2. /forecasting/models ===');
    await page.goto(`${BASE}/forecasting/models`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // poll for links
    let wsHref = null;
    for (let i = 0; i < 30; i++) {
      wsHref = await page.evaluate(() => {
        const a = Array.from(document.querySelectorAll('a')).find(x => /worksheet/.test(x.getAttribute('href')||''));
        return a ? a.getAttribute('href') : null;
      });
      if (wsHref) break;
      await sleep(1000);
    }
    const modelLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href')).filter(h => h && /forecasting|model/i.test(h)).slice(0, 20));
    log('worksheet href:', wsHref);
    log('forecasting links:', JSON.stringify(modelLinks));
    await page.screenshot({ path: `${OUT}/v2-models.png` });

    if (wsHref) {
      // 3. Planning worksheet
      log('=== 3. Planning worksheet ===');
      await page.goto(new URL(wsHref, BASE).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(5000);
      const plan = await page.evaluate(() => ({
        kpiCount: document.querySelectorAll('[class*="KpiCard"], [class*="kpi"]').length,
        hasGrid: !!document.querySelector('table'),
        scenarioTabs: Array.from(document.querySelectorAll('button')).map(b => b.innerText).filter(t => /Case|Scenario|Forecast|Budget/i.test(t)).slice(0, 12),
        bodyText: (document.body.innerText||'').slice(0, 300),
      }));
      log('planning:', JSON.stringify(plan));
      await page.screenshot({ path: `${OUT}/v2-worksheet.png` });

      // 4. Compare view
      log('=== 4. Compare view ===');
      const sep = wsHref.includes('?') ? '&' : '?';
      await page.goto(`${new URL(wsHref, BASE).href}${sep}view=compare`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(6000);
      const cmp = await page.evaluate(() => ({
        hasTable: !!document.querySelector('table'),
        hasWaterfall: /waterfall|bridge/i.test(document.body.innerText||''),
        hasSensitivity: /sensitivity/i.test(document.body.innerText||''),
        hasAssumptions: /assumption/i.test(document.body.innerText||''),
        bodyText: (document.body.innerText||'').slice(0, 300),
      }));
      log('compare:', JSON.stringify(cmp));
      await page.screenshot({ path: `${OUT}/v2-compare.png` });
    }

    // 5. Scenarios page (crashes?)
    log('=== 5. /forecasting/scenarios ===');
    await page.goto(`${BASE}/forecasting/scenarios`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(6000);
    const scen = await page.evaluate(() => ({
      scenarioCards: Array.from(document.querySelectorAll('h4, [class*="scenario"]')).map(e => e.innerText).filter(Boolean).slice(0, 15),
      bodyLen: (document.body.innerText||'').length,
      bodyText: (document.body.innerText||'').slice(0, 300),
      hasErrorBoundary: /something went wrong|error/i.test(document.body.innerText||''),
    }));
    log('scenarios:', JSON.stringify(scen));
    await page.screenshot({ path: `${OUT}/v2-scenarios.png` });

    // 6. gaps
    const gaps = await page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem('fpa-api-gaps')||'[]'); } catch { return []; } });
    log('gaps count:', gaps.length);

  } catch (e) {
    log('FATAL', e.message); errors.push(e.message);
  } finally {
    fs.writeFileSync(`${OUT}/v2-netlog.txt`, netlog.join('\n'));
    fs.writeFileSync(`${OUT}/v2-qa-log.txt`, logs.join('\n'));
    fs.writeFileSync(`${OUT}/v2-errors.txt`, errors.join('\n'));
    log('=== DONE ===');
    await browser.close();
  }
})();
