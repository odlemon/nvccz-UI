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
  // Refresh in place so bridge edits propagate without a re-extract. A Windows checkout has CRLF line
  // endings; a pattern that required "\n" after the end marker matched nothing, so bridge edits were
  // silently dropped while the patches calling them applied (a ReferenceError at render).
  // A replacer function, not a replacement string: the bridge's own code contains "$$" and "$'",
  // which a replacement string would rewrite.
  s = s.replace(/\/\* BEGIN_PROCUREMENT_LIVE_BRIDGE \*\/[\s\S]*?\/\* END_PROCUREMENT_LIVE_BRIDGE \*\/\r?\n/, () => bridgeBlock)
  must(s.includes(bridgeBody), "the live bridge was not refreshed in the runtime — check the BEGIN/END markers and line endings")
  console.log("  refresh         live bridge")
  applied += 1
} else {
  // Ahead of the first page renderer: inside the runtime's scope, after state, money and kpi.
  const anchor = "function dashboardPage(){"
  must(s.includes(anchor), `bridge anchor '${anchor}' not found`)
  s = s.replace(anchor, () => `${bridgeBlock}${anchor}`)
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
  // Guard without the closing bracket: patch 22 appends the letterhead to this list.
  "'quotationsLive','evaluationLive'",
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
// ---------------------------------------------------------------------------
// 18. Create PO and Record payment open real forms
// ---------------------------------------------------------------------------
// Create PO opened a fixture form (awarded tenders from the demo store, a "Network security
// appliances" line at 284,500) whose save and submit only edited the in-browser store. And no
// V23 screen offered payment at all, so procure-to-pay stopped at an approved invoice.
s = replaceUnique(
  s,
  "function poModalV6(existingId=''){",
  "function poModalV6(existingId=''){if(__pr23Live())return __pr23PoModal(existingId);",
  "create PO -> live purchase order form",
  "if(__pr23Live())return __pr23PoModal(existingId);",
)
// A later layer redeclares poModalV6(id='') with its own fixture form, and that declaration is the
// one Create PO actually reaches (found by clicking it: "Generate from an approved award or requisition").
s = replaceUnique(
  s,
  "function poModalV6(id=''){",
  "function poModalV6(id=''){if(__pr23Live())return __pr23PoModal(id);",
  "create PO (later layer) -> live purchase order form",
  "if(__pr23Live())return __pr23PoModal(id);",
)
s = replaceUnique(
  s,
  "actionButton('Capture invoice','capture-invoice-v5','','','invoice')",
  "actionButton('Capture invoice','capture-invoice-v5','','','invoice')+actionButton('Record payment','record-payment-v23','','','account')",
  "invoices list: Record payment button",
  "actionButton('Record payment','record-payment-v23','','','account')",
)
s = replaceUnique(
  s,
  "actionButton('Capture invoice','capture-invoice-v5',t.id,'','invoice')",
  "actionButton('Capture invoice','capture-invoice-v5',t.id,'','invoice')+actionButton('Record payment','record-payment-v23',t.id,'','account')",
  "tender match chain: Record payment button",
  "actionButton('Record payment','record-payment-v23',t.id,'','account')",
)
s = replaceUnique(
  s,
  "'capture-invoice-v5': a => invoiceIntakeModalV5(a.dataset.id||state.matchTender||'',true),",
  "'capture-invoice-v5': a => invoiceIntakeModalV5(a.dataset.id||state.matchTender||'',true), 'record-payment-v23': a => __pr23PaymentModal(a.dataset.id||''),",
  "record payment -> live payment form",
  "'record-payment-v23': a => __pr23PaymentModal(",
)

// ---------------------------------------------------------------------------
// 19. Plans and contracts open real forms; the plan workspace shows its own lines
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "function densePlanModal(planId=''){",
  "function densePlanModal(planId=''){if(__pr23Live())return __pr23PlanModal(planId);",
  "create / edit plan -> live plan form",
  "if(__pr23Live())return __pr23PlanModal(planId);",
)
s = replaceUnique(
  s,
  "function addPlanItemModal(){",
  "function addPlanItemModal(){if(__pr23Live())return __pr23PlanItemModal();",
  "add plan item -> live plan line form",
  "if(__pr23Live())return __pr23PlanItemModal();",
)
s = replaceUnique(
  s,
  "const items=state.planItems.filter((x,i)=>x.entity===p.entity||p.entity==='Group Consolidated'||i<3);",
  "const items=__pr23Live()?state.planItems.filter(x=>x.planRecordId===p.recordId):state.planItems.filter((x,i)=>x.entity===p.entity||p.entity==='Group Consolidated'||i<3);",
  "plan workspace -> its own lines",
  "state.planItems.filter(x=>x.planRecordId===p.recordId)",
)
s = replaceUnique(
  s,
  '<div class="workflow-strip"><div class="workflow-step done"><strong>1. Demand collection</strong><span>Completed by 7 entities</span></div><div class="workflow-step done"><strong>2. Budget validation</strong><span>93.6% funded</span></div><div class="workflow-step current"><strong>3. Procurement review</strong><span>4 items need action</span></div><div class="workflow-step"><strong>4. CFO review</strong><span>Pending</span></div><div class="workflow-step"><strong>5. Committee approval</strong><span>Pending</span></div><div class="workflow-step"><strong>6. Baseline issued</strong><span>Not started</span></div></div>',
  '${__pr23Live()?__pr23PlanStrip(p):\'<div class="workflow-strip"><div class="workflow-step done"><strong>1. Demand collection</strong><span>Completed by 7 entities</span></div><div class="workflow-step done"><strong>2. Budget validation</strong><span>93.6% funded</span></div><div class="workflow-step current"><strong>3. Procurement review</strong><span>4 items need action</span></div><div class="workflow-step"><strong>4. CFO review</strong><span>Pending</span></div><div class="workflow-step"><strong>5. Committee approval</strong><span>Pending</span></div><div class="workflow-step"><strong>6. Baseline issued</strong><span>Not started</span></div></div>\'}',
  "plan workspace -> real progress strip",
  "${__pr23Live()?__pr23PlanStrip(p):",
)
s = replaceUnique(
  s,
  "function contractModalV6(existingId=''){",
  "function contractModalV6(existingId=''){if(__pr23Live())return __pr23ContractModal(existingId);",
  "create / edit contract -> live contract form",
  "if(__pr23Live())return __pr23ContractModal(existingId);",
)
s = replaceUnique(
  s,
  "function contractModalV6(id=''){",
  "function contractModalV6(id=''){if(__pr23Live())return __pr23ContractModal(id);",
  "create / edit contract (later layer) -> live contract form",
  "if(__pr23Live())return __pr23ContractModal(id);",
)

// ---------------------------------------------------------------------------
// 20. Exports carry the register they are named for; Accounts shows real payables and journals
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "function exportFile(format,title='Matanho Procurement Report'){",
  "function exportFile(format,title='Matanho Procurement Report'){if(__pr23Live())return __pr23ExportFile(format,title);",
  "exports -> live register by name",
  "if(__pr23Live())return __pr23ExportFile(format,title);",
)
s = replaceUnique(
  s,
  "if(state.accountTab==='payments') content=table(",
  "if(state.accountTab==='payments') content=__pr23Live()?__pr23PayablesTable():table(",
  "accounts payable tab -> approved and paid invoices",
  "content=__pr23Live()?__pr23PayablesTable():table(",
)
s = replaceUnique(
  s,
  "<td><button class=\"btn small\" data-action=\"post-journal\" data-id=\"${j.id}\">Post</button></td>",
  "<td>${__pr23Live()?'':`<button class=\"btn small\" data-action=\"post-journal\" data-id=\"${j.id}\">Post</button>`}</td>",
  "journal queue: no Post button on journals the payment already posted",
  "${__pr23Live()?'':`<button class=\"btn small\" data-action=\"post-journal\"",
)

