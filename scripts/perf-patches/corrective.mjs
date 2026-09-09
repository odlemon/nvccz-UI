/**
 * Corrective Actions (`/performance/corrective`).
 *
 * LIVE RENDERER — established by tracing the override chain, not by grepping:
 *   `corrective` is redefined twice. L1379 `corrective=function(){return baseCorrective6()}`
 *   wraps L1251 `corrective=function(){...correctiveOverviewV5()}`, so the function that
 *   actually renders is `correctiveOverviewV5()`. Two other layers carry an "Open actions"
 *   KPI with the identical numbers and neither is reachable — the KPI strip below is
 *   therefore replaced as ONE block whose anchor spans all five cards, because several of
 *   the individual card strings are byte-identical to their dead twins and would have
 *   patched the wrong generation. Confirmed against `.perf-dumps/sysadmin__corrective.txt`.
 *
 * WHAT WAS FABRICATED
 *   Five KPI cards: Open actions 68 (+8% vs last month), Overdue 14 (+16.7%), High severity
 *   18 (+12.5%), Resolved this month 23 (+27.8%), Avg. resolution 18.4d (-2.1 days).
 *   A five-row register of invented actions (CA-2026-014 … -027) with invented owners,
 *   triggers, progress bars and target dates.
 *   A root-cause concentration panel (29/24/16/13/10%) and an "executive insight" claiming
 *   "3 actions require sponsor intervention" and a "21%" predicted reduction.
 *
 *   The `performance_corrective_actions` table has 0 rows. Every one of those figures was
 *   asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   Open / Overdue / High severity / Closed come from
 *   `GET /performance/corrective-actions/summary` (`correctiveSummary` scope) — real
 *   tallies, including a real 0.
 *   The register renders the real `correctiveActions` scope, with a distinct empty row for
 *   "none created yet" versus "could not load".
 *   Avg. resolution, the root-cause split and the insight paragraph have no source at all
 *   and read as not-tracked rather than as numbers.
 */

const KPI_STRIP_ANCHOR =
  "${kpi('Open actions','68','+8% vs last month','corrective','down','corrective')}" +
  "${kpi('Overdue','14','+16.7%','alerts','down','corrective')}" +
  "${kpi('High severity','18','+12.5%','shield','down','corrective')}" +
  "${kpi('Resolved this month','23','+27.8%','check','up','corrective')}" +
  "${kpi('Avg. resolution','18.4d','-2.1 days','clock','up','corrective')}"

const KPI_STRIP = `\${/* patched:corrective-kpis */(() => {
  const s = __perfObject('correctiveSummary');
  const sev = s && s.bySeverity ? s.bySeverity : null;
  return kpi('Open actions', __perfNum('correctiveSummary', 'open'),
             s ? (s.open ? 'Not yet closed' : 'None open') : 'Unavailable',
             'corrective', 'down', 'corrective')
       + kpi('Overdue', __perfNum('correctiveSummary', 'overdue'),
             'Past target date', 'alerts', 'down', 'corrective')
       + kpi('High severity', sev ? String((sev.high || 0) + (sev.critical || 0)) : __perfDash(),
             'High and critical', 'shield', 'down', 'corrective')
       + kpi('Closed', __perfTally('correctiveSummary', 'byStatus', 'closed'),
             'Total closed to date', 'check', 'up', 'corrective')
       // Nothing records when an action moved between states, so there is no duration to average.
       + kpi('Avg. resolution', __perfDash(), 'Not yet tracked', 'clock', 'up', 'corrective');
})()}`

const REGISTER = `\${/* patched:corrective-register */(() => {
  const rows = __perfScope('correctiveActions');
  if (rows === null || rows.length === 0) return __perfEmptyRow('correctiveActions', 8, 'corrective actions');
  return rows.map(a => {
    const pct = a.progress;
    const tone = pct == null ? 'brand' : pct < 50 ? 'red' : pct < 70 ? 'amber' : 'emerald';
    return '<tr class="click-hint" data-action="v5-corrective-row" data-v5-corrective="' + esc(a.reference || a.id) + '">'
      + '<td><strong>' + esc(a.reference || '\\u2014') + '</strong></td>'
      + '<td><strong>' + esc(a.name) + '</strong><div class="tiny">Open recovery workspace \\u2192</div></td>'
      + '<td>' + (a.trigger ? esc(a.trigger) : __perfDash()) + '</td>'
      + '<td>' + (a.owner ? personV5(a.owner) : __perfDash()) + '</td>'
      + '<td>' + badge(__perfLabel(a.severity)) + '</td>'
      + '<td style="min-width:120px">' + progress(pct == null ? 0 : pct, tone)
        + '<div class="tiny">' + (pct == null ? __perfDash() : pct + '%') + '</div></td>'
      + '<td>' + __perfDate(a.targetDate) + '</td>'
      + '<td>' + badge(__perfLabel(a.status)) + '</td>'
      + '</tr>';
  }).join('');
})()}`

