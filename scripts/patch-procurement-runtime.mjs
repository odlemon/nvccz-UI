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
  // Guard without the list's closing bracket: patch 14 appends to this list.
  "'complianceReminderSettingsV7','auditEventsLive','prViewV11'",
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
// 14. hydrate() also takes the quotations and the per-tender evaluation matrices
// ---------------------------------------------------------------------------
s = replaceOnce(
  s,
  "'auditEventsLive','prViewV11'];",
  "'auditEventsLive','prViewV11','quotationsLive','evaluationLive'];",
  "hydrate() -> quotations and evaluation matrices",
  "'quotationsLive','evaluationLive'];",
)

// ---------------------------------------------------------------------------
// 15. Tender builder: real sources, vendor categories and requisition lines
// ---------------------------------------------------------------------------
// "Source record" offered PR-X8F2-0187 and other fixture records, the category list did not
// include any real vendor category (so the category filter hid every vendor), and three
// placeholder lines were pre-filled over the requisition's own.
s = replaceUnique(
  s,
  "<select name=\"source\"><option>PR-X8F2-0187 - Approved requisition</option><option>PPI-0002 - Approved plan line</option><option>TN amendment / re-tender</option><option>Standalone approved requirement</option></select>",
  "<select name=\"source\">${__pr23Live()?__pr23SourceOptions():'<option>PR-X8F2-0187 - Approved requisition</option><option>PPI-0002 - Approved plan line</option><option>TN amendment / re-tender</option><option>Standalone approved requirement</option>'}</select>",
  "tender builder: source -> approved requisitions",
  "<select name=\"source\">${__pr23Live()?__pr23SourceOptions()",
)
s = replaceUnique(
  s,
  "<select name=\"category\" id=\"rfxCategoryV13\"><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Fleet</option><option>Facilities</option><option>Professional services</option></select>",
  "<select name=\"category\" id=\"rfxCategoryV13\">${__pr23Live()?__pr23CategoryOptions():'<option>Technology</option><option>Medical</option><option>Agriculture</option><option>Fleet</option><option>Facilities</option><option>Professional services</option>'}</select>",
  "tender builder: categories -> vendor registry categories",
  "id=\"rfxCategoryV13\">${__pr23Live()?__pr23CategoryOptions()",
)
s = replaceUnique(
  s,
  "${tenderLineRowV13(1,'Core equipment / primary service deliverable')}${tenderLineRowV13(2,'Implementation, configuration and training')}${tenderLineRowV13(3,'Warranty, support and maintenance')}",
  "${__pr23Live()?'<tr class=\"pr23-lines-from-source\"><td colspan=\"7\" class=\"muted\">Line items are copied from the selected requisition. Add a line only for a requirement with no requisition lines.</td></tr>':tenderLineRowV13(1,'Core equipment / primary service deliverable')+tenderLineRowV13(2,'Implementation, configuration and training')+tenderLineRowV13(3,'Warranty, support and maintenance')}",
  "tender builder: placeholder lines -> requisition lines",
  "pr23-lines-from-source",
)

