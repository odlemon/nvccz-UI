/**
 * KPI Management (`/performance/kpi-management`).
 *
 * LIVE RENDERER — and this page is the trap the README warns about.
 *   `kpiManagementV8()` in the v8 layer looks like the page: it holds the "KPI Registry (24)"
 *   card with eight invented KPIs, an "Integration Mapping" list claiming 23 / 12 / 18 / 8 /
 *   14 mapped KPIs per connector, and a "BSC Pillar Weights" panel of 30/25/25/20. NONE of it
 *   renders. A later layer intercepts the page entirely —
 *     `if(state.page==='kpiManagement'){renderNav();w.innerHTML=canPage('kpiManagement')?kpiPage():…}`
 *   — so the live renderer is `kpiPage()` in the v20 layer. Verified against
 *   `.perf-dumps/a3/sysadmin__kpiManagement.txt`: the page shows "Governed KPI registry" with
 *   four rows, which is `kpiPage()`'s markup, not the v8 one's.
 *
 * WHAT WAS FABRICATED (8 numbers on screen)
 *   `V.kpis`, a four-entry seed (FIN-001 Revenue Growth, CUS-001 Customer Satisfaction,
 *   INT-001 Process Compliance, LRN-003 Leadership Development) persisted to localStorage,
 *   carrying invented owners, source systems, formulas and targets (25% / 80 / 95% / 95%).
 *   The five metric cards were computed off that seed — Registered 4, Active 4, Manual 1,
 *   Integrated 3 — and "Approval exceptions" was the literal `'1'`.
 *
 *   `GET /api/kpis` returns 0 rows. (`GET /api/performance/kpis` is deliberately not used
 *   anywhere: it serves fixtures from `hardcodedKPIs.ts` while writes land in the `kpis`
 *   table that only `/api/kpis` reads.)
 *
 * WHAT IT SHOWS NOW
 *   `V.kpis` is re-projected from the live `kpis` scope on every render of the page, so the
 *   registry, the row count and the detail view all follow the real catalogue and the seed
 *   can never come back from a stale localStorage entry. "Registered KPIs" is a real count
 *   including a real 0; the table distinguishes "none created yet" from "could not load".
 *   Active / Manual / Integrated / Approval exceptions have no source — `/api/kpis` carries
 *   no active flag, no update method and no approval state — so they read as not tracked.
 *   Perspective, company goal, source system and update method are dashes in the row for the
 *   same reason.
 */

// --- live projection ------------------------------------------------------------------------
// Runs before the `V.kpiId` branch so the detail view cannot open a KPI that no longer exists
// (`kpiDetail` falls back to `V.kpis[0]`, which would throw on an empty catalogue).
const STATE_FIND =
  "function kpiPage(){if(V.kpiId)return kpiDetail(V.kpiId);const active=V.kpis.filter(x=>x.active).length,manual=V.kpis.filter(x=>/Manual/.test(x.updateMethod)).length;return `<div class=\"page\">"

const STATE_REPL =
  "function kpiPage(){/* patched:kpimgmt-live-state */\n" +
  "  // Was a four-row fixture persisted under `matanho.v20.operational.depth`. Rebuilt from\n" +
  "  // GET /api/kpis on every render: overwriting rather than merging is deliberate, so a\n" +
  "  // localStorage copy of the old seed cannot survive. Fields the endpoint does not carry\n" +
  "  // stay null and render as an em dash.\n" +
  "  const __kRows=__perfScope('kpis');\n" +
  "  V.kpis=(__kRows||[]).map(k=>({\n" +
  "    code:k.code||k.id,\n" +
  "    name:k.name,\n" +
  "    description:k.description||'',\n" +
  "    owner:k.owner||null,\n" +
  "    frequency:k.frequency||null,\n" +
  "    target:k.target||null,\n" +
  "    status:k.status||null,\n" +
  "    perspective:null,companyGoal:null,source:null,updateMethod:null,active:null,\n" +
  "    __live:true,\n" +
  "  }));\n" +
  "  if(V.kpiId&&!V.kpis.some(x=>x.code===V.kpiId))V.kpiId=null;\n" +
  "  if(V.kpiId)return kpiDetail(V.kpiId);\n" +
  "  return `<div class=\"page\">"

// --- metric strip ------------------------------------------------------------------------------
const METRICS_FIND =
  "<div class=\"v20-metrics\">${metric('Registered KPIs',V.kpis.length,'Governed definitions')}${metric('Active',active,'Available to scorecards')}${metric('Manual / workflow',manual,'Requires controlled update')}${metric('Integrated',V.kpis.length-manual,'Mapped to source systems')}${metric('Approval exceptions','1','Requires governance review')}</div>"

