# Performance module UI polish — agent handoff

> **Status:** In progress. Next agent should **read this file fully**, then **wait for the user’s next crop / instruction**. Do not invent a full-page redesign without a reference crop.
>
> **Date:** 2026-07-25  
> **Owner context:** Client follow-up UI finals → mock screens under `components/performance-mock/`. API re-wire is **later**, not now.

---

## What we are doing

We are **redesigning, refining, and polishing** the Performance Management module UI against **client inspiration screenshots**, one section / component at a time.

| Mode | Details |
|---|---|
| Data | Hardcoded fixtures / interactive mock only — **no live API wiring** in this phase |
| Shell | Performance mock sidebar + Arcus-style topbar |
| Source of truth | User-pasted crops + files under `design-refs/performance-ui-followup-pages/` |
| Process | User sends a crop → match layout, spacing, colors, inner components, interactivity → user verifies → next crop |

This is **not** a greenfield rewrite of the whole module in one pass. It is **crop-driven polish**.

---

## Background (why mocks)

1. Live module existed (API + Redux) — snapshot: [`performance-module-current-state.md`](./performance-module-current-state.md).
2. Client sent follow-up UI finals — index: [`performance-followup-ui-index.md`](./performance-followup-ui-index.md).
3. Screens were rebuilt as **hardcoded interactive mocks** under `components/performance-mock/`.
4. Known style deviations vs Arcus pills: [`performance-ui-mock-deviations.md`](./performance-ui-mock-deviations.md).
5. **Now:** pixel-level polish against crops, starting with the **Performance Dashboard** (`/performance`).

---

## Process the user expects

1. User pastes a **cropped screenshot** of the next piece (header, cards, chart, etc.).
2. Agent matches **exactly**: layout positions, radii, colors, icons, charts, labels, filters.
3. Controls on that piece must be **interactive** (dropdowns, tabs, toasts, in-page view switches) where the crop implies it.
4. Agent reports briefly; user verifies in the browser themselves (**do not** run Playwright / browser automation unless asked).
5. Repeat for the next crop.
6. **Do not** jump ahead and redesign unrelated screens without instruction.

### Rules of engagement

- Prefer matching the **client crop** over generic dashboard aesthetics.
- Sample colors from the crop when possible (`#7C3AED` purple family is primary).
- Buttons / chips on these mocks often use `rounded-lg` (PDF match) — see deviations doc; do not blindly force Arcus `rounded-full` if the crop shows otherwise.
- Keep density consistent with the denser Performance mock shell (sidebar ~212px, tighter padding).
- After implementation: verify twice (re-read changed files + grep/trace the interaction path) before claiming done.
- If FE needs BE later: write/update `design-refs/*-backend-asks.md` — not relevant while still on mocks.

---

## Detail quality bar (mandatory — match Antigravity-level polish)

The user switched to **Antigravity** for later dashboard sections after earlier work felt too “approximate.” **That level is now the expected bar for every crop.** Do not ship a “close enough” layout.

### What “paying attention to detail” means here

| Layer | Do this | Don’t do this |
|---|---|---|
| **Layout** | Match crop structure: left rail vs right stack, legend position, nested mini-cards, icon+number+label rows | Dump the same content into a generic list / progress strip |
| **Typography** | Exact hierarchy from crop (`text-[16px] font-bold` titles, `10px` uppercase labels, muted secondary) | One size / weight for everything |
| **Color** | Sampled greens/ambers/reds (`#4EBA6F`, `#F3A022`, `#E05353`), soft indigo connectors (`#C7D2FE`), lavender icon wells | Generic Tailwind green-500 / purple-500 everywhere |
| **Charts** | Soft area fills, dotted grids, hollow vs filled dots, % labels on/under points, white % inside donut slices | Bare Recharts defaults |
| **Icons** | Crop-specific glyphs (custom SVG if Lucide doesn’t match); circular soft wells | Wrong Lucide icon in a square badge “near enough” |
| **Interactivity** | Real dropdowns, in-page tabs, dialogs that mutate counts, hover/shadow on rows, toasts | Toggle-only chips, dead links, or navigate away when crop is in-page |
| **Inner components** | Nested bordered cards, dashed vertical connectors, timeline dots + rails, status pills, footer icon+stat rows | Flat text + one progress bar |

### Reference implementation on this dashboard (Antigravity-continued polish)

