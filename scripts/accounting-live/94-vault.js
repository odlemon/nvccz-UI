/* Document Vault: searchable, traceable accounting evidence stored by the existing documents API. */
AL.ui.vault = AL.ui.vault || { cat: '', q: '', page: 1, pageSize: 10 };
AL.VAULT_CATS = ['Close evidence', 'Financial reports', 'Tax & compliance', 'Payment controls', 'Accounting policies', 'Audit room', 'General'];
AL.vaultRows = () => {
  const docs = (AL.cache.vault && AL.cache.vault.data) || [], u = AL.ui.vault, q = u.q.trim().toLowerCase();
  return docs.filter((d) => (!u.cat || d.category === u.cat) && (!q || [d.name, d.category, d.mimeType, d.uploadedBy && `${d.uploadedBy.firstName || ''} ${d.uploadedBy.lastName || ''}`].some((x) => String(x || '').toLowerCase().includes(q))));
};
AL.vaultFileHref = (raw) => {
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.href), apiBase = AL.http().apiBaseUrl;
    // Local fallback uploads sometimes store the default API port (3009), while this app may be
    // assigned another local API port. Re-root only public-media links on a loopback host.
    if (url.pathname.includes('/api/public-media/') && /^(localhost|127\.0\.0\.1)$/.test(url.hostname) && apiBase) {
      const api = new URL(apiBase, window.location.href);
      if (/^(localhost|127\.0\.0\.1)$/.test(api.hostname)) { url.protocol = api.protocol; url.hostname = api.hostname; url.port = api.port; }
    }
    return url.href;
  } catch (_) { return raw; }
};
AL.vaultExportSpec = () => {
  const docs = AL.vaultRows(), u = AL.ui.vault;
  const size = (b) => b == null ? 'Not available' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  return { title: 'Document Vault', subtitle: 'Accounting evidence register', filename: 'accounting-document-vault', landscape: true, meta: [['Category', u.cat || 'All categories'], ['Search', u.q || 'All documents'], ['Documents', docs.length]], columns: ['Document', 'Category', 'File type', 'Size', 'Uploaded by', 'Uploaded', 'Availability'], rows: docs.map((d) => [d.name || 'Untitled document', d.category || 'Uncategorised', d.mimeType || 'Not available', size(d.fileSizeBytes), d.uploadedBy ? [d.uploadedBy.firstName, d.uploadedBy.lastName].filter(Boolean).join(' ') : 'Not available', AL.dateTime(d.createdAt), d.fileUrl ? 'Available' : 'Metadata only']), notes: ['Upload events are recorded in the accounting audit trail.'] };
};
AL.page('vault', () => {
  AL.meLoad();
  const e = AL.res('vault', () => AL.get('/accounting/documents'));
  const canUpload = AL.can('manage_accounting');
  const actions = `${AL.exportBtns('vault-export')}${canUpload ? AL.btn('Upload document', 'vault-up', 'primary') + AL.btn('Bulk upload', 'vault-bulk') : ''}`;
  const head = AL.head('Reporting and compliance', 'Document Vault', 'Find and manage accounting evidence.', actions);
  const g = AL.gate(e, { key: 'vault', errorTitle: 'The vault could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const docs = e.data || [], u = AL.ui.vault;
  const cats = [...new Set([...AL.VAULT_CATS, ...docs.map((d) => d.category).filter(Boolean)])];
  const count = (c) => docs.filter((d) => d.category === c).length;
  const tabs = `<div class="v28-tabbar" role="tablist" aria-label="Document category">${[['', `All (${docs.length})`], ...cats.filter((c) => count(c) || AL.VAULT_CATS.includes(c)).map((c) => [c, `${c} (${count(c)})`])].map(([id, label]) => `<button type="button" role="tab" aria-selected="${u.cat === id}" class="v28-tab ${u.cat === id ? 'active' : ''}" data-al="vault-cat" data-c="${ae(id)}">${ae(label)}</button>`).join('')}</div>`;
  const size = (b) => b == null ? 'Not available' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const filtered = AL.vaultRows(), pageSize = u.pageSize || 10, pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  u.page = Math.min(Math.max(1, u.page || 1), pages);
  const visible = filtered.slice((u.page - 1) * pageSize, u.page * pageSize);
  const rows = visible.map((d) => `<tr><td><strong>${ae(d.name || 'Untitled document')}</strong><span class="v28-sub">${ae(d.mimeType || 'File type unavailable')}</span></td><td>${ae(d.category || 'Uncategorised')}</td><td class="num">${ae(size(d.fileSizeBytes))}</td><td>${ae(d.uploadedBy ? [d.uploadedBy.firstName, d.uploadedBy.lastName].filter(Boolean).join(' ') : 'Not available')}</td><td>${ae(AL.dateTime(d.createdAt))}</td><td class="al-actions">${AL.btn('Details', 'vault-detail', 'small', `data-id="${ae(d.id)}"`)}${d.fileUrl ? `<a class="v28-btn small" href="${ae(AL.vaultFileHref(d.fileUrl))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${ae(d.name || 'document')} in a new tab">Open file</a>` : '<span class="v28-sub">File unavailable</span>'}</td></tr>`).join('');
  const start = filtered.length ? (u.page - 1) * pageSize + 1 : 0, end = Math.min(u.page * pageSize, filtered.length);
  const pager = `<nav class="al-vault-pager" aria-label="Document pages"><span>Showing ${start}-${end} of ${filtered.length} documents</span><div class="al-actions"><button type="button" class="v28-btn small" data-al="vault-page" data-page="${u.page - 1}" ${u.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${u.page} of ${pages}</span><button type="button" class="v28-btn small" data-al="vault-page" data-page="${u.page + 1}" ${u.page >= pages ? 'disabled' : ''}>Next</button></div></nav>`;
  const empty = filtered.length ? '' : AL.empty(docs.length ? 'No documents match these filters.' : 'No documents have been uploaded yet.');
  return `<div class="v28-page">${head}${AL.panel('Documents', '', `${tabs}<div class="al-filters"><label class="v28-field al-grow"><span>Search documents</span><input class="v28-input" type="search" data-vault-f="q" value="${ae(u.q)}" placeholder="Name, category, file type or uploader" aria-label="Search documents"></label></div>${rows ? AL.table(['Document', 'Category', 'Size', 'Uploaded by', 'Uploaded', 'Actions'], rows, '1060px') : empty}${pager}`)}</div>`;
});
AL.wire.vault = () => { document.querySelectorAll('[data-vault-f="q"]').forEach((el) => { if (el.dataset.wired) return; el.dataset.wired = '1'; el.addEventListener('input', () => { const start = el.selectionStart; AL.ui.vault.q = el.value; AL.ui.vault.page = 1; AL.redraw(); const next = document.querySelector('[data-vault-f="q"]'); if (next) { next.focus(); next.setSelectionRange(start, start); } }); }); };
AL.actions['vault-cat'] = (el) => { AL.ui.vault.cat = el.dataset.c; AL.ui.vault.page = 1; AL.redraw(); };
AL.actions['vault-page'] = (el) => { AL.ui.vault.page = Number(el.dataset.page) || 1; AL.redraw(); };
AL.actions['vault-export'] = (el) => { const spec = AL.vaultExportSpec(); if (!spec.rows.length) return AL.toast('Nothing to export', 'There are no documents in this view.', 'bad'); return AL.exportRun(el, spec, 'documents'); };
AL.actions['vault-detail'] = (el) => {
  const docs = (AL.cache.vault && AL.cache.vault.data) || [], d = docs.find((x) => x.id === el.dataset.id); if (!d) return;
  const uploader = d.uploadedBy ? [d.uploadedBy.firstName, d.uploadedBy.lastName].filter(Boolean).join(' ') : 'Not available';
  const size = d.fileSizeBytes == null ? 'Not available' : d.fileSizeBytes < 1024 ? `${d.fileSizeBytes} B` : d.fileSizeBytes < 1048576 ? `${(d.fileSizeBytes / 1024).toFixed(1)} KB` : `${(d.fileSizeBytes / 1048576).toFixed(1)} MB`;
  const detail = [['Category', d.category || 'Uncategorised'], ['File type', d.mimeType || 'Not available'], ['File size', size], ['Uploaded by', uploader], ['Uploaded', AL.dateTime(d.createdAt)], ['Availability', d.fileUrl ? 'File available' : 'File unavailable']].map(([k, v]) => `<div class="al-vault-detail-row"><span>${ae(k)}</span><strong>${ae(String(v == null ? 'Not available' : v))}</strong></div>`).join('');
  AL.form({ title: d.name || 'Document detail', sub: 'Accounting evidence details', wide: true, viewOnly: true, submitLabel: 'Close', fields: [], extra: `<div class="al-vault-detail">${detail}${d.fileUrl ? `<div class="al-vault-detail-actions"><a class="v28-btn primary" href="${ae(AL.vaultFileHref(d.fileUrl))}" target="_blank" rel="noopener noreferrer">Open file</a></div>` : ''}</div>`, onSubmit: async () => false });
};
const vaultUpload = (bulk) => {
  const inputId = 'alVaultFiles', maxBytes = 50 * 1024 * 1024;
  const accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.ppt,.pptx,.zip,.msg,.eml,.xml,.json';
  const allowed = new Set(accept.split(',').map((x) => x.slice(1)));
  AL.form({ title: bulk ? 'Bulk upload documents' : 'Upload a document', sub: 'Files are validated before upload and each successful upload is recorded in the accounting audit trail.', submitLabel: bulk ? 'Upload files' : 'Upload document', doneTitle: 'Upload complete', wide: true,
    fields: [{ k: 'category', label: 'Category', type: 'select', required: true, blank: false, options: AL.VAULT_CATS }], initial: { category: AL.ui.vault.cat || 'Close evidence' },
    extra: `<label class="v28-field al-wide"><span>${bulk ? 'Files' : 'File'} *</span><input class="v28-input" type="file" id="${inputId}" accept="${accept}" ${bulk ? 'multiple' : ''} aria-describedby="alVaultFileHelp"></label><small id="alVaultFileHelp" class="v28-sub al-wide">${bulk ? 'Select multiple files.' : 'Choose one file.'} Accepted: PDF, Office, spreadsheet, CSV, text, image, archive, email, XML and JSON. Maximum 50 MB per file.</small><div id="alVaultSelection" class="al-vault-selection al-wide" aria-live="polite">Choose a file to validate it.</div><div id="alVaultProgressWrap" class="al-vault-progress al-wide" hidden><progress id="alVaultProgress" max="100" value="0"></progress><span id="alVaultProgressText" aria-live="polite"></span></div>`,
    validate: () => { const files = Array.from(document.getElementById(inputId).files || []); if (!files.length) return bulk ? 'Choose at least one file.' : 'Choose a file.'; if (!bulk && files.length !== 1) return 'Choose one file.'; if (files.length > 100) return 'Select no more than 100 files at a time.'; const bad = files.find((f) => !allowed.has((f.name.split('.').pop() || '').toLowerCase()) || !f.name.includes('.')); if (bad) return `${bad.name} is not a supported file type.`; const large = files.find((f) => f.size > maxBytes); if (large) return `${large.name} is over 50 MB.`; return ''; },
    onSubmit: async (v) => { const files = Array.from(document.getElementById(inputId).files || []), wrap = document.getElementById('alVaultProgressWrap'), progress = document.getElementById('alVaultProgress'), text = document.getElementById('alVaultProgressText'); wrap.hidden = false; let success = 0; const failed = []; for (let i = 0; i < files.length; i++) { text.textContent = `Uploading ${i + 1} of ${files.length}: ${files[i].name}`; progress.value = Math.round(i / files.length * 100); const fd = new FormData(); fd.append('file', files[i]); fd.append('category', v.category); try { AL.unwrap(await AL.http().form('/accounting/documents', fd)); success++; } catch (err) { failed.push(files[i].name); } progress.value = Math.round((i + 1) / files.length * 100); } if (success) delete AL.cache.vault; if (failed.length) throw new Error(`${success} uploaded; ${failed.length} failed: ${failed.join(', ')}`); return `${success} ${success === 1 ? 'document was' : 'documents were'} uploaded to ${v.category}.`; },
    after: async () => { delete AL.cache.vault; await AL.get('/accounting/documents'); AL.ui.vault.page = 1; AL.redraw(); }
  });
  const file = document.getElementById(inputId), summary = document.getElementById('alVaultSelection');
  file.addEventListener('change', () => { const fs = Array.from(file.files || []); const invalid = fs.filter((f) => !allowed.has((f.name.split('.').pop() || '').toLowerCase()) || f.size > maxBytes); summary.classList.toggle('is-invalid', !!invalid.length); summary.textContent = fs.length ? `${fs.length} file${fs.length === 1 ? '' : 's'} selected | ${fs.map((f) => f.name).join(', ')}${invalid.length ? ` | ${invalid.map((f) => `${f.name}: unsupported or over 50 MB`).join('; ')}` : ' | File checks passed.'}` : 'Choose a file to validate it.'; });
};
AL.actions['vault-up'] = () => vaultUpload(false);
AL.actions['vault-bulk'] = () => vaultUpload(true);
