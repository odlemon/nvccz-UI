import fs from "fs"

// Third pass on the extracted runtime, same CRLF-normalise / function-form-replace rules as
// patch-home-v3-live-data.mjs (see that file's header for why plain-string replacements are
// unsafe here — a literal `$'`/`$&` etc. in the replacement text gets parsed as a special
// pattern by String.replace, not a literal).
const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")
let missed = 0

function patch(label, oldStr, buildNew) {
  if (s.includes(oldStr)) {
    s = s.replace(oldStr, () => buildNew())
  } else {
    missed++
    console.error(`MISS: ${label}`)
  }
}

// 1. Services summary tiles + payslip modal are hardcoded literals. Extract into two helpers
//    reading D.servicesSummary (set by home-v3-app.tsx from real Payroll + service-requests
//    data), inserted right before the existing serviceModal function.
const serviceModalAnchor = "function serviceModal(id){"
if (!s.includes("function servicesSummaryTiles()")) {
  patch("serviceModal anchor for new helpers", serviceModalAnchor, () => `function servicesSummaryTiles(){
    const sum = D.servicesSummary || {};
    return [
      [sum.leaveBalanceLabel || '—', 'Leave balance', sum.leaveBalanceMeta || ''],
      [sum.payslipLabel || '—', 'Latest payslip', sum.payslipMeta || ''],
      [sum.pendingExpensesLabel || '—', 'Pending expenses', sum.pendingExpensesMeta || ''],
      [sum.learningLabel || 'Not tracked yet', 'Learning', sum.learningMeta || '']
    ];
  }
  function payslipModalMarkup(){
    const p = D.servicesSummary && D.servicesSummary.latestPayslip;
    if(!p){ return '<div class="card card-pad"><p>No payslips yet.</p></div>'; }
    return \`<div class="card card-pad"><div class="card-title"><h3>\${esc(p.periodLabel||'')}</h3><span class="status-pill low">Ready</span></div><div class="toggle-row"><span>Gross pay</span><strong>\${esc(p.grossLabel||'')}</strong></div><div class="toggle-row"><span>Deductions</span><strong>\${esc(p.deductionsLabel||'')}</strong></div><div class="toggle-row"><span>Take-home pay</span><strong style="font-size:18px;color:var(--blue)">\${esc(p.netLabel||'')}</strong></div></div><button class="primary-btn" style="width:100%;margin-top:14px" data-action="download-payslip" data-payslip-id="\${esc(p.id||'')}">\${icon('download')} Download payslip</button>\`;
  }
  ${serviceModalAnchor}`)
}

// 2. The summary-grid array literal -> servicesSummaryTiles()
patch(
  "summary tiles array literal",
  "[[`${state.leaveBalance.toFixed(1)} days`,'Leave balance','Renews 01 Jan 2027'],['US$3,450','Latest payslip','June 2026'],['US$215.60','Pending expenses','2 items'],['12.5 hours','Learning','Year to date']]",
  () => "servicesSummaryTiles()"
)

// 3. Payroll modal branch -> payslipModalMarkup()
patch(
  "payroll modal branch",
  "if(id==='payroll'){ modal('Latest payslip',`<div class=\"card card-pad\"><div class=\"card-title\"><h3>June 2026</h3><span class=\"status-pill low\">Ready</span></div><div class=\"toggle-row\"><span>Gross pay</span><strong>US$4,870.00</strong></div><div class=\"toggle-row\"><span>Deductions</span><strong>US$1,420.00</strong></div><div class=\"toggle-row\"><span>Take-home pay</span><strong style=\"font-size:18px;color:var(--blue)\">US$3,450.00</strong></div></div><button class=\"primary-btn\" style=\"width:100%;margin-top:14px\" data-action=\"download-payslip\">${icon('download')} Download payslip</button>`); return; }",
  () => "if(id==='payroll'){ modal('Latest payslip', payslipModalMarkup()); return; }"
)

// 4. Generic service-request modal: add a hidden requestType (service id) field, and an
//    Amount field specifically for the "expenses" service — no amount input existed before,
//    so "Submit expense" had nowhere to record what was actually being claimed.
patch(
  "generic service modal form",
  'modal(s.name,`<form id="serviceRequestForm"><input type="hidden" name="service" value="${esc(s.name)}"/><div class="form-grid"><div class="form-field"><label>Request type</label><select class="select-control" name="type"><option>${s.name} request</option><option>General enquiry</option></select></div><div class="form-field"><label>Required by</label><input class="input-control" type="date" name="date"/></div><div class="form-field full"><label>Details</label><textarea class="textarea-control" name="details" placeholder="Describe what you need and include any relevant context."></textarea></div><div class="form-field full"><label>Attachment</label><input class="input-control" type="file"/></div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn" type="submit">Submit request</button></div></form>`);',
  () =>
    'modal(s.name,`<form id="serviceRequestForm"><input type="hidden" name="service" value="${esc(s.name)}"/><input type="hidden" name="requestType" value="${esc(s.id)}"/><div class="form-grid"><div class="form-field"><label>Request type</label><select class="select-control" name="type"><option>${s.name} request</option><option>General enquiry</option></select></div>${s.id===\'expenses\'?\'<div class="form-field"><label>Amount (US$)</label><input class="input-control" type="number" step="0.01" min="0" name="amount" required placeholder="0.00"/></div>\':\'\'}<div class="form-field"><label>Required by</label><input class="input-control" type="date" name="date"/></div><div class="form-field full"><label>Details</label><textarea class="textarea-control" name="details" placeholder="Describe what you need and include any relevant context."></textarea></div><div class="form-field full"><label>Attachment</label><input class="input-control" type="file"/></div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn" type="submit">Submit request</button></div></form>`);'
)

