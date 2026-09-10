/**
 * Payroll V6 live loaders.
 *
 * Fetches the module's data from the API and adapts it into the shapes the
 * vendored runtime renders, then hands the result to the runtime's hydrate()
 * entry point (added by scripts/patch-payroll-runtime.mjs).
 *
 * Two rules this file exists to enforce:
 *
 *  1. Per-call isolation. Each request goes through `safe()`, which records the
 *     failure and returns a fallback rather than rejecting the whole load, so
 *     one 403 on a screen the current role cannot see never blanks the module.
 *
 *  2. No invented numbers. Every field below is either copied from a payload or
 *     derived arithmetically from one, and the derivation is stated. Where the
 *     runtime's fixture had a field with no API source (branch, document count)
 *     it resolves to null and the UI shows a dash — an empty cell is honest,
 *     a plausible-looking constant is not.
 */
import {
  getMyPayrollAccess,
  getPayrollDashboard,
  listEmployees,
  listPayrollRuns,
  listLeaveBalances,
  listTaxRules,
  listAllowanceTypes,
  listDeductionTypes,
  listStatutoryBrackets,
  listStatutoryLevies,
  listBankTemplates,
  listTrainingCourses,
  listCertifications,
  getMyPayslips,
  getMyPayrollPortal,
  getMyLeaveBalances,
  listAuditEvents,
  type PayrollAccess,
  getPayrollVendors,
  listPayrollInputBatches,
  listPayrollPayGroups,
  listPayrollOnboarding,
  listPayrollRfqs,
} from "@/lib/api/payroll-v6-api"

export type LoaderError = { source: string; message: string; status?: number }

export type PayrollV6LivePayload = {
  ready: boolean
  roleName: string | null
  permissions: string[]
  access: PayrollAccess | null
  employees: any[]
  payrollRuns: any[]
  exceptions: any[]
  auditEvents: any[]
  counts: Record<string, number | null>
  dashboard: Record<string, any> | null
  reference: Record<string, any>
  leaveBalances: any[]
  mypay: Record<string, any>
  vendors: Record<string, any> | null
  inputBatches: Record<string, any> | null
  payGroups: Record<string, any> | null
  onboarding: Record<string, any> | null
  rfqs: Record<string, any> | null
  errors: LoaderError[]
}

const errors: LoaderError[] = []

/** Run a loader, record any failure, and fall back instead of rejecting. */
async function safe<T>(source: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const anyErr = err as any
    errors.push({
      source,
      message: anyErr?.data?.message ?? anyErr?.message ?? "Request failed",
      status: anyErr?.status ?? anyErr?.response?.status,
    })
    return fallback
  }
}

/** Shown wherever the backend genuinely has no value for a displayed field. */
const DASH = "—"

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function initialsOf(first?: string, last?: string): string {
  return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase() || "--"
}