// ---------------------------------------------------------------------------
// 21. Requisition budget notice from approved plans; Reports "Run" exports live records
// ---------------------------------------------------------------------------
s = replaceUnique(
  s,
  "<p>Remaining budget: $86,400. The request will warn or block according to the cost-centre control.</p>",
  "${__pr23Live()?__pr23BudgetNotice():'<p>Remaining budget: $86,400. The request will warn or block according to the cost-centre control.</p>'}",
  "requisition form: budget notice from approved plans",
  "${__pr23Live()?__pr23BudgetNotice():",
)
s = replaceUnique(
  s,
  "'run-report-template-v5': a => {",
  "'run-report-template-v5': a => {if(__pr23Live()){const t=getReport(a.dataset.id);__pr23ExportFile('xls',t.name);toast('Report exported',t.name+' was exported from the live procurement records.');return;}",
  "reports: Run exports the live records",
  "if(__pr23Live()){const t=getReport(a.dataset.id);__pr23ExportFile('xls',t.name);",
)

// ---------------------------------------------------------------------------
// 22. Full UI census: pages by role, filters that filter, charts and headlines from records, vault
//     counts, tenders awaiting evaluation, vendor tax status without a country, the approver's own
//     queue, empty registers that say so, and posting a pending journal
// ---------------------------------------------------------------------------

/** Replace every occurrence of `find`; the runtime is known to hold exactly `expected` of them. */
function replaceEvery(src, find, repl, label, alreadyMarker, expected) {
  if (alreadyMarker && src.includes(alreadyMarker)) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
    return src
  }
  const n = src.split(find).length - 1
  if (n !== expected) {
    console.warn(`  MISS            ${label} (${n} occurrences, expected ${expected})`)
    missed += 1
    return src
  }
  console.log(`  patch           ${label} (x${n})`)
  applied += 1
  return src.split(find).join(repl)
}

// Every page was offered to every role; a requester saw registers they cannot read as empty.
s = replaceUnique(
  s,
  "$('#nav').innerHTML=navGroups.map(([g,items])=>`<div class=\"nav-group\">${g}</div>${items.map(",
  "$('#nav').innerHTML=navGroups.map(([g,items])=>[g,__pr23Live()?items.filter(([id])=>__pr23PageAllowed(id)):items]).filter(([,items])=>items.length).map(([g,items])=>`<div class=\"nav-group\">${g}</div>${items.map(",
  "sidebar: only the pages the role can open",
  "items.filter(([id])=>__pr23PageAllowed(id))",
)
s = replaceUnique(
  s,
  "$('#workspace').innerHTML=(pages[state.page]||dashboardPage)();",
  "$('#workspace').innerHTML=(__pr23Live()&&!__pr23PageAllowed(state.page))?__pr23NoAccessHtml(state.page):(pages[state.page]||dashboardPage)();if(__pr23Live()&&state.filterApplied)requestAnimationFrame(()=>__pr23ApplyTableFilters());",
  "render: a page the role cannot open says so; applied filters survive a re-render",
  "__pr23NoAccessHtml(state.page)",
)

// The filter bar stored its choices and filtered nothing, while its toast said charts, KPIs and tables had changed.
s = replaceUnique(
  s,
  "options(['FY 2026','Q3 2026','Q2 2026','YTD 2026'],state.filters.period)",
  "options(__pr23Live()?__pr23FilterOptions('period'):['FY 2026','Q3 2026','Q2 2026','YTD 2026'],state.filters.period)",
  "filter bar: year choices",
  "__pr23FilterOptions('period')",
)
s = replaceUnique(
  s,
  "options(['All categories','Technology','Medical','Agriculture','Facilities','Fleet'],state.filters.category)",
  "options(__pr23Live()?__pr23FilterOptions('category'):['All categories','Technology','Medical','Agriculture','Facilities','Fleet'],state.filters.category)",
  "filter bar: departments on record",
  "__pr23FilterOptions('category')",
)
s = replaceUnique(
  s,
  "options(['All statuses','Approved','Under review','Blocked'],state.filters.status)",
  "options(__pr23Live()?__pr23FilterOptions('status'):['All statuses','Approved','Under review','Blocked'],state.filters.status)",
  "filter bar: statuses on record",
  "__pr23FilterOptions('status')",
)
s = replaceUnique(
  s,
  "<select data-filter=\"currency\">${options(['USD','ZiG','ZAR'],state.filters.currency)}</select>",
  "${__pr23Live()?'':`<select data-filter=\"currency\">${options(['USD','ZiG','ZAR'],state.filters.currency)}</select>`}",
  "filter bar: no currency choice (records carry their own currency)",
  "${__pr23Live()?'':`<select data-filter=\"currency\">",
)
s = replaceUnique(
  s,
  "render();toast('Dashboard filters applied','Charts, KPIs and tables now use the selected period, category, status and currency.');break;",
  "render();if(__pr23Live())requestAnimationFrame(()=>toast('Filters applied',__pr23ApplyTableFilters()));else toast('Dashboard filters applied','Charts, KPIs and tables now use the selected period, category, status and currency.');break;",
  "filter bar: Apply filters the registers and says how many rows match",
  "toast('Filters applied',__pr23ApplyTableFilters())",
)
s = replaceUnique(
  s,
  "state.filterApplied=false;render();toast('Filters reset','Showing the full authorised population.');break;",
  "state.filterApplied=false;render();toast('Filters reset',__pr23Live()?'Showing every record your role can see.':'Showing the full authorised population.');break;",
  "filter bar: Reset says what is shown",
  "'Showing every record your role can see.'",
)

// Charts that section 9 emptied are drawn from records where the records answer them.
s = replaceUnique(
  s,
  "function bars(items,id){if(__pr23Live())return __pr23NoData('No recorded data for this chart yet.');",
  "function bars(items,id){if(__pr23Live())return __pr23LiveBars(items,id);",
  "bars(): live bars where records answer the chart",
  "function bars(items,id){if(__pr23Live())return __pr23LiveBars(items,id);",
)
s = replaceUnique(
  s,
  "bars = function(items,id){if(__pr23Live())return __pr23NoData('No recorded data for this chart yet.');",
  "bars = function(items,id){if(__pr23Live())return __pr23LiveBars(items,id);",
  "bars (V5 reassignment): live bars",
  "bars = function(items,id){if(__pr23Live())return __pr23LiveBars(items,id);",
)
s = replaceUnique(
  s,
  "function lineChart(id){if(__pr23Live())return __pr23NoData('No trend data is recorded for this chart yet.');",
  "function lineChart(id){if(__pr23Live())return __pr23LiveLine(id);",
  "lineChart(): live monthly lines",
  "function lineChart(id){if(__pr23Live())return __pr23LiveLine(id);",
)
s = replaceUnique(
  s,
  "lineChart = function(id){if(__pr23Live())return __pr23NoData('No trend data is recorded for this chart yet.');",
  "lineChart = function(id){if(__pr23Live())return __pr23LiveLine(id);",
  "lineChart (V5 reassignment): live monthly lines",
  "lineChart = function(id){if(__pr23Live())return __pr23LiveLine(id);",
)

// Document Vault: folder tiles and vault health were fixture counts ("Invoices & AP 4,102 records").
// Two runtime layers (V5 and V11) each carry the folder list.
s = replaceEvery(
  s,
  "const folders=[['Annual Plans','184','Planning baselines and amendments'],",
  "const folders=__pr23Live()?__pr23VaultFolders():[['Annual Plans','184','Planning baselines and amendments'],",
  "document vault: folder counts from stored files",
  "const folders=__pr23Live()?__pr23VaultFolders():",
  2,
)
s = replaceUnique(
  s,
  "${[['Annual Plans','184'],['Tenders & Bids','2,410'],['Contracts & Awards','1,286'],['Orders & GRNs','3,928'],['Invoices & AP','4,102'],['Audit Evidence','576']].map(x=>",
  "${(__pr23Live()?__pr23VaultFolders().slice(0,6):[['Annual Plans','184'],['Tenders & Bids','2,410'],['Contracts & Awards','1,286'],['Orders & GRNs','3,928'],['Invoices & AP','4,102'],['Audit Evidence','576']]).map(x=>",
  "document vault (base page): folder counts from stored files",
  "__pr23VaultFolders().slice(0,6)",
)
s = replaceEvery(
  s,
  "<span>7 files require review</span>",
  "<span>${__pr23Live()?__pr23PendingReviewText():'7 files require review'}</span>",
  "document vault health: files awaiting review",
  "__pr23PendingReviewText()",
  2,
)
s = replaceEvery(
  s,
  "<span>12 active secure links</span></div>${status('Active')}",
  "<span>${__pr23Live()?'External sharing is not tracked for vault files':'12 active secure links'}</span></div>${__pr23Live()?status('Not tracked'):status('Active')}",
  "document vault health: no invented share count",
  "External sharing is not tracked for vault files",
  2,
)

