/**
 * KPI Analytics (`/performance/kpi-analytics`).
 *
 * LIVE RENDERER — established from the DOM, not from grepping:
 *   The page body is `kpiAnalyticsV8()` (the v8 layer, registered in `v8Pages` as
 *   `kpiAnalytics:kpiAnalyticsV8`). Proof: the six `analytics-kpi-*` patches already applied
 *   by `patch-performance-runtime.mjs` sit inside that function and DO show on screen. Two
 *   older generations carry "KPI trend over time" and "Department heatmap" with the same
 *   fixtures; neither renders.
 *
 *   Two further layers stack ON TOP of the page and are what produce most of the numbers:
 *     * the v10 executive band (`hero()` + `pageMap`) injected after `.sig-depthbar`, and
 *     * `ribbons()`, which appends an insight strip to whichever card holds the page chart.
 *   Both are SHARED with other pages, so only the `pageMap.kpiAnalytics` entry is rewritten
 *   here; the two `hero()` patches are deliberately generic and labelled without a page
 *   prefix so another page's author finds them already applied instead of re-anchoring.
 *
 * WHAT WAS FABRICATED (46 numbers on screen)
 *   Executive band: a 76% "KPI attainment" score, "32 / 48 KPIs on track", "6 off-track",
 *   "Data current · 8 min", and a headline asserting "32 of 48 governed KPIs are on track".
 *   Body: a seven-point completion curve (42→76%) against an 82% target trajectory; a
 *   distribution ring reading "48 KPIs" split 67% / 21% / 12% into 32 / 10 / 6; a five-row
 *   department heatmap of 30 invented monthly percentages; and Top/Bottom KPI rankings of
 *   ten invented KPIs with invented attainment (93% … 45%).
 *   `GET /api/kpis` returns 0 rows and there is no KPI-result table at all, so every one of
 *   those figures was asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   The only real figure this page can produce is the size of the KPI catalogue, from the
 *   `kpis` scope — it feeds the executive band's first card and the distribution ring.
 *   Everything else reads as not-tracked: there is no store of KPI values, no target series
 *   and no per-period department result, so trend, distribution bands, heatmap and both
 *   rankings have no source. Removing the fabricated chart also removes `ribbons()`'
 *   insight strip ("3 consecutive periods improving", "96% of source records current"),
 *   because that strip only attaches to a rendered chart.
 */

// --- shared v10 executive band -----------------------------------------------------------
// `pageMap` is built once when the layer initialises, long before the host's fetch resolves,
// so these have to be getters — a value computed at definition time would freeze as a dash
// forever, which is just a different lie.
const HERO_CONFIG_FIND =
  "kpiAnalytics:{score:'76',label:'KPI attainment',title:'Most indicators are healthy; exceptions are concentrated, not systemic.',copy:'32 of 48 governed KPIs are on track. A small set of process and capacity indicators explains the majority of downside variance.',a:['32 / 48','KPIs on track'],b:['6','Off-track KPIs']},"

const HERO_CONFIG_REPL =
  "/* patched:kpianalytics-hero-config */\n" +
  " kpiAnalytics:{get score(){return __perfDash()},label:'KPI attainment'," +
  "title:'KPI attainment is not being measured yet.'," +
  "copy:'No KPI results have been recorded against the catalogue, so attainment, variance and exception concentration cannot be calculated.'," +
  "get a(){return [__perfCount('kpis'),'KPIs in the catalogue']}," +
  "get b(){return [__perfDash(),'Off-track KPIs']}},"

// --- KPI trend over time ------------------------------------------------------------------
const TREND_FIND = "${bigTrendV8([42,48,55,61,66,70,76],[50,54,58,64,68,73,80])}"
const TREND_REPL =
  "${/* patched:kpianalytics-trend */__perfNoSeries('KPI results are not recorded period by period yet, so no completion trend or target trajectory can be drawn.')}"

// --- Performance distribution --------------------------------------------------------------
// The ring counts the catalogue, which is real. The three threshold bands are not: nothing
// stores a KPI's current value, so no KPI can be classified on track / at risk / off track.
// The bar markup is `compactBarV8`'s output reproduced verbatim (same classes, same tone
// variables) with the value slot dashed and the bar at zero width.
const DISTRIBUTION_FIND =
  "<div class=\"v8-ring\"><div class=\"v8-ring-center\"><strong>48</strong><span>KPIs</span></div></div>${compactBarV8('On track',67,'32 KPIs','green')}${compactBarV8('At risk',21,'10 KPIs','amber')}${compactBarV8('Off track',12,'6 KPIs','red')}"

