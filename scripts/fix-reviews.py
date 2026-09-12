#!/usr/bin/env python3
"""Replace the V10 reviews function body with the V1 reference design layout."""
import re

FILE = 'components/performance-v22-mock/matanho-performance-runtime.js'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# === Replacement 1: First V10 reviews function (line ~905) ===
# Replace the pageHead call
old_pagehead = "pageHead('Performance Management','Performance Reviews','Conduct, monitor, calibrate and complete 360-degree review cycles across the organization.',((allowed('initiate_reviews')||state.role==='SysAdmin')?btn('Start review cycle','start-review','primary','plus'):'')+btn('Cycle analytics','toast-generic','','chart'))"

new_pagehead = "pageHead('Performance Reviews','Performance Reviews','Conduct, monitor, calibrate and digitally sign cyclical 360-degree performance reviews.',btn('Review templates','nav','','file','vault')+((allowed('initiate_reviews')||state.role==='SysAdmin')?btn('Start review cycle','start-review','primary','plus'):''))"

count1 = content.count(old_pagehead)
print(f"Found {count1} occurrences of V10 pageHead")
content = content.replace(old_pagehead, new_pagehead, 1)

# Replace KPIs: 5-column style -> 6 KPIs without style
old_kpis = r'<div class=\"kpis\" style=\"grid-template-columns:repeat(5,minmax(130px,1fr))\">${kpi(\'Pending reviews\',\'32\',\'28% of cycle\',\'clock\',\'down\',\'reviews\')}${kpi(\'Submitted\',\'41\',\'36%\’,\'reviews\',\'up\',\'reviews\')}${kpi(\'Calibrated\',\'19\',\'16%\’,\'target\',\'up\',\'reviews\')}${kpi(\'Completed\',\'22\',\'20%\’,\'check\',\'up\',\'reviews\')}${kpi(\'Overall completion\',\'56%\’,\'114 of 200 stages\',\'chart\',\'up\',\'reviews\')}</div>'

new_kpis = r'<div class=\"kpis\">${kpi(\'Pending reviews\',\'32\',\'28% of cycle\',\'clock\',\'down\',\'reviews\')}${kpi(\'Submitted\',\'41\',\'36% of cycle\',\'reviews\',\'up\',\'reviews\')}${kpi(\'Calibrated\',\'19\',\'16% of cycle\',\'target\',\'up\',\'reviews\')}${kpi(\'Completed\',\'22\',\'20% of cycle\',\'check\',\'up\',\'reviews\')}${kpi(\'Overall completion\',\'56%\’,\'114 of 200 stages\',\'chart\',\'up\',\'reviews\')}${kpi(\'Sign-offs due\',\'11\',\'Within 5 days\',\'alerts\',\'down\',\'reviews\')}</div>'

count2 = content.count(old_kpis)
print(f"Found {count2} occurrences of V10 KPIs")
content = content.replace(old_kpis, new_kpis, 1)

# Replace the layout div: grid -> review-layout class
old_layout = '<div style=\"display:grid;grid-template-columns:300px minmax(0,1fr);gap:10px\">'
new_layout = '<div class=\"review-layout\">'
count3 = content.count(old_layout)
print(f"Found {count3} occurrences of V10 layout div")
content = content.replace(old_layout, new_layout, 1)

# Replace the left panel: remove tabs, add card-head
old_left_tabs = '<div class=\"tabs\"><button class=\"tab active\">Employees</button><button class=\"tab\">Teams</button></div><div class=\"table-tools\"><input placeholder=\"Search employee\"></div>'
new_left_tabs = '<div class=\"card-head\"><div><h3>Employees</h3><p>FY2026 Mid-Year Review.</p></div></div>'
count4 = content.count(old_left_tabs)
print(f"Found {count4} occurrences of V10 left panel tabs")
content = content.replace(old_left_tabs, new_left_tabs, 1)

# Replace person-avatar in employee rows: ${photo(x.name,'md')} -> ${initials(x.name)}
old_photo_emp = '${photo(x.name,\'md\')}'
new_photo_emp = '${initials(x.name)}'
count5 = content.count(old_photo_emp)
print(f"Found {count5} occurrences of photo() in employee rows")
content = content.replace(old_photo_emp, new_photo_emp, 1)

# Replace person-avatar in card head: ${photo(r.name,'md')} -> ${initials(r.name)} 
old_photo_r = '${photo(r.name,\'md\')}'
new_photo_r = '${initials(r.name)}'
count6 = content.count(old_photo_r)
print(f"Found {count6} occurrences of photo(r.name)")
content = content.replace(old_photo_r, new_photo_r, 1)