// Analysis headlines were fixture narratives ("$5.12m committed against an $8.24m plan").
for (const [kind, find] of [
  ["spend", "<div class=\"analysis-hero\"><div><h2>$5.12m committed against an $8.24m plan</h2><p>Commitments are 62.1% of the annual plan. Technology is ahead of phasing because the cybersecurity programme moved into Q3.</p></div><div class=\"analysis-value\">62.1%</div></div>"],
  ["cycle", "<div class=\"analysis-hero\"><div><h2>287 active procurement records</h2><p>19 records are outside their target service level. Tender clarification and invoice exception resolution currently create the largest delays.</p></div><div class=\"analysis-value\">8.4 days</div></div>"],
  ["category", "<div class=\"analysis-hero\"><div><h2>$5.12m managed category spend</h2><p>Technology and medical equipment represent 62% of committed value. Supplier concentration remains within policy, except for diagnostic equipment.</p></div><div class=\"analysis-value\">7.8%</div></div>"],
  ["exceptions", "<div class=\"analysis-hero\"><div><h2>15 invoice exceptions require action</h2><p>Price variance is the largest cause by value. Six invoices also require withholding tax because the vendor has no valid ITF263.</p></div><div class=\"analysis-value\">$326k</div></div>"],
  ["reports", "<div class=\"analysis-hero\"><div><h2>286 report downloads this month</h2><p>Executive plan-vs-actual reports have the highest repeat usage. Excel is the dominant working format, while signed PDF is used for committees and boards.</p></div><div class=\"analysis-value\">18 schedules</div></div>"],
]) {
  s = replaceUnique(s, find, "${__pr23Live()?__pr23AnalysisHero('" + kind + "'):'" + find + "'}", `analysis headline (${kind}) -> from records`, "__pr23AnalysisHero('" + kind + "')")
}

// Bid Evaluation listed awarded tenders as "ready for evaluation".
s = replaceUnique(
  s,
  "const rows=state.tenders.filter(t=>t.bids>0).map(t=>`<tr data-action=\"open-evaluation\"",
  "const rows=state.tenders.filter(t=>t.bids>0&&(!__pr23Live()||t.stage==='Evaluation')).map(t=>`<tr data-action=\"open-evaluation\"",
  "bid evaluation: only tenders with bids and no award",
  "t.bids>0&&(!__pr23Live()||t.stage==='Evaluation')",
)

// Vendor tax: the record holds no country, and "not Zimbabwe" made every vendor a non-resident for specialist review.
s = replaceEvery(
  s,
  "vendor.country!=='Zimbabwe'",
  "(vendor.country!=='Zimbabwe'&&__pr23CountryKnown(vendor))",
  "vendor tax rule: an unknown country is not non-resident",
  "__pr23CountryKnown(vendor)",
  3,
)
s = replaceUnique(
  s,
  ":status('Complete')}</td><td>${v.rating} / 5</td>",
  ":(__pr23Live()&&!(v.complianceDocs||[]).length?status('Not on file'):status('Complete'))}</td><td>${v.rating} / 5</td>",
  "vendor registry: no documents on file is not \"Complete\"",
  "status('Not on file')",
)
s = replaceUnique(
  s,
  "kpi('Expiring / expired',expiring.length,'Automated reminders active'",
  "kpi('Expiring / expired',expiring.length,__pr23Live()?'Tax clearance expired or expiring':'Automated reminders active'",
  "vendor registry: no claim that reminders are running",
  "'Tax clearance expired or expiring'",
)

// Requisitions: the approver queue listed every department's pending requests to a head of another department.
s = replaceUnique(
  s,
  "r.rawStatus ? r.rawStatus === 'PENDING_APPROVAL' : !/Approved|Rejected/i",
  "r.rawStatus ? r.awaitingMe !== false && r.rawStatus === 'PENDING_APPROVAL' : !/Approved|Rejected/i",
  "requisitions: approver queue holds only what this approver can decide",
  "r.awaitingMe !== false && r.rawStatus",
)
s = replaceUnique(
  s,
  "kpi('My open requests',rowsSource.length,",
  "kpi('My open requests',(__pr23Live()?rowsSource.filter(r=>['DRAFT','PENDING_APPROVAL','REJECTED'].includes(String(r.rawStatus||'').toUpperCase())):rowsSource).length,",
  "requisitions: \"My open requests\" counts drafts, pending and returned only",
  "['DRAFT','PENDING_APPROVAL','REJECTED'].includes(String(r.rawStatus||'').toUpperCase())",
)

// Command Centre: "Pending approvals" counted every pending requisition; "My approval queue" listed the latest requisitions.
s = replaceUnique(
  s,
  "const approvals=state.requisitions.filter(x=>/Pending|review/i.test(x.status)).length;",
  "const approvals=__pr23Live()?(state.approvalPromptsV6||[]).length:state.requisitions.filter(x=>/Pending|review/i.test(x.status)).length;",
  "command centre: pending approvals are the user's own decisions",
  "const approvals=__pr23Live()?(state.approvalPromptsV6||[]).length:",
)
s = replaceUnique(
  s,
  "card('My approval queue','Time-sensitive decisions',`<div class=\"card-body list\">${state.requisitions.slice(0,4).map(r=>",
  "card('My approval queue','Time-sensitive decisions',`<div class=\"card-body list\">${__pr23Live()?__pr23MyQueueHtml():state.requisitions.slice(0,4).map(r=>",
  "command centre: my approval queue lists my decisions",
  "${__pr23Live()?__pr23MyQueueHtml():",
)

// An empty register printed its headers and nothing else.
s = replaceUnique(
  s,
  "const table=(heads,rows,attrs='')=>`<div class=\"table-wrap\"><table ${attrs}><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;",
  "const table=(heads,rows,attrs='')=>`<div class=\"table-wrap\"><table ${attrs}><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${(__pr23Live()&&!rows.length)?`<tr><td colspan=\"${heads.length}\" class=\"pr23-empty-row\" style=\"text-align:center;color:#64748b;padding:18px 12px\">No records to show yet.</td></tr>`:rows.join('')}</tbody></table></div>`;",
  "table(): an empty register says so",
  "class=\"pr23-empty-row\"",
)

// Paying an invoice creates its journal as PENDING, so the queue offers Post for those (section 20 hid it).
s = replaceUnique(
  s,
  "<td>${__pr23Live()?'':`<button class=\"btn small\" data-action=\"post-journal\" data-id=\"${j.id}\">Post</button>`}</td>",
  "<td>${__pr23Live()?'':`<button class=\"btn small\" data-action=\"post-journal\" data-id=\"${j.id}\">Post</button>`}${__pr23Live()&&j.status==='Pending'?`<button class=\"btn small\" data-action=\"post-journal\" data-id=\"${j.id}\">Post</button>`:''}</td>",
  "journal queue: Post on pending journals",
  "__pr23Live()&&j.status==='Pending'?`<button",
)

s = replaceOnce(
  s,
  "'quotationsLive','evaluationLive'];",
  "'quotationsLive','evaluationLive','letterhead'];",
  "hydrate() -> the organisation's letterhead",
  "'evaluationLive','letterhead'",
)

