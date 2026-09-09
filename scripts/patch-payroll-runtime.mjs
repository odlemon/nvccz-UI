/**
 * Post-extract payroll runtime patches.
 *
 * Run after scripts/extract-payroll-v6.mjs, or alone against the current
 * runtime:
 *
 *   node scripts/patch-payroll-runtime.mjs
 *   node scripts/patch-payroll-runtime.mjs --check   (verify, write nothing)
 *
 * WHY THIS EXISTS
 * ---------------
 * components/payroll-v6-mock/matanho-payroll-runtime.js is auto-extracted from
 * the client bundle. Editing it by hand means the next extract silently throws
 * the edits away — that already happened once on the portfolio module, where a
 * regeneration discarded 20 hand-patched live-data wirings. Every runtime edit
 * therefore goes through this script, so `extract` + `patch` reproduces the
 * working runtime from scratch.
 *
 * Idempotent: every patch is marker-guarded and re-running is a no-op.
 *
 * WHAT IT PATCHES
 * ---------------
 *  1. Injects the live bridge (scripts/payroll-runtime-live-bridge.inc.js):
 *     a capture-phase `matanho:before-action` dispatcher and the live store.
 *  2. Promotes the top-level data fixtures from `const` to `let` so hydrate can
 *     replace them.
 *  3. Makes `can()` consult the signed-in user's real backend permissions
 *     instead of the client-side role simulator.
 *  4. Replaces the hardcoded sidebar badge counts ('4','2','3','29','12','3',
 *     '13') with live counts, rendering no badge when there is no live number.
 *  5. Exposes `hydrate()` on the runtime api and on window.MatanhoUI.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const RUNTIME = path.join(ROOT, "components/payroll-v6-mock/matanho-payroll-runtime.js")
const BRIDGE = path.join(ROOT, "scripts/payroll-runtime-live-bridge.inc.js")

const CHECK_ONLY = process.argv.includes("--check")

let applied = 0
let skipped = 0
let missed = 0

function must(cond, msg) {
  if (!cond) {
    console.error(`FATAL: ${msg}`)
    process.exit(1)
  }
}

/** Replace `find` with `repl` once. Treats an already-patched file as success. */
function replaceOnce(src, find, repl, label, alreadyMarker) {
  if (alreadyMarker && src.includes(alreadyMarker)) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
    return src
  }
  if (!src.includes(find)) {
    console.warn(`  MISS            ${label}`)
    missed += 1
    return src
  }
  console.log(`  patch           ${label}`)
  applied += 1
  return src.replace(find, repl)
}

/**
 * Replace EVERY occurrence. Several strings appear twice because the
 * enhancement IIFEs redefine whole page functions (employeesPage,
 * componentsPage, vendorsPage) — patching only the first occurrence leaves the
 * override, which is the one that actually renders, untouched.
 */
function replaceEvery(src, find, repl, label, alreadyMarker) {
  if (alreadyMarker && src.includes(alreadyMarker)) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
    return src
  }
  const n = src.split(find).length - 1
  if (n === 0) {
    console.warn(`  MISS            ${label}`)
    missed += 1
    return src
  }
  console.log(`  patch           ${label} (${n} site${n === 1 ? "" : "s"})`)
  applied += 1
  return src.split(find).join(repl)
}

must(fs.existsSync(RUNTIME), `runtime not found at ${RUNTIME}`)
must(fs.existsSync(BRIDGE), `live bridge not found at ${BRIDGE}`)

let s = fs.readFileSync(RUNTIME, "utf8")
const before = s

must(
  s.includes("export function startPayrollV6Runtime"),
  "runtime missing startPayrollV6Runtime marker — wrong file or a failed extract",
)

console.log(`Patching ${path.relative(ROOT, RUNTIME)}${CHECK_ONLY ? " (check only)" : ""}\n`)

