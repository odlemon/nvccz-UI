/* Chart of Accounts: /accounting/chart-of-accounts — the accounts, their type, statement and normal balance; add an
 * account (number range checked against its type), change one (a change by anyone but the CFO or an administrator waits
 * for approval), switch one off, delete one never posted to, and see its change history. Data: /accounting/
 * chart-of-accounts, /audit-logs. */
AL.ui.coa = AL.ui.coa || { type: '', q: '', inactive: false, page: 1, expanded: {} };
AL.ui.coa.page = AL.ui.coa.page || 1;
AL.ui.coa.expanded = AL.ui.coa.expanded || {};
AL.coaLoad = () => AL.res('coa', () => AL.get('/accounting/chart-of-accounts?includeInactive=true'));
AL.coaReload = () => { delete AL.cache.coa; delete AL.cache['je-lookups']; AL.redraw(); };
// [type, statement, number range] — the server's list; the normal balance follows from the type
AL.COA_TYPES = [['Current Asset', 'Balance Sheet', '1'], ['Fixed Asset', 'Balance Sheet', '1'], ['Long-Term Asset', 'Balance Sheet', '1'], ['Contra-Asset', 'Balance Sheet', '1'], ['Current Liability', 'Balance Sheet', '2'], ['Long-Term Liability', 'Balance Sheet', '2'], ['Equity', 'Balance Sheet', '3'], ['Revenue', 'Income Statement', '4'], ['Income', 'Income Statement', '4'], ['Expense', 'Income Statement', '5']];
AL.COA_GROUPS = [['1', 'Assets'], ['2', 'Liabilities'], ['3', 'Equity'], ['4', 'Income'], ['5', 'Expenses']];
AL.coaFiltered = (all, u = AL.ui.coa) => {
  const q = String(u.q || '').trim().toLowerCase(), byId = new Map(all.map((a) => [a.id, a]));
  const direct = new Set(all.filter((a) => !q || `${a.accountNo} ${a.accountName} ${a.notes || ''}`.toLowerCase().includes(q)).map((a) => a.id));
  const related = new Set(direct);
  all.forEach((a) => { let parent = byId.get(a.parentId); while (parent) { if (direct.has(parent.id)) related.add(a.id); if (direct.has(a.id)) related.add(parent.id); parent = byId.get(parent.parentId); } });
  return all.filter((a) => (u.inactive || a.isActive !== false) && (!u.type || a.accountType === u.type) && related.has(a.id)).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo)));
};
AL.coaExportSpec = () => {
  const data = AL.cache.coa && AL.cache.coa.data, all = Array.isArray(data) ? data : (data && data.accounts) || [], u = AL.ui.coa;
  const rows = AL.coaFiltered(all, u), lookup = new Map(all.map((a) => [a.id, a]));
  return { title: 'Chart of Accounts', subtitle: 'Account structure and posting attributes used by the general ledger and financial statements.', filename: 'accounting-chart-of-accounts', landscape: true,
    meta: [['Accounts', String(rows.length)], ['Type', u.type || 'All types'], ['Status', u.inactive ? 'Active and switched off' : 'Active'], ['Search', u.q || 'All accounts']],
    columns: ['Account number', 'Account name', 'Account type', 'Financial statement', 'Normal balance', 'Parent account', 'Status', 'Journal lines', 'Sub accounts', 'Notes'],
    rows: rows.map((a) => [a.accountNo, a.accountName, a.accountType, a.financialStatement || '', a.naturalBalance === 'CREDIT' ? 'Credit' : a.naturalBalance === 'DEBIT' ? 'Debit' : '', a.parentId && lookup.has(a.parentId) ? lookup.get(a.parentId).accountNo : '', a.isActive === false ? 'Switched off' : 'Active', a._count?.journalEntryLines || 0, a._count?.children || 0, a.notes || '']),
    note: 'Account IDs are omitted. Sub-accounts are included in the export regardless of their current expanded or collapsed display state.' };
};

