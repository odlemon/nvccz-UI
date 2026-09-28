/* Document Vault: /accounting/vault — the finance team's evidence kept in one place by category (close evidence,
 * reports, tax, payment controls, policies, audit): search, open, upload (PDF, Office, spreadsheets, images, text,
 * archives; each upload recorded in the audit trail). Data: /accounting/documents. */
AL.ui.vault = AL.ui.vault || { cat: '', q: '' };
AL.VAULT_CATS = ['Close evidence', 'Financial reports', 'Tax & compliance', 'Payment controls', 'Accounting policies', 'Audit room', 'General'];
AL.page('vault', () => {
  AL.meLoad();
  const e = AL.res('vault', () => AL.get('/accounting/documents'));
  const canUpload = AL.can('manage_accounting');
  const head = AL.head('Reporting and compliance', 'Document Vault', '', canUpload ? AL.btn('Upload', 'vault-up', 'primary') : '');
  const g = AL.gate(e, { key: 'vault', errorTitle: 'The vault could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const docs = e.data || [], u = AL.ui.vault, q = u.q.trim().toLowerCase();
  const cats = [...new Set([...AL.VAULT_CATS, ...docs.map((d) => d.category)])];
  const count = (c) => docs.filter((d) => d.category === c).length;
  const tabs = `<div class="v28-tabbar">${[['', `All (${docs.length})`], ...cats.filter((c) => count(c) || AL.VAULT_CATS.includes(c)).map((c) => [c, `${c} (${count(c)})`])].map(([id, l]) => `<button class="v28-tab ${u.cat === id ? 'active' : ''}" data-al="vault-cat" data-c="${ae(id)}">${ae(l)}</button>`).join('')}</div>`;
  const size = (b) => (b == null ? '—' : b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 102.4) / 10} KB` : `${Math.round(b / 104857.6) / 10} MB`);
  const rows = docs.filter((d) => (!u.cat || d.category === u.cat) && (!q || String(d.name).toLowerCase().includes(q))).map((d) => `<tr>
    <td><strong>${ae(d.name)}</strong><span class="v28-sub">${ae(d.mimeType || '')}</span></td>
    <td>${ae(d.category)}</td>
    <td class="num">${ae(size(d.fileSizeBytes))}</td>
    <td>${ae(d.uploadedBy ? [d.uploadedBy.firstName, d.uploadedBy.lastName].filter(Boolean).join(' ') : '—')}</td>
    <td>${ae(AL.dateTime(d.createdAt))}</td>
    <td class="al-actions">${d.fileUrl ? `<a class="v28-btn small" href="${ae(d.fileUrl)}" target="_blank" rel="noopener">Open</a>` : ''}</td>
  </tr>`).join('');
  return `<div class="v28-page">${head}${AL.panel('Documents', '', `${tabs}<div class="al-filters"><label class="v28-field al-grow"><span>Search</span><input class="v28-input" type="search" data-vault-f="q" value="${ae(u.q)}" placeholder="File name"></label></div>${rows ? AL.table(['Document', 'Category', 'Size', 'Uploaded by', 'When', ''], rows, '960px') : AL.empty('No documents here yet.')}`)}</div>`;
});
AL.wire.vault = () => { document.querySelectorAll('[data-vault-f]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; const apply = () => { AL.ui.vault.q = el.value; AL.redraw(); }; el.addEventListener('search', apply); el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') apply(); }); }); };
AL.actions['vault-cat'] = (el) => { AL.ui.vault.cat = el.dataset.c; AL.redraw(); };
AL.actions['vault-up'] = () => AL.form({ title: 'Upload to the vault', submitLabel: 'Upload', doneTitle: 'Uploaded', fields: [
  { k: 'category', label: 'Category', type: 'select', required: true, blank: false, options: AL.VAULT_CATS },
], initial: { category: AL.ui.vault.cat || 'Close evidence' },
  extra: '<label class="v28-field al-wide"><span>File *</span><input class="v28-input" type="file" id="alVaultFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.ppt,.pptx,.zip,.msg,.eml,.xml,.json"></label>',
  validate: () => { const f = document.getElementById('alVaultFile'); return !f || !f.files || !f.files[0] ? 'Choose a file.' : f.files[0].size > 50 * 1024 * 1024 ? 'The file is over 50 MB.' : ''; },
  onSubmit: async (v) => { const f = document.getElementById('alVaultFile').files[0]; const fd = new FormData(); fd.append('file', f); fd.append('category', v.category); AL.unwrap(await AL.http().form('/accounting/documents', fd)); return `${f.name} is in ${v.category}.`; },
  after: () => { delete AL.cache.vault; AL.redraw(); } });
