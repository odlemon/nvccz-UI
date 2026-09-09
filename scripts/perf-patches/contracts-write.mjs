/**
 * Performance Contracts — the "Create contract" modal (`contractModal()` / `saveContract()`).
 *
 * This modal already existed, fully built, and was entirely local: a fake CTR-2026-NNN id
 * pushed onto `S.contracts`, never posted anywhere. It is also the ONE place in the module
 * that can create BOTH a contract AND its objectives in one flow, so wiring it here closes two
 * gaps at once — contract creation and individual-goal creation — for the type this form
 * already covers (an employee's own contract). Department/board/CEO contract creation has no
 * equivalent existing UI; see `contracts-new-type.mjs`.
 *
 * WHAT WAS FABRICATED
 *   Employee was free text, not a real person. Department listed six names that don't match
 *   the real department list. Nothing was ever sent to an API — `saveContract()` only ever
 *   mutated `S.contracts`, a page-local array.
 *
 * WHAT IT DOES NOW
 *   Employee/department pickers list real users/departments. Saving creates a real
 *   `PerformanceContract` (POST /performance/contracts/employee) and then one real
 *   `PerformanceGoal` per objective row (POST /performance/goals), weight and perspective
 *   preserved, target parsed from the free-text target field, current value 0 (a newly
 *   created objective has not been measured yet). Company-goal linkage, measure text and
 *   evidence text have no home on a goal record and stay local-only — the local
 *   `S.contracts` document preview keeps showing them, they just don't reach the API.
 */

