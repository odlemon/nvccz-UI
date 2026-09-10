/**
 * Payroll V6 API client.
 *
 * Backend route contract (nvccz, mounted at /api/payroll — see
 * src/routes/payrollRoutes.ts, payrollDashboardRoutes.ts,
 * payrollComplianceRoutes.ts):
 *
 *   GET    /payroll/me/access                            effective grants + own employee record
 *   GET    /payroll/dashboard                            command-centre metrics and trends
 *   GET    /payroll/employees                            employee roster
 *   POST   /payroll/employees                            create employee
 *   POST   /payroll/employees/with-user                  create employee + user account
 *   PUT    /payroll/employees/:id                        update employee
 *   POST   /payroll/employees/:id/terminate|suspend|reinstate
 *   GET    /payroll/payroll-runs                         run register (paginated)
 *   POST   /payroll/payroll-runs                         create run
 *   GET    /payroll/payroll-runs/:id                     run summary + employee payrolls
 *   POST   /payroll/payroll-runs/:id/submit-for-approval
 *   POST   /payroll/payroll-runs/:id/approve|reject      checker side
 *   POST   /payroll/payroll-runs/:id/process             calculates pay, generates payslips
 *   POST   /payroll/payroll-runs/:id/payment
 *   POST   /payroll/payroll-runs/:id/bank-file           needs bankTemplateId
 *   GET    /payroll/payslips/:employeeId/:payrollRunId   administrative payslip read
 *   GET    /payroll/employee/portal|payslips|leave-balances   self-service (any signed-in user)
 *   GET/POST/PUT/DELETE /payroll/tax-rules, /allowance-types, /deduction-types,
 *                       /statutory/brackets, /statutory/levies, /salary-structures,
 *                       /leave-balances, /bank-templates
 *   GET    /payroll/compliance/courses|assignments|certifications|dashboard/expiring
 *   GET    /payroll/audit                                  payroll audit trail, newest first
 *
 * Authorisation: every route except the `/employee/*` self-service group and
 * `/me/access` is guarded by a payroll.* permission. A 403 here means the
 * signed-in role lacks the grant, not that the endpoint is broken — surface it,
 * do not swallow it.
 *
 * NOTE: lib/api/payroll-api.ts is the LEGACY module's client and is consumed by
 * the frozen `payroll` module. Nothing here modifies it.
 *
 * Spec: design-refs/payroll-v6-backend-asks.md
 */
import { apiClient, type ApiResponse } from "@/lib/api/api-client"
import { toast } from "sonner"

/** Strip the {success, data} envelope the backend wraps most payloads in. */
export function unwrapData<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "success" in (res as object) && "data" in (res as object)) {
    return (res as ApiResponse<T>).data as T
  }
  return res as T
}

type ErrorBody = { status?: number; message?: string; error?: string; code?: string }

function readError(err: unknown): ErrorBody {
  const anyErr = err as any
  const status = anyErr?.status ?? anyErr?.response?.status
  const body = anyErr?.data ?? anyErr?.response?.data ?? {}
  return {
    status,
    message: body?.message ?? anyErr?.message,
    error: body?.error,
    code: body?.code,
  }
}

/**
 * Map a payroll API failure onto a toast the user can act on.
 * A 403 is reported as a permission problem rather than a generic failure —
 * a control that silently does nothing is the defect we are trying to avoid.
 */
export function toastPayrollError(err: unknown, fallback = "Request failed"): ErrorBody {
  const body = readError(err)

  if (body.status === 403) {
    toast.error("Not permitted", {
      description:
        body.message ||
        "Your role does not have the payroll permission required for this action.",
      duration: 7000,
    })
    return body
  }
  if (body.status === 401) {
    toast.error("Session expired", { description: "Sign in again to continue." })
    return body
  }
  if (body.status === 400) {
    toast.error(body.message || fallback, { description: body.error, duration: 8000 })
    return body
  }

  toast.error(body.message || fallback, { description: body.error, duration: 7000 })
  return body
}

const BASE = "/payroll"

// ---------------------------------------------------------------------------
// Types (shapes verified against live responses, not assumed)
// ---------------------------------------------------------------------------

export type PayrollAccess = {
  userId: string
  email: string
  roleName: string | null
  roleCode: string | null
  permissions: string[]
  employee: {
    id: string
    employeeNumber: string
    departmentCode: string | null
    isActive: boolean
    terminated: boolean
  } | null
}

