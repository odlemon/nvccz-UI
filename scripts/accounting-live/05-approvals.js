/* Approval Queue: /accounting/approvals — everything waiting on the signed-in user: approval requests assigned to them
 * and, for someone who may post, journals prepared by others (labelled with what they were raised for). Accounting items
 * are approved or rejected here; a procurement approval opens in Procurement (new tab); an invoice or credit note is
 * posted by sending it on Receivables. Data: /accounting/me/queue, /approvals/:id/approve|reject,
 * /accounting/journal-entries/:id/post|void. */
AL.ui.apq = AL.ui.apq || { filter: 'ALL', page: 1 };
if (!Number.isFinite(AL.ui.apq.page)) AL.ui.apq.page = 1;
AL.apqLoad = () => AL.res('apq', () => AL.get('/accounting/me/queue'));
// Reload re-reads the queue and repaints. It first closes the record-detail modal, because acting on a record (approve /
// post / reject) removes it from the queue — leaving the modal open would show a record that is already gone.
AL.apqReload = () => { AL.close(); delete AL.cache.apq; AL.redraw(); };
// Days waiting (shared by the queue rows and the detail modal). AL.apqAgeText renders that count as the sub-line.
AL.apqAge = (today, d) => Math.max(0, Math.round((Date.parse(today) - Date.parse(String(d).slice(0, 10))) / 86400000));
AL.apqAgeText = (a) => (a === 0 ? 'Today' : `${a} day${a === 1 ? '' : 's'}`);
// The actions for one queue item, as buttons. They used to sit inline in the row, collapsed behind a 3-dots kebab; they
// now live on the record-detail modal, so a row carries only a single 'View' affordance. Kept in one place and reused by
// both the row cell and the modal, so the two never drift apart.
AL.apqActionsMarkup = (x) => {
  const acts = [];
  if (x.where === 'procurement') acts.push(AL.btn('Open in Procurement', 'apq-proc', 'small primary', `data-type="${ae(x.stageType)}"`));
  else if (x.where === 'receivables') acts.push(AL.btn('Open in Receivables', 'apq-ar', 'small primary'));
  else if (x.kind === 'approval') acts.push(AL.btn('Approve', 'apq-approve', 'primary', `data-id="${ae(x.id)}"`), AL.btn('Reject', 'apq-reject', 'danger', `data-id="${ae(x.id)}"`));
  else if (x.kind === 'journal' || x.where === 'accounting') acts.push(AL.btn('Open', 'apq-open', 'small', `data-id="${ae(x.id)}"`), AL.btn('Post', 'apq-post', 'primary', `data-id="${ae(x.id)}"`), AL.btn('Reject', 'apq-jreject', 'danger', `data-id="${ae(x.id)}"`));
  // Unrecognised items fall back to a read-only detail view (older records may omit classification fields).
  else acts.push(AL.btn('Open', 'apq-open', 'small', `data-id="${ae(x.id)}"`));
  return acts.filter(Boolean).join('');
};
// The record-detail modal: the row's fields, then its actions (Approve / Reject, Open / Post / Reject, or the single
// Open in Procurement / Receivables). viewOnly makes the footer a plain Close; the buttons run the same AL.actions
// handlers the row used to, and the queue reload (and this modal) closes once the write lands.
AL.apqDetail = (id) => {
  const x = AL.apqItem(id);
  if (!x) return;
  const a = AL.apqAge(AL.stiToday(), x.requestedAt);
  const facts = [
    ['What', x.label],
    ['Detail', x.title || '—'],
    ['Amount', x.amount != null ? AL.money(x.amount, x.currency || '') : '—'],
    ['Requested by', x.requestedBy || '—'],
    ['Waiting', `${AL.date(x.requestedAt)} · ${AL.apqAgeText(a)}`],
  ].map((f) => `<div class="v28-list-item"><div><strong>${ae(f[0])}</strong><span>${ae(String(f[1]))}</span></div></div>`).join('');
  AL.form({ title: x.label || 'Record', sub: x.step ? ae(x.step) : '', wide: true, viewOnly: true, submitLabel: 'Close', fields: [],
    extra: `<div class="al-wide"><div class="v28-grid equal apq-detail-facts">${facts}</div>${AL.apqActionsMarkup(x) ? `<div class="apq-detail-actions">${AL.apqActionsMarkup(x)}</div>` : ''}</div>`,
    onSubmit: async () => false });
};
/** A shimmer placeholder that mirrors the real layout (4 KPI cards + the queue panel with filter chips and rows) so the
 *  page reads as "loading" instead of a bare "Loading…" line while /accounting/me/queue is in flight. */
