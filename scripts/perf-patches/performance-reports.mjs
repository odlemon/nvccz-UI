/**
 * Performance Reports hub (`/performance/performance-reports`).
 *
 * LIVE RENDERER — established by tracing the override chain, not by grepping:
 *   This page id is claimed twice. The v8 layer registers `performanceReports:
 *   performanceReportsV8` in its `v8Pages` map (the "Report library / Live report preview /
 *   Reporting intelligence" generation). The LATER v12 layer replaces `render` wholesale
 *   (`render=renderV12`) and short-circuits before the v8 dispatch —
 *   `if(state.page==='performanceReports'){ … w.innerHTML=reportsHub(); … return }` — so
 *   `reportsHub()` is the function that renders and `performanceReportsV8` is dead.
 *   Confirmed against `.perf-dumps/a5/sysadmin__performanceReports.txt`: the page shows the
 *   v12 tab bar (Library / Report Studio / Schedules / History), which only `reportsHub()`
 *   emits. Patching the v8 twin would have changed nothing on screen.
 *
 * WHAT WAS FABRICATED
 *   Library tab — six invented report definitions (RPT-001…006, from the same `state.reports`
 *   fixture the Reports & Compliance page used) and a preview card asserting Overall score
 *   81.6%, Evidence 96%, Exceptions 5 for whichever report was selected.
 *   Report Studio — a canvas headed "Q3 Enterprise Performance Review" asserting Overall score
 *   81.6%, KPI attainment 76.4%, Review completion 82%, plus a default executive-summary block
 *   stating that performance "remains broadly on track".
 *   Schedules — one row per fixture report, each with a next-run date taken from a literal
 *   array indexed by ROW POSITION and an Active/Paused badge from a local toggle map.
 *   History — four invented runs (RUN-260811-012 … RUN-260808-021) with invented timestamps,
 *   "Completed" badges and recipient counts.
 *
 *   Nothing stores a report definition, a report run, a schedule or a report score. Every one
 *   of those figures was asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   All four tabs render honest empty states saying the records are not stored yet, and every
 *   figure without a source reads as an em dash. Nothing is derived from row position.
 *
 *   The report rows themselves are emptied by `reports.mjs` (`reports-fixture`), because
 *   `visibleReports()` is shared by both pages — one fixture, two pages.
 *
 * WHY NOTHING HERE IS WIRED LIVE — and what the backend would need:
 *   There is no report-definition, report-run or schedule scope. `analyticsReports`
 *   (`GET /performance/analytics/reports`) is NOT one: it summarises GOAL PROGRESS
 *   (`{total, completed, inProgress, planning, averageProgress}`), so feeding its `total` into
 *   a report count would be real data under the wrong label. The gaps are the same as the ones
 *   listed in `reports.mjs`: a report-definition register, a run history with recipients, a
 *   schedule store with a computed next run, and a per-report score if the preview tiles are to
 *   mean anything.
 */

// ---------------------------------------------------------------------------
// Library tab.
// ---------------------------------------------------------------------------
const LIBRARY_ANCHOR =
  "<tbody class=\"v12-report-rows\">${set.map(r=>`<tr data-v12-action=\"report-select\" data-id=\"${r.id}\" style=\"${r.id===sel?.id?'background:#faf9ff':''}\">" +
  "<td><strong>${esc(r.name)}</strong><div class=\"tiny\">${r.id}</div></td><td>${esc(r.category)}</td><td>${esc(r.owner)}</td>" +
  "<td>${esc(r.schedule)}</td><td>${esc(r.last)}</td><td>${esc(r.format)}</td><td>${badge(r.status)}</td>" +
  "<td><button class=\"btn small\" data-action=\"preview-report\" data-id=\"${r.id}\">${icon('eye')}Preview</button></td></tr>`).join('')}</tbody>"

