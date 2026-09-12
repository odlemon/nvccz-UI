/**
 * Tasks & Projects (`/performance/tasks`).
 *
 * LIVE RENDERER — traced through the reassignment chain:
 *   `tasks` is reassigned three times. The last one (v6 layer) forwards to `baseTasks6`,
 *   which is the v5 assignment, which forwards to `baseTasksV5` — the v4 assignment. That
 *   v4 function is the one that renders: it draws the tab bar (`workTabs()`) and dispatches
 *   to `tasksBoard()` / `projectsView()` / `teamsView()` / `calendarView()`. Two later
 *   `render` overrides intercept `state.page==='tasks'` first, but only for drill-downs
 *   (`state.v6Layer.type==='task'` -> `taskPage()`, `V.projectId` -> `projectWorkspace()`),
 *   so the four tabs above are the page.
 *
 * WHAT WAS ALREADY DONE (not by this file — do not duplicate it)
 *   `scripts/patch-performance-runtime.mjs` owns two patches here: `tasks-summary` (the
 *   Active / Due this week / Overdue / Completion-rate strip) and `task-progress-pct` (the
 *   "null%" on every card). Those are correct and are left alone.
 *
 * WHAT WAS STILL FABRICATED — the residue, found by reading the source of the parts the
 * dump could not see. The board's own numbers are all live; everything below is not:
 *   MY TASKS tab, "Today" rail — collapsed by default (`patchTodayRail` in the v17 layer),
 *   which is why none of it appears in the dump's number list. Expanding it showed a
 *   hardcoded "8 Aug" badge, three invented priorities, "Time logged 5.5h" over a 69%
 *   progress bar with a "Goal 8.0h today", and a goal-alignment card naming three goals
 *   ("Sustainable growth", "Expand Southern Africa", "Win 12 enterprise accounts") that do
 *   not exist — `goals` returns 0 rows and every live task's `goalId` is null.
 *   PROJECTS tab — 12 active projects / 3 at risk / 5 due this month / 64% average, six
 *   invented project cards with completion percentages, a portfolio-health split of
 *   6/3/1/2 and four invented milestones. There is no project entity in the API at all.
 *   TEAMS tab — 8 teams / 64 members / 78% capacity / 5 overallocated, six invented teams
 *   with capacity percentages, a five-person workload table with logged hours, five
 *   capacity bars and three people flagged at 112% / 96% / 92%.
 *   CALENDAR tab — 26 tasks this month / 8 due this week / 3 overdue / 72% focus capacity,
 *   a July 2026 grid (the date is September 2026) carrying twelve invented events, a
 *   "selected day" of Wednesday 15 July with four invented items, and a day capacity of
 *   6.5h against "8h available".
 *
 * WHAT IT SHOWS NOW
 *   Calendar is a real grid for the real current month, and the events on it are live
 *   tasks placed by their own `dueDate` — matched on the ISO `YYYY-MM-DD` prefix as
 *   literal calendar parts, never by parsing to a local Date, so no entry can land on the
 *   wrong day. "Tasks this month" and "Overdue" are counted the same way.
 *   Projects and Teams render honest empty states, because no endpoint describes either.
 *   The Today rail, time-logged card and goal-alignment card say what is not tracked.
 *
 * STILL UNSOURCED (backend capability that would be needed)
 *   - projects: no entity, no endpoint. Tasks carry `department`, never a project.
 *   - teams: no entity. `departments` (9) and `users` (24) exist, but a department is not
 *     a team and putting department counts under a "teams" label would be the same defect
 *     in a different slot.
 *   - capacity / utilisation / logged hours per person or per day: nothing records them.
 *     `/api/accounting/timesheets/mine` is the only time endpoint and it is self-scoped.
 *   - goal linkage: `goalId` is null on all 29 tasks and `goals` returns 0 rows.
 *   - "Due this week" stays dashed for the reason the existing `tasks-summary` patch gives.
 */

