// Closes the two known gaps flagged during the full regression pass (see execution-plan.md /
// regression-findings-round2.md): the "Request leave" modal's disabled Manager field hardcoded
// "Tawanda Kasere", and every place a newly-submitted request/document is optimistically inserted
// into client state hardcoded a specific fake person's name as the owner and a stale literal past
// date as the submitted/updated date — regardless of who actually submitted it or when.
//
// There is no manager/reporting-line field anywhere on the backend User model (confirmed in an
// earlier phase of this same pass), so "Manager" now honestly reads "Not set" instead of a
// specific invented name — same honesty pattern already used for the leave-balance fix elsewhere
// in this module (an unknown real value becomes a generic "not set" label, never a plausible-
// looking fake one). The optimistic request rows (service requests, leave requests, app-access
// requests, profile documents) drop the fake owner name in favour of an honest "Pending
// assignment" (there's no real assignee yet — the real one, once the backend actually assigns the
// request, only appears after a reload, per actions.ts's createServiceRequest doc comment on why
// this runtime has no way to hydrate an optimistic row in place) and replace the hardcoded stale
// date literal with the real current date, formatted the same way ('en-GB', day/short-month/year)
// as every other date already displayed in this file.
//
// Run: node scripts/patch-home-v3-honest-request-owner-and-date.mjs
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

patch("Request leave modal: Manager field 'Tawanda Kasere' -> honest 'Not set'", frag("leave-manager-field-old"), frag("leave-manager-field-new"))
patch("leaveRequestForm submit: fake owner/stale date -> 'Pending assignment' + today", frag("leave-submit-owner-date-old"), frag("leave-submit-owner-date-new"))
patch("appAccessForm + serviceRequestForm submit: fake owner/stale date -> honest values", frag("service-submit-owner-date-old"), frag("service-submit-owner-date-new"))
patch("profileDocumentForm submit: stale hardcoded 'updated' date -> today", frag("profile-document-date-old"), frag("profile-document-date-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
