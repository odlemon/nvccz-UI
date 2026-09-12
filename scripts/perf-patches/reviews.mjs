/**
 * Performance Reviews (`/performance/reviews`).
 *
 * LIVE RENDERER — established by tracing the override chain, not by grepping.
 *   There are two `function reviews(...)` declarations in the runtime and NEITHER is the
 *   page renderer:
 *     - the first, `function reviews(){…}`, is the original core page function. It is
 *       reassigned twice (the v4 and v5 layers) and then bypassed entirely.
 *     - the second, `function reviews(r,ex){…}`, takes two arguments and belongs to the
 *       v21 *risk* layer — it renders "Review & audit history" on a risk record, nothing
 *       to do with this page. Patching either changes nothing on screen.
 *   The page is actually rendered by the v13 layer, whose `render` override short-circuits
 *   `state.page==='reviews'` into `reviewsPage()` before any earlier layer sees it. Every
 *   later override (v14 `pageEnhance`, v15, v17, v18, v20, v21, v24) delegates through it,
 *   so `reviewsPage()` + `reviewTabBody()` own the whole page. Confirmed against the DOM in
 *   `.perf-dumps/a4/sysadmin__reviews.txt`, not against the diff.
 *
 * WHAT WAS FABRICATED
 *   A seven-person review queue (Blessing Moyo / Natasha Chari / Tinashe Muchengti /
 *   Yvonne Sibanda / Tendai Nyathi / Kudzanai Ncube / Tariro Moyo) with invented job
 *   titles, departments, workflow statuses and KPI scores — from `state.reviews`, a literal
 *   array in the runtime. `performance_reviews` has 0 rows; not one of those people has a
 *   review.
 *   Four headline metrics: KPI score 84%, Goal completion 86%, Competency 4.2 / 5,
 *   Evidence 96%.
 *   A four-row "performance evidence summary" (92/90, 85/82, 78/80, 86/85) asserting
 *   verified measure-level results.
 *   A five-row activity log, a four-row audit trail (including "KPI score recalculated
 *   82% -> 84%") and two default attachments, all invented, on the other three tabs.
 *   Manager narrative textareas pre-filled with an assessment nobody wrote, and all five
 *   competency selects pre-set to 4 / 5 with "Strong evidence" beside them.
 *
 * WHAT IT SHOWS NOW
 *   The queue is the live `reviews` scope (`GET /api/performance-reviews` -> `data.reviews`).
 *   With 0 rows the page keeps its header and shows the runtime's own `v13-empty` panel,
 *   worded to distinguish "none created yet" from "could not load".
 *   KPI score comes from the review's own `overallScore`; goal completion, competency and
 *   evidence coverage have no source at all and read as not-tracked.
 *   Evidence summary, activity log, audit trail and attachments render honest empty states.
 *   The manager narrative and competency ratings start blank, so nothing on the form is an
 *   assessment the manager did not make.
 *
 * STILL UNSOURCED (backend gaps, reported up)
 *   - per-review goal completion, competency score, evidence coverage
 *   - measure-level review evidence (no endpoint, no table)
 *   - review activity log / audit trail (no endpoint)
 *   - review attachments (no endpoint)
 *   - `reviewCycles` (`GET /api/performance/review-cycles`) also returns 0 rows, so the
 *     cycle a review belongs to is only ever whatever the review row itself carries.
 */

// ---------------------------------------------------------------------------------------
// 1. The queue. `state.reviews` stays untouched on purpose: eight other call sites across
//    the scorecards, reports and v18 layers read it, and swapping it out from under them
//    is a different page's change. Only the list this page renders is re-sourced.
//
//    The Employee-role filter was `x.name==='Tariro Moyo'` — a fixture name. It is kept as
//    a filter (an employee must not see the whole company's reviews if the endpoint hands
//    them over — `PerformanceReviewService.list()` filters by query params, never by
//    caller) but now matches the real signed-in user instead of a hardcoded string.
// ---------------------------------------------------------------------------------------
const QUEUE_ANCHOR =
  "function reviewsPage(){const list=state.role==='Employee'?state.reviews.filter(r=>r.name==='Tariro Moyo'):state.reviews," +
  "r=list.find(x=>x.id===state.selectedReview)||list[0];" +
  "if(!r)return '<div class=\"page\"><div class=\"v13-empty\">No reviews are available for this role.</div></div>';"

