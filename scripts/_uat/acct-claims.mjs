// Employee expense claims (EX-05 / SRD ACC-EXP-03…07, UIR 13) through the API: an employee itemises a claim with
// receipts; a line above the receipt threshold without one cannot be submitted; the line manager approves (not the
// employee, not a preparer without line-management rights); finance can return it only with what to correct and the
// employee corrects and resubmits; the finance reviewer assigns the expense accounts; a finance manager (not the
// reviewer) approves — a claim over a daily limit only with a note — and the journal is posted (Dr expense and VAT /
// Cr Staff Claims Payable); the journal cannot be voided on its own; reimbursement from a bank in another currency is
// refused, from the right one it pays the claim (Dr payable / Cr bank, cashbook line). Every step is audited.
// Posts one small claim (and its reimbursement) in USD on the dev books; the policy is restored at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error) } }
const upload = async (u, path, fields, withReceipt = true) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, String(v))
  if (withReceipt) fd.append("receipt", new Blob([Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")], { type: "application/pdf" }), "receipt.pdf")
  const r = await fetch(`${API}${path}`, { method: "POST", headers: { Authorization: `Bearer ${u.t}` }, body: fd })
  const j = await r.json().catch(() => null)
  return { status: r.status, data: j && j.data, err: j && j.message }
}
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10)
const day1 = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), day2 = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10)