// A requester could not correct a draft or a rejected requisition: the edit form only changed the
// browser's copy, its motivation was sample text, and a rejected request offered no edit at all.
s = replaceUnique(
  s,
  "const canEdit = /Draft|Returned|Information requested|revision/i.test(r.status);",
  "const canEdit = __pr23Live() ? ['DRAFT','REJECTED'].includes(String(r.rawStatus||'').toUpperCase()) : /Draft|Returned|Information requested|revision/i.test(r.status);",
  "requisitions: drafts and rejected requests offer Edit request",
  "['DRAFT','REJECTED'].includes(String(r.rawStatus||'').toUpperCase()) :",
)
s = replaceUnique(
  s,
  "<div class=\"field\"><label>Category</label><select name=\"category\"><option>${escV11(r.category)}</option><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Facilities</option><option>Fleet</option></select></div><div class=\"field\"><label>Estimated value</label><input name=\"amount\" type=\"number\" value=\"${Number(r.amount)}\" required></div>",
  "${__pr23Live()?'':`<div class=\"field\"><label>Category</label><select name=\"category\"><option>${escV11(r.category)}</option><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Facilities</option><option>Fleet</option></select></div><div class=\"field\"><label>Estimated value</label><input name=\"amount\" type=\"number\" value=\"${Number(r.amount)}\" required></div>`}",
  "requisition edit form: no sample categories or a total that is really the lines' estimate",
  "${__pr23Live()?'':`<div class=\"field\"><label>Category</label><select name=\"category\">",
)
s = replaceUnique(
  s,
  "<textarea name=\"justification\">The requirement supports approved departmental operations and service-delivery objectives. Procurement should validate the specification and sourcing route before commitment.</textarea>",
  "<textarea name=\"justification\">${__pr23Live()?escV11(r.justification||''):'The requirement supports approved departmental operations and service-delivery objectives. Procurement should validate the specification and sourcing route before commitment.'}</textarea>",
  "requisition edit form: the requester's own justification",
  "escV11(r.justification||'')",
)
s = replaceUnique(
  s,
  "if (mode === 'edit') foot += actionV11('Save changes','save-pr-v11',r.id,'primary','document');",
  "if (mode === 'edit') foot += actionV11(__pr23Live()?'Save draft':'Save changes','save-pr-v11',r.id,__pr23Live()?'':'primary','document') + (__pr23Live()?actionV11('Save and submit','submit-pr-v11',r.id,'primary','approve'):'');",
  "requisition edit form: save, or save and submit",
  "actionV11('Save and submit','submit-pr-v11'",
)

// Actuals vs Plan "Management observations" was fixture text (a solar pump programme, fleet tyres, a
// clinical budget) whose rows opened a budget that does not exist.
{
  const find = "card('Management observations','Quantity, timing and department budget signals',`<div class=\"card-body list\"><div class=\"list-row\" data-action=\"open-plan-actual-v6\" data-id=\"PPI-0002\"><div class=\"list-main\"><strong>Solar pump programme behind quantity plan</strong><span>12 of 18 ordered; no accepted receipt recorded</span></div>${status('Attention')}</div><div class=\"list-row\" data-action=\"open-plan-actual-v6\" data-id=\"PPI-0004\"><div class=\"list-main\"><strong>Fleet tyre quantity variance</strong><span>190 of 640 received; framework remains within value</span></div>${status('Review')}</div><div class=\"list-row\" data-action=\"open-department-budget-v6\" data-id=\"Clinical Services\"><div class=\"list-main\"><strong>Clinical Services budget utilisation</strong><span>High utilisation following MRI capital purchase</span></div>${status('High')}</div></div>`)"
  const repl = find.replace("signals',`", "signals',__pr23Live()?__pr23PlanObservationsHtml():`")
  s = replaceUnique(s, find, repl, "actuals vs plan: management observations from approved plans", "__pr23PlanObservationsHtml()")
}

// Vendor Registry compliance filter announced a filter and filtered nothing.
s = replaceUnique(
  s,
  "'vendor-compliance-filter-v6':a=>toast('Compliance filter applied',`Showing vendors with ${a.dataset.id.toLowerCase()} compliance records.`),",
  "'vendor-compliance-filter-v6':a=>{if(__pr23Live())return __pr23VendorComplianceFilter(a.dataset.id);toast('Compliance filter applied',`Showing vendors with ${a.dataset.id.toLowerCase()} compliance records.`)},",
  "vendor registry: the compliance filter filters and says how many match",
  "return __pr23VendorComplianceFilter(a.dataset.id);",
)

// Opening a department budget with none recorded crashed the page ("reading 'department'").
s = replaceUnique(
  s,
  "const b=state.departmentBudgetsV6.find(x=>x.department===name)||state.departmentBudgetsV6[0];",
  "const b=state.departmentBudgetsV6.find(x=>x.department===name)||state.departmentBudgetsV6[0];if(!b){toast('No department budget',`No approved plan budget is recorded for ${name||'this department'}.`);return;}",
  "department budget detail: no crash when no budget is recorded",
  "if(!b){toast('No department budget',",
)

// "Share" announced a secure, expiring link that was never created; it copies the page's own address.
s = replaceUnique(
  s,
  "case 'share-record':toast('Secure link copied','The access-controlled link expires in seven days.');break;",
  "case 'share-record':if(__pr23Live()){__pr23CopyPageLink();break;}toast('Secure link copied','The access-controlled link expires in seven days.');break;",
  "activity menu: Share copies the page link and says what it is",
  "if(__pr23Live()){__pr23CopyPageLink();break;}",
)

// Generated documents fell back to the fixture company's address and mailbox when a field was blank;
// in a live session the letterhead comes from the company profile and a blank field stays blank.
for (const [find, fixture, count] of [
  ["lh.company || 'Matanho Holdings Limited'", "'Matanho Holdings Limited'", 2],
  ["lh.company||'Matanho Holdings Limited'", "'Matanho Holdings Limited'", 1],
  ["lh.address || 'Harare, Zimbabwe'", "'Harare, Zimbabwe'", 1],
  ["lh.address||'Harare, Zimbabwe'", "'Harare, Zimbabwe'", 1],
  ["lh.contact || 'procurement@matanho.africa'", "'procurement@matanho.africa'", 1],
  ["lh.contact||'procurement@matanho.africa'", "'procurement@matanho.africa'", 1],
]) {
  const repl = find.replace(fixture, `(__pr23Live()?'':${fixture})`)
  s = replaceEvery(s, find, repl, `letterhead: no fixture fallback in "${find}"`, repl, count)
}

