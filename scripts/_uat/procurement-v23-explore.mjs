/**
 * Procurement V23 exploratory census: every page as each persona, and what every control on it does.
 *
 * Per persona and page: the nav it is offered (with badge counts), heading, KPI cards, tables
 * (headers, row counts, first rows), empty states and notices, vendored demo records, text such as
 * "undefined" or "NaN", page and console errors, failed API calls, and a screenshot.
 *
 * Then each distinct control is operated from a clean page and its effect recorded: navigation, a
 * modal or drawer (with its fields and buttons), a menu (whose items are then operated), a toast, a
 * download, a new tab, a browser dialog, API calls, an in-place change, or nothing at all. Controls
 * inside a modal or drawer are operated too, once per distinct modal.
 *
 * Read-only toward the backend: LIVE_ACTIONS (lib/procurement-v23/actions.ts) write through the API,
 * so they are listed and never clicked here. Browser dialogs are dismissed. Any other control that
 * still sends a write request is reported as API WRITE.
 *
 * Run:  node scripts/_uat/procurement-v23-explore.mjs --out=<dir> [--tag=A] [--users=a@x,b@y]
 *                                                    [--pages=plan,invoices] [--full=a@x,...]
 *   --full   personas whose every control is operated (default: the first persona in --users); the
 *            others operate only controls no earlier persona in the same run has operated.
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const staff = MODULES.find((m) => m.portal === "staff")
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean)

const PERSONAS = [
  ["proc.mgr@nts.local", "Procurement Manager"],
  ["perf.sysadmin@nts.local", "System Administrator"],
  ["proc.officer@nts.local", "Procurement Officer"],
  ["proc.buyer@nts.local", "Buyer"],
  ["proc.requester@nts.local", "Operations member (requester)"],
  ["perf.deptmgr@nts.local", "Operations head"],
  ["proc.ap@nts.local", "Accountant"],
  ["payroll.finmgr@nts.local", "Finance Manager"],
  ["payroll.cfo@nts.local", "Chief Financial Officer"],
  ["payroll.intaudit@nts.local", "Internal Auditor"],
]

const PAGES = [
  ["dashboard", "/procurement-v23"],
  ["plan", "/procurement-v23/plan"],
  ["approvals", "/procurement-v23/approvals"],
  ["requisitions", "/procurement-v23/requisitions"],
  ["tenders", "/procurement-v23/tenders"],
  ["quotations", "/procurement-v23/quotations"],
  ["evaluation", "/procurement-v23/evaluation"],
  ["vendors", "/procurement-v23/vendors"],
  ["contracts", "/procurement-v23/contracts"],
  ["orders", "/procurement-v23/purchase-orders"],
  ["receiving", "/procurement-v23/goods-received"],
  ["invoices", "/procurement-v23/invoices"],
  ["intake", "/procurement-v23/intake"],
  ["accounts", "/procurement-v23/accounts"],
  ["documents", "/procurement-v23/documents"],
  ["reports", "/procurement-v23/reports"],
  ["audit", "/procurement-v23/audit"],
  ["settings", "/procurement-v23/settings"],
  ["analytics", "/procurement-v23/analytics"],
]

// First record of each fixture array in the runtime's state store, plus the demo owner.
const MARKERS = [
  "PLAN-26-GRP", "PPI-0001", "PR-X8F2-0187", "TN-2026-014", "VEN-00482", "TechNova Solutions",
  "PO-2026-0584", "GRN-2026-0219", "INV-98431", "JE-P2P-00881", "FA-000882", "DOC-00184",
  "RPT-0104", "T. Moyo",
]

const OUT = path.resolve(arg("out") || ".procurement-explore")
const TAG = arg("tag") || "run"
const wanted = list(arg("users"))
const USERS = wanted.length ? wanted.map((e) => PERSONAS.find(([p]) => p === e) || [e, e]) : PERSONAS
const ONLY_PAGES = list(arg("pages"))
const FULL = new Set(list(arg("full")).length ? list(arg("full")) : [USERS[0][0]])
fs.mkdirSync(path.join(OUT, "shots"), { recursive: true })

// The host's live write actions, read from its source so this never drifts from it.
const actionsSource = fs.readFileSync(new URL("../../lib/procurement-v23/actions.ts", import.meta.url), "utf8")
const LIVE = new Set([...(actionsSource.match(/export const LIVE_ACTIONS = \[([\s\S]*?)\] as const/)?.[1] || "").matchAll(/"([^"]+)"/g)].map((m) => m[1]))
if (LIVE.size < 10) throw new Error("could not read LIVE_ACTIONS from lib/procurement-v23/actions.ts")

const CONSOLE_NOISE = /Download the React DevTools|\[HMR\]|\[Fast Refresh\]|Failed to load resource/
const MAX_PER_PAGE = 70
const MAX_INNER = 10
// Page chrome repeated on every page: operated once per persona, not once per page.
const SHARED = /^(toggle-sidebar|apply-filters|reset-filters|activity-menu|new-menu|apps-launcher|search|select:(FY|All categories|All statuses|USD|period|category|status|currency)|nav:)/
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60)
const q = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
const recordish = (id) => /\d{3,}|^c[a-z0-9]{20,}$/i.test(id)
const isLiveWrite = (c) => c.kind === "action" && LIVE.has(c.action)
// A modal's identity without the record it was opened for.
const modalKind = (title) => String(title || "").replace(/\b[A-Z]{2,}[-_]?\d[\w-]*/g, "#").replace(/\d{3,}/g, "#")

