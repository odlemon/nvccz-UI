# Brief: `/performance` module — functional audit, live wiring & verification

You are taking a module from "looks finished" to "provably works". A sibling module
(`/accounting-v52`) has just been through this exact process. Everything in §8 below is a
real defect class found there — most of it was invisible to code reading and only surfaced
under live browser testing. Assume `/performance` has the same classes of defect until you
have personally disproved each one.

**The standard:** a card showing a plausible number that never changes is a defect, not a
pass. A button that shows a success toast without a corresponding network request is a
defect. A page that renders correctly only because a *different* page populated its cache
earlier is a defect. A page that works for an admin but 403s or renders empty for the role
that actually uses it is a defect.

**The method:** functionality is derived from the UI. Every page, tab, card, table, chart,
filter, button, badge, modal and drawer is a functional requirement. You enumerate them,
determine what real data must back each one and who is allowed to see it, build whatever
backend is missing, wire them in dependency order, then verify each one live in a browser
as each role that uses it.

---

## 1. Ground rules — non-negotiable

- **Do not change the UI design.** You are making the existing interface real, not
  redesigning it. Preserve layout, structure, spacing, styling, class names, component
  hierarchy, iconography, copy and tone exactly as they are. Do not "improve", modernise,
  reorganise, rename sections, or swap components. If an element currently displays a
  fabricated value, replace the *value* with real data in the same visual slot — same
  card, same table cell, same chart — not the element. Where something genuinely cannot be
  backed by data, keep the slot and put honest content in it (`—`, "Not yet tracked", a
  real empty state) rather than deleting or restyling it. The only acceptable structural
  changes are ones strictly required to make data real (e.g. adding a control that a real
  write path needs), and those should match the surrounding design language exactly.
- **NEVER run `prisma migrate` or `prisma db push`.** Only `prisma generate`. All schema
  changes go through hand-written, idempotent, raw-SQL TypeScript scripts under
  `nvccz/scripts/`, wired as `db:migrate:*` npm scripts, run locally by you.
- **Log every migration** the same day in `design-refs/vps-pending-migrations.md`
  (`appliedToLocal: true`, `appliedToVps: false`). Data-only seeds count.
- **Check `lib/config/modules.ts` before assuming any route is current.** Versioned variants
  coexist (`/performance` vs `/performance-v2` etc.) and `SUPERSEDED_MODULE_IDS` marks dead
  ones. Confirm which id/path is live before touching anything.
- **Never hand-regenerate a vendored `matanho-*-runtime.js`** from its extract script. Only
  hand-patch. A prior regeneration silently destroyed 20 hand-wired actions.
- **Two repos.** Frontend is this repo; backend is the sibling `../nvccz` (Node/Express/
  Prisma/MySQL, port 3009). No backend code lives here.
- **Role-based access is a functional requirement, not a footnote.** See §4.
- **Do not commit unless explicitly asked.** Never push. Never deploy.
- **Specs and gap docs go in `design-refs/`**, not repo root.
- If you dispatch parallel backend agents: the backend repo has **no worktree isolation**.
  Concurrent sessions will collide on `schema.prisma`, `package.json`, `app.ts`. Re-read
  every shared file before committing and reapply against current content if clobbered.

---

## 2. Phase 0 — Explore and map. Write no code yet.

Produce a written map before implementing anything. Answer all of these with evidence
(file paths, line numbers), not assumption:

**Module identity**
- The `lib/config/modules.ts` entry: id, path, every `subModules[].path`,
  `hiddenFromSwitcher`, and whether it appears in `SUPERSEDED_MODULE_IDS`.
- Every route file under `app/performance/**`. Which paths actually resolve?
- `middleware.ts` `routePermissions` entries for these paths — matched by longest prefix, so
  check for collisions with sibling modules.

**Architecture — this determines your entire approach**
- Is this a **"-mock" client-faithful port** (a thin `<module>-app.tsx` host mounting a
  vendored `matanho-<module>-runtime.js`, intercepting `matanho:before-action`), or a
  **plain React module** (ordinary components under `components/performance/`)?
- If plain React: does it use Redux (`lib/store/slices/performanceSlice`)? What is the data
  flow — component-level fetch, thunk, or a `live-loaders.ts` pattern?
