/**
 * Procurement V23 — every page reached the way a person reaches it: through the sidebar, from another page.
 *
 *   node scripts/_uat/procurement-v23-sidebar-nav.mjs [--user=perf.sysadmin@nts.local] [--start=vendors]
 *                                                    [--pages=plan,invoices] [--base=…] [--out=dir]
 *
 * Every other suite opens each page with page.goto, a fresh load, so none of them can see what happens
 * after a client-side navigation. The root layout's RouteTransition keys the page on its pathname, so
 * each sidebar click unmounts the host and starts a new runtime. Until cycle seven the old runtime's
 * document and window listeners outlived it, and the first to match a click swallowed it and threw
 * against the emptied root: after one sidebar navigation, buttons the host does not claim did nothing
 * (D1, "Capture this invoice").
 *
 * For each page in the role's sidebar this clicks the entry, checks the page stays and the address bar
 * follows, then clicks the page's first opener (a create / new / record / … button in the page head) and
 * checks that something visibly happens: a form, a drawer, a refusal, or a page change. For the openers
 * the host gates, the role's grants (read from the API, not the page) must decide it: a form only for a
 * role holding the grant, a refusal otherwise. It closes what opened and never confirms a form, so
 * nothing is written.
 *
 * Against dev, API, STAFF_BASE and NEXT_PUBLIC_API_BASE_URL must all point at dev (handoff §5), or the
 * token is minted against the local database and every request 401s into /login.
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { API, PASSWORD, seedAuth, STAFF_BASE } from "./_routes.mjs"

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const BASE = arg("base") || STAFF_BASE
const EMAIL = arg("user") || "perf.sysadmin@nts.local"
const START = arg("start") || "vendors"
const ONLY = (arg("pages") || "").split(",").map((s) => s.trim()).filter(Boolean)
const OUT = path.resolve(arg("out") || ".procurement-sidebar-nav")
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 90000)
/** The router push lands after the runtime renders, and the remount it causes renders again. */
const SETTLE = Number(process.env.UAT_NAV_SETTLE_MS || 3000)

/** Page id -> Next path; keep in step with lib/procurement-v23-mock/nav.ts. */
const PATHS = {
  dashboard: "/procurement-v23",
  plan: "/procurement-v23/plan",
  approvals: "/procurement-v23/approvals",
  requisitions: "/procurement-v23/requisitions",
  tenders: "/procurement-v23/tenders",
  quotations: "/procurement-v23/quotations",
  evaluation: "/procurement-v23/evaluation",
  vendors: "/procurement-v23/vendors",
  contracts: "/procurement-v23/contracts",
  orders: "/procurement-v23/purchase-orders",
  receiving: "/procurement-v23/goods-received",
  invoices: "/procurement-v23/invoices",
  intake: "/procurement-v23/intake",
  accounts: "/procurement-v23/accounts",
  documents: "/procurement-v23/documents",
  reports: "/procurement-v23/reports",
  audit: "/procurement-v23/audit",
  settings: "/procurement-v23/settings",
  analytics: "/procurement-v23/analytics",
}

/** Buttons that open something. Their confirm-* step is what writes, and this never clicks one. */
const OPENER = /^(create|new|add|register|record|capture|upload|raise|open|start)-/

/**
 * Openers the host refuses to a role without the grant; keep in step with OPENER_GRANTS in
 * lib/procurement-v23/actions.ts. Opening one of these for a role without the grant is a failure even
 * though "something happened": right after a navigation the host once had no grants to check against.
 */
const OPENER_GRANTS = {
  "create-po-v6": ["orders.manage"],
  "create-tender": ["rfq.manage"],
  "record-grn": ["receiving.manage"],
  "record-payment-v23": ["invoices.pay"],
  "create-plan-v5": ["plans.manage"],
  "add-plan-item": ["plans.manage"],
  "create-contract-v6": ["contracts.manage"],
  "upload-document-v5": ["documents.manage"],
  "upload-document-v6": ["documents.manage"],
  "register-vendor-v6": ["vendors.manage"],
  "run-ocr-v5": ["intake.manage"],
  "upload-invoice-v5": ["intake.manage"],
}

