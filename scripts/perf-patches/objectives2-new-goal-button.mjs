/**
 * Objectives & KPIs (`okrInspo()`) — a NEW "New goal" control.
 *
 * The live Objectives page had no create-goal control at all — only search/filter. Added
 * because department- and company-type goals had no route to real data otherwise: the
 * existing "Create contract" modal (`contracts-write.mjs`) only creates individual goals
 * alongside an employee contract. `submit-goal-quick` is registered in `actions.ts`'s normal
 * `API_ACTIONS`/`handle()` path (unlike the KPI/contract forms, this one goes through the
 * central dispatcher like `submit-corrective`), guarded by `performance.goals.manage`.
 *
 * Company-type goals require a real KPI (the backend rejects an unmeasurable organisational
 * goal) — the KPI field is required client-side only when that type is selected, sourced from
 * the real `kpis` scope. If the catalogue is empty the option says so rather than being blank.
 */

export default [
  {
    label: "objectives-new-goal-button",
    find: "<div style=\"margin-left:auto\">${badge('Q3 2026')}</div>",
    repl: "${/* patched:objectives-new-goal-button */btn('New goal','new-goal-quick','primary','plus')}<div style=\"margin-left:auto\">${badge('Q3 2026')}</div>",
  },
  {
    label: "objectives-new-goal-map",
    find: "'new-task':newTask,'save-task':saveTask,'timesheet':timesheet,'start-review':startReview,'create-kpi':createKpi,'create-objective':createObjective,'new-corrective':newCorrective,'assign-access':assignAccess,'new-doc':newDoc,'save-new-doc':saveNewDoc,",
    repl: "/* patched:objectives-new-goal-map */'new-task':newTask,'new-goal-quick':newGoalQuick,'save-task':saveTask,'timesheet':timesheet,'start-review':startReview,'create-kpi':createKpi,'create-objective':createObjective,'new-corrective':newCorrective,'assign-access':assignAccess,'new-doc':newDoc,'save-new-doc':saveNewDoc,",
  },
  {
    label: "objectives-new-goal-fn",
    find: " const map={\n  'toggle-sidebar':",
    repl: "function newGoalQuick(){\n  /* patched:objectives-new-goal-fn */\n  // There was no \"create a goal\" control anywhere on the live Objectives page - only\n  // search/filter. Added because without it there is no route to real goal data for the\n  // department/company types the contract-creation flow (contracts-write.mjs) doesn't cover.\n  var users=(__perfScope('users')||[]);\n  var depts=(__perfScope('departments')||[]);\n  var contracts=(__perfScope('contracts')||[]);\n  var pillars=(__perfScope('pillarConfig')||[]);\n  var kpis=(__perfScope('kpis')||[]);\n  modal('New Goal','Create a goal linked to an existing performance contract and BSC perspective.',\n    '<form id=\"newGoalQuickForm\" class=\"form-grid\">'\n    + '<div class=\"field full\"><label>Title</label><input name=\"title\" required></div>'\n    + '<div class=\"field\"><label>Type</label><select name=\"type\" id=\"newGoalType\">'\n    + '<option value=\"individual\">Individual</option><option value=\"department\">Department</option><option value=\"company\">Company</option>'\n    + '</select></div>'\n    + '<div class=\"field\"><label>Perspective</label><select name=\"scorecardPillar\">'\n    + pillars.map(function(p){return '<option>'+esc(p.name)+'</option>'}).join('')\n    + '</select></div>'\n    + '<div class=\"field\"><label>Performance contract</label><select name=\"performanceContractId\"><option value=\"\">None</option>'\n    + contracts.map(function(c){return '<option value=\"'+c.id+'\">'+esc(c.name)+'</option>'}).join('')\n    + '</select></div>'\n    + '<div class=\"field\" id=\"newGoalAssigneeField\"><label>Assigned to</label><select name=\"assignedToId\">'\n    + users.map(function(u){return '<option value=\"'+u.id+'\">'+esc(u.name)+(u.department?' \\u00b7 '+esc(u.department):'')+'</option>'}).join('')\n    + '</select></div>'\n    + '<div class=\"field\" id=\"newGoalDeptField\" style=\"display:none\"><label>Department</label><select name=\"departmentName\">'\n    + depts.map(function(d){return '<option>'+esc(d.name)+'</option>'}).join('')\n    + '</select></div>'\n    + '<div class=\"field\" id=\"newGoalKpiField\" style=\"display:none\"><label>Linked KPI (required for company goals)</label><select name=\"kpiId\"><option value=\"\">'+(kpis.length?'Choose a KPI':'No KPIs in the catalogue yet')+'</option>'\n    + kpis.map(function(k){return '<option value=\"'+k.id+'\">'+esc(k.name)+'</option>'}).join('')\n    + '</select></div>'\n    + '<div class=\"field\"><label>Target value</label><input name=\"targetValue\" type=\"number\" value=\"100\" required></div>'\n    + '<div class=\"field\"><label>Target unit</label><input name=\"targetUnit\" value=\"%\"></div>'\n    + '<div class=\"field\"><label>Priority</label><select name=\"priority\"><option value=\"medium\">Medium</option><option value=\"high\">High</option><option value=\"low\">Low</option></select></div>'\n    + '<div class=\"field\"><label>Start date</label><input name=\"startDate\" type=\"date\" value=\"2026-01-01\"></div>'\n    + '<div class=\"field\"><label>End date</label><input name=\"endDate\" type=\"date\" value=\"2026-12-31\"></div>'\n    + '<div class=\"field full\"><label>Description</label><textarea name=\"description\"></textarea></div>'\n    + '</form>',\n    btn('Cancel','close-overlays')+btn('Create goal','submit-goal-quick','primary','plus'),'xl');\n  setTimeout(function(){\n    var typeSel=document.getElementById('newGoalType');\n    var assigneeField=document.getElementById('newGoalAssigneeField');\n    var deptField=document.getElementById('newGoalDeptField');\n    var kpiField=document.getElementById('newGoalKpiField');\n    function sync(){\n      var t=typeSel.value;\n      assigneeField.style.display=(t==='individual')?'':'none';\n      deptField.style.display=(t==='department')?'':'none';\n      kpiField.style.display=(t==='company')?'':'none';\n    }\n    if(typeSel){typeSel.addEventListener('change',sync);sync()}\n  },0);\n}\n const map={\n  'toggle-sidebar':",
  },
]
