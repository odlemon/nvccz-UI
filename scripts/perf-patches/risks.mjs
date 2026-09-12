/**
 * Enterprise Risk Register (`/performance/risks`).
 *
 * LIVE RENDERER — traced through the override chain, because this page has TWO interceptors
 * that both look right when grepped:
 *
 *   (dead)  `window.render=render=function(){if(state.page==='risks'){… riskPage() …}}`
 *           — the v20 generation. It is captured as `prevRender` by the layer below and its
 *           risks branch is never reached, because that layer returns before delegating.
 *   (LIVE)  `window.render=render=function(){if(state.page==='risks'){… d.riskId?detailPage(d.riskId):registerPage() …}}`
 *           — the v21 generation, assigned AFTER the v20 one. The final assignment in the file
 *           (`const renderBase=render; window.render=render=function(){…renderBase.apply…}`,
 *           v22) wraps it and adds `patchRiskRegister()`, so v21 is what actually paints.
 *
 *   Confirmed from the DOM, not the diff: `.perf-dumps/a6/sysadmin__risks.txt` contains the
 *   `Sort: residual exposure` live bar and the `1 open action(s)` cell, both of which only
 *   `registerPage()` + `patchRiskRegister()` produce. `riskPage()` renders neither.
 *
 * WHAT WAS FABRICATED — all 23 numbers on screen, from one fixture
 *   `seedRisks` in the v20 layer: five invented enterprise risks (RSK-001…RSK-005) with
 *   invented owners, categories, likelihood/impact pairs, inherent (20/12/15/12/12) and
 *   residual (12/8/9/10/7) scores, appetite positions, trends, treatments, controls, evidence
 *   and review dates. Every KPI on the page is arithmetic over that fixture: Active risks 5,
 *   "2 high severity", Above appetite 2, Residual exposure 46 (the sum), Reviews due ≤14d 5,
 *   Improving trend 2.
 *
 *   `extras(r)` then manufactured a second layer on top of each row: two controls with owners,
 *   effectiveness ratings and test dates, one treatment action whose progress was literally
 *   `/Above/.test(r.appetite)?54:72` — which is where the 54% and 72% treatment column came
 *   from — one KRI with a threshold derived from the residual score, and one evidence record.
 *   The "1 open action(s)" under every row was that invented action.
 *
 *   `risk_assessments` returns 0 rows. Nothing on this page was measured.
 *
 * WHAT IT SHOWS NOW
 *   Rows come from the live `risks` scope (`GET /api/risk-assessments` -> `assessments`).
 *   "Active risks" is that row count — a real 0 today, and a real number the moment a record
 *   exists. Everything else is an em dash with a caption saying what is not captured.
 *   `extras()` no longer invents anything, so controls / treatment actions / KRIs / evidence
 *   render their own empty states, and the risk matrix and category concentration say why
 *   they cannot be plotted instead of drawing an empty rubric.
 *
 * KNOWN GAP, NOT PAPERED OVER
 *   `/api/risk-assessments` is the wrong domain for this page. `model RiskAssessment` is a
 *   deal / investment due-diligence record — companyName, dealValue, sector, burnRateRisk,
 *   founderRisk, overallRiskScore, riskLevel, recommendation. It has no likelihood, impact,
 *   inherent/residual split, appetite or trend, and it is not scoped to a business unit. It is
 *   wired here because it is the scope this page is given, and it is honest about producing
 *   nothing; an enterprise risk register needs its own model. See the final report.
 */

/* ------------------------------------------------------------------------------------- *
 * 1. The v20 data layer: disconnect the fixture, connect the bridge.
 * ------------------------------------------------------------------------------------- */

const V_DEFAULTS =
  "const defaults={riskId:null,kpiId:null,projectId:null,projectTab:'board',reportId:'RPT-001',risks:seedRisks,kpis:seedKpis,projects:seedProjects};"

