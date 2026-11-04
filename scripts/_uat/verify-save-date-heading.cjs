const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
    await page.goto('file:///C:/Users/lysp/Downloads/nvccz-new/.acc-dumps/save-date-heading-fixed.html');
    const title = page.getByAltText('Save the date', { exact: true });
    const dimensions = await title.evaluate(i => ({ complete: i.complete, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, width: i.width, height: i.height }));
    if (!dimensions.complete || dimensions.naturalHeight < 100 || dimensions.height !== 74) throw new Error('Heading dimensions incorrect');
    await page.screenshot({ path: '.acc-dumps/save-date-heading-fixed.png', fullPage: true });
    console.log(JSON.stringify(dimensions));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