const QUEUE =
  "function reviewsPage(){/* patched:reviews-live-queue */\n" +
  "    const __rvRaw=__perfScope('reviews');\n" +
  "    const __rvOk=__rvRaw!==null;\n" +
  "    const __rvAll=(__rvRaw||[]).map(x=>({\n" +
  "      id:x.id,\n" +
  "      name:x.employee||x.name||__perfDash(),\n" +
  "      role:x.cycle||__perfDash(),\n" +
  "      dept:x.department||__perfDash(),\n" +
  "      status:__perfLabel(x.status),\n" +
  "      due:__perfDate(x.dueDate),\n" +
  "      kpi:(typeof x.score==='number'?x.score:null),\n" +
  "      rating:null\n" +
  "    }));\n" +
  "    let __me='';try{__me=(getClientDesignSessionUser()||{}).name||''}catch(_){}\n" +
  "    const list=(state.role==='Employee'&&__me)?__rvAll.filter(x=>x.name===__me):__rvAll;\n" +
  "    const r=list.find(x=>x.id===state.selectedReview)||list[0];\n" +
  "    if(!r){\n" +
  "      const __m=canManageReviews();\n" +
  "      return '<div class=\"page v13-page\">'\n" +
  "        +pageHead('People Performance','Performance Reviews',__m?'Managers can conduct, save, calibrate and finalize assigned reviews with full evidence and audit history.':'Review your performance record, self-assessment and supporting evidence.','')\n" +
  "        +'<div class=\"v13-empty\">'+(__rvOk?'No performance reviews have been created yet.':'Performance reviews are unavailable \\u2014 the review list could not be loaded.')+'</div></div>';\n" +
  "    }\n"

// ---------------------------------------------------------------------------------------
// 2. The four headline metrics. Only KPI score has a field behind it (`overallScore` on the
//    review row, null on every row today). The other three measure nothing the backend
//    records.
// ---------------------------------------------------------------------------------------
const METRICS_ANCHOR =
  "[['KPI score',r.kpi+'%'],['Goal completion','86%'],['Competency','4.2 / 5'],['Evidence','96%']]"

const METRICS =
  "/* patched:reviews-metrics */[" +
  "['KPI score',(r.kpi==null?__perfDash():__perfPct(r.kpi))]," +
  // No goal is linked to a review record, so there is no completion to roll up.
  "['Goal completion',__perfDash()]," +
  // Competency ratings live only in this form's local draft; nothing stores a score.
  "['Competency',__perfDash()]," +
  // No evidence is attached to a review, so coverage cannot be computed.
  "['Evidence',__perfDash()]]"

// ---------------------------------------------------------------------------------------
// 3. Performance evidence summary. There is no measure-level review evidence anywhere in
//    the API, so the four "Verified / Exceeds" rows asserted results against nothing.
// ---------------------------------------------------------------------------------------
const EVIDENCE_ANCHOR =
  "${[['Revenue / output','92%','90%','Verified','Exceeds']," +
  "['Cost / efficiency','85%','82%','Verified','Exceeds']," +
  "['Forecast / quality','78%','80%','Current','Meets']," +
  "['Goal completion','86%','85%','Verified','Exceeds']]" +
  ".map(x=>`<tr>${x.map((v,i)=>`<td>${i===0?'<strong>'+v+'</strong>':v}</td>`).join('')}</tr>`).join('')}"

const EVIDENCE =
  "${/* patched:reviews-evidence */'<tr><td colspan=\"5\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">" +
  "Measure-level review evidence is not captured yet, so no current-versus-target summary can be shown.</td></tr>'}"