// The builder pre-filled the fixture's August 2026 timetable — its closing date had already
// passed, so an RFQ sent with the defaults could never be quoted on — plus fixture owners, a
// 1,280,000 estimate, a cost centre, a contact address and boilerplate objective and scope text.
// In a live session the dates run from today, the procurement owner is the signed-in user, and
// the rest is left for the user to enter.
for (const [find, repl, label, marker] of [
  [
    "<input name=\"value\" type=\"number\" min=\"0\" value=\"${Number(draft.value||1280000)}\" required>",
    "${__pr23Live()?'<input name=\"value\" type=\"number\" min=\"0\" placeholder=\"Not stored by the backend yet\">':`<input name=\"value\" type=\"number\" min=\"0\" value=\"${Number(draft.value||1280000)}\" required>`}",
    "tender builder: estimate -> blank",
    "placeholder=\"Not stored by the backend yet\"",
  ],
  [
    "<input name=\"costCenter\" value=\"CC-100 Group Technology\">",
    "<input name=\"costCenter\" value=\"${__pr23Live()?'':'CC-100 Group Technology'}\">",
    "tender builder: cost centre -> blank",
    "name=\"costCenter\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"owner\" value=\"Nyasha Moyo\">",
    "<input name=\"owner\" value=\"${__pr23Live()?__pr23Esc(((__pr23Live()||{}).access||{}).name||''):'Nyasha Moyo'}\">",
    "tender builder: procurement owner -> signed-in user",
    "name=\"owner\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"budgetOwner\" value=\"Tinashe Chaka\">",
    "<input name=\"budgetOwner\" value=\"${__pr23Live()?'':'Tinashe Chaka'}\">",
    "tender builder: budget owner -> blank",
    "name=\"budgetOwner\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"contractOwner\" value=\"Head of Technology\">",
    "<input name=\"contractOwner\" value=\"${__pr23Live()?'':'Head of Technology'}\">",
    "tender builder: contract owner -> blank",
    "name=\"contractOwner\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"issueDate\" type=\"date\" value=\"2026-08-03\">",
    "<input name=\"issueDate\" type=\"date\" value=\"${__pr23Live()?__pr23DateOffset(0):'2026-08-03'}\">",
    "tender builder: issue date -> today",
    "name=\"issueDate\" type=\"date\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"clarification\" type=\"datetime-local\" value=\"2026-08-12T12:00\">",
    "<input name=\"clarification\" type=\"datetime-local\" value=\"${__pr23Live()?__pr23DateOffset(7,'12:00'):'2026-08-12T12:00'}\">",
    "tender builder: clarification deadline -> today + 7",
    "name=\"clarification\" type=\"datetime-local\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"briefing\" type=\"datetime-local\" value=\"2026-08-14T10:00\">",
    "<input name=\"briefing\" type=\"datetime-local\" value=\"${__pr23Live()?__pr23DateOffset(9,'10:00'):'2026-08-14T10:00'}\">",
    "tender builder: briefing -> today + 9",
    "name=\"briefing\" type=\"datetime-local\" value=\"${__pr23Live()",
  ],
  [
    "<input name=\"close\" type=\"datetime-local\" value=\"2026-08-28T12:00\" required>",
    "<input name=\"close\" type=\"datetime-local\" value=\"${__pr23Live()?__pr23DateOffset(21,'12:00'):'2026-08-28T12:00'}\" required>",
    "tender builder: closing date -> today + 21",
    "name=\"close\" type=\"datetime-local\" value=\"${__pr23Live()",
  ],
  [
    "<label class=\"span2\">Clarification contact<input value=\"tenders@matanho.africa\">",
    "<label class=\"span2\">Clarification contact<input value=\"${__pr23Live()?'':'tenders@matanho.africa'}\">",
    "tender builder: clarification contact -> blank",
    "Clarification contact<input value=\"${__pr23Live()",
  ],
]) {
  s = replaceUnique(s, find, repl, label, marker)
}
for (const name of ["objective", "scope"]) {
  const label = `tender builder: ${name} boilerplate -> blank`
  const marker = `<textarea name="${name}">\${__pr23Live()?'':`
  if (s.includes(marker)) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
    continue
  }
  const re = new RegExp(`<textarea name="${name}">([^<\`$]*)</textarea>`, "g")
  const found = [...s.matchAll(re)]
  if (found.length !== 1) {
    console.warn(`  MISS            ${label} (${found.length} occurrences, expected 1)`)
    missed += 1
    continue
  }
  s = s.replace(found[0][0], `<textarea name="${name}">\${__pr23Live()?'':\`${found[0][1]}\`}</textarea>`)
  console.log(`  patch           ${label}`)
  applied += 1
}

// ---------------------------------------------------------------------------
// 16. Bid evaluation: the tender's real bids, scored by the evaluation team
// ---------------------------------------------------------------------------
// The workspace listed four invented bidders with invented scores for every tender.
s = replaceUnique(
  s,
  " const t=state.tenders.find(x=>x.id===state.evaluationTender)||state.tenders[0];\n const vendors=['TechNova Solutions','NetShield Africa','CloudAxis Systems','DataFort Zimbabwe'];",
  " const t=state.tenders.find(x=>x.id===state.evaluationTender)||state.tenders[0];\n if(__pr23Live())return __pr23EvaluationPageHtml(t);\n const vendors=['TechNova Solutions','NetShield Africa','CloudAxis Systems','DataFort Zimbabwe'];",
  "bid evaluation workspace -> real bids",
  "if(__pr23Live())return __pr23EvaluationPageHtml(t);",
)

