/**
 * Post-extract procurement runtime patches.
 *
 *   node scripts/patch-procurement-runtime.mjs
 *   node scripts/patch-procurement-runtime.mjs --check   (verify, write nothing; exit 1 if it would change)
 *
 * WHY THIS EXISTS
 * ---------------
 * components/procurement-v23-mock/matanho-procurement-runtime.js is auto-extracted from the
 * client bundle. Editing it by hand means the next extract silently throws the edits away —
 * that already happened once on the portfolio module, where a regeneration discarded 20
 * hand-patched live-data wirings. Every runtime edit therefore goes through this script, so
 * extract + patch reproduces the working runtime from scratch.
 *
 * Idempotent: every patch is marker-guarded and re-running is a no-op.
 *
 * WHAT IT PATCHES
 * ---------------
 *  1. Injects the live bridge (scripts/procurement-runtime-live-bridge.inc.js) ahead of the first
 *     page renderer, embedding the fixture KPI literals found in this runtime.
 *  2. hydrate() accepts every store that ships demo records — GRNs, approval prompts, contracts
 *     and the versioned add-ons — not only the original thirteen, and merges currentUserV6.
 *  3. money() renders an em dash for a value the backend does not hold, instead of "$0" or "$NaN".
 *  4. kpi() consults the live figures (see __pr23Kpi in the bridge).
 *  5. Sidebar badge counts come from live counts, with no badge where there is none.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const RUNTIME = path.join(ROOT, "components/procurement-v23-mock/matanho-procurement-runtime.js")
const BRIDGE = path.join(ROOT, "scripts/procurement-runtime-live-bridge.inc.js")
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

must(fs.existsSync(RUNTIME), `runtime not found at ${RUNTIME}`)
must(fs.existsSync(BRIDGE), `live bridge not found at ${BRIDGE}`)

const original = fs.readFileSync(RUNTIME, "utf8")
let s = original
must(s.includes("export function startProcurementV23Runtime"), "runtime missing startProcurementV23Runtime — wrong file or a failed extract")

console.log(`Patching ${path.relative(ROOT, RUNTIME)}${CHECK_ONLY ? " (check only)" : ""}\n`)

// ---------------------------------------------------------------------------
// Fixture KPI literals. Read from the call sites, which the patches below never touch, so a
// re-run extracts the same set.
// ---------------------------------------------------------------------------
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const literals = new Set()
for (const m of s.matchAll(/kpi\('([^']*)','([^']*)'/g)) literals.add(`${m[1]}|${m[2]}`)
for (const m of s.matchAll(/kpi\('([^']*)',money\(([0-9.]+)\)/g)) literals.add(`${m[1]}|${usd.format(Number(m[2]))}`)
console.log(`  found           ${literals.size} fixture KPI literals`)

// ---------------------------------------------------------------------------
// 1. Live bridge
// ---------------------------------------------------------------------------
const bridgeBody = fs
  .readFileSync(BRIDGE, "utf8")
  .replace(/^[\s\S]*?\/\* BEGIN_PROCUREMENT_LIVE_BRIDGE \*\//, "")
  .replace(/\/\* END_PROCUREMENT_LIVE_BRIDGE \*\/[\s\S]*$/, "")
  .trim()
  .replace("/*__PR23_LITERAL_KPIS__*/[]", JSON.stringify([...literals].sort()))
must(bridgeBody.length > 0, "live bridge markers produced an empty body")
must(!bridgeBody.includes("__PR23_LITERAL_KPIS__"), "literal KPI placeholder was not filled")

const bridgeBlock = `/* BEGIN_PROCUREMENT_LIVE_BRIDGE */\n${bridgeBody}\n/* END_PROCUREMENT_LIVE_BRIDGE */\n`
if (s.includes("/* BEGIN_PROCUREMENT_LIVE_BRIDGE */")) {
  // Refresh in place so bridge edits propagate without a re-extract.
  s = s.replace(/\/\* BEGIN_PROCUREMENT_LIVE_BRIDGE \*\/[\s\S]*?\/\* END_PROCUREMENT_LIVE_BRIDGE \*\/\n/, bridgeBlock)
  console.log("  refresh         live bridge")
  applied += 1
} else {
  // Ahead of the first page renderer: inside the runtime's scope, after state, money and kpi.
  const anchor = "function dashboardPage(){"
  must(s.includes(anchor), `bridge anchor '${anchor}' not found`)
  s = s.replace(anchor, `${bridgeBlock}${anchor}`)
  console.log("  patch           live bridge injected")
  applied += 1
}

