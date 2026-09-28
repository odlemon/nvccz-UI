/* Journal Entries: /accounting/journals — the journal register (drafts, posted, voided) with maker-checker: preparers
 * raise and correct drafts, approvers post or reject them, nobody posts their own; a posted journal is voided by a
 * reversing entry, and only while its period is open. Data: /accounting/journal-entries. */
AL.ui.je = AL.ui.je || { tab: 'PENDING', from: '', to: '', q: '', page: 0 };
AL.jeYearStart = () => `${AL.stiToday().slice(0, 4)}-01-01`;
AL.jeLoad = () => {
  const u = AL.ui.je;
  const from = u.from || AL.jeYearStart(), to = u.to || AL.stiToday();
  const key = `je:${u.tab}:${from}:${to}:${u.page}`;
  return AL.res(key, async () => {
    const r = await AL.getRaw(`/accounting/journal-entries?status=${u.tab}&startDate=${from}&endDate=${to}&limit=50&offset=${u.page * 50}`);
    return { rows: (r && r.data) || [], pagination: (r && r.pagination) || null, key };
  });
};
AL.jeCounts = () => AL.res('je-counts', async () => {
  const from = AL.jeYearStart(), to = AL.stiToday(), m = `${to.slice(0, 7)}-01`;
  const [drafts, posted] = await Promise.all([
    AL.getRaw(`/accounting/journal-entries?status=PENDING&startDate=${from}&endDate=${to}&limit=500`),
    AL.getRaw(`/accounting/journal-entries?status=POSTED&startDate=${m}&endDate=${to}&limit=1`),
  ]);
  const d = (drafts && drafts.data) || [];
  return { drafts: d.length, draftTotal: (drafts && drafts.pagination && drafts.pagination.total) || d.length, mine: d.filter((x) => x.createdById === AL.me().id).length, postedThisMonth: (posted && posted.pagination && posted.pagination.total) || 0 };
});
AL.jeStatus = { PENDING: ['Draft', 'warn'], POSTED: ['Posted', 'ok'], VOID: ['Voided', 'bad'] };
AL.jeWho = (u) => (u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : '—');
AL.jeTotals = (lines) => (lines || []).reduce((t, l) => ({ dr: t.dr + Number(l.debitAmount || 0), cr: t.cr + Number(l.creditAmount || 0) }), { dr: 0, cr: 0 });
AL.jeReload = () => { Object.keys(AL.cache).filter((k) => k.startsWith('je')).forEach((k) => delete AL.cache[k]); AL.redraw(); };

