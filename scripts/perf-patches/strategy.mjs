/**
 * Company Strategy (`/performance/strategy`).
 *
 * LIVE RENDERER — traced, not grepped.
 *   `function strategy()` is declared at runtime L358 and REASSIGNED once, at L2358, by the
 *   v11 layer (`strategy=function(){...}`). That reassignment is the last one in the file, so
 *   the v11 layer owns the page. It is confirmed by the page description in the dump — "A
 *   layered enterprise strategy operating system connecting intent, measures, work, risk,
 *   evidence and executive decisions" — which appears only in the L2358 `pageHead(...)` call.
 *
 *   The page is a seven-tab workspace inside one route: Executive Overview, Strategic Themes,
 *   Strategy Map, Objective Portfolio, Strategic Initiatives, Risks & Assumptions, Reviews &
 *   Decisions, plus a drill-down (`layerView`) for a single theme/objective/initiative/risk.
 *   `perf-page-dump.mjs` only ever sees the default Overview tab, so the six other tabs are
 *   patched here on the strength of reading `themesView` / `mapView` / `objectiveView` /
 *   `initiativesView` / `risksView` / `reviewsView` / `layerView` directly. A number nobody
 *   dumps is still a number a user sees.
 *
 * WHAT WAS FABRICATED
 *   The entire page. Four module-scope arrays at the top of the v11 IIFE — 4 themes,
 *   16 objectives, 9 initiatives, 6 risks — carried invented names, owners, sponsors,
 *   scores, targets, evidence percentages, delivery-confidence percentages, risk scores and
 *   review dates, and every tab was rendered from them. On top of that:
 *     - hero: "86.4% strategic alignment · 12 of 12 departments aligned", "82% portfolio
 *       confidence", "v3.0 · Approved", "Next formal review 20 Aug 2026", "Evidence
 *       freshness 8 min", owner "Executive Committee";
 *     - six KPI cards: Themes 4 / Objectives 16 (11 on track) / Initiatives 9 (2 at risk) /
 *       Risks 6 (2 high exposure) / Evidence coverage 96% / Decision readiness 91%;
 *     - a "Strategy performance trajectory" chart drawn from three literal 7-point series
 *       (`a`, `t`, `f`) with a "Forecast 88%" label baked into the SVG;
 *     - an "Executive attention" queue naming OBJ-09, OBJ-05, INIT-06 and INIT-04;
 *     - a decision & review queue, a review timeline, a decision log, a dependency map,
 *       an assumptions list and three sets of `bar(...)` gauges (97/94/100/96,
 *       82/74/88/91) — all literals.
 *
 *   The database behind all of it: `performance_themes` 0 rows, `performance_goals` 0 rows,
 *   `risk_assessments` 0 rows, `performance_strategies` 0 rows. Nothing on this page had a
 *   source.
 *
 * WHAT IT SHOWS NOW
 *   - Themes tab / theme lists / strategy-map rows  <- `themes` scope
 *     (`GET /api/performance/config/themes`).
 *   - Objective portfolio / map nodes / Objectives KPI  <- `goals` scope
 *     (`GET /api/performance/goals`). This is the same mapping the built-in
 *     `themes-kpi-2` patch already uses for "Linked objectives".
 *   - Strategic risk register / Risks KPI  <- `risks` scope (`GET /api/risk-assessments`).
 *   - Strategic alignment  <- `deptComparison`
 *     (`GET /api/performance/analytics/departments/comparison`): the share of departments
 *     that have at least one goal linked. That is a real computation over a real response,
 *     and it is currently 0 of 9 — a true zero, which is information.
 *   - Everything else reads as an em dash with "Not yet tracked", or as a short note in
 *     place of an invented list or chart.
 *
 * THE ONE STRUCTURAL TRAP HERE
 *   The four arrays are `const` at the top of the layer's IIFE, so they are evaluated ONCE,
 *   when the layer loads — which is before the host's fetch resolves. A plain
 *   `const themes = __perfScope('themes') || []` would capture an empty bridge and stay empty
 *   for the life of the page even after `matanho:live-data` fires and re-renders. Each is
 *   therefore a Proxy that rebuilds from the bridge on every property read, the same device
 *   the command centre uses for `DEPTS`.
 *
 * STILL WITHOUT A SOURCE — what the backend would have to grow (reported, not invented)
 *   - Strategic initiatives. No table, no endpoint, no scope: the whole Strategic Initiatives
 *     tab, the initiative portfolio panel and every initiative reference is empty by
 *     necessity. Needs a `performance_initiatives` table (name, theme FK, owner, status,
 *     progress, confidence, milestone, date) and a read endpoint.
 *   - Theme -> objective / initiative / risk linkage. `GET /performance/config/themes`
 *     returns id/name/description/status only, and goals and risk assessments carry no theme
 *     FK, so per-theme counts, the strategy-map cause-and-effect rows and the theme drill-down
 *     cannot be assembled. Needs a `themeId` on goals and on risk assessments.
 *   - Objective score / target / evidence coverage / next review. Goals come back as
 *     id/name/description/status; there is no measured value, no approved target, no evidence
 *     model and no review date.
 *   - Theme score and any weighted "strategy score", hence the trajectory chart: nothing
 *     stores a scored value per period, so there is no series to draw.
 *   - Strategy owner, version, approval state and review cadence. `performance_strategies`
 *     has 0 rows and `PerfNamed` exposes only id/name/description/status.
 *   - Executive decisions and strategy reviews: no decision log, no review-cadence model.
 *   - Delivery confidence, scenario/downside modelling, dependency register, assumption
 *     register: no tables at all.
 *
 * CAVEAT WORTH FLAGGING
 *   `risks` is `GET /api/risk-assessments`, the enterprise risk register. Nothing marks a
 *   risk as *strategic* and nothing links one to a theme, so the "Strategic risk register"
 *   panel shows the whole register unfiltered. That is real data in a slightly narrower slot
 *   than its label claims; it is the only risk source that exists, and the alternative was to
 *   keep six invented risks. A `scope`/`themeId` on risk assessments would resolve it.
 */

/* =========================================================================================
 * 1. Live arrays.
 * ======================================================================================= */

const HELPERS_FIND =
  "const S=state.strategyV11||(state.strategyV11={tab:'overview',period:'FY 2026',scope:'Enterprise',layer:null,filter:'all'});"

