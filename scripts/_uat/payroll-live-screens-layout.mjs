/**
 * Layout of the rebuilt Access, Vault and Calendar screens at 375 / 768 / 1024 / 1440.
 *
 * Measures what a person can SEE, not only what is in the DOM. The first version of this
 * check, and the responsive sweep before it, passed payroll at 375px while every payroll
 * screen was blank: the content sat below the viewport inside an overflow:hidden container,
 * which clips without creating a scroll, so "no horizontal scroll" and "text present" were
 * both true of an empty screen (FINDING-018). So each screen must now also:
 *
 *   - show its page heading inside the viewport, with nothing drawn over it
 *   - leave every control in the top bar inside the viewport and unobstructed
 *
 * The access register is still measured directly — whichever view the breakpoint shows
 * (table or cards) must fit its container — because content inside a scroll container is
 * invisible to a page-level overflow test. Widths come from clientWidth, never innerWidth.
 *
 * Seeds one synthetic document so the vault renders a row, and screenshots every screen.
 * Remove it afterwards with nvccz/scripts/_uat/clean-payroll-live-screen-probes.mjs.
 *
 * Run:  node scripts/_uat/payroll-live-screens-layout.mjs [--shots=<dir>]
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

const SCREENS = [
  ["/payroll/access", "Roles and Access Control", "access"],
  ["/payroll/vault", "Payroll and HR Document Vault", "vault"],
  ["/payroll/calendar", "Pay Groups and Payroll Calendar", "calendar"],
]
const WIDTHS = [1440, 1024, 768, 375]

let pass = 0
let fail = 0
const check = (ok, label, detail = "") => {
  if (ok) pass += 1
  else fail += 1
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`)
}

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "perf.sysadmin@nts.local", password: PASSWORD, portal: "staff" }),
}).then((r) => r.json())
const token = login.token || login?.data?.token
if (!token) throw new Error("administrator login failed")

const form = new FormData()
const name = `uat-synthetic-layout-${Date.now()}.txt`
form.append("file", new Blob([`SYNTHETIC UAT DOCUMENT - not real payroll data.\n${name}\n`], { type: "text/plain" }), name)
form.append("category", "Payroll control packs")
form.append("classification", "RESTRICTED")
form.append("periodLabel", "September 2026")
const seeded = await fetch(`${API}/payroll/documents`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form })
check(seeded.status === 201, "synthetic document seeded for the vault", `status ${seeded.status}`)

const browser = await chromium.launch({ headless: true })
try {
  for (const width of WIDTHS) {
    console.log(`\n=== ${width}px ===`)
    const context = await browser.newContext({ viewport: { width, height: 812 } })
    await seedAuth(context, mod.base, "perf.sysadmin@nts.local", mod.portal)
    const page = await context.newPage()
    page.setDefaultTimeout(60000)

    for (const [route, heading, key] of SCREENS) {
      await page.goto(mod.base + route, { waitUntil: "domcontentloaded" })
      await page
        .waitForFunction(
          (h) => {
            const t = document.body.innerText || ""
            return t.includes(h) && !t.includes("Loading the") && !t.includes("Loading pay groups")
          },
          heading,
          { timeout: 60000 },
        )
        .catch(() => {})
      await page.waitForTimeout(900)

      const m = await page.evaluate((k) => {
        const doc = document.documentElement
        const vw = doc.clientWidth
        const vh = doc.clientHeight
        const describe = (e) =>
          e ? e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/)[0] : "") : "nothing"
        const out = { vw, vh, pageOverflow: doc.scrollWidth - vw, register: null }

        // Is the heading where a person can see it, with nothing on top of it?
        const h = document.querySelector(".page-head h1")
        if (h) {
          const r = h.getBoundingClientRect()
          const x = Math.min(vw - 2, Math.max(2, r.left + Math.min(20, r.width / 2)))
          const y = Math.min(vh - 2, Math.max(2, r.top + r.height / 2))
          const top = document.elementFromPoint(x, y)
          out.heading = {
            top: Math.round(r.top),
            left: Math.round(r.left),
            inView: r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw,
            coveredBy: top && (top === h || h.contains(top)) ? null : describe(top),
          }
        } else {
          out.heading = null
        }

        // Every control in the top band must be on screen and not drawn over.
        const controls = [...document.querySelectorAll("input, button, a, select")].filter((el) => {
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && r.top < 90 && r.bottom > 0 && s.visibility !== "hidden" && s.display !== "none"
        })
        out.topbarBlocked = controls
          .filter((el) => {
            const r = el.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            if (r.left < -1 || r.right > vw + 1) return true
            const t = document.elementFromPoint(Math.max(0, Math.min(vw - 1, cx)), Math.max(0, cy))
            return !(t && (t === el || el.contains(t) || t.contains(el)))
          })
          .map((el) => describe(el) + (el.getAttribute("placeholder") ? `[${el.getAttribute("placeholder").slice(0, 16)}]` : ""))

        if (k === "access") {
          const wrap = document.querySelector(".access-user-table")
          const cards = document.querySelector(".access-user-cards")
          const shown = (el) => el && getComputedStyle(el).display !== "none"
          if (shown(wrap)) {
            const table = wrap.querySelector("table")
            out.register = { view: "table", overflow: table.scrollWidth - wrap.clientWidth, inner: table.scrollWidth, box: wrap.clientWidth }
          } else if (shown(cards)) {
            const worst = Math.max(0, ...[...cards.children].map((c) => c.scrollWidth - c.clientWidth))
            out.register = { view: "cards", overflow: Math.max(worst, cards.scrollWidth - cards.clientWidth), inner: cards.scrollWidth, box: cards.clientWidth }
          } else {
            out.register = { view: "none", overflow: 0, inner: 0, box: 0 }
          }
        }
        return out
      }, key)

      check(m.pageOverflow <= 1, `${key}: no page-level horizontal scroll`, `${m.pageOverflow}px`)
      check(
        Boolean(m.heading && m.heading.inView && !m.heading.coveredBy),
        `${key}: page heading visible on first paint`,
        m.heading ? `top ${m.heading.top}px of ${m.vh}px${m.heading.coveredBy ? ", covered by " + m.heading.coveredBy : ""}` : "no heading",
      )
      check(m.topbarBlocked.length === 0, `${key}: top bar controls on screen and unobstructed`, m.topbarBlocked.join(", "))
      if (key === "access") {
        check(m.register.view !== "none", `access: a register view is shown`, m.register.view)
        check(m.register.overflow <= 1, `access: ${m.register.view} register fits its container`, `${m.register.inner}px in ${m.register.box}px`)
      }
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${key}-${width}.png`) })
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(`\n=== RESULT === ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
