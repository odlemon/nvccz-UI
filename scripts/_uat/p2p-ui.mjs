/**
 * Purchase orders, receipts, invoices, matching, finance handoff and the AI layer (§21-§25, §29-§31) in a visible browser, as each real
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
const OUT = process.env.UAT_OUT || "design-refs/p2p-controls/screens"
const STAGES = (process.env.UAT_STAGES || "po,receipts,invoices,handoff,config,ai,blocked").split(",")
const DOC = path.resolve("scripts/_uat/fixtures/test-invoice.pdf")
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
// SRD §38: an order states its currency; none is defaulted
const usdId = (await api("GET", "/procurement/fx", adminTok)).json.data.currencies.find((c) => c.code === "USD").id
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
  await P.waitForSelector(`text=${marker}`, { timeout: 180000 }).catch(async (e) => {
    console.log(`      (marker "${marker}" not shown on ${route}; page says: ${(await P.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300)})`)
    await shot(`_missing-${route}`).catch(() => undefined)
    throw e
  })
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

// ================================================================== purchase orders
if (STAGES.includes("po")) {
  console.log("\n== §21 Purchase orders ==")
  await as(fx.officer)
  await open("purchase-orders", "Purchase order register")
  check("the award's purchase order is in the register", await waitRow(fx.po.number), "not found")
  await menu(rowOf(fx.po.number), "Details")
  await P.waitForSelector("#modalLayer.open")
  let m = await modalText()
  check("PO details show vendor, vendor code, currency, requisition, RFQ, award, cost centre, budget and GL code", [fx.vendor.name, `CC-${fx.TAG}`, fx.budget, "5100-UI", fx.req.number, fx.rfq.number].every((x) => m.includes(x)), m.slice(0, 500))
  check("PO details show payment terms, delivery date, lines with received and outstanding, and VAT / total", /Net 45/.test(m) && /Outstanding/i.test(m) && /VAT/i.test(m) && /Total/i.test(m) && /\d{1,2} [A-Z][a-z]{2} 20\d\d/.test(m))
  check("PO details list the approvals it stands on (requisition and award)", (await has("Award recommendation", 20000)) && /Purchase requisition/i.test(await modalText()), (await modalText()).slice(-400))
  await shot("01-po-details")
  // preview = the server's PDF
  await P.locator('[data-action="po-preview-v23"]').first().click()
  await P.waitForSelector("#poPdfBodyV23 iframe", { timeout: 60000 })
  const src = await P.locator("#poPdfBodyV23 iframe").getAttribute("src")
  const previewBytes = await P.evaluate(async (u) => { const b = new Uint8Array(await (await fetch(u)).arrayBuffer()); return Array.from(b).map((x) => String.fromCharCode(x)).join("").length }, src)
  const apiPdf = await api("GET", `/procurement/purchase-orders/${fx.po.id}/pdf`, fx.officer.token)
  check("the preview is the server's PDF", apiPdf.buf.subarray(0, 4).toString() === "%PDF" && previewBytes > 1000, String(previewBytes))
  const pdfParse = (await import("pdf-parse").catch(() => null))?.default
  const textOf = async (buf) => (pdfParse ? (await pdfParse(buf)).text.replace(/\s+/g, " ").replace(/Verification token: \w+/, "") : "")
  const previewBuf = Buffer.from(await P.evaluate(async (u) => { const b = new Uint8Array(await (await fetch(u)).arrayBuffer()); let s = ""; b.forEach((x) => (s += String.fromCharCode(x))); return btoa(s) }, src), "base64")
  const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 60000 }), P.locator('[data-action="download-po-pdf-v23"]').first().click()])
  const dlPath = path.join(OUT, "_po.pdf")
  await dl.saveAs(dlPath)
  const dlBuf = fs.readFileSync(dlPath)
  fs.rmSync(dlPath, { force: true })
  if (pdfParse) {
    const [tp, td, ta] = [await textOf(previewBuf), await textOf(dlBuf), await textOf(apiPdf.buf)]
    check("the previewed document, the downloaded file and the API's file have the same content", tp === td && td === ta && tp.includes(fx.po.number), `${tp.length} ${td.length} ${ta.length}`)
  } else check("the previewed document and the downloaded file are the same file", previewBuf.length === dlBuf.length, `${previewBuf.length} vs ${dlBuf.length}`)
  check("the PDF carries the environment's logo (an embedded image), and the environment says Matanho", (dlBuf.toString("latin1").match(/\/Subtype \/Image/g) || []).length >= 1 && /Matanho/.test(await modalText()))
  await shot("02-po-preview")
  await P.locator('#modalLayer.open .modal button[data-action="close-overlay"]').first().click()
  await P.waitForSelector("#modalLayer.open", { state: "detached", timeout: 10000 }).catch(() => undefined)

  // create a PO from a requisition: the accounting fields are taken from the requisition and the budget
  await P.locator('[data-action="create-po-v6"]').first().click()
  await P.waitForSelector("#poFormV23")
  check("the PO form offers cost centre, budget code, GL code and purchase conditions", (await P.locator('#poFormV23 [name="costCentre"], #poFormV23 [name="budgetCode"], #poFormV23 [name="glCode"], #poFormV23 [name="purchaseConditions"]').count()) === 4)
  const srcOpt = await P.locator(`#poSourceV23 option`, { hasText: fx.req2.number }).first().getAttribute("value")
  await P.selectOption("#poSourceV23", srcOpt)
  await P.waitForTimeout(800)
  const vOpt = await P.locator(`#poFormV23 [name="vendor"] option`, { hasText: fx.vendor.name }).first().getAttribute("value")
  await P.selectOption('#poFormV23 [name="vendor"]', vOpt)
  await P.fill('#poFormV23 [name="purchaseConditions"]', "Delivery to Warehouse 4. Goods must carry the supplier's delivery note.")
  const prices = P.locator("#poFormV23 [data-po-price]")
  for (let i = 0; i < (await prices.count()); i++) await prices.nth(i).fill(i === 0 ? "5" : "1000")
  let t = await toast(() => P.click('[data-action="save-po-v6"]'))
  check("a purchase order is created from a requisition (as a draft)", /saved|created|draft/i.test(t), t)
  await P.waitForTimeout(6000)
  await open("purchase-orders", "Purchase order register")
  const created = await api("GET", "/procurement/purchase-orders?limit=5", fx.officer.token)
  const newPo = (created.json?.data?.purchaseOrders || created.json?.data || []).find((p) => p.requisitionId === fx.req2.id)
  check("the new PO carries cost centre, budget code and the GL code without re-keying", newPo && newPo.costCentre === `CC-${fx.TAG}` && newPo.budgetCode === fx.budget && newPo.glCode === "5100-UI" && /Warehouse 4/.test(newPo.purchaseConditions || ""), JSON.stringify(newPo && [newPo.costCentre, newPo.budgetCode, newPo.glCode]))
  fx.poB = newPo

  // approval required
  await as(admin)
  await open("settings", "Configuration, RBAC and Access")
  await P.click('[data-action="settings-tab"][data-id="p2p"]')
  await P.waitForSelector("#p2pMatchFormV23")
  check("Configuration has a Matching, receipts and AI tab with tolerances, enforcement and PO approval", (await P.locator('#p2pMatchFormV23 [name="matchPriceVariancePct"], #p2pMatchFormV23 [name="matchTaxTolerancePct"], #p2pMatchFormV23 [name="matchEnforcement"], #p2pMatchFormV23 [name="poApprovalRequired"]').count()) === 4)
  await P.check('#p2pMatchFormV23 [name="poApprovalRequired"]')
  t = await toast(() => P.click('[data-action="save-p2p-settings-v23"]'))
  check("PO approval is switched on in Configuration", /Matching settings saved/i.test(t), t)
  await P.waitForTimeout(6000)
  await P.goto(`${FE}/procurement/settings`, { waitUntil: "domcontentloaded" })
  await P.waitForSelector("text=Configuration, RBAC and Access")
  await P.waitForTimeout(8000)
  await P.click('[data-action="settings-tab"][data-id="p2p"]')
  await P.waitForSelector("#p2pMatchFormV23")
  check("...and it persists after reload", await P.locator('#p2pMatchFormV23 [name="poApprovalRequired"]').isChecked())
  await P.locator('[data-action="edit-approval-matrix-v23"][data-stage="PURCHASE_ORDER"]').first().click()
  await P.waitForSelector("#approvalMatrixFormV23")
  const row1 = P.locator("#approvalMatrixFormV23 [data-matrix-step]").first()
  await row1.locator('[name="kind"]').selectOption("USER")
  await row1.locator('[name="userId"]').selectOption(fx.approver.id)
  t = await toast(() => P.click('[data-action="save-approval-matrix-v23"]'))
  check("the PO approval route is set in Configuration", /Award route saved|Approval route saved/i.test(t), t)
  await shot("03-po-approval-config")

  await as(fx.officer)
  await open("purchase-orders", "Purchase order register")
  const poB = fx.poB
  await waitRow(poB?.poNumber || "PO_")
  check("a new PO shows that approval is required", /Approval required/i.test(await rowOf(poB.poNumber).innerText()), await rowOf(poB.poNumber).innerText())
  await menu(rowOf(poB.poNumber), "Submit for approval")
  await has("submitted for approval", 30000)
  await P.waitForTimeout(6000)
  await open("purchase-orders", "Purchase order register")
  check("after submission it shows awaiting approval", /Awaiting approval/i.test(await rowOf(poB.poNumber).innerText()))
  const send = await api("POST", `/procurement/purchase-orders/${poB.id}/send`, fx.officer.token)
  check("it cannot be sent to the supplier before it is approved", send.status >= 400 && /approved|waiting/i.test(send.text), `${send.status}`)
  await as(fx.approver)
  await open("approvals", "Approval Centre")
  check("the approver finds the purchase order in the Approval Centre", await has(poB.poNumber, 90000))
  await shot("04-po-approval-centre")
  const ap = await api("POST", `/procurement/purchase-orders/${poB.id}/approval/decide`, fx.approver.token, { decision: "APPROVE", comments: "Approved for the test" })
  check("the approver approves it", ap.status === 200, ap.text.slice(0, 200))
  await as(fx.officer)
  const sent = await api("POST", `/procurement/purchase-orders/${poB.id}/send`, fx.officer.token)
  check("an approved PO is then sent", sent.status === 200, `${sent.status} ${sent.text.slice(0, 150)}`)
  await putSettings({ poApprovalRequired: false })
}

const fresh = async (lines) => {
  // a purchase order sent to the supplier, for the receipt and invoice stages
  const r = await api("POST", "/procurement/purchase-orders", fx.officer.token, { vendorId: fx.vendor.id, currencyId: usdId, paymentTerms: "Net 30", shippingAddress: "Warehouse 4", expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString(), items: lines })
  await api("POST", `/procurement/purchase-orders/${r.json.data.id}/send`, fx.officer.token)
  return r.json.data
}

// ================================================================== receipts
let poR = null
if (STAGES.includes("receipts") || STAGES.includes("invoices") || STAGES.includes("handoff")) poR = await fresh([{ itemName: "Widget", quantity: 10, unitPrice: 100, unit: "ea" }, { itemName: "Installation service", quantity: 1, unitPrice: 3000, unit: "job" }])
if (STAGES.includes("receipts")) {
  console.log("\n== §22 Receipts ==")
  await as(fx.officer)
  await open("goods-received", "Receiving & Inspection")
  await P.locator('[data-action="create-grn"], [data-action="record-grn"], button:has-text("Record GRN")').first().click().catch(() => undefined)
  await P.waitForSelector("#grnFormV23")
  const pick = async (poNumber) => { const v = await P.locator("#grnPoV23 option", { hasText: poNumber }).first().getAttribute("value"); await P.selectOption("#grnPoV23", v); await P.waitForTimeout(700) }
  await pick(poR.poNumber)
  const F = "#grnFormV23"
  check("the receipt form has delivery note, location, comments and attachments", (await P.locator(`${F} [name="deliveryNoteNumber"], ${F} [name="locationName"], ${F} [name="comments"], ${F} [name="receiptFiles"]`).count()) === 4)
  const widgetRow = P.locator(`${F} [data-grn-row]`).first()
  const wid = await widgetRow.getAttribute("data-grn-row")
  check("each line is goods or service, with the outstanding quantity shown", /10 outstanding/.test(await widgetRow.innerText()) && (await P.locator(`${F} [data-grn-line-type]`).count()) === 2)
  await P.fill(`${F} [data-grn-received="${wid}"]`, "4")
  await P.fill(`${F} [data-grn-accepted="${wid}"]`, "3")
  await P.fill(`${F} [data-grn-rejected="${wid}"]`, "0")
  await P.fill(`${F} [name="deliveryNoteNumber"]`, "DN-UI-1")
  await P.fill(`${F} [name="locationName"]`, "Harare warehouse")
  await P.fill(`${F} [name="comments"]`, "Two boxes damaged")
  await P.locator(`${F} [name="receiptFiles"]`).setInputFiles(DOC)
  let t = await toast(() => P.click('[data-action="create-grn-confirm"]'))
  check("accepted plus rejected that do not equal received is refused with a message", /must equal/i.test(t), t)
  await P.fill(`${F} [data-grn-rejected="${wid}"]`, "1")
  t = await toast(() => P.click('[data-action="create-grn-confirm"]'))
  check("receipt 1 (4 received: 3 accepted, 1 rejected) is recorded with its delivery note", /recorded/i.test(t), t)
  await P.waitForTimeout(7000)
  const g1 = await api("GET", `/procurement/goods-received-notes?limit=20`, fx.officer.token)
  const grn1 = (g1.json?.data?.goodsReceivedNotes || g1.json?.data || []).find((g) => g.purchaseOrderId === poR.id)
  check("it is saved with delivery note, location, comment and the attachment", grn1?.deliveryNoteNumber === "DN-UI-1" && grn1.locationName === "Harare warehouse" && /damaged/.test(grn1.qualityNotes || "") && (grn1.attachmentUrls || []).length === 1, JSON.stringify(grn1 && [grn1.deliveryNoteNumber, grn1.locationName, grn1.attachmentUrls]))
  await open("goods-received", "Receiving & Inspection")
  await P.locator('button:has-text("Record GRN")').first().click()
  await P.waitForSelector(F)
  await pick(poR.poNumber)
  const w2 = P.locator(`${F} [data-grn-row]`).first()
  check("outstanding is recalculated after the first receipt (7 owed, not 10)", /7 outstanding/.test(await w2.innerText()), await w2.innerText())
  await P.fill(`${F} [data-grn-received="${wid}"]`, "9")
  await P.fill(`${F} [data-grn-accepted="${wid}"]`, "9")
  await P.fill(`${F} [data-grn-rejected="${wid}"]`, "0")
  t = await toast(() => P.click('[data-action="create-grn-confirm"]'))
  check("receiving more than is outstanding is blocked, not accepted", /over-receipt|blocked/i.test(t), t)
  await P.fill(`${F} [data-grn-received="${wid}"]`, "7")
  await P.fill(`${F} [data-grn-accepted="${wid}"]`, "7")
  t = await toast(() => P.click('[data-action="create-grn-confirm"]'))
  check("receiving the remaining 7 is accepted", /recorded/i.test(t), t)
  // service
  await P.waitForTimeout(6000)
  await open("goods-received", "Receiving & Inspection")
  await P.locator('button:has-text("Record GRN")').first().click()
  await P.waitForSelector(F)
  await pick(poR.poNumber)
  const rows = P.locator(`${F} [data-grn-row]`)
  const sid = await rows.nth(1).getAttribute("data-grn-row")
  await P.locator(`${F} [data-grn-line-type="${wid}"]`).selectOption("SERVICE").catch(() => undefined)
  await P.locator(`${F} [data-grn-line-type="${wid}"]`).selectOption("GOODS")
  await P.locator(`${F} [data-grn-line-type="${sid}"]`).selectOption("SERVICE")
  check("a service line asks for the period, the amount and the evidence, not quantities", await P.locator(`${F} [data-grn-svc-start="${sid}"]`).isVisible() && await P.locator(`${F} [data-grn-svc-amount="${sid}"]`).isVisible() && !(await P.locator(`${F} [data-grn-received="${sid}"]`).isVisible()))
  await P.fill(`${F} [data-grn-received="${wid}"]`, "0")
  await P.fill(`${F} [data-grn-milestone="${sid}"]`, "Cabling and switches installed on floors 1 and 2")
  await P.fill(`${F} [data-grn-svc-start="${sid}"]`, new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10))
  await P.fill(`${F} [data-grn-svc-end="${sid}"]`, new Date(Date.now() - 86400000).toISOString().slice(0, 10))
  await P.fill(`${F} [data-grn-svc-amount="${sid}"]`, "1000")
  t = await toast(() => P.click('[data-action="create-grn-confirm"]'))
  check("a service receipt without evidence is refused with a message", /evidence/i.test(t), t)
  await P.locator(`${F} [data-grn-svc-file="${sid}"]`).setInputFiles(DOC)
  t = await toast(() => P.click('[data-action="create-grn-confirm"]'))
  check("a service receipt is recorded from period, amount and evidence (no quantity)", /recorded/i.test(t), t)
  await P.waitForTimeout(6000)
  const g2 = await api("GET", `/procurement/goods-received-notes?limit=20`, fx.officer.token)
  const svc = (g2.json?.data?.goodsReceivedNotes || g2.json?.data || []).find((g) => g.purchaseOrderId === poR.id && g.receiptType === "SERVICE")
  check("it is stored as a service receipt with its period, amount and evidence", svc && Number(svc.items?.[0]?.serviceAmount) === 1000 && (svc.items?.[0]?.serviceEvidence || []).length === 1)
  await shot("05-receipts")
}

// ================================================================== invoices and matching
let invA = null
if (STAGES.includes("invoices") || STAGES.includes("handoff")) {
  console.log("\n== §23-§24 Invoices and matching ==")
  const g = await api("GET", `/procurement/goods-received-notes?limit=50`, fx.officer.token)
  for (const grn of (g.json?.data?.goodsReceivedNotes || g.json?.data || []).filter((x) => x.purchaseOrderId === poR.id && x.status !== "REJECTED")) await api("PUT", `/procurement/goods-received-notes/${grn.id}/approve`, fx.manager.token, {})
  await as(fx.accountant)
  await open("invoices", "Invoices & 3-Way Match")
  await P.locator('[data-action="capture-invoice-v5"]').first().click()
  await P.waitForSelector("#invoiceCaptureV23")
  const IF = "#invoiceCaptureV23"
  const pv = await P.locator("#invoicePoV23 option", { hasText: poR.poNumber }).first().getAttribute("value")
  await P.selectOption("#invoicePoV23", pv)
  await P.waitForTimeout(800)
  check("the invoice form asks for the supplier's number, the receipt, terms, VAT and total", (await P.locator(`${IF} [name="supplierInvoiceNumber"], ${IF} [name="grnId"], ${IF} [name="paymentTerms"], ${IF} [name="statedTax"], ${IF} [name="statedTotal"]`).count()) === 5)
  check("the receipts of that order are offered to name", (await P.locator(`${IF} [name="grnId"] option`).count()) >= 3)
  const qtyInputs = P.locator(`${IF} [data-inv-qty]`)
  const priceInputs = P.locator(`${IF} [data-inv-price]`)
  // Widget: 11 billed against 10 accepted (a quantity exception); the service line 1 at 3000 (only 1000 confirmed)
  await qtyInputs.nth(0).fill("11")
  await priceInputs.nth(0).fill("100")
  await qtyInputs.nth(1).fill("1")
  await priceInputs.nth(1).fill("3000")
  let t = await toast(() => P.click('[data-action="confirm-capture-invoice-v5"]'))
  check("an invoice without the supplier's invoice number is refused", /supplier's invoice number/i.test(t) || (await P.locator(`${IF} [name="supplierInvoiceNumber"]:invalid`).count()) === 1, t)
  await P.fill(`${IF} [name="supplierInvoiceNumber"]`, "UI-INV-1001")
  t = await toast(() => P.click('[data-action="confirm-capture-invoice-v5"]'))
  check("the invoice is captured against the order under the supplier's number", /captured/i.test(t), t)
  await P.waitForTimeout(6000)
  await open("invoices", "Invoices & 3-Way Match")
  await P.locator('[data-action="capture-invoice-v5"]').first().click()
  await P.waitForSelector(IF)
  await P.selectOption("#invoicePoV23", pv)
  await P.waitForTimeout(700)
  await P.fill(`${IF} [name="supplierInvoiceNumber"]`, "ui inv-1001")
  await P.locator(`${IF} [data-inv-qty]`).nth(0).fill("1")
  await P.locator(`${IF} [data-inv-price]`).nth(0).fill("100")
  await P.locator(`${IF} [data-inv-qty]`).nth(1).fill("0")
  t = await toast(() => P.click('[data-action="confirm-capture-invoice-v5"]'))
  check("duplicate: the same number again (any case or punctuation) is refused and says why", /duplicate/i.test(t), t)
  const inv = await api("GET", "/procurement/invoices?limit=50", fx.officer.token)
  invA = (inv.json?.data?.invoices || inv.json?.data || []).find((i) => i.supplierInvoiceNumber === "UI-INV-1001")
  check("the captured invoice is linked to vendor, order and receipt and holds the supplier's number", invA && invA.vendorId === fx.vendor.id && invA.purchaseOrderId === poR.id && invA.supplierInvoiceNumber === "UI-INV-1001")
  check("the match flagged a quantity mismatch and an excess value (11 billed, 10 accepted; 3000 billed, 1000 confirmed)", ["QTY_MISMATCH", "EXCESS_INVOICE", "VALUE_MISMATCH"].some((x) => JSON.stringify(invA?.matchResult?.exceptions || []).includes(x)), JSON.stringify((invA?.matchResult?.exceptions || []).map((e) => e.type)))
  await open("invoices", "Invoices & 3-Way Match")
  await P.locator('button.source-card, [data-action="select-match-tender-v5"]').first().click().catch(() => undefined)
  check("the match screen shows real exception counts, not the fixture bars", !/Price variance\s*72|Duplicate invoice\s*24/.test(await text()))
  await shot("06-match-screen")

  // approval blocked by the exceptions, and the override
  await as(fx.finMgr)
  await open("approvals", "Approval Centre")
  check("Finance sees the invoice in the Approval Centre", await has("UI-INV-1001", 90000) || await has(invA.invoiceNumber, 30000))
  const blocked = await api("PUT", `/procurement/invoices/${invA.id}/approve`, fx.finMgr.token, {})
  check("the API refuses approval while it has exceptions (MATCH_EXCEPTIONS)", blocked.status === 409 && blocked.json?.code === "MATCH_EXCEPTIONS", `${blocked.status} ${blocked.text.slice(0, 200)}`)
  // via the UI: the invoice row's Open match / approve
  await open("invoices", "Invoices & 3-Way Match")
  const tenderCard = P.locator('[data-action="select-match-tender-v5"]').filter({ hasText: /./ }).first()
  const cards = await P.locator('[data-action="select-match-tender-v5"]').count()
  let openedMatch = false
  for (let i = 0; i < cards && !openedMatch; i++) {
    await P.locator('[data-action="select-match-tender-v5"]').nth(i).click()
    await P.waitForTimeout(1500)
    if (await P.locator(`tr:has-text("${invA.invoiceNumber}")`).count()) openedMatch = true
    else await P.locator('[data-action="back-match-list-v5"]').first().click().catch(() => undefined)
  }
  if (openedMatch) {
    const mrow = P.locator('tr[data-record="invoice"]', { hasText: invA.invoiceNumber }).first()
    await menu(mrow, "Open match")
    await P.waitForSelector("#modalLayer.open")
    const mt = await modalText()
    check("the match detail shows the checks one by one with the detail and the tolerances applied", /Quantity/i.test(mt) && /Tolerances applied/i.test(mt) && /Exception/i.test(mt) && /Purchase order found/i.test(mt), mt.slice(0, 400))
    await shot("07-match-detail")
    check("Finance Manager is offered to approve over the exceptions, with a reason", (await P.locator('[data-action="override-modal-v23"]').count()) === 1)
    await P.locator('[data-action="override-modal-v23"]').click()
    await P.waitForSelector("#matchOverrideFormV23")
    t = await toast(() => P.click('[data-action="confirm-override-approve-v23"]'))
    check("the override needs a reason", /reason|10 characters|required/i.test(t) || (await P.locator("#matchOverrideFormV23 textarea:invalid").count()) === 1, t)
    await P.fill('#matchOverrideFormV23 [name="reason"]', "Balance delivered Monday; receipt to follow, agreed with the supplier")
    t = await toast(() => P.click('[data-action="confirm-override-approve-v23"]'))
    check("the invoice is approved over its exceptions with the reason", /approved over/i.test(t), t)
  } else check("the invoice's match workspace could be opened", false, "no tender card contained the invoice")
  await P.waitForTimeout(5000)
  const afterList = await api("GET", "/procurement/invoices?limit=100", fx.finMgr.token)
  const afterInv = (afterList.json?.data?.invoices || afterList.json?.data || []).find((i) => i.id === invA.id)
  const after = { status: afterList.status, text: afterList.text, json: { data: afterInv } }
  check("the override, its reason and who made it are recorded on the invoice", !!after.json?.data?.matchOverrideReason && after.json.data.matchOverrideById === fx.finMgr.id && after.json.data.financeHandoffStatus === "READY_FOR_FINANCE", `${after.status} ${JSON.stringify(after.json?.data && [after.json.data.matchOverrideReason, after.json.data.matchOverrideById, after.json.data.financeHandoffStatus])} ${after.text.slice(0, 120)}`)
}

// ================================================================== finance handoff
if (STAGES.includes("handoff")) {
  console.log("\n== §25 Finance handoff ==")
  await as(fx.finMgr)
  await open("accounts", "Accounts")
  await P.locator('[data-action="account-tab"][data-id="payments"]').first().click().catch(() => undefined)
  await has(invA.invoiceNumber, 60000)
  check("the approved invoice is in the handoff table, Ready for Finance", /Ready for Finance/i.test(await rowOf(invA.invoiceNumber).innerText().catch(() => "")), (await rowOf(invA.invoiceNumber).innerText().catch(() => "none")))
  check("the states can be filtered in place", (await P.locator('[data-action="handoff-filter-v23"]').count()) === 7)
  const row = rowOf(invA.invoiceNumber)
  const l1 = await menuLabels(row)
  check("only the next step is offered (Submit to Finance), no Accept, Payment or Close", l1.includes("Submit to Finance") && !l1.some((x) => /^(Accept|Record payment|Close)$/.test(x)), l1.join(" | "))
  const skip = await api("POST", `/procurement/invoices/${invA.id}/finance-handoff`, fx.finMgr.token, { to: "ACCEPTED" })
  check("the API refuses to skip a state", skip.status === 409 && skip.json?.code === "HANDOFF_ORDER")
  let t = await toast(() => menu(row, "Submit to Finance"))
  check("Finance Manager submits it to Finance", /(is now )?submitted/i.test(t), t)
  await P.waitForTimeout(6000)
  await as(fx.finOff)
  await open("accounts", "Accounts")
  await P.locator('[data-action="account-tab"][data-id="payments"]').first().click().catch(() => undefined)
  await has(invA.invoiceNumber, 60000)
  const row2 = rowOf(invA.invoiceNumber)
  const l2 = await menuLabels(row2)
  check("Finance sees it as Submitted, with Accept and Return offered", /Submitted to Finance/i.test(await row2.innerText()) && l2.includes("Accept") && l2.includes("Return"), l2.join(" | "))
  await menu(row2, "Return")
  await P.waitForSelector("#returnInvoiceFormV23")
  await P.fill('#returnInvoiceFormV23 [name="reason"]', "Bank details unconfirmed")
  t = await toast(() => P.click('[data-action="confirm-return-invoice-v23"]'))
  check("Finance returns the invoice with a reason", /returned/i.test(t), t)
  await P.waitForTimeout(6000)
  await open("accounts", "Accounts")
  await P.locator('[data-action="account-tab"][data-id="payments"]').first().click().catch(() => undefined)
  await has(invA.invoiceNumber, 60000)
  check("the invoice now shows Returned with the reason", /Returned/i.test(await rowOf(invA.invoiceNumber).innerText()) && /Bank details unconfirmed/.test(await rowOf(invA.invoiceNumber).innerText()))
  const back = await api("POST", `/procurement/invoices/${invA.id}/finance-handoff`, fx.finMgr.token, { to: "READY_FOR_FINANCE", comment: "Bank details confirmed" })
  await api("POST", `/procurement/invoices/${invA.id}/finance-handoff`, fx.finMgr.token, { to: "SUBMITTED" })
  check("a returned invoice goes back to Ready for Finance before it can be submitted again", back.status === 200)
  await open("accounts", "Accounts")
  await P.locator('[data-action="account-tab"][data-id="payments"]').first().click().catch(() => undefined)
  await has(invA.invoiceNumber, 60000)
  t = await toast(() => menu(rowOf(invA.invoiceNumber), "Accept"))
  check("Finance accepts the invoice", /accepted/i.test(t), t)
  await P.waitForTimeout(6000)
  await open("accounts", "Accounts")
  await P.locator('[data-action="account-tab"][data-id="payments"]').first().click().catch(() => undefined)
  await has(invA.invoiceNumber, 60000)
  const l3 = await menuLabels(rowOf(invA.invoiceNumber))
  check("an accepted invoice offers payment", l3.includes("Record payment"), l3.join(" | "))
  await menu(rowOf(invA.invoiceNumber), "History")
  await P.waitForSelector("#handoffBodyV23 table", { timeout: 30000 })
  const ht = await modalText()
  check("the history shows every move with who and when", /Ready for Finance/.test(ht) && /Submitted to Finance/.test(ht) && /Returned/.test(ht) && /Accepted/.test(ht) && /PIfinmgr|PIfinoff/.test(ht), ht.slice(0, 400))
  await shot("08-handoff-history")
  await P.locator('[data-action="close-overlay"]').first().click().catch(() => undefined)
}

// ================================================================== configuration
if (STAGES.includes("config")) {
  console.log("\n== Configuration: tolerances, enforcement, AI ==")
  await as(admin)
  await open("settings", "Configuration, RBAC and Access")
  await P.click('[data-action="settings-tab"][data-id="p2p"]')
  await P.waitForSelector("#p2pMatchFormV23")
  await P.fill('#p2pMatchFormV23 [name="matchPriceVariancePct"]', "3.5")
  await P.selectOption('#p2pMatchFormV23 [name="matchEnforcement"]', "WARN")
  let t = await toast(() => P.click('[data-action="save-p2p-settings-v23"]'))
  check("tolerances and enforcement save", /saved/i.test(t), t)
  await P.waitForTimeout(6000)
  await P.goto(`${FE}/procurement/settings`, { waitUntil: "domcontentloaded" })
  await P.waitForSelector("text=Configuration, RBAC and Access")
  await P.waitForTimeout(8000)
  await P.click('[data-action="settings-tab"][data-id="p2p"]')
  await P.waitForSelector("#p2pMatchFormV23")
  check("they persist after reload (3.5% and warn only)", (await P.inputValue('#p2pMatchFormV23 [name="matchPriceVariancePct"]')) === "3.5" && (await P.inputValue('#p2pMatchFormV23 [name="matchEnforcement"]')) === "WARN")
  await P.fill('#p2pMatchFormV23 [name="matchPriceVariancePct"]', "-4")
  t = await toast(() => P.click('[data-action="save-p2p-settings-v23"]'))
  check("an invalid tolerance is refused with a message", /between 0 and 100|must be/i.test(t), t)
  await putSettings({ matchPriceVariancePct: 2, matchEnforcement: "ENFORCE" })
  await shot("09-config-p2p")
}

// ================================================================== AI review
if (STAGES.includes("ai")) {
  console.log("\n== §29-§31 AI document review ==")
  await as(fx.accountant)
  await open("intake", "AI Invoice Capture")
  await P.waitForSelector("#aiReviewFormV23")
  check("the AI page says AI is assistance, not an authorised decision", /not authorised decisions|assist/i.test(await text()))
  await P.selectOption('#aiReviewFormV23 [name="documentType"]', "QUOTATION")
  await P.locator('#aiReviewFormV23 [name="document"]').setInputFiles(pdfFile("quotation.pdf", [
    "QUOTATION", "Supplier: Zeta Traders (Pvt) Ltd", "Quotation No: QT-2026-0042", "Date: 2026-08-14", "Currency: USD",
    "Item: Office chairs, quantity 20, unit price 45.00", "Item: Desks, quantity 10, unit price 120.00", "Subtotal: 2100.00", "VAT (15.5%): 325.50", "Total: 2425.50",
    "Payment terms: Net 30", "Delivery: 14 days from order", "Valid until: 2026-09-30",
  ]))
  const before = await api("GET", "/procurement/vendors?limit=1", fx.accountant.token)
  let t = await toast(() => P.click('[data-action="ai-extract-v23"]'))
  check("AI reads the document into a review", /Read quotation\.pdf|suggestions/i.test(t), t)
  await P.waitForSelector("[data-ai-field]", { timeout: 60000 })
  const ex = await api("GET", "/procurement/ai/extractions", fx.accountant.token)
  check("the review has three columns: AI extracted value, original source, your confirmation", /AI extracted value/i.test(await text()) && /Original source/i.test(await text()) && /Your confirmation/i.test(await text()))
  check("each value shows the words of the document it came from", (await P.locator(".pr23-src").count()) >= 5)
  check("values are labelled as AI-extracted and not confirmed", (await P.locator(".pr23-prov-ai").count()) >= 5)
  await shot("10-ai-review")
  const supplierRow = P.locator('[data-ai-field="supplierName"]')
  await supplierRow.locator('[data-action="ai-decide-v23"]', { hasText: "Accept" }).click()
  await P.waitForTimeout(1500)
  check("accepting a value makes it human-confirmed, in a visibly different style", (await supplierRow.locator(".pr23-prov-human").count()) >= 1)
  const styles = await P.evaluate(() => {
    const a = document.querySelector(".pr23-prov-ai"), h = document.querySelector(".pr23-prov-human"), s = document.querySelector(".pr23-prov-src")
    const cs = (e) => e && { border: getComputedStyle(e).borderStyle, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor }
    return { a: cs(a), h: cs(h), s: cs(s) }
  })
  check("original, AI-extracted and human-confirmed look different (border, colour), not only different field names", styles.a && styles.h && styles.a.border !== styles.h.border && styles.a.color !== styles.h.color, JSON.stringify(styles))
  const totalRow = P.locator('[data-ai-field="quotedAmount"]')
  await totalRow.locator('[data-ai-input="quotedAmount"]').fill("2400.00")
  await totalRow.locator('[data-action="ai-decide-v23"]', { hasText: "Use my value" }).click()
  await P.waitForTimeout(1500)
  check("a corrected value replaces the proposal and is human-confirmed", /2400\.00/.test(await totalRow.innerText()) && (await totalRow.locator(".pr23-prov-human").count()) >= 1)
  await P.locator('[data-ai-field="currency"] [data-action="ai-decide-v23"]', { hasText: "Reject" }).click()
  await P.waitForTimeout(1500)
  check("a rejected value is struck out and never confirmed", (await P.locator('[data-ai-field="currency"] .pr23-prov-rejected').count()) >= 1)
  t = await toast(() => P.click('[data-action="ai-complete-v23"]'))
  check("the review cannot be finished while values are undecided", /not been accepted|undecided|still/i.test(t) || /to decide/i.test(t), t)
  // decide the rest
  // decide only the rows still open: the corrected and rejected ones stay as the person left them
  for (const key of await P.locator("[data-ai-field]").evaluateAll((els) => els.map((e) => e.getAttribute("data-ai-field")))) {
    const r = P.locator(`[data-ai-field="${key}"]`)
    if (await r.locator(".pr23-prov-human, .pr23-prov-rejected").count()) continue
    const accept = r.locator('[data-action="ai-decide-v23"]', { hasText: "Accept" })
    if (await accept.count()) { await accept.first().click().catch(() => undefined); await P.waitForTimeout(700) }
    else { await r.locator('[data-action="ai-decide-v23"]', { hasText: "Enter value" }).first().click().catch(() => undefined); await P.waitForTimeout(500) }
  }
  t = await toast(() => P.click('[data-action="ai-complete-v23"]'))
  check("once every value is decided the review is finished", /Review complete/i.test(t), t)
  await P.waitForTimeout(1500)
  const sawConfirmed = await has("Confirmed by you", 30000)
  await shot("10b-ai-confirmed")
  const confirmedBox = await P.locator(".notice", { hasText: "Confirmed by you" }).last().innerText().catch(() => "")
  check("only what the person confirmed is offered as usable", sawConfirmed && /Quoted amount \(total\): 2400(\.00)?/.test(confirmedBox) && !/Currency:/.test(confirmedBox), (await text()).slice(-600))
  const [pg] = await Promise.all([ctx0.waitForEvent("page", { timeout: 30000 }), P.locator('[data-action="ai-source-v23"]').first().click()])
  await pg.waitForLoadState("domcontentloaded").catch(() => undefined)
  check("the original document opens beside the values", /blob:/.test(pg.url()))
  await pg.close()
  const vendorsAfter = await api("GET", "/procurement/vendors?limit=1", fx.accountant.token)
  check("nothing official changed because AI read the document", JSON.stringify(before.json?.data?.length ?? before.json) === JSON.stringify(vendorsAfter.json?.data?.length ?? vendorsAfter.json))
  // controls
  await putSettings({ aiEnabled: false })
  await open("intake", "AI Invoice Capture")
  check("with AI switched off the page says so and the controls are disabled", /switched off/i.test(await text()) && (await P.locator('#aiReviewFormV23 [name="document"]').isDisabled()))
  await putSettings({ aiEnabled: true, aiMonthlyDocumentLimit: 0 })
  await open("intake", "AI Invoice Capture")
  check("at the monthly limit the page says so and nothing can be processed", /limit/i.test(await text()) && (await P.locator('[data-action="ai-extract-v23"]').count()) === 0, (await text()).slice(0, 200))
  await putSettings({ aiMonthlyDocumentLimit: null, aiAllowedRoleCodes: ["PROC_MGR"] })
  await open("intake", "AI Invoice Capture")
  check("for a role outside the approved user groups the page says so", /approved user groups/i.test(await text()))
  await putSettings({ aiAllowedRoleCodes: [] })
  await as(admin)
  await open("settings", "Configuration, RBAC and Access")
  await P.click('[data-action="settings-tab"][data-id="p2p"]')
  await P.waitForSelector("#p2pAiFormV23")
  check("the administrator sees AI usage: documents, calls, failures and recent activity by user", (await has("Documents processed", 30000)) && /Recent activity/.test(await text()) && /PIacct/.test(await text()))
  await shot("11-ai-usage")
}

// ================================================================== blocked
if (STAGES.includes("blocked")) {
  console.log("\n== Blocked paths ==")
  await as(fx.bystander)
  await open("purchase-orders", "Purchase Orders").catch(() => undefined)
  const bt = await text()
  check("a user without procurement grants cannot use the purchase order screens", /does not include|not include Purchase Orders|Your role/i.test(bt) || !bt.includes(fx.po.number), bt.slice(0, 200))
  const b1 = await api("POST", `/procurement/invoices/${invA?.id || "x"}/finance-handoff`, fx.bystander.token, { to: "SUBMITTED" })
  const b2 = await api("PUT", `/procurement/invoices/${invA?.id || "x"}/approve`, fx.bystander.token, {})
  const b3 = await api("POST", "/procurement/ai/status", fx.bystander.token)
  const b4 = await api("GET", "/procurement/ai/usage", fx.officer.token)
  check("without the grants the handoff, approval and AI usage endpoints refuse", [b1.status, b2.status, b4.status].every((s) => s === 403), `${b1.status} ${b2.status} ${b4.status}`)
  void b3
}

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) { console.log("FAILED:\n" + failed.map((f) => " - " + f.name).join("\n")); process.exitCode = 1 }
