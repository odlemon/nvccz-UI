/* Approval Queue: /accounting/approvals — everything waiting on the signed-in user: approval requests assigned to them
 * and, for someone who may post, journals prepared by others (labelled with what they were raised for). Accounting items
 * are approved or rejected here; a procurement approval opens in Procurement (new tab); an invoice or credit note is
 * posted by sending it on Receivables. Data: /accounting/me/queue, /approvals/:id/approve|reject,
 * /accounting/journal-entries/:id/post|void. */
AL.ui.apq = AL.ui.apq || { filter: 'ALL' };
AL.apqLoad = () => AL.res('apq', () => AL.get('/accounting/me/queue'));
AL.apqReload = () => { delete AL.cache.apq; AL.redraw(); };

AL.page('approvals', () => {
  AL.meLoad();
  const e = AL.apqLoad();
  const head = AL.head('Control centre', 'Approval Queue', 'What is waiting on you. Nobody approves or posts their own work.');
  const g = AL.gate(e, { key: 'apq', errorTitle: 'The queue could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const items = e.data || [];
  const today = AL.stiToday();
  const age = (d) => Math.max(0, Math.round((Date.parse(today) - Date.parse(String(d).slice(0, 10))) / 86400000));
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
  const rows = shown.map((x) => {
    const acts = [];
    if (x.where === 'procurement') acts.push(AL.btn('Open in Procurement', 'apq-proc', 'small', `data-type="${ae(x.stageType)}"`));
    else if (x.where === 'receivables') acts.push(AL.btn('Open in Receivables', 'apq-ar', 'small'));
    else if (x.kind === 'approval') acts.push(AL.btn('Approve', 'apq-approve', 'small primary', `data-id="${ae(x.id)}"`), AL.btn('Reject', 'apq-reject', 'small danger', `data-id="${ae(x.id)}"`));
    else acts.push(AL.btn('Open', 'apq-open', 'small', `data-id="${ae(x.id)}"`), AL.btn('Post', 'apq-post', 'small primary', `data-id="${ae(x.id)}"`), AL.btn('Reject', 'apq-jreject', 'small danger', `data-id="${ae(x.id)}"`));
    const a = age(x.requestedAt);
    return `<tr>
      <td>${AL.status(x.label, x.kind === 'approval' ? 'info' : 'warn')}${x.step ? `<span class="v28-sub">${ae(x.step)}</span>` : ''}</td>
      <td class="al-wrap"><strong>${ae(x.title || '')}</strong><span class="v28-sub">${ae(x.reference || '')}</span></td>
      <td>${x.amount != null ? ae(AL.money(x.amount, x.currency || '')) : '—'}</td>
      <td>${ae(x.requestedBy || '—')}</td>
      <td>${ae(AL.date(x.requestedAt))}<span class="v28-sub${a > 7 ? ' al-bad' : ''}">${a === 0 ? 'Today' : `${a} day${a === 1 ? '' : 's'}`}</span></td>
      <td class="al-actions">${acts.join('')}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Waiting on you', '', `${chips}${rows ? AL.table(['What', 'Detail', 'Amount', 'From', 'Waiting', ''], rows, '1080px') : AL.empty('Nothing is waiting on you.')}`)}</div>`;
});
AL.actions['apq-filter'] = (el) => { AL.ui.apq.filter = el.dataset.f; AL.redraw(); };
AL.apqItem = (id) => ((AL.cache.apq && AL.cache.apq.data) || []).find((x) => x.id === id);
AL.actions['apq-approve'] = (el) => { const x = AL.apqItem(el.dataset.id); if (!x) return; AL.confirm({ title: `Approve: ${x.label}`, confirmLabel: 'Approve', doneTitle: 'Approved', reason: 'Comment', reasonRequired: false, body: `${x.title}${x.amount != null ? ` · ${AL.money(x.amount, x.currency || '')}` : ''} — requested by ${x.requestedBy || 'someone'}.`, onConfirm: async (v) => { await AL.post(`/approvals/${encodeURIComponent(x.id)}/approve`, { comments: v.reason || 'Approved' }); return ''; }, after: () => AL.apqReload() }); };
AL.actions['apq-reject'] = (el) => { const x = AL.apqItem(el.dataset.id); if (!x) return; AL.confirm({ title: `Reject: ${x.label}`, danger: true, confirmLabel: 'Reject', doneTitle: 'Rejected', reason: 'Why it is rejected', body: x.title, onConfirm: async (v) => { await AL.post(`/approvals/${encodeURIComponent(x.id)}/reject`, { comments: v.reason }); return ''; }, after: () => AL.apqReload() }); };
AL.actions['apq-post'] = (el) => AL.busy(el, async () => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(el.dataset.id)}/post`, {}); AL.apqReload(); }, ['Posted', 'It is in the ledger.']);
AL.actions['apq-jreject'] = (el) => { const x = AL.apqItem(el.dataset.id); if (!x) return; AL.confirm({ title: `Reject ${x.reference || 'journal'}`, danger: true, confirmLabel: 'Reject', doneTitle: 'Rejected', reason: 'Why it is rejected', body: `${x.label}: ${x.title}. It is withdrawn and never reaches the ledger.`, onConfirm: async (v) => { await AL.patch(`/accounting/journal-entries/${encodeURIComponent(x.id)}/void`, { reason: v.reason }); return ''; }, after: () => AL.apqReload() }); };
AL.actions['apq-open'] = (el) => AL.actions['je-open'](el);
AL.actions['apq-ar'] = () => AL.go('receivables');
AL.actions['apq-proc'] = (el) => { const path = { PURCHASE_REQUISITION: '/procurement/requisitions', PURCHASE_ORDER: '/procurement/purchase-orders', INVOICE: '/procurement/invoices', GRN: '/procurement/receiving', AWARD_RECOMMENDATION: '/procurement/evaluation' }[el.dataset.type] || '/procurement'; window.open(path, '_blank', 'noopener,noreferrer'); };
