/* Settings: /accounting/settings — the organisation's accounting set-up as the server holds it. Company (letterhead,
 * base currency, the tenant's clock), bank accounts (each with its own ledger account, balance and reconciliation state:
 * add, change, switch off only when nothing is left in it) and currencies. Addresses and the logo are kept in Admin (new
 * tab); the letterhead is edited here by an administrator. Data: /company-profile, /cashbook/banks, /cashbook/position, /accounting/currencies, /accounting/multi-currency/rates. */
AL.ui.set = AL.ui.set || { tab: 'banks', inactive: false };
AL.setLoad = () => ({
  profile: AL.res('set-profile', () => AL.get('/company-profile').catch((e) => (e && e.status === 404 ? null : Promise.reject(e)))),
  addresses: AL.res('set-addr', () => AL.get('/company-profile/addresses').catch(() => [])),
  banks: AL.res('set-banks', () => AL.get('/cashbook/banks?includeInactive=true')),
  position: AL.res('set-pos', () => AL.get('/cashbook/position').catch(() => [])),
  currencies: AL.res('set-cur', () => AL.get('/accounting/currencies')),
  rates: AL.res('set-rates', () => AL.get('/accounting/multi-currency/rates?limit=1').catch(() => null)),
});
AL.setReload = (...keys) => { keys.forEach((k) => delete AL.cache[k]); delete AL.cache['je-lookups']; AL.redraw(); };

