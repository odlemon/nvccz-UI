// DEV only. Builds the realistic procurement dataset through the API, as the people who do each step.
//
//   node dev_demo_dataset.mjs
//
// Everything is created by the endpoint the UI calls, as the persona the permission policy allows, so business
// rules, audit rows and the accounting postings (expense journal, cashbook payment) are real. Vendors are
// fictional; their addresses use example.com mailboxes, and the run refuses unless the dev mail guard is on.
// Writes the ids it created to demo-manifest.json next to this script (used by the backdating pass).
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const API = process.env.API || "http://127.0.0.1:3009/api"
const PASSWORD = "admin123"
const HERE = path.dirname(fileURLToPath(import.meta.url))
const BANKS_PATH = process.env.BANKS_PATH || "/cashbook/banks"

if (process.env.MAIL_REDIRECT_ENFORCE !== "true") {
  console.log("REFUSED: the dev mail guard is off (dev_mail_guard.py on)")
  process.exit(2)
}
if (/nvccz_prod/.test(process.env.DATABASE_URL || "")) {
  console.log("REFUSED: not the dev database")
  process.exit(2)
}

const PEOPLE = {
  requester: "proc.requester@nts.local",
  head: "perf.deptmgr@nts.local",
  officer: "proc.officer@nts.local",
  manager: "proc.mgr@nts.local",
  ap: "proc.ap@nts.local",
  finance: "payroll.finmgr@nts.local",
}
const tokens = {}
const manifest = { createdAt: new Date().toISOString(), vendors: {}, plans: {}, chains: {} }

const days = (n) => new Date(Date.now() + n * 86400000).toISOString()
const log = (msg) => console.log(`  ok    ${msg}`)
function fail(step, r) {
  console.log(`  FAIL  ${step}: ${r?.res?.status} ${r?.json?.message ?? JSON.stringify(r?.json ?? {}).slice(0, 400)}`)
  fs.writeFileSync(path.join(HERE, "demo-manifest.partial.json"), JSON.stringify(manifest, null, 2))
  process.exit(1)
}

async function call(who, method, p, body, { form } = {}) {
  const headers = { Authorization: `Bearer ${tokens[who]}` }
  if (!form) headers["Content-Type"] = "application/json"
  const res = await fetch(`${API}${p}`, { method, headers, body: form ?? (body === undefined ? undefined : JSON.stringify(body)) })
  const json = await res.json().catch(() => ({}))
  return { res, json, data: json?.data }
}
const ok = (r, step) => {
  if (r.res.status < 200 || r.res.status >= 300) fail(step, r)
  return r.data
}
/** List endpoints answer with an array or wrap it ({ invoices: [...] }); either way, the rows. */
const rowsOf = (d) => (Array.isArray(d) ? d : Object.values(d ?? {}).find(Array.isArray) ?? [])

function vendorRfqToken(vendorId, rfqId) {
  const secret = process.env.VENDOR_PORTAL_TOKEN_SECRET?.trim() || process.env.JWT_SECRET?.trim()
  const body = Buffer.from(JSON.stringify({ k: "RFQ_SUBMIT", v: vendorId, r: rfqId, exp: Math.floor(Date.now() / 1000) + 30 * 86400 }), "utf8").toString("base64url")
  return `${body}.${crypto.createHmac("sha256", secret).update(body).digest("base64url")}`
}

/** A one-page PDF with a title and lines of text. */
function pdf(title, lines) {
  const esc = (t) => String(t).replace(/[^\x20-\x7E]/g, "-").replace(/[\\()]/g, (m) => `\\${m}`)
  const content = ["BT", "/F1 16 Tf", "56 780 Td", `(${esc(title)}) Tj`, "/F1 10 Tf", "0 -28 Td", ...lines.flatMap((l) => [`(${esc(l)}) Tj`, "0 -15 Td"]), "ET"].join("\n")
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ]
  let out = "%PDF-1.4\n"
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"))
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(out, "latin1")
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new Blob([Buffer.from(out, "latin1")], { type: "application/pdf" })
}

