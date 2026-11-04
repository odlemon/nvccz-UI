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
export async function createEmployeeWithUser(body: FormData | {
  firstName: string
  lastName: string
  email: string
  employeeNumber: string
  departmentCode?: string | null
  position?: string | null
  basicSalary: number | string
  currencyId?: string | null
  contractEffectiveDate?: string | null
  salarySplitUsdPct?: number
  salarySplitZigPct?: number
  bankName?: string | null
  branchCode?: string | null
  accountNumber?: string | null
  idNumber?: string | null
  zimraBpNumber?: string | null
}) {
  // A FormData body carries the optional `picture` file; the route parses multipart and JSON alike.
  const res =
    body instanceof FormData
      ? await apiClient.postFormData<ApiResponse<PayrollEmployee>>(`${BASE}/employees/with-user`, body)
      : await apiClient.post<ApiResponse<PayrollEmployee>>(`${BASE}/employees/with-user`, body)
  return unwrapData(res)
}

export async function updateEmployee(id: string, body: Record<string, any> | FormData) {
  const res =
    body instanceof FormData
      ? await apiClient.putFormData<ApiResponse<PayrollEmployee>>(`${BASE}/employees/${id}`, body)
      : await apiClient.put<ApiResponse<PayrollEmployee>>(`${BASE}/employees/${id}`, body)
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

/**
 * The payslip PDF the backend actually issues — hash-verified, with a `/verify` companion.
 *
 * The module's download control built a PDF client-side from hardcoded content ("Rudo Sibanda",
 * "June 2026 Payslip"), so every employee downloaded the same invented document whatever their
 * own pay was.
 */
export async function downloadPayslipPdf(payslipId: string): Promise<Blob> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
  const token = typeof document !== "undefined"
    ? (document.cookie.split("; ").find((c) => c.startsWith((process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "token") + "="))?.split("=")[1] ?? "")
    : ""
  const res = await fetch(`${base}/payroll/employee/payslips/${payslipId}/download`, {
    headers: token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {},
  })
  if (!res.ok) {
    throw new Error(`Payslip download failed (${res.status})`)
  }
  return res.blob()
}

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

export type MyPayslipPage = {
  items: Payslip[]
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Paginated self-service history. The server derives the employee from the authenticated user. */
export async function getMyPayslipPage(page = 1, limit = 10): Promise<MyPayslipPage> {
  const safePage = Math.max(1, Math.floor(page))
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)))
  const res = await apiClient.get<ApiResponse<Payslip[]>>(
    `${BASE}/employee/payslips?page=${safePage}&limit=${safeLimit}`,
  )
  const response = res as ApiResponse<Payslip[]>
  const pagination = response?.pagination || {}
  return {
    items: unwrapData(response) ?? [],
    page: Number(pagination.page) || safePage,
    limit: Number(pagination.limit) || safeLimit,
    total: Number(pagination.total) || 0,
    totalPages: Math.max(0, Number(pagination.pages ?? pagination.totalPages) || 0),
  }
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

export async function listPayrollCurrencies(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>("/accounting/currencies")
  return unwrapData(res) ?? []
}

export async function listPayrollComponentAccounts(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/component-accounts`)
  return unwrapData(res) ?? []
}

export async function listPayrollComponentEmployees(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/component-employees`)
  return unwrapData(res) ?? []
}

export async function assignPayrollComponent(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/component-assignments`, body)
  return unwrapData(res)
}

export async function listStatutoryMappings(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/statutory/mappings`)
  return unwrapData(res) ?? []
}

