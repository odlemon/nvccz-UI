/**
 * Requisition approval routing, end to end on dev (SRD §3 approval rules, §4 System Administrator, §6.2 notification).
 *
 *   NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api BASE=https://dev.matanho.com UAT_LOAD_TIMEOUT_MS=180000 \
 *     node scripts/_uat/procurement-v23-approval-route.mjs
 *
 * The CFO sets a two-level route in Configuration, Approval matrix, through the UI: the head of the requester's
 * department, then the Finance Manager above $10,000. Then, as the people involved:
 *   A. a $12,500 requisition needs both levels. The Finance Manager cannot decide it first; the department head's
 *      approval moves it to the Finance Manager (who is told), and the Finance Manager's approval completes it.
 *   B. an $800 requisition needs one level; the department head's approval completes it.
 *   C. a $15,000 requisition approved at step 1 and rejected at step 2 ends rejected, with the reason.
 * Plus the refusals (a role nobody holds, an amount on step 1, a non-administrator saving), the route in the review
 * modal and on the requester's own view, the motivation document built from the record, the notifications at each
 * step, and the original route restored at the end. Test requisitions are titled "UAT approval route ..." and are
 * removed by dev_cleanup_procurement.mjs.
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { API, seedAuth } from "./_routes.mjs"

const BASE = process.env.BASE || "https://dev.matanho.com"
const LOAD = Number(process.env.UAT_LOAD_TIMEOUT_MS || 180000)
const OUT = path.resolve(process.env.OUT || ".procurement-approval-route")
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (ok, what, detail = "") => {
  results.push(Boolean(ok))
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}

async function login(email) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "admin123", portal: "staff" }),
  })
  const j = await r.json().catch(() => ({}))
  const token = j.token || j?.data?.token
  if (!token) throw new Error(`${email} could not sign in (${r.status})`)
  const user = j.user || j?.data?.user || {}
  return { email, id: user.id, auth: { Authorization: `Bearer ${token}` } }
}
async function api(method, p, who, body) {
  const r = await fetch(API + p, {
    method,
    headers: { ...who.auth, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await r.json().catch(() => ({}))
  return { status: r.status, json, data: json?.data }
}
const list = (res) => (Array.isArray(res.data) ? res.data : Array.isArray(res.json) ? res.json : Object.values(res.data ?? {}).find(Array.isArray) ?? [])
async function notifications(who) {
  return list(await api("GET", "/homepage/notifications?limit=100", who))
}
const notified = (rows, type, entityId, extra = () => true) =>
  rows.some((n) => n.type === type && (n.relatedEntityId === entityId || n.data?.requisitionId === entityId) && extra(n))

const cfo = await login("proc.cfo@nts.local")
const requester = await login("proc.requester@nts.local")
const head = await login("perf.deptmgr@nts.local")
const finmgr = await login("payroll.finmgr@nts.local")

const toInput = (s) => ({ kind: s.kind, department: s.department, deputy: s.deputy, roleCode: s.roleCode, userId: s.userId, aboveAmount: s.aboveAmount })
const original = await api("GET", "/procurement/approval-matrix", cfo)
check(original.status === 200 && original.data?.canEdit === true, "the CFO reads the matrix and may change it", `${original.status}`)
const originalSteps = (original.data?.steps ?? []).map(toInput)
console.log(`route before the test: ${(original.data?.steps ?? []).map((s) => s.name).join(" -> ") || "none"}`)

const browser = await chromium.launch()
const waitForText = async (page, re, timeout = LOAD) =>
  page.waitForFunction((src) => new RegExp(src, "i").test(document.body.innerText), re.source, { timeout }).then(() => true).catch(() => false)
async function openAs(who, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await seedAuth(context, BASE, who.email, "staff")
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message || e)))
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: LOAD })
  await page.waitForSelector("#nav .nav-item", { timeout: LOAD })
  return { context, page, errors }
}

const created = {}
try {
  // ------------------------------------------------------------------ refusals on the matrix
  console.log("\n== the matrix refuses what cannot work")
  const readOnly = await api("GET", "/procurement/approval-matrix", requester)
  check(readOnly.status === 200 && readOnly.data?.canEdit === false && (readOnly.data?.people ?? []).length === 0, "a requester reads the route but cannot change it, and is not given the staff list")
  const notAdmin = await api("PUT", "/procurement/approval-matrix", head, { steps: [{ kind: "DEPARTMENT_HEAD" }] })
  check(notAdmin.status === 403, "a department head cannot save the matrix", `${notAdmin.status} ${notAdmin.json?.message ?? ""}`)
  const nobody = await api("PUT", "/procurement/approval-matrix", cfo, { steps: [{ kind: "DEPARTMENT_HEAD" }, { kind: "ROLE", roleCode: "NO_SUCH_ROLE", aboveAmount: 100 }] })
  check(nobody.status === 400 && /nobody holds/i.test(nobody.json?.message ?? ""), "a step nobody could decide is refused", nobody.json?.message)
  const firstAmount = await api("PUT", "/procurement/approval-matrix", cfo, { steps: [{ kind: "DEPARTMENT_HEAD", aboveAmount: 5 }] })
  check(firstAmount.status === 400 && /Step 1 applies to every requisition/i.test(firstAmount.json?.message ?? ""), "step 1 cannot carry an amount", firstAmount.json?.message)
  const unchanged = await api("GET", "/procurement/approval-matrix", cfo)
  check(JSON.stringify((unchanged.data?.steps ?? []).map(toInput)) === JSON.stringify(originalSteps), "refused saves change nothing")

  // ------------------------------------------------------------------ the CFO sets the route in the UI
  console.log("\n== the CFO sets a two-level route in Configuration, Approval matrix")
  {
    const { context, page, errors } = await openAs(cfo, "/procurement-v23/settings")
    await page.waitForFunction(() => document.querySelector('[data-action="settings-tab"][data-id="approvals"]'), null, { timeout: LOAD })
    await page.waitForTimeout(3000)
    await page.locator('[data-action="settings-tab"][data-id="approvals"]').first().click()
    check(await waitForText(page, /Requisition approval route/, 60000), "the Approval matrix tab shows the route")
    await page.locator('[data-action="edit-approval-matrix-v23"]').first().click()
    await page.waitForSelector("#approvalMatrixFormV23", { timeout: 60000 })
    const rows = page.locator("#approvalMatrixFormV23 [data-matrix-step]")
    while ((await rows.count()) > 1) await rows.last().locator('[data-action="remove-matrix-step-v23"]').click()
    const first = rows.first()
    await first.locator('[name="kind"]').selectOption("DEPARTMENT_HEAD")
    await first.locator('[name="department"]').selectOption("")
    await first.locator('[name="deputy"]').selectOption("HEAD")
    check(await first.locator('[name="aboveAmount"]').isDisabled(), "step 1's amount is locked: it applies to every requisition")
    await page.locator('[data-action="add-matrix-step-v23"]').click()
    const second = rows.nth(1)
    await second.locator('[name="kind"]').selectOption("ROLE")
    check(await second.locator('[name="roleCode"]').isVisible(), "choosing Role shows the role list")
    await second.locator('[name="roleCode"]').selectOption("FIN_MGR")
    await second.locator('[name="aboveAmount"]').fill("10000")
    await page.screenshot({ path: path.join(OUT, "matrix-editor.png"), fullPage: true })
    await page.locator('[data-action="save-approval-matrix-v23"]').click()
    check(await waitForText(page, /Approval route saved with 2 steps/, 90000), "saving says the route was saved")
    check(await waitForText(page, /Only above \$10,000\.00/, LOAD), "the route shows the Finance Manager step above $10,000.00")
    await page.screenshot({ path: path.join(OUT, "matrix-saved.png"), fullPage: true })
    check(errors.length === 0, "no page errors while editing", errors.slice(0, 2).join(" | "))
    await context.close()
  }
  const saved = await api("GET", "/procurement/approval-matrix", cfo)
  const [s1, s2] = saved.data?.steps ?? []
  check(
    saved.data?.steps?.length === 2 && s1?.kind === "DEPARTMENT_HEAD" && s1?.department === null && s2?.roleCode === "FIN_MGR" && Number(s2?.aboveAmount) === 10000,
    "the saved route is the department head, then the Finance Manager above 10,000",
    (saved.data?.steps ?? []).map((s) => s.name).join(" -> "),
  )

  // ------------------------------------------------------------------ requisitions A, B, C
  console.log("\n== requisitions are routed by their total")
  async function raise(key, qty, unitPrice) {
    const title = `UAT approval route ${key} ${Date.now()}`
    const c = await api("POST", "/procurement/requisitions", requester, {
      title,
      department: "Operations",
      priority: "MEDIUM",
      justification: `UAT approval route test ${key}: ${qty} x ${unitPrice}`,
      items: [{ itemName: `UAT route item ${key}`, quantity: qty, unit: "Each", unitPrice }],
    })
    if (!c.data?.id) throw new Error(`could not raise ${key}: ${c.status} ${c.json?.message ?? ""}`)
    const s = await api("PUT", `/procurement/requisitions/${c.data.id}/submit`, requester)
    created[key] = { id: c.data.id, number: c.data.requisitionNumber, title, submit: s }
    return created[key]
  }
  const A = await raise("A", 5, 2500)
  const B = await raise("B", 4, 200)
  const C = await raise("C", 6, 2500)
  const routeA = A.submit.data?.approvalRoute
  check(A.submit.status === 200 && routeA?.totalSteps === 2 && routeA?.waitingOn?.who === "Head of Operations", "A ($12,500) has two steps and waits on the head of Operations", `${routeA?.totalSteps} step(s), ${routeA?.waitingOn?.who}`)
  check((routeA?.waitingOn?.approvers ?? []).some((p) => p.id === head.id), "the department head is an approver on A's first step")
  check(routeA?.steps?.[1]?.who === "Finance Manager" && routeA?.steps?.[1]?.status === "UPCOMING", "A's second step is the Finance Manager, not yet reached")
  check(B.submit.data?.approvalRoute?.totalSteps === 1, "B ($800) has one step: the Finance Manager step does not apply", `${B.submit.data?.approvalRoute?.totalSteps} step(s)`)

  const headNotes = await notifications(head)
  check(notified(headNotes, "PROCUREMENT_REQUISITION_APPROVAL", A.id) && notified(headNotes, "PROCUREMENT_REQUISITION_APPROVAL", B.id), "the department head is told A and B need approval")
  check(!notified(await notifications(finmgr), "PROCUREMENT_REQUISITION_APPROVAL", A.id), "the Finance Manager is not told about A before step 1 is decided")

  const finQueue = list(await api("GET", "/procurement/requisitions/pending-approval", finmgr)).map((r) => r.id)
  check(!finQueue.includes(A.id) && !finQueue.includes(B.id), "neither is in the Finance Manager's queue yet")
  const early = await api("PUT", `/procurement/requisitions/${A.id}/approve`, finmgr)
  check(early.status >= 400 && /still at step 1 of 2/i.test(early.json?.message ?? ""), "the Finance Manager cannot approve A before the department head", early.json?.message)

  // ------------------------------------------------------------------ the department head decides step 1
  console.log("\n== the department head approves A and B from the Approval Centre")
  {
    const { context, page, errors } = await openAs(head, "/procurement-v23/requisitions")
    await page.waitForTimeout(3000)
    const setView = page.locator('[data-action="set-pr-view-v11"][data-id="approver"]')
    if (await setView.count()) await setView.first().click()
    const review = page.locator(`[data-action="review-pr-v11"][data-id="${A.number}"]`)
    await review.first().waitFor({ timeout: LOAD })
    await review.first().click()
    check(await waitForText(page, /Approval route/, 30000), "the review modal shows A's approval route")
    const modalText = await page.evaluate(() => document.body.innerText)
    check(/Waiting on step 1 of 2: Head of Operations/.test(modalText) && /Above \$10,000\.00/.test(modalText), "the route says where A waits and that step 2 applies above $10,000.00")
    await page.screenshot({ path: path.join(OUT, "review-route-step1.png"), fullPage: true })
    await page.keyboard.press("Escape")
    await context.close()
  }
  {
    const { context, page, errors } = await openAs(head, "/procurement-v23/approvals")
    const cardA = page.locator(".approval-prompt-v6", { hasText: A.number })
    await cardA.first().waitFor({ timeout: LOAD })
    check(/Step 1 of 2 · Head of Operations/.test(await cardA.first().innerText()), "A's card says it is step 1 of 2, decided by the head of Operations")
    await page.locator(`[data-action="approve-prompt-v6"][data-id="PR-${A.number}"]`).first().click()
    check(await waitForText(page, new RegExp(`${A.number} approved at your step\\. It now waits for step 2 of 2, Finance Manager`), 90000), "approving A says it now waits for the Finance Manager")
    const cardB = page.locator(`[data-action="approve-prompt-v6"][data-id="PR-${B.number}"]`)
    await cardB.first().waitFor({ timeout: LOAD })
    await cardB.first().click()
    check(await waitForText(page, new RegExp(`${B.number} approved\\.`), 90000), "approving B says it is approved")
    check(errors.length === 0, "no page errors in the Approval Centre", errors.slice(0, 2).join(" | "))
    await context.close()
  }
  const reqById = async (who, id) => list(await api("GET", "/procurement/requisitions", who)).find((r) => r.id === id)
  const aAfter1 = await reqById(cfo, A.id)
  const bAfter = await reqById(cfo, B.id)
  check(aAfter1?.status === "PENDING_APPROVAL" && aAfter1?.approvalRoute?.steps?.[0]?.status === "APPROVED" && aAfter1?.approvalRoute?.steps?.[0]?.decidedById === head.id, "A is still pending, with step 1 approved by the department head", `${aAfter1?.status}`)
  check(aAfter1?.approvalRoute?.waitingOn?.who === "Finance Manager", "A now waits on the Finance Manager")
  check(bAfter?.status === "APPROVED" && bAfter?.approvedById === head.id, "B is approved, by the department head", `${bAfter?.status}`)
  check(notified(await notifications(finmgr), "PROCUREMENT_REQUISITION_APPROVAL", A.id), "the Finance Manager is told A needs approval")
  const reqNotes = await notifications(requester)
  check(notified(reqNotes, "PROCUREMENT_REQUISITION_DECISION", A.id, (n) => n.data?.outcome === "STEP_APPROVED" || /step 1 of 2/.test(n.title ?? "")), "the requester is told A passed step 1")
  check(notified(reqNotes, "PROCUREMENT_REQUISITION_DECISION", B.id, (n) => n.data?.outcome === "APPROVED" || /approved$/.test(n.title ?? "")), "the requester is told B is approved")
  const again = await api("PUT", `/procurement/requisitions/${B.id}/approve`, head)
  check(again.status >= 400, "B cannot be approved twice", again.json?.message)

  // ------------------------------------------------------------------ the Finance Manager decides step 2
  console.log("\n== the Finance Manager approves A")
  {
    const { context, page, errors } = await openAs(finmgr, "/procurement-v23/approvals")
    const cardA = page.locator(".approval-prompt-v6", { hasText: A.number })
    await cardA.first().waitFor({ timeout: LOAD })
    check(/Step 2 of 2 · Finance Manager/.test(await cardA.first().innerText()), "A's card says step 2 of 2, the Finance Manager")
    check(/Head of Operations approved it/.test(await cardA.first().innerText()), "the card says the department head approved step 1")
    await page.locator(`[data-action="approve-prompt-v6"][data-id="PR-${A.number}"]`).first().click()
    check(await waitForText(page, new RegExp(`${A.number} approved\\.`), 90000), "approving A says it is approved")
    check(errors.length === 0, "no page errors for the Finance Manager", errors.slice(0, 2).join(" | "))
    await context.close()
  }
  const aDone = await reqById(cfo, A.id)
  check(aDone?.status === "APPROVED" && aDone?.approvedById === finmgr.id && aDone?.approvalRoute?.steps?.every((s) => s.status === "APPROVED"), "A is approved through both steps, last by the Finance Manager", `${aDone?.status}`)
  check(notified(await notifications(requester), "PROCUREMENT_REQUISITION_DECISION", A.id, (n) => n.data?.outcome === "APPROVED"), "the requester is told A is approved")

  // ------------------------------------------------------------------ C: approved at step 1, rejected at step 2
  console.log("\n== C is approved at step 1 and rejected at step 2")
  const c1 = await api("PUT", `/procurement/requisitions/${C.id}/approve`, head)
  check(c1.status === 200 && c1.data?.status === "PENDING_APPROVAL", "the department head approves C's step 1", c1.json?.message)
  const reason = "UAT route: over the quarter's budget"
  const c2 = await api("PUT", `/procurement/requisitions/${C.id}/reject`, finmgr, { rejectionReason: reason })
  check(c2.status === 200 && c2.data?.status === "REJECTED", "the Finance Manager rejects C at step 2", c2.json?.message)
  const cDone = await reqById(cfo, C.id)
  check(cDone?.rejectionReason === reason && cDone?.approvalRoute?.steps?.[1]?.status === "REJECTED" && cDone?.approvalRoute?.steps?.[1]?.comments === reason, "C is rejected with the reason on step 2")
  check(notified(await notifications(requester), "PROCUREMENT_REQUISITION_DECISION", C.id, (n) => n.data?.outcome === "REJECTED"), "the requester is told C was rejected")

  // ------------------------------------------------------------------ the requester's view
  console.log("\n== the requester sees the route and the motivation document from the record")
  {
    const { context, page, errors } = await openAs(requester, "/procurement-v23/requisitions")
    const view = page.locator(`[data-action="view-pr-v11"][data-id="${A.number}"]`)
    await view.first().waitFor({ timeout: LOAD })
    await view.first().click()
    check(await waitForText(page, /Approved through all 2 steps/, 30000), "the requester's view says A was approved through both steps")
    await page.screenshot({ path: path.join(OUT, "requester-route.png"), fullPage: true })
    const preview = page.locator(`[data-action="preview-doc-v11"][data-id="MOT-${A.number}"]`)
    await preview.first().click()
    check(await waitForText(page, /UAT approval route test A: 5 x 2500/, 30000), "the motivation document carries the requester's own justification")
    const docText = await page.evaluate(() => document.body.innerText)
    check(!/01 Aug 2026/.test(docText) && !/continuity of operations/i.test(docText), "and none of the template's date or stock justification")
    await page.screenshot({ path: path.join(OUT, "motivation-document.png"), fullPage: true })
    await page.goto(`${BASE}/procurement-v23/settings`, { waitUntil: "domcontentloaded", timeout: LOAD })
    await page.waitForFunction(() => document.querySelector('[data-action="settings-tab"][data-id="approvals"]'), null, { timeout: LOAD })
    await page.locator('[data-action="settings-tab"][data-id="approvals"]').first().click()
    check(await waitForText(page, /Only an administrator or the Chief Financial Officer can change the route/, 30000), "the requester reads the matrix and is told who can change it")
    check((await page.locator('[data-action="edit-approval-matrix-v23"]').count()) === 0, "the requester has no Edit route button")
    check(errors.length === 0, "no page errors for the requester", errors.slice(0, 2).join(" | "))
    await context.close()
  }
} catch (e) {
  check(false, "the run finished", String(e?.message || e))
} finally {
  // ------------------------------------------------------------------ restore the route
  console.log("\n== restoring the route")
  const restore = await api("PUT", "/procurement/approval-matrix", cfo, { steps: originalSteps.length ? originalSteps : [{ kind: "DEPARTMENT_HEAD" }] })
  check(restore.status === 200, "the original route is restored", (restore.data?.steps ?? []).map((s) => s.name).join(" -> ") || restore.json?.message)
  await browser.close()
  console.log(`test requisitions: ${Object.values(created).map((c) => c.number).join(", ") || "none"} (remove with dev_cleanup_procurement.mjs --apply)`)
}

const passed = results.filter(Boolean).length
console.log(`=== RESULT === ${passed}/${results.length} checks passed`)
console.log(`screenshots in ${OUT}`)
process.exit(passed === results.length ? 0 : 1)
