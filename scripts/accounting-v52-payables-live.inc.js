// Live Payables for Accounting V52 (applied by scripts/patch-accounting-v52-runtime.mjs, inside the v28 layer's scope).
//
// SRD Procurement §3 "Payment Processing Integration": an invoice approved in procurement becomes a payment request in
// Accounts Payable, queued for payment on its due date, and paying it there updates procurement. The prototype page
// showed sample bills and figures ("$270.8k", a flat 2.5% withholding, "96% of supplier spend has an approved PO"), a
// bill workspace with a fixed three-way match, and actions with no backend ("Schedule payment", "Place / release hold",
// "Record receipt", "Amend PO", "Submit recommendation"). A live session renders these instead: the records from the
// loaders (procurement invoices and Accounting's own bills), a payment queue by due date, and a Pay action that posts
// through the backend of the bill it pays.

const AC52_PROC_PATHS = {
  invoices: '/procurement-v23/invoices',
  orders: '/procurement-v23/purchase-orders',
  intake: '/procurement-v23/intake',
  evaluation: '/procurement-v23/evaluation',
  vendors: '/procurement-v23/vendors',
};

function ac52Cents(v) {
  return `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function ac52Plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
/** Days from today to a due date: negative when overdue, null when there is no date. */
function ac52ApDays(due) {
  if (!due || due === '—') return null;
  const d = new Date(due);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
function ac52ApDueCell(x) {
  const when = e(x.due || '—');
  const d = ac52ApDays(x.due);
  if (d == null || !(x.open > 0)) return when;
  const note = d < 0 ? `${ac52Plural(-d, 'day')} overdue` : d === 0 ? 'Due today' : `In ${ac52Plural(d, 'day')}`;
  return `${when}<span class="v28-sub">${note}</span>`;
}
function ac52ApSource(x) {
  return x.source === 'procurement' ? 'Procurement' : 'Accounting';
}
/** Approved, unpaid bills in the order they fall due: the payment queue. */
function ac52ApQueue() {
  return apBills.filter(x => x.payable && x.open > 0).sort((a, b) => (ac52ApDays(a.due) ?? 99999) - (ac52ApDays(b.due) ?? 99999));
}
function ac52Btn(label, action, id, cls = '') {
  return `<button class="v28-btn ${cls}" data-v28="${action}" data-id="${e(id || '')}">${label}</button>`;
}
function ac52Row(label, value) {
  return `<div class="v28-list-item"><div><strong>${label}</strong><span>${value}</span></div></div>`;
}
function ac52Filter(key, label, options, current) {
  return `<label class="v28-field" style="min-width:170px"><span style="font-size:10px;color:#8a8fa3">${label}</span><select class="v28-select" data-aplive-filter="${key}">${options.map(([v, t]) => `<option value="${e(v)}"${v === current ? ' selected' : ''}>${e(t)}</option>`).join('')}</select></label>`;
}
function ac52Age(bills) {
  const a = { cur: 0, b30: 0, b60: 0, b90: 0, b90p: 0 };
  bills.forEach(x => {
    if (!(x.open > 0)) return;
    const d = ac52ApDays(x.due);
    const late = d == null ? 0 : -d;
    if (late <= 0) a.cur += x.open;
    else if (late <= 30) a.b30 += x.open;
    else if (late <= 60) a.b60 += x.open;
    else if (late <= 90) a.b90 += x.open;
    else a.b90p += x.open;
  });
  return a;
}
function ac52AgeHtml(a) {
  return `<div class="v28-age"><div><strong>${money(a.cur)}</strong><span>Not yet due</span></div><div><strong>${money(a.b30)}</strong><span>1–30 days overdue</span></div><div><strong>${money(a.b60)}</strong><span>31–60 days</span></div><div><strong>${money(a.b90)}</strong><span>61–90 days</span></div><div><strong>${money(a.b90p)}</strong><span>Over 90 days</span></div></div>`;
}
function ac52BillMenu(x) {
  const items = [{ label: 'Open bill', action: 'ap-bill', id: x.id }];
  if (x.payable && x.open > 0) items.push({ label: 'Pay bill', action: 'aplive-pay', id: x.id });
  if (x.source === 'procurement') items.push({ label: 'Open in procurement', action: 'aplive-go', id: 'invoices' });
  return more(items, `v28lb-${x.id}`);
}

// Filters re-render the page; the listener is bound once and always calls the latest runtime's renderer.
window.__ac52ApLiveFilter = (key, value) => {
  V28.apLive = Object.assign({ vendor: '', status: '', source: '' }, V28.apLive, { [key]: value });
  render();
  requestAnimationFrame(enhancement);
};
if (!window.__ac52ApLiveFilterBound) {
  window.__ac52ApLiveFilterBound = true;
  document.addEventListener('change', ev => {
    const el = ev.target && ev.target.closest && ev.target.closest('[data-aplive-filter]');
    if (el && typeof window.__ac52ApLiveFilter === 'function') window.__ac52ApLiveFilter(el.dataset.aplivefilter, el.value);
  });
}

function ac52LiveApPage() {
  const t = V28.apTab === 'payments' ? 'queue' : V28.apTab || 'command';
  const f = Object.assign({ vendor: '', status: '', source: '' }, V28.apLive);
  const open = apBills.filter(x => x.open > 0);
  const total = open.reduce((s, x) => s + x.open, 0);
  const queue = ac52ApQueue();
  const ready = queue.reduce((s, x) => s + x.open, 0);
  const overdue = queue.filter(x => (ac52ApDays(x.due) ?? 1) < 0);
  const overdueAmt = overdue.reduce((s, x) => s + x.open, 0);
  const dueSoon = queue.filter(x => { const d = ac52ApDays(x.due); return d != null && d >= 0 && d <= 7; }).reduce((s, x) => s + x.open, 0);
  const awaiting = open.filter(x => !x.payable && x.status !== 'Paid');
  const exceptions = apBills.filter(x => x.open > 0 && /discrepancy|exception|mismatch/i.test(x.match || '')).length;
  const commitments = apPOs.reduce((s, x) => s + Math.max(0, Number(x.commitment || 0) - Number(x.invoiced || 0)), 0);
  const proc = apBills.filter(x => x.source === 'procurement');
  // Command Centre reads these; they are computed from the same bills the page lists.
  window.__ac52HealthMetrics = Object.assign(window.__ac52HealthMetrics || {}, {
    ap: {
      paymentReadiness: total > 0 ? Math.round((ready / total) * 100) : 0,
      vendorControls: apVendors.length ? Math.round((apVendors.filter(x => x.kyc === 'Current').length / apVendors.length) * 100) : 100,
    },
  });

  let body = '';
  if (t === 'command') {
    const awaitingReceipt = proc.filter(x => x.open > 0 && /awaiting receipt/i.test(x.match || '')).length;
    const withPo = proc.filter(x => x.po && x.po !== '—').length;
    body = `<div class="v28-grid two"><div>${panel('Payment obligations', 'Approved supplier liabilities, by when they fall due.', `<div class="v28-age"><div><strong>${money(ready)}</strong><span>Approved to pay</span></div><div><strong>${money(dueSoon)}</strong><span>Due in 7 days</span></div><div><strong>${money(overdueAmt)}</strong><span>Overdue</span></div><div><strong>${money(commitments)}</strong><span>Ordered, not yet invoiced</span></div></div>`)}</div><aside class="v28-list">${[
      ['Awaiting approval', `${ac52Plural(awaiting.length, 'bill')} · ${money(awaiting.reduce((s, x) => s + x.open, 0))}`, awaiting.length ? 'Review' : 'Ready'],
      ['Three-way match exceptions', ac52Plural(exceptions, 'bill'), exceptions ? 'Exception' : 'Ready'],
      ['Overdue for payment', ac52Plural(overdue.length, 'bill'), overdue.length ? 'Overdue' : 'Ready'],
      ['Awaiting goods receipt', ac52Plural(awaitingReceipt, 'procurement invoice'), awaitingReceipt ? 'Review' : 'Ready'],
    ].map(x => `<div class="v28-list-item"><div><strong>${x[0]}</strong><span>${x[1]}</span></div>${status(x[2])}</div>`).join('')}</aside></div><div class="v28-grid equal" style="margin-top:12px">${panel('Creditors ageing', 'Open supplier liabilities by days past due.', ac52AgeHtml(ac52Age(apBills)))}${panel('Procure-to-pay', 'Procurement invoices in Payables, counted from the records.', `${ac52Row('Against a purchase order', `${withPo} of ${ac52Plural(proc.length, 'procurement invoice')}`)}${ac52Row('Approved, awaiting payment', ac52Plural(proc.filter(x => x.payable && x.open > 0).length, 'invoice'))}${ac52Row('Waiting for approval in procurement', ac52Plural(proc.filter(x => x.open > 0 && !x.payable).length, 'invoice'))}${ac52Row('Paid', ac52Plural(proc.filter(x => x.status === 'Paid').length, 'invoice'))}`)}</div>`;
  } else if (t === 'bills') {
    const vendors = [...new Set(apBills.map(x => x.vendor))].sort();
    const statuses = [...new Set(apBills.map(x => x.status))].sort();
    const rows = apBills.filter(x => (!f.vendor || x.vendor === f.vendor) && (!f.status || x.status === f.status) && (!f.source || x.source === f.source));
    const filters = `<div class="v28-filter-row" style="gap:10px;flex-wrap:wrap;align-items:flex-end">${ac52Filter('vendor', 'Vendor', [['', 'All vendors'], ...vendors.map(v => [v, v])], f.vendor)}${ac52Filter('status', 'Status', [['', 'All statuses'], ...statuses.map(s => [s, s])], f.status)}${ac52Filter('source', 'Captured in', [['', 'Procurement and Accounting'], ['procurement', 'Procurement'], ['accounting', 'Accounting']], f.source)}<span class="v28-filter-context">${rows.length} of ${ac52Plural(apBills.length, 'bill')}</span></div>`;
    body = panel('Supplier bill register', 'Supplier invoices from procurement and bills captured in Accounting.', filters + table(['Bill', 'Vendor', 'Captured in', 'Invoice date', 'Due', 'PO / receipt', 'Gross', 'Outstanding', 'Match', 'Status', ''], rows.length ? rows.map(x => `<tr data-v28="ap-bill" data-id="${e(x.id)}"><td class="v28-link">${e(x.id)}<span class="v28-sub">${e(x.journal || '')}</span></td><td>${e(x.vendor)}</td><td>${ac52ApSource(x)}</td><td>${e(x.date)}</td><td>${ac52ApDueCell(x)}</td><td>${e(x.po)}<span class="v28-sub">${e(x.grn)}</span></td><td class="num">${ac52Cents(x.gross)}</td><td class="num">${ac52Cents(x.open)}</td><td>${status(x.match || '—')}</td><td>${status(x.status)}</td><td onclick="event.stopPropagation()">${ac52BillMenu(x)}</td></tr>`).join('') : `<tr><td colspan="11" class="v28-sub">${apBills.length ? 'No bill matches these filters.' : 'No supplier bill or procurement invoice has been recorded yet.'}</td></tr>`, '1320px'));
  } else if (t === 'queue') {
    body = panel('Payment queue', 'Approved bills not yet paid, in the order they fall due.', table(['Due', 'Bill', 'Vendor', 'Captured in', 'Outstanding', ''], queue.length ? queue.map(x => `<tr><td>${ac52ApDueCell(x)}</td><td class="v28-link" data-v28="ap-bill" data-id="${e(x.id)}">${e(x.id)}<span class="v28-sub">${e(x.invoice || '')}</span></td><td>${e(x.vendor)}</td><td>${ac52ApSource(x)}</td><td class="num">${ac52Cents(x.open)}</td><td>${ac52Btn('Pay', 'aplive-pay', x.id, 'small primary')}</td></tr>`).join('') : '<tr><td colspan="6" class="v28-sub">Nothing is approved and waiting for payment.</td></tr>', '900px'));
  } else if (t === 'pos') {
    body = panel('Purchase orders & commitments', 'Procurement purchase orders: what is committed, received and invoiced.', table(['PO', 'Vendor', 'Ordered', 'Expected', 'Commitment', 'Received', 'Invoiced', 'Open commitment', 'Status', ''], apPOs.length ? apPOs.map(x => `<tr data-v28="ap-po" data-id="${e(x.id)}"><td class="v28-link">${e(x.id)}</td><td>${e(x.vendor)}</td><td>${e(x.date)}</td><td>${e(x.delivery || '—')}</td><td class="num">${ac52Cents(x.commitment)}</td><td class="num">${ac52Cents(x.received)}</td><td class="num">${ac52Cents(x.invoiced)}</td><td class="num">${ac52Cents(Math.max(0, x.commitment - x.invoiced))}</td><td>${status(x.status)}</td><td onclick="event.stopPropagation()">${more([{ label: 'Open purchase order', action: 'ap-po', id: x.id }, { label: 'Open in procurement', action: 'aplive-go', id: 'orders' }], `v28lpo-${x.id}`)}</td></tr>`).join('') : '<tr><td colspan="10" class="v28-sub">No purchase order has been raised in procurement yet.</td></tr>', '1150px'));
  } else if (t === 'sourcing') {
    body = panel('Quotations & sourcing', 'Open procurement RFQs and their quotations. Bids are scored and awarded in procurement.', table(['RFQ', 'Requirement', 'Closes', 'Quotations', 'Lowest quotation', 'Lowest bidder', 'Best score', 'Stage', ''], rfqs.length ? rfqs.map(x => `<tr><td>${e(x.id)}</td><td>${e(x.title)}</td><td>${e(x.close)}</td><td>${x.bids}</td><td class="num">${x.bids ? ac52Cents(x.value) : '—'}</td><td>${e(x.leader)}</td><td>${e(x.score)}</td><td>${status(x.stage)}</td><td>${ac52Btn('Open in procurement', 'aplive-go', 'evaluation', 'small')}</td></tr>`).join('') : '<tr><td colspan="9" class="v28-sub">No RFQ is open.</td></tr>', '1100px'));
  } else if (t === 'vendors') {
    body = panel('Vendor accounts', 'Vendors with their open balances. Vendor records are kept in procurement\'s Vendor Registry.', table(['Vendor', 'Outstanding', 'Payment terms', 'Status', ''], apVendors.length ? apVendors.map(x => `<tr><td>${e(x.name)}</td><td class="num">${ac52Cents(x.open)}</td><td>${e(x.terms)} days</td><td>${status(x.kyc === 'Blocked' ? 'Blocked' : 'Current')}</td><td>${ac52Btn('Open in procurement', 'aplive-go', 'vendors', 'small')}</td></tr>`).join('') : '<tr><td colspan="5" class="v28-sub">No vendor is registered.</td></tr>', '800px'));
  } else {
    const byVendor = new Map();
    open.forEach(x => {
      const v = byVendor.get(x.vendor) || { open: 0, overdue: 0, bills: 0 };
      v.open += x.open;
      v.bills += 1;
      if ((ac52ApDays(x.due) ?? 1) < 0) v.overdue += x.open;
      byVendor.set(x.vendor, v);
    });
    const vendorRows = [...byVendor.entries()].sort((a, b) => b[1].open - a[1].open).map(([name, v]) => `<tr><td>${e(name)}</td><td>${v.bills}</td><td class="num">${ac52Cents(v.open)}</td><td class="num">${ac52Cents(v.overdue)}</td></tr>`);
    body = `<div class="v28-grid equal">${panel('Creditors ageing', 'Open liabilities by days past due.', ac52AgeHtml(ac52Age(apBills)))}${panel('Owed by vendor', 'Open bills per vendor, and how much of it is overdue.', table(['Vendor', 'Open bills', 'Outstanding', 'Overdue'], vendorRows.length ? vendorRows.join('') : '<tr><td colspan="4" class="v28-sub">Nothing is owed.</td></tr>', '600px'))}</div>`;
  }

  return `<div class="v28-page">${head('Accounts payable', 'Payables · Procurement to Payment', 'Supplier invoices approved in procurement and Accounting\'s own bills, queued for payment by due date.', `${ac52Btn('Capture a supplier invoice', 'aplive-go', 'intake', 'primary')}${ac52Btn('Purchase orders in procurement', 'aplive-go', 'orders')}`)}<div class="v28-kpis">${kpi('Outstanding', money(total), ac52Plural(open.length, 'open bill'))}${kpi('Approved to pay', money(ready), `${queue.length} in the payment queue`, '#009d68')}${kpi('Due next 7 days', money(dueSoon), 'From the payment queue', '#ef9800')}${kpi('Overdue', money(overdueAmt), ac52Plural(overdue.length, 'bill'), '#df3654')}${kpi('Awaiting approval', String(awaiting.length), 'Not yet approved to pay', '#6c4cff')}${kpi('Open commitments', money(commitments), 'Ordered, not yet invoiced', '#00a8d6')}</div><div class="v28-toolbar">${tabs([['command', 'Overview'], ['bills', 'Supplier bills'], ['queue', 'Payment queue'], ['pos', 'Purchase orders'], ['sourcing', 'Quotations & sourcing'], ['vendors', 'Vendors'], ['aging', 'Ageing']], t, 'ap')}</div>${body}</div>`;
}

function ac52LiveApDetail(type, id) {
  if (type === 'apbill') {
    const x = apBills.find(v => v.id === id);
    if (!x) return `<div class="v28-page">${head('Supplier bill', e(id), 'This bill is no longer in the register.', '', true)}</div>`;
    const actions = [
      x.payable && x.open > 0 ? ac52Btn('Pay bill', 'aplive-pay', x.id, 'primary') : '',
      x.documentUrl ? `<a class="v28-btn" href="${e(x.documentUrl)}" target="_blank" rel="noopener">Supplier's document</a>` : '',
      x.source === 'procurement' ? ac52Btn('Open in procurement', 'aplive-go', 'invoices') : '',
    ].join('');
    const lines = (x.lines || []).map(l => `<tr><td>${e(l.item)}</td><td class="num">${e(l.qty)}</td><td class="num">${ac52Cents(l.price)}</td><td class="num">${ac52Cents(l.amount)}</td><td class="num">${l.poPrice != null ? ac52Cents(l.poPrice) : '—'}</td><td class="num">${l.accepted != null ? e(l.accepted) : '—'}</td><td>${status(l.result || '—')}</td></tr>`).join('');
    const linesPanel = x.source === 'procurement'
      ? panel('Invoice lines against the order', 'Each invoiced line beside the order price and the quantity accepted on receipt.', lines ? table(['Item', 'Qty', 'Unit price', 'Amount', 'Order price', 'Accepted', 'Line'], lines, '780px', '320px') : '<p class="v28-sub">No lines are recorded.</p>')
      : panel('Bill', 'Captured in Accounting.', `<p class="v28-sub">${e(x.invoice || x.id)} from ${e(x.vendor)}. Its lines and coding are kept on the bill in Accounting.</p>`);
    const payment = x.status === 'Paid'
      ? ac52Row(`Paid${x.paidOn ? ` on ${e(x.paidOn)}` : ''}`, e(x.paymentReference || 'No bank reference recorded'))
      : x.payable && x.open > 0
        ? ac52Row('In the payment queue', `Due ${e(x.due || '—')} · ${ac52Cents(x.open)} to pay`)
        : ac52Row('Not payable yet', 'It joins the payment queue once approved');
    return `<div class="v28-page">${head('Supplier bill', e(x.id), `${e(x.vendor)} · ${e(x.invoice || '')}`, actions, true)}<div class="v28-detail-hero"><div class="top"><div><h2>${ac52Cents(x.gross)} · ${status(x.status)}</h2><p>Invoice dated ${e(x.date)} · due ${e(x.due || '—')} · captured in ${ac52ApSource(x)}</p></div><b>${e(x.journal || '')}</b></div><div class="v28-detail-grid"><div><span>Vendor</span><b>${e(x.vendor)}</b></div><div><span>Purchase order</span><b>${e(x.po)}</b></div><div><span>Goods receipt</span><b>${e(x.grn)}</b></div><div><span>Three-way match</span><b>${e(x.match || '—')}</b></div><div><span>Outstanding</span><b>${ac52Cents(x.open)}</b></div></div></div><div class="v28-grid two"><div class="v28-grid">${linesPanel}</div><aside class="v28-grid">${panel('Amounts', '', `${ac52Row('Subtotal', x.subtotal != null ? ac52Cents(x.subtotal) : '—')}${ac52Row('VAT', x.tax != null ? ac52Cents(x.tax) : '—')}${ac52Row('Total', ac52Cents(x.gross))}${ac52Row('Outstanding', ac52Cents(x.open))}`)}${panel('Approval', '', ac52Row(e(x.approval || x.status), ''))}${panel('Payment', '', payment)}</aside></div></div>`;
  }
  if (type === 'appo') {
    const x = apPOs.find(v => v.id === id);
    if (!x) return `<div class="v28-page">${head('Purchase order', e(id), 'This purchase order is no longer in the register.', '', true)}</div>`;
    const invoices = apBills.filter(b => b.source === 'procurement' && b.po === x.id);
    const lines = (x.lines || []).map(l => `<tr><td>${e(l.item)}</td><td>${e(l.unit || '—')}</td><td class="num">${e(l.ordered)}</td><td class="num">${e(l.received)}</td><td class="num">${ac52Cents(l.price)}</td><td class="num">${ac52Cents(l.amount)}</td></tr>`).join('');
    return `<div class="v28-page">${head('Purchase order', e(x.id), `${e(x.vendor)} · ${e(x.status)}`, ac52Btn('Open in procurement', 'aplive-go', 'orders', 'primary'), true)}<div class="v28-kpis">${kpi('Commitment', ac52Cents(x.commitment), 'Order value')}${kpi('Received', ac52Cents(x.received), 'Goods and services received', '#009d68')}${kpi('Invoiced', ac52Cents(x.invoiced), ac52Plural(invoices.length, 'supplier invoice'), '#6c4cff')}${kpi('Open commitment', ac52Cents(Math.max(0, x.commitment - x.invoiced)), 'Not yet invoiced', '#ef9800')}</div><div class="v28-grid equal">${panel('Order lines', 'Ordered and received quantities.', lines ? table(['Item', 'Unit', 'Ordered', 'Received', 'Unit price', 'Amount'], lines, '720px', '300px') : '<p class="v28-sub">No lines are recorded.</p>')}${panel('From requisition to invoice', 'The records behind this order.', `${ac52Row('Requisition', e(x.requisition || 'Raised without a requisition'))}${ac52Row('Quotation', e(x.quotation || 'Ordered without a quotation'))}${ac52Row('Ordered', `${e(x.date)} · expected ${e(x.delivery || '—')}`)}${ac52Row('Supplier invoices', invoices.length ? invoices.map(b => `${e(b.id)} (${e(b.status)})`).join(', ') : 'None yet')}`)}</div></div>`;
  }
  const r = rfqs.find(v => v.id === id);
  return `<div class="v28-page">${head('Sourcing', e(id), r ? e(r.title) : 'Open RFQ', ac52Btn('Open in procurement', 'aplive-go', 'evaluation', 'primary'), true)}${panel('Scored and awarded in procurement', '', `<p class="v28-sub">${r ? `${ac52Plural(r.bids, 'quotation')} received${r.bids ? `, the lowest ${ac52Cents(r.value)} from ${e(r.leader)}` : ''}. ` : ''}Quotations are compared, scored and awarded in procurement's Bid Evaluation.</p>`)}</div>`;
}