const HELPERS_REPL =
  "const S=state.strategyV11||(state.strategyV11={tab:'overview',period:'FY 2026',scope:'Enterprise',layer:null,filter:'all'});\n" +
  "/* patched:strategy-live-arrays */\n" +
  "// Bridge readers for this layer. `kind` is the layer's own vocabulary; the scope name it\n" +
  "// maps to is the backend's. `initiatives` deliberately has no scope - nothing models a\n" +
  "// strategic initiative - so it reports \"not loaded\" and every initiative surface renders\n" +
  "// its own not-tracked note rather than an empty list that looks like a real zero.\n" +
  "function __v11Rows(kind){if(kind==='initiatives')return null;return __perfScope(kind==='objectives'?'goals':kind)}\n" +
  "function __v11Loaded(kind){return __v11Rows(kind)!==null}\n" +
  "function __v11Build(kind){\n" +
  " const rows=__v11Rows(kind);if(!rows)return [];\n" +
  " if(kind==='themes')return rows.map(function(x){return {id:x.id,name:x.name||__perfDash(),perspective:__perfDash(),sponsor:__perfDash(),score:null,status:__perfLabel(x.status),objectives:null,initiatives:null,risks:null,purpose:x.description||'No theme description has been recorded.'}});\n" +
  " if(kind==='objectives')return rows.map(function(x){return {id:x.id,name:x.name||__perfDash(),theme:null,owner:__perfDash(),score:null,target:null,status:__perfLabel(x.status),initiatives:null,evidence:null,review:__perfDash()}});\n" +
  " if(kind==='risks')return rows.map(function(x){return {id:x.id,name:x.name||__perfDash(),theme:null,score:null,level:__perfLabel(x.status),owner:__perfDash(),movement:__perfDash(),mitigation:x.description||'No mitigation has been recorded.'}});\n" +
  " return [];\n" +
  "}\n" +
  "// Rebuilt on every property read. The arrays below are const and evaluated once, at layer\n" +
  "// load, which is BEFORE the host's fetch resolves - a plain assignment would capture an\n" +
  "// empty bridge permanently. Only a get trap is needed: `.map`/`.filter`/`.find`/`.slice`\n" +
  "// are bound to the freshly built array, so iteration never touches the proxy.\n" +
  "function __v11Proxy(kind){return new Proxy([],{get:function(_,k){const a=__v11Build(kind);const v=a[k];return typeof v==='function'?v.bind(a):v}})}\n" +
  "function __v11Note(msg){return '<p class=\"tiny\" style=\"margin:0;color:var(--muted,#6b7280)\">'+msg+'</p>'}\n" +
  "// Distinguishes \"nothing created yet\" from \"could not load\", because those are different\n" +
  "// facts and a user can act on only one of them.\n" +
  "function __v11Empty(kind,noun){return __v11Note(__v11Loaded(kind)?('No '+noun+' have been created yet.'):('Unavailable \\u2014 '+noun+' could not be loaded.'))}\n" +
  "// The one genuinely computable signal on this page: how many departments have at least one\n" +
  "// goal linked, out of the departments the comparison endpoint returns. Real numerator, real\n" +
  "// denominator, real zero.\n" +
  "function __v11Align(){const rows=__perfScope('deptComparison');if(rows===null)return {ok:false,pct:null,aligned:0,total:0};if(rows.length===0)return {ok:true,pct:null,aligned:0,total:0};const aligned=rows.filter(function(d){return (d.goalsTotal||0)>0}).length;return {ok:true,pct:Math.round(aligned/rows.length*100),aligned:aligned,total:rows.length}}"

const DEAD_ARRAY_NOTE =
  "\n// The array below is the original fixture. It is no longer referenced by anything; it is\n" +
  "// left in place so the removal stays auditable in the diff. Do not re-wire it.\n"

const THEMES_FIXTURE_FIND =
  "const themes=[\n {id:'T1',name:'Sustainable Growth & Returns',perspective:'Financial',"
const THEMES_FIXTURE_REPL =
  "const themes=__v11Proxy('themes');\n/* patched:strategy-themes-fixture */" +
  DEAD_ARRAY_NOTE +
  "const __v11DeadThemes=[\n {id:'T1',name:'Sustainable Growth & Returns',perspective:'Financial',"

const OBJECTIVES_FIXTURE_FIND =
  "const objectives=[\n {id:'OBJ-01',theme:'T1',name:'Accelerate recurring revenue growth',"
const OBJECTIVES_FIXTURE_REPL =
  "const objectives=__v11Proxy('objectives');\n/* patched:strategy-objectives-fixture */" +
  DEAD_ARRAY_NOTE +
  "const __v11DeadObjectives=[\n {id:'OBJ-01',theme:'T1',name:'Accelerate recurring revenue growth',"

const INITIATIVES_FIXTURE_FIND =
  "const initiatives=[\n {id:'INIT-01',name:'Southern Africa Expansion',theme:'T1',"
const INITIATIVES_FIXTURE_REPL =
  "const initiatives=__v11Proxy('initiatives');\n/* patched:strategy-initiatives-fixture */" +
  DEAD_ARRAY_NOTE +
  "const __v11DeadInitiatives=[\n {id:'INIT-01',name:'Southern Africa Expansion',theme:'T1',"

const RISKS_FIXTURE_FIND =
  "const risks=[\n {id:'RSK-01',name:'Pipeline conversion below growth plan',theme:'T1',"
const RISKS_FIXTURE_REPL =
  "const risks=__v11Proxy('risks');\n/* patched:strategy-risks-fixture */" +
  DEAD_ARRAY_NOTE +
  "const __v11DeadRisks=[\n {id:'RSK-01',name:'Pipeline conversion below growth plan',theme:'T1',"

/* =========================================================================================
 * 1b. The two page filters.
 *
 * The period select offered "FY 2026" and "FY 2027" and the scope select offered
 * "Enterprise", "Investment Division" and "Corporate Services". No strategy cycle exists
 * (`performance_strategies` is empty and the pillar config returns periodStart/periodEnd
 * null), and neither "Investment Division" nor "Corporate Services" is a department — the
 * real nine are Finance, Sales, Operations, Procurement and so on. So the page's own header,
 * "COMPANY STRATEGY · FY 2026 · ENTERPRISE", named a fiscal year and a business unit that do
 * not exist in the system.
 *
 * Both option lists now come from real data. Note that these controls are inert either way:
 * nothing in the layer reads `S.period` or `S.scope` except this header, so they relabel and
 * filter nothing. That is a functional gap, reported rather than silently "fixed" here.
 * ======================================================================================= */

const FILTER_HELPERS_FIND =
  "const esc11=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#039;'}[m]));"

