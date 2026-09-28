// Supplier payment runs (AP-01 / SRD ACC-AP-11) through the API: the bills that can be paid from a bank account (and
// why the others cannot); a run with a bill that cannot be paid is refused; a bill already in an open run cannot go
// into another; the preparer submits, someone else approves (the preparer cannot); the bank file is produced only once
// approved, one line per bill to the vendor's bank; settling pays each bill (journal and cashbook line, procurement shows
// it paid); a cancelled run frees its bills. Pays two approved dev bills for real (procurement test data).
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); const text = await r.text(); let j = null; try { j = JSON.parse(text) } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error), text } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10)

const fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), acct = await login("acct.accountant@nts.local")
const bank = (await call(acct, "GET", "/cashbook/banks")).data.find((b) => b.isActive)
const runs = []
try {
  const cand = await call(acct, "GET", `/accounting/payment-runs/candidates?bankId=${bank.id}`)
  const payable = (cand.data && cand.data.bills || []).filter((b) => b.payable)
  const blocked = (cand.data && cand.data.bills || []).filter((b) => !b.payable)
  check("the bills payable from the bank account are listed, the others with why", cand.status === 200 && payable.length >= 3 && blocked.every((b) => b.reason), `${cand.status} payable ${payable.length}`)
  if (payable.length < 3) throw new Error("not enough payable bills to test")
  if (blocked.length) {
    const bad = await call(fm, "POST", "/accounting/payment-runs", { bankId: bank.id, paymentDate: today, invoiceIds: [payable[0].id, blocked[0].id] })
    check("a run with a bill that cannot be paid is refused, with the bill and the reason", bad.status === 409 && String(bad.err).includes(blocked[0].invoiceNumber), `${bad.status} ${bad.err}`)
  }
  const [b1, b2, b3] = payable
  const run = await call(fm, "POST", "/accounting/payment-runs", { bankId: bank.id, paymentDate: today, invoiceIds: [b1.id, b2.id], notes: "UAT payment run" })
  if (run.data && run.data.id) runs.push(run.data.id)
  check("a preparer creates a run: two bills, their total, a reference", run.status === 201 && run.data.status === "DRAFT" && run.data.lines.length === 2 && Math.abs(run.data.total - (b1.amount + b2.amount)) < 0.01 && /^PR-\d{8}-\d+$/.test(run.data.reference), `${run.status} ${run.err}`)
  const dup = await call(fm, "POST", "/accounting/payment-runs", { bankId: bank.id, paymentDate: today, invoiceIds: [b1.id] })
  check("a bill already in an open run cannot go into another", dup.status === 409 && /open payment run/.test(String(dup.err)), `${dup.status} ${dup.err}`)
  const early = await call(cfo, "POST", `/accounting/payment-runs/${run.data.id}/approve`, {})
  check("a run is approved only once submitted", early.status === 409, `${early.status} ${early.err}`)
  const noFile = await call(fm, "GET", `/accounting/payment-runs/${run.data.id}/bank-file`)
  check("no bank file before approval", noFile.status === 409, `${noFile.status}`)
  const sub = await call(fm, "POST", `/accounting/payment-runs/${run.data.id}/submit`, {})
  const own = await call(fm, "POST", `/accounting/payment-runs/${run.data.id}/approve`, {})
  check("the preparer submits it but cannot approve it", sub.status === 200 && sub.data.status === "SUBMITTED" && own.status === 403, `${sub.status} ${own.status} ${own.err}`)
  const prep = await call(acct, "POST", `/accounting/payment-runs/${run.data.id}/approve`, {})
  check("a preparer without posting rights cannot approve it", prep.status === 403, `${prep.status}`)
  const ok = await call(cfo, "POST", `/accounting/payment-runs/${run.data.id}/approve`, {})
  check("someone else with posting rights approves it", ok.status === 200 && ok.data.status === "APPROVED" && ok.data.approvedBy, `${ok.status} ${ok.err}`)
  const file = await call(fm, "GET", `/accounting/payment-runs/${run.data.id}/bank-file`)
  const rows = file.text.replace(/^\ufeff/, "").trim().split(/\r?\n/)
  check("the bank file has one line per bill to the vendor's bank account", file.status === 200 && rows[0].startsWith("Payee,Bank,Branch code,Account number") && rows.length === 3 && rows.slice(1).every((r) => r.includes(run.data.reference)), `${file.status} ${rows.length} ${rows[0]}`)
  // settle with a small PDF as the bank's confirmation
  const fd = new FormData()
  fd.append("proofOfPayment", new Blob([Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")], { type: "application/pdf" }), "bank-confirmation.pdf")
  fd.append("bankReference", "UAT-BANK-REF")
  const st = await fetch(`${API}/accounting/payment-runs/${run.data.id}/settle`, { method: "POST", headers: { Authorization: `Bearer ${cfo.t}` }, body: fd })
  const sj = await st.json()
  const paid = q(`return (await p.procurementInvoice.findMany({where:{id:{in:${J([b1.id, b2.id])}}},select:{paymentStatus:true}})).map(i=>i.paymentStatus)`)
  const lines = sj.data ? sj.data.lines : []
  check("settling pays each bill: procurement shows them paid, each with its journal", st.status === 200 && sj.data.status === "SETTLED" && paid.every((s) => s === "PAID") && lines.every((l) => l.status === "PAID" && l.journal), `${st.status} ${sj.message} ${J(lines.map((l) => [l.status, l.error]))} ${J(paid)}`)
  const cb = q(`return await p.cashbookEntry.count({where:{journalEntry:{referenceNumber:{in:${J(lines.map((l) => l.journal).filter(Boolean))}}}}})`)
  check("each payment is in the cashbook", cb === lines.length, `${cb} of ${lines.length}`)
  const run2 = await call(fm, "POST", "/accounting/payment-runs", { bankId: bank.id, paymentDate: today, invoiceIds: [b3.id] })
  if (run2.data && run2.data.id) runs.push(run2.data.id)
  const noWhy = await call(fm, "POST", `/accounting/payment-runs/${run2.data.id}/cancel`, {})
  const can = await call(fm, "POST", `/accounting/payment-runs/${run2.data.id}/cancel`, { reason: "UAT: not this week" })
  const again = await call(acct, "GET", `/accounting/payment-runs/candidates?bankId=${bank.id}`)
  check("a run is cancelled only with a reason, and its bill is free again", noWhy.status === 400 && can.status === 200 && can.data.status === "CANCELLED" && again.data.bills.find((b) => b.id === b3.id).payable, `${noWhy.status} ${can.status} ${can.err}`)
  const aud = q(`return (await p.auditLog.findMany({where:{entityType:'PaymentRun',entityId:${J(run.data.id)}},select:{action:true},orderBy:{createdAt:'asc'}})).map(a=>a.action)`)
  check("every step is in the audit trail", ["CREATE", "SUBMIT", "APPROVE", "EXPORT", "SETTLE"].every((a) => aud.includes(a)), J(aud))
} finally {
  for (const id of runs) { const st = q(`const r=await p.$queryRawUnsafe("SELECT status FROM payment_runs WHERE id = ?", ${J(id)});return r[0]&&r[0].status`); if (["DRAFT", "SUBMITTED", "APPROVED"].includes(st)) await call(fm, "POST", `/accounting/payment-runs/${id}/cancel`, { reason: "UAT clean-up" }) }
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
