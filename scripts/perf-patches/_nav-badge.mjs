/**
 * Sidebar nav count badge on "Alerts & Audit" — not a page, shared across every page.
 *
 * WHAT WAS FABRICATED
 *   `renderNav()` renders a `<span class="nav-count">` badge on the Alerts & Audit nav item
 *   from `state.notifications`, which is initialised once at `const state = {...}` (near the
 *   top of the file) to the literal `4` and never updated from anywhere — a client-side demo
 *   fixture, not a count of anything real. It shows `4` regardless of how many alerts actually
 *   exist, including when the Alerts & Escalations page itself (already live-wired, see
 *   `perf-patches/alerts.mjs`) correctly shows Critical/Escalated/Resolved all at 0.
 *   Found live on dev, 19 September 2026: the badge read "4" on every page's sidebar while
 *   `/performance/alerts` showed 0 critical, 0 escalated, 0 resolved.
 *
 * WHAT IT SHOWS NOW
 *   The same `alertSummary` scope the Alerts & Escalations page already uses
 *   (`GET /performance/alerts/summary`), critical + escalated (the two "needs attention"
 *   tallies on that page) — a real 0 hides the badge entirely rather than showing a stale
 *   fixture or a bare "0" pill sitting on the nav for no reason. While the scope hasn't loaded
 *   yet or errored, the badge stays hidden rather than guessing.
 *
 * STILL UNSOURCED: none — alertSummary already covers this.
 */
const ANCHOR = `\${p==='alerts'?\`<span class="nav-count">\${state.notifications}</span>\`:''}`

const REPL = `\${p==='alerts'?/* patched:nav-alert-badge */(() => {
  const s = __perfObject('alertSummary');
  if (!s) return '';
  const n = (Number(s.critical) || 0) + (Number(s.escalated) || 0);
  return n > 0 ? \`<span class="nav-count">\${n}</span>\` : '';
})():''}`

export default [
  {
    label: "nav-alert-badge",
    find: ANCHOR,
    repl: REPL,
  },
]
