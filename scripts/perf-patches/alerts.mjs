/**
 * Alerts & Escalations (`/performance/alerts`).
 *
 * LIVE RENDERER — established by tracing the override chain, not by grepping:
 *   `alerts` is declared twice. The base `function alerts(){…}` (the "Alerts, Escalations &
 *   Audit Trail" generation, six KPI cards including "Data freshness 99.8%" and "Audit events
 *   1,248") is DEAD — it is overwritten by `alerts=function(){…}` in the v4/inspo layer, which
 *   renders the four-card strip and the `data-v4-alert` register that the browser actually
 *   shows. Confirmed against `.perf-dumps/a5/sysadmin__alerts.txt`: the page has four cards,
 *   not six, and the register columns are Alert/Source/Severity/Owner/Escalation/Elapsed/
 *   Status — the live layer's, not the dead one's.
 *
 *   The dead generation's first KPI card is byte-identical to the live one except for one
 *   argument (`'alerts','up','alerts'` vs `'alerts','down','alerts'`), so an anchor lifted
 *   from the wrong copy patches nothing visible. The strip below is anchored on the live
 *   four-card span.
 *
 * WHAT WAS FABRICATED
 *   Four KPI cards: Critical alerts 18 (-12% vs June), Escalated items 27 (+8%), SLA breaches
 *   14 (-5%), Auto-resolved 46 (+15%).
 *   A six-row register of invented alerts (Revenue Growth, Customer Satisfaction, Finance
 *   Close, Portfolio Sync, Q2 Report, Employee Engagement) with invented owners, escalation
 *   levels and elapsed times.
 *   An "Alert rule logic" panel asserting a configured escalation ladder — owner after 24h,
 *   department manager after 48h, executive sponsor after 72h.
 *   Three notification channels all badged "On".
 *   A detail drawer that showed the SAME hardcoded alert (Critical / Level 2 / 2h 45m / "42
 *   against target 50") whichever row was clicked.
 *
 *   `performance_alerts` has 0 rows and `GET /performance/alerts/summary` returns zeros for
 *   every tally. Every one of those figures was asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   Critical / Escalated / Resolved come from `GET /performance/alerts/summary`
 *   (`alertSummary` scope) — real tallies, including a real 0.
 *   The register renders the real `alerts` scope, with a distinct empty row for "none raised
 *   yet" versus "could not load", and the drawer reads the clicked row's own record.
 *   SLA breaches, the escalation ladder, notification-channel state, and the threshold /
 *   acknowledgement detail in the drawer have no source at all and read as not-tracked
 *   rather than as numbers.
 *
 * STILL UNSOURCED (backend gaps, reported upward):
 *   - no SLA target on an alert, so "SLA breaches" cannot be derived
 *   - no auto-vs-manual resolution flag, so "Auto-resolved" cannot be derived (the card now
 *     shows the tally the data CAN answer: Resolved)
 *   - no alert-rule store (condition, escalation windows, recipients)
 *   - no notification-channel configuration
 *   - no threshold reading (current/previous value) or acknowledgement history on an alert
 */

const KPIS_ANCHOR =
  "${kpi('Critical alerts','18','-12% vs June','alerts','down','alerts')}" +
  "${kpi('Escalated items','27','+8%','corrective','down','alerts')}" +
  "${kpi('SLA breaches','14','-5%','clock','up','alerts')}" +
  "${kpi('Auto-resolved','46','+15%','check','up','alerts')}"

const KPIS = `\${/* patched:alerts-kpis */(() => {
  const s = __perfObject('alertSummary');
  return kpi('Critical alerts', __perfNum('alertSummary', 'critical'),
             s ? (s.critical ? 'Severity critical' : 'None critical') : 'Unavailable',
             'alerts', 'down', 'alerts')
       + kpi('Escalated items', __perfNum('alertSummary', 'escalated'),
             s ? (s.escalated ? 'Raised above level 1' : 'None escalated') : 'Unavailable',
             'corrective', 'down', 'alerts')
       // An alert carries no SLA target, so no breach can be derived from anything stored.
       + kpi('SLA breaches', __perfDash(), 'Not yet tracked', 'clock', 'up', 'alerts')
       // The register records THAT an alert was resolved, never whether a rule or a person
       // resolved it - so "auto-resolved" has no source. The tally the data can answer is
       // how many are resolved at all, which is what this card now says.
       + kpi('Resolved', __perfTally('alertSummary', 'byStatus', 'resolved'),
             'Closed to date', 'check', 'up', 'alerts');
})()}`

