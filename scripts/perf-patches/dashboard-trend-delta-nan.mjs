/**
 * Dashboard "Enterprise performance" bullet showed a literal "NaN pts" delta whenever
 * `d.trend` had fewer than 2 points (e.g. brand new data with no history yet) - `bullet()`
 * already guards the main value/delta display against a null `value`, but `metricDelta(n)`
 * was always called with `n = d.trend[d.trend.length-1] - d.trend[0]`, which is
 * `undefined - undefined = NaN` for an empty or single-point trend array. Found via the
 * module's live-role sweep (perf-page-dump.mjs), sysadmin dashboard, real screenshot showed
 * "0% / NaN pts". Fixed the same way every other missing metric in this dashboard already
 * reads: 'Not yet tracked' rather than a computed non-number.
 */

export default [
  {
    label: "dashboard-trend-delta-nan",
    find: "dashboard=function(){const d=scaled(),delta=d.trend[d.trend.length-1]-d.trend[0],metricDelta=(n)=>`${n>=0?'+':''}${n} pts`;",
    repl: "dashboard=function(){/* patched:dashboard-trend-delta-nan */const d=scaled(),hasTrend=Array.isArray(d.trend)&&d.trend.length>=2&&d.trend.every(function(v){return v!=null&&!Number.isNaN(v)}),delta=hasTrend?d.trend[d.trend.length-1]-d.trend[0]:null,metricDelta=(n)=>n==null?'Not yet tracked':`${n>=0?'+':''}${n} pts`;",
  },
]
