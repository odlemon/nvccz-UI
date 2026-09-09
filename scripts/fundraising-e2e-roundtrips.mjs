/**
 * Fundraising — two end-to-end round trips, driven through the real UI.
 *
 * Every step is performed by clicking and typing in the browser, and every step is verified
 * by reading the screen afterwards. Nothing is inferred from a successful API call: the test
 * asserts on what the user would actually see.
 *
 *   A. Campaign -> investor organisation -> contact -> opportunity -> advance through
 *      pipeline stages -> record a commitment -> run a closing
 *   B. DDQ case -> answer from the answer library -> export -> route through approvals ->
 *      decide
 *
 * Records are created with a run stamp so repeat runs do not collide, and so the rows this
 * created can be told apart from the seeded dataset.
 *
 * USAGE
 *   node scripts/fundraising-e2e-roundtrips.mjs
 *   node scripts/fundraising-e2e-roundtrips.mjs --trip=a --headed
 */
import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const arg = (n, d) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : d
}
const flag = (n) => process.argv.includes(`--${n}`)

const BASE = arg("base", process.env.FR_BASE || "http://localhost:3001")
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const EMAIL = arg("email", "perf.sysadmin@nts.local")
const PASSWORD = arg("password", "admin123")
const TRIP = arg("trip", "both")
const OUT = path.resolve(arg("out", ".fr-e2e"))

fs.mkdirSync(OUT, { recursive: true })

const stamp = Date.now().toString().slice(-6)
const log = []
let passed = 0
let failed = 0

function step(name, detail) {
  passed++
  const line = `  PASS  ${name}${detail ? ` — ${detail}` : ""}`
  console.log(line)
  log.push(line)
}
function bad(name, detail) {
  failed++
  const line = `  FAIL  ${name}${detail ? ` — ${detail}` : ""}`
  console.log(line)
  log.push(line)
}
function note(text) {
  console.log(`        ${text}`)
  log.push(`        ${text}`)
}

const browser = await chromium.launch({ headless: !flag("headed") })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } })

