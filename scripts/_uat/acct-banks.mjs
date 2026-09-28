// Bank accounts (Settings) through the API: who may set them up, a new account getting its own ledger account numbered
// after the last, a duplicate account number refused before anything is created, changes recorded in the audit trail,
// currency and ledger account fixed once entries exist, and switching off refused while money or work is left in it.
// Creates one test bank account and its ledger account and removes both at the end, with the one cashbook line written
// directly (no journal) to give it a balance.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
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
const tag = `UATBK${Date.now().toString().slice(-5)}`

const acct = await login("acct.accountant@nts.local"), cfo = await login("acct.cfo@nts.local"), auditor = await login("acct.auditor@nts.local")
const cur = await call(cfo, "GET", "/accounting/currencies")
const USD = cur.data.find((c) => c.code === "USD").id, ZIG = (cur.data.find((c) => c.code === "ZIG") || cur.data.find((c) => c.code !== "USD")).id
const made = []
try {
  const list = await call(auditor, "GET", "/cashbook/banks?includeInactive=true")
  check("readers see the bank accounts with how many entries each has", list.status === 200 && list.data.length > 0 && list.data.every((b) => b._count && typeof b._count.cashbookEntries === "number"), `${list.status}`)
  const noPrep = await call(acct, "POST", "/cashbook/banks", { name: `${tag} A`, accountNumber: `${tag}-A`, currencyId: USD })
  check("a preparer cannot set up a bank account (approvers do)", noPrep.status === 403, `${noPrep.status}`)
  const lastNo = q(`const r=await p.$queryRawUnsafe("SELECT accountNo FROM chart_of_accounts WHERE accountNo REGEXP '^11[0-9]{4}$' ORDER BY accountNo DESC LIMIT 1");return r[0]&&r[0].accountNo`)
  const a = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} A`, accountNumber: `${tag}-A`, currencyId: USD })
  if (a.data && a.data.id) made.push(a.data)
  check("a new bank account gets its own ledger account, numbered after the last", a.status === 200 && a.data.glAccount && a.data.glAccount.accountNo === String(Number(lastNo || 110000) + 1), `${a.status} ${a.err} ${a.data && a.data.glAccount && a.data.glAccount.accountNo} vs ${lastNo}`)
  const coaBefore = q(`return await p.chartOfAccounts.count()`)
  const dup = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} dup`, accountNumber: `${tag}-A`, currencyId: USD })
  check("a duplicate account number is refused before any ledger account is created", dup.status === 400 && q(`return await p.chartOfAccounts.count()`) === coaBefore, `${dup.status} ${dup.err}`)
  const ren = await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { name: `${tag} A renamed`, branchCode: "001" })
  const aud = q(`return (await p.auditLog.findMany({where:{entityType:'Bank',entityId:${J(a.data.id)}},select:{action:true,oldValues:true,newValues:true},orderBy:{createdAt:'asc'}}))`)
  check("changes are recorded in the audit trail with before and after", ren.status === 200 && aud.length === 2 && aud[0].action === "CREATE" && aud[1].oldValues.name === `${tag} A` && aud[1].newValues.name === `${tag} A renamed`, `${ren.status} ${J(aud).slice(0, 200)}`)
  const cur0 = await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { currencyId: ZIG })
  check("while it has no entries its currency may still change", cur0.status === 200 && q(`return (await p.bank.findUnique({where:{id:${J(a.data.id)}}})).currencyId`) === ZIG, `${cur0.status} ${cur0.err}`)
  await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { currencyId: USD })
  const off0 = await call(cfo, "DELETE", `/cashbook/banks/${a.data.id}`)
  check("an empty bank account is switched off", off0.status === 200 && q(`return (await p.bank.findUnique({where:{id:${J(a.data.id)}}})).isActive`) === false, `${off0.status} ${off0.err}`)
  const on = await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { isActive: true })
  check("and switched back on", on.status === 200, `${on.status} ${on.err}`)

  // with an entry: a cashbook line recorded directly (test data) so no journal is posted
  q(`const b=await p.bank.findUnique({where:{id:${J(a.data.id)}}});const u=await p.user.findFirst({where:{email:'acct.cfo@nts.local'}});return (await p.cashbookEntry.create({data:{bankId:b.id,type:'RECEIPT',amount:100,transactionDate:new Date('2026-09-01T12:00:00Z'),description:${J(tag + " receipt")},reference:${J(tag + "-R")},status:'POSTED',createdById:u.id,counterpartyType:'GL'}})).id`)
  const cur1 = await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { currencyId: ZIG })
  check("once entries exist its currency is fixed", cur1.status === 409 && /currency/.test(String(cur1.err)), `${cur1.status} ${cur1.err}`)
  const gl1 = await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { glAccountId: q(`return (await p.chartOfAccounts.findFirst({where:{accountNo:'1030'}})).id`) })
  check("and so is its ledger account", gl1.status === 409 && /ledger account/.test(String(gl1.err)), `${gl1.status} ${gl1.err}`)
  const off1 = await call(cfo, "DELETE", `/cashbook/banks/${a.data.id}`)
  check("an account with a balance and unreconciled entries cannot be switched off", off1.status === 409 && /balance/.test(String(off1.err)) && /not reconciled/.test(String(off1.err)), `${off1.status} ${off1.err}`)
  const off2 = await call(cfo, "PUT", `/cashbook/banks/${a.data.id}`, { isActive: false })
  check("nor through a change", off2.status === 409, `${off2.status} ${off2.err}`)
  const audArea = await call(auditor, "GET", `/accounting/audit?area=cash&q=${encodeURIComponent(a.data.id)}`)
  check("bank account changes appear under Cash and bank in the audit trail", audArea.status === 200 && audArea.data.items.some((e) => e.entityType === "Bank"), `${audArea.status} ${J(audArea.data && audArea.data.items.map((e) => e.entityType))}`)
} finally {
  for (const b of made) q(`await p.auditLog.count();await p.cashbookEntry.deleteMany({where:{bankId:${J(b.id)},reference:{startsWith:${J(tag)}}}});await p.bank.delete({where:{id:${J(b.id)}}}).catch(()=>null);return (await p.chartOfAccounts.deleteMany({where:{id:${J(b.glAccountId)},journalEntryLines:{none:{}}}})).count`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