// ---------------------------------------------------------------------------
// 2. hydrate() accepts every store that ships demo records
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "const allowed=['entities','plans','requisitions','tenders','vendors','orders','invoices','documents','reports','approvals','notifications','roles','accessRequests'];",
  "const allowed=['entities','plans','requisitions','tenders','vendors','orders','invoices','documents','reports','approvals','notifications','roles','accessRequests'," +
    "'planItems','grns','journals','assets','approvalPromptsV6','contractsV6','signatureEnvelopesV6','vendorMessagesV6','vendorRequestsV6'," +
    "'planActualsV6','departmentBudgetsV6','rbacUsersV6','vendorAuditTrailV19','quotationNormalisationsV19','complianceReminderLogV7'];",
  "hydrate() -> every demo-bearing store",
  // Guard on keys patch 6 leaves in place; it rewrites this list's tail.
  "'planItems','grns','journals','assets','approvalPromptsV6'",
)

s = replaceOnce(
  s,
  "if(payload.currentUser) state.currentUser={...(state.currentUser||{}),...structuredClone(payload.currentUser)};",
  "if(payload.currentUser) state.currentUser={...(state.currentUser||{}),...structuredClone(payload.currentUser)};" +
    "if(payload.currentUserV6) state.currentUserV6={...(state.currentUserV6||{}),...structuredClone(payload.currentUserV6)};",
  "hydrate() merges currentUserV6",
  "if(payload.currentUserV6)",
)

// ---------------------------------------------------------------------------
// 3. money(): an em dash for a value the backend does not hold
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);",
  "const money=n=>(n===null||n===undefined||n===''||!Number.isFinite(Number(n)))?'\\u2014':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);",
  "money() -> em dash for no value",
  "const money=n=>(n===null||n===undefined",
)

// ---------------------------------------------------------------------------
// 4. kpi(): live figures, or an honest dash for a fixture literal
// ---------------------------------------------------------------------------
{
  const label = "kpi() -> live figures"
  if (s.includes("[value,sub]=__pr23Kpi(label,value,sub)")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /const kpi=\(label,value,sub,ico='report',page=''\)=>(`[^\n]*`);/
    const m = s.match(re)
    if (!m) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      s = s.replace(m[0], `const kpi=(label,value,sub,ico='report',page='')=>{[value,sub]=__pr23Kpi(label,value,sub);return ${m[1]}};`)
      console.log(`  patch           ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Sidebar badge counts
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "${c?`<span class=\"nav-count\">${c}</span>`:''}",
  "${(()=>{const n=__pr23NavCount(id,c);return n?`<span class=\"nav-count\">${n}</span>`:''})()}",
  "sidebar badge counts -> live",
  "__pr23NavCount(id,c)",
)

/** Replace a string that must occur exactly once — a second occurrence means the wrong target. */
function replaceUnique(src, find, repl, label, alreadyMarker) {
  if (alreadyMarker && src.includes(alreadyMarker)) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
    return src
  }
  const n = src.split(find).length - 1
  if (n !== 1) {
    console.warn(`  MISS            ${label} (${n} occurrences, expected 1)`)
    missed += 1
    return src
  }
  console.log(`  patch           ${label}`)
  applied += 1
  return src.replace(find, repl)
}

// ---------------------------------------------------------------------------
// 6. hydrate() also takes the audit rows, the reminder schedule and the requisitions tab
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "'quotationNormalisationsV19','complianceReminderLogV7'];",
  "'quotationNormalisationsV19','complianceReminderLogV7','complianceReminderSettingsV7','auditEventsLive','prViewV11'];",
  "hydrate() -> audit rows, reminder schedule, requisitions tab",
  "'auditEventsLive','prViewV11'];",
)