// ---------------------------------------------------------------------------
// 1. Live bridge injection
// ---------------------------------------------------------------------------
const bridgeRaw = fs.readFileSync(BRIDGE, "utf8")
const bridgeBody = bridgeRaw
  .replace(/^[\s\S]*?\/\* BEGIN_PAYROLL_LIVE_BRIDGE \*\//, "")
  .replace(/\/\* END_PAYROLL_LIVE_BRIDGE \*\/[\s\S]*$/, "")
  .trim()

must(bridgeBody.length > 0, "live bridge markers produced an empty body")

const bridgeBlock = `\n  /* BEGIN_PAYROLL_LIVE_BRIDGE */\n${bridgeBody}\n  /* END_PAYROLL_LIVE_BRIDGE */\n`

if (s.includes("/* BEGIN_PAYROLL_LIVE_BRIDGE */")) {
  // Refresh in place so bridge edits propagate without a re-extract.
  s = s.replace(
    /\n?\s*\/\* BEGIN_PAYROLL_LIVE_BRIDGE \*\/[\s\S]*?\/\* END_PAYROLL_LIVE_BRIDGE \*\/\n?/,
    bridgeBlock,
  )
  console.log("  refresh         live bridge")
  applied += 1
} else {
  // Anchor: the last declaration before the runtime body. Injecting here means
  // the bridge's capture listener registers before every runtime listener.
  const anchor = "  let vendorsPage;"
  must(s.includes(anchor), "bridge anchor 'let vendorsPage;' not found")
  // bridgeBlock already starts with a newline; adding another here would make
  // a first-time inject differ from a later refresh by one blank line, so a
  // fresh extract+patch would not byte-match an incrementally patched runtime.
  s = s.replace(anchor, `${anchor}${bridgeBlock}`)
  console.log("  patch           live bridge injected")
  applied += 1
}

// ---------------------------------------------------------------------------
// 2. Fixtures must be reassignable for hydrate to replace them
// ---------------------------------------------------------------------------
const FIXTURES = [
  "employees",
  "documents",
  "folders",
  "reportTemplates",
  "auditEvents",
  "userAccess",
]
for (const name of FIXTURES) {
  const find = `\nconst ${name}=[`
  const repl = `\nlet ${name}=[`
  if (s.includes(`\nlet ${name}=[`)) {
    console.log(`  skip (already)  fixture ${name} is let`)
    skipped += 1
    continue
  }
  if (!s.includes(find)) {
    console.warn(`  MISS            fixture ${name}`)
    missed += 1
    continue
  }
  s = s.replace(find, repl)
  console.log(`  patch           fixture ${name} -> let`)
  applied += 1
}

// ---------------------------------------------------------------------------
// 3. can() consults real backend permissions when live
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "function can(permission){return (roles[state.role]||[]).includes(permission)}",
  "function can(permission){const live=__pr6Can(permission);if(live!==null)return live;return (roles[state.role]||[]).includes(permission)}",
  "can() -> live permissions",
  "const live=__pr6Can(permission)",
)

// ---------------------------------------------------------------------------
// 4. Sidebar badge counts come from data, not from literals
// ---------------------------------------------------------------------------
// The nav fixture carries counts as a 4th tuple element ('4','2','3','29',
// '12','3','13'). Those were hardcoded and sat next to live-looking numbers.
s = replaceOnce(
  s,
  "${count?`<span class=\"nav-count\">${count}</span>`:''}",
  "${(()=>{const c=__pr6IsLive()?__pr6NavCount(id):count;return c?`<span class=\"nav-count\">${c}</span>`:''})()}",
  "sidebar badge counts -> live",
  "__pr6NavCount(id)",
)

// ---------------------------------------------------------------------------
// 4b. Command-centre KPI cards come from data, not from literals
// ---------------------------------------------------------------------------
// The overview shipped with Employees '128', gross USD 264,720, gross ZiG
// 7,459,664, deductions 77,444, net 187,276 and readiness '72 / 100' baked in,
// directly above a run table that was already rendering live rows.
{
  const label = "overview KPI cards -> live"
  // Guard on the patched CALL SITE, not on the helper name — the injected
  // bridge defines __pr6OverviewStats, so checking for the name alone would
  // make this look already-applied on a freshly extracted runtime.
  if (s.includes("kpi('Employees',o.employees")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /<div class="grid kpis">\$\{kpi\('Employees','128'[\s\S]*?\}<\/div>/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const original = m[0]
      // Keep the original literals as the not-yet-hydrated fallback so a failed
      // load degrades to the previous rendering rather than a row of zeros.
      const fallback = original
        .replace(/^<div class="grid kpis">/, "")
        .replace(/<\/div>$/, "")
      const replacement =
        '<div class="grid kpis">${(()=>{const o=__pr6OverviewStats();' +
        `if(!o)return \`${fallback}\`;` +
        "return kpi('Employees',o.employees,o.employeesSub,'users','','')" +
        "+kpi('Gross payroll',money(o.grossUSD),o.periodLabel+' USD component','wallet','cyan',o.variance)" +
        "+kpi('Gross payroll',money(o.grossZiG,'ZiG'),o.periodLabel+' local component','wallet','violet','')" +
        "+kpi('Deductions',money(o.deductions),'PAYE, NSSA, AIDS levy and SDL','calculator','','')" +
        "+kpi('Net pay',money(o.netUSD),'Before bank release controls','bank','cyan')" +
        "+kpi('Readiness score',o.readiness+' / 100',o.readinessSub,'shield',o.readinessTone,o.criticalOpen?'Review':'')})()}</div>"
      s = s.replace(re, replacement)
      console.log(`  patch           ${label}`)
      applied += 1
    }
  }
}

