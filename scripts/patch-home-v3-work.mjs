// Patches components/home-v3-mock/matanho-runtime.js for Phase 5a (My Work) + the honest-data
// half of Phase 5b (Performance Overview + the mini "Performance" card on My Work's right rail).
// Run: node scripts/patch-home-v3-work.mjs
//
// CRLF trap: the runtime file is 100% CRLF. Normalize to LF for matching, patch, restore CRLF on
// write (see design-refs/home-page/execution-plan.md's runtime-patch-safety note). Every replace
// is FUNCTION-FORM (`.replace(old, () => new)`) — string-form silently corrupts on any `$`-prefixed
// sequence in the replacement (a prior patch script hit this with 'US$').
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, "..", "components", "home-v3-mock", "matanho-runtime.js")

const raw = readFileSync(target, "utf8")
const isCrlf = raw.includes("\r\n")
let src = raw.replace(/\r\n/g, "\n")

let missed = []
function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    missed.push(label)
    return
  }
  src = src.replace(oldStr, () => newStr)
}

// --- A: remove the "+ new project" affordance -------------------------------------------------
// No Project entity exists server-side (see live-loaders.ts's loadMyTasks doc comment) — "projects"
// are just real tasks grouped by department. A standalone create-project modal would save nothing
// durable (an empty project vanishes the moment you leave the page), so it's removed rather than
// left to fake a success it can't deliver.
patch(
  "A1 remove new-project button",
  `<aside class="card project-list"><div class="card-title"><h3>Projects</h3><button class="link-btn" data-action="new-project">${"${icon('plus')}"}</button></div>`,
  `<aside class="card project-list"><div class="card-title"><h3>Projects</h3></div>`,
)

patch(
  "A2 remove new-project click handler",
  `if(action==='new-project'){modal('Create project',\`<form id="projectForm"><div class="form-grid"><div class="form-field full"><label>Project name</label><input class="input-control" name="name" required placeholder="New strategic initiative"/></div><div class="form-field"><label>Owner</label><input class="input-control" name="owner" value="Fadzai Moyo"/></div><div class="form-field"><label>Target date</label><input class="input-control" type="date" name="date"/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Create project</button></div></form>\`);return}`,
  ``,
)

patch(
  "A3 remove projectForm submit handler",
  `if(e.target.id==='projectForm'){const f=new FormData(e.target),name=String(f.get('name')||'').trim();if(!name)return;if(!(state.workProjects||[]).some(p=>p.name===name)){state.workProjects.push({id:\`project-\${Date.now()}\`,name,progress:0,status:'On track',owner:String(f.get('owner')||'Fadzai Moyo'),target:String(f.get('date')||'')});state.workProject=name;saveState()}closePortal();render();toast('Project created.','success');return}`,
  ``,
)

// --- B: taskForm — Project becomes free text (a new project is just a new department string on
// the first task that uses it), due date becomes required (the backend requires it) -------------
patch(
  "B taskForm markup",
  `if(action==='new-task'){modal('Create task',\`<form id="taskForm"><div class="form-grid"><div class="form-field full"><label>Task</label><input class="input-control" name="title" required/></div><div class="form-field"><label>Project</label><select class="select-control" name="project">\${(state.workProjects||D.workProjects).map(p=>\`<option>\${p.name}</option>\`).join('')}</select></div><div class="form-field"><label>Due date</label><input class="input-control" type="date" name="date"/></div><div class="form-field"><label>Priority</label><select class="select-control" name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Add task</button></div></form>\`);return}`,
  `if(action==='new-task'){modal('Create task',\`<form id="taskForm"><div class="form-grid"><div class="form-field full"><label>Task</label><input class="input-control" name="title" required/></div><div class="form-field"><label>Project</label><input class="input-control" name="project" list="workProjectOptions" placeholder="e.g. Client Onboarding"/><datalist id="workProjectOptions">\${(state.workProjects||D.workProjects).map(p=>\`<option value="\${esc(p.name)}"></option>\`).join('')}</datalist></div><div class="form-field"><label>Due date</label><input class="input-control" type="date" name="date" required/></div><div class="form-field"><label>Priority</label><select class="select-control" name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Add task</button></div></form>\`);return}`,
)

