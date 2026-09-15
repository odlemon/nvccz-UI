# /home module — execution plan (Stage 3)

Builds on [module-spec.md](./module-spec.md). Ambiguities flagged there weren't individually resolved by
the owner, so each phase below states the default call made and where it'll be checked before code is
written against it. Phased so each phase ships one verifiable vertical slice — backend + frontend together
— rather than all backend then all frontend.

Cadence: report + live-verify at the end of every phase before starting the next, per the repo handbook's
stage → audit → implement → user tests → repeat loop. Not running all 8 phases unattended back to back.

## Phase 0 — Audit (no code changes, de-risks everything below)

Quick, code-reading pass to convert the Stage 2 ambiguity flags into concrete answers before backend design:

- Does a standalone Performance module already exist (`app/performance*/**`, an entry in
  `lib/config/modules.ts`)? What API does it already call? → decides #2/#3 (home/performance & My Work's
  scorecard widget: personal read-view over the real thing, vs standalone).
- Read `FastBullMarketDataClient.ts` fully — equities only, or does it also cover indices/FX/commodities
  (MSCI Frontier, ZSE All Share, USD/ZWL, Gold)? → decides News' Market Pulse approach.
- Grep for existing `prisma.event` usage outside `HomepageController` — is there already a company-events
  feature (using the rich Guest/Budget/Expense/CheckIn/Report sub-models)? → decides Calendar's approach.
- Grep for how `Task.team` (json) is queried elsewhere for "my tasks" — need the existing convention rather
  than inventing a second one.
- Check Portfolio's existing API for an AUM/summary endpoint → decides Home's chart: aggregate call vs a
  backend-ask.
- Check Payroll's API for what's already exposed for leave balance / payslips / expenses (vs only in
  schema) → decides Services' stat tiles.
- Grep for any existing generic request/ticket model beyond `LpServiceRequest` → decides Services' "My
  requests" approach.
- Check whether any LLM/AI backend already exists anywhere in this app (the Matanho Assistant / AI
  Concierge chat boxes need *something* behind them) → if none exists, wiring real AI is its own scoped
  decision, not assumed as part of this build (see Phase 1 note).

Output: a short addendum to module-spec.md with answers, not a separate report — folded into Phase 1's
kickoff unless something material changes the plan below, in which case I'll flag it before continuing.

## Phase 1 — Home dashboard (`/home`)

The literal target page. Highest priority.

**Backend**
- New `HomePreference`-style table (or reuse if Phase 0 turns up something close) holding, per employee:
  active daily-cover theme/wallpaper (shared with Phase 2), notification/experience settings (shared with
  Phase 8) — start the table now since Phase 2 needs it immediately after.
- New small `FocusSession` table for "Start your day": taskId, status, durationMinutes, startedAt,
  pausedRemaining, active/paused — persisted so a reload mid-session doesn't lose it. GET current + POST
  start/pause/resume/end.
- "Today's Priorities" — query the signed-in user's open `Task`s (using whatever convention Phase 0 finds).
- "Upcoming Schedule" — `events.upcoming` from the existing `GET /homepage` endpoint (already returns this;
  just needs calling).
- "Workday Snapshot" deep-work/momentum/balance — compute from calendar time + task completion for v1
  (documented as a derived metric, not invented data); AUM chart — call Portfolio's existing endpoint if
  Phase 0 finds one, else this becomes a `*-backend-asks.md` entry and the tile ships with an honest "not
  available yet" empty state rather than fake numbers.
- Matanho Assistant chat — **not assumed in scope for this phase.** If Phase 0 finds no existing AI backend
  in this app, wiring a real assistant means adding a new dependency/integration, which needs your sign-off
  first (per the "don't install dependencies without asking" standard). Default for Phase 1: the chat UI
  stays visible but the send action shows an honest "not connected yet" state instead of faking a response
  — flagging for your call rather than deciding silently.

**Frontend**: replace every localStorage read on this page with the above; loading/empty/error states on
each region; remove `matanho-hub-state` reads for `priorities`, `daySession`, `cover` (theme only, for
rendering), keep other keys untouched until their own phase.

