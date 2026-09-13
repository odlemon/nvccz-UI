/**
 * Accounting V52 runtime patches (live Payables).
 *
 *   node scripts/patch-accounting-v52-runtime.mjs
 *
 * The vendored runtime is auto-extracted (scripts/extract-accounting-v52.mjs). Its live wiring was edited in place;
 * the Payables work is applied here instead, so a re-extraction can be patched again rather than silently losing it.
 * Each step names its anchor and the marker that shows it is already applied; a missed anchor fails the run.
 *
 *   1. scripts/accounting-v52-payables-live.inc.js is injected ahead of the v28 Payables page (refreshed on re-run)
 *   2. the Payables page renders ac52LiveApPage() in a live session
 *   3. the bill, purchase order and RFQ detail pages render ac52LiveApDetail()
 *   4. the v28 click dispatcher sends aplive-* actions to ac52LiveApClick()
 *   5. hydrate keeps the bank accounts a payment can be made from (window.__ac52ApBanks)
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const FILE = path.join(ROOT, "components", "accounting-v52-mock", "matanho-accounting-runtime.js")
const INC = path.join(ROOT, "scripts", "accounting-v52-payables-live.inc.js")

let s = fs.readFileSync(FILE, "utf8")
let applied = 0
let already = 0
let missed = 0

function step(label, anchor, replacement, marker) {
  if (s.includes(marker)) {
    already += 1
    console.log(`  skip (already)  ${label}`)
    return
  }
  const count = s.split(anchor).length - 1
  if (count !== 1) {
    missed += 1
    console.log(`  MISS            ${label} (${count} occurrences, expected 1)`)
    return
  }
  s = s.replace(anchor, () => replacement)
  applied += 1
  console.log(`  patch           ${label}`)
}

// 1. The live block, between markers so a re-run replaces it with the current include (LF only: the CRLF trap).
const BEGIN = "/* BEGIN_AC52_PAYABLES_LIVE */"
const END = "/* END_AC52_PAYABLES_LIVE */"
const block = `${BEGIN}\n${fs.readFileSync(INC, "utf8").replace(/\r\n/g, "\n").trim()}\n${END}\n`
if (s.includes(BEGIN) && s.includes(END)) {
  s = s.slice(0, s.indexOf(BEGIN)) + block + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "")
  console.log("  refresh         live payables block")
} else {
  step("live payables block", "function apPage(){", `${block}function apPage(){`, BEGIN)
}

step(
  "payables page -> live records, queue and actions",
  "function apPage(){const t=V28.apTab,",
  "function apPage(){if(window.__AC52_LIVE__)return ac52LiveApPage();const t=V28.apTab,",
  "if(window.__AC52_LIVE__)return ac52LiveApPage();",
)
step(
  "bill, order and RFQ detail -> live",
  "if(type==='apbill'){",
  "if(window.__AC52_LIVE__&&(type==='apbill'||type==='appo'||type==='aprfq'))return ac52LiveApDetail(type,id);if(type==='apbill'){",
  "return ac52LiveApDetail(type,id);",
)
step(
  "v28 click -> live payables actions",
  "const a=el.dataset.v28,id=el.dataset.id;ev.preventDefault();ev.stopImmediatePropagation();",
  "const a=el.dataset.v28,id=el.dataset.id;ev.preventDefault();ev.stopImmediatePropagation();if(window.__AC52_LIVE__&&a.indexOf('aplive-')===0){ac52LiveApClick(a,id);return}",
  "ac52LiveApClick(a,id);return}",
)
step(
  "hydrate -> payment bank accounts",
  "const source = (payload && payload.data) || payload || {};",
  "const source = (payload && payload.data) || payload || {}; if (Array.isArray(source.apBanks)) window.__ac52ApBanks = source.apBanks;",
  "window.__ac52ApBanks = source.apBanks;",
)

// The prototype's own profile menu names its demo user ("Tariro Moyo") and is appended to <body>, outside the
// .accounting-v52-root its styles are scoped to. Unstyled, it made every page taller than the window: the page scrolled,
// the sidebar slid over the content (it took Payables' Pay bill click), and the demo name showed below the fold. The
// shared topbar carries the signed-in user's own menu, so a live session does not install it.
step(
  "profile menu -> not installed in a live session",
  "function installProfileMenu(){if(document.querySelector('#v5ProfileMenu'))return;",
  "function installProfileMenu(){if(window.__AC52_LIVE__){document.querySelector('#v5ProfileMenu')?.remove();return}if(document.querySelector('#v5ProfileMenu'))return;",
  "function installProfileMenu(){if(window.__AC52_LIVE__)",
)

if (!s.includes("function ac52LiveApClick(")) {
  missed += 1
  console.log("  MISS            live block did not land (ac52LiveApClick not found)")
}

console.log(`\n${applied} applied, ${already} already in place, ${missed} missed`)
if (missed) {
  console.log("One or more patches did not find their anchor. The runtime was NOT written.")
  process.exit(1)
}
fs.writeFileSync(FILE, s)
console.log(`Wrote ${path.relative(ROOT, FILE)}`)