// --- C: taskForm submit -> emit real event instead of a local optimistic push. A fabricated
// Date.now() id would go stale the instant a follow-up toggle/edit tried to PUT it, so this one
// (unlike edits to existing tasks) uses the reload-after-toast pattern, same as wallpaper upload.
patch(
  "C taskForm submit handler",
  `if(e.target.id==='taskForm'){const f=new FormData(e.target),rawDate=f.get('date');const due=rawDate?new Date(\`\${rawDate}T12:00:00\`).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'New';state.workTasks.unshift({id:Date.now(),title:f.get('title'),project:f.get('project'),owner:'You',due,progress:0,status:f.get('priority'),done:false});saveState();closePortal();render();toast('Task added.','success');return}`,
  `if(e.target.id==='taskForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('work.task.created',{title:f.get('title'),project:f.get('project')||null,dueDate:f.get('date'),priority:f.get('priority')});return}`,
)

// --- D: taskDetailForm markup — Owner becomes read-only (reassignment needs a real user picker,
// out of scope this pass; see execution-plan.md), Due becomes a real date input, "Normal" priority
// option dropped (backend/titleCasePriority only ever produce High/Medium/Low) --------------------
patch(
  "D taskDetailForm markup",
  `const taskOpen=e.target.closest('[data-task-open]'); if(taskOpen){const t=state.workTasks.find(x=>String(x.id)===String(taskOpen.dataset.taskOpen));if(t)modal('Task details',\`<form id="taskDetailForm"><input type="hidden" name="taskId" value="\${t.id}"/><div class="task-detail-head"><div class="task-icon">\${icon('check')}</div><div><span>\${esc(t.project)}</span><h3>\${esc(t.title)}</h3></div></div><div class="form-grid"><div class="form-field"><label>Owner</label><input class="input-control" name="owner" value="\${esc(t.owner)}"/></div><div class="form-field"><label>Due</label><input class="input-control" name="due" value="\${esc(t.due)}"/></div><div class="form-field"><label>Priority</label><select class="select-control" name="status"><option \${t.status==='High'?'selected':''}>High</option><option \${t.status==='Medium'?'selected':''}>Medium</option><option \${!t.status||t.status==='Normal'?'selected':''}>Normal</option><option \${t.status==='Low'?'selected':''}>Low</option></select></div><div class="form-field"><label>Progress <span id="taskProgressValue">\${t.progress}%</span></label><input id="taskProgressRange" type="range" min="0" max="100" step="5" name="progress" value="\${t.progress}"/></div></div><label class="setting-toggle"><div><strong>Completed</strong><span>Mark this task as finished.</span></div><input type="checkbox" name="done" \${t.done?'checked':''}/><i></i></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save task</button></div></form>\`);return}`,
  `const taskOpen=e.target.closest('[data-task-open]'); if(taskOpen){const t=state.workTasks.find(x=>String(x.id)===String(taskOpen.dataset.taskOpen));if(t)modal('Task details',\`<form id="taskDetailForm"><input type="hidden" name="taskId" value="\${t.id}"/><div class="task-detail-head"><div class="task-icon">\${icon('check')}</div><div><span>\${esc(t.project)}</span><h3>\${esc(t.title)}</h3></div></div><div class="form-grid"><div class="form-field"><label>Owner</label><input class="input-control" value="\${esc(t.owner)}" disabled/></div><div class="form-field"><label>Due</label><input class="input-control" type="date" name="due" value="\${esc((t.dueIso||'').slice(0,10))}"/></div><div class="form-field"><label>Priority</label><select class="select-control" name="status"><option \${t.status==='High'?'selected':''}>High</option><option \${!t.status||t.status==='Medium'?'selected':''}>Medium</option><option \${t.status==='Low'?'selected':''}>Low</option></select></div><div class="form-field"><label>Progress <span id="taskProgressValue">\${t.progress}%</span></label><input id="taskProgressRange" type="range" min="0" max="100" step="5" name="progress" value="\${t.progress}"/></div></div><label class="setting-toggle"><div><strong>Completed</strong><span>Mark this task as finished.</span></div><input type="checkbox" name="done" \${t.done?'checked':''}/><i></i></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save task</button></div></form>\`);return}`,
)

