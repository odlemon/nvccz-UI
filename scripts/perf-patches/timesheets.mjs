/**
 * Weekly Timesheet (`/performance/timesheets`).
 *
 * LIVE RENDERER — traced, not grepped. Three generations define a timesheet page:
 *   - `weeklyTimesheetPageV6()` (v6 layer, week "13–19 July 2026") — dead, only reachable
 *     via `state.v6Layer.type==='timesheet'`, which nothing sets any more.
 *   - `timesheetsV8()` (v8 layer, also "13–19 July 2026") — dead: it is dispatched through
 *     the `v8Pages` map, and the v12 layer's `renderV12()` short-circuits
 *     `state.page==='timesheets'` before that map is ever consulted.
 *   - `timesheetsPage()` (v12 layer, week "10–16 Aug 2026") — the live one. The v14 layer
 *     then decorates it in `enhanceTimesheet()` / `renderTimesheetLayer()`, which add the
 *     Week grid / Time entries / Allocation / Approval tabs on top of the same data.
 *   The H1 in `.perf-dumps/a4/sysadmin__timesheets.txt` was "Weekly Timesheet — 10–16 Aug
 *   2026", which is how the v12 generation was identified as the one that shows.
 *
 * WHAT WAS FABRICATED
 *   The whole week. `V.timesheet` was a literal: a four-row project/task grid
 *   (17.5h / 8.0h / 8.0h / 3.0h), per-day totals 7.5 / 7.5 / 6.0 / 8.0 / 7.5 / 0 / 0, a
 *   36.5h week and two "recent time entries" (1.00h timer, 0.50h manual). None of it came
 *   from anywhere — `/api/accounting/timesheets/mine` returns 0 rows for this user.
 *   KPI strip: Logged 36.5h, Expected 40h "91% captured", Billable 28.0h (literally
 *   `Math.min(tot,28)` — a cap, not a measurement), Overtime 0.0h.
 *   Submission checks: three of the four booleans were the constant `true`, so
 *   "No overlapping timer entries" and "Goal-linked work recorded" showed a green Passed
 *   badge for a validation that has never run.
 *   Approver: a hardcoded "Nyasha Moyo · Department Manager".
 *   On the other tabs: "Target capacity is 8.0h per working day", weekly utilisation
 *   `total/40`, "Goal-linked work 93%", "Approval SLA 24h", and three more constant
 *   "Passed" audit rows. Step 1 of the approval workflow read `status==='Draft' ? …
 *   : 'Complete'`, so an unknown status silently rendered as "Complete".
 *
 * WHAT IT SHOWS NOW
 *   Everything on the page is read from the live `timesheets` scope
 *   (`GET /api/accounting/timesheets/mine`): period, total hours, billable hours,
 *   submission status and approver. With 0 rows the grid, the entry ledger and the
 *   approver panel all say so, and every figure that has no field behind it is an em dash
 *   with an honest caption rather than a number.
 *   The timer panel is left alone: "Stopped" is a true statement about a client-side
 *   widget, not a claim about data. Its task label no longer names an invented project.
 *
 * BACKEND GAP — REPORTED UP, NOT PAPERED OVER
 *   There is no collection endpoint. `GET /api/accounting/timesheets` is 404; only
 *   `/mine` exists. A Department Manager, HR/M&E Manager, Executive or SysAdmin opening
 *   this page therefore sees ONLY THEIR OWN timesheet — there is no way to see a team's
 *   week, and no way to approve anyone else's. The "Approver" panel and the whole
 *   approval tab describe a workflow the API cannot currently serve. That is a real gap;
 *   the page now shows the truth instead of a manager-shaped fixture.
 *
 * ALSO UNSOURCED (no field, no endpoint)
 *   - contracted / expected weekly hours, and therefore overtime and utilisation
 *   - per-day, per-project time entries (the whole week grid is a single `totalHours`)
 *   - the timer ledger (`entries`)
 *   - submission validation results (no server-side checks exist)
 *   - goal-linked hours
 */

