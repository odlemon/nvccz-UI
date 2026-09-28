/* Payment Runs: /accounting/payment-runs — supplier bills paid together (SRD ACC-AP-11). A preparer picks approved,
 * unpaid bills payable from one bank account (the others show why they cannot be paid yet) and submits the run; someone
 * else approves it; the bank file goes to the bank; once paid, the run is settled with the bank's confirmation and each
 * bill is paid (journal, cashbook line, procurement shows it paid). A bill that fails keeps its reason and can be tried
 * again. Data: /accounting/payment-runs. */
AL.ui.pr = AL.ui.pr || { open: '' };
AL.prLoad = () => AL.res('pr', () => AL.get('/accounting/payment-runs'));
AL.prReload = () => { Object.keys(AL.cache).filter((k) => k === 'pr' || k.startsWith('pr:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.PR_STATUS = { DRAFT: ['Draft', 'info'], SUBMITTED: ['Waiting for approval', 'warn'], APPROVED: ['Approved: pay at the bank', 'warn'], SETTLING: ['Settling', 'warn'], SETTLED: ['Paid', 'ok'], PARTLY_SETTLED: ['Partly paid', 'bad'], CANCELLED: ['Cancelled', 'info'] };

AL.page('paymentruns', () => {
  AL.meLoad();
  const canPrep = AL.can('manage_accounting'), canApprove = AL.can('manage_ledger');
  const e = AL.prLoad();
  const head = AL.head('Daily accounting', 'Payment Runs', '', [AL.btn('Payables', 'pr-payables'), canPrep ? AL.btn('New payment run', 'pr-new', 'primary') : ''].join(''));
  const g = AL.gate(e, { key: 'pr', errorTitle: 'Payment runs could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const runs = e.data || [], me = AL.me().id;
  const kpis = AL.kpis([
    ['Waiting for approval', String(runs.filter((r) => r.status === 'SUBMITTED').length), AL.money(runs.filter((r) => r.status === 'SUBMITTED').reduce((s, r) => s + r.total, 0)), runs.some((r) => r.status === 'SUBMITTED') ? '#f79009' : undefined],
    ['Approved, to pay at the bank', String(runs.filter((r) => r.status === 'APPROVED').length), AL.money(runs.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.total, 0))],
    ['With failed bills', String(runs.filter((r) => r.status === 'PARTLY_SETTLED').length), 'Settle again once corrected', runs.some((r) => r.status === 'PARTLY_SETTLED') ? '#d92d20' : undefined],
    ['Paid this month', AL.money(runs.filter((r) => r.status === 'SETTLED' && String(r.settledAt || '').slice(0, 7) === AL.stiToday().slice(0, 7)).reduce((s, r) => s + r.total, 0)), `${AL.plural(runs.filter((r) => r.status === 'SETTLED').length, 'run')} paid in all`],
  ]);
  const rows = runs.map((r) => {
    const st = AL.PR_STATUS[r.status] || [r.status, 'info'];
    const acts = [AL.btn('Bills', 'pr-open', 'small', `data-id="${ae(r.id)}"`)];
    if (canPrep && r.status === 'DRAFT' && r.preparedById === me) acts.push(AL.btn('Submit', 'pr-submit', 'small primary', `data-id="${ae(r.id)}"`));
    if (canApprove && r.status === 'SUBMITTED' && r.preparedById !== me) acts.push(AL.btn('Approve', 'pr-approve', 'small primary', `data-id="${ae(r.id)}"`));
    if (['APPROVED', 'SETTLED', 'PARTLY_SETTLED'].includes(r.status)) acts.push(AL.btn('Bank file', 'pr-file', 'small', `data-id="${ae(r.id)}" data-ref="${ae(r.reference)}"`));
    if (canApprove && ['APPROVED', 'PARTLY_SETTLED'].includes(r.status)) acts.push(AL.btn(r.status === 'PARTLY_SETTLED' ? 'Settle again' : 'Settle', 'pr-settle', 'small primary', `data-id="${ae(r.id)}"`));
    if (canPrep && ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(r.status)) acts.push(AL.btn('Cancel', 'pr-cancel', 'small danger', `data-id="${ae(r.id)}"`));
    return `<tr>
      <td><strong>${ae(r.reference)}</strong><span class="v28-sub">${ae(r.bank)} · pay on ${ae(AL.date(r.paymentDate))}</span></td>
      <td class="num">${ae(AL.money(r.total, r.currency))}<span class="v28-sub">${r.bills} bill${r.bills === 1 ? '' : 's'}${r.paid ? `, ${r.paid} paid` : ''}</span></td>
      <td>${ae(r.preparedBy || '—')}${r.approvedBy ? `<span class="v28-sub">approved by ${ae(r.approvedBy)}</span>` : ''}</td>
      <td>${AL.status(st[0], st[1])}${r.cancelReason ? `<span class="v28-sub">${ae(r.cancelReason)}</span>` : ''}${r.bankReference ? `<span class="v28-sub">Bank ref ${ae(r.bankReference)}</span>` : ''}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Runs', '', rows ? AL.table(['Run', 'Amount', 'Prepared by', 'Status', ''], rows, '1060px') : AL.empty('No payment runs yet.'))}</div>`;
});
AL.actions['pr-payables'] = () => AL.go('payables');
AL.prFind = (id) => ((AL.cache.pr && AL.cache.pr.data) || []).find((r) => r.id === id);
AL.actions['pr-new'] = (el) => AL.busy(el, async () => {
  const banks = (await AL.get('/cashbook/banks').catch(() => [])).filter((b) => b.isActive !== false);
  if (!banks.length) throw new Error('No bank account to pay from.');
  const bankId = AL.ui.pr.bank || banks[0].id;
  const c = await AL.get(`/accounting/payment-runs/candidates?bankId=${encodeURIComponent(bankId)}`);
  const bills = (c.bills || []).slice().sort((x, y) => (y.payable ? 1 : 0) - (x.payable ? 1 : 0));
  const row = (b) => `<tr class="${b.payable ? '' : 'al-muted'}"><td>${b.payable ? `<input type="checkbox" data-pr-bill="${ae(b.id)}" data-amount="${b.amount}">` : ''}</td><td><strong>${ae(b.invoiceNumber)}</strong><span class="v28-sub">${ae(b.vendor || '')}</span></td><td>${ae(AL.date(b.dueDate))}</td><td class="num">${ae(AL.money(b.amount, b.currency || c.bank.currency))}</td><td class="al-wrap">${b.payable ? '' : `<span class="v28-sub">${ae(b.reason)}</span>`}</td></tr>`;
  AL.form({ title: 'New payment run', sub: `${bills.filter((b) => b.payable).length} of ${bills.length} approved bills can be paid from ${c.bank.name} now`, wide: true, submitLabel: 'Create run', doneTitle: 'Payment run created', fields: [
    { k: 'bankId', label: 'Pay from', type: 'select', required: true, blank: false, options: banks.map((b) => ({ value: b.id, label: `${b.name}${b.currency ? ` (${b.currency.code})` : ''}` })) },
    { k: 'paymentDate', label: 'Payment date', type: 'date', required: true },
    { k: 'notes', label: 'Note', wide: true },
  ], initial: { bankId, paymentDate: AL.stiToday() },
  extra: `<div class="al-wide"><div class="v28-tablewrap" style="max-height:360px;overflow:auto">${AL.table(['', 'Bill', 'Due', 'Amount', ''], bills.map(row).join(''), '760px')}</div><p class="v28-sub" id="alPrTotal">Nothing chosen yet.</p></div>`,
  validate: () => (document.querySelectorAll('[data-pr-bill]:checked').length ? '' : 'Choose at least one bill.'),
  onSubmit: async (v) => { const ids = [...document.querySelectorAll('[data-pr-bill]:checked')].map((x) => x.dataset.prBill); const r = await AL.post('/accounting/payment-runs', { bankId: v.bankId, paymentDate: v.paymentDate, notes: v.notes || undefined, invoiceIds: ids }); return `${r.reference}: ${r.lines.length} bill${r.lines.length === 1 ? '' : 's'}, ${AL.money(r.total, r.currency)}. Submit it for approval.`; },
  after: () => AL.prReload() });
  const ov = document.getElementById('alOverlay');
  if (ov) {
    ov.addEventListener('change', (ev) => {
      if (ev.target.name === 'bankId' && ev.target.value !== bankId) { AL.ui.pr.bank = ev.target.value; AL.actions['pr-new'](el); return; }
      if (!ev.target.dataset || !ev.target.dataset.prBill) return;
      const chosen = [...ov.querySelectorAll('[data-pr-bill]:checked')];
      const t = document.getElementById('alPrTotal'); if (t) t.textContent = chosen.length ? `${chosen.length} bill${chosen.length === 1 ? '' : 's'} · ${AL.money(chosen.reduce((s, x) => s + Number(x.dataset.amount), 0), c.bank.currency)}` : 'Nothing chosen yet.';
    });
  }
});
AL.actions['pr-open'] = (el) => AL.busy(el, async () => {
  const r = await AL.get(`/accounting/payment-runs/${encodeURIComponent(el.dataset.id)}`);
  const LS = { INCLUDED: ['To pay', 'info'], PAID: ['Paid', 'ok'], FAILED: ['Failed', 'bad'] };
  const rows = r.lines.map((l) => `<tr><td><strong>${ae(l.invoiceNumber || '')}</strong><span class="v28-sub">${ae(l.vendor || '')}</span></td><td>${ae(AL.date(l.dueDate))}</td><td class="num">${ae(AL.money(l.amount, r.currency))}</td><td>${AL.status((LS[l.status] || [l.status])[0], (LS[l.status] || [0, 'info'])[1])}${l.error ? `<span class="v28-sub al-bad">${ae(l.error)}</span>` : ''}${l.journal ? `<span class="v28-sub">${ae(l.journal)}</span>` : ''}</td></tr>`).join('');
  AL.form({ title: `${r.reference} · ${AL.money(r.total, r.currency)}`, sub: `${r.bank} · pay on ${AL.date(r.paymentDate)}${r.notes ? ` · ${r.notes}` : ''}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${AL.table(['Bill', 'Due', 'Amount', 'Status'], rows, '720px')}</div>`, onSubmit: async () => false });
});
AL.actions['pr-submit'] = (el) => AL.busy(el, async () => { await AL.post(`/accounting/payment-runs/${encodeURIComponent(el.dataset.id)}/submit`, {}); AL.prReload(); }, ['Submitted', 'An approver other than you approves it.']);
AL.actions['pr-approve'] = (el) => { const r = AL.prFind(el.dataset.id); if (!r) return; AL.confirm({ title: `Approve ${r.reference}`, confirmLabel: 'Approve', doneTitle: 'Approved', body: `${r.bills} bill${r.bills === 1 ? '' : 's'}, ${AL.money(r.total, r.currency)} from ${r.bank} on ${AL.date(r.paymentDate)}. The bills are checked again now.`, onConfirm: async () => { await AL.post(`/accounting/payment-runs/${encodeURIComponent(r.id)}/approve`, {}); return 'Download the bank file and pay at the bank, then settle the run.'; }, after: () => AL.prReload() }); };
AL.actions['pr-cancel'] = (el) => { const r = AL.prFind(el.dataset.id); if (!r) return; AL.confirm({ title: `Cancel ${r.reference}`, danger: true, confirmLabel: 'Cancel run', doneTitle: 'Cancelled', reason: 'Why it is cancelled', body: 'Its bills go back to the payment queue.', onConfirm: async (v) => { await AL.post(`/accounting/payment-runs/${encodeURIComponent(r.id)}/cancel`, { reason: v.reason }); return ''; }, after: () => AL.prReload() }); };
AL.actions['pr-file'] = (el) => AL.busy(el, async () => { const t = await AL.getText(`/accounting/payment-runs/${encodeURIComponent(el.dataset.id)}/bank-file`); AL.saveText(`﻿${t}`, `${el.dataset.ref}.csv`); }, ['Bank file saved', 'One line per bill, to each supplier’s bank account on record.']);
AL.actions['pr-settle'] = (el) => {
  const r = AL.prFind(el.dataset.id); if (!r) return;
  AL.form({ title: `Settle ${r.reference}`, sub: `${AL.money(r.total, r.currency)} paid from ${r.bank}`, submitLabel: 'Settle', doneTitle: 'Run settled', fields: [{ k: 'bankReference', label: 'Bank reference', required: true }],
    extra: '<label class="v28-field al-wide"><span>Bank confirmation (PDF or image) *</span><input class="v28-input" type="file" id="alPrProof" accept=".pdf,.png,.jpg,.jpeg,.webp"></label>',
    validate: () => { const f = document.getElementById('alPrProof'); return f && f.files && f.files[0] ? '' : 'Attach the bank’s confirmation of the payments.'; },
    onSubmit: async (v) => { const fd = new FormData(); fd.append('proofOfPayment', document.getElementById('alPrProof').files[0]); fd.append('bankReference', v.bankReference); const out = AL.unwrap(await AL.http().form(`/accounting/payment-runs/${encodeURIComponent(r.id)}/settle`, fd)); const failed = (out.lines || []).filter((l) => l.status === 'FAILED'); return failed.length ? `${out.lines.length - failed.length} paid; ${failed.length} failed and can be settled again once corrected.` : `All ${out.lines.length} bills paid; each is in the ledger and the cashbook.`; },
    after: () => AL.prReload() });
};
// the Payables page (scripts/accounting-v52-payables-live.inc.js) links here
AL.actions['pr-runs'] = () => AL.go('paymentruns');
