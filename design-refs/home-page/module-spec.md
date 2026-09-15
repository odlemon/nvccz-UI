# /home module — derived spec (Stage 2)

Derived by using the running app in the browser (staff portal, `proc.mgr@nts.local`), not by reading
frontend code. Backend was inspected afterward, to check what already exists. "Home Version 3" appears
in the page footer everywhere in this hub — current version label.

## Scope finding

`/home` is not two pages. Every sidebar item under Home / Communication / Work / People / Services
navigates within the `/home/*` route tree:

| Sidebar item | Route |
|---|---|
| Home | `/home` |
| Daily Cover | `/home/cover` |
| News | `/home/news` |
| Newsletters | `/home/newsletters` |
| Forums | `/home/forums` |
| Calendar | `/home/calendar` |
| My Work | `/home/work` |
| Performance | `/home/performance` |
| People | `/home/people` |
| My Profile | `/home/profile` |
| Services | `/home/services` |
| Settings | modal overlay, not a route (opens over whatever page you're on) |
| Help & Support | click registered, no visible effect — likely unwired |

The top bar (search, org/FY/role switchers, theme toggle, Apps grid, notifications, profile menu) is the
shared `components/layout/shared-topbar.tsx` per CLAUDE.md — used across all modules, not owned by /home,
except where noted below (notifications is the one piece with its own real backend already).

## Current state — everything is one client-side mock

Nearly the whole hub reads/writes a single localStorage key, `matanho-hub-state`, containing: priorities,
workTasks/workProjects, newsletterStudioPanel/Lists/Shares, apps (switcher pins), cover (theme/wallpaper),
requests (services), aiMessages/aiMode/aiScope/aiSaved/aiRecent/aiDraft, newsBookmarks, profile/profileTab/
profileSkills/profileDocuments/profilePreferences, forumComments, appAccessRequests, leaveBalance,
calendarDetailsOpen/SelectedEvent/Sources, settings, daySession (focus timer). None of it survives a
different browser/device, none of it is real per-employee state despite copy claiming otherwise (Daily
Cover: "Personalisation is stored against the employee profile" — verified false; it's localStorage only,
no network call fires on change).

The only two things already talking to a real API in this hub:
- Login/session (obviously, shared with the rest of the app)
- The notification bell → `GET/PUT /api/homepage/notifications*` (real, paginated, unread counts, mark-read)

## Backend already exists for much of this — the frontend just never calls it

`src/routes/homepageRoutes.ts` + `HomepageController.ts` (in the API repo) already expose:
- `GET /homepage` — returns real `posts` (with author + threaded `replies`), `newsletters` (with author),
  `events.upcoming` / `events.all` (with author), `onlineUsers` (presence via `User.lastSeen`), and
  `strategicAlignment` (vision statement + pillars, via `PerformanceConfigService`) — cursor-paginated.
  **The frontend never calls this endpoint.**
- `GET /homepage/online-activity` — same presence data standalone.
- Notifications CRUD (already wired, see above).

Matching Prisma models already exist (250+ models in the schema total; these are the relevant ones):
- `Post` + `Reply` (generic title/content/author, threaded replies) — no `category`/`type` field, so as-is
  it fits **Forums** almost exactly (discussion + nested replies) but not **News** (which the UI shows with
  images, source attribution, read-time, external wire sources like Reuters/Bloomberg — richer than Post).
- `Newsletter` + `NewsletterAudienceConfig` + `NewsletterSubscription` + `NewsletterTopic` — substantial
  existing support for the Newsletters page.
- `Event` + `EventGuest` + `EventBudgetItem` + `EventExpense` + `EventFeedback` + `EventCheckIn` +
  `EventReport` — very rich, well beyond what Calendar's UI currently shows. Likely already serves a
  company-events feature elsewhere; Calendar should probably consume this rather than duplicate it.
- `Task` — already has `goalId` → `PerformanceGoal`, `isPerformanceTask`, `performanceCategory`,
  `monetaryValue`/`percentValue` (+ achieved variants), `kpi` json, `team` json, `stage`, `priority`,
  `date`, `department`, `applicationId` (deal-linked), `taskMetadata` json. No single `assigneeId` — team
  membership is a json blob, needs checking against how existing consumers of Task query "my tasks."
- Full **Performance** domain: `PerformanceGoal`, `PerformanceGoalProgressEvent`, `PerformanceScorecard`,
  `PerformanceStrategy`, `PerformanceTheme`, `PerformanceContract`, `PerformanceReview`,
  `PerformanceReviewCycle`, `PerformanceReviewFeedback`, `KPI`, `ScorecardPillar`. This strongly suggests
  `/home/performance` and My Work's "Performance connection" widget should be a **personal-scoped read
  view over the real Performance domain**, not a new data model — see ownership flags below.
- `Employee`, `Department`, `User` (roleId/department already on the JWT) — People directory / Profile.
- `LeaveBalance`, `Payslip`, `EmployeeDeduction`, `PayrollAllowance`, `TrainingCourse`,
  `TrainingAssignment`, `EmployeeCertification`, and Accounting's `Expense` — cover most of the Services
  page's stat tiles and quick actions.
- No generic `ServiceRequest`/ticket model was found (only `LpServiceRequest`, which is LP-portal-specific,
  a different domain). Employee Services' "My requests" table (leave/IT/expense/training) likely needs
  either a small new model, or to route each request type into its owning workflow (leave → LeaveBalance
  adjustment flow, expense → the existing Accounting `Expense` model, training → `TrainingAssignment`) and
  show a unified view aggregated client-side. Flagged below.
- No `Skill`/`Endorsement` model found for Profile's "Skills and expertise" section — likely new.

## Page-by-page inventory

### 1. Home (`/home`)
Greeting header (name, live time, date, department), daily perspective quote, daily-scene image carousel
(prev/next, "changes automatically each day"), "Start your day" card (button — opens a focus-session flow;
state shape already implies task selection + status + timer: `daySession {active, paused, taskId, status,
durationMinutes, startedAt, pausedRemaining}`). Matanho Assistant chat panel (3 suggested-prompt chips +
free-text input + send). Workday Snapshot: period selector (Today/This week/This month), deep-work time,
momentum %, balance %, and an **Assets under management** chart with a 12-month range and target line —
portfolio data, not home-owned (see flags). Today's Priorities (checklist, "Open My Work" link). Upcoming
Schedule (next 3 calendar events with attendee avatars, "View calendar" link).

### 2. Daily Cover (`/home/cover`)
Personalisation settings: 5 "interface atmosphere" themes, 8 wallpaper choices (incl. "Daily rotation"),
live preview panel, "Reset to daily," a read-only "Workspace behaviour" info panel. Pure preferences —
should be genuinely per-employee (currently isn't, see above).

### 3. News (`/home/news`)
Editorial feed: category tabs (Top stories/Company/Markets/Investment/Technology/Africa/For you),
Saved/Sources views, "Personalise feed," article cards (image, source, category, title, excerpt, time,
read-time, save-toggle), "Trending now" rail, "Market pulse" live ticker (MSCI Frontier, ZSE All Share,
USD/ZWL, Gold), "Sources you follow" with Manage. Richest page in the hub — needs either a real
content/CMS backing (partially: `Post` is close but lacks source/image/read-time/category fields) plus a
market-data feed (an equities market-data client already exists in the API — `FastBullMarketDataClient.ts`
— worth checking if it can feed "Market pulse" before building a new integration).

### 4. Newsletters (`/home/newsletters`)
Role selector (Read only/Editor/Publisher) gating Read/Write/External-share permissions, "Open studio"
(matches `newsletterStudioPanel` state — an editor), "Create newsletter," featured issue + issue library,
newsletter lists (audiences with recipient counts, Internal/External), publishing activity
(Scheduled/Published states), readership insights (open rate, completion, audience, 12-issue trend chart).
Backend already has strong support (`Newsletter`, `NewsletterAudienceConfig`, `NewsletterSubscription`,
`NewsletterTopic`) — likely the least amount of new backend work in the hub.

### 5. Forums (`/home/forums`)
5 categories with discussion counts, filter tabs (All/Unanswered/Following/My discussions/Filter),
"Start a discussion," discussion list (title, "Solved" flag, topic, author, replies, last activity),
"Knowledge that lasts" (answered-question snippets), "Top contributors" leaderboard. Maps closely onto
existing `Post`+`Reply` plus small additive fields (category, isSolved).

### 6. Calendar (`/home/calendar`)
Day/Week/Month views, "Find a time," "Create event," calendar-source toggles (personal, My Tasks, Matanho
Company, Team — Investments, Holidays — Zimbabwe), week grid, event detail panel (location, Join meeting,
attendees, agenda, "meeting intelligence": linked files / decisions pending / attendees confirmed). Real
`Event` model already exists and is richer than this UI (Guest/Budget/Expense/Feedback/CheckIn/Report
sub-models) — check for an existing events feature elsewhere in the app before building a parallel one.

### 7. My Work (`/home/work`)
Quarter selector, "New task," stat tiles (open/due-today/completed/avg progress), search + status filter,
Projects rail (with per-project open-count/status/%), 3 view tabs (My work/Projects/Teams — Teams
unverified, likely a secondary view), task list grouped by Due now / This week / Completed (empty state
present), each task: title, project, priority, owner, due date, progress-% dropdown, "Open task." Sidebar:
"Performance connection" (goal/department-objective/company-goal % with a "Scorecard" link) and "Balanced
scorecard" (4 quadrants + "Open balanced scorecard"). "Southern Africa Expansion roadmap" milestones tied
to tasks. `Task` already has `goalId`→`PerformanceGoal` — this page and Performance should share data, not
duplicate it.

### 8. Performance (`/home/performance`) — "My Performance"
Quarter selector, tabs (Overview/Scorecard/Goals/Feedback/Development — only Overview inspected in depth),
"Balanced scorecard" + "Prepare review" actions, quarterly narrative with overall score vs last quarter,
score-movement chart, 4 KPI cards (goal progress/on-time delivery/project contribution/scorecard trend,
each trended over months), goal portfolio (4 goals: weighting/evidence-count/%/priority), contribution map,
capability/competency breakdown, feedback timeline (peer comments), review-readiness checklist, 5-quarter
score history, next scheduled review. **This duplicates a large surface with what CLAUDE.md describes as an
existing separate Performance module** (mentioned there re: a "Reviews / Reports / Enterprise Risk
Register" tab-switching bug) and the schema's full Performance domain. High-priority ownership question —
see flags.

### 9. People (`/home/people`)
Directory stats (128 employees/8 teams, availability, locations, skills), search + team/location filters,
"Import"/"Add person" (admin actions), employee list (avatar, contact, role/team, live availability status,
key expertise, performance indicator), detail panel (message/schedule, tenure, reports-to with org-chart
link, current projects, skills, contact, "Send message"). Employee data should come from the same
`Employee`/`User`/`Department` records every other module already uses — must not become a second employee
database.

### 10. My Profile (`/home/profile`)
Tabs (Overview/Experience/Goals/Preferences/Documents — only Overview inspected in depth), photo, verified
badge, availability-status toggle, profile-completeness meter, About, Skills & expertise (with peer
endorsement buttons — no backing model found, likely new), Recent contribution chart, Current focus (tasks
linked to goals, "Open My Work"), Recognition (awards/badges — no backing model found), "This week" activity
heatmap, Organisation path (manager chain), Personal shortcuts (Payslips/Leave balance/Benefits/Learning —
all point at Payroll).

### 11. Services (`/home/services`) — "Employee Services"
"Request leave" primary action, search, 4 stat tiles (leave balance, latest payslip, pending expenses,
learning hours YTD — all Payroll/Accounting-owned data), "Browse services" grid (Leave & Time / Payroll &
Pay / Expenses / Learning / Travel / IT Support / Facilities), "My requests" table (id/service/submitted/
owner/status/next-action), "Matanho AI Concierge" mini-chat with FAQ chips, "Quick actions" list. See the
no-generic-ServiceRequest-model note above.

### 12. Settings (modal, any page)
Appearance (language, timezone, interface density, profile visibility, an "OLED colour intensity" slider),
Experience toggles (frosted surfaces, interface motion, daily Japandi scene, "Improve Matanho" analytics
opt-in), Notifications toggles (calendar reminders, news digest, forum mentions, performance reminders —
confirmed 4 from state, only partially seen visually). Should genuinely persist per-employee.

### 13. Help & Support
Sidebar button registers a click but produces no visible change on top of whatever page is open — needs a
second look (possibly a not-yet-wired modal, same pattern as Settings).

## Workflows (multi-step, implied by the UI)

1. **Start your day** → pick a task → set status → start a focused timer → (presumably) pause/resume/end,
   surfaced back on Home. Not yet exercised end-to-end.
2. **Daily Cover personalisation** → pick theme + wallpaper → applied instantly → should persist to the
   employee's profile, currently doesn't survive past this browser's localStorage.
3. **Task progress** → change % on a task in My Work → should reflect in project %, goal %, and (per the
   schema link) the linked `PerformanceGoal`'s progress.
4. **Newsletter publish** → draft in Studio → assign to a list → schedule/send → appears in Publishing
   activity → readership insights populate after send.
5. **Forum discussion** → start a discussion → replies thread → marked Solved → contributes to Top
   contributors.
6. **Service request** → Employee Services quick action (e.g. Request leave) → creates a row in "My
   requests" → status progresses (Pending → In progress → Completed) → next-action updates.
7. **Performance review cycle** → goals tracked through the quarter → feedback accumulates → review
   readiness reaches 100% → "Prepare review" → scheduled review meeting.
8. **Matanho Assistant** (appears on both Home and Services, as "Concierge") → suggested prompt or free
   text → response → (state has `aiSaved`/`aiRecent`) can be saved/revisited.

## Ownership / dependency flags — needs a decision before Stage 3 backend design

These are the calls the brief says not to make silently:

1. **Portfolio AUM chart (Home's Workday Snapshot)** — Assets under management, +16.9% YoY, 12-month
   range. This is Portfolio module data. Should `/home` call Portfolio's existing API for this, or does
   Portfolio not yet expose a summary endpoint suited to a dashboard tile? Recommend: aggregate, don't own.
2. **`/home/performance` vs the existing Performance module** — the schema already has the full domain
   (goals/scorecards/reviews/KPIs) and CLAUDE.md references a separate Performance module elsewhere in the
   app. Building `/home/performance` as its own data model would directly duplicate that. Recommend: a
   personal-scoped read view (+ light actions like "Prepare review") over the real Performance API, but
   this needs confirming — I haven't opened the standalone Performance module to compare surfaces.
3. **My Work's goals/scorecard sidebar** — same call as #2, and it's the same widget content, so whatever
   is decided for #2 should apply here too, consistently.
4. **Calendar events** — real `Event` model already has budget/expense/feedback/check-in/report
   sub-entities that go well beyond a personal calendar. Is there already a company-events feature
   consuming this elsewhere? If so, Calendar should read the same data rather than fork it.
5. **People directory + Profile's employee data** — must read the same `Employee`/`User`/`Department`
   records Payroll, Procurement etc. already use. Not in question that it should aggregate — just flagging
   so it isn't accidentally built against a fresh table.
6. **Services stat tiles (leave balance, payslip, pending expenses, learning hours)** — all Payroll/
   Accounting data. Aggregate, don't own. The "My requests" workflow itself (leave/IT/expense/training
   requests as a unified list) is the one piece that may need a small home-owned model or a
   request-router pattern — flagged above, needs a decision.
7. **News "Market pulse" (MSCI Frontier, ZSE All Share, USD/ZWL, Gold)** — external market data. API
   already has `FastBullMarketDataClient.ts` for listed-equity data; unclear if it covers indices/FX/
   commodities too or only individual equities. Needs checking before deciding build-vs-reuse.
8. **News content itself** — richer than any existing model (images, external wire sources, read-time).
   Is a full editorial CMS actually wanted, or should News launch v1 as a lighter internal-announcements
   feed (reusing `Post`) with the wire-service/market-intelligence styling scoped down or deferred?
9. **Profile Skills/endorsements and Recognition/badges** — no backing model found anywhere in the schema.
   Confirms these are new, but worth confirming they're wanted as real features (not decorative) before
   building endorsement/badge data models.

## Exploration method note

Given the size of this hub (13 full pages, each substantial), Stage 1 was one thorough pass across every
page plus backend reconnaissance, rather than two complete passes before reporting anything. Left for a
second, targeted pass (rather than repeating everything already covered): the Settings modal's
Notifications section (partially seen), Help & Support (unclear if wired), the topbar Apps/Modules
switcher grid and Matanho AI panel, Profile's Experience/Goals/Preferences/Documents tabs, My Work's Teams
tab, and exercising the actual click-through workflows listed above (Start your day, task completion,
newsletter send, forum post, service request) rather than just reading their static state shape. Plan is
to fold that second-pass depth into Stage 4's per-phase verification for whichever phase touches each area,
rather than doing it twice up front — flagging this now in case you'd rather it happen before Stage 3
planning instead.