- Is there a `lib/performance/` with `adapters.ts` / `live-loaders.ts` / `actions.ts`?

**Access control** — full detail in §4, but map it in this phase:
- `middleware.ts` route→permission mapping for every `/performance*` path.
- `lib/config/role-permissions.ts` — how module access is granted (note: by literal module
  **id**, not path).
- Backend guards on every route you will consume: `requirePermission(...)`,
  `authorize([...])`, `isModulePrivilegedUser`, `roleCode` checks.
- The real `roles` table contents and which permission keys each role actually holds.
- Which real users exist and what `roleCode` each has.

**Data layer**
- Every `lib/api/*` file this module consumes. Known candidates: `kpi-api.ts`,
  `goal-api.ts`, `performance-data.ts`, `score-card-data.ts`, `board-review-api.ts`.
- For each: does it wrap the singleton `apiClient`? Does it unwrap the `{success,data}`
  envelope? Does it return real fetches, or hardcoded fixtures?

**Backend inventory (`../nvccz`)**
- Which Prisma models, services, controllers and mounted routes exist for KPIs, goals,
  scorecards, reviews, departments, tasks, risk register?
- Grep `src/app.ts` for the mounted route prefixes. A service existing does **not** mean it
  is reachable over HTTP — verify the route is actually mounted.
- Check `design-refs/*performance*` and any `*-backend-asks.md` for already-logged gaps.

**Known starting signals** — these are real `tsc --noEmit` failures observed in this repo.
They are strong hints that this module's data layer is partially wired or broken. Confirm
each and fold into your plan:
```
lib/api/performance-data.ts(382,28): Cannot find name 'apiClient'
lib/api/performance-data.ts(387,28): Cannot find name 'apiClient'
lib/api/performance-data.ts(35,3):   hardcoded Department fixture missing users/goals/_count
lib/api/performance-data.ts(223,3):  hardcoded Task fixture missing 'ruleset'
lib/api/performance-data.ts(308,5):  KPI type from kpi-api not assignable to performanceSlice KPI
lib/api/performance-data.ts(327,14): 'response.departments' is possibly 'undefined'
lib/api/goal-api.ts(101,24):         dead comparison — '"all"' has no overlap with the union
lib/api/kpi-api.ts(240,12):          'response' is of type 'unknown'
lib/api/score-card-data.ts(1,15):    no exported member 'DepartmentScorecard'
lib/api/board-review-api.ts(7,3):    'investmentApproved' implicitly 'any'
```
`performance-data.ts` containing hardcoded Department/Task/KPI fixtures *and* referencing an
undefined `apiClient` is the signature of a file that was half-migrated from mock to live.
Treat it as a primary suspect.

**Known defect already attributed to this module** — `CLAUDE.md` records a tab-switching bug
found on **Reviews, Reports, and Enterprise Risk Register in Performance**: tabbed pages
navigate to a different route instead of switching content in place. Verify whether this is
still present on every tabbed surface you touch.

**Known role surface** — the git history records a "Performance role toggle" fix aligned to
the profile menu and command centre. Establish early whether that toggle is a cosmetic
client-side view switch or is actually bound to the user's real role and permissions. If it
is cosmetic, that is a finding, and everything gated behind it needs real enforcement.

**Deliverable for Phase 0:** `design-refs/performance-module-map.md` — architecture, routes,
data flow, access-control map, backend inventory, and a first-pass list of everything that
looks unwired.

---

## 3. Phase 1 — Derive functional requirements from the UI

Walk the running app page by page, tab by tab. For **every** visible element — KPI card,
table, chart, filter, dropdown, badge, count, button, modal, drawer, empty state — record:

| Page | Tab | Element | What it claims | Real data that would back it | Backend exists? | Who may see / act | Classification |
|---|---|---|---|---|---|---|---|

Classification is one of:
- **REAL** — provably wired to live data (you will still verify it).
- **PARTIALLY REAL** — some fields real, others hardcoded. Very common. The most dangerous
  case is a real KPI row sitting directly above a fake panel that contradicts it.
- **MOCK / BACKEND EXISTS** — decorative, but the data exists and can be wired. Build it.
- **MOCK / NO BACKEND** — no data model exists anywhere. Decide: build the capability, or
  replace with an honest empty state. Never leave fabricated numbers.

