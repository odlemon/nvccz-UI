/**
 * Reports & Compliance (`/performance/reports`).
 *
 * LIVE RENDERER — established by tracing the override chain, not by grepping:
 *   `reports` is declared once and then reassigned twice. `reports=function(){…}` in the
 *   v4/inspo layer defines the page; a later layer captures it as `baseReports6` and wraps it
 *   (`reports=function(){if(state.v6Layer?.type==='reportBuilder')return reportBuilderPageV6();
 *   return baseReports6()}`), so the wrapped v4 body is what renders. Two earlier generations
 *   carry a very similar report table and neither is reachable — in particular `reportBody()`'s
 *   default branch (the one with the "6 active schedules" badge) is dead, because the only
 *   live call site reaches `reportBody()` exclusively on the schedule tab, where it returns
 *   before that branch. Confirmed against `.perf-dumps/a5/sysadmin__reports.txt`.
 *
 *   The page has three tabs and all three are patched here: Report Library (the v4 body),
 *   Compliance Centre (`complianceCentre()`), Scheduled Reports (`reportBody()`'s schedule
 *   branch).
 *
 * WHAT WAS FABRICATED
 *   Library tab — `state.reports`, six invented report definitions (RPT-001…006) with invented
 *   owners, schedules, formats and last-run dates, plus a per-row mini-strip whose "Score" and
 *   "On track" figures came from two literal arrays indexed by ROW POSITION
 *   (`[76,72,81,68,82,78][i%6]`), i.e. the number depended on where the row sat in the table.
 *   The preview card asserted Overall score 76.4%, On track 32, At risk 10, Off track 6 over a
 *   drawn 7-point trend line. The "Report insights" panel asserted 28 reports generated this
 *   month (+27%), 18 active schedules, 12 connected data sources and 24.6 GB of 100 GB storage.
 *   Compliance tab — a 92% "control effectiveness" orb, five KPI cards (25 controls tested, 20
 *   operating effectively, 5 exceptions, 94% evidence coverage, 91% access recertified) and a
 *   six-card control register (96/82/94/97/91/87%) with invented exception counts.
 *   Schedule tab — next-run dates from a literal array indexed by row position.
 *
 *   Nothing stores a report definition, a report run, a schedule or a compliance control. Every
 *   one of those figures was asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   The library, the schedule list and the compliance register render honest empty states that
 *   say the records are not stored yet, and every figure that has no source reads as an em dash
 *   with a "Not yet tracked" caption. Nothing on the page is derived from row position any more.
 *
 * WHY NOTHING HERE IS WIRED LIVE — and what the backend would need:
 *   There is no report-definition, report-run or schedule scope, and `analyticsReports`
 *   (`GET /performance/analytics/reports`) is NOT one: it summarises GOAL PROGRESS
 *   (`{total, completed, inProgress, planning, averageProgress}` — currently all zero) and
 *   putting its `total` into a card labelled "Reports generated this month" would be real data
 *   in a slot labelled for something else, which is still a fabrication. To wire this page the
 *   backend needs:
 *     - a report-definition register (name, category, owner, format, schedule, status)
 *     - a report-run history (run id, definition, started/finished, outcome, recipients)
 *     - a schedule store with a computed next-run
 *     - a compliance control register with test results, owners and evidence links
 *     - storage/quota telemetry for the "Storage used" tile
 */

// ---------------------------------------------------------------------------
// 1. The fixture itself. Emptied rather than deleted so every later layer that still reads
//    `state.reports` (the signature-intelligence `spec()` panel counts it, `reportFor()`
//    looks up by id) sees an empty list instead of six invented definitions.
//    NOTE: `visibleReports()` feeds BOTH this page and /performance/performance-reports, so
//    this one patch is what empties the v12 Reports hub as well.
// ---------------------------------------------------------------------------
const FIXTURE_ANCHOR =
  " reports:[\n" +
  " {id:'RPT-001',name:'Monthly Executive Performance Pack',category:'Executive',schedule:'Monthly - Day 5, 08:00',format:'PDF / PPTX',owner:'Performance Office',status:'Active',last:'05 Aug 2026'},\n" +
  " {id:'RPT-002',name:'Department Scorecards',category:'Scorecards',schedule:'Monthly - Day 7, 09:00',format:'PDF / XLSX',owner:'HR/M&E',status:'Active',last:'07 Aug 2026'},\n" +
  " {id:'RPT-003',name:'Board Strategy Pack',category:'Executive',schedule:'Quarterly',format:'PDF / PPTX',owner:'Executive Office',status:'Active',last:'10 Jul 2026'},\n" +
  " {id:'RPT-004',name:'KPI Variance & Exceptions',category:'KPI',schedule:'Monthly',format:'XLSX / PDF',owner:'Performance Office',status:'Active',last:'06 Aug 2026'},\n" +
  " {id:'RPT-005',name:'Review Cycle Completion',category:'People',schedule:'Weekly',format:'PDF / XLSX',owner:'People & Culture',status:'Active',last:'08 Aug 2026'},\n" +
  " {id:'RPT-006',name:'Performance Governance Compliance',category:'Compliance',schedule:'Quarterly',format:'PDF',owner:'HR/M&E',status:'Active',last:'01 Aug 2026'}\n" +
  " ],"