const FILTER_HELPERS_REPL =
  "const esc11=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#039;'}[m]));\n" +
  "/* patched:strategy-filter-helpers */\n" +
  "// Strategy cycles come from `GET /performance/config/strategies`; there are none today, so\n" +
  "// the control says so instead of naming a fiscal year nothing recorded.\n" +
  "function __v11Cycles(){return __perfScope('strategies')||[]}\n" +
  "function __v11PeriodLabel(){const c=__v11Cycles();if(!c.length)return 'No strategy cycle configured';const hit=c.filter(function(x){return x.name===S.period})[0];return hit?hit.name:c[0].name}\n" +
  "function __v11ScopeOptions(){const d=__perfScope('departments');return ['Enterprise'].concat((d||[]).map(function(x){return x.name}))}\n" +
  "function __v11ScopeLabel(){const o=__v11ScopeOptions();return o.indexOf(S.scope)>=0?S.scope:'Enterprise'}\n" +
  "function __v11Option(v,sel){return '<option '+(v===sel?'selected':'')+'>'+esc11(v)+'</option>'}"

const NAV_FILTERS_FIND =
  "<div class=\"right\"><select data-v11-strategy-change=\"period\"><option ${S.period==='FY 2026'?'selected':''}>FY 2026</option><option ${S.period==='FY 2027'?'selected':''}>FY 2027</option></select><select data-v11-strategy-change=\"scope\"><option ${S.scope==='Enterprise'?'selected':''}>Enterprise</option><option ${S.scope==='Investment Division'?'selected':''}>Investment Division</option><option ${S.scope==='Corporate Services'?'selected':''}>Corporate Services</option></select></div>"

const NAV_FILTERS_REPL =
  "<div class=\"right\"><select data-v11-strategy-change=\"period\">${/* patched:strategy-nav-filters */(function(){const c=__v11Cycles();return c.length?c.map(function(x){return __v11Option(x.name,S.period)}).join(''):'<option>No strategy cycle configured</option>'})()}</select>" +
  "<select data-v11-strategy-change=\"scope\">${__v11ScopeOptions().map(function(v){return __v11Option(v,__v11ScopeLabel())}).join('')}</select></div>"

const KICKER_FIND =
  "<span class=\"v11-strategy-kicker\">Company strategy · ${S.period} · ${S.scope}</span>"

const KICKER_REPL =
  "<span class=\"v11-strategy-kicker\">${/* patched:strategy-kicker */'Company strategy · '+__v11PeriodLabel()+' · '+__v11ScopeLabel()}</span>"

/* =========================================================================================
 * 2. Hero — shown above EVERY tab, so this is the single highest-traffic block on the page.
 * ======================================================================================= */

const HERO_FIND =
  "<div class=\"v11-strategy-hero-foot\"><span>Strategy owner<strong>Executive Committee</strong></span><span>Current version<strong>v3.0 · Approved</strong></span><span>Next formal review<strong>20 Aug 2026</strong></span><span>Evidence freshness<strong>8 min</strong></span></div></section><aside class=\"v11-strategy-hero-side\"><article class=\"v11-strategy-signal\"><header><span>Strategic alignment</span>${status('On Track')}</header><strong>86.4%</strong><p>12 of 12 departments aligned to approved enterprise objectives.</p><div class=\"tiny-line\"><i style=\"width:86.4%\"></i></div></article><article class=\"v11-strategy-signal\"><header><span>Portfolio confidence</span>${status('Watch')}</header><strong>82%</strong><p>Two strategic initiatives and three objectives need executive attention.</p><div class=\"tiny-line\"><i style=\"width:82%\"></i></div></article></aside>"

// The status pills stay em dashes rather than being banded off the alignment figure: there is
// no approved RAG threshold configured anywhere, so "On Track" would be an invented judgement
// even when the percentage under it is real.
const HERO_REPL =
  "<div class=\"v11-strategy-hero-foot\"><span>Strategy owner<strong>${/* patched:strategy-hero */__perfDash()}</strong></span><span>Current version<strong>${__perfDash()}</strong></span><span>Next formal review<strong>${__perfDash()}</strong></span><span>Evidence freshness<strong>${__perfDash()}</strong></span></div></section>" +
  "<aside class=\"v11-strategy-hero-side\">" +
  "<article class=\"v11-strategy-signal\"><header><span>Strategic alignment</span>${status(__perfDash())}</header>" +
  "<strong>${(function(){const a=__v11Align();return a.pct==null?__perfDash():a.pct+'%'})()}</strong>" +
  "<p>${(function(){const a=__v11Align();if(!a.ok)return 'Department comparison could not be loaded.';if(!a.total)return 'The comparison endpoint returned no departments.';return a.aligned+' of '+a.total+' departments have at least one goal linked to an enterprise objective.'})()}</p>" +
  "<div class=\"tiny-line\"><i style=\"width:${(function(){const a=__v11Align();return a.pct==null?0:a.pct})()}%\"></i></div></article>" +
  "<article class=\"v11-strategy-signal\"><header><span>Portfolio confidence</span>${status(__perfDash())}</header>" +
  "<strong>${__perfDash()}</strong>" +
  "<p>Nothing records initiative or objective delivery confidence yet, so portfolio confidence cannot be calculated.</p>" +
  "<div class=\"tiny-line\"><i style=\"width:0%\"></i></div></article></aside>"

/* =========================================================================================
 * 3. Executive Overview tab.
 * ======================================================================================= */

const OVERVIEW_KPIS_FIND =
  "${kpi('Themes','4','All active','strategy','up','strategy')}${kpi('Objectives','16','11 on track','target','up','strategy')}${kpi('Strategic initiatives','9','2 at risk','tasks','down','strategy')}${kpi('Strategic risks','6','2 high exposure','alerts','down','strategy')}${kpi('Evidence coverage','96%','3 exceptions','shield','up','strategy')}${kpi('Decision readiness','91%','4 items in queue','check','up','strategy')}"

const OVERVIEW_KPIS_REPL =
  "${/* patched:strategy-overview-kpis */kpi('Themes',__perfCount('themes'),__v11Loaded('themes')?(themes.length?'In the strategy configuration':'None created yet'):'Unavailable','strategy','up','strategy')}" +
  "${kpi('Objectives',__perfCount('goals'),__v11Loaded('objectives')?(objectives.length?'In the goal register':'None created yet'):'Unavailable','target','up','strategy')}" +
  // No table, no endpoint and no scope models a strategic initiative, so this cannot even
  // report a real zero - a zero would claim the register is empty rather than absent.
  "${kpi('Strategic initiatives',__perfDash(),'Not yet tracked','tasks','down','strategy')}" +
  "${kpi('Strategic risks',__perfCount('risks'),__v11Loaded('risks')?(risks.length?'In the risk register':'None created yet'):'Unavailable','alerts','down','strategy')}" +
  "${kpi('Evidence coverage',__perfDash(),'Not yet tracked','shield','up','strategy')}" +
  "${kpi('Decision readiness',__perfDash(),'Not yet tracked','check','up','strategy')}"

