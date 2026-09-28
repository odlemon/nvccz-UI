// Chart of accounts through the API: who may add and change accounts, number ranges per type, a preparer's change
// waiting for CFO approval (and one that could never apply refused up front), direct changes by the CFO, switching an
// account off only when nothing depends on it, no posting to a switched-off account, deleting only unused accounts, and
// every step in the account's history. Creates one test account in the 5000s and deletes it at the end; the journal
// checks use a standing account 5999 (switched off between runs), since journals are withdrawn, never deleted.
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
const tag = `UATCOA${Date.now().toString().slice(-5)}`
const acctOf = (id) => q(`return await p.chartOfAccounts.findUnique({where:{id:${J(id)}}})`)
const audits = (id) => q(`return (await p.auditLog.findMany({where:{entityType:'ChartOfAccounts',entityId:${J(id)}},select:{action:true}})).map((a)=>a.action)`)

const acct = await login("acct.accountant@nts.local"), cfo = await login("acct.cfo@nts.local"), auditor = await login("acct.auditor@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id
const taken = new Set(coa.data.map((a) => a.accountNo))
let no = "5900"; for (let i = 5900; i < 5998 && taken.has(no); i++) no = String(i + 1)
let id = null, draftId = null
try {
  const list = await call(auditor, "GET", "/accounting/chart-of-accounts")
  const bank = list.data && list.data.find((a) => a.accountNo === "1100")
  check("readers see the chart with how much each account is used", list.status === 200 && bank && bank._count && bank._count.journalEntryLines > 0, `${list.status}`)
  const noEmp = await call(emp, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: tag, accountType: "Expense", financialStatement: "Income Statement" })
  check("someone outside finance cannot add an account", noEmp.status === 403, String(noEmp.status))
  const noAud = await call(auditor, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: tag, accountType: "Expense", financialStatement: "Income Statement" })
  check("an auditor (read-only) cannot add an account", noAud.status === 403, String(noAud.status))
  const range = await call(acct, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: tag, accountType: "Revenue", financialStatement: "Income Statement" })
  check("an account numbered outside its type's range is refused", range.status === 400 && /range/.test(String(range.err)), `${range.status} ${range.err}`)
  const add = await call(acct, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: `${tag} supplies`, accountType: "Expense", financialStatement: "Income Statement", naturalBalance: "DEBIT" })
  id = add.data && add.data.id
  check("a preparer adds an expense account (debit balance) and it is in its history", add.status === 201 && add.data.naturalBalance === "DEBIT" && audits(id).includes("CREATE"), `${add.status} ${add.err}`)
  const dup = await call(acct, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: "again", accountType: "Expense", financialStatement: "Income Statement" })
  check("an account number already used is refused", dup.status === 409, `${dup.status} ${dup.err}`)

  // a preparer's change waits for the CFO
  const ch = await call(acct, "PUT", `/accounting/chart-of-accounts/${id}`, { accountName: `${tag} office supplies` })
  check("a preparer's change is sent for approval, the account unchanged until then", ch.status === 202 && ch.data.status === "pending_approval" && acctOf(id).accountName === `${tag} supplies` && audits(id).includes("CHANGE_REQUESTED"), `${ch.status} ${ch.err}`)
  const never = await call(acct, "PUT", `/accounting/chart-of-accounts/${id}`, { accountType: "Revenue" })
  check("a change that could never be applied (type outside the number range) is refused, not queued", never.status === 400 && q(`return await p.approvalRequest.count({where:{stageType:'MASTER_DATA_COA',entityId:${J(id)}}})`) === 1, `${never.status} ${never.err}`)
  const queue = await call(cfo, "GET", "/accounting/me/queue")
  const item = queue.data && queue.data.find((x) => x.stageType === "MASTER_DATA_COA" && x.title && String(x.title).includes(tag))
  check("the change reaches the CFO's approval queue", !!item, JSON.stringify((queue.data || []).filter((x) => x.stageType === "MASTER_DATA_COA")).slice(0, 200))
  if (item) {
    const ap = await call(cfo, "POST", `/approvals/${item.id}/approve`, { comments: "UAT" })
    check("once the CFO approves, the account changes and the history shows it", ap.status < 300 && acctOf(id).accountName === `${tag} office supplies` && audits(id).includes("CHANGE_APPROVED"), `${ap.status} ${ap.err}`)
  }
  const direct = await call(cfo, "PUT", `/accounting/chart-of-accounts/${id}`, { notes: "UAT direct" })
  check("the CFO changes an account directly, recorded in its history", direct.status === 200 && acctOf(id).notes === "UAT direct" && audits(id).includes("UPDATE"), `${direct.status} ${direct.err}`)

  // switching off
  const withBal = await call(cfo, "PUT", `/accounting/chart-of-accounts/${A("1100")}`, { isActive: false })
  check("an account with a balance cannot be switched off", withBal.status === 409 && /balance/.test(String(withBal.err)) && acctOf(A("1100")).isActive, `${withBal.status} ${withBal.err}`)
  // a standing test account (5999, switched off between runs) carries the journal checks: journals are never deleted,
  // so an account once used by one stays in the chart
  let fx = coa.data.find((a) => a.accountNo === "5999")
  if (!fx) fx = (await call(cfo, "POST", "/accounting/chart-of-accounts", { accountNo: "5999", accountName: "UAT test account (not for use)", accountType: "Expense", financialStatement: "Income Statement" })).data
  q(`return (await p.chartOfAccounts.update({where:{id:${J(fx.id)}},data:{isActive:true}})).isActive`)
  const draft = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: new Date().toISOString().slice(0, 10), referenceNumber: `${tag}-D`, description: `${tag} draft`, currencyId: USD, journalEntryLines: [{ chartOfAccountId: fx.id, debitAmount: 10, creditAmount: 0, description: "x" }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 10, description: "x" }] })
  draftId = draft.data && (draft.data.id || (draft.data.journalEntry && draft.data.journalEntry.id))
  const withDraft = await call(cfo, "PUT", `/accounting/chart-of-accounts/${fx.id}`, { isActive: false })
  check("an account a draft journal uses cannot be switched off", !!draftId && withDraft.status === 409 && /waiting to be posted/.test(String(withDraft.err)), `${draft.status} ${draft.err} / ${withDraft.status} ${withDraft.err}`)
  if (draftId) await call(acct, "POST", `/accounting/journal-entries/${draftId}/discard`, { reason: "UAT" })
  const off = await call(cfo, "PUT", `/accounting/chart-of-accounts/${fx.id}`, { isActive: false })
  check("once the draft is withdrawn the account is switched off", off.status === 200 && acctOf(fx.id).isActive === false, `${off.status} ${off.err}`)
  const post = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: new Date().toISOString().slice(0, 10), referenceNumber: `${tag}-X`, description: `${tag} to a switched-off account`, currencyId: USD, journalEntryLines: [{ chartOfAccountId: fx.id, debitAmount: 10, creditAmount: 0, description: "x" }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 10, description: "x" }] })
  check("a journal to a switched-off account is refused", post.status >= 400 && /switched off/.test(String(post.err)), `${post.status} ${post.err}`)
  const usedDel = await call(acct, "DELETE", `/accounting/chart-of-accounts/${fx.id}`)
  check("an account a journal has used (even a withdrawn one) cannot be deleted", usedDel.status === 400 && !!acctOf(fx.id), `${usedDel.status} ${usedDel.err}`)
  const del = await call(acct, "DELETE", `/accounting/chart-of-accounts/${id}`)
  check("an unused account is deleted, recorded in its history", del.status === 200 && !acctOf(id) && audits(id).includes("DELETE"), `${del.status} ${del.err}`)
  if (del.status === 200) id = null
} finally {
  // withdraw (never delete) anything left waiting; the fresh test account itself goes
  const left = q(`return (await p.journalEntry.findMany({where:{referenceNumber:{startsWith:${J(tag)}},status:'PENDING'},select:{id:true}})).map((j)=>j.id)`)
  for (const jid of left) await call(acct, "POST", `/accounting/journal-entries/${jid}/discard`, { reason: "UAT clean-up" })
  q(`const rs=await p.approvalRequest.findMany({where:{stageType:'MASTER_DATA_COA',status:'PENDING',entityData:{path:'$.accountName',string_contains:${J(tag)}}},select:{id:true}});for(const r of rs){await p.approval.updateMany({where:{requestId:r.id},data:{status:'CANCELLED'}}).catch(()=>null);await p.approvalRequest.update({where:{id:r.id},data:{status:'CANCELLED'}}).catch(()=>null)}return rs.length`)
  if (id) q(`return (await p.chartOfAccounts.deleteMany({where:{id:${J(id)}}})).count`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
