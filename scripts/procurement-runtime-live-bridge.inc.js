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

/* END_PROCUREMENT_LIVE_BRIDGE */
