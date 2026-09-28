// Receivables through the API: customer, invoice (draft → sent with its posting), receipt without VAT, allocation (partial,
// over-allocation, another customer's invoice), undo, credit note (raised as a draft, issued by an approver, applied),
// void rules, the same-currency "mark as paid" shortcut refused, and the routes that were unreachable. On a test bank.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UATAR${Date.now() % 100000}`
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message || j.details) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const today = new Date().toISOString().slice(0, 10)
const inv = (id) => q(`const i=await p.invoice.findUnique({where:{id:${J(id)}},include:{journalEntry:{select:{status:true}}}});return i&&{st:i.status,out:Number(i.outstandingAmount),paid:Number(i.paidAmount),due:i.dueDate&&i.dueDate.toISOString().slice(0,10),je:i.journalEntry&&i.journalEntry.status}`)

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), emp = await login("perf.employee@nts.local")
const cur = await call(cfo, "GET", "/accounting/currencies"); const USD = cur.data.find((c) => c.code === "USD").id
const bank = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} Test Account`, accountNumber: `${tag}-001`, currencyId: USD }); const bankId = bank.data && bank.data.id
const c1 = await call(acct, "POST", "/accounting/customers", { name: `${tag} Customer A`, email: "uat-ar@example.test", paymentTerms: 14 })
const c2 = await call(acct, "POST", "/accounting/customers", { name: `${tag} Customer B`, paymentTerms: 30 })
const A = c1.data && c1.data.id, Bc = c2.data && c2.data.id
check("set-up: a test bank and two customers", bankId && A && Bc, `${bank.status} ${c1.status} ${c1.err}`)
const mkInv = (u, customerId, price, extra = {}) => call(u, "POST", "/accounting/invoices", { customerId, currencyId: USD, invoiceDate: today, description: `${tag} consulting`, items: [{ description: "Advisory", quantity: 2, unitPrice: price }], isTaxable: false, ...extra })
const made = { inv: [], cn: [] }

try {
  const i1 = await mkInv(acct, A, 500); const I1 = i1.data && i1.data.id; made.inv.push(I1)
  const d = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  check("[finding] an invoice is saved as a draft with its due date (customer terms: 14 days)", i1.status === 201 && inv(I1).st === "DRAFT" && inv(I1).due === d && inv(I1).je === "PENDING", `${i1.status} ${i1.err} ${J(inv(I1))}`)
  const i1b = await mkInv(acct, A, 100, { dueDate: "2026-12-31" }); made.inv.push(i1b.data && i1b.data.id)
  check("an explicit due date is kept", inv(i1b.data.id).due === "2026-12-31", J(inv(i1b.data.id)))
  const noEmp = await mkInv(emp, A, 10)
  check("someone outside finance cannot invoice", noEmp.status === 403, String(noEmp.status))
  const sA = await call(acct, "PATCH", `/accounting/invoices/${I1}/send`, {})
  check("a preparer cannot send (it posts to the ledger)", sA.status >= 400 && inv(I1).st === "DRAFT", `${sA.status} ${sA.err}`)
  const s1 = await call(fm, "PATCH", `/accounting/invoices/${I1}/send`, {})
  check("an approver sends it: posted, 1,000 owed", s1.status === 200 && inv(I1).st === "SENT" && inv(I1).je === "POSTED" && inv(I1).out === 1000, `${s1.status} ${s1.err} ${J(inv(I1))}`)
  const sum = await call(acct, "GET", "/accounting/invoices/summary")
  check("[finding] the invoice summary route answers (it was read as an invoice id)", sum.status === 200, `${sum.status} ${sum.err}`)

  const rc = await call(acct, "POST", "/cashbook/receipts", { bankId, transactionDate: today, amount: 600, reference: `${tag}-R1`, description: `${tag} receipt`, counterpartyType: "CUSTOMER", customerId: A })
  const R1 = rc.data && ((rc.data.transaction && rc.data.transaction.id) || rc.data.id)
  const rje = q(`const e=await p.cashbookEntry.findUnique({where:{id:${J(R1 || "")}},include:{journalEntry:{include:{journalEntryLines:{include:{chartOfAccount:{select:{accountNo:true}}}}}}}});return e&&e.journalEntry.journalEntryLines.map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])`)
  check("[finding] a customer receipt posts Dr bank 600 / Cr receivables 600, with no VAT", rc.status < 300 && rje && rje.length === 2 && rje.some((l) => l[0] === "1200" && l[2] === 600), `${rc.status} ${rc.err} ${J(rje)}`)
  const oi = await call(acct, "GET", `/cashbook/open-items/customers/${A}`)
  check("[finding] the customer's open items come back as data: the sent invoice, not the draft", oi.status === 200 && Array.isArray(oi.data) && oi.data.some((o) => o.id === I1) && !oi.data.some((o) => o.id === i1b.data.id), `${oi.status} ${J(oi.data).slice(0, 160)}`)
  const other = await mkInv(acct, Bc, 50); made.inv.push(other.data.id); await call(fm, "PATCH", `/accounting/invoices/${other.data.id}/send`, {})
  const wrongCust = await call(acct, "POST", `/cashbook/open-items/match/${R1}`, { allocations: [{ openItemId: other.data.id, allocatedAmount: 100 }] })
  check("[finding] a receipt cannot be allocated to another customer's invoice", wrongCust.status >= 400 && inv(other.data.id).out === 100, `${wrongCust.status} ${wrongCust.err}`)
  const tooMuch = await call(acct, "POST", `/cashbook/open-items/match/${R1}`, { allocations: [{ openItemId: I1, allocatedAmount: 700 }] })
  check("nor for more than the receipt", tooMuch.status >= 400 && inv(I1).out === 1000, `${tooMuch.status} ${tooMuch.err}`)
  const m1 = await call(acct, "POST", `/cashbook/open-items/match/${R1}`, { allocations: [{ openItemId: I1, allocatedAmount: 600 }] })
  check("the receipt settles 600 of it: part paid, 400 left", m1.status === 200 && inv(I1).st === "PARTIALLY_PAID" && inv(I1).out === 400 && inv(I1).paid === 600, `${m1.status} ${m1.err} ${J(inv(I1))}`)
  const again = await call(acct, "POST", `/cashbook/open-items/match/${R1}`, { allocations: [{ openItemId: I1, allocatedAmount: 50 }] })
  check("[finding] the receipt cannot be allocated twice over", again.status >= 400 && inv(I1).out === 400, `${again.status} ${again.err}`)
  const allocs = await call(acct, "GET", `/cashbook/open-items/allocations/${R1}`)
  const allocId = Array.isArray(allocs.data) && allocs.data[0] && allocs.data[0].id
  const un = await call(acct, "POST", `/cashbook/open-items/unmatch/${R1}`, { allocationIds: [allocId] })
  check("[finding] an allocation can be undone: the invoice owes 1,000 again", un.status === 200 && inv(I1).st === "SENT" && inv(I1).out === 1000, `${un.status} ${un.err} ${J(inv(I1))}`)
  await call(acct, "POST", `/cashbook/open-items/match/${R1}`, { allocations: [{ openItemId: I1, allocatedAmount: 600 }] })
  const mp = await call(fm, "PATCH", `/accounting/invoices/${I1}/mark-as-paid`, { paymentMethod: "BANK", bankId })
  check("[finding] 'mark as paid' in the invoice's currency is refused (it credited receivables a second time)", mp.status >= 400 && inv(I1).out === 400, `${mp.status} ${mp.err}`)

  const cn = await call(acct, "POST", "/accounting/credit-notes", { invoiceId: I1, amount: 400, vatAmount: 0, totalAmount: 400, reason: `${tag} goodwill` })
  const CN = cn.data && cn.data.id; if (CN) made.cn.push(CN)
  const cnJe = () => q(`const n=await p.creditNote.findUnique({where:{id:${J(CN || "")}},include:{journalEntry:{select:{status:true}}}});return n&&{st:n.status,je:n.journalEntry&&n.journalEntry.status,rem:Number(n.remainingAmount)}`)
  check("[finding] a credit note is raised as a draft: its journal waits for an approver", cn.status < 300 && cnJe().st === "DRAFT" && cnJe().je === "PENDING", `${cn.status} ${cn.err} ${J(cnJe())}`)
  const sendA = await call(acct, "POST", `/accounting/credit-notes/${CN}/send`, {})
  check("a preparer cannot issue it", sendA.status === 403, String(sendA.status))
  const send = await call(fm, "POST", `/accounting/credit-notes/${CN}/send`, {})
  check("an approver issues it: posted", send.status === 200 && cnJe().st === "SENT" && cnJe().je === "POSTED", `${send.status} ${send.err} ${J(cnJe())}`)
  const ap = await call(acct, "POST", `/accounting/credit-notes/${CN}/apply`, { invoiceId: I1, amount: 400 })
  check("[finding] applying it settles the invoice (it always failed on a missing table)", ap.status === 200 && inv(I1).st === "PAID" && inv(I1).out === 0 && cnJe().st === "APPLIED", `${ap.status} ${ap.err} ${J(inv(I1))}`)
  const vPaid = await call(fm, "PATCH", `/accounting/invoices/${I1}/void`, { reason: "test" })
  check("[finding] a paid invoice cannot be voided", vPaid.status >= 400 && inv(I1).st === "PAID", `${vPaid.status} ${vPaid.err}`)
  const vA = await call(acct, "PATCH", `/accounting/invoices/${other.data.id}/void`, { reason: "test" })
  check("a preparer cannot void a sent invoice", vA.status === 403, String(vA.status))
  const vS = await call(fm, "PATCH", `/accounting/invoices/${other.data.id}/void`, { reason: `${tag} raised in error` })
  const oJe = q(`const i=await p.invoice.findUnique({where:{id:${J(other.data.id)}},include:{journalEntry:true}});const r=await p.journalEntry.findFirst({where:{referenceNumber:'VR-'+i.journalEntry.referenceNumber}});return {st:i.status,je:i.journalEntry.status,rev:r&&r.status}`)
  check("[finding] voiding a sent invoice reverses its own posting", vS.status === 200 && oJe.st === "VOID" && oJe.je === "VOID" && oJe.rev === "POSTED", `${vS.status} ${vS.err} ${J(oJe)}`)
  const vD = await call(fm, "PATCH", `/accounting/invoices/${i1b.data.id}/void`, { reason: "not needed" })
  const dJe = q(`const i=await p.invoice.findUnique({where:{id:${J(i1b.data.id)}},include:{journalEntry:true}});const r=await p.journalEntry.findFirst({where:{referenceNumber:'VR-'+i.journalEntry.referenceNumber}});return {st:i.status,je:i.journalEntry.status,rev:!!r}`)
  check("voiding a draft withdraws its unposted journal (nothing to reverse)", vD.status === 200 && dJe.st === "VOID" && dJe.je === "VOID" && !dJe.rev, `${vD.status} ${J(dJe)}`)
  const un2 = await call(acct, "GET", "/accounting/receivables/unallocated")
  check("the receipts-to-allocate list is empty for this customer", un2.status === 200 && !(un2.data || []).some((r) => r.customer && r.customer.id === A), J((un2.data || []).filter((r) => r.customer && r.customer.id === A)))
} finally {
  // leave the test bank off; its receipt stays (reconciliation-free test account)
  if (bankId) q(`await p.bank.update({where:{id:${J(bankId)}},data:{isActive:false}});return 1`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
