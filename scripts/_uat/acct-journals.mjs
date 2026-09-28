// Journals and periods through the API, as the roles that do the work: a preparer (Accountant), an approver (Finance
// Manager), the CFO, and someone outside finance. Covers maker-checker, drafts (edit, discard), posting, void with a
// reversing entry, closed periods, journals raised for other records, and the fiscal calendar itself.
// Fixtures: references "UATJ-…"; August 2026 is locked and reopened for the closed-period checks.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UATJ-${Date.now() % 100000}`
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body, attempt = 0) => {
  let r
  try { r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }) } catch (e) { if (method === "GET" && attempt < 2) return call(u, method, path, body, attempt + 1); throw e }
  let j = null; try { j = await r.json() } catch {}
  return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message) }
}
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const status = (id) => q(`return (await p.journalEntry.findUnique({where:{id:${J(id)}},select:{status:true}}))?.status`)

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id
const je = (u, over = {}) => call(u, "POST", "/accounting/journal-entries", { transactionDate: over.date || new Date().toISOString().slice(0, 10), referenceNumber: `${tag}-${Math.random().toString(36).slice(2, 6)}`, description: `${tag} ${over.d || "test journal"}`, currencyId: USD, journalEntryLines: over.lines || [{ chartOfAccountId: A("5090"), debitAmount: 120, creditAmount: 0, description: "supplies" }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 120, description: "paid" }] })
const idOf = (r) => r.data && (r.data.id || (r.data.journalEntry && r.data.journalEntry.id))
const made = [], stiMade = []
let lockedAug = false

