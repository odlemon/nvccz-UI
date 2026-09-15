// Wires the Performance page's Feedback tab to real data — closing out the last of the three
// items flagged for a follow-up decision at the end of round 2 (see
// regression-findings-round2.md). An earlier pass in this same regression round dropped the tab
// entirely (commit 175ffaa) rather than leave it showing invented "4.6 out of 5, 18 responses"
// scores and fabricated quotes, since at the time it wasn't confirmed whether a real backend
// existed. It does: PerformanceReview / PerformanceReviewFeedback are full Prisma models with a
// working GET /api/performance-reviews?revieweeId=<id> (the sibling backend repo — no frontend
// changes were needed there, the endpoint already existed and already embeds up to 3
// reviewFeedback entries per review, confirmed against the backend service's own Prisma include).
//
// This is deliberately scoped to a READ-ONLY summary of the signed-in user's own most recent
// review — title, period, status, rating, overall score, the four narrative feedback fields
// (manager/self/peer/stakeholder), strengths, areas for improvement, and individual reviewer
// comments — not the full multi-stage editing/finalization workflow that endpoint also supports,
// which is a separate, much larger admin/HR-facing surface. Honest empty state ("No performance
// review has been opened for you yet.") when the signed-in user has none, matching the
// available/blockedReason pattern already used by the neighbouring Scorecard/Goals tabs.
//
// Run: node scripts/patch-home-v3-real-performance-feedback.mjs
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

patch("Performance page: add 'Feedback' tab back to the tab list and body switch", frag("performance-tabs-feedback-old"), frag("performance-tabs-feedback-new"))
patch("performanceFeedback(): real D.performanceFeedback instead of invented scores/quotes", frag("performance-feedback-body-old"), frag("performance-feedback-body-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