// Readiness donut + the progress rows beside it were the same literals again.
s = replaceOnce(
  s,
  "<div class=\"donut\"><div class=\"donut-center\"><strong>72</strong><span>of 100</span></div></div>",
  "<div class=\"donut\"><div class=\"donut-center\"><strong>${(()=>{const o=__pr6OverviewStats();return o?o.readiness:72})()}</strong><span>of 100</span></div></div>",
  "readiness donut -> live",
  "return o?o.readiness:72",
)

s = replaceOnce(
  s,
  "${progressRow('Employee data',96,'96% complete')}",
  "${(()=>{const o=__pr6OverviewStats();return o?progressRow('Employee data',o.employeeDataPct,o.employeeDataPct+'% complete'):progressRow('Employee data',96,'96% complete')})()}",
  "progress: employee data -> live",
  "o.employeeDataPct+'% complete'",
)

s = replaceOnce(
  s,
  "${progressRow('Critical exceptions',63,'3 unresolved','red')}",
  "${(()=>{const o=__pr6OverviewStats();return o?progressRow('Critical exceptions',o.exceptionsPct,o.criticalOpen+' unresolved','red'):progressRow('Critical exceptions',63,'3 unresolved','red')})()}",
  "progress: critical exceptions -> live",
  "o.criticalOpen+' unresolved'",
)

// The workflow stepper was pinned to stage 4 regardless of the run's state.
s = replaceOnce(
  s,
  "${workflow(4)}",
  "${workflow((()=>{const o=__pr6OverviewStats();return o?o.runStage:4})())}",
  "workflow stage -> live",
  "return o?o.runStage:4",
)

// ---------------------------------------------------------------------------
// 4c. Employee directory KPIs, filter options and footer count
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Total employees','128','124 active, 4 on notice','users')}${kpi('Payroll ready','119','92.9% of active population','check','cyan')}${kpi('Under review','4','Data or approval issue','alert','amber')}${kpi('Blocked','3','Cannot enter final payroll','lock','red')}${kpi('New starters','2','Effective this payroll period','userplus','violet')}${kpi('Contract expiries','6','Within the next 60 days','calendar','amber')}</div>",
  "<div class=\"grid kpis\">${(()=>{const s=__pr6EmployeeStats();" +
    "if(!s)return `${kpi('Total employees','128','124 active, 4 on notice','users')}${kpi('Payroll ready','119','92.9% of active population','check','cyan')}${kpi('Under review','4','Data or approval issue','alert','amber')}${kpi('Blocked','3','Cannot enter final payroll','lock','red')}`;" +
    "return kpi('Total employees',String(s.total),s.active+' active, '+s.onNotice+' on notice','users')" +
    "+kpi('Payroll ready',String(s.ready),s.readyPct+'% of active population','check','cyan')" +
    "+kpi('Under review',String(s.review),'Data or approval issue','alert','amber')" +
    "+kpi('Blocked',String(s.blocked),'Cannot enter final payroll','lock','red')})()}</div>",
  "employee directory KPIs -> live",
  // Guard on the call site: the bridge itself contains __pr6EmployeeStats().
  "kpi('Total employees',String(s.total)",
)

s = replaceEvery(
  s,
  "<option>All departments</option><option>Finance</option><option>People & Culture</option><option>Operations</option>",
  "<option>All departments</option>${__pr6DepartmentOptions()}",
  "employee department filter -> live",
  "<option>All departments</option>${__pr6DepartmentOptions()}",
)

s = replaceEvery(
  s,
  "Showing ${filtered.length} of 128 employees",
  "Showing ${filtered.length} of ${(()=>{const s=__pr6EmployeeStats();return s?s.total:128})()} employees",
  "employee directory footer count -> live",
  "return s?s.total:128",
)