/** In the page: visible controls, overlay titles, toasts, and a signature of what is on screen. */
function SNAP() {
  const vis = (el) => {
    if (el.closest('[aria-hidden="true"]')) return false
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const s = getComputedStyle(el)
    return s.visibility !== "hidden" && s.display !== "none"
  }
  const clean = (s, n = 80) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n)
  const where = (el) => (el.closest("#modalLayer") ? "modal" : el.closest("#drawerLayer") ? "drawer" : "page")
  const root = document.querySelector(".procurement-v23-root")
  const toastEls = [...document.querySelectorAll("#toasts .toast, [data-sonner-toast]")]
  let text = [root, document.querySelector("#modalLayer.open"), document.querySelector("#drawerLayer.open")]
    .filter(Boolean).map((el) => el.innerText).join("\n")
  for (const t of toastEls) text = text.replace(t.innerText, "")
  const fields = [...document.querySelectorAll("input, select, textarea")].filter(vis)
  text += fields.map((f) => `${f.name}=${f.value}`).join("|")
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0

  const controls = []
  const seen = new Set()
  const add = (el, c) => {
    if (seen.has(el) || !vis(el)) return
    if (!root?.contains(el) && !el.closest("#modalLayer, #drawerLayer, [role=menu], [class*=menu]")) return
    seen.add(el)
    controls.push({ ...c, where: where(el), disabled: Boolean(el.disabled || el.getAttribute("aria-disabled") === "true") })
  }
  for (const el of document.querySelectorAll("[data-action]"))
    add(el, { kind: "action", action: el.dataset.action, id: el.dataset.id || "", label: clean(el.innerText || el.getAttribute("aria-label") || el.title, 50) })
  for (const el of document.querySelectorAll("[data-page]:not([data-action])"))
    add(el, { kind: "nav", action: `nav:${el.dataset.page}`, id: el.dataset.page, label: clean(el.querySelector(".nav-label")?.textContent || el.innerText || el.getAttribute("aria-label"), 40) })
  for (const el of document.querySelectorAll("button:not([data-action]):not([data-page])")) {
    const label = clean(el.innerText || el.getAttribute("aria-label") || el.title, 40)
    if (label) add(el, { kind: "button", action: `button:${label}`, id: "", label })
  }
  for (const el of document.querySelectorAll("select:not([data-action])"))
    if (el.options.length > 1) add(el, { kind: "select", action: `select:${el.name || el.id || clean(el.options[0]?.text, 20)}`, id: el.name || el.id || "", label: clean(el.options[0]?.text, 30) })
  for (const el of document.querySelectorAll('input[type=search], input[placeholder*="earch"]'))
    add(el, { kind: "search", action: `search:${el.name || el.placeholder}`, id: el.name || "", label: clean(el.placeholder, 40) })

  return {
    url: location.pathname + location.search,
    hash,
    modal: document.querySelector("#modalLayer.open") ? clean(document.querySelector("#modalTitle")?.textContent) || "(untitled)" : null,
    drawer: document.querySelector("#drawerLayer.open") ? clean(document.querySelector("#drawerTitle")?.textContent) || "(untitled)" : null,
    controls,
    toasts: toastEls.map((t) => clean(t.innerText, 220)),
  }
}