// ---------------------------------------------------------------------------------------
// 1. "Today" rail. Nothing schedules work to a day, so there is no agenda to list. The
//    badge showed a hardcoded 8 Aug; it now shows the actual date, which is a fact about
//    the client clock rather than a claim about data.
// ---------------------------------------------------------------------------------------
const TODAY_ANCHOR =
  "<section class=\"card v15-today-card\"><div class=\"card-head\"><div><h3>Today</h3><p>Top priorities and scheduled work.</p></div>" +
  "<div class=\"actions\">${badge('8 Aug')}<button class=\"btn small\" data-v15-action=\"today-toggle\">${state.tasksTodayCollapsed!==false?'Show':'Hide'}</button></div></div>" +
  "<div class=\"card-body side-list v15-today-body ${state.tasksTodayCollapsed!==false?'collapsed':''}\">" +
  "${sideItem('Launch performance review cycle','Performance Review Cycle',badge('High'),'red')}" +
  "${sideItem('Draft Q3 market expansion plan','Southern Africa Expansion',badge('High'),'red')}" +
  "${sideItem('Finalize leadership framework','People & Culture',badge('Medium'),'amber')}</div></section>"

const TODAY =
  "<section class=\"card v15-today-card\"><div class=\"card-head\"><div><h3>Today</h3><p>Top priorities and scheduled work.</p></div>" +
  "<div class=\"actions\">${/* patched:tasks-today-rail */badge(new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}" +
  "<button class=\"btn small\" data-v15-action=\"today-toggle\">${state.tasksTodayCollapsed!==false?'Show':'Hide'}</button></div></div>" +
  "<div class=\"card-body side-list v15-today-body ${state.tasksTodayCollapsed!==false?'collapsed':''}\">" +
  "${(function(){const t=__perfScope('tasks');if(t===null)return '<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Unavailable \\u2014 tasks could not be loaded.</p>';" +
  "const pad=n=>String(n).padStart(2,'0');const n=new Date();const key=n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());" +
  "const due=t.filter(x=>String(x&&x.dueDate||'').slice(0,10)===key);" +
  "if(!due.length)return '<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Nothing is due today. Work is not scheduled to a time of day, so there is no agenda to show.</p>';" +
  "return due.slice(0,6).map(x=>sideItem(x.title||__perfDash(),x.department||__perfDash(),badge(__perfLabel(x.priority)),String(x.priority||'').toLowerCase()==='high'?'red':'amber')).join('')})()}" +
  "</div></section>"

// ---------------------------------------------------------------------------------------
// 2. "Time logged". 5.5h over a 69% bar against an 8.0h goal — three constants. Time is
//    only captured as a whole-period total on a self-scoped timesheet; there is no
//    per-day figure for anyone, so the bar is removed rather than drawn at zero.
// ---------------------------------------------------------------------------------------
const TIME_ANCHOR =
  "<h3>Time logged</h3><strong style=\"font-size:16px;font-weight:500\">5.5h</strong></div><div class=\"card-body\">" +
  "${pct(69)}<div class=\"tiny\" style=\"margin-top:7px\">Goal 8.0h today</div>"

const TIME =
  "<h3>Time logged</h3><strong style=\"font-size:16px;font-weight:500\">${/* patched:tasks-time-logged */__perfDash()}</strong></div><div class=\"card-body\">" +
  "<div class=\"tiny\" style=\"margin-top:7px\">Hours are not captured per day, so today's total and any daily goal are not tracked.</div>"

// ---------------------------------------------------------------------------------------
// 3. Goal alignment. Three named goals for a chain that does not exist: `goals` is empty
//    and `goalId` is null on all 29 live tasks.
// ---------------------------------------------------------------------------------------
const ALIGN_ANCHOR =
  "sideItem('Company goal','Sustainable growth','')}${sideItem('Department objective','Expand Southern Africa','')}" +
  "${sideItem('Individual goal','Win 12 enterprise accounts','')"

