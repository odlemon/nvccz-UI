/**
 * Objectives & Key Results (`/performance/objectives`).
 *
 * LIVE RENDERER — established by following the override chain, not by grepping:
 *   `objectives` is a top-level function reassigned three times. The last assignment is
 *   `objectives=function(){…return baseObjectives6()}`, and `baseObjectives6` was captured
 *   one line earlier from the assignment made by the "inspo" layer. That layer's
 *   `objectives=function(){…}` renders `okrInspo()` / `analyticsInspo()` / `registryInspo()`
 *   for the three in-page tabs. The earlier `function objectives(){…}` definition and the
 *   v8 `kpiAnalyticsV8`/`kpiManagementV8` layers carry near-identical strings and are NOT
 *   reachable from this route — patching them changes nothing on screen.
 *   Confirmed against `.perf-dumps/a2/sysadmin__objectives.txt`.
 *
 * WHAT WAS FABRICATED (46 numbers on screen)
 *   Tab 1 (Objectives & Key Results): four invented objectives with invented owners and job
 *   titles, progress 78/61/84/53%, confidence High/Medium, a 30 Sep 2026 due date on every
 *   row, twelve invented key results (\$4.5M ARR, 120 customers, 115% NRR, CSAT 4.6/5, …)
 *   with invented percentages, three invented "linked initiatives" with 8-of-12-style task
 *   counts, and an invented check-in narrative.
 *   Tab 2 (KPI Analytics): a 76.4% / 48 / 32 / 10 / 6 KPI strip, a drawn completion trend, a
 *   fifteen-cell department heat grid, invented top-five and bottom-five KPI league tables, a
 *   five-row detail table with invented actuals and variances, four invented alerts.
 *   Tab 3 (KPI Management): an eight-row KPI registry fixture, a 7/6/6/5 category summary, a
 *   department mapping, three invented "recent updates", four invented integrations and BSC
 *   pillar weights hardcoded at 30/25/25/20 (the configured weights are 25/25/25/25).
 *
 *   `performance_goals` and the `kpis` table both hold 0 rows. Every figure above was
 *   asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   Objectives table  <- `goals` (GET /performance/goals). Owner, progress, confidence, due
 *                        date and key results are not fields on that response, so they are
 *                        em dashes rather than numbers.
 *   Team filter       <- `departments`.
 *   Analytics strip   <- `analyticsKpi` (GET /performance/analytics/kpi): averageProgress,
 *                        totalKPIs, totalGoals, goalsWithoutKpi. All real, including real 0s.
 *   Department bars   <- `deptComparison`; suppressed with a note while no department has a
 *                        single goal, because a 0% bar would read as a measured result.
 *   KPI tables        <- `kpis` (GET /kpis), with an empty state that distinguishes "none
 *                        registered" from "could not load".
 *   Alert rail        <- `alerts`.
 *   Pillar weights    <- `pillarConfig` — CONFIGURED weights, never attainment.
 *   No source at all: key results, confidence, check-ins, KPI results/variance/history,
 *   KPI category, data source, calculation, workflow rules. These say so.
 *   The "Open objective detail" drill-down (`objectiveDetailPageV6`) is patched too.
 *
 * STILL WITHOUT A SOURCE (deliberately left, and why)
 *   - The `Q3 2026` chip on the OKR toolbar. No endpoint lists performance cycles.
 *   - The "Create KPI" wizard (`kpiWizardPageV6`) is a blank intake form, not a reporting
 *     surface, so its picker options were left alone.
 *   - The "System & governance context" strip above the tabs is injected by the shared
 *     `wrapSystemMeta()`, which is page chrome on a dozen routes and is owned elsewhere.
 */