export type PayrollEmployee = Record<string, any>
export type PayrollRun = Record<string, any>
export type Payslip = Record<string, any>

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export async function getMyPayrollAccess(): Promise<PayrollAccess> {
  const res = await apiClient.get<ApiResponse<PayrollAccess>>(`${BASE}/me/access`)
  return unwrapData(res)
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getPayrollDashboard(params?: {
  month?: number
  year?: number
  currencyId?: string
}): Promise<Record<string, any>> {
  const q = new URLSearchParams()
  if (params?.month) q.set("month", String(params.month))
  if (params?.year) q.set("year", String(params.year))
  if (params?.currencyId) q.set("currencyId", params.currencyId)
  const qs = q.toString()
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/dashboard${qs ? `?${qs}` : ""}`)
  return unwrapData(res)
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export async function listEmployees(): Promise<PayrollEmployee[]> {
  const res = await apiClient.get<ApiResponse<PayrollEmployee[]>>(`${BASE}/employees`)
  return unwrapData(res) ?? []
}

export async function createEmployee(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<PayrollEmployee>>(`${BASE}/employees`, body)
  return unwrapData(res)
}

/**
 * Create the employee AND the user account behind it.
 *
 * Employee.userId is required and unique, so a plain POST /employees cannot be
 * driven from a form that has no user id. This provisions both in one
 * transaction; no password is sent or returned.
 */
export async function createEmployeeWithUser(body: {
  firstName: string
  lastName: string
  email: string
  employeeNumber: string
  departmentCode?: string | null
  basicSalary: number | string
  currencyId?: string | null
  bankName?: string | null
  branchCode?: string | null
  accountNumber?: string | null
  idNumber?: string | null
  zimraBpNumber?: string | null
}) {
  const res = await apiClient.post<ApiResponse<PayrollEmployee>>(
    `${BASE}/employees/with-user`,
    body,
  )
  return unwrapData(res)
}

export async function updateEmployee(id: string, body: Record<string, any>) {
  const res = await apiClient.put<ApiResponse<PayrollEmployee>>(`${BASE}/employees/${id}`, body)
  return unwrapData(res)
}

export async function terminateEmployee(id: string, body: Record<string, any> = {}) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/employees/${id}/terminate`, body)
  return unwrapData(res)
}

export async function suspendEmployee(id: string, body: Record<string, any> = {}) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/employees/${id}/suspend`, body)
  return unwrapData(res)
}

export async function reinstateEmployee(id: string, body: Record<string, any> = {}) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/employees/${id}/reinstate`, body)
  return unwrapData(res)
}

// ---------------------------------------------------------------------------
// Payroll runs
// ---------------------------------------------------------------------------

export async function listPayrollRuns(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams()
  q.set("page", String(params?.page ?? 1))
  q.set("limit", String(params?.limit ?? 100))
  const res = await apiClient.get<ApiResponse<PayrollRun[]>>(`${BASE}/payroll-runs?${q}`)
  return { runs: unwrapData(res) ?? [], pagination: (res as any)?.pagination ?? null }
}

export async function getPayrollRun(id: string): Promise<PayrollRun> {
  const res = await apiClient.get<ApiResponse<PayrollRun>>(`${BASE}/payroll-runs/${id}`)
  return unwrapData(res)
}

export async function createPayrollRun(body: {
  name: string
  payPeriod: string
  startDate: string
  endDate: string
  currencyId?: string | null
  dualCurrency?: boolean
}) {
  const res = await apiClient.post<ApiResponse<PayrollRun>>(`${BASE}/payroll-runs`, body)
  return unwrapData(res)
}

export async function submitRunForApproval(id: string) {
  const res = await apiClient.post<ApiResponse<PayrollRun>>(
    `${BASE}/payroll-runs/${id}/submit-for-approval`,
  )
  return unwrapData(res)
}

export async function approveRun(id: string) {
  const res = await apiClient.post<ApiResponse<PayrollRun>>(`${BASE}/payroll-runs/${id}/approve`)
  return unwrapData(res)
}

export async function rejectRun(id: string, reason?: string) {
  const res = await apiClient.post<ApiResponse<PayrollRun>>(`${BASE}/payroll-runs/${id}/reject`, {
    reason,
  })
  return unwrapData(res)
}

export async function processRun(id: string) {
  const res = await apiClient.post<ApiResponse<PayrollRun>>(`${BASE}/payroll-runs/${id}/process`)
  return unwrapData(res)
}