const REGISTER_ANCHOR =
  "<tbody>${[['KPI below threshold: Revenue Growth','Revenue Growth KPI','Critical','Tendai Nyathi','Level 2','2h 45m','Open']," +
  "['Missed update: Customer Satisfaction','Customer Satisfaction','High','Rumbidzai Nyathi','Level 1','1d 6h','Escalated']," +
  "['SLA breach: Finance Close','Finance Close','Critical','Tendai Chivayo','Level 3','2d 3h','Open']," +
  "['Failed integration: Portfolio Sync','Integration','Medium','Kudakwashe Sibanda','Level 1','8h 12m','Investigating']," +
  "['Overdue action: Approve Q2 Report','Q2 Performance Report','High','Kundai Chikore','Level 2','2d 5h','Escalated']," +
  "['Missed update: Employee Engagement','Employee Engagement','Medium','Nyasha Bhebhe','Level 1','1d 1h','Open']]" +
  ".map((r,i)=>`<tr class=\"click-hint\" data-v4-alert=\"${i}\"><td><strong>${r[0]}</strong></td><td>${r[1]}</td>" +
  "<td>${badge(r[2])}</td><td>${person(r[3])}</td><td>${r[4]}</td><td>${r[5]}</td><td>${badge(r[6])}</td></tr>`).join('')}</tbody>"

// `elapsedMinutes` is computed server-side from `raisedAt`, so no client date arithmetic is
// involved and no timezone shift is possible - it is safe to format directly.
const REGISTER = `<tbody>\${/* patched:alerts-register */(() => {
  const rows = __perfScope('alerts');
  if (rows === null || rows.length === 0) return __perfEmptyRow('alerts', 7, 'alerts');
  const elapsed = (m) => {
    if (m == null) return __perfDash();
    const n = Math.max(0, Math.round(m));
    if (n < 60) return n + 'm';
    if (n < 1440) return Math.floor(n / 60) + 'h ' + (n % 60) + 'm';
    return Math.floor(n / 1440) + 'd ' + Math.floor((n % 1440) / 60) + 'h';
  };
  return rows.map(a => '<tr class="click-hint" data-v4-alert="' + esc(a.id) + '">'
    + '<td><strong>' + esc(a.name || '\\u2014') + '</strong></td>'
    + '<td>' + (a.source ? esc(a.source) : __perfDash()) + '</td>'
    + '<td>' + badge(__perfLabel(a.severity)) + '</td>'
    + '<td>' + (a.owner ? person(a.owner) : __perfDash()) + '</td>'
    + '<td>' + (a.escalationLevel == null ? __perfDash() : 'Level ' + a.escalationLevel) + '</td>'
    + '<td>' + elapsed(a.elapsedMinutes) + '</td>'
    + '<td>' + badge(__perfLabel(a.status)) + '</td>'
    + '</tr>').join('');
})()}</tbody>`

const RULE_ANCHOR =
  "<div class=\"side-list\">${sideItem('Condition','Actual value < threshold','')}" +
  "${sideItem('Level 1','KPI owner · after 24 hours','')}" +
  "${sideItem('Level 2','Department manager · after 48 hours','')}" +
  "${sideItem('Level 3','Executive sponsor · after 72 hours','')}</div>"

// There is no alert-rule store anywhere: no condition, no escalation windows, no recipients.
// The 24/48/72-hour ladder was a claim about system behaviour that does not exist.
const RULE =
  "<div class=\"side-list\">${/* patched:alerts-rule-logic */sideItem('Condition','Not yet configurable',__perfDash())}" +
  "${sideItem('Level 1','Escalation window not configured',__perfDash())}" +
  "${sideItem('Level 2','Escalation window not configured',__perfDash())}" +
  "${sideItem('Level 3','Escalation window not configured',__perfDash())}</div>"

const CHANNELS_ANCHOR =
  "${sideItem('Email','All recipients',badge('On'),'green')}" +
  "${sideItem('In-app','System notification',badge('On'),'green')}" +
  "${sideItem('WhatsApp','Configured recipients',badge('On'),'green')}"

// Nothing stores notification-channel configuration, so a green "On" badge on all three was
// an assertion that these channels are wired and healthy. They read as unconfigured now.
const CHANNELS =
  "${/* patched:alerts-channels */sideItem('Email','Not yet configured',__perfDash())}" +
  "${sideItem('In-app','Not yet configured',__perfDash())}" +
  "${sideItem('WhatsApp','Not yet configured',__perfDash())}"