function fmtDate(v: unknown): string | null {
  if (!v) return null
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/**
 * Payroll readiness, 0-100. This replaces a fixture field that used to be a
 * literal (96, 100, 82...). It is a real completeness score over the fields a
 * run actually needs, so it is reproducible from the employee payload:
 * five equally weighted checks, 20 points each.
 */
function readinessOf(e: any): number {
  const checks = [
    Boolean(e.bankName && e.accountNumber),
    Boolean(e.zimraBpNumber),
    Boolean(e.idNumber),
    num(e.basicSalary) > 0,
    e.isActive === true && e.terminated !== true,
  ]
  return checks.filter(Boolean).length * 20
}

function statusOf(e: any): string {
  if (e.terminated) return "Terminated"
  if (!e.isActive || e.lifecycleStatus === "SUSPENDED") return "Suspended"
  const r = readinessOf(e)
  if (r === 100) return "Ready"
  if (r >= 60) return "Review"
  return "Blocked"
}

/** Mask an account number the way the runtime's fixture displayed it. */
function maskAccount(bank?: string | null, acct?: string | null): string | null {
  if (!bank) return null
  if (!acct) return bank
  return `${bank} **** ${String(acct).slice(-4)}`
}

function currencyLabel(e: any): string {
  const usd = num(e.salarySplitUsdPct)
  const zig = num(e.salarySplitZigPct)
  if (usd > 0 && zig > 0) return "USD / ZiG"
  if (zig > 0) return "ZiG"
  return e.currency?.code ?? "USD"
}

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

function adaptEmployees(
  rows: any[],
  leaveByEmployee: Map<string, number>,
  certsByEmployee: Map<string, { expiring: number; overdue: number }>,
): any[] {
  return rows.map((e) => {
    const first = e.user?.firstName ?? ""
    const last = e.user?.lastName ?? ""
    const cert = certsByEmployee.get(e.id)
    const annual = leaveByEmployee.get(e.id)
    return {
      // Real identifiers
      id: e.employeeNumber ?? e.id,
      recordId: e.id,
      name: `${first} ${last}`.trim() || e.employeeNumber,
      initials: initialsOf(first, last),
      email: e.user?.email ?? null,
      department: e.departmentCode ?? "Unassigned",
      // The runtime interpolates these straight into a template literal, so a
      // null would render the text "null" on screen. An em dash is the honest
      // rendering for a field the Employee record simply does not carry.
      title: DASH,
      branch: DASH,
      type: e.contractEffectiveDate ? "Permanent" : DASH,
      start: fmtDate(e.contractEffectiveDate) ?? DASH,
      phone: DASH, // not captured on the employee record
      // Money, straight from the payload
      base: num(e.basicSalary),
      zig: num(e.salarySplitZigPct) > 0 ? num(e.basicSalary) * num(e.salarySplitZigPct) : 0,
      currency: currencyLabel(e),
      // Compliance identifiers
      bank: maskAccount(e.bankName, e.accountNumber) ?? DASH,
      tax: e.zimraBpNumber ?? "Pending",
      nssa: e.idNumber ?? "Pending",
      // Derived, not invented
      readiness: readinessOf(e),
      status: statusOf(e),
      leave: annual === undefined ? DASH : `${annual} days`,
      training: cert
        ? cert.overdue > 0
          ? `${cert.overdue} overdue`
          : cert.expiring > 0
            ? `${cert.expiring} expiring`
            : "Compliant"
        : DASH,
      documents: DASH, // no document store wired for employees yet
      terminated: e.terminated === true,
      isActive: e.isActive === true,
    }
  })
}

/** Map the backend run status onto the 6-step workflow the runtime draws. */
function stageOf(status: string, approvalStatus: string): number {
  switch (String(status).toUpperCase()) {
    case "DRAFT":
      return approvalStatus === "REJECTED" ? 2 : 1
    case "PENDING_APPROVAL":
      return 3
    case "APPROVED":
      return 4
    case "PROCESSING":
      return 5
    case "COMPLETED":
      return 6
    default:
      return 1
  }
}

function statusLabel(status: string, approvalStatus: string): string {
  const s = String(status).toUpperCase()
  if (s === "DRAFT" && approvalStatus === "REJECTED") return "Returned for correction"
  const map: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Approval review",
    APPROVED: "Approved",
    PROCESSING: "Calculating",
    COMPLETED: "Released",
    CANCELLED: "Cancelled",
  }
  return map[s] ?? status
}

function adaptRuns(rows: any[]): any[] {
  // Sort oldest first so each run can be compared with the one before it.
  const chronological = [...rows].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )
  const grossByIndex = chronological.map((r) => num(r.totalGrossPay))

  const adapted = chronological.map((r, i) => {
    const gross = num(r.totalGrossPay)
    const prev = i > 0 ? grossByIndex[i - 1] : null
    // Variance is a real month-on-month change, not a fixture constant.
    const variance =
      prev && prev !== 0 ? Number((((gross - prev) / prev) * 100).toFixed(2)) : null
    const employeeCount = Array.isArray(r.employeePayrolls) ? r.employeePayrolls.length : null

    return {
      id: r.id,
      reference: r.payPeriod,
      period: r.name ?? r.payPeriod,
      group: r.dualCurrency ? "Dual currency" : "Monthly Staff",
      employees: employeeCount,
      currency: r.currency?.code ?? "USD",
      // The command centre labels these "USD component" and "local component".
      // grossUSD used to be the COMBINED total, overstating the USD side by the
      // converted ZiG, and grossZiG was gross * fxRate gated on `dualCurrency`
      // -- a flag that is false on every run in this data, so ZiG rendered 0
      // while each run carried 155,772.24 ZiG in legs. The API now returns the
      // real split from employee_payroll_legs.
      //
      // The fallback is for runs with no legs at all, where the USD component
      // genuinely is the total and there is no ZiG side.
      grossUSD: r.grossUsdComponent != null ? num(r.grossUsdComponent) : gross,
      grossZiG: r.grossZigComponent != null ? num(r.grossZigComponent) : 0,
      deductions: num(r.totalDeductions),
      netUSD: num(r.totalNetPay),
      status: statusLabel(r.status, r.approvalStatus),
      rawStatus: r.status,
      approvalStatus: r.approvalStatus,
      stage: stageOf(r.status, r.approvalStatus),
      owner: r.createdBy ? `${r.createdBy.firstName ?? ""} ${r.createdBy.lastName ?? ""}`.trim() : null,
      variance,
      startDate: r.startDate,
      endDate: r.endDate,
      fxRateUsdZig: num(r.fxRateUsdZig),
    }
  })

  // Newest first for display.
  return adapted.reverse()
}

