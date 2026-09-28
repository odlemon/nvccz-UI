/**
 * SRD §34-§40 in a visible browser, as each real user would use it: the dashboards and their drill-downs, the reports and
 * their exports, search / filters / sorting / paging / export on the lists, the configuration tabs (numbering, currency,
 * notification rules) and the status actions. Window on screen by default (UAT_HIDE=1 parks it off-screen).
 *   node scripts/_uat/notifications-reports-ui.mjs
 */
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import * as XLSX from "xlsx"

const FE = process.env.UAT_FE || "http://localhost:3120"
const API = process.env.UAT_API || "http://127.0.0.1:3009/api"
const BE = process.env.UAT_BE_DIR || "C:/Users/lysp/Downloads/nvccz"
const OUT = process.env.UAT_OUT || "design-refs/notifications-reports/screens"
const STAGES = (process.env.UAT_STAGES || "dash,reports,lists,settings,status,states").split(",")
fs.mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + String(detail).slice(0, 360)}`)
}
async function api(method, p, token, body) {
  const r = await fetch(`${API}${p}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const buf = Buffer.from(await r.arrayBuffer())
  return { status: r.status, json: (() => { try { return JSON.parse(buf.toString()) } catch { return null } })(), buf, text: buf.toString() }
}
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

console.log("setting up staff, a supplier and an awarded purchase order ...")
let out = ""
for (let attempt = 1; attempt <= 4; attempt++) {
  try { out = execFileSync("npx", ["ts-node", "--transpile-only", "-r", "dotenv/config", "scripts/_uat/p2p-ui-setup.ts"], { cwd: BE, encoding: "utf8", shell: true, timeout: 300000 }); break }
  catch (e) { if (attempt === 4) throw e; console.log(`setup attempt ${attempt} failed; retrying`); await new Promise((r) => setTimeout(r, 8000)) }
}
const fx = JSON.parse(out.trim().split("\n").filter((l) => l.startsWith("{")).pop())
const adminTok = (await api("POST", "/auth/login", null, { email: "admin@nts.com", password: "admin123" })).json.token
const admin = { email: "admin@nts.com", password: "admin123" }
await api("PUT", "/procurement/requisition-policy", adminTok, { budgetCheckMode: "OFF", planLinkPolicy: "OPTIONAL", suggestedVendorPolicy: "ALLOWED_APPROVED_ONLY" })
const origMatrix = (await api("GET", "/procurement/approval-matrix", adminTok)).json?.data
const origRules = (await api("GET", "/procurement/notification-rules", adminTok)).json?.data
const origNumbering = (await api("GET", "/procurement/numbering", adminTok)).json?.data
const origFx = (await api("GET", "/procurement/fx", adminTok)).json?.data?.settings

const parked = process.env.UAT_HIDE === "1" ? ["--window-position=-2400,0", "--window-size=1500,1000"] : ["--window-position=60,30", "--window-size=1500,1000"]
const browser = await chromium.launch({ args: ["--js-flags=--max-old-space-size=3072", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", ...parked], headless: process.env.UAT_HEADLESS === "1" })
const ctx0 = await browser.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true })
const P = await ctx0.newPage()
P.setDefaultTimeout(120000)
const pageErrors = []
P.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 240)))
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
const has = (t, ms = 60000) => P.waitForFunction((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), t, { timeout: ms }).then(() => true).catch(() => false)
const shot = (name) => P.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
const toast = async (fn) => {
  const texts = () => P.locator("#toastStack .toast, [data-sonner-toast], .toast").allInnerTexts().catch(() => [])
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
  await P.goto(`${FE}/procurement${route ? "/" + route : ""}`, { waitUntil: "domcontentloaded" })
  await P.waitForSelector(`text=${marker}`, { timeout: 180000 })
  await P.waitForFunction(() => !document.body.innerText.includes("Loading live figures"), null, { timeout: 120000 }).catch(() => undefined)
  await P.waitForTimeout(3000)
}
const workspace = () => P.locator("#workspace").innerText()
const download = async (fn) => {
  const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 90000 }), fn()])
  const p = path.join(OUT, `_dl-${Date.now()}-${dl.suggestedFilename()}`)
  await dl.saveAs(p)
  const buf = fs.readFileSync(p)
  fs.rmSync(p, { force: true })
  return { name: dl.suggestedFilename(), buf }
}
const tileText = (label) => P.locator(".pr23-tile", { has: P.locator(".kpi-label", { hasText: new RegExp(`^${label}$`, "i") }) }).first().innerText().catch(() => "")

