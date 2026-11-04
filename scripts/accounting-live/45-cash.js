/* Cashbook: /accounting/cash-book — each bank account's cashbook and ledger balance (and any gap between them), the
 * cashbook register (receipts, payments, transfers) with filters, and receipts, payments, transfers and voids.
 * Data: /cashbook/position, /cashbook/entries, /cashbook/receipts|payments, /cashbook/transfers. */
AL.ui.cash = AL.ui.cash || { bank: '', type: '', status: '', from: '', to: '', q: '', page: 1 };
AL.cashPos = () => AL.res('cash-pos', () => AL.get('/cashbook/position'));
AL.cashList = () => {
  const u = AL.ui.cash;
  const qs = [`page=${u.page}`, 'limit=50', u.from && `startDate=${encodeURIComponent(u.from)}`, u.to && `endDate=${encodeURIComponent(u.to)}`, u.bank && `bankId=${encodeURIComponent(u.bank)}`, u.type && `type=${encodeURIComponent(u.type)}`, u.status && `status=${encodeURIComponent(u.status)}`, u.q && `search=${encodeURIComponent(u.q)}`].filter(Boolean).join('&');
  u.currentRequestKey = `cash:${qs}`;
  return AL.res(u.currentRequestKey, () => AL.get(`/cashbook/entries?${qs}`));
};
AL.cashReload = () => { Object.keys(AL.cache).filter((k) => k === 'cash-pos' || k.startsWith('cash:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.cashShowCreated = (reference) => { Object.assign(AL.ui.cash, { bank: '', type: '', status: '', from: '', to: '', q: reference || '', page: 1 }); };
AL.cashStatus = { POSTED: ['Posted', 'ok'], PENDING: ['Awaiting allocation', 'warn'], VOIDED: ['Voided', 'bad'] };

AL.page('cash', () => {
  return '<div class="v28-page"><div id="ac52LegacyCashSlot" class="ac52-legacy-mount"></div></div>';
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canVoid = AL.can('manage_ledger');
  const pos = AL.cashPos();
  const head = AL.head('Daily accounting', 'Cashbook', 'Receipts and payments post to the ledger as they are entered; customer and supplier amounts wait for allocation to invoices.',
    canPrepare ? `${AL.btn('New receipt', 'cash-new', 'primary', 'data-t="R"')}${AL.btn('New payment', 'cash-new', '', 'data-t="P"')}${AL.btn('Transfer', 'cash-transfer')}` : '');
  const g = AL.gate(pos, { key: 'cash-pos', errorTitle: 'Bank accounts could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const banks = pos.data;
  const byCur = {};
  banks.forEach((b) => { const c = AL.currencyCode(b.bank.currency); byCur[c] = (byCur[c] || 0) + b.cashbookBalance; });
  const gaps = banks.filter((b) => b.difference != null && Math.abs(b.difference) >= 0.01);
  const one = Object.keys(byCur).length === 1 ? Object.keys(byCur)[0] : '';
  const kpis = AL.kpis([
    ...Object.entries(byCur).map(([c, v]) => [`Cash at bank (${c || 'default currency'})`, AL.money(v, c), `${AL.plural(banks.filter((b) => AL.currencyCode(b.bank.currency) === c).length, 'account')}`, v < 0 ? '#d92d20' : '#0878f6']),
    ['In this month', AL.money(banks.reduce((t, b) => t + b.thisMonth.receipts, 0), one), 'Posted receipts'],
    ['Out this month', AL.money(banks.reduce((t, b) => t + b.thisMonth.payments, 0), one), 'Posted payments'],
    ['Awaiting allocation', String(banks.reduce((t, b) => t + b.pendingEntries, 0)), 'Customer / supplier amounts'],
    ['Not reconciled', String(banks.reduce((t, b) => t + b.unreconciledEntries, 0)), 'Posted entries', banks.some((b) => b.unreconciledEntries) ? '#f79009' : '#12b76a'],
  ]);
  const bankRows = banks.map((b) => `<tr data-cash-bank-row data-id="${ae(b.bank.id)}" tabindex="0" role="button" aria-label="View ${ae(b.bank.name)} details">
    <td><strong>${ae(b.bank.name)}</strong><span class="v28-sub">${ae(b.bank.accountNumber || '')} · ${ae(b.bank.glAccount || 'no ledger account')}</span></td>
    <td>${ae(AL.money(b.cashbookBalance, b.bank.currency))}</td>
    <td>${b.ledgerBalance == null ? '—' : ae(AL.money(b.ledgerBalance, b.bank.currency))}${b.difference ? `<span class="v28-sub al-bad">Ledger differs by ${ae(AL.money(b.difference, b.bank.currency))}</span>` : ''}</td>
    <td>${ae(AL.money(b.thisMonth.receipts, b.bank.currency))}</td>
    <td>${ae(AL.money(b.thisMonth.payments, b.bank.currency))}</td>
    <td class="cash-bank-outstanding">${b.unreconciledEntries ? `${ae(String(b.unreconciledEntries))} <a href="#" role="button" class="cash-reconcile-link" data-al="cash-rec" aria-label="Reconcile ${ae(b.bank.name)}">Reconcile</a>` : AL.status('Reconciled', 'ok')}</td>
    <td class="cash-bank-actions"><button type="button" class="v28-btn icon cash-view-btn" data-al="cash-bank-detail" data-id="${ae(b.bank.id)}" aria-label="View ${ae(b.bank.name)} details" title="View account details"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></svg><span class="cash-view-label">View</span></button></td>
  </tr>`).join('');
  const gapNote = gaps.length ? `<div class="al-state al-note" role="status"><strong>Ledger and cashbook differ</strong><p>${gaps.map((b) => `${ae(b.bank.name)}: ${ae(AL.money(b.difference, b.bank.currency))}`).join(' · ')} — postings to the bank account made without a cashbook line (for example an investment placed or settled). They cannot be reconciled until they are in the cashbook.</p></div>` : '';
  const banksPanel = AL.panel('Bank accounts', '', AL.table(['Account', 'Cashbook balance', 'Ledger balance', 'In this month', 'Out this month', 'Not reconciled', ''], bankRows, '980px'));

  // register
  const u = AL.ui.cash;
  const filters = `<div class="al-filters">
    <label class="v28-field"><span>Account</span><select class="v28-select" data-cash-f="bank"><option value="">All accounts</option>${banks.map((b) => `<option value="${ae(b.bank.id)}"${u.bank === b.bank.id ? ' selected' : ''}>${ae(b.bank.name)}</option>`).join('')}</select></label>
    <label class="v28-field"><span>Type</span><select class="v28-select" data-cash-f="type"><option value="">Receipts and payments</option><option value="RECEIPT"${u.type === 'RECEIPT' ? ' selected' : ''}>Receipts</option><option value="PAYMENT"${u.type === 'PAYMENT' ? ' selected' : ''}>Payments</option></select></label>
    <label class="v28-field"><span>Status</span><select class="v28-select" data-cash-f="status"><option value=""${!u.status ? ' selected' : ''}>All</option><option value="POSTED"${u.status === 'POSTED' ? ' selected' : ''}>Posted</option><option value="PENDING"${u.status === 'PENDING' ? ' selected' : ''}>Awaiting allocation</option><option value="VOIDED"${u.status === 'VOIDED' ? ' selected' : ''}>Voided</option></select></label>
    <label class="v28-field"><span>From</span><input class="v28-input" type="date" data-cash-f="from" value="${ae(u.from)}"></label>
    <label class="v28-field"><span>To</span><input class="v28-input" type="date" data-cash-f="to" value="${ae(u.to)}"></label>
    <label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-cash-f="q" value="${ae(u.q)}" placeholder="Reference or description"></label>
  </div>`;
  const e = AL.cashList();
  const g2 = AL.gate(e, { errorTitle: 'The cashbook could not be loaded' });
  let reg = g2;
  if (!g2) {
    const entries = (e.data && e.data.entries) || [];
    const pg = (e.data && e.data.pagination) || {};
    const tr = entries.map((x) => {
      const st = AL.cashStatus[x.status] || [x.status, 'info'];
      const cp = x.counterpartyType === 'CUSTOMER' ? x.customer && x.customer.name : x.counterpartyType === 'SUPPLIER' ? x.vendor && x.vendor.name : x.glAccount && `${x.glAccount.accountNo} ${x.glAccount.accountName}`;
      const cur = ((banks.find((b) => b.bank.id === x.bankId) || {}).bank || {}).currency || '';
      const canVoidEntry = x.status === 'POSTED' && canVoid && !x.isReconciled;
      const acts = `<div class="cash-entry-actions"><button type="button" class="v28-btn icon cash-view-btn" data-al="cash-detail" data-id="${ae(x.id)}" aria-label="View ${ae(x.reference || x.description || 'cashbook entry')} details" title="View entry details"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></svg><span class="cash-view-label">View</span></button>${canVoidEntry ? `<a href="#" role="button" class="cash-void-link" data-al="cash-void" data-id="${ae(x.id)}" data-ref="${ae(x.reference || x.description)}">Void</a>` : ''}</div>`;
      return `<tr data-cash-entry-row data-id="${ae(x.id)}" tabindex="0" role="button" aria-label="View ${ae(x.reference || x.description || 'cashbook entry')} details">
        <td>${ae(AL.date(x.transactionDate))}</td>
        <td><strong>${ae(x.reference || '—')}</strong><span class="v28-sub">${ae(x.journalEntry ? x.journalEntry.referenceNumber || '' : '')}</span></td>
        <td class="al-wrap">${ae(x.description)}<span class="v28-sub">${ae(cp || '')}</span></td>
        <td>${ae(x.bank ? x.bank.name : '')}</td>
        <td>${x.type === 'RECEIPT' ? ae(AL.money(x.amount, cur)) : ''}</td>
        <td>${x.type === 'PAYMENT' ? ae(AL.money(x.amount, cur)) : ''}</td>
        <td>${AL.status(st[0], st[1])}${x.isReconciled ? '<span class="v28-sub">Reconciled</span>' : ''}${x.transferId ? '<span class="v28-sub">Transfer</span>' : ''}</td>
        <td class="al-actions cash-entry-action-cell">${acts}</td>
      </tr>`;
    }).join('');
    const pager = pg.pages > 1 ? `<div class="al-pager"><span class="v28-sub">Page ${pg.page} of ${pg.pages} · ${AL.plural(pg.total, 'entry')}</span>${pg.page > 1 ? AL.btn('Previous', 'cash-page', 'small', 'data-d="-1"') : ''}${pg.page < pg.pages ? AL.btn('Next', 'cash-page', 'small', 'data-d="1"') : ''}</div>` : '';
    reg = entries.length ? `${AL.table(['Date', 'Reference', 'Description', 'Account', 'Received', 'Paid', 'Status', ''], tr, '1100px')}${pager}` : AL.empty('No cashbook entries match.');
  }
  return `<div class="v28-page">${head}${kpis}${gapNote}${banksPanel}${AL.panel('Cashbook register', '', `${filters}${reg}`)}</div>`;
});
AL.wire.cash = () => {
  document.querySelectorAll('.v28-page tr[data-cash-bank-row]').forEach((row) => {
    if (row.dataset.cashBankWired) return;
    row.dataset.cashBankWired = '1';
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('button, a, input, select, textarea, [data-al]')) return;
      AL.actions['cash-bank-detail'](row);
    });
    row.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      AL.actions['cash-bank-detail'](row);
    });
  });
  document.querySelectorAll('.v28-page tr[data-cash-entry-row]').forEach((row) => {
    if (row.dataset.cashEntryWired) return;
    row.dataset.cashEntryWired = '1';
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('button, a, input, select, textarea, [data-al]')) return;
      AL.actions['cash-detail'](row);
    });
    row.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      AL.actions['cash-detail'](row);
    });
  });
  document.querySelectorAll('[data-cash-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.cashF;
    const apply = () => {
      AL.ui.cash[k] = el.value;
      AL.ui.cash.page = 1;
      if (k !== 'q') { AL.redraw(); return; }
      AL.ui.cash.searchRestore = { cursor: el.selectionStart, until: Date.now() + 5000 };
      clearTimeout(AL.ui.cash.searchTimer);
      AL.ui.cash.searchTimer = setTimeout(() => AL.redraw(), 250);
    };
    if (k === 'q') el.addEventListener('input', apply); else el.addEventListener('change', apply);
  });
  const restore = AL.ui.cash.searchRestore;
  if (restore) {
    const input = document.querySelector('[data-cash-f="q"]');
    if (input && restore.until > Date.now()) {
      input.focus();
      if (typeof restore.cursor === 'number') input.setSelectionRange(restore.cursor, restore.cursor);
    }
    const request = AL.cache[AL.ui.cash.currentRequestKey];
    if (request && request.state !== 'loading') AL.ui.cash.searchRestore = null;
    else if (restore.until <= Date.now()) AL.ui.cash.searchRestore = null;
  }
};
AL.actions['cash-page'] = (el) => { AL.ui.cash.page = Math.max(1, AL.ui.cash.page + Number(el.dataset.d)); AL.redraw(); };
AL.actions['cash-rec'] = () => AL.go('reconciliation');
AL.cashFind = (id) => Object.keys(AL.cache).filter((k) => k.startsWith('cash:')).map((k) => AL.cache[k].data && AL.cache[k].data.entries || []).flat().find((x) => x.id === id);
AL.actions['cash-detail'] = (el) => {
  const x = AL.cashFind(el.dataset.id); if (!x) return;
  const cur = AL.currencyCode(x.bank && x.bank.currency), st = AL.cashStatus[x.status] || [x.status, 'info'];
  const cp = x.counterpartyType === 'CUSTOMER' ? x.customer && x.customer.name : x.counterpartyType === 'SUPPLIER' ? x.vendor && x.vendor.name : x.glAccount && `${x.glAccount.accountNo} ${x.glAccount.accountName}`;
  const detail = [
    ['Date', AL.date(x.transactionDate)], ['Type', x.type === 'RECEIPT' ? 'Receipt' : x.type === 'PAYMENT' ? 'Payment' : x.type],
    ['Reference', x.reference || '—'], ['Description', x.description || '—'],
    ['Bank account', x.bank && x.bank.name], ['Counterparty', cp || '—'],
    ['Amount', AL.money(x.amount, cur)], ['Status', st[0]],
    ['Reconciliation', x.isReconciled ? 'Reconciled' : 'Not reconciled'], ['Journal', x.journalEntry && (x.journalEntry.referenceNumber || x.journalEntry.id) || '—'],
  ].map(([k, v]) => `<div class="cash-detail-item${k === 'Amount' ? ' is-amount' : ''}${k === 'Status' ? ` is-status ${x.status === 'POSTED' ? 'is-good' : x.status === 'VOIDED' ? 'is-bad' : ''}` : ''}"><span>${ae(k)}</span><strong>${ae(String(v == null ? '—' : v))}</strong></div>`).join('');
  AL.form({ title: x.reference || 'Cashbook entry', sub: 'Cashbook entry detail', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide"><div class="cash-detail-grid">${detail}</div></div>`, onSubmit: async () => false });
};
AL.actions['cash-bank-detail'] = (el) => {
  const b = (AL.cache['cash-pos'] && AL.cache['cash-pos'].data || []).find((x) => x.bank && x.bank.id === el.dataset.id); if (!b) return;
  const c = AL.currencyCode(b.bank.currency), detail = [['Account number', b.bank.accountNumber || '—'], ['Ledger account', b.bank.glAccount || '—'], ['Currency', c || '—'], ['Cashbook balance', AL.money(b.cashbookBalance, c)], ['Ledger balance', b.ledgerBalance == null ? '—' : AL.money(b.ledgerBalance, c)], ['Difference', b.difference == null ? '—' : AL.money(b.difference, c)], ['Unreconciled entries', String(b.unreconciledEntries || 0)], ['Pending allocation', String(b.pendingEntries || 0)]].map(([k, v]) => `<div class="cash-detail-item${k === 'Cashbook balance' ? ' is-amount' : ''}"><span>${ae(k)}</span><strong>${ae(String(v == null ? '—' : v))}</strong></div>`).join('');
  AL.form({ title: b.bank.name, sub: 'Bank account detail', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide"><div class="cash-detail-grid">${detail}</div></div>`, onSubmit: async () => false });
};
AL.actions['cash-void'] = (el) => AL.confirm({
  title: `Void ${el.dataset.ref}`, danger: true, confirmLabel: 'Void entry', doneTitle: 'Entry voided', reason: 'Why it is voided',
  body: 'A reversing journal is posted and the entry is marked void; it drops out of reconciliation.',
  onConfirm: async (v) => { await AL.put(`/cashbook/entries/${encodeURIComponent(el.dataset.id)}/void`, { reason: v.reason }); return 'The reversal is posted.'; },
  after: () => AL.cashReload(),
});
AL.actions['cash-new'] = (el) => AL.busy(el, async () => {
  const receipt = el.dataset.t === 'R';
  const [lk, counterparties] = await Promise.all([(async () => { const r = AL.jeLookups(); if (r.pending) await r.pending; return r.data; })(), AL.get(receipt ? '/cashbook/customers' : '/cashbook/vendors')]);
  const banks = (AL.cache['cash-pos'].data || []).map((b) => b.bank);
  const accounts = ((lk && lk.accounts) || []).filter((a) => !/^1[01]\d\d$/.test(String(a.accountNo)) || a.accountNo === '1160');
  const list = (x) => (Array.isArray(x) ? x : (x && (x.customers || x.vendors || x.items || x.data)) || []);
  const partyType = receipt ? 'CUSTOMER' : 'SUPPLIER';
  const partyKey = receipt ? 'customerId' : 'vendorId';
  AL.form({
    title: receipt ? 'New Cashbook Receipt' : 'New Cashbook Payment', wide: true, submitLabel: receipt ? 'Create Receipt' : 'Create Payment', doneTitle: receipt ? 'Receipt recorded' : 'Payment recorded',
    fields: [
      { k: 'bankId', label: 'Bank account', type: 'select', required: true, options: banks.map((b) => ({ value: b.id, label: `${b.name}${AL.currencyCode(b.currency) ? ` (${AL.currencyCode(b.currency)})` : ''}` })) },
      { k: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'description', label: 'Description', type: 'textarea', rows: 3, required: true },
      { k: 'reference', label: 'Reference', required: true },
      { k: 'counterpartyType', label: 'Counterparty Type', type: 'select', required: true, blank: false, options: [{ value: partyType, label: receipt ? 'Customer' : 'Vendor' }, { value: 'GL', label: 'GL Account' }] },
      { k: partyKey, label: receipt ? 'Customer' : 'Vendor', type: 'select', blankLabel: receipt ? 'Select customer…' : 'Select vendor…', options: list(counterparties).map((c) => ({ value: c.id, label: c.name || c.companyName })) },
      { k: 'glAccountId', label: 'GL Account', type: 'select', blankLabel: 'Select GL account…', options: accounts.map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` })) },
      { k: 'transactionDate', label: 'Transaction Date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'vatCode', label: 'VAT', type: 'select', blank: false, options: [{ value: 'EXEMPT', label: 'Exempt / no VAT' }, { value: '0%', label: 'Zero-rated' }, { value: '15.5%', label: 'Standard 15.5%' }] },
    ],
    initial: { bankId: (banks[0] || {}).id, transactionDate: AL.stiToday(), counterpartyType: partyType, vatCode: 'EXEMPT' },
    validate: (v) => {
      if (!(Number(v.amount) > 0)) return 'The amount must be more than zero.';
      if (v.transactionDate > AL.stiToday()) return 'The date cannot be in the future.';
      if (v.counterpartyType === 'GL' && !v.glAccountId) return 'Choose the account.';
      if (v.counterpartyType === partyType && !v[partyKey]) return receipt ? 'Choose the customer.' : 'Choose the vendor.';
      return '';
    },
    onSubmit: async (v) => {
      const body = { bankId: v.bankId, transactionDate: v.transactionDate, amount: Number(v.amount), reference: v.reference || undefined, description: v.description, counterpartyType: v.counterpartyType, vatCode: v.vatCode, ...(v.counterpartyType === 'GL' ? { glAccountId: v.glAccountId } : v.counterpartyType === 'CUSTOMER' ? { customerId: v.customerId } : { vendorId: v.vendorId }) };
      const r = await AL.post(`/cashbook/${receipt ? 'receipts' : 'payments'}`, body);
      const t = r && (r.transaction || r);
      AL.cashShowCreated(v.reference);
      return t && t.status === 'PENDING' ? 'Saved; allocate it to the invoices it settles to post it.' : 'Posted to the ledger.';
    },
    after: () => AL.cashReload(),
  });
  const form = document.getElementById('alForm');
  if (!form) return;
  form.classList.add('cash-legacy-form');
  form.closest('.v28-modal').classList.add('cash-legacy-modal');
  const type = form.elements.counterpartyType;
  const toggle = () => {
    const isGL = type.value === 'GL';
    form.elements[partyKey].closest('label').hidden = isGL;
    form.elements.glAccountId.closest('label').hidden = !isGL;
    form.elements.vatCode.closest('label').hidden = !isGL;
  };
  type.addEventListener('change', toggle);
  toggle();
});
AL.actions['cash-transfer'] = () => {
  const banks = (AL.cache['cash-pos'].data || []).map((b) => b.bank);
  AL.form({
    title: 'New Cashbook Transfer', wide: true, submitLabel: 'Create Transfer', doneTitle: 'Transfer posted',
    fields: [
      { k: 'fromBankId', label: 'From Bank', type: 'select', required: true, options: banks.map((b) => ({ value: b.id, label: `${b.name}${AL.currencyCode(b.currency) ? ` (${AL.currencyCode(b.currency)})` : ''}` })) },
      { k: 'toBankId', label: 'To Bank', type: 'select', required: true, options: banks.map((b) => ({ value: b.id, label: `${b.name}${AL.currencyCode(b.currency) ? ` (${AL.currencyCode(b.currency)})` : ''}` })) },
      { k: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true, wide: true },
      { k: 'description', label: 'Description', type: 'textarea', rows: 3, required: true, wide: true },
      { k: 'reference', label: 'Reference', required: true },
      { k: 'projectCode', label: 'Project Code' },
      { k: 'transferDate', label: 'Transfer Date', type: 'date', required: true, max: AL.stiToday(), wide: true },
    ],
    initial: { transferDate: AL.stiToday() },
    validate: (v) => {
      if (v.fromBankId === v.toBankId) return 'Choose two different accounts.';
      const a = banks.find((b) => b.id === v.fromBankId), b = banks.find((x) => x.id === v.toBankId);
      if (a && b && AL.currencyCode(a.currency) !== AL.currencyCode(b.currency)) return 'Both accounts must be in the same currency; a currency exchange is booked as a payment and a receipt at the day\'s rate.';
      if (v.transferDate > AL.stiToday()) return 'The date cannot be in the future.';
      return Number(v.amount) > 0 ? '' : 'The amount must be more than zero.';
    },
    onSubmit: async (v) => { await AL.post('/cashbook/transfers', { ...v, amount: Number(v.amount) }); AL.cashShowCreated(v.reference); return 'Both accounts are updated.'; },
    after: () => AL.cashReload(),
  });
  const form = document.getElementById('alForm');
  if (form) { form.classList.add('cash-legacy-form', 'cash-legacy-transfer'); form.closest('.v28-modal').classList.add('cash-legacy-modal'); }
};
