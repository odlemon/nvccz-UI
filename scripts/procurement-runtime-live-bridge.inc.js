/**
 * Procurement V23 runtime live bridge.
 *
 * Injected into components/procurement-v23-mock/matanho-procurement-runtime.js by
 * scripts/patch-procurement-runtime.mjs, inside startProcurementV23Runtime's scope and ahead
 * of the first page renderer. Do NOT edit the runtime by hand — edit this file (or the patch
 * script) and re-run the patch, so a fresh extract can always be re-patched reproducibly.
 *
 * Everything between the BEGIN/END markers is copied verbatim. The patch script fills the
 * `__PR23_LITERAL_KPIS__` placeholder with the fixture KPI literals found in the runtime.
 */

/* BEGIN_PROCUREMENT_LIVE_BRIDGE */

/**
 * Live figures from the React host (lib/procurement-v23/live-loaders.ts): `kpis` keyed by card
 * label and `navCounts` keyed by page id. The host sets an empty placeholder before the runtime
 * starts, so a live session never paints a fixture figure even before the first load lands.
 */
function __pr23Live() {
  return (typeof window !== 'undefined' && window.__pr23Live) || null;
}

/** "label|value" for every KPI card whose value is a literal in the vendored runtime. */
const __PR23_LITERAL_KPIS = new Set(/*__PR23_LITERAL_KPIS__*/[]);

/**
 * A KPI card's value and sub-text in a live session:
 *  - a label the loaders can answer gets the live figure and its stated derivation;
 *  - a card whose value is a fixture literal gets an em dash and says there is no source;
 *  - a card the runtime computes from state (already live data) passes through untouched.
 */
function __pr23Kpi(label, value, sub) {
  const live = __pr23Live();
  if (!live) return [value, sub];
  const known = live.kpis && live.kpis[label];
  if (known) return [known.value, known.sub];
  if (__PR23_LITERAL_KPIS.has(label + '|' + String(value))) return ['—', 'No live source for this figure yet'];
  return [value, sub];
}

/** Sidebar badge for a page: the live count, or no badge at all. Never the fixture count. */
function __pr23NavCount(pageId, fixtureCount) {
  const live = __pr23Live();
  if (!live) return fixtureCount;
  const n = live.navCounts && live.navCounts[pageId];
  return n ? String(n) : '';
}

function __pr23Esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** An honest empty state for a chart whose data is a fixture in the vendored runtime. */
function __pr23NoData(message) {
  return `<div class="pr23-no-data" style="padding:28px 16px;text-align:center;color:#64748b;font-size:13px">${__pr23Esc(message || 'No recorded data for this chart yet.')}</div>`;
}

/**
 * The purchase orders, receipts and invoices that really descend from a tender: orders awarded
 * from its quotations, then the receipts and invoices raised against those orders.
 */
function __pr23MatchChain(tenderId) {
  // An order raised without an RFQ is its own source.
  const orders = (state.orders || []).filter(o => o.rfq === tenderId || (!o.rfq && o.id === tenderId));
  const poIds = new Set(orders.map(o => o.id));
  const grns = (state.grns || []).filter(g => poIds.has(g.po));
  const invoices = (state.invoices || []).filter(i => poIds.has(i.po));
  const label = invoices.length ? 'Invoice received' : orders.length ? 'Awaiting invoice' : 'No purchase order yet';
  const tone = invoices.length ? 'green' : orders.length ? 'amber' : 'blue';
  return { orders, grns, invoices, label, tone };
}

/**
 * Invoice-match sources for a role that cannot see RFQs (Accounts Payable): the RFQ each order was awarded from,
 * or the order itself where it was raised directly, named from what was requisitioned. Without these the
 * Invoices page showed Accounts Payable an empty "Select a tender" card and no invoice at all.
 */
function __pr23MatchSources() {
  const seen = new Map();
  for (const o of state.orders || []) {
    if (String(o.rawStatus || '').toUpperCase() === 'CANCELLED') continue;
    const id = o.rfq || o.id;
    if (seen.has(id)) continue;
    // A role that cannot read requisitions has no department for the order; the supplier names the source instead.
    seen.set(id, { id, recordId: id, title: o.sourceTitle || `Purchase order ${o.id}`, entity: o.entity && o.entity !== '—' ? o.entity : o.vendor || '—', method: o.rfq ? 'Request for quotation' : 'Purchase order', bids: 0, stage: 'Awarded', close: '—', value: null });
  }
  return [...seen.values()];
}

/** [label, count, colour] segments -> a conic-gradient; grey when there is nothing to show. */
function __pr23Gradient(segments) {
  const total = segments.reduce((n, s) => n + s[1], 0);
  if (!total) return '#e5e7eb';
  let at = 0;
  return 'conic-gradient(' + segments.filter(s => s[1] > 0).map(s => {
    const from = at;
    at += (s[1] / total) * 100;
    return `${s[2]} ${from.toFixed(2)}% ${at.toFixed(2)}%`;
  }).join(',') + ')';
}

function __pr23Percentages(segments) {
  const total = segments.reduce((n, s) => n + s[1], 0);
  return segments.map(s => [s[0], total ? Math.round((s[1] / total) * 100) : 0, s[2]]);
}

/** Open work by procurement stage, counted from the hydrated records. */
function __pr23CycleSegments() {
  const req = state.requisitions || [], ten = state.tenders || [], ord = state.orders || [], grn = state.grns || [], inv = state.invoices || [];
  const planning = req.filter(r => r.rawStatus === 'DRAFT' || r.rawStatus === 'PENDING_APPROVAL').length;
  const sourcing = req.filter(r => r.rawStatus === 'APPROVED').length + ten.filter(t => t.stage === 'Published' || t.stage === 'Evaluation').length;
  const fulfilment = ord.filter(o => !/Delivered|Billed|Cancelled/i.test(o.status)).length
    + grn.filter(g => g.rawStatus === 'RECEIVED').length
    + inv.filter(i => i.status === 'Pending approval').length;
  const exceptions = grn.filter(g => g.rawStatus === 'REJECTED').length + inv.filter(i => i.status === 'Blocked' || /variance/i.test(i.match)).length;
  return [['Planning', planning, '#5b5f9e'], ['Sourcing', sourcing, '#2d79b8'], ['Fulfilment', fulfilment, '#0f8f78'], ['Exceptions', exceptions, '#c68a26']];
}

function __pr23CycleDonutHtml() {
  const segments = __pr23CycleSegments();
  const total = segments.reduce((n, s) => n + s[1], 0);
  return `<div class="donut chart-click" data-chart="cycle-status" style="background:${__pr23Gradient(segments)}"><div class="donut-center"><strong>${total}</strong><span>open records</span></div></div>`;
}

/** Legend for a donut in a live session, or null to add none (its data would be a fixture). */
function __pr23DonutLegend(wrap) {
  if (wrap.querySelector('[data-chart="cycle-status"]')) return __pr23Percentages(__pr23CycleSegments());
  return null;
}

/** Vendor tax-clearance position, from each vendor's ITF263 expiry and review status. */
function __pr23VendorCompliance() {
  const now = Date.now(), soon = now + 60 * 86400000;
  const n = { Valid: 0, Expiring: 0, Expired: 0, Review: 0 };
  for (const v of state.vendors || []) {
    const exp = v.taxExpiry ? new Date(v.taxExpiry).getTime() : null;
    if (!exp || exp < now) n.Expired += 1;
    else if (v.status === 'Compliance review') n.Review += 1;
    else if (exp <= soon) n.Expiring += 1;
    else n.Valid += 1;
  }
  const segments = [['Valid', n.Valid, '#0f8f78'], ['Expiring', n.Expiring, '#b87518'], ['Expired', n.Expired, '#c54a58'], ['Review', n.Review, '#d9dde5']];
  return { gradient: __pr23Gradient(segments), pct: Object.fromEntries(__pr23Percentages(segments).map(s => [s[0], s[1]])) };
}

/** Command-centre attention list, derived from the records rather than the fixture's four rows. */
function __pr23ControlActivity() {
  const rows = [];
  const pendingInvoices = (state.invoices || []).filter(i => i.status === 'Pending approval').length;
  if (pendingInvoices) rows.push(['invoices', 'Invoices awaiting approval', `${pendingInvoices} captured and not yet approved`, 'Pending']);
  const inspection = (state.grns || []).filter(g => g.rawStatus === 'RECEIVED').length;
  if (inspection) rows.push(['receiving', 'Receipts awaiting inspection', `${inspection} goods received note${inspection === 1 ? '' : 's'}`, 'Pending']);
  const noClearance = (state.vendors || []).filter(v => !v.taxExpiry).length;
  if (noClearance) rows.push(['vendors', 'Tax clearance missing', `${noClearance} vendor${noClearance === 1 ? '' : 's'} without an ITF263 expiry on file`, 'Review']);
  const unacknowledged = (state.orders || []).filter(o => o.rawStatus === 'SENT' && !o.acknowledged).length;
  if (unacknowledged) rows.push(['orders', 'Purchase orders not acknowledged', `${unacknowledged} sent and awaiting the vendor`, 'Pending']);
  if (!rows.length) return '<div class="list-row"><div class="list-main"><strong>Nothing needs attention</strong><span>No pending invoices, receipts, tax clearances or acknowledgements</span></div></div>';
  return rows.map(r => `<div class="list-row" data-page="${r[0]}"><div class="list-main"><strong>${__pr23Esc(r[1])}</strong><span>${__pr23Esc(r[2])}</span></div>${status(r[3])}</div>`).join('');
}

/** True when the signed-in user holds procurement.<permission>. */
function __pr23Can(permission) {
  const live = __pr23Live();
  return Boolean(live && live.access && (live.access.permissions || []).includes('procurement.' + permission));
}

// ---------------------------------------------------------------- tender builder (RFx)

/** A local date `days` from today as yyyy-mm-dd, or yyyy-mm-ddThh:mm when a time is given. */
function __pr23DateOffset(days, time) {
  const d = new Date(Date.now() + days * 86400000);
  const pad = n => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return time ? `${day}T${time}` : day;
}

/** Source records a new RFQ can be raised from: approved requisitions not yet sourced. */
function __pr23SourceOptions() {
  const ready = (state.requisitions || []).filter(r => r.rawStatus === 'APPROVED');
  if (!ready.length) return '<option value="">No approved requisition is awaiting sourcing</option>';
  return ready.map(r => `<option value="${__pr23Esc(r.recordId)}">${__pr23Esc(r.id)} - ${__pr23Esc(r.title)}</option>`).join('');
}

/**
 * Procurement categories, one list for every form: what a vendor is registered as, what a requisition is
 * sourced as, and what an RFQ invites. The API compares categories case- and space-insensitively
 * ("Office Supplies" matches OFFICE_SUPPLIES). The base list is there for every role — a requester cannot read
 * the vendor register, and a list built from it alone came up empty for them — and any other category a
 * vendor or requisition already carries is added to it.
 */
const __PR23_BASE_CATEGORIES = ['Office Supplies', 'Furniture', 'Technology', 'Facilities', 'Fleet', 'Medical', 'Agriculture', 'Professional Services'];

