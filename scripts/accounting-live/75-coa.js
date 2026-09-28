/* Chart of Accounts: /accounting/chart-of-accounts — the accounts, their type, statement and normal balance; add an
 * account (number range checked against its type), change one (a change by anyone but the CFO or an administrator waits
 * for approval), switch one off, delete one never posted to, and see its change history. Data: /accounting/
 * chart-of-accounts, /audit-logs. */
AL.ui.coa = AL.ui.coa || { type: '', q: '', inactive: false };
AL.coaLoad = () => AL.res('coa', () => AL.get('/accounting/chart-of-accounts?includeInactive=true'));
AL.coaReload = () => { delete AL.cache.coa; delete AL.cache['je-lookups']; AL.redraw(); };
// [type, statement, number range] — the server's list; the normal balance follows from the type
AL.COA_TYPES = [['Current Asset', 'Balance Sheet', '1'], ['Fixed Asset', 'Balance Sheet', '1'], ['Long-Term Asset', 'Balance Sheet', '1'], ['Contra-Asset', 'Balance Sheet', '1'], ['Current Liability', 'Balance Sheet', '2'], ['Long-Term Liability', 'Balance Sheet', '2'], ['Equity', 'Balance Sheet', '3'], ['Revenue', 'Income Statement', '4'], ['Income', 'Income Statement', '4'], ['Expense', 'Income Statement', '5']];
AL.COA_GROUPS = [['1', 'Assets'], ['2', 'Liabilities'], ['3', 'Equity'], ['4', 'Income'], ['5', 'Expenses']];

