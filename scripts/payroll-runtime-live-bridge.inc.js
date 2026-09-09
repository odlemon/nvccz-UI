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
  reference: null, // tax rules, allowance/deduction types, brackets, levies, courses
  dashboard: null, // /api/payroll/dashboard payload
  mypay: null, // self-service payslips, portal and leave balances
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
 * Command-centre statistics.
 *
 * The overview page shipped with its KPI cards hardcoded — Employees '128',
 * gross USD 264,720, gross ZiG 7,459,664, deductions 77,444, net 187,276,
 * readiness '72 / 100' — sitting directly above a run table that was already
 * rendering live rows. That is the exact failure mode this module is being
 * fixed for, so every figure here is computed from hydrated data.
 *
 * Returns null when there is no live data yet, and the caller then falls back
 * to the runtime's original literals rather than showing zeros.
 */
function __pr6OverviewStats() {
  if (!__pr6IsLive()) return null;

  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const staff = Array.isArray(employees) ? employees : [];
  const exc = Array.isArray(exceptions) ? exceptions : [];

  // payrollRuns is newest-first (see lib/payroll-v6/live-loaders.ts adaptRuns).
  const latest = runs.length ? runs[0] : null;

  const notReady = staff.filter((e) => Number(e && e.readiness) < 100).length;
  const readiness = staff.length
    ? Math.round(staff.reduce((sum, e) => sum + Number((e && e.readiness) || 0), 0) / staff.length)
    : 0;
  const criticalOpen = exc.filter(
    (e) => e && e.severity === 'Critical' && e.status !== 'Resolved',
  ).length;

  const pct = (v) => (typeof v === 'number' && isFinite(v) ? `${v > 0 ? '+' : ''}${v}%` : '');

  return {
    employees: String(staff.length),
    employeesSub: notReady
      ? `${notReady} not fully payroll-ready`
      : 'All employees payroll-ready',
    periodLabel: latest ? String(latest.reference || latest.period || '') : 'No run',
    grossUSD: latest ? Number(latest.grossUSD) || 0 : 0,
    grossZiG: latest ? Number(latest.grossZiG) || 0 : 0,
    deductions: latest ? Number(latest.deductions) || 0 : 0,
    netUSD: latest ? Number(latest.netUSD) || 0 : 0,
    variance: latest && latest.variance !== null ? pct(latest.variance) : '',
    readiness,
    readinessSub: criticalOpen
      ? `${criticalOpen} critical control${criticalOpen === 1 ? '' : 's'} block release`
      : 'No critical controls outstanding',
    readinessTone: criticalOpen ? 'amber' : '',
    criticalOpen,
    employeeDataPct: readiness,
    exceptionsPct: staff.length ? Math.max(0, 100 - Math.round((criticalOpen / staff.length) * 100)) : 100,
    runStage: latest ? Number(latest.stage) || 1 : 1,
  };
}

/**
 * Employee-directory statistics.
 *
 * The directory KPIs were literals ('128' total, '119' payroll ready, '92.9%'
 * of active, and fixed 4/3/2/6 counts) sitting above a table that already
 * rendered live rows, and the footer read "Showing N of 128".
 */
function __pr6EmployeeStats() {
  if (!__pr6IsLive()) return null;
  const staff = Array.isArray(employees) ? employees : [];
  const active = staff.filter((e) => e && e.isActive && !e.terminated);
  const ready = staff.filter((e) => Number(e && e.readiness) === 100);
  const review = staff.filter((e) => {
    const r = Number(e && e.readiness);
    return r >= 60 && r < 100;
  });
  const blocked = staff.filter((e) => Number(e && e.readiness) < 60);
  const onNotice = staff.filter((e) => e && e.terminated);
  const readyPct = active.length
    ? ((ready.length / active.length) * 100).toFixed(1)
    : '0.0';
  return {
    total: staff.length,
    active: active.length,
    onNotice: onNotice.length,
    ready: ready.length,
    readyPct,
    review: review.length,
    blocked: blocked.length,
    departments: Array.from(
      new Set(staff.map((e) => (e && e.department) || 'Unassigned')),
    ).sort(),
  };
}