const FIXTURE =
  " /* patched:reports-fixture */\n" +
  " // Was six invented report definitions with invented owners, schedules and last-run dates.\n" +
  " // No endpoint stores a report definition, so the library is empty until one does.\n" +
  " reports:[],"

const VISIBLE_EMP_ANCHOR =
  "if(state.role==='Employee')return [{id:'MY-RPT-001',name:'My Performance Statement',category:'Personal',schedule:'On demand',format:'PDF',owner:'Tariro Moyo',status:'Active',last:'08 Aug 2026'},{id:'MY-RPT-002',name:'My Review Summary',category:'Personal',schedule:'On demand',format:'PDF',owner:'Tariro Moyo',status:'Active',last:'08 Aug 2026'}];"

// (Employee branch — two more invented personal reports, owned by a demo employee.)
const VISIBLE_EMP =
  "if(state.role==='Employee')return [/* patched:reports-visible-employee */];"

// ---------------------------------------------------------------------------
// 2. Library tab — the row set and its position-indexed mini-strip.
// ---------------------------------------------------------------------------
const LIBRARY_ANCHOR =
  "<tbody>${reportSet.map((r,i)=>`<tr class=\"click-hint ${r.id===sel?.id?'report-row-selected':''}\" data-v4-report=\"${r.id}\">" +
  "<td><strong>${esc(r.name)}</strong><div class=\"tiny\">${esc(r.category)} report</div></td>" +
  "<td><div class=\"summary-strip\" style=\"grid-template-columns:1fr 1fr;min-width:175px\">" +
  "<div class=\"summary-cell\"><span>Score</span><strong style=\"font-size:12px\">${[76,72,81,68,82,78][i%6]}%</strong></div>" +
  "<div class=\"summary-cell\"><span>On track</span><strong style=\"font-size:12px\">${[32,24,18,21,42,28][i%6]}</strong></div>" +
  "</div></td><td>${esc(r.schedule)}</td><td>${esc(r.format)}</td><td>${person(r.owner)}</td><td>${esc(r.last)}</td>" +
  "<td>${badge(r.status)}</td></tr>`).join('')}</tbody>"

// Styling copied from `__perfEmptyRow` so the empty state looks the same everywhere, but the
// wording differs on purpose: `__perfEmptyRow` distinguishes "empty" from "unavailable", and
// neither applies when there is no endpoint at all.
const LIBRARY =
  "<tbody>${/* patched:reports-library */(() => {\n" +
  "      if (!reportSet.length) return '<tr><td colspan=\"7\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">No report definitions are stored yet</td></tr>';\n" +
  "      return reportSet.map(r => '<tr class=\"click-hint ' + (r.id===sel?.id?'report-row-selected':'') + '\" data-v4-report=\"' + esc(r.id) + '\">'\n" +
  "        + '<td><strong>' + esc(r.name) + '</strong><div class=\"tiny\">' + esc(r.category) + ' report</div></td>'\n" +
  "        // Score and On track came from two literal arrays indexed by ROW POSITION. Nothing\n" +
  "        // scores a report, so both are unknown rather than re-derived.\n" +
  "        + '<td><div class=\"summary-strip\" style=\"grid-template-columns:1fr 1fr;min-width:175px\">'\n" +
  "          + '<div class=\"summary-cell\"><span>Score</span><strong style=\"font-size:12px\">' + __perfDash() + '</strong></div>'\n" +
  "          + '<div class=\"summary-cell\"><span>On track</span><strong style=\"font-size:12px\">' + __perfDash() + '</strong></div>'\n" +
  "          + '</div></td>'\n" +
  "        + '<td>' + esc(r.schedule) + '</td><td>' + esc(r.format) + '</td><td>' + person(r.owner) + '</td>'\n" +
  "        + '<td>' + esc(r.last) + '</td><td>' + badge(r.status) + '</td></tr>').join('');\n" +
  "    })()}</tbody>"

