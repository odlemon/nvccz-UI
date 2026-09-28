/**
 * Post-extract Performance V22 runtime patches — live-data bridge (Step 1).
 *
 * Run alone on the current runtime:
 *   node scripts/patch-performance-runtime.mjs
 *   node scripts/patch-performance-runtime.mjs --check   (verify only, no write)
 *
 * Idempotent: every patch is guarded by a `/* patched:<label> *\/` marker, so re-running
 * is a no-op and prints `skip (already)`.
 *
 * WHY THIS EXISTS
 * ---------------
 * `matanho-performance-runtime.js` shipped with **zero** `fetch(` calls, zero `/api/`
 * references and — unlike every other client-design port — it never dispatched
 * `matanho:before-action`. There was therefore no seam at all for the React host to
 * intercept, so no action could be routed to the real backend. See
 * `design-refs/performance-module-map.md` §4 and `…-functional-requirements.md` §5.1.
 *
 * WHAT IT PATCHES
 * ---------------
 *  1. `handle(action, el)` — the single central action dispatcher. Every `data-action`
 *     click funnels through `(map[action]||(()=>{}))()` at the end of that function, so one
 *     hook there covers all ~40 actions rather than patching each write site. The hook
 *     emits a cancelable `matanho:before-action`; if the host calls `preventDefault()` the
 *     mock handler is skipped entirely and the host owns the outcome. Mirrors
 *     portfolio-v11's `emitIntegrationEvent(..., cancelable=true)` contract.
 *
 *  2. A `window.__PERF_LIVE__` container plus `emitPerfEvent` helper. The runtime is one
 *     core function followed by ~30 sibling IIFE patch layers that cannot see each other's
 *     scope (`performance-module-map.md` §5, §13.6), so anything shared has to live on a
 *     `window` global. This is the established pattern in this file — it already publishes
 *     `window.handle`, `window.openDrawer`, `window.openDocument`.
 *
 *  3. `matanho:after-render` after each `render()`, so the host can re-project live data
 *     onto whichever patch layer actually owns the current page.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * No markup, styling, copy or layout is touched. This is a behavioural seam only — the UI
 * renders byte-identically until the host chooses to intercept an action.
 *
 * NEVER regenerate this runtime from scripts/extract-performance-v22*.mjs and expect these
 * to survive — a prior regeneration on the portfolio runtime silently discarded 20
 * hand-wired actions. Re-run this script after any extract.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath, pathToFileURL } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const RUNTIME = path.join(ROOT, "components/performance-v22-mock/matanho-performance-runtime.js")

const CHECK_ONLY = process.argv.includes("--check")

let applied = 0
let skipped = 0
let missed = 0

/**
 * The vendored runtime is CRLF. Anchors and replacements below are written with plain \n
 * for readability, so both are normalised to the file's actual line ending before matching.
 * Without this, every multi-line anchor silently misses and the script reports MISS on a
 * runtime that is perfectly fine.
 */
let EOL = "\n"
const toEol = (s) => (EOL === "\n" ? s : s.replace(/\n/g, EOL))

/**
 * Apply one patch.
 *
 * `occurrences` guards the single most dangerous failure mode in this file. The runtime
 * stacks many generations of the same page, so an anchor lifted from one of them very often
 * appears verbatim in two or three others. `String.replace` takes the FIRST match, which is
 * usually the OLDEST — i.e. the dead layer. The patch reports "apply", the diff looks right,
 * and the page does not change. That has now happened three times.
 *
 * So: an anchor that is not unique is an ERROR, not a warning. Either lengthen `find` until
 * it only matches the live generation, or state the count deliberately:
 *
 *   occurrences: 1      (default) exactly one match, else fail
 *   occurrences: 3      exactly three, all replaced
 *   occurrences: "all"  every match, however many — use only when every generation should
 *                       change, e.g. a shared helper function
 */
function patch(src, { label, find, repl, occurrences = 1 }) {
  if (src.includes(`/* patched:${label} */`)) {
    console.log(`  skip (already)  ${label}`)
    skipped++
    return src
  }
  const f = toEol(find)
  const r = toEol(repl)
  const n = src.split(f).length - 1
  if (n === 0) {
    console.error(`  MISS            ${label}  — anchor not found:\n      ${find.slice(0, 100)}`)
    missed++
    return src
  }
  if (occurrences !== "all" && n !== occurrences) {
    console.error(
      `  AMBIGUOUS       ${label}  — anchor matches ${n}x, expected ${occurrences}.\n` +
        `      Only the first would be replaced, which is usually a DEAD layer. Lengthen the\n` +
        `      anchor until it is unique, or set occurrences: ${n} / "all" if that is intended.\n` +
        `      ${find.slice(0, 100)}`,
    )
    missed++
    return src
  }
  console.log(`  apply           ${label}${n > 1 ? `  (${n} occurrences)` : ""}`)
  applied++
  return src.split(f).join(r)
}

// ---------------------------------------------------------------------------
// 1. Shared bridge globals, injected immediately after the runtime's own state
//    object so every later IIFE layer can see them.
// ---------------------------------------------------------------------------
const BRIDGE_ANCHOR = `const canPage=p=>!pagePerm[p]||allowed(pagePerm[p])||state.role==='SysAdmin';`

const BRIDGE = `${BRIDGE_ANCHOR}
/* patched:bridge-globals */
// Live-data bridge. The render layers below are scope-isolated IIFEs, so the only way to
// share anything with them (and with the React host) is a window global.
window.__PERF_LIVE__ = window.__PERF_LIVE__ || {
  ready: false,      // host has delivered at least one payload
  data: {},          // scope -> payload, written by the host's live-loaders
  errors: {},        // scope -> error message, for honest empty/error states
};
function emitPerfEvent(name, detail = {}, cancelable = false) {
  try {
    return window.dispatchEvent(new CustomEvent(name, { detail, cancelable }));
  } catch (_) {
    return true; // never let the bridge break the mock UI
  }
}
window.__PERF_EMIT__ = emitPerfEvent;`

// ---------------------------------------------------------------------------
// 1b. Bridge readers. Separate label from `bridge-globals` on purpose: that patch may
//     already be marked applied from an earlier run, and a guarded patch is skipped
//     wholesale — so anything added to it later would silently never land.
// ---------------------------------------------------------------------------
const READERS_ANCHOR = `window.__PERF_EMIT__ = emitPerfEvent;`

const READERS = `window.__PERF_EMIT__ = emitPerfEvent;
/* patched:bridge-readers */
// Defensive by design: layers can render before the host's fetch resolves, and the honest
// answer while loading or on error is a dash — never a plausible-looking number.
function __perfScope(scope) {
  const g = window.__PERF_LIVE__;
  if (!g || !g.ready) return null;
  const s = g.data && g.data[scope];
  if (!s || s.error) return null;
  return Array.isArray(s.data) ? s.data : null;
}
/** Placeholder for anything the backend genuinely cannot supply yet. */
function __perfDash() { return '\\u2014'; }
function __perfDepartments() { return __perfScope('departments') || []; }
function __perfTasks() { return __perfScope('tasks') || []; }
window.__PERF_SCOPE__ = __perfScope;`

// ---------------------------------------------------------------------------
// 1c. Re-render when live data lands.
//     Without this the module renders once, immediately, and the host's fetch resolves a
//     few hundred ms later into a bridge nobody re-reads — so a page whose data loaded
//     perfectly still shows "Unavailable". Verified: bridge held 9 departments while the
//     page showed 0. The listener is attached once and calls the runtime's own render().
// ---------------------------------------------------------------------------
const RERENDER_ANCHOR = `window.__PERF_SCOPE__ = __perfScope;`

const RERENDER = `window.__PERF_SCOPE__ = __perfScope;
/* patched:live-data-rerender */
// render() is a hoisted function declaration in this same scope, so it is safe to
// reference here even though it is defined further down the file.
if (!window.__PERF_RERENDER_BOUND__) {
  window.__PERF_RERENDER_BOUND__ = true;
  window.addEventListener('matanho:live-data', () => {
    try {
      // Project live tasks into the runtime's own state.tasks, which 8+ call sites read
      // (kanban lanes, counts, detail drawer, employee filter). Replacing the collection at
      // source is why one patch reaches all of them instead of patching each renderer.
      //
      // Lane vocabulary is the board's: To Do / In Progress / In Review / Complete. Real
      // stages today are only 'todo' and 'completed', so the middle lanes render empty —
      // which is the truth, not a gap to fill.
      const live = __perfScope('tasks');
      if (live && typeof state === 'object' && state) {
        const lane = (st) => {
          const v = String(st || '').toLowerCase();
          if (v.includes('complet') || v === 'done') return 'Complete';
          if (v.includes('review')) return 'In Review';
          if (v.includes('progress') || v.includes('doing')) return 'In Progress';
          return 'To Do';
        };
        const cap = (v) => { const t = String(v || '').trim(); return t ? t[0].toUpperCase() + t.slice(1) : __perfDash(); };
        const due = (d) => {
          if (!d) return __perfDash();
          const dt = new Date(d);
          return isNaN(dt) ? __perfDash()
            : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        };
        state.tasks = live.map((t) => ({
          id: t.id,
          title: t.title || __perfDash(),
          lane: lane(t.stage),
          // No project or goal-title source exists yet (goalId is null on every real row),
          // and progress is not a field the API returns. Dash rather than a fabricated %.
          project: t.department || __perfDash(),
          goal: __perfDash(),
          owner: t.owner || __perfDash(),
          due: due(t.dueDate),
          priority: cap(t.priority),
          progress: null,
          overdue: t.isOverdue === true,
          __live: true,
        }));
        window.__PERF_TASKS_LIVE__ = true;
      }
    } catch (_) {}
    try { if (typeof render === 'function') render(); } catch (_) {}
  });
}`