/** Distinct department options for the directory filter. */
function __pr6DepartmentOptions() {
  const s = __pr6EmployeeStats();
  if (!s) return '<option>Finance</option><option>People &amp; Culture</option><option>Operations</option>';
  return s.departments.map((d) => `<option>${d}</option>`).join('');
}

/** Reference data pushed by hydrate, or an empty object before first load. */
function __pr6Ref() {
  return __pr6Live.reference || {};
}

const __pr6Money = (v, c) =>
  c === 'ZiG'
    ? `ZiG ${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `USD ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Pay-component catalogue.
 *
 * The page shipped a hardcoded nine-row table (BASIC/HOUSING/OVERTIME/BONUS/
 * PAYE/NSSA/MEDICAL/LOAN...) with invented GL codes, plus KPI cards reading
 * 24 earnings, 17 deductions, 31 formulas, 96% test coverage. The real
 * catalogue is allowance_types + deduction_types.
 */
function __pr6ComponentRows() {
  if (!__pr6IsLive()) return null;
  const ref = __pr6Ref();
  const allow = Array.isArray(ref.allowanceTypes) ? ref.allowanceTypes : [];
  const ded = Array.isArray(ref.deductionTypes) ? ref.deductionTypes : [];

  const rows = [];
  for (const a of allow) {
    rows.push([
      a.code || '-',
      a.name || '-',
      'Earning',
      a.isTaxable === false ? 'Fixed / non-taxable' : 'Fixed / taxable',
      '—',
      '—',
      a.isActive === false ? 'Inactive' : 'Active',
    ]);
  }
  for (const d of ded) {
    const rate = Number(d.rate);
    const calc = rate > 0
      ? `Rate ${(rate * 100).toFixed(2)}%${d.ceiling ? ` capped at ${Number(d.ceiling).toLocaleString('en-US')}` : ''}`
      : 'Statutory table';
    rows.push([
      d.code || '-',
      d.name || '-',
      'Deduction',
      calc,
      '—',
      '—',
      d.isActive === false ? 'Inactive' : 'Active',
    ]);
  }
  return rows;
}

function __pr6ComponentStats() {
  const rows = __pr6ComponentRows();
  if (!rows) return null;
  const ref = __pr6Ref();
  const allow = Array.isArray(ref.allowanceTypes) ? ref.allowanceTypes : [];
  const ded = Array.isArray(ref.deductionTypes) ? ref.deductionTypes : [];
  const statutory = ded.filter((d) => d.isStatutory).length;
  return {
    earnings: allow.length,
    earningsSub: `${allow.filter((a) => a.isTaxable !== false).length} taxable, ${allow.filter((a) => a.isTaxable === false).length} non-taxable`,
    deductions: ded.length,
    deductionsSub: `${statutory} statutory, ${ded.length - statutory} voluntary`,
    brackets: Array.isArray(ref.brackets) ? ref.brackets.length : 0,
    levies: Array.isArray(ref.levies) ? ref.levies.length : 0,
  };
}

/**
 * Tax and statutory rules. The page shipped a fixed rule table and KPIs
 * (182 test cases, 175 employees, 128 headcount).
 */
function __pr6TaxRows() {
  if (!__pr6IsLive()) return null;
  const ref = __pr6Ref();
  const brackets = Array.isArray(ref.brackets) ? ref.brackets : [];
  return brackets.map((b) => [
    b.currencyCode || '-',
    `${Number(b.lowerBound || 0).toLocaleString('en-US')} - ${b.upperBound === null || b.upperBound === undefined ? 'above' : Number(b.upperBound).toLocaleString('en-US')}`,
    `${(Number(b.marginalRate || 0) * 100).toFixed(0)}%`,
    Number(b.deductionOffset || 0).toLocaleString('en-US'),
    b.effectiveFrom ? String(b.effectiveFrom).slice(0, 10) : '—',
    b.isActive === false ? 'Inactive' : 'Active',
  ]);
}

/**
 * Maker-checker comparison. The runtime hardcoded a May-vs-June table
 * (126/128 headcount, 256,180 vs 264,720 gross, 7,134,000 vs 7,459,664 ZiG,
 * PAYE 41,280 vs 42,967, overtime, net 181,200 vs 187,276). Build it from the
 * two most recent runs instead, and show nothing when there are not two.
 */