const ALIGN =
  "/* patched:tasks-goal-alignment */sideItem('Company goal',__perfDash(),'')}${sideItem('Department objective',__perfDash(),'')}" +
  "${sideItem('Individual goal',__perfDash(),'')"

// ---------------------------------------------------------------------------------------
// 4. Projects tab. No project entity exists anywhere in the API — tasks carry a
//    `department`, never a project — so the six cards, the summary strip, the portfolio
//    health split and the milestone list all asserted a portfolio that is not modelled.
//
//    Emptying `ps` is enough for the card grid: the v20 layer's `patchProjects()` only
//    decorates existing `[data-v4-project]` nodes and only appends extra cards when its
//    own seed list exceeds six, which it does not.
// ---------------------------------------------------------------------------------------
const PS_ANCHOR =
  "function projectsView(){const ps=[['Southern Africa Expansion','Expand Southern Africa','67','8 / 12 tasks','30 Sep 2026','On Track']," +
  "['Performance Review Cycle','Performance Review Cycle','65','13 / 20 tasks','31 Aug 2026','At Risk']," +
  "['ISO 27001 Readiness','Operational resilience','52','15 / 29 tasks','15 Oct 2026','On Track']," +
  "['Customer Success Playbook','Sustainable growth','58','6 / 14 tasks','20 Aug 2026','On Track']," +
  "['Executive Scorecard','Win 12 enterprise accounts','61','5 / 12 tasks','31 Aug 2026','On Track']," +
  "['Leadership Framework','Leadership capability','45','4 / 10 tasks','14 Aug 2026','At Risk']];"

const PS = "function projectsView(){/* patched:tasks-projects-fixture */const ps=[];"

const PS_STRIP_ANCHOR =
  "<span>Active projects</span><strong>12</strong></div><div class=\"summary-cell\"><span>At risk</span><strong style=\"color:var(--red)\">3</strong></div>" +
  "<div class=\"summary-cell\"><span>Due this month</span><strong>5</strong></div>" +
  "<div class=\"summary-cell\"><span>Average completion</span><strong>64%</strong></div></div>"

const PS_STRIP =
  "<span>Active projects</span><strong>${/* patched:tasks-projects-strip */__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>At risk</span><strong style=\"color:var(--red)\">${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Due this month</span><strong>${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Average completion</span><strong>${__perfDash()}</strong></div></div>"

const PS_GRID_ANCHOR =
  "<div class=\"project-grid\">${ps.map((p,i)=>`<article class=\"project-card\" data-v4-project=\"${i}\">"

const PS_GRID =
  "<div class=\"project-grid\">${/* patched:tasks-projects-empty */ps.length?'':'<p class=\"tiny\" style=\"grid-column:1/-1;margin:0;padding:24px 4px;text-align:center;color:var(--muted, #6b7280)\">Projects are not modelled by the backend yet, so none can be listed. Tasks are grouped by department instead.</p>'}" +
  "${ps.map((p,i)=>`<article class=\"project-card\" data-v4-project=\"${i}\">"

const PS_HEALTH_ANCHOR =
  "<h3>Portfolio health</h3></div><div class=\"card-body\"><div class=\"summary-strip\">" +
  "<div class=\"summary-cell\"><span>On track</span><strong style=\"color:var(--emerald)\">6</strong></div>" +
  "<div class=\"summary-cell\"><span>At risk</span><strong style=\"color:var(--amber)\">3</strong></div>" +
  "<div class=\"summary-cell\"><span>Off track</span><strong style=\"color:var(--red)\">1</strong></div>" +
  "<div class=\"summary-cell\"><span>Not started</span><strong>2</strong></div></div></div></section>"

const PS_HEALTH =
  "<h3>Portfolio health</h3></div><div class=\"card-body\"><div class=\"summary-strip\">" +
  "<div class=\"summary-cell\"><span>On track</span><strong style=\"color:var(--emerald)\">${/* patched:tasks-projects-health */__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>At risk</span><strong style=\"color:var(--amber)\">${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Off track</span><strong style=\"color:var(--red)\">${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Not started</span><strong>${__perfDash()}</strong></div></div></div></section>"