// ---------------------------------------------------------------------------
// 2. The central action hook. `handle()` ends with `(map[action]||(()=>{}))();`
//    — one seam for every data-action in the module.
// ---------------------------------------------------------------------------
const HANDLE_ANCHOR = ` (map[action]||(()=>{}))();
}`

const HANDLE = ` /* patched:handle-before-action */
 // Give the React host first refusal on every action. dispatchEvent returns false when a
 // listener called preventDefault(), which means the host has taken ownership (routing it
 // to the real API) and the mock handler below must NOT also run — otherwise the UI would
 // optimistically mutate local state that the backend never received.
 const __proceed = emitPerfEvent('matanho:before-action', {
   action,
   id: el?.dataset?.id,
   dataset: el?.dataset ? { ...el.dataset } : {},
   page: state.page,
   role: state.role,
 }, true);
 if (!__proceed) return;
 (map[action]||(()=>{}))();
}`

// ---------------------------------------------------------------------------
// 3. after-render, so the host can re-project live data onto the owning layer.
// ---------------------------------------------------------------------------
const RENDER_ANCHOR = `function render(){`

const RENDER = `function render(){
 /* patched:after-render */
 // Fires at the END of render via queueMicrotask so listeners observe the finished DOM.
 try { queueMicrotask(() => emitPerfEvent('matanho:after-render', { page: state.page, role: state.role })); } catch (_) {}`

// ---------------------------------------------------------------------------
// 4. Departments page (`departmentsV8`, owned by the v8 layer) — real rows.
//
//    Before: a 6-row hardcoded array of invented departments and leaders, under KPI cards
//    reading "Departments 12" and "Employees 200". The array and the card disagreed with
//    each other, and both disagreed with the database (9 departments, 0 employee records).
//
//    After: rows come from `GET /api/departments`; member counts are joined from
//    `GET /api/users` by `userDepartment` and surface ONLY in the Employees KPI card,
//    which is the one slot actually labelled for a headcount. Everything the backend
//    cannot supply — leader, score, capacity, active-KPI count, project count — renders
//    as an em dash in the SAME slot. No markup, class names or layout change.
//
//    NOTE: an earlier revision put userCount into the card's 5th column, which the
//    markup labels "Active KPIs" — so Finance displayed "Active KPIs 1" when that 1 was
//    a person, not a KPI. Real data in a slot labelled for something else is still a
//    fabrication; the column is a dash until the KPI read path exists.
// ---------------------------------------------------------------------------
const DEPT_FIXTURE_ANCHOR =
  "const depts=[['Finance','Farai Muchengezi',83,78,12,'On Track'],['Investments','Rumbidzai Chaza',79,84,18,'On Track'],['Operations','Tawanda Chikore',74,91,16,'At Risk'],['People & Culture','Chipo Ncube',85,76,11,'On Track'],['Client Experience','Nyasha Dube',80,72,14,'On Track'],['ICT','Tendai Nyathi',72,96,19,'At Risk']];"

const DEPT_FIXTURE = `/* patched:departments-live */const __dRaw=__perfScope('departments');const __dOk=__dRaw!==null;const __d=__dRaw||[];const depts=__d.map(x=>[x.name,__perfDash(),__perfDash(),__perfDash(),__perfDash(),x.isActive?'Active':'Inactive']);const __deptTotal=__d.length;const __deptActive=__d.filter(x=>x.isActive).length;const __deptMembers=__d.reduce((a,x)=>a+(typeof x.userCount==='number'?x.userCount:0),0);const __deptWithMembers=__d.filter(x=>(x.userCount||0)>0).length;`

/**
 * value, sub — each replaced with a real figure or an honest dash.
 *
 * Each replacement carries its own `/* patched:<label> *\/` marker INSIDE the template
 * expression (legal there, and invisible in output). Without it the guard cannot tell an
 * applied patch from a moved anchor, and a second run reports MISS on a correctly patched
 * file — which is exactly what happened on the first attempt.
 */
const DEPT_KPIS = [
  [
    "${kpiV8('Departments','12','All active','users','brand','departments')}",
    "${/* patched:departments-kpi-1 */kpiV8('Departments',__dOk?String(__deptTotal):__perfDash(),!__dOk?'Unavailable':(__deptTotal===0?'None yet':(__deptActive===__deptTotal?'All active':__deptActive+' active')),'users','brand','departments')}",
  ],
  [
    "${kpiV8('Employees','200','Across 12 units','users','blue','departments')}",
    "${/* patched:departments-kpi-2 */kpiV8('Employees',__dOk?String(__deptMembers):__perfDash(),!__dOk?'Unavailable':(__deptMembers===0?'None assigned to a unit':'Assigned across '+__deptWithMembers+' of '+__deptTotal+' units'),'users','blue','departments')}",
  ],
  [
    "${kpiV8('Avg performance','79.1%','+3.4pp','chart','green','departments')}",
    "${/* patched:departments-kpi-3 */kpiV8('Avg performance',__perfDash(),'Not yet tracked','chart','green','departments')}",
  ],
  [
    "${kpiV8('Capacity used','78%','5 employees overloaded','clock','amber','departments')}",
    "${/* patched:departments-kpi-4 */kpiV8('Capacity used',__perfDash(),'Not yet tracked','clock','amber','departments')}",
  ],
  [
    "${kpiV8('Scorecards submitted','12 / 12','100% coverage','check','green','scorecards')}",
    "${/* patched:departments-kpi-5 */kpiV8('Scorecards submitted',__perfDash(),'Not yet tracked','check','green','scorecards')}",
  ],
  [
    "${kpiV8('Exceptions','6','Across 3 units','alerts','red','departments')}",
    "${/* patched:departments-kpi-6 */kpiV8('Exceptions',__perfDash(),'Not yet tracked','alerts','red','departments')}",
  ],
]

// The record card footer invents "8+i active projects" from the row index.
const DEPT_PROJECTS_ANCHOR = "<footer><span>${8+i} active projects</span>"
const DEPT_PROJECTS = "<footer><span>${/* patched:departments-projects */__perfDash()} active projects</span>"


// ---------------------------------------------------------------------------
// 5. Tasks & Projects summary strip (owned by the v15/v16 layer).
//    "Active tasks 26 / Due this week 8 / Overdue 3 / Completion rate 68%" were literals
//    sitting above a kanban built from the same collection — none matched it, and none
//    matched the database (29 tasks: 25 completed, 4 todo, 0 overdue).
// ---------------------------------------------------------------------------
const TASK_SUMMARY_ANCHOR = `<div class="summary-strip"><div class="summary-cell"><span>Active tasks</span><strong>26</strong></div><div class="summary-cell"><span>Due this week</span><strong>8</strong></div><div class="summary-cell"><span>Overdue</span><strong style="color:var(--red)">3</strong></div><div class="summary-cell"><span>Completion rate</span><strong>68%</strong></div></div>`

// "Due this week" stays a dash on purpose. The API returns `date` as a UTC ISO string and
// every real user here is UTC+2, so bucketing it into a local week is exactly the
// date-shift trap that puts entries in the wrong day. It gets wired when there is a
// tested date helper, not before. "Overdue" IS real — `isOverdue` is a field the API
// computes server-side, so no client date maths is involved.
const TASK_SUMMARY = `<div class="summary-strip"><div class="summary-cell"><span>Active tasks</span><strong>\${/* patched:tasks-summary */window.__PERF_TASKS_LIVE__ ? taskSet.filter(t => t.lane !== 'Complete').length : __perfDash()}</strong></div><div class="summary-cell"><span>Due this week</span><strong>\${__perfDash()}</strong></div><div class="summary-cell"><span>Overdue</span><strong style="color:var(--red)">\${window.__PERF_TASKS_LIVE__ ? taskSet.filter(t => t.overdue).length : __perfDash()}</strong></div><div class="summary-cell"><span>Completion rate</span><strong>\${window.__PERF_TASKS_LIVE__ && taskSet.length ? Math.round((taskSet.filter(t => t.lane === 'Complete').length / taskSet.length) * 100) + '%' : __perfDash()}</strong></div></div>`


