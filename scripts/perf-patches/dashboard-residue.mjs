/**
 * Command Centre (`/performance`) — the residue.
 *
 * LIVE RENDERER: `dashboard=function(){...}` in the v240 layer — the LAST of four stacked
 *                dashboard generations (each carries its own `now()`, `trend()`,
 *                `scorecard()`, `reviewFlow()`…). Identified by the `v240-` class prefix and
 *                confirmed against `.perf-dumps/a7/sysadmin__dashboard.txt`: only this
 *                generation's strings appear on screen. The three earlier twins at the
 *                `meta`/`tag` class prefixes are dead — two of my anchors below are
 *                deliberately lengthened past a shared fragment for exactly that reason.
 *
 * The bulk of this page is already wired by `scripts/patch-performance-runtime.mjs`
 * (`dashboard-depts`, `-scaled`, `-bullet`, `-scorecard`, `-status`, `-headcount`, `-risks`,
 * `-heatmap`, `-cell`, `-unitchart`, `-reviews-pct`, `-reviews-complete`, the queue). This
 * file is only what those left behind.
 *
 * WHAT WAS STILL FABRICATED
 *   1. Review cycle: "Not started 2 (20%) / Self review 3 (30%) / Manager review 3 (30%) /
 *      Calibration 2 (20%) / Complete 0 (0%)". Pure arithmetic on the headcount — 22%, 28%
 *      and 32% of an "open" population, plus a remainder. `reviews` and `reviewCycles` both
 *      return zero rows and no review record carries a workflow stage, so nothing measured
 *      any of it. Ten people in scope always produced exactly 2/3/3/2/0.
 *   2. Management action queue: "3 overdue actions need closure" and "50 evidence items
 *      require verification". Both were `Math.max(1, …)` over the same null metrics, so the
 *      existing `dashboard-queue-evidence` null-guard could never fire — the floor of 1
 *      guaranteed a number. 50 is literally `(100 − evidence)/2` with evidence null.
 *   3. Balanced scorecard: "Target 85%" (nothing configures a performance target) and
 *      "0/4 at target" / "Perspectives at target 0/4" — `perspectives.filter(x => x >= 85)`
 *      over four nulls is 0, i.e. "no perspective meets target" asserted about four values
 *      that do not exist.
 *   4. Two chart frames drawn over nothing: the enterprise trajectory (grid, axis, legend,
 *      Actual/Target/Forecast lines) and the rating distribution, both with empty series.
 *   5. Work execution portfolio: "0 work items", 0/0/0/0, "0% of work" — while `/api/tasks`
 *      was returning **29 rows**. `__perfDeptTable()` bucketed on `t.lane` and filtered on
 *      `t.project`, but raw scope rows carry `stage` and `department`; those names only
 *      exist on the runtime's own `state.tasks` projection. Every row fell through.
 *
 * WHAT IT SHOWS NOW
 *   Work execution portfolio: the real `tasks` scope, bucketed by real `stage` (29 items —
 *   4 To do, 25 Complete, 0 In progress / In review, which is the truth about this data),
 *   per unit by real `department`. "Not loaded" is now distinct from "loaded and empty".
 *   Organisation headcount prefers `analyticsDashboard.totalUsers` — the one endpoint that
 *   counts across the module — and falls back to the departments roll-up.
 *   Review cycle, the action queue's two counts, the scorecard target and perspective
 *   attainment, and both charts read as not-tracked instead of as numbers.
 *
 * LEFT ALONE ON PURPOSE
 *   0/50/100 and 60/70/80/90/100 (chart axes), 88+/82-87/76-81/<76 (heatmap colour legend),
 *   "1 = lowest, 5 = highest" (rating axis caption), FY2026 (a year), "10 people in scope"
 *   (a real headcount) and "refreshed HH:MM" (the actual render time).
 */

// ---------------------------------------------------------------------------------------
// 5. Work execution portfolio — the lane/department field-name mismatch.
// ---------------------------------------------------------------------------------------
const LANES_FIND = "    rows.forEach(t => { if (c[t.lane] !== undefined) c[t.lane]++; });"

const LANES_REPL =
  "    /* patched:dashboard-residue-lanes */\n" +
  "    // Raw `tasks` scope rows carry `stage` ('todo' | 'completed' | …) and never `lane`;\n" +
  "    // `lane` exists only on the runtime's own `state.tasks` projection. Reading `t.lane`\n" +
  "    // here matched nothing, so every lane counted 0 and the Work execution portfolio\n" +
  "    // reported \"0 work items\" while /api/tasks was returning 29. Same stage vocabulary as\n" +
  "    // the `live-data-rerender` projection, so the kanban and this panel cannot disagree.\n" +
  "    const __lane = (st) => {\n" +
  "      const v = String(st || '').toLowerCase();\n" +
  "      if (v.includes('complet') || v === 'done') return 'Complete';\n" +
  "      if (v.includes('review')) return 'In Review';\n" +
  "      if (v.includes('progress') || v.includes('doing')) return 'In Progress';\n" +
  "      return 'To Do';\n" +
  "    };\n" +
  "    rows.forEach(t => { const k = __lane(t.stage); if (c[k] !== undefined) c[k]++; });"

