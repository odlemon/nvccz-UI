# Portfolio Settings (`/portfolio/settings`) — QA Checklist, Gap Report & Fixes

**Date:** 6 September 2026 · **Scope:** all 7 tabs · **Concurrent work:** taking over/continuing in the shared tree per instruction

## Architecture note (read first — shapes every finding below)

`/portfolio/settings` is not a React page. It's one JS function (`renderSettings`, the *last* of two reassignments in `matanho-portfolio-runtime.js` — confirmed this is the active one) that switches on `state.settingsTab` and renders one of 7 sub-renderers: `v11Render{Workspace,Roles,Security,Integrations,Notifications,Data,Api}Settings`.

**The 7 "roles" (CEO, Administrator, CIO, Investment Analyst, Monitoring & Evaluation, Legal, Accounting) are demo personas for an internal role-switcher, not a real RBAC admin panel.** The same 7 keys gate write-access and nav filtering everywhere else in the module — `v11IsFullAuthority()` hardcodes `['ceo','admin','cio']`. This matters: it means the personas can't be safely replaced with real backend roles without touching permission-gating across the whole Portfolio module, not just Settings — see Fix 3 below for how this shaped the actual fix.

---

## Step 1 — Enumeration

| Tab | Components found |
|---|---|
| **Workspace** | Org/locale form (5 fields), default-experience form (3 selects + 3 toggles), investment/reporting controls (6 toggles + 1 button) |
| **Roles & Access** | Role directory (7 cards + "New role"), role profile panel, read/write permission matrix (13 pages × 2 toggles = 26 toggles), role members table + "Add person"/"Remove" |
| **Security** | 4 metric cards, authentication panel (4 toggles + 2 fields), approval-controls panel (4 toggles + 1 field), access-events table (3 static rows) + export button |
| **Integrations** | 6 integration cards (status pill, Configure/Test buttons), sync-health line chart |
| **Notifications** | Personal-notifications matrix (6 events × 3 channels = 18 checkboxes), escalation panel (4 fields + 2 toggles) |
| **Data & Retention** | Retention table (4 rows) + edit button, residency/backup info + 2 toggles, export-controls (4 toggles) + audit-review button |
| **API & Webhooks** | Service-accounts table (3 rows) + create button, webhook list (4 rows) + toggles + new-webhook button, runtime-config code block + download button |
| **Page-level** | Tab nav (7 tabs), role badge, "Export configuration", "Save changes" |

No modals/sub-forms beyond in-tab drawers (role member detail, add-person, integration config) — all confirmed reachable, none nested more than one level.

---

## Step 2 & 3 — Checklist + first-pass results

Legend: ✅ Pass · 🟡 Gap (works but not real) · ❌ Fail

