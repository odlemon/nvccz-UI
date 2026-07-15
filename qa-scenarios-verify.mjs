import puppeteer from 'puppeteer-core';
import fs from 'fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3001';
const OUT = 'C:\\Users\\lysp\\AppData\\Local\\Temp\\fpa-qa';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const perrs = [];
  page.on('pageerror', (e) => perrs.push(String(e).slice(0, 150)));

  // login
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);
  await page.type('input[type="email"]', 'admin@nts.com', { delay: 20 });
  await page.type('input[type="password"]', 'admin123', { delay: 20 });
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => /sign ?in/i.test((x.innerText||'').trim())); if (b) b.click(); });
  for (let i = 0; i < 30; i++) { if (!page.url().includes('/login')) break; await sleep(1000); }

  // scenarios page
  await page.goto(`${BASE}/forecasting/scenarios`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(8000);
  const info = await page.evaluate(() => ({
    bodyLen: (document.body.innerText || '').length,
    hasScenariosHeading: /Scenarios/i.test(document.body.innerText || ''),
    hasCompareTable: /Metric|Side-by-Side|Variance/i.test(document.body.innerText || ''),
    hasWaterfallEmpty: /Waterfall data will appear/i.test(document.body.innerText || ''),
    hasSensitivityEmpty: /Sensitivity rows appear|Sensitivity/i.test(document.body.innerText || ''),
    newScenarioBtn: /New Scenario/i.test(document.body.innerText || ''),
    cardNames: Array.from(document.querySelectorAll('h4')).map(h => h.innerText).slice(0, 12),
    snippet: (document.body.innerText || '').slice(0, 400),
  }));
  await page.screenshot({ path: `${OUT}/verify-scenarios.png`, fullPage: true });
  console.log('PAGEERRORS:', perrs.length, JSON.stringify(perrs.slice(0, 5)));
  console.log('SCENARIOS PAGE:', JSON.stringify(info, null, 2));
  fs.writeFileSync(`${OUT}/verify-scenarios.json`, JSON.stringify({ perrs, info }, null, 2));
  await browser.close();
})();
