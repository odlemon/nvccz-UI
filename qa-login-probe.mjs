import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3001';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const failed = [];
  const responses = [];
  page.on('requestfailed', (req) => failed.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`));
  page.on('response', (res) => { if (/auth|login|api/i.test(res.url())) responses.push(`${res.status()} ${res.request().method()} ${res.url()}`); });
  page.on('console', (m) => { if (m.type() === 'error' || /error|fail|invalid/i.test(m.text())) console.log('[console]', m.type(), m.text().slice(0, 300)); });

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);

  // Dump form structure
  const formInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      tag: i.tagName, type: i.type, name: i.name, id: i.id,
      placeholder: i.placeholder, autocomplete: i.autocomplete,
      'data-testid': i.getAttribute('data-testid'),
    }));
    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: (b.innerText || '').trim().slice(0, 40), type: b.type, id: b.id,
    }));
    const forms = Array.from(document.querySelectorAll('form')).map(f => ({
      action: f.getAttribute('action'), method: f.getAttribute('method'), id: f.id,
      onSubmit: !!f.getAttribute('onsubmit'),
    }));
    return { inputs, buttons, forms, url: location.href, bodySnippet: document.body.innerText.slice(0, 300) };
  });
  console.log('FORM INFO:', JSON.stringify(formInfo, null, 2));

  // Try filling + clicking the primary button
  const emailSel = 'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="mail" i], input[name="username"]';
  const emailEl = await page.$(emailSel);
  if (emailEl) {
    await emailEl.type('admin@nts.com', { delay: 15 });
    const pwEl = await page.$('input[type="password"]');
    if (pwEl) await pwEl.type('admin123', { delay: 15 });
    // click first enabled button that looks like submit/login
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => /log ?in|sign ?in|continue|submit|signin/i.test((x.innerText||'')));
      if (b) { b.click(); return (b.innerText||'').trim(); }
      const form = document.querySelector('form');
      if (form) { form.requestSubmit ? form.requestSubmit() : form.submit(); return 'form.submit'; }
      return 'no-button';
    });
    console.log('clicked:', clicked);
  } else {
    console.log('NO EMAIL FIELD FOUND');
  }

  await sleep(4000);
  console.log('URL AFTER:', page.url());
  console.log('RESPONSES:', JSON.stringify(responses, null, 2));
  console.log('FAILED:', JSON.stringify(failed, null, 2));
  const afterBody = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('BODY AFTER:', afterBody);

  await browser.close();
})();