// The V6 award panel offered the same four invented bidders; the winner was a vendor name.
s = replaceUnique(
  s,
  "    const vendors=[\n      {name:'TechNova Solutions',score:91.6,total:1164800,recommended:true},",
  "    if(__pr23Live()&&(!__pr23Can('rfq.award')||!__pr23AwardOptions(tender&&tender.id).length))return __pr23AwardClosedHtml(tender&&tender.id);\n    const vendors=__pr23Live()?__pr23AwardOptions(tender.id):[\n      {name:'TechNova Solutions',score:91.6,total:1164800,recommended:true},",
  "award panel -> the tender's open quotations",
  "__pr23AwardClosedHtml(tender&&tender.id)",
)
s = replaceUnique(
  s,
  "value=\"${esc(v.name)}\" ${state.bidAwardsV6[tender.id]===v.name?'checked':''}",
  "value=\"${esc(v.value||v.name)}\" ${state.bidAwardsV6[tender.id]===v.name?'checked':''}",
  "award panel: the choice carries the quotation id",
  "value=\"${esc(v.value||v.name)}\"",
)
s = replaceUnique(
  s,
  "<span>${v.score}% weighted score</span>",
  "<span>${v.score==null?'Not scored':v.score+'% weighted score'}</span>",
  "award panel: unscored bids say so",
  "v.score==null?'Not scored'",
)
s = replaceUnique(
  s,
  "<strong>${esc(selected.value)}</strong>",
  "<strong>${esc(__pr23Live()?__pr23QuoteLabel(selected.value):selected.value)}</strong>",
  "award confirmation names the bidder",
  "__pr23QuoteLabel(selected.value)",
)

// ---------------------------------------------------------------------------
// 16b. Quotation Comparison: the tender's real quotations, not a fixture dataset
// ---------------------------------------------------------------------------
// The workspace drew every tender from quotationDatasetV7 — the same four invented vendors,
// prices and line items — and the register marked the second row "1 compliance review" by index.
s = replaceUnique(
  s,
  "function quotationWorkspaceV7(id){",
  "function quotationWorkspaceV7(id){if(__pr23Live())return __pr23QuotationWorkspaceHtml(id);",
  "quotation comparison workspace -> real quotations",
  "if(__pr23Live())return __pr23QuotationWorkspaceHtml(id);",
)
s = replaceUnique(
  s,
  "<span class=\"vendor-doc-chip-v6 ${i===0?'valid':i===1?'expiring':'valid'}\">${i===1?'1 compliance review':'Ready'}</span>",
  "${__pr23Live()?__pr23QuotationChip(t.id):`<span class=\"vendor-doc-chip-v6 ${i===0?'valid':i===1?'expiring':'valid'}\">${i===1?'1 compliance review':'Ready'}</span>`}",
  "quotation register chip -> awarded or scored count",
  "${__pr23Live()?__pr23QuotationChip(t.id)",
)

// ---------------------------------------------------------------------------
// 16c. Notifications drawer and Configuration & RBAC
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "case 'notifications':openDrawer('Notifications','Workflow, compliance and system events',",
  "case 'notifications':if(__pr23Live()){openDrawer('Notifications','Workflow, compliance and system events',__pr23NotificationsHtml());break;}openDrawer('Notifications','Workflow, compliance and system events',",
  "notifications drawer -> live counts",
  "__pr23NotificationsHtml());break;}",
)
{
  const label = "settings page -> real permissions, managed in Admin"
  const marker = "if(__pr23Live())return __pr23SettingsPageHtml();"
  if (s.includes(marker)) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else {
    const found = [...s.matchAll(/function settingsPageV6 *\(\) *\{/g)]
    if (found.length !== 1) {
      console.warn(`  MISS            ${label} (${found.length} occurrences, expected 1)`)
      missed += 1
    } else {
      s = s.replace(found[0][0], `${found[0][0]}${marker}`)
      console.log(`  patch           ${label}`)
      applied += 1
    }
  }
}

// ---------------------------------------------------------------------------
// 17. Record GRN and Capture invoice open real forms
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "case 'record-grn':openModal('Record goods received note'",
  "case 'record-grn':if(__pr23Live()){__pr23GrnModal();break;}openModal('Record goods received note'",
  "record GRN -> live receipt form",
  "case 'record-grn':if(__pr23Live())",
)
s = replaceUnique(
  s,
  "function invoiceIntakeModalV5(tenderId='',manual=false){",
  "function invoiceIntakeModalV5(tenderId='',manual=false){if(__pr23Live()&&manual)return __pr23InvoiceCaptureModal(tenderId);",
  "capture invoice -> live capture form",
  "if(__pr23Live()&&manual)return __pr23InvoiceCaptureModal(tenderId);",
)

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