// ---------------------------------------------------------------------------
// 6. Task card progress (v5 layer reassigns `taskCard` at runtime L2487 — the earlier
//    `function taskCard` declaration is dead, so this is the live renderer).
//
//    The card prints `${t.progress}%`. The API has no progress field, so a live task
//    carries null and the card rendered a literal **"null%"**. The bar beside it is worse
//    than useless for null: `null<45` and `null<70` are both false, so it picked
//    'emerald' — a green zero-length bar, i.e. "all good" for a value we do not have.
//
//    Both now render as unknown. Unique anchor (1 occurrence) verified before patching.
// ---------------------------------------------------------------------------
const TASK_PCT_ANCHOR = '<span style="margin-left:auto">${t.progress}%</span>'
const TASK_PCT =
  '<span style="margin-left:auto">${/* patched:task-progress-pct */t.progress==null?__perfDash():t.progress+"%"}</span>'


// ---------------------------------------------------------------------------
// 7. Strategic Themes (v8 layer) and KPI Analytics (v8/v20 layers).
//
//    Both are headline-number pages over domains that are entirely empty: 0 themes,
//    0 KPIs, 0 goals. Every figure on them was a literal. Wired to the real endpoints so
//    they show an honest empty state now and fill in as users create records.
//
//    `/api/kpis` is the read path, NOT `/api/performance/kpis` — that one serves 34 rows
//    out of a config file while writes go to the `kpis` table (map section 13.1).
// ---------------------------------------------------------------------------
const THEMES_FIXTURE_ANCHOR = "const themes=[['Sustainable Growth','Grow recurring revenue, defend margins and allocate capital with discipline.','Financial',82,'Rumbidzai Chaza'],['Client & Investor Trust','Strengthen stakeholder experience, retention and transparency.','Customer',78,'Nyasha Dube'],['Operational Excellence','Automate workflows, improve control quality and shorten cycle times.','Internal Process',74,'Tawanda Chikore'],['Future-ready People','Build leadership capability, engagement and critical digital skills.','Learning & Growth',88,'Chipo Ncube']];"

const THEMES_FIXTURE =
  "/* patched:themes-live */const __t=__perfScope('themes');const __tOk=__t!==null;const themes=(__t||[]).map(x=>[x.name,x.description||__perfDash(),__perfDash(),0,__perfDash()]);"

const THEME_KPIS = [
  [
    "${kpiV8('Active themes','4','All approved for FY2026','strategy','brand','strategy')}",
    "${/* patched:themes-kpi-1 */kpiV8('Active themes',__tOk?String(themes.length):__perfDash(),!__tOk?'Unavailable':(themes.length?'From strategy configuration':'None created yet'),'strategy','brand','strategy')}",
  ],
  [
    "${kpiV8('Linked objectives','16','4 per theme average','target','blue','objectives')}",
    "${/* patched:themes-kpi-2 */kpiV8('Linked objectives',(()=>{const g=__perfScope('goals');return g===null?__perfDash():String(g.length)})(),(()=>{const g=__perfScope('goals');return g===null?'Unavailable':(g.length?'Linked to themes':'None created yet')})(),'target','blue','objectives')}",
  ],
  [
    "${kpiV8('Alignment','86.4%','+4.7pp vs FY2025','chart','green','scorecards')}",
    "${/* patched:themes-kpi-3 */kpiV8('Alignment',__perfDash(),'Not yet tracked','chart','green','scorecards')}",
  ],
  [
    "${kpiV8('At-risk themes','1','Operational Excellence','alerts','amber','themes')}",
    "${/* patched:themes-kpi-4 */kpiV8('At-risk themes',__perfDash(),'Not yet tracked','alerts','amber','themes')}",
  ],
  [
    "${kpiV8('Evidence coverage','94%','Across theme KPIs','file','green','vault')}",
    "${/* patched:themes-kpi-5 */kpiV8('Evidence coverage',__perfDash(),'Not yet tracked','file','green','vault')}",
  ],
  [
    "${kpiV8('Executive reviews','4 / 4','Quarterly owners assigned','users','green','themes')}",
    "${/* patched:themes-kpi-6 */kpiV8('Executive reviews',__perfDash(),'Not yet tracked','users','green','themes')}",
  ],
]

const ANALYTICS_KPIS = [
  [
    "${kpiV8('Overall completion','76.4%','+8.7pp','chart','brand','kpiAnalytics',[61,64,67,69,72,74,76])}",
    "${/* patched:analytics-kpi-1 */kpiV8('Overall completion',__perfDash(),'Not yet tracked','chart','brand','kpiAnalytics')}",
  ],
  [
    "${kpiV8('Total KPIs','48','No net change','grid','blue','kpiManagement')}",
    "${/* patched:analytics-kpi-2 */kpiV8('Total KPIs',(()=>{const k=__perfScope('kpis');return k===null?__perfDash():String(k.length)})(),(()=>{const k=__perfScope('kpis');return k===null?'Unavailable':(k.length?'In the KPI catalogue':'None created yet')})(),'grid','blue','kpiManagement')}",
  ],
  [
    "${kpiV8('On track','32','+4 vs June','check','green','kpiAnalytics')}",
    "${/* patched:analytics-kpi-3 */kpiV8('On track',__perfDash(),'Not yet tracked','check','green','kpiAnalytics')}",
  ],
  [
    "${kpiV8('At risk','10','+2 vs June','alerts','amber','kpiAnalytics')}",
    "${/* patched:analytics-kpi-4 */kpiV8('At risk',__perfDash(),'Not yet tracked','alerts','amber','kpiAnalytics')}",
  ],
  [
    "${kpiV8('Off track','6','+1 vs June','x','red','kpiAnalytics')}",
    "${/* patched:analytics-kpi-5 */kpiV8('Off track',__perfDash(),'Not yet tracked','x','red','kpiAnalytics')}",
  ],
  [
    "${kpiV8('Evidence current','94%','3 require approval','file','green','vault')}",
    "${/* patched:analytics-kpi-6 */kpiV8('Evidence current',__perfDash(),'Not yet tracked','file','green','vault')}",
  ],
]


// ---------------------------------------------------------------------------
// 8. Real role, replacing the demo toggle.
//
//    The runtime drove every permission check off `state.role`, a string chosen from a
//    `#roleSelect` dropdown literally labelled `aria-label="Demo role"`, whose five roles
//    matched no real user. The host now resolves the SIGNED-IN user's real access
//    (lib/performance-v22-mock/access.ts) and publishes it; this listener applies it to the
//    runtime's own `rolePerms` / `state.role`, so `allowed()` and `canPage()` keep working
//    unchanged while their input becomes real.
//
//    The dropdown itself is removed from the DOM rather than hidden — leaving a disabled
//    control that silently does nothing is worse than not having it.
// ---------------------------------------------------------------------------
const REAL_ROLE_ANCHOR = `window.__PERF_SCOPE__ = __perfScope;`

const REAL_ROLE = `window.__PERF_SCOPE__ = __perfScope;
/* patched:real-role */
function __perfApplyAccess(access) {
  if (!access || !access.label) return;
  try {
    var label = String(access.label);
    // Register the real role in the runtime's own structures.
    if (typeof rolePerms === 'object' && rolePerms) {
      rolePerms[label] = new Set(Array.isArray(access.permissions) ? access.permissions : []);
    }
    if (typeof roles !== 'undefined' && Array.isArray(roles) && roles.indexOf(label) === -1) {
      roles.push(label);
    }
    state.role = label;
    window.__PERF_ACCESS__ = access;

    // Show the real role where the demo label used to be.
    var copy = document.querySelector('#userRoleCopy');
    if (copy) copy.textContent = label;

    // Remove the demo dropdown entirely, plus any wrapper left holding an empty control.
    var sel = document.querySelector('#roleSelect');
    if (sel) {
      var host = sel.closest('.profile-role, .profile-role-row, label');
      (host && host.querySelectorAll('select,input').length === 1 ? host : sel).remove();
    }
  } catch (_) {}
}
window.addEventListener('matanho:access', function (e) {
  __perfApplyAccess(e && e.detail);
  try { if (typeof render === 'function') render(); } catch (_) {}
});
// The host may have published access before this listener existed.
try {
  var __a = window.__PERF_LIVE__ && window.__PERF_LIVE__.access;
  if (__a) __perfApplyAccess(__a);
} catch (_) {}`