Study `components/performance-mock/screens/dashboard-screen.tsx` end-to-end. Notable patterns already on the page:

1. **Metric cards** — left circular badge, muted `of`, tonal trends, area sparklines with vertex dots.
2. **Trajectory** — gradient area, dotted grid, Actual/Target legend, range select, point labels.
3. **Performance health** — donut with white in-slice `%`, score in hole, side legend, divider, footer Goals/KPIs/CA icon stats.
4. **Strategy execution** — dashed vertical connector + Building/Network/User nodes + three nested goal cards with title + colored %.
5. **Priorities & exceptions** — bordered rows with tinted icon circles, bold count, chevron; opens **modals** (resolve CA / approve timesheet / reviews) that update live counts.
6. **Team performance** — nested rows: name · % · bar · “On track/At risk” status text in bar color.
7. **Projects & delivery** — icon + project name, owner text, progress % + purple bar, status pill.
8. **Review cycle** — radial + employees/pending/due list + full-width purple CTA.
9. **Upcoming** — bordered timeline cards with hollow purple dots + connector line + chevron.

### Before claiming a crop is done

1. Re-open the user’s crop and the code side-by-side (mental or image).
2. Check: spacing, nesting, icons, colors, labels, hover, and click behavior.
3. If anything is “sort of like the crop,” **fix it** before responding — don’t ask the user to catch it.

---

## Current focus: Performance Dashboard (`/performance`)

**Screen file:** [`components/performance-mock/screens/dashboard-screen.tsx`](../components/performance-mock/screens/dashboard-screen.tsx)  
**Full-page inspo:** `design-refs/performance-ui-followup-pages/14-performance-dashboard.png`

### Done in this polish pass (so far)

| Piece | What was matched |
|---|---|
| **Header layout** | Title + subtitle on their own row (left). Second row: pill tabs **Dashboard \| KPI Analytics** + Company / Month / Year filters on the **left**; **Export snapshot** on the **right**. Not jammed into `PmPageHeader` actions. |
| **Breadcrumb** | Removed `"Performance Management › Dashboard"` from this page (user asked to remove it). |
| **Filters** | Real interactive `PmFilterSelect` dropdowns (Company, Month, Year). Export shows a toast with filter context. |
| **KPI Analytics tab** | **In-page view only** — embeds `KpiAnalyticsMockScreen` with `embedded` prop. **Does not** navigate to `/performance/kpi-analytics`. Duplicate chrome/tabs hidden when embedded. |
| **Metric cards strip** | Left lavender circular icon badge; label → value → trend; muted `of` in values like `18 of 24`; per-card trend colors (green / gray / amber / red); custom SVG icons matching crop glyphs. Cards clickable (analytics tab or related routes). |
| **Card sparklines** | Purple line + **dot on every vertex** + soft **purple→transparent area fill** under the line (~16 points). |
| **Performance trajectory chart** | Soft purple area under Actual; dotted horizontal grid; Y 0–100 with `%`; Actual solid + filled dots + % labels **under** points; Target dashed + hollow dots + final **82%** above; centered legend; interactive **6 months** (3 / 6 / 12) dropdown. Data: Jan–Jul 58→78 actual, target ending 82. |
| **Performance health** | Donut + white slice labels, center score, side legend, Goals / KPIs / Corrective footer with circular icons (Antigravity polish). |
| **Strategy / Priorities / Team** | Nested cards, dashed hierarchy rail, exception rows + **interactive dialogs**, team rows with status text (Antigravity polish). |
| **Projects / Review cycle / Upcoming** | Table with project icons, radial review card, timeline cards with connectors (Antigravity polish). |

### Reports sidebar + Report Builder (`/performance/reports`) — polished 2026-07-26

**Files:**
- [`lib/performance-mock/nav.ts`](../lib/performance-mock/nav.ts) — Reports collapsible group
- [`components/performance-mock/shell.tsx`](../components/performance-mock/shell.tsx) — per-group active + query-aware children
- [`components/performance-mock/screens/reports-screen.tsx`](../components/performance-mock/screens/reports-screen.tsx) — builder + sibling list views
- [`app/performance/reports/page.tsx`](../app/performance/reports/page.tsx) — Suspense for `useSearchParams`
- Inspo: `design-refs/performance-ui-followup-pages/08-report-builder.png`