const V_DEFAULTS_LIVE =
  "/* patched:risks-v-defaults */\n" +
  " // `seedRisks` above is now orphaned. The only two reads of it - this line and the\n" +
  " // localStorage restore below - both take the live register instead, so the five fixture\n" +
  " // risks are unreachable from every renderer in the file.\n" +
  " //\n" +
  " // `GET /api/risk-assessments` -> adaptNamed() -> { id, name, description, status }. The\n" +
  " // register asks for category, owner, likelihood, impact, inherent and residual score,\n" +
  " // appetite, trend, treatment and next review. None of those survive the adapter, so they\n" +
  " // are null here and every renderer shows an em dash instead of a number. `recordStatus`\n" +
  " // keeps the assessment's own workflow status, which is real; `status` stays null because\n" +
  " // the column it feeds is labelled Severity, and a workflow status is not a severity.\n" +
  " function __perfLiveRisks(){\n" +
  "  const rows=__perfScope('risks');\n" +
  "  if(rows===null)return [];\n" +
  "  return rows.map(r=>({id:r.id,title:r.name||r.id,category:null,owner:null,likelihood:null,impact:null,inherent:null,residual:null,appetite:null,status:null,trend:null,treatment:r.description||null,review:null,controls:null,evidence:null,linked:null,recordStatus:r.status||null,history:[]}));\n" +
  " }\n" +
  " const defaults={riskId:null,kpiId:null,projectId:null,projectTab:'board',reportId:'RPT-001',risks:__perfLiveRisks(),kpis:seedKpis,projects:seedProjects};"

// The restore is the trap: emptying the fixture is not enough, because anyone who opened this
// page before today has the five fabricated risks sitting in localStorage under
// `matanho.v20.operational.depth` and `Array.isArray(s.risks)` would hand them straight back.
const V_RESTORE = "risks:Array.isArray(s.risks)?s.risks:seedRisks,"
const V_RESTORE_LIVE = "risks:/* patched:risks-v-restore */__perfLiveRisks(),"

// `V` is built once, at layer-definition time, which is several hundred ms before the host's
// fetch resolves. Re-deriving inside `state()` is what makes late-arriving rows appear: both
// `registerPage()` and `detailPage()` read the register through `v20()` -> `state()`.
const V20_STATE =
  "window.MatanhoV20=Object.freeze({version:'20.0.0',state:()=>JSON.parse(JSON.stringify(V)),openRisk:"
const V20_STATE_LIVE =
  "window.MatanhoV20=Object.freeze({version:'20.0.0',state:()=>/* patched:risks-v20-state */Object.assign(JSON.parse(JSON.stringify(V)),{risks:__perfLiveRisks()}),openRisk:"

/* ------------------------------------------------------------------------------------- *
 * 2. The v21 render layer.
 * ------------------------------------------------------------------------------------- */

const REGISTER_HEAD =
  "function registerPage(){const d=v20(),risks=d.risks||[],high=risks.filter(r=>r.status==='High').length,above=risks.filter(r=>/Above/.test(r.appetite)).length,residual=risks.reduce((a,r)=>a+Number(r.residual||0),0),due=risks.filter(r=>parseDate(r.review)<=Date.parse('2026-08-25')).length,improving=risks.filter(r=>r.trend==='Improving').length;"

// `high`, `above`, `residual`, `due` and `improving` were used nowhere except the KPI strip
// replaced below, so they go with it. `__rOk` distinguishes "the register is empty" (a real 0)
// from "the register did not load" (a dash) - the KPI strip needs both and `risks.length`
// cannot tell them apart.
const REGISTER_HEAD_LIVE =
  "function registerPage(){/* patched:risks-register-head */const __rOk=__perfScope('risks')!==null;const d=v20(),risks=d.risks||[];"