AL.page('coa', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting');
  const e = AL.coaLoad();
  const head = AL.head('Reporting and compliance', 'Chart of Accounts', 'Account numbers follow the type: 1 assets, 2 liabilities, 3 equity, 4 income, 5 expenses.', canPrepare ? AL.btn('Add account', 'coa-new', 'primary') : '');
  const g = AL.gate(e, { key: 'coa', errorTitle: 'The chart of accounts could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const all = Array.isArray(e.data) ? e.data : (e.data && e.data.accounts) || [];
  const u = AL.ui.coa, q = u.q.trim().toLowerCase();
  const types = [...new Set(all.map((a) => a.accountType))].sort();
  const shown = all.filter((a) => (u.inactive || a.isActive !== false) && (!u.type || a.accountType === u.type) && (!q || `${a.accountNo} ${a.accountName} ${a.notes || ''}`.toLowerCase().includes(q))).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo)));
  const kpis = AL.kpis([
    ['Accounts', String(all.filter((a) => a.isActive !== false).length), `${all.filter((a) => a.isActive === false).length} switched off`],
    ...AL.COA_GROUPS.map(([d, label]) => [label, String(all.filter((a) => a.isActive !== false && String(a.accountNo).startsWith(d)).length), `${d}000s`]),
  ]);
  const filters = `<div class="al-filters"><label class="v28-field"><span>Type</span><select class="v28-select" data-coa-f="type"><option value="">All types</option>${types.map((t) => `<option${u.type === t ? ' selected' : ''}>${ae(t)}</option>`).join('')}</select></label><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-coa-f="q" value="${ae(u.q)}" placeholder="Number or name"></label><label class="v28-field al-check"><input type="checkbox" data-coa-f="inactive"${u.inactive ? ' checked' : ''}> Show switched-off accounts</label></div>`;
  const rows = shown.map((a) => {
    const acts = [AL.btn('History', 'coa-history', 'small', `data-id="${ae(a.id)}"`)];
    const used = a._count ? a._count.journalEntryLines + a._count.children : 1;
    if (canPrepare) acts.push(AL.btn('Change', 'coa-edit', 'small', `data-id="${ae(a.id)}"`));
    if (canPrepare && !used) acts.push(AL.btn('Delete', 'coa-del', 'small danger', `data-id="${ae(a.id)}"`));
    return `<tr class="${a.isActive === false ? 'al-muted' : ''}"><td><strong>${ae(a.accountNo)}</strong></td><td>${ae(a.accountName)}<span class="v28-sub">${ae([a.parentId && AL.coaFind(a.parentId) ? `Under ${AL.coaFind(a.parentId).accountNo}` : '', a._count && a._count.journalEntryLines ? `${a._count.journalEntryLines} journal line${a._count.journalEntryLines === 1 ? '' : 's'}` : 'Not used yet', a.notes || ''].filter(Boolean).join(' · '))}</span></td><td>${ae(a.accountType)}</td><td>${ae(a.financialStatement || '')}</td><td>${ae(a.naturalBalance === 'CREDIT' ? 'Credit' : a.naturalBalance === 'DEBIT' ? 'Debit' : '—')}</td><td>${a.isActive === false ? AL.status('Off', 'info') : AL.status('Active', 'ok')}</td><td class="al-actions">${acts.join('')}</td></tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Accounts', '', `${filters}${rows ? AL.table(['Number', 'Name', 'Type', 'Statement', 'Normal balance', 'Status', ''], rows, '1040px') : AL.empty('No account matches.')}`)}</div>`;
});
AL.wire.coa = () => {
  document.querySelectorAll('[data-coa-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.coaF;
    if (k === 'q') el.addEventListener('input', () => { AL.ui.coa.q = el.value; clearTimeout(AL.coaT); AL.coaT = setTimeout(() => { AL.redraw(); const n = document.querySelector('[data-coa-f="q"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    else el.addEventListener('change', () => { AL.ui.coa[k] = k === 'inactive' ? el.checked : el.value; AL.redraw(); });
  });
};
AL.coaFind = (id) => { const d = AL.cache.coa && AL.cache.coa.data; return (Array.isArray(d) ? d : (d && d.accounts) || []).find((a) => a.id === id); };
AL.coaFields = (all, a) => [
  { k: 'accountNo', label: 'Number', required: true },
  { k: 'accountName', label: 'Name', required: true },
  { k: 'accountType', label: 'Type', type: 'select', required: true, options: [...new Set([...AL.COA_TYPES.map((t) => t[0]), ...(a ? [a.accountType] : [])])] },
  { k: 'parentId', label: 'Under (heading account)', type: 'select', options: all.filter((x) => (!a || x.id !== a.id) && x.isActive !== false).sort((x, y) => String(x.accountNo).localeCompare(String(y.accountNo))).map((x) => ({ value: x.id, label: `${x.accountNo} ${x.accountName}` })) },
  { k: 'notes', label: 'Notes', type: 'textarea', wide: true },
  ...(a ? [{ k: 'isActive', label: 'Active (can be posted to)', type: 'checkbox' }] : []),
];
/** New account: every field. A change: only what was changed (the statement follows a changed type). */
AL.coaBody = (v, a) => {
  const t = AL.COA_TYPES.find((x) => x[0] === v.accountType) || [];
  const full = { accountNo: v.accountNo, accountName: v.accountName, accountType: v.accountType, financialStatement: t[1], parentId: v.parentId || null, notes: v.notes || null, isActive: v.isActive !== undefined ? !!v.isActive : true };
  if (!a) return full;
  const out = {};
  ['accountNo', 'accountName', 'parentId', 'notes', 'isActive'].forEach((k) => { if ((full[k] ?? null) !== (k === 'isActive' ? a.isActive !== false : a[k] ?? null)) out[k] = full[k]; });
  if (v.accountType !== a.accountType) { out.accountType = v.accountType; out.financialStatement = t[1]; }
  return out;
};
AL.coaCheck = (v) => { const t = AL.COA_TYPES.find((x) => x[0] === v.accountType); return t && !String(v.accountNo).startsWith(t[2]) ? `${v.accountType} accounts are numbered in the ${t[2]}000s.` : ''; };
AL.actions['coa-new'] = () => {
  const d = AL.cache.coa.data; const all = Array.isArray(d) ? d : (d && d.accounts) || [];
  AL.form({ title: 'Add an account', submitLabel: 'Add account', doneTitle: 'Account added', fields: AL.coaFields(all, null), validate: AL.coaCheck,
    onSubmit: async (v) => { if (all.some((a) => a.accountNo === v.accountNo)) throw new Error(`${v.accountNo} is already used.`); await AL.post('/accounting/chart-of-accounts', AL.coaBody(v)); return `${v.accountNo} ${v.accountName}`; }, after: () => AL.coaReload() });
};
AL.actions['coa-edit'] = (el) => {
  const a = AL.coaFind(el.dataset.id); if (!a) return;
  const d = AL.cache.coa.data; const all = Array.isArray(d) ? d : (d && d.accounts) || [];
  AL.form({ title: `Change ${a.accountNo} ${a.accountName}`, sub: a._count && a._count.journalEntryLines ? 'Posted to, so its type stays. Changes by anyone but the CFO or an administrator wait for approval.' : 'Changes by anyone but the CFO or an administrator wait for approval.', submitLabel: 'Submit change', doneTitle: 'Change submitted', fields: AL.coaFields(all, a),
    initial: { accountNo: a.accountNo, accountName: a.accountName, accountType: a.accountType, parentId: a.parentId || '', notes: a.notes || '', isActive: a.isActive !== false }, validate: AL.coaCheck,
    onSubmit: async (v) => { const body = AL.coaBody(v, a); if (!Object.keys(body).length) throw new Error('Nothing was changed.'); const r = await AL.put(`/accounting/chart-of-accounts/${encodeURIComponent(a.id)}`, body); return r && (r.status === 'pending_approval' || r.approvalRequestId) ? 'Sent for approval; the account changes once it is approved.' : 'The account is changed.'; },
    after: () => AL.coaReload() });
};
AL.actions['coa-history'] = (el) => AL.busy(el, async () => {
  const a = AL.coaFind(el.dataset.id); if (!a) return;
  const r = await AL.get(`/audit-logs?entityId=${encodeURIComponent(a.id)}&limit=50`).catch(() => null);
  const items = (r && (r.items || r.logs || r)) || [];
  const WHAT = { CREATE: 'Added', UPDATE: 'Changed', CHANGE_REQUESTED: 'Change requested', CHANGE_APPROVED: 'Change approved and applied', DELETE: 'Deleted' };
  const LABEL = { accountNo: 'Number', accountName: 'Name', accountType: 'Type', financialStatement: 'Statement', parentId: 'Under', notes: 'Notes', isActive: 'Active' };
  const show = (k, v) => (k === 'isActive' ? (v === false ? 'No' : 'Yes') : k === 'parentId' ? (v && AL.coaFind(v) ? AL.coaFind(v).accountNo : v ? v : 'none') : v == null || v === '' ? '—' : String(v));
  const detail = (x) => { const o = x.oldValues || {}, n = x.newValues || {}; if (x.action === 'CREATE') return `${n.accountNo} ${n.accountName} (${n.accountType})`; if (x.action === 'DELETE') return `${o.accountNo} ${o.accountName}`; return Object.keys(LABEL).filter((k) => k in n && (!(k in o) || String(o[k]) !== String(n[k]))).map((k) => `${LABEL[k]}: ${k in o ? `${show(k, o[k])} → ` : ''}${show(k, n[k])}`).join('; '); };
  const rows = (Array.isArray(items) ? items : []).map((x) => `<tr><td>${ae(AL.dateTime(x.timestamp || x.createdAt))}</td><td>${ae(WHAT[x.action] || x.action)}</td><td>${ae(x.admin ? [x.admin.firstName, x.admin.lastName].filter(Boolean).join(' ') || x.admin.email : '—')}</td><td class="al-wrap">${ae(detail(x))}</td></tr>`).join('');
  AL.form({ title: `${a.accountNo} ${a.accountName}: history`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${rows ? AL.table(['When', 'What', 'Who', 'Detail'], rows, '680px') : AL.empty('No recorded changes.')}</div>`, onSubmit: async () => false });
});
AL.actions['coa-del'] = (el) => {
  const a = AL.coaFind(el.dataset.id); if (!a) return;
  AL.confirm({ title: `Delete ${a.accountNo} ${a.accountName}`, danger: true, confirmLabel: 'Delete', doneTitle: 'Account deleted', body: 'Nothing has been posted to it. It is removed from the chart.',
    onConfirm: async () => { await AL.del(`/accounting/chart-of-accounts/${encodeURIComponent(a.id)}`); return ''; }, after: () => AL.coaReload() });
};
