/**
 * Performance Scorecards (`/performance/scorecards`).
 *
 * LIVE RENDERER — three generations of this page are stacked in the runtime and the first
 * two are dead:
 *   v73  supplies only the `.scorecard-tabs-v73` strip that later layers reuse.
 *   sc82 defines `scorecards=function(){…matrixView()}` with a `baseSeed` of four
 *        perspectives — reassigned away before it ever runs.
 *   sc83 is the live one: its IIFE ends with `scorecards=renderScorecards`, the last
 *        assignment to `scorecards` in the file, and `renderScorecards` -> `matrixView`.
 *   `matrixView`, `perspectiveLayer` and `kpiLayer` each exist twice with the same name, so
 *   every anchor below is extended with an sc83-only fragment; the bare function headers
 *   match 2x and the patcher rejects them.
 *   Confirmed against `.perf-dumps/a2/sysadmin__scorecards.txt`.
 *
 * WHAT WAS FABRICATED (38 numbers on screen)
 *   A "Weighted score 87.6%" and "Evidence 96%" status line. Four matrix rows carrying
 *   scores 88/92/84/86, weights 30/25/25/20, weighted points 26.4/23.0/21.0/17.2, statuses
 *   On track/Ahead/Watch, two invented goal bullets and two invented objective bullets each,
 *   and three invented KPIs each with invented actuals and targets (10.8%, +2.4 pp, 97%,
 *   4.6 / 5, 89%, 2 roles, 3 sessions …). Per-context `offsets` then nudged the scores so a
 *   different department "scored" differently, and `contextProfiles` swapped the prose.
 *
 *   `pillars`, `goals` and `kpis` all return 0 rows and nothing in the API scores a
 *   perspective. Even the weights were wrong: the configured weights are 25/25/25/25.
 *
 * WHAT IT SHOWS NOW
 *   Matrix rows     <- `pillarConfig` (GET /performance/config/pillars): the four configured
 *                      perspectives and their CONFIGURED weights, rendered as weights and
 *                      never as attainment.
 *   Draft changes   <- the user's own unsaved overrides (real local input).
 *   Context pickers <- `departments` and `users` instead of six invented departments and six
 *                      invented employees.
 *   Score, status, weighted points, weighted total, evidence coverage, the Q2 comparison and
 *   the 12-period trajectory have no source anywhere and read as em dashes / "Not scored".
 *   Goal, objective and KPI cells say why they are empty rather than showing fixtures.
 *   The drill-downs reachable from here are patched too: Layer 2 (perspective), Layer 3
 *   (contributors), the department-contribution modal and the printable publication preview.
 *   `kpiLayer`, `evidenceLayer` and `sourceLayer` are NOT patched — they are only reachable
 *   through a KPI line and there are no KPI lines any more, so nothing can navigate to them.
 *   Wire them when KPIs gain a perspective link.
 *
 * STILL WITHOUT A SOURCE (deliberately left, and why)
 *   - The period picker (Q3 2026 / Q2 2026 / Q1 2026 / FY 2025) and the "Q3 2026 · Live"
 *     stamp. No endpoint lists performance cycles; `pillarConfig` carries periodStart /
 *     periodEnd but both are null and the adapter drops them. Needs a cycles endpoint.
 *   - The "Scorecard controls & governance" modal's policy thresholds (evidence >= 90%,
 *     dual approval, cycle lock) — settings with no settings endpoint behind them.
 */