const PREVIEW_ANCHOR =
  "<div class=\"preview-metrics\"><div><span>Overall score</span><strong>76.4%</strong></div>" +
  "<div><span>On track</span><strong style=\"color:var(--emerald)\">32</strong></div>" +
  "<div><span>At risk</span><strong style=\"color:var(--amber)\">10</strong></div>" +
  "<div><span>Off track</span><strong style=\"color:var(--red)\">6</strong></div></div>"

const PREVIEW =
  "<div class=\"preview-metrics\"><div><span>Overall score</span><strong>${/* patched:reports-preview-metrics */__perfDash()}</strong></div>" +
  "<div><span>On track</span><strong style=\"color:var(--emerald)\">${__perfDash()}</strong></div>" +
  "<div><span>At risk</span><strong style=\"color:var(--amber)\">${__perfDash()}</strong></div>" +
  "<div><span>Off track</span><strong style=\"color:var(--red)\">${__perfDash()}</strong></div></div>"

// The preview card drew a 7-point trend line out of constants. `miniLine()` appears twice in
// the file; only this wrapped occurrence is the report preview.
const CHART_ANCHOR = "<div style=\"padding:0 10px 11px\">${miniLine()}</div>"
const CHART =
  "<div style=\"padding:0 10px 11px\">${/* patched:reports-preview-chart */__perfNoSeries('No report run history is recorded yet, so no performance trajectory can be drawn for this report.')}</div>"

const INSIGHTS_ANCHOR =
  "${sideItem('Reports generated this month','28 total','+27%','green')}" +
  "${sideItem('Scheduled reports','18 active schedules','Active','green')}" +
  "${sideItem('Data sources connected','12 systems','Healthy','green')}" +
  "${sideItem('Storage used','24.6 GB of 100 GB','24%','')}"

// No run history, no schedule store, no source registry and no storage telemetry exist. The
// tone of the panel is kept; only the assertions are removed.
const INSIGHTS =
  "${/* patched:reports-insights */sideItem('Reports generated this month','Not yet tracked',__perfDash())}" +
  "${sideItem('Scheduled reports','Not yet tracked',__perfDash())}" +
  "${sideItem('Data sources connected','Not yet tracked',__perfDash())}" +
  "${sideItem('Storage used','Not yet tracked',__perfDash())}"

// ---------------------------------------------------------------------------
// 3. Compliance Centre tab.
// ---------------------------------------------------------------------------
const COMPLIANCE_HEAD_ANCHOR = "<h2>Compliance posture is strong, with focused exceptions</h2>"
const COMPLIANCE_HEAD =
  "<h2>${/* patched:reports-compliance-head */'Compliance posture is not measured yet'}</h2>"

const ORB_ANCHOR = "<div class=\"score-orb\"><div><strong>92%</strong><span>control effectiveness</span></div></div>"
const ORB =
  "<div class=\"score-orb\"><div><strong>${/* patched:reports-compliance-orb */__perfDash()}</strong><span>control effectiveness</span></div></div>"

const COMPLIANCE_KPIS_ANCHOR =
  "${kpi('Controls tested','25','Across 7 control families','shield','neutral','reports')}" +
  "${kpi('Operating effectively','20','No material exception','check','up','reports')}" +
  "${kpi('Exceptions','5','2 high priority','alerts','down','reports')}" +
  "${kpi('Evidence coverage','94%','3 items awaiting approval','file','up','vault')}" +
  "${kpi('Access recertified','91%','2 elevated roles open','lock','down','access')}"

const COMPLIANCE_KPIS =
  "${/* patched:reports-compliance-kpis */kpi('Controls tested',__perfDash(),'Not yet tracked','shield','neutral','reports')}" +
  "${kpi('Operating effectively',__perfDash(),'Not yet tracked','check','up','reports')}" +
  "${kpi('Exceptions',__perfDash(),'Not yet tracked','alerts','down','reports')}" +
  "${kpi('Evidence coverage',__perfDash(),'Not yet tracked','file','up','vault')}" +
  "${kpi('Access recertified',__perfDash(),'Not yet tracked','lock','down','access')}"