**Verify**: reload as `proc.mgr` and a second role — priorities/schedule are real and differ per user; start
a focus session, reload mid-session, confirm it's still running; AUM tile either shows real data or an
honest empty state, never a static number; no console errors; no regression to login/session.

## Phase 2 — Daily Cover (`/home/cover`) — done, verified live

Shipped as planned: `home_preferences` table + `GET/PUT /api/homepage/preferences` (API repo
`dc27ddc`), theme/wallpaper wired to it (frontend repo `8f01c4b`). No runtime patch needed for
either direction — `state.cover` already prefers a cached localStorage copy over any hardcoded
default, so the real preference is seeded into that cache before mount; the runtime already
emitted `preferences.theme.updated`/`preferences.wallpaper.updated` on every change, a new
listener just syncs those to the API. Verified with `localStorage` fully cleared before reload
that the choice still renders — proving it's server-side now, not the client cache the original
copy claimed but didn't do. Reset back to the Porcelain/auto default on the shared dev DB after
testing.

## Phase 2 (original plan, for reference)

**Backend**: CRUD on the `HomePreference` table from Phase 1 (theme, wallpaper).
**Frontend**: each theme/wallpaper click saves via API instead of `cover` in localStorage; Home (Phase 1)
reads the same preference to render its scene.
**Verify**: change theme, reload — persisted; log in as a second test user — independent preference, no
bleed-through; confirm the copy claim ("stored against the employee profile") is now actually true.

## Phase 3 — Employee Services (`/home/services`) — done, verified live

Shipped: `service_requests` table + `GET/POST /api/service-requests` (API repo `9b4e53f`),
Services page wired to it plus the existing Payroll self-service endpoints (frontend `a909b15`).
Leave balance and latest payslip show real data or an honest "Not set up" (every test persona
tried has no linked Employee record — not a bug). Pending expenses is a real sum over the user's
own requests; Learning hours has no backing data anywhere in the schema, so it says "Not tracked
yet" rather than a number. Request leave and the generic service-request modal both submit for
real now; download-payslip fetches the actual PDF.

Two real bugs caught by live testing (not by typecheck): `state.requests` turned out to follow
the same hardcoded-literal-fallback pattern as `state.cover` from Phase 2, not `D.requests` —
fixed by seeding localStorage instead of evicting it. And the service catalog's `"expenses"` id
didn't match the backend's `"expense"` enum entry — fixed by relaxing that validation instead of
chasing an enum that has to stay in sync with frontend data. Deleted all test service-request
rows from the shared dev DB after verification.

Known gap, not fixed this phase: the "Request leave" modal's in-form balance preview
(`state.leaveBalance`) still shows the mock's placeholder "18.5 days" for accounts with no
Employee record, since there's no real number to substitute. The request itself is still
genuinely created — only that one cosmetic preview number is unaddressed.

## Phase 3 (original plan, for reference)

**Backend**: stat tiles aggregate from Payroll (`LeaveBalance`, `Payslip`) and Accounting (`Expense`) via
their existing APIs — no new tables for these. "My requests": approach depends on Phase 0's finding; default
if nothing existing is found is one small `ServiceRequest` table (type, status, submittedBy, nextAction,
link to the underlying record once created) rather than a full ticketing system.
**Frontend**: wire tiles; wire "Request leave" and "Submit expense" quick actions to real submit flows with
loading state; My Requests table from real data.
**Verify**: submit a leave request as a test user, see it land in My Requests with correct status; confirm
the number reconciles with Payroll's own leave-balance view for the same user.

## Phase 4 — Calendar (`/home/calendar`) — done, verified live

Phase 0 had proposed writing personal events straight onto the existing `Event` model. Building this
phase surfaced a hazard Phase 0's read-only audit missed: `EventController.createEvent` sends a
notification to *every user in the system* on creation — correct for the corporate Events app it backs,
wrong for "block an hour for focus time." Flagged to the user before writing any code; agreed approach
was a new, deliberately separate `calendar_entries` table (API repo migration + `CalendarEntryController`
at `/api/calendar-entries`, `git 94aa15d`) so personal entries never fan out a notification, while
Calendar still reads the real company-wide `Event` model read-only alongside it via the existing
`GET /api/events`.