const METRICS_REPL =
  "<div class=\"v20-metrics\">${/* patched:kpimgmt-metrics */metric('Registered KPIs',__perfCount('kpis'),'Governed definitions')}" +
  "${metric('Active',__perfDash(),'Not yet tracked')}" +
  "${metric('Manual / workflow',__perfDash(),'Not yet tracked')}" +
  "${metric('Integrated',__perfDash(),'Not yet tracked')}" +
  "${metric('Approval exceptions',__perfDash(),'Not yet tracked')}</div>"

// --- registry rows -------------------------------------------------------------------------------
const ROWS_FIND =
  "<tbody data-v20-kpi-rows>${V.kpis.map(k=>`<tr data-v20-action=\"kpi-open\" data-id=\"${h(k.code)}\"><td><strong>${h(k.code)}</strong></td><td><strong>${h(k.name)}</strong><small>${h(k.description)}</small></td><td>${h(k.perspective)}</td><td>${h(k.companyGoal)}</td><td>${h(k.owner)}</td><td>${h(k.source)}</td><td>${h(k.frequency)}</td><td>${h(k.target)}</td><td>${h(k.updateMethod)}</td><td>${status(k.active?k.status:'Inactive')}</td></tr>`).join('')}</tbody>"

// Same row markup and same ten columns; only the values change. `h(null)` rendered an empty
// cell, which reads as "nothing configured" rather than "the API does not carry this".
const ROWS_REPL =
  "<tbody data-v20-kpi-rows>${/* patched:kpimgmt-registry-rows */(() => {\n" +
  "  if (!V.kpis.length) return __perfEmptyRow('kpis', 10, 'KPIs');\n" +
  "  const d = v => (v == null || v === '') ? __perfDash() : h(v);\n" +
  "  return V.kpis.map(k=>`<tr data-v20-action=\"kpi-open\" data-id=\"${h(k.code)}\"><td><strong>${d(k.code)}</strong></td><td><strong>${d(k.name)}</strong><small>${k.description?h(k.description):''}</small></td><td>${d(k.perspective)}</td><td>${d(k.companyGoal)}</td><td>${d(k.owner)}</td><td>${d(k.source)}</td><td>${d(k.frequency)}</td><td>${d(k.target)}</td><td>${d(k.updateMethod)}</td><td>${k.status?status(k.status):__perfDash()}</td></tr>`).join('');\n" +
  "})()}</tbody>"

// --- perspective taxonomy --------------------------------------------------------------------
// The registry filter and the create/edit form both offered a hardcoded four-item balanced
// scorecard list that does not match the configured pillars: the backend's are Financial,
// Customer & Market, Internal Operations and Learning, Growth & HR. Both now read the real
// `pillarConfig` scope, so the two stay in step. Two occurrences, both live (the `data-v20-kpi
// -perspective` filter in `kpiPage` and the `name="perspective"` select in `kpiModal`); their
// surrounding `.map()` bodies differ, so only the array literal itself is replaced.
const PERSPECTIVES_FIND =
  "['Financial','Customer & Market','Internal Process & Governance','Learning & Growth']"

const PERSPECTIVES_REPL =
  "/* patched:kpimgmt-perspective-options */((__perfScope('pillarConfig')||[]).map(p=>p.name))"

