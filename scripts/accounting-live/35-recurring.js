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

AL.ui.rec = AL.ui.rec || { q: '', status: 'ALL', page: 1, pageSize: 10 };
AL.recRunCount = (t) => Number((t._count && t._count.runs) || (t.runs && t.runs.length) || 0);
AL.recState = (t) => t.isActive ? ['Active', 'ok'] : ['Inactive', 'warn'];
AL.recAmount = (t) => (t.linesJson || []).reduce((sum, line) => sum + Number(line.debitAmount || 0), 0);
AL.recFiltered = () => {
  const u = AL.ui.rec, rows = (AL.cache.rec && AL.cache.rec.data) || [], q = u.q.trim().toLowerCase();
  return rows.filter((t) => {
    const [status] = AL.recState(t);
    const text = `${t.name} ${t.description || ''} ${t.currency && t.currency.code || ''} ${t.referencePrefix || ''}`.toLowerCase();
    return (!q || text.includes(q)) && (u.status === 'ALL' || (u.status === 'ACTIVE' && t.isActive) || (u.status === 'INACTIVE' && !t.isActive));
  });
};
AL.recExportSpec = () => {
  const rows = AL.recFiltered(), u = AL.ui.rec;
  return {
    title: 'Recurring Journal Schedules', subtitle: 'Monthly recurring journal templates and their approval status.',
    meta: [['Schedules', String(rows.length)], ['Status filter', ({ ALL: 'All schedules', ACTIVE: 'Active', INACTIVE: 'Inactive' })[u.status] || 'All schedules'], ['Search', u.q || 'All']],
    columns: ['Schedule', 'Description', 'Posts monthly on', 'Next run', 'Currency', 'Monthly debit total', 'Reference prefix', 'Status', 'Months posted', 'Last run', 'Prepared by'],
    rows: rows.map((t) => { const recent = (t.runs || [])[0] || {}; const [status] = AL.recState(t); return [t.name, t.description || '', `Day ${t.dayOfMonth || 1}`, AL.date(AL.recNext(t)), t.currency && t.currency.code || '', AL.recAmount(t), t.referencePrefix || '', status, AL.recRunCount(t), recent.journalEntry && recent.journalEntry.transactionDate ? AL.date(recent.journalEntry.transactionDate) : 'Never run', t.createdBy ? AL.jeWho(t.createdBy) : '']; }),
    filename: 'accounting-recurring-journal-schedules', landscape: true,
    note: 'Schedules are saved inactive and require a different user with posting permission to activate. Each schedule is limited to one posted journal per calendar month.',
  };
};