// Styling copied from `__perfEmptyRow` so every empty table in the module looks the same. The
// wording differs on purpose: `__perfEmptyRow` distinguishes "nothing created yet" from "could
// not load", and neither is true here — there is no endpoint to load from at all.
const LIBRARY =
  "<tbody class=\"v12-report-rows\">${/* patched:perf-reports-library */(() => {\n" +
  "      if (!set.length) return '<tr><td colspan=\"8\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">No report definitions are stored yet</td></tr>';\n" +
  "      return set.map(r => '<tr data-v12-action=\"report-select\" data-id=\"' + esc(r.id) + '\" style=\"' + (r.id===sel?.id?'background:#faf9ff':'') + '\">'\n" +
  "        + '<td><strong>' + esc(r.name) + '</strong><div class=\"tiny\">' + esc(r.id) + '</div></td>'\n" +
  "        + '<td>' + esc(r.category) + '</td><td>' + esc(r.owner) + '</td><td>' + esc(r.schedule) + '</td>'\n" +
  "        + '<td>' + esc(r.last) + '</td><td>' + esc(r.format) + '</td><td>' + badge(r.status) + '</td>'\n" +
  "        + '<td><button class=\"btn small\" data-action=\"preview-report\" data-id=\"' + esc(r.id) + '\">' + icon('eye') + 'Preview</button></td></tr>').join('');\n" +
  "    })()}</tbody>"

const PREVIEW_ANCHOR =
  "<div class=\"v12-report-summary\"><div><span>Overall score</span><strong>81.6%</strong></div>" +
  "<div><span>Evidence</span><strong>96%</strong></div><div><span>Exceptions</span><strong>5</strong></div></div>"

const PREVIEW =
  "<div class=\"v12-report-summary\"><div><span>Overall score</span><strong>${/* patched:perf-reports-preview */__perfDash()}</strong></div>" +
  "<div><span>Evidence</span><strong>${__perfDash()}</strong></div><div><span>Exceptions</span><strong>${__perfDash()}</strong></div></div>"

// ---------------------------------------------------------------------------
// Report Studio tab. Distinguished from the preview block above only by the inline
// `style="margin-top:14px"` — the two `v12-report-summary` blocks are otherwise the same shape.
// ---------------------------------------------------------------------------
const STUDIO_ANCHOR =
  "<div class=\"v12-report-summary\" style=\"margin-top:14px\"><div><span>Overall score</span><strong>81.6%</strong></div>" +
  "<div><span>KPI attainment</span><strong>76.4%</strong></div><div><span>Review completion</span><strong>82%</strong></div></div>"

const STUDIO =
  "<div class=\"v12-report-summary\" style=\"margin-top:14px\"><div><span>Overall score</span><strong>${/* patched:perf-reports-studio */__perfDash()}</strong></div>" +
  "<div><span>KPI attainment</span><strong>${__perfDash()}</strong></div><div><span>Review completion</span><strong>${__perfDash()}</strong></div></div>"

const STUDIO_BLOCK_ANCHOR =
  "'<div class=\"v12-context-panel\"><h4>Executive summary</h4><p>Performance remains broadly on track. Internal process execution and customer retention require focused management intervention.</p></div>'"

// The starter block asserted a conclusion about organizational performance. It is a blank
// prompt now — the author writes the summary, the canvas does not assert one for them.
// The marker sits in JS comment position, NOT inside the markup — a `/* … */` placed in HTML
// text content renders as visible page copy.
const STUDIO_BLOCK =
  "/* patched:perf-reports-studio-block */'<div class=\"v12-context-panel\"><h4>Executive summary</h4>" +
  "<p>Start the executive summary here. No performance conclusion is generated for you.</p></div>'"

// ---------------------------------------------------------------------------
// Schedules tab.
// ---------------------------------------------------------------------------
const SCHEDULE_ANCHOR =
  "<div class=\"v12-card-body v12-schedule-list\">${set.slice(0,6).map((r,i)=>`<div class=\"v12-schedule\">" +
  "<div><strong>${esc(r.name)}</strong><span>${esc(r.owner)} · ${esc(r.format)}</span></div>" +
  "<div><strong>${esc(r.schedule)}</strong><span>Next run ${['12 Aug','13 Aug','15 Aug','18 Aug','20 Aug','31 Aug'][i]}</span></div>" +
  "<div>${badge(V.schedules[r.id]===false?'Paused':'Active')}</div>" +
  "<div class=\"actions\"><button class=\"btn small\" data-v12-action=\"schedule-run\" data-id=\"${r.id}\">Run now</button>" +
  "<button class=\"btn small\" data-v12-action=\"schedule-toggle\" data-id=\"${r.id}\">${V.schedules[r.id]===false?'Resume':'Pause'}</button></div></div>`).join('')}</div></section>`;"

