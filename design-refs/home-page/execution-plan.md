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

## Phase 7 — People + My Profile — done, verified live

No new backend needed — `GET/PUT /users`, `GET /users/:id` already covered everything (confirmed:
`PUT /users/:id` isn't permission-gated the way user *creation* is, so a self-service edit form
needed no new endpoint, just care about which fields it's allowed to touch — see below).

**People directory**: rebuilt on the real directory (`GET /users`) in place of the static fixture.
Dropped every column/stat with no real source — hardcoded tiles (128 employees, 32 "available now",
4 locations, 46 skills), a live-presence status dot, per-row "expertise" chips, and a fabricated
performance score per colleague (there's no cheap, list-friendly per-person score endpoint; Phase 5's
own scorecard read is already a heavier single-user call). Search and the department filter are both
real and state-driven — search used to just hide/show DOM rows with no backing state, which couldn't
have coordinated with a second filter even if one had existed.

**My Profile**: Overview's three cards that used to carry their own invented numbers ("Recent
contribution" — a fake 6-month chart; "Current focus" — 3 hardcoded fake projects; "This week" — fake
per-day availability dots) now reuse real data already loaded elsewhere this build instead — Performance
(Phase 5), My Work's open tasks, and Calendar's own week computation. The Goals tab reuses the exact
same `D.performanceOverview` Phase 5 already verified live (real score/weight/status per goal, honest
empty state), replacing four hardcoded fake goals.

Skills/Recognition dropped per this section's own default. Experience (fake career history, fake
education, fake professional credentials), Preferences (every field only ever wrote to local state —
"Edit preferences" had no server call behind it at all) and Documents (fake file list) tabs are
dropped outright rather than kept as fake placeholders: no real model backs any of the three, and
"profile tabs live... as found necessary" was this section's own hedge for exactly this call.

Edit profile now actually calls `PUT /users/:id` instead of writing to local state and toasting a fake
success. Deliberately narrowed to `firstName`/`lastName`/`email` — the same endpoint also accepts
`department`/`roleCode`/`roleId`, but those are privilege-bearing on the real `User` model (they
determine what the app lets someone do) and this is a self-service "edit my profile" form, not a
user-management screen, so it never sends them. Worth flagging since it was found in passing: that
endpoint has no permission gate at all beyond plain authentication — unlike user *creation*
(`POST /users`, `manage_users`-gated), any authenticated user could currently update *any other* user's
name, email, department or role via a direct API call. Pre-existing, not introduced by this build, and
out of scope for a `/home` module pass to fix — noting it here rather than acting on it.

Verified live: directory search and department filter both against real data (searching "procurement"
correctly returned exactly the three real Procurement staff, with the department dropdown itself built
from the real distinct set). Edited the signed-in persona's own name, confirmed the change via a
separate `GET` request (not just the optimistic local render) and that the privileged fields
(`department`/`roleCode`/`role`) were untouched by the edit, then reverted the test edit — this was a
real, already-existing user record, not a test row created for this phase, so restoring it rather than
deleting it was the right cleanup.

## Phase 7b — Matanho AI panel: real LLM wiring — done, verified live

Out-of-sequence, user-directed addition between Phase 7 and Phase 8: make the AI panel actually work
rather than leaving it for the Phase 8 second pass. Requested reuse of the same LLM wiring the
portfolio module already uses rather than adding anything new.

**Backend**: new `POST /api/assistant/chat` (`src/controllers/AssistantController.ts` +
`src/routes/assistantRoutes.ts`, authenticated). Thin wrapper over the existing generic
`LlmChatService.chatCompletion()` — the same service/config (`LLM_API_KEY` / `LLM_API_BASE_URL` /
`LLM_MODEL`, falling back to the hardcoded DeepSeek default in `src/config/llmGlobals.ts` when unset)
already used elsewhere. Prepends a system prompt naming the signed-in user and today's date, scoping
the assistant to the Matanho platform, and telling it to admit honestly when it doesn't have live
access to the user's actual tasks/calendar/performance/documents rather than inventing details. No
conversation-thread persistence exists anywhere in the schema, so the client resends a capped slice of
prior turns (last 20) as history each request; prompt length is capped server-side too.