const REGISTER_KPIS =
  "<div class=\"v21-risk-kpis\">${metric('Active risks',risks.length,`${high} high severity`)}" +
  "${metric('Above appetite',above,'Require executive attention',above?'high':'')}" +
  "${metric('Residual exposure',residual,'Aggregate current risk score')}" +
  "${metric('Reviews due ≤14d',due,'Governed reassessment cadence',due?'alert':'')}" +
  "${metric('Improving trend',improving,'Risks reducing exposure')}</div>"

// Same five cards, same order, same labels. The `high` / `alert` emphasis classes are dropped
// because they coloured a card red for a count we do not have.
const REGISTER_KPIS_LIVE =
  "<div class=\"v21-risk-kpis\">${/* patched:risks-kpis */metric('Active risks',__rOk?String(risks.length):__perfDash(),__rOk?(risks.length?'On the enterprise register':'None recorded yet'):'Unavailable')}" +
  "${metric('Above appetite',__perfDash(),'Risk appetite is not captured yet')}" +
  "${metric('Residual exposure',__perfDash(),'Residual scoring is not captured yet')}" +
  "${metric('Reviews due ≤14d',__perfDash(),'Review cadence is not captured yet')}" +
  "${metric('Improving trend',__perfDash(),'Exposure history is not recorded yet')}</div>"

// Category is null on every live row, so `new Set(...)` yields one `null` entry and the filter
// rendered a blank selectable option that hides the whole register when chosen.
const CAT_OPTIONS =
  "<option value=\"\">All categories</option>${[...new Set(risks.map(r=>r.category))].map(x=>`<option>${h(x)}</option>`).join('')}"
const CAT_OPTIONS_LIVE =
  "<option value=\"\">All categories</option>${/* patched:risks-category-options */[...new Set(risks.map(r=>r.category))].filter(Boolean).map(x=>`<option>${h(x)}</option>`).join('')}"

const ROW_HEAD =
  "<td><strong>${h(r.title)}</strong><small>${h(r.id)} · ${h(r.linked)}</small></td>" +
  "<td>${h(r.category)}</td><td>${h(r.owner)}</td><td>${score(r.inherent)}</td><td>${score(r.residual)}</td>"

// `score(null)` was the quiet failure here: `Number(null)>=15` and `>=8` are both false, so an
// unknown score rendered with the **low** class - a green chip asserting a low-risk position
// for a risk that has never been scored. A plain dash makes no claim.
const ROW_HEAD_LIVE =
  "<td><strong>${/* patched:risks-row-head */h(r.title)}</strong><small>${h(r.id)}</small></td>" +
  "<td>${h(rv(r.category))}</td><td>${h(rv(r.owner))}</td><td>${h(rv(r.inherent))}</td><td>${h(rv(r.residual))}</td>"

const ROW_TAIL =
  "<td>${pill(r.appetite,/Above/.test(r.appetite)?'bad':r.appetite==='Watch'?'warn':'good')}</td>" +
  "<td>${pill(r.trend,r.trend==='Increasing'?'bad':r.trend==='Improving'?'good':'info')}</td>" +
  "<td><strong>${avg}%</strong><small>${ex.actions.filter(x=>x.status!=='Complete').length} open action(s)</small></td>" +
  "<td>${h(r.review)}</td><td>${pill(r.status,riskTone(r))}</td>"

// `pill(null,…)` fell through to the 'good' tone for appetite and 'info' for trend, so an
// unscored risk showed a green "within tolerance" style badge with no text in it. The
// treatment column showed `${avg}%` where avg averaged the invented action progress, and
// "1 open action(s)" counted the invented action.
const ROW_TAIL_LIVE =
  "<td>${/* patched:risks-row-tail */h(rv(r.appetite))}</td>" +
  "<td>${h(rv(r.trend))}</td>" +
  "<td><strong>${__perfDash()}</strong><small>${ex.actions.length?ex.actions.filter(x=>x.status!=='Complete').length+' open action(s)':'No treatment actions'}</small></td>" +
  "<td>${h(rv(r.review))}</td><td>${h(rv(r.status))}</td>"

