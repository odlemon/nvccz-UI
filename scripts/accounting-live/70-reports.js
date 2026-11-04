/* Trial Balance, Financial Statements (the Financial Reports item; titled so an older layer's fixed 'multi-currency
 * reporting' panel, keyed on the title 'Financial Reports', is not injected) and General Ledger — from the server's statements (/accounting/trial-balance,
 * /income-statement, /balance-sheet, /cash-flow, /gl-ledger-detail), not recomputed in the browser from the first
 * 1,000 journals as before. Reports are per currency (FINDINGS FX-01): the base currency by default. */
AL.ui.rep = AL.ui.rep || { tab: 'is', from: '', to: '', asOf: '', cur: '' };
AL.ui.tb = AL.ui.tb || { asOf: '', cur: '' };
AL.ui.gl = AL.ui.gl || { acct: '', from: '', to: '' };
AL.repCur = () => AL.res('rep-cur', async () => { const c = await AL.get('/accounting/currencies'); return (c || []).filter((x) => x.isActive !== false); });
AL.repBase = () => { const c = AL.repCur(); return (c.data || []).find((x) => x.isDefault) || (c.data || [])[0] || null; };
AL.yearStart = () => `${AL.stiToday().slice(0, 4)}-01-01`;
AL.curPicker = (key, sel) => { const c = AL.repCur().data || []; return `<label class="v28-field"><span>Currency</span><select class="v28-select" data-rep-f="${key}">${c.map((x) => `<option value="${ae(x.id)}"${x.id === sel ? ' selected' : ''}>${ae(x.code)}</option>`).join('')}</select></label>`; };
AL.csv = (name, rows) => { const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };

// ------------------------------------------------------------------------------------------------ trial balance
AL.page('trialbalance', () => {
  AL.meLoad();
  const cur = AL.repCur();
  if (cur.state !== 'ok') return `<div class="v28-page">${AL.head('Reporting', 'Trial Balance', '')}${AL.gate(cur, { key: 'rep-cur' }) || ''}</div>`;
  const u = AL.ui.tb; const base = AL.repBase();
  const asOf = u.asOf || AL.stiToday(), curId = u.cur || (base && base.id);
  const code = ((cur.data || []).find((x) => x.id === curId) || {}).code || '';
  const e = AL.res(`tb:${asOf}:${curId}`, () => AL.get(`/accounting/trial-balance?asOfDate=${asOf}&currencyId=${curId}`));
  const head = AL.head('Reporting', 'Trial Balance', `Posted journals in ${code} to ${AL.date(asOf)}.`, AL.btn('Export CSV', 'tb-csv'));
  const filters = `<div class="al-filters"><label class="v28-field"><span>As of</span><input class="v28-input" type="date" data-rep-f="tb-asOf" value="${ae(asOf)}" max="${ae(AL.stiToday())}"></label>${AL.curPicker('tb-cur', curId)}</div>`;
  const g = AL.gate(e, { errorTitle: 'The trial balance could not be produced' });
  if (g) return `<div class="v28-page">${head}${filters}${g}</div>`;
  const rows = (e.data.accounts || []).map((a) => ({ ...a, net: Math.round((Number(a.debitBalance || 0) - Number(a.creditBalance || 0)) * 100) / 100 })).filter((a) => Math.abs(a.net) >= 0.005).sort((a, b) => String(a.accountNo).localeCompare(String(b.accountNo)));
  const dr = rows.reduce((t, a) => t + Math.max(a.net, 0), 0), cr = rows.reduce((t, a) => t + Math.max(-a.net, 0), 0);
  const diff = Math.round((dr - cr) * 100) / 100;
  AL.tbRows = rows.map((a) => [a.accountNo, a.accountName, a.accountType, a.net > 0 ? a.net : '', a.net < 0 ? -a.net : '']);
  const kpis = AL.kpis([
    ['Debits', AL.money(dr, code), `${rows.filter((a) => a.net > 0).length} accounts`],
    ['Credits', AL.money(cr, code), `${rows.filter((a) => a.net < 0).length} accounts`],
    ['Difference', AL.money(diff, code), diff === 0 ? 'The ledger balances' : 'Posted journals do not balance: see Scheduled Jobs → Ledger integrity check', diff === 0 ? '#12b76a' : '#d92d20'],
  ]);
  const tr = rows.map((a) => `<tr data-al="tb-drill" data-no="${ae(a.accountNo)}" class="al-click"><td><strong>${ae(a.accountNo)}</strong></td><td>${ae(a.accountName)}</td><td>${ae(a.accountType)}</td><td>${a.net > 0 ? ae(AL.money(a.net, code)) : ''}</td><td>${a.net < 0 ? ae(AL.money(-a.net, code)) : ''}</td></tr>`).join('');
  const table = tr ? AL.table(['Account', 'Name', 'Type', 'Debit', 'Credit'], `${tr}<tr class="al-total"><td colspan="3"><strong>Total</strong></td><td><strong>${ae(AL.money(dr, code))}</strong></td><td><strong>${ae(AL.money(cr, code))}</strong></td></tr>`, '820px') : AL.empty('Nothing posted yet.');
  return `<div class="v28-page">${head}${filters}${kpis}${AL.panel('Balances', '', table)}</div>`;
});
AL.actions['tb-csv'] = () => AL.csv(`trial-balance-${AL.ui.tb.asOf || AL.stiToday()}.csv`, [['Account', 'Name', 'Type', 'Debit', 'Credit'], ...(AL.tbRows || [])]);
// Drilling a trial-balance account opens the restored legacy General Ledger; hand it the account and range so the
// React screen can prefill its filters (window.__AC52_GL_DRILL__ is read by components/accounting/general-ledger.tsx).
AL.actions['tb-drill'] = (el) => { AL.ui.gl.acct = el.dataset.no; AL.ui.gl.from = AL.yearStart(); AL.ui.gl.to = AL.ui.tb.asOf || AL.stiToday(); window.__AC52_GL_DRILL__ = { accountNo: AL.ui.gl.acct, from: AL.ui.gl.from, to: AL.ui.gl.to }; AL.go('ledger'); };

