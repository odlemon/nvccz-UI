// A fixed asset bought on a supplier bill (FA-07): linking it to a bill that is not posted yet is refused; a cost above
// the bill's amount before VAT is refused; linked to a posted bill, the asset's journal moves the cost out of the bill's
// expense line (Dr asset / Cr that expense account) and payables are not credited a second time.
// Posts one pending procurement bill journal (by an approver) if no bill is posted yet; the test asset's journal is voided
// and the asset removed at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const tag = `UATFAB${Date.now().toString().slice(-5)}`

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local")
const coa = (await call(fm, "GET", "/accounting/chart-of-accounts")).data
const A = (no) => coa.find((a) => a.accountNo === no).id
const asset = (over) => ({ assetName: `${tag} laptop`, assetCode: `${tag}-${Math.random().toString(36).slice(2, 5)}`, cost: 500, purchaseDate: "2026-09-10", usefulLifeYears: 3, depreciationMethod: "STRAIGHT_LINE", salvageValue: 0, assetAccountId: A("1510"), accumulatedDepreciationAccountId: A("1550"), depreciationExpenseAccountId: A("5130"), ...over })
let made = []
try {
  const pending = q(`return (await p.procurementInvoice.findFirst({where:{journalEntry:{status:'PENDING',createdById:{not:${J(fm.id)}}}},orderBy:{createdAt:'desc'},select:{id:true,invoiceNumber:true,subtotal:true,journalEntryId:true}}))`)
  const r1 = pending ? await call(acct, "POST", "/accounting/assets", asset({ invoiceId: pending.id })) : { status: 0 }
  check("an asset linked to a bill not yet posted is refused", !pending || (r1.status === 400 && /not posted/.test(String(r1.err))), `${r1.status} ${r1.err}`)
  let bill = q(`return (await p.procurementInvoice.findFirst({where:{journalEntry:{status:'POSTED'}},select:{id:true,invoiceNumber:true,subtotal:true,journalEntryId:true}}))`)
  if (!bill && pending) { await call(fm, "PATCH", `/accounting/journal-entries/${pending.journalEntryId}/post`, {}); bill = pending }
  const lines = q(`return (await p.journalEntryLine.findMany({where:{journalEntryId:${J(bill.journalEntryId)}},include:{chartOfAccount:{select:{accountNo:true}}}})).map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])`)
  const costLine = lines.filter((l) => l[1] > 0 && l[0] !== "1101").sort((a, b) => b[1] - a[1])[0]
  const over = await call(acct, "POST", "/accounting/assets", asset({ invoiceId: bill.id, cost: Number(bill.subtotal) + 100 }))
  check("a cost above the bill's amount before VAT is refused", over.status === 400 && /before VAT/.test(String(over.err)), `${over.status} ${over.err}`)
  const cost = Math.min(500, Number(bill.subtotal))
  const ok = await call(acct, "POST", "/accounting/assets", asset({ invoiceId: bill.id, cost }))
  const aid = ok.data && (ok.data.id || (ok.data.asset && ok.data.asset.id)); if (aid) made.push(aid)
  const code = aid && q(`return (await p.asset.findUnique({where:{id:${J(aid)}}})).assetCode`)
  const je = code && q(`const j=await p.journalEntry.findFirst({where:{referenceNumber:{startsWith:'ASSET-'+${J(code)}}},include:{journalEntryLines:{include:{chartOfAccount:{select:{accountNo:true}}}}}});return j&&{id:j.id,lines:j.journalEntryLines.map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])}`)
  check("linked to a posted bill, the asset moves the cost out of the bill's expense line (Dr asset / Cr that account), not a second payable", ok.status < 300 && je && je.lines.some((l) => l[0] === "1510" && l[1] === cost) && je.lines.some((l) => l[0] === costLine[0] && l[2] === cost) && !je.lines.some((l) => l[0] === "2000"), `${ok.status} ${ok.err} ${J(je)} bill cost line ${J(costLine)}`)
  if (je) made.push(`je:${je.id}`)
} finally {
  for (const m of made) {
    if (m.startsWith("je:")) await call(fm, "PATCH", `/accounting/journal-entries/${m.slice(3)}/void`, { reason: "UAT clean-up" })
  }
  for (const m of made.filter((x) => !x.startsWith("je:"))) q(`await p.depreciationRecord.deleteMany({where:{assetId:${J(m)}}}).catch(()=>null);return (await p.asset.deleteMany({where:{id:${J(m)}}})).count`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