// --- E: taskDetailForm submit — keep the optimistic local update (existing real id, same
// trade-off as syncCoverPreference) but also emit the real PUT, and re-derive due/dueIso from the
// now-real date input instead of trusting free text -----------------------------------------------
patch(
  "E taskDetailForm submit handler",
  `if(e.target.id==='taskDetailForm'){const f=new FormData(e.target),t=state.workTasks.find(x=>String(x.id)===String(f.get('taskId')));if(t){t.owner=String(f.get('owner')||t.owner);t.due=String(f.get('due')||t.due);t.status=String(f.get('status')||'Normal');t.progress=Number(f.get('progress')||0);t.done=f.has('done')||t.progress>=100;if(t.done)t.progress=100;saveState()}closePortal();render();toast('Task updated.','success');return}`,
  `if(e.target.id==='taskDetailForm'){const f=new FormData(e.target),t=state.workTasks.find(x=>String(x.id)===String(f.get('taskId')));if(t){const rawDue=f.get('due');if(rawDue){const d=new Date(\`\${rawDue}T12:00:00\`);t.dueIso=d.toISOString();const today=new Date();t.due=d.toDateString()===today.toDateString()?'Today':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}t.status=String(f.get('status')||'Medium');t.progress=Number(f.get('progress')||0);t.done=f.has('done')||t.progress>=100;if(t.done)t.progress=100;saveState();emitIntegrationEvent('work.task.updated',{id:t.id,dueDate:t.dueIso,priority:t.status,progress:t.progress,done:t.done})}closePortal();render();toast('Task updated.','success');return}`,
)

// --- F: row checkbox toggle -> also emit (reuses the same PUT .../stage path as the Home page's
// own Priorities widget toggle; String-normalize the id compare for real cuid ids) ---------------
patch(
  "F data-work-toggle handler",
  `const wt=e.target.closest('[data-work-toggle]'); if(wt){e.stopPropagation();const t=state.workTasks.find(x=>x.id==wt.dataset.workToggle);if(t){t.done=!t.done;if(t.done)t.progress=100;saveState();render();toast(t.done?'Task completed.':'Task reopened.',t.done?'success':'')}return}`,
  `const wt=e.target.closest('[data-work-toggle]'); if(wt){e.stopPropagation();const t=state.workTasks.find(x=>String(x.id)===String(wt.dataset.workToggle));if(t){t.done=!t.done;if(t.done)t.progress=100;saveState();render();toast(t.done?'Task completed.':'Task reopened.',t.done?'success':'');emitIntegrationEvent('work.task.updated',{id:t.id,progress:t.progress,done:t.done})}return}`,
)

// --- G: inline progress <select> -> also emit ----------------------------------------------------
patch(
  "G data-work-progress handler",
  `const wp=e.target.closest('[data-work-progress]'); if(wp){const t=state.workTasks.find(x=>String(x.id)===String(wp.dataset.workProgress));if(t){t.progress=Number(wp.value||0);t.done=t.progress>=100;saveState();render();toast(t.done?'Task completed.':'Task progress updated.','success')}return}`,
  `const wp=e.target.closest('[data-work-progress]'); if(wp){const t=state.workTasks.find(x=>String(x.id)===String(wp.dataset.workProgress));if(t){t.progress=Number(wp.value||0);t.done=t.progress>=100;saveState();render();toast(t.done?'Task completed.':'Task progress updated.','success');emitIntegrationEvent('work.task.progress.updated',{id:t.id,progress:t.progress,done:t.done})}return}`,
)

// --- H: Teams tab — replace the 4 hardcoded fake teams (matched against a `t.owner` name string)
// with real per-person workload from D.teamRows (org-wide tasks grouped by real team-member id,
// see live-loaders.ts's loadTeamRows doc comment on why /tasks/my alone can't answer this) --------
patch(
  "H teamData/teamsView",
  `const teamData=[['Investment team',['You','Tawanda Kasere','Rudo Maposa']],['Risk & Compliance',['You','Tawanda Kasere']],['Client Relations',['Nyasha Moyo','Farai Dube']],['Operations',['Farai Dube']]].map(([name,owners],i)=>{const linked=state.workTasks.filter(t=>owners.includes(t.owner));const prog=linked.length?Math.round(linked.reduce((s,t)=>s+(t.done?100:Number(t.progress)||0),0)/linked.length):0;return [name,owners[0],prog,linked.filter(t=>!t.done).length,i]});
    const teamsView=\`<div class="work-team-board">\${teamData.map(x=>\`<article class="card work-team-card">\${avatar(D.people[x[4]%D.people.length])}<div><h3>\${x[0]}</h3><p>Lead: \${x[1]} · \${x[3]} active tasks</p></div><strong>\${x[2]}%</strong><div class="progress-bar"><span style="width:\${x[2]}%"></span></div><button class="secondary-btn small-btn">Open team view</button></article>\`).join('')}</div>\`;`,
  `const teamRows=D.teamRows||[];
    const teamsView=teamRows.length?\`<div class="work-team-board">\${teamRows.map(p=>\`<article class="card work-team-card">\${avatar({name:p.name,initials:(p.name||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><h3>\${esc(p.name)}</h3><p>\${esc(p.role||'Team member')} · \${p.openCount} open task\${p.openCount===1?'':'s'}</p></div><strong>\${p.progress}%</strong><div class="progress-bar"><span style="width:\${p.progress}%"></span></div></article>\`).join('')}</div>\`:\`<div class="work-empty-state">\${icon('people')}<strong>No shared task assignments yet.</strong><span>Team workload appears here once tasks are assigned to more than one person.</span></div>\`;`,
)

