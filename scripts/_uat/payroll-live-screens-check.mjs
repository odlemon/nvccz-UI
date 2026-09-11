/**
 * FINDING-017 in a real browser — Roles & Access, Document Vault, Pay Calendar.
 *
 * What each persona should see is derived from that persona's own GET /payroll/me/access,
 * never hardcoded. A fixture marker only counts when it is absent from the live API
 * response for the same screen, so a real record that happens to share a demo name cannot
 * fail the check, and a demo record cannot pass it.
 *
 * The administrator then drives the two write paths end to end through the UI: upload a
 * synthetic document and download it back (bytes compared), and add then edit a synthetic
 * pay period. Cleanup lives in nvccz/scripts/_uat/clean-payroll-live-screen-probes.mjs.
 *
 * Run:  node scripts/_uat/payroll-live-screens-check.mjs [--shots=<dir>]
 * Exit: 0 = every check passed, 1 = at least one failed
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { API, MODULES, PASSWORD, seedAuth } from "./_routes.mjs"

const mod = MODULES.find((m) => m.id === "payroll")
const shotsArg = process.argv.find((a) => a.startsWith("--shots="))
const SHOTS = shotsArg ? shotsArg.slice("--shots=".length) : null
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true })

const PERSONAS = ["perf.sysadmin@nts.local", "perf.exec@nts.local", "perf.hr@nts.local", "perf.deptmgr@nts.local"]
const DENIED = "You do not have access to this page"

let pass = 0
let fail = 0
const check = (ok, label, detail = "") => {
  if (ok) pass += 1
  else fail += 1
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`)
}

async function apiLogin(email) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, portal: "staff" }),
  })
  const j = await r.json().catch(() => ({}))
  return j.token || j?.data?.token || null
}

async function apiGet(token, url) {
  const r = await fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } })
  return r.ok ? r.json() : null
}

const monthOf = (d) =>
  new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })

/** Demo strings from the vendored runtime, minus anything the live API also contains. */
async function fixtureMarkers(adminToken) {
  const [roster, docs, groups] = await Promise.all([
    apiGet(adminToken, "/payroll/access/roster"),
    apiGet(adminToken, "/payroll/documents"),
    apiGet(adminToken, "/payroll/pay-groups"),
  ])
  const blob = (x) => JSON.stringify(x ?? {})
  const liveMonths = new Set(
    (groups?.data?.items ?? []).flatMap((g) =>
      (g.periods ?? []).flatMap((p) => [p.periodStart, p.periodEnd, p.cutoffDate, p.payDate].filter(Boolean).map(monthOf)),
    ),
  )
  const keep = (list, live) => list.filter((m) => !live.includes(m))
  return {
    liveGroups: (groups?.data?.items ?? []).map((g) => g.name),
    access: keep(["Tariro Moyo", "Rudo Sibanda", "Tawanda Chirenje", "Precious Ncube", "Kudzai Maseko", "Read-only RBAC preview", "MFA identity verified"], blob(roster)),
    vault: keep(["June 2026 Payroll Control Pack", "DOC-001", "PAYE Return - June 2026", "Files are virus scanned"], blob(docs)),
    calendar: keep(["Executives", "Commission Sales", "Contract Staff", "Copy prior year"], blob(groups)).concat(liveMonths.has("Jul 2026") ? [] : ["Jul 2026"]),
  }
}

async function open(page, route, heading) {
  await page.goto(mod.base + route, { waitUntil: "domcontentloaded" })
  await page
    .waitForFunction(
      ([h, d]) => {
        const t = (document.querySelector("main") || document.body).innerText || ""
        return (t.includes(h) || t.includes(d)) && !t.includes("Loading the") && !t.includes("Loading pay groups")
      },
      [heading, DENIED],
      { timeout: 60000 },
    )
    .catch(() => {})
  await page.waitForTimeout(600)
  return page.evaluate(() => ((document.querySelector("main") || document.body).innerText || "").replace(/\s+/g, " "))
}

const count = (page, sel) => page.locator(sel).count()