AL.page('coa', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting');
  const e = AL.coaLoad();
  const head = AL.head('Reporting and compliance', 'Chart of Accounts', 'Account numbers follow the type: 1 assets, 2 liabilities, 3 equity, 4 income, 5 expenses.', `${AL.exportBtns('coa-export')}${canPrepare ? AL.btn('Add account', 'coa-new', 'primary') : ''}`);
  const g = AL.gate(e, { key: 'coa', errorTitle: 'The chart of accounts could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const all = Array.isArray(e.data) ? e.data : (e.data && e.data.accounts) || [];
  const u = AL.ui.coa;
  const types = [...new Set(all.map((a) => a.accountType))].sort();
  const shown = AL.coaFiltered(all, u);
  const visibleIds = new Set(shown.map((a) => a.id));
  const byParent = new Map();
  shown.forEach((a) => {
    const parentId = a.parentId && visibleIds.has(a.parentId) ? a.parentId : null;
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(a);
  });
  const flattened = [];
  const flatten = (items, depth) => (items || []).forEach((a) => {
    const subAccounts = byParent.get(a.id) || [];
    flattened.push({ ...a, _depth: depth, _subAccounts: subAccounts.length });
    if (subAccounts.length && u.expanded[a.id] !== false) flatten(subAccounts, depth + 1);
  });
  flatten(byParent.get(null), 0);
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(flattened.length / pageSize));
  if (u.page > pageCount) u.page = pageCount;
  const pageStart = (u.page - 1) * pageSize;
  const pageRows = flattened.slice(pageStart, pageStart + pageSize);
  const kpis = AL.kpis([
    ['Accounts', String(all.filter((a) => a.isActive !== false).length), `${all.filter((a) => a.isActive === false).length} switched off`],
    ...AL.COA_GROUPS.map(([d, label]) => [label, String(all.filter((a) => a.isActive !== false && String(a.accountNo).startsWith(d)).length), `${d}000s`]),
  ]);
  const filters = `<div class="al-filters"><label class="v28-field"><span>Type</span><select class="v28-select" data-coa-f="type"><option value="">All types</option>${types.map((t) => `<option${u.type === t ? ' selected' : ''}>${ae(t)}</option>`).join('')}</select></label><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-coa-f="q" value="${ae(u.q)}" placeholder="Number or name"></label><label class="v28-field al-check"><input type="checkbox" data-coa-f="inactive"${u.inactive ? ' checked' : ''}> Show switched-off accounts</label></div>`;
  const rows = pageRows.map((a) => {
    const acts = [AL.btn('History', 'coa-history', 'small', `data-id="${ae(a.id)}"`)];
    const used = a._count ? a._count.journalEntryLines + a._count.children : 1;
    if (canPrepare) acts.push(AL.btn('Change', 'coa-edit', 'small', `data-id="${ae(a.id)}"`));
    if (canPrepare && !used) acts.push(AL.btn('Delete', 'coa-del', 'small danger', `data-id="${ae(a.id)}"`));
    const expanded = a._subAccounts > 0 && u.expanded[a.id] !== false;
    const toggle = a._subAccounts ? `<button type="button" class="al-coa-expand" data-al="coa-expand" data-coa-expand="${ae(a.id)}" aria-label="${expanded ? 'Collapse' : 'Expand'} sub accounts" aria-expanded="${expanded}">${expanded ? '−' : '+'}</button>` : '<span class="al-coa-expand-spacer"></span>';
    const label = `${toggle}<span style="padding-left:${a._depth * 18}px"><strong>${ae(a.accountNo)}</strong></span>`;
    return `<tr class="${a.isActive === false ? 'al-muted' : ''}" data-al="coa-detail" data-id="${ae(a.id)}" tabindex="0" role="button" aria-label="Open ${ae(a.accountNo)} ${ae(a.accountName)} details"><td>${label}</td><td>${a._depth ? '<span class="v28-sub">Sub account</span>' : ''}${ae(a.accountName)}<span class="v28-sub">${ae([a.parentId && AL.coaFind(a.parentId) ? `Under ${AL.coaFind(a.parentId).accountNo}` : '', a._count && a._count.journalEntryLines ? `${a._count.journalEntryLines} journal line${a._count.journalEntryLines === 1 ? '' : 's'}` : 'Not used yet', a.notes || ''].filter(Boolean).join(' · '))}</span></td><td>${ae(a.accountType)}</td><td>${ae(a.financialStatement || '')}</td><td>${ae(a.naturalBalance === 'CREDIT' ? 'Credit' : a.naturalBalance === 'DEBIT' ? 'Debit' : '—')}</td><td>${a.isActive === false ? AL.status('Off', 'info') : AL.status('Active', 'ok')}</td><td class="al-actions">${acts.join('')}</td></tr>`;
  }).join('');
  const pagination = flattened.length ? `<div class="al-pagination" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 4px 2px;min-height:44px;border-top:1px solid #e7eef6;background:#fff"><span class="v28-sub">Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, flattened.length)} of ${flattened.length} accounts</span><span style="display:flex;gap:8px;align-items:center"><button type="button" class="v28-button small" data-al="coa-page-prev" data-coa-page="prev" ${u.page <= 1 ? 'disabled' : ''}>Previous</button><span class="v28-sub">Page ${u.page} of ${pageCount}</span><button type="button" class="v28-button small" data-al="coa-page-next" data-coa-page="next" ${u.page >= pageCount ? 'disabled' : ''}>Next</button></span></div>` : '';
  const table = rows ? AL.table(['Number', 'Name', 'Type', 'Statement', 'Normal balance', 'Status', ''], rows, '1040px').replace('class="v28-tablewrap"', 'class="v28-tablewrap al-coa-tablewrap"') : AL.empty('No account matches.');
  return `<div class="v28-page">${head}${kpis}<div class="al-coa-panel">${AL.panel('Accounts', '', `${filters}${table}${pagination}`)}</div></div>`;
});
AL.wire.coa = () => {
  document.querySelectorAll('[data-coa-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.coaF;
    if (k === 'q') el.addEventListener('input', () => { AL.ui.coa.q = el.value; AL.ui.coa.page = 1; clearTimeout(AL.coaT); AL.coaT = setTimeout(() => { AL.redraw(); const n = document.querySelector('[data-coa-f="q"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    else el.addEventListener('change', () => { AL.ui.coa[k] = k === 'inactive' ? el.checked : el.value; AL.ui.coa.page = 1; AL.redraw(); });
  });
  document.querySelectorAll('[data-coa-expand]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    el.addEventListener('click', (event) => { event.stopPropagation(); const id = el.dataset.coaExpand; AL.ui.coa.expanded[id] = AL.ui.coa.expanded[id] === false; AL.ui.coa.page = 1; AL.redraw(); });
  });
  document.querySelectorAll('[data-coa-page]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    el.addEventListener('click', (event) => { event.stopPropagation(); const next = el.dataset.coaPage === 'next'; AL.ui.coa.page = Math.max(1, AL.ui.coa.page + (next ? 1 : -1)); AL.redraw(); });
  });
};
AL.actions['coa-export'] = (el) => { const spec = AL.coaExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There are no accounts in this view.', 'bad'); return AL.exportRun(el, spec, 'accounts'); };
AL.actions['coa-page-prev'] = () => { AL.ui.coa.page = Math.max(1, AL.ui.coa.page - 1); AL.redraw(); };
AL.actions['coa-page-next'] = () => { AL.ui.coa.page += 1; AL.redraw(); };
AL.actions['coa-expand'] = (el, event) => {
  event?.stopPropagation();
  const id = el.dataset.coaExpand;
  if (!id) return;
  AL.ui.coa.expanded[id] = AL.ui.coa.expanded[id] === false;
  AL.ui.coa.page = 1;
  AL.redraw();
};
AL.coaFind = (id) => { const d = AL.cache.coa && AL.cache.coa.data; return (Array.isArray(d) ? d : (d && d.accounts) || []).find((a) => a.id === id); };
AL.actions['coa-detail'] = (el) => {
  const a = AL.coaFind(el.dataset.id); if (!a) return;
  const parent = a.parentId && AL.coaFind(a.parentId);
  const coaData = AL.cache.coa && AL.cache.coa.data;
  const coaAccounts = Array.isArray(coaData) ? coaData : (coaData && coaData.accounts) || [];
  const subAccounts = coaAccounts.filter((x) => x.parentId === a.id);
  const subList = subAccounts.length ? subAccounts.map((x) => `${x.accountNo} ${x.accountName}`).join(' · ') : 'None';
  const journalCount = a._count?.journalEntryLines || 0;
  const subButton = subAccounts.length ? `<button type="button" class="v28-btn small" data-al="coa-subaccounts" data-id="${ae(a.id)}">View sub accounts</button>` : '<span>None</span>';
  const journalButton = journalCount ? `<button type="button" class="v28-btn small" data-al="coa-journals" data-id="${ae(a.id)}">View journal entries</button>` : '<span>None</span>';
  const raw = (v) => typeof v === 'string' && v.startsWith('<') ? v : ae(v);
  const detail = [['Number', a.accountNo], ['Name', a.accountName], ['Type', a.accountType], ['Statement', a.financialStatement || '—'], ['Normal balance', a.naturalBalance === 'CREDIT' ? 'Credit' : a.naturalBalance === 'DEBIT' ? 'Debit' : '—'], ['Parent', parent ? `${parent.accountNo} ${parent.accountName}` : '—'], ['Status', a.isActive === false ? 'Switched off' : 'Active'], ['Journal lines', journalButton], ['Sub accounts', subButton], ['Sub-account list', subList], ['Notes', a.notes || '—']].map(([k, v]) => `<div class="v28-list-item"><div><strong>${ae(k)}</strong><span>${raw(v)}</span></div></div>`).join('');
  AL.form({ title: `${a.accountNo} ${a.accountName}`, sub: 'Chart of Accounts detail', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide"><div class="v28-grid equal">${detail}</div><div style="margin-top:16px">${AL.btn('Edit account', 'coa-edit', 'primary', `data-id="${ae(a.id)}"`)}</div></div>`, onSubmit: async () => false });
};
AL.actions['coa-subaccounts'] = (el) => {
  const a = AL.coaFind(el.dataset.id); if (!a) return;
  const data = AL.cache.coa && AL.cache.coa.data, all = Array.isArray(data) ? data : (data && data.accounts) || [];
  const children = all.filter((x) => x.parentId === a.id);
  const rows = children.map((x) => `<tr><td>${ae(x.accountNo)}</td><td>${ae(x.accountName)}</td><td>${ae(x.accountType)}</td><td>${x._count?.journalEntryLines || 0}</td><td>${x.isActive === false ? 'Switched off' : 'Active'}</td></tr>`).join('');
  AL.form({ title: `${a.accountNo} ${a.accountName}: Sub accounts`, sub: 'Accounts underneath this heading account', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide al-coa-child-list">${rows ? `<div class="al-coa-scroll"><table class="v28-table"><thead><tr><th>Number</th><th>Name</th><th>Type</th><th>Journal lines</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>` : AL.empty('No sub accounts found.')}</div>`, onSubmit: async () => false });
  AL.coaReturnDetailId = a.id;
};
AL.actions['coa-journals'] = (el) => AL.busy(el, async () => {
  const a = AL.coaFind(el.dataset.id); if (!a) return;
  const r = await AL.getRaw('/accounting/journal-entries?status=ALL&limit=500&offset=0');
  const entries = (r && r.data) || [];
  const lines = entries.flatMap((j) => (j.journalEntryLines || j.lines || []).filter((l) => l.chartOfAccountId === a.id).map((l) => ({ ...l, journal: j })));
  const rows = lines.map((x) => `<tr><td>${ae(AL.dateTime(x.journal.transactionDate || x.journal.date || x.journal.createdAt))}</td><td>${ae(x.journal.referenceNumber || x.journal.reference || '—')}</td><td>${ae(x.journal.description || '—')}</td><td>${ae(x.description || '—')}</td><td>${x.debitAmount ? ae(AL.money(x.debitAmount)) : '—'}</td><td>${x.creditAmount ? ae(AL.money(x.creditAmount)) : '—'}</td><td>${ae(x.journal.status || '—')}</td></tr>`).join('');
  AL.form({ title: `${a.accountNo} ${a.accountName}: Journal entries`, sub: `${lines.length} matching journal line${lines.length === 1 ? '' : 's'}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide al-coa-journal-list"><div class="al-coa-scroll">${rows ? `<table class="v28-table"><thead><tr><th>Date</th><th>Reference</th><th>Journal</th><th>Line</th><th>Debit</th><th>Credit</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : AL.empty('No journal entries found for this account.')}</div></div>`, onSubmit: async () => false });
  AL.coaReturnDetailId = a.id;
 });
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
