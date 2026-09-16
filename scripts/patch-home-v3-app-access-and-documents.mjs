// Makes "Request app access" and "Add document" actually reachable and real — found while
// closing out the last open items from the full regression pass (see
// regression-findings-round2.md). Both existed only as dead handler code: no button anywhere in
// the rendered UI ever opened either modal (`data-request-app` and
// `data-action="upload-profile-document"` were never set on any element, only read by their own
// handlers), and even if reached, both only updated client-only state with no backend call at
// all — unlike every other request/upload flow in this module.
//
// A real AppAccessRequest / ProfileDocument backend was added in the sibling backend repo (see
// its own commit) with a RemoteUploadService-backed upload for documents, matching the pattern
// HomeWallpaperController already uses. This patch:
//   - Adds a "Documents" tab to My Profile, rendering state.profileDocuments as a real list with
//     an "Add document" button (the existing upload-profile-document modal/handler, now reachable).
//   - Adds "Request access" + "My requests" buttons to the Apps page header, opening a
//     simplified request-app-access form (free-text app name instead of requiring a pre-existing
//     state.apps entry — there's no "browse apps I don't have" catalog to hang per-app buttons
//     off) and the already-built (also previously unreachable) view-access-requests drawer.
//   - Both submit handlers now emit the matanho:* event that reaches the new backend actions
//     (app.access.requested, profile.document.uploaded) instead of only touching local state.
//   - The file input becomes `required`, matching that a real upload needs a real file.
//
// Run: node scripts/patch-home-v3-app-access-and-documents.mjs
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

patch("My Profile tabs: add 'Documents'", frag("profile-tabs-array-old"), frag("profile-tabs-array-new"))
patch("My Profile: render a real Documents tab", frag("profile-documents-tab-old"), frag("profile-documents-tab-new"))
patch("Apps page: add 'My requests' + 'Request access' header buttons", frag("apps-view-header-old"), frag("apps-view-header-new"))
patch("Upload-document modal: file input becomes required", frag("upload-doc-modal-old"), frag("upload-doc-modal-new"))
patch("Add the request-app-access modal-open handler", frag("request-app-access-handler-old"), frag("request-app-access-handler-new"))
patch("appAccessForm submit: emit app.access.requested to the real backend", frag("app-access-submit-old"), frag("app-access-submit-new"))
patch("profileDocumentForm submit: require a file, emit profile.document.uploaded", frag("profile-doc-submit-old"), frag("profile-doc-submit-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
