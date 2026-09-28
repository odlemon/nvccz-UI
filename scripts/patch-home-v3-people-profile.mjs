// Patches components/home-v3-mock/matanho-runtime.js for Phase 7 (People + My Profile).
// Run: node scripts/patch-home-v3-people-profile.mjs
//
// CRLF trap: the runtime file is 100% CRLF. Normalize to LF for matching, patch, restore CRLF on
// write. Every replace is FUNCTION-FORM (`.replace(old, () => new)`) — string-form silently
// corrupts on any `$`-prefixed sequence in the replacement.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, "..", "components", "home-v3-mock", "matanho-runtime.js")
const fragDir = join(__dirname, "_patch-fragments")

const raw = readFileSync(target, "utf8")
const isCrlf = raw.includes("\r\n")
let src = raw.replace(/\r\n/g, "\n")

let missed = []
function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    missed.push(label)
    return
  }
  src = src.replace(oldStr, () => newStr)
}
function frag(name) {
  return readFileSync(join(fragDir, name), "utf8").replace(/\r\n/g, "\n")
}
function patchFromFragments(label, oldFragName, newFragName) {
  patch(label, frag(oldFragName), frag(newFragName))
}

// --- Whole-function rewrites --------------------------------------------------------------------
// peopleView/personDetail were almost entirely fabricated: hardcoded stat tiles (128 employees,
// 32 "available now", 4 locations, 46 skills), fake team/location filters, and per-row fields with
// no real source (live status dot, expertise chips, a performance "score" per colleague). Rebuilt
// on D.directory (GET /users — id/name/email/department/role, all real).
patchFromFragments("people-view", "people-view-old.fragment", "people-view-new.fragment")
patchFromFragments("person-detail", "person-detail-old.fragment", "person-detail-new.fragment")
// profileView: Overview's "Recent contribution" (fake 6-month chart), "Current focus" (3
// hardcoded fake projects) and "This week" (fake per-day availability dots) are replaced with
// real Performance/My Work/Calendar data already loaded elsewhere this build. Skills/Recognition
// dropped per the plan's own default (build only if confirmed wanted). Experience (fake career
// history + fake education + fake credentials), Preferences (zero persistence path — "Edit
// preferences" only ever wrote to local state) and Documents (fake file list) tabs are dropped
// outright — no real model backs any of the three, and "profile tabs live... as found necessary"
// was the plan's own hedge for exactly this. Goals tab reuses the same D.performanceOverview
// Phase 5 already verified live, instead of four hardcoded fake goals.
patchFromFragments("profile-view", "profile-view-FULL-old.fragment", "profile-view-FULL-new.fragment")

// --- Edit-profile: was entirely local-state (never called the API — "Save changes" just did
// state.profile={...};saveState() and a fake success toast), and its Role/Location/Bio fields
// have no safe self-service write path anyway (role/department are privilege-bearing on the real
// User model — see PUT /users/:id; bio has no backing field at all). Narrowed to the three fields
// that are genuinely self-editable: first name, last name, email. ------------------------------
patch(
  "edit-profile modal fields",
  `if(action==='edit-profile'){modal('Edit profile',\`<form id="profileForm"><div class="form-grid"><div class="form-field"><label>Name</label><input class="input-control" name="name" value="\${esc(state.profile.name)}"/></div><div class="form-field"><label>Role</label><input class="input-control" name="role" value="\${esc(state.profile.role)}"/></div><div class="form-field"><label>Email</label><input class="input-control" name="email" value="\${esc(state.profile.email)}"/></div><div class="form-field"><label>Location</label><input class="input-control" name="location" value="\${esc(state.profile.location)}"/></div><div class="form-field full"><label>Bio</label><textarea class="textarea-control" name="bio">\${esc(state.profile.bio)}</textarea></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save changes</button></div></form>\`);return}`,
  `if(action==='edit-profile'){modal('Edit profile',\`<form id="profileForm"><div class="form-grid"><div class="form-field"><label>First name</label><input class="input-control" name="firstName" value="\${esc(D.user.firstName)}" required/></div><div class="form-field"><label>Last name</label><input class="input-control" name="lastName" value="\${esc(D.user.lastName)}" required/></div><div class="form-field full"><label>Email</label><input class="input-control" type="email" name="email" value="\${esc(D.user.email)}" required/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save changes</button></div></form>\`);return}`,
)
patch(
  "profileForm submit -> real emit",
  `if(e.target.id==='profileForm'){const f=new FormData(e.target);state.profile={name:f.get('name'),role:f.get('role'),email:f.get('email'),location:f.get('location'),bio:f.get('bio')};saveState();closePortal();render();toast('Profile updated.','success');return}`,
  `if(e.target.id==='profileForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('profile.updated',{firstName:f.get('firstName'),lastName:f.get('lastName'),email:f.get('email')});return}`,
)

// --- Directory search: existed only as a DOM-hiding trick (no state, so it couldn't coordinate
// with a department filter). Made state-driven, and added the department filter's own handler
// (new — the old page had a "team"/"location" pair of fake, unwired <select> elements instead).
patch(
  "peopleSearch/peopleDept -> real state-driven filtering",
  `if(e.target.id==='peopleSearch'){const q=e.target.value.toLowerCase();document.querySelectorAll('.person-row').forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'grid':'none'});return}`,
  `if(e.target.id==='peopleSearch'){state.peopleSearch=e.target.value;window.clearTimeout(window.__peopleSearchTimer);window.__peopleSearchTimer=setTimeout(render,180);return} if(e.target.id==='peopleDept'){state.peopleDept=e.target.value;render();return}`,
)

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
