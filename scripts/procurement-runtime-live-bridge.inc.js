/**
 * Procurement V23 runtime live bridge.
 *
 * Injected into components/procurement-v23-mock/matanho-procurement-runtime.js by
 * scripts/patch-procurement-runtime.mjs, inside startProcurementV23Runtime's scope and ahead
 * of the first page renderer. Do NOT edit the runtime by hand — edit this file (or the patch
 * script) and re-run the patch, so a fresh extract can always be re-patched reproducibly.
 *
 * Everything between the BEGIN/END markers is copied verbatim. The patch script fills the
 * `__PR23_LITERAL_KPIS__` placeholder with the fixture KPI literals found in the runtime.
 */

/* BEGIN_PROCUREMENT_LIVE_BRIDGE */

/**
 * Live figures from the React host (lib/procurement-v23/live-loaders.ts): `kpis` keyed by card
 * label and `navCounts` keyed by page id. The host sets an empty placeholder before the runtime
 * starts, so a live session never paints a fixture figure even before the first load lands.
 */
function __pr23Live() {
  return (typeof window !== 'undefined' && window.__pr23Live) || null;
}

/** "label|value" for every KPI card whose value is a literal in the vendored runtime. */
const __PR23_LITERAL_KPIS = new Set(/*__PR23_LITERAL_KPIS__*/[]);

/**
 * A KPI card's value and sub-text in a live session:
 *  - a label the loaders can answer gets the live figure and its stated derivation;
 *  - a card whose value is a fixture literal gets an em dash and says there is no source;
 *  - a card the runtime computes from state (already live data) passes through untouched.
 */
function __pr23Kpi(label, value, sub) {
  const live = __pr23Live();
  if (!live) return [value, sub];
  const known = live.kpis && live.kpis[label];
  if (known) return [known.value, known.sub];
  if (__PR23_LITERAL_KPIS.has(label + '|' + String(value))) return ['—', 'No live source for this figure yet'];
  return [value, sub];
}

/** Sidebar badge for a page: the live count, or no badge at all. Never the fixture count. */
function __pr23NavCount(pageId, fixtureCount) {
  const live = __pr23Live();
  if (!live) return fixtureCount;
  const n = live.navCounts && live.navCounts[pageId];
  return n ? String(n) : '';
}

/* END_PROCUREMENT_LIVE_BRIDGE */
