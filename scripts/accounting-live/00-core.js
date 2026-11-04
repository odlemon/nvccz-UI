/* =====================================================================================================================
 * AccLive core (Accounting sweep). Inlined into the runtime, inside startAccountingV52Runtime, just before its API object,
 * by scripts/accounting-live-sync.mjs — so it sees the runtime's `pages`, `state`, `render`, `navGroups`, `notify8`.
 *
 * Pages registered here render from the API (never fixtures): every data surface has loading, empty and error states;
 * every write shows it is working, reports the server's answer and re-reads what the server now holds. Markup uses the
 * runtime's own v28 classes so the pages look like the rest of the module.
 * ===================================================================================================================== */
const AL = (window.AccLive = window.AccLive || {});
AL.pages = {}; AL.cache = {}; AL.ui = {}; AL.actions = {}; AL.wire = {};

AL.e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ae = AL.e;
AL.http = () => window.__AC52_HTTP__;
AL.unwrap = (r) => (r && typeof r === 'object' && 'success' in r && 'data' in r ? r.data : r);
AL.msg = (e) => String((e && (e.message || e.error)) || e || 'Something went wrong').replace(/\s+/g, ' ').slice(0, 300);
AL.get = async (p) => AL.unwrap(await AL.http().get(p));
/** The whole answer, envelope included (a paginated list's `pagination` sits beside its `data`). */
AL.getRaw = async (p) => AL.http().get(p);
AL.getText = async (p) => AL.http().text(p);
/** Save text the server produced (e.g. a CSV export) as a file. */
AL.saveText = (text, filename, type = 'text/csv;charset=utf-8') => { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
AL.post = async (p, b) => AL.unwrap(await AL.http().post(p, b));
AL.put = async (p, b) => AL.unwrap(await AL.http().put(p, b));
AL.patch = async (p, b) => AL.unwrap(await AL.http().patch(p, b));
AL.del = async (p) => AL.unwrap(await AL.http().del(p));
AL.me = () => (window.__AC52_ME__ ? window.__AC52_ME__() : { id: null, name: '' });
AL.toast = (title, message, kind) => { try { notify8(title, message || '', kind || ''); } catch (_) { /* no runtime toast */ } };

AL.currencyCode = (cur) => {
  if (typeof cur === 'string' || typeof cur === 'number') return String(cur).trim();
  if (!cur || typeof cur !== 'object') return '';
  const code = cur.code || cur.currencyCode || cur.isoCode || cur.symbol || (cur.currency && (cur.currency.code || cur.currency.currencyCode || cur.currency.symbol));
  return typeof code === 'string' || typeof code === 'number' ? String(code).trim() : '';
};
AL.money = (v, cur) => {
  if (v && typeof v === 'object') v = v.amount ?? v.value ?? v.decimal ?? (typeof v.toString === 'function' ? v.toString() : v);
  const n = v == null || v === '' ? NaN : Number(v);
  if (!Number.isFinite(n)) return '—';
  const code = AL.currencyCode(cur);
  return `${n < 0 ? '-' : ''}${code ? `${code} ` : '$'}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
AL.num = (v, d = 0) => (v == null || v === '' || !Number.isFinite(Number(v)) ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
AL.date = (v) => { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
AL.dateTime = (v) => { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
AL.plural = (n, w) => `${n} ${n === 1 ? w : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`}`;

// ------------------------------------------------------------------------------------------------ data with states
/** A cached load: returns { state: 'loading'|'ok'|'error', data, error }. Loads once; AL.run(key) reloads. */
AL.res = (key, fetcher) => {
  let e = AL.cache[key];
  if (!e) { e = AL.cache[key] = { state: 'loading', data: null, error: null, fetcher }; AL.run(key); }
  if (fetcher) e.fetcher = fetcher;
  return e;
};
AL.run = (key) => {
  const e = AL.cache[key];
  if (!e || !e.fetcher) return Promise.resolve();
  e.state = 'loading'; e.error = null;
  return (e.pending = Promise.resolve()
    .then(async () => {
      for (let i = 0; i < 100 && !AL.http(); i++) await new Promise((r) => setTimeout(r, 100));
      // a load cut off in transit (the first page after signing in, a dev-server rebuild) is tried once more
      try { return await e.fetcher(); } catch (err) {
        if (!(err && (err.status === 0 || /network|failed to fetch|load failed/i.test(String(err.message || err))))) throw err;
        await new Promise((r) => setTimeout(r, 1500));
        return e.fetcher();
      }
    })
    .then((d) => { e.data = d; e.state = 'ok'; })
    .catch((err) => { e.error = AL.msg(err); e.state = 'error'; })
    .finally(() => AL.redraw()));
};
AL.invalidate = (...keys) => keys.forEach((k) => { delete AL.cache[k]; });
AL.redraw = () => { if (AL.pages[state.page] && typeof render === 'function') render(); };
AL.gate = (entry, opts = {}) => {
  if (!entry || entry.state === 'loading') return `<div class="al-state" role="status">${ae(opts.loading || 'Loading…')}</div>`;
  if (entry.state === 'error' && /not include|forbidden|insufficient|not authori|access denied|403/i.test(entry.error || '')) return `<div class="al-state al-denied" role="alert"><strong>You do not have access to this</strong><p>Your role does not include it. Ask an administrator if you need it.</p></div>`;
  if (entry.state === 'error') return `<div class="al-state al-error" role="alert"><strong>${ae(opts.errorTitle || 'This could not be loaded')}</strong><p>${ae(entry.error)}</p><button class="v28-btn" data-al="retry" data-key="${ae(opts.key || '')}">Try again</button></div>`;
  return '';
};
AL.actions.retry = (el) => AL.run(el.dataset.key);
/** The signed-in user's Accounting permissions (GET /accounting/me): screens offer only what the server will accept. */
AL.meLoad = () => AL.res('me', () => AL.get('/accounting/me'));
AL.can = (...keys) => { const e = AL.meLoad(); const held = (e.state === 'ok' && e.data && e.data.keys) || []; return keys.some((k) => held.includes(k)); };
/** The signed-in user's role is exactly CEO (GET /accounting/me roleCode). CEO View is gated on this, not on a
 *  broad accounting read key, so it is visible/openable to the CEO alone. */
AL.isCeo = () => { const e = AL.meLoad(); return !!(e.state === 'ok' && e.data && String(e.data.roleCode || '').toUpperCase() === 'CEO'); };

/** Real per-page view access (design-refs/accounting-sweep/RBAC.md), replacing the vendored runtime's own nav
 *  permission check: it filtered by a demo "role simulator" (`state.role`, read from localStorage, defaulting to a
 *  permissive persona) that was never wired to the signed-in user, so every real user — including someone with no
 *  Accounting access at all — saw and could open every page in the sidebar, landing on a page that only then said
 *  "you do not have access to this" once its own data load failed. Pages the live layer added later (CEO, Timesheets,
 *  Payment Runs, Scheduled Jobs, Employee Claims, Trial Balance, Recurring) had no entry in that map at all, so they
 *  were shown to literally everyone regardless of role — a second copy of the same gap. */
AL.READ_ANY = ['view_accounting', 'manage_accounting', 'view_ledger', 'manage_ledger', 'view_financial_reports'];
AL.PAGE_VIEW_KEYS = {
  timesheets: ['accounting.timesheets.view', 'accounting.timesheets.manage', 'manage_accounting'],
};
AL.pageAllowed = (id) => {
  if (id === 'claims') return true; // every staff member's own claims; no accounting key needed (route is exempt from the guard)
  if (id === 'ceo') return AL.isCeo(); // CEO View: restricted to the CEO role only, not the general accounting read grant
  // A failed or pending access request is not a denial. Keep the requested route while the API
  // is unavailable; its own data load can show the network error and the server still guards writes.
  const access = AL.meLoad();
  if (access.state !== 'ok') return true;
  return AL.can(...(AL.PAGE_VIEW_KEYS[id] || AL.READ_ANY));
};
(() => {
  // Hide CEO View from the very first paint: before /accounting/me resolves the role is unknown, and the vendored
  // permissive check would otherwise flash "CEO View" to non-CEOs for ~1s until the override below lands. Special-case
  // only 'ceo' here (hidden until AL.isCeo() confirms it); every other page keeps the existing check during the load.
  try { if (typeof permittedPage === 'function') { const prev = permittedPage; permittedPage = (id) => (id === 'ceo' ? AL.isCeo() : prev(id)); } } catch (_) { /* runtime not ready yet */ }
  const e = AL.meLoad(); // kick off now, not on first page render, so the sidebar is right before anyone clicks anything
  const fix = () => { try { if (typeof permittedPage === 'function') permittedPage = (id) => AL.pageAllowed(id); if (typeof render === 'function') render(); } catch (_) { /* runtime not ready yet */ } };
  if (e.state === 'ok' || e.state === 'error') fix(); else if (e.pending) e.pending.then(fix);
})();

// ------------------------------------------------------------------------------------------------ markup (v28 look)
AL.btn = (label, act, kind = '', attrs = '') => `<button class="v28-btn ${kind}" data-al="${ae(act)}" ${attrs}>${ae(label)}</button>`;
AL.head = (eye, title, sub, actions = '') => `<div class="v28-hero"><div><div class="v28-eyebrow">${ae(eye)}</div><h1>${ae(title)}</h1>${sub ? `<p>${ae(sub)}</p>` : ''}</div><div class="v28-hero-actions">${actions}</div></div>`;
AL.panel = (title, sub, body, actions = '') => `<section class="v28-panel"><header class="v28-panel-head"><div><h3>${ae(title)}</h3>${sub ? `<p>${ae(sub)}</p>` : ''}</div>${actions ? `<div class="v28-actions">${actions}</div>` : ''}</header><div class="v28-panel-body">${body}</div></section>`;
AL.kpi = (label, value, sub, accent = '#0878f6') => `<div class="v28-kpi" style="--accent:${accent}"><span>${ae(label)}</span><strong>${ae(value)}</strong><small>${ae(sub || '')}</small></div>`;
AL.kpis = (list) => `<div class="v28-kpis">${list.map((k) => AL.kpi(k[0], k[1], k[2], k[3])).join('')}</div>`;
AL.status = (s, tone) => { const t = tone || (/fail|error|overdue|exception|void|blocked|rejected|off/i.test(s) ? 'bad' : /running|pending|draft|due|warn|review|paused|never/i.test(s) ? 'warn' : /succeed|ok|posted|active|approved|complete|on|recorded|settled/i.test(s) ? 'ok' : 'info'); return `<span class="v28-status ${t}"><i class="v28-dot"></i>${ae(s)}</span>`; };
AL.statusRows = (rows) => `<div class="al-status-rows">${(rows || []).map((r) => `<div class="al-status-row"><span>${ae(r[0])}</span><strong>${typeof r[1] === 'string' && r[1].includes('<') ? r[1] : ae(r[1] == null ? '—' : r[1])}</strong><small>${ae(r[2] == null ? '' : r[2])}</small></div>`).join('')}</div>`;
/** Header alignment follows the data cells: a numeric column (`<td class="num">`) right-aligns its header too, so the
 *  header stays inline with its values instead of being guessed from the header text (which missed labels like
 *  "Revenue", "Net income", "Margin", "Assets", "Equity"). When the first data row's cell count matches the headers we
 *  read per-column alignment from it; otherwise we fall back to the old keyword guess. */
AL.table = (headers, rows, min = '900px') => {
  const firstRow = /<tr[\s\S]*?<\/tr>/i.exec(rows || '');
  const cells = firstRow ? [...firstRow[0].matchAll(/<td([^>]*)>/gi)] : [];
  const numCols = cells.length === headers.length ? cells.map((m) => /\bnum\b/i.test(m[1])) : null;
  const isNum = (i) => (numCols ? numCols[i] : /amount|value|total|rate|balance|principal|interest/i.test(headers[i]));
  return `<div class="v28-tablewrap"><table class="v28-table" style="min-width:${min}"><thead><tr>${headers.map((h, i) => `<th${isNum(i) ? ' class="num"' : ''}>${ae(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="al-empty-cell">Nothing here yet.</td></tr>`}</tbody></table></div>`;
};
AL.empty = (msg) => `<div class="al-empty">${ae(msg)}</div>`;

// ------------------------------------------------------------------------------------------------ export (PDF / Excel / CSV)
/** Lucide outline glyphs for the export buttons (FileText, FileSpreadsheet, Download), inlined so the layer needs no icon
 *  font or bundle: a page header shows the same three controls everywhere. */
AL.EXPORT_ICONS = {
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
  excel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/></svg>',
  csv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
};
AL.EXPORT_FORMATS = [['pdf', 'PDF', 'a printable PDF'], ['excel', 'Excel', 'an Excel workbook'], ['csv', 'CSV', 'a CSV file']];
/** The three export controls as one group for a page header's top-right corner. Each button runs `act` with the format in
 *  data-fmt, so a page defines one handler and says what it exports. */
AL.exportBtns = (act) => `<div class="al-export" role="group" aria-label="Export this page">${AL.EXPORT_FORMATS.map(([fmt, label, what]) => `<button type="button" class="v28-btn icon al-export-btn" data-al="${ae(act)}" data-fmt="${fmt}" title="Export as ${label}" aria-label="Export as ${label} — ${what}">${AL.EXPORT_ICONS[fmt]}</button>`).join('')}</div>`;
/** Hand the page's export spec to the host (lib/accounting-v52/export.ts), which writes the file and brands the PDF for
 *  the deployment it runs in. Returns the saved file's name. */
AL.exportFile = (kind, spec) => {
  const fn = window.__AC52_EXPORT__;
  if (typeof fn !== 'function') throw new Error('Export is not ready on this page yet — reload and try again.');
  return fn(kind, spec);
};
/** Run one export button: busy while the file is written, then say what was saved (and how many rows of what). */
AL.exportRun = (el, spec, what) => AL.busy(el, () => AL.exportFile(el.dataset.fmt, spec), ['Exported', (name) => `${spec.rows.length} ${spec.rows.length === 1 ? what.replace(/s$/, '') : what} saved as ${name}.`]);

// ------------------------------------------------------------------------------------------------ forms and dialogs
/** AL.form({ title, sub, fields:[{k,label,type,options,required,hint,min,max,step}], submitLabel, initial, onSubmit(values) }) */
AL.field = (f, v) => {
  const val = v == null ? '' : v;
  const req = f.required ? ' required' : '';
  let ctl;
  if (f.type === 'select') {
    const opt = (o) => { const ov = typeof o === 'object' ? o.value : o, ol = typeof o === 'object' ? o.label : o; return `<option value="${ae(ov)}"${String(ov) === String(val) ? ' selected' : ''}>${ae(ol)}</option>`; };
    // `groups` is [{label, options}] rendered as <optgroup>s — for a list too long to scan flat. It takes precedence
    // over `options`, so a control can be filled in place once its data lands.
    const inner = f.groups ? f.groups.map((g) => `<optgroup label="${ae(g.label)}">${(g.options || []).map(opt).join('')}</optgroup>`).join('') : (f.options || []).map(opt).join('');
    ctl = `<select class="v28-select" name="${ae(f.k)}"${req}>${f.blank !== false ? `<option value="">${ae(f.blankLabel || (f.required ? 'Choose…' : '— none —'))}</option>` : ''}${inner}</select>`;
  } else if (f.type === 'textarea') ctl = `<textarea class="v28-input" name="${ae(f.k)}" rows="${f.rows || 3}"${req}>${ae(val)}</textarea>`;
  else if (f.type === 'checkbox') return `<label class="v28-field al-check"><input type="checkbox" name="${ae(f.k)}"${val ? ' checked' : ''}> ${ae(f.label)}</label>`;
  else ctl = `<input class="v28-input" name="${ae(f.k)}" type="${ae(f.type || 'text')}" value="${ae(val)}"${req}${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}${f.step != null ? ` step="${f.step}"` : ''}${f.placeholder ? ` placeholder="${ae(f.placeholder)}"` : ''}>`;
  // `cols` spans a field over N of the form's grid columns. The vendored form grid is 3 columns and `al-wide` means
  // "take the whole row", so a field that only needs two of them used to strand its neighbour in an empty third.
  return `<label class="v28-field${f.wide ? ' al-wide' : ''}"${f.cols ? ` style="grid-column:span ${Number(f.cols) || 1}"` : ''}><span>${ae(f.label)}${f.required ? ' *' : ''}</span>${ctl}${f.hint ? `<small class="v28-sub">${ae(f.hint)}</small>` : ''}</label>`;
};
AL.close = () => {
  const returnDetailId = AL.coaReturnDetailId;
  AL.coaReturnDetailId = null;
  document.querySelectorAll('#alOverlay').forEach((n) => n.remove());
  if (returnDetailId && AL.actions['coa-detail']) AL.actions['coa-detail']({ dataset: { id: returnDetailId } });
};
AL.form = (o) => {
  AL.close();
  const init = o.initial || {};
  const body = `<form id="alForm" class="v28-form-grid" novalidate>${o.before || ''}${(o.fields || []).map((f) => AL.field(f, init[f.k])).join('')}${o.extra || ''}</form><div id="alFormError" class="al-form-error" role="alert" hidden></div>`;
  const root = document.querySelector('.accounting-v52-root') || document.body;
  root.insertAdjacentHTML('beforeend', `<div class="v28-modal-backdrop" id="alOverlay"><section class="v28-modal${o.wide ? ' al-modal-wide' : ''}" role="dialog" aria-modal="true"><header><div><h2>${ae(o.title)}</h2>${o.sub ? `<p>${o.sub}</p>` : ''}</div><button class="v28-btn icon" data-al="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></header><div class="v28-modal-body">${body}</div><footer class="v28-modal-foot">${o.viewOnly ? '' : '<button class="v28-btn" data-al="close">Cancel</button>'}<button class="v28-btn ${o.danger ? 'danger' : 'primary'}" data-al="form-submit">${ae(o.submitLabel || 'Save')}</button></footer></section></div>`);
  AL.formSpec = o;
  const first = root.querySelector('#alForm input, #alForm select, #alForm textarea'); if (first) first.focus();
};
AL.values = (form, fields) => {
  const out = {};
  for (const f of fields) { const el = form.elements[f.k]; if (!el) continue; out[f.k] = f.type === 'checkbox' ? el.checked : (typeof el.value === 'string' ? el.value.trim() : el.value); }
  return out;
};
AL.formError = (m) => { const el = document.getElementById('alFormError'); if (!el) { AL.toast('Not saved', m, 'bad'); return; } el.hidden = false; el.textContent = m; };
AL.actions.close = () => AL.close();
AL.actions['form-submit'] = async (el) => {
  const o = AL.formSpec; const form = document.getElementById('alForm');
  if (!o || !form || el.disabled) return;
  for (const f of o.fields || []) { const c = form.elements[f.k]; if (f.required && c && f.type !== 'checkbox' && !String(c.value || '').trim()) { AL.formError(`${f.label} is required.`); try { c.focus(); } catch (_) { /* n/a */ } return; } }
  const values = AL.values(form, o.fields || []);
  const bad = o.validate && o.validate(values);
  if (bad) { AL.formError(bad); return; }
  el.disabled = true; el.classList.add('al-busy');
  try {
    const r = await o.onSubmit(values);
    AL.close();
    // a dialog that only shows something (history, details) closes without announcing a save
    if (r !== false) { AL.toast(o.doneTitle || 'Saved', (typeof r === 'string' && r) || o.doneMessage || '', ''); AL.loadNavCounts(); }
    if (o.after) await o.after(r);
  } catch (e) { AL.formError(AL.msg(e)); }
  finally { el.disabled = false; el.classList.remove('al-busy'); }
};
/** A confirmation, with an optional reason. */
AL.confirm = (o) => AL.form({ title: o.title, sub: o.sub, danger: o.danger, submitLabel: o.confirmLabel || 'Confirm', doneTitle: o.doneTitle, doneMessage: o.doneMessage, after: o.after,
  fields: o.reason ? [{ k: 'reason', label: o.reason === true ? 'Reason' : o.reason, type: 'textarea', required: o.reasonRequired !== false, wide: true }] : [],
  extra: o.body ? `<p class="v28-sub al-wide">${ae(o.body)}</p>` : '', onSubmit: o.onConfirm });
/** A button that calls the server: shows it is working until the answer, then says what happened. */
AL.busy = async (el, fn, ok) => {
  if (el.disabled) return;
  el.disabled = true; el.classList.add('al-busy');
  try { const r = await fn(); if (ok) { AL.toast(ok[0], typeof ok[1] === 'function' ? ok[1](r) : ok[1] || '', ''); AL.loadNavCounts(); } return r; }
  catch (e) { AL.toast('Not done', AL.msg(e), 'bad'); }
  finally { el.disabled = false; el.classList.remove('al-busy'); }
};

// ------------------------------------------------------------------------------------------------ events
window.addEventListener('click', (ev) => {
  const t = ev.target && ev.target.closest && ev.target.closest('[data-al]');
  if (!t || !t.closest('.accounting-v52-root')) return;
  const fn = AL.actions[t.dataset.al];
  if (!fn) return;
  ev.preventDefault(); ev.stopPropagation();
  Promise.resolve(fn(t, ev)).catch((e) => AL.toast('Something went wrong', AL.msg(e), 'bad'));
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('alOverlay')) AL.close(); }, true);

// ------------------------------------------------------------------------------------------------ pages
/** Register a live page: the runtime's page table calls it; the page's own wire step runs after it is drawn. */
AL.page = (id, fn) => {
  AL.pages[id] = fn;
  const draw = () => {
    let html;
    try { html = fn(); } catch (e) { html = `<div class="v28-page"><div class="al-state al-error"><strong>This page could not be drawn</strong><p>${ae(AL.msg(e))}</p></div></div>`; if (window.console) console.error('[acc-live]', id, e); }
    // after the runtime has inserted the markup (a timer, not an animation frame: frames never fire in a hidden tab)
    if (AL.wire[id]) setTimeout(() => { try { AL.wire[id](); } catch (e) { if (window.console) console.error('[acc-live wire]', id, e); } }, 0);
    // an older layer injects a decorative "spotlight" (fixed figures and charts) into pages that have none; a live page
    // carries an empty one so nothing is injected
    return `${html}<section class="v35-spotlight" hidden aria-hidden="true"></section>`;
  };
  // later layers of the runtime re-install their own page on a timer (e.g. recurring, 600 ms after load); a live page
  // keeps its place: assignments to it are ignored
  try { Object.defineProperty(pages, id, { get: () => draw, set: () => {}, configurable: true, enumerable: true }); } catch (_) { pages[id] = draw; }
};
/** Sidebar counts: what is waiting for this user, from /accounting/me/counts (the runtime counted its own hydrated
 *  copies, which went stale, and its reconciliation count came from demo statement lines). Refreshed every minute and
 *  after each save. */
AL.navCounts = null;
AL.loadNavCounts = async () => {
  try { AL.navCounts = await AL.get('/accounting/me/counts'); if (typeof renderNav === 'function') renderNav(); } catch (_) { /* keep the last counts */ }
};
try {
  const baseNavCount = navCount;
  navCount = (id) => {
    const c = AL.navCounts;
    if (c && Object.prototype.hasOwnProperty.call(c, id)) { const v = c[id]; return typeof v === 'number' && v > 0 ? String(v) : ''; }
    if (AL.suppressFallbackNavCount && AL.suppressFallbackNavCount.has(id)) return '';
    return baseNavCount(id);
  };
  setTimeout(AL.loadNavCounts, 1200);
  setInterval(AL.loadNavCounts, 60000);
} catch (e) { if (window.console) console.warn('[acc-live] sidebar counts not taken over', e); }

/** Add a sidebar entry to a group (after `after`, or at the end). */
AL.navAdd = (group, item, after) => {
  const g = navGroups.find((x) => x[0] === group); if (!g || g[1].some((x) => x[0] === item[0])) return;
  const i = after ? g[1].findIndex((x) => x[0] === after) : -1;
  if (i >= 0) g[1].splice(i + 1, 0, item); else g[1].push(item);
};
AL.go = (page) => { const nav = window.__ACCOUNTING_V52_NAV__; state.page = page; if (typeof nav === 'function') { try { nav(page); } catch (_) { /* host */ } } render(); };
