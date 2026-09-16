// Patches components/home-v3-mock/matanho-runtime.js for Phase 8 (Settings, Help & Support,
// Apps grid). See execution-plan.md's Phase 8 section.
// Run: node scripts/patch-home-v3-phase8.mjs
//
// CRLF trap: the runtime file is 100% CRLF. Normalize to LF for matching, patch, restore CRLF on
// write. Every replace is FUNCTION-FORM (`.replace(old, () => new)`) — string-form silently
// corrupts on any `$`-prefixed sequence in the replacement. Fragment files (scripts/_patch-
// fragments/*.fragment) hold the huge old/new blocks verbatim so nothing here hand-escapes a
// nested template literal.
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

// --- appsView(): the old version was an elaborate, fully-fabricated app marketplace (pinned
// apps, "recently used" with hardcoded relative timestamps, an access-request approve/pending
// workflow, category filters, a marketplace callout) — none of it backed by any real model, and
// the real permission system (hasModuleAccess) is a binary yes/no per module, not an approval
// queue, so "request access" made no sense to build for real. Replaced with a plain grid of the
// real, permission-filtered module list (home-v3-app.tsx now injects data.apps from
// getSwitcherModules() + hasModuleAccess). Dropping fake sections rather than half-wiring them
// matches the Phase 7 profile-tabs precedent. -----------------------------------------------
patch("appsView() -> real permission-filtered grid", frag("apps-view-old"), frag("apps-view-new"))

// --- data-launch-app: was a fake toast regardless of target ("opened in a connected
// workspace"). Now actually opens the module — new tab per the cross-module-links standard,
// since leaving the home module for another one is exactly that kind of side trip. -------------
patch("data-launch-app -> real window.open", frag("apps-launch-handler-old"), frag("apps-launch-handler-new"))

// --- Help & Support modal: dropped the dead search box (no `id`, nothing ever read it) and the
// "How-to guides" card (no `data-service`/`data-action`, dead click; no FAQ/help-article concept
// exists anywhere in the backend). "IT support" already routes through the real Employee
// Services service-request flow (Phase 3) and is kept as-is. ----------------------------------
patch("Help & Support modal -> drop dead search + guides card", frag("help-support-modal-old"), frag("help-support-modal-new"))

// --- Settings form submit: was local-state-only (saveState() to localStorage + a toast) with no
// emitIntegrationEvent call, unlike every sibling preference handler (theme/wallpaper/rotation).
// Now fires preferences.settings.updated so home-v3-app.tsx's new listener can PUT the settings
// blob to /api/homepage/preferences for real. ---------------------------------------------------
patch("settingsForm submit -> emit preferences.settings.updated", frag("settings-form-submit-old"), frag("settings-form-submit-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
