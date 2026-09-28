/* Bank Reconciliation: /accounting/bank-reconciliation — per account: where it is reconciled to and what is outstanding;
 * the workbench: statement lines beside cashbook entries (SRD ACC-CB-33), import, auto-match, match by hand, book a bank
 * line the books do not have (charges, interest), tick, and finish only when every line is matched and the cleared
 * balance equals the statement (ACC-CB-25). Data: /cashbook/reconciliation/*. */
AL.ui.rec = AL.ui.rec || { session: '' };
AL.recStatus = () => AL.res('rec-status', () => AL.get('/cashbook/reconciliation/status'));
AL.recBench = (id) => AL.res(`rec:${id}`, () => AL.get(`/cashbook/reconciliation/sessions/${encodeURIComponent(id)}/workbench`));
AL.recReload = () => { Object.keys(AL.cache).filter((k) => k === 'rec-status' || k.startsWith('rec:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.recDay = (v) => String(v || '').slice(0, 10);

AL.page('reconciliation', () => {
  AL.meLoad();
  const canRec = AL.can('bank_reconciliation');
  if (AL.ui.rec.session) return AL.recWorkbench(AL.ui.rec.session, canRec);
  const e = AL.recStatus();
  const head = AL.head('Daily accounting', 'Bank Reconciliation', 'Each account is reconciled statement by statement; nothing can be booked on or before a reconciled date.');
  const g = AL.gate(e, { key: 'rec-status', errorTitle: 'Bank accounts could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const rows = e.data;
  const totalOpen = rows.reduce((t, r) => t + r.unreconciled.count, 0);
  const stale = rows.filter((r) => r.unreconciled.count && (!r.lastReconciled || (Date.now() - Date.parse(r.lastReconciled.statementDate)) > 35 * 86400000)).length;
  const kpis = AL.kpis([
    ['Bank accounts', String(rows.length), `${rows.filter((r) => r.lastReconciled).length} reconciled at least once`],
    ['Entries not reconciled', String(totalOpen), 'Posted cashbook lines', totalOpen ? '#f79009' : '#12b76a'],
    ['Behind', String(stale), 'Not reconciled in the last month', stale ? '#d92d20' : '#12b76a'],
    ['In progress', String(rows.filter((r) => r.draft).length), 'Reconciliations started'],
  ]);
  const tr = rows.map((r) => {
    const cur = (r.bank.currency && r.bank.currency.code) || '';
    const acts = r.draft ? AL.btn('Continue', 'rec-open', 'small primary', `data-id="${ae(r.draft.sessionId)}"`) : canRec ? AL.btn('Start reconciliation', 'rec-start', 'small', `data-bank="${ae(r.bank.id)}"`) : '';
    const last = r.lastReconciled ? AL.btn('Last reconciliation', 'rec-open', 'small', `data-id="${ae(r.lastReconciled.sessionId)}"`) : '';
    return `<tr>
      <td><strong>${ae(r.bank.name)}</strong><span class="v28-sub">${ae(r.bank.accountNumber || '')} · ${ae(cur)}</span></td>
      <td>${r.lastReconciled ? `${ae(AL.date(r.lastReconciled.statementDate))}<span class="v28-sub">Closing ${ae(AL.money(r.lastReconciled.closingBalance, cur))}</span>` : AL.status('Never', 'warn')}</td>
      <td>${ae(String(r.unreconciled.count))}${r.unreconciled.oldest ? `<span class="v28-sub">Oldest ${ae(AL.date(r.unreconciled.oldest))}</span>` : ''}</td>
      <td>${ae(AL.money(r.unreconciled.receipts, cur))}</td>
      <td>${ae(AL.money(r.unreconciled.payments, cur))}</td>
      <td>${r.draft ? `${AL.status('In progress', 'info')}<span class="v28-sub">Statement to ${ae(AL.date(r.draft.statementDate))}</span>` : '—'}</td>
      <td class="al-actions">${acts}${last}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Accounts', '', rows.length ? AL.table(['Account', 'Reconciled to', 'Not reconciled', 'Receipts outstanding', 'Payments outstanding', 'Current', ''], tr, '1080px') : AL.empty('No bank accounts are set up.'))}</div>`;
});

AL.recWorkbench = (id, canRec) => {
  const e = AL.recBench(id);
  const back = AL.btn('All accounts', 'rec-back');
  const g = AL.gate(e, { key: `rec:${id}`, errorTitle: 'This reconciliation could not be loaded' });
  if (g) return `<div class="v28-page">${AL.head('Bank reconciliation', 'Reconciliation', '', back)}${g}</div>`;
  const { session, bank, statement, items, entries, summary } = e.data;
  const cur = (bank && bank.currency && bank.currency.code) || '';
  const draft = session.status === 'DRAFT';
  const acts = [back];
  if (draft && canRec) {
    acts.push(AL.btn(statement ? 'Replace statement' : 'Import statement', 'rec-import'));
    if (statement) acts.push(AL.btn('Auto-match', 'rec-auto'));
    acts.push(AL.btn('Discard', 'rec-discard', 'danger'));
    acts.push(AL.btn('Finish reconciliation', 'rec-finish', 'primary', summary.canFinish ? '' : `disabled title="${ae(summary.blockers.join(' '))}"`));
  }
  if (!draft && AL.can('manage_ledger')) acts.push(AL.btn('Reopen', 'rec-reopen', 'danger'));
  const head = AL.head('Bank reconciliation', `${bank ? bank.name : ''}: statement to ${AL.date(session.statementDate)}`, draft ? `Opening ${AL.money(summary.openingBalance, cur)} · closing ${AL.money(summary.statementEndBalance, cur)}${statement && statement.lastAutoMatchAt ? ` · last auto-match ${AL.dateTime(statement.lastAutoMatchAt)}` : ''}` : `Finished ${AL.dateTime(session.finishedAt)}`, acts.join(''));
  const diff = summary.difference;
  const kpis = AL.kpis([
    ['Statement closing', AL.money(summary.statementEndBalance, cur), statement ? `${statement.fileName || 'Imported statement'}` : 'Entered'],
    ['Cleared balance', summary.clearedBalance == null ? '—' : AL.money(summary.clearedBalance, cur), 'Opening + ticked receipts − ticked payments'],
    ['Difference', diff == null ? '—' : AL.money(diff, cur), diff === 0 ? 'Balanced' : 'Statement − cleared', diff === 0 ? '#12b76a' : '#d92d20'],
    ['Statement lines matched', statement ? `${summary.matchedLines} of ${summary.statementLines}` : 'No statement', statement ? `${summary.statementLines ? Math.round((summary.matchedLines / summary.statementLines) * 100) : 0}%` : 'Tick entries by hand, or import', statement && summary.matchedLines === summary.statementLines ? '#12b76a' : '#f79009'],
    ['Outstanding receipts', AL.money(summary.outstandingReceipts, cur), 'In the books, not on the statement'],
    ['Outstanding payments', AL.money(summary.outstandingPayments, cur), 'In the books, not on the statement'],
  ]);
  const blockers = draft && summary.blockers.length ? `<div class="al-state al-note" role="status"><strong>Before it can be finished</strong><ul>${summary.blockers.map((b) => `<li>${ae(b)}</li>`).join('')}</ul></div>` : '';
  // statement side
  const stRows = items.map((i) => {
    const acts2 = [];
    if (draft && canRec) {
      if (i.matched) acts2.push(AL.btn('Unmatch', 'rec-unmatch', 'small', `data-item="${ae(i.id)}"`));
      else acts2.push(AL.btn('Match', 'rec-match', 'small', `data-item="${ae(i.id)}"`), AL.btn('Book to cashbook', 'rec-book', 'small', `data-item="${ae(i.id)}"`));
    }
    return `<tr class="${i.matched ? '' : 'al-exception'}">
      <td>${ae(AL.date(i.date))}</td>
      <td class="al-wrap">${ae(i.description)}<span class="v28-sub">${ae(i.reference || '')}</span></td>
      <td>${i.credit ? ae(AL.money(i.credit, cur)) : ''}</td>
      <td>${i.debit ? ae(AL.money(i.debit, cur)) : ''}</td>
      <td>${i.matched ? `${AL.status('Matched', 'ok')}<span class="v28-sub">${ae(i.entry ? i.entry.reference || i.entry.description : '')}</span>` : AL.status('Not in the books', 'warn')}</td>
      <td class="al-actions">${acts2.join('')}</td>
    </tr>`;
  }).join('');
  const stPanel = AL.panel('Bank statement', statement ? `${AL.plural(items.length, 'line')} · money in ${AL.money(statement.totalCredits, cur)} · money out ${AL.money(statement.totalDebits, cur)}` : '', statement ? AL.table(['Date', 'Description', 'Money in', 'Money out', 'Match', ''], stRows, '760px') : AL.empty(draft ? 'No statement imported. Import the bank\'s CSV statement to match it line by line, or tick the cashbook entries that appear on the paper statement.' : 'Reconciled by ticking entries (no statement imported).'));
  // book side
  const matchedIds = new Set(items.filter((i) => i.entry).map((i) => i.entry.id));
  const bkRows = entries.map((x) => `<tr class="${x.ticked ? 'al-ticked' : ''}">
      <td>${draft && canRec ? `<input type="checkbox" data-rec-tick="${ae(x.id)}"${x.ticked ? ' checked' : ''}${matchedIds.has(x.id) ? ' disabled title="Matched to a statement line; unmatch it there"' : ''} aria-label="Cleared">` : x.ticked ? '✓' : ''}</td>
      <td>${ae(AL.date(x.transactionDate))}</td>
      <td class="al-wrap"><strong>${ae(x.reference || '—')}</strong><span class="v28-sub">${ae(x.description || '')}${x.counterparty && x.counterparty !== 'N/A' ? ` · ${ae(x.counterparty)}` : ''}</span></td>
      <td>${x.received ? ae(AL.money(x.received, cur)) : ''}</td>
      <td>${x.paid ? ae(AL.money(x.paid, cur)) : ''}</td>
    </tr>`).join('');
  const bkPanel = AL.panel('Cashbook', draft ? `${AL.plural(entries.filter((x) => x.ticked).length, 'entry')} ticked of ${entries.length} not yet reconciled to ${AL.date(session.statementDate)}` : `${AL.plural(entries.length, 'entry')} cleared`, entries.length ? AL.table(['Cleared', 'Date', 'Reference', 'Received', 'Paid'], bkRows, '520px') : AL.empty('No cashbook entries to reconcile up to this date.'));
  return `<div class="v28-page">${head}${kpis}${blockers}<div class="al-split"><div>${stPanel}</div><div>${bkPanel}</div></div></div>`;
};
AL.wire.reconciliation = () => {
  document.querySelectorAll('[data-rec-tick]').forEach((cb) => {
    if (cb.dataset.wired) return; cb.dataset.wired = '1';
    cb.addEventListener('change', async () => {
      cb.disabled = true;
      try { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/tick`, { cashbookEntryId: cb.dataset.recTick, selected: cb.checked }); AL.run(`rec:${AL.ui.rec.session}`); }
      catch (err) { cb.checked = !cb.checked; AL.toast('Not changed', AL.msg(err), 'bad'); }
      finally { cb.disabled = false; }
    });
  });
};

AL.actions['rec-back'] = () => { AL.ui.rec.session = ''; AL.recReload(); };
AL.actions['rec-open'] = (el) => { AL.ui.rec.session = el.dataset.id; AL.redraw(); };
AL.actions['rec-start'] = (el) => {
  const r = (AL.cache['rec-status'].data || []).find((x) => x.bank.id === el.dataset.bank); if (!r) return;
  const cur = (r.bank.currency && r.bank.currency.code) || '';
  const prior = r.lastReconciled;
  AL.form({
    title: `Reconcile ${r.bank.name}`, sub: prior ? `Reconciled to ${AL.date(prior.statementDate)}, closing ${AL.money(prior.closingBalance, cur)}` : 'First reconciliation of this account', submitLabel: 'Start', doneTitle: 'Reconciliation started',
    fields: [
      { k: 'statementDate', label: 'Statement date (last day)', type: 'date', required: true, max: AL.stiToday(), min: prior ? AL.recDay(prior.statementDate) : undefined },
      { k: 'statementEndBalance', label: `Statement closing balance (${cur})`, type: 'number', step: '0.01', required: true },
      ...(prior ? [] : [{ k: 'openingBalance', label: `Statement opening balance (${cur})`, type: 'number', step: '0.01', required: true, hint: 'The balance the first statement starts from.' }]),
    ],
    initial: { statementDate: AL.stiToday() },
    validate: (v) => (prior && v.statementDate <= AL.recDay(prior.statementDate) ? 'The statement must end after the last reconciled date.' : ''),
    onSubmit: async (v) => {
      const s = await AL.post(`/cashbook/reconciliation/banks/${encodeURIComponent(r.bank.id)}/sessions`, { statementDate: v.statementDate, statementEndBalance: Number(v.statementEndBalance), ...(prior ? {} : { openingBalance: Number(v.openingBalance) }), reference: `REC-${v.statementDate}` });
      AL.ui.rec.session = s.id;
      return 'Import the statement or tick the entries on it.';
    },
    after: () => AL.recReload(),
  });
};
AL.actions['rec-import'] = () => {
  AL.form({
    title: 'Import bank statement', sub: 'CSV in the bank statement template: Transaction Date, Value Date, Reference, Description, Debit, Credit, Balance (with Opening and Closing Balance rows).', submitLabel: 'Import', doneTitle: 'Statement imported',
    fields: [{ k: 'file', label: 'Statement file (CSV)', type: 'file', required: true, wide: true }],
    extra: `<div class="al-wide">${AL.btn('Download the template', 'rec-template', 'small', 'type="button"')}</div>`,
    onSubmit: async () => {
      const inp = document.querySelector('#alForm input[name="file"]');
      const f = inp && inp.files && inp.files[0];
      if (!f) throw new Error('Choose the statement file.');
      const fd = new FormData(); fd.append('file', f);
      const r = await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/statement`, fd);
      const m = await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/auto-match`, {});
      return `${AL.plural(r.lines, 'line')} imported; ${m.matched} matched automatically, ${m.stillUnmatched} to resolve.`;
    },
    after: () => AL.recReload(),
  });
};
AL.actions['rec-template'] = () => {
  const csv = 'Account Number,\nAccount Currency,\nOpening Balance,0.00\nClosing Balance,0.00\n\nTransaction Date,Value Date,Reference,Description,Debit,Credit,Balance\n';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'bank-statement-template.csv'; document.body.appendChild(a); a.click(); a.remove();
};
AL.actions['rec-auto'] = (el) => AL.busy(el, async () => {
  const m = await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/auto-match`, {});
  AL.recReload(); return m;
}, ['Auto-match done', (m) => `${m.matched} matched; ${m.stillUnmatched} still to resolve (no entry, or more than one equally likely).`]);
AL.actions['rec-unmatch'] = (el) => AL.busy(el, async () => { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/lines/${encodeURIComponent(el.dataset.item)}/unmatch`, {}); AL.recReload(); }, ['Unmatched', '']);
AL.actions['rec-match'] = (el) => {
  const d = AL.cache[`rec:${AL.ui.rec.session}`].data;
  const it = d.items.find((i) => i.id === el.dataset.item); if (!it) return;
  const cur = (d.bank && d.bank.currency && d.bank.currency.code) || '';
  const inflow = it.credit > 0, amount = inflow ? it.credit : it.debit;
  const used = new Set(d.items.filter((i) => i.entry).map((i) => i.entry.id));
  const cands = d.entries.filter((x) => !used.has(x.id) && x.type === (inflow ? 'RECEIPT' : 'PAYMENT')).sort((a, b) => Math.abs(a.amount - amount) - Math.abs(b.amount - amount));
  AL.form({
    title: 'Match statement line', sub: `${AL.date(it.date)} · ${it.description} · ${inflow ? 'in' : 'out'} ${AL.money(amount, cur)}`, submitLabel: 'Match', doneTitle: 'Matched',
    fields: [{ k: 'entry', label: `Cashbook ${inflow ? 'receipt' : 'payment'}`, type: 'select', required: true, wide: true, options: cands.map((x) => ({ value: x.id, label: `${AL.date(x.transactionDate)} · ${x.reference || x.description} · ${AL.money(x.amount, cur)}${Math.abs(x.amount - amount) > 0.005 ? ' (amount differs)' : ''}` })) }],
    onSubmit: async (v) => { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/lines/${encodeURIComponent(it.id)}/match`, { cashbookEntryId: v.entry }); return ''; },
    after: () => AL.recReload(),
  });
};
AL.actions['rec-book'] = (el) => AL.busy(el, async () => {
  const d = AL.cache[`rec:${AL.ui.rec.session}`].data;
  const it = d.items.find((i) => i.id === el.dataset.item); if (!it) return;
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const inflow = it.credit > 0;
  const accts = ((lk.data && lk.data.accounts) || []).filter((a) => (inflow ? /^[48]/ : /^[56]/).test(String(a.accountNo)));
  const cur = (d.bank && d.bank.currency && d.bank.currency.code) || '';
  AL.form({
    title: 'Book to cashbook', sub: `${AL.date(it.date)} · ${it.description} · ${inflow ? 'in' : 'out'} ${AL.money(inflow ? it.credit : it.debit, cur)}`, submitLabel: `Book ${inflow ? 'receipt' : 'payment'}`, doneTitle: 'Booked and matched',
    fields: [
      { k: 'glAccountId', label: inflow ? 'Income account (e.g. interest received)' : 'Expense account (e.g. bank charges)', type: 'select', required: true, wide: true, options: accts.map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` })) },
      { k: 'description', label: 'Description', required: true, wide: true },
    ],
    initial: { description: it.description, glAccountId: (accts.find((a) => (inflow ? /interest/i : /bank charge|bank fee/i).test(a.accountName)) || {}).id },
    onSubmit: async (v) => { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/lines/${encodeURIComponent(it.id)}/book`, v); return `A cashbook ${inflow ? 'receipt' : 'payment'} is posted for it.`; },
    after: () => AL.recReload(),
  });
});
AL.actions['rec-finish'] = () => {
  const d = AL.cache[`rec:${AL.ui.rec.session}`].data; const cur = (d.bank && d.bank.currency && d.bank.currency.code) || '';
  AL.confirm({
    title: 'Finish this reconciliation', confirmLabel: 'Finish', doneTitle: 'Reconciliation finished',
    body: `${AL.plural(d.entries.filter((x) => x.ticked).length, 'entry')} are marked reconciled, closing at ${AL.money(d.summary.statementEndBalance, cur)}. Nothing can be booked to this account on or before ${AL.date(d.session.statementDate)} afterwards.`,
    onConfirm: async () => { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/finish`, {}); return ''; },
    after: () => AL.recReload(),
  });
};
AL.actions['rec-discard'] = () => AL.confirm({
  title: 'Discard this reconciliation', danger: true, confirmLabel: 'Discard', doneTitle: 'Reconciliation discarded',
  body: 'Its ticks and imported statement are removed; the cashbook is not changed.',
  onConfirm: async () => { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/discard`, {}); AL.ui.rec.session = ''; return ''; },
  after: () => AL.recReload(),
});
AL.actions['rec-reopen'] = () => AL.confirm({
  title: 'Reopen this reconciliation', danger: true, confirmLabel: 'Reopen', doneTitle: 'Reconciliation reopened', reason: 'Why it is reopened',
  body: 'Its entries become unreconciled and it returns to draft; only the latest reconciliation of an account can be reopened.',
  onConfirm: async (v) => { await AL.post(`/cashbook/reconciliation/sessions/${encodeURIComponent(AL.ui.rec.session)}/reopen`, { reason: v.reason }); return ''; },
  after: () => AL.recReload(),
});
