/**
 * Shared drawer decorator honesty pass.
 *
 * `openDrawer()` is wrapped multiple times across the runtime (V5 "intel" layer,
 * V6 "contextDrawerV6" layer, V7 tabbed analytics layer), each appending its own
 * enterprise-polish panel to EVERY drawer opened anywhere in the module. Two of
 * those layers fabricate a precise-looking "Confidence 84%", "Evidence 96%", a
 * '2 (1 improving)' risk count and an '8 min' staleness claim with no backing data
 * — this is the bug named in the module gap-audit ("fabricated Confidence 84% trend
 * panel"). Replaced with the same __perfDash()/'Not tracked' idiom already used
 * throughout this runtime for genuinely-missing data, rather than inventing numbers.
 *
 * Scope note: the V6 layer's alert/kpi/project/document-specific branches, and the
 * V7 analytics/controls/history tabs, contain their own separate fabricated figures
 * and are NOT touched here — that is materially more surface area (four more branches
 * plus three more tab-panel functions) and is flagged separately rather than folded
 * into this pass.
 */

export default [
  {
    label: "drawer-decorator-intel-honesty",
    find: "${metricV5('Confidence','84%','Modelled')}${metricV5('Material risks','2','1 improving')}${metricV5('Evidence','96%','Validated')}${metricV5('Last refresh','8 min','Current')}",
    repl: "/* patched:drawer-decorator-intel-honesty */${metricV5('Confidence',__perfDash(),'Not tracked')}${metricV5('Material risks',__perfDash(),'Not tracked')}${metricV5('Evidence',__perfDash(),'Not tracked')}${metricV5('Last refresh',__perfDash(),'Not tracked')}",
  },
  {
    label: "drawer-decorator-intel-sidelist-honesty",
    find: "${sideItem('Related objective','Sustainable growth','On track','green')}${sideItem('Control status','All mandatory evidence present','Passed','green')}${sideItem('Next decision','Owner review within 24h','Due','amber')}",
    repl: "/* patched:drawer-decorator-intel-sidelist-honesty */${sideItem('Related objective','Not linked to a real objective yet','Not tracked','')}${sideItem('Control status','No control evidence recorded yet','Not tracked','')}${sideItem('Next decision','No decision workflow recorded yet','Not tracked','')}",
  },
  {
    label: "drawer-decorator-context-fallback-honesty",
    find: "return `<div class=\"drawer-context-v6\"><div class=\"metrics-v6\">${metric6('Confidence','84%','Modelled','#6517ff')}${metric6('Evidence','96%','Validated','#00b779')}${metric6('Risks','2','1 improving','#ffad00')}${metric6('Last refresh','8 min','Current','#006cff')}</div>${panel6('Trend & decision context','Recent signal',trendV5(64,79))}</div>`;",
    repl: "/* patched:drawer-decorator-context-fallback-honesty */return `<div class=\"drawer-context-v6\"><div class=\"metrics-v6\">${metric6('Confidence',__perfDash(),'Not tracked','#6517ff')}${metric6('Evidence',__perfDash(),'Not tracked','#00b779')}${metric6('Risks',__perfDash(),'Not tracked','#ffad00')}${metric6('Last refresh',__perfDash(),'Not tracked','#006cff')}</div></div>`;",
  },
]