function __pr6ApprovalCompare() {
  if (!__pr6IsLive()) return null;
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  if (runs.length === 0) return null;
  const cur = runs[0];
  const prev = runs.length > 1 ? runs[1] : null;

  const delta = (a, b) => {
    if (!prev || !b) return '—';
    if (Number(b) === 0) return '—';
    const d = ((Number(a) - Number(b)) / Number(b)) * 100;
    return `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
  };
  const review = (a, b) => {
    if (!prev || !b || Number(b) === 0) return 'New';
    const d = Math.abs(((Number(a) - Number(b)) / Number(b)) * 100);
    return d > 10 ? 'Investigate' : d > 5 ? 'Review' : 'Expected';
  };

  const prevLabel = prev ? String(prev.reference || prev.period) : 'No prior run';
  const curLabel = String(cur.reference || cur.period);

  return {
    prevLabel,
    curLabel,
    rows: [
      ['Headcount', prev ? String(prev.employees ?? '—') : '—', String(cur.employees ?? '—'), delta(cur.employees, prev && prev.employees), review(cur.employees, prev && prev.employees)],
      ['Gross USD', prev ? __pr6Money(prev.grossUSD) : '—', __pr6Money(cur.grossUSD), delta(cur.grossUSD, prev && prev.grossUSD), review(cur.grossUSD, prev && prev.grossUSD)],
      ['Deductions', prev ? __pr6Money(prev.deductions) : '—', __pr6Money(cur.deductions), delta(cur.deductions, prev && prev.deductions), review(cur.deductions, prev && prev.deductions)],
      ['Net pay', prev ? __pr6Money(prev.netUSD) : '—', __pr6Money(cur.netUSD), delta(cur.netUSD, prev && prev.netUSD), review(cur.netUSD, prev && prev.netUSD)],
    ],
    current: cur,
    owner: cur.owner || '—',
    criticalOpen: (Array.isArray(exceptions) ? exceptions : []).filter(
      (e) => e && e.severity === 'Critical' && e.status !== 'Resolved',
    ).length,
  };
}

/**
 * Close & distribution. Payslip counts, bank batch totals and GL amounts were
 * all literals (128 payslips, USD 86,420 / 58,310, ZiG 6,201,480, GL 264,720 /
 * 77,444 / 187,276).
 */
function __pr6CloseStats() {
  if (!__pr6IsLive()) return null;
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const cur = runs.length ? runs[0] : null;
  if (!cur) return null;
  const headcount = Number(cur.employees) || 0;
  return {
    headcount,
    label: String(cur.reference || cur.period),
    grossUSD: Number(cur.grossUSD) || 0,
    deductions: Number(cur.deductions) || 0,
    netUSD: Number(cur.netUSD) || 0,
    released: String(cur.rawStatus) === 'COMPLETED',
    stage: Number(cur.stage) || 1,
  };
}

/**
 * My Pay. The self-service page rendered one hardcoded payslip for
 * "Rudo Sibanda" (gross 2,250.00, deductions 620.86, net 1,629.14,
 * ZiG 35,820) regardless of who was signed in.
 */
function __pr6MyPay() {
  if (!__pr6IsLive()) return null;
  const mp = __pr6Live.mypay || {};
  const slips = Array.isArray(mp.payslips) ? mp.payslips : [];
  const balances = Array.isArray(mp.leaveBalances) ? mp.leaveBalances : [];
  const latest = slips.length ? slips[0] : null;
  return {
    employee: mp.employee || null,
    payslips: slips,
    latest,
    leaveBalances: balances,
    hasData: slips.length > 0,
  };
}

/**
 * Pay components in the shape the enhancement layer's catalogue expects
 * (payComponentsV2). The fixture carried invented GL codes ("5000 · Salaries"),
 * per-component employee counts and impact amounts ("USD 208,640"); the API has
 * no GL mapping or per-component impact, so those render as a dash rather than
 * as numbers that look measured.
 */
function __pr6ComponentsV2() {
  if (!__pr6IsLive()) return null;
  const ref = __pr6Ref();
  const allow = Array.isArray(ref.allowanceTypes) ? ref.allowanceTypes : [];
  const ded = Array.isArray(ref.deductionTypes) ? ref.deductionTypes : [];
  if (!allow.length && !ded.length) return null;

  const out = [];
  for (const a of allow) {
    out.push({
      code: a.code || '-',
      name: a.name || '-',
      type: 'Earning',
      calc: a.isTaxable === false ? 'Fixed monthly, non-taxable' : 'Fixed monthly, taxable',
      currency: 'Employee currency',
      gl: '—',
      status: a.isActive === false ? 'Inactive' : 'Active',
      employees: '—',
      impact: '—',
    });
  }
  for (const d of ded) {
    const rate = Number(d.rate);
    out.push({
      code: d.code || '-',
      name: d.name || '-',
      type: d.isStatutory ? 'Statutory' : 'Deduction',
      calc:
        rate > 0
          ? `Rate ${(rate * 100).toFixed(2)}%${d.ceiling ? ', capped at ' + Number(d.ceiling).toLocaleString('en-US') : ''}`
          : 'Statutory bracket table',
      currency: 'Employee currency',
      gl: '—',
      status: d.isActive === false ? 'Inactive' : 'Active',
      employees: '—',
      impact: '—',
    });
  }
  return out;
}

/**
 * Payroll movement trend. The fixture was 24 months of invented figures
 * (…,'May 2026',257,7.21],['Jun 2026',265,7.46]). Real months come from the
 * dashboard's monthlyTrend. The second series is the ZiG component, which is
 * genuinely zero while no dual-currency run exists — an honest flat line beats
 * a fabricated curve.
 */
function __pr6TrendV3() {
  if (!__pr6IsLive()) return null;
  const d = __pr6Live.dashboard;
  const trend = d && Array.isArray(d.monthlyTrend) ? d.monthlyTrend : null;
  if (!trend || !trend.length) return null;
  return trend.map((t) => [
    `${t.month} ${t.year}`,
    Number(t.totalPayroll) || 0,
    0,
  ]);
}

/**
 * Department distribution. The fixture invented headcount/cost/gross/variance
 * per department. `cost` is a 0-100 bar, so it is scaled against the largest
 * department rather than being a currency amount. There is no comparative
 * period behind `variance`, so it stays 0 instead of being made up.
 */
function __pr6DepartmentsV3() {
  if (!__pr6IsLive()) return null;
  const d = __pr6Live.dashboard;
  const rows = d && Array.isArray(d.departmentDistribution) ? d.departmentDistribution : null;
  if (!rows || !rows.length) return null;
  const max = rows.reduce((m, r) => Math.max(m, Number(r.total) || 0), 0) || 1;
  return rows.map((r) => ({
    name: r.department || 'Unassigned',
    headcount: Number(r.employeeCount) || 0,
    cost: Math.round(((Number(r.total) || 0) / max) * 100),
    gross: Number(r.total) || 0,
    variance: 0,
  }));
}

/**
 * My Pay view for the signed-in user.
 *
 * The page rendered `employees[0]` plus a fixed payslip (net 1,629.14,
 * gross 2,250.00, deductions 620.86, ZiG 35,820, four invented monthly
 * payslips and six invented earnings lines), so every user saw the same
 * fabricated pay for somebody who was not them.
 */
function __pr6MyPayView() {
  if (!__pr6IsLive()) return null;
  const mp = __pr6Live.mypay || {};
  const slips = Array.isArray(mp.payslips) ? mp.payslips : [];
  const self = mp.self || {};
  const latest = mp.latest || null;
  const balances = Array.isArray(mp.leaveBalances) ? mp.leaveBalances : [];
  const annual = balances.find((b) => String(b.leaveType).toUpperCase() === 'ANNUAL');

  return {
    hasPayslip: !!latest,
    latest,
    slips,
    self,
    annualLeave: annual ? Number(annual.balance) : null,
    balances,
    // Line-level earnings and deductions are not exposed by the payslip
    // endpoint, so show the three totals it does return rather than inventing
    // a breakdown.
    breakdown: latest
      ? [
          ['Gross earnings', __pr6Money(latest.gross)],
          ['Total deductions', '(' + __pr6Money(latest.deductions) + ')'],
          ['Net pay', __pr6Money(latest.net)],
        ]
      : [],
  };
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