// ---------------------------------------------------------------------------
// 9. Command Centre (v240/v242) — the module's front page.
//
//    Everything on it came from `DEPTS`, a hardcoded table of six invented business units
//    carrying invented scores, headcounts, BSC perspectives, rating distributions and
//    12-month trend series. `scaled()` then arithmetically shifted those numbers by the
//    selected period/population, which is why the filters "worked" without any data.
//
//    DEPTS is now a Proxy that rebuilds from the live bridge on every read — necessary
//    because the runtime captures it by closure at definition time, long before the host's
//    fetch resolves. Real department names and headcounts come from the API; task lane
//    counts from the real task collection; everything else is null until a source exists.
//
//    `scaled()` is guarded so null never enters arithmetic: `clamp(null + shift)` would
//    silently render the shift value itself as a score. `bullet()` renders an em dash and a
//    zero-width bar for null rather than "null%" or a misleading fill.
// ---------------------------------------------------------------------------
const DASH_DEPTS_ANCHOR = "const DEPTS={\n 'All departments':{score:84,kpi:79,reviews:82,align:86,evidence:92,headcount:200,risks:8,corrective:14,perspectives:[86,82,78,89],trend:[72,73,75,76,77,79,80,81,82,83,84,84],ratings:[7,20,61,78,34],tasks:[29,46,31,94]},\n 'Finance':{score:87,kpi:84,reviews:88,align:89,evidence:95,headcount:47,risks:3,corrective:4,perspectives:[92,84,83,88],trend:[76,77,78,79,81,82,83,84,85,86,87,87],ratings:[1,3,12,20,11],tasks:[6,10,7,24]},\n 'Investments':{score:81,kpi:77,reviews:78,align:85,evidence:90,headcount:42,risks:4,corrective:5,perspectives:[87,79,73,83],trend:[71,72,73,74,76,77,78,79,80,80,81,81],ratings:[2,5,13,15,7],tasks:[7,11,8,16]},\n 'Operations':{score:78,kpi:73,reviews:84,align:82,evidence:87,headcount:47,risks:6,corrective:6,perspectives:[78,76,72,86],trend:[67,69,70,71,73,74,75,76,77,78,78,78],ratings:[2,6,16,16,7],tasks:[10,12,9,16]},\n 'People & Culture':{score:89,kpi:87,reviews:94,align:92,evidence:97,headcount:28,risks:2,corrective:4,perspectives:[84,88,91,94],trend:[78,79,81,82,83,85,86,87,88,88,89,89],ratings:[0,2,6,12,8],tasks:[3,7,4,14]},\n 'ICT':{score:84,kpi:81,reviews:83,align:88,evidence:93,headcount:36,risks:3,corrective:5,perspectives:[80,84,88,86],trend:[72,73,75,76,78,79,80,81,82,83,84,84],ratings:[1,4,11,13,7],tasks:[5,8,5,18]}\n};"
const DASH_DEPTS = "/* patched:dashboard-depts */\n// Was a table of six invented business units with invented scores, headcounts, rating\n// distributions and 12-month trends. Now derived from the real department list and the\n// real task collection. Every metric the backend cannot supply is **null**, which the\n// patched `bullet()` renders as an em dash instead of a number.\n//\n// The shape is preserved exactly so `scaled()` and every downstream panel keep working.\n// Real org-wide BSC score, once scorecard_pillars is seeded and at least one goal is\n// scored (see design-refs/performance-module-map.md \u00a716). Mapped onto the same four\n// scorecard() perspective slots (Financial / Stakeholder / Internal process / Learning &\n// growth) in pillar order: Financial, Customer & Market, Internal Operations, Learning\n// Growth & HR - an approximate but reasonable alignment, not an exact relabel.\n// Prefers GET /performance/analytics/dashboard -> totalUsers: it is the one endpoint that\n// counts across the whole module rather than summing a per-row field. Falls back to the\n// departments roll-up when that scope has not loaded.\nfunction __perfOrgUsersOrRollup(all){\n  const ad = __perfObject('analyticsDashboard');\n  if (ad && typeof ad.totalUsers === 'number') return ad.totalUsers;\n  return all ? all.reduce((a,d)=>a+(typeof d.userCount==='number'?d.userCount:0),0) : null;\n}\nfunction __perfOrgBscRow(){\n  const org = __perfObject('orgBsc');\n  if (!org) return {};\n  const byCode = {};\n  (org.pillars || []).forEach(p => { byCode[p.code] = p; });\n  const persp = ['FINANCIAL','CUSTOMER','INTERNAL_OPS','LEARNING_GROWTH']\n    .map(code => byCode[code] ? byCode[code].score : null);\n  return { score: org.overallScore, perspectives: persp };\n}\nfunction __perfDeptTable(){\n  const list = __perfScope('departments');\n  const tasks = __perfScope('tasks') || [];\n  const laneCounts = (rows) => {\n    const c = { 'To Do':0, 'In Progress':0, 'In Review':0, 'Complete':0 };\n    rows.forEach(t => { if (c[t.lane] !== undefined) c[t.lane]++; });\n    return [c['To Do'], c['In Progress'], c['In Review'], c['Complete']];\n  };\n  // No score/kpi/review/alignment/evidence data exists anywhere yet.\n  const blank = { score:null, kpi:null, reviews:null, align:null, evidence:null,\n                  risks:null, corrective:null, perspectives:[null,null,null,null],\n                  trend:[], ratings:[] };\n  const out = {};\n  const all = list || [];\n  out['All departments'] = Object.assign({}, blank, __perfOrgBscRow(), {\n    headcount: __perfOrgUsersOrRollup(all),\n    tasks: laneCounts(tasks),\n  });\n  all.forEach(d => {\n    out[d.name] = Object.assign({}, blank, {\n      headcount: typeof d.userCount === 'number' ? d.userCount : null,\n      tasks: laneCounts(tasks.filter(t => t.project === d.name)),\n    });\n  });\n  return out;\n}\nconst DEPTS = new Proxy({}, {\n  // Rebuilt on every read so it always reflects the latest bridge payload; the runtime\n  // captured DEPTS by closure at definition time, long before the fetch resolves.\n  get(_, k) { const t = __perfDeptTable(); return t[k]; },\n  has(_, k) { return k in __perfDeptTable(); },\n  ownKeys() { return Reflect.ownKeys(__perfDeptTable()); },\n  getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },\n});"

const DASH_SCALED_ANCHOR = "function scaled(name=VIEW.department){const b=DEPTS[name]||DEPTS['All departments'];const shift=(PERIOD[VIEW.period]||0)+(POP[VIEW.population]||0);const factor=VIEW.population==='Managers'?.24:VIEW.population==='Individual contributors'?.76:1;return {...b,score:clamp(b.score+shift),kpi:clamp(b.kpi+shift*.75),reviews:clamp(b.reviews+shift*.42),align:clamp(b.align+shift*.55),evidence:clamp(b.evidence+shift*.4),headcount:Math.max(1,Math.round(b.headcount*factor)),perspectives:b.perspectives.map((v,i)=>clamp(v+shift*(.32+i*.05))),trend:b.trend.map((v,i)=>clamp(v+shift+(i>8?shift*.12:0))),ratings:b.ratings.map(v=>Math.max(0,Math.round(v*factor))),tasks:b.tasks.map(v=>Math.max(0,Math.round(v*factor)))} }"
const DASH_SCALED = "function scaled(name=VIEW.department){/* patched:dashboard-scaled */const b=DEPTS[name]||DEPTS['All departments']||{};const shift=(PERIOD[VIEW.period]||0)+(POP[VIEW.population]||0);const factor=VIEW.population==='Managers'?.24:VIEW.population==='Individual contributors'?.76:1;const adj=(n,w)=>n==null?null:clamp(n+shift*w);return {...b,score:adj(b.score,1),kpi:adj(b.kpi,.75),reviews:adj(b.reviews,.42),align:adj(b.align,.55),evidence:adj(b.evidence,.4),headcount:b.headcount==null?null:Math.max(0,Math.round(b.headcount*factor)),perspectives:Array.isArray(b.perspectives)?b.perspectives.map((v,i)=>adj(v,.32+i*.05)):[],trend:Array.isArray(b.trend)?b.trend.map(v=>adj(v,1)):[],ratings:Array.isArray(b.ratings)?b.ratings:[],tasks:Array.isArray(b.tasks)?b.tasks:[]};}"

const DASH_BULLET_ANCHOR = "function bullet(label,value,delta,sub,tone,page){return `<article class=\"v240-kpi\" data-page=\"${page}\" role=\"button\" tabindex=\"0\" style=\"--tone:${tone}\"><div><div class=\"v240-kpi-label\">${label}</div><div class=\"v240-kpi-main\"><strong class=\"v240-kpi-value\">${value}%</strong><span class=\"v240-kpi-delta\">${delta}</span></div><div class=\"v240-kpi-sub\">${sub}</div></div><div class=\"v240-bullet\"><div class=\"v240-bullet-track\"><i class=\"v240-bullet-fill\" style=\"width:${value}%\"></i><i class=\"v240-bullet-benchmark\"></i></div><div class=\"v240-bullet-scale\"><span>0</span><span>100</span></div></div></article>`}"
const DASH_BULLET = "function bullet(label,value,delta,sub,tone,page){/* patched:dashboard-bullet */const has=value!=null&&!Number.isNaN(value);const shown=has?value+'%':__perfDash();const fill=has?value:0;return `<article class=\"v240-kpi\" data-page=\"${page}\" role=\"button\" tabindex=\"0\" style=\"--tone:${tone}\"><div><div class=\"v240-kpi-label\">${label}</div><div class=\"v240-kpi-main\"><strong class=\"v240-kpi-value\">${shown}</strong><span class=\"v240-kpi-delta\">${has?delta:'Not yet tracked'}</span></div><div class=\"v240-kpi-sub\">${sub}</div></div><div class=\"v240-bullet\"><div class=\"v240-bullet-track\"><i class=\"v240-bullet-fill\" style=\"width:${fill}%\"></i><i class=\"v240-bullet-benchmark\"></i></div><div class=\"v240-bullet-scale\"><span>0</span><span>100</span></div></div></article>`}"


