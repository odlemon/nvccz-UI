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
  "'quotationNormalisationsV19','complianceReminderLogV7'];",
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
