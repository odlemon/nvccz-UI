/**
 * Balanced Scorecard Pillars (`/performance/bsc-pillars`).
 *
 * LIVE RENDERER: `bscPillarsV8()` at runtime L1744, reached through the v8 layer's page map
 *                `const v8Pages={... bscPillars:bscPillarsV8 ...}` (L1748). Nothing later in
 *                the file reassigns `v8Pages` or `bscPillars`, and every string below was
 *                matched against `.perf-dumps/a1/sysadmin__bscPillars.txt` before patching.
 *
 * WHAT WAS FABRICATED — and this page was the worst kind, because the numbers were not
 * merely unsourced, they CONTRADICTED the endpoint the page is a configuration screen for.
 *
 *   `GET /api/performance/config/pillars` returns, live, today:
 *     Financial            (short name "Financial")        weight 25
 *     Customer & Market    (short name "Customer")          weight 25
 *     Internal Operations  (short name "Internal Ops")      weight 25
 *     Learning, Growth & HR(short name "Learning & Growth") weight 25
 *
 *   The page showed 30 / 25 / 25 / 20 and called the third perspective "Internal Process".
 *   So an administrator reading this screen to check the configured weights was told the
 *   Financial perspective carries 30% when the system it configures says 25%. Both the
 *   "Pillar configuration" cards and the "Weight assurance" bars repeated the same wrong
 *   four numbers, which is why they agreed with each other and with nothing else.
 *
 *   Also invented: an executive owner per perspective (four named people the pillar endpoint
 *   has no field for), a KPI-family description per perspective, and a per-pillar
 *   "12 / 10 / 14 / 12 KPIs · 4 objectives" footer taken from two literal arrays.
 *
 * WHAT IT SHOWS NOW
 *   Perspective names, short names and weights come from `pillarConfig` — the real
 *   configuration, so this screen finally agrees with the system it configures. The two
 *   totals ("Total 100%" and "Validated · totals 100%") are summed from those live weights
 *   rather than asserted, so they stay correct after a weight change instead of going stale.
 *
 * STILL WITHOUT A SOURCE (reported, not invented)
 *   - Executive owner per perspective. `PerfPillar` is {name, displayName, weight,
 *     nonDeletable}; the backend has no owner column on the pillar configuration.
 *   - KPIs per perspective and objectives per perspective. There is no pillar linkage on
 *     either side: `PerfKpi` carries code/department/owner/frequency/target and no pillar,
 *     and goals carry no pillar either. Backend would need a `pillar` (or perspective) FK on
 *     `kpis` and on `performance_goals`, plus a count on the config response.
 *   - The KPI-family description per perspective ("Revenue growth, margin, ROIC, …") — no
 *     field exists for it on the pillar configuration.
 *   - The three "Publication controls" rows (Executive approval / Versioning / Cycle lock)
 *     are marked "Active" with nothing behind them. Left alone: they are labels for a policy,
 *     not measurements, and they carry no numbers. Flagged rather than patched.
 */

/* Fixture -> live. `pillars` keeps its array-of-arrays shape so the card template below is a
   value swap, not a rewrite; slot 2 becomes the short name (real) instead of an invented
   KPI-family blurb, and the owner slot disappears because there is no owner to put in it. */
const CONFIG_FIND =
  "function bscPillarsV8(){const pillars=[['Financial',30,'Revenue growth, margin, ROIC, AUM, portfolio IRR','Farai Muchengezi'],['Customer & Market',25,'NPS, retention, market share, event engagement','Rumbidzai Chaza'],['Internal Process',25,'Cycle time, compliance, automation, delivery quality','Tawanda Chikore'],['Learning & Growth',20,'Engagement, retention, training, leadership bench','Chipo Ncube']];"

const CONFIG_REPL =
  "function bscPillarsV8(){/* patched:bsc-pillars-config */" +
  "const __pcRaw=__perfScope('pillarConfig');" +
  "const __pcOk=__pcRaw!==null;" +
  "const __pc=__pcRaw||[];" +
  "const pillars=__pc.map(p=>[p.name,p.weight,p.displayName]);" +
  "const __pcWeighted=__pc.filter(p=>typeof p.weight==='number');" +
  "const __pcTotal=__pcWeighted.reduce((a,p)=>a+p.weight,0);" +
  "const __pcFull=__pc.length>0&&__pcWeighted.length===__pc.length;"