AL.page('settings', () => {
  AL.meLoad();
  const L = AL.setLoad(), u = AL.ui.set;
  const me = AL.me();
  const canBanks = AL.can('manage_ledger');
  const admin = /admin/i.test(me.role || '');
  const head = AL.head('Administration', 'Settings', '');
  const g = AL.gate(L.banks, { key: 'set-banks', errorTitle: 'Settings could not be loaded' }) || AL.gate(L.currencies, { key: 'set-cur', errorTitle: 'Settings could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const banks = L.banks.data || [], currencies = L.currencies.data || [];
  const base = currencies.find((c) => c.isDefault) || {};
  const pos = new Map(((L.position.data) || []).map((p) => [p.bank.id, p]));
  const active = banks.filter((b) => b.isActive);
  const kpis = AL.kpis([
    ['Bank accounts', String(active.length), `${banks.length - active.length} switched off`],
    ['Base currency', base.code || '—', base.name || 'None set', base.code ? undefined : '#d92d20'],
    ['Currencies', String(currencies.filter((c) => c.isActive).length), 'In use'],
    ['Not reconciled', String(active.reduce((s, b) => s + ((pos.get(b.id) || {}).unreconciledEntries || 0), 0)), 'Bank entries, all accounts'],
  ]);
  const tabs = `<div class="v28-tabbar">${[['banks', 'Bank accounts'], ['company', 'Company'], ['currencies', 'Currencies']].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="set-tab" data-t="${id}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (u.tab === 'banks') {
    const list = banks.filter((b) => u.inactive || b.isActive);
    const rows = list.map((b) => {
      const p = pos.get(b.id);
      const acts = [];
      if (canBanks) acts.push(AL.btn('Change', 'set-bank-edit', 'small', `data-id="${ae(b.id)}"`), b.isActive ? AL.btn('Switch off', 'set-bank-off', 'small', `data-id="${ae(b.id)}"`) : AL.btn('Switch on', 'set-bank-on', 'small', `data-id="${ae(b.id)}"`));
      return `<tr class="${b.isActive ? '' : 'al-muted'}">
        <td><strong>${ae(b.name)}</strong><span class="v28-sub">${ae([b.accountNumber, b.branchCode && `branch ${b.branchCode}`, b.swiftCode].filter(Boolean).join(' · '))}</span></td>
        <td>${ae((b.currency && b.currency.code) || '—')}</td>
        <td>${b.glAccount ? `${ae(b.glAccount.accountNo)}<span class="v28-sub">${ae(b.glAccount.accountName)}</span>` : '<span class="al-bad">None</span>'}</td>
        <td class="num">${p ? ae(AL.money(p.cashbookBalance, b.currency && b.currency.code)) : '—'}${p && p.difference ? `<span class="v28-sub al-bad">Ledger differs by ${ae(AL.money(p.difference, b.currency && b.currency.code))}</span>` : ''}</td>
        <td>${p ? (p.unreconciledEntries ? `${p.unreconciledEntries} not reconciled` : 'All reconciled') : '—'}</td>
        <td>${b.isActive ? AL.status('Active', 'ok') : AL.status('Off', 'info')}</td>
        <td class="al-actions">${acts.join('')}</td>
      </tr>`;
    }).join('');
    body = `<div class="al-filters"><label class="v28-field al-check"><input type="checkbox" data-set-f="inactive"${u.inactive ? ' checked' : ''}> Show switched-off accounts</label><span class="al-grow"></span>${canBanks ? AL.btn('Add bank account', 'set-bank-new', 'primary') : ''}</div>${rows ? AL.table(['Bank account', 'Currency', 'Ledger account', 'Cashbook balance', 'Reconciliation', 'Status', ''], rows, '1100px') : AL.empty('No bank accounts.')}`;
  } else if (u.tab === 'company') {
    const pr = L.profile.state === 'ok' ? L.profile.data : null;
    const addr = ((L.addresses.data) || []).find((a) => a.isActive) || null;
    const row = (k, v) => `<tr><td>${ae(k)}</td><td>${v ? ae(v) : '<span class="v28-sub">Not set</span>'}</td></tr>`;
    body = L.profile.state === 'loading' ? AL.gate(L.profile) : AL.table(['', ''], [
      row('Legal name', pr && pr.legalName),
      row('Registration number', pr && pr.registrationNumber),
      row('Tax number', pr && pr.taxNumber),
      row('Email', pr && pr.email),
      row('Phone', pr && pr.phone),
      row('Website', pr && pr.website),
      row('Address', addr && [addr.line1, addr.line2, addr.city, addr.country].filter(Boolean).join(', ')),
      row('Base currency', base.code && `${base.code} · ${base.name}`),
      row('Time zone', (pr && pr.fiscalTimezone) || 'Africa/Harare'),
    ].join(''), '560px') + (admin ? `<div class="al-je-foot">${AL.btn('Edit company details', 'set-company', 'primary')}<a class="v28-btn" href="/admin/addresses" target="_blank" rel="noopener">Addresses and logo in Admin</a></div>` : '');
  } else {
    const latest = (L.rates.data && L.rates.data.latest) || [];
    const rows = currencies.map((c) => {
      const r = latest.find((x) => x.pair === `${base.code}/${c.code}`);
      return `<tr class="${c.isActive ? '' : 'al-muted'}"><td><strong>${ae(c.code)}</strong><span class="v28-sub">${ae(c.name)}</span></td><td>${ae(c.symbol || '')}</td><td>${ae(String(c.decimalPlaces ?? 2))}</td><td>${c.isDefault ? AL.status('Base', 'ok') : r ? `${ae(Number(r.rate).toLocaleString('en-US', { maximumFractionDigits: 6 }))}<span class="v28-sub">${ae(AL.date(r.date))}</span>` : '<span class="v28-sub">No rate</span>'}</td><td>${c.isActive ? AL.status('Active', 'ok') : AL.status('Off', 'info')}</td></tr>`;
    }).join('');
    body = AL.table(['Currency', 'Symbol', 'Decimals', `Latest rate per ${base.code || 'base'}`, 'Status'], rows, '760px');
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Accounting set-up', '', `${tabs}${body}`)}</div>`;
});
AL.wire.settings = () => {
  document.querySelectorAll('[data-set-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.set.inactive = el.checked; AL.redraw(); }); });
};
AL.actions['set-tab'] = (el) => { AL.ui.set.tab = el.dataset.t; AL.redraw(); };
AL.setBank = (id) => ((AL.cache['set-banks'] && AL.cache['set-banks'].data) || []).find((b) => b.id === id);
/** Asset accounts a bank can post to: not the reporting bucket, not already another active bank's. */
AL.setGlOptions = async (bank) => {
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const used = new Set(((AL.cache['set-banks'] && AL.cache['set-banks'].data) || []).filter((b) => b.isActive && (!bank || b.id !== bank.id)).map((b) => b.glAccountId));
  return ((lk.data && lk.data.accounts) || []).filter((a) => /^(Current Asset|Fixed Asset)$/.test(a.accountType) && a.accountNo !== '1000' && !used.has(a.id)).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo))).map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` }));
};
AL.actions['set-bank-new'] = (el) => AL.busy(el, async () => {
  const currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [];
  const gl = await AL.setGlOptions(null);
  AL.form({ title: 'Add a bank account', submitLabel: 'Add', doneTitle: 'Bank account added', fields: [
    { k: 'name', label: 'Name', required: true, wide: true },
    { k: 'accountNumber', label: 'Account number', required: true },
    { k: 'currencyId', label: 'Currency', type: 'select', required: true, blank: false, options: currencies.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.code })) },
    { k: 'glAccountId', label: 'Ledger account', type: 'select', blankLabel: 'Create a new one for this bank', options: gl },
    { k: 'branchCode', label: 'Branch code' },
    { k: 'swiftCode', label: 'SWIFT code' },
  ], initial: { currencyId: (currencies.find((c) => c.isDefault) || {}).id },
  onSubmit: async (v) => { const b = await AL.post('/cashbook/banks', { ...v, glAccountId: v.glAccountId || undefined }); return `${b.name}${b.glAccount ? ` posts to ${b.glAccount.accountNo}` : ''}.`; },
  after: () => AL.setReload('set-banks', 'set-pos') });
});
AL.actions['set-bank-edit'] = (el) => AL.busy(el, async () => {
  const b = AL.setBank(el.dataset.id); if (!b) return;
  const used = (b._count && b._count.cashbookEntries) || 0;
  const currencies = (AL.cache['set-cur'] && AL.cache['set-cur'].data) || [];
  const gl = await AL.setGlOptions(b);
  if (b.glAccount && !gl.some((o) => o.value === b.glAccountId)) gl.unshift({ value: b.glAccountId, label: `${b.glAccount.accountNo} ${b.glAccount.accountName}` });
  AL.form({ title: `Change ${b.name}`, sub: used ? `${used} cashbook ${used === 1 ? 'entry uses' : 'entries use'} it, so its currency and ledger account stay.` : '', submitLabel: 'Save', doneTitle: 'Bank account changed', fields: [
    { k: 'name', label: 'Name', required: true, wide: true },
    { k: 'accountNumber', label: 'Account number', required: true },
    ...(used ? [] : [{ k: 'currencyId', label: 'Currency', type: 'select', required: true, blank: false, options: currencies.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.code })) }, { k: 'glAccountId', label: 'Ledger account', type: 'select', required: true, options: gl }]),
    { k: 'branchCode', label: 'Branch code' },
    { k: 'swiftCode', label: 'SWIFT code' },
  ], initial: { name: b.name, accountNumber: b.accountNumber, currencyId: b.currencyId, glAccountId: b.glAccountId || '', branchCode: b.branchCode || '', swiftCode: b.swiftCode || '' },
  onSubmit: async (v) => { const body = {}; Object.keys(v).forEach((k) => { if ((v[k] || '') !== (b[k] || '')) body[k] = v[k]; }); if (!Object.keys(body).length) throw new Error('Nothing was changed.'); await AL.put(`/cashbook/banks/${encodeURIComponent(b.id)}`, body); return ''; },
  after: () => AL.setReload('set-banks', 'set-pos') });
});
AL.actions['set-bank-off'] = (el) => { const b = AL.setBank(el.dataset.id); if (!b) return; AL.confirm({ title: `Switch off ${b.name}`, confirmLabel: 'Switch off', doneTitle: 'Switched off', body: 'Nothing can be received into or paid from it afterwards. Its history stays.', onConfirm: async () => { await AL.del(`/cashbook/banks/${encodeURIComponent(b.id)}`); return ''; }, after: () => AL.setReload('set-banks', 'set-pos') }); };
AL.actions['set-bank-on'] = (el) => AL.busy(el, async () => { await AL.put(`/cashbook/banks/${encodeURIComponent(el.dataset.id)}`, { isActive: true }); AL.setReload('set-banks', 'set-pos'); }, ['Switched on', '']);
AL.actions['set-company'] = () => {
  const pr = (AL.cache['set-profile'] && AL.cache['set-profile'].data) || {};
  const f = ['legalName', 'registrationNumber', 'taxNumber', 'email', 'phone', 'website'];
  AL.form({ title: 'Company details', sub: 'Printed on invoices, statements and reports.', submitLabel: 'Save', doneTitle: 'Company details saved', fields: [
    { k: 'legalName', label: 'Legal name', required: true, wide: true }, { k: 'registrationNumber', label: 'Registration number' }, { k: 'taxNumber', label: 'Tax number' },
    { k: 'email', label: 'Email', type: 'email' }, { k: 'phone', label: 'Phone' }, { k: 'website', label: 'Website', wide: true },
  ], initial: Object.fromEntries(f.map((k) => [k, pr[k] || ''])),
  onSubmit: async (v) => { await AL.post('/company-profile/upsert', Object.fromEntries(f.map((k) => [k, v[k] || null]))); return ''; }, after: () => AL.setReload('set-profile') });
};
