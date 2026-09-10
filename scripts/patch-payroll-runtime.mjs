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
// 4a2. Vendors & Quotations registry and KPIs come from the real Vendor table
// ---------------------------------------------------------------------------
// The screen shipped a hardcoded registry — Medsure Health Fund, VEN-001 and
// friends, each with an invented rating and compliance percentage — under KPI
// cards asserting 26 registered vendors. It was the module's largest block of
// untraced numbers. There is no fixture fallback: showing invented suppliers
// when the real table is empty is the defect, so empty renders as empty.
//
// Both targets sit inside enormous minified lines that carry unrelated
// statements after them — the rows line ends with the runtime's whole page
// registry — so each match is bounded by its own terminator, never by the line.
// `rows` must stay an ARRAY: the caller does `${rows.join('')}`.
{
  const label = "vendor registry + KPIs -> live"
  // Guard on the patched CALL SITE, not the helper name: the injected bridge
  // defines __pr6Vendors, so testing the name alone reports "already applied"
  // against a freshly extracted runtime and silently skips this patch.
  if (s.includes("const __vn=__pr6Vendors()")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const kpiRe = /<div class="grid kpis">\$\{kpi\('Registered vendors','26'[\s\S]*?<\/div>(?=\r?\n\s*<div class="vendor-layout")/
    const rowsRe = /const rows=vendorsV2\.map\(v=>`<tr data-vendor[\s\S]*?<\/tr>`\);/
    const kpiM = s.match(kpiRe)
    const rowsM = s.match(rowsRe)
    if (!kpiM || !rowsM) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const emptyRow = (msg) =>
        "[`<tr><td colspan=\"6\" class=\"tiny muted\">" + msg + "</td></tr>`]"
      const liveRows = [
        "const __vn=__pr6Vendors();",
        "const rows=__vn?(__vn.items.length?__vn.items.map(v=>`<tr data-vendor=\"${v.id}\">",
        "<td><div class=\"access-user\"><div class=\"vendor-logo\">${(v.name||'?').slice(0,2).toUpperCase()}</div>",
        "<div><strong class=\"link\">${v.name}</strong><div class=\"tiny muted\">${v.category||'Uncategorised'}</div></div></div></td>",
        "<td>${v.paymentTerms||'\\u2014'}</td>",
        "<td>${v.contactPerson||'\\u2014'}<div class=\"tiny muted\">${v.email||''}</div></td>",
        "<td>${badge(v.complianceStatus)}</td>",
        "<td>${v.rating==null?'<span class=\"tiny muted\">Not rated</span>':v.rating+' / 5'}</td>",
        "<td>${v.blacklisted?badge('Blacklisted'):badge('Active')}</td></tr>`)",
        ":" + emptyRow("No vendors are registered.") + ")",
        ":" + emptyRow("Vendor registry unavailable for your role.") + ";",
      ].join("")
      s = s.replace(rowsM[0], liveRows)

      const liveKpis = [
        '<div class="grid kpis">${(()=>{const v=__pr6Vendors();',
        "if(!v)return kpi('Registered vendors','\\u2014','Vendor registry unavailable for your role','briefcase');",
        "return kpi('Registered vendors',String(v.registered),v.categories+' categories','briefcase')",
        "+kpi('Compliance ready',String(v.compliant),v.pending+' pending, '+v.expired+' expired','shield','cyan')",
        "+kpi('Blacklisted',String(v.blacklisted),v.blacklisted?'Excluded from sourcing':'None excluded','shield',v.blacklisted?'amber':'')",
        "+kpi('Rated vendors',String(v.ratedCount),v.averageRating==null?'No ratings recorded':'Average '+v.averageRating+' / 5','briefcase','violet')})()}</div>",
      ].join("")
      s = s.replace(kpiM[0], liveKpis)

      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a3. Inputs & Validation reads the real batches
// ---------------------------------------------------------------------------
// The screen hardcoded a five-row error list and a band reading "1,247 valid
// rows are ready. 37 rows remain isolated." over "1,284 uploaded". None of it
// was backed by anything — PayrollInputBatch/PayrollInputRow did not exist.
{
  const label = "inputs validation rows -> live"
  if (s.includes("const __ib=__pr6Inputs()")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /const errors=\[\['Line 44'[^\n]*?\n\s*const rows=errors\.map\([^\n]*?\);/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "const __ib=__pr6Inputs();",
        "const rows=__ib?(__ib.latest&&__ib.latest.errorRows>0?",
        "[`<tr><td colspan=\"6\" class=\"tiny muted\">Open the batch to see its ${__ib.errorRows} isolated row(s).</td></tr>`]",
        ":[`<tr><td colspan=\"6\" class=\"tiny muted\">",
        "${__ib.batches.length?'No rows are isolated. All uploaded rows passed validation.':'No input batches have been uploaded.'}",
        "</td></tr>`])",
        ":[`<tr><td colspan=\"6\" class=\"tiny muted\">Payroll inputs are not visible to your role.</td></tr>`];",
      ].join("")
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a4. Inputs band: valid / isolated / uploaded come from the batch
// ---------------------------------------------------------------------------
{
  const label = "inputs band stats -> live"
  if (s.includes("'INPUT BATCH '+b.latest.reference")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /<div class="eyebrow" style="color:#7eb6ff">INPUT BATCH INP-2026-06-04<\/div><h2>1,247 valid rows are ready\. 37 rows remain isolated\.<\/h2>/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        '<div class="eyebrow" style="color:#7eb6ff">${(()=>{const b=__pr6Inputs();' +
        "return b?(b.latest?'INPUT BATCH '+b.latest.reference:'NO INPUT BATCH'):'INPUT BATCHES UNAVAILABLE'})()}</div>" +
        '<h2>${(()=>{const b=__pr6Inputs();' +
        "if(!b)return 'Payroll inputs are not visible to your role.';" +
        "if(!b.latest)return 'No input batches have been uploaded.';" +
        "return b.validRows+' valid row'+(b.validRows===1?'':'s')+' ready. '+b.errorRows+' row'+(b.errorRows===1?'':'s')+' isolated.'})()}</h2>"
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a5. Onboarding pipeline reads real candidates
// ---------------------------------------------------------------------------
{
  const label = "onboarding pipeline -> live"
  if (s.includes("const __ob=__pr6Onboarding()")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /const candidates=\[\['ONB-026'[^\n]*?\n\s*const rows=candidates\.map\([^\n]*?\);/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "const __ob=__pr6Onboarding();",
        "const rows=__ob?(__ob.candidates.length?__ob.candidates.map(c=>`<tr data-candidate=\"${c.id}\">",
        "<td><div class=\"access-user\"><div class=\"mini-avatar\">${(c.name||'?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div>",
        "<strong class=\"link\">${c.name}</strong></div></td>",
        "<td>${c.position||'\\u2014'}</td><td>${c.department||'\\u2014'}</td>",
        "<td>${c.startDate?String(c.startDate).slice(0,10):'\\u2014'}</td>",
        "<td>${badge(c.status)}</td></tr>`)",
        ":[`<tr><td colspan=\"5\" class=\"tiny muted\">No candidates are in onboarding.</td></tr>`])",
        ":[`<tr><td colspan=\"5\" class=\"tiny muted\">Onboarding is not visible to your role.</td></tr>`];",
      ].join("")
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a6. Inputs band stats: uploaded / valid / warnings / errors from the batch
// ---------------------------------------------------------------------------
// The band header was made live above, but the four figures beneath it still
// read 1,284 uploaded / 1,247 valid / 29 warnings / 8 errors from the fixture.
// There is no "warning" severity in the model — a row is VALID, ERROR or
// RESOLVED — so that stat becomes resolved rows rather than an invented count.
{
  const label = "inputs band figures -> live"
  if (s.includes("stat('Rows uploaded',b.totalRows)")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /<div class="band-stat"><span>Rows uploaded<\/span><strong>1,284<\/strong><\/div><div class="band-stat"><span>Valid<\/span><strong>1,247<\/strong><\/div><div class="band-stat"><span>Warnings<\/span><strong>29<\/strong><\/div><div class="band-stat"><span>Errors<\/span><strong>8<\/strong><\/div>/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        "${(()=>{const b=__pr6Inputs();" +
        "const stat=(l,v)=>`<div class=\"band-stat\"><span>${l}</span><strong>${v}</strong></div>`;" +
        "if(!b)return stat('Rows uploaded','\\u2014')+stat('Valid','\\u2014')+stat('Resolved','\\u2014')+stat('Errors','\\u2014');" +
        "const resolved=b.batches.reduce((n,x)=>n+(x.totalRows-x.validRows-x.errorRows),0);" +
        "return stat('Rows uploaded',b.totalRows)+stat('Valid',b.validRows)+stat('Resolved',Math.max(0,resolved))+stat('Errors',b.errorRows)})()}"
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a7. Onboarding band stats come from the candidate pipeline
// ---------------------------------------------------------------------------
// "Open onboarding cases 2 / Average completion time 2.4 days / First-time-right
// 94% / Missing documents 3" were all invented. Completion time and
// first-time-right have nothing behind them in the model, so rather than
// fabricate a substitute the band reports what the pipeline actually knows.
{
  const label = "onboarding band figures -> live"
  if (s.includes("stat('Open onboarding cases',o.inProgress)")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /<div class="band-stat"><span>Open onboarding cases<\/span><strong>2<\/strong><\/div><div class="band-stat"><span>Average completion time<\/span><strong>2\.4 days<\/strong><\/div><div class="band-stat"><span>First-time-right rate<\/span><strong>94%<\/strong><\/div><div class="band-stat"><span>Missing documents<\/span><strong>3<\/strong><\/div>/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        "${(()=>{const o=__pr6Onboarding();" +
        "const stat=(l,v)=>`<div class=\"band-stat\"><span>${l}</span><strong>${v}</strong></div>`;" +
        "if(!o)return stat('Open onboarding cases','\\u2014')+stat('Completed','\\u2014')+stat('Awaiting documents','\\u2014')+stat('Total candidates','\\u2014');" +
        "return stat('Open onboarding cases',o.inProgress)+stat('Completed',o.complete)" +
        "+stat('Awaiting documents',o.byStatus.DOCUMENTS||0)+stat('Total candidates',o.total)})()}"
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a8. Inputs validation-completion bar reflects the real batch
// ---------------------------------------------------------------------------
// The bar was pinned at 97% with the caption "1,247 of 1,284 rows valid".
{
  const label = "inputs progress bar -> live"
  if (s.includes("' of '+b.totalRows+' rows valid'")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /progressRow\('Validation completion',97,'1,247 of 1,284 rows valid','cyan'\)/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        "${(()=>{const b=__pr6Inputs();" +
        "if(!b)return progressRow('Validation completion',0,'Payroll inputs are not visible to your role','cyan');" +
        "if(!b.totalRows)return progressRow('Validation completion',0,'No rows have been uploaded','cyan');" +
        "return progressRow('Validation completion',b.validPct===null?0:b.validPct," +
        "b.validRows+' of '+b.totalRows+' rows valid','cyan')})()}"
      // progressRow(...) is interpolated inside a template literal, so the call is replaced by an
      // IIFE that returns the same markup rather than by another bare call.
      s = s.replace("${" + m[0] + "}", live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a9. Pay Groups & Calendar reads the real calendar
// ---------------------------------------------------------------------------
// The screen built six months from hardcoded arrays of cut-off and pay dates.
// PayrollPayGroup/PayrollCalendarPeriod now hold them.
{
  const label = "pay calendar rows -> live"
  if (s.includes("const __cal=__pr6PayGroups()")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /const months=\['Jul 2026'[^\n]*?\n\s*const rows=months\.map\([^\n]*?\);/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "const __cal=__pr6PayGroups();",
        "const __periods=__cal?__cal.groups.flatMap(g=>(g.periods||[]).map(p=>({g:g.name,...p}))):null;",
        "const rows=__periods?(__periods.length?__periods.map(p=>`<tr>",
        "<td><strong>${p.periodLabel}</strong><div class=\"tiny muted\">${p.g}</div></td>",
        "<td>${p.cutoffDate?String(p.cutoffDate).slice(0,10):'\\u2014'}</td>",
        "<td>${p.payDate?String(p.payDate).slice(0,10):'\\u2014'}</td>",
        "<td>${badge(p.status)}</td></tr>`)",
        ":[`<tr><td colspan=\"4\" class=\"tiny muted\">No pay periods are configured.</td></tr>`])",
        ":[`<tr><td colspan=\"4\" class=\"tiny muted\">The payroll calendar is not visible to your role.</td></tr>`];",
      ].join("")
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a10. Pay Groups & Calendar KPI cards come from the calendar
// ---------------------------------------------------------------------------
// "Active pay groups 4 / 195 employees across all groups", "Schedule controls
// 18 / 18" and "Approval SLAs 96% on time over the last 12 periods" were all
// asserted. Group and period counts are real; headcount-per-group, milestone
// completeness and approval SLA have nothing behind them in the model, so they
// are replaced by figures the calendar can actually answer rather than by a
// substitute invention.
{
  const label = "calendar KPI cards -> live"
  if (s.includes("c.total+' configured in total'")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /<div class="grid kpis">\$\{kpi\('Active pay groups','4','195 employees across all groups','users'\)\}/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        '<div class="grid kpis">${(()=>{const c=__pr6PayGroups();' +
        "if(!c)return kpi('Active pay groups','\\u2014','Calendar not visible to your role','users');" +
        "return kpi('Active pay groups',String(c.active),c.total+' configured in total','users')})()}"
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a11. Retire the two calendar KPIs nothing can answer
// ---------------------------------------------------------------------------
// "Schedule controls 18 / 18" and "Approval SLAs 96%" measure things the model
// does not record. Replaced with period counts, which it does.
{
  const label = "calendar unanswerable KPIs -> period counts"
  if (s.includes("kpi('Open periods'")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /\$\{kpi\('Schedule controls','18 \/ 18','All required milestones configured','shield','cyan'\)\}\$\{kpi\('Approval SLAs','96%','On time over the last 12 periods','clock','violet'\)\}/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        "${(()=>{const c=__pr6PayGroups();" +
        "if(!c)return kpi('Pay periods','\\u2014','Calendar not visible to your role','shield','cyan');" +
        "return kpi('Pay periods',String(c.periods),'Configured across all groups','shield','cyan')" +
        "+kpi('Open periods',String(c.openPeriods),c.openPeriods?'Accepting inputs':'None open','clock','violet')})()}"
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a12. The open sourcing event card reads the real RFQ
// ---------------------------------------------------------------------------
// The card asserted "RFQ-HR-2026-014 · Medical aid administration" with 6
// invited, 3 bids received, closing 05 Aug 2026, a USD 32,000 budget and a 50%
// submission bar. PayrollRfq/PayrollRfqBid now hold sourcing events.
//
// Two separate replacements, deliberately: the subtitle and the facts strip sit
// inside one card(...) call, and matching across it would cut through the call
// and leave its closing arguments orphaned.
{
  const label = "sourcing event subtitle -> live"
  if (s.includes("__pr6RfqSubtitle")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const needle = "'Open sourcing event','RFQ-HR-2026-014 · Medical aid administration'"
    if (!s.includes(needle)) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live =
        "'Open sourcing event',`${(()=>{const __pr6RfqSubtitle=1;const q=__pr6Rfqs();" +
        "if(!q)return 'Not visible to your role';" +
        "const r=q.rfqs.find(x=>x.status==='OPEN'||x.status==='EVALUATING')||q.rfqs[0];" +
        "return r?(r.reference+' · '+r.title):'No sourcing event has been raised'})()}`"
      s = s.replace(needle, live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

{
  const label = "sourcing event facts -> live"
  if (s.includes("__pr6RfqFacts")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    // Bounded to the strip and the bar that follows it, both inside the same card body.
    const re = /<div class="profile-summary-strip"><div class="fact"><span>Invited<\/span>[\s\S]*?\$\{progressRow\('Submission progress',50,'3 of 6 invited vendors','cyan'\)\}/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "${(()=>{const __pr6RfqFacts=1;const q=__pr6Rfqs();",
        "const fact=(l,v)=>`<div class=\"fact\"><span>${l}</span><strong>${v}</strong></div>`;",
        "if(!q)return `<div class=\"profile-summary-strip\">`+fact('Invited','\\u2014')+fact('Bids received','\\u2014')+`</div>`;",
        "const r=q.rfqs.find(x=>x.status==='OPEN'||x.status==='EVALUATING')||q.rfqs[0];",
        "if(!r)return `<div class=\"profile-summary-strip\">`+fact('Invited','0')+fact('Bids received','0')+`</div>`;",
        "const pct=r.invitedCount?Math.round((r.bidCount/r.invitedCount)*100):0;",
        "return `<div class=\"profile-summary-strip\">`",
        "+fact('Invited',r.invitedCount+' vendor'+(r.invitedCount===1?'':'s'))",
        "+fact('Bids received',r.bidCount)",
        "+fact('Closes',r.closingDate?String(r.closingDate).slice(0,10):'\\u2014')",
        "+fact('Status',r.status)+`</div>`",
        "+progressRow('Submission progress',pct,r.bidCount+' of '+r.invitedCount+' invited vendors','cyan')})()}",
      ].join("")
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a13. Quotation comparison matrix reads the real bids
// ---------------------------------------------------------------------------
// The matrix rendered `quoteRowsV2`, a hardcoded set of vendors with invented
// technical, commercial and compliance percentages and prices. PayrollRfqBid
// now holds the three scores and the amount, and the service returns a weighted
// score that is null — not zero — when nobody has scored a bid.
{
  const label = "quotation matrix -> live"
  if (s.includes("__pr6QuoteRows")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    // Bounded to the whole interpolation, so the fixture's arrow body goes with it rather than
    // being left behind as dead code iterating an empty array.
    const re = /\$\{quoteRowsV2\.map\(q=>[\s\S]*?\)\.join\(''\)\}/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "${(()=>{const __pr6QuoteRows=1;const q=__pr6Rfqs();",
        "if(!q)return `<div class=\"quote-row\"><div class=\"quote-cell\">Not visible to your role</div></div>`;",
        "const r=q.rfqs.find(x=>x.status==='OPEN'||x.status==='EVALUATING')||q.rfqs[0];",
        "const bids=r?r.bids.filter(b=>b.status!=='INVITED'):[];",
        "if(!bids.length)return `<div class=\"quote-row\"><div class=\"quote-cell\">No bids have been submitted.</div></div>`;",
        "const cell=(l,v)=>`<div class=\"quote-cell\" data-label=\"${l}\"><strong>${v==null?'\\u2014':v+'%'}</strong>",
        "<div class=\"score-bar\"><i style=\"width:${v==null?0:v}%\"></i></div></div>`;",
        "return bids.map(b=>`<div class=\"quote-row\">",
        "<div class=\"quote-cell\" data-label=\"Vendor\"><strong>${b.vendorName}</strong>",
        "<span>${b.amount==null?'\\u2014':b.currencyCode+' '+Number(b.amount).toLocaleString()}</span></div>`",
        "+cell('Technical',b.technicalScore)+cell('Commercial',b.commercialScore)+cell('Compliance',b.complianceScore)",
        "+`<div class=\"quote-cell\" data-label=\"Total\"><strong>${b.weightedScore==null?'Not scored':b.weightedScore+'%'}</strong></div></div>`",
        ").join('')})()}",
      ].join("")
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a14. The last asserted KPIs: report what is known, or nothing
// ---------------------------------------------------------------------------
// Four cards stated figures with no source at all — MFA coverage 97.6%,
// Evidence completeness 96%, Records validated 116, and an approvals sample
// table of invented employees and recalculated amounts. Three of the four
// measure things this model does not record; inventing a replacement
// computation would be the same defect wearing a different number, so they
// report an em dash and say why. "Records validated" can be answered from the
// employee and exception data already loaded, so it is.
{
  const label = "MFA coverage KPI -> honest"
  const needle = "kpi('MFA coverage','97.6%','1 user pending enrolment','shield','cyan')"
  if (s.includes("MFA enrolment is not tracked")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(needle)) {
    console.warn(`  MISS            ${label}`)
    missed += 1
  } else {
    // The same card is defined on more than one screen, so replace every occurrence.
    s = s.split(needle).join("kpi('MFA coverage','\\u2014','MFA enrolment is not tracked for staff accounts','shield','cyan')")
    console.log(`  patched         ${label}`)
    applied += 1
  }
}

{
  const label = "evidence completeness KPI -> honest"
  const needle = "kpi('Evidence completeness','96%','Source and approval lineage','audit','cyan')"
  if (s.includes("No completeness measure is recorded")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(needle)) {
    console.warn(`  MISS            ${label}`)
    missed += 1
  } else {
    s = s.split(needle).join("kpi('Evidence completeness','\\u2014','No completeness measure is recorded','audit','cyan')")
    console.log(`  patched         ${label}`)
    applied += 1
  }
}

{
  const label = "records validated KPI -> live"
  const needle = "kpi('Records validated','116','Employees clear of exceptions','check','cyan')"
  if (s.includes("__pr6RecordsValidated")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(needle)) {
    console.warn(`  MISS            ${label}`)
    missed += 1
  } else {
    const live = [
      "${(()=>{const __pr6RecordsValidated=1;",
      "const emps=Array.isArray(__pr6Live.employees)?__pr6Live.employees:null;",
      "if(!emps)return kpi('Records validated','\\u2014','Employee records are not visible to your role','check','cyan');",
      "const exc=Array.isArray(__pr6Live.exceptions)?__pr6Live.exceptions:[];",
      "const flagged=new Set(exc.map(e=>e.employeeNumber||e.employeeId).filter(Boolean));",
      "const clear=emps.filter(e=>!flagged.has(e.id)&&!flagged.has(e.recordId)).length;",
      "return kpi('Records validated',String(clear),'Of '+emps.length+' employees, clear of exceptions','check','cyan')})()}",
    ].join("")
    s = s.replace("${" + needle + "}", live)
    console.log(`  patched         ${label}`)
    applied += 1
  }
}

{
  const label = "approvals sample recalculation -> live"
  if (s.includes("__pr6ApprovalSample")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /\$\{\[\['Rudo Sibanda','Bank change'[\s\S]*?\)\.join\(''\)\}/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "${(()=>{const __pr6ApprovalSample=1;",
        "const runs=Array.isArray(__pr6Live.payrollRuns)?__pr6Live.payrollRuns:null;",
        "if(!runs)return `<tr><td colspan=\"5\" class=\"tiny muted\">Payroll runs are not visible to your role.</td></tr>`;",
        "return `<tr><td colspan=\"5\" class=\"tiny muted\">",
        "${runs.length?'Open a run to review its recalculated lines.':'No payroll runs are awaiting approval.'}",
        "</td></tr>`})()}",
      ].join("")
      s = s.replace(m[0], live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a15. The payslip download button carries the payslip it means
// ---------------------------------------------------------------------------
// The header button was labelled "Download June payslip" and carried no id, so
// the runtime's own handler built a PDF client-side from hardcoded content —
// every employee downloaded the same invented payslip for Rudo Sibanda. The
// backend already issues a real, hash-verified PDF from
// GET /payroll/employee/payslips/:id/download; the button just had nothing to
// ask for. It now names the user's latest payslip period and carries its id,
// and is disabled outright when they have none.
{
  const label = "payslip button carries its id"
  if (s.includes("data-payslip-id")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const needle = "button('Download June payslip','download-payslip','primary','download')"
    if (!s.includes(needle)) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const live = [
        "(()=>{const m=__pr6MyPay();",
        "const slip=m&&m.latest?m.latest:null;",
        "if(!slip)return `<button class=\"btn primary\" disabled title=\"No payslip has been issued to you yet\">",
        "${icon('download')}No payslip available</button>`;",
        "const period=slip.period||slip.periodLabel||'latest';",
        "return `<button class=\"btn primary\" data-action=\"download-payslip\" data-payslip-id=\"${slip.id}\">",
        "${icon('download')}Download ${period} payslip</button>`})()",
      ].join("")
      s = s.replace(needle, live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 4a16. Create Pay Group opens a real form, not a placeholder
// ---------------------------------------------------------------------------
// `new-paygroup` called genericModal('Create Pay Group', ...) — a dialog with
// no fields and nothing to submit, so the control looked live and did nothing.
// PayrollPayGroup now exists behind POST /payroll/pay-groups, so the form has
// somewhere to go. Same openModal + form-field shape the onboarding form uses.
{
  const label = "new-paygroup -> real form"
  if (s.includes("newPayGroupCode")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const needle =
      "case 'new-paygroup':genericModal('Create Pay Group','Define population, calendar, currencies and approval authority.');break;"
    if (!s.includes(needle)) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      const field = (id, lbl, extra) =>
        "<div class=\"form-field\"><label>" + lbl + "</label><input id=\"" + id + "\" " + extra + "></div>"
      const body = [
        "<div class=\"form-grid\">",
        field("newPayGroupName", "Group name", "placeholder=\"Monthly Staff\""),
        field("newPayGroupCode", "Code", "placeholder=\"MTH-STAFF\""),
        "<div class=\"form-field\"><label>Frequency</label><select id=\"newPayGroupFrequency\">",
        "<option value=\"MONTHLY\">Monthly</option><option value=\"FORTNIGHTLY\">Fortnightly</option>",
        "<option value=\"WEEKLY\">Weekly</option></select></div>",
        field("newPayGroupPayDay", "Pay day of month", "type=\"number\" min=\"1\" max=\"31\" placeholder=\"25\""),
        field("newPayGroupCurrency", "Currency", "value=\"USD\""),
        "</div>",
      ].join("")
      const live =
        "case 'new-paygroup':openModal('Create Pay Group'," +
        "'Define the population, its cycle and the currency it is paid in.'," +
        "`" + body + "`," +
        "`${button('Create pay group','save-paygroup','primary','plus')}`);break;"
      s = s.replace(needle, live)
      console.log(`  patched         ${label}`)
      applied += 1
    }
  }
}

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
  "<h2>${(()=>{const c=__pr6ApprovalCompare();if(!c)return 'Approval review is 78% complete';if(!c.hasRun)return 'No payroll run to review';const st=String(c.current.rawStatus||'');return st==='PENDING_APPROVAL'?'Awaiting independent approval':st==='APPROVED'?'Approved, awaiting release':st==='COMPLETED'?'Released':'Draft payroll run'})()}</h2>",
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
  "<span>Payslips on record</span>",
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
// 4i. Leave, training and statutory rule registers
// ---------------------------------------------------------------------------
// Leave rows keyed their used/pending/liability columns off the ROW INDEX
// ([5,8,12,3,9,2,4] etc), so the numbers beside an employee belonged to nobody.
s = replaceOnce(
  s,
  " const rows=employees.slice(0,7).map((e,i)=>`<tr data-employee=\"${e.id}\"><td><div class=\"access-user\"><div class=\"mini-avatar\">${e.initials}</div><strong class=\"link\">${e.name}</strong></div></td><td>${e.department}</td><td>${e.leave}</td><td>${[5,8,12,3,9,2,4][i]} days</td><td>${[1,0,3,2,0,4,1][i]} pending</td><td class=\"money\">${can('salary.view')?money([1480,2940,1320,1670,720,2860,810][i]):'Restricted'}</td><td>${badge(i===4?'Review':'Within policy')}</td></tr>`);",
  " const __lv=__pr6LeaveRows();\n const rows=__lv?__lv.map(r=>`<tr data-employee=\"${r.employeeNumber}\"><td><div class=\"access-user\"><div class=\"mini-avatar\">${r.initials}</div><strong class=\"link\">${r.name}</strong></div></td><td>${r.department}</td><td>${r.available} days</td><td>\\u2014</td><td>\\u2014</td><td class=\"money\">${can('salary.view')?money(r.liability):'Restricted'}</td><td>${badge('Within policy')}</td></tr>`):employees.slice(0,7).map((e,i)=>`<tr data-employee=\"${e.id}\"><td><div class=\"access-user\"><div class=\"mini-avatar\">${e.initials}</div><strong class=\"link\">${e.name}</strong></div></td><td>${e.department}</td><td>${e.leave}</td><td>${[5,8,12,3,9,2,4][i]} days</td><td>${[1,0,3,2,0,4,1][i]} pending</td><td class=\"money\">${can('salary.view')?money([1480,2940,1320,1670,720,2860,810][i]):'Restricted'}</td><td>${badge(i===4?'Review':'Within policy')}</td></tr>`);",
  "leave register rows -> live",
  "const __lv=__pr6LeaveRows();",
)

s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Annual leave liability',money(184620),'Estimated financial provision','wallet')}${kpi('Average balance','14.2 days','Across active employees','calendar','cyan')}${kpi('Pending requests','17','Manager decisions outstanding','clock','amber')}${kpi('Policy exceptions','4','Above carry-forward threshold','alert','red')}${kpi('Medical aid enrolled','112','87.5% of employees','heart','violet')}${kpi('Loan deductions','19','Active employee loans','calculator')}</div>",
  "<div class=\"grid kpis\">${(()=>{const l=__pr6LeaveStats();" +
    "if(!l)return `${kpi('Annual leave liability',money(184620),'Estimated financial provision','wallet')}${kpi('Average balance','14.2 days','Across active employees','calendar','cyan')}`;" +
    "return kpi('Annual leave liability',money(l.liability),'Accrued days at basic/22 per day','wallet')" +
    "+kpi('Average balance',l.average+' days','Across employees with a balance','calendar','cyan')" +
    "+kpi('Employees with leave',String(l.employees),'Holding an annual balance','users','violet')" +
    "+kpi('Leave types',String(l.types),'Configured balance categories','settings')})()}</div>",
  "leave KPIs -> live",
  "'Accrued days at basic/22 per day'",
)

// Training: six invented courses with fabricated completion rates.
s = replaceOnce(
  s,
  " const rows=certs.map(c=>",
  " const rows=(__pr6TrainingRows()||certs).map(c=>",
  "training register rows -> live",
  "(__pr6TrainingRows()||certs)",
)

s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Total employees','128','All employment categories','users')}${kpi('Fully compliant','94','73.4% across requirements','check','cyan')}${kpi('Due within 30 days','21','Certification expiry risk','clock','amber')}${kpi('Overdue','13','May affect operational access','alert','red')}${kpi('Average completion','91.7%','Across mandatory courses','graduation','violet')}${kpi('Permissions affected','6','Access restrictions pending','lock','amber')}</div>",
  "<div class=\"grid kpis\">${(()=>{const t=__pr6TrainingStats();" +
    "if(!t)return `${kpi('Total employees','128','All employment categories','users')}${kpi('Fully compliant','94','73.4% across requirements','check','cyan')}`;" +
    "return kpi('Total employees',String(t.employees),'All employment categories','users')" +
    "+kpi('Courses in catalogue',String(t.courses),'Configured training courses','graduation','cyan')" +
    "+kpi('Certifications recorded',String(t.certifications),'Across all employees','check','violet')" +
    "+kpi('Mandatory courses',String(t.mandatory),'Required for compliance','shield','amber')})()}</div>",
  "training KPIs -> live",
  "'Courses in catalogue'",
)

// Statutory rules: five invented rule versions and their approvers.
s = replaceOnce(
  s,
  " const rows=rules.map(r=>",
  " const rows=(__pr6TaxRows()||rules).map(r=>",
  "statutory rule rows -> live",
  "(__pr6TaxRows()||rules)",
)

s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Published rules','14','Current Zimbabwe ruleset','shield','cyan')}${kpi('Draft versions','2','Not yet applied to payroll','edit','violet')}${kpi('Automated tests','182','175 passed, 7 under review','audit')}${kpi('Employees impacted','128','June ruleset population','users')}${kpi('Estimated PAYE',money(42967),'June 2026 control total','wallet','cyan')}${kpi('Next review','15 Jul 2026','Quarterly rule certification','calendar','amber')}</div>",
  "<div class=\"grid kpis\">${(()=>{const t=__pr6TaxStats();" +
    "if(!t)return `${kpi('Published rules','14','Current Zimbabwe ruleset','shield','cyan')}${kpi('Draft versions','2','Not yet applied to payroll','edit','violet')}`;" +
    "return kpi('Tax rules',String(t.rules),'Configured statutory rules','shield','cyan')" +
    "+kpi('PAYE brackets',String(t.brackets),'Progressive band table','settings','violet')" +
    "+kpi('Statutory levies',String(t.levies),'AIDS levy, NSSA and SDL','audit')" +
    "+kpi('Employees impacted',String(t.employees),'On the active payroll','users')" +
    "+kpi('Statutory deductions',money(t.deductions),t.period+' control total','wallet','cyan')})()}</div>",
  "statutory KPIs -> live",
  "'Configured statutory rules'",
)

// ---------------------------------------------------------------------------
// 4j. Remaining progress rows that had no backend behind them
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "${progressRow('Payroll inputs',97,'1,247 of 1,284 valid','cyan')}",
  "${(()=>{const c=__pr6RunCoverage();return c?progressRow('Employees paid',c.pct,c.paid+' of '+c.total+' on the roster','cyan'):progressRow('Payroll inputs',97,'1,247 of 1,284 valid','cyan')})()}",
  "overview: payroll inputs row -> live run coverage",
  "'Employees paid',c.pct",
)

s = replaceOnce(
  s,
  "${progressRow('Maker-checker review',78,'4 of 6 controls','amber')}",
  "${(()=>{const o=__pr6OverviewStats();return o?progressRow('Payroll run progress',Math.round((o.runStage/6)*100),'Stage '+o.runStage+' of 6','amber'):progressRow('Maker-checker review',78,'4 of 6 controls','amber')})()}",
  "overview: maker-checker row -> live",
  "'Payroll run progress'",
)

s = replaceOnce(
  s,
  "${progressRow('Basic salary',79,'USD 208,640','cyan')}",
  "${(()=>{const m=__pr6PayrollMix();return m?progressRow('Basic salary',m.basicPct,money(m.basic),'cyan'):progressRow('Basic salary',79,'USD 208,640','cyan')})()}",
  "components: basic salary mix -> live",
  "progressRow('Basic salary',m.basicPct",
)

s = replaceOnce(
  s,
  "${progressRow('Allowances',19,'USD 49,756','violet')}",
  "${(()=>{const m=__pr6PayrollMix();return m?progressRow('Allowances',m.allowancePct,money(m.allowances),'violet'):progressRow('Allowances',19,'USD 49,756','violet')})()}",
  "components: allowances mix -> live",
  "progressRow('Allowances',m.allowancePct",
)

s = replaceOnce(
  s,
  "${progressRow('Formula test coverage',96,'182 of 190 tests passed','cyan')}",
  "${(()=>{const h=__pr6ComponentHealth();return h?progressRow('Active components',h.activePct,h.active+' of '+h.total+' active','cyan'):progressRow('Formula test coverage',96,'182 of 190 tests passed','cyan')})()}",
  "components: test coverage row -> live",
  "'Active components',h.activePct",
)

s = replaceOnce(
  s,
  "${progressRow('Approval queue',74,'3 changes awaiting review','amber')}",
  "${(()=>{const h=__pr6ComponentHealth();return h?progressRow('Statutory deductions',h.statutoryPct,h.statutory+' statutory of '+(h.total-h.active+h.active)+' components','amber'):progressRow('Approval queue',74,'3 changes awaiting review','amber')})()}",
  "components: approval queue row -> live",
  "'Statutory deductions',h.statutoryPct",
)

// Training: per-department bars for departments that do not exist here.
{
  const label = "training: department bars -> live"
  const find =
    "${progressRow('Finance',98,'98% complete')}${progressRow('People & Culture',100,'100% complete','cyan')}${progressRow('Operations',86,'86% complete','amber')}${progressRow('Commercial',89,'89% complete','violet')}${progressRow('Technology',96,'96% complete')}${progressRow('Procurement',93,'93% complete','cyan')}"
  // Guard on the call site, not the helper name: the bridge defines it.
  if (s.includes("x.pct+'% payroll-ready ('")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(find)) {
    console.warn(`  MISS            ${label}`)
    missed += 1
  } else {
    s = s.replace(
      find,
      "${(()=>{const d=__pr6DepartmentReadiness();return d?d.map(x=>progressRow(x.name,x.pct,x.pct+'% payroll-ready ('+x.count+')','cyan')).join(''):`" +
        find.replace(/\$\{/g, "${") +
        "`})()}",
    )
    console.log(`  patch           ${label}`)
    applied += 1
  }
}

s = replaceOnce(
  s,
  "${progressRow('Variable pay',8,'USD 21,140','amber')}",
  "${(()=>{const m=__pr6PayrollMix();return m?progressRow('Net pay',Math.max(0,100-m.deductionPct),money(m.gross-m.deductions),'amber'):progressRow('Variable pay',8,'USD 21,140','amber')})()}",
  "components: variable pay row -> live net pay",
  "progressRow('Net pay',Math.max(0,100-m.deductionPct)",
)

s = replaceOnce(
  s,
  "${progressRow('Deductions',29,'USD 77,444','red')}",
  "${(()=>{const m=__pr6PayrollMix();return m?progressRow('Deductions',m.deductionPct,money(m.deductions),'red'):progressRow('Deductions',29,'USD 77,444','red')})()}",
  "components: deductions row -> live",
  "progressRow('Deductions',m.deductionPct",
)

// ---------------------------------------------------------------------------
// 4k. Empty-collection guards
// ---------------------------------------------------------------------------
// The runtime indexes these arrays directly because its fixtures were never
// empty. Live, they can be: a department manager has no payroll.runs.view
// grant, so hydrate hands over [] and `payrollRuns[0].id` throws, taking the
// whole render with it. Observed on Approvals as deptmgr.
s = replaceEvery(
  s,
  "payrollRuns[0]",
  "(payrollRuns[0]||__pr6RunPlaceholder)",
  "guard payrollRuns[0]",
  "(payrollRuns[0]||__pr6RunPlaceholder)",
)
s = replaceEvery(
  s,
  "employees[0]",
  "(employees[0]||__pr6EmployeePlaceholder)",
  "guard employees[0]",
  "(employees[0]||__pr6EmployeePlaceholder)",
)
s = replaceEvery(
  s,
  "exceptions[0]",
  "(exceptions[0]||__pr6ExceptionPlaceholder)",
  "guard exceptions[0]",
  "(exceptions[0]||__pr6ExceptionPlaceholder)",
)
s = replaceEvery(
  s,
  "documents[0]",
  "(documents[0]||__pr6DocumentPlaceholder)",
  "guard documents[0]",
  "(documents[0]||__pr6DocumentPlaceholder)",
)

// ---------------------------------------------------------------------------
// 4l. Page-level access gating
// ---------------------------------------------------------------------------
// render() renders whatever state.page holds and never consults
// permittedPage() -- only renderNav() filters the sidebar and only
// api.setPage() guards in-app navigation. So a plain employee who reaches
// /payroll-v6/approvals by URL got the full Maker-Checker screen, with the nav
// link merely hidden. Now the page itself refuses, visibly.
s = replaceOnce(
  s,
  " const fn=pages[state.page]||overviewPage;$('#content').innerHTML=fn();$('#content').scrollTop=0;",
  " const fn=pages[state.page]||overviewPage;if(typeof permittedPage==='function'&&!permittedPage(state.page)){$('#content').innerHTML=__pr6DeniedPageHtml(state.page);$('#content').scrollTop=0;wireTopProfile();return;}$('#content').innerHTML=fn();$('#content').scrollTop=0;",
  "render(): refuse unpermitted pages (base)",
  // Unique to THIS replacement: the IIFE-override patch below also mentions
  // __pr6DeniedPageHtml, so guarding on the helper name alone collides.
  "wireTopProfile();return;}$('#content').innerHTML=fn()",
)

// The enhancement IIFE at the "V3" layer replaces render() outright rather than
// delegating to it, so the base guard above never runs. This is the render that
// actually paints. Same guard, second site.
s = replaceOnce(
  s,
  "    const fn=pages[state.page]||overviewPage;\n    document.querySelector('#content').innerHTML=fn();\n    document.querySelector('#content').scrollTop=0;",
  "    const fn=pages[state.page]||overviewPage;\n    if(typeof permittedPage==='function'&&!permittedPage(state.page)){document.querySelector('#content').innerHTML=__pr6DeniedPageHtml(state.page);document.querySelector('#content').scrollTop=0;}else{\n    document.querySelector('#content').innerHTML=fn();\n    document.querySelector('#content').scrollTop=0;}",
  "render(): refuse unpermitted pages (IIFE override)",
  "scrollTop=0;}else{",
)

// permittedPage() ends with `|| (id==='access' && state.role!=='Employee')`,
// a carve-out written for the mock role simulator, where the plain-staff role
// was literally named "Employee". Once state.role holds the real role name
// ("Operations Member"), that clause is true for everybody and Roles & Access
// Control opens to any signed-in user. When live, the permission check is
// authoritative.
s = replaceOnce(
  s,
  "||(id==='access'&&state.role!=='Employee')}",
  "||(!__pr6IsLive()&&id==='access'&&state.role!=='Employee')}",
  "permittedPage(): drop the access carve-out when live",
  "!__pr6IsLive()&&id==='access'",
)

s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Open payroll runs','2','June 2026 processing','calculator')}${kpi('Employees in scope','140','Monthly and executive groups','users','cyan')}${kpi('Current gross',money(362960),'USD before ZiG component','wallet','violet')}${kpi('Open exceptions','12','3 critical, 4 high','alert','red')}${kpi('Approval controls','4 / 6','Two controls outstanding','shield','amber')}${kpi('Last release','31 May 2026','Bank settlement completed','bank','cyan')}</div>",
  "<div class=\"grid kpis\">${(()=>{const r=__pr6RunStats();"
    + "if(!r)return `${kpi('Open payroll runs','2','June 2026 processing','calculator')}${kpi('Employees in scope','140','Monthly and executive groups','users','cyan')}`;"
    + "return kpi('Open payroll runs',String(r.openRuns),r.openSub,'calculator')"
    + "+kpi('Employees in scope',String(r.inScope),'On the latest run','users','cyan')"
    + "+kpi('Current gross',money(r.gross),r.grossSub,'wallet','violet')"
    + "+kpi('Open exceptions',String(r.exceptions),r.exceptionSub,'alert','red')"
    + "+kpi('Runs on record',String(r.totalRuns),'All payroll periods','audit')"
    + "+kpi('Last release',r.lastRelease,'Most recent completed run','bank','cyan')})()}</div>",
  "runs register KPIs -> live",
  "kpi('Open payroll runs',String(r.openRuns)",
)

// The Create Payroll Run dialog offered two hardcoded periods, both of which
// already have runs, so every attempt returned "A payroll run already exists
// for this period" and a run could not be created through the UI at all.
s = replaceOnce(
  s,
  "<select id=\"runPeriod\"><option>July 2026</option><option>June 2026</option></select>",
  "<select id=\"runPeriod\">${(()=>{const o=__pr6PeriodOptions();return o?o.map(x=>`<option>${x}</option>`).join(''):'<option>July 2026</option><option>June 2026</option>'})()}</select>",
  "create-run period options -> live",
  "__pr6PeriodOptions();return o?o.map",
)

// ---------------------------------------------------------------------------
// 4m. Charts must survive an empty series
// ---------------------------------------------------------------------------
// A role without payroll.dashboard.view gets no trend data, and the honest
// rendering is an empty chart -- but trendSummaryV3 reads rows[0][1] and threw
// "Cannot read properties of undefined (reading '1')", which killed hydrate and
// left the PRE-hydrate fixture render on screen. Denying the data therefore made
// the screen show MORE invented numbers, not fewer.
s = replaceOnce(
  s,
  "    const rows=payrollRangeRowsV3();",
  "    const rows=payrollRangeRowsV3();\n    if(!rows||!rows.length){return `<section class=\"chart-module\" id=\"payrollTrendChart\"><div class=\"card-body\" style=\"text-align:center;padding:40px 20px\"><p class=\"muted\">No payroll trend data available.</p><p class=\"tiny muted\">Either no payroll has been processed yet, or your role cannot view the payroll dashboard.</p></div></section>`;}",
  "trend chart: empty-series guard",
  "No payroll trend data available.",
)

s = replaceOnce(
  s,
  "  const trendSummaryV3 = rows => {\n    const first=rows[0],last=rows[rows.length-1],avg=rows.reduce((a,r)=>a+r[1],0)/rows.length;",
  "  const trendSummaryV3 = rows => {\n    if(!rows||!rows.length)return{last:['\\u2014',0,0],change:0,avg:0};\n    const first=rows[0],last=rows[rows.length-1],avg=rows.reduce((a,r)=>a+r[1],0)/rows.length;",
  "trendSummaryV3: empty guard",
  "if(!rows||!rows.length)return{last:",
)

// The audit screen's KPIs were invented too: 4,812 events, 42 privileged,
// 318 sensitive views, 9 blocked and a 100% evidence-hash claim.
s = replaceOnce(
  s,
  "<div class=\"grid kpis\">${kpi('Events this period','4,812','Across all payroll workspaces','audit')}${kpi('Privileged events','42','Role and configuration changes','key','violet')}${kpi('Sensitive data views','318','Compensation and bank fields','eye')}${kpi('Blocked actions','9','Prevented by policy controls','lock','red')}${kpi('Evidence hashes','100%','All events cryptographically linked','shield','cyan')}${kpi('Retention','7 years','Zimbabwe payroll evidence policy','calendar')}</div>",
  "<div class=\"grid kpis\">${(()=>{const a=__pr6AuditStats();if(!a)return `${kpi('Events this period','4,812','Across all payroll workspaces','audit')}${kpi('Privileged events','42','Role and configuration changes','key','violet')}`;return kpi('Events recorded',String(a.total),'In the payroll audit trail','audit')+kpi('Approval events',String(a.approvals),'Submissions, approvals and rejections','key','violet')+kpi('Change events',String(a.changes),'Runs created, processed and released','eye')+kpi('Distinct actors',String(a.actors),'Users who acted on payroll','users','cyan')+kpi('Retention','7 years','Zimbabwe payroll evidence policy','calendar')})()}</div>",
  "audit KPIs -> live",
  "kpi('Events recorded',String(a.total)",
)

// ---------------------------------------------------------------------------
// 4n. The Add Employee form could not create anything
// ---------------------------------------------------------------------------
// Employee.userId is required and unique, and the form collected only a name,
// job title and department -- no email, no employee number, no salary -- so
// there was nothing to create a user account from and the control could never
// work. It also pre-filled a fake person ("Kundai Marufu"), which is exactly
// how invented records get saved by accident. Fields are now empty and the
// three the backend requires are present.
s = replaceOnce(
  s,
  "<div class=\"form-grid\"><div class=\"form-field\"><label>First name</label><input id=\"newFirst\" value=\"Kundai\"></div><div class=\"form-field\"><label>Surname</label><input id=\"newLast\" value=\"Marufu\"></div>",
  "<div class=\"form-grid\"><div class=\"form-field\"><label>First name</label><input id=\"newFirst\" value=\"\"></div><div class=\"form-field\"><label>Surname</label><input id=\"newLast\" value=\"\"></div><div class=\"form-field\"><label>Work email</label><input id=\"newEmail\" type=\"email\" placeholder=\"first.last@nts.local\"></div><div class=\"form-field\"><label>Employee number</label><input id=\"newEmployeeNumber\" placeholder=\"EMP-0000\"></div><div class=\"form-field\"><label>Basic salary</label><input id=\"newBasicSalary\" type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"0.00\"></div>",
  "new employee form: add the fields a real record needs",
  "newEmployeeNumber",
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
        if (Array.isArray(payload.leaveBalances)) {
          __pr6Live.leaveBalances = payload.leaveBalances;
        }
        // Vendors is an object, not an array, and null is meaningful: it is how a role
        // without payroll.vendors.view is told the registry is not theirs to see.
        if (payload.vendors !== undefined) {
          __pr6Live.vendors = payload.vendors;
        }
        if (Array.isArray(payload.errors)) __pr6Live.errors = payload.errors;

        __pr6Live.ready = true;
        if (typeof render === 'function') render();
      } catch (err) {
        try { console.error('[payroll-v6] hydrate failed', err); } catch (_) {}
      }
    },
    setPage(page) {`

// The hydrate body is marker-guarded, so a runtime that already has it never
// picks up new keys. Vendors is carried separately for that reason: an object,
// not an array, and null is meaningful — it is how a role without
// payroll.vendors.view is told the registry is not theirs to see.
// The vendors hydrate line is already in the committed runtime, so that patch skips and the four
// domains added afterwards would never be carried. This adds them beside it, guarded separately.
if (s.includes("__pr6Live.inputBatches = payload.inputBatches")) {
  console.log("  skip (already)  hydrate: carry the four new domains")
  skipped += 1
} else if (!s.includes("__pr6Live.vendors = payload.vendors;")) {
  console.warn("  MISS            hydrate: carry the four new domains")
  missed += 1
} else {
  s = s.replace(
    "__pr6Live.vendors = payload.vendors;",
    "__pr6Live.vendors = payload.vendors;\n        }\n        if (payload.inputBatches !== undefined) {\n          __pr6Live.inputBatches = payload.inputBatches;\n        }\n        if (payload.payGroups !== undefined) {\n          __pr6Live.payGroups = payload.payGroups;\n        }\n        if (payload.onboarding !== undefined) {\n          __pr6Live.onboarding = payload.onboarding;\n        }\n        if (payload.rfqs !== undefined) {\n          __pr6Live.rfqs = payload.rfqs;",
  )
  console.log("  patched         hydrate: carry the four new domains")
  applied += 1
}

if (s.includes("__pr6Live.vendors = payload.vendors")) {
  console.log("  skip (already)  hydrate: carry vendors")
  skipped += 1
} else {
  const anchor = "__pr6Live.leaveBalances = payload.leaveBalances;"
  if (!s.includes(anchor)) {
    console.warn("  MISS            hydrate: carry vendors")
    missed += 1
  } else {
    s = s.replace(
      anchor,
      anchor + "\n        }\n        for (const __k of ['vendors','inputBatches','payGroups','onboarding','rfqs']) {\n          if (payload[__k] !== undefined) __pr6Live[__k] = payload[__k];\n        }\n        if (false) {",
    )
    console.log("  patched         hydrate: carry vendors")
    applied += 1
  }
}

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
