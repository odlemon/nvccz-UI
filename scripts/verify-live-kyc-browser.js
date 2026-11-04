const { chromium } = require("playwright");

(async () => {
  const token = process.env.KYC_TOKEN;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:3011/fundraising-kyc?token=${token}`, { waitUntil: "domcontentloaded" });
  const statuses = await page.evaluate(async (value) => {
    const headers = { Authorization: `Bearer ${value}`, "X-Client-Application": "fundraising-kyc" };
    const draft = await fetch("http://127.0.0.1:3009/api/public/fundraising-kyc/session", {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ details: { synthetic: true, identity: { legalName: "Synthetic Browser Applicant", email: "synthetic@example.invalid" }, declarations: { informationAccurate: true } } }),
    });
    const form = new FormData();
    form.append("category", "identity_document");
    form.append("file", new Blob(["synthetic browser evidence"], { type: "application/pdf" }), "synthetic-browser.pdf");
    const upload = await fetch("http://127.0.0.1:3009/api/public/fundraising-kyc/session/documents", { method: "POST", headers, body: form });
    const submit = await fetch("http://127.0.0.1:3009/api/public/fundraising-kyc/submit", {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ details: { synthetic: true, identity: { legalName: "Synthetic Browser Applicant" }, declarations: { informationAccurate: true } } }),
    });
    return { draft: draft.status, upload: upload.status, submit: submit.status };
  }, token);
  console.log(JSON.stringify(statuses));
  await browser.close();
})().catch((error) => { console.error(error.message); process.exit(1); });