# Replace the right panel card-head: remove summary-strip, add person-avatar and badge
# The old right panel starts with: <section class="card"><div class="card-head"><div class="cell-main"><span class="person-avatar">${photo(r.name,'md')}...
# We need to replace from <span class="person-avatar">${initials(r.name)} to the end of summary-strip
old_cardhead_start = '<span class=\"person-avatar\">${initials(r.name)}</span><div class=\"cell-copy\"><strong style=\"font-size:14px!important\">${esc(r.name)}</strong><span>${esc(r.role)} · ${esc(r.dept)}</span></div></div><div class=\"summary-strip\" style=\"width:min(580px,60%)\"><div class=\"summary-cell\"><span>Review cycle</span><strong style=\"font-size:10px\">FY2026 Mid-Year</strong></div><div class=\"summary-cell\"><span>Review status</span><strong style=\"font-size:10px\">${r.status}</strong></div><div class=\"summary-cell\"><span>Due date</span><strong style=\"font-size:10px\">${r.due}</strong></div><div class=\"summary-cell\"><span>KPI score</span><strong>${r.kpi}%</strong></div></div></div>'

new_cardhead_start = '<div class=\"person-avatar\">${initials(r.name)}</div><div class=\"cell-copy\"><strong style=\"font-size:14px\">${esc(r.name)}</strong><span>${esc(r.role)} · ${esc(r.dept)}</span></div></div><div class=\"actions\">${badge(r.status)}${smallBtn(\'Open document\',\'open-doc\',\'REV-2026-088\')}</div></div>'

count7 = content.count(old_cardhead_start)
print(f"Found {count7} occurrences of V10 card-head start")
content = content.replace(old_cardhead_start, new_cardhead_start, 1)

# Replace the right panel tabs: standard tabs -> review-form tabs (already similar, keep)

# Replace the card-body content: grid three -> review-form-grid
# Old: <div class="card-body" style="padding-top:11px!important"><div class="grid three">
# New: <div class="card-body" style="padding-top:14px"><div class="review-form-grid">
oldCardBody = '<div class=\"card-body\" style=\"padding-top:11px!important\"><div class=\"grid three\">'
newCardBody = '<div class=\"card-body\" style=\"padding-top:14px\"><div class=\"review-form-grid\">'
count8 = content.count(oldCardBody)
print(f"Found {count8} occurrences of V10 card-body start")
content = content.replace(oldCardBody, newCardBody, 1)

# Replace Competency assessment box: h3 -> h4, remove bar-row format, use competency()
oldComp = '<div class=\"review-box\"><h3>Competency assessment</h3>${[[\'Analytical Thinking\',4.2],[\'Financial Acumen\',4.5],[\'Attention to Detail\',4.3],[\'Communication\',4.0],[\'Team Collaboration\',4.1],[\'Initiative & Ownership\',4.4]].map(x=>`<div class=\"bar-row\"><strong>${x[0]}</strong><div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:${x[1]*20}%\"></div></div><strong>${x[1]}</strong></div>`).join(\'\')}</div>'

newComp = '<div class=\"review-box\"><h4>Competency assessment</h4>${competency(\'Analytical thinking\',4.2)}${competency(\'Financial acumen\',4.5)}${competency(\'Communication\',4.0)}${competency(\'Team collaboration\',4.1)}${competency(\'Initiative & ownership\',4.4)}</div>'

count9 = content.count(oldComp)
print(f"Found {count9} occurrences of V10 competency box")
content = content.replace(oldComp, newComp, 1)

# Replace KPI summary box: h3 -> h4, summary-strip -> donut + bars
oldKpiBox = '<div class=\"review-box\"><h3>KPI summary</h3><div class=\"summary-strip\"><div class=\"summary-cell\"><span>KPI score</span><strong>${r.kpi}%</strong></div><div class=\"summary-cell\"><span>Revenue growth</span><strong>92%</strong></div><div class=\"summary-cell\"><span>Cost optimisation</span><strong>85%</strong></div><div class=\"summary-cell\"><span>Forecast accuracy</span><strong>78%</strong></div></div></div>'

newKpiBox = '<div class=\"review-box\"><h4>KPI summary</h4><div class=\"donut-layout\" style=\"min-height:125px\"><div class=\"donut\" style=\"width:105px;background:conic-gradient(var(--brand) 0 ${r.kpi}%,#eceef4 ${r.kpi}% 100%)\"><div class=\"donut-center\"><strong>${r.kpi}%</strong><span>KPI score</span></div></div></div><div class=\"bars\">${bar(\'Revenue / output\',92)}${bar(\'Cost / efficiency\',85)}${bar(\'Forecast / quality\',78)}</div></div>'

count10 = content.count(oldKpiBox)
print(f"Found {count10} occurrences of V10 KPI summary box")
content = content.replace(oldKpiBox, newKpiBox, 1)

# Replace Goals achieved box: h3 -> h4, summary-strip -> metric-pair
oldGoals = '<div class=\"review-box\"><h3>Goals achieved</h3><div class=\"summary-strip\"><div class=\"summary-cell\"><span>Achieved</span><strong style=\"color:var(--emerald)\">4</strong></div><div class=\"summary-cell\"><span>Partial</span><strong style=\"color:var(--amber)\">1</strong></div><div class=\"summary-cell\"><span>Not achieved</span><strong style=\"color:var(--red)\">0</strong></div></div></div></div>'

