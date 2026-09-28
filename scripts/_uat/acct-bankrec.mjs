// Bank reconciliation through the API (SRD Cashbook ACC-CB-25…35, ACC-PER-04) on a dedicated test bank account, so the
// real accounts' reconciled dates are untouched: first reconciliation, statement import, auto-match (reference, amount and
// date; ambiguous lines left for a person), manual match, booking a bank-only line, finish, the reconciled-date lock,
// void and unreconcile protection, reopen and discard. The test account is deactivated at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UATR${Date.now() % 100000}`
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body, attempt = 0) => {
  let r
  const isForm = body instanceof FormData
  try { r = await fetch(`${API}${path}`, { method, headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) }) } catch (e) { if (method === "GET" && attempt < 2) return call(u, method, path, body, attempt + 1); throw e }
  let j = null; try { j = await r.json() } catch {}
  return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message) }
}
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const csv = (opening, closing, rows) => { const fd = new FormData(); fd.append("file", new Blob([`Account Number,${tag}\nAccount Currency,USD\nOpening Balance,${opening}\nClosing Balance,${closing}\n\nTransaction Date,Value Date,Reference,Description,Debit,Credit,Balance\n${rows.join("\n")}\n`], { type: "text/csv" }), `${tag}.csv`); return fd }

const cfo = await login("acct.cfo@nts.local"), acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id
const bank = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} Test Account`, accountNumber: `${tag}-001`, currencyId: USD })
const bankId = bank.data && bank.data.id
check("set-up: a test bank account", !!bankId, `${bank.status} ${bank.err}`)
const entry = async (type, date, amount, reference) => {
  const r = await call(cfo, "POST", `/cashbook/${type === "R" ? "receipts" : "payments"}`, { bankId, transactionDate: date, description: `${tag} ${reference}`, amount, reference, counterpartyType: "GL", glAccountId: type === "R" ? A("4110") : A("5090"), vatCode: "EXEMPT" })
  return (r.data && (r.data.transaction ? r.data.transaction.id : r.data.id)) || null
}
const R1 = await entry("R", "2026-09-10", 1000, "DEP-1"), P1 = await entry("P", "2026-09-12", 250, "CHQ-101"), P2 = await entry("P", "2026-09-12", 250, "CHQ-102")
const P3 = await entry("P", "2026-09-14", 100, "TRF-A"), P4 = await entry("P", "2026-09-14", 100, "TRF-B"), R2 = await entry("R", "2026-09-18", 400, "DEP-2")
check("set-up: six posted cashbook entries on it", [R1, P1, P2, P3, P4, R2].every(Boolean), J([R1, P1, P2, P3, P4, R2]))
const S = (p) => `/cashbook/reconciliation/sessions/${sid}${p}`
let sid = null

try {
  const fut = await call(acct, "POST", `/cashbook/reconciliation/banks/${bankId}/sessions`, { statementDate: "2027-01-31", statementEndBalance: 0, openingBalance: 0 })
  check("a statement dated in the future is refused", fut.status >= 400, `${fut.status} ${fut.err}`)
  const noEmp = await call(emp, "POST", `/cashbook/reconciliation/banks/${bankId}/sessions`, { statementDate: "2026-09-20", statementEndBalance: 0, openingBalance: 0 })
  check("someone outside finance cannot reconcile", noEmp.status === 403, String(noEmp.status))
  const s1 = await call(acct, "POST", `/cashbook/reconciliation/banks/${bankId}/sessions`, { statementDate: "2026-09-20", statementEndBalance: 287.5, openingBalance: 0, reference: tag })
  sid = s1.data && s1.data.id
  check("the first reconciliation starts from the statement's opening balance", s1.status < 300 && !!sid, `${s1.status} ${s1.err}`)
  const dup = await call(acct, "POST", `/cashbook/reconciliation/banks/${bankId}/sessions`, { statementDate: "2026-09-20", statementEndBalance: 0, openingBalance: 0 })
  check("one reconciliation in progress per account", dup.status >= 400, `${dup.status}`)

  const lines = ["11-Sep-2026,11-Sep-2026,DEP-1,DEPOSIT,,1000.00,1000.00", "12-Sep-2026,12-Sep-2026,CHQ-101,CHEQUE,250.00,,750.00", "13-Sep-2026,13-Sep-2026,CHQ-102,CHEQUE,250.00,,500.00", "14-Sep-2026,14-Sep-2026,,TRANSFER OUT,100.00,,400.00", "14-Sep-2026,14-Sep-2026,,TRANSFER OUT,100.00,,300.00", "15-Sep-2026,15-Sep-2026,,BANK CHARGES,12.50,,287.50"]
  const bad = await call(acct, "POST", S("/statement"), csv("0.00", "999.00", lines))
  check("a statement that does not add up (opening + in − out ≠ closing) is refused", bad.status >= 400 && /does not add up/.test(String(bad.err)), `${bad.status} ${bad.err}`)
  const imp = await call(acct, "POST", S("/statement"), csv("0.00", "287.50", lines))
  check("the statement imports: six lines, dated as printed", imp.status === 200 && imp.data.lines === 6 && q(`return (await p.bankStatementItem.findMany({where:{statementId:${J(imp.data && imp.data.statementId)}},orderBy:{transactionDate:'asc'},select:{transactionDate:true}})).map(x=>x.transactionDate.toISOString().slice(0,10))[0]`) === "2026-09-11", `${imp.status} ${imp.err}`)
  const am = await call(acct, "POST", S("/auto-match"), {})
  const wb1 = await call(acct, "GET", S("/workbench"))
  const byRef = (ref) => wb1.data.items.find((i) => i.reference === ref)
  check("auto-match: the deposit one day later, and each cheque by its reference", am.status === 200 && am.data.matched === 3 && byRef("DEP-1").entry && byRef("DEP-1").entry.id === R1 && byRef("CHQ-101").entry.id === P1 && byRef("CHQ-102").entry.id === P2, `${am.status} ${J(am.data)}`)
  check("auto-match leaves two equally likely transfers for a person, and the bank charge with no entry", wb1.data.items.filter((i) => !i.matched).length === 3, J(wb1.data.items.map((i) => [i.description, i.matched])))
  const fin1 = await call(acct, "POST", S("/finish"), {})
  check("it cannot be finished while statement lines are unmatched", fin1.status >= 400 && /not matched/.test(String(fin1.err)), `${fin1.status} ${fin1.err}`)

  const tr = wb1.data.items.filter((i) => !i.matched && i.description === "TRANSFER OUT")
  const wrongDir = await call(acct, "POST", S(`/lines/${tr[0].id}/match`), { cashbookEntryId: R2 })
  check("a payment on the statement cannot be matched to a receipt", wrongDir.status >= 400, `${wrongDir.status} ${wrongDir.err}`)
  const wrongAmt = await call(acct, "POST", S(`/lines/${tr[0].id}/match`), { cashbookEntryId: P1 })
  check("nor to an entry already matched, or of another amount", wrongAmt.status >= 400, `${wrongAmt.status} ${wrongAmt.err}`)
  const m1 = await call(acct, "POST", S(`/lines/${tr[0].id}/match`), { cashbookEntryId: P3 })
  const m2 = await call(acct, "POST", S(`/lines/${tr[1].id}/match`), { cashbookEntryId: P4 })
  check("the transfers are matched by hand", m1.status === 200 && m2.status === 200, `${m1.status} ${m1.err} ${m2.status} ${m2.err}`)
  const chg = wb1.data.items.find((i) => i.description === "BANK CHARGES")
  const bk = await call(acct, "POST", S(`/lines/${chg.id}/book`), { glAccountId: A("5090"), description: "Bank charges September" })
  const bkEntry = bk.data && bk.data.cashbookEntryId
  check("the bank charge is booked into the cashbook from the statement line, and matched", bk.status === 200 && !!bkEntry && q(`return (await p.cashbookEntry.findUnique({where:{id:${J(bkEntry)}},select:{status:true}})).status`) === "POSTED", `${bk.status} ${bk.err}`)
  const wb2 = await call(acct, "GET", S("/workbench"))
  check("every line matched; cleared balance equals the statement; the later deposit is outstanding", wb2.data.summary.matchedLines === 6 && wb2.data.summary.difference === 0 && wb2.data.summary.outstandingReceipts === 400 && wb2.data.summary.canFinish, J(wb2.data.summary))
  const fin = await call(acct, "POST", S("/finish"), {})
  const flags = q(`return (await p.cashbookEntry.findMany({where:{id:{in:${J([R1, P1, P2, P3, P4, R2, bkEntry])}}},select:{id:true,isReconciled:true}})).reduce((m,x)=>(m[x.id]=x.isReconciled,m),{})`)
  check("finished: the six matched entries are reconciled, the outstanding one is not", fin.status === 200 && [R1, P1, P2, P3, P4, bkEntry].every((x) => flags[x]) && !flags[R2], `${fin.status} ${fin.err} ${J(flags)}`)

  const back = await entry("P", "2026-09-19", 5, "LATE")
  check("[finding] nothing can be booked to the account on or before the reconciled date (ACC-PER-04)", !back, back || "accepted")
  const after = await entry("P", new Date().toISOString().slice(0, 10), 5, "AFTER")
  check("booking after the reconciled date still works", !!after, "refused")
  const vd = await call(cfo, "PUT", `/cashbook/entries/${P1}/void`, { reason: "test" })
  check("[finding] a reconciled entry cannot be voided", vd.status >= 400 && q(`return (await p.cashbookEntry.findUnique({where:{id:${J(P1)}}})).status`) === "POSTED", `${vd.status} ${vd.err}`)
  const un = await call(cfo, "PUT", `/cashbook/entries/${P1}/unreconcile`, {})
  check("[finding] an entry cleared by a finished reconciliation is not unreconciled on its own", un.status >= 400 && q(`return (await p.cashbookEntry.findUnique({where:{id:${J(P1)}}})).isReconciled`) === true, `${un.status} ${un.err}`)
  const earlier = await call(acct, "POST", `/cashbook/reconciliation/banks/${bankId}/sessions`, { statementDate: "2026-09-15", statementEndBalance: 0 })
  check("the next statement must end after the reconciled date", earlier.status >= 400, `${earlier.status}`)
  const reA = await call(acct, "POST", S("/reopen"), { reason: "wrong statement" })
  check("a preparer cannot reopen a finished reconciliation", reA.status === 403, `${reA.status}`)
  const re = await call(fm, "POST", S("/reopen"), { reason: `${tag} statement re-issued by the bank` })
  const reFlags = q(`return (await p.cashbookEntry.count({where:{id:{in:${J([R1, P1, P2, P3, P4, bkEntry])}},isReconciled:true}}))`)
  check("an approver reopens it with a reason: back to draft, its entries unreconciled", re.status === 200 && reFlags === 0 && q(`return (await p.cashbookReconciliationSession.findUnique({where:{id:${J(sid)}}})).status`) === "DRAFT", `${re.status} ${re.err} ${reFlags}`)
  const dis = await call(acct, "POST", S("/discard"), {})
  check("the draft is discarded with its statement", dis.status === 200 && q(`return await p.$queryRawUnsafe("SELECT COUNT(*) n FROM cashbook_reconciliation_statements WHERE session_id = ?", ${J(sid)}).then(r=>Number(r[0].n))`) === 0, `${dis.status} ${dis.err}`)
  sid = null
  const st = await call(acct, "GET", "/cashbook/reconciliation/status")
  const mine = (st.data || []).find((r) => r.bank.id === bankId)
  check("the account overview shows what is not reconciled", mine && mine.unreconciled.count >= 7 && !mine.lastReconciled, J(mine))
} finally {
  if (sid) await call(acct, "POST", S("/discard"), {}).catch(() => null)
  // leave nothing behind: the test entries voided (reversals), the test account deactivated
  const ids = q(`return (await p.cashbookEntry.findMany({where:{bankId:${J(bankId)},status:'POSTED',isReconciled:false},select:{id:true}})).map(x=>x.id)`)
  for (const id of ids) await call(cfo, "PUT", `/cashbook/entries/${id}/void`, { reason: "UAT clean-up" })
  if (bankId) q(`await p.bank.update({where:{id:${J(bankId)}},data:{isActive:false}});return 1`)
  console.log(`(test account deactivated; ${ids.length} entries voided)`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
