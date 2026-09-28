// Fixed assets through the API (SRD ACC-FA-01…14): purchase paid from a bank (and its cashbook line), a named funding
// source required, the base currency by default, the monthly run with its preview (completed months only, never twice),
// disposal with gain or loss and the proceeds banked, register edits that cannot take an asset off the books, and who
// may do what. On a test bank account; the test asset is disposed at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UATFA${Date.now() % 100000}`
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message || j.details) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const ym = (d) => d.toISOString().slice(0, 7)
const now = new Date(), prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)), bought = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))

const cfo = await login("acct.cfo@nts.local"), acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const byName = (re) => coa.data.find((a) => re.test(a.accountName))
const USD = cur.data.find((c) => c.code === "USD").id
const bank = await call(cfo, "POST", "/cashbook/banks", { name: `${tag} Test Account`, accountNumber: `${tag}-001`, currencyId: USD })
const bankId = bank.data && bank.data.id
const acc = { assetAccountId: (byName(/office equipment/i) || {}).id, accumulatedDepreciationAccountId: (byName(/accumulated depreciation/i) || {}).id, depreciationExpenseAccountId: (byName(/depreciation expense/i) || {}).id }
check("set-up: a test bank and the asset accounts", bankId && acc.assetAccountId && acc.accumulatedDepreciationAccountId && acc.depreciationExpenseAccountId, J(acc))
const base = { assetName: `${tag} Laptop`, assetCode: `${tag}-L1`, purchaseDate: bought.toISOString().slice(0, 10), cost: 1200, salvageValue: 0, usefulLifeYears: 2, depreciationMethod: "STRAIGHT_LINE", location: "Harare HQ", ...acc }
let assetId = null