const PS_MILES_ANCHOR =
  "<h3>Upcoming milestones</h3></div><div class=\"card-body side-list\">" +
  "${sideItem('Department evaluations complete','Performance Review Cycle','24 Aug','red')}" +
  "${sideItem('Leadership competencies','Leadership Framework','14 Aug','red')}" +
  "${sideItem('Revenue forecast validation','FY2026 Forecast','15 Aug','amber')}" +
  "${sideItem('Market access agreements','Southern Africa Expansion','15 Aug','green')}"

const PS_MILES =
  "<h3>Upcoming milestones</h3></div><div class=\"card-body side-list\">" +
  "${/* patched:tasks-projects-milestones */'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Milestones are not recorded, so none can be listed.</p>'}"

// ---------------------------------------------------------------------------------------
// 5. Teams tab. Same problem: there is no team entity. `departments` and `users` exist,
//    but a department is not a team and the capacity, workload and logged-hours columns
//    have no source on either. Everything reads as untracked rather than as a number.
// ---------------------------------------------------------------------------------------
const TEAMS_ANCHOR =
  "function teamsView(){const teams=[['Commercial Growth','Rumbidzai Chaza',82,14,8],['People & Culture','Nyasha Moyo',71,11,6]," +
  "['Finance Performance','Farai Muchengezi',76,9,7],['Digital Experience','Tendai Dube',91,16,9]," +
  "['Risk & Compliance','Tatenda Mlambo',68,8,5],['Executive Office','Tawanda Chikore',64,6,4]];"

const TEAMS = "function teamsView(){/* patched:tasks-teams-fixture */const teams=[];"

const TEAMS_STRIP_ANCHOR =
  "<span>Active teams</span><strong>8</strong></div><div class=\"summary-cell\"><span>Team members</span><strong>64</strong></div>" +
  "<div class=\"summary-cell\"><span>Capacity used</span><strong>78%</strong></div>" +
  "<div class=\"summary-cell\"><span>Overallocated</span><strong style=\"color:var(--red)\">5</strong></div></div>"

const TEAMS_STRIP =
  "<span>Active teams</span><strong>${/* patched:tasks-teams-strip */__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Team members</span><strong>${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Capacity used</span><strong>${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Overallocated</span><strong style=\"color:var(--red)\">${__perfDash()}</strong></div></div>"

const TEAMS_GRID_ANCHOR =
  "<div class=\"project-grid\">${teams.map((t,i)=>`<article class=\"project-card\" data-v4-team=\"${i}\">"

const TEAMS_GRID =
  "<div class=\"project-grid\">${/* patched:tasks-teams-empty */teams.length?'':'<p class=\"tiny\" style=\"grid-column:1/-1;margin:0;padding:24px 4px;text-align:center;color:var(--muted, #6b7280)\">Teams are not modelled by the backend yet. Departments are configured under Configuration &rsaquo; Departments.</p>'}" +
  "${teams.map((t,i)=>`<article class=\"project-card\" data-v4-team=\"${i}\">"

const TEAMS_WORKLOAD_ANCHOR =
  "<tbody>${[['Rumbidzai Chaza','Team Lead',7,2,'18h','82%','Good'],['Nyasha Moyo','HR Manager',6,1,'16h','71%','Good']," +
  "['Farai Muchengezi','Finance Analyst',5,2,'14h','76%','Good'],['Tendai Dube','UX Designer',8,3,'20h','91%','Over capacity']," +
  "['Tatenda Mlambo','Compliance Manager',4,1,'12h','68%','Good']]" +
  ".map(r=>`<tr><td>${person(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${badge(r[6])}</td></tr>`).join('')}</tbody>"

const TEAMS_WORKLOAD =
  "<tbody>${/* patched:tasks-teams-workload */'<tr><td colspan=\"7\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">" +
  "Assigned-task counts, logged hours and capacity are not tracked per person, so no workload can be shown.</td></tr>'}</tbody>"