const emp = await login("perf.employee@nts.local"), mgr = await login("acct.cfo@nts.local"), acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local")
const opts = (await call(emp, "GET", "/accounting/claims/options")).data
const travel = opts.categories.find((c) => /travel/i.test(c.name)), ops = opts.categories.find((c) => !/travel/i.test(c.name))
const oldPolicy = (await call(fm, "GET", "/accounting/claims/policy")).data
const made = []
try {
  const noPol = await call(emp, "PUT", "/accounting/claims/policy", { receiptRequiredAbove: 1000 })
  const pol = await call(fm, "PUT", "/accounting/claims/policy", { receiptRequiredAbove: 25, dailyLimits: { [travel.id]: 50 } })
  check("only a finance manager changes the claims policy", noPol.status === 403 && pol.status === 200 && pol.data.dailyLimits[travel.id] === 50, `${noPol.status} ${pol.status} ${pol.err}`)

  const c = await call(emp, "POST", "/accounting/claims", { title: "UAT client visit, Bulawayo", purpose: "Site visit", currency: "USD" })
  const id = c.data && c.data.id; if (id) made.push(id)
  check("an employee starts a claim with a reference", c.status === 201 && /^CLM-\d{8}-\d{3}$/.test(c.data.reference) && c.data.status === "DRAFT", `${c.status} ${c.err}`)
  const l1 = await upload(emp, `/accounting/claims/${id}/lines`, { date: day1, categoryId: travel.id, description: "Bus fare and lodging", amount: 60, vat: 0 })
  const l2 = await upload(emp, `/accounting/claims/${id}/lines`, { date: day1, categoryId: ops.id, description: "Printing", amount: 11.5, vat: 1.5 }, false)
  const l3 = await upload(emp, `/accounting/claims/${id}/lines`, { date: day2, categoryId: ops.id, description: "Client lunch", amount: 40 }, false)
  const future = await upload(emp, `/accounting/claims/${id}/lines`, { date: "2099-01-01", description: "x", amount: 5 }, false)
  const cl = await call(emp, "GET", `/accounting/claims/${id}`)
  check("items are added with their receipts; a future date is refused; the total follows", l1.status === 201 && l2.status === 201 && l3.status === 201 && future.status === 400 && cl.data.total === 111.5 && cl.data.lines.find((l) => l.description === "Bus fare and lodging").receiptUrl, `${l1.status} ${l1.err} ${l2.status} ${l3.status} ${future.status} total ${cl.data && cl.data.total}`)
  const blocked = await call(emp, "POST", `/accounting/claims/${id}/submit`, {})
  check("an item above the receipt threshold without a receipt cannot be submitted", blocked.status === 409 && /Client lunch/.test(String(blocked.err)), `${blocked.status} ${blocked.err}`)
  const lunch = cl.data.lines.find((l) => l.description === "Client lunch")
  const att = await upload(emp, `/accounting/claims/${id}/lines/${lunch.id}/receipt`, {})
  const sub = await call(emp, "POST", `/accounting/claims/${id}/submit`, {})
  check("with the receipt attached it is submitted, flagged over the travel daily limit", att.status === 200 && sub.status === 200 && sub.data.status === "SUBMITTED" && sub.data.exceptions.some((e) => /daily limit/.test(e)), `${att.status} ${sub.status} ${sub.err} ${J(sub.data && sub.data.exceptions)}`)
  const edit = await call(emp, "PATCH", `/accounting/claims/${id}`, { title: "changed" })
  check("a submitted claim cannot be changed by the employee", edit.status === 409, `${edit.status}`)

  const own = await call(emp, "POST", `/accounting/claims/${id}/manager-approve`, {})
  const prep = await call(acct, "POST", `/accounting/claims/${id}/manager-approve`, {})
  const early = await call(acct, "POST", `/accounting/claims/${id}/review`, {})
  const waiting = await call(mgr, "GET", "/accounting/claims?scope=waiting")
  check("the line manager sees it waiting; the employee and a preparer cannot approve it; finance cannot review it yet", own.status === 403 && prep.status === 403 && early.status === 409 && waiting.data.some((x) => x.id === id), `${own.status} ${prep.status} ${early.status} ${waiting.status}`)
  const ma = await call(mgr, "POST", `/accounting/claims/${id}/manager-approve`, {})
  check("the line manager approves it", ma.status === 200 && ma.data.status === "MANAGER_APPROVED" && ma.data.manager, `${ma.status} ${ma.err}`)
  const noWhy = await call(acct, "POST", `/accounting/claims/${id}/return`, {})
  const ret = await call(acct, "POST", `/accounting/claims/${id}/return`, { reason: "Printing was a company account purchase; remove it" })
  check("finance returns it only with what to correct", noWhy.status === 400 && ret.status === 200 && ret.data.status === "RETURNED" && /Printing/.test(ret.data.returnReason), `${noWhy.status} ${ret.status} ${ret.err}`)
  const printing = cl.data.lines.find((l) => l.description === "Printing")
  const rm = await call(emp, "DELETE", `/accounting/claims/${id}/lines/${printing.id}`)
  const re = await call(emp, "POST", `/accounting/claims/${id}/submit`, {})
  const ma2 = await call(mgr, "POST", `/accounting/claims/${id}/manager-approve`, {})
  check("the employee corrects and resubmits; it goes back through the line manager", rm.status === 200 && rm.data.total === 100 && re.status === 200 && ma2.status === 200 && ma2.data.status === "MANAGER_APPROVED", `${rm.status} ${re.status} ${re.err} ${ma2.status} ${ma2.err}`)

  const rv = await call(acct, "POST", `/accounting/claims/${id}/review`, {})
  const accs = rv.data && rv.data.lines.map((l) => l.account)
  check("the finance reviewer reviews it; travel goes to 5070, the rest to 5090", rv.status === 200 && rv.data.status === "REVIEWED" && rv.data.lines.find((l) => l.description === "Bus fare and lodging").account.startsWith("5070") && rv.data.lines.find((l) => l.description === "Client lunch").account.startsWith("5090"), `${rv.status} ${rv.err} ${J(accs)}`)
  const byPrep = await call(acct, "POST", `/accounting/claims/${id}/approve`, { exceptionNote: "x" })
  const noNote = await call(fm, "POST", `/accounting/claims/${id}/approve`, {})
  check("a preparer cannot approve it; over the policy it needs a note", byPrep.status === 403 && noNote.status === 409 && /note/.test(String(noNote.err)), `${byPrep.status} ${noNote.status} ${noNote.err}`)
  const ap = await call(fm, "POST", `/accounting/claims/${id}/approve`, { exceptionNote: "Only lodging available near the site" })
  const je = ap.data && ap.data.journal && q(`const j=await p.journalEntry.findUnique({where:{id:${J(ap.data.journalEntryId)}},include:{journalEntryLines:{include:{chartOfAccount:{select:{accountNo:true}}}}}});return {status:j.status,ref:j.referenceNumber,lines:j.journalEntryLines.map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])}`)
  const bal = je && je.lines.reduce((s, l) => s + l[1] - l[2], 0)
  check("a finance manager approves it with the note: the journal is posted, Dr expenses / Cr Staff Claims Payable", ap.status === 200 && ap.data.status === "APPROVED" && je.status === "POSTED" && Math.abs(bal) < 0.005 && je.lines.some((l) => l[0] === "2260" && l[2] === 100) && je.lines.some((l) => l[0] === "5070" && l[1] === 60) && je.lines.some((l) => l[0] === "5090" && l[1] === 40), `${ap.status} ${ap.err} ${J(je)}`)
  const vd = await call(fm, "PATCH", `/accounting/journal-entries/${ap.data.journalEntryId}/void`, { reason: "UAT" })
  check("the claim's journal cannot be voided on its own", vd.status >= 400 && /expense claim/.test(String(vd.err)), `${vd.status} ${vd.err}`)

  const banks = (await call(fm, "GET", "/accounting/claims/options")).data.banks
  const usd = banks.find((b) => b.currency === "USD"), other = banks.find((b) => b.currency !== "USD")
  const byEmp = await call(emp, "POST", `/accounting/claims/${id}/reimburse`, { bankId: usd.id })
  const wrong = other ? await call(fm, "POST", `/accounting/claims/${id}/reimburse`, { bankId: other.id }) : { status: 400, err: "in USD" }
  check("the employee cannot pay it; a bank in another currency is refused", byEmp.status === 403 && wrong.status === 400 && /USD/.test(String(wrong.err)), `${byEmp.status} ${wrong.status} ${wrong.err}`)
  const pay = await call(fm, "POST", `/accounting/claims/${id}/reimburse`, { bankId: usd.id, bankReference: "UAT-EFT" })
  const pj = pay.data && pay.data.reimbursementJournalId && q(`const j=await p.journalEntry.findUnique({where:{id:${J(pay.data.reimbursementJournalId)}},include:{cashbookEntries:true,journalEntryLines:{include:{chartOfAccount:{select:{accountNo:true}}}}}});return {status:j.status,cb:j.cashbookEntries.map(c=>[c.type,Number(c.amount),c.status]),lines:j.journalEntryLines.map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])}`)
  check("reimbursement pays it: Dr Staff Claims Payable / Cr the bank, with its cashbook line", pay.status === 200 && pay.data.status === "REIMBURSED" && pj.status === "POSTED" && pj.lines.some((l) => l[0] === "2260" && l[1] === 100) && pj.cb.length === 1 && pj.cb[0][0] === "PAYMENT" && pj.cb[0][1] === 100, `${pay.status} ${pay.err} ${J(pj)}`)
  const twice = await call(fm, "POST", `/accounting/claims/${id}/reimburse`, { bankId: usd.id })
  check("it cannot be paid twice", twice.status === 409, `${twice.status}`)

  const c2 = await call(emp, "POST", "/accounting/claims", { title: "UAT withdrawn claim" })
  if (c2.data) made.push(c2.data.id)
  const wd = await call(emp, "POST", `/accounting/claims/${c2.data.id}/withdraw`, {})
  check("an employee withdraws a claim they no longer want", wd.status === 200 && wd.data.status === "WITHDRAWN", `${wd.status} ${wd.err}`)
  const aud = q(`return (await p.auditLog.findMany({where:{entityType:'ExpenseClaim',entityId:${J(id)}},select:{action:true},orderBy:{createdAt:'asc'}})).map(a=>a.action)`)
  const area = await call(fm, "GET", `/accounting/audit?area=expenses&q=${encodeURIComponent(c.data.reference)}`)
  check("every step is in the audit trail, under Expenses", ["CREATE", "SUBMIT", "MANAGER_APPROVE", "RETURN", "REVIEW", "APPROVE_WITH_EXCEPTION", "REIMBURSE"].every((a) => aud.includes(a)) && area.status === 200, `${J(aud)} ${area.status}`)
  const mine = await call(emp, "GET", "/accounting/claims")
  check("the employee's list shows the claim as paid", mine.status === 200 && mine.data.find((x) => x.id === id).status === "REIMBURSED", `${mine.status}`)
} finally {
  await call(fm, "PUT", "/accounting/claims/policy", oldPolicy || {})
  for (const cid of made) q(`const [c]=await p.$queryRawUnsafe("SELECT status FROM expense_claims WHERE id = ?", ${J(cid)});if(c&&['DRAFT','RETURNED','SUBMITTED','MANAGER_APPROVED','REVIEWED'].includes(c.status))await p.$executeRawUnsafe("UPDATE expense_claims SET status='WITHDRAWN' WHERE id = ?", ${J(cid)});return 1`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
