/**
 * Fundraising — the behaviour claims that can only be checked on screen.
 *
 * Covers B5 (an unmet stage gate is shown as a checklist, not just a toast) and B28 (every
 * tabbed screen switches content in place rather than navigating).
 *
 * USAGE: node scripts/fundraising-ui-behaviour-check.mjs
 */
import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const BASE = process.env.FR_BASE || "http://localhost:3001"
const OUT = path.resolve(".fr-e2e")
fs.mkdirSync(OUT, { recursive: true })

const results = []
const rec = (id, ok, detail) => {
  results.push({ id, ok })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${id}  ${detail}`)
}
const note = (t) => console.log(`        ${t}`)

const stamp = Date.now().toString().slice(-6)

async function api(method, p, body, token) {
  const r = await fetch(`${API}${p}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => null)
  return { status: r.status, data: j?.data, body: j }
}

const login = await api("POST", "/auth/login", { email: "perf.sysadmin@nts.local", password: "admin123" })
const token = login.body?.token
if (!token) throw new Error("login failed")

// ---- a campaign with one opportunity parked just below a gated stage -----------------------
// PE/VC stage 5 is DATA_ROOM (requiresSoftCircle). Park an opportunity at ENGAGED with no soft
// circle, so dragging it to Data Room must fail the gate and show the checklist.
const camp = await api("POST", "/fundraising/campaigns", {
  campaignType: "PE_FUNDRAISE", name: `BEHAVIOUR UI ${stamp}`,
  targetCapital: 5_000_000, primaryCurrency: "USD",
  startDate: "2026-01-01", closeDate: "2027-12-31",
}, token)
const campaignId = camp.data?.id
await api("POST", `/fundraising/campaigns/${campaignId}/activate`, null, token)

const inv = await api("POST", "/investors", {
  legalName: `BEHAVIOUR UI Investor ${stamp}`, investorType: "PENSION_FUND",
  countryCode: "ZW", baseCurrency: "USD", kycStatus: "APPROVED", sanctionsStatus: "CLEAR",
}, token)
const investorId = inv.data?.id

const opp = await api("POST", "/fundraising/opportunities", {
  campaignId, investorId, opportunityType: "LP_COMMITMENT",
  opportunityCurrency: "USD", indicativeAmount: 500_000, priority: "HIGH",
}, token)
const oppId = opp.data?.id
for (const code of ["CONTACTED", "QUALIFIED", "ENGAGED"]) {
  await api("POST", `/fundraising/opportunities/${oppId}/transition`, { toStageCode: code }, token)
}
note(`scratch campaign ${campaignId} with one opportunity parked at ENGAGED (no soft circle)`)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } })
const { hostname } = new URL(BASE)
const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
await context.addCookies([
  { name: "token", value: token, ...common },
  { name: "user", value: encodeURIComponent(JSON.stringify(login.body.user || {})), ...common },
])
const page = await context.newPage()
page.setDefaultTimeout(45000)

const writes = []
page.on("response", (r) => {
  if (r.request().method() === "GET") return
  const u = r.url()
  if (u.includes("/api/fundraising") || u.includes("/api/investors")) {
    writes.push(`${r.status()} ${r.request().method()} ${u.replace(API, "").split("?")[0]}`)
  }
})

async function go(route) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 })
      await page.waitForSelector("main", { timeout: 30000 })
    } catch {}
    await page.waitForTimeout(3500)
    const t = await page.evaluate(() => ((document.querySelector("main") || document.body).innerText || "").trim())
    if (t && t !== "Loading...") return t
    await page.waitForTimeout(2500)
  }
  return ""
}