export default [
  {
    label: "contracts-write-employee-picker",
    find: "<div class=\"v13-field\"><label>Employee</label><input name=\"employee\" value=\"${esc(draft.employee)}\" required></div>",
    repl: "<div class=\"v13-field\"><label>Employee</label><select name=\"employeeId\">${/* patched:contracts-write-employee-picker */(__perfScope('users')||[]).map(u=>`<option value=\"${u.id}\" ${draft.employeeId===u.id?'selected':''}>${esc(u.name)}${u.department?' \\u00b7 '+esc(u.department):''}</option>`).join('')}</select></div>",
  },
  {
    label: "contracts-write-department-picker",
    find: "<div class=\"v13-field\"><label>Department</label><select name=\"department\">${['Finance','Investments','Operations','People & Culture','Client Experience','ICT'].map(x=>`<option ${draft.department===x?'selected':''}>${x}</option>`).join('')}</select></div>",
    repl: "<div class=\"v13-field\"><label>Department</label><select name=\"department\">${/* patched:contracts-write-department-picker */(__perfScope('departments')||[]).map(x=>`<option ${draft.department===x.name?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>",
  },
  {
    label: "contracts-write-period-year",
    find: "<div class=\"v13-field\"><label>Contract period</label><input name=\"period\" value=\"${esc(draft.period)}\" required></div>",
    repl: "<div class=\"v13-field\"><label>Contract period (year)</label><select name=\"periodYear\">${/* patched:contracts-write-period-year */[2025,2026,2027].map(y=>`<option ${String(y)===String(draft.periodYear||2026)?'selected':''}>${y}</option>`).join('')}</select></div>",
  },
  {
    label: "contracts-write-save",
    find: "function saveContract(mode){const f=document.getElementById('v13ContractForm');if(!f?.reportValidity())return;const total=updateContractWeights();if(total!==100){toast('Contract weight validation failed',`Objective weights total ${total}%. Adjust the objectives to exactly 100% before saving.`);return}const d=new FormData(f),rows=[...f.querySelectorAll('[data-v13-objective-row]')].map(r=>[r.querySelector('[name=\"objective\"]').value,Number(r.querySelector('[name=\"weight\"]').value),r.querySelector('[name=\"measure\"]').value,r.querySelector('[name=\"target\"]').value,r.querySelector('[name=\"evidence\"]').value,r.querySelector('[name=\"perspective\"]').value,r.querySelector('[name=\"companyGoal\"]').value]);let id=f.dataset.contractId,c=S.contracts.find(x=>x.id===id);if(!c){id='CTR-2026-'+String(100+S.contracts.length+1).slice(-3);c={id};S.contracts.unshift(c)}Object.assign(c,{employee:d.get('employee'),role:d.get('role'),department:d.get('department'),manager:d.get('manager'),period:d.get('period'),reviewCadence:d.get('cadence'),bodyText:d.get('bodyText')||'',notes:d.get('notes')||'',development:d.get('development')||'',objectives:rows,evidence:c.evidence||'0%',status:mode==='review'?'In Review':'Draft',version:c.version&&c.version.startsWith('v')?'v'+(parseFloat(c.version.slice(1))+0.1).toFixed(1):'Draft 1'});const docId=syncContractDoc(c);persist();closeOverlays();S.contractLayer=c.id;render();toast(mode==='review'?'Contract created and routed':'Contract draft saved',mode==='review'?`${c.employee}\u2019s contract is now in manager / HR review and the controlled document is previewable.`:`${c.employee}\u2019s contract remains an editable draft.`);if(mode==='review')addNotification({kind:'file',title:`Contract review requested \u00b7 ${c.employee}`,body:`${c.id} is ready for manager and HR/M&E review.`,priority:'Approval',target:'contract:'+c.id})}",
    repl: "function saveContract(mode){\n    /* patched:contracts-write-save */\n    // Was entirely local: a fake CTR-2026-NNN id pushed onto `S.contracts`, never posted\n    // anywhere. Now creates a real employee Performance Contract, then one real individual\n    // goal per objective row (weight/perspective real; target/measure/evidence text has no\n    // home on a goal and stays local-only, same treatment as the KPI form). The local\n    // `S.contracts` mirror is still updated so the existing document-preview/list UI keeps\n    // working exactly as designed.\n    const f=document.getElementById('v13ContractForm');if(!f?.reportValidity())return;\n    const total=updateContractWeights();\n    if(total!==100){toast('Contract weight validation failed',`Objective weights total ${total}%. Adjust the objectives to exactly 100% before saving.`);return}\n    const d=new FormData(f);\n    const rows=[...f.querySelectorAll('[data-v13-objective-row]')].map(r=>({\n      objective:r.querySelector('[name=\"objective\"]').value,\n      weight:Number(r.querySelector('[name=\"weight\"]').value),\n      measure:r.querySelector('[name=\"measure\"]').value,\n      target:r.querySelector('[name=\"target\"]').value,\n      evidence:r.querySelector('[name=\"evidence\"]').value,\n      perspective:r.querySelector('[name=\"perspective\"]').value,\n      companyGoal:r.querySelector('[name=\"companyGoal\"]').value,\n    }));\n    let id=f.dataset.contractId,c=S.contracts.find(x=>x.id===id);\n    if(!c){id='CTR-2026-'+String(100+S.contracts.length+1).slice(-3);c={id};S.contracts.unshift(c)}\n    const employeeId=d.get('employeeId'),users=__perfScope('users')||[],u=users.find(x=>x.id===employeeId);\n    Object.assign(c,{employee:u?u.name:d.get('employeeId'),role:d.get('role'),department:d.get('department'),manager:d.get('manager'),period:d.get('periodYear'),reviewCadence:d.get('cadence'),bodyText:d.get('bodyText')||'',notes:d.get('notes')||'',development:d.get('development')||'',objectives:rows.map(o=>[o.objective,o.weight,o.measure,o.target,o.evidence,o.perspective,o.companyGoal]),evidence:c.evidence||'0%',status:mode==='review'?'In Review':'Draft',version:c.version&&c.version.startsWith('v')?'v'+(parseFloat(c.version.slice(1))+0.1).toFixed(1):'Draft 1'});\n    const docId=syncContractDoc(c);\n    persist();\n\n    if(typeof window.__PERF_SUBMIT_CONTRACT__!=='function'||!employeeId){\n      closeOverlays();S.contractLayer=c.id;render();\n      toast('Not saved','Contract creation is not connected to the backend in this session.');\n      return;\n    }\n    const perspectiveMap={'Financial':'Financial','Stakeholder & Client':'Customer & Market','Internal Process':'Internal Operations','Learning & Growth':'Learning, Growth & HR'};\n    const periodYear=Number(d.get('periodYear'))||2026;\n    window.__PERF_SUBMIT_CONTRACT__({kind:'employee',subjectUserId:employeeId,periodYear})\n      .then(function(res){\n        const contractId=res&&res.message;\n        if(!contractId){closeOverlays();S.contractLayer=c.id;render();return;}\n        const parseNum=(t)=>{const m=String(t||'').match(/[\\d.]+/);return m?Number(m[0]):100;};\n        return Promise.all(rows.map(o=>window.__PERF_SUBMIT_GOAL__({\n          title:o.objective,\n          type:'individual',\n          scorecardPillar:perspectiveMap[o.perspective]||'Financial',\n          targetValue:parseNum(o.target),\n          currentValue:0,\n          targetUnit:'%',\n          priority:'medium',\n          startDate:periodYear+'-01-01',\n          endDate:periodYear+'-12-31',\n          assignedToId:employeeId,\n          performanceContractId:contractId,\n        })));\n      })\n      .then(function(){closeOverlays();S.contractLayer=c.id;render();})\n      .catch(function(){closeOverlays();S.contractLayer=c.id;render();});\n  }",
  },
]
