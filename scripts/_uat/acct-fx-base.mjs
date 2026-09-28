// Base-currency reporting (FX-01): a posted ZiG journal is in the USD statements at the rate locked on it when it was
// posted — the trial balance still balances, the expense is in the income statement, the payable on the balance sheet —
// and in the ZiG statements in its own amounts; the general ledger shows both; voided, it leaves every view again.
// Posts one ZiG journal (Dr 5090 / Cr 2000) in an open past month and voids it at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const near = (a, b, tol = 0.02) => Math.abs(Number(a) - Number(b)) <= tol
const tag = `UATFXB${Date.now().toString().slice(-5)}`
const DAY = "2026-07-15", AMT = 2662.91

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local")
const [coa, cur] = await Promise.all([call(fm, "GET", "/accounting/chart-of-accounts"), call(fm, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const USD = cur.data.find((c) => c.code === "USD").id, ZIG = cur.data.find((c) => c.code === "ZIG").id
const views = async () => {
  const [tbU, tbZ, isU, isZ, bsU] = await Promise.all([
    call(fm, "GET", `/accounting/trial-balance?asOfDate=2026-09-28&currencyId=${USD}`),
    call(fm, "GET", `/accounting/trial-balance?asOfDate=2026-09-28&currencyId=${ZIG}`),
    call(fm, "GET", `/accounting/income-statement?startDate=2026-07-01&endDate=2026-07-31&currencyId=${USD}`),
    call(fm, "GET", `/accounting/income-statement?startDate=2026-07-01&endDate=2026-07-31&currencyId=${ZIG}`),
    call(fm, "GET", `/accounting/balance-sheet?asOfDate=2026-09-28&currencyId=${USD}`),
  ])
  const tot = (tb) => tb.data && tb.data.totals ? [Number(tb.data.totals.totalDebits ?? tb.data.totals.debit), Number(tb.data.totals.totalCredits ?? tb.data.totals.credit)] : [NaN, NaN]
  return { tbU: tot(tbU), tbZ: tot(tbZ), opexU: isU.data.sections.operatingExpenses.total, opexZ: isZ.data.sections.operatingExpenses.total, liabU: bsU.data.liabilities.totalLiabilities, balU: bsU.data.isBalanced }
}
let jeId = null
try {
  const v0 = await views()
  const d = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: DAY, referenceNumber: `${tag}-J`, description: `${tag} ZiG supplies`, currencyId: ZIG, journalEntryLines: [{ chartOfAccountId: A("5090"), debitAmount: AMT, creditAmount: 0, description: "supplies (ZiG)" }, { chartOfAccountId: A("2000"), debitAmount: 0, creditAmount: AMT, description: "owed (ZiG)" }] })
  jeId = d.data && (d.data.id || (d.data.journalEntry && d.data.journalEntry.id))
  const post = await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/post`, {})
  const snap = q(`return Number((await p.journalEntry.findUnique({where:{id:${J(jeId)}}})).usdZwgRateSnapshot)`)
  const base = Math.round((AMT / snap) * 100) / 100
  check("a ZiG journal is posted with its USD/ZiG rate locked on it", d.status < 300 && post.status < 300 && snap > 0, `${d.status} ${d.err} ${post.status} ${post.err} rate ${snap}`)
  const v1 = await views()
  check("the USD trial balance includes it at the locked rate and still balances", near(v1.tbU[0] - v0.tbU[0], base) && near(v1.tbU[1] - v0.tbU[1], base) && near(v1.tbU[0], v1.tbU[1]), `${J(v0.tbU)} -> ${J(v1.tbU)} expected +${base}`)
  check("the ZiG trial balance shows it in ZiG", near(v1.tbZ[0] - v0.tbZ[0], AMT) && near(v1.tbZ[1] - v0.tbZ[1], AMT), `${J(v0.tbZ)} -> ${J(v1.tbZ)}`)
  check("the USD income statement carries the expense in USD, the ZiG one in ZiG", near(v1.opexU - v0.opexU, base) && near(v1.opexZ - v0.opexZ, AMT), `${v0.opexU}->${v1.opexU} / ${v0.opexZ}->${v1.opexZ}`)
  check("the USD balance sheet carries the payable and still balances", near(v1.liabU - v0.liabU, base) && v1.balU === true, `${v0.liabU} -> ${v1.liabU} balanced ${v1.balU}`)
  const gl = await call(fm, "GET", `/accounting/gl-ledger-detail?accountNo=5090&startDate=2026-07-01&endDate=2026-07-31`)
  const line = gl.data && gl.data.transactions.find((t) => t.journalEntryId === jeId)
  check("the general ledger shows the line in ZiG with its USD amount at the locked rate", line && near(line.debitAmount, AMT) && near(line.debitAmountBaseCurrency, base) && line.transactionCurrency === "ZIG", J(line).slice(0, 300))
  const vd = await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/void`, { reason: "UAT FX base" })
  const v2 = await views()
  check("voided, it leaves every view (with its reversal)", vd.status < 300 && near(v2.tbU[0], v0.tbU[0]) && near(v2.tbZ[0], v0.tbZ[0]) && near(v2.opexU, v0.opexU) && near(v2.liabU, v0.liabU), `${vd.status} ${vd.err} ${J(v2)}`)
  if (vd.status < 300) jeId = null
} finally {
  if (jeId) {
    const st = q(`return (await p.journalEntry.findUnique({where:{id:${J(jeId)}}})).status`)
    if (st === "PENDING") await call(acct, "POST", `/accounting/journal-entries/${jeId}/discard`, { reason: "UAT clean-up" })
    else if (st === "POSTED") await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/void`, { reason: "UAT clean-up" })
  }
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
