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
  vendors: null, // supplier registry, read from the real Vendor table
  inputBatches: null, // payroll input batches and their validation rows
  payGroups: null, // pay groups with their calendar periods
  onboarding: null, // onboarding candidates
  rfqs: null, // sourcing events and vendor bids
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
  // Set by an enhancement IIFE: pagePermission.vendors = 'vendors.manage'.
  // Missing this mapping denied the Vendors screen to every role including
  // System Administrator, because an unmapped id used to return a hard false.
  'vendors.manage': ['payroll.vendors.view', 'payroll.vendors.manage'],
  // Self-service is authenticated-only on the backend: every signed-in user
  // may see their own pay, so this is always allowed.
  'self.view': [],
};

/** Resolve a runtime permission id against the real backend grants. */
function __pr6Can(permission) {
  if (!__pr6IsLive() || !__pr6Live.permissions) return null; // fall through to mock roles
  const mapped = __PR6_PERMISSION_MAP[permission];
  // An id we have no mapping for must NOT be a hard deny: pagePermission is
  // extended by the enhancement IIFEs, and a missing entry locked System
  // Administrator out of the Vendors screen. Fall through instead, so the
  // decision is at least made against the role rather than by an oversight.
  if (!mapped) return null;
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
  if (!balances.length) return null;
  const staff = Array.isArray(employees) ? employees : [];
  const byNumber = new Map(staff.map((e) => [e.id, e]));

  const annual = balances.filter((b) => String(b.leaveType).toUpperCase() === 'ANNUAL');
  return annual.map((b) => {
    const emp = byNumber.get(b.employeeNumber);
    const basic = emp ? Number(emp.base) || 0 : 0;
    const days = Number(b.balance) || 0;
    return {
      employeeNumber: b.employeeNumber,
      name: b.name,
      initials: emp ? emp.initials : '--',
      department: b.department,
      available: days,
      liability: basic > 0 ? (basic / 22) * days : 0,
    };
  });
}

function __pr6LeaveStats() {
  const rows = __pr6LeaveRows();
  if (!rows) return null;
  const totalLiability = rows.reduce((s, r) => s + r.liability, 0);
  const avg = rows.length
    ? (rows.reduce((s, r) => s + r.available, 0) / rows.length).toFixed(1)
    : '0.0';
  const balances = Array.isArray(__pr6Live.leaveBalances) ? __pr6Live.leaveBalances : [];
  const types = Array.from(new Set(balances.map((b) => b.leaveType)));
  return {
    liability: totalLiability,
    average: avg,
    employees: rows.length,
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
 * URL still worked: a plain employee reaching /payroll-v6/approvals got the
 * full Maker-Checker screen. A hidden link is not access control.
 */
function __pr6DeniedPageHtml(pageId) {
  var required = '';
  try {
    required = (typeof pagePermission !== 'undefined' && pagePermission[pageId]) || '';
  } catch (_) {}
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
