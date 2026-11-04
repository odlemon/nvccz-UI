/* Auto-extracted Matanho Payroll HR V6 — adapted for Next.js */
import {
  applySessionUserToProfile,
  clientDesignSignOut,
  getClientDesignSessionUser,
  onClientDesignSessionUser,
} from "@/components/client-design-mock/runtime-auth";
export function startPayrollV6Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'overview';
  window.__PAYROLL_V6_NAV__ = options.onNavigate || (() => {});
  if (!window.safeStorage) {
    window.safeStorage = {
      getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
      setItem: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
      removeItem: (k) => { try { localStorage.removeItem(k); } catch {} },
    };
  }
  window.__MATANHO_CONFIG__ = window.__MATANHO_CONFIG__ || { useMocks: true, environment: 'preview' };

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = rootEl.dataset.theme || 'light';

  const __pr6Abort = new AbortController();
  const __pr6Sig = { signal: __pr6Abort.signal };
  let api = { setPage() {}, destroy() {} };
  // Client assigns vendorsPage later without a prior declaration (classic-script
  // implicit global); must be declared inside this function scope.
  let vendorsPage;
  /* BEGIN_PAYROLL_LIVE_BRIDGE */
/**
 * Live state handed over by the React host via api.hydrate(). Until the first
 * hydrate lands this stays empty and the runtime renders its own fixtures, so
 * a hydrate failure degrades to the previous behaviour instead of a blank page.
 */
const __pr6Live = {
  ready: false,
  permissions: null, // Set<string> of real backend permission names
  // The access call failed, which is NOT the same as holding no permissions.
  // See __pr6DeniedPageHtml.
  accessUnavailable: false,
  roleName: null,
  counts: null, // live sidebar badge counts, keyed by page id
  reference: null, // tax rules, allowance/deduction types, brackets, levies, courses
  dashboard: null, // /api/payroll/dashboard payload
  mypay: null, // self-service payslips, portal and leave balances
  vendors: null, // supplier registry, read from the real Vendor table
  inputBatches: null, // payroll input batches and their validation rows
  payGroups: null, // pay groups with their calendar periods
  onboarding: null, // onboarding candidates
  rfqs: null, // sourcing events and vendor bids
  accessRoster: null, // payroll access register: users, role matrix, segregation rule (4a19)
  reports: null, // persisted report catalogue, saved report snapshots and metrics
  audit: null, // paginated Payroll audit trail and database-derived aggregate counts
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
  'dashboard.view': ['payroll.dashboard.view'],
  'employee.view': ['payroll.employees.view', 'payroll.employees.manage'],
  'employee.edit': ['payroll.employees.manage'],
  'salary.view': ['payroll.components.view', 'payroll.components.manage'],
  'salary.edit': ['payroll.components.manage'],
  'payroll.prepare': ['payroll.runs.manage'],
  'runs.view': ['payroll.runs.view', 'payroll.runs.manage'],
  'runs.manage': ['payroll.runs.manage'],
  'payroll.approve': ['payroll.runs.approve'],
  'payroll.release': ['payroll.runs.release'],
  'exceptions.view': ['payroll.exceptions.view', 'payroll.exceptions.manage'],
  'exceptions.resolve': ['payroll.exceptions.manage'],
  'training.view': ['payroll.training.view', 'payroll.training.manage'],
  'training.manage': ['payroll.training.manage'],
  'leave.view': ['payroll.leave.view', 'payroll.leave.manage'],
  'leave.manage': ['payroll.leave.manage'],
  'statutory.view': ['payroll.tax.view', 'payroll.tax.manage'],
  'statutory.manage': ['payroll.tax.manage'],
  'documents.view': ['payroll.vault.view', 'payroll.vault.manage'],
  'documents.manage': ['payroll.vault.manage'],
  'reports.view': ['payroll.reports.view', 'payroll.reports.manage'],
  'reports.generate': ['payroll.reports.manage'],
  'audit.view': ['payroll.audit.view'],
  'rbac.view': ['payroll.access.view', 'payroll.access.manage'],
  'rbac.manage': ['payroll.access.manage'],
  'settings.manage': ['payroll.settings.manage'],
  'vendors.view': ['payroll.vendors.view', 'payroll.vendors.manage'],
  'vendors.manage': ['payroll.vendors.manage'],
  'calendar.view': ['payroll.calendar.view', 'payroll.calendar.manage'],
  'calendar.manage': ['payroll.calendar.manage'],
  'settings.view': ['payroll.settings.view', 'payroll.settings.manage'],
  'inputs.view': ['payroll.inputs.view', 'payroll.inputs.manage'],
  'inputs.manage': ['payroll.inputs.manage'],
  'onboarding.view': ['payroll.onboarding.view', 'payroll.onboarding.manage'],
  'onboarding.manage': ['payroll.onboarding.manage'],
  // Self-service is authenticated-only on the backend: every signed-in user
  // may see their own pay, so this is always allowed.
  'self.view': [],
};

/** Resolve a runtime permission id against the real backend grants. */
function __pr6Can(permission) {
  if (!__pr6IsLive() || !__pr6Live.permissions) return null; // fall through to mock roles
  const mapped = __PR6_PERMISSION_MAP[permission];
  // Once the Payroll API has supplied the signed-in user's effective grants,
  // unknown runtime permission names fail closed. Falling back to demo role
  // simulation here could expose a page that the API role does not permit.
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
  // Live but with no runs is a real answer, not "no data yet". Returning null
  // here would fall back to the fixture and show a department manager a
  // preparer named Rudo Sibanda and "3 unresolved critical" for a payroll they
  // cannot even see.
  const cur = runs.length ? runs[0] : __pr6RunPlaceholder;
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
  const hasRun = runs.length > 0;
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
    hasRun,
    owner: hasRun ? (cur.owner || '—') : '—',
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
  const cur = runs.length ? runs[0] : __pr6RunPlaceholder;
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
      currency: 'Employee salary structure',
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
      currency: d.currency?.code || d.currencyCode || 'Salary split (USD + ZiG)',
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
  // Live with no dashboard is a real answer, not "not loaded". A role without
  // payroll.dashboard.view (a plain employee) must not be shown the fixture's
  // 24 months of invented payroll; an empty series is the honest rendering.
  if (!trend || !trend.length) return [];
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
  // Same reasoning as __pr6TrendV3: empty beats fabricated.
  if (!rows || !rows.length) return [];
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
 * The page rendered the first roster entry plus a fixed payslip (net 1,629.14,
 * gross 2,250.00, deductions 620.86, ZiG 35,820, four invented monthly
 * payslips and six invented earnings lines), so every user saw the same
 * fabricated pay for somebody who was not them.
 */
function __pr6MyPayView() {
  if (!__pr6IsLive()) return null;
  const mp = __pr6Live.mypay || {};
  const slips = Array.isArray(mp.payslips) ? mp.payslips : [];
  const self = mp.self || {};
  // Keep the summary, breakdown, and primary download aligned to the same
  // dispatched period. The API list may include future-dated test runs.
  const latest = __pr6CurrentPayslip(slips);
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

// A payslip appears in this API list only after payroll dispatch has created it.
// Prefer the current calendar month; if it has not been dispatched, choose the
// newest issued period before the current month (never a future test run).
function __pr6CurrentPayslip(slips) {
  const rows = Array.isArray(slips) ? slips : [];
  const periodKey = (value) => {
    const text = String(value || '').trim();
    const iso = text.match(/^(\d{4})[-/](\d{1,2})/);
    if (iso) return Number(iso[1]) * 100 + Number(iso[2]);
    const named = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (named) {
      const month = new Date(`${named[1]} 1, ${named[2]}`).getMonth() + 1;
      if (month > 0) return Number(named[2]) * 100 + month;
    }
    return 0;
  };
  const now = new Date();
  const currentKey = now.getFullYear() * 100 + now.getMonth() + 1;
  const dated = rows.map((slip) => ({ slip, key: periodKey(slip.period || slip.periodLabel) })).filter((row) => row.key > 0);
  return dated.find((row) => row.key === currentKey)?.slip ||
    dated.filter((row) => row.key < currentKey).sort((a, b) => b.key - a.key)[0]?.slip || null;
}

/**
 * Leave register.
 *
 * The page rendered seven employees against index-keyed fixtures — used-YTD
 * from [5,8,12,3,9,2,4], pending from [1,0,3,2,0,4,1] and liability from
 * [1480,2940,1320,1670,720,2860,810] — so a row's numbers had nothing to do
 * with the employee beside them.
 *
 * Liability is a real derivation: accrued days x daily rate, where the daily
 * rate is the monthly basic over 22 working days. Used-YTD and pending have no
 * backend source (there is no leave-request table), so they show a dash.
 */
function __pr6LeaveRows() {
  if (!__pr6IsLive()) return null;
  const balances = Array.isArray(__pr6Live.leaveBalances) ? __pr6Live.leaveBalances : [];
  const staff = Array.isArray(employees) ? employees : [];
  const byNumber = new Map(staff.map((e) => [e.id, e]));
  return balances.map((b) => {
    const emp = byNumber.get(b.employeeNumber);
    const basic = emp ? Number(emp.base) || 0 : 0;
    const days = Number(b.balance) || 0;
    const liability = basic > 0 && String(b.leaveType).toUpperCase() === 'ANNUAL' ? (basic / 22) * days : null;
    const currency = String(b.currencyCode || emp?.currency || '').toUpperCase();
    return {
      employeeId: b.employeeId,
      employeeNumber: b.employeeNumber,
      name: b.name,
      initials: emp ? emp.initials : '--',
      department: b.department,
      leaveType: b.leaveType,
      available: days,
      liabilityUSD: liability !== null && currency === 'USD' ? liability : null,
      liabilityZiG: liability !== null && currency === 'ZIG' ? liability : null,
    };
  });
}

function __pr6LeaveStats() {
  const rows = __pr6LeaveRows();
  if (!rows) return null;
  const totalLiability = {usd: rows.reduce((s, r) => s + (r.liabilityUSD || 0), 0), zig: rows.reduce((s, r) => s + (r.liabilityZiG || 0), 0)};
  const avg = rows.length
    ? (rows.reduce((s, r) => s + r.available, 0) / rows.length).toFixed(1)
    : '0.0';
  const balances = Array.isArray(__pr6Live.leaveBalances) ? __pr6Live.leaveBalances : [];
  const types = Array.from(new Set(balances.map((b) => b.leaveType)));
  return {
    liability: totalLiability,
    average: avg,
    employees: new Set(rows.map(r=>r.employeeNumber)).size,
    types: types.length,
  };
}

/**
 * Training register. The fixture invented six courses with enrolment,
 * completion and pass-rate columns (128/121/7/94.5% and so on). The real
 * catalogue is payroll_compliance courses; assignment and certification counts
 * come from the certifications endpoint, which is currently empty, so those
 * columns read 0 rather than a fabricated 94.5%.
 */
function __pr6TrainingRows() {
  if (!__pr6IsLive()) return null;
  const ref = __pr6Ref();
  const courses = Array.isArray(ref.courses) ? ref.courses : [];
  if (!courses.length) return null;
  const certs = Array.isArray(ref.certifications) ? ref.certifications : [];

  return courses.map((c) => {
    const mine = certs.filter((x) => x.courseId === c.id || x.courseCode === c.code);
    const done = mine.filter((x) => String(x.status || '').toUpperCase() === 'ACTIVE').length;
    const assigned = mine.length;
    const pct = assigned ? `${((done / assigned) * 100).toFixed(1)}%` : '0%';
    return [
      c.title || c.code || 'Course',
      String(assigned),
      String(done),
      String(assigned - done),
      pct,
      c.renewalPeriodMonths ? `${c.renewalPeriodMonths} month renewal` : '—',
    ];
  });
}

function __pr6TrainingStats() {
  const rows = __pr6TrainingRows();
  if (!rows) return null;
  const ref = __pr6Ref();
  const certs = Array.isArray(ref.certifications) ? ref.certifications : [];
  const staff = Array.isArray(employees) ? employees : [];
  return {
    courses: rows.length,
    employees: staff.length,
    certifications: certs.length,
    mandatory: (Array.isArray(ref.courses) ? ref.courses : []).filter((c) => c.required || c.isMandatory).length,
  };
}

/**
 * Statutory rule register. The fixture listed five invented rule versions
 * ("ZW-PAYE-2026.06" approved by "Tawanda Chirenje") and KPIs of 14 published
 * rules, 182 automated tests and an estimated PAYE of 42,967. The real
 * configuration is tax_rules plus the ZIMRA bracket and levy tables.
 */
function __pr6TaxRows() {
  if (!__pr6IsLive()) return null;
  const ref = __pr6Ref();
  const rules = Array.isArray(ref.taxRules) ? ref.taxRules : [];
  const brackets = Array.isArray(ref.brackets) ? ref.brackets : [];
  const levies = Array.isArray(ref.levies) ? ref.levies : [];
  if (!rules.length && !brackets.length && !levies.length) return null;

  const out = [];
  for (const r of rules) {
    out.push([
      r.type || 'RULE',
      r.name || '—',
      r.currency ? r.currency.code : 'USD',
      r.effectiveDate ? String(r.effectiveDate).slice(0, 10) : '—',
      r.isActive === false ? 'Inactive' : 'Active',
      '—',
    ]);
  }
  for (const l of levies) {
    out.push([
      l.levyCode || 'LEVY',
      `${l.levyCode} (${l.currencyCode})`,
      l.currencyCode || '—',
      l.effectiveFrom ? String(l.effectiveFrom).slice(0, 10) : '—',
      l.isActive === false ? 'Inactive' : 'Active',
      l.rate !== null && l.rate !== undefined ? `Rate ${(Number(l.rate) * 100).toFixed(2)}%` : (l.ceiling ? `Ceiling ${Number(l.ceiling).toLocaleString('en-US')}` : '—'),
    ]);
  }
  return out;
}

function __pr6TaxStats() {
  const rows = __pr6TaxRows();
  if (!rows) return null;
  const ref = __pr6Ref();
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const latest = runs.length ? runs[0] : null;
  return {
    rules: (Array.isArray(ref.taxRules) ? ref.taxRules : []).length,
    brackets: (Array.isArray(ref.brackets) ? ref.brackets : []).length,
    levies: (Array.isArray(ref.levies) ? ref.levies : []).length,
    employees: (Array.isArray(employees) ? employees : []).length,
    deductions: latest ? Number(latest.deductions) || 0 : 0,
    period: latest ? String(latest.reference || latest.period) : '—',
  };
}

/**
 * Payroll mix for the latest run: how much of gross is basic versus allowances.
 * The fixture showed 'USD 208,640' basic / 'USD 49,756' allowances / 79% / 19%.
 * Basic comes from the employee roster and allowances are the remainder of the
 * run's gross, so the two always reconcile to the gross actually paid.
 */
function __pr6PayrollMix() {
  if (!__pr6IsLive()) return null;
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const staff = Array.isArray(employees) ? employees : [];
  const latest = runs.length ? runs[0] : null;
  if (!latest) return null;
  const gross = Number(latest.grossUSD) || 0;
  if (gross <= 0) return null;
  const basic = staff.reduce((s, e) => s + (Number(e.base) || 0), 0);
  const allowances = Math.max(0, gross - basic);
  return {
    gross,
    basic,
    allowances,
    basicPct: Math.round((basic / gross) * 100),
    allowancePct: Math.round((allowances / gross) * 100),
    deductions: Number(latest.deductions) || 0,
    deductionPct: Math.round(((Number(latest.deductions) || 0) / gross) * 100),
  };
}

/**
 * Coverage of the latest run: how many employees it actually paid against the
 * roster. Replaces a "1,247 of 1,284 valid" input-batch figure that had no
 * backend behind it at all (there is no payroll input-batch store).
 */
function __pr6RunCoverage() {
  if (!__pr6IsLive()) return null;
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const staff = Array.isArray(employees) ? employees : [];
  // Live with nothing to show is a real answer: falling back to null here put
  // the fixture's "1,247 of 1,284 valid" back on screen for a role that cannot
  // see payroll at all.
  const latest = runs.length ? runs[0] : null;
  const paid = latest ? Number(latest.employees) || 0 : 0;
  const total = staff.length;
  return {
    paid,
    total,
    pct: total ? Math.round((paid / total) * 100) : 0,
  };
}

/**
 * Component catalogue health: active versus inactive, and how many deduction
 * types are statutory. Replaces '182 of 190 tests passed' and '3 changes
 * awaiting review', neither of which has any backend equivalent.
 */
function __pr6ComponentHealth() {
  if (!__pr6IsLive()) return null;
  const ref = __pr6Ref();
  const allow = Array.isArray(ref.allowanceTypes) ? ref.allowanceTypes : [];
  const ded = Array.isArray(ref.deductionTypes) ? ref.deductionTypes : [];
  const all = allow.concat(ded);
  if (!all.length) return null;
  const active = all.filter((c) => c.isActive !== false).length;
  const statutory = ded.filter((d) => d.isStatutory).length;
  return {
    total: all.length,
    active,
    activePct: all.length ? Math.round((active / all.length) * 100) : 0,
    statutory,
    statutoryPct: ded.length ? Math.round((statutory / ded.length) * 100) : 0,
  };
}

/**
 * Payroll readiness per department, from the employee roster. Replaces the
 * training page's invented per-department completion bars (Finance 98%,
 * Operations 86%, Commercial 89%, Technology 96%, Procurement 93%) — those
 * departments do not even exist in this database.
 */
function __pr6DepartmentReadiness() {
  if (!__pr6IsLive()) return null;
  const staff = Array.isArray(employees) ? employees : [];
  if (!staff.length) return null;
  const byDept = new Map();
  for (const e of staff) {
    const d = e.department || 'Unassigned';
    const cur = byDept.get(d) || { sum: 0, n: 0 };
    cur.sum += Number(e.readiness) || 0;
    cur.n += 1;
    byDept.set(d, cur);
  }
  return Array.from(byDept.entries())
    .map(([name, v]) => ({ name, pct: Math.round(v.sum / v.n), count: v.n }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Empty-collection placeholders.
 *
 * The runtime indexes element zero of payrollRuns, employees, exceptions and
 * documents directly, because its fixtures were never empty. Once the data
 * is live those arrays legitimately CAN be empty — a department manager holds
 * no payroll.runs.view grant, so the loader never fetches runs and hydrate
 * hands over [] — and reading .id off element zero then throws, taking the whole render
 * down. Observed on the Approvals screen as deptmgr:
 *   [payroll-v6] hydrate failed TypeError: Cannot read properties of undefined
 *
 * These placeholders render as dashes and zeros, so an empty screen says "no
 * data" instead of crashing or inventing a value.
 */
const __PR6_DASH = '—';

const __pr6RunPlaceholder = {
  id: __PR6_DASH,
  reference: __PR6_DASH,
  period: 'No payroll run',
  group: __PR6_DASH,
  employees: 0,
  currency: 'USD',
  grossUSD: 0,
  grossZiG: 0,
  deductions: 0,
  netUSD: 0,
  status: 'None',
  rawStatus: 'NONE',
  approvalStatus: 'NONE',
  stage: 1,
  owner: __PR6_DASH,
  variance: null,
};

const __pr6EmployeePlaceholder = {
  id: __PR6_DASH,
  recordId: null,
  name: 'No employee records',
  initials: '--',
  email: null,
  department: __PR6_DASH,
  title: __PR6_DASH,
  branch: __PR6_DASH,
  type: __PR6_DASH,
  start: __PR6_DASH,
  phone: __PR6_DASH,
  base: 0,
  zig: 0,
  currency: 'USD',
  bank: __PR6_DASH,
  tax: __PR6_DASH,
  nssa: __PR6_DASH,
  readiness: 0,
  status: 'None',
  leave: __PR6_DASH,
  training: __PR6_DASH,
  documents: __PR6_DASH,
  terminated: false,
  isActive: false,
};

const __pr6ExceptionPlaceholder = {
  id: __PR6_DASH,
  employee: 'No exceptions',
  employeeId: __PR6_DASH,
  type: 'None',
  severity: 'Low',
  source: __PR6_DASH,
  amount: __PR6_DASH,
  owner: null,
  age: null,
  status: 'None',
  detail: 'No payroll exceptions are outstanding.',
};

const __pr6DocumentPlaceholder = {
  id: __PR6_DASH,
  name: 'No documents',
  folder: __PR6_DASH,
  type: __PR6_DASH,
  owner: __PR6_DASH,
  modified: __PR6_DASH,
  class: __PR6_DASH,
  versions: 0,
  content: '',
};

/**
 * Access-refusal panel. Shown in place of a page whose permission the
 * signed-in role does not hold. The sidebar already hides the link, but the
 * URL still worked: a plain employee reaching /payroll/approvals (then
 * /payroll-v6/approvals) got the full Maker-Checker screen. A hidden link is
 * not access control.
 */
function __pr6DeniedPageHtml(pageId) {
  var required = '';
  try {
    required = (typeof pagePermission !== 'undefined' && pagePermission[pageId]) || '';
  } catch (_) {}

  // An unreachable GET /payroll/me/access used to land here, telling a System
  // Administrator holding all 34 grants that their role lacked permission --
  // every payroll screen, for the duration of any outage. Failing closed is
  // right; blaming the user's role for a backend failure is not, and it is the
  // opposite of actionable because nobody retries a permissions problem.
  var unavailable = false;
  try {
    unavailable = __pr6Live.accessUnavailable === true;
  } catch (_) {}
  if (unavailable) {
    return (
      '<div class="page"><section class="card"><div class="card-body" style="text-align:center;padding:48px 24px">' +
      '<h3 style="margin:0 0 6px">We could not verify your access</h3>' +
      '<p class="muted" style="margin:0 0 12px">Payroll could not reach the permissions service, so this screen is held back until it can. ' +
      'Your role has not changed.</p>' +
      '<button class="btn primary" data-pr6-retry type="button">Try again</button>' +
      '</div></section></div>'
    );
  }

  return (
    '<div class="page"><section class="card"><div class="card-body" style="text-align:center;padding:48px 24px">' +
    '<h3 style="margin:0 0 6px">You do not have access to this page</h3>' +
    '<p class="muted" style="margin:0 0 4px">Your role does not hold the payroll permission this screen requires.</p>' +
    (required ? '<p class="tiny muted">Required permission: ' + required + '</p>' : '') +
    '</div></section></div>'
  );
}

/**
 * Payroll run register statistics. The page carried '2' open runs, '140'
 * employees in scope, a gross of 362,960, '12' open exceptions and a
 * "31 May 2026" last release, none of which came from anywhere.
 */
function __pr6RunStats() {
  if (!__pr6IsLive()) return null;
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const staff = Array.isArray(employees) ? employees : [];
  const exc = Array.isArray(exceptions) ? exceptions : [];
  const open = runs.filter((r) => String(r.rawStatus) !== 'COMPLETED');
  const released = runs.filter((r) => String(r.rawStatus) === 'COMPLETED');
  const latest = runs.length ? runs[0] : null;
  const lastReleased = released.length ? released[0] : null;
  const critical = exc.filter((e) => e && e.severity === 'Critical').length;
  const high = exc.filter((e) => e && e.severity === 'High').length;
  return {
    openRuns: open.length,
    openSub: open.length ? String(open[0].reference || open[0].period) : 'None in progress',
    inScope: latest ? Number(latest.employees) || 0 : staff.length,
    gross: latest ? Number(latest.grossUSD) || 0 : 0,
    grossSub: latest ? String(latest.reference || latest.period) : 'No run',
    exceptions: exc.length,
    exceptionSub: `${critical} critical, ${high} high`,
    lastRelease: lastReleased ? String(lastReleased.reference || lastReleased.period) : 'None yet',
    totalRuns: runs.length,
  };
}

/**
 * Pay-period options for the Create Payroll Run dialog.
 *
 * The dialog offered exactly two hardcoded periods, "July 2026" and
 * "June 2026". Both already have runs, and createPayrollRun rejects any period
 * overlapping an existing one, so creating a run through the UI was impossible
 * -- every choice returned "A payroll run already exists for this period".
 *
 * Offers the next twelve months that no run occupies, most recent first.
 */
function __pr6PeriodOptions() {
  if (!__pr6IsLive()) return null;
  const runs = Array.isArray(payrollRuns) ? payrollRuns : [];
  const taken = new Set(
    runs
      .map((r) => String(r.reference || ''))
      .filter(Boolean),
  );
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const out = [];
  const now = new Date();
  // Start from the month after the newest run, else from this month.
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth() + 1;
  for (let i = 0; i < 24 && out.length < 12; i += 1) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!taken.has(key)) out.push(`${MONTHS[m - 1]} ${y}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out.length ? out : null;
}

/**
 * Audit trail statistics. The screen carried '4,812' events, '42' privileged,
 * '318' sensitive views, '9' blocked actions and a "100%" evidence-hash claim,
 * none of which existed: the runtime's logEvent() wrote to an in-memory array
 * that died with the page. The trail is now payroll_audit_events.
 */
/**
 * Vendors & Quotations rows and header figures.
 *
 * The screen shipped a hardcoded registry — "Medsure Health Fund", VEN-001 and friends, each with
 * an invented rating, contract value and compliance percentage — plus KPI cards asserting 26
 * registered vendors and USD 28,460 of negotiated savings. None of it came from anywhere.
 *
 * Returns null when there is no live vendor payload, so the caller can render an honest empty
 * state instead of falling back to the fixture.
 */
/**
 * Inputs & Validation. The screen hardcoded a five-row error list and a band reading
 * "1,247 valid rows are ready. 37 rows remain isolated" over "1,284 uploaded" — none of it backed
 * by anything. Returns null when the role cannot see inputs, so the caller says so rather than
 * falling back to the fixture.
 */
function __pr6Inputs() {
  const p = __pr6Live.inputBatches;
  if (!p || !Array.isArray(p.items)) return null;
  const s = p.summary || {};
  const latest = p.items[0] || null;
  return {
    batches: p.items,
    latest,
    totalRows: Number(s.totalRows) || 0,
    validRows: Number(s.validRows) || 0,
    errorRows: Number(s.errorRows) || 0,
    awaitingCommit: Number(s.awaitingCommit) || 0,
    // Percentage of rows that passed validation; null when nothing has been uploaded, because
    // 0% and "no data" are different statements.
    validPct: Number(s.totalRows) > 0 ? Math.round((Number(s.validRows) / Number(s.totalRows)) * 100) : null,
  };
}

/** Pay groups with their calendar periods. Replaces a hardcoded single "Monthly Staff" group. */
function __pr6PayGroups() {
  const p = __pr6Live.payGroups;
  if (!p || !Array.isArray(p.items)) return null;
  const s = p.summary || {};
  return {
    groups: p.items,
    total: Number(p.total) || p.items.length,
    active: Number(s.active) || 0,
    periods: Number(s.periods) || 0,
    openPeriods: Number(s.openPeriods) || 0,
  };
}

/** Onboarding pipeline. */
function __pr6Onboarding() {
  const p = __pr6Live.onboarding;
  if (!p || !Array.isArray(p.items)) return null;
  const s = p.summary || {};
  return {
    candidates: p.items,
    total: Number(p.total) || p.items.length,
    inProgress: Number(s.inProgress) || 0,
    complete: Number(s.complete) || 0,
    byStatus: s.byStatus || {},
  };
}

/** Sourcing events and their bids, for the RFQ half of the Vendors screen. */
function __pr6Rfqs() {
  const p = __pr6Live.rfqs;
  if (!p || !Array.isArray(p.items)) return null;
  const s = p.summary || {};
  return {
    rfqs: p.items,
    open: Number(s.open) || 0,
    evaluating: Number(s.evaluating) || 0,
    awarded: Number(s.awarded) || 0,
    bidsReceived: Number(s.bidsReceived) || 0,
    closingSoon: Number(s.closingSoon) || 0,
  };
}

function __pr6Vendors() {
  const v = __pr6Live.vendors;
  if (!v || !Array.isArray(v.items)) return null;
  const s = v.summary || {};
  return {
    items: v.items,
    total: Number(v.total) || v.items.length,
    registered: Number(s.registered) || 0,
    compliant: Number(s.compliant) || 0,
    pending: Number(s.pending) || 0,
    expired: Number(s.expired) || 0,
    blacklisted: Number(s.blacklisted) || 0,
    categories: Number(s.categories) || 0,
    ratedCount: Number(s.ratedCount) || 0,
    averageRating: s.averageRating == null ? null : Number(s.averageRating),
  };
}

function __pr6AuditStats() {
  if (!__pr6IsLive()) return null;
  const stats = __pr6Live.audit && __pr6Live.audit.stats;
  if (stats) return {
    total: Number(stats.total) || 0,
    approvals: Number(stats.approvals) || 0,
    changes: Number(stats.changes) || 0,
    actors: Number(stats.actors) || 0,
  };
  const rows = Array.isArray(auditEvents) ? auditEvents : [];
  const cls = (r) => String((r && r[5]) || '');
  return {
    total: rows.length,
    approvals: rows.filter((r) => cls(r) === 'Approval').length,
    changes: rows.filter((r) => cls(r) === 'Change').length,
    actors: new Set(rows.map((r) => String((r && r[1]) || '')).filter(Boolean)).size,
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
/**
 * Retry for the "could not verify your access" panel. Deliberately not a
 * [data-action]: the host claims only its own allowlist and the runtime has no
 * case for this, so it would fall through and do nothing. The host already
 * listens for payroll-v6:reload-request and re-runs the whole load.
 */
document.addEventListener('click', (event) => {
  const el = event.target && event.target.closest ? event.target.closest('[data-pr6-retry]') : null;
  if (!el) return;
  event.preventDefault();
  try {
    window.dispatchEvent(new Event('payroll-v6:reload-request'));
  } catch (_) {}
}, true);

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


/**
 * FINDING-017 — Roles and Access, Document Vault and Pay Calendar render live data only.
 *
 * Each of these screens was a page override from the enhancement IIFEs reading a fixture:
 * userAccess + roles (six people who are not employees, a matrix of ticks, KPIs of "42"
 * users and "2" SoD conflicts), documents (a register nobody uploaded) and
 * payGroupsV2 + calendarPeriods (July 2026 pay dates). The overrides are now one-line
 * delegates into the builders below (patch 4a19). Before the first hydrate they render a
 * loading panel, never the fixtures.
 */
function __pr6Esc(v) {
  return String(v == null ? '' : v)
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

function __pr6Has(permission) {
  return !!(__pr6Live.permissions && __pr6Live.permissions.has(permission));
}

function __pr6LoadFailed(source) {
  return (__pr6Live.errors || []).some((e) => e && e.source === source);
}

function __pr6FileSize(bytes) {
  if (bytes == null) return '—';
  const b = Number(bytes);
  if (!Number.isFinite(b)) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return Math.round(b / 1024) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function __pr6PendingPanel(eyebrow, title, desc, message, retry) {
  return '<div class="page">' + pageHead(eyebrow, title, desc) +
    '<section class="card"><div class="card-body" style="text-align:center;padding:40px 24px">' +
    '<p class="muted" style="margin:0 0 12px">' + message + '</p>' +
    (retry ? '<button class="btn primary" data-pr6-retry type="button">Try again</button>' : '') +
    '</div></section></div>';
}

/** Readable names for the backend's payroll grants. Unknown ids fall back to the id. */
const __PR6_PERMISSION_LABELS = {
  'payroll.dashboard.view': 'View command centre',
  'payroll.employees.view': 'View employee records',
  'payroll.employees.manage': 'Change employee records',
  'payroll.runs.view': 'View payroll runs',
  'payroll.runs.manage': 'Prepare payroll runs (maker)',
  'payroll.runs.approve': 'Approve payroll runs (checker)',
  'payroll.runs.release': 'Release pay and bank files',
  'payroll.components.view': 'View earnings and deductions',
  'payroll.components.manage': 'Change earnings and deductions',
  'payroll.tax.view': 'View tax and statutory rules',
  'payroll.tax.manage': 'Change tax and statutory rules',
  'payroll.leave.view': 'View leave',
  'payroll.leave.manage': 'Change leave',
  'payroll.training.view': 'View training',
  'payroll.training.manage': 'Change training',
  'payroll.vault.view': 'View and download documents',
  'payroll.vault.manage': 'Upload documents',
  'payroll.reports.view': 'View reports',
  'payroll.reports.manage': 'Generate reports',
  'payroll.audit.view': 'View audit trail',
  'payroll.access.view': 'View payroll access register',
  'payroll.access.manage': 'Change payroll access',
  'payroll.settings.view': 'View settings',
  'payroll.settings.manage': 'Change settings',
  'payroll.vendors.view': 'View vendors',
  'payroll.vendors.manage': 'Manage vendors and RFQs',
  'payroll.calendar.view': 'View pay calendar',
  'payroll.calendar.manage': 'Change pay calendar',
  'payroll.exceptions.view': 'View exceptions',
  'payroll.exceptions.manage': 'Resolve exceptions',
  'payroll.inputs.view': 'View inputs',
  'payroll.inputs.manage': 'Commit inputs',
  'payroll.onboarding.view': 'View onboarding',
  'payroll.onboarding.manage': 'Manage onboarding',
};

function __pr6PermissionLabel(p) {
  return __PR6_PERMISSION_LABELS[p] || p;
}

// ------------------------------------------------------------------ access

function __pr6AccessExportIcons() {
  return '<span class="audit-export-icons" role="group" aria-label="Export Payroll access">' +
    '<button class="icon-btn" type="button" data-pr6-access-export="pdf" title="Export PDF" aria-label="Export Payroll access as PDF">' + icon('file') + '</button>' +
    '<button class="icon-btn" type="button" data-pr6-access-export="excel" title="Export Excel" aria-label="Export Payroll access as Excel">' + icon('report') + '</button>' +
    '<button class="icon-btn" type="button" data-pr6-access-export="csv" title="Export CSV" aria-label="Export Payroll access as CSV">' + icon('download') + '</button></span>';
}

function __pr6AccessPageHtml() {
  const eyebrow = 'Identity, authority and segregation';
  const title = 'Roles and Access Control';
  const desc = 'Review payroll access, manage payroll-only role policies, and keep maker and checker duties separate.';
  if (!__pr6IsLive()) return __pr6PendingPanel(eyebrow, title, desc, 'Loading the payroll access register…');
  const r = __pr6Live.accessRoster;
  if (!r || !Array.isArray(r.users)) return __pr6LoadFailed('access/roster')
    ? __pr6PendingPanel(eyebrow, title, desc, 'The payroll access register could not be loaded.', true)
    : __pr6PendingPanel(eyebrow, title, desc, 'Your role cannot view the payroll access register.');

  const esc = __pr6Esc;
  const summary = r.summary || {};
  const users = Array.isArray(r.users) ? r.users : [];
  const permissions = Array.isArray(r.permissions) ? r.permissions : [];
  const globalRoles = Array.isArray(r.roles) ? r.roles : [];
  const payrollRoles = Array.isArray(r.payrollRoles) ? r.payrollRoles : [];
  const canManage = __pr6Has('payroll.access.manage');
  const tab = state.payrollAccessTab === 'roles' ? 'roles' : 'users';
  const search = String(state.payrollAccessSearch || '').trim().toLowerCase();
  const filteredUsers = users.filter((u) => !search || [u.name, u.email, u.department, u.roleName, u.payrollRoleName, u.status].join(' ').toLowerCase().includes(search));
  const pageSize = Number(state.payrollAccessPageSize) || 10;
  const userPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const userPage = Math.min(userPages, Math.max(1, Number(state.payrollAccessPage) || 1));
  const visibleUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize);
  const rolePageSize = Number(state.payrollAccessRolePageSize) || 10;
  const rolePages = Math.max(1, Math.ceil(payrollRoles.length / rolePageSize));
  const rolePage = Math.min(rolePages, Math.max(1, Number(state.payrollAccessRolePage) || 1));
  const visibleRoles = payrollRoles.slice((rolePage - 1) * rolePageSize, rolePage * rolePageSize);
  const dash = '—';
  const topActions = (canManage ? '<button class="btn primary" type="button" data-pr6-access-action="new-role">' + icon('plus') + 'New Payroll role</button>' : '') + __pr6AccessExportIcons();
  const header = pageHead(eyebrow, title, desc, topActions);
  const kpis = '<div class="grid kpis">' +
    kpi('Users with Payroll access', String(summary.usersWithPayrollAccess ?? users.length), 'Effective permissions from API roles', 'users') +
    kpi('Payroll-only roles', String(summary.configuredPayrollRoles || 0), 'Versioned and scoped to this module', 'key', 'violet') +
    kpi('Assigned Payroll roles', String(summary.payrollRoleAssignments || 0), 'Overrides limited to Payroll', 'shield', 'cyan') +
    kpi('MFA coverage', summary.mfaCoveragePct == null ? dash : summary.mfaCoveragePct + '%', (summary.mfaEnrolled || 0) + ' of ' + users.length + ' enrolled', 'lock', 'cyan') +
    kpi('Maker-checker exemptions', String(summary.selfApprovalConflicts || 0), 'Users allowed to approve their own submissions', 'alert', summary.selfApprovalConflicts ? 'amber' : '') + '</div>';

  const tabs = '<div class="payroll-access-tabs" role="tablist">' +
    ['users', 'roles'].map((key) => '<button type="button" role="tab" aria-selected="' + (tab === key) + '" class="payroll-access-tab ' + (tab === key ? 'active' : '') + '" data-pr6-access-tab="' + key + '">' + ({ users: 'User access', roles: 'Payroll roles' }[key]) + '</button>').join('') + '</div>';

  const userRows = visibleUsers.map((u) => {
    const duties = [u.canPrepare ? 'Maker' : '', u.canApprove ? 'Checker' : '', u.canRelease ? 'Release' : ''].filter(Boolean).join(' · ') || 'View only';
    const controls = canManage
      ? '<button type="button" class="btn small" data-pr6-access-action="assign-user" data-user-id="' + esc(u.id) + '">' + (u.payrollRoleId ? 'Change Payroll role' : 'Assign Payroll role') + '</button>' + (u.payrollRoleId ? '<button type="button" class="btn small danger" data-pr6-access-action="remove-user" data-user-id="' + esc(u.id) + '">Remove</button>' : '')
      : '<span class="muted">Read only</span>';
    return '<tr><td><div class="access-user"><div class="mini-avatar">' + esc(u.initials) + '</div><div><strong>' + esc(u.name) + '</strong><div class="tiny muted">' + esc(u.email) + (u.department ? ' · ' + esc(u.department) : '') + '</div></div></div></td>' +
      '<td><strong>' + esc(u.roleName || dash) + '</strong><div class="tiny muted">Platform role</div></td>' +
      '<td><strong>' + esc(u.payrollRoleName || 'Platform grants') + '</strong><div class="tiny muted">' + esc(u.payrollRoleStatus || 'Inherited') + '</div></td>' +
      '<td>' + esc(duties) + (u.selfApproval ? '<div class="tiny delta warn">Approval exception</div>' : '') + '</td>' +
      '<td>' + badge(u.mfaEnrolled ? 'Enrolled' : 'Not enrolled') + '</td><td>' + badge(u.status) + '</td><td class="access-row-actions">' + controls + '</td></tr>';
  }).join('') || '<tr><td colspan="7"><div class="empty-state"><strong>No matching users</strong><p>Change the search or clear the filter.</p></div></td></tr>';
  const userTable = '<section class="card access-card"><div class="card-head"><div><h3>User access register</h3><p>Payroll permissions resolved by the Payroll API. Payroll-only assignments do not alter platform roles.</p></div></div>' +
    '<form class="payroll-access-filter" data-pr6-access-search><label class="sr-only" for="payrollAccessSearch">Search users</label><input id="payrollAccessSearch" type="search" value="' + esc(state.payrollAccessSearch || '') + '" placeholder="Search by name, email, department or role"><button class="btn" type="submit">Search</button><button class="btn" type="button" data-pr6-access-action="clear-search">Clear</button><span class="muted">' + filteredUsers.length + ' matching users</span></form>' +
    '<div class="table-wrap access-user-table"><table><thead><tr><th>User</th><th>Platform role</th><th>Payroll role</th><th>Duties</th><th>MFA</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + userRows + '</tbody></table></div>' +
    '<div class="payroll-access-pagination"><span>Showing ' + (filteredUsers.length ? (userPage - 1) * pageSize + 1 : 0) + '–' + Math.min(userPage * pageSize, filteredUsers.length) + ' of ' + filteredUsers.length + '</span><label>Rows <select id="payrollAccessPageSize">' + [10, 20, 50].map((n) => '<option ' + (pageSize === n ? 'selected' : '') + '>' + n + '</option>').join('') + '</select></label><button class="btn small" data-pr6-access-page="users" data-direction="previous" ' + (userPage <= 1 ? 'disabled' : '') + '>Previous</button><span>Page ' + userPage + ' of ' + userPages + '</span><button class="btn small" data-pr6-access-page="users" data-direction="next" ' + (userPage >= userPages ? 'disabled' : '') + '>Next</button></div></section>';

  const roleRows = visibleRoles.map((role) => {
    const grants = Object.values(role.permissions || {}).filter(Boolean).length;
    const actionButtons = canManage
      ? '<div class="access-row-actions"><button class="btn small" type="button" data-pr6-access-action="edit-role" data-role-id="' + esc(role.id) + '">Edit draft</button>' +
        (role.draftVersion ? '<button class="btn small primary" type="button" data-pr6-access-action="activate-role" data-role-id="' + esc(role.id) + '">Activate draft</button>' : '') +
        (role.activeVersion ? '<button class="btn small" type="button" data-pr6-access-action="toggle-role" data-role-id="' + esc(role.id) + '" data-enabled="' + (role.status !== 'disabled') + '">' + (role.status === 'disabled' ? 'Enable' : 'Disable') + '</button>' : '') +
        '<button class="btn small" type="button" data-pr6-access-action="assign-role" data-role-id="' + esc(role.id) + '">Assign</button></div>'
      : '<span class="muted">Read only</span>';
    return '<tr><td><strong>' + esc(role.name) + '</strong><div class="tiny muted">' + esc(role.description || 'Payroll-only role policy') + '</div></td><td>' + badge(role.stateLabel || 'Draft') + '</td><td>' + grants + ' of ' + permissions.length + '</td><td>' + role.userCount + '</td><td>' + (role.activeVersion?.version || '—') + (role.draftVersion ? ' · Draft ' + role.draftVersion.version : '') + '</td><td>' + actionButtons + '</td></tr>';
  }).join('') || '<tr><td colspan="6"><div class="empty-state"><strong>No Payroll roles configured</strong><p>Create a Payroll-only policy to assign distinct access without changing users’ other module roles.</p></div></td></tr>';
  const customRoles = '<section class="card access-card"><div class="card-head"><div><h3>Payroll role policies</h3><p>Draft changes are versioned; activate them deliberately. Maker and checker permissions cannot be combined.</p></div>' + (canManage ? '<button class="btn primary" type="button" data-pr6-access-action="new-role">' + icon('plus') + 'Create role</button>' : '') + '</div><div class="table-wrap"><table><thead><tr><th>Role</th><th>Status</th><th>Permissions</th><th>Members</th><th>Version</th><th>Actions</th></tr></thead><tbody>' + roleRows + '</tbody></table></div>' +
    '<div class="payroll-access-pagination"><span>Showing ' + (payrollRoles.length ? (rolePage - 1) * rolePageSize + 1 : 0) + '–' + Math.min(rolePage * rolePageSize, payrollRoles.length) + ' of ' + payrollRoles.length + '</span><label>Rows <select id="payrollAccessRolePageSize">' + [10, 20, 50].map((n) => '<option ' + (rolePageSize === n ? 'selected' : '') + '>' + n + '</option>').join('') + '</select></label><button class="btn small" data-pr6-access-page="roles" data-direction="previous" ' + (rolePage <= 1 ? 'disabled' : '') + '>Previous</button><span>Page ' + rolePage + ' of ' + rolePages + '</span><button class="btn small" data-pr6-access-page="roles" data-direction="next" ' + (rolePage >= rolePages ? 'disabled' : '') + '>Next</button></div></section>';

  const globalMatrixRows = permissions.map((permission) => '<tr><td><strong>' + esc(__pr6PermissionLabel(permission)) + '</strong><div class="tiny muted">' + esc(permission) + '</div></td>' + globalRoles.map((role) => '<td>' + (role.permissions.includes(permission) ? '✓' : '—') + '</td>').join('') + '</tr>').join('');
  const globalMatrix = globalRoles.length ? '<section class="card role-matrix-card"><div class="card-head"><div><h3>Platform role grants currently used by Payroll</h3><p>Inherited role grants remain view only here and are not modified by Payroll role policies.</p></div></div><div class="role-matrix-scroll"><table><thead><tr><th>Payroll permission</th>' + globalRoles.map((role) => '<th>' + esc(role.name) + '<div class="tiny muted">' + role.userCount + ' users</div></th>').join('') + '</tr></thead><tbody>' + globalMatrixRows + '</tbody></table></div></section>' : '';

  const panel = tab === 'roles' ? customRoles + globalMatrix : userTable;
  return '<div class="page access-dashboard">' + header + kpis + tabs + panel + '</div>';
}

async function __pr6AccessRefresh() {
  const refresh = window.__PAYROLL_V6_REFRESH_ACCESS__;
  if (typeof refresh !== 'function') throw new Error('The Payroll access service is not ready.');
  __pr6Live.accessRoster = await refresh();
  render();
}

function __pr6OpenAccessRoleModal(role) {
  const permissions = Array.isArray(__pr6Live.accessRoster?.permissions) ? __pr6Live.accessRoster.permissions : [];
  const values = role?.permissions || {};
  const checkboxes = permissions.map((permission) => '<label class="access-permission-option"><input type="checkbox" data-access-permission="' + __pr6Esc(permission) + '" ' + (values[permission] ? 'checked' : '') + '><span><strong>' + __pr6Esc(__pr6PermissionLabel(permission)) + '</strong><small>' + __pr6Esc(permission) + '</small></span></label>').join('');
  const html = '<input type="hidden" id="accessRoleId" value="' + __pr6Esc(role?.id || '') + '"><input type="hidden" id="accessRoleRevision" value="' + Number(role?.revision || 1) + '"><div class="form-grid"><div class="form-field"><label for="accessRoleName">Role name</label><input id="accessRoleName" maxlength="100" value="' + __pr6Esc(role?.name || '') + '" ' + (role ? 'readonly' : 'required') + '></div><div class="form-field"><label for="accessRoleDescription">Description</label><input id="accessRoleDescription" maxlength="500" value="' + __pr6Esc(role?.description || '') + '" placeholder="Describe this Payroll access profile"></div></div><p class="muted">Choose only the access this role needs. A draft takes effect after activation.</p><div class="access-permissions-grid">' + checkboxes + '</div>';
  openModal(role ? 'Edit Payroll role draft' : 'Create Payroll role', 'Payroll permissions apply only to Payroll and are recorded in the audit trail.', html, '<button class="btn" type="button" data-access-modal-close>Cancel</button><button class="btn primary" type="button" data-access-save-role>Save draft</button>', true);
}

async function __pr6AccessAssignModal(userId, roleId) {
  const loader = window.__PAYROLL_V6_ACCESS_USERS__;
  if (typeof loader !== 'function') { toast('Staff list unavailable', 'The Payroll staff lookup is not ready.', 'warn'); return; }
  try {
    const response = await loader({ limit: 100, page: 1, search: state.payrollAccessAssignSearch || '' });
    const users = response?.items || [];
    const userOptions = users.map((u) => '<option value="' + __pr6Esc(u.id) + '" ' + (String(u.id) === String(userId || '') ? 'selected' : '') + '>' + __pr6Esc(u.name) + ' · ' + __pr6Esc(u.email) + '</option>').join('');
    const roles = (__pr6Live.accessRoster?.payrollRoles || []).filter((r) => r.status === 'enabled' && r.activeVersion);
    const roleOptions = roles.map((r) => '<option value="' + __pr6Esc(r.id) + '" ' + (String(r.id) === String(roleId || '') ? 'selected' : '') + '>' + __pr6Esc(r.name) + '</option>').join('');
    if (!roles.length) { toast('No active Payroll roles', 'Create and activate a Payroll role before assigning it.', 'warn'); return; }
    const html = '<div class="form-grid"><div class="form-field"><label for="accessAssignSearch">Find internal staff</label><input id="accessAssignSearch" type="search" placeholder="Name, email or department" value="' + __pr6Esc(state.payrollAccessAssignSearch || '') + '"><label for="accessAssignUser">Internal staff account</label><select id="accessAssignUser">' + userOptions + '</select></div><div class="form-field"><label for="accessAssignRole">Active Payroll role</label><select id="accessAssignRole">' + roleOptions + '</select></div></div><p class="muted">This assignment changes Payroll permissions only. The user’s platform role remains unchanged.</p>';
    openModal('Assign Payroll role', 'Select an internal user and an active Payroll role.', html, '<button class="btn" type="button" data-access-modal-close>Cancel</button><button class="btn primary" type="button" data-access-assign-save>Save assignment</button>');
  } catch (error) { toast('Could not load staff', error?.message || String(error), 'warn'); }
}

async function __pr6ExportAccess(kind) {
  const exporter = window.__PAYROLL_V6_EXPORT_ACCESS__;
  if (typeof exporter !== 'function') { toast('Export unavailable', 'The Payroll export service is not ready.', 'warn'); return; }
  const roster = __pr6Live.accessRoster || {};
  const tab = state.payrollAccessTab === 'roles' ? 'roles' : 'users';
  let columns, rows, title, filename;
  if (tab === 'roles') {
    columns = ['Role', 'Status', 'Permission count', 'Assigned users', 'Active version'];
    rows = (roster.payrollRoles || []).map((r) => [r.name, r.stateLabel, Object.values(r.permissions || {}).filter(Boolean).length, r.userCount, r.activeVersion?.version || '']);
    title = 'Payroll Role Policies'; filename = 'payroll-role-policies';
  } else {
    columns = ['Name', 'Email', 'Department', 'Platform role', 'Payroll role', 'Duties', 'MFA', 'Status'];
    const search = String(state.payrollAccessSearch || '').trim().toLowerCase();
    rows = (roster.users || []).filter((u) => !search || [u.name, u.email, u.department, u.roleName, u.payrollRoleName, u.status].join(' ').toLowerCase().includes(search)).map((u) => [u.name, u.email, u.department || '', u.roleName || '', u.payrollRoleName || 'Platform grants', [u.canPrepare ? 'Maker' : '', u.canApprove ? 'Checker' : '', u.canRelease ? 'Release' : ''].filter(Boolean).join(', ') || 'View only', u.mfaEnrolled ? 'Enrolled' : 'Not enrolled', u.status]);
    title = 'Payroll User Access Register'; filename = 'payroll-user-access-register';
  }
  try { await exporter(kind, { title, subtitle: 'Payroll access and policy data from the Payroll API.', columns, rows, filename, landscape: true, note: 'Confidential Payroll access data. User database identifiers are omitted. Local and development exports use Matanho branding; production exports use NVCCZ branding.' }); }
  catch (error) { toast('Payroll access export failed', error?.message || String(error), 'warn'); }
}

document.addEventListener('submit', (event) => {
  if (!event.target?.matches?.('[data-pr6-access-search]')) return;
  event.preventDefault(); state.payrollAccessSearch = document.querySelector('#payrollAccessSearch')?.value?.trim() || ''; state.payrollAccessPage = 1; render();
}, true);

document.addEventListener('change', (event) => {
  if (event.target?.id === 'payrollAccessPageSize') { state.payrollAccessPageSize = Number(event.target.value) || 10; state.payrollAccessPage = 1; render(); }
  if (event.target?.id === 'payrollAccessRolePageSize') { state.payrollAccessRolePageSize = Number(event.target.value) || 10; state.payrollAccessRolePage = 1; render(); }
}, true);

let __pr6AccessAssignSearchTimer = null;
document.addEventListener('input', (event) => {
  if (event.target?.id !== 'accessAssignSearch') return;
  state.payrollAccessAssignSearch = event.target.value;
  window.clearTimeout(__pr6AccessAssignSearchTimer);
  __pr6AccessAssignSearchTimer = window.setTimeout(async () => {
    try {
      const response = await window.__PAYROLL_V6_ACCESS_USERS__({ limit: 100, page: 1, search: state.payrollAccessAssignSearch });
      const select = document.querySelector('#accessAssignUser');
      if (!select) return;
      const selected = select.value;
      select.innerHTML = (response?.items || []).map((u) => '<option value="' + __pr6Esc(u.id) + '" ' + (String(u.id) === String(selected) ? 'selected' : '') + '>' + __pr6Esc(u.name) + ' · ' + __pr6Esc(u.email) + '</option>').join('');
    } catch (error) { toast('Could not search staff', error?.message || String(error), 'warn'); }
  }, 250);
}, true);

document.addEventListener('click', async (event) => {
  const target = event.target?.closest?.('button'); if (!target) return;
  const tab = target.closest('[data-pr6-access-tab]');
  if (tab) { event.preventDefault(); state.payrollAccessTab = tab.dataset.pr6AccessTab; render(); return; }
  const page = target.closest('[data-pr6-access-page]');
  if (page) { event.preventDefault(); const key = page.dataset.pr6AccessPage === 'roles' ? 'payrollAccessRolePage' : 'payrollAccessPage'; state[key] = Math.max(1, Number(state[key] || 1) + (page.dataset.direction === 'next' ? 1 : -1)); render(); return; }
  const exporter = target.closest('[data-pr6-access-export]'); if (exporter) { event.preventDefault(); __pr6ExportAccess(exporter.dataset.pr6AccessExport); return; }
  const actionButton = target.closest('[data-pr6-access-action]');
  if (actionButton) {
    event.preventDefault(); const action = actionButton.dataset.pr6AccessAction; const roster = __pr6Live.accessRoster || {};
    try {
      if (action === 'clear-search') { state.payrollAccessSearch = ''; state.payrollAccessPage = 1; render(); }
      else if (action === 'new-role') __pr6OpenAccessRoleModal(null);
      else if (action === 'edit-role') __pr6OpenAccessRoleModal((roster.payrollRoles || []).find((r) => r.id === actionButton.dataset.roleId));
      else if (action === 'assign-user') await __pr6AccessAssignModal(actionButton.dataset.userId, roster.users?.find((u) => u.id === actionButton.dataset.userId)?.payrollRoleId);
      else if (action === 'assign-role') await __pr6AccessAssignModal('', actionButton.dataset.roleId);
      else if (action === 'activate-role') { const role = roster.payrollRoles?.find((r) => r.id === actionButton.dataset.roleId); if (role && confirm('Activate this Payroll role draft? This changes access for assigned users.')) { await window.__PAYROLL_V6_ACTIVATE_ACCESS_ROLE__(role.id, role.revision); await __pr6AccessRefresh(); toast('Payroll role activated', role.name + ' is now active.'); } }
      else if (action === 'toggle-role') { const role = roster.payrollRoles?.find((r) => r.id === actionButton.dataset.roleId); if (role) { const enable = role.status === 'disabled'; if (!enable && !confirm('Disable this Payroll role? Assigned users will lose its Payroll permissions.')) return; await window.__PAYROLL_V6_SET_ACCESS_ROLE_STATUS__(role.id, enable, role.revision); await __pr6AccessRefresh(); } }
      else if (action === 'remove-user') { if (confirm('Remove this Payroll role assignment? The user will return to the permissions from their platform role.')) { await window.__PAYROLL_V6_REMOVE_ACCESS_ROLE__(actionButton.dataset.userId); await __pr6AccessRefresh(); } }
    } catch (error) { toast('Payroll access change failed', error?.message || String(error), 'warn'); }
    return;
  }
  if (target.closest('[data-access-modal-close]')) { event.preventDefault(); closeModal(); return; }
  if (target.closest('[data-access-save-role]')) {
    event.preventDefault(); const roleId = document.querySelector('#accessRoleId')?.value || ''; const permissions = {};
    document.querySelectorAll('[data-access-permission]').forEach((input) => { permissions[input.dataset.accessPermission] = input.checked; });
    try {
      if (roleId) await window.__PAYROLL_V6_SAVE_ACCESS_ROLE__(roleId, permissions, Number(document.querySelector('#accessRoleRevision')?.value), document.querySelector('#accessRoleDescription')?.value?.trim());
      else await window.__PAYROLL_V6_CREATE_ACCESS_ROLE__({ name: document.querySelector('#accessRoleName')?.value?.trim(), description: document.querySelector('#accessRoleDescription')?.value?.trim(), permissions });
      closeModal(); await __pr6AccessRefresh(); toast('Draft saved', 'Activate the Payroll role draft when it is ready to take effect.');
    } catch (error) { toast('Could not save Payroll role', error?.message || String(error), 'warn'); }
    return;
  }
  if (target.closest('[data-access-assign-save]')) {
    event.preventDefault(); const userId = document.querySelector('#accessAssignUser')?.value; const roleId = document.querySelector('#accessAssignRole')?.value;
    try { await window.__PAYROLL_V6_ASSIGN_ACCESS_ROLE__(userId, roleId); closeModal(); await __pr6AccessRefresh(); toast('Payroll role assigned', 'The platform role was not changed.'); }
    catch (error) { toast('Could not assign Payroll role', error?.message || String(error), 'warn'); }
  }
}, true);

// ------------------------------------------------------------------- vault

function __pr6VaultPageHtml() {
  const eyebrow = 'Governed records management';
  const title = 'Payroll and HR Document Vault';
  const desc = 'Payroll and HR documents held behind the payroll vault permissions. Downloads go through the payroll API and are recorded in the audit trail.';
  if (!__pr6IsLive()) return __pr6PendingPanel(eyebrow, title, desc, 'Loading the document register…');
  if (__pr6LoadFailed('documents')) {
    return __pr6PendingPanel(eyebrow, title, desc, 'The document register could not be loaded.', true);
  }

  const esc = __pr6Esc;
  const canUpload = can('documents.manage');
  const all = Array.isArray(documents) ? documents : [];
  const q = String(state.vaultSearch || '').trim().toLowerCase();
  const cls = state.vaultClassification || 'All classifications';
  const owner = state.vaultOwner || 'All owners';
  const folder = state.folder || 'All documents';

  const classes = Array.from(new Set(all.map((d) => d.class))).sort();
  const owners = Array.from(new Set(all.map((d) => d.owner))).sort();
  const base = all.filter((d) => {
    const hay = [d.name, d.reference, d.folder, d.class, d.owner, d.periodLabel, d.run].join(' ').toLowerCase();
    return (!q || hay.indexOf(q) >= 0) &&
      (cls === 'All classifications' || d.class === cls) &&
      (owner === 'All owners' || d.owner === owner);
  });
  const docs = base.filter((d) => folder === 'All documents' || d.folder === folder);

  const opt = (v, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>';
  const toolbar =
    '<section class="card control-filter-card vault-filter-card"><div class="card-body"><div class="control-filter-toolbar">' +
    '<label class="control-filter-search"><span class="sr-only">Search document vault</span>' + icon('search') +
    '<input id="vaultSearchInput" value="' + esc(state.vaultSearch || '') + '" placeholder="Search name, reference, category, uploader or period"></label>' +
    '<label class="control-filter-field"><span>Classification</span><select id="vaultClassificationFilter">' + opt('All classifications', cls) + classes.map((v) => opt(v, cls)).join('') + '</select></label>' +
    '<label class="control-filter-field"><span>Uploaded by</span><select id="vaultOwnerFilter">' + opt('All owners', owner) + owners.map((v) => opt(v, owner)).join('') + '</select></label>' +
    '<button class="btn filter-clear" type="button" data-v6-clear-docs>' + icon('x') + 'Clear</button>' +
    '</div></div></section>';

  const folderList = Array.isArray(folders) && folders.length ? folders : ['All documents'];
  const folderGrid = folderList.map((name) => {
    const count = name === 'All documents' ? base.length : base.filter((d) => d.folder === name).length;
    return '<div class="folder ' + (folder === name ? 'active' : '') + '" data-folder="' + esc(name) + '"><div class="folder-top"><div class="folder-icon">' + icon('folder') + '</div><span class="folder-match-count">' + count + '</span></div><strong>' + esc(name) + '</strong></div>';
  }).join('');

  const rows = docs.map((d) =>
    '<tr data-document="' + esc(d.id) + '">' +
    '<td><div class="access-user"><div class="list-icon">' + icon('file') + '</div><div><strong class="link">' + esc(d.name) + '</strong><div class="tiny muted">' + esc(d.reference) + (d.periodLabel ? ' · ' + esc(d.periodLabel) : '') + '</div></div></div></td>' +
    '<td>' + esc(d.folder) + '</td>' +
    '<td>' + badge(d.class) + '</td>' +
    '<td>' + esc(d.owner) + '</td>' +
    '<td>' + esc(d.modified) + '</td>' +
    '<td>' + __pr6FileSize(d.sizeBytes) + '</td>' +
    '<td><button class="btn small" data-action="download-doc" data-id="' + esc(d.id) + '" data-filename="' + esc(d.name) + '">' + icon('download') + 'Download</button></td>' +
    '</tr>'
  );

  let body;
  if (!all.length) {
    body = card('Documents', 'Nothing stored yet',
      '<div class="card-body" style="text-align:center;padding:36px 24px"><strong>No documents have been uploaded to the payroll vault.</strong>' +
      '<p class="muted" style="margin:6px 0 0">' + (canUpload ? 'Upload a control pack, statutory return or employee record to start the register.' : 'Documents appear here once someone with upload permission adds them.') + '</p></div>');
  } else if (!docs.length) {
    body = '<section class="filtered-empty"><div><span class="empty-icon">' + icon('search') + '</span><strong>No documents match these filters</strong><p>Adjust the search, folder, classification or uploader.</p><button class="btn primary" type="button" data-v6-clear-docs>' + icon('x') + 'Clear document filters</button></div></section>';
  } else {
    body = tableCard(esc(folder), docs.length + ' of ' + all.length + (all.length === 1 ? ' document' : ' documents'),
      ['Document', 'Category', 'Classification', 'Uploaded by', 'Uploaded', 'Size', ''], rows);
  }

  const actions = canUpload ? button('Upload document', 'upload-document', 'primary', 'upload') : '';
  return '<div class="page">' + pageHead(eyebrow, title, desc, actions) + toolbar +
    '<div class="folder-grid" style="margin-bottom:14px">' + folderGrid + '</div>' + body + '</div>';
}

function __pr6DocumentDrawer(id) {
  const esc = __pr6Esc;
  const all = Array.isArray(documents) ? documents : [];
  const d = all.find((x) => x.id === id);
  if (!d) {
    toast('Document not found', 'It is not in the current register. Reload the vault and try again.', 'warn');
    return;
  }
  state.activeDoc = d.id;
  const fact = (k, v) => '<div class="fact"><span>' + k + '</span><strong>' + esc(v == null || v === '' ? '—' : v) + '</strong></div>';
  openDrawer(
    esc(d.name),
    esc(d.reference) + ' · ' + esc(d.folder),
    '<div class="profile-summary-strip">' + fact('Classification', d.class) + fact('Uploaded by', d.owner) + fact('Uploaded', d.modified) + fact('Size', __pr6FileSize(d.sizeBytes)) + '</div>' +
    '<section class="card" style="margin-top:12px"><div class="card-body form-grid">' + fact('Pay period', d.periodLabel) + fact('Payroll run', d.run) + fact('File type', d.type) + '</div></section>' +
    '<p class="tiny muted" style="margin-top:12px">The vault holds the file as uploaded. There is no in-browser editing or versioning, and every download is recorded in the payroll audit trail.</p>',
    '<button class="btn primary" data-action="download-doc" data-id="' + esc(d.id) + '" data-filename="' + esc(d.name) + '">' + icon('download') + 'Download</button>'
  );
}

function __pr6UploadModal() {
  if (!can('documents.manage')) return deny('documents.manage');
  const esc = __pr6Esc;
  const categories = (Array.isArray(folders) ? folders : []).filter((f) => f !== 'All documents');
  openModal(
    'Upload to Document Vault',
    'Stored as uploaded, up to 20 MB, labelled with a category and classification. Viewing and downloading require the payroll vault permissions.',
    '<div class="form-grid">' +
    '<div class="form-field full"><label>File</label><input type="file" id="pr6DocFile"></div>' +
    '<div class="form-field"><label>Category</label><select id="pr6DocCategory">' + categories.map((c) => '<option>' + esc(c) + '</option>').join('') + '</select></div>' +
    '<div class="form-field"><label>Classification</label><select id="pr6DocClassification"><option value="INTERNAL">Internal</option><option value="CONFIDENTIAL">Confidential</option><option value="RESTRICTED">Restricted</option><option value="HIGHLY_RESTRICTED">Highly restricted</option></select></div>' +
    '<div class="form-field full"><label>Pay period (optional)</label><input id="pr6DocPeriod" placeholder="September 2026"></div>' +
    '</div>',
    button('Cancel', 'close-modal') + button('Upload', 'confirm-upload', 'primary', 'upload')
  );
}

// ---------------------------------------------------------------- calendar

function __pr6FmtDay(d) {
  if (!d) return '—';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  // Period dates are @db.Date: midnight UTC. Formatting in local time would show the
  // previous day west of Greenwich.
  return t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function __pr6CalendarPageHtml() {
  const eyebrow = 'Payroll administration';
  const title = 'Pay Groups and Payroll Calendar';
  const desc = 'Pay groups and their dated periods: input cut-off, pay date and the status each period has reached.';
  if (!__pr6IsLive()) return __pr6PendingPanel(eyebrow, title, desc, 'Loading pay groups…');

  const c = __pr6PayGroups();
  if (!c) {
    return __pr6LoadFailed('pay-groups')
      ? __pr6PendingPanel(eyebrow, title, desc, 'Pay groups could not be loaded.', true)
      : __pr6PendingPanel(eyebrow, title, desc, 'Your role cannot view the pay calendar.');
  }

  const esc = __pr6Esc;
  const canEdit = __pr6Has('payroll.calendar.manage');
  const groups = c.groups;
  const selectedId = groups.some((g) => g.id === state.selectedPayGroup)
    ? state.selectedPayGroup
    : (groups[0] ? groups[0].id : null);
  const group = groups.find((g) => g.id === selectedId) || null;
  const periods = group
    ? (group.periods || []).slice().sort((a, b) => new Date(a.periodStart) - new Date(b.periodStart))
    : [];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const upcoming = (key) => periods
    .map((p) => p[key]).filter(Boolean).map((d) => new Date(d))
    .filter((d) => d >= today).sort((a, b) => a - b)[0] || null;
  const nextCutoff = upcoming('cutoffDate');
  const nextPay = upcoming('payDate');

  // "Open periods" is double-quoted on purpose. Patch 522 guards on the single-quoted
  // form, and the bridge is injected before the patches run, so identical text here
  // would make 522 report skip (already) on a fresh extract without applying.
  const kpis =
    kpi('Active pay groups', String(c.active), c.total + ' configured in total', 'users') +
    kpi('Next input cut-off', __pr6FmtDay(nextCutoff), group ? esc(group.name) : 'No pay group', 'calendar', 'amber') +
    kpi('Next payment', __pr6FmtDay(nextPay), group ? esc(group.currencyCode) + ' settlement' : 'No pay group', 'bank', 'cyan') +
    kpi('Pay periods', String(c.periods), 'Configured across all groups', 'shield', 'cyan') +
    kpi("Open periods", String(c.openPeriods), 'Periods with status Open', 'clock', 'amber');

  const cadence = (f) => { const v = String(f || ''); return v.charAt(0) + v.slice(1).toLowerCase(); };
  const groupCards = groups.map((g) =>
    '<article class="paygroup-card ' + (g.id === selectedId ? 'active' : '') + '" data-paygroup="' + esc(g.id) + '">' +
    '<div class="paygroup-card-head"><strong>' + esc(g.name) + '</strong>' + badge(g.isActive ? 'Active' : 'Inactive') + '</div>' +
    '<p>' + esc(g.code) + ' · ' + esc(g.currencyCode) + '</p>' +
    '<div class="paygroup-meta"><span class="meta-chip">' + esc(cadence(g.frequency)) + '</span>' +
    (g.payDayOfMonth ? '<span class="meta-chip">Pays on day ' + esc(g.payDayOfMonth) + '</span>' : '') +
    '<span class="meta-chip">' + g.periodCount + (g.periodCount === 1 ? ' period' : ' periods') + '</span></div></article>'
  ).join('');

  const rows = periods.map((p) =>
    '<tr><td data-label="Period"><strong>' + esc(p.periodLabel) + '</strong></td>' +
    '<td data-label="Starts">' + __pr6FmtDay(p.periodStart) + '</td>' +
    '<td data-label="Ends">' + __pr6FmtDay(p.periodEnd) + '</td>' +
    '<td data-label="Input cut-off">' + __pr6FmtDay(p.cutoffDate) + '</td>' +
    '<td data-label="Pay date">' + __pr6FmtDay(p.payDate) + '</td>' +
    '<td data-label="Status">' + badge(cadence(p.status)) + '</td>' +
    (canEdit ? '<td data-label="Action"><button class="btn small" data-action="pr6-edit-period" data-group-id="' + esc(group.id) + '" data-period-label="' + esc(p.periodLabel) + '">Edit</button></td>' : '') +
    '</tr>'
  );
  const headers = ['Period', 'Starts', 'Ends', 'Input cut-off', 'Pay date', 'Status'].concat(canEdit ? [''] : []);
  const addButton = canEdit && group
    ? '<button class="btn small" data-action="pr6-edit-period" data-group-id="' + esc(group.id) + '">' + icon('plus') + 'Add period</button>'
    : '';

  let board;
  if (!group) {
    board = card('Pay calendar', 'No pay groups',
      '<div class="card-body" style="text-align:center;padding:36px 24px"><strong>No pay groups have been set up.</strong><p class="muted" style="margin:6px 0 0">' +
      (canEdit ? 'Create a pay group, then add its periods.' : 'Pay groups appear here once they are configured.') + '</p></div>');
  } else if (!rows.length) {
    board = card(esc(group.name) + ' calendar', 'No periods yet',
      '<div class="card-body" style="text-align:center;padding:36px 24px"><strong>This pay group has no periods.</strong><p class="muted" style="margin:6px 0 0">' +
      (canEdit ? 'Add the first period to set its cut-off and pay date.' : 'Periods appear here once they are configured.') + '</p></div>', addButton);
  } else {
    board = tableCard(esc(group.name) + ' calendar', 'Dates as stored for each period', headers, rows, addButton);
  }

  const actions = canEdit ? button('Create pay group', 'new-paygroup', 'primary', 'plus') : '';
  return '<div class="page">' + pageHead(eyebrow, title, desc, actions) +
    '<div class="grid kpis">' + kpis + '</div>' +
    '<div class="calendar-layout"><aside class="paygroup-list">' + (groupCards || '<p class="muted">No pay groups.</p>') + '</aside>' +
    '<section class="calendar-board">' + board + '</section></div></div>';
}

function __pr6OpenPeriodModal(groupId, periodLabel) {
  if (!__pr6Has('payroll.calendar.manage')) {
    toast('Action restricted', 'Your role cannot change the pay calendar.', 'warn');
    return;
  }
  const esc = __pr6Esc;
  const c = __pr6PayGroups();
  const group = c && c.groups.find((g) => g.id === groupId);
  if (!group) {
    toast('Pay group not found', 'Reload the calendar and try again.', 'warn');
    return;
  }
  const p = periodLabel ? (group.periods || []).find((x) => x.periodLabel === periodLabel) : null;
  const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const statuses = __PR6_PERIOD_STATUSES;
  const dateField = (id, label, value) =>
    '<div class="form-field"><label>' + label + '</label><input type="date" id="' + id + '" value="' + esc(value) + '"></div>';
  openModal(
    p ? 'Edit ' + esc(p.periodLabel) : 'Add a period to ' + esc(group.name),
    // Periods are keyed by label, so the label is fixed when editing: renaming would
    // silently create a second period rather than change this one.
    'Saved to the pay group calendar. A period is identified by its label.',
    '<div class="form-grid"><input type="hidden" id="pr6PeriodGroup" value="' + esc(group.id) + '">' +
    '<div class="form-field"><label>Period label</label><input id="pr6PeriodLabel" value="' + esc(p ? p.periodLabel : '') + '" placeholder="October 2026"' + (p ? ' readonly' : '') + '></div>' +
    '<div class="form-field"><label>Status</label><select id="pr6PeriodStatus">' +
    statuses.map((st) => '<option value="' + st + '"' + (p && p.status === st ? ' selected' : '') + '>' + st.charAt(0) + st.slice(1).toLowerCase() + '</option>').join('') +
    '</select></div>' +
    dateField('pr6PeriodStart', 'Period starts', iso(p && p.periodStart)) +
    dateField('pr6PeriodEnd', 'Period ends', iso(p && p.periodEnd)) +
    dateField('pr6PeriodCutoff', 'Input cut-off', iso(p && p.cutoffDate)) +
    dateField('pr6PeriodPayDate', 'Pay date', iso(p && p.payDate)) +
    '</div>',
    button('Cancel', 'close-modal') + button('Save period', 'save-period', 'primary', 'calendar')
  );
}

/** Must match PERIOD_STATUSES in PayrollOperationsService. */
const __PR6_PERIOD_STATUSES = ['PLANNED', 'OPEN', 'LOCKED', 'PAID'];

function __pr6AuditEventClassLabel(value) {
  const text = String(value || 'Change').trim().replace(/[_-]+/g, ' ').toLowerCase();
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function __pr6AuditResourceLabel(value) {
  const path = String(value || '').toLowerCase();
  if (/payslip/.test(path)) return 'payslip';
  if (/employee/.test(path)) return 'employee record';
  if (/payroll-runs?|payroll_run/.test(path)) return 'payroll run';
  if (/access\/role-assignments?|role_assignment/.test(path)) return 'payroll role assignment';
  if (/access\/roles?|access_role/.test(path)) return 'payroll role';
  if (/compliance\/courses?|training course/.test(path)) return 'training course';
  if (/compliance\/assignments?|training assignment/.test(path)) return 'training assignment';
  if (/certification/.test(path)) return 'certification';
  if (/document/.test(path)) return 'payroll document';
  if (/input/.test(path)) return 'payroll input';
  if (/pay-groups?/.test(path)) return 'pay group';
  if (/statutory|tax-rule/.test(path)) return 'statutory rule';
  if (/component/.test(path)) return 'pay component';
  if (/calendar|period/.test(path)) return 'payroll calendar';
  if (/leave/.test(path)) return 'leave record';
  if (/approval/.test(path)) return 'approval';
  return 'payroll record';
}

function __pr6AuditEndpointInfo(event) {
  const action = String(event?.action || '').trim();
  const match = action.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
  if (!match) return null;
  const method = match[1].toUpperCase();
  const path = match[2];
  const resource = __pr6AuditResourceLabel(path);
  const leaf = path.toLowerCase().split('/').filter(Boolean).pop() || '';
  let verb = 'updated';
  if (/approve/.test(leaf)) verb = 'approved';
  else if (/reject|return/.test(leaf)) verb = 'rejected';
  else if (/submit/.test(leaf)) verb = 'submitted';
  else if (/release/.test(leaf)) verb = 'released';
  else if (/close/.test(leaf)) verb = 'closed';
  else if (/void/.test(leaf)) verb = 'voided';
  else if (/download|export/.test(leaf)) verb = 'downloaded';
  else if (/verify/.test(leaf)) verb = 'verified';
  else if (/assign/.test(leaf)) verb = 'assigned';
  else if (/import|upload/.test(leaf)) verb = 'imported';
  else if (/calculate|recalculate/.test(leaf)) verb = 'calculated';
  else if (/generate/.test(leaf)) verb = 'generated';
  else if (/post/.test(leaf)) verb = 'posted';
  else if (method === 'GET') verb = 'viewed';
  else if (method === 'DELETE') verb = 'removed';
  else if (method === 'POST') verb = 'created';
  return { resource, verb, label: verb.charAt(0).toUpperCase() + verb.slice(1) + ' ' + resource };
}

function __pr6AuditActionLabel(event) {
  const endpoint = __pr6AuditEndpointInfo(event);
  if (endpoint) return endpoint.label;
  const raw = String(event?.action || '').replace(/[_-]+/g, ' ').trim();
  if (!raw) return 'Activity recorded';
  return raw.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function __pr6AuditDetailLabel(event) {
  const raw = String(event?.detail || '').trim();
  const endpoint = __pr6AuditEndpointInfo(event);
  if (endpoint && (!raw || /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/?(?:api\/)?payroll\b|\breturned HTTP\s+\d{3}\b|\bin\s+\d+ms\b/i.test(raw))) {
    const status = Number(raw.match(/returned HTTP\s+(\d{3})/i)?.[1] || 0);
    if (status >= 400) return 'The ' + endpoint.resource + ' action was not completed because the request was rejected.';
    return 'The ' + endpoint.resource + ' was ' + endpoint.verb + ' successfully.';
  }
  if (/\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/?(?:api\/)?payroll\b|\breturned HTTP\s+\d{3}\b|\bin\s+\d+ms\b/i.test(raw)) {
    const status = Number(raw.match(/returned HTTP\s+(\d{3})/i)?.[1] || 0);
    return status >= 400 ? 'The payroll action was not completed because the request was rejected.' : 'The payroll action was completed successfully.';
  }
  return raw || 'No additional information was recorded.';
}

function __pr6AuditRecordLabel(event) {
  return event?.entityLabel || (event?.entityType && !/^payroll_/i.test(String(event.entityType))
    ? String(event.entityType).replace(/[_-]+/g, ' ')
    : __pr6AuditResourceLabel(event?.entityType || event?.action));
}

function __pr6AuditExportIcons() {
  return '<span class="audit-export-icons" role="group" aria-label="Export audit trail">' +
    '<button class="icon-btn" type="button" data-v6-export-audit="pdf" title="Export PDF" aria-label="Export audit trail as PDF">' + icon('file') + '</button>' +
    '<button class="icon-btn" type="button" data-v6-export-audit="excel" title="Export Excel" aria-label="Export audit trail as Excel">' + icon('report') + '</button>' +
    '<button class="icon-btn" type="button" data-v6-export-audit="csv" title="Export CSV" aria-label="Export audit trail as CSV">' + icon('download') + '</button></span>';
}

function __pr6AuditPageHtml() {
  const eyebrow = 'Payroll governance';
  const title = 'Payroll Audit Trail';
  const desc = 'Review payroll changes, approvals, access and security activity.';
  if (!__pr6IsLive()) return __pr6PendingPanel(eyebrow, title, desc, 'Loading Payroll audit history…');

  const payload = __pr6Live.audit;
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const stats = payload?.stats || {};
  const pagination = payload?.pagination || { page: state.auditPage || 1, limit: state.auditPageSize || 20, total: 0, totalPages: 0 };
  const filters = state.auditFilters || (state.auditFilters = { search: '', eventClass: '', from: '', to: '', actor: '', action: '', entityType: '', entityId: '' });
  const loading = state.auditLoading === true;
  const summary = (label, value, caption, iconName, tone) => kpi(label, value == null ? '—' : Number(value).toLocaleString(), caption, iconName, tone);
  const kpis = summary('Events recorded', stats.total, 'All Payroll audit events', 'audit') +
    summary('Approvals', stats.approvals, 'Submitted, approved or rejected', 'shield', 'violet') +
    summary('Changes', stats.changes, 'Payroll records and configuration', 'edit', 'cyan') +
    summary('Distinct actors', stats.actors, 'Users recorded in the audit ledger', 'users');

  const filterToolbar = '<section class="card audit-filter-card"><form class="audit-filter-toolbar" data-audit-filter-form>' +
    '<label class="audit-search"><span>Search events</span><input id="auditSearch" value="' + __pr6Esc(filters.search) + '" placeholder="Actor, action, record, or detail"></label>' +
    '<label><span>Category</span><select id="auditClass"><option value="">All categories</option>' +
    ['Change', 'Approval', 'Access', 'Release', 'Security', 'Sensitive'].map((c) => '<option value="' + c + '"' + (filters.eventClass === c ? ' selected' : '') + '>' + c + '</option>').join('') +
    '</select></label><label><span>From</span><input type="date" id="auditFrom" value="' + __pr6Esc(filters.from) + '"></label>' +
    '<label><span>To</span><input type="date" id="auditTo" value="' + __pr6Esc(filters.to) + '"></label>' +
    '<button class="btn small primary" type="submit">Apply</button><button class="btn small" type="button" data-audit-open-filters>Advanced filters</button>' +
    '<button class="btn small" type="button" data-audit-clear>Clear</button></form></section>';

  const rows = items.map((event, index) => {
    const stamp = event.occurredAt ? new Date(event.occurredAt).toLocaleString('en-GB', { hour12: false }) : '—';
    const eventClass = __pr6AuditEventClassLabel(event.eventClass);
    const entityName = __pr6AuditRecordLabel(event);
    const action = __pr6AuditActionLabel(event);
    return '<tr><td class="audit-timestamp">' + __pr6Esc(stamp) + '</td><td><strong>' + __pr6Esc(event.actorName || 'System') + '</strong><div class="tiny muted">' + __pr6Esc(event.actorRole || '—') + '</div></td>' +
      '<td class="audit-action-cell">' + __pr6Esc(action) + '</td><td>' + __pr6Esc(entityName) + '</td><td class="audit-detail-cell">' + __pr6Esc(__pr6AuditDetailLabel(event)) + '</td>' +
      '<td><span class="audit-class-badge audit-class-' + eventClass.toLowerCase().replace(/[^a-z]+/g, '-') + '">' + __pr6Esc(eventClass) + '</span></td>' +
      '<td><button class="btn small" type="button" data-audit-detail="' + index + '">' + icon('eye') + 'Details</button></td></tr>';
  });
  const page = Math.max(1, Number(pagination.page) || 1);
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const limit = Number(pagination.limit) || state.auditPageSize || 20;
  const total = Number(pagination.total) || 0;
  const first = total ? (page - 1) * limit + 1 : 0;
  const last = Math.min(page * limit, total);
  const tableBody = loading
    ? Array.from({ length: 7 }, () => '<tr class="skeleton-row"><td colspan="7"><span class="skeleton-line"></span></td></tr>').join('')
    : rows.join('') || '<tr><td colspan="7" class="empty-cell">No Payroll audit events match these filters.</td></tr>';
  const table = '<section class="card audit-ledger-card"><div class="card-head"><div><h2>Activity history</h2><p>A read-only history of payroll activity and decisions.</p></div><div class="audit-ledger-actions"><button class="btn small" type="button" data-audit-refresh>Refresh</button></div></div>' +
    '<div class="table-wrap"><table class="data-table audit-ledger-table"><thead><tr><th>TIME</th><th>ACTOR / ROLE</th><th>ACTION</th><th>RECORD</th><th>DETAIL</th><th>CATEGORY</th><th></th></tr></thead><tbody>' + tableBody + '</tbody></table></div>' +
    '<div class="audit-pagination"><span>Showing ' + first + '–' + last + ' of ' + total + '</span><div><label>Rows <select id="auditPageSize"><option' + (limit === 10 ? ' selected' : '') + '>10</option><option' + (limit === 20 ? ' selected' : '') + '>20</option><option' + (limit === 50 ? ' selected' : '') + '>50</option><option' + (limit === 100 ? ' selected' : '') + '>100</option></select></label>' +
    '<button class="btn small" type="button" data-audit-page="' + Math.max(1, page - 1) + '"' + (page <= 1 || loading ? ' disabled' : '') + '>Previous</button><span>Page ' + page + ' of ' + totalPages + '</span><button class="btn small" type="button" data-audit-page="' + Math.min(totalPages, page + 1) + '"' + (page >= totalPages || loading ? ' disabled' : '') + '>Next</button></div></div></section>';
  return '<div class="page">' + pageHead(eyebrow, title, desc, __pr6AuditExportIcons()) +
    '<div class="grid kpis audit-kpis">' + kpis + '</div>' + filterToolbar + table + '</div>';
}

// Function declarations are hoisted in the runtime scope; replacing this binding
// keeps the existing route/menu wiring while removing the fixture-only audit page.
auditPage = __pr6AuditPageHtml;

async function __pr6LoadAudit(page) {
  const loader = window.__PAYROLL_V6_LIST_AUDIT__;
  if (typeof loader !== 'function') { toast('Audit service unavailable', 'The Payroll audit API is not ready.', 'warn'); return; }
  state.auditPage = Math.max(1, Number(page) || 1);
  state.auditLoading = !Array.isArray(__pr6Live.audit?.items);
  if (state.auditLoading) render();
  try {
    const filters = state.auditFilters || {};
    __pr6Live.audit = await loader({ ...filters, page: state.auditPage, limit: state.auditPageSize || 20 });
  } catch (error) {
    toast('Could not load audit events', error?.message || String(error), 'warn');
  } finally {
    state.auditLoading = false;
    render();
  }
}

async function __pr6ExportAudit(kind) {
  const loader = window.__PAYROLL_V6_LIST_AUDIT__;
  const exporter = window.__PAYROLL_V6_EXPORT_AUDIT__;
  if (typeof loader !== 'function' || typeof exporter !== 'function') { toast('Export unavailable', 'The Payroll audit export service is not ready.', 'warn'); return; }
  try {
    const filters = state.auditFilters || {};
    const firstPage = await loader({ ...filters, page: 1, limit: 100 });
    const all = [...(firstPage.items || [])];
    for (let page = 2; page <= Math.min(firstPage.pagination?.totalPages || 1, 200); page++) {
      const next = await loader({ ...filters, page, limit: 100 });
      all.push(...(next.items || []));
    }
    const date = (v) => v ? new Date(v).toLocaleString('en-GB', { hour12: false }) : '';
    const rows = all.map((event) => [date(event.occurredAt), event.actorName || 'System', event.actorRole || '', __pr6AuditActionLabel(event), __pr6AuditRecordLabel(event), __pr6AuditDetailLabel(event), __pr6AuditEventClassLabel(event.eventClass)]);
    await exporter(kind, {
      title: 'Payroll Audit Trail',
      subtitle: 'Filtered payroll activity, newest first.',
      columns: ['Timestamp', 'Actor', 'Role', 'Action', 'Record', 'Detail', 'Category'],
      rows,
      filename: 'payroll-audit-trail',
      landscape: true,
      note: 'Confidential Payroll audit evidence. Internal database identifiers are omitted. Local and development exports use Matanho branding; production exports use NVCCZ branding.',
    });
  } catch (error) {
    toast('Audit export failed', error?.message || String(error), 'warn');
  }
}

document.addEventListener('submit', (event) => {
  if (!event.target?.matches?.('[data-audit-filter-form]')) return;
  event.preventDefault();
  state.auditFilters = { ...(state.auditFilters || {}), search: document.querySelector('#auditSearch')?.value?.trim() || '', eventClass: document.querySelector('#auditClass')?.value || '', from: document.querySelector('#auditFrom')?.value || '', to: document.querySelector('#auditTo')?.value || '' };
  __pr6LoadAudit(1);
}, true);

document.addEventListener('change', (event) => {
  if (event.target?.id === 'auditPageSize') { state.auditPageSize = Number(event.target.value) || 20; __pr6LoadAudit(1); }
}, true);

document.addEventListener('click', (event) => {
  const target = event.target?.closest?.('button,[data-page]');
  if (!target) return;
  const nav = target.closest('[data-page="audit"]');
  if (nav) { event.preventDefault(); event.stopImmediatePropagation(); goPage('audit'); if (!Array.isArray(__pr6Live.audit?.items)) __pr6LoadAudit(1); return; }
  const pageButton = target.closest('[data-audit-page]');
  if (pageButton) { event.preventDefault(); event.stopImmediatePropagation(); __pr6LoadAudit(pageButton.dataset.auditPage); return; }
  if (target.closest('[data-audit-refresh]')) { event.preventDefault(); event.stopImmediatePropagation(); __pr6LoadAudit(state.auditPage || 1); return; }
  const exportButton = target.closest('[data-v6-export-audit]');
  if (exportButton) { event.preventDefault(); event.stopImmediatePropagation(); __pr6ExportAudit(exportButton.dataset.v6ExportAudit); return; }
  if (target.closest('[data-audit-clear]')) { event.preventDefault(); event.stopImmediatePropagation(); state.auditFilters = { search: '', eventClass: '', from: '', to: '', actor: '', action: '', entityType: '', entityId: '' }; __pr6LoadAudit(1); return; }
  if (target.closest('[data-audit-open-filters]')) {
    event.preventDefault(); event.stopImmediatePropagation(); const f = state.auditFilters || {};
    openModal('Advanced audit filters', 'Narrow Payroll events by actor, action, record type, or reference.',
      '<div class="form-grid audit-advanced-form"><div class="form-field"><label for="auditActor">Actor or role</label><input id="auditActor" value="' + __pr6Esc(f.actor || '') + '" placeholder="Name or role"></div>' +
      '<div class="form-field"><label for="auditAction">Action</label><input id="auditAction" value="' + __pr6Esc(f.action || '') + '" placeholder="Action phrase"></div>' +
      '<div class="form-field"><label for="auditEntityType">Record type</label><input id="auditEntityType" value="' + __pr6Esc(f.entityType || '') + '" placeholder="e.g. payroll_run"></div>' +
      '<div class="form-field"><label for="auditEntityId">Record reference</label><input id="auditEntityId" value="' + __pr6Esc(f.entityId || '') + '" placeholder="Known record reference"></div></div>',
      '<button class="btn" data-audit-close>Cancel</button><button class="btn" data-audit-clear-advanced>Clear</button><button class="btn primary" data-audit-apply-advanced>Apply filters</button>'); return;
  }
  if (target.closest('[data-audit-close]')) { event.preventDefault(); event.stopImmediatePropagation(); closeModal(); return; }
  if (target.closest('[data-audit-clear-advanced]')) { event.preventDefault(); event.stopImmediatePropagation(); state.auditFilters = { search: '', eventClass: '', from: '', to: '', actor: '', action: '', entityType: '', entityId: '' }; closeModal(); __pr6LoadAudit(1); return; }
  if (target.closest('[data-audit-apply-advanced]')) { event.preventDefault(); event.stopImmediatePropagation(); state.auditFilters = { ...(state.auditFilters || {}), actor: document.querySelector('#auditActor')?.value?.trim() || '', action: document.querySelector('#auditAction')?.value?.trim() || '', entityType: document.querySelector('#auditEntityType')?.value?.trim() || '', entityId: document.querySelector('#auditEntityId')?.value?.trim() || '' }; closeModal(); __pr6LoadAudit(1); return; }
  const detailButton = target.closest('[data-audit-detail]');
  if (detailButton) {
    event.preventDefault(); event.stopImmediatePropagation(); const item = __pr6Live.audit?.items?.[Number(detailButton.dataset.auditDetail)]; if (!item) return;
    const fact = (label, value) => '<div class="fact"><span>' + __pr6Esc(label) + '</span><strong>' + __pr6Esc(value || '—') + '</strong></div>';
    const html = '<div class="grid two audit-detail-facts">' + fact('Actor', item.actorName) + fact('Role', item.actorRole) + fact('Action', __pr6AuditActionLabel(item)) + fact('Category', __pr6AuditEventClassLabel(item.eventClass)) + fact('Record', __pr6AuditRecordLabel(item)) + fact('Occurred', item.occurredAt ? new Date(item.occurredAt).toLocaleString('en-GB', { hour12: false }) : '') + '</div><section class="card audit-detail-copy"><div class="card-body"><strong>What happened</strong><p>' + __pr6Esc(__pr6AuditDetailLabel(item)) + '</p></div></section>';
    openModal('Audit event details', 'Recorded payroll activity and decision details.', html, '<button class="btn primary" data-audit-close>Close</button>'); return;
  }
}, true);

if (!window.__pr6AuditRefreshTimer) {
  window.__pr6AuditRefreshTimer = window.setInterval(() => {
    if (state.page === 'audit' && !state.auditLoading) __pr6LoadAudit(state.auditPage || 1);
  }, 30000);
}

document.addEventListener('click', (event) => {
  const el = event.target && event.target.closest ? event.target.closest('[data-action="pr6-edit-period"]') : null;
  if (!el) return;
  event.preventDefault();
  __pr6OpenPeriodModal(el.getAttribute('data-group-id'), el.getAttribute('data-period-label'));
}, true);
  /* END_PAYROLL_LIVE_BRIDGE */










const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeStorage={getItem(key){try{return window.safeStorage.getItem(key)}catch{return null}},setItem(key,value){try{window.safeStorage.setItem(key,value)}catch{}}};
const iconPaths={
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',chev:'<path d="m9 18 6-6-6-6"/>',home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 userplus:'<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',wallet:'<path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V7"/><path d="M16 14h4"/>',
 upload:'<path d="M12 16V3m0 0 5 5m-5-5L7 8"/><path d="M5 21h14"/>',alert:'<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4m0 4h.01"/>',
 check:'<path d="m5 12 4 4L19 6"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2H14v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1V14h-.1a1.7 1.7 0 0 0-1.7 1z"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',folder:'<path d="M3 5h6l2 2h10v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
 report:'<path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/>',lock:'<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
 graduation:'<path d="m2 10 10-5 10 5-10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
 audit:'<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M9 15 20 4M15 4h5v5M7 8h5M7 12h3M7 16h2"/>',key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M15 7l2 2M18 4l2 2"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 bank:'<path d="m3 10 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>',building:'<path d="M4 22V2h16v20M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2M9 22v-4h6v4"/>',
 refresh:'<path d="M20 7h-6V1"/><path d="M20 7a9 9 0 1 0 2 6"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',trash:'<path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 11v6M14 11v6"/>',
 briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',id:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c1-2 5-2 6 0M14 9h4M14 13h4"/>',
 sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',spark:'<path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
};
const icon=(n)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[n]||iconPaths.file}</svg>`;

const permissions=[
 ['employee.view','View employee records'],['employee.edit','Edit employee and contract records'],['salary.view','View compensation and bank data'],['salary.edit','Edit compensation and bank data'],
 ['payroll.prepare','Create and calculate payroll runs'],['payroll.approve','Approve or reject payroll runs'],['payroll.release','Release bank batches and payslips'],['exceptions.resolve','Resolve payroll exceptions'],
 ['statutory.manage','Manage statutory rules and returns'],['documents.manage','Upload, edit and classify documents'],['reports.generate','Generate and export compliance reports'],['audit.view','View immutable audit history'],
 ['rbac.manage','Manage roles, access and segregation rules'],['self.view','View own employee self-service data']
];
const roles={
 'System Administrator':['employee.view','employee.edit','salary.view','salary.edit','payroll.prepare','payroll.approve','payroll.release','exceptions.resolve','statutory.manage','documents.manage','reports.generate','audit.view','rbac.manage','settings.view','settings.manage','self.view'],
 'Payroll Manager':['employee.view','employee.edit','salary.view','salary.edit','payroll.prepare','payroll.approve','payroll.release','exceptions.resolve','statutory.manage','documents.manage','reports.generate','audit.view','settings.view','settings.manage','self.view'],
 'HR Manager':['employee.view','employee.edit','salary.view','salary.edit','documents.manage','reports.generate','audit.view','self.view'],
 'Payroll Processor':['employee.view','salary.view','payroll.prepare','exceptions.resolve','documents.manage','reports.generate','self.view'],
 'Compliance Officer':['employee.view','salary.view','statutory.manage','documents.manage','reports.generate','audit.view','self.view'],
 'Approver / CFO':['employee.view','salary.view','payroll.approve','payroll.release','reports.generate','audit.view','self.view'],
 'Internal Auditor':['employee.view','salary.view','documents.manage','reports.generate','audit.view','self.view'],
 'Employee':['self.view']
};
const pagePermission={overview:'dashboard.view',employees:'employee.view',onboarding:'onboarding.view',runs:'runs.view',inputs:'inputs.view',exceptions:'exceptions.view',approvals:'payroll.approve',close:'payroll.release',components:'salary.view',calendar:'calendar.view',tax:'statutory.view',training:'training.view',leave:'leave.view',vault:'documents.view',reports:'reports.view',audit:'audit.view',access:'rbac.view',settings:'settings.view',mypay:'self.view'};
const navGroups=[
 ['OPERATIONS',[['overview','Command Centre','home'],['employees','Employees','users','4'],['onboarding','Onboarding','userplus','2'],['runs','Payroll Runs','calculator','3'],['exceptions','Exception Workbench','alert','12'],['approvals','Maker-Checker Review','shield','3'],['close','Close & Distribution','send']]],
 ['PAYROLL ADMINISTRATION',[['components','Earnings & Deductions','wallet'],['calendar','Pay Groups & Calendar','calendar'],['tax','Tax & Statutory Rules','calculator']]],
 ['HUMAN CAPITAL',[['training','Training & Compliance','graduation','13'],['leave','Leave & Benefits','heart']]],
 ['GOVERNANCE',[['vault','Document Vault','folder'],['reports','Compliance Reports','report'],['audit','Audit Trail','audit'],['access','Roles & Access Control','key'],['settings','Settings & Integrations','settings']]],
 ['EMPLOYEE PORTAL',[['mypay','My Pay','id']]]
];
const state={page:(typeof initialPage==='string'&&initialPage)?initialPage:'overview',theme:safeStorage.getItem('matanho-payroll-theme')||'light',role:safeStorage.getItem('matanho-payroll-role')||'Payroll Manager',period:'June 2026',folder:'All documents',employeeSearch:'',employeeDepartment:'All departments',employeeReadiness:'All readiness states',onboardingFormStep:1,reportDraft:null,activeDoc:null,notifications:7,onboardingPage:1,exceptionSearch:'',exceptionSeverity:'All severities',exceptionSource:'All sources',exceptionPage:1,exceptionPageSize:10};

let employees=[
 {id:'EMP-0007',name:'Rudo Sibanda',initials:'RS',title:'Finance Officer',department:'Finance',branch:'Harare Head Office',type:'Permanent',start:'12 Feb 2022',currency:'USD / ZiG',base:2250,zig:165000,readiness:96,status:'Ready',bank:'Stanbic Bank **** 4521',tax:'10-284726-K-19',nssa:'073964821',email:'rudo.sibanda@arcusholdings.co.zw',phone:'+263 77 284 6193',documents:12,leave:'15.5 days',training:'Compliant'},
 {id:'EMP-0012',name:'Tendai Moyo',initials:'TM',title:'Payroll Manager',department:'People & Culture',branch:'Harare Head Office',type:'Permanent',start:'03 May 2021',currency:'USD / ZiG',base:3820,zig:295000,readiness:100,status:'Ready',bank:'CBZ Bank **** 1884',tax:'10-183623-J-10',nssa:'081264523',email:'tendai.moyo@arcusholdings.co.zw',phone:'+263 71 255 9004',documents:15,leave:'18.0 days',training:'Compliant'},
 {id:'EMP-0021',name:'Brian Chikota',initials:'BC',title:'Operations Supervisor',department:'Operations',branch:'Bulawayo Branch',type:'Permanent',start:'18 Aug 2020',currency:'USD',base:1880,zig:0,readiness:82,status:'Review',bank:'FBC Bank **** 2207',tax:'10-337821-P-14',nssa:'067341280',email:'brian.chikota@arcusholdings.co.zw',phone:'+263 78 312 7702',documents:9,leave:'8.5 days',training:'1 expiring'},
 {id:'EMP-0035',name:'Nyasha Dube',initials:'ND',title:'Procurement Analyst',department:'Procurement',branch:'Harare Head Office',type:'Permanent',start:'07 Nov 2023',currency:'USD / ZiG',base:2050,zig:118000,readiness:91,status:'Ready',bank:'Nedbank **** 7390',tax:'10-294120-F-12',nssa:'087316492',email:'nyasha.dube@arcusholdings.co.zw',phone:'+263 77 630 4420',documents:11,leave:'12.0 days',training:'Compliant'},
 {id:'EMP-0044',name:'Farai Mutasa',initials:'FM',title:'Sales Executive',department:'Commercial',branch:'Mutare Branch',type:'Permanent',start:'21 Jan 2024',currency:'USD',base:1350,zig:0,readiness:74,status:'Blocked',bank:'Ecobank **** 0064',tax:'Pending',nssa:'Pending',email:'farai.mutasa@arcusholdings.co.zw',phone:'+263 78 901 2375',documents:6,leave:'6.0 days',training:'2 overdue'},
 {id:'EMP-0059',name:'Chipo Ndlovu',initials:'CN',title:'HR Business Partner',department:'People & Culture',branch:'Bulawayo Branch',type:'Permanent',start:'15 Jun 2019',currency:'USD / ZiG',base:2975,zig:210000,readiness:98,status:'Ready',bank:'Stanbic Bank **** 9011',tax:'10-112970-S-07',nssa:'051336802',email:'chipo.ndlovu@arcusholdings.co.zw',phone:'+263 71 899 1204',documents:16,leave:'20.5 days',training:'Compliant'},
 {id:'EMP-0063',name:'Tatenda Maposa',initials:'TM',title:'Workshop Technician',department:'Operations',branch:'Gweru Branch',type:'Contract',start:'01 Mar 2026',currency:'ZiG',base:0,zig:148000,readiness:86,status:'Review',bank:'POSB **** 3028',tax:'10-445720-B-16',nssa:'095421780',email:'tatenda.maposa@arcusholdings.co.zw',phone:'+263 77 418 2366',documents:8,leave:'4.0 days',training:'1 expiring'},
 {id:'EMP-0078',name:'Simbarashe Zhou',initials:'SZ',title:'IT Support Specialist',department:'Technology',branch:'Harare Head Office',type:'Permanent',start:'10 Sep 2022',currency:'USD / ZiG',base:2200,zig:95000,readiness:94,status:'Ready',bank:'BancABC **** 4118',tax:'10-227014-M-09',nssa:'078463902',email:'simba.zhou@arcusholdings.co.zw',phone:'+263 71 754 8820',documents:10,leave:'11.5 days',training:'Compliant'}
];
let payrollRuns=[
 {id:'PAY-2026-06-M',period:'June 2026',group:'Monthly Staff',employees:128,currency:'USD / ZiG',grossUSD:264720,grossZiG:7459664,deductions:77444,netUSD:187276,status:'Approval review',stage:4,owner:'Tariro Moyo',variance:2.4},
 {id:'PAY-2026-06-E',period:'June 2026',group:'Executives',employees:12,currency:'USD',grossUSD:98240,grossZiG:0,deductions:29710,netUSD:68530,status:'Calculated',stage:3,owner:'Tariro Moyo',variance:0.8},
 {id:'PAY-2026-05-M',period:'May 2026',group:'Monthly Staff',employees:126,currency:'USD / ZiG',grossUSD:256180,grossZiG:7134000,deductions:74980,netUSD:181200,status:'Released',stage:6,owner:'Rudo Sibanda',variance:1.1},
 {id:'PAY-2026-05-C',period:'May 2026',group:'Contract Staff',employees:34,currency:'ZiG',grossUSD:0,grossZiG:3230000,deductions:458200,netUSD:0,status:'Released',stage:6,owner:'Rudo Sibanda',variance:-0.4}
];
let exceptions=[
 {id:'EXC-0612',employee:'Rudo Sibanda',employeeId:'EMP-0007',type:'Bank account change',severity:'Critical',source:'Employee master',amount:'USD 2,250.00',owner:'Tariro Moyo',age:'3h 18m',status:'Open',detail:'Bank details changed within the payroll freeze window and require independent verification.'},
 {id:'EXC-0617',employee:'Farai Mutasa',employeeId:'EMP-0044',type:'Missing tax number',severity:'Critical',source:'Statutory validation',amount:'USD 1,350.00',owner:'Chipo Ndlovu',age:'1d 4h',status:'Open',detail:'PAYE calculation cannot be finalised until a valid taxpayer reference is captured.'},
 {id:'EXC-0624',employee:'Brian Chikota',employeeId:'EMP-0021',type:'Overtime variance',severity:'High',source:'Time and attendance',amount:'USD 428.40',owner:'Rudo Sibanda',age:'7h 05m',status:'Investigating',detail:'Submitted overtime is 61% above the employee six-month average.'},
 {id:'EXC-0629',employee:'Tatenda Maposa',employeeId:'EMP-0063',type:'Contract end date',severity:'High',source:'Contract record',amount:'ZiG 148,000',owner:'Chipo Ndlovu',age:'10h 44m',status:'Open',detail:'Contract expires before the payroll payment date.'},
 {id:'EXC-0631',employee:'Nyasha Dube',employeeId:'EMP-0035',type:'Allowance duplication',severity:'Medium',source:'Bulk input file',amount:'USD 185.00',owner:'Tariro Moyo',age:'2h 12m',status:'Open',detail:'Transport allowance appears in both recurring and imported inputs.'},
 {id:'EXC-0637',employee:'Simbarashe Zhou',employeeId:'EMP-0078',type:'Cost centre mismatch',severity:'Medium',source:'GL mapping',amount:'USD 2,200.00',owner:'Rudo Sibanda',age:'5h 36m',status:'Investigating',detail:'Employee cost centre is inactive in the current finance ledger mapping.'}
];
let documents=[
 {id:'DOC-001',name:'June 2026 Payroll Control Pack',folder:'Payroll control packs',type:'Editable report',owner:'Tariro Moyo',modified:'28 Jun 2026 16:42',class:'Restricted',versions:7,status:'Approved',content:'Payroll calculation controls, exception register, maker-checker evidence and release confirmations for June 2026.'},
 {id:'DOC-002',name:'PAYE Return - June 2026',folder:'Statutory returns',type:'Compliance return',owner:'Rudo Sibanda',modified:'28 Jun 2026 15:18',class:'Confidential',versions:3,status:'Ready to file',content:'PAYE reconciliation and employee-level tax schedule generated from the approved June payroll.'},
 {id:'DOC-003',name:'NSSA P4 Schedule - June 2026',folder:'Statutory returns',type:'Compliance return',owner:'Rudo Sibanda',modified:'28 Jun 2026 14:56',class:'Confidential',versions:2,status:'Ready to file',content:'NSSA contribution schedule reconciled to payroll and general ledger control accounts.'},
 {id:'DOC-004',name:'Payroll Processing Standard Operating Procedure',folder:'Policies and procedures',type:'Policy',owner:'Chipo Ndlovu',modified:'20 Jun 2026 11:05',class:'Internal',versions:11,status:'Published',content:'Governed operating procedure covering payroll inputs, validation, approvals, distribution, statutory filing and evidence retention.'},
 {id:'DOC-005',name:'Rudo Sibanda Employment Contract',folder:'Employee records',type:'Employment contract',owner:'Chipo Ndlovu',modified:'12 Feb 2022 09:20',class:'Restricted',versions:2,status:'Active',content:'Permanent employment contract, compensation schedule and applicable company policies.'},
 {id:'DOC-006',name:'June 2026 Bank Payment Instruction',folder:'Bank and payment files',type:'Payment instruction',owner:'Tariro Moyo',modified:'28 Jun 2026 17:02',class:'Highly restricted',versions:4,status:'Awaiting release',content:'Controlled payment instruction for approved net pay, separated by bank, currency and settlement date.'},
 {id:'DOC-007',name:'Training Compliance Register Q2 2026',folder:'Training and compliance',type:'Compliance register',owner:'Chipo Ndlovu',modified:'25 Jun 2026 13:40',class:'Internal',versions:6,status:'Published',content:'Mandatory training completion, expiry risk and role permission impact register.'},
 {id:'DOC-008',name:'Payroll Access Review - Q2 2026',folder:'Access reviews',type:'Access certification',owner:'Internal Audit',modified:'26 Jun 2026 10:10',class:'Restricted',versions:5,status:'In review',content:'Quarterly certification of payroll roles, privileged access, segregation conflicts and dormant accounts.'}
];
let folders=['All documents','Payroll control packs','Statutory returns','Employee records','Policies and procedures','Bank and payment files','Training and compliance','Access reviews'];
let reportTemplates=[
 {id:'paye',name:'PAYE Reconciliation and Return Pack',category:'Statutory',desc:'Reconcile taxable earnings, PAYE, ledger control accounts and filing values with employee-level traceability.',freq:'Monthly',perm:'statutory.manage'},
 {id:'nssa',name:'NSSA Contribution Schedule',category:'Statutory',desc:'Employer and employee contribution schedule, exception analysis and payment control totals.',freq:'Monthly',perm:'statutory.manage'},
 {id:'aids',name:'AIDS Levy Control Report',category:'Statutory',desc:'Calculate and reconcile the statutory levy against PAYE with filing-ready supporting schedules.',freq:'Monthly',perm:'statutory.manage'},
 {id:'variance',name:'Payroll Variance and Movement Report',category:'Payroll control',desc:'Explain period-on-period changes in headcount, gross pay, deductions, allowances and net pay.',freq:'Every run',perm:'reports.generate'},
 {id:'bank',name:'Bank Payment Control Report',category:'Payment control',desc:'Reconcile approved net pay to bank batches, rejected payments, account changes and release evidence.',freq:'Every run',perm:'payroll.release'},
 {id:'gl',name:'Payroll to General Ledger Reconciliation',category:'Finance',desc:'Reconcile payroll journals to finance ledgers by entity, branch, cost centre and account.',freq:'Monthly',perm:'reports.generate'},
 {id:'training',name:'Training and Certification Compliance',category:'Human capital',desc:'Show completion, overdue certifications, expiry risk and roles affected by non-compliance.',freq:'Monthly',perm:'reports.generate'},
 {id:'leave',name:'Leave Liability and Utilisation',category:'Human capital',desc:'Quantify leave balances, provisions, utilisation, forfeiture risk and departmental exposure.',freq:'Monthly',perm:'reports.generate'},
 {id:'access',name:'Payroll Access and SoD Certification',category:'Governance',desc:'Review active roles, privileged access, incompatible permissions, MFA and reviewer attestations.',freq:'Quarterly',perm:'rbac.manage'},
 {id:'audit',name:'Payroll Audit Evidence Pack',category:'Audit',desc:'Package approvals, calculations, source files, exceptions, version history and immutable event logs.',freq:'On demand',perm:'audit.view'},
 {id:'demographics',name:'Workforce Demographics and Cost',category:'Management',desc:'Headcount and employment cost analysis by entity, branch, department, grade and contract type.',freq:'Monthly',perm:'reports.generate'},
 {id:'termination',name:'Terminations and Final Pay Register',category:'Human capital',desc:'Final pay, leave encashment, deductions, approvals, exit documents and payment status.',freq:'Monthly',perm:'reports.generate'}
];
let auditEvents=[
 ['28 Jun 2026 17:11','Tariro Moyo','PAYROLL_RELEASE_BLOCKED','PAY-2026-06-M','Release prevented: 3 critical controls remain open','Critical'],
 ['28 Jun 2026 16:58','Rudo Sibanda','REPORT_GENERATED','PAYE-2026-06','Generated PAYE return pack version 3','Information'],
 ['28 Jun 2026 16:42','Tariro Moyo','DOCUMENT_APPROVED','DOC-001','Approved June payroll control pack version 7','Approval'],
 ['28 Jun 2026 15:33','Chipo Ndlovu','BANK_CHANGE_VERIFIED','EMP-0007','Independent verification evidence attached','Sensitive'],
 ['28 Jun 2026 14:09','System','PAYROLL_CALCULATED','PAY-2026-06-M','Calculation completed using ruleset ZW-2026.06','System'],
 ['28 Jun 2026 13:44','Rudo Sibanda','INPUT_COMMITTED','INP-2026-06-04','1,247 valid input rows committed; 37 isolated','Change'],
 ['28 Jun 2026 11:17','Tariro Moyo','ROLE_ASSIGNED','USR-0042','Payroll Processor role assigned until 31 Jul 2026','Access'],
 ['27 Jun 2026 18:22','System','RULESET_PUBLISHED','ZW-2026.06','Approved statutory rules published for June','System']
];
let userAccess=[
 {name:'Tariro Moyo',initials:'TM',role:'Payroll Manager',scope:'All entities / all branches',mfa:'Enforced',last:'28 Jun 17:11',status:'Active'},
 {name:'Rudo Sibanda',initials:'RS',role:'Payroll Processor',scope:'Arcus Holdings / Harare',mfa:'Enforced',last:'28 Jun 16:58',status:'Active'},
 {name:'Chipo Ndlovu',initials:'CN',role:'HR Manager',scope:'All entities / HR records',mfa:'Enforced',last:'28 Jun 15:33',status:'Active'},
 {name:'Tawanda Chirenje',initials:'TC',role:'Approver / CFO',scope:'All entities / approval only',mfa:'Enforced',last:'28 Jun 12:06',status:'Active'},
 {name:'Precious Ncube',initials:'PN',role:'Internal Auditor',scope:'Read only / all periods',mfa:'Enforced',last:'27 Jun 09:17',status:'Active'},
 {name:'Kudzai Maseko',initials:'KM',role:'Payroll Processor',scope:'Contract staff / Bulawayo',mfa:'Pending',last:'22 Jun 11:30',status:'Review'}
];

function can(permission){const live=__pr6Can(permission);if(live!==null)return live;return (roles[state.role]||[]).includes(permission)}
function permittedPage(id){if(id==='mypay')return true;if(!__pr6IsLive())return false;return Boolean(pagePermission[id]&&can(pagePermission[id]))}
function money(v,c='USD'){return c==='ZiG'?`ZiG ${Number(v).toLocaleString('en-US',{maximumFractionDigits:0})}`:`USD ${Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function badge(text){const t=String(text).toLowerCase();let cls=t.includes('critical')||t.includes('blocked')||t.includes('overdue')||t.includes('rejected')?'red':t.includes('warning')||t.includes('review')||t.includes('pending')||t.includes('investig')||t.includes('expir')||t.includes('high')?'amber':t.includes('draft')||t.includes('calculated')||t.includes('medium')?'violet':t.includes('ready')||t.includes('approved')||t.includes('released')||t.includes('active')||t.includes('published')||t.includes('compliant')||t.includes('file')?'blue':'slate';return `<span class="status ${cls}">${text}</span>`}
function button(label,action,cls='',ico=''){return `<button class="btn ${cls}" data-action="${action}">${ico?icon(ico):''}${label}</button>`}
function pageHead(eye,title,desc,actions=''){return `<div class="page-head"><div><div class="eyebrow">${eye}</div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div>`}
function kpi(label,value,sub,ico='report',tone='',delta=''){return `<div class="kpi"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon ${tone}">${icon(ico)}</span></div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}${delta?` <span class="delta ${tone==='amber'?'warn':tone==='red'?'bad':''}">${delta}</span>`:''}</div></div>`}
function card(title,sub,body,head=''){const myPayPanel=state.page==='mypay'&&['Recent payslips','Earnings and deductions','Bank and tax details','Leave balance','Employment record','Training and certificates'].includes(title);return `<section class="card${myPayPanel?' pr6-mypay-card':''}"${myPayPanel?` data-mypay-panel-card="${__pr6Esc(title)}" tabindex="0" role="button" aria-label="Open ${__pr6Esc(title)} details"`:''}><div class="card-head"><div><h3>${title}</h3><p>${sub}</p></div>${head}</div>${body}</section>`}
function tableCard(title,sub,headers,rows,head=''){return card(title,sub,`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`,head)}
function progressRow(label,value,detail,tone=''){return `<div class="progress-row"><div class="progress-label"><strong>${label}</strong><span class="muted">${detail}</span></div><div class="progress ${tone}"><span style="width:${Math.max(0,Math.min(100,value))}%"></span></div></div>`}
function closeButton(target='drawer'){return `<button class="icon-btn" data-action="close-${target}">${icon('x')}</button>`}
function logEvent(action,ref,detail,severity='Information'){auditEvents.unshift([new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),state.role==='Employee'?'Rudo Sibanda':'Tariro Moyo',action,ref,detail,severity])}
function toast(title,message,type=''){const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<strong>${title}</strong><span>${message}</span>`;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),4200)}
function deny(permission){toast('Action restricted',`The ${state.role} role does not have permission: ${permission}.`,'warn')}
function initials(name){return name.split(' ').map(x=>x[0]).slice(0,2).join('')}
function maskSalary(e){return can('salary.view')?`${money(e.base)}${e.zig?` + ${money(e.zig,'ZiG')}`:''}`:'USD ****** / ZiG ******'}
function renderNav(){
  const items=navGroups.flatMap(([,groupItems])=>groupItems).filter(([id])=>permittedPage(id));
  $('#nav').innerHTML=items.map(([id,label,ico,count])=>`<button class="nav-item ${state.page===id?'active':''}" data-page="${id}" title="${label}"><span class="nav-icon">${icon(ico)}</span><span class="nav-label">${label}</span>${(()=>{const c=__pr6IsLive()?__pr6NavCount(id):null;return c?`<span class="nav-count">${c}</span>`:''})()}</button>`).join('');
}
function lineChart(){const vals=[188,194,201,199,214,228,225,238,246,252,257,265],zig=[5.1,5.3,5.5,5.6,6.1,6.3,6.4,6.7,6.8,7.0,7.2,7.46],months=['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];const W=760,H=220,p=38;const x=i=>p+i*(W-2*p)/(vals.length-1), y=v=>H-p-(v-175)/(275-175)*(H-2*p);const path=vals.map((v,i)=>(i?'L':'M')+x(i)+' '+y(v)).join(' ');return `<div class="chart-shell"><svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="payArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1768ff" stop-opacity=".25"/><stop offset="1" stop-color="#1768ff" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3,4].map(i=>`<line class="chart-grid" x1="${p}" x2="${W-p}" y1="${p+i*(H-2*p)/4}" y2="${p+i*(H-2*p)/4}"/>`).join('')}<path d="${path} L${x(vals.length-1)} ${H-p} L${p} ${H-p} Z" fill="url(#payArea)"/><path class="chart-line" d="${path}"/>${vals.map((v,i)=>`<circle class="chart-point" cx="${x(i)}" cy="${y(v)}" r="4"><title>${months[i]}: USD ${v},000 gross payroll; ZiG ${zig[i]}m</title></circle>`).join('')}${months.map((m,i)=>`<text class="chart-label" x="${x(i)}" y="${H-12}" text-anchor="middle">${m}</text>`).join('')}<text class="chart-title" x="14" y="16">USD gross payroll (thousands)</text></svg></div><div class="legend"><span><i style="background:var(--blue)"></i>USD gross payroll</span><span><i style="background:var(--violet)"></i>ZiG component shown in tooltip</span></div>`}
function barChart(){const data=[['Finance',54],['Operations',92],['Commercial',41],['Technology',37],['People',26],['Procurement',14]];const W=650,H=230,p=42,bw=58,g=35,max=100;return `<div class="chart-shell"><svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1768ff"/><stop offset="1" stop-color="#62a0ff"/></linearGradient></defs>${[0,25,50,75,100].map(v=>`<line class="chart-grid" x1="${p}" x2="${W-15}" y1="${H-p-v/max*(H-2*p)}" y2="${H-p-v/max*(H-2*p)}"/><text class="chart-label" x="${p-8}" y="${H-p-v/max*(H-2*p)+3}" text-anchor="end">${v}</text>`).join('')}${data.map((d,i)=>{const x=p+20+i*(bw+g),h=d[1]/max*(H-2*p);return `<rect class="bar" x="${x}" y="${H-p-h}" width="${bw}" height="${h}"><title>${d[0]}: ${d[1]} employees</title></rect><text class="chart-label" x="${x+bw/2}" y="${H-18}" text-anchor="middle">${d[0].slice(0,7)}</text>`}).join('')}<text class="chart-title" x="14" y="16">Employees by department</text></svg></div>`}
function workflow(stage=4){const steps=[['1','Period','Configured'],['2','Inputs','Committed'],['3','Calculate','Complete'],['4','Review','In progress'],['5','Release','Pending'],['6','Close','Pending']];return `<div class="workflow">${steps.map((x,i)=>`<div class="wf-step ${i<stage-1?'done':i===stage-1?'active':''}"><div class="wf-dot">${i<stage-1?'&#10003;':x[0]}</div><strong>${x[1]}</strong><span>${x[2]}</span></div>`).join('')}</div>`}
function overviewPage(){
 const recent=payrollRuns.slice(0,4).map(r=>`<tr data-run="${r.id}"><td><span class="link">${r.id}</span></td><td><strong>${r.group}</strong><div class="tiny muted">${r.period}</div></td><td>${r.employees}</td><td class="money">${money(r.grossUSD)}</td><td>${badge(r.status)}</td><td>${r.owner}</td></tr>`);
 return `<div class="page">${pageHead('Payroll operating system','Payroll Operations Command Centre','Monitor readiness, dual-currency payroll, exceptions, deadlines, statutory obligations and recent runs from one governed control centre.',button('Open June payroll','runs','soft','eye')+button('Continue payroll run','continue-run','primary','arrow'))}
 ${workflow((()=>{const o=__pr6OverviewStats();return o?o.runStage:4})())}
 <div class="grid kpis">${(()=>{const o=__pr6OverviewStats();if(!o)return `${kpi('Employees','128','4 not fully payroll-ready','users','', '+2 this month')}${kpi('Gross payroll',money(264720),'June 2026 USD component','wallet','cyan','+3.3%')}${kpi('Gross payroll',money(7459664,'ZiG'),'June 2026 local component','wallet','violet','+4.6%')}${kpi('Deductions',money(77444),'PAYE, NSSA, benefits and loans','calculator','', '+2.1%')}${kpi('Net pay',money(187276),'Before bank release controls','bank','cyan')}${kpi('Readiness score','72 / 100','3 critical controls block release','shield','amber','Review')}`;return kpi('Employees',o.employees,o.employeesSub,'users','','')+kpi('Gross payroll',money(o.grossUSD),o.periodLabel+' USD component','wallet','cyan',o.variance)+kpi('Gross payroll',money(o.grossZiG,'ZiG'),o.periodLabel+' local component','wallet','violet','')+kpi('Deductions',money(o.deductions),'PAYE, NSSA, AIDS levy and SDL','calculator','','')+kpi('Net pay',money(o.netUSD),'Before bank release controls','bank','cyan')+kpi('Readiness score',o.readiness+' / 100',o.readinessSub,'shield',o.readinessTone,o.criticalOpen?'Review':'')})()}</div>
 <div class="grid two" style="margin-bottom:14px">
  ${card('Payroll movement trend','Gross payroll for the last 12 months',`<div class="card-body">${lineChart()}</div>`,`<button class="btn small" data-action="drill-payroll">Drill down ${icon('arrow')}</button>`)}
  ${card('Payroll readiness','Calculated from records, inputs, exceptions and approvals',`<div class="card-body"><div style="display:grid;grid-template-columns:145px 1fr;gap:17px;align-items:center"><div class="donut"><div class="donut-center"><strong>${(()=>{const o=__pr6OverviewStats();return o?o.readiness:72})()}</strong><span>of 100</span></div></div><div>${(()=>{const o=__pr6OverviewStats();return o?progressRow('Employee data',o.employeeDataPct,o.employeeDataPct+'% complete'):progressRow('Employee data',96,'96% complete')})()}${(()=>{const c=__pr6RunCoverage();return c?progressRow('Employees paid',c.pct,c.paid+' of '+c.total+' on the roster','cyan'):progressRow('Payroll inputs',97,'1,247 of 1,284 valid','cyan')})()}${(()=>{const o=__pr6OverviewStats();return o?progressRow('Critical exceptions',o.exceptionsPct,o.criticalOpen+' unresolved','red'):progressRow('Critical exceptions',63,'3 unresolved','red')})()}${(()=>{const o=__pr6OverviewStats();return o?progressRow('Payroll run progress',Math.round((o.runStage/6)*100),'Stage '+o.runStage+' of 6','amber'):progressRow('Maker-checker review',78,'4 of 6 controls','amber')})()}</div></div><div class="callout amber" style="margin-top:13px"><span class="kpi-icon amber">${icon('alert')}</span><div><strong>Release controls are not yet satisfied</strong><p>Resolve three critical exceptions and complete the independent bank-account-change review.</p></div></div></div>`)}
 </div>
 <div class="grid two">
  <div class="stack">
   ${tableCard('Recent payroll runs','Controlled payroll history across pay groups',['Run','Pay group','Employees','Gross USD','Status','Owner'],recent,`<button class="btn small" data-page="runs">View all</button>`)}
   ${card('Payroll cost by department','Employee population and payroll concentration',`<div class="card-body">${barChart()}</div>`)}
  </div>
  <div class="stack">
   ${card('Unresolved exceptions','Highest priority payroll blockers',`<div class="card-body list">${exceptions.slice(0,4).map(e=>`<div class="list-row" data-exception="${e.id}"><div class="list-icon ${e.severity==='Critical'?'red':'amber'}">${icon('alert')}</div><div class="list-main"><strong>${e.type}</strong><span>${e.employee} - ${e.age} open</span></div><div class="list-end">${badge(e.severity)}<span>${e.amount}</span></div></div>`).join('')}<button class="btn soft" style="margin-top:12px" data-page="exceptions">View all exceptions</button></div>`)}
   ${card('Upcoming statutory deadlines','Zimbabwe filing and payment calendar',`<div class="card-body list">${[['PAYE return and payment',10],['NSSA P4 schedule',10],['AIDS levy payment',10],['NEC contribution file',15]].map((x,i)=>{const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());let due=new Date(today.getFullYear(),today.getMonth(),x[1]);if(due<today){due=new Date(today.getFullYear(),today.getMonth()+1,x[1]);}const dueLabel=due.getDate()+' '+months[due.getMonth()]+' '+due.getFullYear();const days=Math.ceil((due-now)/86400000);const overdue=days<0;const label=Math.abs(days)+' day'+(Math.abs(days)===1?'':'s');return `<div class="list-row" data-page="reports"><div class="list-icon ${overdue?'amber':(i<3?'amber':'violet')}">${icon('calendar')}</div><div class="list-main"><strong>${x[0]}</strong><span>${dueLabel}</span></div><div class="list-end"><strong>${label}</strong><span>${overdue?'overdue':'remaining'}</span></div></div>`;}).join('')}</div>`)}
   ${card('Activity timeline','Sensitive and approval events',`<div class="card-body timeline">${auditEvents.slice(0,4).map((a,i)=>`<div class="timeline-item ${i===0?'bad':i===3?'warn':''}"><div><strong>${a[2].replaceAll('_',' ')}</strong><p>${a[4]}</p></div><time>${a[0].split(' ').slice(0,2).join(' ')}</time></div>`).join('')}</div>`)}
  </div>
 </div></div>`;
}
function employeeDirectorySkeleton(){
 const skeletonLine=(width='100%')=>`<div class="skeleton" style="width:${width}"></div>`;
 const tableRows=Array.from({length:7},()=>`<tr aria-hidden="true"><td>${skeletonLine('18px')}</td><td><div class="access-user"><div class="skeleton" style="width:34px;height:34px;border-radius:10px"></div><div style="display:grid;gap:7px;width:180px">${skeletonLine('72%')}${skeletonLine('48%')}</div></div></td><td><div style="display:grid;gap:7px;width:130px">${skeletonLine('80%')}${skeletonLine('45%')}</div></td><td>${skeletonLine('76px')}</td><td>${skeletonLine('110px')}</td><td>${skeletonLine('90px')}</td><td>${skeletonLine('64px')}</td><td>${skeletonLine('54px')}</td></tr>`).join('');
 return `<div class="page">${pageHead('People administration','Employee Directory and Payroll Readiness','Search and govern employment, compensation, bank, statutory, document and payroll-readiness records.',button('Start onboarding','go-onboarding','primary','userplus'))}
 <div class="grid kpis">${[['Total employees','users'],['Payroll ready','check'],['Under review','alert'],['Blocked','lock']].map(([label,ico])=>`<section class="kpi"><div class="kpi-top"><span>${label}</span><span class="kpi-icon">${icon(ico)}</span></div><div class="skeleton" style="height:25px;width:62px;margin-top:12px"></div><div class="skeleton" style="height:9px;width:130px;margin-top:9px"></div></section>`).join('')}</div>
 <section class="card"><div class="filters"><div class="skeleton" style="height:37px;width:230px"></div><div class="skeleton" style="height:37px;width:138px"></div><div class="skeleton" style="height:37px;width:138px"></div><div class="spacer"></div><div class="skeleton" style="height:12px;width:160px"></div></div><div class="table-wrap"><table><thead><tr><th></th><th>Employee</th><th>Organisation</th><th>Contract</th><th>Compensation</th><th>Readiness</th><th>Status</th><th></th></tr></thead><tbody>${tableRows}</tbody></table></div></section>
 </div>`;
}
function employeeExportButtons(){return `<div class="employee-export-group" role="group" aria-label="Export employee register"><button class="btn small employee-export-icon" type="button" data-action="export-employees-pdf" title="Export as PDF" aria-label="Export employee register as PDF">${icon('file')}</button><button class="btn small employee-export-icon" type="button" data-action="export-employees-excel" title="Export as Excel" aria-label="Export employee register as Excel">${icon('report')}</button><button class="btn small employee-export-icon" type="button" data-action="export-employees-csv" title="Export as CSV" aria-label="Export employee register as CSV">${icon('download')}</button></div>`}
function employeesPage(){
 if(!__pr6IsLive()) return employeeDirectorySkeleton();
 if(__pr6Live.loadError) return `<div class="page">${pageHead('People administration','Employee Directory and Payroll Readiness','Search and govern employment, compensation, bank, statutory, document and payroll-readiness records.',button('Try again','retry-payroll-load','primary','refresh'))}<section class="card"><div class="card-body"><strong>Employee records could not be loaded</strong><p class="muted">${__pr6Esc(__pr6Live.loadError)}</p></div></section></div>`;
 const filtered=employees.filter(e=>(!state.employeeSearch||[e.name,e.id,e.department,e.branch,e.title].join(' ').toLowerCase().includes(state.employeeSearch.toLowerCase()))&&(state.employeeDepartment==='All departments'||e.department===state.employeeDepartment)&&(state.employeeReadiness==='All readiness states'||e.status===state.employeeReadiness));
 const rows=filtered.map(e=>`<tr data-employee="${e.id}"><td><input class="checkbox" type="checkbox"></td><td><div class="access-user"><div class="mini-avatar">${e.initials}</div><div><strong class="link">${e.name}</strong><div class="tiny muted">${e.id} - ${e.title}</div></div></div></td><td>${e.department}<div class="tiny muted">${e.branch}</div></td><td>${e.type}</td><td class="money">${maskSalary(e)}</td><td><div style="display:flex;align-items:center;gap:8px"><div class="progress" style="width:66px"><span style="width:${e.readiness}%"></span></div><strong>${e.readiness}%</strong></div></td><td>${badge(e.status)}</td><td><button class="btn small" data-employee="${e.id}">${icon('eye')}Open</button></td></tr>`);
 const stats=__pr6EmployeeStats();
 return `<div class="page">${pageHead('People administration','Employee Directory and Payroll Readiness','Search and govern employment, compensation, bank, statutory, document, leave, training and payroll-readiness records.',employeeExportButtons()+button('Start onboarding','go-onboarding','primary','userplus'))}
 <div class="grid kpis">${kpi('Total employees',String(stats.total),stats.active+' active, '+stats.onNotice+' on notice','users')}${kpi('Payroll ready',String(stats.ready),stats.readyPct+'% of active population','check','cyan')}${kpi('Under review',String(stats.review),'Data or approval issue','alert','amber')}${kpi('Blocked',String(stats.blocked),'Cannot enter final payroll','lock','red')}</div>
 <section class="card"><div class="filters"><input id="employeeSearch" value="${__pr6Esc(state.employeeSearch)}" placeholder="Search name, employee ID, department or branch"><select id="employeeDepartmentFilter"><option value="All departments" ${state.employeeDepartment==='All departments'?'selected':''}>All departments</option>${__pr6DepartmentOptions()}</select><select id="employeeReadinessFilter"><option value="All readiness states" ${state.employeeReadiness==='All readiness states'?'selected':''}>All readiness states</option>${['Ready','Review','Blocked','Suspended','Terminated'].map(x=>`<option value="${x}" ${state.employeeReadiness===x?'selected':''}>${x}</option>`).join('')}</select><div class="spacer"></div><span class="tiny muted">Showing ${filtered.length} of ${employees.length} employees</span></div><div class="table-wrap"><table><thead><tr><th></th><th>Employee</th><th>Organisation</th><th>Contract</th><th>Compensation</th><th>Readiness</th><th>Status</th><th></th></tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="8" class="tiny muted">No employee records match these filters.</td></tr>`}</tbody></table></div></section>
 </div>`;
}
function exportEmployeeRegister(kind){
 if(!__pr6IsLive()||!Array.isArray(employees)){toast('Employee data is still loading','Try the export again after the directory has loaded.','warn');return;}
 const filtered=employees.filter(e=>!state.employeeSearch||[e.name,e.id,e.department,e.branch,e.title].join(' ').toLowerCase().includes(state.employeeSearch.toLowerCase()));
 const rows=filtered.map(e=>[e.id,e.name,e.department,e.branch,e.type,maskSalary(e),`${e.readiness}%`,e.status]);
 const exporter=window.__PAYROLL_V6_EXPORT_EMPLOYEES__;
 if(typeof exporter!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return;}
 exporter(kind,rows);
}
function onboardingExportButtonsV4(){return `<div class="export-icon-group" aria-label="Export onboarding register"><button class="icon-btn" title="Export PDF" aria-label="Export PDF" data-action="export-onboarding-pdf">${icon('file')}</button><button class="icon-btn" title="Export Excel" aria-label="Export Excel" data-action="export-onboarding-excel">${icon('report')}</button><button class="icon-btn" title="Export CSV" aria-label="Export CSV" data-action="export-onboarding-csv">${icon('download')}</button></div>`}
function exportOnboardingV4(kind){const data=__pr6Onboarding();if(!data){toast('Onboarding data is still loading','Try the export again when the register has loaded.','warn');return;}const rows=data.candidates.map(c=>[c.name||'',c.email||'',c.position||'',c.department||'',c.startDate?String(c.startDate).slice(0,10):'',c.status||'']);const fn=window.__PAYROLL_V6_EXPORT_ONBOARDING__;if(typeof fn!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return;}fn(kind,{title:'Employee Onboarding Register',subtitle:'Live onboarding cases exported from Payroll.',columns:['Candidate','Work email','Position','Department','Start date','Stage'],rows,filename:'payroll-onboarding-register',landscape:true,note:'Confidential employee information. Database identifiers are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'});}
function onboardingPage(){
 const __ob=__pr6Onboarding();
 if(!__pr6IsLive())return `<div class="page">${pageHead('Governed employment setup','Employee Onboarding','Loading onboarding records…',button('Import employees','import-employees','', 'upload')+button('Start onboarding','new-employee','primary','plus'))}<div class="panel-band"><div class="eyebrow" style="color:#7eb6ff">CONTROLLED ONBOARDING</div><div class="skeleton" style="height:26px;width:58%;margin:8px 0 12px"></div><div class="skeleton" style="height:15px;width:78%"></div><div class="band-stats">${Array.from({length:4},()=>'<div class="band-stat"><div class="skeleton" style="width:55%"></div><div class="skeleton" style="height:20px;width:24%;margin-top:10px"></div></div>').join('')}</div></div><section class="card"><div class="card-head"><div><h3>Onboarding cases</h3><p>Fetching live cases</p></div></div><div class="card-body">${Array.from({length:5},()=>'<div class="skeleton" style="height:35px;margin:8px 0"></div>').join('')}</div></section></div>`;
 const candidates=__ob?.candidates||[];
 const pageSize=10,total=candidates.length,pageCount=Math.max(1,Math.ceil(total/pageSize));
 state.onboardingPage=Math.min(Math.max(1,Number(state.onboardingPage)||1),pageCount);
 const start=(state.onboardingPage-1)*pageSize,visible=candidates.slice(start,start+pageSize);
 const statusLabels={INVITED:'Invitation pending',DOCUMENTS:'Documents',CONTRACT:'Contract review',PAYROLL_SETUP:'Payroll setup',COMPLETE:'Complete',WITHDRAWN:'Withdrawn'};
 const rows=visible.length?visible.map(c=>`<tr><td><div class="access-user"><div class="mini-avatar">${__pr6Esc((c.name||'?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase())}</div><strong>${__pr6Esc(c.name||'Unnamed candidate')}</strong></div></td><td>${__pr6Esc(c.email||'—')}</td><td>${__pr6Esc(c.position||'—')}</td><td>${__pr6Esc(c.department||'—')}</td><td>${c.startDate?__pr6Esc(String(c.startDate).slice(0,10)):'—'}</td><td>${badge(statusLabels[c.status]||c.status||'Invited')}</td><td><button class="btn small" data-action="open-onboarding-candidate" data-candidate-id="${__pr6Esc(c.id)}">${icon('eye')}${c.status==='COMPLETE'?'View':'Continue'}</button></td></tr>`):[`<tr><td colspan="7" class="tiny muted">${__ob?'No onboarding candidates yet. Select Start onboarding to create a case.':'Onboarding is not available to your role.'}</td></tr>`];
 const stepFor=status=>({INVITED:1,DOCUMENTS:2,CONTRACT:3,PAYROLL_SETUP:4,COMPLETE:6,WITHDRAWN:1}[status]||1);
 const current=visible.find(c=>!['COMPLETE','WITHDRAWN'].includes(c.status))||candidates.find(c=>!['COMPLETE','WITHDRAWN'].includes(c.status));
 const pageCountLabel=total?`Showing ${start+1}–${Math.min(start+pageSize,total)} of ${total} cases`:'No cases';
 const pagination=`<div class="table-pagination"><span>${pageCountLabel}</span><div><button class="btn small" data-onboarding-page="${Math.max(1,state.onboardingPage-1)}" ${state.onboardingPage<=1?'disabled':''}>Previous</button><span>Page ${state.onboardingPage} of ${pageCount}</span><button class="btn small" data-onboarding-page="${Math.min(pageCount,state.onboardingPage+1)}" ${state.onboardingPage>=pageCount?'disabled':''}>Next</button></div></div>`;
 return `<div class="page">${pageHead('Governed employment setup','Employee Onboarding','Create employee records, manage each onboarding step and send first-sign-in credentials securely.',button('Import employees','import-employees','', 'upload')+button('Start onboarding','new-employee','primary','plus')+onboardingExportButtonsV4())}
 <div class="panel-band"><div class="eyebrow" style="color:#7eb6ff">CONTROLLED ONBOARDING</div><h2>One employment record. One auditable source of truth.</h2><p>Save a draft, complete identity and employment details, then provision the employee account. New employees receive a one-time password and must change it on first sign-in.</p><div class="band-stats">${(()=>{const stat=(l,v)=>`<div class="band-stat"><span>${l}</span><strong>${v}</strong></div>`;if(!__ob)return stat('Open onboarding cases','—')+stat('Completed','—')+stat('Awaiting documents','—')+stat('Total candidates','—');return stat('Open onboarding cases',__ob.inProgress)+stat('Completed',__ob.complete)+stat('Awaiting documents',__ob.byStatus.DOCUMENTS||0)+stat('Total candidates',__ob.total)})()}</div></div>
 ${card('Onboarding workflow','Progress reflects the current live case status',`<div class="card-body">${workflow(current?stepFor(current.status):1)}${current?`<div class="tiny muted" style="margin-top:8px">Current case: ${__pr6Esc(current.name)} · ${statusLabels[current.status]||current.status}</div>`:'<div class="tiny muted" style="margin-top:8px">Start or import a case to begin the onboarding workflow.</div>'}</div>`)}<div style="height:14px"></div>
 ${tableCard('Onboarding cases','Candidate details and next required step',['Candidate','Email','Position','Department','Start date','Stage','Next step'],rows,`<span class="tiny muted">${pageCountLabel}</span>`)}${pagination}
 </div>`;
}
function runsPage(){
 const rows=payrollRuns.map(r=>`<tr data-run="${r.id}"><td><span class="link">${r.id}</span></td><td><strong>${r.group}</strong><div class="tiny muted">${r.period}</div></td><td>${r.employees}</td><td>${r.currency}</td><td class="money">${money(r.grossUSD)}${r.grossZiG?`<div class="tiny muted">${money(r.grossZiG,'ZiG')}</div>`:''}</td><td>${r.variance==null?'—':(r.variance>0?'+':'')+r.variance+'%'}</td><td>${badge(r.status)}</td><td>${r.owner}</td><td><button class="btn small" data-run="${r.id}">${icon('eye')}Open</button></td></tr>`);
 return `<div class="page">${pageHead('Payroll execution','Payroll Runs','Configure, calculate, validate, approve, release and close every pay group while retaining calculation lineage and immutable approval evidence.',button('Compare periods','compare-runs','', 'refresh')+button('Create payroll run','new-run','primary','plus'))}
 <div class="grid kpis">${(()=>{const r=__pr6RunStats();if(!r)return `${kpi('Open payroll runs','2','June 2026 processing','calculator')}${kpi('Employees in scope','140','Monthly and executive groups','users','cyan')}`;return kpi('Open payroll runs',String(r.openRuns),r.openSub,'calculator')+kpi('Employees in scope',String(r.inScope),'On the latest run','users','cyan')+kpi('Current gross',money(r.gross),r.grossSub,'wallet','violet')+kpi('Open exceptions',String(r.exceptions),r.exceptionSub,'alert','red')+kpi('Runs on record',String(r.totalRuns),'All payroll periods','audit')+kpi('Last release',r.lastRelease,'Most recent completed run','bank','cyan')})()}</div>
 ${tableCard('Payroll run register','Current and historical payroll processing records',['Run ID','Pay group','Employees','Currency','Gross payroll','Variance','Status','Owner',''],rows,`<div class="segmented"><button class="active">All runs</button><button>Open</button><button>Released</button></div>`)}
 </div>`;
}
function inputsPage(){
 const __ib=__pr6Inputs();const rows=__ib?(__ib.latest&&__ib.latest.errorRows>0?[`<tr><td colspan="6" class="tiny muted">Open the batch to see its ${__ib.errorRows} isolated row(s).</td></tr>`]:[`<tr><td colspan="6" class="tiny muted">${__ib.batches.length?'No rows are isolated. All uploaded rows passed validation.':'No input batches have been uploaded.'}</td></tr>`]):[`<tr><td colspan="6" class="tiny muted">Payroll inputs are not visible to your role.</td></tr>`];
 return `<div class="page">${pageHead('Controlled data intake','Payroll Inputs Import and Validation','Map, validate and safely commit bulk payroll inputs while isolating errors, warnings, duplicates and outliers before calculation.',button('Download template','download-input-template','', 'download')+button('Upload input file','upload-inputs','primary','upload'))}
 <div class="panel-band"><div class="eyebrow" style="color:#7eb6ff">${(()=>{const b=__pr6Inputs();return b?(b.latest?'INPUT BATCH '+b.latest.reference:'NO INPUT BATCH'):'INPUT BATCHES UNAVAILABLE'})()}</div><h2>${(()=>{const b=__pr6Inputs();if(!b)return 'Payroll inputs are not visible to your role.';if(!b.latest)return 'No input batches have been uploaded.';return b.validRows+' valid row'+(b.validRows===1?'':'s')+' ready. '+b.errorRows+' row'+(b.errorRows===1?'':'s')+' isolated.'})()}</h2><p>The valid population can be committed without allowing invalid rows into calculation. Every correction preserves the original file, mapping and reviewer evidence.</p><div class="band-stats">${(()=>{const b=__pr6Inputs();const stat=(l,v)=>`<div class="band-stat"><span>${l}</span><strong>${v}</strong></div>`;if(!b)return stat('Rows uploaded','\u2014')+stat('Valid','\u2014')+stat('Resolved','\u2014')+stat('Errors','\u2014');const resolved=b.batches.reduce((n,x)=>n+(x.totalRows-x.validRows-x.errorRows),0);return stat('Rows uploaded',b.totalRows)+stat('Valid',b.validRows)+stat('Resolved',Math.max(0,resolved))+stat('Errors',b.errorRows)})()}</div></div>
 ${card('Import workflow','Upload, map, validate and commit',`<div class="card-body"><div class="stepper"><div class="step done"><b>1</b><span>Upload</span></div><div class="step done"><b>2</b><span>Map columns</span></div><div class="step active"><b>3</b><span>Validate</span></div><div class="step"><b>4</b><span>Commit</span></div></div>${(()=>{const b=__pr6Inputs();if(!b)return progressRow('Validation completion',0,'Payroll inputs are not visible to your role','cyan');if(!b.totalRows)return progressRow('Validation completion',0,'No rows have been uploaded','cyan');return progressRow('Validation completion',b.validPct===null?0:b.validPct,b.validRows+' of '+b.totalRows+' rows valid','cyan')})()}<div class="actions" style="margin-top:13px">${button('Export error file','export-errors','', 'download')}${button('Commit valid rows','commit-inputs','primary','check')}</div></div>`)}<div style="height:14px"></div>
 ${tableCard('Validation issues','Errors remain isolated from the calculation engine',['Source row','Employee','Field','Validation message','Severity',''],rows)}
 </div>`;
}
function exceptionExportButtonsV5(){return `<div class="export-icon-group payroll-exception-exports" role="group" aria-label="Export payroll exception register"><button class="icon-btn" type="button" title="Export PDF" aria-label="Export PDF" data-exception-export="pdf">${icon('file')}</button><button class="icon-btn" type="button" title="Export Excel" aria-label="Export Excel" data-exception-export="excel">${icon('report')}</button><button class="icon-btn" type="button" title="Export CSV" aria-label="Export CSV" data-exception-export="csv">${icon('download')}</button></div>`}
function exceptionViewModelV5(){
 const all=Array.isArray(__pr6Live.exceptions)?__pr6Live.exceptions:[],employees=Array.isArray(__pr6Live.employees)?__pr6Live.employees:[],stats=__pr6Live.exceptionStats||null;
 const q=String(state.exceptionSearch||'').trim().toLowerCase();
 const filtered=all.filter(e=>{const employee=employees.find(x=>x.id===e.employeeId||x.recordId===e.recordId);const haystack=[e.id,e.employee,e.employeeId,e.type,e.source,e.detail,employee?.department].join(' ').toLowerCase();return (!q||haystack.includes(q))&&(state.exceptionSeverity==='All severities'||e.severity===state.exceptionSeverity)&&(state.exceptionSource==='All sources'||e.source===state.exceptionSource)});
 const pageSize=Math.max(1,Number(state.exceptionPageSize)||10),pages=Math.max(1,Math.ceil(filtered.length/pageSize));state.exceptionPage=Math.min(Math.max(1,Number(state.exceptionPage)||1),pages);
 const visible=filtered.slice((state.exceptionPage-1)*pageSize,state.exceptionPage*pageSize),flagged=new Set(all.map(e=>e.recordId||e.employeeId).filter(Boolean));
 return {all,employees,employeesChecked:stats?.employeesChecked??(employees.length||null),clear:stats?.employeesWithoutFindings??null,canOpenEmployee:can('employee.view')||can('employee.edit'),filtered,visible,pages,pageSize,first:filtered.length?(state.exceptionPage-1)*pageSize+1:0,last:Math.min(state.exceptionPage*pageSize,filtered.length),critical:all.filter(e=>e.severity==='Critical').length,high:all.filter(e=>e.severity==='High').length,sources:[...new Set(all.map(e=>e.source).filter(Boolean))].sort()};
}
function exceptionsPage(){
 if(!__pr6Live.ready)return `<div class="page">${pageHead('Validation and investigation','Payroll Exception Resolution Workbench','Loading current employee records and payroll validation findings…',exceptionExportButtonsV5())}<div class="grid three">${Array.from({length:3},()=>'<div class="kpi"><span class="skeleton-block" style="height:18px;width:45%"></span><span class="skeleton-block" style="height:32px;width:30%;margin-top:16px"></span></div>').join('')}</div>${card('Exception register','Loading findings derived from live employee records',`<div class="table-wrap"><table><tbody>${Array.from({length:7},()=>'<tr class="skeleton-row"><td colspan="7"><span></span></td></tr>').join('')}</tbody></table></div>`)}</div>`;
 if(!can('exceptions.view')&&!can('exceptions.resolve'))return `<div class="page">${pageHead('Validation and investigation','Payroll Exception Resolution Workbench','You do not have permission to view current payroll validation findings.',exceptionExportButtonsV5())}<div class="callout amber"><strong>Exception register access required</strong><p>Ask an administrator for Payroll Exception View or Manage access.</p></div></div>`;
 if(!can('employee.view'))return `<div class="page">${pageHead('Validation and investigation','Payroll Exception Resolution Workbench','This register is derived from employee source records, which are not available to this role.',exceptionExportButtonsV5())}<div class="callout amber"><strong>Employee source access required</strong><p>Ask an administrator for Payroll Employee View access to inspect findings. No employee records are loaded for this role.</p></div></div>`;
 if((__pr6Live.errors||[]).some(e=>e?.source==='employees'))return `<div class="page">${pageHead('Validation and investigation','Payroll Exception Resolution Workbench','The employee source records required for this validation could not be loaded.',exceptionExportButtonsV5())}<div class="callout red"><strong>Current findings are unavailable</strong><p>${__pr6Esc((__pr6Live.errors||[]).find(e=>e?.source==='employees')?.message||'The Payroll API did not return employee records.')}</p><button type="button" class="btn small" data-action="retry-payroll-load">Try again</button></div></div>`;
 const m=exceptionViewModelV5(),severityOptions=['All severities','Critical','High','Medium','Low'].map(x=>`<option value="${x}" ${state.exceptionSeverity===x?'selected':''}>${x}</option>`).join(''),sourceOptions=['All sources',...m.sources].map(x=>`<option value="${__pr6Esc(x)}" ${state.exceptionSource===x?'selected':''}>${__pr6Esc(x)}</option>`).join('');
 const rows=m.visible.map(e=>{const value=e.type==='Missing tax number'?'Taxpayer reference: missing':e.type==='Missing national ID'?'National ID: missing':e.type==='Missing bank details'?'Bank account details: incomplete':e.type==='No basic salary'?'Basic salary: not recorded':e.type==='Suspended employee'?'Employee status: suspended':'Current employee data requires review';return `<tr data-exception="${__pr6Esc(e.id)}" tabindex="0" role="button"><td><span class="link">${__pr6Esc(e.id)}</span></td><td><strong>${__pr6Esc(e.employee||'Employee')}</strong><div class="tiny muted">${__pr6Esc(e.employeeId||'Employee number unavailable')}</div></td><td>${__pr6Esc(e.type)}</td><td>${badge(e.severity)}</td><td>${__pr6Esc(e.source)}</td><td>${__pr6Esc(value)}</td><td>${badge('Current finding')}</td></tr>`});
 const pageLabel=`${m.first}–${m.last} of ${m.filtered.length} findings`,pagination=`<div class="table-pagination"><label>Rows <select id="exceptionPageSize"><option value="10" ${m.pageSize===10?'selected':''}>10</option><option value="25" ${m.pageSize===25?'selected':''}>25</option><option value="50" ${m.pageSize===50?'selected':''}>50</option></select> per page</label><span>${pageLabel}</span><div><button type="button" class="btn small" data-exception-page="${Math.max(1,state.exceptionPage-1)}" ${state.exceptionPage<=1?'disabled':''}>Previous</button><span>Page ${state.exceptionPage} of ${m.pages}</span><button type="button" class="btn small" data-exception-page="${Math.min(m.pages,state.exceptionPage+1)}" ${state.exceptionPage>=m.pages?'disabled':''}>Next</button></div></div>`;
 const filters=`<div class="card-body"><div class="actions payroll-exception-filters"><input type="search" id="exceptionSearch" aria-label="Search exception register" placeholder="Search employee, finding or source" value="${__pr6Esc(state.exceptionSearch)}"><select id="exceptionSeverity" aria-label="Filter by severity">${severityOptions}</select><select id="exceptionSource" aria-label="Filter by source">${sourceOptions}</select><span class="tiny muted">${pageLabel}</span></div><p class="tiny muted" style="margin:10px 0 0">Live source: current employee records from the Payroll API. Findings are recalculated from statutory identifiers, bank details, salary and employee status. Assignment, case age, notes and resolution history are not stored by this API.</p></div>`;
 return `<div class="page">${pageHead('Validation and investigation','Payroll Exception Resolution Workbench','Review current payroll data-quality findings, inspect their source employee records and correct data through the employee workflow.',exceptionExportButtonsV5())}
 <div class="grid kpis">${kpi('Employee records checked',m.employeesChecked==null?'—':String(m.employeesChecked),'Current API roster','users')}${kpi('Records without findings',m.clear==null?'—':String(m.clear),'Derived from employee fields','check','cyan')}${kpi('Current findings',String(m.all.length),'Recalculated on data refresh','alert','amber')}${kpi('Critical blockers',String(m.critical),'Current release-blocking data gaps','lock','red')}${kpi('High priority',String(m.high),'Current employee data gaps','clock','amber')}${kpi('Validation sources',String(m.sources.length),'Current API finding categories','report','violet')}</div>
 ${card('Filters and source','Search the current API-derived findings',filters)}
 ${tableCard('Exception register','Select a finding to inspect the employee fields that triggered it',['Exception reference','Employee','Finding','Severity','Source','Current value','State'],rows.length?rows:[`<tr><td colspan="7" class="empty-state">${m.filtered.length?'No findings on this page.':'No current employee findings match these filters.'}</td></tr>`])}${pagination}
 </div>`;
}
function approvalsPage(){
 const current=(payrollRuns[0]||__pr6RunPlaceholder);
 return `<div class="page">${pageHead('Governed review','Maker-Checker Payroll Approval Review','Review period variances, sampled calculations, source evidence, unresolved exceptions and sensitive master-data changes before approval.',button('Download review pack','download-review-pack','', 'download')+button('Submit decision','approval-decision','primary','shield'))}
 <div class="panel-band"><div class="eyebrow" style="color:#7eb6ff">${current.id} - ${current.period}</div><h2>${(()=>{const c=__pr6ApprovalCompare();if(!c)return 'Approval review is 78% complete';if(!c.hasRun)return 'No payroll run to review';const st=String(c.current.rawStatus||'');return st==='PENDING_APPROVAL'?'Awaiting independent approval':st==='APPROVED'?'Approved, awaiting release':st==='COMPLETED'?'Released':'Draft payroll run'})()}</h2><p>The maker cannot approve their own payroll. Final approval requires an independent approver and completion of all release-blocking controls.</p><div class="band-stats"><div class="band-stat"><span>Prepared by</span><strong>${(()=>{const c=__pr6ApprovalCompare();return c?c.owner:'Rudo Sibanda'})()}</strong></div><div class="band-stat"><span>Gross payroll</span><strong>${money(current.grossUSD)}</strong></div><div class="band-stat"><span>Unresolved critical</span><strong>${(()=>{const c=__pr6ApprovalCompare();return c?c.criticalOpen:3})()}</strong></div></div></div>
 <div class="grid two">
  <div class="stack">
   ${card('Payroll summary - before vs current','Movement, variance and materiality review',`<div class="table-wrap"><table><thead><tr><th>Measure</th><th>${(()=>{const c=__pr6ApprovalCompare();return c?c.prevLabel:'May 2026'})()}</th><th>${(()=>{const c=__pr6ApprovalCompare();return c?c.curLabel:'June 2026'})()}</th><th>Variance</th><th>Review</th></tr></thead><tbody>${((__pr6ApprovalCompare()||{}).rows||[['Headcount','126','128','+2','Expected'],['Gross USD','USD 256,180.00','USD 264,720.00','+3.3%','Expected'],['Gross ZiG','ZiG 7,134,000','ZiG 7,459,664','+4.6%','Review'],['PAYE','USD 41,280.00','USD 42,967.00','+4.1%','Expected'],['Overtime','USD 8,420.00','USD 11,984.00','+42.3%','Investigate'],['Net pay','USD 181,200.00','USD 187,276.00','+3.4%','Expected']]).map(r=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${badge(r[4])}</td></tr>`).join('')}</tbody></table></div>`)}
   ${card('Sampled employee calculations','Risk-based recalculation and evidence',`<div class="table-wrap"><table><thead><tr><th>Employee</th><th>Sample reason</th><th>Gross</th><th>Net</th><th>Recalculation</th></tr></thead><tbody>${(()=>{const __pr6ApprovalSample=1;const runs=Array.isArray(__pr6Live.payrollRuns)?__pr6Live.payrollRuns:null;if(!runs)return `<tr><td colspan="5" class="tiny muted">Payroll runs are not visible to your role.</td></tr>`;return `<tr><td colspan="5" class="tiny muted">${runs.length?'Open a run to review its recalculated lines.':'No payroll runs are awaiting approval.'}</td></tr>`})()}</tbody></table></div>`)}
  </div>
  <div class="stack">
   ${card('Review checklist','All controls are independently attested',`<div class="card-body list">${[['Payroll population reconciled','Complete','blue'],['Employee master changes verified','Complete','blue'],['Earnings and allowances reviewed','Complete','blue'],['Deduction and loan controls','Complete','blue'],['Bank account changes independently verified','Pending','amber'],['Critical exceptions resolved','Blocked','red'],['Statutory ruleset approved','Complete','blue'],['GL mapping reconciled','Pending','amber']].map(x=>`<div class="list-row"><div class="list-icon ${x[2]}">${x[2]==='blue'?icon('check'):icon('alert')}</div><div class="list-main"><strong>${x[0]}</strong><span>Reviewer evidence retained</span></div>${badge(x[1])}</div>`).join('')}</div>`)}
   ${card('Decision controls','Maker-checker and delegated authority',`<div class="card-body"><div class="callout red"><span class="kpi-icon red">${icon('lock')}</span><div><strong>Approval is currently blocked</strong><p>Three critical payroll exceptions must be resolved before a positive approval can be recorded.</p></div></div><div class="form-field" style="margin-top:12px"><label>Reviewer comment</label><textarea id="approvalComment" placeholder="Record the basis for your decision..."></textarea></div><div class="actions" style="margin-top:12px"><button class="btn danger" data-action="reject-payroll">Reject payroll</button><button class="btn primary" data-action="approve-payroll" ${exceptions.some(e=>e.severity==='Critical'&&e.status!=='Resolved')?'disabled':''}>Approve payroll</button></div></div>`)}
  </div>
 </div></div>`;
}
function closePage(){
 return `<div class="page">${pageHead('Finalisation and distribution','Payroll Close and Distribution Centre','Control payslip generation, bank payment batches, general-ledger journals, statutory output packs and final release through one governed close process.',button('Download close pack','download-close-pack','', 'download')+button('Release payroll','release-payroll','primary','send'))}
 ${workflow(5)}
 <div class="grid four" style="margin-bottom:14px">
  ${card('1. Payslip generation','Secure dual-currency documents',`<div class="card-body">${(()=>{const c=__pr6CloseStats();if(!c)return progressRow('Generated',100,'128 of 128','cyan');const n=c.released?c.headcount:0;return progressRow('Generated',c.headcount?Math.round((n/c.headcount)*100):0,n+' of '+c.headcount,'cyan')})()}<div class="list">${(()=>{const c=__pr6CloseStats();const n=c?String(c.released?c.headcount:0):'128';return [['Digital payslips',n,c&&c.released?'Generated':'Pending'],['Verification hashes',n,c&&c.released?'Generated':'Pending'],['Suppressed payslips','0','None']]})().map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>${x[2]}</span></div><strong>${x[1]}</strong></div>`).join('')}</div><button class="btn small soft" data-page="mypay">Preview payslip</button></div>`)}
  ${card('2. Bank payment batches','Controlled settlement instructions',`<div class="card-body">${progressRow('Prepared',94,'4 of 5 batches','amber')}<div class="list">${(()=>{const c=__pr6CloseStats();if(!c)return [['USD payroll - Stanbic','USD 86,420','Ready'],['USD payroll - CBZ','USD 58,310','Ready']];return [['Net pay batch ('+c.label+')',__pr6Money(c.netUSD),c.released?'Ready':'Pending'],['Employees in batch',String(c.headcount),c.released?'Ready':'Pending']]})().map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>${x[1]}</span></div>${badge(x[2])}</div>`).join('')}</div></div>`)}
  ${card('3. General ledger journal','Entity and cost-centre posting',`<div class="card-body">${progressRow('Reconciled',87,'13 of 15 controls','amber')}<div class="list">${(()=>{const c=__pr6CloseStats();if(!c)return [['Gross payroll expense','USD 264,720','Matched'],['Payroll liabilities','USD 77,444','Matched'],['Net pay control','USD 187,276','Matched']];return [['Gross payroll expense',__pr6Money(c.grossUSD),'Matched'],['Payroll liabilities',__pr6Money(c.deductions),'Matched'],['Net pay control',__pr6Money(c.netUSD),'Matched']]})().map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>${x[1]}</span></div>${badge(x[2])}</div>`).join('')}</div></div>`)}
  ${card('4. Statutory output pack','Returns, schedules and evidence',`<div class="card-body">${progressRow('Prepared',75,'3 of 4 packs','violet')}<div class="list">${[['PAYE return pack','Ready to file'],['NSSA P4 schedule','Ready to file'],['AIDS levy control','Ready to file'],['NEC contribution file','Pending']].map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>June 2026</span></div>${badge(x[1])}</div>`).join('')}</div></div>`)}
 </div>
 <div class="grid two">
  ${card('Release controls','Hard stops prevent incomplete or self-approved releases',`<div class="card-body">${[['Calculation locked','Complete','blue'],['Maker-checker approval','Pending','amber'],['Critical exceptions','3 unresolved','red'],['Bank change verification','Pending','amber'],['GL control total','Matched','blue'],['Statutory packs','75% prepared','violet']].map(x=>`<div class="list-row"><div class="list-icon ${x[2]}">${x[2]==='blue'?icon('check'):icon('alert')}</div><div class="list-main"><strong>${x[0]}</strong><span>Control evidence retained</span></div>${badge(x[1])}</div>`).join('')}</div>`)}
  ${card('Release authority','Separate preparation, approval and release responsibilities',`<div class="card-body"><div class="access-user" style="margin-bottom:12px"><div class="photo-avatar" style="width:58px;height:58px;border-radius:18px;font-size:17px">TC</div><div><strong style="font-size:13px">Tawanda Chirenje</strong><div class="muted tiny">Chief Financial Officer - final release authority</div>${badge('MFA verified')}</div></div><div class="callout amber"><span class="kpi-icon amber">${icon('shield')}</span><div><strong>Release token not yet available</strong><p>The token is generated only after every blocking control has passed and the payroll approval is independently recorded.</p></div></div><div class="form-grid" style="margin-top:12px"><div class="form-field"><label>Settlement date</label><input value="30 Jun 2026"></div><div class="form-field"><label>Release channel</label><select><option>Secure bank API</option><option>Encrypted host-to-host file</option></select></div></div></div>`)}
 </div></div>`;
}
function componentsPage(){
 const comps=[['BASIC','Basic salary','Earning','Fixed / monthly','Employee currency','5000 - Salaries','Active'],['HOUSING','Housing allowance','Earning','Formula: 15% basic','USD / ZiG','5010 - Allowances','Active'],['TRANSPORT','Transport allowance','Earning','Fixed / monthly','USD / ZiG','5010 - Allowances','Active'],['OVERTIME','Overtime pay','Earning','Rate x approved hours','Employee currency','5020 - Overtime','Active'],['BONUS','Performance bonus','Earning','Ad hoc approved input','USD','5030 - Bonuses','Draft'],['PAYE','PAYE tax','Deduction','Statutory table','USD / ZiG','2100 - PAYE payable','Active'],['NSSA','NSSA contribution','Deduction','Statutory rule','USD / ZiG','2110 - NSSA payable','Active'],['MEDICAL','Medical aid contribution','Deduction','Plan and tier','USD','2125 - Medical payable','Active'],['LOAN','Employee loan repayment','Deduction','Amortisation schedule','USD / ZiG','1305 - Staff loans','Active']];
 const rows=(__pr6ComponentRows()||comps).map(c=>`<tr data-action="edit-component"><td><span class="link">${c[0]}</span></td><td><strong>${c[1]}</strong></td><td>${badge(c[2])}</td><td>${c[3]}</td><td>${c[4]}</td><td>${c[5]}</td><td>${badge(c[6])}</td><td><button class="btn small" data-action="edit-component">${icon('edit')}Edit</button></td></tr>`);
 return `<div class="page">${pageHead('Payroll administration','Earnings and Deductions Configuration','Configure pay components, eligibility, currency treatment, formulas, tax treatment, general-ledger mapping, versioning and approval controls.',button('Import configuration','import-components','', 'upload')+button('Create component','new-component','primary','plus'))}
 <div class="grid kpis">${(()=>{const c=__pr6ComponentStats();if(!c)return `${kpi('Earning components','24','18 recurring, 6 variable','wallet')}${kpi('Deduction components','17','8 statutory, 9 voluntary','calculator','violet')}`;return kpi('Earning components',String(c.earnings),c.earningsSub,'wallet')+kpi('Deduction components',String(c.deductions),c.deductionsSub,'calculator','violet')+kpi('Tax brackets',String(c.brackets),'Progressive PAYE bands','settings','cyan')+kpi('Statutory levies',String(c.levies),'AIDS levy, NSSA and SDL rates','shield','amber')})()}</div>
 ${tableCard('Pay component catalogue','Every component is versioned, tested and approved before it affects payroll',['Code','Component','Type','Calculation','Currency','GL mapping','Status',''],rows)}
 </div>`;
}
function calendarPage(){
 const __cal=__pr6PayGroups();const __periods=__cal?__cal.groups.flatMap(g=>(g.periods||[]).map(p=>({g:g.name,...p}))):null;const rows=__periods?(__periods.length?__periods.map(p=>`<tr><td><strong>${p.periodLabel}</strong><div class="tiny muted">${p.g}</div></td><td>${p.cutoffDate?String(p.cutoffDate).slice(0,10):'\u2014'}</td><td>${p.payDate?String(p.payDate).slice(0,10):'\u2014'}</td><td>${badge(p.status)}</td></tr>`):[`<tr><td colspan="4" class="tiny muted">No pay periods are configured.</td></tr>`]):[`<tr><td colspan="4" class="tiny muted">The payroll calendar is not visible to your role.</td></tr>`];
 return `<div class="page">${pageHead('Payroll administration','Pay Groups and Payroll Calendar','Define pay groups, cut-offs, calculation dates, review windows, approvals, payments and statutory deadlines across entities and branches.',button('Copy prior year','copy-calendar','', 'refresh')+button('Create pay group','new-paygroup','primary','plus'))}
 <div class="grid two" style="margin-bottom:14px">
  ${card('Pay groups','Population, currency and processing cadence',`<div class="card-body list">${[['Monthly Staff','128 employees','USD / ZiG','Active'],['Executives','12 employees','USD','Active'],['Contract Staff','34 employees','ZiG','Active'],['Commission Sales','21 employees','USD / ZiG','Review']].map((x,i)=>`<div class="list-row" data-action="edit-paygroup"><div class="list-icon ${i===3?'amber':''}">${icon('users')}</div><div class="list-main"><strong>${x[0]}</strong><span>${x[1]} - ${x[2]}</span></div>${badge(x[3])}</div>`).join('')}</div>`)}
  ${card('Schedule rules','Automated controls applied to every period',`<div class="card-body">${[['Payroll freeze','5 business days before payment'],['Late input authority','Payroll Manager + business owner'],['Calculation reruns','Versioned, reason required'],['Approval SLA','24 hours before release'],['Bank release','CFO or delegated treasury authority'],['Statutory filing','10th day of following month']].map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>${x[1]}</span></div>${icon('chev')}</div>`).join('')}</div>`)}
 </div>
 ${tableCard('Monthly Staff - payroll calendar','Cut-offs and controlled milestones for the next six periods',['Period','Input cut-off','Calculation','Review','Payment','Statutory','Status',''],rows)}
 </div>`;
}
function taxPage(){
 const title='Tax and Statutory Rule Configuration',desc='Manage currency-specific progressive PAYE bands, effective-dated statutory contributions and statutory account mappings.';
 if(!__pr6IsLive()) return `<div class="page">${pageHead('System configuration',title,desc)}<div class="grid four">${Array.from({length:4},()=>'<section class="card run-kpi-skeleton"><div class="skeleton-block" style="height:13px;width:54%"></div><div class="skeleton-block" style="height:28px;width:32%;margin-top:14px"></div></section>').join('')}</div><section class="card"><div class="card-head"><div><h3>Statutory configuration register</h3><p>Loading tax rules, PAYE bands, levies and account mappings…</p></div></div><div class="card-body">${Array.from({length:6},()=>'<div class="skeleton" style="height:30px;margin:7px 0"></div>').join('')}</div></section></div>`;
 const ref=__pr6Ref(),all=__pr6TaxRows()||[],canEdit=__pr6Has('payroll.tax.manage');
 const brackets=Array.isArray(ref.brackets)?ref.brackets:[],levies=Array.isArray(ref.levies)?ref.levies:[],rules=Array.isArray(ref.taxRules)?ref.taxRules:[],maps=Array.isArray(ref.statutoryMappings)?ref.statutoryMappings:[];
 const errors=(__pr6Live.errors||[]).filter(e=>['tax-rules','statutory/brackets','statutory/levies','statutory/mappings','accounting/currencies','component-accounts'].includes(e.source));
 const exportIcons='<span class="export-icon-group" aria-label="Export statutory configuration"><button class="icon-btn" title="Export PDF" aria-label="Export PDF" data-tax-export="pdf">'+icon('file')+'</button><button class="icon-btn" title="Export Excel" aria-label="Export Excel" data-tax-export="excel">'+icon('report')+'</button><button class="icon-btn" title="Export CSV" aria-label="Export CSV" data-tax-export="csv">'+icon('download')+'</button></span>';
 const actions=(canEdit?button('Map statutory accounts','statutory-mapping','')+button('Add PAYE bracket','new-tax-bracket','')+button('Configure levy','new-tax-levy','')+button('Add legacy tax rule','new-tax-rule','primary','plus'):'')+exportIcons;
 const usd=brackets.filter(b=>String(b.currencyCode).toUpperCase()==='USD').length,zig=brackets.filter(b=>String(b.currencyCode).toUpperCase()==='ZIG').length;
 const kpis=kpi('Legacy tax rules',String(rules.length),'Compatibility rules only','shield','cyan')+kpi('PAYE bands',String(brackets.length),`${usd} USD · ${zig} ZIG`,'settings','violet')+kpi('Statutory levy settings',String(levies.length),'Effective-dated currency settings','audit')+kpi('GL mappings',String(maps.length),'Active statutory deductions','bank','cyan');
 state.taxSearch=state.taxSearch||'';state.taxKind=state.taxKind||'All';state.taxCurrency=state.taxCurrency||'All';state.taxStatus=state.taxStatus||'All';state.taxPageSize=Number(state.taxPageSize)||10;state.taxPage=Math.max(1,Number(state.taxPage)||1);
 const search=state.taxSearch.toLowerCase();
 const filtered=all.filter(r=>(state.taxKind==='All'||r[6]===state.taxKind)&&(state.taxCurrency==='All'||r[2]===state.taxCurrency)&&(state.taxStatus==='All'||r[4]===state.taxStatus)&&(!search||r.slice(0,6).some(v=>String(v||'').toLowerCase().includes(search))));
 const pages=Math.max(1,Math.ceil(filtered.length/state.taxPageSize));state.taxPage=Math.min(state.taxPage,pages);const shown=filtered.slice((state.taxPage-1)*state.taxPageSize,state.taxPage*state.taxPageSize);
 const rows=shown.map(r=>`<tr data-rule-kind="${__pr6Esc(r[6])}" data-record-id="${__pr6Esc(r[7])}"><td data-label="Category">${__pr6Esc(r[6]==='rule'?'Legacy rule':r[6]==='bracket'?'PAYE bracket':r[6]==='levy'?'Statutory levy':'GL mapping')}</td><td data-label="Configuration"><strong>${__pr6Esc(r[1])}</strong></td><td data-label="Currency">${__pr6Esc(r[2])}</td><td data-label="Rate / details">${__pr6Esc(r[5])}</td><td data-label="Effective from">${__pr6Esc(r[3])}</td><td data-label="Effective to">${__pr6Esc(r[8]||'—')}</td><td data-label="Status">${badge(r[4])}</td><td data-label="Action"><button class="btn small" data-action="open-rule">${r[6]==='mapping'?'Edit mapping':'Open'}</button></td></tr>`);
 const body=rows.length?rows.join(''):`<tr><td colspan="8" class="empty-state">${filtered.length?'No configuration rows on this page.':'No tax or statutory configuration matches these filters.'}</td></tr>`;
 const currencies=[...new Set(all.map(r=>r[2]).filter(v=>v&&v!=='—'))].sort();
 const kindOptions=[['All','All configuration'],['rule','Legacy tax rules'],['bracket','PAYE brackets'],['levy','Statutory levies'],['mapping','GL mappings']].map(x=>`<option value="${x[0]}" ${state.taxKind===x[0]?'selected':''}>${x[1]}</option>`).join('');
 const currencyOptions=['All',...currencies].map(x=>`<option value="${__pr6Esc(x)}" ${state.taxCurrency===x?'selected':''}>${x==='All'?'All currencies':x}</option>`).join('');
 const statusOptions=['All','Active','Mapped','Default account','Scheduled','Expired','Inactive'].map(x=>`<option ${state.taxStatus===x?'selected':''}>${x}</option>`).join('');
 const filterBar=`<div class="run-filter-bar"><label>Search configuration<input id="taxSearch" type="search" placeholder="Name, code, rate or account" value="${__pr6Esc(state.taxSearch)}"></label><label>Type<select id="taxKind">${kindOptions}</select></label><label>Currency<select id="taxCurrency">${currencyOptions}</select></label><label>Status<select id="taxStatus">${statusOptions}</select></label><span class="tiny muted">${filtered.length} matching configuration row${filtered.length===1?'':'s'}</span></div>`;
 const pagination=`<div class="table-pagination"><span>${filtered.length?((state.taxPage-1)*state.taxPageSize+1):0}–${Math.min(state.taxPage*state.taxPageSize,filtered.length)} of ${filtered.length} rows</span><div><label>Rows <select id="taxPageSize"><option ${state.taxPageSize===10?'selected':''}>10</option><option ${state.taxPageSize===25?'selected':''}>25</option><option ${state.taxPageSize===50?'selected':''}>50</option></select></label><button type="button" class="btn small" data-tax-page="${Math.max(1,state.taxPage-1)}" ${state.taxPage<=1?'disabled':''}>Previous</button><span>Page ${state.taxPage} of ${pages}</span><button type="button" class="btn small" data-tax-page="${Math.min(pages,state.taxPage+1)}" ${state.taxPage>=pages?'disabled':''}>Next</button></div></div>`;
 const errorPanel=errors.length?`<div class="callout amber" role="status"><div><strong>Some configuration sources could not be loaded.</strong><p>${errors.map(e=>`${__pr6Esc(e.source)}: ${__pr6Esc(e.message)}`).join(' · ')}. Retry the page to refresh the affected data.</p><button type="button" class="btn small" data-action="retry-payroll-load">Try again</button></div></div>`:'';
 const policy=`<div class="callout blue" style="margin-top:12px"><div><strong>Payroll calculation controls (SRD)</strong><p>PAYE is evaluated progressively against the matching USD or ZiG bracket table: taxable currency leg × marginal rate − deduction offset. AIDS Levy is 3% of PAYE. NSSA is calculated on pensionable earnings capped by the currency-specific ceiling; SDL uses its configured rate. Each currency leg is calculated independently. Legacy tax rules remain for backward compatibility and are not a substitute for PAYE brackets.</p></div></div>`;
 return `<div class="page">${pageHead('System configuration',title,desc,actions)}<div class="grid four tax-kpis">${kpis}</div>${errorPanel}<section class="card"><div class="card-head"><div><h3>Tax and statutory configuration</h3><p>Live API configuration · identifiers are hidden from this register</p></div></div>${filterBar}<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Category</th><th>Configuration</th><th>Currency</th><th>Rate / details</th><th>Effective from</th><th>Effective to</th><th>Status</th><th></th></tr></thead><tbody>${body}</tbody></table></div>${pagination}</section>${policy}</div>`;
}

function exportTaxV6(kind){
 if(!__pr6IsLive()){toast('Export unavailable','Statutory configuration is still loading.','warn');return;}
 const all=__pr6TaxRows()||[],search=(state.taxSearch||'').toLowerCase();
 const rows=all.filter(r=>(!state.taxKind||state.taxKind==='All'||r[6]===state.taxKind)&&(!state.taxCurrency||state.taxCurrency==='All'||r[2]===state.taxCurrency)&&(!state.taxStatus||state.taxStatus==='All'||r[4]===state.taxStatus)&&(!search||r.slice(0,6).some(v=>String(v||'').toLowerCase().includes(search)))).map(r=>[r[0],r[1],r[2],r[5],r[3],r[8]||'—',r[4]]);
 const fn=window.__PAYROLL_V6_EXPORT_TAX__;
 if(typeof fn!=='function'){toast('Export unavailable','The branded export service is not ready.','warn');return;}
 void fn(kind,{title:'Tax and Statutory Configuration',subtitle:'Payroll tax, statutory levy and account mapping register.',columns:['Category','Configuration','Currency','Rate / details','Effective from','Effective to','Status'],rows,filename:'payroll-tax-statutory-configuration',landscape:true,meta:[['Rows',String(rows.length)],['Type filter',state.taxKind||'All'],['Currency filter',state.taxCurrency||'All'],['Status filter',state.taxStatus||'All'],['Search',state.taxSearch||'All configuration']],note:'Filtered rows from live Payroll API configuration. Database IDs are excluded. PAYE brackets are currency-specific; AIDS Levy is 3% of PAYE; NSSA is capped by currency; SDL uses the configured rate. Local and development exports use Matanho branding; production exports use NVCCZ branding.'});
}
document.addEventListener('click',event=>{
 const ex=event.target?.closest?.('[data-tax-export]');if(ex){event.preventDefault();event.stopImmediatePropagation();exportTaxV6(ex.dataset.taxExport);return;}
 const pg=event.target?.closest?.('[data-tax-page]');if(pg){event.preventDefault();event.stopImmediatePropagation();state.taxPage=Number(pg.dataset.taxPage)||1;render();}
},true);
document.addEventListener('input',event=>{
 const el=event.target;if(el?.id!=='taxSearch')return;const pos=el.selectionStart;state.taxSearch=el.value;state.taxPage=1;render();const n=document.querySelector('#taxSearch');n?.focus();if(pos!==null)n?.setSelectionRange(pos,pos);
},true);
document.addEventListener('change',event=>{
 const el=event.target;if(el?.id==='taxKind')state.taxKind=el.value;else if(el?.id==='taxCurrency')state.taxCurrency=el.value;else if(el?.id==='taxStatus')state.taxStatus=el.value;else if(el?.id==='taxPageSize')state.taxPageSize=Number(el.value)||10;else return;state.taxPage=1;render();
},true);

function trainingFactV6(label,value){return '<div class="fact"><span>'+__pr6Esc(label)+'</span><strong>'+__pr6Esc(value)+'</strong></div>';}
function trainingViewV6(){
 const ref=__pr6Ref(),path=(window.location.pathname||'').replace(/\/+$/,''),tab=path.endsWith('/assignments')?'Assignments':path.endsWith('/certifications')?'Certifications':'Courses',search=(state.trainingSearch||'').toLowerCase(),status=state.trainingStatus||'All';
 state.trainingTab=tab;
 const courses=Array.isArray(ref.courses)?ref.courses:[],assignments=Array.isArray(ref.trainingAssignments)?ref.trainingAssignments:[],certs=Array.isArray(ref.certifications)?ref.certifications:[];
 const audience=ref.trainingAudienceOptions||{},audienceEmployees=Array.isArray(audience.employees)?audience.employees:[],audienceRoles=Array.isArray(audience.roles)?audience.roles:[];
 const employeeName=c=>[c.employee?.user?.firstName,c.employee?.user?.lastName].filter(Boolean).join(' ')||c.employee?.employeeNumber||'Employee';
 let rows;
 if(tab==='Assignments') rows=assignments.map(a=>{const type=String(a.scopeType||'').toUpperCase(),employee=type==='EMPLOYEE'?audienceEmployees.find(e=>e.id===a.scopeValue):null,role=type==='ROLE'?audienceRoles.find(r=>(r.value||r.code||r.name)===a.scopeValue):null;const label=type==='ALL'?'All employees':type==='DEPARTMENT'?(a.scopeValue||'Department'):type==='ROLE'?(role?.name||a.scopeValue||'Role'):(employee?`${employee.employeeNumber} · ${employee.firstName} ${employee.lastName}`.trim():a.scopeValue||'Employee');return {id:a.id,values:[a.course?.code||'—',a.course?.title||'Course',type==='EMPLOYEE'?'Employee':type==='ALL'?'All employees':type==='ROLE'?'Role':'Department',label]};});
 else if(tab==='Certifications') rows=certs.map(c=>({id:c.id,status:String(c.status||'UNKNOWN').toUpperCase(),values:[employeeName(c),c.employee?.employeeNumber||'—',c.course?.title||'Course',c.issuedDate?String(c.issuedDate).slice(0,10):'—',c.expirationDate?String(c.expirationDate).slice(0,10):'—',String(c.status||'UNKNOWN').toUpperCase(),c.fileUrl?'Available':'Not recorded']}));
 else rows=courses.map(c=>({id:c.id,values:[c.code||'—',c.title||'Course',c.renewalPeriodMonths?`${c.renewalPeriodMonths} months`:'—',String(certs.filter(x=>x.courseId===c.id).length),String(assignments.filter(x=>x.courseId===c.id).length)]}));
 rows=rows.filter(r=>(tab!=='Certifications'||status==='All'||r.status===status)&&(!search||r.values.some(v=>String(v).toLowerCase().includes(search))));
 return {tab,rows,courses,assignments,certs,employeeName,columns:tab==='Assignments'?['Code','Course','Scope','Population']:tab==='Certifications'?['Employee','Employee number','Course','Issued','Expires','Status','Evidence']:['Code','Course','Renewal','Certifications','Assignments']};
}
function trainingPage(){
 const title='Training and Certification Compliance Centre',desc='Manage training courses, assignments, verified certifications and expiry status.';
 if(!__pr6IsLive()) return `<div class="page">${pageHead('Human capital compliance',title,desc)}<div class="grid four tax-kpis">${Array.from({length:4},()=>'<section class="card run-kpi-skeleton"><div class="skeleton-block" style="height:13px;width:54%"></div><div class="skeleton-block" style="height:28px;width:32%;margin-top:14px"></div></section>').join('')}</div><section class="card"><div class="card-head"><div><h3>Training register</h3><p>Loading live training records…</p></div></div><div class="card-body">${Array.from({length:6},()=>'<div class="skeleton" style="height:30px;margin:7px 0"></div>').join('')}</div></section></div>`;
 if(!__pr6Has('payroll.training.view')&&!__pr6Has('payroll.training.manage')) return __pr6DeniedPageHtml('training');
 const m=trainingViewV6(),manage=__pr6Has('payroll.training.manage'),today=Date.now(),expiring=m.certs.filter(c=>c.status!=='REVOKED'&&c.expirationDate&&new Date(c.expirationDate).getTime()<=today+30*86400000).length;
 state.trainingTab=m.tab;state.trainingPage=Math.max(1,Number(state.trainingPage)||1);state.trainingPageSize=Number(state.trainingPageSize)||10;
 const pages=Math.max(1,Math.ceil(m.rows.length/state.trainingPageSize));state.trainingPage=Math.min(state.trainingPage,pages);const shown=m.rows.slice((state.trainingPage-1)*state.trainingPageSize,state.trainingPage*state.trainingPageSize);
 const icons=`<div class="export-icon-group" role="group" aria-label="Export training register">${[['pdf','file','PDF'],['excel','report','Excel'],['csv','download','CSV']].map(([k,i,label])=>`<button class="icon-btn" type="button" data-training-export="${k}" title="Export ${label}" aria-label="Export ${label}">${icon(i)}</button>`).join('')}</div>`;
 const actions=icons+(manage?button('Create course','new-training-course','')+button('Assign course','assign-training-course','')+button('Record completion','record-training','primary','plus'):'');
 const stats=kpi('Courses',String(m.courses.length),'Active course catalogue','graduation','cyan')+kpi('Assignments',String(m.assignments.length),'Role, department and all-staff scopes','users')+kpi('Certifications',String(m.certs.length),'Recorded employee evidence','check','violet')+kpi('Expiring or expired',String(expiring),'Within 30 days or overdue','shield','amber');
  const tabs=[['Courses','/payroll/training'],['Assignments','/payroll/training/assignments'],['Certifications','/payroll/training/certifications']].map(([t,path])=>`<button type="button" class="${m.tab===t?'active':''}" data-training-tab="${t}" data-training-path="${path}">${t}</button>`).join('');
 const statuses=['All','VALID','EXPIRING','EXPIRED','REVOKED'].map(x=>`<option value="${x}" ${state.trainingStatus===x?'selected':''}>${x==='All'?'All statuses':x.charAt(0)+x.slice(1).toLowerCase()}</option>`).join('');
 const rows=shown.map(r=>`<tr>${r.values.map((v,i)=>`<td data-label="${__pr6Esc(m.columns[i])}">${__pr6Esc(v)}</td>`).join('')}<td data-label="Action">${m.tab==='Courses'?`<button class="btn small" data-action="training-detail" data-course-id="${__pr6Esc(r.id)}">${manage?'Edit':'View'}</button>${manage?` <button class="btn small" data-training-deactivate="${__pr6Esc(r.id)}">Deactivate</button>`:''}`:m.tab==='Assignments'?(manage?`<button class="btn small" data-training-remove="${__pr6Esc(r.id)}">Remove</button>`:'—'):`<button class="btn small" data-training-cert="${__pr6Esc(r.id)}">Details</button>${manage?` <button class="btn small" data-training-renew="${__pr6Esc(r.id)}">Renew</button>${r.status!=='REVOKED'?` <button class="btn small" data-training-revoke="${__pr6Esc(r.id)}">Revoke</button>`:''}`:''}`}</td></tr>`).join('');
 const pagination=`<div class="table-pagination"><span>${m.rows.length?((state.trainingPage-1)*state.trainingPageSize+1):0}–${Math.min(state.trainingPage*state.trainingPageSize,m.rows.length)} of ${m.rows.length} records</span><div><label>Rows <select id="trainingPageSize">${[10,25,50].map(n=>`<option ${state.trainingPageSize===n?'selected':''}>${n}</option>`).join('')}</select></label><button class="btn small" data-training-page="${Math.max(1,state.trainingPage-1)}" ${state.trainingPage<=1?'disabled':''}>Previous</button><span>Page ${state.trainingPage} of ${pages}</span><button class="btn small" data-training-page="${Math.min(pages,state.trainingPage+1)}" ${state.trainingPage>=pages?'disabled':''}>Next</button></div></div>`;
 const failures=(__pr6Live.errors||[]).filter(e=>['compliance/courses','compliance/assignments','compliance/assignments/audience-options','compliance/certifications','employees'].includes(e.source));
 const error=failures.length?`<div class="callout amber"><div><strong>Some training records could not be loaded.</strong><p>${failures.map(e=>__pr6Esc(e.source)+': '+__pr6Esc(e.message)).join(' · ')}</p><button class="btn small" data-action="retry-payroll-load">Try again</button></div></div>`:'';
  return `<div class="page">${pageHead('Human capital compliance',title,desc,actions)}<div class="grid four tax-kpis">${stats}</div>${error}<section class="card"><div class="card-head"><div><h3>${m.tab==='Courses'?'Training courses':m.tab==='Assignments'?'Course assignments':'Employee certifications'}</h3><p>${m.tab==='Courses'?'Manage the training catalogue':m.tab==='Assignments'?'Manage the people and teams assigned to each course':'Track completed training and certification expiry'}</p></div><div class="segmented">${tabs}</div></div><div class="run-filter-bar"><label>Search<input id="trainingSearch" type="search" placeholder="Course, employee or scope" value="${__pr6Esc(state.trainingSearch||'')}"></label>${m.tab==='Certifications'?`<label>Status<select id="trainingStatus">${statuses}</select></label>`:''}<span class="tiny muted">${m.rows.length} matching records</span></div><div class="table-wrap"><table class="responsive-table"><thead><tr>${m.columns.map(c=>`<th>${__pr6Esc(c)}</th>`).join('')}<th></th></tr></thead><tbody>${rows||`<tr><td colspan="${m.columns.length+1}" class="empty-state">No ${m.tab.toLowerCase()} match these filters.</td></tr>`}</tbody></table></div>${pagination}</section></div>`;
}
function trainingExportV6(kind){const m=trainingViewV6(),fn=window.__PAYROLL_V6_EXPORT_TRAINING__;if(typeof fn!=='function'){toast('Export unavailable','The training export service is not ready.','warn');return}void fn(kind,{title:`Training and Compliance - ${m.tab}`,subtitle:'Filtered live Payroll training records.',columns:m.columns,rows:m.rows.map(r=>r.values),filename:`payroll-training-${m.tab.toLowerCase()}`,landscape:true,meta:[['Records',String(m.rows.length)],['Search',state.trainingSearch||'All'],['Status',m.tab==='Certifications'?(state.trainingStatus||'All'):'Not applicable']],note:'Database identifiers are excluded. Certification status is the status recorded by the Payroll API.'})}
function openTrainingCertificationV6(record=null){
 if(!__pr6Has('payroll.training.manage'))return deny('training.manage');
 const ref=__pr6Ref(),courses=ref.courses||[],staff=Array.isArray(employees)?employees:[],esc=__pr6Esc,today=new Date().toISOString().slice(0,10);
 openModal(record?'Renew certification':'Record certification','Attach verified evidence and enter its issue and expiry dates.',`<div class="form-grid"><input id="certId" type="hidden" value="${esc(record?.id||'')}"><div class="form-field"><label>Employee</label><select id="certEmployee" ${record?'disabled':''}><option value="">Select employee</option>${staff.map(e=>`<option value="${esc(e.recordId||e.id)}" ${(e.recordId||e.id)===record?.employeeId?'selected':''}>${esc(e.name||e.employeeNumber||'Employee')}</option>`).join('')}</select></div><div class="form-field"><label>Course</label><select id="certCourse" ${record?'disabled':''}><option value="">Select course</option>${courses.map(c=>`<option value="${esc(c.id)}" ${c.id===record?.courseId?'selected':''}>${esc(c.code)} · ${esc(c.title)}</option>`).join('')}</select></div><div class="form-field"><label>Issue date</label><input id="certIssuedDate" type="date" value="${today}"></div><div class="form-field"><label>Expiry date</label><input id="certExpirationDate" type="date"></div><div class="form-field full"><label>Verified certificate</label><input id="certDocument" type="file" accept="application/pdf,image/*"><small>PDF or image, up to 15 MB.</small></div></div>`,`${button('Cancel','close-modal')}${button(record?'Renew certification':'Record certification','save-training-certification','primary','check')}`);
}
document.addEventListener('click',event=>{
 const target=event.target?.closest?.('[data-training-tab],[data-training-page],[data-training-export],[data-training-cert],[data-training-renew],[data-training-revoke],[data-training-remove],[data-training-deactivate]');if(!target)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(target.dataset.trainingTab){event.preventDefault();state.trainingTab=target.dataset.trainingTab;state.trainingPage=1;state.trainingSearch='';state.trainingStatus='All';const path=target.dataset.trainingPath;if(path&&window.location.pathname!==path){History.prototype.pushState.call(window.history,null,'',path);window.dispatchEvent(new PopStateEvent('popstate'));}else render();return;}
 if(target.dataset.trainingPage){state.trainingPage=Number(target.dataset.trainingPage)||1;render();return;}
 if(target.dataset.trainingExport){trainingExportV6(target.dataset.trainingExport);return;}
 const ref=__pr6Ref(),id=target.dataset.trainingCert||target.dataset.trainingRenew||target.dataset.trainingRevoke||target.dataset.trainingRemove||target.dataset.trainingDeactivate;
 if(target.hasAttribute('data-training-cert')){const c=(ref.certifications||[]).find(x=>x.id===id);if(!c)return;const u=c.employee?.user||{},name=[u.firstName,u.lastName].filter(Boolean).join(' ')||c.employee?.employeeNumber||'Employee';openModal('Certification details',__pr6Esc(name)+' · '+__pr6Esc(c.course?.title||'Course'),`<div class="profile-summary-strip">${trainingFactV6('Issued',c.issuedDate?String(c.issuedDate).slice(0,10):'—')}${trainingFactV6('Expires',c.expirationDate?String(c.expirationDate).slice(0,10):'—')}${trainingFactV6('Status',c.status||'Unknown')}${trainingFactV6('Evidence',c.fileUrl?'Available':'Not recorded')}</div>`,button('Close','close-modal'));return;}
 if(target.hasAttribute('data-training-renew')){const c=(ref.certifications||[]).find(x=>x.id===id);if(c)openTrainingCertificationV6(c);return;}
 const action=target.hasAttribute('data-training-revoke')?'confirm-training-revoke':target.hasAttribute('data-training-remove')?'confirm-training-remove-assignment':'confirm-training-deactivate-course';
 const label=action==='confirm-training-revoke'?'Revoke certification':action==='confirm-training-remove-assignment'?'Remove assignment':'Deactivate course';
 const detail=action==='confirm-training-revoke'?'Revoking this certification can block the permissions associated with its course.':action==='confirm-training-remove-assignment'?'This removes the training requirement from the selected scope.':'This removes the course from the active catalogue.';
 openModal(label,detail,'<p>Confirm this change to the live training record.</p>',`${button('Cancel','close-modal')}<button class="btn primary" data-action="${action}" data-id="${__pr6Esc(id)}">${label}</button>`);
},true);
document.addEventListener('input',event=>{const el=event.target;if(el?.id!=='trainingSearch')return;const pos=el.selectionStart;state.trainingSearch=el.value;state.trainingPage=1;render();const next=document.querySelector('#trainingSearch');next?.focus();if(pos!==null)next?.setSelectionRange(pos,pos);},true);
document.addEventListener('change',event=>{const el=event.target;if(el?.id==='trainingStatus')state.trainingStatus=el.value;else if(el?.id==='trainingPageSize')state.trainingPageSize=Number(el.value)||10;else return;state.trainingPage=1;render();},true);

function leaveViewV6(){
 const rows=__pr6LeaveRows();if(!rows)return null;
 const search=String(state.leaveSearch||'').trim().toLowerCase(),type=state.leaveTypeFilter||'All leave types',department=state.leaveDepartmentFilter||'All departments';
 const filtered=rows.filter(r=>(type==='All leave types'||r.leaveType===type)&&(department==='All departments'||r.department===department)&&(!search||[r.name,r.employeeNumber,r.department,r.leaveType].some(v=>String(v||'').toLowerCase().includes(search))));
 const types=[...new Set(rows.map(r=>r.leaveType).filter(Boolean))].sort(),departments=[...new Set(rows.map(r=>r.department).filter(Boolean))].sort();
 const pageSize=Math.max(1,Number(state.leavePageSize)||10),pages=Math.max(1,Math.ceil(filtered.length/pageSize));state.leavePage=Math.min(Math.max(1,Number(state.leavePage)||1),pages);const first=filtered.length?(state.leavePage-1)*pageSize+1:0,last=Math.min(state.leavePage*pageSize,filtered.length);
 return {rows,filtered,types,departments,pageSize,pages,first,last,visible:filtered.slice((state.leavePage-1)*pageSize,state.leavePage*pageSize)};
}

function leaveExportV6(kind){
 const m=leaveViewV6(),fn=window.__PAYROLL_V6_EXPORT_LEAVE__;if(!m){toast('Leave data is still loading','Try exporting again after the register has loaded.','warn');return;}if(typeof fn!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return;}
 const salaryVisible=can('salary.view'),rows=m.filtered.map(r=>[r.employeeNumber||'—',r.name||'—',r.department||'Unassigned',r.leaveType,`${r.available} days`,salaryVisible&&r.liabilityUSD!==null?Number(r.liabilityUSD).toFixed(2):salaryVisible?'—':'Restricted',salaryVisible&&r.liabilityZiG!==null?Number(r.liabilityZiG).toFixed(2):salaryVisible?'—':'Restricted']);
 const filters=[['Employee search',state.leaveSearch||'All employees'],['Leave type',state.leaveTypeFilter||'All leave types'],['Department',state.leaveDepartmentFilter||'All departments']];
 void fn(kind,{title:'Leave Balance and Liability Register',subtitle:'Leave balances from the Payroll API; liability is derived separately by salary currency from annual balance × monthly basic salary ÷ 22 working days.',columns:['Employee number','Employee','Department','Leave type','Available balance','Liability USD','Liability ZiG'],rows,filename:'payroll-leave-balance-register',landscape:true,meta:[['Matching balances',String(rows.length)],['Employees',String(new Set(m.filtered.map(r=>r.employeeNumber)).size)],...filters],note:`Filtered live leave balance records. Employee database identifiers are excluded. ${salaryVisible?'Liability is included only where payroll salary permission allows it.':'Salary liability is restricted for this user.'}`});
}

function openLeaveBalanceForm(record=null){
 if(!__pr6Has('payroll.leave.manage'))return deny('leave.manage');
 const ref=__pr6Ref(),people=Array.isArray(ref.leaveEmployees)?ref.leaveEmployees:[],balances=Array.isArray(__pr6Live.leaveBalances)?__pr6Live.leaveBalances:[];
 if(!people.length){toast('Employee list unavailable','Active employees could not be loaded. Try again before setting a balance.','warn');return;}
 const types=[...new Set(['ANNUAL',...balances.map(x=>String(x.leaveType||'').trim().toUpperCase().replace(/[ -]+/g,'_')).filter(Boolean)])].sort(),empId=record?.employeeId||'',leaveType=String(record?.leaveType||types[0]||'ANNUAL').toUpperCase().replace(/[ -]+/g,'_'),match=record||balances.find(x=>x.employeeId===empId&&String(x.leaveType).toUpperCase().replace(/[ -]+/g,'_')===leaveType),currentBalance=record?.balance??record?.available??match?.balance;
 const esc=__pr6Esc;
 openModal(record?'Update leave balance':'Set leave balance','Enter the employee’s current available balance.',`<div class="form-grid"><div class="form-field full"><label for="leaveEmployee">Employee</label><select id="leaveEmployee"><option value="">Select employee</option>${people.map(e=>`<option value="${esc(e.id)}" ${e.id===empId?'selected':''}>${esc(e.employeeNumber||'')} · ${esc(e.name||'Employee')} · ${esc(e.department||'Unassigned')}</option>`).join('')}</select></div><div class="form-field"><label for="leaveType">Leave type</label><select id="leaveType">${types.map(t=>`<option value="${esc(t)}" ${t===leaveType?'selected':''}>${esc(t.replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()))}</option>`).join('')}</select></div><div class="form-field"><label for="leaveBalance">Available balance (days)</label><input id="leaveBalance" type="number" min="0" step="0.01" value="${currentBalance!==undefined&&currentBalance!==null?esc(currentBalance):''}" placeholder="e.g. 12.5"></div><div class="form-field full"><small>Enter the current available balance in days. This updates the selected employee’s balance for this leave type.</small></div></div>`,`${button('Cancel','close-modal')}<button class="btn primary" data-action="save-leave-balance">${icon('check')}${record?'Save balance':'Set balance'}</button>`);
}

function leavePage(){
 if(!__pr6IsLive())return `<div class="page">${pageHead('Human capital administration','Leave and Benefits','Review payroll leave balances and configured benefit components.')}<div class="grid four tax-kpis">${Array.from({length:4},()=>'<section class="card run-kpi-skeleton"><div class="skeleton-block" style="height:13px;width:54%"></div><div class="skeleton-block" style="height:28px;width:32%;margin-top:14px"></div></section>').join('')}</div><section class="card"><div class="card-head"><div><h3>Leave balance register</h3><p>Loading live Payroll records…</p></div></div><div class="card-body">${Array.from({length:6},()=>'<div class="skeleton" style="height:30px;margin:7px 0"></div>').join('')}</div></section></div>`;
 if(!__pr6Has('payroll.leave.view')&&!__pr6Has('payroll.leave.manage'))return __pr6DeniedPageHtml('leave');
 const m=leaveViewV6(),stats=__pr6LeaveStats(),manage=__pr6Has('payroll.leave.manage'),salaryVisible=can('salary.view');
 const exportIcons=`<div class="export-icon-group" role="group" aria-label="Export leave register">${[['pdf','file','PDF'],['excel','report','Excel'],['csv','download','CSV']].map(([k,i,label])=>`<button class="icon-btn" type="button" data-leave-export="${k}" title="Export ${label}" aria-label="Export ${label}">${icon(i)}</button>`).join('')}</div>`;
 const actions=exportIcons+(manage?button('Set leave balance','leave-adjustment','primary','plus'):''),l=stats;
 const liabilityLabel=l.liability===null?'Restricted':`USD ${Number(l.liability.usd).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} · ZiG ${Number(l.liability.zig).toLocaleString('en-US',{maximumFractionDigits:0})}`;
 const statsHtml=`${kpi('Annual leave liability',liabilityLabel,salaryVisible?'Annual balance × basic salary ÷ 22, shown by currency':'Requires salary access','wallet')}${kpi('Average annual balance',l.average+' days','Across employees with an annual balance','calendar','cyan')}${kpi('Employees with annual leave',String(l.employees),'From current balance records','users','violet')}${kpi('Leave types',String(l.types),'Present in current balance records','settings')}`;
 const departments=m?['All departments',...m.departments].map(x=>`<option value="${__pr6Esc(x)}" ${state.leaveDepartmentFilter===x?'selected':''}>${__pr6Esc(x)}</option>`).join(''):'';
 const types=m?['All leave types',...m.types].map(x=>`<option value="${__pr6Esc(x)}" ${state.leaveTypeFilter===x?'selected':''}>${__pr6Esc(x.replaceAll('_',' '))}</option>`).join(''):'';
 const rows=m.visible.map(r=>`<tr><td><div class="access-user"><div class="mini-avatar">${__pr6Esc(r.initials)}</div><strong>${__pr6Esc(r.name||'Employee')}</strong></div><div class="tiny muted">${__pr6Esc(r.employeeNumber||'')}</div></td><td>${__pr6Esc(r.department)}</td><td>${__pr6Esc(String(r.leaveType||'').replaceAll('_',' '))}</td><td>${__pr6Esc(r.available)} days</td><td class="money">${salaryVisible?(r.liabilityUSD!==null?`USD ${Number(r.liabilityUSD).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`:r.liabilityZiG!==null?`ZiG ${Number(r.liabilityZiG).toLocaleString('en-US',{maximumFractionDigits:0})}`:'—'):'Restricted'}</td><td>${manage?`<button class="btn small" type="button" data-leave-edit="${__pr6Esc(r.employeeId)}" data-leave-type="${__pr6Esc(r.leaveType)}">Edit balance</button>`:'—'}</td></tr>`).join('');
 const pageCount=m.pages,pagination=`<div class="table-pagination"><span>${m.first}–${m.last} of ${m.filtered.length} balances</span><div><label>Rows <select id="leavePageSize">${[10,25,50].map(n=>`<option value="${n}" ${m.pageSize===n?'selected':''}>${n}</option>`).join('')}</select></label><button class="btn small" data-leave-page="${Math.max(1,state.leavePage-1)}" ${state.leavePage<=1?'disabled':''}>Previous</button><span>Page ${state.leavePage} of ${pageCount}</span><button class="btn small" data-leave-page="${Math.min(pageCount,state.leavePage+1)}" ${state.leavePage>=pageCount?'disabled':''}>Next</button></div></div>`;
 const failures=(__pr6Live.errors||[]).filter(e=>['leave-balances','leave-balance-employee-options','employees','allowance-types'].includes(e.source));
 const error=failures.length?`<div class="callout amber"><div><strong>Some leave or benefit records could not be loaded.</strong><p>Try again in a moment.</p><button class="btn small" data-action="retry-payroll-load">Try again</button></div></div>`:'';
 const benefitAccess=__pr6Has('payroll.components.view')||__pr6Has('payroll.components.manage'),allowances=Array.isArray(__pr6Ref().allowanceTypes)?__pr6Ref().allowanceTypes:[],benefitTypes=allowances.filter(a=>a.isActive!==false&&/benefit|housing|school|medical|health|education|tuition|meal|transport/i.test(String(a.name||''))),benefitRows=benefitTypes.map(a=>`<div class="list-row"><div class="list-icon">${icon('wallet')}</div><div class="list-main"><strong>${__pr6Esc(a.name||'Pay component')}</strong><span>${__pr6Esc(a.code||'')} · ${a.calculationMethod==='PERCENT_BASIC'?`${__pr6Esc(a.calculationRate||0)}% of basic salary`:'Configured earning'}</span></div>${badge('Active')}</div>`).join('');
 const benefits=benefitAccess?`<section class="card"><div class="card-head"><div><h3>Configured benefit components</h3><p>Active benefit-related earning components available to payroll.</p></div><button class="btn small" data-page="components">Open Earnings &amp; Deductions</button></div><div class="card-body list">${benefitRows||'<p class="muted">No active benefit components are configured.</p>'}</div></section>`:'';
 return `<div class="page">${pageHead('Human capital administration','Leave and Benefits','Review leave balances and configured benefit components.',actions)}<div class="grid four tax-kpis">${statsHtml}</div>${error}<section class="card"><div class="card-head"><div><h3>Leave balance register</h3><p>Current balances by employee and leave type</p></div></div><div class="run-filter-bar"><label>Search<input id="leaveSearch" type="search" placeholder="Employee, number, department or leave type" value="${__pr6Esc(state.leaveSearch||'')}"></label><label>Leave type<select id="leaveTypeFilter">${types}</select></label><label>Department<select id="leaveDepartmentFilter">${departments}</select></label><span class="tiny muted">${m.filtered.length} matching balances</span></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Employee</th><th>Department</th><th>Leave type</th><th>Available balance</th><th>Annual liability</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="empty-state">${m.filtered.length?'No balances on this page.':'No leave balances match these filters.'}</td></tr>`}</tbody></table></div>${pagination}</section>${benefits}</div>`;
}

document.addEventListener('click',event=>{const target=event.target?.closest?.('[data-leave-export],[data-leave-page],[data-leave-edit]');if(!target)return;event.preventDefault();event.stopImmediatePropagation();if(target.dataset.leaveExport){leaveExportV6(target.dataset.leaveExport);return;}if(target.dataset.leavePage){state.leavePage=Number(target.dataset.leavePage)||1;render();return;}const employeeId=target.dataset.leaveEdit,type=target.dataset.leaveType,row=(__pr6LeaveRows()||[]).find(x=>x.employeeId===employeeId&&x.leaveType===type);openLeaveBalanceForm(row||{employeeId,leaveType:type});},true);
document.addEventListener('input',event=>{const el=event.target;if(el?.id!=='leaveSearch')return;const pos=el.selectionStart;state.leaveSearch=el.value;state.leavePage=1;render();const next=document.querySelector('#leaveSearch');next?.focus();if(pos!==null)next?.setSelectionRange(pos,pos);},true);
document.addEventListener('change',event=>{const el=event.target;if(el?.id==='leaveTypeFilter')state.leaveTypeFilter=el.value;else if(el?.id==='leaveDepartmentFilter')state.leaveDepartmentFilter=el.value;else if(el?.id==='leavePageSize')state.leavePageSize=Number(el.value)||10;else return;state.leavePage=1;render();},true);
function vaultPage(){
 const docs=documents.filter(d=>state.folder==='All documents'||d.folder===state.folder);
 const rows=docs.map(d=>`<tr data-document="${d.id}"><td><div class="access-user"><div class="list-icon">${icon('file')}</div><div><strong class="link">${d.name}</strong><div class="tiny muted">${d.id} - ${d.type}</div></div></div></td><td>${d.folder}</td><td>${badge(d.class)}</td><td>${d.owner}</td><td>${d.modified}</td><td>${d.versions}</td><td>${badge(d.status)}</td><td><button class="btn small" data-document="${d.id}">${icon('eye')}Preview</button></td></tr>`);
 return `<div class="page">${pageHead('Governed records management','Payroll and HR Document Vault','Store, classify, edit, preview, version, approve and securely distribute payroll, employee and compliance documents with retention controls.',button('Create document','create-document','', 'edit')+button('Upload files','upload-document','primary','upload'))}
 <div class="folder-grid" style="margin-bottom:14px">${folders.slice(0,8).map((f,i)=>`<div class="folder ${state.folder===f?'active':''}" data-folder="${f}"><div class="folder-top"><div class="folder-icon">${icon('folder')}</div><span>${i===0?documents.length:documents.filter(d=>d.folder===f).length} files</span></div><strong>${f}</strong><span>${i===0?'All governed records':'Retention and access policy applied'}</span></div>`).join('')}</div>
 ${tableCard(state.folder,'Editable and version-controlled records',['Document','Folder','Classification','Owner','Modified','Versions','Status',''],rows,`<div class="segmented"><button class="active">List</button><button>Recent</button><button>Needs review</button></div>`)}
 </div>`;
}
function reportsPage(){
 return `<div class="page">${pageHead('Compliance and management reporting','Compliance Report Studio','Generate filing-ready, audit-ready and management reports from governed payroll data. Preview, edit, approve and export every report with retained lineage.',button('Scheduled reports','scheduled-reports','', 'calendar')+button('Build custom report','custom-report','primary','plus'))}
 <div class="grid kpis">${kpi('Report templates','12','Statutory, control and management','report')}${kpi('Generated this month','28','Across June payroll workflows','file','cyan')}${kpi('Awaiting approval','4','Maker-checker review required','shield','amber')}${kpi('Scheduled deliveries','9','Secure recipients and channels','send','violet')}${kpi('Filing deadlines','4','Within the next 17 days','calendar','amber')}${kpi('Evidence completeness','\u2014','No completeness measure is recorded','audit','cyan')}</div>
 <div class="report-grid">${reportTemplates.map(r=>`<article class="report-card" data-report="${r.id}"><div class="report-icon">${icon('report')}</div><h4>${r.name}</h4><p>${r.desc}</p><footer><span>${r.category} - ${r.freq}</span><strong class="link">Generate ${icon('chev')}</strong></footer></article>`).join('')}</div>
 </div>`;
}
function auditPage(){
 const rows=auditEvents.map(a=>`<tr><td>${a[0]}</td><td><strong>${a[1]}</strong></td><td><span class="link">${a[2]}</span></td><td>${a[3]}</td><td>${a[4]}</td><td>${badge(a[5])}</td><td><button class="btn small" data-action="audit-evidence">Evidence</button></td></tr>`);
 return `<div class="page">${pageHead('Immutable governance history','Payroll Audit Trail','Search every sensitive view, change, approval, rule publication, calculation, report generation and release action with evidence hashes and source lineage.',button('Verify ledger hash','verify-audit','', 'shield')+button('Export audit evidence','export-audit','primary','download'))}
 <div class="grid kpis">${(()=>{const a=__pr6AuditStats();if(!a)return `${kpi('Events this period','4,812','Across all payroll workspaces','audit')}${kpi('Privileged events','42','Role and configuration changes','key','violet')}`;return kpi('Events recorded',String(a.total),'In the payroll audit trail','audit')+kpi('Approval events',String(a.approvals),'Submissions, approvals and rejections','key','violet')+kpi('Change events',String(a.changes),'Runs created, processed and released','eye')+kpi('Distinct actors',String(a.actors),'Users who acted on payroll','users','cyan')+kpi('Retention','7 years','Zimbabwe payroll evidence policy','calendar')})()}</div>
 ${tableCard('Immutable event ledger','Filter by actor, action, record, time, entity or severity',['Timestamp','Actor','Action','Record','Detail','Class',''],rows,`<button class="btn small" data-action="audit-filter">Advanced filters</button>`)}
 </div>`;
}
function accessPage(){
 const matrixRows=permissions.map(([p,label])=>`<tr><td><strong>${label}</strong><div class="tiny muted">${p}</div></td>${Object.keys(roles).map(role=>`<td><button class="perm-toggle ${(roles[role]||[]).includes(p)?'on':''} ${!can('rbac.manage')?'locked':''}" data-permission="${p}" data-role="${role}" title="${role}">${(roles[role]||[]).includes(p)?'&#10003;':''}</button></td>`).join('')}</tr>`);
 const users=userAccess.map(u=>`<tr><td><div class="access-user"><div class="mini-avatar">${u.initials}</div><div><strong>${u.name}</strong><div class="tiny muted">MFA identity verified</div></div></div></td><td>${u.role}</td><td>${u.scope}</td><td>${badge(u.mfa)}</td><td>${u.last}</td><td>${badge(u.status)}</td><td><button class="btn small" data-action="edit-access">Review</button></td></tr>`);
 return `<div class="page">${pageHead('Identity, authority and segregation','Roles and Access Control','Define least-privilege roles, data scopes, temporary access, maker-checker boundaries, sensitive-field masking, MFA and quarterly access certification.',button('Run access review','run-access-review','', 'audit')+button('Assign access','assign-access','primary','userplus'))}
 ${!can('rbac.manage')?`<div class="callout amber" style="margin-bottom:14px"><span class="kpi-icon amber">${icon('lock')}</span><div><strong>Read-only RBAC preview</strong><p>Your current ${state.role} role can view this demonstration but cannot change permissions or assignments.</p></div></div>`:''}
 <div class="grid kpis">${kpi('Active users','42','Across payroll and HR workspaces','users')}${kpi('Privileged users','6','Administrator or release authority','key','violet')}${kpi('MFA coverage','\u2014','MFA enrolment is not tracked for staff accounts','shield','cyan')}${kpi('SoD conflicts','2','Both are compensating-control cases','alert','amber')}${kpi('Temporary access','3','Expires within 30 days','clock','amber')}${kpi('Dormant accounts','0','90-day inactivity threshold','lock','cyan')}</div>
 <div class="grid two" style="margin-bottom:14px">
  ${tableCard('User access register','Identity, role, scope and certification status',['User','Role','Data scope','MFA','Last activity','Status',''],users)}
  ${card('Segregation-of-duties rules','Prevent incompatible payroll authority combinations',`<div class="card-body">${[['Prepare payroll vs approve payroll','Hard block','No user may prepare and independently approve the same run'],['Edit bank details vs release payments','Hard block','Bank master changes require separate verification and release'],['Edit statutory rules vs publish rules','Hard block','Rule author cannot publish their own version'],['Generate reports vs approve filings','Review','Filing approval requires a second person'],['HR employee changes vs payroll calculation','Monitor','Sensitive changes are included in the payroll review pack']].map((r,i)=>`<div class="sod-rule"><div class="rule-icon">${icon(i<3?'lock':'shield')}</div><div><strong>${r[0]}</strong><div class="tiny muted">${r[2]}</div></div>${badge(r[1])}</div>`).join('')}</div>`)}
 </div>
 ${card('Role permission matrix','Toggle access by role. Production changes require an approved access request and are fully audited.',`<div class="permission-grid"><table><thead><tr><th>Permission</th>${Object.keys(roles).map(r=>`<th>${r.replace(' / ',' /<br>')}</th>`).join('')}</tr></thead><tbody>${matrixRows.join('')}</tbody></table></div>`)}
 </div>`;
}
function settingsPage(){
 const eyebrow='Platform administration',title='Settings and Integrations',desc='Configure payroll bank payment files and review currency options available to this workspace.';
 if(!__pr6IsLive())return `<div class="page" aria-busy="true">${pageHead(eyebrow,title,desc)}<div class="grid three settings-summary" aria-hidden="true">${Array.from({length:3},()=>'<section class="card"><div class="card-body"><div class="skeleton-block" style="height:14px;width:42%"></div><div class="skeleton-block" style="height:28px;width:26%;margin-top:16px"></div><div class="skeleton-block" style="height:12px;width:62%;margin-top:10px"></div></div></section>').join('')}</div><section class="card settings-register"><div class="card-head"><div><h2>Bank payment file templates</h2><p>Loading configured payment file layouts…</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>TEMPLATE</th><th>BANK</th><th>DELIMITER</th><th>HEADER ROW</th><th>PAYMENT FILE COLUMNS</th><th>CREATED BY</th><th></th></tr></thead><tbody>${Array.from({length:6},()=>'<tr class="skeleton-row"><td colspan="7"><span class="skeleton-line"></span></td></tr>').join('')}</tbody></table></div></section></div>`;
 if(__pr6LoadFailed('bank-templates'))return __pr6PendingPanel(eyebrow,title,desc,'Bank payment templates could not be loaded from the Payroll API.',true);
 const ref=__pr6Ref(),templates=Array.isArray(ref.bankTemplates)?ref.bankTemplates:[],currencies=Array.isArray(ref.currencies)?ref.currencies:[];
 const canManage=__pr6Has('payroll.settings.manage')||(!__pr6IsLive()&&can('rbac.manage'));
 const search=String(state.settingsTemplateSearch||'').trim().toLowerCase();
 const filtered=templates.filter(t=>[t.name,t.bankName].some(v=>String(v||'').toLowerCase().includes(search))).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
 const size=[10,20,50].includes(Number(state.settingsPageSize))?Number(state.settingsPageSize):10;
 const pages=Math.max(1,Math.ceil(filtered.length/size));state.settingsPage=Math.min(Math.max(1,Number(state.settingsPage)||1),pages);
 const start=(state.settingsPage-1)*size,shown=filtered.slice(start,start+size);
 const columns=(t)=>{try{const value=typeof t.columnOrder==='string'?JSON.parse(t.columnOrder):t.columnOrder;return Array.isArray(value)?value.join(' · '):'—'}catch{return'—'}};
 const manageActions=(t)=>canManage?'<button class="btn small" type="button" data-action="edit-bank-template" data-template-id="'+__pr6Esc(t.id)+'">Edit</button> <button class="btn small" type="button" data-action="delete-bank-template" data-template-id="'+__pr6Esc(t.id)+'">Delete</button>':'';
 const rows=shown.map(t=>'<tr><td><strong>'+__pr6Esc(t.name||'—')+'</strong></td><td>'+__pr6Esc(t.bankName||'—')+'</td><td>'+__pr6Esc(t.delimiter==='\t'?'Tab':t.delimiter||'Comma')+'</td><td>'+ (t.hasHeader?'Yes':'No')+'</td><td class="settings-template-columns">'+__pr6Esc(columns(t))+'</td><td>'+__pr6Esc([t.createdBy?.firstName,t.createdBy?.lastName].filter(Boolean).join(' ')||'—')+'</td><td>'+manageActions(t)+'</td></tr>');
 const exportIcons='<span class="export-icon-group" role="group" aria-label="Export bank file templates"><button class="icon-btn" type="button" data-settings-export="pdf" title="Export PDF" aria-label="Export templates as PDF">'+icon('file')+'</button><button class="icon-btn" type="button" data-settings-export="excel" title="Export Excel" aria-label="Export templates as Excel">'+icon('report')+'</button><button class="icon-btn" type="button" data-settings-export="csv" title="Export CSV" aria-label="Export templates as CSV">'+icon('download')+'</button></span>';
 const add=canManage?button('Add bank file template','new-bank-template','primary','plus'):'';
 const currencyRows=currencies.map(c=>'<span class="settings-currency-chip">'+__pr6Esc(c.code||c.currencyCode||c.name||'Currency')+'</span>').join('')||'<span class="muted">No currency options were returned for this account.</span>';
 const range=filtered.length?`${start+1}–${Math.min(start+size,filtered.length)} of ${filtered.length}`:'0 records';
 return `<div class="page">${pageHead(eyebrow,title,desc,add+`<button class="btn small" type="button" data-settings-refresh>Refresh</button>`)}
 <div class="grid three settings-summary">${kpi('Bank file templates',String(templates.length),'Available for payroll payment file generation','bank')}${kpi('Payroll currencies',String(currencies.length),'Options returned by the central currency API','gl','cyan')}${kpi('Template permissions',canManage?'Manage':'View only',canManage?'You can maintain payment file layouts.':'Your role can view configured layouts.','shield','violet')}</div>
 <section class="card settings-register"><div class="card-head"><div><h2>Bank payment file templates</h2><p>These templates define the bank-specific files generated from approved payroll runs.</p></div>${exportIcons}</div>
 <form class="settings-toolbar" data-settings-search><label for="settingsTemplateSearch">Search templates</label><input id="settingsTemplateSearch" type="search" value="${__pr6Esc(state.settingsTemplateSearch||'')}" placeholder="Template or bank name"><button class="btn small" type="submit">Search</button><span class="settings-result-count">${range}</span></form>
 <div class="table-wrap"><table class="data-table"><thead><tr><th>TEMPLATE</th><th>BANK</th><th>DELIMITER</th><th>HEADER ROW</th><th>PAYMENT FILE COLUMNS</th><th>CREATED BY</th><th></th></tr></thead><tbody>${rows.join('')||`<tr><td colspan="7" class="empty-cell">${templates.length?'No templates match your search.':'No bank payment templates are configured yet.'}</td></tr>`}</tbody></table></div>
 <div class="settings-pagination"><span>${range}</span><div><label>Rows <select id="settingsPageSize"><option${size===10?' selected':''}>10</option><option${size===20?' selected':''}>20</option><option${size===50?' selected':''}>50</option></select></label><button class="btn small" type="button" data-settings-page="${Math.max(1,state.settingsPage-1)}"${state.settingsPage<=1?' disabled':''}>Previous</button><span>Page ${state.settingsPage} of ${pages}</span><button class="btn small" type="button" data-settings-page="${Math.min(pages,state.settingsPage+1)}"${state.settingsPage>=pages?' disabled':''}>Next</button></div></div></section>
 <section class="card settings-currencies"><div class="card-head"><div><h2>Currency options</h2><p>Live currencies available to payroll configuration from the central currency service.</p></div></div><div class="card-body settings-currency-list">${currencyRows}</div></section>
 </div>`;
}
function __pr6SettingsFilteredTemplates(){
 const rows=Array.isArray(__pr6Ref().bankTemplates)?__pr6Ref().bankTemplates:[],q=String(state.settingsTemplateSearch||'').trim().toLowerCase();
 return rows.filter(t=>[t.name,t.bankName].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
}
async function __pr6ExportSettings(kind){
 const exporter=window.__PAYROLL_V6_EXPORT_SETTINGS__,rows=__pr6SettingsFilteredTemplates();
 if(typeof exporter!=='function'){toast('Export unavailable','The Payroll export service is not ready.','warn');return;}
 const columnsOf=t=>{try{const v=typeof t.columnOrder==='string'?JSON.parse(t.columnOrder):t.columnOrder;return Array.isArray(v)?v.join(', '):''}catch{return''}};
 const data=rows.map(t=>[t.name||'',t.bankName||'',t.delimiter==='\t'?'Tab':t.delimiter||'Comma',t.hasHeader?'Yes':'No',columnsOf(t),[t.createdBy?.firstName,t.createdBy?.lastName].filter(Boolean).join(' ')||'']);
 try{await exporter(kind,{title:'Payroll Bank Payment File Templates',subtitle:'Configured output layouts used to generate payment files from payroll runs.',columns:['Template','Bank','Delimiter','Header row','Payment file columns','Created by'],rows:data,filename:'payroll-bank-file-templates',landscape:true,meta:[['Templates',String(data.length)],['Search',state.settingsTemplateSearch||'All templates']],note:'Confidential Payroll configuration. Database identifiers are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'});}
 catch(error){toast('Settings export failed',error?.message||String(error),'warn');}
}
document.addEventListener('click',event=>{
 const exp=event.target?.closest?.('[data-settings-export]');if(exp){event.preventDefault();event.stopImmediatePropagation();void __pr6ExportSettings(exp.dataset.settingsExport);return;}
 const pg=event.target?.closest?.('[data-settings-page]');if(pg){event.preventDefault();event.stopImmediatePropagation();state.settingsPage=Number(pg.dataset.settingsPage)||1;render();return;}
 const refresh=event.target?.closest?.('[data-settings-refresh]');if(refresh){event.preventDefault();event.stopImmediatePropagation();window.dispatchEvent(new CustomEvent('payroll-v6:reload-request'));}
},true);
document.addEventListener('submit',event=>{if(!event.target?.matches?.('[data-settings-search]'))return;event.preventDefault();state.settingsTemplateSearch=document.querySelector('#settingsTemplateSearch')?.value?.trim()||'';state.settingsPage=1;render();},true);
document.addEventListener('change',event=>{if(event.target?.id==='settingsPageSize'){state.settingsPageSize=Number(event.target.value)||10;state.settingsPage=1;render();}},true);
function myPayPage(){
 const __mp=__pr6MyPayView();
 // (employees[0]||__pr6EmployeePlaceholder) is the first person in the roster, not the signed-in user.
 const e=__mp?{leave:(__mp.annualLeave===null?'\u2014':__mp.annualLeave+' days'),bank:__mp.self.bank,tax:__mp.self.tax,nssa:__mp.self.nssa,currency:__mp.self.currency,id:__mp.self.employeeNumber,title:__mp.self.position||'\u2014',department:__mp.self.department,branch:'\u2014',type:__mp.self.employmentType||'\u2014',start:__mp.self.start}:(employees[0]||__pr6EmployeePlaceholder);
 const ownCerts=(__pr6Ref().certifications||[]).filter(c=>c.employeeId&&c.employeeId===__pr6Live.mypay?.employee?.id);
 return `<div class="page">${pageHead('Employee self-service','My Pay','Secure employee access to payslips, tax summaries, bank details, leave, employment records, training and personal documents.',button('Update bank details','ess-bank-change','', 'bank')+(()=>{const slip=__pr6CurrentPayslip(__mp?.slips);if(!slip)return `<button class="btn primary" disabled title="No payslip has been issued for the current or a previous period">${icon('download')}No payslip available</button>`;const period=slip.period||slip.periodLabel||'latest';return `<button class="btn primary" data-action="download-payslip" data-payslip-id="${__pr6Esc(slip.id)}" data-period="${__pr6Esc(period)}" data-employee-name="${__pr6Esc(__mp?.self.name||__mp?.self.employeeNumber||'Employee')}">${icon('download')}Download ${__pr6Esc(period)} payslip</button>`})())}
 <div class="panel-band"><div class="eyebrow" style="color:#7eb6ff">${__mp&&__mp.latest?String(__mp.latest.period).toUpperCase()+' NET PAY':'NET PAY'}</div><h2>${__mp?(__mp.hasPayslip?money(__mp.latest.net):'No payslip yet'):money(1629.14)}</h2><p>${__mp?(__mp.hasPayslip?'Pay period '+__mp.latest.period:'No payroll run has been processed for you yet.'):'Payment date: 30 June 2026'}</p><div class="band-stats"><div class="band-stat"><span>Gross earnings</span><strong>${__mp?(__mp.hasPayslip?money(__mp.latest.gross):'\u2014'):money(2250)}</strong></div><div class="band-stat"><span>Total deductions</span><strong>${__mp?(__mp.hasPayslip?money(__mp.latest.deductions):'\u2014'):money(620.86)}</strong></div><div class="band-stat"><span>Payslips on record</span><strong>${__mp?__mp.slips.length:3}</strong></div><div class="band-stat"><span>Leave available</span><strong>${e.leave}</strong></div></div></div>
 <div class="grid three">
  ${card('Recent payslips','Select to preview and download an issued payslip',`<div class="card-body"><div class="fact"><span>Personal payslips</span><strong>${__mp?.slips.length||0}</strong></div><div class="fact" style="margin-top:10px"><span>Current or latest eligible period</span><strong>${__pr6Esc(__mp?.latest?.period||'No payslip issued')}</strong></div></div>`)}
  ${card('Earnings and deductions',__mp?.latest?'Pay breakdown for '+__pr6Esc(__mp.latest.period):'No pay period available',`<div class="card-body">${(__mp?.breakdown.length?__mp.breakdown:[['No pay breakdown available','\u2014']]).map(x=>`<div class="list-row"><div class="list-main"><strong>${__pr6Esc(x[0])}</strong></div><strong>${__pr6Esc(x[1])}</strong></div>`).join('')}</div>`)}
  ${card('Bank and tax details','Select to review your protected personal details',`<div class="card-body"><div class="fact"><span>Bank account</span><strong>${__pr6Esc(e.bank||'Not recorded')}</strong></div><div class="fact" style="margin-top:10px"><span>Payment currency</span><strong>${__pr6Esc(e.currency||'—')}</strong></div><button class="btn soft" style="margin-top:12px" data-action="ess-bank-change">Request bank detail change</button></div>`)}
  ${card('Leave balance','Select to review your current leave balances',`<div class="card-body"><div class="readiness-ring" style="--pct:${__mp&&__mp.annualLeave!==null?Math.min(100,Math.round((__mp.annualLeave/25)*100)):0}%;margin:0 auto 15px"><strong>${__mp?(__mp.annualLeave===null?'\u2014':__mp.annualLeave):'\u2014'}</strong></div><div class="muted">${__mp?.balances.length||0} leave balances on record</div><button class="btn soft" style="margin-top:12px" data-action="request-leave">Request leave</button></div>`)}
  ${card('Employment record','Select to review your governed employment details',`<div class="card-body"><div class="fact"><span>Employee number</span><strong>${__pr6Esc(e.id||'—')}</strong></div><div class="fact" style="margin-top:10px"><span>Department</span><strong>${__pr6Esc(e.department||'—')}</strong></div></div>`)}
  ${card('Training and certificates','Select to review your assigned courses and certificates',`<div class="card-body"><div class="fact"><span>Certificates recorded</span><strong>${ownCerts.length}</strong></div><div class="fact" style="margin-top:10px"><span>Training records</span><strong>${ownCerts.length?'Available':'None recorded'}</strong></div></div>`)}
 </div></div>`;
}
function myPayPanelRows(panel,m){const s=m.self||{};if(panel==='Recent payslips')return m.slips.map(p=>['Pay period '+p.period,(p.currency||'USD')+' '+Number(p.net||0).toFixed(2)]);if(panel==='Earnings and deductions')return m.breakdown;if(panel==='Bank and tax details')return [['Bank account',s.bank],['Taxpayer reference',s.tax],['NSSA number',s.nssa],['Payment currency',s.currency],['Last payment date',m.latest?.payDate?String(m.latest.payDate).slice(0,10):'—']];if(panel==='Leave balance')return m.balances.map(b=>[String(b.leaveType||'Leave'),Number(b.balance)+' days']);if(panel==='Employment record')return [['Employee number',s.employeeNumber],['Name',s.name],['Position',s.position],['Department',s.department],['Employment type',s.employmentType],['Start date',s.start]];return (__pr6Ref().certifications||[]).filter(c=>c.employeeId&&c.employeeId===__pr6Live.mypay?.employee?.id).map(c=>[c.courseTitle||c.code||'Course',(c.status||'Recorded')+(c.expiresAt?' · Expires '+String(c.expiresAt).slice(0,10):''),c.expiresAt?String(c.expiresAt).slice(0,10):'—']);}
function exportMyPayPanel(panel,kind){const m=__pr6MyPayView();if(!m)return;const rows=myPayPanelRows(panel,m);const fn=window.__PAYROLL_V6_EXPORT_MYPAY__;if(typeof fn==='function')void fn(kind,{title:panel,subtitle:'Personal payroll record',filename:'my-pay-'+panel.toLowerCase().replace(/[^a-z0-9]+/g,'-'),letterhead:'nvccz-payroll',columns:['Item','Details'],rows,note:'Confidential employee record.'});}
function openMyPayPanel(panel){const m=__pr6MyPayView();if(!m)return;const rows=myPayPanelRows(panel,m);let body='';if(panel==='Recent payslips'){body=m.slips.length?`<div class="list">${m.slips.map(p=>`<div class="list-row"><div class="list-icon">${icon('file')}</div><div class="list-main"><strong>${__pr6Esc(p.period)}</strong><span>${__pr6Esc(p.currency||'USD')} ${__pr6Esc(Number(p.net||0).toFixed(2))} net pay</span></div><button type="button" class="btn small" data-mypay-preview-slip="${__pr6Esc(p.id)}" data-period="${__pr6Esc(p.period)}">Preview</button><button type="button" class="btn small" data-action="download-payslip" data-payslip-id="${__pr6Esc(p.id)}" data-period="${__pr6Esc(p.period)}" data-employee-name="${__pr6Esc(m.self.name||m.self.employeeNumber||'Employee')}">${icon('download')}Download PDF</button></div>`).join('')}</div>`:'<p class="muted">No payslips have been issued to you.</p>';}else{body=rows.length?`<div class="list">${rows.map(([label,value])=>`<div class="list-row"><div class="list-main"><strong>${__pr6Esc(label)}</strong></div><span>${__pr6Esc(value??'—')}</span></div>`).join('')}</div>`:'<p class="muted">No records are available.</p>';if(panel==='Bank and tax details')body+=`<div style="margin-top:14px"><button class="btn soft" data-action="ess-bank-change">Request bank detail change</button></div>`;if(panel==='Leave balance')body+=`<div style="margin-top:14px"><button class="btn soft" data-action="request-leave">Request leave</button></div>`;}
 const title=panel==='Recent payslips'?'Your payslips':panel;const footer=panel==='Recent payslips'?button('Close','close-drawer'):`<button type="button" class="btn primary" data-mypay-export="pdf" data-mypay-panel="${__pr6Esc(panel)}">${icon('download')}Download PDF</button>${button('Close','close-drawer')}`;openDrawer(title,'Personal records for '+(m.latest?.period||'your account'),body,footer);}
document.addEventListener('click',event=>{const preview=event.target?.closest?.('[data-mypay-preview-slip]');if(preview){event.preventDefault();event.stopImmediatePropagation();const id=preview.dataset.mypayPreviewSlip,period=preview.dataset.period||'Payslip',m=__pr6MyPayView(),slip=m?.slips.find(row=>String(row.id)===String(id));if(!slip){toast('Payslip unavailable','This payslip is no longer in your personal records. Refresh the page and try again.','warn');return;}const ccy=__pr6Esc(slip.currency||'USD'),amount=value=>`${ccy} ${Number(value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;const previewBody=`<article class="mypay-slip-preview" aria-label="Branded payslip preview"><header class="mypay-slip-letterhead"><img src="/nvccz-letterhead-header-2026.png" alt="National Venture Capital Company of Zimbabwe letterhead"><div><strong>PAYSLIP</strong><span>${__pr6Esc(period)}</span></div></header><section class="mypay-slip-employee"><h3>Employee details</h3><div><span>Employee name</span><strong>${__pr6Esc(m.self.name||'Employee')}</strong></div><div><span>Employee number</span><strong>${__pr6Esc(m.self.employeeNumber||slip.employeeNumber||'—')}</strong></div><div><span>Department</span><strong>${__pr6Esc(m.self.department||'—')}</strong></div><div><span>Payment date</span><strong>${__pr6Esc(slip.payDate?String(slip.payDate).slice(0,10):'—')}</strong></div></section><section class="mypay-slip-summary"><div><span>Gross earnings</span><strong>${amount(slip.gross)}</strong></div><div><span>Total deductions</span><strong>${amount(slip.deductions)}</strong></div><div class="net"><span>Net pay</span><strong>${amount(slip.net)}</strong></div></section><footer class="mypay-slip-footer">National Venture Capital Company of Zimbabwe · Payroll · Confidential</footer></article>`;openDrawer('Payslip preview',__pr6Esc(period)+' · Confidential',previewBody,`<button type="button" class="btn primary" data-action="download-payslip" data-payslip-id="${__pr6Esc(slip.id)}" data-period="${__pr6Esc(slip.period)}" data-employee-name="${__pr6Esc(m.self.name||m.self.employeeNumber||'Employee')}">${icon('download')}Download PDF</button>${button('Close','close-drawer')}`);return;}
 const exporter=event.target?.closest?.('[data-mypay-export]');if(exporter){event.preventDefault();event.stopImmediatePropagation();exportMyPayPanel(exporter.dataset.mypayPanel,exporter.dataset.mypayExport||'pdf');return;}
 const panelCard=event.target?.closest?.('[data-mypay-panel-card]');if(!panelCard||event.target?.closest?.('button,a,input,select,textarea'))return;event.preventDefault();openMyPayPanel(panelCard.dataset.mypayPanelCard);},true);
document.addEventListener('keydown',event=>{const panelCard=event.target?.closest?.('[data-mypay-panel-card]');if(panelCard&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openMyPayPanel(panelCard.dataset.mypayPanelCard);}},true);
// Live Payroll Runs register: all cards, filters, tabs, pagination and exports
// derive from the hydrated API records. Keep this screen isolated from sample
// payroll fixtures used by other legacy views.
state.runsTab=state.runsTab||'All Runs';state.runsPage=state.runsPage||1;state.runsPageSize=10;
state.runsCurrency=state.runsCurrency||'All currencies';state.runsFrom=state.runsFrom||'';state.runsTo=state.runsTo||'';state.runsCompare=state.runsCompare||false;
function runCurrencyCodeV4(r){return String(r?.currency||r?.currencyCode||'USD').toUpperCase()}
function runReferenceV4(r){const p=String(r?.reference||r?.startDate||'').slice(0,7).replace('-',''),g=String(r?.group||'').toUpperCase();const suffix=g.includes('EXEC')?'EXE':g.includes('CONTRACT')?'CTR':'MST';return `PAY-${p}-${suffix}`}
function runDeductionForCurrencyV4(r,code){const native=r?.currencyComponents?.[code]?.deductions;if(native!=null)return Number(native)||0;if(r?.currencyComponents)return 0;return runCurrencyCodeV4(r)===code?Number(r?.deductions)||0:0}
function filteredRunsV4(){
 const rows=Array.isArray(payrollRuns)?payrollRuns:[];
 return rows.filter(r=>{
  const raw=String(r.rawStatus||'').toUpperCase(),released=raw==='COMPLETED'||raw==='RELEASED';if(state.runsTab==='Open'&&['CANCELLED','CANCELED'].includes(raw))return false;
  if(state.runsTab==='Open'&&released)return false;if(state.runsTab==='Released'&&!released)return false;
  const day=String(r.startDate||'').slice(0,10);if(state.runsFrom&&day<state.runsFrom)return false;if(state.runsTo&&day>state.runsTo)return false;
  if(state.runsCurrency==='USD'&&!(Number(r.grossUSD)||0))return false;
  if(state.runsCurrency==='ZiG'&&!(Number(r.grossZiG)||0))return false;
  return true;
 }).sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||'')));
}
function runExportV4(kind){
 const all=filteredRunsV4(), rows=all.map(r=>[r.reference||String(r.startDate||'').slice(0,7),r.group||'—',r.employees??'—',runCurrencyCodeV4(r),Number(r.grossUSD)||0,runDeductionForCurrencyV4(r,'USD'),Number(r.grossZiG)||0,runDeductionForCurrencyV4(r,'ZIG'),r.variance==null?'—':`${r.variance}%`,r.status||'—',r.owner||'—']);
 const fn=window.__PAYROLL_V6_EXPORT_RUNS__;if(typeof fn!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return}
 void fn(kind,{title:'Payroll Runs',subtitle:'Payroll register exported from live payroll run records.',columns:['Pay period','Pay group','Employees','Currency','Gross USD','Deductions USD','Gross ZiG','Deductions ZiG','Variance','Status','Prepared by'],rows,filename:'payroll-runs',landscape:true,meta:[['Status tab',state.runsTab],['Currency filter',state.runsCurrency],['Date range',`${state.runsFrom||'All dates'} to ${state.runsTo||'Latest'}`],['Matching payroll runs',String(all.length)]],note:'Only payroll runs matching the selected tab and filters are included. Amounts are read from payroll run records.'});
}
function runComparisonV4(rows){
 const periods=[...new Set(rows.map(r=>String(r.startDate||'').slice(0,7)).filter(Boolean))].sort().reverse();if(periods.length<2)return `<div class="callout blue" style="margin-top:12px">At least two payroll periods are needed to compare movements.</div>`;
 const sum=(period,field)=>rows.filter(r=>String(r.startDate||'').slice(0,7)===period).reduce((n,r)=>n+(Number(r[field])||0),0), current=periods[0], prior=periods[1];
 const definitions=[['Runs','count'],['Employees','employees'],['Gross USD','grossUSD'],['Gross ZiG','grossZiG']];let body='';
 for(let i=0;i<definitions.length;i++){
  const label=definitions[i][0];const field=definitions[i][1];let a=0;let b=0;
  if(field==='count'){a=rows.filter(r=>String(r.startDate||'').slice(0,7)===current).length;b=rows.filter(r=>String(r.startDate||'').slice(0,7)===prior).length}else{a=sum(current,field);b=sum(prior,field)}
  let av=String(a);let bv=String(b);if(field.indexOf('gross')===0){av=money(a,field==='grossZiG'?'ZiG':'USD');bv=money(b,field==='grossZiG'?'ZiG':'USD')}
  let change='—';if(b!==0)change=(((a-b)/b)*100).toFixed(1)+'%';
  body+='<tr><td>'+label+'</td><td>'+av+'</td><td>'+bv+'</td><td>'+change+'</td></tr>'
 }
 return '<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Measure</th><th>'+current+'</th><th>'+prior+'</th><th>Change</th></tr></thead><tbody>'+body+'</tbody></table></div>';
}
function approvalReviewModelV5(){
 if(!__pr6IsLive())return null;
 const all=Array.isArray(payrollRuns)?payrollRuns:[];
 const pending=all.filter(r=>String(r.rawStatus||'').toUpperCase()==='PENDING_APPROVAL');
 let current=all.find(r=>r.id===state.approvalRunId)||pending[0]||all[0]||null;
 if(current)state.approvalRunId=current.id;
 const prior=current?all.find(r=>r.id!==current.id&&String(r.reference||r.period||'')!==String(current.reference||current.period||''))||all.find(r=>r.id!==current.id)||null:null;
 const detail=state.approvalDetailRunId===current?.id?state.approvalDetail:null;
 const lines=Array.isArray(detail?.employeePayrolls)?detail.employeePayrolls:[];
 const name=x=>[x?.employee?.user?.firstName,x?.employee?.user?.lastName].filter(Boolean).join(' ')||x?.employee?.employeeNumber||'Employee';
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const currencyValue=(r,key)=>num(r?.currencyComponents?.[key]?.gross ?? r?.currencyComponents?.[key] ?? (key==='USD'?r?.grossUSD:r?.grossZiG));
 const measures=[
  ['Employee count',r=>r?.employees==null?null:num(r.employees),v=>v==null?'—':String(v)],
  ['Gross payroll (USD)',r=>r?currencyValue(r,'USD'):null,v=>v==null?'—':money(v,'USD')],
  ['Gross payroll (ZiG)',r=>r?currencyValue(r,'ZiG'):null,v=>v==null?'—':money(v,'ZiG')],
  ['Deductions',r=>r?num(r.deductions):null,v=>v==null?'—':money(v,'USD')],
  ['Net pay',r=>r?num(r.netUSD):null,v=>v==null?'—':money(v,'USD')]
 ];
 const compareRows=measures.map(([label,get,fmt])=>{const a=get(current),b=get(prior);let variance='—';if(a!=null&&b!=null){if(b===0)variance=a===0?'0.0%':'New';else{const d=((a-b)/Math.abs(b))*100;variance=`${d>0?'+':''}${d.toFixed(1)}%`}}return [label,fmt(b),fmt(a),variance,'From payroll API']});
 return {all,pending,current,prior,detail,lines,name,compareRows,measures,hasPending:!!current&&String(current.rawStatus||'').toUpperCase()==='PENDING_APPROVAL'};
}
function approvalExportButtonsV5(){return `<div class="export-icon-group" role="group" aria-label="Export approval review"><button class="icon-btn" type="button" title="Export PDF" aria-label="Export PDF" data-approval-export="pdf">${icon('file')}</button><button class="icon-btn" type="button" title="Export Excel" aria-label="Export Excel" data-approval-export="excel">${icon('report')}</button><button class="icon-btn" type="button" title="Export CSV" aria-label="Export CSV" data-approval-export="csv">${icon('download')}</button></div>`}
function approvalExportV5(kind){const m=approvalReviewModelV5();if(!m){toast('Export unavailable','Payroll review data is still loading.','warn');return}const r=m.current,period=r?.reference||r?.period||'No payroll run',num=x=>Number.isFinite(Number(x))?Number(x):0;const columns=['Measure','Previous period','Current period','Variance','Review'];const rows=m.compareRows.map(x=>x.slice());const checklist=[['Payroll run status',r?.status||'No run',r?'From payroll API':'No payroll run'],['Submitted for approval',m.hasPending?'Yes':'No',m.hasPending?'Pending approval':'No pending decision'],['Employee calculations',m.lines.length?String(m.lines.length):'None recorded',m.detail?'From payroll detail API':'Detail not loaded']];rows.push(...checklist.map(x=>['Control: '+x[0],x[2],x[1],'—','API record']));if(m.lines.length){rows.push(...m.lines.slice(0,50).map(x=>['Employee: '+m.name(x),'—',money(num(x.grossPay))+' gross; '+money(num(x.netPay))+' net','—','Payroll calculation']))}const exporter=window.__PAYROLL_V6_EXPORT_APPROVAL__;if(typeof exporter!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return}void exporter(kind,{title:'Payroll Approval Review',subtitle:'Approval review generated from live payroll run and calculation records.',columns,rows,filename:'payroll-approval-review',landscape:true,meta:[['Pay period',period],['Run reference',runReferenceV4(r||{})],['Status',r?.status||'No run'],['Prepared by',r?.owner||'Not recorded'],['Awaiting approval',m.hasPending?'Yes':'No']],note:'Confidential payroll information. Database identifiers are excluded. Amounts and review statuses are read from payroll APIs. Local and development exports use Matanho branding; production exports use NVCCZ branding.'})}
function approvalDecisionModal(){if(!can('payroll.approve'))return deny('payroll.approve');const m=approvalReviewModelV5(),r=m?(m.hasPending?m.current:m.pending[0]):null;if(!r){toast('No decision available','No payroll run is awaiting approval.','warn');return}state.approvalRunId=r.id;openModal('Record payroll approval decision',`Review ${r.reference||r.period||'payroll run'} using the current API record.`, `<div class="form-grid"><div class="form-field full"><label>Payroll run</label><input value="${__pr6Esc((r.reference||r.period||'Payroll run')+' · '+(r.status||'Pending approval'))}" disabled></div><div class="form-field full"><label for="decisionType">Decision</label><select id="decisionType"><option>Return for correction</option><option>Approve</option></select></div><div class="form-field full"><label for="decisionBasis">Decision basis <b class="required-mark">Required when returning</b></label><textarea id="decisionBasis" placeholder="Record the evidence and reason for your decision..."></textarea></div><div class="form-field full"><div class="callout blue"><span class="kpi-icon">${icon('shield')}</span><div><strong>Approval controls are enforced by the payroll API</strong><p>The API verifies reviewer permission, run status and maker-checker separation when the decision is submitted.</p></div></div></div></div>`,`${button('Cancel','close-modal')}<button class="btn primary" data-action="record-decision" data-run-id="${__pr6Esc(r.id)}">${icon('shield')}Record decision</button>`,true)}
approvalsPage=function(){
 const m=approvalReviewModelV5();
 if(!m)return `<div class="page">${pageHead('Governed review','Maker-Checker Payroll Approval Review','Loading current payroll approval records…',approvalExportButtonsV5())}<div class="panel-band"><div class="skeleton-block" style="height:22px;width:45%"></div><div class="band-stats">${Array.from({length:3},()=>'<div class="band-stat"><div class="skeleton-block" style="height:12px;width:40%"></div><div class="skeleton-block" style="height:18px;width:65%;margin-top:10px"></div></div>').join('')}</div></div><div class="grid two"><div class="card"><div class="card-body">${Array.from({length:5},()=>'<div class="skeleton-block" style="height:34px;margin:8px 0"></div>').join('')}</div></div><div class="card"><div class="card-body">${Array.from({length:5},()=>'<div class="skeleton-block" style="height:34px;margin:8px 0"></div>').join('')}</div></div></div></div>`;
 const r=m.current,p=m.prior,runRows=m.all.map(x=>`<option value="${__pr6Esc(x.id)}" ${x.id===r?.id?'selected':''}>${__pr6Esc((x.reference||x.period||'Payroll run')+' · '+(x.status||x.rawStatus||'Unknown'))}</option>`).join('');
 if(r&&state.approvalDetailRunId!==r.id&&state.approvalDetailLoading!==r.id&&!state.approvalDetailErrorFor){const fetchRun=window.__PAYROLL_V6_GET_RUN__;if(typeof fetchRun==='function'){state.approvalDetailLoading=r.id;Promise.resolve(fetchRun(r.id)).then(raw=>{state.approvalDetail=raw?.data||raw||null;state.approvalDetailRunId=r.id;state.approvalDetailLoading=null;if(state.page==='approvals'&&approvalReviewModelV5()?.current?.id===r.id)render()}).catch(err=>{state.approvalDetailError=err?.message||'Payroll run detail could not be loaded.';state.approvalDetailErrorFor=r.id;state.approvalDetailRunId=r.id;state.approvalDetailLoading=null;if(state.page==='approvals')render()})}}
 const heading=r?String(r.rawStatus||'').toUpperCase()==='PENDING_APPROVAL'?'Awaiting independent approval':r.status||r.rawStatus||'Payroll run':'No payroll runs on record';
 const noRows=(n,msg)=>`<tr><td colspan="${n}" class="tiny muted">${msg}</td></tr>`;
 const compare=m.compareRows.map(x=>`<tr><td><strong>${__pr6Esc(x[0])}</strong></td><td>${__pr6Esc(x[1])}</td><td>${__pr6Esc(x[2])}</td><td>${__pr6Esc(x[3])}</td><td>${badge(x[4])}</td></tr>`).join('')||noRows(5,'No payroll totals are available for comparison.');
 const samples=m.lines.slice(0,50).map(x=>`<tr><td>${__pr6Esc(m.name(x))}</td><td>Payroll calculation record</td><td>${money(Number(x.grossPay)||0)}</td><td>${money(Number(x.netPay)||0)}</td><td>${__pr6Esc(x.status||'Recorded by API')}</td></tr>`).join('');
 const checklist=[['Run submitted for approval',m.hasPending?'Complete':r?'Not submitted':'Unavailable',m.hasPending?'blue':'amber'],['Payroll run status',r?.status||r?.rawStatus||'No run',r?'blue':'amber'],['Employee calculations',state.approvalDetailErrorFor===r?.id?'Unavailable':m.lines.length?`${m.lines.length} recorded`:state.approvalDetailLoading===r?.id?'Loading':'No calculation lines',m.lines.length?'blue':'amber'],['Approval authorization','Enforced by payroll API','blue']];
 const list=checklist.map(x=>`<div class="list-row"><div class="list-icon ${x[2]}">${icon(x[2]==='blue'?'check':'alert')}</div><div class="list-main"><strong>${__pr6Esc(x[0])}</strong><span>${__pr6Esc(x[1])}</span></div></div>`).join('');
 const decision=r&&m.hasPending?`<div class="callout blue"><span class="kpi-icon">${icon('shield')}</span><div><strong>This run is awaiting a checker decision</strong><p>Submit a decision to the payroll API. Permission and maker-checker rules are evaluated there.</p></div></div><div class="actions" style="margin-top:12px"><button class="btn primary" data-action="approval-decision">${icon('shield')}Review decision</button><button class="btn" data-action="approve-payroll" data-run-id="${__pr6Esc(r.id)}">Approve</button><button class="btn danger" data-action="reject-payroll" data-run-id="${__pr6Esc(r.id)}">Return for correction</button></div>`:`<div class="callout blue"><span class="kpi-icon">${icon('info')}</span><div><strong>${r?'No run is awaiting a decision':'No payroll run is available'}</strong><p>The review is read-only until a run has been submitted for approval.</p></div></div>`;
 return `<div class="page">${pageHead('Governed review','Maker-Checker Payroll Approval Review','Review payroll totals, recorded employee calculations and current approval status.',`${approvalExportButtonsV5()}<button class="btn primary" data-action="approval-decision" ${m.hasPending?'':'disabled'}>${icon('shield')}Submit decision</button>`)}
 <div class="panel-band"><div class="eyebrow" style="color:#b9d7ff">${__pr6Esc(r?(r.reference||r.period||'Payroll run')+' · '+(r.group||''):'PAYROLL APPROVAL REVIEW')}</div><h2>${__pr6Esc(heading)}</h2><p>${m.hasPending?'A checker decision is available for this run. The payroll API enforces access and segregation controls.':'No approval decision is currently available. Review data shown below comes from the payroll API.'}</p><div class="band-stats"><div class="band-stat"><span>Prepared by</span><strong>${__pr6Esc(r?.owner||'Not recorded')}</strong></div><div class="band-stat"><span>Gross payroll (USD)</span><strong>${r?money(Number(r.grossUSD)||0):'—'}</strong></div><div class="band-stat"><span>Approval queue</span><strong>${m.pending.length}</strong></div></div></div>
 ${m.all.length>1?card('Payroll run','Select the run to inspect',`<div class="card-body"><div class="form-field"><label for="approvalRunSelect">Run</label><select id="approvalRunSelect">${runRows}</select></div></div>`):''}
 <div class="grid two"><div class="stack">${card('Payroll summary — previous vs current','Amounts and employee counts from payroll run records',`<div class="table-wrap"><table><thead><tr><th>Measure</th><th>${__pr6Esc(p?.reference||p?.period||'Previous period')}</th><th>${__pr6Esc(r?.reference||r?.period||'Current period')}</th><th>Variance</th><th>Source</th></tr></thead><tbody>${compare}</tbody></table></div>`)}${card('Employee payroll calculations','Recorded calculation lines loaded from the selected run API',`<div class="table-wrap"><table><thead><tr><th>Employee</th><th>Source</th><th>Gross</th><th>Net</th><th>Status</th></tr></thead><tbody>${samples||noRows(5,state.approvalDetailErrorFor===r?.id?__pr6Esc(state.approvalDetailError||'Calculation lines are unavailable.'):state.approvalDetailLoading===r?.id?'Loading employee payroll calculations…':'No employee calculations are recorded for this run.')}</tbody></table></div>`)}</div><div class="stack">${card('Review checklist','Evidence available from the payroll API',`<div class="card-body list">${list}</div>`)}${card('Decision controls','Actions are enabled only for a run awaiting approval',`<div class="card-body">${decision}</div>`)}</div></div></div>`;
};
document.addEventListener('change',event=>{if(event.target?.id==='approvalRunSelect'){state.approvalRunId=event.target.value;state.approvalDetail=null;state.approvalDetailRunId=null;state.approvalDetailErrorFor=null;state.approvalDetailError=null;state.approvalDetailLoading=null;render()}},true);
document.addEventListener('click',event=>{const exp=event.target.closest('[data-approval-export]');if(exp){event.preventDefault();event.stopImmediatePropagation();approvalExportV5(exp.dataset.approvalExport);return}const decision=event.target.closest('[data-action="approval-decision"]');if(decision){event.preventDefault();event.stopImmediatePropagation();approvalDecisionModal();return}if(event.target.closest('[data-action="approve-payroll"],[data-action="reject-payroll"]')&&state.page==='approvals'){const m=approvalReviewModelV5();if(!m?.hasPending){event.preventDefault();event.stopImmediatePropagation();toast('No decision available','No payroll run is awaiting approval.','warn')}}},true);
function closeReviewModelV5(){
 if(!__pr6IsLive())return null;
 const all=Array.isArray(payrollRuns)?payrollRuns:[];
 let current=all.find(r=>r.id===state.closeRunId)||all.find(r=>['COMPLETED','APPROVED','PROCESSING','FAILED'].includes(String(r.rawStatus||'').toUpperCase()))||all[0]||null;
 if(current)state.closeRunId=current.id;
 const detail=state.closeDetailRunId===current?.id?state.closeDetail:null;
 const lines=Array.isArray(detail?.employeePayrolls)?detail.employeePayrolls:[];
 const missingBank=lines.filter(x=>!x.employee?.bankName||!x.employee?.branchCode||!x.employee?.accountNumber).length;
 const components=current?.currencyComponents||{};
 const payment=state.closePaymentRunId===current?.id?state.closePaymentEntry:null;
 return {all,current,detail,lines,missingBank,components,payment,paymentLoading:state.closePaymentLoading===current?.id,paymentError:state.closePaymentErrorFor===current?.id?state.closePaymentError:'',banks:Array.isArray(state.closeBanks)?state.closeBanks:[],bankLoading:!!state.closeBanksLoading,bankError:state.closeBanksError||'',templates:Array.isArray(__pr6Ref()?.bankTemplates)?__pr6Ref().bankTemplates:[]};
}
function closeExportButtonsV5(){return `<div class="export-icon-group" role="group" aria-label="Export payroll close report"><button class="icon-btn" type="button" title="Export PDF" aria-label="Export PDF" data-close-export="pdf">${icon('file')}</button><button class="icon-btn" type="button" title="Export Excel" aria-label="Export Excel" data-close-export="excel">${icon('report')}</button><button class="icon-btn" type="button" title="Export CSV" aria-label="Export CSV" data-close-export="csv">${icon('download')}</button></div>`}
function closeExportV5(kind){const m=closeReviewModelV5();if(!m){toast('Export unavailable','Payroll close data is still loading.','warn');return}const r=m.current,period=r?.reference||r?.period||'No payroll run',num=x=>Number.isFinite(Number(x))?Number(x):0,columns=['Section','Measure','Value','Status'],rows=[];if(r){rows.push(['Run','Pay period',period,r.status||'—'],['Run','Pay group',r.group||'—',r.status||'—'],['Run','Employees',r.employees??'—','API record'],['Payroll','Gross primary currency',num(r.grossTotal),'API record'],['Payroll','Gross USD component',num(r.grossUSD),'API record'],['Payroll','Gross ZiG component',num(r.grossZiG),'API record'],['Payroll','Deductions (run currency)',num(r.deductions),'API record'],['Payroll','Net pay (run currency)',num(r.netUSD),'API record'],['Accounting','GL journal',r.journalEntryId?'Linked':'Not linked',r.journalEntryId?'Recorded':'Unavailable'],['Payslips','Persisted documents',r.payslips??'Not reported',r.rawStatus==='COMPLETED'?'Run completed':'Not completed'],['Payment','Employee bank details missing',m.missingBank,'From run detail API']);Object.entries(m.components).forEach(([ccy,x])=>rows.push(['Currency leg',ccy,`Gross ${num(x?.gross)}; deductions ${num(x?.deductions)}; net ${num(x?.net)}`,'Payroll API']));m.lines.slice(0,200).forEach(x=>{const name=[x.employee?.user?.firstName,x.employee?.user?.lastName].filter(Boolean).join(' ')||x.employee?.employeeNumber||'Employee';rows.push(['Employee',name,`Gross ${num(x.grossPay)}; deductions ${num(x.totalDeductions)}; net ${num(x.netPay)}`,x.status||'Recorded'])})}const fn=window.__PAYROLL_V6_EXPORT_CLOSE__;if(typeof fn!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return}void fn(kind,{title:'Payroll Close and Distribution Report',subtitle:'Selected payroll run, calculation, accounting and payment readiness from live API records.',columns,rows,filename:'payroll-close-and-distribution',landscape:true,meta:[['Pay period',period],['Currency',r?.currency||'Not recorded'],['Status',r?.status||'No payroll run'],['Prepared by',r?.owner||'Not recorded'],['Payslips',r?.payslips==null?'Not reported':String(r.payslips)],['GL journal',r?.journalEntryId?'Linked':'Not linked']],note:'Confidential payroll information. Database IDs and bank account details are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'})}
function openClosePaymentModalV5(){const m=closeReviewModelV5(),r=m?.current;if(!r||String(r.rawStatus||'').toUpperCase()!=='COMPLETED'){toast('Payment unavailable','Only a completed payroll run can be paid.','warn');return}const currency=String(r.currency||'USD').toUpperCase(),currencyMatches=b=>!b.currency?.code||String(b.currency.code).toUpperCase()===currency,eligible=m.banks.filter(b=>b.isActive&&b.glAccountId&&b.glAccount?.isActive!==false&&currencyMatches(b)),runLabel=__pr6Esc(`${r.reference||r.period||'Payroll run'} · ${currency} ${money(Number(r.netUSD)||0,currency==='ZIG'?'ZiG':'USD')}`);openModal('Record payroll payment',`Record the completed run payment through Cashbook and the general ledger.`, `<div class="form-grid"><div class="form-field full"><label>Completed payroll run</label><input value="${runLabel}" disabled></div><div class="form-field"><label for="closePaymentBank">Funding bank account <b class="required-mark">Required</b></label><select id="closePaymentBank"><option value="">${m.bankLoading?'Loading bank accounts…':eligible.length?'Select an active '+currency+' account':'No active linked bank account is available in '+currency}</option>${eligible.map(b=>`<option value="${__pr6Esc(b.id)}">${__pr6Esc(b.name)} · ${__pr6Esc(b.currency?.code||currency)} · GL ${__pr6Esc(b.glAccount?.accountNo||'unlinked')}</option>`).join('')}</select></div><div class="form-field"><label for="closePaymentDate">Payment date <b class="required-mark">Required</b></label><input id="closePaymentDate" type="date" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10)}"></div><div class="form-field full"><div class="callout amber"><span class="kpi-icon amber">${icon('bank')}</span><div><strong>This creates accounting entries</strong><p>The Payroll API records a cashbook payment and journal to debit Net Wages Payable and credit the selected bank account. Verify the period and funding account before submitting.</p></div></div>${Object.keys(m.components).length>1?`<p class="tiny muted">The payment endpoint currently supports the run's primary currency only; it does not settle the additional currency legs.</p>`:''}${m.bankError?`<p class="tiny muted">${__pr6Esc(m.bankError)}</p>`:''}</div></div>`,`${button('Cancel','close-modal')}<button class="btn primary" data-action="release-payroll" data-run-id="${__pr6Esc(r.id)}" ${eligible.length?'':'disabled'}>${icon('send')}Record payment</button>`,true)}
function openCloseBankFileModalV5(){const m=closeReviewModelV5(),r=m?.current;if(!r||String(r.rawStatus||'').toUpperCase()!=='COMPLETED'){toast('Bank file unavailable','A bank file can be generated after the payroll run completes.','warn');return}const ts=m.templates;openModal('Generate payroll bank file','Create the payment instruction file from employee payroll lines and the selected bank format.',`<div class="form-grid"><div class="form-field full"><label>Completed payroll run</label><input value="${__pr6Esc(`${r.reference||r.period||'Payroll run'} · ${r.employees??0} employees`)}" disabled></div><div class="form-field full"><label for="closeBankTemplate">Bank file template <b class="required-mark">Required</b></label><select id="closeBankTemplate"><option value="">${ts.length?'Select a configured bank template':'No bank file template is configured'}</option>${ts.map(t=>`<option value="${__pr6Esc(t.id)}">${__pr6Esc(t.name||t.bankName||t.code||'Bank template')}</option>`).join('')}</select></div><div class="form-field full"><div class="callout blue"><span class="kpi-icon">${icon('info')}</span><div><strong>Generated from the payroll API</strong><p>Employee name, bank details, net pay and employee number are read by the backend. The generated CSV does not display internal database IDs.</p></div></div></div></div>`,`${button('Cancel','close-modal')}<button class="btn primary" data-action="download-close-pack" data-run-id="${__pr6Esc(r.id)}" data-run-reference="${__pr6Esc(r.reference||r.period||'payroll-run')}">${icon('download')}Generate bank file</button>`,true)}
function openClosePreviewV5(){const m=closeReviewModelV5();if(!m?.current){toast('Payroll detail unavailable','Select a payroll run after live data has loaded.','warn');return}if(!m.lines.length){toast('No calculation lines','The selected run has no employee payroll lines to preview.','warn');return}const name=x=>[x.employee?.user?.firstName,x.employee?.user?.lastName].filter(Boolean).join(' ')||x.employee?.employeeNumber||'Employee';openDrawer('Payroll close detail',`${__pr6Esc(m.current.reference||m.current.period||'Payroll run')} · ${__pr6Esc(m.current.status||'')}`,`<div class="grid three"><div class="fact"><span>Employees</span><strong>${m.lines.length}</strong></div><div class="fact"><span>Gross payroll</span><strong>${money(Number(m.current.grossUSD)||0)}</strong></div><div class="fact"><span>Net pay</span><strong>${money(Number(m.current.netUSD)||0)}</strong></div><div class="fact"><span>Deduction total</span><strong>${money(Number(m.current.deductions)||0)}</strong></div><div class="fact"><span>Persisted payslips</span><strong>${m.current.payslips??'Not reported by run list API'}</strong></div><div class="fact"><span>Journal entry</span><strong>${m.current.journalEntryId?'Linked':'Not linked'}</strong></div></div><div class="drawer-section"><h3>Employee calculations</h3><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Bank detail readiness</th></tr></thead><tbody>${m.lines.map(x=>`<tr><td>${__pr6Esc(name(x))}</td><td>${money(Number(x.grossPay)||0)}</td><td>${money(Number(x.totalDeductions)||0)}</td><td>${money(Number(x.netPay)||0)}</td><td>${x.employee?.bankName&&x.employee?.branchCode&&x.employee?.accountNumber?'Complete':'Missing details'}</td></tr>`).join('')}</tbody></table></div></div>`,button('Close','close-drawer'))}
function closeWorkflowV5(r){const status=String(r?.rawStatus||'').toUpperCase(),steps=[['Period',r?'Configured':'Unavailable'],['Inputs',r?.employees!=null?`${r.employees} employee records`:'Not recorded'],['Calculate',status==='COMPLETED'?'Complete':status==='PROCESSING'?'In progress':status==='FAILED'?'Failed':status==='APPROVED'?'Ready to process':'Awaiting approval'],['Review',status==='COMPLETED'||status==='APPROVED'?'Approved':status==='PENDING_APPROVAL'?'Pending checker':'Not approved'],['Release',status==='COMPLETED'?'Payment action available':'Run not complete'],['Close','No close state is recorded by the Payroll API']];const stage=status==='COMPLETED'?5:status==='FAILED'||status==='PROCESSING'?3:status==='APPROVED'?3:status==='PENDING_APPROVAL'?4:2;return `<div class="workflow">${steps.map((x,i)=>`<div class="wf-step ${i<stage-1?'done':i===stage-1?'active':''}"><div class="wf-dot">${i<stage-1?'&#10003;':i+1}</div><strong>${x[0]}</strong><span>${__pr6Esc(x[1])}</span></div>`).join('')}</div>`}
closePage=function(){
 const m=closeReviewModelV5();if(!m)return `<div class="page">${pageHead('Finalisation and distribution','Payroll Close and Distribution Centre','Loading payroll runs and close evidence…',closeExportButtonsV5())}<div class="panel-band"><div class="skeleton-block" style="height:24px;width:50%"></div></div><div class="grid four">${Array.from({length:4},()=>'<div class="card"><div class="card-body"><div class="skeleton-block" style="height:140px"></div></div></div>').join('')}</div></div>`;
 const r=m.current,status=String(r?.rawStatus||'').toUpperCase();
 if(r&&state.closeDetailRunId!==r.id&&state.closeDetailLoading!==r.id&&!state.closeDetailErrorFor){const fetchRun=window.__PAYROLL_V6_GET_RUN__;if(typeof fetchRun==='function'){state.closeDetailLoading=r.id;Promise.resolve(fetchRun(r.id)).then(raw=>{state.closeDetail=raw?.data||raw||null;state.closeDetailRunId=r.id;state.closeDetailLoading=null;if(state.page==='close'&&closeReviewModelV5()?.current?.id===r.id)render()}).catch(err=>{state.closeDetailError=err?.message||'Payroll run detail could not be loaded.';state.closeDetailErrorFor=r.id;state.closeDetailRunId=r.id;state.closeDetailLoading=null;if(state.page==='close')render()})}}
 if(r&&status==='COMPLETED'&&state.closePaymentRunId!==r.id&&state.closePaymentLoading!==r.id&&state.closePaymentErrorFor!==r.id){const getPayment=window.__PAYROLL_V6_GET_PAYMENT__;if(typeof getPayment==='function'){state.closePaymentLoading=r.id;Promise.resolve(getPayment(r.reference||r.period||'',r.group||'')).then(entry=>{state.closePaymentEntry=entry||null;state.closePaymentRunId=r.id;state.closePaymentLoading=null;if(state.page==='close'&&closeReviewModelV5()?.current?.id===r.id)render()}).catch(err=>{state.closePaymentError=err?.message||'Existing payroll payment could not be checked.';state.closePaymentErrorFor=r.id;state.closePaymentLoading=null;if(state.page==='close')render()})}}
 if(!state.closeBanksLoaded&&!state.closeBanksLoading){const getBanks=window.__PAYROLL_V6_GET_BANKS__;if(typeof getBanks==='function'){state.closeBanksLoading=true;Promise.resolve(getBanks()).then(rows=>{state.closeBanks=rows;state.closeBanksLoaded=true;state.closeBanksLoading=false;if(state.page==='close')render()}).catch(err=>{state.closeBanksError=err?.message||'Bank accounts could not be loaded.';state.closeBanksLoaded=true;state.closeBanksLoading=false;if(state.page==='close')render()})}}
 const noRows=(n,t)=>`<tr><td colspan="${n}" class="tiny muted">${t}</td></tr>`,templates=m.templates;
  const payCount=r?.payslips,employees=r?.employees??m.lines.length,gl=r?.journalEntryId,completed=status==='COMPLETED',approved=status==='APPROVED',currencyLegs=Object.entries(m.components),num=x=>Number.isFinite(Number(x))?Number(x):0,cashCurrency=String(r?.currency||'USD').toUpperCase(),cashCurrencyLabel=cashCurrency==='ZIG'?'ZiG':'USD';
  const runOptions=m.all.map(x=>{const label=String(x.reference||x.period||'Payroll run')+' · '+String(x.status||x.rawStatus||'Unknown'),selected=!!r&&x.id===r.id;return '<option value="'+__pr6Esc(x.id)+'" '+(selected?'selected':'')+'>'+__pr6Esc(label)+'</option>'}).join('');
 let actions=closeExportButtonsV5();if(r&&completed)actions+='<button class="btn" data-action="close-bank-file">'+icon('download')+'Generate bank file</button>';if(r&&approved)actions+='<button class="btn primary" data-action="commit-inputs" data-run-id="'+__pr6Esc(r.id)+'">'+icon('calculator')+'Calculate and generate payslips</button>';if(r&&completed&&!m.payment&&!m.paymentLoading&&!m.paymentError)actions+='<button class="btn primary" data-action="close-payment">'+icon('send')+'Record payroll payment</button>';
 const currencyRows=currencyLegs.map(([code,x])=>`<div class="list-row"><div class="list-main"><strong>${__pr6Esc(code)} payroll leg</strong><span>Gross ${money(num(x?.gross),code==='ZIG'?'ZiG':'USD')} · Deductions ${money(num(x?.deductions),code==='ZIG'?'ZiG':'USD')}</span></div><strong>${money(num(x?.net),code==='ZIG'?'ZiG':'USD')}</strong></div>`).join('')||`<div class="tiny muted">No currency-leg totals were returned by the Payroll API.</div>`;
 let runActions='';if(!r){runActions=`<div class="callout blue"><span class="kpi-icon">${icon('info')}</span><div><strong>No payroll runs are available</strong><p>Create a run and follow the approval, calculation and close workflow.</p></div></div>`}else if(status==='DRAFT'){runActions=`<div class="callout amber"><span class="kpi-icon amber">${icon('clock')}</span><div><strong>This run is still a draft</strong><p>Submit it for maker-checker review before calculation and close.</p></div></div><button class="btn" style="margin-top:10px" data-page="runs">Open Payroll Runs</button>`}else if(status==='PENDING_APPROVAL'){runActions=`<div class="callout amber"><span class="kpi-icon amber">${icon('shield')}</span><div><strong>Independent approval is pending</strong><p>Calculation is blocked until a checker approves this run.</p></div></div><button class="btn" style="margin-top:10px" data-page="approvals">Open Maker-Checker Review</button>`}else if(status==='FAILED'){runActions=`<div class="callout red"><span class="kpi-icon red">${icon('alert')}</span><div><strong>Payroll processing failed</strong><p>${__pr6Esc(r.processError||state.closeDetail?.processError||'The run is not complete. Review the run and its accounting controls.')}</p></div></div><button class="btn" style="margin-top:10px" data-page="runs">Review payroll run</button>`}else if(completed){const paymentState=m.payment?`<div class="callout blue"><span class="kpi-icon">${icon('check')}</span><div><strong>Payroll payment already recorded</strong><p>The matching Cashbook payment ${__pr6Esc(m.payment.reference||'')} was found. A second payment is blocked.</p></div></div>`:m.paymentLoading?`<div class="callout amber"><span class="kpi-icon amber">${icon('clock')}</span><div><strong>Checking payment history</strong><p>Payment actions stay disabled until Cashbook confirms whether this run was already paid.</p></div></div>`:m.paymentError?`<div class="callout red"><span class="kpi-icon red">${icon('alert')}</span><div><strong>Payment history could not be verified</strong><p>${__pr6Esc(m.paymentError)} Retry the lookup before recording a payment.</p></div><button class="btn small" data-action="retry-close-payment-check">Retry</button></div>`:`<div class="callout blue"><span class="kpi-icon">${icon('check')}</span><div><strong>Run processing completed</strong><p>Payroll close posted through the Payroll API. Payment actions create cashbook and net-wages journal entries.</p></div></div>`;runActions=`${paymentState}<div class="actions" style="margin-top:10px"><button class="btn" data-action="close-preview">${icon('eye')}Preview payroll detail</button><button class="btn" data-action="close-bank-file">${icon('download')}Generate bank file</button>${!m.payment&&!m.paymentLoading&&!m.paymentError?`<button class="btn primary" data-action="close-payment">${icon('send')}Record payment</button>`:''}</div>`}else{runActions=`<div class="callout blue"><span class="kpi-icon">${icon('info')}</span><div><strong>${__pr6Esc(r.status||status)}</strong><p>Current run state is supplied by the Payroll API; actions unlock when the run reaches the required lifecycle state.</p></div></div>`}
 const controlRows=[['Run approval',status==='COMPLETED'||status==='APPROVED'?'Approved':status==='PENDING_APPROVAL'?'Pending':'Not approved',status==='COMPLETED'||status==='APPROVED'?'blue':'amber'],['Payroll calculation',status==='COMPLETED'?'Complete':status==='PROCESSING'?'In progress':status==='FAILED'?'Failed':'Not completed',status==='COMPLETED'?'blue':status==='FAILED'?'red':'amber'],['Balanced GL journal',gl?'Linked to completed run':'Not linked',gl?'blue':'amber'],['Persisted payslips',payCount==null?'Count not returned':`${payCount} of ${employees}`,payCount!=null&&payCount>=employees?'blue':'amber'],['Employee bank details',m.lines.length?`${m.missingBank} incomplete`:'Details not loaded',m.lines.length&&m.missingBank===0?'blue':'amber'],['Bank file templates',templates.length?`${templates.length} configured`:'None configured',templates.length?'blue':'amber']];
 return `<div class="page">${pageHead('Finalisation and distribution','Payroll Close and Distribution Centre','Review the selected payroll run, verify its accounting and payslip records, generate bank instructions and record payment from live API data.',actions)}
 ${card('Payroll run','Select the run whose close and payment records you need to inspect',`<div class="card-body"><div class="form-field"><label for="closeRunSelect">Payroll run</label><select id="closeRunSelect"><option value="">${runOptions?'Select a payroll run':'No payroll runs'}</option>${runOptions}</select></div>${r?`<div class="grid four" style="margin-top:12px">${kpi('Run status',r.status||status,'Payroll API status','calculator')}${kpi('Employees',String(employees),'Run employee count','users','cyan')}${kpi('Gross payroll ('+cashCurrency+')',money(num(r.grossTotal),cashCurrencyLabel),'Run currency total','wallet','violet')}${kpi('Net pay ('+cashCurrency+')',money(num(r.netTotal),cashCurrencyLabel),'Run currency total','bank','cyan')}</div>`:''}</div>`)}
 ${card('Payroll lifecycle','SRD workflow state for this run',closeWorkflowV5(r))}
 <div class="grid four" style="margin-bottom:14px">
 ${card('1. Payslip generation','Persisted count from the payroll run record',`<div class="card-body">${progressRow(payCount==null?'Count unavailable':'Payslips generated',payCount==null?0:employees?Math.min(100,Math.round((payCount/employees)*100)):0,payCount==null?'Payroll API did not return payslip count':`${payCount} of ${employees} payslips`,payCount!=null&&payCount>=employees?'cyan':'amber')}<div class="list"><div class="list-row"><div class="list-main"><strong>Calculation employees</strong><span>${m.lines.length?`${m.lines.length} detail lines loaded`:'Run detail not loaded'}</span></div><strong>${employees}</strong></div><div class="list-row"><div class="list-main"><strong>Payroll currency legs</strong><span>From payroll API</span></div><strong>${currencyLegs.length||'—'}</strong></div></div><button class="btn small soft" data-action="close-preview" ${m.lines.length?'':'disabled'}>${icon('eye')}Preview payroll detail</button></div>`)}
 ${card('2. Bank payment batches','Amounts by payroll currency leg; file is generated from the selected template',`<div class="card-body">${currencyRows}<div class="callout ${m.missingBank?'amber':'blue'}" style="margin-top:10px"><span class="kpi-icon ${m.missingBank?'amber':''}">${icon(m.missingBank?'alert':'bank')}</span><div><strong>Employee bank data</strong><p>${m.lines.length?`${m.missingBank} of ${m.lines.length} employee records have incomplete bank details.`:'Load run detail to verify employee bank records.'}</p></div></div><button class="btn small" style="margin-top:10px" data-action="close-bank-file" ${completed&&templates.length?'':'disabled'}>${icon('download')}Generate bank file</button></div>`)}
 ${card('3. General ledger journal','SRD requires balanced payroll postings before a run can complete',`<div class="card-body"><div class="list"><div class="list-row"><div class="list-main"><strong>Payroll expense and liability journal</strong><span>${gl?'Journal link is present on the run record.':'No journal link is recorded on this run.'}</span></div>${badge(gl?'Linked':'Not linked')}</div><div class="list-row"><div class="list-main"><strong>Gross payroll expense</strong><span>Selected run total</span></div><strong>${money(num(r?.grossTotal),cashCurrencyLabel)}</strong></div><div class="list-row"><div class="list-main"><strong>Net wages payable</strong><span>Selected run total</span></div><strong>${money(num(r?.netTotal),cashCurrencyLabel)}</strong></div><div class="list-row"><div class="list-main"><strong>Payroll deductions</strong><span>Selected run total</span></div><strong>${money(num(r?.deductions),cashCurrencyLabel)}</strong></div></div><p class="tiny muted">The Payroll API blocks completion when journal posting fails or is unbalanced.</p></div>`)}
 ${card('4. Statutory deductions','Amounts included in the selected payroll calculation',`<div class="card-body"><div class="list"><div class="list-row"><div class="list-main"><strong>Total deductions</strong><span>From PayrollRun totals</span></div><strong>${money(num(r?.deductions))}</strong></div>${currencyRows}</div><div class="callout amber" style="margin-top:10px"><span class="kpi-icon amber">${icon('info')}</span><div><strong>Filing-pack status is not exposed by the Payroll API</strong><p>This page can verify deductions in the run, but it cannot claim statutory returns are prepared or filed without a filing-pack endpoint.</p></div></div></div>`)}
 </div>
 <div class="grid two">${card('Release controls','Current run evidence returned by the Payroll API',`<div class="card-body">${controlRows.map(x=>`<div class="list-row"><div class="list-icon ${x[2]}">${icon(x[2]==='blue'?'check':x[2]==='red'?'alert':'clock')}</div><div class="list-main"><strong>${__pr6Esc(x[0])}</strong><span>${__pr6Esc(x[1])}</span></div>${badge(x[1])}</div>`).join('')}</div>`)}${card('Release authority','Choose an active bank account and payment date for the selected completed run',`<div class="card-body">${runActions}<div class="callout amber" style="margin-top:12px"><span class="kpi-icon amber">${icon('info')}</span><div><strong>Payment endpoint currency limitation</strong><p>The current Payroll API records one run-level net payment against one bank account. Separate settlement of multiple currency legs is not exposed by this endpoint.</p></div></div></div>`)}</div></div>`;
};
document.addEventListener('change',event=>{if(event.target?.id==='closeRunSelect'){state.closeRunId=event.target.value;state.closeDetail=null;state.closeDetailRunId=null;state.closeDetailErrorFor=null;state.closeDetailError=null;state.closeDetailLoading=null;render()}},true);
window.addEventListener('payroll-v6:payment-recorded',event=>{const run=closeReviewModelV5()?.current;if(!run)return;state.closePaymentEntry=event.detail?.data||event.detail||{reference:'New payment'};state.closePaymentRunId=run.id;state.closePaymentLoading=null;state.closePaymentErrorFor=null;state.closePaymentError=null;if(state.page==='close')render()});
document.addEventListener('click',event=>{const retry=event.target.closest('[data-action="retry-close-payment-check"]');if(retry){event.preventDefault();event.stopImmediatePropagation();const r=closeReviewModelV5()?.current;if(r){state.closePaymentRunId=null;state.closePaymentErrorFor=null;state.closePaymentError=null;state.closePaymentLoading=null;render()} }},true);
document.addEventListener('click',event=>{const exp=event.target.closest('[data-close-export]');if(exp){event.preventDefault();event.stopImmediatePropagation();closeExportV5(exp.dataset.closeExport);return}const pay=event.target.closest('[data-action="close-payment"]');if(pay){event.preventDefault();event.stopImmediatePropagation();openClosePaymentModalV5();return}const bank=event.target.closest('[data-action="close-bank-file"]');if(bank){event.preventDefault();event.stopImmediatePropagation();openCloseBankFileModalV5();return}const preview=event.target.closest('[data-action="close-preview"]');if(preview){event.preventDefault();event.stopImmediatePropagation();openClosePreviewV5()}},true);
runsPage=function(){
 const live=__pr6IsLive(),all=live?filteredRunsV4():[],pages=Math.max(1,Math.ceil(all.length/state.runsPageSize));state.runsPage=Math.min(state.runsPage,pages);const shown=all.slice((state.runsPage-1)*state.runsPageSize,state.runsPage*state.runsPageSize);
 const employeeCount=all.reduce((n,r)=>n+(Number(r.employees)||0),0),gross=all.reduce((n,r)=>n+(state.runsCurrency==='ZiG'?(Number(r.grossZiG)||0):(Number(r.grossUSD)||0)),0),open=all.filter(r=>!['COMPLETED','RELEASED'].includes(String(r.rawStatus||'').toUpperCase())).length,last=all.find(r=>['COMPLETED','RELEASED'].includes(String(r.rawStatus||'').toUpperCase()));
 const currencies=['All currencies','USD','ZiG'];const tabs=['All Runs','Open','Released'];
 const rows=shown.map(r=>`<tr data-run="${__pr6Esc(r.id)}"><td><button class="link payroll-run-reference" type="button" data-run="${__pr6Esc(r.id)}">${__pr6Esc(runReferenceV4(r))}</button></td><td><strong>${__pr6Esc(r.group||'—')}</strong><div class="tiny muted">${__pr6Esc(r.period||'—')}</div></td><td>${r.employees??'—'}</td><td>${__pr6Esc(runCurrencyCodeV4(r))}${Number(r.grossZiG)>0&&Number(r.grossUSD)>0?' + ZiG':''}</td><td class="money">${money(Number(r.grossUSD)||0)}${Number(r.grossZiG)>0?`<div class="tiny muted">${money(Number(r.grossZiG),'ZiG')}</div>`:''}</td><td class="money">${money(runDeductionForCurrencyV4(r,'USD'))}</td><td class="money">${money(runDeductionForCurrencyV4(r,'ZIG'),'ZiG')}</td><td>${r.variance==null?'—':`${Number(r.variance)>0?'+':''}${r.variance}%`}</td><td>${badge(r.status||'—')}</td><td>${__pr6Esc(r.owner||'—')}</td><td><button class="btn small" type="button" data-run="${__pr6Esc(r.id)}">${icon('eye')}Open</button></td></tr>`).join('');
 const periodLabel=`${all.length?((state.runsPage-1)*state.runsPageSize+1):0}–${Math.min(state.runsPage*state.runsPageSize,all.length)} of ${all.length} runs`;
 const exports=`<div class="export-icon-group payroll-run-exports" role="group" aria-label="Export payroll runs"><button class="icon-btn" type="button" title="Export PDF" aria-label="Export PDF" data-run-export="pdf">${icon('file')}</button><button class="icon-btn" type="button" title="Export Excel" aria-label="Export Excel" data-run-export="excel">${icon('report')}</button><button class="icon-btn" type="button" title="Export CSV" aria-label="Export CSV" data-run-export="csv">${icon('download')}</button></div>`;
 return `<div class="page">${pageHead('Payroll execution','Payroll Runs','Review and manage payroll runs using live payroll records.',`<button class="btn" type="button" data-runs-compare>${icon('refresh')}Compare periods</button>${exports}${button('Create payroll run','new-run','primary','plus')}`)}
 <div class="grid kpis">${live?kpi('Open payroll runs',String(all.filter(r=>!['COMPLETED','RELEASED','CANCELLED','CANCELED'].includes(String(r.rawStatus||'').toUpperCase())).length),'Matching current filters','calculator')+kpi('Employee-run records',String(employeeCount),'Across matching runs','users','cyan')+kpi(`Gross payroll${state.runsCurrency==='All currencies'?' (USD)':` (${state.runsCurrency})`}`,money(gross,state.runsCurrency==='ZiG'?'ZiG':'USD'),'From matching run totals','wallet','violet')+kpi('Runs on record',String(all.length),'After filters','audit')+kpi('Last release',last?String(last.period||last.reference||'Released'):'—',last?'Latest released run':'No released run in selection','bank','cyan'):Array.from({length:5},()=>'<div class="kpi run-kpi-skeleton"><div class="skeleton-block" style="width:42%;height:10px"></div><div class="skeleton-block" style="width:58%;height:23px;margin:13px 0"></div><div class="skeleton-block" style="width:72%;height:8px"></div></div>').join('')}</div>
 ${card('Filters','Refine payroll run records by status, currency and pay-period dates',`<div class="run-filter-bar"><div class="segmented" role="tablist" aria-label="Payroll run status">${tabs.map(t=>`<button type="button" role="tab" aria-selected="${state.runsTab===t}" class="${state.runsTab===t?'active':''}" data-run-tab="${t}">${t}</button>`).join('')}</div><label>Currency<select id="runsCurrencyFilter">${currencies.map(c=>`<option ${state.runsCurrency===c?'selected':''}>${c}</option>`).join('')}</select></label><label>From<input id="runsDateFrom" type="date" value="${__pr6Esc(state.runsFrom)}"></label><label>To<input id="runsDateTo" type="date" value="${__pr6Esc(state.runsTo)}"></label><span class="tiny muted">${periodLabel}</span></div>`) }
 ${card('Payroll run register','Select a run to load its API-backed details',`<div class="table-wrap"><table><thead><tr><th>Pay period</th><th>Pay group</th><th>Employees</th><th>Currency</th><th>Gross payroll</th><th>Deductions USD</th><th>Deductions ZiG</th><th>Variance</th><th>Status</th><th>Owner</th><th></th></tr></thead><tbody>${!live?Array.from({length:6},()=>'<tr class="skeleton-row"><td colspan="11"><span></span></td></tr>').join(''):rows||'<tr><td colspan="11" class="empty-state">No payroll runs match these filters.</td></tr>'}</tbody></table></div><div class="table-pagination"><span>${periodLabel}</span><div><button type="button" class="btn small" data-runs-page="${Math.max(1,state.runsPage-1)}" ${state.runsPage<=1?'disabled':''}>Previous</button><span>Page ${state.runsPage} of ${pages}</span><button type="button" class="btn small" data-runs-page="${Math.min(pages,state.runsPage+1)}" ${state.runsPage>=pages?'disabled':''}>Next</button></div></div>`)}
 ${state.runsCompare?card('Payroll period comparison','Latest two periods in the filtered run set',runComparisonV4(all)):''}</div>`;
};
function showRunDetailLiveV4(id){
 openDrawer('Payroll run details','Loading current payroll run from the API','<div class="skeleton-block" style="height:120px"></div><div class="skeleton-block" style="height:220px;margin-top:12px"></div>');
 const fetchRun=window.__PAYROLL_V6_GET_RUN__;if(typeof fetchRun!=='function'){toast('Run details unavailable','The payroll run detail API is not ready.','bad');return}
 Promise.resolve(fetchRun(id)).then(raw=>{
  const run=raw?.data||raw||{},lines=Array.isArray(run.employeePayrolls)?run.employeePayrolls:[],rawStatus=String(run.status||run.approvalStatus||'Draft'),friendlyStatus=({COMPLETED:'Released',DRAFT:'Draft',PENDING_APPROVAL:'Pending approval',APPROVED:'Approved',CANCELLED:'Cancelled',CANCELED:'Cancelled'})[rawStatus]||rawStatus.replaceAll('_',' '),name=x=>[x?.employee?.user?.firstName,x?.employee?.user?.lastName].filter(Boolean).join(' ')||x?.employee?.employeeNumber||'Employee';
  const legFor=(employee,code)=>employee.legs?.find(leg=>String(leg.currencyCode||'').toUpperCase()===code)||null;
  const rows=lines.length?lines.map(employee=>{const usd=legFor(employee,'USD'),zig=legFor(employee,'ZIG');return `<tr><td>${__pr6Esc(name(employee))}</td><td>${usd?money(Number(usd.grossPay)||0,'USD'):''}</td><td>${usd?money(Number(usd.totalDeductions)||0,'USD'):''}</td><td>${usd?money(Number(usd.netPay)||0,'USD'):''}</td><td>${zig?money(Number(zig.grossPay)||0,'ZiG'):''}</td><td>${zig?money(Number(zig.totalDeductions)||0,'ZiG'):''}</td><td>${zig?money(Number(zig.netPay)||0,'ZiG'):''}</td><td>${badge(employee.status||'Recorded')}</td></tr>`}).join(''):'<tr><td colspan="8">No employee calculations are recorded for this run.</td></tr>';
  const deductionRows=lines.flatMap(employee=>(Array.isArray(employee.deductions)?employee.deductions:[]).map(deduction=>({employee:name(employee),type:deduction.deductionType?.name||deduction.deductionType?.code||'Deduction',currency:deduction.currency?.code||run.currency?.code||'USD',amount:Number(deduction.amount)||0}))).map(row=>`<tr><td>${__pr6Esc(row.employee)}</td><td>${__pr6Esc(row.type)}</td><td>${__pr6Esc(row.currency)}</td><td class="money">${money(row.amount,row.currency==='ZIG'?'ZiG':'USD')}</td></tr>`).join('');
  const currencyTotals=['USD','ZIG'].map(code=>{const legs=lines.flatMap(employee=>(employee.legs||[]).filter(leg=>String(leg.currencyCode||'').toUpperCase()===code));if(!legs.length)return '';const label=code==='ZIG'?'ZiG':'USD',sum=field=>legs.reduce((total,leg)=>total+(Number(leg[field])||0),0);return `<div class="fact"><span>${label} deductions</span><strong>${money(sum('totalDeductions'),label)}</strong></div>`}).join('');
  const detailContent=`<div class="grid three" style="margin:8px 0 16px"><div class="fact"><span>Pay period</span><strong>${__pr6Esc(run.payPeriod||'')}</strong></div><div class="fact"><span>Pay group</span><strong>${__pr6Esc(run.name||'')}</strong></div><div class="fact"><span>Employees</span><strong>${lines.length}</strong></div><div class="fact"><span>Gross (USD equivalent)</span><strong>${money(Number(run.totalGrossPay)||0,'USD')}</strong></div><div class="fact"><span>Deductions (USD equivalent)</span><strong>${money(Number(run.totalDeductions)||0,'USD')}</strong></div><div class="fact"><span>Net (USD equivalent)</span><strong>${money(Number(run.totalNetPay)||0,'USD')}</strong></div>${currencyTotals}<div class="fact"><span>Start date</span><strong>${__pr6Esc(String(run.startDate||'').slice(0,10)||'')}</strong></div><div class="fact"><span>End date</span><strong>${__pr6Esc(String(run.endDate||'').slice(0,10)||'')}</strong></div><div class="fact"><span>Prepared by</span><strong>${__pr6Esc([run.createdBy?.firstName,run.createdBy?.lastName].filter(Boolean).join(' ')||'')}</strong></div></div><div class="drawer-section"><h3>Employee payroll by currency</h3><div class="table-wrap"><table><thead><tr><th>Employee</th><th>USD gross</th><th>USD deductions</th><th>USD net</th><th>ZiG gross</th><th>ZiG deductions</th><th>ZiG net</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="drawer-section"><h3>Deduction lines by currency</h3><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Deduction</th><th>Currency</th><th>Amount</th></tr></thead><tbody>${deductionRows||'<tr><td colspan="4">No persisted deduction lines are available for this run.</td></tr>'}</tbody></table></div></div>`;
  openDrawer('Payroll run details',`${__pr6Esc(run.payPeriod||run.name||'Payroll run')} · ${badge(friendlyStatus)}`,detailContent,button('Close','close-drawer'));
 }).catch(err=>{openDrawer('Payroll run details','The API could not load this run.',`<div class="callout red">${__pr6Esc(err?.message||'Payroll run details could not be loaded.')}</div>`,button('Close','close-drawer'));});
}
document.addEventListener('click',event=>{
 const tab=event.target.closest('[data-run-tab]');if(tab){event.preventDefault();event.stopImmediatePropagation();state.runsTab=tab.dataset.runTab;state.runsPage=1;render();return}
 const page=event.target.closest('[data-runs-page]');if(page){event.preventDefault();event.stopImmediatePropagation();state.runsPage=Number(page.dataset.runsPage)||1;render();return}
 const cmp=event.target.closest('[data-runs-compare]');if(cmp){event.preventDefault();event.stopImmediatePropagation();state.runsCompare=!state.runsCompare;render();return}
 const exp=event.target.closest('[data-run-export]');if(exp){event.preventDefault();event.stopImmediatePropagation();runExportV4(exp.dataset.runExport);return}
 const run=event.target.closest('[data-run]');if(run&&state.page==='runs'){event.preventDefault();event.stopImmediatePropagation();showRunDetailLiveV4(run.dataset.run)}
},true);
document.addEventListener('change',event=>{const el=event.target;if(el.id==='runsCurrencyFilter'){state.runsCurrency=el.value;state.runsPage=1;render()}else if(el.id==='runsDateFrom'){state.runsFrom=el.value;state.runsPage=1;render()}else if(el.id==='runsDateTo'){state.runsTo=el.value;state.runsPage=1;render()}},true);
openNewRun=function(){if(!can('payroll.prepare'))return deny('payroll.prepare');const currencies=Array.isArray(__pr6Ref().currencies)?__pr6Ref().currencies:[];const periods=__pr6PeriodOptions();openModal('Create payroll run','Create a draft run for the selected pay period, pay group and currency setup.',`<div class="form-grid"><div class="form-field"><label for="runPeriod">Pay period <b class="required-mark">Required</b></label><select id="runPeriod">${(periods||['July 2026','June 2026']).map(x=>`<option>${__pr6Esc(x)}</option>`).join('')}</select></div><div class="form-field"><label for="runGroup">Pay group <b class="required-mark">Required</b></label><select id="runGroup"><option>Monthly Staff</option><option>Executives</option><option>Contract Staff</option></select></div><div class="form-field full"><label for="runCurrencyId">Primary payroll currency</label><select id="runCurrencyId"><option value="">Use employee payroll currency</option>${currencies.map(c=>`<option value="${__pr6Esc(c.id)}">${__pr6Esc(c.code||c.currencyCode||c.name||'Currency')}</option>`).join('')}</select></div><div class="form-field full"><label><input id="runDualCurrency" type="checkbox"> Include dual-currency processing</label><small>Use this when the selected run will process both USD and ZiG payroll components.</small></div><div class="form-field full"><div class="callout blue"><div><strong>Draft run</strong><p>The run is saved by the payroll API and remains subject to the existing calculation, validation and approval workflow.</p></div></div></div></div>`,`${button('Cancel','close-modal')}${button('Create payroll run','create-run','primary','arrow')}`)};
function render(){
 renderNav();
 const pages={overview:overviewPage,employees:employeesPage,onboarding:onboardingPage,runs:runsPage,inputs:inputsPage,exceptions:exceptionsPage,approvals:approvalsPage,close:closePage,components:componentsPage,calendar:calendarPage,tax:taxPage,training:trainingPage,leave:leavePage,vault:vaultPage,reports:reportsPage,audit:auditPage,access:accessPage,settings:settingsPage,mypay:myPayPage};
 const fn=state.page==='overview'&&__pr6IsLive()&&!can('dashboard.view')?myPayPage:(pages[state.page]||overviewPage);if(typeof permittedPage==='function'&&!permittedPage(state.page)){$('#content').innerHTML=__pr6DeniedPageHtml(state.page);$('#content').scrollTop=0;wireTopProfile();return;}$('#content').innerHTML=fn();$('#content').scrollTop=0;
 wireTopProfile();
}
function wireTopProfile(){
  const prof=$('.profile');
  if(prof){prof.style.cursor='pointer';prof.dataset.action='profile-menu'}
  applySessionUserToProfile(rootEl);
}
function openProfileMenu(){
  const u=getClientDesignSessionUser()||{name:'Tariro Moyo',email:'',role:state.role,initials:'TM'};
  openDrawer('Your profile',u.email||u.role,`<div class="employee-profile"><div class="photo-avatar">${u.initials||'U'}</div><div><h2 style="font-size:21px;margin:0">${u.name}</h2><div class="muted" style="margin-top:4px">${u.role}</div>${u.email?`<div class="tiny muted" style="margin-top:6px">${u.email}</div>`:''}</div></div>`,`${button('Sign out','client-design-sign-out','danger')}${button('Close','close-drawer')}`);
}
function openDrawer(title,sub,body,foot=''){$('#drawerHead').innerHTML=`<div><h2>${title}</h2><p>${sub}</p></div>${closeButton('drawer')}`;$('#drawerBody').innerHTML=body;$('#drawerFoot').innerHTML=foot||`<button class="btn" data-action="close-drawer">Close</button>`;$('#drawer').classList.add('open');$('#drawerBackdrop').classList.add('open')}
function closeDrawer(){$('#drawer').classList.remove('open');$('#drawerBackdrop').classList.remove('open')}
function openModal(title,sub,body,foot='',wide=false){$('#modalHead').innerHTML=`<div><h2>${title}</h2><p>${sub}</p></div>${closeButton('modal')}`;$('#modalBody').innerHTML=body;$('#modalFoot').innerHTML=foot||`<button class="btn" data-action="close-modal">Close</button>`;$('#modal').classList.toggle('wide',wide);$('#modal').classList.add('open');$('#modalBackdrop').classList.add('open')}
function closeModal(){$('#modal').classList.remove('open','wide');$('#modalBackdrop').classList.remove('open')}
function employeeDrawer(id){const e=employees.find(x=>x.id===id)||(employees[0]||__pr6EmployeePlaceholder);const body=`<div class="employee-profile"><div class="photo-avatar">${e.initials}</div><div><div class="eyebrow">${e.id} - ${badge(e.status)}</div><h2 style="font-size:22px;margin:0">${e.name}</h2><div class="muted" style="margin-top:4px">${e.title} - ${e.department} - ${e.branch}</div><div class="profile-facts"><div class="fact"><span>Employment type</span><strong>${e.type}</strong></div><div class="fact"><span>Start date</span><strong>${e.start}</strong></div><div class="fact"><span>Payroll currency</span><strong>${e.currency}</strong></div></div></div></div>
 <div class="tabs" style="margin-top:18px"><button class="tab active">Employment</button><button class="tab">Compensation</button><button class="tab">Bank and statutory</button><button class="tab">Documents</button><button class="tab">Leave</button><button class="tab">Training</button><button class="tab">Audit</button></div>
 <div class="grid two"><section class="drawer-section"><h3>Employment details</h3><div class="form-grid">${[['Job title',e.title],['Department',e.department],['Branch',e.branch],['Contract type',e.type],['Start date',e.start],['Line manager','Tawanda Chirenje']].map(x=>`<div class="fact"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div></section><section class="drawer-section"><h3>Payroll readiness</h3><div style="display:flex;gap:16px;align-items:center"><div class="readiness-ring" style="--pct:${e.readiness}%"><strong>${e.readiness}%</strong></div><div style="flex:1">${progressRow('Employee master',100,'Complete','cyan')}${progressRow('Statutory data',e.tax==='Pending'?45:100,e.tax==='Pending'?'Tax number missing':'Complete',e.tax==='Pending'?'red':'cyan')}${progressRow('Documents',e.documents/16*100,`${e.documents} records retained`,'violet')}</div></div></section></div>
 <section class="drawer-section"><h3>Compensation summary</h3><div class="grid four"><div class="fact"><span>Monthly base</span><strong>${maskSalary(e)}</strong></div><div class="fact"><span>Housing allowance</span><strong>${can('salary.view')?money(e.base*.15):'Restricted'}</strong></div><div class="fact"><span>Estimated net</span><strong>${can('salary.view')?money(e.base*.72):'Restricted'}</strong></div><div class="fact"><span>Cost centre</span><strong>${e.department.slice(0,3).toUpperCase()}-001</strong></div></div></section>
 <section class="drawer-section"><h3>Bank and statutory identifiers</h3><div class="grid three"><div class="fact"><span>Bank account</span><strong>${can('salary.view')?e.bank:'Restricted'}</strong></div><div class="fact"><span>Taxpayer reference</span><strong>${can('salary.view')?e.tax:'Restricted'}</strong></div><div class="fact"><span>NSSA number</span><strong>${can('salary.view')?e.nssa:'Restricted'}</strong></div></div></section>
 <section class="drawer-section"><h3>Contact and employee services</h3><div class="grid two"><div class="fact"><span>Email</span><strong>${e.email}</strong></div><div class="fact"><span>Mobile</span><strong>${e.phone}</strong></div><div class="fact"><span>Leave available</span><strong>${e.leave}</strong></div><div class="fact"><span>Training status</span><strong>${e.training}</strong></div></div></section>
 <section class="drawer-section"><h3>Recent governed activity</h3><div class="timeline"><div class="timeline-item"><div><strong>Payroll readiness recalculated</strong><p>Employee master, statutory data and documents were revalidated.</p></div><time>Today</time></div><div class="timeline-item warn"><div><strong>Bank details reviewed</strong><p>Independent verification requested before the payroll freeze.</p></div><time>26 Jun</time></div><div class="timeline-item"><div><strong>Compensation review approved</strong><p>Annual review version 3 approved by delegated authority.</p></div><time>01 Jun</time></div></div></section>`;
 openDrawer(e.name,`${e.id} - Governed employee and compensation record`,body,`${button('Open document vault','employee-documents','', 'folder')}<button class="btn primary" data-action="edit-employee" data-record-id="${e.recordId||''}">${icon('edit')}Edit employee</button>${e.status==='Terminated'?'':e.status==='Suspended'?`<button class="btn" data-action="reinstate-employee" data-record-id="${e.recordId||''}">${icon('check')}Reinstate</button>`:`<button class="btn" data-action="suspend-employee" data-record-id="${e.recordId||''}">${icon('lock')}Suspend</button><button class="btn danger" data-action="terminate-employee" data-record-id="${e.recordId||''}">${icon('x')}Terminate</button>`}`)}
function runDrawer(id){const r=payrollRuns.find(x=>x.id===id)||(payrollRuns[0]||__pr6RunPlaceholder);openDrawer(runReferenceV4(r),`${r.period} - ${r.group}`,`${workflow(r.stage)}<div class="grid three" style="margin:16px 0"><div class="fact"><span>Employees</span><strong>${r.employees}</strong></div><div class="fact"><span>Gross USD</span><strong>${money(r.grossUSD)}</strong></div><div class="fact"><span>Gross ZiG</span><strong>${r.grossZiG?money(r.grossZiG,'ZiG'):'Not applicable'}</strong></div><div class="fact"><span>Deductions</span><strong>${money(r.deductions)}</strong></div><div class="fact"><span>Net USD</span><strong>${money(r.netUSD)}</strong></div><div class="fact"><span>Variance</span><strong>${r.variance==null?'—':(r.variance>0?'+':'')+r.variance+'%'}</strong></div></div><div class="drawer-section"><h3>Control status</h3>${[['Employee population',(r.employees??0)+' employee'+(r.employees===1?'':'s')+' in this run',(r.employees>0)?'Complete':'Pending'],['Approval',r.approvalStatus==='APPROVED'?'Approved':r.approvalStatus==='PENDING'?'Awaiting approval':r.approvalStatus==='REJECTED'?'Returned for correction':'Not yet submitted',r.approvalStatus==='APPROVED'?'Complete':r.approvalStatus==='REJECTED'?'Blocked':'Pending'],['Run stage','Stage '+r.stage+' of 6',r.stage>=6?'Complete':'Review'],['Release',r.rawStatus==='COMPLETED'?'Released':'Not yet released',r.rawStatus==='COMPLETED'?'Complete':'Pending']].map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>${x[1]}</span></div>${badge(x[2])}</div>`).join('')}</div><div class="drawer-section"><h3>Run reference</h3><div class="callout blue"><span class="kpi-icon">${icon('shield')}</span><div><strong>${runReferenceV4(r)}</strong><p>${money(r.grossUSD)} gross across ${r.employees??0} employee${r.employees===1?'':'s'} for this period.</p></div></div></div>`,`${button('Download evidence','download-run-evidence','', 'download')}${button('Open current stage',r.stage<4?'inputs':r.stage===4?'approvals':'close','primary','arrow')}`)}
function exceptionDrawer(id){const model=exceptionViewModelV5(),e=model.all.find(x=>x.id===id);if(!e){toast('Finding no longer exists','Refresh the register to load current employee validation findings.','warn');return}const employee=model.employees.find(x=>x.id===e.employeeId||x.recordId===e.recordId),d=e.sourceData||{},value=e.detail||'Current employee data does not pass this payroll validation.';const facts=[['Employee number',employee?.id||e.employeeId||'—'],['Department',d.department||employee?.department||'—'],['Employee status',d.employeeStatus||employee?.status||'—'],['Current finding',e.type],['Severity',e.severity],['Source',e.source],['Taxpayer reference',d.taxNumberPresent?'Present':'Missing'],['National ID',d.nationalIdPresent?'Present':'Missing'],['Bank details',d.bankDetailsComplete?'Present':'Incomplete'],['Basic salary',d.salaryConfigured?'Recorded':'Not recorded']];const body=`<div class="callout ${e.severity==='Critical'?'red':'amber'}"><span class="kpi-icon ${e.severity==='Critical'?'red':'amber'}">${icon('alert')}</span><div><strong>${__pr6Esc(value)}</strong><p>This finding is derived from current employee source fields returned by the Payroll API. It is recalculated when source data is refreshed.</p></div></div><div class="grid two" style="margin:15px 0">${facts.map(([label,val])=>`<div class="fact"><span>${__pr6Esc(label)}</span><strong>${__pr6Esc(String(val))}</strong></div>`).join('')}</div><div class="callout blue"><span class="kpi-icon">${icon('info')}</span><div><strong>Case history is not available</strong><p>The current backend has no exception assignment, evidence-note or status-history endpoint. Correct the source record using the employee workflow; this finding clears when the live validation no longer detects it.</p></div></div>`;openDrawer(e.type,`${e.id} · ${e.severity} · ${employee?.id||e.employeeId||'Employee'}`,body,employee&&model.canOpenEmployee?`<button type="button" class="btn primary" data-action="open-exception-employee" data-employee-number="${__pr6Esc(employee.id)}">${icon('users')}Open employee record</button>${button('Close','close-drawer')}`:button('Close','close-drawer'))}
function exportExceptionsV5(kind){if(!can('exceptions.view')&&!can('exceptions.resolve')){deny('exceptions.view');return}const m=exceptionViewModelV5(),rows=m.filtered.map(e=>{const name=e.employee||'Employee',number=e.employeeId||'—',value=e.type==='Missing tax number'?'Taxpayer reference: missing':e.type==='Missing national ID'?'National ID: missing':e.type==='Missing bank details'?'Bank details: incomplete':e.type==='No basic salary'?'Basic salary: not recorded':e.type==='Suspended employee'?'Employee status: suspended':'Review employee source data';return [e.id,number,name,e.type,e.severity,e.source,value]});const fn=window.__PAYROLL_V6_EXPORT_EXCEPTIONS__;if(typeof fn!=='function'){toast('Export unavailable','The branded export service is not ready.','warn');return}void fn(kind,{title:'Payroll Exception Register',subtitle:'Current payroll data-quality findings derived from live employee records.',columns:['Exception reference','Employee number','Employee','Finding','Severity','Source','Current data gap'],rows,filename:'payroll-exception-register',landscape:true,meta:[['Findings',String(rows.length)],['Severity filter',state.exceptionSeverity],['Source filter',state.exceptionSource],['Search',state.exceptionSearch||'All findings']],note:'Findings are recalculated from Payroll API employee records. Case assignment, age and investigation history are not exposed by the API. Employee database IDs and salary values are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'})}
document.addEventListener('click',event=>{const exportButton=event.target.closest('[data-exception-export]');if(exportButton){event.preventDefault();event.stopImmediatePropagation();exportExceptionsV5(exportButton.dataset.exceptionExport);return}const pageButton=event.target.closest('[data-exception-page]');if(pageButton){event.preventDefault();event.stopImmediatePropagation();state.exceptionPage=Number(pageButton.dataset.exceptionPage)||1;render();return}const employeeButton=event.target.closest('[data-action="open-exception-employee"]');if(employeeButton){event.preventDefault();event.stopImmediatePropagation();const number=employeeButton.dataset.employeeNumber,employee=exceptionViewModelV5().employees.find(x=>x.id===number);if(!employee){toast('Employee record unavailable','Refresh the exception register and try again.','warn');return}closeDrawer();goPage('employees');requestAnimationFrame(()=>employeeDrawer(employee.id))}},true);
document.addEventListener('input',event=>{if(event.target?.id!=='exceptionSearch')return;const input=event.target,position=input.selectionStart;state.exceptionSearch=input.value;state.exceptionPage=1;render();const next=document.querySelector('#exceptionSearch');next?.focus();if(position!==null)next?.setSelectionRange(position,position)},true);
document.addEventListener('change',event=>{if(event.target?.id==='exceptionSeverity'){state.exceptionSeverity=event.target.value;state.exceptionPage=1;render()}else if(event.target?.id==='exceptionSource'){state.exceptionSource=event.target.value;state.exceptionPage=1;render()}else if(event.target?.id==='exceptionPageSize'){state.exceptionPageSize=Number(event.target.value)||10;state.exceptionPage=1;render()}},true);
function documentHtml(doc){return `<div class="document-page" id="documentEditor" contenteditable="false"><div class="doc-head"><div><div class="doc-brand">MATANHO</div><div style="font-size:10px;color:#1768ff;font-weight:800">PAYROLL AND HUMAN CAPITAL</div></div><div class="doc-meta">Document ID: ${doc.id}<br>Version: ${doc.versions}<br>Classification: ${doc.class}</div></div><h1>${doc.name}</h1><p><strong>Status:</strong> ${doc.status} &nbsp; <strong>Owner:</strong> ${doc.owner}</p><p>${doc.content}</p><h2>1. Purpose and scope</h2><p>This governed record supports the payroll and human-capital control environment for Arcus Holdings Private Limited. It is generated from approved source data and retains a complete version, approval and distribution history.</p><h2>2. Control summary</h2><table><thead><tr><th>Control</th><th>Result</th><th>Evidence</th></tr></thead><tbody><tr><td>Population reconciliation</td><td>Complete</td><td>128 employees reconciled</td></tr><tr><td>Calculation verification</td><td>Complete</td><td>Ruleset ZW-2026.06</td></tr><tr><td>Exception management</td><td>Review</td><td>3 critical cases open</td></tr><tr><td>Maker-checker approval</td><td>Pending</td><td>4 of 6 controls complete</td></tr></tbody></table><h2>3. Management commentary</h2><p>Click Edit to update this section. Saved changes create a new document version and are recorded in the immutable audit trail.</p><h2>4. Approval record</h2><p>Prepared by: Rudo Sibanda<br>Reviewed by: Tariro Moyo<br>Final authority: Pending</p></div>`}
function documentDrawer(id){if(__pr6IsLive())return __pr6DocumentDrawer(id);const d=documents.find(x=>x.id===id)||(documents[0]||__pr6DocumentPlaceholder);state.activeDoc=d.id;openDrawer(d.name,`${d.id} - ${d.folder} - Version ${d.versions}`,`<div class="editable-note">Preview mode. Select Edit to make governed changes and create a new version.</div><div class="doc-preview">${documentHtml(d)}</div>`,`${button('Download editable DOC','download-doc','', 'download')}${button('Export PDF','download-doc-pdf','', 'file')}${button('Edit document','edit-document','primary','edit')}`)}
function openNewEmployee(candidate){if(!can('employee.edit'))return deny('employee.edit');const c=candidate||{};const bits=(c.name||'').split(' ');const first=c.firstName||bits.shift()||'',last=c.lastName||bits.join(' ');const date=c.startDate?String(c.startDate).slice(0,10):new Date().toISOString().slice(0,10);const done=c.status==='COMPLETE';openModal(done?'Employee onboarding record':'Employee Onboarding',done?'This candidate has completed onboarding.':'Save a draft case or create the employee account after confirming the details.',`<input type="hidden" id="onbCandidateId" value="${__pr6Esc(c.id||'')}"><div class="stepper"><div class="step done"><b>1</b><span>Identity</span></div><div class="step active"><b>2</b><span>Employment</span></div><div class="step"><b>3</b><span>Compensation</span></div><div class="step"><b>4</b><span>Review</span></div></div><div class="form-grid"><div class="form-field"><label>First name</label><input id="newFirst" value="${__pr6Esc(first)}" ${done?'disabled':''} required></div><div class="form-field"><label>Surname</label><input id="newLast" value="${__pr6Esc(last)}" ${done?'disabled':''} required></div><div class="form-field"><label>Work email</label><input id="newEmail" type="email" value="${__pr6Esc(c.email||'')}" ${done?'disabled':''} required></div><div class="form-field"><label>Employee number</label><input id="newEmployeeNumber" value="${__pr6Esc(checklist.employeeNumber||'')}" placeholder="Employee number" required ${done?'disabled':''}></div><div class="form-field"><label>Job title</label><input id="newTitle" value="${__pr6Esc(c.position||'')}" ${done?'disabled':''}></div><div class="form-field"><label>Department</label><input id="newDept" value="${__pr6Esc(c.department||'')}" ${done?'disabled':''}></div><div class="form-field"><label>Start date</label><input id="newStartDate" type="date" value="${date}" ${done?'disabled':''}></div><div class="form-field"><label>Payroll currency</label><select id="newCurrency" ${done?'disabled':''}><option value="">Use payroll default</option>${(__pr6Ref().currencies||[]).map(x=>`<option value="${__pr6Esc(x.id)}" ${compensation.currencyId===x.id?'selected':''}>${__pr6Esc(x.code||x.currencyCode||x.name||'Currency')}</option>`).join('')}</select></div><div class="form-field"><label>Basic salary</label><input id="newBasicSalary" type="number" min="0" step="0.01" value="${__pr6Esc(compensation.basicSalary||'')}" placeholder="0.00" required ${done?'disabled':''}></div><div class="form-field"><label>USD salary allocation (%)</label><input id="newUsdSplit" type="number" min="0" max="100" value="${__pr6Esc(compensation.salarySplitUsdPct??100)}" ${done?'disabled':''}></div><div class="form-field"><label>ZiG salary allocation (%)</label><input id="newZigSplit" type="number" min="0" max="100" value="${__pr6Esc(compensation.salarySplitZigPct??0)}" ${done?'disabled':''}></div><div class="form-field full"><label>Profile photo (optional)</label><input id="newPicture" type="file" accept="image/png,image/jpeg,image/webp" ${done?'disabled':''}></div><div class="form-field full"><div class="callout blue"><div><strong>Account security</strong><p>A random temporary password is generated server-side. If email delivery succeeds, the employee receives it and must change it at first sign-in. The password is never displayed here.</p></div></div></div></div>`,done?button('Close','close-modal'):button('Save draft','save-onboarding','','file')+button('Create employee and send invitation','complete-onboarding','primary','arrow'),true)}
function renderOnboardingFormStepV4(step){state.onboardingFormStep=Math.min(4,Math.max(1,Number(step)||1));const current=state.onboardingFormStep;document.querySelectorAll('#modalBody [data-onboarding-step-panel]').forEach(panel=>{panel.hidden=Number(panel.dataset.onboardingStepPanel)!==current});document.querySelectorAll('#modalBody [data-onboarding-step-indicator]').forEach(el=>{const n=Number(el.dataset.onboardingStepIndicator);el.classList.toggle('active',n===current);el.classList.toggle('done',n<current);el.setAttribute('aria-current',n===current?'step':'false')});const name=[document.querySelector('#newFirst')?.value,document.querySelector('#newLast')?.value].filter(Boolean).join(' ');const summary=document.querySelector('#onboardingReviewSummary');if(summary)summary.innerHTML=`<div class="grid two"><div class="fact"><span>Employee</span><strong>${__pr6Esc(name||'Not entered')}</strong></div><div class="fact"><span>Work email</span><strong>${__pr6Esc(document.querySelector('#newEmail')?.value||'Not entered')}</strong></div><div class="fact"><span>Employee number</span><strong>${__pr6Esc(document.querySelector('#newEmployeeNumber')?.value||'Not entered')}</strong></div><div class="fact"><span>Position and department</span><strong>${__pr6Esc([document.querySelector('#newTitle')?.value,document.querySelector('#newDept')?.value].filter(Boolean).join(' · ')||'Not entered')}</strong></div><div class="fact"><span>Monthly base salary</span><strong>${__pr6Esc(document.querySelector('#newBasicSalary')?.value||'Not entered')} ${__pr6Esc(document.querySelector('#newCurrency')?.selectedOptions?.[0]?.textContent||'payroll currency')}</strong></div><div class="fact"><span>Start date</span><strong>${__pr6Esc(document.querySelector('#newStartDate')?.value||'Not entered')}</strong></div></div>`;const foot=document.querySelector('#modalFoot');if(!foot)return;foot.innerHTML=`${current>1?button('Back','onboarding-step-back','','arrow'):''}${button('Save draft','save-onboarding','','file')}${current<4?button('Continue','onboarding-step-next','primary','arrow'):button('Complete onboarding and create employee','complete-onboarding','primary','check')}`}
function validateOnboardingStepV4(step){const v=id=>String(document.querySelector(`#${id}`)?.value||'').trim();let message='';if(step===1){if(!v('newFirst')||!v('newLast'))message='Enter the employee’s first name and surname.';else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('newEmail')))message='Enter a valid work email address.';else if(!v('newEmployeeNumber'))message='Enter an employee number.'}if(step===2){if(!v('newTitle')||!v('newDept')||!v('newStartDate'))message='Enter the position, department and start date.'}if(step===3){const salary=Number(v('newBasicSalary')),usd=Number(v('newUsdSplit')),zig=Number(v('newZigSplit'));if(v('newBasicSalary')===''||!Number.isFinite(salary)||salary<0)message='Enter a valid non-negative monthly salary.';else if(!Number.isFinite(usd)||!Number.isFinite(zig)||usd<0||zig<0||usd>100||zig>100||usd+zig!==100)message='USD and ZiG allocations must total exactly 100%.'}if(message){toast('Complete the required fields',message,'warn');return false}return true}
function openNewEmployee(candidate){if(!can('employee.edit'))return deny('employee.edit');const c=candidate||{},bits=(c.name||'').split(' '),first=c.firstName||bits.shift()||'',last=c.lastName||bits.join(' '),date=c.startDate?String(c.startDate).slice(0,10):'',checklist=c.checklist||{},compensation=checklist.compensationDetails||{},done=c.status==='COMPLETE';state.onboardingFormStep=1;openModal(done?'Employee onboarding record':'Employee onboarding',done?'This employee has completed onboarding.':'Complete each step to create the employee record and account.',`<input type="hidden" id="onbCandidateId" value="${__pr6Esc(c.id||'')}"><div class="onboarding-stepper" aria-label="Onboarding steps">${[['Identity','1'],['Employment','2'],['Compensation','3'],['Review','4']].map(([label,n])=>`<div class="onboarding-step-indicator ${n==='1'?'active':''}" data-onboarding-step-indicator="${n}"><span>${n}</span><strong>${label}</strong></div>`).join('')}</div><section class="onboarding-step-panel" data-onboarding-step-panel="1"><div class="form-grid"><div class="form-field"><label for="newFirst">First name <b class="required-mark">Required</b></label><input id="newFirst" value="${__pr6Esc(first)}" autocomplete="given-name" ${done?'disabled':''}></div><div class="form-field"><label for="newLast">Surname <b class="required-mark">Required</b></label><input id="newLast" value="${__pr6Esc(last)}" autocomplete="family-name" ${done?'disabled':''}></div><div class="form-field"><label for="newEmail">Work email <b class="required-mark">Required</b></label><input id="newEmail" type="email" value="${__pr6Esc(c.email||'')}" autocomplete="email" ${done?'disabled':''}></div><div class="form-field"><label for="newEmployeeNumber">Employee number <b class="required-mark">Required</b></label><input id="newEmployeeNumber" placeholder="Employee number" ${done?'disabled':''}></div></div></section><section class="onboarding-step-panel" data-onboarding-step-panel="2" hidden><div class="form-grid"><div class="form-field"><label for="newTitle">Position <b class="required-mark">Required</b></label><input id="newTitle" value="${__pr6Esc(c.position||'')}" ${done?'disabled':''}></div><div class="form-field"><label for="newDept">Department code <b class="required-mark">Required</b></label><input id="newDept" value="${__pr6Esc(c.department||'')}" ${done?'disabled':''}></div><div class="form-field"><label for="newStartDate">Start date <b class="required-mark">Required</b></label><input id="newStartDate" type="date" value="${date}" ${done?'disabled':''}></div></div></section><section class="onboarding-step-panel" data-onboarding-step-panel="3" hidden><div class="form-grid"><div class="form-field"><label for="newBasicSalary">Monthly base salary <b class="required-mark">Required</b></label><input id="newBasicSalary" type="number" min="0" step="0.01" placeholder="0.00" ${done?'disabled':''}></div><div class="form-field"><label for="newCurrency">Payroll currency</label><select id="newCurrency" ${done?'disabled':''}><option value="">Use payroll default</option>${(__pr6Ref().currencies||[]).map(x=>`<option value="${__pr6Esc(x.id)}">${__pr6Esc(x.code||x.currencyCode||x.name||'Currency')}</option>`).join('')}</select></div><div class="form-field"><label for="newUsdSplit">USD salary allocation (%)</label><input id="newUsdSplit" type="number" min="0" max="100" value="100" ${done?'disabled':''}></div><div class="form-field"><label for="newZigSplit">ZiG salary allocation (%)</label><input id="newZigSplit" type="number" min="0" max="100" value="0" ${done?'disabled':''}></div><p class="muted onboarding-help">USD and ZiG allocations must add up to 100%.</p></div></section><section class="onboarding-step-panel" data-onboarding-step-panel="4" hidden><h3>Review employee details</h3><div id="onboardingReviewSummary"></div><div class="callout blue" style="margin-top:14px"><div><strong>Secure first sign-in</strong><p>A random temporary password is generated by the server. It is emailed when delivery succeeds, and the employee must change it when signing in for the first time.</p></div></div></section>`,done?button('Close','close-modal'):button('Continue','onboarding-step-next','primary','arrow'),true);renderOnboardingFormStepV4(1)}
function openNewRun(){if(!can('payroll.prepare'))return deny('payroll.prepare');openModal('Create Payroll Run','Configure the period, pay group, dual-currency treatment, exchange rate and statutory rules.',`<div class="stepper"><div class="step active"><b>1</b><span>Period and currency</span></div><div class="step"><b>2</b><span>Inputs</span></div><div class="step"><b>3</b><span>Validate</span></div><div class="step"><b>4</b><span>Review</span></div></div><div class="form-grid"><div class="form-field"><label>Pay period</label><select id="runPeriod">${(()=>{const o=__pr6PeriodOptions();return o?o.map(x=>`<option>${x}</option>`).join(''):'<option>July 2026</option><option>June 2026</option>'})()}</select></div><div class="form-field"><label>Pay group</label><select id="runGroup"><option>Monthly Staff</option><option>Executives</option><option>Contract Staff</option></select></div><div class="form-field"><label>Calculation date</label><input type="date" value="2026-07-24"></div><div class="form-field"><label>Payment date</label><input type="date" value="2026-07-31"></div><div class="form-field"><label>Processing currencies</label><select><option>USD and ZiG</option><option>USD only</option><option>ZiG only</option></select></div><div class="form-field"><label>Exchange rate source</label><select><option>Approved treasury rate</option><option>RBZ reference rate</option></select></div><div class="form-field"><label>USD / ZiG rate</label><input value="31.8420"></div><div class="form-field"><label>Statutory ruleset</label><select><option>ZW-2026.06 - Published</option></select></div><div class="form-field full"><div class="callout blue"><span class="kpi-icon">${icon('shield')}</span><div><strong>Impact preview</strong><p>128 employees in scope. 4 employees require data review before inputs can be committed.</p></div></div></div></div>`,`${button('Save draft','save-run','', 'file')}${button('Create and continue','create-run','primary','arrow')}`)}
function uploadDocumentModal(){if(__pr6IsLive())return __pr6UploadModal();if(!can('documents.manage'))return deny('documents.manage');openModal('Upload to Document Vault','Files are virus scanned, classified, versioned and protected by data-scope permissions.',`<div class="form-grid"><div class="form-field full"><label>Select files</label><input type="file" id="docFile" multiple></div><div class="form-field"><label>Folder</label><select id="docFolder">${folders.slice(1).map(f=>`<option>${f}</option>`).join('')}</select></div><div class="form-field"><label>Classification</label><select id="docClass"><option>Internal</option><option>Confidential</option><option>Restricted</option><option>Highly restricted</option></select></div><div class="form-field"><label>Retention policy</label><select><option>Payroll evidence - 7 years</option><option>Employee record - employment + 7 years</option><option>Policy - superseded + 7 years</option></select></div><div class="form-field"><label>Approval workflow</label><select><option>HR Manager review</option><option>Payroll Manager review</option><option>No approval required</option></select></div><div class="form-field full"><label>Description</label><textarea id="docDescription" placeholder="Describe the document and its control purpose..."></textarea></div></div>`,`${button('Cancel','close-modal')}${button('Upload and classify','confirm-upload','primary','upload')}`)}
function createDocumentModal(){if(!can('documents.manage'))return deny('documents.manage');openModal('Create Editable Document','Start a governed document from a controlled template.',`<div class="form-grid"><div class="form-field full"><label>Document title</label><input id="createdDocName" value="July 2026 Payroll Processing Checklist"></div><div class="form-field"><label>Template</label><select><option>Payroll control checklist</option><option>Policy document</option><option>Employee letter</option><option>Management memo</option></select></div><div class="form-field"><label>Folder</label><select id="createdDocFolder">${folders.slice(1).map(f=>`<option>${f}</option>`).join('')}</select></div><div class="form-field"><label>Classification</label><select><option>Restricted</option><option>Internal</option><option>Confidential</option></select></div><div class="form-field"><label>Review owner</label><select><option>Tariro Moyo</option><option>Chipo Ndlovu</option></select></div><div class="form-field full"><label>Initial purpose</label><textarea id="createdDocContent">Governed checklist for input validation, payroll calculation, exception resolution, maker-checker approval and release controls.</textarea></div></div>`,`${button('Cancel','close-modal')}${button('Create and edit','confirm-create-document','primary','edit')}`)}
function reportContent(r){const title=r.name;return `<div class="document-page" id="reportEditor" contenteditable="true"><div class="doc-head"><div><div class="doc-brand">MATANHO</div><div style="font-size:10px;color:#1768ff;font-weight:800">PAYROLL COMPLIANCE REPORT</div></div><div class="doc-meta">Period: June 2026<br>Generated: 28 Jun 2026<br>Status: Draft for review</div></div><h1>${title}</h1><p><strong>Entity:</strong> Arcus Holdings Private Limited<br><strong>Prepared by:</strong> ${state.role==='Employee'?'Rudo Sibanda':'Tariro Moyo'}<br><strong>Source payroll:</strong> PAY-2026-06-M - ruleset ZW-2026.06</p><h2>Executive control summary</h2><p>This report was generated from governed payroll, employee-master, statutory-rule and finance-control data. All values retain source lineage to calculation version v2026.06.4 and the immutable payroll event ledger.</p><table><thead><tr><th>Control measure</th><th>June 2026</th><th>May 2026</th><th>Variance</th></tr></thead><tbody><tr><td>Employees processed</td><td>128</td><td>126</td><td>+2</td></tr><tr><td>Gross payroll - USD</td><td>264,720.00</td><td>256,180.00</td><td>+3.3%</td></tr><tr><td>Gross payroll - ZiG</td><td>7,459,664</td><td>7,134,000</td><td>+4.6%</td></tr><tr><td>Total deductions - USD</td><td>77,444.00</td><td>74,980.00</td><td>+3.3%</td></tr><tr><td>Net pay - USD</td><td>187,276.00</td><td>181,200.00</td><td>+3.4%</td></tr></tbody></table><h2>Reconciliation and exceptions</h2><p>Payroll population and gross-to-net control totals reconcile to the current calculation. Three critical exceptions remain open and prevent final release. These relate to a bank-account change, missing taxpayer reference and contract-end-date validation.</p><table><thead><tr><th>Reference</th><th>Issue</th><th>Owner</th><th>Status</th></tr></thead><tbody><tr><td>EXC-0612</td><td>Bank account change within freeze window</td><td>Tariro Moyo</td><td>Open</td></tr><tr><td>EXC-0617</td><td>Missing tax number</td><td>Chipo Ndlovu</td><td>Open</td></tr><tr><td>EXC-0629</td><td>Contract end date before payment date</td><td>Chipo Ndlovu</td><td>Open</td></tr></tbody></table><h2>Compliance conclusion</h2><p>Calculation controls are substantially complete. Filing or release approval must not be recorded until all report-specific exceptions are resolved and independently evidenced.</p><h2>Approval record</h2><p>Prepared by: ____________________ Date: __________<br>Reviewed by: ____________________ Date: __________<br>Approved by: ____________________ Date: __________</p></div>`}
function generateReport(id){const r=reportTemplates.find(x=>x.id===id)||reportTemplates[0];if(!can(r.perm)&&!can('reports.generate'))return deny(r.perm);state.reportDraft={...r,version:1};openModal(r.name,`${r.category} - Editable generated report - ${r.freq}`,`<div class="editable-note">Edit mode is active. Changes remain a draft until Save Version is selected.</div><div class="doc-preview">${reportContent(r)}</div>`,`${button('Download DOC','download-report-doc','', 'download')}${button('Export PDF','download-report-pdf','', 'file')}${button('Preview','preview-report','soft','eye')}${button('Save version','save-report','primary','check')}`,true);logEvent('REPORT_DRAFT_CREATED',r.id,`Generated editable ${r.name} draft`,'Change')}
function approvalDecisionModal(){if(!can('payroll.approve'))return deny('payroll.approve');openModal('Record Payroll Approval Decision','The decision, comment, evidence and identity verification will be permanently retained.',`<div class="form-grid"><div class="form-field"><label>Payroll run</label><input value="PAY-2026-06-M" disabled></div><div class="form-field"><label>Decision</label><select id="decisionType"><option>Return for correction</option><option>Conditional approval</option><option>Approve</option><option>Reject</option></select></div><div class="form-field full"><label>Decision basis</label><textarea id="decisionBasis">Return for correction until all critical exceptions are resolved and bank-account-change verification is complete.</textarea></div><div class="form-field"><label>Authentication method</label><select><option>Microsoft Entra MFA</option><option>Hardware security key</option></select></div><div class="form-field"><label>Delegated authority</label><input value="Payroll Manager - Level 2" disabled></div><div class="form-field full"><div class="callout amber"><span class="kpi-icon amber">${icon('shield')}</span><div><strong>Segregation control applied</strong><p>The current user is not the payroll preparer. Positive approval remains blocked by critical exceptions.</p></div></div></div></div>`,`${button('Cancel','close-modal')}${button('Record decision','record-decision','primary','shield')}`)}
function genericModal(title,sub){openModal(title,sub,`<div class="form-grid"><div class="form-field full"><label>Name or reference</label><input value="${title}"></div><div class="form-field"><label>Effective date</label><input type="date" value="2026-07-01"></div><div class="form-field"><label>Approval workflow</label><select><option>Maker-checker approval</option><option>HR Manager review</option><option>Payroll Manager review</option></select></div><div class="form-field full"><label>Change reason</label><textarea>Configuration change created from the Matanho payroll control environment.</textarea></div><div class="form-field full"><div class="callout blue"><span class="kpi-icon">${icon('audit')}</span><div><strong>Versioning and audit are enabled</strong><p>Saving creates a draft. It will not affect payroll until independently approved and published.</p></div></div></div></div>`,`${button('Cancel','close-modal')}${button('Save draft','generic-save','primary','check')}`)}

function openComponentForm(record = null, kind = 'EARNING') {
  const ref = __pr6Ref(), r = record || {}, today = new Date().toISOString().slice(0, 10);
  const currencies = Array.isArray(ref.currencies) ? ref.currencies : [];
  const accounts = Array.isArray(ref.componentAccounts) ? ref.componentAccounts : [];
  const options = (items, value, label) => items.map(x => `<option value="${__pr6Esc(x.id)}" ${x.id === value ? 'selected' : ''}>${__pr6Esc(label(x))}</option>`).join('');
  openModal(record ? 'Edit Pay Component' : 'Create Pay Component', 'Configure the calculation and ledger account for this component.',
    `<div class="form-grid"><input type="hidden" id="componentId" value="${__pr6Esc(r.id || '')}"><div class="form-field"><label>Component type</label><select id="componentType" ${record ? 'disabled' : ''}><option value="EARNING" ${kind === 'EARNING' ? 'selected' : ''}>Earning</option><option value="DEDUCTION" ${kind === 'DEDUCTION' ? 'selected' : ''}>Deduction</option></select></div><div class="form-field"><label>Code</label><input id="componentCode" value="${__pr6Esc(r.code || '')}" placeholder="e.g. HOUSING"></div><div class="form-field full"><label>Name</label><input id="componentName" value="${__pr6Esc(r.name || '')}"></div><div class="form-field full"><label>Description</label><textarea id="componentDescription">${__pr6Esc(r.description || '')}</textarea></div><div class="form-field full"><label>GL account</label><select id="componentGlAccount"><option value="">Use default payroll account</option>${accounts.map(a=>`<option value="${__pr6Esc(a.id)}" data-account-type="${__pr6Esc(String(a.accountType||'').toLowerCase())}" ${a.id===r.glAccountId?'selected':''}>${__pr6Esc(a.accountNo)} · ${__pr6Esc(a.accountName)} (${__pr6Esc(a.accountType)})</option>`).join('')}</select><small>Choose an expense account for an earning. Additional deductions require a liability account before posting.</small></div><div class="form-field" data-component-only="EARNING"><label>Earning calculation</label><select id="componentCalculationMethod"><option value="FIXED" ${r.calculationMethod!=='PERCENT_BASIC'?'selected':''}>Fixed amount per employee</option><option value="PERCENT_BASIC" ${r.calculationMethod==='PERCENT_BASIC'?'selected':''}>Percentage of basic salary</option></select></div><div class="form-field" data-component-only="EARNING"><label>Earning rate (% of basic)</label><input id="componentCalculationRate" type="number" min="0" max="100" step="0.01" value="${__pr6Esc(r.calculationRate ?? '')}"></div><div class="form-field" data-component-only="DEDUCTION"><label>Currency (deductions)</label><select id="componentCurrencyId"><option value="">Follow employee salary split (USD + ZiG)</option>${options(currencies, r.currencyId, c => `${c.code} · ${c.name || c.code}`)}</select></div><div class="form-field" data-component-only="DEDUCTION"><label>Deduction rate (%)</label><input id="componentRate" type="number" min="0" max="100" step="0.01" value="${__pr6Esc(r.rate ?? 0)}"></div><div class="form-field" data-component-only="DEDUCTION"><label>Threshold</label><input id="componentThreshold" type="number" min="0" step="0.01" value="${__pr6Esc(r.threshold ?? '')}"></div><div class="form-field" data-component-only="DEDUCTION"><label>Deduction ceiling</label><input id="componentCeiling" type="number" min="0" step="0.01" value="${__pr6Esc(r.ceiling ?? '')}"></div><div class="form-field" data-component-only="DEDUCTION"><label>Effective date (deductions)</label><input id="componentEffectiveDate" type="date" value="${__pr6Esc(r.effectiveDate ? String(r.effectiveDate).slice(0,10) : today)}"></div><div class="form-field" data-component-only="DEDUCTION"><label>End date (deductions)</label><input id="componentEndDate" type="date" value="${__pr6Esc(r.endDate ? String(r.endDate).slice(0,10) : '')}"></div><div class="form-field"><label data-component-only="EARNING"><input id="componentTaxable" type="checkbox" ${r.isTaxable !== false ? 'checked' : ''}> Taxable earning</label><label data-component-only="DEDUCTION" style="margin-top:10px"><input id="componentStatutory" type="checkbox" ${r.isStatutory ? 'checked' : ''}> Statutory deduction</label></div><div class="form-field full"><small>Assign earnings to employees in salary structures. Fixed earnings use the assigned amount; percentage earnings use basic salary. Deductions use the configured rate or an assigned fixed amount.</small></div></div>`,
    `${button('Cancel','close-modal')}${record && !r.isStatutory ? button('Assign employees','assign-component','', 'users') : ''}${button('Save component','save-pay-component','primary','check')}`);
  const type=document.querySelector('#componentType'), account=document.querySelector('#componentGlAccount');
  const sync=()=>{if(!type)return; document.querySelectorAll('[data-component-only]').forEach(el=>{el.style.display=el.dataset.componentOnly===type.value?'':'none';});if(account){Array.from(account.options).forEach(option=>{if(option.value)option.hidden=!String(option.dataset.accountType||'').includes(type.value==='EARNING'?'expense':'liabil');});if(account.selectedOptions[0]?.hidden)account.value='';}};
  sync(); if(type)type.addEventListener('change',sync);
}

function openComponentAssignmentForm(record, kind) {
  const ref=__pr6Ref(), staff=Array.isArray(ref.componentEmployees)?ref.componentEmployees:[], currencies=(ref.currencies||[]).filter(c=>['USD','ZIG'].includes(String(c.code).toUpperCase()));
  const earning=kind==='EARNING', fixed=earning && record.calculationMethod!=='PERCENT_BASIC';
  const deductionCurrency=record.currency?.code||record.currencyCode||null;
  const deductionAmountLabel=deductionCurrency?`Fixed deduction amount (${deductionCurrency}) (optional)`:'Fixed deduction amount (salary split) (optional)';
  const deductionAmountHelp=deductionCurrency?`Enter the fixed amount in ${deductionCurrency}. It applies only to that currency leg.`:'Enter the base amount to split by each selected employee USD/ZiG salary allocation. Leave empty to use the component rate or override.';
  openModal(`Assign ${record.name}`, 'Select employees and set the effective period for this component.', `<div class="form-grid"><input id="componentAssignmentId" type="hidden" value="${__pr6Esc(record.id)}"><input id="componentAssignmentKind" type="hidden" value="${__pr6Esc(kind)}"><div class="form-field full"><label>Employees</label><select id="componentAssignmentEmployees" multiple size="6">${staff.map(e=>`<option value="${__pr6Esc(e.id)}">${__pr6Esc(e.employeeNumber)} · ${__pr6Esc([e.user?.firstName,e.user?.lastName].filter(Boolean).join(' '))}</option>`).join('')}</select><small>Use Ctrl or Command to select multiple employees.</small></div>${earning?`<div class="form-field"><label>Currency</label><select id="componentAssignmentCurrency"><option value="">Split using salary currencies</option>${currencies.map(c=>`<option value="${__pr6Esc(c.id)}">${__pr6Esc(c.code)}</option>`).join('')}</select></div>`:''}<div class="form-field"><label>${earning ? 'Fixed amount' : deductionAmountLabel}</label><input id="componentAssignmentAmount" type="number" min="0" step="0.01" ${earning && !fixed?'disabled':''}><small>${earning && !fixed?'The component calculates a percentage of basic salary.':earning?'Amount per selected employee.':deductionAmountHelp}</small></div>${earning?'':`<div class="form-field"><label>Rate override (%)</label><input id="componentAssignmentRate" type="number" min="0" max="100" step="0.01"><small>Leave empty to use the component rate.</small></div>`}<div class="form-field"><label>Effective from</label><input id="componentAssignmentFrom" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="form-field"><label>Effective to</label><input id="componentAssignmentTo" type="date"></div></div>`,`${button('Cancel','close-modal')}${button('Assign component','save-component-assignment','primary','check')}`);
}

function openTaxRuleForm(record = null) {
  const r=record || {}, currencies=__pr6Ref().currencies || [], today=new Date().toISOString().slice(0,10);
  const options=[...new Set(['PAYE','NSSA','AIDS_LEVY','CUSTOM',r.type].filter(Boolean))].map(v=>`<option value="${__pr6Esc(v)}" ${r.type===v?'selected':''}>${__pr6Esc(v.replace('_',' '))}</option>`).join('');
  openModal(record ? 'Edit Legacy Tax Rule' : 'Create Legacy Tax Rule', 'Payroll runs use the PAYE brackets and statutory levies configured on this page.',
    `<div class="form-grid"><input id="taxRuleId" type="hidden" value="${__pr6Esc(r.id||'')}"><div class="form-field"><label>Rule name</label><input id="taxRuleName" value="${__pr6Esc(r.name||'')}"></div><div class="form-field"><label>Rule type</label><select id="taxRuleType">${options}</select></div><div class="form-field"><label>Currency</label><select id="taxRuleCurrencyId"><option value="">Default currency</option>${currencies.map(c=>`<option value="${__pr6Esc(c.id)}" ${c.id===r.currencyId?'selected':''}>${__pr6Esc(c.code)}</option>`).join('')}</select></div><div class="form-field"><label>Rate (%)</label><input id="taxRuleRate" type="number" min="0" max="100" step="0.01" value="${__pr6Esc(r.rate ?? 0)}"></div><div class="form-field"><label>Threshold</label><input id="taxRuleThreshold" type="number" min="0" step="0.01" value="${__pr6Esc(r.threshold ?? '')}"></div><div class="form-field"><label>Ceiling</label><input id="taxRuleCeiling" type="number" min="0" step="0.01" value="${__pr6Esc(r.ceiling ?? '')}"></div><div class="form-field"><label>Effective from</label><input id="taxRuleEffectiveDate" type="date" value="${__pr6Esc(r.effectiveDate ? String(r.effectiveDate).slice(0,10) : today)}"></div><div class="form-field"><label>Effective to</label><input id="taxRuleEndDate" type="date" value="${__pr6Esc(r.endDate ? String(r.endDate).slice(0,10) : '')}"></div>${record?`<div class="form-field"><label>State</label><select id="taxRuleActive"><option value="true" ${r.isActive!==false?'selected':''}>Active</option><option value="false" ${r.isActive===false?'selected':''}>Inactive</option></select></div>`:''}</div>`,
    `${button('Cancel','close-modal')}${button('Save rule','save-tax-rule','primary','check')}`);
}

function openBracketForm(record = null) {
  const r=record || {}, today=new Date().toISOString().slice(0,10);
  openModal(record ? 'Edit PAYE Bracket' : 'Add PAYE Bracket','Configure a progressive tax band for a currency.',`<div class="form-grid"><input id="bracketId" type="hidden" value="${__pr6Esc(r.id||'')}"><div class="form-field"><label>Currency code</label><select id="bracketCurrency"><option value="USD" ${String(r.currencyCode||'USD').toUpperCase()==='USD'?'selected':''}>USD</option><option value="ZIG" ${String(r.currencyCode||'USD').toUpperCase()==='ZIG'?'selected':''}>ZiG (ZIG)</option></select></div><div class="form-field"><label>Lower bound</label><input id="bracketLower" type="number" min="0" step="0.001" value="${__pr6Esc(r.lowerBound ?? 0)}"></div><div class="form-field"><label>Upper bound</label><input id="bracketUpper" type="number" min="0" step="0.001" value="${__pr6Esc(r.upperBound ?? '')}"></div><div class="form-field"><label>Marginal rate (%)</label><input id="bracketRate" type="number" min="0" max="100" step="0.01" value="${__pr6Esc(r.marginalRate == null ? '' : Number(r.marginalRate)*100)}"></div><div class="form-field"><label>Deduction offset</label><input id="bracketOffset" type="number" min="0" step="0.001" value="${__pr6Esc(r.deductionOffset ?? 0)}"></div><div class="form-field"><label>Effective from</label><input id="bracketEffectiveFrom" type="date" value="${__pr6Esc(r.effectiveFrom ? String(r.effectiveFrom).slice(0,10) : today)}"></div><div class="form-field"><label>Effective to</label><input id="bracketEffectiveTo" type="date" value="${__pr6Esc(r.effectiveTo ? String(r.effectiveTo).slice(0,10) : '')}"></div>${record?`<div class="form-field"><label>State</label><select id="bracketActive"><option value="true" ${r.isActive!==false?'selected':''}>Active</option><option value="false" ${r.isActive===false?'selected':''}>Inactive</option></select></div>`:''}</div>`,`${button('Cancel','close-modal')}${button('Save bracket','save-statutory-bracket','primary','check')}`);
}

function openLevyForm(record = null) {
  const r=record || {}, today=new Date().toISOString().slice(0,10), codes=[...new Set(['NSSA_RATE','NSSA_CEILING','AIDS_RATE','SDL_RATE',r.levyCode].filter(Boolean))];
  openModal(record ? 'Edit Statutory Levy' : 'Configure Statutory Levy','Save an effective-dated levy by currency.',`<div class="form-grid"><div class="form-field"><label>Levy code</label><select id="levyCode" ${record?'disabled':''}>${codes.map(code=>`<option value="${code}" ${code===r.levyCode?'selected':''}>${code}</option>`).join('')}</select></div><div class="form-field"><label>Currency code</label><select id="levyCurrency" ${record?'disabled':''}><option value="USD" ${String(r.currencyCode||'USD').toUpperCase()==='USD'?'selected':''}>USD</option><option value="ZIG" ${String(r.currencyCode||'USD').toUpperCase()==='ZIG'?'selected':''}>ZiG (ZIG)</option></select></div><div class="form-field"><label>Rate (%)</label><input id="levyRate" type="number" min="0" max="100" step="0.01" value="${__pr6Esc(r.rate == null ? (r.levyCode==='AIDS_RATE'?3:'') : Number(r.rate)*100)}"></div><div class="form-field"><label>Ceiling</label><input id="levyCeiling" type="number" min="0" step="0.001" value="${__pr6Esc(r.ceiling ?? '')}"></div><div class="form-field"><label>Effective from</label><input id="levyEffectiveFrom" type="date" value="${__pr6Esc(r.effectiveFrom ? String(r.effectiveFrom).slice(0,10) : today)}" ${record?'readonly':''}></div><div class="form-field"><label>Effective to</label><input id="levyEffectiveTo" type="date" value="${__pr6Esc(r.effectiveTo ? String(r.effectiveTo).slice(0,10) : '')}"></div>${record?`<div class="form-field"><label>State</label><select id="levyActive"><option value="true" ${r.isActive!==false?'selected':''}>Active</option><option value="false" ${r.isActive===false?'selected':''}>Inactive</option></select></div>`:''}<div class="form-field full"><small>AIDS_RATE follows the SRD control of 3% of calculated PAYE, not gross salary. NSSA ceilings are configured per currency.</small></div></div>`,`${button('Cancel','close-modal')}${button('Save levy','save-statutory-levy','primary','check')}`);
  const levySelect=document.querySelector('#levyCode'), levyRate=document.querySelector('#levyRate');
  if(!record && levySelect && levyRate) levySelect.addEventListener('change',()=>{levyRate.value=levySelect.value==='AIDS_RATE'?'3':levySelect.value==='NSSA_RATE'?'4.5':'';});
}

function openStatutoryMappingForm(record = null) {
  const ref=__pr6Ref(), types=Array.isArray(ref.statutoryMappings)?ref.statutoryMappings:[], accounts=(ref.componentAccounts||[]).filter(a=>String(a.accountType||'').toLowerCase().includes('liabil'));
  const selected=record?.glAccountId || '';
  openModal('Map Statutory Accounts','Choose the liability account used when posting each statutory deduction.',`<div class="form-grid"><div class="form-field full"><label>Statutory deduction component</label><select id="statMappingType"><option value="">Select a component</option>${types.map(t=>`<option value="${__pr6Esc(t.id)}" data-account-id="${__pr6Esc(t.glAccountId||'')}" ${record?.id===t.id?'selected':''}>${__pr6Esc(t.code)} · ${__pr6Esc(t.name)}</option>`).join('')}</select></div><div class="form-field full"><label>Liability account</label><select id="statMappingAccount"><option value="">Use default statutory account</option>${accounts.map(a=>`<option value="${__pr6Esc(a.id)}" ${a.id===selected?'selected':''}>${__pr6Esc(a.accountNo)} · ${__pr6Esc(a.accountName)}</option>`).join('')}</select></div><div class="form-field full"><small>If a statutory component is missing, create it in Earnings and Deductions first.</small></div></div>`,`${button('Cancel','close-modal')}${button('Save mapping','save-statutory-mapping','primary','check')}`);
  const type=document.querySelector('#statMappingType'), account=document.querySelector('#statMappingAccount');
  if (type && account) { account.value=selected; type.addEventListener('change',()=>{ account.value=type.selectedOptions[0]?.dataset.accountId || ''; }); }
}

function openTrainingCourseForm(record = null) {
  const r=record || {}, permissions=Array.isArray(r.requiredPermissionCodes) ? r.requiredPermissionCodes.join(', ') : '';
  if (!__pr6Has('payroll.training.manage')) {
    if (!record) return deny('training.manage');
    return openModal('Course details', __pr6Esc(r.code || ''), `<div class="profile-summary-strip">${trainingFactV6('Course',r.title || '—')}${trainingFactV6('Renewal',String(r.renewalPeriodMonths || '—')+' months')}${trainingFactV6('Permissions',permissions || 'None recorded')}</div><p>${__pr6Esc(r.description || 'No description recorded.')}</p>`, button('Close','close-modal'));
  }
  openModal(record ? 'Edit Training Course' : 'Create Training Course','Define renewal and the permissions protected by this certification.',`<div class="form-grid"><input id="courseId" type="hidden" value="${__pr6Esc(r.id||'')}"><div class="form-field"><label>Course code</label><input id="courseCode" value="${__pr6Esc(r.code||'')}" ${record?'readonly':''}></div><div class="form-field"><label>Course title</label><input id="courseTitle" value="${__pr6Esc(r.title||'')}"></div><div class="form-field full"><label>Description</label><textarea id="courseDescription">${__pr6Esc(r.description||'')}</textarea></div><div class="form-field"><label>Renewal period (months)</label><input id="courseRenewal" type="number" min="1" value="${__pr6Esc(r.renewalPeriodMonths||12)}"></div><div class="form-field"><label>Required permission codes</label><input id="coursePermissions" value="${__pr6Esc(permissions)}" placeholder="payroll.runs.manage, ..."></div></div>`,`${button('Cancel','close-modal')}${button('Save course','save-training-course','primary','check')}`);
}

function openTrainingAssignmentForm(){
 const ref=__pr6Ref(),courses=Array.isArray(ref.courses)?ref.courses:[],audience=ref.trainingAudienceOptions||{};
 const departments=Array.isArray(audience.departments)?audience.departments:[],roles=Array.isArray(audience.roles)?audience.roles:[],people=Array.isArray(audience.employees)?audience.employees:[];
 if(!courses.length)return toast('No courses available','Create or activate a course before assigning it.','warn');
 openModal('Assign Training Course','Choose a course and select all employees, a department, a role or one employee.',`<div class="form-grid"><div class="form-field full"><label>Course</label><select id="assignmentCourse">${courses.map(c=>`<option value="${__pr6Esc(c.id)}">${__pr6Esc(c.code)} · ${__pr6Esc(c.title)}</option>`).join('')}</select></div><div class="form-field"><label>Population type</label><select id="assignmentScope"><option value="ALL">All employees</option><option value="DEPARTMENT">Department</option><option value="ROLE">Role</option><option value="EMPLOYEE">User</option></select></div><div class="form-field"><label id="assignmentScopeLabel">Department</label><select id="assignmentScopeValue"></select></div><div class="form-field full"><small id="assignmentAudienceHint" class="muted"></small></div></div>`,`${button('Cancel','close-modal')}${button('Assign course','save-training-assignment','primary','check')}`);
 const type=document.querySelector('#assignmentScope'),value=document.querySelector('#assignmentScopeValue'),label=document.querySelector('#assignmentScopeLabel'),hint=document.querySelector('#assignmentAudienceHint');
 const choices={DEPARTMENT:departments.map(d=>({value:d.name,label:d.name})),ROLE:roles.map(r=>({value:r.value||r.code||r.name,label:`${r.name}${r.department?` · ${r.department}`:''}`})),EMPLOYEE:people.map(e=>({value:e.id,label:`${e.employeeNumber} · ${[e.firstName,e.lastName].filter(Boolean).join(' ')}${e.department?` · ${e.department}`:''}`}))};
 const sync=()=>{const kind=type?.value||'ALL',items=choices[kind]||[];if(label)label.textContent=kind==='EMPLOYEE'?'User':kind==='ROLE'?'Role':'Department';if(!value)return;value.innerHTML=kind==='ALL'?'<option value="">Applies to all active employees</option>':items.map(x=>`<option value="${__pr6Esc(x.value)}">${__pr6Esc(x.label)}</option>`).join('');value.disabled=kind==='ALL'||!items.length;if(hint)hint.textContent=kind==='ALL'?'This course will apply to every active employee.':items.length?'Select the exact '+(kind==='EMPLOYEE'?'user':kind.toLowerCase())+'.':'No active '+(kind==='EMPLOYEE'?'users':kind.toLowerCase())+' are available.';};
 type?.addEventListener('change',sync);sync();
}
function notificationsDrawer(){openDrawer('Notifications','7 unread payroll and HR control items',`<div class="list">${[['Critical payroll exceptions','3 release-blocking cases require resolution','red'],['Approval review assigned','June Monthly Staff payroll is ready for review','amber'],['Statutory deadline approaching','PAYE and NSSA returns due in 12 days','amber'],['Access review required','Q2 payroll role certification awaits completion','violet'],['Training expiries','13 employees have overdue requirements','red'],['Document approval','Payroll SOP version 11 requires review','blue'],['Integration warning','BancABC connector remains in sandbox mode','amber']].map(x=>`<div class="list-row"><div class="list-icon ${x[2]}">${icon(x[2]==='red'?'alert':'bell')}</div><div class="list-main"><strong>${x[0]}</strong><span>${x[1]}</span></div>${icon('chev')}</div>`).join('')}</div>`,`${button('Mark all read','mark-read','', 'check')}${button('Open command centre','overview','primary','home')}`)}
function createSimplePdf(title,lines){const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,' ');const clean=[title,'',...lines].flatMap(line=>{const words=String(line).split(/\s+/);let out=[],cur='';for(const w of words){if((cur+' '+w).trim().length>92){out.push(cur);cur=w}else cur=(cur+' '+w).trim()}if(cur)out.push(cur);return out}).slice(0,52);let stream='BT\n/F1 10 Tf\n50 790 Td\n';clean.forEach((l,i)=>{if(i===0)stream+='/F1 16 Tf\n';else if(i===1)stream+='/F1 10 Tf\n';stream+=`(${esc(l)}) Tj\n0 -14 Td\n`});stream+='ET';const objs=[];objs[1]='<< /Type /Catalog /Pages 2 0 R >>';objs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';objs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';objs[4]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;objs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<=5;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}const xref=pdf.length;pdf+='xref\n0 6\n0000000000 65535 f \n';for(let i=1;i<=5;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'})}
function downloadBlob(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function downloadText(name,text,type='text/plain'){downloadBlob(name,new Blob([text],{type}))}
function exportCSV(name,headers,rows){const q=v=>'"'+String(v).replaceAll('"','""')+'"';downloadText(name,[headers,...rows].map(r=>r.map(q).join(',')).join('\n'),'text/csv;charset=utf-8')}
function htmlToDoc(name,title,html){const doc=`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:50px;color:#172033}h1{color:#1768ff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd5e3;padding:7px;text-align:left}</style></head><body>${html}</body></html>`;downloadText(name,doc,'application/msword')}
function textFromEditor(id){const el=$(id);return el?el.innerText.split('\n').filter(Boolean):['No content available']}
function fileName(s){return s.replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'')}
function openCommand(){renderCommandResults('');$('#command').classList.add('open');$('#commandBackdrop').classList.add('open');setTimeout(()=>$('#commandInput').focus(),60)}
function closeCommand(){$('#command').classList.remove('open');$('#commandBackdrop').classList.remove('open');$('#commandInput').value=''}
function renderCommandResults(q){q=q.toLowerCase();const pages=navGroups.flatMap(([g,items])=>items.map(x=>({type:'page',id:x[0],label:x[1],sub:g,ico:x[2]}))).filter(x=>permittedPage(x.id));const people=employees.map(e=>({type:'employee',id:e.id,label:e.name,sub:`${e.id} - ${e.title}`,ico:'users'}));const reps=reportTemplates.map(r=>({type:'report',id:r.id,label:r.name,sub:r.category,ico:'report'}));const actions=[{type:'action',id:'new-run',label:'Create payroll run',sub:'Payroll action',ico:'plus'},{type:'action',id:'upload-document',label:'Upload document',sub:'Document vault action',ico:'upload'},{type:'action',id:'go-onboarding',label:'Start employee onboarding',sub:'People action',ico:'userplus'}];const all=[...pages,...people,...reps,...actions].filter(x=>!q||`${x.label} ${x.sub} ${x.id}`.toLowerCase().includes(q)).slice(0,12);$('#commandResults').innerHTML=all.length?all.map(x=>`<div class="command-item" data-command-type="${x.type}" data-command-id="${x.id}"><span class="nav-icon">${icon(x.ico)}</span><div><strong>${x.label}</strong><span>${x.sub}</span></div></div>`).join(''):`<div style="padding:25px;text-align:center;color:var(--muted)">No matching payroll records or actions.</div>`}
const pageIds=new Set(navGroups.flatMap(x=>x[1].map(y=>y[0])));
function goPage(id){if(!permittedPage(id)){deny(pagePermission[id]||'workspace access');return}const navigate=window.__PAYROLL_V6_NAV__;const routeWillChange=typeof navigate==='function'?navigate(id)===true:false;if(!routeWillChange){state.page=id;render()}$('#app').classList.remove('mobile-nav');closeDrawer();closeModal();closeCommand()}
document.addEventListener('click',e=>{
 const cmd=e.target.closest('[data-command-type]');if(cmd){const type=cmd.dataset.commandType,id=cmd.dataset.commandId;closeCommand();if(type==='page')goPage(id);else if(type==='employee')employeeDrawer(id);else if(type==='report')generateReport(id);else handleAction(id,cmd);return}
 const page=e.target.closest('[data-page]');if(page){goPage(page.dataset.page);return}
 const emp=e.target.closest('[data-employee]');if(emp){employeeDrawer(emp.dataset.employee);return}
 const run=e.target.closest('[data-run]');if(run){runDrawer(run.dataset.run);return}
 const exc=e.target.closest('[data-exception]');if(exc){exceptionDrawer(exc.dataset.exception);return}
 const doc=e.target.closest('[data-document]');if(doc){documentDrawer(doc.dataset.document);return}
 const rep=e.target.closest('[data-report]');if(rep){generateReport(rep.dataset.report);return}
 const folder=e.target.closest('[data-folder]');if(folder){state.folder=folder.dataset.folder;render();return}
 const perm=e.target.closest('[data-permission]');if(perm){if(!can('rbac.manage'))return deny('rbac.manage');const role=perm.dataset.role,p=perm.dataset.permission;const list=roles[role];if(list.includes(p))roles[role]=list.filter(x=>x!==p);else roles[role]=[...list,p];logEvent('ROLE_PERMISSION_CHANGED',role,`${p} ${roles[role].includes(p)?'granted':'revoked'} by ${state.role}`,'Access');render();toast('Permission matrix updated',`${p} was ${roles[role].includes(p)?'granted to':'revoked from'} ${role}.`);return}
 const action=e.target.closest('[data-action]');if(action)handleAction(action.dataset.action,action);
}, __pr6Sig);
function handleAction(action,el){
 if(pageIds.has(action)){goPage(action);return}
 switch(action){
  case 'profile-menu':openProfileMenu();break;
  case 'export-employees-pdf':exportEmployeeRegister('pdf');break;
  case 'export-employees-excel':exportEmployeeRegister('excel');break;
  case 'export-employees-csv':exportEmployeeRegister('csv');break;
  case 'retry-payroll-load':window.dispatchEvent(new CustomEvent('payroll-v6:reload-request'));break;
  case 'client-design-sign-out':closeDrawer();closeModal();clientDesignSignOut();break;
  case 'close-drawer':closeDrawer();break;case 'close-modal':closeModal();break;
  case 'go-onboarding':goPage('onboarding');break;case 'new-employee':case 'open-onboarding':openNewEmployee();break;case 'new-run':openNewRun();break;
  case 'continue-run':goPage('approvals');break;case 'upload-document':uploadDocumentModal();break;case 'create-document':createDocumentModal();break;
  case 'approval-decision':approvalDecisionModal();break;case 'notification':notificationsDrawer();break;
  case 'employee-documents':state.folder='Employee records';goPage('vault');break;
  case 'edit-employee':{if(!can('employee.edit')){deny('employee.edit');break}const __rid=(el&&el.dataset&&el.dataset.recordId)||'';if(!__rid){toast('No employee selected','Open an employee record before editing it.','warn');break}openModal('Edit Employee Record','Leave a field blank to keep its current value. Updates are saved through the Payroll employee API.',`<div class="form-grid"><div class="form-field"><label>Bank name</label><input id="editBankName" placeholder="Leave blank to keep current"></div><div class="form-field"><label>Branch code</label><input id="editBranchCode" placeholder="Leave blank to keep current"></div><div class="form-field"><label>Account number</label><input id="editAccountNumber" placeholder="Leave blank to keep current"></div><div class="form-field"><label>Basic salary</label><input id="editBasicSalary" type="number" step="0.01" min="0" placeholder="Leave blank to keep current"></div><div class="form-field"><label>ID number</label><input id="editIdNumber" placeholder="Leave blank to keep current"></div><div class="form-field"><label>ZIMRA BP number</label><input id="editTaxNumber" placeholder="Leave blank to keep current"></div><div class="form-field"><label>Next of kin</label><input id="editNextOfKin" placeholder="Leave blank to keep current"></div><div class="form-field"><label>Address</label><input id="editAddress" placeholder="Leave blank to keep current"></div><div class="form-field" style="grid-column:1/-1"><label>Profile photo</label><input id="editPicture" type="file" accept="image/png,image/jpeg,image/webp"><label class="tiny muted" style="display:flex;flex-direction:row;justify-content:flex-start;gap:8px;align-items:center;margin-top:8px"><input id="editRemovePicture" type="checkbox" style="width:auto;height:auto;flex:none;margin:0"> Remove current photo</label></div></div>`,`<button class="btn primary" data-action="save-employee" data-record-id="${__rid}">${icon('check')}Save changes</button>`);break}
  case 'resolve-exception':{if(!can('exceptions.resolve'))return deny('exceptions.resolve');const x=exceptions.find(v=>v.id===el.dataset.id);if(x){x.status='Resolved';logEvent('PAYROLL_EXCEPTION_RESOLVED',x.id,`Resolved ${x.type} for ${x.employee}`,'Change');toast('Exception resolved',`${x.id} is now resolved and will be revalidated.`);closeDrawer();render()}break}
  case 'escalate-exception':toast('Exception escalated','The case owner and Payroll Manager have been notified.','warn');break;
  case 'approve-payroll':if(!can('payroll.approve'))deny('payroll.approve');else if(exceptions.some(x=>x.severity==='Critical'&&x.status!=='Resolved'))toast('Approval blocked','Resolve all critical exceptions before approval can be recorded.','bad');else{(payrollRuns[0]||__pr6RunPlaceholder).status='Approved';(payrollRuns[0]||__pr6RunPlaceholder).stage=5;logEvent('PAYROLL_APPROVED',(payrollRuns[0]||__pr6RunPlaceholder).id,'Payroll approved after all controls passed','Approval');toast('Payroll approved','The run is ready for final release.');render()}break;
  case 'reject-payroll':if(!can('payroll.approve'))deny('payroll.approve');else{(payrollRuns[0]||__pr6RunPlaceholder).status='Returned for correction';logEvent('PAYROLL_REJECTED',(payrollRuns[0]||__pr6RunPlaceholder).id,'Payroll returned for correction','Approval');toast('Payroll returned','The preparer has been notified with the reviewer comment.','warn');render()}break;
  case 'record-decision':{const d=$('#decisionType')?.value||'Return for correction';logEvent('PAYROLL_DECISION_RECORDED','PAY-2026-06-M',`${d}: ${$('#decisionBasis')?.value||''}`,'Approval');closeModal();toast('Decision recorded',`${d} was written to the immutable approval trail.`);break}
  case 'release-payroll':if(!can('payroll.release'))deny('payroll.release');else if(exceptions.some(x=>x.severity==='Critical'&&x.status!=='Resolved')||(payrollRuns[0]||__pr6RunPlaceholder).status!=='Approved')toast('Release blocked','Critical exceptions and maker-checker approval must be complete before release.','bad');else{(payrollRuns[0]||__pr6RunPlaceholder).status='Released';(payrollRuns[0]||__pr6RunPlaceholder).stage=6;logEvent('PAYROLL_RELEASED',(payrollRuns[0]||__pr6RunPlaceholder).id,'Bank batches, payslips and GL journals released','Approval');toast('Payroll released','Bank, payslip and ledger distribution has started.');render()}break;
  case 'commit-inputs':if(!can('payroll.prepare'))deny('payroll.prepare');else{logEvent('INPUT_BATCH_COMMITTED','INP-2026-06-04','1,247 valid rows committed; 37 rows retained in isolation','Change');toast('Valid inputs committed','1,247 rows entered the calculation population.');}break;
  case 'resolve-input':toast('Validation case opened','The source row and employee record are ready for correction.');break;
  case 'edit-document':{if(!can('documents.manage'))return deny('documents.manage');const editor=$('#documentEditor');if(editor){editor.contentEditable='true';editor.focus();$('.editable-note',$('#drawerBody')).textContent='Edit mode is active. Saving creates a new governed version.';$('#drawerFoot').innerHTML=`${button('Cancel edit','cancel-doc-edit')}${button('Save new version','save-document','primary','check')}`;}break}
  case 'cancel-doc-edit':documentDrawer(state.activeDoc);break;
  case 'save-document':{const d=documents.find(x=>x.id===state.activeDoc);if(d){d.versions++;d.modified='Just now';d.status='In review';d.content=$('#documentEditor')?.innerText.slice(0,300)||d.content;logEvent('DOCUMENT_VERSION_CREATED',d.id,`Created version ${d.versions} of ${d.name}`,'Change');toast('Document version saved',`Version ${d.versions} has been routed for review.`);documentDrawer(d.id)}break}
  case 'download-doc':{const d=documents.find(x=>x.id===state.activeDoc)||(documents[0]||__pr6DocumentPlaceholder);htmlToDoc(`${fileName(d.name)}_v${d.versions}.doc`,d.name,$('#documentEditor')?.innerHTML||documentHtml(d));toast('Editable document downloaded','A Microsoft Word compatible file was created.');break}
  case 'download-doc-pdf':{const d=documents.find(x=>x.id===state.activeDoc)||(documents[0]||__pr6DocumentPlaceholder);downloadBlob(`${fileName(d.name)}_v${d.versions}.pdf`,createSimplePdf(d.name,textFromEditor('#documentEditor')));toast('PDF exported','The previewed document was exported as PDF.');break}
  case 'confirm-upload':{const f=$('#docFile')?.files?.[0];const name=f?.name||'Uploaded Payroll Evidence.pdf';const d={id:`DOC-${String(documents.length+1).padStart(3,'0')}`,name,folder:$('#docFolder')?.value||'Payroll control packs',type:'Uploaded evidence',owner:'Tariro Moyo',modified:'Just now',class:$('#docClass')?.value||'Restricted',versions:1,status:'In review',content:$('#docDescription')?.value||'Uploaded governed payroll evidence.'};documents.unshift(d);logEvent('DOCUMENT_UPLOADED',d.id,`Uploaded and classified ${d.name}`,'Change');closeModal();state.folder=d.folder;render();toast('Document uploaded',`${d.name} was scanned, classified and versioned.`);break}
  case 'confirm-create-document':{const d={id:`DOC-${String(documents.length+1).padStart(3,'0')}`,name:$('#createdDocName')?.value||'New Payroll Document',folder:$('#createdDocFolder')?.value||'Payroll control packs',type:'Editable document',owner:'Tariro Moyo',modified:'Just now',class:'Restricted',versions:1,status:'Draft',content:$('#createdDocContent')?.value||'New editable document.'};documents.unshift(d);logEvent('DOCUMENT_CREATED',d.id,`Created editable document ${d.name}`,'Change');closeModal();state.folder=d.folder;render();documentDrawer(d.id);break}
  case 'download-report-doc':{const r=state.reportDraft||reportTemplates[0];htmlToDoc(`${fileName(r.name)}_June_2026.doc`,r.name,$('#reportEditor')?.innerHTML||'');toast('Editable report downloaded','The current report version was exported to a Word-compatible document.');break}
  case 'download-report-pdf':{const r=state.reportDraft||reportTemplates[0];downloadBlob(`${fileName(r.name)}_June_2026.pdf`,createSimplePdf(r.name,textFromEditor('#reportEditor')));toast('Compliance PDF exported','The current preview was exported with its control summary.');break}
  case 'preview-report':{const ed=$('#reportEditor');if(ed){ed.contentEditable='false';$('.editable-note',$('#modalBody')).textContent='Preview mode. The report is displayed exactly as it will be distributed.';$('#modalFoot').innerHTML=`${button('Download DOC','download-report-doc','', 'download')}${button('Export PDF','download-report-pdf','', 'file')}${button('Return to edit','edit-report','soft','edit')}${button('Save version','save-report','primary','check')}`;}break}
  case 'edit-report':{const ed=$('#reportEditor');if(ed){ed.contentEditable='true';ed.focus();$('.editable-note',$('#modalBody')).textContent='Edit mode is active. Changes remain a draft until Save Version is selected.';$('#modalFoot').innerHTML=`${button('Download DOC','download-report-doc','', 'download')}${button('Export PDF','download-report-pdf','', 'file')}${button('Preview','preview-report','soft','eye')}${button('Save version','save-report','primary','check')}`;}break}
  case 'save-report':{if(!state.reportDraft)return;state.reportDraft.version=(state.reportDraft.version||1)+1;logEvent('REPORT_VERSION_SAVED',state.reportDraft.id,`Saved ${state.reportDraft.name} version ${state.reportDraft.version}`,'Change');toast('Report version saved',`Version ${state.reportDraft.version} is ready for maker-checker review.`);break}
  case 'create-run':{const group=$('#runGroup')?.value||'Monthly Staff',period=$('#runPeriod')?.value||'July 2026';const r={id:`PAY-2026-07-${group.startsWith('Monthly')?'M':group.startsWith('Exec')?'E':'C'}`,period,group,employees:group==='Monthly Staff'?128:12,currency:'USD / ZiG',grossUSD:0,grossZiG:0,deductions:0,netUSD:0,status:'Draft',stage:1,owner:'Tariro Moyo',variance:0};payrollRuns.unshift(r);logEvent('PAYROLL_RUN_CREATED',r.id,`Created ${period} ${group} payroll run`,'Change');closeModal();goPage('runs');toast('Payroll run created',`${r.id} is ready for input preparation.`);break}
  case 'save-run':toast('Draft saved','The draft and all supporting fields were saved.');closeModal();break;
  case 'save-onboarding':case 'complete-onboarding':break;
  case 'generic-save':logEvent('CONFIGURATION_DRAFT_SAVED','CFG-DRAFT','Governed configuration draft saved','Change');closeModal();toast('Draft saved','The change requires independent approval before publication.');break;
  case 'download-payslip':case 'preview-payslip':downloadBlob('Rudo_Sibanda_June_2026_Payslip.pdf',createSimplePdf('June 2026 Payslip',['Employee: Rudo Sibanda (EMP-0007)','Gross earnings: USD 2,250.00','Deductions: USD 620.86','Net pay: USD 1,629.14','ZiG net component: ZiG 35,820','Payment date: 30 June 2026','Verification hash: 5db2-79a1-c840']));toast('Payslip downloaded','The hash-verified June payslip was created.');break;
  case 'download-input-template':exportCSV('Matanho_Payroll_Input_Template.csv',['Employee ID','Component Code','Amount','Currency','Effective Date','Reference'],[['EMP-0007','OVERTIME','0.00','USD','2026-06-30','']]);break;
  case 'export-employees':exportCSV('Matanho_Employee_Payroll_Readiness.csv',['Employee ID','Name','Job title','Department','Branch','Readiness','Status'],employees.map(x=>[x.id,x.name,x.title,x.department,x.branch,x.readiness,x.status]));break;
  case 'export-errors':exportCSV('Matanho_Payroll_Input_Validation_Errors.csv',['Source row','Employee','Field','Issue','Severity'],[['44','EMP-0044','Tax number','Missing','Critical'],['109','EMP-0035','Allowance','Duplicate','Critical']]);break;
  case 'export-exceptions':exportCSV('Matanho_Payroll_Exception_Register.csv',['ID','Employee','Type','Severity','Source','Amount','Owner','Age','Status'],exceptions.map(x=>[x.id,x.employee,x.type,x.severity,x.source,x.amount,x.owner,x.age,x.status]));break;
  case 'export-training':exportCSV('Matanho_Training_Compliance_Register.csv',['Employee','Status','Requirement'],employees.map(x=>[x.name,x.training,'Mandatory training']));break;
  case 'export-leave':leaveExportV6('csv');break;
  case 'export-audit':exportCSV('Matanho_Payroll_Audit_Ledger.csv',['Timestamp','Actor','Action','Record','Detail','Class'],auditEvents);break;
  case 'download-review-pack':case 'download-close-pack':case 'download-run-evidence':{const title=action==='download-review-pack'?'Payroll Approval Review Pack':action==='download-close-pack'?'Payroll Close Evidence Pack':'Payroll Run Evidence Pack';downloadBlob(`${fileName(title)}_June_2026.pdf`,createSimplePdf(title,['Payroll run: PAY-2026-06-M','Employees: 128','Gross USD: 264,720.00','Gross ZiG: 7,459,664','Critical exceptions: 3','Maker-checker controls: 4 of 6 complete','Calculation hash: 74f2a90c...e81c']));break}
  case 'verify-audit':toast('Audit ledger verified','4,812 events and linked evidence hashes were verified.');break;
  case 'mark-read':state.notifications=0;closeDrawer();toast('Notifications cleared','All control notifications were marked as read.');break;
  case 'tenant':toast('Tenant switcher','The prototype is currently scoped to Arcus Holdings Private Limited.');break;
  case 'ess-bank-change':genericModal('Bank Detail Change Request','Bank changes require identity verification and independent payroll review.');break;
  case 'request-leave':genericModal('Request Leave','The request will route to the line manager and update payroll-linked leave balances after approval.');break;
  case 'new-component':openComponentForm();break;
  case 'assign-component':{const id=document.querySelector('#componentId')?.value,kind=document.querySelector('#componentType')?.value,ref=__pr6Ref(),list=kind==='EARNING'?ref.allowanceTypes:ref.deductionTypes,record=(list||[]).find(x=>x.id===id);if(record && !record.isStatutory)openComponentAssignmentForm(record,kind);else toast('Component unavailable','Save the component before assigning employees.','warn');break;}
  case 'new-paygroup':openModal('Create Pay Group','Define the population, its cycle and currencies used for salary components.',`<div class="form-grid"><div class="form-field"><label>Group name</label><input id="newPayGroupName" placeholder="Monthly Staff"></div><div class="form-field"><label>Code <span class="muted">(optional; generated if blank)</span></label><input id="newPayGroupCode" placeholder="Auto-generated"></div><div class="form-field"><label>Frequency</label><select id="newPayGroupFrequency"><option value="MONTHLY">Monthly</option><option value="FORTNIGHTLY">Fortnightly</option><option value="WEEKLY">Weekly</option></select></div><div class="form-field"><label>Pay day of month</label><input id="newPayGroupPayDay" type="number" min="1" max="31" placeholder="25"></div><div class="form-field full"><label>Salary component currencies</label><select id="newPayGroupCurrencies" multiple size="3"><option value="USD" selected>USD</option><option value="ZIG">ZiG</option></select><small>Use Ctrl or Command to select multiple currencies.</small></div><input id="newPayGroupCurrency" type="hidden" value="USD"></div>`,`${button('Create pay group','save-paygroup','primary','plus')}`);break;
  case 'statutory-mapping':openStatutoryMappingForm();break;
  case 'new-tax-rule':openTaxRuleForm();break;
  case 'new-tax-bracket':openBracketForm();break;
  case 'new-tax-levy':openLevyForm();break;
  case 'new-training-course':openTrainingCourseForm();break;
  case 'assign-training-course':openTrainingAssignmentForm();break;
  case 'record-training':openTrainingCertificationV6();break;
  case 'leave-adjustment':openLeaveBalanceForm();break;
  case 'assign-access':if(!can('rbac.manage'))deny('rbac.manage');else genericModal('Assign Payroll Access','Apply a role, data scope, expiry and approval workflow.');break;
  case 'run-access-review':toast('Access review started','42 users and 2 segregation conflicts were added to the Q2 certification pack.');break;
  case 'scheduled-reports':genericModal('Scheduled Compliance Reports','Configure recipients, channels, encryption and approval requirements.');break;
  case 'custom-report':genericModal('Custom Report Builder','Select governed payroll measures, dimensions and report controls.');break;
  case 'drill-payroll':goPage('runs');break;
  case 'assign-exceptions':toast('Bulk assignment opened','Select exception owners using role and data-scope rules.');break;
  case 'compare-runs':toast('Period comparison ready','June and May payroll movements are available in the approval workspace.');goPage('approvals');break;
  case 'download-doc':break;
  default:toast('Interactive control',`${action.replaceAll('-',' ')} is available in the full production workflow.`);break;
 }
}
$('#collapseBtn').addEventListener('click',()=>$('#app').classList.toggle('collapsed'));
$('#mobileMenu').addEventListener('click',()=>$('#app').classList.toggle('mobile-nav'));
$('#themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';rootEl.dataset.theme = document.documentElement.dataset.theme = state.theme;safeStorage.setItem('matanho-payroll-theme',state.theme);$('#themeBtn').innerHTML=icon(state.theme==='dark'?'sun':'moon')});
$('#searchLauncher').addEventListener('click',openCommand);$('#notificationBtn').addEventListener('click',notificationsDrawer);$('#drawerBackdrop').addEventListener('click',closeDrawer);$('#modalBackdrop').addEventListener('click',closeModal);$('#commandBackdrop').addEventListener('click',closeCommand);
$('#commandInput').addEventListener('input',e=>renderCommandResults(e.target.value));
$('#roleSelect').addEventListener('change',e=>{state.role=e.target.value;safeStorage.setItem('matanho-payroll-role',state.role);$('#roleLabel').textContent=state.role;if(!permittedPage(state.page))state.page=state.role==='Employee'?'mypay':'overview';render();toast('Role simulation changed',`The interface now applies ${state.role} permissions and data masking.`)});
$('#periodSelect').addEventListener('change',e=>{state.period=e.target.value;toast('Payroll period changed',`${state.period} is now the active working period.`)});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}if(e.key==='Escape'){closeCommand();closeModal();closeDrawer()}}, __pr6Sig);
document.addEventListener('input',e=>{if(e.target.id==='employeeSearch'){state.employeeSearch=e.target.value;const pos=e.target.selectionStart;render();const n=$('#employeeSearch');if(n){n.focus();n.setSelectionRange(pos,pos)}}}, __pr6Sig);
document.addEventListener('change',e=>{if(e.target.id==='employeeDepartmentFilter'){state.employeeDepartment=e.target.value;render()}else if(e.target.id==='employeeReadinessFilter'){state.employeeReadiness=e.target.value;render()}}, __pr6Sig);
function init(){rootEl.dataset.theme = document.documentElement.dataset.theme = state.theme;$('#themeBtn').innerHTML=icon(state.theme==='dark'?'sun':'moon');$('#collapseBtn').innerHTML=icon('menu');$('#mobileMenu').innerHTML=icon('menu');$('#searchIcon').innerHTML=icon('search');$('#notificationBtn').innerHTML=icon('bell');$('#roleSelect').innerHTML=Object.keys(roles).map(r=>`<option ${r===state.role?'selected':''}>${r}</option>`).join('');$('#roleLabel').textContent=state.role;$('#brandLogo').src='data:image/webp;base64,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';render()}
init();



(() => {
  const v2Assets = {
    logo: 'data:image/png;base64,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',
    portraits: {}
  };

  const attr = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const employeeImage = (employee, cls='employee-thumb') => {const ini=attr(employee.initials||'?');const box=cls==='employee-photo'?'photo-avatar employee-photo-fallback':'mini-avatar';if(!employee.photo)return `<div class="${box}">${ini}</div>`;return `<img class="${cls}" src="${attr(employee.photo)}" alt="${attr(employee.name)} profile" data-initials="${ini}" data-box="${box}" onerror="var d=document.createElement('div');d.className=this.dataset.box;d.textContent=this.dataset.initials;this.replaceWith(d)">`};

  /* photos come from each employee's own uploaded picture (live-loaders `photo`) */
  const logo = document.querySelector('#brandLogo');
  if (logo) logo.src = v2Assets.logo;
  const topAvatar = document.querySelector('.profile .avatar');
  /* top-bar avatar: the shell draws the signed-in user's own initials */

  const app = document.querySelector('#app');
  app.classList.remove('collapsed');
  document.querySelector('#collapseBtn')?.remove();

  const sidebarFoot = document.querySelector('.sidebar-foot');
  if (sidebarFoot && !document.querySelector('#sidebarToggleBottom')) {
    sidebarFoot.insertAdjacentHTML('beforeend', `<button class="sidebar-toggle-bottom" id="sidebarToggleBottom" aria-label="Toggle navigation"><span class="toggle-icon">${icon('chev')}</span><span class="toggle-label"></span></button>`);
  }
  const updateSidebarControl = () => {
    const button = document.querySelector('#sidebarToggleBottom');
    if (!button) return;
    const collapsed = app.classList.contains('collapsed');
    button.classList.toggle('is-expanded', !collapsed);
    const label = button.querySelector('.toggle-label');
    if (label) label.textContent = collapsed ? 'Expand menu' : 'Collapse menu';
    button.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  };
  updateSidebarControl();
  document.querySelector('#sidebarToggleBottom')?.addEventListener('click', () => {
    app.classList.toggle('collapsed');
    safeStorage.setItem('matanho-payroll-sidebar', app.classList.contains('collapsed') ? 'collapsed' : 'expanded');
    updateSidebarControl();
  });

  const livePill = document.querySelector('.live-pill');
  if (livePill && !document.querySelector('#activityMenuWrap')) {
    livePill.insertAdjacentHTML('beforebegin', `
      <div class="activity-menu-wrap" id="activityMenuWrap">
        <button class="activity-button" id="activityButton" aria-haspopup="menu" aria-expanded="false">${icon('clock')}<span class="activity-label">Activity</span>${icon('chev')}</button>
        <div class="activity-menu" id="activityMenu" role="menu">
          <div class="activity-menu-head"><strong>Activity and quick actions</strong><span>Open work, create records or move to a governed workspace.</span></div>
          <button class="activity-option" data-page="audit"><span class="nav-icon">${icon('audit')}</span><div><strong>Recent activity</strong><span>View the immutable event stream</span></div></button>
          <button class="activity-option" data-action="new-run"><span class="nav-icon">${icon('calculator')}</span><div><strong>Create payroll run</strong><span>Configure a governed pay cycle</span></div></button>
          <button class="activity-option" data-page="inputs"><span class="nav-icon">${icon('upload')}</span><div><strong>Upload payroll inputs</strong><span>Map, validate and commit records</span></div></button>
          <button class="activity-option" data-action="new-employee"><span class="nav-icon">${icon('userplus')}</span><div><strong>Start employee onboarding</strong><span>Create a controlled employment record</span></div></button>
          <button class="activity-option" data-page="reports"><span class="nav-icon">${icon('report')}</span><div><strong>Preview compliance reports</strong><span>Generate editable, exportable packs</span></div></button>
          <button class="activity-option" data-page="vendors"><span class="nav-icon">${icon('briefcase')}</span><div><strong>Vendor and quotation activity</strong><span>Registry, RFQs, bids and comparisons</span></div></button>
        </div>
      </div>`);
  }

  if (!permissions.some(([p]) => p === 'vendors.manage')) permissions.push(['vendors.manage','Manage HR and payroll vendors, RFQs and quotation comparisons']);
  ['System Administrator','Payroll Manager','HR Manager','Compliance Officer'].forEach(role => {
    if (roles[role] && !roles[role].includes('vendors.manage')) roles[role].push('vendors.manage');
  });
  pagePermission.vendors = 'vendors.view';
  // Keep Vendor Registry and Quotation Management available by direct route,
  // but hide it from the Payroll sidebar until the workspace is ready for users.
  const humanCapitalGroup = navGroups.find(group => group[0] === 'HUMAN CAPITAL');
  if (humanCapitalGroup) humanCapitalGroup[1] = humanCapitalGroup[1].filter(item => item[0] !== 'vendors');
  pageIds.add('vendors');

  kpi = function(label,value,sub,ico='report',tone='',delta=''){
    return `<div class="kpi" data-focus-card data-kpi-label="${attr(label)}" tabindex="0"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon ${tone}">${icon(ico)}</span></div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}${delta?` <span class="delta ${tone==='amber'?'warn':tone==='red'?'bad':''}">${delta}</span>`:''}</div></div>`;
  };

  lineChart = function(){
    const usd=[188,194,201,199,214,228,225,238,246,252,257,265];
    const zig=[5.10,5.28,5.46,5.58,6.02,6.28,6.36,6.62,6.82,7.01,7.21,7.46];
    const months=['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
    const W=940,H=286,left=62,right=68,top=30,bottom=48;
    const plotW=W-left-right,plotH=H-top-bottom;
    const x=i=>left+i*plotW/(months.length-1);
    const yUsd=v=>top+(270-v)/(270-180)*plotH;
    const yZig=v=>top+(7.6-v)/(7.6-5.0)*plotH;
    const usdPath=usd.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${yUsd(v).toFixed(2)}`).join(' ');
    const zigPath=zig.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${yZig(v).toFixed(2)}`).join(' ');
    const leftTicks=[180,200,220,240,260];
    const rightTicks=[5.0,5.5,6.0,6.5,7.0,7.5];
    return `<div class="chart-shell"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Monthly USD and ZiG gross payroll trend">
      ${leftTicks.map(v=>`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${yUsd(v)}" y2="${yUsd(v)}"/><text class="chart-label" x="${left-10}" y="${yUsd(v)+3}" text-anchor="end">${v}k</text>`).join('')}
      <line class="chart-axis" x1="${left}" x2="${left}" y1="${top}" y2="${H-bottom}"/><line class="chart-axis" x1="${W-right}" x2="${W-right}" y1="${top}" y2="${H-bottom}"/><line class="chart-axis" x1="${left}" x2="${W-right}" y1="${H-bottom}" y2="${H-bottom}"/>
      ${rightTicks.map(v=>`<text class="chart-label" x="${W-right+10}" y="${yZig(v)+3}" text-anchor="start">${v.toFixed(1)}m</text>`).join('')}
      <path class="chart-line" d="${usdPath}"/><path class="chart-line-2" d="${zigPath}"/>
      ${usd.map((v,i)=>`<circle class="chart-point" cx="${x(i)}" cy="${yUsd(v)}" r="3.6"><title>${months[i]}: USD ${v},000 gross payroll</title></circle>`).join('')}
      ${zig.map((v,i)=>`<circle class="chart-point second" cx="${x(i)}" cy="${yZig(v)}" r="3.3"><title>${months[i]}: ZiG ${v.toFixed(2)} million gross payroll</title></circle>`).join('')}
      ${months.map((m,i)=>`<text class="chart-label" x="${x(i)}" y="${H-17}" text-anchor="middle">${m}</text>`).join('')}
      <text class="chart-title" x="${left}" y="15">USD gross payroll (thousands)</text><text class="chart-title" x="${W-right}" y="15" text-anchor="end">ZiG gross payroll (millions)</text>
    </svg></div><div class="legend"><span><i style="background:#1559c1"></i>USD gross payroll</span><span><i style="background:#5a4ea1"></i>ZiG gross payroll</span><span>Hover a point for the exact period value</span></div>`;
  };

  barChart = function(){
    const data=[['Finance',54,82],['Operations',92,100],['Commercial',41,74],['Technology',37,68],['People',26,61],['Procurement',14,48]];
    const W=760,H=280,left=50,right=18,top=28,bottom=58,plotH=H-top-bottom,max=100;
    const groupW=(W-left-right)/data.length,barW=26;
    const y=v=>top+(max-v)/max*plotH;
    return `<div class="chart-shell"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Headcount and payroll cost index by department">
      ${[0,20,40,60,80,100].map(v=>`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-label" x="${left-8}" y="${y(v)+3}" text-anchor="end">${v}</text>`).join('')}
      <line class="chart-axis" x1="${left}" x2="${left}" y1="${top}" y2="${H-bottom}"/><line class="chart-axis" x1="${left}" x2="${W-right}" y1="${H-bottom}" y2="${H-bottom}"/>
      ${data.map((d,i)=>{const base=left+i*groupW+groupW/2;const h1=plotH*d[1]/max,h2=plotH*d[2]/max;return `<rect class="bar" x="${base-barW-3}" y="${H-bottom-h1}" width="${barW}" height="${h1}"><title>${d[0]} headcount index: ${d[1]}</title></rect><rect class="bar-2" x="${base+3}" y="${H-bottom-h2}" width="${barW}" height="${h2}"><title>${d[0]} payroll cost index: ${d[2]}</title></rect><text class="chart-label" x="${base}" y="${H-25}" text-anchor="middle">${d[0]}</text>`}).join('')}
      <text class="chart-title" x="${left}" y="15">Department profile (index, Operations = 100)</text>
    </svg></div><div class="legend"><span><i style="background:#2863bc"></i>Headcount index</span><span><i style="background:#8ca5cd"></i>Payroll cost index</span></div>`;
  };

  employeesPage = function(){
    if(!__pr6IsLive()) return employeeDirectorySkeleton();
    if(__pr6Live.loadError) return `<div class="page">${pageHead('People administration','Employee Directory and Payroll Readiness','Employee records could not be loaded.',button('Try again','retry-payroll-load','primary','refresh'))}<section class="card"><div class="card-body"><strong>Employee records could not be loaded</strong><p class="muted">${__pr6Esc(__pr6Live.loadError)}</p></div></section></div>`;
    const filtered=employees.filter(e=>(!state.employeeSearch||[e.name,e.id,e.department,e.branch,e.title].join(' ').toLowerCase().includes(state.employeeSearch.toLowerCase()))&&(state.employeeDepartment==='All departments'||e.department===state.employeeDepartment)&&(state.employeeReadiness==='All readiness states'||e.status===state.employeeReadiness));
    const rows=filtered.map(e=>`<tr data-employee="${e.id}"><td><input class="checkbox" type="checkbox" aria-label="Select ${attr(e.name)}"></td><td><div class="access-user">${employeeImage(e)}<div><strong class="link">${e.name}</strong><div class="tiny muted">${e.id} · ${e.title}</div></div></div></td><td>${e.department}<div class="tiny muted">${e.branch}</div></td><td>${e.type}</td><td class="money">${maskSalary(e)}</td><td><div style="display:flex;align-items:center;gap:7px"><div class="progress" style="width:64px"><span style="width:${e.readiness}%"></span></div><strong style="font-weight:500">${e.readiness}%</strong></div></td><td>${badge(e.status)}</td><td><button class="btn small" data-employee="${e.id}">${icon('eye')}Open</button></td></tr>`);
    const stats=__pr6EmployeeStats();
    return `<div class="page">${pageHead('People administration','Employee Directory and Payroll Readiness','Search and govern employment, compensation, bank, statutory, document, leave, training and payroll-readiness records from one responsive workspace.',employeeExportButtons()+button('Start onboarding','go-onboarding','primary','userplus'))}
      <div class="grid kpis">${kpi('Total employees',String(stats.total),stats.active+' active and '+stats.onNotice+' serving notice','users')}${kpi('Payroll ready',String(stats.ready),stats.readyPct+'% of the active population','check','cyan')}${kpi('Under review',String(stats.review),'Data or approval issue','alert','amber')}${kpi('Blocked',String(stats.blocked),'Cannot enter final payroll','lock','red')}</div>
      <section class="card"><div class="filters"><input id="employeeSearch" value="${attr(state.employeeSearch)}" placeholder="Search name, employee ID, department or branch"><select id="employeeDepartmentFilter"><option value="All departments" ${state.employeeDepartment==='All departments'?'selected':''}>All departments</option>${__pr6DepartmentOptions().replace(/<option>(.*?)<\/option>/g,(_,v)=>`<option value="${attr(v)}" ${state.employeeDepartment===v?'selected':''}>${v}</option>`)}</select><select id="employeeReadinessFilter"><option value="All readiness states" ${state.employeeReadiness==='All readiness states'?'selected':''}>All readiness states</option>${['Ready','Review','Blocked','Suspended','Terminated'].map(x=>`<option value="${x}" ${state.employeeReadiness===x?'selected':''}>${x}</option>`).join('')}</select><div class="spacer"></div><span class="tiny muted">Showing ${filtered.length} of ${employees.length} employees</span></div><div class="table-wrap"><table><thead><tr><th></th><th>Employee</th><th>Organisation</th><th>Contract</th><th>Compensation</th><th>Readiness</th><th>Status</th><th></th></tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="8" class="tiny muted">No employee records match these filters.</td></tr>`}</tbody></table></div></section>
    </div>`;
  };

  const employeeTabPanel = (e,tab) => {
    const compensationRows=[['Basic salary',maskSalary(e),'Recurring'],['Housing allowance',can('salary.view')?money(e.base*.15):'Restricted','Formula'],['Transport allowance',can('salary.view')?money(Math.max(120,e.base*.07)):'Restricted','Recurring'],['PAYE',can('salary.view')?`(${money(e.base*.214)})`:'Restricted','Statutory'],['NSSA',can('salary.view')?`(${money(Math.min(e.base*.035,31.5))})`:'Restricted','Statutory']];
    const panels={
      'Employment':`<div class="employee-tab-panel"><div class="grid two"><section class="card"><div class="card-head"><div><h3>Employment details</h3><p>Current governed appointment and organisational assignment</p></div></div><div class="card-body form-grid">${[['Job title',e.title],['Department',e.department],['Branch',e.branch],['Contract type',e.type],['Start date',e.start],['Line manager','Tawanda Chirenje'],['Grade','Professional P3'],['Cost centre',`${e.department.slice(0,3).toUpperCase()}-001`]].map(x=>`<div class="fact"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div></section><section class="card"><div class="card-head"><div><h3>Payroll readiness</h3><p>Validated employee, statutory and documentary controls</p></div></div><div class="card-body"><div style="display:flex;gap:14px;align-items:center"><div class="readiness-ring" style="--pct:${e.readiness}%"><strong>${e.readiness}%</strong></div><div style="flex:1">${progressRow('Employee master',100,'Complete','cyan')}${progressRow('Statutory data',e.tax==='Pending'?45:100,e.tax==='Pending'?'Tax number missing':'Complete',e.tax==='Pending'?'red':'cyan')}${progressRow('Documents',Math.min(100,e.documents/16*100),`${e.documents} records retained`,'violet')}</div></div></div></section></div><section class="card"><div class="card-head"><div><h3>Contact and employee services</h3><p>Contact information and active service relationships</p></div></div><div class="card-body profile-summary-strip">${[['Work email',e.email],['Mobile',e.phone],['Leave available',e.leave],['Training status',e.training]].map(x=>`<div class="fact"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div></section></div>`,
      'Compensation':`<div class="employee-tab-panel"><div class="profile-summary-strip"><div class="fact"><span>Monthly base</span><strong>${maskSalary(e)}</strong></div><div class="fact"><span>Estimated gross</span><strong>${can('salary.view')?money(e.base*1.22):'Restricted'}</strong></div><div class="fact"><span>Estimated net</span><strong>${can('salary.view')?money(e.base*.72):'Restricted'}</strong></div><div class="fact"><span>Last review</span><strong>01 Jun 2026 · Approved</strong></div></div><section class="card"><div class="card-head"><div><h3>Recurring earnings and deductions</h3><p>Current effective components and governed calculation basis</p></div></div><div class="table-wrap"><table><thead><tr><th>Component</th><th>Monthly value</th><th>Treatment</th><th>Effective</th></tr></thead><tbody>${compensationRows.map(x=>`<tr><td><strong>${x[0]}</strong></td><td>${x[1]}</td><td>${x[2]}</td><td>01 Jun 2026</td></tr>`).join('')}</tbody></table></div></section><div class="grid two" style="margin-top:12px"><section class="card"><div class="card-head"><div><h3>Compensation history</h3><p>Versioned changes and approvals</p></div></div><div class="card-body timeline"><div class="timeline-item"><div><strong>Annual review approved</strong><p>Version 3 · 7.5% adjustment · CFO approved.</p></div><time>01 Jun</time></div><div class="timeline-item"><div><strong>Housing formula updated</strong><p>15% of eligible basic salary.</p></div><time>01 Jan</time></div></div></section><section class="card"><div class="card-head"><div><h3>Cost allocation</h3><p>Payroll expense distribution</p></div></div><div class="card-body">${progressRow(e.department,78,'Primary cost centre','cyan')}${progressRow('Shared services',14,'Allocated overhead','violet')}${progressRow('Projects',8,'Approved project codes','amber')}</div></section></div></div>`,
      'Bank and statutory':`<div class="employee-tab-panel"><div class="callout amber"><span class="kpi-icon amber">${icon('shield')}</span><div><strong>Sensitive fields are controlled by role, scope and audit policy</strong><p>Every view and edit is written to the sensitive-data access ledger.</p></div></div><div class="grid three" style="margin-top:12px"><div class="fact"><span>Bank account</span><strong>${can('salary.view')?e.bank:'Restricted'}</strong></div><div class="fact"><span>Taxpayer reference</span><strong>${can('salary.view')?e.tax:'Restricted'}</strong></div><div class="fact"><span>NSSA number</span><strong>${can('salary.view')?e.nssa:'Restricted'}</strong></div><div class="fact"><span>Payment currency</span><strong>${e.currency}</strong></div><div class="fact"><span>Tax residence</span><strong>Zimbabwe</strong></div><div class="fact"><span>NEC category</span><strong>Commercial sector</strong></div></div><section class="card" style="margin-top:12px"><div class="card-head"><div><h3>Bank and statutory change history</h3><p>Independent verification and maker-checker evidence</p></div></div><div class="card-body timeline"><div class="timeline-item warn"><div><strong>Bank account verification reviewed</strong><p>Callback evidence and account ownership check attached.</p></div><time>26 Jun</time></div><div class="timeline-item"><div><strong>NSSA identifier revalidated</strong><p>Matched to employee master and monthly contribution schedule.</p></div><time>03 Jun</time></div><div class="timeline-item"><div><strong>Tax reference verified</strong><p>Validation service returned an active taxpayer status.</p></div><time>02 Jun</time></div></div></section></div>`,
      'Documents':`<div class="employee-tab-panel"><section class="card"><div class="card-head"><div><h3>Employee document register</h3><p>Previewable, editable and version-controlled records</p></div><button class="btn small primary" data-action="employee-documents">Open vault</button></div><div class="table-wrap"><table><thead><tr><th>Document</th><th>Classification</th><th>Version</th><th>Status</th><th>Modified</th></tr></thead><tbody>${[['Employment contract','Restricted','2','Active','12 Feb 2022'],['Compensation schedule','Highly restricted','3','Approved','01 Jun 2026'],['National identity record','Restricted','1','Verified','12 Feb 2022'],['Bank verification evidence','Highly restricted','4','In review','26 Jun 2026'],['Training certificates','Internal','6','Published','25 Jun 2026']].map(x=>`<tr data-action="employee-documents"><td><strong class="link">${x[0]}</strong></td><td>${badge(x[1])}</td><td>${x[2]}</td><td>${badge(x[3])}</td><td>${x[4]}</td></tr>`).join('')}</tbody></table></div></section></div>`,
      'Leave':`<div class="employee-tab-panel"><div class="profile-summary-strip"><div class="fact"><span>Available balance</span><strong>${e.leave}</strong></div><div class="fact"><span>Used year to date</span><strong>10.0 days</strong></div><div class="fact"><span>Pending requests</span><strong>3.0 days</strong></div><div class="fact"><span>Estimated liability</span><strong>${can('salary.view')?money(e.base/22*15.5):'Restricted'}</strong></div></div><div class="grid two"><section class="card"><div class="card-head"><div><h3>Leave utilisation</h3><p>Entitlement, use and planned absence</p></div></div><div class="card-body">${progressRow('Annual leave used',40,'10 of 25 days','violet')}${progressRow('Pending leave',12,'3 days requested','amber')}${progressRow('Carry-forward exposure',22,'5.5 days at year-end','cyan')}</div></section><section class="card"><div class="card-head"><div><h3>Recent leave activity</h3><p>Requests and payroll-linked adjustments</p></div></div><div class="card-body timeline"><div class="timeline-item"><div><strong>Annual leave approved</strong><p>3 days · 08–10 July 2026.</p></div><time>28 Jun</time></div><div class="timeline-item"><div><strong>Leave accrual posted</strong><p>2.08 days added through June close.</p></div><time>26 Jun</time></div></div></section></div></div>`,
      'Training':`<div class="employee-tab-panel"><div class="grid three">${[['Payroll Data Privacy','Complete','30 Jun 2027'],['Cybersecurity Awareness','Complete','15 Jul 2027'],['Anti-Money Laundering',e.training.includes('overdue')?'Overdue':'Complete','31 Jul 2026']].map(x=>`<section class="card"><div class="card-body"><div class="list-icon">${icon('graduation')}</div><h3 style="margin:9px 0 3px;font-size:11px">${x[0]}</h3><p class="muted tiny">Valid until ${x[2]}</p>${badge(x[1])}</div></section>`).join('')}</div><section class="card" style="margin-top:12px"><div class="card-head"><div><h3>Role permission impact</h3><p>Operational access affected by expired certification</p></div></div><div class="card-body">${progressRow('Mandatory learning completion',e.training.includes('overdue')?67:100,e.training,'cyan')}${progressRow('Certification evidence',92,'11 of 12 documents verified','violet')}</div></section></div>`,
      'Audit':`<div class="employee-tab-panel"><section class="card"><div class="card-head"><div><h3>Employee record audit history</h3><p>Sensitive views, changes, approvals and generated records</p></div><button class="btn small" data-page="audit">Open full audit trail</button></div><div class="card-body timeline"><div class="timeline-item"><div><strong>Payroll readiness recalculated</strong><p>Employee master, statutory data and documents revalidated.</p></div><time>Today</time></div><div class="timeline-item warn"><div><strong>Bank details reviewed</strong><p>Independent verification evidence accessed by Payroll Manager.</p></div><time>26 Jun</time></div><div class="timeline-item"><div><strong>Compensation review approved</strong><p>Annual review version 3 approved by delegated authority.</p></div><time>01 Jun</time></div><div class="timeline-item"><div><strong>Employee record viewed</strong><p>Sensitive salary fields accessed under Payroll Manager role.</p></div><time>28 May</time></div></div></section></div>`
    };
    return panels[tab] || panels.Employment;
  };

  employeeDrawer = function(id,tab='Employment'){
    const e=employees.find(x=>x.id===id)||(employees[0]||__pr6EmployeePlaceholder);
    state.activeEmployeeTab=tab;
    const tabs=['Employment','Compensation','Bank and statutory','Documents','Leave','Training','Audit'];
    const body=`<div class="employee-profile">${employeeImage(e,'employee-photo')}<div><div class="eyebrow">${e.id} · ${badge(e.status)}</div><h2 style="font-size:21px;margin:0">${e.name}</h2><div class="muted" style="margin-top:4px">${e.title} · ${e.department} · ${e.branch}</div><div class="profile-facts"><div class="fact"><span>Employment type</span><strong>${e.type}</strong></div><div class="fact"><span>Start date</span><strong>${e.start}</strong></div><div class="fact"><span>Payroll currency</span><strong>${e.currency}</strong></div></div></div></div><div class="employee-tabs" role="tablist">${tabs.map(t=>`<button class="tab ${t===tab?'active':''}" data-employee-tab="${attr(t)}" data-employee-id="${e.id}" role="tab">${t}</button>`).join('')}</div><div id="employeeTabPanel">${employeeTabPanel(e,tab)}</div>`;
    openDrawer(e.name,`${e.id} · Governed employee, compensation and compliance record`,body,`${button('Activity','employee-audit','', 'audit')}${button('Open document vault','employee-documents','', 'folder')}<button class="btn primary" data-action="edit-employee" data-record-id="${e.recordId||''}">${icon('edit')}Edit employee</button>${e.status==='Terminated'?'':e.status==='Suspended'?`<button class="btn" data-action="reinstate-employee" data-record-id="${e.recordId||''}">${icon('check')}Reinstate</button>`:`<button class="btn" data-action="suspend-employee" data-record-id="${e.recordId||''}">${icon('lock')}Suspend</button><button class="btn danger" data-action="terminate-employee" data-record-id="${e.recordId||''}">${icon('x')}Terminate</button>`}`);
  };

  const payComponentsV2=[
    {code:'BASIC',name:'Basic salary',type:'Earning',calc:'Fixed monthly amount',currency:'Employee currency',gl:'5000 · Salaries',status:'Active',employees:128,impact:'USD 208,640'},
    {code:'HOUSING',name:'Housing allowance',type:'Earning',calc:'15% × eligible basic',currency:'USD / ZiG',gl:'5010 · Allowances',status:'Active',employees:96,impact:'USD 31,296'},
    {code:'TRANSPORT',name:'Transport allowance',type:'Earning',calc:'Fixed by grade',currency:'USD / ZiG',gl:'5010 · Allowances',status:'Active',employees:112,impact:'USD 18,460'},
    {code:'OVERTIME',name:'Overtime pay',type:'Earning',calc:'Approved hours × rate',currency:'Employee currency',gl:'5020 · Overtime',status:'Active',employees:42,impact:'USD 9,820'},
    {code:'BONUS',name:'Performance bonus',type:'Earning',calc:'Approved variable input',currency:'USD',gl:'5030 · Bonuses',status:'Draft',employees:18,impact:'USD 12,400'},
    {code:'PAYE',name:'PAYE tax',type:'Statutory',calc:'ZW-PAYE-2026.06',currency:'USD / ZiG',gl:'2100 · PAYE payable',status:'Active',employees:128,impact:'USD 44,860'},
    {code:'NSSA',name:'NSSA contribution',type:'Statutory',calc:'ZW-NSSA-2026.01',currency:'USD / ZiG',gl:'2110 · NSSA payable',status:'Active',employees:128,impact:'USD 4,032'},
    {code:'MEDICAL',name:'Medical aid contribution',type:'Deduction',calc:'Plan × membership tier',currency:'USD',gl:'2125 · Medical payable',status:'Active',employees:84,impact:'USD 9,180'},
    {code:'LOAN',name:'Employee loan repayment',type:'Deduction',calc:'Amortisation schedule',currency:'USD / ZiG',gl:'1305 · Staff loans',status:'Active',employees:27,impact:'USD 6,970'}
  ];

  const componentExportButtonsV5 = () => `<div class="export-icon-group" role="group" aria-label="Export filtered component catalogue"><button class="icon-btn" type="button" data-component-export="pdf" title="Export PDF" aria-label="Export component catalogue as PDF">${icon('file')}</button><button class="icon-btn" type="button" data-component-export="excel" title="Export Excel" aria-label="Export component catalogue as Excel">${icon('report')}</button><button class="icon-btn" type="button" data-component-export="csv" title="Export CSV" aria-label="Export component catalogue as CSV">${icon('download')}</button></div>`;
  const currentComponentFilterV5 = () => {
    const all = __pr6ComponentsV2() || [];
    const needle = String(state.componentSearch || '').trim().toLowerCase();
    return all.filter(c => (state.componentFilter === 'All' || (state.componentFilter === 'Draft changes' ? c.status === 'Draft' : c.type === state.componentFilter)) && (!needle || [c.code,c.name,c.calc,c.currency,c.gl,c.type,c.status].some(v => String(v || '').toLowerCase().includes(needle))));
  };
  const exportComponentsV5 = kind => {
    if (!__pr6IsLive()) { toast('Export unavailable','Component data is still loading.','warn'); return; }
    const rows = currentComponentFilterV5();
    const exporter = window.__PAYROLL_V6_EXPORT_COMPONENTS__;
    if (typeof exporter !== 'function') { toast('Export unavailable','The branded export service is not ready.','warn'); return; }
    void exporter(kind,{title:'Earnings and Deductions Catalogue',subtitle:'Payroll component configuration from the live Payroll API.',columns:['Code','Component','Type','Calculation','Currency','GL mapping','Status'],rows:rows.map(c=>[c.code,c.name,c.type,c.calc,c.currency,c.gl,c.status]),filename:'payroll-component-catalogue',landscape:true,meta:[['Catalogue filter',state.componentFilter||'All'],['Search',state.componentSearch||'All components'],['Components',String(rows.length)]],note:'Component definitions and lookups are from the Payroll API. Per-component monthly pay totals and employee assignment counts are not exposed by the current API and are not included. Database identifiers are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'});
  };
  const parseComponentCsvV5 = text => {
    const out=[];let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}else if(ch==='"')quoted=true;else if(ch===','){row.push(field);field='';}else if(ch==='\n'){row.push(field.replace(/\r$/,''));if(row.some(v=>v.trim()))out.push(row);row=[];field='';}else field+=ch;}
    if(quoted)throw new Error('The CSV contains an unclosed quoted field.');
    row.push(field.replace(/\r$/,''));if(row.some(v=>v.trim()))out.push(row);
    if(out.length<2)throw new Error('Add at least one component row below the CSV header.');
    const headers=out.shift().map(h=>h.trim());const required=['kind','code','name'];
    const missing=required.filter(h=>!headers.includes(h));if(missing.length)throw new Error(`Missing required CSV columns: ${missing.join(', ')}.`);
    const supported=new Set(['kind','code','name','description','calculationMethod','calculationRate','isTaxable','rate','threshold','ceiling','isStatutory','currencyCode','glAccountCode','effectiveDate','endDate']);
    const unknown=headers.filter(h=>!supported.has(h));if(unknown.length)throw new Error(`Unsupported CSV columns: ${unknown.join(', ')}.`);
    return out.map((values,index)=>{const raw=Object.fromEntries(headers.map((h,i)=>[h,String(values[i]||'').trim()]));const issues=[];const kind=raw.kind.toUpperCase();if(!['EARNING','DEDUCTION'].includes(kind))issues.push('kind must be EARNING or DEDUCTION');if(!raw.code)issues.push('code is required');if(!raw.name)issues.push('name is required');if(kind==='EARNING'&&(['rate','threshold','ceiling','currencyCode','effectiveDate','endDate'].some(k=>raw[k])||['true','1','yes'].includes(raw.isStatutory.toLowerCase())))issues.push('earning rows do not support deduction-only currency, rate, statutory or effective-date fields');if(kind==='DEDUCTION'&&['calculationMethod','calculationRate','isTaxable'].some(k=>raw[k]))issues.push('deduction rows do not support earning calculation or taxable fields');if(raw.effectiveDate&&!/^\d{4}-\d{2}-\d{2}$/.test(raw.effectiveDate))issues.push('effectiveDate must use YYYY-MM-DD');if(raw.endDate&&!/^\d{4}-\d{2}-\d{2}$/.test(raw.endDate))issues.push('endDate must use YYYY-MM-DD');if(raw.effectiveDate&&raw.endDate&&raw.endDate<raw.effectiveDate)issues.push('endDate cannot be before effectiveDate');if(kind==='EARNING'&&raw.currencyCode)issues.push('earning currency follows the employee salary structure; omit currencyCode');if(kind==='EARNING'&&raw.calculationMethod&&!['FIXED','PERCENT_BASIC'].includes(raw.calculationMethod.toUpperCase()))issues.push('calculationMethod must be FIXED or PERCENT_BASIC');if(kind==='EARNING'&&raw.calculationMethod.toUpperCase()==='PERCENT_BASIC'&&(!Number.isFinite(Number(raw.calculationRate))||Number(raw.calculationRate)<0||Number(raw.calculationRate)>100))issues.push('calculationRate must be between 0 and 100');if(kind==='DEDUCTION'&&raw.rate&&(!Number.isFinite(Number(raw.rate))||Number(raw.rate)<0||Number(raw.rate)>100))issues.push('rate must be between 0 and 100');for(const key of ['threshold','ceiling'])if(raw[key]&&(!Number.isFinite(Number(raw[key]))||Number(raw[key])<0))issues.push(`${key} must be a non-negative number`);if(['true','1','yes'].includes(raw.isStatutory.toLowerCase()))issues.push('statutory rules must be maintained in Statutory Configuration');const dup=out.slice(0,index).some(r=>String(r[headers.indexOf('code')]||'').trim().toUpperCase()===raw.code.toUpperCase());if(dup)issues.push('duplicate code in file');return{...raw,kind,code:raw.code.toUpperCase(),calculationMethod:raw.calculationMethod.toUpperCase()||'FIXED',isTaxable:!['false','0','no'].includes(raw.isTaxable.toLowerCase()),rate:raw.rate===''?0:Number(raw.rate),calculationRate:raw.calculationRate===''?null:Number(raw.calculationRate),threshold:raw.threshold===''?null:Number(raw.threshold),ceiling:raw.ceiling===''?null:Number(raw.ceiling),issues,line:index+2};});
  };
  const openComponentImportV5 = () => {
    window.__payrollComponentImportRows = null;
    openModal('Import component configuration','Import earning and voluntary deduction definitions supported by the Payroll API. Statutory brackets and levies remain in Statutory Configuration.',`<div class="form-grid"><div class="form-field full"><label for="componentCsvFile">Component CSV</label><input id="componentCsvFile" type="file" accept=".csv,text/csv"><small>Required columns: kind,code,name. Optional columns: description,calculationMethod,calculationRate,isTaxable,rate,threshold,ceiling,isStatutory,currencyCode,glAccountCode,effectiveDate,endDate.</small></div><div class="form-field full"><button class="btn small" type="button" data-action="download-component-template">Download CSV template</button></div><div class="form-field full"><div class="callout blue"><div><strong>Validated before saving</strong><p>Deduction currency may be USD, ZiG, or blank. Blank follows each employee salary split and creates native USD and ZiG deduction lines. No account or currency records are created by this import. Up to 200 rows are supported.</p></div></div></div></div>`,`${button('Cancel','close-modal')}${button('Validate CSV','validate-component-csv','primary','check')}`,true);
  };
  const showComponentCsvPreviewV5 = async () => {
    const file=document.querySelector('#componentCsvFile')?.files?.[0];if(!file){toast('Select a CSV file','Choose the component configuration CSV.','warn');return;}if(file.size>1024*1024){toast('CSV is too large','The maximum supported file size is 1 MB.','warn');return;}
    try{const parsed=parseComponentCsvV5(await file.text());if(parsed.length>200)throw new Error('Import up to 200 components at a time.');const ref=__pr6Ref(),currencies=Array.isArray(ref.currencies)?ref.currencies:[],accounts=Array.isArray(ref.componentAccounts)?ref.componentAccounts:[],existing=__pr6ComponentsV2()||[];const codes=new Set(existing.map(c=>String(c.code).toUpperCase()));const rows=parsed.map(r=>{const issues=[...r.issues];if(codes.has(r.code))issues.push('code already exists in the catalogue');let currency=null,account=null;if(r.currencyCode){currency=currencies.find(c=>String(c.code||'').toUpperCase()===r.currencyCode.toUpperCase());if(!currency)issues.push(`currency ${r.currencyCode} is not available`);}if(r.glAccountCode){account=accounts.find(a=>String(a.accountNo||a.code||'').toUpperCase()===r.glAccountCode.toUpperCase());if(!account)issues.push(`GL account ${r.glAccountCode} is not available`);else if(!String(account.accountType||'').toLowerCase().includes(r.kind==='EARNING'?'expense':'liabil'))issues.push(`GL account type does not match ${r.kind.toLowerCase()} posting`);}return{...r,currencyId:currency?.id||null,glAccountId:account?.id||null,issues};});window.__payrollComponentImportRows=rows;const ok=rows.filter(r=>!r.issues.length).length,bad=rows.length-ok;$('#modalBody').innerHTML=`<div class="callout ${bad?'amber':'blue'}"><div><strong>${ok} ready to import · ${bad} need correction</strong><p>Only rows marked ready will be submitted. Existing component codes are never overwritten.</p></div></div><div class="table-wrap" style="margin-top:12px;max-height:42vh"><table><thead><tr><th>CSV row</th><th>Code</th><th>Component</th><th>Type</th><th>Currency</th><th>Validation</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.line}</td><td>${__pr6Esc(r.code)}</td><td>${__pr6Esc(r.name)}</td><td>${__pr6Esc(r.kind)}</td><td>${__pr6Esc(r.currencyCode||'Salary currencies')}</td><td>${r.issues.length?__pr6Esc(r.issues.join('; ')):'Ready'}</td></tr>`).join('')}</tbody></table></div>`;$('#modalFoot').innerHTML=`${button('Back','import-components')}${button(ok?`Import ${ok} valid components`:'No valid rows','import-pay-components','primary','upload')}`;$('#modalFoot').querySelector('[data-action="import-pay-components"]')?.toggleAttribute('disabled',!ok);}catch(err){toast('CSV validation failed',err?.message||'Check the file and its header row.','bad');}
  };
  componentsPage = function(){
    state.componentFilter=state.componentFilter||'All';state.componentPage=Math.max(1,Number(state.componentPage)||1);state.componentPageSize=Number(state.componentPageSize)||10;
    const live=__pr6IsLive(),all=__pr6ComponentsV2()||[],filtered=currentComponentFilterV5(),total=filtered.length,pages=Math.max(1,Math.ceil(total/state.componentPageSize));state.componentPage=Math.min(state.componentPage,pages);const pageRows=filtered.slice((state.componentPage-1)*state.componentPageSize,state.componentPage*state.componentPageSize);const stats=__pr6ComponentStats(),health=__pr6ComponentHealth();
    const rowHtml=c=>`<tr data-component="${attr(c.code)}" data-component-id="${attr(c.id||'')}" data-component-kind="${attr(c.kind||'')}"><td data-label="Code"><span class="link">${__pr6Esc(c.code)}</span></td><td data-label="Component"><strong>${__pr6Esc(c.name)}</strong></td><td data-label="Type">${badge(c.type)}</td><td data-label="Calculation"><span class="component-formula">${__pr6Esc(c.calc)}</span></td><td data-label="Currency">${__pr6Esc(c.currency)}</td><td data-label="GL mapping">${__pr6Esc(c.gl)}</td><td data-label="Status">${badge(c.status)}</td><td data-label="Action"><button class="btn small" type="button">${icon('eye')}Open</button></td></tr>`;
    const componentLoadFailed=(__pr6Live.errors||[]).some(e=>['allowance-types','deduction-types'].includes(e.source));
    const body=!live?Array.from({length:5},()=>'<tr class="skeleton-row"><td colspan="8"><span></span></td></tr>').join(''):componentLoadFailed?'<tr><td colspan="8"><strong>Component catalogue could not be loaded.</strong> Refresh the data and try again.</td></tr>':pageRows.length?pageRows.map(rowHtml).join(''):`<tr><td colspan="8">${state.componentFilter==='Draft changes'?'No draft component changes are recorded.':'No components match this filter.'}</td></tr>`;
    const exporter=componentExportButtonsV5();
    return `<div class="page">${pageHead('Payroll administration','Earnings and Deductions Configuration','Configure earning and voluntary deduction calculation rules, currency treatment and general-ledger mapping from the live Payroll catalogue.',button('Import configuration','import-components','', 'upload')+button('Create component','new-component','primary','plus'))}
      <div class="grid kpis">${!live?['Earning components','Deduction components','PAYE brackets','Statutory levies'].map(x=>`<section class="card run-kpi-skeleton"><div class="skeleton-block" style="height:16px;width:55%"></div><div class="skeleton-block" style="height:28px;width:30%;margin-top:15px"></div></section>`).join(''):stats?kpi('Earning components',String(stats.earnings),stats.earningsSub,'wallet')+kpi('Deduction components',String(stats.deductions),stats.deductionsSub,'calculator','violet')+kpi('PAYE brackets',String(stats.brackets),'Currency-specific statutory bands','settings','cyan')+kpi('Statutory levies',String(stats.levies),'Effective-dated statutory configuration','shield','amber'):''}</div>
      <div class="component-layout"><section class="card"><div class="card-head"><div><h3>Pay component catalogue</h3><p>API-backed earning and deduction definitions</p></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${exporter}<div class="segmented component-tabs">${['All','Earning','Deduction','Statutory','Draft changes'].map(f=>`<button class="${state.componentFilter===f?'active':''}" data-component-filter="${attr(f)}">${f}</button>`).join('')}</div></div></div><div class="run-filter-bar"><label>Search components<input type="search" data-component-search placeholder="Code, name, calculation or account" value="${attr(state.componentSearch||'')}"></label><span class="tiny">${live?`Showing ${total?((state.componentPage-1)*state.componentPageSize+1):0}–${Math.min(state.componentPage*state.componentPageSize,total)} of ${total} components`:'Loading component catalogue…'}</span></div><div class="table-wrap component-table"><table class="responsive-table"><thead><tr><th>Code</th><th>Component</th><th>Type</th><th>Calculation</th><th>Currency</th><th>GL mapping</th><th>Status</th><th></th></tr></thead><tbody>${body}</tbody></table></div><div class="table-pagination"><span>${live?`${total} matching component${total===1?'':'s'}`:'Loading…'}</span><div><label>Rows <select data-component-page-size><option ${state.componentPageSize===10?'selected':''}>10</option><option ${state.componentPageSize===25?'selected':''}>25</option><option ${state.componentPageSize===50?'selected':''}>50</option></select></label><button class="btn small" data-component-page="${Math.max(1,state.componentPage-1)}" ${state.componentPage<=1?'disabled':''}>Previous</button><span>Page ${state.componentPage} of ${pages}</span><button class="btn small" data-component-page="${Math.min(pages,state.componentPage+1)}" ${state.componentPage>=pages?'disabled':''}>Next</button></div></div></section><aside class="component-side">${card('Configuration health','Current catalogue control position',`<div class="card-body">${!live?'<div class="skeleton" style="height:16px"></div>':health?progressRow('Active components',health.activePct,health.active+' of '+health.total+' active','cyan'):'No catalogue data available'}${live?progressRow('Components with GL mapping',health?.total?Math.round(health.mapped*100/health.total):0,`${health?.mapped||0} of ${health?.total||0} mapped`,'cyan'):''}${live?progressRow('Statutory deductions',health?.statutoryPct||0,`${health?.statutory||0} statutory deductions`,'amber'):''}</div>`)}<div style="height:12px"></div>${card('Monthly composition',__pr6Live.componentMix?`Latest completed payroll run · ${__pr6Esc(__pr6Live.componentMix.period)}`:'Payroll run detail unavailable',`<div class="card-body">${(()=>{const m=__pr6Live.componentMix;if(!m)return '<p class="muted">No completed payroll run detail is available to your role.</p>';const currency=m.currencyCode==='ZIG'?'ZiG':'USD',gross=Number(m.gross)||0,pct=v=>gross>0?Math.max(0,Math.min(100,Math.round(Number(v||0)*100/gross))):0,byCurrency=m.deductionsByCurrency||{};return `<p class="tiny muted">${Number(m.employeeCount)||0} calculated employee payroll rows · reporting totals in ${__pr6Esc(m.currencyCode||'USD')}</p>${progressRow('Basic salary',pct(m.basic),money(m.basic,currency),'cyan')}${progressRow('Allowances',pct(m.allowances),money(m.allowances,currency),'violet')}${progressRow('Net pay (reporting currency)',pct(m.net),money(m.net,currency),'amber')}<div class="list-row"><span>USD deductions</span><strong>${money(Number(byCurrency.USD)||0,'USD')}</strong></div><div class="list-row"><span>ZiG deductions</span><strong>${money(Number(byCurrency.ZIG)||0,'ZiG')}</strong></div>`})()}</div>`) }</aside></div>
    </div>`;
  };

  const componentDrawerV2 = (code, id, kind) => {
    const ref = __pr6Ref();
    const list = kind === 'EARNING' ? ref.allowanceTypes : ref.deductionTypes;
    const record = (Array.isArray(list) ? list : []).find(item => item.id === id);
    if (!record) { toast('Component unavailable', 'Reload the catalogue and try again.', 'warn'); return; }
    openComponentForm(record, kind);
  };

  const payGroupsV2=[
    {id:'monthly',name:'Monthly Staff',employees:128,currency:'USD / ZiG',cadence:'Monthly',status:'Active',cutoff:'20 Jul 2026',payment:'31 Jul 2026'},
    {id:'executive',name:'Executives',employees:12,currency:'USD',cadence:'Monthly',status:'Active',cutoff:'21 Jul 2026',payment:'31 Jul 2026'},
    {id:'contract',name:'Contract Staff',employees:34,currency:'ZiG',cadence:'Monthly',status:'Active',cutoff:'18 Jul 2026',payment:'28 Jul 2026'},
    {id:'commission',name:'Commission Sales',employees:21,currency:'USD / ZiG',cadence:'Monthly',status:'Review',cutoff:'22 Jul 2026',payment:'31 Jul 2026'}
  ];
  const calendarPeriods=[
    ['Jul 2026','20 Jul','23 Jul','24 Jul','27 Jul','31 Jul','10 Aug','Open'],
    ['Aug 2026','20 Aug','24 Aug','25 Aug','27 Aug','31 Aug','10 Sep','Scheduled'],
    ['Sep 2026','21 Sep','24 Sep','25 Sep','28 Sep','30 Sep','12 Oct','Scheduled'],
    ['Oct 2026','20 Oct','23 Oct','26 Oct','28 Oct','30 Oct','10 Nov','Scheduled'],
    ['Nov 2026','20 Nov','23 Nov','24 Nov','26 Nov','30 Nov','10 Dec','Scheduled'],
    ['Dec 2026','18 Dec','21 Dec','22 Dec','23 Dec','31 Dec','11 Jan','Scheduled']
  ];

  calendarPage = function(){ return __pr6CalendarPageHtml(); };

  const openScheduleModal = period => openModal(`Edit ${period || 'payroll'} schedule`,'Changes are versioned and require independent approval before the calendar is published.',`<div class="form-grid"><div class="form-field"><label>Pay group</label><select><option>Monthly Staff</option><option>Executives</option><option>Contract Staff</option></select></div><div class="form-field"><label>Period</label><input value="${period || 'July 2026'}"></div><div class="form-field"><label>Input cut-off</label><input type="date" value="2026-07-20"></div><div class="form-field"><label>Calculation date</label><input type="date" value="2026-07-23"></div><div class="form-field"><label>Review date</label><input type="date" value="2026-07-24"></div><div class="form-field"><label>Approval date</label><input type="date" value="2026-07-27"></div><div class="form-field"><label>Payment date</label><input type="date" value="2026-07-31"></div><div class="form-field"><label>Statutory deadline</label><input type="date" value="2026-08-10"></div><div class="form-field full"><label>Change reason</label><textarea placeholder="Record the operational reason and supporting authority..."></textarea></div></div>`,`${button('Cancel','close-modal')}${button('Save draft schedule','save-schedule-v2','primary','check')}`,true);

  reportsPage = function(){
    return `<div class="page">${pageHead('Compliance and management reporting','Compliance Report Studio','Generate filing-ready, audit-ready and management reports from governed payroll data. Every template opens as an editable preview before approval or export.',button('Scheduled reports','scheduled-reports','', 'calendar')+button('Build custom report','custom-report','primary','plus'))}
      <div class="grid kpis">${kpi('Report templates','12','Statutory, control and management','report')}${kpi('Generated this month','28','Across June payroll workflows','file','cyan')}${kpi('Awaiting approval','4','Maker-checker review required','shield','amber')}${kpi('Scheduled deliveries','9','Secure recipients and channels','send','violet')}${kpi('Filing deadlines','4','Within the next 17 days','calendar','amber')}${kpi('Evidence completeness','\u2014','No completeness measure is recorded','audit','cyan')}</div>
      <div class="report-grid">${reportTemplates.map((r,i)=>`<article class="report-card" data-report="${r.id}"><div class="report-preview-mini"><div class="report-icon">${icon('report')}</div><div class="sheet-lines"><i></i><i></i><i></i><i></i></div></div><div class="report-card-content"><h4>${r.name}</h4><p>${r.desc}</p><footer><span>${r.category} · ${r.freq}</span>${badge(i%4===0?'Needs review':'Ready')}</footer><div class="report-card-actions"><button class="btn small soft" data-report="${r.id}">${icon('eye')}Preview</button><button class="btn small" data-report="${r.id}">${icon('edit')}Generate draft</button></div></div></article>`).join('')}</div>
    </div>`;
  };

  let vendorsV2=[
    {id:'VEN-001',name:'Medsure Health Fund',initials:'MH',category:'Medical aid and employee benefits',country:'Zimbabwe',contact:'Nomsa Dube',email:'bids@medsure.co.zw',status:'Approved',compliance:96,rating:4.7,spend:'USD 148,200',renewal:'31 Dec 2026',documents:12},
    {id:'VEN-002',name:'SkillBridge Africa',initials:'SA',category:'Training and certification',country:'Zimbabwe / South Africa',contact:'Kudzai Ncube',email:'tenders@skillbridge.africa',status:'Approved',compliance:92,rating:4.5,spend:'USD 46,800',renewal:'30 Sep 2026',documents:9},
    {id:'VEN-003',name:'ZimPay Bureau Services',initials:'ZP',category:'Payroll continuity services',country:'Zimbabwe',contact:'Farai Moyo',email:'rfq@zimpay.co.zw',status:'Due diligence',compliance:78,rating:4.1,spend:'USD 22,500',renewal:'15 Aug 2026',documents:7},
    {id:'VEN-004',name:'Stanbic Bank Zimbabwe',initials:'SB',category:'Payroll banking and settlement',country:'Zimbabwe',contact:'Corporate Banking Desk',email:'payrollservices@stanbic.co.zw',status:'Approved',compliance:100,rating:4.8,spend:'USD 18,400',renewal:'31 Mar 2027',documents:14},
    {id:'VEN-005',name:'TalentSource Zimbabwe',initials:'TZ',category:'Recruitment and background screening',country:'Zimbabwe',contact:'Ruvimbo Chari',email:'proposals@talentsource.co.zw',status:'Review',compliance:84,rating:4.0,spend:'USD 31,700',renewal:'30 Nov 2026',documents:8}
  ];
  const quoteRowsV2=[
    {vendor:'Medsure Health Fund',price:'USD 18.40 / employee',technical:92,commercial:86,compliance:96,total:91,recommended:true},
    {vendor:'FirstCare Benefits',price:'USD 17.80 / employee',technical:84,commercial:91,compliance:88,total:87,recommended:false},
    {vendor:'Premier Medical Admin',price:'USD 19.10 / employee',technical:89,commercial:79,compliance:93,total:87,recommended:false}
  ];

  vendorsPage = function(){
    const __vn=__pr6Vendors();const rows=__vn?(__vn.items.length?__vn.items.map(v=>`<tr data-vendor="${v.id}"><td><div class="access-user"><div class="vendor-logo">${(v.name||'?').slice(0,2).toUpperCase()}</div><div><strong class="link">${v.name}</strong><div class="tiny muted">${v.category||'Uncategorised'}</div></div></div></td><td>${v.paymentTerms||'\u2014'}</td><td>${v.contactPerson||'\u2014'}<div class="tiny muted">${v.email||''}</div></td><td>${badge(v.complianceStatus)}</td><td>${v.rating==null?'<span class="tiny muted">Not rated</span>':v.rating+' / 5'}</td><td>${v.blacklisted?badge('Blacklisted'):badge('Active')}</td></tr>`):[`<tr><td colspan="6" class="tiny muted">No vendors are registered.</td></tr>`]):[`<tr><td colspan="6" class="tiny muted">Vendor registry unavailable for your role.</td></tr>`];
    return `<div class="page">${pageHead('HR and payroll procurement','Vendor Registry and Quotation Management','Govern vendors, issue secure bid forms by email, receive structured submissions, compare quotations and retain complete sourcing evidence.',button('Create RFQ','new-rfq','', 'file')+button('Add vendor','new-vendor','primary','plus'))}
      <div class="grid kpis">${(()=>{const v=__pr6Vendors();if(!v)return kpi('Registered vendors','\u2014','Vendor registry unavailable for your role','briefcase');return kpi('Registered vendors',String(v.registered),v.categories+' categories','briefcase')+kpi('Compliance ready',String(v.compliant),v.pending+' pending, '+v.expired+' expired','shield','cyan')+kpi('Blacklisted',String(v.blacklisted),v.blacklisted?'Excluded from sourcing':'None excluded','shield',v.blacklisted?'amber':'')+kpi('Rated vendors',String(v.ratedCount),v.averageRating==null?'No ratings recorded':'Average '+v.averageRating+' / 5','briefcase','violet')})()}</div>
      <div class="vendor-layout"><section class="card"><div class="card-head"><div><h3>Vendor registry</h3><p>Due diligence, compliance, service performance and spend visibility</p></div><button class="btn small" data-action="download-vendor-register">${icon('download')}Export</button></div><div class="table-wrap"><table><thead><tr><th>Vendor</th><th>Coverage</th><th>Primary contact</th><th>Compliance</th><th>Rating</th><th>12-month spend</th><th>Status</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div></section><aside class="stack">${card('Open sourcing event',`${(()=>{const __pr6RfqSubtitle=1;const q=__pr6Rfqs();if(!q)return 'Not visible to your role';const r=q.rfqs.find(x=>x.status==='OPEN'||x.status==='EVALUATING')||q.rfqs[0];return r?(r.reference+' · '+r.title):'No sourcing event has been raised'})()}`,`<div class="card-body">${(()=>{const __pr6RfqFacts=1;const q=__pr6Rfqs();const fact=(l,v)=>`<div class="fact"><span>${l}</span><strong>${v}</strong></div>`;if(!q)return `<div class="profile-summary-strip">`+fact('Invited','\u2014')+fact('Bids received','\u2014')+`</div>`;const r=q.rfqs.find(x=>x.status==='OPEN'||x.status==='EVALUATING')||q.rfqs[0];if(!r)return `<div class="profile-summary-strip">`+fact('Invited','0')+fact('Bids received','0')+`</div>`;const pct=r.invitedCount?Math.round((r.bidCount/r.invitedCount)*100):0;return `<div class="profile-summary-strip">`+fact('Invited',r.invitedCount+' vendor'+(r.invitedCount===1?'':'s'))+fact('Bids received',r.bidCount)+fact('Closes',r.closingDate?String(r.closingDate).slice(0,10):'\u2014')+fact('Status',r.status)+`</div>`+progressRow('Submission progress',pct,r.bidCount+' of '+r.invitedCount+' invited vendors','cyan')})()}<div class="actions" style="margin-top:12px">${button('Send bid form','send-bid-form','primary','send')}${button('Preview form','preview-bid-form','', 'eye')}</div></div>`)}${card('Vendor control health','Registry-wide compliance position',`<div class="card-body">${progressRow('Tax clearance',92,'24 of 26 valid','cyan')}${progressRow('Bank verification',100,'All active vendors verified','cyan')}${progressRow('Data protection terms',85,'22 of 26 signed','amber')}${progressRow('Conflict declarations',96,'25 of 26 current','violet')}</div>`)}</aside></div>
      <div class="grid two" style="margin-top:12px"><section class="card"><div class="card-head"><div><h3>Quotation comparison</h3><p>Weighted technical, commercial and compliance evaluation</p></div><button class="btn small primary" data-action="compare-quotations">Open full comparison</button></div><div class="card-body quote-matrix"><div class="quote-row header"><div>Vendor</div><div>Technical</div><div>Commercial</div><div>Compliance</div><div>Total</div></div>${(()=>{const __pr6QuoteRows=1;const q=__pr6Rfqs();if(!q)return `<div class="quote-row"><div class="quote-cell">Not visible to your role</div></div>`;const r=q.rfqs.find(x=>x.status==='OPEN'||x.status==='EVALUATING')||q.rfqs[0];const bids=r?r.bids.filter(b=>b.status!=='INVITED'):[];if(!bids.length)return `<div class="quote-row"><div class="quote-cell">No bids have been submitted.</div></div>`;const cell=(l,v)=>`<div class="quote-cell" data-label="${l}"><strong>${v==null?'\u2014':v+'%'}</strong><div class="score-bar"><i style="width:${v==null?0:v}%"></i></div></div>`;return bids.map(b=>`<div class="quote-row"><div class="quote-cell" data-label="Vendor"><strong>${b.vendorName}</strong><span>${b.amount==null?'\u2014':b.currencyCode+' '+Number(b.amount).toLocaleString()}</span></div>`+cell('Technical',b.technicalScore)+cell('Commercial',b.commercialScore)+cell('Compliance',b.complianceScore)+`<div class="quote-cell" data-label="Total"><strong>${b.weightedScore==null?'Not scored':b.weightedScore+'%'}</strong></div></div>`).join('')})()}</div></section><section class="card"><div class="card-head"><div><h3>System-generated vendor bid form</h3><p>Secure, structured and linked to the RFQ evidence record</p></div></div><div class="card-body"><div class="bid-form-preview"><h4>Medical Aid Administration · RFQ-HR-2026-014</h4><div class="bid-form-fields"><div class="bid-field"><span>Vendor identity</span><strong>Pre-filled from secure invitation</strong></div><div class="bid-field"><span>Pricing schedule</span><strong>Currency, tax and rate basis</strong></div><div class="bid-field"><span>Technical response</span><strong>Service, SLA and implementation</strong></div><div class="bid-field"><span>Compliance evidence</span><strong>Upload required documents</strong></div><div class="bid-field"><span>Declarations</span><strong>Conflicts and beneficial ownership</strong></div><div class="bid-field"><span>Submission control</span><strong>Timestamp and verification hash</strong></div></div></div><div class="actions" style="margin-top:12px">${button('Preview vendor experience','preview-bid-form','', 'eye')}${button('Email secure form','send-bid-form','primary','send')}</div></div></section></div>
    </div>`;
  };

  const vendorDrawerV2 = id => {
    const v=vendorsV2.find(x=>x.id===id)||vendorsV2[0];
    openDrawer(v.name,`${v.id} · Governed vendor record`,`<div class="vendor-drawer-header"><div class="vendor-logo" style="width:58px;height:58px;border-radius:12px;font-size:15px">${v.initials}</div><div><div class="eyebrow">${v.category}</div><h2 style="font-size:20px;margin:0">${v.name}</h2><div class="muted tiny" style="margin-top:4px">${v.country} · ${badge(v.status)}</div></div></div><div class="profile-summary-strip" style="margin-top:14px"><div class="fact"><span>Compliance score</span><strong>${v.compliance}%</strong></div><div class="fact"><span>Service rating</span><strong>${v.rating} / 5</strong></div><div class="fact"><span>12-month spend</span><strong>${v.spend}</strong></div><div class="fact"><span>Next renewal</span><strong>${v.renewal}</strong></div></div><div class="grid two"><section class="card"><div class="card-head"><div><h3>Vendor profile</h3><p>Identity, ownership and service relationship</p></div></div><div class="card-body form-grid">${[['Primary contact',v.contact],['Email',v.email],['Category',v.category],['Coverage',v.country],['Bank verification','Verified'],['Beneficial ownership','Declared and screened']].map(x=>`<div class="fact"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div></section><section class="card"><div class="card-head"><div><h3>Compliance readiness</h3><p>Current evidence and due diligence</p></div></div><div class="card-body">${progressRow('Tax clearance',v.compliance,'Valid to 31 Dec 2026','cyan')}${progressRow('Bank verification',100,'Account ownership confirmed','cyan')}${progressRow('Data protection',92,'Signed processing terms','violet')}${progressRow('Conflict declaration',100,'Current declaration on file','cyan')}</div></section></div><section class="card" style="margin-top:12px"><div class="card-head"><div><h3>Recent sourcing activity</h3><p>Invitations, bids and evaluation history</p></div></div><div class="card-body timeline"><div class="timeline-item"><div><strong>Bid submitted</strong><p>RFQ-HR-2026-014 · structured response and 6 attachments.</p></div><time>30 Jul</time></div><div class="timeline-item"><div><strong>Secure invitation opened</strong><p>Identity token verified and vendor form accessed.</p></div><time>27 Jul</time></div><div class="timeline-item"><div><strong>Compliance record refreshed</strong><p>Tax clearance and conflict declaration approved.</p></div><time>15 Jul</time></div></div></section>`,`${button('Open vendor documents','vendor-documents','', 'folder')}${button('Send secure email','email-vendor','primary','send')}`);
  };

  const bidFormBody = () => `<div class="callout blue"><span class="kpi-icon">${icon('shield')}</span><div><strong>Secure vendor submission</strong><p>The invitation token identifies the vendor, locks the RFQ version and records every upload and submission event.</p></div></div><div class="form-grid" style="margin-top:12px"><div class="form-field"><label>Legal vendor name</label><input value="Medsure Health Fund" readonly></div><div class="form-field"><label>RFQ reference</label><input value="RFQ-HR-2026-014" readonly></div><div class="form-field"><label>Currency</label><select><option>USD</option><option>ZiG</option></select></div><div class="form-field"><label>Price per employee</label><input value="18.40"></div><div class="form-field full"><label>Technical response</label><textarea>Implementation approach, service model, account management and SLA response...</textarea></div><div class="form-field"><label>Implementation period</label><input value="4 weeks"></div><div class="form-field"><label>Offer validity</label><input value="90 days"></div><div class="form-field full"><label>Evidence upload</label><input type="file" multiple></div><div class="form-field full"><label><input type="checkbox" checked> I confirm the pricing, declarations and attachments are complete and authorised.</label></div></div>`;

  const previewBidFormV2 = () => openModal('Vendor Bid Form Preview','Vendor-facing experience · RFQ-HR-2026-014 · secure submission link',bidFormBody(),`${button('Close','close-modal')}${button('Send invitations','send-bid-form','primary','send')}`,true);
  const inviteModalV2 = () => openModal('Email Secure Bid Form','Generate personalised invitations through the connected email service.',`<div class="email-preview"><div class="email-line"><span>To</span><strong>Medsure Health Fund; FirstCare Benefits; Premier Medical Admin</strong></div><div class="email-line"><span>Subject</span><strong>Invitation to Bid · Medical Aid Administration · RFQ-HR-2026-014</strong></div><div class="email-line"><span>Message</span><div>Dear Vendor,<br><br>Arcus Holdings invites your organisation to submit a structured proposal for medical aid administration. Use the secure link below. The form closes on 05 August 2026 at 16:00 CAT.<br><br><div class="secure-link">https://supplier.matanho.app/bid/RFQ-HR-2026-014/[personal-token]</div><br>Regards,<br>People & Payroll Procurement</div></div></div><div class="callout amber" style="margin-top:12px"><span class="kpi-icon amber">${icon('clock')}</span><div><strong>Each vendor receives a unique, expiring link</strong><p>Opening, document uploads and final submission are retained in the RFQ audit trail.</p></div></div>`,`${button('Preview form','preview-bid-form','', 'eye')}${button('Send 3 invitations','send-vendor-invitations','primary','send')}`,true);

  const quoteComparisonV2 = () => openModal('Quotation Comparison · RFQ-HR-2026-014','Weighted evaluation with source responses, evaluator comments and approval controls.',`<div class="table-wrap"><table><thead><tr><th>Criterion</th><th>Weight</th>${quoteRowsV2.map(q=>`<th>${q.vendor}</th>`).join('')}</tr></thead><tbody>${[['Implementation and service model','25%',[94,82,88]],['SLA and member support','20%',[91,86,89]],['Price and total cost','25%',[86,94,79]],['Compliance and due diligence','20%',[96,88,93]],['References and performance','10%',[89,83,91]]].map(row=>`<tr><td><strong>${row[0]}</strong></td><td>${row[1]}</td>${row[2].map(v=>`<td>${v}%</td>`).join('')}</tr>`).join('')}<tr><td><strong>Weighted total</strong></td><td>100%</td>${quoteRowsV2.map(q=>`<td>${badge(`${q.total}%${q.recommended?' · Preferred':''}`)}</td>`).join('')}</tr><tr><td><strong>Quoted price</strong></td><td></td>${quoteRowsV2.map(q=>`<td>${q.price}</td>`).join('')}</tr></tbody></table></div><div class="grid two" style="margin-top:12px"><div class="callout blue"><span class="kpi-icon">${icon('check')}</span><div><strong>Recommended: Medsure Health Fund</strong><p>Highest weighted score with stronger implementation, compliance and service-control evidence.</p></div></div><div class="callout amber"><span class="kpi-icon amber">${icon('shield')}</span><div><strong>Approval not yet recorded</strong><p>The evaluation committee recommendation requires procurement and executive approval.</p></div></div></div>`,`${button('Export comparison','export-quote-comparison','', 'download')}${button('Record recommendation','generic-save','primary','check')}`,true);

  const newVendorModalV2 = () => openModal('Add Vendor to Registry','Create a due-diligence record before inviting the vendor to a sourcing event.',`<div class="form-grid"><div class="form-field"><label>Legal vendor name</label><input id="v2VendorName" placeholder="Vendor legal name"></div><div class="form-field"><label>Category</label><select id="v2VendorCategory"><option>Training and certification</option><option>Medical aid and benefits</option><option>Recruitment and screening</option><option>Payroll services</option><option>Banking and settlement</option></select></div><div class="form-field"><label>Primary contact</label><input id="v2VendorContact" placeholder="Contact person"></div><div class="form-field"><label>Email</label><input id="v2VendorEmail" type="email" placeholder="bids@vendor.co.zw"></div><div class="form-field"><label>Country</label><input id="v2VendorCountry" value="Zimbabwe"></div><div class="form-field"><label>Tax reference</label><input placeholder="Tax reference"></div><div class="form-field full"><label>Due diligence notes</label><textarea placeholder="Ownership, sanctions screening, conflicts and service capability..."></textarea></div></div>`,`${button('Cancel','close-modal')}${button('Create vendor record','save-vendor-v2','primary','check')}`);
  const newRFQModalV2 = () => openModal('Create Vendor RFQ','Generate a structured sourcing event and secure vendor response form.',`<div class="form-grid"><div class="form-field full"><label>RFQ title</label><input value="Medical Aid Administration"></div><div class="form-field"><label>Reference</label><input value="RFQ-HR-2026-014"></div><div class="form-field"><label>Submission deadline</label><input type="datetime-local" value="2026-08-05T16:00"></div><div class="form-field"><label>Currency</label><select><option>USD</option><option>ZiG</option><option>Multi-currency</option></select></div><div class="form-field"><label>Evaluation method</label><select><option>Weighted technical and commercial</option><option>Lowest compliant price</option></select></div><div class="form-field full"><label>Scope and deliverables</label><textarea>Medical aid administration, member support, claims oversight, reporting and implementation services.</textarea></div><div class="form-field full"><label>Invite vendors</label><select multiple size="4"><option selected>Medsure Health Fund</option><option selected>FirstCare Benefits</option><option selected>Premier Medical Admin</option><option>HealthLink Services</option></select></div></div>`,`${button('Save draft','generic-save')}${button('Create and preview form','save-rfq-v2','primary','eye')}`,true);

  const calendarMilestoneDrawer = index => {
    const m=[['Inputs close','20 July 2026','All recurring and variable inputs must be committed or formally authorised as late changes.'],['Calculate','23 July 2026','The locked input population is calculated under statutory ruleset ZW-2026.07.'],['Review','24 July 2026','Payroll Manager reviews movement, exceptions, sampled calculations and source evidence.'],['Approve','27 July 2026','Independent approver records the maker-checker decision and release conditions.'],['Payment','31 July 2026','Approved bank batches are released through the controlled settlement channel.'],['Statutory filing','10 August 2026','PAYE, NSSA, AIDS levy and other return packs are filed and reconciled.']][Number(index)] || [];
    openDrawer(m[0],`${m[1]} · Monthly Staff payroll milestone`,`<div class="callout blue"><span class="kpi-icon">${icon('calendar')}</span><div><strong>${m[2]}</strong><p>Every completion, exception and date change is retained in the payroll calendar audit history.</p></div></div><div class="grid three" style="margin-top:12px"><div class="fact"><span>Owner</span><strong>Payroll Operations</strong></div><div class="fact"><span>Status</span><strong>${Number(index)===0?'Open':'Scheduled'}</strong></div><div class="fact"><span>Approval rule</span><strong>Maker-checker</strong></div></div><section class="card" style="margin-top:12px"><div class="card-head"><div><h3>Control checklist</h3><p>Required evidence before milestone completion</p></div></div><div class="card-body">${[['Population confirmed','Complete'],['Required source files received',Number(index)===0?'In progress':'Scheduled'],['Calendar conflicts checked','Complete'],['Responsible owner assigned','Complete']].map(x=>`<div class="list-row"><div class="list-main"><strong>${x[0]}</strong><span>Evidence retained in the period file</span></div>${badge(x[1])}</div>`).join('')}</div></section>`,`${button('Edit milestone','edit-schedule-v2','primary','edit')}`);
  };

  render = function(){
    if(!__pr6IsLive()){
      // Keep the final navigation and page out of view until access and data are known.
      const nav=rootEl.querySelector('#nav');
      const content=rootEl.querySelector('#content');
      if(nav)nav.innerHTML='';
      if(content)content.innerHTML='<div class="page" aria-label="Loading payroll"><div class="grid four">'+Array.from({length:4},()=>'<div class="card"><div class="card-body"><div class="skeleton" style="height:14px;width:48%"></div><div class="skeleton" style="height:27px;width:66%;margin-top:18px"></div></div></div>').join('')+'</div><div class="card" style="margin-top:16px"><div class="card-body">'+Array.from({length:5},()=>'<div class="skeleton" style="height:32px;margin:10px 0"></div>').join('')+'</div></div></div>';
      updateSidebarControl();
      return;
    }
    // Payroll is available to every signed-in user through My Pay. The root route is privileged.
    if(__pr6IsLive()&&state.page==='overview'&&!permittedPage('overview')){
      state.page='mypay';
      try{if(typeof window.__PAYROLL_V6_NAV__==='function')window.__PAYROLL_V6_NAV__('mypay');}catch(_){}
      try{if(window.location.pathname!=='/payroll/mypay')History.prototype.replaceState.call(window.history,null,'','/payroll/mypay');}catch(_){}

    }
    renderNav();
    const pages={overview:overviewPage,employees:employeesPage,onboarding:onboardingPage,runs:runsPage,inputs:inputsPage,exceptions:exceptionsPage,approvals:approvalsPage,close:closePage,components:componentsPage,calendar:calendarPage,tax:taxPage,training:trainingPage,leave:leavePage,vendors:vendorsPage,vault:vaultPage,reports:reportsPage,audit:auditPage,access:accessPage,settings:settingsPage,mypay:myPayPage};
    const fn=pages[state.page]||overviewPage;
    if(typeof permittedPage==='function'&&!permittedPage(state.page)){document.querySelector('#content').innerHTML=__pr6DeniedPageHtml(state.page);document.querySelector('#content').scrollTop=0;}else{
    document.querySelector('#content').innerHTML=fn();
    document.querySelector('#content').scrollTop=0;}
    updateSidebarControl();
  };

  const activityButton = document.querySelector('#activityButton');
  const activityMenu = document.querySelector('#activityMenu');
  const toggleActivity = force => {
    if (!activityMenu || !activityButton) return;
    const open = typeof force === 'boolean' ? force : !activityMenu.classList.contains('open');
    activityMenu.classList.toggle('open',open);
    activityButton.setAttribute('aria-expanded',String(open));
  };
  activityButton?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggleActivity();});

  const customActions = new Set(['new-vendor','new-rfq','preview-bid-form','send-bid-form','send-vendor-invitations','compare-quotations','save-vendor-v2','save-rfq-v2','download-vendor-register','export-quote-comparison','edit-schedule-v2','save-schedule-v2','copy-calendar-v2','email-vendor','vendor-documents','employee-audit']);
  document.addEventListener('click', event => {
    if (!event.target.closest('#activityMenuWrap')) toggleActivity(false);
    if (event.target.closest('#activityMenu .activity-option')) toggleActivity(false);

    const employeeTab=event.target.closest('[data-employee-tab]');
    if(employeeTab){
      event.preventDefault();event.stopImmediatePropagation();
      const employee=employees.find(x=>x.id===employeeTab.dataset.employeeId)||(employees[0]||__pr6EmployeePlaceholder);
      document.querySelectorAll('.employee-tabs .tab').forEach(t=>t.classList.toggle('active',t===employeeTab));
      const panel=document.querySelector('#employeeTabPanel');
      if(panel) panel.innerHTML=employeeTabPanel(employee,employeeTab.dataset.employeeTab);
      state.activeEmployeeTab=employeeTab.dataset.employeeTab;
      return;
    }
    const focusCard=event.target.closest('[data-focus-card]');
    if(focusCard && !event.target.closest('button,a,input,select')){
      document.querySelectorAll('[data-focus-card].is-focused').forEach(card=>{if(card!==focusCard)card.classList.remove('is-focused')});
      focusCard.classList.toggle('is-focused');
    }
    const componentExport=event.target.closest('[data-component-export]');if(componentExport){event.preventDefault();event.stopImmediatePropagation();exportComponentsV5(componentExport.dataset.componentExport);return;}
    const componentPage=event.target.closest('[data-component-page]');if(componentPage){event.preventDefault();event.stopImmediatePropagation();state.componentPage=Number(componentPage.dataset.componentPage)||1;render();return;}
    const componentFilter=event.target.closest('[data-component-filter]');
    if(componentFilter){event.preventDefault();event.stopImmediatePropagation();state.componentFilter=componentFilter.dataset.componentFilter;render();return;}
    const component=event.target.closest('[data-component]');
    if(component){event.preventDefault();event.stopImmediatePropagation();componentDrawerV2(component.dataset.component,component.dataset.componentId,component.dataset.componentKind);return;}
    const paygroup=event.target.closest('[data-paygroup]');
    if(paygroup){event.preventDefault();event.stopImmediatePropagation();state.selectedPayGroup=paygroup.dataset.paygroup;render();return;}
    const milestone=event.target.closest('[data-calendar-milestone]');
    if(milestone && !event.target.closest('[data-action]')){event.preventDefault();event.stopImmediatePropagation();calendarMilestoneDrawer(milestone.dataset.calendarMilestone);return;}
    const vendor=event.target.closest('[data-vendor]');
    if(vendor){event.preventDefault();event.stopImmediatePropagation();vendorDrawerV2(vendor.dataset.vendor);return;}
    const action=event.target.closest('[data-action]');
    if(!action || !customActions.has(action.dataset.action)) return;
    event.preventDefault();event.stopImmediatePropagation();
    switch(action.dataset.action){
      case 'new-vendor': newVendorModalV2(); break;
      case 'new-rfq': newRFQModalV2(); break;
      case 'preview-bid-form': previewBidFormV2(); break;
      case 'send-bid-form': inviteModalV2(); break;
      case 'send-vendor-invitations':
        logEvent('VENDOR_BID_INVITATIONS_SENT','RFQ-HR-2026-014','Three personalised secure bid forms sent by email','Change');
        closeModal();toast('Vendor invitations sent','Three secure, expiring submission links were sent and added to the RFQ audit trail.');
        break;
      case 'compare-quotations': quoteComparisonV2(); break;
      case 'save-vendor-v2': {
        const name=document.querySelector('#v2VendorName')?.value?.trim()||'New Vendor';
        const category=document.querySelector('#v2VendorCategory')?.value||'Human capital services';
        const contact=document.querySelector('#v2VendorContact')?.value||'Primary contact';
        const email=document.querySelector('#v2VendorEmail')?.value||'bids@vendor.co.zw';
        const country=document.querySelector('#v2VendorCountry')?.value||'Zimbabwe';
        vendorsV2.unshift({id:`VEN-${String(vendorsV2.length+1).padStart(3,'0')}`,name,initials:name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase(),category,country,contact,email,status:'Due diligence',compliance:25,rating:'—',spend:'USD 0',renewal:'Pending',documents:0});
        logEvent('VENDOR_RECORD_CREATED',vendorsV2[0].id,`${name} added to vendor due diligence`,'Change');closeModal();render();toast('Vendor record created',`${name} is ready for compliance onboarding.`);break;
      }
      case 'save-rfq-v2': closeModal();previewBidFormV2();toast('RFQ draft created','The vendor response form was generated from RFQ-HR-2026-014.');break;
      case 'download-vendor-register': exportCSV('Matanho_HR_Payroll_Vendor_Register.csv',['Vendor ID','Vendor','Category','Country','Contact','Email','Compliance','Rating','Spend','Status'],vendorsV2.map(v=>[v.id,v.name,v.category,v.country,v.contact,v.email,v.compliance,v.rating,v.spend,v.status]));break;
      case 'export-quote-comparison': exportCSV('RFQ_HR_2026_014_Quotation_Comparison.csv',['Vendor','Price','Technical','Commercial','Compliance','Weighted total','Preferred'],quoteRowsV2.map(q=>[q.vendor,q.price,q.technical,q.commercial,q.compliance,q.total,q.recommended?'Yes':'No']));break;
      case 'edit-schedule-v2': openScheduleModal(action.dataset.period||'July 2026');break;
      case 'save-schedule-v2': logEvent('PAYROLL_CALENDAR_DRAFT_SAVED','CAL-2026-07','July schedule updated and routed for approval','Change');closeModal();toast('Schedule draft saved','The updated dates require independent approval before publication.');break;
      case 'copy-calendar-v2': toast('Calendar copied','The prior-year pattern was copied as a draft and conflicts were revalidated.');break;
      case 'email-vendor': inviteModalV2();break;
      case 'vendor-documents': state.folder='All documents';goPage('vault');break;
      case 'employee-audit': goPage('audit');break;
    }
  },true);

  document.addEventListener('change',event=>{
    const size=event.target.closest('[data-component-page-size]');if(size){state.componentPageSize=Number(size.value)||10;state.componentPage=1;render();}
  },true);
  document.addEventListener('input',event=>{
    const search=event.target.closest('[data-component-search]');if(!search)return;const position=search.selectionStart;state.componentSearch=search.value;state.componentPage=1;render();const next=document.querySelector('[data-component-search]');if(next){next.focus();next.setSelectionRange(position,position);}
  },true);


  /* v3: responsive buttons and dynamic charts */
  state.chartRange = state.chartRange || '12M';
  state.chartSeries = state.chartSeries || 'both';
  state.departmentChartMode = state.departmentChartMode || 'both';
  state.departmentChartSort = state.departmentChartSort || 'organisation';

  const escapeTextV3 = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  button = function(label,action,cls='',ico=''){
    return `<button type="button" class="btn ${cls}" data-action="${escapeTextV3(action)}" aria-label="${escapeTextV3(label)}">${ico?icon(ico):''}<span class="btn-label">${label}</span></button>`;
  };

  const payrollTrendDataV3_fixture = [
    ['Jul 2024',166,4.10],['Aug 2024',171,4.24],['Sep 2024',175,4.35],['Oct 2024',179,4.47],['Nov 2024',182,4.61],['Dec 2024',186,4.78],
    ['Jan 2025',181,4.84],['Feb 2025',184,4.92],['Mar 2025',188,5.02],['Apr 2025',191,5.08],['May 2025',193,5.14],['Jun 2025',196,5.20],
    ['Jul 2025',188,5.10],['Aug 2025',194,5.28],['Sep 2025',201,5.46],['Oct 2025',199,5.58],['Nov 2025',214,6.02],['Dec 2025',228,6.28],
    ['Jan 2026',225,6.36],['Feb 2026',238,6.62],['Mar 2026',246,6.82],['Apr 2026',252,7.01],['May 2026',257,7.21],['Jun 2026',265,7.46]
  ];
  const departmentTrendDataV3_fixture = [
    {name:'Finance',headcount:54,cost:82,gross:72.4,variance:3.8},{name:'Operations',headcount:92,cost:100,gross:96.1,variance:5.4},{name:'Commercial',headcount:41,cost:74,gross:61.8,variance:4.1},
    {name:'Technology',headcount:37,cost:68,gross:58.6,variance:6.2},{name:'People',headcount:26,cost:61,gross:44.9,variance:2.9},{name:'Procurement',headcount:14,cost:48,gross:31.2,variance:1.7}
  ];

  const chartButtonV3 = (label,attrs,active=false,ico='') => `<button type="button" class="chart-control ${active?'active':''}" ${attrs}>${ico?icon(ico):''}${label}</button>`;
  const payrollRangeRowsV3 = () => {
    const n=state.chartRange==='6M'?6:state.chartRange==='24M'?24:12;
    const rows=overviewTrendRowsV4();
    return rows.slice(-n);
  };
  const monthKeyV4 = run => {
    const raw=String(run?.startDate||run?.period||run?.reference||'');
    const iso=raw.match(/(\d{4})[-/](\d{1,2})/);
    if(iso)return `${iso[1]}-${String(Number(iso[2])).padStart(2,'0')}`;
    const parsed=new Date(raw);
    return Number.isNaN(parsed.getTime())?'':`${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth()+1).padStart(2,'0')}`;
  };
  const currencyPartsV4 = run => {
    const parts=run?.currencyComponents||{};
    return {
      USD:parts.USD||((Number(run?.grossUSD)||0)>0?{gross:Number(run.grossUSD)||0,net:Number(run.netUSD)||0,deductions:Number(run.deductions)||0}:null),
      ZIG:parts.ZIG||((Number(run?.grossZiG)||0)>0?{gross:Number(run.grossZiG)||0,net:null,deductions:null}:null),
    };
  };
  const overviewRunsV4 = () => {
    if(!__pr6IsLive())return [];
    const from=state.overviewFrom||'',to=state.overviewTo||'';
    return (Array.isArray(payrollRuns)?payrollRuns:[]).filter(run=>{
      const month=monthKeyV4(run);
      if(!month)return false;
      return (!from||month>=from)&&(!to||month<=to);
    }).sort((a,b)=>monthKeyV4(b).localeCompare(monthKeyV4(a))||String(b.startDate||'').localeCompare(String(a.startDate||'')));
  };
  const overviewTrendRowsV4 = () => {
    const grouped=new Map();
    for(const run of overviewRunsV4()){
      const month=monthKeyV4(run), parts=currencyPartsV4(run);
      const row=grouped.get(month)||{USD:0,ZIG:0};
      row.USD+=Number(parts.USD?.gross)||0;
      row.ZIG+=Number(parts.ZIG?.gross)||0;
      grouped.set(month,row);
    }
    return [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,amounts])=>{
      const [year,month]=key.split('-').map(Number);
      return [`${new Date(Date.UTC(year,month-1,1)).toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'})}`,amounts.USD/1000,amounts.ZIG/1000000,key];
    });
  };
  const overviewPeriodV4 = () => {
    const rows=overviewRunsV4();
    const latestMonth=rows.length?monthKeyV4(rows[0]):'';
    return {rows,latestMonth,latest:latestMonth?rows.filter(r=>monthKeyV4(r)===latestMonth):[]};
  };
  const overviewExportRowsV4 = () => payrollRangeRowsV3().map(r=>[r[3],r[0],Number(r[1])*1000,Number(r[2])*1000000]);
  const overviewExportSpecV4 = () => {
    const period=overviewPeriodV4(), currency=state.overviewCurrency||'BOTH';
    const rows=overviewExportRowsV4();
    const columns=['Period','Month','USD gross payroll','ZiG gross payroll'];
    const selected=currency==='USD'?rows.map(r=>[r[0],r[1],r[2]]):currency==='ZIG'?rows.map(r=>[r[0],r[1],r[3]]):rows;
    const runColumns=['Run','Pay group','Period','Employees',...(currency==='ZIG'?[]:['USD gross','USD deductions','USD net']),...(currency==='USD'?[]:['ZiG gross','ZiG deductions','ZiG net']),'Status'];
    const runRows=period.rows.map(run=>{const parts=currencyPartsV4(run);return [runReferenceV4(run),run.group,run.period,run.employees??'—',...(currency==='ZIG'?[]:[parts.USD?.gross??'—',parts.USD?.deductions??'—',parts.USD?.net??'—']),...(currency==='USD'?[]:[parts.ZIG?.gross??'—',parts.ZIG?.deductions??'—',parts.ZIG?.net??'—']),run.status]});
    const latestTotals=period.latest.reduce((out,run)=>{const parts=currencyPartsV4(run);for(const code of ['USD','ZIG'])if(parts[code])for(const field of ['gross','deductions','net'])if(parts[code][field]!=null)out[code][field]+=Number(parts[code][field])||0;out.usdEquivalentDeductions+=Number(run.deductions)||0;out.usdEquivalentNet+=Number(run.netUSD)||0;return out;},{USD:{gross:0,deductions:0,net:0},ZIG:{gross:0,deductions:0,net:0},usdEquivalentDeductions:0,usdEquivalentNet:0});
    return {
      title:'Payroll Operations Command Centre',
      subtitle:'Payroll movement trend from live payroll run records.',
      columns:currency==='USD'?['Period','Month','USD gross payroll']:currency==='ZIG'?['Period','Month','ZiG gross payroll']:columns,
      rows:selected,
      filename:'payroll-command-centre',
      landscape:true,
      meta:[['Currency filter',currency],['Date range',`${state.overviewFrom||'All available'} to ${state.overviewTo||'Latest'}`],['Runs in selected period',String(period.rows.length)],['Latest month',period.latestMonth||'No run'],...(currency==='BOTH'?[['Gross USD',money(latestTotals.USD.gross)],['Gross ZiG',money(latestTotals.ZIG.gross,'ZiG')],['Deductions (USD equivalent)',money(latestTotals.usdEquivalentDeductions)],['Net pay (USD equivalent)',money(latestTotals.usdEquivalentNet)]]:currency==='USD'?[['Gross USD',money(latestTotals.USD.gross)],['Deductions',money(latestTotals.USD.deductions)],['Net pay',money(latestTotals.USD.net)]]:[['Gross ZiG',money(latestTotals.ZIG.gross,'ZiG')],['Deductions',money(latestTotals.ZIG.deductions,'ZiG')],['Net pay',money(latestTotals.ZIG.net,'ZiG')]])],
      extra:[{title:'Filtered payroll run detail',columns:runColumns,rows:runRows}],
      note:'Export reflects the currency and date filters selected on the Payroll Command Centre. Amounts are sourced from payroll run currency components.',
    };
  };
  const exportOverviewV4 = kind => {
    const exportFn=window.__PAYROLL_V6_EXPORT_OVERVIEW__;
    if(typeof exportFn!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return;}
    void exportFn(kind,overviewExportSpecV4());
  };
  const overviewAnalysisV4 = title => {
    const period=overviewPeriodV4(), rows=payrollRangeRowsV3(), currency=state.overviewCurrency||'BOTH';
    const body=rows.length?`<div class="table-wrap"><table><thead><tr><th>Period</th>${currency!=='ZIG'?'<th>USD gross payroll</th>':''}${currency!=='USD'?'<th>ZiG gross payroll</th>':''}<th>Runs</th></tr></thead><tbody>${rows.slice().reverse().map(r=>{const monthRuns=period.rows.filter(run=>monthKeyV4(run)===r[3]);return `<tr><td>${r[0]}</td>${currency!=='ZIG'?`<td>${money(r[1]*1000)}</td>`:''}${currency!=='USD'?`<td>${money(r[2]*1000000,'ZiG')}</td>`:''}<td>${monthRuns.length}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty-state">No payroll run data matches these filters.</div>';
    openDrawer(title,`Live analysis · ${currency} · ${state.overviewFrom||'all dates'} to ${state.overviewTo||'latest'}`,`<div class="callout blue"><strong>${period.rows.length} payroll runs in range</strong><p>The analysis below is grouped from the filtered payroll run records returned by the API.</p></div><section class="drawer-section">${body}</section>`,`${button('Export filtered data','chart-export-payroll','','download')}`);
  };

  const overviewExportButtonsV4 = () => `<div class="employee-export-group" role="group" aria-label="Export filtered payroll movement"><button class="btn small employee-export-icon" type="button" data-action="export-overview-pdf" title="Export PDF" aria-label="Export filtered payroll as PDF">${icon('file')}</button><button class="btn small employee-export-icon" type="button" data-action="export-overview-excel" title="Export Excel" aria-label="Export filtered payroll as Excel">${icon('report')}</button><button class="btn small employee-export-icon" type="button" data-action="export-overview-csv" title="Export CSV" aria-label="Export filtered payroll as CSV">${icon('download')}</button></div>`;
  const overviewFiltersV4 = () => `<div class="overview-filter" role="group" aria-label="Payroll dashboard filters"><label>Currency<select data-overview-currency aria-label="Filter payroll by currency"><option value="BOTH" ${(state.overviewCurrency||'BOTH')==='BOTH'?'selected':''}>Both</option><option value="USD" ${state.overviewCurrency==='USD'?'selected':''}>USD</option><option value="ZIG" ${state.overviewCurrency==='ZIG'?'selected':''}>ZiG</option></select></label><label>From<input type="month" data-overview-from aria-label="Payroll start month" value="${state.overviewFrom||''}"></label><label>To<input type="month" data-overview-to aria-label="Payroll end month" value="${state.overviewTo||''}"></label></div>`;
  overviewPage = function(){
    const loading=!__pr6IsLive(), period=overviewPeriodV4(), currency=state.overviewCurrency||'BOTH';
    if(loading)return `<div class="page">${pageHead('Payroll operating system','Payroll Operations Command Centre','Loading live payroll data…',overviewFiltersV4()+overviewExportButtonsV4())}<div class="grid kpis">${Array.from({length:6},()=>'<div class="kpi"><div class="skeleton" style="width:46%;margin:6px 0 16px"></div><div class="skeleton" style="width:68%;height:26px"></div><div class="skeleton" style="width:75%;margin-top:14px"></div></div>').join('')}</div><div class="grid two"><section class="card"><div class="skeleton" style="height:310px"></div></section><section class="card"><div class="skeleton" style="height:310px"></div></section></div></div>`;
    const staff=(Array.isArray(employees)?employees:[]).filter(e=>currency==='BOTH'||String(e.currency||'').toUpperCase().includes(currency==='ZIG'?'ZIG':'USD'));
    const latestRuns=period.latest, totals=latestRuns.reduce((acc,run)=>{const parts=currencyPartsV4(run);for(const code of ['USD','ZIG'])if(parts[code])for(const field of ['gross','net','deductions'])if(parts[code][field]!=null)acc[code][field]+=Number(parts[code][field])||0;acc.usdEquivalentDeductions+=Number(run.deductions)||0;acc.usdEquivalentNet+=Number(run.netUSD)||0;return acc;},{USD:{gross:0,net:0,deductions:0},ZIG:{gross:0,net:0,deductions:0},usdEquivalentDeductions:0,usdEquivalentNet:0});
    const selectedCode=currency==='BOTH'?'USD':currency, currencyAmounts=totals[selectedCode];
    const latest=latestRuns[0]||null, paid=latestRuns.reduce((n,r)=>n+(Number(r.employees)||0),0), readiness=staff.length?Math.round(staff.reduce((n,e)=>n+(Number(e.readiness)||0),0)/staff.length):0;
    const selectedIds=new Set(staff.map(e=>e.id||e.recordId));
    const openExceptions=(Array.isArray(exceptions)?exceptions:[]).filter(e=>selectedIds.has(e.employeeId||e.recordId)&&e.status!=='Resolved');
    const critical=openExceptions.filter(e=>e.severity==='Critical').length;
    const stage=Number(latest?.stage)||0, paidPct=staff.length?Math.min(100,Math.round((paid/staff.length)*100)):0;
    const currencyCards=currency==='BOTH'?`${kpi('Gross payroll · USD',money(totals.USD.gross),latest?latest.period:'No runs in range','wallet','cyan')}${kpi('Gross payroll · ZiG',money(totals.ZIG.gross,'ZiG'),latest?latest.period:'No runs in range','wallet','violet')}`:`${kpi('Gross payroll · '+(currency==='USD'?'USD':'ZiG'),money(currencyAmounts.gross,currency==='USD'?'USD':'ZiG'),latest?latest.period:'No runs in range','wallet',currency==='USD'?'cyan':'violet')}`;
    const deductionsValue=currency==='BOTH'?`${money(totals.USD.deductions)} · ${money(totals.ZIG.deductions,'ZiG')}`:money(currencyAmounts.deductions,currency==='USD'?'USD':'ZiG');
    const netValue=currency==='BOTH'?`${money(totals.USD.net)} · ${money(totals.ZIG.net,'ZiG')}`:money(currencyAmounts.net,currency==='USD'?'USD':'ZiG');
    const dedSub=currency==='BOTH'?'USD + ZiG native amounts · selected period':latest?latest.period:'No runs in range';
    const staffLabel=currency==='BOTH'?'Employees':'Employees with '+(currency==='USD'?'USD':'ZiG')+' salary';
    const recentRows=period.rows.slice(0,5).map(r=>`<tr data-run="${__pr6Esc(r.id)}"><td><span class="link">${__pr6Esc(runReferenceV4(r))}</span></td><td><strong>${__pr6Esc(r.group||'—')}</strong><div class="tiny muted">${__pr6Esc(r.period||'—')}</div></td><td>${r.employees??'—'}</td><td class="money">${money(r.grossUSD)}</td><td class="money">${money(runDeductionForCurrencyV4(r,'USD'))}</td><td class="money">${money(r.grossZiG,'ZiG')}</td><td class="money">${money(runDeductionForCurrencyV4(r,'ZIG'),'ZiG')}</td><td>${badge(r.status)}</td><td>${__pr6Esc(r.owner||'—')}</td></tr>`);
    const trend=period.rows.length?lineChart():'<div class="card-body empty-state">No payroll trend data matches the selected currency and date range.</div>';
    return `<div class="page">${pageHead('Payroll operating system','Payroll Operations Command Centre','Monitor live payroll movement, readiness and run status.',overviewFiltersV4()+overviewExportButtonsV4())}
      <div class="grid kpis">${kpi(staffLabel,String(staff.length),`${staff.filter(e=>Number(e.readiness)<100).length} not fully payroll-ready`,'users','','')}${currencyCards}${kpi('Deductions',deductionsValue,dedSub,'calculator','','')}${kpi('Net pay',netValue,currency==='BOTH'?'Combined USD equivalent · selected period':dedSub,'bank','cyan')}${kpi('Readiness score',`${readiness} / 100`,`${critical} critical exception${critical===1?'':'s'} in selected population`,'shield',critical?'amber':'','')}</div>
      <div class="grid two" style="margin-bottom:14px"><div class="stack">${card('Payroll movement trend','Gross payroll from live run currency components',`<div class="card-body">${trend}</div>`,`<button class="btn small" data-action="drill-payroll">Drill down ${icon('arrow')}</button>`)}${tableCard('Payroll runs in selected period','Live runs matching the selected filters',['Run','Pay group','Employees','Gross USD','Deductions USD','Gross ZiG','Deductions ZiG','Status','Owner'],recentRows,`<button class="btn small" data-page="runs">View all</button>`)}</div>
      ${card('Payroll readiness','Calculated from employee records and runs matching this filter',`<div class="card-body"><div style="display:grid;grid-template-columns:145px 1fr;gap:17px;align-items:center"><div class="donut"><div class="donut-center"><strong>${readiness}</strong><span>of 100</span></div></div><div>${progressRow('Employee data',readiness,`${staff.length} employees in currency scope`)}${progressRow('Employees paid',paidPct,`${paid} run employee records in range`,'cyan')}${progressRow('Critical exceptions',staff.length?Math.round(critical/staff.length*100):0,`${critical} unresolved in currency scope`,'red')}${progressRow('Payroll run progress',Math.round(stage/6*100),latest?`Stage ${stage} of 6 · ${latest.status}`:'No runs in range','amber')}</div></div>${latest?`<div class="callout ${critical?'amber':'blue'}" style="margin-top:13px"><span class="kpi-icon ${critical?'amber':''}">${icon(critical?'alert':'check')}</span><div><strong>${critical?'Release controls need review':'Latest selected run: '+latest.status}</strong><p>${latest.period} · ${latest.group} · ${currency==='BOTH'?'All payroll currencies':currency}</p></div></div>`:'<p class="muted" style="margin-top:12px">No run data is available for this filter.</p>'}</div>`)}</div>
    </div>`;
  };
  const trendSummaryV3 = (rows,index=1) => {
    if(!rows||!rows.length)return{last:['\u2014',0,0],change:0,avg:0};
    const first=rows[0],last=rows[rows.length-1],avg=rows.reduce((a,r)=>a+(Number(r[index])||0),0)/rows.length;
    const change=first[index]?((last[index]-first[index])/first[index])*100:0;
    return {last,change,avg};
  };

  lineChart = function(){
    const rows=payrollRangeRowsV3();
    if(!rows||!rows.length){return `<section class="chart-module" id="payrollTrendChart"><div class="card-body" style="text-align:center;padding:40px 20px"><p class="muted">No payroll trend data available.</p><p class="tiny muted">Either no payroll has been processed yet, or your role cannot view the payroll dashboard.</p></div></section>`;}
    const selectedSeries=state.overviewCurrency==='USD'?'usd':state.overviewCurrency==='ZIG'?'zig':'both';
    const labels=rows.map(r=>r[0]);
    const usd=rows.map(r=>r[1]);
    const zig=rows.map(r=>r[2]);
    const W=940,H=300,left=64,right=72,top=32,bottom=56,plotW=W-left-right,plotH=H-top-bottom;
    const minUsd=Math.floor((Math.min(...usd)-12)/10)*10,maxUsd=Math.ceil((Math.max(...usd)+8)/10)*10;
    const minZig=Math.floor((Math.min(...zig)-.3)*2)/2,maxZig=Math.ceil((Math.max(...zig)+.2)*2)/2;
    const x=i=>left+(rows.length===1?plotW/2:i*plotW/(rows.length-1));
    const yUsd=v=>top+(maxUsd-v)/(maxUsd-minUsd)*plotH;
    const yZig=v=>top+(maxZig-v)/(maxZig-minZig)*plotH;
    const usdPath=usd.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${yUsd(v).toFixed(2)}`).join(' ');
    const zigPath=zig.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${yZig(v).toFixed(2)}`).join(' ');
    const usdTicks=Array.from({length:5},(_,i)=>Math.round(minUsd+(maxUsd-minUsd)*i/4));
    const zigTicks=Array.from({length:5},(_,i)=>(minZig+(maxZig-minZig)*i/4));
    const summary=trendSummaryV3(rows,selectedSeries==='zig'?2:1);
    const optional=i=> rows.length>12 ? (i%3!==0 && i!==rows.length-1) : (i%2!==0 && i!==rows.length-1);
    return `<section class="chart-module" id="payrollTrendChart" data-chart="payroll-trend" data-series="${selectedSeries}">
      <div class="chart-toolbar"><div class="chart-toolbar-left">
        <div class="chart-segment" aria-label="Payroll trend period">${['6M','12M','24M'].map(v=>chartButtonV3(v,`data-chart-range="${v}"`,state.chartRange===v)).join('')}</div>
        <span class="tiny muted">${selectedSeries==='both'?'Both currencies':selectedSeries==='usd'?'USD only':'ZiG only'} · filtered by the dashboard controls</span>
      </div><div class="chart-toolbar-right">${button('Export data','chart-export-payroll','small','download')}${button('Full analysis','chart-payroll-detail','small soft','arrow')}</div></div>
      <div class="chart-stage"><div class="chart-stage-scroll"><div class="chart-shell"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Monthly USD and ZiG gross payroll trend">
        ${selectedSeries!=='zig'?usdTicks.map(v=>`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${yUsd(v)}" y2="${yUsd(v)}"/><text class="chart-label" x="${left-10}" y="${yUsd(v)+4}" text-anchor="end">${v}k</text>`).join(''):''}
        ${selectedSeries!=='usd'?zigTicks.map(v=>`<text class="chart-label" x="${W-right+10}" y="${yZig(v)+4}" text-anchor="start">${v.toFixed(1)}m</text>`).join(''):''}
        <line class="chart-axis" x1="${left}" x2="${left}" y1="${top}" y2="${H-bottom}"/>${selectedSeries==='both'?`<line class="chart-axis" x1="${W-right}" x2="${W-right}" y1="${top}" y2="${H-bottom}"/>`:''}<line class="chart-axis" x1="${left}" x2="${W-right}" y1="${H-bottom}" y2="${H-bottom}"/>
        ${selectedSeries!=='zig'?`<path class="chart-line series-usd" d="${usdPath}"/>`:''}${selectedSeries!=='usd'?`<path class="chart-line-2 series-zig" d="${zigPath}"/>`:''}
        ${selectedSeries!=='zig'?rows.map((r,i)=>`<circle class="chart-hit series-usd" data-chart-point="trend" data-period="${r[0]}" data-month="${r[3]}" data-usd="${r[1]}" data-zig="${r[2]}" data-series-name="USD" cx="${x(i)}" cy="${yUsd(r[1])}" r="12" tabindex="0" role="button" aria-label="${r[0]} USD ${r[1]} thousand"/><circle class="chart-point series-usd" cx="${x(i)}" cy="${yUsd(r[1])}" r="3.7"/>`).join(''):''}
        ${selectedSeries!=='usd'?rows.map((r,i)=>`<circle class="chart-hit series-zig" data-chart-point="trend" data-period="${r[0]}" data-month="${r[3]}" data-usd="${r[1]}" data-zig="${r[2]}" data-series-name="ZiG" cx="${x(i)}" cy="${yZig(r[2])}" r="12" tabindex="0" role="button" aria-label="${r[0]} ZiG ${r[2]} million"/><circle class="chart-point second series-zig" cx="${x(i)}" cy="${yZig(r[2])}" r="3.5"/>`).join(''):''}
        ${labels.map((m,i)=>`<text class="chart-label x-label ${optional(i)?'optional-label':''}" x="${x(i)}" y="${H-20}" text-anchor="middle">${m.replace(' 20',' ’')}</text>`).join('')}
        ${selectedSeries!=='zig'?`<text class="chart-title" x="${left}" y="16">USD gross payroll (thousands)</text>`:''}${selectedSeries!=='usd'?`<text class="chart-title" x="${W-right}" y="16" text-anchor="end">ZiG gross payroll (millions)</text>`:''}
      </svg></div></div><div class="chart-tooltip" role="status" aria-live="polite"></div></div>
      <div class="chart-live-summary"><div class="fact"><span>Latest gross payroll</span><strong>${selectedSeries!=='zig'?`USD ${summary.last[1]}k`:''}${selectedSeries==='both'?' · ':''}${selectedSeries!=='usd'?`ZiG ${summary.last[2].toFixed(2)}m`:''}</strong></div><div class="fact"><span>${state.chartRange} movement</span><strong>${summary.change>=0?'+':''}${summary.change.toFixed(1)}%</strong></div><div class="fact"><span>Average monthly ${selectedSeries==='zig'?'ZiG':'USD'}</span><strong>${selectedSeries==='zig'?`ZiG ${summary.avg.toFixed(2)}m`:`USD ${summary.avg.toFixed(1)}k`}</strong></div></div>
      <div class="chart-caption"><div class="legend">${selectedSeries!=='zig'?'<span><i style="background:#1559c1"></i>USD gross payroll</span>':''}${selectedSeries!=='usd'?'<span><i style="background:#5a4ea1"></i>ZiG gross payroll</span>':''}</div><span class="chart-caption-note">Hover for exact values. Select a point to inspect the matching payroll runs.</span></div>
    </section>`;
  };

  barChart = function(){
    let data=[...(__pr6DepartmentsV3()||departmentTrendDataV3_fixture)];
    if(state.departmentChartSort==='highest') data.sort((a,b)=>Math.max(b.headcount,b.cost)-Math.max(a.headcount,a.cost));
    const W=820,H=300,left=58,right=20,top=32,bottom=66,plotH=H-top-bottom,max=100,groupW=(W-left-right)/data.length,barW=Math.min(34,groupW*.28);
    const y=v=>top+(max-v)/max*plotH;
    return `<section class="chart-module" id="departmentProfileChart" data-chart="department-profile" data-dept-mode="${state.departmentChartMode}">
      <div class="chart-toolbar"><div class="chart-toolbar-left">
        <div class="chart-segment" aria-label="Department chart measure">${[['both','Both'],['headcount','Headcount'],['cost','Cost index']].map(([v,l])=>chartButtonV3(l,`data-dept-mode="${v}"`,state.departmentChartMode===v)).join('')}</div>
        <div class="chart-segment" aria-label="Department chart sorting">${[['organisation','Org order'],['highest','Highest first']].map(([v,l])=>chartButtonV3(l,`data-dept-sort="${v}"`,state.departmentChartSort===v)).join('')}</div>
      </div><div class="chart-toolbar-right">${button('Export data','chart-export-departments','small','download')}${button('Department detail','chart-department-detail','small soft','arrow')}</div></div>
      <div class="chart-stage"><div class="chart-stage-scroll"><div class="chart-shell"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Headcount and payroll cost index by department">
        ${[0,20,40,60,80,100].map(v=>`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-label" x="${left-9}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}
        <line class="chart-axis" x1="${left}" x2="${left}" y1="${top}" y2="${H-bottom}"/><line class="chart-axis" x1="${left}" x2="${W-right}" y1="${H-bottom}" y2="${H-bottom}"/>
        ${data.map((d,i)=>{const base=left+i*groupW+groupW/2,h1=plotH*d.headcount/max,h2=plotH*d.cost/max;return `<g class="chart-bar-group" data-chart-point="department" data-department="${d.name}" data-headcount="${d.headcount}" data-cost="${d.cost}" data-gross="${d.gross}" data-variance="${d.variance}" tabindex="0" role="button" aria-label="${d.name}: headcount index ${d.headcount}, payroll cost index ${d.cost}"><rect class="bar series-headcount" x="${base-barW-3}" y="${H-bottom-h1}" width="${barW}" height="${h1}" rx="3"/><rect class="bar-2 series-cost" x="${base+3}" y="${H-bottom-h2}" width="${barW}" height="${h2}" rx="3"/><rect class="chart-hit" x="${base-groupW*.44}" y="${top}" width="${groupW*.88}" height="${plotH}"/><text class="chart-label x-label" x="${base}" y="${H-25}" text-anchor="middle">${d.name}</text></g>`}).join('')}
        <text class="chart-title" x="${left}" y="16">Department profile (index, Operations = 100)</text>
      </svg></div></div><div class="chart-tooltip" role="status" aria-live="polite"></div></div>
      <div class="chart-live-summary"><div class="fact"><span>Largest workforce</span><strong>Operations · 92 index</strong></div><div class="fact"><span>Highest cost concentration</span><strong>Operations · 100 index</strong></div><div class="fact"><span>Highest monthly variance</span><strong>Technology · 6.2%</strong></div></div>
      <div class="chart-caption"><div class="legend"><span><i style="background:#2863bc"></i>Headcount index</span><span><i style="background:#8ca5cd"></i>Payroll cost index</span></div><span class="chart-caption-note">Select a department to inspect pay mix, movement and exceptions.</span></div>
    </section>`;
  };

  const initialiseResponsiveChartsV3 = () => {
    document.querySelectorAll('.chart-module').forEach(module => {
      if(module.dataset.resizeReady==='true') return;
      module.dataset.resizeReady='true';
      const update=()=>module.classList.toggle('is-compact',module.getBoundingClientRect().width<690);
      update();
      if('ResizeObserver' in window){const observer=new ResizeObserver(update);observer.observe(module);module._chartResizeObserver=observer;}
    });
  };
  const replaceChartV3 = id => {
    const current=document.querySelector(id); if(!current) return;
    current.outerHTML=id==='#payrollTrendChart'?lineChart():barChart();
    requestAnimationFrame(initialiseResponsiveChartsV3);
  };
  const chartTooltipV3 = (target,event) => {
    const module=target.closest('.chart-module'),stage=target.closest('.chart-stage'),tip=stage?.querySelector('.chart-tooltip');
    if(!module||!stage||!tip) return;
    const rect=stage.getBoundingClientRect();
    const cx=event?.clientX ?? (target.getBoundingClientRect().left+target.getBoundingClientRect().width/2);
    const cy=event?.clientY ?? target.getBoundingClientRect().top;
    let html='';
    if(target.dataset.chartPoint==='trend') html=`<strong>${escapeTextV3(target.dataset.period)}</strong><span>USD gross payroll <b>USD ${escapeTextV3(target.dataset.usd)}k</b></span><span>ZiG gross payroll <b>ZiG ${Number(target.dataset.zig).toFixed(2)}m</b></span><span>Selected series <b>${escapeTextV3(target.dataset.seriesName)}</b></span>`;
    else {const holder=target.closest('[data-chart-point="department"]')||target;html=`<strong>${escapeTextV3(holder.dataset.department)}</strong><span>Headcount index <b>${escapeTextV3(holder.dataset.headcount)}</b></span><span>Payroll cost index <b>${escapeTextV3(holder.dataset.cost)}</b></span><span>Gross payroll <b>USD ${escapeTextV3(holder.dataset.gross)}k</b></span><span>Period variance <b>${escapeTextV3(holder.dataset.variance)}%</b></span>`;target=holder;}
    tip.innerHTML=html;tip.classList.add('open');
    const x=Math.min(Math.max(cx-rect.left,95),rect.width-95),y=Math.max(cy-rect.top,80);
    tip.style.left=`${x}px`;tip.style.top=`${y}px`;
  };
  const hideChartTooltipV3 = target => target.closest('.chart-stage')?.querySelector('.chart-tooltip')?.classList.remove('open');

  const openPayrollPeriodDetailV3 = target => {
    const period=target.dataset.period,month=target.dataset.month;
    const runs=overviewRunsV4().filter(run=>monthKeyV4(run)===month);
    const amounts=runs.reduce((out,run)=>{const parts=currencyPartsV4(run);out.usd+=Number(parts.USD?.gross)||0;out.zig+=Number(parts.ZIG?.gross)||0;out.employees+=Number(run.employees)||0;return out;},{usd:0,zig:0,employees:0});
    const rows=runs.map(run=>`<tr><td>${escapeTextV3(run.id)}</td><td>${escapeTextV3(run.group||'—')}</td><td>${run.employees??'—'}</td><td>${money(currencyPartsV4(run).USD?.gross||0)}</td><td>${money(currencyPartsV4(run).ZIG?.gross||0,'ZiG')}</td><td>${badge(run.status)}</td></tr>`).join('');
    openDrawer(`${period} payroll movement`,'Period detail · live payroll run records',`<div class="grid three"><div class="fact"><span>USD gross payroll</span><strong>${money(amounts.usd)}</strong></div><div class="fact"><span>ZiG gross payroll</span><strong>${money(amounts.zig,'ZiG')}</strong></div><div class="fact"><span>Run employee records</span><strong>${amounts.employees}</strong></div></div><section class="drawer-section"><h3>Payroll runs in this month</h3>${runs.length?`<div class="table-wrap"><table><thead><tr><th>Run</th><th>Pay group</th><th>Employees</th><th>USD gross</th><th>ZiG gross</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="muted">No payroll runs were returned for this month.</p>'}</section>`,`${button('Open payroll runs','chart-open-runs','primary','arrow')}`);
  };
  const openDepartmentDetailV3 = target => {
    const holder=target.closest('[data-chart-point="department"]')||target,d=holder.dataset;
    openDrawer(`${d.department} payroll profile`,'Department analytics · pay mix, movement and exception metadata',`<div class="grid four"><div class="fact"><span>Headcount index</span><strong>${d.headcount}</strong></div><div class="fact"><span>Cost index</span><strong>${d.cost}</strong></div><div class="fact"><span>Gross payroll</span><strong>USD ${d.gross}k</strong></div><div class="fact"><span>Period variance</span><strong>${d.variance}%</strong></div></div><section class="card" style="margin-top:12px"><div class="card-head"><div><h3>Compensation composition</h3><p>Current period mix for ${d.department}</p></div></div><div class="card-body">${progressRow('Base salaries',72,'Share of department gross','cyan')}${progressRow('Recurring allowances',16,'Housing, transport and representation','violet')}${progressRow('Variable and overtime',8,'Commission, overtime and incentives','amber')}${progressRow('Other earnings',4,'Benefits and adjustments','')}</div></section><section class="card" style="margin-top:12px"><div class="card-head"><div><h3>Operational signals</h3><p>Items requiring payroll or HR attention</p></div></div><div class="table-wrap"><table><thead><tr><th>Signal</th><th>Count</th><th>Control owner</th><th>Status</th></tr></thead><tbody><tr><td>Pending contract amendments</td><td>2</td><td>HR Operations</td><td>${badge('In review')}</td></tr><tr><td>Payroll exceptions</td><td>1</td><td>Payroll Operations</td><td>${badge('Open')}</td></tr><tr><td>Bank detail changes</td><td>1</td><td>Payroll Checker</td><td>${badge('Pending')}</td></tr></tbody></table></div></section>`,`${button('Open employee directory','chart-open-employees','primary','users')}${button('Export department data','chart-export-departments','','download')}`);
  };

  const parseOnboardingCsvV4 = text => {const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=ch;}row.push(cell.replace(/\r$/,''));if(row.some(v=>v.trim()))rows.push(row);if(!rows.length)return[];const key=s=>s.trim().toLowerCase().replace(/[\s-]+/g,'_');const headers=rows.shift().map(key);return rows.map((cells,index)=>{const v={};headers.forEach((h,i)=>v[h]=(cells[i]||'').trim());const pick=(...names)=>names.map(n=>v[n]).find(x=>x!==undefined)||'';return{line:index+2,firstName:pick('firstname','first_name','given_name'),lastName:pick('lastname','last_name','surname'),email:pick('email','work_email'),employeeNumber:pick('employeenumber','employee_number','employee_no','staff_number'),position:pick('position','job_title','title'),departmentCode:pick('departmentcode','department_code','department'),startDate:pick('startdate','start_date','contract_start'),basicSalary:pick('basicsalary','basic_salary','salary'),currencyId:pick('currencyid','currency_id'),currencyCode:pick('currencycode','currency_code','currency'),salarySplitUsdPct:pick('salarysplitusdpct','salary_split_usd_pct')||'100',salarySplitZigPct:pick('salarysplitzigpct','salary_split_zig_pct')||'0'};});};
  const validateOnboardingRowsV4 = rows => {const emails=new Set(),numbers=new Set();return rows.map(r=>{const issues=[];if(!r.firstName)issues.push('First name required');if(!r.lastName)issues.push('Surname required');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))issues.push('Valid email required');if(!r.employeeNumber)issues.push('Employee number required');if(!/^\d+(\.\d{1,2})?$/.test(r.basicSalary)||Number(r.basicSalary)<0)issues.push('Valid non-negative salary required');if(emails.has(r.email.toLowerCase()))issues.push('Duplicate email in file');if(numbers.has(r.employeeNumber.toLowerCase()))issues.push('Duplicate employee number in file');emails.add(r.email.toLowerCase());numbers.add(r.employeeNumber.toLowerCase());return{...r,issues};});};
  const showOnboardingCsvPreviewV4 = async () => {const file=document.querySelector('#onboardingCsvFile')?.files?.[0];if(!file){toast('Select a CSV file','Choose the employee CSV to validate.','warn');return;}if(file.size>5*1024*1024){toast('CSV is too large','The maximum supported file size is 5 MB.','warn');return;}try{const rows=validateOnboardingRowsV4(parseOnboardingCsvV4(await file.text()));if(!rows.length){toast('No employee rows found','Add employee rows below the CSV header.','warn');return;}if(rows.length>200){toast('Too many employee rows','Import up to 200 employees at a time.','warn');return;}window.__payrollOnboardingImportRows=rows;const ok=rows.filter(r=>!r.issues.length).length,bad=rows.length-ok;$('#modalBody').innerHTML=`<div class="callout ${bad?'amber':'blue'}"><div><strong>${ok} valid · ${bad} need correction</strong><p>Review the validation results. Invalid rows will not be submitted.</p></div></div><div class="table-wrap" style="margin-top:12px;max-height:42vh"><table><thead><tr><th>CSV row</th><th>Employee</th><th>Email</th><th>Employee number</th><th>Validation</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.line}</td><td>${__pr6Esc(r.firstName)} ${__pr6Esc(r.lastName)}</td><td>${__pr6Esc(r.email)}</td><td>${__pr6Esc(r.employeeNumber)}</td><td>${r.issues.length?__pr6Esc(r.issues.join('; ')):'Ready'}</td></tr>`).join('')}</tbody></table></div>`;$('#modalFoot').innerHTML=`${button('Back','import-employees')}${button(ok?`Import ${ok} valid employees`:'No valid rows','commit-onboarding-csv','primary','upload')}`;$('#modalFoot').querySelector('[data-action="commit-onboarding-csv"]')?.toggleAttribute('disabled',!ok);}catch(e){toast('Could not read CSV',e?.message||'Check the file format.','bad');}};
  const unhandledButtonActionsV3 = new Set(['audit-evidence','audit-filter','copy-calendar','edit-access','edit-component','edit-paygroup','edit-schedule','import-components','download-component-template','validate-component-csv','import-employees','open-rule','overview','runs','tax-impact','training-detail','upload-inputs','chart-export-payroll','chart-export-departments','chart-payroll-detail','chart-department-detail','chart-open-runs','chart-open-employees','drill-payroll','export-overview-pdf','export-overview-excel','export-overview-csv','export-onboarding-pdf','export-onboarding-excel','export-onboarding-csv','validate-onboarding-csv','commit-onboarding-csv','download-onboarding-template','go-onboarding','onboarding-step-next','onboarding-step-back','new-bank-template','edit-bank-template']);
  const handleAdditionalActionV3 = (action,el) => {
    switch(action){
      case 'overview':goPage('overview');break;case 'runs':case 'chart-open-runs':goPage('runs');break;case 'chart-open-employees':goPage('employees');break;
      case 'new-bank-template':case 'edit-bank-template':{
        const isEdit=action==='edit-bank-template',id=el?.dataset?.templateId||'';
        const record=isEdit?(__pr6Ref().bankTemplates||[]).find(item=>String(item.id)===String(id)):null;
        if(isEdit&&!record){toast('Template unavailable','Reload the settings register and try again.','warn');break;}
        const available=['Employee Name','Bank Name','Branch Code','Account Number','Payment Amount (Net Pay)','Payment Reference'];
        let selected=[];try{const parsed=typeof record?.columnOrder==='string'?JSON.parse(record.columnOrder):record?.columnOrder;selected=Array.isArray(parsed)?parsed:[]}catch{}
        openModal(isEdit?'Edit bank file template':'Add bank file template','Configure the ordered fields included in payroll bank payment files.',`<div class="form-grid"><div class="form-field"><label for="bankTemplateName">Template name <b class="required-mark">Required</b></label><input id="bankTemplateName" value="${__pr6Esc(record?.name||'')}" maxlength="120" required></div><div class="form-field"><label for="bankTemplateBank">Bank name <b class="required-mark">Required</b></label><input id="bankTemplateBank" value="${__pr6Esc(record?.bankName||'')}" maxlength="120" required></div><div class="form-field"><label for="bankTemplateDelimiter">Field delimiter</label><select id="bankTemplateDelimiter"><option value=","${(record?.delimiter||',')===','?' selected':''}>Comma</option><option value=";"${record?.delimiter===';'?' selected':''}>Semicolon</option><option value="|"${record?.delimiter==='|'?' selected':''}>Pipe</option><option value="TAB"${record?.delimiter==='\t'?' selected':''}>Tab</option></select></div><div class="form-field"><label class="settings-check-label"><input id="bankTemplateHeader" type="checkbox"${record?.hasHeader!==false?' checked':''}> Include a header row</label></div><div class="form-field full"><label for="bankTemplateColumns">Output column order <b class="required-mark">Required</b></label><input id="bankTemplateColumns" value="${__pr6Esc(selected.join(', '))}" placeholder="Employee Name, Payment Amount (Net Pay), Payment Reference" required><small>Enter one or more exact field names, separated by commas. Reorder the names to match the bank’s required file layout. Available fields: ${available.map(__pr6Esc).join(' · ')}.</small></div></div>`,`<button class="btn" type="button" data-action="close-modal">Cancel</button><button class="btn primary" type="button" data-action="save-bank-template" data-template-id="${__pr6Esc(id)}">${icon('check')}${isEdit?'Save changes':'Create template'}</button>`,true);
        break;
      }
      case 'chart-payroll-detail':case 'drill-payroll':overviewAnalysisV4('Payroll movement analysis');break;
      case 'export-overview-pdf':exportOverviewV4('pdf');break;
      case 'export-overview-excel':exportOverviewV4('excel');break;
      case 'export-overview-csv':case 'chart-export-payroll':exportOverviewV4('csv');break;
      case 'export-onboarding-pdf':exportOnboardingV4('pdf');break;case 'export-onboarding-excel':exportOnboardingV4('excel');break;case 'export-onboarding-csv':exportOnboardingV4('csv');break;
      case 'go-onboarding':goPage('onboarding');break;
      case 'onboarding-step-next':if(validateOnboardingStepV4(state.onboardingFormStep))renderOnboardingFormStepV4(state.onboardingFormStep+1);break;
      case 'onboarding-step-back':renderOnboardingFormStepV4(state.onboardingFormStep-1);break;
      case 'chart-department-detail':{const target=document.querySelector('[data-chart-point="department"]');if(target)openDepartmentDetailV3(target);break;}
      case 'chart-export-departments':exportCSV('Matanho_Department_Payroll_Profile.csv',['Department','Headcount index','Payroll cost index','Gross USD (000)','Period variance %'],(__pr6DepartmentsV3()||departmentTrendDataV3_fixture).map(d=>[d.name,d.headcount,d.cost,d.gross,d.variance]));break;
      case 'audit-evidence':openDrawer('Audit evidence record','Hash-verified event evidence',`<div class="callout blue"><span class="kpi-icon">${icon('shield')}</span><div><strong>Evidence chain verified</strong><p>The event, actor identity, timestamp, source record and linked document hashes are internally consistent.</p></div></div><div class="grid three" style="margin-top:12px"><div class="fact"><span>Event hash</span><strong>74f2a90c…e81c</strong></div><div class="fact"><span>Identity method</span><strong>Entra MFA</strong></div><div class="fact"><span>Retention</span><strong>7 years</strong></div></div>`);break;
      case 'audit-filter':openModal('Advanced audit filters','Filter the immutable event ledger without altering source evidence.',`<div class="form-grid"><div class="form-field"><label>Actor or role</label><input placeholder="Name, role or identity"></div><div class="form-field"><label>Action class</label><select><option>All classes</option><option>Change</option><option>Approval</option><option>Access</option></select></div><div class="form-field"><label>From</label><input type="date" value="2026-06-01"></div><div class="form-field"><label>To</label><input type="date" value="2026-06-30"></div><div class="form-field full"><label>Record or evidence reference</label><input placeholder="PAY-2026-06-M or evidence hash"></div></div>`,`${button('Clear','close-modal')}${button('Apply filters','close-modal','primary','filter')}`);break;
      case 'edit-access':if(!can('rbac.manage'))deny('rbac.manage');else genericModal('Review Payroll Access','Update the role, data scope, expiry and approval route for this identity.');break;
      case 'edit-component':genericModal('Edit Earnings or Deduction Component','Changes to formulas, taxation, currency and ledger mapping are versioned and independently approved.');break;
      case 'edit-paygroup':case 'edit-schedule':openScheduleModal('July 2026');break;
      case 'open-rule':{const row=el.closest('tr'),kind=row?.dataset.ruleKind,id=row?.dataset.recordId,ref=__pr6Ref();const list=kind==='rule'?ref.taxRules:kind==='levy'?ref.levies:kind==='bracket'?ref.brackets:kind==='mapping'?ref.statutoryMappings:[];const record=(list||[]).find(x=>x.id===id);if(!record){toast('Rule unavailable','Reload the rule library and try again.','warn');break;}if(kind==='rule')openTaxRuleForm(record);else if(kind==='levy')openLevyForm(record);else if(kind==='mapping')openStatutoryMappingForm(record);else openBracketForm(record);break;}
      case 'training-detail':{const id=el.dataset.courseId||el.closest('tr')?.dataset.courseId;const course=(__pr6Ref().courses||[]).find(x=>x.id===id);if(course)openTrainingCourseForm(course);else toast('Course unavailable','Reload the training register and try again.','warn');break;}
      case 'tax-impact':openDrawer('Statutory impact analysis','Current rule version compared with the proposed version',`<div class="grid three"><div class="fact"><span>Affected employees</span><strong>47</strong></div><div class="fact"><span>Net-pay movement</span><strong>USD -3,420</strong></div><div class="fact"><span>Effective date</span><strong>01 July 2026</strong></div></div><div class="callout amber" style="margin-top:12px"><span class="kpi-icon amber">${icon('alert')}</span><div><strong>Independent approval required</strong><p>The proposed rule changes statutory deductions and must pass regression tests before publication.</p></div></div>`);break;
      case 'import-employees':openModal('Bulk import employees','Upload a CSV to validate and create employee accounts.',`<div class="form-grid onboarding-import-form"><div class="form-field full"><label for="onboardingCsvFile">Employee CSV</label><input id="onboardingCsvFile" type="file" accept=".csv,text/csv"><div class="csv-field-guide"><section><strong>Required columns</strong><div class="csv-header-list">${['firstName','lastName','email','employeeNumber','basicSalary'].map(x=>`<code>${x}</code>`).join('')}</div></section><section><strong>Optional columns</strong><div class="csv-header-list">${['position','departmentCode','startDate','currencyId','currencyCode','salarySplitUsdPct','salarySplitZigPct'].map(x=>`<code>${x}</code>`).join('')}</div></section><p>Use these exact header names in the first row of your CSV file.</p></div></div><div class="form-field full"><button class="btn small" type="button" data-action="download-onboarding-template">Download CSV template</button></div><div class="form-field full"><div class="callout blue csv-security-note"><div><strong>Account security and validation</strong><p>Up to 200 rows are validated before import. Duplicate emails or employee numbers and invalid fields are isolated. Each created account receives a randomly generated temporary password by email and requires a password change at first sign-in.</p></div></div></div></div>`,`${button('Cancel','close-modal')}${button('Validate CSV','validate-onboarding-csv','primary','check')}`,true);break;
      case 'validate-onboarding-csv':void showOnboardingCsvPreviewV4();break;
      case 'commit-onboarding-csv':{const records=(window.__payrollOnboardingImportRows||[]).filter(r=>!r.issues.length),runner=window.__PAYROLL_V6_IMPORT_EMPLOYEES__;if(!records.length||typeof runner!=='function'){toast('Import unavailable','The employee import service is not ready.','warn');break;}const foot=$('#modalFoot');if(foot)foot.innerHTML='<span class="muted">Creating accounts and sending invitations…</span>';void runner(records).then(result=>{const outcomes=result||[],failed=outcomes.filter(x=>!x.ok).length,created=outcomes.length-failed,mailFailures=outcomes.filter(x=>x.ok&&!x.credentialEmailSent).length;window.__payrollOnboardingImportRows=null;closeModal();window.dispatchEvent(new CustomEvent('payroll-v6:reload-request'));const detail=outcomes.filter(x=>!x.ok||!x.credentialEmailSent).map(x=>`<tr><td>${__pr6Esc(x.email||'—')}</td><td>${__pr6Esc(x.employeeNumber||'—')}</td><td>${x.ok?'Account created; credential email needs retry':__pr6Esc(x.message||'Employee could not be created.')}</td></tr>`).join('');openModal('Employee import complete',`${created} employee account(s) created · ${failed} failed · ${mailFailures} credential email(s) need retry`,`${created?`<div class="callout blue"><div><strong>Successful accounts</strong><p>Temporary credentials were sent where email delivery succeeded. Employees must change their password at first sign-in.</p></div></div>`:''}${detail?`<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Email</th><th>Employee number</th><th>Result</th></tr></thead><tbody>${detail}</tbody></table></div>`:''}`,button('Done','close-modal'));}).catch(err=>{toast('Import failed',err?.message||'The import service could not complete the request.','bad');});break;}
      case 'download-onboarding-template':exportCSV('payroll-employee-onboarding-template.csv',['firstName','lastName','email','employeeNumber','basicSalary','position','departmentCode','startDate','currencyId','currencyCode','salarySplitUsdPct','salarySplitZigPct'],[]);break;
      case 'import-components':openComponentImportV5();break;
      case 'download-component-template':exportCSV('payroll-component-configuration-template.csv',['kind','code','name','description','calculationMethod','calculationRate','isTaxable','rate','threshold','ceiling','isStatutory','currencyCode','glAccountCode','effectiveDate','endDate'],[]);break;
      case 'validate-component-csv':void showComponentCsvPreviewV5();break;
      case 'upload-inputs':openModal('Upload Payroll Inputs','Map, validate and safely commit governed data.',`<div class="form-grid"><div class="form-field full"><label>Source file</label><input type="file" accept=".csv,.xlsx,.xls"></div></div>`,`${button('Cancel','close-modal')}${button('Validate file','close-modal','primary','check')}`);break;
      case 'copy-calendar':toast('Calendar copied','The prior-year pattern was copied as a draft and conflicts were revalidated.');break;
    }
  };

  const baseRenderV3=render;
  render=function(){baseRenderV3();requestAnimationFrame(initialiseResponsiveChartsV3);};

  document.addEventListener('pointerdown',event=>{const b=event.target.closest('.btn,.icon-btn,.activity-button');if(b&&!b.disabled)b.classList.add('is-pressed')});
  ['pointerup','pointercancel','pointerleave'].forEach(type=>document.addEventListener(type,event=>event.target.closest?.('.btn,.icon-btn,.activity-button')?.classList.remove('is-pressed'),true));

  document.addEventListener('pointermove',event=>{const target=event.target.closest?.('[data-chart-point]');if(target)chartTooltipV3(target,event)});
  document.addEventListener('pointerover',event=>{const target=event.target.closest?.('[data-chart-point]');if(target)chartTooltipV3(target,event)});
  document.addEventListener('pointerout',event=>{const target=event.target.closest?.('[data-chart-point]');if(target&&!target.contains(event.relatedTarget))hideChartTooltipV3(target)});
  document.addEventListener('focusin',event=>{const target=event.target.closest?.('[data-chart-point]');if(target)chartTooltipV3(target)});
  document.addEventListener('focusout',event=>{const target=event.target.closest?.('[data-chart-point]');if(target)hideChartTooltipV3(target)});
  document.addEventListener('keydown',event=>{const target=event.target.closest?.('[data-chart-point]');if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.click();}}, __pr6Sig);

  document.addEventListener('click',event=>{
    const obPage=event.target.closest('[data-onboarding-page]');if(obPage){event.preventDefault();event.stopImmediatePropagation();state.onboardingPage=Number(obPage.dataset.onboardingPage)||1;render();return;}
    const obCandidate=event.target.closest('[data-action="open-onboarding-candidate"]');if(obCandidate){event.preventDefault();event.stopImmediatePropagation();const candidate=(__pr6Onboarding()?.candidates||[]).find(c=>String(c.id)===obCandidate.dataset.candidateId);if(candidate)openNewEmployee(candidate);return;}
    const range=event.target.closest('[data-chart-range]');if(range){event.preventDefault();event.stopImmediatePropagation();state.chartRange=range.dataset.chartRange;replaceChartV3('#payrollTrendChart');return;}
    const series=event.target.closest('[data-chart-series]');if(series){event.preventDefault();event.stopImmediatePropagation();state.chartSeries=series.dataset.chartSeries;replaceChartV3('#payrollTrendChart');return;}
    const mode=event.target.closest('button[data-dept-mode]');if(mode){event.preventDefault();event.stopImmediatePropagation();state.departmentChartMode=mode.dataset.deptMode;replaceChartV3('#departmentProfileChart');return;}
    const sort=event.target.closest('[data-dept-sort]');if(sort){event.preventDefault();event.stopImmediatePropagation();state.departmentChartSort=sort.dataset.deptSort;replaceChartV3('#departmentProfileChart');return;}
    const point=event.target.closest('[data-chart-point]');if(point){event.preventDefault();event.stopImmediatePropagation();if(point.dataset.chartPoint==='trend')openPayrollPeriodDetailV3(point);else openDepartmentDetailV3(point);return;}
    const action=event.target.closest('[data-action]');if(action&&unhandledButtonActionsV3.has(action.dataset.action)){event.preventDefault();event.stopImmediatePropagation();handleAdditionalActionV3(action.dataset.action,action);return;}
  },true);

  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.matches('[data-overview-currency]'))state.overviewCurrency=target.value;
    else if(target.matches('[data-overview-from]'))state.overviewFrom=target.value;
    else if(target.matches('[data-overview-to]'))state.overviewTo=target.value;
    else return;
    if(state.overviewFrom&&state.overviewTo&&state.overviewFrom>state.overviewTo){
      if(target.matches('[data-overview-from]'))state.overviewTo=state.overviewFrom;
      else state.overviewFrom=state.overviewTo;
      toast('Date range adjusted','The end month must be the same as or later than the start month.','warn');
    }
    if(state.page==='overview')render();
  },true);

  render();
})();





(() => {
  iconPaths.apps = '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>';

  const brandMark = document.querySelector('.brand-mark');
  if (brandMark) {
    brandMark.textContent = 'm';
    brandMark.setAttribute('aria-label','Matanho');
  }

  const liveControl = document.querySelector('.live-pill');
  let launcher = document.querySelector('#appLauncher');
  if (!launcher && liveControl) {
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.id = 'appLauncher';
    launcher.className = 'icon-btn app-launcher';
    launcher.setAttribute('aria-label','Open Matanho apps');
    launcher.setAttribute('title','Matanho apps');
    liveControl.replaceWith(launcher);
  }
  if (launcher) {
    launcher.innerHTML = icon('apps');
    if (launcher.dataset.appsBound !== 'true') {
      launcher.dataset.appsBound = 'true';
      launcher.addEventListener('click', (event) => {
        if (typeof window !== 'undefined' && typeof window.__openArcusAppSwitcher === 'function') {
          event.preventDefault();
          event.stopPropagation();
          window.__openArcusAppSwitcher();
          return;
        }
        launcher.classList.add('is-open');
        const apps = [
          ['overview','Payroll & Human Capital','People, pay and compliance','users'],
          ['vendors','Procurement','Vendors, RFQs and quotation controls','briefcase'],
          ['reports','Reporting Studio','Compliance and management reporting','report'],
          ['vault','Document Vault','Governed records and evidence','folder'],
          ['access','Identity & Access','Roles, scopes and segregation controls','key'],
          ['settings','Platform Settings','Integrations and environment controls','settings']
        ];
        openDrawer('Matanho Applications','Move between connected operating workspaces',`<div class="app-grid">${apps.map(([page,name,desc,ico])=>`<button class="app-tile" data-page="${page}"><span class="app-tile-icon">${icon(ico)}</span><span><strong>${name}</strong><span>${desc}</span></span></button>`).join('')}</div><div class="callout blue" style="margin-top:12px"><span class="kpi-icon">${icon('apps')}</span><div><strong>Connected operating environment</strong><p>Module permissions, data scope and audit controls follow the signed-in user.</p></div></div>`);
        const drawer = document.querySelector('#drawer');
        const observer = new MutationObserver(() => {
          if (!drawer.classList.contains('open')) { launcher.classList.remove('is-open'); observer.disconnect(); }
        });
        observer.observe(drawer,{attributes:true,attributeFilter:['class']});
      });
    }
  }

  accessPage = function(){ return __pr6AccessPageHtml(); };

  const originalRenderV4 = render;
  render = function(){
    originalRenderV4();
    const mark=document.querySelector('.brand-mark');
    if(mark) mark.textContent='m';
  };
  render();

  window.MatanhoUI = Object.freeze({
    version:'5.0.0',
    render:()=>render(),
    navigate:(page)=>goPage(page),
    getState:()=>({...state}),
    getAccessModel:()=>({roles:JSON.parse(JSON.stringify(roles)),permissions:[...permissions]}),
    replaceData:(resource,records)=>{
      const targets={employees,payrollRuns,exceptions,documents,reportTemplates,auditEvents,userAccess};
      const target=targets[resource];
      if(!target||!Array.isArray(records)) throw new Error(`Unsupported data resource: ${resource}`);
      target.splice(0,target.length,...records);
      render();
      window.dispatchEvent(new CustomEvent('matanho:data-replaced',{detail:{resource,count:records.length}}));
    },
    replaceRoles:(nextRoles)=>{
      if(!nextRoles||typeof nextRoles!=='object') throw new Error('Roles payload must be an object');
      Object.keys(roles).forEach(key=>delete roles[key]);
      Object.assign(roles,nextRoles);
      render();
      window.dispatchEvent(new CustomEvent('matanho:roles-replaced',{detail:{count:Object.keys(roles).length}}));
    },
    openApps:()=>document.querySelector('#appLauncher')?.click(),
    events:{
      subscribe:(name,handler)=>window.addEventListener(`matanho:${name}`,handler),
      publish:(name,detail)=>window.dispatchEvent(new CustomEvent(`matanho:${name}`,{detail}))
    }
  });

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action],[data-page],[data-run],[data-employee],[data-document],[data-vendor],[data-chart-point]');
    if (!target) return;
    const detail = {
      action:target.dataset.action || null,
      page:target.dataset.page || null,
      runId:target.dataset.run || null,
      employeeId:target.dataset.employee || null,
      documentId:target.dataset.document || null,
      vendorId:target.dataset.vendor || null,
      chartPoint:target.dataset.chartPoint || null,
      timestamp:new Date().toISOString()
    };
    window.dispatchEvent(new CustomEvent('matanho:ui-action',{detail}));
  },true);
})();


(() => {
  const v5 = { version: '5.0.0' };
  const app = document.querySelector('#app');

  const escapeV5 = (value) => String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;');

  const compactTextV5 = (element, max = 180) => {
    const value = (element?.innerText || element?.textContent || '').replace(/\s+/g,' ').trim();
    return value.length > max ? `${value.slice(0,max - 1)}...` : value;
  };

  const ensureSidebarControlV5 = () => {
    document.querySelector('#collapseBtn')?.remove();
    const foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    let oldButton = document.querySelector('#sidebarToggleBottom');
    if (!oldButton) {
      foot.insertAdjacentHTML('beforeend', `<button class="sidebar-toggle-bottom" id="sidebarToggleBottom" type="button" aria-label="Toggle navigation"><span class="toggle-icon">${icon('chev')}</span><span class="toggle-label"></span></button>`);
      oldButton = document.querySelector('#sidebarToggleBottom');
    }
    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);

    const sync = () => {
      const mobile = window.matchMedia('(max-width:760px)').matches;
      const collapsed = app?.classList.contains('collapsed');
      const label = button.querySelector('.toggle-label');
      button.classList.toggle('is-expanded', !collapsed && !mobile);
      if (label) label.textContent = mobile ? 'Close navigation' : collapsed ? 'Expand menu' : 'Collapse menu';
      button.setAttribute('aria-label', mobile ? 'Close navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation');
    };

    button.addEventListener('click', () => {
      if (!app) return;
      if (window.matchMedia('(max-width:760px)').matches) {
        app.classList.remove('mobile-nav');
      } else {
        app.classList.toggle('collapsed');
        safeStorage.setItem('matanho-payroll-sidebar', app.classList.contains('collapsed') ? 'collapsed' : 'expanded');
      }
      sync();
    });

    window.addEventListener('resize', sync, { passive:true });
    sync();
  };

  const reportByIdV5 = (id) => reportTemplates.find(report => report.id === id) || reportTemplates[0];

  const previewReportV5 = (id) => {
    const report = reportByIdV5(id);
    if (!report) return;
    const readonly = reportContent(report)
      .replace('contenteditable="true"','contenteditable="false"')
      ;
    state.reportDraft = { ...report, version: state.reportDraft?.id === report.id ? state.reportDraft.version : 1 };
    openModal(
      report.name,
      `${report.category} - Read-only report preview - ${report.freq}`,
      `<div class="report-preview-mode"><div><strong>Preview mode</strong><span>Source-linked values are shown exactly as they will appear in the generated report.</span></div>${badge('Ready')}</div><div class="report-preview-shell">${readonly}</div>`,
      `${button('Download PDF','download-report-pdf','', 'download')}${button('Create editable draft','v5-edit-report','primary','edit')}`,
      true
    );
    window.dispatchEvent(new CustomEvent('matanho:report-previewed',{detail:{reportId:report.id,name:report.name}}));
  };

  const cardSummaryV5 = (card) => {
    const title = card.querySelector('.card-head h3')?.textContent?.trim() || 'Record detail';
    if(title==='Recent payslips'){
      const m=__pr6MyPayView();
      const rows=m?.slips||[];
      const body=rows.length
        ? '<div class="list">'+rows.map(p=>`<div class="list-row"><div class="list-main"><strong>${__pr6Esc(p.period)}</strong><span>${__pr6Esc(p.currency||'USD')} ${__pr6Esc(Number(p.net||0).toFixed(2))} net pay</span></div><button type="button" class="btn small" data-action="download-payslip" data-payslip-id="${__pr6Esc(p.id)}" data-period="${__pr6Esc(p.period)}" data-employee-name="${__pr6Esc(m.self.name||m.self.employeeNumber||'Employee')}">Download PDF</button></div>`).join('')+'</div>'
        : '<p>No payslips have been issued yet.</p>';
      openDrawer('Recent payslips','Choose a pay period to download its PDF',body,button('Close','close-drawer'));
      return;
    }
    const subtitle = card.querySelector('.card-head p')?.textContent?.trim() || 'Context and supporting metadata';
    const facts = [...card.querySelectorAll('.fact')].slice(0,8).map(fact => {
      const label = fact.querySelector('span')?.textContent?.trim() || 'Measure';
      const value = fact.querySelector('strong')?.textContent?.trim() || compactTextV5(fact,90);
      return `<div class="fact"><span>${escapeV5(label)}</span><strong>${escapeV5(value)}</strong></div>`;
    });
    const rows = [...card.querySelectorAll('tbody tr,.list-row')].slice(0,7).map((row,index) => {
      const cells = [...row.querySelectorAll('td')].map(cell => compactTextV5(cell,70)).filter(Boolean);
      const text = cells.length ? cells.join(' - ') : compactTextV5(row,150);
      return `<div class="list-row"><div class="list-main"><strong>Record ${index + 1}</strong><span>${escapeV5(text)}</span></div>${icon('chev')}</div>`;
    });
    const body = `${facts.length ? `<div class="grid ${facts.length > 4 ? 'three' : 'two'}">${facts.join('')}</div>` : ''}${rows.length ? `<section class="drawer-section" style="margin-top:14px"><h3>Visible records</h3><div class="list">${rows.join('')}</div></section>` : `<div class="callout blue"><span class="kpi-icon">${icon('eye')}</span><div><strong>${escapeV5(title)}</strong><p>${escapeV5(compactTextV5(card,260))}</p></div></div>`}`;
    openDrawer(title,subtitle,body,button('Close summary','close-drawer','primary','x'));
  };

  const rowSummaryV5 = (row) => {
    const cells = [...row.querySelectorAll('td')];
    const headerCells = row.closest('table') ? [...row.closest('table').querySelectorAll('thead th')] : [];
    const pairs = cells.map((cell,index) => ({
      label: headerCells[index]?.textContent?.trim() || `Field ${index + 1}`,
      value: compactTextV5(cell,140)
    })).filter(item => item.value);
    const listText = !cells.length ? compactTextV5(row,300) : '';
    openDrawer(
      pairs[0]?.value || 'Record summary',
      'Contextual data and record metadata',
      pairs.length
        ? `<div class="grid two">${pairs.map(item => `<div class="fact"><span>${escapeV5(item.label)}</span><strong>${escapeV5(item.value)}</strong></div>`).join('')}</div><div class="callout blue" style="margin-top:14px"><span class="kpi-icon">${icon('audit')}</span><div><strong>Traceable source record</strong><p>This summary preserves the page context and can be connected to a backend detail endpoint without changing the interface contract.</p></div></div>`
        : `<div class="callout blue"><span class="kpi-icon">${icon('eye')}</span><div><strong>Record summary</strong><p>${escapeV5(listText)}</p></div></div>`
    );
  };

  const metricRouteV5 = (label) => {
    const value = label.toLowerCase();
    if (/exception|issue|critical/.test(value)) return 'exceptions';
    if (/employee|headcount|workforce/.test(value)) return 'employees';
    if (/approval|checker|control/.test(value)) return 'approvals';
    if (/report|filing|return/.test(value)) return 'reports';
    if (/document|vault/.test(value)) return 'vault';
    if (/training|certificate/.test(value)) return 'training';
    if (/leave/.test(value)) return 'leave';
    if (/user|access|mfa|role|dormant|privileged/.test(value)) return 'access';
    if (/run|payroll cycle/.test(value)) return 'runs';
    return null;
  };

  const upgradeReportsV5 = () => {
    document.querySelectorAll('.report-card').forEach(card => {
      const id = card.dataset.report || card.dataset.reportId;
      if (!id) return;
      card.dataset.reportId = id;
      delete card.dataset.report;
      card.setAttribute('tabindex','0');
      card.setAttribute('role','button');
      card.setAttribute('aria-label',`Preview ${card.querySelector('h4')?.textContent?.trim() || 'report'}`);
      const buttons = card.querySelectorAll('.report-card-actions .btn');
      if (buttons[0]) {
        delete buttons[0].dataset.report;
        buttons[0].dataset.v5ReportPreview = id;
        buttons[0].setAttribute('aria-label',`Preview ${card.querySelector('h4')?.textContent?.trim() || 'report'}`);
      }
      if (buttons[1]) {
        delete buttons[1].dataset.report;
        buttons[1].dataset.v5ReportGenerate = id;
        buttons[1].setAttribute('aria-label',`Generate editable ${card.querySelector('h4')?.textContent?.trim() || 'report'}`);
      }
    });
  };

  const upgradeInteractionsV5 = () => {
    document.querySelectorAll('.kpi').forEach(kpiElement => {
      if (kpiElement.dataset.v5Kpi) return;
      kpiElement.dataset.v5Kpi = 'true';
      kpiElement.setAttribute('tabindex','0');
      kpiElement.setAttribute('role','button');
      const label = kpiElement.querySelector('.kpi-label')?.textContent?.trim() || 'Metric';
      kpiElement.setAttribute('aria-label',`Inspect ${label}`);
    });

    document.querySelectorAll('.band-stat').forEach(metric => {
      if (metric.dataset.v5Metric) return;
      metric.dataset.v5Metric = 'true';
      metric.setAttribute('tabindex','0');
      metric.setAttribute('role','button');
    });

    document.querySelectorAll('.card').forEach(card => {
      const head = card.querySelector(':scope > .card-head');
      if (!head || head.querySelector('.v5-card-open')) return;
      if (head.querySelector('button,[data-action],[data-page]')) return;
      head.insertAdjacentHTML('beforeend', `<button type="button" class="v5-card-open" data-v5-card-detail aria-label="Open ${escapeV5(head.querySelector('h3')?.textContent?.trim() || 'card')} detail">${icon('arrow')}</button>`);
    });

    document.querySelectorAll('tbody tr,.list-row').forEach(row => {
      if (row.closest('.permission-grid,.role-matrix-scroll,.document-page')) return;
      if (row.matches('[data-run],[data-employee],[data-exception],[data-document],[data-vendor],[data-action],[data-page]')) return;
      if (row.querySelector('[data-run],[data-employee],[data-exception],[data-document],[data-vendor],[data-action],[data-page],button,a,input,select')) return;
      row.classList.add('v5-inspect-row');
      row.setAttribute('tabindex','0');
      row.setAttribute('role','button');
      row.dataset.v5Row = 'true';
      const listMain = row.querySelector('.list-main');
      if (listMain && !row.querySelector('.v5-row-chevron')) listMain.insertAdjacentHTML('afterend', `<span class="v5-row-chevron">${icon('chev')}</span>`);
    });

    upgradeReportsV5();
  };

  ensureSidebarControlV5();

  const previousRenderV5 = render;
  render = function(){
    previousRenderV5();
    requestAnimationFrame(() => {
      ensureSidebarControlV5();
      upgradeInteractionsV5();
    });
  };

  document.addEventListener('click', event => {
    const previewButton = event.target.closest('[data-v5-report-preview]');
    if (previewButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      previewReportV5(previewButton.dataset.v5ReportPreview);
      return;
    }

    const generateButton = event.target.closest('[data-v5-report-generate]');
    if (generateButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      generateReport(generateButton.dataset.v5ReportGenerate);
      return;
    }

    const reportCard = event.target.closest('.report-card[data-report-id]');
    if (reportCard && !event.target.closest('button,a,input,select,textarea')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      previewReportV5(reportCard.dataset.reportId);
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'v5-edit-report') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = state.reportDraft?.id || reportTemplates[0]?.id;
      closeModal();
      generateReport(id);
      return;
    }
    const cardButton = event.target.closest('[data-v5-card-detail]');
    if (cardButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = cardButton.closest('.card');
      if (card) cardSummaryV5(card);
      return;
    }

    const kpiElement = event.target.closest('[data-v5-kpi]');
    if (kpiElement && !event.target.closest('button,a,input,select,textarea')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const label = kpiElement.querySelector('.kpi-label')?.textContent?.trim() || '';
      const route = metricRouteV5(label);
      if (route && state.page !== route) {
        goPage(route);
      } else {
        document.querySelectorAll('.kpi.is-spotlight').forEach(item => { if (item !== kpiElement) item.classList.remove('is-spotlight'); });
        kpiElement.classList.toggle('is-spotlight');
        kpiElement.setAttribute('aria-pressed',String(kpiElement.classList.contains('is-spotlight')));
      }
      return;
    }

    const bandMetric = event.target.closest('[data-v5-metric]');
    if (bandMetric) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const label = bandMetric.querySelector('span')?.textContent?.trim() || 'Metric';
      const value = bandMetric.querySelector('strong')?.textContent?.trim() || '';
      openDrawer(label,'Operational metric detail',`<div class="grid two"><div class="fact"><span>Current value</span><strong>${escapeV5(value)}</strong></div><div class="fact"><span>Payroll period</span><strong>${escapeV5(state.period)}</strong></div></div><div class="callout blue" style="margin-top:14px"><span class="kpi-icon">${icon('report')}</span><div><strong>Drill-down ready</strong><p>This metric can be bound to the backend summary and detail endpoints described in the deployment package.</p></div></div>`);
      return;
    }

    const row = event.target.closest('[data-v5-row]');
    if (row) {
      event.preventDefault();
      event.stopImmediatePropagation();
      rowSummaryV5(row);
    }
  }, true);

  document.addEventListener('keydown', event => {
    const target = event.target.closest?.('[data-v5-kpi],[data-v5-row],[data-v5-metric],.report-card[data-report-id]');
    if (!target || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    target.click();
  }, __pr6Sig);

  document.addEventListener('click', event => {
    if (window.matchMedia('(max-width:760px)').matches && app?.classList.contains('mobile-nav')) {
      const navigationTarget = event.target.closest('.nav-item');
      if (navigationTarget) app.classList.remove('mobile-nav');
    }
  }, __pr6Sig);

  upgradeInteractionsV5();
  const oldApi = window.MatanhoUI;
  if (oldApi) window.MatanhoUI = Object.freeze({ ...oldApi, version:v5.version, render:() => render() });
  window.dispatchEvent(new CustomEvent('matanho:v5-ready',{detail:{version:v5.version}}));
})();


(() => {
  const v6 = { version:'6.0.0' };
  const attrV6 = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('\"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const optionV6 = (value,label,current) => `<option value="${attrV6(value)}" ${current===value?'selected':''}>${label}</option>`;
  const uniqueV6 = values => [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const normaliseV6 = value => String(value || '').trim().toLowerCase();
  const reportRecordsV6 = () => Array.isArray(__pr6Live.reports?.catalog) ? __pr6Live.reports.catalog : [];
  const activeChipsV6 = values => values.filter(Boolean).map(value=>`<span class="filter-chip">${attrV6(value)}</span>`).join('');

  state.vaultSearch ??= '';
  state.vaultClassification ??= 'All classifications';
  state.vaultStatus ??= 'All statuses';
  state.vaultOwner ??= 'All owners';
  state.vaultPage ??= 1;
  state.vaultPageSize ??= 10;
  state.reportSearch ??= '';
  state.reportCategory ??= 'All categories';
  state.reportFrequency ??= 'All frequencies';
  state.reportStatus ??= 'All statuses';
  state.reportPage ??= 1;
  state.reportPageSize ??= 10;
  state.reportLoading ??= false;

  vaultPage = function(){ return __pr6VaultPageHtml(); };

  reportsPage = function(){
    if(!__pr6IsLive()) return `<div class="page"><div class="skeleton-page"><div class="skeleton-block"></div><div class="skeleton-block"></div><div class="skeleton-block"></div></div></div>`;
    const query=normaliseV6(state.reportSearch);
    const allReports=reportRecordsV6();
    const categories=uniqueV6(allReports.map(r=>r.category));
    const frequencies=uniqueV6(allReports.map(r=>r.freq));
    const statuses=[];
    const filtered=allReports.filter(r=>{
      const haystack=[r.name,r.id,r.category,r.description,r.frequency].join(' ').toLowerCase();
      return (!query||haystack.includes(query))
        && (state.reportCategory==='All categories'||r.category===state.reportCategory)
        && (state.reportFrequency==='All frequencies'||r.frequency===state.reportFrequency)
        && (state.reportStatus==='All statuses');
    });
    const activeFilters=[
      state.reportSearch ? `Search: ${state.reportSearch}` : '',
      state.reportCategory!=='All categories' ? state.reportCategory : '',
      state.reportFrequency!=='All frequencies' ? state.reportFrequency : '',
      ''
    ];
    const generated=__pr6Live.reports||{};
    const saved=Array.isArray(generated.items)?generated.items:[];
    const pages=generated.pagination||{page:1,totalPages:1,total:0};
    const metrics=generated.metrics||{};
    const reportCards=filtered.length
      ? `<div class="report-grid filtered-report-grid">${filtered.map(r=>`<article class="report-card"><div class="report-preview-mini"><div class="report-icon">${icon('report')}</div><div class="sheet-lines"><i></i><i></i><i></i><i></i></div></div><div class="report-card-content"><h4>${attrV6(r.name)}</h4><p>${attrV6(r.description||'')}</p><footer><span>${attrV6(r.category)} · ${attrV6(r.frequency)}</span></footer><div class="report-card-actions"><button class="btn small primary" data-v6-generate-report="${attrV6(r.id)}">${icon('file')}Generate report</button></div></div></article>`).join('')}</div>`
      : `<section class="filtered-empty"><div><span class="empty-icon">${icon('report')}</span><strong>No report templates match these filters</strong><p>Try another report name, category or frequency.</p><button class="btn primary" type="button" data-v6-clear-reports>${icon('x')}Clear report filters</button></div></section>`;
    const reportExportIcons=(index)=>`<span class="report-export-icons" role="group" aria-label="Export report"><button class="icon-btn report-export-icon" type="button" title="Export PDF" aria-label="Export report as PDF" data-v6-export-report="pdf" data-report-index="${index}">${icon('file')}</button><button class="icon-btn report-export-icon" type="button" title="Export Excel" aria-label="Export report as Excel" data-v6-export-report="excel" data-report-index="${index}">${icon('report')}</button><button class="icon-btn report-export-icon" type="button" title="Export CSV" aria-label="Export report as CSV" data-v6-export-report="csv" data-report-index="${index}">${icon('download')}</button></span>`;
    const reportPageExportIcons=()=>`<span class="report-export-icons" role="group" aria-label="Export generated reports"><button class="icon-btn report-export-icon" type="button" title="Export PDF" aria-label="Export reports as PDF" data-v6-export-report-page="pdf">${icon('file')}</button><button class="icon-btn report-export-icon" type="button" title="Export Excel" aria-label="Export reports as Excel" data-v6-export-report-page="excel">${icon('report')}</button><button class="icon-btn report-export-icon" type="button" title="Export CSV" aria-label="Export reports as CSV" data-v6-export-report-page="csv">${icon('download')}</button></span>`;
    const tableRows=saved.map((r,i)=>`<tr><td>${attrV6(r.reportName)}</td><td>${attrV6(String(r.periodStart||'').slice(0,10))} – ${attrV6(String(r.periodEnd||'').slice(0,10))}</td><td>${attrV6(r.currencyCode||'All currencies')}</td><td>${Number(Array.isArray(r.rows)?r.rows.length:r.rowCount)||0}</td><td>${attrV6(r.generatedBy?`${r.generatedBy.firstName||''} ${r.generatedBy.lastName||''}`.trim():'')}</td><td>${attrV6(new Date(r.generatedAt).toLocaleString())}</td><td><div class="report-row-actions"><button class="btn small" data-v6-view-report data-report-index="${i}">${icon('eye')}View</button>${reportExportIcons(i)}</div></td></tr>`).join('');
    return `<div class="page">${pageHead('Compliance and management reporting','Compliance Report Studio','Generate statutory schedules and audit-ready reports from calculated payroll records.', '')}
      <div class="grid kpis">${kpi('Report templates',String(metrics.templates??allReports.length),'Available report types','report')}${kpi('Reports generated',String(metrics.generated??pages.total??0),'Saved report snapshots','file','cyan')}${kpi('Current result set',String(pages.total??saved.length),'Persisted generated reports','audit','violet')}</div>
      <section class="card control-filter-card report-filter-card"><div class="card-body"><div class="control-filter-toolbar"><label class="control-filter-search"><span class="sr-only">Search compliance reports</span>${icon('search')}<input id="reportSearchInput" value="${attrV6(state.reportSearch)}" placeholder="Search report name, purpose, category or frequency"></label><label class="control-filter-field"><span>Category</span><select id="reportCategoryFilter">${optionV6('All categories','All categories',state.reportCategory)}${categories.map(v=>optionV6(v,v,state.reportCategory)).join('')}</select></label><label class="control-filter-field"><span>Frequency</span><select id="reportFrequencyFilter">${optionV6('All frequencies','All frequencies',state.reportFrequency)}${frequencies.map(v=>optionV6(v,v,state.reportFrequency)).join('')}</select></label><button class="btn filter-clear" type="button" data-v6-clear-reports>${icon('x')}Clear</button></div><div class="control-filter-summary"><div class="control-filter-count"><strong>${filtered.length}</strong><span>of ${allReports.length} API report templates</span></div><div class="control-filter-active">${activeChipsV6(activeFilters)}</div></div></div></section>
      ${reportCards}
      <section class="card report-runs-card"><div class="card-head"><div><h2>Generated reports</h2><p>Persisted snapshots from Payroll records; exports use the snapshot selected here.</p></div><div class="report-table-toolbar">${reportPageExportIcons()}</div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>REPORT</th><th>PERIOD</th><th>CURRENCY</th><th>ROWS</th><th>GENERATED BY</th><th>GENERATED</th><th>EXPORT</th></tr></thead><tbody>${state.reportLoading?Array.from({length:5},()=>`<tr class="skeleton-row"><td colspan="7"><span class="skeleton-line"></span></td></tr>`).join(''):tableRows||`<tr><td colspan="7" class="empty-cell">No reports generated yet. Generate a report above to save a data snapshot.</td></tr>`}</tbody></table></div><div class="pagination report-pagination"><div><button class="btn small" data-v6-report-page="${Math.max(1,Number(pages.page||1)-1)}" ${Number(pages.page||1)<=1?'disabled':''}>Previous</button><span>Page ${pages.page||1} of ${Math.max(1,pages.totalPages||1)}</span><button class="btn small" data-v6-report-page="${Math.min(pages.totalPages||1,(pages.page||1)+1)}" ${Number(pages.page||1)>=(pages.totalPages||1)?'disabled':''}>Next</button></div></div></section>
    </div>`;
  };

  const rerenderAndFocusV6 = (id,position) => {
    render();
    requestAnimationFrame(()=>{
      const next=document.querySelector(`#${id}`);
      if(!next) return;
      next.focus();
      if(typeof position==='number' && next.setSelectionRange) next.setSelectionRange(position,position);
    });
  };

  const exportVaultV6 = (kind) => {
    const q = String(state.vaultSearch || '').trim().toLowerCase();
    const cls = state.vaultClassification || 'All classifications';
    const owner = state.vaultOwner || 'All owners';
    const folder = state.folder || 'All documents';
    const filtered = (Array.isArray(documents) ? documents : []).filter((d) => {
      const hay = [d.name, d.reference, d.folder, d.class, d.owner, d.periodLabel, d.run].join(' ').toLowerCase();
      return (!q || hay.includes(q)) &&
        (cls === 'All classifications' || d.class === cls) &&
        (owner === 'All owners' || d.owner === owner) &&
        (folder === 'All documents' || d.folder === folder);
    });
    const exporter = window.__PAYROLL_V6_EXPORT_VAULT__;
    if (typeof exporter !== 'function') {
      toast('Export unavailable', 'The payroll export service is not ready.', 'warn');
      return;
    }
    const rows = filtered.map((d) => [
      d.reference || 'No reference', d.name || '', d.folder || '', d.class || '', d.owner || '',
      d.modified || '', d.periodLabel || '', d.run || '', d.type || '', Number(d.sizeBytes) || 0,
    ]);
    void exporter(kind, {
      title: 'Payroll and HR Document Register',
      subtitle: 'Document records matching the current vault filters.',
      columns: ['Document reference', 'File name', 'Category', 'Classification', 'Uploaded by', 'Uploaded', 'Pay period', 'Payroll run', 'File type', 'File size (bytes)'],
      rows,
      filename: 'payroll-hr-document-register',
      landscape: true,
      meta: [['Documents', String(filtered.length)], ['Category', folder], ['Classification', cls], ['Uploaded by', owner], ['Search', state.vaultSearch || 'All']],
      note: 'Confidential payroll and employee records. Database identifiers and storage locations are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.',
    });
  };

  document.addEventListener('input',event=>{
    if(event.target.id==='vaultSearchInput'){
      state.vaultSearch=event.target.value;
      state.vaultPage=1;
      rerenderAndFocusV6('vaultSearchInput',event.target.selectionStart);
    }
    if(event.target.id==='reportSearchInput'){
      state.reportSearch=event.target.value;
      rerenderAndFocusV6('reportSearchInput',event.target.selectionStart);
    }
  }, __pr6Sig);

  document.addEventListener('change',event=>{
    if(event.target.id==='vaultClassificationFilter'){state.vaultClassification=event.target.value;state.vaultPage=1;render();}
    if(event.target.id==='vaultStatusFilter'){state.vaultStatus=event.target.value;state.vaultPage=1;render();}
    if(event.target.id==='vaultOwnerFilter'){state.vaultOwner=event.target.value;state.vaultPage=1;render();}
    if(event.target.id==='vaultPageSize'){state.vaultPageSize=Number(event.target.value)||10;state.vaultPage=1;render();}
    if(event.target.id==='reportCategoryFilter'){state.reportCategory=event.target.value;render();}
    if(event.target.id==='reportFrequencyFilter'){state.reportFrequency=event.target.value;render();}
    if(event.target.id==='reportStatusFilter'){state.reportStatus=event.target.value;render();}
  }, __pr6Sig);

  document.addEventListener('click',event=>{
    const reportGenerate=event.target.closest('[data-v6-generate-report]');
    if(reportGenerate){event.preventDefault();event.stopImmediatePropagation();state.reportType=reportGenerate.dataset.v6GenerateReport;const now=new Date(),first=new Date(now.getFullYear(),now.getMonth(),1),last=new Date(now.getFullYear(),now.getMonth()+1,0);const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;openModal('Generate compliance report','Create an immutable snapshot from live Payroll records.',`<div class="form-grid report-generate-form"><div class="form-field"><label for="v6ReportStart">Period start</label><input type="date" id="v6ReportStart" value="${iso(first)}"></div><div class="form-field"><label for="v6ReportEnd">Period end</label><input type="date" id="v6ReportEnd" value="${iso(last)}"></div><div class="form-field"><label for="v6ReportCurrency">Currency (payroll reports)</label><select id="v6ReportCurrency"><option value="">All currencies</option><option>USD</option><option>ZIG</option></select></div></div>`,`<button class="btn" data-v6-close-report>Cancel</button><button class="btn primary" data-v6-run-report>${icon('check')}Generate report</button>`,false);return;}
    if(event.target.closest('[data-v6-close-report]')){event.preventDefault();event.stopImmediatePropagation();closeModal();return;}
    if(event.target.closest('[data-v6-run-report]')){event.preventDefault();event.stopImmediatePropagation();const btn=event.target.closest('[data-v6-run-report]'),run=window.__PAYROLL_V6_GENERATE_REPORT__;if(typeof run!=='function'){toast('Report service unavailable','Payroll report generation is not ready.','warn');return;}btn.disabled=true;btn.textContent='Generating…';const input={reportType:state.reportType,periodStart:document.querySelector('#v6ReportStart')?.value,periodEnd:document.querySelector('#v6ReportEnd')?.value,currencyCode:document.querySelector('#v6ReportCurrency')?.value||null};void run(input).then(async()=>{closeModal();state.reportLoading=true;render();const load=window.__PAYROLL_V6_LIST_REPORTS__;try{if(typeof load==='function'){__pr6Live.reports=await load({page:1,limit:state.reportPageSize||10});state.reportPage=1;}}catch(err){toast('Report saved','The report was generated, but the register could not refresh. Use Refresh to reload it.','warn');}state.reportLoading=false;render();toast('Report generated','A snapshot of live Payroll data has been saved.');}).catch(err=>{btn.disabled=false;toast('Report could not be generated',err?.message||String(err),'warn');});return;}
    const reportPage=event.target.closest('[data-v6-report-page]');if(reportPage){event.preventDefault();event.stopImmediatePropagation();const page=Number(reportPage.dataset.v6ReportPage)||1,load=window.__PAYROLL_V6_LIST_REPORTS__;if(typeof load==='function'){state.reportPage=page;state.reportLoading=true;render();void load({page,limit:state.reportPageSize||10}).then(data=>{__pr6Live.reports=data;state.reportLoading=false;render();}).catch(err=>{state.reportLoading=false;toast('Could not load generated reports',err?.message||String(err),'warn');render();});}return;}
    const refreshReports=event.target.closest('[data-v6-refresh-reports]');if(refreshReports){event.preventDefault();event.stopImmediatePropagation();const load=window.__PAYROLL_V6_LIST_REPORTS__;if(typeof load==='function'){state.reportLoading=true;render();void load({page:state.reportPage||1,limit:state.reportPageSize||10}).then(data=>{__pr6Live.reports=data;state.reportLoading=false;render();}).catch(err=>{state.reportLoading=false;toast('Could not refresh generated reports',err?.message||String(err),'warn');render();});}return;}
    const viewReport=event.target.closest('[data-v6-view-report]');if(viewReport){event.preventDefault();event.stopImmediatePropagation();const saved=__pr6Live.reports?.items?.[Number(viewReport.dataset.reportIndex)];if(saved){const cols=saved.columns||[],rows=saved.rows||[];const html=`<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${attrV6(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,100).map(row=>`<tr>${cols.map(c=>{const key=String(c).replace(/[^a-z]/gi,'').toLowerCase(),field=Object.keys(row||{}).find(k=>k.replace(/[^a-z]/gi,'').toLowerCase()===key);return `<td>${attrV6(field?row[field]??'':'')}</td>`;}).join('')}</tr>`).join('')||`<tr><td colspan="${Math.max(1,cols.length)}">No source rows matched this report period.</td></tr>`}</tbody></table></div>${rows.length>100?`<p class="tiny muted">Showing the first 100 of ${rows.length} rows. Export the report for the complete snapshot.</p>`:''}`;openModal(attrV6(saved.reportName),`Generated ${new Date(saved.generatedAt).toLocaleString()} · ${rows.length} source rows`,html,'',true);}return;}
    const reportExport=event.target.closest('[data-v6-export-report]');if(reportExport){event.preventDefault();event.stopImmediatePropagation();const saved=__pr6Live.reports?.items?.[Number(reportExport.dataset.reportIndex)];if(saved)exportPayrollReportV6(reportExport.dataset.v6ExportReport,saved);return;}
    const reportExportPage=event.target.closest('[data-v6-export-report-page]');if(reportExportPage){event.preventDefault();event.stopImmediatePropagation();const rows=__pr6Live.reports?.items||[];if(rows.length)exportPayrollReportsV6(reportExportPage.dataset.v6ExportReport,rows);else toast('No reports to export','Generate a report first.','warn');return;}
    const vaultExport=event.target.closest('[data-vault-export]');
    if(vaultExport){event.preventDefault();event.stopImmediatePropagation();exportVaultV6(vaultExport.dataset.vaultExport);return;}
    const vaultPage=event.target.closest('[data-vault-page]');
    if(vaultPage){event.preventDefault();event.stopImmediatePropagation();state.vaultPage=Number(vaultPage.dataset.vaultPage)||1;render();return;}
    const vaultFolder=event.target.closest('[data-folder]');
    if(vaultFolder&&state.page==='vault'){event.preventDefault();event.stopImmediatePropagation();state.folder=vaultFolder.dataset.folder;state.vaultPage=1;render();return;}
    const clearDocs=event.target.closest('[data-v6-clear-docs]');
    if(clearDocs){
      event.preventDefault();event.stopImmediatePropagation();
      state.vaultSearch='';state.folder='All documents';state.vaultClassification='All classifications';state.vaultStatus='All statuses';state.vaultOwner='All owners';state.vaultPage=1;render();return;
    }
    const clearReports=event.target.closest('[data-v6-clear-reports]');
    if(clearReports){
      event.preventDefault();event.stopImmediatePropagation();
      state.reportSearch='';state.reportCategory='All categories';state.reportFrequency='All frequencies';state.reportStatus='All statuses';render();
    }
  },true);

  const exportPayrollReportV6=(kind,report)=>{const exporter=window.__PAYROLL_V6_EXPORT_REPORT__;if(typeof exporter!=='function'){toast('Export unavailable','The payroll export service is not ready.','warn');return;}const cols=Array.isArray(report.columns)?report.columns:[],rows=Array.isArray(report.rows)?report.rows:[];void exporter(kind,{title:report.reportName,subtitle:`Payroll report for ${String(report.periodStart||'').slice(0,10)} to ${String(report.periodEnd||'').slice(0,10)}. Generated from a saved API snapshot.`,columns:cols,rows:rows.map(row=>cols.map(col=>{const key=String(col).replace(/[^a-z]/gi,'').toLowerCase();const found=Object.keys(row||{}).find(k=>k.replace(/[^a-z]/gi,'').toLowerCase()===key);const value=found?row[found]:'';return value instanceof Date?value.toISOString().slice(0,10):value??'';})),filename:`payroll-${String(report.reportType||'report')}-${String(report.periodStart||'').slice(0,10)}`,landscape:true,meta:[['Report',report.reportName],['Period',`${String(report.periodStart||'').slice(0,10)} to ${String(report.periodEnd||'').slice(0,10)}`],['Currency',report.currencyCode||'All currencies'],['Rows',String(rows.length)]],note:'Confidential Payroll information. Personal database identifiers are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'});};
  const exportPayrollReportsV6=(kind,reports)=>{const rows=reports.map(r=>[r.reportName,String(r.periodStart||'').slice(0,10),String(r.periodEnd||'').slice(0,10),r.currencyCode||'All currencies',Array.isArray(r.rows)?r.rows.length:0,r.generatedAt?new Date(r.generatedAt).toISOString():'' ]);const exporter=window.__PAYROLL_V6_EXPORT_REPORT__;if(typeof exporter==='function')void exporter(kind,{title:'Generated Payroll Report Register',subtitle:'Saved report snapshots generated from Payroll API data.',columns:['Report','Period start','Period end','Currency','Rows','Generated'],rows,filename:'payroll-generated-report-register',landscape:true,note:'Confidential Payroll information. Database identifiers are excluded. Local and development exports use Matanho branding; production exports use NVCCZ branding.'});};

  const previousApi=window.MatanhoUI;
  if(previousApi) window.MatanhoUI=Object.freeze({...previousApi,version:v6.version,render:()=>render()});
  if(state.page==='vault'||state.page==='reports') render();
  window.dispatchEvent(new CustomEvent('matanho:v6-ready',{detail:{version:v6.version,features:['document-search','document-filters','report-search','report-filters']}}));
})();



  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();

  const __pr6SessionOff = onClientDesignSessionUser(() => {
    applySessionUserToProfile(rootEl)
    wireTopProfile()
  })
  wireTopProfile()

  api = {
    /**
     * Replace the runtime's fixtures with live API data and re-render.
     * Injected by scripts/patch-payroll-runtime.mjs — see that script.
     *
     * Partial payloads are fine: only the keys present are replaced, so one
     * failed loader does not blank the whole module.
     */
    hydrate(payload) {
      if (!payload || typeof payload !== 'object') return;
      try {
        if (Array.isArray(payload.employees)) { employees = payload.employees; __pr6Live.employees = payload.employees; }
        if (Array.isArray(payload.payrollRuns)) payrollRuns = payload.payrollRuns;
        if (Array.isArray(payload.exceptions)) { exceptions = payload.exceptions; __pr6Live.exceptions = payload.exceptions; }
        if (Array.isArray(payload.documents)) documents = payload.documents;
        if (Array.isArray(payload.folders)) folders = payload.folders;
        if (Array.isArray(payload.reportTemplates)) reportTemplates = payload.reportTemplates;
        if (Array.isArray(payload.auditEvents)) auditEvents = payload.auditEvents;
        if (Array.isArray(payload.userAccess)) userAccess = payload.userAccess;

        __pr6Live.accessUnavailable = payload.accessUnavailable === true;
        if (payload.accessRoster !== undefined) __pr6Live.accessRoster = payload.accessRoster;
        if (payload.reports !== undefined) __pr6Live.reports = payload.reports;
        if (payload.auditData !== undefined) __pr6Live.audit = payload.auditData;
        if (Array.isArray(payload.permissions)) {
          __pr6Live.permissions = new Set(payload.permissions);
        }
        if (payload.roleName) {
          __pr6Live.roleName = payload.roleName;
          // Keep the runtime's own role label in step so any remaining
          // role-driven copy shows the real role rather than the mock default.
          if (typeof state !== 'undefined') state.role = payload.roleName;
        }
        if (payload.exceptionStats !== undefined) __pr6Live.exceptionStats = payload.exceptionStats;
        if (payload.counts && typeof payload.counts === 'object') {
          __pr6Live.counts = payload.counts;
        }
        // Reference/self-service payloads have no fixture equivalent in the
        // runtime, so they are kept on the live store for the page builders.
        if (payload.reference && typeof payload.reference === 'object') {
          __pr6Live.reference = payload.reference;
        }
        if (payload.dashboard && typeof payload.dashboard === 'object') {
          __pr6Live.dashboard = payload.dashboard;
        }
        if (payload.componentMix !== undefined) __pr6Live.componentMix = payload.componentMix;
        if (payload.mypay && typeof payload.mypay === 'object') {
          __pr6Live.mypay = payload.mypay;
        }
        if (Array.isArray(payload.leaveBalances)) {
          __pr6Live.leaveBalances = payload.leaveBalances;
        }
        if (payload.vendors !== undefined) {
          __pr6Live.vendors = payload.vendors;
        }
        if (payload.inputBatches !== undefined) {
          __pr6Live.inputBatches = payload.inputBatches;
        }
        if (payload.payGroups !== undefined) {
          __pr6Live.payGroups = payload.payGroups;
        }
        if (payload.onboarding !== undefined) {
          __pr6Live.onboarding = payload.onboarding;
        }
        if (payload.rfqs !== undefined) {
          __pr6Live.rfqs = payload.rfqs;
        }
        if (Array.isArray(payload.errors)) __pr6Live.errors = payload.errors;

        __pr6Live.ready = true;
        __pr6Live.loadError = null;
        if (state.page === 'overview' && window.location.pathname === '/payroll' && !can('dashboard.view')) {
          state.page = 'mypay';
          History.prototype.replaceState.call(window.history, null, '', '/payroll/mypay');
        }
        if (typeof render === 'function') render();
      } catch (err) {
        try { console.error('[payroll-v6] hydrate failed', err); } catch (_) {}
        // A render error must not leave the previous loading skeleton on screen.
        const content = rootEl.querySelector('#content');
        if (content) content.innerHTML = '<div class="page"><section class="card"><div class="card-body"><strong>Payroll data could not be displayed.</strong><p class="muted">Try loading the page again.</p><button class="btn small" data-action="retry-payroll-load">Try again</button></div></section></div>';
      }
    },
    failLiveLoad(message) {
      __pr6Live.loadError = String(message || 'Payroll data could not be loaded.');
      __pr6Live.ready = true;
      employees = [];
      if (typeof render === 'function') render();
    },
    setPage(page) {
      if (typeof permittedPage === 'function' && !permittedPage(page)) return;
      const changed = state.page !== page;
      state.page = page;
      // Training subroutes share one runtime page id but render different tab views.
      // Re-render on their history changes even while the parent page id stays "training".
      const trainingSubroute = page === 'training' && /^\/payroll\/training\/(assignments|certifications)\/?$/.test(window.location.pathname);
      if ((changed || trainingSubroute) && typeof render === 'function') render();
      try { $('#app')?.classList?.remove('mobile-nav'); } catch (_) {}
      try { closeDrawer(); closeModal(); closeCommand(); } catch (_) {}
    },
    destroy() {
      try { __pr6SessionOff?.() } catch (_) {}
      try { __pr6Abort.abort(); } catch (_) {}
      delete window.__PAYROLL_V6_NAV__;
      delete window.__PAYROLL_V6_EXPORT_EMPLOYEES__;
      delete window.__PAYROLL_V6_EXPORT_OVERVIEW__;
      delete window.__PAYROLL_V6_EXPORT_APPROVAL__;
      delete window.__PAYROLL_V6_EXPORT_CLOSE__;
      delete window.__PAYROLL_V6_EXPORT_EXCEPTIONS__;
      delete window.__PAYROLL_V6_EXPORT_COMPONENTS__;
      delete window.__PAYROLL_V6_EXPORT_SETTINGS__;
      delete window.__PAYROLL_V6_EXPORT_CALENDAR__;
      delete window.__PAYROLL_V6_EXPORT_TAX__;
      delete window.__PAYROLL_V6_EXPORT_TRAINING__;
      delete window.__PAYROLL_V6_EXPORT_LEAVE__;
      delete window.__PAYROLL_V6_EXPORT_VAULT__;
      delete window.__payrollComponentImportRows;
      delete window.__PAYROLL_V6_GET_BANKS__;
      delete window.__PAYROLL_V6_GET_PAYMENT__;
      try { delete window.MatanhoUI; } catch (_) {}
      rootEl.innerHTML = '';
    },
  };
  try {
    window.MatanhoUI = window.MatanhoUI || {};
    window.MatanhoUI.hydrate = (payload) => api.hydrate && api.hydrate(payload);
  } catch (_) {}

  return api;
}