try {
  const noFund = await call(acct, "POST", "/accounting/assets", { ...base, assetCode: `${tag}-X` })
  check("[finding] a purchase must say how it was paid for (no guessed cash account)", noFund.status >= 400 && /paid for/.test(String(noFund.err)), `${noFund.status} ${noFund.err}`)
  const noEmp = await call(emp, "POST", "/accounting/assets", { ...base, paymentBankId: bankId })
  check("someone outside finance cannot add assets", noEmp.status === 403, String(noEmp.status))
  const add = await call(acct, "POST", "/accounting/assets", { ...base, paymentBankId: bankId })
  assetId = add.data && add.data.id
  const line = q(`const j=await p.journalEntry.findFirst({where:{referenceNumber:${J(`ASSET-${base.assetCode}`)}},include:{cashbookEntries:true}});return j&&{je:j.status,cur:j.currencyId,cb:j.cashbookEntries.map(c=>[c.bankId,c.type,Number(c.amount),c.status])}`)
  check("a preparer adds an asset paid from a bank: posted, in USD, and the payment is a cashbook line", add.status < 300 && line && line.je === "POSTED" && line.cur === USD && line.cb.length === 1 && line.cb[0][0] === bankId && line.cb[0][1] === "PAYMENT" && line.cb[0][2] === 1200 && line.cb[0][3] === "POSTED", `${add.status} ${add.err} ${J(line)}`)
  const pos = await call(acct, "GET", "/cashbook/position")
  const mine = (pos.data || []).find((r) => r.bank.id === bankId)
  check("[finding] the bank's ledger balance and cashbook agree after the purchase", mine && mine.cashbookBalance === -1200 && mine.difference === 0, J(mine))
  const cbId = q(`return (await p.cashbookEntry.findFirst({where:{bankId:${J(bankId)}},select:{id:true}}))?.id`)
  const vd = await call(fm, "PUT", `/cashbook/entries/${cbId}/void`, { reason: "test" })
  check("the purchase's bank line is reversed from the asset register, not the cashbook", vd.status >= 400 && /belongs to/.test(String(vd.err)), `${vd.status} ${vd.err}`)

  const cur1 = await call(fm, "POST", "/accounting/assets/depreciation/monthly", { period: ym(now) })
  check("[finding] depreciation is not posted for a month that has not ended", cur1.status === 400, `${cur1.status} ${cur1.err}`)
  const noRun = await call(acct, "POST", "/accounting/assets/depreciation/monthly", { period: ym(prev) })
  check("a preparer cannot run depreciation", noRun.status === 403, String(noRun.status))
  const pv = await call(acct, "GET", `/accounting/assets/depreciation/preview?period=${ym(prev)}`)
  const pvRow = pv.data && pv.data.assets.find((r) => r.assetId === assetId)
  check("the preview shows last month's charge for the asset, without posting (1,200 over 24 months = 50)", pv.status === 200 && pvRow && pvRow.outcome === "to_post" && pvRow.amount === 50 && q(`return await p.depreciationRecord.count({where:{assetId:${J(assetId)}}})`) === 0, `${pv.status} ${J(pvRow)}`)
  const run = await call(fm, "POST", "/accounting/assets/depreciation/monthly", { period: ym(prev) })
  const rec = q(`return (await p.depreciationRecord.findMany({where:{assetId:${J(assetId)}},select:{period:true,depreciationAmount:true,isPosted:true}})).map(r=>[r.period,Number(r.depreciationAmount),r.isPosted])`)
  check("an approver runs it: 50 posted for the month, book value 1,150", run.status === 200 && rec.length === 1 && rec[0][1] === 50 && rec[0][2] && q(`return Number((await p.asset.findUnique({where:{id:${J(assetId)}}})).currentBookValue)`) === 1150, `${run.status} ${run.err} ${J(rec)}`)
  const again = await call(fm, "POST", "/accounting/assets/depreciation/monthly", { period: ym(prev) })
  check("running the same month again posts nothing more", again.status === 200 && q(`return await p.depreciationRecord.count({where:{assetId:${J(assetId)}}})`) === 1, `${again.status} ${J(again.data)}`)
  const pv2 = await call(acct, "GET", `/accounting/assets/depreciation/preview?period=${ym(prev)}`)
  check("the preview now shows it as posted", (pv2.data.assets.find((r) => r.assetId === assetId) || {}).outcome === "already_posted", J(pv2.data.assets.find((r) => r.assetId === assetId)))

  const off = await call(acct, "PUT", `/accounting/assets/${assetId}`, { isActive: false, location: "Bulawayo office" })
  const after = q(`return await p.asset.findUnique({where:{id:${J(assetId)}},select:{isActive:true,location:true,status:true}})`)
  check("[finding] an edit moves the asset but cannot take it off the books", off.status < 300 && after.isActive === true && after.location === "Bulawayo office" && after.status === "IN_USE", `${off.status} ${J(after)}`)
  const dA = await call(acct, "POST", `/accounting/assets/${assetId}/dispose`, { disposalDate: now.toISOString().slice(0, 10), disposalValue: 1000, disposalMethod: "SALE", paymentBankId: bankId })
  check("a preparer cannot dispose of an asset", dA.status === 403, String(dA.status))
  const dNo = await call(fm, "POST", `/accounting/assets/${assetId}/dispose`, { disposalDate: now.toISOString().slice(0, 10), disposalValue: 1000, disposalMethod: "SALE" })
  check("[finding] sale proceeds must go to a named bank or account", dNo.status >= 400 && q(`return (await p.asset.findUnique({where:{id:${J(assetId)}}})).status`) === "IN_USE", `${dNo.status} ${dNo.err}`)
  const d = await call(fm, "POST", `/accounting/assets/${assetId}/dispose`, { disposalDate: now.toISOString().slice(0, 10), disposalValue: 1000, disposalMethod: "SALE", paymentBankId: bankId, description: `${tag} sold` })
  const dj = q(`const j=await p.journalEntry.findFirst({where:{referenceNumber:${J(`DISPOSAL-${base.assetCode}`)}},include:{journalEntryLines:{include:{chartOfAccount:{select:{accountName:true}}}},cashbookEntries:true}});return j&&{lines:j.journalEntryLines.map(l=>[l.chartOfAccount.accountName,Number(l.debitAmount),Number(l.creditAmount)]),cb:j.cashbookEntries.map(c=>[c.type,Number(c.amount)])}`)
  const dr = dj && dj.lines.reduce((t, l) => t + l[1], 0), cr = dj && dj.lines.reduce((t, l) => t + l[2], 0)
  check("disposal: Dr bank 1,000, Dr accumulated depreciation 50, Dr loss 150, Cr cost 1,200; proceeds in the cashbook", d.status < 300 && dj && Math.abs(dr - cr) < 0.01 && dr === 1200 && dj.lines.some((l) => /loss/i.test(l[0]) && l[1] === 150) && dj.cb.length === 1 && dj.cb[0][0] === "RECEIPT" && dj.cb[0][1] === 1000, `${d.status} ${d.err} ${J(dj)}`)
  const pos2 = await call(acct, "GET", "/cashbook/position")
  const mine2 = (pos2.data || []).find((r) => r.bank.id === bankId)
  check("the bank still agrees with its ledger: −1,200 + 1,000 = −200", mine2 && mine2.cashbookBalance === -200 && mine2.difference === 0, J(mine2))
} finally {
  q(`await p.bank.update({where:{id:${J(bankId)}},data:{isActive:false}});return 1`)
  console.log(`(test bank deactivated; asset ${assetId ? "disposed" : "not created"})`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
