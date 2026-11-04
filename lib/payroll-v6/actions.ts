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
  createPayrollOnboardingCandidate,
  createPayrollRun,
  generateBankFile,
  getMyPayrollAccess,
  listBankTemplates,
  createBankTemplate,
  updateBankTemplate,
  deleteBankTemplate,
  saveLeaveBalance,
  processRun,
  recordRunPayment,
  rejectRun,
  submitRunForApproval,
  reinstateEmployee,
  suspendEmployee,
  terminateEmployee,
  updateEmployee,
  downloadPayslipPdf,
  createPayrollPayGroup,
  updatePayrollPayGroup,
  saveAllowanceType,
  assignPayrollComponent,
  saveDeductionType,
  saveTaxRule,
  saveStatutoryBrackets,
  saveStatutoryLevies,
  saveStatutoryMapping,
  saveTrainingCourse,
  createTrainingAssignment,
  createEmployeeCertification,
  renewEmployeeCertification,
  revokeEmployeeCertification,
  removeTrainingAssignment,
  deactivateTrainingCourse,
  downloadPayrollDocument,
  uploadPayrollDocument,
  upsertPayrollCalendarPeriod,
  updatePayrollOnboardingCandidate,
  toastPayrollError,
} from "@/lib/api/payroll-v6-api"

export type PayrollActionDetail = {
  action: string
  dataset?: Record<string, string>
  page?: string | null
  rows?: Record<string, any>[]
}

