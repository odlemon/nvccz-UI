/* Receivables: /accounting/receivables — customer invoices (draft → sent → paid), receipts and their allocation to
 * invoices, credit notes, customers with their balances, and the ageing. Posting (sending an invoice or credit note,
 * voiding a sent invoice) is for approvers; preparers raise invoices, credit notes and receipts and allocate them.
 * Data: /accounting/invoices, /accounting/customers, /accounting/credit-notes, /accounting/receivables/unallocated,
 * /cashbook/receipts, /cashbook/open-items/*. */
AL.ui.ar = AL.ui.ar || { tab: 'invoices', status: 'OPEN', q: '' };
AL.arLoad = () => AL.res('ar', async () => {
  const [inv, cust, cn, un, age] = await Promise.all([
    AL.get('/accounting/invoices?limit=500'),
    AL.get('/accounting/customers?limit=500'),
    AL.get('/accounting/credit-notes?limit=200').catch(() => null),
    AL.get('/accounting/receivables/unallocated').catch(() => []),
    AL.get('/accounting/invoices/debtors-age-analysis').catch(() => null),
  ]);
  return { invoices: (inv && inv.invoices) || [], customers: (cust && cust.customers) || [], creditNotes: (cn && cn.creditNotes) || [], unallocated: un || [], ageing: age };
});
AL.arReload = () => { delete AL.cache.ar; AL.redraw(); };
AL.arStatus = { DRAFT: ['Draft', 'warn'], SENT: ['Sent', 'info'], PARTIALLY_PAID: ['Part paid', 'warn'], PAID: ['Paid', 'ok'], VOID: ['Voided', 'bad'] };
AL.cnStatus = { DRAFT: ['Draft', 'warn'], SENT: ['Issued', 'info'], PARTIALLY_APPLIED: ['Part applied', 'warn'], APPLIED: ['Applied', 'ok'] };
AL.arCode = (x) => (x && x.currency && x.currency.code) || '';