Shipped: week view rebuilt from the vendored runtime's hardcoded July-2026 mock entirely off real dates
— month-mini, week columns, toolbar date, and the event grid all derive from the actual current date
(verified live showing September 2026 / Mon 14–Sun 20, today the 15th, correctly highlighted). "My
calendar" (personal `CalendarEntry` rows) and "Company events" (real `Event` rows) render as separate
toggleable sources over the same grid. Create event persists a real row (`title`, computed `startDate`/
`endDate` from the date+time fields with a 1-hour default duration, attendees folded into `description`)
and, since the mounted runtime has no hydrate() API, reloads the page 800ms after a success toast so the
new entry actually appears rather than silently vanishing until the next unrelated navigation — same
trade-off used for wallpaper upload/delete in Phase 2b. Selecting an event opens a detail panel with the
real title/time; personal entries get a working Remove button (`DELETE /api/calendar-entries/:id`, same
reload-after-toast pattern). Company events (read-only, sourced from the real `Event` model) intentionally
render without a Remove control.

One real bug caught by code review before it could ship: the vendored runtime's event-click handler did
`Number(ev.dataset.event)||1`, silently coercing any real UUID event id to `NaN` and falling back to a
hardcoded id `1` — meaning Remove would have deleted whatever record happened to be `id 1`, not the
clicked one. Fixed to keep the raw string id; verified live that the DELETE call carries the exact id of
the clicked event.

Live-verified end to end: created a test event (Wed 16 Sept, 10:00) via the UI, confirmed
`POST /api/calendar-entries` fired with the correct computed `startDate`/`endDate`
(`2026-09-16T08:00:00.000Z`–`09:00:00.000Z`, i.e. 10:00–11:00 CAT), confirmed it reloaded into the correct
day column and time slot, opened its detail panel, clicked Remove, confirmed
`DELETE /api/calendar-entries/:id` fired with the matching id and the event was gone after reload. No
orphaned test rows left in the shared dev DB.

Known, expected gap — not a bug: Company events renders empty in this dev environment since
`GET /api/events` returns 0 rows here; the empty state is honest, not faked. Meeting-intelligence
fields from the original mock (linked files, decisions pending, attendee-confirmation counts) have no
backing data on either `CalendarEntry` or `Event` and were dropped from the detail panel rather than
faked, matching the "scope down honestly" instruction in the original plan below.

## Phase 4 (original plan, for reference)

**Backend**: depends on Phase 0's finding. If a company-events feature already exists, Calendar reads it
(no new writes needed beyond what already exists); if not, a dedicated range-query endpoint (week/month) +
create-event on the existing `Event` model.
**Frontend**: week grid from real data, Create event form that persists, event detail panel wired to real
attendees/agenda where that data exists (agenda/meeting-intelligence fields may not exist on `Event` yet —
scope down honestly rather than fake it if so).
**Verify**: create an event, reload, see it; confirm visibility is properly attendee-scoped, not global.

## Phase 5 — My Work + Performance (`/home/work` + `/home/performance`) — done, verified live

Shipped almost entirely as wiring, per Phase 0's finding — but building it surfaced two real gaps
Phase 0's read-only audit couldn't have caught:

1. **No absolute progress-set endpoint existed.** `PUT /tasks/:id/stage` writes
   `percentValueAchieved`, but *additively* (`addPercentAchieved`, meant for incremental
   "achievement" postings) — wrong for "set progress to 60%" from a slider. `PUT /tasks/:id`
   (the general update) looked like the right endpoint — its controller already destructured and
   forwarded `monetaryValue`/`percentValue`/`monetaryValueAchieved`/`percentValueAchieved` from the
   request body, and its swagger docs advertised all four — but `UpdateTaskRequest` never declared
   them and the final `prisma.task.update()` call never spread them into `data`, so they were
   silently dropped. Fixed in the API repo (`f541599`): added the four fields to the interface and
   the update call, matching the existing conditional-spread style of every neighboring field.
