/**
 * Vendor master data (SRD §3: company name, contact, email, phone, address, payment terms), edited from the vendor's
 * profile on dev. Writes one UAT vendor, which dev_cleanup_procurement.mjs removes (email @vendors.example.test).
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-vendor-master.mjs
 *
 *   1. the Procurement Officer registers a vendor through the API; its profile shows phone, payment terms and address;
 *   2. Edit profile offers only what the vendor record keeps, and saving changes the record;
 *   3. the profile offers no control or card with nothing behind it (messaging, document requests, sample register);
 *   4. the Finance Manager, who approves vendors but does not maintain them, is refused Edit profile;
 *   5. the API refuses a blacklist or registration change through the plain update from a role that cannot approve.
 */
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const OUT = path.resolve(process.env.OUT || ".")
const RUN = Date.now().toString(36)
const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}
async function login(email) {
  const j = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123", portal: "staff" }) })).json()
  const token = j.token || j?.data?.token
  if (!token) throw new Error(`${email} could not sign in`)
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}
const api = async (method, p, auth, body) => {
  const r = await fetch(API + p, { method, headers: auth, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, json: await r.json().catch(() => ({})) }
}

const officer = await login("proc.officer@nts.local")
const NAME = `UAT vendor master ${RUN}`
const created = await api("POST", "/accounting/vendors", officer, {
  name: NAME,
  contactPerson: "Rudo Mhlanga",
  email: `uat-master-${RUN}@vendors.example.test`,
  phone: "+263 242 700 100",
  address: "12 Kwame Nkrumah Avenue, Harare",
  paymentTerms: "30 days from invoice",
})
const vendor = created.json?.data
check(created.status === 201 || created.status === 200, "the Procurement Officer registers a UAT vendor", `${created.status} ${vendor?.id ?? created.json?.message ?? ""}`)
if (!vendor?.id) {
  console.log(`=== RESULT === 0/${results.length} checks passed`)
  process.exit(1)
}

const browser = await chromium.launch()
const openProfile = async (email) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await seedAuth(context, BASE, email, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}/procurement/vendors`, { waitUntil: "domcontentloaded", timeout: LOAD })
  const row = page.locator("#workspace table tbody tr", { hasText: NAME }).first()
  await row.waitFor({ timeout: LOAD })
  await row.locator("td").first().click()
  await page.waitForFunction((n) => /Vendor profile/.test(document.querySelector("#workspace")?.innerText || "") && (document.querySelector("#workspace")?.innerText || "").includes(n), NAME, { timeout: 60000 })
  return { context, page, errors }
}
const fieldValue = (page, label) =>
  page.evaluate((l) => [...document.querySelectorAll("#workspace .field")].find((f) => f.querySelector("label")?.innerText.trim() === l)?.querySelector("input,textarea")?.value ?? null, label)

try {
  // ------------------------------------------------------------------ 1-3. the officer
  console.log("\n== the Procurement Officer")
  const { context, page, errors } = await openProfile("proc.officer@nts.local")
  check((await fieldValue(page, "Phone")) === "+263 242 700 100", "the profile shows the phone")
  check((await fieldValue(page, "Payment terms")) === "30 days from invoice", "and the payment terms")
  check((await fieldValue(page, "Address")) === "12 Kwame Nkrumah Avenue, Harare", "and the address")

  const ws = await page.locator("#workspace").innerText()
  check(!/Vendor communications and received documents|Compliance document register|Automated compliance reminders/.test(ws), "no messaging card, sample document register or reminder automation")
  const gone = ["request-vendor-docs-v6", "message-vendor-v6", "vendor-portal-v6", "send-vendor-reminder-v6"]
  const offered = await page.$$eval("#workspace [data-action]", (els) => els.map((e) => e.dataset.action))
  check(gone.every((a) => !offered.includes(a)), "no Request documents, Send message, Open vendor portal or Send compliance reminder", gone.filter((a) => offered.includes(a)).join(", "))

  await page.locator('#workspace [data-action="edit-vendor-v6"]').first().click()
  await page.waitForSelector("#vendorEditFormV23", { timeout: 30000 })
  const names = await page.$$eval("#vendorEditFormV23 [name]", (els) => els.map((e) => e.getAttribute("name")))
  const expected = ["vendorId", "name", "contact", "email", "phone", "paymentTerms", "address", "taxExpiry"]
  check(expected.every((n) => names.includes(n)) && names.length === expected.length, "Edit profile offers only what the vendor record keeps", names.join(", "))
  check((await page.locator('#modalLayer.open [data-action="save-vendor-profile-v23"]').count()) === 1 && !/Nothing here can be saved/.test(await page.locator("#modalLayer").innerText()), "and can be saved")

  await page.locator('#vendorEditFormV23 [name="phone"]').fill("+263 242 700 222")
  await page.locator('#vendorEditFormV23 [name="paymentTerms"]').fill("45 days from invoice")
  await page.locator('#vendorEditFormV23 [name="address"]').fill("7 Samora Machel Avenue, Harare")
  await page.locator('#modalLayer [data-action="save-vendor-profile-v23"]').click()
  const toast = await page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast]")].map((t) => t.innerText).find((t) => /updated|could not|refused|permission/i.test(t)) || null, null, { timeout: 60000 }).then((h) => h.jsonValue()).catch(() => null)
  check(/updated/i.test(toast || ""), "saving says the vendor was updated", toast || "no toast")

  let after
  for (let i = 0; i < 6; i++) {
    after = (await api("GET", `/accounting/vendors/${vendor.id}`, officer)).json?.data
    if (after?.phone === "+263 242 700 222") break
    await new Promise((r) => setTimeout(r, 3000))
  }
  check(after?.phone === "+263 242 700 222" && after?.paymentTerms === "45 days from invoice" && after?.address === "7 Samora Machel Avenue, Harare", "the vendor record holds the new phone, payment terms and address", `${after?.phone} · ${after?.paymentTerms} · ${after?.address}`)
  check(after?.name === NAME && after?.contactPerson === "Rudo Mhlanga", "and keeps what was not changed", `${after?.name} · ${after?.contactPerson}`)
  const shown = await page.waitForFunction(() => [...document.querySelectorAll("#workspace .field")].some((f) => f.querySelector("label")?.innerText.trim() === "Payment terms" && f.querySelector("input")?.value === "45 days from invoice"), null, { timeout: 90000 }).then(() => true).catch(() => false)
  check(shown, "the profile shows the new payment terms after the reload")
  await page.screenshot({ path: path.join(OUT, "vendor-master.png"), fullPage: false }).catch(() => {})
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
  await context.close()

  // ------------------------------------------------------------------ 4. a role that approves vendors but does not maintain them
  console.log("\n== the Finance Manager")
  const fm = await openProfile("payroll.finmgr@nts.local")
  const editButtons = fm.page.locator('#workspace [data-action="edit-vendor-v6"]')
  if (await editButtons.count()) {
    await editButtons.first().click()
    const refused = await fm.page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast]")].some((t) => /does not have permission for changing vendor details/i.test(t.innerText)), null, { timeout: 30000 }).then(() => true).catch(() => false)
    check(refused && !(await fm.page.locator("#vendorEditFormV23").count()), "Edit profile is refused before the form opens")
  } else check(true, "Edit profile is not offered")
  await fm.context.close()

  // ------------------------------------------------------------------ 5. the API
  console.log("\n== the API")
  const blacklist = await api("PUT", `/accounting/vendors/${vendor.id}`, officer, { isBlacklisted: true, blacklistReason: "UAT" })
  check(blacklist.status === 403, "the plain update refuses a blacklist from a role that cannot approve vendors", `${blacklist.status} ${blacklist.json?.message ?? ""}`)
  const status = await api("PUT", `/accounting/vendors/${vendor.id}`, officer, { registrationStatus: "ACTIVE" })
  check(status.status === 403, "and a registration status change", `${status.status} ${status.json?.message ?? ""}`)
  const buyer = await login("proc.buyer@nts.local")
  const buyerEdit = await api("PUT", `/accounting/vendors/${vendor.id}`, buyer, { phone: "000" })
  check(buyerEdit.status === 403, "a role without vendor maintenance cannot update a vendor", `${buyerEdit.status} ${buyerEdit.json?.message ?? ""}`)
  const still = (await api("GET", `/accounting/vendors/${vendor.id}`, officer)).json?.data
  check(still?.isBlacklisted === false && still?.phone === "+263 242 700 222", "the vendor is unchanged by the refused updates", `${still?.isBlacklisted} · ${still?.phone}`)
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
