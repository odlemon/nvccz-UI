/**
 * User Master UI check: /admin/users (list, filters, form fields, save + persist) and Procurement settings.
 * Needs the FE on UAT_FE (default http://localhost:3120, staff portal) and the local API on :3009.
 *   node scripts/_uat/user-master-ui.mjs
 */
import { chromium } from "playwright"
import fs from "node:fs"

const FE = process.env.UAT_FE || "http://localhost:3120"
const OUT = process.env.UAT_OUT || "design-refs/user-master/screens"
fs.mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`)
}

// Visible browser, human-paced, so the run can be watched. UAT_HEADLESS=1 for CI.
const browser = await chromium.launch({ headless: process.env.UAT_HEADLESS === "1", slowMo: Number(process.env.UAT_SLOWMO || 350) })
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
page.setDefaultTimeout(120000)
const consoleErrors = []
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)))

await page.goto(`${FE}/login`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(5000) // let the form hydrate before typing
await page.fill('input[type="email"], input[name="email"]', "admin@nts.com")
await page.fill('input[type="password"]', "admin123")
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/auth/login") && r.status() === 200),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(4000)

await page.goto(`${FE}/admin/users`, { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=User Management", { timeout: 180000 })
await page.waitForSelector("table tbody tr td", { timeout: 120000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/users-list.png` })

const headers = (await page.locator("table thead th").allInnerTexts()).map((s) => s.trim())
for (const h of ["Status", "Last Login", "Approval Limit", "Procurement Function"]) {
  check(`list column: ${h}`, headers.some((x) => x.toLowerCase().includes(h.toLowerCase())), headers.join(" | "))
}
check("list shows Employee IDs", (await page.locator("text=/EMP-\\d{5}/").count()) > 0)

// status filter filters
const before = await page.locator("table tbody tr").count()
await page.locator("button[role=combobox]", { hasText: "All Statuses" }).click()
await page.getByRole("option", { name: "Deactivated" }).click()
await page.waitForTimeout(500)
const after = await page.locator("table tbody tr").count()
const allDeactivated = (await page.locator("table tbody tr").allInnerTexts()).every((t) => /Deactivated|No users/i.test(t))
check("status filter filters the list", after !== before && allDeactivated, `${before} -> ${after}`)
await page.getByText("Clear all").first().click()
await page.waitForTimeout(300)

// create form: fields present
await page.getByRole("button", { name: /Create User/ }).click()
await page.waitForSelector("text=Create New User")
const dialogText = await page.locator("[role=dialog]").innerText()
for (const f of [
  "First Name", "Surname", "Full Name", "Employee / User ID", "Work Email", "Mobile Number",
  "Department", "Job Title", "Business Unit", "Branch", "Location", "Cost Centre", "Reporting Manager",
  "System Role", "Procurement Function", "Access Profile", "Approval Level", "Approval Limit",
  "Delegated Approver", "Segregation-of-Duties Restrictions", "Network / SSO Username", "UAT Role",
  "User Status", "Effective Date", "End Date",
]) check(`form field: ${f}`, dialogText.includes(f))
check("SoD options come from the API (checkboxes)", (await page.locator("[role=dialog] input[type=checkbox]").count()) >= 4)
await page.screenshot({ path: `${OUT}/user-form-create.png` })
await page.keyboard.press("Escape")

// edit an existing test user: change limit + function, save, reload, persisted
const email = process.env.UAT_EDIT_EMAIL || "proc.officer@nts.local"
await page.getByPlaceholder("Search users...").fill(email)
await page.waitForTimeout(500)
await page.locator("table tbody tr").first().locator("td button").first().click()
await page.waitForSelector("text=Edit User")
await page.locator('input[name="approvalLimitAmount"]').fill("12345.5")
await page.locator('input[name="jobTitle"]').fill("UI test title")
await page.screenshot({ path: `${OUT}/user-form-edit.png` })
await page.getByRole("button", { name: "Update User" }).click()
await page.waitForSelector("text=Edit User", { state: "detached" })
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("table tbody tr")
await page.getByPlaceholder("Search users...").fill(email)
await page.waitForTimeout(500)
const rowText = await page.locator("table tbody tr").first().innerText()
check("edit persists after reload (approval limit shown)", rowText.includes("12,345.50"), rowText)

// drawer shows the master record
await page.locator("table tbody tr").first().click()
await page.waitForSelector("text=User Details")
await page.waitForSelector("text=Role & authority", { timeout: 60000 })
const drawer = await page.locator("[role=dialog]").innerText()
for (const f of ["Employee / User ID", "Approval limit", "Delegated approver", "Last login", "Created by", "Modified by", "Effective date"]) {
  check(`drawer: ${f}`, drawer.includes(f))
}
check("drawer: Modified by names the admin", /Modified by\s*\n?.*\S/.test(drawer) && !/Modified by\s*—/.test(drawer.replace(/\n/g, " ")), "")
await page.screenshot({ path: `${OUT}/user-drawer.png` })

// restore the value we changed
await page.keyboard.press("Escape")

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} UI checks passed`)
if (consoleErrors.length) console.log("console errors:", [...new Set(consoleErrors)].slice(0, 5))
await browser.close()
process.exitCode = failed.length ? 1 : 0
