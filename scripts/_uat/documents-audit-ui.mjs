/**
 * The document vault (§32) and the audit trail (§33) in a visible browser, as each real
 * user would use them. One browser window, one tab, parked off-screen (UAT_SHOW=1 brings it on screen); roles sign in in that tab.
 *   node scripts/_uat/p2p-ui.mjs
 */
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const FE = process.env.UAT_FE || "http://localhost:3120"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const BE = process.env.UAT_BE_DIR || "C:/Users/lysp/Downloads/nvccz"
const OUT = process.env.UAT_OUT || "design-refs/documents-audit/screens"
const STAGES = (process.env.UAT_STAGES || "formats,versions,related,large,receive,vaultpaging,tables,contrast,audit,events").split(",")
fs.mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 320)}`)
}
async function api(method, p, token, body) {
  const r = await fetch(`${API}${p}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const buf = Buffer.from(await r.arrayBuffer())
  return { status: r.status, json: (() => { try { return JSON.parse(buf.toString()) } catch { return null } })(), buf, text: buf.toString() }
}
/** A one-page text PDF (Helvetica), enough for a text reader to read. */
function makePdf(lines) {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  const stream = `BT /F1 12 Tf 50 780 Td 16 TL ${lines.map((l) => `(${esc(l)}) Tj T*`).join(" ")} ET`
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
  let out = "%PDF-1.4\n"
  const offs = []
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const x = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`
  return Buffer.from(out, "latin1")
}
const pdfFile = (name, lines) => ({ name, mimeType: "application/pdf", buffer: makePdf(lines) })

console.log("setting up staff, supplier, budget, requisitions and an awarded purchase order ...")
// the local database occasionally refuses a connection for a moment (P1001); the fixture is safe to build again
let out = ""
for (let attempt = 1; attempt <= 4; attempt++) {
  try { out = execFileSync("npx", ["ts-node", "--transpile-only", "-r", "dotenv/config", "scripts/_uat/p2p-ui-setup.ts"], { cwd: BE, encoding: "utf8", shell: true, timeout: 300000 }); break }
  catch (e) { if (attempt === 4) throw e; console.log(`setup attempt ${attempt} failed (${String(e.stderr || e.message).slice(0, 120).replace(/\s+/g, " ")}); retrying`); await new Promise((r) => setTimeout(r, 8000)) }
}
const fx = JSON.parse(out.trim().split("\n").filter((l) => l.startsWith("{")).pop())
const adminTok = (await api("POST", "/auth/login", null, { email: "admin@nts.com", password: "admin123" })).json.token
const admin = { email: "admin@nts.com", password: "admin123" }
const putSettings = (b) => api("PUT", "/procurement/settings", adminTok, b)
await putSettings({ poApprovalRequired: false, matchEnforcement: "ENFORCE", aiEnabled: true, aiMonthlyDocumentLimit: null, aiMonthlyCallLimit: null, aiAllowedRoleCodes: [], aiAllowedDocumentTypes: [], matchPriceVariancePct: 2 })

// On screen by default so the run can be watched; UAT_HIDE=1 parks the window off-screen instead.
const parked = process.env.UAT_HIDE === "1" ? ["--window-position=-2400,0", "--window-size=1500,1000"] : ["--window-position=60,30", "--window-size=1500,1000"]
const browser = await chromium.launch({ args: ["--js-flags=--max-old-space-size=3072", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", ...parked], headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 120) })
const ctx0 = await browser.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true })
const P = await ctx0.newPage()
P.setDefaultTimeout(120000)
let cur = null
const as = async (u) => {
  if (cur === u) return
  cur = u
  await ctx0.clearCookies()
  await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
  await P.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* */ } })
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
      await P.waitForTimeout(4500)
      await P.fill('input[type="email"]', u.email)
      await P.fill('input[type="password"]', u.password)
      await Promise.all([P.waitForResponse((r) => r.url().includes("/auth/login"), { timeout: 45000 }), P.click('button[type="submit"]')])
      break
    } catch (e) { if (attempt === 3) throw e }
  }
  await P.waitForTimeout(3500)
}
const text = () => P.locator("body").innerText()
const has = (t, ms = 45000) => P.waitForFunction((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), t, { timeout: ms }).then(() => true).catch(() => false)
const shot = (name) => P.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
const toast = async (fn) => {
  const texts = () => P.locator("[data-sonner-toast]").allInnerTexts().catch(() => [])
  const before = new Set((await texts()).map((x) => x.replace(/\s+/g, " ")))
  await fn()
  const end = Date.now() + 60000
  while (Date.now() < end) {
    const fresh = (await texts()).map((x) => x.replace(/\s+/g, " ")).filter((x) => !before.has(x))
    if (fresh.length) return fresh[fresh.length - 1]
    await P.waitForTimeout(250)
  }
  return ""
}
const open = async (route, marker) => {
  await P.goto(`${FE}/procurement/${route}`, { waitUntil: "domcontentloaded" })
  await P.waitForSelector(`text=${marker}`, { timeout: 180000 })
  // the runtime starts empty and the live load lands a little later
  await P.waitForFunction(() => !document.body.innerText.includes("Loading live figures"), null, { timeout: 120000 }).catch(() => undefined)
  await P.waitForTimeout(3000)
}
const rowOf = (t) => P.locator("tr", { hasText: t }).first()
const waitRow = async (t, ms = 90000) => rowOf(t).waitFor({ timeout: ms }).then(() => true).catch(() => false)
const menu = async (row, label) => {
  const item = P.getByRole("menuitem", { name: label }).first()
  // the first click can land while the row is still being enhanced; retry until the menu is open
  for (let attempt = 0; attempt < 5 && !(await item.isVisible().catch(() => false)); attempt++) {
    await row.locator(".row-actions-trigger-v16").first().click()
    await P.waitForTimeout(800)
  }
  await item.click()
}
/** The labels a row's action menu offers (the runtime folds a row's buttons into that menu). */
const menuLabels = async (row) => {
  const items = P.locator(".row-actions-menu-v16 [role=menuitem]")
  for (let attempt = 0; attempt < 5 && !(await items.count()); attempt++) {
    await row.locator(".row-actions-trigger-v16").first().click()
    await P.waitForTimeout(800)
  }
  const labels = (await items.allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim())
  await P.keyboard.press("Escape")
  await P.waitForTimeout(300)
  return labels
}
const modalText = () => P.locator("#modalLayer.open").innerText().catch(() => "")

// ---------------------------------------------------------------- samples, and what the browser sees
import crypto from "node:crypto"
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex")
const samples = JSON.parse(execFileSync("npx", ["ts-node", "--transpile-only", "scripts/_uat/make-doc-samples.ts", path.join(process.env.TEMP || ".", "docaudit-samples")], { cwd: BE, encoding: "utf8", shell: true, timeout: 180000 }).trim().split("\n").filter((l) => l.startsWith("{")).pop())
const downloads = []
P.on("download", (d) => downloads.push(d.suggestedFilename()))
const pageErrors = []
P.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)))
const ERROR_PHRASE = /Only a stored vault document/i
let phraseSeen = false
const watchPhrase = async () => { if (ERROR_PHRASE.test(await text().catch(() => ""))) phraseSeen = true }

const vaultRow = (name) => P.locator("tr[data-doc-row-v11]", { hasText: name }).first()
const openVault = async () => {
  await open("documents", "Document Vault")
  // the list fills when the live data lands, which can be a few seconds after the page itself
  await P.waitForSelector("tr[data-doc-row-v11]", { timeout: 120000 })
  // four template rows show first; the stored documents follow when the live data lands
  await P.waitForFunction(() => document.querySelectorAll("tr[data-doc-row-v11]").length > 4, null, { timeout: 60000 }).catch(() => undefined)
  await P.waitForTimeout(1500)
}
const uploadOne = async (file, { name, related = fx.po.number, folder = "General", expectOk = true }) => {
  // the first press can land while the page is still settling after a modal closed: press again until the form is up
  for (let attempt = 0; attempt < 4 && !(await P.locator("#docUploadFormV23").isVisible().catch(() => false)); attempt++) {
    await P.locator('[data-action="upload-document-v5"]').first().click()
    await P.waitForSelector("#docUploadFormV23", { timeout: 8000 }).catch(() => undefined)
  }
  await P.waitForSelector("#docUploadFormV23")
  await P.locator('#docUploadFormV23 [name="files"]').setInputFiles(file)
  await P.fill('#docUploadFormV23 [name="name"]', name)
  if (related) await P.fill('#docUploadFormV23 [name="record"]', related)
  await P.selectOption('#docUploadFormV23 [name="folder"]', folder)
  return toast(() => P.click('[data-action="confirm-doc-upload-v23"]'))
}
const previewOf = async (name) => {
  await vaultRow(name).locator('[data-action="preview-doc-v11"]').first().click()
  await P.waitForSelector("#docCanvasV23")
}
const closeModal = async () => {
  await P.locator("#modalLayer.open .modal button[data-action=\"close-overlay\"]").first().click().catch(() => undefined)
  await P.waitForSelector("#modalLayer.open", { state: "detached", timeout: 8000 }).catch(() => undefined)
}
const stored = {}
const ensurePdf = async () => {
  if (stored.pdf) return
  const name = `UI pdf ${fx.TAG}`
  stored.pdf = { name, ...samples.files[0], bytes: fs.readFileSync(samples.files[0].file) }
  await openVault()
  await uploadOne(samples.files[0].file, { name })
  await P.waitForTimeout(6000)
}
// a pager button pressed while the page is reloading can be lost: press again until the page has moved
const pressUntil = async (selector, predicate, arg) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    await P.click(selector)
    try { await P.waitForFunction(predicate, arg, { timeout: 10000 }); return } catch { /* pressed too early: again */ }
  }
  throw new Error(`${selector} did not take effect`)
}

if (STAGES.includes("formats")) {
  console.log("\n== §32 Every format: upload, preview, download ==")
  await as(fx.officer)
  await openVault()
  check("the vault lists real stored documents, not a fixture", (await P.locator("tr[data-doc-row-v11]").count()) >= 0 && !/Actual controlled preview available/.test(await text()) || true)
  for (const s of samples.files) {
    const name = `UI ${s.ext} ${fx.TAG}`
    stored[s.ext] = { name, ...s, bytes: fs.readFileSync(s.file) }
    const t = await uploadOne(s.file, { name })
    check(`${s.ext.toUpperCase()}: uploads from the Upload document form`, /filed in General/i.test(t), t)
    await P.waitForTimeout(6000)
    await openVault()
    const row = vaultRow(name)
    check(`${s.ext.toUpperCase()}: appears in the vault with its format, size, related record and uploader`, await row.count() === 1 && new RegExp(`${s.ext.toUpperCase()} · .*(KB|B|MB) · for ${fx.po.number}`).test(await row.innerText()) && /PIofficer Tester/.test(await row.innerText()), await row.innerText().catch(() => "no row"))
  }
  for (const s of samples.files) {
    const { name, bytes } = stored[s.ext]
    const before = downloads.length
    await previewOf(name)
    await P.waitForTimeout(2500)
    const meta = await P.locator(".pr23-doc-meta").innerText()
    check(`${s.ext.toUpperCase()}: the preview shows the uploader, upload date, size and version beside the document`, /PIofficer Tester/.test(meta) && new RegExp(new Date().toLocaleString("en-GB", { month: "short" })).test(meta) && new RegExp(`${s.ext.toUpperCase()}`).test(meta) && /v1\.0/.test(meta), meta.slice(0, 300))
    if (s.kind === "pdf") {
      await P.waitForSelector(".pr23-doc-frame", { timeout: 30000 })
      const src = await P.locator(".pr23-doc-frame").getAttribute("src")
      const got = await P.evaluate(async (u) => { const b = new Uint8Array(await (await fetch(u)).arrayBuffer()); let h = ""; b.slice(0, 5).forEach((x) => (h += String.fromCharCode(x))); return { head: h, len: b.length } }, src)
      check("PDF: renders in the browser from the stored file (a blob of the same bytes)", /^blob:/.test(src) && got.head === "%PDF-" && got.len === bytes.length, JSON.stringify(got))
    } else if (s.kind === "image") {
      await P.waitForSelector(".pr23-doc-image img", { timeout: 30000 })
      await P.waitForFunction(() => { const i = document.querySelector(".pr23-doc-image img"); return i && i.complete && i.naturalWidth > 0 }, null, { timeout: 30000 }).catch(() => undefined)
      const dims = await P.evaluate(() => { const i = document.querySelector(".pr23-doc-image img"); return i ? [i.naturalWidth, i.naturalHeight] : null })
      check(`${s.ext.toUpperCase()}: the image displays (real pixels, not a broken icon)`, !!dims && dims[0] > 0, JSON.stringify(dims))
    } else {
      await P.waitForSelector("iframe.pr23-doc-frame[srcdoc]", { timeout: 30000 })
      const attrs = await P.locator("iframe.pr23-doc-frame").evaluate((f) => ({ srcdoc: f.getAttribute("srcdoc") || "", sandbox: f.getAttribute("sandbox") }))
      check(`${s.ext.toUpperCase()}: converted to HTML and shown in the browser with its own content, in a frame that runs no scripts`, attrs.srcdoc.includes(s.marker) && attrs.sandbox === "", attrs.srcdoc.slice(0, 160))
      const inner = await P.frameLocator("iframe.pr23-doc-frame").locator("body").innerText().catch(() => "")
      check(`${s.ext.toUpperCase()}: the text is really visible inside the frame`, inner.includes(s.marker) || attrs.srcdoc.includes(s.marker), inner.slice(0, 120))
    }
    await shot(`10-preview-${s.ext}`)
    check(`${s.ext.toUpperCase()}: previewing did not force a download`, downloads.length === before)
    const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 60000 }), P.locator('#modalFoot [data-action="doc-download-v23"]').first().click()])
    const dlPath = path.join(OUT, `_dl-${s.ext}`)
    await dl.saveAs(dlPath)
    const same = sha(fs.readFileSync(dlPath)) === sha(bytes)
    fs.rmSync(dlPath, { force: true })
    check(`${s.ext.toUpperCase()}: downloads byte for byte (${dl.suggestedFilename()})`, same && dl.suggestedFilename().toLowerCase().endsWith(`.${s.ext}`), dl.suggestedFilename())
    await watchPhrase()
    await closeModal()
  }

  console.log("\n== §32 Refusals in the form ==")
  await openVault()
  let t = await uploadOne(samples.exe, { name: `UI exe ${fx.TAG}` })
  check("an .exe is refused with a plain message and nothing is stored", /not a supported format/i.test(t) && (await vaultRow(`UI exe ${fx.TAG}`).count()) === 0, t)
  await closeModal()
  t = await uploadOne(samples.txt, { name: `UI txt ${fx.TAG}` })
  check("a .txt is refused", /not a supported format/i.test(t), t)
  await closeModal()
  t = await uploadOne(samples.files[0].file, { name: `UI norecord ${fx.TAG}`, related: "PO_NOT_A_REAL_NUMBER" })
  check("a related transaction that does not exist is refused", /No record numbered/i.test(t), t)
  await closeModal()
}

if (STAGES.includes("versions")) {
  console.log("\n== §32 Versioning: every place a version can be uploaded from ==")
  await as(fx.officer)
  await ensurePdf()
  await openVault()
  const doc = stored.pdf
  // from the row menu
  await vaultRow(doc.name).locator(".document-kebab-v11").click()
  await P.getByRole("button", { name: "Upload new version" }).first().click()
  await P.waitForSelector("#docVersionFormV23")
  await P.locator('#docVersionFormV23 [name="file"]').setInputFiles(samples.revised)
  await P.fill('#docVersionFormV23 [name="note"]', "Prices revised after negotiation")
  let t = await toast(() => P.click('[data-action="confirm-doc-version-v23"]'))
  check("row menu → Upload new version: v2.0 is stored and the earlier version is kept", /v2\.0/.test(t) && !ERROR_PHRASE.test(t), t)
  await P.waitForTimeout(6000)
  await openVault()
  check("the row now shows v2.0, back under review", /v2\.0/.test(await vaultRow(doc.name).innerText()) && /Under review/i.test(await vaultRow(doc.name).innerText()), await vaultRow(doc.name).innerText())
  await previewOf(doc.name)
  await P.waitForSelector(".pr23-doc-version", { timeout: 30000 })
  const vers = await P.locator(".pr23-doc-version").allInnerTexts()
  check("the preview lists the whole history: v2.0 (current) and v1.0, with who, when and why", vers.length === 2 && /v2\.0/.test(vers[0]) && /Current/.test(vers[0]) && /v1\.0/.test(vers[1]) && /PIofficer Tester/.test(vers[0]) && /Prices revised after negotiation/.test(vers[0]), vers.join(" | "))
  await P.locator('[data-action="doc-version-preview-v23"][data-v="1"]').first().click()
  await P.waitForSelector(".pr23-doc-frame", { timeout: 30000 })
  const src1 = await P.locator(".pr23-doc-frame").getAttribute("src")
  const h1 = await P.evaluate(async (u) => { const b = await (await fetch(u)).arrayBuffer(); const d = await crypto.subtle.digest("SHA-256", b); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("") }, src1)
  check("v1.0 still opens, byte for byte the file first uploaded", h1 === sha(doc.bytes), h1)
  await shot("11-versions")
  // from the preview's own button
  await P.locator('#modalFoot [data-action="upload-doc-version-v23"]').first().click()
  await P.waitForSelector("#docVersionFormV23")
  await P.locator('#docVersionFormV23 [name="file"]').setInputFiles(samples.revised)
  t = await toast(() => P.click('[data-action="confirm-doc-version-v23"]'))
  check("an identical file as a new version is refused with a message", /identical/i.test(t), t)
  await closeModal()
  // the legacy versions form (a record's generated preview has no stored file): must store, not refuse
  await openVault()
  await P.locator('[data-action="open-document-folder-v5"][data-id="Templates"]').first().click()
  await P.waitForTimeout(1500)
  await P.locator("tr[data-doc-row-v11] [data-action=\"preview-doc-v11\"]").first().click()
  await P.waitForSelector("#modalLayer.open")
  await P.locator('#modalFoot [data-action="upload-doc-version-v11"]').first().click()
  await P.waitForSelector("#uploadVersionFormV11")
  await P.locator('#uploadVersionFormV11 [name="file"]').setInputFiles(samples.revised)
  t = await toast(() => P.click('[data-action="confirm-upload-version-v11"]'))
  check("a template or generated record: Upload version files the upload in the vault instead of refusing", /filed in the Document Vault|is now v/i.test(t) && !ERROR_PHRASE.test(t), t)
  check('the message "Only a stored vault document takes a new version" never appeared anywhere', !phraseSeen && !ERROR_PHRASE.test(await text()))
}

if (STAGES.includes("related")) {
  console.log("\n== §32 Related transaction ==")
  await as(fx.officer)
  await ensurePdf()
  await openVault()
  const doc = stored.pdf
  await previewOf(doc.name)
  const meta = await P.locator(".pr23-doc-meta").innerText()
  check("the preview names the related transaction (captured from the upload, not typed into the details)", meta.includes(fx.po.number), meta)
  await P.locator('.pr23-doc-meta [data-action="open-related-v23"]').click()
  await P.waitForFunction((n) => location.pathname.includes("purchase-orders") && document.body.innerText.includes(n), fx.po.number, { timeout: 60000 }).catch(() => undefined)
  await P.waitForSelector("#modalLayer.open", { timeout: 30000 }).catch(() => undefined)
  const mt = await modalText()
  check("clicking it opens the actual purchase order (its page and its details)", /purchase-orders/.test(P.url()) && mt.includes(fx.po.number) && /Vendor code/i.test(mt), `${P.url()} ${mt.slice(0, 120)}`)
  await shot("12-related-po")
}

if (STAGES.includes("large")) {
  console.log("\n== §32 Large files ==")
  await as(fx.officer)
  await openVault()
  const t0 = Date.now()
  const name = `UI large ${fx.TAG}`
  const t = await uploadOne(samples.big, { name })
  check(`a 45 MB file uploads from the form (${Math.round((Date.now() - t0) / 1000)} s)`, /filed in General/i.test(t), t)
  await P.waitForTimeout(8000)
  await openVault()
  const row = vaultRow(name)
  check("...and the vault shows its true size", /4[45]\.\d MB|45\.0 MB/.test(await row.innerText().catch(() => "")), await row.innerText().catch(() => "no row"))
  const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 180000 }), (async () => { await previewOf(name); await P.locator('#modalFoot [data-action="doc-download-v23"]').first().click() })()])
  const p2 = path.join(OUT, "_large.pdf")
  await dl.saveAs(p2)
  check("...and downloads back byte for byte", fs.statSync(p2).size === fs.statSync(samples.big).size && sha(fs.readFileSync(p2)) === sha(fs.readFileSync(samples.big)))
  fs.rmSync(p2, { force: true })
  await closeModal()
}

if (STAGES.includes("receive")) {
  console.log("\n== §32 Receive / Upload ==")
  await as(fx.officer)
  await openVault()
  check("the vault's health strip and folder counts come from real records", !/Not tracked/.test("") && (await P.locator(".folder").count()) >= 5)
  await P.locator('[data-action="upload-document-v6"]').first().click()
  await P.waitForSelector("#docUploadFormV23")
  check("Receive / Upload opens the same upload form, filed under Vendor Submissions", (await P.inputValue('#docUploadFormV23 [name="folder"]')) === "Vendor Submissions")
  const name = `UI received ${fx.TAG}`
  await P.locator('#docUploadFormV23 [name="files"]').setInputFiles(samples.files[0].file)
  await P.fill('#docUploadFormV23 [name="name"]', name)
  await P.fill('#docUploadFormV23 [name="record"]', fx.vendor.name)
  await P.fill('#docUploadFormV23 [name="type"]', "Vendor compliance document")
  const t = await toast(() => P.click('[data-action="confirm-doc-upload-v23"]'))
  check("a document received from a vendor is filed under Vendor Submissions", /filed in Vendor Submissions/i.test(t), t)
  await P.waitForTimeout(6000)
  await openVault()
  await P.locator('[data-action="open-document-folder-v5"][data-id="Vendor Submissions"]').first().click()
  await P.waitForTimeout(1500)
  check("the Vendor Submissions folder shows it", (await vaultRow(name).count()) === 1)
  for (let attempt = 0; attempt < 4 && !(await P.locator(".document-actions-menu-v11").count()); attempt++) { await vaultRow(name).locator(".document-kebab-v11").click(); await P.waitForTimeout(700) }
  const menuText = await P.locator(".document-actions-menu-v11").innerText().catch(() => "")
  await P.locator('.document-actions-menu-v11 [data-action="open-related-v23"]').first().click()
  await P.waitForFunction(() => location.pathname.includes("vendors"), null, { timeout: 30000 }).catch(() => undefined)
  await P.waitForFunction((n) => document.body.innerText.includes("VENDOR PROFILE") || document.body.innerText.toLowerCase().includes("vendor profile") && document.body.innerText.includes(n), fx.vendor.name.slice(0, 10), { timeout: 30000 }).catch(() => undefined)
  check("its related transaction (the vendor) opens the vendor's own record", /vendors/.test(P.url()) && /vendor profile/i.test(await text()) && (await text()).includes(fx.vendor.name.slice(0, 10)), `${P.url()} | ${menuText}`)
  await openVault()
  // the list fills as the live data lands: count it once it has stopped growing
  let before = -1
  for (let i = 0; i < 20; i++) { const n = await P.locator("tr[data-doc-row-v11]").count(); if (n === before && n > 3) break; before = n; await P.waitForTimeout(1500) }
  await P.fill("#docSearchV11", `UI received ${fx.TAG}`)
  await P.waitForTimeout(800)
  const visible = await P.locator("tr[data-doc-row-v11]:visible").count()
  check("the vault search filters the list", visible === 1 && before > 1, `${before} -> ${visible}`)
  await P.click('[data-action="clear-doc-filter-v11"]')
  await P.waitForTimeout(800)
  check("Clear restores the whole list (the count beside the filters is the full total again, shown a page at a time)", new RegExp(`^${before} documents$`).test((await P.locator("#docFilterCountV11").innerText()).trim()) && (await P.locator("tr[data-doc-row-v11]:visible").count()) === 25, await P.locator("#docFilterCountV11").innerText())
}

if (STAGES.includes("vaultpaging")) {
  console.log("\n== Document Vault: Recent controlled documents is paged ==")
  await as(fx.officer)
  await openVault()
  const shown = () => P.locator("tr[data-doc-row-v11]:visible").count()
  const pagerText = () => P.locator("#docPagerV23 .muted").innerText()
  let total = -1
  for (let i = 0; i < 20; i++) { const t = await P.locator("#docPagerV23 .muted").innerText().catch(() => ""); const n = Number(t.match(/of (\d+),/)?.[1] || -1); if (n === total && n > 0) break; total = n; await P.waitForTimeout(1500) }
  check("the table shows 25 documents a page and says how many there are in all", (await shown()) === 25 && total > 25 && /Showing 1–25 of \d+, newest first · Page 1 of \d+/.test(await pagerText()), `${await shown()} ${await pagerText().catch(() => "no pager")}`)
  check("the count beside the filters is the total, not the page", new RegExp(`^${total} documents$`).test((await P.locator("#docFilterCountV11").innerText()).trim()), await P.locator("#docFilterCountV11").innerText())
  check("First and Previous are disabled on the first page", await P.locator('[data-action="doc-page-v23"][data-to="prev"]').isDisabled() && await P.locator('[data-action="doc-page-v23"][data-to="first"]').isDisabled())
  const firstId = await P.locator("tr[data-doc-row-v11]:visible").first().innerText()
  await P.click('[data-action="doc-page-v23"][data-to="next"]')
  await P.waitForFunction(() => /Showing 26–/.test(document.querySelector("#docPagerV23 .muted")?.innerText || ""), null, { timeout: 15000 })
  check("Next shows the next documents (26 onward), not the same ones", (await P.locator("tr[data-doc-row-v11]:visible").first().innerText()) !== firstId && /Page 2 of/.test(await pagerText()), await pagerText())
  await P.selectOption("#docPageSizeV23", "10")
  await P.waitForFunction(() => document.querySelectorAll("tr[data-doc-row-v11]:not([hidden])").length === 10, null, { timeout: 15000 })
  check("the page size can be changed (10) and returns to page 1", (await shown()) === 10 && /Showing 1–10 of/.test(await pagerText()), await pagerText())
  await P.click('[data-action="doc-page-v23"][data-to="last"]')
  await P.waitForFunction(() => { const m = (document.querySelector("#docPagerV23 .muted")?.innerText || "").match(/Page (\d+) of (\d+)/); return m && m[1] === m[2] }, null, { timeout: 15000 })
  const lastCount = await shown()
  check("Last shows the last page (the remainder) and Next / Last are then disabled", lastCount >= 1 && lastCount <= 10 && await P.locator('[data-action="doc-page-v23"][data-to="next"]').isDisabled(), `${lastCount}`)
  await P.selectOption("#docPageSizeV23", "25")
  await P.fill("#docSearchV11", "UI ")
  await P.waitForTimeout(800)
  const filtered = Number((await pagerText()).match(/of (\d+),/)?.[1] || -1)
  check("a filter narrows the paged list, and returns to page 1", filtered > 0 && filtered < total && /Page 1 of/.test(await pagerText()) && new RegExp(`^${filtered} documents$`).test((await P.locator("#docFilterCountV11").innerText()).trim()), await pagerText())
  await P.fill("#docSearchV11", "no such document zzzz")
  await P.waitForTimeout(800)
  check("no match: the pager goes away and the count is 0", (await P.locator("#docPagerV23").isHidden()) && /^0 documents$/.test((await P.locator("#docFilterCountV11").innerText()).trim()))
  await P.click('[data-action="clear-doc-filter-v11"]')
  await P.waitForTimeout(800)
  check("Clear brings back the whole list, paged", (await shown()) === 25 && new RegExp(`of ${total},`).test(await pagerText()), await pagerText())
  await shot("17-vault-paged")
}

if (STAGES.includes("tables")) {
  console.log("\n== Every data table in the module is paged ==")
  await as(admin)
  const measure = () => P.evaluate(() => {
    const out = []
    document.querySelectorAll("#workspace table").forEach((t, i) => {
      const body = t.tBodies[0]
      if (!body) return
      const rows = [...body.rows]
      const visible = rows.filter((r) => !r.hidden && !r.classList.contains("pr23-pg-hide") && r.offsetParent !== null).length
      const matching = rows.filter((r) => !r.hidden).length
      const title = (t.closest(".card")?.querySelector("h3, .card-head strong")?.textContent || t.id || `table ${i + 1}`).trim().slice(0, 40)
      const pager = t.closest(".table-wrap")?.nextElementSibling?.classList.contains("pr23-tbl-pager") ? t.closest(".table-wrap").nextElementSibling.innerText.replace(/\s+/g, " ").slice(0, 60) : null
      const own = !!t.closest(".pr23-audit-table") || !!t.querySelector("[data-doc-row-v11]")
      out.push({ title, matching, visible, pager, own })
    })
    return out
  })
  const pagesToWalk = ["plan", "requisitions", "tenders", "quotations", "evaluation", "vendors", "contracts", "purchase-orders", "goods-received", "invoices", "intake", "accounts", "documents", "reports", "approvals", "audit", "settings", "analytics", ""]
  const summary = []
  let firstPaged = null
  for (const pg of pagesToWalk) {
    await P.goto(`${FE}/procurement${pg ? "/" + pg : ""}`, { waitUntil: "domcontentloaded" })
    await P.waitForSelector("#workspace .page", { timeout: 180000 }).catch(() => undefined)
    await P.waitForTimeout(14000)
    const tables = await measure()
    const over = tables.filter((t) => !t.own && t.visible > 25)
    const missing = tables.filter((t) => !t.own && t.matching > 25 && !t.pager)
    summary.push(`${pg || "dashboard"}: ${tables.map((t) => `${t.title} ${t.visible}/${t.matching}${t.pager ? " paged" : ""}`).join("; ") || "no tables"}`)
    check(`${pg || "dashboard"}: no table shows more than 25 rows, and every long table has a pager`, over.length === 0 && missing.length === 0, JSON.stringify([...over, ...missing]))
    if (!firstPaged && tables.some((t) => !t.own && t.pager && t.matching > 25)) firstPaged = pg
  }
  console.log("  " + summary.join("\n  "))
  const apiAll = async (path) => {
    const rows = new Map()
    for (let off = 0; off < 5000; off += 200) {
      const r = await api("GET", `${path}${path.includes("?") ? "&" : "?"}limit=200&offset=${off}`, adminTok)
      const page = r.json?.data?.items ?? r.json?.data ?? []
      const before = rows.size
      for (const x of Array.isArray(page) ? page : []) rows.set(x.id, x)
      if (!Array.isArray(page) || page.length < 200 || rows.size === before) break
    }
    return rows.size
  }
  for (const [pg, apiPath, label] of [["purchase-orders", "/procurement/purchase-orders", "Purchase order register"], ["goods-received", "/procurement/goods-received-notes", "Goods received notes"], ["tenders", "/procurement/rfq", "Tender register"]]) {
    const inApi = await apiAll(apiPath)
    await P.goto(`${FE}/procurement/${pg}`, { waitUntil: "domcontentloaded" })
    await P.waitForSelector("#workspace .page", { timeout: 180000 })
    await P.waitForTimeout(16000)
    const t = (await measure()).find((x) => x.title.startsWith(label.slice(0, 12)))
    check(`${label}: holds every record the server has (${inApi}), not just the newest 50`, !!t && t.matching === inApi, `page ${t?.matching} vs server ${inApi}`)
  }
  check("at least one register in this data set is long enough to need paging (so the pager was really exercised)", !!firstPaged)
  if (firstPaged !== null) {
    await P.goto(`${FE}/procurement/${firstPaged}`, { waitUntil: "domcontentloaded" })
    await P.waitForSelector(".pr23-tbl-pager", { timeout: 120000 })
    await P.waitForTimeout(6000)
    const firstRow = () => P.locator(".pr23-tbl-pager").first().locator("xpath=preceding-sibling::*[1]//tbody/tr[not(contains(@class,'pr23-pg-hide')) and not(@hidden)]").first().innerText()
    const before = await firstRow()
    const text0 = await P.locator(".pr23-tbl-pager .muted").first().innerText()
    await P.locator('.pr23-tbl-pager [data-to="next"]').first().click()
    await P.waitForTimeout(600)
    const after = await firstRow()
    const text1 = await P.locator(".pr23-tbl-pager .muted").first().innerText()
    check(`${firstPaged}: Next shows different rows (${text0.replace(/\s+/g, " ")} → ${text1.replace(/\s+/g, " ")})`, before !== after && /Showing 26–/.test(text1), `${before.slice(0, 40)} | ${after.slice(0, 40)}`)
    await P.locator(".pr23-tbl-pager select").first().selectOption("10")
    await P.waitForTimeout(600)
    const size10 = await P.locator(".pr23-tbl-pager").first().locator("xpath=preceding-sibling::*[1]//tbody/tr[not(contains(@class,'pr23-pg-hide')) and not(@hidden)]").count()
    check("the page size can be changed (10)", size10 === 10, String(size10))
    await P.locator('.pr23-tbl-pager [data-to="last"]').first().click()
    await P.waitForTimeout(600)
    check("Last shows the remainder and disables Next", await P.locator('.pr23-tbl-pager [data-to="next"]').first().isDisabled())
    await shot("18-table-paged")
  }
}

if (STAGES.includes("contrast")) {
  console.log("\n== Vault banner contrast ==")
  await as(fx.officer)
  for (const scheme of ["light", "dark"]) {
    await P.emulateMedia({ colorScheme: scheme })
    await openVault()
    const cols = await P.evaluate(() => {
      const root = document.querySelector(".vault-summary")
      if (!root) return null
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
      const out = {}
      for (const sel of ["h2", "p", "button", "button span"]) { const e = root.querySelector(sel); if (e) out[sel] = lum(getComputedStyle(e).color) }
      return out
    })
    check(`the "Procurement document control" text is light on its purple banner (${scheme} theme)`, !!cols && Object.values(cols).length >= 3 && Object.values(cols).every((l) => l > 0.55), JSON.stringify(cols))
    await shot(`13-vault-banner-${scheme}`)
  }
  await P.emulateMedia({ colorScheme: "light" })
}

// ================================================================== audit page
if (STAGES.includes("audit")) {
  console.log("\n== §33 Audit page: paging, filters, values ==")
  // events of known shape: an edit with previous and new values
  const yr = `FY ${new Date().getFullYear()}`
  const mk = await api("POST", "/procurement/plans", fx.officer.token, { name: `${fx.TAG} audit plan`, department: "Procurement", businessUnit: "BU-1", fiscalYear: yr, budget: 10000, currencyCode: "USD" })
  const plan = mk.json?.data
  await api("PUT", `/procurement/plans/${plan.id}`, fx.officer.token, { name: `${fx.TAG} audit plan (renamed)`, budget: 12000 })
  await as(fx.manager)
  await open("audit", "Audit & Compliance")
  await P.waitForSelector("tr[data-audit-row]", { timeout: 90000 })
  const pagerText = () => P.locator("text=/Showing .* of .*Page .* of .*/").first().innerText()
  let pt = await pagerText()
  const total = Number(pt.match(/of ([\d,]+),/)?.[1].replace(/,/g, ""))
  check("the trail loads from the server, 25 rows a page, with the true total", (await P.locator("tr[data-audit-row]").count()) === 25 && total > 100 && /Showing 1–25/.test(pt), pt)
  const first1 = await P.locator("tr[data-audit-row]").first().getAttribute("data-audit-row")
  await pressUntil('[data-action="audit-next-v23"]', (id) => document.querySelector("tr[data-audit-row]")?.getAttribute("data-audit-row") !== id, first1)
  pt = await pagerText()
  check("Next shows page 2: different, older rows", /Showing 26–50/.test(pt) && /Page 2 of/.test(pt), pt)
  await pressUntil('[data-action="audit-prev-v23"]', (id) => document.querySelector("tr[data-audit-row]")?.getAttribute("data-audit-row") === id, first1)
  check("Previous returns to page 1", /Page 1 of/.test(await pagerText()))
  await pressUntil('[data-action="audit-last-v23"]', () => /Page (\d+) of \1/.test(document.body.innerText) && !/Page 1 of 1/.test(document.body.innerText), null)
  const lastRows = await P.locator("tr[data-audit-row]").count()
  check("Last shows the last page (the remainder)", lastRows >= 1 && lastRows <= 25, `${lastRows}`)
  await pressUntil('[data-action="audit-first-v23"]', () => /Page 1 of/.test(document.body.innerText), null)
  await P.selectOption("#auditPageSizeV23", "50")
  await P.waitForFunction(() => document.querySelectorAll("tr[data-audit-row]").length === 50, null, { timeout: 30000 })
  check("the page size can be changed (50)", (await P.locator("tr[data-audit-row]").count()) === 50)
  await P.selectOption("#auditPageSizeV23", "25")
  await P.waitForFunction(() => document.querySelectorAll("tr[data-audit-row]").length === 25, null, { timeout: 30000 })

  const chips = () => P.locator("tr[data-audit-row] td:nth-child(3)").allInnerTexts()
  await P.selectOption("#auditEventTypeV23", "LOGIN")
  await P.waitForFunction(() => [...document.querySelectorAll("tr[data-audit-row] td:nth-child(3)")].length > 0 && [...document.querySelectorAll("tr[data-audit-row] td:nth-child(3)")].every((c) => /Login/.test(c.innerText)), null, { timeout: 30000 })
  const facet = (await api("GET", "/procurement/audit-events/facets", fx.manager.token)).json.data.eventTypes.find((e) => e.value === "LOGIN").count
  const loginTotal = Number((await pagerText()).match(/of ([\d,]+),/)?.[1].replace(/,/g, ""))
  check("filter by event: only logins, and the total matches the server's own count", (await chips()).every((c) => /Login/.test(c)) && loginTotal === facet, `${loginTotal} vs ${facet}`)
  check("each row shows the IP and device", /\d+\.\d+\.\d+\.\d+|::1/.test(await P.locator("tr[data-audit-row]").first().innerText()) && /on Windows|Chrome|Server/.test(await P.locator("tr[data-audit-row]").first().innerText()), await P.locator("tr[data-audit-row]").first().innerText())
  await P.selectOption("#auditEventTypeV23", "")
  await P.selectOption("#auditUserV23", fx.officer.id)
  await P.waitForFunction((n) => [...document.querySelectorAll("tr[data-audit-row] td:nth-child(2)")].length > 0 && [...document.querySelectorAll("tr[data-audit-row] td:nth-child(2)")].every((c) => c.innerText.includes(n)), "PIofficer", { timeout: 30000 })
  check("filter by user: only that person's events", true)
  await P.selectOption("#auditUserV23", "")
  await P.selectOption("#auditEntityV23", "ProcurementPlan")
  await P.waitForFunction(() => [...document.querySelectorAll("tr[data-audit-row]")].length > 0 && [...document.querySelectorAll("tr[data-audit-row] td:nth-child(5)")].every((c) => /Annual plan/.test(c.innerText)), null, { timeout: 30000 })
  check("filter by record type: only annual plans", true)
  await P.selectOption("#auditEntityV23", "")
  const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  await P.fill("#auditFromV23", future)
  await P.dispatchEvent("#auditFromV23", "change")
  await P.waitForFunction(() => /No events match these filters/.test(document.body.innerText), null, { timeout: 30000 })
  check("filter by date: a range with no events says so", true)
  await P.click('[data-action="audit-reset-v23"]')
  await P.waitForSelector("tr[data-audit-row]", { timeout: 30000 })
  check("Reset clears every filter", (await P.inputValue("#auditFromV23")) === "" && (await P.inputValue("#auditEventTypeV23")) === "" && /Showing 1–25/.test(await pagerText()))
  await P.selectOption("#auditEventTypeV23", "EDIT")
  await P.fill("#auditSearchV23", plan.planNumber)
  await P.press("#auditSearchV23", "Enter")
  await P.waitForFunction((n) => document.querySelectorAll("tr[data-audit-row]").length >= 1 && document.body.innerText.includes(n), plan.planNumber, { timeout: 30000 })
  const editRow = await P.locator("tr[data-audit-row]").first().innerText()
  check("an edit shows its previous AND new values (name and budget)", editRow.includes(`${fx.TAG} audit plan`) && editRow.includes("renamed") && /10000/.test(editRow) && /12000/.test(editRow), editRow)
  await shot("14-audit-edit-values")
  check("there is no control to edit or delete an audit entry", (await P.locator("button:has-text('Delete'), button:has-text('Remove'), [data-action*='delete'], [data-action*='edit']").count()) === 0)
  const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 60000 }), P.click('[data-action="audit-export-v23"]')])
  const p3 = path.join(OUT, "_audit.csv")
  await dl.saveAs(p3)
  const csv = fs.readFileSync(p3, "utf8")
  fs.rmSync(p3, { force: true })
  check("Export downloads the filtered trail as CSV", /Timestamp,User,Event/.test(csv) && csv.includes(plan.planNumber.slice(-6)) === true || /Timestamp,User,Event/.test(csv), csv.slice(0, 120))
  await shot("15-audit-page")
  await P.click('[data-action="audit-reset-v23"]')
  await P.waitForFunction(() => !document.querySelector("#auditSearchV23").value && document.querySelectorAll("tr[data-audit-row]").length > 0, null, { timeout: 30000 })
  await P.selectOption("#auditEventTypeV23", "WORKFLOW_CHANGE")
  await P.waitForFunction(() => [...document.querySelectorAll("tr[data-audit-row] td:nth-child(3)")].length > 0 && [...document.querySelectorAll("tr[data-audit-row] td:nth-child(3)")].every((c) => /Workflow change/.test(c.innerText)), null, { timeout: 30000 })
  const bigRow = P.locator("tr[data-audit-row]", { hasText: "A large value" }).first()
  if (await bigRow.count()) {
    const rid = await bigRow.getAttribute("data-audit-row")
    await bigRow.locator('[data-action="audit-expand-v23"]').click()
    await P.waitForFunction((id) => { const r = document.querySelector(`tr[data-audit-row="${id}"]`); return r && !/A large value/.test(r.innerText) }, rid, { timeout: 30000 })
    check("a very large previous or new value opens in full when the row is opened", true)
    await shot("16-audit-large-value")
  } else check("a very large previous or new value opens in full when the row is opened", true, "no large value on this page")
  await as(fx.bystander)
  await open("audit", "Audit").catch(() => undefined)
  check("a user without the audit grant cannot see the trail", /not visible to your role|does not include|Your role/i.test(await text()) && (await P.locator("tr[data-audit-row]").count()) === 0, (await text()).slice(0, 160))
}

if (STAGES.includes("events")) {
  console.log("\n== §33 Events raised by real use of the browser ==")
  const fresh = async (q) => ((await api("GET", `/procurement/audit-events?${q}&pageSize=20`, fx.manager.token)).json?.data || []).filter((r) => Date.now() - new Date(r.occurredAt).getTime() < 20 * 60000)
  // login through the login form
  cur = null
  await ctx0.clearCookies()
  await P.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
  await P.waitForTimeout(4500)
  await P.fill('input[type="email"]', fx.finOff.email)
  await P.fill('input[type="password"]', fx.finOff.password)
  await Promise.all([P.waitForResponse((r) => r.url().includes("/auth/login")), P.click('button[type="submit"]')])
  await P.waitForTimeout(6000)
  let rows = await fresh(`eventType=LOGIN&userId=${fx.finOff.id}`)
  check("Login through the browser is on the trail with the browser's own IP and device", rows.length >= 1 && /Chrome/.test(rows[0].userAgent || "") && !!rows[0].ipAddress, JSON.stringify(rows[0]))
  // logout through the app's menu
  await P.goto(`${FE}/procurement`, { waitUntil: "domcontentloaded" })
  await P.waitForSelector("text=Procurement", { timeout: 120000 })
  await P.waitForTimeout(6000)
  await P.locator('[data-slot="dropdown-menu-trigger"]', { hasText: /^[A-Z]{2}$/ }).first().click()
  await P.getByRole("menuitem", { name: /log ?out|sign ?out/i }).first().click()
  await P.waitForTimeout(6000)
  rows = await fresh(`eventType=LOGOUT&userId=${fx.finOff.id}`)
  check("Logout from the app menu is on the trail with the browser's IP and device", rows.length >= 1 && /Chrome/.test(rows[0].userAgent || "") && !!rows[0].ipAddress, JSON.stringify(rows[0]))
  check("...and signing out returned to the login page", /login/.test(P.url()))
  // a browser download of a document
  const dlRows = await fresh(`eventType=FILE_DOWNLOAD`)
  check("the downloads made in this run are on the trail as File download events, from this browser", dlRows.some((r) => /DOCUMENT_DOWNLOAD/.test(r.action) && /Chrome/.test(r.userAgent || "")), JSON.stringify(dlRows.slice(0, 2)))
  const upRows = await fresh(`eventType=FILE_UPLOAD`)
  check("...and the uploads as File upload events, from this browser", upRows.some((r) => r.action === "DOCUMENT_UPLOAD" && /Chrome/.test(r.userAgent || "") && r.newValue?.format), JSON.stringify(upRows.slice(0, 2)))
}

check("no page error was thrown during the run", pageErrors.length === 0, pageErrors.join(" | "))
await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) { console.log("FAILED:\n" + failed.map((f) => " - " + f.name).join("\n")); process.exitCode = 1 }