// The enhancement IIFE redefines employeesPage with the same fabricated KPIs
// but slightly different sub-text, and that override is the one that renders.
s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Total employees','128','124 active and 4 serving notice','users')}${kpi('Payroll ready','119','92.9% of the active population','check','cyan')}${kpi('Under review','4','Data or approval issue','alert','amber')}${kpi('Blocked','3','Cannot enter final payroll','lock','red')}${kpi('New starters','2','Effective in this pay period','userplus','violet')}${kpi('Contract expiries','6','Within the next 60 days','calendar','amber')}</div>",
  "<div class=\"grid kpis\">${(()=>{const s=__pr6EmployeeStats();" +
    "if(!s)return `${kpi('Total employees','128','124 active and 4 serving notice','users')}${kpi('Payroll ready','119','92.9% of the active population','check','cyan')}`;" +
    "return kpi('Total employees',String(s.total),s.active+' active and '+s.onNotice+' serving notice','users')" +
    "+kpi('Payroll ready',String(s.ready),s.readyPct+'% of the active population','check','cyan')" +
    "+kpi('Under review',String(s.review),'Data or approval issue','alert','amber')" +
    "+kpi('Blocked',String(s.blocked),'Cannot enter final payroll','lock','red')})()}</div>",
  "employee directory KPIs (IIFE override) -> live",
  "s.active+' active and '+s.onNotice+' serving notice'",
)

// ---------------------------------------------------------------------------
// 4d. Pay-component catalogue and its KPIs
// ---------------------------------------------------------------------------
// The catalogue was a nine-row literal with invented GL codes, under KPI cards
// reading 24 earnings / 17 deductions / 31 formulas / 182 test cases / 96%.
{
  const label = "component catalogue rows -> live"
  if (s.includes("(__pr6ComponentRows()||comps)")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(" const rows=comps.map(c=>")) {
    console.warn(`  MISS            ${label}`)
    missed += 1
  } else {
    s = s.replace(" const rows=comps.map(c=>", " const rows=(__pr6ComponentRows()||comps).map(c=>")
    console.log(`  patch           ${label}`)
    applied += 1
  }
}

s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Earning components','24','18 recurring, 6 variable','wallet')}${kpi('Deduction components','17','8 statutory, 9 voluntary','calculator','violet')}${kpi('Active formulas','31','Versioned calculation logic','settings','cyan')}${kpi('Pending approval','3','Configuration changes','shield','amber')}${kpi('GL mappings','100%','All active components mapped','check','cyan')}${kpi('Rule test coverage','96%','182 automated test cases','audit')}</div>",
  "<div class=\"grid kpis\">${(()=>{const c=__pr6ComponentStats();" +
    "if(!c)return `${kpi('Earning components','24','18 recurring, 6 variable','wallet')}${kpi('Deduction components','17','8 statutory, 9 voluntary','calculator','violet')}`;" +
    "return kpi('Earning components',String(c.earnings),c.earningsSub,'wallet')" +
    "+kpi('Deduction components',String(c.deductions),c.deductionsSub,'calculator','violet')" +
    "+kpi('Tax brackets',String(c.brackets),'Progressive PAYE bands','settings','cyan')" +
    "+kpi('Statutory levies',String(c.levies),'AIDS levy, NSSA and SDL rates','shield','amber')})()}</div>",
  "component KPIs -> live",
  "kpi('Earning components',String(c.earnings)",
)

// ---------------------------------------------------------------------------
// 4e. Maker-checker comparison table and band
// ---------------------------------------------------------------------------
{
  const label = "approval comparison table -> live"
  const find =
    "${[['Headcount','126','128','+2','Expected'],['Gross USD','USD 256,180.00','USD 264,720.00','+3.3%','Expected'],['Gross ZiG','ZiG 7,134,000','ZiG 7,459,664','+4.6%','Review'],['PAYE','USD 41,280.00','USD 42,967.00','+4.1%','Expected'],['Overtime','USD 8,420.00','USD 11,984.00','+42.3%','Investigate'],['Net pay','USD 181,200.00','USD 187,276.00','+3.4%','Expected']].map("
  if (s.includes("((__pr6ApprovalCompare()||{}).rows||[")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(find)) {
    console.warn(`  MISS            ${label}`)
    missed += 1
  } else {
    const fallback = find.slice(2, -5)
    s = s.replace(find, "${((__pr6ApprovalCompare()||{}).rows||" + fallback + ").map(")
    console.log(`  patch           ${label}`)
    applied += 1
  }
}

