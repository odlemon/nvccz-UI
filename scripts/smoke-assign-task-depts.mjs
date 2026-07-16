/**
 * Smoke: login → open MPC worksheet → Assign task → department dropdown enabled.
 * Usage: node scripts/smoke-assign-task-depts.mjs
 */
import { chromium } from "playwright"

const BASE = process.env.APP_URL || "http://localhost:3000"
const EMAIL = process.env.SMOKE_EMAIL || "admin@nts.com"
const PASSWORD = process.env.SMOKE_PASSWORD || "admin123"
const MODEL_ID = "cmrmdx9v18186c297a946bb82"
const CYCLE_ID = process.env.CYCLE_ID || "cmrnsdgyr0002unhcxidcky9w" // Finance + Sales owners
const FINANCE_ID = process.env.DEPT_ID || "cmh3bbvoh0000uncw5qn5f71g"

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()
  const errors = []

  try {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 })
    await page.getByLabel(/email/i).fill(EMAIL).catch(async () => {
      await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL)
    })
    await page.locator('input[type="password"]').first().fill(PASSWORD)
    await page.getByRole("button", { name: /sign in|log in|login/i }).click()
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 })

    const worksheetUrl =
      `${BASE}/forecasting/models/${MODEL_ID}/worksheet` +
      `?cycleId=${CYCLE_ID}&departmentId=${FINANCE_ID}&departmentName=Finance`
    await page.goto(worksheetUrl, { waitUntil: "networkidle", timeout: 90000 })

    // Wait for collab / tasks UI
    const assignBtn = page.getByRole("button", { name: /^Assign( task)?$/i }).first()
    await assignBtn.waitFor({ state: "visible", timeout: 60000 })
    await assignBtn.click()

    const dialog = page.getByRole("dialog")
    await dialog.waitFor({ state: "visible", timeout: 15000 })

    const deptTrigger = dialog.locator("button").filter({ hasText: /Select department|Finance|No departments|No cycle/i }).first()
    // Prefer the Department field's select trigger (second label area)
    const deptLabel = dialog.getByText("Department", { exact: true })
    await deptLabel.waitFor({ state: "visible" })
    const selectNearDept = dialog.locator("label:has-text('Department')").locator("..").locator("button").first()
    const trigger = (await selectNearDept.count()) ? selectNearDept : deptTrigger

    const disabled = await trigger.isDisabled()
    const text = ((await trigger.innerText()) || "").trim()
    console.log("Department trigger text:", JSON.stringify(text))
    console.log("Department trigger disabled:", disabled)

    if (disabled) {
      errors.push(`Department dropdown is disabled (text=${text})`)
    }
    if (/No cycle departments|No departments available/i.test(text)) {
      errors.push(`Department dropdown still empty: ${text}`)
    }

    if (!disabled) {
      await trigger.click()
      const financeOption = page.getByRole("option", { name: /Finance/i }).first()
      await financeOption.waitFor({ state: "visible", timeout: 10000 })
      await financeOption.click()
      console.log("Selected Finance OK")

      const assigneeTrigger = dialog.locator("label:has-text('Assignee')").locator("..").locator("button").first()
      const assigneeDisabled = await assigneeTrigger.isDisabled()
      const assigneeText = ((await assigneeTrigger.innerText()) || "").trim()
      console.log("Assignee trigger text:", JSON.stringify(assigneeText))
      console.log("Assignee trigger disabled:", assigneeDisabled)
      if (assigneeDisabled && /Pick department first/i.test(assigneeText)) {
        errors.push("Assignee still blocked after picking department")
      }
    }

    await page.screenshot({
      path: "scripts/smoke-assign-task-depts.png",
      fullPage: false,
    })
    console.log("Screenshot: scripts/smoke-assign-task-depts.png")
  } catch (err) {
    errors.push(String(err?.message || err))
    try {
      await page.screenshot({ path: "scripts/smoke-assign-task-depts-error.png" })
    } catch {
      /* ignore */
    }
  } finally {
    await browser.close()
  }

  if (errors.length) {
    console.error("SMOKE FAILED:\n- " + errors.join("\n- "))
    process.exit(1)
  }
  console.log("SMOKE PASSED")
}

main()
