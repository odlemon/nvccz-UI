/* Audit Trail: /accounting/audit — every recorded change to an accounting record and every period-lock action, newest
 * first: who, when, the record, what changed (before → after) and why. Filter by area, action, person, dates or a
 * reference; export what is shown (the export is itself recorded); check that no journal has been removed from the
 * numbered sequence and every posted journal balances. Data: /accounting/audit, /accounting/audit/export,
 * /accounting/audit/integrity. */
AL.ui.aud = AL.ui.aud || { area: '', action: '', userId: '', from: '', to: '', q: '', page: 1 };
AL.audQuery = () => { const u = AL.ui.aud; return ['area', 'action', 'userId', 'from', 'to', 'q'].filter((k) => u[k]).map((k) => `${k}=${encodeURIComponent(u[k])}`).join('&'); };
AL.audKey = () => `aud:${AL.audQuery()}:${AL.ui.aud.page}`;
AL.audLoad = () => AL.res(AL.audKey(), () => AL.get(`/accounting/audit?${AL.audQuery()}&page=${AL.ui.aud.page}&limit=50`));
AL.audReload = () => { Object.keys(AL.cache).filter((k) => k.startsWith('aud:')).forEach((k) => delete AL.cache[k]); AL.redraw(); };
AL.AUD_ACTIONS = [['CREATE', 'Created'], ['UPDATE', 'Changed'], ['DELETE', 'Deleted'], ['POST', 'Posted'], ['VOID', 'Voided'], ['SUBMIT', 'Submitted'], ['APPROVE', 'Approved'], ['REJECT', 'Rejected'], ['SEND', 'Sent'], ['PAYMENT', 'Payment'], ['CHANGE_REQUESTED', 'Change requested'], ['CHANGE_APPROVED', 'Change approved'], ['RATE_SET', 'Rate set'], ['SET_FX_RATE', 'Rate set'], ['COMMIT_MODULE_LOCK', 'Period locked'], ['UNLOCK_MODULE', 'Period unlocked'], ['JOURNAL_POST', 'Posted']];
AL.audActionLabel = (a) => { const hit = AL.AUD_ACTIONS.find((x) => x[0] === a); return hit ? hit[1] : String(a || '').toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()); };
AL.audTypeLabel = { JournalEntry: 'Journal', ForexGainLoss: 'FX gain / loss', ChartOfAccounts: 'Account', CashbookEntry: 'Cashbook line', CASHBOOK_ENTRY: 'Cashbook line', CASHBOOK_TRANSFER: 'Bank transfer', CashbookBatch: 'Cashbook batch', CashbookAudit: 'Cashbook', CashbookReconciliationSession: 'Reconciliation', BankStatementImport: 'Bank statement', BankStatementItem: 'Statement line', BankReconciliationAutoMatch: 'Auto-match', Invoice: 'Invoice', CreditNote: 'Credit note', PurchaseInvoice: 'Supplier bill', Expense: 'Expense', Asset: 'Fixed asset', DepreciationRecord: 'Depreciation', ShortTermInvestmentInstrument: 'Investment', ShortTermInvestmentApyRate: 'Investment rate', ShortTermInvestmentAccrualCatchUp: 'Interest catch-up', ShortTermInvestmentSettings: 'Investment settings', ExchangeRate: 'Exchange rate', InventoryItem: 'Stock item', StockMovement: 'Stock movement', RecurringJournalTemplate: 'Recurring journal', PeriodLock: 'Period' };
/** What changed, in words: "Name: old → new" for each field that differs; a creation or deletion by its main fields. */
AL.audDetail = (e) => {
  const o = e.oldValues && typeof e.oldValues === 'object' ? e.oldValues : {}, n = e.newValues && typeof e.newValues === 'object' ? e.newValues : {};
  const skip = /^(id|createdAt|updatedAt|createdById|updatedById|userId|password|token|journalEntryLines|lines|currency|chartOfAccount)$/;
  const words = (k) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
  const val = (v) => (v == null || v === '' ? '—' : typeof v === 'object' ? (Array.isArray(v) ? `${v.length} item${v.length === 1 ? '' : 's'}` : '…') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : /^\d{4}-\d{2}-\d{2}T/.test(String(v)) ? AL.date(v) : String(v).slice(0, 60));
  const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])].filter((k) => !skip.test(k) && k !== 'reason');
  const changed = keys.filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]) && (k in n));
  const parts = (Object.keys(o).length && Object.keys(n).length ? changed.map((k) => `${words(k)}: ${val(o[k])} → ${val(n[k])}`) : keys.filter((k) => typeof (Object.keys(n).length ? n : o)[k] !== 'object').slice(0, 5).map((k) => `${words(k)}: ${val((Object.keys(n).length ? n : o)[k])}`));
  return parts.slice(0, 5).join(' · ') + (parts.length > 5 ? ` · +${parts.length - 5} more` : '');
};

