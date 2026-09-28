// FX rates and exposure through the API: the stored rate table (list, latest per pair), entering a rate, correcting one
// (only with a reason; the old value is audited), future dates refused, who may do what, and the exposure summary.
// Uses a past date (2026-01-02) for its test rate and removes it at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const results = []
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body) => { const r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message) } }
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz" }).toString())
const DAY = "2026-01-02"

const acct = await login("acct.accountant@nts.local"), auditor = await login("acct.auditor@nts.local"), emp = await login("perf.employee@nts.local")
const had = q(`const u=await p.currency.findFirst({where:{code:'USD'}}),z=await p.currency.findFirst({where:{code:'ZIG'}});return !!(await p.exchangeRate.findFirst({where:{date:new Date('${DAY}T00:00:00Z'),fromCurrencyId:u.id,toCurrencyId:z.id}}))`)
try {
  const list = await call(auditor, "GET", "/accounting/multi-currency/rates?limit=5")
  check("the stored rate table lists rates with the latest per pair (readers included)", list.status === 200 && Array.isArray(list.data.latest) && list.data.latest.some((r) => r.pair === "USD/ZIG") && list.data.baseCurrency === "USD", `${list.status} ${JSON.stringify(list.data).slice(0, 160)}`)
  const live = await call(acct, "GET", "/accounting/multi-currency/exchange-rates")
  check("[finding] the live quote no longer fails on the ZIG currency code", live.status === 200 || !/must include USD and ZWL/.test(String(live.err || (live.data && live.data.details))), `${live.status} ${live.err}`)
  const fut = await call(acct, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: "2030-01-01", rate: 30 })
  check("a rate for a future date is refused", fut.status === 400, `${fut.status} ${fut.err}`)
  const noEmp = await call(emp, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: DAY, rate: 25 })
  check("someone outside finance cannot enter rates", noEmp.status === 403, String(noEmp.status))
  const noAud = await call(auditor, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: DAY, rate: 25 })
  check("an auditor (read-only) cannot enter rates", noAud.status === 403, String(noAud.status))
  if (!had) {
    const add = await call(acct, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: DAY, rate: 25.5, reason: "UAT FX" })
    check("a preparer enters a rate for a past date", add.status === 200 && add.data.rate === 25.5 && add.data.source === "MANUAL" && !add.data.corrected, `${add.status} ${add.err}`)
    const again = await call(acct, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: DAY, rate: 25.7 })
    check("a date already rated is corrected only with a reason", again.status === 400 && /reason/.test(String(again.err)), `${again.status} ${again.err}`)
    const fix = await call(acct, "POST", "/accounting/multi-currency/rates", { from: "USD", to: "ZIG", date: DAY, rate: 25.7, reason: "UAT FX correction: bank confirmation" })
    const aud = q(`return (await p.auditLog.findFirst({where:{entityType:'ExchangeRate',entityId:${JSON.stringify(add.data && add.data.id)}},orderBy:{createdAt:'desc'}}))`)
    check("the correction keeps the old value and the reason in the audit trail", fix.status === 200 && fix.data.corrected && aud && JSON.stringify(aud.oldValues).includes("25.5") && JSON.stringify(aud.newValues).includes("bank confirmation"), `${fix.status} ${JSON.stringify(aud).slice(0, 200)}`)
  } else console.log("SKIP  a USD/ZIG rate already exists for the test date")
  const ex = await call(auditor, "GET", "/accounting/multi-currency/exposure")
  const zig = ex.data && ex.data.currencies.find((c) => c.currency === "ZIG")
  check("exposure by currency: banks, investments, open invoices and bills, translated at the latest rate", ex.status === 200 && zig && zig.items.length === 4 && zig.ratePerBase > 0, `${ex.status} ${JSON.stringify(zig).slice(0, 200)}`)
} finally {
  if (!had) q(`const u=await p.currency.findFirst({where:{code:'USD'}}),z=await p.currency.findFirst({where:{code:'ZIG'}});return (await p.exchangeRate.deleteMany({where:{date:new Date('${DAY}T00:00:00Z'),fromCurrencyId:u.id,toCurrencyId:z.id,source:'MANUAL'}})).count`)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