// ---------------------------------------------------------------------------------------
// 1. The fixture. `state.v12` is built once at layer init, long before the host's fetch
//    resolves, so live values cannot be computed here — the literal is emptied and the
//    page reads the bridge at render time instead. `state.v12` is not persisted (the
//    `matanho.timesheet.v12` key is written by "Save draft" and never read back), so this
//    is the only place the week is seeded.
// ---------------------------------------------------------------------------------------
const FIXTURE_ANCHOR =
  "timesheet:{week:'10–16 Aug 2026',status:'Draft',rows:[\n" +
  "      {project:'Southern Africa Expansion',task:'Enterprise campaign launch',hours:[3.5,4,2.5,4,3.5,0,0]},\n" +
  "      {project:'Southern Africa Expansion',task:'Partner onboarding playbook',hours:[1.5,1.5,1.5,2,1.5,0,0]},\n" +
  "      {project:'Performance Review Cycle',task:'Manager evaluation',hours:[2,1.5,1.5,1.5,1.5,0,0]},\n" +
  "      {project:'Internal Operations',task:'Team meeting',hours:[0.5,0.5,0.5,0.5,1,0,0]}\n" +
  "    ],entries:[\n" +
  "      {when:'11 Aug 08:20',project:'Southern Africa Expansion',task:'Enterprise campaign launch',hours:1.0,source:'Timer'},\n" +
  "      {when:'10 Aug 15:10',project:'Internal Operations',task:'Team meeting',hours:0.5,source:'Manual'}\n" +
  "    ],timer:{running:false,startedAt:null,elapsed:0,project:'Southern Africa Expansion',task:'Enterprise campaign launch'}},"

const FIXTURE =
  "/* patched:timesheets-fixture */\n" +
  "    // Was a whole invented week: four project rows, 36.5 logged hours and two timer\n" +
  "    // entries, none of which any endpoint can produce. The grid, ledger and totals are\n" +
  "    // sourced from the `timesheets` scope at render time; this stays empty so any layer\n" +
  "    // that still reads `V.timesheet.rows` sees nothing rather than fixtures.\n" +
  "    timesheet:{week:'',status:'',rows:[],entries:[],timer:{running:false,startedAt:null,elapsed:0,project:'',task:''}},"

// ---------------------------------------------------------------------------------------
// 2. Render-time live read. Day-column labels are derived from the period string by
//    integer arithmetic on the ISO parts and `Date.UTC`, never by local-timezone date
//    maths — the same date-shift trap that keeps "Due this week" dashed on the Tasks page.
// ---------------------------------------------------------------------------------------
const HEAD_ANCHOR =
  "const ts=V.timesheet,days=['Mon 10','Tue 11','Wed 12','Thu 13','Fri 14','Sat 15','Sun 16'],tot=totalHours(),daily=dailyTotals();"

const HEAD =
  "/* patched:timesheets-head */\n" +
  "    const ts=V.timesheet;\n" +
  "    const __tsRows=__perfScope('timesheets');\n" +
  "    const __tsOk=__tsRows!==null;\n" +
  "    // Most recent period first; with one row or none the sort is a no-op.\n" +
  "    const __tsCur=(__tsRows||[]).slice().sort((a,b)=>String(b&&b.periodStart||'').localeCompare(String(a&&a.periodStart||'')))[0]||null;\n" +
  "    const __tsWeek=(function(){if(!__tsCur)return '';const d=__perfDash();const a=__perfDate(__tsCur.periodStart),b=__perfDate(__tsCur.periodEnd);if(a===d&&b===d)return '';if(a===d)return b;if(b===d)return a;return a+' \\u2013 '+b})();\n" +
  "    const days=(function(){const n=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];const m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(String(__tsCur&&__tsCur.periodStart||''));if(!m)return n;const base=Date.UTC(+m[1],+m[2]-1,+m[3]);return n.map((x,i)=>x+' '+new Date(base+i*86400000).getUTCDate())})();\n" +
  "    const tot=totalHours(),daily=dailyTotals();"

