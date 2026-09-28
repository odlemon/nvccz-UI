/* Compliance & Tax: /accounting/tax — the VAT return from the ledger (output tax on 2100, input tax on 1101, posted
 * journals only; drafts carrying VAT shown apart; one currency at a time) with every contributing line, and the tax
 * return packs (CIT, VAT, withholding, audit file): prepare, compile from the ledger, submit for review, and sign off by
 * a checker other than the preparer (a CIT sign-off raises the tax accrual journal). Data: /vat/report,
 * /tax-return-packs/*. */
AL.ui.tax = AL.ui.tax || { tab: 'vat', period: '', currencyId: '' };
AL.taxQuarter = () => { const [y, m] = AL.stiToday().split('-').map(Number); const q = Math.floor((m - 1) / 3); return q === 0 ? `${y - 1}-Q4` : `${y}-Q${q}`; };
AL.taxRange = (p) => {
  const [y, part] = p.split('-');
  if (/^Q\d$/.test(part)) { const q = Number(part[1]); const sm = (q - 1) * 3 + 1, em = q * 3; return [`${y}-${String(sm).padStart(2, '0')}-01`, `${y}-${String(em).padStart(2, '0')}-${String(new Date(Date.UTC(Number(y), em, 0)).getUTCDate()).padStart(2, '0')}`]; }
  const mo = Number(part); return [`${y}-${part}-01`, `${y}-${part}-${String(new Date(Date.UTC(Number(y), mo, 0)).getUTCDate()).padStart(2, '0')}`];
};
AL.TRP_REGIME = { ZIMRA_CIT: 'Corporate income tax', ZIMRA_VAT: 'VAT', ZIMRA_WHT: 'Withholding tax', ZIMRA_SAFT: 'Audit support file' };
AL.TRP_STATUS = { DRAFT: ['Draft', 'info'], COMPILING: ['Compiling', 'warn'], DRAFT_REVIEW: ['Compiled', 'warn'], SIGNED_OFF: ['Signed off', 'ok'], FAILED: ['Compile failed', 'bad'] };