/** In the page: what a person reads on it. */
function CENSUS(markers) {
  const vis = (el) => {
    if (el.closest('[aria-hidden="true"]')) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"
  }
  const clean = (s, n = 80) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n)
  const root = document.querySelector(".procurement-v23-root")
  const text = root?.innerText || ""
  return {
    heading: [...(root?.querySelectorAll("h1, h2") || [])].filter(vis).map((h) => clean(h.innerText)).find(Boolean) || null,
    nav: [...document.querySelectorAll("[data-page]")].filter(vis).filter((e) => e.querySelector(".nav-label")).map((e) => {
      const count = clean(e.querySelector(".nav-count")?.textContent, 8)
      return `${e.dataset.page}${count ? `(${count})` : ""}`
    }),
    kpis: [...(root?.querySelectorAll(".kpi") || [])].filter(vis).map((k) => `${clean(k.querySelector(".kpi-label")?.textContent, 40)} = ${clean(k.querySelector(".kpi-value")?.textContent, 30)}${k.querySelector(".kpi-sub, .kpi-meta, small") ? ` (${clean(k.querySelector(".kpi-sub, .kpi-meta, small").textContent, 60)})` : ""}`),
    tables: [...(root?.querySelectorAll("table") || [])].filter(vis).map((t) => ({
      head: [...t.querySelectorAll("thead th")].map((th) => clean(th.innerText, 30)),
      rows: t.querySelectorAll("tbody tr").length,
      first: [...t.querySelectorAll("tbody tr")].slice(0, 3).map((tr) => clean(tr.innerText, 200)),
    })),
    empties: [...(root?.querySelectorAll('[class*="empty"]') || [])].filter(vis).map((e) => clean(e.innerText, 140)).filter(Boolean).slice(0, 8),
    notices: [...(root?.querySelectorAll(".notice, .alert, [role=alert], .banner") || [])].filter(vis).map((e) => clean(e.innerText, 180)).filter(Boolean).slice(0, 8),
    demo: markers.filter((m) => text.includes(m)),
    suspectText: [...new Set(text.match(/\b(undefined|NaN|\[object Object\]|Invalid Date|null)\b/g) || [])],
    textLength: text.length,
  }
}

/** In the page: the open modal or drawer — its fields, buttons and text. */
function OVERLAY() {
  const vis = (el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"
  }
  const clean = (s, n = 80) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n)
  const layer = document.querySelector("#modalLayer.open") || document.querySelector("#drawerLayer.open")
  if (!layer) return null
  return {
    fields: [...layer.querySelectorAll("input, select, textarea")].filter(vis).map((f) => ({
      name: f.name || f.id || "",
      type: f.tagName === "INPUT" ? f.type : f.tagName.toLowerCase(),
      required: f.required,
      label: clean(f.labels?.[0]?.innerText || f.closest("label")?.innerText || f.getAttribute("aria-label") || f.placeholder, 50),
      value: f.type === "file" ? "" : clean(f.value, 40),
      options: f.tagName === "SELECT" ? [...f.options].slice(0, 6).map((o) => clean(o.text, 30)) : undefined,
    })),
    buttons: [...layer.querySelectorAll("[data-action], button")].filter(vis).map((b) => `${b.dataset.action || "button"}: ${clean(b.innerText, 40)}`),
    text: clean(layer.innerText, 900),
    suspectText: [...new Set(layer.innerText.match(/\b(undefined|NaN|\[object Object\]|Invalid Date|null)\b/g) || [])],
  }
}

async function locate(page, c) {
  if (c.kind === "action") {
    // A control in a form is looked for in that form. The page behind it can carry the same action (a card's
    // Delegate under the approval modal), and that one is covered, so clicking it timed out.
    const scope = c.where === "modal" ? "#modalLayer.open " : c.where === "drawer" ? "#drawerLayer.open " : ""
    const all = page.locator(`${scope}[data-action=${q(c.action)}]${c.id ? `[data-id=${q(c.id)}]` : ""} >> visible=true`)
    // Several controls can share an action (a backdrop, an ×, a Cancel); aim at the labelled one.
    if (c.label) {
      const labelled = all.filter({ hasText: c.label })
      if (await labelled.count()) return labelled.first()
    }
    return all.first()
  }
  if (c.kind === "nav") return page.locator(`[data-page=${q(c.id)}]:not([data-action]) >> visible=true`).first()
  if (c.kind === "button") return page.locator("button:not([data-action]):not([data-page]) >> visible=true").filter({ hasText: c.label }).first()
  // A select is named in one form and only id'd in another (docOwnerV11); either identifies it.
  if (c.kind === "select") return page.locator(`${c.id ? `:is(select[name=${q(c.id)}], select[id=${q(c.id)}])` : "select"}:not([data-action]) >> visible=true`).first()
  return page.locator('input[type=search], input[placeholder*="earch"]').locator("visible=true").first()
}