s = replaceOnce(
  s,
  "<th>Measure</th><th>May 2026</th><th>June 2026</th><th>Variance</th><th>Review</th>",
  "<th>Measure</th><th>${(()=>{const c=__pr6ApprovalCompare();return c?c.prevLabel:'May 2026'})()}</th><th>${(()=>{const c=__pr6ApprovalCompare();return c?c.curLabel:'June 2026'})()}</th><th>Variance</th><th>Review</th>",
  "approval comparison headers -> live",
  "c?c.prevLabel:'May 2026'",
)

s = replaceOnce(
  s,
  "<div class=\"band-stat\"><span>Prepared by</span><strong>Rudo Sibanda</strong></div><div class=\"band-stat\"><span>Primary checker</span><strong>Tariro Moyo</strong></div>",
  "<div class=\"band-stat\"><span>Prepared by</span><strong>${(()=>{const c=__pr6ApprovalCompare();return c?c.owner:'Rudo Sibanda'})()}</strong></div>",
  "approval band preparer -> live",
  "c?c.owner:'Rudo Sibanda'",
)

s = replaceOnce(
  s,
  "<div class=\"band-stat\"><span>Unresolved critical</span><strong>3</strong></div>",
  "<div class=\"band-stat\"><span>Unresolved critical</span><strong>${(()=>{const c=__pr6ApprovalCompare();return c?c.criticalOpen:3})()}</strong></div>",
  "approval band critical count -> live",
  "c?c.criticalOpen:3",
)

s = replaceOnce(
  s,
  "<h2>Approval review is 78% complete</h2>",
  "<h2>${(()=>{const c=__pr6ApprovalCompare();if(!c)return 'Approval review is 78% complete';const st=String(c.current.rawStatus||'');return st==='PENDING_APPROVAL'?'Awaiting independent approval':st==='APPROVED'?'Approved, awaiting release':st==='COMPLETED'?'Released':'Draft payroll run'})()}</h2>",
  "approval band headline -> live",
  "'Awaiting independent approval'",
)

// ---------------------------------------------------------------------------
// 4f. Close & distribution figures
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "${progressRow('Generated',100,'128 of 128','cyan')}",
  "${(()=>{const c=__pr6CloseStats();if(!c)return progressRow('Generated',100,'128 of 128','cyan');const n=c.released?c.headcount:0;return progressRow('Generated',c.headcount?Math.round((n/c.headcount)*100):0,n+' of '+c.headcount,'cyan')})()}",
  "close: payslip generation -> live",
  "c.released?c.headcount:0",
)

s = replaceOnce(
  s,
  "${[['Digital payslips','128','Generated'],['Verification hashes','128','Generated'],['Suppressed payslips','0','None']].map(",
  "${(()=>{const c=__pr6CloseStats();const n=c?String(c.released?c.headcount:0):'128';return [['Digital payslips',n,c&&c.released?'Generated':'Pending'],['Verification hashes',n,c&&c.released?'Generated':'Pending'],['Suppressed payslips','0','None']]})().map(",
  "close: payslip list -> live",
  "c&&c.released?'Generated':'Pending'",
)

s = replaceOnce(
  s,
  "${[['Gross payroll expense','USD 264,720','Matched'],['Payroll liabilities','USD 77,444','Matched'],['Net pay control','USD 187,276','Matched'],['Inactive cost centre','USD 2,200','Exception']].map(",
  "${(()=>{const c=__pr6CloseStats();if(!c)return [['Gross payroll expense','USD 264,720','Matched'],['Payroll liabilities','USD 77,444','Matched'],['Net pay control','USD 187,276','Matched']];return [['Gross payroll expense',__pr6Money(c.grossUSD),'Matched'],['Payroll liabilities',__pr6Money(c.deductions),'Matched'],['Net pay control',__pr6Money(c.netUSD),'Matched']]})().map(",
  "close: GL journal -> live",
  "__pr6Money(c.grossUSD),'Matched'",
)

s = replaceOnce(
  s,
  "${[['USD payroll - Stanbic','USD 86,420','Ready'],['USD payroll - CBZ','USD 58,310','Ready'],['ZiG payroll - multiple','ZiG 6,201,480','Ready'],['Bank changes holding batch','USD 2,250','Blocked']].map(",
  "${(()=>{const c=__pr6CloseStats();if(!c)return [['USD payroll - Stanbic','USD 86,420','Ready'],['USD payroll - CBZ','USD 58,310','Ready']];return [['Net pay batch ('+c.label+')',__pr6Money(c.netUSD),c.released?'Ready':'Pending'],['Employees in batch',String(c.headcount),c.released?'Ready':'Pending']]})().map(",
  "close: bank batches -> live",
  "'Net pay batch ('+c.label+')'",
)