| Piece | What was matched |
|---|---|
| **Sidebar Reports group** | Collapsible **Reports** with children Performance Reports / Ad-hoc / Scheduled / Report History; lavender active child; purple parent when any child active; **ChevronUp** when expanded; auto-expand when route matches. Query views: `?view=adhoc\|scheduled\|history`. Configuration remains its own group (no cross-light). |
| **Builder shell** | Breadcrumb + Preview/Save/More/Schedule&publish; editable title + Draft; owner/period/audience; Content → Recipients → Schedule chevron stepper; outline \| editor \| settings columns; sticky footer (autosave, zoom, Generate draft, Continue). |
| **Executive summary** | Toolbar, four KPI cards + sparklines, purple labeled area chart, Highlights + Areas requiring attention, section settings (sources, dept, AI, comparison, reviewer, branding, report checks). |
| **All outline sections** | Dedicated UIs: Strategy cascade, KPI variance table, OKR cards, Team ranking, Corrective actions list, Risks & editable recommendations. Outline eye-toggle / add section / templates mutate state. |
| **Recipients / Schedule** | Search/add/remove, groups, To/Cc roles, formats, live delivery summary; one-time/recurring, date/time/tz, channels, publish toggle, readiness; Preview dialog + Generate draft toasts; state preserved across steps. |

**Intentional deviations vs crop**
- Action buttons use Arcus `rounded-full` pills (workspace rule) even where the crop looks slightly squarer.
- Sibling report list views are query-backed mocks (no dedicated routes / backend).

### Teams workspace (`/performance/tasks?tab=teams`) — polished 2026-07-26

**File:** `components/performance-mock/screens/tasks-screen.tsx` → `TeamsWorkspaceTab`  
**Inspo:** user crop (Teams workspace)

| Piece | Matched |
|---|---|
| **Header CTA** | **Team work** auto-selected on Teams tab; **+ Create team** purple pill (replaces New split) |
| **Stats** | Active teams 8 · Team members 64 · Capacity used 78% donut · Overallocated 5 (red) |
| **Filters** | Search teams/people · Department / Team lead / Availability / Skill · Cards \| Directory toggle |
| **Team cards (3-col)** | Lead avatar, status pill, overlapping avatars +N, members/tasks/capacity, segmented On Track/At Risk/Off Track/Not Started bar, Current projects + Next due, Open team |
| **Workload overview** | Member table with capacity % + Good / Over capacity pills + pagination |
| **Right rail** | Capacity by team bars + Optimal 80% line · People needing attention · Upcoming leave (blue day chips) · Unassigned tasks (badge 4) + View and assign |

### My Tasks Calendar (`/performance/tasks?view=calendar`) — polished 2026-07-26

**File:** `components/performance-mock/screens/tasks-screen.tsx` → `MyTasksCalendarView`  
Stays on **My tasks** tab (Board | List | **Calendar**). Matches original calendar composition (not a stripped full-bleed grid).

| Piece | Matched |
|---|---|
| **Header** | Title **My tasks** · subtitle “Plan your week and protect focus time.” · **+ New task** |
| **Stats** | Tasks this month 26 · Due this week 8 · Overdue 3 · Focus capacity 72% donut |
| **Toolbar** | Search · Project / Priority / Status / Linked goal · Board \| List \| Calendar (lavender active) |
| **Chrome** | Today · ‹ › · July 2026 · Month / Week (lavender active) |
| **Layout** | Calendar grid (~75%) + **Selected day** right rail (~25%) |
| **Selected day** | Date label · checkbox task cards (hours / owner / priority) · Day capacity 6.5h/8h · Focus blocks · Upcoming deadlines · Sync calendar |
| **Legend** | Priority glyphs + project colour dots |

### Integration Mapping filters (`/performance/configuration/integrations`) — polished 2026-07-26

**File:** `components/performance-mock/screens/integrations-screen.tsx`

| Piece | What was matched |
|---|---|
| **Filter pills** | `rounded-full` · lavender circular icon well (`#F5F3FF` / `#7C3AED`) · stacked label + value · chevron |
| **Source Type** | **Zap** lightning icon (crop callout) |
| **Search** | Full-width pill input · placeholder “Search mappings by name or field...” |
| **More filters** | Circular icon-only Filter button |
| **Header actions** | Refresh / Export / Add Mapping as `rounded-full` (Arcus pills) |

