/* Fixed Assets: /accounting/assets — the register (cost, accumulated depreciation, book value, reconciled to the GL
 * accounts), the monthly depreciation run with its preview (SRD ACC-FA-05…09), each asset's depreciation history, adding
 * an asset (paid from a bank, bought on a posted supplier bill, or credited to a named account), moving it (location), and disposal with gain or loss.
 * Data: /accounting/assets, /accounting/assets/depreciation/preview, /accounting/assets/:id/depreciation-schedule. */
AL.ui.assets = AL.ui.assets || { tab: 'ALL', page: 1 };
if (!AL.ui.assets.tab) AL.ui.assets.tab = 'ALL';
if (!Number.isFinite(AL.ui.assets.page)) AL.ui.assets.page = 1;
AL.assetPrevMonth = () => { const t = AL.stiToday(); const d = new Date(`${t.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
AL.assetsLoad = () => AL.res('assets', async () => {
  // the list is of active assets unless asked; disposed assets are inactive
  const rows = (x) => (x && (x.assets || (Array.isArray(x) ? x : []))) || [];
  const fetchAll = async (filters = '') => {
    const url = `/accounting/assets?limit=500${filters}`;
    const first = await AL.get(`${url}&page=1`);
    const assets = [...rows(first)];
    const totalPages = Math.max(1, Number(first && first.totalPages) || 1);
    for (let page = 2; page <= totalPages; page++) assets.push(...rows(await AL.get(`${url}&page=${page}`)));
    return assets;
  };
  const [live, gone, preview] = await Promise.all([fetchAll(), fetchAll('&status=DISPOSED&isActive=false'), AL.get(`/accounting/assets/depreciation/preview?period=${AL.assetPrevMonth()}`).catch(() => null)]);
  const liveIds = new Set(live.map((a) => a.id));
  return { assets: [...live, ...gone.filter((a) => !liveIds.has(a.id))], preview };
});
AL.assetsReload = () => { delete AL.cache.assets; AL.redraw(); };
AL.assetMethod = { STRAIGHT_LINE: 'Straight line', DIMINISHING_BALANCE: 'Reducing balance', DECLINING_BALANCE: 'Reducing balance', REDUCING_BALANCE: 'Reducing balance' };
AL.assetFiltered = () => {
  const tab = AL.ui.assets.tab, search = String(AL.ui.assets.search || '').trim().toLowerCase();
  return (((AL.cache.assets && AL.cache.assets.data && AL.cache.assets.data.assets) || [])).filter((a) =>
    (tab === 'ALL' || a.status === tab) && (!search || [a.assetName, a.assetCode, a.serialNumber, a.location].some((value) => String(value || '').toLowerCase().includes(search))));
};
AL.assetExportSpec = () => {
  const rows = AL.assetFiltered();
  const status = ({ ALL: 'All assets', IN_USE: 'In use', DISPOSED: 'Disposed' })[AL.ui.assets.tab] || 'All assets';
  return { title: 'Fixed Asset Register', subtitle: 'Asset cost, accumulated depreciation and net book value.', filename: 'accounting-fixed-assets', landscape: true,
    meta: [['View', status], ['Assets', String(rows.length)], ['As of', AL.date(AL.stiToday())]],
    columns: ['Asset', 'Asset code', 'Serial number', 'Purchase date', 'Location', 'Cost', 'Accumulated depreciation', 'Net book value', 'Depreciation method', 'Useful life (years)', 'Status', 'Disposal date', 'Disposal gain or loss'],
    rows: rows.map((a) => [a.assetName || '', a.assetCode || '', a.serialNumber || '', AL.date(a.purchaseDate), a.location || '', Number(a.cost || 0), Number(a.cost || 0) - Number(a.currentBookValue || 0), Number(a.currentBookValue || 0), AL.assetMethod[a.depreciationMethod] || a.depreciationMethod || '', Number(a.usefulLifeYears || 0), a.status === 'IN_USE' ? 'In use' : 'Disposed', a.disposalDate ? AL.date(a.disposalDate) : '', a.disposalGainLoss == null ? '' : Number(a.disposalGainLoss)]),
    note: 'Depreciation is posted monthly. Disposals remove asset cost and accumulated depreciation and record the resulting gain or loss.' };
};

AL.page('assets', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.assetsLoad();
  const head = AL.head('Registers and valuation', 'Fixed Assets', 'Depreciation posts monthly for the month just ended; disposals clear cost and depreciation and post the gain or loss.',
    [AL.exportBtns('asset-export'), canPrepare ? AL.btn('Add asset', 'asset-new', 'primary') : '', canPost ? AL.btn('Depreciation run', 'asset-run') : ''].join(''));
  const g = AL.gate(e, { key: 'assets', errorTitle: 'The asset register could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { assets, preview } = e.data;
  const inUse = assets.filter((a) => a.status === 'IN_USE' && a.isActive !== false);
  const sum = (arr, f) => arr.reduce((t, a) => t + Number(f(a) || 0), 0);
  const cost = sum(inUse, (a) => a.cost), nbv = sum(inUse, (a) => a.currentBookValue);
  const kpis = AL.kpis([
    ['Assets in use', String(inUse.length), `${assets.filter((a) => a.status === 'DISPOSED').length} disposed`],
    ['Cost', AL.money(cost), 'Assets in use'],
    ['Accumulated depreciation', AL.money(cost - nbv), 'To date'],
    ['Net book value', AL.money(nbv), 'Cost less depreciation', '#0878f6'],
    ...(preview ? [[`Depreciation ${preview.period}`, preview.toPost ? `${AL.money(preview.total)} to post` : preview.alreadyPosted ? 'Posted' : 'Nothing due', preview.toPost ? `${AL.plural(preview.toPost, 'asset')} not yet depreciated` : `${AL.plural(preview.alreadyPosted, 'asset')} posted`, preview.toPost ? '#f79009' : '#12b76a']] : []),
  ]);
  const tab = AL.ui.assets.tab;
  const tabs = `<div class="v28-tabbar">${[['ALL', 'All'], ['IN_USE', 'In use'], ['DISPOSED', 'Disposed']].map(([id, label]) => `<button class="v28-tab ${tab === id ? 'active' : ''}" data-al="asset-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  const search = String(AL.ui.assets.search || '').trim().toLowerCase();
  const shown = AL.assetFiltered();
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
  AL.ui.assets.page = Math.min(Math.max(1, AL.ui.assets.page), totalPages);
  const start = (AL.ui.assets.page - 1) * pageSize;
  const pageAssets = shown.slice(start, start + pageSize);
  const rows = pageAssets.map((a) => {
    const acts = [AL.btn('Open', 'asset-open', 'small', `data-id="${ae(a.id)}"`)];
    if (a.status === 'IN_USE' && canPrepare) acts.push(AL.btn('Move', 'asset-move', 'small', `data-id="${ae(a.id)}"`));
    if (a.status === 'IN_USE' && canPost) acts.push(AL.btn('Dispose', 'asset-dispose', 'small danger', `data-id="${ae(a.id)}"`));
    const dep = Number(a.cost) - Number(a.currentBookValue);
    return `<tr data-asset-row data-id="${ae(a.id)}" tabindex="0" role="button" aria-label="Open ${ae(a.assetName)} details">
      <td><strong>${ae(a.assetName)}</strong><span class="v28-sub">${ae(a.assetCode)}${a.serialNumber ? ` · ${ae(a.serialNumber)}` : ''}</span></td>
      <td>${ae(AL.date(a.purchaseDate))}</td>
      <td>${ae(a.location || '—')}</td>
      <td>${ae(AL.money(a.cost))}</td>
      <td>${ae(AL.money(dep))}</td>
      <td>${ae(AL.money(a.currentBookValue))}</td>
      <td>${ae(AL.assetMethod[a.depreciationMethod] || a.depreciationMethod)}<span class="v28-sub">${ae(String(a.usefulLifeYears))} years</span></td>
      <td>${a.status === 'IN_USE' ? AL.status('In use', 'ok') : `${AL.status('Disposed', 'info')}<span class="v28-sub">${ae(AL.date(a.disposalDate))} · ${Number(a.disposalGainLoss) >= 0 ? 'gain' : 'loss'} ${ae(AL.money(Math.abs(Number(a.disposalGainLoss || 0))))}</span>`}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  const pagination = `<div class="al-assets-pagination"><span>${shown.length ? `Showing ${start + 1}–${Math.min(start + pageSize, shown.length)} of ${shown.length} assets` : 'Showing 0 assets'}</span><div>${AL.btn('Previous', 'asset-page', 'small', `data-dir="-1"${AL.ui.assets.page <= 1 ? ' disabled' : ''}`)}<span>Page ${AL.ui.assets.page} of ${totalPages}</span>${AL.btn('Next', 'asset-page', 'small', `data-dir="1"${AL.ui.assets.page >= totalPages ? ' disabled' : ''}`)}</div></div>`;
  const searchBox = `<div class="al-assets-search"><label for="al-assets-search">Search assets</label><input id="al-assets-search" type="search" placeholder="Search name, code, serial number or location" value="${ae(AL.ui.assets.search || '')}"></div>`;
  const reg = AL.panel('Asset register', '', `${tabs}${searchBox}${shown.length ? `${AL.table(['Asset', 'Bought', 'Location', 'Cost', 'Depreciation', 'Book value', 'Method', 'Status', ''], rows, '1180px').replace('class="v28-tablewrap"', 'class="v28-tablewrap al-assets-tablewrap"')}${pagination}` : AL.empty(search ? 'No assets match your search.' : tab === 'IN_USE' ? 'No assets in use.' : 'None here.')}`);
  return `<div class="v28-page">${head}${kpis}${reg}</div>`;
});
AL.actions['asset-tab'] = (el) => { AL.ui.assets.tab = el.dataset.tab; AL.ui.assets.page = 1; AL.redraw(); };
AL.actions['asset-page'] = (el) => { AL.ui.assets.page = Math.max(1, AL.ui.assets.page + Number(el.dataset.dir || 0)); AL.redraw(); };
AL.actions['asset-export'] = (el) => { const spec = AL.assetExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There are no assets in this view.', 'bad'); return AL.exportRun(el, spec, 'assets'); };
AL.assetFind = (id) => ((AL.cache.assets && AL.cache.assets.data && AL.cache.assets.data.assets) || []).find((a) => a.id === id);
AL.wire.assets = () => {
  const search = document.querySelector('#al-assets-search');
  if (search && !search.dataset.wired) {
    search.dataset.wired = '1';
    search.addEventListener('input', () => {
      const position = search.selectionStart;
      AL.ui.assets.search = search.value;
      AL.ui.assets.page = 1;
      AL.redraw();
      const replacement = document.querySelector('#al-assets-search');
      if (replacement) { replacement.focus(); if (position !== null) replacement.setSelectionRange(position, position); }
    });
  }
  document.querySelectorAll('.al-assets-tablewrap tbody tr[data-asset-row]').forEach((row) => {
    if (row.dataset.assetRowWired) return;
    row.dataset.assetRowWired = '1';
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('button, a, [data-al]')) return;
      AL.actions['asset-open'](row);
    });
    row.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      AL.actions['asset-open'](row);
    });
  });
};