const TITLE_ANCHOR = "'Weekly Timesheet — '+ts.week"
// The week is only named when a real period backs it.
const TITLE = "/* patched:timesheets-title */'Weekly Timesheet'+(__tsWeek?' \\u2014 '+__tsWeek:'')"

// ---------------------------------------------------------------------------------------
// 3. KPI strip. Logged / Billable / Submission come off the timesheet record. Expected and
//    Overtime need a contracted-hours figure that exists nowhere, so they are dashes —
//    "Expected 40h" was a policy assumption, and every percentage on the strip was derived
//    from it.
// ---------------------------------------------------------------------------------------
const KPIS_ANCHOR =
  "<div class=\"kpis\">${kpi('Logged',tot.toFixed(1)+'h','Current captured time','clock','neutral','timesheets')}" +
  "${kpi('Expected','40h',Math.round(tot/40*100)+'% captured','calendar','neutral','timesheets')}" +
  "${kpi('Billable',Math.min(tot,28).toFixed(1)+'h','Goal-linked work','tasks','up','timesheets')}" +
  "${kpi('Overtime',Math.max(0,tot-40).toFixed(1)+'h','Policy threshold','alerts',tot>40?'down':'neutral','timesheets')}" +
  "${kpi('Submission',ts.status,'Manager approval workflow','check','up','timesheets')}" +
  "${kpi('Timer',ts.timer.running?'Running':'Stopped',ts.timer.task,'clock',ts.timer.running?'up':'neutral','timesheets')}</div>"

const KPIS =
  "<div class=\"kpis\">${/* patched:timesheets-kpis */kpi('Logged'," +
  "(__tsCur&&__tsCur.totalHours!=null)?Number(__tsCur.totalHours).toFixed(1)+'h':__perfDash()," +
  "(__tsCur&&__tsCur.totalHours!=null)?'Current captured time':(__tsOk?'No timesheet recorded':'Unavailable')," +
  "'clock','neutral','timesheets')}" +
  // Nothing stores a contracted week, so there is no expectation to measure against.
  "${kpi('Expected',__perfDash(),'Not yet tracked','calendar','neutral','timesheets')}" +
  "${kpi('Billable'," +
  "(__tsCur&&__tsCur.billableHours!=null)?Number(__tsCur.billableHours).toFixed(1)+'h':__perfDash()," +
  "(__tsCur&&__tsCur.billableHours!=null)?'Goal-linked work':(__tsOk?'Not recorded':'Unavailable')," +
  "'tasks','up','timesheets')}" +
  // Overtime is expected-minus-logged; with no expected figure it cannot be computed.
  "${kpi('Overtime',__perfDash(),'Not yet tracked','alerts','neutral','timesheets')}" +
  "${kpi('Submission',__tsCur?__perfLabel(__tsCur.status):__perfDash()," +
  "__tsCur?'Manager approval workflow':(__tsOk?'No timesheet recorded':'Unavailable')," +
  "'check','up','timesheets')}" +
  // The timer is a client-side widget. "Stopped" is a fact about this browser, not data.
  "${kpi('Timer',ts.timer.running?'Running':'Stopped',ts.timer.task||'No task selected','clock',ts.timer.running?'up':'neutral','timesheets')}</div>"

// ---------------------------------------------------------------------------------------
// 3b. The timer panel. "Timer ready · 11 Aug 2026" put a fixed date on a live widget — it
//     still read 11 Aug on 08 Sep. The date now comes from the client clock, which is a
//     fact about this browser rather than a claim about data. The task/project caption
//     underneath named an invented project; with the fixture gone it went blank, so it
//     says what it means instead.
// ---------------------------------------------------------------------------------------
const TIMER_STATE_ANCHOR =
  "<span class=\"v12-timer-state\">${ts.timer.running?'Timer running · live':'Timer ready · 11 Aug 2026'}</span>"

const TIMER_STATE =
  "<span class=\"v12-timer-state\">${/* patched:timesheets-timer-state */ts.timer.running?'Timer running · live':'Timer ready · '+new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>"