async function operate(page, c) {
  const el = await locate(page, c)
  if (c.kind === "select") {
    const count = await el.evaluate((s) => s.options.length)
    return el.selectOption({ index: Math.min(1, count - 1) }, { timeout: 5000 })
  }
  if (c.kind === "search") {
    await el.fill("zz-no-such-record", { timeout: 5000 })
    return el.press("Enter")
  }
  // Scrolled into view first: a row actions menu closes on scroll, and the click's own scroll closed it as it opened.
  await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(120)
  return el.click({ timeout: 5000 })
}

/** One entry per distinct control: tabs and filters by id, row buttons once per action. */
function distinct(controls) {
  const map = new Map()
  for (const c of controls) {
    const key = c.kind !== "action" || !c.id || recordish(c.id) ? `${c.where}|${c.action}` : `${c.where}|${c.action}|${c.id}`
    const kept = map.get(key)
    if (!kept) map.set(key, { ...c, count: 1 })
    else if (!kept.label && c.label) map.set(key, { ...c, count: kept.count + 1 })
    else kept.count++
  }
  return [...map.values()]
}

const browser = await chromium.launch({ headless: true })
const clicked = new Set()
const results = { tag: TAG, base: staff.base, started: new Date().toISOString(), live: [...LIVE], personas: [] }
const save = () => fs.writeFileSync(path.join(OUT, `explore-${TAG}.json`), JSON.stringify(results, null, 2))