export async function recordRunPayment(id: string, body: Record<string, any> = {}) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/payroll-runs/${id}/payment`, body)
  return unwrapData(res)
}

/**
 * Returns the bank batch as CSV text, not JSON.
 *
 * responseType 'text' is required: the default path calls response.json() and
 * throws ApiError("Invalid response format") on the CSV body, which surfaced as
 * an error toast even though the request had succeeded with a 200.
 */
export async function generateBankFile(id: string, bankTemplateId: string): Promise<string> {
  return apiClient.post<string>(
    `${BASE}/payroll-runs/${id}/bank-file`,
    { bankTemplateId },
    { responseType: "text" },
  )
}

// ---------------------------------------------------------------------------
// Payslips
// ---------------------------------------------------------------------------

export async function getPayslip(employeeId: string, payrollRunId: string): Promise<Payslip> {
  const res = await apiClient.get<ApiResponse<Payslip>>(
    `${BASE}/payslips/${employeeId}/${payrollRunId}`,
  )
  return unwrapData(res)
}

// ---------------------------------------------------------------------------
// Employee self-service (no payroll grant required — scoped to the caller)
// ---------------------------------------------------------------------------

export async function getMyPayrollPortal(): Promise<Record<string, any>> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/employee/portal`)
  return unwrapData(res)
}

export async function getMyPayslips(): Promise<Payslip[]> {
  const res = await apiClient.get<ApiResponse<Payslip[]>>(`${BASE}/employee/payslips`)
  return unwrapData(res) ?? []
}

export async function getMyLeaveBalances(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/employee/leave-balances`)
  return unwrapData(res) ?? []
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export async function listTaxRules(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/tax-rules`)
  return unwrapData(res) ?? []
}

export async function listStatutoryBrackets(currencyCode?: string) {
  const qs = currencyCode ? `?currencyCode=${encodeURIComponent(currencyCode)}` : ""
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/statutory/brackets${qs}`)
  return unwrapData(res) ?? []
}

export async function listStatutoryLevies() {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/statutory/levies`)
  return unwrapData(res) ?? []
}

export async function listAllowanceTypes(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/allowance-types`)
  return unwrapData(res) ?? []
}

export async function listDeductionTypes(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/deduction-types`)
  return unwrapData(res) ?? []
}

export async function listLeaveBalances(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/leave-balances`)
  return unwrapData(res) ?? []
}

/**
 * Supplier registry for the Vendors & Quotations screen. Reads the real `Vendor` table; the screen
 * previously rendered a hardcoded fixture of invented companies.
 */
export async function getPayrollVendors(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/vendors`)
  return unwrapData(res) ?? null
}

/**
 * The four domains that had no backend until now — Inputs & Validation, Pay Groups & Calendar,
 * Onboarding and the RFQ half of Vendors. Each screen previously rendered the runtime's fixtures.
 */
export async function listPayrollInputBatches(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/inputs/batches`)
  return unwrapData(res) ?? null
}

export async function listPayrollPayGroups(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/pay-groups`)
  return unwrapData(res) ?? null
}

export async function listPayrollOnboarding(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/onboarding/candidates`)
  return unwrapData(res) ?? null
}

export async function listPayrollRfqs(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/rfqs`)
  return unwrapData(res) ?? null
}

export async function listBankTemplates(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/bank-templates`)
  return unwrapData(res) ?? []
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export type PayrollAuditEvent = {
  id: string
  occurredAt: string
  actorUserId: string | null
  actorName: string | null
  actorRole: string | null
  action: string
  eventClass: string
  entityType: string | null
  entityId: string | null
  entityLabel: string | null
  detail: string | null
}

/** Newest first. Requires payroll.audit.view. */
export async function listAuditEvents(limit = 100): Promise<PayrollAuditEvent[]> {
  const res = await apiClient.get<ApiResponse<PayrollAuditEvent[]>>(
    `${BASE}/audit?limit=${limit}`,
  )
  return unwrapData(res) ?? []
}

// ---------------------------------------------------------------------------
// Training & compliance
// ---------------------------------------------------------------------------

export async function listTrainingCourses(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/compliance/courses`)
  return unwrapData(res) ?? []
}

export async function listCertifications(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/compliance/certifications`)
  return unwrapData(res) ?? []
}

export async function getExpiringCertifications(): Promise<Record<string, any>> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/compliance/dashboard/expiring`)
  return unwrapData(res)
}
