/* Access Control: /accounting/access — who can do what in Accounting, as the server decides it: the permissions, which
 * roles grant them, every active user holding any (search, role, permission), and where one person holds both halves of
 * a control. Roles and users are changed in Admin (opens in a new tab). Data: /accounting/access. */
AL.ui.acx = AL.ui.acx || { tab: 'roles', q: '', role: '', key: '', scope: 'accounting', page: 0 };
AL.acxLoad = () => AL.res('acx', () => AL.get('/accounting/access'));
AL.ACX_TIMESHEETS = ['accounting.timesheets.view', 'accounting.timesheets.manage'];

AL.page('access', () => {
  AL.meLoad();
  const e = AL.acxLoad();
  const me = AL.me();
  const admin = AL.can('accounting.access.manage') || /admin/i.test(me.role || '');
  const head = AL.head('Reporting and compliance', 'Access Control', 'Who can do what in Accounting. Nobody posts or approves their own work, whatever their role.', admin ? '<a class="v28-btn primary" href="/admin" target="_blank" rel="noopener">Manage roles and users in Admin</a>' : '');
  const g = AL.gate(e, { key: 'acx', errorTitle: 'Access could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const d = e.data || {}, u = AL.ui.acx;
  const keys = d.keys || [], label = (k) => (keys.find((x) => x.key === k) || {}).label || k;
  const acctOnly = (x) => x.keys.some((k) => !AL.ACX_TIMESHEETS.includes(k));
  const users = d.users || [];
  const kpis = AL.kpis([
    ['People with accounting access', String(users.filter(acctOnly).length), `${users.length - users.filter(acctOnly).length} more with timesheets only`],
    ['Can post journals', String(users.filter((x) => x.keys.includes('manage_ledger')).length), 'Hold "Post / approve"'],
    ['Roles', String((d.roles || []).filter(acctOnly).length), 'Granting accounting access'],
    ['Can lock periods', String(users.filter((x) => x.keys.includes('accounting.period_lock.manage')).length), `${users.filter((x) => x.keys.includes('accounting.period_lock.override')).length} may override a lock`],
  ]);
  const tabs = `<div class="v28-tabbar">${[['roles', 'Roles'], ['users', 'People'], ['pairs', 'Combined duties'], ['keys', 'Permissions']].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="acx-tab" data-t="${id}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (u.tab === 'roles') {
    const roles = (d.roles || []).filter((r) => u.scope !== 'accounting' || acctOnly(r));
    const cols = keys.filter((k) => u.scope !== 'accounting' || !AL.ACX_TIMESHEETS.includes(k.key));
    const rows = roles.map((r) => `<tr><td><strong>${ae(r.name)}</strong><span class="v28-sub">${r.users} ${r.users === 1 ? 'person' : 'people'}</span></td>${cols.map((k) => `<td class="al-center">${r.keys.includes(k.key) ? '<span class="al-ok" aria-label="yes">✓</span>' : '<span class="v28-sub" aria-label="no">·</span>'}</td>`).join('')}</tr>`).join('');
    body = `<div class="al-filters"><label class="v28-field al-check"><input type="checkbox" data-acx-f="scope"${u.scope === 'accounting' ? ' checked' : ''}> Accounting roles only (hide timesheet-only roles)</label></div>${AL.table(['Role', ...cols.map((k) => k.label)], rows, `${260 + cols.length * 92}px`)}`;
  } else if (u.tab === 'users') {
    const q = u.q.trim().toLowerCase();
    const list = users.filter((x) => (u.scope !== 'accounting' || acctOnly(x)) && (!u.role || x.role === u.role) && (!u.key || x.keys.includes(u.key)) && (!q || `${x.name} ${x.email}`.toLowerCase().includes(q)));
    const pages = Math.max(1, Math.ceil(list.length / 50)); if (u.page >= pages) u.page = pages - 1;
    const shown = list.slice(u.page * 50, u.page * 50 + 50);
    const roleNames = [...new Set(users.map((x) => x.role))].sort();
    const rows = shown.map((x) => `<tr><td><strong>${ae(x.name)}</strong><span class="v28-sub">${ae(x.email)}</span></td><td>${ae(x.role)}</td><td class="al-wrap">${ae(x.keys.map(label).join(', '))}</td><td>${x.lastLoginAt ? ae(AL.date(x.lastLoginAt)) : '<span class="v28-sub">Never</span>'}</td></tr>`).join('');
    body = `<div class="al-filters">
      <label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-acx-f="q" value="${ae(u.q)}" placeholder="Name or email"></label>
      <label class="v28-field"><span>Role</span><select class="v28-select" data-acx-f="role"><option value="">All roles</option>${roleNames.map((r) => `<option${u.role === r ? ' selected' : ''}>${ae(r)}</option>`).join('')}</select></label>
      <label class="v28-field"><span>Holds</span><select class="v28-select" data-acx-f="key"><option value="">Any permission</option>${keys.map((k) => `<option value="${ae(k.key)}"${u.key === k.key ? ' selected' : ''}>${ae(k.label)}</option>`).join('')}</select></label>
      <label class="v28-field al-check"><input type="checkbox" data-acx-f="scope"${u.scope === 'accounting' ? ' checked' : ''}> Accounting access only</label>
    </div>${rows ? AL.table(['Person', 'Role', 'Can', 'Last signed in'], rows, '980px') : AL.empty('Nobody matches.')}${pages > 1 ? `<div class="al-pager">${AL.btn('Previous', 'acx-page', 'small', `data-d="-1"${u.page <= 0 ? ' disabled' : ''}`)}<span class="v28-sub">${list.length} people · page ${u.page + 1} of ${pages}</span>${AL.btn('Next', 'acx-page', 'small', `data-d="1"${u.page >= pages - 1 ? ' disabled' : ''}`)}</div>` : ''}`;
  } else if (u.tab === 'pairs') {
    const rows = (d.pairs || []).map((p) => `<tr><td><strong>${ae(p.label)}</strong><span class="v28-sub">${ae((d.pairKeys[p.id] || []).map(label).join(' + '))}</span></td><td>${p.users}</td><td>${AL.btn('Who', 'acx-pair', 'small', `data-id="${ae(p.id)}"`)}</td></tr>`).join('');
    body = AL.table(['Both halves held by one person', 'People', ''], rows, '720px');
  } else {
    const rows = keys.map((k) => `<tr><td><strong>${ae(k.label)}</strong><span class="v28-sub">${ae(k.key)}</span></td><td class="al-wrap">${ae(k.allows)}</td><td>${users.filter((x) => x.keys.includes(k.key)).length}</td></tr>`).join('');
    body = AL.table(['Permission', 'Allows', 'People'], rows, '860px');
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Accounting access', '', `${tabs}${body}`)}</div>`;
});
AL.wire.access = () => {
  document.querySelectorAll('[data-acx-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.acxF;
    const apply = () => { AL.ui.acx[k] = k === 'scope' ? (el.checked ? 'accounting' : 'all') : el.value; AL.ui.acx.page = 0; AL.redraw(); };
    if (k === 'q') { el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') apply(); }); el.addEventListener('search', apply); } else el.addEventListener('change', apply);
  });
};
AL.actions['acx-tab'] = (el) => { AL.ui.acx.tab = el.dataset.t; AL.ui.acx.page = 0; AL.redraw(); };
AL.actions['acx-page'] = (el) => { AL.ui.acx.page = Math.max(0, AL.ui.acx.page + Number(el.dataset.d)); AL.redraw(); };
AL.actions['acx-pair'] = (el) => {
  const d = AL.cache.acx && AL.cache.acx.data; if (!d) return;
  const need = d.pairKeys[el.dataset.id] || []; const p = (d.pairs || []).find((x) => x.id === el.dataset.id) || {};
  const list = d.users.filter((x) => need.every((k) => x.keys.includes(k)));
  const rows = list.slice(0, 300).map((x) => `<tr><td>${ae(x.name)}<span class="v28-sub">${ae(x.email)}</span></td><td>${ae(x.role)}</td></tr>`).join('');
  AL.form({ title: p.label || 'Combined duties', sub: `${list.length} ${list.length === 1 ? 'person' : 'people'}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${AL.table(['Person', 'Role'], rows, '560px')}${list.length > 300 ? `<p class="v28-sub">First 300 of ${list.length}.</p>` : ''}</div>`, onSubmit: async () => false });
};
