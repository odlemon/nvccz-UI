/**
 * Document Vault (`/performance/vault`).
 *
 * LIVE RENDERER — established by tracing the override chain, not by grepping:
 *   `function vault(){…}` is declared once, then REASSIGNED later by a sibling layer
 *   (`const _vault = vault; vault = function(){…}`). The reassignment wins, so the live
 *   renderer is the reassigned one. The two are near-identical; the reliable tell is the
 *   folder bar — the dead one lists 8 folders, the live one 9 (it adds "Performance
 *   Reports"), and `.perf-dumps/a5/sysadmin__vault.txt` shows 9. The table-tools also differ
 *   only by `padding-top:14px` vs `12px`, which is why the row anchor below is anchored from
 *   `padding-top:12px` — `<tbody id="documentRows">${docs.map(docRow).join('')}</tbody>` alone
 *   matches BOTH generations and would have patched the dead one.
 *
 * WHAT WAS FABRICATED
 *   `state.docs` — seven invented controlled documents (FY2026 Strategy v3.0, a performance
 *   contract, a mid-year review, a Q2 evidence pack, a compliance report, a review template,
 *   a personal contract) each with an invented version, owner, updated date and retention
 *   class, and a full body of invented narrative content.
 *
 *   They did not actually appear on screen, and that was an accident, not a fix: `visibleDocs()`
 *   branches on `state.role` against the runtime's five DEMO role labels ('SysAdmin',
 *   'HR/M&E Manager', …). Since the real-role patch replaced those with the signed-in user's
 *   actual role name ("System Administrator"), every branch fell through to `return []`. The
 *   vault therefore showed "0 documents" — the right number for the wrong reason, and it
 *   would have shown seven fabricated rows again the moment role mapping changed. It also
 *   showed a bare header with no body at all, so an empty vault was indistinguishable from a
 *   broken one.
 *
 * WHAT IT SHOWS NOW
 *   Rows and the "N documents" badge come from `GET /performance/documents` (`documents`
 *   scope) — a table built for this module and round-tripped create/read/update/delete
 *   against the live API, so 0 rows is a TRUE empty state and says so, distinctly from
 *   "could not load".
 *   Folder, version, owner, status, updated and retention are the record's own fields.
 *
 * STILL UNSOURCED (backend gaps, reported upward):
 *   - the API returns no per-document permission, so the Access column ("Edit + Preview" /
 *     "Preview only") has no source; it is a dash rather than a guess. The runtime's own
 *     `canEditDoc()` cannot stand in — it is keyed on the demo role labels and returns false
 *     for every real role.
 *   - no document action is on the host's `API_ACTIONS` allowlist, so Preview/Edit would be
 *     mock-only buttons over a real record. The Actions cell is a dash until a read path for
 *     the stored file exists.
 *   - the folder bar is the module's fixed taxonomy, not `documentFolders` — the endpoint
 *     returns only folders that already hold a document (currently none), and driving the
 *     filter bar off it would leave the user with no folders to filter by.
 */

// 4-space indent: this is the reassigned (live) `vault = function(){…}`. The dead declaration
// uses a single space, so this anchor cannot hit it.
const BASEDOCS_ANCHOR = "    const baseDocs=visibleDocs();"

const BASEDOCS = `    /* patched:vault-live-docs */
    // Was \`visibleDocs()\`, a role filter over seven invented documents. The vault now reads
    // the real register; \`__perfScope\` returns null while loading or on error, which the
    // empty row below reports as "unavailable" rather than as "empty".
    const __docRows = __perfScope('documents');
    const baseDocs = (__docRows || []).map(d => ({
      id: d.id,
      name: d.name,
      folder: d.folder || d.category || null,
      category: d.category || null,
      version: d.version || null,
      owner: d.owner || d.uploadedBy || null,
      status: d.status || null,
      updated: d.updatedAt || d.createdAt || null,
      retentionUntil: d.retentionUntil || null,
      mimeType: d.mimeType || null,
    }));`

const TABLE_ANCHOR =
  "style=\"padding-top:12px\"><input id=\"docSearch\" placeholder=\"Search documents, IDs or owners\">" +
  "<select><option>All statuses</option><option>Draft</option><option>In Review</option><option>Approved</option></select>" +
  "<select><option>All retention classes</option><option>7 years</option><option>Employment + 7 years</option></select>" +
  "<div style=\"margin-left:auto\">${badge(`${docs.length} documents`)}</div></div>" +
  "<div class=\"table-wrap\"><table><thead><tr><th>Document</th><th>Folder</th><th>Version</th><th>Owner</th><th>Status</th>" +
  "<th>Updated</th><th>Retention</th><th>Access</th><th>Actions</th></tr></thead>" +
  "<tbody id=\"documentRows\">${docs.map(docRow).join('')}</tbody></table></div></section></div>`;"