for (const [email, role] of USERS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  await seedAuth(context, staff.base, email, staff.portal)
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  const w = { errors: [], api: [], downloads: [], dialogs: [], popups: [] }
  const reset = () => { for (const k of Object.keys(w)) w[k] = [] }
  page.on("pageerror", (e) => w.errors.push(`pageerror: ${String(e.message || e).split("\n")[0].slice(0, 220)}`))
  page.on("console", (m) => { if (m.type() === "error" && !CONSOLE_NOISE.test(m.text())) w.errors.push(`console: ${m.text().split("\n")[0].slice(0, 220)}`) })
  page.on("response", (r) => {
    const u = r.url()
    if (/\/api\//.test(u) && !/_next/.test(u)) w.api.push({ method: r.request().method(), path: u.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, ""), status: r.status() })
  })
  page.on("requestfailed", (r) => {
    // "requestfailed" hands over the Request itself (no .request()); calling it crashed the census whenever a call
    // failed, as it did while the dev API container was being recreated.
    if (/\/api\//.test(r.url())) w.api.push({ method: r.method(), path: r.url().replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, ""), status: `failed ${r.failure()?.errorText || ""}` })
  })
  page.on("download", (d) => w.downloads.push(d.suggestedFilename()))
  page.on("dialog", (d) => { w.dialogs.push(`${d.type()}: ${d.message().slice(0, 160)}`); d.dismiss().catch(() => {}) })
  context.on("page", async (p) => {
    if (p === page) return
    await p.waitForLoadState("domcontentloaded").catch(() => {})
    w.popups.push(p.url())
    await p.close().catch(() => {})
  })

  let base = null
  async function load(route) {
    await page.goto(staff.base + route, { waitUntil: "domcontentloaded", timeout: 90000 })
    await page.waitForSelector(".procurement-v23-root", { timeout: 60000 })
    await page.waitForFunction(() => Boolean(window.__pr23Live && window.__pr23Live.access), null, { timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(800)
  }
  /** Back to the page as it loaded: close an overlay the cheap way, reload only if that is not enough. */
  async function clean(route) {
    let now = await page.evaluate(SNAP).catch(() => null)
    if (now && base && now.url === base.url && (now.modal || now.drawer)) {
      const close = page.locator(':is(#modalLayer.open, #drawerLayer.open) [data-action="close-overlay"] >> visible=true').filter({ hasText: /×|Cancel|Close/ }).first()
      if (await close.count().catch(() => 0)) await close.click({ timeout: 2000 }).catch(() => {})
      else await page.keyboard.press("Escape").catch(() => {})
      await page.waitForTimeout(250)
      now = await page.evaluate(SNAP).catch(() => null)
    }
    if (!now || !base || now.url !== base.url || now.modal || now.drawer || now.hash !== base.hash) await load(route)
  }

  async function probe(route, chain, pid) {
    const target = chain[chain.length - 1]
    const out = { kind: target.kind, action: target.action, id: target.id, label: target.label, where: target.where, count: target.count, path: chain.map((c) => c.action), effect: [] }
    try {
      await clean(route)
      for (const c of chain.slice(0, -1)) {
        await operate(page, c)
        await page.waitForTimeout(450)
      }
      const before = await page.evaluate(SNAP)
      // A tab or view that is already the selected one has nothing to change.
      const wasSelected =
        target.kind === "action" &&
        (await (await locate(page, target))
          .evaluate((el) => el.classList.contains("active") || el.getAttribute("aria-selected") === "true" || el.getAttribute("aria-pressed") === "true")
          .catch(() => false))
      reset()
      await operate(page, target)
      if (target.kind === "nav") await page.waitForFunction((p) => location.pathname !== p, before.url.split("?")[0], { timeout: 4000 }).catch(() => {})
      // A refusal or an API round trip can take over a second to raise its toast; a shorter wait
      // reported working controls as having no visible effect.
      await page.waitForTimeout(900)
      await page.waitForSelector("[data-sonner-toast], #toasts .toast, #modalLayer.open, #drawerLayer.open", { timeout: 1200 }).catch(() => {})
      const after = await page.evaluate(SNAP)
      const had = new Set(before.controls.map((c) => `${c.where}|${c.action}|${c.id}`))
      if (after.url !== before.url) out.effect.push(`navigates to ${after.url}`)
      const opened = (after.modal && after.modal !== before.modal) || (after.drawer && after.drawer !== before.drawer)
      if (after.modal && after.modal !== before.modal) out.effect.push(`opens modal "${after.modal}"`)
      if (after.drawer && after.drawer !== before.drawer) out.effect.push(`opens drawer "${after.drawer}"`)
      if (!after.modal && before.modal) out.effect.push("closes the modal")
      if (!after.drawer && before.drawer) out.effect.push("closes the drawer")
      // Counted, not matched by text: a second identical refusal while the first is still showing is a refusal too.
      const shown = new Map()
      for (const t of before.toasts) shown.set(t, (shown.get(t) || 0) + 1)
      for (const t of after.toasts) {
        if (shown.get(t)) shown.set(t, shown.get(t) - 1)
        else out.effect.push(`toast "${t}"`)
      }
      for (const d of w.downloads) out.effect.push(`download ${d}`)
      for (const p of w.popups) out.effect.push(`new tab ${p}`)
      for (const d of w.dialogs) out.effect.push(`dialog ${d}`)
      for (const a of w.api) out.effect.push(`${/^(GET|HEAD|OPTIONS)$/.test(a.method) ? "api" : "API WRITE"} ${a.method} ${a.path} ${a.status}`)
      if (opened) {
        out.modalKind = modalKind(after.modal || after.drawer)
        out.overlay = await page.evaluate(OVERLAY)
        out.shot = `${slug(email)}--${pid}--${slug(chain.map((c) => c.action + (c.id && !recordish(c.id) ? `-${c.id}` : "")).join("--"))}.png`
        await page.screenshot({ path: path.join(OUT, "shots", out.shot) })
        out.inner = distinct(after.controls.filter((c) => c.where !== "page"))
      } else if (after.url === before.url && target.kind !== "nav") {
        const revealed = after.controls.filter((c) => !had.has(`${c.where}|${c.action}|${c.id}`))
        if (revealed.length > 25) out.effect.push(`re-renders the page (${revealed.length} new controls)`)
        else if (revealed.length && !before.modal && !before.drawer) {
          out.effect.push(`reveals ${revealed.length} control(s): ${[...new Set(revealed.map((r) => r.action))].slice(0, 10).join(", ")}`)
          out.revealed = distinct(revealed)
        }
      }
      if (!out.effect.length && after.hash !== before.hash) out.effect.push("changes the page in place")
      if (!out.effect.length && wasSelected) out.effect.push("already selected")
      if (!out.effect.length) out.effect.push("NO VISIBLE EFFECT")
      for (const e of w.errors) out.effect.push(`ERROR ${e}`)
    } catch (e) {
      out.effect.push(`COULD NOT OPERATE: ${String(e.message || e).split("\n")[0].slice(0, 180)}`)
      for (const x of w.errors) out.effect.push(`ERROR ${x}`)
    }
    return out
  }

  const persona = { email, role, full: FULL.has(email), pages: [] }
  results.personas.push(persona)
  const full = FULL.has(email)
  const mine = new Set()
  // Full personas operate everything once per page, but page chrome and each distinct modal only once.
  const once = (key, shared = false) => {
    const k = shared ? `*|${key}` : key
    if (full ? mine.has(k) && shared : clicked.has(k)) return false
    mine.add(k)
    clicked.add(k)
    return true
  }
  const insideDone = new Set()
  let closeProbed = false

  for (const [pid, route] of PAGES) {
    if (ONLY_PAGES.length && !ONLY_PAGES.includes(pid)) continue
    const pr = { id: pid, route, probes: [] }
    persona.pages.push(pr)
    reset()
    try {
      await load(route)
    } catch (e) {
      pr.renderError = String(e.message || e).split("\n")[0].slice(0, 200)
      pr.url = page.url()
      pr.text = (await page.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => "")).replace(/\s+/g, " ")
      pr.loadErrors = [...w.errors]
      pr.loadApi = w.api.filter((a) => typeof a.status !== "number" || a.status >= 400)
      await page.screenshot({ path: path.join(OUT, "shots", `${slug(email)}--${pid}.png`) }).catch(() => {})
      console.log(`[${TAG}] ${email} ${pid}: RENDER FAILED ${pr.renderError}`)
      save()
      continue
    }
    Object.assign(pr, await page.evaluate(CENSUS, MARKERS))
    pr.url = new URL(page.url()).pathname
    pr.loadErrors = [...w.errors]
    pr.loadApi = w.api.filter((a) => typeof a.status !== "number" || a.status >= 400)
    pr.loadCalls = w.api.length
    pr.shot = `${slug(email)}--${pid}.png`
    await page.screenshot({ path: path.join(OUT, "shots", pr.shot) })
    base = await page.evaluate(SNAP)
    const controls = distinct(base.controls.filter((c) => c.where === "page" && (c.kind !== "nav" || pid === "dashboard")))
    pr.controls = controls.map((c) => `${c.action}${c.id && !recordish(c.id) ? `[${c.id}]` : ""}${c.count > 1 ? ` ×${c.count}` : ""}${c.disabled ? " (disabled)" : ""}`)
    const skip = (c, chain) => ({ kind: c.kind, action: c.action, id: c.id, label: c.label, where: c.where, count: c.count, path: [...chain.map((x) => x.action), c.action], effect: [isLiveWrite(c) ? "live write: tested in the workflows, not clicked here" : "disabled"] })

    for (const c of controls.slice(0, MAX_PER_PAGE)) {
      if (isLiveWrite(c) || c.disabled) { pr.probes.push(skip(c, [])); continue }
      const idPart = c.kind === "action" && c.id && !recordish(c.id) ? c.id : ""
      const shared = SHARED.test(c.action)
      const key = `${shared ? "" : pid}|${c.action}|${idPart}`
      if (!once(key, shared)) continue
      const p = await probe(route, [c], pid)
      pr.probes.push(p)
      if (p.modalKind) {
        if (insideDone.has(p.modalKind)) continue
        insideDone.add(p.modalKind)
      }
      for (const item of [...(p.revealed || []), ...(p.inner || [])].slice(0, MAX_INNER)) {
        if (item.kind === "nav" || item.action === "row-actions-v16") continue
        if (item.action === "close-overlay") {
          if (closeProbed) continue
          closeProbed = true
        }
        if (isLiveWrite(item) || item.disabled) { pr.probes.push(skip(item, [c])); continue }
        if (!once(`${key}>${item.action}|${item.id && !recordish(item.id) ? item.id : ""}`)) continue
        pr.probes.push(await probe(route, [c, item], pid))
      }
    }
    const flagged = pr.probes.filter((p) => p.effect.some((e) => /^(NO VISIBLE|COULD NOT|ERROR|API WRITE)/.test(e))).length
    const blankKpis = (pr.kpis || []).filter((k) => /No live source/i.test(k)).length
    console.log(`[${TAG}] ${email} ${pid}: ${pr.tables?.length ?? 0} table(s), ${pr.kpis?.length ?? 0} KPI(s) (${blankKpis} without a source), ${pr.probes.length} probe(s), ${flagged} flagged, load errors ${pr.loadErrors.length}, failed calls ${pr.loadApi.length}`)
    save()
  }
  await context.close()
}

results.finished = new Date().toISOString()
save()
await browser.close()
console.log(`[${TAG}] done -> ${path.join(OUT, `explore-${TAG}.json`)}`)
