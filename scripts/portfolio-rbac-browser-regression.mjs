import { chromium } from "playwright"
import XLSX from "xlsx"
import fs from "fs"
import path from "path"

const BASE = process.env.PORTFOLIO_RBAC_UI || "http://127.0.0.1:3001"
const API = process.env.PORTFOLIO_RBAC_API || "http://127.0.0.1:3019/api"
const EMAIL = process.env.PORTFOLIO_RBAC_ADMIN_EMAIL || "perf.sysadmin@nts.local"
const PASSWORD = process.env.PORTFOLIO_RBAC_ADMIN_PASSWORD || "admin123"
const roleName = `__RBAC_BROWSER__${Date.now()}`
const checks = []
let token = ""
let roleId = ""

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

async function api(method, route, body) {
  const response = await fetch(`${API}${route}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { status: response.status, body: await response.json().catch(() => ({})) }
}

async function roleState() {
  const response = await api("GET", "/roles/rbac/portfolio/roles")
  assert(response.status === 200, `role refresh returned ${response.status}`)
  return response.body.data.find((role) => role.id === roleId)
}

const login = await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD })
assert(login.status === 200 && login.body.token, `admin login returned ${login.status}`)
token = login.body.token

const catalogue = await api("GET", "/roles/rbac/portfolio/catalog")
assert(catalogue.status === 200, `catalogue returned ${catalogue.status}`)
const initialRolesResponse = await api("GET", "/roles/rbac/portfolio/roles")
assert(initialRolesResponse.status === 200 && Array.isArray(initialRolesResponse.body.data), `initial role directory returned ${initialRolesResponse.status}`)
const backendRoleNames = initialRolesResponse.body.data.map((role) => role.name)

const browser = await chromium.launch({ headless: process.env.HEADED !== "1" })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(30000)
const outDir = path.resolve("test-artifacts", "portfolio-rbac")
fs.mkdirSync(outDir, { recursive: true })
const consoleErrors = []
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()) })
page.on("pageerror", (error) => consoleErrors.push(String(error)))

try {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  await page.locator('button[type="submit"]').waitFor()
  await page.waitForTimeout(1500)
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.waitForFunction(() => document.querySelector('input[type="email"]')?.value.length > 0 && document.querySelector('input[type="password"]')?.value.length > 0)
  const browserLoginResponse = page.waitForResponse((response) => response.url().includes('/auth/login') && response.request().method() === 'POST')
  await page.locator('button[type="submit"]').click()
  assert((await browserLoginResponse).status() === 200, "browser login request failed")
  await page.waitForURL(/\/home(?:$|[/?#])/)
  await page.evaluate(({ sessionToken, sessionUser }) => {
    document.cookie = `token=${sessionToken}; path=/; max-age=3600; samesite=lax`
    document.cookie = `user=${encodeURIComponent(JSON.stringify(sessionUser))}; path=/; max-age=3600; samesite=lax`
  }, { sessionToken: token, sessionUser: login.body.user || {} })
  await page.waitForFunction(() => document.cookie.includes('token=') && document.cookie.includes('user='))
  checks.push("browser-login")
  await page.goto(`${BASE}/portfolio/settings`, { waitUntil: "domcontentloaded" })
  if (backendRoleNames.length) await page.locator('[data-action="select-rbac-role"]').nth(backendRoleNames.length - 1).waitFor()
  assert(await page.locator('[data-action="select-rbac-role"]').count() === backendRoleNames.length, "Portfolio role directory did not match the backend response")
  for (const name of backendRoleNames) {
    assert(await page.getByText(name, { exact: true }).first().isVisible(), `backend role ${name} was not rendered`)
  }
  await page.getByRole("button", { name: "New role" }).click()
  await page.locator('#v11CreateRoleForm input[name="name"]').fill(roleName)
  await page.locator('#v11CreateRoleForm textarea[name="description"]').fill("Temporary browser regression role")
  await page.getByRole("button", { name: "Continue to permissions" }).click()
  await page.getByRole("heading", { name: "Set permissions" }).waitFor()
  await page.locator('.modal-rail-step[data-action="wizard-step"][data-step="0"]').click()
  await page.locator('#v11CreateRoleForm input[name="name"]').waitFor()
  await page.locator('.modal-rail-step[data-action="wizard-step"][data-step="1"]').click()
  await page.getByRole("heading", { name: "Set permissions" }).waitFor()
  await page.screenshot({ path: path.join(outDir, "create-role-permissions.png") })
  checks.push("role-wizard-permissions-step")
  const dashboardPermission = page.locator('[data-rbac-create-permission="portfolio.dashboard.view"]')
  await dashboardPermission.check()
  await page.getByRole("button", { name: "Review role" }).click()
  await page.getByRole("heading", { name: "Confirm role" }).waitFor()
  await page.locator('.modal-rail-step[data-action="wizard-step"][data-step="1"]').click()
  await page.getByRole("heading", { name: "Set permissions" }).waitFor()
  await page.locator('.modal-rail-step[data-action="wizard-step"][data-step="2"]').click()
  await page.getByRole("heading", { name: "Confirm role" }).waitFor()
  await page.screenshot({ path: path.join(outDir, "create-role-confirm.png") })
  await page.getByText("dashboard.view", { exact: true }).waitFor()
  checks.push("role-wizard-confirm-step")
  const createResponse = page.waitForResponse((response) => response.url().includes("/roles/rbac/portfolio/roles") && response.request().method() === "POST")
  await page.getByRole("button", { name: "Create role" }).click()
  const created = await createResponse
  assert(created.status() === 201, `role creation returned ${created.status()}`)
  const createdBody = await created.json()
  assert(createdBody.data?.id && createdBody.data?.draftVersion, "created role did not return the saved draft policy")
  roleId = createdBody.data.id
  checks.push("role-wizard-backend-create")
  const roleCard = page.locator(`[data-action="select-rbac-role"][data-role="${roleId}"]`)
  await roleCard.waitFor()
  consoleErrors.length = 0
  assert(!(await page.getByText("Access unavailable", { exact: true }).isVisible().catch(() => false)), "settings reported unavailable access")
  checks.push("authenticated-settings-load")
  await page.getByRole("button", { name: "New role" }).waitFor()
  await page.getByText(roleName, { exact: true }).last().waitFor()
  await page.getByText("Editing enabled", { exact: true }).waitFor()
  await page.getByText("Changes pending", { exact: true }).first().waitFor()
  const persistedRole = await roleState()
  assert(persistedRole?.draftVersion?.permissions?.["portfolio.dashboard.view"] === true, "selected permission was not saved in the backend draft")
  assert(persistedRole?.draftVersion?.permissions?.["portfolio.deals.view"] === false, "unchecked permission did not persist as an explicit denial")
  checks.push("backend-role-directory-and-draft-persistence")

  const staffDirectory = await api("GET", "/users")
  assert(staffDirectory.status === 200 && Array.isArray(staffDirectory.body.data) && staffDirectory.body.data.length, "staff directory did not return searchable users")
  await page.getByRole("button", { name: "Assign existing user" }).click()
  await page.locator("#v11AssignmentPeopleSearch").waitFor()
  const searchTerm = String(staffDirectory.body.data[0].email || staffDirectory.body.data[0].firstName || "").slice(0, 5)
  assert(searchTerm.length >= 2, "staff directory did not include searchable identity fields")
  await page.locator("#v11AssignmentPeopleSearch").fill(searchTerm)
  const firstPersonResult = page.locator("[data-action=select-assignment-person]").first()
  await firstPersonResult.waitFor()
  const selectedPersonEmail = (await firstPersonResult.innerText()).match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]
  assert(selectedPersonEmail, "search results did not show an email address")
  await firstPersonResult.click()
  await page.locator('.modal-rail-step').nth(1).click()
  await page.locator(".v11-assignment-role-option").first().waitFor()
  await page.locator(".v11-assignment-role-option").first().click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByText("CONFIRM PORTFOLIO ACCESS", { exact: true }).waitFor()
  assert(await page.getByText(selectedPersonEmail, { exact: true }).isVisible(), "assignment confirmation did not show the selected user")
  await page.screenshot({ path: path.join(outDir, "assignment-wizard-confirm.png") })
  await page.locator('.modal-head [data-action="close-modal"]').click()
  checks.push("assignment-wizard-search-role-selection-confirmation")

  const settingsPermissionRow = page.locator('tr[data-rbac-resource="settings"]')
  await settingsPermissionRow.locator("td").first().click()
  await page.getByText("Live Portfolio RBAC record and audit history", { exact: true }).waitFor()
  await page.getByText("Portfolio RBAC API · portfolio_access_roles", { exact: true }).waitFor()
  const detailHeaders = await page.locator('.drawer.drawer-record .drawer-body .table-wrap thead th').allTextContents()
  assert(detailHeaders.join("|") === "Action|Active|Draft|Legacy", "record inspector did not render the active, draft and legacy permission columns")
  assert(!(await page.getByText("Frontend demonstration data", { exact: true }).isVisible().catch(() => false)), "record inspector still shows demonstration data")
  await page.screenshot({ path: path.join(outDir, "rbac-record-detail.png") })
  await page.locator('[data-action="close-drawer"]').last().click()
  checks.push("live-rbac-record-inspector")

  const exportPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export configuration" }).click()
  const exportDownload = await exportPromise
  const exportPath = path.join(outDir, "configuration-export-test.xlsx")
  await exportDownload.saveAs(exportPath)
  const exported = XLSX.readFile(exportPath)
  const exportedRoles = XLSX.utils.sheet_to_json(exported.Sheets.Roles)
  const exportedPermissions = XLSX.utils.sheet_to_json(exported.Sheets.Permissions)
  const exportedText = JSON.stringify({ roles: exportedRoles, permissions: exportedPermissions })
  fs.unlinkSync(exportPath)
  assert(exported.SheetNames.join(",") === "Overview,Roles,Permissions,Catalogue", "configuration workbook is missing its expected sheets")
  assert(exportedRoles.some((role) => role.role_id === roleId), "configuration export omitted the newly created role")
  assert(exportedPermissions.some((permission) => permission.role_name === roleName && permission.permission === "portfolio.dashboard.view" && permission.granted === true), "configuration workbook omitted the saved permission")
  assert(!exportedText.includes("@"), "configuration export unexpectedly contains user contact details")
  checks.push("configuration-export-download")

  await page.screenshot({ path: path.join(outDir, "settings-regression.png"), fullPage: true })
  const materialErrors = consoleErrors.filter((error) => !/favicon|_rsc|socket\.io|Failed to load resource.*401/i.test(error))
  assert(materialErrors.length === 0, `browser console errors: ${materialErrors.join(" | ").slice(0, 800)}`)
  checks.push("clean-browser-console")
  console.log(JSON.stringify({ ok: true, checks, screenshot: path.join(outDir, "settings-regression.png") }))
} catch (error) {
  await page.screenshot({ path: path.join(outDir, "settings-regression-failure.png"), fullPage: true }).catch(() => undefined)
  console.error(JSON.stringify({ url: page.url(), text: (await page.locator("body").innerText().catch(() => "")).slice(0, 2000), consoleErrors }, null, 2))
  throw error
} finally {
  await browser.close().catch(() => undefined)
  if (roleId) await api("DELETE", `/roles/rbac/portfolio/roles/${roleId}`).catch(() => undefined)
}