AL.page('receivables', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.arLoad();
  const head = AL.head('Accounts receivable', 'Receivables', 'Invoices are posted when sent; money received is a cashbook receipt allocated to the invoices it settles.',
    canPrepare ? `${AL.btn('New invoice', 'ar-new', 'primary')}${AL.btn('Record receipt', 'ar-receipt')}${AL.btn('New customer', 'ar-customer')}` : '');
  const g = AL.gate(e, { key: 'ar', errorTitle: 'Receivables could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { invoices, customers, creditNotes, unallocated, ageing } = e.data;
  const today = AL.stiToday();
  const open = invoices.filter((x) => x.status === 'SENT' || x.status === 'PARTIALLY_PAID');
  const byCur = {};
  open.forEach((x) => { const c = AL.arCode(x); byCur[c] = (byCur[c] || 0) + Number(x.outstandingAmount || 0); });
  const overdue = open.filter((x) => x.dueDate && String(x.dueDate).slice(0, 10) < today);
  const over90 = ageing && ageing.totalsByCurrency ? Object.entries(ageing.totalsByCurrency).map(([c, t]) => [c, Number(t.over90 || 0)]).filter(([, v]) => v > 0) : [];
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const sales90 = invoices.filter((x) => x.status !== 'DRAFT' && x.status !== 'VOID' && String(x.transactionDate).slice(0, 10) >= since).reduce((t, x) => t + Number(x.totalAmount || 0), 0);
  const outAll = Object.values(byCur).reduce((t, v) => t + v, 0);
  const kpis = AL.kpis([
    ...Object.entries(byCur).map(([c, v]) => [`Owed to us (${c})`, AL.money(v, c), AL.plural(open.filter((x) => AL.arCode(x) === c).length, 'open invoice')]),
    ...(Object.keys(byCur).length ? [] : [['Owed to us', AL.money(0), 'No open invoices']]),
    ['Overdue', String(overdue.length), overdue.length ? AL.money(overdue.reduce((t, x) => t + Number(x.outstandingAmount || 0), 0)) : 'Nothing overdue', overdue.length ? '#d92d20' : '#12b76a'],
    ['Over 90 days', over90.length ? over90.map(([c, v]) => AL.money(v, c)).join(' · ') : AL.money(0), 'Past due by more than 90 days', over90.length ? '#d92d20' : '#12b76a'],
    ['Days sales outstanding', sales90 > 0 ? `${Math.round((outAll / sales90) * 90)} days` : '—', 'Owed ÷ last 90 days\' sales × 90'],
    ['Receipts to allocate', String(unallocated.length), unallocated.length ? AL.money(unallocated.reduce((t, r) => t + r.unallocated, 0)) : 'All allocated', unallocated.length ? '#f79009' : '#12b76a'],
    ['Drafts', String(invoices.filter((x) => x.status === 'DRAFT').length), 'Not sent yet'],
  ]);
  const t = AL.ui.ar.tab;
  const tabs = `<div class="v28-tabbar">${[['invoices', 'Invoices'], ['receipts', `Receipts to allocate${unallocated.length ? ` (${unallocated.length})` : ''}`], ['credit', 'Credit notes'], ['customers', 'Customers'], ['ageing', 'Ageing']].map(([id, label]) => `<button class="v28-tab ${t === id ? 'active' : ''}" data-al="ar-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  let body = '';
  if (t === 'invoices') {
    const st = AL.ui.ar.status, q = AL.ui.ar.q.trim().toLowerCase();
    const shown = invoices.filter((x) => (st === 'ALL' || (st === 'OPEN' ? (x.status === 'SENT' || x.status === 'PARTIALLY_PAID') : x.status === st)) && (!q || `${x.invoiceNumber} ${x.customer && x.customer.name} ${x.description}`.toLowerCase().includes(q)));
    const filt = `<div class="al-filters"><label class="v28-field"><span>Show</span><select class="v28-select" data-ar-f="status">${[['OPEN', 'Open (sent, unpaid)'], ['DRAFT', 'Drafts'], ['PAID', 'Paid'], ['VOID', 'Voided'], ['ALL', 'All']].map(([v, l]) => `<option value="${v}"${st === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-ar-f="q" value="${ae(AL.ui.ar.q)}" placeholder="Invoice, customer or description"></label></div>`;
    const rows = shown.map((x) => {
      const s = AL.arStatus[x.status] || [x.status, 'info'];
      const c = AL.arCode(x);
      const late = (x.status === 'SENT' || x.status === 'PARTIALLY_PAID') && x.dueDate && String(x.dueDate).slice(0, 10) < today;
      const acts = [];
      if (x.status === 'DRAFT' && canPost) acts.push(AL.btn('Send', 'ar-send', 'small primary', `data-id="${ae(x.id)}"`));
      if ((x.status === 'SENT' || x.status === 'PARTIALLY_PAID') && canPrepare) acts.push(AL.btn('Record receipt', 'ar-receipt', 'small', `data-id="${ae(x.id)}"`), AL.btn('Credit note', 'ar-cn', 'small', `data-id="${ae(x.id)}"`));
      if ((x.status === 'DRAFT' || x.status === 'SENT') && Number(x.paidAmount || 0) === 0 && canPost) acts.push(AL.btn('Void', 'ar-void', 'small danger', `data-id="${ae(x.id)}"`));
      return `<tr>
        <td><strong>${ae(x.invoiceNumber)}</strong><span class="v28-sub">${ae(AL.date(x.transactionDate))}</span></td>
        <td>${ae((x.customer && x.customer.name) || '—')}</td>
        <td class="al-wrap">${ae(x.description || '')}</td>
        <td>${x.dueDate ? `${ae(AL.date(x.dueDate))}${late ? '<span class="v28-sub al-bad">Overdue</span>' : ''}` : '—'}</td>
        <td>${ae(AL.money(x.totalAmount, c))}</td>
        <td>${ae(AL.money(x.outstandingAmount, c))}</td>
        <td>${AL.status(s[0], s[1])}</td>
        <td class="al-actions">${acts.join('')}</td>
      </tr>`;
    }).join('');
    body = `${filt}${rows ? AL.table(['Invoice', 'Customer', 'Description', 'Due', 'Total', 'Outstanding', 'Status', ''], rows, '1150px') : AL.empty('No invoices here.')}`;
  } else if (t === 'receipts') {
    const rows = unallocated.map((r) => `<tr><td>${ae(AL.date(r.date))}</td><td><strong>${ae(r.customer ? r.customer.name : '')}</strong><span class="v28-sub">${ae(r.reference || r.description || '')}</span></td><td>${ae(r.bank ? r.bank.name : '')}</td><td>${ae(AL.money(r.amount, r.bank && r.bank.currency))}</td><td>${ae(AL.money(r.unallocated, r.bank && r.bank.currency))}</td><td class="al-actions">${canPrepare ? AL.btn('Allocate', 'ar-allocate', 'small primary', `data-id="${ae(r.id)}"`) : ''}</td></tr>`).join('');
    body = rows ? AL.table(['Received', 'Customer', 'Bank', 'Amount', 'Not allocated', ''], rows, '900px') : AL.empty('Every customer receipt is allocated to invoices.');
  } else if (t === 'credit') {
    const rows = creditNotes.map((n) => {
      const s = AL.cnStatus[n.status] || [n.status, 'info'];
      const c = (n.currency && n.currency.code) || '';
      const acts = [];
      if (n.status === 'DRAFT' && canPost) acts.push(AL.btn('Issue', 'cn-send', 'small primary', `data-id="${ae(n.id)}"`));
      if (n.status === 'DRAFT' && canPrepare) acts.push(AL.btn('Delete', 'cn-delete', 'small danger', `data-id="${ae(n.id)}"`));
      if ((n.status === 'SENT' || n.status === 'PARTIALLY_APPLIED') && Number(n.remainingAmount) > 0 && canPrepare) acts.push(AL.btn('Apply to invoice', 'cn-apply', 'small', `data-id="${ae(n.id)}"`));
      return `<tr><td><strong>${ae(n.creditNoteNumber)}</strong><span class="v28-sub">${ae(AL.date(n.createdAt))}</span></td><td>${ae(n.customer ? n.customer.name : '')}</td><td>${ae(n.originalInvoice ? n.originalInvoice.invoiceNumber : '—')}</td><td class="al-wrap">${ae(n.reason || '')}</td><td>${ae(AL.money(n.totalAmount, c))}</td><td>${ae(AL.money(n.remainingAmount, c))}</td><td>${AL.status(s[0], s[1])}</td><td class="al-actions">${acts.join('')}</td></tr>`;
    }).join('');
    body = rows ? AL.table(['Credit note', 'Customer', 'Against', 'Reason', 'Total', 'Not yet applied', 'Status', ''], rows, '1100px') : AL.empty('No credit notes.');
  } else if (t === 'customers') {
    const owed = {};
    open.forEach((x) => { const k = x.customerId; owed[k] = owed[k] || {}; const c = AL.arCode(x); owed[k][c] = (owed[k][c] || 0) + Number(x.outstandingAmount || 0); });
    const rows = customers.map((c) => `<tr><td><strong>${ae(c.name)}</strong><span class="v28-sub">${ae([c.contactPerson, c.email].filter(Boolean).join(' · '))}</span></td><td>${ae(c.taxNumber || '—')}</td><td>${ae(c.paymentTerms ? `${c.paymentTerms} days` : '30 days')}</td><td>${owed[c.id] ? Object.entries(owed[c.id]).map(([k, v]) => ae(AL.money(v, k))).join('<br>') : AL.money(0)}</td></tr>`).join('');
    body = rows ? AL.table(['Customer', 'Tax number', 'Terms', 'Owed'], rows, '760px') : AL.empty('No customers yet.');
  } else {
    const lines = (ageing && ageing.lines) || [];
    const byCust = {};
    lines.forEach((l) => { const k = `${l.customerName}|${l.currencyCode}`; byCust[k] = byCust[k] || { name: l.customerName, cur: l.currencyCode, current: 0, days1To30: 0, days31To60: 0, days61To90: 0, over90: 0 }; byCust[k][l.bucket] = (byCust[k][l.bucket] || 0) + Number(l.outstandingAmount || 0); });
    const rows = Object.values(byCust).map((r) => `<tr><td><strong>${ae(r.name)}</strong></td>${['current', 'days1To30', 'days31To60', 'days61To90', 'over90'].map((b) => `<td>${r[b] ? ae(AL.money(r[b], r.cur)) : ''}</td>`).join('')}<td><strong>${ae(AL.money(['current', 'days1To30', 'days31To60', 'days61To90', 'over90'].reduce((t2, b) => t2 + r[b], 0), r.cur))}</strong></td></tr>`).join('');
    body = rows ? AL.table(['Customer', 'Not yet due', '1–30 days', '31–60 days', '61–90 days', 'Over 90 days', 'Total'], rows, '980px') : AL.empty('Nothing is owed.');
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Receivables', '', `${tabs}${body}`)}</div>`;
});
AL.wire.receivables = () => {
  document.querySelectorAll('[data-ar-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.arF;
    if (k === 'q') el.addEventListener('input', () => { AL.ui.ar.q = el.value; clearTimeout(AL.arT); AL.arT = setTimeout(() => { AL.redraw(); const n = document.querySelector('[data-ar-f="q"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    else el.addEventListener('change', () => { AL.ui.ar[k] = el.value; AL.redraw(); });
  });
};
AL.actions['ar-tab'] = (el) => { AL.ui.ar.tab = el.dataset.tab; AL.redraw(); };
AL.arInv = (id) => ((AL.cache.ar && AL.cache.ar.data && AL.cache.ar.data.invoices) || []).find((x) => x.id === id);

// ------------------------------------------------------------------------------------------------ invoices
AL.arLineRow = (l = {}) => `<tr class="al-ar-line"><td><input class="v28-input" data-k="description" value="${ae(l.description || '')}"></td><td><input class="v28-input" type="number" min="0" step="any" data-k="quantity" value="${ae(l.quantity || 1)}"></td><td><input class="v28-input" type="number" min="0" step="0.01" data-k="unitPrice" value="${ae(l.unitPrice || '')}"></td><td><button class="v28-btn icon" data-al="ar-line-del" type="button" aria-label="Remove line">×</button></td></tr>`;
AL.arReadLines = () => [...document.querySelectorAll('#alOverlay .al-ar-line')].map((tr) => ({ description: tr.querySelector('[data-k="description"]').value.trim(), quantity: Number(tr.querySelector('[data-k="quantity"]').value) || 0, unitPrice: Number(tr.querySelector('[data-k="unitPrice"]').value) || 0 })).filter((l) => l.description || l.unitPrice);
AL.actions['ar-line-add'] = () => { const tb = document.querySelector('#alOverlay .al-ar-lines tbody'); if (tb) tb.insertAdjacentHTML('beforeend', AL.arLineRow()); };
AL.actions['ar-line-del'] = (el) => { if (document.querySelectorAll('#alOverlay .al-ar-line').length > 1) el.closest('tr').remove(); };
AL.actions['ar-new'] = (el) => AL.busy(el, async () => {
  const { customers } = AL.cache.ar.data;
  const cur = await AL.get('/accounting/currencies');
  const base = (cur || []).find((c) => c.isDefault) || (cur || [])[0] || {};
  AL.form({
    title: 'New invoice', sub: 'Saved as a draft; it is posted to the ledger when sent.', wide: true, submitLabel: 'Save draft', doneTitle: 'Invoice saved',
    fields: [
      { k: 'customerId', label: 'Customer', type: 'select', required: true, options: customers.map((c) => ({ value: c.id, label: c.name })) },
      { k: 'currencyId', label: 'Currency', type: 'select', required: true, blank: false, options: (cur || []).filter((c) => c.isActive !== false).map((c) => ({ value: c.id, label: c.code })) },
      { k: 'invoiceDate', label: 'Invoice date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'dueDate', label: 'Due date', type: 'date', hint: "Empty: the customer's payment terms." },
      { k: 'description', label: 'Description', required: true, wide: true },
      { k: 'isTaxable', label: 'Charge VAT', type: 'checkbox' },
    ],
    initial: { currencyId: base.id, invoiceDate: AL.stiToday() },
    extra: `<div class="al-wide"><div class="v28-tablewrap"><table class="v28-table al-ar-lines" style="min-width:640px"><thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th></th></tr></thead><tbody>${AL.arLineRow()}</tbody></table></div>${AL.btn('Add line', 'ar-line-add', 'small', 'type="button"')}</div>`,
    validate: (v) => {
      const ls = AL.arReadLines();
      if (!ls.length) return 'Add at least one line.';
      if (ls.some((l) => !l.description || !(l.quantity > 0) || !(l.unitPrice >= 0))) return 'Each line needs an item, a quantity and a price.';
      if (!(ls.reduce((t, l) => t + l.quantity * l.unitPrice, 0) > 0)) return 'The invoice total must be more than zero.';
      if (v.dueDate && v.dueDate < v.invoiceDate) return 'The due date cannot be before the invoice date.';
      return '';
    },
    onSubmit: async (v) => { await AL.post('/accounting/invoices', { ...v, dueDate: v.dueDate || undefined, items: AL.arReadLines() }); return 'Send it to post it to the ledger.'; },
    after: () => { AL.ui.ar.tab = 'invoices'; AL.ui.ar.status = 'DRAFT'; AL.arReload(); },
  });
});
AL.actions['ar-send'] = (el) => {
  const x = AL.arInv(el.dataset.id); if (!x) return;
  AL.confirm({ title: `Send ${x.invoiceNumber}`, confirmLabel: 'Send and post', doneTitle: 'Invoice sent',
    body: `${AL.money(x.totalAmount, AL.arCode(x))} to ${x.customer ? x.customer.name : 'the customer'}: the receivable and the income are posted, and the invoice is emailed to the customer where an address is on file.`,
    onConfirm: async () => { await AL.patch(`/accounting/invoices/${encodeURIComponent(x.id)}/send`, {}); return ''; }, after: () => AL.arReload() });
};
AL.actions['ar-void'] = (el) => {
  const x = AL.arInv(el.dataset.id); if (!x) return;
  AL.confirm({ title: `Void ${x.invoiceNumber}`, danger: true, confirmLabel: 'Void invoice', doneTitle: 'Invoice voided', reason: 'Why it is voided',
    body: x.status === 'DRAFT' ? 'The draft is withdrawn; nothing was posted.' : 'Its posting is reversed (its month must still be open).',
    onConfirm: async (v) => { await AL.patch(`/accounting/invoices/${encodeURIComponent(x.id)}/void`, { reason: v.reason }); return ''; }, after: () => AL.arReload() });
};

// ------------------------------------------------------------------------------------------------ receipts
AL.actions['ar-receipt'] = (el) => AL.busy(el, async () => {
  const { invoices, customers } = AL.cache.ar.data;
  const inv = el.dataset.id ? AL.arInv(el.dataset.id) : null;
  const banks = ((await AL.get('/cashbook/banks')) || []).filter((b) => b.isActive !== false);
  AL.form({
    title: inv ? `Receipt for ${inv.invoiceNumber}` : 'Record a customer receipt', sub: inv ? `${inv.customer ? inv.customer.name : ''} · ${AL.money(inv.outstandingAmount, AL.arCode(inv))} outstanding` : 'Posted to the bank and allocated to the invoices it settles.', submitLabel: 'Post receipt', doneTitle: 'Receipt posted',
    fields: [
      ...(inv ? [] : [{ k: 'customerId', label: 'Customer', type: 'select', required: true, options: customers.map((c) => ({ value: c.id, label: c.name })) }]),
      { k: 'bankId', label: 'Received into', type: 'select', required: true, options: banks.map((b) => ({ value: b.id, label: b.name })) },
      { k: 'transactionDate', label: 'Date received', type: 'date', required: true, max: AL.stiToday() },
      { k: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'reference', label: 'Reference (deposit slip, transfer)' },
    ],
    initial: { transactionDate: AL.stiToday(), amount: inv ? Number(inv.outstandingAmount) : '', bankId: (banks.find((b) => inv && b.currencyId === inv.currencyId) || banks[0] || {}).id },
    validate: (v) => {
      if (!(Number(v.amount) > 0)) return 'The amount must be more than zero.';
      const b = banks.find((x) => x.id === v.bankId);
      if (inv && b && b.currencyId !== inv.currencyId) return 'Choose a bank account in the invoice currency.';
      return '';
    },
    onSubmit: async (v) => {
      const customerId = inv ? inv.customerId : v.customerId;
      const r = await AL.post('/cashbook/receipts', { bankId: v.bankId, transactionDate: v.transactionDate, amount: Number(v.amount), reference: v.reference || undefined, description: inv ? `Receipt · ${inv.invoiceNumber}` : `Receipt · ${(customers.find((c) => c.id === customerId) || {}).name || 'customer'}`, counterpartyType: 'CUSTOMER', customerId, vatCode: 'EXEMPT' });
      const entryId = r && ((r.transaction && r.transaction.id) || r.id);
      if (inv && entryId) {
        const amt = Math.min(Number(v.amount), Number(inv.outstandingAmount));
        await AL.post(`/cashbook/open-items/match/${encodeURIComponent(entryId)}`, { allocations: [{ openItemId: inv.id, allocatedAmount: amt, description: v.reference || '' }] });
        return Number(v.amount) > amt ? `${AL.money(amt, AL.arCode(inv))} allocated to ${inv.invoiceNumber}; ${AL.money(Number(v.amount) - amt, AL.arCode(inv))} is left to allocate.` : `Allocated to ${inv.invoiceNumber}.`;
      }
      return 'Allocate it to the invoices it settles under "Receipts to allocate".';
    },
    after: () => AL.arReload(),
  });
});
AL.actions['ar-allocate'] = (el) => AL.busy(el, async () => {
  const r = (AL.cache.ar.data.unallocated || []).find((x) => x.id === el.dataset.id); if (!r) return;
  const items = await AL.get(`/cashbook/open-items/customers/${encodeURIComponent(r.customer.id)}`);
  const open = Array.isArray(items) ? items : [];
  let left = r.unallocated;
  const rows = open.map((o) => { const take = Math.min(left, Number(o.outstandingAmount)); left = Math.round((left - take) * 100) / 100; return `<tr class="al-ar-alloc" data-id="${ae(o.id)}"><td><strong>${ae(o.invoiceNumber)}</strong><span class="v28-sub">${ae(o.dueDate ? `Due ${AL.date(o.dueDate)}` : '')}</span></td><td>${ae(AL.money(o.outstandingAmount, o.currency))}</td><td><input class="v28-input" type="number" min="0" step="0.01" max="${ae(Number(o.outstandingAmount))}" data-k="amt" value="${take > 0 ? take : ''}"></td></tr>`; }).join('');
  AL.form({
    title: `Allocate ${AL.money(r.unallocated, r.bank && r.bank.currency)} from ${r.customer.name}`, sub: `${AL.date(r.date)} · ${r.reference || r.description || ''}`, wide: true, submitLabel: 'Allocate', doneTitle: 'Receipt allocated', fields: [],
    extra: `<div class="al-wide">${rows ? AL.table(['Invoice', 'Outstanding', 'Allocate'], rows, '560px') : AL.empty('This customer has no sent, unpaid invoice.')}</div>`,
    validate: () => {
      const a = [...document.querySelectorAll('#alOverlay .al-ar-alloc')].map((tr) => Number(tr.querySelector('[data-k="amt"]').value) || 0);
      const total = a.reduce((t, x) => t + x, 0);
      if (!(total > 0)) return 'Enter what to allocate to at least one invoice.';
      if (total > r.unallocated + 0.005) return `That is ${AL.money(total)}; only ${AL.money(r.unallocated)} is left to allocate.`;
      return '';
    },
    onSubmit: async () => {
      if (!rows) return false;
      const allocations = [...document.querySelectorAll('#alOverlay .al-ar-alloc')].map((tr) => ({ openItemId: tr.dataset.id, allocatedAmount: Number(tr.querySelector('[data-k="amt"]').value) || 0 })).filter((a) => a.allocatedAmount > 0);
      await AL.post(`/cashbook/open-items/match/${encodeURIComponent(r.id)}`, { allocations });
      return `${AL.plural(allocations.length, 'invoice')} settled from this receipt.`;
    },
    after: () => AL.arReload(),
  });
});

// ------------------------------------------------------------------------------------------------ credit notes
AL.actions['ar-cn'] = (el) => {
  const x = AL.arInv(el.dataset.id); if (!x) return;
  const c = AL.arCode(x);
  const vatRate = Number(x.amount) > 0 ? Number(x.vatAmount || 0) / Number(x.amount) : 0;
  AL.form({
    title: `Credit note against ${x.invoiceNumber}`, sub: `${AL.money(x.outstandingAmount, c)} outstanding${vatRate ? ` · VAT is credited at the invoice's rate` : ''}`, submitLabel: 'Raise credit note', doneTitle: 'Credit note raised',
    fields: [
      { k: 'amount', label: `Amount before VAT (${c})`, type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'reason', label: 'Reason', type: 'textarea', required: true, wide: true },
    ],
    validate: (v) => { const gross = Number(v.amount) * (1 + vatRate); return !(Number(v.amount) > 0) ? 'The amount must be more than zero.' : gross > Number(x.outstandingAmount) + 0.005 ? `With VAT that is ${AL.money(gross, c)}, more than the ${AL.money(x.outstandingAmount, c)} outstanding.` : ''; },
    onSubmit: async (v) => {
      const amount = Math.round(Number(v.amount) * 100) / 100, vat = Math.round(amount * vatRate * 100) / 100;
      await AL.post('/accounting/credit-notes', { invoiceId: x.id, amount, vatAmount: vat, totalAmount: Math.round((amount + vat) * 100) / 100, reason: v.reason });
      return 'An approver issues it (posting it); it is then applied to the invoice.';
    },
    after: () => { AL.ui.ar.tab = 'credit'; AL.arReload(); },
  });
};
AL.cnFind = (id) => ((AL.cache.ar && AL.cache.ar.data && AL.cache.ar.data.creditNotes) || []).find((n) => n.id === id);
AL.actions['cn-send'] = (el) => { const n = AL.cnFind(el.dataset.id); if (!n) return; AL.confirm({ title: `Issue ${n.creditNoteNumber}`, confirmLabel: 'Issue and post', doneTitle: 'Credit note issued', body: `${AL.money(n.totalAmount, n.currency && n.currency.code)} is credited to ${n.customer ? n.customer.name : 'the customer'}: income and VAT are reduced and the receivable with them.`, onConfirm: async () => { await AL.post(`/accounting/credit-notes/${encodeURIComponent(n.id)}/send`, {}); return ''; }, after: () => AL.arReload() }); };
AL.actions['cn-delete'] = (el) => { const n = AL.cnFind(el.dataset.id); if (!n) return; AL.confirm({ title: `Delete ${n.creditNoteNumber}`, danger: true, confirmLabel: 'Delete draft', doneTitle: 'Credit note deleted', body: 'The draft and its unposted journal are withdrawn.', onConfirm: async () => { await AL.del(`/accounting/credit-notes/${encodeURIComponent(n.id)}`); return ''; }, after: () => AL.arReload() }); };
AL.actions['cn-apply'] = (el) => {
  const n = AL.cnFind(el.dataset.id); if (!n) return;
  const c = (n.currency && n.currency.code) || '';
  const inv = (AL.cache.ar.data.invoices || []).filter((x) => x.customerId === n.customerId && (x.status === 'SENT' || x.status === 'PARTIALLY_PAID') && x.currencyId === n.currencyId);
  AL.form({
    title: `Apply ${n.creditNoteNumber}`, sub: `${AL.money(n.remainingAmount, c)} to apply`, submitLabel: 'Apply', doneTitle: 'Credit applied',
    fields: [{ k: 'invoiceId', label: 'Invoice', type: 'select', required: true, wide: true, options: inv.map((x) => ({ value: x.id, label: `${x.invoiceNumber} · ${AL.money(x.outstandingAmount, c)} outstanding` })) }, { k: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true }],
    initial: { invoiceId: n.invoiceId && inv.some((x) => x.id === n.invoiceId) ? n.invoiceId : (inv[0] || {}).id, amount: Number(n.remainingAmount) },
    validate: (v) => { const x = inv.find((i) => i.id === v.invoiceId); return !(Number(v.amount) > 0) ? 'Enter the amount.' : Number(v.amount) > Number(n.remainingAmount) + 0.005 ? 'More than the credit left.' : x && Number(v.amount) > Number(x.outstandingAmount) + 0.005 ? 'More than the invoice has outstanding.' : ''; },
    onSubmit: async (v) => { await AL.post(`/accounting/credit-notes/${encodeURIComponent(n.id)}/apply`, { invoiceId: v.invoiceId, amount: Number(v.amount) }); return ''; },
    after: () => AL.arReload(),
  });
};
AL.actions['ar-customer'] = () => AL.form({
  title: 'New customer', submitLabel: 'Add customer', doneTitle: 'Customer added',
  fields: [{ k: 'name', label: 'Name', required: true, wide: true }, { k: 'contactPerson', label: 'Contact person' }, { k: 'email', label: 'Email', type: 'email' }, { k: 'phone', label: 'Phone' }, { k: 'taxNumber', label: 'Tax number (BP / VAT)' }, { k: 'paymentTerms', label: 'Payment terms (days)', type: 'number', min: 0, step: '1' }, { k: 'address', label: 'Address', type: 'textarea', wide: true }],
  initial: { paymentTerms: 30 },
  onSubmit: async (v) => { await AL.post('/accounting/customers', { ...v, paymentTerms: v.paymentTerms ? Number(v.paymentTerms) : undefined }); return v.name; },
  after: () => AL.arReload(),
});