// ------------------------------------------------------------------ sign in
for (const [who, email] of Object.entries(PEOPLE)) {
  const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: PASSWORD, portal: "staff" }) })
  const j = await res.json().catch(() => ({}))
  tokens[who] = j.token || j?.data?.token
  if (!tokens[who]) fail(`sign in ${who}`, { res, json: j })
}
log(`signed in: ${Object.keys(PEOPLE).join(", ")}`)

// ------------------------------------------------------------------ vendors
const V = {
  jacaranda: { name: "Jacaranda Office Supplies (Pvt) Ltd", category: "Office Supplies", contactPerson: "Tanaka Gumbo", email: "sales@jacaranda-office.example.com", phone: "+263 242 700 101", address: "12 Coventry Road, Workington, Harare", paymentTerms: "Net 30", bpNumber: "BP-204118", taxNumber: "10023418", taxClearanceExpiryDate: days(240) },
  granite: { name: "Granite Ridge Stationers (Pvt) Ltd", category: "Office Supplies", contactPerson: "Loice Mavhunga", email: "orders@graniteridge.example.com", phone: "+263 242 700 102", address: "7 Kenmark Crescent, Msasa, Harare", paymentTerms: "Net 30", bpNumber: "BP-204377", taxNumber: "10031977", taxClearanceExpiryDate: days(35) },
  msasa: { name: "Msasa Contract Furniture (Pvt) Ltd", category: "Furniture", contactPerson: "Brian Zvobgo", email: "projects@msasafurniture.example.com", phone: "+263 242 700 103", address: "41 Beverley Road, Msasa, Harare", paymentTerms: "Net 45", bpNumber: "BP-198802", taxNumber: "10019882", taxClearanceExpiryDate: days(180) },
  kopje: { name: "Kopje Office Furniture (Pvt) Ltd", category: "Furniture", contactPerson: "Precious Nyathi", email: "sales@kopjefurniture.example.com", phone: "+263 242 700 104", address: "3 Paisley Road, Southerton, Harare", paymentTerms: "Net 30", bpNumber: "BP-201455", taxNumber: "10027455", taxClearanceExpiryDate: days(150) },
  baobab: { name: "Baobab Networks & Computing (Pvt) Ltd", category: "Technology", contactPerson: "Simba Chinyama", email: "accounts@baobabnetworks.example.com", phone: "+263 242 700 105", address: "Unit 5, 88 Enterprise Road, Highlands, Harare", paymentTerms: "Net 30", bpNumber: "BP-207731", taxNumber: "10040731", taxClearanceExpiryDate: days(300) },
  kestrel: { name: "Kestrel Technology Solutions (Pvt) Ltd", category: "Technology", contactPerson: "Ruvimbo Dzvairo", email: "tenders@kestreltech.example.com", phone: "+263 242 700 106", address: "19 Lanark Road, Belgravia, Harare", paymentTerms: "Net 30", bpNumber: "BP-205560", taxNumber: "10035560", taxClearanceExpiryDate: days(210) },
  sable: { name: "Sable Facilities Management (Pvt) Ltd", category: "Facilities", contactPerson: "Munyaradzi Chari", email: "service@sablefm.example.com", phone: "+263 242 700 107", address: "22 Lytton Road, Workington, Harare", paymentTerms: "Net 30", bpNumber: "BP-199914", taxNumber: "10020914", taxClearanceExpiryDate: days(160) },
  hillside: { name: "Hillside Building Services (Pvt) Ltd", category: "Facilities", contactPerson: "Edith Marange", email: "quotes@hillsidebs.example.com", phone: "+263 242 700 108", address: "9 Dagenham Road, Willowvale, Harare", paymentTerms: "Net 30", bpNumber: "BP-202286", taxNumber: "10029286", taxClearanceExpiryDate: days(95) },
  mopani: { name: "Mopani Fleet Services (Pvt) Ltd", category: "Fleet", contactPerson: "Takudzwa Mupfumira", email: "workshop@mopanifleet.example.com", phone: "+263 242 700 109", address: "56 Birmingham Road, Southerton, Harare", paymentTerms: "Net 30", bpNumber: "BP-196640", taxNumber: "10016640", taxClearanceExpiryDate: days(12) },
}
const listed = ok(await call("officer", "GET", "/accounting/vendors"), "list vendors")
const existing = rowsOf(listed)
const reqList = ok(await call("manager", "GET", "/procurement/requisitions"), "list requisitions")
const reqRows = rowsOf(reqList)
if (reqRows.some((r) => r.title === "Laptop replacement for Operations staff")) {
  console.log("REFUSED: the demo requisitions already exist; this dataset has been built")
  process.exit(3)
}
// A run stopped part-way leaves its vendors; they are reused rather than registered twice.
const vid = {}
for (const [key, v] of Object.entries(V)) {
  const found = existing.find((e) => e.name === v.name)
  vid[key] = found ? found.id : ok(await call("officer", "POST", "/accounting/vendors", v), `register ${v.name}`).id
}
manifest.vendors = vid
log(`${Object.keys(vid).length} vendors registered`)

