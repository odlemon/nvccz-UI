/**
 * The requisition form helps: a Project / cost centre, and line suggestions from items bought before (dev).
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-requisition-assist.mjs
 *
 * Needs one active project whose name starts "UAT project" (dev_uat_project.mjs --apply). As the requester:
 *   - the New requisition form offers the project, found by typing in its search;
 *   - typing "Boardroom" suggests the item bought on PO_20260908_0004 with its last price and vendor, and choosing it
 *     fills the estimate and says where the figure came from;
 *   - the draft saved carries the project and the estimate, and its view names the project;
 *   - the API refuses a project that does not exist.
 * The draft is titled "UAT requisition assist ..." and removed by dev_cleanup_procurement.mjs.
 */
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const OUT = path.resolve(process.env.OUT || ".")
const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
const login = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "proc.requester@nts.local", password: "admin123", portal: "staff" }) })).json()
const auth = { Authorization: `Bearer ${login.token || login?.data?.token}` }
const get = async (p) => (await (await fetch(API + p, { headers: auth })).json().catch(() => ({})))?.data ?? []

const projects = await get("/procurement/requisition-projects")
const project = projects.find((p) => /^UAT project/.test(p.name))
if (!project) {
  console.log("No active 'UAT project' on dev. Run dev_uat_project.mjs --apply first.")
  process.exit(1)
}
const suggestions = await get("/procurement/requisitions/line-suggestions?q=Boardroom")
const table = suggestions.find((s) => /Boardroom table/i.test(s.itemName))
check(Boolean(table) && Number(table.lastPrice) === 2750 && (table.vendors ?? []).some((v) => /Msasa/.test(v.name)), "the API suggests the boardroom table at its last price, from Msasa", JSON.stringify(table ?? {}).slice(0, 160))
const bogus = await fetch(`${API}/procurement/requisitions`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ title: `UAT requisition assist bogus ${Date.now()}`, department: "Operations", projectId: "no-such-project", items: [{ itemName: "x", quantity: 1 }] }),
})
check(bogus.status === 400 && /project does not exist/i.test((await bogus.json().catch(() => ({})))?.message ?? ""), "a project that does not exist is refused", String(bogus.status))

const title = `UAT requisition assist ${Date.now()}`
const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await seedAuth(context, BASE, "proc.requester@nts.local", "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/procurement-v23/requisitions`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("#nav .nav-item", { timeout: LOAD })
  await page.waitForTimeout(4000)
  await page.locator('[data-action="create-requisition"]').first().click()
  await page.waitForSelector('#prForm select[name="project"]', { timeout: 60000 })
  check((await page.locator(`#prForm select[name="project"] option[value="${project.id}"]`).count()) === 1, "the form offers the project", project.name)
  await page.locator("#prForm [data-project-search]").fill("UAT project")
  check((await page.locator('#prForm select[name="project"]').inputValue()) === project.id, "typing in its search picks it")

  await page.locator('#prForm [name="title"]').fill(title)
  const category = await page.$$eval('#prForm select[name="category"] option', (os) => os.map((o) => o.value).find(Boolean))
  if (category) await page.locator('#prForm select[name="category"]').selectOption(category)
  await page.locator('#prLinesV23 [name="item"]').first().fill("Boardroom")
  const pick = page.locator(".pr23-suggest [data-pr-suggest]", { hasText: "Boardroom table" })
  const shown = await pick.first().waitFor({ timeout: 30000 }).then(() => true).catch(() => false)
  check(shown, "typing an item suggests it, with where it was bought")
  if (shown) {
    check(/\$2,750\.00/.test(await pick.first().innerText()) && /Msasa/.test(await pick.first().innerText()), "the suggestion shows its last price and vendor", (await pick.first().innerText()).replace(/\s+/g, " "))
    await pick.first().click()
    check((await page.locator('#prLinesV23 [name="price"]').first().inputValue()) === "2750.00", "choosing it fills in the estimate")
    check(/Last ordered at \$2,750\.00/.test(await page.locator("#prLinesV23 [data-pr-hint]").first().innerText()), "and says where the figure came from")
  }
  await page.locator('#prForm [name="motivation"]').fill("UAT requisition assist: project and line suggestions")
  await page.screenshot({ path: path.join(OUT, "requisition-assist.png"), fullPage: true })
  await page.locator('[data-action="save-pr"]').click()
  check(await page.waitForFunction(() => /saved as a draft/.test(document.body.innerText), null, { timeout: 90000 }).then(() => true).catch(() => false), "the draft is saved")

  const mine = await get("/procurement/requisitions/my")
  const draft = mine.find((r) => r.title === title)
  check(draft?.projectId === project.id && draft?.project?.name === project.name, "the saved draft carries the project", draft?.requisitionNumber)
  check(Number(draft?.items?.[0]?.unitPrice) === 2750, "and the estimate from the suggestion", String(draft?.items?.[0]?.unitPrice))

  await page.waitForTimeout(4000)
  const row = page.locator("#workspace table tbody tr", { hasText: draft?.requisitionNumber ?? "none" })
  if (await row.count()) {
    await row.first().click()
    check(await page.waitForFunction((n) => document.body.innerText.includes(n), project.name, { timeout: 30000 }).then(() => true).catch(() => false), "the requisition names its project")
  } else {
    check(false, "the requisition names its project", "row not found")
  }
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