const TIMER_TASK_ANCHOR =
  "<div class=\"v12-timer-task\"><strong>${esc(ts.timer.task)}</strong><span>${esc(ts.timer.project)}</span></div>"

const TIMER_TASK =
  "<div class=\"v12-timer-task\">${/* patched:timesheets-timer-task */ts.timer.task?`<strong>${esc(ts.timer.task)}</strong><span>${esc(ts.timer.project)}</span>`:`<strong>No task selected</strong><span>Choose a task before starting the timer</span>`}</div>"

// ---------------------------------------------------------------------------------------
// 4. Week grid. The API stores a timesheet as a period plus a total; there is no per-day,
//    per-project breakdown to render, so the grid is empty rather than reconstructed.
// ---------------------------------------------------------------------------------------
const GRID_ANCHOR =
  "<tbody>${ts.rows.map((r,ri)=>`<tr><td><strong>${esc(r.project)}</strong></td><td>${esc(r.task)}</td>" +
  "${r.hours.map((h,di)=>`<td><input type=\"number\" step=\"0.25\" min=\"0\" max=\"24\" value=\"${h||''}\" data-v12-time-cell=\"${ri}:${di}\" aria-label=\"${esc(r.task)} ${days[di]} hours\"></td>`).join('')}" +
  "<td><strong>${r.hours.reduce((a,b)=>a+(Number(b)||0),0).toFixed(1)}h</strong></td></tr>`).join('')}" +
  "<tr><td colspan=\"2\"><strong>Daily total</strong></td>${daily.map(v=>`<td><strong>${v.toFixed(1)}h</strong></td>`).join('')}" +
  "<td><strong>${tot.toFixed(1)}h</strong></td></tr></tbody></table>"

const GRID =
  "<tbody>${/* patched:timesheets-grid */ts.rows.length?(ts.rows.map((r,ri)=>`<tr><td><strong>${esc(r.project)}</strong></td><td>${esc(r.task)}</td>" +
  "${r.hours.map((h,di)=>`<td><input type=\"number\" step=\"0.25\" min=\"0\" max=\"24\" value=\"${h||''}\" data-v12-time-cell=\"${ri}:${di}\" aria-label=\"${esc(r.task)} ${days[di]} hours\"></td>`).join('')}" +
  "<td><strong>${r.hours.reduce((a,b)=>a+(Number(b)||0),0).toFixed(1)}h</strong></td></tr>`).join('')" +
  "+`<tr><td colspan=\"2\"><strong>Daily total</strong></td>${daily.map(v=>`<td><strong>${v.toFixed(1)}h</strong></td>`).join('')}" +
  "<td><strong>${tot.toFixed(1)}h</strong></td></tr>`)" +
  ":`<tr><td colspan=\"10\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">" +
  "${__tsOk?(__tsCur?'This timesheet is stored as a period total only \\u2014 there is no per-day, per-project breakdown to show.':'No timesheet has been captured for you yet.'):'Unavailable \\u2014 the timesheet could not be loaded.'}" +
  "</td></tr>`}</tbody></table>"

// ---------------------------------------------------------------------------------------
// 5. Recent time entries. No entry-level endpoint exists, so the list is empty rather than
//    seeded with two invented timer records.
// ---------------------------------------------------------------------------------------
const ENTRIES_ANCHOR =
  "<h3>Recent time entries</h3>${ts.entries.slice(0,6).map(e=>`<div class=\"v12-entry\"><div><strong>${esc(e.task)}</strong>" +
  "<span>${esc(e.when)} · ${esc(e.project)} · ${esc(e.source)}</span></div><strong>${Number(e.hours).toFixed(2)}h</strong></div>`).join('')}</div></main>"