// ---------------------------------------------------------------------------
// 10. Command Centre — remaining raw interpolations.
//
//     After DEPTS/scaled/bullet were made null-safe, 63 literal "null" strings still
//     rendered: `scorecard(d)` interpolates `${d.score}%`, `${d.evidence}%` and
//     `${d.perspectives[i]}%` directly, the ring arc computed `d.score/100*circ` (NaN), the
//     status line resolved `null>=85` and `null>=80` to false and therefore asserted
//     "Performance intervention required" about data that does not exist, and
//     `d.risks + d.corrective` summed two nulls to 0 — claiming zero risks for a domain
//     that has no model at all.
// ---------------------------------------------------------------------------
const DASH_SCORECARD_ANCHOR = "function scorecard(d){const names=['Financial','Stakeholder','Internal process','Learning & growth'],tones=['#2475f5','#07936d','#d9820b','#6554e8'],circ=2*Math.PI*51,len=d.score/100*circ;return `<div class=\"v240-scorecard\"><div class=\"v240-score-top\"><div class=\"v240-ring\"><svg viewBox=\"0 0 136 136\"><defs><linearGradient id=\"v240Ring\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2475f5\"/><stop offset=\".5\" stop-color=\"#0f98b6\"/><stop offset=\"1\" stop-color=\"#6554e8\"/></linearGradient></defs><circle class=\"track\" cx=\"68\" cy=\"68\" r=\"51\"/><circle class=\"value\" cx=\"68\" cy=\"68\" r=\"51\" stroke-dasharray=\"${len} ${circ-len}\"/></svg><div class=\"v240-ring-centre\"><div><strong>${d.score}%</strong><span>weighted score</span></div></div></div><div class=\"v240-score-facts\"><div class=\"v240-score-fact\"><span>Target</span><strong>85%</strong></div><div class=\"v240-score-fact\"><span>Perspectives at target</span><strong>${d.perspectives.filter(x=>x>=85).length}/4</strong></div><div class=\"v240-score-fact\"><span>Evidence coverage</span><strong>${d.evidence}%</strong></div></div></div><div class=\"v240-perspectives\">${names.map((n,i)=>`<div class=\"v240-perspective\" style=\"--tone:${tones[i]}\"><label>${n}</label><div class=\"v240-persp-track\"><i class=\"v240-persp-fill\" style=\"width:${d.perspectives[i]}%\"></i></div><strong>${d.perspectives[i]}%</strong></div>`).join('')}</div></div>`}"
const DASH_SCORECARD = "function scorecard(d){/* patched:dashboard-scorecard */const __pv=v=>(v==null||Number.isNaN(v))?__perfDash():v+'%';const names=['Financial','Stakeholder','Internal process','Learning & growth'],tones=['#2475f5','#07936d','#d9820b','#6554e8'],circ=2*Math.PI*51,len=(d.score==null?0:d.score/100*circ);return `<div class=\"v240-scorecard\"><div class=\"v240-score-top\"><div class=\"v240-ring\"><svg viewBox=\"0 0 136 136\"><defs><linearGradient id=\"v240Ring\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2475f5\"/><stop offset=\".5\" stop-color=\"#0f98b6\"/><stop offset=\"1\" stop-color=\"#6554e8\"/></linearGradient></defs><circle class=\"track\" cx=\"68\" cy=\"68\" r=\"51\"/><circle class=\"value\" cx=\"68\" cy=\"68\" r=\"51\" stroke-dasharray=\"${len} ${circ-len}\"/></svg><div class=\"v240-ring-centre\"><div><strong>${__pv(d.score)}</strong><span>weighted score</span></div></div></div><div class=\"v240-score-facts\"><div class=\"v240-score-fact\"><span>Target</span><strong>85%</strong></div><div class=\"v240-score-fact\"><span>Perspectives at target</span><strong>${d.perspectives.filter(x=>x>=85).length}/4</strong></div><div class=\"v240-score-fact\"><span>Evidence coverage</span><strong>${__pv(d.evidence)}</strong></div></div></div><div class=\"v240-perspectives\">${names.map((n,i)=>`<div class=\"v240-perspective\" style=\"--tone:${tones[i]}\"><label>${n}</label><div class=\"v240-persp-track\"><i class=\"v240-persp-fill\" style=\"width:${__pv(d.perspectives[i])}\"></i></div><strong>${__pv(d.perspectives[i])}</strong></div>`).join('')}</div></div>`}"

const DASH_STATUS_ANCHOR = "${d.score>=85?'Performance above benchmark':d.score>=80?'Performance stable with watch items':'Performance intervention required'}"
const DASH_STATUS = "${/* patched:dashboard-status */d.score==null?'Performance not yet tracked':d.score>=85?'Performance above benchmark':d.score>=80?'Performance stable with watch items':'Performance intervention required'}"

const DASH_HEAD_ANCHOR = "${d.headcount} people in scope"
const DASH_HEAD = "${/* patched:dashboard-headcount */d.headcount==null?'Headcount unavailable':d.headcount+' people in scope'}"

const DASH_RISK_ANCHOR = "${d.risks+d.corrective}"
const DASH_RISK = "${/* patched:dashboard-risks */(d.risks==null&&d.corrective==null)?__perfDash():((d.risks||0)+(d.corrective||0))}"

const DASH_REVPCT_ANCHOR = "${d.reviews}%"
const DASH_REVPCT = "${/* patched:dashboard-reviews-pct */d.reviews==null?__perfDash():d.reviews+'%'}"


// ---------------------------------------------------------------------------
// 11. Command Centre heatmap.
//
//     45 cells (9 units x 5 metrics) rendered `${v}%` raw, and `cell(v)` bucketed the value
//     into good/ok/watch/risk. For null every comparison is false, so every cell fell
//     through to **'risk'** — the entire grid rendered red, asserting organisation-wide
//     failure for metrics that have no data source at all. Now: an em dash and a neutral
//     'none' class.
//
//     `.v240-heat-cell.none` has no rule in the vendored CSS, so it inherits the plain cell
//     background — which is the desired neutral, and adds no stylesheet changes.
// ---------------------------------------------------------------------------
const DASH_HEAT_ANCHOR = "function heatmap(){const names=Object.keys(DEPTS).filter(x=>x!=='All departments');return `<div class=\"v240-heatmap\"><div class=\"v240-heat-head\"><span>Business unit</span><span>Score</span><span>KPI</span><span>Reviews</span><span>Alignment</span><span>Evidence</span></div><div class=\"v240-heat-rows\">${names.map(n=>{const d=scaled(n),vals=[d.score,d.kpi,d.reviews,d.align,d.evidence];return `<div class=\"v240-heat-row ${VIEW.department===n?'selected':''}\" data-v240-dept=\"${safe(n)}\" role=\"button\" tabindex=\"0\"><span class=\"v240-heat-unit\">${n}</span>${vals.map(v=>`<span class=\"v240-heat-cell ${cell(v)}\">${v}%</span>`).join('')}</div>`}).join('')}</div><div class=\"v240-heat-foot\"><span>Click a business unit to cross-filter the full command centre.</span><div class=\"v240-scale\"><span><i style=\"background:#e6f7f0\"></i>88+</span><span><i style=\"background:#eaf2ff\"></i>82-87</span><span><i style=\"background:#fff4df\"></i>76-81</span><span><i style=\"background:#ffedf1\"></i>&lt;76</span></div></div></div>`}"
const DASH_HEAT = "function heatmap(){/* patched:dashboard-heatmap */const names=Object.keys(DEPTS).filter(x=>x!=='All departments');return `<div class=\"v240-heatmap\"><div class=\"v240-heat-head\"><span>Business unit</span><span>Score</span><span>KPI</span><span>Reviews</span><span>Alignment</span><span>Evidence</span></div><div class=\"v240-heat-rows\">${names.map(n=>{const d=scaled(n),vals=[d.score,d.kpi,d.reviews,d.align,d.evidence];return `<div class=\"v240-heat-row ${VIEW.department===n?'selected':''}\" data-v240-dept=\"${safe(n)}\" role=\"button\" tabindex=\"0\"><span class=\"v240-heat-unit\">${n}</span>${vals.map(v=>`<span class=\"v240-heat-cell ${cell(v)}\">${v==null?__perfDash():v+'%'}</span>`).join('')}</div>`}).join('')}</div><div class=\"v240-heat-foot\"><span>Click a business unit to cross-filter the full command centre.</span><div class=\"v240-scale\"><span><i style=\"background:#e6f7f0\"></i>88+</span><span><i style=\"background:#eaf2ff\"></i>82-87</span><span><i style=\"background:#fff4df\"></i>76-81</span><span><i style=\"background:#ffedf1\"></i>&lt;76</span></div></div></div>`}"

const DASH_CELL_ANCHOR = "function cell(v){return v>=88?'good':v>=82?'ok':v>=76?'watch':'risk'}"
const DASH_CELL = "function cell(v){/* patched:dashboard-cell */if(v==null||Number.isNaN(v))return 'none';return v>=88?'good':v>=82?'ok':v>=76?'watch':'risk'}"


