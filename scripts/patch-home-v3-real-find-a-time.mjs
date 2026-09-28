// Fixes Calendar's "Find a time" button — found while completing full module coverage (see
// execution-plan.md): it was a pure decoration, always showing the same canned toast ("Three
// shared time windows found for this week") regardless of what was actually on the calendar, with
// zero computation behind it.
//
// A genuine multi-person free/busy check isn't buildable here (no other users' calendars are
// loaded), so this is scoped honestly to the one thing that IS real: the signed-in user's own
// combined calendar (My calendar + Company events, the same combinedWeekEvents() already powering
// the week grid). It finds real >=30-minute gaps in 08:00-17:00 each weekday and reports the real
// count and the next one, or an honest "no open time" message when the week is genuinely full.
//
// Run: node scripts/patch-home-v3-real-find-a-time.mjs
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

patch("find-time -> real gap-finding over the user's own combined calendar", frag("find-time-old"), frag("find-time-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