const TEAMS_BARS_ANCHOR =
  "<h3>Capacity by team</h3></div><div class=\"card-body bars\">${bar('Digital Experience',91)}${bar('Commercial Growth',82)}" +
  "${bar('Finance Performance',76)}${bar('People & Culture',71)}${bar('Executive Office',64)}"

const TEAMS_BARS =
  "<h3>Capacity by team</h3></div><div class=\"card-body bars\">" +
  "${/* patched:tasks-teams-bars */'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Capacity is not tracked, so no comparison can be drawn.</p>'}"

const TEAMS_ATTN_ANCHOR =
  "<h3>People needing attention</h3></div><div class=\"card-body side-list\">" +
  "${sideItem('Tendai Dube','Digital Experience · Designer','112%','red')}" +
  "${sideItem('Nyasha Moyo','People & Culture · HR Manager','96%','amber')}" +
  "${sideItem('Farai Muchengezi','Finance Performance · Analyst','92%','amber')}"

const TEAMS_ATTN =
  "<h3>People needing attention</h3></div><div class=\"card-body side-list\">" +
  "${/* patched:tasks-teams-attention */'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Overallocation cannot be detected without capacity data.</p>'}"

// ---------------------------------------------------------------------------------------
// 6. Calendar tab. The grid was a static July 2026 (it is September 2026) carrying twelve
//    invented events. It is now the real current month, and the entries on it are live
//    tasks placed by their own due date.
//
//    Day matching is done on the ISO `YYYY-MM-DD` prefix as a string, compared against
//    calendar parts read off a locally-constructed Date. Nothing is parsed through
//    `new Date(isoString)`, so an entry can never be pushed into the previous or next day
//    by the viewer's UTC offset — the trap that keeps "Due this week" dashed on the board.
// ---------------------------------------------------------------------------------------
const CAL_ANCHOR =
  "function calendarView(){const days=Array.from({length:35},(_,i)=>i<3?['29 Jun','30 Jun','1 Jul'][i]:i-1<=31?`${i-1} Jul`:`${i-32} Aug`);" +
  "const events={4:'Prepare executive scorecard',6:'Publish department KPIs',8:'Finalize leadership packs',10:'Compile Q2 summaries'," +
  "14:'Department objective alignment',15:'Validate FY2026 forecast',16:'Launch performance review cycle',18:'Draft Q3 market expansion plan'," +
  "21:'Prepare mid-year review reports',24:'Department evaluations complete',29:'Team skills gap analysis',31:'Submit executive performance report'};"

const CAL =
  "function calendarView(){/* patched:tasks-calendar-model */\n" +
  "    const __M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];\n" +
  "    const __MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];\n" +
  "    const __pad=n=>String(n).padStart(2,'0');\n" +
  "    const __now=new Date();\n" +
  "    const __first=new Date(__now.getFullYear(),__now.getMonth(),1);\n" +
  "    const __lead=(__first.getDay()+6)%7;\n" +
  "    const __cells=Array.from({length:35},(_,i)=>new Date(__now.getFullYear(),__now.getMonth(),1-__lead+i));\n" +
  "    const __keyOf=d=>d.getFullYear()+'-'+__pad(d.getMonth()+1)+'-'+__pad(d.getDate());\n" +
  "    const __cellKeys=__cells.map(__keyOf);\n" +
  "    const __todayKey=__keyOf(__now);\n" +
  "    const __monthPrefix=__now.getFullYear()+'-'+__pad(__now.getMonth()+1);\n" +
  "    const __monthLabel=__MONTHS[__now.getMonth()]+' '+__now.getFullYear();\n" +
  "    const days=__cells.map(d=>d.getDate()+' '+__M[d.getMonth()]);\n" +
  "    const __calTasks=__perfScope('tasks');\n" +
  "    const __calOk=__calTasks!==null;\n" +
  "    const events={};\n" +
  "    (__calTasks||[]).forEach(t=>{const k=String(t&&t.dueDate||'').slice(0,10);if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(k))return;(events[k]=events[k]||[]).push(t)});\n" +
  "    const __monthCount=__calOk?String((__calTasks||[]).filter(t=>String(t&&t.dueDate||'').slice(0,7)===__monthPrefix).length):__perfDash();\n" +
  "    const __overdueCount=__calOk?String((__calTasks||[]).filter(t=>t&&t.isOverdue===true).length):__perfDash();\n" +
  "    const __todayTasks=events[__todayKey]||[];\n"

