// Fixes two bugs found while testing the AI panel's previously-untested Briefs/Search/Draft
// tabs (Search was already real and working; see regression-findings-round2.md).
//
// 1. Briefs tab: the "Portfolio review" and "Weekly execution summary" cards showed hardcoded
//    literal metadata ("14:00 · Harare Boardroom", "7 active tasks · 3 projects") regardless of
//    what was actually on the calendar or in My Work — even though both real data sources
//    (D.schedule, state.workTasks/workProjects) were already available in this same file. Now
//    computed for real: the Portfolio review card looks for an actual calendar entry whose title
//    mentions "portfolio" and shows its real time/location, falling back to an honest "No
//    portfolio review scheduled" rather than mislabeling an unrelated meeting; the Weekly
//    execution summary card shows the real open-task and project counts.
//
// 2. Draft tab's "Regenerate" button was mislabeled: clicking it navigated away to a brand new
//    Ask-tab conversation with a hardcoded generic prompt ("Draft a concise executive update for
//    my current projects") that ignored whatever draft type/audience/subject the user had
//    actually selected, and never wrote anything back into the draft textarea — so "regenerating"
//    a draft actually abandoned it. Now it builds a real prompt from the current form values,
//    marks a pending state (button disabled + "Generating…", textarea disabled with a matching
//    placeholder) while staying on the Draft tab, and receiveAssistantReply writes the real reply
//    straight into state.aiDraft.body when a draft regeneration is in flight instead of pushing
//    it into the chat thread.
//
// Run: node scripts/patch-home-v3-ai-briefs-and-draft.mjs
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

patch("state init: add aiDraftPending transient flag", frag("ai-draft-pending-init-old"), frag("ai-draft-pending-init-new"))
patch("Briefs tab: real calendar/task/project data instead of hardcoded meta", frag("ai-briefs-real-meta-old"), frag("ai-briefs-real-meta-new"))
patch("Draft tab: Regenerate button + textarea reflect a real pending state", frag("ai-draft-panel-old"), frag("ai-draft-panel-new"))
patch("Add the regenerate-draft click handler", frag("ai-regenerate-draft-handler-old"), frag("ai-regenerate-draft-handler-new"))
patch("receiveAssistantReply: write into the draft instead of the chat thread when pending", frag("ai-receive-reply-draft-branch-old"), frag("ai-receive-reply-draft-branch-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
