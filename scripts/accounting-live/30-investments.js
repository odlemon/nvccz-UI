/* Short-Term Investments: /accounting/short-term-investments — the treasury register, valued in the reporting currency,
 * with daily interest, placements, rate changes, liquidation, void, the posting mode and approval of interest journals.
 * Everything here comes from /accounting/short-term-investments/* (SRD: Accounting Short-Term Investment Tracking). */
AL.stiToday = () => { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Harare' }); } catch (_) { return new Date().toISOString().slice(0, 10); } };
AL.stiLoad = () => AL.res('sti', async () => {
  const today = AL.stiToday();
  const [dash, list, settings] = await Promise.all([
    AL.get(`/accounting/short-term-investments/dashboard?asOfIso=${today}`),
    AL.get('/accounting/short-term-investments/instruments'),
    AL.get('/accounting/short-term-investments/settings'),
  ]);
  return { dash: dash || {}, list: Array.isArray(list) ? list : [], settings: settings || {}, today };
});
AL.ui.sti = AL.ui.sti || { tab: 'ACTIVE', page: 1 };
AL.stiPageSize = 10;
// Sidebar shows only the server-owned pending-work count, never a stale sample total.
AL.suppressFallbackNavCount = AL.suppressFallbackNavCount || new Set();
AL.suppressFallbackNavCount.add('investments');
AL.stiCompounding = { SIMPLE: 'Simple', COMPOUND_DAILY: 'Compound daily', COMPOUND_MONTHLY: 'Compound monthly' };
AL.stiDayCount = { ACTUAL_365: 'Actual/365', ACTUAL_360: 'Actual/360', THIRTY_360: '30/360' };
AL.stiStatus = { ACTIVE: ['Active', 'ok'], SETTLED: ['Settled', 'info'], VOIDED: ['Voided', 'bad'] };
AL.stiPct = (dec) => (dec == null || !Number.isFinite(Number(dec)) ? '—' : `${(Number(dec) * 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`);
AL.stiDays = (iso, today) => { if (!iso) return null; return Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(today)) / 86400000); };
AL.stiFind = (id) => (((AL.cache.sti && AL.cache.sti.data) || {}).list || []).find((x) => x.id === id);
AL.stiReload = () => { AL.invalidate('sti-detail'); return AL.run('sti'); };

