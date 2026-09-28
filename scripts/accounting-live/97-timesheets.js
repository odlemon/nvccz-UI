/* Timesheets & Projects: /accounting/timesheets — time booked to projects. For someone who approves time: the weeks
 * waiting for them (approve, or return with what to correct; nobody approves their own), and their team's weeks. For
 * everyone with access: projects with the hours approved (billable among them) and still waiting; those who manage
 * projects add and change them. Employees enter their own time in Employee Hub. Data: /accounting/timesheets/*,
 * /accounting/projects. */
AL.ui.ts = AL.ui.ts || { tab: '', status: '' };
AL.tsLoad = (canApprove) => ({
  pending: canApprove ? AL.res('ts-pending', () => AL.get('/accounting/timesheets/pending-approval')) : null,
  team: canApprove ? AL.res('ts-team', () => AL.get('/accounting/timesheets/team')) : null,
  projects: AL.res('ts-projects', () => AL.get('/accounting/projects')),
});
AL.tsReload = () => { ['ts-pending', 'ts-team', 'ts-projects'].forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.tsHours = (t) => (t.entries || []).reduce((s, e) => s + Number(e.hours || 0), 0);
AL.tsName = (u) => (u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : '—');
AL.TS_STATUS = { DRAFT: ['Draft', 'info'], SUBMITTED: ['Waiting for approval', 'warn'], APPROVED: ['Approved', 'ok'], RETURNED: ['Returned', 'bad'] };

AL.page('timesheets', () => {
  AL.meLoad();
  const canApprove = AL.can('accounting.timesheets.manage');
  const L = AL.tsLoad(canApprove), u = { ...AL.ui.ts };
  // the default tab follows the permissions, which may arrive after the first draw
  if (!u.tab || (!canApprove && u.tab !== 'projects')) u.tab = canApprove ? 'waiting' : 'projects';
  const head = AL.head('Daily accounting', 'Timesheets & Projects', '', canApprove ? AL.btn('Add project', 'ts-proj-new', 'primary') : '');
  const g = AL.gate(L.projects, { key: 'ts-projects', errorTitle: 'Projects could not be loaded' }) || (canApprove && (AL.gate(L.pending, { key: 'ts-pending' }) || AL.gate(L.team, { key: 'ts-team' })));
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const projects = L.projects.data || [], pending = canApprove ? L.pending.data || [] : [], team = canApprove ? L.team.data || [] : [];
  const monthStart = `${AL.stiToday().slice(0, 7)}-01`;
  const approvedMonth = team.filter((t) => t.status === 'APPROVED' && String(t.weekEnding).slice(0, 10) >= monthStart).reduce((s, t) => s + AL.tsHours(t), 0);
  const kpis = AL.kpis([
    ...(canApprove ? [['Waiting for you', String(pending.length), `${pending.reduce((s, t) => s + AL.tsHours(t), 0).toLocaleString('en-US')} hours`, pending.length ? '#f79009' : '#12b76a'], ['Approved this month', `${approvedMonth.toLocaleString('en-US')} h`, 'Your team']] : []),
    ['Active projects', String(projects.filter((p) => p.isActive !== false && p.status !== 'CLOSED').length), `${projects.length} in all`],
    ['Hours approved', `${projects.reduce((s, p) => s + ((p.hours && p.hours.approved) || 0), 0).toLocaleString('en-US')} h`, `${projects.reduce((s, p) => s + ((p.hours && p.hours.billable) || 0), 0).toLocaleString('en-US')} h billable`],
  ]);
  const tabs = `<div class="v28-tabbar">${[...(canApprove ? [['waiting', `Waiting for you (${pending.length})`], ['team', 'Team']] : []), ['projects', 'Projects']].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="ts-tab" data-t="${id}">${ae(l)}</button>`).join('')}</div>`;
  const weekRow = (t, acts) => {
    const hrs = AL.tsHours(t), bill = (t.entries || []).filter((e) => e.billable).reduce((s, e) => s + Number(e.hours || 0), 0);
    const st = AL.TS_STATUS[t.status] || [t.status, 'info'];
    return `<tr>
      <td><strong>${ae(AL.tsName(t.user))}</strong><span class="v28-sub">${ae((t.user && t.user.userDepartment && (t.user.userDepartment.name || t.user.userDepartment)) || (t.user && t.user.email) || '')}</span></td>
      <td>Week to ${ae(AL.date(t.weekEnding))}</td>
      <td class="num">${hrs.toLocaleString('en-US')} h<span class="v28-sub">${bill.toLocaleString('en-US')} h billable</span></td>
      <td class="al-wrap">${ae([...new Set((t.entries || []).map((e) => e.project && e.project.name))].filter(Boolean).join(', '))}</td>
      <td>${AL.status(st[0], st[1])}${t.status === 'RETURNED' && t.returnReason ? `<span class="v28-sub">${ae(t.returnReason)}</span>` : ''}${t.approvedBy && t.status === 'APPROVED' ? `<span class="v28-sub">by ${ae(AL.tsName(t.approvedBy))}</span>` : ''}</td>
      <td class="al-actions">${acts}</td>
    </tr>`;
  };
  let body = '';
  if (u.tab === 'waiting') {
    const me = AL.me().id;
    const rows = pending.map((t) => weekRow(t, [AL.btn('Lines', 'ts-lines', 'small', `data-id="${ae(t.id)}" data-src="ts-pending"`), ...(t.userId !== me ? [AL.btn('Approve', 'ts-approve', 'small primary', `data-id="${ae(t.id)}"`), AL.btn('Return', 'ts-return', 'small danger', `data-id="${ae(t.id)}"`)] : [])].join(''))).join('');
    body = rows ? AL.table(['Person', 'Week', 'Hours', 'Projects', 'Status', ''], rows, '1040px') : AL.empty('No timesheets are waiting for you.');
  } else if (u.tab === 'team') {
    const list = team.filter((t) => !u.status || t.status === u.status).sort((a, b) => String(b.weekEnding).localeCompare(String(a.weekEnding)));
    const rows = list.map((t) => weekRow(t, AL.btn('Lines', 'ts-lines', 'small', `data-id="${ae(t.id)}" data-src="ts-team"`))).join('');
    body = `<div class="al-filters"><label class="v28-field"><span>Status</span><select class="v28-select" data-ts-f="status"><option value="">All</option>${Object.entries(AL.TS_STATUS).map(([k, v]) => `<option value="${k}"${u.status === k ? ' selected' : ''}>${ae(v[0])}</option>`).join('')}</select></label></div>${rows ? AL.table(['Person', 'Week', 'Hours', 'Projects', 'Status', ''], rows, '1040px') : AL.empty('No timesheets.')}`;
  } else {
    const rows = projects.map((p) => `<tr class="${p.isActive === false ? 'al-muted' : ''}">
      <td><strong>${ae(p.name)}</strong><span class="v28-sub">${ae([p.clientName, p.projectType].filter(Boolean).join(' · '))}</span></td>
      <td class="num">${p.budget != null ? ae(AL.money(p.budget)) : '—'}</td>
      <td class="num">${ae(((p.hours && p.hours.approved) || 0).toLocaleString('en-US'))} h<span class="v28-sub">${ae(((p.hours && p.hours.billable) || 0).toLocaleString('en-US'))} h billable</span></td>
      <td class="num">${ae(((p.hours && p.hours.waiting) || 0).toLocaleString('en-US'))} h</td>
      <td>${p.isActive === false || p.status === 'CLOSED' ? AL.status('Closed', 'info') : AL.status('Active', 'ok')}</td>
      <td class="al-actions">${canApprove ? AL.btn('Change', 'ts-proj-edit', 'small', `data-id="${ae(p.id)}"`) : ''}</td>
    </tr>`).join('');
    body = rows ? AL.table(['Project', 'Budget', 'Approved', 'Waiting', 'Status', ''], rows, '900px') : AL.empty('No projects yet.');
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Time', '', `${tabs}${body}`)}</div>`;
});
AL.wire.timesheets = () => { document.querySelectorAll('[data-ts-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.ts[el.dataset.tsF] = el.value; AL.redraw(); }); }); };
AL.actions['ts-tab'] = (el) => { AL.ui.ts.tab = el.dataset.t; AL.redraw(); };
AL.tsFind = (src, id) => ((AL.cache[src] && AL.cache[src].data) || []).find((t) => t.id === id);
AL.actions['ts-lines'] = (el) => {
  const t = AL.tsFind(el.dataset.src, el.dataset.id); if (!t) return;
  const rows = (t.entries || []).map((e) => `<tr><td>${ae(AL.date(e.date))}</td><td>${ae((e.project && e.project.name) || '')}</td><td class="num">${ae(String(Number(e.hours)))}</td><td>${e.billable ? 'Yes' : 'No'}</td><td class="al-wrap">${ae(e.notes || '')}</td></tr>`).join('');
  AL.form({ title: `${AL.tsName(t.user)} · week to ${AL.date(t.weekEnding)}`, sub: `${AL.tsHours(t)} hours`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${AL.table(['Day', 'Project', 'Hours', 'Billable', 'Notes'], rows, '640px')}</div>`, onSubmit: async () => false });
};
AL.actions['ts-approve'] = (el) => AL.busy(el, async () => { await AL.post(`/accounting/timesheets/${encodeURIComponent(el.dataset.id)}/approve`, {}); AL.tsReload(); }, ['Approved', '']);
AL.actions['ts-return'] = (el) => { const t = AL.tsFind('ts-pending', el.dataset.id); if (!t) return; AL.confirm({ title: `Return ${AL.tsName(t.user)}'s week to ${AL.date(t.weekEnding)}`, danger: true, confirmLabel: 'Return', doneTitle: 'Returned', reason: 'What needs correcting', body: 'It goes back to them to correct and submit again.', onConfirm: async (v) => { await AL.post(`/accounting/timesheets/${encodeURIComponent(t.id)}/return`, { reason: v.reason }); return ''; }, after: () => AL.tsReload() }); };
AL.tsProjectFields = [
  { k: 'name', label: 'Name', required: true, wide: true }, { k: 'clientName', label: 'Client' }, { k: 'projectType', label: 'Type' },
  { k: 'budget', label: 'Budget', type: 'number', min: 0, step: '0.01' }, { k: 'isActive', label: 'Active (time can be booked to it)', type: 'checkbox' },
];
AL.tsProjectBody = (v) => ({ name: v.name, clientName: v.clientName || null, projectType: v.projectType || null, budget: v.budget === '' ? null : Number(v.budget), isActive: !!v.isActive, status: v.isActive ? 'ACTIVE' : 'CLOSED' });
AL.actions['ts-proj-new'] = () => AL.form({ title: 'Add a project', submitLabel: 'Add', doneTitle: 'Project added', fields: AL.tsProjectFields, initial: { isActive: true }, onSubmit: async (v) => { await AL.post('/accounting/projects', AL.tsProjectBody(v)); return v.name; }, after: () => AL.tsReload() });
AL.actions['ts-proj-edit'] = (el) => { const p = AL.tsFind('ts-projects', el.dataset.id); if (!p) return; AL.form({ title: `Change ${p.name}`, submitLabel: 'Save', doneTitle: 'Project changed', fields: AL.tsProjectFields, initial: { name: p.name, clientName: p.clientName || '', projectType: p.projectType || '', budget: p.budget != null ? Number(p.budget) : '', isActive: p.isActive !== false && p.status !== 'CLOSED' }, onSubmit: async (v) => { await AL.put(`/accounting/projects/${encodeURIComponent(p.id)}`, AL.tsProjectBody(v)); return ''; }, after: () => AL.tsReload() }); };