function __pr23VendorCategories() {
  const known = [...(state.vendors || []).map(v => v.category), ...(state.requisitions || []).map(r => r.category)]
    .filter(c => c && c !== '—');
  const key = c => String(c).trim().toUpperCase().replace(/[\s-]+/g, '_');
  const seen = new Map();
  for (const c of [...__PR23_BASE_CATEGORIES, ...known]) if (!seen.has(key(c))) seen.set(key(c), c);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Tender categories are the vendor registry's categories, so the category filter can match vendors. The
 * builder opens on the first approved requisition, so the category starts as that requisition's own: the
 * API refuses to invite a vendor whose category differs from the requisition's.
 */
function __pr23CategoryOptions() {
  const categories = __pr23VendorCategories();
  const first = (state.requisitions || []).find(r => r.rawStatus === 'APPROVED');
  // With no category of its own to follow, open on the category most vendors are registered in, so the builder
  // lists vendors instead of opening on the alphabetically first category, which may have none.
  const counts = new Map();
  for (const v of state.vendors || []) if (v.category && v.category !== '—') counts.set(v.category, (counts.get(v.category) || 0) + 1);
  const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const preset = first && categories.includes(first.category) ? first.category : busiest ? busiest[0] : null;
  return (categories.length ? categories : ['Uncategorised'])
    .map(c => `<option${c === preset ? ' selected' : ''}>${__pr23Esc(c)}</option>`)
    .join('');
}

/**
 * The New requisition form's Entity and Department, as the requisition is actually saved: the organisation, and
 * the requester's own department (the host raises it against that). The vendored selects showed "Matanho Holdings"
 * and "IT & Digital / CC-1001" to everyone, whatever their department.
 */
function __pr23RequisitionEntityField() {
  const org = (state.letterhead && state.letterhead.company) || 'Your organisation';
  return formField('Entity', `<select name="entity" disabled><option>${__pr23Esc(org)}</option></select>`);
}

function __pr23RequisitionDepartmentField() {
  const live = __pr23Live() || {};
  const dept = live.access && live.access.department;
  return formField('Department / cost centre', dept
    ? `<select name="cost" disabled><option>${__pr23Esc(dept)}</option></select>`
    : '<p class="muted">Your account has no department, so a requisition cannot be raised yet. Ask an administrator to set it.</p>');
}

/**
 * The New requisition form's categories. The vendored list (Technology, Medical, Agriculture, …) defaulted to
 * Technology and matched no registered vendor but that one, so every request was sourced as Technology
 * without anyone choosing it. The requester now picks one of the categories vendors are registered in.
 */
function __pr23RequisitionCategoryOptions() {
  const categories = __pr23VendorCategories();
  if (!categories.length) return '<option value="">No vendor category is registered yet</option>';
  return '<option value="">Choose a category</option>' + categories.map(c => `<option>${__pr23Esc(c)}</option>`).join('');
}

// ---------------------------------------------------------------- bid evaluation and award

/** "Vendor (QUO_…)" for a quotation record id, so a confirmation names the bidder rather than an id. */
function __pr23QuoteLabel(recordId) {
  const q = (state.quotationsLive || []).find(x => x.recordId === recordId);
  return q ? `${q.vendor} (${q.id})` : recordId;
}

/** A tender's bids: the comparison matrix when it was loaded, otherwise the quotations alone. */
function __pr23EvaluationRows(tenderId) {
  const ev = (state.evaluationLive || {})[tenderId];
  if (ev && Array.isArray(ev.rows)) return ev;
  const rows = (state.quotationsLive || []).filter(q => q.rfq === tenderId);
  return { rows, priceWeight: null, technicalWeight: null, complete: false };
}

function __pr23EvaluationPageHtml(t) {
  if (!t) return `<div class="page">${pageHead('Governed decisioning', 'Bid Evaluation', 'The selected tender is no longer in your register.', btn('Back to tender list', 'back-evaluations'))}</div>`;
  const ev = __pr23EvaluationRows(t.id);
  const rows = ev.rows;
  const canScore = __pr23Can('quotations.manage');
  const open = rows.filter(r => r.open);
  const scored = rows.filter(r => r.evaluationScore != null).length;
  const lowest = rows.reduce((m, r) => (r.amount != null && (m == null || r.amount < m.amount) ? r : m), null);
  const top = ev.complete ? rows.reduce((m, r) => (r.weighted != null && (m == null || r.weighted > m.weighted) ? r : m), null) : null;
  const awarded = rows.find(r => r.rawStatus === 'ACCEPTED');
  const pct = v => (v == null ? '—' : `${Math.round(v * 100)}%`);
  const scoreCell = r => canScore && r.open
    ? `<input type="number" min="0" max="100" step="1" data-score-quote="${__pr23Esc(r.recordId)}" data-score-was="${r.evaluationScore == null ? '' : r.evaluationScore}" value="${r.evaluationScore == null ? '' : r.evaluationScore}" placeholder="0–100" style="width:84px">`
    : (r.evaluationScore == null ? '<span class="muted">Not scored</span>' : `${r.evaluationScore}%`);
  const tableRows = rows.map((r, i) => `<tr><td><strong>${i + 1}</strong></td><td><strong>${__pr23Esc(r.vendor)}</strong><br><span class="muted">${__pr23Esc(r.id)}</span></td><td>${scoreCell(r)}</td><td>${r.priceScore == null ? '—' : `${Math.round(r.priceScore)}%`}</td><td><strong>${r.weighted == null ? 'Not scored' : `${r.weighted.toFixed(1)}%`}</strong></td><td class="money">${money(r.amount)}</td><td>${status(r.status)}</td></tr>`);
  const actions = btn('Back to tender list', 'back-evaluations') + (canScore && open.length ? btn('Save scores', 'save-scores', 'primary') : '');
  return `<div class="page">${pageHead('Governed decisioning', `${__pr23Esc(t.id)} Bid Evaluation`, `${__pr23Esc(t.title)} · ${__pr23Esc(t.entity)} · ${rows.length} submitted bid${rows.length === 1 ? '' : 's'}`, actions)}
 <div class="notice" style="margin-bottom:14px"><div><strong>How bids are ranked</strong><p>The technical score is the evaluation team's, entered here; a vendor's own declarations are not counted. The price score is relative to the lowest bid. The weighted score appears once every bid is scored.</p></div></div>
 <div class="grid kpis">${kpi('Bids received', rows.length, `${open.length} open for decision`, 'vendor')}${kpi('Bids scored', `${scored} of ${rows.length}`, ev.complete ? 'Every bid has a technical score' : 'Score every bid to rank them', 'evaluate')}${kpi('Technical weighting', pct(ev.technicalWeight), 'Set on the RFQ', 'evaluate')}${kpi('Price weighting', pct(ev.priceWeight), 'Relative to the lowest bid', 'account')}${kpi('Lowest bid', lowest ? money(lowest.amount) : '—', lowest ? lowest.vendor : 'No bids yet', 'account')}${kpi(awarded ? 'Awarded to' : 'Top weighted score', awarded ? awarded.vendor : (top ? `${top.weighted.toFixed(1)}%` : '—'), awarded ? `${awarded.id} accepted` : (top ? top.vendor : 'Waiting for scores'), 'approve')}</div>
 ${card('Quotation and bid comparison', canScore && open.length ? 'Enter a technical score from 0 to 100 for each bid, then save.' : 'Scores, prices and weighted ranking for this tender', table(['Rank', 'Vendor', 'Technical', 'Price', 'Weighted score', 'Bid total', 'Status'], tableRows.length ? tableRows : ['<tr><td colspan="7" class="muted">No quotations have been submitted for this tender.</td></tr>']))}</div>`;
}

/** Open quotations a tender can be awarded to, for the V6 award panel. */
function __pr23AwardOptions(tenderId) {
  if (!tenderId) return [];
  const ev = __pr23EvaluationRows(tenderId);
  if (ev.rows.some(r => r.rawStatus === 'ACCEPTED')) return [];
  const open = ev.rows.filter(r => r.open);
  const top = ev.complete ? open.reduce((m, r) => (r.weighted != null && (m == null || r.weighted > m.weighted) ? r : m), null) : null;
  return open.map(r => ({
    name: `${r.vendor} (${r.id})`,
    value: r.recordId,
    score: r.weighted == null ? null : Number(r.weighted.toFixed(1)),
    total: r.amount,
    recommended: Boolean(top && top.recordId === r.recordId),
  }));
}

function __pr23AwardClosedHtml(tenderId) {
  const awarded = tenderId ? __pr23EvaluationRows(tenderId).rows.find(r => r.rawStatus === 'ACCEPTED') : null;
  const message = awarded
    ? `${awarded.vendor} was awarded (${awarded.id}); its purchase order has been raised.`
    : !__pr23Can('rfq.award')
      ? 'Recording the winning bidder needs the award permission (Procurement Manager).'
      : 'No open quotation is available to award.';
  return `<section class="award-panel-v6"><div class="layer-toolbar"><div><span class="eyebrow">Final award decision</span><h3 style="margin:4px 0">${awarded ? 'Awarded' : 'No award to record'}</h3><p class="muted">${__pr23Esc(message)}</p></div></div></section>`;
}

// ---------------------------------------------------------------- quotation comparison

/** Status chip for a tender in the comparison register: awarded, or how many bids are scored. */
function __pr23QuotationChip(tenderId) {
  const rows = __pr23EvaluationRows(tenderId).rows;
  if (rows.some(r => r.rawStatus === 'ACCEPTED')) return '<span class="vendor-doc-chip-v6 valid">Awarded</span>';
  const scored = rows.filter(r => r.evaluationScore != null).length;
  return `<span class="vendor-doc-chip-v6 ${rows.length && scored === rows.length ? 'valid' : 'expiring'}">${scored} of ${rows.length} scored</span>`;
}

/** The tender's real quotations side by side: totals, terms, scores and quoted line prices. */
function __pr23QuotationWorkspaceHtml(id) {
  const back = `<div class="breadcrumbs"><button data-action="back-quotation-list-v5">Quotation Comparison</button><i>›</i><span>${__pr23Esc(id)}</span></div>`;
  const t = (state.tenders || []).find(x => x.id === id);
  if (!t) return `<div class="page">${back}${pageHead('Tender-specific comparison', 'Tender not found', 'This tender is no longer in your register.', '')}</div>`;
  const rows = __pr23EvaluationRows(t.id).rows;
  const extreme = (vals, pick) => { const nums = vals.filter(v => v != null); return nums.length > 1 ? pick(...nums) : null; };
  const shade = (v, vals, higherIsBetter) => {
    if (v == null) return '';
    if (v === extreme(vals, higherIsBetter ? Math.max : Math.min)) return 'quote-best-v7';
    if (v === extreme(vals, higherIsBetter ? Math.min : Math.max)) return 'quote-worst-v7';
    return '';
  };
  const pct = v => (v == null ? '—' : `${Math.round(v)}%`);
  const totals = rows.map(r => r.amount), techs = rows.map(r => r.evaluationScore), prices = rows.map(r => r.priceScore), weights = rows.map(r => r.weighted);
  const quoteRows = rows.map(r => `<tr><td><strong>${__pr23Esc(r.vendor)}</strong><br><span class="muted">${__pr23Esc(r.id)}</span></td><td class="${shade(r.amount, totals, false)}">${money(r.amount)}</td><td>${__pr23Esc(r.deliveryTime || '—')}</td><td>${__pr23Esc(r.paymentTerms || '—')}</td><td class="${shade(r.evaluationScore, techs, true)}">${pct(r.evaluationScore)}</td><td class="${shade(r.priceScore, prices, true)}">${pct(r.priceScore)}</td><td class="${shade(r.weighted, weights, true)}"><strong>${r.weighted == null ? 'Not scored' : `${r.weighted.toFixed(1)}%`}</strong></td><td>${status(r.status)}</td></tr>`);
  const names = [...new Set(rows.flatMap(r => (r.items || []).map(i => i.itemName)))];
  const lineRows = names.map(name => {
    const amounts = rows.map(r => ((r.items || []).find(i => i.itemName === name) || {}).lineTotal ?? null);
    const quantity = (rows.flatMap(r => r.items || []).find(i => i.itemName === name) || {}).quantity;
    return `<tr><td><strong>${__pr23Esc(name)}</strong></td><td>${quantity == null ? '—' : quantity}</td>${amounts.map(a => `<td class="${shade(a, amounts, false)}">${money(a)}</td>`).join('')}</tr>`;
  });
  const actions = `<button class="btn primary" data-action="open-evaluation" data-id="${__pr23Esc(t.id)}">Open bid evaluation</button>`;
  return `<div class="page">${back}${pageHead('Tender-specific comparison', __pr23Esc(t.title), `${__pr23Esc(t.id)} · ${__pr23Esc(t.entity)} · ${rows.length} supplier response${rows.length === 1 ? '' : 's'}`, actions)}
 <div class="comparison-colour-key-v7"><span><i class="best"></i>Best result for this line or measure</span><span><i class="worst"></i>Weakest result</span><em>Scores come from Bid Evaluation; shading is advisory and the award is the authorised user's decision.</em></div>
 ${card('Quotation comparison', 'Totals include VAT as quoted; line prices below exclude it', table(['Vendor', 'Total', 'Delivery', 'Payment terms', 'Technical', 'Price', 'Weighted', 'Status'], quoteRows.length ? quoteRows : ['<tr><td colspan="8" class="muted">No quotations have been submitted for this tender.</td></tr>']))}
 <div style="height:14px"></div>
 ${card('Line-item comparison', 'Quantity × unit price as quoted by each vendor', table(['Item', 'Quantity', ...rows.map(r => __pr23Esc(r.vendor))], lineRows.length ? lineRows : [`<tr><td colspan="${2 + rows.length}" class="muted">No line items were quoted.</td></tr>`]))}</div>`;
}

// ---------------------------------------------------------------- notifications and settings

/** Notifications drawer: what actually needs attention, counted from the records. */
function __pr23NotificationsHtml() {
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const prompts = (state.approvalPromptsV6 || []).filter(a => a.status !== 'Approved' && a.status !== 'Rejected').length;
  const inspection = (state.grns || []).filter(g => g.rawStatus === 'RECEIVED').length;
  const invoices = (state.invoices || []).filter(i => i.status === 'Pending approval').length;
  const noClearance = (state.vendors || []).filter(v => !v.taxExpiry).length;
  const rows = [];
  if (prompts) rows.push(['approvals', `${plural(prompts, 'approval')} awaiting you`, 'Requisitions, awards, receipts and invoices', 'Pending']);
  if (inspection) rows.push(['receiving', `${plural(inspection, 'receipt')} awaiting inspection`, 'Goods received notes', 'Pending']);
  if (invoices) rows.push(['invoices', `${plural(invoices, 'invoice')} awaiting approval`, 'Captured supplier invoices', 'Pending']);
  if (noClearance) rows.push(['vendors', `${plural(noClearance, 'vendor')} without tax clearance`, 'No ITF263 expiry on file', 'Review']);
  if (!rows.length) return '<div class="list"><div class="list-row"><div class="list-main"><strong>No notifications</strong><span>Nothing needs your attention</span></div></div></div>';
  return `<div class="list">${rows.map(r => `<div class="list-row" data-page="${r[0]}"><div class="list-main"><strong>${__pr23Esc(r[1])}</strong><span>${__pr23Esc(r[2])}</span></div>${status(r[3])}</div>`).join('')}</div>`;
}

/**
 * Configuration & RBAC. Roles and permissions are managed centrally in Admin; this page showed
 * an invented role matrix whose toggles saved nothing. It now shows the signed-in role's real
 * procurement permissions and where to change them.
 */
function __pr23SettingsPageHtml() {
  const access = (__pr23Live() || {}).access || {};
  const grants = (access.permissions || []).map(p => String(p).replace('procurement.', ''));
  const rows = grants.map(g => `<tr><td><strong>${__pr23Esc(g)}</strong></td><td>${status('Granted')}</td></tr>`);
  const dept = access.department ? `${access.department}${access.departmentRole ? ` · ${access.departmentRole}` : ''}` : 'No department';
  return `<div class="page">${pageHead('Configuration', 'Configuration, RBAC and Access', 'Procurement roles, permissions and user assignments are managed centrally in Admin, so one change applies across every module.', '<a class="btn primary" href="/admin">Open Admin</a>')}
 <div class="notice" style="margin-bottom:14px"><div><strong>Managed in Admin → Roles</strong><p>Each procurement action has its own permission, for example procurement.orders.manage to raise purchase orders or procurement.rfq.award to award a tender. Grant or remove them on a role in Admin; the change applies the next time the module loads.</p></div></div>
 <div class="grid kpis">${kpi('Your role', __pr23Esc(access.roleName || '—'), __pr23Esc(dept), 'settings')}${kpi('Procurement permissions', grants.length, 'Granted to your role', 'approve')}</div>
 ${card('Your procurement permissions', 'What your role can do in this module', table(['Permission', 'Status'], rows.length ? rows : ['<tr><td colspan="2" class="muted">Your role holds no procurement permissions. You can still raise and track your own requisitions.</td></tr>']))}</div>`;
}

// ---------------------------------------------------------------- goods received

const __PR23_RECEIVABLE = ['SENT', 'ACKNOWLEDGED', 'APPROVED', 'PARTIALLY_RECEIVED', 'PARTIALLY_DELIVERED'];

/**
 * A compact line table for a modal. The page table() is sized for the workspace and overflows
 * the modal body, cutting off the last column; this one fits, and scrolls if it ever cannot.
 */
function __pr23LinesTable(heads, rows) {
  const th = heads.map(h => `<th style="padding:6px 8px;text-align:left;font-size:11px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap">${h}</th>`).join('');
  const body = rows.join('').replace(/<td>/g, '<td style="padding:6px 8px;vertical-align:middle">');
  return `<div style="overflow-x:auto;max-width:100%"><table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function __pr23GrnLinesHtml(poRecordId) {
  const o = (state.orders || []).find(x => x.recordId === poRecordId);
  if (!o) return '<p class="muted">Select a purchase order.</p>';
  const rows = (o.items || []).map(i => {
    const remaining = Math.max(0, Number(i.quantity || 0) - Number(i.received || 0));
    const id = __pr23Esc(i.id);
    return `<tr><td><strong>${__pr23Esc(i.itemName)}</strong></td><td>${i.quantity == null ? '—' : i.quantity}</td><td>${i.received || 0}</td><td><input type="number" min="0" step="0.01" data-grn-received="${id}" value="${remaining}" style="width:64px"></td><td><input type="number" min="0" step="0.01" data-grn-accepted="${id}" value="${remaining}" style="width:64px"></td><td><input type="number" min="0" step="0.01" data-grn-rejected="${id}" value="0" style="width:64px"></td></tr>`;
  });
  // Short headers and narrow inputs: the modal body is narrower than the page table.
  return __pr23LinesTable(['Item', 'Ordered', 'Before', 'Received', 'Accepted', 'Rejected'], rows);
}

/** Record GRN against a real purchase order, replacing the fixture modal. */
function __pr23GrnModal() {
  const open = (state.orders || []).filter(o => __PR23_RECEIVABLE.includes(String(o.rawStatus || '').toUpperCase()));
  if (!open.length) {
    openModal('Record goods received note', 'Receipts are recorded against a purchase order that has been sent to the vendor.', '<p class="muted">No purchase order is awaiting delivery.</p>', btn('Close', 'close-overlay'));
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const options = open.map(o => `<option value="${__pr23Esc(o.recordId)}">${__pr23Esc(o.id)} · ${__pr23Esc(o.vendor)}</option>`).join('');
  openModal(
    'Record goods received note',
    'Enter what arrived against the purchase order. On each line, accepted plus rejected must equal the quantity received.',
    `<form id="grnFormV23" class="form-grid"><div class="field"><label>Purchase order</label><select name="po" id="grnPoV23">${options}</select></div><div class="field"><label>Received on</label><input type="date" name="receivedDate" value="${today}" required></div><div class="field full"><label>Lines</label><div id="grnLinesV23">${__pr23GrnLinesHtml(open[0].recordId)}</div></div></form>`,
    btn('Cancel', 'close-overlay') + btn('Create GRN', 'create-grn-confirm', 'primary'),
  );
}

/** The organisation named on generated documents; the letterhead comes from its company profile. */
function __pr23OrgName() {
  return (state.letterhead && state.letterhead.company) || 'Your organisation';
}

/**
 * The browser tab's title. Each vendored layer set "Matanho Procurement & Tender Management - V13/V18/V20/V23",
 * so the tab showed an internal build label, and named Matanho on every deployment.
 */
function __pr23Title(fixture) {
  return __pr23Live() ? 'Procurement & Tender Management' : fixture;
}

/**
 * The sub-view each page opens on when another page sends the person there. Every route change remounts the
 * module (RouteTransition keys the page on its pathname), so "Manage all templates" on Reports showed the Report
 * Templates folder for a moment and then the Document Vault root. Only the destination page's own keys travel,
 * so a sidebar click still opens a page fresh.
 */
const __PR23_CARRY = {
  documents: ['documentFolder'],
  vendors: ['vendorDetail'],
  evaluation: ['evaluationTender'],
  invoices: ['matchTender'],
  quotations: ['quotationTender'],
  approvals: ['approvalTabV6'],
  analytics: ['analysisContext', 'analyticsTitle'],
};

/** Called with every navigation the host hears about; keeps what the next runtime needs for that page. */
function __pr23StashCarry(page) {
  const keys = __PR23_CARRY[page];
  if (!keys) { window.__pr23Carry = null; return; }
  const values = {};
  for (const k of keys) if (state[k] != null) values[k] = state[k];
  window.__pr23Carry = Object.keys(values).length ? { page, values: JSON.parse(JSON.stringify(values)) } : null;
}

/** Applied once, before the new runtime opens its first page. */
function __pr23ApplyCarry(page, carry) {
  if (!carry || carry.page !== page) return;
  Object.assign(state, carry.values);
}

// ---------------------------------------------------------------- approval centre

/**
 * Buttons for bridge-rendered pages. The runtime's smallAction and actionButton are declared inside its layers, out
 * of the bridge's reach: calling them from here threw "smallAction is not defined" and took the Approval Centre down.
 * Same markup as theirs.
 */
function __pr23SmallButton(label, action, id = '', ico = '') {
  return `<button class="btn small" data-action="${action}" ${id ? `data-id="${__pr23Esc(id)}"` : ''}>${ico ? icon(ico) : ''}${label}</button>`;
}
function __pr23ActionButton(label, action, id = '', kind = '', ico = '') {
  return `<button class="btn ${kind}" data-action="${action}" ${id ? `data-id="${__pr23Esc(id)}"` : ''}>${ico ? icon(ico) : ''}${label}</button>`;
}

function __pr23Waiting(iso) {
  if (!iso) return '—';
  // Calendar days in Harare (UTC+2): something from yesterday afternoon has waited 1 day, not "Today".
  const day = t => Math.floor((t + 2 * 3600000) / 86400000);
  const days = day(Date.now()) - day(new Date(iso).getTime());
  return days <= 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`;
}

/**
 * The Approval Centre in a live session. "Awaiting me" lists the decisions this person can take, with Review,
 * Approve and Reject; "All open approvals" lists every approval still open in the registers the role can read,
 * with who it waits on and for how long. The vendored page repeated the same prompts as cards and again as a
 * table, its Group queue was the same list again, and its eSignature and Delegations tabs showed sample
 * envelopes and people for features that have no backend.
 */
function __pr23ApprovalsPageHtml() {
  const mine = (state.approvalPromptsV6 || []).filter(a => a.status !== 'Approved' && a.status !== 'Rejected');
  const all = state.approvalGroupV23 || [];
  const byId = new Map(all.map(g => [g.id, g]));
  const tab = state.approvalTabV6 === 'group' ? 'group' : 'mine';
  const value = xs => xs.reduce((t, a) => t + (Number(a.amount) || 0), 0);
  const oldest = all.reduce((m, g) => (g.since && (!m || g.since < m) ? g.since : m), null);
  const cash = v => (v ? money(v) : '—');
  const tabs = `<div class="settings-tabs-v5"><button class="tab ${tab === 'mine' ? 'active' : ''}" data-action="approval-tab-v6" data-id="mine">Awaiting me <span class="nav-count" style="display:inline-grid">${mine.length}</span></button><button class="tab ${tab === 'group' ? 'active' : ''}" data-action="approval-tab-v6" data-id="group">All open approvals <span class="nav-count" style="display:inline-grid">${all.length}</span></button></div>`;
  let content;
  if (tab === 'mine') {
    // Decision cards, oldest first, with their buttons on the card: a table row's buttons fold into a menu.
    const ordered = [...mine].sort((a, b) => String((byId.get(a.id) || {}).since || '9').localeCompare(String((byId.get(b.id) || {}).since || '9')));
    const cards = ordered.map(a => {
      const g = byId.get(a.id) || {};
      return `<article class="approval-prompt-v6 ${String(a.priority || 'normal').toLowerCase()}"><div style="display:flex;justify-content:space-between;gap:8px"><span class="eyebrow">${__pr23Esc(a.type)}</span><span class="muted">${__pr23Esc(a.record)}</span></div><h4>${__pr23Esc(a.title)}</h4><p>${__pr23Esc(a.reason || '')}</p><div class="approval-facts-v6"><div><span>Department</span><strong>${__pr23Esc(a.entity)}</strong></div><div><span>Value</span><strong>${cash(a.amount)}</strong></div><div><span>Waiting</span><strong>${__pr23Waiting(g.since)}</strong></div><div><span>Decision by</span><strong>${__pr23Esc(a.role)}</strong></div></div><div class="actions">${__pr23SmallButton('Review', 'open-approval-v6', a.id, 'eye')}${__pr23SmallButton('Approve', 'approve-prompt-v6', a.id, 'approve')}${__pr23SmallButton('Reject', 'reject-prompt-v6', a.id)}</div></article>`;
    });
    content = cards.length
      ? `<div class="approval-prompt-grid-v6">${cards.join('')}</div>`
      : '<div class="notice"><div><strong>Nothing is waiting on you</strong><p>A decision appears here as soon as it is submitted to you.</p></div></div>';
  } else {
    const rows = all.map(g => `<tr><td><strong>${__pr23Esc(g.record)}</strong></td><td>${__pr23Esc(g.type)}</td><td><strong>${__pr23Esc(g.title)}</strong></td><td>${__pr23Esc(g.entity)}</td><td>${cash(g.amount)}</td><td>${g.mine ? status('Awaiting me') : __pr23Esc(g.waitingOn)}</td><td>${__pr23Waiting(g.since)}</td><td><div class="actions">${g.mine ? __pr23SmallButton('Review', 'open-approval-v6', g.id, 'eye') : __pr23SmallButton('Open register', 'nav-v6', g.page, 'arrow')}</div></td></tr>`);
    content = rows.length
      ? table(['Record', 'Type', 'Approval', 'Department', 'Value', 'Waiting on', 'Open for', ''], rows)
      : '<div class="notice"><div><strong>No approval is open</strong><p>Every submitted requisition, award, receipt, invoice and plan has been decided.</p></div></div>';
  }
  // Three cards fill the KPI row; a fourth sat alone on a second row.
  const others = all.filter(g => !g.mine).length;
  const kpis = [
    kpi('Waiting on me', String(mine.length), mine.length ? `${cash(value(mine))} in value` : 'Nothing to decide', 'approve'),
    kpi('Open approvals', String(all.length), others ? `${others} waiting on someone else` : 'Every one is yours to decide', 'audit'),
    kpi('Longest open', __pr23Waiting(oldest), oldest ? `Since ${new Date(oldest).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'No open approvals', 'account'),
  ].join('');
  return `<div class="page">${pageHead('Decision workflow', 'Approval Centre', 'Decisions waiting on you, and every approval still open across procurement.', __pr23ActionButton('Export register', 'export-approvals-v6', '', '', 'download'))}<div class="grid kpis">${kpis}</div><section class="card">${tabs}<div class="settings-pane">${content}</div></section></div>`;
}

/**
 * The runtime's entity list, for a live session. Twenty selects and labels read the module-level
 * `entities` fixture (Matanho Holdings, Kariba Agro Limited, Lumina Health Group...), which no live record
 * carries. It is replaced in place, so every one of them offers "All entities" and the organisation.
 * Called by hydrate before it renders.
 */
function __pr23SyncEntities() {
  if (!__pr23Live()) return;
  const org = __pr23OrgName();
  if (entities.length === 2 && entities[1][1] === org) return;
  entities.splice(0, entities.length, ['group', 'All entities'], ['org', org]);
  const select = document.getElementById('entitySelect');
  if (select) {
    select.innerHTML = entities.map(x => `<option value="${x[0]}">${__pr23Esc(x[1])}</option>`).join('');
    select.value = entities.some(x => x[0] === state.entity) ? state.entity : 'group';
  }
}

/** A letterhead choice named for the organisation, not "Matanho Group Procurement". */
function __pr23LetterheadOption() {
  return __pr23Live() ? __pr23Esc(`${__pr23OrgName()} letterhead`) : 'Matanho Group Procurement';
}

/** The report builders' Entity choices. */
function __pr23ReportEntityOptions(fixture) {
  return __pr23Live() ? `<option>All entities</option><option>${__pr23Esc(__pr23OrgName())}</option>` : fixture;
}

/**
 * What an invited vendor is asked for, without the fixture's vendor, bid price and terms. The runtime's
 * preview filled in "TechNova Solutions", a 1,280,000 bid, 12 weeks and 36 months against TN-2026-014.
 * Vendors submit on the vendor portal from their own link, so this preview has nothing to save.
 */
function __pr23VendorBidPreview(id) {
  const tender = id ? (state.tenders || []).find(t => t.id === id) : null;
  const reference = tender ? `${tender.id} · ${tender.title}` : (id || 'Set by the vendor\'s invitation link');
  const field = (label, html, cls) => formField(label, html, cls);
  openModal(
    'Vendor Bid Submission Form',
    'What an invited vendor sees on the vendor portal',
    `<div class="notice" style="margin-bottom:14px"><div><strong>Unique vendor link · expires at the closing date</strong><p>The vendor and the tender are fixed by the invitation link, so a vendor cannot submit for another.</p></div></div><div class="form-grid">${field('Vendor', '<input value="The invited vendor\'s registered name" readonly>')}${field('Tender', `<input value="${__pr23Esc(reference)}" readonly>`)}${field('Technical response', '<textarea placeholder="Response to the mandatory and scored criteria" disabled></textarea>', 'full')}${field('Bid currency', '<select disabled><option>USD</option><option>ZiG</option><option>ZAR</option></select>')}${field('Total bid price', '<input type="number" placeholder="Entered by the vendor" disabled>')}${field('Delivery period', '<input placeholder="Entered by the vendor" disabled>')}${field('Warranty / support', '<input placeholder="Entered by the vendor" disabled>')}${field('Declarations', '<label><input type="checkbox" disabled> The bid is accurate and all conflicts are disclosed.</label>', 'full')}</div>`,
    btn('Close', 'close-overlay'),
  );
}

// ---------------------------------------------------------------- invoice capture

const __PR23_INVOICEABLE =['SENT', 'ACKNOWLEDGED', 'APPROVED', 'PARTIALLY_RECEIVED', 'PARTIALLY_DELIVERED', 'DELIVERED'];

function __pr23InvoiceLinesHtml(poRecordId) {
  const o = (state.orders || []).find(x => x.recordId === poRecordId);
  if (!o) return '<p class="muted">Select a purchase order.</p>';
  const rows = (o.items || []).map(i => {
    const qty = Number(i.received || 0) > 0 ? Number(i.received) : Number(i.quantity || 0);
    const id = __pr23Esc(i.id);
    return `<tr><td><strong>${__pr23Esc(i.itemName)}</strong></td><td>${i.quantity == null ? '—' : i.quantity}</td><td>${i.received || 0}</td><td><input type="number" min="0" step="0.01" data-inv-qty="${id}" data-inv-name="${__pr23Esc(i.itemName)}" value="${qty}" style="width:70px"></td><td><input type="number" min="0" step="0.01" data-inv-price="${id}" value="${i.unitPrice == null ? '' : i.unitPrice}" style="width:90px"></td></tr>`;
  });
  return __pr23LinesTable(['Item', 'Ordered', 'Received', 'Quantity', 'Unit price'], rows)
    + '<p class="muted" style="margin-top:8px">VAT is applied at the active rate when the invoice is saved, and the invoice number is assigned then.</p>';
}

/** Capture a supplier invoice against a real purchase order, replacing the fixture form. */
function __pr23InvoiceCaptureModal(tenderId) {
  // A capture started from AI Invoice Capture is about the order chosen there, not whichever tender
  // happens to still be selected on the match workspace — that filter could leave no orders at all.
  if (__pr23LastExtractionPo) tenderId = '';
  const inChain = tenderId ? new Set(__pr23MatchChain(tenderId).orders.map(o => o.recordId)) : null;
  const open = (state.orders || []).filter(o => __PR23_INVOICEABLE.includes(String(o.rawStatus || '').toUpperCase()) && (!inChain || inChain.has(o.recordId)));
  if (!open.length) {
    openModal('Capture supplier invoice', 'An invoice is captured against a purchase order that has been sent to the vendor.', `<p class="muted">No purchase order is open for invoicing${tenderId ? ' on this tender' : ''}.</p>`, btn('Close', 'close-overlay'));
    return;
  }
  const iso = d => d.toISOString().slice(0, 10);
  const options = open.map(o => `<option value="${__pr23Esc(o.recordId)}">${__pr23Esc(o.id)} · ${__pr23Esc(o.vendor)}</option>`).join('');
  openModal(
    'Capture supplier invoice',
    'Capture the supplier invoice against its purchase order. It goes to Finance for approval once saved.',
    `<form id="invoiceCaptureV23" class="form-grid"><div class="field"><label>Purchase order</label><select name="po" id="invoicePoV23">${options}</select></div><div class="field"><label>Invoice date</label><input type="date" name="invoiceDate" value="${iso(new Date())}" required></div><div class="field"><label>Due date</label><input type="date" name="dueDate" value="${iso(new Date(Date.now() + 30 * 86400000))}"></div><div class="field full"><label>Invoice lines</label><div id="invoiceLinesV23">${__pr23InvoiceLinesHtml(open[0].recordId)}</div></div></form>`,
    btn('Cancel', 'close-overlay') + btn('Capture invoice', 'confirm-capture-invoice-v5', 'primary'),
  );
  __pr23PrefillCaptureFromExtraction();
}

// ---------------------------------------------------------------- AI invoice capture (LLM extraction)

/**
 * Suite 06 reads the supplier's PDF (pdf-parse -> LLM -> strict JSON) and the fields land here for
 * checking. Nothing is saved by reading: the invoice is still written by the capture form, so
 * three-way matching, approval and payment are unchanged. The fixture queue this replaces listed
 * files nobody had uploaded and announced captures that never happened.
 */
let __pr23LastExtraction = null;
/** The order the operator chose on AI Invoice Capture, carried into the capture form. */
let __pr23LastExtractionPo = null;

/** Purchase orders an invoice can be captured against — the same rule as the capture form. */
function __pr23AiCaptureOrders() {
  return (state.orders || []).filter(o => __PR23_INVOICEABLE.includes(String(o.rawStatus || '').toUpperCase()));
}

/**
 * Extracted amounts to the cent, in the invoice's own currency. The runtime's money() rounds to
 * whole dollars, which showed a $6.50 unit price as "$7" — wrong on the one screen whose entire
 * purpose is checking the figures against the PDF.
 */
function __pr23Money2(n, currencyCode) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const code = /^[A-Za-z]{3}$/.test(String(currencyCode || '')) ? String(currencyCode).toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  } catch (e) {
    return `${code} ${v.toFixed(2)}`;
  }
}

/** The invoice match panel's line for what the LLM read from the supplier's document. */
function __pr23ReadingLabel(inv) {
  const r = inv && inv.reading;
  if (!r) return inv && inv.id && inv.id !== '—' ? 'No supplier document' : '—';
  if (r.status === 'PENDING') return 'Being read';
  if (r.status !== 'READ') return 'Could not be read';
  if (r.agrees) return r.fromOcr ? 'Agrees with the capture (scan)' : 'Agrees with the capture';
  const n = (r.differences || []).length;
  return `${n} difference${n === 1 ? '' : 's'} from the capture`;
}

function __pr23TaxTreatmentLabel(t, rate) {
  // Zimbabwe's standard rate is 15.5%; the reader reports the rate printed rather than assuming 15%.
  if (t === 'VAT_15') return rate != null ? `VAT ${rate}%` : 'VAT at the standard rate';
  if (t === 'ZERO_RATED') return 'Zero rated';
  if (t === 'EXEMPT') return 'Exempt';
  return 'Not determined';
}

/** What the model read, field by field, with its own confidence beside each one. */
function __pr23ExtractionHtml(result) {
  const p = (result && result.payload) || {};
  const lines = Array.isArray(p.lines) ? p.lines : [];
  const pct = Math.round(Number(p.overallConfidence || 0) * 100);
  const threshold = Math.round(Number(result && result.threshold || 0) * 100);
  const fc = p.fieldConfidence || {};
  const field = (label, value, key) => {
    const c = fc[key] == null ? null : Math.round(Number(fc[key]) * 100);
    const shown = (value == null || value === '') ? 'Not found' : value;
    return `<div class="list-row"><div class="list-main"><strong>${__pr23Esc(shown)}</strong><span>${__pr23Esc(label)}${c == null ? '' : ` · ${c}% confidence`}</span></div>${c == null ? '' : status(c >= threshold ? 'Ready' : 'Review')}</div>`;
  };
  const rows = lines.map(l => `<tr><td>${__pr23Esc(l.description)}</td><td>${Number(l.quantity) || 0}</td><td>${__pr23Money2(l.unitPrice, p.currencyCode)}</td><td>${__pr23Money2(l.lineTotal, p.currencyCode)}</td></tr>`);
  const total = lines.reduce((t, l) => t + (Number(l.lineTotal) || 0), 0);
  const banner = (result && result.lowConfidence)
    ? `<div class="notice"><div><strong>Below the confidence threshold</strong><p>Read at ${pct}%, under the ${threshold}% mark. Check every field against the PDF before saving.</p></div></div>`
    : `<div class="notice"><div><strong>Read at ${pct}% confidence</strong><p>These are the figures the model read, not a checked invoice. Compare them with the PDF before saving.</p></div></div>`;
  const filed = (result && result.intake && result.intake.intakeNumber)
    ? `Filed as ${__pr23Esc(result.intake.intakeNumber)} in the intake register.`
    : 'Not filed: without a purchase order the vendor is unknown, so this reading is not kept.';
  // The figures printed on the invoice beside what its lines add up to, and any figure that does not add up.
  const printed = (label, v) => `<div class="list-row"><div class="list-main"><strong>${v == null ? 'Not found' : __pr23Esc(__pr23Money2(v, p.currencyCode))}</strong><span>${__pr23Esc(label)}</span></div></div>`;
  const checks = Array.isArray(p.checks) ? p.checks : [];
  const checksHtml = checks.length
    ? `<div class="notice" style="margin-top:12px"><div><strong>Figures to check</strong><p>${checks.map(c => __pr23Esc(c.message)).join('<br>')}</p></div></div>`
    : '';
  const ocrNote = p.readFromOcr
    ? '<div class="notice" style="margin-top:12px"><div><strong>Read from a scan or photo</strong><p>The text was recovered with OCR before the model read it. Check every figure against the document with extra care.</p></div></div>'
    : '';
  return `${banner}${ocrNote}<div class="list" style="margin-top:12px">${field('Supplier', p.supplierName, 'supplierName')}${field('Supplier tax number', p.supplierTaxNumber, 'supplierTaxNumber')}${field('Invoice number', p.invoiceNumber, 'invoiceNumber')}${field('Invoice date', p.invoiceDate, 'invoiceDate')}${field('Due date', p.dueDate, 'dueDate')}${field('Purchase order quoted', p.purchaseOrderReference, 'purchaseOrderReference')}${field('Currency', p.currencyCode, 'currencyCode')}${field('Tax treatment', __pr23TaxTreatmentLabel(p.taxTreatment, p.taxRate), 'taxTreatment')}</div>
    ${lines.length ? table(['Description', 'Quantity', 'Unit price', 'Line total'], rows) : '<p class="muted" style="margin-top:12px">No invoice lines could be read.</p>'}
    <div class="list" style="margin-top:12px">${printed('Subtotal printed on the invoice', p.subtotal)}${printed(`VAT printed on the invoice${p.taxRate != null ? ` (${p.taxRate}%)` : ''}`, p.taxAmount)}${printed('Total printed on the invoice', p.totalAmount)}</div>${checksHtml}
    <p class="muted" style="margin-top:8px">${lines.length ? `Lines total ${__pr23Money2(total, p.currencyCode)} before tax. ` : ''}${filed}</p>
    <div style="margin-top:12px">${btn('Capture this invoice', 'capture-invoice-v5', 'primary', 'invoice')}</div>`;
}

/** The page: upload on the left of the flow, what was read below it, then the capture form. */
function __pr23AiCapturePage() {
  if (!__pr23Live()) {
    return `<div class="page">${pageHead('Accounts payable', 'AI Invoice Capture', 'Reads a supplier invoice PDF and fills in the capture form.', '')}${card('Live procurement only', 'This page reads real invoices', '<div class="card-body"><p class="muted">Invoice reading runs against the procurement service and is not part of the offline preview.</p></div>')}</div>`;
  }
  const orders = __pr23AiCaptureOrders();
  const options = ['<option value="">No purchase order yet</option>']
    .concat(orders.map(o => `<option value="${__pr23Esc(o.recordId)}">${__pr23Esc(o.id)} · ${__pr23Esc(o.vendor)}</option>`))
    .join('');
  const upload = `<div class="card-body"><form id="aiInvoiceCaptureV23" class="form-grid">
      <div class="field full"><label>Supplier invoice (PDF, scan or photo)</label><input type="file" name="document" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,image/tiff,.png,.jpg,.jpeg,.webp,.tif,.tiff" required></div>
      <div class="field full"><label>Purchase order</label><select id="aiInvoicePoV23">${options}</select></div>
    </form>
    <p class="muted" style="margin-top:8px">A PDF with selectable text is read directly; a scan or a photo is read with OCR first, which takes a little longer and needs extra checking. Naming the purchase order identifies the vendor, keeps the reading on record, and teaches the model that vendor's layout.</p>
    <div style="margin-top:12px">${btn('Read the invoice', 'confirm-extract-invoice-v23', 'primary', 'invoice')}</div></div>`;
  const result = `<div class="card-body" id="aiInvoiceResultV23"><p class="muted">Nothing read yet. Upload the invoice above and its supplier, invoice number, dates, lines and totals appear here for checking.</p></div>`;
  return `<div class="page">${pageHead(
    'Accounts payable',
    'AI Invoice Capture',
    'Reads the supplier’s invoice — a PDF, a scan or a photo — and hands the fields to the capture form. Every figure stays yours to check before anything is saved.',
    btn('Capture by hand', 'capture-invoice-v5', '', 'invoice'),
  )}
    ${card('Upload the invoice', 'One invoice at a time', upload)}
    ${card('What was read', 'Check each field against the PDF before saving', result)}</div>`;
}

/** Carry the reading into the capture form: the invoice date, and unit prices where the lines line up. */
function __pr23PrefillCaptureFromExtraction() {
  const p = __pr23LastExtraction && __pr23LastExtraction.payload;
  if (!p) return;
  const form = document.querySelector('#invoiceCaptureV23');
  if (!form) return;
  // The order first: choosing it rebuilds the line rows, so anything filled in before this would be
  // thrown away.
  if (__pr23LastExtractionPo) {
    const po = form.querySelector('#invoicePoV23');
    if (po && [...po.options].some(o => o.value === __pr23LastExtractionPo)) {
      po.value = __pr23LastExtractionPo;
      const box = form.querySelector('#invoiceLinesV23');
      if (box) box.innerHTML = __pr23InvoiceLinesHtml(__pr23LastExtractionPo);
    }
  }
  if (p.invoiceDate && /^\d{4}-\d{2}-\d{2}/.test(String(p.invoiceDate))) {
    const date = form.querySelector('[name="invoiceDate"]');
    if (date) date.value = String(p.invoiceDate).slice(0, 10);
  }
  const lines = Array.isArray(p.lines) ? p.lines : [];
  const prices = [...form.querySelectorAll('[data-inv-price]')];
  // Only when every line matches one on the order: a partial fill would put a price on the wrong item.
  if (lines.length && prices.length === lines.length) {
    prices.forEach((input, i) => {
      const unit = Number(lines[i].unitPrice);
      if (Number.isFinite(unit) && unit > 0) input.value = String(unit);
    });
  }
  const note = lines.length === prices.length && lines.length
    ? `Invoice date and unit prices were filled in from ${__pr23Esc(p.invoiceNumber || 'the PDF')}. Check them against the invoice.`
    : `The invoice date was filled in from ${__pr23Esc(p.invoiceNumber || 'the PDF')}. Its ${lines.length} read line${lines.length === 1 ? '' : 's'} did not match the ${prices.length} line${prices.length === 1 ? '' : 's'} on this order, so the prices were left alone.`;
  form.insertAdjacentHTML('afterbegin', `<div class="notice full" style="margin-bottom:12px"><div><strong>Prefilled from the read invoice</strong><p>${note}</p></div></div>`);
}

if (typeof window !== 'undefined') {
  /** Called by the host once the API returns; the runtime owns this DOM, so the filling in happens here. */
  window.__pr23ApplyExtraction = function (result) {
    __pr23LastExtraction = result || null;
    const po = document.querySelector('#aiInvoicePoV23');
    __pr23LastExtractionPo = po && po.value ? po.value : null;
    const box = document.querySelector('#aiInvoiceResultV23');
    if (box) box.innerHTML = __pr23ExtractionHtml(result || {});
  };
  /**
   * The document and reading a capture for this order should carry: the last reading, when it was made for this order
   * or before any order was chosen. Its intake is reused only when it was filed for this order's vendor.
   */
  window.__pr23ReadingFor = function (poRecordId) {
    const r = __pr23LastExtraction;
    if (!r || !r.documentUrl) return null;
    if (__pr23LastExtractionPo && poRecordId && __pr23LastExtractionPo !== poRecordId) return null;
    return {
      documentUrl: r.documentUrl,
      documentType: /\.pdf(\?|#|$)/i.test(String(r.documentUrl)) ? 'PDF' : 'IMAGE',
      intakeId: r.intake && r.intake.id && __pr23LastExtractionPo === poRecordId ? r.intake.id : null,
    };
  };
  window.__pr23ClearReading = function () {
    __pr23LastExtraction = null;
    __pr23LastExtractionPo = null;
  };
}

// ---------------------------------------------------------------- direct purchase order

/** Approved requisitions, which a purchase order may be raised from directly (without an RFQ). */
function __pr23PoSources() {
  return (state.requisitions || []).filter(r => String(r.rawStatus || '').toUpperCase() === 'APPROVED');
}

function __pr23PoLinesHtml(reqRecordId) {
  const r = (state.requisitions || []).find(x => x.recordId === reqRecordId);
  if (!r) return '<p class="muted">Select the approved requisition.</p>';
  const lines = r.items && r.items.length ? r.items : [{ itemName: r.title, quantity: 1, unit: 'Each', unitPrice: null }];
  const rows = lines.map((i, idx) => `<tr data-po-line="${idx}"><td><input data-po-name value="${__pr23Esc(i.itemName)}" required style="min-width:170px"></td><td><input data-po-unit value="${__pr23Esc(i.unit || 'Each')}" style="width:70px"></td><td><input type="number" min="0.01" step="0.01" data-po-qty value="${i.quantity == null ? 1 : i.quantity}" required style="width:70px"></td><td><input type="number" min="0.01" step="0.01" data-po-price value="${i.unitPrice ? i.unitPrice : ''}" required style="width:100px"></td></tr>`);
  return __pr23LinesTable(['Item', 'Unit', 'Quantity', 'Unit price'], rows)
    + '<p class="muted" style="margin-top:8px">Unit prices start from the requester\'s estimate where one was given. VAT is added at the active rate and the PO number is assigned when the order is saved.</p>';
}

/** Raise a purchase order from an approved requisition, replacing the fixture form. */
function __pr23PoModal(existingId) {
  if (existingId) {
    openModal(`Purchase order ${existingId}`, 'A saved purchase order is not edited in place.', '<p class="muted">Send or preview it from the register. A change to an order already sent is agreed with the vendor and raised as a new order.</p>', btn('Close', 'close-overlay'));
    return;
  }
  const sources = __pr23PoSources();
  const vendors = (state.vendors || []).filter(v => !v.isBlacklisted);
  const reason = !sources.length
    ? 'No approved requisition is waiting to be ordered. A requisition is approved by its department head first.'
    : !vendors.length ? 'No vendor is registered yet. Register the vendor in Vendor Registry first.' : '';
  if (reason) {
    openModal('Create purchase order', 'A purchase order is raised from an approved requisition.', `<p class="muted">${__pr23Esc(reason)}</p>`, btn('Close', 'close-overlay'));
    return;
  }
  const sourceOptions = sources.map(r => `<option value="${__pr23Esc(r.recordId)}">${__pr23Esc(r.id)} · ${__pr23Esc(r.title)} · ${__pr23Esc(r.department || '')}</option>`).join('');
  // A PO is sent by email, so a vendor without one is flagged before anyone tries to send to it.
  const vendorOptions = vendors.map(v => `<option value="${__pr23Esc(v.recordId)}">${__pr23Esc(v.name)}${v.status && v.status !== 'Prequalified' ? ' · ' + __pr23Esc(v.status) : ''}${String(v.email || '').includes('@') ? '' : ' · no email'}</option>`).join('');
  openModal(
    'Create purchase order',
    'Raise an order directly from an approved requisition, without an RFQ. Save it as a draft, or save and send it to the vendor.',
    `<form id="poFormV23" class="form-grid"><div class="field full"><label>Approved requisition</label><select name="requisition" id="poSourceV23" required>${sourceOptions}</select></div><div class="field"><label>Vendor</label><select name="vendor" required>${vendorOptions}</select></div><div class="field"><label>Expected delivery</label><input type="date" name="delivery" value="${__pr23DateOffset(14)}"></div><div class="field"><label>Payment terms</label><input name="paymentTerms" value="Net 30"></div><div class="field"><label>Delivery address</label><input name="shippingAddress"></div><div class="field full"><label>Order lines</label><div id="poLinesV23">${__pr23PoLinesHtml(sources[0].recordId)}</div></div></form>`,
    btn('Cancel', 'close-overlay') + btn('Save draft', 'save-po-v6') + btn('Save and send to vendor', 'submit-po-v6', 'primary'),
  );
}

// ---------------------------------------------------------------- invoice payment

/** Invoices Finance has approved that are not yet paid (the loader decides; see live-loaders). */
function __pr23Payable() {
  return (state.invoices || []).filter(i => i.payable);
}

/** Record the payment of an approved invoice, with its proof of payment. */
function __pr23PaymentModal(preselectId) {
  if (!__pr23Can('invoices.pay')) {
    openModal('Record payment', 'Paying an invoice is an accounts payable step.', '<p class="muted">Your role cannot record payments. Accounts payable records them once Finance has approved the invoice.</p>', btn('Close', 'close-overlay'));
    return;
  }
  const payable = __pr23Payable();
  if (!payable.length) {
    openModal('Record payment', 'Only an invoice Finance has approved can be paid.', '<p class="muted">No approved invoice is awaiting payment.</p>', btn('Close', 'close-overlay'));
    return;
  }
  const banks = (__pr23Live() || {}).banks || [];
  const chosen = payable.find(i => i.recordId === preselectId || i.id === preselectId) || payable[0];
  const amountOf = i => Number(i.outstanding == null ? i.amount || 0 : i.outstanding).toFixed(2);
  const invoiceOptions = payable.map(i => `<option value="${__pr23Esc(i.recordId)}" data-amount="${amountOf(i)}" ${i === chosen ? 'selected' : ''}>${__pr23Esc(i.id)} · ${__pr23Esc(i.vendor)} · ${__pr23Esc(i.currency || '')} ${amountOf(i)}</option>`).join('');
  const bankOptions = banks.map(b => `<option value="${__pr23Esc(b.id)}">${__pr23Esc(b.name)}${b.accountNumber ? ' · ' + __pr23Esc(b.accountNumber) : ''}</option>`).join('');
  const today = new Date().toISOString().slice(0, 10);
  const noBank = banks.length
    ? ''
    : '<div class="field full"><div class="notice"><div><strong>No bank or cash account is set up</strong><p>Accounting adds one under Cashbook before a payment can be recorded.</p></div></div></div>';
  openModal(
    'Record payment',
    'Record the full payment of an approved invoice, with its proof of payment. The accounting entries are posted when it is saved.',
    `<form id="paymentFormV23" class="form-grid"><div class="field full"><label>Invoice</label><select name="invoice" id="paymentInvoiceV23" required>${invoiceOptions}</select></div><div class="field"><label>Amount</label><input name="amount" id="paymentAmountV23" value="${amountOf(chosen)}" readonly></div><div class="field"><label>Payment date</label><input type="date" name="paymentDate" value="${today}" max="${today}" required></div><div class="field"><label>Method</label><select name="method"><option value="BANK">Bank transfer</option><option value="CASH">Cash</option></select></div><div class="field"><label>Paid from</label><select name="bank" ${banks.length ? 'required' : ''}>${bankOptions || '<option value="">No account available</option>'}</select></div><div class="field"><label>Payment reference</label><input name="reference" placeholder="Bank transaction reference"></div><div class="field"><label>Proof of payment</label><input type="file" name="proof" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" required></div><div class="field full"><label>Notes</label><textarea name="notes"></textarea></div>${noBank}</form>`,
    btn('Cancel', 'close-overlay') + btn('Record payment', 'confirm-record-payment-v23', 'primary'),
  );
}

// ---------------------------------------------------------------- annual procurement plans

const __PR23_PLAN_CATEGORIES = ['Technology', 'Office supplies', 'Furniture', 'Facilities', 'Fleet', 'Medical', 'Agriculture', 'Professional services'];
const __PR23_PLAN_METHODS = ['Open tender', 'Restricted tender', 'RFQ', 'Framework', 'Direct procurement'];
const __pr23Options = (list, selected) => list.map(x => `<option ${x === selected ? 'selected' : ''}>${__pr23Esc(x)}</option>`).join('');
const __pr23PlanEditable = p => ['DRAFT', 'REJECTED'].includes(String((p && p.rawStatus) || '').toUpperCase());

function __pr23PlanLineRows(count) {
  return Array.from({ length: count }, () => `<tr data-plan-line><td><input data-plan-desc placeholder="Requirement" style="min-width:180px"></td><td><select data-plan-cat>${__pr23Options(__PR23_PLAN_CATEGORIES)}</select></td><td><select data-plan-q>${__pr23Options(['Q1', 'Q2', 'Q3', 'Q4'])}</select></td><td><select data-plan-method>${__pr23Options(__PR23_PLAN_METHODS)}</select></td><td><input type="number" min="0" step="0.01" data-plan-value placeholder="0" style="width:110px"></td></tr>`).join('');
}

/** Create or edit an annual procurement plan, replacing the fixture plan form. */
function __pr23PlanModal(planId) {
  const plan = planId ? (state.plans || []).find(x => x.id === planId || x.recordId === planId) : null;
  if (plan && !__pr23PlanEditable(plan)) {
    openModal(plan.id, `${plan.name} · ${plan.status}`, `<p class="muted">A plan that is ${__pr23Esc(String(plan.status).toLowerCase())} is not edited. A rejected plan reopens for changes and is resubmitted as a new version.</p>`, btn('Close', 'close-overlay'));
    return;
  }
  const live = __pr23Live() || {};
  const year = new Date().getFullYear();
  const years = [`FY ${year}`, `FY ${year + 1}`];
  const lines = plan ? '' : `<div class="field full"><label>Plan lines (optional; add more later with Add plan item)</label>${__pr23LinesTable(['Requirement', 'Category', 'Quarter', 'Method', 'Estimated value'], [__pr23PlanLineRows(4)])}</div>`;
  openModal(
    plan ? `Edit ${plan.id}` : 'Create annual procurement plan',
    plan ? 'Change the plan header. Lines are added with Add plan item.' : 'Create the plan with its budget and first requirements. It stays a draft until you submit it for budget approval.',
    `<form id="planFormV23" class="form-grid"><input type="hidden" name="recordId" value="${__pr23Esc(plan ? plan.recordId : '')}"><div class="field full"><label>Plan name</label><input name="name" required value="${__pr23Esc(plan ? plan.name : '')}"></div><div class="field"><label>Department</label><input name="department" value="${__pr23Esc(plan ? plan.department || '' : (live.access && live.access.department) || '')}" placeholder="All departments"></div><div class="field"><label>Financial year</label><select name="fiscalYear">${__pr23Options(plan && plan.fiscalYear && !years.includes(plan.fiscalYear) ? [plan.fiscalYear, ...years] : years, plan ? plan.fiscalYear : years[0])}</select></div><div class="field"><label>Budget ceiling</label><input type="number" name="budget" min="1" step="0.01" required value="${plan ? plan.budget : ''}"></div><div class="field"><label>Currency</label><select name="currency">${__pr23Options(['USD', 'ZiG', 'ZAR'])}</select></div><div class="field full"><label>Planning assumptions</label><textarea name="notes">${__pr23Esc(plan ? plan.notes || '' : '')}</textarea></div>${lines}</form>`,
    btn('Cancel', 'close-overlay') + btn('Save draft', 'save-plan-v5') + btn(plan ? 'Save changes' : 'Create plan', 'create-plan-confirm-v5', 'primary'),
  );
}

/** Add a line to a draft or rejected plan. */
function __pr23PlanItemModal() {
  const plans = (state.plans || []).filter(__pr23PlanEditable);
  if (!plans.length) {
    openModal('Add procurement plan item', 'Lines are added to a draft plan, or to a rejected plan being corrected.', '<p class="muted">No plan is open for changes. Create a plan first.</p>', btn('Close', 'close-overlay'));
    return;
  }
  const current = state.planDetail && plans.find(p => p.id === state.planDetail);
  const planOptions = plans.map(p => `<option value="${__pr23Esc(p.recordId)}" ${current && current.recordId === p.recordId ? 'selected' : ''}>${__pr23Esc(p.id)} · ${__pr23Esc(p.name)}</option>`).join('');
  openModal(
    'Add procurement plan item',
    'The estimated value counts against the plan budget when the plan is submitted.',
    `<form id="planItemFormV23" class="form-grid"><div class="field full"><label>Plan</label><select name="plan" required>${planOptions}</select></div><div class="field full"><label>Requirement</label><input name="description" required></div><div class="field"><label>Category</label><select name="category">${__pr23Options(__PR23_PLAN_CATEGORIES)}</select></div><div class="field"><label>Quarter</label><select name="quarter">${__pr23Options(['Q1', 'Q2', 'Q3', 'Q4'])}</select></div><div class="field"><label>Sourcing method</label><select name="method">${__pr23Options(__PR23_PLAN_METHODS)}</select></div><div class="field"><label>Estimated value</label><input type="number" name="estimatedValue" min="0" step="0.01" required></div><div class="field"><label>Department</label><input name="department" placeholder="The plan's department"></div></form>`,
    btn('Cancel', 'close-overlay') + btn('Save item', 'save-plan-item', 'primary'),
  );
}

/** The plan workspace's progress strip, from the plan's real status. */
function __pr23PlanStrip(p) {
  const s = String(p.rawStatus || '').toUpperCase();
  const lines = (state.planItems || []).filter(i => i.planRecordId === p.recordId).length;
  const step = (label, detail, cls) => `<div class="workflow-step ${cls}"><strong>${label}</strong><span>${__pr23Esc(detail)}</span></div>`;
  const decided = s === 'APPROVED' || s === 'REJECTED';
  return `<div class="workflow-strip">${step('1. Draft', `${lines} line${lines === 1 ? '' : 's'} planned`, s === 'DRAFT' ? 'current' : 'done')}${step('2. Budget approval', s === 'DRAFT' ? 'Not yet submitted' : s === 'SUBMITTED' ? 'Awaiting a budget approver' : 'Decided', s === 'SUBMITTED' ? 'current' : decided ? 'done' : '')}${step(s === 'REJECTED' ? '3. Returned' : '3. Approved baseline', s === 'REJECTED' ? p.rejectionReason || 'Returned for changes' : s === 'APPROVED' ? 'Plan approved' : 'Pending', decided ? 'current' : '')}</div>`;
}

// ---------------------------------------------------------------- contracts

/** Create a contract from an award (or standalone), edit a draft, or view an issued contract. */
function __pr23ContractModal(id) {
  const c = id ? (state.contractsV6 || []).find(x => x.id === id || x.recordId === id) : null;
  const money2 = n => Number(n || 0).toFixed(2);
  if (c && c.kind === 'contract' && String(c.rawStatus).toUpperCase() !== 'DRAFT') {
    const terminate = String(c.rawStatus).toUpperCase() === 'ACTIVE' && __pr23Can('contracts.manage')
      ? `<button class="btn" data-action="terminate-contract-v23" data-id="${__pr23Esc(c.recordId)}">Terminate</button>` : '';
    openModal(c.id, `${c.title} · ${c.status}`, `<div class="form-grid"><div class="field"><label>Vendor</label><input value="${__pr23Esc(c.vendor)}" readonly></div><div class="field"><label>Value</label><input value="${__pr23Esc(c.currency || '')} ${money2(c.value)}" readonly></div><div class="field"><label>Start</label><input value="${__pr23Esc(c.start)}" readonly></div><div class="field"><label>End</label><input value="${__pr23Esc(c.end)}" readonly></div><div class="field full"><label>Payment terms</label><textarea readonly>${__pr23Esc(c.paymentTerms || '')}</textarea></div><div class="field full"><label>Scope</label><textarea readonly>${__pr23Esc(c.scope || '')}</textarea></div></div>`, btn('Close', 'close-overlay') + terminate);
    return;
  }
  if (!__pr23Can('contracts.manage')) {
    openModal('Contracts', 'Creating a contract is a procurement desk step.', '<p class="muted">Your role can view contracts but not create or change them.</p>', btn('Close', 'close-overlay'));
    return;
  }
  const draft = c && c.kind === 'contract' ? c : null;
  const awards = (state.contractsV6 || []).filter(x => x.kind === 'award');
  const chosenAward = c && c.kind === 'award' ? c : draft && draft.quotationId ? awards.find(a => a.quotationId === draft.quotationId) : null;
  const awardOptions = awards.map(a => `<option value="${__pr23Esc(a.quotationId)}" data-value="${money2(a.value)}" data-vendor="${__pr23Esc(a.vendorId || '')}" data-title="${__pr23Esc(a.title)}" ${chosenAward && chosenAward.quotationId === a.quotationId ? 'selected' : ''}>${__pr23Esc(a.tender)} · ${__pr23Esc(a.vendor)} · ${money2(a.value)}</option>`).join('');
  const vendors = (state.vendors || []).filter(v => !v.isBlacklisted);
  const vendorOptions = vendors.map(v => `<option value="${__pr23Esc(v.recordId)}" ${draft && draft.vendorId === v.recordId ? 'selected' : ''}>${__pr23Esc(v.name)}</option>`).join('');
  const start = draft && draft.start !== '—' ? draft.start : __pr23DateOffset(7);
  const end = draft && draft.end !== '—' ? draft.end : __pr23DateOffset(372);
  const source = chosenAward || (!draft && awards[0]) || null;
  const activate = draft ? `<button class="btn" data-action="activate-contract-v23" data-id="${__pr23Esc(draft.recordId)}">Activate</button>` : '';
  openModal(
    draft ? `Edit ${draft.id}` : 'Create purchase contract',
    'A contract follows an award, or stands alone for a direct engagement. It is saved as a draft and becomes active when activated.',
    `<form id="contractFormV23" class="form-grid"><input type="hidden" name="recordId" value="${__pr23Esc(draft ? draft.recordId : '')}"><div class="field full"><label>Award</label><select name="quotation" id="contractSourceV23" ${draft ? 'disabled' : ''}>${awardOptions}<option value="" ${!source ? 'selected' : ''}>No award (standalone contract)</option></select></div><div class="field full"><label>Vendor (standalone only)</label><select name="vendor" ${draft ? 'disabled' : ''}>${vendorOptions}</select></div><div class="field full"><label>Contract title</label><input name="title" required value="${__pr23Esc(draft ? draft.title : source ? `Supply agreement · ${source.title}` : '')}"></div><div class="field"><label>Contract value</label><input type="number" name="value" min="0" step="0.01" required value="${draft ? money2(draft.value) : source ? money2(source.value) : ''}"></div><div class="field"><label>Currency</label><select name="currency">${__pr23Options(['USD', 'ZiG', 'ZAR'], draft ? draft.currency : 'USD')}</select></div><div class="field"><label>Start date</label><input type="date" name="start" value="${__pr23Esc(start)}" required></div><div class="field"><label>End date</label><input type="date" name="end" value="${__pr23Esc(end)}" required></div><div class="field full"><label>Payment terms</label><textarea name="paymentTerms">${__pr23Esc(draft ? draft.paymentTerms || '' : 'Payment within thirty (30) days of an approved invoice matched to the purchase order and goods received note.')}</textarea></div><div class="field full"><label>Scope and deliverables</label><textarea name="scope">${__pr23Esc(draft ? draft.scope || '' : '')}</textarea></div></form>`,
    btn('Cancel', 'close-overlay') + activate + btn(draft ? 'Save changes' : 'Save draft', 'save-contract-v6', 'primary'),
  );
}

// ---------------------------------------------------------------- exports

/**
 * The live records an export titled `title` should contain. The vendored exportFile wrote the
 * tenders table into every CSV and Excel file whatever its name ("AP Bank Upload Batch", "Audit
 * Trail", a report template) and a title-only PDF, so each export now picks its register by name.
 */
function __pr23ExportRows(title) {
  const t = String(title || '');
  const live = __pr23Live() || {};
  const n = v => (v == null || v === '—' ? '' : v);
  const pick = (re) => re.test(t);
  if (pick(/bank|payable|payment/i)) {
    // A bank upload batch is what is still to be paid; an accounts payable listing is every approved invoice.
    const onlyUnpaid = pick(/bank/i);
    return [['Invoice', 'Vendor', 'Purchase order', 'Amount', 'Currency', 'Due', 'Status', 'Payment'],
      ...(state.invoices || []).filter(i => String(i.rawStatus || '').toUpperCase() === 'APPROVED' && (!onlyUnpaid || i.payable)).map(i => [i.id, i.vendor, n(i.po), i.amount, n(i.currency), n(i.due), i.status, n(i.paymentStatus)])];
  }
  if (pick(/audit/i)) return [['Event', 'Action', 'Record', 'Actor', 'Time', 'Class'], ...(state.auditEventsLive || []).map(e => (Array.isArray(e) ? e : [e.id, e.event, e.record, e.actor, e.time, e.class]))];
  if (pick(/evaluation|bid|quotation|comparison/i)) return [['Quotation', 'RFQ', 'Vendor', 'Amount', 'Currency', 'Status', 'Technical score', 'Submitted'], ...(state.quotationsLive || []).map(q => [q.id, n(q.rfq), q.vendor, q.amount, n(q.currency), q.status, n(q.evaluationScore), n(q.submitted)])];
  if (pick(/approval/i)) return [['Approval', 'Type', 'Record', 'Title', 'Amount', 'Role', 'Status'], ...(state.approvalPromptsV6 || []).map(a => [a.id, a.type, a.record, a.title, n(a.amount), a.role, a.status])];
  if (pick(/vendor|supplier/i)) return [['Vendor', 'Category', 'BP number', 'VAT number', 'Status', 'Tax clearance', 'Email', 'Spend'], ...(state.vendors || []).map(v => [v.name, v.category, v.bp, v.vat, v.status, v.itf, n(v.email), v.spend])];
  if (pick(/contract/i)) return [['Contract', 'Title', 'Vendor', 'Value', 'Start', 'End', 'Status'], ...(state.contractsV6 || []).map(c => [c.id, c.title, c.vendor, c.value, n(c.start), n(c.end), c.status])];
  if (pick(/plan|budget/i)) return [['Line', 'Plan', 'Requirement', 'Department', 'Category', 'Quarter', 'Method', 'Estimated value', 'Status'], ...(state.planItems || []).map(i => [i.id, i.plan, i.description, i.entity, i.category, i.quarter, i.method, i.budget, i.status])];
  if (pick(/invoice/i)) return [['Invoice', 'Vendor', 'Purchase order', 'Amount', 'Match', 'Status', 'Due'], ...(state.invoices || []).map(i => [i.id, i.vendor, n(i.po), i.amount, i.match, i.status, n(i.due)])];
  if (pick(/\border|\bPO\b/i)) return [['Purchase order', 'Vendor', 'Department', 'Amount', 'Currency', 'Status', 'Delivery'], ...(state.orders || []).map(o => [o.id, o.vendor, o.entity, o.amount, n(o.currency), o.status, n(o.delivery)])];
  if (pick(/requisition|demand/i)) return [['Requisition', 'Title', 'Department', 'Estimate', 'Status', 'Requested by'], ...(state.requisitions || []).map(r => [r.id, r.title, r.entity, n(r.amount), r.status, r.owner])];
  if (pick(/grn|receipt|receiv/i)) return [['GRN', 'Purchase order', 'Item', 'Value accepted', 'Status', 'Received'], ...(state.grns || []).map(g => [g.id, g.po, g.item, g.value, g.status, g.received])];
  if (pick(/configuration|rbac|permission/i)) return [['Permission'], ...(((live.access || {}).permissions) || []).map(p => [p])];
  // A named report or analysis: one line per register, from the records loaded now.
  const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  return [['Register', 'Records', 'Value'],
    ['Requisitions', (state.requisitions || []).length, sum(state.requisitions || [], 'amount')],
    ['Tenders (RFQs)', (state.tenders || []).length, ''],
    ['Quotations', (state.quotationsLive || []).length, sum(state.quotationsLive || [], 'amount')],
    ['Purchase orders', (state.orders || []).length, sum(state.orders || [], 'amount')],
    ['Goods received notes', (state.grns || []).length, sum(state.grns || [], 'value')],
    ['Invoices', (state.invoices || []).length, sum(state.invoices || [], 'amount')],
    ['Contracts', (state.contractsV6 || []).filter(c => c.kind === 'contract').length, sum((state.contractsV6 || []).filter(c => c.kind === 'contract'), 'value')],
    ['Plan lines', (state.planItems || []).length, sum(state.planItems || [], 'budget')],
    ['Vendors', (state.vendors || []).length, '']];
}

/** A plain one-page PDF of the export's first rows, with the row count stated. */
function __pr23PdfBlob(title, rows) {
  const clean = s => String(s == null ? '' : s).replace(/[()\\]/g, '').replace(/[^\x20-\x7E]/g, ' ').slice(0, 118);
  const body = rows.slice(1);
  const shown = body.slice(0, 52);
  const lines = [
    `BT /F1 15 Tf 40 760 Td (${clean(title)}) Tj ET`,
    `BT /F1 8 Tf 40 744 Td (Generated ${clean(new Date().toISOString().slice(0, 16).replace('T', ' '))} from live procurement records. ${body.length} row(s)${body.length > shown.length ? `, first ${shown.length} shown` : ''}.) Tj ET`,
    `BT /F1 8 Tf 40 724 Td (${clean(rows[0].join(' | '))}) Tj ET`,
    ...shown.map((r, i) => `BT /F1 8 Tf 40 ${710 - i * 13} Td (${clean(r.join(' | '))}) Tj ET`),
  ];
  const text = lines.join('\n');
  const objs = ['1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj', '2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj', '3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>> endobj', `4 0 obj <</Length ${text.length}>> stream\n${text}\nendstream endobj`, '5 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj'];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach(o => { offsets.push(out.length); out += o + '\n'; });
  const xref = out.length;
  out += `xref\n0 6\n0000000000 65535 f \n${offsets.map(x => String(x).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer <</Size 6/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}

function __pr23ExportFile(format, title) {
  const name = String(title || 'Matanho Procurement Export');
  const base = name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'export';
  const rows = __pr23ExportRows(name);
  if (format === 'pdf') return downloadBlob(__pr23PdfBlob(name, rows), base + '.pdf');
  if (format === 'json') {
    const [head, ...body] = rows;
    return downloadBlob(new Blob([JSON.stringify(body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]]))), null, 2)], { type: 'application/json' }), base + '.json');
  }
  const csv = rows.map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\n');
  if (format === 'csv') return downloadBlob(new Blob([csv], { type: 'text/csv' }), base + '.csv');
  const html = `<html><body><table>${rows.map(r => `<tr>${r.map(v => `<td>${__pr23Esc(v)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
  return downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), base + '.xls');
}

// ---------------------------------------------------------------- accounts payable tab

/** Approved and paid invoices, replacing the two fixture payment batches. */
function __pr23PayablesTable() {
  const rows = (state.invoices || [])
    .filter(i => String(i.rawStatus || '').toUpperCase() === 'APPROVED')
    .map(i => `<tr><td><strong class="link">${__pr23Esc(i.id)}</strong></td><td>${__pr23Esc(i.vendor)}</td><td>${__pr23Esc(i.po)}</td><td class="money">${money(i.amount || 0)}</td><td>${__pr23Esc(i.currency || '')}</td><td>${__pr23Esc(i.due)}</td><td>${status(i.status)}</td><td>${i.payable && __pr23Can('invoices.pay') ? `<button class="btn small" data-action="record-payment-v23" data-id="${__pr23Esc(i.recordId)}">Record payment</button>` : ''}</td></tr>`);
  if (!rows.length) return __pr23NoData('No invoice has been approved for payment yet.');
  return table(['Invoice', 'Vendor', 'Purchase order', 'Amount', 'Currency', 'Due', 'Status', ''], rows);
}

// ---------------------------------------------------------------- requisition budget check

/**
 * The requisition form's budget notice, from approved annual plans for the requester's department
 * this year: plan budget less what is already ordered. With no approved plan it says so; it never
 * blocks the request, because no budget control exists on the backend.
 */
function __pr23BudgetNotice() {
  const live = __pr23Live() || {};
  const dept = live.access && live.access.department;
  const year = String(new Date().getFullYear());
  // A requester usually cannot read plans, and an empty list would read as "no plan exists".
  if (!__pr23Can('plans.view') && !__pr23Can('plans.manage') && !__pr23Can('plans.approve')) {
    return '<p>Your department head approves this request against the approved annual plan; plan budgets are not shown to your role.</p>';
  }
  const plans = (state.plans || []).filter(p => String(p.rawStatus || '').toUpperCase() === 'APPROVED'
    && (!p.department || p.department === dept) && String(p.fiscalYear || '').includes(year));
  if (!plans.length) {
    return `<p>No approved procurement plan covers ${__pr23Esc(dept || 'your department')} for FY ${year}, so this request is not checked against a budget.</p>`;
  }
  const budget = plans.reduce((t, p) => t + Number(p.budget || 0), 0);
  const committed = plans.reduce((t, p) => t + Number(p.committed || 0), 0);
  const label = plans.length === 1 ? __pr23Esc(plans[0].id) : `${plans.length} approved plans`;
  return `<p>Remaining against ${label}: ${money(budget - committed)} of ${money(budget)} (${money(committed)} already ordered). The approver sees this figure; it does not block the request.</p>`;
}

// ---------------------------------------------------------------- requisition line items

/**
 * The New requisition form's lines. The vendored form had one fixed row with a $1,000 unit estimate already
 * filled in, so a request for three different things could not be raised, and every request carried an
 * estimate nobody had given. In a live session the requester adds as many lines as the request needs, and
 * the unit estimate is optional and starts empty.
 */
function __pr23PrLineRowHtml() {
  const uoms = ['Each', 'Box', 'Ream', 'Pack', 'Lot', 'Month'].map(u => `<option>${u}</option>`).join('');
  return `<tr data-pr-line><td><input name="item" required placeholder="What is needed"></td><td><select name="uom">${uoms}</select></td><td><input name="qty" type="number" min="1" step="1" value="1" required style="width:80px"></td><td><input name="price" type="number" min="0" step="0.01" placeholder="Optional" style="width:110px"></td><td data-pr-line-total>—</td></tr>`;
}

/** The lines table body, with Add line / Remove last line in the footer rather than inside a row. */
function __pr23PrLinesTbody() {
  return `<tbody id="prLinesV23">${__pr23PrLineRowHtml()}</tbody><tfoot><tr><td colspan="5"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${btn('Add line', 'add-pr-line-v23', '', 'plus')}${btn('Remove last line', 'remove-pr-line-v23')}<span class="muted" id="prLinesTotalV23" style="margin-left:auto">Estimated total —</span></div></td></tr></tfoot>`;
}

function __pr23PrLinesRecalc() {
  const rows = [...document.querySelectorAll('#prLinesV23 [data-pr-line]')];
  let sum = 0;
  let priced = 0;
  rows.forEach(row => {
    const q = Number(row.querySelector('[name="qty"]')?.value || 0);
    const p = Number(row.querySelector('[name="price"]')?.value || 0);
    const cell = row.querySelector('[data-pr-line-total]');
    if (q > 0 && p > 0) {
      sum += q * p;
      priced += 1;
      if (cell) cell.textContent = __pr23Money2(q * p);
    } else if (cell) {
      cell.textContent = '—';
    }
  });
  const total = document.querySelector('#prLinesTotalV23');
  if (!total) return;
  const unpriced = rows.length - priced;
  total.textContent = priced
    ? `Estimated total ${__pr23Money2(sum)}${unpriced ? ` (${unpriced} line${unpriced === 1 ? '' : 's'} without an estimate)` : ''}`
    : 'Estimated total —';
}

// Add and remove requisition lines in place. Capture phase, and the click ends here, so none of the vendored
// dispatchers treats these buttons as a prototype action.
__pr23On(document, 'click', event => {
  const control = event.target && event.target.closest && event.target.closest('[data-action="add-pr-line-v23"], [data-action="remove-pr-line-v23"]');
  if (!control) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const body = document.querySelector('#prLinesV23');
  if (!body) return;
  if (control.dataset.action === 'add-pr-line-v23') {
    body.insertAdjacentHTML('beforeend', __pr23PrLineRowHtml());
    const rows = body.querySelectorAll('[data-pr-line]');
    const last = rows[rows.length - 1];
    if (last) last.querySelector('[name="item"]')?.focus();
  } else {
    const rows = body.querySelectorAll('[data-pr-line]');
    if (rows.length > 1) rows[rows.length - 1].remove();
    else if (typeof toast === 'function') toast('At least one line', 'A requisition needs at least one line. Change this one instead.');
  }
  __pr23PrLinesRecalc();
}, true);

__pr23On(document, 'input', event => {
  if (event.target && event.target.closest && event.target.closest('#prLinesV23')) __pr23PrLinesRecalc();
}, __pr23Sig);

// Re-draw dependent parts of the live forms when a select changes. Removed with the runtime (__pr23Sig).
__pr23On(document, 'change', event => {
  const target = event.target;
  // RFQ builder: the tender category follows the source requisition, and the builder re-filters its vendors.
  if (target && target.name === 'source' && target.closest && target.closest('#tenderFormV13')) {
    const req = (state.requisitions || []).find(r => r.recordId === target.value);
    const category = document.querySelector('#rfxCategoryV13');
    const filter = document.querySelector('#rfxVendorCategoryV13');
    const hasCategory = Boolean(req && category && [...category.options].some(o => o.value === req.category));
    if (hasCategory && category.value !== req.category) {
      category.value = req.category;
      category.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // A requisition without a category restricts no vendor (the API matches categories only when one is set).
    const wantFilter = hasCategory ? 'Use tender category' : 'All categories';
    if (filter && [...filter.options].some(o => o.value === wantFilter) && filter.value !== wantFilter) {
      filter.value = wantFilter;
      filter.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return;
  }
  if (!target || !target.id) return;
  if (target.id === 'grnPoV23') {
    const box = document.querySelector('#grnLinesV23');
    if (box) box.innerHTML = __pr23GrnLinesHtml(target.value);
  }
  if (target.id === 'invoicePoV23') {
    const box = document.querySelector('#invoiceLinesV23');
    if (box) box.innerHTML = __pr23InvoiceLinesHtml(target.value);
  }
  if (target.id === 'poSourceV23') {
    const box = document.querySelector('#poLinesV23');
    if (box) box.innerHTML = __pr23PoLinesHtml(target.value);
  }
  if (target.id === 'contractSourceV23') {
    const option = target.selectedOptions && target.selectedOptions[0];
    const form = document.querySelector('#contractFormV23');
    if (form && option && option.value) {
      if (option.dataset.value) form.elements.value.value = option.dataset.value;
      if (option.dataset.title && !form.elements.title.value) form.elements.title.value = `Supply agreement · ${option.dataset.title}`;
    }
  }
  if (target.id === 'paymentInvoiceV23') {
    const amount = document.querySelector('#paymentAmountV23');
    const option = target.selectedOptions && target.selectedOptions[0];
    if (amount && option) amount.value = option.dataset.amount || '';
  }
}, __pr23Sig);

// ---------------------------------------------------------------- page access by role (full UI census)

/** Pages that need a view grant; any page not listed is open to every staff user. */
const __PR23_PAGE_GRANTS = {
  dashboard: ['dashboard.view'],
  analytics: ['dashboard.view'],
  reports: ['dashboard.view'],
  plan: ['plans.view', 'plans.manage', 'plans.approve'],
  tenders: ['rfq.view', 'rfq.manage'],
  quotations: ['quotations.view', 'quotations.manage'],
  evaluation: ['rfq.view', 'quotations.view'],
  vendors: ['vendors.view', 'vendors.manage'],
  contracts: ['contracts.view', 'contracts.manage'],
  orders: ['orders.view', 'orders.manage'],
  receiving: ['receiving.view', 'receiving.manage', 'receiving.approve'],
  invoices: ['invoices.view', 'invoices.approve', 'invoices.pay'],
  // Reading an invoice spends an LLM call and files an intake, so it needs the intake grant itself.
  intake: ['intake.manage'],
  accounts: ['invoices.view', 'invoices.pay'],
  documents: ['documents.view', 'documents.manage'],
  audit: ['audit.view'],
};

const __PR23_PAGE_TITLES = {
  dashboard: 'Command Centre', plan: 'Annual Procurement Plan', approvals: 'Approval Centre', requisitions: 'Purchase Requisitions',
  tenders: 'Tenders & RFx', quotations: 'Quotation Comparison', evaluation: 'Bid Evaluation', vendors: 'Vendor Registry',
  contracts: 'Contracts & Awards', orders: 'Purchase Orders', receiving: 'Receiving & Inspection', invoices: 'Invoices & 3-Way Match',
  intake: 'AI Invoice Capture',
  accounts: 'Accounts & Asset Transfers', documents: 'Document Vault', reports: 'Reports Vault', audit: 'Audit & Compliance',
  settings: 'Configuration & RBAC', analytics: 'Analytics',
};

/**
 * Whether the signed-in role may open a page. Until the live load lands (no access yet) every page
 * is allowed, so nothing flashes a refusal; a privileged role opens every page.
 */
function __pr23PageAllowed(page) {
  const live = __pr23Live();
  const access = live && live.access;
  if (!access || access.isPrivileged) return true;
  const grants = __PR23_PAGE_GRANTS[page];
  return !grants || grants.some(__pr23Can);
}

/** The audit card's line, saying how much of the loaded trail the page shows. */
function __pr23AuditStreamNote() {
  const n = (state.auditEventsLive || []).length;
  return n > 50
    ? `The latest 50 of ${n} loaded events, newest first: what was done, to which record, by whom and when.`
    : 'Every recorded procurement action, newest first: what was done, to which record, by whom and when.';
}

/** Today as the procurement documents print dates. */
function __pr23Today() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Labels of an approval's supporting documents in a live session (see __pr23SupportDocument). */
const __PR23_SUPPORT_LABELS = { budget: 'Budget position', evaluation: 'Quotation comparison', conflict: 'Conflict of interest declaration' };

/**
 * An approval's supporting documents built from the records, in a live session. The vendored ones were fixtures shown
 * as evidence: a budget "checked against the approved annual plan" by a sample CFO, a bid evaluation of three sample
 * bidders, a conflict declaration nobody made, all dated 2 August. What the system holds is shown; what it does not
 * hold is said. Returns { name, content } or null.
 */
function __pr23SupportDocument(a, kind) {
  if (!a) return null;
  const e = __pr23Esc;
  const pair = cells => `<tr>${cells.map(([k, v]) => `<th>${e(k)}</th><td>${v}</td>`).join('')}</tr>`;
  const year = new Date().getFullYear();
  const type = String(a.type || 'record').toLowerCase();
  if (kind === 'budget') {
    const dept = a.entity && a.entity !== '—' ? a.entity : null;
    const plans = (state.plans || []).filter(p => String(p.rawStatus || '').toUpperCase() === 'APPROVED'
      && (!p.fiscalYear || String(p.fiscalYear).includes(String(year))) && (!dept || (p.department || p.entity) === dept));
    const budget = plans.reduce((t, p) => t + (Number(p.budget) || 0), 0);
    const committed = (state.orders || []).filter(o => String(o.rawStatus || '').toUpperCase() !== 'CANCELLED'
      && (!dept || o.entity === dept) && (!o.orderDate || new Date(o.orderDate).getFullYear() === year))
      .reduce((t, o) => t + (Number(o.amount) || 0), 0);
    const amount = Number(a.amount) || 0;
    const pct = n => `${Math.round((n / budget) * 100)}%`;
    const position = budget
      ? `<p>${e(dept || 'The organisation')} has ${plans.length === 1 ? 'an approved procurement plan' : `${plans.length} approved procurement plans`} for FY ${year} with a budget of ${money(budget)}. Purchase orders committed against it this year total ${money(committed)} (${pct(committed)})${amount ? `; this ${money(amount)} would bring commitments to ${money(committed + amount)} (${pct(committed + amount)})` : ''}.</p>`
      : `<p>No approved FY ${year} procurement plan is recorded for ${e(dept || 'this department')}, so there is no plan budget to compare this commitment with.</p>`;
    return {
      name: __PR23_SUPPORT_LABELS.budget,
      content: `<h1>Budget position</h1><p class="doc-lead">What the procurement records show about funding for ${e(a.record)}.</p><table><tbody>${pair([['Department', e(dept || '—')], ['Record', e(a.record)]])}${pair([['Requested commitment', amount ? money(amount) : 'No value'], ['Approved plan budget', budget ? money(budget) : 'None recorded']])}</tbody></table><h2>Position against the plan</h2>${position}<h2>Finance confirmation</h2><p>No finance confirmation of funding is recorded for this ${e(type)}: requisitions are not checked against department budgets in this system. The approver confirms that funding is available when deciding.</p>`,
    };
  }
  if (kind === 'evaluation') {
    const rfq = a.kind === 'award' ? a.record : null;
    const quotes = rfq ? (state.quotationsLive || []).filter(q => q.rfq === rfq && q.rawStatus !== 'DRAFT') : [];
    if (!quotes.length) {
      return { name: __PR23_SUPPORT_LABELS.evaluation, content: `<h1>Quotation comparison</h1><p class="doc-lead">${e(a.record)}</p><p>${rfq ? `No quotations have been submitted for ${e(rfq)}.` : `No quotation comparison applies to a ${e(type)}.`}</p>` };
    }
    const rows = [...quotes].sort((x, y) => (x.amount ?? Infinity) - (y.amount ?? Infinity))
      .map(q => `<tr><td>${e(q.vendor)}</td><td>${e(q.id)}</td><td>${money(q.amount)}</td><td>${q.evaluationScore == null ? 'Not scored' : e(q.evaluationScore)}</td><td>${e(q.status)}</td></tr>`).join('');
    return {
      name: __PR23_SUPPORT_LABELS.evaluation,
      content: `<h1>Quotation comparison</h1><p class="doc-lead">The quotations submitted for ${e(rfq)}, lowest total first.</p><table><thead><tr><th>Vendor</th><th>Quotation</th><th>Total</th><th>Evaluation score</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><h2>Basis of the recommendation</h2><p>${e(a.reason || 'The lowest total submitted.')}</p>`,
    };
  }
  if (kind === 'conflict') {
    return {
      name: __PR23_SUPPORT_LABELS.conflict,
      content: `<h1>Conflict of interest declaration</h1><p class="doc-lead">${e(a.record)}</p><table><tbody>${pair([['Approver', e(a.approver || '—')], ['Role', e(a.role || '—')]])}</tbody></table><p>No conflict-of-interest declaration is recorded for this approval; declarations are not captured in this system yet. An approver with a conflict should raise it with the Procurement Manager before deciding.</p>`,
    };
  }
  return {
    name: 'Approval pack index',
    content: `<h1>Approval pack index</h1><p class="doc-lead">What supports ${e(a.record)}.</p><table><thead><tr><th>Document</th><th>Source</th></tr></thead><tbody><tr><td>${e(a.type || 'Transaction record')}</td><td>The ${e(type)} as recorded</td></tr><tr><td>Budget position</td><td>Approved plans and purchase orders</td></tr><tr><td>Quotation comparison</td><td>${a.kind === 'award' ? 'The submitted quotations' : 'Not applicable'}</td></tr><tr><td>Conflict of interest declaration</td><td>Not recorded</td></tr></tbody></table>`,
  };
}

/**
 * The tender award decision paper from the records, in a live session. The vendored memorandum named "TechNova
 * Solutions" as the selected bidder unless one had been picked in the browser, scored three sample bidders, said the
 * bids were "opened under committee control" and showed the sample CFO as having signed on 1 August.
 */
function __pr23AwardMemo(a, t) {
  const e = __pr23Esc;
  const rfq = (t && t.id) || a.record;
  const quotes = (state.quotationsLive || []).filter(q => q.rfq === rfq && q.rawStatus !== 'DRAFT')
    .sort((x, y) => (x.amount ?? Infinity) - (y.amount ?? Infinity));
  const winner = String(a.title || '').replace(/^Award to\s+/i, '') || (quotes[0] && quotes[0].vendor) || '—';
  const pair = cells => `<tr>${cells.map(([k, v]) => `<th>${e(k)}</th><td>${v}</td>`).join('')}</tr>`;
  const rows = quotes.map((q, i) => `<tr><td>${e(q.vendor)}</td><td>${e(q.id)}</td><td>${money(q.amount)}</td><td>${q.evaluationScore == null ? 'Not scored' : e(q.evaluationScore)}</td><td>${i + 1}</td></tr>`).join('');
  return `<h1>Tender Award Approval Memorandum</h1><p class="doc-lead">Award decision for ${e((t && t.title) || a.record)}.</p>`
    + `<table><tbody>${pair([['RFQ reference', e(rfq)], ['Department', e((t && t.entity) || a.entity || '—')]])}${pair([['Method', e((t && t.method) || '—')], ['Closing date', e((t && t.close) || '—')]])}${pair([['Requisition estimate', money(t && t.value)], ['Recommended bidder', e(winner)]])}${pair([['Proposed award value', money(a.amount)], ['Approval role', e(a.role || '—')]])}</tbody></table>`
    + `<h2>1. Quotations received</h2>${quotes.length ? `<p>${quotes.length} quotation${quotes.length === 1 ? ' was' : 's were'} submitted through the vendors' invitation links, ranked here by total.</p><table><thead><tr><th>Vendor</th><th>Quotation</th><th>Total</th><th>Evaluation score</th><th>Rank by total</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>No submitted quotation is recorded for this RFQ.</p>'}`
    + `<h2>2. Basis of the recommendation</h2><p>${e(a.reason || 'The lowest total submitted.')}</p>`
    + `<h2>3. Decision requested</h2><p>Approve the award to <strong>${e(winner)}</strong> for <strong>${money(a.amount)}</strong>. Approving accepts the quotation and raises the purchase order; rejecting leaves the RFQ in evaluation.</p>`
    + `<h2>4. Before approving</h2><ul><li>The vendor's tax clearance and company documents on the Vendor Registry are current.</li><li>No conflict of interest is known to the approver.</li></ul>`;
}

/** Said instead of a page of empty registers, which reads as "nothing exists" rather than "not yours". */
function __pr23NoAccessHtml(page) {
  const title = __PR23_PAGE_TITLES[page] || 'This page';
  const open = Object.keys(__PR23_PAGE_TITLES).filter(p => p !== page && __pr23PageAllowed(p));
  // The module opens on the Command Centre. A role without it goes on to the first page its menu offers; the host
  // replaces the history entry, so Back does not return to a page that would only send it on again.
  if (page === 'dashboard' && open.length && typeof window !== 'undefined' && typeof window.__PR23_REPLACE__ === 'function' && !window.__pr23Redirecting) {
    window.__pr23Redirecting = true;
    setTimeout(() => { window.__pr23Redirecting = false; }, 3000);
    setTimeout(() => window.__PR23_REPLACE__(open[0]), 0);
  }
  const links = open.map(p => `<div class="list-row" data-page="${p}" style="cursor:pointer"><div class="list-main"><strong>${__pr23Esc(__PR23_PAGE_TITLES[p])}</strong><span>Open</span></div></div>`).join('');
  return `<div class="page">${pageHead('Procurement access', title, `Your role does not include ${title}. Procurement access is granted on your role in Admin → Roles.`, '')}${card('Pages your role can open', 'Choose where to go', `<div class="card-body list">${links}</div>`)}</div>`;
}

// ---------------------------------------------------------------- filter bar (full UI census)

/** Filter choices built from the records loaded now, so every choice matches something. */
function __pr23FilterOptions(kind) {
  const uniq = xs => [...new Set(xs.filter(v => v && v !== '—'))].sort((a, b) => String(a).localeCompare(String(b)));
  if (kind === 'status') {
    return ['All statuses', ...uniq(['requisitions', 'tenders', 'orders', 'grns', 'invoices', 'plans', 'contractsV6', 'documents', 'vendors']
      .flatMap(k => (state[k] || []).map(r => r.status || r.stage)))];
  }
  if (kind === 'category') return ['All categories', ...uniq(['requisitions', 'orders', 'grns', 'plans'].flatMap(k => (state[k] || []).map(r => r.entity)))];
  const year = new Date().getFullYear();
  return ['All years', `FY ${year - 1}`, `FY ${year}`, `FY ${year + 1}`];
}

/**
 * Apply the filter bar to the page's tables: a row stays when its text carries the chosen status,
 * department and year. Returns what happened, for the toast. KPI cards and charts are not filtered,
 * and the message says so rather than claiming they were.
 */
function __pr23ApplyTableFilters() {
  const f = state.filters || {};
  const want = [];
  if (f.status && f.status !== 'All statuses') want.push(f.status);
  if (f.category && f.category !== 'All categories') want.push(f.category);
  const year = String(f.period || '').match(/\d{4}/);
  if (year) want.push(year[0]);
  const rows = [...document.querySelectorAll('#workspace table tbody tr')].filter(r => !r.querySelector('.pr23-empty-row'));
  let shown = 0;
  for (const row of rows) {
    const text = (row.innerText || row.textContent || '').toLowerCase();
    const keep = want.every(w => text.includes(String(w).toLowerCase()));
    row.style.display = keep ? '' : 'none';
    if (keep) shown += 1;
  }
  if (!rows.length) return 'This page has no register to filter. KPI cards and charts always cover every record your role can see.';
  return `${shown} of ${rows.length} row${rows.length === 1 ? '' : 's'} match ${want.length ? want.join(', ') : 'every filter'}. KPI cards and charts still cover every record.`;
}

// ---------------------------------------------------------------- charts from records (full UI census)

/** Bars drawn from the records behind the chart's id. The fixture chart's own items are ignored. */
function __pr23LiveBars(items, id) {
  const key = String(id || '');
  const orders = (state.orders || []).filter(o => String(o.rawStatus || '').toUpperCase() !== 'CANCELLED');
  const group = (rows, by, value) => {
    const m = new Map();
    for (const r of rows) {
      const g = by(r);
      if (!g || g === '—') continue;
      m.set(g, (m.get(g) || 0) + (Number(value(r)) || 0));
    }
    return [...m.entries()].filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  };
  let rows = [];
  let unit = 'share';
  if (/supplier/i.test(key)) rows = group(orders, o => o.vendor, o => o.amount);
  else if (/plan-execution/i.test(key)) {
    // Committed value against each department's approved plan budget for this year. It was each department's
    // share of all commitments, so a single department read 100% under "percentage of approved plan".
    const year = new Date().getFullYear();
    const budget = new Map();
    for (const p of state.plans || []) {
      if (String(p.rawStatus || '').toUpperCase() !== 'APPROVED') continue;
      if (p.fiscalYear && !String(p.fiscalYear).includes(String(year))) continue;
      const k = p.department || p.entity;
      if (k) budget.set(k, (budget.get(k) || 0) + (Number(p.budget) || 0));
    }
    const committed = k => orders.filter(o => o.entity === k && (!o.orderDate || new Date(o.orderDate).getFullYear() === year)).reduce((t, o) => t + (Number(o.amount) || 0), 0);
    rows = [...budget.entries()].filter(e => e[1] > 0).map(([k, b]) => [k, Math.round((committed(k) / b) * 100)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
    unit = 'percent';
  }
  // Spend by category groups on the requisition's sourcing category; it grouped on department before.
  else if (/category/i.test(key)) rows = group(orders, o => o.spendCategory, o => o.amount);
  else if (/entity|spend/i.test(key)) rows = group(orders, o => o.entity, o => o.amount);
  else if (/bid|score/i.test(key)) {
    const t = state.evaluationTender;
    rows = (state.quotationsLive || []).filter(q => (!t || q.rfq === t) && q.evaluationScore != null).map(q => [q.vendor, Number(q.evaluationScore)]).slice(0, 6);
    unit = 'score';
  } else if (/invoice|exception|match/i.test(key)) {
    const m = new Map();
    for (const i of state.invoices || []) {
      for (const flag of i.matchFlags || []) {
        const k = String((flag && (flag.type || flag.code || flag.flag)) || flag || '').replace(/_/g, ' ').toLowerCase();
        if (k) m.set(k, (m.get(k) || 0) + 1);
      }
    }
    rows = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    unit = 'count';
  }
  if (!rows.length) return __pr23NoData('No recorded data for this chart yet.');
  const total = rows.reduce((t, r) => t + r[1], 0) || 1;
  const max = Math.max(...rows.map(r => r[1])) || 1;
  return `<div class="bars" data-chart="${__pr23Esc(key)}">${rows.map(([label, v]) => {
    const width = unit === 'score' || unit === 'percent' ? Math.max(0, Math.min(100, v)) : Math.round((v / (unit === 'share' ? total : max)) * 100);
    const shown = unit === 'share' ? `${Math.round((v / total) * 100)}%` : unit === 'percent' ? `${v}%` : String(Math.round(v));
    return `<div class="bar-row"><span>${__pr23Esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><b>${shown}</b></div>`;
  }).join('')}</div>`;
}

/** Twelve months of the current year from real records: commitments and payments, or invoice matching. */
function __pr23LiveLine(id) {
  const key = String(id || '');
  const year = new Date().getFullYear();
  const monthOf = d => {
    const t = d ? new Date(d) : null;
    return t && !Number.isNaN(t.getTime()) && t.getFullYear() === year ? t.getMonth() : -1;
  };
  // Report runs and downloads are not logged, so a report-usage chart has nothing to draw; it drew spend.
  if (/report/i.test(key)) return __pr23NoData('Report runs and downloads are not logged yet.');
  const isMoney = !/invoice|match/i.test(key);
  const series = [];
  if (isMoney) {
    const committed = Array(12).fill(0);
    const paid = Array(12).fill(0);
    for (const o of state.orders || []) {
      if (String(o.rawStatus || '').toUpperCase() === 'CANCELLED') continue;
      const m = monthOf(o.orderDate);
      if (m >= 0) committed[m] += Number(o.amount) || 0;
    }
    for (const i of state.invoices || []) {
      if (String(i.paymentStatus || '').toUpperCase() !== 'PAID') continue;
      const m = monthOf(i.paidAt);
      if (m >= 0) paid[m] += Number(i.amount) || 0;
    }
    series.push(['Committed spend', '#55536f', committed], ['Actual spend', '#11866f', paid]);
  } else {
    const matched = Array(12).fill(0);
    const other = Array(12).fill(0);
    for (const i of state.invoices || []) {
      const m = monthOf(i.invoiceDate);
      if (m < 0) continue;
      if (i.match === 'Matched') matched[m] += 1;
      else other[m] += 1;
    }
    series.push(['Matched', '#11866f', matched], ['Not matched', '#b45309', other]);
  }
  if (!series.some(s => s[2].some(v => v > 0))) return __pr23NoData('No trend data is recorded for this chart yet.');
  const max = Math.max(...series.flatMap(s => s[2])) || 1;
  const x = i => 58 + i * (642 / 11);
  const y = v => 252 - (v / max) * 205;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = v => (isMoney ? (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}m` : v >= 1e3 ? `$${Math.round(v / 1e3)}k` : `$${Math.round(v)}`) : String(Math.round(v)));
  const grid = [0, 0.5, 1].map(f => `<line x1="52" x2="700" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}" stroke="#e5e7eb"/><text x="4" y="${(y(max * f) + 4).toFixed(1)}" font-size="11" fill="#64748b">${fmt(max * f)}</text>`).join('');
  const axis = months.map((m, i) => `<text x="${(x(i) - 10).toFixed(1)}" y="280" font-size="11" fill="#64748b">${m}</text>`).join('');
  // The rest of the year has not happened: the lines stop at this month instead of falling to zero.
  const upTo = new Date().getMonth();
  const lines = series.map(([name, color, all]) => {
    const vals = all.slice(0, upTo + 1);
    return `<path d="${vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>` +
      vals.map((v, i) => (v ? `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5" fill="${color}"><title>${name}, ${months[i]}: ${fmt(v)}</title></circle>` : '')).join('');
  }).join('');
  return `<div class="chart" data-chart="${__pr23Esc(key)}"><svg viewBox="0 0 740 300" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${__pr23Esc(series.map(s => s[0]).join(' and '))} by month, ${year}">${grid}${axis}${lines}</svg></div>`;
}

// ---------------------------------------------------------------- document vault (full UI census)

/** Folder tiles counted from the vault's stored files; templates are layouts, counted as such. */
function __pr23VaultFolders() {
  const docs = state.documents || [];
  const count = name => docs.filter(d => d.folder === name).length;
  return [
    ['Annual Plans', count('Annual Plans'), 'Planning baselines and amendments'],
    ['Tenders & Bids', count('Tenders & Bids'), 'Tender packs, bids and evaluation evidence'],
    ['Contracts & Awards', count('Contracts & Awards'), 'Award notices, contracts and eSign certificates'],
    ['Orders & GRNs', count('Orders & GRNs'), 'Purchase orders, receipts and inspections'],
    ['Invoices & AP', count('Invoices & AP'), 'Invoices, match records and approvals'],
    ['Audit Evidence', count('Audit Evidence'), 'Immutable logs and compliance exports'],
    ['Templates', (state.documentTemplates || []).filter(t => t.folder !== 'Report Templates').length, 'Controlled document layouts'],
    ['Report Templates', (state.reportTemplates || []).length, 'Management and statutory report layouts'],
  ];
}

function __pr23PendingReviewText() {
  const n = (state.documents || []).filter(d => String(d.rawStatus || '').toUpperCase() === 'UNDER_REVIEW').length;
  return n ? `${n} file${n === 1 ? '' : 's'} awaiting review` : 'No file awaits review';
}

// ---------------------------------------------------------------- analysis headlines (full UI census)

/** The headline over each analysis page, from the records rather than the fixture's narrative. */
function __pr23AnalysisHero(kind) {
  const orders = (state.orders || []).filter(o => String(o.rawStatus || '').toUpperCase() !== 'CANCELLED');
  const committed = orders.reduce((t, o) => t + (Number(o.amount) || 0), 0);
  const hero = (h2, p, v) => `<div class="analysis-hero"><div><h2>${__pr23Esc(h2)}</h2><p>${__pr23Esc(p)}</p></div><div class="analysis-value">${__pr23Esc(v)}</div></div>`;
  if (kind === 'spend') {
    // One fiscal year only: orders of one year against another year's plan mean nothing.
    const year = new Date().getFullYear();
    const plans = (state.plans || []).filter(p => String(p.rawStatus || '').toUpperCase() === 'APPROVED' && String(p.fiscalYear || '').includes(String(year)));
    const budget = plans.reduce((t, p) => t + (Number(p.budget) || 0), 0);
    const yearOrders = orders.filter(o => { const d = new Date(o.orderDate || ''); return !Number.isNaN(d.getTime()) && d.getFullYear() === year; });
    const yearCommitted = yearOrders.reduce((t, o) => t + (Number(o.amount) || 0), 0);
    if (!budget) return hero(`${money(yearCommitted)} committed in FY ${year}`, `${yearOrders.length} purchase order${yearOrders.length === 1 ? '' : 's'} this year, not cancelled. No approved procurement plan covers FY ${year}, so there is no budget to measure them against.`, '—');
    const pct = Math.round((yearCommitted / budget) * 1000) / 10;
    return hero(`${money(yearCommitted)} committed against ${money(budget)} of FY ${year} approved plans`, `Commitments are ${pct}% of ${plans.length} approved plan budget${plans.length === 1 ? '' : 's'} for FY ${year}, counting purchase orders that are not cancelled.`, `${pct}%`);
  }
  if (kind === 'category') {
    const m = new Map();
    for (const o of orders) if (o.entity && o.entity !== '—') m.set(o.entity, (m.get(o.entity) || 0) + (Number(o.amount) || 0));
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top) return hero('No committed spend yet', 'Spend by department appears once purchase orders are raised.', '—');
    return hero(`${money(committed)} committed across ${m.size} department${m.size === 1 ? '' : 's'}`, `${top[0]} holds the largest share of committed value.`, `${committed ? Math.round((top[1] / committed) * 100) : 0}%`);
  }
  if (kind === 'exceptions') {
    const open = (state.invoices || []).filter(i => i.match && i.match !== 'Matched' && String(i.rawStatus || '').toUpperCase() !== 'REJECTED');
    const value = open.reduce((t, i) => t + (Number(i.amount) || 0), 0);
    return open.length
      ? hero(`${open.length} invoice${open.length === 1 ? '' : 's'} not fully matched`, 'From the three-way match: a price or quantity discrepancy, a missing receipt, or no purchase order.', money(value))
      : hero('Every open invoice is matched', 'No open invoice has a discrepancy, a missing receipt or a missing purchase order.', money(0));
  }
  if (kind === 'cycle') {
    const up = v => String(v || '').toUpperCase();
    const open = (state.requisitions || []).filter(r => ['PENDING_APPROVAL', 'APPROVED'].includes(up(r.rawStatus))).length
      + (state.tenders || []).filter(t => t.stage === 'Published' || t.stage === 'Evaluation').length
      + orders.filter(o => ['DRAFT', 'APPROVED', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_DELIVERED'].includes(up(o.rawStatus))).length
      + (state.invoices || []).filter(i => up(i.rawStatus) === 'DRAFT').length;
    return hero(`${open} open procurement record${open === 1 ? '' : 's'}`, 'Requisitions awaiting a decision or sourcing, tenders in market, orders not yet delivered and invoices awaiting approval. Service levels are not tracked yet.', '—');
  }
  return hero('Report usage is not tracked yet', 'Reports run from the Reports Vault export the live registers; downloads and schedules are not logged.', '—');
}

// ---------------------------------------------------------------- command centre queue and vendor tax (full UI census)

/** "My approval queue": the decisions the signed-in user can take, not the latest requisitions. */
function __pr23MyQueueHtml() {
  const prompts = (state.approvalPromptsV6 || []).slice(0, 4);
  if (!prompts.length) {
    return '<div class="list-row"><div class="list-main"><strong>Nothing awaits your decision</strong><span>Requisitions, awards, receipts, invoices and plans you can decide appear here.</span></div></div>';
  }
  return prompts.map(a => `<div class="list-row" data-page="approvals" style="cursor:pointer"><div class="list-main"><strong>${__pr23Esc(a.title)}</strong><span>${__pr23Esc(a.type)} · ${__pr23Esc(a.record)}${a.amount != null ? ` · ${money(a.amount)}` : ''}</span></div>${status('Awaiting me')}</div>`).join('');
}

/**
 * Actuals vs Plan "Management observations": approved plans whose orders already exceed what was
 * planned or budgeted, from the records. The fixture listed a solar pump programme and a clinical budget.
 */
function __pr23PlanObservationsHtml() {
  const plans = (state.plans || []).filter(p => String(p.rawStatus || '').toUpperCase() === 'APPROVED');
  const rows = [];
  for (const p of plans) {
    if (p.budget > 0 && p.committed > p.budget) rows.push([p, `${money(p.committed)} ordered against a budget of ${money(p.budget)}`, 'High']);
    else if (p.planned > 0 && p.committed > p.planned) rows.push([p, `${money(p.committed)} ordered against ${money(p.planned)} planned`, 'Attention']);
  }
  if (!rows.length) {
    return `<div class="card-body list"><div class="list-row"><div class="list-main"><strong>Nothing needs attention</strong><span>${plans.length ? `No approved plan has orders beyond its plan or budget (${plans.length} checked).` : 'No procurement plan has been approved yet.'}</span></div></div></div>`;
  }
  return `<div class="card-body list">${rows.map(([p, text, level]) => `<div class="list-row"><div class="list-main"><strong>${__pr23Esc(p.id)} · ${__pr23Esc(p.name)}</strong><span>${__pr23Esc(text)}</span></div>${status(level)}</div>`).join('')}</div>`;
}

/**
 * Vendor Registry compliance filter: shows only the vendors whose tax clearance has the chosen status,
 * and says how many. It only announced "Showing vendors with expired compliance records" and filtered
 * nothing. Clicking the same status again shows every vendor.
 */
function __pr23VendorComplianceFilter(id) {
  const want = String(id || '');
  const rows = [...document.querySelectorAll('#workspace table tbody tr')].filter(r => r.querySelector('.vendor-doc-chip-v6'));
  if (!rows.length) return toast('Nothing to filter', 'No vendor is in the registry yet.');
  const clearing = state.__pr23VendorFilter === want;
  state.__pr23VendorFilter = clearing ? null : want;
  let shown = 0;
  for (const row of rows) {
    const chip = (row.querySelector('.vendor-doc-chip-v6').textContent || '').trim();
    const match = want === 'Review' ? !['Valid', 'Expiring', 'Expired'].includes(chip) : chip === want;
    const keep = clearing || match;
    row.style.display = keep ? '' : 'none';
    if (keep) shown += 1;
  }
  if (clearing) return toast('Compliance filter cleared', `Showing all ${rows.length} vendors.`);
  const what = want === 'Review' ? 'tax clearance that needs review' : `${want.toLowerCase()} tax clearance`;
  return toast('Compliance filter applied', `${shown} of ${rows.length} vendors have ${what}. Choose it again to show all.`);
}

/** Share: the page's own address, copied. No expiring or special link exists, so none is claimed. */
function __pr23CopyPageLink() {
  const href = location.href;
  const done = () => toast('Link copied', 'Anyone who opens it signs in and sees only what their role allows.');
  const fallback = () => toast('Copy this link', href);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(href).then(done, fallback);
    else fallback();
  } catch (e) {
    fallback();
  }
}

/** The vendor record holds no country; unknown is not the same as non-resident. */
function __pr23CountryKnown(vendor) {
  if (!__pr23Live()) return true;
  const c = vendor && vendor.country;
  return Boolean(c && c !== '—');
}

/* END_PROCUREMENT_LIVE_BRIDGE */
