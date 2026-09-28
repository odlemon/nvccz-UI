/* Command Centre: /accounting — the position today from the ledger: cash per currency and bank, receivables and
 * payables (their control accounts and the documents behind them), revenue and net income for the year against last
 * year, results by month, what is waiting and where, the month being closed, the last integrity check and the latest
 * postings. Data: /accounting/overview. */
AL.page('overview', () => {
  AL.meLoad();
  const e = AL.res('ov', () => AL.get('/accounting/overview'));
  const head = AL.head('Control centre', 'Command Centre', '', [AL.btn('New journal', 'ov-go', '', 'data-page="journals"'), AL.btn('Cash book', 'ov-go', '', 'data-page="cash"'), AL.btn('Financial statements', 'ov-go', 'primary', 'data-page="reports"')].join(''));
  const g = AL.gate(e, { key: 'ov', errorTitle: 'The overview could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const d = e.data, c = d.baseCurrency;
  const pct = (a, b) => (b ? `${a >= b ? '+' : ''}${Math.round(((a - b) / Math.abs(b)) * 100)}% on last year` : 'No figures last year');
  const cashCur = Object.entries(d.cash.byCurrency || {});
  const ar = d.receivables.control, ap = d.payables.control;
  const apCredit = ap ? -ap.debitBalance : 0;
  const ytd = d.results.ytd, ly = d.results.lastYear;
  const kpis = AL.kpis([
    ['Cash and bank', cashCur.length ? cashCur.map(([k, v]) => AL.money(v, k)).join(' · ') : '—', `${d.cash.banks.length} bank account${d.cash.banks.length === 1 ? '' : 's'}`, cashCur.some(([, v]) => v < 0) ? '#d92d20' : undefined],
    ['Receivables', ar ? AL.money(ar.debitBalance, c) : '—', `${d.receivables.openInvoices} open invoice${d.receivables.openInvoices === 1 ? '' : 's'}${d.receivables.overdue ? `, ${d.receivables.overdue} overdue` : ''}`, d.receivables.overdue ? '#f79009' : undefined],
    ['Payables', ap ? AL.money(apCredit, c) : '—', `${d.payables.openBills} approved bill${d.payables.openBills === 1 ? '' : 's'} unpaid${d.payables.dueWithin7Days ? `, ${d.payables.dueWithin7Days} due within 7 days` : ''}`, apCredit < 0 ? '#d92d20' : undefined],
    ['Revenue, year to date', AL.money(ytd.revenue, c), pct(ytd.revenue, ly.revenue), ytd.revenue < 0 ? '#d92d20' : undefined],
    ['Net income, year to date', AL.money(ytd.netIncome, c), pct(ytd.netIncome, ly.netIncome), ytd.netIncome < 0 ? '#d92d20' : '#12b76a'],
  ]);
  const w = d.waiting;
  const waitRows = [
    ['Journals waiting to be posted', w.draftJournals, 'approvals'],
    ['Approval requests (payments, placements, account changes)', w.approvalRequests, 'approvals'],
    ['Bank lines not reconciled', w.unreconciledBankLines, 'reconciliation'],
    ['Invoices overdue', w.overdueInvoices, 'receivables'],
    ['Supplier bills due within 7 days', w.billsDue, 'payables'],
  ].map(([label, count, page]) => `<tr><td>${ae(label)}</td><td class="num">${count ? `<strong>${count}</strong>` : '<span class="v28-sub">0</span>'}</td><td class="al-actions">${count ? AL.btn('Open', 'ov-go', 'small', `data-page="${page}"`) : ''}</td></tr>`).join('');
  const months = d.results.months || [];
  const peak = Math.max(1, ...months.map((m) => Math.max(Math.abs(m.revenue), Math.abs(m.expenses))));
  const bar = (v, cls) => `<span class="al-bar ${cls}" style="width:${Math.round((Math.abs(v) / peak) * 100)}%"></span>`;
  const monthRows = months.map((m) => `<tr><td>${ae(new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }))}</td><td class="num">${ae(AL.money(m.revenue, c))}${bar(m.revenue, m.revenue < 0 ? 'bad' : 'ok')}</td><td class="num">${ae(AL.money(m.expenses, c))}${bar(m.expenses, 'warn')}</td><td class="num"><strong>${ae(AL.money(m.netIncome, c))}</strong></td></tr>`).join('');
  const bankRows = d.cash.banks.map((b) => `<tr><td>${ae(b.bank)}</td><td>${ae(b.currency)}</td><td class="num">${ae(AL.money(b.balance, b.currency))}</td><td>${b.unreconciled ? `${b.unreconciled} not reconciled` : 'Reconciled'}</td></tr>`).join('');
  const recentRows = (d.recent || []).map((j) => `<tr><td><strong>${ae(j.reference.length > 26 ? `${j.reference.slice(0, 26)}…` : j.reference)}</strong></td><td>${ae(AL.date(j.date))}</td><td class="al-wrap">${ae(j.description || '')}</td><td class="num">${ae(AL.money(j.amount, j.currency))}</td><td>${ae(j.by || '')}</td></tr>`).join('');
  const cl = d.close, ig = d.integrity;
  const control = `<tr><td>Month being closed</td><td>${cl ? `${ae(cl.period)} · ${cl.locked ? 'locked' : 'open'}${cl.tasks ? ` · ${cl.complete} of ${cl.tasks} close tasks done` : ' · no close checklist yet'}` : '—'}</td><td class="al-actions">${AL.btn('Period close', 'ov-go', 'small', 'data-page="close"')}</td></tr>
    <tr><td>Ledger integrity</td><td>${ig ? `${ig.status === 'succeeded' ? '<span class="al-ok">Passed</span>' : `<span class="al-bad">${ae(ig.status)}</span>`} · ${ae(AL.dateTime(ig.at))}` : 'Not run yet'}</td><td class="al-actions">${AL.btn('Scheduled jobs', 'ov-go', 'small', 'data-page="jobs"')}</td></tr>`;
  return `<div class="v28-page">${head}${kpis}
    <div class="al-split">${AL.panel('Waiting', '', AL.table(['', 'Count', ''], waitRows, '520px'))}${AL.panel('Close and control', '', AL.table(['', '', ''], control, '520px'))}</div>
    ${AL.panel('Results by month', `${c}, posted journals`, monthRows ? AL.table(['Month', 'Revenue', 'Expenses', 'Net income'], monthRows, '760px') : AL.empty('Nothing posted in the last twelve months.'))}
    <div class="al-split">${AL.panel('Cash by bank', 'Ledger balance of each bank account', bankRows ? AL.table(['Bank account', 'Currency', 'Balance', 'Reconciliation'], bankRows, '560px') : AL.empty('No bank accounts.'))}${AL.panel('Latest postings', '', recentRows ? AL.table(['Journal', 'Date', 'Description', 'Amount', 'By'], recentRows, '640px') : AL.empty('Nothing posted yet.'))}</div>
  </div>`;
});
AL.actions['ov-go'] = (el) => AL.go(el.dataset.page);