export default [
  {
    // The whole function, not the fixture alone: with `objs` sourced from `goals` every
    // cell in the template also has to stop asserting a percentage, and the two halves are
    // byte-adjacent, so one anchor is both safer and smaller than two.
    label: "objectives-okr",
    find: [
      "  function okrInspo(){\n",
      "    const objs=[\n",
      "      {id:'OBJ-001',title:'Drive sustainable revenue growth',owner:'Rumbidzai Chaza',role:'Chief Commercial Officer',progress:78,confidence:'High',due:'30 Sep 2026',status:'On Track',krs:[['Increase recurring revenue to $4.5M ARR',82],['Acquire 120 new enterprise customers',65],['Achieve net revenue retention of 115%',88]]},\n",
      "      {id:'OBJ-002',title:'Deliver world-class customer experience',owner:'Kudakwashe Biti',role:'Head of Customer Success',progress:61,confidence:'Medium',due:'30 Sep 2026',status:'Needs Attention',krs:[['Improve CSAT score to 4.6/5',72],['Reduce average support response time to <2hrs',58],['Achieve 95% SLA compliance',46]]},\n",
      "      {id:'OBJ-003',title:'Build high-performing, engaged teams',owner:'Tatenda Mlambo',role:'Head of People & Culture',progress:84,confidence:'High',due:'30 Sep 2026',status:'On Track',krs:[['Critical skills coverage',81],['Employee engagement',86],['Leadership bench strength',84]]},\n",
      "      {id:'OBJ-004',title:'Accelerate product innovation & impact',owner:'Ashley Mutenha',role:'Head of Product',progress:53,confidence:'Medium',due:'30 Sep 2026',status:'Needs Attention',krs:[['Launch 2 new digital products',60],['Improve adoption to 80%',53],['Validate product-market fit',45]]}\n",
      "    ];\n",
      "    const sel=objs[state.selectedObjectiveV4||0]||objs[0];\n",
      "    return `<div class=\"inspo-grid\"><div class=\"inspo-main\"><section class=\"card\"><div class=\"table-tools\"><input placeholder=\"Search objectives or key results\"><select><option>All teams</option><option>Commercial</option><option>People & Culture</option></select><select><option>All status</option><option>On Track</option><option>Needs Attention</option></select><div style=\"margin-left:auto\">${badge('Q3 2026')}</div></div><div class=\"objective-table\"><div class=\"okr-row header\"><span>#</span><span>Objective & key results</span><span>Owner</span><span>Progress</span><span>Confidence</span><span>Due date</span><span></span></div>${objs.map((o,oi)=>`<div class=\"okr-row parent click-hint\" data-v4-objective=\"${oi}\"><span>${oi+1}</span><div class=\"title\"><strong>${esc(o.title)}</strong><span>${o.krs.length} key results</span></div>${person(o.owner,o.role)}<div><strong>${o.progress}%</strong>${pct(o.progress,o.progress<70?'amber':'green')}</div><div>${badge(o.confidence)}</div><span>${o.due}</span><span>›</span></div>${o.krs.map((kr,ki)=>`<div class=\"okr-row child\"><span>${ki+1}.${oi+1}</span><div class=\"title\"><strong>${esc(kr[0])}</strong></div><span></span><div><strong>${kr[1]}%</strong>${pct(kr[1],kr[1]<60?'red':kr[1]<70?'amber':'green')}</div><div>${badge(kr[1]<60?'Low':kr[1]<75?'Medium':'High')}</div><span>${o.due}</span><span></span></div>`).join('')}`).join('')}</div></section></div><aside class=\"inspo-side\"><section class=\"card\"><div class=\"card-head\"><div><span class=\"tiny\">Selected objective</span><h3 style=\"margin-top:5px;font-size:15px!important\">${esc(sel.title)}</h3></div>${badge(sel.status)}</div><div class=\"card-body\">${person(sel.owner,sel.role)}<div class=\"summary-strip\" style=\"margin-top:12px\"><div class=\"summary-cell\"><span>Progress</span><strong>${sel.progress}%</strong></div><div class=\"summary-cell\"><span>Confidence</span><strong style=\"font-size:13px\">${sel.confidence}</strong></div><div class=\"summary-cell\"><span>Due date</span><strong style=\"font-size:11px\">30 Sep</strong></div><div class=\"summary-cell\"><span>Key results</span><strong>${sel.krs.length}</strong></div></div><div style=\"margin-top:12px\">${pct(sel.progress,sel.progress<70?'amber':'green')}</div><div class=\"divider\"></div><h3>Linked initiatives</h3><div class=\"side-list\">${sideItem('Enterprise Growth Campaign','Commercial · 8 of 12 tasks',badge('On Track'),'green')}${sideItem('Pricing Optimisation','Finance · 5 of 9 tasks',badge('In Progress'),'amber')}${sideItem('Channel Partner Expansion','Commercial · 6 of 10 tasks',badge('On Track'),'green')}</div><div class=\"divider\"></div><h3>Recent check-in</h3><p class=\"tiny\" style=\"line-height:1.55\">Strong pipeline conversion this month. Enterprise opportunities remain on track, while pricing optimisation needs focused follow-through.</p><div class=\"actions\" style=\"margin-top:12px\">${btn('Open objective detail','objective-detail','primary','target','0-0')}${btn('Update check-in','toast-generic','','reviews')}</div></div></section></aside></div>`;\n",
      "  }\n",
      ""
    ].join(""),
    repl: [
      "  function okrInspo(){\n",
      "    /* patched:objectives-okr */\n",
      "    // WAS: a fixture of four invented objectives (OBJ-001..OBJ-004) with invented owners,\n",
      "    // progress percentages, confidence ratings, due dates and twelve invented key results.\n",
      "    //\n",
      "    // `GET /performance/goals` is the only objective source the bridge has and it returns\n",
      "    // 0 rows today. adaptNamed() keeps id / name / description / status and nothing else, so\n",
      "    // owner, progress, confidence, due date and key results have no source at all and read\n",
      "    // as an em dash rather than as a number.\n",
      "    const rows=__perfScope('goals');\n",
      "    const objs=(rows||[]).map(g=>({id:g.id,title:g.name,description:g.description,status:g.status}));\n",
      "    const sel=objs[state.selectedObjectiveV4||0]||objs[0]||null;\n",
      "    const dash=__perfDash();\n",
      "    const depts=__perfScope('departments');\n",
      "    const teamOpts=(depts||[]).map(d=>`<option>${esc(d.name)}</option>`).join('');\n",
      "    const emptyLine=rows===null?'Unavailable — could not load objectives':'No objectives recorded yet';\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const body=objs.length\n",
      "      ?objs.map((o,oi)=>`<div class=\"okr-row parent click-hint\" data-v4-objective=\"${oi}\"><span>${oi+1}</span><div class=\"title\"><strong>${esc(o.title)}</strong><span>Key results not tracked</span></div><span style=\"${muted}\">${dash}</span><div><strong>${dash}</strong></div><div><span style=\"${muted}\">${dash}</span></div><span style=\"${muted}\">${dash}</span><span>›</span></div>`).join('')\n",
      "      :`<div class=\"okr-row\"><span style=\"grid-column:1/-1;text-align:center;padding:28px 12px;${muted}\">${emptyLine}</span></div>`;\n",
      "    const selHead=sel\n",
      "      ?`<div><span class=\"tiny\">Selected objective</span><h3 style=\"margin-top:5px;font-size:15px!important\">${esc(sel.title)}</h3></div>${sel.status?badge(sel.status):`<span style=\"${muted}\">${dash}</span>`}`\n",
      "      :`<div><span class=\"tiny\">Selected objective</span><h3 style=\"margin-top:5px;font-size:15px!important\">${emptyLine}</h3></div>`;\n",
      "    const selPerson=sel&&sel.description?`<p class=\"tiny\" style=\"line-height:1.55;margin:0\">${esc(sel.description)}</p>`:`<p class=\"tiny\" style=\"line-height:1.55;margin:0;${muted}\">Objectives carry no owner in the performance API yet, so no accountable person can be shown.</p>`;\n",
      "    return `<div class=\"inspo-grid\"><div class=\"inspo-main\"><section class=\"card\"><div class=\"table-tools\"><input placeholder=\"Search objectives or key results\"><select><option>All teams</option>${teamOpts}</select><select><option>All status</option><option>On Track</option><option>Needs Attention</option></select><div style=\"margin-left:auto\">${badge('Q3 2026')}</div></div><div class=\"objective-table\"><div class=\"okr-row header\"><span>#</span><span>Objective &amp; key results</span><span>Owner</span><span>Progress</span><span>Confidence</span><span>Due date</span><span></span></div>${body}</div></section></div><aside class=\"inspo-side\"><section class=\"card\"><div class=\"card-head\">${selHead}</div><div class=\"card-body\">${selPerson}<div class=\"summary-strip\" style=\"margin-top:12px\"><div class=\"summary-cell\"><span>Progress</span><strong>${dash}</strong></div><div class=\"summary-cell\"><span>Confidence</span><strong style=\"font-size:13px\">${dash}</strong></div><div class=\"summary-cell\"><span>Due date</span><strong style=\"font-size:11px\">${dash}</strong></div><div class=\"summary-cell\"><span>Key results</span><strong>${dash}</strong></div></div><div class=\"divider\"></div><h3>Linked initiatives</h3><div class=\"side-list\"><p class=\"tiny\" style=\"margin:0;${muted}\">Nothing links a goal to a project or task yet, so no initiative roll-up can be shown.</p></div><div class=\"divider\"></div><h3>Recent check-in</h3><p class=\"tiny\" style=\"line-height:1.55;${muted}\">Check-ins are not recorded against objectives yet.</p><div class=\"actions\" style=\"margin-top:12px\">${btn('Open objective detail','objective-detail','primary','target','0-0')}${btn('Update check-in','toast-generic','','reviews')}</div></div></section></aside></div>`;\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    label: "objectives-analytics",
    find: [
      "  function analyticsInspo(){\n",
      "    return `<div class=\"inspo-grid\"><div class=\"inspo-main\"><div class=\"kpis\" style=\"grid-template-columns:repeat(5,minmax(125px,1fr))\">${kpi('Completion rate','76.4%','+8.7pp vs June','chart','up','objectives')}${kpi('Total KPIs','48','No change','target','neutral','objectives')}${kpi('On track','32','+4','check','up','objectives')}${kpi('At risk','10','+2','alerts','down','objectives')}${kpi('Off track','6','+1','corrective','down','corrective')}</div><div class=\"grid two\"><section class=\"card\"><div class=\"card-head\"><div><h3>KPI trend over time</h3><p>Overall completion rate.</p></div></div><div class=\"card-body click-hint\" data-v4-enlarge=\"KPI trend over time\">${miniLine()}</div></section><section class=\"card\"><div class=\"card-head\"><div><h3>Target versus actual</h3><p>Performance by department.</p></div></div><div class=\"card-body bars\">${allowed('view_financial')?bar('Financial',78):financialMask()}${bar('Operations',74)}${bar('ICT',68)}${bar('People & Culture',84)}${bar('Client Experience',71)}</div></section></div><div class=\"grid three\"><section class=\"card\"><div class=\"card-head\"><h3>Department heatmap</h3></div><div class=\"card-body\"><div style=\"display:grid;grid-template-columns:repeat(5,1fr);gap:4px\">${[['Finance',78],['Operations',74],['ICT',68],['People',84],['Client',71],['Finance',82],['Operations',77],['ICT',72],['People',86],['Client',76],['Finance',85],['Operations',79],['ICT',74],['People',88],['Client',80]].map(x=>`<div style=\"padding:8px 4px;text-align:center;border-radius:6px;background:${x[1]>=82?'#eaf9f2':x[1]>=74?'#fff7e6':'#fff0f1'}\"><strong style=\"font-size:11px;font-weight:500\">${x[1]}%</strong><span style=\"display:block;font-size:11px;color:var(--muted)\">${x[0]}</span></div>`).join('')}</div></div></section><section class=\"card\"><div class=\"card-head\"><h3>Top 5 KPIs</h3></div><div class=\"card-body side-list\">${sideItem('Revenue growth','Financial','92.5%','green')}${sideItem('Cost optimisation','Operations','89.3%','green')}${sideItem('Customer satisfaction','Client Experience','87.6%','green')}${sideItem('System uptime','ICT','85.4%','green')}${sideItem('Employee engagement','People & Culture','83.1%','green')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Bottom 5 KPIs</h3></div><div class=\"card-body side-list\">${sideItem('Portfolio diversification','Financial','45.2%','red')}${sideItem('Product delivery timeliness','Operations','48.7%','red')}${sideItem('IT security compliance','ICT','52.1%','red')}${sideItem('Employee turnover','People & Culture','55.3%','amber')}${sideItem('First contact resolution','Client Experience','57.8%','amber')}</div></section></div><section class=\"card\"><div class=\"card-head\"><div><h3>KPI performance details</h3><p>Granular result, variance, owner and evidence status.</p></div></div><div class=\"table-wrap\"><table><thead><tr><th>KPI</th><th>Owner</th><th>Department</th><th>Target</th><th>Actual</th><th>Variance</th><th>Status</th><th>Updated</th></tr></thead><tbody>${[['Revenue Growth','Ashley Moyo','Finance','25.0M','23.1M','+8.4%','On Track'],['Cost Optimisation','Kundai Chikore','Operations','15.0%','13.6%','+9.3%','On Track'],['System Uptime','Tafadzwa Sibanda','ICT','99.0%','95.1%','-3.9%','At Risk'],['Customer Satisfaction','Nyasha Bhebhe','Client Experience','85.0%','87.6%','+2.6%','On Track'],['Employee Engagement','Tafadzwa Sibanda','People & Culture','75.0%','64.5%','-10.5%','At Risk']].map(r=>`<tr data-v4-kpi=\"${esc(r[0])}\"><td><strong>${r[0]}</strong></td><td>${person(r[1])}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${badge(r[6])}</td><td>13 Jul 2026</td></tr>`).join('')}</tbody></table></div></section></div><aside class=\"inspo-side\"><section class=\"card\"><div class=\"card-head\"><div><h3>Alerts & notifications</h3><p>Material KPI exceptions.</p></div>${smallBtn('View all','nav','alerts')}</div><div class=\"card-body side-list\">${sideItem('6 KPIs are off track','Immediate attention required','2h ago','red')}${sideItem('10 KPIs are at risk','Monitor closely','4h ago','amber')}${sideItem('3 KPIs due for review','Review cycle in progress','1d ago','')}${sideItem('Data update required','4 KPIs need manual evidence','2d ago','')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Recent commentary</h3></div><div class=\"card-body side-list\">${sideItem('Nyasha Bhebhe','Revenue growth remains ahead of plan','Finance','green')}${sideItem('Kundai Chikore','Operations efficiency improving','Operations','green')}${sideItem('Ashley Moyo','System uptime below planned maintenance target','ICT','amber')}</div>${btn('Add commentary','toast-generic','primary','reviews')}</section></aside></div>`;\n",
      "  }\n",
      ""
    ].join(""),
    repl: [
      "  function analyticsInspo(){\n",
      "    /* patched:objectives-analytics */\n",
      "    // WAS: a five-card strip (76.4% / 48 / 32 / 10 / 6), a drawn completion trend, five\n",
      "    // department bars, a fifteen-cell heat grid, invented top-five and bottom-five KPI\n",
      "    // league tables, a five-row KPI detail table with invented actuals and variances, four\n",
      "    // invented alerts and three invented commentary entries. `kpis` holds 0 rows and no\n",
      "    // endpoint records a KPI result, a KPI history or a variance.\n",
      "    //\n",
      "    // NOW: the strip comes from GET /performance/analytics/kpi, the department bars from\n",
      "    // GET /performance/analytics/departments/comparison, the detail table from GET /kpis and\n",
      "    // the alert rail from GET /performance/alerts. Everything with no source says so.\n",
      "    const dash=__perfDash();\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const note=t=>`<p class=\"tiny\" style=\"margin:0;line-height:1.55;${muted}\">${t}</p>`;\n",
      "    const ak=__perfObject('analyticsKpi');\n",
      "    const strip=kpi('Completion rate',ak?__perfPct(ak.averageProgress):dash,ak?'Average goal progress':'Unavailable','chart','up','objectives')\n",
      "      +kpi('Total KPIs',__perfNum('analyticsKpi','totalKPIs'),ak?'In the KPI registry':'Unavailable','target','neutral','objectives')\n",
      "      +kpi('Total goals',__perfNum('analyticsKpi','totalGoals'),ak?'Across all departments':'Unavailable','check','up','objectives')\n",
      "      +kpi('Goals without KPI',__perfNum('analyticsKpi','goalsWithoutKpi'),ak?'No measure attached':'Unavailable','alerts','down','objectives')\n",
      "      // Nothing records a KPI result against its target, so on-track / off-track cannot be counted.\n",
      "      +kpi('Off track',dash,'Not yet tracked','corrective','down','corrective');\n",
      "    const dc=__perfScope('deptComparison');\n",
      "    const bars=dc===null\n",
      "      ?note('Unavailable — could not load the department comparison.')\n",
      "      :!dc.some(d=>(d.goalsTotal||0)>0)\n",
      "        ?note('No department has goals recorded yet, so there is nothing to compare against target.')\n",
      "        :dc.map(d=>(!allowed('view_financial')&&/^financ/i.test(d.department))?financialMask():bar(d.department,Math.round(d.goalsCompletionRate||0))).join('');\n",
      "    const kr=__perfScope('kpis');\n",
      "    const kpiRows=(kr&&kr.length)\n",
      "      ?kr.map(k=>`<tr data-v4-kpi=\"${esc(k.name)}\"><td><strong>${esc(k.name)}</strong></td><td>${k.owner?person(k.owner):`<span style=\"${muted}\">${dash}</span>`}</td><td>${k.department?esc(k.department):dash}</td><td>${k.target?esc(k.target):dash}</td><td>${dash}</td><td>${dash}</td><td>${k.status?badge(k.status):dash}</td><td>${dash}</td></tr>`).join('')\n",
      "      :__perfEmptyRow('kpis',8,'KPIs');\n",
      "    const al=__perfScope('alerts');\n",
      "    const alertList=(al&&al.length)\n",
      "      ?al.slice(0,4).map(a=>sideItem(a.name,a.department||a.source||'—',__perfDate(a.raisedAt),String(a.severity||'').toLowerCase()==='critical'?'red':'amber')).join('')\n",
      "      :note(al===null?'Unavailable — could not load alerts.':'No alerts have been raised yet.');\n",
      "    return `<div class=\"inspo-grid\"><div class=\"inspo-main\"><div class=\"kpis\" style=\"grid-template-columns:repeat(5,minmax(125px,1fr))\">${strip}</div><div class=\"grid two\"><section class=\"card\"><div class=\"card-head\"><div><h3>KPI trend over time</h3><p>Overall completion rate.</p></div></div><div class=\"card-body\">${__perfNoSeries('KPI results are not stored period by period, so no completion trend can be drawn.')}</div></section><section class=\"card\"><div class=\"card-head\"><div><h3>Target versus actual</h3><p>Performance by department.</p></div></div><div class=\"card-body bars\">${bars}</div></section></div><div class=\"grid three\"><section class=\"card\"><div class=\"card-head\"><h3>Department heatmap</h3></div><div class=\"card-body\">${note('A heatmap needs a score per department per period. Neither is recorded yet.')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Top 5 KPIs</h3></div><div class=\"card-body side-list\">${note('KPIs carry a target but no recorded result, so they cannot be ranked.')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Bottom 5 KPIs</h3></div><div class=\"card-body side-list\">${note('KPIs carry a target but no recorded result, so they cannot be ranked.')}</div></section></div><section class=\"card\"><div class=\"card-head\"><div><h3>KPI performance details</h3><p>Granular result, variance, owner and evidence status.</p></div></div><div class=\"table-wrap\"><table><thead><tr><th>KPI</th><th>Owner</th><th>Department</th><th>Target</th><th>Actual</th><th>Variance</th><th>Status</th><th>Updated</th></tr></thead><tbody>${kpiRows}</tbody></table></div></section></div><aside class=\"inspo-side\"><section class=\"card\"><div class=\"card-head\"><div><h3>Alerts &amp; notifications</h3><p>Material KPI exceptions.</p></div>${smallBtn('View all','nav','alerts')}</div><div class=\"card-body side-list\">${alertList}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Recent commentary</h3></div><div class=\"card-body side-list\">${note('Commentary is not stored against KPIs yet.')}</div>${btn('Add commentary','toast-generic','primary','reviews')}</section></aside></div>`;\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    label: "objectives-registry",
    find: [
      "  function registryInspo(){\n",
      "    const rows=[['FIN-001','Revenue Growth (%)','Financial','Farai Muchengezi','Accounting','% Change','Monthly','Approved'],['FIN-002','Net Profit Margin (%)','Financial','Anesu Milambo','Accounting','(A-B)/A','Monthly','Approved'],['CUS-001','Customer Satisfaction (NPS)','Customer','Ropafadzo Zulu','Events / Survey','Average','Quarterly','Approved'],['CUS-002','Customer Retention Rate (%)','Customer','Takudzwa Chari','CRM','% of Total','Monthly','Pending'],['INT-001','Process Compliance (%)','Internal Process','Tendai Nyathi','Task Management','(A/B)*100','Monthly','Approved'],['INT-002','Cycle Time (Days)','Internal Process','Tatenda Chikomo','Procurement','Average','Weekly','Approved'],['LRN-001','Employee Engagement (%)','Learning & Growth','Chipo Dube','HR','Average','Quarterly','Pending'],['LRN-002','Training Completion Rate (%)','Learning & Growth','Ropafadzo Zulu','Task Management','(A/B)*100','Monthly','Approved']];\n",
      "    return `<div class=\"inspo-grid\"><div class=\"inspo-main\"><section class=\"card\"><div class=\"table-tools\"><input placeholder=\"Search KPIs by name, code or owner\"><select><option>All categories</option></select><select><option>All owners</option></select><select><option>All status</option></select><div style=\"margin-left:auto\">${btn('New KPI','create-kpi','primary','plus')}</div></div><div class=\"table-wrap\"><table><thead><tr><th>Code</th><th>KPI Name</th><th>Category</th><th>Owner</th><th>Data Source</th><th>Calculation</th><th>Frequency</th><th>Status</th><th></th></tr></thead><tbody>${rows.filter(r=>allowed('view_financial')||r[2]!=='Financial').map(r=>`<tr data-v4-kpi=\"${esc(r[1])}\"><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${person(r[3])}</td><td>${r[4]}</td><td><span class=\"goal-chip\">${r[5]}</span></td><td>${r[6]}</td><td>${badge(r[7])}</td><td>•••</td></tr>`).join('')}</tbody></table></div></section><div class=\"grid three\"><section class=\"card\"><div class=\"card-head\"><h3>Category summary</h3></div><div class=\"card-body\"><div class=\"summary-strip\"><div class=\"summary-cell\"><span>Financial</span><strong>7</strong></div><div class=\"summary-cell\"><span>Customer</span><strong>6</strong></div><div class=\"summary-cell\"><span>Internal</span><strong>6</strong></div><div class=\"summary-cell\"><span>Learning</span><strong>5</strong></div></div></div></section><section class=\"card\"><div class=\"card-head\"><h3>Department mapping</h3></div><div class=\"card-body side-list\">${sideItem('Finance Department','7 KPIs','29%')}${sideItem('Operations','6 KPIs','25%')}${sideItem('Sales & Marketing','5 KPIs','21%')}${sideItem('Human Resources','4 KPIs','17%')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Recent KPI updates</h3></div><div class=\"card-body side-list\">${sideItem('Net Profit Margin updated','Anesu Milambo','2h ago','green')}${sideItem('Retention rate submitted','Ropafadzo Zulu','5h ago','')}${sideItem('Cycle time updated','Takudzwa Chari','1d ago','green')}</div></section></div></div><aside class=\"inspo-side\"><section class=\"card\"><div class=\"card-head\"><h3>Integration mapping</h3>${smallBtn('View all','nav','access')}</div><div class=\"card-body side-list\">${sideItem('Accounting ERP','Connected','23 KPIs','green')}${sideItem('Portfolio Management','Connected','12 KPIs','green')}${sideItem('Task Management','Connected','18 KPIs','green')}${sideItem('HR / Payroll','Connected','14 KPIs','green')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Workflow rules</h3></div><div class=\"card-body side-list\">${sideItem('KPI Approval Flow','Level 2','Active','green')}${sideItem('KPI Review Flow','Level 2','Active','green')}${sideItem('KPI Update Flow','Level 1','Active','green')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>BSC pillar weights</h3></div><div class=\"card-body bars\">${bar('Financial',30)}${bar('Customer',25)}${bar('Internal Process',25)}${bar('Learning & Growth',20)}</div></section></aside></div>`;\n",
      "  }\n",
      ""
    ].join(""),
    repl: [
      "  function registryInspo(){\n",
      "    /* patched:objectives-registry */\n",
      "    // WAS: an eight-row KPI registry fixture (FIN-001 … LRN-002) with invented owners, data\n",
      "    // sources and calculations, a 7/6/6/5 category summary, a 7/6/5/4 department mapping,\n",
      "    // three invented \"recent updates\", four invented integrations with KPI counts, three\n",
      "    // invented workflow rules, and BSC pillar weights hardcoded at 30/25/25/20.\n",
      "    //\n",
      "    // NOW: the registry is GET /kpis (0 rows today), the department mapping is tallied from\n",
      "    // those same rows, and the pillar weights are the configured weights from\n",
      "    // GET /performance/config/pillars. Category, data source, calculation and update history\n",
      "    // are not fields on a KPI, so they read as em dashes.\n",
      "    const dash=__perfDash();\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const note=t=>`<p class=\"tiny\" style=\"margin:0;line-height:1.55;${muted}\">${t}</p>`;\n",
      "    const all=__perfScope('kpis');\n",
      "    const rows=(all||[]).filter(k=>allowed('view_financial')||!/^financ/i.test(k.department||''));\n",
      "    const body=rows.length\n",
      "      ?rows.map(k=>`<tr data-v4-kpi=\"${esc(k.name)}\"><td><strong>${k.code?esc(k.code):dash}</strong></td><td>${esc(k.name)}</td><td>${dash}</td><td>${k.owner?person(k.owner):`<span style=\"${muted}\">${dash}</span>`}</td><td>${dash}</td><td>${dash}</td><td>${k.frequency?esc(k.frequency):dash}</td><td>${k.status?badge(k.status):dash}</td><td>•••</td></tr>`).join('')\n",
      "      :__perfEmptyRow('kpis',9,'KPIs');\n",
      "    const pillars=__perfScope('pillarConfig');\n",
      "    // Configured BSC weights, never an attainment score.\n",
      "    const weightBars=pillars===null\n",
      "      ?note('Unavailable — could not load the pillar configuration.')\n",
      "      :pillars.length\n",
      "        ?pillars.map(p=>bar(p.displayName||p.name,p.weight==null?0:p.weight)).join('')\n",
      "        :note('No scorecard pillars are configured yet.');\n",
      "    const catCells=(pillars&&pillars.length?pillars:[]).map(p=>`<div class=\"summary-cell\"><span>${esc(p.displayName||p.name)}</span><strong>${dash}</strong></div>`).join('');\n",
      "    const catStrip=catCells\n",
      "      ?`<div class=\"summary-strip\">${catCells}</div>${note('KPIs are not linked to a scorecard pillar yet, so none can be counted per category.')}`\n",
      "      :note('No scorecard pillars are configured yet.');\n",
      "    const byDept={};\n",
      "    (all||[]).forEach(k=>{const d=k.department||'Unassigned';byDept[d]=(byDept[d]||0)+1});\n",
      "    const deptKeys=Object.keys(byDept);\n",
      "    const deptList=all===null\n",
      "      ?note('Unavailable — could not load the KPI registry.')\n",
      "      :deptKeys.length\n",
      "        ?deptKeys.map(d=>sideItem(d,byDept[d]+(byDept[d]===1?' KPI':' KPIs'),__perfPct(byDept[d]/all.length*100))).join('')\n",
      "        :note('No KPIs are registered yet, so there is nothing to map to a department.');\n",
      "    const jobs=__perfScope('syncJobs');\n",
      "    const jobList=jobs===null\n",
      "      ?note('Unavailable — could not load integration jobs.')\n",
      "      :jobs.length\n",
      "        ?jobs.slice(0,4).map(j=>sideItem(j.name,__perfLabel(j.status),'','')).join('')\n",
      "        :note('No integration jobs have run yet.');\n",
      "    return `<div class=\"inspo-grid\"><div class=\"inspo-main\"><section class=\"card\"><div class=\"table-tools\"><input placeholder=\"Search KPIs by name, code or owner\"><select><option>All categories</option></select><select><option>All owners</option></select><select><option>All status</option></select><div style=\"margin-left:auto\">${btn('New KPI','create-kpi','primary','plus')}</div></div><div class=\"table-wrap\"><table><thead><tr><th>Code</th><th>KPI Name</th><th>Category</th><th>Owner</th><th>Data Source</th><th>Calculation</th><th>Frequency</th><th>Status</th><th></th></tr></thead><tbody>${body}</tbody></table></div></section><div class=\"grid three\"><section class=\"card\"><div class=\"card-head\"><h3>Category summary</h3></div><div class=\"card-body\">${catStrip}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Department mapping</h3></div><div class=\"card-body side-list\">${deptList}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Recent KPI updates</h3></div><div class=\"card-body side-list\">${note('KPI edits are not returned with a timestamp, so no update history can be shown.')}</div></section></div></div><aside class=\"inspo-side\"><section class=\"card\"><div class=\"card-head\"><h3>Integration mapping</h3>${smallBtn('View all','nav','access')}</div><div class=\"card-body side-list\">${jobList}</div></section><section class=\"card\"><div class=\"card-head\"><h3>Workflow rules</h3></div><div class=\"card-body side-list\">${note('Approval and review workflows are not exposed by the performance API yet.')}</div></section><section class=\"card\"><div class=\"card-head\"><h3>BSC pillar weights</h3></div><div class=\"card-body bars\">${weightBars}</div></section></aside></div>`;\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    // Layer 2, reached from the "Open objective detail" button on the OKR tab. Three
    // hardcoded objectives, nine key results with current-vs-target values, milestones with
    // file sizes, linked projects, a trajectory chart and an 84% confidence forecast.
    label: "objectives-detail",
    find: [
      " function objectiveDetailPageV6(idx='0'){\n",
      "   const data=[\n",
      "    ['Drive sustainable revenue growth','Rumbidzai Chaza','Chief Commercial Officer',78,'High','30 Sep 2026',['Increase recurring revenue to $4.5M ARR',82,'$3.69M','$4.50M'],['Acquire 120 new enterprise customers',65,'78','120'],['Achieve Net Revenue Retention of 115%',88,'112%','115%']],\n",
      "    ['Deliver world-class customer experience','Kudakwashe Biti','Head of Customer Success',61,'Medium','30 Sep 2026',['Improve CSAT score to 4.6/5',72,'4.2','4.6'],['Reduce response time to <2h',58,'2.8h','2h'],['Achieve 95% SLA compliance',46,'88%','95%']],\n",
      "    ['Build high-performing, engaged teams','Tatenda Mlambo','Head of People & Culture',84,'High','30 Sep 2026',['Increase engagement score to 80%',87,'78%','80%'],['Increase training completion to 95%',79,'88%','95%'],['Improve succession coverage',86,'81%','90%']]\n",
      "   ];\n",
      "   const d=data[Math.max(0,Math.min(data.length-1,+idx||0))];\n",
      "   const krs=d.slice(6);\n",
      "   return `<div class=\"page layer-v6\"><div class=\"layer-breadcrumb-v6\">${backV6('Objectives & Key Results','objectives')}<span>›</span><span>Objective detail</span></div>${pageHead('Goal execution',d[0],'Objective health, key results, milestones, linked work and cross-team accountability.',btn('Update check-in','toast-generic','primary','reviews')+btn('More','toast-generic','','more'))}<div class=\"layer-hero-v6\"><div><div class=\"layer-hero-meta-v6\">${personV5(d[1],d[2])}<div>${badge('On Track')}</div><div><strong>${d[3]}%</strong> progress</div><div><strong>${d[5]}</strong> due</div><div><strong>${d[4]}</strong> confidence</div></div></div><span class=\"layer-label-v6\">Layer 2 · Objective workspace</span></div>${chain6('Sustainable growth','Expand Southern Africa',d[0])}<div class=\"detail-grid-v6\"><div class=\"detail-main-v6\">${panel6('Key results','Measured outcomes contributing to this objective',`<div class=\"kr-list-v6\">${krs.map((kr,i)=>`<div class=\"kr-row-v6 clickable\" data-v6-kr=\"${i}\"><span class=\"kr-index-v6\">${i+1}</span><div><h4>${esc(kr[0])}</h4><p>KR 1.${i+1} · system + owner evidence</p></div><div><strong>${kr[1]}%</strong>${progress(kr[1],kr[1]<60?'red':kr[1]<72?'amber':'emerald')}</div><div><span class=\"micro\">Current</span><strong>${esc(kr[2])}</strong><span class=\"micro\"> / ${esc(kr[3])}</span></div><div>${badge(kr[1]<60?'Needs Attention':'On Track')}</div><button class=\"btn small\" data-v6-kr=\"${i}\">Open</button></div>`).join('')}</div>`)}${panel6('Milestones & evidence','Delivery checkpoints with linked controlled evidence',`<div class=\"data-row-v6\"><strong>Market launch completed</strong><span>15 May 2026</span><span>${badge('Completed')}</span><span>Go-to-market-plan.pdf</span><span>482 KB</span></div><div class=\"data-row-v6\"><strong>Partner programme completed</strong><span>31 May 2026</span><span>${badge('Completed')}</span><span>Partner-playbook.pdf</span><span>612 KB</span></div><div class=\"data-row-v6\"><strong>Enterprise campaign in progress</strong><span>30 Sep 2026</span><span>${badge('In Progress')}</span><span>Campaign-plan.docx</span><span>310 KB</span></div>`)}${panel6('Linked projects & tasks','Operational work driving objective delivery',`<div class=\"data-row-v6 clickable\" data-v6-open-project=\"Southern Africa Expansion\"><strong>Enterprise Growth Campaign</strong><span>${personV5('Tatenda Mlambo')}</span><span>8 / 12 tasks</span><span>${progress(67,'emerald')}67%</span><span>${badge('On Track')}</span></div><div class=\"data-row-v6 clickable\" data-v6-open-project=\"Pricing Optimisation\"><strong>Pricing Optimisation</strong><span>${personV5('Tawanda Moyo')}</span><span>5 / 9 tasks</span><span>${progress(56,'amber')}56%</span><span>${badge('In Progress')}</span></div><div class=\"data-row-v6 clickable\" data-v6-open-project=\"Channel Partner Expansion\"><strong>Channel Partner Expansion</strong><span>${personV5('Ruvimbo Ndlovu')}</span><span>6 / 10 tasks</span><span>${progress(60,'emerald')}60%</span><span>${badge('On Track')}</span></div>`)}${panel6('Outcome trajectory','Actual, target and forward-looking confidence',`${trendV5(62,d[3])}<div class=\"metrics-v6\">${metric6('Forecast finish','84%','Q3 expected','#6517ff')}${metric6('Target','80%','Approved threshold','#00b779')}${metric6('Evidence coverage','96%','3 sources','#006cff')}${metric6('Downside risk','12%','Low','#ffad00')}</div>`)}</div><aside class=\"detail-aside-v6\">${panel6('Latest check-in','Owner commentary and management context',`${personV5(d[1],d[2])}<p style=\"font-size:11px;line-height:1.6;color:var(--muted)\">Revenue momentum remains strong with double-digit recurring growth and solid enterprise pipeline. Partner activity is delivering results, while pricing optimisation needs targeted follow-through.</p><div class=\"tag-row-v6\"><span class=\"tag-v6\">Revenue</span><span class=\"tag-v6\">Customers</span><span class=\"tag-v6\">Partnerships</span></div>`)}${panel6('Health signals','Three independent indicators',`<div class=\"health-grid-v6\"><div class=\"health-cell-v6\"><strong>${d[3]}%</strong><span>Progress</span></div><div class=\"health-cell-v6\"><strong>${d[4]}</strong><span>Confidence</span></div><div class=\"health-cell-v6\"><strong>On Track</strong><span>Schedule</span></div></div>`)}${panel6('Contributors','Cross-functional owners accountable for delivery',`${avatarStack6(['Rumbidzai Chaza','Tatenda Mlambo','Tawanda Moyo','Nyasha Moyo','Farai Muchengezi'])}<div class=\"tiny\" style=\"margin-top:6px\">9 contributors · 4 departments</div>`)}${panel6('Activity','Recent objective-level changes',`<div class=\"side-list\">${sideItem('Check-in added','Rumbidzai Chaza','10 Aug 2026','green')}${sideItem('KR 1.2 updated','Tawanda Moyo','08 Aug 2026','')}${sideItem('Milestone updated','Campaign launch','07 Aug 2026','')}${sideItem('Evidence added','Partner programme','04 Aug 2026','green')}</div>`)}${panel6('Decision intelligence','Forward-looking enterprise insight',`<div class=\"insight-callout-v5\"><strong>Confidence remains high at 84%</strong><p>Maintaining pricing optimisation velocity above 55% and clearing one commercial dependency is projected to move the objective to 83–86% by quarter end.</p></div>`)}</aside></div></div>`;\n",
      " }\n",
      "\n",
      ""
    ].join(""),
    repl: [
      " function objectiveDetailPageV6(idx='0'){\n",
      "   /* patched:objectives-detail */\n",
      "   // Layer 2 of /performance/objectives, opened by \"Open objective detail\". WAS: three\n",
      "   // hardcoded objectives with owners, 78/61/84% progress, nine key results with current and\n",
      "   // target values ($3.69M of $4.50M …), three invented milestones with file names and byte\n",
      "   // sizes, three invented projects with 8-of-12 task counts, a drawn outcome trajectory,\n",
      "   // \"Evidence coverage 96%\", \"9 contributors · 4 departments\", four activity entries and a\n",
      "   // \"Confidence remains high at 84%\" insight predicting an 83–86% finish.\n",
      "   //\n",
      "   // GET /performance/goals returns id / name / description / status only. Everything else on\n",
      "   // this page has no source, so it says so rather than showing a number.\n",
      "   const rows=__perfScope('goals')||[];\n",
      "   const d=rows[Math.max(0,Math.min(rows.length-1,parseInt(String(idx),10)||0))]||null;\n",
      "   const dash=__perfDash();\n",
      "   const muted='font-size:11px;line-height:1.6;color:var(--muted,#6b7280)';\n",
      "   const note=x=>`<p style=\"${muted};margin:0\">${x}</p>`;\n",
      "   const head=`<div class=\"page layer-v6\"><div class=\"layer-breadcrumb-v6\">${backV6('Objectives & Key Results','objectives')}<span>›</span><span>Objective detail</span></div>`;\n",
      "   if(!d) return `${head}${pageHead('Goal execution','Objective detail','Objective health, key results, milestones, linked work and cross-team accountability.')}${panel6('Objective','Nothing to show yet',note(__perfScope('goals')===null?'Unavailable — objectives could not be loaded.':'No objectives have been recorded yet, so there is no detail to open.'))}</div>`;\n",
      "   return `${head}${pageHead('Goal execution',d.name,'Objective health, key results, milestones, linked work and cross-team accountability.',btn('Update check-in','toast-generic','primary','reviews')+btn('More','toast-generic','','more'))}<div class=\"layer-hero-v6\"><div><div class=\"layer-hero-meta-v6\"><div><strong>${dash}</strong> owner</div><div>${d.status?badge(d.status):`<span style=\"${muted}\">${dash}</span>`}</div><div><strong>${dash}</strong> progress</div><div><strong>${dash}</strong> due</div><div><strong>${dash}</strong> confidence</div></div></div><span class=\"layer-label-v6\">Layer 2 · Objective workspace</span></div><div class=\"detail-grid-v6\"><div class=\"detail-main-v6\">${panel6('Objective','Description recorded against this goal',note(d.description?esc(d.description):'No description was recorded for this objective.'))}${panel6('Key results','Measured outcomes contributing to this objective',note('Key results are not part of the goals API yet, so none can be listed.'))}${panel6('Milestones & evidence','Delivery checkpoints with linked controlled evidence',note('No milestones or evidence are recorded against an objective yet.'))}${panel6('Linked projects & tasks','Operational work driving objective delivery',note('Nothing links a project or task to an objective yet.'))}${panel6('Outcome trajectory','Actual, target and forward-looking confidence',`${__perfNoSeries('Objective progress is not stored period by period, so no trajectory can be drawn.')}<div class=\"metrics-v6\">${metric6('Forecast finish',dash,'Not yet tracked','#6517ff')}${metric6('Target',dash,'Not yet tracked','#00b779')}${metric6('Evidence coverage',dash,'Not yet tracked','#006cff')}${metric6('Downside risk',dash,'Not yet tracked','#ffad00')}</div>`)}</div><aside class=\"detail-aside-v6\">${panel6('Latest check-in','Owner commentary and management context',note('Check-ins are not recorded against objectives yet.'))}${panel6('Health signals','Three independent indicators',`<div class=\"health-grid-v6\"><div class=\"health-cell-v6\"><strong>${dash}</strong><span>Progress</span></div><div class=\"health-cell-v6\"><strong>${dash}</strong><span>Confidence</span></div><div class=\"health-cell-v6\"><strong>${dash}</strong><span>Schedule</span></div></div>`)}${panel6('Contributors','Cross-functional owners accountable for delivery',note('Objectives carry no contributors in the performance API yet.'))}${panel6('Activity','Recent objective-level changes',note('No objective-level change history is returned by the API.'))}${panel6('Decision intelligence','Forward-looking enterprise insight',note('A forecast needs progress history. None is recorded, so no projection is offered.'))}</aside></div></div>`;\n",
      " }\n",
      ""
    ].join(""),
  },
]
