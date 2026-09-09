/**
 * Performance Contracts (`/performance/contracts`).
 *
 * LIVE RENDERER — `contractsPage()` in the **v13** layer, whose own `render()` override
 *   returns early on `state.page==='contracts'`:
 *     `render=function(){if(state.page==='contracts'){…w.innerHTML=contractsPage();…return}…}`
 *   Traced, not grepped: an earlier v8 generation renders the same page with `kpiV8(...)`
 *   cards and is dead — `patch-performance-runtime.mjs` §15 patched it first and the screen
 *   did not change, which is why §16 exists. The v13 function is the one carrying the
 *   `/* patched:contracts-live-kpi-N *\/` markers whose output the dump shows
 *   ("Contract coverage — Not yet tracked", "Approved 0 · None created yet").
 *
 * ALREADY DONE ELSEWHERE (do not re-patch): both KPI strips —
 *   `contracts-kpi-1..6` (dead v8 layer) and `contracts-live-kpi-1..6` (this layer) — live in
 *   `scripts/patch-performance-runtime.mjs`.
 *
 * WHAT WAS FABRICATED (the registry table, everything below the KPI strip)
 *   Five invented contracts — CTR-2026-014/019/021/025 and MY-CTR-2026-001 — each with an
 *   invented employee and job title, department, line manager, an identical
 *   "01 Jan – 31 Dec 2026" review period, a weight total of 100% summed from four invented
 *   objectives, an evidence percentage (94 / 98 / 82 / 91 / 76%), a workflow status and a
 *   version string (v1.2, v1.0, Draft 2, v1.1, Draft 1).
 *
 *   `performance_contracts` has 0 rows. The KPI cards directly above the table already said
 *   "Approved 0 · None created yet" while the table underneath listed five contracts — the
 *   page contradicted itself on screen.
 *
 * WHAT IT SHOWS NOW
 *   Rows come from the live `contracts` scope (`GET /api/performance/contracts` -> `data`).
 *   The contract name and its workflow status are real. Employee, department, manager, review
 *   period, weight total, evidence coverage and version are em dashes: `adaptNamed()` reduces
 *   every contract to `{id, name, description, status}`, so the scope carries nothing else.
 *   An empty register now says so, and distinguishes "none created yet" from "could not load".
 *
 * STILL WITHOUT A SOURCE (reported, not invented)
 *   - Employee / department / manager / period / weight / evidence / version columns.
 *   - The contract detail workspace. A live row's id is not in the v13 fixture collection, so
 *     `S.contracts.find()` misses and the page falls back to the register — no fabricated
 *     detail is ever shown. Wiring it needs a richer contracts scope, not a patch here.
 *   - The FY2026 / FY2025 selector is inert page furniture, not data; left as designed.
 */

const ROWS_HEAD =
  "const q=S.contractSearch.trim().toLowerCase(),rows=S.contracts.filter(c=>!q||[c.id,c.employee,c.department,c.manager,c.status].join(' ').toLowerCase().includes(q));"

const ROWS_HEAD_LIVE =
  "/* patched:contracts-rows */" +
  "// Was S.contracts, a five-row fixture. The registry is the live scope now; S.contracts is\n" +
  "    // left untouched because the document vault syncs contract documents off it and that is\n" +
  "    // another page's problem to solve.\n" +
  "    const q=S.contractSearch.trim().toLowerCase();" +
  "const __cRaw=__perfScope('contracts');" +
  "const rows=(__cRaw||[]).filter(c=>!q||[c.id,c.name,c.status].join(' ').toLowerCase().includes(q));"

const ROW_TEMPLATE =
  "${rows.map(c=>`<tr data-v13-action=\"contract-open\" data-id=\"${c.id}\"><td><strong>${c.id}</strong></td><td>${person(c.employee,c.role)}</td><td>${esc(c.department)}</td><td>${esc(c.manager)}</td><td>${esc(c.period)}</td><td><strong>${c.objectives.reduce((a,o)=>a+Number(o[1]),0)}%</strong></td><td>${esc(c.evidence)}</td><td>${chip(c.status,contractStatusTone(c.status))}</td><td>${esc(c.version)}</td></tr>`).join('')||`<tr><td colspan=\"9\"><div class=\"v13-empty\">No contracts match the current search.</div></td></tr>`}"

// Same nine columns, same order, same `v13-chip` styling. `contractStatusTone()` is not
// reused: it returns 'red' for anything it does not recognise, so a live status of 'draft'
// (lower case, as the API returns it) would have painted every contract as an exception.
const ROW_TEMPLATE_LIVE =
  "${/* patched:contracts-row */rows.map(c=>`<tr data-v13-action=\"contract-open\" data-id=\"${esc(c.id)}\"><td><strong>${esc(c.name||c.id)}</strong></td><td>${__perfDash()}</td><td>${__perfDash()}</td><td>${__perfDash()}</td><td>${__perfDash()}</td><td><strong>${__perfDash()}</strong></td><td>${__perfDash()}</td><td>${c.status?chip(__perfLabel(c.status),/approv/i.test(c.status)?'green':/review/i.test(c.status)?'amber':/draft/i.test(c.status)?'blue':''):__perfDash()}</td><td>${__perfDash()}</td></tr>`).join('')||(q?`<tr><td colspan=\"9\"><div class=\"v13-empty\">No contracts match the current search.</div></td></tr>`:__perfEmptyRow('contracts',9,'performance contracts'))}"

export default [
  { label: "contracts-rows", find: ROWS_HEAD, repl: ROWS_HEAD_LIVE },
  { label: "contracts-row", find: ROW_TEMPLATE, repl: ROW_TEMPLATE_LIVE },
]