// `docRow` is not reused: it reads `d.type.includes(…)`, `d.updated` and `d.retention` — three
// fields the API does not return — and would throw on a real record. The row is built here
// instead, from the fields the endpoint actually supplies.
const TABLE =
  "style=\"padding-top:12px\"><input id=\"docSearch\" placeholder=\"Search documents, IDs or owners\">" +
  "<select><option>All statuses</option><option>Draft</option><option>In Review</option><option>Approved</option></select>" +
  "<select><option>All retention classes</option><option>7 years</option><option>Employment + 7 years</option></select>" +
  "<div style=\"margin-left:auto\">${/* patched:vault-rows */badge(__docRows===null?__perfDash()+' documents':docs.length+' documents')}</div></div>" +
  "<div class=\"table-wrap\"><table><thead><tr><th>Document</th><th>Folder</th><th>Version</th><th>Owner</th><th>Status</th>" +
  "<th>Updated</th><th>Retention</th><th>Access</th><th>Actions</th></tr></thead>" +
  "<tbody id=\"documentRows\">${(() => {\n" +
  "      if (__docRows === null || docs.length === 0) return __perfEmptyRow('documents', 9, 'documents');\n" +
  "      const kind = (m) => /pdf/i.test(String(m || '')) ? 'pdf' : 'doc';\n" +
  "      return docs.map(d => '<tr data-id=\"' + esc(d.id) + '\">'\n" +
  "        + '<td><div class=\"cell-main\"><span class=\"document-type ' + kind(d.mimeType) + '\">'\n" +
  "          + (kind(d.mimeType) === 'pdf' ? 'PDF' : 'DOC') + '</span><div class=\"cell-copy\"><strong>'\n" +
  "          + esc(d.name) + '</strong><span>' + esc(d.id) + ' \\u00b7 ' + (d.category ? esc(d.category) : __perfDash()) + '</span></div></div></td>'\n" +
  "        + '<td>' + (d.folder ? esc(d.folder) : __perfDash()) + '</td>'\n" +
  "        + '<td>' + (d.version ? esc(d.version) : __perfDash()) + '</td>'\n" +
  "        + '<td>' + (d.owner ? esc(d.owner) : __perfDash()) + '</td>'\n" +
  "        + '<td>' + badge(__perfLabel(d.status)) + '</td>'\n" +
  "        + '<td>' + __perfDate(d.updated) + '</td>'\n" +
  "        + '<td>' + __perfDate(d.retentionUntil) + '</td>'\n" +
  "        // No per-document permission is returned, and no document action is routed to the\n" +
  "        // API yet, so neither an access badge nor a working button can be shown honestly.\n" +
  "        + '<td>' + __perfDash() + '</td>'\n" +
  "        + '<td>' + __perfDash() + '</td>'\n" +
  "        + '</tr>').join('');\n" +
  "    })()}</tbody></table></div></section></div>`;"

export default [
  { label: "vault-live-docs", find: BASEDOCS_ANCHOR, repl: BASEDOCS },
  { label: "vault-rows", find: TABLE_ANCHOR, repl: TABLE },
  {
    label: "vault-upload-modal",
    find: "function newDoc(){modal('New Performance Document','Create a controlled, versioned document from a blank page or template.',`<form id=\"newDocForm\" class=\"form-grid\"><div class=\"field full\"><label>Document title</label><input name=\"title\" required></div><div class=\"field\"><label>Folder</label><select name=\"folder\"><option>Performance Contracts</option><option>Reviews</option><option>KPI Evidence</option><option>Compliance Reports</option><option>Templates</option></select></div><div class=\"field\"><label>Template</label><select><option>Blank controlled document</option><option>Performance Review Template</option><option>Compliance Report Template</option><option>Performance Contract Template</option></select></div><div class=\"field\"><label>Owner</label><input name=\"owner\" value=\"${esc(state.role)}\"></div><div class=\"field\"><label>Retention</label><select><option>7 years</option><option>Employment + 7 years</option><option>Active + superseded</option></select></div><div class=\"field full\"><label>Audience</label><input value=\"HR / Executive\"></div></form>`,btn('Cancel','close-overlays')+btn('Create document','save-new-doc','primary','file'))}",
    repl: "function newDoc(){/* patched:vault-upload-modal */\n  // Was a 'blank page or template' text-document form with no file input at all - the\n  // backend model stores an uploaded file (fileUrl/mimeType/fileSizeBytes), not drafted\n  // text, so the old form could never have produced a record the API would accept. The\n  // folder vocabulary now matches the model's own note (Contracts / Reviews / Evidence /\n  // Policies) instead of an invented five-option list.\n  modal('Upload Performance Document','Add a file to the controlled document vault.',\n    '<form id=\"newDocForm\" class=\"form-grid\" enctype=\"multipart/form-data\">'\n    + '<div class=\"field full\"><label>File</label><input type=\"file\" name=\"file\" required></div>'\n    + '<div class=\"field full\"><label>Document name</label><input name=\"name\"></div>'\n    + '<div class=\"field\"><label>Folder</label><select name=\"folder\">'\n    + '<option>Contracts</option><option>Reviews</option><option>Evidence</option><option>Policies</option>'\n    + '</select></div>'\n    + '<div class=\"field\"><label>Category</label><input name=\"category\" placeholder=\"Optional\"></div>'\n    + '</form>',\n    btn('Cancel','close-overlays')+btn('Upload','submit-document-upload','primary','file'));\n}",
  },
]