// ------------------------------------------------------------------ plans
async function plan({ name, fiscalYear, budget, notes, items, submit, approve }) {
  const p = ok(await call("manager", "POST", "/procurement/plans", { name, department: "Operations", fiscalYear, budget, currencyCode: "USD", notes }), `create plan ${name}`)
  for (const it of items) ok(await call("manager", "POST", `/procurement/plans/${p.id}/items`, { department: "Operations", ...it }), `plan item ${it.description}`)
  if (submit) ok(await call("manager", "POST", `/procurement/plans/${p.id}/submit`), `submit plan ${name}`)
  if (approve) ok(await call("finance", "POST", `/procurement/plans/${p.id}/approve`, {}), `approve plan ${name}`)
  return p
}
const PLAN_METHOD = process.env.PLAN_METHOD || "RFQ"
manifest.plans.fy2026 = (await plan({
  name: "FY 2026 Operations Procurement Plan",
  fiscalYear: "FY 2026",
  budget: 185000,
  notes: "Approved by the Finance Committee. Covers workplace equipment, facilities maintenance and fleet servicing for the Operations department.",
  items: [
    { description: "Staff laptop replacement (end-of-life fleet)", category: "Technology", quarter: "Q3", method: PLAN_METHOD, estimatedValue: 14000 },
    { description: "Head office network switching and Wi-Fi upgrade", category: "Technology", quarter: "Q4", method: PLAN_METHOD, estimatedValue: 9500 },
    { description: "Quarterly stationery and consumables", category: "Office Supplies", quarter: "Q3", method: PLAN_METHOD, estimatedValue: 6800 },
    { description: "Boardroom furniture", category: "Furniture", quarter: "Q3", method: PLAN_METHOD, estimatedValue: 8200 },
    { description: "Generator and HVAC preventive maintenance", category: "Facilities", quarter: "Q3", method: PLAN_METHOD, estimatedValue: 11500 },
    { description: "Pool vehicle servicing", category: "Fleet", quarter: "Q4", method: PLAN_METHOD, estimatedValue: 7400 },
  ],
  submit: true,
  approve: true,
})).id
manifest.plans.fy2027 = (await plan({
  name: "FY 2027 Operations Procurement Plan",
  fiscalYear: "FY 2027",
  budget: 212000,
  notes: "Draft for the FY 2027 budget cycle, submitted for Finance review.",
  items: [
    { description: "Hybrid meeting room audio-visual equipment", category: "Technology", quarter: "Q1", method: PLAN_METHOD, estimatedValue: 18500 },
    { description: "Office chairs replacement programme", category: "Furniture", quarter: "Q2", method: PLAN_METHOD, estimatedValue: 12600 },
    { description: "Annual stationery framework", category: "Office Supplies", quarter: "Q1", method: PLAN_METHOD, estimatedValue: 26000 },
  ],
  submit: true,
  approve: false,
})).id
log("plans: FY 2026 approved, FY 2027 submitted to Finance")