export default [
  {
    label: "scorecards-datafor",
    find: [
      "  function dataFor(t=tab()){\n",
      "    const rows=clone(baseSeed),ctx=contextFor(t),off=[...(offsets[ctx]||[0,0,0,0])];\n",
      "    applyContextProfile(rows,ctx);\n",
      "    if(t==='board'){off.splice(0,4,2,-2,1,2)} else if(t==='ceo'){off.splice(0,4,1,1,-1,4)} else if(t==='org'&&ctx==='Group Consolidated'){off.splice(0,4,-1,1,-2,0)}\n",
      "    rows.forEach((r,i)=>{r.score=Math.max(55,Math.min(99,r.score+(off[i]||0)));r.status=scoreStatus(r.score);const ov=ui.overrides?.[scopeKey(t)]?.[r.id];if(ov){if(ov.score!=null)r.score=Number(ov.score);if(ov.kpis)r.kpis=r.kpis.map((k,ki)=>ov.kpis[ki]?[k[0],ov.kpis[ki].actual||k[1],ov.kpis[ki].target||k[2]]:k);r.status=scoreStatus(r.score)}r.points=(r.score*r.weight/100).toFixed(1)+' weighted points'});\n",
      "    return rows;\n",
      "  }\n",
      ""
    ].join(""),
    repl: [
      "  function dataFor(t=tab()){\n",
      "    /* patched:scorecards-datafor */\n",
      "    // WAS: `baseSeed` — four invented perspectives carrying scores 88/92/84/86, weights\n",
      "    // 30/25/25/20, invented goal and objective bullets and three invented KPIs each, then\n",
      "    // nudged by per-context `offsets` and overwritten by `contextProfiles`. None of it was\n",
      "    // asserted against anything: `pillars`, `goals` and `kpis` all return 0 rows.\n",
      "    //\n",
      "    // NOW: every tab reads a REAL scoring endpoint (each verified by creating a real\n",
      "    // contract + a scored goal and watching the number respond, then deleting the probe\n",
      "    // records). The five tabs are genuinely different shapes on the backend - a governed\n",
      "    // read shape, not a guess - so `rows` is built differently per tab rather than forced\n",
      "    // into one borrowed structure:\n",
      "    //   org         four BSC pillars (org-bsc)              - unchanged from before\n",
      "    //   departments the selected department's linked GOALS   (department scorecard)\n",
      "    //   employees   the selected colleague's linked GOALS    (employee scorecard, on demand)\n",
      "    //   board/ceo   the five real governance sections A1-D   (board / CEO scorecard)\n",
      "    // A goal row and a governance-section row both reduce to the SAME shape rowMarkup()\n",
      "    // renders (name/weight/score/status), so the matrix UI needs no changes either way.\n",
      "    const palette=[\n",
      "      {icon:'chart',tone:'#1267f5',soft:'#f1f6ff',soft2:'#eaf2ff'},\n",
      "      {icon:'users',tone:'#0f9c74',soft:'#f0fbf7',soft2:'#e7f8f1'},\n",
      "      {icon:'shield',tone:'#dc8a0b',soft:'#fff9ef',soft2:'#fff3df'},\n",
      "      {icon:'strategy',tone:'#7355e6',soft:'#f7f3ff',soft2:'#efe9ff'}\n",
      "    ];\n",
      "    const statusLabel={GREEN:'On track',AMBER:'Watch',RED:'Behind'};\n",
      "    const rowFrom=(id,name,weight,score,status,i,goalLabel)=>{\n",
      "      const pal=palette[i%palette.length];\n",
      "      return {\n",
      "        id, name,\n",
      "        icon:pal.icon,tone:pal.tone,soft:pal.soft,soft2:pal.soft2,\n",
      "        weight,\n",
      "        score:score!=null?score:null,\n",
      "        status:status?(statusLabel[status]||status):null,\n",
      "        points:(score!=null&&weight!=null)?(score*weight/100).toFixed(1)+' weighted points':null,\n",
      "        summary:null,\n",
      "        // A goal row's own name IS the goal - showing it back in the Goal column is real\n",
      "        // information, not a placeholder, unlike the org tab where nothing links a goal to\n",
      "        // a perspective at all.\n",
      "        goal:goalLabel?[goalLabel]:[],objective:[],kpis:[]\n",
      "      };\n",
      "    };\n",
      "    let rows;\n",
      "    if(t==='departments'){\n",
      "      const sc=typeof __perfDeptScorecard==='function'?__perfDeptScorecard(ctxRaw()):null;\n",
      "      rows=(sc&&sc.available&&sc.rows||[]).map((r,i)=>rowFrom('goal-'+r.id,r.name,r.weight,r.score,r.status,i,r.name));\n",
      "    } else if(t==='employees'){\n",
      "      const empId=typeof __perfUserIdByName==='function'?__perfUserIdByName(ctxRaw()):null;\n",
      "      const self=window.__PERF_ACCESS__&&window.__PERF_ACCESS__.userId;\n",
      "      const mine=empId&&self&&empId===self?__perfObject('myScorecard'):null;\n",
      "      const sc=mine||(empId&&typeof __perfEmployeeScorecard==='function'?__perfEmployeeScorecard(empId):null);\n",
      "      rows=(sc&&sc.available&&sc.rows||[]).map((r,i)=>rowFrom('goal-'+r.id,r.name,r.weight,r.score,r.status,i,r.name));\n",
      "    } else if(t==='board'||t==='ceo'){\n",
      "      const sc=__perfObject(t==='board'?'boardScorecard':'ceoScorecard');\n",
      "      rows=(sc&&sc.available&&sc.rows||[]).map((r,i)=>rowFrom('section-'+r.id,r.name,r.weight,r.score,r.status,i,null));\n",
      "    } else {\n",
      "      const cfg=__perfScope('pillarConfig');\n",
      "      const orgPillarCode={'Financial':'FINANCIAL','Customer & Market':'CUSTOMER','Internal Operations':'INTERNAL_OPS','Learning, Growth & HR':'LEARNING_GROWTH'};\n",
      "      const org=__perfObject('orgBsc');\n",
      "      const orgByCode={};\n",
      "      (org&&org.pillars||[]).forEach(x=>{orgByCode[x.code]=x});\n",
      "      rows=(cfg||[]).map((p,i)=>{\n",
      "        const label=p.displayName||p.name||'';\n",
      "        const live=orgByCode[orgPillarCode[p.name]]||null;\n",
      "        const id=(label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'perspective')+'-'+i;\n",
      "        return rowFrom(id,label,p.weight,live&&live.score!=null?live.score:null,live&&live.status,i,null);\n",
      "      });\n",
      "    }\n",
      "    // A value the user typed into the edit drawer is real input of theirs, so an unsaved\n",
      "    // override still shows — it is the one number on this page with a source.\n",
      "    rows.forEach(r=>{\n",
      "      const ov=ui.overrides?.[scopeKey(t)]?.[r.id];\n",
      "      if(ov&&ov.score!=null){\n",
      "        r.score=Number(ov.score);\n",
      "        r.status=scoreStatus(r.score);\n",
      "        r.points=(r.score*(r.weight||0)/100).toFixed(1)+' weighted points';\n",
      "      }\n",
      "    });\n",
      "    return rows;\n",
      "  }\n",
      "  // contextFor() already dashes an empty context list; ctxRaw() is the same value before\n",
      "  // that guard, so department/employee lookups compare against the real selection rather\n",
      "  // than against the em dash string.\n",
      "  function ctxRaw(t=tab()){const list=contexts[t]||[];return ui.context[t]||list[0]||null}\n",
      ""
    ].join(""),
  },
  {
    label: "scorecards-rowmarkup",
    find: [
      "  function rowMarkup(p,i){const selected=ui.selected.includes(p.id),prior=priorFor(p.score,i),delta=(p.score-prior).toFixed(1);return `<article class=\"sc82-matrix-row ${selected?'sc83-matrix-row-selected':''}\" style=\"--tone:${p.tone};--soft:${p.soft};--soft2:${p.soft2}\" data-sc83-action=\"open-perspective\" data-id=\"${p.id}\" data-status=\"${statusClass(p.status)}\"><input type=\"checkbox\" class=\"sc83-selectbox\" data-sc83-action=\"select-row\" data-id=\"${p.id}\" ${selected?'checked':''} aria-label=\"Select ${esc(p.name)}\"><span class=\"sc82-row-open\">Open perspective →</span><div class=\"sc82-cell sc82-perspective\"><div class=\"sc82-perspective-title\"><span class=\"sc82-perspective-icon\">${icon(p.icon)}</span><strong>${esc(p.name)}</strong></div><p>${esc(p.summary)}</p><small>${p.weight}% of balanced scorecard · ${p.kpis.length} measures</small>${ui.edit?`<button class=\"sc83-row-action\" data-sc83-action=\"edit-score\" data-id=\"${p.id}\">Edit score</button>`:''}</div><div class=\"sc82-cell\" data-label=\"Goal\"><div class=\"sc82-bullets\">${p.goal.map(x=>`<span class=\"sc82-bullet\">${esc(x)}</span>`).join('')}</div></div><div class=\"sc82-cell sc82-objective\" data-label=\"Objective\"><div class=\"sc82-bullets\">${p.objective.map(x=>`<span class=\"sc82-bullet\">${esc(x)}</span>`).join('')}</div></div><div class=\"sc82-cell\" data-label=\"KPIs\"><div class=\"sc82-kpis\">${p.kpis.map((k,ki)=>`<button class=\"sc82-kpi-line\" data-sc83-action=\"open-kpi\" data-id=\"${p.id}:${ki}\"><strong>${esc(k[0])}</strong><span>${esc(k[1])}</span></button>`).join('')}</div><span class=\"sc83-edit-hint\">Click a KPI to update value, evidence or target.</span></div><div class=\"sc82-cell\" data-label=\"Targets\"><div class=\"sc82-targets\">${p.kpis.map(k=>`<span class=\"sc82-target\">${esc(k[2])}</span>`).join('')}</div></div><div class=\"sc82-cell sc82-progress-cell\" data-label=\"Progress\"><div class=\"sc82-score-top\"><strong class=\"sc82-score\">${p.score}</strong><span class=\"sc82-weight\">${p.weight}% weight</span></div><div class=\"sc82-progress-track\"><i style=\"--value:${p.score}%\"></i></div><div class=\"sc82-progress-foot\"><span class=\"sc82-state ${statusClass(p.status)}\">${esc(p.status)}</span><span class=\"sc82-points\">${esc(p.points)}</span></div>${ui.compare?`<div class=\"sc83-compare\"><span>Q2 ${prior}</span><strong class=\"sc83-delta ${Number(delta)>=0?'up':'down'}\">${Number(delta)>=0?'+':''}${delta} pts</strong></div>`:''}</div></article>`}\n",
      ""
    ].join(""),
    repl: [
      "  function rowMarkup(p,i){\n",
      "    /* patched:scorecards-rowmarkup */\n",
      "    // Same markup, same classes, same cell order. Only the values changed: score, status,\n",
      "    // weighted points, the goal/objective bullets, the KPI list and its targets all had no\n",
      "    // source and now say so instead of showing a number.\n",
      "    const selected=ui.selected.includes(p.id);\n",
      "    const dash=__perfDash();\n",
      "    const muted='font-size:12px;line-height:1.45;color:var(--muted,#6b7280)';\n",
      "    const soft=t=>`<span style=\"${muted}\">${t}</span>`;\n",
      "    const goals=__perfScope('goals'),kpis=__perfScope('kpis');\n",
      "    const goalCell=goals===null?soft('Unavailable'):goals.length?soft('Goals are not linked to a scorecard perspective yet'):soft('No goals recorded yet');\n",
      "    const objectiveCell=soft('Objectives are not recorded separately from goals yet');\n",
      "    const kpiCell=kpis===null?soft('Unavailable'):kpis.length?soft('KPIs are not linked to a scorecard perspective yet'):soft('No KPIs registered yet');\n",
      "    const weightTxt=p.weight==null?dash:p.weight+'%';\n",
      "    // A weight is configuration, never attainment - the progress bar stays empty until a\n",
      "    // real score exists.\n",
      "    return `<article class=\"sc82-matrix-row ${selected?'sc83-matrix-row-selected':''}\" style=\"--tone:${p.tone};--soft:${p.soft};--soft2:${p.soft2}\" data-sc83-action=\"open-perspective\" data-id=\"${p.id}\" data-status=\"${p.status?statusClass(p.status):''}\"><input type=\"checkbox\" class=\"sc83-selectbox\" data-sc83-action=\"select-row\" data-id=\"${p.id}\" ${selected?'checked':''} aria-label=\"Select ${esc(p.name)}\"><span class=\"sc82-row-open\">Open perspective →</span><div class=\"sc82-cell sc82-perspective\"><div class=\"sc82-perspective-title\"><span class=\"sc82-perspective-icon\">${icon(p.icon)}</span><strong>${esc(p.name)}</strong></div><p style=\"${muted}\">${p.summary?esc(p.summary):'No perspective description is configured.'}</p><small>${weightTxt} of balanced scorecard · measures not linked</small>${ui.edit?`<button class=\"sc83-row-action\" data-sc83-action=\"edit-score\" data-id=\"${p.id}\">Edit score</button>`:''}</div><div class=\"sc82-cell\" data-label=\"Goal\"><div class=\"sc82-bullets\">${goalCell}</div></div><div class=\"sc82-cell sc82-objective\" data-label=\"Objective\"><div class=\"sc82-bullets\">${objectiveCell}</div></div><div class=\"sc82-cell\" data-label=\"KPIs\"><div class=\"sc82-kpis\">${kpiCell}</div></div><div class=\"sc82-cell\" data-label=\"Targets\"><div class=\"sc82-targets\">${soft(dash)}</div></div><div class=\"sc82-cell sc82-progress-cell\" data-label=\"Progress\"><div class=\"sc82-score-top\"><strong class=\"sc82-score\">${p.score==null?dash:p.score}</strong><span class=\"sc82-weight\">${weightTxt} weight</span></div><div class=\"sc82-progress-track\"><i style=\"--value:${p.score==null?0:p.score}%\"></i></div><div class=\"sc82-progress-foot\"><span class=\"sc82-state ${p.status?statusClass(p.status):''}\">${p.status?esc(p.status):'Not scored'}</span><span class=\"sc82-points\">${p.points?esc(p.points):dash}</span></div>${ui.compare?`<div class=\"sc83-compare\"><span>Q2 ${dash}</span><strong class=\"sc83-delta\">${dash}</strong></div>`:''}</div></article>`;\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    // `weighted(rows)` averaged four invented scores; `Evidence 96%` was a literal. The
    // count of unsaved overrides beside them is real and is left alone.
    label: "scorecards-statusline",
    find: "<span class=\"sc83-count\">Weighted score ${weighted(rows)}%</span><span class=\"sc83-count\">Evidence 96%</span>",
    repl: "<span class=\"sc83-count\">Weighted score ${/* patched:scorecards-statusline */(()=>{const s=rows.filter(r=>r.score!=null);return s.length?s.reduce((a,r)=>a+r.score*(r.weight||0)/100,0).toFixed(1)+'%':__perfDash()+' not scored';})()}</span><span class=\"sc83-count\">Evidence ${__perfDash()} not tracked</span>",
  },
  {
    // With no configured pillars there are no rows; say so instead of showing nothing.
    label: "scorecards-rowhost",
    find: "<div class=\"sc83-row-host\">${rows.map(rowMarkup).join('')}</div>",
    repl: "<div class=\"sc83-row-host\">${/* patched:scorecards-rowhost */rows.length?rows.map(rowMarkup).join(''):`<div style=\"padding:28px 12px;text-align:center;color:var(--muted,#6b7280)\">${__perfScope('pillarConfig')===null?'Unavailable \\u2014 could not load the scorecard perspectives':'No scorecard perspectives are configured yet'}</div>`}</div>",
  },
  {
    // Six invented departments and six invented employees. Real ones exist, so use them.
    // `contexts[t]` can now be empty, which is why contextFor() is guarded below.
    label: "scorecards-contexts",
    find: [
      "  const contexts={\n",
      "    org:['Matanho Capital','Group Consolidated'],\n",
      "    departments:['Finance','Investments','Operations','People & Culture','Client Experience','ICT'],\n",
      "    board:['Board of Directors'],\n",
      "    ceo:['Chief Executive Officer'],\n",
      "    employees:['Tariro Moyo','Blessing Moyo','Natasha Chari','Tinashe Muchengti','Yvonne Sibanda','Tendai Nyathi']\n",
      "  };\n",
      ""
    ].join(""),
    repl: [
      "  /* patched:scorecards-contexts */\n",
      "  // Department and employee scorecard pickers now list the real departments and the\n",
      "  // real users; org/board/ceo stay as they were (they name the entity, not data).\n",
      "  const contexts={\n",
      "    org:['Matanho Capital','Group Consolidated'],\n",
      "    get departments(){return (__perfScope('departments')||[]).map(d=>d.name).filter(Boolean)},\n",
      "    board:['Board of Directors'],\n",
      "    ceo:['Chief Executive Officer'],\n",
      "    get employees(){return (__perfScope('users')||[]).map(u=>u.name).filter(Boolean)}\n",
      "  };\n",
      ""
    ].join(""),
  },
  {
    label: "scorecards-contextfor",
    find: "  function contextFor(t=tab()){return ui.context[t]||contexts[t][0]}",
    repl: "  function contextFor(t=tab()){/* patched:scorecards-contextfor */const list=contexts[t]||[];return ui.context[t]||list[0]||__perfDash()}",
  },
  {
    // Shared by the trajectory chart on Layer 2 and the KPI history chart on Layer 3. Both
    // fed it arrays derived from a fabricated score; with no score there is no series.
    label: "scorecards-spark",
    find: "  function spark(vals,target=80){const W=820,H=300,pad=32,min=55,max=100,x=i=>pad+i*(W-pad*2)/(vals.length-1),y=v=>H-pad-(v-min)*(H-pad*2)/(max-min),pts=vals.map((v,i)=>`${x(i)},${y(v)}`).join(' '),area=`${x(0)},${H-pad} ${pts} ${x(vals.length-1)},${H-pad}`;return `<div class=\"sc82-chart\"><svg viewBox=\"0 0 ${W} ${H}\" preserveAspectRatio=\"none\"><defs><linearGradient id=\"sc83fill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1267f5\" stop-opacity=\".18\"/><stop offset=\"1\" stop-color=\"#1267f5\" stop-opacity=\".01\"/></linearGradient></defs>${[60,70,80,90,100].map(v=>`<line x1=\"${pad}\" x2=\"${W-pad}\" y1=\"${y(v)}\" y2=\"${y(v)}\" class=\"sc82-chart-grid\"/><text x=\"3\" y=\"${y(v)+3}\">${v}</text>`).join('')}<line x1=\"${pad}\" x2=\"${W-pad}\" y1=\"${y(target)}\" y2=\"${y(target)}\" class=\"sc82-chart-target\"/><polygon points=\"${area}\" fill=\"url(#sc83fill)\"/><polyline points=\"${pts}\" class=\"sc82-chart-line\"/>${vals.map((v,i)=>`<circle cx=\"${x(i)}\" cy=\"${y(v)}\" r=\"4\" class=\"sc82-chart-dot\"/><text x=\"${x(i)-7}\" y=\"${H-8}\">${['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i]}</text>`).join('')}</svg></div>`}",
    repl: "  function spark(vals,target=80){/* patched:scorecards-spark */if(!Array.isArray(vals)||vals.length<2||!vals.every(v=>Number.isFinite(v)))return __perfNoSeries('Scorecard results are not stored period by period, so no trajectory can be drawn.');const W=820,H=300,pad=32,min=55,max=100,x=i=>pad+i*(W-pad*2)/(vals.length-1),y=v=>H-pad-(v-min)*(H-pad*2)/(max-min),pts=vals.map((v,i)=>`${x(i)},${y(v)}`).join(' '),area=`${x(0)},${H-pad} ${pts} ${x(vals.length-1)},${H-pad}`;return `<div class=\"sc82-chart\"><svg viewBox=\"0 0 ${W} ${H}\" preserveAspectRatio=\"none\"><defs><linearGradient id=\"sc83fill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1267f5\" stop-opacity=\".18\"/><stop offset=\"1\" stop-color=\"#1267f5\" stop-opacity=\".01\"/></linearGradient></defs>${[60,70,80,90,100].map(v=>`<line x1=\"${pad}\" x2=\"${W-pad}\" y1=\"${y(v)}\" y2=\"${y(v)}\" class=\"sc82-chart-grid\"/><text x=\"3\" y=\"${y(v)+3}\">${v}</text>`).join('')}<line x1=\"${pad}\" x2=\"${W-pad}\" y1=\"${y(target)}\" y2=\"${y(target)}\" class=\"sc82-chart-target\"/><polygon points=\"${area}\" fill=\"url(#sc83fill)\"/><polyline points=\"${pts}\" class=\"sc82-chart-line\"/>${vals.map((v,i)=>`<circle cx=\"${x(i)}\" cy=\"${y(v)}\" r=\"4\" class=\"sc82-chart-dot\"/><text x=\"${x(i)-7}\" y=\"${H-8}\">${['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i]}</text>`).join('')}</svg></div>`}",
  },
  {
    label: "scorecards-perspective",
    find: [
      "  function perspectiveLayer(){const t=ui.layer?.tab||tab(),p=dataFor(t).find(x=>x.id===ui.layer?.id)||dataFor(t)[0],trend=[p.score-11,p.score-9,p.score-10,p.score-7,p.score-6,p.score-5,p.score-3,p.score-4,p.score-2,p.score-1,p.score-1,p.score];return `<div class=\"page sc83-root\">${breadcrumb([labels[t][0],p.name])}<div class=\"sc82-layer-hero\"><div><span class=\"sc82-kicker\">Layer 2 · Perspective intelligence</span><h2>${esc(p.name)}</h2><p>${esc(p.summary)}</p></div><div class=\"sc83-layer-actions\"><button data-sc83-action=\"comment\" data-id=\"${p.id}\">Add commentary</button><button data-sc83-action=\"contributors\" data-id=\"${p.id}\">Contributors</button><button data-sc83-action=\"create-action\" data-id=\"${p.id}\" class=\"primary\">Create corrective action</button></div></div><div class=\"sc82-stat-grid\">${stat('Perspective score',p.score+'%',p.status)}${stat('Weight',p.weight+'%',p.points)}${stat('Evidence coverage','96%','Current evidence')}${stat('Open exceptions',p.score<86?'3':'1','Control exceptions')}${stat('Forecast',Math.min(99,p.score+3)+'%','Quarter end')}</div><div class=\"sc82-grid\"><main style=\"display:grid;gap:14px\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Performance trajectory</h3><p>12-period score with target line.</p></div><span class=\"sc82-chip\">Target 85%</span></div><div class=\"sc82-card-body\">${spark(trend,85)}</div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>KPI register</h3><p>Click a KPI to open Layer 3 governed KPI intelligence.</p></div>${['Department Manager','HR/M&E Manager','Executive','SysAdmin'].includes(state.role)?button('Edit perspective','edit-score',ui.edit?'active':''):''}</div><div class=\"sc82-table-wrap\"><table class=\"sc82-table\"><thead><tr><th>KPI</th><th>Current</th><th>Target</th><th>Variance</th><th>Evidence</th><th>Owner</th><th>Status</th></tr></thead><tbody>${p.kpis.map((k,i)=>`<tr data-sc83-action=\"open-kpi\" data-id=\"${p.id}:${i}\"><td><strong>${esc(k[0])}</strong></td><td>${esc(k[1])}</td><td>${esc(k[2])}</td><td>${i===0?'+1.6pp':i===1?'+0.4pp':'-2.1pp'}</td><td>96%</td><td>${['Executive owner','Department owner','Data steward'][i]}</td><td><span class=\"sc82-state ${i===2&&p.score<86?'watch':''}\">${i===2&&p.score<86?'Watch':'Approved'}</span></td></tr>`).join('')}</tbody></table></div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Strategy-to-execution chain</h3><p>Traceable linkage into goals and accountable work.</p></div></div><div class=\"sc82-card-body\"><div class=\"sc82-chain\"><div><span>Strategic goal</span><strong>${esc(p.goal[0])}</strong></div><div><span>Operational objective</span><strong>${esc(p.objective[0])}</strong></div><div><span>Delivery signal</span><strong>${p.score}% current achievement</strong></div></div></div></section></main><aside class=\"sc83-detail-rail\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Management controls</h3><p>Controlled ownership and publication parameters.</p></div></div><div class=\"sc82-card-body sc83-control-form\"><label>Executive owner<select><option>Executive owner</option><option>CEO</option><option>CFO</option><option>COO</option></select></label><label>Review cadence<select><option>Monthly</option><option>Quarterly</option></select></label><label>Escalation threshold<select><option>Below 80%</option><option>Below 85%</option></select></label><button class=\"sc83-tool\" data-sc83-action=\"save-controls\" data-id=\"${p.id}\">Save controls</button></div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Evidence & assurance</h3><p>Governed controls behind the score.</p></div></div><div class=\"sc82-card-body sc82-mini-list\">${mini('file','Evidence pack','EVD-'+p.id.toUpperCase()+'-026 · signed 08 Aug','Verified','open-evidence',p.id+':0:0')}${mini('link','Source lineage','ERP / CRM / Portfolio / HR systems','Current','source',p.id+':0')}${mini('shield','Control assurance','Calculation and override controls','Passed','controls')}${mini('history','Score history','18 immutable changes retained','18','history')}</div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Latest commentary</h3></div><div class=\"sc82-card-body\"><div class=\"sc82-comment\">${esc(p.summary)} ${p.score<86?'Management attention remains focused on closing the remaining threshold gap.':'Performance remains healthy with sufficient evidence confidence.'}</div><div class=\"sc83-comment-feed\">${ui.comments.filter(c=>c.scope===p.id).slice(-3).map(c=>`<div class=\"sc83-comment-item\"><strong>${esc(c.author)}</strong><span>${esc(c.text)}</span></div>`).join('')||'<span class=\"tiny\">No additional comments.</span>'}</div></div></section></aside></div></div>`}\n",
      ""
    ].join(""),
    repl: [
      "  function perspectiveLayer(){\n",
      "    /* patched:scorecards-perspective */\n",
      "    // Layer 2, one click in from the matrix. WAS: a five-stat grid (score, weight, evidence\n",
      "    // coverage 96%, \"open exceptions\" 3/1, a forecast of score+3), a twelve-point trajectory\n",
      "    // synthesised from the single fabricated score, a KPI register with invented variances\n",
      "    // and a hardcoded 96% evidence column, a delivery-signal claim, an \"EVD-… signed 08 Aug\"\n",
      "    // evidence pack and \"18 immutable changes retained\".\n",
      "    // NOW: the perspective name and its configured weight are real (pillarConfig);\n",
      "    // everything else has no source and reads as an em dash.\n",
      "    const t=ui.layer?.tab||tab();\n",
      "    const all=dataFor(t);\n",
      "    const p=all.find(x=>x.id===ui.layer?.id)||all[0];\n",
      "    const dash=__perfDash();\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const note=x=>`<p class=\"tiny\" style=\"margin:0;line-height:1.55;${muted}\">${x}</p>`;\n",
      "    if(!p) return `<div class=\"page sc83-root\">${breadcrumb([(labels[t]||labels.org)[0],'Perspective'])}<section class=\"sc82-card\"><div class=\"sc82-card-body\">${note('No scorecard perspectives are configured yet.')}</div></section></div>`;\n",
      "    const weightTxt=p.weight==null?dash:p.weight+'%';\n",
      "    return `<div class=\"page sc83-root\">${breadcrumb([(labels[t]||labels.org)[0],p.name])}<div class=\"sc82-layer-hero\"><div><span class=\"sc82-kicker\">Layer 2 · Perspective intelligence</span><h2>${esc(p.name)}</h2><p style=\"${muted}\">${p.summary?esc(p.summary):'No perspective description is configured.'}</p></div><div class=\"sc83-layer-actions\"><button data-sc83-action=\"comment\" data-id=\"${p.id}\">Add commentary</button><button data-sc83-action=\"contributors\" data-id=\"${p.id}\">Contributors</button><button data-sc83-action=\"create-action\" data-id=\"${p.id}\" class=\"primary\">Create corrective action</button></div></div><div class=\"sc82-stat-grid\">${stat('Perspective score',p.score==null?dash:p.score+'%',p.status||'Not scored')}${stat('Weight',weightTxt,p.points||'Configured weight')}${stat('Evidence coverage',dash,'Not yet tracked')}${stat('Open exceptions',dash,'Not yet tracked')}${stat('Forecast',dash,'Not yet tracked')}</div><div class=\"sc82-grid\"><main style=\"display:grid;gap:14px\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Performance trajectory</h3><p>12-period score with target line.</p></div><span class=\"sc82-chip\">Target ${dash}</span></div><div class=\"sc82-card-body\">${__perfNoSeries('Scorecard results are not stored period by period, so no trajectory can be drawn.')}</div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>KPI register</h3><p>Click a KPI to open Layer 3 governed KPI intelligence.</p></div>${['Department Manager','HR/M&E Manager','Executive','SysAdmin'].includes(state.role)?button('Edit perspective','edit-score',ui.edit?'active':''):''}</div><div class=\"sc82-table-wrap\"><table class=\"sc82-table\"><thead><tr><th>KPI</th><th>Current</th><th>Target</th><th>Variance</th><th>Evidence</th><th>Owner</th><th>Status</th></tr></thead><tbody>${__perfEmptyRow('kpis',7,'KPIs linked to this perspective')}</tbody></table></div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Strategy-to-execution chain</h3><p>Traceable linkage into goals and accountable work.</p></div></div><div class=\"sc82-card-body\"><div class=\"sc82-chain\"><div><span>Strategic goal</span><strong>${dash}</strong></div><div><span>Operational objective</span><strong>${dash}</strong></div><div><span>Delivery signal</span><strong>${dash}</strong></div></div>${note('Goals are not linked to a scorecard perspective yet, so no chain can be traced.')}</div></section></main><aside class=\"sc83-detail-rail\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Management controls</h3><p>Controlled ownership and publication parameters.</p></div></div><div class=\"sc82-card-body sc83-control-form\"><label>Executive owner<select><option>Executive owner</option><option>CEO</option><option>CFO</option><option>COO</option></select></label><label>Review cadence<select><option>Monthly</option><option>Quarterly</option></select></label><label>Escalation threshold<select><option>Below 80%</option><option>Below 85%</option></select></label><button class=\"sc83-tool\" data-sc83-action=\"save-controls\" data-id=\"${p.id}\">Save controls</button></div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Evidence &amp; assurance</h3><p>Governed controls behind the score.</p></div></div><div class=\"sc82-card-body sc82-mini-list\">${note('No evidence pack, source lineage or score history is recorded against a perspective yet.')}</div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Latest commentary</h3></div><div class=\"sc82-card-body\"><div class=\"sc83-comment-feed\">${ui.comments.filter(c=>c.scope===p.id).slice(-3).map(c=>`<div class=\"sc83-comment-item\"><strong>${esc(c.author)}</strong><span>${esc(c.text)}</span></div>`).join('')||note('No commentary has been added.')}</div></div></section></aside></div></div>`;\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    // Layer 3, reached from the Contributors button on Layer 2.
    label: "scorecards-contributors",
    find: [
      "  function contributorsLayer(){const t=ui.layer?.tab||tab(),p=dataFor(t).find(x=>x.id===ui.layer?.id)||dataFor(t)[0],deps=['Finance','Investments','Operations','People & Culture','Client Experience','ICT'];return `<div class=\"page sc83-root\">${breadcrumb([labels[t][0],p.name,'Contributors'])}<div class=\"sc82-layer-hero\"><div><span class=\"sc82-kicker\">Layer 3 · Contribution analysis</span><h2>${esc(p.name)} · Contribution Map</h2><p>See which departments, owners and workstreams are driving the perspective score and where intervention is needed.</p></div><div class=\"sc83-layer-actions\"><button data-sc83-action=\"export-contributors\">Export analysis</button><button data-sc83-action=\"create-action\" data-id=\"${p.id}\" class=\"primary\">Create action</button></div></div><div class=\"sc82-stat-grid\">${stat('Perspective score',p.score+'%',p.status)}${stat('Contributing units','6','All active')}${stat('Top contributor','Finance','91%')}${stat('Lowest contributor','Operations','72%')}${stat('Open actions','4','2 overdue')}</div><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Department contribution heatmap</h3><p>Performance contribution across KPIs, evidence, delivery and forecast confidence.</p></div></div><div class=\"sc82-card-body\"><div style=\"overflow:auto\"><div class=\"sc83-heatmap\"><div class=\"head\">Department</div><div class=\"head\">KPI attainment</div><div class=\"head\">Evidence</div><div class=\"head\">Delivery</div><div class=\"head\">Forecast</div>${deps.map((d,i)=>{const vals=[[91,98,86,90],[86,95,82,87],[72,91,70,75],[88,98,89,92],[84,96,81,86],[74,90,77,80]][i];return `<div><strong>${d}</strong></div>${vals.map(v=>`<div class=\"sc83-heat ${v>=85?'good':v>=78?'watch':'risk'}\">${v}%</div>`).join('')}`}).join('')}</div></div></div></section><div class=\"sc82-grid\"><main><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Contribution register</h3><p>Click a department for underlying work and owner detail.</p></div></div><div class=\"sc82-table-wrap\"><table class=\"sc82-table\"><thead><tr><th>Department</th><th>Leader</th><th>Contribution</th><th>KPIs</th><th>Open actions</th><th>Evidence</th><th>Status</th></tr></thead><tbody>${deps.map((d,i)=>`<tr data-sc83-action=\"department-contribution\" data-id=\"${d}\"><td><strong>${d}</strong></td><td>${['Farai Muchengezi','Rumbidzai Chaza','Tawanda Chikore','Chipo Ncube','Nyasha Dube','Tendai Nyathi'][i]}</td><td>${[91,86,72,88,84,74][i]}%</td><td>${[6,8,7,5,6,7][i]}</td><td>${[0,1,3,0,1,2][i]}</td><td>${[98,95,91,98,96,90][i]}%</td><td><span class=\"sc82-state ${[91,86,72,88,84,74][i]<80?'watch':''}\">${[91,86,72,88,84,74][i]<80?'Watch':'On track'}</span></td></tr>`).join('')}</tbody></table></div></section></main><aside class=\"sc83-detail-rail\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Driver insight</h3></div><div class=\"sc82-card-body sc82-mini-list\">${mini('chart','Strongest positive driver','Finance performance and evidence quality','+4.1pp')}${mini('alerts','Largest drag','Operations throughput and overdue actions','-3.6pp')}${mini('target','Forecast opportunity','ICT delivery recovery','+2.2pp')}</div></section></aside></div></div>`}\n",
      ""
    ].join(""),
    repl: [
      "  function contributorsLayer(){\n",
      "    /* patched:scorecards-contributors */\n",
      "    // Two clicks in (matrix row -> Contributors). WAS: six hardcoded departments with a\n",
      "    // 24-cell contribution heat grid (91/98/86/90 …), invented leaders, contribution\n",
      "    // percentages, KPI counts, open-action counts and evidence percentages, plus three\n",
      "    // \"driver insights\" quoting +4.1pp / -3.6pp / +2.2pp.\n",
      "    // NOW: the register lists the real departments, and the only figures shown are ones that\n",
      "    // can actually be counted — KPIs registered to a department and corrective actions open\n",
      "    // against it. Contribution, evidence and forecast are not computed anywhere.\n",
      "    const t=ui.layer?.tab||tab();\n",
      "    const all=dataFor(t);\n",
      "    const p=all.find(x=>x.id===ui.layer?.id)||all[0];\n",
      "    const dash=__perfDash();\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const note=x=>`<p class=\"tiny\" style=\"margin:0;line-height:1.55;${muted}\">${x}</p>`;\n",
      "    if(!p) return `<div class=\"page sc83-root\">${breadcrumb([(labels[t]||labels.org)[0],'Contributors'])}<section class=\"sc82-card\"><div class=\"sc82-card-body\">${note('No scorecard perspectives are configured yet.')}</div></section></div>`;\n",
      "    const depts=__perfScope('departments');\n",
      "    const kpis=__perfScope('kpis');\n",
      "    const actions=__perfScope('correctiveActions');\n",
      "    const openActions=actions===null?dash:String(actions.filter(a=>String(a.status||'').toLowerCase()!=='closed').length);\n",
      "    const countFor=(list,name)=>list===null?dash:String(list.filter(r=>(r.department||'')===name).length);\n",
      "    const register=depts===null\n",
      "      ?`<tr><td colspan=\"7\" style=\"text-align:center;padding:28px 12px;${muted}\">Unavailable — could not load departments</td></tr>`\n",
      "      :depts.length\n",
      "        ?depts.map(d=>`<tr data-sc83-action=\"department-contribution\" data-id=\"${esc(d.name)}\"><td><strong>${esc(d.name)}</strong></td><td>${dash}</td><td>${dash}</td><td>${countFor(kpis,d.name)}</td><td>${countFor(actions,d.name)}</td><td>${dash}</td><td><span class=\"sc82-state\">${dash}</span></td></tr>`).join('')\n",
      "        :`<tr><td colspan=\"7\" style=\"text-align:center;padding:28px 12px;${muted}\">No departments yet</td></tr>`;\n",
      "    return `<div class=\"page sc83-root\">${breadcrumb([(labels[t]||labels.org)[0],p.name,'Contributors'])}<div class=\"sc82-layer-hero\"><div><span class=\"sc82-kicker\">Layer 3 · Contribution analysis</span><h2>${esc(p.name)} · Contribution Map</h2><p>See which departments, owners and workstreams are driving the perspective score and where intervention is needed.</p></div><div class=\"sc83-layer-actions\"><button data-sc83-action=\"export-contributors\">Export analysis</button><button data-sc83-action=\"create-action\" data-id=\"${p.id}\" class=\"primary\">Create action</button></div></div><div class=\"sc82-stat-grid\">${stat('Perspective score',dash,'Not scored')}${stat('Contributing units',__perfCount('departments'),'Departments on record')}${stat('Top contributor',dash,'Not yet tracked')}${stat('Lowest contributor',dash,'Not yet tracked')}${stat('Open actions',openActions,'Not yet closed')}</div><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Department contribution heatmap</h3><p>Performance contribution across KPIs, evidence, delivery and forecast confidence.</p></div></div><div class=\"sc82-card-body\">${note('A contribution heatmap needs a score per department per perspective. Nothing records one yet.')}</div></section><div class=\"sc82-grid\"><main><section class=\"sc82-card\"><div class=\"sc82-card-head\"><div><h3>Contribution register</h3><p>Click a department for underlying work and owner detail.</p></div></div><div class=\"sc82-table-wrap\"><table class=\"sc82-table\"><thead><tr><th>Department</th><th>Leader</th><th>Contribution</th><th>KPIs</th><th>Open actions</th><th>Evidence</th><th>Status</th></tr></thead><tbody>${register}</tbody></table></div></section></main><aside class=\"sc83-detail-rail\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Driver insight</h3></div><div class=\"sc82-card-body sc82-mini-list\">${note('Drivers are derived from period-on-period movement in a perspective score. No score history exists, so none can be identified.')}</div></section></aside></div></div>`;\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    // The printable publication preview, one click from the toolbar. The worst offender on
    // the page: a formal signed-off report asserting a weighted score, 96% evidence
    // coverage and a 24-cell department heat grid.
    label: "scorecards-preview",
    find: [
      "  function preview(){const rows=dataFor(),depts=['Finance','Investments','Operations','People & Culture','Client Experience','ICT'],offsets=[[5,2,-1,3],[2,4,-3,1],[-5,-2,-6,-1],[3,5,2,7],[0,7,1,2],[-6,-4,-7,4]],heat=v=>v>=90?'excellent':v>=84?'good':v>=78?'watch':'risk',overall=weighted(rows);modal('Scorecard publication preview',`${contextFor()} · ${ui.period} · weighted score ${overall}%`,`<div class=\"sc14-report\"><header class=\"sc14-report-head\"><div><span class=\"sc14-kicker\">MATANHO · PERFORMANCE MANAGEMENT · CONTROLLED SCORECARD</span><h2>${esc(contextFor())} Balanced Scorecard</h2><p>${esc(ui.period)} · Formal publication preview · Version ${ui.publication.includes('Submitted')?'Submitted':'Draft'}</p></div><div class=\"sc14-report-badge\"><strong>${overall}%</strong><span>Weighted score</span></div></header><div class=\"sc14-report-meta\"><div><span>Entity</span><strong>${esc(state.entity)}</strong></div><div><span>Reporting period</span><strong>${esc(ui.period)}</strong></div><div><span>Evidence coverage</span><strong>96%</strong></div><div><span>Publication state</span><strong>${esc(ui.publication)}</strong></div><div><span>Prepared by</span><strong>${esc(state.role)}</strong></div><div><span>Generated</span><strong>${new Date().toLocaleDateString()}</strong></div></div><section class=\"sc14-section\"><div class=\"sc14-section-head\"><div><h3>Executive scorecard heatmap</h3><p>Department performance by balanced-scorecard perspective. Heat intensity makes concentration of risk and strength immediately visible.</p></div><div class=\"sc14-heat-legend\"><span><i class=\"excellent\"></i>90+</span><span><i class=\"good\"></i>84–89</span><span><i class=\"watch\"></i>78–83</span><span><i class=\"risk\"></i>&lt;78</span></div></div><div class=\"sc14-heatmap\" style=\"--cols:${rows.length}\"><div class=\"sc14-h head dept\">Department</div>${rows.map(r=>`<div class=\"sc14-h head\">${esc(r.name)}</div>`).join('')}<div class=\"sc14-h head\">Overall</div>${depts.map((d,di)=>{const vals=rows.map((r,ri)=>Math.max(55,Math.min(99,Math.round(r.score+(offsets[di]?.[ri]||0))))),avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);return `<div class=\"sc14-h dept\"><strong>${d}</strong><span>${['Business unit','Investment team','Delivery function','People function','Market function','Technology function'][di]}</span></div>${vals.map(v=>`<div class=\"sc14-h ${heat(v)}\"><strong>${v}</strong><span>${v>=84?'Healthy':v>=78?'Watch':'Action'}</span></div>`).join('')}<div class=\"sc14-h ${heat(avg)} overall\"><strong>${avg}</strong><span>Weighted</span></div>`}).join('')}</div></section><section class=\"sc14-section\"><div class=\"sc14-section-head\"><div><h3>Perspective performance & weighted contribution</h3><p>Formal scorecard result with approved weights, current score and management status.</p></div></div><div class=\"sc14-perspective-table\"><div class=\"row head\"><span>Perspective</span><span>Weight</span><span>Score</span><span>Weighted points</span><span>Status</span></div>${rows.map(r=>`<div class=\"row\"><span><strong>${esc(r.name)}</strong><small>${esc(r.summary)}</small></span><span>${r.weight}%</span><span><strong>${r.score}%</strong></span><span>${(r.score*r.weight/100).toFixed(1)}</span><span class=\"state ${statusClass(r.status)}\">${esc(r.status)}</span></div>`).join('')}</div></section><div class=\"sc14-report-grid\"><section class=\"sc14-section\"><h3>Management commentary</h3><p>Overall performance remains resilient, with the strongest contribution coming from areas above the approved threshold. Watch areas require linked corrective actions, owner accountability and evidence refresh before the next publication gate.</p><ul><li>All perspective weights are validated to 100%.</li><li>Heatmap exceptions must be linked to a corrective action or management commentary.</li><li>Manual score overrides remain subject to dual approval and audit logging.</li></ul></section><section class=\"sc14-section\"><h3>Assurance & sign-off</h3><div class=\"sc14-sign\"><div><span>Prepared by</span><strong>Performance Office</strong><small>Signature / date</small></div><div><span>Reviewed by</span><strong>Executive sponsor</strong><small>Signature / date</small></div><div><span>Approved by</span><strong>Executive Committee</strong><small>Signature / date</small></div></div></section></div></div>`,`<button data-sc83-action=\"close-modal\">Close</button><button data-sc83-action=\"print-preview\">Print / Save PDF</button><button class=\"primary\" data-sc83-action=\"export\">Export CSV</button>`,true)}\n",
      ""
    ].join(""),
    repl: [
      "  function preview(){\n",
      "    /* patched:scorecards-preview */\n",
      "    // One click from the toolbar (\"Preview\"), and the most dangerous surface on the page: a\n",
      "    // formal, printable \"controlled scorecard\" carrying a weighted score, an evidence\n",
      "    // coverage of 96% and a six-department by four-perspective heat grid whose 24 cells were\n",
      "    // produced by adding a fixed offset table to four invented scores. A published PDF of\n",
      "    // that is a fabricated management report.\n",
      "    // NOW: the perspective table shows the real configured weights and an em dash wherever a\n",
      "    // score would be; the heat grid is gone because nothing scores a department; and the\n",
      "    // weight-validation bullet is computed from the configured weights rather than asserted.\n",
      "    const rows=dataFor();\n",
      "    const dash=__perfDash();\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const scored=rows.filter(r=>r.score!=null);\n",
      "    const overall=scored.length?scored.reduce((a,r)=>a+r.score*(r.weight||0)/100,0).toFixed(1)+'%':dash;\n",
      "    const total=rows.reduce((a,r)=>a+(r.weight||0),0);\n",
      "    const weightLine=rows.length?`Configured perspective weights total ${total}%.`:'No scorecard perspectives are configured yet.';\n",
      "    return modal('Scorecard publication preview',`${contextFor()} · ${ui.period} · weighted score ${overall}`,`<div class=\"sc14-report\"><header class=\"sc14-report-head\"><div><span class=\"sc14-kicker\">MATANHO · PERFORMANCE MANAGEMENT · CONTROLLED SCORECARD</span><h2>${esc(contextFor())} Balanced Scorecard</h2><p>${esc(ui.period)} · Formal publication preview · Version ${ui.publication.includes('Submitted')?'Submitted':'Draft'}</p></div><div class=\"sc14-report-badge\"><strong>${overall}</strong><span>Weighted score</span></div></header><div class=\"sc14-report-meta\"><div><span>Entity</span><strong>${esc(state.entity)}</strong></div><div><span>Reporting period</span><strong>${esc(ui.period)}</strong></div><div><span>Evidence coverage</span><strong>${dash}</strong></div><div><span>Publication state</span><strong>${esc(ui.publication)}</strong></div><div><span>Prepared by</span><strong>${esc(state.role)}</strong></div><div><span>Generated</span><strong>${new Date().toLocaleDateString()}</strong></div></div><section class=\"sc14-section\"><div class=\"sc14-section-head\"><div><h3>Executive scorecard heatmap</h3><p>Department performance by balanced-scorecard perspective.</p></div></div><p class=\"tiny\" style=\"margin:0;line-height:1.55;${muted}\">No score is recorded for a department against a perspective, so this heatmap cannot be produced. It will populate once departmental scorecards are captured.</p></section><section class=\"sc14-section\"><div class=\"sc14-section-head\"><div><h3>Perspective performance &amp; weighted contribution</h3><p>Formal scorecard result with approved weights, current score and management status.</p></div></div><div class=\"sc14-perspective-table\"><div class=\"row head\"><span>Perspective</span><span>Weight</span><span>Score</span><span>Weighted points</span><span>Status</span></div>${rows.length?rows.map(r=>`<div class=\"row\"><span><strong>${esc(r.name)}</strong><small style=\"${muted}\">${r.summary?esc(r.summary):'No description configured'}</small></span><span>${r.weight==null?dash:r.weight+'%'}</span><span><strong>${r.score==null?dash:r.score+'%'}</strong></span><span>${r.score==null?dash:(r.score*(r.weight||0)/100).toFixed(1)}</span><span class=\"state ${r.status?statusClass(r.status):''}\">${r.status?esc(r.status):'Not scored'}</span></div>`).join(''):`<div class=\"row\"><span style=\"${muted}\">No scorecard perspectives are configured yet.</span></div>`}</div></section><div class=\"sc14-report-grid\"><section class=\"sc14-section\"><h3>Management commentary</h3><p style=\"${muted}\">No management commentary has been recorded for this cycle.</p><ul><li>${weightLine}</li><li>Heatmap exceptions must be linked to a corrective action or management commentary.</li><li>Manual score overrides remain subject to dual approval and audit logging.</li></ul></section><section class=\"sc14-section\"><h3>Assurance &amp; sign-off</h3><div class=\"sc14-sign\"><div><span>Prepared by</span><strong>Performance Office</strong><small>Signature / date</small></div><div><span>Reviewed by</span><strong>Executive sponsor</strong><small>Signature / date</small></div><div><span>Approved by</span><strong>Executive Committee</strong><small>Signature / date</small></div></div></section></div></div>`,`<button data-sc83-action=\"close-modal\">Close</button><button data-sc83-action=\"print-preview\">Print / Save PDF</button><button class=\"primary\" data-sc83-action=\"export\">Export CSV</button>`,true);\n",
      "  }\n",
      ""
    ].join(""),
  },
  {
    label: "scorecards-deptcontrib",
    find: [
      "  function departmentContribution(name){modal(`${name} contribution detail`,'Underlying performance components contributing to the selected perspective.',`<div class=\"sc83-source-record\">${[['Department',name],['Contribution score',name==='Operations'?'72%':'86%'],['Active KPIs','7'],['Open actions',name==='Operations'?'3':'1'],['Evidence coverage',name==='Operations'?'91%':'96%'],['Forecast',name==='Operations'?'75%':'88%'],['Review owner','Department Executive'],['Data freshness','12 min']].map(x=>`<div><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div><div class=\"sc83-modal-grid\" style=\"margin-top:14px\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Top drivers</h3></div><div class=\"sc82-card-body sc82-mini-list\">${mini('chart','KPI attainment','Current-period contribution','+3.2pp')}${mini('tasks','Delivery completion','Work linked to scorecard','+1.8pp')}${mini('alerts','Overdue actions','Execution drag','-2.1pp')}</div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Next decisions</h3></div><div class=\"sc82-card-body sc83-checklist\"><div class=\"sc83-check\"><i>1</i>Confirm corrective-action owner</div><div class=\"sc83-check\"><i>2</i>Validate August evidence</div><div class=\"sc83-check\"><i>3</i>Review forecast at next check-in</div></div></section></div>`,`<button data-sc83-action=\"close-modal\">Close</button><button class=\"primary\" data-sc83-action=\"nav-departments\">Open department workspace</button>`,true)}\n",
      ""
    ].join(""),
    repl: [
      "  function departmentContribution(name){\n",
      "    /* patched:scorecards-deptcontrib */\n",
      "    // WAS: a record card whose eight values were literals branched on whether the department\n",
      "    // happened to be called \"Operations\" (72%/86% contribution, 7 active KPIs, 96%/91%\n",
      "    // evidence, a 12-minute data freshness), plus three +3.2pp / +1.8pp / -2.1pp drivers.\n",
      "    // NOW: only the two figures that can genuinely be counted are shown.\n",
      "    const dash=__perfDash();\n",
      "    const muted='color:var(--muted,#6b7280)';\n",
      "    const kpis=__perfScope('kpis');\n",
      "    const actions=__perfScope('correctiveActions');\n",
      "    const countFor=list=>list===null?dash:String(list.filter(r=>(r.department||'')===name).length);\n",
      "    const fields=[['Department',name],['Contribution score',dash],['Active KPIs',countFor(kpis)],['Open actions',countFor(actions)],['Evidence coverage',dash],['Forecast',dash],['Review owner',dash],['Data freshness',dash]];\n",
      "    return modal(`${name} contribution detail`,'Underlying performance components contributing to the selected perspective.',`<div class=\"sc83-source-record\">${fields.map(x=>`<div><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong></div>`).join('')}</div><div class=\"sc83-modal-grid\" style=\"margin-top:14px\"><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Top drivers</h3></div><div class=\"sc82-card-body sc82-mini-list\"><p class=\"tiny\" style=\"margin:0;line-height:1.55;${muted}\">Drivers are derived from period-on-period movement. No contribution history is recorded, so none can be identified.</p></div></section><section class=\"sc82-card\"><div class=\"sc82-card-head\"><h3>Next decisions</h3></div><div class=\"sc82-card-body sc83-checklist\"><div class=\"sc83-check\"><i>1</i>Confirm corrective-action owner</div><div class=\"sc83-check\"><i>2</i>Validate current-period evidence</div><div class=\"sc83-check\"><i>3</i>Review forecast at next check-in</div></div></section></div>`,`<button data-sc83-action=\"close-modal\">Close</button><button class=\"primary\" data-sc83-action=\"nav-departments\">Open department workspace</button>`,true);\n",
      "  }\n",
      ""
    ].join(""),
  },
]
