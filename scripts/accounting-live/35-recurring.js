/* Recurring Schedules: /accounting/recurring — journals that post themselves each month (accruals, subscriptions,
 * allocations). A preparer sets one up (balanced lines, day of the month); an approver who did not set it up switches it
 * on; the scheduled job then posts it on its day each month (never twice for a month), and an approver can run one or all
 * due now. Data: /accounting/recurring-journal-templates. */
AL.recLoad = () => AL.res('rec', () => AL.get('/accounting/recurring-journal-templates'));
AL.recReload = () => { delete AL.cache.rec; AL.redraw(); };
AL.recNext = (t) => {
  const today = AL.stiToday(); const [y, m] = today.split('-').map(Number);
  const dim = (yy, mm) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const d = Math.min(t.dayOfMonth || 1, dim(y, m));
  const thisMonth = `${today.slice(0, 7)}-${String(d).padStart(2, '0')}`;
  if (thisMonth >= today) return thisMonth;
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(t.dayOfMonth || 1, dim(ny, nm))).padStart(2, '0')}`;
};

AL.page('recurring', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.recLoad();
  const head = AL.head('Daily accounting', 'Recurring Schedules', 'Each posts on its day every month once an approver has switched it on.',
    [canPrepare ? AL.btn('New schedule', 'rec-new', 'primary') : '', canPost ? AL.btn('Run what is due', 'rec-due') : ''].join(''));
  const g = AL.gate(e, { key: 'rec', errorTitle: 'Recurring schedules could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const list = e.data || [];
  const me = AL.me().id;
  const active = list.filter((t) => t.isActive), waiting = list.filter((t) => !t.isActive && !(t._count && t._count.runs));
  const monthly = active.reduce((s, t) => s + (t.linesJson || []).reduce((a, l) => a + Number(l.debitAmount || 0), 0), 0);
  const kpis = AL.kpis([
    ['On', String(active.length), `${AL.money(monthly)} a month`],
    ['Waiting to be switched on', String(waiting.length), 'Set up, not approved yet', waiting.length ? '#f79009' : '#12b76a'],
    ['Paused', String(list.length - active.length - waiting.length), 'Switched off after running'],
    ['Next to post', active.length ? AL.date(active.map(AL.recNext).sort()[0]) : '—', active.length ? active.sort((a, b) => AL.recNext(a).localeCompare(AL.recNext(b)))[0].name : ''],
  ]);
  const rows = list.map((t) => {
    const amount = (t.linesJson || []).reduce((a, l) => a + Number(l.debitAmount || 0), 0);
    const runs = (t._count && t._count.runs) || 0;
    const own = t.createdById === me;
    const status = t.isActive ? AL.status('On', 'ok') : runs ? AL.status('Paused', 'info') : AL.status('Waiting to be switched on', 'warn');
    const acts = [AL.btn('Lines', 'rec-lines', 'small', `data-id="${ae(t.id)}"`)];
    if (canPost && !t.isActive && !own) acts.push(AL.btn('Switch on', 'rec-toggle', 'small primary', `data-id="${ae(t.id)}" data-on="1"`));
    if (canPost && t.isActive) acts.push(AL.btn('Run now', 'rec-run', 'small', `data-id="${ae(t.id)}"`), AL.btn('Pause', 'rec-toggle', 'small', `data-id="${ae(t.id)}" data-on="0"`));
    return `<tr>
      <td><strong>${ae(t.name)}</strong><span class="v28-sub">${ae(t.description || '')}</span></td>
      <td>Day ${ae(String(t.dayOfMonth || 1))}<span class="v28-sub">${t.isActive ? `Next ${ae(AL.date(AL.recNext(t)))}` : ''}</span></td>
      <td>${ae(AL.money(amount, t.currency && t.currency.code))}</td>
      <td>${ae(String(runs))}</td>
      <td>${status}${own && !t.isActive && !runs ? '<span class="v28-sub">Set up by you</span>' : ''}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Schedules', '', rows ? AL.table(['Schedule', 'Posts on', 'Amount', 'Months posted', 'Status', ''], rows, '980px') : AL.empty('No recurring schedules yet.'))}</div>`;
});
AL.recFind = (id) => ((AL.cache.rec && AL.cache.rec.data) || []).find((t) => t.id === id);
AL.actions['rec-lines'] = (el) => AL.busy(el, async () => {
  const t = AL.recFind(el.dataset.id); if (!t) return;
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const name = (id) => { const a = ((lk.data && lk.data.accounts) || []).find((x) => x.id === id); return a ? `${a.accountNo} ${a.accountName}` : id; };
  const rows = (t.linesJson || []).map((l) => `<tr><td>${ae(name(l.chartOfAccountId))}</td><td class="al-wrap">${ae(l.description || '')}</td><td>${Number(l.debitAmount) ? ae(AL.money(l.debitAmount)) : ''}</td><td>${Number(l.creditAmount) ? ae(AL.money(l.creditAmount)) : ''}</td></tr>`).join('');
  AL.form({ title: t.name, sub: `Day ${t.dayOfMonth || 1} · reference ${t.referencePrefix || ''}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${AL.table(['Account', 'Line', 'Debit', 'Credit'], rows, '640px')}</div>`, onSubmit: async () => false });
});
AL.actions['rec-toggle'] = (el) => {
  const t = AL.recFind(el.dataset.id); if (!t) return;
  const on = el.dataset.on === '1';
  AL.confirm({ title: `${on ? 'Switch on' : 'Pause'} ${t.name}`, confirmLabel: on ? 'Switch on' : 'Pause', doneTitle: on ? 'Switched on' : 'Paused',
    body: on ? `From now on it posts ${AL.money((t.linesJson || []).reduce((a, l) => a + Number(l.debitAmount || 0), 0), t.currency && t.currency.code)} on day ${t.dayOfMonth || 1} of every month without further review.` : 'It stops posting until switched on again.',
    onConfirm: async () => { await AL.patch(`/accounting/recurring-journal-templates/${encodeURIComponent(t.id)}/active`, { isActive: on }); return ''; }, after: () => AL.recReload() });
};
AL.actions['rec-run'] = (el) => AL.busy(el, async () => { const r = await AL.post(`/accounting/recurring-journal-templates/${encodeURIComponent(el.dataset.id)}/run`, {}); AL.recReload(); return r; }, ['Run', (r) => (r && (r.skipped || r.alreadyRun) ? 'Already posted for this month.' : 'Posted for this month.')]);
AL.actions['rec-due'] = (el) => AL.busy(el, async () => { const r = await AL.post('/accounting/recurring-journal-templates/run-due', {}); AL.recReload(); return r; }, ['Due schedules run', (r) => `${(r && (r.created ?? r.posted ?? r.processed)) || 0} posted.`]);
AL.actions['rec-new'] = (el) => AL.busy(el, async () => {
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const { accounts, currencies } = lk.data; const base = currencies.find((c) => c.isDefault) || currencies[0] || {};
  AL.form({
    title: 'New recurring schedule', sub: 'Saved switched off; an approver other than you switches it on.', wide: true, submitLabel: 'Save', doneTitle: 'Schedule saved',
    fields: [
      { k: 'name', label: 'Name', required: true, wide: true },
      { k: 'description', label: 'Description', wide: true },
      { k: 'dayOfMonth', label: 'Posts on day of month', type: 'number', min: 1, max: 31, step: '1', required: true },
      { k: 'currencyId', label: 'Currency', type: 'select', blank: false, required: true, options: currencies.map((c) => ({ value: c.id, label: c.code })) },
      { k: 'referencePrefix', label: 'Reference prefix' },
    ],
    initial: { dayOfMonth: 1, currencyId: base.id, referencePrefix: 'REC' },
    extra: `<div class="al-wide"><div class="v28-tablewrap"><table class="v28-table al-je-lines" style="min-width:760px"><thead><tr><th>Account</th><th>Line description</th><th>Debit</th><th>Credit</th><th></th></tr></thead><tbody>${AL.jeLineRow(accounts)}${AL.jeLineRow(accounts)}</tbody></table></div><div class="al-je-foot">${AL.btn('Add line', 'je-line-add', 'small', 'type="button"')}<span id="alJeBalance" class="v28-sub"></span></div></div>`,
    validate: () => { const ls = AL.jeReadLines(); if (ls.length < 2) return 'At least two lines.'; if (ls.some((l) => !l.chartOfAccountId)) return 'Choose an account on every line.'; const t = AL.jeTotals(ls); return Math.round((t.dr - t.cr) * 100) !== 0 ? 'Debits and credits must be equal.' : ''; },
    onSubmit: async (v) => { await AL.post('/accounting/recurring-journal-templates', { ...v, dayOfMonth: Number(v.dayOfMonth), lines: AL.jeReadLines() }); return 'An approver switches it on.'; },
    after: () => AL.recReload(),
  });
  const ov = document.getElementById('alOverlay'); if (ov) ov.addEventListener('input', (ev) => { if (ev.target.closest('.al-je-line')) AL.jeBalanceNote(); });
});