const CONTROL_GRID_ANCHOR =
  "<div class=\"control-grid\">" +
  "${control('Performance contract coverage','96%','7 contracts outstanding','Compliant','People & Culture')}" +
  "${control('Review completion & deadlines','82%','11 overdue review stages','At Risk','HR/M&E')}" +
  "${control('KPI evidence & approval','94%','3 high-impact KPIs pending evidence approval','At Risk','Performance Office')}" +
  "${control('Goal cascade integrity','97%','5 individual goals need parent mapping','Compliant','Performance Office')}" +
  "${control('RBAC recertification','91%','2 temporary elevated assignments expire soon','At Risk','SysAdmin / HR')}" +
  "${control('Corrective action closure','87%','14 actions outside SLA','At Risk','Department Heads')}</div>"

// The six control NAMES are the module's control taxonomy and are kept — what goes is every
// score, every exception count, every pass/fail verdict and every owner, none of which is
// stored anywhere.
const CONTROL_GRID =
  "<div class=\"control-grid\">" +
  "${/* patched:reports-control-register */control('Performance contract coverage',__perfDash(),'Not yet tested','Not assessed',__perfDash())}" +
  "${control('Review completion & deadlines',__perfDash(),'Not yet tested','Not assessed',__perfDash())}" +
  "${control('KPI evidence & approval',__perfDash(),'Not yet tested','Not assessed',__perfDash())}" +
  "${control('Goal cascade integrity',__perfDash(),'Not yet tested','Not assessed',__perfDash())}" +
  "${control('RBAC recertification',__perfDash(),'Not yet tested','Not assessed',__perfDash())}" +
  "${control('Corrective action closure',__perfDash(),'Not yet tested','Not assessed',__perfDash())}</div>"

// `control()` fed its score straight into `progress(parseInt(score))`. `parseInt('—')` is NaN,
// and `Math.max(0,Math.min(100,NaN))` is NaN, which renders `width:NaN%` — an unstyled bar.
// A missing score now draws a zero-width bar instead.
const CONTROL_FN_ANCHOR =
  "function control(title,score,desc,status,owner){return `<article class=\"control-card\"><header><h4>${esc(title)}</h4>${badge(status)}</header>" +
  "<p>${esc(desc)}</p>${progress(parseInt(score),status==='At Risk'?'amber':'emerald')}" +
  "<footer><span>${esc(owner)}</span><strong>${esc(score)}</strong></footer></article>`}"

const CONTROL_FN =
  "function control(title,score,desc,status,owner){/* patched:reports-control-card */const __n=parseInt(score);" +
  "return `<article class=\"control-card\"><header><h4>${esc(title)}</h4>${badge(status)}</header>" +
  "<p>${esc(desc)}</p>${progress(Number.isFinite(__n)?__n:0,status==='At Risk'?'amber':'emerald')}" +
  "<footer><span>${esc(owner)}</span><strong>${esc(score)}</strong></footer></article>`}"

// ---------------------------------------------------------------------------
// 4. Scheduled Reports tab (`reportBody()`'s schedule branch — the live one).
// ---------------------------------------------------------------------------
const SCHEDULE_ANCHOR =
  "<tbody>${reportSet.map((r,i)=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.schedule)}</td>" +
  "<td>${['10 Aug','12 Aug','10 Oct','06 Sep','15 Aug','01 Oct'][i]}</td><td>${esc(r.category)}</td>" +
  "<td>${badge(r.status)}</td></tr>`).join('')}</tbody>"

const SCHEDULE =
  "<tbody>${/* patched:reports-schedule */(() => {\n" +
  "      if (!reportSet.length) return '<tr><td colspan=\"5\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">No report schedules are stored yet</td></tr>';\n" +
  "      // Next run came from a literal array indexed by row position. Nothing computes a next\n" +
  "      // run, so it is unknown rather than the sixth date in a list.\n" +
  "      return reportSet.map(r => '<tr><td><strong>' + esc(r.name) + '</strong></td><td>' + esc(r.schedule) + '</td>'\n" +
  "        + '<td>' + __perfDash() + '</td><td>' + esc(r.category) + '</td><td>' + badge(r.status) + '</td></tr>').join('');\n" +
  "    })()}</tbody>"

// The LIVE schedule branch. `reportBody` is declared once and then REASSIGNED
// (`const _oldReportBody = reportBody; reportBody = function(){…}`), so the declaration
// patched above is the dead twin — verified in the browser: after patching it the Scheduled
// Reports tab still rendered a header with an empty body and no empty-state row, because this
// copy was doing the rendering. It has six columns, not five (it adds a Preview action), and
// its next-run array falls back to a literal '12 Aug' past the sixth row.
const SCHEDULE_LIVE_ANCHOR =
  "<tbody>${reportSet.map((r,i)=>`<tr data-action=\"preview-report\" data-id=\"${r.id}\">" +
  "<td><strong>${esc(r.name)}</strong></td><td>${esc(r.schedule)}</td>" +
  "<td>${['10 Aug','12 Aug','10 Oct','06 Sep','15 Aug','01 Oct'][i]||'12 Aug'}</td>" +
  "<td>${esc(r.category)}</td><td>${badge(r.status)}</td><td>${smallBtn('Preview','preview-report',r.id)}</td></tr>`).join('')}</tbody>"

