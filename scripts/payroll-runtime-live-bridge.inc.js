/**
 * Payroll V6 runtime live bridge.
 *
 * Injected into components/payroll-v6-mock/matanho-payroll-runtime.js by
 * scripts/patch-payroll-runtime.mjs. Do NOT edit the runtime by hand — edit
 * this file (or the patch script) and re-run the patch, so a fresh extract can
 * always be re-patched reproducibly.
 *
 * Everything between the BEGIN/END markers is copied verbatim into the runtime,
 * inside startPayrollV6Runtime's scope, BEFORE the runtime registers any of its
 * own click listeners. Capture-phase listeners fire in registration order, so
 * registering here means this handler sees every action first and can cancel
 * the runtime's mock behaviour.
 */

/* BEGIN_PAYROLL_LIVE_BRIDGE */

/**
 * Live state handed over by the React host via api.hydrate(). Until the first
 * hydrate lands this stays empty and the runtime renders its own fixtures, so
 * a hydrate failure degrades to the previous behaviour instead of a blank page.
 */
const __pr6Live = {
  ready: false,
  permissions: null, // Set<string> of real backend permission names
  roleName: null,
  counts: null, // live sidebar badge counts, keyed by page id
  errors: [],
};

/** True once the host has pushed at least one live payload. */
function __pr6IsLive() {
  return __pr6Live.ready === true;
}

/**
 * Live sidebar badge count for a nav item. Returns null when we have no live
 * number, and the caller then renders no badge at all — an absent badge is
 * honest, a stale hardcoded one is not.
 */
function __pr6NavCount(pageId) {
  if (!__pr6Live.counts) return null;
  const v = __pr6Live.counts[pageId];
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(n);
}

/**
 * Map the runtime's own permission vocabulary onto the backend catalogue.
 * The runtime shipped with a client-side role simulator (`roles[state.role]`);
 * once we are live, entitlement comes from the signed-in user's real grants.
 */
const __PR6_PERMISSION_MAP = {
  'employee.view': ['payroll.employees.view', 'payroll.employees.manage'],
  'employee.edit': ['payroll.employees.manage'],
  'salary.view': ['payroll.components.view', 'payroll.components.manage'],
  'salary.edit': ['payroll.components.manage'],
  'payroll.prepare': ['payroll.runs.manage'],
  'payroll.approve': ['payroll.runs.approve'],
  'payroll.release': ['payroll.runs.release'],
  'exceptions.resolve': ['payroll.exceptions.manage'],
  'statutory.manage': ['payroll.tax.manage'],
  'documents.manage': ['payroll.vault.manage'],
  'reports.generate': ['payroll.reports.view', 'payroll.reports.manage'],
  'audit.view': ['payroll.audit.view'],
  'rbac.manage': ['payroll.access.manage'],
  // Self-service is authenticated-only on the backend: every signed-in user
  // may see their own pay, so this is always allowed.
  'self.view': [],
};

/** Resolve a runtime permission id against the real backend grants. */
function __pr6Can(permission) {
  if (!__pr6IsLive() || !__pr6Live.permissions) return null; // fall through to mock roles
  const mapped = __PR6_PERMISSION_MAP[permission];
  if (!mapped) return false;
  if (mapped.length === 0) return true;
  return mapped.some((p) => __pr6Live.permissions.has(p));
}

/**
 * Action interception.
 *
 * Registered in the capture phase before the runtime's own handlers, so a
 * cancelled event never reaches the mock implementation. The host decides which
 * action ids are live (its API_ACTIONS allowlist); anything it does not claim
 * falls through untouched and keeps working as view-state.
 */
document.addEventListener(
  'click',
  (event) => {
    const el = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
    if (!el) return;
    const action = el.dataset ? el.dataset.action : null;
    if (!action) return;

    // Copy the dataset so the host gets ids/periods without holding a DOM ref.
    const dataset = {};
    try {
      Object.keys(el.dataset || {}).forEach((k) => {
        dataset[k] = el.dataset[k];
      });
    } catch (_) {}

    const detail = { action, dataset, page: (typeof state !== 'undefined' ? state.page : null) };
    let cancelled = false;
    try {
      const ev = new CustomEvent('matanho:before-action', { detail, cancelable: true });
      window.dispatchEvent(ev);
      cancelled = ev.defaultPrevented;
    } catch (_) {}

    if (cancelled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);

/* END_PAYROLL_LIVE_BRIDGE */
