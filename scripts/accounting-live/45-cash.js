/* Cashbook: /accounting/cash-book — each bank account's cashbook and ledger balance (and any gap between them), the
 * cashbook register (receipts, payments, transfers) with filters, and receipts, payments, transfers and voids.
 * Data: /cashbook/position, /cashbook/entries, /cashbook/receipts|payments, /cashbook/transfers. */
AL.ui.cash = AL.ui.cash || { bank: '', type: '', status: 'POSTED', from: '', to: '', q: '', page: 1 };
AL.cashPos = () => AL.res('cash-pos', () => AL.get('/cashbook/position'));
AL.cashList = () => {
  const u = AL.ui.cash;
  const from = u.from || `${AL.stiToday().slice(0, 7)}-01`, to = u.to || AL.stiToday();
  const qs = [`page=${u.page}`, 'limit=50', `startDate=${from}`, `endDate=${to}`, u.bank && `bankId=${u.bank}`, u.type && `type=${u.type}`, u.status && `status=${u.status}`, u.q && `search=${encodeURIComponent(u.q)}`].filter(Boolean).join('&');
  return AL.res(`cash:${qs}`, () => AL.get(`/cashbook/entries?${qs}`));
};
AL.cashReload = () => { Object.keys(AL.cache).filter((k) => k === 'cash-pos' || k.startsWith('cash:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.cashStatus = { POSTED: ['Posted', 'ok'], PENDING: ['Awaiting allocation', 'warn'], VOIDED: ['Voided', 'bad'] };

AL.page('cash', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canVoid = AL.can('manage_ledger');
  const pos = AL.cashPos();
  const head = AL.head('Daily accounting', 'Cashbook', 'Receipts and payments post to the ledger as they are entered; customer and supplier amounts wait for allocation to invoices.',
    canPrepare ? `${AL.btn('New receipt', 'cash-new', 'primary', 'data-t="R"')}${AL.btn('New payment', 'cash-new', '', 'data-t="P"')}${AL.btn('Transfer', 'cash-transfer')}` : '');
  const g = AL.gate(pos, { key: 'cash-pos', errorTitle: 'Bank accounts could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const banks = pos.data;
  const byCur = {};
  banks.forEach((b) => { const c = b.bank.currency || ''; byCur[c] = (byCur[c] || 0) + b.cashbookBalance; });
  const gaps = banks.filter((b) => b.difference != null && Math.abs(b.difference) >= 0.01);
  const one = Object.keys(byCur).length === 1 ? Object.keys(byCur)[0] : '';
  const kpis = AL.kpis([
    ...Object.entries(byCur).map(([c, v]) => [`Cash at bank (${c})`, AL.money(v, c), `${AL.plural(banks.filter((b) => (b.bank.currency || '') === c).length, 'account')}`, v < 0 ? '#d92d20' : '#0878f6']),
    ['In this month', AL.money(banks.reduce((t, b) => t + b.thisMonth.receipts, 0), one), 'Posted receipts'],
    ['Out this month', AL.money(banks.reduce((t, b) => t + b.thisMonth.payments, 0), one), 'Posted payments'],
    ['Awaiting allocation', String(banks.reduce((t, b) => t + b.pendingEntries, 0)), 'Customer / supplier amounts'],
    ['Not reconciled', String(banks.reduce((t, b) => t + b.unreconciledEntries, 0)), 'Posted entries', banks.some((b) => b.unreconciledEntries) ? '#f79009' : '#12b76a'],
  ]);
  const bankRows = banks.map((b) => `<tr>
    <td><strong>${ae(b.bank.name)}</strong><span class="v28-sub">${ae(b.bank.accountNumber || '')} · ${ae(b.bank.glAccount || 'no ledger account')}</span></td>
    <td>${ae(AL.money(b.cashbookBalance, b.bank.currency))}</td>
    <td>${b.ledgerBalance == null ? '—' : ae(AL.money(b.ledgerBalance, b.bank.currency))}${b.difference ? `<span class="v28-sub al-bad">Ledger differs by ${ae(AL.money(b.difference, b.bank.currency))}</span>` : ''}</td>
    <td>${ae(AL.money(b.thisMonth.receipts, b.bank.currency))}</td>
    <td>${ae(AL.money(b.thisMonth.payments, b.bank.currency))}</td>
    <td>${b.unreconciledEntries ? `${ae(String(b.unreconciledEntries))} ${AL.btn('Reconcile', 'cash-rec', 'small')}` : AL.status('Reconciled', 'ok')}</td>
  </tr>`).join('');
  const gapNote = gaps.length ? `<div class="al-state al-note" role="status"><strong>Ledger and cashbook differ</strong><p>${gaps.map((b) => `${ae(b.bank.name)}: ${ae(AL.money(b.difference, b.bank.currency))}`).join(' · ')} — postings to the bank account made without a cashbook line (for example an investment placed or settled). They cannot be reconciled until they are in the cashbook.</p></div>` : '';
  const banksPanel = AL.panel('Bank accounts', '', AL.table(['Account', 'Cashbook balance', 'Ledger balance', 'In this month', 'Out this month', 'Not reconciled'], bankRows, '980px'));

  // register
  const u = AL.ui.cash;
  const filters = `<div class="al-filters">
    <label class="v28-field"><span>Account</span><select class="v28-select" data-cash-f="bank"><option value="">All accounts</option>${banks.map((b) => `<option value="${ae(b.bank.id)}"${u.bank === b.bank.id ? ' selected' : ''}>${ae(b.bank.name)}</option>`).join('')}</select></label>
    <label class="v28-field"><span>Type</span><select class="v28-select" data-cash-f="type"><option value="">Receipts and payments</option><option value="RECEIPT"${u.type === 'RECEIPT' ? ' selected' : ''}>Receipts</option><option value="PAYMENT"${u.type === 'PAYMENT' ? ' selected' : ''}>Payments</option></select></label>
    <label class="v28-field"><span>Status</span><select class="v28-select" data-cash-f="status"><option value="POSTED"${u.status === 'POSTED' ? ' selected' : ''}>Posted</option><option value="PENDING"${u.status === 'PENDING' ? ' selected' : ''}>Awaiting allocation</option><option value="VOIDED"${u.status === 'VOIDED' ? ' selected' : ''}>Voided</option><option value=""${!u.status ? ' selected' : ''}>All</option></select></label>
    <label class="v28-field"><span>From</span><input class="v28-input" type="date" data-cash-f="from" value="${ae(u.from || `${AL.stiToday().slice(0, 7)}-01`)}"></label>
    <label class="v28-field"><span>To</span><input class="v28-input" type="date" data-cash-f="to" value="${ae(u.to || AL.stiToday())}"></label>
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
      const acts = [];
      if (x.status === 'POSTED' && canVoid && !x.isReconciled) acts.push(AL.btn('Void', 'cash-void', 'small danger', `data-id="${ae(x.id)}" data-ref="${ae(x.reference || x.description)}"`));
      return `<tr>
        <td>${ae(AL.date(x.transactionDate))}</td>
        <td><strong>${ae(x.reference || '—')}</strong><span class="v28-sub">${ae(x.journalEntry ? x.journalEntry.referenceNumber || '' : '')}</span></td>
        <td class="al-wrap">${ae(x.description)}<span class="v28-sub">${ae(cp || '')}</span></td>
        <td>${ae(x.bank ? x.bank.name : '')}</td>
        <td>${x.type === 'RECEIPT' ? ae(AL.money(x.amount, cur)) : ''}</td>
        <td>${x.type === 'PAYMENT' ? ae(AL.money(x.amount, cur)) : ''}</td>
        <td>${AL.status(st[0], st[1])}${x.isReconciled ? '<span class="v28-sub">Reconciled</span>' : ''}${x.transferId ? '<span class="v28-sub">Transfer</span>' : ''}</td>
        <td class="al-actions">${acts.join('')}</td>
      </tr>`;
    }).join('');
    const pager = pg.pages > 1 ? `<div class="al-pager"><span class="v28-sub">Page ${pg.page} of ${pg.pages} · ${AL.plural(pg.total, 'entry')}</span>${pg.page > 1 ? AL.btn('Previous', 'cash-page', 'small', 'data-d="-1"') : ''}${pg.page < pg.pages ? AL.btn('Next', 'cash-page', 'small', 'data-d="1"') : ''}</div>` : '';
    reg = entries.length ? `${AL.table(['Date', 'Reference', 'Description', 'Account', 'Received', 'Paid', 'Status', ''], tr, '1100px')}${pager}` : AL.empty('No cashbook entries match.');
  }
  return `<div class="v28-page">${head}${kpis}${gapNote}${banksPanel}${AL.panel('Cashbook register', '', `${filters}${reg}`)}</div>`;
});
AL.wire.cash = () => {
  document.querySelectorAll('[data-cash-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.cashF;
    const apply = () => { AL.ui.cash[k] = el.value; AL.ui.cash.page = 1; AL.redraw(); };
    if (k === 'q') el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') apply(); }); else el.addEventListener('change', apply);
  });
};
AL.actions['cash-page'] = (el) => { AL.ui.cash.page = Math.max(1, AL.ui.cash.page + Number(el.dataset.d)); AL.redraw(); };
AL.actions['cash-rec'] = () => AL.go('reconciliation');
AL.actions['cash-void'] = (el) => AL.confirm({
  title: `Void ${el.dataset.ref}`, danger: true, confirmLabel: 'Void entry', doneTitle: 'Entry voided', reason: 'Why it is voided',
  body: 'A reversing journal is posted and the entry is marked void; it drops out of reconciliation.',
  onConfirm: async (v) => { await AL.put(`/cashbook/entries/${encodeURIComponent(el.dataset.id)}/void`, { reason: v.reason }); return 'The reversal is posted.'; },
  after: () => AL.cashReload(),
});
AL.actions['cash-new'] = (el) => AL.busy(el, async () => {
  const receipt = el.dataset.t === 'R';
  const [lk, custs, vends] = await Promise.all([(async () => { const r = AL.jeLookups(); if (r.pending) await r.pending; return r.data; })(), AL.get('/cashbook/customers').catch(() => []), AL.get('/cashbook/vendors').catch(() => [])]);
  const banks = (AL.cache['cash-pos'].data || []).map((b) => b.bank);
  const accounts = ((lk && lk.accounts) || []).filter((a) => !/^1[01]\d\d$/.test(String(a.accountNo)) || a.accountNo === '1160');
  const list = (x) => (Array.isArray(x) ? x : (x && (x.customers || x.vendors || x.items || x.data)) || []);
  AL.form({
    title: receipt ? 'New receipt' : 'New payment', wide: true, submitLabel: receipt ? 'Post receipt' : 'Post payment', doneTitle: receipt ? 'Receipt recorded' : 'Payment recorded',
    fields: [
      { k: 'bankId', label: 'Bank account', type: 'select', required: true, blank: false, options: banks.map((b) => ({ value: b.id, label: `${b.name} (${b.currency || ''})` })) },
      { k: 'transactionDate', label: 'Date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'reference', label: receipt ? 'Reference (deposit slip, transfer ref)' : 'Reference (cheque no., transfer ref, ZIMRA code)' },
      { k: 'description', label: 'Description', required: true, wide: true },
      { k: 'counterpartyType', label: receipt ? 'Received from' : 'Paid to', type: 'select', required: true, blank: false, options: [{ value: 'GL', label: 'An account (income, expense, other)' }, { value: 'CUSTOMER', label: 'A customer' }, { value: 'SUPPLIER', label: 'A supplier' }] },
      { k: 'glAccountId', label: 'Account', type: 'select', options: accounts.map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` })) },
      { k: 'customerId', label: 'Customer', type: 'select', options: list(custs).map((c) => ({ value: c.id, label: c.name })) },
      { k: 'vendorId', label: 'Supplier', type: 'select', options: list(vends).map((v) => ({ value: v.id, label: v.name || v.companyName })) },
      { k: 'vatCode', label: 'VAT', type: 'select', blank: false, options: [{ value: 'EXEMPT', label: 'Exempt / no VAT' }, { value: '0%', label: 'Zero-rated' }, { value: '15.5%', label: 'Standard 15.5%' }] },
    ],
    initial: { bankId: (banks[0] || {}).id, transactionDate: AL.stiToday(), counterpartyType: 'GL', vatCode: 'EXEMPT' },
    validate: (v) => {
      if (!(Number(v.amount) > 0)) return 'The amount must be more than zero.';
      if (v.transactionDate > AL.stiToday()) return 'The date cannot be in the future.';
      if (v.counterpartyType === 'GL' && !v.glAccountId) return 'Choose the account.';
      if (v.counterpartyType === 'CUSTOMER' && !v.customerId) return 'Choose the customer.';
      if (v.counterpartyType === 'SUPPLIER' && !v.vendorId) return 'Choose the supplier.';
      return '';
    },
    onSubmit: async (v) => {
      const body = { bankId: v.bankId, transactionDate: v.transactionDate, amount: Number(v.amount), reference: v.reference || undefined, description: v.description, counterpartyType: v.counterpartyType, vatCode: v.vatCode, ...(v.counterpartyType === 'GL' ? { glAccountId: v.glAccountId } : v.counterpartyType === 'CUSTOMER' ? { customerId: v.customerId } : { vendorId: v.vendorId }) };
      const r = await AL.post(`/cashbook/${receipt ? 'receipts' : 'payments'}`, body);
      const t = r && (r.transaction || r);
      return t && t.status === 'PENDING' ? 'Saved; allocate it to the invoices it settles to post it.' : 'Posted to the ledger.';
    },
    after: () => AL.cashReload(),
  });
});
AL.actions['cash-transfer'] = () => {
  const banks = (AL.cache['cash-pos'].data || []).map((b) => b.bank);
  AL.form({
    title: 'Transfer between accounts', submitLabel: 'Post transfer', doneTitle: 'Transfer posted',
    fields: [
      { k: 'fromBankId', label: 'From', type: 'select', required: true, options: banks.map((b) => ({ value: b.id, label: `${b.name} (${b.currency || ''})` })) },
      { k: 'toBankId', label: 'To', type: 'select', required: true, options: banks.map((b) => ({ value: b.id, label: `${b.name} (${b.currency || ''})` })) },
      { k: 'transferDate', label: 'Date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'reference', label: 'Reference' },
      { k: 'description', label: 'Description', required: true, wide: true },
    ],
    initial: { transferDate: AL.stiToday() },
    validate: (v) => {
      if (v.fromBankId === v.toBankId) return 'Choose two different accounts.';
      const a = banks.find((b) => b.id === v.fromBankId), b = banks.find((x) => x.id === v.toBankId);
      if (a && b && a.currency !== b.currency) return 'Both accounts must be in the same currency; a currency exchange is booked as a payment and a receipt at the day\'s rate.';
      return Number(v.amount) > 0 ? '' : 'The amount must be more than zero.';
    },
    onSubmit: async (v) => { await AL.post('/cashbook/transfers', { ...v, amount: Number(v.amount) }); return 'Both accounts are updated.'; },
    after: () => AL.cashReload(),
  });
};