// --- I: roadmap defaulted to a hardcoded project name when no project filter is active ------------
patch(
  "I roadmapProject default",
  `const roadmapProject=project==='all'?'Southern Africa Expansion':project;`,
  `const roadmapProject=project==='all'?(projectStats[0]?projectStats[0].name:null):project;`,
)

patch(
  "I roadmap section render",
  `<section class="card roadmap dynamic-roadmap"><div class="card-title"><div><h3>\${esc(roadmapProject)} roadmap</h3><p>Milestones update immediately as linked tasks move.</p></div><button class="link-btn" data-work-project="\${esc(roadmapProject)}">View project \${icon('arrow')}</button></div>\${roadmapTasks.length?roadmapTasks.map((t,i)=>\`<div class="roadmap-row"><span>\${esc(t.title)}</span><div class="timeline"><span style="width:\${Math.max(8,Number(t.progress)||0)}%;margin-left:\${Math.min(10,i*2)}%">\${t.done?'Completed':t.progress>=70?'In review':t.progress>=30?'In progress':'Planned'}</span></div></div>\`).join(''):\`<div class="work-empty-state"><strong>No linked milestones yet.</strong><span>Add a task to this project to populate the roadmap.</span></div>\`}</section>`,
  `\${roadmapProject?\`<section class="card roadmap dynamic-roadmap"><div class="card-title"><div><h3>\${esc(roadmapProject)} roadmap</h3><p>Milestones update immediately as linked tasks move.</p></div><button class="link-btn" data-work-project="\${esc(roadmapProject)}">View project \${icon('arrow')}</button></div>\${roadmapTasks.length?roadmapTasks.map((t,i)=>\`<div class="roadmap-row"><span>\${esc(t.title)}</span><div class="timeline"><span style="width:\${Math.max(8,Number(t.progress)||0)}%;margin-left:\${Math.min(10,i*2)}%">\${t.done?'Completed':t.progress>=70?'In review':t.progress>=30?'In progress':'Planned'}</span></div></div>\`).join(''):\`<div class="work-empty-state"><strong>No linked milestones yet.</strong><span>Add a task to this project to populate the roadmap.</span></div>\`}</section>\`:''}`,
)