// ---------------------------------------------------------------------------
// 7. Requisitions: the approver queue holds what awaits a decision; "my" requests are mine
// ---------------------------------------------------------------------------
// The queue listed everything not approved or rejected — sourced and converted requisitions
// included — and the requester workspace listed every department's requests as the user's own.
s = replaceUnique(
  s,
  "const rowsSource = approver ? state.requisitions.filter(r => !/Approved|Rejected/i.test(r.status)) : state.requisitions;",
  "const rowsSource = approver ? state.requisitions.filter(r => r.rawStatus ? r.rawStatus === 'PENDING_APPROVAL' : !/Approved|Rejected/i.test(r.status)) : state.requisitions.filter(r => { const me = __pr23Live()?.access?.userId; return !me || !r.requestedById || r.requestedById === me; });",
  "requisitions: approver queue and my requests -> real scope",
  "r.rawStatus === 'PENDING_APPROVAL' : !/Approved|Rejected/i",
)

// ---------------------------------------------------------------------------
// 8. Invoice match: each tender's real PO -> GRN -> invoice chain
// ---------------------------------------------------------------------------
// The selection cards numbered their linked POs, GRNs and invoices by list position (i+1,
// i===0?1:0, i===0?2:1) and the workspace paired a tender with the PO at the same index.
s = replaceUnique(
  s,
  "<span class=\"status ${i===0?'green':'amber'}\">${i===0?'Invoice received':'Awaiting invoice'}</span>",
  "${(()=>{const c=__pr23Live()?__pr23MatchChain(t.id):null;return c?`<span class=\"status ${c.tone}\">${c.label}</span>`:`<span class=\"status ${i===0?'green':'amber'}\">${i===0?'Invoice received':'Awaiting invoice'}</span>`})()}",
  "invoice match cards: status -> real chain",
  "__pr23MatchChain(t.id):null;return c?",
)
s = replaceUnique(
  s,
  "<div><span>Linked POs</span><strong>${i+1}</strong></div><div><span>GRNs</span><strong>${i===0?1:0}</strong></div><div><span>Invoices</span><strong>${i===0?2:1}</strong></div>",
  "<div><span>Linked POs</span><strong>${__pr23Live()?__pr23MatchChain(t.id).orders.length:i+1}</strong></div><div><span>GRNs</span><strong>${__pr23Live()?__pr23MatchChain(t.id).grns.length:(i===0?1:0)}</strong></div><div><span>Invoices</span><strong>${__pr23Live()?__pr23MatchChain(t.id).invoices.length:(i===0?2:1)}</strong></div>",
  "invoice match cards: counts -> real chain",
  "__pr23MatchChain(t.id).orders.length",
)
s = replaceUnique(
  s,
  "    const po=state.orders[Math.abs(state.tenders.indexOf(t))%state.orders.length];\n" +
    "    const grn=state.grns.find(g=>g.po===po.id)||state.grns[0];\n" +
    "    const inv=state.invoices.find(i=>i.po===po.id)||state.invoices[0];\n" +
    "    const rows=state.invoices.map(i=>",
  "    const __chain=__pr23Live()?__pr23MatchChain(t.id):null;\n" +
    "    const po=__chain?(__chain.orders[0]||{id:'—',vendor:'No purchase order yet',amount:null,delivery:'—'}):state.orders[Math.abs(state.tenders.indexOf(t))%state.orders.length];\n" +
    "    const grn=__chain?(__chain.grns[0]||{id:'—',item:'Not received',value:null,status:'Not received',asset:false}):(state.grns.find(g=>g.po===po.id)||state.grns[0]);\n" +
    "    const inv=__chain?(__chain.invoices[0]||{id:'—',amount:null,tax:'—',match:'No invoice'}):(state.invoices.find(i=>i.po===po.id)||state.invoices[0]);\n" +
    "    const rows=(__chain?__chain.invoices:state.invoices).map(i=>",
  "invoice match workspace: PO, GRN, invoice -> real chain",
  "const __chain=__pr23Live()?__pr23MatchChain(t.id):null;",
)
s = replaceUnique(
  s,
  "<span>OCR confidence</span><strong>93.7%</strong>",
  "<span>OCR confidence</span><strong>${__pr23Live()?'—':'93.7%'}</strong>",
  "invoice match workspace: OCR confidence -> not recorded",
  "<strong>${__pr23Live()?'—':'93.7%'}</strong>",
)