// ---------------------------------------------------------------------------------------
// 4. Activity log tab — five invented events, including one attributed to a "Rules engine"
//    that does not exist. Nothing records review activity.
// ---------------------------------------------------------------------------------------
const ACTIVITY_ANCHOR =
  "${[['11 Aug · 05:42','Manager opened review','Nyasha Moyo']," +
  "['10 Aug · 16:10','Employee self-assessment submitted',r.name]," +
  "['10 Aug · 14:22','KPI evidence refreshed','Rules engine']," +
  "['09 Aug · 09:10','Peer feedback received','Natasha Chari']," +
  "['08 Aug · 08:00','Review opened','System']]" +
  ".map(x=>`<div class=\"v13-side-row\" style=\"grid-template-columns:125px minmax(0,1fr) 150px\"><span>${x[0]}</span><strong>${x[1]}</strong><span>${x[2]}</span></div>`).join('')}"

const ACTIVITY =
  "${/* patched:reviews-activity */'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">" +
  "Review activity is not recorded yet, so there is no history to show for this review.</p>'}"

// ---------------------------------------------------------------------------------------
// 5. Attachments tab — the `||[…]` fallback invented two evidence files for every review
//    that has none. Locally added attachments still render; the invented default does not.
// ---------------------------------------------------------------------------------------
const ATTACH_ANCHOR =
  "S.taskAttachments['review-'+r.id]||[{name:'KPI evidence snapshot.pdf',size:'1.1 MB'},{name:'Manager notes.docx',size:'340 KB'}]"

const ATTACH = "/* patched:reviews-attachments */S.taskAttachments['review-'+r.id]||[]"

const ATTACH_EMPTY_ANCHOR =
  "${at.map((a,i)=>`<div class=\"v13-side-row\" style=\"grid-template-columns:minmax(0,1fr) auto\"><div><strong>${esc(a.name)}</strong><div class=\"v13-form-note\">${esc(a.size||'Uploaded evidence')} · Review evidence</div></div><button class=\"btn small\" data-v13-action=\"review-attachment-preview\" data-id=\"${r.id}:${i}\">Preview</button></div>`).join('')}"

const ATTACH_EMPTY =
  "${/* patched:reviews-attachments-empty */at.map((a,i)=>`<div class=\"v13-side-row\" style=\"grid-template-columns:minmax(0,1fr) auto\"><div><strong>${esc(a.name)}</strong><div class=\"v13-form-note\">${esc(a.size||'Uploaded evidence')} · Review evidence</div></div><button class=\"btn small\" data-v13-action=\"review-attachment-preview\" data-id=\"${r.id}:${i}\">Preview</button></div>`).join('')" +
  "||'<p class=\"tiny\" style=\"margin:0;color:var(--muted, #6b7280)\">No evidence has been attached to this review yet.</p>'}"

// ---------------------------------------------------------------------------------------
// 6. Audit trail tab — four invented entries, one of which ("KPI score recalculated
//    82% -> 84%") fabricates a before-and-after for a score that has never existed.
// ---------------------------------------------------------------------------------------
const AUDIT_ANCHOR =
  "${[['11 Aug 05:42','Manager assessment opened','Nyasha Moyo','Review stage','Pending','In progress']," +
  "['10 Aug 16:10','Self-assessment submitted',r.name,'Self assessment','Draft','Submitted']," +
  "['10 Aug 14:22','KPI score recalculated','Rules engine','KPI score','82%','84%']," +
  "['09 Aug 09:10','Peer evidence added','Natasha Chari','Peer feedback','—','Approved']]" +
  ".map(x=>`<tr>${x.map((v,i)=>`<td>${i===1?'<strong>'+esc(v)+'</strong>':esc(v)}</td>`).join('')}</tr>`).join('')}"

const AUDIT =
  "${/* patched:reviews-audit */'<tr><td colspan=\"6\" style=\"text-align:center;padding:28px 12px;color:var(--muted, #6b7280)\">" +
  "Review field changes are not audited yet, so there is no trail to show.</td></tr>'}"