const ROW_JOIN = "}).join('')}</tbody></table></div></section>"
const ROW_JOIN_LIVE = "}).join('')||/* patched:risks-empty-row */__perfRiskEmptyRow()}</tbody></table></div></section>"

const EXTRAS =
  "function extras(r){if(!U.extras[r.id])U.extras[r.id]={controls:[{id:'CTL-01',name:(r.controls||'Primary risk control').split(';')[0].trim(),type:'Preventive',owner:r.owner,effectiveness:'Effective',lastTest:'08 Aug 2026',status:'Active'},{id:'CTL-02',name:(r.controls||'Management review').split(';')[1]?.trim()||'Management review and escalation',type:'Detective',owner:'Risk & Compliance',effectiveness:'Partially effective',lastTest:'01 Aug 2026',status:'Active'}],actions:[{id:'ACT-01',action:r.treatment||'Confirm mitigation plan and accountable milestones.',owner:r.owner,due:r.review,status:'In Progress',progress:/Above/.test(r.appetite)?54:72,priority:/Above/.test(r.appetite)?'High':'Medium'}],kris:[{id:'KRI-01',name:'Residual risk score',current:String(r.residual),threshold:'≤ '+Math.max(5,Number(r.residual)-2),source:'Enterprise Risk Register',owner:r.owner,status:Number(r.residual)>=12?'Breach':'Monitor',updated:'11 Aug 2026'}],evidence:[{id:'EVD-01',name:(r.evidence||'Risk evidence pack').split(';')[0].trim(),source:'Document Vault',owner:r.owner,status:'Current',updated:'10 Aug 2026'}],audit:[]};save();return U.extras[r.id]}"

// The two helpers the patches above depend on are declared here, next to `extras`, because
// this is the v21 layer's own scope. Function declarations hoist, so `registerPage()` and
// `detailPage()` - both defined further down - can use them.
const EXTRAS_LIVE =
  "/* patched:risks-extras */\n" +
  "// Raw value or an em dash. NOT h()-wrapped: several call sites already escape, and\n" +
  "// double-escaping would turn an ampersand in a risk title into `&amp;amp;`.\n" +
  "function rv(v){return (v==null||v==='')?'\\u2014':v}\n" +
  "// Distinguishes an empty register from one that failed to load, and carries\n" +
  "// `data-perf-empty` so the v22 live bar does not count it as a risk.\n" +
  "function __perfRiskEmptyRow(){const rows=__perfScope('risks');const msg=rows===null?'Unavailable - could not load the risk register':'No risks on the register yet';return '<tr data-perf-empty><td colspan=\"10\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">'+msg+'</td></tr>'}\n" +
  "// Was a fabrication generator: for every risk it invented two controls with owners,\n" +
  "// effectiveness ratings and test dates, one treatment action whose progress was\n" +
  "// `/Above/.test(r.appetite)?54:72`, one KRI with a threshold computed off the residual\n" +
  "// score, and one evidence record. None of that is recorded anywhere. The panels that read\n" +
  "// these arrays already have empty states, so they now show them. User-added controls,\n" +
  "// actions, KRIs and evidence still persist here exactly as before.\n" +
  "function extras(r){if(!U.extras[r.id])U.extras[r.id]={controls:[],actions:[],kris:[],evidence:[],audit:[]};save();return U.extras[r.id]}"

const MATRIX = "function matrix(risks){const counts={};"
const MATRIX_LIVE =
  "function matrix(risks){/* patched:risks-matrix */" +
  "if(!risks.some(r=>Number.isFinite(Number(r.impact))&&Number.isFinite(Number(r.likelihood))))" +
  "return __perfNoSeries('Likelihood and impact are not captured on risk records yet, so no risk can be positioned on the heatmap.');" +
  "const counts={};"

