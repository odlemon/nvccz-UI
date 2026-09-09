/**
 * Performance Management Settings (`/performance/settings`).
 *
 * LIVE RENDERERS — two, stacked, both live:
 *   - `settingsV8()` renders the configuration form (General / Workflow / Notifications /
 *     Rating scales / Financial year / Security). Registered as `settings:settingsV8` in the
 *     v8 page map; every distinctive string on it ("Rating scales", "Financial year / review
 *     calendar", "Privileged access reviews") occurs exactly once in the runtime.
 *   - The `MatanhoDynamicRBAC` v24.5 IIFE prepends the "Dynamic Role-Based Access Control"
 *     studio (`studio()` / `roleRail()` / `permissionGroups()` / `roleSummary()`) above it.
 *     Also unique.
 *   Confirmed against `.perf-dumps/a7/sysadmin__settings.txt`.
 *
 * WHAT WAS FABRICATED
 *   1. Role rail permission counts — HR/M&E Manager 23, Executive 26, Department Manager 17,
 *      Employee 12 — plus "Permissions 23/41" in the role summary and the nine
 *      "n/m enabled" group counters. Every one of them counts a permission set that was
 *      authored for the vendored prototype and belongs to a role that does not exist in this
 *      system. The real roles are the 36 `RoleCode`s in `lib/config/role-permissions.ts`,
 *      mapped to six tiers by `lib/performance-v22-mock/access.ts`; only ONE of them — the
 *      signed-in user's — is resolved and published to the runtime, on
 *      `window.__PERF_ACCESS__`. "HR/M&E Manager has 23 of 41 permissions" was an assertion
 *      about a role nothing can check.
 *   2. "Policy version 24.5.001". No RBAC policy version is stored anywhere. `R.version` is
 *      a per-session counter that starts at 1, and "24.5" is the prototype's own build
 *      label, so the string was a build number dressed as a governance artefact.
 *   3. "Policy synchronized". `savePolicy()` calls `localStorage.setItem`. Nothing is
 *      synchronized with anything; a policy edited here never leaves the browser.
 *   4. The Rating scales table: four scales (5 Point 1-5, 7 Point 1-7, Percentage 0-100%,
 *      Grade A-E) each badged "Active". There is no rating-scale endpoint or table; the rows
 *      were literals asserting four configured, active scales.
 *   5. "Audit on · governed data · 99.2% quality" in the governance context bar —
 *      patched in `access.mjs`, which owns that shared statement (see the note there).
 *
 * WHAT IT SHOWS NOW
 *   Permission counts are real for the one role that has a real grant behind it (the
 *   signed-in user's, from access.ts) and an em dash for the six demo roles.
 *   Policy version reads as a dash; the policy pill says where the policy actually lives.
 *   The Rating scales table carries a single honest empty row instead of four invented ones.
 *
 * STILL WITHOUT A SOURCE (reported, not invented)
 *   - The permission TOGGLES themselves still render the demo policy's on/off state for a
 *     demo role. Blanking 41 switches is a design change, not a value replacement, so they
 *     are left; the counters above them no longer vouch for them.
 *   - The whole configuration form — organization name, timezone, date format, performance
 *     cycle, 2-Level / 3-Level approval, the five notification cadences, the four
 *     financial-year dates, the four security switches — has no backend. There is no
 *     settings endpoint, and "Save changes" is wired to `toast-generic`: it shows a success
 *     toast without issuing a request. Left alone deliberately: a `<select>` whose only
 *     option is an em dash is a broken control, not an honest one. This needs a settings
 *     read/write endpoint before it can be wired.
 *   - "Roles — N configured" is left as-is: it is the row count of the list directly beneath
 *     it, so it describes what is on screen rather than asserting a system fact.
 */

// ---------------------------------------------------------------------------------------
// 1. Which roles actually have a permission grant behind them.
//
//    Injected next to `permCount` so it sits in the RBAC IIFE's own scope, where `roleRail`,
//    `roleSummary` and `permissionGroups` can all reach it.
// ---------------------------------------------------------------------------------------
const REAL_ROLE_FIND =
  "  const permCount=(role)=>rolePerms[role]?.has('*')?permissionKeys.length:explicitPerms(role).size;"

const REAL_ROLE_REPL =
  "  /* patched:settings-rbac-real-role */\n" +
  "  // Exactly one role in this studio has a real grant behind it: the signed-in user's,\n" +
  "  // resolved from their actual roleCode by lib/performance-v22-mock/access.ts and published\n" +
  "  // on window.__PERF_ACCESS__ (the `real-role` patch registers it in rolePerms as well).\n" +
  "  // CEO / Executive / HR/M&E Manager / Department Manager / Employee / SysAdmin are the\n" +
  "  // vendored demo catalogue: no user holds them and no endpoint can confirm what they may\n" +
  "  // do, so counts derived from their permission sets are dashes rather than numbers.\n" +
  "  const __rbacRealRole=()=>{try{return (window.__PERF_ACCESS__&&window.__PERF_ACCESS__.label)||null}catch(_){return null}};\n" +
  "  const __rbacIsReal=(role)=>{const r=__rbacRealRole();return !!r&&role===r};\n" +
  "  const permCount=(role)=>rolePerms[role]?.has('*')?permissionKeys.length:explicitPerms(role).size;"

