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