The "Who may see / act" column is mandatory, not optional. Performance data is inherently
role-scoped — an individual contributor, a line manager, HR and an executive should not see
the same rows. Record the intended audience for every element, and whether the current
implementation actually enforces it.

Do this for *every* page, including ones that look finished. In the accounting audit, pages
previously reported as fully verified turned out to have entirely mock write paths.

**Deliverable:** `design-refs/performance-functional-requirements.md` containing that table,
plus an ordered implementation plan grouped by dependency (shared/reference data first, then
read paths, then write paths, then cross-page rollups).

---

## 4. Role-based access — a first-class requirement

Performance management is role-scoped by nature: people see their own objectives, managers
see their team's, HR/admin sees the organisation, executives see rollups, and reviews have
reviewer/reviewee separation. Getting this wrong is both a functional bug and a data-privacy
problem. Treat it with the same rigour as the numbers.

**What you must establish and document**

1. **The role matrix.** For every page, tab and action in the module: which roles may view
   it, which may act on it, and what scope of records each role sees (own / team /
   department / organisation). Produce this as a table.
2. **Where enforcement lives.** For each item, identify the enforcement point(s):
   - Route-level: `middleware.ts` `routePermissions` (longest-prefix match — watch for
     colliding keys between modules; a later duplicate key silently wins).
   - Module-level: `lib/config/role-permissions.ts`, which grants by literal module **id**,
     not by path. A path rename does not move access with it.
   - Component-level: conditional rendering of nav items, tabs, buttons.
   - **Server-side: the actual API route guards.** This is the only enforcement that counts.
3. **Hiding a control in the UI is not access control.** For every gated action, confirm the
   backend rejects an unauthorised caller independently of the UI. If the endpoint is open
   and only the button is hidden, that is a security defect — record it and fix it.
4. **Granular permission keys must actually be granted to somebody.** A role holding a
   broad-sounding permission does not imply it holds the specific keys a route requires.
   In the accounting audit the `admin` role held `manage_accounting` but had *zero*
   `accounting.period_lock.*` keys, so an entire page 403'd for every user in the system and
   had evidently never worked. Check each required key against the real `roles` table
   contents, not against what the name implies.
5. **Every role referenced by a workflow must exist on a real user.** An approval or review
   stage targeting a `roleCode` that no user holds is a structurally dead workflow — nobody
   can ever action it. Verify that each role in a routing rule maps to at least one real
   user, and say so explicitly if it does not.
6. **Privileged users bypass gates.** Admin/CFO-type checks (`isModulePrivilegedUser` and
   similar) short-circuit approval and permission paths. Testing only as an admin therefore
   never exercises the gated path at all, and will make a broken restricted experience look
   fine. Always test the restricted roles too.
7. **Segregation of duties.** Review/approval flows commonly block self-action (you cannot
   review yourself, approve your own submission). Confirm the rule exists server-side, and
   test it both ways: that it blocks the self case, and that it permits the legitimate
   second-party case.
8. **The role toggle.** If the module's role toggle changes what is displayed, determine
   whether it reflects the user's real permissions or merely switches a client-side view. A
   toggle that lets any user preview another role's view is fine as a *display* affordance
   only if the underlying data and actions remain correctly scoped server-side. Verify that.

**Do not change the access design without flagging it.** If the intended matrix is unclear,
document the ambiguity and pick the least-privilege interpretation, rather than silently
widening access.

**Deliverable:** `design-refs/performance-role-matrix.md` — the matrix, the enforcement point
for each entry, and a verification column filled in during Phase 5.

---

## 5. Phase 2 — Close backend gaps

For anything classified MOCK / NO BACKEND that is a genuine dependency of this module:

- Build it properly: Prisma model → idempotent raw-SQL migration script → service →
  controller → mounted route → permission keys consistent with sibling routes, and actually
  granted to the roles that need them.
- Reuse existing computation services rather than reimplementing. Check whether a stateless
  report service already computes what you need.
- **Honest defaults.** If the backend genuinely cannot know something (evidence counts,
  historical trends, ratings that were never captured), render `—` / "Not yet tracked" /
  a real empty state *in the existing UI slot*. Never invent a plausible number to fill it.
  An honest zero that matches reality is a pass; a fabricated 87% is a defect.