AL.page('investments', () => {
  const e = AL.stiLoad();
  AL.meLoad();
  const canPlace = AL.can('accounting.treasury.manage');
  const canApprove = AL.can('accounting.treasury.approve');
  const g = AL.gate(e, { key: 'sti', errorTitle: 'Short-term investments could not be loaded' });
  if (g) return `<div class="v28-page">${AL.head('Treasury and liquidity', 'Short-Term Investments', '')}${g}</div>`;
  const payload = e.data && typeof e.data === 'object' ? e.data : {};
  const dash = payload.dash && typeof payload.dash === 'object' ? payload.dash : {};
  const list = Array.isArray(payload.list) ? payload.list.filter((x) => x && typeof x === 'object') : [];
  const settings = payload.settings && typeof payload.settings === 'object' ? payload.settings : {};
  const today = payload.today || AL.stiToday();
  const cur = dash.reportingCurrency || 'USD';
  const pf = dash.portfolio || {};
  const alerts = Array.isArray(dash.alerts) ? dash.alerts.filter((a) => a && typeof a === 'object') : [];
  const pendingAccruals = alerts.filter((a) => a.type === 'PENDING_APPROVAL');
  const placements = Array.isArray(dash.pendingPlacements) ? dash.pendingPlacements.filter((p) => p && typeof p === 'object') : [];
  const settlements = alerts.filter((a) => a.type === 'PENDING_SETTLEMENT');
  const active = list.filter((x) => x.status === 'ACTIVE');
  const dashboardInstruments = Array.isArray(dash.instruments) ? dash.instruments.filter((x) => x && typeof x === 'object') : [];
  const byId = new Map(dashboardInstruments.filter((x) => x.instrumentId).map((x) => [x.instrumentId, x]));
  const draftMode = settings.postingMode !== 'APPROVED';

  const actions = [
    canPlace ? AL.btn('New investment', 'sti-new', 'primary') : '',
    canPlace ? AL.btn('Import CSV', 'sti-import-open') : '',
    canPlace && active.length ? AL.btn('Accrue to today', 'sti-accrue') : '',
    canApprove && pendingAccruals.length ? AL.btn(`Approve ${AL.plural(pendingAccruals.length, 'interest journal')}`, 'sti-approve-all') : '',
    canApprove ? AL.btn('Posting mode', 'sti-settings') : '',
    AL.exportBtns('sti-export'),
  ].join('');
  const head = AL.head('Treasury and liquidity', 'Short-Term Investments',
    `Valued in ${cur} as of ${AL.date(today)}. ${draftMode ? 'Daily interest journals are drafts until an approver posts them.' : 'Daily interest journals post straight to the ledger.'}`, actions);

  const mb = dash.maturityBuckets || {};
  const kpis = AL.kpis([
    ['Portfolio value', AL.money(pf.carryingTotal, cur), `${AL.plural(active.length, 'active investment')}`],
    ['Principal', AL.money(pf.principalTotal, cur), 'Cash placed'],
    ['Accrued interest', AL.money(pf.accruedInterestTotal, cur), 'Earned, not yet received', Number(pf.accruedInterestTotal) < 0 ? '#d92d20' : '#12b76a'],
    ['Interest this month', AL.money((dash.netYield || {}).monthToDate, cur), `Since 1 ${new Date(today).toLocaleDateString('en-GB', { month: 'short' })}`],
    ['Maturing in 30 days', AL.money(mb.within30Days, cur), 'Principal and interest due back'],
    ['Awaiting approval', String(pendingAccruals.length + placements.length + settlements.length), placements.length ? `${AL.plural(placements.length, 'placement')} with the CFO` : settlements.length ? `${AL.plural(settlements.length, 'settlement')} in draft` : pendingAccruals.length ? 'Interest journals in draft' : 'Nothing waiting', pendingAccruals.length + placements.length + settlements.length ? '#f79009' : '#12b76a'],
  ]);

  // what needs someone: missing rates, capital erosion, recent rate changes, drafts, placements with the CFO
  const attention = [];
  alerts.filter((a) => a.type === 'FX_RATE_MISSING').forEach((a) => attention.push([AL.status('Rate missing', 'bad'), 'Exchange rate', a.message]));
  alerts.filter((a) => a.type === 'CAPITAL_EROSION').forEach((a) => attention.push([AL.status('Negative yield', 'bad'), a.instrumentName, 'The current rate is below zero: the investment is losing value each day.']));
  const pendingBy = new Map();
  pendingAccruals.forEach((a) => pendingBy.set(a.instrumentId, { name: a.instrumentName, n: (pendingBy.get(a.instrumentId) || { n: 0 }).n + 1 }));
  pendingBy.forEach((v, id) => attention.push([AL.status('Draft interest', 'warn'), v.name, `${AL.plural(v.n, 'daily interest journal')} waiting to be posted.${canApprove ? '' : ' An approver posts them.'}`, canApprove ? AL.btn('Approve', 'sti-approve', 'small', `data-id="${ae(id)}"`) : '']));
  settlements.forEach((a) => attention.push([AL.status('Draft settlement', 'warn'), a.instrumentName, `Settled ${AL.date(a.triggeredAt)}. The settlement journal is a draft, so the cash is not in the bank ledger until an approver posts it.`, AL.btn('Journal entries', 'sti-journals', 'small')]));
  placements.forEach((p) => attention.push([AL.status('With the CFO', 'warn'), p.name, `${AL.money(p.principal, p.currencyCode || '')} placement requested by ${p.requestedBy || 'a preparer'} on ${AL.date(p.requestedAt)}; it is booked when the CFO approves it.`, AL.btn('Approval queue', 'sti-queue', 'small')]));
  alerts.filter((a) => a.type === 'RATE_CHANGE').forEach((a) => attention.push([AL.status('Rate changed', 'info'), a.instrumentName || 'Investment', String(a.message || 'APY schedule updated').replace('APY schedule updated', 'New rate')]));
  const attentionPanel = attention.length
    ? AL.panel('Needs attention', '', AL.table(['', 'Investment', 'Detail', ''], attention.map((r) => `<tr><td>${r[0]}</td><td><strong>${ae(r[1] || '')}</strong></td><td class="al-wrap">${ae(r[2])}</td><td class="al-actions">${r[3] || ''}</td></tr>`).join(''), '760px'))
    : '';

  // interest earned per day this month, in the reporting currency
  const days = Array.isArray(dash.dailyYieldInMonth) ? dash.dailyYieldInMonth.filter((d) => d && typeof d === 'object') : [];
  const peak = Math.max(0, ...days.map((d) => Math.abs(Number(d.amountSum) || 0)));
  const bars = peak > 0
    ? `<div class="al-bars" role="img" aria-label="Interest earned per day this month">${days.map((d) => { const v = Number(d.amountSum) || 0; const h = Math.max(2, Math.round((Math.abs(v) / peak) * 100)); return `<div class="al-bar${v < 0 ? ' neg' : ''}${v === 0 ? ' zero' : ''}" style="--h:${v === 0 ? 0 : h}%" title="${ae(AL.date(d.accrualDate))}: ${ae(AL.money(v, cur))}"></div>`; }).join('')}</div><div class="al-bars-axis"><span>${ae(AL.date(days[0] && days[0].accrualDate))}</span><span>${ae(AL.date(days[days.length - 1] && days[days.length - 1].accrualDate))}</span></div>`
    : AL.empty('No interest accrued yet this month.');
  const yieldPanel = AL.panel('Interest earned this month', `Per day, in ${cur}. Peak day ${AL.money(peak, cur)}.`, bars);

  // cash coming back, by when the investment matures
  const openEnded = dashboardInstruments.filter((x) => !x.maturityDate).reduce((s, x) => s + (Number(x.carryingValueReporting) || 0), 0);
  const ladder = [['Within 30 days', mb.within30Days], ['31 to 60 days', mb.days31to60], ['61 to 90 days', mb.days61to90], ['Over 90 days', mb.over90Days], ['No maturity date', openEnded]];
  const ladderPanel = AL.panel('Liquidity forecast', `Expected value at maturity, in ${cur}.`, AL.table(['When it comes back', 'Expected cash'], ladder.map((r) => `<tr><td>${ae(r[0])}</td><td>${ae(AL.money(r[1], cur))}</td></tr>`).join(''), '360px'));

  // the register
  const tab = AL.ui.sti.tab;
  const counts = { ACTIVE: 0, SETTLED: 0, VOIDED: 0 };
  list.forEach((x) => { counts[x.status] = (counts[x.status] || 0) + 1; });
  const tabs = `<div class="v28-tabbar">${[['ACTIVE', 'Active'], ['SETTLED', 'Settled'], ['VOIDED', 'Voided'], ['ALL', 'All']].map(([id, label]) => `<button class="v28-tab ${tab === id ? 'active' : ''}" data-al="sti-tab" data-tab="${id}">${ae(label)} <span class="v28-sub" style="display:inline">${id === 'ALL' ? list.length : counts[id] || 0}</span></button>`).join('')}</div>`;
  const shown = list.filter((x) => tab === 'ALL' || x.status === tab);
  const pages = Math.max(1, Math.ceil(shown.length / AL.stiPageSize));
  const page = Math.min(Math.max(1, Number(AL.ui.sti.page) || 1), pages);
  AL.ui.sti.page = page;
  const visible = shown.slice((page - 1) * AL.stiPageSize, page * AL.stiPageSize);
  const rows = visible.map((x) => {
    const d = byId.get(x.id) || {};
    const accrued = x.latestAccrual && x.status === 'ACTIVE' ? Number(x.latestAccrual.runningAccruedBalance) : d.accruedInterest;
    const code = (x.currency && x.currency.code) || '';
    const dleft = AL.stiDays(x.maturityDate, today);
    const st = AL.stiStatus[x.status] || [x.status, 'info'];
    const acts = [AL.btn('Open', 'sti-open', 'small', `data-id="${ae(x.id)}"`)];
    if (x.status === 'ACTIVE' && canPlace) acts.push(AL.btn('Change rate', 'sti-rate', 'small', `data-id="${ae(x.id)}"`), AL.btn('Liquidate', 'sti-liquidate', 'small', `data-id="${ae(x.id)}"`));
    if (x.status !== 'VOIDED' && canApprove) acts.push(AL.btn('Void', 'sti-void', 'small danger', `data-id="${ae(x.id)}"`));
    const maturity = x.status === 'SETTLED'
      ? `Settled ${ae(AL.date(x.liquidationDate))}<span class="v28-sub">${ae(AL.money(x.liquidationCashReceived, code))} received</span>`
      : x.maturityDate ? `${ae(AL.date(x.maturityDate))}<span class="v28-sub">${dleft < 0 ? `${-dleft} days past maturity` : dleft === 0 ? 'Matures today' : `in ${dleft} days`}</span>` : 'Open-ended';
    return `<tr>
      <td><strong>${ae(x.name)}</strong><span class="v28-sub">${ae([x.category, AL.stiCompounding[x.compoundingMethod], AL.stiDayCount[x.dayCountConvention]].filter(Boolean).join(' · '))}</span></td>
      <td>${ae(x.broker || '—')}</td>
      <td>${ae(code)}</td>
      <td>${ae(AL.money(x.principal, code))}</td>
      <td>${x.status === 'ACTIVE' ? ae(AL.stiPct(d.apyAsOf)) : '—'}</td>
      <td>${x.status === 'ACTIVE' ? ae(AL.money(accrued, code)) : '—'}</td>
      <td>${x.status === 'ACTIVE' ? `${ae(AL.money(d.carryingValue, code))}${code !== cur && d.carryingValueReporting != null ? `<span class="v28-sub">${ae(AL.money(d.carryingValueReporting, cur))}</span>` : ''}` : '—'}</td>
      <td>${maturity}</td>
      <td>${AL.status(st[0], st[1])}${x.capitalErosion ? `<span class="v28-sub">Negative yield</span>` : ''}</td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  const pager = `<div class="al-jobs-pager" role="navigation" aria-label="Investment pages"><span>Showing ${shown.length ? (page - 1) * AL.stiPageSize + 1 : 0}-${Math.min(page * AL.stiPageSize, shown.length)} of ${shown.length} investments</span><div><button type="button" class="v28-btn small" data-al="sti-page" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${page} of ${pages}</span><button type="button" class="v28-btn small" data-al="sti-page" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next</button></div></div>`;
  const register = AL.panel('Investment register', '', `${tabs}${shown.length ? AL.table(['Investment', 'Broker', 'Currency', 'Principal', 'Rate (APY)', 'Accrued interest', 'Carrying value', 'Maturity', 'Status', ''], rows, '1280px') : AL.empty(tab === 'ACTIVE' ? 'No active investments.' : 'None here.')}${pager}`);

  // settled: what came back against what the books expected
  const variance = (Array.isArray(dash.settlementVariance) ? dash.settlementVariance : []).filter((v) => v && v.varianceInstrumentCcy != null && Number.isFinite(Number(v.varianceInstrumentCcy)) && Math.abs(Number(v.varianceInstrumentCcy)) >= 0.01);
  const variancePanel = variance.length
    ? AL.panel('Settlement differences', 'Cash received against principal plus accrued interest; the difference was posted to interest income.', AL.table(['Investment', 'Settled', 'Expected', 'Received', 'Difference'], variance.map((v) => `<tr><td><strong>${ae(v.instrumentName)}</strong></td><td>${ae(AL.date(v.settlementDate))}</td><td>${ae(AL.money(v.expectedSettledAmountInstrumentCcy))}</td><td>${ae(AL.money(v.actualSettledAmountInstrumentCcy))}</td><td>${ae(AL.money(v.varianceInstrumentCcy))}</td></tr>`).join(''), '720px'))
    : '';

  return `<div class="v28-page al-sti-page">${head}${kpis}${attentionPanel}<div class="v28-grid two"><div>${yieldPanel}</div><div>${ladderPanel}</div></div>${register}${variancePanel}</div>`;
});

AL.actions['sti-tab'] = (el) => { AL.ui.sti.tab = el.dataset.tab; AL.ui.sti.page = 1; AL.redraw(); };
AL.actions['sti-page'] = (el) => { AL.ui.sti.page = Number(el.dataset.page) || 1; AL.redraw(); };
AL.actions['sti-queue'] = () => AL.go('approvals');
AL.actions['sti-journals'] = () => AL.go('journals');

AL.actions['sti-export'] = (el) => {
  const e = AL.cache.sti && AL.cache.sti.data; if (!e) return;
  const rows = Array.isArray(e.list) ? e.list.filter((x) => x && typeof x === 'object') : [];
  const dashboardInstruments = e.dash && Array.isArray(e.dash.instruments) ? e.dash.instruments.filter((x) => x && typeof x === 'object') : [];
  const byId = new Map(dashboardInstruments.filter((x) => x.instrumentId).map((x) => [x.instrumentId, x]));
  const spec = { title: 'Short-Term Investments', subtitle: `Investment register | ${e.dash.reportingCurrency || 'USD'} reporting currency`, filename: 'accounting-short-term-investments', landscape: true,
    meta: [['Reporting currency', e.dash.reportingCurrency || 'USD'], ['As of', AL.date(e.today)], ['Investments', String(rows.length)]],
    columns: ['Investment', 'Category', 'Broker', 'Currency', 'Principal', 'APY', 'Accrued interest', 'Carrying value', 'Maturity', 'Status'],
    rows: rows.map((x) => { const d = byId.get(x.id) || {}, code = x.currency && x.currency.code || ''; return [x.name, x.category || '', x.broker || '', code, AL.money(x.principal, code), AL.stiPct(d.apyAsOf), AL.money(x.latestAccrual ? x.latestAccrual.runningAccruedBalance : d.accruedInterest, code), AL.money(d.carryingValue, code), x.maturityDate ? AL.date(x.maturityDate) : 'Open-ended', (AL.stiStatus[x.status] || [x.status])[0]]; }),
    note: 'Portfolio values include active principal and accrued interest. Settlements and accrual journals follow the configured approval mode.' };
  AL.exportRun(el, spec, 'investments');
};
AL.stiCsvParse = (text) => { const out = []; let row = [], cell = '', q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; } else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell.replace(/\r$/, '')); if (row.some((v) => v.trim())) out.push(row); row = []; cell = ''; } else cell += c; } row.push(cell.replace(/\r$/, '')); if (row.some((v) => v.trim())) out.push(row); if (!out.length) return []; const headers = out.shift().map((h) => h.trim().toLowerCase()); return out.map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] || '').trim()]))); };
AL.stiHeaders = ['Name','Category','Broker','Principal','Currency','APY (%)','Interest method','Day count','Start date (YYYY-MM-DD)','Maturity date (YYYY-MM-DD)','Settlement bank','Principal asset account','Accrued interest account','Interest income account','Negative yield expense account','Unrealized FX account','Realized FX account'];
AL.stiState = { rows: [], errors: [], file: '', validating: false };
AL.actions['sti-template'] = () => { const example = ['Example 90-day deposit','Money Market','Example Bank','10000','USD','8.5','SIMPLE','ACTUAL_365',AL.stiToday(),'','Example Bank USD Operating','1150 Short-term investments','1160 Accrued interest receivable','4110 Interest income','5150 Investment loss','','']; const csv = [AL.stiHeaders, example].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'short-term-investments-import-template.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
AL.stiDrawImportStatus = () => { const n = document.getElementById('stiImportStatus'); if (!n) return; const s = AL.stiState; n.innerHTML = s.validating ? '<p class="v28-sub" role="status">Checking columns, duplicate placements, currencies, bank accounts and ledger mappings...</p>' : !s.file ? '<p class="v28-sub">Choose a CSV file. It will be validated automatically before import.</p>' : s.errors.length ? `<div class="al-state al-error"><strong>Fix these rows before importing</strong><ul>${s.errors.slice(0, 20).map((x) => `<li>${ae(x)}</li>`).join('')}</ul></div>` : `<p class="al-state al-success">${s.rows.length} rows checked. No duplicates found. Ready to import.</p>`; const b = document.querySelector('#alOverlay [data-al="form-submit"]'); if (b) b.disabled = s.validating || !s.file || !!s.errors.length || !s.rows.length; };
AL.actions['sti-import-open'] = () => {
  AL.stiState = { rows: [], errors: [], file: '', validating: false };
  AL.form({ title: 'Import short-term investments', sub: 'The CSV is validated automatically when selected. Duplicate placements are blocked before any record is created.', wide: true, submitLabel: 'Import investments', fields: [],
    extra: `<div class="al-wide"><button type="button" class="v28-btn small" data-al="sti-template">Download CSV template</button><label class="v28-field" style="margin-top:12px"><span>Investment CSV file</span><input id="stiImportFile" class="v28-input" type="file" accept=".csv,text/csv"></label><div id="stiImportStatus" role="status" aria-live="polite"></div><p class="v28-sub">Maximum 500 rows, 5 MB. Match currency, bank and account labels to the active system records. Normal CFO approval rules still apply.</p></div>`,
    onSubmit: async () => {
      const s = AL.stiState; if (!s.rows.length || s.errors.length) throw new Error('Select a valid CSV file first.');
      const lk = await AL.stiLookups(), base = lk.currencies.find((x) => x.isDefault) || lk.currencies[0] || {};
      const findAcct = (label) => lk.accounts.find((a) => `${a.accountNo} ${a.accountName}`.toLowerCase() === label.toLowerCase() || a.accountNo.toLowerCase() === label.toLowerCase());
      let imported = 0, pending = 0; const errors = [];
      for (let i = 0; i < s.rows.length; i++) { const r = s.rows[i]; try {
        const progress = document.getElementById('stiImportStatus'); if (progress) progress.innerHTML = `<div role="status" aria-live="polite"><strong>Importing placement ${i + 1} of ${s.rows.length}</strong><progress max="${s.rows.length}" value="${i}"></progress></div>`;
        const currency = lk.currencies.find((x) => x.code.toLowerCase() === r.currency.toLowerCase());
        const bank = lk.banks.find((x) => x.name.toLowerCase() === r.settlement.toLowerCase() || `${x.name}${x.currency && x.currency.code ? ` (${x.currency.code})` : ''}`.toLowerCase() === r.settlement.toLowerCase());
        const pa=findAcct(r.principalAccount), aa=findAcct(r.accruedAccount), ia=findAcct(r.incomeAccount), ea=findAcct(r.expenseAccount), uf=r.unrealizedFx ? findAcct(r.unrealizedFx) : null, rf=r.realizedFx ? findAcct(r.realizedFx) : null;
        if (!currency || !bank || !pa || !aa || !ia || !ea) throw new Error('Currency, bank or required account did not match an active system record.');
        const foreign = currency.id !== base.id; if (foreign && (!uf || !rf)) throw new Error('Foreign-currency investment needs valid unrealized and realized FX accounts.');
        const result = await AL.post('/accounting/short-term-investments/instruments', { name:r.name, category:r.category, broker:r.broker, principal:Number(r.principal), currencyId:currency.id, initialApyPercent:Number(r.apy), compoundingMethod:r.method, dayCountConvention:r.dayCount, startDateIso:r.start, maturityDateIso:r.maturity || null, settlementBankId:bank.id, principalGlAccountId:pa.id, accruedInterestGlAccountId:aa.id, interestIncomeGlAccountId:ia.id, negativeYieldExpenseGlAccountId:ea.id, functionalCurrencyId:foreign ? base.id : null, unrealizedFxGlAccountId:uf && uf.id || null, realizedFxGlAccountId:rf && rf.id || null });
        imported++; if (result && result.status === 'pending_approval') pending++;
      } catch (e) { errors.push(`Row ${i + 2}: ${AL.msg(e)}`); } }
      if (errors.length) throw new Error(`${imported} imported (${pending} awaiting approval). ${errors.slice(0, 4).join(' | ')}`);
      const progress = document.getElementById('stiImportStatus'); if (progress) progress.innerHTML = `<p class="al-state al-success" role="status">${imported} placements imported; ${pending} awaiting CFO approval.</p>`;
      AL.formSpec.doneTitle = 'Investments imported'; return `${imported} placements submitted; ${pending} awaiting CFO approval.`;
    }, after: () => AL.stiReload() });
  setTimeout(AL.stiDrawImportStatus, 0);
};
AL.actions['sti-import-submit'] = () => document.querySelector('#alOverlay [data-al="form-submit"]')?.click();
document.addEventListener('change', async (ev) => {
  const input = ev.target; if (!input || input.id !== 'stiImportFile') return; const s = AL.stiState; s.file = input.files && input.files[0] ? input.files[0].name : ''; s.rows = []; s.errors = []; s.validating = !!s.file;
  AL.stiDrawImportStatus();
  if (!s.file) { AL.stiDrawImportStatus(); return; } const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) s.errors.push('File exceeds the 5 MB limit.');
  else if (!file.name.toLowerCase().endsWith('.csv')) s.errors.push('Use the downloadable CSV template.');
  else {
    const data = AL.stiCsvParse(await file.text()), existing = ((AL.cache.sti && AL.cache.sti.data && AL.cache.sti.data.list) || []).map((x) => `${x.name}|${x.broker || ''}|${String(x.startDate).slice(0,10)}`.toLowerCase());
    const req = ['name','category','broker','principal','currency','apy (%)','interest method','day count','start date (yyyy-mm-dd)','settlement bank','principal asset account','accrued interest account','interest income account','negative yield expense account'];
    if (!data.length) s.errors.push('The file has no data rows.'); if (data.length > 500) s.errors.push('The file has more than 500 rows.'); const seen = new Set();
    data.forEach((r,i) => { const n=i+2; req.forEach((k) => { if (!r[k]) s.errors.push(`Row ${n}: ${k} is required.`); }); const amount=Number(r.principal), apy=Number(r['apy (%)']); if (!(amount>0) || !Number.isFinite(amount)) s.errors.push(`Row ${n}: principal must be greater than zero.`); if (!Number.isFinite(apy) || Math.abs(apy)>1500) s.errors.push(`Row ${n}: APY must be between -1500 and 1500.`); const start=r['start date (yyyy-mm-dd)']; if (!/^\d{4}-\d{2}-\d{2}$/.test(start||'')) s.errors.push(`Row ${n}: start date must use YYYY-MM-DD.`); const maturity=r['maturity date (yyyy-mm-dd)']; if (maturity && (!/^\d{4}-\d{2}-\d{2}$/.test(maturity) || maturity<=start)) s.errors.push(`Row ${n}: maturity date must be later than the start date.`); const key=`${r.name}|${r.broker}|${start}`.toLowerCase(); if (seen.has(key)||existing.includes(key)) s.errors.push(`Row ${n}: duplicate name, broker and start date.`); seen.add(key); if (!['money market','t-bill','treasury bill','commercial paper'].includes((r.category||'').toLowerCase())) s.errors.push(`Row ${n}: category must be Money Market, T-Bill or Commercial Paper.`); if (!['simple','compound daily','compound monthly'].includes((r['interest method']||'').toLowerCase())) s.errors.push(`Row ${n}: unsupported interest method.`); if (!['actual/360','actual/365','30/360','actual_360','actual_365','thirty_360'].includes((r['day count']||'').toLowerCase())) s.errors.push(`Row ${n}: unsupported day-count convention.`); });
    if (!s.errors.length) {
      try {
        const lk = await AL.stiLookups(), base = lk.currencies.find((x) => x.isDefault) || lk.currencies[0] || {};
        const account = (label) => lk.accounts.find((a) => `${a.accountNo} ${a.accountName}`.toLowerCase() === label.toLowerCase() || String(a.accountNo).toLowerCase() === label.toLowerCase());
        data.forEach((r, i) => {
          const line = i + 2, currency = lk.currencies.find((x) => x.code.toLowerCase() === r.currency.toLowerCase());
          const bank = lk.banks.find((x) => x.name.toLowerCase() === r['settlement bank'].toLowerCase() || `${x.name}${x.currency && x.currency.code ? ` (${x.currency.code})` : ''}`.toLowerCase() === r['settlement bank'].toLowerCase());
          const principal = account(r['principal asset account']), accrued = account(r['accrued interest account']), income = account(r['interest income account']), expense = account(r['negative yield expense account']);
          if (!currency) s.errors.push(`Row ${line}: currency does not match an active system currency.`);
          if (!bank) s.errors.push(`Row ${line}: settlement bank does not match an active bank account.`);
          if (bank && currency && bank.currencyId && bank.currencyId !== currency.id) s.errors.push(`Row ${line}: settlement bank currency differs from the investment currency.`);
          if (!principal || !accrued || !income || !expense) s.errors.push(`Row ${line}: one or more required GL accounts do not match an active account.`);
          if (principal && accrued && principal.id === accrued.id) s.errors.push(`Row ${line}: principal and accrued interest must use separate GL accounts.`);
          if (currency && base && currency.id !== base.id && (!account(r['unrealized fx account']) || !account(r['realized fx account']))) s.errors.push(`Row ${line}: foreign-currency investments need valid unrealized and realized FX accounts.`);
          if (r['start date (yyyy-mm-dd)'] > AL.stiToday()) s.errors.push(`Row ${line}: start date cannot be in the future.`);
        });
      } catch (e) { s.errors.push(`Could not check the system bank and account mappings: ${AL.msg(e)}`); }
    }
    if (!s.errors.length) s.rows=data.map((r)=>({ name:r.name,category:r.category,broker:r.broker,principal:r.principal,currency:r.currency,apy:r['apy (%)'],method:r['interest method'].toUpperCase().replace(/ /g,'_'),dayCount:r['day count'].toUpperCase().replace(/\//g,'_').replace('30_360','THIRTY_360'),start:r['start date (yyyy-mm-dd)'],maturity:r['maturity date (yyyy-mm-dd)'],settlement:r['settlement bank'],principalAccount:r['principal asset account'],accruedAccount:r['accrued interest account'],incomeAccount:r['interest income account'],expenseAccount:r['negative yield expense account'],unrealizedFx:r['unrealized fx account'],realizedFx:r['realized fx account']}));
  }
  s.validating = false;
  AL.stiDrawImportStatus();
}, true);

// ------------------------------------------------------------------------------------------------ place an investment
AL.stiLookups = async () => {
  const [currencies, banks, coa] = await Promise.all([AL.get('/accounting/currencies'), AL.get('/cashbook/banks'), AL.get('/accounting/chart-of-accounts')]);
  const accounts = (Array.isArray(coa) ? coa : (coa && coa.accounts) || []).filter((a) => a.isActive !== false);
  return { currencies: (currencies || []).filter((c) => c.isActive !== false), banks: (banks || []).filter((b) => b.isActive !== false && b.glAccountId), accounts };
};
AL.stiAccountPick = (accounts, no, re) => { const a = accounts.find((x) => x.accountNo === no) || accounts.find((x) => re.test(x.accountName || '')); return a ? a.id : ''; };
AL.actions['sti-new'] = (el) => AL.busy(el, async () => {
  const lk = await AL.stiLookups();
  const base = lk.currencies.find((c) => c.isDefault) || lk.currencies[0] || {};
  const acct = (types) => lk.accounts.filter((a) => types.test(`${a.accountType} ${a.accountNo}`)).map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` }));
  const assets = acct(/asset|^1/i), income = acct(/income|revenue|\b4\d{3}\b/i), expense = acct(/expense|\b5\d{3}\b/i), all = lk.accounts.map((a) => ({ value: a.id, label: `${a.accountNo} ${a.accountName}` }));
  const fields = [
    { k: 'name', label: 'Investment name', required: true, wide: true },
    { k: 'category', label: 'Type', type: 'select', options: ['Money Market', 'Treasury Bill', 'Commercial Paper', 'Fixed Deposit', 'Bond', 'Other'], required: true },
    { k: 'broker', label: 'Broker or issuer', required: true },
    { k: 'currencyId', label: 'Currency', type: 'select', options: lk.currencies.map((c) => ({ value: c.id, label: c.code })), required: true, blank: false },
    { k: 'principal', label: 'Principal', type: 'number', min: 0.01, step: '0.01', required: true },
    { k: 'initialApyPercent', label: 'Rate (APY %)', type: 'number', step: '0.0001', required: true, hint: 'Annual yield in percent; a negative rate is allowed.' },
    { k: 'compoundingMethod', label: 'Interest method', type: 'select', options: Object.entries(AL.stiCompounding).map(([value, label]) => ({ value, label })), required: true, blank: false },
    { k: 'dayCountConvention', label: 'Day count', type: 'select', options: Object.entries(AL.stiDayCount).map(([value, label]) => ({ value, label })), required: true, blank: false },
    { k: 'startDateIso', label: 'Start date', type: 'date', required: true, max: AL.stiToday() },
    { k: 'maturityDateIso', label: 'Maturity date', type: 'date' },
    { k: 'settlementBankId', label: 'Funded from (bank)', type: 'select', options: lk.banks.map((b) => ({ value: b.id, label: `${b.name}${b.currency && b.currency.code ? ` (${b.currency.code})` : ''}` })), required: true, wide: true },
    { k: 'principalGlAccountId', label: 'Investment asset account', type: 'select', options: assets, required: true },
    { k: 'accruedInterestGlAccountId', label: 'Accrued interest account', type: 'select', options: assets, required: true },
    { k: 'interestIncomeGlAccountId', label: 'Interest income account', type: 'select', options: income, required: true },
    { k: 'negativeYieldExpenseGlAccountId', label: 'Negative yield expense account', type: 'select', options: expense, required: true },
    { k: 'unrealizedFxGlAccountId', label: 'Unrealised FX account (foreign currency)', type: 'select', options: all },
    { k: 'realizedFxGlAccountId', label: 'Realised FX account (foreign currency)', type: 'select', options: all },
  ];
  AL.form({
    title: 'New investment', sub: 'Placements of USD 50,000 or more by a preparer go to the CFO for approval first.', wide: true, submitLabel: 'Place investment', fields,
    initial: {
      currencyId: base.id, compoundingMethod: 'SIMPLE', dayCountConvention: 'ACTUAL_365', startDateIso: AL.stiToday(),
      settlementBankId: (lk.banks.find((b) => b.currencyId === base.id) || lk.banks[0] || {}).id,
      principalGlAccountId: AL.stiAccountPick(lk.accounts, '1150', /short.?term invest/i),
      accruedInterestGlAccountId: AL.stiAccountPick(lk.accounts, '1160', /accrued interest/i),
      interestIncomeGlAccountId: AL.stiAccountPick(lk.accounts, '4110', /interest income/i),
      negativeYieldExpenseGlAccountId: AL.stiAccountPick(lk.accounts, '5150', /negative yield|investment loss/i),
    },
    validate: (v) => {
      if (!(Number(v.principal) > 0)) return 'Principal must be more than zero.';
      if (!Number.isFinite(Number(v.initialApyPercent))) return 'Enter the rate as a percentage, for example 9.12.';
      if (v.startDateIso > AL.stiToday()) return 'The start date cannot be in the future.';
      if (v.maturityDateIso && v.maturityDateIso <= v.startDateIso) return 'The maturity date must be after the start date.';
      const bank = lk.banks.find((b) => b.id === v.settlementBankId);
      if (bank && bank.currencyId && bank.currencyId !== v.currencyId) return 'The funding bank account must be in the investment currency.';
      if (v.accruedInterestGlAccountId === v.principalGlAccountId) return 'Principal and accrued interest need separate accounts.';
      if (v.currencyId !== base.id && (!v.unrealizedFxGlAccountId || !v.realizedFxGlAccountId)) return 'A foreign-currency investment needs its unrealised and realised FX accounts.';
      return '';
    },
    onSubmit: async (v) => {
      const body = { ...v, principal: Number(v.principal), initialApyPercent: Number(v.initialApyPercent), maturityDateIso: v.maturityDateIso || null, functionalCurrencyId: v.currencyId !== base.id ? base.id : null, unrealizedFxGlAccountId: v.unrealizedFxGlAccountId || null, realizedFxGlAccountId: v.realizedFxGlAccountId || null };
      const r = await AL.post('/accounting/short-term-investments/instruments', body);
      if (r && r.status === 'pending_approval') { AL.formSpec.doneTitle = 'Sent for CFO approval'; return `${v.name} is booked once the CFO approves it.`; }
      AL.formSpec.doneTitle = 'Investment placed';
      return r && r.initialAccrualCatchUpWarning ? `Placed. Interest could not be accrued yet: ${r.initialAccrualCatchUpWarning}` : `${v.name} is placed and interest is accrued to today.`;
    },
    after: () => { AL.ui.sti.tab = 'ACTIVE'; return AL.stiReload(); },
  });
});

