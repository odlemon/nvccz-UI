/**
 * Employee Scorecards (`/performance/scorecards` → Employee Scorecards tab).
 *
 * LIVE RENDERER — traced through THREE stacked generations, not assumed. The render
 * dispatcher is reassigned three times for `state.scorecardTab==='employees'`:
 *   - `renderShell(employeeScorecardPage())` (v16) — dead: overridden below.
 *   - `render=function(){...renderEmployee();return}` first assignment (v17-ish, calls
 *     `employeePage()`) — dead: `renderEmployee` is redeclared again, and JS keeps only
 *     the LAST declaration of a function with a given name.
 *   - `render=function(){...renderEmployee();return}` FINAL assignment, whose `renderEmployee`
 *     calls `scorecardPage()` (v18) — this is the one that actually renders. Confirmed by
 *     reading the live DOM in a real browser: the rendered markup carries `sc82-wrap` +
 *     `data-v18-action` attributes and v18's exact copy ("Balanced scorecards generated
 *     from governed performance-review outcomes…"), not v16's `v16-employee-shell`.
 *
 * An earlier version of this file patched v16's `employeeScorecardPage()`, which looked
 * correct in the diff and changed nothing on screen — exactly the dead-layer trap this
 * module's README warns about. That patch has been removed; this file replaces it.
 *
 * WHAT WAS FABRICATED
 *   `employeeList()` returned `state.reviews` — a mock review-record array with fake ids
 *   like 'EMP-001', not real users. `rowsFor(r)` synthesised four perspective scores from
 *   `base=Number(r.kpi||80)` (itself invented) blended with a fake review rating and a fake
 *   competency average, nudged by hardcoded per-perspective offsets — no real number ever
 *   entered the calculation. The toolbar showed "Review KPI 80%" and "Evidence 96%" from
 *   the same source.
 *
 * WHAT IT SHOWS NOW
 *   Picker           <- real users (GET /api/users)
 *   Score, status, rows <- GET /performance/scorecards/employee/:id (or the already-loaded
 *                    `myScorecard` when viewing yourself — the on-demand drill built
 *                    alongside this patch, see lib/performance-v22-mock/bridge.ts)
 *   Matrix empty state distinguishes "no active contract" from "contract exists, no goals
 *   linked yet" from "still loading", using the backend's own explanation where available.
 *   Per-goal KPI/evidence/target/objective detail has no source and reads as an em dash;
 *   the local review-draft/update/publish/evidence apparatus (all `localStorage`-only, never
 *   wired to a real API by this or any earlier pass) is left as-is — out of scope for making
 *   the READ side real, and it already degrades to an honest empty state with no data.
 */

