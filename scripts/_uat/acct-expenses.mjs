// Expenses through the API: recorded (submitted, with a draft journal and, when paid from a bank, a draft cashbook line),
// approved by someone else (posted: the expense, its journal and the bank line together) or returned (rejected: none of it
// posted), the person who recorded it cannot approve it, the paying bank must be in the expense currency, and the summary
// route answers. On a test bank account.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UATEX${Date.now() % 100000}`
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message || j.details) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const today = new Date().toISOString().slice(0, 10)
const state = (id) => q(`const e=await p.expense.findUnique({where:{id:${J(id)}},include:{journalEntry:{include:{cashbookEntries:true}}}});return e&&{st:e.status,je:e.journalEntry&&e.journalEntry.status,cb:e.journalEntry?e.journalEntry.cashbookEntries.map(c=>[c.bankId,c.status,Number(c.amount)]):[]}`)

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), emp = await login("perf.employee@nts.local")
const cur = await call(cfo, "GET", "/accounting/currencies"); const USD = cur.data.find((c) => c.code === "USD").id, ZIG = cur.data.find((c) => c.code === "ZIG").id
const bank = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} Test Account`, accountNumber: `${tag}-001`, currencyId: USD }); const bankId = bank.data && bank.data.id
const vend = await call(acct, "GET", "/cashbook/vendors"); const vendorId = vend.data && vend.data[0] && vend.data[0].id
check("set-up: a test bank and a supplier", bankId && vendorId, `${bank.status} ${vend.status}`)
const mk = (u, over = {}) => call(u, "POST", "/accounting/expenses", { vendorId, category: "Operations", amount: 80, currencyId: USD, transactionDate: today, description: `${tag} courier`, isTaxable: false, paymentMethod: "BANK", bankId, ...over })

try {
  const e1 = await mk(acct); const E1 = e1.data && e1.data.id
  const s1 = state(E1)
  check("[finding] a recorded expense is awaiting approval (not 'posted'), with its draft journal and a draft cashbook line on the bank", e1.status < 300 && s1 && s1.st === "SUBMITTED" && s1.je === "PENDING" && s1.cb.length === 1 && s1.cb[0][0] === bankId && s1.cb[0][1] === "PENDING" && s1.cb[0][2] === 80, `${e1.status} ${e1.err} ${J(s1)}`)
  const zig = await mk(acct, { currencyId: ZIG })
  check("the paying bank must be in the expense currency", zig.status >= 400, `${zig.status} ${zig.err}`)
  const noEmp = await mk(emp)
  check("someone outside finance cannot record expenses", noEmp.status === 403, String(noEmp.status))
  const jeId = q(`return (await p.expense.findUnique({where:{id:${J(E1)}}})).journalEntryId`)
  const e2 = await mk(cfo); const E2 = e2.data && e2.data.id
  const je2 = q(`return (await p.expense.findUnique({where:{id:${J(E2)}}})).journalEntryId`)
  const self2 = await call(cfo, "PATCH", `/accounting/journal-entries/${je2}/post`, {})
  check("the person who recorded an expense cannot approve it (the CFO included)", self2.status >= 400 && state(E2).st === "SUBMITTED", `${self2.status} ${self2.err}`)
  const ap = await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/post`, {})
  const s1b = state(E1)
  check("approving posts the expense, its journal and the bank payment together", ap.status < 300 && s1b.st === "APPROVED" && s1b.je === "POSTED" && s1b.cb[0][1] === "POSTED", `${ap.status} ${ap.err} ${J(s1b)}`)
  const pos = await call(acct, "GET", "/cashbook/position")
  const mine = (pos.data || []).find((r) => r.bank.id === bankId)
  check("the bank's cashbook and ledger agree after the expense", mine && mine.cashbookBalance === -80 && mine.difference === 0, J(mine))
  const rt = await call(fm, "PATCH", `/accounting/journal-entries/${je2}/void`, { reason: `${tag} receipt missing` })
  const s2 = state(E2)
  check("returning one rejects it: nothing posted, its bank line withdrawn", rt.status < 300 && s2.st === "REJECTED" && s2.je === "VOID" && s2.cb.every((c) => c[1] === "VOIDED"), `${rt.status} ${rt.err} ${J(s2)}`)
  const sum = await call(acct, "GET", "/accounting/expenses/summary")
  check("[finding] the expense summary route answers (it was read as an expense id)", sum.status === 200, `${sum.status} ${sum.err}`)
} finally {
  if (bankId) q(`await p.bank.update({where:{id:${J(bankId)}},data:{isActive:false}});return 1`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