### Not yet polished (awaiting crops)

- Further tweaks the user calls out on any dashboard / objective / project / reports / teams / calendar section
- Other Performance routes — only when the user says so / sends crops

### Objective detail (`/performance/goals/[id]`) — polished 2026-07-26

**File:** `components/performance-mock/screens/objective-detail-screen.tsx`  
**Inspo:** user crop + `design-refs/performance-ui-followup-pages/02-objective-detail.png`

Matched:
- Breadcrumb `Goals / Objective detail` (purple) · period + team filters · Update check-in · More
- Title + meta strip with dividers (owner · On Track · 78% Progress · due · High Confidence)
- Strategy path banner (lavender) Target/Shield icons + arrows
- Left 8 / right 4 grid
- KR rows: numbered circles, progress, Current of, owner, confidence, dates, Open + ⋮ (always visible)
- Milestones: dashed timeline, green check / purple clock, file chips
- Linked projects table
- Sidebar: Latest check-in, Health signals (ring / green check / calendar), Contributors, Activity icons + dates, View goal history

### Project Workspace (`/performance/tasks/projects/[id]`) — polished 2026-07-26

**File:** `components/performance-mock/screens/project-workspace-screen.tsx`  
**Inspo:** user crop + `design-refs/performance-ui-followup-pages/03-project-workspace.png`  
**Patterns reused:** My Tasks board cards (`tasks-screen.tsx` TaskCard) — category tags, progress on In Progress, green check on Done

Matched:
- Breadcrumb `Tasks & Projects / …` (purple) · Commercial Team · avatars · Share · + Add task
- Tabs with icons: Overview | Board | Timeline | Workload | Files
- **Layout lesson (same as Objective detail):** `xl:grid-cols-12` from **title** — left `col-span-9` (title → stats → path → board), right `col-span-3` sidebar tops with title
- Alignment path: lavender `w-fit` / `inline-flex` (does **not** stretch full width) — Target / Shield / Target
- Stats: ring + % Complete · N of M Tasks · due · project lead
- Board filters + Group by + board/list toggle; Clear filters always visible
- Kanban: soft gray columns, colored status dots (Backlog/In Progress/In Review/Done), `ProjectTaskCard`, + Add task
- Right rail: Project health (check / warning icons) · Team workload · Next milestone · Recent activity · Project time

### Weekly Timesheet (`/performance/timesheets`) — polished 2026-07-26

**File:** `components/performance-mock/screens/timesheets-screen.tsx`  
**Inspo:** user crop + `design-refs/performance-ui-followup-pages/05-weekly-timesheet.png`

Matched (interactive):
- Hour cells: white bordered boxes; active = purple border; empty / weekend empty = `–`
- Sat/Sun columns tinted lavender (`#F5F3FF`) through header + cells + daily total
- Cell popover: Hours + stepper (±0.5) · Start timer (outline + play circle) · Notes 0/120 · full-width Save
- Click cell → edit → Save updates row/daily/weekly totals + recent entries; Esc / click-outside closes
- `+ Add project or task` with project/task selects
- Weekly total bar: `36.5h / 40h` + thick purple progress + `%`
- Live timer tick, Stop/Start, Switch task; Submit locks cells

### Create KPI Wizard (`/performance/kpis/new`) — polished 2026-07-26

**File:** `components/performance-mock/screens/create-kpi-wizard-screen.tsx`  
**Inspo:** user crop + `design-refs/performance-ui-followup-pages/06-create-kpi-wizard.png`

Matched (interactive):
- Breadcrumb `Configuration / KPI Management / Create KPI` · Save draft · Cancel · Continue
- 6-step stepper with chevrons (`>`), active purple circle, done = green check
- Definition: clipboard header · all fields with `*` + info icons · icon selects · Organisation / Departments scope cards · tags + Add tag · Business meaning (3 editable cards)
- Footer: Save & continue later · Next: Calculation
- Right rail: Live preview (bar icon, 12.4%, target, On track, progress) · Setup guidance · Governance (Yes purple) · Draft details (AU)
- Steps 2–6 are real forms (calculation, data source, targets, ownership, review) — not empty placeholders

### Corrective Action Detail (`/performance/corrective-actions/[id]`) — polished 2026-07-26