const CAL_STRIP_ANCHOR =
  "<span>Tasks this month</span><strong>26</strong></div><div class=\"summary-cell\"><span>Due this week</span><strong>8</strong></div>" +
  "<div class=\"summary-cell\"><span>Overdue</span><strong style=\"color:var(--red)\">3</strong></div>" +
  "<div class=\"summary-cell\"><span>Focus capacity</span><strong>72%</strong></div></div>"

const CAL_STRIP =
  "<span>Tasks this month</span><strong>${/* patched:tasks-calendar-strip */__monthCount}</strong></div>" +
  // Bucketing into a *week* means agreeing where the week starts and in whose timezone;
  // the board's own summary strip leaves this dashed for the same reason.
  "<div class=\"summary-cell\"><span>Due this week</span><strong>${__perfDash()}</strong></div>" +
  "<div class=\"summary-cell\"><span>Overdue</span><strong style=\"color:var(--red)\">${__overdueCount}</strong></div>" +
  // Nothing measures focus, load or available hours.
  "<div class=\"summary-cell\"><span>Focus capacity</span><strong>${__perfDash()}</strong></div></div>"

const CAL_TITLE_ANCHOR = "<h3>July 2026</h3><div class=\"filters\">${badge('Month')} ${smallBtn('Today','toast-generic')}"
const CAL_TITLE =
  "<h3>${/* patched:tasks-calendar-title */__monthLabel}</h3><div class=\"filters\">${badge('Month')} ${smallBtn('Today','toast-generic')}"

const CAL_CELLS_ANCHOR =
  "${days.map((d,i)=>`<div class=\"click-hint\" data-v4-day=\"${d}\" style=\"min-height:90px;padding:7px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:${i===16?'#faf7ff':'#fff'}\">" +
  "<span class=\"tiny\">${d}</span>${events[parseInt(d)]?`<div style=\"margin-top:8px;padding:6px;border-radius:6px;background:#f3efff;color:#5b20ce;font-size:11px;line-height:1.35\">${events[parseInt(d)]}</div>`:''}</div>`).join('')}"

const CAL_CELLS =
  "${/* patched:tasks-calendar-cells */days.map((d,i)=>`<div class=\"click-hint\" data-v4-day=\"${d}\" style=\"min-height:90px;padding:7px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:${__cellKeys[i]===__todayKey?'#faf7ff':'#fff'}\">" +
  "<span class=\"tiny\">${d}</span>${(events[__cellKeys[i]]||[]).slice(0,3).map(t=>`<div style=\"margin-top:8px;padding:6px;border-radius:6px;background:#f3efff;color:#5b20ce;font-size:11px;line-height:1.35\">${esc(t.title||'')}</div>`).join('')}</div>`).join('')}"

const CAL_DAY_ANCHOR =
  "<h3>Selected day</h3><p>Wednesday 15 July.</p></div></div><div class=\"card-body side-list\">" +
  "${sideItem('Validate FY2026 revenue forecast','2.5h · Farai Muchengezi',badge('Low'),'green')}" +
  "${sideItem('Review regional hiring plan','1.5h · Nyasha Moyo',badge('Low'),'green')}" +
  "${sideItem('Compile Q2 performance summaries','1.5h · Rumbidzai Chaza',badge('Low'),'green')}" +
  "${sideItem('Team skills gap analysis','1h · Tatenda Mlambo',badge('Medium'),'amber')}"