// ---------------------------------------------------------------------------
// 4g. Enhancement-layer fixtures (the IIFEs redefine whole pages)
// ---------------------------------------------------------------------------
// componentsPage/employeesPage/vendorsPage are redefined inside the enhancement
// IIFEs and read their own V2/V3 fixture arrays, so patching the base page
// functions alone leaves the rendered screen untouched.
s = replaceOnce(
  s,
  "const filtered=payComponentsV2.filter(",
  "const filtered=(__pr6ComponentsV2()||payComponentsV2).filter(",
  "component catalogue (IIFE override) -> live",
  "(__pr6ComponentsV2()||payComponentsV2)",
)

s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Earning components','24','18 recurring and 6 variable','wallet')}${kpi('Deduction components','17','8 statutory and 9 voluntary','calculator','violet')}${kpi('Active formulas','31','Versioned calculation logic','settings','cyan')}${kpi('Pending approval','3','Configuration changes','shield','amber')}${kpi('GL mappings','100%','All active components mapped','check','cyan')}${kpi('Rule test coverage','96%','182 automated test cases','audit')}</div>",
  "<div class=\"grid kpis\">${(()=>{const c=__pr6ComponentStats();" +
    "if(!c)return `${kpi('Earning components','24','18 recurring and 6 variable','wallet')}${kpi('Deduction components','17','8 statutory and 9 voluntary','calculator','violet')}`;" +
    "return kpi('Earning components',String(c.earnings),c.earningsSub,'wallet')" +
    "+kpi('Deduction components',String(c.deductions),c.deductionsSub,'calculator','violet')" +
    "+kpi('Tax brackets',String(c.brackets),'Progressive PAYE bands','settings','cyan')" +
    "+kpi('Statutory levies',String(c.levies),'AIDS levy, NSSA and SDL rates','shield','amber')})()}</div>",
  "component KPIs (IIFE override) -> live",
  // Both KPI blocks share the same replacement text, so guard on the override's
  // own fallback wording ("and 6 variable") to tell them apart.
  "'18 recurring and 6 variable','wallet')}${kpi('Deduction components','17','8 statutory and 9 voluntary','calculator','violet')}`;",
)

// Chart series: 24 months of invented payroll and an invented department mix.
s = replaceEvery(
  s,
  "payrollTrendDataV3",
  "(__pr6TrendV3()||payrollTrendDataV3_fixture)",
  "payroll trend chart -> live",
  "__pr6TrendV3()||payrollTrendDataV3_fixture",
)
s = s.replace(
  "const (__pr6TrendV3()||payrollTrendDataV3_fixture) = [",
  "const payrollTrendDataV3_fixture = [",
)

s = replaceEvery(
  s,
  "departmentTrendDataV3",
  "(__pr6DepartmentsV3()||departmentTrendDataV3_fixture)",
  "department chart -> live",
  "__pr6DepartmentsV3()||departmentTrendDataV3_fixture",
)
s = s.replace(
  "const (__pr6DepartmentsV3()||departmentTrendDataV3_fixture) = [",
  "const departmentTrendDataV3_fixture = [",
)

// ---------------------------------------------------------------------------
// 4h. My Pay — the self-service page showed one fabricated payslip to everyone
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "function myPayPage(){\n const e=employees[0];",
  "function myPayPage(){\n const __mp=__pr6MyPayView();\n // employees[0] is the first person in the roster, not the signed-in user.\n const e=__mp?{leave:(__mp.annualLeave===null?'\\u2014':__mp.annualLeave+' days'),bank:__mp.self.bank,tax:__mp.self.tax,nssa:__mp.self.nssa,currency:__mp.self.currency,id:__mp.self.employeeNumber,title:'\\u2014',department:__mp.self.department,branch:'\\u2014',type:'\\u2014',start:__mp.self.start}:employees[0];",
  "my pay: own employee record -> live",
  "const __mp=__pr6MyPayView();",
)