function ac52LiveApPayModal(id) {
  const x = apBills.find(v => v.id === id);
  if (!x || !x.payable || !(x.open > 0)) {
    if (typeof toast === 'function') toast('Not payable', 'That bill is not approved to pay, or it is already paid.');
    return;
  }
  const banks = (window.__ac52ApBanks || []).filter(b => b.status !== 'Inactive');
  const today = new Date().toISOString().slice(0, 10);
  const proof = x.source === 'procurement';
  const body = banks.length
    ? `<div class="v28-form-grid">${field('Bill', `<b>${e(x.id)} · ${e(x.vendor)}</b>`)}${field('Pay from', `<select class="v28-select" id="ac52PayBank">${banks.map(b => `<option value="${e(b.id)}">${e(b.name)}${b.account ? ` · ${e(b.account)}` : ''} (${e(b.currency)})</option>`).join('')}</select>`)}${field('Payment date', `<input class="v28-input" type="date" id="ac52PayDate" value="${today}" max="${today}">`)}${field('Bank reference', '<input class="v28-input" id="ac52PayRef" placeholder="The bank\'s transaction reference">')}${field('Amount', `<input class="v28-input" type="number" id="ac52PayAmount" min="0.01" step="0.01" value="${Number(x.open).toFixed(2)}" readonly title="Bills are paid in full">`)}${proof ? field('Proof of payment', '<input class="v28-input" type="file" id="ac52PayProof" accept=".pdf,.png,.jpg,.jpeg">') : ''}</div><p class="v28-sub" style="margin-top:10px">${proof ? 'Paying a procurement invoice posts the payment journal and the cashbook entry, and marks the invoice paid in procurement. The proof of payment is kept with it.' : 'Paying the bill posts the payment journal and the cashbook entry. A payment above the approval threshold goes to the CFO first.'}</p><p id="ac52PayError" class="v28-sub" style="color:#df3654;margin-top:6px"></p>`
    : '<p>No active bank or cash account is set up in Accounting, so a payment cannot be recorded yet.</p>';
  document.querySelector('#v28Overlay')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="v28-modal-backdrop" id="v28Overlay"><section class="v28-modal"><header><div><h2>Pay supplier bill</h2><p>${e(x.vendor)} · ${e(x.invoice || x.id)} · ${ac52Cents(x.open)} outstanding</p></div><button class="v28-btn icon" data-v28="modal-close">×</button></header><div class="v28-modal-body">${body}</div><footer class="v28-modal-foot"><span>Posted to the live ledger.</span><div class="v28-actions">${btn('Cancel', 'modal-close')}${banks.length ? ac52Btn(`Pay ${ac52Cents(x.open)}`, 'aplive-pay-confirm', x.id, 'primary') : ''}</div></footer></section></div>`);
}

function ac52LiveApPayConfirm(id) {
  const x = apBills.find(v => v.id === id);
  if (!x) return;
  const val = sel => (document.querySelector(sel)?.value || '').trim();
  const fail = msg => { const el = document.querySelector('#ac52PayError'); if (el) el.textContent = msg; };
  const amount = Number(val('#ac52PayAmount'));
  const file = document.querySelector('#ac52PayProof')?.files?.[0] || null;
  if (!val('#ac52PayBank')) return fail('Choose the account the payment is made from.');
  if (!val('#ac52PayDate')) return fail('Enter the payment date.');
  if (!(amount > 0)) return fail('Enter an amount above zero.');
  if (amount > x.open + 0.005) return fail(`The amount cannot be more than the ${ac52Cents(x.open)} outstanding.`);
  if (x.source === 'procurement' && !file) return fail('Attach the proof of payment: a procurement invoice is paid with its bank evidence.');
  const payload = {
    source: x.source,
    recordId: x.recordId,
    billId: x.id,
    vendor: x.vendor,
    bankId: val('#ac52PayBank'),
    bankName: document.querySelector('#ac52PayBank')?.selectedOptions?.[0]?.textContent || '',
    date: val('#ac52PayDate'),
    reference: val('#ac52PayRef'),
    amount,
    file,
  };
  const notClaimed = window.dispatchEvent(new CustomEvent('matanho:before-action', { detail: { action: 'ap-pay-bill', payload, dataset: {}, state: {} }, cancelable: true }));
  if (notClaimed) return fail('Payments can only be recorded against the live ledger.');
  document.querySelector('#v28Overlay')?.remove();
}

function ac52LiveApClick(a, id) {
  if (a === 'aplive-pay') return ac52LiveApPayModal(id);
  if (a === 'aplive-pay-confirm') return ac52LiveApPayConfirm(id);
  if (a === 'aplive-go') return window.location.assign(AC52_PROC_PATHS[id] || '/procurement-v23');
}
