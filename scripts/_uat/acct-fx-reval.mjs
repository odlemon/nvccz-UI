// Month-end revaluation (FX-01 / SRD ACC-FX-05): a ZiG receivable posted at one rate is valued at the closing rate for
// the month end; the difference is prepared as a draft journal (receivable against 4050 Unrealised FX Gain/Loss) for an
// approver; once posted, revaluing the same date again finds nothing (only the movement is ever booked), and a second
// draft for the date is refused; the preparer cannot post it; the ZiG statements are unchanged by it.
// Uses July 2026 (an open month), its own closing rate for 31 Jul (removed at the end), and voids what it posted.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.message || j.error) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const J = (x) => JSON.stringify(x)
const near = (a, b, tol = 0.02) => Math.abs(Number(a) - Number(b)) <= tol
const tag = `UATFXR${Date.now().toString().slice(-5)}`
const DAY = "2026-07-15", ASOF = "2026-07-31", AMT = 2662.91, CLOSE = 30

const acct = await login("acct.accountant@nts.local"), fm = await login("perf.finmgr@nts.local")
const [coa, cur] = await Promise.all([call(fm, "GET", "/accounting/chart-of-accounts"), call(fm, "GET", "/accounting/currencies")])
const A = (no) => coa.data.find((a) => a.accountNo === no).id
const ZIG = cur.data.find((c) => c.code === "ZIG").id
const hadRate = q(`const u=await p.currency.findFirst({where:{code:'USD'}}),z=await p.currency.findFirst({where:{code:'ZIG'}});return !!(await p.exchangeRate.findFirst({where:{date:new Date('${ASOF}T00:00:00Z'),fromCurrencyId:u.id,toCurrencyId:z.id}}))`)
const hadReval = q(`return await p.journalEntry.count({where:{referenceNumber:'FXREV-${ASOF}',status:{in:['PENDING','POSTED']}}})`)
let jeId = null, revId = null
try {
  if (hadRate || hadReval) { console.log(`SKIP  ${ASOF} already has a USD/ZIG rate or a revaluation`); process.exit(0) }
  const pre0 = await call(fm, "GET", `/accounting/multi-currency/revaluation?asOf=${ASOF}`)
  const d = await call(acct, "POST", "/accounting/journal-entries", { transactionDate: DAY, referenceNumber: `${tag}-J`, description: `${tag} ZiG fee receivable`, currencyId: ZIG, journalEntryLines: [{ chartOfAccountId: A("1200"), debitAmount: AMT, creditAmount: 0, description: "fee receivable (ZiG)" }, { chartOfAccountId: A("4000"), debitAmount: 0, creditAmount: AMT, description: "fee (ZiG)" }] })
  jeId = d.data && (d.data.id || (d.data.journalEntry && d.data.journalEntry.id))
  await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/post`, {})
  const snap = q(`return Number((await p.journalEntry.findUnique({where:{id:${J(jeId)}}})).usdZwgRateSnapshot)`)
  const carried = Math.round((AMT / snap) * 100) / 100, revalued = Math.round((AMT / CLOSE) * 100) / 100
  const rate = await call(fm, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: ASOF, rate: CLOSE, reason: "UAT month-end close rate" })
  const pre = await call(acct, "GET", `/accounting/multi-currency/revaluation?asOf=${ASOF}`)
  const row = pre.data && pre.data.rows.find((r) => r.account.startsWith("1200") && r.currency === "ZIG")
  const base0 = pre0.data && pre0.data.rows.find((r) => r.account.startsWith("1200") && r.currency === "ZIG")
  const expectDiff = Math.round((revalued - carried) * 100) / 100 + (base0 ? 0 : 0)
  check("the receivable is valued at the closing rate against what it is carried at", rate.status === 200 && row && near(row.native - (base0 ? base0.native : 0), AMT) && near(row.closingRate, 1 / CLOSE, 1e-6) && (base0 ? true : near(row.difference, expectDiff)), `${rate.status} ${rate.err} ${J(row)} expected diff ${expectDiff}`)
  const prep = await call(acct, "POST", "/accounting/multi-currency/revaluation", { asOf: ASOF })
  revId = prep.data && prep.data.journal && prep.data.journal.id
  const lines = revId ? q(`return (await p.journalEntryLine.findMany({where:{journalEntryId:${J(revId)}},include:{chartOfAccount:{select:{accountNo:true}}}})).map(l=>[l.chartOfAccount.accountNo,Number(l.debitAmount),Number(l.creditAmount)])`) : []
  const arLine = lines.find((l) => l[0] === "1200"), fxLine = lines.find((l) => l[0] === "4050")
  check("a draft journal books the difference: receivable against 4050", prep.status === 201 && prep.data.journal.status === "PENDING" && arLine && fxLine && near(arLine[1] - arLine[2], row.difference) && near(fxLine[2] - fxLine[1], row.difference) && near(lines.reduce((s, l) => s + l[1] - l[2], 0), 0), `${prep.status} ${prep.err} ${J(lines)}`)
  const again = await call(acct, "POST", "/accounting/multi-currency/revaluation", { asOf: ASOF })
  check("a second revaluation for the same date is refused while the first stands", again.status === 409, `${again.status} ${again.err}`)
  const self = await call(acct, "PATCH", `/accounting/journal-entries/${revId}/post`, {})
  check("the preparer cannot post it", self.status >= 400, `${self.status}`)
  const post = await call(fm, "PATCH", `/accounting/journal-entries/${revId}/post`, {})
  const after = await call(fm, "GET", `/accounting/multi-currency/revaluation?asOf=${ASOF}`)
  const row2 = after.data && after.data.rows.find((r) => r.account.startsWith("1200") && r.currency === "ZIG")
  check("once posted, the receivable is carried at the closing rate: nothing more to book", post.status < 300 && (!row2 || near(row2.difference, 0)), `${post.status} ${post.err} ${J(row2)}`)
  const zigTb = await call(fm, "GET", `/accounting/trial-balance?asOfDate=${ASOF}&currencyId=${ZIG}`)
  const zAr = zigTb.data && (zigTb.data.accounts || []).find((a) => a.accountNo === "1200")
  check("the ZiG trial balance is untouched by the revaluation (it is in USD)", zAr && near((Number(zAr.debitBalance ?? zAr.debit ?? 0) - Number(zAr.creditBalance ?? zAr.credit ?? 0)) , (base0 ? base0.native : 0) + AMT, 0.05), J(zAr).slice(0, 200))
} finally {
  if (revId) { const st = q(`return (await p.journalEntry.findUnique({where:{id:${J(revId)}}})).status`); if (st === "POSTED") await call(fm, "PATCH", `/accounting/journal-entries/${revId}/void`, { reason: "UAT clean-up" }); else if (st === "PENDING") await call(acct, "POST", `/accounting/journal-entries/${revId}/discard`, { reason: "UAT clean-up" }) }
  if (jeId) { const st = q(`return (await p.journalEntry.findUnique({where:{id:${J(jeId)}}})).status`); if (st === "POSTED") await call(fm, "PATCH", `/accounting/journal-entries/${jeId}/void`, { reason: "UAT clean-up" }); else if (st === "PENDING") await call(acct, "POST", `/accounting/journal-entries/${jeId}/discard`, { reason: "UAT clean-up" }) }
  if (!hadRate) q(`const u=await p.currency.findFirst({where:{code:'USD'}}),z=await p.currency.findFirst({where:{code:'ZIG'}});return (await p.exchangeRate.deleteMany({where:{date:new Date('${ASOF}T00:00:00Z'),fromCurrencyId:u.id,toCurrencyId:z.id,source:'MANUAL'}})).count`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