const CAL_DAY =
  "<h3>Selected day</h3><p>${/* patched:tasks-calendar-day */__now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}.</p></div></div><div class=\"card-body side-list\">" +
  "${!__calOk?'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Unavailable \\u2014 tasks could not be loaded.</p>'" +
  ":(__todayTasks.length?__todayTasks.map(t=>sideItem(t.title||__perfDash(),t.owner||__perfDash(),badge(__perfLabel(t.priority)),String(t.priority||'').toLowerCase()==='high'?'red':'amber')).join('')" +
  ":'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Nothing is due today.</p>')}"

const CAL_CAP_ANCHOR =
  "<h3>Day capacity</h3><strong style=\"font-size:14px;font-weight:500\">6.5h</strong></div><div class=\"card-body\">" +
  "${pct(81)}<div class=\"tiny\" style=\"margin-top:6px\">8h available</div>"

const CAL_CAP =
  "<h3>Day capacity</h3><strong style=\"font-size:14px;font-weight:500\">${/* patched:tasks-calendar-capacity */__perfDash()}</strong></div><div class=\"card-body\">" +
  "<div class=\"tiny\" style=\"margin-top:6px\">Daily capacity and available hours are not tracked.</div>"

// ---------------------------------------------------------------------------------------
// 7. CORRECTION to 1 and 6, caught by comparing the calendar against the board on the same
//    screen after the first pass landed.
//
//    `date` on a task is a full timestamp, not a date-only column: the seeded rows carry
//    times like `2026-09-10T22:07Z`. Bucketing on the ISO `YYYY-MM-DD` prefix therefore
//    buckets in UTC, and in UTC+2 — where every user here is — four tasks whose CARDS read
//    "11 Sept" landed in the calendar's 10 Sep cell. Two parts of one page disagreeing
//    about when a task is due is a worse defect than the one being fixed.
//
//    The board's own card labels come from the `live-data-rerender` patch, which formats
//    with `toLocaleDateString` — i.e. the viewer's day. The calendar and the Today rail now
//    do the same, so the whole page answers "when is this due" identically. (Bucketing into
//    a *week* is still left dashed: that additionally requires agreeing where a week
//    starts, which is the reason the existing `tasks-summary` patch gives.)
//
//    These are separate entries rather than edits to the two above because a landed patch
//    is guarded by its marker: changing the body of `tasks-calendar-model` in place would
//    be skipped on an already-patched runtime and would MISS on a fresh one. Chained
//    entries apply in array order, so on a clean runtime the first patch lands and this one
//    then rewrites its output.
// ---------------------------------------------------------------------------------------
const CAL_LOCAL_ANCHOR =
  "const events={};\n" +
  "    (__calTasks||[]).forEach(t=>{const k=String(t&&t.dueDate||'').slice(0,10);if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(k))return;(events[k]=events[k]||[]).push(t)});\n" +
  "    const __monthCount=__calOk?String((__calTasks||[]).filter(t=>String(t&&t.dueDate||'').slice(0,7)===__monthPrefix).length):__perfDash();"

const CAL_LOCAL =
  "/* patched:tasks-calendar-localday */\n" +
  "    // Same day the task card shows: the viewer's day, not UTC's.\n" +
  "    const __dayKey=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.getFullYear()+'-'+__pad(d.getMonth()+1)+'-'+__pad(d.getDate())};\n" +
  "    const events={};\n" +
  "    (__calTasks||[]).forEach(t=>{const k=__dayKey(t&&t.dueDate);if(!k)return;(events[k]=events[k]||[]).push(t)});\n" +
  "    const __monthCount=__calOk?String((__calTasks||[]).filter(t=>__dayKey(t&&t.dueDate).slice(0,7)===__monthPrefix).length):__perfDash();"

const TODAY_LOCAL_ANCHOR =
  "const pad=n=>String(n).padStart(2,'0');const n=new Date();const key=n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());" +
  "const due=t.filter(x=>String(x&&x.dueDate||'').slice(0,10)===key);"