**Frontend**: `aiRespond()` in the vendored runtime (patched via the new
`scripts/patch-home-v3-assistant.mjs`, "0 missed") no longer answers synchronously from the old
keyword-matching `aiAnswerFor()` FAQ bot. It now pushes a "Thinking…" placeholder immediately and fires
`matanho:assistant.message.sent`; the host (`home-v3-app.tsx`) calls the new `sendAssistantMessage()`
action (`lib/home-v3/actions.ts`), which posts to `/assistant/chat` with the prompt and mapped history.
This is the first deliberate exception to this build's "no hydrate() API, so reload after writes"
pattern: a chat reply has no optimistic placeholder to fall back on and a reload would destroy the
conversation, so the runtime now exposes a `receiveAssistantReply(text, isError)` method the host calls
directly to swap the placeholder for the real reply (or an error) in place, no reload. `aiSources()`
also dropped the fake flat `count:8` "Documents" tile (no document-repository concept exists anywhere
in this build) and now reflects the real Forums/News/People counts already loaded by Phases 6-7,
instead of the unused mock fixture arrays.

Known gap, by design: the "N sources connected" sidebar toggles are decorative only — no real
retrieval/context-injection was built, so toggling a source doesn't actually restrict or expand what
the assistant can discuss. The system prompt instead tells the model plainly that it doesn't have that
access. Building real per-source context assembly (RAG over the user's actual tasks/calendar/posts)
would be a much larger project; this pass was scoped to "make the panel actually respond for real"
rather than that.

Verified live: confirmed the backend chain end-to-end via a direct authenticated fetch before touching
the frontend at all (route → controller → `LlmChatService` → DeepSeek → real reply), then through the
UI — sent "What is Matanho, in one sentence?" from the top composer, confirmed the "Thinking…"
placeholder appeared immediately, confirmed `POST /api/assistant/chat` fired and returned 200 with a
real (non-canned) answer, confirmed it replaced the placeholder in place with no reload and the thread
auto-scrolled. Sent a second message in the same thread ("Can you repeat back the exact question I just
asked you?") and confirmed the reply correctly quoted the first question back, proving history is
resent and the model has real continuity across turns, not just single-shot Q&A.

## Phase 8 — Settings, Help & Support, and the second pass — done, verified live

**Settings**: `home_preferences.settings` was already a reserved-but-unused JSON column (added
alongside Phase 2b's wallpaper work, never read or written by anything) — no migration needed, just
extended `GET/PUT /homepage/preferences` to read/write it as an opaque blob. The Settings form's
submit handler was local-state-only (saved to `localStorage`, toasted a fake success, no
`emitIntegrationEvent` call at all, unlike its theme/wallpaper/rotation siblings) — now fires
`preferences.settings.updated`, and `state.settings` is seeded from the real saved value on mount
(same technique already used for Daily Cover) instead of always starting from the runtime's
hardcoded defaults.

**Notification-preference enforcement**: the four toggles under Settings' "Notifications" section
(`calendarAlerts`/`newsDigest`/`forumMentions`/`performanceReminders`) previously did nothing
server-side — no code anywhere checked them. Added `NotificationPreferenceService
.filterUsersByNotificationPreference()` and wired it into the five notification-creation call sites
that map cleanly onto one of the four (new event; new post, split News vs Forums by the post's
`category` — the same truthy/falsy split the frontend already uses; new newsletter; performance
review deadline alerts; goal reminders/achievements). A user with no saved preference row — i.e.
anyone who's never opened Settings — still gets notified (fail open), so this can't silently go
quiet for the entire existing user base. Deliberately did *not* touch task-assignment notifications
or any procurement/FP&A/vendor-alert notifications — none of those map to a Settings toggle, and
gating them would be inventing behavior the UI never promised.

**Help & Support**: dropped two dead elements rather than half-wire them — the search box (no `id`,
nothing ever read it) and the "How-to guides" card (no `data-service`/`data-action`; no FAQ/help-
article concept exists anywhere in the schema or backend, and building a small content-authoring
system for one card felt like exactly the kind of scope this pass shouldn't invent). "IT support",
which already routes through the real Employee Services request flow from Phase 3, is unchanged.

**Apps grid**: the old `appsView()` was an elaborate, fully-fabricated app marketplace — pinned
apps, "recently used" with literal hardcoded relative timestamps ("2 hours ago", "Yesterday", ...),
a full access-request approve/pending workflow with its own modal and drawer, category filters, a
marketplace callout — none of it backed by any real model, and the real permission system
(`hasModuleAccess`) is a plain per-module yes/no, not an approval queue, so "request access" had
nothing real to mean. Replaced with a plain grid sourced from `getSwitcherModules()` +
`useRolePermissions()` — the exact same real, permission-filtered list the header's own "Modules"
switcher already uses — dropping the fake sections rather than keeping them as placeholders (same
call as Phase 7's dropped profile tabs). First pass made every tile open in a new tab; live-tested
that against the real `AppSwitcherDropdown` and found it was wrong — the real switcher only does
that for a genuinely external portal (`externalPortalUrl` set), and same-tab-navigates
(`window.location.href`) for an internal module, since that's just another route in this same
Next.js app, not a separate app. Fixed to match exactly.

**org/FY/role switchers, the topbar's own Apps icon, and its hardcoded notification badge**: found
to already be a non-issue rather than something to build or remove — `renderTopbar()`'s entire
markup (entity/year/role `<select>`s, a second "apps" icon with no click handler at all, a
notification bell with a literal hardcoded "4") is unconditionally `display:none!important`'d by
`home-v3-overrides.css` ("Kill the HTML mock topbar under SharedTopbar"), added in an earlier phase
because the real outer layout's own topbar (search, the real "Modules" switcher, real notification
count, real user menu) already covers all of it. Confirmed via the live DOM (`getComputedStyle`)
rather than assumed — the elements exist but have zero rendered size and `visibility:hidden`. No
code change; noting it here so it isn't mistaken for unfinished work in a future pass.

**My Work's Teams tab**: verify-only, per the plan — confirmed still real (Phase 5's
`loadTeamRows()`, org-wide task aggregation per person), showing actual people with actual open-task
counts and progress on a fresh load.

**Known gap, by design**: `language`/`timezone`/`profileVisibility` and the "Improve Matanho" usage-
analytics toggle now persist for real (round-trip survives a reload) but don't drive any actual
behavior anywhere in this build — no i18n, no timezone-aware rendering, no analytics pipeline exist
to hook them into. That's honest persistence of a real user choice, not fake data; it just isn't
wired to a consequence yet, same as `density`/`saturation`/`glass`/`motion`/`autoHero` already were
before this phase (those four do drive real CSS).

Verified live: toggled `calendarAlerts` and `forumMentions` off via the real Settings modal,
confirmed the `PUT /api/homepage/preferences` response echoed the change, reloaded the page fresh
and confirmed both toggles were still off (real persistence, not optimistic-only). Verified the
notification-preference filter directly against real users (one with the toggle off, one on, one
with no preference row at all) — correctly excluded only the one with it explicitly off. Reverted
the test toggles back afterward. Confirmed the Help & Support modal now shows only the real "IT
support" card. Confirmed the Apps page renders the same six real modules as the header's "Modules"
dropdown, and that clicking one same-tab-navigates to the real module (tested Performance
Management, landed on its real dashboard).

## Phase 9 — Matanho AI panel: real per-source context injection (RAG) — deferred until after Phase 8

Deferred, user-directed follow-up to Phase 7b. The "N sources connected" sidebar toggles (My Work,
Calendar, Forums, News, People) are currently decorative — Phase 7b wired the panel to a real LLM but
scoped that pass to "make it respond for real" rather than giving it live access to the user's actual
data; the system prompt just tells the model honestly that it doesn't have that access. This phase
closes the gap: retrieve the signed-in user's real tasks/calendar/performance/posts/directory data
server-side, assemble it into context the model can actually reason over, and make the source toggles
and the composer's scope selector ("All connected work" / "My work only" / "People and knowledge")
actually control what's included rather than being inert.

Explicitly deferred until the rest of this module (Phase 8 and any remaining second-pass items) is
fully done — do not start this before then without the user re-confirming.

**Scope to work out during that phase's own audit** (not designed yet): which sources are cheap enough
to always include vs. need on-demand retrieval; how the composer's scope selector should narrow
context; whether per-source toggles gate retrieval or just presentation; token-budget limits so context
assembly doesn't blow past the LLM's context window for a user with a lot of open tasks/history.

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
