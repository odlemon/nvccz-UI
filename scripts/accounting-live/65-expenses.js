/* Expenses: /accounting/expenses — expenses recorded against a supplier and category, paid from a named bank, in cash or
 * on credit; each is submitted with a draft journal and approved (posted) or returned (rejected) by an approver who did
 * not record it. Data: /accounting/expenses, /accounting/expense-categories, /cashbook/vendors, /cashbook/banks,
 * /accounting/journal-entries/:id/post|void. */
AL.ui.exp = AL.ui.exp || { tab: 'ALL' };
AL.expVendorLabel = (v) => {
  const name = String(v && v.name || '').trim();
  // Legacy UAT vendor seeds accidentally stored an ID-like `adv…` token in the name.
  // Keep IDs out of the UI while preserving the supplier's actual readable name.
  return name.replace(/^(?:cm[a-z0-9]{20,}|adv[a-z0-9]{7,12})\s+/i, '').trim() || 'Supplier name unavailable';
};
AL.expLoad = () => AL.res('exp', async () => {
  const all = []; let page = 1; let totalPages = 1;
  do { const response = await AL.getRaw(`/accounting/expenses?page=${page}&limit=100`); all.push(...(response?.data || [])); totalPages = Number(response?.pagination?.totalPages) || 1; page++; } while (page <= totalPages);
  const cats = await AL.get('/accounting/expense-categories').catch(() => []);
  return { expenses: all, categories: Array.isArray(cats) ? cats : [] };
});
AL.expReload = () => { delete AL.cache.exp; AL.redraw(); };
AL.expStatus = { SUBMITTED: ['Awaiting approval', 'warn'], POSTED: ['Awaiting approval', 'warn'], DRAFT: ['Draft', 'warn'], APPROVED: ['Approved', 'ok'], REJECTED: ['Returned', 'bad'], VOIDED: ['Voided', 'bad'] };
AL.expPay = { BANK: 'Bank', CASH: 'Petty cash', CREDIT: 'On credit (supplier)' };