const DISTRIBUTION_REPL =
  "${/* patched:kpianalytics-distribution */(() => {\n" +
  "  const band = (label, tone) => '<div class=\"v8-score-line\" style=\"--tone:' + tone + '\"><strong>' + label + '</strong><b>' + __perfDash() + '</b><div class=\"track\"><i style=\"width:0%\"></i></div><em>Not yet tracked</em></div>';\n" +
  "  return '<div class=\"v8-ring\"><div class=\"v8-ring-center\"><strong>' + __perfCount('kpis') + '</strong><span>KPIs</span></div></div>'\n" +
  "    + band('On track', 'var(--emerald)')\n" +
  "    + band('At risk', 'var(--amber)')\n" +
  "    + band('Off track', 'var(--red)');\n" +
  "})()}"

// --- Department heatmap ---------------------------------------------------------------------
// Five invented departments x six invented months. `deptComparison` does carry real
// per-department figures, but nothing anywhere is stored per period, so the Jan…Jul columns
// have no source at all — keeping the grid and dashing 30 cells would still assert that those
// are the reporting periods.
const HEATMAP_FIND =
  "<div class=\"v8-heatmap\"><div class=\"label head\">Department</div>${['Jan','Mar','Apr','May','Jun','Jul'].map(x=>`<div class=\"head\">${x}</div>`).join('')}${[['Finance',[72,74,76,78,80,83]],['Operations',[64,68,70,72,74,76]],['ICT',[60,63,66,68,69,72]],['People',[66,70,74,78,82,84]],['Client Exp.',[70,72,74,76,79,81]]].map(r=>`<div class=\"label\">${r[0]}</div>${r[1].map(v=>`<div class=\"${v>=78?'good':v>=70?'mid':'bad'}\">${v}%</div>`).join('')}`).join('')}</div>"

const HEATMAP_REPL =
  "${/* patched:kpianalytics-heatmap */__perfNoSeries('Department KPI results are not recorded by reporting period, so no department heatmap can be drawn.')}"

// --- Top / Bottom KPIs -----------------------------------------------------------------------
const TOP_FIND =
  "${compactBarV8('Revenue Growth',93,'Ahead','green')}${compactBarV8('Cost Optimisation',89,'Ahead','green')}${compactBarV8('Customer Satisfaction',88,'Ahead','green')}${compactBarV8('System Uptime',85,'On track','green')}${compactBarV8('Employee Engagement',83,'On track','green')}"

const TOP_REPL =
  "${/* patched:kpianalytics-top */__perfNoSeries('No KPI results have been recorded, so the strongest indicators cannot be ranked.')}"

const BOTTOM_FIND =
  "${compactBarV8('Portfolio Diversification',45,'Off track','red')}${compactBarV8('On-time Delivery',49,'Off track','red')}${compactBarV8('IT Security Compliance',52,'At risk','amber')}${compactBarV8('Employee Turnover',55,'At risk','amber')}${compactBarV8('First Contact Resolution',58,'At risk','amber')}"

const BOTTOM_REPL =
  "${/* patched:kpianalytics-bottom */__perfNoSeries('No KPI results have been recorded, so the weakest indicators cannot be ranked.')}"

export default [
  {
    label: "kpianalytics-hero-config",
    find: HERO_CONFIG_FIND,
    repl: HERO_CONFIG_REPL,
  },
  {
    // SHARED with every page that has a `pageMap` entry (dashboard, scorecards, reviews,
    // tasks, corrective, strategy). Deliberately generic: `hero()` hard-coded a `%` suffix
    // after the score, so a page whose score is unknown rendered the em dash as "—%".
    // Numeric scores are untouched.
    label: "hero-score-suffix",
    find: "<div class=\"v10-hero-score\">${esc10(cfg.score)}<small>%</small></div>",
    repl:
      "<div class=\"v10-hero-score\">${/* patched:hero-score-suffix */esc10(cfg.score)}${/^[0-9][0-9.]*$/.test(String(cfg.score))?'<small>%</small>':''}</div>",
  },
  {
    // SHARED, same band. "Data current · 8 min" was a literal on every page that renders the
    // hero; nothing measures how stale the underlying reads are.
    label: "hero-data-freshness",
    find: "<span><i></i>Data current · 8 min</span>",
    repl: "<span><i></i>${/* patched:hero-data-freshness */'Data freshness not tracked'}</span>",
  },
  { label: "kpianalytics-trend", find: TREND_FIND, repl: TREND_REPL },
  { label: "kpianalytics-distribution", find: DISTRIBUTION_FIND, repl: DISTRIBUTION_REPL },
  { label: "kpianalytics-heatmap", find: HEATMAP_FIND, repl: HEATMAP_REPL },
  { label: "kpianalytics-top", find: TOP_FIND, repl: TOP_REPL },
  { label: "kpianalytics-bottom", find: BOTTOM_FIND, repl: BOTTOM_REPL },
]