// `pulse()` drew three hardcoded 7-point series and hardcoded the "Forecast 88%" label into
// the SVG. An early return keeps the anchor to one line instead of restating the whole
// 1.1 KB chart, and the dead body stays visible for whoever wires the real series later.
// It is called from the overview AND from two `layerView` panels, so one patch covers three
// fabricated charts.
const PULSE_FIND =
  "function pulse(){const a=[66,69,71,74,78,82,86],t=[70,72,74,77,80,83,86],f=[66,69,71,74,78,82,88],"
const PULSE_REPL =
  "function pulse(){/* patched:strategy-pulse */return __perfNoSeries('No strategy score is recorded for any period yet, so there is no actual, target or forecast trajectory to draw.');" +
  "const a=[66,69,71,74,78,82,86],t=[70,72,74,77,80,83,86],f=[66,69,71,74,78,82,88],"

const ATTENTION_FIND =
  "${insight('alerts','Reduce process backlog','Operational Excellence · objective OBJ-09','High','open','objective:OBJ-09')}${insight('users','Stabilise enterprise retention','Stakeholder Trust · objective OBJ-05','Watch','open','objective:OBJ-05')}${insight('chart','Confirm operating-model design','Initiative INIT-06 · decision required','19 Aug','open','initiative:INIT-06')}${insight('shield','Approve digital recovery evidence','Initiative INIT-04 · evidence exception','Pending','open','initiative:INIT-04')}"

const ATTENTION_REPL =
  "${/* patched:strategy-attention */__v11Note('Objectives and initiatives are not scored or ranked by materiality yet, so no executive attention queue can be assembled.')}"

const OVERVIEW_THEMES_FIND =
  "${themes.map(t=>insight('strategy',t.name,`${t.objectives} objectives · sponsor ${t.sponsor}`,`${t.score}%`,'open',`theme:${t.id}`)).join('')}"

const OVERVIEW_THEMES_REPL =
  "${/* patched:strategy-overview-themes */themes.length?themes.map(t=>insight('strategy',t.name,'Objectives '+__perfDash()+' · sponsor '+t.sponsor,__perfDash(),'open','theme:'+t.id)).join(''):__v11Empty('themes','strategic themes')}"

const OVERVIEW_INITIATIVES_FIND =
  "${initiatives.slice(0,4).map(i=>insight('tasks',i.name,`${themeName(i.theme)} · ${i.owner}`,`${i.progress}%`,'open',`initiative:${i.id}`)).join('')}"

const OVERVIEW_INITIATIVES_REPL =
  "${/* patched:strategy-overview-initiatives */__v11Note('Strategic initiatives are not stored anywhere yet, so this portfolio cannot be listed.')}"

const OVERVIEW_QUEUE_FIND =
  "${insight('calendar','Monthly strategy review','Executive Committee · enterprise scorecard','20 Aug','review')}${insight('check','Operating model decision','Approve target-state design and sequence','19 Aug','open','initiative:INIT-06')}${insight('history','FY2027 assumption refresh','Market, capital and capability assumptions','28 Aug','assumption')}${insight('file','Board strategy pack','Publication and controlled distribution','31 Aug','review')}"

const OVERVIEW_QUEUE_REPL =
  "${/* patched:strategy-overview-queue */__v11Note('Strategy reviews and executive decisions are not recorded yet, so the decision queue is empty.')}"

/* =========================================================================================
 * 4. Strategic Themes tab.
 * ======================================================================================= */

const THEME_CARDS_FIND =
  "${themes.map(t=>`<article class=\"v11-theme-card\" style=\"--theme:${themeColor[t.id]}\" data-v11-strategy-action=\"open\" data-id=\"theme:${t.id}\"><header><div><span class=\"theme-code\">${t.id} · ${t.perspective}</span><h3>${t.name}</h3></div>${status(t.status)}</header><p>${t.purpose}</p><div class=\"v11-theme-stats\"><div><span>Score</span><strong>${t.score}%</strong></div><div><span>Objectives</span><strong>${t.objectives}</strong></div><div><span>Initiatives</span><strong>${t.initiatives}</strong></div><div><span>Risks</span><strong>${t.risks}</strong></div></div><footer><span>Executive sponsor · ${t.sponsor}</span><span>Open theme →</span></footer></article>`).join('')}"

// `themeColor` is keyed T1..T4; live theme ids are uuids, so the lookup is undefined and the
// card would render `--theme:undefined`. Falls back to the layer's own first accent.
const THEME_CARDS_REPL =
  "${/* patched:strategy-theme-cards */themes.length?themes.map(t=>`<article class=\"v11-theme-card\" style=\"--theme:${themeColor[t.id]||'#2764ff'}\" data-v11-strategy-action=\"open\" data-id=\"theme:${t.id}\"><header><div><span class=\"theme-code\">${t.perspective}</span><h3>${t.name}</h3></div>${status(t.status)}</header><p>${t.purpose}</p><div class=\"v11-theme-stats\"><div><span>Score</span><strong>${__perfDash()}</strong></div><div><span>Objectives</span><strong>${__perfDash()}</strong></div><div><span>Initiatives</span><strong>${__perfDash()}</strong></div><div><span>Risks</span><strong>${__perfDash()}</strong></div></div><footer><span>Executive sponsor · ${t.sponsor}</span><span>Open theme →</span></footer></article>`).join(''):__v11Empty('themes','strategic themes')}"

/* =========================================================================================
 * 5. Strategy Map tab.
 * ======================================================================================= */

const MAP_ROWS_FIND =
  "${themes.map(t=>`<div class=\"v11-map-row\"><div class=\"v11-map-label\"><span>${t.perspective}</span><strong>${t.name}</strong></div><div class=\"v11-map-nodes\">${byTheme(t.id).map(o=>`<article class=\"v11-map-node\" data-v11-strategy-action=\"open\" data-id=\"objective:${o.id}\"><strong>${o.name}</strong><span>${o.owner}</span><footer><span>${o.score}%</span>${status(o.status)}</footer></article>`).join('')}</div></div>`).join('')}"

