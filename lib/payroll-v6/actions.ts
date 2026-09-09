/**
 * Payroll V6 write actions.
 *
 * The runtime dispatches `matanho:before-action` for every [data-action] click.
 * The host (components/payroll-v6-mock/payroll-v6-app.tsx) matches the action id
 * against its API_ACTIONS allowlist and routes those here; anything not on the
 * allowlist keeps the runtime's own client-side behaviour.
 *
 * Contract for a handler:
 *   handled  — this action was claimed (the runtime's mock path was suppressed)
 *   reload   — the caller should re-run the live loaders afterwards
 *   message  — success text to surface
 *   error    — failure text to surface; never fail silently, because a control
 *              that looks live and quietly does nothing is the defect this
 *              module is being fixed for
 *
 * Every handler that needs a permission checks it first and returns an explicit
 * refusal, so a role without the grant sees why rather than a dead button.
 */
import {
  approveRun,
  createEmployeeWithUser,
  createPayrollRun,
  generateBankFile,
  getMyPayrollAccess,
  listBankTemplates,
  processRun,
  recordRunPayment,
  rejectRun,
  submitRunForApproval,
  reinstateEmployee,
  suspendEmployee,
  terminateEmployee,
  toastPayrollError,
} from "@/lib/api/payroll-v6-api"

export type PayrollActionDetail = {
  action: string
  dataset?: Record<string, string>
  page?: string | null
}

export type PayrollActionResult = {
  handled: boolean
  reload?: boolean
  message?: string
  error?: string
  /** A file the browser should download, produced by a real API response. */
  download?: { filename: string; content: string; mime: string }
}

/** Permission cache for the life of the page; refreshed on reload. */
let cachedPermissions: Set<string> | null = null

async function permissions(): Promise<Set<string>> {
  if (cachedPermissions) return cachedPermissions
  try {
    const access = await getMyPayrollAccess()
    cachedPermissions = new Set(access.permissions ?? [])
  } catch {
    cachedPermissions = new Set()
  }
  return cachedPermissions
}

export function resetPayrollActionCache() {
  cachedPermissions = null
}

const REFUSAL: Record<string, string> = {
  "payroll.runs.manage": "preparing payroll runs",
  "payroll.runs.approve": "approving payroll runs",
  "payroll.runs.release": "releasing payroll and bank files",
  "payroll.employees.manage": "changing employee records",
}

async function requirePermission(p: string): Promise<PayrollActionResult | null> {
  const perms = await permissions()
  if (perms.has(p)) return null
  return {
    handled: true,
    error: `Your role does not have permission for ${REFUSAL[p] ?? p}.`,
  }
}

/** The run the action refers to: an explicit data-id, else the newest run. */
function runIdFrom(detail: PayrollActionDetail): string | null {
  const d = detail.dataset ?? {}
  return d.id || d.runId || d.run || null
}