const ENTRIES =
  "<h3>Recent time entries</h3>${/* patched:timesheets-entries */ts.entries.slice(0,6).map(e=>`<div class=\"v12-entry\"><div><strong>${esc(e.task)}</strong>" +
  "<span>${esc(e.when)} · ${esc(e.project)} · ${esc(e.source)}</span></div><strong>${Number(e.hours).toFixed(2)}h</strong></div>`).join('')" +
  "||`<div class=\"v12-entry\"><div><strong>${__tsOk?'No time entries recorded':'Time entries unavailable'}</strong>" +
  "<span>${__tsOk?'Individual timer and manual entries are not stored by the API yet.':'The timesheet could not be loaded.'}</span></div></div>`}</div></main>"

// ---------------------------------------------------------------------------------------
// 6. Submission checks. Three of the four were the literal `true`. No validation service
//    exists on either side, so all four report that they have not run — a green "Passed"
//    badge for a check nobody performed is worse than no badge at all.
// ---------------------------------------------------------------------------------------
const CHECKS_ANCHOR =
  "<h3>Submission checks</h3>${[['Daily totals captured',tot>0],['No overlapping timer entries',true],['Goal-linked work recorded',true],['Expected weekly hours',tot>=40]]" +
  ".map(x=>`<div class=\"v12-entry\"><div><strong>${x[0]}</strong><span>${x[1]?'Passed':'Requires attention'}</span></div>${badge(x[1]?'Passed':'Open')}</div>`).join('')}</section>"

const CHECKS =
  "<h3>Submission checks</h3>${/* patched:timesheets-checks */['Daily totals captured','No overlapping timer entries','Goal-linked work recorded','Expected weekly hours']" +
  ".map(x=>`<div class=\"v12-entry\"><div><strong>${x}</strong><span>Not yet checked</span></div>${badge('Not run')}</div>`).join('')}</section>"

// ---------------------------------------------------------------------------------------
// 7. Approver. `approver` is a field on the timesheet record; the hardcoded name was not.
// ---------------------------------------------------------------------------------------
const APPROVER_ANCHOR =
  "<h3>Approver</h3>${person('Nyasha Moyo','Department Manager')}<button class=\"btn\" style=\"width:100%;margin-top:9px\" data-v12-action=\"message-approver\">Send message</button></section>"

const APPROVER =
  "<h3>Approver</h3>${/* patched:timesheets-approver */(__tsCur&&__tsCur.approver)?person(__tsCur.approver,'Approver')" +
  ":`<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">${__tsOk?'No approver is recorded on this timesheet.':'Approver unavailable \\u2014 the timesheet could not be loaded.'}</p>`}" +
  "<button class=\"btn\" style=\"width:100%;margin-top:9px\" data-v12-action=\"message-approver\">Send message</button></section>"

// ---------------------------------------------------------------------------------------
// 8. The v14 tab layer (Allocation & utilisation, Approval & audit). It reads the same
//    `V.timesheet`, so emptying the fixture empties the ledger and the allocation bars —
//    but these four panels carried constants of their own.
// ---------------------------------------------------------------------------------------
const ALLOC_PROJ_ANCHOR =
  "<h3>Project allocation</h3><p>How the week is distributed across projects and accountable work.</p>" +
  "${Object.entries(proj).map(([p,h])=>`<div class=\"v14-capacity-row\"><strong>${esc14(p)}</strong>" +
  "<div class=\"v14-capacity-track\"><i style=\"width:${Math.min(100,total?Number(h)/total*100:0)}%\"></i></div><span>${fmtH(h)}</span></div>`).join('')}</section>"

const ALLOC_PROJ =
  "<h3>Project allocation</h3><p>How the week is distributed across projects and accountable work.</p>" +
  "${/* patched:timesheets-alloc-projects */Object.entries(proj).map(([p,h])=>`<div class=\"v14-capacity-row\"><strong>${esc14(p)}</strong>" +
  "<div class=\"v14-capacity-track\"><i style=\"width:${Math.min(100,total?Number(h)/total*100:0)}%\"></i></div><span>${fmtH(h)}</span></div>`).join('')" +
  "||'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">Time is not captured against projects yet, so the week cannot be split.</p>'}</section>"