const DRAWER_ANCHOR =
  "openDrawer('Alert details','Escalation workflow and threshold metadata',`<div class=\"summary-strip\">" +
  "<div class=\"summary-cell\"><span>Severity</span><strong style=\"font-size:11px;color:var(--red)\">Critical</strong></div>" +
  "<div class=\"summary-cell\"><span>Escalation</span><strong>2</strong></div>" +
  "<div class=\"summary-cell\"><span>Elapsed</span><strong style=\"font-size:11px\">2h 45m</strong></div>" +
  "<div class=\"summary-cell\"><span>Status</span><strong style=\"font-size:11px\">Open</strong></div></div>" +
  "<h3>Threshold logic</h3><div class=\"side-list\">${sideItem('Rule','Actual value < threshold','')}" +
  "${sideItem('Current value','42 against target 50','')}${sideItem('Previous value','48','')}" +
  "${sideItem('Next escalation','Department Manager in 1h 15m','')}</div>" +
  "<h3>Acknowledgement history</h3><div class=\"side-list\">" +
  "${sideItem('Tendai Moyo','Owner · not acknowledged','Overdue','red')}" +
  "${sideItem('Rumbidzai Zhou','Business leader · pending','Pending','amber')}</div>`," +
  "btn('Acknowledge alert','toast-generic','primary','check')+btn('Create action','new-corrective','','plus'));return}"

// The drawer ignored which row was clicked and always rendered the same invented alert. It
// now reads the clicked row's own record out of the live scope. Threshold readings and
// acknowledgement history are not fields the API returns, so they read as not tracked.
const DRAWER = `/* patched:alerts-drawer */(() => {
  const rows = __perfScope('alerts') || [];
  const a = rows.find(x => String(x.id) === String(al.dataset.v4Alert)) || null;
  const elapsed = (m) => {
    if (m == null) return __perfDash();
    const n = Math.max(0, Math.round(m));
    if (n < 60) return n + 'm';
    if (n < 1440) return Math.floor(n / 60) + 'h ' + (n % 60) + 'm';
    return Math.floor(n / 1440) + 'd ' + Math.floor((n % 1440) / 60) + 'h';
  };
  const cell = (label, value) => '<div class="summary-cell"><span>' + label
    + '</span><strong style="font-size:11px">' + value + '</strong></div>';
  const body = '<div class="summary-strip">'
      + cell('Severity', a ? __perfLabel(a.severity) : __perfDash())
      + cell('Escalation', a && a.escalationLevel != null ? String(a.escalationLevel) : __perfDash())
      + cell('Elapsed', a ? elapsed(a.elapsedMinutes) : __perfDash())
      + cell('Status', a ? __perfLabel(a.status) : __perfDash())
      + '</div>'
    + '<h3>Threshold logic</h3><div class="side-list">'
      + sideItem('Rule', 'Not yet configurable', __perfDash())
      + sideItem('Current value', 'Not yet tracked', __perfDash())
      + sideItem('Previous value', 'Not yet tracked', __perfDash())
      + sideItem('Next escalation', 'Not yet tracked', __perfDash())
      + '</div>'
    + '<h3>Acknowledgement history</h3><div class="side-list">'
      + sideItem('Acknowledged', a && a.acknowledgedAt ? __perfDate(a.acknowledgedAt) : 'Not acknowledged', __perfDash())
      + sideItem('Resolved', a && a.resolvedAt ? __perfDate(a.resolvedAt) : 'Not resolved', __perfDash())
      + '</div>';
  // Acknowledge/Escalate/Resolve only make sense for a real, still-open alert. 'Create action'
  // stays a manual escape hatch to the (already-live) corrective-action form.
  var actions = '';
  if (a) {
    if (a.status === 'open') actions += btn('Acknowledge','alert-acknowledge','primary','check',a.id);
    if (a.status === 'open' || a.status === 'acknowledged') actions += btn('Escalate','alert-escalate','','alerts',a.id);
    if (a.status !== 'resolved') actions += btn('Resolve','alert-resolve','','check',a.id);
  }
  actions += btn('Create action','new-corrective','','plus');
  openDrawer(a ? (a.name || 'Alert details') : 'Alert details',
             a && a.reference ? String(a.reference) : 'Escalation workflow and threshold metadata',
             body,
             actions);
})();return}`

export default [
  // One block, not four: three of the four cards are byte-identical to their twins in the
  // dead `function alerts()` generation, so replacing them individually patches that dead
  // copy. Only the four-card span starting at the 'down' variant is unique.
  { label: "alerts-kpis", find: KPIS_ANCHOR, repl: KPIS },
  { label: "alerts-register", find: REGISTER_ANCHOR, repl: REGISTER },
  { label: "alerts-rule-logic", find: RULE_ANCHOR, repl: RULE },
  { label: "alerts-channels", find: CHANNELS_ANCHOR, repl: CHANNELS },
  { label: "alerts-drawer", find: DRAWER_ANCHOR, repl: DRAWER },
]
