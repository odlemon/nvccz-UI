import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);

  const result = await page.evaluate(async () => {
    const hosts = [
      'https://dev-api.arcus.co.zw/api',
      'http://31.220.82.129:3009/api',
    ];
    const out = {};
    for (const h of hosts) {
      const t0 = Date.now();
      try {
        const r = await fetch(`${h}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@nts.com', password: 'admin123' }),
        });
        const txt = await r.text();
        out[h] = { ok: r.ok, status: r.status, ms: Date.now() - t0, cors: r.headers.get('access-control-allow-origin'), snippet: txt.slice(0, 80) };
      } catch (e) {
        out[h] = { error: String(e), ms: Date.now() - t0 };
      }
    }
    return out;
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
