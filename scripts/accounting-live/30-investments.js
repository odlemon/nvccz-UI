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
AL.ui.sti = AL.ui.sti || { tab: 'ACTIVE' };
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
  const { dash, list, settings, today } = e.data;
  const cur = dash.reportingCurrency || 'USD';
  const pf = dash.portfolio || {};
  const alerts = dash.alerts || [];
  const pendingAccruals = alerts.filter((a) => a.type === 'PENDING_APPROVAL');
  const placements = dash.pendingPlacements || [];
  const settlements = alerts.filter((a) => a.type === 'PENDING_SETTLEMENT');
  const active = list.filter((x) => x.status === 'ACTIVE');
  const byId = new Map((dash.instruments || []).map((x) => [x.instrumentId, x]));
  const draftMode = settings.postingMode !== 'APPROVED';

  const actions = [
    canPlace ? AL.btn('New investment', 'sti-new', 'primary') : '',
    canPlace && active.length ? AL.btn('Accrue to today', 'sti-accrue') : '',
    canApprove && pendingAccruals.length ? AL.btn(`Approve ${AL.plural(pendingAccruals.length, 'interest journal')}`, 'sti-approve-all') : '',
    canApprove ? AL.btn('Posting mode', 'sti-settings') : '',
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
  alerts.filter((a) => a.type === 'RATE_CHANGE').forEach((a) => attention.push([AL.status('Rate changed', 'info'), a.instrumentName, a.message.replace('APY schedule updated', 'New rate')]));
  const attentionPanel = attention.length
    ? AL.panel('Needs attention', '', AL.table(['', 'Investment', 'Detail', ''], attention.map((r) => `<tr><td>${r[0]}</td><td><strong>${ae(r[1] || '')}</strong></td><td class="al-wrap">${ae(r[2])}</td><td class="al-actions">${r[3] || ''}</td></tr>`).join(''), '760px'))
    : '';

  // interest earned per day this month, in the reporting currency
  const days = dash.dailyYieldInMonth || [];
  const peak = Math.max(0, ...days.map((d) => Math.abs(Number(d.amountSum) || 0)));
  const bars = peak > 0
    ? `<div class="al-bars" role="img" aria-label="Interest earned per day this month">${days.map((d) => { const v = Number(d.amountSum) || 0; const h = Math.max(2, Math.round((Math.abs(v) / peak) * 100)); return `<div class="al-bar${v < 0 ? ' neg' : ''}${v === 0 ? ' zero' : ''}" style="--h:${v === 0 ? 0 : h}%" title="${ae(AL.date(d.accrualDate))}: ${ae(AL.money(v, cur))}"></div>`; }).join('')}</div><div class="al-bars-axis"><span>${ae(AL.date(days[0] && days[0].accrualDate))}</span><span>${ae(AL.date(days[days.length - 1] && days[days.length - 1].accrualDate))}</span></div>`
    : AL.empty('No interest accrued yet this month.');
  const yieldPanel = AL.panel('Interest earned this month', `Per day, in ${cur}. Peak day ${AL.money(peak, cur)}.`, bars);

  // cash coming back, by when the investment matures
  const openEnded = (dash.instruments || []).filter((x) => !x.maturityDate).reduce((s, x) => s + (Number(x.carryingValueReporting) || 0), 0);
  const ladder = [['Within 30 days', mb.within30Days], ['31 to 60 days', mb.days31to60], ['61 to 90 days', mb.days61to90], ['Over 90 days', mb.over90Days], ['No maturity date', openEnded]];
  const ladderPanel = AL.panel('Liquidity forecast', `Expected value at maturity, in ${cur}.`, AL.table(['When it comes back', 'Expected cash'], ladder.map((r) => `<tr><td>${ae(r[0])}</td><td>${ae(AL.money(r[1], cur))}</td></tr>`).join(''), '360px'));

  // the register
  const tab = AL.ui.sti.tab;
  const counts = { ACTIVE: 0, SETTLED: 0, VOIDED: 0 };
  list.forEach((x) => { counts[x.status] = (counts[x.status] || 0) + 1; });
  const tabs = `<div class="v28-tabbar">${[['ACTIVE', 'Active'], ['SETTLED', 'Settled'], ['VOIDED', 'Voided'], ['ALL', 'All']].map(([id, label]) => `<button class="v28-tab ${tab === id ? 'active' : ''}" data-al="sti-tab" data-tab="${id}">${ae(label)} <span class="v28-sub" style="display:inline">${id === 'ALL' ? list.length : counts[id] || 0}</span></button>`).join('')}</div>`;
  const shown = list.filter((x) => tab === 'ALL' || x.status === tab);
  const rows = shown.map((x) => {
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
  const register = AL.panel('Investment register', '', `${tabs}${shown.length ? AL.table(['Investment', 'Broker', 'Currency', 'Principal', 'Rate (APY)', 'Accrued interest', 'Carrying value', 'Maturity', 'Status', ''], rows, '1280px') : AL.empty(tab === 'ACTIVE' ? 'No active investments.' : 'None here.')}`);

  // settled: what came back against what the books expected
  const variance = (dash.settlementVariance || []).filter((v) => v.varianceInstrumentCcy != null && Math.abs(v.varianceInstrumentCcy) >= 0.01);
  const variancePanel = variance.length
    ? AL.panel('Settlement differences', 'Cash received against principal plus accrued interest; the difference was posted to interest income.', AL.table(['Investment', 'Settled', 'Expected', 'Received', 'Difference'], variance.map((v) => `<tr><td><strong>${ae(v.instrumentName)}</strong></td><td>${ae(AL.date(v.settlementDate))}</td><td>${ae(AL.money(v.expectedSettledAmountInstrumentCcy))}</td><td>${ae(AL.money(v.actualSettledAmountInstrumentCcy))}</td><td>${ae(AL.money(v.varianceInstrumentCcy))}</td></tr>`).join(''), '720px'))
    : '';

  return `<div class="v28-page">${head}${kpis}${attentionPanel}<div class="v28-grid two"><div>${yieldPanel}</div><div>${ladderPanel}</div></div>${register}${variancePanel}</div>`;
});

AL.actions['sti-tab'] = (el) => { AL.ui.sti.tab = el.dataset.tab; AL.redraw(); };
AL.actions['sti-queue'] = () => AL.go('approvals');
AL.actions['sti-journals'] = () => AL.go('journals');

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