// ============================================================ B5
{
  await go("/fundraising/pipeline")
  await page.evaluate(() => {
    const sel = document.querySelector('select[aria-label="Pipeline view"]')
    if (!sel) return
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set
    setter.call(sel, "board")
    sel.dispatchEvent(new Event("change", { bubbles: true }))
  })
  await page.waitForTimeout(4000)
  // Point the board at the scratch campaign.
  const picked = await page.evaluate((name) => {
    const sel = [...document.querySelectorAll("select")].find((s) =>
      [...s.options].some((o) => (o.textContent || "").includes(name)),
    )
    if (!sel) return false
    const opt = [...sel.options].find((o) => (o.textContent || "").includes(name))
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set
    setter.call(sel, opt.value)
    sel.dispatchEvent(new Event("change", { bubbles: true }))
    return true
  }, `BEHAVIOUR UI ${stamp}`)
  await page.waitForTimeout(4500)
  note(`board pointed at the scratch campaign: ${picked}`)

  const geo = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[aria-roledescription="draggable"], [role="button"][tabindex="0"]')]
      .filter((c) => (c.textContent || "").trim().length > 20)
    const card = cards[0]
    if (!card) return null
    const cr = card.getBoundingClientRect()
    const cols = [...document.querySelectorAll("div.thin-scroll")].filter((d) => {
      const r = d.getBoundingClientRect()
      return r.height > 100 && r.width > 100
    })
    const boxes = cols.map((d) => {
      const r = d.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + Math.min(120, r.height / 2) }
    })
    const target = boxes.find((b) => b.x > cr.x + cr.width / 2 + 40)
    return { from: { x: cr.x + cr.width / 2, y: cr.y + 20 }, to: target ?? null }
  })

  if (!geo?.to) {
    rec("B5", false, "could not position a drag on the board")
  } else {
    const before = writes.length
    await page.mouse.move(geo.from.x, geo.from.y)
    await page.mouse.down()
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(
        geo.from.x + ((geo.to.x - geo.from.x) * i) / 12,
        geo.from.y + ((geo.to.y - geo.from.y) * i) / 12,
      )
      await page.waitForTimeout(60)
    }
    await page.mouse.up()
    await page.waitForTimeout(4000)
    await page.screenshot({ path: path.join(OUT, "b5-stage-gate.png") })

    const refused = writes.slice(before).find((w) => /transition/.test(w) && !w.startsWith("200"))
    const moved = writes.slice(before).find((w) => /transition/.test(w) && w.startsWith("200"))
    const shown = await page.evaluate(() => {
      const body = document.body.innerText || ""
      return {
        checklist: /requires|requirement|not met|outstanding/i.test(body),
        dialog: !!document.querySelector('[role="dialog"]'),
        text: (body.match(/requires\w+[^\n]{0,60}/i) || [""])[0],
      }
    })
    if (refused) {
      rec("B5", shown.checklist && shown.dialog, `gate refused (${refused}); checklist dialog shown: ${shown.dialog}, text "${shown.text}"`)
    } else if (moved) {
      rec("B5", false, `expected the gate to refuse, but the move succeeded (${moved})`)
    } else {
      rec("B5", false, "no transition call observed — the drag did not activate")
    }
  }
}

// ============================================================ B28
{
  const tabbed = [
    ["settings", "/fundraising/settings", ["Pipelines", "Stage Gates", "Amount Types", "Roles", "Notifications"]],
    ["investors", "/fundraising/investors", ["Overview"]],
    ["agreements", "/fundraising/agreements", ["Agreements", "Signatures"]],
    ["meetings", "/fundraising/meetings", ["Meetings", "Tasks"]],
    ["campaigns", "/fundraising/campaigns", ["Templates", "Distribution Lists", "Events"]],
  ]
  for (const [id, route, tabs] of tabbed) {
    const txt = await go(route)
    if (!txt) {
      rec(`B28-${id}`, false, "screen did not render")
      continue
    }
    const startUrl = await page.evaluate(() => location.pathname)
    let switched = 0
    let navigated = false
    let contentChanged = false
    let last = txt
    for (const tab of tabs) {
      const clicked = await page.evaluate((name) => {
        const el = [...document.querySelectorAll("button,[role='tab']")].find(
          (x) => (x.textContent || "").trim() === name,
        )
        if (!el) return false
        el.click()
        return true
      }, tab)
      if (!clicked) continue
      await page.waitForTimeout(2200)
      const url = await page.evaluate(() => location.pathname)
      const now = await page.evaluate(() => (document.querySelector("main") || document.body).innerText || "")
      if (url !== startUrl) navigated = true
      if (now !== last) contentChanged = true
      last = now
      switched++
    }
    rec(
      `B28-${id}`,
      switched > 0 && !navigated && contentChanged,
      `${switched} tab(s) switched, url stayed ${startUrl}, content changed: ${contentChanged}`,
    )
  }
}

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`)
if (failed.length) console.log(`Failing: ${failed.map((f) => f.id).join(", ")}`)
process.exit(failed.length ? 1 : 0)