// 5. download-payslip action: was a fake hardcoded-text blob. Now emits an integration event
//    with the real payslip id (set on the button by payslipModalMarkup above); the host does
//    the authenticated fetch + blob download, same division of labour as every other write.
patch(
  "download-payslip action handler",
  "if(action==='download-payslip'){const blob=new Blob(['MATANHO\\nPayslip — June 2026\\nGross pay: US$4,870.00\\nDeductions: US$1,420.00\\nTake-home pay: US$3,450.00'],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Matanho_Payslip_June_2026.txt';a.click();toast('Payslip downloaded.','success');return}",
  () =>
    "if(action==='download-payslip'){const btn=e.target.closest('[data-action=\"download-payslip\"]');const payslipId=btn&&btn.dataset.payslipId;if(!payslipId){toast('No payslip to download yet.');return}emitIntegrationEvent('payslip.download.requested',{payslipId});return}"
)

// 6. leaveRequestForm submit: add the same integration-event emission every other write action
//    already gets, carrying a human-readable summary (leave type + day count) for the request.
patch(
  "leaveRequestForm submit handler",
  "if(e.target.id==='leaveRequestForm'){const f=new FormData(e.target),start=new Date(f.get('start')),end=new Date(f.get('end'));let days=Math.max(.5,Math.round((end-start)/86400000)+1);if(f.get('halfDay'))days=.5;if(!Number.isFinite(days)||days<=0){toast('Choose a valid leave period.');return}if(f.get('type')==='Annual leave'&&days>state.leaveBalance){toast('This request exceeds your available annual leave.');return}if(f.get('type')==='Annual leave')state.leaveBalance=Math.max(0,state.leaveBalance-days);state.requests.unshift({id:`LEV-2026-${Math.floor(1100+Math.random()*800)}`,service:`${f.get('type')} · ${days} day${days===1?'':'s'}`,submitted:'31 Jul 2026',owner:'Tawanda Kasere',status:'In progress',next:'Manager approval'});saveState();closePortal();render();toast('Leave request submitted.','success');return}",
  () =>
    "if(e.target.id==='leaveRequestForm'){const f=new FormData(e.target),start=new Date(f.get('start')),end=new Date(f.get('end'));let days=Math.max(.5,Math.round((end-start)/86400000)+1);if(f.get('halfDay'))days=.5;if(!Number.isFinite(days)||days<=0){toast('Choose a valid leave period.');return}if(f.get('type')==='Annual leave'&&days>state.leaveBalance){toast('This request exceeds your available annual leave.');return}if(f.get('type')==='Annual leave')state.leaveBalance=Math.max(0,state.leaveBalance-days);const leaveSummary=`${f.get('type')} · ${days} day${days===1?'':'s'}`;state.requests.unshift({id:`LEV-2026-${Math.floor(1100+Math.random()*800)}`,service:leaveSummary,submitted:'31 Jul 2026',owner:'Tawanda Kasere',status:'In progress',next:'Manager approval'});saveState();emitIntegrationEvent('service.request.created',{type:'leave',summary:leaveSummary,amount:null});closePortal();render();toast('Leave request submitted.','success');return}"
)

// 7. serviceRequestForm submit: same treatment, carrying the requestType (service id) and
//    amount (only present for expenses, per patch 4) added above.
patch(
  "serviceRequestForm submit handler",
  "if(e.target.id==='serviceRequestForm'){const f=new FormData(e.target);state.requests.unshift({id:`SRV-2026-${Math.floor(1100+Math.random()*800)}`,service:f.get('service'),submitted:'30 Jul 2026',owner:'Fadzai Moyo',status:'In progress',next:'Review submitted details'});saveState();closePortal();render();toast('Service request submitted.','success');return}",
  () =>
    "if(e.target.id==='serviceRequestForm'){const f=new FormData(e.target);const reqSummary=String(f.get('service')||'Service request');state.requests.unshift({id:`SRV-2026-${Math.floor(1100+Math.random()*800)}`,service:reqSummary,submitted:'30 Jul 2026',owner:'Fadzai Moyo',status:'In progress',next:'Review submitted details'});saveState();emitIntegrationEvent('service.request.created',{type:String(f.get('requestType')||'other'),summary:reqSummary,amount:f.get('amount')?Number(f.get('amount')):null});closePortal();render();toast('Service request submitted.','success');return}"
)

fs.writeFileSync(p, s.replace(/\n/g, "\r\n"))
console.log(missed === 0 ? "0 missed" : `${missed} missed`)
