/* Employee Claims: /accounting/claims — what staff spent for the business and are owed back (SRD ACC-EXP-03…07).
 * Everyone: their own claims — itemised with receipts, submitted, corrected when returned, withdrawn. Then, never by the
 * claimant: the line manager approves; a finance reviewer checks the receipts and assigns the expense accounts; a
 * finance manager (not the reviewer) approves it — which posts it to the ledger as owed to the employee (with a note
 * when it breaks the policy) — or rejects it, and pays it from a bank account. Each step can return it with what to
 * correct. Roles come from the claims API (staff without Accounting rights use this page too). Data: /accounting/claims. */
AL.ui.clm = AL.ui.clm || { tab: '', status: '' };
AL.clmOpts = () => AL.res('clm-opts', () => AL.get('/accounting/claims/options'));
// the lists; the options (the viewer's roles, categories, banks) stay
AL.clmReload = () => { Object.keys(AL.cache).filter((k) => k.startsWith('clm-') && k !== 'clm-opts').forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.CLM_STATUS = {
  DRAFT: ['Draft', 'info'], RETURNED: ['Returned for correction', 'bad'], SUBMITTED: ['With the line manager', 'warn'], MANAGER_APPROVED: ['With finance review', 'warn'],
  REVIEWED: ['Waiting for finance approval', 'warn'], APPROVED: ['Approved: to be paid', 'ok'], REIMBURSED: ['Paid', 'ok'], REJECTED: ['Rejected', 'bad'], WITHDRAWN: ['Withdrawn', 'info'],
};

AL.page('claims', () => {
  const o = AL.clmOpts();
  const head = AL.head('Spend', 'Employee Claims', '', [AL.can('view_accounting', 'manage_accounting', 'manage_ledger') ? AL.btn('Expenses', 'clm-expenses') : '', AL.btn('New claim', 'clm-new', 'primary')].join(''));
  const g = AL.gate(o, { key: 'clm-opts', errorTitle: 'Claims could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const roles = o.data.roles || {}, approver = roles.lineManager || roles.reviewer || roles.approver;
  const u = AL.ui.clm;
  if (!u.tab || (u.tab === 'waiting' && !approver) || (u.tab === 'all' && !roles.register)) u.tab = approver ? 'waiting' : 'mine';
  const mine = AL.res('clm-mine', () => AL.get('/accounting/claims?scope=mine'));
  const waiting = approver ? AL.res('clm-waiting', () => AL.get('/accounting/claims?scope=waiting')) : null;
  const all = u.tab === 'all' ? AL.res('clm-all', () => AL.get('/accounting/claims?scope=all')) : null;
  const g2 = AL.gate(mine, { key: 'clm-mine' }) || (waiting && AL.gate(waiting, { key: 'clm-waiting' })) || (all && AL.gate(all, { key: 'clm-all' }));
  if (g2) return `<div class="v28-page">${head}${g2}</div>`;
  const my = mine.data || [], wait = waiting ? waiting.data || [] : [];
  const sum = (xs) => xs.reduce((s, c) => s + c.total, 0);
  const cur = (xs) => (xs[0] && xs[0].currency) || 'USD';
  const open = my.filter((c) => ['SUBMITTED', 'MANAGER_APPROVED', 'REVIEWED'].includes(c.status)), owed = my.filter((c) => c.status === 'APPROVED'), back = my.filter((c) => ['DRAFT', 'RETURNED'].includes(c.status));
  const toPay = wait.filter((c) => c.status === 'APPROVED');
  const kpis = AL.kpis([
    ['Your claims in progress', String(open.length), AL.money(sum(open), cur(open))],
    ['Approved, to be paid to you', String(owed.length), AL.money(sum(owed), cur(owed)), owed.length ? '#12b76a' : undefined],
    ['With you to finish', String(back.length), back.some((c) => c.status === 'RETURNED') ? 'Returned for correction' : 'Drafts', back.some((c) => c.status === 'RETURNED') ? '#d92d20' : undefined],
    ...(approver ? [['Waiting for you', String(wait.length - toPay.length), toPay.length ? `${AL.plural(toPay.length, 'claim')} to pay` : AL.money(sum(wait), cur(wait)), wait.length ? '#f79009' : '#12b76a']] : []),
  ]);
  const tabs = `<div class="v28-tabbar">${[...(approver ? [['waiting', `Waiting for you (${wait.length})`]] : []), ['mine', 'My claims'], ...(roles.register ? [['all', 'All claims']] : [])].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="clm-tab" data-t="${id}">${ae(l)}</button>`).join('')}</div>`;
  const rows = (list, showWho) => list.map((c) => {
    const st = AL.CLM_STATUS[c.status] || [c.status, 'info'];
    const note = c.status === 'RETURNED' || c.status === 'REJECTED' ? c.returnReason : c.exceptions && c.exceptions.length && !['REIMBURSED', 'WITHDRAWN', 'REJECTED'].includes(c.status) ? `${AL.plural(c.exceptions.length, 'policy exception')}` : '';
    return `<tr>
      <td><strong>${ae(c.reference)}</strong><span class="v28-sub">${ae(c.title)}</span></td>
      ${showWho ? `<td>${ae(c.claimant || '—')}</td>` : ''}
      <td class="num">${ae(AL.money(c.total, c.currency))}</td>
      <td>${ae(c.submittedAt ? AL.date(c.submittedAt) : '—')}</td>
      <td>${AL.status(st[0], st[1])}${note ? `<span class="v28-sub al-wrap">${ae(note)}</span>` : ''}</td>
      <td class="al-actions">${AL.btn('Open', 'clm-open', 'small primary', `data-id="${ae(c.id)}"`)}</td>
    </tr>`;
  }).join('');
  let body;
  if (u.tab === 'waiting') body = wait.length ? AL.table(['Claim', 'Employee', 'Amount', 'Submitted', 'Status', ''], rows(wait, true), '980px') : AL.empty('No claims are waiting for you.');
  else if (u.tab === 'all') {
    const list = (all.data || []).filter((c) => !u.status || c.status === u.status);
    body = `<div class="al-filters"><label class="v28-field"><span>Status</span><select class="v28-select" data-clm-f="status"><option value="">All</option>${Object.entries(AL.CLM_STATUS).filter(([k]) => k !== 'DRAFT').map(([k, v]) => `<option value="${k}"${u.status === k ? ' selected' : ''}>${ae(v[0])}</option>`).join('')}</select></label></div>${list.length ? AL.table(['Claim', 'Employee', 'Amount', 'Submitted', 'Status', ''], rows(list, true), '980px') : AL.empty('No claims.')}`;
  } else body = my.length ? AL.table(['Claim', 'Amount', 'Submitted', 'Status', ''], rows(my, false), '860px') : AL.empty('You have no claims yet.');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Claims', '', `${tabs}${body}`)}</div>`;
});
AL.wire.claims = () => { document.querySelectorAll('[data-clm-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.clm[el.dataset.clmF] = el.value; AL.redraw(); }); }); };
AL.actions['clm-tab'] = (el) => { AL.ui.clm.tab = el.dataset.t; AL.redraw(); };
AL.actions['clm-expenses'] = () => AL.go('expenses');
AL.clmData = () => (AL.cache['clm-opts'] && AL.cache['clm-opts'].data) || { categories: [], currencies: [], projects: [], accounts: [], banks: [], roles: {}, policy: {} };
AL.clmFields = () => {
  const d = AL.clmData();
  return [
    { k: 'title', label: 'What was it for', required: true, wide: true },
    { k: 'purpose', label: 'Business purpose', type: 'textarea', wide: true },
    { k: 'tripFrom', label: 'From', type: 'date' }, { k: 'tripTo', label: 'To', type: 'date' },
    { k: 'currency', label: 'Currency', type: 'select', blank: false, options: (d.currencies || []).map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` })) },
    { k: 'projectId', label: 'Project', type: 'select', options: (d.projects || []).map((p) => ({ value: p.id, label: p.name })) },
  ];
};
AL.clmBody = (v) => ({ title: v.title, purpose: v.purpose || null, tripFrom: v.tripFrom || null, tripTo: v.tripTo || null, currency: v.currency, projectId: v.projectId || null });
AL.actions['clm-new'] = () => AL.form({ title: 'New claim', submitLabel: 'Create', doneTitle: 'Claim created', fields: AL.clmFields(), initial: { currency: 'USD' },
  onSubmit: async (v) => { const c = await AL.post('/accounting/claims', AL.clmBody(v)); AL.ui.clm.tab = 'mine'; AL.ui.clm.reopen = c.id; return `${c.reference}: add what you spent, with receipts, then submit it.`; },
  after: () => { AL.clmReload(); const id = AL.ui.clm.reopen; AL.ui.clm.reopen = ''; if (id) AL.clmShow(id); } });

/** The claim, with what the viewer can do at its current step. */
AL.clmShow = async (id) => {
  const c = await AL.get(`/accounting/claims/${encodeURIComponent(id)}`);
  if (!(AL.cache['clm-opts'] && AL.cache['clm-opts'].data)) AL.cache['clm-opts'] = { state: 'ok', data: await AL.get('/accounting/claims/options') };
  const d = AL.clmData(), roles = d.roles || {}, me = d.me || '';
  const mineEditable = c.claimantId === me && ['DRAFT', 'RETURNED'].includes(c.status);
  const reviewing = c.status === 'MANAGER_APPROVED' && roles.reviewer && c.claimantId !== me;
  const accOpts = (sel) => `<option value="">Category's account</option>${(d.accounts || []).map((a) => `<option value="${ae(a.id)}"${sel === a.id ? ' selected' : ''}>${ae(`${a.accountNo} ${a.accountName}`)}</option>`).join('')}`;
  const lineRows = c.lines.map((l) => `<tr>
    <td>${ae(AL.date(l.date))}</td>
    <td><strong>${ae(l.description)}</strong><span class="v28-sub">${ae(l.category || 'No category')}</span></td>
    <td class="num">${ae(AL.money(l.amount, c.currency))}${l.vat ? `<span class="v28-sub">VAT ${ae(AL.money(l.vat, c.currency))}</span>` : ''}</td>
    <td>${l.receiptUrl ? `<a href="${ae(l.receiptUrl)}" target="_blank" rel="noopener">${ae(l.receiptName || 'Receipt')}</a>` : '<span class="v28-sub">None</span>'}</td>
    <td>${reviewing ? `<select class="v28-select" data-clm-acc="${ae(l.id)}">${accOpts(l.accountId)}</select>` : ae(l.account || '—')}</td>
    <td class="al-actions">${mineEditable ? [l.receiptUrl ? '' : AL.btn('Receipt', 'clm-receipt', 'small', `data-id="${ae(c.id)}" data-line="${ae(l.id)}"`), AL.btn('Remove', 'clm-rm', 'small danger', `data-id="${ae(c.id)}" data-line="${ae(l.id)}"`)].join('') : ''}</td>
  </tr>`).join('');
  const steps = [
    c.submittedAt ? `Submitted ${AL.date(c.submittedAt)}` : '',
    c.manager ? `Line manager: ${c.manager}, ${AL.date(c.managerAt)}` : '',
    c.reviewer ? `Finance review: ${c.reviewer}, ${AL.date(c.reviewerAt)}` : '',
    c.approver ? `Approved: ${c.approver}, ${AL.date(c.approverAt)}${c.journal ? ` (journal ${c.journal.referenceNumber})` : ''}` : '',
    c.reimbursedAt ? `Paid: ${c.reimbursedBy}, ${AL.date(c.reimbursedAt)}${c.reimbursementJournal ? ` (journal ${c.reimbursementJournal.referenceNumber})` : ''}` : '',
  ].filter(Boolean);
  const acts = [];
  const b = (label, action, cls) => AL.btn(label, action, cls, `data-id="${ae(c.id)}"`);
  if (mineEditable) acts.push(b('Add item', 'clm-add', 'primary'), b('Details', 'clm-edit', ''), b('Submit', 'clm-submit', 'primary'));
  if (c.claimantId === me && ['DRAFT', 'RETURNED', 'SUBMITTED', 'MANAGER_APPROVED', 'REVIEWED'].includes(c.status)) acts.push(b('Withdraw', 'clm-withdraw', 'danger'));
  if (c.claimantId !== me) {
    if (c.status === 'SUBMITTED' && roles.lineManager) acts.push(b('Approve', 'clm-mgr', 'primary'), b('Return', 'clm-return', 'danger'));
    if (reviewing) acts.push(b('Reviewed', 'clm-review', 'primary'), b('Return', 'clm-return', 'danger'));
    if (c.status === 'REVIEWED' && roles.approver) acts.push(b('Approve for payment', 'clm-approve', 'primary'), b('Return', 'clm-return', 'danger'), b('Reject', 'clm-reject', 'danger'));
    if (c.status === 'APPROVED' && roles.approver) acts.push(b('Pay', 'clm-pay', 'primary'));
  }
  const st = AL.CLM_STATUS[c.status] || [c.status, 'info'];
  const exc = c.exceptions && c.exceptions.length ? `<div class="al-wide"><p><strong>Policy exceptions</strong></p><ul class="al-list">${c.exceptions.map((x) => `<li>${ae(x)}</li>`).join('')}</ul>${c.exceptionNote ? `<p class="v28-sub">Approved with the note: ${ae(c.exceptionNote)}</p>` : ''}</div>` : '';
  AL.clmOpen = c;
  AL.form({ title: `${c.reference} · ${AL.money(c.total, c.currency)}`, sub: [c.title, c.claimant].filter(Boolean).join(' · '), wide: true, viewOnly: true, submitLabel: 'Close', fields: [],
    extra: `<div class="al-wide">${AL.status(st[0], st[1])}${(c.status === 'RETURNED' || c.status === 'REJECTED') && c.returnReason ? `<p class="v28-sub al-bad">${ae(c.returnReason)}</p>` : ''}${c.purpose ? `<p class="v28-sub">${ae(c.purpose)}</p>` : ''}${c.tripFrom ? `<p class="v28-sub">${ae(AL.date(c.tripFrom))}${c.tripTo ? ` to ${ae(AL.date(c.tripTo))}` : ''}</p>` : ''}</div>
      <div class="al-wide">${c.lines.length ? AL.table(['Date', 'Item', 'Amount', 'Receipt', 'Expense account', ''], lineRows, '860px') : AL.empty('No items yet.')}</div>${exc}
      ${steps.length ? `<div class="al-wide"><ul class="al-list">${steps.map((s) => `<li>${ae(s)}</li>`).join('')}</ul></div>` : ''}
      ${acts.length ? `<div class="al-wide al-actions">${acts.join('')}</div>` : ''}`,
    onSubmit: async () => false });
};
AL.actions['clm-open'] = (el) => AL.busy(el, () => AL.clmShow(el.dataset.id));
/** After a step: refresh the lists and show the claim again (or close it when it has left the viewer's hands). */
AL.clmAfter = (id, reopen = true) => { AL.clmReload(); if (reopen) AL.clmShow(id).catch(() => null); };
AL.clmStep = (el, path, body, done, reopen = true) => AL.busy(el, async () => { await AL.post(`/accounting/claims/${encodeURIComponent(el.dataset.id)}/${path}`, body || {}); AL.close(); AL.clmAfter(el.dataset.id, reopen); }, done);
AL.actions['clm-edit'] = (el) => { const c = AL.clmOpen; if (!c) return; AL.form({ title: `Change ${c.reference}`, submitLabel: 'Save', doneTitle: 'Claim changed', fields: AL.clmFields(), initial: { title: c.title, purpose: c.purpose || '', tripFrom: c.tripFrom || '', tripTo: c.tripTo || '', currency: c.currency, projectId: c.projectId || '' }, onSubmit: async (v) => { await AL.patch(`/accounting/claims/${encodeURIComponent(c.id)}`, AL.clmBody(v)); return ''; }, after: () => AL.clmAfter(c.id) }); };
AL.clmReceiptField = (req) => `<label class="v28-field al-wide"><span>Receipt (PDF or image)${req ? ' *' : ''}</span><input class="v28-input" type="file" id="alClmReceipt" accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"></label>`;
AL.actions['clm-add'] = (el) => {
  const c = AL.clmOpen; if (!c) return;
  const d = AL.clmData(), limit = Number((d.policy || {}).receiptRequiredAbove || 0);
  AL.form({ title: `Add an item to ${c.reference}`, sub: limit ? `A receipt is needed for anything above ${AL.money(limit, c.currency)}.` : '', submitLabel: 'Add', doneTitle: 'Item added',
    fields: [
      { k: 'date', label: 'Date', type: 'date', required: true }, { k: 'categoryId', label: 'Category', type: 'select', options: (d.categories || []).map((x) => ({ value: x.id, label: x.name })) },
      { k: 'description', label: 'What it was', required: true, wide: true },
      { k: 'amount', label: `Amount (${c.currency})`, type: 'number', min: 0, step: '0.01', required: true }, { k: 'vat', label: 'VAT included', type: 'number', min: 0, step: '0.01' },
    ], initial: { date: AL.stiToday() }, extra: AL.clmReceiptField(false),
    validate: (v) => { const f = document.getElementById('alClmReceipt'); return Number(v.amount) > limit && limit > 0 && !(f && f.files && f.files[0]) ? `Attach the receipt: it is needed above ${AL.money(limit, c.currency)}.` : ''; },
    onSubmit: async (v) => { const fd = new FormData(); Object.entries(v).forEach(([k, x]) => { if (x !== '' && x != null) fd.append(k, x); }); const f = document.getElementById('alClmReceipt'); if (f && f.files && f.files[0]) fd.append('receipt', f.files[0]); AL.unwrap(await AL.http().form(`/accounting/claims/${encodeURIComponent(c.id)}/lines`, fd)); return ''; },
    after: () => AL.clmAfter(c.id) });
};
AL.actions['clm-receipt'] = (el) => AL.form({ title: 'Attach the receipt', submitLabel: 'Attach', doneTitle: 'Receipt attached', fields: [], extra: AL.clmReceiptField(true),
  validate: () => { const f = document.getElementById('alClmReceipt'); return f && f.files && f.files[0] ? '' : 'Choose the receipt.'; },
  onSubmit: async () => { const fd = new FormData(); fd.append('receipt', document.getElementById('alClmReceipt').files[0]); AL.unwrap(await AL.http().form(`/accounting/claims/${encodeURIComponent(el.dataset.id)}/lines/${encodeURIComponent(el.dataset.line)}/receipt`, fd)); return ''; },
  after: () => AL.clmAfter(el.dataset.id) });
AL.actions['clm-rm'] = (el) => AL.busy(el, async () => { await AL.del(`/accounting/claims/${encodeURIComponent(el.dataset.id)}/lines/${encodeURIComponent(el.dataset.line)}`); AL.close(); AL.clmAfter(el.dataset.id); }, ['Item removed', '']);
AL.actions['clm-submit'] = (el) => AL.clmStep(el, 'submit', {}, ['Submitted', 'It goes to your line manager first.']);
AL.actions['clm-withdraw'] = (el) => { const c = AL.clmOpen; if (!c) return; AL.confirm({ title: `Withdraw ${c.reference}`, danger: true, confirmLabel: 'Withdraw', doneTitle: 'Withdrawn', body: 'It will not be paid; start a new claim if you need to claim again.', onConfirm: async () => { await AL.post(`/accounting/claims/${encodeURIComponent(c.id)}/withdraw`, {}); return ''; }, after: () => AL.clmReload() }); };
AL.actions['clm-mgr'] = (el) => AL.clmStep(el, 'manager-approve', {}, ['Approved', 'It goes to finance for review.'], false);
AL.actions['clm-review'] = (el) => { const accounts = {}; document.querySelectorAll('[data-clm-acc]').forEach((s) => { if (s.value) accounts[s.dataset.clmAcc] = s.value; }); return AL.clmStep(el, 'review', { accounts }, ['Reviewed', 'A finance manager approves it for payment.'], false); };
AL.actions['clm-return'] = (el) => { const c = AL.clmOpen; if (!c) return; AL.confirm({ title: `Return ${c.reference}`, danger: true, confirmLabel: 'Return', doneTitle: 'Returned', reason: 'What needs correcting', body: `It goes back to ${c.claimant || 'the employee'} to correct and submit again.`, onConfirm: async (v) => { await AL.post(`/accounting/claims/${encodeURIComponent(c.id)}/return`, { reason: v.reason }); return ''; }, after: () => AL.clmReload() }); };
AL.actions['clm-reject'] = (el) => { const c = AL.clmOpen; if (!c) return; AL.confirm({ title: `Reject ${c.reference}`, danger: true, confirmLabel: 'Reject', doneTitle: 'Rejected', reason: 'Why it is rejected', body: 'It will not be paid.', onConfirm: async (v) => { await AL.post(`/accounting/claims/${encodeURIComponent(c.id)}/reject`, { reason: v.reason }); return ''; }, after: () => AL.clmReload() }); };
AL.actions['clm-approve'] = (el) => {
  const c = AL.clmOpen; if (!c) return;
  const exc = c.exceptions || [];
  AL.form({ title: `Approve ${c.reference} for payment`, sub: `${AL.money(c.total, c.currency)} owed to ${c.claimant || 'the employee'}; posted to the ledger now.`, submitLabel: exc.length ? 'Approve with exception' : 'Approve', doneTitle: 'Approved',
    fields: exc.length ? [{ k: 'exceptionNote', label: 'Why it is approved despite the policy', type: 'textarea', required: true, wide: true }] : [],
    extra: exc.length ? `<div class="al-wide"><ul class="al-list">${exc.map((x) => `<li>${ae(x)}</li>`).join('')}</ul></div>` : '',
    onSubmit: async (v) => { const r = await AL.post(`/accounting/claims/${encodeURIComponent(c.id)}/approve`, { exceptionNote: v.exceptionNote || undefined }); return r.journal ? `Journal ${r.journal.referenceNumber} posted.` : ''; },
    after: () => AL.clmReload() });
};
AL.actions['clm-pay'] = (el) => {
  const c = AL.clmOpen; if (!c) return;
  const banks = (AL.clmData().banks || []).filter((x) => x.currency === c.currency);
  if (!banks.length) { AL.toast('Not done', `No active ${c.currency} bank account to pay from.`, 'bad'); return; }
  AL.form({ title: `Pay ${c.reference}`, sub: `${AL.money(c.total, c.currency)} to ${c.claimant || 'the employee'}`, submitLabel: 'Pay', doneTitle: 'Claim paid',
    fields: [
      { k: 'bankId', label: 'Pay from', type: 'select', required: true, blank: false, options: banks.map((x) => ({ value: x.id, label: `${x.name} · ${x.accountNumber}` })) },
      { k: 'date', label: 'Payment date', type: 'date', required: true }, { k: 'bankReference', label: 'Bank reference' },
    ], initial: { date: AL.stiToday() },
    onSubmit: async (v) => { const r = await AL.post(`/accounting/claims/${encodeURIComponent(c.id)}/reimburse`, v); return r.reimbursementJournal ? `Journal ${r.reimbursementJournal.referenceNumber} posted; the payment is in the cashbook.` : ''; },
    after: () => AL.clmReload() });
};
AL.navAdd('Daily accounting', ['claims', 'Employee Claims', 'expense'], 'expenses');
