/* Fixed Assets: /accounting/assets — the register (cost, accumulated depreciation, book value, reconciled to the GL
 * accounts), the monthly depreciation run with its preview (SRD ACC-FA-05…09), each asset's depreciation history, adding
 * an asset (paid from a bank, bought on a posted supplier bill, or credited to a named account), moving it (location), and disposal with gain or loss.
 * Data: /accounting/assets, /accounting/assets/depreciation/preview, /accounting/assets/:id/depreciation-schedule. */
AL.ui.assets = AL.ui.assets || { tab: 'IN_USE' };
AL.assetPrevMonth = () => { const t = AL.stiToday(); const d = new Date(`${t.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
AL.assetsLoad = () => AL.res('assets', async () => {
  // the list is of active assets unless asked; disposed assets are inactive
  const [live, gone, preview] = await Promise.all([AL.get('/accounting/assets?limit=500'), AL.get('/accounting/assets?limit=500&status=DISPOSED&isActive=false').catch(() => null), AL.get(`/accounting/assets/depreciation/preview?period=${AL.assetPrevMonth()}`).catch(() => null)]);
  const rows = (x) => (x && (x.assets || (Array.isArray(x) ? x : []))) || [];
  return { assets: [...rows(live), ...rows(gone).filter((a) => !rows(live).some((b) => b.id === a.id))], preview };
});
AL.assetsReload = () => { delete AL.cache.assets; AL.redraw(); };
AL.assetMethod = { STRAIGHT_LINE: 'Straight line', DECLINING_BALANCE: 'Reducing balance', REDUCING_BALANCE: 'Reducing balance' };

AL.page('assets', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.assetsLoad();
  const head = AL.head('Registers and valuation', 'Fixed Assets', 'Depreciation posts monthly for the month just ended; disposals clear cost and depreciation and post the gain or loss.',
    [canPrepare ? AL.btn('Add asset', 'asset-new', 'primary') : '', canPost ? AL.btn('Depreciation run', 'asset-run') : ''].join(''));
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
  const tabs = `<div class="v28-tabbar">${[['IN_USE', 'In use'], ['DISPOSED', 'Disposed'], ['ALL', 'All']].map(([id, label]) => `<button class="v28-tab ${tab === id ? 'active' : ''}" data-al="asset-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  const shown = assets.filter((a) => tab === 'ALL' || a.status === tab);
  const rows = shown.map((a) => {
    const acts = [AL.btn('Open', 'asset-open', 'small', `data-id="${ae(a.id)}"`)];
    if (a.status === 'IN_USE' && canPrepare) acts.push(AL.btn('Move', 'asset-move', 'small', `data-id="${ae(a.id)}"`));
    if (a.status === 'IN_USE' && canPost) acts.push(AL.btn('Dispose', 'asset-dispose', 'small danger', `data-id="${ae(a.id)}"`));
    const dep = Number(a.cost) - Number(a.currentBookValue);
    return `<tr>
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
  const reg = AL.panel('Asset register', '', `${tabs}${shown.length ? AL.table(['Asset', 'Bought', 'Location', 'Cost', 'Depreciation', 'Book value', 'Method', 'Status', ''], rows, '1180px') : AL.empty(tab === 'IN_USE' ? 'No assets in use.' : 'None here.')}`);
  return `<div class="v28-page">${head}${kpis}${reg}</div>`;
});
AL.actions['asset-tab'] = (el) => { AL.ui.assets.tab = el.dataset.tab; AL.redraw(); };
AL.assetFind = (id) => ((AL.cache.assets && AL.cache.assets.data && AL.cache.assets.data.assets) || []).find((a) => a.id === id);

AL.actions['asset-open'] = (el) => AL.busy(el, async () => {
  const a = AL.assetFind(el.dataset.id); if (!a) return;
  const sched = await AL.get(`/accounting/assets/${encodeURIComponent(a.id)}/depreciation-schedule`).catch(() => null);
  const recs = Array.isArray(sched) ? sched : (sched && (sched.records || sched.depreciationRecords || sched.schedule)) || a.depreciationRecords || [];
  const facts = [['Code', a.assetCode], ['Bought', AL.date(a.purchaseDate)], ['Cost', AL.money(a.cost)], ['Residual value', AL.money(a.salvageValue)], ['Useful life', `${a.usefulLifeYears} years · ${AL.assetMethod[a.depreciationMethod] || a.depreciationMethod}`], ['Location', a.location || '—'], ['Serial number', a.serialNumber || '—'], ['Asset account', a.assetAccount ? `${a.assetAccount.accountNo} ${a.assetAccount.accountName}` : '—'], ['Depreciation expense', a.depreciationExpenseAccount ? `${a.depreciationExpenseAccount.accountNo} ${a.depreciationExpenseAccount.accountName}` : '—']]
    .map((f) => `<div class="v28-list-item"><div><strong>${ae(f[0])}</strong><span>${ae(f[1])}</span></div></div>`).join('');
  const rows = recs.map((r) => `<tr><td>${ae(r.period)}</td><td>${ae(AL.money(r.depreciationAmount))}</td><td>${ae(AL.money(r.accumulatedDepreciation))}</td><td>${ae(AL.money(r.bookValue))}</td><td>${AL.status(r.isPosted === false ? 'Calculated' : 'Posted', r.isPosted === false ? 'warn' : 'ok')}</td></tr>`).join('');
  AL.form({ title: a.assetName, sub: `${a.assetCode} · ${a.status === 'IN_USE' ? 'In use' : 'Disposed'}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [],
    extra: `<div class="al-wide"><div class="v28-grid equal">${facts}</div><h4 style="margin:16px 0 8px">Depreciation</h4>${rows ? AL.table(['Month', 'Charge', 'Accumulated', 'Book value', ''], rows, '560px') : AL.empty('No depreciation posted yet.')}</div>`,
    onSubmit: async () => false });
});

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
      { k: 'depreciationMethod', label: 'Method', type: 'select', blank: false, required: true, options: [{ value: 'STRAIGHT_LINE', label: 'Straight line' }, { value: 'DECLINING_BALANCE', label: 'Reducing balance' }] },
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
