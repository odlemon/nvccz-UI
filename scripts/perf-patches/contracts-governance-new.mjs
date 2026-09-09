/**
 * Performance Contracts — a NEW control for department/board/CEO contract creation.
 *
 * The existing "Create contract" modal (see `contracts-write.mjs`) only ever covered
 * employee contracts — it has role/manager/objectives-with-weights fields with no equivalent
 * on a department, board or CEO contract, and forcing those three through it would mean
 * either lying about the fields or a confusing form. The backend's own create endpoints for
 * these three types need almost nothing (`departmentName`/`subjectUserId` + `periodYear`), so
 * this adds one small, purpose-built control instead — the exception the project's own ground
 * rules carve out for a control a real write path needs, since no UI for these three contract
 * types existed anywhere in the shipped design.
 *
 * Without this, the Board and CEO scorecards (wired in `scorecards.mjs`) had no route to a
 * real contract at all — verified in this session only by creating one directly over the API.
 */

export default [
  {
    label: "contracts-governance-button",
    find: "${canEditContracts()?`<button class=\"btn primary\" data-v13-action=\"contract-create\">${icon('plus')}Create contract</button>`:''}",
    repl: "${canEditContracts()?`<button class=\"btn primary\" data-v13-action=\"contract-create\">${icon('plus')}Create contract</button>`:''}${/* patched:contracts-governance-button */canEditContracts()?`<button class=\"btn\" data-v13-action=\"contract-create-governance\">${icon('plus')}New department / board / CEO contract</button>`:''}",
  },
  {
    label: "contracts-governance-handler",
    find: "if(act==='contract-create')contractModal();",
    repl: "if(act==='contract-create')contractModal();\n    else if(act==='contract-create-governance'){\n      /* patched:contracts-governance-handler */\n      // Department, Board and CEO contracts don't fit the employee-contract editor\n      // (no objectives-with-weights step, no employee/role/manager fields) - the backend\n      // create endpoints for these three types only ever needed subjectUserId/departmentName\n      // + periodYear, so this is a small, honest, purpose-built form rather than a forced fit\n      // into the rich employee editor.\n      var users=(__perfScope('users')||[]);\n      var depts=(__perfScope('departments')||[]);\n      modal('New Department / Board / CEO Contract','Create the governance contract a department, board or CEO scorecard needs before it can compute a score.',\n        '<form id=\"v13GovContractForm\" class=\"v13-stack\">'\n        + '<div class=\"v13-field\"><label>Contract type</label><select name=\"kind\" id=\"v13GovKind\">'\n        + '<option value=\"department\">Department</option><option value=\"board\">Board</option><option value=\"ceo\">CEO</option>'\n        + '</select></div>'\n        + '<div class=\"v13-field\" id=\"v13GovDeptField\"><label>Department</label><select name=\"departmentName\">'\n        + depts.map(function(d){return '<option>'+esc(d.name)+'</option>'}).join('')\n        + '</select></div>'\n        + '<div class=\"v13-field\" id=\"v13GovUserField\" style=\"display:none\"><label>Subject (chairperson / CEO)</label><select name=\"subjectUserId\">'\n        + users.map(function(u){return '<option value=\"'+u.id+'\">'+esc(u.name)+(u.department?' \\u00b7 '+esc(u.department):'')+'</option>'}).join('')\n        + '</select></div>'\n        + '<div class=\"v13-field\"><label>Period year</label><select name=\"periodYear\">'\n        + [2025,2026,2027].map(function(y){return '<option'+(y===2026?' selected':'')+'>'+y+'</option>'}).join('')\n        + '</select></div>'\n        + '</form>',\n        '<button class=\"btn\" data-action=\"close-overlays\">Cancel</button><button class=\"btn primary\" data-v13-action=\"contract-governance-save\">'+icon('check')+'Create contract</button>');\n      setTimeout(function(){\n        var kindSel=document.getElementById('v13GovKind');\n        var deptField=document.getElementById('v13GovDeptField');\n        var userField=document.getElementById('v13GovUserField');\n        function sync(){var isDept=kindSel.value==='department';deptField.style.display=isDept?'':'none';userField.style.display=isDept?'none':''}\n        if(kindSel){kindSel.addEventListener('change',sync);sync()}\n      },0);\n    }\n    else if(act==='contract-governance-save'){\n      /* patched:contracts-governance-save */\n      var f=document.getElementById('v13GovContractForm');\n      if(!f||!f.reportValidity())return;\n      var fd=new FormData(f);\n      var kind=String(fd.get('kind')||'department');\n      var payload={kind:kind,periodYear:Number(fd.get('periodYear'))||2026};\n      if(kind==='department')payload.departmentName=String(fd.get('departmentName')||'');\n      else payload.subjectUserId=String(fd.get('subjectUserId')||'');\n      if(typeof window.__PERF_SUBMIT_CONTRACT__!=='function'){toast('Not saved','Contract creation is not connected to the backend in this session.');return}\n      window.__PERF_SUBMIT_CONTRACT__(payload).then(function(){closeOverlays();render()}).catch(function(){closeOverlays();render()});\n    }",
  },
]
