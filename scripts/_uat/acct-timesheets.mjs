// Timesheets through the API: an employee books time to a project and submits the week; the approver sees it waiting,
// may return it only with what to correct, and approves the corrected week; nobody approves their own; a preparer
// without line-management rights cannot approve; the project's approved and billable hours follow. Uses a week in
// January 2025 for the test employee and removes that week at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const WEEK = "2025-01-05", DAY = "2025-01-02"

const emp = await login("perf.employee@nts.local"), cfo = await login("acct.cfo@nts.local"), acct = await login("acct.accountant@nts.local")
const clear = () => q(`const t=await p.timesheet.findFirst({where:{userId:${J(emp.id)},weekEnding:new Date('${WEEK}')}});if(!t)return 0;await p.timesheetEntry.deleteMany({where:{timesheetId:t.id}});await p.timesheet.delete({where:{id:t.id}});return 1`)
clear()
try {
  const projects = await call(emp, "GET", "/accounting/projects?activeOnly=true")
  const proj = projects.data && projects.data[0]
  check("an employee sees the projects with hours booked to each", projects.status === 200 && proj && proj.hours && typeof proj.hours.approved === "number", `${projects.status} ${projects.err}`)
  const before = proj.hours
  const e1 = await call(emp, "POST", `/accounting/timesheets/${WEEK}/entries`, { projectId: proj.id, date: DAY, hours: 6, billable: true, notes: "UAT timesheet" })
  const e2 = await call(emp, "POST", `/accounting/timesheets/${WEEK}/entries`, { projectId: proj.id, date: "2025-01-03", hours: 2, billable: false })
  const tooMuch = await call(emp, "POST", `/accounting/timesheets/${WEEK}/entries`, { projectId: proj.id, date: DAY, hours: 25 })
  check("an employee books time to a project; more than 24 hours in a day is refused", e1.status < 300 && e2.status < 300 && tooMuch.status === 400, `${e1.status} ${e2.status} ${tooMuch.status} ${tooMuch.err}`)
  const tsId = q(`return (await p.timesheet.findFirst({where:{userId:${J(emp.id)},weekEnding:new Date('${WEEK}')}})).id`)
  const sub = await call(emp, "POST", `/accounting/timesheets/${tsId}/submit`, {})
  check("the employee submits the week", sub.status === 200, `${sub.status} ${sub.err}`)
  const own = await call(emp, "POST", `/accounting/timesheets/${tsId}/approve`, {})
  check("the employee cannot approve it", own.status === 403, `${own.status}`)
  const prep = await call(acct, "POST", `/accounting/timesheets/${tsId}/approve`, {})
  check("a preparer without line-management rights cannot approve it", prep.status === 403, `${prep.status}`)
  const pend = await call(cfo, "GET", "/accounting/timesheets/pending-approval")
  check("the approver sees it waiting, with its lines", pend.status === 200 && pend.data.some((t) => t.id === tsId && t.entries.length === 2), `${pend.status}`)
  const noWhy = await call(cfo, "POST", `/accounting/timesheets/${tsId}/return`, {})
  check("returning it needs what to correct", noWhy.status === 400, `${noWhy.status} ${noWhy.err}`)
  const ret = await call(cfo, "POST", `/accounting/timesheets/${tsId}/return`, { reason: "Split the 6 hours by task" })
  check("it is returned with the reason", ret.status === 200 && q(`return (await p.timesheet.findUnique({where:{id:${J(tsId)}}})).returnReason`) === "Split the 6 hours by task", `${ret.status} ${ret.err}`)
  await call(emp, "POST", `/accounting/timesheets/${WEEK}/entries`, { projectId: proj.id, date: DAY, hours: 5, billable: true, notes: "UAT corrected" })
  const re = await call(emp, "POST", `/accounting/timesheets/${tsId}/submit`, {})
  const ok = await call(cfo, "POST", `/accounting/timesheets/${tsId}/approve`, {})
  check("the corrected week is resubmitted and approved", re.status === 200 && ok.status === 200 && ok.data.status === "APPROVED", `${re.status} ${ok.status} ${ok.err}`)
  const again = await call(cfo, "POST", `/accounting/timesheets/${tsId}/approve`, {})
  check("an approved week cannot be approved again", again.status === 400, `${again.status}`)
  const after = (await call(emp, "GET", "/accounting/projects?activeOnly=true")).data.find((p) => p.id === proj.id).hours
  check("the project's approved hours rise by the week's hours, billable by its billable hours", after.approved === before.approved + 7 && after.billable === before.billable + 5, `${J(before)} -> ${J(after)}`)
} finally {
  clear()
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