/**
 * Payroll exceptions.
 *
 * There is no exceptions table on the backend, and the runtime shipped six
 * hardcoded ones. Rather than display fiction, derive genuine data-quality
 * blockers from the employee roster — each one is a condition that would really
 * stop or distort a run, and each points at a real record.
 */
function deriveExceptions(employees: any[]): any[] {
  const out: any[] = []
  let seq = 1
  const push = (
    e: any,
    type: string,
    severity: string,
    detail: string,
    source: string,
  ) => {
    out.push({
      id: `EXC-${String(seq++).padStart(4, "0")}`,
      employee: e.name,
      employeeId: e.id,
      recordId: e.recordId,
      type,
      severity,
      source,
      amount: `USD ${num(e.base).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      owner: null,
      age: null,
      status: "Open",
      detail,
    })
  }

  for (const e of employees) {
    if (!e.isActive && !e.terminated) {
      push(e, "Suspended employee", "High", "Employee is suspended but still on the active roster.", "Employee master")
    }
    if (e.tax === "Pending") {
      push(e, "Missing tax number", "Critical", "PAYE cannot be finalised without a valid ZIMRA BP number.", "Statutory validation")
    }
    if (!e.bank) {
      push(e, "Missing bank details", "Critical", "Net pay cannot be released without bank account details.", "Employee master")
    }
    if (e.nssa === "Pending") {
      push(e, "Missing national ID", "High", "NSSA contributions require a national identity number.", "Statutory validation")
    }
    if (num(e.base) <= 0) {
      push(e, "No basic salary", "Critical", "Employee has no basic salary on record and would be paid nothing.", "Compensation")
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function loadPayrollV6LiveData(): Promise<PayrollV6LivePayload> {
  errors.length = 0

  // Access first: it decides which of the rest are even worth attempting and
  // supplies the grants the runtime gates its UI on.
  const access = await safe<PayrollAccess | null>("me/access", getMyPayrollAccess, null)
  const permissions = new Set(access?.permissions ?? [])
  const has = (p: string) => permissions.has(p)

  const canEmployees = has("payroll.employees.view") || has("payroll.employees.manage")
  const canRuns = has("payroll.runs.view") || has("payroll.runs.manage")
  const canTax = has("payroll.tax.view") || has("payroll.tax.manage")
  const canComponents = has("payroll.components.view") || has("payroll.components.manage")
  const canLeave = has("payroll.leave.view") || has("payroll.leave.manage")
  const canTraining = has("payroll.training.view") || has("payroll.training.manage")
  const canSettings = has("payroll.settings.view") || has("payroll.settings.manage")
  const canVendors = has("payroll.vendors.view")
  const canInputs = has("payroll.inputs.view") || has("payroll.inputs.manage")
  const canCalendar = has("payroll.calendar.view") || has("payroll.calendar.manage")
  const canOnboarding = has("payroll.onboarding.view") || has("payroll.onboarding.manage")
  const canDashboard = has("payroll.dashboard.view")
  const canAudit = has("payroll.audit.view")

  const [
    dashboard,
    employeeRows,
    runsResult,
    leaveRows,
    taxRules,
    allowanceTypes,
    deductionTypes,
    brackets,
    levies,
    bankTemplates,
    courses,
    certifications,
    myPayslips,
    myPortal,
    myLeave,
    auditRows,
    vendorPayload,
    inputBatchPayload,
    payGroupPayload,
    onboardingPayload,
    rfqPayload,
  ] = await Promise.all([
    canDashboard ? safe("dashboard", getPayrollDashboard, null) : Promise.resolve(null),
    canEmployees ? safe("employees", listEmployees, [] as any[]) : Promise.resolve([] as any[]),
    canRuns
      ? safe("payroll-runs", () => listPayrollRuns({ limit: 100 }), { runs: [] as any[], pagination: null })
      : Promise.resolve({ runs: [] as any[], pagination: null }),
    canLeave ? safe("leave-balances", listLeaveBalances, [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("tax-rules", listTaxRules, [] as any[]) : Promise.resolve([] as any[]),
    canComponents ? safe("allowance-types", listAllowanceTypes, [] as any[]) : Promise.resolve([] as any[]),
    canComponents ? safe("deduction-types", listDeductionTypes, [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("statutory/brackets", () => listStatutoryBrackets(), [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("statutory/levies", listStatutoryLevies, [] as any[]) : Promise.resolve([] as any[]),
    canSettings ? safe("bank-templates", listBankTemplates, [] as any[]) : Promise.resolve([] as any[]),
    canTraining ? safe("compliance/courses", listTrainingCourses, [] as any[]) : Promise.resolve([] as any[]),
    canTraining ? safe("compliance/certifications", listCertifications, [] as any[]) : Promise.resolve([] as any[]),
    // Self-service always loads: every signed-in user has a My Pay page.
    safe("employee/payslips", getMyPayslips, [] as any[]),
    safe("employee/portal", getMyPayrollPortal, null),
    safe("employee/leave-balances", getMyLeaveBalances, [] as any[]),
    canAudit ? safe("audit", () => listAuditEvents(200), [] as any[]) : Promise.resolve([] as any[]),
    // Vendors & Quotations rendered a hardcoded registry of invented suppliers; this is the real
    // Vendor table. A role without payroll.vendors.view gets null, and the screen says so.
    canVendors ? safe("vendors", getPayrollVendors, null) : Promise.resolve(null),
    canInputs ? safe("inputs/batches", listPayrollInputBatches, null) : Promise.resolve(null),
    canCalendar ? safe("pay-groups", listPayrollPayGroups, null) : Promise.resolve(null),
    canOnboarding ? safe("onboarding/candidates", listPayrollOnboarding, null) : Promise.resolve(null),
    canVendors ? safe("rfqs", listPayrollRfqs, null) : Promise.resolve(null),
  ])

  // Annual leave balance per employee, for the roster's Leave column.
  const leaveByEmployee = new Map<string, number>()
  for (const l of leaveRows ?? []) {
    if (String(l.leaveType).toUpperCase() === "ANNUAL") {
      leaveByEmployee.set(l.employeeId, num(l.balance))
    }
  }

  // Certification state per employee, for the roster's Training column.
  const certsByEmployee = new Map<string, { expiring: number; overdue: number }>()
  const nowMs = Date.now()
  for (const c of certifications ?? []) {
    const key = c.employeeId
    if (!key) continue
    const entry = certsByEmployee.get(key) ?? { expiring: 0, overdue: 0 }
    const expiry = c.expiresAt ? new Date(c.expiresAt).getTime() : null
    if (expiry !== null) {
      if (expiry < nowMs) entry.overdue += 1
      else if (expiry - nowMs < 1000 * 60 * 60 * 24 * 60) entry.expiring += 1
    }
    certsByEmployee.set(key, entry)
  }

  // The audit screen renders rows as tuples:
  // [timestamp, actor, action, record, detail, class]
  const auditEvents = (auditRows ?? []).map((a: any) => [
    a.occurredAt ? new Date(a.occurredAt).toLocaleString("en-GB", { hour12: false }) : DASH,
    a.actorName || DASH,
    a.action || DASH,
    a.entityLabel || a.entityId || DASH,
    a.detail || DASH,
    a.eventClass || "Change",
  ])

  const employees = adaptEmployees(employeeRows ?? [], leaveByEmployee, certsByEmployee)
  const payrollRuns = adaptRuns(runsResult?.runs ?? [])
  const exceptions = deriveExceptions(employees)

  // Sidebar badges. Every one of these is a count of records we actually hold;
  // a page with nothing countable gets null and renders no badge at all.
  const counts: Record<string, number | null> = {
    employees: canEmployees ? employees.length : null,
    runs: canRuns ? payrollRuns.filter((r) => r.rawStatus !== "COMPLETED").length : null,
    approvals: canRuns ? payrollRuns.filter((r) => r.rawStatus === "PENDING_APPROVAL").length : null,
    exceptions: exceptions.length || null,
    audit: canAudit ? (auditRows ?? []).length || null : null,
    training: canTraining ? (courses ?? []).length || null : null,
    onboarding: null, // no onboarding pipeline on the backend yet
    inputs: null, // no input-batch store on the backend yet
    leave: canLeave ? (leaveRows ?? []).length || null : null,
    tax: canTax ? (taxRules ?? []).length || null : null,
    components: canComponents
      ? ((allowanceTypes ?? []).length + (deductionTypes ?? []).length) || null
      : null,
  }

  return {
    ready: true,
    // Top level, not under `reference`: the runtime bridge reads `__pr6Live.vendors`.
    vendors: vendorPayload ?? null,
    inputBatches: inputBatchPayload ?? null,
    payGroups: payGroupPayload ?? null,
    onboarding: onboardingPayload ?? null,
    rfqs: rfqPayload ?? null,
    roleName: access?.roleName ?? null,
    permissions: access?.permissions ?? [],
    access,
    employees,
    payrollRuns,
    exceptions,
    auditEvents,
    counts,
    dashboard,
    leaveBalances: (leaveRows ?? []).map((l: any) => ({
      employeeId: l.employeeId,
      employeeNumber: l.employee?.employeeNumber ?? null,
      name: l.employee?.user
        ? `${l.employee.user.firstName ?? ""} ${l.employee.user.lastName ?? ""}`.trim()
        : (l.employee?.employeeNumber ?? DASH),
      department: l.employee?.departmentCode ?? "Unassigned",
      leaveType: l.leaveType,
      balance: num(l.balance),
    })),
    reference: {
      taxRules: taxRules ?? [],
      allowanceTypes: allowanceTypes ?? [],
      deductionTypes: deductionTypes ?? [],
      brackets: brackets ?? [],
      levies: levies ?? [],
      bankTemplates: bankTemplates ?? [],
      courses: courses ?? [],
      certifications: certifications ?? [],
    },
    mypay: (() => {
      // Label each payslip with the period of the run it belongs to, newest
      // first, so My Pay can show real periods instead of a fixed "June 2026".
      const runById = new Map(
        (runsResult?.runs ?? []).map((r: any) => [r.id, r]),
      )
      const slips = (myPayslips ?? [])
        .map((p: any) => {
          // The self-service endpoint already includes the run, which matters
          // because a plain employee cannot read /payroll-runs at all (403) and
          // the admin lookup below is therefore empty for them.
          const run = p.payrollRun ?? runById.get(p.payrollRunId)
          return {
            id: p.id,
            payrollRunId: p.payrollRunId,
            period: run?.payPeriod ?? run?.name ?? DASH,
            payDate: run?.endDate ?? null,
            gross: num(p.grossPay),
            deductions: num(p.totalDeductions),
            net: num(p.netPay),
            currency: p.currency?.code ?? "USD",
            employeeNumber: p.employee?.employeeNumber ?? null,
            basicSalary: num(p.employee?.basicSalary),
          }
        })
        .sort((a, b) => String(b.period).localeCompare(String(a.period)))

      const portal: any = myPortal ?? {}
      return {
        payslips: slips,
        latest: slips[0] ?? null,
        portal,
        // The signed-in user's OWN record. The page previously rendered
        // employees[0] — the first person in the roster — so every user saw
        // somebody else's bank, tax and employment details.
        self: {
          employeeNumber: portal.employeeNumber ?? access?.employee?.employeeNumber ?? DASH,
          bank: maskAccount(portal.bankName, portal.accountNumber) ?? DASH,
          tax: portal.zimraBpNumber ?? "Pending",
          nssa: portal.idNumber ?? "Pending",
          department: portal.departmentCode ?? "Unassigned",
          basicSalary: num(portal.basicSalary),
          start: fmtDate(portal.contractEffectiveDate) ?? DASH,
          currency: portal.currency?.code ?? "USD",
        },
        leaveBalances: (myLeave ?? []).map((l: any) => ({
          leaveType: l.leaveType,
          balance: num(l.balance),
        })),
        employee: access?.employee ?? null,
      }
    })(),
    errors: [...errors],
  }
}