AL.page('recurring', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.recLoad();
  const actions = [AL.btn('Refresh', 'rec-refresh', 'small'), canPrepare ? AL.btn('New schedule', 'rec-new', 'primary') : '', canPost ? AL.btn('Run due schedules', 'rec-due') : '', e.state === 'ok' ? AL.exportBtns('rec-export') : ''].join('');
  const head = AL.head('Daily accounting', 'Recurring Schedules', 'Monthly journal templates. Each stays off until a different approver activates it.', actions);
  const g = AL.gate(e, { key: 'rec', errorTitle: 'Recurring schedules could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const list = e.data || [], active = list.filter((t) => t.isActive), inactive = list.filter((t) => !t.isActive);
  const monthly = active.reduce((sum, t) => sum + AL.recAmount(t), 0);
  const next = active.slice().sort((a, b) => AL.recNext(a).localeCompare(AL.recNext(b)))[0];
  const kpis = AL.kpis([
    ['Active schedules', String(active.length), `${AL.money(monthly)} monthly debit total`],
    ['Inactive', String(inactive.length), 'A different posting approver can activate; inactive schedules do not post', inactive.length ? '#f79009' : '#12b76a'],
    ['Next scheduled journal', next ? AL.date(AL.recNext(next)) : '?', next ? next.name : 'No active schedules'],
  ]);
  const u = AL.ui.rec, filtered = AL.recFiltered(), pages = Math.max(1, Math.ceil(filtered.length / u.pageSize));
  u.page = Math.min(Math.max(1, Number(u.page) || 1), pages);
  const visible = filtered.slice((u.page - 1) * u.pageSize, u.page * u.pageSize);
  const statusOptions = [['ALL', 'All schedules'], ['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']];
  const filters = `<div class="al-filters"><label class="v28-field al-grow"><span>Search schedules</span><input class="v28-input" type="search" data-rec-filter="q" value="${ae(u.q)}" placeholder="Name, description, currency or reference"></label><label class="v28-field"><span>Status</span><select class="v28-input" data-rec-filter="status">${statusOptions.map(([id, label]) => `<option value="${id}" ${u.status === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>`;
  const rows = visible.map((t) => {
    const status = AL.recState(t), runs = AL.recRunCount(t);
    return `<tr data-rec-row="1" data-id="${ae(t.id)}"><td><button class="al-link-button" type="button" data-al="rec-detail" data-id="${ae(t.id)}">${ae(t.name)}</button><span class="v28-sub">${ae(t.description || '')}</span></td><td>Day ${ae(String(t.dayOfMonth || 1))}<span class="v28-sub">Monthly</span></td><td class="num">${ae(AL.money(AL.recAmount(t), t.currency && t.currency.code))}</td><td>${ae(String(runs))}</td><td>${ae(t.isActive ? AL.date(AL.recNext(t)) : 'Not scheduled')}</td><td>${AL.status(status[0], status[1])}</td><td class="al-actions">${AL.btn('Details', 'rec-detail', 'small', `data-id="${ae(t.id)}"`)}</td></tr>`;
  }).join('');
  const pager = `<div class="al-pager" role="navigation" aria-label="Recurring schedule pages"><span>Showing ${filtered.length ? (u.page - 1) * u.pageSize + 1 : 0} to ${Math.min(u.page * u.pageSize, filtered.length)} of ${filtered.length} schedules</span><div>${AL.btn('Previous', 'rec-page', 'small', `data-p="${u.page - 1}"${u.page <= 1 ? ' disabled' : ''}`)}<span class="v28-sub">Page ${u.page} of ${pages}</span>${AL.btn('Next', 'rec-page', 'small', `data-p="${u.page + 1}"${u.page >= pages ? ' disabled' : ''}`)}</div></div>`;
  const table = filtered.length ? `${AL.table(['Schedule', 'Posts on', 'Monthly amount', 'Months posted', 'Next run', 'Status', ''], rows, '1080px')}${pager}` : AL.empty(u.q || u.status !== 'ALL' ? 'No recurring schedules match these filters.' : 'No recurring journal schedules yet. Create one with balanced journal lines.');
  return `<div class="v28-page al-recurring-page">${head}${kpis}${AL.panel('Monthly journal schedules', '', `${filters}${table}`)}</div>`;
});
AL.recFind = (id) => ((AL.cache.rec && AL.cache.rec.data) || []).find((t) => t.id === id);
AL.actions['rec-detail'] = async (el) => {
  const t = AL.recFind(el.dataset.id); if (!t) return;
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const accounts = (lk.data && lk.data.accounts) || [], currency = t.currency && t.currency.code || '', lines = t.linesJson || [];
  const account = (id) => { const a = accounts.find((x) => x.id === id); return a ? `${a.accountNo} ${a.accountName}` : 'Account unavailable'; };
  const totals = AL.jeTotals(lines), lineRows = lines.map((line) => `<tr><td><strong>${ae(account(line.chartOfAccountId))}</strong></td><td class="al-wrap">${ae(line.description || '')}</td><td class="num">${Number(line.debitAmount) ? ae(AL.money(line.debitAmount, currency)) : ''}</td><td class="num">${Number(line.creditAmount) ? ae(AL.money(line.creditAmount, currency)) : ''}</td></tr>`).join('');
  const runs = t.runs || [], runRows = runs.map((run) => `<tr><td>${ae(run.yearMonth || '')}</td><td>${ae(run.journalEntry && run.journalEntry.referenceNumber || 'Journal')}</td><td>${ae(AL.date(run.journalEntry && run.journalEntry.transactionDate || run.createdAt))}</td><td>${AL.status(run.journalEntry && run.journalEntry.status || 'Posted', 'ok')}</td></tr>`).join('');
  const canPost = AL.can('manage_ledger'), own = t.createdById === AL.me().id, state = AL.recState(t), actions = [];
  if (canPost && t.isActive) actions.push(AL.btn('Run now', 'rec-run', 'small primary', `data-id="${ae(t.id)}" data-close-detail="1"`), AL.btn('Pause schedule', 'rec-toggle', 'small danger', `data-id="${ae(t.id)}" data-on="0"`));
  if (canPost && !t.isActive && !own) actions.push(AL.btn('Activate schedule', 'rec-toggle', 'small primary', `data-id="${ae(t.id)}" data-on="1"`));
  if (canPost && !t.isActive && own) actions.push('<span class="v28-sub">A different user with posting permission must activate this schedule.</span>');
  const facts = [['Status', AL.status(state[0], state[1])], ['Next scheduled run', t.isActive ? AL.date(AL.recNext(t)) : 'Not scheduled while off'], ['Monthly debit total', AL.money(AL.recAmount(t), currency)], ['Reference prefix', t.referencePrefix || '?'], ['Prepared by', t.createdBy ? AL.jeWho(t.createdBy) : '?'], ['Posted months', String(AL.recRunCount(t))]];
  AL.form({ title: t.name, sub: `Monthly journal, day ${t.dayOfMonth || 1}, ${currency || 'currency not set'}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide"><div class="v28-grid equal">${facts.map(([label, value]) => `<div class="v28-list-item"><div><strong>${label}</strong><span>${value}</span></div></div>`).join('')}</div><h4 style="margin:16px 0 8px">Journal lines</h4>${lineRows ? AL.table(['Account', 'Line description', 'Debit', 'Credit'], `${lineRows}<tr class="al-total"><td colspan="2"><strong>Total</strong></td><td class="num"><strong>${ae(AL.money(totals.dr, currency))}</strong></td><td class="num"><strong>${ae(AL.money(totals.cr, currency))}</strong></td></tr>`, '760px') : AL.empty('No journal lines are configured.')}<h4 style="margin:16px 0 8px">Recent journal runs</h4>${runRows ? AL.table(['Month', 'Journal reference', 'Date', 'Status'], runRows, '760px') : AL.empty('No journals have been generated from this schedule yet.')}${actions.length ? `<div class="al-actions" style="margin-top:14px">${actions.join('')}</div>` : ''}</div>`, onSubmit: async () => false });
};
AL.wire.recurring = () => {
  document.querySelectorAll('.al-recurring-page tbody tr[data-rec-row]').forEach((row) => {
    row.dataset.v25DetailBound = '1';
    row.tabIndex = 0;
    row.setAttribute('aria-label', `View schedule details: ${row.querySelector('[data-al="rec-detail"]')?.textContent || 'schedule'}`);
    if (row.dataset.recWired) return; row.dataset.recWired = '1';
    row.addEventListener('click', (ev) => { if (ev.target.closest('button, a, input, select, textarea, [data-al]')) return; AL.actions['rec-detail'](row); });
    row.addEventListener('keydown', (ev) => { if (ev.key !== 'Enter' && ev.key !== ' ') return; ev.preventDefault(); AL.actions['rec-detail'](row); });
  });
  document.querySelectorAll('[data-rec-filter]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1'; const key = el.dataset.recFilter;
    if (key === 'q') el.addEventListener('input', () => { AL.ui.rec.q = el.value; AL.ui.rec.page = 1; clearTimeout(AL.recFilterTimer); AL.recFilterTimer = setTimeout(() => { AL.redraw(); const input = document.querySelector('[data-rec-filter="q"]'); if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } }, 200); });
    else el.addEventListener('change', () => { AL.ui.rec[key] = el.value; AL.ui.rec.page = 1; AL.redraw(); });
  });
};
AL.actions['rec-refresh'] = () => { AL.invalidate('rec'); AL.redraw(); };
AL.actions['rec-page'] = (el) => { AL.ui.rec.page = Number(el.dataset.p) || 1; AL.redraw(); };
AL.actions['rec-export'] = (el) => AL.exportRun(el, AL.recExportSpec(), 'recurring journal schedules');
AL.actions['rec-toggle'] = (el) => {
  const t = AL.recFind(el.dataset.id); if (!t) return;
  const on = el.dataset.on === '1';
  AL.confirm({ title: `${on ? 'Switch on' : 'Pause'} ${t.name}`, confirmLabel: on ? 'Switch on' : 'Pause', doneTitle: on ? 'Switched on' : 'Paused',
    body: on ? `From now on it posts ${AL.money((t.linesJson || []).reduce((a, l) => a + Number(l.debitAmount || 0), 0), t.currency && t.currency.code)} on day ${t.dayOfMonth || 1} of every month without further review.` : 'It stops posting until switched on again.',
    onConfirm: async () => { await AL.patch(`/accounting/recurring-journal-templates/${encodeURIComponent(t.id)}/active`, { isActive: on }); return ''; }, after: () => AL.recReload() });
};
AL.actions['rec-run'] = (el) => { if (el.dataset.closeDetail) AL.close(); return AL.busy(el, async () => { const r = await AL.post(`/accounting/recurring-journal-templates/${encodeURIComponent(el.dataset.id)}/run`, {}); AL.recReload(); return r; }, ['Run', (r) => (r && (r.skipped || r.alreadyRun) ? 'Already posted for this month.' : 'Posted for this month.')]); };
AL.actions['rec-due'] = (el) => AL.busy(el, async () => { const r = await AL.post('/accounting/recurring-journal-templates/run-due', {}); AL.recReload(); return r; }, ['Due schedules run', (r) => { const rows = (r && r.posted) || []; const posted = rows.filter((x) => !x.skipped && !x.error).length; const skipped = rows.filter((x) => x.skipped).length; const failed = rows.filter((x) => x.error).length; return `${posted} posted, ${skipped} already posted, ${failed} failed.`; }]);
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
