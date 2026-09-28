// Accounting audit trail through the API: who may read it, an account's life (added, changed, deleted) recorded with
// its reference, who did it and the values before and after, filters (area, person, dates, reference — a deleted
// record included), the CSV export (itself recorded), and the journal-number integrity check (a withdrawn draft keeps
// its number: nothing goes missing). Creates one test account and deletes it; one draft journal, withdrawn.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body, attempt = 0) => {
  let r
  try { r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }) } catch (e) { if (method === "GET" && attempt < 2) return call(u, method, path, body, attempt + 1); throw e }
  const text = await r.text(); let j = null; try { j = JSON.parse(text) } catch {}
  return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message), text }
}
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const tag = `UATAUD${Date.now().toString().slice(-5)}`
const harare = (offsetDays = 0) => new Date(Date.now() + 2 * 3600000 + offsetDays * 86400000).toISOString().slice(0, 10)

const acct = await login("acct.accountant@nts.local"), cfo = await login("acct.cfo@nts.local"), auditor = await login("acct.auditor@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id
const taken = new Set(coa.data.map((a) => a.accountNo))
let no = "5950"; for (let i = 5950; i < 5998 && taken.has(no); i++) no = String(i + 1)
let id = null, draftId = null
try {
  const out = await call(emp, "GET", "/accounting/audit")
  check("someone outside finance cannot read the accounting audit trail", out.status === 403, String(out.status))
  const add = await call(cfo, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: `${tag} consulting`, accountType: "Expense", financialStatement: "Income Statement" })
  id = add.data && add.data.id
  await call(cfo, "PUT", `/accounting/chart-of-accounts/${id}`, { accountName: `${tag} consulting fees` })
  const del = await call(cfo, "DELETE", `/accounting/chart-of-accounts/${id}`)
  if (del.status === 200) id = null
  const list = await call(auditor, "GET", `/accounting/audit?area=accounts&q=${encodeURIComponent(tag)}`)
  const ev = (list.data && list.data.items) || []
  const acts = ev.map((e) => e.action)
  check("an auditor reads an account's life: added, changed, deleted, newest first", list.status === 200 && J(acts) === J(["DELETE", "UPDATE", "CREATE"]), `${list.status} ${J(acts)}`)
  const upd = ev.find((e) => e.action === "UPDATE")
  check("each event says who, the record's reference and the values before and after", upd && upd.user === "Acct CFO" && upd.role && String(upd.reference).startsWith(no) && upd.oldValues.accountName === `${tag} consulting` && upd.newValues.accountName === `${tag} consulting fees`, J(upd).slice(0, 300))
  check("a deleted record is still found by its reference", ev.length === 3 && ev.every((e) => String(e.reference || "").includes(tag)), J(ev.map((e) => e.reference)))
  const area = await call(auditor, "GET", "/accounting/audit?area=accounts&limit=100")
  check("filtering by area returns only that area", area.status === 200 && area.data.items.length > 0 && area.data.items.every((e) => e.entityType === "ChartOfAccounts"), J(area.data && area.data.items.map((e) => e.entityType)).slice(0, 200))
  const who = await call(auditor, "GET", `/accounting/audit?userId=${cfo.id}&limit=100`)
  check("filtering by person returns only their events", who.status === 200 && who.data.items.length > 0 && who.data.items.every((e) => e.userId === cfo.id), `${who.status}`)
  const past = await call(auditor, "GET", `/accounting/audit?area=accounts&q=${encodeURIComponent(tag)}&to=${harare(-1)}`)
  const today = await call(auditor, "GET", `/accounting/audit?area=accounts&q=${encodeURIComponent(tag)}&from=${harare()}&to=${harare()}`)
  check("date filters work on the tenant's days", past.data.items.length === 0 && today.data.items.length === 3, `${past.data && past.data.items.length} / ${today.data && today.data.items.length}`)
  const period = await call(auditor, "GET", "/accounting/audit?area=period&limit=5")
  check("period-lock actions are part of the trail", period.status === 200 && period.data.items.every((e) => e.area === "period") && (period.data.total === 0 || period.data.items[0].user), `${period.status} ${period.data && period.data.total}`)
  const before = q(`return await p.auditLog.count({where:{action:'AUDIT_EXPORT',entityType:'AccountingAudit',userId:${J(auditor.id)}}})`)
  const csv = await call(auditor, "GET", `/accounting/audit/export?area=accounts&q=${encodeURIComponent(tag)}`)
  const lines = csv.text.replace(/^\ufeff/, "").trim().split(/\r?\n/)
  check("the export is a CSV of exactly what is filtered, with before and after values", csv.status === 200 && /^When \(UTC\),Area,Record type,Record/.test(lines[0]) && lines.length === 4 && lines[1].includes("DELETE"), `${csv.status} ${lines.length} ${lines[0]}`)
  check("the export itself is recorded", q(`return await p.auditLog.count({where:{action:'AUDIT_EXPORT',entityType:'AccountingAudit',userId:${J(auditor.id)}}})`) === before + 1)

  // integrity: withdrawing a draft keeps its number, so nothing goes missing
  const i1 = await call(auditor, "GET", "/accounting/audit/integrity")
  check("the integrity check reports numbering and balance", i1.status === 200 && typeof i1.data.ok === "boolean" && i1.data.journals > 0 && Array.isArray(i1.data.missing) && Array.isArray(i1.data.unbalancedPosted), `${i1.status} ${i1.err}`)
  check("posted journals balance (a voided journal's reversal left out with it)", i1.data.unbalancedPosted.length === 0, J(i1.data.unbalancedPosted).slice(0, 200))
  const d = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: harare(), referenceNumber: `${tag}-D`, description: `${tag} draft`, currencyId: USD, journalEntryLines: [{ chartOfAccountId: A("5090"), debitAmount: 5, creditAmount: 0, description: "x" }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 5, description: "x" }] })
  draftId = d.data && (d.data.id || (d.data.journalEntry && d.data.journalEntry.id))
  await call(acct, "POST", `/accounting/journal-entries/${draftId}/discard`, { reason: "UAT audit" })
  const i2 = await call(auditor, "GET", "/accounting/audit/integrity")
  check("a withdrawn draft keeps its number: nothing new goes missing", !!draftId && i2.data.missingCount === i1.data.missingCount && i2.data.last === i1.data.lastIssued + 1 && i2.data.lastIssued === i2.data.last, `${i1.data.missingCount}->${i2.data.missingCount} last ${i2.data.last} issued ${i2.data.lastIssued}`)
} finally {
  if (id) q(`return (await p.chartOfAccounts.deleteMany({where:{id:${J(id)}}})).count`)
  const left = q(`return (await p.journalEntry.findMany({where:{referenceNumber:{startsWith:${J(tag)}},status:'PENDING'},select:{id:true}})).map((j)=>j.id)`)
  for (const jid of left) await call(acct, "POST", `/accounting/journal-entries/${jid}/discard`, { reason: "UAT clean-up" })
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