AL.apqSkeleton = () => {
  const sk = (w, h = '14px', r = '6px') => `<span class="al-skel" style="width:${w};height:${h};border-radius:${r}"></span>`;
  const kpi = `<div class="v28-kpi al-skel-card">${sk('45%', '10px')}<div style="height:9px"></div>${sk('62%', '22px', '8px')}<div style="height:9px"></div>${sk('80%', '10px')}</div>`;
  const kpis = `<div class="v28-kpis">${kpi.repeat(4)}</div>`;
  const chips = `<div class="v28-tabbar al-skel-chips">${sk('92px', '32px', '999px')}${sk('128px', '32px', '999px')}${sk('112px', '32px', '999px')}${sk('158px', '32px', '999px')}</div>`;
  const widths = ['26px', '96px', '240px', '92px', '96px', '84px'];
  const row = `<tr>${widths.map((w) => `<td>${sk(w)}</td>`).join('')}</tr>`;
  const table = `<div class="v28-tablewrap"><table class="v28-table" style="min-width:1080px"><tbody>${row.repeat(6)}</tbody></table></div>`;
  return `${kpis}${AL.panel('Waiting on you', '', `${chips}${table}`)}`;
};

AL.page('approvals', () => {
  AL.meLoad();
  const e = AL.apqLoad();
  // The three export controls (PDF / Excel / CSV) sit in the header's top-right corner, beside nothing else on this page;
  // they only appear once there is a queue to export, so a loading or failing page never offers a file it cannot write.
  const canExport = e.state === 'ok' && (e.data || []).length > 0;
  const head = AL.head('Control centre', 'Approval Queue', 'What is waiting on you. Nobody approves or posts their own work.', canExport ? AL.exportBtns('apq-export') : '');
  if (e.state === 'loading') return `<div class="v28-page">${head}${AL.apqSkeleton()}</div>`;
  const g = AL.gate(e, { key: 'apq', errorTitle: 'The queue could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const items = e.data || [];
  const today = AL.stiToday();
  const age = (d) => AL.apqAge(today, d);
  const groups = {};
  items.forEach((x) => { groups[x.label] = (groups[x.label] || 0) + 1; });
  const kpis = AL.kpis([
    ['Waiting on you', String(items.length), items.length ? `Oldest ${Math.max(...items.map((x) => age(x.requestedAt)))} days` : 'Nothing waiting', items.length ? '#f79009' : '#12b76a'],
    ['Approval requests', String(items.filter((x) => x.kind === 'approval').length), 'Payments, placements, changes'],
    ['Journals to post', String(items.filter((x) => x.kind === 'journal').length), 'Prepared by others'],
    ['Over 7 days', String(items.filter((x) => age(x.requestedAt) > 7).length), 'Waiting more than a week', items.some((x) => age(x.requestedAt) > 7) ? '#d92d20' : '#12b76a'],
  ]);
  const f = AL.ui.apq.filter;
  const chips = `<div class="v28-tabbar">${[['ALL', `All (${items.length})`], ...Object.entries(groups).map(([k, n]) => [k, `${k} (${n})`])].map(([id, label]) => `<button class="v28-tab ${f === id ? 'active' : ''}" data-al="apq-filter" data-f="${ae(id)}">${ae(label)}</button>`).join('')}</div>`;
  const shown = items.filter((x) => f === 'ALL' || x.label === f);
  // Paginate the filtered queue (same convention as the Fixed Assets register): clamp the page into range every render so
  // a filter that shrinks the list cannot leave the pager on an empty page, then slice just that page's rows.
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
  AL.ui.apq.page = Math.min(Math.max(1, AL.ui.apq.page), totalPages);
  const start = (AL.ui.apq.page - 1) * pageSize;
  const pageItems = shown.slice(start, start + pageSize);
  const rows = pageItems.map((x) => {
    const a = age(x.requestedAt);
    // One 'View' button opens the record-detail modal (where the actions live); a single button is never collapsed into
    // a kebab, so the row stays clean and the whole row is clickable too (see AL.wire.approvals below).
    return `<tr data-apq-row data-id="${ae(x.id)}" tabindex="0" role="button" aria-label="View ${ae(x.title || x.label || 'record')} details">
      <td class="al-actions">${AL.btn('View', 'apq-view', 'small', `data-id="${ae(x.id)}"`)}</td>
      <td>${AL.status(x.label, x.kind === 'approval' ? 'info' : 'warn')}${x.step ? `<span class="v28-sub">${ae(x.step)}</span>` : ''}</td>
      <td class="al-wrap"><strong>${ae(x.title || '')}</strong></td>
      <td>${x.amount != null ? ae(AL.money(x.amount, x.currency || '')) : '—'}</td>
      <td>${ae(x.requestedBy || '—')}</td>
      <td>${ae(AL.date(x.requestedAt))}<span class="v28-sub${a > 7 ? ' al-bad' : ''}">${ae(AL.apqAgeText(a))}</span></td>
    </tr>`;
  }).join('');
  // The pager bar only appears once there is more than one page — a short queue stays clean.
  const pager = totalPages > 1 ? `<div class="apq-pagination"><span>Showing ${start + 1}\u2013${Math.min(start + pageSize, shown.length)} of ${shown.length} waiting</span><div>${AL.btn('Previous', 'apq-page', 'small', `data-dir="-1"${AL.ui.apq.page <= 1 ? ' disabled' : ''}`)}<span>Page ${AL.ui.apq.page} of ${totalPages}</span>${AL.btn('Next', 'apq-page', 'small', `data-dir="1"${AL.ui.apq.page >= totalPages ? ' disabled' : ''}`)}</div></div>` : '';
  const queueTable = rows
    ? `<div class="apq-table">${AL.table(['', 'What', 'Detail', 'Amount', 'From', 'Waiting'], rows, '1080px')}</div>${pager}`
    : AL.empty('Nothing is waiting on you.');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Waiting on you', '', `${chips}${queueTable}`)}</div>`;
});
AL.actions['apq-filter'] = (el) => { AL.ui.apq.filter = el.dataset.f; AL.ui.apq.page = 1; AL.redraw(); };
AL.actions['apq-page'] = (el) => { AL.ui.apq.page = Math.max(1, AL.ui.apq.page + Number(el.dataset.dir || 0)); AL.redraw(); };
AL.apqItem = (id) => ((AL.cache.apq && AL.cache.apq.data) || []).find((x) => x.id === id);
/** What the queue's export carries: every item the current filter holds (not just the page on show), the four summary
 *  figures, and how long each has waited — the same values the rows and KPI cards read. */
AL.apqExportSpec = () => {
  const f = AL.ui.apq.filter;
  const items = ((AL.cache.apq && AL.cache.apq.data) || []).filter((x) => f === 'ALL' || x.label === f);
  const today = AL.stiToday();
  const age = (d) => AL.apqAge(today, d);
  return {
    title: 'Approval Queue',
    subtitle: 'What is waiting on you. Nobody approves or posts their own work.',
    meta: [
      ['Waiting on you', String(items.length)],
      ['Approval requests', String(items.filter((x) => x.kind === 'approval').length)],
      ['Journals to post', String(items.filter((x) => x.kind === 'journal').length)],
      ['Over 7 days', String(items.filter((x) => age(x.requestedAt) > 7).length)],
    ],
    columns: ['What', 'Step', 'Detail', 'Amount', 'From', 'Requested', 'Waiting'],
    align: ['left', 'left', 'left', 'right', 'left', 'left', 'right'],
    rows: items.map((x) => [
      x.label || '',
      x.step || '',
      x.title || '',
      x.amount != null ? AL.money(x.amount, x.currency || '') : '—',
      x.requestedBy || '—',
      AL.date(x.requestedAt),
      AL.apqAgeText(age(x.requestedAt)),
    ]),
    note: f === 'ALL' ? '' : `Filtered to ${f}; the whole queue exports when no filter is applied.`,
    filename: 'approval-queue',
  };
};
AL.actions['apq-export'] = (el) => {
  const spec = AL.apqExportSpec();
  if (!spec.rows.length) return AL.toast('Nothing to export', 'No waiting item matches this filter.', 'bad');
  return AL.exportRun(el, spec, 'queue items');
};
// A row's only inline button opens the detail modal; the row itself is also clickable (AL.wire.approvals).
AL.actions['apq-view'] = (el) => {
  const item = AL.apqItem(el.dataset.id);
  if (item && item.kind === 'claim') {
    AL.ui.clm = AL.ui.clm || { tab: 'waiting', status: '', page: 1 };
    AL.ui.clm.tab = 'waiting'; AL.ui.clm.page = 1; AL.ui.clm.returnToQueue = true; AL.ui.clm.reopen = item.claimId;
    Object.keys(AL.cache).filter((k) => k.startsWith('clm-') && k !== 'clm-opts').forEach((k) => delete AL.cache[k]);
    AL.go('claims'); return;
  }
  AL.apqDetail(el.dataset.id);
};
// Bind the whole row to the same detail modal, and suppress the runtime's generic read-only 'Record detail' drawer for
// these rows via the dataset.v25DetailBound opt-out (runtime row handler) so the two never both open. Clicks on a button
// (the View button, or the pager which can share the table region) are left to their own [data-al] handlers.
AL.wire.approvals = () => {
  document.querySelectorAll('.apq-table tbody tr[data-apq-row]').forEach((row) => {
    row.dataset.v25DetailBound = '1';
    if (row.dataset.apqRowWired) return;
    row.dataset.apqRowWired = '1';
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('button, a, input, select, textarea, [data-al]')) return;
      AL.actions['apq-view'](row);
    });
    row.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      AL.actions['apq-view'](row);
    });
  });
};
AL.actions['apq-approve'] = (el) => { const x = AL.apqItem(el.dataset.id); if (!x) return; AL.confirm({ title: `Approve: ${x.label}`, confirmLabel: 'Approve', doneTitle: 'Approved', reason: 'Comment', reasonRequired: false, body: `${x.title}${x.amount != null ? ` · ${AL.money(x.amount, x.currency || '')}` : ''} — requested by ${x.requestedBy || 'someone'}.`, onConfirm: async (v) => { await AL.post(`/approvals/${encodeURIComponent(x.id)}/approve`, { comments: v.reason || 'Approved' }); return ''; }, after: () => AL.apqReload() }); };
AL.actions['apq-reject'] = (el) => { const x = AL.apqItem(el.dataset.id); if (!x) return; AL.confirm({ title: `Reject: ${x.label}`, danger: true, confirmLabel: 'Reject', doneTitle: 'Rejected', reason: 'Why it is rejected', body: x.title, onConfirm: async (v) => { await AL.post(`/approvals/${encodeURIComponent(x.id)}/reject`, { comments: v.reason }); return ''; }, after: () => AL.apqReload() }); };
AL.actions['apq-post'] = (el) => { AL.close(); AL.busy(el, async () => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}/post`, {}); AL.apqReload(); }, ['Posted', 'It is in the ledger.']); };
AL.actions['apq-jreject'] = (el) => { const x = AL.apqItem(el.dataset.id); if (!x) return; AL.confirm({ title: `Reject ${x.reference || 'journal'}`, danger: true, confirmLabel: 'Reject', doneTitle: 'Rejected', reason: 'Why it is rejected', body: `${x.label}: ${x.title}. It is withdrawn and never reaches the ledger.`, onConfirm: async (v) => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(x.id)}/void`, { reason: v.reason }); return ''; }, after: () => AL.apqReload() }); };
AL.actions['apq-open'] = (el) => AL.actions['je-open'](el);
AL.actions['apq-ar'] = (el) => { AL.close(); AL.go('receivables'); };
AL.actions['apq-proc'] = (el) => { const path = { PURCHASE_REQUISITION: '/procurement/requisitions', PURCHASE_ORDER: '/procurement/purchase-orders', INVOICE: '/procurement/invoices', GRN: '/procurement/receiving', AWARD_RECOMMENDATION: '/procurement/evaluation' }[el.dataset.type] || '/procurement'; window.open(path, '_blank', 'noopener,noreferrer'); };
