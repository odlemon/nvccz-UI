// Patches components/home-v3-mock/matanho-runtime.js to give the Matanho AI panel real
// per-source context retrieval (Phase 9, execution-plan.md). Run: node scripts/patch-home-v3-ai-rag.mjs
//
// CRLF trap: the runtime file is 100% CRLF. Normalize to LF for matching, patch, restore CRLF on
// write. Every replace is FUNCTION-FORM (`.replace(old, () => new)`) — string-form silently
// corrupts on any `$`-prefixed sequence in the replacement. Fragment files (scripts/_patch-
// fragments/*.fragment) hold every block that itself contains backticks/${} so nothing here
// hand-escapes a nested template literal.
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

// --- New aiSearchQuery state field, alongside the sibling aiScope/aiContextSources it's used
// with. ------------------------------------------------------------------------------------------
patch("add aiSearchQuery to initial state", frag("ai-context-sources-default-old"), frag("ai-context-sources-default-new"))
patch(
  "persist aiSearchQuery in saveState()",
  "aiContextSources:state.aiContextSources,",
  "aiContextSources:state.aiContextSources,aiSearchQuery:state.aiSearchQuery,"
)

// --- aiRespond(): now sends the composer's scope selector and the sidebar's per-source toggles
// alongside the prompt, so the backend can actually honour them (previously both existed in the
// UI but had zero effect on the real LLM call added in Phase 7b). ------------------------------
patch("aiRespond -> send scope+sources", frag("ai-respond-old"), frag("ai-respond-new"))

// --- receiveAssistantReply(): now accepts which real sources the backend actually used and
// attaches them to the message, so the reply can show real provenance chips instead of nothing.
patch("receiveAssistantReply -> accept sourcesUsed", frag("receive-assistant-reply-old"), frag("receive-assistant-reply-new"))

// --- aiMessageView(): a real reply never sets message.title (that only happened for the old
// canned aiAnswerFor() output, which aiRespond() no longer calls), so it always rendered via this
// plain-bubble branch — which never showed the message.sources the previous patch now attaches.
// Reuses the already-styled .ai-source-chips-v16 class the OTHER (now-dead) branch used. --------
patch("aiMessageView plain bubble -> show source chips", frag("ai-message-bubble-old"), frag("ai-message-bubble-new"))

// --- Search tab: was 5 fully hardcoded fake results (a fake .pptx, a fake person, a fake
// discussion...) that a keystroke handler merely hid/showed by substring match — never a real
// search of anything. Replaced with a real filter over the same real arrays (state.workTasks,
// D.schedule, D.directory, D.forumPosts, D.newsPosts) already loaded elsewhere in this build,
// gated by the same per-source toggles the Ask flow now honours. Query only re-runs on submit
// (state.aiSearchQuery), not per-keystroke — the old per-keystroke handler operated on now-stale
// DOM rows and is removed outright rather than adapted. -----------------------------------------
patch("aiSearchPanel -> real search over real data", frag("ai-search-panel-old"), frag("ai-search-panel-new"))
patch("remove now-defunct per-keystroke row-hider", frag("ai-search-keystroke-handler-old"), frag("ai-search-keystroke-handler-new"))
patch("aiSearchForm submit -> real query state", frag("ai-search-submit-handler-old"), frag("ai-search-submit-handler-new"))

// --- Draft tab: previously pre-filled with a specific fake business paragraph ("Q3 delivery
// remains on track...") shown as if already drafted. The textarea already has a real placeholder
// attribute for the empty case, so this only needed removing the fake default value. ------------
patch("Draft tab -> drop fake pre-filled paragraph", frag("ai-draft-default-body-old"), frag("ai-draft-default-body-new"))

// --- "Today's context" (fake "Portfolio review 14:00 Harare Boardroom" / "Quarterly LP report...
// due today" / "Two decisions need attention") and "Related people" (D.people.slice(0,3) — the
// unused static fixture, not the real directory injected since Phase 7) in the AI panel's own
// sidebar. Both sit right next to the now-real Active Context toggles, so leaving them fake would
// visibly undermine the rest of this phase. New todaysContextSignals() draws only from data
// already loaded elsewhere (today's schedule, open priorities, performance goals below 70%) with
// an honest empty state when none apply, rather than always forcing exactly 3 items. ------------
patch("insert todaysContextSignals() helper", "function aiView() {", frag("todays-context-signals-new") + "\n  function aiView() {")
patch("AI panel aside -> real Today's context + Related people", frag("ai-context-aside-old"), frag("ai-context-aside-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