// ---------------------------------------------------------------------------
// 9. Charts drawn from fixture data render an empty state in a live session
// ---------------------------------------------------------------------------
// Every bars([[...]]) call site passes a literal array and lineChart(id) draws a fixed SVG path.
s = replaceUnique(
  s,
  "function bars(items,id){return `",
  "function bars(items,id){if(__pr23Live())return __pr23NoData('No recorded data for this chart yet.');return `",
  "bars() -> empty state when live",
  "function bars(items,id){if(__pr23Live())",
)
s = replaceUnique(
  s,
  "function lineChart(id){return `",
  "function lineChart(id){if(__pr23Live())return __pr23NoData('No trend data is recorded for this chart yet.');return `",
  "lineChart() -> empty state when live",
  "function lineChart(id){if(__pr23Live())",
)

// The V5 layer reassigns both helpers with richer renderers (month axes, clickable points), and
// those are what actually draw. The declarations above only cover a runtime without that layer.
s = replaceUnique(
  s,
  "  lineChart = function(id){",
  "  lineChart = function(id){if(__pr23Live())return __pr23NoData('No trend data is recorded for this chart yet.');",
  "lineChart (V5 reassignment) -> empty state when live",
  "lineChart = function(id){if(__pr23Live())",
)
s = replaceUnique(
  s,
  "  bars = function(items,id){return `",
  "  bars = function(items,id){if(__pr23Live())return __pr23NoData('No recorded data for this chart yet.');return `",
  "bars (V5 reassignment) -> empty state when live",
  "bars = function(items,id){if(__pr23Live())",
)

// ---------------------------------------------------------------------------
// 10. Donuts: the cycle-status donut and its legend count real records
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "<div class=\"donut chart-click\" data-chart=\"cycle-status\"><div class=\"donut-center\"><strong>287</strong><span>active records</span></div></div>",
  "${__pr23Live()?__pr23CycleDonutHtml():'<div class=\"donut chart-click\" data-chart=\"cycle-status\"><div class=\"donut-center\"><strong>287</strong><span>active records</span></div></div>'}",
  "command centre donut -> real stage counts",
  // Guard on the patched CALL SITE, not the helper name: the injected bridge defines
  // __pr23CycleDonutHtml, so testing the name alone reports "already applied" on a fresh runtime.
  "${__pr23Live()?__pr23CycleDonutHtml():",
)
s = replaceUnique(
  s,
  "      const data=index%2===0?[['Planning',24,'#5b5f9e'],['Sourcing',31,'#2d79b8'],['Fulfilment',27,'#0f8f78'],['Exceptions',18,'#c68a26']]:[['Valid',74,'#0f8f78'],['Expiring',14,'#c68a26'],['Missing',8,'#c65454'],['Review',4,'#5b5f9e']];",
  "      const data=__pr23Live()?__pr23DonutLegend(wrap):(index%2===0?[['Planning',24,'#5b5f9e'],['Sourcing',31,'#2d79b8'],['Fulfilment',27,'#0f8f78'],['Exceptions',18,'#c68a26']]:[['Valid',74,'#0f8f78'],['Expiring',14,'#c68a26'],['Missing',8,'#c65454'],['Review',4,'#5b5f9e']]);if(!data)return;",
  "donut legends -> real percentages, or none",
  // Call site, not helper name — see the donut patch above.
  "const data=__pr23Live()?__pr23DonutLegend(wrap)",
)

