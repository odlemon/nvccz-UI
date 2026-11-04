/* Accounting set-up: company profile, currencies and bank accounts backed by their existing APIs. */
AL.ui.set = AL.ui.set || { tab: 'banks', inactive: false, q: '', page: 1, pageSize: 10 };
AL.setLoad = () => ({
  profile: AL.res('set-profile', () => AL.get('/company-profile').catch((e) => (e && e.status === 404 ? null : Promise.reject(e)))),
  addresses: AL.res('set-addr', () => AL.get('/company-profile/addresses').catch(() => [])),
  banks: AL.res('set-banks', () => AL.get('/cashbook/banks?includeInactive=true')),
  position: AL.res('set-pos', () => AL.get('/cashbook/position').catch(() => [])),
  currencies: AL.res('set-cur', () => AL.get('/accounting/currencies')),
  rates: AL.res('set-rates', () => AL.get('/accounting/multi-currency/rates?limit=1').catch(() => null)),
});
AL.setReload = (...keys) => { keys.forEach((k) => delete AL.cache[k]); delete AL.cache['je-lookups']; AL.redraw(); };
AL.setBank = (id) => ((AL.cache['set-banks'] && AL.cache['set-banks'].data) || []).find((b) => b.id === id);
AL.setCurrency = (id) => ((AL.cache['set-cur'] && AL.cache['set-cur'].data) || []).find((c) => c.id === id);
AL.setSize = (n) => n == null ? 'Not available' : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
AL.setCompanyRows = () => {
  const pr = (AL.cache['set-profile'] && AL.cache['set-profile'].data) || {}, addresses = (AL.cache['set-addr'] && AL.cache['set-addr'].data) || [];
  const addr = addresses.find((a) => a.isActive) || {}, currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [], base = currencies.find((c) => c.isDefault) || {};
  return [['Legal name', pr.legalName], ['Registration number', pr.registrationNumber], ['Tax number', pr.taxNumber], ['Email', pr.email], ['Phone', pr.phone], ['Website', pr.website], ['Address', [addr.line1, addr.line2, addr.city, addr.country].filter(Boolean).join(', ')], ['Base currency', base.code ? `${base.code} ${base.name}` : 'Not set'], ['Time zone', pr.fiscalTimezone || 'Africa/Harare']].map(([k, v]) => [k, v || 'Not set']);
};
AL.setFilteredBanks = () => {
  const u = AL.ui.set, rows = (AL.cache['set-banks'] && AL.cache['set-banks'].data) || [], q = u.q.trim().toLowerCase();
  return rows.filter((b) => (u.inactive || b.isActive) && (!q || [b.name, b.accountNumber, b.branchCode, b.swiftCode, b.currency && b.currency.code, b.glAccount && b.glAccount.accountNo, b.glAccount && b.glAccount.accountName].some((x) => String(x || '').toLowerCase().includes(q))));
};
AL.setFilteredCurrencies = () => {
  const q = AL.ui.set.q.trim().toLowerCase(), currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [];
  return currencies.filter((c) => [c.code, c.name, c.symbol].some((x) => String(x || '').toLowerCase().includes(q)));
};
AL.setPage = (rows, pageSize) => {
  const u = AL.ui.set, pages = Math.max(1, Math.ceil(rows.length / pageSize)); u.page = Math.min(Math.max(1, u.page || 1), pages);
  return { visible: rows.slice((u.page - 1) * pageSize, u.page * pageSize), pages, start: rows.length ? (u.page - 1) * pageSize + 1 : 0, end: Math.min(u.page * pageSize, rows.length) };
};
AL.setPager = (rows, pageSize, page) => `<nav class="al-set-pager" aria-label="Settings pages"><span>Showing ${page.start}-${page.end} of ${rows.length}</span><div class="al-set-pager-tools"><label class="al-set-page-size"><span>Rows</span><select class="v28-select" data-set-page-size aria-label="Rows per page">${[5, 10, 25, 50].map((n) => `<option value="${n}"${Number(pageSize) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label><div class="al-actions"><button type="button" class="v28-btn small" data-al="set-page" data-page="${AL.ui.set.page - 1}" ${AL.ui.set.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${AL.ui.set.page} of ${page.pages}</span><button type="button" class="v28-btn small" data-al="set-page" data-page="${AL.ui.set.page + 1}" ${AL.ui.set.page >= page.pages ? 'disabled' : ''}>Next</button></div></div></nav>`;
AL.setDetailRows = (rows) => rows.map(([k, v]) => `<div class="al-set-detail-row"><span>${ae(k)}</span><strong>${ae(String(v == null || v === '' ? 'Not set' : v))}</strong></div>`).join('');
AL.setSearch = (placeholder) => `<div class="al-filters"><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-set-search value="${ae(AL.ui.set.q)}" placeholder="${ae(placeholder)}" aria-label="${ae(placeholder)}"></label></div>`;
AL.bankExportSpec = () => {
  const rows = AL.setFilteredBanks();
  return { title: 'Bank Accounts', subtitle: 'Accounting set-up', filename: 'accounting-bank-accounts', landscape: true, meta: [['Accounts', rows.length], ['Status filter', AL.ui.set.inactive ? 'Active and switched off' : 'Active accounts'], ['Search', AL.ui.set.q || 'All accounts']], columns: ['Bank account', 'Account number', 'Branch code', 'SWIFT', 'Currency', 'Ledger account', 'Cashbook balance', 'Reconciliation', 'Status'], rows: rows.map((b) => { const p = (((AL.cache['set-pos'] && AL.cache['set-pos'].data) || []).find((x) => x.bank && x.bank.id === b.id)); return [b.name, b.accountNumber || 'Not available', b.branchCode || 'Not available', b.swiftCode || 'Not available', b.currency && b.currency.code || 'Not set', b.glAccount ? `${b.glAccount.accountNo} ${b.glAccount.accountName}` : 'Not assigned', p ? AL.money(p.cashbookBalance, b.currency && b.currency.code) : 'Not available', p ? (p.unreconciledEntries ? `${p.unreconciledEntries} not reconciled` : 'All reconciled') : 'Not available', b.isActive ? 'Active' : 'Switched off']; }) };
};
AL.currencyExportSpec = () => {
  const rows = AL.setFilteredCurrencies(), currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [], base = currencies.find((c) => c.isDefault) || {}, latest = (AL.cache['set-rates'] && AL.cache['set-rates'].data && AL.cache['set-rates'].data.latest) || [];
  return { title: 'Currencies', subtitle: 'Accounting set-up and transaction currencies', filename: 'accounting-currencies', meta: [['Currencies', rows.length], ['Base currency', base.code || 'Not set'], ['Search', AL.ui.set.q || 'All currencies']], columns: ['Code', 'Currency', 'Symbol', 'Decimal places', `Latest rate per ${base.code || 'base'}`, 'Role', 'Status'], rows: rows.map((c) => { const r = latest.find((x) => x.pair === `${base.code}/${c.code}`); return [c.code, c.name, c.symbol || '', c.decimalPlaces ?? 2, c.isDefault ? '1.000000' : r ? Number(r.rate).toLocaleString('en-US', { maximumFractionDigits: 6 }) : 'No rate', c.isDefault ? 'Base currency' : 'Transaction currency', c.isActive ? 'Active' : 'Switched off']; }) };
};
AL.companyExportSpec = () => ({ title: 'Company Settings', subtitle: 'Accounting set-up', filename: 'accounting-company-settings', columns: ['Setting', 'Value'], rows: AL.setCompanyRows().filter((r) => !AL.ui.set.q || r.join(' ').toLowerCase().includes(AL.ui.set.q.toLowerCase())) });

AL.page('settings', () => {
  AL.meLoad();
  const L = AL.setLoad(), u = AL.ui.set, me = AL.me(), canBanks = AL.can('manage_ledger'), admin = /admin/i.test(me.role || ''), canCurrencies = admin || AL.can('manage_accounting'), canManageCompany = admin || AL.can('manage_accounting');
  // Company profile remains available to the existing API, but its Settings tab is hidden for now.
  if (u.tab === 'company') u.tab = 'banks';
  const g = AL.gate(L.banks, { key: 'set-banks', errorTitle: 'Settings could not be loaded' }) || AL.gate(L.currencies, { key: 'set-cur', errorTitle: 'Settings could not be loaded' });
  const banks = L.banks.data || [], currencies = L.currencies.data || [], base = currencies.find((c) => c.isDefault) || {}, pos = new Map(((L.position.data) || []).filter((p) => p.bank).map((p) => [p.bank.id, p]));
  const active = banks.filter((b) => b.isActive), kpis = AL.kpis([
    ['Bank accounts', String(active.length), `${banks.length - active.length} switched off`],
    ['Base currency', base.code || 'Not set', base.name || 'Select a base currency', base.code ? undefined : '#d92d20'],
    ['Currencies', String(currencies.filter((c) => c.isActive).length), 'Available for transactions'],
    ['Not reconciled', String(active.reduce((s, b) => s + ((pos.get(b.id) || {}).unreconciledEntries || 0), 0)), 'Bank entries across active accounts'],
  ]);
  const tabLabels = { banks: 'Bank accounts', currencies: 'Currencies' };
  const tabActions = u.tab === 'banks' ? AL.exportBtns('set-export') + (canBanks ? AL.btn('Add bank account', 'set-bank-new', 'primary') : '') : AL.exportBtns('set-export') + (canCurrencies ? AL.btn('Add currency', 'set-currency-new', 'primary') : '');
  const head = AL.head('Administration', 'Accounting settings', 'Set up the company, currency environment and linked cashbook accounts.', tabActions);
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const tabs = `<div class="v28-tabbar" role="tablist" aria-label="Accounting settings">${Object.entries(tabLabels).map(([id, label]) => `<button type="button" role="tab" aria-selected="${u.tab === id}" class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="set-tab" data-t="${id}">${label}</button>`).join('')}</div>`;
  let body = '';
  if (u.tab === 'banks') {
    const all = AL.setFilteredBanks(), page = AL.setPage(all, u.pageSize || 10), rows = page.visible.map((b) => {
      const p = pos.get(b.id);
      return `<tr class="${b.isActive ? '' : 'al-muted'}"><td><strong>${ae(b.name)}</strong><span class="v28-sub">${ae([b.accountNumber, b.branchCode && `Branch ${b.branchCode}`, b.swiftCode && `SWIFT ${b.swiftCode}`].filter(Boolean).join(' | ') || 'No account reference')}</span></td><td>${ae(b.currency && b.currency.code || 'Not set')}</td><td>${b.glAccount ? `${ae(b.glAccount.accountNo)}<span class="v28-sub">${ae(b.glAccount.accountName)}</span>` : '<span class="al-bad">Not assigned</span>'}</td><td class="num">${p ? ae(AL.money(p.cashbookBalance, b.currency && b.currency.code)) : 'Not available'}${p && p.difference ? `<span class="v28-sub al-bad">Ledger differs by ${ae(AL.money(p.difference, b.currency && b.currency.code))}</span>` : ''}</td><td>${p ? (p.unreconciledEntries ? `${p.unreconciledEntries} not reconciled` : 'All reconciled') : 'Not available'}</td><td>${b.isActive ? AL.status('Active', 'ok') : AL.status('Switched off', 'info')}</td><td class="al-actions">${AL.btn('Details', 'set-bank-detail', 'small', `data-id="${ae(b.id)}"`)}</td></tr>`;
    }).join('');
    body = `${AL.setSearch('Bank name, account number, branch, currency or ledger account')}<div class="al-filters"><label class="v28-field al-check"><input type="checkbox" data-set-f="inactive"${u.inactive ? ' checked' : ''}> Show switched-off accounts</label></div>${rows ? AL.table(['Bank account', 'Currency', 'Ledger account', 'Cashbook balance', 'Reconciliation', 'Status', 'Actions'], rows, '1100px') : AL.empty(all.length ? 'No bank accounts on this page.' : (u.q || u.inactive ? 'No bank accounts match these filters.' : 'No bank accounts have been configured.'))}${AL.setPager(all, u.pageSize || 10, page)}`;
  } else if (u.tab === 'company') {
    const rows = AL.setCompanyRows().filter((r) => !u.q || r.join(' ').toLowerCase().includes(u.q.toLowerCase())), page = AL.setPage(rows, u.pageSize || 10);
    body = `${AL.setSearch('Company name, registration, tax number, contact or address')}${L.profile.state === 'loading' ? AL.gate(L.profile) : page.visible.length ? AL.table(['Company setting', 'Value'], page.visible.map(([k, v]) => `<tr><th scope="row">${ae(k)}</th><td>${ae(v)}</td></tr>`).join(''), '720px') : AL.empty(u.q ? 'No company settings match this search.' : 'Company profile has not been configured.')}${AL.setPager(rows, u.pageSize || 10, page)}${admin ? `<div class="al-je-foot"><a class="v28-btn" href="/admin/addresses" target="_blank" rel="noopener">Manage addresses and logo</a></div>` : ''}`;
  } else {
    const all = AL.setFilteredCurrencies(), page = AL.setPage(all, u.pageSize || 10), latest = (L.rates.data && L.rates.data.latest) || [];
    const rows = page.visible.map((c) => { const r = latest.find((x) => x.pair === `${base.code}/${c.code}`); return `<tr class="${c.isActive ? '' : 'al-muted'}"><td><strong>${ae(c.code)}</strong></td><td>${ae(c.name)}</td><td>${ae(c.symbol || 'Not set')}</td><td>${ae(String(c.decimalPlaces ?? 2))}</td><td>${c.isDefault ? '1.000000' : r ? `${ae(Number(r.rate).toLocaleString('en-US', { maximumFractionDigits: 6 }))}<span class="v28-sub">${ae(AL.date(r.date))}</span>` : '<span class="v28-sub">No rate recorded</span>'}</td><td>${c.isDefault ? AL.status('Base currency', 'ok') : AL.status('Transaction currency', 'info')}</td><td>${c.isActive ? AL.status('Active', 'ok') : AL.status('Switched off', 'info')}</td><td class="al-actions">${AL.btn('Details', 'set-currency-detail', 'small', `data-id="${ae(c.id)}"`)}</td></tr>`; }).join('');
    body = `${AL.setSearch('Currency code, name or symbol')}${rows ? AL.table(['Code', 'Currency', 'Symbol', 'Decimals', `Latest rate per ${base.code || 'base'}`, 'Role', 'Status', 'Actions'], rows, '960px') : AL.empty(all.length ? 'No currencies on this page.' : u.q ? 'No currencies match this search.' : 'No currencies have been configured.')}${AL.setPager(all, u.pageSize || 10, page)}`;
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Accounting set-up', '', `${tabs}<div class="al-set-content">${body}</div>`)}</div>`;
});