// ---------------------------------------------------------------------------------------
// 2. Role rail count: 23 / 26 / 17 / 12 / "All".
// ---------------------------------------------------------------------------------------
const RAIL_FIND = "<span class=\"v245-role-count\">${isFull(role)?'All':permCount(role)}</span>"

const RAIL_REPL =
  "<span class=\"v245-role-count\">${/* patched:settings-rbac-rail-count */" +
  "__rbacIsReal(role)?(isFull(role)?'All':permCount(role)):__perfDash()}</span>"

// ---------------------------------------------------------------------------------------
// 3. Role summary: "Permissions 23/41" and "Policy version 24.5.001".
// ---------------------------------------------------------------------------------------
const SUMMARY_PERMS_FIND =
  "['Permissions',isFull(role)?'All '+permissionKeys.length:set.size+'/'+permissionKeys.length],"

const SUMMARY_PERMS_REPL =
  "['Permissions',/* patched:settings-rbac-perm-summary */" +
  "__rbacIsReal(role)?(isFull(role)?'All '+permissionKeys.length:set.size+'/'+permissionKeys.length):__perfDash()],"

const POLICY_VERSION_FIND = "['Policy version',`24.5.${String(R.version).padStart(3,'0')}`]"

const POLICY_VERSION_REPL =
  "['Policy version',/* patched:settings-rbac-policy-version */__perfDash()]"

// ---------------------------------------------------------------------------------------
// 4. Group counters: "1/4 enabled", "3/4 enabled", "5/9 enabled" …
//
//    The denominator stays — it is the number of permission rows rendered immediately below,
//    which is a fact about the page. Only the numerator claimed a grant.
// ---------------------------------------------------------------------------------------
const GROUP_COUNT_FIND = "<span>${items.filter(x=>set.has(x[1])).length}/${items.length} enabled</span>"

const GROUP_COUNT_REPL =
  "<span>${/* patched:settings-rbac-group-count */" +
  "__rbacIsReal(role)?items.filter(x=>set.has(x[1])).length+'/'+items.length+' enabled':__perfDash()+'/'+items.length+' enabled'}</span>"

// ---------------------------------------------------------------------------------------
// 5. Policy state pill.
// ---------------------------------------------------------------------------------------
const POLICY_STATE_FIND = "${R.dirty?'Unsaved policy changes':'Policy synchronized'}"

const POLICY_STATE_REPL =
  "${/* patched:settings-rbac-policy-state */" +
  "R.dirty?'Unsaved policy changes':'Saved in this browser only'}"

// ---------------------------------------------------------------------------------------
// 6. Rating scales table.
//
//    Same shape as `__perfEmptyRow()` produces elsewhere, written out here because there is
//    no `ratingScales` scope to pass it — the distinction it draws between "none yet" and
//    "could not load" needs an endpoint, and there isn't one.
// ---------------------------------------------------------------------------------------
const SCALES_FIND =
  "<tbody><tr><td>5 Point Scale</td><td>1–5</td><td>${badge('Active')}</td></tr>" +
  "<tr><td>7 Point Scale</td><td>1–7</td><td>${badge('Active')}</td></tr>" +
  "<tr><td>Percentage</td><td>0–100%</td><td>${badge('Active')}</td></tr>" +
  "<tr><td>Grade Scale</td><td>A–E</td><td>${badge('Active')}</td></tr></tbody>"

const SCALES_REPL =
  "<tbody>${/* patched:settings-rating-scales */" +
  "'<tr><td colspan=\"3\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">" +
  "Rating scales are not stored by the backend yet, so none can be listed.</td></tr>'}</tbody>"

export default [
  { label: "settings-rbac-real-role", find: REAL_ROLE_FIND, repl: REAL_ROLE_REPL },
  { label: "settings-rbac-rail-count", find: RAIL_FIND, repl: RAIL_REPL },
  { label: "settings-rbac-perm-summary", find: SUMMARY_PERMS_FIND, repl: SUMMARY_PERMS_REPL },
  { label: "settings-rbac-policy-version", find: POLICY_VERSION_FIND, repl: POLICY_VERSION_REPL },
  { label: "settings-rbac-group-count", find: GROUP_COUNT_FIND, repl: GROUP_COUNT_REPL },
  { label: "settings-rbac-policy-state", find: POLICY_STATE_FIND, repl: POLICY_STATE_REPL },
  { label: "settings-rating-scales", find: SCALES_FIND, repl: SCALES_REPL },
]