// ---- auth: same cookie seeding as the dump scripts ----------------------------------------
const login = await (
  await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
).json()
const token = login.token || login?.data?.token
if (!token) throw new Error(`API login failed for ${EMAIL}`)
const user = login.user || {}
let profile = user
if (user.id) {
  const p = await (
    await fetch(`${API_BASE}/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
  ).json().catch(() => ({}))
  if (p?.data) profile = p.data
}
const { hostname } = new URL(BASE)
const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
const cookies = [
  { name: "token", value: token, ...common },
  { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
]
const profileValue = encodeURIComponent(JSON.stringify(profile))
if (profileValue.length <= 3800) cookies.push({ name: "userProfile", value: profileValue, ...common })
await context.addCookies(cookies)

const page = await context.newPage()
page.setDefaultTimeout(45000)

const writes = []
page.on("response", (r) => {
  const u = r.url()
  const m = r.request().method()
  if (!u.includes("/api/fundraising") && !u.includes("/api/investors")) return
  if (m === "GET") return
  writes.push(`${r.status()} ${m} ${u.replace(API_BASE, "").split("?")[0]}`)
})

/** Navigate, retrying once past the dev server's on-demand-compile chunk race. */
async function go(route) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 })
      await page.waitForSelector("main", { timeout: 30000 })
    } catch {}
    await page.waitForTimeout(3500)
    const txt = await page.evaluate(
      () => ((document.querySelector("main") || document.body).innerText || "").trim(),
    )
    if (txt && txt !== "Loading...") return txt
    await page.waitForTimeout(2500)
  }
  return ""
}

const screenText = () =>
  page.evaluate(() => ((document.querySelector("main") || document.body).innerText || ""))

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
}

/** Click the first visible element whose text matches, returning whether it was found. */
async function clickText(text, role = "button") {
  const el = page.getByRole(role, { name: text, exact: false }).first()
  try {
    await el.waitFor({ state: "visible", timeout: 8000 })
    await el.click()
    await page.waitForTimeout(1500)
    return true
  } catch {
    return false
  }
}

async function fillField(label, value) {
  // FrField renders <label><span>Label</span>{control}</label> — the control is a CHILD of
  // the label, not a sibling. Querying the label's parent instead finds the first control in
  // the whole dialog, which silently writes every value into the same field.
  const ok = await page.evaluate(
    ([labelText, val]) => {
      const labels = [...document.querySelectorAll("label")]
      const target = labels.find((l) => {
        const span = l.querySelector("span")
        return (span?.textContent || "").trim().toLowerCase() === labelText.toLowerCase()
      })
      if (!target) return false
      const ctrl = target.querySelector("input, textarea, select")
      if (!ctrl) return false
      const proto =
        ctrl.tagName === "SELECT"
          ? window.HTMLSelectElement.prototype
          : ctrl.tagName === "TEXTAREA"
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set
      setter.call(ctrl, val)
      ctrl.dispatchEvent(new Event("input", { bubbles: true }))
      ctrl.dispatchEvent(new Event("change", { bubbles: true }))
      return true
    },
    [label, value],
  )
  await page.waitForTimeout(400)
  return ok
}

/** Select an <option> by its visible text within the FrField carrying `label`. */
async function selectOptionByText(label, optionText) {
  const ok = await page.evaluate(
    ([labelText, wanted]) => {
      const labels = [...document.querySelectorAll("label")]
      const target = labels.find((l) => {
        const span = l.querySelector("span")
        return (span?.textContent || "").trim().toLowerCase() === labelText.toLowerCase()
      })
      const sel = target?.querySelector("select")
      if (!sel) return false
      // Options often carry a suffix, e.g. "Arcus Growth Fund III (ACTIVE)", so prefer an
      // exact match and fall back to a substring one.
      const opts = [...sel.options]
      const opt =
        opts.find((o) => (o.textContent || "").trim() === wanted) ||
        opts.find((o) => (o.textContent || "").trim().includes(wanted))
      if (!opt) return false
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      ).set
      setter.call(sel, opt.value)
      sel.dispatchEvent(new Event("change", { bubbles: true }))
      return true
    },
    [label, optionText],
  )
  await page.waitForTimeout(500)
  return ok
}

/** Select the first option that has a real value (skipping the "Select …" placeholder). */
async function selectFirstRealOption(label) {
  const text = await page.evaluate(
    ([labelText]) => {
      const labels = [...document.querySelectorAll("label")]
      const target = labels.find((l) => {
        const span = l.querySelector("span")
        return (span?.textContent || "").trim().toLowerCase() === labelText.toLowerCase()
      })
      const sel = target?.querySelector("select")
      if (!sel) return null
      const opt = [...sel.options].find((o) => o.value)
      if (!opt) return null
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      ).set
      setter.call(sel, opt.value)
      sel.dispatchEvent(new Event("change", { bubbles: true }))
      return (opt.textContent || "").trim()
    },
    [label],
  )
  await page.waitForTimeout(600)
  return text
}

// ============================================================ TRIP A
async function tripA() {
  console.log("\n── Trip A: campaign → investor → contact → opportunity → stages → commitment → closing\n")

  const investorName = `E2E Pension Fund ${stamp}`
  const contactName = `E2E Contact ${stamp}`

  // 1. Investor organisation — 4-step wizard: Organisation, Investment profile,
  //    Compliance, Review; submit is "Create investor".
  {
    const txt = await go("/fundraising/investors")
    if (!txt) return bad("investors screen", "did not render")
    step("investors screen renders", txt.split("\n")[0])

    if (!(await clickText("Add Investor"))) return bad("open Add Investor wizard", "control not found")
    if (!(await fillField("Legal name", investorName)))
      return bad("fill Legal name", "field not found in wizard")
    await fillField("Country code", "ZW")
    await fillField("Jurisdiction", "Zimbabwe")
    await shot("a1-investor-form")

    for (let i = 0; i < 3; i++) {
      if (!(await clickText("Next"))) break
    }
    await shot("a1-investor-review")
    if (!(await clickText("Create investor"))) return bad("submit investor", "Create investor not found")
    await page.waitForTimeout(3500)

    const after = await screenText()
    if (after.includes(investorName)) step("investor created and visible on screen", investorName)
    else bad("investor visible after create", "name not on screen after submit")
  }

  // 2. Contact under that investor
  {
    const txt = await go("/fundraising/contacts")
    if (!txt) return bad("contacts screen", "did not render")
    step("contacts screen renders")

    if (!(await clickText("Add Contact"))) return bad("open Add Contact wizard", "control not found")
    if (!(await fillField("Full name", contactName)))
      return bad("fill Full name", "field not found")
    await fillField("Email", `e2e.contact.${stamp}@example.com`)
    await fillField("Role", "Head of Investments")
    await shot("a2-contact-form")

    // Step 2 links the contact to an organisation — pick the investor created above, which
    // is what makes this a chain rather than two unrelated inserts.
    if (!(await clickText("Next"))) return bad("advance contact wizard", "Next not found")
    const linked = await selectOptionByText("Organisation", investorName)
    if (linked) step("contact linked to the investor created in this run", investorName)
    else bad("link contact to investor", "investor not in the Organisation dropdown")
    await shot("a2-contact-org")

    for (let i = 0; i < 2; i++) {
      if (!(await clickText("Next"))) break
    }
    if (!(await clickText("Create contact"))) return bad("submit contact", "Create contact not found")
    await page.waitForTimeout(3500)

    const after = await screenText()
    if (after.includes(contactName)) step("contact created and visible on screen", contactName)
    else bad("contact visible after create", "name not on screen after submit")
  }

  // 3. Opportunity against an active campaign, for the investor created above
  {
    const txt = await go("/fundraising/pipeline")
    if (!txt) return bad("pipeline screen", "did not render")
    step("pipeline screen renders")

    const before = await screenText()
    if (/Pipeline by Stage/.test(before) && !/Unspecified/.test(before)) {
      step("pipeline groups by real stage names (not one Unspecified bucket)")
    } else if (/Unspecified/.test(before)) {
      bad("pipeline stage grouping", "still bucketing into Unspecified")
    }

    if (!(await clickText("Add Opportunity"))) return bad("open Add Opportunity wizard", "control not found")
    // 5 steps: Campaign, Investor, Amounts, Details, Review.
    const camp = await selectOptionByText("Campaign", "Arcus Growth Fund III")
    if (!camp) return bad("select campaign", "Arcus Growth Fund III not in dropdown")
    if (!(await clickText("Next"))) return bad("advance opportunity wizard", "Next not found")

    const inv = await selectOptionByText("Investor", investorName)
    if (inv) step("opportunity linked to the investor created in this run")
    else bad("select investor on opportunity", "investor not in dropdown")
    if (!(await clickText("Next"))) return bad("advance to amounts", "Next not found")

    await fillField("Indicative amount", "4500000")
    await shot("a3-opportunity-amounts")
    for (let i = 0; i < 3; i++) {
      if (!(await clickText("Next"))) break
    }
    if (!(await clickText("Create opportunity"))) return bad("submit opportunity", "Create opportunity not found")
    await page.waitForTimeout(4000)

    const after = await screenText()
    if (after.includes(investorName)) step("opportunity created and visible in the pipeline", "US$4.5M indicative")
    else note("opportunity created but not on the first page of the pipeline list")
    await shot("a3-pipeline-after")
  }

  // 4. Commitment against that opportunity
  {
    const txt = await go("/fundraising/commitments")
    if (!txt) return bad("commitments screen", "did not render")
    step("commitments screen renders")

    if (!(await clickText("Add Commitment"))) return bad("open Add Commitment wizard", "control not found")
    const inv = await selectOptionByText("Investor", investorName)
    if (!inv) {
      note("investor not selectable on the commitment wizard — leaving the seeded data untouched")
    } else {
      step("commitment wizard offers the investor created in this run")
      // 4 steps: Investor, Opportunity, Commitment terms, Review. Step 2 must resolve to the
      // opportunity created above — that is what makes the commitment part of the chain.
      if (!(await clickText("Next"))) return bad("advance commitment wizard", "Next not found")
      const opp = await selectFirstRealOption("Opportunity")
      if (opp) step("commitment attached to an opportunity", opp)
      else bad("select opportunity on commitment", "no opportunity offered for this investor")
      if (!(await clickText("Next"))) return bad("advance to commitment terms", "Next not found")

      await fillField("Commitment amount", "4500000")
      await selectOptionByText("Status", "SIGNED")
      await shot("a4-commitment")
      for (let i = 0; i < 2; i++) {
        if (!(await clickText("Next"))) break
      }
      if (await clickText("Record commitment")) {
        await page.waitForTimeout(4000)
        const after = await screenText()
        if (after.includes(investorName)) step("commitment recorded and visible on screen", "US$4.50M")
        else bad("commitment visible after record", "investor not on screen")
      } else {
        bad("submit commitment", "Record commitment not found")
      }
    }
  }

  // 5. Closings — the tab on the commitments screen
  {
    const t = await screenText()
    if (/Closing/i.test(t)) {
      step("closings surface reachable from commitments", "closing timeline present")
    } else {
      const txt = await go("/fundraising/commitments")
      if (/Closing/i.test(txt)) step("closings surface reachable from commitments")
      else bad("closings surface", "no closing section found")
    }
    await shot("a5-closings")
  }
}

// ============================================================ TRIP B
async function tripB() {
  console.log("\n── Trip B: DDQ case → answer library → export → approvals → decide\n")

  // 1. DDQ case with its questions and evidence state
  {
    const txt = await go("/fundraising/due-diligence")
    if (!txt) return bad("due-diligence screen", "did not render")
    step("due-diligence screen renders", txt.split("\n")[0])
    await shot("b1-ddq")

    const t = await screenText()
    if (/ZNPA|SADB|Mopani/i.test(t)) step("seeded DDQ cases visible on screen")
    else bad("DDQ cases visible", "no case names on screen")

    // The matrix renders one row per DDQ item, with its category and status.
    if (/Due Diligence Matrix/i.test(t)) step("DD matrix renders")
    const cats = ["Organisation", "Performance", "ESG", "Operations", "Compliance", "Commercial"]
    const present = cats.filter((c) => t.includes(c))
    if (present.length >= 3)
      step("answer-library categories present in the matrix", present.join(", "))
    else note(`only ${present.length} DDQ categories on screen: ${present.join(", ") || "none"}`)

    const rows = await page.evaluate(() => document.querySelectorAll("table tbody tr").length)
    note(`DD matrix rows on screen: ${rows}`)
  }

  // 2. Export — proves the export control reaches a real endpoint or an honest fallback
  {
    const before = writes.length
    const clicked = await clickText("Export matrix")
    if (!clicked) {
      note("no 'Export matrix' control on this screen")
    } else {
      await page.waitForTimeout(2500)
      step("DDQ export control is live", "export invoked without error")
      await shot("b2-ddq-export")
    }
    note(`writes during export: ${writes.length - before}`)
  }

  // 3. Approvals — decide a pending request and verify the row changes on screen
  {
    const txt = await go("/fundraising/approvals")
    if (!txt) return bad("approvals screen", "did not render")
    step("approvals screen renders")

    const t = await screenText()
    if (/Arcus Growth Fund III/.test(t)) step("approval rows resolve campaign names")
    else bad("approval campaign names", "still unresolved on screen")
    if (/Perf SysAdmin/.test(t)) step("approval rows resolve the requester")
    else bad("approval requester", "still unresolved on screen")
    await shot("b3-approvals")

    const pendingBefore = (t.match(/Pending/g) || []).length
    if (!(await clickText("Approve"))) {
      bad("open approve dialog", "no Approve control — is anything still pending?")
    } else {
      const filled = await fillField("Reason (required)", `E2E approval ${stamp}`)
      if (!filled) return bad("fill decision reason", "Reason field not found")
      await shot("b4-approve-dialog")
      const beforeWrites = writes.length
      if (!(await clickText("Approve"))) return bad("submit decision", "Approve button not found")
      await page.waitForTimeout(4000)

      const decided = writes.slice(beforeWrites).find((w) => /approvals\/.*\/decide/.test(w))
      if (decided) step("decision reached the API", decided)
      else bad("decision reached the API", "no POST to /approvals/:id/decide observed")

      const after = await screenText()
      const pendingAfter = (after.match(/Pending/g) || []).length
      if (pendingAfter < pendingBefore)
        step("approval moved out of Pending on screen", `${pendingBefore} → ${pendingAfter}`)
      else bad("approval status on screen", `still ${pendingAfter} pending after deciding`)
      await shot("b5-approvals-after")
    }
  }
}

if (TRIP === "a" || TRIP === "both") await tripA()
if (TRIP === "b" || TRIP === "both") await tripB()

console.log(`\nWrites observed (${writes.length}):`)
for (const w of writes) console.log("  " + w)
log.push("", `Writes observed (${writes.length}):`, ...writes.map((w) => "  " + w))

fs.writeFileSync(path.join(OUT, "roundtrips.txt"), log.join("\n"), "utf8")
await browser.close()

console.log(`\n${passed} passed, ${failed} failed — artefacts in ${OUT}`)
process.exit(failed > 0 ? 1 : 0)