// `byTheme(t.id)` filters objectives by `o.theme`, and goals carry no theme FK, so every row
// is empty by construction. The row still renders (the map is the point of the tab) with an
// explicit note in the node track rather than a silently blank lane.
const MAP_ROWS_REPL =
  "${/* patched:strategy-map-rows */themes.length?themes.map(t=>`<div class=\"v11-map-row\"><div class=\"v11-map-label\"><span>${t.perspective}</span><strong>${t.name}</strong></div><div class=\"v11-map-nodes\">${byTheme(t.id).map(o=>`<article class=\"v11-map-node\" data-v11-strategy-action=\"open\" data-id=\"objective:${o.id}\"><strong>${o.name}</strong><span>${o.owner}</span><footer><span>${__perfDash()}</span>${status(o.status)}</footer></article>`).join('')||__v11Note('No objective is linked to this theme.')}</div></div>`).join(''):__v11Empty('themes','strategic themes')}"

const MAP_ASSUMPTIONS_FIND =
  "${insight('link','Leadership capacity → execution quality','Capability improvements should reduce delivery variance by Q4.','Validated','assumption')}${insight('link','Process automation → client experience','Faster cycle time should improve SLA compliance and retention.','Monitor','assumption')}${insight('link','Market expansion → recurring revenue','Pipeline quality and partner execution are primary leading indicators.','Validated','assumption')}"

const MAP_ASSUMPTIONS_REPL =
  "${/* patched:strategy-map-assumptions */__v11Note('Cause-and-effect assumptions are not captured anywhere yet, so none can be listed or validated.')}"

const MAP_ALIGNMENT_FIND =
  "${bar('Department objectives linked',97)}${bar('Individual goals linked',94)}${bar('Strategic initiatives linked',100)}${bar('Current evidence coverage',96)}"

// The first gauge is genuinely computable from `deptComparison`; the other three are not
// (no individual-goal linkage on the comparison payload beyond raw counts, no initiative
// model, no evidence model), so they say so rather than showing a bar.
const MAP_ALIGNMENT_REPL =
  "${/* patched:strategy-map-alignment */(function(){const a=__v11Align();return a.pct==null?__v11Note('Department comparison is unavailable, so cascade integrity cannot be measured.'):bar('Departments with a linked goal',a.pct)})()}" +
  "${__v11Note('Individual-goal linkage, strategic-initiative linkage and evidence coverage are not modelled yet, so they cannot be measured.')}"

/* =========================================================================================
 * 6. Objective Portfolio tab.
 * ======================================================================================= */

const OBJECTIVE_ROWS_FIND =
  "${objectives.map(o=>`<tr data-v11-strategy-action=\"open\" data-id=\"objective:${o.id}\"><td class=\"name\"><strong>${o.name}</strong><span>${o.id}</span></td><td>${themeName(o.theme)}</td><td>${o.owner}</td><td><strong>${o.score}%</strong></td><td>${o.target}%</td><td>${status(o.status)}</td><td>${o.initiatives}</td><td>${o.evidence}%</td><td>${o.review}</td></tr>`).join('')}"

const OBJECTIVE_ROWS_REPL =
  "${/* patched:strategy-objective-rows */objectives.length?objectives.map(o=>`<tr data-v11-strategy-action=\"open\" data-id=\"objective:${o.id}\"><td class=\"name\"><strong>${o.name}</strong><span>${o.id}</span></td><td>${__perfDash()}</td><td>${o.owner}</td><td><strong>${__perfDash()}</strong></td><td>${__perfDash()}</td><td>${status(o.status)}</td><td>${__perfDash()}</td><td>${__perfDash()}</td><td>${o.review}</td></tr>`).join(''):__perfEmptyRow('goals',9,'objectives')}"

/* =========================================================================================
 * 7. Strategic Initiatives tab — nothing models an initiative, so the whole grid is a note.
 * ======================================================================================= */

const INITIATIVE_CARDS_FIND =
  "${initiatives.map(i=>`<article class=\"v11-initiative\" data-v11-strategy-action=\"open\" data-id=\"initiative:${i.id}\"><header><span>${i.id} · ${themeName(i.theme)}</span>${status(i.status)}</header><h4>${i.name}</h4><p>${i.owner} · next milestone ${i.milestone}</p><div class=\"metric\"><div><span>Progress</span><strong>${i.progress}%</strong></div>${progress(i.progress,i.progress<60?'amber':'emerald')}<div style=\"margin-top:8px\"><span>Delivery confidence</span><strong>${i.confidence}%</strong></div>${progress(i.confidence,i.confidence<75?'amber':'emerald')}</div><footer><span>${i.date}</span><span>Open workspace →</span></footer></article>`).join('')}"

const INITIATIVE_CARDS_REPL =
  "${/* patched:strategy-initiative-cards */__v11Note('There is no strategic-initiative table or endpoint yet, so no initiative portfolio can be shown. Creating one needs a backend model carrying owner, theme, status, progress, delivery confidence and milestone.')}"

/* =========================================================================================
 * 8. Risks & Assumptions tab.
 * ======================================================================================= */

const RISK_CARDS_FIND =
  "${risks.map(r=>`<article class=\"v11-risk ${r.level==='High'?'high':''}\" data-v11-strategy-action=\"open\" data-id=\"risk:${r.id}\"><div class=\"score\">${r.score}</div><div><strong>${r.name}</strong><span>${themeName(r.theme)} · ${r.owner}</span><span>${r.mitigation}</span></div><b>${r.movement}</b></article>`).join('')}"

const RISK_CARDS_REPL =
  "${/* patched:strategy-risk-cards */risks.length?risks.map(r=>`<article class=\"v11-risk\" data-v11-strategy-action=\"open\" data-id=\"risk:${r.id}\"><div class=\"score\">${__perfDash()}</div><div><strong>${r.name}</strong><span>${r.owner}</span><span>${r.mitigation}</span></div><b>${r.movement}</b></article>`).join(''):__v11Empty('risks','risk assessments')}"

const RISK_ASSUMPTIONS_FIND =
  "${insight('chart','Market growth remains resilient','Base case: 8–10% enterprise demand growth.','Medium','assumption')}${insight('users','Leadership capacity available','Critical-role coverage maintained above 90%.','High','assumption')}${insight('link','Digital infrastructure scales','Platform performance supports adoption targets.','Watch','assumption')}${insight('shield','Regulatory environment remains stable','No material change to target investment strategy.','High','assumption')}"

const RISK_ASSUMPTIONS_REPL =
  "${/* patched:strategy-risk-assumptions */__v11Note('Strategic assumptions are not recorded anywhere yet, so none can be listed or rated.')}"

const DEPENDENCIES_FIND =
  "${[['Technology','CRM and analytics reliability','ICT · due 18 Aug'],['People','Critical skill coverage','People & Culture · 91%'],['Governance','ExCo operating-model approval','Decision due 19 Aug'],['Data','Portfolio source reconciliation','Finance · validated'],['Capacity','Operations relief plan','COO · in progress'],['Market','Partner access agreements','Commercial · 3 pending']].map(x=>`<div class=\"v11-dependency\" data-v11-strategy-action=\"assumption\"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('')}"

