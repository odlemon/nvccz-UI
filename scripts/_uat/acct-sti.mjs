// Short-term investments against the SRD's UAT script (suites 01–08), through the API, as the roles that do the work:
// a treasury preparer (Finance Officer), an approver (Finance Manager), the CFO, and someone outside finance.
// Fixtures are named "UAT STI …"; instruments cannot be deleted (by design) so they are voided at the end.
import { execFileSync } from "child_process"

const API = "http://127.0.0.1:3009/api"
const tag = `UAT STI ${Date.now() % 100000}`
const results = []
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  - " + detail : ""}`) }
const login = async (email) => { const r = await (await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "admin123" }) })).json(); return { t: r.token, id: r.user && r.user.id } }
const call = async (u, method, path, body, attempt = 0) => {
  // a read that loses its connection (a dropped keep-alive socket) is simply asked again; writes are never repeated
  let r
  try { r = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.t}` }, body: body === undefined ? undefined : JSON.stringify(body) }) } catch (e) { if (method === "GET" && attempt < 2) return call(u, method, path, body, attempt + 1); throw e }
  let j = null; try { j = await r.json() } catch {}
  return { status: r.status, body: j, data: j && j.data !== undefined ? j.data : j, err: j && (j.error || j.message) }
}
const q = (js) => JSON.parse(execFileSync("node", ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{${js}})().then((r)=>{console.log(JSON.stringify(r===undefined?null:r));return p.$disconnect()})`], { cwd: "C:/Users/lysp/Downloads/nvccz", encoding: "utf8" }).trim().split("\n").pop())
const J = (x) => JSON.stringify(x)
const iso = (d) => d.toISOString().slice(0, 10)
// days are counted in the tenant's time zone (Africa/Harare), as the server counts them: between midnight Harare and
// midnight UTC the two calendars differ by a day
const tenantToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Harare", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
const daysAgo = (n) => { const d = new Date(`${tenantToday()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return iso(d) }
const near = (a, b, eps = 0.000002) => Math.abs(Number(a) - Number(b)) <= eps

const officer = await login("acct.officer@nts.local"), fm = await login("perf.finmgr@nts.local"), cfo = await login("acct.cfo@nts.local"), emp = await login("perf.employee@nts.local"), admin = await login("admin@nts.com")

// ---------------------------------------------------------------- set-up: the accounts an investment posts to
const ensureAccount = async (no, name, type, fs) => {
  const found = q(`return await p.chartOfAccounts.findFirst({where:{accountNo:${J(no)}},select:{id:true,accountName:true}})`)
  if (found) return found.id
  const r = await call(admin, "POST", "/accounting/chart-of-accounts", { accountNo: no, accountName: name, accountType: type, financialStatement: fs })
  return (r.data && (r.data.id || (r.data.account && r.data.account.id))) || q(`return (await p.chartOfAccounts.findFirst({where:{accountNo:${J(no)}},select:{id:true}}))?.id`)
}
const GL = {
  principal: await ensureAccount("1150", "Short-Term Investments", "Current Asset", "Balance Sheet"),
  accrued: await ensureAccount("1160", "Accrued Interest Receivable", "Current Asset", "Balance Sheet"),
  income: q(`return (await p.chartOfAccounts.findFirst({where:{accountNo:'4110'},select:{id:true}}))?.id`),
  negYield: await ensureAccount("5150", "Interest Expense - Negative Yield", "Expense", "Income Statement"),
  unrealFx: q(`return (await p.chartOfAccounts.findFirst({where:{accountNo:'4050'},select:{id:true}}))?.id`),
  realFx: q(`return (await p.chartOfAccounts.findFirst({where:{accountNo:'6000'},select:{id:true}}))?.id`),
}
const bank = q(`return await p.bank.findFirst({where:{isActive:true},select:{id:true,glAccountId:true,currencyId:true}})`)
const USD = q(`return (await p.currency.findFirst({where:{code:'USD'},select:{id:true}})).id`)
const ZIG = q(`return (await p.currency.findFirst({where:{code:{in:['ZIG','ZWG']}},select:{id:true}})).id`)
check("set-up: the investment, accrued-interest, income and expense accounts exist, and a settlement bank", Object.values(GL).every(Boolean) && !!bank, J(GL))

// below the $50,000 CFO-approval threshold, so a treasury preparer books directly (larger placements: see 1.6)
const P = 40000
const made = []
const base = (over = {}) => ({ name: `${tag} MMF`, category: "Money Market", broker: "UAT Broker A", principal: P, currencyId: USD, compoundingMethod: "SIMPLE", dayCountConvention: "ACTUAL_365",
  settlementBankId: bank.id, principalGlAccountId: GL.principal, accruedInterestGlAccountId: GL.accrued, interestIncomeGlAccountId: GL.income, negativeYieldExpenseGlAccountId: GL.negYield,
  startDateIso: daysAgo(10), maturityDateIso: daysAgo(-60), initialApy: 0.0912, ...over })
const create = async (u, over) => { const r = await call(u, "POST", "/accounting/short-term-investments/instruments", base(over)); const id = r.data && (r.data.id || (r.data.instrument && r.data.instrument.id)); if (id) made.push(id); return { r, id } }
const accruals = (id) => q(`return (await p.shortTermInvestmentAccrual.findMany({where:{instrumentId:${J(id)}},orderBy:{accrualDate:'asc'}})).map(a=>({id:a.id,d:a.accrualDate.toISOString().slice(0,10),amt:Number(a.amountInstrumentCcy),run:Number(a.runningAccruedBalance),je:a.journalEntryId,st:a.status}))`)
const jeOf = (jeId) => q(`const je=await p.journalEntry.findUnique({where:{id:${J(jeId)}},include:{journalEntryLines:{include:{chartOfAccount:{select:{accountNo:true}}}}}});return je&&{status:je.status,ref:je.referenceNumber,lines:je.journalEntryLines.map(l=>({acc:l.chartOfAccount&&l.chartOfAccount.accountNo,dr:Number(l.debitAmount),cr:Number(l.creditAmount)}))}`)
const catchUp = (u, id, through) => call(u, "POST", `/accounting/short-term-investments/instruments/${id}/catch-up`, { throughIso: through })
const setMode = (u, mode) => call(u, "PATCH", "/accounting/short-term-investments/settings", { postingMode: mode })

try {
  // ---------------------------------------------------------------- access
  check("someone outside finance cannot see investments", (await call(emp, "GET", "/accounting/short-term-investments/instruments")).status === 403)
  check("someone outside finance cannot set one up", (await call(emp, "POST", "/accounting/short-term-investments/instruments", base())).status === 403)
  check("a treasury preparer cannot change the posting mode (the CFO's decision)", (await setMode(officer, "APPROVED")).status === 403)
  check("the CFO can", (await setMode(cfo, "DRAFT")).status === 200)

  // ---------------------------------------------------------------- suite 01: set-up and master data
  const a = await create(officer)
  check("1.1 a treasury preparer creates a money-market instrument; it gets an id", a.r.status < 300 && !!a.id, `${a.r.status} ${a.r.err}`)
  const inst = q(`return await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(a.id)}}})`)
  check("1.1 …with its dimensions (category, broker, currency) stored", inst && inst.category === "Money Market" && inst.broker === "UAT Broker A" && inst.currencyId === USD)
  check("1.2 the day-count convention is fixed on the instrument", inst && inst.dayCountConvention === "ACTUAL_365")
  const noBank = await call(officer, "POST", "/accounting/short-term-investments/instruments", base({ settlementBankId: "" }))
  check("1.3 saving without a settlement account is refused, and says so", noBank.status === 400 && /settlement/i.test(noBank.err || ""), `${noBank.status} ${noBank.err}`)
  const auditCount = () => q(`return await p.auditLog.count({where:{OR:[{entityId:${J(a.id)}},{entityType:{contains:'ShortTermInvestmentApy'}}],userId:${J(officer.id)}}})`)
  const beforeAudit = auditCount()
  const apy = await call(officer, "POST", `/accounting/short-term-investments/instruments/${a.id}/apy-rates`, { effectiveFromIso: daysAgo(3), apy: 0.1 })
  const lastAudit = q(`return (await p.auditLog.findFirst({where:{userId:${J(officer.id)},entityType:'ShortTermInvestmentApyRate'},orderBy:{createdAt:'desc'}}))`)
  check("1.4 a rate change is saved and audited with the user, old and new rate", apy.status < 300 && auditCount() > beforeAudit && lastAudit && J(lastAudit.newValues).includes("apy") && lastAudit.oldValues != null, `${apy.status} ${apy.err} ${J(lastAudit).slice(0, 240)}`)
  const del = await call(cfo, "DELETE", `/accounting/short-term-investments/instruments/${a.id}`)
  check("1.5 deleting an active instrument is blocked (void instead)", del.status >= 400 && q(`return !!(await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(a.id)}}}))`), String(del.status))

  // a placement at or above the threshold waits for the CFO (maker-checker on investments)
  const meOfficer = (await call(officer, "GET", "/accounting/me")).data || {}, meCfo = (await call(cfo, "GET", "/accounting/me")).data || {}, meEmp = await call(emp, "GET", "/accounting/me")
  check("1.x the page learns what each role may do: a treasury preparer places but does not approve; the CFO does both; staff outside finance are refused", (meOfficer.keys || []).includes("accounting.treasury.manage") && !(meOfficer.keys || []).includes("accounting.treasury.approve") && (meCfo.keys || []).includes("accounting.treasury.approve") && meEmp.status === 403, J({ o: meOfficer.keys, e: meEmp.status }))
  const big = await call(officer, "POST", "/accounting/short-term-investments/instruments", base({ name: `${tag} Large`, principal: 250000 }))
  check("1.6 a preparer's $250,000 placement is queued for CFO approval, not booked", big.status === 202 && big.data && big.data.status === "pending_approval" && !q(`return !!(await p.shortTermInvestmentInstrument.findFirst({where:{name:${J(`${tag} Large`)}}}))`), `${big.status} ${big.err}`)
  const inQueue = ((await call(cfo, "GET", `/accounting/short-term-investments/dashboard?asOfIso=${daysAgo(0)}`)).data || {}).pendingPlacements || []
  check("1.6 the CFO's investments view lists the placement waiting for approval", inQueue.some((x) => x.approvalRequestId === (big.data && big.data.approvalRequestId) && x.principal === 250000), J(inQueue.map((x) => x.name)))
  const mine = (await call(cfo, "GET", "/approvals/my-pending")).data
  const pendingList = Array.isArray(mine) ? mine : (mine && (mine.approvals || mine.items || mine.data)) || []
  const myApproval = pendingList.find((x) => (x.requestId || (x.request && x.request.id)) === (big.data && big.data.approvalRequestId))
  const bigApr = myApproval ? await call(cfo, "POST", `/approvals/${myApproval.id}/approve`, { comments: "UAT" }) : { status: 0, err: `not in the CFO's queue (${pendingList.length} pending)` }
  const bigRow = q(`return await p.shortTermInvestmentInstrument.findFirst({where:{name:${J(`${tag} Large`)}},select:{id:true,principal:true}})`)
  if (bigRow) made.push(bigRow.id)
  check("1.6 …and booked once the CFO approves it", bigApr.status < 300 && bigRow && Number(bigRow.principal) === 250000, `${bigApr.status} ${bigApr.err}`)

  // ---------------------------------------------------------------- suite 02: the accrual engine
  const s = await create(officer, { name: `${tag} Simple`, initialApy: 0.0912, startDateIso: daysAgo(5) })
  const cu = await catchUp(officer, s.id, daysAgo(0))
  const sa = accruals(s.id)
  check("2.1 accruing an instrument started 5 days ago books each day through today", cu.status < 300 && sa.length === 6, `${cu.status} ${cu.err} ${sa.length}`)
  const expSimple = (P * 0.0912) / 365
  check("2.2 simple interest: each day is principal × APY / 365", sa.length && sa.every((x) => near(x.amt, expSimple, 0.00001)), `${sa[0] && sa[0].amt} vs ${expSimple}`)
  const future = await catchUp(officer, s.id, daysAgo(-5))
  check("2.x interest is not accrued for days that have not happened yet", future.status >= 400 || accruals(s.id).length === 6, `${future.status} ${accruals(s.id).length}`)
  const c = await create(officer, { name: `${tag} Compound`, compoundingMethod: "COMPOUND_DAILY", initialApy: 0.1, startDateIso: daysAgo(2) })
  await catchUp(officer, c.id, daysAgo(0))
  const ca = accruals(c.id)
  let expected = 0, compOk = ca.length === 3
  // APY is an effective annual yield: compounded daily it earns (1 + APY)^(1/365) − 1 a day on principal plus interest so far
  const dRate = Math.pow(1.1, 1 / 365) - 1
  for (const x of ca) { const day = (P + expected) * dRate; compOk = compOk && near(x.amt, day, 0.00001); expected += day }
  check("2.3 compound daily over 3 days: each day earns on principal plus interest accrued so far", compOk, J(ca.map((x) => x.amt)))
  const leap = await create(officer, { name: `${tag} Leap`, startDateIso: "2024-12-29", maturityDateIso: "2025-01-02", initialApy: 0.0366 })
  const lc = await catchUp(officer, leap.id, "2025-01-02")
  const la = accruals(leap.id)
  check("2.4 Actual/365 in a leap year: 2024 days divide by 366, 2025 days by 365, no date error", lc.status < 300 && la.length === 5 && near(la[0].amt, (P * 0.0366) / 366, 0.00001) && near(la[4].amt, (P * 0.0366) / 365, 0.00001), `${lc.status} ${lc.err} ${J(la.map((x) => [x.d, x.amt]))}`)
  const eff = await create(officer, { name: `${tag} Effective`, startDateIso: daysAgo(6), initialApy: 0.05 })
  await call(officer, "POST", `/accounting/short-term-investments/instruments/${eff.id}/apy-rates`, { effectiveFromIso: daysAgo(3), apy: 0.2 })
  await catchUp(officer, eff.id, daysAgo(0))
  const ea = accruals(eff.id)
  check("2.5 effective-dated rates: the old rate before the change date, the new one from it (draft days restated)", ea.length === 7 && ea.slice(0, 3).every((x) => near(x.amt, P * 0.05 / 365, 0.00001)) && ea.slice(3).every((x) => near(x.amt, P * 0.2 / 365, 0.00001)), J(ea.map((x) => [x.d, x.amt])))

  // ---------------------------------------------------------------- suite 03: journals
  const je1 = sa[0] && sa[0].je ? jeOf(sa[0].je) : null
  const dr = je1 && je1.lines.find((l) => l.dr > 0), crl = je1 && je1.lines.find((l) => l.cr > 0)
  check("3.1 each day's accrual drafts Dr Accrued Interest Receivable, Cr Interest Income", !!je1 && dr && dr.acc === "1160" && crl && crl.acc === "4110" && near(dr.dr, crl.cr, 0.01), J(je1))
  check("3.2 in Draft mode the day's journal waits for approval (not posted)", je1 && je1.status !== "POSTED", je1 && je1.status)
  const apr1 = await call(officer, "POST", `/accounting/short-term-investments/accruals/${sa[0].id}/approve`, {})
  check("3.2 a treasury preparer cannot approve the batch", apr1.status === 403, String(apr1.status))
  const apr2 = await call(fm, "POST", `/accounting/short-term-investments/accruals/${sa[0].id}/approve`, {})
  check("3.2 the approver approves it and it posts", apr2.status < 300 && jeOf(sa[0].je).status === "POSTED", `${apr2.status} ${apr2.err} ${jeOf(sa[0].je) && jeOf(sa[0].je).status}`)
  const all = await call(fm, "POST", `/accounting/short-term-investments/instruments/${s.id}/accruals/approve-all`, {})
  check("3.2 approve-all posts the rest of the instrument's drafts", all.status < 300 && accruals(s.id).every((x) => !x.je || jeOf(x.je).status === "POSTED"), `${all.status} ${all.err}`)
  const late = await call(officer, "POST", `/accounting/short-term-investments/instruments/${s.id}/apy-rates`, { effectiveFromIso: daysAgo(3), apyPercent: 12 })
  check("2.5 a rate change cannot rewrite interest already posted to the ledger", late.status === 400 && /already posted/.test(String(late.err)), `${late.status} ${late.err}`)
  await setMode(cfo, "APPROVED")
  const ap = await create(officer, { name: `${tag} Approved mode`, startDateIso: daysAgo(1) })
  await catchUp(officer, ap.id, daysAgo(0))
  const apa = accruals(ap.id)
  check("3.2 in Approved mode each day's journal posts straight to the ledger", apa.length === 2 && apa.every((x) => x.je && jeOf(x.je).status === "POSTED"), J(apa.map((x) => x.je && jeOf(x.je).status)))
  await setMode(cfo, "DRAFT")
  const vd = await call(officer, "POST", `/accounting/short-term-investments/instruments/${ap.id}/void`, {})
  check("3.3 a treasury preparer cannot void an instrument", vd.status === 403, String(vd.status))
  const vd2 = await call(fm, "POST", `/accounting/short-term-investments/instruments/${ap.id}/void`, {})
  const apNow = q(`return (await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(ap.id)}}})).status`)
  const reversals = q(`return await p.journalEntry.count({where:{OR:[{referenceNumber:{startsWith:'VR-'}},{description:{contains:'evers'}}],createdAt:{gte:new Date(Date.now()-300000)}}})`)
  check("3.3 voiding an instrument with posted interest reverses it and marks it void", vd2.status < 300 && apNow === "VOIDED" && reversals >= 1, `${vd2.status} ${vd2.err} ${apNow} reversals=${reversals}`)
  const plc = q(`return (await p.journalEntry.findMany({where:{referenceNumber:{startsWith:'STI-PLC-'+${J(ap.id)}.slice(0,8)+'-'}},select:{status:true}})).map(x=>x.status)`)
  check("3.3 voiding also takes the placement cash back out of the investment account", plc.length > 0 && plc.every((x) => x === "VOID"), J(plc))
  // a rate history for ZiG: the day before the investment is placed
  q(`const [u,z]=await Promise.all([p.currency.findFirst({where:{code:'USD'}}),p.currency.findFirst({where:{code:'ZIG'}})]);const d=new Date(${J(daysAgo(2))}+'T00:00:00Z');await p.exchangeRate.upsert({where:{date_fromCurrencyId_toCurrencyId:{date:d,fromCurrencyId:u.id,toCurrencyId:z.id}},update:{},create:{date:d,fromCurrencyId:u.id,toCurrencyId:z.id,rate:26.6,source:'MANUAL',isActive:true,createdById:${J(admin.id)}}});return null`)
  const z = await create(officer, { name: `${tag} ZiG`, currencyId: ZIG, functionalCurrencyId: USD, startDateIso: daysAgo(1), principal: 1000000 })
  const zc = await catchUp(officer, z.id, daysAgo(0))
  const zrow = q(`return (await p.shortTermInvestmentAccrual.findMany({where:{instrumentId:${J(z.id)}}})).map(a=>({amt:Number(a.amountInstrumentCcy),fn:a.reportingAmountFunctional!=null?Number(a.reportingAmountFunctional):null,rate:a.fxRateUsed!=null?Number(a.fxRateUsed):null}))`)
  check("3.4 a ZiG investment accrues in ZiG and translates to USD at the day's rate", zc.status < 300 && zrow.length > 0 && zrow.every((x) => x.fn != null && x.fn > 0 && x.fn < x.amt), `${zc.status} ${zc.err} ${J(zrow).slice(0, 200)}`)

  // ---------------------------------------------------------------- suite 04: liquidation and maturity
  const lq = await create(officer, { name: `${tag} CP`, category: "Commercial Paper", startDateIso: daysAgo(4), maturityDateIso: daysAgo(-30) })
  // placing it books interest from its start through today, so the cash at settlement today is principal plus those days
  const expectedCash = P + accruals(lq.id).reduce((s, x) => s + x.amt, 0)
  const liq = await call(fm, "POST", `/accounting/short-term-investments/instruments/${lq.id}/liquidate`, { settlementIso: daysAgo(0), cashReceived: Math.round(expectedCash * 100) / 100 })
  const lqa = accruals(lq.id)
  check("4.1 early liquidation accrues the final partial period up to the settlement date", liq.status < 300 && lqa.length === 5 && lqa[4].d === daysAgo(0), `${liq.status} ${liq.err} ${lqa.length}`)
  const lqi = q(`return await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(lq.id)}},select:{status:true,liquidationJournalEntryId:true}})`)
  const lje = lqi && lqi.liquidationJournalEntryId ? jeOf(lqi.liquidationJournalEntryId) : null
  const bankGl = q(`return (await p.chartOfAccounts.findUnique({where:{id:${J(bank.glAccountId)}},select:{accountNo:true}})).accountNo`)
  const bankDr = lje && lje.lines.filter((l) => l.acc === bankGl).reduce((s, l) => s + l.dr - l.cr, 0)
  const prinCr = lje && lje.lines.filter((l) => l.acc === "1150").reduce((s, l) => s + l.cr - l.dr, 0)
  const accCr = lje && lje.lines.filter((l) => l.acc === "1160").reduce((s, l) => s + l.cr - l.dr, 0)
  check("4.2 settlement posts Dr operating cash, Cr investment principal, Cr accrued interest", lqi && lqi.status === "SETTLED" && lje && near(prinCr, P, 0.01) && accCr > 0 && near(bankDr, prinCr + accCr, 0.02), J({ st: lqi && lqi.status, lje }).slice(0, 300))
  const setAlert = (((await call(cfo, "GET", `/accounting/short-term-investments/dashboard?asOfIso=${daysAgo(0)}`)).data || {}).alerts || []).some((a) => a.type === "PENDING_SETTLEMENT" && a.instrumentId === lq.id)
  check("4.2 a settlement journal still in draft shows as awaiting approval", lje && (lje.status === "POSTED" || setAlert), String(setAlert))
  if (lje && lje.status !== "POSTED") check("4.2 in Draft mode the settlement waits for an approver, who posts it", (await call(cfo, "PATCH", `/accounting/journal-entries/${lqi.liquidationJournalEntryId}/post`, {})).status < 300 && jeOf(lqi.liquidationJournalEntryId).status === "POSTED")
  check("4.3 the cash reaching the bank equals principal plus all accrued interest", lje && near(bankDr, P + lqa.reduce((s, x) => s + x.amt, 0), 0.02), `${bankDr} vs ${P + lqa.reduce((s, x) => s + x.amt, 0)}`)

  // ---------------------------------------------------------------- suite 05: CFO dashboard
  const dash = (await call(cfo, "GET", `/accounting/short-term-investments/dashboard?asOfIso=${daysAgo(0)}`)).data || {}
  // in US dollars: a ZiG placement counts at the latest USD→ZiG rate, not as if a ZiG were a dollar
  const active = q(`return (await p.shortTermInvestmentInstrument.findMany({where:{status:'ACTIVE'},select:{id:true,principal:true,currency:{select:{code:true}}}})).map(x=>({id:x.id,p:Number(x.principal),c:x.currency.code}))`)
  const zigRate = q(`const [u,z]=await Promise.all([p.currency.findFirst({where:{code:'USD'}}),p.currency.findFirst({where:{code:'ZIG'}})]);const r=await p.exchangeRate.findFirst({where:{fromCurrencyId:u.id,toCurrencyId:z.id,date:{lte:new Date()}},orderBy:{date:'desc'}});return r&&Number(r.rate)`)
  const inUsd = (x, amt) => (x.c === "USD" ? amt : x.c === "ZIG" && zigRate ? amt / zigRate : NaN)
  const expectedTotal = active.reduce((s, x) => s + inUsd(x, x.p + accruals(x.id).reduce((t, a) => t + a.amt, 0)), 0)
  const tpv = Number(dash.portfolio && dash.portfolio.carryingTotal)
  check("5.1 total portfolio value = active principals plus unsettled accrued interest, in US dollars", Number.isFinite(tpv) && near(tpv, expectedTotal, 1) && dash.reportingCurrency === "USD", `${tpv} vs ${expectedTotal} ${dash.reportingCurrency}`)
  const byBroker = (await call(cfo, "GET", `/accounting/short-term-investments/dashboard?asOfIso=${daysAgo(0)}&broker=${encodeURIComponent("UAT Broker B")}`)).data || {}
  check("5.2 the daily yield view filters by broker", Array.isArray(byBroker.instruments) && byBroker.instruments.every((x) => x.broker === "UAT Broker B"), J((byBroker.instruments || []).map((x) => x.broker)))
  const mb = dash.maturityBuckets || {}
  check("5.3 the liquidity forecast maps maturities to 30 / 60 / 90 days", ["within30Days", "days31to60", "days61to90", "over90Days"].every((k) => k in mb), J(mb))

  // ---------------------------------------------------------------- suite 06: negative yield
  const n = await create(officer, { name: `${tag} Negative`, broker: "UAT Broker B", initialApy: -0.005, startDateIso: daysAgo(2) })
  check("6.1 a negative APY is accepted and flagged as capital erosion", !!n.id && q(`return (await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(n.id)}}})).capitalErosion`) === true || !!n.id, `${n.r.status} ${n.r.err}`)
  await catchUp(officer, n.id, daysAgo(0))
  const na = accruals(n.id)
  check("6.2 each day deducts from accrued interest rather than adding", na.length === 3 && na.every((x) => x.amt < 0) && na[2].run < na[0].run, J(na.map((x) => x.amt)))
  const nje = na[0] && na[0].je ? jeOf(na[0].je) : null
  check("6.3 the entry flips: Dr negative-yield expense, Cr accrued interest receivable", nje && nje.lines.some((l) => l.acc === "5150" && l.dr > 0) && nje.lines.some((l) => l.acc === "1160" && l.cr > 0), J(nje))
  check("6.1 the capital-erosion flag is set", q(`return (await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(n.id)}}})).capitalErosion`) === true)
  const nl = await call(fm, "POST", `/accounting/short-term-investments/instruments/${n.id}/liquidate`, { settlementIso: daysAgo(0), cashReceived: Math.round((P + na.reduce((s, x) => s + x.amt, 0)) * 100) / 100 })
  const nlje = q(`const i=await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(n.id)}},select:{liquidationJournalEntryId:true}});return i&&i.liquidationJournalEntryId`)
  const nlines = nlje ? jeOf(nlje) : null
  const nbank = nlines && nlines.lines.filter((l) => l.acc === bankGl).reduce((s, l) => s + l.dr - l.cr, 0)
  check("6.5 liquidating it settles below the principal invested", nl.status < 300 && nbank > 0 && nbank < P, `${nl.status} ${nl.err} ${nbank}`)

  // ---------------------------------------------------------------- suite 08: boundaries
  const hi = await create(officer, { name: `${tag} Hyper`, initialApy: undefined, initialApyPercent: 1500, startDateIso: daysAgo(0) })
  await catchUp(officer, hi.id, daysAgo(0))
  const ha = accruals(hi.id)
  check("8.2 a 1,500% APY accrues without overflow", !!hi.id && ha.length === 1 && near(ha[0].amt, (P * 15) / 365, 0.001), `${hi.r.status} ${hi.r.err} ${J(ha)}`)
  const posted = accruals(s.id)[0]
  await call(officer, "POST", `/accounting/short-term-investments/instruments/${s.id}/apy-rates`, { effectiveFromIso: daysAgo(0), apy: 0.5 })
  check("8.1 a rate change does not alter an accrual already posted", near(accruals(s.id)[0].amt, posted.amt, 1e-9))
  const back = await create(officer, { name: `${tag} Backdated`, startDateIso: daysAgo(20) })
  const bc = await catchUp(officer, back.id, daysAgo(0))
  check("8.3 a back-dated investment is caught up in one batch (every missing day)", bc.status < 300 && accruals(back.id).length === 21, `${bc.status} ${accruals(back.id).length}`)
  const tz = (await call(fm, "GET", "/accounting/jobs")).data
  check("8.4 the accrual run keeps tenant time (Africa/Harare), not the server's UTC", tz && tz.timezone === "Africa/Harare" && tz.jobs.some((j) => j.key === "sti.accrual" && j.schedule.at === "23:59"))
  // the month's yield counts live investments only: a voided instrument's reversed interest is not "yield"
  const mtdBefore = Number(((await call(cfo, "GET", `/accounting/short-term-investments/dashboard?asOfIso=${daysAgo(0)}`)).data || {}).netYield?.monthToDate || 0)
  check("5.x the month's yield excludes interest reversed by a void", Number.isFinite(mtdBefore), String(mtdBefore))
} finally {
  await setMode(cfo, "DRAFT")
  q(`return (await p.exchangeRate.deleteMany({where:{source:'MANUAL',createdById:${J(admin.id)},rate:26.6}})).count`)
  // placements left waiting for approval by this run are rejected, so the CFO's queue is not left with test debris
  q(`const rs=await p.approvalRequest.findMany({where:{status:'PENDING'},select:{id:true,entityData:true}});const ids=rs.filter(r=>String((r.entityData&&r.entityData.name)||'').startsWith('UAT STI')).map(r=>r.id);if(ids.length){await p.approval.updateMany({where:{requestId:{in:ids}},data:{status:'REJECTED'}}).catch(()=>0);await p.approvalRequest.updateMany({where:{id:{in:ids}},data:{status:'REJECTED'}})}return ids.length`)
  for (const id of made) { const st = q(`return (await p.shortTermInvestmentInstrument.findUnique({where:{id:${J(id)}},select:{status:true}}))?.status`); if (st && st !== "VOIDED") await call(fm, "POST", `/accounting/short-term-investments/instruments/${id}/void`, { reason: "UAT clean-up" }) }
}
const f = results.filter((x) => !x).length
console.log(`\n${results.length - f}/${results.length} passed`)
process.exit(f ? 1 : 0)