const TASKS_OK_FIND = "  const tasks = __perfScope('tasks') || [];"

const TASKS_OK_REPL =
  "  /* patched:dashboard-residue-tasks-ok */\n" +
  "  // `|| []` collapsed \"loaded and empty\" into \"could not load\", so an unavailable tasks\n" +
  "  // endpoint rendered a confident \"0 work items\". Keep the two apart.\n" +
  "  const __tasksRaw = __perfScope('tasks');\n" +
  "  const __tasksOk = __tasksRaw !== null;\n" +
  "  const tasks = __tasksRaw || [];"

// dashboard-residue-all-depts was absorbed into the built-in `dashboard-depts` patch
// in patch-performance-runtime.mjs, which now also feeds a real org-wide BSC score into
// 'All departments' (see __perfOrgBscRow) - the same anchor, so the two could not both
// patch it independently. This file's headcount-preference logic was folded into
// __perfOrgUsersOrRollup() there rather than duplicated.

const DEPT_TASKS_FIND = "      tasks: laneCounts(tasks.filter(t => t.project === d.name)),"

const DEPT_TASKS_REPL =
  "      /* patched:dashboard-residue-dept-tasks */\n" +
  "      // Raw task rows carry `department`; `project` is the runtime's own projection name, so\n" +
  "      // this filter removed every row and each unit reported zero work.\n" +
  "      tasks: __tasksOk ? laneCounts(tasks.filter(t => t.department === d.name)) : null,"

const WORK_FIND =
  "function work(d){const names=['To do','In progress','In review','Complete'],tones=['#8d96a4','#2475f5','#6554e8','#07936d'],vals=d.tasks,"

const WORK_REPL =
  "function work(d){/* patched:dashboard-residue-work */" +
  "if(!Array.isArray(d.tasks)||d.tasks.length!==4)return __perfNoSeries('Work items could not be loaded, so no delivery-stage breakdown can be shown.');" +
  "const names=['To do','In progress','In review','Complete'],tones=['#8d96a4','#2475f5','#6554e8','#07936d'],vals=d.tasks,"

const WORK_TAG_FIND = "${d.tasks.reduce((a,b)=>a+b,0)} work items"

const WORK_TAG_REPL =
  "${/* patched:dashboard-residue-work-count */" +
  "(Array.isArray(d.tasks)&&d.tasks.length===4?d.tasks.reduce((a,b)=>a+b,0):__perfDash())} work items"

// ---------------------------------------------------------------------------------------
// 1. Review cycle — five stage volumes invented from the headcount.
//
//    Replaced whole rather than guarded: every one of `total`, `complete`, `open` and the
//    three percentage constants is part of the fabrication, so there is nothing in the old
//    body worth keeping. Markup, classes, stage names, tones and order are identical.
// ---------------------------------------------------------------------------------------
const REVIEWFLOW_FIND =
  "function reviewFlow(d){const total=d.headcount,complete=Math.round(total*d.reviews/100),open=Math.max(0,total-complete),counts=[Math.round(open*.22),Math.round(open*.28),Math.round(open*.32),0,complete];counts[3]=Math.max(0,total-counts[0]-counts[1]-counts[2]-counts[4]);"

const REVIEWFLOW_REPL =
  "function reviewFlow(d){/* patched:dashboard-residue-reviewflow */" +
  "/* Was 22% / 28% / 32% of an \"open\" population plus a remainder, with `complete` derived" +
  "   from a review-completion percentage that is itself null. Ten people in scope therefore" +
  "   produced 2 / 3 / 3 / 2 / 0 on every render, in every period, for every business unit." +
  "   `reviews` and `reviewCycles` both return zero rows and no review record carries a" +
  "   workflow stage, so there is no volume to bucket into these five lanes at all. */" +
  "const counts=[null,null,null,null,null];"

const REVIEWFLOW_BODY_FIND =
  "const names=['Not started','Self review','Manager review','Calibration','Complete'],tones=['#cbd2dc','#2475f5','#0f98b6','#6554e8','#07936d'];return `<div class=\"v240-review-flow\"><div class=\"v240-flow-bar\">${counts.map((v,i)=>`<i style=\"width:${v/total*100}%;--tone:${tones[i]}\" title=\"${names[i]}: ${v}\"></i>`).join('')}</div><div class=\"v240-flow-list\">${counts.map((v,i)=>`<div class=\"v240-flow-item\" style=\"--tone:${tones[i]}\"><span>${names[i]}</span><strong>${v}</strong><em>${Math.round(v/total*100)}% of population</em></div>`).join('')}</div></div>`}"