AL.wire.settings = () => {
  document.querySelectorAll('[data-set-f="inactive"]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.set.inactive = el.checked; AL.ui.set.page = 1; AL.redraw(); }); });
  document.querySelectorAll('[data-set-search]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('input', () => { const caret = el.selectionStart; AL.ui.set.q = el.value; AL.ui.set.page = 1; AL.redraw(); const next = document.querySelector('[data-set-search]'); if (next) { next.focus(); next.setSelectionRange(caret, caret); } }); });
  document.querySelectorAll('[data-set-page-size]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.set.pageSize = Number(el.value) || 10; AL.ui.set.page = 1; AL.redraw(); }); });
};
AL.actions['set-tab'] = (el) => { AL.ui.set.tab = el.dataset.t; AL.ui.set.q = ''; AL.ui.set.page = 1; AL.redraw(); };
AL.actions['set-page'] = (el) => { AL.ui.set.page = Number(el.dataset.page) || 1; AL.redraw(); };
AL.actions['set-export'] = (el) => { const spec = AL.ui.set.tab === 'banks' ? AL.bankExportSpec() : AL.ui.set.tab === 'currencies' ? AL.currencyExportSpec() : AL.companyExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There is no data in this settings view.', 'bad'); return AL.exportRun(el, spec, AL.ui.set.tab === 'banks' ? 'bank accounts' : AL.ui.set.tab === 'currencies' ? 'currencies' : 'company settings'); };
AL.actions['set-bank-detail'] = (el) => {
  const b = AL.setBank(el.dataset.id); if (!b) return; const pos = ((AL.cache['set-pos'] && AL.cache['set-pos'].data) || []).find((x) => x.bank && x.bank.id === b.id), c = b.currency && b.currency.code || '';
  const detail = AL.setDetailRows([['Account number', b.accountNumber], ['Branch code', b.branchCode], ['SWIFT code', b.swiftCode], ['Currency', c], ['Ledger account', b.glAccount ? `${b.glAccount.accountNo} ${b.glAccount.accountName}` : 'Not assigned'], ['Cashbook balance', pos ? AL.money(pos.cashbookBalance, c) : 'Not available'], ['Reconciliation', pos ? (pos.unreconciledEntries ? `${pos.unreconciledEntries} not reconciled` : 'All reconciled') : 'Not available'], ['Status', b.isActive ? 'Active' : 'Switched off']]);
  const actions = AL.can('manage_ledger') ? `<div class="al-set-detail-actions">${AL.btn('Edit bank account', 'set-bank-edit', 'small', `data-id="${ae(b.id)}"`)}${b.isActive ? AL.btn('Switch off', 'set-bank-off', 'small danger', `data-id="${ae(b.id)}"`) : AL.btn('Switch on', 'set-bank-on', 'small', `data-id="${ae(b.id)}"`)}</div>` : '';
  AL.form({ title: b.name, sub: 'Bank account details', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-set-detail">${detail}${actions}</div>`, onSubmit: async () => false });
};
AL.actions['set-currency-detail'] = (el) => {
  const c = AL.setCurrency(el.dataset.id); if (!c) return; const currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [], base = currencies.find((x) => x.isDefault) || {}, rates = (AL.cache['set-rates'] && AL.cache['set-rates'].data && AL.cache['set-rates'].data.latest) || [], r = rates.find((x) => x.pair === `${base.code}/${c.code}`), canManage = /admin/i.test(AL.me().role || '') || AL.can('manage_accounting');
  const detail = AL.setDetailRows([['Currency name', c.name], ['Symbol', c.symbol], ['Decimal places', String(c.decimalPlaces ?? 2)], ['Role', c.isDefault ? 'Base currency for reporting and conversion' : 'Transaction currency'], ['Latest rate', c.isDefault ? '1.000000' : r ? Number(r.rate).toLocaleString('en-US', { maximumFractionDigits: 6 }) : 'No rate recorded'], ['Rate date', r ? AL.date(r.date) : 'Not available'], ['Status', c.isActive ? 'Active' : 'Switched off']]);
  const actions = canManage ? `<div class="al-set-detail-actions">${AL.btn('Edit currency', 'set-currency-edit', 'small', `data-id="${ae(c.id)}"`)}${!c.isDefault && c.isActive ? AL.btn('Set as base currency', 'set-currency-base', 'small', `data-id="${ae(c.id)}"`) : ''}${c.isActive && !c.isDefault ? AL.btn('Switch off', 'set-currency-off', 'small danger', `data-id="${ae(c.id)}"`) : c.isActive ? '<span class="v28-sub">The base currency must stay active. Set another currency as the base before switching this one off.</span>' : AL.btn('Switch on', 'set-currency-on', 'small', `data-id="${ae(c.id)}"`)}</div>` : '';
  AL.form({ title: `${c.code} - ${c.name}`, sub: 'Currency details', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-set-detail">${detail}${actions}</div>`, onSubmit: async () => false });
};

AL.setGlOptions = async (bank) => {
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const used = new Set(((AL.cache['set-banks'] && AL.cache['set-banks'].data) || []).filter((b) => b.isActive && (!bank || b.id !== bank.id)).map((b) => b.glAccountId));
  return ((lk.data && lk.data.accounts) || []).filter((a) => /^(Current Asset|Fixed Asset)$/.test(a.accountType) && a.accountNo !== '1000' && !used.has(a.id)).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo))).map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` }));
};
AL.actions['set-bank-new'] = (el) => AL.busy(el, async () => {
  const currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [], gl = await AL.setGlOptions(null);
  AL.form({ title: 'Add a bank account', submitLabel: 'Add account', doneTitle: 'Bank account added', fields: [{ k: 'name', label: 'Bank name', required: true, wide: true }, { k: 'accountNumber', label: 'Account number', required: true }, { k: 'currencyId', label: 'Currency', type: 'select', required: true, blank: false, options: currencies.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.code })) }, { k: 'glAccountId', label: 'Ledger account', type: 'select', blankLabel: 'Create a new ledger account', options: gl }, { k: 'branchCode', label: 'Branch code' }, { k: 'swiftCode', label: 'SWIFT code' }], initial: { currencyId: (currencies.find((c) => c.isDefault) || {}).id }, onSubmit: async (v) => { const b = await AL.post('/cashbook/banks', { ...v, glAccountId: v.glAccountId || undefined }); return `${b.name} was added.`; }, after: () => AL.setReload('set-banks', 'set-pos') });
});
AL.actions['set-bank-edit'] = (el) => AL.busy(el, async () => {
  const b = AL.setBank(el.dataset.id); if (!b) return; const used = (b._count && b._count.cashbookEntries) || 0, currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [], gl = await AL.setGlOptions(b);
  if (b.glAccount && !gl.some((o) => o.value === b.glAccountId)) gl.unshift({ value: b.glAccountId, label: `${b.glAccount.accountNo} ${b.glAccount.accountName}` });
  AL.form({ title: `Edit ${b.name}`, sub: used ? `${used} cashbook ${used === 1 ? 'entry uses' : 'entries use'} this account, so its currency and ledger account cannot be changed.` : 'Update the bank details and their general-ledger link.', submitLabel: 'Save changes', fields: [{ k: 'name', label: 'Bank name', required: true, wide: true }, { k: 'accountNumber', label: 'Account number', required: true }, ...(used ? [] : [{ k: 'currencyId', label: 'Currency', type: 'select', required: true, blank: false, options: currencies.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.code })) }, { k: 'glAccountId', label: 'Ledger account', type: 'select', required: true, options: gl }]), { k: 'branchCode', label: 'Branch code' }, { k: 'swiftCode', label: 'SWIFT code' }], initial: { name: b.name, accountNumber: b.accountNumber, currencyId: b.currencyId, glAccountId: b.glAccountId || '', branchCode: b.branchCode || '', swiftCode: b.swiftCode || '' }, onSubmit: async (v) => { const body = {}; Object.keys(v).forEach((k) => { if ((v[k] || '') !== (b[k] || '')) body[k] = v[k]; }); if (!Object.keys(body).length) throw new Error('Nothing was changed.'); await AL.put(`/cashbook/banks/${encodeURIComponent(b.id)}`, body); return 'Bank account details were updated.'; }, after: () => AL.setReload('set-banks', 'set-pos') });
});
AL.actions['set-bank-off'] = (el) => { const b = AL.setBank(el.dataset.id); if (!b) return; AL.confirm({ title: `Switch off ${b.name}`, confirmLabel: 'Switch off account', doneTitle: 'Bank account switched off', body: 'It will no longer be available for cashbook transactions. Its history is retained.', onConfirm: async () => { await AL.del(`/cashbook/banks/${encodeURIComponent(b.id)}`); return ''; }, after: () => AL.setReload('set-banks', 'set-pos') }); };
AL.actions['set-bank-on'] = (el) => AL.busy(el, async () => { await AL.put(`/cashbook/banks/${encodeURIComponent(el.dataset.id)}`, { isActive: true }); AL.setReload('set-banks', 'set-pos'); }, ['Bank account switched on', '']);

AL.actions['set-company'] = () => {
  const pr = (AL.cache['set-profile'] && AL.cache['set-profile'].data) || {}, fields = ['legalName', 'registrationNumber', 'taxNumber', 'email', 'phone', 'website'];
  AL.form({ title: 'Company details', sub: 'These details are used on company records and financial documents.', submitLabel: 'Save details', doneTitle: 'Company details saved', wide: true, fields: [{ k: 'legalName', label: 'Legal name', required: true, wide: true }, { k: 'registrationNumber', label: 'Registration number' }, { k: 'taxNumber', label: 'Tax number' }, { k: 'email', label: 'Email', type: 'email' }, { k: 'phone', label: 'Phone' }, { k: 'website', label: 'Website', wide: true }], initial: Object.fromEntries(fields.map((k) => [k, pr[k] || ''])), onSubmit: async (v) => { await AL.post('/company-profile/upsert', Object.fromEntries(fields.map((k) => [k, v[k] || null]))); return 'Company details were updated.'; }, after: () => AL.setReload('set-profile') });
};

AL.setCurrencyForm = (currency) => {
  const create = !currency, currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [], values = { code: currency && currency.code || '', name: currency && currency.name || '', symbol: currency && currency.symbol || '', isDefault: currency ? currency.isDefault : !currencies.some((c) => c.isDefault) };
  AL.form({ title: create ? 'Add a currency' : `Edit ${currency.code}`, sub: 'Set the currency code, display name and symbol. Choose the reporting base currency only when appropriate.', submitLabel: create ? 'Add currency' : 'Save currency', doneTitle: create ? 'Currency added' : 'Currency updated', fields: [{ k: 'code', label: 'Currency code', required: true }, { k: 'name', label: 'Currency name', required: true }, { k: 'symbol', label: 'Display symbol', required: true }, { k: 'isDefault', label: 'Use as the company base currency', type: 'checkbox' }], initial: values, validate: (v) => !/^[A-Z0-9]{3,8}$/i.test(v.code) ? 'Enter a valid currency code using 3 to 8 letters or numbers.' : currency && v.code.toUpperCase() !== currency.code ? 'Currency codes cannot be changed after setup. Add a new currency if a different code is needed.' : currency && currency.isDefault && !v.isDefault ? 'Choose another base currency before removing the current base currency.' : '', onSubmit: async (v) => { const payload = { code: v.code.toUpperCase(), name: v.name, symbol: v.symbol, isDefault: v.isDefault }; if (create) await AL.post('/accounting/currencies', payload); else await AL.put(`/accounting/currencies/${encodeURIComponent(currency.id)}`, payload); return create ? `${payload.code} was added.` : `${payload.code} was updated.`; }, after: () => AL.setReload('set-cur', 'set-rates', 'set-banks') });
};
AL.actions['set-currency-new'] = () => AL.setCurrencyForm(null);
AL.actions['set-currency-edit'] = (el) => { const c = AL.setCurrency(el.dataset.id); if (c) AL.setCurrencyForm(c); };
AL.actions['set-currency-base'] = (el) => { const c = AL.setCurrency(el.dataset.id); if (!c) return; AL.confirm({ title: `Set ${c.code} as the base currency?`, confirmLabel: 'Set base currency', doneTitle: 'Base currency changed', body: 'New reports and conversions will use this currency as the company reporting base. Existing transaction values remain unchanged.', onConfirm: async () => { await AL.post(`/accounting/currencies/${encodeURIComponent(c.id)}/set-default`, {}); return ''; }, after: () => AL.setReload('set-cur', 'set-rates') }); };
AL.actions['set-currency-off'] = (el) => { const c = AL.setCurrency(el.dataset.id); if (!c) return; AL.confirm({ title: `Switch off ${c.code}?`, confirmLabel: 'Switch off currency', doneTitle: 'Currency switched off', body: 'The server checks whether this currency is already used before it can be switched off.', onConfirm: async () => { await AL.del(`/accounting/currencies/${encodeURIComponent(c.id)}`); return ''; }, after: () => AL.setReload('set-cur', 'set-rates', 'set-banks') }); };
AL.actions['set-currency-on'] = (el) => AL.busy(el, async () => { await AL.put(`/accounting/currencies/${encodeURIComponent(el.dataset.id)}`, { isActive: true }); AL.setReload('set-cur', 'set-rates'); }, ['Currency switched on', '']);