fs.mkdirSync(OUT, { recursive: true })
const results = []

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
try {
  await seedAuth(context, BASE, EMAIL, "staff")
  // The role's grants from the API. The page's own copy is what went missing after a navigation.
  const signIn = await (await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, portal: "staff" }),
  })).json()
  const accessBody = await (await fetch(`${API}/procurement/me/access`, {
    headers: { Authorization: `Bearer ${signIn.token || signIn?.data?.token}` },
  })).json().catch(() => ({}))
  const accessData = accessBody.data ?? accessBody
  const access = { isPrivileged: Boolean(accessData.isPrivileged), permissions: new Set(accessData.permissions || []) }
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))

  const ui = () =>
    page.evaluate(() => ({
      path: location.pathname,
      page: (() => {
        try {
          return window.MatanhoProcurementUI?.getSnapshot?.()?.page ?? null
        } catch {
          return null
        }
      })(),
      h1: (document.querySelector(".page-head h1")?.textContent || "").trim(),
      modalOpen: !!document.querySelector("#modalLayer.open"),
      drawerOpen: !!document.querySelector("#drawerLayer.open"),
      toasts: [...document.querySelectorAll("[data-sonner-toast], #toasts .toast")]
        .map((t) => (t.textContent || "").trim())
        .filter((t) => t && !/Something went wrong/i.test(t)),
    }))

  await page.goto(`${BASE}${PATHS[START] || PATHS.vendors}`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("#nav .nav-item", { timeout: LOAD })
  // Until the role's grants load, the sidebar lists every page. Reading it earlier on a slow first load offered
  // AI Invoice Capture to the Procurement Manager, and the click then waited for an entry the grants had removed.
  await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: LOAD }).catch(() => {})
  await page.waitForTimeout(SETTLE)

  const offered =await page.$$eval("#nav .nav-item[data-page]", (els) => [...new Set(els.map((e) => e.dataset.page))])
  // The start page goes last, so it too is opened from somewhere else.
  const order = offered.filter((p) => p !== START).concat(offered.includes(START) ? [START] : [])
  const targets = order.filter((p) => PATHS[p] && (!ONLY.length || ONLY.includes(p)))
  console.log(`${EMAIL} · sidebar offers ${offered.length} page(s) · starting on ${START}`)

  for (const pid of targets) {
    const row = { page: pid, checks: [] }
    const check = (name, ok, detail) => row.checks.push({ name, ok, detail })

    let mark = errors.length
    await page.locator(`#nav .nav-item[data-page="${pid}"]`).first().click()
    await page.waitForFunction((p) => location.pathname === p, PATHS[pid], { timeout: LOAD }).catch(() => {})
    await page.waitForTimeout(SETTLE)
    const landed = await ui()
    check(
      "opens from the sidebar and stays, address bar follows",
      landed.page === pid && landed.path === PATHS[pid],
      `runtime page "${landed.page}" at ${landed.path} · "${landed.h1}"`,
    )
    check("no page errors while navigating", errors.length === mark, errors.slice(mark, mark + 2).join(" | ") || "none")

    const opener = await page.evaluate((source) => {
      const rx = new RegExp(source)
      const b = [...document.querySelectorAll(".page-head [data-action]")].find(
        (x) => rx.test(x.dataset.action || "") && x.offsetParent !== null,
      )
      return b ? { action: b.dataset.action, label: (b.textContent || "").trim().slice(0, 40) } : null
    }, OPENER.source)

    if (opener) {
      mark = errors.length
      const before = landed
      await page.locator(`.page-head [data-action="${opener.action}"]`).first().click()
      await page.waitForTimeout(1500)
      const after = await ui()
      const newToast = after.toasts.find((t) => !before.toasts.includes(t))
      const what = after.modalOpen
        ? "a form opened"
        : after.drawerOpen
          ? "a drawer opened"
          : newToast
            ? `toast "${newToast.slice(0, 70)}"`
            : after.page !== before.page || after.path !== before.path
              ? `moved to ${after.page}`
              : null
      check(`opener "${opener.label}" (${opener.action}) does something`, !!what, what || "nothing visible happened")
      const needs = OPENER_GRANTS[opener.action]
      if (needs && !access.isPrivileged) {
        const holds = needs.some((g) => access.permissions.has(`procurement.${g}`))
        const refused = Boolean(newToast && /does not have permission/i.test(newToast))
        check(
          holds ? "role holds the grant and is not refused" : "role lacks the grant and is refused",
          holds ? !refused : refused && !after.modalOpen && !after.drawerOpen && after.page === before.page,
          `${needs.join(" or ")} ${holds ? "held" : "not held"} · ${what || "nothing happened"}`,
        )
      }
      if (after.page && after.page !== before.page) {
        check("the opener stays within the role's sidebar", offered.includes(after.page), `moved to ${after.page}`)
      }
      check("no page errors from the opener", errors.length === mark, errors.slice(mark, mark + 2).join(" | ") || "none")
      if (!what || errors.length !== mark) {
        await page.screenshot({ path: path.join(OUT, `${pid}-opener.png`) }).catch(() => {})
      }
      if (after.modalOpen || after.drawerOpen) await page.keyboard.press("Escape")
      await page.waitForTimeout(400)
    } else {
      row.checks.push({ name: "opener", ok: true, detail: "no create/record-style button in the page head", skipped: true })
    }

    row.ok = row.checks.every((c) => c.ok)
    results.push(row)
    const failed = row.checks.filter((c) => !c.ok)
    console.log(`  ${row.ok ? "PASS" : "FAIL"}  ${pid.padEnd(13)} ${row.checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.detail}`).join("  ·  ")}`)
    if (failed.length) await page.screenshot({ path: path.join(OUT, `${pid}.png`) }).catch(() => {})
  }
} finally {
  await browser.close()
}

fs.writeFileSync(path.join(OUT, "sidebar-nav.json"), JSON.stringify({ user: EMAIL, base: BASE, start: START, results }, null, 2))
const passed = results.filter((r) => r.ok).length
const openers = results.flatMap((r) => r.checks.filter((c) => c.name.startsWith("opener \"")))
console.log(`=== RESULT === ${passed}/${results.length} pages passed · openers working ${openers.filter((c) => c.ok).length}/${openers.length}`)
process.exit(passed === results.length && results.length ? 0 : 1)