try {
  // ---------------------------------------------------------------- the calendar
  const overlaps = q(`return (await p.$queryRawUnsafe("SELECT COUNT(*) AS n FROM fiscal_periods a JOIN fiscal_periods b ON a.id < b.id AND a.start_date <= b.end_date AND b.start_date <= a.end_date"))[0].n.toString()`)
  check("calendar: every day belongs to exactly one fiscal period", overlaps === "0", overlaps)

  // ---------------------------------------------------------------- drafts
  const d1 = await je(acct); made.push(idOf(d1))
  check("a preparer raises a balanced journal; it is saved as a draft", d1.status < 300 && status(idOf(d1)) === "PENDING", `${d1.status} ${d1.err}`)
  const bad = await je(acct, { lines: [{ chartOfAccountId: A("5090"), debitAmount: 120, creditAmount: 0 }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 100 }] })
  check("an unbalanced journal is refused", bad.status >= 400, `${bad.status}`)
  const future = await je(acct, { date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) })
  if (idOf(future)) made.push(idOf(future))
  check("[finding] a journal dated in the future is refused", future.status >= 400, `${future.status} ${future.err}`)
  const noEmp = await je(emp)
  check("someone outside finance cannot raise a journal", noEmp.status === 403, String(noEmp.status))
  const full = (id, over) => { const r = q(`const j=await p.journalEntry.findUnique({where:{id:${J(id)}}});return {transactionDate:j.transactionDate.toISOString().slice(0,10),referenceNumber:j.referenceNumber,description:j.description,currencyId:j.currencyId}`); return { ...r, ...over } }
  const byOther = await call(fm, "PATCH", `/accounting/journal-entries/${idOf(d1)}`, full(idOf(d1), { description: "changed by the approver", journalEntryLines: [{ chartOfAccountId: A("5090"), debitAmount: 999, creditAmount: 0 }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 999 }] }))
  check("[finding] an approver cannot change someone else's draft (and then post it)", byOther.status >= 400 && q(`return Number((await p.journalEntry.findUnique({where:{id:${J(idOf(d1))}}})).totalAmount)`) === 120, `${byOther.status} ${byOther.err}`)
  const ed = await call(acct, "PATCH", `/accounting/journal-entries/${idOf(d1)}`, { ...full(idOf(d1)), description: `${tag} edited`, journalEntryLines: [{ chartOfAccountId: A("5090"), debitAmount: 150, creditAmount: 0 }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 150 }] })
  check("the preparer corrects the draft", ed.status < 300 && q(`return Number((await p.journalEntry.findUnique({where:{id:${J(idOf(d1))}}})).totalAmount)`) === 150, `${ed.status} ${ed.err}`)

  // ---------------------------------------------------------------- maker-checker
  const selfPost = await call(acct, "PATCH", `/accounting/journal-entries/${idOf(d1)}/post`, {})
  check("a preparer cannot post", selfPost.status === 403, String(selfPost.status))
  const c1 = await je(cfo); made.push(idOf(c1))
  const cfoSelf = await call(cfo, "PATCH", `/accounting/journal-entries/${idOf(c1)}/post`, {})
  check("[finding] an approver, the CFO included, cannot post a journal they prepared", cfoSelf.status >= 400 && status(idOf(c1)) === "PENDING", `${cfoSelf.status} ${cfoSelf.err}`)
  const post = await call(fm, "PATCH", `/accounting/journal-entries/${idOf(d1)}/post`, {})
  check("another approver posts it", post.status < 300 && status(idOf(d1)) === "POSTED", `${post.status} ${post.err}`)
  const editPosted = await call(acct, "PATCH", `/accounting/journal-entries/${idOf(d1)}`, { description: "changed after posting" })
  check("a posted journal cannot be edited", editPosted.status >= 400, String(editPosted.status))

  // ---------------------------------------------------------------- discard and reject
  const d2 = await je(acct); made.push(idOf(d2))
  const other = await call(await login("acct.officer@nts.local"), "POST", `/accounting/journal-entries/${idOf(d2)}/discard`, { reason: "not mine" })
  check("a preparer cannot discard someone else's draft", other.status >= 400 && status(idOf(d2)) === "PENDING", `${other.status} ${other.err}`)
  const disc = await call(acct, "POST", `/accounting/journal-entries/${idOf(d2)}/discard`, { reason: "raised twice" })
  check("the preparer discards their own draft (nothing to reverse)", disc.status < 300 && status(idOf(d2)) === "VOID" && q(`return await p.journalEntry.count({where:{referenceNumber:{startsWith:'VR-'+${J(tag)}}}})`) === 0, `${disc.status} ${disc.err}`)
  const discPosted = await call(acct, "POST", `/accounting/journal-entries/${idOf(d1)}/discard`, {})
  check("a posted journal cannot be discarded", discPosted.status >= 400 && status(idOf(d1)) === "POSTED", `${discPosted.status}`)
  const rej = await call(fm, "PATCH", `/accounting/journal-entries/${idOf(c1)}/void`, { reason: "wrong account" })
  const rejAudit = q(`return (await p.auditLog.findFirst({where:{entityId:${J(idOf(c1))},action:'VOID'},orderBy:{createdAt:'desc'}}))?.newValues`)
  check("an approver rejects a draft, with the reason on record", rej.status < 300 && status(idOf(c1)) === "VOID" && J(rejAudit).includes("wrong account"), `${rej.status} ${J(rejAudit).slice(0, 160)}`)

  // ---------------------------------------------------------------- journals raised for other records
  // an investment in Draft posting mode, so its day of interest is a draft journal
  const officer = await login("acct.officer@nts.local")
  const banks = await call(cfo, "GET", "/cashbook/banks")
  const bank = banks.data.find((b) => b.currencyId === USD && b.glAccountId)
  const inst = await call(officer, "POST", "/accounting/short-term-investments/instruments", { name: `UAT STI ${tag}`, category: "Money Market", broker: "UAT Broker J", principal: 5000, currencyId: USD, compoundingMethod: "SIMPLE", dayCountConvention: "ACTUAL_365", settlementBankId: bank.id, principalGlAccountId: A("1150"), accruedInterestGlAccountId: A("1160"), interestIncomeGlAccountId: A("4110"), negativeYieldExpenseGlAccountId: A("5150"), startDateIso: new Date().toISOString().slice(0, 10), initialApyPercent: 7 })
  if (inst.data && inst.data.id) stiMade.push(inst.data.id)
  const stiDraft = q(`const a=await p.shortTermInvestmentAccrual.findFirst({where:{instrumentId:${J((inst.data && inst.data.id) || "")},status:'PENDING_POST',journalEntry:{status:'PENDING'}},select:{id:true,journalEntryId:true}});return a`)
  if (stiDraft) {
    const dsti = await call(acct, "POST", `/accounting/journal-entries/${stiDraft.journalEntryId}/discard`, {})
    check("a draft raised for another record (an investment's interest) is not discarded from the register", dsti.status >= 400 && /belongs to/.test(String(dsti.err)), `${dsti.status} ${dsti.err}`)
    const src = await call(cfo, "GET", `/accounting/journal-entries/${stiDraft.journalEntryId}`)
    check("the journal says what it was raised for", src.data && /short-term investment/.test(String(src.data.source)), J(src.data && src.data.source))
    const pst = await call(fm, "PATCH", `/accounting/journal-entries/${stiDraft.journalEntryId}/post`, {})
    const accSt = q(`return (await p.shortTermInvestmentAccrual.findUnique({where:{id:${J(stiDraft.id)}}})).status`)
    check("posting it from the register marks the investment's day as posted too", pst.status < 300 && accSt === "POSTED", `${pst.status} ${pst.err} ${accSt}`)
  } else console.log("SKIP  no draft investment interest to test the source rules on")

  // ---------------------------------------------------------------- void
  const vd = await call(fm, "PATCH", `/accounting/journal-entries/${idOf(d1)}/void`, { reason: "duplicate of an earlier entry" })
  const vr = q(`const o=await p.journalEntry.findUnique({where:{id:${J(idOf(d1))}}});const r=await p.journalEntry.findFirst({where:{referenceNumber:'VR-'+o.referenceNumber},include:{journalEntryLines:true}});return r&&{st:r.status,dr:r.journalEntryLines.reduce((s,l)=>s+Number(l.debitAmount),0),cr:r.journalEntryLines.reduce((s,l)=>s+Number(l.creditAmount),0)}`)
  check("voiding a posted journal posts a balanced reversing entry and marks it void", vd.status < 300 && status(idOf(d1)) === "VOID" && vr && vr.st === "POSTED" && vr.dr === 150 && vr.cr === 150, `${vd.status} ${vd.err} ${J(vr)}`)
  const vdAcct = await call(acct, "PATCH", `/accounting/journal-entries/${idOf(c1)}/void`, {})
  check("a preparer cannot void", vdAcct.status === 403, String(vdAcct.status))

  // ---------------------------------------------------------------- closed periods (August 2026)
  const aug = await je(acct, { date: "2026-08-14", d: "August accrual" }); made.push(idOf(aug))
  await call(fm, "PATCH", `/accounting/journal-entries/${idOf(aug)}/post`, {})
  const aug2 = await je(acct, { date: "2026-08-20", d: "August late draft" }); made.push(idOf(aug2))
  const lk = await call(cfo, "PUT", "/accounting/fiscal-calendar/locks/draft", { draft: { moduleLocks: [{ fiscalPeriodId: "fp_2026_08", moduleCode: "GL", lockStatus: "LOCKED", reason: `${tag} month-end` }] } })
  const cm = await call(cfo, "POST", "/accounting/fiscal-calendar/locks/commit", { reason: `${tag} month-end` })
  lockedAug = cm.status < 300
  check("the period manager locks August", lk.status < 300 && cm.status < 300, `${lk.status} ${cm.status} ${cm.err}`)
  const lockPre = await call(acct, "PUT", "/accounting/fiscal-calendar/locks/draft", { draft: { moduleLocks: [] } })
  check("a preparer cannot lock or unlock periods", lockPre.status === 403, String(lockPre.status))
  const pAug = await call(fm, "PATCH", `/accounting/journal-entries/${idOf(aug2)}/post`, {})
  check("a draft dated in a locked month cannot be posted", pAug.status >= 400 && status(idOf(aug2)) === "PENDING", `${pAug.status} ${pAug.err}`)
  const vAug = await call(fm, "PATCH", `/accounting/journal-entries/${idOf(aug)}/void`, { reason: "late correction" })
  check("[finding] a posted journal in a locked month cannot be voided (the month stays as reported)", vAug.status >= 400 && status(idOf(aug)) === "POSTED", `${vAug.status} ${vAug.err}`)
  const nAug = await je(acct, { date: "2026-08-25", d: "new August entry" })
  if (idOf(nAug)) made.push(idOf(nAug))
  check("a new journal dated in a locked month is refused", nAug.status >= 400, `${nAug.status}`)
  const hist = await call(cfo, "GET", "/accounting/fiscal-calendar/period-lock/audit")
  check("the lock is in the period history with who and why", Array.isArray(hist.data) && hist.data.some((h) => h.fiscalPeriodId === "fp_2026_08" && String(h.reason || "").includes(tag)), J((hist.data || []).slice(0, 1)).slice(0, 200))
} finally {
  if (lockedAug) {
    await call(cfo, "PUT", "/accounting/fiscal-calendar/locks/draft", { draft: { moduleLocks: [{ fiscalPeriodId: "fp_2026_08", moduleCode: "GL", lockStatus: "OPEN", reason: `${tag} reopened after test` }] } })
    const re = await call(cfo, "POST", "/accounting/fiscal-calendar/locks/commit", { reason: `${tag} reopened after test` })
    console.log(`(August reopened: ${re.status})`)
  }
  for (const id of stiMade) await call(fm, "POST", `/accounting/short-term-investments/instruments/${id}/void`, { reason: "UAT clean-up" })
  // leave nothing live: drafts discarded, posted test journals voided (a reversing entry each)
  for (const id of made.filter(Boolean)) {
    const st = status(id)
    if (st === "PENDING") await call(fm, "PATCH", `/accounting/journal-entries/${id}/void`, { reason: "UAT clean-up" })
    if (st === "POSTED") await call(fm, "PATCH", `/accounting/journal-entries/${id}/void`, { reason: "UAT clean-up" })
  }
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
