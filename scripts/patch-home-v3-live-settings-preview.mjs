// Fixes the Settings & personalisation modal's "Live preview" caption — found while completing
// full module coverage (see execution-plan.md). It reads
// "Light Japandi · {saturation}% OLED colour · {density}", but both values were baked into the
// modal's HTML once at the moment it opened and never updated again: the OLED intensity slider
// already had its own input handler (updating a CSS custom property and the small "%" label next
// to the slider itself), and the Interface density select had no handler at all, but neither one
// touched this summary line — dragging the slider from 118% to 125%, or switching density to
// Spacious, left the caption reading the original "118% ... comfortable" no matter what the
// controls actually showed, right up until Save/Cancel closed the modal.
//
// Now both the saturation range and the density select carry an id, and each updates the preview
// text on `input`, reading the OTHER control's current DOM value so either one changing keeps the
// full caption correct regardless of which was touched last.
//
// Run: node scripts/patch-home-v3-live-settings-preview.mjs
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

patch("Interface density select: add id for the preview-text handler to target", frag("settings-density-id-old"), frag("settings-density-id-new"))
patch("Live preview caption: add id so it can be updated in place", frag("settings-preview-id-old"), frag("settings-preview-id-new"))
patch("input handler: keep the Live preview caption in sync with both controls", frag("settings-preview-handler-old"), frag("settings-preview-handler-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