// ------------------------------------------------------------------------------------------------ rate, liquidation, void
AL.actions['sti-rate'] = (el) => {
  const x = AL.stiFind(el.dataset.id); if (!x) return;
  const d = ((AL.cache.sti.data.dash.instruments || []).find((i) => i.instrumentId === x.id)) || {};
  AL.form({
    title: `Change rate: ${x.name}`, sub: `Current rate ${AL.stiPct(d.apyAsOf)}`, submitLabel: 'Save rate', doneTitle: 'Rate changed',
    fields: [
      { k: 'apyPercent', label: 'New rate (APY %)', type: 'number', step: '0.0001', required: true },
      { k: 'effectiveFromIso', label: 'Effective from', type: 'date', required: true, min: x.startDate.slice(0, 10) },
    ],
    initial: { effectiveFromIso: AL.stiToday() },
    validate: (v) => (Number.isFinite(Number(v.apyPercent)) ? '' : 'Enter the rate as a percentage, for example 8.5.'),
    onSubmit: async (v) => {
      const r = await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(x.id)}/apy-rates`, { apyPercent: Number(v.apyPercent), effectiveFromIso: v.effectiveFromIso });
      return r && r.restatedDays ? `${AL.plural(r.restatedDays, 'draft day')} recalculated at the new rate.` : `The new rate applies from ${AL.date(v.effectiveFromIso)}.`;
    },
    after: () => AL.stiReload(),
  });
};
AL.actions['sti-liquidate'] = (el) => {
  const x = AL.stiFind(el.dataset.id); if (!x) return;
  const code = (x.currency && x.currency.code) || '';
  const d = ((AL.cache.sti.data.dash.instruments || []).find((i) => i.instrumentId === x.id)) || {};
  AL.form({
    title: `Liquidate: ${x.name}`, sub: `Carrying value ${AL.money(d.carryingValue, code)} (principal plus accrued interest)`, submitLabel: 'Settle investment', doneTitle: 'Investment settled',
    fields: [
      { k: 'settlementIso', label: 'Settlement date', type: 'date', required: true, max: AL.stiToday(), min: x.startDate.slice(0, 10) },
      { k: 'cashReceived', label: `Cash received (${code})`, type: 'number', step: '0.01', min: 0, required: true, hint: 'Interest is accrued to the settlement date first; any difference from the books is posted to interest income.' },
    ],
    initial: { settlementIso: AL.stiToday(), cashReceived: d.carryingValue != null ? Math.round(Number(d.carryingValue) * 100) / 100 : '' },
    validate: (v) => (Number(v.cashReceived) >= 0 ? '' : 'Enter the cash received.'),
    onSubmit: async (v) => {
      await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(x.id)}/liquidate`, { settlementIso: v.settlementIso, cashReceived: Number(v.cashReceived) });
      return AL.cache.sti.data.settings.postingMode === 'APPROVED' ? 'The settlement is posted to the bank.' : 'The settlement journal is a draft until an approver posts it.';
    },
    after: () => AL.stiReload(),
  });
};
AL.actions['sti-void'] = (el) => {
  const x = AL.stiFind(el.dataset.id); if (!x) return;
  AL.confirm({
    title: `Void ${x.name}`, danger: true, confirmLabel: 'Void investment', doneTitle: 'Investment voided', reason: 'Why it is being voided',
    body: 'For an investment booked in error. Its placement, interest and any settlement are reversed in the ledger; it stays on record as voided.',
    onConfirm: async (v) => { await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(x.id)}/void`, { reason: v.reason }); return 'Its journals are reversed.'; },
    after: () => AL.stiReload(),
  });
};

// ------------------------------------------------------------------------------------------------ accruals and approval
AL.actions['sti-accrue'] = (el) => AL.busy(el, async () => {
  const today = AL.stiToday(); let days = 0; const failed = [];
  for (const x of (AL.cache.sti.data.list || []).filter((i) => i.status === 'ACTIVE')) {
    try { const r = await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(x.id)}/catch-up`, { throughIso: today }); days += Array.isArray(r) ? r.filter((c) => c.outcome === 'created').length : Number((r && r.created) || 0); }
    catch (err) { failed.push(`${x.name}: ${AL.msg(err)}`); }
  }
  await AL.stiReload();
  if (failed.length) throw new Error(failed.join(' · '));
  return days;
}, ['Interest accrued', (days) => (days ? `${AL.plural(days, 'day')} of interest booked.` : 'Every investment was already accrued to today.')]);
AL.actions['sti-approve'] = (el) => AL.busy(el, async () => {
  await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(el.dataset.id)}/accruals/approve-all`, {});
  await AL.stiReload();
}, ['Interest posted', 'The draft interest journals are posted to the ledger.']);
AL.actions['sti-approve-all'] = (el) => AL.busy(el, async () => {
  const ids = [...new Set((AL.cache.sti.data.dash.alerts || []).filter((a) => a.type === 'PENDING_APPROVAL').map((a) => a.instrumentId))];
  const failed = [];
  for (const id of ids) { try { await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(id)}/accruals/approve-all`, {}); } catch (err) { failed.push(AL.msg(err)); } }
  await AL.stiReload();
  if (failed.length) throw new Error(failed[0]);
}, ['Interest posted', 'Every draft interest journal is posted to the ledger.']);
AL.actions['sti-settings'] = () => {
  const s = AL.cache.sti.data.settings || {};
  AL.form({
    title: 'Posting mode', sub: 'How the daily interest journals reach the ledger.', submitLabel: 'Save', doneTitle: 'Posting mode saved',
    fields: [{ k: 'postingMode', label: 'Daily interest journals', type: 'select', blank: false, required: true, options: [{ value: 'DRAFT', label: 'Draft: an approver posts them' }, { value: 'APPROVED', label: 'Posted automatically' }] }],
    initial: { postingMode: s.postingMode || 'DRAFT' },
    onSubmit: async (v) => { await AL.patch('/accounting/short-term-investments/settings', { postingMode: v.postingMode }); return v.postingMode === 'APPROVED' ? 'New interest journals post straight to the ledger.' : 'New interest journals wait for an approver.'; },
    after: () => AL.stiReload(),
  });
};

