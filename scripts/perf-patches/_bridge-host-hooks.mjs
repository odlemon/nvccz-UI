/**
 * Host hooks — not a page.
 *
 * Publishes three of the runtime's own internal functions on `window` so the React host can
 * reuse them instead of reimplementing them:
 *
 *   __PERF_TOAST__           the runtime's `toast(title, body)` — so a live write reports
 *                            success in the module's own toast, in the module's own style
 *   __PERF_CLOSE_OVERLAYS__  `closeOverlays()` — so a modal closes after its form is saved
 *   __PERF_RENDER__          `render()` — a manual repaint, for a write that changes state
 *                            the live-data event does not cover
 *
 * Why they were not already available: `toast` and `closeOverlays` are declared inside
 * `startPerformanceV22Runtime`, so nothing outside that closure can reach them. Only
 * `window.toast?.()` was ever referenced (L2282), by a layer that assumed a global that does
 * not exist — that call has always been a no-op.
 *
 * Anchored on the tail of `bridge-readers-2`, which the built-in patches apply first, so the
 * ordering is deterministic on a rebuild from a clean checkout. Function declarations hoist
 * within the runtime's scope, so referencing `toast`/`closeOverlays`/`render` here — before
 * their declarations further down the file — is safe; the wrappers are only ever CALLED
 * later, from a click handler.
 *
 * The filename starts with `_` so it sorts before the page files: these globals must exist
 * before anything that depends on them.
 */
const ANCHOR =
  "window.__PERF_HELPERS__ = { __perfCount, __perfNum, __perfTally, __perfDate, __perfLabel, __perfEmptyRow, __perfNoSeries, __perfPct, __perfSum };"

export default [
  {
    label: "bridge-host-hooks",
    find: ANCHOR,
    repl:
      ANCHOR +
      "\n/* patched:bridge-host-hooks */\n" +
      "// Each wrapper is defensive: a host action must never break because a runtime helper\n" +
      "// moved or a layer replaced it. A missing toast is a cosmetic loss; a thrown error in a\n" +
      "// click handler would abort the write path that called it.\n" +
      "window.__PERF_TOAST__ = function (title, body) {\n" +
      "  try { if (typeof toast === 'function') toast(title, body); } catch (_) {}\n" +
      "};\n" +
      "window.__PERF_CLOSE_OVERLAYS__ = function () {\n" +
      "  try { if (typeof closeOverlays === 'function') closeOverlays(); } catch (_) {}\n" +
      "};\n" +
      "window.__PERF_RENDER__ = function () {\n" +
      "  try { if (typeof render === 'function') render(); } catch (_) {}\n" +
      "};",
  },
]
