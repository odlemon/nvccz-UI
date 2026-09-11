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
  const orders = (state.orders || []).filter(o => o.rfq === tenderId);
  const poIds = new Set(orders.map(o => o.id));
  const grns = (state.grns || []).filter(g => poIds.has(g.po));
  const invoices = (state.invoices || []).filter(i => poIds.has(i.po));
  const label = invoices.length ? 'Invoice received' : orders.length ? 'Awaiting invoice' : 'No purchase order yet';
  const tone = invoices.length ? 'green' : orders.length ? 'amber' : 'blue';
  return { orders, grns, invoices, label, tone };
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

/** Tender categories are the vendor registry's categories, so the category filter can match vendors. */
function __pr23CategoryOptions() {
  const categories = [...new Set((state.vendors || []).map(v => v.category).filter(c => c && c !== '—'))];
  return (categories.length ? categories : ['Uncategorised']).map(c => `<option>${__pr23Esc(c)}</option>`).join('');
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

// ---------------------------------------------------------------- invoice capture

const __PR23_INVOICEABLE = ['SENT', 'ACKNOWLEDGED', 'APPROVED', 'PARTIALLY_RECEIVED', 'PARTIALLY_DELIVERED', 'DELIVERED'];

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

// Re-draw dependent parts of the live forms when a select changes. Removed with the runtime (__pr23Sig).
document.addEventListener('change', event => {
  const target = event.target;
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
  accounts: ['invoices.view', 'invoices.pay'],
  documents: ['documents.view', 'documents.manage'],
  audit: ['audit.view'],
};

const __PR23_PAGE_TITLES = {
  dashboard: 'Command Centre', plan: 'Annual Procurement Plan', approvals: 'Approval Centre', requisitions: 'Purchase Requisitions',
  tenders: 'Tenders & RFx', quotations: 'Quotation Comparison', evaluation: 'Bid Evaluation', vendors: 'Vendor Registry',
  contracts: 'Contracts & Awards', orders: 'Purchase Orders', receiving: 'Receiving & Inspection', invoices: 'Invoices & 3-Way Match',
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

/** Said instead of a page of empty registers, which reads as "nothing exists" rather than "not yours". */
function __pr23NoAccessHtml(page) {
  const title = __PR23_PAGE_TITLES[page] || 'This page';
  const open = Object.keys(__PR23_PAGE_TITLES).filter(p => p !== page && __pr23PageAllowed(p));
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
  else if (/category|entity|spend/i.test(key)) rows = group(orders, o => o.entity, o => o.amount);
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
    const width = unit === 'score' ? Math.max(0, Math.min(100, v)) : Math.round((v / (unit === 'share' ? total : max)) * 100);
    const shown = unit === 'share' ? `${Math.round((v / total) * 100)}%` : String(Math.round(v));
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
  const lines = series.map(([name, color, vals]) =>
    `<path d="${vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>` +
    vals.map((v, i) => (v ? `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5" fill="${color}"><title>${name}, ${months[i]}: ${fmt(v)}</title></circle>` : '')).join('')).join('');
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
    const plans = (state.plans || []).filter(p => String(p.rawStatus || '').toUpperCase() === 'APPROVED');
    const budget = plans.reduce((t, p) => t + (Number(p.budget) || 0), 0);
    if (!budget) return hero(`${money(committed)} committed`, `${orders.length} purchase order${orders.length === 1 ? '' : 's'}, not cancelled. No approved procurement plan has a budget to measure commitments against.`, '—');
    const pct = Math.round((committed / budget) * 1000) / 10;
    return hero(`${money(committed)} committed against ${money(budget)} of approved plans`, `Commitments are ${pct}% of ${plans.length} approved plan budget${plans.length === 1 ? '' : 's'}, counting purchase orders that are not cancelled.`, `${pct}%`);
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
