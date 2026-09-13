/**
 * Two ways onto the vendor register (dev): staff add a vendor, or the vendor registers itself on the vendor portal, which
 * runs on its own domain and needs no invitation. This checks the second way end to end. Writes two UAT vendors
 * (@vendors.example.test), which dev_cleanup_procurement.mjs removes.
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com \
 *   VENDOR_BASE=https://dev.vendor.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-vendor-self-registration.mjs
 *
 *   1. a vendor registers on the vendor portal's form (company, then bank details) and is asked for its documents;
 *   2. it waits in PENDING_REVIEW, is not offered for RFQ invitations, and staff see it in the Vendor Registry's
 *      "Self-registrations awaiting review", whose "Vendor portal" button opens the registration page in a new tab;
 *   3. the Procurement Officer sees it but cannot decide; the API refuses the officer's approval;
 *   4. the Procurement Manager approves it: the vendor is active;
 *   5. a second vendor, registered through the portal's API, is declined with a reason (without one, refused);
 *   6. the old /procurement-v23 address still opens the Vendor Registry at /procurement.
 */
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const VENDOR_BASE = process.env.VENDOR_BASE || "https://dev.vendor.matanho.com"
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
  const r = await fetch(API + p, { method, headers: auth || { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, json: await r.json().catch(() => ({})) }
}
const vendorByName = async (auth, name) => {
  const all = (await api("GET", "/accounting/vendors?isActive=all", auth)).json?.data ?? []
  const pending = (await api("GET", "/accounting/vendors/pending-review", auth)).json?.data ?? []
  return [...pending, ...all].find((v) => v.name === name)
}

const mgr = await login("proc.mgr@nts.local")
const officer = await login("proc.officer@nts.local")
const requester = await login("proc.requester@nts.local")
const FIRST = `UAT self-registered ${RUN}`
const SECOND = `UAT self-registered declined ${RUN}`

const browser = await chromium.launch()
try {
  // ------------------------------------------------------------------ 1. the vendor registers on the portal
  console.log("\n== the vendor registers on the vendor portal")
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e.message || e)))
    await page.goto(`${VENDOR_BASE}/vendor-portal/register`, { waitUntil: "domcontentloaded", timeout: LOAD })
    await page.waitForSelector("#companyName", { timeout: LOAD })
    check(true, "the registration page opens on the vendor portal without an invitation", `${VENDOR_BASE}/vendor-portal/register`)
    await page.fill("#companyName", FIRST)
    await page.fill("#name", FIRST)
    await page.fill("#email", `uat-selfreg-${RUN}@vendors.example.test`)
    await page.fill("#contactPerson", "Tatenda Moyo")
    await page.fill("#phoneNumber", "+263772440088")
    await page.fill("#industry", "Office supplies")
    await page.getByRole("button", { name: /^Next$/ }).click()
    await page.waitForSelector("#bankName-0", { timeout: 30000 })
    await page.fill("#bankName-0", "CBZ")
    await page.fill("#accountName-0", FIRST)
    await page.fill("#accountNumber-0", `4410${Date.now().toString().slice(-8)}`)
    await page.fill("#branchCode-0", "4101")
    await page.selectOption("#currencyCode-0", "USD")
    // The backend refuses a bank account without a SWIFT/BIC code, so the form must say so before sending anything.
    await page.getByRole("button", { name: /Submit Registration/ }).click()
    const refused = await page.waitForFunction(() => /SWIFT\/BIC code is required|Please complete bank details/i.test(document.body.innerText), null, { timeout: 15000 }).then(() => true).catch(() => false)
    check(refused && !/Upload KYC Documents/.test(await page.evaluate(() => document.body.innerText)), "without a SWIFT/BIC code the form refuses to submit and says why")
    await page.fill("#swiftCode-0", "CBZKZWHA")
    await page.screenshot({ path: path.join(OUT, "vendor-self-registration-form.png"), fullPage: false }).catch(() => {})
    await page.getByRole("button", { name: /Submit Registration/ }).click()
    const kyc = await page.waitForFunction(() => /Upload KYC Documents/.test(document.body.innerText), null, { timeout: 90000 }).then(() => true).catch(() => false)
    check(kyc, "the registration is accepted and the vendor is asked for its documents")
    await page.screenshot({ path: path.join(OUT, "vendor-self-registration-kyc.png"), fullPage: false }).catch(() => {})
    check(errors.length === 0, "no page errors on the vendor portal", errors.slice(0, 2).join(" | "))
    await context.close()
  }

  // ------------------------------------------------------------------ 2. it waits for review
  console.log("\n== it waits for staff review")
  let first
  for (let i = 0; i < 6 && !first; i++) {
    first = ((await api("GET", "/accounting/vendors/pending-review", mgr)).json?.data ?? []).find((v) => v.name === FIRST)
    if (!first) await new Promise((r) => setTimeout(r, 3000))
  }
  check(first?.registrationStatus === "PENDING_REVIEW" && first?.selfRegistered === true, "it waits in PENDING_REVIEW, marked self-registered", `${first?.registrationStatus} · ${first?.selfRegistered}`)
  check(first && !("selfRegistrationToken" in first) && Number(first?._count?.banks) >= 1, "the review queue counts its bank account and does not expose its portal token", `banks ${first?._count?.banks}`)
  const eligible = (await api("GET", "/accounting/vendors/for-rfq", mgr)).json?.data ?? []
  check(first && !eligible.some((v) => v.id === first.id), "it is not offered for RFQ invitations")
  check((await api("GET", "/accounting/vendors/pending-review", requester)).status === 403, "a requester cannot list the review queue")

  // ------------------------------------------------------------------ 3. the officer sees it but cannot decide
  console.log("\n== the Procurement Officer")
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await seedAuth(context, BASE, "proc.officer@nts.local", "staff")
    const page = await context.newPage()
    await page.goto(`${BASE}/procurement/vendors`, { waitUntil: "domcontentloaded", timeout: LOAD })
    const card = await page.waitForFunction((n) => /Self-registrations awaiting review/.test(document.body.innerText) && document.body.innerText.includes(n), FIRST, { timeout: LOAD }).then(() => true).catch(() => false)
    check(card, "the Vendor Registry lists it under Self-registrations awaiting review")
    // Each registration is a prompt card with its decisions in view (not a table row, whose actions fold into a ⋯ menu).
    const regCard = page.locator("#workspace article[data-vendor-registration]", { hasText: FIRST }).first()
    const cardShown = await regCard.waitFor({ timeout: 30000 }).then(() => true).catch(() => false)
    check(cardShown && (await regCard.locator('[data-action="open-vendor-v6"]').count()) === 1, "its card offers Open profile")
    check(cardShown && (await regCard.locator('[data-action="approve-vendor-registration-v23"], [data-action="decline-vendor-registration-v23"]').count()) === 0, "without approval rights it offers no Approve or Decline")
    const portalButton = page.locator('#workspace [data-action="vendor-portal-v6"], #workspace [data-action="vendor-portal"]').first()
    if (await portalButton.count()) {
      const [tab] = await Promise.all([context.waitForEvent("page", { timeout: 30000 }).catch(() => null), portalButton.click()])
      const url = tab ? tab.url() : ""
      check(Boolean(tab) && url.startsWith(`${VENDOR_BASE}/vendor-portal/register`), "Vendor portal opens the registration page in a new tab", url || "no new tab")
      await tab?.close().catch(() => {})
    } else check(false, "Vendor portal opens the registration page in a new tab", "no Vendor portal button")
    await context.close()
  }
  const officerApprove = await api("PUT", `/accounting/vendors/${first?.id}/approve-registration`, officer, {})
  check(officerApprove.status === 403, "the API refuses the officer's approval", String(officerApprove.status))

  // ------------------------------------------------------------------ 4. the manager approves it
  console.log("\n== the Procurement Manager approves")
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await seedAuth(context, BASE, "proc.mgr@nts.local", "staff")
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e.message || e)))
    await page.goto(`${BASE}/procurement/vendors`, { waitUntil: "domcontentloaded", timeout: LOAD })
    const approve = page.locator(`[data-action="approve-vendor-registration-v23"][data-id="${first?.id}"]`).first()
    await approve.waitFor({ timeout: LOAD })
    await approve.click()
    const said = await page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast]")].map((t) => t.innerText).find((t) => /approved|could not|permission/i.test(t)) || null, null, { timeout: 60000 }).then((h) => h.jsonValue()).catch(() => null)
    check(/approved/i.test(said || ""), "Approve says the vendor is approved", said || "no toast")
    let after
    for (let i = 0; i < 6; i++) {
      after = await vendorByName(mgr, FIRST)
      if (after?.registrationStatus === "ACTIVE") break
      await new Promise((r) => setTimeout(r, 3000))
    }
    check(after?.registrationStatus === "ACTIVE" && after?.isActive === true, "the vendor is active", `${after?.registrationStatus} · active ${after?.isActive}`)
    check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "))
    await page.screenshot({ path: path.join(OUT, "vendor-self-registration-approved.png"), fullPage: false }).catch(() => {})
    await context.close()
  }

  // ------------------------------------------------------------------ 5. a second vendor is declined with a reason
  console.log("\n== a second self-registration is declined")
  const reg = await api("POST", "/public/vendor-registration", null, {
    companyName: SECOND, name: SECOND, email: `uat-selfreg-declined-${RUN}@vendors.example.test`, contactPerson: "Nyasha Dube", phoneNumber: "+263772440099", industry: "Catering",
    banks: [{ bankName: "Stanbic", accountName: SECOND, accountNumber: `9120${Date.now().toString().slice(-8)}`, branchCode: "3101", currencyCode: "USD", swiftCode: "SBICZWHX" }],
  })
  check(reg.status === 201 || reg.status === 200, "the portal's registration API accepts it", `${reg.status} ${reg.json?.message ?? ""}`)
  const second = await vendorByName(mgr, SECOND)
  const noReason = await api("PUT", `/accounting/vendors/${second?.id}/decline-registration`, mgr, {})
  check(noReason.status === 400, "declining without a reason is refused", `${noReason.status} ${noReason.json?.message ?? ""}`)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await seedAuth(context, BASE, "proc.mgr@nts.local", "staff")
    const page = await context.newPage()
    // 6. the old address still opens the page, at its new one
    await page.goto(`${BASE}/procurement-v23/vendors`, { waitUntil: "domcontentloaded", timeout: LOAD })
    check(new URL(page.url()).pathname === "/procurement/vendors", "the old /procurement-v23 address opens the Vendor Registry at /procurement", new URL(page.url()).pathname)
    const decline = page.locator(`[data-action="decline-vendor-registration-v23"][data-id="${second?.id}"]`).first()
    await decline.waitFor({ timeout: LOAD })
    await decline.click()
    await page.waitForSelector("#declineVendorRegistrationFormV23", { timeout: 30000 })
    await page.fill('#declineVendorRegistrationFormV23 [name="reason"]', "UAT: the bank confirmation letter does not match the account name")
    await page.locator('[data-action="confirm-decline-vendor-registration-v23"]').first().click()
    const said = await page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast]")].map((t) => t.innerText).find((t) => /declined|could not|permission/i.test(t)) || null, null, { timeout: 60000 }).then((h) => h.jsonValue()).catch(() => null)
    check(/declined/i.test(said || ""), "Decline says the registration is declined", said || "no toast")
    await context.close()
  }
  let declined
  for (let i = 0; i < 6; i++) {
    declined = await vendorByName(mgr, SECOND)
    if (declined?.registrationStatus === "DECLINED") break
    await new Promise((r) => setTimeout(r, 3000))
  }
  check(declined?.registrationStatus === "DECLINED" && declined?.isActive === false, "the declined vendor is inactive", `${declined?.registrationStatus} · active ${declined?.isActive}`)
  const stillPending = ((await api("GET", "/accounting/vendors/pending-review", mgr)).json?.data ?? []).filter((v) => v.name === FIRST || v.name === SECOND)
  check(stillPending.length === 0, "neither is left in the review queue")
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  await browser.close()
}
const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
process.exit(passed === results.length ? 0 : 1)