const SCHEDULE_LIVE =
  "<tbody>${/* patched:reports-schedule-live */(() => {\n" +
  "      if (!reportSet.length) return '<tr><td colspan=\"6\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">No report schedules are stored yet</td></tr>';\n" +
  "      return reportSet.map(r => '<tr data-action=\"preview-report\" data-id=\"' + esc(r.id) + '\">'\n" +
  "        + '<td><strong>' + esc(r.name) + '</strong></td><td>' + esc(r.schedule) + '</td>'\n" +
  "        // Next run came from a literal array indexed by row position, with '12 Aug' for\n" +
  "        // anything past the sixth row. Nothing computes a next run.\n" +
  "        + '<td>' + __perfDash() + '</td><td>' + esc(r.category) + '</td><td>' + badge(r.status) + '</td>'\n" +
  "        + '<td>' + smallBtn('Preview','preview-report',r.id) + '</td></tr>').join('');\n" +
  "    })()}</tbody>"

// Delivery controls — four publication rules each badged "Active". Nothing enforces or stores
// a publication rule, so the badge was an assurance claim with no source. The rules themselves
// are the module's documented intent and are kept; only the "Active" verdict goes.
// Byte-identical in the dead and the live `reportBody`, and both should change.
const DELIVERY_ANCHOR =
  "<div class=\"card-body list\"><div class=\"list-row\"><div class=\"list-main\"><strong>Executive packs</strong>" +
  "<span>Executive reviewer approval required before publish</span></div>${badge('Active')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Compliance reports</strong>" +
  "<span>HR/M&E preparer + Executive publisher</span></div>${badge('Active')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Employee review documents</strong>" +
  "<span>Manager + employee sign-off required</span></div>${badge('Active')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Sensitive financial annexures</strong>" +
  "<span>Role and audience filtered</span></div>${badge('Active')}</div></div></section></div>`;"

const DELIVERY =
  "<div class=\"card-body list\"><div class=\"list-row\"><div class=\"list-main\"><strong>Executive packs</strong>" +
  "<span>Executive reviewer approval required before publish</span></div>${/* patched:reports-delivery-controls */__perfDash()}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Compliance reports</strong>" +
  "<span>HR/M&E preparer + Executive publisher</span></div>${__perfDash()}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Employee review documents</strong>" +
  "<span>Manager + employee sign-off required</span></div>${__perfDash()}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Sensitive financial annexures</strong>" +
  "<span>Role and audience filtered</span></div>${__perfDash()}</div></div></section></div>`;"

export default [
  { label: "reports-fixture", find: FIXTURE_ANCHOR, repl: FIXTURE },
  { label: "reports-visible-employee", find: VISIBLE_EMP_ANCHOR, repl: VISIBLE_EMP },
  { label: "reports-library", find: LIBRARY_ANCHOR, repl: LIBRARY },
  { label: "reports-preview-metrics", find: PREVIEW_ANCHOR, repl: PREVIEW },
  { label: "reports-preview-chart", find: CHART_ANCHOR, repl: CHART },
  { label: "reports-insights", find: INSIGHTS_ANCHOR, repl: INSIGHTS },
  { label: "reports-compliance-head", find: COMPLIANCE_HEAD_ANCHOR, repl: COMPLIANCE_HEAD },
  { label: "reports-compliance-orb", find: ORB_ANCHOR, repl: ORB },
  { label: "reports-compliance-kpis", find: COMPLIANCE_KPIS_ANCHOR, repl: COMPLIANCE_KPIS },
  { label: "reports-control-register", find: CONTROL_GRID_ANCHOR, repl: CONTROL_GRID },
  { label: "reports-control-card", find: CONTROL_FN_ANCHOR, repl: CONTROL_FN },
  { label: "reports-schedule", find: SCHEDULE_ANCHOR, repl: SCHEDULE },
  { label: "reports-schedule-live", find: SCHEDULE_LIVE_ANCHOR, repl: SCHEDULE_LIVE },
  { label: "reports-delivery-controls", find: DELIVERY_ANCHOR, repl: DELIVERY, occurrences: 2 },
]
