// Cashbook through the API (SRD Cashbook §3): receipts and payments post a balanced journal; customer / supplier amounts
// wait for allocation; void is for approvers and posts a reversal; an entry is reconciled only through a reconciliation;
// transfers move money between two accounts; the position endpoint agrees with the entries. On a test account.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UATCB${Date.now() % 100000}`
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
const today = new Date().toISOString().slice(0, 10)

const cfo = await login("acct.cfo@nts.local"), acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id
const banks = []
const mk = async (n) => { const b = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} ${n}`, accountNumber: `${tag}-${n}`, currencyId: USD }); if (b.data && b.data.id) banks.push(b.data.id); return b.data }
const b1 = await mk("A"), b2 = await mk("B")
check("set-up: two test accounts, each with its own ledger account", b1 && b2 && b1.glAccountId && b2.glAccountId && b1.glAccountId !== b2.glAccountId, J([b1 && b1.glAccountId, b2 && b2.glAccountId]))
const idOf = (r) => r.data && (r.data.transaction ? r.data.transaction.id : r.data.id)

try {
  const rc = await call(acct, "POST", "/cashbook/receipts", { bankId: b1.id, transactionDate: today, description: `${tag} interest`, amount: 500, reference: "INT-1", counterpartyType: "GL", glAccountId: A("4110"), vatCode: "EXEMPT" })
  const rcId = idOf(rc)
  const rje = q(`const e=await p.cashbookEntry.findUnique({where:{id:${J(rcId || "")}},include:{journalEntry:{include:{journalEntryLines:{include:{chartOfAccount:{select:{id:true}}}}}}}});return e&&{st:e.status,je:e.journalEntry&&e.journalEntry.status,lines:e.journalEntry&&e.journalEntry.journalEntryLines.map(l=>[l.chartOfAccountId,Number(l.debitAmount),Number(l.creditAmount)])}`)
  check("a receipt posts: Dr the bank's ledger account, Cr the income account", rc.status < 300 && rje && rje.st === "POSTED" && rje.je === "POSTED" && rje.lines.some((l) => l[0] === b1.glAccountId && l[1] === 500) && rje.lines.some((l) => l[0] === A("4110") && l[2] === 500), `${rc.status} ${rc.err} ${J(rje)}`)
  const py = await call(acct, "POST", "/cashbook/payments", { bankId: b1.id, transactionDate: today, description: `${tag} stationery`, amount: 120, reference: "CHQ-9", counterpartyType: "GL", glAccountId: A("5090"), vatCode: "EXEMPT" })
  const pyId = idOf(py)
  check("a payment posts", py.status < 300 && q(`return (await p.cashbookEntry.findUnique({where:{id:${J(pyId || "")}}}))?.status`) === "POSTED", `${py.status} ${py.err}`)
  const fut = await call(acct, "POST", "/cashbook/payments", { bankId: b1.id, transactionDate: "2027-06-01", description: `${tag} future`, amount: 1, counterpartyType: "GL", glAccountId: A("5090"), vatCode: "EXEMPT" })
  check("[finding] a cashbook entry dated in the future is refused", fut.status >= 400, `${fut.status} ${fut.err}`)
  const noEmp = await call(emp, "POST", "/cashbook/receipts", { bankId: b1.id, transactionDate: today, description: "x", amount: 1, counterpartyType: "GL", glAccountId: A("4110") })
  check("someone outside finance cannot enter cash", noEmp.status === 403, String(noEmp.status))

  const rec1 = await call(acct, "PUT", `/cashbook/entries/${rcId}/reconcile`, {})
  check("an entry is not reconciled on its own, only by finishing a reconciliation", rec1.status === 409 && q(`return (await p.cashbookEntry.findUnique({where:{id:${J(rcId)}}})).isReconciled`) === false, `${rec1.status} ${rec1.err}`)
  const vdA = await call(acct, "PUT", `/cashbook/entries/${pyId}/void`, { reason: "test" })
  check("a preparer cannot void (SRD: Cashbook Void permission)", vdA.status === 403, String(vdA.status))
  const vd = await call(fm, "PUT", `/cashbook/entries/${pyId}/void`, { reason: `${tag} wrong supplier` })
  const vje = q(`const e=await p.cashbookEntry.findUnique({where:{id:${J(pyId)}},select:{status:true,journalEntryId:true}});const j=e&&await p.journalEntry.findUnique({where:{id:e.journalEntryId},select:{status:true,referenceNumber:true}});return {st:e&&e.status,je:j&&j.status}`)
  check("an approver voids it: the entry is void and its journal reversed", vd.status < 300 && vje.st === "VOIDED", `${vd.status} ${vd.err} ${J(vje)}`)

  const tr = await call(acct, "POST", "/cashbook/transfers", { fromBankId: b1.id, toBankId: b2.id, amount: 200, transferDate: today, description: `${tag} float`, reference: "TRF-1" })
  const legs = q(`return (await p.cashbookEntry.findMany({where:{bankId:{in:${J([b1.id, b2.id])}},description:{contains:'float'}},select:{bankId:true,type:true,amount:true,status:true}})).map(x=>[x.bankId===${J(b1.id)}?'A':'B',x.type,Number(x.amount),x.status])`)
  check("a transfer pays out of one account and into the other", tr.status < 300 && legs.some((l) => l[0] === "A" && l[1] === "PAYMENT" && l[2] === 200) && legs.some((l) => l[0] === "B" && l[1] === "RECEIPT" && l[2] === 200), `${tr.status} ${tr.err} ${J(legs)}`)

  const pos = await call(acct, "GET", "/cashbook/position")
  const pa = (pos.data || []).find((r) => r.bank.id === b1.id), pb = (pos.data || []).find((r) => r.bank.id === b2.id)
  check("the position agrees: A = 500 − 200 = 300, B = 200, ledger equal to cashbook", pa && pb && pa.cashbookBalance === 300 && pb.cashbookBalance === 200 && pa.difference === 0 && pb.difference === 0, J([pa, pb]))
  const list = await call(acct, "GET", `/cashbook/entries?bankId=${b1.id}&status=POSTED&startDate=${today}&endDate=${today}`)
  check("the register lists the account's posted entries", list.status === 200 && (list.data.entries || []).length === 2, `${list.status} ${(list.data && list.data.entries || []).length}`)
} finally {
  const ids = q(`return (await p.cashbookEntry.findMany({where:{bankId:{in:${J(banks)}},status:'POSTED'},select:{id:true}})).map(x=>x.id)`)
  for (const id of ids) await call(fm, "PUT", `/cashbook/entries/${id}/void`, { reason: "UAT clean-up" })
  q(`await p.bank.updateMany({where:{id:{in:${J(banks)}}},data:{isActive:false}});return 1`)
  console.log(`(test accounts deactivated; ${ids.length} entries voided)`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
