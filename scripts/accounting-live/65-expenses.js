/* Expenses: /accounting/expenses — expenses recorded against a supplier and category, paid from a named bank, in cash or
 * on credit; each is submitted with a draft journal and approved (posted) or returned (rejected) by an approver who did
 * not record it. Data: /accounting/expenses, /accounting/expense-categories, /cashbook/vendors, /cashbook/banks,
 * /accounting/journal-entries/:id/post|void. */
AL.ui.exp = AL.ui.exp || { tab: 'SUBMITTED' };
AL.expLoad = () => AL.res('exp', async () => {
  const [list, cats] = await Promise.all([AL.get('/accounting/expenses?limit=500'), AL.get('/accounting/expense-categories').catch(() => [])]);
  return { expenses: Array.isArray(list) ? list : (list && (list.expenses || list.items)) || [], categories: Array.isArray(cats) ? cats : [] };
});
AL.expReload = () => { delete AL.cache.exp; AL.redraw(); };
AL.expStatus = { SUBMITTED: ['Awaiting approval', 'warn'], POSTED: ['Awaiting approval', 'warn'], DRAFT: ['Draft', 'warn'], APPROVED: ['Approved', 'ok'], REJECTED: ['Returned', 'bad'], VOIDED: ['Voided', 'bad'] };
AL.expPay = { BANK: 'Bank', CASH: 'Petty cash', CREDIT: 'On credit (supplier)' };