export default [
  {
    label: "employee-scorecard-list",
    find: "function employeeList(){let list=state.reviews||[];if(state.role==='Employee')list=list.filter(r=>r.name==='Tariro Moyo'||r.id==='EMP-SELF');return list.length?list:state.reviews||[]}",
    repl: "function employeeList(){\n    /* patched:employee-scorecard-list */\n    // Was `state.reviews` - a mock review-record array with fake ids like 'EMP-001'. Real\n    // users now, from GET /api/users, reshaped to the {id,name,role,dept,status,rating,kpi}\n    // fields the rest of this v18 module still reads - status/rating/kpi are null because\n    // nothing here is a real review record, and every downstream function that consumes them\n    // (reviewProductStatus, reviewDraft) already has a defined, honest fallback for that.\n    var users = __perfScope('users') || [];\n    var list = users.map(function(u){\n      return { id: u.id, name: u.name, role: u.departmentRole || u.role || null, dept: u.department || null, status: null, rating: null, kpi: null };\n    });\n    return list;\n  }",
  },
  {
    label: "employee-scorecard-rowsfor",
    find: "function rowsFor(r){\n    const d=reviewDraft(r),tpl=templateFor(r),k=keyFor(r.id,V.period),updates=V.updates[k]||{},rating=ratingNumber(d.overall||r.rating),comp=competencyAverage(d),base=Number(r.kpi||80),offsets=[1,0,-2,1];\n    return perspectiveMeta.map((m,i)=>{\n      const t=tpl[i]||templates.Default[i],u=updates[i]||{};\n      const reviewScore=Math.max(55,Math.min(112,Math.round(base*.58+(rating*20)*.22+(comp*20)*.20+offsets[i]+periodDelta(V.period))));\n      const score=Number(u.score??reviewScore), status=score>=100?'Ahead':score>=90?'On track':score>=80?'Watch':'At risk';\n      const reviewFinding=i===0?d.managerComment:i===1?d.strengths:i===2?`Evidence and delivery controls reviewed during the ${V.period} performance review.`:d.development;\n      return {...m,goal:[t[0],companyGoalFor(i)],objective:[t[1],String(reviewFinding||'').slice(0,150)],kpi:t[2],actual:u.actual??t[3],target:u.target??t[4],evidence:u.evidence??t[5],score,notes:u.note||'',employeeResponse:u.employeeResponse||'',status,points:(score*m.weight/100).toFixed(1)+' weighted points'};\n    });\n  }",
    repl: "function rowsFor(r){\n    /* patched:employee-scorecard-rowsfor */\n    // Was: a formula synthesising four fixed-perspective scores from a fake review rating,\n    // a fake competency average and a fake base KPI value, nudged by hardcoded offsets - no\n    // real number entered this calculation anywhere. `d`/`tpl`/`k`/`updates` (the local\n    // review-draft/update-override apparatus) are no longer used here.\n    //\n    // Now: one row per REAL linked goal, from GET /performance/scorecards/employee/:id (or\n    // the already-loaded `myScorecard` when viewing yourself). Perspective-level KPI/evidence\n    // detail has no source and reads as an em dash rather than the old template text.\n    if (!r) return [];\n    var self = window.__PERF_ACCESS__ && window.__PERF_ACCESS__.userId;\n    var sc = (self && r.id === self) ? __perfObject('myScorecard') : (typeof __perfEmployeeScorecard === 'function' ? __perfEmployeeScorecard(r.id) : null);\n    var palette = [\n      {icon:'chart',tone:'#1267f5',soft:'#f1f6ff',soft2:'#eaf2ff'},\n      {icon:'users',tone:'#0f9c74',soft:'#f0fbf7',soft2:'#e7f8f1'},\n      {icon:'shield',tone:'#dc8a0b',soft:'#fff9ef',soft2:'#fff3df'},\n      {icon:'strategy',tone:'#7355e6',soft:'#f7f3ff',soft2:'#efe9ff'}\n    ];\n    var goals = (sc && sc.available && sc.rows || []);\n    return goals.map(function(g, i){\n      var pal = palette[i % palette.length];\n      var weight = g.weight != null ? g.weight : 0;\n      var score = g.score != null ? g.score : 0;\n      return {\n        id: 'goal-' + g.id, name: g.name, icon: pal.icon, tone: pal.tone, soft: pal.soft, soft2: pal.soft2,\n        weight: weight,\n        goal: [g.name, __perfDash()],\n        objective: [__perfDash(), g.status ? g.status : __perfDash()],\n        kpi: __perfDash(), actual: __perfDash(), target: __perfDash(), evidence: __perfDash(),\n        score: score, notes: '', employeeResponse: '',\n        status: g.status || __perfDash(),\n        points: (g.score != null && g.weight != null) ? (g.score * g.weight / 100).toFixed(1) + ' weighted points' : __perfDash(),\n      };\n    });\n  }",
  },
  {
    label: "employee-scorecard-matrix-empty",
    find: "<section class=\"sc82-matrix-card\"><div class=\"sc82-matrix-intro\"><div><span class=\"sc82-kicker\">Employee Balanced Scorecard Matrix</span><h2>${h(r.name)} \u00b7 ${h(V.period)} performance outcome</h2><p>Same scorecard structure used across the enterprise, populated with employee-specific goals, review findings, KPI evidence, agreed targets and review-derived results.</p></div><span class=\"sc82-live\">${h(V.period)} \u00b7 ${h(r.status)}</span></div><div class=\"sc82-matrix-scroll\"><div class=\"sc82-matrix\"><div class=\"sc82-matrix-head\"><div>Perspective & performance objective</div><div>Goal</div><div>Review objective & finding</div><div>KPI & evidence</div><div>Agreed target</div><div>Review result</div></div>${rows.map(matrixRow).join('')}</div></div></section>",
    repl: "<section class=\"sc82-matrix-card\"><div class=\"sc82-matrix-intro\"><div><span class=\"sc82-kicker\">Employee Balanced Scorecard Matrix</span><h2>${h(r.name)} \u00b7 ${h(V.period)} performance outcome</h2><p>Same scorecard structure used across the enterprise, populated with employee-specific goals, review findings, KPI evidence, agreed targets and review-derived results.</p></div><span class=\"sc82-live\">${h(V.period)} \u00b7 ${h(r.status)}</span></div><div class=\"sc82-matrix-scroll\"><div class=\"sc82-matrix\"><div class=\"sc82-matrix-head\"><div>Perspective & performance objective</div><div>Goal</div><div>Review objective & finding</div><div>KPI & evidence</div><div>Agreed target</div><div>Review result</div></div>${/* patched:employee-scorecard-matrix-empty */rows.length?rows.map(matrixRow).join(''):`<div style=\"padding:28px 12px;text-align:center;color:var(--muted,#6b7280)\">${(function(){var self=window.__PERF_ACCESS__&&window.__PERF_ACCESS__.userId;var sc=(self&&r.id===self)?__perfObject('myScorecard'):(typeof __perfEmployeeScorecard==='function'?__perfEmployeeScorecard(r.id):null);return sc&&sc.available===false?(sc.blockedReason||'No active performance contract for this employee.'):(sc===null?'Loading this employee\\u2019s scorecard\\u2026':'No goals are linked to this employee\\u2019s performance contract yet.')})()}</div>`}</div></div></section>",
  },
  {
    label: "employee-scorecard-toolbar",
    find: "<div class=\"sc82-toolbar\"><select class=\"sc82-context\" id=\"v18Employee\">${employeeList().map(x=>`<option value=\"${h(x.id)}\" ${x.id===r.id?'selected':''}>${h(x.name)} \u00b7 ${h(x.role)}</option>`).join('')}</select><select class=\"sc82-context\" id=\"v18Period\">${periods.map(p=>`<option ${p===V.period?'selected':''}>${p}</option>`).join('')}</select><span class=\"spacer\"></span><span class=\"sc82-chip\">Review KPI ${h(r.kpi)}%</span><span class=\"sc82-chip\">Evidence ${evidenceCoverage(rows)}%</span><span class=\"sc82-chip\">Weighted score ${score}%</span></div>",
    repl: "<div class=\"sc82-toolbar\"><select class=\"sc82-context\" id=\"v18Employee\">${employeeList().map(x=>`<option value=\"${h(x.id)}\" ${x.id===r.id?'selected':''}>${h(x.name)}${x.dept?' \\u00b7 '+h(x.dept):''}</option>`).join('')}</select><select class=\"sc82-context\" id=\"v18Period\">${periods.map(p=>`<option ${p===V.period?'selected':''}>${p}</option>`).join('')}</select><span class=\"spacer\"></span><span class=\"sc82-chip\">${/* patched:employee-scorecard-toolbar */rows.length+' goal'+(rows.length===1?'':'s')+' linked'}</span><span class=\"sc82-chip\">Evidence not tracked</span><span class=\"sc82-chip\">Weighted score ${rows.length?score+'%':__perfDash()}</span></div>",
  },
]