AL.assetOpenDetail = async (id) => {
  const a = AL.assetFind(id); if (!a) return;
  const sched = await AL.get(`/accounting/assets/${encodeURIComponent(a.id)}/depreciation-schedule`);
  const recs = Array.isArray(sched) ? sched : (sched && (sched.records || sched.depreciationRecords || sched.schedule)) || a.depreciationRecords || [];
  AL.ui.assets.openSchedule = { assetId: a.id, records: recs };
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const facts = [['Code', a.assetCode], ['Bought', AL.date(a.purchaseDate)], ['Cost', AL.money(a.cost)], ['Residual value', AL.money(a.salvageValue)], ['Useful life', `${a.usefulLifeYears} years · ${AL.assetMethod[a.depreciationMethod] || a.depreciationMethod}`], ['Location', a.location || '—'], ['Serial number', a.serialNumber || '—'], ['Asset account', a.assetAccount ? `${a.assetAccount.accountNo} ${a.assetAccount.accountName}` : '—'], ['Depreciation expense', a.depreciationExpenseAccount ? `${a.depreciationExpenseAccount.accountNo} ${a.depreciationExpenseAccount.accountName}` : '—']]
    .map((f) => `<div class="v28-list-item"><div><strong>${ae(f[0])}</strong><span>${ae(f[1])}</span></div></div>`).join('');
  const rows = recs.map((r) => `<tr><td>${ae(r.period)}</td><td>${ae(AL.money(r.depreciationAmount))}</td><td>${ae(AL.money(r.accumulatedDepreciation))}</td><td>${ae(AL.money(r.bookValue))}</td><td>${AL.status(r.isPosted === false ? 'Calculated' : 'Posted', r.isPosted === false ? 'warn' : 'ok')}</td><td>${r.isPosted === false && canPost ? AL.btn('Post', 'asset-record-post', 'small primary', `data-id="${ae(r.id)}"`) : '—'}</td></tr>`).join('');
  const controls = [canPrepare && a.status === 'IN_USE' ? AL.btn('Calculate Depreciation', 'asset-calculate', 'primary', `data-id="${ae(a.id)}"`) : '', canPrepare ? AL.btn('Edit asset', 'asset-edit', 'small', `data-id="${ae(a.id)}"`) : ''].filter(Boolean).join('');
  AL.form({ title: a.assetName, sub: `${a.assetCode} · ${a.status === 'IN_USE' ? 'In use' : 'Disposed'}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [],
    extra: `<div class="al-wide"><div class="v28-grid equal">${facts}</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">${controls}</div><h4 style="margin:16px 0 8px">Depreciation</h4>${rows ? AL.table(['Month', 'Charge', 'Accumulated', 'Book value', 'Status', ''], rows, '680px') : AL.empty('No depreciation posted yet.')}</div>`,
    onSubmit: async () => false });
};
AL.actions['asset-open'] = (el) => AL.busy(el, () => AL.assetOpenDetail(el.dataset.id));
AL.assetRefreshDetail = async (id) => {
  AL.assetsReload();
  const entry = AL.cache.assets;
  if (entry && entry.pending) await entry.pending;
  if (entry && entry.state === 'ok') await AL.assetOpenDetail(id);
};