// ---------------------------------------------------------------------------
// 23. AI Invoice Capture — a page that reads a real supplier invoice
// ---------------------------------------------------------------------------
// The fixture OCR queue listed three files nobody had uploaded (invoice_aug_001.pdf,
// medequip_44019.pdf, unknown_scan_14.jpg) with invented confidence figures, and its buttons
// announced captures that never happened. In a live session the OCR controls now open a page that
// uploads one real PDF, reads it through Suite 06 (pdf-parse -> LLM -> strict JSON) and prefills
// the capture form. The invoice is still written by the capture form, so matching, approval and
// payment are untouched.
s = replaceUnique(
  s,
  "['invoices','Invoices & 3-Way Match','invoice','12'],['accounts','Accounts & Asset Transfers','account','4']",
  "['invoices','Invoices & 3-Way Match','invoice','12'],['intake','AI Invoice Capture','invoice',''],['accounts','Accounts & Asset Transfers','account','4']",
  "sidebar: AI Invoice Capture, under Fulfil & Account",
  "['intake','AI Invoice Capture','invoice','']",
)
s = replaceUnique(
  s,
  "invoices:invoicesPage,accounts:accountsPage,",
  "invoices:invoicesPage,intake:__pr23AiCapturePage,accounts:accountsPage,",
  "page map: intake -> the AI capture page",
  "intake:__pr23AiCapturePage",
)
s = replaceUnique(
  s,
  "'run-ocr-v5': a => openWideModal(",
  "'run-ocr-v5': a => __pr23Live() ? (state.page = 'intake', render()) : openWideModal(",
  "Run OCR opens AI Invoice Capture in a live session",
  "'run-ocr-v5': a => __pr23Live()",
)
s = replaceUnique(
  s,
  "'upload-invoice-v5': a => invoiceIntakeModalV5(",
  "'upload-invoice-v5': a => __pr23Live() ? (state.page = 'intake', render()) : invoiceIntakeModalV5(",
  "Upload invoice opens AI Invoice Capture in a live session",
  "'upload-invoice-v5': a => __pr23Live()",
)
s = replaceUnique(
  s,
  "'upload-invoice': a => invoiceIntakeModalV5(",
  "'upload-invoice': a => __pr23Live() ? (state.page = 'intake', render()) : invoiceIntakeModalV5(",
  "Upload invoice (v5 alias) opens AI Invoice Capture in a live session",
  "'upload-invoice': a => __pr23Live()",
)
// The button no longer opens a queue, so it no longer says it does.
s = replaceUnique(
  s,
  "actionButton('Process OCR queue','run-ocr-v5')",
  "actionButton('AI invoice capture','run-ocr-v5')",
  "invoices page: 'Process OCR queue' -> 'AI invoice capture'",
  "actionButton('AI invoice capture','run-ocr-v5')",
)
s = replaceUnique(
  s,
  "actionButton('Run OCR','run-ocr-v5',t.id)",
  "actionButton('AI invoice capture','run-ocr-v5',t.id)",
  "match workspace: 'Run OCR' -> 'AI invoice capture'",
  "actionButton('AI invoice capture','run-ocr-v5',t.id)",
)