// Net-pay band: period, net, gross, deductions.
s = replaceOnce(
  s,
  "<div class=\"eyebrow\" style=\"color:#7eb6ff\">JUNE 2026 NET PAY</div><h2>${money(1629.14)} <span style=\"font-size:15px;color:#9fc0ed\">+ ${money(35820,'ZiG')}</span></h2><p>Payment date: 30 June 2026 - Payslip verification hash: 5db2-79a1-c840</p>",
  "<div class=\"eyebrow\" style=\"color:#7eb6ff\">${__mp&&__mp.latest?String(__mp.latest.period).toUpperCase()+' NET PAY':'NET PAY'}</div><h2>${__mp?(__mp.hasPayslip?money(__mp.latest.net):'No payslip yet'):money(1629.14)}</h2><p>${__mp?(__mp.hasPayslip?'Pay period '+__mp.latest.period:'No payroll run has been processed for you yet.'):'Payment date: 30 June 2026'}</p>",
  "my pay: net pay band -> live",
  "String(__mp.latest.period).toUpperCase()+' NET PAY'",
)

s = replaceOnce(
  s,
  "<div class=\"band-stat\"><span>Gross earnings</span><strong>${money(2250)}</strong></div><div class=\"band-stat\"><span>Total deductions</span><strong>${money(620.86)}</strong></div><div class=\"band-stat\"><span>PAYE year to date</span><strong>${money(1945.23)}</strong></div>",
  "<div class=\"band-stat\"><span>Gross earnings</span><strong>${__mp?(__mp.hasPayslip?money(__mp.latest.gross):'\\u2014'):money(2250)}</strong></div><div class=\"band-stat\"><span>Total deductions</span><strong>${__mp?(__mp.hasPayslip?money(__mp.latest.deductions):'\\u2014'):money(620.86)}</strong></div><div class=\"band-stat\"><span>Payslips on record</span><strong>${__mp?__mp.slips.length:3}</strong></div>",
  "my pay: band stats -> live",
  "'Payslips on record'",
)

// Recent payslips list.
s = replaceOnce(
  s,
  "${[['June 2026','USD 1,629.14 + ZiG 35,820','Available'],['May 2026','USD 1,588.62 + ZiG 34,600','Available'],['April 2026','USD 1,576.18 + ZiG 34,100','Available'],['March 2026','USD 1,562.90 + ZiG 33,420','Available']].map(",
  "${(__mp?(__mp.slips.length?__mp.slips.map(p=>[p.period,money(p.net),'Available']):[['No payslips yet','\\u2014','Pending']]):[['June 2026','USD 1,629.14 + ZiG 35,820','Available']]).map(",
  "my pay: payslip list -> live",
  "__mp.slips.map(p=>[p.period,money(p.net),'Available'])",
)

// Earnings and deductions breakdown.
s = replaceOnce(
  s,
  "${[['Basic salary','USD 2,250.00'],['Housing allowance','USD 337.50'],['Transport allowance','USD 185.00'],['PAYE','(USD 482.14)'],['NSSA','(USD 31.50)'],['Medical aid','(USD 107.22)']].map(",
  "${(__mp?(__mp.breakdown.length?__mp.breakdown:[['No pay breakdown available','\\u2014']]):[['Basic salary','USD 2,250.00'],['Housing allowance','USD 337.50'],['Transport allowance','USD 185.00'],['PAYE','(USD 482.14)'],['NSSA','(USD 31.50)'],['Medical aid','(USD 107.22)']]).map(",
  "my pay: earnings breakdown -> live",
  "__mp.breakdown.length?__mp.breakdown",
)

// Leave ring and progress rows.
s = replaceOnce(
  s,
  "<div class=\"readiness-ring\" style=\"--pct:78%;margin:0 auto 15px\"><strong>15.5</strong></div>${progressRow('Annual leave used',40,'10 of 25 days','violet')}${progressRow('Pending leave',12,'3 days requested','amber')}",
  "<div class=\"readiness-ring\" style=\"--pct:${__mp&&__mp.annualLeave!==null?Math.min(100,Math.round((__mp.annualLeave/25)*100)):78}%;margin:0 auto 15px\"><strong>${__mp?(__mp.annualLeave===null?'\\u2014':__mp.annualLeave):15.5}</strong></div>${(__mp?__mp.balances:[]).map(b=>progressRow(b.leaveType.charAt(0)+b.leaveType.slice(1).toLowerCase()+' balance',Math.min(100,Math.round((Number(b.balance)/25)*100)),Number(b.balance)+' days','violet')).join('')}",
  "my pay: leave balances -> live",
  "b.leaveType.charAt(0)+b.leaveType.slice(1).toLowerCase()",
)