const TODAY_LOCAL =
  "/* patched:tasks-today-localday */const pad=n=>String(n).padStart(2,'0');const n=new Date();" +
  "const key=n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());" +
  "const dayKey=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};" +
  "const due=t.filter(x=>dayKey(x&&x.dueDate)===key);"

// A day cell shows at most three entries or it overflows the grid. Truncating silently
// would understate a busy day — 20 Sep has twenty tasks — so the remainder is counted.
const CAL_MORE_ANCHOR =
  "(events[__cellKeys[i]]||[]).slice(0,3).map(t=>`<div style=\"margin-top:8px;padding:6px;border-radius:6px;background:#f3efff;color:#5b20ce;font-size:11px;line-height:1.35\">${esc(t.title||'')}</div>`).join('')}"

const CAL_MORE =
  "/* patched:tasks-calendar-overflow */(events[__cellKeys[i]]||[]).slice(0,3).map(t=>`<div style=\"margin-top:8px;padding:6px;border-radius:6px;background:#f3efff;color:#5b20ce;font-size:11px;line-height:1.35\">${esc(t.title||'')}</div>`).join('')" +
  "+((events[__cellKeys[i]]||[]).length>3?`<div class=\"tiny\" style=\"margin-top:4px\">+${(events[__cellKeys[i]]||[]).length-3} more</div>`:'')}"

export default [
  { label: "tasks-today-rail", find: TODAY_ANCHOR, repl: TODAY },
  { label: "tasks-time-logged", find: TIME_ANCHOR, repl: TIME },
  { label: "tasks-goal-alignment", find: ALIGN_ANCHOR, repl: ALIGN },

  { label: "tasks-projects-fixture", find: PS_ANCHOR, repl: PS },
  { label: "tasks-projects-strip", find: PS_STRIP_ANCHOR, repl: PS_STRIP },
  { label: "tasks-projects-empty", find: PS_GRID_ANCHOR, repl: PS_GRID },
  { label: "tasks-projects-health", find: PS_HEALTH_ANCHOR, repl: PS_HEALTH },
  { label: "tasks-projects-milestones", find: PS_MILES_ANCHOR, repl: PS_MILES },

  { label: "tasks-teams-fixture", find: TEAMS_ANCHOR, repl: TEAMS },
  { label: "tasks-teams-strip", find: TEAMS_STRIP_ANCHOR, repl: TEAMS_STRIP },
  { label: "tasks-teams-empty", find: TEAMS_GRID_ANCHOR, repl: TEAMS_GRID },
  { label: "tasks-teams-workload", find: TEAMS_WORKLOAD_ANCHOR, repl: TEAMS_WORKLOAD },
  { label: "tasks-teams-bars", find: TEAMS_BARS_ANCHOR, repl: TEAMS_BARS },
  { label: "tasks-teams-attention", find: TEAMS_ATTN_ANCHOR, repl: TEAMS_ATTN },

  { label: "tasks-calendar-model", find: CAL_ANCHOR, repl: CAL },
  { label: "tasks-calendar-strip", find: CAL_STRIP_ANCHOR, repl: CAL_STRIP },
  { label: "tasks-calendar-title", find: CAL_TITLE_ANCHOR, repl: CAL_TITLE },
  { label: "tasks-calendar-cells", find: CAL_CELLS_ANCHOR, repl: CAL_CELLS },
  { label: "tasks-calendar-day", find: CAL_DAY_ANCHOR, repl: CAL_DAY },
  { label: "tasks-calendar-capacity", find: CAL_CAP_ANCHOR, repl: CAL_CAP },

  // Chained corrections — must stay AFTER the two entries whose output they rewrite.
  { label: "tasks-calendar-localday", find: CAL_LOCAL_ANCHOR, repl: CAL_LOCAL },
  { label: "tasks-today-localday", find: TODAY_LOCAL_ANCHOR, repl: TODAY_LOCAL },
  { label: "tasks-calendar-overflow", find: CAL_MORE_ANCHOR, repl: CAL_MORE },
]