newGoals = '<div class=\"review-box\"><h4>Goals achieved</h4><div class=\"metric-pair\"><div class=\"metric-box\"><span>Achieved</span><strong>4</strong></div><div class=\"metric-box\"><span>Partial</span><strong>1</strong></div></div><div class=\"divider\"></div><p class=\"tiny\">Performance evidence is system-populated from approved goals, tasks and KPI records for the review period.</p></div>'

count11 = content.count(oldGoals)
print(f"Found {count11} occurrences of V10 goals box")
content = content.replace(oldGoals, newGoals, 1)

# Replace the second row of review boxes: grid three -> separate boxes
# Manager feedback
oldMgr = '<div class=\"review-box\"><h3>Manager feedback</h3><p class=\"tiny\" style=\"line-height:1.6\">Strong analytical capability, consistent delivery and proactive issue identification. Continue building stakeholder communication and cross-functional influence.</p>${person(\'Farai Muchengezi\',\'Direct Manager\')}</div>'
newMgr = '<div class=\"review-box\"><h4>Manager feedback</h4><p class=\"tiny\">Strong analytical skills and a deep understanding of the work. Consistently delivers high-quality outputs and identifies opportunities for improvement.</p><div class=\"list-row\"><span class=\"tiny\">Farai Muchengezi · Direct Manager</span><span class=\"tiny\">10 Jul</span></div></div>'
count12 = content.count(oldMgr)
print(f"Found {count12} occurrences of V10 manager feedback")
content = content.replace(oldMgr, newMgr, 1)

# Self-assessment -> Self assessment
oldSelf = '<div class=\"review-box\"><h3>Self-assessment</h3><p class=\"tiny\" style=\"line-height:1.6\">Progress has been strong across core KPIs. The next cycle focus is stronger commercial context, communication and leadership impact.</p>${person(r.name,\'Employee\')}</div>'
newSelf = '<div class=\"review-box\"><h4>Self assessment</h4><p class=\"tiny\">I am proud of progress on my KPIs and contribution to key initiatives. I will focus on stakeholder communication and presenting insights to leadership.</p><div class=\"list-row\"><span class=\"tiny\">${esc(r.name)}</span><span class=\"tiny\">09 Jul</span></div></div>'
count13 = content.count(oldSelf)
print(f"Found {count13} occurrences of V10 self-assessment")
content = content.replace(oldSelf, newSelf, 1)

# Peer feedback
oldPeer = '<div class=\"review-box\"><h3>Peer feedback</h3><div class=\"side-list\">${sideItem(\'Natasha Chari\',\'Always willing to help and share knowledge\',\'10 Jul\',\'green\')}${sideItem(\'Tinashe Muchengti\',\'Detail-oriented and reliable\',\'09 Jul\',\'green\')}</div></div></div>'
newPeer = '<div class=\"review-box\"><h4>Peer feedback</h4><div class=\"list\"><div class=\"list-row\"><div class=\"list-main\"><strong>Natasha Chari</strong><span>Collaborative and dependable.</span></div><span class=\"stars\">\\u2605\\u2605\\u2605\\u2605\\u2606</span></div><div class=\"list-row\"><div class=\"list-main\"><strong>Tinashe Muchengti</strong><span>Detail-oriented and responsive.</span></div><span class=\"stars\">\\u2605\\u2605\\u2605\\u2605\\u2606</span></div></div></div>'
count14 = content.count(oldPeer)
print(f"Found {count14} occurrences of V10 peer feedback")
content = content.replace(oldPeer, newPeer, 1)

# Replace the final recommendation box with recommended rating + save/finalize
oldFinal = '<div class=\"review-box\" style=\"margin-top:10px\"><div class=\"filters\" style=\"justify-content:space-between\"><div><h3>Final recommendation</h3><span class=\"tiny\">Recommended rating: ${esc(r.rating)}</span></div><div class=\"actions\">${btn(\'Save draft\',\'review-save\',\'\',\'file\')}${btn(\'Submit review\',\'review-finalize\',\'primary\',\'check\')}</div></div></div></div></section></div></div>`;'

newFinal = '<div class=\"divider\"></div><div style=\"display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap\"><div><span class=\"tiny\">Recommended rating</span><strong style=\"display:block;color:var(--brand);font-size:14px\">${esc(r.rating)}</strong></div><div class=\"actions\">${btn(\'Save draft\',\'review-save\',\'\')}${btn(\'Finalize review\',\'review-finalize\',canManage?\'primary\'=\'\')}</div></div></div></section></div></div>`;'

count15 = content.count(oldFinal)
print(f"Found {count15} occurrences of V10 final box")
content = content.replace(oldFinal, newFinal, 1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nReplacements done: pageHead={count1}, kpis={count2}, layout={count3}, tabs={count4}, photo_emp={count5}, photo_r={count6}, cardhead={count7}, cardbody={count8}, competency={count9}, kpiBox={count10}, goals={count11}, mgr={count12}, self={count13}, peer={count14}, final={count15}")