| # | Check | Result | Note |
|---|---|---|---|
| 1 | Tab switching is in-place, not a route change | ✅ | `case 'settings-tab': state.settingsTab=...;render();return;` — confirmed live: URL stayed `/portfolio/settings` across all 7 tabs, sidebar highlight updated correctly. **Not** the routing bug seen elsewhere in the app. |
| 2 | All 7 tabs render without console errors | ✅ | Verified live one by one. |
| 3 | Workspace tab data is real | 🟡 | 100% hardcoded literals (org name, currency, timezone, all toggles). No API call in this renderer at all. |
| 4 | Roles & Access — role list | 🟡→✅ (fixed) | Was injecting real backend roles (cuid-keyed) alongside the 7 personas, inflating "7 roles" to "11 roles" with confusing raw names. Fixed — see below. |
| 5 | Roles & Access — member counts | ❌→✅ (fixed) | Every persona showed 0 members even though 11 real users exist, because `loadSettingsRbac()` keyed members by raw backend role id/name, which never matches the 7 persona keys. Fixed. |
| 6 | Roles & Access — member detail fields | 🟡→✅ (fixed) | `title`/`scope`/`status`/`lastActive` were never populated for real users (blank cells). Fixed with sensible fallbacks. |
| 7 | Roles & Access — permission toggle | ✅ | Works, updates in-session state correctly, shows accurate toast. Not persisted (see Fix 3). |
| 8 | Roles & Access — "New role" | ❌ | No handler anywhere in the file. Dead button. **Not fixed** — see Backend Blockers. |
| 9 | Roles & Access — "Add person"/"Remove" | ✅ | Wired, mutates local state correctly (consistent with the persona/preview nature of this tab). |
| 10 | Security tab data/toggles | 🟡 | 100% hardcoded (MFA %, session count, access-event log rows). No API call. |
| 11 | Integrations — status + Configure/Test | 🟡 | 6 integrations hardcoded; "Configure"/"Test connection" open a generic prototype drawer, do nothing real. |
| 12 | Notifications tab | 🟡 | 100% hardcoded checkboxes/fields, no load or save. |
| 13 | Data & Retention tab | 🟡 | 100% hardcoded retention table and toggles. |
| 14 | API & Webhooks tab | 🟡 | 100% hardcoded service accounts/webhooks. "Download config" — not checked further (static text block, low risk). |
| 15 | "Export configuration" | ❌→✅ (fixed) | No handler at all anywhere in the file — completely dead button. Fixed. |
| 16 | "Save changes" | ❌→✅ (fixed) | Handler existed but was misleading: claimed "saved in browser memory" — untrue, nothing was written to browser storage either. Fixed to state plainly what is and isn't persisted. |
| 17 | Loading state | ✅ | Settings loads instantly from local state; the one live call (`GET /users` for member counts) is fast enough that no visible loading flash was observed, and a failed fetch fails silently to an empty member list rather than crashing (acceptable). |
| 18 | Empty state | ✅ | Role with 0 real members shows "No members assigned" correctly (pre-existing, verified working). |
| 19 | Error state | 🟡 | `usersApi.getAll().catch(() => null)` swallows errors silently — if the call fails, member counts just show 0 with no indication anything went wrong. Low-severity; not fixed (matches the module's existing error-handling convention elsewhere, out of proportion to change unilaterally here). |

---

## Step 4 — Fixes applied

**Fix 1 — `export-settings` wired for real.** Was completely dead (no handler in any of the file's layered versions). Now downloads a genuine JSON snapshot of the current role permission matrix and active persona — real, in-session data, not fabricated. `components/portfolio-v11-mock/matanho-portfolio-runtime.js`.

**Fix 2 — `save-settings` toast corrected.** Was falsely claiming "saved in browser memory." Now states plainly that Workspace/Security/Notifications/Data settings are preview-only and unsaved, and that role-permission edits reset on reload. Same file.

**Fix 3 — Roles & Access now shows real data, safely.**
- `lib/portfolio-v11/live-loaders.ts` (`loadSettingsRbac`): rewritten. No longer injects raw backend roles into the persona list (was the cause of "11 roles" and permanently-0 member counts). Instead, each real user's backend role name is best-effort matched onto one of the 7 known persona ids (`admin`→admin, `Investment Analyst`→analyst, etc.); unmatched users (INVESTEE, Limited Partner, applicant — portal user types, not staff personas) are excluded from this view rather than shown as confusing extra role cards. Added `title`/`scope`/`status`/`lastActive` fallbacks so the member table has no blank cells.
- **Verified live**: 7 roles (not 11), Administrator shows 3 real members, Investment Analyst shows 1 (Tendai Moyo, real name/email/title), toggling a permission shows the correct toast, member drawer shows real data.

**Backend addition (used defensively, not yet wired to the UI — see reasoning below):** added `Role.portfolioSettingsPermissions Json?` — a new, isolated column, plus `GET /roles`, and extended `PUT /roles/:id` to accept it independently of the existing `permissions` field. `nvccz/prisma/schema.prisma`, `src/controllers/RoleController.ts`. New frontend client `lib/api/roles-api.ts`.

### ⚠ Near-miss during this work, disclosed in full

While probing whether the permission matrix could persist to the existing `Role.permissions` field, a test `PUT /roles/:id` **replaced** the real admin role's actual 30-entry permission list (`manage_roles`, `investments.admin`, `bank_reconciliation`, etc. — genuinely enforced elsewhere in the platform) with test data, because `updateRole` **replaces `permissions` wholesale rather than merging**. **Caught and restored immediately** — verified the response matches the original byte-for-byte. No lasting effect. This is exactly why the fix above uses a brand-new, isolated column rather than reusing the existing field, and why the toggle UI was **not** wired to write there (see next section).

### Why the permission matrix isn't wired to real persistence

Given the persona/real-role architecture above, there's no coherent backend target for "save this persona's permission grid": the 7 personas (CEO, Legal, Accounting, etc.) mostly have no corresponding `Role` row in the real system, and the ones that do (admin, Investment Analyst) aren't 1:1 — multiple personas would need to share or synthesize new backend roles that don't reflect real organizational roles. Building that mapping would mean inventing new `Role` rows purely to satisfy a demo UI's save button — the wrong direction for "making it make sense." The new column and endpoint are real, tested, and safely isolated for when/if this gets a proper design; the demo toggle grid stays session-only, and is now honestly labeled as such.

---

## Step 5 — Re-verification

Re-ran the full 19-item checklist after fixes, live in the browser:

- All 7 tabs: render clean, no console errors, no regressions from the fix (checked Security, Integrations, Notifications, Data & Retention, API & Webhooks, Workspace, Roles & Access individually).
- Tab switching: re-confirmed URL stays `/portfolio/settings` throughout.
- Roles & Access: 7 roles (was 11), Administrator = 3 members (was 0), Investment Analyst = 1 member (was 0) with real name/email/title, CEO/CIO/Legal/Accounting/M&E correctly show 0 (genuinely no matching real users — this is now accurate, not a bug).
- Permission toggle: still works, correct toast.
- Export configuration: fires without error (was previously a complete no-op).
- Save changes: shows the corrected, honest toast.
- `npx tsc --noEmit`: clean on every file touched in both repos (`lib/portfolio-v11/live-loaders.ts`, `lib/api/roles-api.ts`, backend `RoleController.ts`, `schema.prisma`).

No regressions found.

---

## Backend Blockers (flagged, not built — see reasoning per item)

| Item | Why not built |
|---|---|
| **"New role" button** | No handler exists. Building it meaningfully requires deciding what a "new role" even means in this persona-based model — same architectural question as the permission matrix above. |
| **Workspace org profile** (name, currency, timezone, date format, defaults) | No backend concept of a workspace/org settings record exists anywhere in the schema. Building one is a new subsystem, not a gap in an existing one. |
| **Security tab** (MFA policy toggles, session limits, approval thresholds, access-event log) | Same — no security-policy-as-data model exists. The *real* security enforcement in this app is hardcoded in middleware/config, not database-driven; this tab is a policy-documentation mockup. |
| **Integrations** (connect/configure/test for Fund Accounting, M365, DocuSign, Refinitiv, Banking API, CRM) | No integration/OAuth subsystem exists in the backend at all. This would be substantial new infrastructure per integration, not a fix. |
| **Notifications preferences** (per-user channel matrix, quiet hours, escalation) | No notification-preferences model exists. |
| **Data & Retention** (retention policy editor, export audit, residency/backup display) | No retention-policy-as-data model; residency/RPO/RTO figures are informational copy, not something a real system would let you edit from a UI toggle. |
| **API & Webhooks** (service accounts, webhook subscriptions, runtime config) | No API-key-management or webhook-subscription subsystem exists in the backend. |

Each of these represents a genuinely new backend subsystem (schema + endpoints + likely a management UI of its own), not a small gap in something that already exists — a different scale of work from the Roles fix above, where the underlying `Role` model, CRUD endpoints, and real user data already existed and just needed to be used correctly and safely. Recommend treating each as its own scoped project if/when they're wanted for real, rather than building six parallel subsystems inside a settings-page QA pass.
