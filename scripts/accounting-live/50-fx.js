/* FX: /accounting/fx-revaluation — the rate table the ledger converts with (the daily official rate, and rates entered
 * or corrected by finance, with who and why), what is held in each foreign currency translated at the latest rate, and
 * the month-end revaluation: each foreign-currency balance at the closing rate against what it is carried at, prepared
 * as a draft journal for an approver (only the movement since the last revaluation is booked).
 * Data: /accounting/multi-currency/rates, /exposure, /revaluation, /accounting/jobs (the daily rate job). */
AL.fxLoad = () => AL.res('fx', async () => {
  const [rates, exposure, jobs] = await Promise.all([
    AL.get('/accounting/multi-currency/rates?limit=60'),
    AL.get('/accounting/multi-currency/exposure'),
    AL.get('/accounting/jobs').catch(() => null),
  ]);
  return { rates, exposure, rateJob: jobs && (jobs.jobs || []).find((j) => j.key === 'rates.daily') };
});
AL.fxSource = { URL: 'Official daily rate', MANUAL: 'Entered by finance', TABLE: 'Rate table' };
AL.fxRate = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 6 }));

AL.page('fx', () => {
  AL.meLoad();
  const canEnter = AL.can('manage_accounting'), canRun = AL.can('manage_ledger');
  const e = AL.fxLoad();
  const acts = [canEnter ? AL.btn('Enter a rate', 'fx-add', 'primary') : '', canRun ? AL.btn("Fetch today's official rate", 'fx-fetch') : ''].join('');
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
  const tr = (rates.rates || []).map((r) => `<tr><td>${ae(AL.date(r.date))}</td><td><strong>${ae(r.pair)}</strong></td><td>${ae(AL.fxRate(r.rate))}</td><td>${ae(AL.fxSource[r.source] || r.source)}</td><td>${ae(r.createdBy || '—')}<span class="v28-sub">${ae(AL.dateTime(r.createdAt))}</span></td><td class="al-actions">${canEnter ? AL.btn('Correct', 'fx-correct', 'small', `data-id="${ae(r.id)}"`) : ''}</td></tr>`).join('');
  const table = AL.panel('Rate table', `The latest ${AL.plural((rates.rates || []).length, 'rate')}`, tr ? AL.table(['Date', 'Pair', 'Rate', 'Source', 'Recorded by', ''], tr, '820px') : AL.empty('No rates recorded yet.'));
  return `<div class="v28-page">${head}${kpis}${staleNote}<div class="al-grid-auto">${expo}</div>${AL.fxRevalPanel(canEnter)}${table}</div>`;
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
AL.wire.fx = () => { document.querySelectorAll('[data-fxr-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.fxr.asOf = el.value; AL.redraw(); }); }); };
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
      { k: 'rate', label: 'Rate', type: 'number', step: 'any', min: 0, required: true },
      { k: 'reason', label: init.id ? 'Why it is corrected' : 'Source or note', type: 'textarea', wide: true, required: !!init.id },
    ],
    initial: { from: init.from || (d.rates && d.rates.baseCurrency) || 'USD', to: init.to || codes.find((c) => c !== ((d.rates && d.rates.baseCurrency) || 'USD')), date: init.date ? String(init.date).slice(0, 10) : AL.stiToday(), rate: init.rate || '' },
    validate: (v) => (v.from === v.to ? 'Choose two different currencies.' : Number(v.rate) > 0 ? '' : 'The rate must be more than zero.'),
    onSubmit: async (v) => { const r = await AL.post('/accounting/multi-currency/rates', { ...v, rate: Number(v.rate) }); return r && r.corrected ? `${v.from}/${v.to} for ${AL.date(v.date)} corrected; the old value is kept in the audit trail.` : `${v.from}/${v.to} ${v.rate} recorded for ${AL.date(v.date)}.`; },
    after: () => { delete AL.cache.fx; AL.redraw(); AL.fxTopbar(); },
  });
};
AL.actions['fx-add'] = () => AL.fxForm();
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
    const snap = { pair: `${r.from}/${r.to}`, bid: r.rate, ask: r.rate, avg: r.rate, date: AL.date(r.date), source: AL.fxSource[r.source] || r.source, updated: new Date().toISOString() };
    try { localStorage.setItem('matanho-v5-rates', JSON.stringify(snap)); } catch (_) { /* storage off */ }
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
