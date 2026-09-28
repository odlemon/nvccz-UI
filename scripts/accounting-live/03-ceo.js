/* CEO View: /accounting/ceo — the executive summary of the same ledger figures as the Command Centre: liquidity (bank
 * balances per currency plus short-term investments at carrying value), results for the year against last year, what
 * is owed each way, each entity's contribution, results by month and what is waiting on a decision. Read-only; each
 * figure opens the page that holds it. Data: /accounting/overview, /accounting/consolidation/summary,
 * /accounting/short-term-investments/dashboard. */
AL.page('ceo', () => {
  AL.meLoad();
  const ov = AL.res('ov', () => AL.get('/accounting/overview'));
  const sti = AL.res('ceo-sti', () => AL.get(`/accounting/short-term-investments/dashboard?asOfIso=${AL.stiToday()}`).catch(() => null));
  const today = AL.stiToday();
  const cons = AL.res('ceo-cons', () => AL.get(`/accounting/consolidation/summary?asOfDate=${today}&periodStart=${today.slice(0, 4)}-01-01&periodEnd=${today}`).catch(() => null));
  const head = AL.head('Control centre', 'CEO View', '', AL.btn('Financial statements', 'ov-go', 'primary', 'data-page="reports"'));
  const g = AL.gate(ov, { key: 'ov', errorTitle: 'The figures could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const d = ov.data, c = d.baseCurrency, ytd = d.results.ytd, ly = d.results.lastYear;
  const cash = d.cash.byCurrency || {};
  const invest = sti.state === 'ok' && sti.data ? sti.data.portfolio || {} : null;
  const baseCash = cash[c] || 0;
  const liquidity = baseCash + (invest ? Number(invest.carryingTotal || 0) : 0);
  const margin = ytd.revenue > 0 ? `${Math.round((ytd.netIncome / ytd.revenue) * 1000) / 10}% of revenue` : ytd.revenue < 0 ? 'Revenue is negative' : 'No revenue';
  const vs = (a, b) => (b ? `${a >= b ? 'Up' : 'Down'} ${AL.money(Math.abs(a - b), c)} on last year` : 'Nothing to compare last year');
  const ar = d.receivables.control, ap = d.payables.control;
  const decisions = d.waiting.draftJournals + d.waiting.approvalRequests;
  const kpis = AL.kpis([
    ['Liquidity', AL.money(liquidity, c), `Bank ${AL.money(baseCash, c)}${invest ? ` + investments ${AL.money(invest.carryingTotal, c)}` : ''}${Object.keys(cash).filter((k) => k !== c).map((k) => ` · ${AL.money(cash[k], k)} apart`).join('')}`, liquidity < 0 ? '#d92d20' : '#12b76a'],
    [ytd.netIncome >= 0 ? 'Profit, year to date' : 'Loss, year to date', AL.money(Math.abs(ytd.netIncome), c), margin, ytd.netIncome < 0 ? '#d92d20' : '#12b76a'],
    ['Revenue, year to date', AL.money(ytd.revenue, c), vs(ytd.revenue, ly.revenue), ytd.revenue < 0 ? '#d92d20' : undefined],
    ['Owed to us / by us', `${ar ? AL.money(ar.debitBalance, c) : '—'} / ${ap ? AL.money(-ap.debitBalance, c) : '—'}`, `${d.receivables.overdue} invoices overdue · ${d.payables.dueWithin7Days} bills due in 7 days`],
    ['Waiting on a decision', String(decisions), `${d.waiting.draftJournals} journals, ${d.waiting.approvalRequests} approval requests`, decisions ? '#f79009' : '#12b76a'],
  ]);
  const ents = cons.state === 'ok' && cons.data ? cons.data.entities || [] : [];
  const entRows = ents.map((e) => { const i = e.incomeStatement || {}, b = e.balanceSheet || {}; return `<tr><td><strong>${ae(e.entityName)}</strong></td><td class="num">${ae(AL.money(i.revenue, c))}</td><td class="num">${ae(AL.money(i.netIncome, c))}</td><td class="num">${i.revenue > 0 ? `${Math.round((i.netIncome / i.revenue) * 1000) / 10}%` : '—'}</td><td class="num">${ae(AL.money(b.totalAssets, c))}</td><td class="num">${ae(AL.money(b.totalEquity, c))}</td></tr>`; }).join('');
  const months = (d.results.months || []).map((m) => `<tr><td>${ae(new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }))}</td><td class="num">${ae(AL.money(m.revenue, c))}</td><td class="num">${ae(AL.money(m.expenses, c))}</td><td class="num"><strong>${ae(AL.money(m.netIncome, c))}</strong></td></tr>`).join('');
  const invRows = invest && sti.data.instruments && sti.data.instruments.length ? sti.data.instruments.slice(0, 8).map((i) => `<tr><td>${ae(i.name || i.reference || '')}</td><td class="num">${ae(AL.money(i.principal, i.currency))}</td><td class="num">${ae(AL.money(i.accruedInterest ?? i.accruedToDate ?? 0, i.currency))}</td><td>${ae(AL.date(i.maturityDate))}</td></tr>`).join('') : '';
  return `<div class="v28-page">${head}${kpis}
    ${AL.panel('Entities', `Year to date, ${c}`, entRows ? AL.table(['Entity', 'Revenue', 'Net income', 'Margin', 'Assets', 'Equity'], entRows, '860px') : AL.gate(cons, { key: 'ceo-cons' }) || AL.empty('No entities.'))}
    <div class="al-split">${AL.panel('Results by month', c, months ? AL.table(['Month', 'Revenue', 'Expenses', 'Net income'], months, '560px') : AL.empty('Nothing posted in the last twelve months.'))}${AL.panel('Short-term investments', invest ? `${AL.money(invest.principalTotal, c)} placed · ${AL.money(invest.accruedInterestTotal, c)} interest accrued` : '', invRows ? AL.table(['Investment', 'Principal', 'Interest accrued', 'Matures'], invRows, '560px') : AL.empty('No active investments.'), AL.btn('Investments', 'ov-go', 'small', 'data-page="investments"'))}</div>
  </div>`;
});