AL.actions['clm-go'] = () => AL.go('claims');
AL.page('expenses', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.expLoad();
  const head = AL.head('Spend', 'Expenses', 'An expense is approved by someone other than the person who recorded it; approval posts it to the ledger.', [AL.btn('Employee claims', 'clm-go'), canPrepare ? AL.btn('Record expense', 'exp-new', 'primary') : ''].join(''));
  const g = AL.gate(e, { key: 'exp', errorTitle: 'Expenses could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { expenses } = e.data;
  const me = AL.me().id;
  const waiting = expenses.filter((x) => x.status === 'SUBMITTED' || x.status === 'POSTED');
  const month = AL.stiToday().slice(0, 7);
  const approvedMonth = expenses.filter((x) => x.status === 'APPROVED' && String(x.transactionDate).slice(0, 7) === month);
  const kpis = AL.kpis([
    ['Awaiting approval', String(waiting.length), AL.money(waiting.reduce((t, x) => t + Number(x.totalAmount || 0), 0)), waiting.length ? '#f79009' : '#12b76a'],
    ['Waiting on me', String(canPost ? waiting.filter((x) => x.createdById !== me).length : 0), canPost ? 'Recorded by others' : 'Approvers approve'],
    ['Approved this month', AL.money(approvedMonth.reduce((t, x) => t + Number(x.totalAmount || 0), 0)), AL.plural(approvedMonth.length, 'expense')],
    ['Returned', String(expenses.filter((x) => x.status === 'REJECTED').length), 'Not approved'],
  ]);
  const tab = AL.ui.exp.tab;
  const tabs = `<div class="v28-tabbar">${[['SUBMITTED', 'Awaiting approval'], ['APPROVED', 'Approved'], ['REJECTED', 'Returned'], ['ALL', 'All']].map(([id, label]) => `<button class="v28-tab ${tab === id ? 'active' : ''}" data-al="exp-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  const shown = expenses.filter((x) => tab === 'ALL' || (tab === 'SUBMITTED' ? (x.status === 'SUBMITTED' || x.status === 'POSTED') : tab === 'REJECTED' ? (x.status === 'REJECTED' || x.status === 'VOIDED') : x.status === tab));
  const rows = shown.map((x) => {
    const st = AL.expStatus[x.status] || [x.status, 'info'];
    const c = (x.currency && x.currency.code) || '';
    const own = x.createdById === me;
    const acts = [];
    if ((x.status === 'SUBMITTED' || x.status === 'POSTED') && canPost && !own && x.journalEntryId) acts.push(AL.btn('Approve', 'exp-approve', 'small primary', `data-id="${ae(x.id)}"`), AL.btn('Return', 'exp-return', 'small danger', `data-id="${ae(x.id)}"`));
    return `<tr>
      <td>${ae(AL.date(x.transactionDate))}</td>
      <td class="al-wrap"><strong>${ae(x.description)}</strong><span class="v28-sub">${ae([x.category && x.category.name, x.receiptNumber].filter(Boolean).join(' · '))}</span></td>
      <td>${ae((x.vendor && x.vendor.name) || '—')}</td>
      <td>${ae(AL.expPay[x.paymentMethod] || x.paymentMethod)}</td>
      <td>${ae(AL.money(x.totalAmount, c))}${Number(x.vatAmount) ? `<span class="v28-sub">VAT ${ae(AL.money(x.vatAmount, c))}</span>` : ''}</td>
      <td>${ae(AL.jeWho(x.createdBy))}${own ? '<span class="v28-sub">You</span>' : ''}</td>
      <td>${AL.status(st[0], st[1])}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Expenses', '', `${tabs}${rows ? AL.table(['Date', 'Expense', 'Supplier', 'Paid', 'Amount', 'Recorded by', 'Status', ''], rows, '1150px') : AL.empty(tab === 'SUBMITTED' ? 'Nothing is waiting for approval.' : 'None here.')}`)}</div>`;
});
AL.actions['exp-tab'] = (el) => { AL.ui.exp.tab = el.dataset.tab; AL.redraw(); };
AL.expFind = (id) => ((AL.cache.exp && AL.cache.exp.data && AL.cache.exp.data.expenses) || []).find((x) => x.id === id);
AL.actions['exp-approve'] = (el) => {
  const x = AL.expFind(el.dataset.id); if (!x) return;
  AL.confirm({ title: 'Approve this expense', confirmLabel: 'Approve and post', doneTitle: 'Expense approved', body: `${x.description}: ${AL.money(x.totalAmount, x.currency && x.currency.code)} is posted to the ledger${x.paymentMethod === 'BANK' ? ' and the payment to the cashbook' : ''}.`,
    onConfirm: async () => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(x.journalEntryId)}/post`, {}); return ''; }, after: () => AL.expReload() });
};
AL.actions['exp-return'] = (el) => {
  const x = AL.expFind(el.dataset.id); if (!x) return;
  AL.confirm({ title: 'Return this expense', danger: true, confirmLabel: 'Return', doneTitle: 'Expense returned', reason: 'What needs correcting',
    body: 'It is not posted; the person who recorded it records a corrected one.',
    onConfirm: async (v) => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(x.journalEntryId)}/void`, { reason: v.reason }); return ''; }, after: () => AL.expReload() });
};
AL.actions['exp-new'] = (el) => AL.busy(el, async () => {
  const [vend, cur, banks] = await Promise.all([AL.get('/cashbook/vendors').catch(() => []), AL.get('/accounting/currencies'), AL.get('/cashbook/banks').catch(() => [])]);
  const cats = (AL.cache.exp.data.categories || []).filter((c) => c.isActive !== false);
  const catOpts = cats.length ? cats.map((c) => c.name) : ['Salaries and Wages', 'Travel and Accommodation', 'Operations', 'Branding and Marketing', 'Office Equipment'];
  const base = (cur || []).find((c) => c.isDefault) || (cur || [])[0] || {};
  AL.form({
    title: 'Record an expense', sub: 'It waits for an approver, who posts it.', wide: true, submitLabel: 'Submit for approval', doneTitle: 'Expense submitted',
    fields: [
      { k: 'description', label: 'What for', required: true, wide: true },
      { k: 'vendorId', label: 'Supplier', type: 'select', required: true, options: (Array.isArray(vend) ? vend : []).map((v) => ({ value: v.id, label: v.name })) },
      { k: 'category', label: 'Category', type: 'select', required: true, options: catOpts },
      { k: 'transactionDate', label: 'Date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'currencyId', label: 'Currency', type: 'select', blank: false, required: true, options: (cur || []).filter((c) => c.isActive !== false).map((c) => ({ value: c.id, label: c.code })) },
      { k: 'amount', label: 'Amount before VAT', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'isTaxable', label: 'Includes claimable VAT', type: 'checkbox' },
      { k: 'receiptNumber', label: 'Receipt / invoice number' },
      { k: 'paymentMethod', label: 'Paid', type: 'select', blank: false, required: true, options: Object.entries(AL.expPay).map(([value, label]) => ({ value, label })) },
      { k: 'bankId', label: 'Bank account', type: 'select', options: (Array.isArray(banks) ? banks : []).filter((b) => b.isActive !== false).map((b) => ({ value: b.id, label: b.name })) },
    ],
    initial: { transactionDate: AL.stiToday(), currencyId: base.id, paymentMethod: 'BANK' },
    validate: (v) => (!(Number(v.amount) > 0) ? 'The amount must be more than zero.' : v.paymentMethod === 'BANK' && !v.bankId ? 'Choose the bank account it was paid from.' : ''),
    onSubmit: async (v) => { await AL.post('/accounting/expenses', { ...v, amount: Number(v.amount), ...(v.paymentMethod === 'BANK' ? {} : { bankId: undefined }) }); return 'An approver posts it.'; },
    after: () => { AL.ui.exp.tab = 'SUBMITTED'; AL.expReload(); },
  });
});