const DEPENDENCIES_REPL =
  "${/* patched:strategy-dependencies */__v11Note('Cross-functional dependencies are not tracked yet, so none can be listed.')}"

const SCENARIO_FIND =
  "${bar('Base-case confidence',82)}${bar('Downside resilience',74)}${bar('Response-plan readiness',88)}${bar('Decision evidence',91)}"

const SCENARIO_REPL =
  "${/* patched:strategy-scenario */__v11Note('No scenario or sensitivity model exists yet, so base-case, downside and response readiness cannot be scored.')}"

/* =========================================================================================
 * 9. Reviews & Decisions tab.
 * ======================================================================================= */

const REVIEW_TIMELINE_FIND =
  "${[['12 Aug','Data cut & evidence validation','Data stewards and KPI owners','Complete'],['15 Aug','Department strategy check-ins','Business unit leaders','In progress'],['20 Aug','Monthly Executive Strategy Review','Executive Committee','Scheduled'],['24 Aug','Initiative portfolio decision gate','Executive sponsors','Scheduled'],['28 Aug','FY2027 assumptions refresh','Strategy Office + Finance','Planned'],['31 Aug','Board strategy pack publication','Company Secretariat','Planned']].map((x,i)=>`<div class=\"v11-review-event\"><time>${x[0]}</time><i></i><div><strong>${x[1]}</strong><span>${x[2]}</span></div><b>${x[3]}</b></div>`).join('')}"

const REVIEW_TIMELINE_REPL =
  "${/* patched:strategy-review-timeline */__v11Note('No strategy review cadence is configured yet, so there are no scheduled events to show.')}"

const DECISION_QUEUE_FIND =
  "${insight('check','Approve operating model target state','Sequencing, capacity and automation scope.','19 Aug','open','initiative:INIT-06')}${insight('alerts','Digital adoption recovery escalation','Confirm funding and infrastructure priority.','20 Aug','open','initiative:INIT-04')}${insight('target','Client retention intervention','Approve account cohort executive sponsorship.','20 Aug','open','objective:OBJ-05')}${insight('history','FY2027 strategy assumptions','Review base, upside and downside cases.','28 Aug','scenario')}"

const DECISION_QUEUE_REPL =
  "${/* patched:strategy-decision-queue */__v11Note('Executive decisions are not recorded yet, so nothing is queued for judgement.')}"

const DECISION_LOG_FIND =
  "${[['08 Aug','Increase process automation priority','COO / CIO','Approved'],['31 Jul','Lock Q3 scorecard weights','Executive Committee','Implemented'],['25 Jul','Approve Southern Africa market expansion','CEO / Commercial','In execution'],['18 Jul','Revise digital adoption threshold','CIO / HR&M&E','Implemented']].map(x=>`<div class=\"v11-decision\"><time>${x[0]}</time><strong>${x[1]}</strong><span>${x[2]} · ${x[3]}</span></div>`).join('')}"

const DECISION_LOG_REPL =
  "${/* patched:strategy-decision-log */__v11Note('The strategy decision log is described as immutable, but nothing writes to it yet - there is no decision table, so no decisions can be shown.')}"

/* =========================================================================================
 * 10. Drill-down (`layerView`).
 *
 * Reached only by clicking a theme / objective / initiative / risk, so with the registers
 * empty it is unreachable today. It becomes reachable the moment a user creates the first
 * theme or goal, and every panel in it interpolates a metric that does not exist, so the
 * guard alone is not enough: the KPI strips and gauges are patched too.
 * ======================================================================================= */

const LAYER_GUARD_FIND = "function layerView(){const [type,id]=String(S.layer||'').split(':');"

// Without this, `themes.find(...)||themes[0]` is undefined on an empty register and the whole
// page throws on `t.name`. Returning to the overview is the only correct answer when the
// record behind the drill-down does not exist.
const LAYER_GUARD_REPL =
  "function layerView(){/* patched:strategy-layer-guard */const [type,id]=String(S.layer||'').split(':');" +
  "const __pool=type==='theme'?themes:type==='objective'?objectives:type==='initiative'?initiatives:type==='risk'?risks:[];" +
  "if(!__pool.some(function(x){return x.id===id})){S.layer=null;return overview()}"

/* Follow-up to the guard above, verified in the browser: `strategy()` decides between the
   layer shell and the tabbed shell BEFORE calling layerView(), so clearing `S.layer` inside
   the guard drops the user on the overview with no tab bar until the next render. Returning
   `nav()` alongside it puts the tabs back immediately.

   Deliberately a second patch rather than an edit to the first: `strategy-layer-guard` has
   already landed in the runtime and a guarded patch is skipped once its marker is present, so
   changing its `repl` would leave the file claiming something the runtime does not do. This
   ordering is correct either way round — on a fresh runtime the guard applies first and this
   one then upgrades its output. */
const LAYER_GUARD2_FIND = "{S.layer=null;return overview()}"
const LAYER_GUARD2_REPL = "{/* patched:strategy-layer-guard-2 */S.layer=null;return nav()+overview()}"

const LAYER_THEME_KPIS_FIND =
  "${[['Theme score',t.score+'%','Weighted contribution'],['Objectives',String(os.length),`${os.filter(o=>o.status==='On Track').length} on track`],['Initiatives',String(ins.length),`${ins.filter(i=>i.status==='At Risk').length} at risk`],['Strategic risks',String(rs.length),`${rs.filter(r=>r.level==='High').length} high`],['Evidence','96%','Governed sources']]"

// Objective / initiative / risk counts per theme are all zero for a structural reason - there
// is no theme FK on any of them - so they read as untracked rather than as a measured zero.
const LAYER_THEME_KPIS_REPL =
  "${/* patched:strategy-layer-theme-kpis */[['Theme score',__perfDash(),'Not yet tracked'],['Objectives',__perfDash(),'No theme linkage yet'],['Initiatives',__perfDash(),'Not yet tracked'],['Strategic risks',__perfDash(),'No theme linkage yet'],['Evidence',__perfDash(),'Not yet tracked']]"

const LAYER_THEME_OBJECTIVES_FIND =
  "${os.map(o=>insight('target',o.name,`${o.owner} · target ${o.target}%`,`${o.score}%`,'open',`objective:${o.id}`)).join('')}"
const LAYER_THEME_OBJECTIVES_REPL =
  "${/* patched:strategy-layer-theme-objectives */__v11Note('Goals carry no theme linkage yet, so no objective can be attributed to this theme.')}"

