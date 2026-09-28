// Fixes the Performance page's Scorecard/Goals tabs — found during a full regression pass (see
// execution-plan.md): despite Phase 5 marking Performance "done, verified live", that phase only
// ever wired the Overview tab (and the small Performance widgets on My Work / My Profile) to real
// data. The Performance page's own Scorecard/Goals/Feedback/Development tabs were still 100%
// hardcoded mock content — literal fake goals ("Zambia renewable energy mandate"), a literal fake
// person name ("Fadzai") baked into copy text even though it's rendered for whichever real user is
// signed in, fabricated quotes attributed to real directory people on the Feedback tab, a literal
// "Scorecard synced 4 min ago" timestamp that was never real. This produced a visible contradiction:
// Overview honestly said "No active performance contract found for this employee in the selected
// period" while Scorecard/Goals showed a rich, fully-populated fake scorecard for the same user.
//
// Scorecard and Goals now reuse D.performanceOverview — the exact same real data
// (GET /performance/scorecards/user, wired since Phase 5) Overview already correctly uses,
// including its honest "no active contract" state when the real endpoint 404s for a user with no
// active PerformanceContract. The rich fake "balanced scorecard matrix" (perspectives/KPIs/targets)
// has no real backing data anywhere in this build and is dropped rather than faked.
//
// Feedback and Development tabs are also removed from the visible tab list for the same reason —
// showing fabricated content (fake quotes attributed to real people, on Feedback; entirely invented
// goals/capability-matrix, on Development) is worse than showing nothing, even where a real backend
// model exists to build on later. Confirmed via backend audit: Development has NO real backing
// model anywhere (genuinely greenfield) and would need new schema; Feedback DOES have a real,
// already-wired backend (PerformanceReview/PerformanceReviewCycle/PerformanceReviewFeedback models,
// full CRUD under /api/performance-reviews) that a future pass can wire for real — logged as a
// follow-up rather than attempted here without first understanding that data model properly.
//
// Run: node scripts/patch-home-v3-performance-real-data.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, "..", "components", "home-v3-mock", "matanho-runtime.js")
const fragDir = join(__dirname, "_patch-fragments")

const raw = readFileSync(target, "utf8")
const isCrlf = raw.includes("\r\n")
let src = raw.replace(/\r\n/g, "\n")

function frag(name) {
  return readFileSync(join(fragDir, `${name}.fragment`), "utf8").replace(/\r\n/g, "\n").replace(/\n$/, "")
}

let missed = []
function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    missed.push(label)
    return
  }
  src = src.replace(oldStr, () => newStr)
}

patch("performanceScorecard() -> real D.performanceOverview data", frag("performance-scorecard-old"), frag("performance-scorecard-new"))
patch("performanceGoals() -> real D.performanceOverview.goals", frag("performance-goals-old"), frag("performance-goals-new"))
patch("performanceView() -> drop Feedback/Development tabs + fake sync timestamp", frag("performance-view-old"), frag("performance-view-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
