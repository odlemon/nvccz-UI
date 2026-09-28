/* Period Close: /accounting/close — one month's close: readiness (checklist, draft journals, bank lines, investment
 * interest, depreciation), the checklist by workstream with owners and dependencies, and the lock. Locking the month
 * locks the ledger and its sub-ledgers (GL, AR, AP, BANK) and is refused while checklist tasks are open (ACC-PER-07).
 * Data: /accounting/fiscal-calendar, /accounting/close-tasks/*. */
AL.CLOSE_MODULES = ['GL', 'AR', 'AP', 'BANK'];
AL.MODULE_NAMES = { GL: 'General ledger', AR: 'Receivables', AP: 'Payables', BANK: 'Bank', IC: 'Inventory', OE: 'Orders', PO: 'Purchase orders' };
AL.ui.close = AL.ui.close || { period: '' };
AL.calLoad = () => AL.res('calendar', () => AL.get('/accounting/fiscal-calendar'));
AL.closePeriods = (cal) => {
  const out = [];
  ((cal && cal.fiscalYears) || []).forEach((y) => (y.periods || []).forEach((p) => out.push(p)));
  return out.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
};
AL.glLock = (p) => { const l = (p.moduleLocks || []).find((m) => m.moduleCode === 'GL'); return l ? l.lockStatus : 'OPEN'; };
/** The month to close: last month while it is still open, otherwise this month. */
AL.closeDefault = (periods) => {
  const today = AL.stiToday();
  const i = periods.findIndex((p) => String(p.startDate).slice(0, 10) <= today && String(p.endDate).slice(0, 10) >= today);
  if (i < 0) return periods.length ? periods[periods.length - 1].id : '';
  const prev = periods[i - 1];
  return prev && AL.glLock(prev) === 'OPEN' ? prev.id : periods[i].id;
};
AL.closeLoad = (pid) => AL.res(`close:${pid}`, async () => {
  const [tasks, ready, audit] = await Promise.all([
    AL.get(`/accounting/close-tasks/periods/${encodeURIComponent(pid)}/tasks`),
    AL.get(`/accounting/close-tasks/periods/${encodeURIComponent(pid)}/readiness`),
    AL.get('/accounting/fiscal-calendar/period-lock/audit').catch(() => []),
  ]);
  return { tasks: tasks || [], ready: ready || {}, audit: (audit || []).filter((a) => a.fiscalPeriodId === pid).slice(0, 12) };
});
AL.closeReload = () => { Object.keys(AL.cache).filter((k) => k === 'calendar' || k.startsWith('close:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.taskStatus = { OPEN: ['Open', 'warn'], IN_PROGRESS: ['In progress', 'info'], COMPLETE: ['Complete', 'ok'] };

AL.page('close', () => {
  AL.meLoad();
  const canManage = AL.can('accounting.period_lock.manage');
  const cal = AL.calLoad();
  const g0 = AL.gate(cal, { key: 'calendar', errorTitle: 'The fiscal calendar could not be loaded' });
  if (g0) return `<div class="v28-page">${AL.head('Control centre', 'Period Close', '')}${g0}</div>`;
  const periods = AL.closePeriods(cal.data);
  if (!AL.ui.close.period || !periods.some((p) => p.id === AL.ui.close.period)) AL.ui.close.period = AL.closeDefault(periods);
  const period = periods.find((p) => p.id === AL.ui.close.period);
  if (!period) return `<div class="v28-page">${AL.head('Control centre', 'Period Close', '')}${AL.empty('No fiscal periods are set up.')}</div>`;
  const today = AL.stiToday();
  const nearby = periods.filter((p) => String(p.startDate).slice(0, 10) <= today).slice(-15).concat(periods.filter((p) => String(p.startDate).slice(0, 10) > today).slice(0, 1));
  const picker = `<label class="v28-field al-inline"><span>Month</span><select class="v28-select" data-close-period>${nearby.map((p) => `<option value="${ae(p.id)}"${p.id === period.id ? ' selected' : ''}>${ae(p.name)}${AL.glLock(p) !== 'OPEN' ? ' (locked)' : ''}</option>`).join('')}</select></label>`;
  const locked = AL.glLock(period) !== 'OPEN';
  const e = AL.closeLoad(period.id);
  const g = AL.gate(e, { key: `close:${period.id}`, errorTitle: 'The close for this month could not be loaded' });
  const actions = [picker];
  if (canManage && !g) {
    if (!e.data.tasks.length) actions.push(AL.btn('Add standard checklist', 'close-standard'));
    actions.push(AL.btn('Add task', 'close-add'));
    actions.push(locked ? AL.btn('Reopen month', 'close-unlock', 'danger') : AL.btn('Lock month', 'close-lock', 'primary'));
  }
  const head = AL.head('Control centre', 'Period Close', `${period.name}: ${locked ? 'locked; nothing can be posted into it' : 'open for posting'}.`, actions.join(''));
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { tasks, ready, audit } = e.data;
  const t = ready.tasks || { total: 0, complete: 0 };
  const pct = t.total ? Math.round((t.complete / t.total) * 100) : 0;
  const inv = ready.investments || {}, dep = ready.depreciation || {};
  const kpis = AL.kpis([
    ['Checklist', t.total ? `${t.complete} of ${t.total}` : 'None', t.total ? `${pct}% complete` : 'No tasks yet', t.total && t.complete === t.total ? '#12b76a' : '#f79009'],
    ['Draft journals', String(ready.draftJournals ?? '—'), 'Dated in the month, not posted', ready.draftJournals ? '#f79009' : '#12b76a'],
    ['Bank lines not reconciled', ready.unreconciledBankLines == null ? '—' : String(ready.unreconciledBankLines), 'Cashbook lines in the month', ready.unreconciledBankLines ? '#f79009' : '#12b76a'],
    ['Investment interest', inv.active ? (inv.notAccruedThrough ? `${inv.notAccruedThrough} behind` : 'Up to date') : 'No investments', inv.active ? `Accrued through ${AL.date(inv.dueThrough)}` : '', inv.notAccruedThrough ? '#f79009' : '#12b76a'],
    ['Depreciation', dep.posted ? `${AL.plural(dep.posted, 'asset')} posted` : dep.pending ? `${dep.pending} not posted` : dep.lastRun && dep.lastRun.status === 'succeeded' ? 'Nothing to depreciate' : 'Not run', dep.lastRun ? `Run ${AL.dateTime(dep.lastRun.finishedAt)}` : 'For this month', (dep.posted && !dep.pending) || (dep.lastRun && dep.lastRun.status === 'succeeded' && !dep.pending) ? '#12b76a' : '#f79009'],
    ['Ledger', locked ? 'Locked' : 'Open', locked ? 'Posting into the month is refused' : 'Posting allowed', locked ? '#0878f6' : '#12b76a'],
  ]);

  // the checklist, by workstream
  const me = AL.me().id;
  const byWs = new Map();
  tasks.forEach((k) => { if (!byWs.has(k.workstream)) byWs.set(k.workstream, []); byWs.get(k.workstream).push(k); });
  const rows = [];
  byWs.forEach((list, ws) => {
    rows.push(`<tr class="al-group"><td colspan="6"><strong>${ae(ws)}</strong> <span class="v28-sub" style="display:inline">${list.filter((k) => k.status === 'COMPLETE').length} of ${list.length} complete</span></td></tr>`);
    list.forEach((k) => {
      const st = AL.taskStatus[k.status] || [k.status, 'info'];
      const mine = k.ownerId && k.ownerId === me;
      const may = canManage || (mine && k.status !== 'COMPLETE');
      const blocked = k.dependsOn && k.dependsOn.status !== 'COMPLETE';
      const acts = [];
      if (!locked && may && k.status === 'OPEN') acts.push(AL.btn('Start', 'close-task', 'small', `data-id="${ae(k.id)}" data-s="IN_PROGRESS"`));
      if (!locked && may && k.status !== 'COMPLETE') acts.push(AL.btn('Complete', 'close-task', 'small primary', `data-id="${ae(k.id)}" data-s="COMPLETE"${blocked ? ' disabled title="Waiting on its dependency"' : ''}`));
      if (!locked && canManage && k.status === 'COMPLETE') acts.push(AL.btn('Reopen', 'close-task', 'small', `data-id="${ae(k.id)}" data-s="OPEN"`));
      const overdue = k.status !== 'COMPLETE' && k.dueAt && String(k.dueAt).slice(0, 10) < today;
      rows.push(`<tr>
        <td class="al-wrap"><strong>${ae(k.task)}</strong>${k.dependsOn ? `<span class="v28-sub">After: ${ae(k.dependsOn.task)}${blocked ? ' (not done yet)' : ''}</span>` : ''}</td>
        <td>${ae(AL.jeWho(k.owner))}${mine ? '<span class="v28-sub">You</span>' : ''}</td>
        <td>${k.dueAt ? `${ae(AL.date(k.dueAt))}${overdue ? '<span class="v28-sub al-bad">Overdue</span>' : ''}` : '—'}</td>
        <td>${AL.status(st[0], st[1])}</td>
        <td>${k.completedAt ? `${ae(AL.jeWho(k.completedBy))}<span class="v28-sub">${ae(AL.dateTime(k.completedAt))}</span>` : '—'}</td>
        <td class="al-actions">${acts.join('')}</td>
      </tr>`);
    });
  });
  const checklist = AL.panel('Close checklist', locked ? 'The month is locked; reopen it to change the checklist.' : '', tasks.length ? AL.table(['Task', 'Owner', 'Due', 'Status', 'Completed', ''], rows.join(''), '980px') : AL.empty(canManage ? 'No checklist for this month yet.' : 'No checklist for this month yet; the period manager sets it up.'));

  // lock state by module, and what happened to it
  const mods = Object.keys(AL.MODULE_NAMES).map((m) => { const l = (period.moduleLocks || []).find((x) => x.moduleCode === m); const s = l ? l.lockStatus : 'OPEN'; return `<div class="v28-list-item"><div><strong>${ae(AL.MODULE_NAMES[m])}</strong><span>${ae(l && l.reason ? l.reason : '')}</span></div>${AL.status(s === 'OPEN' ? 'Open' : s === 'CLOSED' ? 'Closed' : 'Locked', s === 'OPEN' ? 'ok' : 'info')}</div>`; }).join('');
  const hist = audit.length ? AL.table(['When', 'What', 'By', 'Reason'], audit.map((a) => `<tr><td>${ae(AL.dateTime(a.createdAt))}</td><td>${ae(a.actionType === 'ATTEMPT_REJECTED' ? `Posting refused (${(a.newValue && a.newValue.action) || a.moduleCode})` : `${AL.MODULE_NAMES[a.moduleCode] || a.moduleCode}: ${(a.oldValue && a.oldValue.lockStatus) || 'Open'} → ${(a.newValue && a.newValue.lockStatus) || ''}`)}</td><td>${ae(AL.jeWho(a.performedBy))}</td><td class="al-wrap">${ae(a.reason || '')}</td></tr>`).join(''), '640px') : AL.empty('No lock changes for this month.');
  const side = `<div class="v28-grid two"><div>${AL.panel('Locks for the month', '', `<div class="al-listcol">${mods}</div>`)}</div><div>${AL.panel('Lock history', '', hist)}</div></div>`;
  return `<div class="v28-page">${head}${kpis}${checklist}${side}</div>`;
});
AL.wire.close = () => {
  const sel = document.querySelector('[data-close-period]');
  if (sel && !sel.dataset.wired) { sel.dataset.wired = '1'; sel.addEventListener('change', () => { AL.ui.close.period = sel.value; AL.redraw(); }); }
};

AL.actions['close-task'] = (el) => AL.busy(el, async () => {
  await AL.patch(`/accounting/close-tasks/tasks/${encodeURIComponent(el.dataset.id)}`, { status: el.dataset.s });
  AL.closeReload();
}, [el.dataset.s === 'COMPLETE' ? 'Task complete' : el.dataset.s === 'OPEN' ? 'Task reopened' : 'Task started', '']);
AL.actions['close-standard'] = (el) => AL.busy(el, async () => {
  const r = await AL.post(`/accounting/close-tasks/periods/${encodeURIComponent(AL.ui.close.period)}/tasks/standard`, {});
  AL.closeReload();
  return r;
}, ['Checklist added', (r) => `${AL.plural((r && r.added) || 0, 'task')} added, due on the fifth working day after month end.`]);
AL.actions['close-add'] = (el) => AL.busy(el, async () => {
  const [users, tasks] = await Promise.all([AL.get('/users?limit=500').catch(() => []), Promise.resolve((AL.cache[`close:${AL.ui.close.period}`] || {}).data)]);
  // owners come from finance: the department, or a finance role
  const staff = (Array.isArray(users) ? users : (users && (users.users || users.items)) || []).filter((u) => (u.status || 'ACTIVE') === 'ACTIVE' && (u.userDepartment === 'Finance' || /^(CFO|FIN_|ACCOUNTANT|PAYROLL|INT_AUDIT)/.test(u.roleCode || '')));
  const list = (tasks && tasks.tasks) || [];
  const ws = [...new Set(['Cash & bank', 'Payables', 'Receivables', 'Payroll', 'Fixed assets', 'Short-term investments', 'Tax', 'Financial statements', ...list.map((k) => k.workstream)])];
  AL.form({
    title: 'Add a close task', submitLabel: 'Add task', doneTitle: 'Task added',
    fields: [
      { k: 'workstream', label: 'Workstream', type: 'select', options: ws, required: true },
      { k: 'task', label: 'Task', required: true, wide: true },
      { k: 'ownerId', label: 'Owner', type: 'select', options: staff.map((u) => ({ value: u.id, label: `${[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}` })) },
      { k: 'dueAt', label: 'Due', type: 'date' },
      { k: 'dependsOnId', label: 'After (dependency)', type: 'select', options: list.map((k) => ({ value: k.id, label: k.task })), wide: true },
    ],
    onSubmit: async (v) => { await AL.post(`/accounting/close-tasks/periods/${encodeURIComponent(AL.ui.close.period)}/tasks`, { workstream: v.workstream, task: v.task, ownerId: v.ownerId || null, dueAt: v.dueAt || null, dependsOnId: v.dependsOnId || null }); return v.task; },
    after: () => AL.closeReload(),
  });
});
AL.closeCommit = async (status, reason) => {
  const pid = AL.ui.close.period;
  await AL.put('/accounting/fiscal-calendar/locks/draft', { draft: { moduleLocks: AL.CLOSE_MODULES.map((m) => ({ fiscalPeriodId: pid, moduleCode: m, lockStatus: status, reason })) } });
  return AL.post('/accounting/fiscal-calendar/locks/commit', { reason });
};
AL.actions['close-lock'] = () => {
  const d = (AL.cache[`close:${AL.ui.close.period}`] || {}).data || {};
  const r = d.ready || {}; const t = r.tasks || {};
  const notes = [];
  if (t.total && t.complete < t.total) notes.push(`${t.total - t.complete} checklist task(s) are still open: the lock is refused until they are complete.`);
  if (r.draftJournals) notes.push(`${AL.plural(r.draftJournals, 'draft journal')} dated in the month can no longer be posted once it is locked.`);
  if (r.unreconciledBankLines) notes.push(`${AL.plural(r.unreconciledBankLines, 'bank line')} in the month are not reconciled.`);
  AL.confirm({
    title: `Lock ${r.period ? r.period.name : 'the month'}`, confirmLabel: 'Lock month', doneTitle: 'Month locked', reason: 'Reason',
    body: `The general ledger, receivables, payables and bank are locked for the month: nothing can be posted, voided or reversed into it until it is reopened.${notes.length ? ' ' + notes.join(' ') : ''}`,
    onConfirm: async (v) => { const res = await AL.closeCommit('LOCKED', v.reason); return res && res.warnings && res.warnings.length ? res.warnings.join(' ') : 'Posting into the month is now refused.'; },
    after: () => AL.closeReload(),
  });
};
AL.actions['close-unlock'] = () => AL.confirm({
  title: 'Reopen the month', danger: true, confirmLabel: 'Reopen month', doneTitle: 'Month reopened', reason: 'Why it is reopened',
  body: 'Posting into the month is allowed again; the reopening and its reason are kept in the lock history.',
  onConfirm: async (v) => { await AL.closeCommit('OPEN', v.reason); return 'Posting into the month is allowed.'; },
  after: () => AL.closeReload(),
});