- Where a decision is a business-policy question with no existing answer (rating scales,
  weightings, review cadences, approval thresholds), pick a documented, reasonable default,
  state it clearly in code comments and your report, and flag it as configurable — do not
  stall, and do not silently bake it in as if it were an established rule.
- Log every schema/data change in `design-refs/vps-pending-migrations.md`.
- Record anything you deliberately did not build in `design-refs/performance-backend-asks.md`
  with the reason.

---

## 6. Phase 3 — Wire the frontend, in dependency order

Read paths before write paths. Shared/reference data before things that depend on it.
Throughout: the visual result must be indistinguishable from the current design except that
the data is now real.

**If this is a "-mock" runtime module**, the traps are severe — see §8 items 5–7. In short:
verify empirically which function actually renders each page (`pages.X` is reassigned many
times; last assignment wins), and never assume two parts of that file share scope.

**If this is a plain React module**, wire through the established conventions: an API wrapper
in `lib/api/<domain>-api.ts` around the singleton `apiClient` with a header comment stating
the backend route contract; adapters that map backend shapes to component props; a loader
that `Promise.all`s with per-call error capture rather than failing the whole page.

**Write paths** must actually reach the backend. After wiring each one, confirm in the
network panel that the expected `POST`/`PATCH` fires and returns 2xx — see §7.

**Cache/scope invalidation must be complete.** After any write, every view that derives from
the mutated data must be invalidated, not just the page you were on. Enumerate the
dependents explicitly. In the accounting audit, an approve action invalidated only the
approvals scope, leaving the ledger, cash, reconciliation and financial statements views
serving stale data for the rest of the session.

---

## 7. Phase 4 — Live verification protocol

This is where "no room for mistakes" is enforced. Code reading does not count as
verification. For every element in your Phase 1 table:

1. **Fresh tab per page.** React state, Redux state and `localStorage` all persist across
   in-app navigation. A page can look correct purely because a different page populated a
   shared cache earlier in the session. Open a brand-new tab and load the page cold.
2. **A success toast is not proof.** Open the network panel. Confirm the specific
   `POST`/`PATCH`/`PUT` fired, to the expected URL, and returned 2xx. Then read the response
   body. Then re-query the API independently and confirm the row actually changed.
3. **Verify as each role, not just as an admin.** Walk the module as an individual
   contributor, a manager, HR/admin and an executive (or whatever the real matrix says).
   Confirm: the right pages are reachable, the right rows are visible, restricted actions
   are absent *and* rejected server-side, and no page renders broken/empty for a role that
   legitimately uses it. An admin-only pass proves almost nothing about this module.
4. **Console must be clean.** Note that the console log is a *rolling buffer across SPA
   navigations*, not per page — attribute errors carefully or use a fresh tab each time.
5. **Cross-check across pages.** The same figure shown in two places must agree. Rollups
   must tie to their components. A team score must reconcile to the individuals in it.
6. **Segregation-of-duties paths need two users.** Review/approval flows commonly block
   self-action. Seed data as a *different* real user (via an ad-hoc script you delete
   afterwards) and action it as yourself, or the happy path is never actually exercised.
7. **Confirm the design is unchanged.** Compare against the pre-change UI. Same layout, same
   components, same styling — only the data differs.
8. **Clean up test artifacts.** Void/delete what you created; leave real data intact.

Record, per element: what you did, which role you did it as, what the network showed, what
the database showed.

---

## 8. Failure patterns to actively hunt

Every one of these was found in the sibling accounting module. Assume each is present here
until disproved.

1. **Decorative write buttons.** A button opens a convincing confirmation modal, shows a
   success toast, and updates the screen — while only mutating local/in-memory state and
   never calling the backend. Found on two major surfaces, both previously believed real.
   *Detection: network panel, every time.*
2. **A page that never fetches.** Its id is missing from the loader's page→scope switch, so
   it silently falls through to an empty scope list and renders whatever a previously
   visited page left in cache. The module's landing page had this.
   *Detection: fresh tab, watch for that page's own requests.*
3. **Incomplete invalidation after a write.** Sibling views keep serving stale data for the
   whole session. *Detection: perform a write, then check every dependent page without
   reloading.*