const DIST = "function distributions(risks){const cats="
const DIST_LIVE =
  "function distributions(risks){/* patched:risks-distributions */" +
  "if(!risks.some(r=>r.category))" +
  "return __perfNoSeries('Risk category is not captured on risk records yet, so no concentration can be calculated.');" +
  "const cats="

/* ------------------------------------------------------------------------------------- *
 * 3. The risk detail workspace. Unreachable today (0 rows), but it leaks literal "null"
 *    the moment a record exists, so it is fixed rather than left as a trap.
 * ------------------------------------------------------------------------------------- */

const DETAIL_PILLS =
  "${pill(r.status,riskTone(r))}${pill('Owner · '+r.owner,'info')}" +
  "${pill('Residual · '+r.residual,scoreClass(r.residual)==='high'?'bad':scoreClass(r.residual)==='mid'?'warn':'good')}" +
  "${pill(r.appetite,/Above/.test(r.appetite)?'bad':r.appetite==='Watch'?'warn':'good')}"

// These concatenate without h(), so a null owner rendered the string "Owner · null" and a null
// residual "Residual · null". Tones are neutral because severity, appetite and residual
// banding are all unscored. The first pill now shows the assessment's real workflow status.
const DETAIL_PILLS_LIVE =
  "${/* patched:risks-detail-pills */pill(rv(r.recordStatus),'info')}${pill('Owner · '+rv(r.owner),'info')}" +
  "${pill('Residual · '+rv(r.residual),'info')}" +
  "${pill(rv(r.appetite),'info')}"

const DETAIL_KPIS =
  "<div class=\"v21-risk-kpis\">${metric('Likelihood',`${r.likelihood} / 5`,'Current assessment')}" +
  "${metric('Impact',`${r.impact} / 5`,'Business impact')}" +
  "${metric('Inherent score',r.inherent,'Before controls')}" +
  "${metric('Residual score',r.residual,'After controls',scoreClass(r.residual)==='high'?'high':'')}" +
  "${metric('Next review',r.review,'Governed cadence')}</div>"

const DETAIL_KPIS_LIVE =
  "<div class=\"v21-risk-kpis\">${/* patched:risks-detail-kpis */metric('Likelihood',rv(r.likelihood),'Not captured on risk records')}" +
  "${metric('Impact',rv(r.impact),'Not captured on risk records')}" +
  "${metric('Inherent score',rv(r.inherent),'Not captured on risk records')}" +
  "${metric('Residual score',rv(r.residual),'Not captured on risk records')}" +
  "${metric('Next review',rv(r.review),'Not captured on risk records')}</div>"

// `scoreClass(null)` returns 'low', so both of these printed " · LOW" for a risk with no score
// at all — the single most misleading string on the page.
const INHERENT_BAND = "<strong>${h(r.inherent)} · ${scoreClass(r.inherent).toUpperCase()}</strong>"
const INHERENT_BAND_LIVE =
  "<strong>${/* patched:risks-inherent-band */h(rv(r.inherent))}${r.inherent==null?'':' · '+scoreClass(r.inherent).toUpperCase()}</strong>"

const RESIDUAL_BAND = "<strong>${h(r.residual)} · ${scoreClass(r.residual).toUpperCase()}</strong>"
const RESIDUAL_BAND_LIVE =
  "<strong>${/* patched:risks-residual-band */h(rv(r.residual))}${r.residual==null?'':' · '+scoreClass(r.residual).toUpperCase()}</strong>"

// One in overview(), one in assessment(); both should read the same.
const LIKELIHOOD_5 = "<strong>${h(r.likelihood)} / 5</strong>"
const LIKELIHOOD_5_LIVE = "<strong>${/* patched:risks-likelihood */h(rv(r.likelihood))} / 5</strong>"
const IMPACT_5 = "<strong>${h(r.impact)} / 5</strong>"
const IMPACT_5_LIVE = "<strong>${/* patched:risks-impact */h(rv(r.impact))} / 5</strong>"

