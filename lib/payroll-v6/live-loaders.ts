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
  getPayrollRun,
  listEmployees,
  listPayrollRuns,
  listLeaveBalances,
  listLeaveBalanceEmployees,
  listTaxRules,
  listPayrollCurrencies,
  listPayrollComponentAccounts,
  listPayrollComponentEmployees,
  listStatutoryMappings,
  listAllowanceTypes,
  listDeductionTypes,
  listStatutoryBrackets,
  listStatutoryLevies,
  listBankTemplates,
  listTrainingCourses,
  listTrainingAssignments,
  listTrainingAssignmentAudienceOptions,
  listCertifications,
  getMyPayslips,
  getMyPayrollPortal,
  getMyLeaveBalances,
  listAuditEvents,
  type PayrollAccess,
  type PayrollAuditPage,
  getPayrollVendors,
  listPayrollInputBatches,
  listPayrollPayGroups,
  listPayrollOnboarding,
  listPayrollRfqs,
  getPayrollAccessRoster,
  listPayrollDocuments,
  listPayrollReports,
} from "@/lib/api/payroll-v6-api"

export type LoaderError = { source: string; message: string; status?: number }

export type PayrollV6LivePayload = {
  ready: boolean
  roleName: string | null
  permissions: string[]
  access: PayrollAccess | null
  /** The access call itself failed — not the same as holding no permissions. */
  accessUnavailable: boolean
  employees: any[]
  payrollRuns: any[]
  /** Totals from the latest completed single-currency run detail. */
  componentMix: Record<string, any> | null
  exceptions: any[]
  exceptionStats?: { employeesChecked: number; employeesWithoutFindings: number } | null
  auditEvents: any[]
  auditData?: PayrollAuditPage | null
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
  /** Payroll access register: users, role matrix and the enforced segregation rule. */
  accessRoster: Record<string, any> | null
  /** Document register in the runtime row shape; [] when the role cannot see the vault. */
  documents: any[]
  reports: Record<string, any> | null
  /** "All documents" followed by the categories the backend accepts. */
  folders: string[]
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

/**
 * Stored picture URLs are absolute and carry whichever host the API was configured with when the file was
 * uploaded. Re-root the `/api/public-media/...` part on the API this app actually talks to, so a photo loads
 * from the same backend the rest of the page does (dev, staging and prod all serve it).
 */
function mediaUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null
  const url = raw.trim()
  const marker = "/public-media/"
  const at = url.indexOf(marker)
  if (at === -1) return url
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api").replace(/\/+$/, "")
  return `${base}${marker}${url.slice(at + marker.length)}`
}

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
    const basicSalary = num(e.basicSalary)
    const usdPct = num(e.salarySplitUsdPct)
    const zigPct = num(e.salarySplitZigPct)
    const currencyCode = String(e.currency?.code || "USD").toUpperCase()
    return {
      // Real identifiers
      id: e.employeeNumber ?? e.id,
      employeeNumber: e.employeeNumber ?? null,
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
      base: basicSalary,
      baseUSD: usdPct > 0 ? basicSalary * usdPct : zigPct > 0 || currencyCode === "ZIG" ? 0 : basicSalary,
      baseZiG: zigPct > 0 ? basicSalary * zigPct : currencyCode === "ZIG" ? basicSalary : 0,
      zig: zigPct > 0 ? basicSalary * zigPct : 0,
      currencyCode,
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
      // The employee's own uploaded photo, or null: the runtime then draws their initials. It used to draw one
      // stock portrait for everyone without a hardcoded one.
      photo: mediaUrl(e.pictureUrl ?? e.picture),
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

async function listAllPayrollRuns() {
  const pageSize = 100
  const first = await listPayrollRuns({ page: 1, limit: pageSize })
  const pageCount = Math.max(1, Number(first.pagination?.pages) || 1)
  if (pageCount === 1) return first
  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      listPayrollRuns({ page: index + 2, limit: pageSize }),
    ),
  )
  return {
    runs: [...first.runs, ...remaining.flatMap((page) => page.runs)],
    pagination: first.pagination,
  }
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
    // The run-register list endpoint doesn't hydrate the `employeePayrolls` relation (too expensive for a list) —
    // it sends a Prisma `_count` instead. Only the single-run detail endpoint carries the real array. Checking
    // just the array left every row in the register reading `employees: null`, rendered as the literal text
    // "null" (found live: every run on Payroll Runs showed "Employees: null", not just an empty draft).
    const employeeCount = Array.isArray(r.employeePayrolls)
      ? r.employeePayrolls.length
      : (r._count?.employeePayrolls ?? null)

    return {
      id: r.id,
      reference: r.payPeriod,
      period: r.payPeriod ?? r.name,
      // PayrollRun stores its human-entered title in `name`; it does not have a
      // separate pay-group relation. Preserve that API title instead of
      // labelling every non-dual run "Monthly Staff".
      group: r.name ?? (r.dualCurrency ? "Dual currency" : "Monthly Staff"),
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
      // The run endpoint includes totals grouped from employee_payroll_legs.
      // Keep those currency-specific net and deduction amounts so dashboard
      // filters never relabel an aggregate USD equivalent as local currency.
      currencyComponents: r.currencyComponents ?? null,
      deductions: num(r.totalDeductions),
      netUSD: num(r.totalNetPay),
      grossTotal: num(r.totalGrossPay),
      netTotal: num(r.totalNetPay),
      payslips: r._count?.payslips == null ? null : num(r._count.payslips),
      journalEntryId: r.journalEntryId ?? null,
      processError: r.processError ?? null,
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
      employeeId: e.employeeNumber ?? "Employee number unavailable",
      recordId: e.recordId,
      type,
      severity,
      source,
      sourceData: {
        department: e.department ?? DASH,
        employeeStatus: e.status ?? DASH,
        taxNumberPresent: Boolean(e.tax && e.tax !== "Pending"),
        nationalIdPresent: Boolean(e.nssa && e.nssa !== "Pending"),
        bankDetailsComplete: Boolean(e.bank && e.bank !== DASH),
        salaryConfigured: num(e.base) > 0,
      },
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

  // safe() records the failure and hands back the fallback, so a failed access
  // call and a user holding no grants both arrive here as an empty permission
  // set. FINDING-013: that made every payroll screen render "You do not have
  // access to this page" during an outage, to accounts holding all 34 grants.
  // The distinction is carried rather than collapsed; the runtime shows a
  // different panel for it.
  const accessUnavailable = access === null && errors.some((e) => e.source === "me/access")

  const permissions = new Set(access?.permissions ?? [])
  const has = (p: string) => permissions.has(p)

  const canEmployees = has("payroll.employees.view") || has("payroll.employees.manage")
  const canExceptions = has("payroll.exceptions.view") || has("payroll.exceptions.manage")
  const canRuns = has("payroll.runs.view") || has("payroll.runs.manage")
  const canTax = has("payroll.tax.view") || has("payroll.tax.manage")
  const canComponents = has("payroll.components.view") || has("payroll.components.manage")
  const canLeave = has("payroll.leave.view") || has("payroll.leave.manage")
  const canManageLeave = has("payroll.leave.manage")
  const canTraining = has("payroll.training.view") || has("payroll.training.manage")
  const canSettings = has("payroll.settings.view") || has("payroll.settings.manage")
  const canVendors = has("payroll.vendors.view")
  const canInputs = has("payroll.inputs.view") || has("payroll.inputs.manage")
  const canCalendar = has("payroll.calendar.view") || has("payroll.calendar.manage")
  const canOnboarding = has("payroll.onboarding.view") || has("payroll.onboarding.manage")
  const canDashboard = has("payroll.dashboard.view")
  const canAudit = has("payroll.audit.view")
  const canAccessRegister = has("payroll.access.view") || has("payroll.access.manage")
  const canVault = has("payroll.vault.view") || has("payroll.vault.manage")
  const canReports = has("payroll.reports.view") || has("payroll.reports.manage")

  const [
    dashboard,
    employeeRows,
    runsResult,
    leaveRows,
    leaveEmployeeRows,
    taxRules,
    currencies,
    componentAccounts,
    componentEmployees,
    statutoryMappings,
    allowanceTypes,
    deductionTypes,
    brackets,
    levies,
    bankTemplates,
    courses,
    trainingAssignments,
    trainingAudienceOptions,
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
    rosterPayload,
    documentPayload,
    reportsPayload,
  ] = await Promise.all([
    canDashboard ? safe("dashboard", getPayrollDashboard, null) : Promise.resolve(null),
    canEmployees ? safe("employees", listEmployees, [] as any[]) : Promise.resolve([] as any[]),
    canRuns
      ? safe("payroll-runs", listAllPayrollRuns, { runs: [] as any[], pagination: null })
      : Promise.resolve({ runs: [] as any[], pagination: null }),
    canLeave ? safe("leave-balances", listLeaveBalances, [] as any[]) : Promise.resolve([] as any[]),
    canManageLeave ? safe("leave-balance-employee-options", listLeaveBalanceEmployees, [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("tax-rules", listTaxRules, [] as any[]) : Promise.resolve([] as any[]),
    canTax || canComponents || canSettings ? safe("accounting/currencies", listPayrollCurrencies, [] as any[]) : Promise.resolve([] as any[]),
    canTax || canComponents ? safe("component-accounts", listPayrollComponentAccounts, [] as any[]) : Promise.resolve([] as any[]),
    has("payroll.components.manage") ? safe("component-employees", listPayrollComponentEmployees, [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("statutory/mappings", listStatutoryMappings, [] as any[]) : Promise.resolve([] as any[]),
    canComponents ? safe("allowance-types", listAllowanceTypes, [] as any[]) : Promise.resolve([] as any[]),
    canComponents ? safe("deduction-types", listDeductionTypes, [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("statutory/brackets", () => listStatutoryBrackets(), [] as any[]) : Promise.resolve([] as any[]),
    canTax ? safe("statutory/levies", listStatutoryLevies, [] as any[]) : Promise.resolve([] as any[]),
    canSettings ? safe("bank-templates", listBankTemplates, [] as any[]) : Promise.resolve([] as any[]),
    canTraining ? safe("compliance/courses", listTrainingCourses, [] as any[]) : Promise.resolve([] as any[]),
    canTraining ? safe("compliance/assignments", listTrainingAssignments, [] as any[]) : Promise.resolve([] as any[]),
    canTraining ? safe("compliance/assignments/audience-options", listTrainingAssignmentAudienceOptions, { departments: [], roles: [], employees: [] }) : Promise.resolve({ departments: [], roles: [], employees: [] }),
    canTraining ? safe("compliance/certifications", listCertifications, [] as any[]) : Promise.resolve([] as any[]),
    // Self-service always loads: every signed-in user has a My Pay page.
    safe("employee/payslips", getMyPayslips, [] as any[]),
    safe("employee/portal", getMyPayrollPortal, null),
    safe("employee/leave-balances", getMyLeaveBalances, [] as any[]),
    canAudit ? safe("audit", () => listAuditEvents({ page: 1, limit: 20 }), { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, stats: { total: 0, approvals: 0, changes: 0, accesses: 0, releases: 0, security: 0, sensitive: 0, actors: 0 } } as PayrollAuditPage) : Promise.resolve({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, stats: { total: 0, approvals: 0, changes: 0, accesses: 0, releases: 0, security: 0, sensitive: 0, actors: 0 } } as PayrollAuditPage),
    // Vendors & Quotations rendered a hardcoded registry of invented suppliers; this is the real
    // Vendor table. A role without payroll.vendors.view gets null, and the screen says so.
    canVendors ? safe("vendors", getPayrollVendors, null) : Promise.resolve(null),
    canInputs ? safe("inputs/batches", listPayrollInputBatches, null) : Promise.resolve(null),
    canCalendar ? safe("pay-groups", listPayrollPayGroups, null) : Promise.resolve(null),
    canOnboarding ? safe("onboarding/candidates", listPayrollOnboarding, null) : Promise.resolve(null),
    canVendors ? safe("rfqs", listPayrollRfqs, null) : Promise.resolve(null),
    canAccessRegister ? safe("access/roster", getPayrollAccessRoster, null) : Promise.resolve(null),
    canVault ? safe("documents", listPayrollDocuments, null) : Promise.resolve(null),
    canReports ? safe("reports", () => listPayrollReports({ page: 1, limit: 10 }), null) : Promise.resolve(null),
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
  const auditEvents = (auditRows?.items ?? []).map((a: any) => [
    a.occurredAt ? new Date(a.occurredAt).toLocaleString("en-GB", { hour12: false }) : DASH,
    a.actorName || DASH,
    a.action || DASH,
    a.entityLabel || a.entityId || DASH,
    a.detail || DASH,
    a.eventClass || "Change",
  ])

  const employees = adaptEmployees(employeeRows ?? [], leaveByEmployee, certsByEmployee)
  const payrollRuns = adaptRuns(runsResult?.runs ?? [])
  // Monthly composition must come from calculated employee-payroll rows, not
  // from employee master salary totals. Prefer the latest completed run; its
  // native currency legs are returned by the run-detail API.
  const compositionRun = canComponents && canRuns
    ? (runsResult?.runs ?? []).find((run: any) => String(run.status || "").toUpperCase() === "COMPLETED")
    : null
  const compositionDetail = compositionRun
    ? await safe("component-composition", () => getPayrollRun(compositionRun.id), null)
    : null
  const compositionRows: any[] = Array.isArray((compositionDetail as any)?.employeePayrolls)
    ? (compositionDetail as any).employeePayrolls
    : []
  const componentMix = compositionRows.length
    ? {
        period: String((compositionDetail as any).payPeriod || compositionRun?.payPeriod || ""),
        currencyCode: String((compositionDetail as any).currency?.code || compositionRun?.currency?.code || "USD").toUpperCase(),
        basic: compositionRows.reduce((sum, row) => sum + Number(row.basicSalary || 0), 0),
        allowances: compositionRows.reduce((sum, row) => sum + Number(row.totalAllowances || 0), 0),
        gross: compositionRows.reduce((sum, row) => sum + Number(row.grossPay || 0), 0),
        deductions: compositionRows.reduce((sum, row) => sum + Number(row.totalDeductions || 0), 0),
        net: compositionRows.reduce((sum, row) => sum + Number(row.netPay || 0), 0),
        deductionsByCurrency: compositionRows.reduce((totals, row) => {
          for (const leg of Array.isArray(row.legs) ? row.legs : []) {
            const code = String(leg.currencyCode || "").toUpperCase()
            if (code === "USD" || code === "ZIG") totals[code] = (totals[code] || 0) + Number(leg.totalDeductions || 0)
          }
          return totals
        }, {} as Record<string, number>),
        employeeCount: compositionRows.length,
      }
    : null
  const exceptions = deriveExceptions(employees)
  const flaggedEmployeeIds = new Set(exceptions.map((e) => e.recordId || e.employeeId).filter(Boolean))
  const exceptionStats = canExceptions && canEmployees
    ? { employeesChecked: employees.length, employeesWithoutFindings: Math.max(0, employees.length - flaggedEmployeeIds.size) }
    : null

  // The vault renders rows as {id, name, folder, owner, modified, class, ...}. Only what the
  // backend holds is filled in; nothing is defaulted to resemble a versioning or approval
  // workflow the vault does not have. A role that cannot see the vault gets an empty
  // register, never the runtime's fixture one (FINDING-017).
  const classLabel = (c: unknown) => {
    const s = String(c ?? "").toLowerCase().split("_").join(" ")
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : DASH
  }
  const vaultDocuments = ((documentPayload as any)?.items ?? []).map((d: any) => ({
    id: d.id,
    // Never expose a database key as a human-facing document reference.
    reference: d.reference ?? null,
    name: d.name,
    folder: d.category,
    type: d.mimeType ?? "File",
    owner: d.uploadedBy?.name ?? DASH,
    modified: d.createdAt
      ? new Date(d.createdAt).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
        })
      : DASH,
    createdAt: d.createdAt ?? null,
    class: classLabel(d.classification),
    classification: d.classification,
    periodLabel: d.periodLabel ?? null,
    run: d.payrollRun?.name ?? null,
    sizeBytes: d.fileSizeBytes ?? null,
  }))
  const vaultFolders = ["All documents", ...(((documentPayload as any)?.categories as string[] | undefined) ?? [])]

  // Sidebar badges. Every one of these is a count of records we actually hold;
  // a page with nothing countable gets null and renders no badge at all.
  const counts: Record<string, number | null> = {
    employees: canEmployees ? employees.length : null,
    runs: canRuns ? payrollRuns.filter((r) => r.rawStatus !== "COMPLETED").length : null,
    approvals: canRuns ? payrollRuns.filter((r) => r.rawStatus === "PENDING_APPROVAL").length : null,
    exceptions: canExceptions && canEmployees ? exceptions.length || null : null,
    audit: canAudit ? Number(auditRows?.stats?.total) || null : null,
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
    accessUnavailable,
    // Top level, not under `reference`: the runtime bridge reads `__pr6Live.vendors`.
    vendors: vendorPayload ?? null,
    inputBatches: inputBatchPayload ?? null,
    payGroups: payGroupPayload ?? null,
    onboarding: onboardingPayload ?? null,
    rfqs: rfqPayload ?? null,
    accessRoster: rosterPayload ?? null,
    documents: vaultDocuments,
    reports: reportsPayload ?? null,
    folders: vaultFolders,
    roleName: access?.roleName ?? null,
    permissions: access?.permissions ?? [],
    access,
    employees: canEmployees ? employees : [],
    payrollRuns,
    componentMix,
    exceptions: canExceptions && canEmployees ? exceptions : [],
    exceptionStats,
    auditEvents,
    auditData: canAudit ? auditRows : null,
    counts,
    dashboard,
    leaveBalances: (leaveRows ?? []).map((l: any) => ({
      id: l.id,
      employeeId: l.employeeId,
      employeeNumber: l.employee?.employeeNumber ?? null,
      name: l.employee?.user
        ? `${l.employee.user.firstName ?? ""} ${l.employee.user.lastName ?? ""}`.trim()
        : (l.employee?.employeeNumber ?? DASH),
      department: l.employee?.departmentCode ?? "Unassigned",
      leaveType: l.leaveType,
      balance: num(l.balance),
      currencyCode: l.currency?.code ?? null,
    })),
    reference: {
      leaveEmployees: (leaveEmployeeRows ?? []).map((e: any) => ({
        id: e.id,
        employeeNumber: e.employeeNumber,
        name: `${e.user?.firstName ?? ""} ${e.user?.lastName ?? ""}`.trim() || e.employeeNumber,
        department: e.departmentCode ?? "Unassigned",
      })),
      taxRules: taxRules ?? [],
      currencies: currencies ?? [],
      componentAccounts: componentAccounts ?? [],
      componentEmployees: componentEmployees ?? [],
      statutoryMappings: statutoryMappings ?? [],
      allowanceTypes: allowanceTypes ?? [],
      deductionTypes: deductionTypes ?? [],
      brackets: brackets ?? [],
      levies: levies ?? [],
      bankTemplates: bankTemplates ?? [],
      courses: courses ?? [],
      trainingAssignments: trainingAssignments ?? [],
      trainingAudienceOptions: trainingAudienceOptions ?? { departments: [], roles: [], employees: [] },
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
          name: [access?.employee?.user?.firstName ?? portal.user?.firstName ?? portal.firstName, access?.employee?.user?.lastName ?? portal.user?.lastName ?? portal.lastName].filter(Boolean).join(" ") || portal.employeeNumber || "Employee",
          employeeNumber: portal.employeeNumber ?? access?.employee?.employeeNumber ?? DASH,
          bank: maskAccount(portal.bankName, portal.accountNumber) ?? DASH,
          tax: portal.zimraBpNumber ?? "Pending",
          nssa: portal.idNumber ?? "Pending",
          department: portal.departmentCode ?? "Unassigned",
          position: portal.position ?? portal.jobTitle ?? DASH,
          employmentType: portal.employmentType ?? DASH,
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