// Vendor compliance donut: a fixed 46/21/17/16 split under a live vendor count.
s = replaceUnique(
  s,
  "style=\"background:conic-gradient(#0f8f78 0 46%,#b87518 46% 67%,#c54a58 67% 84%,#d9dde5 84% 100%)\"",
  "style=\"background:${__pr23Live()?__pr23VendorCompliance().gradient:'conic-gradient(#0f8f78 0 46%,#b87518 46% 67%,#c54a58 67% 84%,#d9dde5 84% 100%)'}\"",
  "vendor compliance donut -> real split",
  "__pr23VendorCompliance().gradient",
)
for (const [text, key, fixture] of [
  ["Current", "Valid", "46%"],
  ["Expiring", "Expiring", "21%"],
  ["Expired / missing", "Expired", "17%"],
  ["Under review", "Review", "16%"],
]) {
  s = replaceUnique(
    s,
    `<span>${text}</span><strong>${fixture}</strong>`,
    `<span>${text}</span><strong>\${__pr23Live()?__pr23VendorCompliance().pct.${key}+'%':'${fixture}'}</strong>`,
    `vendor compliance legend: ${text}`,
    `__pr23VendorCompliance().pct.${key}`,
  )
}

// ---------------------------------------------------------------------------
// 11. Purchase orders: open and outstanding exclude what is delivered, billed or cancelled
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "${kpi('Open POs',state.orders.length,'Current demonstration register','order')}${kpi('Value outstanding',money(state.orders.reduce((n,o)=>n+o.amount,0)),'Committed not fully received','account')}",
  "${kpi('Open POs',state.orders.filter(o=>!/Delivered|Billed|Cancelled/i.test(o.status)).length,'Not yet delivered, billed or cancelled','order')}${kpi('Value outstanding',money(state.orders.filter(o=>!/Delivered|Billed|Cancelled/i.test(o.status)).reduce((n,o)=>n+(Number(o.amount)||0),0)),'Committed not fully received','account')}",
  "purchase order KPIs -> open orders only",
  "'Not yet delivered, billed or cancelled'",
)

// ---------------------------------------------------------------------------
// 12. Audit & Compliance: the event stream is the real audit trail
// ---------------------------------------------------------------------------
{
  const label = "audit event stream -> live rows"
  if (s.includes("state.auditEventsLive||[]")) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const re = /(function auditPage\(\)\{\r?\n const rows=)(\[\r?\n  \['AUD-88291'[\s\S]*?\r?\n \])(\.map\(a=>)/
    if (!re.test(s)) {
      console.warn(`  MISS            ${label}`)
      missed += 1
    } else {
      s = s.replace(re, "$1(__pr23Live()?(state.auditEventsLive||[]):$2)$3")
      console.log(`  patch           ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 13. Command centre "Control and system activity": derived from records
// ---------------------------------------------------------------------------
{
  const fixtureRows =
    "<div class=\"list-row\" data-page=\"invoices\"><div class=\"list-main\"><strong>Invoice price variance</strong><span>INV-98430 blocked at 2.4%</span></div>${status('Blocked')}</div>" +
    "<div class=\"list-row\" data-page=\"accounts\"><div class=\"list-main\"><strong>Asset transfer queue</strong><span>2 GRNs awaiting accounting classification</span></div>${status('Pending')}</div>" +
    "<div class=\"list-row\" data-page=\"vendors\"><div class=\"list-main\"><strong>ITF263 expiry review</strong><span>31 vendors need updated tax clearance</span></div>${status('Review')}</div>" +
    "<div class=\"list-row\" data-page=\"reports\"><div class=\"list-main\"><strong>ZPPB statutory report</strong><span>July dataset is ready to preview</span></div>${status('Ready')}</div>"
  s = replaceUnique(
    s,
    fixtureRows,
    "${__pr23Live()?__pr23ControlActivity():`" + fixtureRows + "`}",
    "command centre attention list -> derived",
    "${__pr23Live()?__pr23ControlActivity():",
  )
}

// ---------------------------------------------------------------------------
console.log(`\n${applied} applied, ${skipped} already in place, ${missed} missed`)
if (missed) {
  console.error("One or more patches did not find their anchor. The runtime is NOT fully patched.")
  process.exit(1)
}
if (CHECK_ONLY) {
  const changed = s !== original
  console.log(changed ? "Check: the runtime would change — run without --check." : "Check: the runtime is fully patched.")
  process.exit(changed ? 1 : 0)
}
if (s !== original) {
  fs.writeFileSync(RUNTIME, s)
  console.log(`Wrote ${path.relative(ROOT, RUNTIME)}`)
} else {
  console.log("No change.")
}