// --- J: My Work's right-rail "Performance connection" + "Balanced scorecard" mini-cards were 100%
// hardcoded (fake goal names, fake BSC pillar scores 88/92/84/86 with no real 4-pillar breakdown
// available — see lib/performance-v22-mock/types.ts's PerfDeptScorecard doc comment on why bucketing
// by perspective would be a guess). Replaced with one real "Performance" card. ---------------------
patch(
  "J work-side performance mini-cards",
  `<aside class="work-side"><section class="card card-pad"><div class="card-title"><h3>Performance connection</h3><button class="link-btn" data-nav="performance">Scorecard</button></div>\${[['My goal','Win 12 enterprise accounts',Math.min(100,avgProgress)],['Department objective','Grow enterprise pipeline',Math.min(100,Math.round(avgProgress*.92))],['Company goal','Sustainable growth in core markets',74]].map(x=>\`<div class="detail-section"><div style="display:flex;justify-content:space-between"><div><strong style="font-size:10px">\${x[0]}</strong><div style="font-size:9px;color:var(--muted);margin-top:3px">\${x[1]}</div></div><strong style="font-size:12px">\${x[2]}%</strong></div><div class="progress-mini"><i style="width:\${x[2]}%"></i></div></div>\`).join('')}</section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><h3>Balanced scorecard</h3><span style="font-size:9px;color:var(--muted)">Q3 · Live</span></div><div class="scorecard bsc-mini-scorecard">\${[['88','Financial & portfolio'],['92','Stakeholder'],['84','Process & governance'],['86','Learning & growth']].map(x=>\`<div class="score-box"><strong>\${x[0]}</strong><span>\${x[1]}</span></div>\`).join('')}</div><button class="secondary-btn" data-action="open-scorecard" style="width:100%;margin-top:12px">Open balanced scorecard</button></section></aside>`,
  `<aside class="work-side"><section class="card card-pad"><div class="card-title"><h3>Performance</h3><button class="link-btn" data-nav="performance">Open</button></div>\${D.performanceOverview&&D.performanceOverview.available?\`<div class="detail-section"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:20px">\${D.performanceOverview.overallScore!=null?D.performanceOverview.overallScore+'%':'—'}</strong><span style="font-size:10px;color:var(--muted)">\${esc(D.performanceOverview.periodLabel||'')}</span></div><span style="font-size:10px;color:var(--muted)">\${esc(D.performanceOverview.statusLabel||'Overall score')}</span></div>\${D.performanceOverview.goals.slice(0,3).map(g=>\`<div class="detail-section"><div style="display:flex;justify-content:space-between"><strong style="font-size:10px">\${esc(g.title)}</strong><strong style="font-size:12px">\${g.score!=null?g.score+'%':'—'}</strong></div><div class="progress-mini"><i style="width:\${g.score||0}%"></i></div></div>\`).join('')}\`:\`<div class="empty-state-row">\${esc((D.performanceOverview&&D.performanceOverview.blockedReason)||'No active performance contract for this period.')}</div>\`}</section></aside>`,
)

