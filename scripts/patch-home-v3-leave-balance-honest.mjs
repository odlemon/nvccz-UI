// Fixes the Employee Services "Request leave" modal showing a fake balance — found during a full
// regression pass (see execution-plan.md): the main services page's summary tile honestly reads
// real backend data (GET /payroll/employee/leave-balances) and correctly shows "Not set up" for a
// user with no configured leave balance, but the "Request leave" modal used a completely separate,
// client-only `state.leaveBalance` field defaulting to a hardcoded literal 18.5 whenever the real
// balance (seeded from that same real data by seedLeaveBalanceCache in home-v3-app.tsx, which
// already correctly no-ops when the real value is null) wasn't available — showing a specific fake
// number as if authoritative, including letting the user "submit" a request that silently deducted
// from that fictional balance client-side only.
//
// Now: the hardcoded 18.5 default becomes null (an honest "unknown", matching what's actually being
// seeded); the modal shows "Not set up" instead of a fake day count when balance is null, and the
// submit handler skips the exceeds-balance check and the balance deduction (can't validate/deduct
// against an unknown limit) rather than silently faking a number. The request still submits and
// goes to manager approval either way, matching how a real HR system would still accept a leave
// request even if the balance sync hasn't run yet.
//
// Run: node scripts/patch-home-v3-leave-balance-honest.mjs
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

patch("leaveBalance default: 18.5 -> null (honest unknown)", frag("leave-balance-default-old"), frag("leave-balance-default-new"))
patch("Request leave modal: show 'Not set up' instead of a fake day count", frag("leave-modal-old"), frag("leave-modal-new"))
patch("leaveRequestForm submit: skip balance check/deduction when unknown", frag("leave-submit-old"), frag("leave-submit-new"))

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