/* The "Total 100%" badge in the card header. Summed, not asserted. */
const TOTAL_BADGE_FIND = "${badge('Total 100%')}"

const TOTAL_BADGE_REPL =
  "${/* patched:bsc-pillars-total-badge */badge(!__pcOk?'Total '+__perfDash():__pc.length===0?'No perspectives configured':__pcFull?'Total '+__pcTotal+'%':'Total '+__pcTotal+'% of the weights that are set')}"

/* The perspective card. Weight is real; owner, KPI count and objective count are dashes. */
const CARD_FIND =
  "<h4>${p[0]}</h4></div><strong style=\"font-size:22px\">${p[1]}%</strong></header><p>${p[2]}</p>${v8Person(p[3],'Executive owner')}<footer><span>${[12,10,14,12][i]} KPIs</span><span>${[4,4,4,4][i]} objectives</span></footer>"

const CARD_REPL =
  "<h4>${/* patched:bsc-pillars-card */p[0]}</h4></div>" +
  "<strong style=\"font-size:22px\">${p[1]==null?__perfDash():p[1]+'%'}</strong></header>" +
  "<p>Short name · ${esc(p[2]||p[0])}. No KPI families are mapped to perspectives yet.</p>" +
  "${v8Person(__perfDash(),'Executive owner')}" +
  "<footer><span>${__perfDash()} KPIs</span><span>${__perfDash()} objectives</span></footer>"

/* Weight assurance. The same four `compactBarV8(...)` calls also appear in `kpiManagementV8`
   ("BSC Pillar Weights" side panel), so the anchor deliberately runs on through the divider
   and the "Validated" badge, which only exist here — that is what makes it unique. The
   weight-not-set branch reproduces compactBarV8's own markup by hand rather than calling it,
   because compactBarV8 interpolates `${value}%` twice and would print "null%" and a
   full-width bar for a missing weight. */
const ASSURANCE_FIND =
  "${compactBarV8('Financial',30,'30%','brand')}${compactBarV8('Customer',25,'25%','brand')}${compactBarV8('Internal Process',25,'25%','brand')}${compactBarV8('Learning & Growth',20,'20%','brand')}<div class=\"divider\"></div>${badge('Validated · totals 100%')}"

const ASSURANCE_REPL =
  "${/* patched:bsc-pillars-assurance */(!__pcOk" +
  "?'<p class=\"tiny\" style=\"margin:0;color:var(--muted,#6b7280)\">Pillar configuration is unavailable, so weights cannot be validated.</p>'" +
  ":__pc.length===0" +
  "?'<p class=\"tiny\" style=\"margin:0;color:var(--muted,#6b7280)\">No scorecard perspectives are configured yet.</p>'" +
  ":__pc.map(p=>p.weight==null" +
  "?'<div class=\"v8-score-line\" style=\"--tone:var(--brand)\"><strong>'+esc(p.displayName||p.name)+'</strong><b>'+__perfDash()+'</b><div class=\"track\"><i style=\"width:0%\"></i></div><em>Weight not set</em></div>'" +
  ":compactBarV8(p.displayName||p.name,p.weight,p.weight+'%','brand')).join(''))}" +
  "<div class=\"divider\"></div>" +
  "${badge(!__pcOk?'Weights '+__perfDash():__pc.length===0?'No perspectives configured':(__pcFull&&__pcTotal===100)?'Validated · totals 100%':'Not validated · totals '+__pcTotal+'%')}"

export default [
  { label: "bsc-pillars-config", find: CONFIG_FIND, repl: CONFIG_REPL },
  { label: "bsc-pillars-total-badge", find: TOTAL_BADGE_FIND, repl: TOTAL_BADGE_REPL },
  { label: "bsc-pillars-card", find: CARD_FIND, repl: CARD_REPL },
  { label: "bsc-pillars-assurance", find: ASSURANCE_FIND, repl: ASSURANCE_REPL },
]