// ---------------------------------------------------------------------------
// 12. Command Centre business-unit comparison chart.
//
//     Rendered `${d.score}%` per unit and sorted by `scaled(b).score - scaled(a).score`.
//     With null scores the subtraction is NaN, so the sort comparator returned NaN for every
//     pair — an unstable, meaningless order presented as a ranking. Now: em dash for the
//     value, zero-width bar, and alphabetical order when no unit has a score.
// ---------------------------------------------------------------------------
const DASH_UNIT_ANCHOR = "function unitChart(){const names=Object.keys(DEPTS).filter(x=>x!=='All departments').sort((a,b)=>scaled(b).score-scaled(a).score),tones=['#2475f5','#6554e8','#07936d','#0f98b6','#d9820b'];return `<div class=\"v240-unit-chart\">${names.map((n,i)=>{const d=scaled(n);return `<div class=\"v240-unit-row ${VIEW.department===n?'selected':''}\" data-v240-dept=\"${safe(n)}\" role=\"button\" tabindex=\"0\" style=\"--tone:${tones[i%tones.length]}\"><span>${n}</span><div class=\"v240-unit-track\"><i class=\"v240-unit-fill\" style=\"width:${d.score}%\"></i><i class=\"v240-unit-dot\" style=\"left:${d.reviews}%\" title=\"Review completion ${d.reviews}%\"></i></div><strong>${d.score}%</strong></div>`}).join('')}<div class=\"v240-unit-axis\"><span>0</span><span>50</span><span>100</span></div><div class=\"v240-unit-label\">Weighted performance score (%) - violet marker shows review completion</div></div>`}"
const DASH_UNIT = "function unitChart(){/* patched:dashboard-unitchart */const names=Object.keys(DEPTS).filter(x=>x!=='All departments').sort((a,b)=>{const x=scaled(a).score,y=scaled(b).score;if(x==null&&y==null)return a.localeCompare(b);if(x==null)return 1;if(y==null)return -1;return y-x}),tones=['#2475f5','#6554e8','#07936d','#0f98b6','#d9820b'];return `<div class=\"v240-unit-chart\">${names.map((n,i)=>{const d=scaled(n);return `<div class=\"v240-unit-row ${VIEW.department===n?'selected':''}\" data-v240-dept=\"${safe(n)}\" role=\"button\" tabindex=\"0\" style=\"--tone:${tones[i%tones.length]}\"><span>${n}</span><div class=\"v240-unit-track\"><i class=\"v240-unit-fill\" style=\"width:${d.score==null?__perfDash():d.score+'%'}\"></i><i class=\"v240-unit-dot\" style=\"left:${d.reviews}%\" title=\"Review completion ${d.reviews}%\"></i></div><strong>${d.score==null?__perfDash():d.score+'%'}</strong></div>`}).join('')}<div class=\"v240-unit-axis\"><span>0</span><span>50</span><span>100</span></div><div class=\"v240-unit-label\">Weighted performance score (%) - violet marker shows review completion</div></div>`}"


// ---------------------------------------------------------------------------
// 13. Command Centre management action queue.
//
//     Each queue item interpolated a raw metric into a sentence — "null corrective actions
//     remain open", "null performance-related risks are active". Corrective Actions and
//     Alerts have no model at all, so these read as an honest statement of that instead.
// ---------------------------------------------------------------------------
const Q_QUEUE_CORRECTIVE_ANCHOR = "`${d.corrective} corrective actions remain open`"
const Q_QUEUE_CORRECTIVE = "`${/* patched:dashboard-queue-corrective */d.corrective==null?'Corrective actions not yet tracked':d.corrective+' corrective actions remain open'}`"

const Q_QUEUE_CORRECTIVE2_ANCHOR = "`${d.corrective} actions remain open`"
const Q_QUEUE_CORRECTIVE2 = "`${/* patched:dashboard-queue-corrective2 */d.corrective==null?'Corrective actions not yet tracked':d.corrective+' actions remain open'}`"

const Q_QUEUE_RISKS_ANCHOR = "`${d.risks} performance-related risks are active`"
const Q_QUEUE_RISKS = "`${/* patched:dashboard-queue-risks */d.risks==null?'Risks not yet tracked':d.risks+' performance-related risks are active'}`"

const Q_QUEUE_EVIDENCE_ANCHOR = "`${evidence} measures are waiting for evidence verification`"
const Q_QUEUE_EVIDENCE = "`${/* patched:dashboard-queue-evidence */evidence==null?'Evidence coverage not yet tracked':evidence+' measures are waiting for evidence verification'}`"


// ---------------------------------------------------------------------------
// 14. Review-cycle card header: `${d.reviews}% complete`.
//     Appears in two dashboard generations; both are replaced.
// ---------------------------------------------------------------------------
const REV_COMPLETE_ANCHOR = "${d.reviews}% complete"
const REV_COMPLETE = "${/* patched:dashboard-reviews-complete */d.reviews==null?__perfDash()+' complete':d.reviews+'% complete'}"


// ---------------------------------------------------------------------------
// 15. Performance Contracts and Integration Mapping.
//
//     Contracts claimed "96% coverage · 193 of 200 employees" against a
//     `performance_contracts` table with 0 rows and an `employees` table with 0 rows. The
//     three status counts (Approved / In review / Drafts) are now derived from the real
//     contract list, so they populate as contracts are created; coverage, weight validation
//     and overdue have no source and read as not tracked.
//
//     Integrations claimed 8 connected sources, 48 mappings and a 99.2% 7-day success rate.
//     `performance_sync_settings` holds 1 row and `performance_sync_jobs` 0, so there is no
//     sync history to compute any of it from — all six read as not tracked rather than
//     inventing an uptime figure.
// ---------------------------------------------------------------------------
const CONTRACTS_PAIRS = [
  ["${kpiV8('Contract coverage','96%','193 of 200 employees','file','green','contracts')}", "${/* patched:contracts-kpi-1 */kpiV8('Contract coverage',__perfDash(),'Not yet tracked','file','green','contracts')}"],
  ["${kpiV8('Approved','174','90% of active contracts','check','green','contracts')}", "${/* patched:contracts-kpi-2 */kpiV8('Approved',(()=>{const c=__perfScope('contracts');return c===null?__perfDash():String(c.filter(x=>/approved/i.test(x.status||'')).length)})(),(()=>{const c=__perfScope('contracts');return c===null?'Unavailable':(c.length?'Of '+c.length+' contracts':'None created yet')})(),'check','green','contracts')}"],
  ["${kpiV8('In review','12','Manager / employee sign-off','reviews','amber','contracts')}", "${/* patched:contracts-kpi-3 */kpiV8('In review',(()=>{const c=__perfScope('contracts');return c===null?__perfDash():String(c.filter(x=>/review/i.test(x.status||'')).length)})(),'Manager / employee sign-off','reviews','amber','contracts')}"],
  ["${kpiV8('Drafts','7','Need submission','edit','blue','contracts')}", "${/* patched:contracts-kpi-4 */kpiV8('Drafts',(()=>{const c=__perfScope('contracts');return c===null?__perfDash():String(c.filter(x=>/draft/i.test(x.status||'')).length)})(),'Need submission','edit','blue','contracts')}"],
  ["${kpiV8('Weight validation','99%','1 contract exception','shield','green','contracts')}", "${/* patched:contracts-kpi-5 */kpiV8('Weight validation',__perfDash(),'Not yet tracked','shield','green','contracts')}"],
  ["${kpiV8('Overdue','4','Escalated to department heads','alerts','red','contracts')}", "${/* patched:contracts-kpi-6 */kpiV8('Overdue',__perfDash(),'Not yet tracked','alerts','red','contracts')}"],
]
const INTEGRATIONS_PAIRS = [
  ["${kpiV8('Connected sources','8','All core systems online','link','green','integrations')}", "${/* patched:integrations-kpi-1 */kpiV8('Connected sources',__perfDash(),'Not yet tracked','link','green','integrations')}"],
  ["${kpiV8('Active mappings','48','7 added this month','grid','blue','integrations')}", "${/* patched:integrations-kpi-2 */kpiV8('Active mappings',__perfDash(),'Not yet tracked','grid','blue','integrations')}"],
  ["${kpiV8('Failed syncs','2','1 this week','alerts','red','integrations')}", "${/* patched:integrations-kpi-3 */kpiV8('Failed syncs',__perfDash(),'Not yet tracked','alerts','red','integrations')}"],
  ["${kpiV8('Refresh schedules','18','Next in 45 min','clock','brand','integrations')}", "${/* patched:integrations-kpi-4 */kpiV8('Refresh schedules',__perfDash(),'Not yet tracked','clock','brand','integrations')}"],
  ["${kpiV8('Configured thresholds','27','+3 this month','target','amber','kpiManagement')}", "${/* patched:integrations-kpi-5 */kpiV8('Configured thresholds',__perfDash(),'Not yet tracked','target','amber','kpiManagement')}"],
  ["${kpiV8('7-day success','99.2%','+1.1pp','check','green','integrations')}", "${/* patched:integrations-kpi-6 */kpiV8('7-day success',__perfDash(),'Not yet tracked','check','green','integrations')}"],
]