// ---------------------------------------------------------------------------
// 24. Every document and window listener is removed with the runtime
// ---------------------------------------------------------------------------
// RouteTransition in the root layout keys the page on its pathname, so each sidebar navigation
// unmounts the host and starts a new runtime. destroy() aborts __pr23Abort, but only the listeners
// given __pr23Sig went with it. The vendored layers' capture-phase click dispatchers stayed on
// document and window, bound to the emptied root of the runtime they came from: the first to match a
// click stopped it reaching the live runtime, then threw on $('#drawerLayer') being null. After one
// sidebar navigation, every button the host does not claim did nothing ("Capture this invoice", D1).
{
  const label = "document and window listeners are removed by destroy()"
  const anchor = "const __pr23Sig = { signal: __pr23Abort.signal };"
  const helperMarker = "const __pr23On = "
  const helper =
    " const __pr23On = (target, type, fn, opts) => target.addEventListener(type, fn, Object.assign(typeof opts === 'object' && opts !== null ? { ...opts } : { capture: opts === true }, { signal: __pr23Abort.signal }));"
  const calls = /(?<![.\w])(document|window)\.addEventListener\(/g
  const pending = (s.match(calls) || []).length
  if (s.includes(helperMarker) && pending === 0) {
    console.log(`  skip (already)  ${label}`)
    skipped += 1
  } else if (!s.includes(helperMarker) && s.split(anchor).length !== 2) {
    console.warn(`  MISS            ${label} (abort signal anchor not found exactly once)`)
    missed += 1
  } else {
    if (!s.includes(helperMarker)) s = s.replace(anchor, anchor + helper)
    s = s.replace(calls, "__pr23On($1, ")
    console.log(`  patch           ${label} (${pending} listener${pending === 1 ? "" : "s"})`)
    applied += 1
  }
}

// ---------------------------------------------------------------------------
// 25. New requisition takes as many lines as the request needs
// ---------------------------------------------------------------------------
// The vendored form had one fixed line with a $1,000 unit estimate already filled in: a request for
// three different things could not be raised from the UI, and every request carried an estimate
// nobody had given. The bridge's __pr23PrLinesTbody() supplies the live lines.
s = replaceUnique(
  s,
  '<tbody><tr><td><input name="item" required></td><td><select name="uom"><option>Each</option><option>Box</option><option>Lot</option><option>Month</option></select></td><td><input name="qty" type="number" value="1"></td><td><input name="price" type="number" value="1000"></td><td>$1,000</td></tr></tbody>',
  '${__pr23Live()?__pr23PrLinesTbody():`<tbody><tr><td><input name="item" required></td><td><select name="uom"><option>Each</option><option>Box</option><option>Lot</option><option>Month</option></select></td><td><input name="qty" type="number" value="1"></td><td><input name="price" type="number" value="1000"></td><td>$1,000</td></tr></tbody>`}',
  "new requisition -> as many lines as the request needs, no invented estimate",
  "__pr23Live()?__pr23PrLinesTbody():",
)

// ---------------------------------------------------------------------------
// 26. The requester chooses the requisition's category, from the categories vendors are registered in
// ---------------------------------------------------------------------------
// The vendored Category list (Technology, Medical, Agriculture, Facilities, Fleet) defaulted to
// Technology, and none of it but Technology matched a registered vendor. Every requisition raised from
// the UI was sourced as TECHNOLOGY without anyone choosing it, and the API then refused an RFQ to any
// other vendor ("category does not match this requisition sourcing category").
s = replaceUnique(
  s,
  "formField('Category','<select name=\"category\"><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Facilities</option><option>Fleet</option></select>')",
  "(__pr23Live()?formField('Category','<select name=\"category\" required>'+__pr23RequisitionCategoryOptions()+'</select>'):formField('Category','<select name=\"category\"><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Facilities</option><option>Fleet</option></select>'))",
  "new requisition -> category chosen from live vendor categories",
  "'<select name=\"category\" required>'+__pr23RequisitionCategoryOptions()",
)

// ---------------------------------------------------------------------------
// 27. Register vendor uses the same category list as requisitions and RFQs
// ---------------------------------------------------------------------------
// The vendored list (Technology, Medical, Agriculture, Fleet, Facilities, Professional services) could not
// register an Office Supplies or Furniture vendor, while the API matches RFQ invitations on category.
s = replaceUnique(
  s,
  "formField('Category','<select name=\"category\"><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Fleet</option><option>Facilities</option><option>Professional services</option></select>')",
  "(__pr23Live()?formField('Category','<select name=\"category\" required>'+__pr23RequisitionCategoryOptions()+'</select>'):formField('Category','<select name=\"category\"><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Fleet</option><option>Facilities</option><option>Professional services</option></select>'))",
  "register vendor -> category from the shared procurement list",
  "__pr23RequisitionCategoryOptions()+'</select>'):formField('Category','<select name=\"category\"><option>Technology</option><option>Medical</option><option>Agriculture</option><option>Fleet</option><option>Facilities</option><option>Professional services</option></select>'))",
)

// ---------------------------------------------------------------------------
// 28. New requisition shows the entity and department it is really raised against
// ---------------------------------------------------------------------------
// The vendored selects showed "Matanho Holdings" and "IT & Digital / CC-1001" to every requester. Neither is
// saved - the host raises the requisition against the requester's own department - so a live session shows
// the organisation and that department, read-only.
s = replaceUnique(
  s,
  "${formField('Entity',`<select name=\"entity\">${entities.slice(1).map(x=>`<option>${x[1]}</option>`).join('')}</select>`)}${formField('Department / cost centre','<select name=\"cost\"><option>IT & Digital / CC-1001</option><option>Finance / CC-1002</option><option>Operations / CC-2001</option></select>')}",
  "${__pr23Live()?__pr23RequisitionEntityField()+__pr23RequisitionDepartmentField():formField('Entity',`<select name=\"entity\">${entities.slice(1).map(x=>`<option>${x[1]}</option>`).join('')}</select>`)+formField('Department / cost centre','<select name=\"cost\"><option>IT & Digital / CC-1001</option><option>Finance / CC-1002</option><option>Operations / CC-2001</option></select>')}",
  "new requisition -> real entity and department, read-only",
  "__pr23RequisitionEntityField()+__pr23RequisitionDepartmentField()",
)

// ---------------------------------------------------------------------------
// 29. Preview vendor form shows no fixture vendor or bid
// ---------------------------------------------------------------------------
// Found by the UI census: the preview named "TechNova Solutions" with a 1,280,000 bid against TN-2026-014,
// and offered Save draft / Seal & submit buttons that save nothing. arguments[0] is the id actually passed;
// the default parameter would turn a missing id into the fixture tender.
s = replaceUnique(
  s,
  "function vendorBidPreview(id='TN-2026-014'){",
  "function vendorBidPreview(id='TN-2026-014'){if(__pr23Live())return __pr23VendorBidPreview(arguments[0]);",
  "vendor bid preview -> no fixture vendor, tender or bid",
  "if(__pr23Live())return __pr23VendorBidPreview(arguments[0]);",
)

// ---------------------------------------------------------------------------
// 30-34. No fixture company in entity, owner and letterhead choices
// ---------------------------------------------------------------------------
// Found by the UI census: Create tender / RFx, Edit record, Build procurement report and the letterhead
// selects offered Matanho Holdings, Matanho Capital Management, Kariba Agro Limited, Lumina Health Group,
// Kudu Logistics and Nyanga Hospitality, and a record with no owner showed "Group Procurement".
s = replaceUnique(
  s,
  "if(payload.entity) state.entity=payload.entity;",
  "if(typeof __pr23SyncEntities==='function')__pr23SyncEntities();if(payload.entity) state.entity=payload.entity;",
  "hydrate -> entity list is the organisation's",
  "__pr23SyncEntities();if(payload.entity)",
)
s = replaceUnique(
  s,
  "esc(r.owner||'Group Procurement')",
  "esc(r.owner||(__pr23Live()?'':'Group Procurement'))",
  "edit record -> no invented owner",
  "esc(r.owner||(__pr23Live()?'':'Group Procurement'))",
)
s = replaceEvery(
  s,
  "<option>Matanho Group Procurement</option>",
  "<option>'+__pr23LetterheadOption()+'</option>",
  "letterhead selects -> the organisation's letterhead",
  "<option>'+__pr23LetterheadOption()+'</option>",
  3,
)
for (const fixture of [
  "<option>Group Consolidated</option><option>Matanho Holdings</option><option>All investees</option>",
  "<option>Group Consolidated</option><option>All investees</option><option>Matanho Holdings</option>",
]) {
  s = replaceUnique(
    s,
    `formField('Entity','<select>${fixture}</select>')`,
    `formField('Entity','<select>'+__pr23ReportEntityOptions('${fixture}')+'</select>')`,
    "report builder entity -> the organisation",
    `__pr23ReportEntityOptions('${fixture}')`,
  )
}
s = replaceUnique(
  s,
  "<select name=\"scope\"><option>Group Consolidated</option>${entities.slice(1)",
  "<select name=\"scope\">${__pr23Live()?'':'<option>Group Consolidated</option>'}${entities.slice(1)",
  "access request scope -> no Group Consolidated in a live session",
  "<select name=\"scope\">${__pr23Live()?'':'<option>Group Consolidated</option>'}",
)

// ---------------------------------------------------------------------------
// 36. No fixture vendor submissions in the live Document Vault
// ---------------------------------------------------------------------------
// Found by the UI census: with no "Vendor Submissions" folder in the organisation's vault, the runtime pushed
// its sample documents into the live register (DOC-00201 "GreenGrid Energy · ITF263 Tax Clearance FY2026").
s = replaceUnique(
  s,
  "function ensureVendorSubmissionsFolderV6(){",
  "function ensureVendorSubmissionsFolderV6(){if(__pr23Live())return;",
  "vendor submissions folder -> no sample documents in a live vault",
  "function ensureVendorSubmissionsFolderV6(){if(__pr23Live())return;",
)

// ---------------------------------------------------------------------------
// 37. Register vendor names no sample internal owner
// ---------------------------------------------------------------------------
// Found by the UI census: "Internal owner" was prefilled "Nyasha Moyo | Group Procurement" for everyone. The input
// has no name, so nothing reads it; a live session leaves it for the person registering the vendor.
s = replaceUnique(
  s,
  "formField('Internal owner','<input value=\"Nyasha Moyo | Group Procurement\">')",
  "formField('Internal owner',__pr23Live()?'<input placeholder=\"Staff member responsible for this vendor\">':'<input value=\"Nyasha Moyo | Group Procurement\">')",
  "register vendor -> no sample internal owner",
  "__pr23Live()?'<input placeholder=\"Staff member responsible for this vendor\">'",
)

// ---------------------------------------------------------------------------
// 38. Contract, purchase order and award previews show their own content
// ---------------------------------------------------------------------------
// Found by the UI census: Preview on a contract, a purchase order, an award report, an approval record and a tax
// clause passed the document itself to previewDocV6, which looks documents up by id. The lookup fell through to
// its blank "Controlled Procurement Document" and the header read "[object Object] | v1.0 | Draft".
s = replaceUnique(
  s,
  "function docByIdV6(id){",
  "function docByIdV6(id){if(id&&typeof id==='object')return {type:'Controlled document',version:'v1.0',status:'Draft',...id};",
  "document preview -> a passed document is shown, not looked up",
  "function docByIdV6(id){if(id&&typeof id==='object')",
)

// ---------------------------------------------------------------------------
// 39-40. A page opened from another page keeps the sub-view it was opened on
// ---------------------------------------------------------------------------
// Found by the UI census: Reports "Manage all templates" set the Report Templates folder and moved to Documents; the
// route change remounted the module and the new runtime opened the vault root. The navigation hook now stashes the
// destination page's sub-view (__pr23StashCarry), and the next runtime takes it before its first render can
// overwrite it and applies it before opening its initial page.
s = replaceUnique(
  s,
  "window.__PROCUREMENT_V23_NAV__ = runtimeOptions.onNavigate || (() => {});",
  "const __pr23Incoming = window.__pr23Carry || null; window.__pr23Carry = null; window.__PROCUREMENT_V23_NAV__ = (page) => { try { __pr23StashCarry(page); } catch (_) { window.__pr23Carry = null; } (runtimeOptions.onNavigate || (() => {}))(page); };",
  "navigation hook -> stash the destination page's sub-view",
  "const __pr23Incoming = window.__pr23Carry || null;",
)
s = replaceUnique(
  s,
  "if(initialPage&&supportedPages.has(initialPage))requestAnimationFrame(()=>navigateV14(initialPage));",
  "if(initialPage&&supportedPages.has(initialPage)){try{__pr23ApplyCarry(initialPage,__pr23Incoming)}catch(_){}requestAnimationFrame(()=>navigateV14(initialPage));}",
  "initial page -> opens on the carried sub-view",
  "__pr23ApplyCarry(initialPage,__pr23Incoming)",
)

// ---------------------------------------------------------------------------
// 41-42. Approval Centre: what waits on me, and every open approval
// ---------------------------------------------------------------------------
// The vendored page rendered the same prompts as cards and again as a table, its Group queue was the same list
// again, and eSignature and Delegations showed sample envelopes and people. A live session renders
// __pr23ApprovalsPageHtml from approvalPromptsV6 and the loaders' approvalGroupV23.
s = replaceUnique(
  s,
  "'evaluationLive','letterhead'];",
  "'evaluationLive','letterhead','approvalGroupV23'];",
  "hydrate() -> every open approval",
  "'letterhead','approvalGroupV23'];",
)
s = replaceUnique(
  s,
  "function approvalsPageV6(){",
  "function approvalsPageV6(){if(__pr23Live())return __pr23ApprovalsPageHtml();",
  "approval centre -> live page",
  "function approvalsPageV6(){if(__pr23Live())return __pr23ApprovalsPageHtml();",
)

// ---------------------------------------------------------------------------
// 44. Tablets and phones open on the icon rail, not the full menu over the page
// ---------------------------------------------------------------------------
// Found by the cycle-eight responsive check: the runtime started with the menu expanded, and at 780px and below
// the expanded menu is a fixed 278px drawer with no backdrop, so every page opened with its heading, head buttons
// and first KPI cards under it. Narrow screens now start collapsed (the 58px icon rail the design has for them);
// every navigation remounts the runtime, so the menu also closes once a page is chosen.
s = replaceUnique(
  s,
  "year:'FY 2026',expanded:true,",
  "year:'FY 2026',expanded:(typeof window==='undefined'||window.innerWidth>780),",
  "narrow screens -> menu starts collapsed",
  "expanded:(typeof window==='undefined'||window.innerWidth>780)",
)

// ---------------------------------------------------------------------------
// 52. Narrow screens are decided by the stylesheet's media query, not innerWidth
// ---------------------------------------------------------------------------
// Found in cycle eight: a requester opening the module on a phone is sent on from the Command Centre to the Approval
// Centre, and that page opened with the full menu over it. Traced on dev: the second runtime read window.innerWidth
// as 784 on a 390px phone — while the route transition runs, content overflows and the mobile layout viewport widens,
// so step 44's check thought it was a tablet. The media query the stylesheet uses measures the device width and does
// not move with overflowing content.
s = replaceUnique(
  s,
  "expanded:(typeof window==='undefined'||window.innerWidth>780),",
  "expanded:(typeof window==='undefined'||!window.matchMedia||!window.matchMedia('(max-width: 780px)').matches),",
  "narrow screens -> decided by the 780px media query",
  "expanded:(typeof window==='undefined'||!window.matchMedia||!window.matchMedia('(max-width: 780px)').matches),",
)

// ---------------------------------------------------------------------------
// 45. Tax-clearance days count from today, not the design's fixed date
// ---------------------------------------------------------------------------
// Found by the cycle-eight screen review: the Vendor Registry called a clearance 35 days from expiry "Valid" while
// its doughnut counted it as expiring. taxRuleV6 counted days from the design's frozen 1 August 2026, so expiry
// status, reminders and the withholding rule ran six weeks stale. A live session counts from now.
s = replaceUnique(
  s,
  "const daysUntilV6 = value => Math.ceil((new Date(value).getTime() - todayV6.getTime()) / 86400000);",
  "const daysUntilV6 = value => Math.ceil((new Date(value).getTime() - (__pr23Live() ? Date.now() : todayV6.getTime())) / 86400000);",
  "tax clearance -> days counted from today",
  "(__pr23Live() ? Date.now() : todayV6.getTime())",
)

// ---------------------------------------------------------------------------
// 46. Vendor Registry: name and contact, not the database id
// ---------------------------------------------------------------------------
// Found by the cycle-eight screen review: the first column printed each vendor's database id (cmtzc7u8s02j…), the
// contact line read "— | email" (vendors carry no country), every Currency cell was a dash (vendors carry none) and
// an unrated vendor read "— / 5".
s = replaceUnique(
  s,
  "table(['Vendor ID','Vendor','Category','BP number','Currency','Tax clearance','Document gaps','Rating','Status','Actions'],rows)",
  "table(__pr23Live()?['Vendor','Contact','Category','BP number','Tax clearance','Document gaps','Rating','Status','Actions']:['Vendor ID','Vendor','Category','BP number','Currency','Tax clearance','Document gaps','Rating','Status','Actions'],rows)",
  "vendor registry -> live columns",
  "table(__pr23Live()?['Vendor','Contact',",
)
s = replaceUnique(
  s,
  "<td><strong class=\"link\">${esc(v.id)}</strong></td><td><strong>${esc(v.name)}</strong><br><span class=\"muted\">${esc(v.country)} | ${esc(v.email)}</span></td>",
  "${__pr23Live()?`<td><strong class=\"link\">${esc(v.name)}</strong></td><td>${esc(v.contact)}<br><span class=\"muted\">${esc([v.email,v.phone].filter(x=>x&&x!=='—').join(' · ')||'—')}</span></td>`:`<td><strong class=\"link\">${esc(v.id)}</strong></td><td><strong>${esc(v.name)}</strong><br><span class=\"muted\">${esc(v.country)} | ${esc(v.email)}</span></td>`}",
  "vendor registry -> name and contact cells",
  "<td>${esc(v.contact)}<br><span class=\"muted\">${esc([v.email,v.phone]",
)
s = replaceUnique(
  s,
  "<td>${esc(v.bp)}</td><td>${esc(v.currency)}</td>",
  "<td>${esc(v.bp)}</td>${__pr23Live()?'':`<td>${esc(v.currency)}</td>`}",
  "vendor registry -> no currency column",
  "<td>${esc(v.bp)}</td>${__pr23Live()?'':",
)
s = replaceUnique(
  s,
  "<td>${v.rating} / 5</td><td>${status(v.status)}</td><td><div class=\"actions\">${smallAction('Open','open-vendor-v6',v.id)}",
  "<td>${__pr23Live()&&(v.rating==null||v.rating==='—')?'<span class=\"muted\">Not rated</span>':`${v.rating} / 5`}</td><td>${status(v.status)}</td><td><div class=\"actions\">${smallAction('Open','open-vendor-v6',v.id)}",
  "vendor registry -> an unrated vendor says so",
  "(v.rating==null||v.rating==='—')?'<span class=\"muted\">Not rated</span>'",
)

// ---------------------------------------------------------------------------
// 47. Contracts & Awards: an award has no contract number
// ---------------------------------------------------------------------------
// Found by the cycle-eight screen review: an award awaiting its contract showed its purchase order number in the
// Contract column, so the register read as four contracts, three of them numbered like orders.
s = replaceUnique(
  s,
  "<td><strong class=\"link\">${esc(c.id)}</strong></td><td><strong>${esc(c.title)}</strong><br><span class=\"muted\">${esc(c.tender)}</span></td>",
  "${__pr23Live()&&c.kind==='award'?`<td><span class=\"muted\">Not yet contracted</span></td><td><strong>${esc(c.title)}</strong><br><span class=\"muted\">Award on ${esc(c.tender)} · ${esc(c.id)}</span></td>`:`<td><strong class=\"link\">${esc(c.id)}</strong></td><td><strong>${esc(c.title)}</strong><br><span class=\"muted\">${esc(c.tender)}</span></td>`}",
  "contracts -> an award shows no contract number",
  "Not yet contracted</span></td><td><strong>${esc(c.title)}",
)

// ---------------------------------------------------------------------------
// 48. Document Vault: a template is not a vendor submission
// ---------------------------------------------------------------------------
// Found by the cycle-eight screen review: the "Request for Quotation" sourcing template was captioned "Vendor-submitted
// original · read-only" — its name matched the vendor-document pattern ("quotation").
s = replaceUnique(
  s,
  "const text = [doc.name,doc.type,doc.folder,doc.owner,doc.source,doc.provenance].filter(Boolean).join(' ');",
  "if (__pr23Live() && /template/i.test(String(doc.type || '') + ' ' + String(doc.folder || ''))) return false; const text = [doc.name,doc.type,doc.folder,doc.owner,doc.source,doc.provenance].filter(Boolean).join(' ');",
  "document vault -> templates are not vendor submissions",
  "/template/i.test(String(doc.type || '') + ' ' + String(doc.folder || ''))",
)

// ---------------------------------------------------------------------------
// 49. Audit & Compliance shows the latest 50 events
// ---------------------------------------------------------------------------
// Found by the cycle-eight screen review: every loaded event (up to 200) was one table, an 8,000-pixel page. The page
// shows the latest 50 and says so; the export carries the rest.
s = replaceUnique(
  s,
  "const rows=(__pr23Live()?(state.auditEventsLive||[]):[",
  "const rows=(__pr23Live()?(state.auditEventsLive||[]).slice(0,50):[",
  "audit -> latest 50 events on the page",
  "(state.auditEventsLive||[]).slice(0,50)",
)
s = replaceUnique(
  s,
  "card('Immutable audit event stream','Every status change records user ID, timestamp, previous value, new value and reason',",
  "card('Immutable audit event stream',__pr23Live()?__pr23AuditStreamNote():'Every status change records user ID, timestamp, previous value, new value and reason',",
  "audit -> the card says how much it shows",
  "__pr23Live()?__pr23AuditStreamNote():",
)

// ---------------------------------------------------------------------------
// 50. Invoices & 3-Way Match works for a role that cannot see RFQs
// ---------------------------------------------------------------------------
// Found by the cycle-eight screen review as Accounts Payable: the page lists match sources from the RFQs, which that
// role cannot read, so it showed an empty "Select a tender" card and no invoice. Such a role picks from its
// purchase orders' sources instead (__pr23MatchSources), and the match workspace resolves them.
s = replaceUnique(
  s,
  "const candidates=state.tenders.filter(t=>t.bids>0 || /Award|Evaluation|opening/i.test(t.stage));",
  "const candidates=(__pr23Live()&&!state.tenders.length)?__pr23MatchSources():state.tenders.filter(t=>t.bids>0 || /Award|Evaluation|opening/i.test(t.stage));",
  "invoice match -> order sources for roles without RFQs",
  "(__pr23Live()&&!state.tenders.length)?__pr23MatchSources():",
)
s = replaceEvery(
  s,
  "const t=state.tenders.find(x=>x.id===id)||state.tenders[0];",
  "const t=state.tenders.find(x=>x.id===id)||(__pr23Live()&&!state.tenders.length?__pr23MatchSources().find(x=>x.id===id):null)||state.tenders[0];",
  "tender workspaces -> resolve an order source",
  "__pr23MatchSources().find(x=>x.id===id)",
  3,
)

// ---------------------------------------------------------------------------
// 51. An approval's supporting documents come from the records
// ---------------------------------------------------------------------------
// Found in cycle eight, reading what a department head sees when reviewing a requisition: "Budget availability and
// funding confirmation" named the sample CFO "Tinashe Chaka" and said the commitment "has been checked against the
// approved annual plan, department budget and current commitments" — no such check exists; the evaluation report
// scored three sample bidders (TechNova, NetShield, CloudAxis); the conflict declaration read "No conflict declared ·
// SSO + MFA" though nobody declared anything; every paper was dated 02 Aug 2026. In a live session the documents are
// built from the records by __pr23SupportDocument, and say plainly what is not recorded.
s = replaceUnique(
  s,
  "function supportDocumentV13(approvalId,kind){",
  "function supportDocumentV13(approvalId,kind){if(__pr23Live()){const __a=approvalBaseV13(approvalId),__d=__pr23SupportDocument(__a,kind),__k=`${approvalId}:${kind}`,__o=state.approvalDocumentOverridesV13[__k];if(__a&&__d)return {id:`${__a.record}-${String(kind).toUpperCase()}`,name:__d.name,type:'Supporting approval document',version:__o?.version||'v1.0',status:__a.status,owner:__a.approver,approvalId:__a.id,storageKey:__k,content:__o?.content||__d.content};}",
  "approval support documents -> built from the records",
  "__d=__pr23SupportDocument(__a,kind)",
)
s = replaceUnique(
  s,
  "date:'02 Aug 2026',approvalId:a.id,",
  "date:__pr23Live()?__pr23Today():'02 Aug 2026',approvalId:a.id,",
  "approval decision paper -> dated today",
  "date:__pr23Live()?__pr23Today():'02 Aug 2026',approvalId:a.id,",
)
// Found by the round-two check on dev: the award decision paper was still the vendored memorandum ("TechNova Solutions",
// three sample bidders, the sample CFO "Signed 01 Aug 2026"), and every paper's footer read "Generated 02 Aug 2026".
s = replaceUnique(
  s,
  "if(type.includes('tender award')){",
  "if(type.includes('tender award')){if(__pr23Live())return __pr23AwardMemo(a,tenderByRecordV13(a.record));",
  "award decision paper -> built from the RFQ and its quotations",
  "if(__pr23Live())return __pr23AwardMemo(a,tenderByRecordV13(a.record));",
)
s = replaceEvery(
  s,
  "<span>Generated 02 Aug 2026</span>",
  "<span>Generated ${__pr23Live()?__pr23Today():'02 Aug 2026'}</span>",
  "document footers -> generated today",
  "<span>Generated ${__pr23Live()?__pr23Today():'02 Aug 2026'}</span>",
  2,
)
for (const [label, key] of [
  ["Budget availability and funding confirmation", "budget"],
  ["Evaluation or technical recommendation", "evaluation"],
  ["Conflict and independence declaration", "conflict"],
]) {
  s = replaceUnique(
    s,
    label,
    `\${__pr23Live()?__PR23_SUPPORT_LABELS.${key}:'${label}'}`,
    `approval support list -> "${label}" labelled for what it holds`,
    `__PR23_SUPPORT_LABELS.${key}:'${label}'`,
  )
}

// ---------------------------------------------------------------------------
// 43. A filed document previews as itself
// ---------------------------------------------------------------------------
// Found by the UI census as Accounts Payable: previewing, downloading, editing or versioning the RFQ pack threw
// "Cannot read properties of undefined (reading 'id')". A document of a recognised type (tender pack, annual plan…)
// was rebuilt by generatedDocumentV11 from its related record, which looks the tender up — and a role that cannot
// see RFQs has none. Even where it did not throw, a document someone uploaded was shown generated text in place of
// the stored file. In a live session a document with a stored file is shown as it was filed.
s = replaceUnique(
  s,
  "    if (!found) return generatedDocumentV11(id);",
  "    if (!found) return generatedDocumentV11(id); if (__pr23Live() && found.fileUrl) return found;",
  "document vault -> a filed document previews as itself",
  "if (__pr23Live() && found.fileUrl) return found;",
)

// ---------------------------------------------------------------------------
// 35. The browser tab carries no build label
// ---------------------------------------------------------------------------
// Found on dev: the tab read "Matanho Procurement & Tender Management - V23" (each layer set its own version).
for (const [version, count] of [["13", 1], ["18", 2], ["20", 1], ["23", 1]]) {
  const title = `Matanho Procurement & Tender Management - V${version}`
  s = replaceEvery(
    s,
    `document.title='${title}';`,
    `document.title=__pr23Title('${title}');`,
    `tab title V${version} -> no build label`,
    `__pr23Title('${title}')`,
    count,
  )
}

// ---------------------------------------------------------------------------
// Scope guard: the bridge may only call what is in its scope
// ---------------------------------------------------------------------------
// The bridge is injected at the runtime's top level. Helpers the vendored layers declare inside their own blocks
// (smallAction, actionV6, actionButton, ...) do not exist there: a bridge page that called smallAction threw
// "smallAction is not defined" and took the Approval Centre down on dev (cycle seven). Syntax checks cannot see it,
// so refuse to write a runtime whose bridge calls a helper declared only inside a layer.
{
  const b0 = s.indexOf("/* BEGIN_PROCUREMENT_LIVE_BRIDGE */")
  const b1 = s.indexOf("/* END_PROCUREMENT_LIVE_BRIDGE */")
  const outside = s.slice(0, b0) + s.slice(b1)
  const declared = (re) => new Set([...outside.matchAll(re)].map((m) => m[1]))
  const topLevel = declared(/^(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/gm)
  const nested = declared(/^[ \t]+(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)\s*(?:=|\()/gm)
  const bridgeCode = s
    .slice(b0, b1)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
  const bridgeOwn = new Set([...bridgeCode.matchAll(/(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))
  const outOfScope = [...new Set([...bridgeCode.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]))].filter(
    (name) => nested.has(name) && !topLevel.has(name) && !bridgeOwn.has(name),
  )
  if (outOfScope.length) {
    console.error(`FATAL: the bridge calls helpers declared only inside a runtime layer (out of its scope): ${outOfScope.join(", ")}`)
    missed += 1
  } else {
    console.log("  scope           bridge calls only what is in its scope")
  }
}

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