// ------------------------------------------------------------------------------------------------ general ledger
// The General Ledger is the established legacy React screen (components/accounting/general-ledger.tsx), restored in
// full — grouped journal register, advanced filters, create/view drawers, trial-balance tab — talking to accountingApi
// as it did before. The V52 shell stays (nav rail, topbar, app switcher); this page is only a mount point that
// accounting-v52-app.tsx portals the React component into, the same way the Command Centre portals its legacy dashboard.
AL.page('ledger', () => `<div class="v28-page"><div id="ac52LegacyLedgerSlot" class="ac52-legacy-mount"></div></div>`);

// ------------------------------------------------------------------------------------------------ financial statements
AL.page('reports', () => '<div class="v28-page"><div id="ac52LegacyReportsSlot" class="ac52-legacy-mount"></div></div>');
/* Previous live statements implementation retained below for reference.
AL.page('reports', () => {
  AL.meLoad();
  const cur = AL.repCur();
  if (cur.state !== 'ok') return `<div class="v28-page">${AL.head('Reporting', 'Financial Statements', '')}${AL.gate(cur, { key: 'rep-cur' }) || ''}</div>`;
  const u = AL.ui.rep; const base = AL.repBase();
  const curId = u.cur || (base && base.id), code = ((cur.data || []).find((x) => x.id === curId) || {}).code || '';
  const from = u.from || AL.yearStart(), to = u.to || AL.stiToday(), asOf = u.asOf || AL.stiToday();
  const t = u.tab;
  const tabs = `<div class="v28-tabbar">${[['is', 'Income statement'], ['bs', 'Balance sheet'], ['cf', 'Cash flow']].map(([id, label]) => `<button class="v28-tab ${t === id ? 'active' : ''}" data-al="rep-tab" data-tab="${id}">${ae(label)}</button>`).join('')}</div>`;
  const filters = `<div class="al-filters">${t === 'bs' ? `<label class="v28-field"><span>As of</span><input class="v28-input" type="date" data-rep-f="rep-asOf" value="${ae(asOf)}"></label>` : `<label class="v28-field"><span>From</span><input class="v28-input" type="date" data-rep-f="rep-from" value="${ae(from)}"></label><label class="v28-field"><span>To</span><input class="v28-input" type="date" data-rep-f="rep-to" value="${ae(to)}"></label>`}${AL.curPicker('rep-cur', curId)}</div>`;
  const head = AL.head('Reporting', 'Financial Statements', `From posted journals in ${code}.`, AL.btn('Export CSV', 'rep-csv'));
  const url = t === 'is' ? `/accounting/income-statement?startDate=${from}&endDate=${to}&currencyId=${curId}` : t === 'bs' ? `/accounting/balance-sheet?asOfDate=${asOf}&currencyId=${curId}` : `/accounting/cash-flow?startDate=${from}&endDate=${to}&currencyId=${curId}`;
  const e = AL.res(`rep:${url}`, () => AL.get(url));
  const g = AL.gate(e, { errorTitle: 'The statement could not be produced' });
  if (g) return `<div class="v28-page">${head}${AL.panel('Statement', '', `${tabs}${filters}${g}`)}</div>`;
  const d = e.data;
  const out = []; // [label, amount, level]
  const acctLines = (list, key = 'netAmount') => (list || []).filter((a) => Math.abs(Number(a[key] ?? a.balance ?? a.amount ?? 0)) >= 0.005).map((a) => [`${a.accountNo} ${a.accountName}`, Number(a[key] ?? a.balance ?? a.amount ?? 0), 2]);
  if (t === 'is') {
    for (const [k, s] of Object.entries(d.sections || {})) { if (!s || (!(s.accounts || []).length && !Number(s.total))) continue; out.push([s.label || k, null, 0], ...acctLines(s.accounts), [`Total ${String(s.label || k).toLowerCase()}`, Number(s.total || 0), 1]); }
    out.push(['Net income before tax', d.totals.netIncomeBeforeTaxes, 1], ['Net income', d.totals.netIncome, 0]);
  } else if (t === 'bs') {
    const A = d.assets || {}, L = d.liabilities || {}, E = d.equity || {};
    out.push(['Assets', null, 0]);
    if (A.cashAndCashEquivalents) out.push(...(A.cashAndCashEquivalents.breakdown || []).filter((x) => Math.abs(Number(x.balance)) >= 0.005).map((x) => [`${x.accountNo} ${x.accountName}`, Number(x.balance), 2]), ['Cash and cash equivalents', A.cashAndCashEquivalents.total, 1]);
    for (const [k, label] of [['currentAssets', 'Current assets'], ['fixedAssets', 'Non-current assets'], ['otherAssets', 'Other assets']]) if (A[k] && (A[k].accounts || []).length) out.push(...acctLines(A[k].accounts, 'balance'), [label, A[k].total, 1]);
    out.push(['Total assets', A.totalAssets, 0], ['Liabilities', null, 0]);
    for (const [k, label] of [['currentLiabilities', 'Current liabilities'], ['longTermLiabilities', 'Long-term liabilities']]) if (L[k] && (L[k].accounts || []).length) out.push(...acctLines(L[k].accounts, 'balance'), [label, L[k].total, 1]);
    out.push(['Total liabilities', L.totalLiabilities, 0], ['Equity', null, 0], ...acctLines(E.accounts, 'balance'), ['Retained earnings', E.retainedEarnings, 2], ['Total equity', E.total, 1], ['Total liabilities and equity', d.totalLiabilitiesAndEquity, 0]);
  } else {
    for (const [k, label] of [['operatingActivities', 'Operating activities'], ['investingActivities', 'Investing activities'], ['financingActivities', 'Financing activities']]) { const s = d[k] || {}; out.push([label, null, 0], ...(s.lineItems || []).filter((x) => Math.abs(Number(x.netAmount ?? x.amount)) >= 0.005).map((x) => [`${x.accountNo} ${x.accountName}`, Number(x.netAmount ?? x.amount), 2]), [`Net cash from ${label.toLowerCase()}`, s.total, 1]); }
    out.push(['Net change in cash', d.netCashFlow, 0], ['Cash at the start', d.beginningCashBalance, 1], ['Cash at the end', d.endingCashBalance, 0]);
  }
  AL.repRows = out.map((r) => [r[0], r[1] == null ? '' : r[1]]);
  const check = t === 'bs' ? `<div class="al-state ${d.isBalanced ? '' : 'al-error'}" role="status"><strong>${d.isBalanced ? 'Assets equal liabilities plus equity' : `Out of balance by ${ae(AL.money(d.difference, code))}`}</strong></div>` : '';
  const tr = out.map((r) => `<tr class="al-lvl${r[2]}"><td>${r[2] === 2 ? '<span class="al-indent"></span>' : ''}${r[2] < 2 ? `<strong>${ae(r[0])}</strong>` : ae(r[0])}</td><td>${r[1] == null ? '' : r[2] < 2 ? `<strong>${ae(AL.money(r[1], code))}</strong>` : ae(AL.money(r[1], code))}</td></tr>`).join('');
  return `<div class="v28-page">${head}${AL.panel(t === 'is' ? `Income statement ${AL.date(from)} – ${AL.date(to)}` : t === 'bs' ? `Balance sheet at ${AL.date(asOf)}` : `Cash flow ${AL.date(from)} – ${AL.date(to)}`, '', `${tabs}${filters}${check}${AL.table(['', code], tr, '640px')}`)}</div>`;
});
*/
AL.actions['rep-tab'] = (el) => { AL.ui.rep.tab = el.dataset.tab; AL.redraw(); };
AL.actions['rep-csv'] = () => AL.csv(`${{ is: 'income-statement', bs: 'balance-sheet', cf: 'cash-flow' }[AL.ui.rep.tab]}.csv`, [['Line', 'Amount'], ...(AL.repRows || [])]);
AL.wire.reports = AL.wire.trialbalance = AL.wire.ledger = () => {
  document.querySelectorAll('[data-rep-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    el.addEventListener('change', () => {
      const [scope, k] = el.dataset.repF.split('-');
      const tgt = scope === 'tb' ? AL.ui.tb : scope === 'gl' ? AL.ui.gl : AL.ui.rep;
      tgt[k] = el.value; AL.redraw();
    });
  });
};