export async function saveStatutoryMapping(body: { deductionTypeId: string; glAccountId: string | null }) {
  const res = await apiClient.put<ApiResponse<any>>(`${BASE}/statutory/mappings`, body)
  return unwrapData(res)
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

// Payroll setup forms use the same governed CRUD endpoints as the legacy tables.
export async function saveAllowanceType(body: Record<string, any>, id?: string) {
  const res = id
    ? await apiClient.put<ApiResponse<any>>(`${BASE}/allowance-types/${encodeURIComponent(id)}`, body)
    : await apiClient.post<ApiResponse<any>>(`${BASE}/allowance-types`, body)
  return unwrapData(res)
}

export async function saveDeductionType(body: Record<string, any>, id?: string) {
  const res = id
    ? await apiClient.put<ApiResponse<any>>(`${BASE}/deduction-types/${encodeURIComponent(id)}`, body)
    : await apiClient.post<ApiResponse<any>>(`${BASE}/deduction-types`, body)
  return unwrapData(res)
}

export async function saveTaxRule(body: Record<string, any>, id?: string) {
  const res = id
    ? await apiClient.put<ApiResponse<any>>(`${BASE}/tax-rules/${encodeURIComponent(id)}`, body)
    : await apiClient.post<ApiResponse<any>>(`${BASE}/tax-rules`, body)
  return unwrapData(res)
}

export async function saveStatutoryBrackets(body: Record<string, any>[], id?: string) {
  if (id) {
    const res = await apiClient.put<ApiResponse<any>>(`${BASE}/statutory/brackets/${encodeURIComponent(id)}`, body[0])
    return unwrapData(res)
  }
  const results = []
  for (const item of body) {
    const res = await apiClient.post<ApiResponse<any>>(`${BASE}/statutory/brackets`, item)
    results.push(unwrapData(res))
  }
  return results
}

export async function saveStatutoryLevies(body: Record<string, any>[]) {
  const res = await apiClient.put<ApiResponse<any[]>>(`${BASE}/statutory/levies`, body)
  return unwrapData(res)
}

export async function listLeaveBalances(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/leave-balances`)
  return unwrapData(res) ?? []
}

export async function listLeaveBalanceEmployees(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/leave-balances/employee-options`)
  return unwrapData(res) ?? []
}

export async function saveLeaveBalance(body: { employeeId: string; leaveType: string; balance: number }) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/leave-balances`, body)
  return unwrapData(res)
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

/** Create a pay group. The Create Pay Group control opened a modal with no fields until now. */
export async function createPayrollPayGroup(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/pay-groups`, body)
  return unwrapData(res)
}

/** Update the fields supported by the pay-group API. Currency legs are read-only here. */
export async function updatePayrollPayGroup(id: string, body: Record<string, any>) {
  const res = await apiClient.patch<ApiResponse<any>>(`${BASE}/pay-groups/${encodeURIComponent(id)}`, body)
  return unwrapData(res)
}

export async function listPayrollPayGroups(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/pay-groups`)
  return unwrapData(res) ?? null
}

/** Create or update one dated period on a pay group. Returns the refreshed pay-group list. */
export async function upsertPayrollCalendarPeriod(payGroupId: string, body: Record<string, any>) {
  const res = await apiClient.put<ApiResponse<any>>(
    `${BASE}/pay-groups/${encodeURIComponent(payGroupId)}/periods`,
    body,
  )
  return unwrapData(res)
}

// ---------------------------------------------------------------------------
// Access register and document vault (FINDING-017)
// ---------------------------------------------------------------------------

/** Who holds payroll authority, derived from real grants. Requires payroll.access.view. */
export async function getPayrollAccessRoster(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/access/roster`)
  return unwrapData(res) ?? null
}

/** Module-scoped, versioned Payroll roles; global platform grants are not changed. */
export async function listPayrollAccessRoles(): Promise<any[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/access/roles`)
  return unwrapData(res) ?? []
}

export async function listPayrollAssignableUsers(params: { search?: string; page?: number; limit?: number } = {}): Promise<any> {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && String(value).trim()) qs.set(key, String(value))
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/access/assignable-users${qs.size ? `?${qs}` : ""}`)
  return unwrapData(res) ?? { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
}