AL.actions['asset-calculate'] = (el) => {
  const a = AL.assetFind(el.dataset.id); if (!a) return;
  const canPost = AL.can('manage_ledger');
  const today = AL.stiToday();
  let mode = 'single';
  AL.form({ title: 'Calculate Depreciation', sub: a.assetName, submitLabel: 'Calculate Depreciation', doneTitle: 'Depreciation calculated',
    before: `<div class="al-wide al-dep-summary"><strong>${ae(a.assetName)}</strong><span>Code: ${ae(a.assetCode)} · Book value: ${ae(AL.money(a.currentBookValue))}</span></div><div class="al-wide al-dep-modes" role="group" aria-label="Calculation mode"><button type="button" data-dep-mode="single" class="active" aria-pressed="true">Single Period</button><button type="button" data-dep-mode="range" aria-pressed="false">Date Range</button></div>`,
    fields: [
      { k: 'depreciationDate', label: 'Depreciation Date', type: 'date', max: today },
      { k: 'period', label: 'Period (YYYY-MM)', type: 'month' },
      { k: 'startDate', label: 'Start Date', type: 'date' },
      { k: 'endDate', label: 'End Date', type: 'date', max: today },
      ...(canPost ? [{ k: 'autoPost', label: 'Auto-post entries', type: 'checkbox' }] : []),
    ],
    initial: { depreciationDate: today, period: today.slice(0, 7), autoPost: canPost },
    validate: (v) => {
      if (mode === 'single') {
        if (!v.depreciationDate || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v.period || '')) return 'Choose a depreciation date and a valid period.';
        if (v.depreciationDate > today || v.period !== v.depreciationDate.slice(0, 7)) return 'Choose a depreciation date within the selected period and no later than today.';
      } else {
        if (!v.startDate || !v.endDate) return 'Choose both start and end dates.';
        if (v.startDate > v.endDate || v.endDate > today) return 'Choose a valid date range ending no later than today.';
      }
      return '';
    },
    onSubmit: async (v) => {
      if (mode === 'single') {
        await AL.post(`/accounting/assets/${encodeURIComponent(a.id)}/depreciation`, { period: v.period, depreciationDate: v.depreciationDate });
        return `${v.period} calculated. Review and post it from the asset details.`;
      }
      const r = await AL.post(`/accounting/assets/${encodeURIComponent(a.id)}/depreciation/backfill`, { startDate: v.startDate, endDate: v.endDate, autoPost: canPost && Boolean(v.autoPost) });
      const errors = (r && r.errors) || [];
      return `${AL.plural((r && r.created || []).length, 'period')} calculated; ${AL.plural((r && r.posted || []).length, 'period')} posted; ${AL.plural((r && r.skipped || []).length, 'period')} skipped.${errors.length ? ` ${errors.length} failed: ${errors[0].period} — ${errors[0].message}` : ''}`;
    },
    after: () => AL.assetRefreshDetail(a.id),
  });
  const form = document.getElementById('alForm'); if (!form) return;
  form.classList.add('al-dep-form'); form.closest('.v28-modal').classList.add('al-dep-modal');
  const switchMode = (next) => {
    mode = next;
    ['depreciationDate', 'period', 'startDate', 'endDate', 'autoPost'].forEach((key) => {
      const field = form.elements[key]; if (field) field.closest('label').hidden = mode === 'single' ? !['depreciationDate', 'period'].includes(key) : ['depreciationDate', 'period'].includes(key);
    });
    form.querySelectorAll('[data-dep-mode]').forEach((button) => { const active = button.dataset.depMode === mode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    const submit = document.querySelector('#alOverlay [data-al="form-submit"]'); if (submit) submit.textContent = mode === 'single' ? 'Calculate Depreciation' : 'Run Backfill';
  };
  form.querySelectorAll('[data-dep-mode]').forEach((button) => button.addEventListener('click', () => switchMode(button.dataset.depMode)));
  switchMode('single');
};
AL.actions['asset-record-post'] = (el) => {
  const assetId = AL.ui.assets.openSchedule && AL.ui.assets.openSchedule.assetId;
  const recordId = el.dataset.id;
  AL.confirm({ title: 'Post Depreciation Entry', body: 'Post this depreciation entry to the ledger?', confirmLabel: 'Post Depreciation', doneTitle: 'Depreciation posted',
    onConfirm: async () => { await AL.post(`/accounting/assets/depreciation/${encodeURIComponent(recordId)}/post`, {}); return 'The journal was posted in the asset’s recorded currency.'; },
    after: () => assetId ? AL.assetRefreshDetail(assetId) : AL.assetsReload(),
  });
};

AL.actions['asset-edit'] = (el) => {
  const a = AL.assetFind(el.dataset.id); if (!a) return;
  AL.form({ title: `Edit ${a.assetName}`, sub: `${a.assetCode} · changes are audited`, submitLabel: 'Save changes', doneTitle: 'Asset updated', fields: [
    { k: 'assetName', label: 'Asset name', required: true },
    { k: 'description', label: 'Description', type: 'textarea', wide: true },
    { k: 'location', label: 'Location' },
    { k: 'serialNumber', label: 'Serial number' },
    { k: 'warrantyExpiry', label: 'Warranty expiry', type: 'date' },
  ], initial: { assetName: a.assetName || '', description: a.description || '', location: a.location || '', serialNumber: a.serialNumber || '', warrantyExpiry: a.warrantyExpiry ? String(a.warrantyExpiry).slice(0, 10) : '' },
  onSubmit: async (v) => { await AL.put(`/accounting/assets/${encodeURIComponent(a.id)}`, { assetName: v.assetName, description: v.description || undefined, location: v.location || undefined, serialNumber: v.serialNumber || undefined, warrantyExpiry: v.warrantyExpiry || undefined }); return `${v.assetName} was updated and recorded in the audit trail.`; }, after: () => AL.assetsReload() });
};

AL.assetAccounts = async () => { const lk = AL.jeLookups(); if (lk.pending) await lk.pending; return (lk.data && lk.data.accounts) || []; };
AL.actions['asset-new'] = (el) => AL.busy(el, async () => {
  const accts = await AL.assetAccounts();
  const banks = await AL.get('/cashbook/banks').catch(() => []);
  const bills = await AL.get('/accounting/assets/bills').catch(() => []);
  const opt = (re) => accts.filter((a) => re.test(`${a.accountNo} ${a.accountName}`)).map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` }));
  const all = accts.map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` }));
  const pick = (re) => (accts.find((a) => re.test(a.accountName)) || {}).id;
  AL.form({
    title: 'Add a fixed asset', wide: true, submitLabel: 'Add asset', doneTitle: 'Asset added',
    fields: [
      { k: 'assetName', label: 'Asset', required: true, wide: true },
      { k: 'assetCode', label: 'Asset code / tag', required: true },
      { k: 'serialNumber', label: 'Serial number' },
      { k: 'purchaseDate', label: 'Bought on', type: 'date', required: true, max: AL.stiToday() },
      { k: 'cost', label: 'Cost', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'salvageValue', label: 'Residual value', type: 'number', min: 0, step: '0.01' },
      { k: 'usefulLifeYears', label: 'Useful life (years)', type: 'number', min: 1, step: '1', required: true },
      { k: 'depreciationMethod', label: 'Method', type: 'select', blank: false, required: true, options: [{ value: 'STRAIGHT_LINE', label: 'Straight line' }, { value: 'DIMINISHING_BALANCE', label: 'Reducing balance' }] },
      { k: 'location', label: 'Location' },
      { k: 'assetAccountId', label: 'Asset account', type: 'select', required: true, options: opt(/^1\d{3}\b/) },
      { k: 'accumulatedDepreciationAccountId', label: 'Accumulated depreciation account', type: 'select', required: true, options: opt(/^1\d{3}\b/) },
      { k: 'depreciationExpenseAccountId', label: 'Depreciation expense account', type: 'select', required: true, options: opt(/^[56]\d{3}\b/) },
      { k: 'fundedBy', label: 'Paid for', type: 'select', blank: false, required: true, options: [{ value: 'BANK', label: 'From a bank account' }, { value: 'BILL', label: 'On a supplier bill already posted' }, { value: 'ACCOUNT', label: 'Credited to an account (supplier, clearing)' }] },
      { k: 'invoiceId', label: 'Supplier bill', type: 'select', options: (Array.isArray(bills) ? bills : []).map((b) => ({ value: b.id, label: `${b.invoiceNumber} · ${b.supplier || ''} · ${AL.money(b.netAmount)} before VAT` })) },
      { k: 'paymentBankId', label: 'Bank account', type: 'select', options: (Array.isArray(banks) ? banks : []).filter((b) => b.isActive !== false).map((b) => ({ value: b.id, label: b.name })) },
      { k: 'creditChartOfAccountId', label: 'Account credited', type: 'select', options: all },
    ],
    initial: { purchaseDate: AL.stiToday(), depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 4, salvageValue: 0, fundedBy: 'BANK', assetAccountId: pick(/equipment|furniture|vehicle|computer/i), accumulatedDepreciationAccountId: pick(/accumulated depreciation/i), depreciationExpenseAccountId: pick(/depreciation expense/i) },
    validate: (v) => {
      if (!(Number(v.cost) > 0)) return 'The cost must be more than zero.';
      if (Number(v.salvageValue || 0) >= Number(v.cost)) return 'The residual value must be below the cost.';
      if (v.assetAccountId === v.accumulatedDepreciationAccountId) return 'Cost and accumulated depreciation need separate accounts.';
      if (v.fundedBy === 'BANK' && !v.paymentBankId) return 'Choose the bank account it was paid from.';
      if (v.fundedBy === 'ACCOUNT' && !v.creditChartOfAccountId) return 'Choose the account to credit.';
      if (v.fundedBy === 'BILL' && !v.invoiceId) return 'Choose the supplier bill.';
      return '';
    },
    onSubmit: async (v) => {
      const body = { assetName: v.assetName, assetCode: v.assetCode, serialNumber: v.serialNumber || undefined, purchaseDate: v.purchaseDate, cost: Number(v.cost), salvageValue: Number(v.salvageValue || 0), usefulLifeYears: Number(v.usefulLifeYears), depreciationMethod: v.depreciationMethod, location: v.location || undefined, assetAccountId: v.assetAccountId, accumulatedDepreciationAccountId: v.accumulatedDepreciationAccountId, depreciationExpenseAccountId: v.depreciationExpenseAccountId, ...(v.fundedBy === 'BANK' ? { paymentBankId: v.paymentBankId } : v.fundedBy === 'BILL' ? { invoiceId: v.invoiceId } : { creditChartOfAccountId: v.creditChartOfAccountId }) };
      await AL.post('/accounting/assets', body);
      return v.fundedBy === 'BANK' ? 'The purchase is posted and appears in the cashbook.' : v.fundedBy === 'BILL' ? 'The cost is moved from the bill expense to the asset; the bill stays the one amount owed.' : 'The purchase is posted.';
    },
    after: () => AL.assetsReload(),
  });
});
AL.actions['asset-move'] = (el) => {
  const a = AL.assetFind(el.dataset.id); if (!a) return;
  AL.form({ title: `Move ${a.assetName}`, sub: `Now at ${a.location || 'no location'}`, submitLabel: 'Save', doneTitle: 'Asset moved',
    fields: [{ k: 'location', label: 'New location', required: true, wide: true }],
    onSubmit: async (v) => { await AL.put(`/accounting/assets/${encodeURIComponent(a.id)}`, { location: v.location }); return `Now at ${v.location}; the move is in the audit trail.`; },
    after: () => AL.assetsReload() });
};
AL.actions['asset-dispose'] = (el) => AL.busy(el, async () => {
  const a = AL.assetFind(el.dataset.id); if (!a) return;
  const banks = await AL.get('/cashbook/banks').catch(() => []);
  AL.form({
    title: `Dispose of ${a.assetName}`, sub: `Book value ${AL.money(a.currentBookValue)}`, submitLabel: 'Dispose', doneTitle: 'Asset disposed', danger: true,
    fields: [
      { k: 'disposalDate', label: 'Date', type: 'date', required: true, max: AL.stiToday() },
      // the server accepts exactly SALE / SCRAP / DONATION / TRADE_IN (AssetController.ts); "Written off" used to send
      // WRITE_OFF, which is none of those — every write-off failed with "Invalid disposalMethod" (found live, full sweep
      // audit). A write-off has no proceeds and nothing changes hands, which SCRAP already models; kept the familiar label.
      { k: 'disposalMethod', label: 'How', type: 'select', blank: false, options: [{ value: 'SALE', label: 'Sold' }, { value: 'SCRAP', label: 'Scrapped / written off' }, { value: 'DONATION', label: 'Donated' }, { value: 'TRADE_IN', label: 'Traded in' }] },
      { k: 'disposalValue', label: 'Proceeds', type: 'number', min: 0, step: '0.01', required: true },
      { k: 'paymentBankId', label: 'Proceeds received into', type: 'select', options: (Array.isArray(banks) ? banks : []).filter((b) => b.isActive !== false).map((b) => ({ value: b.id, label: b.name })) },
      { k: 'description', label: 'Note', type: 'textarea', wide: true },
    ],
    initial: { disposalDate: AL.stiToday(), disposalMethod: 'SALE', disposalValue: 0 },
    validate: (v) => (Number(v.disposalValue) > 0 && !v.paymentBankId ? 'Choose the bank account the proceeds were received into.' : ''),
    onSubmit: async (v) => {
      const gain = Number(v.disposalValue) - Number(a.currentBookValue);
      await AL.post(`/accounting/assets/${encodeURIComponent(a.id)}/dispose`, { disposalDate: v.disposalDate, disposalMethod: v.disposalMethod, disposalValue: Number(v.disposalValue), description: v.description || undefined, ...(Number(v.disposalValue) > 0 ? { paymentBankId: v.paymentBankId } : {}) });
      return `${gain >= 0 ? 'Gain' : 'Loss'} of ${AL.money(Math.abs(gain))} posted.`;
    },
    after: () => AL.assetsReload(),
  });
});
AL.actions['asset-run'] = (el) => AL.busy(el, async () => {
  const period = AL.assetPrevMonth();
  const pv = await AL.get(`/accounting/assets/depreciation/preview?period=${period}`);
  const label = { to_post: 'To post', already_posted: 'Posted', not_due: 'Not due (bought later)', fully_depreciated: 'Fully depreciated', calculated_not_posted: 'Calculated, not posted' };
  const rows = pv.assets.map((r) => `<tr><td><strong>${ae(r.assetName)}</strong><span class="v28-sub">${ae(r.assetCode)}</span></td><td>${ae(AL.money(r.amount))}</td><td>${ae(r.expenseAccount || '—')}</td><td>${AL.status(label[r.outcome] || r.outcome, r.outcome === 'to_post' ? 'warn' : r.outcome === 'already_posted' ? 'ok' : 'info')}</td></tr>`).join('');
  AL.form({
    title: `Depreciation for ${period}`, sub: pv.toPost ? `${AL.plural(pv.toPost, 'asset')}, ${AL.money(pv.total)}` : 'Nothing to post for this month', wide: true,
    submitLabel: pv.toPost ? `Post ${AL.money(pv.total)}` : 'Close', viewOnly: !pv.toPost, doneTitle: 'Depreciation posted', fields: [],
    extra: `<div class="al-wide">${rows ? AL.table(['Asset', 'Charge', 'Expense account', ''], rows, '640px') : AL.empty('No assets in use.')}</div>`,
    onSubmit: async () => {
      if (!pv.toPost) return false;
      const r = await AL.post('/accounting/assets/depreciation/monthly', { period });
      return `${AL.plural(r.processedAssets || 0, 'asset')} depreciated, ${AL.money(r.totalDepreciation)}.${r.skippedErrors ? ` ${r.skippedErrors} could not be posted.` : ''}`;
    },
    after: () => AL.assetsReload(),
  });
});