export type PayrollActionResult = {
  handled: boolean
  reload?: boolean
  navigate?: string
  message?: string
  error?: string
  data?: unknown
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

/** Close the runtime modal through its own close control; the runtime owns that DOM. */
function closeRuntimeModal() {
  document.querySelector<HTMLElement>('#modalHead [data-action="close-modal"]')?.click()
}

const REFUSAL: Record<string, string> = {
  "payroll.runs.manage": "preparing payroll runs",
  "payroll.runs.approve": "approving payroll runs",
  "payroll.runs.release": "releasing payroll and bank files",
  "payroll.employees.manage": "changing employee records",
  "payroll.vault.view": "downloading payroll documents",
  "payroll.vault.manage": "uploading payroll documents",
  "payroll.calendar.manage": "changing the pay calendar",
  "payroll.settings.manage": "changing payroll bank file templates",
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

const PICTURE_TYPES = ["image/png", "image/jpeg", "image/webp"]
const PICTURE_MAX_BYTES = 10 * 1024 * 1024

/** The photo chosen in a form's file input, or an error string if it can't be uploaded. */
function pickedPicture(inputId: string): { file?: File; error?: string } {
  const file = document.querySelector<HTMLInputElement>(`#${inputId}`)?.files?.[0]
  if (!file) return {}
  if (!PICTURE_TYPES.includes(file.type)) return { error: "The photo must be a PNG, JPEG or WebP image." }
  if (file.size > PICTURE_MAX_BYTES) return { error: "The photo must be 10 MB or smaller." }
  return { file }
}

export async function handlePayrollV6Action(
  detail: PayrollActionDetail,
  context?: { currentRunId?: string | null; currencyId?: string | null },
): Promise<PayrollActionResult> {
  const action = String(detail.action || "")
  const runId = runIdFrom(detail) ?? context?.currentRunId ?? null

  try {
    switch (action) {
      case "save-bank-template": {
        const denied = await requirePermission("payroll.settings.manage")
        if (denied) return denied
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const name = val("bankTemplateName")
        const bankName = val("bankTemplateBank")
        const rawDelimiter = val("bankTemplateDelimiter")
        const delimiter = rawDelimiter === "TAB" ? "\t" : rawDelimiter
        const hasHeader = document.querySelector<HTMLInputElement>("#bankTemplateHeader")?.checked === true
        const columnOrder = val("bankTemplateColumns").split(",").map((column) => column.trim()).filter(Boolean)
        const id = detail.dataset?.templateId || ""
        const allowed = ["Employee Name", "Bank Name", "Branch Code", "Account Number", "Payment Amount (Net Pay)", "Payment Reference"]
        if (!name || !bankName) return { handled: true, error: "Template name and bank name are required." }
        if (![",", "|", ";", "\t"].includes(delimiter)) return { handled: true, error: "Choose a supported delimiter." }
        if (!columnOrder.length || columnOrder.some((column) => !allowed.includes(column)) || new Set(columnOrder).size !== columnOrder.length) {
          return { handled: true, error: "Choose one or more supported payment-file columns without duplicates." }
        }
        const input = { name, bankName, delimiter, hasHeader, columnOrder }
        if (id) await updateBankTemplate(id, input)
        else await createBankTemplate(input)
        closeRuntimeModal()
        return { handled: true, reload: true, message: id ? "Bank file template updated." : "Bank file template created." }
      }

      case "delete-bank-template": {
        const denied = await requirePermission("payroll.settings.manage")
        if (denied) return denied
        const id = detail.dataset?.templateId || ""
        if (!id) return { handled: true, error: "Choose a bank file template to delete." }
        await deleteBankTemplate(id)
        return { handled: true, reload: true, message: "Bank file template deleted." }
      }

      // ---------------------------------------------------------------- runs
      case "save-run":
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

        const group = document.querySelector<HTMLSelectElement>("#runGroup")?.value || "Monthly Staff"
        const currencyId = document.querySelector<HTMLSelectElement>("#runCurrencyId")?.value || context?.currencyId || null
        const dualCurrency = Boolean(document.querySelector<HTMLInputElement>("#runDualCurrency")?.checked)
        const created = await createPayrollRun({
          name: `${label} ${group}`,
          payPeriod: `${year}-${mm}`,
          startDate: `${year}-${mm}-01`,
          endDate: `${year}-${mm}-${lastDay}`,
          currencyId,
          dualCurrency,
        })
        return {
          handled: true,
          reload: true,
          message: `${action === "save-run" ? "Draft saved" : "Payroll run created"} for ${label} ${group} (${(created as any)?.payPeriod ?? `${year}-${mm}`}).`,
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
        // The Maker-Checker card's box is #approvalComment. This read #decisionBasis, which is not on that page,
        // so a reviewer's reason for returning a run was silently dropped ("Rejected by checker" was stored).
        const reason =
          document.querySelector<HTMLTextAreaElement>("#approvalComment, #decisionBasis")?.value.trim() || undefined
        await rejectRun(runId, reason)
        return { handled: true, reload: true, message: "Payroll run returned for correction." }
      }

      case "record-decision": {
        const denied = await requirePermission("payroll.runs.approve")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run is awaiting approval." }
        const decision = document.querySelector<HTMLSelectElement>("#decisionType")?.value || "Return for correction"
        const reason = document.querySelector<HTMLTextAreaElement>("#decisionBasis")?.value.trim() || ""
        if (["Approve", "Approve payroll"].includes(decision)) {
          await approveRun(runId)
          return { handled: true, reload: true, message: "Payroll run approved." }
        }
        if (!reason) return { handled: true, error: "Enter a decision basis before returning this payroll run." }
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
        const bankId = document.querySelector<HTMLSelectElement>("#closePaymentBank")?.value || ""
        const paymentDate = document.querySelector<HTMLInputElement>("#closePaymentDate")?.value || ""
        if (!bankId) return { handled: true, error: "Select the bank account that will fund this payroll payment." }
        if (!paymentDate) return { handled: true, error: "Select the payroll payment date." }
        const payment = await recordRunPayment(runId, { bankId, paymentDate })
        return { handled: true, reload: true, data: payment, message: "Payroll payment recorded. Net wages payable was cleared through the selected bank and ledger accounts." }
      }

      // ----------------------------------------------------------- bank file
      case "download-close-pack": {
        const denied = await requirePermission("payroll.runs.release")
        if (denied) return denied
        if (!runId) return { handled: true, error: "No payroll run selected." }

        const templates = await listBankTemplates()
        const templateId = detail.dataset?.templateId || document.querySelector<HTMLSelectElement>("#closeBankTemplate")?.value || templates?.[0]?.id
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
            filename: `payroll-bank-file-${String(detail.dataset?.runReference || "selected-run").replace(/[^a-z0-9-]+/gi, "-")}.csv`,
            content,
            mime: "text/csv",
          },
        }
      }

      // ------------------------------------------------------------ people
      case "complete-onboarding": {
        const onboardingDenied = await requirePermission("payroll.onboarding.manage")
        if (onboardingDenied) return onboardingDenied
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
        const position = val("newTitle")
        const startDate = val("newStartDate")
        const currencyId = val("newCurrency")
        const salarySplitUsdPct = val("newUsdSplit")
        const salarySplitZigPct = val("newZigSplit")
        const candidateId = val("onbCandidateId")

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

        const photo = pickedPicture("newPicture")
        if (photo.error) return { handled: true, error: photo.error }

        const fields = {
          firstName,
          lastName,
          email,
          employeeNumber,
          departmentCode: departmentCode || "",
          basicSalary,
          position,
          contractEffectiveDate: startDate || null,
          currencyId: currencyId || null,
          salarySplitUsdPct: salarySplitUsdPct === "" ? 1 : Number(salarySplitUsdPct) / 100,
          salarySplitZigPct: salarySplitZigPct === "" ? 0 : Number(salarySplitZigPct) / 100,
        }
        let candidate: Record<string, any> = candidateId ? { id: candidateId } : {}
        if (!candidate.id) {
          candidate = await createPayrollOnboardingCandidate({
            firstName,
            lastName,
            email,
            position: position || null,
            department: departmentCode || null,
            startDate: startDate || null,
            status: "PAYROLL_SETUP",
            checklist: { identity: true, employment: true, compensation: true },
          })
        }
        let payload: FormData | Record<string, any> = { ...fields, departmentCode: departmentCode || null }
        if (photo.file) {
          const form = new FormData()
          Object.entries(fields).forEach(([k, v]) => v !== null && v !== undefined && String(v) !== "" && form.append(k, String(v)))
          form.append("picture", photo.file)
          payload = form
        }
        const created = await createEmployeeWithUser(payload as any)
        await updatePayrollOnboardingCandidate(String((candidate as any).id), {
          status: "COMPLETE",
          employeeId: (created as any)?.id ?? null,
          checklist: { identity: true, employment: true, compensation: true, account: true },
        })
        const invited = (created as any)?.credentialEmailSent !== false
        return {
          handled: true,
          reload: true,
          navigate: "employees",
          message: invited
            ? `${firstName} ${lastName} was created and the first-sign-in credentials were sent to ${email}.`
            : `${firstName} ${lastName} was created, but the credential email could not be delivered. Check mail configuration and retry the invite.`,
        }
      }

      case "save-onboarding": {
        const denied = await requirePermission("payroll.onboarding.manage")
        if (denied) return denied
        const val = (id: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const firstName = val("newFirst")
        const lastName = val("newLast")
        const email = val("newEmail")
        if (!firstName || !lastName) return { handled: true, error: "First name and surname are required to save an onboarding case." }
        const values = {
          firstName,
          lastName,
          email: email || null,
          position: val("newTitle") || null,
          department: val("newDept") || null,
          startDate: val("newStartDate") || null,
          status: "INVITED",
          checklist: {
            identity: Boolean(email),
            employment: Boolean(val("newTitle") && val("newDept") && val("newStartDate")),
            compensation: Boolean(val("newBasicSalary")),
            employeeNumber: val("newEmployeeNumber"),
            compensationDetails: {
              basicSalary: val("newBasicSalary"),
              currencyId: val("newCurrency"),
              salarySplitUsdPct: val("newUsdSplit") || "100",
              salarySplitZigPct: val("newZigSplit") || "0",
            },
          },
        }
        const candidateId = val("onbCandidateId")
        const saved = candidateId
          ? await updatePayrollOnboardingCandidate(candidateId, values)
          : await createPayrollOnboardingCandidate(values)
        return { handled: true, reload: true, message: `${firstName} ${lastName}'s onboarding draft was saved.` }
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

      case "save-paygroup": {
        const denied = await requirePermission("payroll.calendar.manage")
        if (denied) return denied

        const val = (id: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()

        const name = val("newPayGroupName")
        const code = val("newPayGroupCode")
        const currencyCodes = Array.from(document.querySelector<HTMLSelectElement>("#newPayGroupCurrencies")?.selectedOptions ?? []).map((o) => o.value)
        const missing: string[] = []
        if (!name) missing.push("group name")
        if (!currencyCodes.length) missing.push("at least one salary currency")
        const payDay = val("newPayGroupPayDay")
        if (payDay && (!/^\d+$/.test(payDay) || Number(payDay) < 1 || Number(payDay) > 31)) {
          return { handled: true, error: "Pay day must be a whole day from 1 to 31." }
        }
        if (missing.length) {
          return { handled: true, error: `Cannot create the pay group — missing ${missing.join(", ")}.` }
        }

        await createPayrollPayGroup({
          name,
          ...(code ? { code } : {}),
          frequency: val("newPayGroupFrequency") || "MONTHLY",
          payDayOfMonth: payDay || null,
          currencyCode: currencyCodes[0],
          currencyCodes,
        })
        return { handled: true, reload: true, message: `Pay group ${name} created.` }
      }

      case "update-paygroup": {
        const denied = await requirePermission("payroll.calendar.manage")
        if (denied) return denied
        const val = (id: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const id = val("pr6EditPayGroupId")
        const name = val("pr6EditPayGroupName")
        const frequency = val("pr6EditPayGroupFrequency")
        const payDay = val("pr6EditPayGroupPayDay")
        if (!id) return { handled: true, error: "No pay group was selected." }
        if (!name) return { handled: true, error: "Enter a pay group name." }
        if (!["MONTHLY", "FORTNIGHTLY", "WEEKLY"].includes(frequency)) return { handled: true, error: "Select a supported payroll frequency." }
        if (payDay && (!/^\d+$/.test(payDay) || Number(payDay) < 1 || Number(payDay) > 31)) return { handled: true, error: "Pay day must be a whole day from 1 to 31." }
        await updatePayrollPayGroup(id, {
          name,
          frequency,
          payDayOfMonth: payDay || null,
          isActive: val("pr6EditPayGroupActive") === "true",
        })
        closeRuntimeModal()
        return { handled: true, reload: true, message: `Pay group ${name} updated.` }
      }

      case "save-pay-component": {
        const type = document.querySelector<HTMLSelectElement>("#componentType")?.value || "EARNING"
        const permission = await requirePermission("payroll.components.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)?.value || "").trim()
        const name = val("componentName")
        const code = val("componentCode").toUpperCase()
        if (!name || !code) return { handled: true, error: "Component name and code are required." }
        if (val("componentEndDate") && val("componentEffectiveDate") && val("componentEndDate") < val("componentEffectiveDate")) return { handled: true, error: "The end date cannot be before the effective date." }
        for (const id of ["componentThreshold", "componentCeiling"]) {
          const value = val(id)
          if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) return { handled: true, error: "Threshold and ceiling must be non-negative numbers." }
        }
        const taxable = !!document.querySelector<HTMLInputElement>("#componentTaxable")?.checked
        const id = val("componentId") || undefined
        const glAccountId = val("componentGlAccount") || null
        if (type === "EARNING") {
          const calculationMethod = val("componentCalculationMethod") || "FIXED"
          const rateInput = val("componentCalculationRate")
          const calculationRate = rateInput ? Number(rateInput) : null
          if (calculationMethod === "PERCENT_BASIC" && (calculationRate === null || !Number.isFinite(calculationRate) || calculationRate < 0 || calculationRate > 100)) return { handled: true, error: "Enter an earning rate between 0 and 100 percent." }
          await saveAllowanceType({ name, code, description: val("componentDescription"), isTaxable: taxable, glAccountId, calculationMethod, calculationRate }, id)
        } else {
          const currencyId = val("componentCurrencyId")
          const rate = Number(val("componentRate") || 0)
          if (!Number.isFinite(rate) || rate < 0 || rate > 100) return { handled: true, error: "Deduction rate must be between 0 and 100 percent." }
          await saveDeductionType({
            name, code, description: val("componentDescription"), glAccountId,
            rate,
            threshold: val("componentThreshold") || null,
            ceiling: val("componentCeiling") || null,
            isStatutory: !!document.querySelector<HTMLInputElement>("#componentStatutory")?.checked,
            effectiveDate: val("componentEffectiveDate") || new Date().toISOString().slice(0, 10),
            endDate: val("componentEndDate") || null,
            currencyId: currencyId || null,
          }, id)
        }
        return { handled: true, reload: true, message: `${name} saved to the pay component catalogue.` }
      }

      case "import-pay-components": {
        const permission = await requirePermission("payroll.components.manage")
        if (permission) return permission
        const rows = (detail.rows ?? []).filter((row) => Array.isArray(row.issues) && row.issues.length === 0)
        if (!rows.length) return { handled: true, error: "There are no validated component rows to import." }
        const outcomes: Array<{ row: number; code: string; error?: string }> = []
        for (const row of rows) {
          try {
            if (row.kind === "EARNING") {
              await saveAllowanceType({
                name: String(row.name), code: String(row.code).toUpperCase(), description: String(row.description ?? ""),
                isTaxable: row.isTaxable !== false, glAccountId: row.glAccountId || null,
                calculationMethod: row.calculationMethod || "FIXED", calculationRate: row.calculationRate ?? null,
              })
            } else {
              await saveDeductionType({
                name: String(row.name), code: String(row.code).toUpperCase(), description: String(row.description ?? ""),
                glAccountId: row.glAccountId || null, rate: Number(row.rate) || 0,
                threshold: row.threshold ?? null, ceiling: row.ceiling ?? null, isStatutory: false,
                effectiveDate: row.effectiveDate || new Date().toISOString().slice(0, 10),
                endDate: row.endDate || null, currencyId: row.currencyId || null,
              })
            }
            outcomes.push({ row: Number(row.line) || 0, code: String(row.code) })
          } catch (error: any) {
            outcomes.push({ row: Number(row.line) || 0, code: String(row.code), error: error?.message || "Save failed" })
          }
        }
        const succeeded = outcomes.filter((outcome) => !outcome.error).length
        const failed = outcomes.filter((outcome) => outcome.error)
        if (!succeeded) return { handled: true, error: `No components were imported. ${failed.slice(0, 3).map((x) => `Row ${x.row} (${x.code}): ${x.error}`).join(" · ")}` }
        return {
          handled: true,
          reload: true,
          message: `Imported ${succeeded} component${succeeded === 1 ? "" : "s"}${failed.length ? `; ${failed.length} failed (${failed.slice(0, 3).map((x) => `row ${x.row} ${x.code}: ${x.error}`).join("; ")})` : "."}`,
        }
      }

      case "save-tax-rule": {
        const permission = await requirePermission("payroll.tax.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const name = val("taxRuleName")
        const type = val("taxRuleType")
        const rate = Number(val("taxRuleRate"))
        if (!name || !type || !Number.isFinite(rate) || rate < 0 || rate > 100) return { handled: true, error: "Enter a rule name, type and a rate between 0 and 100 percent." }
        if (val("taxRuleEndDate") && val("taxRuleEffectiveDate") && val("taxRuleEndDate") < val("taxRuleEffectiveDate")) return { handled: true, error: "The end date cannot be before the effective date." }
        for (const id of ["taxRuleThreshold", "taxRuleCeiling"]) {
          const raw = val(id)
          if (raw && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) return { handled: true, error: "Threshold and ceiling must be non-negative numbers." }
        }
        await saveTaxRule({
          name, type, rate,
          threshold: val("taxRuleThreshold") || null,
          ceiling: val("taxRuleCeiling") || null,
          effectiveDate: val("taxRuleEffectiveDate") || new Date().toISOString().slice(0, 10),
          endDate: val("taxRuleEndDate") || null,
          currencyId: val("taxRuleCurrencyId") || null,
          ...(val("taxRuleId") ? { isActive: val("taxRuleActive") !== "false" } : {}),
        }, val("taxRuleId") || undefined)
        return { handled: true, reload: true, message: `${name} saved.` }
      }

      case "save-component-assignment": {
        const permission = await requirePermission("payroll.components.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const employeeIds = Array.from(document.querySelector<HTMLSelectElement>("#componentAssignmentEmployees")?.selectedOptions ?? []).map(o => o.value)
        const componentId = val("componentAssignmentId"), kind = val("componentAssignmentKind")
        const amount = val("componentAssignmentAmount"), rate = val("componentAssignmentRate")
        const effectiveDate = val("componentAssignmentFrom"), endDate = val("componentAssignmentTo")
        if (!employeeIds.length || !componentId || !effectiveDate) return { handled: true, error: "Select at least one employee and an effective date." }
        if (endDate && endDate < effectiveDate) return { handled: true, error: "The end date cannot be before the effective date." }
        if ((amount && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) || (rate && (!Number.isFinite(Number(rate)) || Number(rate) < 0 || Number(rate) > 100)) || (amount && rate)) return { handled: true, error: "Enter either a non-negative fixed amount or a rate between 0 and 100 percent." }
        await assignPayrollComponent({ componentId, kind, employeeIds, amount: amount || null, rate: rate || null, currencyId: kind === "EARNING" ? val("componentAssignmentCurrency") || null : null, effectiveDate, endDate: endDate || null })
        return { handled: true, reload: true, message: `Component assigned to ${employeeIds.length} employee${employeeIds.length === 1 ? "" : "s"}.` }
      }

      case "save-statutory-bracket": {
        const permission = await requirePermission("payroll.tax.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const currencyCode = val("bracketCurrency")
        const lowerBound = Number(val("bracketLower"))
        const marginalRate = Number(val("bracketRate")) / 100
        const upperBound = val("bracketUpper") ? Number(val("bracketUpper")) : null
        const deductionOffset = Number(val("bracketOffset") || 0)
        if (!["USD", "ZIG"].includes(currencyCode.toUpperCase()) || !val("bracketLower") || !val("bracketRate") || !Number.isFinite(lowerBound) || lowerBound < 0 || !Number.isFinite(marginalRate) || marginalRate < 0 || marginalRate > 1 || !Number.isFinite(deductionOffset) || deductionOffset < 0 || (upperBound !== null && (!Number.isFinite(upperBound) || upperBound <= lowerBound))) return { handled: true, error: "Choose USD or ZiG, enter valid bounds and offset, and set a rate from 0 to 100 percent." }
        if (val("bracketEffectiveTo") && val("bracketEffectiveFrom") && val("bracketEffectiveTo") < val("bracketEffectiveFrom")) return { handled: true, error: "The end date cannot be before the effective date." }
        await saveStatutoryBrackets([{
          currencyCode: currencyCode.toUpperCase(), lowerBound, upperBound,
          marginalRate, deductionOffset,
          effectiveFrom: val("bracketEffectiveFrom") || new Date().toISOString().slice(0, 10),
          effectiveTo: val("bracketEffectiveTo") || null,
          isActive: val("bracketActive") !== "false",
        }], val("bracketId") || undefined)
        return { handled: true, reload: true, message: "PAYE bracket saved." }
      }

      case "save-statutory-levy": {
        const permission = await requirePermission("payroll.tax.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const levyCode = val("levyCode")
        const currencyCode = val("levyCurrency")
        if (!new Set(["NSSA_RATE", "NSSA_CEILING", "AIDS_RATE", "SDL_RATE"]).has(levyCode) || !["USD", "ZIG"].includes(currencyCode.toUpperCase())) return { handled: true, error: "Choose a supported statutory levy and currency (USD or ZiG)." }
        if (levyCode === "NSSA_CEILING" ? !val("levyCeiling") : !val("levyRate")) return { handled: true, error: levyCode === "NSSA_CEILING" ? "Enter the NSSA ceiling." : "Enter the levy rate." }
        if (val("levyRate") && (!Number.isFinite(Number(val("levyRate"))) || Number(val("levyRate")) < 0 || Number(val("levyRate")) > 100)) return { handled: true, error: "Levy rate must be between 0 and 100 percent." }
        if (val("levyCeiling") && (!Number.isFinite(Number(val("levyCeiling"))) || Number(val("levyCeiling")) < 0)) return { handled: true, error: "The statutory ceiling must be a non-negative number." }
        if (val("levyEffectiveTo") && val("levyEffectiveFrom") && val("levyEffectiveTo") < val("levyEffectiveFrom")) return { handled: true, error: "The end date cannot be before the effective date." }
        await saveStatutoryLevies([{
          levyCode, currencyCode: currencyCode.toUpperCase(), rate: val("levyRate") ? Number(val("levyRate")) / 100 : null,
          ceiling: val("levyCeiling") || null,
          effectiveFrom: val("levyEffectiveFrom") || new Date().toISOString().slice(0, 10), effectiveTo: val("levyEffectiveTo") || null, isActive: val("levyActive") !== "false",
        }])
        return { handled: true, reload: true, message: `${levyCode} configuration saved.` }
      }

      case "save-statutory-mapping": {
        const permission = await requirePermission("payroll.tax.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const deductionTypeId = val("statMappingType")
        if (!deductionTypeId) return { handled: true, error: "Select a statutory deduction component." }
        await saveStatutoryMapping({ deductionTypeId, glAccountId: val("statMappingAccount") || null })
        return { handled: true, reload: true, message: "Statutory account mapping saved." }
      }

      case "save-leave-balance": {
        const permission = await requirePermission("payroll.leave.manage")
        if (permission) return permission
        const value = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const employeeId = value("leaveEmployee")
        const leaveType = value("leaveType")
        const rawBalance = value("leaveBalance")
        const balance = Number(rawBalance)
        if (!employeeId || !leaveType || rawBalance === "" || !Number.isFinite(balance) || balance < 0) {
          return { handled: true, error: "Choose an employee and leave type, and enter a non-negative balance." }
        }
        await saveLeaveBalance({ employeeId, leaveType, balance })
        return { handled: true, reload: true, message: "Leave balance saved." }
      }

      case "save-training-course": {
        const permission = await requirePermission("payroll.training.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.value || "").trim()
        const code = val("courseCode").toUpperCase()
        const title = val("courseTitle")
        if (!code || !title) return { handled: true, error: "Course code and title are required." }
        const id = val("courseId") || undefined
        const renewal = Number(val("courseRenewal") || 12)
        if (!Number.isInteger(renewal) || renewal < 1) return { handled: true, error: "Renewal period must be a positive number of months." }
        await saveTrainingCourse({ ...(id ? {} : { code }), title, description: val("courseDescription"), renewalPeriodMonths: renewal, requiredPermissionCodes: val("coursePermissions").split(",").map((x) => x.trim()).filter(Boolean) }, id)
        return { handled: true, reload: true, message: `${title} saved to the training catalogue.` }
      }

      case "save-training-assignment": {
        const permission = await requirePermission("payroll.training.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const courseId = val("assignmentCourse")
        const scopeType = val("assignmentScope")
        const scopeValue = val("assignmentScopeValue")
        if (!courseId || !scopeType || (scopeType !== "ALL" && !scopeValue)) return { handled: true, error: "Select a course and specify the role or department scope." }
        await createTrainingAssignment({ courseId, scopeType, scopeValue: scopeType === "ALL" ? null : scopeValue })
        return { handled: true, reload: true, message: "Course assigned to the selected population." }
      }

      case "save-training-certification": {
        const permission = await requirePermission("payroll.training.manage")
        if (permission) return permission
        const val = (id: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const file = document.querySelector<HTMLInputElement>("#certDocument")?.files?.[0]
        const certificationId = val("certId")
        const employeeId = val("certEmployee")
        const courseId = val("certCourse")
        const issuedDate = val("certIssuedDate")
        const expirationDate = val("certExpirationDate")
        if (!employeeId || !courseId || !issuedDate || !expirationDate) return { handled: true, error: "Employee, course, issue date and expiry date are required." }
        if (!file) return { handled: true, error: "Attach the verified certificate before recording completion." }
        if (file.size > 15 * 1024 * 1024) return { handled: true, error: "Certificate evidence must be 15 MB or smaller." }
        if (file.type && file.type !== "application/pdf" && !file.type.startsWith("image/")) return { handled: true, error: "Choose a PDF or image for the certificate evidence." }
        if (new Date(expirationDate) < new Date(issuedDate)) return { handled: true, error: "Expiry date cannot be before the issue date." }
        const form = new FormData()
        form.append("employeeId", employeeId); form.append("courseId", courseId)
        form.append("issuedDate", issuedDate); form.append("expirationDate", expirationDate)
        if (file) form.append("document", file)
        if (certificationId) await renewEmployeeCertification(certificationId, form)
        else await createEmployeeCertification(form)
        return { handled: true, reload: true, message: certificationId ? "Certification renewed." : "Verified certification recorded." }
      }

      case "confirm-training-revoke":
      case "confirm-training-remove-assignment":
      case "confirm-training-deactivate-course": {
        const permission = await requirePermission("payroll.training.manage")
        if (permission) return permission
        const id = detail.dataset?.id
        if (!id) return { handled: true, error: "No training record was selected." }
        if (action === "confirm-training-revoke") await revokeEmployeeCertification(id)
        else if (action === "confirm-training-remove-assignment") await removeTrainingAssignment(id)
        else await deactivateTrainingCourse(id)
        closeRuntimeModal()
        return { handled: true, reload: true, message: action === "confirm-training-revoke" ? "Certification revoked." : action === "confirm-training-remove-assignment" ? "Training assignment removed." : "Course deactivated." }
      }

      case "save-employee": {
        const denied = await requirePermission("payroll.employees.manage")
        if (denied) return denied
        const id = detail.dataset?.recordId || detail.dataset?.id
        if (!id) return { handled: true, error: "No employee selected." }

        const val = (name: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(
            `#edit${name}, [name="edit${name}"]`,
          )?.value || "").trim()

        // Only send what the form actually carries: a blank field means "leave alone", not "clear".
        const body: Record<string, string> = {}
        for (const [field, key] of [
          ["BankName", "bankName"],
          ["BranchCode", "branchCode"],
          ["AccountNumber", "accountNumber"],
          ["BasicSalary", "basicSalary"],
          ["IdNumber", "idNumber"],
          ["TaxNumber", "zimraBpNumber"],
          ["Address", "address"],
          ["NextOfKin", "nextOfKin"],
        ] as const) {
          const v = val(field)
          if (v) body[key] = v
        }
        const photo = pickedPicture("editPicture")
        if (photo.error) return { handled: true, error: photo.error }
        const removePhoto = !!document.querySelector<HTMLInputElement>("#editRemovePicture")?.checked
        if (!Object.keys(body).length && !photo.file && !removePhoto) {
          return { handled: true, error: "Nothing to update — change a field first." }
        }

        if (photo.file || removePhoto) {
          const form = new FormData()
          Object.entries(body).forEach(([k, v]) => form.append(k, v))
          // An empty `pictureUrl` in the form body is how the backend is told to clear the photo.
          if (photo.file) form.append("picture", photo.file)
          else form.append("pictureUrl", "")
          await updateEmployee(id, form)
        } else {
          await updateEmployee(id, body)
        }
        return { handled: true, reload: true, message: "Employee updated." }
      }

      case "download-payslip":
      case "preview-payslip": {
        // The runtime built this PDF client-side from hardcoded content, so every employee got the
        // same invented payslip. The backend issues a real, hash-verified one.
        const id = detail.dataset?.payslipId || detail.dataset?.recordId || detail.dataset?.id
        if (!id) {
          return { handled: true, error: "No payslip selected." }
        }
        const blob = await downloadPayslipPdf(id)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const safe = (value: unknown) => String(value || "").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "Employee"
        a.download = `Payslip-${safe(detail.dataset?.employeeName)}-${safe(detail.dataset?.period)}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        return { handled: true, message: "Payslip downloaded." }
      }


      // ------------------------------------------------------ document vault
      case "confirm-upload": {
        // The runtime pushed an invented record — owner "Tariro Moyo", modified
        // "Just now" — onto an in-memory array and toasted success. Nothing was
        // stored anywhere (FINDING-017).
        const denied = await requirePermission("payroll.vault.manage")
        if (denied) return denied

        const file = document.querySelector<HTMLInputElement>("#pr6DocFile")?.files?.[0]
        if (!file) return { handled: true, error: "Choose a file to upload." }

        const val = (id: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const form = new FormData()
        form.append("file", file)
        form.append("category", val("pr6DocCategory"))
        form.append("classification", val("pr6DocClassification"))
        const period = val("pr6DocPeriod")
        if (period) form.append("periodLabel", period)

        const submit = document.querySelector<HTMLButtonElement>('#modalFoot [data-action="confirm-upload"]')
        const status = document.querySelector<HTMLElement>("#pr6UploadStatus")
        if (submit) {
          submit.disabled = true
          submit.setAttribute("aria-busy", "true")
          submit.textContent = "Uploading…"
        }
        if (status) {
          status.hidden = false
          status.textContent = `Uploading ${file.name} to the document vault. This may take a moment.`
        }

        try {
          await uploadPayrollDocument(form)
        } catch (error) {
          if (status) status.textContent = "Upload failed. Correct the issue and try again."
          throw error
        } finally {
          if (submit?.isConnected) {
            submit.disabled = false
            submit.removeAttribute("aria-busy")
            submit.textContent = "Upload"
          }
        }
        closeRuntimeModal()
        return { handled: true, reload: true, message: `${file.name} uploaded to the vault.` }
      }

      case "download-doc": {
        // Replaces a Word file the runtime generated in the browser from the fixture's
        // `content` text. This is the stored file, and the download is audited.
        const perms = await permissions()
        if (!perms.has("payroll.vault.view") && !perms.has("payroll.vault.manage")) {
          return { handled: true, error: `Your role does not have permission for ${REFUSAL["payroll.vault.view"]}.` }
        }
        const id = detail.dataset?.id
        if (!id) return { handled: true, error: "No document selected." }

        const { blob, filename } = await downloadPayrollDocument(id)
        const name = detail.dataset?.filename || filename || `payroll-document-${id}`
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = name
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return { handled: true, message: `${name} downloaded.` }
      }

      // ------------------------------------------------------- pay calendar
      case "save-period": {
        // The Edit control opened a schedule form pre-filled with July 2026 fixture
        // dates and saved nothing, and "Copy prior year" toasted a copy that never
        // happened. PUT /payroll/pay-groups/:id/periods existed all along.
        const denied = await requirePermission("payroll.calendar.manage")
        if (denied) return denied

        const val = (id: string) =>
          (document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value || "").trim()
        const groupId = val("pr6PeriodGroup")
        const periodLabel = val("pr6PeriodLabel")
        const periodStart = val("pr6PeriodStart")
        const periodEnd = val("pr6PeriodEnd")
        const missing: string[] = []
        if (!groupId) missing.push("pay group")
        if (!periodLabel) missing.push("period label")
        if (!periodStart) missing.push("period start")
        if (!periodEnd) missing.push("period end")
        if (missing.length) {
          return { handled: true, error: `Cannot save the period — missing ${missing.join(", ")}.` }
        }
        if (periodEnd < periodStart) return { handled: true, error: "The period end cannot be before its start." }
        const cutoffDate = val("pr6PeriodCutoff")
        const payDate = val("pr6PeriodPayDate")
        if (cutoffDate && payDate && cutoffDate > payDate) return { handled: true, error: "The input cut-off cannot be after the pay date." }

        await upsertPayrollCalendarPeriod(groupId, {
          periodLabel,
          periodStart,
          periodEnd,
          cutoffDate: cutoffDate || null,
          payDate: payDate || null,
          status: val("pr6PeriodStatus") || "PLANNED",
        })
        closeRuntimeModal()
        return { handled: true, reload: true, message: `${periodLabel} saved.` }
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