export async function createPayrollAccessRole(input: { name: string; description?: string; permissions: Record<string, boolean> }) {
  return unwrapData(await apiClient.post<ApiResponse<any>>(`${BASE}/access/roles`, input))
}
export async function savePayrollAccessRoleDraft(roleId: string, permissions: Record<string, boolean>, expectedRevision: number, description?: string) {
  return unwrapData(await apiClient.put<ApiResponse<any>>(`${BASE}/access/roles/${encodeURIComponent(roleId)}/draft`, { permissions, expectedRevision, description }))
}
export async function activatePayrollAccessRole(roleId: string, expectedRevision: number) {
  return unwrapData(await apiClient.post<ApiResponse<any>>(`${BASE}/access/roles/${encodeURIComponent(roleId)}/activate`, { expectedRevision }))
}
export async function setPayrollAccessRoleStatus(roleId: string, enabled: boolean, expectedRevision: number) {
  return unwrapData(await apiClient.post<ApiResponse<any>>(`${BASE}/access/roles/${encodeURIComponent(roleId)}/status`, { enabled, expectedRevision }))
}
export async function assignPayrollAccessRole(userId: string, roleId: string) {
  return unwrapData(await apiClient.put<ApiResponse<any>>(`${BASE}/access/role-assignments/${encodeURIComponent(userId)}`, { roleId }))
}
export async function removePayrollAccessRole(userId: string) {
  return unwrapData(await apiClient.delete<ApiResponse<any>>(`${BASE}/access/role-assignments/${encodeURIComponent(userId)}`))
}

/** The payroll document register. Carries no storage URLs. Requires payroll.vault.view. */
export async function listPayrollDocuments(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/documents`)
  return unwrapData(res) ?? null
}

/** Upload one document as multipart field `file`. Requires payroll.vault.manage. */
export async function uploadPayrollDocument(form: FormData) {
  const res = await apiClient.postFormData<ApiResponse<any>>(`${BASE}/documents`, form)
  return unwrapData(res)
}

/**
 * The stored file, through the guarded and audited endpoint rather than a storage URL.
 * Same token handling as downloadPayslipPdf, because apiClient parses JSON.
 */
export async function downloadPayrollDocument(id: string): Promise<{ blob: Blob; filename: string | null }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
  const key = (process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "token") + "="
  const token = typeof document !== "undefined"
    ? (document.cookie.split("; ").find((c) => c.startsWith(key))?.split("=")[1] ?? "")
    : ""
  const res = await fetch(`${base}/payroll/documents/${encodeURIComponent(id)}/download`, {
    headers: token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {},
  })
  if (!res.ok) {
    let message = `Document download failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // Not JSON; keep the status message.
    }
    throw new Error(message)
  }
  const disposition = res.headers.get("Content-Disposition") || ""
  const marker = 'filename="'
  const at = disposition.indexOf(marker)
  const filename = at >= 0
    ? disposition.slice(at + marker.length, disposition.indexOf('"', at + marker.length))
    : null
  return { blob: await res.blob(), filename }
}

export async function listPayrollOnboarding(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/onboarding/candidates`)
  return unwrapData(res) ?? null
}

export async function createPayrollOnboardingCandidate(body: Record<string, any>): Promise<Record<string, any>> {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/onboarding/candidates`, body)
  return unwrapData(res)
}

export async function updatePayrollOnboardingCandidate(id: string, body: Record<string, any>): Promise<Record<string, any>> {
  const res = await apiClient.patch<ApiResponse<any>>(`${BASE}/onboarding/candidates/${encodeURIComponent(id)}`, body)
  return unwrapData(res)
}

export async function listPayrollRfqs(): Promise<Record<string, any> | null> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/rfqs`)
  return unwrapData(res) ?? null
}

export async function listBankTemplates(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/bank-templates`)
  return unwrapData(res) ?? []
}

export type PayrollBankFileTemplateInput = {
  name: string
  bankName: string
  delimiter: string
  hasHeader: boolean
  columnOrder: string[]
}