const ALLOC_CAP_ANCHOR =
  "<h3>Daily capacity</h3><p>Target capacity is 8.0h per working day.</p><div class=\"v14-util-grid\">" +
  "${daily.slice(0,5).map((h,i)=>`<div class=\"v14-util-cell\"><span>${['Mon','Tue','Wed','Thu','Fri'][i]}</span>" +
  "<strong>${Number(h).toFixed(1)}h</strong><span>${h>9?'High load':h>=7?'Healthy':'Available'}</span></div>`).join('')}</div>" +
  "<div class=\"divider\"></div><div class=\"v13-side-row\"><span>Weekly utilisation</span><strong>${Math.round(total/40*100)}%</strong></div>" +
  "<div class=\"v13-side-row\"><span>Billable / goal-linked</span><strong>${Math.min(total,28).toFixed(1)}h</strong></div></aside>"

const ALLOC_CAP =
  // Target capacity, the load labels and weekly utilisation all depend on a contracted-hours
  // figure that no endpoint supplies; the per-day cells depend on a breakdown that is not
  // stored. Billable comes off the timesheet record when there is one.
  "<h3>Daily capacity</h3><p>${/* patched:timesheets-alloc-capacity */'Daily target capacity is not configured, so load cannot be judged.'}</p><div class=\"v14-util-grid\">" +
  "${['Mon','Tue','Wed','Thu','Fri'].map(d=>`<div class=\"v14-util-cell\"><span>${d}</span>" +
  "<strong>${__perfDash()}</strong><span>Not tracked</span></div>`).join('')}</div>" +
  "<div class=\"divider\"></div><div class=\"v13-side-row\"><span>Weekly utilisation</span><strong>${__perfDash()}</strong></div>" +
  "<div class=\"v13-side-row\"><span>Billable / goal-linked</span><strong>${(function(){const r=__perfScope('timesheets');if(r===null)return __perfDash();const c=r.slice().sort((a,b)=>String(b&&b.periodStart||'').localeCompare(String(a&&a.periodStart||'')))[0];return (c&&c.billableHours!=null)?Number(c.billableHours).toFixed(1)+'h':__perfDash()})()}</strong></div></aside>"

const APPR_STEPS_ANCHOR =
  "[['1','Employee validation',ts.status==='Draft'?'In progress':'Complete','Check hours, notes and task linkage']," +
  "['2','Submit for manager approval',ts.status==='Submitted'?'Complete':'Pending','Locks week from ordinary edits']," +
  "['3','Manager review','Pending','Approve, reject or request clarification']," +
  "['4','Post to utilisation ledger','Queued','Approved hours become available to reporting']]"

const APPR_STEPS =
  // An unknown status fell through to 'Complete', which claimed the employee had validated
  // a week that does not exist. No status now means Pending, not done.
  "/* patched:timesheets-approval-steps */[['1','Employee validation',ts.status?(ts.status==='Draft'?'In progress':'Complete'):'Pending','Check hours, notes and task linkage']," +
  "['2','Submit for manager approval',ts.status==='Submitted'?'Complete':'Pending','Locks week from ordinary edits']," +
  "['3','Manager review','Pending','Approve, reject or request clarification']," +
  "['4','Post to utilisation ledger','Queued','Approved hours become available to reporting']]"

const APPR_AUDIT_ANCHOR =
  "[['No overlapping timers','Passed'],['Daily total validation','Passed'],['Project / task linkage','Passed']," +
  "['Goal-linked work','93%'],['Expected hours',total>=40?'Passed':(40-total).toFixed(1)+'h remaining'],['Approval SLA','24h']]"

const APPR_AUDIT =
  // Six governance controls, none of which is actually applied anywhere. Three were the
  // literal string 'Passed'; the rest were derived from the 40h assumption.
  "/* patched:timesheets-approval-audit */[['No overlapping timers',__perfDash()],['Daily total validation',__perfDash()],['Project / task linkage',__perfDash()]," +
  "['Goal-linked work',__perfDash()],['Expected hours',__perfDash()],['Approval SLA',__perfDash()]]"

