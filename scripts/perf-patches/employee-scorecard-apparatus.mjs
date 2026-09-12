/**
 * Employee Scorecard workspace apparatus (notes / evidence / update history / publish).
 *
 * `V.notes`/`V.evidence`/`V.history`/`V.products` were entirely `localStorage`-backed and
 * never touched a real API, even though the scorecard's own KPI/goal rows were already real
 * (see the `_scorecard-readers.mjs` / `employee-scorecard-matrix-empty` patches). Backed now
 * by `performance_scorecard_entries` (scripts/run-performance-scorecard-entries-migration.ts)
 * via `lib/performance-v22-mock/actions.ts` submitScorecardNote/Evidence/Publish and
 * bridge.ts fetchScorecardEntriesForCache, following the same on-demand keyed-cache pattern
 * as `__PERF_EMPLOYEE_SCORECARD__`/`_scorecard-readers.mjs`.
 *
 * Scope note: `historyAdd()`'s OTHER call sites (the automatic "scorecard refreshed from
 * review" bookkeeping in `syncReviewProducts()`, and the KPI-update flow's own history
 * entries) are left writing to the local `V.history` map only - the backend already appends
 * its own history entry for every note/evidence/publish write (see the service's use of
 * `$transaction`), so the real history list is populated without touching those call sites.
 * The "update KPI actual/target value" flow (`saveUpdate`/`saveRecord`, `V.updates`) is NOT
 * wired here either - that data rightly belongs on the real PerformanceGoal via the existing
 * `PATCH /performance/goals/:id/progress` endpoint, which needs a per-row goal id the current
 * `rowsFor()` output already carries (`g.id`) - flagged as a follow-up, not done in this pass.
 */