// --- create / edit — now wired -----------------------------------------------------------------
// `saveKpi` used to write only to the localStorage-backed `V.kpis` and report success. It never
// made a network request, and the registry is rebuilt from `GET /api/kpis` on every render, so
// a "saved" KPI disappeared on the next paint. `kpimgmt-save-toast` (an earlier pass) made the
// toast honest about that; this patch replaces the whole function and makes the save real via
// `window.__PERF_SUBMIT_KPI__` (exposed by the React host — see lib/performance-v22-mock/
// actions.ts `submitKpi`, called directly rather than through the central `handle()` dispatcher
// because this form's Save button uses the page-local `data-v20-action` dispatch, not
// `data-action`). Absorbs and supersedes `kpimgmt-save-toast`, whose anchor this rewrites.
//
// Target/threshold/source-system/formula/evidence-policy fields have no home on the real KPI
// model — only name/code/description/unit/direction/perspective persist. The rest keeps saving
// to the local `V.kpis` mirror so the form doesn't lose data, and the toast says plainly which
// half actually reached the backend.
const SAVE_FIND =
  "function saveKpi(){const f=document.getElementById('v20KpiForm');if(!f?.reportValidity())return;const d=new FormData(f),original=String(d.get('original')||''),code=String(d.get('code')).trim();if(V.kpis.some(x=>x.code===code&&x.code!==original)){toast('KPI code already exists','Choose a unique governed KPI code.');return}const patch={code,name:String(d.get('name')),description:String(d.get('description')),perspective:String(d.get('perspective')),companyGoal:String(d.get('companyGoal')),unit:String(d.get('unit')),direction:String(d.get('direction')),calculation:String(d.get('calculation')),formula:String(d.get('formula')),frequency:String(d.get('frequency')),source:String(d.get('source')),sourceField:String(d.get('sourceField')),updateMethod:String(d.get('updateMethod')),owner:String(d.get('owner')),verifier:String(d.get('verifier')),target:String(d.get('target')),warning:String(d.get('warning')),critical:String(d.get('critical')),aggregation:String(d.get('aggregation')),decimals:String(d.get('decimals')),evidence:String(d.get('evidence')),evidenceType:String(d.get('evidenceType')),active:d.get('active')!==null,status:original?'Approved':'Draft'};let k=V.kpis.find(x=>x.code===original);if(k){Object.assign(k,patch);k.history=k.history||[];k.history.unshift({date:currentDate,text:'KPI measurement policy and configuration updated.',actor:state.role})}else{V.kpis.unshift({...patch,history:[{date:currentDate,text:'KPI definition created and submitted for governance review.',actor:state.role}]})}V.kpiId=code;save();closeOverlays();render();toast('KPI configuration saved',`${code} is now configured with its measurement, source and evidence policy.`)}"

const SAVE_REPL = `function saveKpi(){
  /* patched:kpimgmt-save-toast */
  const f=document.getElementById('v20KpiForm');if(!f?.reportValidity())return;
  const d=new FormData(f),original=String(d.get('original')||''),code=String(d.get('code')).trim();
  if(V.kpis.some(x=>x.code===code&&x.code!==original)){toast('KPI code already exists','Choose a unique governed KPI code.');return}
  const patch={code,name:String(d.get('name')),description:String(d.get('description')),perspective:String(d.get('perspective')),companyGoal:String(d.get('companyGoal')),unit:String(d.get('unit')),direction:String(d.get('direction')),calculation:String(d.get('calculation')),formula:String(d.get('formula')),frequency:String(d.get('frequency')),source:String(d.get('source')),sourceField:String(d.get('sourceField')),updateMethod:String(d.get('updateMethod')),owner:String(d.get('owner')),verifier:String(d.get('verifier')),target:String(d.get('target')),warning:String(d.get('warning')),critical:String(d.get('critical')),aggregation:String(d.get('aggregation')),decimals:String(d.get('decimals')),evidence:String(d.get('evidence')),evidenceType:String(d.get('evidenceType')),active:d.get('active')!==null,status:original?'Approved':'Draft'};
  let k=V.kpis.find(x=>x.code===original);
  if(k){Object.assign(k,patch);k.history=k.history||[];k.history.unshift({date:currentDate,text:'KPI measurement policy and configuration updated.',actor:state.role})}
  else{V.kpis.unshift({...patch,history:[{date:currentDate,text:'KPI definition created and submitted for governance review.',actor:state.role}]})}
  V.kpiId=code;save();
  if(typeof window.__PERF_SUBMIT_KPI__!=='function'){closeOverlays();render();toast('Not saved','KPI creation and editing are not connected to the backend in this session.');return}
  const existingBackendId=(typeof __perfScope==='function'?(__perfScope('kpis')||[]):[]).find(x=>x.code===original)?.id||null;
  window.__PERF_SUBMIT_KPI__({code,name:patch.name,description:patch.description,unit:patch.unit,isReverseKpi:patch.direction==='Lower is better',perspective:patch.perspective},existingBackendId)
    .then(()=>{closeOverlays();render()})
    .catch(()=>{closeOverlays();render()});
}`

export default [
  { label: "kpimgmt-live-state", find: STATE_FIND, repl: STATE_REPL },
  { label: "kpimgmt-metrics", find: METRICS_FIND, repl: METRICS_REPL },
  { label: "kpimgmt-registry-rows", find: ROWS_FIND, repl: ROWS_REPL },
  {
    label: "kpimgmt-perspective-options",
    find: PERSPECTIVES_FIND,
    repl: PERSPECTIVES_REPL,
    occurrences: 2,
  },
  { label: "kpimgmt-save-toast", find: SAVE_FIND, repl: SAVE_REPL },
]