// ================================================================== dashboards
if (STAGES.includes("dash")) {
  console.log("\n== §35 Dashboards ==")
  await as(admin)
  await open("", "dashboard")
  await has("Total procurement value")
  const urlBefore = P.url()
  const tabs = await P.locator(".pr23-dash-tabs .tab").allInnerTexts()
  check("an administrator has the executive, procurement and own-work dashboards as tabs", tabs.length === 3 && /Executive/.test(tabs[0]) && /Procurement/.test(tabs[1]) && /My work/.test(tabs[2]), tabs.join("|"))
  check("the executive dashboard opens first for the role that has it", /Executive dashboard/.test(await workspace()))
  await shot("01-executive")
  const exApi = (await api("GET", "/procurement/dashboards/executive?preset=12m", adminTok)).json.data
  const vol = await tileText("Procurement volume")
  check("Procurement volume equals the server figure (not typed in)", vol.replace(/,/g, "").includes(String(exApi.tiles.procurementVolume.orders)), `${vol.slice(0, 80)} vs ${exApi.tiles.procurementVolume.orders}`)
  const tv = await tileText("Total procurement value")
  check("Total procurement value lists each currency on its own with its own code", /USD/.test(tv) && !/undefined|NaN/.test(tv), tv.slice(0, 200))
  check("money that could not be converted is called out, not silently added", exApi.tiles.totalProcurementValue.hasOwnProperty("unconverted") && (!Object.keys(exApi.tiles.totalProcurementValue.unconverted).length || /Not converted/i.test(tv)), tv.slice(0, 260))
  check("the executive charts are drawn with titles, axis title and value labels", (await P.locator(".pr23-chart svg").count()) >= 4 && (await P.locator(".pr23-chart figcaption strong").allInnerTexts()).some((x) => /Spend by category/i.test(x)) && (await P.locator(".pr23-chart svg text").evaluateAll((els) => els.map((e) => e.textContent))).some((x) => /Spend \(/i.test(x)))
  check("bars carry a hover tooltip naming the label and the amount", (await P.locator(".pr23-chart g.pr23-bar title").first().textContent().catch(() => "")).length > 3)
  // tabs switch in place
  await P.getByRole("button", { name: "Procurement dashboard" }).click()
  await has("Open requisitions")
  check("the tabs switch in place (same page, no navigation)", P.url() === urlBefore && /Command Centre/.test(await workspace()), P.url())
  const pdApi = (await api("GET", "/procurement/dashboards/procurement?preset=12m", adminTok)).json.data
  const openReq = await tileText("Open requisitions")
  check("Open requisitions equals the server figure", openReq.replace(/,/g, "").includes(String(pdApi.tiles.openRequisitions.value)), `${openReq.slice(0, 40)} vs ${pdApi.tiles.openRequisitions.value}`)
  const labels = (await P.locator(".pr23-tile .kpi-label").allInnerTexts()).map((x) => x.toLowerCase())
  const want = ["open requisitions", "pending approvals", "rfqs in progress", "tenders closing soon", "evaluations pending", "purchase orders issued", "vendor compliance exceptions", "procurement spend", "cycle time", "savings / variance", "overdue activities"]
  check("every SRD tile is on the procurement dashboard", want.every((w) => labels.includes(w)), want.filter((w) => !labels.includes(w)).join())
  check("no tile shows a placeholder dash or fixture number", !(await P.locator(".pr23-tile .kpi-value").allInnerTexts()).some((x) => /^\s*—\s*$/.test(x)), "")
  check("the charts are titled and labelled", (await P.locator(".pr23-chart figcaption strong").allInnerTexts()).some((x) => /Committed spend by month/i.test(x)) && (await P.locator(".pr23-legend").count()) >= 1)
  const barLabels = await P.locator(".pr23-chart", { hasText: "Requisitions by status" }).locator("svg text").evaluateAll((els) => els.map((e) => e.textContent))
  check("statuses that read the same are one bar (Converted to Sourcing appears once)", barLabels.filter((x) => x === "Converted to Sourcing").length <= 1, barLabels.join("|"))
  check("no amount reads \"No currency No currency\"", !/No currency No currency/.test(await workspace()))
  await shot("02-procurement")
  // date filter
  await P.selectOption('[data-dash23="preset"]', "custom")
  await P.fill('[data-dash23="from"]', day(0))
  await P.fill('[data-dash23="to"]', day(0))
  await P.click('[data-act23="dash-apply"]')
  await has(`${day(0)} to ${day(0)}`)
  const narrow = (await api("GET", `/procurement/dashboards/procurement?from=${day(0)}&to=${day(0)}`, adminTok)).json.data
  const poTile = await tileText("Purchase orders issued")
  check("the date filter reloads the tiles for that range and says which range", poTile.replace(/,/g, "").includes(String(narrow.tiles.purchaseOrdersIssued.value)) && (await workspace()).includes(`${day(0)} to ${day(0)}`), poTile.slice(0, 60))
  await P.fill('[data-dash23="from"]', day(1))
  await P.click('[data-act23="dash-apply"]')
  check("a From date after the To date is refused with a message", await has("Check the dates", 8000) || /after the To date/i.test(await text()))
  await P.click('[data-act23="dash-reset"]')
  await has("Last 12 months", 30000)
  // convert-to
  const cur2 = await P.locator('[data-dash23="convertTo"] option').allTextContents()
  check("the currency selector offers the system's currencies", cur2.includes("USD") && cur2.length >= 3, cur2.join())
  await P.selectOption('[data-dash23="convertTo"]', "ZIG")
  await P.click('[data-act23="dash-apply"]')
  await has("ZIG", 30000)
  const spendTile = await tileText("Procurement spend")
  check("choosing another currency restates the converted totals in it (or says there is no rate)", /ZIG/.test(spendTile), spendTile.slice(0, 200))
  await P.selectOption('[data-dash23="convertTo"]', "")
  await P.click('[data-act23="dash-reset"]')
  // drill-down from a chart
  await P.waitForTimeout(2500)
  const bar = P.locator(".pr23-chart g.pr23-bar[data-act23='drill']").first()
  check("chart bars are clickable drill-downs", (await bar.count()) === 1)
  await bar.click({ force: true })
  await has("Procurement Reports", 90000)
  await P.waitForURL(/\/procurement\/reports/, { timeout: 60000 }).catch(() => undefined)
  await P.waitForFunction(() => document.querySelector(".pr23-report-item.active"), null, { timeout: 60000 })
  const active = await P.locator(".pr23-report-item.active strong").innerText()
  const drillFilters = await P.locator("[data-rep23]").evaluateAll((els) => els.filter((e) => e.value && !["pageSize"].includes(e.dataset.rep23)).map((e) => `${e.dataset.rep23}=${e.value}`))
  check("clicking a bar opens the report behind it with its filters already applied", /Requisition Register|Purchase Order Register|Procurement Spend|Cycle|Tender/i.test(active) && drillFilters.length >= 1 && /\/procurement\/reports/.test(P.url()), `${active} ${drillFilters.join()} ${P.url()}`)
  await P.waitForFunction(() => /rows?\b/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  await shot("03-drill")
  // tiles drill too
  await open("", "dashboard")
  await P.getByRole("button", { name: "Procurement dashboard" }).click().catch(() => undefined)
  await has("Open requisitions")
  await P.locator(".pr23-tile", { hasText: "Open requisitions" }).first().click()
  await has("Requisition Register", 90000)
  check("clicking a tile opens the report behind its number", /Requisition Register/.test(await P.locator(".pr23-report-item.active strong").innerText()))
  // own-work view for someone with no procurement role
  await as(fx.bystander)
  await open("", "dashboard")
  await has("My procurement work")
  const tabs2 = await P.locator(".pr23-dash-tabs .tab").count()
  check("a member of staff with no procurement role sees only their own work (role-specific)", tabs2 === 0 && /My procurement work/.test(await workspace()) && !/Executive dashboard|Command Centre/.test(await workspace()) && (await P.locator(".pr23-dash-filters").count()) === 0)
  await shot("04-mine")
  const meApi = (await api("GET", "/procurement/dashboards/me", fx.bystander.token)).json.data
  const mineTile = await tileText("My requisitions")
  check("their own tiles match their records", mineTile.includes(String(meApi.mine.requisitionsTotal)))
  await as(fx.officer)
  await open("", "dashboard")
  await has("Open requisitions")
  check("procurement staff open on the procurement dashboard, with no executive tab", !(await P.locator(".pr23-dash-tabs .tab", { hasText: "Executive" }).count()) && /Command Centre/.test(await workspace()))
}

// ================================================================== reports
if (STAGES.includes("reports")) {
  console.log("\n== §37 Reports ==")
  await as(admin)
  await open("reports", "Procurement Reports")
  await P.waitForSelector(".pr23-report-item", { timeout: 60000 })
  const listApi = (await api("GET", "/procurement/reports", adminTok)).json.data
  const items = await P.locator(".pr23-report-item strong").allInnerTexts()
  check("all fifteen reports are listed by name", items.length === 15 && listApi.every((r) => items.includes(r.name)), items.length + " " + items.join("|"))
  await shot("05-reports")
  // every report runs from its button
  let bad = ""
  for (const r of listApi) {
    await P.locator(".pr23-report-item", { hasText: r.name }).first().click()
    await P.waitForFunction((n) => (document.querySelector(".pr23-report-main h3")?.innerText || "") === n && /row/.test(document.querySelector(".pr23-report-main")?.innerText || ""), r.name, { timeout: 60000 }).catch(() => { bad += ` ${r.key}` })
  }
  check("each report opens in place and runs from its button", bad === "", bad)
  // filters
  await P.locator(".pr23-report-item", { hasText: "Requisition Register" }).first().click()
  await P.waitForSelector('[data-rep23="status"]')
  await P.fill('[data-rep23="status"]', "DRAFT")
  await P.click('[data-act23="rep-apply"]')
  await P.waitForFunction(() => /status: DRAFT/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  const api1 = (await api("GET", "/procurement/reports/requisition-register?status=DRAFT&pageSize=1", adminTok)).json.data
  const shown = await P.locator(".pr23-report-main .table-tools .muted").first().innerText()
  check("the status filter filters: the row count equals the server's for that status", shown.replace(/,/g, "").includes(`${api1.total} row`), `${shown} vs ${api1.total}`)
  const cells = await P.locator(".pr23-report-main table tbody tr td:nth-child(6)").allInnerTexts()
  check("every row on the page has that status", cells.length > 0 && cells.every((x) => /draft/i.test(x)), cells.slice(0, 3).join())
  await P.fill('[data-rep23="status"]', "Under Review")
  await P.click('[data-act23="rep-apply"]')
  await P.waitForFunction(() => /status: Under Review/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  const apiUR = (await api("GET", "/procurement/reports/requisition-register?status=Under%20Review&pageSize=1", adminTok)).json.data
  check("a status can be filtered by the name it has on screen (Under Review), not only its stored code", apiUR.total > 0 && (await P.locator(".pr23-report-main .table-tools .muted").first().innerText()).replace(/,/g, "").includes(`${apiUR.total} row`), `${apiUR.total}`)
  check("dates and figures in a report do not wrap across lines", await P.locator(".pr23-report-main table tbody tr:first-child td:nth-child(7)").evaluate((td) => getComputedStyle(td).whiteSpace === "nowrap"))
  await P.fill('[data-rep23="status"]', "DRAFT")
  await P.click('[data-act23="rep-apply"]')
  await P.waitForFunction(() => /status: DRAFT/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  await P.fill('[data-rep23="from"]', "2001-01-01")
  await P.fill('[data-rep23="to"]', "2001-12-31")
  await P.click('[data-act23="rep-apply"]')
  await has("No records match these filters", 60000)
  check("a filter with no match shows the empty state", /No records match these filters/.test(await workspace()))
  await P.click('[data-act23="rep-reset"]')
  await P.waitForFunction(() => !/status: DRAFT/.test(document.querySelector(".pr23-report-main")?.innerText || "") && /no filters/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  // paging
  await P.selectOption('[data-rep23="pageSize"]', "10")
  await P.waitForFunction(() => document.querySelectorAll(".pr23-report-main table tbody tr").length === 10, null, { timeout: 60000 })
  const pg1 = await P.locator(".pr23-report-main table tbody tr td:first-child").allInnerTexts()
  await P.click('[data-act23="rep-page"][data-to="next"]')
  await P.waitForFunction((first) => document.querySelector(".pr23-report-main table tbody tr td:first-child")?.innerText !== first, pg1[0], { timeout: 60000 })
  const pg2 = await P.locator(".pr23-report-main table tbody tr td:first-child").allInnerTexts()
  check("the report is paged: the page size applies and the next page shows other rows", pg1.length === 10 && pg2.length > 0 && !pg2.some((x) => pg1.includes(x)) && /Page 2 of/.test(await P.locator(".pr23-report-main").innerText()))
  // exports
  await P.click('[data-act23="rep-reset"]')
  await P.fill('[data-rep23="status"]', "DRAFT").catch(() => undefined)
  await P.click('[data-act23="rep-apply"]')
  await P.waitForFunction(() => /status: DRAFT/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  const csv = await download(() => P.click('[data-act23="rep-export"][data-format="csv"]'))
  const csvLines = csv.buf.toString("utf8").replace(/^\uFEFF/, "").split("\r\n").filter(Boolean)
  check("CSV: a real .csv with a header and exactly the filtered rows", /\.csv$/.test(csv.name) && csvLines.length - 1 === api1.total && /Requisition/.test(csvLines[0]), `${csv.name} ${csvLines.length - 1} vs ${api1.total}`)
  const x = await download(() => P.click('[data-act23="rep-export"][data-format="xlsx"]'))
  let wb = null
  try { wb = XLSX.read(x.buf, { type: "buffer" }) } catch { /* */ }
  check("XLSX: a real workbook (zip signature, opens, has the Report sheet)", /\.xlsx$/.test(x.name) && x.buf.subarray(0, 2).toString() === "PK" && !!wb && wb.SheetNames.includes("Report"), `${x.name} ${x.buf.subarray(0, 4).toString("hex")}`)
  const pdf = await download(() => P.click('[data-act23="rep-export"][data-format="pdf"]'))
  check("PDF: a real PDF", /\.pdf$/.test(pdf.name) && pdf.buf.subarray(0, 5).toString() === "%PDF-" && pdf.buf.length > 1500, `${pdf.name} ${pdf.buf.subarray(0, 8).toString()}`)
  // money report: per-currency totals
  await P.locator(".pr23-report-item", { hasText: "Purchase Order Register" }).first().click()
  await P.waitForFunction(() => /Totals/.test(document.querySelector(".pr23-report-main")?.innerText || ""), null, { timeout: 60000 })
  const totals = await P.locator(".pr23-report-totals").innerText()
  check("a money report states its totals per currency and never adds them together", /Each currency is totalled on its own/.test(totals) && /USD/.test(totals), totals.slice(0, 200))
  await shot("06-report-totals")
  // roles
  await as(fx.officer)
  await open("reports", "Procurement Reports")
  await P.waitForSelector(".pr23-report-item", { timeout: 60000 })
  const canExport = await P.locator('[data-act23="rep-export"]').count()
  check("a role that can read reports but not export them is offered no export button and is told so", canExport === 0 && /Export is not available to your role/.test(await workspace()), `${canExport}`)
  await as(fx.bystander)
  await open("reports", "Procurement Reports")
  check("a role without the reports grant is told so, with no report shown", /not available to your role|access|not permitted/i.test(await workspace()) && !(await P.locator(".pr23-report-item").count()), (await workspace()).slice(0, 160))
}

// ================================================================== lists
const listCase = async (route, marker, label) => {
  await open(route, marker)
  await P.waitForSelector(".pr23-list-tools", { timeout: 120000 })
  await P.waitForTimeout(1500)
  const bar = P.locator(".pr23-list-tools").first()
  const total = () => bar.locator("[data-lf-count]").innerText()
  const visibleRows = () => P.locator("#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-pg-hide):not(.pr23-lf-empty)").count()
  const all = await total()
  check(`${label}: the list has a search box and filters`, (await bar.locator('[data-lf="q"]').count()) === 1, all)
  return { bar, total, visibleRows, all }
}

if (STAGES.includes("lists")) {
  console.log("\n== §36 Search, filters, sorting, paging and export on the lists ==")
  await as(admin)
  // ---- purchase orders: the fixture supplier
  let L = await listCase("purchase-orders", "Purchase Orders", "Purchase orders")
  await L.bar.locator('[data-lf="q"]').fill(fx.vendor.name.split(" ")[0])
  await P.waitForTimeout(600)
  let n = await L.visibleRows()
  const poByVendor = (await api("GET", `/procurement/purchase-orders?vendorId=${fx.vendor.id}`, adminTok)).json
  check("searching by supplier name narrows the list to that supplier's orders", n >= 1 && (await P.locator("#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-pg-hide)").allInnerTexts()).every((t) => new RegExp(fx.vendor.name.split(" ")[0]).test(t)), `${n}`)
  await L.bar.locator('[data-lf="q"]').fill("")
  await L.bar.locator('[data-lf="q"]').fill(fx.po.number)
  await P.waitForTimeout(600)
  check("searching by reference finds the record", (await L.visibleRows()) === 1, `${await L.visibleRows()}`)
  await L.bar.locator('[data-lf="q"]').fill("zzzz-no-such-record")
  await P.waitForTimeout(600)
  check("a search with no match says so", /No record matches these filters/.test(await workspace()) && (await L.visibleRows()) === 0)
  await L.bar.locator("[data-act23='lf-clear']").click()
  await P.waitForTimeout(500)
  check("Clear filters restores the list", (await L.total()) === L.all, `${await L.total()} vs ${L.all}`)
  // status filter
  const statusSel = L.bar.locator('[data-lf="status"]')
  const statusOptions = await statusSel.locator("option").allTextContents()
  check("the purchase order register has one filter row, not two", (await P.locator("#poFiltersV23").count()) === 0 && (await P.locator(".pr23-list-tools").count()) === 1)
  check("the status filter offers the statuses in use, by their SRD names (Issued, not Sent to vendor)", statusOptions.some((s) => /Issued/.test(s)) && !statusOptions.some((s) => /Sent to vendor/.test(s)), statusOptions.join())
  await statusSel.selectOption({ label: "Issued" })
  await P.waitForTimeout(600)
  const rowsIssued = await P.locator("#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-pg-hide)").allInnerTexts()
  check("filtering by status shows only that status", rowsIssued.length > 0 && rowsIssued.every((t) => /Issued/.test(t)), `${rowsIssued.length}`)
  // compound: status + value range
  const minV = 1000
  await L.bar.locator('[data-lf="min"]').fill(String(minV))
  await P.waitForTimeout(600)
  const compound = await P.locator("#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-pg-hide)").allInnerTexts()
  const amounts = compound.map((t) => Number((t.match(/\$\s?([\d,]+(\.\d+)?)/) || [])[1]?.replace(/,/g, "")))
  check("compound filter (status + minimum value): every row satisfies both and the list did not grow", compound.length <= rowsIssued.length && compound.every((t) => /Issued/.test(t)) && amounts.every((a) => a >= minV), `${compound.length} ${amounts.slice(0, 4)}`)
  await L.bar.locator('[data-lf="from"]').fill(day(-1)).catch(() => undefined)
  await L.bar.locator('[data-lf="to"]').fill(day(1)).catch(() => undefined)
  await P.waitForTimeout(600)
  const withDates = await visibleCount(L)
  check("a date range narrows it further (or holds it) without breaking the others", withDates <= compound.length, `${withDates} vs ${compound.length}`)
  await L.bar.locator("[data-act23='lf-clear']").click()
  // sorting
  await P.waitForTimeout(500)
  const amountIdx = (await P.locator("#workspace table thead th").allInnerTexts()).findIndex((h) => /amount|value/i.test(h))
  if (amountIdx >= 0) {
    await P.locator("#workspace table thead th.pr23-sortable", { hasText: /^\s*(Amount|Value)/i }).first().click()
    await P.waitForTimeout(500)
    const col = async () => (await P.locator(`#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-pg-hide):not(.pr23-lf-empty) td:nth-child(${amountIdx + 1})`).allInnerTexts()).map((t) => Number(t.replace(/[^0-9.\-]/g, ""))).filter((x) => Number.isFinite(x))
    const asc = await col()
    check("clicking a column header sorts ascending", asc.length > 1 && asc.every((v, i) => i === 0 || v >= asc[i - 1]), asc.slice(0, 8).join())
    await P.locator("#workspace table thead th.pr23-sortable", { hasText: /^\s*(Amount|Value)/i }).first().click()
    await P.waitForTimeout(500)
    const desc = await col()
    check("clicking again sorts descending", desc.length > 1 && desc.every((v, i) => i === 0 || v <= desc[i - 1]), desc.slice(0, 8).join())
  }
  // page size
  await P.locator(".pr23-tbl-pager select").first().selectOption("10").catch(() => undefined)
  await P.waitForTimeout(600)
  const paged = await visibleCount(L)
  check("the page size is configurable and applies to the filtered list", paged <= 10 && paged > 0, `${paged}`)
  await shot("07-orders-list")
  // export
  await L.bar.locator('[data-lf="q"]').fill(fx.vendor.name.split(" ")[0])
  await P.waitForTimeout(600)
  const shownNow = (await P.locator("#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-lf-empty)").count())
  const exp = await download(() => L.bar.locator("[data-act23='lf-export']").click())
  const lines = exp.buf.toString("utf8").replace(/^\uFEFF/, "").split("\r\n").filter(Boolean)
  check("Export CSV downloads exactly the filtered rows with the list's own columns", /\.csv$/.test(exp.name) && lines.length - 1 === shownNow && /Purchase order|PO|Vendor/i.test(lines[0]), `${exp.name} ${lines.length - 1} vs ${shownNow} ${lines[0]}`)

  // ---- the other lists
  for (const [route, marker, label] of [["requisitions", "My Purchase Requisitions", "Requisitions"], ["invoices", "Invoices", "Invoices"], ["tenders", "Tenders & RFx", "Tenders"], ["goods-received", "Receiving", "Receipts"]]) {
    const X = await listCase(route, marker, label)
    const first = (await P.locator("#workspace table tbody tr:not(.pr23-lf-hide)").first().innerText()).split(/\s+/).find((w) => /[A-Za-z0-9_-]{6,}/.test(w)) || ""
    if (first) {
      await X.bar.locator('[data-lf="q"]').fill(first)
      await P.waitForTimeout(500)
      const c = await visibleCount(X)
      check(`${label}: searching for a reference on the list finds it`, c >= 1 && c <= (Number((X.all.match(/\d+/) || [0])[0]) || 9999), `${first} -> ${c}`)
      await X.bar.locator("[data-act23='lf-clear']").click()
    }
    const sels = await X.bar.locator("select[data-lf]").count()
    check(`${label}: the list offers at least one working filter beyond search`, sels >= 1 || (await X.bar.locator('[data-lf="from"]').count()) >= 1, `${sels}`)
    if (sels) {
      const s0 = X.bar.locator("select[data-lf]").first()
      const opts = await s0.locator("option").allTextContents()
      if (opts.length > 2) {
        await s0.selectOption({ index: 1 })
        await P.waitForTimeout(500)
        const c2 = await visibleCount(X)
        check(`${label}: choosing a filter value narrows the list`, c2 >= 1 && c2 <= Number((X.all.match(/\d+/) || [0])[0]), `${c2}`)
        await X.bar.locator("[data-act23='lf-clear']").click()
      }
    }
    await shot(`08-${route}-list`)
  }
}
if (STAGES.includes("lists")) {
  await open("vendors", "Vendor Registry")
  await P.waitForSelector("#vendorToolbarV23", { timeout: 120000 })
  await P.waitForSelector(".pr23-list-tools", { timeout: 60000 })
  check("the vendor registry keeps its own search and filters and adds sorting and export without a second search box", (await P.locator("#vendorToolbarV23").count()) === 1 && (await P.locator(".pr23-list-tools [data-lf='q']").count()) === 0 && (await P.locator(".pr23-list-tools [data-act23='lf-export']").count()) === 1)
  const vexp = await download(() => P.locator(".pr23-list-tools [data-act23='lf-export']").click())
  check("the vendor list exports as CSV", /\.csv$/.test(vexp.name) && vexp.buf.toString("utf8").split("\r\n").filter(Boolean).length > 1, vexp.name)
}
async function visibleCount(L) { return P.locator("#workspace table tbody tr:not(.pr23-lf-hide):not(.pr23-pg-hide):not(.pr23-lf-empty)").count() }

// ================================================================== settings tabs
if (STAGES.includes("settings")) {
  console.log("\n== §34, §38, §39 Configuration tabs ==")
  await api("PUT", "/procurement/notification-rules", adminTok, { rules: { REQUISITION_REJECTED: { enabled: true } } })
  await as(admin)
  await open("settings", "Configuration")
  // numbering
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Numbering" }).click()
  await P.waitForSelector('[data-num23="PURCHASE_ORDER"]', { timeout: 60000 })
  const urlSettings = P.url()
  const numKeys = await P.locator("[data-num-row]").count()
  check("every numbered reference has an editable format with a worked example", numKeys === 7 && (await P.locator("[data-num-example] code").first().innerText()).length > 3, `${numKeys}`)
  await P.fill('[data-num23="PURCHASE_ORDER"]', "PO-{YYYY}")
  check("a format with no counter is refused as you type", /counter/i.test(await P.locator('[data-num-error="PURCHASE_ORDER"]').innerText()))
  await P.click('[data-act23="num-save"]')
  check("saving an invalid format is blocked with a message", await has("Check the formats", 8000))
  const newFmt = `PO/{YYYY}/UI{######}`
  await P.fill('[data-num23="PURCHASE_ORDER"]', newFmt)
  const ex = await P.locator('[data-num-example="PURCHASE_ORDER"]').innerText()
  check("the example updates as the format is typed", new RegExp(`^PO/${new Date().getFullYear()}/UI000001$`).test(ex.trim()), ex)
  // loading state on the save (delay the response)
  await P.route("**/procurement/numbering", async (route) => { if (route.request().method() === "PUT") await new Promise((r) => setTimeout(r, 2500)); await route.continue() })
  const t = await toast(async () => { await P.click('[data-act23="num-save"]'); await P.waitForTimeout(600); check("the save button shows it is working while the request is in flight", await P.locator('[data-act23="num-save"].pr23-busy').count() === 1) })
  await P.unroute("**/procurement/numbering")
  check("saved formats are confirmed", /Formats saved/i.test(t), t)
  const apiNum = (await api("GET", "/procurement/numbering", adminTok)).json.data.find((x) => x.key === "PURCHASE_ORDER")
  check("the format is stored on the server", apiNum.format === newFmt, apiNum.format)
  await P.reload({ waitUntil: "domcontentloaded" })
  await P.waitForSelector("text=Configuration", { timeout: 120000 })
  await P.waitForTimeout(3500)
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Numbering" }).click()
  await P.waitForSelector('[data-num23="PURCHASE_ORDER"]')
  check("the format is still there after a reload", (await P.inputValue('[data-num23="PURCHASE_ORDER"]')) === newFmt)
  const mk = await api("POST", "/procurement/purchase-orders", fx.officer.token, { vendorId: fx.vendor.id, currencyId: (await api("GET", "/procurement/fx", adminTok)).json.data.currencies.find((c) => c.code === "USD").id, items: [{ itemName: "Cable", quantity: 1, unitPrice: 5 }], paymentTerms: "Net 30", shippingAddress: "Store", expectedDeliveryDate: new Date(Date.now() + 9 * 86400000).toISOString() })
  check("the next order really is numbered in the new format", mk.status === 201 && new RegExp(`^PO/${new Date().getFullYear()}/UI\\d{6}$`).test(mk.json?.data?.poNumber), `${mk.status} ${mk.json?.data?.poNumber}`)
  if (mk.status === 201) await api("PUT", `/procurement/purchase-orders/${mk.json.data.id}/cancel`, fx.manager.token, { reason: "ui test" })
  await P.click('[data-act23="num-reset"]')
  await P.click('[data-act23="num-save"]')
  await has("Formats saved", 20000)
  await shot("09-numbering")
  // currency
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Currency" }).click()
  await P.waitForSelector("#pr23FxForm", { timeout: 60000 })
  check("the reporting currency, rate source and maximum rate age are settings", (await P.locator('#pr23FxForm select[name="reportingCurrency"]').count()) === 1 && (await P.locator('#pr23FxForm input[name="maxAgeDays"]').count()) === 1)
  await P.selectOption('#pr23FxForm select[name="source"]', "URL")
  check("choosing a rate service asks for its URL", await P.locator("[data-fx-url]").isVisible())
  await P.fill('#pr23FxForm input[name="sourceUrl"]', "")
  await P.click('[data-act23="fx-save"]')
  let tt = await has("Give the URL", 15000) || await has("Settings not saved", 5000)
  check("a rate service without a URL is refused", tt)
  await P.selectOption('#pr23FxForm select[name="source"]', "TABLE")
  const rateDate = day(-2)
  await P.selectOption('#pr23RateForm select[name="from"]', "ZIG")
  await P.selectOption('#pr23RateForm select[name="to"]', "USD")
  await P.fill('#pr23RateForm input[name="rate"]', "0")
  await P.click('[data-act23="rate-save"]')
  check("a zero rate is refused", await has("The rate must be greater than zero", 8000))
  await P.fill('#pr23RateForm input[name="rate"]', "0.037")
  await P.fill('#pr23RateForm input[name="date"]', rateDate)
  const rt = await toast(() => P.click('[data-act23="rate-save"]'))
  check("an exchange rate is added and confirmed", /Rate saved/i.test(rt), rt)
  await has("0.037", 30000)
  check("the rate appears in the table with its pair, date and source", (await P.locator("tr", { hasText: rateDate }).first().innerText()).match(/ZIG.*USD.*0\.037.*manual/is) !== null)
  const apiRates = (await api("GET", "/procurement/fx/rates", adminTok)).json.data
  check("the rate is stored on the server", apiRates.some((r) => r.from === "ZIG" && r.to === "USD" && r.date === rateDate && r.rate === 0.037))
  await shot("10-currency")
  await P.locator("tr", { hasText: rateDate }).first().locator('[data-act23="rate-delete"]').click()
  await P.waitForFunction((d) => !document.body.innerText.includes(d) || true, rateDate)
  await P.waitForTimeout(1500)
  check("a rate can be removed", !(await api("GET", "/procurement/fx/rates", adminTok)).json.data.some((r) => r.date === rateDate && r.from === "ZIG" && r.rate === 0.037))
  // notifications
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Notifications" }).click()
  await P.waitForSelector("[data-rule-row]", { timeout: 60000 })
  const ruleRows = await P.locator("[data-rule-row]").count()
  check("all fourteen events are configurable rules", ruleRows === 14, `${ruleRows}`)
  check("timed rules carry their thresholds", (await P.locator("[data-rule-param]").count()) >= 4)
  await P.locator('[data-rule="REQUISITION_REJECTED:enabled"]').evaluate((el) => el.click())
  const rt2 = await toast(() => P.click('[data-act23="rules-save"]'))
  check("rules are saved and confirmed", /Rules saved/i.test(rt2), rt2)
  const ruleApi = (await api("GET", "/procurement/notification-rules", adminTok)).json.data.find((x) => x.key === "REQUISITION_REJECTED")
  check("switching a rule off is stored (and turning it off stops that notification: see the API suite)", ruleApi.enabled === false)
  await P.reload({ waitUntil: "domcontentloaded" })
  await P.waitForSelector("text=Configuration", { timeout: 120000 })
  await P.waitForTimeout(3000)
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Notifications" }).click()
  await P.waitForSelector("[data-rule-row]")
  check("the switch is still off after a reload", !(await P.locator('[data-rule="REQUISITION_REJECTED:enabled"]').isChecked()))
  await P.locator('[data-rule="REQUISITION_REJECTED:enabled"]').evaluate((el) => el.click())
  await P.click('[data-act23="rules-save"]')
  await has("Rules saved", 20000)
  await P.waitForSelector("text=Notification log", { timeout: 60000 })
  await P.waitForFunction(() => document.querySelectorAll("#workspace table")[1]?.tBodies[0]?.rows.length > 0, null, { timeout: 60000 }).catch(() => undefined)
  const logRows = await P.locator("#workspace table").nth(1).locator("tbody tr").count()
  check("the notification log shows what the dispatcher did, per recipient and channel", logRows > 0 && /Held by the mail guard|Sent|Blocked|Disabled|Switched off|Skipped/i.test(await P.locator("#workspace").innerText()), `${logRows}`)
  await P.selectOption('[data-log23="status"]', "DISABLED")
  await P.click('[data-act23="log-apply"]')
  await P.waitForFunction(() => { const t = [...document.querySelectorAll("#workspace table")].pop(); const cells = t ? [...t.tBodies[0].rows].map((r) => r.cells[4] && r.cells[4].textContent) : []; return cells.length === 0 || cells.every((c) => /Disabled/i.test(c || "")) || /Nothing has been recorded/.test(document.body.innerText); }, null, { timeout: 60000 }).catch(() => undefined)
  const dis = await P.locator("#workspace table").last().locator("tbody tr td:nth-child(5)").allInnerTexts()
  check("the log filters by outcome", dis.length > 0 ? dis.every((x) => /Disabled/i.test(x)) : /Nothing has been recorded/.test(await workspace()), dis.slice(0, 3).join())
  await shot("11-notifications")
  await as(fx.bystander)
  await open("settings", "Configuration")
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Notifications" }).click()
  await P.waitForTimeout(2500)
  check("staff without the settings grant see the rules read-only (no save button)", (await P.locator('[data-act23="rules-save"]').count()) === 0 || (await P.locator('[data-rule]').first().isDisabled()))
  void urlSettings
}

// ================================================================== statuses
if (STAGES.includes("status")) {
  console.log("\n== §40 Statuses in the interface ==")
  await api("PUT", "/procurement/approval-matrix", adminTok, { steps: [{ kind: "USER", userId: fx.approver.id }] })
  const mkPr = async (title) => (await api("POST", "/procurement/requisitions", fx.officer.token, { title, department: "Procurement", requiredDate: day(20), items: [{ itemName: "Chairs", quantity: 2, unit: "ea", unitPrice: 40 }] })).json.data
  const prDraft = await mkPr(`${fx.TAG} status draft`)
  await as(fx.officer)
  await open("requisitions", "My Purchase Requisitions")
  await P.waitForFunction((t) => document.body.innerText.includes(t), `${fx.TAG} status draft`, { timeout: 120000 })
  const row = P.locator("tr", { hasText: `${fx.TAG} status draft` }).first()
  check("a new requisition reads Draft", /Draft/.test(await row.innerText()))
  await row.locator("button, .link").first().click().catch(() => undefined)
  // open it through its row action
  const opener = row.locator('[data-action="edit-pr-v11"], [data-action="view-pr-v11"]').first()
  if (await opener.count()) await opener.click(); else await row.locator(".row-actions-trigger-v16").first().click().then(() => P.getByRole("menuitem").first().click())
  await P.waitForSelector("#modalLayer.open", { timeout: 30000 })
  await P.waitForTimeout(1500)
  const foot = await P.locator("#modalLayer.open #modalFoot").innerText()
  check("the drawer of a draft offers Cancel requisition (the status map allows it) and no Close", /Cancel requisition/.test(foot) && !/Close requisition/.test(foot), foot.replace(/\s+/g, " "))
  await P.getByRole("button", { name: "Cancel requisition" }).click()
  await P.waitForSelector("#pr23LifeReason", { timeout: 15000 })
  await P.click('[data-act23="life-confirm"]')
  check("cancelling without a reason is refused", await has("Give a reason", 8000) && (await api("GET", `/procurement/requisitions/${prDraft.id}`, fx.officer.token)).json.data.status === "DRAFT")
  await P.fill("#pr23LifeReason", "Raised in error by the UI test.")
  await P.route("**/procurement/requisitions/*/cancel", async (route) => { await new Promise((r) => setTimeout(r, 2000)); await route.continue() })
  const ct = await toast(async () => { await P.click('[data-act23="life-confirm"]'); await P.waitForTimeout(500); check("the confirm button shows it is working", (await P.locator('[data-act23="life-confirm"].pr23-busy').count()) === 1) })
  await P.unroute("**/procurement/requisitions/*/cancel")
  check("the requisition is cancelled and the change confirmed", /Requisition cancelled/i.test(ct), ct)
  check("the server holds it as Cancelled", (await api("GET", `/procurement/requisitions/${prDraft.id}`, fx.officer.token)).json.data.status === "CANCELLED")
  await P.waitForFunction((t) => /Cancelled/.test(document.querySelector("tr:has(td)")?.innerText || "") || [...document.querySelectorAll("tr")].some((r) => r.innerText.includes(t) && /Cancelled/.test(r.innerText)), `${fx.TAG} status draft`, { timeout: 90000 })
  check("the list now reads Cancelled", /Cancelled/.test(await P.locator("tr", { hasText: `${fx.TAG} status draft` }).first().innerText()))
  await P.locator("tr", { hasText: `${fx.TAG} status draft` }).first().locator('[data-action="view-pr-v11"], [data-action="edit-pr-v11"]').first().click().catch(() => undefined)
  await P.waitForTimeout(2000)
  const foot2 = await P.locator("#modalLayer.open #modalFoot").innerText().catch(() => "")
  check("a Cancelled requisition offers no Cancel, Close, Save or Submit (terminal)", !/Cancel requisition|Close requisition|Save draft|Save and submit/.test(foot2), foot2.replace(/\s+/g, " "))
  await shot("12-cancelled")
  await P.keyboard.press("Escape").catch(() => undefined)

  // a submitted requisition reads Under Review
  const prSub = await mkPr(`${fx.TAG} status review`)
  await api("PUT", `/procurement/requisitions/${prSub.id}/submit`, fx.officer.token)
  await open("requisitions", "My Purchase Requisitions")
  await P.waitForFunction((t) => document.body.innerText.includes(t), `${fx.TAG} status review`, { timeout: 120000 })
  check("a requisition on its approval route reads Under Review", /Under Review/.test(await P.locator("tr", { hasText: `${fx.TAG} status review` }).first().innerText()))

  // sourcing event: draft, approve, publish
  const rq = await api("POST", "/procurement/rfq", fx.manager.token, { title: `${fx.TAG} status rfq`, vendorIds: [fx.vendor.id], description: "x", items: [{ itemName: "Desks", quantity: 2, unit: "ea" }], rfqDeadline: new Date(Date.now() + 6 * 86400000).toISOString(), visibility: "INVITED_ONLY", saveAsDraft: true })
  await as(fx.manager)
  await open("tenders", "Tenders & RFx")
  await P.waitForFunction((t) => document.body.innerText.includes(t), `${fx.TAG} status rfq`, { timeout: 120000 })
  const trow = P.locator("tr", { hasText: `${fx.TAG} status rfq` }).first()
  check("a sourcing event saved as a draft reads Draft", rq.status === 201 && /Draft/.test(await trow.innerText()), `${rq.status} ${await trow.innerText().catch(() => "")}`)
  await trow.locator('[data-action="edit-tender-v23"]').first().click().catch(async () => { await trow.locator(".row-actions-trigger-v16").first().click(); await P.getByRole("menuitem", { name: /Edit/ }).first().click() })
  await P.waitForSelector("#modalLayer.open", { timeout: 30000 })
  await P.waitForTimeout(1500)
  const tfoot = await P.locator("#modalLayer.open #modalFoot").innerText()
  check("a draft event offers Approve, Publish and Cancel — and not Close", /Approve/.test(tfoot) && /Publish/.test(tfoot) && /Cancel event/.test(tfoot) && !/Close now/.test(tfoot), tfoot.replace(/\s+/g, " "))
  await P.getByRole("button", { name: "Approve", exact: true }).click()
  check("the person who drafted it cannot approve it (the server says so)", await has("cannot be approved by the person who drafted it", 20000))
  await P.keyboard.press("Escape").catch(() => undefined)
  await as(admin)
  await open("tenders", "Tenders & RFx")
  await P.waitForFunction((t) => document.body.innerText.includes(t), `${fx.TAG} status rfq`, { timeout: 120000 })
  const arow = P.locator("tr", { hasText: `${fx.TAG} status rfq` }).first()
  await arow.locator('[data-action="edit-tender-v23"]').first().click().catch(async () => { await arow.locator(".row-actions-trigger-v16").first().click(); await P.getByRole("menuitem", { name: /Edit/ }).first().click() })
  await P.waitForSelector("#modalLayer.open", { timeout: 30000 })
  await P.waitForTimeout(1500)
  const at = await toast(() => P.getByRole("button", { name: "Approve", exact: true }).click())
  check("someone else approves the draft", /approved/i.test(at), at)
  await open("tenders", "Tenders & RFx")
  await P.waitForFunction((t) => [...document.querySelectorAll("tr")].some((r) => r.innerText.includes(t) && /Approved/.test(r.innerText)), `${fx.TAG} status rfq`, { timeout: 120000 })
  const prow = P.locator("tr", { hasText: `${fx.TAG} status rfq` }).first()
  await prow.locator('[data-action="edit-tender-v23"]').first().click().catch(async () => { await prow.locator(".row-actions-trigger-v16").first().click(); await P.getByRole("menuitem", { name: /Edit/ }).first().click() })
  await P.waitForSelector("#modalLayer.open", { timeout: 30000 })
  await P.waitForTimeout(1500)
  const ptfoot = await P.locator("#modalLayer.open #modalFoot").innerText()
  check("an approved event no longer offers Approve", !/^Approve$/m.test(ptfoot.split("\n").map((x) => x.trim()).join("\n")) && /Publish/.test(ptfoot), ptfoot.replace(/\s+/g, " "))
  const pt = await toast(() => P.getByRole("button", { name: /Publish and send invitations/ }).click())
  check("publishing sends the invitations and confirms", /published/i.test(pt), pt)
  await open("tenders", "Tenders & RFx")
  await P.waitForFunction((t) => [...document.querySelectorAll("tr")].some((r) => r.innerText.includes(t) && /Open/.test(r.innerText)), `${fx.TAG} status rfq`, { timeout: 120000 })
  check("the published event reads Open", /Open/.test(await P.locator("tr", { hasText: `${fx.TAG} status rfq` }).first().innerText()))
  const rfqRow = (await api("GET", "/procurement/rfq?limit=500", adminTok)).json
  await shot("13-rfq-open")

  // the issued order
  await as(fx.officer)
  await open("purchase-orders", "Purchase Orders")
  await P.waitForFunction((t) => document.body.innerText.includes(t), fx.po.number, { timeout: 120000 })
  check("a purchase order sent to the supplier reads Issued", /Issued/.test(await P.locator("tr", { hasText: fx.po.number }).first().innerText()))
  await api("PUT", "/procurement/approval-matrix", adminTok, { steps: (origMatrix?.steps ?? []).map((s) => ({ ...s })) })
  void rfqRow
}

// ================================================================== error, loading and empty states
if (STAGES.includes("states")) {
  console.log("\n== Loading, empty and error states ==")
  await as(admin)
  await P.route("**/procurement/dashboards/**", (route) => route.abort())
  await P.goto(`${FE}/procurement`, { waitUntil: "domcontentloaded" })
  await P.waitForSelector("text=The dashboard could not be loaded", { timeout: 180000 })
  check("a dashboard that cannot load says so plainly and offers Try again", (await P.getByRole("button", { name: "Try again" }).count()) >= 1)
  await shot("14-dash-error")
  await P.unroute("**/procurement/dashboards/**")
  await P.getByRole("button", { name: "Try again" }).first().click()
  await P.waitForSelector("text=Total procurement value", { timeout: 90000 })
  check("Try again recovers", true)
  await P.route("**/procurement/reports/*", (route) => (route.request().url().includes("/export") ? route.continue() : route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, message: "The report service is down." }) })))
  await open("reports", "Procurement Reports")
  await has("The report could not be produced", 60000)
  check("a report that fails says why and can be retried", /The report service is down/.test(await workspace()) && (await P.locator('[data-act23="rep-retry"]').count()) === 1)
  await P.unroute("**/procurement/reports/*")
  await P.click('[data-act23="rep-retry"]')
  await has("row", 60000)
  check("retrying the report works", /rows?\b/.test(await P.locator(".pr23-report-main").innerText()))
  await P.route("**/procurement/numbering", (route) => route.abort())
  await open("settings", "Configuration")
  await P.locator(".settings-tabs-v5 .tab", { hasText: "Numbering" }).click()
  await has("Could not load", 30000)
  check("a configuration tab that cannot load says so and offers Try again", /Could not load/.test(await workspace()) && (await P.locator('[data-act23="cfg-reload"]').count()) === 1)
  await P.unroute("**/procurement/numbering")
}

// restore
await api("PUT", "/procurement/notification-rules", adminTok, { rules: Object.fromEntries((origRules ?? []).map((x) => [x.key, { enabled: x.enabled, inApp: x.inApp, email: x.email, params: x.params }])) })
await api("PUT", "/procurement/numbering", adminTok, { formats: Object.fromEntries((origNumbering ?? []).map((x) => [x.key, x.format])) })
if (origFx) await api("PUT", "/procurement/fx", adminTok, { reportingCurrency: origFx.reportingCurrency, source: origFx.source, sourceUrl: origFx.sourceUrl ?? "", maxAgeDays: origFx.maxAgeDays })
check("no unhandled page error was thrown during the run", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "))
await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) { console.log("FAILED:"); failed.forEach((f) => console.log("  - " + f.name)); process.exitCode = 1 }