export default [
  { label: "timesheets-fixture", find: FIXTURE_ANCHOR, repl: FIXTURE },
  { label: "timesheets-head", find: HEAD_ANCHOR, repl: HEAD },
  { label: "timesheets-title", find: TITLE_ANCHOR, repl: TITLE },
  { label: "timesheets-kpis", find: KPIS_ANCHOR, repl: KPIS },
  { label: "timesheets-timer-state", find: TIMER_STATE_ANCHOR, repl: TIMER_STATE },
  { label: "timesheets-timer-task", find: TIMER_TASK_ANCHOR, repl: TIMER_TASK },
  { label: "timesheets-grid", find: GRID_ANCHOR, repl: GRID },
  { label: "timesheets-entries", find: ENTRIES_ANCHOR, repl: ENTRIES },
  { label: "timesheets-checks", find: CHECKS_ANCHOR, repl: CHECKS },
  { label: "timesheets-approver", find: APPROVER_ANCHOR, repl: APPROVER },
  { label: "timesheets-alloc-projects", find: ALLOC_PROJ_ANCHOR, repl: ALLOC_PROJ },
  { label: "timesheets-alloc-capacity", find: ALLOC_CAP_ANCHOR, repl: ALLOC_CAP },
  { label: "timesheets-approval-steps", find: APPR_STEPS_ANCHOR, repl: APPR_STEPS },
  { label: "timesheets-approval-audit", find: APPR_AUDIT_ANCHOR, repl: APPR_AUDIT },
  {
    label: "timesheets-team-panel",
    find: "style=\"width:100%;margin-top:10px\" data-v14-action=\"timesheet-audit-export\">Export audit trail</button></aside></div>`}}",
    repl: "style=\"width:100%;margin-top:10px\" data-v14-action=\"timesheet-audit-export\">Export audit trail</button></aside></div>${(function(){\n  /* patched:timesheets-team-panel */\n  // Was entirely missing: a manager had a \"Manager review\" step that always read\n  // \"Pending\" and no way to see or act on a report's timesheet anywhere on this page.\n  // GET /accounting/timesheets/team (added alongside this patch) now backs a real,\n  // department-scoped roster with real Approve / Return actions.\n  var rows = __perfScope('teamTimesheets');\n  if (rows === null) return '';\n  if (!rows.length) {\n    return '<section class=\"v14-time-card\" style=\"margin-top:14px\"><h3>Team submissions</h3>' +\n      '<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">No timesheet has been submitted by your team yet.</p></section>';\n  }\n  var statusTone = function (st) {\n    return st === 'APPROVED' ? 'green' : st === 'SUBMITTED' ? 'blue' : st === 'RETURNED' ? 'red' : '';\n  };\n  var rowHtml = rows.map(function (t) {\n    var canAct = t.status === 'SUBMITTED';\n    return '<div class=\"v13-side-row\" data-perf-team-timesheet=\"' + esc(t.id) + '\">' +\n      '<span><strong>' + esc(t.employee || '\\u2014') + '</strong><br><span class=\"tiny\">' +\n        __perfDate(t.periodStart) + '</span></span>' +\n      '<span class=\"v13-chip ' + statusTone(t.status) + '\">' + esc(__perfLabel(t.status)) + '</span>' +\n      (canAct\n        ? '<span style=\"display:flex;gap:6px\"><button class=\"btn\" style=\"padding:4px 10px\" data-action=\"team-timesheet-return\" data-id=\"' + esc(t.id) + '\">Return</button>' +\n          '<button class=\"btn primary\" style=\"padding:4px 10px\" data-action=\"team-timesheet-approve\" data-id=\"' + esc(t.id) + '\">Approve</button></span>'\n        : '<span></span>') +\n      '</div>';\n  }).join('');\n  return '<section class=\"v14-time-card\" style=\"margin-top:14px\"><h3>Team submissions</h3>' +\n    '<p class=\"tiny\" style=\"margin:0 0 8px;color:var(--muted, #6b7280)\">Your department, every status. Approve or return anything awaiting your decision.</p>' +\n    rowHtml + '</section>';\n})()}`}}",
  },
]
