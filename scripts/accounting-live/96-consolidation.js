/* Group Consolidation: /accounting/consolidation — each active entity's balance sheet and year-to-date results from its
 * own posted journals, the journals flagged as eliminations netted at group level, and the consolidated position in the
 * chosen currency (other currencies translated at the rate stored for the as-of date, shown per account). Data:
 * /accounting/consolidation/summary, /accounting/balance-sheet/consolidated. */
AL.ui.cons = AL.ui.cons || { asOf: '', cur: '' };
AL.page('consolidation', () => {
  AL.meLoad();
  const u = AL.ui.cons;
  const cur = AL.res('cons-cur', () => AL.get('/accounting/currencies'));
  const head = AL.head('Reporting and compliance', 'Group Consolidation', '');
  const g0 = AL.gate(cur, { key: 'cons-cur' });
  if (g0) return `<div class="v28-page">${head}${g0}</div>`;
  const currencies = (cur.data || []).filter((c) => c.isActive !== false);
  const base = currencies.find((c) => c.isDefault) || currencies[0] || {};
  const curId = u.cur || base.id, code = (currencies.find((c) => c.id === curId) || {}).code || '';
  const asOf = u.asOf || AL.stiToday(), from = `${asOf.slice(0, 4)}-01-01`;
  const sKey = `cons:${asOf}:${curId}`, bKey = `cons-bs:${asOf}:${curId}`;
  const s = AL.res(sKey, () => AL.get(`/accounting/consolidation/summary?asOfDate=${asOf}&periodStart=${from}&periodEnd=${asOf}&consolidationCurrencyId=${encodeURIComponent(curId)}`));
  const b = AL.res(bKey, () => AL.post('/accounting/balance-sheet/consolidated', { asOfDate: asOf, consolidationCurrencyId: curId }));
  const filters = `<div class="al-filters"><label class="v28-field"><span>As of</span><input class="v28-input" type="date" data-cons-f="asOf" value="${ae(asOf)}"></label><label class="v28-field"><span>Currency</span><select class="v28-select" data-cons-f="cur">${currencies.map((c) => `<option value="${ae(c.id)}"${c.id === curId ? ' selected' : ''}>${ae(c.code)}</option>`).join('')}</select></label></div>`;
  const g = AL.gate(s, { key: sKey, errorTitle: 'The consolidation could not be produced' });
  if (g) return `<div class="v28-page">${head}${filters}${g}</div>`;
  const d = s.data || {}, ents = d.entities || [], el = d.eliminations || {}, c = d.consolidated || {};
  const bal = Math.round(((c.totalAssets || 0) - (c.totalLiabilities || 0) - (c.totalEquity || 0)) * 100) / 100;
  const kpis = AL.kpis([
    ['Entities', String(ents.length), ents.length === 1 ? 'One entity: the group is that entity' : 'Active entities'],
    ['Consolidated assets', AL.money(c.totalAssets, code), `After ${AL.money(el.totalAssets || 0, code)} eliminated`],
    ['Net income, year to date', AL.money(c.netIncome, code), `${AL.date(from)} – ${AL.date(asOf)}`, (c.netIncome || 0) < 0 ? '#d92d20' : '#12b76a'],
    ['Balance check', Math.abs(bal) < 0.01 ? 'Balances' : AL.money(bal, code), 'Assets = liabilities + equity', Math.abs(bal) < 0.01 ? '#12b76a' : '#d92d20'],
  ]);
  const row = (name, x, cls = '') => `<tr class="${cls}"><td>${name}</td><td class="num">${ae(AL.money(x.totalAssets, code))}</td><td class="num">${ae(AL.money(x.totalLiabilities, code))}</td><td class="num">${ae(AL.money(x.totalEquity, code))}</td><td class="num">${ae(AL.money(x.revenue, code))}</td><td class="num">${ae(AL.money(x.expenses, code))}</td><td class="num">${ae(AL.money(x.netIncome, code))}</td></tr>`;
  const rows = ents.map((e) => row(`<strong>${ae(e.entityName)}</strong>${e.balanceSheet && e.balanceSheet.isBalanced === false ? '<span class="v28-sub al-bad">Does not balance</span>' : ''}`, { ...e.balanceSheet, ...e.incomeStatement })).join('')
    + row('Eliminations', el, 'al-muted') + row('<strong>Consolidated</strong>', c, 'al-total');
  let detail = '';
  if (b.state === 'ok' && b.data) {
    const bs = b.data;
    const lines = [];
    const acc = (list) => (list || []).filter((a) => Math.abs(a.balance) >= 0.005).forEach((a) => lines.push(`<tr><td>${ae(`${a.accountNo} ${a.accountName}`.trim())}</td><td class="num">${ae(AL.money(a.balance, code))}</td><td class="al-wrap v28-sub">${ae((a.currencyBreakdown || []).filter((x) => x.sourceCurrency !== code).map((x) => `${x.sourceCurrency} ${Number(x.sourceAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} at ${x.conversionRate}`).join(' · '))}</td></tr>`));
    const sec = (label, total) => lines.push(`<tr class="al-total"><td><strong>${ae(label)}</strong></td><td class="num"><strong>${ae(AL.money(total, code))}</strong></td><td></td></tr>`);
    acc(bs.assets.cashAndCashEquivalents && bs.assets.cashAndCashEquivalents.breakdown); acc(bs.assets.currentAssets.accounts); acc(bs.assets.fixedAssets.accounts); acc(bs.assets.otherAssets.accounts); sec('Total assets', bs.assets.totalAssets);
    acc(bs.liabilities.currentLiabilities.accounts); acc(bs.liabilities.longTermLiabilities.accounts); sec('Total liabilities', bs.liabilities.totalLiabilities);
    acc(bs.equity.accounts); sec('Total equity', bs.equity.total);
    const rates = (bs.exchangeRates || []).filter((r) => r.currencyCode !== code).map((r) => `${r.currencyCode} at ${r.rate}`).join(' · ');
    detail = AL.panel('Consolidated balance sheet', rates ? `Translated to ${code}: ${rates}` : `In ${code}`, AL.table(['Account', 'Balance', 'From'], lines.join(''), '860px'));
  } else detail = AL.gate(b, { key: bKey, errorTitle: 'The consolidated balance sheet could not be produced' }) || '';
  return `<div class="v28-page">${head}${filters}${kpis}${AL.panel('Entities', `Balance sheet at ${AL.date(asOf)}; results ${AL.date(from)} – ${AL.date(asOf)}`, AL.table(['Entity', 'Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses', 'Net income'], rows, '1080px'))}${detail}</div>`;
});
AL.wire.consolidation = () => { document.querySelectorAll('[data-cons-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('change', () => { AL.ui.cons[el.dataset.consF] = el.value; AL.redraw(); }); }); };