export default [
  {
    label: "scorecard-apparatus-evidence",
    find: "function addEvidence(){const r=currentReview(),input=document.createElement('input');input.type='file';input.accept='.pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.xlsx';input.onchange=()=>{const f=input.files?.[0];if(!f)return;const k=keyFor(r.id,V.period);V.evidence[k]=V.evidence[k]||[];V.evidence[k].unshift({name:f.name,type:f.type||'Document',size:(f.size/1024).toFixed(1)+' KB',date:'11 Aug 2026'});historyAdd(r.id,`Evidence added: ${f.name}`);save();render();if(typeof toast==='function')toast('Evidence recorded',`${f.name} is now linked to ${r.name}'s ${V.period} scorecard.`)};input.click()}",
    repl: "function addEvidence(){/* patched:scorecard-apparatus-evidence */const r=currentReview();const input=document.createElement('input');input.type='file';input.accept='.pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.xlsx';input.onchange=()=>{const f=input.files?.[0];if(!f)return;if(typeof window.__PERF_SUBMIT_SCORECARD_EVIDENCE__!=='function'){if(typeof toast==='function')toast('Not available','Evidence upload is not wired in this build.');return}window.__PERF_SUBMIT_SCORECARD_EVIDENCE__(f,r.id,V.period).then(function(res){if(res&&res.ok&&typeof window.__PERF_FETCH_SCORECARD_ENTRIES__==='function'){window.__PERF_FETCH_SCORECARD_ENTRIES__(r.id,V.period)}render()})};input.click()}",
  },
  {
    label: "scorecard-apparatus-note",
    find: "function saveNote(){const f=document.getElementById('v18NoteForm');if(!f?.reportValidity())return;const r=currentReview(),d=new FormData(f),k=keyFor(r.id,V.period);V.notes[k]=V.notes[k]||[];V.notes[k].unshift({type:String(d.get('type')),date:String(d.get('date')||'2026-08-11'),text:String(d.get('text'))});historyAdd(r.id,`${d.get('type')} added to the performance record.`);save();if(typeof closeOverlays==='function')closeOverlays();render();if(typeof toast==='function')toast('Review note saved','The note was recorded against the employee scorecard and review period.')}",
    repl: "function saveNote(){/* patched:scorecard-apparatus-note */const f=document.getElementById('v18NoteForm');if(!f?.reportValidity())return;const r=currentReview(),d=new FormData(f);if(typeof window.__PERF_SUBMIT_SCORECARD_NOTE__!=='function'){if(typeof toast==='function')toast('Not available','Notes are not wired in this build.');return}window.__PERF_SUBMIT_SCORECARD_NOTE__({employeeId:r.id,period:V.period,noteType:String(d.get('type')),text:String(d.get('text'))}).then(function(res){if(typeof closeOverlays==='function')closeOverlays();if(res&&res.ok&&typeof window.__PERF_FETCH_SCORECARD_ENTRIES__==='function'){window.__PERF_FETCH_SCORECARD_ENTRIES__(r.id,V.period)}render()})}",
  },
  {
    label: "scorecard-apparatus-publish",
    find: "function publish(){const r=currentReview(),prod=reviewProductStatus(r),k=keyFor(r.id,V.period);if(!canManage()){if(typeof toast==='function')toast('Permission required','Publishing is available to managers, HR/M&E, executives and system administrators.');return}if(!['Completed','Calibrated'].includes(r.status)){if(typeof toast==='function')toast('Review not final enough',`This scorecard remains ${prod[0].toLowerCase()}. Complete or calibrate the source performance review before publication.`);return}V.products[k]=V.products[k]||{};V.products[k].publishedAt='11 Aug 2026';V.products[k].publishedBy=state.role;historyAdd(r.id,'Employee scorecard published from the governed performance review.');save();render();if(typeof toast==='function')toast('Scorecard published',`${r.name}'s ${V.period} scorecard was published from the ${r.status.toLowerCase()} review record.`)}",
    repl: "function publish(){/* patched:scorecard-apparatus-publish */const r=currentReview(),prod=reviewProductStatus(r);if(!canManage()){if(typeof toast==='function')toast('Permission required','Publishing is available to managers, HR/M&E, executives and system administrators.');return}if(!['Completed','Calibrated'].includes(r.status)){if(typeof toast==='function')toast('Review not final enough',`This scorecard remains ${prod[0].toLowerCase()}. Complete or calibrate the source performance review before publication.`);return}if(typeof window.__PERF_SUBMIT_SCORECARD_PUBLISH__!=='function'){if(typeof toast==='function')toast('Not available','Publishing is not wired in this build.');return}window.__PERF_SUBMIT_SCORECARD_PUBLISH__(r.id,V.period).then(function(res){if(res&&res.ok&&typeof window.__PERF_FETCH_SCORECARD_ENTRIES__==='function'){window.__PERF_FETCH_SCORECARD_ENTRIES__(r.id,V.period)}render()})}",
  },
  {
    label: "scorecard-apparatus-read",
    find: "    syncReviewProducts();const r=currentReview();if(!r)return `<div class=\"page\"><div class=\"v18-empty\">No employee review records are available.</div></div>`;const d=reviewDraft(r),rows=rowsFor(r),score=overall(rows),prod=reviewProductStatus(r),k=keyFor(r.id,V.period),hist=V.history[k]||[],notes=V.notes[k]||[],evidence=V.evidence[k]||[],product=V.products[k]||{};",
    repl: "    /* patched:scorecard-apparatus-read */syncReviewProducts();const r=currentReview();if(!r)return `<div class=\"page\"><div class=\"v18-empty\">No employee review records are available.</div></div>`;const d=reviewDraft(r),rows=rowsFor(r),score=overall(rows),prod=reviewProductStatus(r);if(typeof window.__PERF_FETCH_SCORECARD_ENTRIES__==='function')window.__PERF_FETCH_SCORECARD_ENTRIES__(r.id,V.period);const __liveEntries=(function(){var g=window.__PERF_LIVE__;if(!g||!g.ready)return null;g.data=g.data||{};var cache=g.data.scorecardEntries||{};return cache[r.id+'|'+V.period]===undefined?null:cache[r.id+'|'+V.period]})();const hist=(__liveEntries&&__liveEntries.history)||[],notes=(__liveEntries&&__liveEntries.notes)||[],evidence=(__liveEntries&&__liveEntries.evidence)||[],product=(__liveEntries&&__liveEntries.publication&&__liveEntries.publication.published)?{publishedAt:__liveEntries.publication.publishedAt,publishedBy:(__liveEntries.publication.publishedBy?(__liveEntries.publication.publishedBy.firstName+' '+__liveEntries.publication.publishedBy.lastName):null)}:{};",
  },
]
