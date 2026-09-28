// Group Consolidation / CEO View entity figures (CN-01/02) reconcile against the Command Centre's own year-to-date
// total, and the consolidated balance sheet balances. Regression for a double-counting bug found live: an account
// whose accountType is "Expense" but whose name matches the tax check (e.g. "Corporate Tax Expense") landed in both
// the operating-expense and tax sections of ConsolidatedReportService's income statement, so its amount was
// subtracted twice — net income read $1,000 more negative there than everywhere else that reports the same period.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token } }
const get = async (u, path) => { const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${u.t}` } }); const j = await r.json().catch(() => null); return j && j.data !== undefined ? j.data : j }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())

const cfo = await login("acct.cfo@nts.local")
const today = new Date().toISOString().slice(0, 10)
const from = `${today.slice(0, 4)}-01-01`

const overview = await get(cfo, "/accounting/overview")
const summary = await get(cfo, `/accounting/consolidation/summary?asOfDate=${today}&periodStart=${from}&periodEnd=${today}`)
const entity = (summary?.entities || summary?.entityBreakdown || [])[0]
check("the consolidation summary returns at least one entity", !!entity, JSON.stringify(summary).slice(0, 200))
if (entity) {
  const is = entity.incomeStatement
  // `expenses` here is operating expenses only (tax has its own section, not shown in this summary) — the one
  // invariant that must hold is that this entity's bottom line agrees with the Command Centre's, which computes the
  // same year-to-date figure a different way (revenue minus every expense-type account, tax included, in one bucket).
  check("that net income matches the Command Centre's year-to-date net income for the same period (no section double-counted)", Math.abs(is.netIncome - overview.results.ytd.netIncome) < 0.01, `entity=${is.netIncome} overview=${overview.results.ytd.netIncome} (revenue=${is.revenue} operatingExpenses=${is.expenses})`)
  check("the consolidated balance sheet still balances", entity.balanceSheet && entity.balanceSheet.isBalanced === true, JSON.stringify(entity.balanceSheet))
}
// an account typed Expense whose name reads as tax must count once, not twice
const dup = q(`
  const accs = await p.chartOfAccounts.findMany({ where: { accountType: 'Expense', accountName: { contains: 'Tax' } }, select: { accountNo: true, accountName: true } });
  return accs;
`)
check("an Expense-typed account whose name mentions tax exists to exercise this check (else this suite is not testing the bug)", Array.isArray(dup) && dup.length > 0, JSON.stringify(dup))

console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