4. **Fake panel contradicting a real KPI on the same page.** Top row says "0 exceptions";
   the panel directly below says "$71.6k · 2 bills". Found on four pages.
   *Detection: read every page's numbers against each other.*
5. **Renderer ambiguity in vendored runtimes.** `pages.X` gets reassigned many times across
   historical layers; the last assignment wins, and earlier ones are dead code that looks
   live. Static analysis picked the wrong function more than once.
   *Detection: enumerate all assignments programmatically; confirm in-browser.*
6. **Scope isolation inside a single vendored file.** Functions in one region cannot see
   helpers, state or even top-level function declarations from another, producing runtime
   `ReferenceError`. The only reliable pattern: publish shared data on a `window.__<ns>*`
   global from a location known to be reachable, and read it defensively at the use site.
   *Detection: empirically, via live console errors. Never assume scope sharing.*
7. **CSS scoped to a root class + element appended to `document.body`.** The element exists
   in the DOM, has correct content, and is completely invisible/mispositioned because the
   selector never matches. Affected every modal in a whole UI layer.
   *Detection: element exists but screenshot shows nothing → check computed styles.*
8. **`localStorage` masking staleness.** State is rehydrated from storage at boot, so stale
   values survive reloads and even new tabs. *Detection: inspect the storage key directly.*
9. **Date-only/timezone bucketing.** `DATE` columns arrive as UTC-midnight ISO strings;
   local-time `setHours(0,0,0,0)` / `getDay()` shifts them a day for any non-UTC viewer
   (all real users here are UTC+2). *Detection: check entries land in the right day column.*
10. **Division by zero → `NaN%`** whenever a denominator can legitimately be 0 in real data
    but never was in the mock fixtures. *Guard every ratio.*
11. **Hardcoded literal IDs in lookups.** `arr.find(x => x.id === 'CA-01').status` crashes
    the page the moment real data replaces the fixture. *Make lookups return safe fallbacks.*
12. **Response-shape assumptions.** An endpoint's write response omitted a nested relation
    the list endpoint includes; the success-message code dereferenced it, threw, and the
    thrown error was caught and treated as a failed action — silently skipping the refetch
    even though the write had succeeded. *Verify actual response bodies, not the TS type.*
13. **Backfill migrations with no default for new rows.** A one-time migration tagged
    existing rows; nothing set the field on creation afterwards, so a headline metric
    silently froze and drifted from reality. *Detection: create a new record, confirm the
    field is populated. Fix at the shared creation chokepoint, and find every path that
    bypasses it.*
14. **Tabs that navigate instead of switching in place** — explicitly recorded against
    Reviews, Reports and Enterprise Risk Register in this module.
15. **Hardcoded badge counts and sidebar numbers** that look computed but are literals.
    *Trace every number to its source data.*
16. **Permission keys nobody holds.** A route requires a granular key; no role in the real
    `roles` table has it; the page 403s for everyone and never worked.
    *Detection: check required keys against actual role contents, not names.*
17. **Roles nobody holds.** A workflow routes to a `roleCode` assigned to zero users, so the
    step can never be actioned. *Detection: query real users per role referenced.*
18. **UI-only gating.** The control is hidden but the endpoint is unguarded.
    *Detection: call the endpoint directly as an unauthorised role.*
19. **Admin-only testing.** Privileged users bypass gates, so the restricted experience is
    never exercised and ships broken. *Detection: test as every real role.*

---

## 9. Deliverables

1. `design-refs/performance-module-map.md` — Phase 0 architecture, inventory and access map.
2. `design-refs/performance-functional-requirements.md` — the per-element requirements
   table (including audience) and ordered implementation plan.
3. `design-refs/performance-role-matrix.md` — roles × pages/actions, enforcement point per
   entry, verification result per entry.
4. `design-refs/performance-backend-asks.md` — anything deliberately not built, with reasons.
5. Migration rows appended to `design-refs/vps-pending-migrations.md`.
6. A final report that states plainly, per page: what is now real and verified, what is
   honestly empty because no data exists, what remains mock, and which roles each claim was
   verified under — with no overclaiming. If you did not personally exercise something end
   to end, say so explicitly.

**Report faithfully.** If a test fails, show the output. If you skipped something, say so.
"Verified" means you watched the request fire, confirmed the database changed, and did it as
the role that actually uses the feature — nothing less.
