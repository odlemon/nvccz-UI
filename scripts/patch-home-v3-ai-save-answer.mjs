// Fixes the AI panel's "Saved" tab being permanently unreachable and, if ever reached, silently
// self-destructive — found while completing full module coverage (see execution-plan.md).
//
// aiAnswerFor(), which builds the rich-card message shape ({title, summary, highlights, decisions,
// actions}), is defined but never called anywhere in the file — every real reply from the backend
// renders via the plain-bubble branch of aiMessageView() instead (the fix from an earlier pass in
// this same regression round). The ONLY "Save answer" button and the ONLY ai-save-latest /
// ai-answer-menu triggers lived exclusively in the now-dead rich-card branch, so there was no way
// to ever populate state.aiSaved from a real conversation.
//
// Even if there had been a trigger, the save handler deduped saved items by `.title`, which is
// always undefined on real replies — `undefined!==undefined` is false, so saving a second real
// answer would have filtered out every previously-saved real answer, not just an actual duplicate.
// And the Saved tab's "Open" action rebuilt the question bubble from `item.prompt||item.title`,
// both undefined for real messages, producing an empty question with no way to tell what was asked.
//
// Now: a "Save answer" button is added to the real (plain-bubble) reply view, tagged with the
// message's own index so the handler saves the exact answer that was clicked rather than always
// "the latest assistant message" (the rich-card button gets the same index tagging for
// consistency, even though that branch is currently unreachable). The dedupe key changes from
// `.title` to `.createdAt` (always present, unique per message, and preserved when a saved answer
// is reopened) so saving a second real answer no longer erases prior saves, and re-saving the same
// answer refreshes it in place instead of duplicating it. The preceding user prompt is captured as
// `savedPrompt` at save time and used (falling back to the legacy `.prompt`/`.title` fields for any
// old rich-card-era saved data already in a user's localStorage) both as the Saved-tab list heading
// and to correctly rebuild the question bubble when reopening a saved answer. The Saved-tab list
// body now prefers the real `.text` field over the always-absent `.summary`/`.prompt`.
//
// Run: node scripts/patch-home-v3-ai-save-answer.mjs
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

patch("plain-bubble reply: add a real 'Save answer' button, tagged with its own index", frag("ai-plain-bubble-old"), frag("ai-plain-bubble-new"))
patch("rich-card reply (dead code): tag its 'Save answer' button with its own index too", frag("ai-richcard-save-btn-old"), frag("ai-richcard-save-btn-new"))
patch("ai-save-latest handler: save the clicked message by index, dedupe by createdAt not title", frag("ai-save-handler-old"), frag("ai-save-handler-new"))
patch("Saved-tab 'Open': rebuild the question from savedPrompt, not the always-undefined prompt/title", frag("ai-saved-open-old"), frag("ai-saved-open-new"))
patch("Saved-tab list: show the real question/answer instead of a generic 'Saved answer' placeholder", frag("ai-saved-list-old"), frag("ai-saved-list-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
