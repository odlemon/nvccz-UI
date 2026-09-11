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
    `<form id="planFormV23" class="form-grid"><input type="hidden" name="recordId" value="${__pr23Esc(plan ? plan.recordId : '')}"><div class="field full"><label>Plan name</label><input name="name" required value="${__pr23Esc(plan ? plan.name : '')}"></div><div class="field"><label>Department</label><input name="department" value="${__pr23Esc(plan ? plan.department || '' : (live.access && live.access.department) || '')}" placeholder="All departments"></div><div class="field"><label>Financial year</label><select name="fiscalYear">${__pr23Options(plan && plan.fiscalYear && !years.includes(plan.fiscalYear) ? [plan.fiscalYear, ...years] : years, plan ? plan.fiscalYear : years[1])}</select></div><div class="field"><label>Budget ceiling</label><input type="number" name="budget" min="1" step="0.01" required value="${plan ? plan.budget : ''}"></div><div class="field"><label>Currency</label><select name="currency">${__pr23Options(['USD', 'ZiG', 'ZAR'])}</select></div><div class="field full"><label>Planning assumptions</label><textarea name="notes">${__pr23Esc(plan ? plan.notes || '' : '')}</textarea></div>${lines}</form>`,
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

/* END_PROCUREMENT_LIVE_BRIDGE */