// ---------------------------------------------------------------------------
// 16. Performance Contracts — the LIVE renderer.
//
//     Patch 15 targeted a `kpiV8(...)` block that turned out to be a dead earlier layer: the
//     page still rendered "96% · 193 of 200 employees" afterwards. The live Contracts page is
//     owned by the v10/v11/v13 layers and uses `kpi(...)`, not `kpiV8(...)`. Verified in the
//     browser before and after. Both blocks are now patched; the v8 one is harmless either
//     way, but this is the one that shows.
// ---------------------------------------------------------------------------
const CONTRACTS_LIVE_PAIRS = [
  ["${kpi('Contract coverage','96%','193 of 200 employees','file','up','contracts')}", "${/* patched:contracts-live-kpi-1 */kpi('Contract coverage',__perfDash(),'Not yet tracked','file','up','contracts')}"],
  ["${kpi('Approved','174','90% of active contracts','check','up','contracts')}", "${/* patched:contracts-live-kpi-2 */kpi('Approved',(()=>{const c=__perfScope('contracts');return c===null?__perfDash():String(c.filter(x=>/approved/i.test(x.status||'')).length)})(),(()=>{const c=__perfScope('contracts');return c===null?__perfDash():(c.length?'Of '+c.length+' contracts':'None created yet')})(),'check','up','contracts')}"],
  ["${kpi('In review','12','Manager / employee sign-off','reviews','neutral','contracts')}", "${/* patched:contracts-live-kpi-3 */kpi('In review',(()=>{const c=__perfScope('contracts');return c===null?__perfDash():String(c.filter(x=>/review/i.test(x.status||'')).length)})(),'Manager / employee sign-off','reviews','neutral','contracts')}"],
  ["${kpi('Drafts','7','Need completion','edit','neutral','contracts')}", "${/* patched:contracts-live-kpi-4 */kpi('Drafts',(()=>{const c=__perfScope('contracts');return c===null?__perfDash():String(c.filter(x=>/draft/i.test(x.status||'')).length)})(),'Need completion','edit','neutral','contracts')}"],
  ["${kpi('Evidence coverage','94%','3 contracts need evidence','shield','up','contracts')}", "${/* patched:contracts-live-kpi-5 */kpi('Evidence coverage',__perfDash(),'Not yet tracked','shield','up','contracts')}"],
  ["${kpi('Overdue','4','Escalated to managers','alerts','down','contracts')}", "${/* patched:contracts-live-kpi-6 */kpi('Overdue',__perfDash(),'Not yet tracked','alerts','down','contracts')}"],
]


// ---------------------------------------------------------------------------
// 1b-2. Second bridge-readers block - see the note on label reuse above.
// ---------------------------------------------------------------------------
const READERS2_ANCHOR = `function __perfTasks() { return __perfScope('tasks') || []; }`

const READERS2 = `function __perfTasks() { return __perfScope('tasks') || []; }
/* patched:bridge-readers-2 */
// Object-shaped scopes (the /summary endpoints, the analytics rollups, the vision
// statement). __perfScope only ever returns arrays, so these need their own reader; the
// null contract is identical - not loaded, errored, or absent all read as null, and null
// renders as a dash.
function __perfObject(scope) {
  const g = window.__PERF_LIVE__;
  if (!g || !g.ready) return null;
  const s = g.data && g.data[scope];
  if (!s || s.error) return null;
  const d = s.data;
  return d && typeof d === 'object' && !Array.isArray(d) ? d : null;
}
window.__PERF_OBJECT__ = __perfObject;
// Count rows in a scope. Returns a dash when the scope has not loaded or errored, and the
// real number - including a real 0 - when it has. A zero the backend actually reported is
// information; a zero standing in for "unknown" is a lie, which is why these differ.
function __perfCount(scope, predicate) {
  const rows = __perfScope(scope);
  if (rows === null) return __perfDash();
  return String(predicate ? rows.filter(predicate).length : rows.length);
}
// Same, but for a number pulled out of an object scope by path, e.g.
// __perfNum('alertSummary', 'critical') or __perfNum('analyticsDashboard', 'totalUsers').
function __perfNum(scope, key, suffix) {
  const o = __perfObject(scope);
  if (!o) return __perfDash();
  const v = o[key];
  if (v == null || Number.isNaN(Number(v))) return __perfDash();
  return String(v) + (suffix || '');
}
// Sub-count out of a byStatus / bySeverity tally object.
function __perfTally(scope, group, key) {
  const o = __perfObject(scope);
  if (!o || !o[group] || typeof o[group] !== 'object') return __perfDash();
  const v = o[group][key];
  return v == null ? __perfDash() : String(v);
}
// Human date, or a dash. Never "Invalid Date", never today's date as a stand-in.
function __perfDate(v) {
  if (!v) return __perfDash();
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return __perfDash();
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
// Title-case a snake_case / lower status token for display: in_progress -> In progress.
function __perfLabel(v) {
  if (v == null || v === '') return __perfDash();
  const t = String(v).replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
// Empty-state row spanning a table, used wherever a fixture list was removed. Distinguishes
// "nothing created yet" from "could not load", because those are different facts.
function __perfEmptyRow(scope, cols, noun) {
  const rows = __perfScope(scope);
  const msg = rows === null
    ? 'Unavailable - could not load ' + noun
    : 'No ' + noun + ' yet';
  return '<tr><td colspan="' + cols + '" style="text-align:center;padding:28px 12px;color:var(--muted, #6b7280)">' + msg + '</td></tr>';
}
// A chart with no series behind it. Charts are the easiest place to fake data - a smooth
// upward sparkline reads as evidence - so a panel with no time series says so in place of
// the drawing, at the chart's own height so the layout does not jump.
function __perfNoSeries(what) {
  return '<div style="display:flex;align-items:center;justify-content:center;min-height:150px;'
    + 'padding:16px;text-align:center;color:var(--muted, #6b7280);font-size:13px;line-height:1.5">'
    + (what || 'No history is recorded for this yet, so no trend can be drawn.') + '</div>';
}
// Percent or dash. Never 0% for unknown, and never NaN%.
function __perfPct(v, digits) {
  if (v == null || Number.isNaN(Number(v))) return __perfDash();
  const n = Number(v);
  return (digits == null ? Math.round(n) : n.toFixed(digits)) + '%';
}
// Sum a numeric field across a scope's rows. Dash when the scope is not loaded; a real 0
// when it loaded and is empty.
function __perfSum(scope, field) {
  const rows = __perfScope(scope);
  if (rows === null) return __perfDash();
  let total = 0, seen = 0;
  rows.forEach(r => { const v = Number(r && r[field]); if (Number.isFinite(v)) { total += v; seen++; } });
  return seen === 0 && rows.length > 0 ? __perfDash() : String(total);
}
window.__PERF_HELPERS__ = { __perfCount, __perfNum, __perfTally, __perfDate, __perfLabel, __perfEmptyRow, __perfNoSeries, __perfPct, __perfSum };`

// ---------------------------------------------------------------------------
// Per-page patch modules.
//
//   scripts/perf-patches/<page>.mjs  ->  export default [{ label, find, repl }, ...]
//
// One file per page so several people (or agents) can work on different pages without
// colliding in this file. Loaded in filename order so a run is reproducible; every entry
// goes through the same `patch()` guard, so the same idempotency and same
// refuse-to-write-on-missed-anchor rules apply to them as to the built-ins above.
//
// Each `repl` must embed its own `/* patched:<label> */` marker - `patch()` uses that marker
// to decide whether the patch already landed, and a repl without one re-applies forever or,
// worse, reports MISS on the second run and blocks the write.
// ---------------------------------------------------------------------------
const PATCH_DIR = path.join(__dirname, "perf-patches")

async function loadPageModules() {
  if (!fs.existsSync(PATCH_DIR)) return []
  const files = fs.readdirSync(PATCH_DIR).filter((f) => f.endsWith(".mjs")).sort()
  const out = []
  for (const f of files) {
    const url = pathToFileURL(path.join(PATCH_DIR, f)).href
    const mod = await import(url)
    const list = mod.default
    if (!Array.isArray(list)) {
      throw new Error(`perf-patches/${f}: default export must be an array of { label, find, repl }`)
    }
    list.forEach((entry, i) => {
      if (!entry || typeof entry.label !== "string" || typeof entry.find !== "string" || typeof entry.repl !== "string") {
        throw new Error(`perf-patches/${f}[${i}]: needs string label, find and repl`)
      }
      if (!entry.repl.includes(`/* patched:${entry.label} */`)) {
        throw new Error(
          `perf-patches/${f}[${i}] (${entry.label}): repl must contain the marker ` +
            `/* patched:${entry.label} */ or the patch cannot be detected on re-run`,
        )
      }
    })
    out.push({ file: f, list })
  }
  return out
}