// The `ins.map(...)` expression is byte-identical in the theme layer and in the objective
// layer's "Linked strategic work" panel, so the heading has to come along or the patcher
// (correctly) refuses it as ambiguous.
const LAYER_THEME_INITIATIVES_FIND =
  "<h3>Strategic initiatives</h3></div></div><div class=\"v11-st-body v11-strategy-insight-list\">${ins.map(i=>insight('tasks',i.name,`${i.owner} · ${i.milestone}`,`${i.progress}%`,'open',`initiative:${i.id}`)).join('')}"
const LAYER_THEME_INITIATIVES_REPL =
  "<h3>Strategic initiatives</h3></div></div><div class=\"v11-st-body v11-strategy-insight-list\">${/* patched:strategy-layer-theme-initiatives */__v11Note('Strategic initiatives are not stored anywhere yet.')}"

const LAYER_THEME_RISKS_FIND =
  "${rs.map(r=>insight('alerts',r.name,r.mitigation,`${r.score}`,'open',`risk:${r.id}`)).join('')||insight('shield','No high material risk','Theme remains within approved risk appetite.','Healthy','assumption')}"
// The fallback asserted the theme is "within approved risk appetite" whenever the filtered
// list was empty - which it always is, because risks carry no theme. That is an assurance
// claim made out of a missing join.
const LAYER_THEME_RISKS_REPL =
  "${/* patched:strategy-layer-theme-risks */__v11Note('Risk assessments carry no theme linkage yet, so no risk can be attributed to this theme.')}"

const LAYER_OBJECTIVE_KPIS_FIND =
  "${[['Current',o.score+'%','Weighted achievement'],['Target',o.target+'%','Approved target'],['Forecast',Math.min(96,o.score+4)+'%','Current trajectory'],['Evidence',o.evidence+'%','Verified coverage'],['Initiatives',String(o.initiatives),'Linked delivery']]"
// "Forecast" was `score + 4` capped at 96 - a forecast invented by adding four to a number
// that was itself invented.
const LAYER_OBJECTIVE_KPIS_REPL =
  "${/* patched:strategy-layer-objective-kpis */[['Current',__perfDash(),'Not yet tracked'],['Target',__perfDash(),'Not yet tracked'],['Forecast',__perfDash(),'Not yet tracked'],['Evidence',__perfDash(),'Not yet tracked'],['Initiatives',__perfDash(),'Not yet tracked']]"

const LAYER_OBJECTIVE_BARS_FIND =
  "${bar('Primary KPI achievement',Math.max(60,o.score))}${bar('Delivery milestone completion',Math.max(55,o.score-4))}${bar('Evidence confidence',o.evidence)}${bar('Forecast confidence',Math.min(96,o.score+7))}"
const LAYER_OBJECTIVE_BARS_REPL =
  "${/* patched:strategy-layer-objective-bars */__v11Note('Key results are not measured yet, so KPI achievement, milestone completion and evidence confidence cannot be scored.')}"

const LAYER_OBJECTIVE_WORK_FIND =
  "${ins.map(i=>insight('tasks',i.name,`${i.owner} · ${i.milestone}`,`${i.progress}%`,'open',`initiative:${i.id}`)).join('')}</div></section><section class=\"v11-st-card\"><div class=\"v11-st-head\"><div><h3>Dependencies & evidence</h3></div></div>"
const LAYER_OBJECTIVE_WORK_REPL =
  "${/* patched:strategy-layer-objective-work */__v11Note('Strategic initiatives are not stored anywhere yet, so no linked work can be shown.')}</div></section><section class=\"v11-st-card\"><div class=\"v11-st-head\"><div><h3>Dependencies & evidence</h3></div></div>"

const LAYER_OBJECTIVE_DEPS_FIND =
  "${[['Evidence','Latest source snapshot','Validated 8 min ago'],['Dependency','Cross-functional delivery','2 active dependencies'],['Decision','Executive review','Next gate '+o.review]].map(x=>`<div class=\"v11-dependency\" data-v11-strategy-action=\"assumption\"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('')}"
const LAYER_OBJECTIVE_DEPS_REPL =
  "${/* patched:strategy-layer-objective-deps */__v11Note('No evidence snapshot, dependency register or decision gate is recorded against an objective yet.')}"

const LAYER_INITIATIVE_KPIS_FIND =
  "${[['Progress',i.progress+'%','Portfolio completion'],['Confidence',i.confidence+'%','Delivery confidence'],['Milestones','6 / 9','3 remaining'],['Dependencies','4','1 high'],['Evidence','94%','Current']]"
const LAYER_INITIATIVE_KPIS_REPL =
  "${/* patched:strategy-layer-initiative-kpis */[['Progress',__perfDash(),'Not yet tracked'],['Confidence',__perfDash(),'Not yet tracked'],['Milestones',__perfDash(),'Not yet tracked'],['Dependencies',__perfDash(),'Not yet tracked'],['Evidence',__perfDash(),'Not yet tracked']]"

const LAYER_INITIATIVE_BARS_FIND =
  "${bar('Objective contribution',Math.min(94,i.confidence))}${bar('Benefits realization',Math.max(48,i.progress-3))}${bar('Evidence quality',94)}${bar('Executive confidence',i.confidence)}"
const LAYER_INITIATIVE_BARS_REPL =
  "${/* patched:strategy-layer-initiative-bars */__v11Note('Initiative contribution, benefits realisation and evidence quality are not measured anywhere yet.')}"

const LAYER_RISK_KPIS_FIND =
  "${[['Exposure',String(r.score),'Risk score'],['Likelihood','4 / 5','Current assessment'],['Impact','5 / 5','Strategic impact'],['Controls','6 / 7','1 improvement'],['Residual','9','After mitigation']]"
const LAYER_RISK_KPIS_REPL =
  "${/* patched:strategy-layer-risk-kpis */[['Exposure',__perfDash(),'Not yet tracked'],['Likelihood',__perfDash(),'Not yet tracked'],['Impact',__perfDash(),'Not yet tracked'],['Controls',__perfDash(),'Not yet tracked'],['Residual',__perfDash(),'Not yet tracked']]"

const LAYER_RISK_RESPONSE_FIND =
  "${insight('tasks','Action-plan execution','3 active actions · 1 overdue','76%','assumption')}${insight('chart','Residual exposure forecast','Expected after current mitigation','9','scenario')}"
const LAYER_RISK_RESPONSE_REPL =
  "${/* patched:strategy-layer-risk-response */__v11Note('Risk action plans and residual-exposure forecasts are not recorded yet.')}"