// --- K: performanceOverview() — was a wall of fabricated narrative/metrics/feedback/competency
// content with zero real backing (see execution-plan.md Phase 5 notes for the full inventory of
// what /performance/scorecards/user actually returns). Real score + real linked goals, honest
// empty state when no contract is active; Scorecard/Goals/Feedback/Development tabs stay deferred
// exactly as the original plan allowed ("as a follow-up sub-phase... will report before splitting
// further") — this only touches the Overview tab's own function.
patch(
  "K performanceOverview rewrite",
  `function performanceOverview(mult){
    const months=['Apr','May','Jun','Jul','Aug','Sep'];
    const metrics=[
      {title:'Goal progress',value:75,subtitle:'Weighted progress',delta:'▲ 8pp vs Q2 2026',icon:'target',tone:'',target:80,points:[52,56,61,58,66,75]},
      {title:'On-time delivery',value:89,subtitle:'Deliverables on time',delta:'▲ 7pp vs Q2 2026',icon:'clock',tone:'cyan',target:85,points:[74,76,78,80,85,89]},
      {title:'Project contribution',value:83,subtitle:'Peer & stakeholder rating',delta:'▲ 6pp vs Q2 2026',icon:'people',tone:'amber',target:85,points:[60,64,69,71,77,83]},
      {title:'Scorecard trend',value:85,subtitle:'Overall score',delta:'▲ 7.2 vs Q2 2026',icon:'performance',tone:'emerald',target:90,points:[72,70,72,80,78,85]}
    ];
    return \`<div class="performance-page-v9"><section class="card performance-hero-v9"><div class="performance-hero-copy"><span class="eyebrow">Quarterly narrative</span><h2>Strong momentum, with two decisions that need your attention.</h2><p>Your investment analysis and diligence are creating measurable impact. Closing the Zambia mandate and publishing the sector note will turn that momentum into a stronger quarter-end result.</p><div class="performance-hero-actions"><button class="primary-btn" data-nav="my-work">Open linked work \${icon('arrow')}</button><button class="secondary-btn" data-performance-tab="Goals">Review goals</button></div></div><div class="performance-score-v9"><div class="score-ring" style="--score:\${Math.round(84+mult/2)}"><div><strong>\${Math.round(84+mult/2)}</strong><span>Overall score</span></div></div><div class="score-delta"><strong>+7.2</strong><span>vs Q2 2026</span></div></div><div class="score-movement-v9"><h3>Score movement</h3><div class="movement-chart">\${performanceMetricChartSvg([72,78,85],{xLabels:['Q1 2026','Q2 2026','Q3 2026'],target:90,xLabel:'Review quarter',yLabel:'Score (%)',ariaLabel:'Overall score movement by review quarter'})}</div><div class="score-status-v9"><div class="score-status-card on-track"><span class="status-icon">\${icon('check')}</span><strong>On track</strong><span>Portfolio impact<br>Stakeholder feedback<br>Compliance</span></div><div class="score-status-card attention"><span class="status-icon">\${icon('alert')}</span><strong>Needs attention</strong><span>Zambia mandate<br>Sector note<br>Strategy preparation</span></div></div></div></section>
      <section class="performance-metric-grid-v9">\${metrics.map((m,i)=>\`<article class="card performance-metric-card"><div class="metric-card-head"><div class="performance-metric-icon \${m.tone}">\${icon(m.icon)}</div><strong>\${m.title}</strong><button class="icon-only more-actions-btn" data-action="metric-menu" data-metric="\${esc(m.title)}" aria-label="More options for \${esc(m.title)}">\${icon('more')}</button></div><div class="metric-value">\${m.value}\${i===3?'':'%'}</div><div class="metric-subtitle">\${m.subtitle}</div><div class="metric-delta">\${m.delta}</div><div class="performance-metric-chart-wrap">\${performanceMetricChartSvg(m.points,{xLabels:months,target:m.target,xLabel:'Month',yLabel:i===3?'Score (%)':'Performance (%)',ariaLabel:\`\${m.title} from April to September\`})}</div></article>\`).join('')}</section>
      <div class="performance-goal-grid-v9"><section class="card card-pad goal-portfolio-v4"><div class="card-title"><div><span class="eyebrow">Goal portfolio</span><h3>Q3 2026 priorities</h3></div><button class="link-btn" data-performance-tab="Goals">View all goals \${icon('arrow')}</button></div>\${[['Zambia renewable energy mandate',40,78,'High',3],['Diversify sector research pipeline',25,65,'Medium',2],['Build client insights capability',20,72,'High',2],['Team knowledge sharing',15,60,'Medium',1]].map((g,i)=>\`<button class="goal-row-v4" data-performance-goal="\${i}"><div class="goal-rank">0\${i+1}</div><div class="goal-title"><strong>\${g[0]}</strong><span>\${g[1]}% weighting · \${g[4]} evidence items</span></div><div class="goal-progress"><div class="progress-mini"><i style="width:\${g[2]}%"></i></div><strong>\${g[2]}%</strong></div><span class="confidence \${g[3].toLowerCase()}"><i></i>\${g[3]}</span>\${icon('chevron')}</button>\`).join('')}</section><section class="card card-pad contribution-card"><div class="card-title"><div><span class="eyebrow">Contribution map</span><h3>Where your impact is landing</h3></div><select class="select-control small-btn"><option>All projects</option><option>Client work</option><option>Internal</option></select></div><div class="contribution-chart"><div class="contribution-donut"><div><strong>82%</strong><span>Contribution</span></div></div><div class="contribution-legend">\${[['Client outcomes','38%','blue'],['Investment quality','27%','cyan'],['Team enablement','19%','emerald'],['Governance','16%','amber']].map(x=>\`<div><i class="\${x[2]}"></i><span>\${x[0]}</span><strong>\${x[1]}</strong></div>\`).join('')}</div></div><div class="impact-note"><div class="task-icon">\${icon('sparkles')}</div><div><strong>Highest-impact contribution</strong><p>Financial model revisions reduced the Zambia mandate decision cycle by 8 days.</p></div></div></section></div>
      <div class="performance-lower-grid-v9"><section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Capability profile</span><h3>Competency breakdown</h3></div><button class="link-btn" data-performance-tab="Development">View plan</button></div>\${[['Strategic thinking',90],['Execution excellence',85],['Stakeholder influence',82],['Analytical rigour',80],['Team leadership',75]].map(x=>\`<div class="competency-score-row"><span>\${x[0]}</span><div class="progress-mini"><i style="width:\${x[1]}%"></i></div><strong>\${x[1]}</strong></div>\`).join('')}<div class="chart-context"><span>Scale <strong>0–100</strong></span><span>Quarterly assessment</span></div></section><section class="card card-pad feedback-timeline-v9"><div class="card-title"><div><span class="eyebrow">Feedback timeline</span><h3>Recent observations</h3></div><button class="link-btn" data-performance-tab="Feedback">View all</button></div>\${D.people.slice(0,3).map((p,i)=>\`<button class="feedback-row-v4" data-feedback-open="\${i}">\${avatar(p)}<div><div class="feedback-meta"><strong>\${p.name}</strong><span>\${['Director','Partner','Head of Research'][i]}</span></div><p>\${['Great analysis on the fintech sector note. Sharp insights and clear recommendations.','Excellent stakeholder management during the Zambia diligence.','Keep pushing on thought leadership. Excited to see the next sector note.'][i]}</p></div><small>\${['24 Sep','18 Sep','10 Sep'][i]}</small></button>\`).join('')}</section><section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Review readiness</span><h3>Ready to submit</h3></div></div><div class="readiness-gauge-v9"><div><strong>High</strong><span>Ready</span></div></div>\${['Goals are up to date','Self-assessment completed','Manager feedback received','Supporting evidence linked'].map(x=>\`<div class="readiness-check"><i>✓</i><span>\${x}</span></div>\`).join('')}<button class="link-btn" data-action="prepare-review" style="margin-top:10px">View review packet \${icon('arrow')}</button></section><section class="card card-pad score-history-v9"><div class="card-title"><div><span class="eyebrow">Score history</span><h3>Five-quarter trend</h3></div><span class="status-pill blue">Target 90</span></div><div class="axis-chart-frame">\${detailedChartSvg([65,70,72,78,85],{xLabels:['Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026'],ySuffix:'',yLabel:'Score',xLabel:'Review quarter',min:0,max:100,target:90,ariaLabel:'Overall performance score over five review quarters'})}</div><div class="chart-context"><span>Current <strong>85</strong></span><span>+20 points over five quarters</span></div></section></div>
      <section class="card performance-footer-strip"><div><span class="eyebrow">Next review</span><strong>Mid-year performance review</strong><small>22 July 2026 · 10:00 · Chipo Dube</small></div><div class="review-readiness"><span>Review readiness</span><div class="progress-mini"><i style="width:86%"></i></div><strong>86%</strong></div><button class="primary-btn" data-action="prepare-review">Prepare review</button></section></div>\`;
  }`,
  `function performanceOverview(mult){
    const perf=D.performanceOverview;
    if(!perf||!perf.available){
      return \`<div class="performance-page-v9"><section class="card card-pad"><div class="empty-state">\${icon('performance')}<h3>No active performance contract</h3><p>\${esc((perf&&perf.blockedReason)||'Your reviewer has not opened a performance contract for the current period yet.')}</p></div></section></div>\`;
    }
    const goals=perf.goals||[];
    return \`<div class="performance-page-v9"><section class="card performance-hero-v9"><div class="performance-hero-copy"><span class="eyebrow">\${esc(perf.periodLabel||'Current period')}</span><h2>\${esc(perf.contractTitle||'Your performance contract')}</h2><p>\${goals.length} linked goal\${goals.length===1?'':'s'} · \${esc(perf.statusLabel||'In progress')}</p><div class="performance-hero-actions"><button class="primary-btn" data-nav="my-work">Open linked work \${icon('arrow')}</button></div></div><div class="performance-score-v9"><div class="score-ring" style="--score:\${Math.round(perf.overallScore||0)}"><div><strong>\${perf.overallScore!=null?Math.round(perf.overallScore):'—'}</strong><span>Overall score</span></div></div></div></section>
      <section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Goal portfolio</span><h3>Weighted goals for this period</h3></div></div>\${goals.length?goals.map((g,i)=>\`<div class="goal-row-v4"><div class="goal-rank">0\${i+1}</div><div class="goal-title"><strong>\${esc(g.title)}</strong><span>\${g.weight!=null?g.weight+'% weighting':'No weighting set'}</span></div><div class="goal-progress"><div class="progress-mini"><i style="width:\${g.score||0}%"></i></div><strong>\${g.score!=null?g.score+'%':'—'}</strong></div>\${g.status?\`<span class="confidence">\${esc(g.status)}</span>\`:''}</div>\`).join(''):\`<div class="work-empty-state">\${icon('target')}<strong>No goals linked yet.</strong><span>Goals your reviewer links to this contract will appear here.</span></div>\`}</section></div>\`;
  }`,
)

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