const REVIEW_HISTORY =
  "<div class=\"v21-risk-history\">${(rows.length?rows:[{date:'08 Aug 2026',text:'Risk exposure confirmed; treatment remains active.',actor:r.owner},{date:'01 Aug 2026',text:'Evidence pack refreshed and residual score reviewed.',actor:'Risk & Compliance'}]).map(x=>`<div class=\"v21-risk-history-row\"><time>${h(x.date)}</time><strong>${h(x.text)}</strong><span>${h(x.actor)}</span></div>`).join('')}</div>"

// The fallback invented two audit entries — dated, attributed and worded as if someone had
// reviewed the risk. An empty audit trail is the fact.
const REVIEW_HISTORY_LIVE =
  "<div class=\"v21-risk-history\">${/* patched:risks-review-history */rows.length?rows.map(x=>`<div class=\"v21-risk-history-row\"><time>${h(x.date)}</time><strong>${h(x.text)}</strong><span>${h(x.actor)}</span></div>`).join(''):`<div class=\"v21-risk-empty\">No risk reviews or audit entries recorded.</div>`}</div>"

/* ------------------------------------------------------------------------------------- *
 * 4. The v22 live bar.
 * ------------------------------------------------------------------------------------- */

const FILTER_ROWS = "  const rows=[...document.querySelectorAll('[data-v21-risk-rows] tr')];"
const FILTER_ROWS_LIVE =
  "  /* patched:risks-filter-count */\n" +
  "  // The empty-state row is not a risk. Counting it would make the live bar read\n" +
  "  // \"1 visible of 1 active risks\" on an empty register.\n" +
  "  const rows=[...document.querySelectorAll('[data-v21-risk-rows] tr:not([data-perf-empty])')];"

export default [
  { label: "risks-v-defaults", find: V_DEFAULTS, repl: V_DEFAULTS_LIVE },
  { label: "risks-v-restore", find: V_RESTORE, repl: V_RESTORE_LIVE },
  { label: "risks-v20-state", find: V20_STATE, repl: V20_STATE_LIVE },
  { label: "risks-extras", find: EXTRAS, repl: EXTRAS_LIVE },
  { label: "risks-register-head", find: REGISTER_HEAD, repl: REGISTER_HEAD_LIVE },
  { label: "risks-kpis", find: REGISTER_KPIS, repl: REGISTER_KPIS_LIVE },
  { label: "risks-category-options", find: CAT_OPTIONS, repl: CAT_OPTIONS_LIVE },
  { label: "risks-row-head", find: ROW_HEAD, repl: ROW_HEAD_LIVE },
  { label: "risks-row-tail", find: ROW_TAIL, repl: ROW_TAIL_LIVE },
  { label: "risks-empty-row", find: ROW_JOIN, repl: ROW_JOIN_LIVE },
  { label: "risks-matrix", find: MATRIX, repl: MATRIX_LIVE },
  { label: "risks-distributions", find: DIST, repl: DIST_LIVE },
  { label: "risks-detail-pills", find: DETAIL_PILLS, repl: DETAIL_PILLS_LIVE },
  { label: "risks-detail-kpis", find: DETAIL_KPIS, repl: DETAIL_KPIS_LIVE },
  { label: "risks-inherent-band", find: INHERENT_BAND, repl: INHERENT_BAND_LIVE },
  { label: "risks-residual-band", find: RESIDUAL_BAND, repl: RESIDUAL_BAND_LIVE },
  { label: "risks-likelihood", find: LIKELIHOOD_5, repl: LIKELIHOOD_5_LIVE, occurrences: 2 },
  { label: "risks-impact", find: IMPACT_5, repl: IMPACT_5_LIVE, occurrences: 2 },
  { label: "risks-review-history", find: REVIEW_HISTORY, repl: REVIEW_HISTORY_LIVE },
  { label: "risks-filter-count", find: FILTER_ROWS, repl: FILTER_ROWS_LIVE },
]
