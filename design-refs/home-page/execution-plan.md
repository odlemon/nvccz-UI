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

## Phase 4 — Calendar (`/home/calendar`)

**Backend**: depends on Phase 0's finding. If a company-events feature already exists, Calendar reads it
(no new writes needed beyond what already exists); if not, a dedicated range-query endpoint (week/month) +
create-event on the existing `Event` model.
**Frontend**: week grid from real data, Create event form that persists, event detail panel wired to real
attendees/agenda where that data exists (agenda/meeting-intelligence fields may not exist on `Event` yet —
scope down honestly rather than fake it if so).
**Verify**: create an event, reload, see it; confirm visibility is properly attendee-scoped, not global.

## Phase 5 — My Work + Performance (`/home/work` + `/home/performance`)

Grouped because `Task.goalId` already links them, and because the ownership call (#2/#3) affects both
identically.

**Backend**: "my tasks" list/filter/progress-update on the real `Task` table (per Phase 0's team-membership
convention). Performance: per Phase 0's finding, either point at the existing Performance module's API
(preferred if it exists — avoids a second source of truth) or, only if nothing exists yet, build a
minimal personal-scoped read over `PerformanceGoal`/`PerformanceScorecard`/`KPI`.
**Frontend**: task list/filters/progress (persisting), Overview tab of Performance first; Scorecard/Goals/
Feedback/Development tabs as a follow-up sub-phase if Overview alone is large (will report before
splitting further).
**Verify**: complete a task, confirm project % and linked goal % move together; Performance numbers match
whatever the source of truth turns out to be, not a second, drifting copy of it.

## Phase 6 — News + Newsletters + Forums

**Backend**: Forums on `Post`+`Reply` plus two additive fields (`category`, `isSolved`) — cheapest of the
three. Newsletters on the existing `Newsletter`/`NewsletterAudienceConfig`/`NewsletterSubscription`/
`NewsletterTopic` models — mostly wiring. News: default to v1 as an internal-announcements feed on `Post`
(title/content/author/time), with the wire-service styling (external sources, images, read-time, Market
Pulse ticker) deferred and reported as a scoping decision at the start of this phase rather than assumed —
it's a materially bigger build (real editorial content + external market-data integration) than the rest of
the hub.
**Frontend**: wire all three list/detail/create flows.
**Verify**: post a forum discussion + reply, live; publish a newsletter to a real list, appears for
recipients; News feed shows real posts, not the current static article mocks.

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