AL.page('journals', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.jeLoad(), c = AL.jeCounts();
  const u = AL.ui.je;
  const head = AL.head('Daily accounting', 'Journal Entries', 'Nobody posts a journal they prepared; a posted journal is corrected by a reversing entry.',
    canPrepare ? AL.btn('New journal', 'je-new', 'primary') : '');
  const cd = c.state === 'ok' ? c.data : null;
  const kpis = AL.kpis([
    ['Drafts awaiting approval', cd ? String(cd.draftTotal) : '…', 'This year', cd && cd.draftTotal ? '#f79009' : '#12b76a'],
    ['My drafts', cd ? String(cd.mine) : '…', 'Prepared by you, not yet posted'],
    ['Posted this month', cd ? String(cd.postedThisMonth) : '…', `Since 1 ${new Date(AL.stiToday()).toLocaleDateString('en-GB', { month: 'short' })}`],
  ]);
  const tabs = `<div class="v28-tabbar">${[['PENDING', 'Drafts'], ['POSTED', 'Posted'], ['VOID', 'Voided'], ['ALL', 'All']].map(([id, label]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="je-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  const filters = `<div class="al-filters"><label class="v28-field"><span>From</span><input class="v28-input" type="date" data-je-filter="from" value="${ae(u.from || AL.jeYearStart())}"></label><label class="v28-field"><span>To</span><input class="v28-input" type="date" data-je-filter="to" value="${ae(u.to || AL.stiToday())}"></label><label class="v28-field al-grow"><span>Search this page</span><input class="v28-input" type="search" data-je-filter="q" value="${ae(u.q)}" placeholder="Reference, description or account"></label></div>`;
  const g = AL.gate(e, { key: e.data && e.data.key, errorTitle: 'Journal entries could not be loaded' });
  let body = g;
  if (!g) {
    const q = u.q.trim().toLowerCase();
    const rows = e.data.rows.filter((j) => !q || `${j.referenceNumber} ${j.description} ${(j.journalEntryLines || []).map((l) => l.chartOfAccount ? `${l.chartOfAccount.accountNo} ${l.chartOfAccount.accountName}` : '').join(' ')}`.toLowerCase().includes(q));
    const me = AL.me().id;
    const tr = rows.map((j) => {
      const st = AL.jeStatus[j.status] || [j.status, 'info'];
      const code = (j.currency && j.currency.code) || '';
      const own = j.createdById === me;
      const acts = [AL.btn('Open', 'je-open', 'small', `data-id="${ae(j.id)}"`)];
      if (j.status === 'PENDING' && canPost && !own) acts.push(AL.btn('Post', 'je-post', 'small primary', `data-id="${ae(j.id)}"`));
      const accts = (j.journalEntryLines || []).map((l) => l.chartOfAccount && l.chartOfAccount.accountNo).filter(Boolean);
      return `<tr>
        <td>${ae(AL.date(j.transactionDate))}</td>
        <td><strong>${ae(j.referenceNumber)}</strong><span class="v28-sub">#${ae(j.auditTrailSequenceNumber || '—')}</span></td>
        <td class="al-wrap">${ae(j.description)}<span class="v28-sub">${ae([...new Set(accts)].slice(0, 4).join(', '))}</span></td>
        <td>${ae(AL.jeWho(j.createdBy))}${own ? '<span class="v28-sub">You</span>' : ''}</td>
        <td>${ae(AL.money(j.totalAmount, code))}</td>
        <td>${AL.status(st[0], st[1])}</td>
        <td class="al-actions">${acts.join('')}</td>
      </tr>`;
    }).join('');
    const pg = e.data.pagination;
    const pager = pg && pg.totalPages > 1 ? `<div class="al-pager"><span class="v28-sub">Page ${pg.page} of ${pg.totalPages} · ${AL.plural(pg.total, 'journal')}</span>${pg.hasPrevPage ? AL.btn('Previous', 'je-page', 'small', 'data-d="-1"') : ''}${pg.hasNextPage ? AL.btn('Next', 'je-page', 'small', 'data-d="1"') : ''}</div>` : '';
    body = rows.length ? `${AL.table(['Date', 'Reference', 'Description', 'Prepared by', 'Amount', 'Status', ''], tr, '1080px')}${pager}` : AL.empty(q ? 'No journal on this page matches the search.' : u.tab === 'PENDING' ? 'No drafts waiting.' : 'No journals in this range.');
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Journal register', '', `${tabs}${filters}${body}`)}</div>`;
});
AL.wire.journals = () => {
  document.querySelectorAll('[data-je-filter]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.jeFilter;
    if (k === 'q') el.addEventListener('input', () => { AL.ui.je.q = el.value; clearTimeout(AL.jeT); AL.jeT = setTimeout(() => { AL.redraw(); const n = document.querySelector('[data-je-filter="q"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    else el.addEventListener('change', () => { AL.ui.je[k] = el.value; AL.ui.je.page = 0; AL.redraw(); });
  });
};
AL.actions['je-tab'] = (el) => { AL.ui.je.tab = el.dataset.tab; AL.ui.je.page = 0; AL.redraw(); };
AL.actions['je-page'] = (el) => { AL.ui.je.page = Math.max(0, AL.ui.je.page + Number(el.dataset.d)); AL.redraw(); };

// ------------------------------------------------------------------------------------------------ one journal
AL.jeLinesTable = (j) => {
  const code = (j.currency && j.currency.code) || '';
  const t = AL.jeTotals(j.journalEntryLines);
  const rows = (j.journalEntryLines || []).map((l) => `<tr><td><strong>${ae(l.chartOfAccount ? l.chartOfAccount.accountNo : '')}</strong> ${ae(l.chartOfAccount ? l.chartOfAccount.accountName : '')}</td><td class="al-wrap">${ae(l.description || '')}</td><td>${Number(l.debitAmount) ? ae(AL.money(l.debitAmount, code)) : ''}</td><td>${Number(l.creditAmount) ? ae(AL.money(l.creditAmount, code)) : ''}</td></tr>`).join('');
  return AL.table(['Account', 'Line description', 'Debit', 'Credit'], `${rows}<tr class="al-total"><td colspan="2"><strong>Total</strong></td><td><strong>${ae(AL.money(t.dr, code))}</strong></td><td><strong>${ae(AL.money(t.cr, code))}</strong></td></tr>`, '720px');
};
AL.actions['je-open'] = (el) => AL.busy(el, async () => {
  const r = await AL.get(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}`);
  // the single-journal read answers { journalEntry, journalEntryLines, source }
  const j = r && r.journalEntry ? { ...r.journalEntry, journalEntryLines: r.journalEntry.journalEntryLines || r.journalEntryLines || [], source: r.source || null } : r;
  if (!j.currency) { const lk = AL.jeLookups(); if (lk.pending) await lk.pending; const c = lk.data && lk.data.currencies.find((x) => x.id === j.currencyId); if (c) j.currency = { code: c.code }; }
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const own = j.createdById === AL.me().id;
  const st = AL.jeStatus[j.status] || [j.status, 'info'];
  const facts = [['Date', AL.date(j.transactionDate)], ['Prepared by', `${AL.jeWho(j.createdBy)}${own ? ' (you)' : ''}`], ['Status', st[0]], ['Raised for', j.source ? j.source.replace(/^an? /, '') : 'Manual journal'], ['Audit sequence', `#${j.auditTrailSequenceNumber || '—'}`], ['Currency', (j.currency && j.currency.code) || '—']]
    .map((f) => `<div class="v28-list-item"><div><strong>${ae(f[0])}</strong><span>${ae(f[1])}</span></div></div>`).join('');
  const buttons = [];
  if (j.status === 'PENDING' && canPost && !own) buttons.push(AL.btn('Post to ledger', 'je-post', 'primary', `data-id="${ae(j.id)}"`), AL.btn('Reject', 'je-reject', 'danger', `data-id="${ae(j.id)}"`));
  if (j.status === 'PENDING' && canPost && own) buttons.push(`<span class="v28-sub">You prepared this draft, so another approver posts it.</span>`);
  if (j.status === 'PENDING' && own && canPrepare && !j.source) buttons.push(AL.btn('Edit draft', 'je-edit', '', `data-id="${ae(j.id)}"`), AL.btn('Discard draft', 'je-discard', 'danger', `data-id="${ae(j.id)}"`));
  if (j.status === 'POSTED' && canPost) buttons.push(AL.btn('Void (reverse)', 'je-void', 'danger', `data-id="${ae(j.id)}"`));
  AL.jeCurrent = j;
  AL.form({
    title: j.referenceNumber, sub: j.description, wide: true, viewOnly: true, submitLabel: 'Close', fields: [],
    extra: `<div class="al-wide"><div class="v28-grid equal">${facts}</div><h4 style="margin:16px 0 8px">Lines</h4>${AL.jeLinesTable(j)}${buttons.length ? `<div class="al-actions" style="margin-top:14px">${buttons.join('')}</div>` : ''}</div>`,
    onSubmit: async () => false,
  });
});
AL.actions['je-post'] = (el) => AL.busy(el, async () => {
  await AL.patch(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}/post`, {});
  AL.close(); AL.jeReload();
}, ['Journal posted', 'It is in the ledger.']);
AL.actions['je-reject'] = (el) => AL.confirm({
  title: 'Reject this draft', danger: true, confirmLabel: 'Reject draft', doneTitle: 'Draft rejected', reason: 'Why it is rejected',
  body: 'The draft is withdrawn and never reaches the ledger; the preparer raises a corrected one.',
  onConfirm: async (v) => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}/void`, { reason: v.reason }); return 'The preparer can raise a corrected journal.'; },
  after: () => AL.jeReload(),
});
AL.actions['je-discard'] = (el) => AL.confirm({
  title: 'Discard this draft', danger: true, confirmLabel: 'Discard draft', doneTitle: 'Draft discarded', reason: 'Why it is discarded', reasonRequired: false,
  body: 'It never reached the ledger, so nothing is reversed.',
  onConfirm: async (v) => { await AL.post(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}/discard`, { reason: v.reason || null }); return ''; },
  after: () => AL.jeReload(),
});
AL.actions['je-void'] = (el) => AL.confirm({
  title: 'Void this journal', danger: true, confirmLabel: 'Void and reverse', doneTitle: 'Journal voided', reason: 'Why it is voided',
  body: 'A reversing entry is posted and the journal is marked void; reports then leave both out. Its period must still be open.',
  onConfirm: async (v) => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}/void`, { reason: v.reason }); return 'A reversing entry is posted.'; },
  after: () => AL.jeReload(),
});

// ------------------------------------------------------------------------------------------------ raise or edit a journal
AL.jeLookups = () => AL.res('je-lookups', async () => {
  const [coa, currencies] = await Promise.all([AL.get('/accounting/chart-of-accounts'), AL.get('/accounting/currencies')]);
  const accounts = (Array.isArray(coa) ? coa : (coa && coa.accounts) || []).filter((a) => a.isActive !== false).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo)));
  return { accounts, currencies: (currencies || []).filter((c) => c.isActive !== false) };
});
AL.jeLineRow = (accounts, l = {}) => `<tr class="al-je-line">
  <td><select class="v28-select" data-k="chartOfAccountId"><option value="">Choose account…</option>${accounts.map((a) => `<option value="${ae(a.id)}"${a.id === l.chartOfAccountId ? ' selected' : ''}>${ae(`${a.accountNo} ${a.accountName}`)}</option>`).join('')}</select></td>
  <td><input class="v28-input" data-k="description" value="${ae(l.description || '')}"></td>
  <td><input class="v28-input" type="number" min="0" step="0.01" data-k="debitAmount" value="${Number(l.debitAmount) ? ae(Number(l.debitAmount)) : ''}"></td>
  <td><input class="v28-input" type="number" min="0" step="0.01" data-k="creditAmount" value="${Number(l.creditAmount) ? ae(Number(l.creditAmount)) : ''}"></td>
  <td><button class="v28-btn icon" data-al="je-line-del" aria-label="Remove line" type="button">×</button></td>
</tr>`;
AL.jeReadLines = () => [...document.querySelectorAll('#alOverlay .al-je-line')].map((tr) => {
  const v = (k) => { const n = tr.querySelector(`[data-k="${k}"]`); return n ? n.value.trim() : ''; };
  return { chartOfAccountId: v('chartOfAccountId'), description: v('description'), debitAmount: Number(v('debitAmount')) || 0, creditAmount: Number(v('creditAmount')) || 0 };
}).filter((l) => l.chartOfAccountId || l.debitAmount || l.creditAmount);
AL.jeBalanceNote = () => {
  const t = AL.jeTotals(AL.jeReadLines()), n = document.getElementById('alJeBalance'); if (!n) return;
  const diff = Math.round((t.dr - t.cr) * 100) / 100;
  n.innerHTML = `Debits <strong>${ae(AL.num(t.dr, 2))}</strong> · Credits <strong>${ae(AL.num(t.cr, 2))}</strong> · ${diff === 0 && t.dr > 0 ? '<span class="al-ok">Balanced</span>' : `<span class="al-bad">Difference ${ae(AL.num(Math.abs(diff), 2))}</span>`}`;
};
AL.actions['je-line-add'] = () => { const tb = document.querySelector('#alOverlay .al-je-lines tbody'); if (tb) { tb.insertAdjacentHTML('beforeend', AL.jeLineRow(AL.cache['je-lookups'].data.accounts)); AL.jeBalanceNote(); } };
AL.actions['je-line-del'] = (el) => { const rows = document.querySelectorAll('#alOverlay .al-je-line'); if (rows.length > 2) el.closest('tr').remove(); AL.jeBalanceNote(); };
AL.jeForm = async (existing) => {
  const lk = AL.jeLookups();
  if (lk.pending) await lk.pending;
  if (lk.state !== 'ok') throw new Error(lk.error || 'The chart of accounts could not be loaded.');
  const { accounts, currencies } = lk.data;
  const base = currencies.find((c) => c.isDefault) || currencies[0] || {};
  const lines = existing ? existing.journalEntryLines : [{}, {}];
  const today = AL.stiToday();
  AL.form({
    title: existing ? `Edit draft ${existing.referenceNumber}` : 'New journal', sub: 'Saved as a draft; an approver other than you posts it.', wide: true, submitLabel: existing ? 'Save draft' : 'Save as draft', doneTitle: existing ? 'Draft saved' : 'Journal saved as a draft',
    fields: [
      { k: 'transactionDate', label: 'Date', type: 'date', required: true, max: today },
      { k: 'referenceNumber', label: 'Reference', required: true },
      { k: 'currencyId', label: 'Currency', type: 'select', blank: false, required: true, options: currencies.map((c) => ({ value: c.id, label: c.code })) },
      { k: 'description', label: 'Description', required: true, wide: true },
    ],
    initial: existing
      ? { transactionDate: String(existing.transactionDate).slice(0, 10), referenceNumber: existing.referenceNumber, currencyId: existing.currencyId, description: existing.description }
      : { transactionDate: today, referenceNumber: `MJ-${today.replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, currencyId: base.id },
    extra: `<div class="al-wide"><div class="v28-tablewrap"><table class="v28-table al-je-lines" style="min-width:760px"><thead><tr><th>Account</th><th>Line description</th><th>Debit</th><th>Credit</th><th></th></tr></thead><tbody>${lines.map((l) => AL.jeLineRow(accounts, l)).join('')}</tbody></table></div><div class="al-je-foot">${AL.btn('Add line', 'je-line-add', 'small', 'type="button"')}<span id="alJeBalance" class="v28-sub"></span></div></div>`,
    validate: (v) => {
      const ls = AL.jeReadLines();
      if (ls.length < 2) return 'A journal needs at least two lines.';
      if (ls.some((l) => !l.chartOfAccountId)) return 'Choose an account on every line.';
      if (ls.some((l) => l.debitAmount && l.creditAmount)) return 'A line is either a debit or a credit, not both.';
      if (ls.some((l) => !l.debitAmount && !l.creditAmount)) return 'Every line needs an amount.';
      if (ls.some((l) => l.debitAmount < 0 || l.creditAmount < 0)) return 'Amounts cannot be negative; use the other column.';
      const t = AL.jeTotals(ls);
      if (Math.round((t.dr - t.cr) * 100) !== 0) return `Debits and credits differ by ${AL.num(Math.abs(t.dr - t.cr), 2)}.`;
      if (v.transactionDate > today) return 'The date cannot be in the future.';
      return '';
    },
    onSubmit: async (v) => {
      const body = { ...v, journalEntryLines: AL.jeReadLines() };
      if (existing) await AL.patch(`/accounting/journal-entries/${encodeURIComponent(existing.id)}`, body);
      else await AL.post('/accounting/journal-entries', body);
      return `${v.referenceNumber} is waiting for an approver.`;
    },
    after: () => { AL.ui.je.tab = 'PENDING'; AL.jeReload(); },
  });
  const ov = document.getElementById('alOverlay');
  if (ov) ov.addEventListener('input', (ev) => { if (ev.target.closest('.al-je-line')) AL.jeBalanceNote(); });
  AL.jeBalanceNote();
};
AL.actions['je-new'] = (el) => AL.busy(el, () => AL.jeForm(null));
AL.actions['je-edit'] = (el) => AL.busy(el, () => AL.jeForm(AL.jeCurrent));