// ------------------------------------------------------------------ building blocks
async function requisition({ title, description, justification, priority = "MEDIUM", category, items, submit = true }) {
  const r = ok(await call("requester", "POST", "/procurement/requisitions", { title, description, department: "Operations", priority, justification, sourcingCategory: category, items }), `raise "${title}"`)
  if (submit) ok(await call("requester", "PUT", `/procurement/requisitions/${r.id}/submit`), `submit "${title}"`)
  return r
}
const approveReq = async (r) => ok(await call("head", "PUT", `/procurement/requisitions/${r.id}/approve`), `approve ${r.requisitionNumber}`)

async function rfq(req, { title, description, vendors, deadline = 10, delivery = 21 }) {
  const d = ok(await call("officer", "POST", "/procurement/rfq", {
    purchaseRequisitionId: req.id,
    title,
    description,
    vendorIds: vendors.map((k) => vid[k]),
    rfqDeadline: days(deadline),
    expectedDeliveryDate: days(delivery),
    deliveryAddress: "Operations Department, Head Office, Harare",
  }), `send RFQ ${title}`)
  return { id: d.procurementRfqId, number: d.rfqNumber }
}

async function quote(key, r, lines, delivery = "10 business days") {
  const v = V[key]
  const res = await fetch(`${API}/vendor-quotations/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vendorPortalToken: vendorRfqToken(vid[key], r.id),
      rfqNumber: r.number,
      vendorName: v.contactPerson,
      vendorEmail: v.email,
      companyName: v.name,
      currencyCode: "USD",
      paymentTerms: v.paymentTerms,
      deliveryTime: delivery,
      validUntil: days(45),
      items: lines,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status < 200 || res.status >= 300) fail(`quotation from ${v.name}`, { res, json })
  return json.data
}
const score = async (q, s, notes) => ok(await call("manager", "PUT", `/vendor-quotations/${q.id}/evaluation`, { score: s, notes }), `score ${q.quotationNumber}`)

async function award(q, notes) {
  const a = ok(await call("manager", "POST", `/vendor-quotations/${q.id}/accept`), `award ${q.quotationNumber}`)
  let po = a?.purchaseOrder ?? a?.po ?? null
  if (!po?.id) {
    const list = ok(await call("officer", "GET", "/procurement/purchase-orders"), "list purchase orders")
    const rows = rowsOf(list)
    po = rows.find((o) => o.quotationId === q.id)
  }
  if (!po?.id) fail(`purchase order for ${q.quotationNumber}`, { res: { status: 0 }, json: a })
  const full = ok(await call("officer", "GET", `/procurement/purchase-orders/${po.id}`), `read PO ${po.poNumber}`)
  if (!["SENT", "ACKNOWLEDGED"].includes(String(full.status).toUpperCase())) ok(await call("officer", "POST", `/procurement/purchase-orders/${po.id}/send`), `send PO ${full.poNumber}`)
  return ok(await call("officer", "GET", `/procurement/purchase-orders/${po.id}`), `re-read PO ${full.poNumber}`)
}

async function receive(po, { approve, notes }) {
  const g = ok(await call("officer", "POST", "/procurement/goods-received-notes", {
    purchaseOrderId: po.id,
    receivedDate: new Date().toISOString(),
    items: (po.items ?? []).map((i) => ({ purchaseOrderItemId: i.id, quantityReceived: Number(i.quantity), quantityAccepted: Number(i.quantity), quantityRejected: 0 })),
  }), `record GRN for ${po.poNumber}`)
  if (approve) ok(await call("manager", "PUT", `/procurement/goods-received-notes/${g.id}/approve`, { qualityNotes: notes }), `approve ${g.grnNumber}`)
  return g
}

async function invoice(po, vendorKey, { approve }) {
  const inv = ok(await call("ap", "POST", "/procurement/invoices", {
    purchaseOrderId: po.id,
    vendorId: vid[vendorKey],
    invoiceDate: new Date().toISOString(),
    dueDate: days(30),
    currencyId: po.currencyId ?? undefined,
    items: (po.items ?? []).map((i) => ({ itemName: i.itemName, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
  }), `capture invoice for ${po.poNumber}`)
  if (!approve) return inv
  const approved = ok(await call("finance", "PUT", `/procurement/invoices/${inv.id}/approve`, { isTaxable: true }), `approve ${inv.invoiceNumber}`)
  return { ...inv, ...(approved?.invoice ?? approved ?? {}), id: inv.id, invoiceNumber: inv.invoiceNumber }
}

async function document(folder, name, documentType, related, lines) {
  const fd = new FormData()
  fd.append("files", pdf(name, lines), `${name.replace(/[^A-Za-z0-9]+/g, "-").replace(/-+$/, "")}.pdf`)
  fd.append("folder", folder)
  fd.append("name", name)
  fd.append("documentType", documentType)
  if (related) fd.append("relatedRecord", related)
  fd.append("classification", "Internal")
  fd.append("source", "Internal")
  const d = ok(await call("officer", "POST", "/procurement/documents", undefined, { form: fd }), `file ${name}`)
  return Array.isArray(d) ? d[0] : d
}

// ------------------------------------------------------------------ chain 1: laptops, paid and posted
{
  const lines = [
    { itemName: "14-inch business laptop (Core i5, 16 GB RAM, 512 GB SSD)", quantity: 8, unit: "each", unitPrice: 1150 },
    { itemName: "USB-C docking station", quantity: 8, unit: "each", unitPrice: 165 },
  ]
  const req = await requisition({
    title: "Laptop replacement for Operations staff",
    description: "Replace eight laptops that are past their four-year service life.",
    justification: "The current laptops are out of warranty and failing battery and disk checks. Budgeted in the FY 2026 plan (Staff laptop replacement).",
    priority: "HIGH",
    category: "Technology",
    items: lines,
  })
  await approveReq(req)
  const r = await rfq(req, { title: "Supply of business laptops and docking stations", description: "Eight business laptops with docking stations, three-year on-site warranty, delivered to head office.", vendors: ["baobab", "kestrel"] })
  const q1 = await quote("baobab", r, [{ itemName: lines[0].itemName, quantity: 8, unitPrice: 1095 }, { itemName: lines[1].itemName, quantity: 8, unitPrice: 158 }], "7 business days")
  const q2 = await quote("kestrel", r, [{ itemName: lines[0].itemName, quantity: 8, unitPrice: 1178 }, { itemName: lines[1].itemName, quantity: 8, unitPrice: 149 }], "14 business days")
  await score(q1, 88, "Meets the specification; three-year on-site warranty; earliest delivery.")
  await score(q2, 81, "Meets the specification; warranty is return-to-base.")
  const po = await award(q1)
  const g = await receive(po, { approve: true, notes: "Eight laptops and docks received with serial numbers recorded; all units powered on and passed inspection." })
  const inv = await invoice(po, "baobab", { approve: true })
  const banks = ok(await call("ap", "GET", BANKS_PATH), "list bank accounts")
  const bankRows = rowsOf(banks)
  if (!bankRows.length) fail("a bank account to pay from", { res: { status: 0 }, json: banks })
  const fresh = inv
  const form = new FormData()
  form.append("proofOfPayment", pdf(`Payment confirmation ${inv.invoiceNumber}`, [`Paid to ${V.baobab.name}`, `Amount USD ${fresh.totalAmount}`, "RTGS transfer from the operating account"]), "payment-confirmation.pdf")
  form.append("paymentAmount", String(fresh.totalAmount))
  form.append("paymentDate", new Date().toISOString())
  form.append("paymentMethod", process.env.PAYMENT_METHOD || "BANK")
  form.append("bankAccountId", bankRows[0].id)
  form.append("paymentReference", `RTGS-${inv.invoiceNumber}`)
  const payment = ok(await call("ap", "POST", `/procurement/invoices/${inv.id}/payment`, undefined, { form }), `pay ${inv.invoiceNumber}`)
  const fromList = rowsOf(ok(await call("ap", "GET", "/procurement/invoices"), "list invoices")).find((x) => x.id === inv.id)
  const paid = { ...(fromList ?? {}), ...(payment?.invoice ?? {}) }
  const je = payment?.expenseJournalEntry?.id ?? payment?.invoice?.journalEntryId ?? payment?.journalEntryId ?? paid.journalEntry?.id ?? paid.journalEntryId
  if (je) ok(await call("ap", "PATCH", `/accounting/journal-entries/${je}/post`, {}), `post expense journal ${paid.journalEntry?.referenceNumber ?? je}`)
  await document("Tenders & Bids", "Laptop replacement - RFQ pack", "Tender pack", r.number, [`RFQ ${r.number}`, "Eight business laptops with docking stations", "Evaluation: technical 60%, price 40%", "Closing date as stated on the invitation"])
  manifest.chains.laptops = { requisition: req.id, rfq: r.id, quotations: [q1.id, q2.id], po: po.id, grn: g.id, invoice: inv.id, journal: je, age: 38 }
  log(`chain laptops: ${req.requisitionNumber} -> ${r.number} -> ${po.poNumber} -> ${g.grnNumber} -> ${inv.invoiceNumber} paid, journal posted`)
}

// ------------------------------------------------------------------ chain 2: stationery, invoice waiting on Finance
{
  const lines = [
    { itemName: "A4 copy paper, 80 gsm (box of 5 reams)", quantity: 40, unit: "box", unitPrice: 26 },
    { itemName: "Toner cartridge for HP LaserJet M404", quantity: 12, unit: "each", unitPrice: 88 },
    { itemName: "Lever arch file, A4", quantity: 60, unit: "each", unitPrice: 3.4 },
  ]
  const req = await requisition({ title: "Quarterly stationery restock", description: "Paper, toner and filing for the third quarter.", justification: "Routine quarterly replenishment within the FY 2026 stationery budget.", category: "Office Supplies", items: lines })
  await approveReq(req)
  const r = await rfq(req, { title: "Supply of stationery and printer consumables - Q3", description: "Quarterly stationery restock delivered to head office stores.", vendors: ["jacaranda", "granite"] })
  const q1 = await quote("jacaranda", r, [{ itemName: lines[0].itemName, quantity: 40, unitPrice: 24.5 }, { itemName: lines[1].itemName, quantity: 12, unitPrice: 84 }, { itemName: lines[2].itemName, quantity: 60, unitPrice: 3.2 }], "5 business days")
  const q2 = await quote("granite", r, [{ itemName: lines[0].itemName, quantity: 40, unitPrice: 25.9 }, { itemName: lines[1].itemName, quantity: 12, unitPrice: 86 }, { itemName: lines[2].itemName, quantity: 60, unitPrice: 2.95 }], "7 business days")
  const po = await award(q1)
  const g = await receive(po, { approve: true, notes: "Delivered complete; boxes counted and toner model checked against the order." })
  const inv = await invoice(po, "jacaranda", { approve: false })
  manifest.chains.stationery = { requisition: req.id, rfq: r.id, quotations: [q1.id, q2.id], po: po.id, grn: g.id, invoice: inv.id, age: 21 }
  log(`chain stationery: ${po.poNumber} received, ${inv.invoiceNumber} waiting on Finance`)
}

// ------------------------------------------------------------------ chain 3: generator and HVAC, contract active, PO open
{
  const lines = [{ itemName: "Generator and HVAC preventive maintenance (12 months, quarterly visits)", quantity: 1, unit: "contract", unitPrice: 11000 }]
  const req = await requisition({ title: "Generator and HVAC maintenance contract", description: "Twelve months of preventive maintenance for the 60 kVA standby generator and the head office HVAC.", justification: "The previous service agreement lapsed; unplanned outages during load-shedding put operations at risk.", priority: "HIGH", category: "Facilities", items: lines })
  await approveReq(req)
  const r = await rfq(req, { title: "Preventive maintenance of generator and HVAC systems", description: "Quarterly preventive maintenance, 4-hour emergency response, parts at cost.", vendors: ["sable", "hillside"], delivery: 30 })
  const q1 = await quote("sable", r, [{ itemName: lines[0].itemName, quantity: 1, unitPrice: 10400 }], "Start within 2 weeks")
  const q2 = await quote("hillside", r, [{ itemName: lines[0].itemName, quantity: 1, unitPrice: 11850 }], "Start within 3 weeks")
  const po = await award(q1)
  const c = ok(await call("manager", "POST", "/procurement/contracts", {
    title: "Generator and HVAC preventive maintenance agreement",
    vendorId: vid.sable,
    quotationId: q1.id,
    value: 10400,
    currencyCode: "USD",
    startDate: days(-5),
    endDate: days(360),
    paymentTerms: "Quarterly in arrears, Net 30",
    scope: "Quarterly preventive maintenance of the 60 kVA standby generator and head office HVAC; 4-hour emergency call-out; parts supplied at cost plus 10%.",
  }), "create maintenance contract")
  ok(await call("manager", "POST", `/procurement/contracts/${c.id}/activate`), `activate ${c.contractNumber}`)
  await document("Contracts & Awards", "Generator and HVAC maintenance agreement", "Contract", c.contractNumber, ["Service agreement - 12 months", `Supplier: ${V.sable.name}`, "Value: USD 10,400", "Quarterly visits; 4-hour emergency response"])
  manifest.chains.maintenance = { requisition: req.id, rfq: r.id, quotations: [q1.id, q2.id], po: po.id, contract: c.id, age: 17 }
  log(`chain maintenance: ${po.poNumber} open, contract ${c.contractNumber} active`)
}

// ------------------------------------------------------------------ chain 4: boardroom furniture, receipt waiting on inspection
{
  const lines = [
    { itemName: "Boardroom table, 12-seater, oak veneer", quantity: 1, unit: "each", unitPrice: 2900 },
    { itemName: "Boardroom chair, mesh back, chrome base", quantity: 12, unit: "each", unitPrice: 310 },
  ]
  const req = await requisition({ title: "Boardroom furniture", description: "Table and twelve chairs for the refurbished boardroom.", justification: "The boardroom refurbishment is complete; the existing furniture is damaged and mismatched.", category: "Furniture", items: lines })
  await approveReq(req)
  const r = await rfq(req, { title: "Supply and installation of boardroom furniture", description: "One 12-seater table and twelve chairs, delivered and assembled on site.", vendors: ["msasa", "kopje"] })
  const q1 = await quote("msasa", r, [{ itemName: lines[0].itemName, quantity: 1, unitPrice: 2750 }, { itemName: lines[1].itemName, quantity: 12, unitPrice: 295 }], "3 weeks")
  const q2 = await quote("kopje", r, [{ itemName: lines[0].itemName, quantity: 1, unitPrice: 3100 }, { itemName: lines[1].itemName, quantity: 12, unitPrice: 280 }], "4 weeks")
  const po = await award(q1)
  const g = await receive(po, { approve: false })
  manifest.chains.boardroom = { requisition: req.id, rfq: r.id, quotations: [q1.id, q2.id], po: po.id, grn: g.id, age: 12 }
  log(`chain boardroom: ${g.grnNumber} waiting on inspection`)
}

// ------------------------------------------------------------------ chain 5: network upgrade, bids in, award waiting
{
  const lines = [
    { itemName: "24-port managed PoE switch", quantity: 3, unit: "each", unitPrice: 1450 },
    { itemName: "Ceiling-mount Wi-Fi 6 access point", quantity: 10, unit: "each", unitPrice: 260 },
  ]
  const req = await requisition({ title: "Head office network switching and Wi-Fi upgrade", description: "Replace unmanaged switches and add Wi-Fi 6 coverage on both floors.", justification: "Frequent network drops on the second floor; planned in FY 2026 (network upgrade).", category: "Technology", items: lines })
  await approveReq(req)
  const r = await rfq(req, { title: "Supply and installation of network switches and access points", description: "Three managed PoE switches and ten Wi-Fi 6 access points, installed and configured.", vendors: ["baobab", "kestrel"], deadline: 6, delivery: 28 })
  const q1 = await quote("baobab", r, [{ itemName: lines[0].itemName, quantity: 3, unitPrice: 1390 }, { itemName: lines[1].itemName, quantity: 10, unitPrice: 248 }], "3 weeks")
  const q2 = await quote("kestrel", r, [{ itemName: lines[0].itemName, quantity: 3, unitPrice: 1345 }, { itemName: lines[1].itemName, quantity: 10, unitPrice: 239 }], "2 weeks")
  await score(q1, 84, "Compliant; includes configuration and a site survey.")
  await score(q2, 86, "Compliant; faster installation; two-year support included.")
  manifest.chains.network = { requisition: req.id, rfq: r.id, quotations: [q1.id, q2.id], age: 9 }
  log(`chain network: ${r.number} has two bids, award waiting on the Procurement Manager`)
}

// ------------------------------------------------------------------ chain 6: welcome packs, RFQ open, no bids yet
{
  const lines = [{ itemName: "Branded client welcome pack (notebook, pen, lanyard, bag)", quantity: 150, unit: "pack", unitPrice: 18 }]
  const req = await requisition({ title: "Branded welcome packs for client events", description: "Welcome packs for the investor and client events in the fourth quarter.", justification: "Investor relations calendar for Q4; budgeted under stationery and consumables.", category: "Office Supplies", items: lines })
  await approveReq(req)
  const r = await rfq(req, { title: "Supply of branded client welcome packs", description: "150 branded packs; artwork supplied; proofs required before production.", vendors: ["jacaranda", "granite"], deadline: 7, delivery: 30 })
  manifest.chains.welcomePacks = { requisition: req.id, rfq: r.id, age: 3 }
  log(`chain welcome packs: ${r.number} open for quotations`)
}

// ------------------------------------------------------------------ requisitions in every other state
{
  const fleet = await requisition({ title: "Pool vehicle servicing", description: "Scheduled 60,000 km service for three pool vehicles.", justification: "Manufacturer service intervals reached; planned in FY 2026 (pool vehicle servicing).", category: "Fleet", items: [{ itemName: "60,000 km scheduled service - Toyota Hilux 2.4 GD-6", quantity: 3, unit: "vehicle", unitPrice: 620 }] })
  await approveReq(fleet)
  const projector = await requisition({ title: "Training room projector replacement", description: "Replace the failed projector in the training room.", justification: "The lamp and main board failed; repair costs exceed replacement.", category: "Technology", items: [{ itemName: "Short-throw projector, 4,000 lumens", quantity: 1, unit: "each", unitPrice: 1150 }] })
  const safety = await requisition({ title: "First-aid kits and fire extinguisher servicing", description: "Annual safety compliance for head office.", justification: "Occupational health and safety inspection due next month.", priority: "HIGH", category: "Facilities", items: [{ itemName: "Workplace first-aid kit (25 persons)", quantity: 6, unit: "each", unitPrice: 55 }, { itemName: "Fire extinguisher service and recharge", quantity: 14, unit: "each", unitPrice: 18 }] })
  const canteen = await requisition({ title: "Staff kitchen consumables", description: "Tea, coffee and kitchen supplies for the quarter.", justification: "Quarterly replenishment.", category: "Office Supplies", items: [{ itemName: "Kitchen consumables hamper", quantity: 4, unit: "hamper", unitPrice: 95 }], submit: false })
  const desks = await requisition({ title: "Height-adjustable desks for all staff", description: "Thirty height-adjustable desks.", justification: "Ergonomics improvement requested by staff.", category: "Furniture", items: [{ itemName: "Electric height-adjustable desk", quantity: 30, unit: "each", unitPrice: 540 }] })
  ok(await call("head", "PUT", `/procurement/requisitions/${desks.id}/reject`, { rejectionReason: "Not in the FY 2026 plan. Resubmit for the FY 2027 budget with a phased rollout." }), "reject desks")
  manifest.chains.other = { approvedAwaitingSourcing: fleet.id, pendingApproval: [projector.id, safety.id], draft: canteen.id, rejected: desks.id, age: 2 }
  log("requisitions: one approved awaiting sourcing, two pending approval, one draft, one rejected")
}

await document("Annual Plans", "FY 2026 Operations Procurement Plan", "Annual plan", "FY 2026", ["Approved procurement plan - Operations", "Budget USD 185,000", "Technology, office supplies, furniture, facilities and fleet"])

fs.writeFileSync(path.join(HERE, "demo-manifest.json"), JSON.stringify(manifest, null, 2))
console.log(`=== RESULT === demo dataset built; manifest ${path.join(HERE, "demo-manifest.json")}`)