// Training list: no certifications exist for these users, so say so.
s = replaceOnce(
  s,
  "${[['Payroll Data Privacy','Complete','30 Jun 2027'],['Cybersecurity Awareness','Complete','15 Jul 2027'],['Anti-Money Laundering','Complete','31 Jul 2026']].map(",
  "${(__pr6IsLive()?(((__pr6Ref().certifications)||[]).length?((__pr6Ref().certifications)||[]).map(c=>[c.courseTitle||c.code||'Course',c.status||'Recorded',c.expiresAt?String(c.expiresAt).slice(0,10):'\\u2014']):[['No certifications recorded','Pending','\\u2014']]):[['Payroll Data Privacy','Complete','30 Jun 2027'],['Cybersecurity Awareness','Complete','15 Jul 2027'],['Anti-Money Laundering','Complete','31 Jul 2026']]).map(",
  "my pay: training list -> live",
  "'No certifications recorded'",
)

// ---------------------------------------------------------------------------
// 5. hydrate() on the api object
// ---------------------------------------------------------------------------
const API_ANCHOR = `  api = {
    setPage(page) {`
const HYDRATE_IMPL = `  api = {
    /**
     * Replace the runtime's fixtures with live API data and re-render.
     * Injected by scripts/patch-payroll-runtime.mjs — see that script.
     *
     * Partial payloads are fine: only the keys present are replaced, so one
     * failed loader does not blank the whole module.
     */
    hydrate(payload) {
      if (!payload || typeof payload !== 'object') return;
      try {
        if (Array.isArray(payload.employees)) employees = payload.employees;
        if (Array.isArray(payload.payrollRuns)) payrollRuns = payload.payrollRuns;
        if (Array.isArray(payload.exceptions)) exceptions = payload.exceptions;
        if (Array.isArray(payload.documents)) documents = payload.documents;
        if (Array.isArray(payload.folders)) folders = payload.folders;
        if (Array.isArray(payload.reportTemplates)) reportTemplates = payload.reportTemplates;
        if (Array.isArray(payload.auditEvents)) auditEvents = payload.auditEvents;
        if (Array.isArray(payload.userAccess)) userAccess = payload.userAccess;

        if (Array.isArray(payload.permissions)) {
          __pr6Live.permissions = new Set(payload.permissions);
        }
        if (payload.roleName) {
          __pr6Live.roleName = payload.roleName;
          // Keep the runtime's own role label in step so any remaining
          // role-driven copy shows the real role rather than the mock default.
          if (typeof state !== 'undefined') state.role = payload.roleName;
        }
        if (payload.counts && typeof payload.counts === 'object') {
          __pr6Live.counts = payload.counts;
        }
        // Reference/self-service payloads have no fixture equivalent in the
        // runtime, so they are kept on the live store for the page builders.
        if (payload.reference && typeof payload.reference === 'object') {
          __pr6Live.reference = payload.reference;
        }
        if (payload.dashboard && typeof payload.dashboard === 'object') {
          __pr6Live.dashboard = payload.dashboard;
        }
        if (payload.mypay && typeof payload.mypay === 'object') {
          __pr6Live.mypay = payload.mypay;
        }
        if (Array.isArray(payload.errors)) __pr6Live.errors = payload.errors;

        __pr6Live.ready = true;
        if (typeof render === 'function') render();
      } catch (err) {
        try { console.error('[payroll-v6] hydrate failed', err); } catch (_) {}
      }
    },
    setPage(page) {`

s = replaceOnce(s, API_ANCHOR, HYDRATE_IMPL, "api.hydrate()", "hydrate(payload) {")

// ---------------------------------------------------------------------------
// 6. Expose hydrate on window.MatanhoUI so the host can call it either way
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "  return api;\n}",
  `  try {
    window.MatanhoUI = window.MatanhoUI || {};
    window.MatanhoUI.hydrate = (payload) => api.hydrate && api.hydrate(payload);
  } catch (_) {}

  return api;
}`,
  "window.MatanhoUI.hydrate",
  "window.MatanhoUI.hydrate =",
)

// ---------------------------------------------------------------------------

console.log("")
if (missed > 0) {
  console.error(
    `${missed} patch(es) did not match. The runtime has drifted — fix the anchors before shipping.`,
  )
}
console.log(`applied=${applied} skipped=${skipped} missed=${missed}`)

if (CHECK_ONLY) {
  const wouldChange = s !== before
  console.log(wouldChange ? "check: runtime WOULD change" : "check: runtime already up to date")
  process.exit(missed > 0 ? 1 : 0)
}

if (s === before) {
  console.log("runtime already up to date — nothing written")
} else {
  fs.writeFileSync(RUNTIME, s)
  console.log(`wrote ${path.relative(ROOT, RUNTIME)}`)
}

process.exit(missed > 0 ? 1 : 0)