export async function handlePayrollV6Action(
  detail: PayrollActionDetail,
  context?: { currentRunId?: string | null; currencyId?: string | null },
): Promise<PayrollActionResult> {
  const action = String(detail.action || "")
  const runId = runIdFrom(detail) ?? context?.currentRunId ?? null

  try {
    switch (action) {
      // ---------------------------------------------------------------- runs
      case "create-run": {
        const denied = await requirePermission("payroll.runs.manage")
        if (denied) return denied

        // Read the modal's own fields so the run reflects what was typed.
        const periodEl = document.querySelector<HTMLInputElement>("#runPeriod")
        const raw = (periodEl?.value || "").trim()
        const parsed = parsePeriod(raw)
        if (!parsed) {
          return {
            handled: true,
            error: `Could not read a pay period from "${raw || "(empty)"}". Use a month and year, for example "July 2026".`,
          }
        }
        const { year, month, label } = parsed
        const mm = String(month).padStart(2, "0")
        const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()

        const created = await createPayrollRun({
          name: `${label} Monthly Staff`,
          payPeriod: `${year}-${mm}`,
          startDate: `${year}-${mm}-01`,
          endDate: `${year}-${mm}-${lastDay}`,
          currencyId: context?.currencyId ?? null,
          dualCurrency: false,
        })
        return {
          handled: true,
          reload: true,
          message: `Payroll run created for ${label} (${(created as any)?.payPeriod ?? `${year}-${mm}`}).`,
        }
      }

      case "continue-run": {
        const denied = await requirePermission("payroll.runs.manage")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }
        await submitRunForApproval(runId)
        return { handled: true, reload: true, message: "Run submitted for approval." }
      }

      case "approve-payroll": {
        const denied = await requirePermission("payroll.runs.approve")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }
        await approveRun(runId)
        return { handled: true, reload: true, message: "Payroll run approved." }
      }

      case "reject-payroll": {
        const denied = await requirePermission("payroll.runs.approve")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }
        const reason =
          document.querySelector<HTMLTextAreaElement>("#decisionBasis")?.value || undefined
        await rejectRun(runId, reason)
        return { handled: true, reload: true, message: "Payroll run returned for correction." }
      }

      case "commit-inputs": {
        // "Commit inputs" is the calculation step: it is what turns an approved
        // run into employee payrolls and payslips.
        const denied = await requirePermission("payroll.runs.manage")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }
        await processRun(runId)
        return { handled: true, reload: true, message: "Payroll calculated and payslips generated." }
      }

      case "release-payroll": {
        const denied = await requirePermission("payroll.runs.release")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }
        await recordRunPayment(runId, {})
        return { handled: true, reload: true, message: "Payroll released for payment." }
      }

      // ----------------------------------------------------------- bank file
      case "download-close-pack": {
        const denied = await requirePermission("payroll.runs.release")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }

        const templates = await listBankTemplates()
        const templateId = templates?.[0]?.id
        if (!templateId) {
          return {
            handled: true,
            error: "No bank file template is configured. Add one under Settings before releasing.",
          }
        }
        const csv = await generateBankFile(runId, templateId)
        const content = typeof csv === "string" ? csv : JSON.stringify(csv)
        return {
          handled: true,
          message: "Bank file generated from the payroll run.",
          download: {
            filename: `payroll-bank-file-${runId}.csv`,
            content,
            mime: "text/csv",
          },
        }
      }

      // ------------------------------------------------------------ people
      case "complete-onboarding": {
        const denied = await requirePermission("payroll.employees.manage")
        if (denied) return denied

        const val = (id: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()

        const firstName = val("newFirst")
        const lastName = val("newLast")
        const email = val("newEmail")
        const employeeNumber = val("newEmployeeNumber")
        const basicSalary = val("newBasicSalary")
        const departmentCode = val("newDept")

        // Report every missing field at once rather than one per attempt.
        const missing: string[] = []
        if (!firstName) missing.push("first name")
        if (!lastName) missing.push("surname")
        if (!email) missing.push("work email")
        if (!employeeNumber) missing.push("employee number")
        if (!basicSalary) missing.push("basic salary")
        if (missing.length) {
          return {
            handled: true,
            error: `Cannot create the employee — missing ${missing.join(", ")}.`,
          }
        }

        const created = await createEmployeeWithUser({
          firstName,
          lastName,
          email,
          employeeNumber,
          departmentCode: departmentCode || null,
          basicSalary,
        })
        return {
          handled: true,
          reload: true,
          message: `${firstName} ${lastName} created as ${(created as any)?.employeeNumber ?? employeeNumber}.`,
        }
      }

      // ----------------------------------------------------------- employees
      case "suspend-employee": {
        const denied = await requirePermission("payroll.employees.manage")
        if (denied) return denied
        const id = detail.dataset?.recordId || detail.dataset?.id
        if (!id) return { handled: true, error: "No employee selected." }
        await suspendEmployee(id)
        return { handled: true, reload: true, message: "Employee suspended." }
      }

      case "reinstate-employee": {
        const denied = await requirePermission("payroll.employees.manage")
        if (denied) return denied
        const id = detail.dataset?.recordId || detail.dataset?.id
        if (!id) return { handled: true, error: "No employee selected." }
        await reinstateEmployee(id)
        return { handled: true, reload: true, message: "Employee reinstated." }
      }

      case "terminate-employee": {
        const denied = await requirePermission("payroll.employees.manage")
        if (denied) return denied
        const id = detail.dataset?.recordId || detail.dataset?.id
        if (!id) return { handled: true, error: "No employee selected." }
        await terminateEmployee(id, {})
        return { handled: true, reload: true, message: "Employee terminated." }
      }

      default:
        return { handled: false }
    }
  } catch (err) {
    const body = toastPayrollError(err, "Payroll request failed")
    return { handled: true, error: body.message ?? "Payroll request failed" }
  }
}

/** Parse "July 2026" / "2026-07" into a year and month. */
function parsePeriod(raw: string): { year: number; month: number; label: string } | null {
  if (!raw) return null
  const MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ]

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})$/)
  if (iso) {
    const year = Number(iso[1])
    const month = Number(iso[2])
    if (month >= 1 && month <= 12) {
      const label = `${MONTHS[month - 1].replace(/^./, (c) => c.toUpperCase())} ${year}`
      return { year, month, label }
    }
  }

  const named = raw.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (named) {
    const idx = MONTHS.indexOf(named[1].toLowerCase())
    const year = Number(named[2])
    if (idx >= 0) {
      return {
        year,
        month: idx + 1,
        label: `${named[1].replace(/^./, (c) => c.toUpperCase())} ${year}`,
      }
    }
  }
  return null
}
