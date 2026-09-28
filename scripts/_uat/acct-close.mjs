// Period close through the API (SRD ACC-PER-05…07): readiness, the standard checklist, task owners and dependencies, and
// the lock that waits for the checklist. Runs in March 2025 (fp_2025_03) so current months are untouched; its tasks are
// removed and the month reopened at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const PID = "fp_2025_03"
const tag = `UATC-${Date.now() % 100000}`
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
const lock = (u, status, reason) => call(u, "PUT", "/accounting/fiscal-calendar/locks/draft", { draft: { moduleLocks: ["GL", "AR", "AP", "BANK"].map((m) => ({ fiscalPeriodId: PID, moduleCode: m, lockStatus: status, reason })) } }).then(() => call(u, "POST", "/accounting/fiscal-calendar/locks/commit", { reason }))

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), emp = await login("perf.employee@nts.local")
const before = q(`return (await p.accountingCloseTask.findMany({where:{fiscalPeriodId:${J(PID)}},select:{id:true}})).map(x=>x.id)`)

try {
  const rd = await call(acct, "GET", `/accounting/close-tasks/periods/${PID}/readiness`)
  check("readiness: the month's checklist, drafts, bank lines, investment interest, depreciation and lock", rd.status === 200 && rd.data && rd.data.period && "draftJournals" in rd.data && "unreconciledBankLines" in rd.data && rd.data.investments && rd.data.depreciation && rd.data.ledgerLock, J(rd).slice(0, 200))
  const rdEmp = await call(emp, "GET", `/accounting/close-tasks/periods/${PID}/readiness`)
  check("someone outside finance cannot see the close", rdEmp.status === 403, String(rdEmp.status))

  const stdA = await call(acct, "POST", `/accounting/close-tasks/periods/${PID}/tasks/standard`, {})
  check("a preparer cannot set up the checklist", stdA.status === 403, String(stdA.status))
  const std = await call(fm, "POST", `/accounting/close-tasks/periods/${PID}/tasks/standard`, {})
  const std2 = await call(fm, "POST", `/accounting/close-tasks/periods/${PID}/tasks/standard`, {})
  check("the period manager adds the standard checklist (SRD workstreams), once", std.status === 200 && std.data.added >= 12 - before.length && std2.data && std2.data.added === 0, `${std.status} ${J(std.data)} ${J(std2.data)}`)

  const lk1 = await lock(fm, "LOCKED", `${tag} premature`)
  check("the month cannot be locked while checklist tasks are open (ACC-PER-07)", lk1.status >= 400 && /open close task/.test(String(lk1.err)), `${lk1.status} ${lk1.err}`)

  // an owner works their own task
  const own = await call(fm, "POST", `/accounting/close-tasks/periods/${PID}/tasks`, { workstream: "Tax", task: `${tag} owner task`, ownerId: acct.id })
  const ownId = own.data && own.data.id
  const st1 = await call(acct, "PATCH", `/accounting/close-tasks/tasks/${ownId}`, { status: "IN_PROGRESS" })
  const st2 = await call(acct, "PATCH", `/accounting/close-tasks/tasks/${ownId}`, { status: "COMPLETE" })
  check("the owner starts and completes their own task", st1.status === 200 && st2.status === 200 && st2.data.status === "COMPLETE" && st2.data.completedById === acct.id, `${st1.status} ${st2.status} ${st2.err}`)
  const reo = await call(acct, "PATCH", `/accounting/close-tasks/tasks/${ownId}`, { status: "OPEN" })
  check("the owner cannot reopen a completed task (the period manager does)", reo.status === 403, `${reo.status} ${reo.err}`)
  const someone = q(`return (await p.accountingCloseTask.findFirst({where:{fiscalPeriodId:${J(PID)},NOT:{ownerId:${J(acct.id)}},status:{not:'COMPLETE'}},select:{id:true}}))?.id`)
  const notMine = await call(acct, "PATCH", `/accounting/close-tasks/tasks/${someone}`, { status: "COMPLETE" })
  check("a preparer cannot complete someone else's task", notMine.status === 403, `${notMine.status}`)

  // dependencies
  const a = await call(fm, "POST", `/accounting/close-tasks/periods/${PID}/tasks`, { workstream: "Financial statements", task: `${tag} review` })
  const b = await call(fm, "POST", `/accounting/close-tasks/periods/${PID}/tasks`, { workstream: "Financial statements", task: `${tag} sign-off`, dependsOnId: a.data.id })
  const early = await call(fm, "PATCH", `/accounting/close-tasks/tasks/${b.data.id}`, { status: "COMPLETE" })
  check("a task waiting on another cannot be completed first", early.status >= 400, `${early.status} ${early.err}`)

  // complete everything, then lock
  const open = q(`return (await p.accountingCloseTask.findMany({where:{fiscalPeriodId:${J(PID)},status:{not:'COMPLETE'}},orderBy:{createdAt:'asc'},select:{id:true}})).map(x=>x.id)`)
  for (const id of open.filter((x) => x !== b.data.id)) await call(fm, "PATCH", `/accounting/close-tasks/tasks/${id}`, { status: "COMPLETE" })
  await call(fm, "PATCH", `/accounting/close-tasks/tasks/${b.data.id}`, { status: "COMPLETE" })
  const can = await call(fm, "GET", `/accounting/close-tasks/periods/${PID}/can-lock`)
  check("with every task complete the month can be locked", can.data && can.data.canLock === true, J(can.data))
  const lk2 = await lock(fm, "LOCKED", `${tag} month-end`)
  const rd2 = await call(fm, "GET", `/accounting/close-tasks/periods/${PID}/readiness`)
  check("the period manager locks the month (ledger and sub-ledgers)", lk2.status === 200 && rd2.data.ledgerLock === "LOCKED" && q(`return await p.modulePeriodLock.count({where:{fiscalPeriodId:${J(PID)},lockStatus:'LOCKED',moduleCode:{in:['GL','AR','AP','BANK']}}})`) === 4, `${lk2.status} ${lk2.err} ${rd2.data && rd2.data.ledgerLock}`)
  const coa = await call(cfo, "GET", "/accounting/chart-of-accounts"), cur = await call(cfo, "GET", "/accounting/currencies")
  const A = (no) => coa.data.find((x) => x.accountNo === no).id
  const late = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: "2025-03-20", referenceNumber: `${tag}-late`, description: `${tag} late March entry`, currencyId: cur.data.find((c) => c.code === "USD").id, journalEntryLines: [{ chartOfAccountId: A("5090"), debitAmount: 10, creditAmount: 0 }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 10 }] })
  check("nothing can be entered into the locked month", late.status >= 400, `${late.status} ${late.err}`)
  const pre = await lock(acct, "OPEN", "preparer tries")
  check("a preparer cannot reopen it", pre.status === 403, String(pre.status))
  const re = await lock(fm, "OPEN", `${tag} reopened for a correction`)
  const hist = await call(fm, "GET", "/accounting/fiscal-calendar/period-lock/audit")
  check("the period manager reopens it with a reason, kept in the lock history", re.status === 200 && (hist.data || []).some((h) => h.fiscalPeriodId === PID && String(h.reason || "").includes(`${tag} reopened`)), `${re.status} ${re.err}`)
} finally {
  await lock(fm, "OPEN", `${tag} test finished`)
  const removed = q(`const w={fiscalPeriodId:${J(PID)},id:{notIn:${J(before)}}};await p.accountingCloseTask.updateMany({where:w,data:{dependsOnId:null}});return (await p.accountingCloseTask.deleteMany({where:w})).count`)
  console.log(`(March 2025 reopened; ${removed} test task(s) removed)`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