AL.page('expenses', () => {
  AL.meLoad();
  const canPrepare = AL.can('manage_accounting'), canPost = AL.can('manage_ledger');
  const e = AL.expLoad();
  const head = AL.head('Spend', 'Expenses', 'Business costs are submitted for independent approval; approval posts the expense and its payment or payable to the ledger.', [AL.exportBtns('exp-export'), canPrepare ? AL.btn('Import expenses', 'exp-import') + AL.btn('Record expense', 'exp-new', 'primary') : ''].join(''));
  const g = AL.gate(e, { key: 'exp', errorTitle: 'Expenses could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { expenses } = e.data;
  const me = AL.me().id;
  const waiting = expenses.filter((x) => x.status === 'SUBMITTED' || x.status === 'POSTED');
  const month = AL.stiToday().slice(0, 7);
  const approvedMonth = expenses.filter((x) => x.status === 'APPROVED' && String(x.transactionDate).slice(0, 7) === month);
  const kpis = AL.kpis([
    ['Awaiting approval', String(waiting.length), AL.money(waiting.reduce((t, x) => t + Number(x.totalAmount || 0), 0)), waiting.length ? '#f79009' : '#12b76a'],
    ['Waiting on me', String(canPost ? waiting.filter((x) => x.createdById !== me).length : 0), canPost ? 'Recorded by others' : 'Approvers approve'],
    ['Approved this month', AL.money(approvedMonth.reduce((t, x) => t + Number(x.totalAmount || 0), 0)), AL.plural(approvedMonth.length, 'expense')],
    ['Returned', String(expenses.filter((x) => x.status === 'REJECTED').length), 'Not approved'],
  ]);
  const tab = AL.ui.exp.tab || (AL.ui.exp.tab = 'ALL');
  const tabs = `<div class="v28-tabbar">${[['ALL', 'All'], ['SUBMITTED', 'Awaiting approval'], ['APPROVED', 'Approved'], ['REJECTED', 'Returned']].map(([id, label]) => `<button class="v28-tab ${tab === id ? 'active' : ''}" data-al="exp-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  const shown = expenses.filter((x) => tab === 'ALL' || (tab === 'SUBMITTED' ? (x.status === 'SUBMITTED' || x.status === 'POSTED') : tab === 'REJECTED' ? (x.status === 'REJECTED' || x.status === 'VOIDED') : x.status === tab));
  const pageSize = 10, totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
  AL.ui.exp.page = Math.min(Math.max(1, Number(AL.ui.exp.page) || 1), totalPages);
  const pageRows = shown.slice((AL.ui.exp.page - 1) * pageSize, AL.ui.exp.page * pageSize);
  const rows = pageRows.map((x) => {
    const st = AL.expStatus[x.status] || [x.status, 'info'];
    const c = (x.currency && x.currency.code) || '';
    const own = x.createdById === me;
    const acts = [];
    // Keep one visible row action. Two inline buttons were moved into a generic
    // table overflow menu, which made approval unreachable on the live page.
    // Review opens the detail drawer where the independent approver can decide.
    if ((x.status === 'SUBMITTED' || x.status === 'POSTED') && canPost && !own && x.journalEntryId) acts.push(AL.btn('Review', 'exp-detail', 'small primary', `data-id="${ae(x.id)}"`));
    return `<tr data-al="exp-detail" data-id="${ae(x.id)}" tabindex="0" role="button" aria-label="Open expense ${ae(x.description || 'Expense details')}">
      <td>${ae(AL.date(x.transactionDate))}</td>
      <td class="al-wrap"><strong>${ae(x.description)}</strong><span class="v28-sub">${ae([x.category && x.category.name, x.receiptNumber].filter(Boolean).join(' · '))}</span></td>
      <td>${ae(AL.expVendorLabel(x.vendor))}</td>
      <td>${ae(AL.expPay[x.paymentMethod] || x.paymentMethod)}</td>
      <td>${ae(AL.money(x.totalAmount, c))}${Number(x.vatAmount) ? `<span class="v28-sub">VAT ${ae(AL.money(x.vatAmount, c))}</span>` : ''}</td>
      <td>${ae(AL.jeWho(x.createdBy))}${own ? '<span class="v28-sub">You</span>' : ''}</td>
      <td>${AL.status(st[0], st[1])}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  const pager = shown.length ? `<div class="apq-pagination"><span>Showing ${(AL.ui.exp.page - 1) * pageSize + 1}–${Math.min(AL.ui.exp.page * pageSize, shown.length)} of ${shown.length} expenses</span><div>${AL.btn('Previous', 'exp-page', 'small', `data-dir="-1"${AL.ui.exp.page <= 1 ? ' disabled' : ''}`)}<span>Page ${AL.ui.exp.page} of ${totalPages}</span>${AL.btn('Next', 'exp-page', 'small', `data-dir="1"${AL.ui.exp.page >= totalPages ? ' disabled' : ''}`)}</div></div>` : '';
  const expTable = rows ? `${AL.table(['Date', 'Expense', 'Supplier', 'Paid', 'Amount', 'Recorded by', 'Status', ''], rows, '1150px')}${pager}` : AL.empty(tab === 'SUBMITTED' ? 'Nothing is waiting for approval.' : 'None here.');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Expenses', '', `${tabs}${expTable}`)}</div>`;
});
AL.actions['exp-tab'] = (el) => { AL.ui.exp.tab = el.dataset.tab; AL.ui.exp.page = 1; AL.redraw(); };
AL.actions['exp-page'] = (el) => { AL.ui.exp.page = Math.max(1, (Number(AL.ui.exp.page) || 1) + Number(el.dataset.dir || 0)); AL.redraw(); };
AL.expExportSpec = () => {
  const expenses = AL.expLoad().data?.expenses || [], tab = AL.ui.exp.tab;
  const shown = expenses.filter(x => tab === 'ALL' || (tab === 'SUBMITTED' ? x.status === 'SUBMITTED' || x.status === 'POSTED' : tab === 'REJECTED' ? x.status === 'REJECTED' || x.status === 'VOIDED' : x.status === tab));
  return { title: 'Expenses', subtitle: 'Expense register and approval status', columns: ['Date', 'Expense', 'Supplier', 'Category', 'Payment method', 'Receipt / invoice', 'Amount', 'VAT', 'Total', 'Currency', 'Status', 'Recorded by', 'Journal'], rows: shown.map(x => [AL.date(x.transactionDate), x.description, AL.expVendorLabel(x.vendor), x.category?.name || '', AL.expPay[x.paymentMethod] || x.paymentMethod, x.receiptNumber || '', Number(x.amount), Number(x.vatAmount), Number(x.totalAmount), x.currency?.code || '', x.status, AL.jeWho(x.createdBy), x.journalEntry?.referenceNumber || '']), filename: 'expenses' };
};
AL.actions['exp-export'] = (el) => { const spec = AL.expExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There are no expense rows in this view.', 'bad'); return AL.exportRun(el, spec, 'expense records'); };
AL.expFind = (id) => ((AL.cache.exp && AL.cache.exp.data && AL.cache.exp.data.expenses) || []).find((x) => x.id === id);
AL.expDocs = async (id) => {
  const docs = await AL.get(`/accounting/documents/expenses/${encodeURIComponent(id)}`).catch(() => []);
  return Array.isArray(docs) ? docs : (docs && (docs.documents || docs.items)) || [];
};
AL.expDocSize = (b) => (b == null ? '—' : b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 102.4) / 10} KB` : `${Math.round(b / 104857.6) / 10} MB`);
AL.expDocPanel = (docs, id) => {
  const rows = (docs || []).map((d) => `<div class="v28-list-row" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid #e7edf4">
    <div><strong>${ae(d.name || 'Supporting document')}</strong><span class="v28-sub">${ae(d.mimeType || 'File')} · ${ae(AL.expDocSize(d.fileSizeBytes))} · ${ae(AL.dateTime(d.createdAt))}</span></div>
    ${d.fileUrl ? `<a class="v28-btn small" href="${ae(d.fileUrl)}" target="_blank" rel="noopener">Open file</a>` : '<span class="v28-sub">Metadata only</span>'}
  </div>`).join('');
  return `${rows || AL.empty('No supporting documents have been uploaded.')}${AL.btn('Attach supporting document', 'exp-upload', 'small primary', `data-id="${ae(id)}"`)}`;
};
AL.actions['exp-detail'] = async (el) => {
  const x = AL.expFind(el.dataset.id); if (!x) return;
  const [docs, journalResult] = await Promise.all([
    AL.expDocs(x.id),
    x.journalEntryId ? AL.get(`/accounting/journal-entries/${encodeURIComponent(x.journalEntryId)}`).then(data => ({ data })).catch(error => ({ error })) : Promise.resolve(null),
  ]);
  const rawJournal = journalResult?.data;
  const journal = rawJournal?.journalEntry ? { ...rawJournal.journalEntry, journalEntryLines: rawJournal.journalEntry.journalEntryLines || rawJournal.journalEntryLines || [] } : rawJournal;
  if (journal && !journal.currency) journal.currency = x.currency;
  const journalStatus = journal ? (AL.jeStatus[journal.status]?.[0] || journal.status || 'Unknown') : '';
  const journalPanel = !x.journalEntryId ? AL.empty('No journal is linked to this expense.') : journalResult?.error ? `<p class="v28-sub">The linked journal could not be loaded. ${ae(AL.msg(journalResult.error))}</p>` : !journal ? AL.empty('The linked journal could not be found.') : `${AL.statusRows([['Reference', journal.referenceNumber || 'Unavailable', 'Journal'], ['Date', AL.date(journal.transactionDate), 'Transaction date'], ['Status', journalStatus, 'Journal status']])}${(journal.journalEntryLines || []).length ? AL.jeLinesTable(journal) : AL.empty('No journal lines were returned.')}`;
  const c = (x.currency && x.currency.code) || '';
  const status = AL.expStatus[x.status] || [x.status || 'Unknown', 'info'];
  const canDecide = AL.can('manage_ledger') && x.createdById !== AL.me().id && x.journalEntryId && (x.status === 'SUBMITTED' || x.status === 'POSTED');
  const decisionActions = canDecide
    ? `<div class="al-actions" style="margin-top:14px">${AL.btn('Approve and post', 'exp-approve', 'small primary', `data-id="${ae(x.id)}"`)}${AL.btn('Return for correction', 'exp-return', 'small danger', `data-id="${ae(x.id)}"`)}</div>`
    : '';
  AL.form({
    title: x.description || 'Expense details',
    sub: `${AL.money(x.totalAmount, c)} · Expense record`,
    wide: true,
    viewOnly: true,
    submitLabel: 'Close',
    fields: [],
    extra: `<div class="al-wide al-expense-detail"><div class="al-expense-amounts" aria-label="Expense amount summary">
      <div><span>Amount before VAT</span><strong>${AL.money(x.amount, c)}</strong></div>
      <div><span>VAT</span><strong>${AL.money(x.vatAmount || 0, c)}</strong></div>
      <div class="total"><span>Total amount</span><strong>${AL.money(x.totalAmount, c)}</strong></div>
    </div><div class="v28-grid equal">
      <div>${AL.panel('Expense record', '', AL.statusRows([
        ['Status', AL.status(status[0], status[1]), 'Current'],
        ['Supplier', AL.expVendorLabel(x.vendor), 'Recorded'],
        ['Category', (x.category && x.category.name) || '—', 'Recorded'],
        ['Transaction date', AL.date(x.transactionDate), 'Recorded'],
        ['Payment method', AL.expPay[x.paymentMethod] || x.paymentMethod || '—', 'Recorded'],
        ['Receipt / invoice', x.receiptNumber || '—', x.receiptNumber ? 'Recorded' : 'Not supplied'],
      ]))}${decisionActions}</div>
      <div>${AL.panel('Approval and ledger linkage', '', AL.statusRows([
        ['Recorded by', AL.jeWho(x.createdBy), 'Audit actor'],
        ['Ledger posting', journalStatus || (x.journalEntryId ? 'Journal linked' : 'No journal linked'), x.journalEntryId ? 'Linked' : 'Pending'],
        ['Approval route', x.createdById === AL.me().id ? 'Independent approver required' : 'Available to authorised reviewer', 'Control'],
        ['Supporting evidence', docs.length ? `${docs.length} supporting document${docs.length === 1 ? '' : 's'} linked` : (x.receiptNumber ? 'Receipt reference recorded' : 'No attachment reference'), docs.length || x.receiptNumber ? 'Recorded' : 'Review'],
      ]))}</div>
    </div>${AL.panel('Journal entry', 'Accounts and amounts linked to this expense.', journalPanel)}${AL.panel('Supporting documents', 'Persisted files linked to this expense.', AL.expDocPanel(docs, x.id))}</div>`,
    onSubmit: async () => false,
  });
};
AL.actions['exp-upload'] = (el) => AL.form({ title: 'Attach supporting document', sub: 'This file is stored with the selected expense record.', submitLabel: 'Upload', doneTitle: 'Supporting document uploaded', fields: [],
  extra: '<label class="v28-field al-wide"><span>File *</span><input class="v28-input" type="file" id="alExpAttachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.ppt,.pptx,.zip,.msg,.eml,.xml,.json"></label>',
  validate: () => { const f = document.getElementById('alExpAttachment'); return !f || !f.files || !f.files[0] ? 'Choose a file.' : f.files[0].size > 50 * 1024 * 1024 ? 'The file is over 50 MB.' : ''; },
  onSubmit: async () => { const f = document.getElementById('alExpAttachment').files[0]; const fd = new FormData(); fd.append('file', f); AL.unwrap(await AL.http().form(`/accounting/documents/expenses/${encodeURIComponent(el.dataset.id)}`, fd)); return `${f.name} is linked to the expense.`; },
  after: () => { AL.actions['exp-detail']({ dataset: { id: el.dataset.id } }); },
});
AL.actions['exp-approve'] = (el) => {
  const x = AL.expFind(el.dataset.id); if (!x) return;
  AL.confirm({ title: 'Approve this expense', confirmLabel: 'Approve and post', doneTitle: 'Expense approved', body: `${x.description}: ${AL.money(x.totalAmount, x.currency && x.currency.code)} is posted to the ledger${x.paymentMethod === 'BANK' ? ' and the payment to the cashbook' : ''}.`,
    onConfirm: async () => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(x.journalEntryId)}/post`, {}); return ''; }, after: () => AL.expReload() });
};
AL.actions['exp-return'] = (el) => {
  const x = AL.expFind(el.dataset.id); if (!x) return;
  AL.confirm({ title: 'Return this expense', danger: true, confirmLabel: 'Return', doneTitle: 'Expense returned', reason: 'What needs correcting',
    body: 'It is not posted; the person who recorded it records a corrected one.',
    onConfirm: async (v) => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(x.journalEntryId)}/void`, { reason: v.reason }); return ''; }, after: () => AL.expReload() });
};
AL.expImportColumns = ['Supplier ID or Name', 'Category', 'Date', 'Description', 'Amount', 'Currency Code', 'Payment Method', 'Bank Account ID or Name', 'Receipt Number', 'Taxable'];
AL.expTemplateSpec = () => ({ title: 'Expense Import Template', subtitle: 'Imported expenses are submitted with pending journals for independent approval.', columns: AL.expImportColumns, rows: [], filename: 'expense-import-template' });
AL.actions['exp-template-csv'] = () => AL.saveText(`${AL.expImportColumns.join(',')}\n`, 'expense-import-template.csv');
AL.actions['exp-template-excel'] = async () => { try { await AL.exportFile('excel', AL.expTemplateSpec()); } catch (e) { AL.toast('Template unavailable', AL.msg(e), 'bad'); } };
AL.expImportProgress = (message, tone = 'loading') => { const el = document.getElementById('expImportProgress'); if (el) { el.hidden = false; el.textContent = message; el.dataset.tone = tone; } };
AL.actions['exp-import'] = () => {
  const selected = { file: null, preview: null, request: 0 };
  AL.form({ title: 'Import expenses', sub: 'CSV and Excel files are checked automatically when selected. Imported expenses wait for an independent approver.', wide: true, submitLabel: 'Import expenses', doneTitle: 'Expense import complete', fields: [],
    extra: `<div class="al-wide"><div class="al-actions">${AL.btn('Download CSV template', 'exp-template-csv', 'small')}${AL.btn('Download Excel template', 'exp-template-excel', 'small')}</div><label class="v28-field"><span>Expense file *</span><input class="v28-input" type="file" id="expImportFile" accept=".csv,.xls,.xlsx" required></label><p class="v28-sub">Up to 500 rows and 10 MB. Include supplier, category, date, description, amount, currency and payment method. BANK expenses also need a matching bank account. Receipt numbers are checked for duplicates.</p><div id="expImportProgress" class="v28-sub" role="status" aria-live="polite" hidden></div><div id="expImportPreview" aria-live="polite"></div></div>`,
    validate: () => !selected.file ? 'Choose an expense CSV or Excel file.' : !selected.preview?.valid ? 'Wait for validation to finish and correct every row error before importing.' : '',
    onSubmit: async () => {
      if (!selected.preview?.valid) throw new Error('Choose and validate a valid Expense file first.');
      const fd = new FormData(); fd.append('file', selected.file); AL.expImportProgress(`Submitting ${selected.preview.totalRows} expense rows…`);
      const result = AL.unwrap(await AL.http().form('/accounting/expenses/bulk-import', fd));
      AL.expImportProgress(`${result.imported} submitted for approval${result.failed ? `; ${result.failed} failed` : ''}.`, result.failed ? 'error' : 'ready');
      return `${result.imported} expense(s) submitted for approval${result.failed ? `; ${result.failed} failed` : ''}.`;
    }, after: () => { AL.ui.exp.tab = 'SUBMITTED'; AL.ui.exp.page = 1; AL.expReload(); },
  });
  setTimeout(() => {
    const input = document.getElementById('expImportFile'); if (!input) return;
    input.addEventListener('change', async () => {
      const file = input.files?.[0]; selected.file = file || null; selected.preview = null; const request = ++selected.request;
      const output = document.getElementById('expImportPreview'); if (output) output.innerHTML = '';
      if (!file) return;
      AL.expImportProgress(`Checking ${file.name}…`);
      try {
        const fd = new FormData(); fd.append('file', file);
        const preview = AL.unwrap(await AL.http().form('/accounting/expenses/bulk-import/preview', fd));
        if (request !== selected.request) return;
        selected.preview = preview;
        if (preview.valid) {
          AL.expImportProgress(`${preview.totalRows} expense rows are valid and ready to import.`, 'ready');
          if (output) output.innerHTML = AL.table(['Supplier', 'Category', 'Date', 'Description', 'Amount', 'Currency', 'Paid'], preview.rows.map(r => `<tr><td>${ae(r.vendor)}</td><td>${ae(r.category)}</td><td>${ae(r.transactionDate)}</td><td>${ae(r.description)}</td><td>${ae(String(r.amount))}</td><td>${ae(r.currencyCode)}</td><td>${ae(r.paymentMethod)}</td></tr>`).join(''), '900px');
        } else {
          AL.expImportProgress(`${preview.errors?.length || 0} issue(s) found. Correct the file and choose it again.`, 'error');
          if (output) output.innerHTML = AL.table(['Row', 'Problem'], (preview.errors || []).map(e => `<tr><td>${ae(String(e.row))}</td><td>${ae(e.message)}</td></tr>`).join(''), '700px');
        }
      } catch (error) { if (request === selected.request) { selected.preview = null; AL.expImportProgress(AL.msg(error), 'error'); } }
    });
  }, 0);
};
AL.actions['exp-new'] = (el) => AL.busy(el, async () => {
  const [vend, cur, banks] = await Promise.all([AL.get('/cashbook/vendors').catch(() => []), AL.get('/accounting/currencies'), AL.get('/cashbook/banks').catch(() => [])]);
  const cats = (AL.cache.exp.data.categories || []).filter((c) => c.isActive !== false);
  const catOpts = cats.length ? cats.map((c) => c.name) : ['Salaries and Wages', 'Travel and Accommodation', 'Operations', 'Branding and Marketing', 'Office Equipment'];
  const base = (cur || []).find((c) => c.isDefault) || (cur || [])[0] || {};
  AL.form({
    title: 'Record an expense', sub: 'It waits for an approver, who posts it.', wide: true, submitLabel: 'Submit for approval', doneTitle: 'Expense submitted',
    fields: [
      { k: 'description', label: 'What for', required: true, wide: true },
      { k: 'vendorId', label: 'Supplier', type: 'select', required: true, blankLabel: 'Choose supplier', options: (Array.isArray(vend) ? vend : []).map((v) => ({ value: v.id, label: AL.expVendorLabel(v) })) },
      { k: 'category', label: 'Category', type: 'select', required: true, blankLabel: 'Choose category', options: catOpts },
      { k: 'transactionDate', label: 'Date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'currencyId', label: 'Currency', type: 'select', blank: false, required: true, options: (cur || []).filter((c) => c.isActive !== false).map((c) => ({ value: c.id, label: c.code })) },
      { k: 'amount', label: 'Amount before VAT', type: 'number', min: 0.01, step: '0.01', required: true },
      { k: 'isTaxable', label: 'Includes recoverable VAT', type: 'checkbox' },
      { k: 'receiptNumber', label: 'Receipt / invoice number' },
      { k: 'paymentMethod', label: 'Paid', type: 'select', blank: false, required: true, options: Object.entries(AL.expPay).map(([value, label]) => ({ value, label })) },
      { k: 'bankId', label: 'Bank account', type: 'select', blankLabel: 'Choose bank account', options: (Array.isArray(banks) ? banks : []).filter((b) => b.isActive !== false).map((b) => ({ value: b.id, label: b.name })) },
    ],
    initial: { transactionDate: AL.stiToday(), currencyId: base.id, paymentMethod: 'BANK' },
    validate: (v) => (!(Number(v.amount) > 0) ? 'The amount must be more than zero.' : v.paymentMethod === 'BANK' && !v.bankId ? 'Choose the bank account it was paid from.' : ''),
    onSubmit: async (v) => { await AL.post('/accounting/expenses', { ...v, amount: Number(v.amount), ...(v.paymentMethod === 'BANK' ? {} : { bankId: undefined }) }); return 'An approver posts it.'; },
    after: () => { AL.ui.exp.tab = 'SUBMITTED'; AL.expReload(); },
  });
  document.getElementById('alForm')?.classList.add('al-expense-form');
  document.querySelector('#alOverlay .v28-modal')?.classList.add('al-expense-modal');
  const payment = document.querySelector('#alForm select[name="paymentMethod"]');
  const bankField = document.querySelector('#alForm select[name="bankId"]')?.closest('.v28-field');
  const syncBankField = () => { if (bankField) bankField.hidden = payment?.value !== 'BANK'; };
  payment?.addEventListener('change', syncBankField);
  syncBankField();
});
