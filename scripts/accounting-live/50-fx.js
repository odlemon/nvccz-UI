/* FX: /accounting/fx-revaluation — the rate table the ledger converts with (the daily official rate, and rates entered
 * or corrected by finance, with who and why), what is held in each foreign currency translated at the latest rate, and
 * the month-end revaluation: each foreign-currency balance at the closing rate against what it is carried at, prepared
 * as a draft journal for an approver (only the movement since the last revaluation is booked).
 * Data: /accounting/multi-currency/rates, /exposure, /revaluation, /accounting/jobs (the daily rate job). */
AL.fxLoad = () => AL.res('fx', async () => {
  const fetchAllRates = async () => {
    const limit = 500, first = await AL.get(`/accounting/multi-currency/rates?limit=${limit}&page=1`);
    const rows = [...((first && first.rates) || [])], pages = Math.max(1, Number(first && first.totalPages) || 1);
    for (let page = 2; page <= pages; page++) {
      const next = await AL.get(`/accounting/multi-currency/rates?limit=${limit}&page=${page}`);
      rows.push(...((next && next.rates) || []));
    }
    return { ...first, rates: rows };
  };
  const [rates, exposure, jobs] = await Promise.all([
    fetchAllRates(),
    AL.get('/accounting/multi-currency/exposure'),
    AL.get('/accounting/jobs').catch(() => null),
  ]);
  return { rates, exposure, rateJob: jobs && (jobs.jobs || []).find((j) => j.key === 'rates.daily') };
});
AL.fxSource = { ZIMRATE_ASK: 'Provider ask rate', MANUAL_ASK: 'Ask rate entered by finance', URL: 'Legacy quote (basis unverified)', MANUAL: 'Legacy manual rate (basis unverified)', TABLE: 'Rate table (basis unverified)' };
AL.fxRate = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 6 }));
AL.ui.fx = AL.ui.fx || { q: '', dateFrom: '', dateTo: '', page: 1, pageSize: 10 };
AL.fxFiltered = () => {
  const u = AL.ui.fx, d = AL.cache.fx && AL.cache.fx.data, rows = (d && d.rates && d.rates.rates) || [], q = String(u.q || '').trim().toLowerCase();
  return rows.filter((r) => {
    const day = String(r.date || '').slice(0, 10), text = `${r.pair} ${r.from} ${r.to} ${AL.fxSource[r.source] || r.source || ''} ${r.createdBy || ''}`.toLowerCase();
    return (!q || text.includes(q)) && (!u.dateFrom || day >= u.dateFrom) && (!u.dateTo || day <= u.dateTo);
  });
};
AL.fxExportSpec = () => {
  const rows = AL.fxFiltered(), u = AL.ui.fx;
  return { title: 'Foreign Exchange Rate Register', subtitle: 'Historical rates used by Accounting for currency conversion and reporting.', filename: 'accounting-fx-rates', landscape: true,
    meta: [['Rates', String(rows.length)], ['Date range', `${u.dateFrom || 'All dates'} to ${u.dateTo || 'Today'}`], ['Search', u.q || 'All pairs']],
    columns: ['Effective date', 'Currency pair', 'Rate', 'Rate source', 'Recorded by', 'Recorded at'],
    rows: rows.map((r) => [AL.date(r.date), r.pair, Number(r.rate), AL.fxSource[r.source] || r.source || '', r.createdBy || '', AL.dateTime(r.createdAt)]),
    note: 'Rates are stored by effective date. Corrections require a reason and remain recorded in the audit trail.' };
};