const SCHEDULE =
  "<div class=\"v12-card-body v12-schedule-list\">${/* patched:perf-reports-schedules */(() => {\n" +
  "      if (!set.length) return '<div style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">No report schedules are stored yet</div>';\n" +
  "      return set.map(r => '<div class=\"v12-schedule\">'\n" +
  "        + '<div><strong>' + esc(r.name) + '</strong><span>' + esc(r.owner) + ' \\u00b7 ' + esc(r.format) + '</span></div>'\n" +
  "        // Next run came from a literal array indexed by row position; nothing computes one.\n" +
  "        + '<div><strong>' + esc(r.schedule) + '</strong><span>Next run ' + __perfDash() + '</span></div>'\n" +
  "        + '<div>' + badge(V.schedules[r.id]===false?'Paused':'Active') + '</div>'\n" +
  "        + '<div class=\"actions\"><button class=\"btn small\" data-v12-action=\"schedule-run\" data-id=\"' + esc(r.id) + '\">Run now</button>'\n" +
  "        + '<button class=\"btn small\" data-v12-action=\"schedule-toggle\" data-id=\"' + esc(r.id) + '\">' + (V.schedules[r.id]===false?'Resume':'Pause') + '</button></div></div>').join('');\n" +
  "    })()}</div></section>`;"

// ---------------------------------------------------------------------------
// History tab.
// ---------------------------------------------------------------------------
const HISTORY_FIXTURE_ANCHOR =
  "const runs=[['RUN-260811-012','Monthly Executive Performance Pack','11 Aug 2026 · 05:05','Completed','12 recipients']," +
  "['RUN-260810-008','Department Scorecards','10 Aug 2026 · 09:02','Completed','8 recipients']," +
  "['RUN-260809-003','Performance Governance Compliance','09 Aug 2026 · 16:22','Completed','6 recipients']," +
  "['RUN-260808-021','KPI Variance & Exceptions','08 Aug 2026 · 08:31','Completed','7 recipients']];"

const HISTORY_FIXTURE =
  "/* patched:perf-reports-history-fixture */\n" +
  "      // Was four invented runs with invented timestamps, outcomes and recipient counts.\n" +
  "      // No report run is recorded anywhere, so there is no execution history to list.\n" +
  "      const runs=[];"

const HISTORY_ANCHOR =
  "<div class=\"v12-card-body v12-history-list\">${runs.map(r=>`<button class=\"v12-history\" data-v12-action=\"run-detail\" data-id=\"${r[0]}\">" +
  "<div><strong>${r[1]}</strong><span>${r[0]}</span></div><span>${r[2]}</span>${badge(r[3])}<span>${r[4]}</span></button>`).join('')}</div></section>`;"

const HISTORY =
  "<div class=\"v12-card-body v12-history-list\">${/* patched:perf-reports-history */runs.length" +
  " ? runs.map(r=>`<button class=\"v12-history\" data-v12-action=\"run-detail\" data-id=\"${r[0]}\">" +
  "<div><strong>${r[1]}</strong><span>${r[0]}</span></div><span>${r[2]}</span>${badge(r[3])}<span>${r[4]}</span></button>`).join('')" +
  " : '<div style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">No report runs are recorded yet</div>'}</div></section>`;"

export default [
  { label: "perf-reports-library", find: LIBRARY_ANCHOR, repl: LIBRARY },
  { label: "perf-reports-preview", find: PREVIEW_ANCHOR, repl: PREVIEW },
  { label: "perf-reports-studio", find: STUDIO_ANCHOR, repl: STUDIO },
  { label: "perf-reports-studio-block", find: STUDIO_BLOCK_ANCHOR, repl: STUDIO_BLOCK },
  { label: "perf-reports-schedules", find: SCHEDULE_ANCHOR, repl: SCHEDULE },
  { label: "perf-reports-history-fixture", find: HISTORY_FIXTURE_ANCHOR, repl: HISTORY_FIXTURE },
  { label: "perf-reports-history", find: HISTORY_ANCHOR, repl: HISTORY },
]