const LAYER_RISK_BARS_FIND =
  "${bar('Current theme performance',themes.find(t=>t.id===r.theme)?.score||78)}${bar('Downside scenario',68)}${bar('Mitigation confidence',82)}${bar('Evidence confidence',93)}"
// `?.score || 78` is the sharpest example on the page: when the theme lookup fails - which it
// always does, because risks have no theme - the gauge silently falls back to a literal 78
// and presents it as measured theme performance.
const LAYER_RISK_BARS_REPL =
  "${/* patched:strategy-layer-risk-bars */__v11Note('Theme performance, downside scenarios and mitigation confidence are not scored anywhere yet, so risk sensitivity cannot be shown.')}"

export default [
  { label: "strategy-live-arrays", find: HELPERS_FIND, repl: HELPERS_REPL },
  { label: "strategy-themes-fixture", find: THEMES_FIXTURE_FIND, repl: THEMES_FIXTURE_REPL },
  { label: "strategy-objectives-fixture", find: OBJECTIVES_FIXTURE_FIND, repl: OBJECTIVES_FIXTURE_REPL },
  { label: "strategy-initiatives-fixture", find: INITIATIVES_FIXTURE_FIND, repl: INITIATIVES_FIXTURE_REPL },
  { label: "strategy-risks-fixture", find: RISKS_FIXTURE_FIND, repl: RISKS_FIXTURE_REPL },
  { label: "strategy-filter-helpers", find: FILTER_HELPERS_FIND, repl: FILTER_HELPERS_REPL },
  { label: "strategy-nav-filters", find: NAV_FILTERS_FIND, repl: NAV_FILTERS_REPL },
  { label: "strategy-kicker", find: KICKER_FIND, repl: KICKER_REPL },
  { label: "strategy-hero", find: HERO_FIND, repl: HERO_REPL },
  { label: "strategy-overview-kpis", find: OVERVIEW_KPIS_FIND, repl: OVERVIEW_KPIS_REPL },
  { label: "strategy-pulse", find: PULSE_FIND, repl: PULSE_REPL },
  { label: "strategy-attention", find: ATTENTION_FIND, repl: ATTENTION_REPL },
  { label: "strategy-overview-themes", find: OVERVIEW_THEMES_FIND, repl: OVERVIEW_THEMES_REPL },
  { label: "strategy-overview-initiatives", find: OVERVIEW_INITIATIVES_FIND, repl: OVERVIEW_INITIATIVES_REPL },
  { label: "strategy-overview-queue", find: OVERVIEW_QUEUE_FIND, repl: OVERVIEW_QUEUE_REPL },
  { label: "strategy-theme-cards", find: THEME_CARDS_FIND, repl: THEME_CARDS_REPL },
  { label: "strategy-map-rows", find: MAP_ROWS_FIND, repl: MAP_ROWS_REPL },
  { label: "strategy-map-assumptions", find: MAP_ASSUMPTIONS_FIND, repl: MAP_ASSUMPTIONS_REPL },
  { label: "strategy-map-alignment", find: MAP_ALIGNMENT_FIND, repl: MAP_ALIGNMENT_REPL },
  { label: "strategy-objective-rows", find: OBJECTIVE_ROWS_FIND, repl: OBJECTIVE_ROWS_REPL },
  { label: "strategy-initiative-cards", find: INITIATIVE_CARDS_FIND, repl: INITIATIVE_CARDS_REPL },
  { label: "strategy-risk-cards", find: RISK_CARDS_FIND, repl: RISK_CARDS_REPL },
  { label: "strategy-risk-assumptions", find: RISK_ASSUMPTIONS_FIND, repl: RISK_ASSUMPTIONS_REPL },
  { label: "strategy-dependencies", find: DEPENDENCIES_FIND, repl: DEPENDENCIES_REPL },
  { label: "strategy-scenario", find: SCENARIO_FIND, repl: SCENARIO_REPL },
  { label: "strategy-review-timeline", find: REVIEW_TIMELINE_FIND, repl: REVIEW_TIMELINE_REPL },
  { label: "strategy-decision-queue", find: DECISION_QUEUE_FIND, repl: DECISION_QUEUE_REPL },
  { label: "strategy-decision-log", find: DECISION_LOG_FIND, repl: DECISION_LOG_REPL },
  { label: "strategy-layer-guard", find: LAYER_GUARD_FIND, repl: LAYER_GUARD_REPL },
  { label: "strategy-layer-guard-2", find: LAYER_GUARD2_FIND, repl: LAYER_GUARD2_REPL },
  { label: "strategy-layer-theme-kpis", find: LAYER_THEME_KPIS_FIND, repl: LAYER_THEME_KPIS_REPL },
  { label: "strategy-layer-theme-objectives", find: LAYER_THEME_OBJECTIVES_FIND, repl: LAYER_THEME_OBJECTIVES_REPL },
  { label: "strategy-layer-theme-initiatives", find: LAYER_THEME_INITIATIVES_FIND, repl: LAYER_THEME_INITIATIVES_REPL },
  { label: "strategy-layer-theme-risks", find: LAYER_THEME_RISKS_FIND, repl: LAYER_THEME_RISKS_REPL },
  { label: "strategy-layer-objective-kpis", find: LAYER_OBJECTIVE_KPIS_FIND, repl: LAYER_OBJECTIVE_KPIS_REPL },
  { label: "strategy-layer-objective-bars", find: LAYER_OBJECTIVE_BARS_FIND, repl: LAYER_OBJECTIVE_BARS_REPL },
  { label: "strategy-layer-objective-work", find: LAYER_OBJECTIVE_WORK_FIND, repl: LAYER_OBJECTIVE_WORK_REPL },
  { label: "strategy-layer-objective-deps", find: LAYER_OBJECTIVE_DEPS_FIND, repl: LAYER_OBJECTIVE_DEPS_REPL },
  { label: "strategy-layer-initiative-kpis", find: LAYER_INITIATIVE_KPIS_FIND, repl: LAYER_INITIATIVE_KPIS_REPL },
  { label: "strategy-layer-initiative-bars", find: LAYER_INITIATIVE_BARS_FIND, repl: LAYER_INITIATIVE_BARS_REPL },
  { label: "strategy-layer-risk-kpis", find: LAYER_RISK_KPIS_FIND, repl: LAYER_RISK_KPIS_REPL },
  { label: "strategy-layer-risk-response", find: LAYER_RISK_RESPONSE_FIND, repl: LAYER_RISK_RESPONSE_REPL },
  { label: "strategy-layer-risk-bars", find: LAYER_RISK_BARS_FIND, repl: LAYER_RISK_BARS_REPL },
]