export default [
  {
    label: "corrective-fixture",
    find:
      "    const actions=[['CA-2026-014','Improve digital adoption','Digital Adoption 68% vs 80%','Nyasha Dube','High',58,'31 Aug 2026','In Progress'],['CA-2026-019','Close review completion gap','Review Completion 56% vs 80%','Natasha Chari','High',42,'22 Aug 2026','Escalated'],['CA-2026-021','Reduce processing cycle time','Invoice Processing 5.8d vs 3d','Kundai Chikore','Medium',71,'25 Aug 2026','In Progress'],['CA-2026-024','Improve employee engagement','Engagement 68% vs 75%','Chipo Ncube','Medium',50,'30 Aug 2026','Open'],['CA-2026-027','Recover system availability','System Uptime 95.1% vs 99%','Tendai Nyathi','High',66,'18 Aug 2026','In Progress']];",
    repl:
      "    /* patched:corrective-fixture */\n" +
      "    // Was five invented actions with invented owners, triggers and progress. The register\n" +
      "    // below now renders the live `correctiveActions` scope; this binding is kept only so\n" +
      "    // any later layer that still reads `actions` sees an empty list rather than fixtures.\n" +
      "    const actions=[];",
  },
  {
    // One block, not five: 'Resolved this month' and 'Open actions' are byte-identical in a
    // dead generation earlier in the file, and replacing them individually silently patched
    // that dead copy instead. The five-card span is unique.
    label: "corrective-kpis",
    find: KPI_STRIP_ANCHOR,
    repl: KPI_STRIP,
  },
  {
    label: "corrective-register",
    find:
      "${actions.map(a=>`<tr class=\"click-hint\" data-action=\"v5-corrective-row\" data-v5-corrective=\"${a[0]}\"><td><strong>${a[0]}</strong></td><td><strong>${a[1]}</strong><div class=\"tiny\">Open recovery workspace →</div></td><td>${a[2]}</td><td>${personV5(a[3])}</td><td>${badge(a[4])}</td><td style=\"min-width:120px\">${progress(a[5],a[5]<50?'red':a[5]<70?'amber':'emerald')}<div class=\"tiny\">${a[5]}%</div></td><td>${a[6]}</td><td>${badge(a[7])}</td></tr>`).join('')}",
    repl: REGISTER,
  },
  {
    label: "corrective-rootcause",
    find:
      "${[['Process gap',29],['Resource constraint',24],['Skills / competency',16],['Policy / procedure',13],['System / data',10]].map(x=>`<div class=\"spark-row-v5\"><span>${x[0]}</span>${sparkV5(x[1]>25?'red':x[1]>18?'amber':'brand')}<strong>${x[1]}%</strong></div>`).join('')}",
    // Root cause is not a column on the table and nothing captures it, so there is no split
    // to show. An honest "not captured" beats five invented percentages.
    repl:
      "${/* patched:corrective-rootcause */`<p class=\"tiny\" style=\"margin:0;color:var(--muted,#6b7280)\">Root cause is not captured on corrective actions yet, so no concentration can be calculated.</p>`}",
  },
  {
    label: "corrective-insight",
    find:
      "<div class=\"insight-callout-v5\"><strong>3 actions require sponsor intervention</strong><p>Schedule slippage is concentrated in digital adoption and review completion. Reassigning two approvals and one training dependency could reduce predicted overdue exposure by 21%.</p></div>",
    repl:
      "${/* patched:corrective-insight */`<div class=\"insight-callout-v5\"><strong>${__perfNum('correctiveSummary','overdue')} overdue</strong><p>${(function(){const o=__perfObject('correctiveSummary');if(!o)return 'Corrective action data is unavailable.';if(!o.overdue)return 'No corrective action is past its target date.';return o.overdue+' corrective action'+(o.overdue===1?' is':'s are')+' past the target date and need a decision from the owner or sponsor.'})()}</p></div>`}",
  },
  {
    label: "corrective-trend",
    // Nothing records corrective-action status transitions, so there is no open/overdue/
    // resolved series to plot. `trendV5(54,73)` drew a rising curve out of two constants.
    find: "${trendV5(54,73)}",
    repl: "${/* patched:corrective-trend */__perfNoSeries('Corrective action status changes are not recorded yet, so no recovery trend can be drawn.')}",
  },
  {
    // Makes the 'Log action' modal a real form: named fields, live owner/department
    // pickers, and a submit action the host intercepts (see lib/performance-v22-mock/
    // actions.ts). Previously the Create button was `toast-close` - success with no request.
    label: "corrective-modal",
    find: "function newCorrective(){modal('Log Corrective Action','Create a structured performance-recovery plan with accountability, evidence and verification.',`<form class=\"form-grid\"><div class=\"field full\"><label>Action title</label><input required></div><div class=\"field\"><label>Trigger</label><select><option>KPI underperformance</option><option>Missed objective</option><option>Review finding</option><option>Audit / compliance finding</option></select></div><div class=\"field\"><label>Severity</label><select><option>Medium</option><option>High</option><option>Critical</option></select></div><div class=\"field\"><label>Owner</label><select><option>Department Manager</option><option>HR/M&E Manager</option></select></div><div class=\"field\"><label>Target resolution</label><input type=\"date\" value=\"2026-08-31\"></div><div class=\"field full\"><label>Problem statement</label><textarea></textarea></div><div class=\"field full\"><label>Root cause / initial hypothesis</label><textarea></textarea></div></form>`,btn('Cancel','close-overlays')+btn('Create action','toast-close','primary','plus'))}",
    repl: "function newCorrective(){/* patched:corrective-modal */\n // Was a form with no id, no field names, two hardcoded \"owners\" that were job titles rather\n // than people, a hardcoded target date of 2026-08-31, and a submit button wired to\n // `toast-close` - i.e. it reported success and saved nothing.\n //\n // Now: a real form the host can read (`newCorrectiveForm`), owner and department pickers\n // built from the live `users` and `departments` scopes, and a submit action the host\n // intercepts and POSTs. `severity` values are the ones the API accepts, not display labels.\n const __people = __perfScope('users') || [];\n const __depts = __perfScope('departments') || [];\n const __opt = (v, l) => '<option value=\"' + esc(v) + '\">' + esc(l) + '</option>';\n const __ownerOpts = __people.length\n   ? '<option value=\"\">Unassigned</option>' + __people.map(u => __opt(u.id, u.department ? u.name + ' \u00b7 ' + u.department : u.name)).join('')\n   : '<option value=\"\">No users available</option>';\n const __deptOpts = __depts.length\n   ? '<option value=\"\">No department</option>' + __depts.map(d => __opt(d.id, d.name)).join('')\n   : '<option value=\"\">No departments available</option>';\n modal('Log Corrective Action','Create a structured performance-recovery plan with accountability, evidence and verification.',`<form id=\"newCorrectiveForm\" class=\"form-grid\"><div class=\"field full\"><label>Action title</label><input name=\"title\" required></div><div class=\"field\"><label>Trigger</label><select name=\"trigger\"><option>KPI underperformance</option><option>Missed objective</option><option>Review finding</option><option>Audit / compliance finding</option></select></div><div class=\"field\"><label>Severity</label><select name=\"severity\"><option value=\"medium\">Medium</option><option value=\"high\">High</option><option value=\"critical\">Critical</option></select></div><div class=\"field\"><label>Owner</label><select name=\"ownerId\">${__ownerOpts}</select></div><div class=\"field\"><label>Department</label><select name=\"departmentId\">${__deptOpts}</select></div><div class=\"field\"><label>Target resolution</label><input type=\"date\" name=\"targetDate\"></div><div class=\"field full\"><label>Problem statement</label><textarea name=\"description\"></textarea></div></form>`,btn('Cancel','close-overlays')+btn('Create action','submit-corrective','primary','plus'))}\n",
  },
]