**File:** `components/performance-mock/screens/corrective-action-detail-screen.tsx`  
**Inspo:** user crop + `design-refs/performance-ui-followup-pages/07-corrective-action-detail.png`

Matched (interactive, responsive `lg:grid-cols-12` 3|6|3):
- Header: breadcrumb · title · Export/More dropdowns · Save draft · Submit for verification
- Meta bar: ID · Status pill · Severity · Owner · Sponsor · Due · Completion %
- Context flow: Trigger KPI → Objective → Alert
- Left: Problem statement · Root-cause mind-map (toggleable radios) · Evidence (PDF/XLSX/DOCX) · Comments + send
- Middle: Action plan table (+ Add / row menu) · Milestones stepper · Success measures sparklines
- Right: Governance · Risks · Next review (Reschedule) · Verification checklist (toggle) · Audit trail

**Known deviations (flagged):** root-cause SVG spokes not drawn (center hub + 2×2 cards only); Export/More menu items invented (crop shows closed dropdowns only); app font stack used (Geist/system) vs crop’s unknown sans.

---

## Key files

| Path | Role |
|---|---|
| `components/performance-mock/screens/dashboard-screen.tsx` | Dashboard + in-page KPI Analytics embed |
| `components/performance-mock/screens/objective-detail-screen.tsx` | Objective detail — polished |
| `components/performance-mock/screens/project-workspace-screen.tsx` | Project workspace board + rail — polished |
| `components/performance-mock/screens/timesheets-screen.tsx` | Weekly timesheet grid + popover — polished |
| `components/performance-mock/screens/create-kpi-wizard-screen.tsx` | Create KPI wizard — polished |
| `components/performance-mock/screens/corrective-action-detail-screen.tsx` | Corrective action detail — polished |
| `components/performance-mock/screens/tasks-screen.tsx` | My Tasks (board card patterns) |
| `components/performance-mock/screens/kpi-analytics-screen.tsx` | Supports `embedded?: boolean` |
| `components/performance-mock/primitives.tsx` | `PmCard`, `PmFilterSelect`, `PmButton`, etc. |
| `components/performance-mock/shell.tsx` | Sidebar + optional breadcrumb chrome |
| `lib/performance-mock/nav.ts` | Flat items + Reports / Configuration groups |
| `lib/performance-mock/tokens.ts` | Purple / radius / density tokens |
| `lib/performance-mock/fixtures/tasks-hub.ts` | Tasks / projects fixtures |
| `components/performance-mock/screens/reports-screen.tsx` | Report Builder + query list views — polished |
| `design-refs/performance-ui-followup-pages/` | Full-page client screenshots |
| `design-refs/performance-followup-ui-index.md` | Screen → route map |
| `design-refs/performance-module-current-state.md` | Pre-mock live API map (for later re-wire) |
| `design-refs/performance-ui-mock-deviations.md` | Intentional style deviations |

---

## Interaction contracts already on the dashboard

- Tab **Dashboard** ↔ **KPI Analytics**: local `view` state; analytics stays on `/performance`.
- Filters: Company / Month / Year / trajectory range update state (mock — may not filter chart series beyond range slice).
- Export snapshot → `sonner` toast.
- Metric cards → analytics view or `router.push` to goals / tasks / reviews / timesheets.
- Exception row “8 KPIs below threshold” → switches to analytics tab (no hard redirect).

Standalone route `/performance/kpi-analytics` still exists for the sidebar; the dashboard tab must **not** force-navigate there.

---

## Instructions for the next agent

1. **Read this handoff** — especially **Detail quality bar** — + skim followup index and deviations docs.
2. **Study** the current `dashboard-screen.tsx` as the living style reference (Antigravity-level sections included).
3. **Do not** start redesigning unprompted.
4. **Wait** for the user’s next crop / instruction.
5. When a crop arrives: match it at Antigravity detail level (layout nesting, colors, icons, interaction), verify twice against the crop, reply briefly.
6. Do **not** commit unless asked.

---

## Short status line (copy for chat)

> Performance mock polish is crop-driven at Antigravity detail level. Dashboard + Objective detail + Project Workspace + Weekly Timesheet + Create KPI Wizard + Corrective Action Detail + Reports + Projects portfolio + Teams workspace + My Tasks Calendar + Create Task + **Integration Mapping** filter bar are polished. Next: wait for user’s next crop / instruction.