AL.page('fx', () => {
  AL.meLoad();
  const canEnter = AL.can('manage_accounting'), canRun = AL.can('manage_ledger');
  const e = AL.fxLoad();
  const acts = [AL.exportBtns('fx-export'), canEnter ? AL.btn('Import rates', 'fx-import-open') : '', canEnter ? AL.btn('Enter a rate', 'fx-add', 'primary') : '', canRun ? AL.btn("Fetch today's official rate", 'fx-fetch') : ''].join('');
  const head = AL.head('Treasury and reporting', 'FX Rates and Revaluation', 'The rates postings are converted with, what is held in each foreign currency, and its month-end revaluation.', acts);
  const g = AL.gate(e, { key: 'fx', errorTitle: 'Exchange rates could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const { rates, exposure, rateJob } = e.data;
  const base = rates.baseCurrency || exposure.baseCurrency || '';
  const today = AL.stiToday();
  const latest = rates.latest || [];
  const stale = latest.filter((r) => String(r.date).slice(0, 10) < today);
  const missing = (exposure.currencies || []).filter((c) => c.missingRate);
  const kpis = AL.kpis([
    ...latest.slice(0, 3).map((r) => [r.pair, AL.fxRate(r.rate), `${AL.date(r.date)} · ${AL.fxSource[r.source] || r.source}${r.previous ? ` · ${r.rate >= r.previous.rate ? '+' : ''}${(((r.rate - r.previous.rate) / r.previous.rate) * 100).toFixed(2)}% on ${AL.date(r.previous.date)}` : ''}`, String(r.date).slice(0, 10) < today ? '#f79009' : '#0878f6']),
    ['Missing rates', String(missing.length), missing.length ? `No rate for ${missing.map((c) => c.currency).join(', ')}` : 'Every currency held has a rate', missing.length ? '#d92d20' : '#12b76a'],
    ['Daily official rate', rateJob && rateJob.lastRun ? (rateJob.lastRun.status === 'succeeded' ? 'Fetched' : 'Failed') : 'Not run', rateJob && rateJob.lastRun ? AL.dateTime(rateJob.lastRun.startedAt) : 'Scheduled 09:00', rateJob && rateJob.lastRun && rateJob.lastRun.status !== 'succeeded' ? '#d92d20' : '#12b76a'],
  ]);
  const staleNote = stale.length ? `<div class="al-state al-note" role="status"><strong>Not rated today</strong><p>${stale.map((r) => `${ae(r.pair)} was last rated on ${ae(AL.date(r.date))}`).join(' · ')}; postings today use that rate until today's is recorded.</p></div>` : '';

  // exposure by currency
  const expo = (exposure.currencies || []).map((c) => {
    const rows = c.items.map((i) => `<tr><td>${ae(i.kind)}<span class="v28-sub">${AL.plural(i.count, 'item')}</span></td><td>${ae(AL.money(i.amount, c.currency))}</td><td>${i.inBase == null ? '—' : ae(AL.money(i.inBase, base))}</td></tr>`).join('');
    return AL.panel(`${c.currency} exposure`, c.ratePerBase ? `At ${AL.fxRate(c.ratePerBase)} ${c.currency} per ${base}` : `No ${base}/${c.currency} rate yet: enter one to translate`, AL.table([`Held in ${c.currency}`, c.currency, base], `${rows}<tr class="al-total"><td><strong>Net</strong></td><td><strong>${ae(AL.money(c.net, c.currency))}</strong></td><td><strong>${c.netInBase == null ? '—' : ae(AL.money(c.netInBase, base))}</strong></td></tr>`, '560px'));
  }).join('');

  // the rate table
  const filtered = AL.fxFiltered(), u = AL.ui.fx, pageSize = Math.max(1, Number(u.pageSize) || 10), pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  u.page = Math.min(Math.max(1, Number(u.page) || 1), pages);
  const visibleRates = filtered.slice((u.page - 1) * pageSize, u.page * pageSize);
  const tr = visibleRates.map((r) => `<tr><td>${ae(AL.date(r.date))}</td><td><strong>${ae(r.pair)}</strong></td><td>${ae(AL.fxRate(r.rate))}</td><td>${ae(AL.fxSource[r.source] || r.source)}</td><td>${ae(r.createdBy || '—')}<span class="v28-sub">${ae(AL.dateTime(r.createdAt))}</span></td><td class="al-actions"><a href="#" class="al-fx-row-action" data-al="fx-detail" data-id="${ae(r.id)}" aria-label="Open ${ae(r.pair)} rate details">Open</a>${canEnter ? `<a href="#" class="al-fx-row-action" data-al="fx-correct" data-id="${ae(r.id)}" aria-label="Correct ${ae(r.pair)} rate">Correct</a>` : ''}</td></tr>`).join('');
  const from = filtered.length ? (u.page - 1) * pageSize + 1 : 0, to = Math.min(u.page * pageSize, filtered.length);
  const pager = `<div class="al-pager" role="navigation" aria-label="Exchange rate pages"><span>Showing ${from} to ${to} of ${filtered.length} rates</span><div>${AL.btn('Previous', 'fx-page', 'small', `data-page="${u.page - 1}"${u.page <= 1 ? ' disabled' : ''}`)}<span class="v28-sub">Page ${u.page} of ${pages}</span>${AL.btn('Next', 'fx-page', 'small', `data-page="${u.page + 1}"${u.page >= pages ? ' disabled' : ''}`)}</div></div>`;
  const filters = `<div class="al-filters"><label class="v28-field al-grow"><span>Search rates</span><input class="v28-input" type="search" data-fx-filter="q" value="${ae(u.q || '')}" placeholder="Currency pair, source or recorder"></label><label class="v28-field"><span>From date</span><input class="v28-input" type="date" data-fx-filter="dateFrom" value="${ae(u.dateFrom || '')}"></label><label class="v28-field"><span>To date</span><input class="v28-input" type="date" data-fx-filter="dateTo" value="${ae(u.dateTo || '')}" max="${ae(today)}"></label></div>`;
  const table = AL.panel('Rate table', `${AL.plural(filtered.length, 'rate')} in this view`, `${filters}${tr ? `${AL.table(['Date', 'Pair', 'Rate', 'Source', 'Recorded by', ''], tr, '900px')}${pager}` : AL.empty(u.q || u.dateFrom || u.dateTo ? 'No rates match these filters.' : 'No rates recorded yet.')}`);
  return `<div class="v28-page al-fx-page">${head}${kpis}${staleNote}<div class="al-grid-auto">${expo}</div>${AL.fxRevalPanel(canEnter)}${table}</div>`;
});
/** Month-end revaluation: the last month end by default. */
AL.ui.fxr = AL.ui.fxr || { asOf: '' };
AL.fxMonthEnd = () => { const [y, m] = AL.stiToday().split('-').map(Number); return new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10); };
AL.fxRevalPanel = (canPrepare) => {
  const asOf = AL.ui.fxr.asOf || AL.fxMonthEnd();
  const key = `fxr:${asOf}`;
  const e = AL.res(key, () => AL.get(`/accounting/multi-currency/revaluation?asOf=${asOf}`));
  const bookable = e.state === 'ok' && ((e.data && e.data.rows) || []).some((r) => r.difference != null && Math.abs(r.difference) >= 0.01);
  const pick = `<div class="al-filters"><label class="v28-field"><span>Revalue at</span><input class="v28-input" type="date" data-fxr-f="asOf" value="${ae(asOf)}" max="${ae(AL.stiToday())}"></label><span class="al-grow"></span>${canPrepare && bookable ? AL.btn('Prepare revaluation journal', 'fxr-prepare', 'primary', `data-asof="${ae(asOf)}"`) : ''}</div>`;
  const g = AL.gate(e, { key, errorTitle: 'The revaluation could not be worked out' });
  if (g) return AL.panel('Month-end revaluation', '', `${pick}${g}`);
  const d = e.data || {}, base = d.baseCurrency || '';
  const rows = (d.rows || []).map((r) => `<tr><td>${ae(r.account)}</td><td>${ae(r.currency)}</td><td class="num">${ae(AL.money(r.native, r.currency))}</td><td class="num">${r.closingRate == null ? '<span class="al-bad">No rate</span>' : ae(AL.fxRate(1 / r.closingRate))}</td><td class="num">${r.revalued == null ? '—' : ae(AL.money(r.revalued, base))}</td><td class="num">${ae(AL.money(r.carrying, base))}</td><td class="num">${r.difference == null ? '—' : `<strong class="${r.difference < 0 ? 'al-bad' : r.difference > 0 ? 'al-ok' : ''}">${ae(AL.money(r.difference, base))}</strong>`}</td></tr>`).join('');
  return AL.panel('Month-end revaluation', `Foreign-currency balances at ${AL.date(asOf)}, closing rate per ${base}`, `${pick}${rows ? AL.table(['Account', 'Currency', 'Balance', 'Closing rate', `At closing rate (${base})`, `Carried at (${base})`, 'Gain / loss'], rows + `<tr class="al-total"><td colspan="6"><strong>Net unrealised ${d.total >= 0 ? 'gain' : 'loss'}</strong></td><td class="num"><strong>${ae(AL.money(d.total, base))}</strong></td></tr>`, '980px') : AL.empty('No foreign-currency balances to revalue at this date.')}`);
};
AL.wire.fx = () => {
  document.querySelectorAll('[data-fxr-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.fxr.asOf = el.value; AL.redraw(); }); });
  document.querySelectorAll('[data-fx-filter]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    el.addEventListener(el.type === 'search' ? 'input' : 'change', () => {
      const key = el.dataset.fxFilter, position = el.type === 'search' ? el.selectionStart : null;
      AL.ui.fx[key] = el.value; AL.ui.fx.page = 1; AL.redraw();
      if (key === 'q') { const next = document.querySelector('[data-fx-filter="q"]'); if (next) { next.focus(); if (position !== null) next.setSelectionRange(position, position); } }
    });
  });
  const file = document.querySelector('#fxImportFile');
  if (file && !file.dataset.wired) { file.dataset.wired = '1'; file.addEventListener('change', () => AL.fxValidateImport(file.files && file.files[0])); }
};
AL.actions['fx-page'] = (el) => { AL.ui.fx.page = Math.max(1, Number(el.dataset.page) || 1); AL.redraw(); };
AL.actions['fx-export'] = (el) => { const spec = AL.fxExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There are no rates in this view.', 'bad'); return AL.exportRun(el, spec, 'exchange rates'); };
AL.actions['fxr-prepare'] = (el) => AL.busy(el, async () => { const r = await AL.post('/accounting/multi-currency/revaluation', { asOf: el.dataset.asof }); Object.keys(AL.cache).filter((k) => k.startsWith('fxr:')).forEach((k) => delete AL.cache[k]); AL.redraw(); return r; },
  ['Revaluation prepared', (r) => (r && r.journal ? `${r.journal.referenceNumber}: ${r.lines} balance${r.lines === 1 ? '' : 's'}, net ${AL.money(r.net)}. An approver posts it from the Approval Queue.` : '')]);

AL.fxForm = (init = {}) => {
  const d = (AL.cache.fx && AL.cache.fx.data) || {};
  const codes = [...new Set(((d.rates && d.rates.latest) || []).flatMap((r) => [r.from, r.to]).concat([d.rates && d.rates.baseCurrency, ...((d.exposure && d.exposure.currencies) || []).map((c) => c.currency)]).filter(Boolean))];
  AL.form({
    title: init.id ? `Correct ${init.pair} for ${AL.date(init.date)}` : 'Enter a rate', submitLabel: init.id ? 'Save correction' : 'Save rate', doneTitle: init.id ? 'Rate corrected' : 'Rate saved',
    fields: [
      { k: 'from', label: 'From (1 unit of)', type: 'select', required: true, blank: false, options: codes },
      { k: 'to', label: 'To', type: 'select', required: true, blank: false, options: codes },
      { k: 'date', label: 'Date', type: 'date', required: true, max: AL.stiToday() },
      { k: 'rate', label: 'Ask rate', type: 'number', step: 'any', min: 0, required: true },
      { k: 'reason', label: init.id ? 'Why it is corrected' : 'Source or note', type: 'textarea', wide: true, required: !!init.id },
    ],
    initial: { from: init.from || (d.rates && d.rates.baseCurrency) || 'USD', to: init.to || codes.find((c) => c !== ((d.rates && d.rates.baseCurrency) || 'USD')), date: init.date ? String(init.date).slice(0, 10) : AL.stiToday(), rate: init.rate || '' },
    validate: (v) => (v.from === v.to ? 'Choose two different currencies.' : Number(v.rate) > 0 ? '' : 'The rate must be more than zero.'),
    onSubmit: async (v) => { const r = await AL.post('/accounting/multi-currency/rates', { ...v, rate: Number(v.rate) }); return r && r.corrected ? `${v.from}/${v.to} for ${AL.date(v.date)} corrected; the old value is kept in the audit trail.` : `${v.from}/${v.to} ${v.rate} recorded for ${AL.date(v.date)}.`; },
    after: () => { delete AL.cache.fx; AL.redraw(); AL.fxTopbar(); },
  });
};
AL.actions['fx-add'] = () => AL.fxForm();
AL.fxImportHeaders = ['From Currency', 'To Currency', 'Date (YYYY-MM-DD)', 'Ask Rate', 'Reason'];
AL.fxImportState = { rows: [], errors: [], file: '', validating: false };
AL.fxCsvParse = (text) => {
  const out = []; let row = [], cell = '', quoted = false;
  text = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; }
    else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); if (row.some((x) => x.trim())) out.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  row.push(cell.replace(/\r$/, '')); if (row.some((x) => x.trim())) out.push(row);
  if (!out.length) return [];
  const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  const headers = out.shift().map(norm), find = (...names) => headers.findIndex((h) => names.includes(h));
  const idx = { from: find('fromcurrency', 'from'), to: find('tocurrency', 'to'), date: find('dateyyyymmdd', 'date', 'effectivedate'), rate: find('askrate', 'rate', 'exchangerate'), reason: find('reason', 'sourceornote', 'note') };
  if ([idx.from, idx.to, idx.date, idx.rate].some((i) => i < 0)) return { error: 'Use the downloadable template with From Currency, To Currency, Date, and Rate columns.' };
  return out.map((cells) => ({ from: String(cells[idx.from] || '').trim().toUpperCase(), to: String(cells[idx.to] || '').trim().toUpperCase(), date: String(cells[idx.date] || '').trim().slice(0, 10), rate: String(cells[idx.rate] || '').trim(), reason: idx.reason < 0 ? '' : String(cells[idx.reason] || '').trim() }));
};
AL.fxImportTemplate = () => {
  const rows = [AL.fxImportHeaders, ['USD', 'ZIG', AL.stiToday(), '26.6053', '']];
  AL.saveText(`\uFEFF${rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`, 'fx-rate-import-template.csv');
};
AL.fxDrawImportStatus = () => {
  const s = AL.fxImportState, status = document.getElementById('fxImportStatus'); if (!status) return;
  status.innerHTML = s.validating ? '<p class="v28-sub" role="status">Checking file columns, currencies, dates, duplicates and corrections...</p>'
    : !s.file ? '<p class="v28-sub">Choose a CSV file. The rows are checked automatically before import.</p>'
    : s.errors.length ? `<div class="al-state al-error"><strong>Correct these rows before importing</strong><ul>${s.errors.slice(0, 20).map((x) => `<li>${ae(x)}</li>`).join('')}</ul></div>`
    : `<p class="al-state al-success" role="status">${s.rows.length} rates checked. Ready to import${s.corrections ? `; ${s.corrections} existing rate(s) will be corrected with an audit reason` : ''}.</p>`;
  const button = document.querySelector('#alOverlay [data-al="form-submit"]');
  if (button) button.disabled = s.validating || !s.file || !!s.errors.length || !s.rows.length;
};
AL.fxValidateImport = async (file) => {
  const s = AL.fxImportState = { rows: [], errors: [], file: file && file.name || '', validating: Boolean(file), corrections: 0 };
  AL.fxDrawImportStatus(); if (!file) return;
  try {
    if (!/\.csv$/i.test(file.name) || file.size > 5 * 1024 * 1024) throw new Error('Choose a CSV file no larger than 5 MB.');
    const parsed = AL.fxCsvParse(await file.text()); if (parsed.error) throw new Error(parsed.error);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('The CSV has no exchange-rate rows.');
    if (parsed.length > 500) throw new Error('Import up to 500 exchange-rate rows at a time.');
    const d = AL.cache.fx && AL.cache.fx.data || {}, codes = new Set([...((d.rates && d.rates.latest) || []).flatMap((r) => [r.from, r.to]), d.rates && d.rates.baseCurrency, ...((d.exposure && d.exposure.currencies) || []).map((c) => c.currency)].filter(Boolean).map((x) => String(x).toUpperCase()));
    const seen = new Set(), today = AL.stiToday();
    parsed.forEach((r, i) => {
      const line = i + 2, key = `${r.from}|${r.to}|${r.date}`;
      if (!r.from || !r.to || !codes.has(r.from) || !codes.has(r.to)) s.errors.push(`Row ${line}: choose currencies that are active in the system.`);
      if (r.from && r.to && r.from === r.to) s.errors.push(`Row ${line}: the two currencies must be different.`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(Date.parse(`${r.date}T00:00:00Z`)) || new Date(`${r.date}T00:00:00Z`).toISOString().slice(0, 10) !== r.date) s.errors.push(`Row ${line}: enter a valid date as YYYY-MM-DD.`);
      else if (r.date > today) s.errors.push(`Row ${line}: a rate cannot be dated in the future.`);
      if (!(Number(r.rate) > 0) || !Number.isFinite(Number(r.rate))) s.errors.push(`Row ${line}: the rate must be a positive number.`);
      if (seen.has(key)) s.errors.push(`Row ${line}: ${r.from}/${r.to} on ${r.date} is repeated in this file.`);
      seen.add(key);
    });
    if (s.errors.length) return;
    const days = parsed.map((r) => r.date).sort(), query = (page) => `/accounting/multi-currency/rates?limit=500&page=${page}&dateFrom=${days[0]}&dateTo=${days[days.length - 1]}`;
    const first = await AL.get(query(1)), existing = [...((first && first.rates) || [])], pageCount = Math.max(1, Number(first && first.totalPages) || 1);
    for (let page = 2; page <= pageCount; page++) existing.push(...(((await AL.get(query(page))) || {}).rates || []));
    const stored = new Set(existing.map((r) => `${String(r.from).toUpperCase()}|${String(r.to).toUpperCase()}|${String(r.date).slice(0, 10)}`));
    parsed.forEach((r, i) => { if (stored.has(`${r.from}|${r.to}|${r.date}`)) { if (!r.reason) s.errors.push(`Row ${i + 2}: ${r.from}/${r.to} already has a rate on ${r.date}; enter a correction reason.`); else s.corrections++; } });
    if (!s.errors.length) s.rows = parsed;
  } catch (e) { s.errors.push(AL.msg(e)); }
  finally { s.validating = false; AL.fxDrawImportStatus(); }
};
AL.actions['fx-import-template'] = () => AL.fxImportTemplate();
AL.actions['fx-import-open'] = () => {
  AL.fxImportState = { rows: [], errors: [], file: '', validating: false, corrections: 0 };
  AL.form({ title: 'Import exchange rates', sub: 'Select a CSV file. It is checked automatically and duplicate dates require a correction reason.', wide: true, submitLabel: 'Import rates', fields: [],
    extra: `<div class="al-wide">${AL.btn('Download CSV template', 'fx-import-template', 'small')}<label class="v28-field" style="margin-top:12px"><span>FX ask-rate CSV file</span><input id="fxImportFile" class="v28-input" type="file" accept=".csv,text/csv" required></label><div id="fxImportStatus" role="status" aria-live="polite"></div><p class="v28-sub">Maximum 500 rows and 5 MB. Corrected rates require a reason and keep the previous value in the audit trail.</p></div>`,
    onSubmit: async () => {
      const s = AL.fxImportState; if (!s.rows.length || s.errors.length || s.validating) throw new Error('Choose a valid CSV file first.');
      let imported = 0, corrected = 0; const errors = [];
      for (let i = 0; i < s.rows.length; i++) {
        const r = s.rows[i], status = document.getElementById('fxImportStatus');
        if (status) status.innerHTML = `<div role="status" aria-live="polite"><strong>Importing rate ${i + 1} of ${s.rows.length}</strong><progress max="${s.rows.length}" value="${i}"></progress></div>`;
        try { const result = await AL.post('/accounting/multi-currency/rates', { ...r, rate: Number(r.rate) }); imported++; if (result && result.corrected) corrected++; }
        catch (e) { errors.push(`Row ${i + 2}: ${AL.msg(e)}`); }
      }
      if (errors.length) throw new Error(`${imported} imported (${corrected} corrected); ${errors.slice(0, 4).join(' | ')}`);
      delete AL.cache.fx; AL.redraw(); AL.fxTopbar();
      return `${imported} rates imported; ${corrected} corrected with audit reasons.`;
    },
  });
  AL.wire.fx();
};
AL.actions['fx-detail'] = (el) => {
  const r = ((AL.cache.fx.data.rates || {}).rates || []).find((x) => x.id === el.dataset.id); if (!r) return;
  const detail = [['Date', AL.date(r.date)], ['Currency pair', r.pair], ['Rate', AL.fxRate(r.rate)], ['Source', AL.fxSource[r.source] || r.source], ['Recorded by', r.createdBy || '—'], ['Recorded', AL.dateTime(r.createdAt)]].map(([k, v]) => `<div><span class="v28-sub">${ae(k)}</span><strong>${ae(String(v == null ? '—' : v))}</strong></div>`).join('');
  AL.form({ title: r.pair, sub: 'Exchange-rate detail', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-wide"><div class="v28-grid equal">${detail}</div></div>`, onSubmit: async () => false });
};
AL.actions['fx-correct'] = (el) => { const r = ((AL.cache.fx.data.rates || {}).rates || []).find((x) => x.id === el.dataset.id); if (r) AL.fxForm(r); };
AL.actions['fx-fetch'] = (el) => AL.busy(el, async () => {
  const r = await AL.post('/accounting/jobs/rates.daily/run', {});
  if (r && r.status === 'failed') throw new Error(r.error || 'The official rate could not be fetched.');
  delete AL.cache.fx; AL.redraw(); AL.fxTopbar();
  return r;
}, ['Official rate', (r) => (r && r.summary && r.summary.outcome === 'already_recorded' ? "Today's rate was already recorded." : r && r.summary && r.summary.rate ? `Recorded ${r.summary.rate}.` : 'Done.')]);

/* The topbar rate pill used to scrape the Reserve Bank's website from the browser through a public CORS proxy (it failed
 * on every load). That code lives in an inner scope of the runtime, so it is switched off from here: its six-hourly
 * trigger is marked as done, its "Refresh official rate" button is taken over, and the pill and the rate the browser keeps
 * are filled from the stored rate the ledger uses. */
AL.fxTopbar = async () => {
  try {
    const d = await AL.get('/accounting/multi-currency/rates?limit=1');
    const r = (d.latest || []).find((x) => x.from === 'USD' && /^(ZIG|ZWG|ZWL)$/.test(x.to)) || (d.latest || [])[0];
    if (!r) return null;
    const snap = { pair: `${r.from}/${r.to}`, ask: ['ZIMRATE_ASK', 'MANUAL_ASK'].includes(r.source) ? r.rate : null, rateBasis: ['ZIMRATE_ASK', 'MANUAL_ASK'].includes(r.source) ? 'ASK' : 'UNVERIFIED', date: AL.date(r.date), source: AL.fxSource[r.source] || r.source, updated: new Date().toISOString() };
    const v = document.querySelector('#v5RateValue'); if (v) v.textContent = Number(r.rate).toFixed(4);
    const dt = document.querySelector('#v5RateDate'); if (dt) dt.textContent = `${snap.source} · ${snap.date}`;
    return r;
  } catch (_) { return null; }
};
try { localStorage.setItem('matanho-v5-rate-check', String(Date.now())); } catch (_) { /* storage off */ }
setTimeout(() => AL.fxTopbar(), 1500);
window.addEventListener('click', (ev) => {
  const t = ev.target && ev.target.closest && ev.target.closest('[data-action="v5-refresh-rates"]');
  if (!t || !t.closest('.accounting-v52-root')) return;
  ev.preventDefault(); ev.stopPropagation();
  AL.busy(t, () => AL.fxTopbar(), ['Exchange rate', (r) => (r ? `${r.pair} ${AL.fxRate(r.rate)} (${AL.fxSource[r.source] || r.source}, ${AL.date(r.date)}).` : 'No stored rate yet.')]);
}, true);
// the sidebar names what the page does
try { for (const g of navGroups) for (const it of g[1]) if (it[0] === 'fx') it[1] = 'FX Rates & Revaluation'; } catch (_) { /* nav shape changed */ }