// ---------------------------------------------------------------------------------------
// 7. Draft defaults. The manager narrative arrived pre-written and every competency select
//    pre-set to 4 — a saved-looking assessment nobody made. The fields now start empty so
//    what the form shows is what a manager actually entered.
// ---------------------------------------------------------------------------------------
const DRAFT_ANCHOR =
  "function reviewDraft(r){return S.reviewDrafts[r.id]||(S.reviewDrafts[r.id]={overall:r.rating||'3 - Meets Expectations'," +
  "strengths:'Consistent delivery quality, ownership and reliable collaboration across assigned work.'," +
  "development:'Increase strategic communication, delegation and cross-functional influence.'," +
  "managerComment:'Performance evidence supports the current assessment. Continue focus on agreed development priorities.'," +
  "ratings:{'Results delivery':'4','Analytical / technical quality':'4','Stakeholder effectiveness':'4','Collaboration':'4','Ownership & initiative':'4'}})}"

const DRAFT =
  "function reviewDraft(r){/* patched:reviews-draft-defaults */return S.reviewDrafts[r.id]||(S.reviewDrafts[r.id]={" +
  "overall:r.rating||''," +
  "strengths:''," +
  "development:''," +
  "managerComment:''," +
  "ratings:{'Results delivery':'','Analytical / technical quality':'','Stakeholder effectiveness':'','Collaboration':'','Ownership & initiative':''}})}"

// The rating row needs an unset option now that the draft can be blank, and the note beside
// it must not read "Strong evidence" for a rating the manager has not given.
const RATING_ROW_ANCHOR =
  "<select data-v13-review-rating=\"${esc(k)}\" ${manage?'':'disabled'}>${['1','2','3','4','5'].map(n=>`<option ${v===n?'selected':''}>${n}</option>`).join('')}</select>" +
  "<input value=\"${v==='5'?'Exceptional evidence':v==='4'?'Strong evidence':'Meets required standard'}\" ${manage?'':'disabled'}>"

const RATING_ROW =
  "<select data-v13-review-rating=\"${esc(k)}\" ${manage?'':'disabled'}>${/* patched:reviews-rating-row */`<option value=\"\" ${v?'':'selected'}>\\u2014</option>`+['1','2','3','4','5'].map(n=>`<option ${v===n?'selected':''}>${n}</option>`).join('')}</select>" +
  "<input value=\"${v==='5'?'Exceptional evidence':v==='4'?'Strong evidence':v?'Meets required standard':''}\" placeholder=\"${manage?'Evidence for this rating':'Not rated'}\" ${manage?'':'disabled'}>"

// The overall-rating select must also be able to sit unset rather than silently claiming
// "3 - Meets Expectations" for a review no one has rated.
const OVERALL_ANCHOR =
  "<select id=\"v13ReviewOverall\" ${manage?'':'disabled'}>${['5 - Exceptional','4 - Exceeds Expectations','3 - Meets Expectations','2 - Partially Meets','1 - Does Not Meet'].map(x=>`<option ${d.overall===x?'selected':''}>${x}</option>`).join('')}</select>"

const OVERALL =
  "<select id=\"v13ReviewOverall\" ${manage?'':'disabled'}>${/* patched:reviews-overall */`<option value=\"\" ${d.overall?'':'selected'}>Not rated</option>`+['5 - Exceptional','4 - Exceeds Expectations','3 - Meets Expectations','2 - Partially Meets','1 - Does Not Meet'].map(x=>`<option ${d.overall===x?'selected':''}>${x}</option>`).join('')}</select>"

export default [
  { label: "reviews-live-queue", find: QUEUE_ANCHOR, repl: QUEUE },
  { label: "reviews-metrics", find: METRICS_ANCHOR, repl: METRICS },
  { label: "reviews-evidence", find: EVIDENCE_ANCHOR, repl: EVIDENCE },
  { label: "reviews-activity", find: ACTIVITY_ANCHOR, repl: ACTIVITY },
  { label: "reviews-attachments", find: ATTACH_ANCHOR, repl: ATTACH },
  { label: "reviews-attachments-empty", find: ATTACH_EMPTY_ANCHOR, repl: ATTACH_EMPTY },
  { label: "reviews-audit", find: AUDIT_ANCHOR, repl: AUDIT },
  { label: "reviews-draft-defaults", find: DRAFT_ANCHOR, repl: DRAFT },
  { label: "reviews-rating-row", find: RATING_ROW_ANCHOR, repl: RATING_ROW },
  { label: "reviews-overall", find: OVERALL_ANCHOR, repl: OVERALL },
]
