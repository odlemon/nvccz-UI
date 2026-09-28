// VAT return and tax return packs through the API: the return reads posted journals only (a draft carrying VAT is
// shown apart and joins the return once posted; voiding takes it out again, reversal and all), on the VAT input account
// the postings use (1101), one currency at a time; accountants reach the tax packs; a pack is created, compiled from the
// ledger, submitted, and signed off only by a checker other than its preparer. Uses 2024 dates (an open period with no
// other VAT) and removes its pack at the end; the test journal stays voided.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const tag = `UATTAX${Date.now().toString().slice(-5)}`
const FROM = "2024-04-01", TO = "2024-06-30", DAY = "2024-05-15"

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), emp = await login("perf.employee@nts.local")
const [coa, cur] = await Promise.all([call(cfo, "GET", "/accounting/chart-of-accounts"), call(cfo, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id
const vat = async () => (await call(acct, "GET", `/vat/report?startDate=${FROM}&endDate=${TO}`)).data
let packId = null, jeId = null
const lockedQ2 = q(`const ps=await p.fiscalPeriod.findMany({where:{startDate:{gte:new Date('2024-04-01')},endDate:{lte:new Date('2024-07-01')}},include:{moduleLocks:{where:{moduleCode:'GL'}}}});return ps.some(p=>p.moduleLocks[0]&&p.moduleLocks[0].lockStatus!=='OPEN')`)
try {
  const v0 = await vat()
  check("the VAT return names the accounts the postings use and its currency", v0 && v0.accounts.input.startsWith("1101") && v0.accounts.output.startsWith("2100") && v0.currency === "USD", J(v0 && { a: v0.accounts, c: v0.currency }))
  if (lockedQ2) console.log("SKIP  Q2 2024 is locked; journal checks skipped")
  else {
    const d = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: DAY, referenceNumber: `${tag}-J`, description: `${tag} supplies with VAT`, currencyId: USD, journalEntryLines: [{ chartOfAccountId: A("5090"), debitAmount: 100, creditAmount: 0, description: "supplies" }, { chartOfAccountId: A("1101"), debitAmount: 15, creditAmount: 0, description: "VAT 15%" }, { chartOfAccountId: A("1100"), debitAmount: 0, creditAmount: 115, description: "paid" }] })
    jeId = d.data && (d.data.id || (d.data.journalEntry && d.data.journalEntry.id))
    const v1 = await vat()
    check("a draft carrying VAT is shown apart, not in the return", !!jeId && v1.summary.totalInputTax === v0.summary.totalInputTax && v1.drafts.journals === v0.drafts.journals + 1 && v1.drafts.inputTax === v0.drafts.inputTax + 15, `${d.status} ${d.err} ${J(v1 && { s: v1.summary, d: v1.drafts })}`)
    const post = await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/post`, {})
    const v2 = await vat()
    check("once posted it is input tax in the return, with its line", post.status < 300 && v2.summary.totalInputTax === v0.summary.totalInputTax + 15 && v2.inputTax.transactions.some((t) => t.journalEntryId === jeId && t.vatAmount === 15), `${post.status} ${post.err} ${J(v2 && v2.summary)}`)
    const vd = await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/void`, { reason: "UAT tax" })
    const v3 = await vat()
    check("voided, it leaves the return with its reversal", vd.status < 300 && v3.summary.totalInputTax === v0.summary.totalInputTax && !v3.inputTax.transactions.some((t) => String(t.reference || "").startsWith("VR-")), `${vd.status} ${vd.err} ${J(v3 && v3.summary)}`)
  }
  const noEmp = await call(emp, "GET", "/tax-return-packs")
  const list = await call(acct, "GET", "/tax-return-packs")
  check("accountants reach the tax return packs; someone outside finance does not", list.status === 200 && noEmp.status === 403, `${list.status} ${noEmp.status}`)
  const ent = (await call(cfo, "GET", "/forecast-entities")).data.find((e) => e.is_default)
  const mk = await call(acct, "POST", "/tax-return-packs", { forecastEntityId: ent.id, taxYear: 2024, taxPeriod: "Q2", taxRegime: "ZIMRA_VAT", baseCurrency: "USD" })
  packId = mk.data && mk.data.id
  const comp = await call(acct, "POST", `/tax-return-packs/${packId}/compile`, {})
  check("an accountant creates a VAT pack and compiles it from the ledger", mk.status === 201 && comp.status === 200 && comp.data.status === "DRAFT_REVIEW" && Number(comp.data.vatNetPayable) === -(v0.summary.totalInputTax - v0.summary.totalOutputTax), `${mk.status} ${mk.err} ${comp.status} ${comp.err} ${comp.data && comp.data.vatNetPayable}`)
  const sub = await call(acct, "POST", `/tax-return-packs/${packId}/submit-review`, {})
  check("the preparer submits it for review", sub.status === 200 && !!sub.data.submittedById, `${sub.status} ${sub.err}`)
  const selfSign = await call(acct, "POST", `/tax-return-packs/${packId}/sign-off`, {})
  check("the preparer cannot sign it off", selfSign.status >= 400 && q(`return (await p.taxReturnPack.findUnique({where:{id:${J(packId)}}})).status`) === "DRAFT_REVIEW", `${selfSign.status}`)
  const sign = await call(cfo, "POST", `/tax-return-packs/${packId}/sign-off`, {})
  check("the CFO signs it off: locked, with a sealed PDF", sign.status === 200 && sign.data.status === "SIGNED_OFF" && !!sign.data.packPdfSha256 && !!sign.data.lockedAt, `${sign.status} ${sign.err}`)
  const again = await call(acct, "POST", `/tax-return-packs/${packId}/compile`, {})
  check("a signed-off pack cannot be recompiled", again.status >= 400, `${again.status}`)
} finally {
  if (packId) q(`for (const m of ['taxReturnPackAuditEvent','taxReturnPackReconciliationLine','taxReturnPackCgtLine']) { if (p[m]) await p[m].deleteMany({where:{packId:${J(packId)}}}).catch(()=>null) } return (await p.taxReturnPack.deleteMany({where:{id:${J(packId)}}})).count`)
  if (jeId && q(`return (await p.journalEntry.findUnique({where:{id:${J(jeId)}}})).status`) === "PENDING") await call(acct, "POST", `/accounting/journal-entries/${jeId}/discard`, { reason: "UAT clean-up" })
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