const REVIEWFLOW_BODY_REPL =
  "/* patched:dashboard-residue-reviewflow-body */" +
  "const names=['Not started','Self review','Manager review','Calibration','Complete'],tones=['#cbd2dc','#2475f5','#0f98b6','#6554e8','#07936d'];return `<div class=\"v240-review-flow\"><div class=\"v240-flow-bar\">${counts.map((v,i)=>`<i style=\"width:${v==null?0:v/Math.max(1,counts.reduce((a,b)=>a+(b||0),0))*100}%;--tone:${tones[i]}\" title=\"${names[i]}: ${v==null?__perfDash():v}\"></i>`).join('')}</div><div class=\"v240-flow-list\">${counts.map((v,i)=>`<div class=\"v240-flow-item\" style=\"--tone:${tones[i]}\"><span>${names[i]}</span><strong>${v==null?__perfDash():v}</strong><em>${v==null?'Not yet tracked':Math.round(v/Math.max(1,counts.reduce((a,b)=>a+(b||0),0))*100)+'% of population'}</em></div>`).join('')}</div></div>`}"

// ---------------------------------------------------------------------------------------
// 2. Management action queue — "3 overdue actions", "50 evidence items".
// ---------------------------------------------------------------------------------------
const QUEUE_FIND =
  "function actionQueue(d){const overdue=Math.max(1,Math.round(d.headcount*(100-d.reviews)/100*.28)),evidence=Math.max(1,Math.round((100-d.evidence)/2)),"

const QUEUE_REPL =
  "function actionQueue(d){/* patched:dashboard-residue-queue */" +
  "/* `overdue` was 28% of the headcount scaled by a null review-completion rate; `evidence`" +
  "   was (100 - a null evidence score) / 2, i.e. a constant 50. The Math.max(1, …) floor is" +
  "   why the existing dashboard-queue-evidence null-guard could never fire. Nothing records" +
  "   overdue review actions or evidence-verification queues, so both are null and the two" +
  "   sentences below say so. */" +
  "const overdue=null,evidence=null,"

const QUEUE_OVERDUE_FIND = "`${overdue} overdue actions need closure`"

const QUEUE_OVERDUE_REPL =
  "`${/* patched:dashboard-residue-queue-overdue */" +
  "overdue==null?'Review actions not yet tracked':overdue+' overdue actions need closure'}`"

// ---------------------------------------------------------------------------------------
// 3. Balanced scorecard facts.
//
//    The anchor is lengthened to span the ring value: `__pv(` only exists in the patched
//    (live) `scorecard()`, and `<span>Target</span><strong>85%</strong>` on its own matches
//    three generations. Same reason for the card tag below — `${d.perspectives.filter(…)}/4
//    at target` matches three times; only the v240 one carries `class="v240-tag"`.
// ---------------------------------------------------------------------------------------
const SCORE_FACTS_FIND =
  "<strong>${__pv(d.score)}</strong><span>weighted score</span></div></div></div><div class=\"v240-score-facts\"><div class=\"v240-score-fact\"><span>Target</span><strong>85%</strong></div><div class=\"v240-score-fact\"><span>Perspectives at target</span><strong>${d.perspectives.filter(x=>x>=85).length}/4</strong></div>"

const SCORE_FACTS_REPL =
  "<strong>${__pv(d.score)}</strong><span>weighted score</span></div></div></div><div class=\"v240-score-facts\"><div class=\"v240-score-fact\"><span>Target</span><strong>${/* patched:dashboard-residue-score-facts */__perfDash()}</strong></div><div class=\"v240-score-fact\"><span>Perspectives at target</span><strong>${d.perspectives.filter(x=>x!=null&&!Number.isNaN(x)).length===0?__perfDash()+'/4':d.perspectives.filter(x=>x>=85).length+'/4'}</strong></div>"

const SCORE_TAG_FIND =
  "performance benchmark.</p></div><span class=\"v240-tag\">${d.perspectives.filter(x=>x>=85).length}/4 at target</span>"

const SCORE_TAG_REPL =
  "performance benchmark.</p></div><span class=\"v240-tag\">${/* patched:dashboard-residue-score-tag */d.perspectives.filter(x=>x!=null&&!Number.isNaN(x)).length===0?__perfDash()+'/4 at target':d.perspectives.filter(x=>x>=85).length+'/4 at target'}</span>"

// ---------------------------------------------------------------------------------------
// 4. Two charts drawn over empty series.
//
//    `trend()` with an empty `vals` still rendered the full frame — gridlines, y-axis 60-100,
//    twelve month labels and an Actual/Target/Forecast legend — which reads as a chart whose
//    data happens to be flat rather than as a chart with no data. `ratingChart()` did the
//    same with an empty bar grid under a "10 people" tag.
// ---------------------------------------------------------------------------------------
const TREND_FIND = "function trend(d){const vals=d.trend,target="