export async function createBankTemplate(input: PayrollBankFileTemplateInput): Promise<Record<string, any>> {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/bank-templates`, input)
  return unwrapData(res)
}

export async function updateBankTemplate(id: string, input: PayrollBankFileTemplateInput): Promise<Record<string, any>> {
  const res = await apiClient.put<ApiResponse<any>>(`${BASE}/bank-templates/${encodeURIComponent(id)}`, input)
  return unwrapData(res)
}

export async function deleteBankTemplate(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/bank-templates/${encodeURIComponent(id)}`)
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
export type PayrollAuditPage = {
  items: PayrollAuditEvent[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  stats: { total: number; approvals: number; changes: number; accesses: number; releases: number; security: number; sensitive: number; actors: number }
}

export async function listAuditEvents(params: { page?: number; limit?: number; search?: string; actor?: string; eventClass?: string; from?: string; to?: string; entityType?: string; entityId?: string; action?: string } = {}): Promise<PayrollAuditPage> {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && String(value).trim()) qs.set(key, String(value))
  const res = await apiClient.get<ApiResponse<PayrollAuditPage>>(
    `${BASE}/audit${qs.size ? `?${qs}` : ""}`,
  )
  return unwrapData(res) ?? { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, stats: { total: 0, approvals: 0, changes: 0, accesses: 0, releases: 0, security: 0, sensitive: 0, actors: 0 } }
}

export async function recordPayrollAuditExport(format: string): Promise<void> {
  await apiClient.post<ApiResponse<unknown>>(`${BASE}/audit/export`, { format })
}

export async function listPayrollReports(params: { page?: number; limit?: number; search?: string; type?: string } = {}): Promise<any> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.search) qs.set("search", params.search)
  if (params.type) qs.set("type", params.type)
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/reports${qs.size ? `?${qs}` : ""}`)
  return unwrapData(res)
}

export async function generatePayrollReport(input: { reportType: string; periodStart: string; periodEnd: string; currencyCode?: string | null }): Promise<any> {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/reports/generate`, input)
  return unwrapData(res)
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

export async function listTrainingAssignments(): Promise<Record<string, any>[]> {
  const res = await apiClient.get<ApiResponse<any[]>>(`${BASE}/compliance/assignments`)
  return unwrapData(res) ?? []
}

export async function listTrainingAssignmentAudienceOptions(): Promise<{
  departments: Record<string, any>[]
  roles: Record<string, any>[]
  employees: Record<string, any>[]
}> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/compliance/assignments/audience-options`)
  return unwrapData(res) ?? { departments: [], roles: [], employees: [] }
}

export async function saveTrainingCourse(body: Record<string, any>, id?: string) {
  const res = id
    ? await apiClient.put<ApiResponse<any>>(`${BASE}/compliance/courses/${encodeURIComponent(id)}`, body)
    : await apiClient.post<ApiResponse<any>>(`${BASE}/compliance/courses`, body)
  return unwrapData(res)
}

export async function createTrainingAssignment(body: Record<string, any>) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/compliance/assignments`, body)
  return unwrapData(res)
}

export async function createEmployeeCertification(body: FormData) {
  const res = await apiClient.postFormData<ApiResponse<any>>(`${BASE}/compliance/certifications`, body)
  return unwrapData(res)
}

export async function renewEmployeeCertification(id: string, body: FormData) {
  const res = await apiClient.putFormData<ApiResponse<any>>(`${BASE}/compliance/certifications/${encodeURIComponent(id)}`, body)
  return unwrapData(res)
}

export async function revokeEmployeeCertification(id: string) {
  const res = await apiClient.post<ApiResponse<any>>(`${BASE}/compliance/certifications/${encodeURIComponent(id)}/revoke`)
  return unwrapData(res)
}

export async function removeTrainingAssignment(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`${BASE}/compliance/assignments/${encodeURIComponent(id)}`)
  return unwrapData(res)
}

export async function deactivateTrainingCourse(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`${BASE}/compliance/courses/${encodeURIComponent(id)}`)
  return unwrapData(res)
}

export async function getExpiringCertifications(): Promise<Record<string, any>> {
  const res = await apiClient.get<ApiResponse<any>>(`${BASE}/compliance/dashboard/expiring`)
  return unwrapData(res)
}