const browser = await chromium.launch({ headless: true })
try {
  const adminToken = await apiLogin("perf.sysadmin@nts.local")
  if (!adminToken) throw new Error("administrator login failed")
  const markers = await fixtureMarkers(adminToken)
  const roster = (await apiGet(adminToken, "/payroll/access/roster"))?.data

  for (const email of PERSONAS) {
    console.log(`\n=== ${email} ===`)
    const token = await apiLogin(email)
    const perms = new Set((await apiGet(token, "/payroll/me/access"))?.data?.permissions ?? [])
    const has = (...p) => p.some((x) => perms.has(x))
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await seedAuth(context, mod.base, email, mod.portal)
    const page = await context.newPage()
    page.setDefaultTimeout(60000)

    // ------------------------------------------------------------- access
    const accessText = await open(page, "/payroll/access", "Roles and Access Control")
    if (has("payroll.access.view", "payroll.access.manage")) {
      check(accessText.includes("User access register"), "access: register renders")
      const seen = markers.access.filter((m) => accessText.includes(m))
      check(seen.length === 0, "access: no vendored demo content", seen.join(", "))
      const someone = roster?.users?.[0]?.name
      check(Boolean(someone) && accessText.includes(someone), "access: a real payroll user is listed", someone)
      check(accessText.includes("No other segregation rule is enforced"), "access: states which segregation rules are not enforced")
      check((await count(page, ".perm-toggle")) === 0, "access: matrix has no toggles that fake a grant")
      check((await count(page, '[data-action="run-access-review"],[data-action="assign-access"],[data-action="edit-access"]')) === 0, "access: no controls that do nothing")
      if (SHOTS && email === "perf.sysadmin@nts.local") await page.screenshot({ path: path.join(SHOTS, "payroll-access.png"), fullPage: true })
    } else {
      check(accessText.includes(DENIED), "access: refused for this role")
    }

    // -------------------------------------------------------------- vault
    const vaultText = await open(page, "/payroll/vault", "Payroll and HR Document Vault")
    if (has("payroll.vault.view", "payroll.vault.manage")) {
      check(vaultText.includes("Payroll and HR Document Vault"), "vault: renders")
      const seen = markers.vault.filter((m) => vaultText.includes(m))
      check(seen.length === 0, "vault: no vendored demo content", seen.join(", "))
      const uploadButtons = await count(page, '[data-action="upload-document"]')
      check((uploadButtons > 0) === has("payroll.vault.manage"), "vault: upload control matches the manage grant", `buttons=${uploadButtons}`)
      check((await count(page, '[data-action="create-document"]')) === 0, "vault: no in-browser document authoring")
      if (SHOTS && email === "perf.sysadmin@nts.local") await page.screenshot({ path: path.join(SHOTS, "payroll-vault-empty.png"), fullPage: true })
    } else {
      check(vaultText.includes(DENIED), "vault: refused for this role")
    }

    // ----------------------------------------------------------- calendar
    const calText = await open(page, "/payroll/calendar", "Pay Groups and Payroll Calendar")
    if (has("payroll.calendar.view", "payroll.calendar.manage")) {
      check(calText.includes("Pay Groups and Payroll Calendar"), "calendar: renders")
      const missingGroups = markers.liveGroups.filter((g) => !calText.includes(g))
      check(missingGroups.length === 0, "calendar: every live pay group is shown", missingGroups.join(", "))
      const seen = markers.calendar.filter((m) => calText.includes(m))
      check(seen.length === 0, "calendar: no vendored demo content", seen.join(", "))
      const editButtons = await count(page, '[data-action="pr6-edit-period"]')
      check((editButtons > 0) === has("payroll.calendar.manage"), "calendar: period controls match the manage grant", `buttons=${editButtons}`)
      if (SHOTS && email === "perf.sysadmin@nts.local") await page.screenshot({ path: path.join(SHOTS, "payroll-calendar.png"), fullPage: true })
    } else {
      check(calText.includes(DENIED), "calendar: refused for this role")
    }

    // ---------------------------------------------- write paths, admin only
    if (email === "perf.sysadmin@nts.local") {
      console.log("  --- upload and download through the UI ---")
      const filename = `uat-synthetic-ui-${Date.now()}.txt`
      const bytes = Buffer.from(`SYNTHETIC UAT DOCUMENT - not real payroll data.\n${filename}\n`, "utf8")
      await open(page, "/payroll/vault", "Payroll and HR Document Vault")
      await page.click('[data-action="upload-document"]')
      await page.waitForSelector("#pr6DocFile", { state: "attached" })
      await page.setInputFiles("#pr6DocFile", { name: filename, mimeType: "text/plain", buffer: bytes })
      await page.selectOption("#pr6DocCategory", "Payroll control packs")
      await page.selectOption("#pr6DocClassification", "CONFIDENTIAL")
      await page.click('[data-action="confirm-upload"]')
      const appeared = await page
        .waitForFunction((f) => ((document.querySelector("main") || document.body).innerText || "").includes(f), filename, { timeout: 45000 })
        .then(() => true)
        .catch(() => false)
      check(appeared, "vault: uploaded document appears in the register")
      if (appeared) {
        const rowText = await page.locator("tr", { hasText: filename }).first().innerText()
        check(rowText.includes("Confidential") && rowText.includes("Perf SysAdmin"), "vault: row shows the classification and the real uploader", rowText.replace(/\s+/g, " ").slice(0, 120))
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "payroll-vault-with-document.png"), fullPage: true })
        await page.locator("tr", { hasText: filename }).first().locator("strong.link").click()
        await page.waitForFunction(() => (document.querySelector("#drawerBody")?.innerText || "").includes("holds the file as uploaded"), null, { timeout: 15000 }).catch(() => {})
        const drawer = (await page.locator("#drawerBody").innerText().catch(() => "")) || ""
        check(drawer.includes("holds the file as uploaded"), "vault: drawer describes the stored file, not a fake editor")
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 30000 }).catch(() => null),
          page.click('#drawerFoot [data-action="download-doc"]'),
        ])
        if (download) {
          const got = fs.readFileSync(await download.path())
          check(Buffer.compare(got, bytes) === 0, "vault: downloaded file is byte-identical to the upload", `${got.length} bytes`)
        } else {
          check(false, "vault: download started")
        }
      }

      console.log("  --- add and edit a pay period through the UI ---")
      const label = `UAT UI period ${Date.now()}`
      await open(page, "/payroll/calendar", "Pay Groups and Payroll Calendar")
      const addButton = page.locator('button[data-action="pr6-edit-period"]:not([data-period-label])').first()
      if ((await addButton.count()) === 0) {
        check(false, "calendar: Add period control present")
      } else {
        await addButton.click()
        await page.waitForSelector("#pr6PeriodLabel")
        await page.fill("#pr6PeriodLabel", label)
        await page.fill("#pr6PeriodStart", "2031-02-01")
        await page.fill("#pr6PeriodEnd", "2031-02-28")
        await page.fill("#pr6PeriodCutoff", "2031-02-20")
        await page.fill("#pr6PeriodPayDate", "2031-02-25")
        await page.selectOption("#pr6PeriodStatus", "PLANNED")
        await page.click('[data-action="save-period"]')
        const added = await page
          .waitForFunction((l) => ((document.querySelector("main") || document.body).innerText || "").includes(l), label, { timeout: 45000 })
          .then(() => true)
          .catch(() => false)
        check(added, "calendar: new period appears")
        if (added) {
          const row = await page.locator("tr", { hasText: label }).first().innerText()
          check(row.includes("25 Feb 2031") && row.includes("20 Feb 2031"), "calendar: stored dates render without a day shift", row.replace(/\s+/g, " "))
          await page.locator(`button[data-action="pr6-edit-period"][data-period-label="${label}"]`).click()
          await page.waitForSelector("#pr6PeriodLabel")
          check(await page.locator("#pr6PeriodLabel").evaluate((el) => el.readOnly), "calendar: label is fixed when editing (periods are keyed by it)")
          await page.selectOption("#pr6PeriodStatus", "OPEN")
          await page.click('[data-action="save-period"]')
          const reopened = await page
            .waitForFunction(
              (l) => [...document.querySelectorAll("tr")].some((tr) => tr.innerText.includes(l) && tr.innerText.includes("Open")),
              label,
              { timeout: 45000 },
            )
            .then(() => true)
            .catch(() => false)
          check(reopened, "calendar: edit persisted (status now Open)")
        }
      }
    }

    await context.close()
  }
} catch (err) {
  check(false, "check ran to completion", String(err?.message ?? err).slice(0, 200))
} finally {
  await browser.close()
}

console.log(`\n=== RESULT === ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