2. **A task's `percentValueAchieved` only ever displays when it also has a positive `percentValue`
   target** — `applyValueDisplayHardening` (taskValueDisplay.ts) nulls both achievement fields back
   out in every response when there's nothing to compare an achieved value against, which a bare
   ad-hoc "how far along is this" task never would have. Fixed on the frontend side instead of the
   backend: every write that sets `percentValueAchieved` now also sends `percentValue: 100`, so a
   plain task's progress is modeled as "target 100%, achieved N%" — the natural reading of a
   completion percentage anyway.

**My Work**: all three tabs (My work / Projects / Teams) run off real data. "Projects" are
department groupings of real tasks, not a separate entity — none exists server-side, and a
standalone "create project" modal would have saved nothing durable the moment you left the page
(the same "don't offer a control that saves nothing" rule this codebase already follows elsewhere),
so it was removed; typing a new project name into the create-task form is how a project starts now.
"Teams" groups real org-wide tasks (`GET /tasks` — verified open to any authenticated user
server-side, not gated to admins the way `/tasks/my`'s all-tasks branch is) by real team-member id,
resolved to names via `GET /users` (the same directory endpoint Phase 7's People page will reuse).
Create/toggle/complete/edit/inline-progress all persist for real; create reloads after an 800ms
toast (a fabricated id would go stale the instant a follow-up edit tried to PUT it — same reasoning
as wallpaper upload and calendar-entry create throughout this build); toggle/edit/inline-progress
are optimistic, matching the established trade-off. The task-detail modal's Owner field used to be
a free-text input that silently did nothing on save (real reassignment needs a full team array, not
a display name) — made read-only pending a proper assignee picker, rather than ship a control that
looked like it worked and didn't.

**Performance Overview** (and the matching "Performance" mini-card on My Work's right rail): reuses
the exact `/performance/scorecards/user` field paths already verified live by
`performance-v22-mock`'s `loadMyScorecard`/`adaptMyScorecard`. The mock's Overview tab was a wall of
fabricated content with zero real backing — a narrative paragraph, four metric cards with fake
six-month trend lines, a fake quarter-over-quarter score chart, a fake contribution donut, a fake
competency breakdown, a fake feedback timeline (borrowing `D.people`'s mock names), a fake
review-readiness checklist, a fake "next review" footer — none of which the real endpoint has any
way to answer. Replaced with what the endpoint actually returns: overall score, contract
title/period, and the real linked-goal list (title/weight/score/status), honest empty state
otherwise. The old "Balanced scorecard" mini-card (fixed 88/92/84/86 pillar scores) is gone for the
same reason `performance-v22`'s own department-scorecard adapter already documents: the read shape
doesn't expose a goal's `scorecardPillar`, so a four-pillar breakdown would be a guess, not a fact.
Scorecard/Goals/Feedback/Development tabs stay fully mocked, deferred exactly as this plan allowed
("as a follow-up sub-phase... will report before splitting further") — Overview no longer
cross-links into them (they'd show a different, fake goal list next to the real one Overview now
renders, which is a worse inconsistency than not linking).

Verified live end to end: created a real task, edited its progress via both the detail modal's
slider and the row's inline dropdown, toggled it complete — watched Open/Completed/Average-progress
tiles, the Projects card, and the roadmap section all move together correctly, then confirmed the
Teams tab (org-wide, its own snapshot from page load) catches up on next reload, an accepted
instance of the same optimistic-only trade-off used elsewhere. Seeded a temporary real
`PerformanceContract` + two `PerformanceGoal` rows (direct Prisma, not the API — no self-service
contract-creation endpoint exists, and building one is out of scope for a module that only reads
this data) to verify Overview's populated path, not just its honest-empty path; deleted both test
performance rows and the test task afterward. One-line hardcoded default fixed in passing: the
roadmap section used to fall back to a literal `'Southern Africa Expansion'` whenever no project
filter was active — now falls back to the top real project, or hides the section if there isn't one.

## Phase 6 — News + Newsletters + Forums — done, verified live

Shipped close to the original plan, with one scope change made explicit before building rather than
assumed: **Newsletters' audience-management side was dropped**, not deferred. `NewsletterAudienceConfig`
exists but is `authorize(["admin"])`-gated (`GET/PUT /newsletters/recipients/config`) — genuinely an
admin-console concern, not something a regular staff Home page can act on. The mock's "Newsletter lists"
manager, "Publishing activity" log and a 12-issue readership-analytics chart all had zero real backing
regardless (no distribution tracking, no open-rate data anywhere in the schema), so they were removed
rather than left inert. Same treatment for the mock's per-newsletter role simulator (Read only / Editor /
Publisher) — no such permission model exists server-side (any authenticated user can already call
`POST /newsletters`), so keeping a fake role gate that implied a restriction the backend doesn't enforce
would have been its own kind of dishonest UI. The block-based "Studio" editor (Cover / Editor's note /
Market outlook / Portfolio signals / People spotlight blocks, review comments, governance checklist) is
gone too — replaced by a plain create form (title, content, optional cover image) matching what
`POST /newsletters` actually accepts.

**News** was rebuilt as the plain internal-announcements feed the plan's v1 default called for —
title/content/author/time on the real `Post` model, comments via `Reply`. The mock's wire-service
styling (multi-source bylines, category badges, hero images, read-time, a live "Market Pulse" ticker,
a "Sources you follow" list) is gone; none of it has any real data source, and building one (external
market-data integration, real editorial content) is a materially bigger project the plan already flagged
as out of scope for this pass.

**Forums** shares the same `Post`/`Reply` table as News — a new nullable `category` column distinguishes
a News post (`category` null) from a Forum discussion (`category` set to one of five fixed topics,
matching the page's existing category rail). A new `isSolved` column backs a real, author-gated
"Mark as solved" toggle. Category pill counts, the "Unanswered"/"My discussions" filters, "Top
contributors" and "Knowledge that lasts" (recently solved discussions) are all computed from real loaded
posts — the mock had five hardcoded categories with fake discussion counts and a fabricated seed
conversation (quotes attributed to real `D.people` names) that's gone entirely.

Two schema-adjacent problems, both fixed, that only surfaced once real ids and a schema change were in
play:
- This worktree's Prisma client is generated from the pre-migration schema and can't be regenerated here
  (junctioned `node_modules` shared with the main checkout — `prisma generate` is off-limits the same way
  `migrate`/`db push` are). The typed client silently drops any field it doesn't know about, so
  `category`/`isSolved` needed a small raw-SQL side query on read and a follow-up raw `UPDATE` on
  create/update in `PostController`, rather than passing through `prisma.post.*` directly.
- Every "open this item" handler across all three pages (`data-news-open`, `data-forum-open`,
  `data-newsletter-open`) coerced the clicked element's dataset id through `Number(...)` — correct only
  for the mock's small integer ids, silently `NaN` for a real cuid, same bug class already fixed for
  Calendar (Phase 4) and My Work (Phase 5). `nav.ts`'s URL regexes had the same assumption baked in
  (`\d+`), so a direct link or a refresh on an open article/thread/newsletter fell back to the bare list
  route. Separately, `Hv3SessionUser` (`D.user` in the runtime) never carried the real user id at all —
  harmless until this phase needed "is this my own post" checks (the My discussions filter, the
  author-gated Mark as solved button), which silently failed shut until fixed.

Verified live end to end, each with a real create → real detail view → real reply, then deleted: a News
post (with a comment), a Forum discussion (category-tagged, marked solved, with a reply — watched the
category pill count, "Top contributors" and "Knowledge that lasts" all update from the real data), and a
newsletter (list → reader view). Also caught and fixed live: two `<strong>`+`<span>` empty states that
rendered on one line instead of stacking (no `display:grid` on the shared `.empty-state` class the way
`.work-empty-state` has — switched to block-level `<h3>`+`<p>`, matching the pattern already working on
Performance's own empty state from Phase 5).

## Phase 7 — People + My Profile

**Backend**: People directory reads existing `Employee`/`User`/`Department` — explicitly not a new table.
Skills/endorsements and Recognition/badges: only build if you confirm they're wanted as real features:
default is to ship Profile without those two sub-widgets (rather than a fake-data placeholder) until
confirmed, per the "no hardcoded data" standard.
**Frontend**: directory search/filter live; profile tabs live (Overview first, others as found necessary).
**Verify**: directory search returns real employees across roles; a profile edit persists and is visible to
another session.

## Phase 8 — Settings, Help & Support, and the second pass

**Backend**: Settings persists to the same `HomePreference` table (language, timezone, density, the
notification toggles) rather than a separate store.
**Frontend**: wire the Settings modal; find out what Help & Support is supposed to do (currently a dead
click) and either wire or remove it; second-pass check of items not deeply exercised in Stage 1 — Apps
switcher grid, Matanho AI panel, org/FY/role switchers, My Work's Teams tab, Profile's Experience/Goals/
Preferences/Documents tabs.
**Verify**: settings persist and actually take effect (e.g. a disabled notification type stops arriving);
full click-through of every element in the Stage 2 inventory with real data, per the Stage 5 standard.

## Phase 2b — custom wallpaper upload + rotation interval — done, verified live

Added mid-build at the owner's request (design a Windows-lockscreen-style rotating background:
upload your own images, choose how often it changes). Schema: `home_wallpapers` table (one row
per image) + `home_preferences.rotation_interval_minutes`, both migrated with sign-off. API:
`GET/POST /api/homepage/wallpapers`, `DELETE /api/homepage/wallpapers/:id`, reusing the existing
`RemoteUploadService` upload pattern (API repo `e0335f0`). Frontend: custom uploads slot into the
existing wallpaper grid as extra tiles (not a separate gallery) with an Upload tile and inline
remove button; a Rotate-interval dropdown appears in auto mode; `currentHeroScene()` rewritten
from pure calendar-day granularity to interval-based, preferring uploads over the 7 built-in
scenes when any exist (frontend repo `a2c6df6`).

Verified live end-to-end: uploaded two real images via direct multipart POST (the same code path
the UI's file picker uses), confirmed both retrievable at their public-media URLs, confirmed
fixed-selection and delete both persist correctly, confirmed the rotation math is exactly correct
(reload showed the mathematically-predicted image after a real 3-minute boundary crossed). One
real finding from that test: the live 15s re-render poll is throttled by the browser while the
tab/pane is hidden (confirmed via `document.hidden`), so a backgrounded page can show a stale
wallpaper until something re-renders it — not a logic bug (the underlying computation was proven
correct), but added a `visibilitychange` listener so the page catches up the instant it's looked
at again, rather than only on the next unrelated navigation.

Known trade-off, not fixed this phase: upload and delete both trigger a full page reload to show
their result, since the runtime has no way to push fresh data into an already-mounted instance
(same gap as Phase 1's priority-toggle rollback). A `hydrate()`-style API on the runtime would let
every phase's write actions update in place instead of relying on reload/self-heal-on-next-load —
flagging this as the one structural improvement that would clean up several phases at once if
picked up as its own piece of work.

## What's explicitly deferred rather than silently built

- Matanho Assistant / AI Concierge real responses — needs an explicit decision on what powers it.
- News's full editorial/wire-service experience and the Market Pulse live ticker — scoped down for v1
  unless you want the fuller build funded.
- Profile Skills endorsements and Recognition badges — only if confirmed wanted.

Starting with Phase 0 now, then Phase 1.

## Phase 0 results (completed)

All eight questions resolved by reading the API repo's routes/schema (no code changes made):

1. **Performance module**: `performance-v22` (`app/performance-v22/**`, id `performance-v22` in
   `lib/config/modules.ts`) is the real, current, non-superseded Performance module — Command Centre,
   Scorecards, Objectives & KPIs, Tasks & Projects, Reviews, Corrective Actions, Reports, Vault, Alerts,
   Access & Settings. Its own live-loaders already call `GET /api/performance/scorecards/user` — documented
   in-repo as "the signed-in user's own scorecard" — and deliberately treat a 404/500 there as "no active
   performance contract," not an error. **Decision: `/home/performance` and My Work's Performance widget
   call this same endpoint (+ `/api/performance-reviews`, `/api/performance/review-cycles` filtered to
   self) rather than building any new data model.** Also found: `home-v3` is the module id actually backing
   everything explored in Stage 1 (registered `path: "/home-v3"`, though the app actually serves it at
   `/home` — a stale `path` field in the config, harmless, not touching it). Its direct predecessor,
   `employee-hub`, is superseded and frozen — not touching `app/employee-hub/**` or `lib/employee-hub-mock/`.
2. **Market data**: `FastBullMarketDataClient.ts` only scrapes individual listed-equity quotes (symbol,
   OHLC, bid/ask) — no indices, FX, or commodities. **Confirms the gap**: News's Market Pulse (MSCI
   Frontier, ZSE All Share, USD/ZWL, Gold) has no existing data source. Staying deferred per the plan above.
3. **Events**: a full Events feature already exists — `EventService`/`EventController`, `GET/POST/PUT/DELETE
   /api/events`, `/api/events/upcoming`, plus guests/RSVP/budget/expenses/check-in/feedback/analytics/
   reports. This is clearly a corporate-events admin system (matches an "Events" entry already present in
   the app switcher). **Decision: Calendar reads/creates plain personal `Event` rows via the existing API
   (no guests/budget needed for a personal meeting) rather than building a parallel model** — and does not
   attempt to reproduce the budget/guest-management UI, which belongs to the separate Events app.
4. **"My tasks" convention**: already solved — `GET /api/tasks/my` exists (`TaskController.getMyTasks`),
   alongside `GET /api/tasks/statistics` (matches My Work's stat tiles exactly), `PUT /api/tasks/:id/stage`
   and `PUT /api/tasks/:id` for progress/stage updates, plus comments/messages/attachments endpoints for a
   task detail view. **Decision: My Work is almost entirely wiring, no new backend.**
5. **Portfolio AUM**: `GET /api/portfolio/dashboard?scope=aum` returns `aumKpis` and
   `portfolioComposition` with `historySeries`, YoY and CAGR — matches Home's Workday Snapshot chart
   (12-month range, +16.9% YoY, target line) closely. **Decision: Home's AUM tile calls this endpoint.**
6. **Payroll self-service**: `GET /payroll/employee/payslips` and `GET /payroll/employee/leave-balances`
   already exist (view-only, self-scoped) — Services' stat tiles can read these directly. **No leave-request
   submission endpoint exists anywhere** (only admin-managed balance adjustment) — confirms Services' "My
   requests" workflow (leave/IT/expense/training requests) is genuinely new ground. Staying with the planned
   small new request-tracking model rather than assuming something to aggregate.
7. **Generic service-request model**: confirmed none exists beyond the LP-portal-specific
   `LpServiceRequest` (different domain). Same conclusion as #6.
8. **AI backend**: an `LlmChatService` (+ `ChatGPTService`, `llmGlobals.ts`) already exists and is reusable
   — currently only wired into Procurement's invoice-reading/extraction, no general conversational route yet.
   **Revises the Phase 1 plan**: a real Matanho Assistant is buildable without a new dependency — just a new
   route that assembles context (tasks/calendar/notifications, matching the `aiContextSources` shape already
   in the mock state) and calls the existing service. Still scoping it as its own piece of work rather than
   a Phase-1 blocker, since it's a real feature (conversation history, context assembly) not a quick wire-up
   — proposing it as a short Phase 1b after the rest of Home ships, rather than folding it into Phase 1
   critical path.

Net effect: nearly every phase in this plan turned out to be "wire an already-built, already-scoped backend
endpoint" rather than "design new data models." The only genuinely new backend across the whole plan is:
the `HomePreference` table (Phase 1/2/8), `FocusSession` (Phase 1), the Services request-tracking model
(Phase 3), Forums' two additive fields on `Post` (Phase 6), and Profile's skills/recognition models (Phase
7, only if confirmed wanted).