// ------------------------------------------------------------------------------------------------ one investment
AL.actions['sti-open'] = (el) => AL.busy(el, async () => {
  const x = await AL.get(`/accounting/short-term-investments/instruments/${encodeURIComponent(el.dataset.id)}`);
  const code = (x.currency && x.currency.code) || '';
  const canApprove = AL.can('accounting.treasury.approve');
  const drafts = (x.accruals || []).filter((a) => a.status === 'PENDING_POST').length;
  const foreign = !!x.functionalCurrencyId && x.functionalCurrencyId !== x.currencyId;
  const facts = [
    ['Principal', AL.money(x.principal, code)], ['Start', AL.date(x.startDate)], ['Maturity', x.maturityDate ? AL.date(x.maturityDate) : 'Open-ended'],
    ['Interest method', `${AL.stiCompounding[x.compoundingMethod] || x.compoundingMethod} · ${AL.stiDayCount[x.dayCountConvention] || x.dayCountConvention}`],
    ['Broker', x.broker || '—'], ['Funded from', (x.settlementBank && x.settlementBank.name) || '—'],
  ].map((f) => `<div class="v28-list-item"><div><strong>${ae(f[0])}</strong><span>${ae(f[1])}</span></div></div>`).join('');
  const rates = (x.apyRates || []).map((r) => `<tr><td>${ae(AL.date(r.effectiveFrom))}</td><td>${ae(AL.stiPct(r.apy))}</td><td>${ae(AL.dateTime(r.createdAt))}</td></tr>`).join('');
  const accStatus = { PENDING_POST: ['Draft', 'warn'], POSTED: ['Posted', 'ok'], REVERSED: ['Reversed', 'bad'] };
  const acc = (x.accruals || []).map((a) => { const st = accStatus[a.status] || [a.status, 'info']; return `<tr><td>${ae(AL.date(a.accrualDate))}</td><td>${ae(AL.money(a.amountInstrumentCcy, code))}</td><td>${ae(AL.money(a.runningAccruedBalance, code))}</td>${foreign ? `<td>${a.reportingAmountFunctional != null ? ae(AL.money(a.reportingAmountFunctional)) : 'No rate that day'}</td>` : ''}<td>${ae(AL.stiPct(a.apyRate && a.apyRate.apy))}</td><td>${AL.status(st[0], st[1])}</td></tr>`; }).join('');
  AL.form({
    title: x.name, sub: `${x.category || 'Investment'} · ${code} · ${(AL.stiStatus[x.status] || [x.status])[0]}`, wide: true, submitLabel: drafts && canApprove && x.status === 'ACTIVE' ? `Approve ${AL.plural(drafts, 'draft')}` : 'Close', viewOnly: !(drafts && canApprove && x.status === 'ACTIVE'), fields: [],
    extra: `<div class="al-wide"><div class="v28-grid equal">${facts}</div>
      <h4 style="margin:16px 0 8px">Rate history</h4>${rates ? AL.table(['Effective from', 'Rate (APY)', 'Entered'], rates, '480px') : AL.empty('No rates.')}
      <h4 style="margin:16px 0 8px">Daily interest (latest ${(x.accruals || []).length} of ${(x._count && x._count.accruals) || 0} days)</h4>${acc ? AL.table(['Day', 'Interest', 'Accrued to date', ...(foreign ? ['In reporting currency'] : []), 'Rate', 'Journal'], acc, '720px') : AL.empty('No interest accrued yet.')}</div>`,
    onSubmit: async () => {
      if (!(drafts && canApprove && x.status === 'ACTIVE')) return false;
      AL.formSpec.doneTitle = 'Interest posted';
      await AL.post(`/accounting/short-term-investments/instruments/${encodeURIComponent(x.id)}/accruals/approve-all`, {});
      return 'The draft interest journals are posted to the ledger.';
    },
    after: () => AL.stiReload(),
  });
});
