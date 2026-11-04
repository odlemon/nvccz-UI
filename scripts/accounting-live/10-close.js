/* Period Close: /accounting/close — one month's close: readiness (checklist, draft journals, bank lines, investment
 * interest, depreciation), the checklist by workstream with owners and dependencies, and the lock. Locking the month
 * locks the ledger and its sub-ledgers (GL, AR, AP, BANK) and is refused while checklist tasks are open (ACC-PER-07).
 * Data: /accounting/fiscal-calendar, /accounting/close-tasks/*. */
AL.CLOSE_MODULES = ['GL', 'AR', 'AP', 'BANK'];
AL.MODULE_NAMES = { GL: 'General ledger', AR: 'Receivables', AP: 'Payables', BANK: 'Bank', IC: 'Inventory', OE: 'Orders', PO: 'Purchase orders' };
AL.ui.close = AL.ui.close || { period: '', filter: 'ALL', page: 1 };
if (!Number.isFinite(AL.ui.close.page)) AL.ui.close.page = 1;
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
    AL.get(`/accounting/fiscal-calendar/period-lock/audit?fiscalPeriodId=${encodeURIComponent(pid)}&take=12`).catch(() => []),
  ]);
  return { tasks: tasks || [], ready: ready || {}, audit: (audit || []).filter((a) => a.fiscalPeriodId === pid).slice(0, 12) };
});
AL.closeReload = () => { Object.keys(AL.cache).filter((k) => k === 'calendar' || k.startsWith('close:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.taskStatus = { OPEN: ['Open', 'warn'], IN_PROGRESS: ['In progress', 'info'], COMPLETE: ['Complete', 'ok'] };
/** The finance pool is hundreds of seeded load-test accounts that share display names — 109 distinct users are all
 *  called "Audit Tester" — so the email is the only thing that makes a person unique. Every owner option is therefore
 *  labelled "name · email": one dropdown, and the label itself disambiguates. */
AL.ownerLabel = (u) => (u && u.email ? `${AL.jeWho(u)} · ${u.email}` : AL.jeWho(u));
/** Spelled out rather than AL.plural(...,'person'), which yields "persons". */
AL.ownerPoolNote = (pool) => `${pool.length === 1 ? '1 person' : `${pool.length} people`} in finance can own a close task — start typing a name to jump to them.`;
/** Cached as a promise, not an array: every owner picker in the module shares one fetch of the staff list, so the
 *  second dialog opening in the same session is instant. A failure clears the cache so a later try can succeed. */
AL.finpoolP = null;
AL.ownerPool = () => {
  if (!AL.finpoolP) AL.finpoolP = AL.get('/users?limit=500')
    .then((users) => ((Array.isArray(users) ? users : (users && (users.users || users.items)) || [])
      .filter((u) => (u.status || 'ACTIVE') === 'ACTIVE' && (u.userDepartment === 'Finance' || /^(CFO|FIN_|ACCOUNTANT|PAYROLL|INT_AUDIT)/.test(u.roleCode || '')))
      .sort((a, b) => AL.ownerLabel(a).localeCompare(AL.ownerLabel(b)))))
    .catch((e) => { AL.finpoolP = null; throw e; });
  return AL.finpoolP;
};
/** Alphabet sections, so a 400-name list is scannable inside the dropdown itself instead of needing a search box
 *  beside it. The pool arrives sorted, so one pass over consecutive initials is enough; a person whose name does not
 *  start with a letter lands in "#" rather than being dropped. */
AL.ownerGroups = (pool) => {
  const groups = [];
  pool.forEach((u) => {
    const who = AL.jeWho(u);
    const g = /^[a-z]/i.test(who) ? who[0].toUpperCase() : '#';
    const last = groups[groups.length - 1];
    if (last && last.label === g) last.options.push({ value: u.id, label: AL.ownerLabel(u) });
    else groups.push({ label: g, options: [{ value: u.id, label: AL.ownerLabel(u) }] });
  });
  return groups;
};
/** The people list lands after the dialog has opened (it is a 2,000-row fetch), so it fills the dropdown in place and
 *  keeps the choice already made — up to then the only option is the person currently assigned. */
AL.fillOwners = (form, pool, current) => {
  const sel = form.elements.ownerId;
  if (!sel) return;
  // a current owner outside the active finance pool (moved department, deactivated) is still offered, re-sorted in so
  // the alphabet sections stay in order rather than growing a stray group at the top
  const list = current && current.id && !pool.some((u) => u.id === current.id)
    ? [current, ...pool].sort((a, b) => AL.ownerLabel(a).localeCompare(AL.ownerLabel(b)))
    : pool.slice();
  const keep = sel.value || (current && current.id) || '';
  sel.innerHTML = `<option value=""${keep ? '' : ' selected'}>Unassigned</option>${AL.ownerGroups(list).map((g) => `<optgroup label="${ae(g.label)}">${g.options.map((o) => `<option value="${ae(o.value)}"${String(o.value) === String(keep) ? ' selected' : ''}>${ae(o.label)}</option>`).join('')}</optgroup>`).join('')}`;
  const note = sel.closest('.v28-field').querySelector('small');
  if (note) note.textContent = AL.ownerPoolNote(pool);
};
/** A due date is stored at UTC midnight, so it must be read back as that UTC day and never through the viewer's local
 *  date (which would show the day before to anyone west of Greenwich). Noon UTC keeps the same calendar day for every
 *  offset the business runs in. */
AL.closeDay = (v) => AL.date(`${String(v).slice(0, 10)}T12:00:00Z`);
/** The due date as a person would say it: the day, and whether it is met, due today, coming up or how late it is. */
AL.closeDue = (dueAt, status, today) => {
  if (!dueAt) return null;
  const day = String(dueAt).slice(0, 10);
  const n = Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${String(today).slice(0, 10)}T12:00:00Z`)) / 86400000);
  const text = AL.closeDay(dueAt);
  if (status === 'COMPLETE') return { text, sub: 'Met', bad: false };
  if (n < 0) { const late = Math.abs(n); return { text, sub: `Overdue by ${late} ${late === 1 ? 'day' : 'days'}`, bad: true }; }
  if (n === 0) return { text, sub: 'Due today', bad: false };
  return { text, sub: `Due in ${n} ${n === 1 ? 'day' : 'days'}`, bad: false };
};
AL.closeOverdue = (k, today) => k.status !== 'COMPLETE' && !!k.dueAt && String(k.dueAt).slice(0, 10) < String(today).slice(0, 10);
/** The checklist rows a filter selects. The page and its export read the same list, so a file always holds exactly what
 *  is on screen. */
AL.closeFiltered = (tasks, me, today) => tasks.filter((k) => (AL.ui.close.filter === 'ALL' ? true
  : AL.ui.close.filter === 'OPEN' ? k.status !== 'COMPLETE'
  : AL.ui.close.filter === 'OVERDUE' ? AL.closeOverdue(k, today)
  : k.ownerId === me));
/** A lock state as a person reads it (also used by the lock history and its export). */
AL.closeLockWord = (s) => (s === 'CLOSED' ? 'Closed' : s === 'LOCKED' ? 'Locked' : s === 'OPEN' ? 'Open' : s || '');
/** The month's six headline figures. The KPI row and the export's summary come from this one list, so the document can
 *  never state a figure the page does not. */
AL.closeKpis = (ready, locked) => {
  const t = ready.tasks || { total: 0, complete: 0 };
  const pct = t.total ? Math.round((t.complete / t.total) * 100) : 0;
  const inv = ready.investments || {}, dep = ready.depreciation || {};
  return [
    ['Checklist', t.total ? `${t.complete} of ${t.total}` : 'None', t.total ? `${pct}% complete` : 'No tasks yet', t.total && t.complete === t.total ? '#12b76a' : '#f79009'],
    ['Draft journals', String(ready.draftJournals ?? '—'), 'Dated in the month, not posted', ready.draftJournals ? '#f79009' : '#12b76a'],
    ['Bank lines not reconciled', ready.unreconciledBankLines == null ? '—' : String(ready.unreconciledBankLines), 'Cashbook lines in the month', ready.unreconciledBankLines ? '#f79009' : '#12b76a'],
    ['Investment interest', inv.active ? (inv.notAccruedThrough ? `${inv.notAccruedThrough} behind` : 'Up to date') : 'No investments', inv.active ? `Accrued through ${AL.date(inv.dueThrough)}` : '', inv.notAccruedThrough ? '#f79009' : '#12b76a'],
    ['Depreciation', dep.posted ? `${AL.plural(dep.posted, 'asset')} posted` : dep.pending ? `${dep.pending} not posted` : dep.lastRun && dep.lastRun.status === 'succeeded' ? 'Nothing to depreciate' : 'Not run', dep.lastRun ? `Run ${AL.dateTime(dep.lastRun.finishedAt)}` : 'For this month', (dep.posted && !dep.pending) || (dep.lastRun && dep.lastRun.status === 'succeeded' && !dep.pending) ? '#12b76a' : '#f79009'],
    ['Ledger', locked ? 'Locked' : 'Open', locked ? 'Posting into the month is refused' : 'Posting allowed', locked ? '#0878f6' : '#12b76a'],
  ];
};
/** The checklist's filters, with how many tasks each one holds. */
AL.CLOSE_FILTERS = [['ALL', 'All'], ['OPEN', 'Not done'], ['OVERDUE', 'Overdue'], ['MINE', 'Assigned to me']];
AL.closeCount = (tasks, id, me, today) => (id === 'ALL' ? tasks.length
  : id === 'OPEN' ? tasks.filter((k) => k.status !== 'COMPLETE').length
  : id === 'OVERDUE' ? tasks.filter((k) => AL.closeOverdue(k, today)).length
  : tasks.filter((k) => k.ownerId && k.ownerId === me).length);
/** A shimmer that mirrors the real page (6 KPI cards, then the checklist panel with its filter chips and rows) so the
 *  month's close reads as loading rather than as a bare line, and the layout does not jump when the answer lands. */
AL.closeSkeleton = () => {
  const sk = (w, h = '14px', r = '6px') => `<span class="al-skel" style="width:${w};height:${h};border-radius:${r}"></span>`;
  const kpis = `<div class="v28-kpis">${`<div class="v28-kpi al-skel-card">${sk('45%', '10px')}<div style="height:9px"></div>${sk('62%', '22px', '8px')}<div style="height:9px"></div>${sk('80%', '10px')}</div>`.repeat(6)}</div>`;
  const widths = ['240px', '96px', '92px', '74px', '110px', '58px'];
  const row = `<tr>${widths.map((w) => `<td>${sk(w)}</td>`).join('')}</tr>`;
  const table = `<div class="al-close-table"><div class="v28-tablewrap"><table class="v28-table" style="min-width:1000px"><tbody>${row.repeat(6)}</tbody></table></div></div>`;
  const chips = `<div class="v28-tabbar al-skel-chips">${sk('64px', '32px', '999px')}${sk('96px', '32px', '999px')}${sk('88px', '32px', '999px')}${sk('144px', '32px', '999px')}</div>`;
  return `${kpis}${AL.panel('Close checklist', '', `${chips}${table}`)}`;
};

AL.page('close', () => {
  AL.meLoad();
  const canManage = AL.can('accounting.period_lock.manage');
  // ACC-PER-07 refuses a lock while tasks are open, but a holder of the lock override may lock anyway and the server
  // records it as an overridden lock with a warning — so the page must not promise a refusal that will not happen.
  const canOverride = AL.can('accounting.period_lock.override');
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
  // The hero carries the month and the one decision that belongs to the month as a whole: lock it, or reopen it. The
  // checklist's own controls sit on the checklist panel, beside the work they change.
  const actions = [picker];
  if (canManage && e.state === 'ok') actions.push(locked ? AL.btn('Reopen month', 'close-unlock', 'danger') : AL.btn('Lock month', 'close-lock', 'primary'));
  // The PDF / Excel / CSV controls close the header row, once the month's data is in — the same group the Approval Queue
  // carries, so exports look and sit the same way on both pages.
  if (e.state === 'ok') actions.push(AL.exportBtns('close-export'));
  const head = AL.head('Control centre', 'Period Close', `${period.name}: ${locked ? 'locked; nothing can be posted into it' : 'open for posting'}.`, actions.join(''));
  if (e.state === 'loading') return `<div class="v28-page">${head}${AL.closeSkeleton()}</div>`;
  const g = AL.gate(e, { key: `close:${period.id}`, errorTitle: 'The close for this month could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { tasks, ready, audit } = e.data;
  const t = ready.tasks || { total: 0, complete: 0 };
  const pct = t.total ? Math.round((t.complete / t.total) * 100) : 0;
  const kpis = AL.kpis(AL.closeKpis(ready, locked));

  // the checklist, by workstream: filtered, then paged
  const me = AL.me().id;
  const f = AL.ui.close.filter;
  const counts = {};
  AL.CLOSE_FILTERS.forEach(([id]) => { counts[id] = AL.closeCount(tasks, id, me, today); });
  const shown = AL.closeFiltered(tasks, me, today);
  // Paginate the filtered checklist (same convention as the Approval Queue and the Fixed Assets register): clamp the page
  // into range every render so a filter that shrinks the list cannot leave the pager on an empty page, then slice just
  // that page's tasks. The count is over tasks, not over the workstream headings sprinkled between them.
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
  AL.ui.close.page = Math.min(Math.max(1, AL.ui.close.page), totalPages);
  const start = (AL.ui.close.page - 1) * pageSize;
  const pageTasks = shown.slice(start, start + pageSize);
  const rows = [];
  let lastWs = null;
  pageTasks.forEach((k) => {
    // A workstream's heading is repeated on every page one of its tasks falls on, so a group split across pages is
    // never left headless; its count always describes the whole workstream, not the rows on show.
    if (k.workstream !== lastWs) {
      const list = tasks.filter((x) => x.workstream === k.workstream);
      rows.push(`<tr class="al-group"><td colspan="6"><strong>${ae(k.workstream || '—')}</strong> <span class="v28-sub" style="display:inline">${list.filter((x) => x.status === 'COMPLETE').length} of ${list.length} complete</span></td></tr>`);
      lastWs = k.workstream;
    }
    const st = AL.taskStatus[k.status] || [k.status, 'info'];
    const mine = k.ownerId && k.ownerId === me;
    const due = AL.closeDue(k.dueAt, k.status, today);
    const blocked = k.dependsOn && k.dependsOn.status !== 'COMPLETE';
    // One 'Open' affordance, as in the Approval Queue. Two or more inline buttons per row are folded into a ⋯ kebab by
    // the runtime's shared action condenser, which hid Start / Complete / Reopen behind it; they now live on the task
    // dialog, where they stay visible and describe the task they act on.
    rows.push(`<tr data-al="close-task-detail" data-id="${ae(k.id)}" tabindex="0" role="button" aria-label="Open details for ${ae(k.task)}">
      <td class="al-wrap"><strong>${ae(k.task)}</strong>${k.dependsOn ? `<span class="v28-sub">After ${ae(k.dependsOn.task)} · ${blocked ? 'not done yet' : 'done'}</span>` : ''}</td>
      <td>${ae(k.owner ? AL.jeWho(k.owner) : 'Unassigned')}${mine ? '<span class="v28-sub">You</span>' : ''}</td>
      <td>${due ? `${ae(due.text)}<span class="v28-sub${due.bad ? ' al-bad' : ''}">${ae(due.sub)}</span>` : '<span class="v28-sub">Not set</span>'}</td>
      <td>${AL.status(st[0], st[1])}</td>
      <td>${k.completedAt ? `${ae(AL.jeWho(k.completedBy))}<span class="v28-sub">${ae(AL.dateTime(k.completedAt))}</span>` : '—'}</td>
      <td class="al-actions">${AL.btn('Open', 'close-task-detail', 'small', `data-id="${ae(k.id)}"`)}</td>
    </tr>`);
  });
  const pager = totalPages > 1 ? `<div class="apq-pagination"><span>Showing ${start + 1}\u2013${Math.min(start + pageSize, shown.length)} of ${shown.length} ${shown.length === 1 ? 'task' : 'tasks'}</span><div>${AL.btn('Previous', 'close-page', 'small', `data-dir="-1"${AL.ui.close.page <= 1 ? ' disabled' : ''}`)}<span>Page ${AL.ui.close.page} of ${totalPages}</span>${AL.btn('Next', 'close-page', 'small', `data-dir="1"${AL.ui.close.page >= totalPages ? ' disabled' : ''}`)}</div></div>` : '';
  const chips = tasks.length ? `<div class="v28-tabbar">${AL.CLOSE_FILTERS.map(([id, label]) => `<button class="v28-tab ${f === id ? 'active' : ''}" data-al="close-filter" data-f="${ae(id)}">${ae(label)} (${counts[id]})</button>`).join('')}</div>` : '';
  const checklistBody = tasks.length
    ? `${chips}${shown.length ? `<div class="al-close-table">${AL.table(['Task', 'Owner', 'Due', 'Status', 'Completed', ''], rows.join(''), '1000px')}</div>${pager}` : AL.empty('No task in this month matches this filter.')}`
    : AL.empty(locked
      // the Add buttons are hidden while the month is locked, so the empty state must not point at controls that are absent
      ? 'No checklist for this month yet. Reopen the month before tasks can be added to it.'
      : canManage ? 'No checklist for this month yet. Add the standard month-end list, or a task of your own.' : 'No checklist for this month yet; the period manager sets it up.');
  // Say what the month still needs before it can be locked, in the panel's own caption, rather than only refusing the
  // Lock button once it has been clicked (ACC-PER-07).
  const checklistSub = locked
    ? 'The month is locked; reopen it to change the checklist.'
    : [t.total ? `${t.complete} of ${t.total} complete (${pct}%)` : 'No tasks yet',
      counts.OVERDUE ? `${AL.plural(counts.OVERDUE, 'task')} overdue` : '',
      t.total && t.complete < t.total ? `${AL.plural(t.total - t.complete, 'task')} still open — ${canOverride ? 'you hold the override, so the month can still be locked and that is recorded' : 'the month cannot be locked until they are done'}` : ''].filter(Boolean).join(' · ');
  const checklist = AL.panel('Close checklist', checklistSub, checklistBody,
    canManage && !locked ? `${AL.btn('Add standard checklist', 'close-standard', 'small')}${AL.btn('Add task', 'close-add', 'small')}` : '');

  // lock state by module, and what happened to it. The close governs the four ledgers it actually locks; showing the
  // other master-data modules here was three permanently-Open rows that had nothing to do with closing the month.
  const mods = AL.CLOSE_MODULES.map((m) => { const l = (period.moduleLocks || []).find((x) => x.moduleCode === m); const s = l ? l.lockStatus : 'OPEN'; return `<div class="v28-list-item"><div><strong>${ae(AL.MODULE_NAMES[m] || m)}</strong><span>${ae((l && l.reason) || (s === 'OPEN' ? 'Posting into the month is allowed' : 'Posting into the month is refused'))}</span></div>${AL.status(s === 'OPEN' ? 'Open' : s === 'CLOSED' ? 'Closed' : 'Locked', s === 'OPEN' ? 'ok' : 'info')}</div>`; }).join('');
  // Each change as one stacked record, not a table row: this column is 382px and the five-column table needed 760px, so
  // it was clipped to "…S → OPEN" behind a horizontal scrollbar that cut words mid-token. The month is not repeated per
  // row either — the panel's own caption names it and the audit is already filtered to it.
  const lockWord = AL.closeLockWord;
  const hist = audit.length ? `<div class="al-close-hist">${audit.map((a) => {
    const what = a.actionType === 'ATTEMPT_REJECTED' ? `Posting refused (${(a.newValue && a.newValue.action) || a.moduleCode})` : `${AL.MODULE_NAMES[a.moduleCode] || a.moduleCode}: ${lockWord((a.oldValue && a.oldValue.lockStatus) || 'OPEN')} → ${lockWord(a.newValue && a.newValue.lockStatus)}`;
    return `<div class="al-close-hist-row"><strong>${ae(what)}</strong><span>${ae(AL.dateTime(a.createdAt))} · ${ae(AL.jeWho(a.performedBy))}</span>${a.reason ? `<span class="al-hist-reason">${ae(a.reason)}</span>` : '<span class="al-hist-reason">No reason recorded</span>'}</div>`;
  }).join('')}</div>` : AL.empty('No lock changes for this month.');
  const side = `<div class="v28-grid two"><div>${AL.panel('Locks for the month', 'General ledger, receivables, payables and bank', `<div class="al-listcol al-close-locks">${mods}</div>`)}</div><div>${AL.panel('Lock history', `Changes for ${period.name}`, hist)}</div></div>`;
  return `<div class="v28-page">${head}${kpis}${checklist}${side}</div>`;
});
AL.wire.close = () => {
  const sel = document.querySelector('[data-close-period]');
  if (sel && !sel.dataset.wired) { sel.dataset.wired = '1'; sel.addEventListener('change', () => { AL.ui.close.period = sel.value; AL.ui.close.page = 1; AL.redraw(); }); }
};

// The task's status is moved from the dialog it is opened in, which closes first: the dialog described the task as it
// was, and the reload repaints the row behind it.
AL.actions['close-task'] = (el) => { AL.close(); return AL.busy(el, async () => {
  await AL.patch(`/accounting/close-tasks/tasks/${encodeURIComponent(el.dataset.id)}`, { status: el.dataset.s });
  AL.closeReload();
}, [el.dataset.s === 'COMPLETE' ? 'Task complete' : el.dataset.s === 'OPEN' ? 'Task reopened' : 'Task started', '']); };
AL.actions['close-filter'] = (el) => { AL.ui.close.filter = el.dataset.f; AL.ui.close.page = 1; AL.redraw(); };
AL.actions['close-page'] = (el) => { AL.ui.close.page = Math.max(1, AL.ui.close.page + Number(el.dataset.dir || 0)); AL.redraw(); };
/** What the month's export carries: the checklist as filtered on screen (with owners, due dates and completion), the six
 *  headline figures, then the module locks and the lock history — everything the page shows for this month. */
AL.closeExportSpec = () => {
  const period = AL.closePeriods((AL.cache.calendar || {}).data || {}).find((p) => p.id === AL.ui.close.period) || { name: 'Period' };
  const data = (AL.cache[`close:${AL.ui.close.period}`] || {}).data || {};
  const tasks = data.tasks || [];
  const ready = data.ready || {};
  const audit = data.audit || [];
  const today = AL.stiToday();
  const locked = AL.glLock(period) !== 'OPEN';
  const rows = AL.closeFiltered(tasks, AL.me().id, today).map((k) => {
    const due = AL.closeDue(k.dueAt, k.status, today);
    const st = AL.taskStatus[k.status] || [k.status || '—'];
    return [
      k.workstream || '—',
      k.task || '',
      k.owner ? AL.jeWho(k.owner) : 'Unassigned',
      due ? `${due.text} · ${due.sub}` : 'Not set',
      st[0],
      k.completedAt ? `${AL.jeWho(k.completedBy)} · ${AL.dateTime(k.completedAt)}` : '—',
    ];
  });
  const locks = AL.CLOSE_MODULES.map((m) => {
    const l = (period.moduleLocks || []).find((x) => x.moduleCode === m);
    const s = l ? l.lockStatus : 'OPEN';
    return [AL.MODULE_NAMES[m] || m, AL.closeLockWord(s) || s, (l && l.reason) || (s === 'OPEN' ? 'Posting into the month is allowed' : 'Posting into the month is refused')];
  });
  const history = audit.map((a) => [
    AL.dateTime(a.createdAt),
    a.actionType === 'ATTEMPT_REJECTED' ? `Posting refused (${(a.newValue && a.newValue.action) || a.moduleCode})` : `${AL.MODULE_NAMES[a.moduleCode] || a.moduleCode}: ${AL.closeLockWord((a.oldValue && a.oldValue.lockStatus) || 'OPEN')} → ${AL.closeLockWord(a.newValue && a.newValue.lockStatus)}`,
    [a.reason || 'No reason recorded', a.performedBy ? AL.jeWho(a.performedBy) : ''].filter(Boolean).join(' · '),
  ]);
  const filterLabel = (AL.CLOSE_FILTERS.find(([id]) => id === AL.ui.close.filter) || [])[1];
  return {
    title: 'Period Close',
    subtitle: `${period.name}: ${locked ? 'locked; nothing can be posted into it' : 'open for posting'}.`,
    meta: AL.closeKpis(ready, locked).map((k) => [k[0], k[1]]),
    columns: ['Workstream', 'Task', 'Owner', 'Due', 'Status', 'Completed'],
    rows,
    extra: [
      { title: 'Locks for the month', columns: ['Module', 'Status', 'Detail'], rows: locks },
      { title: 'Lock history', columns: ['When', 'What', 'Detail'], rows: history },
    ],
    note: AL.ui.close.filter === 'ALL' ? '' : `Checklist filtered to ${filterLabel || AL.ui.close.filter}; “All” exports every task in the month.`,
    landscape: true,
    filename: `period-close-${String(period.name || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`,
  };
};
AL.actions['close-export'] = (el) => AL.exportRun(el, AL.closeExportSpec(), 'checklist tasks');
AL.actions['close-task-detail'] = async (el) => {
  const data = (AL.cache[`close:${AL.ui.close.period}`] || {}).data || {};
  const task = (data.tasks || []).find((item) => item.id === el.dataset.id);
  if (!task) return;
  const period = AL.closePeriods((AL.cache.calendar || {}).data || {}).find((p) => p.id === AL.ui.close.period) || { name: 'this month' };
  const locked = AL.glLock(period) !== 'OPEN';
  const today = AL.stiToday();
  const canAssign = AL.can('accounting.period_lock.manage');
  const mine = task.ownerId && task.ownerId === AL.me().id;
  const st = AL.taskStatus[task.status] || [task.status, 'info'];
  const blocked = task.dependsOn && task.dependsOn.status !== 'COMPLETE';
  const due = AL.closeDue(task.dueAt, task.status, today);
  // an owner moves their own task along; anything else, and reopening a finished one, is the period manager's — the
  // same rule the server applies, so the dialog never offers a button that would come back refused.
  const may = canAssign || (mine && task.status !== 'COMPLETE');
  // The dialog must not wait on the staff fetch — it opens at once showing the current owner, and the full finance pool
  // drops into the select as soon as the list lands (and is cached for every dialog opened after it).
  const poolP = canAssign ? AL.ownerPool() : Promise.resolve([]);
  const staff = { list: [] };
  const initialOwner = task.owner || null;
  // What the task already is. The two things a manager can change — who owns it and when it is due — are the editable
  // fields below, so they are not also repeated here as read-only tiles.
  const facts = [
    ['Workstream', task.workstream || '—', 'Groups the checklist'],
    ['Status', AL.status(st[0], st[1]), blocked ? 'Waiting on its dependency' : ''],
    ['Dependency', task.dependsOn ? task.dependsOn.task : 'None', task.dependsOn ? (blocked ? 'Not complete yet' : 'Complete') : 'Nothing blocks this task'],
    ['Completed by', task.completedBy ? AL.jeWho(task.completedBy) : '—', task.completedAt ? AL.dateTime(task.completedAt) : 'Not completed'],
  ];
  // Someone without the planning key is offered no fields at all, so the plan must show as facts rather than disappear.
  if (!canAssign) facts.unshift(['Assigned to', task.owner ? AL.ownerLabel(task.owner) : 'Unassigned', mine ? 'That is you' : ''], ['Due', due ? `${due.text} · ${due.sub}` : 'Not set', '']);
  const acts = [];
  if (!locked && may && task.status === 'OPEN') acts.push(AL.btn('Start', 'close-task', 'small', `data-id="${ae(task.id)}" data-s="IN_PROGRESS"`));
  if (!locked && may && task.status !== 'COMPLETE') acts.push(AL.btn('Complete', 'close-task', 'small primary', `data-id="${ae(task.id)}" data-s="COMPLETE"${blocked ? ' disabled title="Waiting on its dependency"' : ''}`));
  if (!locked && canAssign && task.status === 'COMPLETE') acts.push(AL.btn('Reopen', 'close-task', 'small', `data-id="${ae(task.id)}" data-s="OPEN"`));
  const extra = `<div class="al-wide al-plan-extra">${AL.statusRows(facts)}${acts.length ? `<div class="al-detail-actions">${acts.join('')}</div>` : (locked ? '<p class="v28-sub al-detail-actions">The month is locked; reopen it before moving this task.</p>' : '')}</div>`;
  const fields = canAssign ? [
    // one dropdown does the whole job: options are "name · email" so repeats among the seeded accounts stay
    // distinguishable, alphabet sections make 400 people scannable, and the browser's own type-ahead jumps to a name
    // typed with the list open — no separate search box, which was the same control asking for input twice
    { k: 'ownerId', label: 'Assigned to', type: 'select', cols: 2, options: (initialOwner ? [initialOwner] : []).map((user) => ({ value: user.id, label: AL.ownerLabel(user) })), blankLabel: 'Unassigned', hint: 'Loading the people who can own a close task…' },
    { k: 'dueAt', label: 'Due date', type: 'date', hint: due ? `The checklist reads "${due.text} · ${due.sub}". Leave empty for no due date.` : 'Leave empty for no due date. The standard checklist is due on the fifth working day after month end.' },
  ] : [];
  AL.form({ title: task.task, sub: `${period.name} · ${task.workstream || 'Close task'}`, wide: true, viewOnly: !canAssign, submitLabel: canAssign ? 'Save plan' : 'Close', fields, initial: { ownerId: task.ownerId || '', dueAt: task.dueAt ? String(task.dueAt).slice(0, 10) : '' }, extra, onSubmit: async (values) => {
    if (!canAssign) return false;
    const owner = staff.list.find((user) => user.id === values.ownerId) || (task.owner && task.owner.id === values.ownerId ? task.owner : null);
    await AL.patch(`/accounting/close-tasks/tasks/${encodeURIComponent(task.id)}/details`, { ownerId: values.ownerId || null, dueAt: values.dueAt || null });
    AL.closeReload();
    return `${owner ? `Assigned to ${AL.jeWho(owner)}` : 'Unassigned'} · ${values.dueAt ? `due ${AL.closeDay(`${values.dueAt}T00:00:00.000Z`)}` : 'no due date'}.`;
  } });
  if (canAssign) {
    const form = document.getElementById('alForm');
    const note = form.elements.ownerId.closest('.v28-field').querySelector('small');
    poolP.then((pool) => { staff.list = pool; AL.fillOwners(form, pool, initialOwner); },
      // the due date stays editable even when the people list cannot be reached
      () => { if (note) note.textContent = 'The people list could not be loaded — reload the page to try again. The owner already set and the due date can still be saved.'; });
  }
};
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const row = event.target && event.target.closest && event.target.closest('tr[data-al="close-task-detail"]');
  if (!row || event.target.closest('button, a, input, select, textarea')) return;
  event.preventDefault();
  AL.actions['close-task-detail'](row);
});
AL.actions['close-standard'] = (el) => AL.busy(el, async () => {
  const r = await AL.post(`/accounting/close-tasks/periods/${encodeURIComponent(AL.ui.close.period)}/tasks/standard`, {});
  AL.closeReload();
  return r;
}, ['Checklist added', (r) => `${AL.plural((r && r.added) || 0, 'task')} added, due on the fifth working day after month end.`]);
AL.actions['close-add'] = (el) => AL.busy(el, async () => {
  const tasks = (AL.cache[`close:${AL.ui.close.period}`] || {}).data;
  const list = (tasks && tasks.tasks) || [];
  const ws = [...new Set(['Cash & bank', 'Payables', 'Receivables', 'Payroll', 'Fixed assets', 'Short-term investments', 'Tax', 'Financial statements', ...list.map((k) => k.workstream)])];
  // as in the plan dialog, the form opens at once and the people list arrives behind it
  const poolP = AL.ownerPool();
  AL.form({
    title: 'Add a close task', submitLabel: 'Add task', doneTitle: 'Task added',
    fields: [
      { k: 'workstream', label: 'Workstream', type: 'select', options: ws, required: true },
      // two of three columns, so it shares its row with Workstream instead of dropping to a row of its own and
      // leaving two thirds of the row empty
      { k: 'task', label: 'Task', required: true, cols: 2 },
      { k: 'ownerId', label: 'Owner', type: 'select', cols: 2, options: [], blankLabel: 'Unassigned', hint: 'Loading the people who can own a close task…' },
      { k: 'dueAt', label: 'Due', type: 'date', hint: 'The day the task is expected done; leave empty for none.' },
      { k: 'dependsOnId', label: 'After (dependency)', type: 'select', options: list.map((k) => ({ value: k.id, label: k.task })), wide: true },
    ],
    onSubmit: async (v) => { await AL.post(`/accounting/close-tasks/periods/${encodeURIComponent(AL.ui.close.period)}/tasks`, { workstream: v.workstream, task: v.task, ownerId: v.ownerId || null, dueAt: v.dueAt || null, dependsOnId: v.dependsOnId || null }); return v.task; },
    after: () => AL.closeReload(),
  });
  const form = document.getElementById('alForm');
  const note = form.elements.ownerId.closest('.v28-field').querySelector('small');
  poolP.then((pool) => AL.fillOwners(form, pool, null),
    () => { if (note) note.textContent = 'The people list could not be loaded — reload the page to try again. The task can still be added unassigned.'; });
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
  const canOverride = AL.can('accounting.period_lock.override');
  if (t.total && t.complete < t.total) {
    notes.push(canOverride
      ? `${t.total - t.complete} checklist task(s) are still open. You hold the lock override, so the month can be locked anyway and the override is recorded with it.`
      : `${t.total - t.complete} checklist task(s) are still open: the lock is refused until they are complete.`);
  }
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
