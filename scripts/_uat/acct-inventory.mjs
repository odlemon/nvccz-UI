// Perpetual inventory through the API: an item with an opening quantity (counted once, posted against where it came
// from), a receipt at a new cost moving the weighted average, an issue at the average to cost of sales, an issue beyond
// what is on hand refused, a count difference booked only by an approver (a shortfall reduces stock), every movement's
// journal posted with it so the ledger and the stock agree, the month roll-forward adding up, and the guards (cost not
// changed by hand, a stock journal not voided alone, an item with stock not switched off).
// Leaves one switched-off test item and a few dollars of posted test journals (journals are never deleted): the stock
// ends issued back to 3900, so only the cost of sales and count difference (7.50) stay in the P&L.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const tag = `UATINV${Date.now().toString().slice(-5)}`

const acct = await login("acct.accountant@nts.local"), cfo = await login("acct.cfo@nts.local")
const coa = (await call(cfo, "GET", "/accounting/chart-of-accounts")).data
const A = (no) => coa.find((a) => a.accountNo === no).id
const item = () => q(`const i=await p.inventoryItem.findFirst({where:{skuNumber:${J(tag)}}});return i&&{id:i.id,qty:Number(i.quantityOnHand),avg:Number(i.costOfPurchase),isActive:i.isActive}`)
const lines = (mvId) => q(`const j=await p.journalEntry.findUnique({where:{referenceNumber:'STK-'+${J(mvId)}},include:{journalEntryLines:{include:{chartOfAccount:true}}}});return j&&{status:j.status,lines:j.journalEntryLines.map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])}`)
const tie = async () => ((await call(cfo, "GET", "/accounting/inventory/tie-out")).data || []).find((r) => r.accountId === A("1400"))
const tie0 = await tie()
try {
  const noContra = await call(acct, "POST", "/accounting/inventory/items", { skuNumber: tag, itemName: `${tag} cartridges`, costOfPurchase: 1, quantityOnHand: 10, inventoryAssetAccountId: A("1400") })
  check("an opening quantity needs the account it came from", noContra.status === 400 && !item(), `${noContra.status} ${noContra.err}`)
  const add = await call(acct, "POST", "/accounting/inventory/items", { skuNumber: tag, itemName: `${tag} cartridges`, costOfPurchase: 1, quantityOnHand: 10, inventoryAssetAccountId: A("1400"), openingContraAccountId: A("3900") })
  const it = item()
  const open = q(`const m=await p.stockMovement.findFirst({where:{item:{skuNumber:${J(tag)}}}});return m&&m.id`)
  check("the item is added with its opening quantity counted once, posted Dr inventory / Cr opening balances", add.status === 201 && it.qty === 10 && J(lines(open).lines.sort()) === J([["1400", 10, 0], ["3900", 0, 10]].sort()), `${add.status} ${add.err} ${J(it)} ${J(lines(open))}`)
  const rin = await call(acct, "POST", "/accounting/inventory/movements", { itemId: it.id, movementType: "IN", quantity: 10, unitCost: 2, contraAccountId: A("3900"), reference: `${tag}-GRN` })
  check("a receipt at a new cost moves the weighted average (10 @ 1 + 10 @ 2 = 20 @ 1.50)", rin.status === 201 && item().qty === 20 && item().avg === 1.5 && J(lines(rin.data.id).lines.sort()) === J([["1400", 20, 0], ["3900", 0, 20]].sort()), `${rin.status} ${rin.err} ${J(item())}`)
  const rout = await call(acct, "POST", "/accounting/inventory/movements", { itemId: it.id, movementType: "OUT", quantity: 4, contraAccountId: A("5005"), description: "UAT issue" })
  check("an issue leaves at the average cost to cost of sales (4 × 1.50)", rout.status === 201 && item().qty === 16 && J(lines(rout.data.id).lines.sort()) === J([["5005", 6, 0], ["1400", 0, 6]].sort()), `${rout.status} ${rout.err} ${J(rout.data && lines(rout.data.id))}`)
  const over = await call(acct, "POST", "/accounting/inventory/movements", { itemId: it.id, movementType: "OUT", quantity: 100, contraAccountId: A("5005"), description: "too many" })
  check("an issue beyond what is on hand is refused", over.status === 409 && item().qty === 16, `${over.status} ${over.err}`)
  const prepCount = await call(acct, "POST", "/accounting/inventory/adjustments", { itemId: it.id, quantity: -1, reason: "UAT count", contraAccountId: A("5095") })
  check("a preparer cannot book a count difference", prepCount.status === 403 && item().qty === 16, `${prepCount.status}`)
  const cnt = await call(cfo, "POST", "/accounting/inventory/adjustments", { itemId: it.id, quantity: -1, reason: "UAT count: one missing", contraAccountId: A("5095") })
  check("an approver books a shortfall: stock goes down, Dr variance / Cr inventory", cnt.status === 200 && item().qty === 15 && J(lines(cnt.data.id).lines.sort()) === J([["5095", 1.5, 0], ["1400", 0, 1.5]].sort()), `${cnt.status} ${cnt.err} ${J(item())}`)
  const t1 = await tie()
  check("the inventory account still agrees with the stock value", t1 && Math.abs(t1.difference - (tie0 ? tie0.difference : 0)) < 0.005, `${J(tie0)} -> ${J(t1)}`)
  const m = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 7)
  const rf = await call(cfo, "GET", `/accounting/inventory/roll-forward?from=${m}-01&to=${m}-28`.replace(/-28$/, `-${new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)).getUTCDate()}`))
  const row = rf.data && rf.data.rows.find((r) => r.sku === tag)
  check("the month roll-forward adds up: 0 + 20 received − 4 issued − 1 counted = 15, worth 22.50", row && row.receipts.qty === 20 && row.issues.qty === -4 && row.adjustments.qty === -1 && row.closing.qty === 15 && row.closing.value === 22.5, J(row))
  const cost = await call(acct, "PUT", `/accounting/inventory/items/${it.id}`, { costOfPurchase: 9 })
  check("the cost is not changed by hand once stock has moved", cost.status === 409 && item().avg === 1.5, `${cost.status} ${cost.err}`)
  const jid = q(`return (await p.journalEntry.findUnique({where:{referenceNumber:'STK-'+${J(rout.data.id)}}})).id`)
  const v = await call(cfo, "PATCH", `/accounting/journal-entries/${jid}/void`, { reason: "UAT" })
  check("a stock journal is not voided on its own", v.status >= 400 && /stock movement/.test(String(v.err)), `${v.status} ${v.err}`)
  const off = await call(acct, "PUT", `/accounting/inventory/items/${it.id}`, { isActive: false })
  check("an item with stock on hand is not switched off", off.status === 409, `${off.status} ${off.err}`)
} finally {
  const it = item()
  if (it && it.qty > 0) await call(acct, "POST", "/accounting/inventory/movements", { itemId: it.id, movementType: "OUT", quantity: it.qty, contraAccountId: A("3900"), description: "UAT clean-up: returned to opening balances" })
  if (it) await call(acct, "PUT", `/accounting/inventory/items/${it.id}`, { isActive: false })
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
