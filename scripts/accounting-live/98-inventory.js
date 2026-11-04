/* Inventory: /accounting/inventory — the stock sub-ledger. Items with quantity, moving weighted-average cost and value;
 * receive (at a cost, from a payable, bank or opening balance), issue (to cost of sales or an expense) and count (an
 * approver books the difference to a variance account). Each movement posts its journal with it, so the ledger and the
 * stock agree; the ledger check shows it, and the roll-forward gives opening + receipts − issues ± adjustments = closing
 * for a month. Data: /accounting/inventory/*. */
AL.ui.inv = AL.ui.inv || { tab: 'items', q: '', month: '', pages: {} };
AL.invLoad = () => ({
  items: AL.res('inv-items', async () => { const all = []; let page = 1; let totalPages = 1; do { const d = await AL.get(`/accounting/inventory/items?page=${page}&limit=100`); all.push(...(d.items || d)); totalPages = Number(d.totalPages) || 1; page++; } while (page <= totalPages); return all; }),
  tie: AL.res('inv-tie', () => AL.get('/accounting/inventory/tie-out')),
  moves: AL.res('inv-moves', async () => { const all = []; let page = 1; let totalPages = 1; do { const d = await AL.get(`/accounting/inventory/movements?page=${page}&limit=100`); all.push(...(d.items || d)); totalPages = Number(d.totalPages) || 1; page++; } while (page <= totalPages); return all; }),
});
AL.invReload = () => { Object.keys(AL.cache).filter((k) => k.startsWith('inv-')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.invItems = () => { const d = AL.cache['inv-items'] && AL.cache['inv-items'].data; return (d && (d.items || d)) || []; };
AL.invMonth = () => AL.ui.inv.month || AL.stiToday().slice(0, 7);

AL.page('inventory', () => {
  AL.meLoad();
  const L = AL.invLoad(), u = AL.ui.inv;
  const canPrep = AL.can('manage_accounting'), canCount = AL.can('manage_ledger');
  const head = AL.head('Daily accounting', 'Inventory', '', `${AL.exportBtns('inv-export')} ${canPrep ? `${AL.btn('Import items', 'inv-import', 'small')}${AL.btn('Add item', 'inv-new', 'primary')}` : ''}`);
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
  const tabs = `<div class="v28-tabbar">${[['items', 'Stock items'], ['moves', 'Stock movements'], ['roll', 'Monthly summary'], ['tie', 'Ledger comparison']].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="inv-tab" data-t="${id}">${l}</button>`).join('')}</div>`;
  const tabHelp = { items: 'Products, quantities on hand, average cost, stock value and reorder levels.', moves: 'A history of stock received, issued or adjusted. Each movement records who did it and its accounting journal.', roll: 'For the selected month: opening stock plus receipts, minus issues, adjusted for counts, equals closing stock.', tie: 'Compares the value of stock with its Inventory asset account in the general ledger. A zero difference means they agree.' }[u.tab];
  let body = '';
  if (u.tab === 'items') {
    const q = u.q.trim().toLowerCase();
    const filtered = items.filter((i) => !q || `${i.skuNumber} ${i.itemName}`.toLowerCase().includes(q));
    const page = AL.invPage('items', filtered); const rows = page.rows.map((i) => {
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
    body = `<div class="al-filters"><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-inv-f="q" value="${ae(u.q)}" placeholder="SKU or name"></label></div>${rows ? `${AL.table(['Item', 'On hand', 'Average cost', 'Value', 'Inventory account', 'Status', ''], rows, '1100px')}${AL.invPager('items', page)}` : AL.empty('No inventory items yet.')}`;
  } else if (u.tab === 'moves') {
    if (L.moves.state === 'ok') { const page = AL.invPage('moves', L.moves.data); body = `${AL.invMovesTable(page.rows)}${AL.invPager('moves', page)}`; }
    else body = AL.gate(L.moves, { key: 'inv-moves' }) || '';
  } else if (u.tab === 'roll') {
    const m = AL.invMonth();
    const [y, mo] = m.split('-').map(Number);
    const to = `${m}-${String(new Date(Date.UTC(y, mo, 0)).getUTCDate()).padStart(2, '0')}`;
    const e = AL.res(`inv-roll-${m}`, () => AL.get(`/accounting/inventory/roll-forward?from=${m}-01&to=${to}`));
    const cell = (x) => `${ae(x.qty.toLocaleString('en-US'))}<span class="v28-sub">${ae(AL.money(x.value))}</span>`;
    const rollRows = e.state === 'ok' ? (e.data.rows || []) : []; const page = AL.invPage('roll', rollRows);
    const rows = page.rows.map((r) => `<tr><td><strong>${ae(r.sku)}</strong><span class="v28-sub">${ae(r.name)}</span></td><td class="num">${cell(r.opening)}</td><td class="num">${cell(r.receipts)}</td><td class="num">${cell(r.issues)}</td><td class="num">${cell(r.adjustments)}</td><td class="num"><strong>${cell(r.closing)}</strong></td></tr>`).join('');
    const tot = (k) => (e.state === 'ok' ? e.data.rows.reduce((s, r) => s + r[k].value, 0) : 0);
    body = `<div class="al-filters"><label class="v28-field"><span>Month</span><input class="v28-input" type="month" data-inv-f="month" value="${ae(m)}"></label></div>${AL.gate(e, { key: `inv-roll-${m}` }) || (rows ? `${AL.table(['Item', 'Opening', 'Received', 'Issued', 'Counted ±', 'Closing'], rows, '960px')}${AL.invPager('roll', page)}` : AL.empty('No stock moved in this month.'))}`;
  } else {
    const page = AL.invPage('tie', tie); const rows = page.rows.map((r) => `<tr><td>${ae(r.account)}<span class="v28-sub">${r.items} item${r.items === 1 ? '' : 's'}</span></td><td class="num">${ae(AL.money(r.stockValue))}</td><td class="num">${ae(AL.money(r.ledgerBalance))}</td><td class="num">${Math.abs(r.difference) < 0.005 ? '<span class="al-ok">None</span>' : `<span class="al-bad">${ae(AL.money(r.difference))}</span>`}</td></tr>`).join('');
    body = AL.gate(L.tie, { key: 'inv-tie' }) || (rows ? `${AL.table(['Inventory account', 'Stock value', 'Ledger balance', 'Difference'], rows, '760px')}${AL.invPager('tie', page)}` : AL.empty('No inventory accounts in use.'));
  }
  return `<div class="v28-page">${head}${kpis}${AL.panel('Inventory records', '', `${tabs}<p class="v28-sub al-inv-tab-help">${tabHelp}</p>${body}`)}</div>`;
});
AL.invPage = (key, data) => { const size = 10, count = data.length, totalPages = Math.max(1, Math.ceil(count / size)); const pages = AL.ui.inv.pages || (AL.ui.inv.pages = {}); pages[key] = Math.min(Math.max(1, pages[key] || 1), totalPages); const page = pages[key], start = (page - 1) * size; return { page, size, totalPages, start, count, rows: data.slice(start, start + size) }; };
AL.invPager = (key, p) => `<div class="apq-pagination"><span>Showing ${p.count ? p.start + 1 : 0}–${Math.min(p.start + p.size, p.count)} of ${p.count}</span><div>${p.totalPages > 1 ? `${AL.btn('Previous', 'inv-page', 'small', `data-key="${key}" data-dir="-1"${p.page <= 1 ? ' disabled' : ''}`)}<span>Page ${p.page} of ${p.totalPages}</span>${AL.btn('Next', 'inv-page', 'small', `data-key="${key}" data-dir="1"${p.page >= p.totalPages ? ' disabled' : ''}`)}` : ''}</div></div>`;
AL.invMovesTable = (list) => {
  const TYPE = { IN: 'Received', OUT: 'Issued', ADJUSTMENT: 'Count difference' };
  const rows = list.map((m) => {
    const q = m.movementType === 'OUT' ? -Math.abs(Number(m.quantity)) : m.movementType === 'IN' ? Math.abs(Number(m.quantity)) : Number(m.quantity);
    return `<tr><td>${ae(AL.dateTime(m.createdAt))}</td><td>${m.item ? `<strong>${ae(m.item.skuNumber)}</strong><span class="v28-sub">${ae(m.item.itemName)}</span>` : ''}</td><td>${ae(TYPE[m.movementType] || m.movementType)}</td><td class="num">${q > 0 ? '+' : ''}${ae(q.toLocaleString('en-US'))}</td><td class="num">${ae(AL.money(m.unitCost))}</td><td class="num">${ae(AL.money(Math.abs(Number(m.totalCost))))}</td><td class="al-wrap">${ae(m.description || m.reference || '')}<span class="v28-sub">${ae(m.createdBy ? AL.tsName ? AL.tsName(m.createdBy) : m.createdBy.email : '')}</span></td><td>${m.journal ? ae(m.journal.referenceNumber.slice(0, 16)) : '<span class="v28-sub">—</span>'}</td></tr>`;
  }).join('');
  return rows ? AL.table(['When', 'Item', 'Movement', 'Quantity', 'Unit cost', 'Value', 'Detail', 'Journal'], rows, '1180px') : AL.empty('No stock movements yet.');
};
AL.invExportSpec = () => {
  const u = AL.ui.inv, items = AL.invItems(), moves = (AL.cache['inv-moves'] && AL.cache['inv-moves'].data) || [], tie = (AL.cache['inv-tie'] && AL.cache['inv-tie'].data) || [];
  const m = AL.invMonth(), roll = (AL.cache[`inv-roll-${m}`] && AL.cache[`inv-roll-${m}`].data || {}).rows || [];
  if (u.tab === 'moves') return { title: 'Inventory Movements', subtitle: 'Stock movement history', columns: ['Date', 'SKU', 'Item', 'Movement', 'Quantity', 'Unit cost', 'Value', 'Detail', 'Journal'], rows: moves.map((x) => [AL.dateTime(x.createdAt), x.item?.skuNumber || '', x.item?.itemName || '', x.movementType, Number(x.quantity), Number(x.unitCost), Number(x.totalCost), x.description || x.reference || '', x.journal?.referenceNumber || '']), filename: 'inventory-movements' };
  if (u.tab === 'roll') return { title: 'Inventory Month Roll-forward', subtitle: m, columns: ['SKU', 'Item', 'Opening Qty', 'Opening Value', 'Receipts Qty', 'Receipts Value', 'Issues Qty', 'Issues Value', 'Adjustments Qty', 'Adjustments Value', 'Closing Qty', 'Closing Value'], rows: roll.map((x) => [x.sku, x.name, x.opening.qty, x.opening.value, x.receipts.qty, x.receipts.value, x.issues.qty, x.issues.value, x.adjustments.qty, x.adjustments.value, x.closing.qty, x.closing.value]), filename: `inventory-roll-forward-${m}` };
  if (u.tab === 'tie') return { title: 'Inventory Ledger Check', subtitle: 'Inventory asset account balances compared with stock valuation', columns: ['Inventory Account', 'Items', 'Stock Value', 'Ledger Balance', 'Difference'], rows: tie.map((x) => [x.account, x.items, x.stockValue, x.ledgerBalance, x.difference]), filename: 'inventory-ledger-check' };
  return { title: 'Inventory Items', subtitle: 'Perpetual stock register', columns: ['SKU', 'Item Name', 'Description', 'Unit', 'On Hand', 'Average Unit Cost', 'Stock Value', 'Reorder Level', 'Inventory Account', 'Status'], rows: items.map((x) => [x.skuNumber, x.itemName, x.description || '', x.unitOfMeasure || '', Number(x.quantityOnHand), Number(x.costOfPurchase), Number(x.quantityOnHand) * Number(x.costOfPurchase), Number(x.reorderLevel), x.inventoryAssetAccount ? `${x.inventoryAssetAccount.accountNo} ${x.inventoryAssetAccount.accountName}` : '', x.isActive === false ? 'Inactive' : 'Active']), filename: 'inventory-items' };
};
AL.actions['inv-export'] = (el) => { const spec = AL.invExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There are no Inventory rows to export.', 'bad'); return AL.exportRun(el, spec, 'inventory records'); };
AL.actions['inv-page'] = (el) => { const pages = AL.ui.inv.pages || (AL.ui.inv.pages = {}); pages[el.dataset.key] = Math.max(1, (pages[el.dataset.key] || 1) + Number(el.dataset.dir || 0)); AL.redraw(); };
AL.actions['inv-template-csv'] = () => AL.saveText('SKU,Item Name,Description,Unit,Opening Quantity,Unit Cost,Reorder Level,Inventory Account No,Opening Contra Account No\nEXAMPLE-001,Example item,Replace this sample row,pieces,0,12.50,5,,\n', 'inventory-import-template.csv');
AL.actions['inv-template-excel'] = async () => { const spec = { title: 'Inventory Import Template', subtitle: 'Replace the example row. Use an active Inventory Current Asset account number from your chart of accounts.', columns: ['SKU', 'Item Name', 'Description', 'Unit', 'Opening Quantity', 'Unit Cost', 'Reorder Level', 'Inventory Account No', 'Opening Contra Account No'], rows: [['EXAMPLE-001', 'Example item', 'Replace this sample row', 'pieces', 0, 12.5, 5, '', '']], filename: 'inventory-import-template' }; try { await AL.exportFile('excel', spec); } catch (e) { AL.toast('Template unavailable', AL.msg(e), 'bad'); } };
AL.invImportProgressMarkup = () => `<div class="al-inv-import-progress" id="invImportProgress" role="status" aria-live="polite" hidden><span class="al-inv-import-spinner" aria-hidden="true"></span><div><strong id="invImportProgressText">Preparing import…</strong><small>Keep this window open until the server finishes.</small></div><span class="al-inv-progress-track" role="progressbar" aria-label="Inventory import in progress"><i></i></span></div>`;
AL.invImportProgress = (message, tone = 'loading') => { const box = document.getElementById('invImportProgress'); if (!box) return; box.hidden = false; box.classList.toggle('is-error', tone === 'error'); box.classList.toggle('is-ready', tone === 'ready'); const text = document.getElementById('invImportProgressText'); if (text) text.textContent = message; const spinner = box.querySelector('.al-inv-import-spinner'), track = box.querySelector('.al-inv-progress-track'); if (spinner) spinner.hidden = tone !== 'loading'; if (track) track.hidden = tone !== 'loading'; };
AL.actions['inv-import'] = () => {
  const selected = { file: null, preview: null, request: 0 };
  AL.form({ title: 'Import Inventory items', sub: 'Choose a CSV or Excel file. It will be checked automatically before import.', wide: true, submitLabel: 'Import', fields: [], extra: `<div class="al-wide"><p class="v28-sub">${AL.btn('Download CSV template', 'inv-template-csv', 'small')} ${AL.btn('Download Excel template', 'inv-template-excel', 'small')}</p><label class="v28-field"><span>Inventory file *</span><input class="v28-input" id="invImportFile" type="file" accept=".csv,.xls,.xlsx" required></label><p class="v28-sub">Up to 500 rows and 10 MB. Each item needs a unique SKU, name, positive unit cost and active inventory asset account. Opening quantity also needs an opening contra account.</p>${AL.invImportProgressMarkup()}<div class="al-inv-import-results" id="invImportResults" aria-live="polite"></div></div>`, onSubmit: async () => {
    if (!selected.file) throw new Error('Choose an Inventory CSV or Excel file first.');
    if (!selected.preview?.valid) throw new Error('Wait for the file check to finish and correct any validation issues.');
    const file = selected.file;
    AL.invImportProgress(`Importing ${selected.preview.totalRows} items into Inventory…`);
    try { const fd = new FormData(); fd.append('file', file); const result = AL.unwrap(await AL.http().form('/accounting/inventory/items/bulk-import', fd)); AL.close(); AL.toast('Inventory import complete', `${result.imported} item(s) imported${result.failed ? `; ${result.failed} failed` : ''}.`, result.failed ? 'bad' : ''); AL.invReload(); return false; }
    catch (error) { AL.invImportProgress(`Import failed: ${AL.msg(error)}`, 'error'); throw error; }
  } });

  const fileInput = document.getElementById('invImportFile');
  const importButton = document.querySelector('#alOverlay [data-al="form-submit"]');
  const results = document.getElementById('invImportResults');
  if (!fileInput || !importButton || !results) return;
  importButton.disabled = true;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0] || null; const request = ++selected.request;
    selected.file = file; selected.preview = null; importButton.disabled = true; results.innerHTML = '';
    if (!file) { const box = document.getElementById('invImportProgress'); if (box) box.hidden = true; return; }
    AL.invImportProgress(`Checking ${file.name}…`);
    try {
      const fd = new FormData(); fd.append('file', file);
      const preview = AL.unwrap(await AL.http().form('/accounting/inventory/items/bulk-import/preview', fd));
      if (request !== selected.request || file !== selected.file) return;
      selected.preview = preview;
      const errors = preview.errors || [];
      if (preview.valid) {
        importButton.disabled = false;
        AL.invImportProgress(`${preview.totalRows} items checked. Ready to import.`, 'ready');
        results.innerHTML = preview.rows?.length ? `${AL.table(['SKU', 'Item', 'Unit', 'Opening Qty', 'Unit Cost', 'Reorder', 'Inventory Account'], preview.rows.map((x) => `<tr><td>${ae(x.skuNumber)}</td><td>${ae(x.itemName)}</td><td>${ae(x.unitOfMeasure)}</td><td>${ae(String(x.quantityOnHand))}</td><td>${ae(AL.money(x.costOfPurchase))}</td><td>${ae(String(x.reorderLevel))}</td><td>${ae(x.inventoryAccountNo)}</td></tr>`).join(''), '900px')}${preview.totalRows > preview.rows.length ? `<p class="v28-sub">Showing ${preview.rows.length} of ${preview.totalRows} validated items.</p>` : ''}` : '';
      } else {
        AL.invImportProgress(`Validation found ${errors.length} issue(s). Correct the file before importing.`, 'error');
        results.innerHTML = errors.length ? `<ul class="al-inv-import-errors">${errors.map((x) => `<li>Row ${x.row}: ${ae(x.message)}</li>`).join('')}</ul>` : '<p class="v28-sub">The file has no importable item rows.</p>';
      }
    } catch (error) {
      if (request !== selected.request) return;
      AL.invImportProgress(`File check failed: ${AL.msg(error)}`, 'error');
      results.innerHTML = `<p class="al-inv-import-errors">${ae(AL.msg(error))}</p>`;
    }
  });
};
AL.wire.inventory = () => {
  document.querySelectorAll('[data-inv-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.invF;
    if (k === 'q') el.addEventListener('input', () => { AL.ui.inv.q = el.value; AL.ui.inv.pages.items = 1; clearTimeout(AL.invT); AL.invT = setTimeout(() => { AL.redraw(); const n = document.querySelector('[data-inv-f="q"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    else el.addEventListener('change', () => { AL.ui.inv[k] = el.value; AL.ui.inv.pages.roll = 1; AL.redraw(); });
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
  const first = await AL.get(`/accounting/inventory/movements?itemId=${encodeURIComponent(i.id)}&page=1&limit=100`); const list = first.items || first;
  for (let page = 2; page <= (first.totalPages || 1); page++) { const next = await AL.get(`/accounting/inventory/movements?itemId=${encodeURIComponent(i.id)}&page=${page}&limit=100`); list.push(...(next.items || next)); }
  AL.form({ title: `${i.skuNumber} · movements`, sub: i.itemName, wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide">${AL.invMovesTable(list || [])}</div>`, onSubmit: async () => false });
});