AL.page('compliance', () => {
  AL.meLoad();
  const u = AL.ui.tax; if (!u.period) u.period = AL.taxQuarter();
  const canPrep = AL.can('manage_accounting');
  const head = AL.head('Reporting and compliance', 'Compliance & Tax', '', u.tab === 'packs' && canPrep ? AL.btn('New tax return pack', 'trp-new', 'primary') : u.tab === 'vat' ? AL.btn('Export CSV', 'vat-csv') : '');
  const tabs = `<div class="v28-tabbar">${[['vat', 'VAT return'], ['packs', 'Tax return packs']].map(([id, l]) => `<button class="v28-tab ${u.tab === id ? 'active' : ''}" data-al="tax-tab" data-t="${id}">${l}</button>`).join('')}</div>`;
  return `<div class="v28-page">${head}${tabs}${u.tab === 'vat' ? AL.taxVat() : AL.taxPacks()}</div>`;
});
AL.taxVat = () => {
  const u = AL.ui.tax;
  const cur = AL.res('tax-cur', () => AL.get('/accounting/currencies'));
  const [from, to] = AL.taxRange(u.period);
  const key = `tax-vat:${from}:${to}:${u.currencyId}`;
  const e = AL.res(key, () => AL.get(`/vat/report?startDate=${from}&endDate=${to}${u.currencyId ? `&currencyId=${encodeURIComponent(u.currencyId)}` : ''}`));
  // the last eight quarters to the current one
  const periods = []; { let [cy, cm] = AL.stiToday().split('-').map(Number); let cq = Math.ceil(cm / 3); for (let i = 0; i < 8; i++) { periods.push([`${cy}-Q${cq}`, `Q${cq} ${cy}`]); cq--; if (!cq) { cq = 4; cy--; } } }
  const months = []; for (let i = 0; i < 18; i++) { const d = new Date(Date.UTC(Number(AL.stiToday().slice(0, 4)), Number(AL.stiToday().slice(5, 7)) - 1 - i, 1)); months.push([`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })]); }
  const filters = `<div class="al-filters">
    <label class="v28-field"><span>Period</span><select class="v28-select" data-tax-f="period"><optgroup label="Quarters">${periods.map(([v, l]) => `<option value="${v}"${u.period === v ? ' selected' : ''}>${l}</option>`).join('')}</optgroup><optgroup label="Months">${months.map(([v, l]) => `<option value="${v}"${u.period === v ? ' selected' : ''}>${ae(l)}</option>`).join('')}</optgroup></select></label>
    <label class="v28-field"><span>Currency</span><select class="v28-select" data-tax-f="currencyId"><option value="">Base currency</option>${((cur.data) || []).filter((c) => !c.isDefault).map((c) => `<option value="${ae(c.id)}"${u.currencyId === c.id ? ' selected' : ''}>${ae(c.code)}</option>`).join('')}</select></label>
  </div>`;
  const g = AL.gate(e, { key, errorTitle: 'The VAT return could not be built' });
  if (g) return `${filters}${g}`;
  const d = e.data || {}, c = d.currency || '';
  const s = d.summary || {};
  const kpis = AL.kpis([
    ['Output tax', AL.money(s.totalOutputTax, c), `${(d.outputTax && d.outputTax.transactionCount) || 0} lines · ${d.accounts ? d.accounts.output : ''}`],
    ['Input tax', AL.money(s.totalInputTax, c), `${(d.inputTax && d.inputTax.transactionCount) || 0} lines · ${d.accounts ? d.accounts.input : ''}`],
    [s.netLiability >= 0 ? 'Payable to ZIMRA' : 'Refundable', AL.money(Math.abs(s.netLiability || 0), c), `${AL.date(from)} – ${AL.date(to)}`, s.netLiability > 0 ? '#f79009' : '#12b76a'],
    ['Drafts carrying VAT', String((d.drafts && d.drafts.journals) || 0), d.drafts && d.drafts.journals ? `Output ${AL.money(d.drafts.outputTax, c)} · input ${AL.money(d.drafts.inputTax, c)}, not in the return until posted` : 'None', d.drafts && d.drafts.journals ? '#f79009' : undefined],
  ]);
  const others = (d.otherCurrencies || []).length ? `<div class="al-state al-note">${d.otherCurrencies.map((o) => `${ae(o.currency)}: output ${ae(AL.money(o.outputTax, o.currency))}, input ${ae(AL.money(o.inputTax, o.currency))}`).join(' · ')} — returned separately; choose the currency above.</div>` : '';
  const lines = (list) => (list || []).map((t) => `<tr><td>${ae(AL.date(t.date))}</td><td>${ae(t.type)}</td><td><strong>${ae(t.reference || '')}</strong>${t.customerName ? `<span class="v28-sub">${ae(t.customerName)}</span>` : ''}</td><td class="al-wrap">${ae(t.description || '')}</td><td class="num">${ae(AL.money(t.amount, c))}</td><td class="num">${ae(AL.money(t.vatAmount, c))}</td></tr>`).join('');
  const out = lines(d.outputTax && d.outputTax.transactions), inp = lines(d.inputTax && d.inputTax.transactions);
  return `${filters}${kpis}${others}${AL.panel('Output tax', 'Every posted line on the VAT output account', out ? AL.table(['Date', 'Source', 'Reference', 'Description', 'Document', 'VAT'], out, '980px') : AL.empty('No output tax in this period.'))}${AL.panel('Input tax', 'Every posted line on the VAT input account', inp ? AL.table(['Date', 'Source', 'Reference', 'Description', 'Document', 'VAT'], inp, '980px') : AL.empty('No input tax in this period.'))}`;
};
AL.taxPacks = () => {
  const e = AL.res('trp', () => AL.get('/tax-return-packs'));
  const g = AL.gate(e, { key: 'trp', errorTitle: 'Tax return packs could not be loaded' });
  if (g) return g;
  const list = (e.data || []).slice().sort((a, b) => String(b.periodEnd).localeCompare(String(a.periodEnd)));
  const me = AL.me();
  const checker = /chief financial|cfo|admin/i.test(me.role || '');
  const rows = list.map((p) => {
    const st = AL.TRP_STATUS[p.status] || [p.status, 'info'];
    const maker = p.compiledById || p.submittedById || p.createdById;
    const acts = [AL.btn('Open', 'trp-open', 'small', `data-id="${ae(p.id)}"`)];
    if (AL.can('manage_accounting') && ['DRAFT', 'DRAFT_REVIEW', 'FAILED'].includes(p.status) && !p.submittedById) acts.push(AL.btn(p.status === 'DRAFT' || p.status === 'FAILED' ? 'Compile' : 'Recompile', 'trp-compile', 'small', `data-id="${ae(p.id)}"`));
    if (AL.can('manage_accounting') && p.status === 'DRAFT_REVIEW' && !p.submittedById) acts.push(AL.btn('Submit for review', 'trp-submit', 'small primary', `data-id="${ae(p.id)}"`));
    if (checker && p.status === 'DRAFT_REVIEW' && p.submittedById && maker !== me.id) acts.push(AL.btn('Sign off', 'trp-sign', 'small primary', `data-id="${ae(p.id)}"`));
    if (p.packPdfUrl) acts.push(`<a class="v28-btn small" href="${ae(p.packPdfUrl)}" target="_blank" rel="noopener">PDF</a>`);
    const liab = p.taxRegime === 'ZIMRA_VAT' ? p.vatNetPayable : p.totalTaxLiability;
    return `<tr>
      <td><strong>${ae(AL.TRP_REGIME[p.taxRegime] || p.taxRegime)}</strong><span class="v28-sub">${ae(p.forecastEntity ? p.forecastEntity.name : '')}</span></td>
      <td>${ae(p.taxPeriod === 'ANNUAL' ? `Year ${p.taxYear}` : `${p.taxPeriod} ${p.taxYear}`)}<span class="v28-sub">${ae(AL.date(p.periodStart))} – ${ae(AL.date(p.periodEnd))}</span></td>
      <td class="num">${liab != null ? ae(AL.money(liab, p.baseCurrency)) : '—'}</td>
      <td>${AL.status(p.submittedById && p.status === 'DRAFT_REVIEW' ? 'Waiting for sign-off' : st[0], p.submittedById && p.status === 'DRAFT_REVIEW' ? 'warn' : st[1])}${p.status === 'FAILED' && p.errorMessage ? `<span class="v28-sub al-bad">${ae(String(p.errorMessage).slice(0, 120))}</span>` : ''}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  return AL.panel('Tax return packs', '', rows ? AL.table(['Return', 'Period', 'Liability', 'Status', ''], rows, '1000px') : AL.empty('No tax return packs yet.'));
};
AL.wire.compliance = () => { document.querySelectorAll('[data-tax-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.tax[el.dataset.taxF] = el.value; AL.redraw(); }); }); };
AL.actions['tax-tab'] = (el) => { AL.ui.tax.tab = el.dataset.t; AL.redraw(); };
AL.trpReload = () => { delete AL.cache.trp; AL.redraw(); };
AL.trpFind = (id) => ((AL.cache.trp && AL.cache.trp.data) || []).find((p) => p.id === id);
AL.actions['vat-csv'] = () => {
  const u = AL.ui.tax, [from, to] = AL.taxRange(u.period);
  const e = AL.cache[`tax-vat:${from}:${to}:${u.currencyId}`]; if (!e || !e.data) return;
  const d = e.data, rows = [];
  for (const [kind, list] of [['Output', d.outputTax && d.outputTax.transactions], ['Input', d.inputTax && d.inputTax.transactions]]) for (const t of list || []) rows.push([kind, t.date, t.type, t.reference, t.description, t.amount, t.vatAmount, d.currency]);
  AL.csv(`vat-return-${from}-to-${to}.csv`, [['Tax', 'Date', 'Source', 'Reference', 'Description', 'Document amount', 'VAT', 'Currency'], ...rows]);
};
AL.actions['trp-new'] = (el) => AL.busy(el, async () => {
  const ents = await AL.get('/forecast-entities').catch(() => []);
  const y = Number(AL.stiToday().slice(0, 4));
  AL.form({ title: 'New tax return pack', submitLabel: 'Create', doneTitle: 'Pack created', fields: [
    { k: 'taxRegime', label: 'Return', type: 'select', required: true, blank: false, options: Object.entries(AL.TRP_REGIME).map(([v, l]) => ({ value: v, label: l })) },
    { k: 'forecastEntityId', label: 'Entity', type: 'select', required: true, blank: false, options: (ents || []).filter((x) => x.is_active !== false).map((x) => ({ value: x.id, label: x.name })) },
    { k: 'taxYear', label: 'Tax year', type: 'number', min: 2000, max: 2100, step: '1', required: true },
    { k: 'taxPeriod', label: 'Period', type: 'select', required: true, blank: false, options: [['Q1', 'Q1'], ['Q2', 'Q2'], ['Q3', 'Q3'], ['Q4', 'Q4'], ['ANNUAL', 'Full year']].map(([v, l]) => ({ value: v, label: l })) },
  ], initial: { taxRegime: 'ZIMRA_VAT', taxYear: y, taxPeriod: `Q${Math.max(1, Math.ceil(Number(AL.stiToday().slice(5, 7)) / 3) - 1)}`, forecastEntityId: ((ents || []).find((x) => x.is_default) || (ents || [])[0] || {}).id },
  onSubmit: async (v) => { await AL.post('/tax-return-packs', { ...v, taxYear: Number(v.taxYear), baseCurrency: 'USD' }); return 'Compile it to pull the figures from the ledger.'; }, after: () => AL.trpReload() });
});
AL.actions['trp-compile'] = (el) => AL.busy(el, async () => { const r = await AL.post(`/tax-return-packs/${encodeURIComponent(el.dataset.id)}/compile`, {}); AL.trpReload(); return r; }, ['Compiled', (r) => (r && r.status === 'FAILED' ? `Failed: ${r.errorMessage || ''}` : 'Figures pulled from the ledger.')]);
AL.actions['trp-submit'] = (el) => AL.busy(el, async () => { await AL.post(`/tax-return-packs/${encodeURIComponent(el.dataset.id)}/submit-review`, {}); AL.trpReload(); }, ['Submitted', 'A checker other than you signs it off.']);
AL.actions['trp-sign'] = (el) => { const p = AL.trpFind(el.dataset.id); if (!p) return; AL.confirm({ title: `Sign off ${AL.TRP_REGIME[p.taxRegime] || p.taxRegime} ${p.taxPeriod} ${p.taxYear}`, confirmLabel: 'Sign off', doneTitle: 'Signed off', body: `The pack is locked and its PDF sealed.${p.taxRegime === 'ZIMRA_CIT' ? ' The tax accrual journal is raised for posting.' : ''}`, onConfirm: async () => { await AL.post(`/tax-return-packs/${encodeURIComponent(p.id)}/sign-off`, {}); return ''; }, after: () => AL.trpReload() }); };
AL.actions['trp-open'] = (el) => AL.busy(el, async () => {
  const id = el.dataset.id; const p = AL.trpFind(id); if (!p) return;
  const [rec, aud] = await Promise.all([AL.get(`/tax-return-packs/${encodeURIComponent(id)}/reconciliation`).catch(() => []), AL.get(`/tax-return-packs/${encodeURIComponent(id)}/audit`).catch(() => [])]);
  const recRows = (rec || []).map((l) => `<tr><td>${ae(l.lineLabel || l.lineCode)}</td><td class="num">${ae(AL.money(l.glBalance, l.currencyCode))}</td><td class="num">${Number(l.taxAdjustment) ? ae(AL.money(l.taxAdjustment, l.currencyCode)) : '—'}</td><td>${ae(l.taxCategory || '')}</td></tr>`).join('');
  const EV = { PACK_CREATED: 'Created', COMPILE_STARTED: 'Compiling', COMPILED: 'Compiled', COMPILE_FAILED: 'Compile failed', LINE_OVERRIDE: 'Line adjusted', SUBMITTED_REVIEW: 'Submitted for review', SIGNED_OFF: 'Signed off', GL_POSTED: 'Tax journal raised', PORTAL_PUBLISHED: 'Published' };
  const audRows = (aud || []).map((a) => `<tr><td>${ae(AL.dateTime(a.createdAt))}</td><td>${ae(EV[a.eventType] || a.eventType)}</td><td class="al-wrap">${ae(a.details ? JSON.stringify(a.details).slice(0, 140) : '')}</td></tr>`).join('');
  AL.form({ title: `${AL.TRP_REGIME[p.taxRegime] || p.taxRegime} · ${p.taxPeriod === 'ANNUAL' ? `Year ${p.taxYear}` : `${p.taxPeriod} ${p.taxYear}`}`, sub: `${AL.date(p.periodStart)} – ${AL.date(p.periodEnd)}${p.packPdfSha256 ? ` · PDF SHA-256 ${p.packPdfSha256.slice(0, 16)}…` : ''}`, wide: true, viewOnly: true, submitLabel: 'Close', fields: [],
    extra: `<div class="al-wide"><h4>Ledger to return</h4>${recRows ? AL.table(['Line', 'Ledger', 'Tax adjustment', 'Category'], recRows, '640px') : AL.empty('Not compiled yet.')}<h4>History</h4>${audRows ? AL.table(['When', 'What', 'Detail'], audRows, '640px') : AL.empty('Nothing yet.')}</div>`, onSubmit: async () => false });
});
