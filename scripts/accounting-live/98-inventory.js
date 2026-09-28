/* Inventory: /accounting/inventory — the stock sub-ledger. Items with quantity, moving weighted-average cost and value;
 * receive (at a cost, from a payable, bank or opening balance), issue (to cost of sales or an expense) and count (an
 * approver books the difference to a variance account). Each movement posts its journal with it, so the ledger and the
 * stock agree; the ledger check shows it, and the roll-forward gives opening + receipts − issues ± adjustments = closing
 * for a month. Data: /accounting/inventory/*. */
AL.ui.inv = AL.ui.inv || { tab: 'items', q: '', month: '' };
AL.invLoad = () => ({
  items: AL.res('inv-items', () => AL.get('/accounting/inventory/items?limit=500')),
  tie: AL.res('inv-tie', () => AL.get('/accounting/inventory/tie-out')),
  moves: AL.res('inv-moves', () => AL.get('/accounting/inventory/movements?limit=200')),
});
AL.invReload = () => { Object.keys(AL.cache).filter((k) => k.startsWith('inv-')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.invItems = () => { const d = AL.cache['inv-items'] && AL.cache['inv-items'].data; return (d && (d.items || d)) || []; };
AL.invMonth = () => AL.ui.inv.month || AL.stiToday().slice(0, 7);

AL.page('inventory', () => {
  AL.meLoad();
  const L = AL.invLoad(), u = AL.ui.inv;
  const canPrep = AL.can('manage_accounting'), canCount = AL.can('manage_ledger');
  const head = AL.head('Daily accounting', 'Inventory', '', canPrep ? AL.btn('Add item', 'inv-new', 'primary') : '');
  const g = AL.gate(L.items, { key: 'inv-items', errorTitle: 'Inventory could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const items = AL.invItems();
  const value = (i) => Number(i.quantityOnHand) * Number(i.costOfPurchase);
  const tie = (L.tie.data || []);
  const diff = tie.reduce((s, r) => s + Math.abs(r.difference || 0), 0);
  const low = items.filter((i) => i.isActive !== false && Number(i.reorderLevel) > 0 && Number(i.quantityOnHand) <= Number(i.reorderLevel));
  const kpis = AL.kpis([
    ['Stock value', AL.money(items.reduce((s, i) => s + value(i), 0)), 'Quantity × average cost'],
    ['Items', String(items.filter((i) => i.isActive !== false).length), `${items.filter((i) => i.isActive !== false && Number(i.quantityOnHand) > 0).length} in stock`],
    ['At or below reorder level', String(low.length), low.length ? low.slice(0, 2).map((i) => i.skuNumber).join(', ') : 'None', low.length ? '#f79009' : '#12b76a'],
    ['Ledger against stock', L.tie.state === 'ok' ? (diff < 0.005 ? 'Agrees' : AL.money(diff)) : '—', L.tie.state === 'ok' ? (diff < 0.005 ? 'Inventory accounts = stock value' : 'Difference') : 'Checking', L.tie.state === 'ok' ? (diff < 0.005 ? '#12b76a' : '#d92d20') : undefined],
  ]);
  const tabs = `<div class="v28-tabbar">${[['items', 'Items'], ['moves', 'Movements'], ['roll', 'Month roll-forward'], ['tie', 'Ledger check']].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="inv-tab" data-t="${id}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (u.tab === 'items') {
    const q = u.q.trim().toLowerCase();
    const rows = items.filter((i) => !q || `${i.skuNumber} ${i.itemName}`.toLowerCase().includes(q)).map((i) => {
      const acts = [AL.btn('Movements', 'inv-item-moves', 'small', `data-id="${ae(i.id)}"`)];
      if (canPrep && i.isActive !== false) acts.push(AL.btn('Receive', 'inv-in', 'small', `data-id="${ae(i.id)}"`), AL.btn('Issue', 'inv-out', 'small', `data-id="${ae(i.id)}"`), AL.btn('Change', 'inv-edit', 'small', `data-id="${ae(i.id)}"`));
      if (canCount && i.isActive !== false) acts.push(AL.btn('Count', 'inv-count', 'small', `data-id="${ae(i.id)}"`));
      const lowFlag = Number(i.reorderLevel) > 0 && Number(i.quantityOnHand) <= Number(i.reorderLevel);
      return `<tr class="${i.isActive === false ? 'al-muted' : ''}">
        <td><strong>${ae(i.skuNumber)}</strong><span class="v28-sub">${ae(i.itemName)}</span></td>
        <td class="num">${ae(Number(i.quantityOnHand).toLocaleString('en-US'))} ${ae(i.unitOfMeasure || '')}${lowFlag ? `<span class="v28-sub al-bad">Reorder at ${ae(String(Number(i.reorderLevel)))}</span>` : ''}</td>
        <td class="num">${ae(AL.money(i.costOfPurchase))}</td>
        <td class="num">${ae(AL.money(value(i)))}</td>
        <td>${i.inventoryAssetAccount ? ae(`${i.inventoryAssetAccount.accountNo} ${i.inventoryAssetAccount.accountName}`) : '—'}</td>
        <td>${i.isActive === false ? AL.status('Off', 'info') : AL.status('Active', 'ok')}</td>
        <td class="al-actions">${acts.join('')}</td>
      </tr>`;
    }).join('');
    body = `<div class="al-filters"><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-inv-f="q" value="${ae(u.q)}" placeholder="SKU or name"></label></div>${rows ? AL.table(['Item', 'On hand', 'Average cost', 'Value', 'Inventory account', 'Status', ''], rows, '1100px') : AL.empty('No inventory items yet.')}`;
  } else if (u.tab === 'moves') {
    body = AL.gate(L.moves, { key: 'inv-moves' }) || AL.invMovesTable(L.moves.data || []);
  } else if (u.tab === 'roll') {
    const m = AL.invMonth();
    const [y, mo] = m.split('-').map(Number);
    const to = `${m}-${String(new Date(Date.UTC(y, mo, 0)).getUTCDate()).padStart(2, '0')}`;
    const e = AL.res(`inv-roll-${m}`, () => AL.get(`/accounting/inventory/roll-forward?from=${m}-01&to=${to}`));
    const cell = (x) => `${ae(x.qty.toLocaleString('en-US'))}<span class="v28-sub">${ae(AL.money(x.value))}</span>`;
    const rows = e.state === 'ok' ? (e.data.rows || []).map((r) => `<tr><td><strong>${ae(r.sku)}</strong><span class="v28-sub">${ae(r.name)}</span></td><td class="num">${cell(r.opening)}</td><td class="num">${cell(r.receipts)}</td><td class="num">${cell(r.issues)}</td><td class="num">${cell(r.adjustments)}</td><td class="num"><strong>${cell(r.closing)}</strong></td></tr>`).join('') : '';
    const tot = (k) => (e.state === 'ok' ? e.data.rows.reduce((s, r) => s + r[k].value, 0) : 0);
    body = `<div class="al-filters"><label class="v28-field"><span>Month</span><input class="v28-input" type="month" data-inv-f="month" value="${ae(m)}"></label></div>${AL.gate(e, { key: `inv-roll-${m}` }) || (rows ? AL.table(['Item', 'Opening', 'Received', 'Issued', 'Counted ±', 'Closing'], rows + `<tr class="al-total"><td><strong>Total</strong></td>${['opening', 'receipts', 'issues', 'adjustments', 'closing'].map((k) => `<td class="num"><strong>${ae(AL.money(tot(k)))}</strong></td>`).join('')}</tr>`, '960px') : AL.empty('No stock moved in this month.'))}`;
  } else {
    const rows = tie.map((r) => `<tr><td>${ae(r.account)}<span class="v28-sub">${r.items} item${r.items === 1 ? '' : 's'}</span></td><td class="num">${ae(AL.money(r.stockValue))}</td><td class="num">${ae(AL.money(r.ledgerBalance))}</td><td class="num">${Math.abs(r.difference) < 0.005 ? '<span class="al-ok">None</span>' : `<span class="al-bad">${ae(AL.money(r.difference))}</span>`}</td></tr>`).join('');
    body = AL.gate(L.tie, { key: 'inv-tie' }) || (rows ? AL.table(['Inventory account', 'Stock value', 'Ledger balance', 'Difference'], rows, '760px') : AL.empty('No inventory accounts in use.'));
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Stock', '', `${tabs}${body}`)}</div>`;
});
AL.invMovesTable = (list) => {
  const TYPE = { IN: 'Received', OUT: 'Issued', ADJUSTMENT: 'Count difference' };
  const rows = list.map((m) => {
    const q = m.movementType === 'OUT' ? -Math.abs(Number(m.quantity)) : m.movementType === 'IN' ? Math.abs(Number(m.quantity)) : Number(m.quantity);
    return `<tr><td>${ae(AL.dateTime(m.createdAt))}</td><td>${m.item ? `<strong>${ae(m.item.skuNumber)}</strong><span class="v28-sub">${ae(m.item.itemName)}</span>` : ''}</td><td>${ae(TYPE[m.movementType] || m.movementType)}</td><td class="num">${q > 0 ? '+' : ''}${ae(q.toLocaleString('en-US'))}</td><td class="num">${ae(AL.money(m.unitCost))}</td><td class="num">${ae(AL.money(Math.abs(Number(m.totalCost))))}</td><td class="al-wrap">${ae(m.description || m.reference || '')}<span class="v28-sub">${ae(m.createdBy ? AL.tsName ? AL.tsName(m.createdBy) : m.createdBy.email : '')}</span></td><td>${m.journal ? ae(m.journal.referenceNumber.slice(0, 16)) : '<span class="v28-sub">—</span>'}</td></tr>`;
  }).join('');
  return rows ? AL.table(['When', 'Item', 'Movement', 'Quantity', 'Unit cost', 'Value', 'Detail', 'Journal'], rows, '1180px') : AL.empty('No stock movements yet.');
};
AL.wire.inventory = () => {
  document.querySelectorAll('[data-inv-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.invF;
    if (k === 'q') el.addEventListener('input', () => { AL.ui.inv.q = el.value; clearTimeout(AL.invT); AL.invT = setTimeout(() => { AL.redraw(); const n = document.querySelector('[data-inv-f="q"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    else el.addEventListener('change', () => { AL.ui.inv[k] = el.value; AL.redraw(); });
  });
};
AL.actions['inv-tab'] = (el) => { AL.ui.inv.tab = el.dataset.t; AL.redraw(); };
AL.invFind = (id) => AL.invItems().find((i) => i.id === id);
/** Accounts for the other side of a movement, by kind; the preferred one first. */
AL.invAccounts = async (kind) => {
  const lk = AL.jeLookups(); if (lk.pending) await lk.pending;
  const all = ((lk.data && lk.data.accounts) || []).filter((a) => a.isActive !== false && a.accountNo !== '1000');
  const pick = { from: (a) => /^[23]/.test(a.accountNo) || /Current Asset/.test(a.accountType), to: (a) => /^5/.test(a.accountNo), variance: (a) => /^5/.test(a.accountNo), stock: (a) => /Current Asset/.test(a.accountType) }[kind];
  return all.filter(pick).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo))).map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}`, no: a.accountNo }));
};
AL.invDefault = (opts, no) => (opts.find((o) => o.no === no) || {}).value || '';
AL.invAfter = () => AL.invReload();
AL.invDone = (r) => (r && r.journalReference ? `On hand ${Number(r.onHandAfter).toLocaleString('en-US')}; journal ${r.journalReference.slice(0, 16)} posted.` : '');
AL.actions['inv-new'] = (el) => AL.busy(el, async () => {
  const [stock, from] = await Promise.all([AL.invAccounts('stock'), AL.invAccounts('from')]);
  AL.form({ title: 'Add an inventory item', wide: true, submitLabel: 'Add', doneTitle: 'Item added', fields: [
    { k: 'skuNumber', label: 'SKU', required: true }, { k: 'itemName', label: 'Name', required: true },
    { k: 'unitOfMeasure', label: 'Unit' }, { k: 'reorderLevel', label: 'Reorder level', type: 'number', min: 0, step: 'any' },
    { k: 'inventoryAssetAccountId', label: 'Inventory account', type: 'select', required: true, options: stock },
    { k: 'costOfPurchase', label: 'Unit cost', type: 'number', min: 0.01, step: '0.01', required: true },
    { k: 'quantityOnHand', label: 'Opening quantity', type: 'number', min: 0, step: 'any' },
    { k: 'openingContraAccountId', label: 'Opening quantity came from', type: 'select', options: from },
    { k: 'description', label: 'Description', type: 'textarea', wide: true },
  ], initial: { unitOfMeasure: 'pieces', reorderLevel: 0, quantityOnHand: 0, inventoryAssetAccountId: AL.invDefault(stock, '1400'), openingContraAccountId: AL.invDefault(from, '3900') },
  validate: (v) => (Number(v.quantityOnHand) > 0 && !v.openingContraAccountId ? 'Choose where the opening quantity came from.' : ''),
  onSubmit: async (v) => { await AL.post('/accounting/inventory/items', { ...v, openingContraAccountId: Number(v.quantityOnHand) > 0 ? v.openingContraAccountId : undefined }); return `${v.skuNumber} ${v.itemName}`; }, after: AL.invAfter });
});
AL.actions['inv-edit'] = (el) => { const i = AL.invFind(el.dataset.id); if (!i) return; AL.form({ title: `Change ${i.skuNumber}`, submitLabel: 'Save', doneTitle: 'Item changed', fields: [
  { k: 'itemName', label: 'Name', required: true, wide: true }, { k: 'unitOfMeasure', label: 'Unit' }, { k: 'reorderLevel', label: 'Reorder level', type: 'number', min: 0, step: 'any' }, { k: 'description', label: 'Description', type: 'textarea', wide: true }, { k: 'isActive', label: 'Active (can be received and issued)', type: 'checkbox' },
], initial: { itemName: i.itemName, unitOfMeasure: i.unitOfMeasure || '', reorderLevel: Number(i.reorderLevel), description: i.description || '', isActive: i.isActive !== false },
  onSubmit: async (v) => { await AL.put(`/accounting/inventory/items/${encodeURIComponent(i.id)}`, { ...v, reorderLevel: Number(v.reorderLevel) }); return ''; }, after: AL.invAfter }); };
AL.actions['inv-in'] = (el) => AL.busy(el, async () => {
  const i = AL.invFind(el.dataset.id); if (!i) return; const from = await AL.invAccounts('from');
  AL.form({ title: `Receive ${i.skuNumber}`, sub: `${Number(i.quantityOnHand)} ${i.unitOfMeasure || ''} on hand at ${AL.money(i.costOfPurchase)}`, submitLabel: 'Receive', doneTitle: 'Stock received', fields: [
    { k: 'quantity', label: 'Quantity', type: 'number', min: 0, step: 'any', required: true }, { k: 'unitCost', label: 'Unit cost', type: 'number', min: 0.01, step: '0.01', required: true },
    { k: 'contraAccountId', label: 'Came from', type: 'select', required: true, options: from }, { k: 'reference', label: 'Reference (GRN, invoice)' },
  ], initial: { unitCost: Number(i.costOfPurchase) || '' },
  onSubmit: async (v) => AL.invDone(await AL.post('/accounting/inventory/movements', { itemId: i.id, movementType: 'IN', quantity: Number(v.quantity), unitCost: Number(v.unitCost), contraAccountId: v.contraAccountId, reference: v.reference || null, description: v.reference ? `Received · ${v.reference}` : 'Received' })), after: AL.invAfter });
});
AL.actions['inv-out'] = (el) => AL.busy(el, async () => {
  const i = AL.invFind(el.dataset.id); if (!i) return; const to = await AL.invAccounts('to');
  AL.form({ title: `Issue ${i.skuNumber}`, sub: `${Number(i.quantityOnHand)} ${i.unitOfMeasure || ''} on hand, issued at ${AL.money(i.costOfPurchase)} each`, submitLabel: 'Issue', doneTitle: 'Stock issued', fields: [
    { k: 'quantity', label: 'Quantity', type: 'number', min: 0, step: 'any', required: true }, { k: 'contraAccountId', label: 'Charged to', type: 'select', required: true, options: to }, { k: 'description', label: 'Used for', required: true, wide: true },
  ], initial: { contraAccountId: AL.invDefault(to, '5005') },
  validate: (v) => (Number(v.quantity) > Number(i.quantityOnHand) ? `Only ${Number(i.quantityOnHand)} on hand.` : ''),
  onSubmit: async (v) => AL.invDone(await AL.post('/accounting/inventory/movements', { itemId: i.id, movementType: 'OUT', quantity: Number(v.quantity), contraAccountId: v.contraAccountId, description: v.description })), after: AL.invAfter });
});
AL.actions['inv-count'] = (el) => AL.busy(el, async () => {
  const i = AL.invFind(el.dataset.id); if (!i) return; const vr = await AL.invAccounts('variance');
  AL.form({ title: `Count ${i.skuNumber}`, sub: `${Number(i.quantityOnHand)} ${i.unitOfMeasure || ''} on the books at ${AL.money(i.costOfPurchase)} each`, submitLabel: 'Book the difference', doneTitle: 'Count booked', fields: [
    { k: 'counted', label: 'Counted quantity', type: 'number', min: 0, step: 'any', required: true }, { k: 'contraAccountId', label: 'Difference to', type: 'select', required: true, options: vr }, { k: 'reason', label: 'Reason', required: true, wide: true },
  ], initial: { contraAccountId: AL.invDefault(vr, '5095') },
  validate: (v) => (Number(v.counted) === Number(i.quantityOnHand) ? 'The count agrees with the books; nothing to book.' : ''),
  onSubmit: async (v) => { const d = Math.round((Number(v.counted) - Number(i.quantityOnHand)) * 10000) / 10000; return AL.invDone(await AL.post('/accounting/inventory/adjustments', { itemId: i.id, quantity: d, reason: v.reason, contraAccountId: v.contraAccountId })); }, after: AL.invAfter });
});
AL.actions['inv-item-moves'] = (el) => AL.busy(el, async () => {
  const i = AL.invFind(el.dataset.id); if (!i) return;
  const list = await AL.get(`/accounting/inventory/movements?itemId=${encodeURIComponent(i.id)}&limit=200`);
  AL.form({ title: `${i.skuNumber} · movements`, sub: i.itemName, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${AL.invMovesTable(list || [])}</div>`, onSubmit: async () => false });
});