const TREND_REPL =
  "function trend(d){/* patched:dashboard-residue-trend */" +
  "if(!Array.isArray(d.trend)||d.trend.length<2)return __perfNoSeries('No month-by-month performance history is recorded yet, so no actual, target or forecast trajectory can be drawn.');" +
  "const vals=d.trend,target="

const RATING_FIND = "function ratingChart(d){const vals=d.ratings,total="

const RATING_REPL =
  "function ratingChart(d){/* patched:dashboard-residue-rating */" +
  "if(!Array.isArray(d.ratings)||d.ratings.length===0)return __perfNoSeries('No performance ratings have been submitted yet, so no rating distribution can be shown.');" +
  "const vals=d.ratings,total="

// ---------------------------------------------------------------------------------------
// 2b. The queue's evidence sentence — a second variant the built-in patch does not cover.
//
//     `dashboard-queue-evidence` in patch-performance-runtime.mjs anchors on
//     "`${evidence} measures are waiting for evidence verification`", which belongs to an
//     earlier generation. The v240 queue says "evidence items require verification" instead,
//     so that guard never applied here and the card rendered a literal "null evidence items
//     require verification" once `evidence` stopped being floored at 1 above.
// ---------------------------------------------------------------------------------------
const QUEUE_EVIDENCE_FIND = "`${evidence} evidence items require verification`"

const QUEUE_EVIDENCE_REPL =
  "`${/* patched:dashboard-residue-queue-evidence */" +
  "evidence==null?'Evidence coverage not yet tracked':evidence+' evidence items require verification'}`"

// ---------------------------------------------------------------------------------------
// 3b. The 85% benchmark, in the two places it survives as copy.
//
//     Nothing configures a performance target or benchmark: there is no settings endpoint and
//     `pillarConfig` carries perspective WEIGHTS, not thresholds. With the "Target" fact above
//     now reading as a dash, a caption and a card tag still quoting a specific 85% would
//     contradict it. The heatmap's 88+/82-87/76-81/<76 legend is left alone — that is a colour
//     scale legend, not a claim that a benchmark is configured.
// ---------------------------------------------------------------------------------------
const BENCH_SUB_FIND = "'Weighted score against an 85% benchmark'"
const BENCH_SUB_REPL = "/* patched:dashboard-residue-benchmark-sub */'Weighted score; benchmark not yet configured'"

const BENCH_TAG_FIND = "<span class=\"v240-tag\">85% benchmark</span>"
const BENCH_TAG_REPL = "<span class=\"v240-tag\">${/* patched:dashboard-residue-benchmark-tag */'Benchmark not set'}</span>"

export default [
  { label: "dashboard-residue-tasks-ok", find: TASKS_OK_FIND, repl: TASKS_OK_REPL },
  { label: "dashboard-residue-lanes", find: LANES_FIND, repl: LANES_REPL },
  { label: "dashboard-residue-dept-tasks", find: DEPT_TASKS_FIND, repl: DEPT_TASKS_REPL },
  { label: "dashboard-residue-work", find: WORK_FIND, repl: WORK_REPL },
  { label: "dashboard-residue-work-count", find: WORK_TAG_FIND, repl: WORK_TAG_REPL },
  { label: "dashboard-residue-reviewflow", find: REVIEWFLOW_FIND, repl: REVIEWFLOW_REPL },
  { label: "dashboard-residue-reviewflow-body", find: REVIEWFLOW_BODY_FIND, repl: REVIEWFLOW_BODY_REPL },
  { label: "dashboard-residue-queue", find: QUEUE_FIND, repl: QUEUE_REPL },
  { label: "dashboard-residue-queue-overdue", find: QUEUE_OVERDUE_FIND, repl: QUEUE_OVERDUE_REPL },
  { label: "dashboard-residue-queue-evidence", find: QUEUE_EVIDENCE_FIND, repl: QUEUE_EVIDENCE_REPL },
  { label: "dashboard-residue-benchmark-sub", find: BENCH_SUB_FIND, repl: BENCH_SUB_REPL },
  { label: "dashboard-residue-benchmark-tag", find: BENCH_TAG_FIND, repl: BENCH_TAG_REPL },
  { label: "dashboard-residue-score-facts", find: SCORE_FACTS_FIND, repl: SCORE_FACTS_REPL },
  { label: "dashboard-residue-score-tag", find: SCORE_TAG_FIND, repl: SCORE_TAG_REPL },
  { label: "dashboard-residue-trend", find: TREND_FIND, repl: TREND_REPL },
  { label: "dashboard-residue-rating", find: RATING_FIND, repl: RATING_REPL },
]