AL.page('audit', () => {
  AL.meLoad();
  const e = AL.audLoad();
  const head = AL.head('Reporting and compliance', 'Audit Trail', 'Every change to an accounting record, with who made it, when and what it was before.', [AL.btn('Check integrity', 'aud-check'), AL.btn('Export CSV', 'aud-export', 'primary')].join(''));
  const g = AL.gate(e, { key: AL.audKey(), errorTitle: 'The audit trail could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const d = e.data || {}, items = d.items || [], u = AL.ui.aud;
  const integ = AL.cache['aud-int'];
  const iv = integ && integ.data;
  const kpis = AL.kpis([
    ['Events', (d.total || 0).toLocaleString('en-US'), AL.audQuery() ? 'Matching the filters' : 'All accounting records'],
    ['Shown', items.length ? `${(u.page - 1) * 50 + 1}–${(u.page - 1) * 50 + items.length}` : '0', `Page ${u.page} of ${Math.max(1, Math.ceil((d.total || 0) / 50))}`],
    ['Journal numbering', iv ? (iv.ok ? 'Intact' : 'Exceptions') : '—', iv ? (iv.ok ? `${iv.journals.toLocaleString('en-US')} journals, ${iv.first}–${iv.last}` : [iv.missingCount ? `${iv.missingCount} number${iv.missingCount === 1 ? '' : 's'} missing` : '', iv.duplicates ? `${iv.duplicates} repeated` : '', iv.unbalancedPosted.length ? `${iv.unbalancedPosted.length} unbalanced` : ''].filter(Boolean).join(', ')) : 'Not checked yet', iv ? (iv.ok ? '#12b76a' : '#d92d20') : undefined],
  ]);
  const opt = (list, cur, all) => `<option value="">${ae(all)}</option>${list.map(([v, l]) => `<option value="${ae(v)}"${cur === v ? ' selected' : ''}>${ae(l)}</option>`).join('')}`;
  const seen = new Set(); const actions = AL.AUD_ACTIONS.filter(([, l]) => (seen.has(l) ? false : seen.add(l)));
  const filters = `<div class="al-filters">
    <label class="v28-field"><span>Area</span><select class="v28-select" data-aud-f="area">${opt((d.areas || []).map((a) => [a.id, a.label]), u.area, 'All areas')}</select></label>
    <label class="v28-field"><span>Action</span><select class="v28-select" data-aud-f="action">${opt(actions, u.action, 'All actions')}</select></label>
    <label class="v28-field"><span>Person</span><select class="v28-select" data-aud-f="userId">${opt((d.users || []).map((x) => [x.id, x.name]), u.userId, 'Everyone')}</select></label>
    <label class="v28-field"><span>From</span><input class="v28-input" type="date" data-aud-f="from" value="${ae(u.from)}"></label>
    <label class="v28-field"><span>To</span><input class="v28-input" type="date" data-aud-f="to" value="${ae(u.to)}"></label>
    <label class="v28-field al-grow"><span>Reference</span><input class="v28-input" type="search" data-aud-f="q" value="${ae(u.q)}" placeholder="Journal, account, invoice or record id"></label>
  </div>`;
  const rows = items.map((x) => `<tr>
    <td>${ae(AL.dateTime(x.at))}</td>
    <td>${ae(AL.audTypeLabel[x.entityType] || x.entityType)}<span class="v28-sub">${ae(x.reference || String(x.entityId || '').slice(0, 12))}</span></td>
    <td>${AL.status(AL.audActionLabel(x.action), /VOID|DELETE|REJECT/.test(x.action) ? 'bad' : /POST|APPROVE|LOCK/.test(x.action) ? 'ok' : 'info')}</td>
    <td>${ae(x.user || 'System')}<span class="v28-sub">${ae(x.role || '')}</span></td>
    <td class="al-wrap">${ae(AL.audDetail(x))}${x.reason ? `<span class="v28-sub">Reason: ${ae(String(x.reason).slice(0, 160))}</span>` : ''}</td>
  </tr>`).join('');
  const pages = Math.max(1, Math.ceil((d.total || 0) / 50));
  const pager = pages > 1 ? `<div class="al-pager">${AL.btn('Newer', 'aud-page', 'small', `data-d="-1"${u.page <= 1 ? ' disabled' : ''}`)}<span class="v28-sub">Page ${u.page} of ${pages}</span>${AL.btn('Older', 'aud-page', 'small', `data-d="1"${u.page >= pages ? ' disabled' : ''}`)}</div>` : '';
  const integPanel = iv && !iv.ok ? AL.panel('Integrity exceptions', `Checked ${AL.dateTime(iv.checkedAt)}`, `<ul class="al-list">${[
    iv.missingCount ? `<li>${iv.missingCount} journal number${iv.missingCount === 1 ? ' is' : 's are'} missing from the sequence (a journal removed after it was numbered): ${ae(iv.missing.slice(0, 12).map((m) => (m.from === m.to ? m.from : `${m.from}–${m.to}`)).join(', '))}${iv.missing.length > 12 ? ' …' : ''}.</li>` : '',
    iv.duplicates ? `<li>${iv.duplicates} journal number${iv.duplicates === 1 ? ' is' : 's are'} used twice.</li>` : '',
    iv.unnumbered ? `<li>${iv.unnumbered} journal${iv.unnumbered === 1 ? ' has' : 's have'} no number.</li>` : '',
    iv.counterBehind ? '<li>The numbering counter is behind the highest number issued.</li>' : '',
    iv.unbalancedPosted.length ? `<li>Posted journals whose debits and credits differ: ${ae(iv.unbalancedPosted.slice(0, 10).join(', '))}.</li>` : '',
  ].join('')}</ul>`) : '';
  return `<div class="v28-page">${head}${kpis}${integPanel}${AL.panel('Events', '', `${filters}${rows ? AL.table(['When', 'Record', 'Action', 'Who', 'What changed'], rows, '1080px') : AL.empty('No events match.')}${pager}`)}</div>`;
});
AL.wire.audit = () => {
  document.querySelectorAll('[data-aud-f]').forEach((el) => {
    if (el.dataset.wired) return; el.dataset.wired = '1';
    const k = el.dataset.audF;
    const apply = () => { AL.ui.aud[k] = el.value; AL.ui.aud.page = 1; AL.redraw(); };
    if (k === 'q') el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') apply(); });
    if (k === 'q') el.addEventListener('search', apply);
    else el.addEventListener('change', apply);
  });
};
AL.actions['aud-page'] = (el) => { AL.ui.aud.page = Math.max(1, AL.ui.aud.page + Number(el.dataset.d)); AL.redraw(); };
AL.actions['aud-check'] = (el) => AL.busy(el, async () => { const r = await AL.get('/accounting/audit/integrity'); AL.cache['aud-int'] = { data: r }; AL.redraw(); return r; },
  ['Integrity checked', (r) => (r && r.ok ? `All ${r.journals.toLocaleString('en-US')} journals are numbered in sequence and every posted journal balances.` : 'Exceptions found; they are listed on the page.')]);
AL.actions['aud-export'] = (el) => AL.busy(el, async () => { const text = await AL.getText(`/accounting/audit/export?${AL.audQuery()}`); AL.saveText(`﻿${text}`, `accounting-audit-${AL.stiToday()}.csv`); return text; },
  ['Exported', (t) => `${Math.max(0, String(t || '').split('\n').length - 1).toLocaleString('en-US')} events saved as CSV.`]);