// ---------------------------------------------------------------------------
// Exclusive lock.
//
// Several people (or agents) may run this concurrently while working on different
// perf-patches/ files. Two processes doing read -> patch -> write on the same 2.2 MB runtime
// will silently lose one side's edits, so the whole run is serialised behind an O_EXCL lock
// file. Patches are idempotent and marker-guarded, so a queued run simply skips whatever the
// run before it already applied.
//
// A lock older than STALE_MS is assumed abandoned (crashed run) and taken over.
// ---------------------------------------------------------------------------
const LOCK_FILE = path.join(ROOT, ".patch-performance-runtime.lock")
const STALE_MS = 5 * 60 * 1000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function acquireLock(timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs
  let announced = false
  for (;;) {
    try {
      fs.writeFileSync(LOCK_FILE, `${process.pid} ${new Date().toISOString()}\n`, { flag: "wx" })
      return
    } catch (err) {
      if (err.code !== "EEXIST") throw err
      let age = Infinity
      try {
        age = Date.now() - fs.statSync(LOCK_FILE).mtimeMs
      } catch {
        continue // vanished between the failed create and the stat - retry immediately
      }
      if (age > STALE_MS) {
        console.warn(`  lock is ${Math.round(age / 1000)}s old - assuming a crashed run and taking it over`)
        try { fs.unlinkSync(LOCK_FILE) } catch {}
        continue
      }
      if (!announced) {
        console.log("  another patch run holds the lock - waiting...")
        announced = true
      }
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${LOCK_FILE}`)
      await sleep(500)
    }
  }
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE) } catch {}
}

async function main() {
  if (!fs.existsSync(RUNTIME)) throw new Error(`runtime not found: ${RUNTIME}`)
  if (!CHECK_ONLY) await acquireLock()
  try {
    await run()
  } finally {
    if (!CHECK_ONLY) releaseLock()
  }
}

async function run() {
  const before = fs.readFileSync(RUNTIME, "utf8")
  const beforeBytes = Buffer.byteLength(before)
  EOL = before.includes("\r\n") ? "\r\n" : "\n"

  console.log(`patch-performance-runtime  (${CHECK_ONLY ? "check" : "write"})`)
  console.log(`  runtime: ${path.relative(ROOT, RUNTIME)}  ${beforeBytes} bytes  eol=${EOL === "\r\n" ? "CRLF" : "LF"}`)

  let src = before
  src = patch(src, { label: "bridge-globals", find: BRIDGE_ANCHOR, repl: BRIDGE })
  src = patch(src, { label: "bridge-readers", find: READERS_ANCHOR, repl: READERS })
  src = patch(src, { label: "real-role", find: REAL_ROLE_ANCHOR, repl: REAL_ROLE })
  src = patch(src, { label: "dashboard-depts", find: DASH_DEPTS_ANCHOR, repl: DASH_DEPTS })
  src = patch(src, { label: "dashboard-scaled", find: DASH_SCALED_ANCHOR, repl: DASH_SCALED })
  src = patch(src, { label: "dashboard-bullet", find: DASH_BULLET_ANCHOR, repl: DASH_BULLET })
  src = patch(src, { label: "dashboard-scorecard", find: DASH_SCORECARD_ANCHOR, repl: DASH_SCORECARD })
  src = patch(src, { label: "dashboard-status", find: DASH_STATUS_ANCHOR, repl: DASH_STATUS })
  src = patch(src, { label: "dashboard-headcount", find: DASH_HEAD_ANCHOR, repl: DASH_HEAD })
  // `${d.risks+d.corrective}` appears in two generations, both fed by the same null-safe
  // `scaled()`, so both should show a dash rather than "NaN". Replace every occurrence.
  src = patch(src, { label: "dashboard-risks", find: DASH_RISK_ANCHOR, repl: DASH_RISK, occurrences: "all" })
  src = patch(src, { label: "dashboard-heatmap", find: DASH_HEAT_ANCHOR, repl: DASH_HEAT })
  src = patch(src, { label: "dashboard-cell", find: DASH_CELL_ANCHOR, repl: DASH_CELL })
  src = patch(src, { label: "dashboard-unitchart", find: DASH_UNIT_ANCHOR, repl: DASH_UNIT })
  CONTRACTS_PAIRS.forEach(([find, repl], i) =>
    (src = patch(src, { label: `contracts-kpi-${i + 1}`, find, repl })),
  )
  CONTRACTS_LIVE_PAIRS.forEach(([find, repl], i) =>
    (src = patch(src, { label: `contracts-live-kpi-${i + 1}`, find, repl })),
  )
  INTEGRATIONS_PAIRS.forEach(([find, repl], i) =>
    (src = patch(src, { label: `integrations-kpi-${i + 1}`, find, repl })),
  )
  src = patch(src, { label: "dashboard-queue-corrective", find: Q_QUEUE_CORRECTIVE_ANCHOR, repl: Q_QUEUE_CORRECTIVE })
  src = patch(src, { label: "dashboard-queue-corrective2", find: Q_QUEUE_CORRECTIVE2_ANCHOR, repl: Q_QUEUE_CORRECTIVE2 })
  src = patch(src, { label: "dashboard-queue-risks", find: Q_QUEUE_RISKS_ANCHOR, repl: Q_QUEUE_RISKS })
  src = patch(src, { label: "dashboard-queue-evidence", find: Q_QUEUE_EVIDENCE_ANCHOR, repl: Q_QUEUE_EVIDENCE })
  // Two generations carry this exact string; replace every occurrence in one guarded step.
  if (!src.includes("/* patched:dashboard-reviews-complete */")) {
    const before = src
    src = src.split(REV_COMPLETE_ANCHOR).join(REV_COMPLETE)
    if (src !== before) { console.log("  apply           dashboard-reviews-complete (all occurrences)"); applied++ }
    else { console.error("  MISS            dashboard-reviews-complete"); missed++ }
  } else { console.log("  skip (already)  dashboard-reviews-complete"); skipped++ }
  // MUST run after dashboard-unitchart and dashboard-reviews-complete: their anchors both
  // contain `${d.reviews}%`, so replacing every occurrence of the shorter string first
  // destroys them and the run then fails with MISS on two anchors that were fine.
  // `${d.reviews}%` appears 13 times across the stacked dashboard generations. Patching
  // only the first hit the OLDEST, dead one - which is why review completion still
  // rendered "null%" on screen after this patch reported success. All of them read the
  // same `scaled()` object, so all of them are replaced.
  src = patch(src, { label: "dashboard-reviews-pct", find: DASH_REVPCT_ANCHOR, repl: DASH_REVPCT, occurrences: "all" })
  src = patch(src, { label: "live-data-rerender", find: RERENDER_ANCHOR, repl: RERENDER })
  src = patch(src, { label: "handle-before-action", find: HANDLE_ANCHOR, repl: HANDLE })
  src = patch(src, { label: "after-render", find: RENDER_ANCHOR, repl: RENDER })
  src = patch(src, { label: "departments-live", find: DEPT_FIXTURE_ANCHOR, repl: DEPT_FIXTURE })
  DEPT_KPIS.forEach(([find, repl], i) =>
    (src = patch(src, { label: `departments-kpi-${i + 1}`, find, repl })),
  )
  src = patch(src, { label: "departments-projects", find: DEPT_PROJECTS_ANCHOR, repl: DEPT_PROJECTS })
  src = patch(src, { label: "tasks-summary", find: TASK_SUMMARY_ANCHOR, repl: TASK_SUMMARY })
  src = patch(src, { label: "task-progress-pct", find: TASK_PCT_ANCHOR, repl: TASK_PCT })
  src = patch(src, { label: "themes-live", find: THEMES_FIXTURE_ANCHOR, repl: THEMES_FIXTURE })
  THEME_KPIS.forEach(([find, repl], i) =>
    (src = patch(src, { label: `themes-kpi-${i + 1}`, find, repl })),
  )
  ANALYTICS_KPIS.forEach(([find, repl], i) =>
    (src = patch(src, { label: `analytics-kpi-${i + 1}`, find, repl })),
  )
  src = patch(src, { label: "bridge-readers-2", find: READERS2_ANCHOR, repl: READERS2 })

  for (const { file, list } of await loadPageModules()) {
    console.log(`  -- perf-patches/${file} (${list.length})`)
    for (const entry of list) src = patch(src, entry)
  }

  console.log(`\n  applied=${applied} skipped=${skipped} missed=${missed}`)

  if (missed) {
    console.error("\nRefusing to write: at least one anchor was not found. The runtime was")
    console.error("probably re-extracted and the anchors moved. Fix the anchors, do not")
    console.error("hand-edit the runtime.")
    process.exit(1)
  }

  if (CHECK_ONLY) {
    console.log(`\n  --check: no write. ${applied ? "Patches WOULD be applied." : "Runtime already patched."}`)
    return
  }

  if (src === before) {
    console.log("\n  no change")
    return
  }

  fs.writeFileSync(RUNTIME, src)
  const delta = Buffer.byteLength(src) - beforeBytes
  console.log(`\n  written. ${Buffer.byteLength(src)} bytes (${delta >= 0 ? "+" : ""}${delta})`)
}

main().catch((err) => {
  console.error("\n" + (err && err.stack ? err.stack : err))
  process.exit(1)
})
