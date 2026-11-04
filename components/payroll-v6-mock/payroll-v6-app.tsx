"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { downloadAc52Export, type Ac52ExportKind } from "@/lib/accounting-v52/export"
import { cashbookApi } from "@/lib/api/cashbook-api"
import { activatePayrollAccessRole, assignPayrollAccessRole, createEmployeeWithUser, createPayrollAccessRole, generatePayrollReport, getPayrollAccessRoster, getPayrollRun, listAuditEvents, listPayrollAssignableUsers, listPayrollCurrencies, listPayrollReports, recordPayrollAuditExport, removePayrollAccessRole, savePayrollAccessRoleDraft, setPayrollAccessRoleStatus } from "@/lib/api/payroll-v6-api"
import {
  pathToPr6Page,
  PR6_PAGE_TO_PATH,
} from "@/lib/payroll-v6-mock/nav"
import { startPayrollV6Runtime } from "@/components/payroll-v6-mock/matanho-payroll-runtime"
import { downloadBrandedPayslipPdf } from "@/lib/payroll-v6/payslip-export"
import { PAYROLL_V6_SHELL_HTML } from "@/components/payroll-v6-mock/shell"
import {
  loadPayrollV6LiveData,
  type PayrollV6LivePayload,
} from "@/lib/payroll-v6/live-loaders"
import {
  handlePayrollV6Action,
  resetPayrollActionCache,
} from "@/lib/payroll-v6/actions"
import "@/components/payroll-v6-mock/payroll-v6.css"
import "@/components/payroll-v6-mock/payroll-v6-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
  hydrate?: (payload: unknown) => void
  failLiveLoad?: (message?: string) => void
}

function downloadPayrollExport(kind: Ac52ExportKind, spec: Parameters<typeof downloadAc52Export>[1]) {
  const note = spec.note?.replace(/\s*Local and development exports use Matanho branding; production exports use NVCCZ branding\./gi, "")
  return downloadAc52Export(kind, { ...spec, note, letterhead: "nvccz-payroll" })
}

/**
 * Action ids routed to the real API. Everything else keeps the runtime's own
 * behaviour — either legitimate view state (tabs, filters, drawers, modals,
 * CSV exports built from data already on screen) or a screen with no backend
 * behind it yet, which is recorded in
 * design-refs/payroll-v6-action-inventory.md rather than left to guesswork.
 */
const RUN_ACTIONS = new Set([
  "continue-run",
  "approve-payroll",
  "reject-payroll",
  "record-decision",
  "commit-inputs",
  "release-payroll",
  "download-close-pack",
])

const API_ACTIONS = new Set([
  // Payroll run lifecycle
  "save-run",
  "create-run",
  "continue-run",
  "approve-payroll",
  "reject-payroll",
  "record-decision",
  "commit-inputs",
  "release-payroll",
  "download-close-pack",
  // Employee lifecycle
  "save-onboarding",
  "complete-onboarding",
  "suspend-employee",
  "reinstate-employee",
  // Employee update. `edit-employee` itself is deliberately NOT here: it opens
  // the form (client-side) and `save-employee` submits it, the same split the
  // pay-group controls use. Claiming the opener meant the form never opened
  // and the handler found no fields to read.
  "save-employee",
  // Payslip: the runtime built a PDF client-side from hardcoded content.
  "download-payslip",
  "preview-payslip",
  // Pay group creation: the control opened a modal with no fields.
  "save-paygroup",
  "update-paygroup",
  "save-pay-component",
  "import-pay-components",
  "save-component-assignment",
  "save-tax-rule",
  "save-statutory-bracket",
  "save-statutory-levy",
  "save-statutory-mapping",
  "save-leave-balance",
  "save-training-course",
  "save-training-assignment",
  "save-training-certification",
  "confirm-training-revoke",
  "confirm-training-remove-assignment",
  "confirm-training-deactivate-course",
  "terminate-employee",
  // Document vault: a real upload and the stored file, not an in-memory record and a
  // Word file generated in the browser (FINDING-017).
  "confirm-upload",
  "download-doc",
  // Pay calendar: periods persist through PUT /payroll/pay-groups/:id/periods.
  "save-period",
  "save-bank-template",
  "delete-bank-template",
])

/** Hand a generated file to the browser. */
function saveFile(filename: string, content: string, mime: string) {
  try {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    toast.error("Could not save the generated file")
  }
}

export function PayrollV6App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const actionBusyRef = useRef(false)
  const liveRef = useRef<PayrollV6LivePayload | null>(null)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let disposed = false
    let latestLoad = 0
    const exportEmployees = async (kind: Ac52ExportKind, rows: (string | number)[][]) => {
      try {
        const filename = await downloadPayrollExport(kind, {
          title: "Employee Directory and Payroll Readiness",
          subtitle: "Employee register exported from the Payroll module.",
          columns: ["Employee ID", "Employee", "Department", "Branch", "Contract", "Compensation", "Readiness", "Status"],
          rows,
          filename: "payroll-employee-register",
          landscape: true,
          note: "Salary values follow the signed-in user's payroll access permissions. Local and development exports use Matanho branding; production exports use NVCCZ branding.",
        })
        toast.success("Employee register exported", { description: filename })
      } catch (err: any) {
        toast.error("Employee register export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_EMPLOYEES__ = exportEmployees
    ;(window as any).__PAYROLL_V6_EXPORT_MYPAY__ = async (kind: Ac52ExportKind, spec: Parameters<typeof downloadAc52Export>[1]) => {
      try { await downloadPayrollExport(kind, spec); toast.success("Your payroll information exported") }
      catch (err: any) { toast.error("Payroll export failed", { description: err?.message || String(err) }) }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_OVERVIEW__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Payroll report exported", { description: filename })
      } catch (err: any) {
        toast.error("Payroll export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_RUNS__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Payroll runs exported", { description: filename })
      } catch (err: any) {
        toast.error("Payroll run export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_APPROVAL__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Payroll approval review exported", { description: filename })
      } catch (err: any) {
        toast.error("Approval review export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_CLOSE__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Payroll close report exported", { description: filename })
      } catch (err: any) {
        toast.error("Payroll close export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_EXCEPTIONS__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Exception register exported", { description: filename })
      } catch (err: any) {
        toast.error("Exception register export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_COMPONENTS__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Component catalogue exported", { description: filename })
      } catch (err: any) {
        toast.error("Component catalogue export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_SETTINGS__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Bank file template register exported", { description: filename })
      } catch (err: any) {
        toast.error("Settings export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_CALENDAR__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Pay calendar exported", { description: filename })
      } catch (err: any) {
        toast.error("Pay calendar export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_TAX__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Tax and statutory register exported", { description: filename })
      } catch (err: any) {
        toast.error("Tax and statutory export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_TRAINING__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Training register exported", { description: filename })
      } catch (err: any) {
        toast.error("Training export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_LEAVE__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Leave register exported", { description: filename })
      } catch (err: any) {
        toast.error("Leave register export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_VAULT__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Document register exported", { description: filename })
      } catch (err: any) {
        toast.error("Document register export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_LIST_REPORTS__ = async (params: any = {}) => listPayrollReports(params)
    ;(window as any).__PAYROLL_V6_GENERATE_REPORT__ = async (input: any) => generatePayrollReport(input)
    ;(window as any).__PAYROLL_V6_LIST_AUDIT__ = async (params: any = {}) => listAuditEvents(params)
    ;(window as any).__PAYROLL_V6_REFRESH_ACCESS__ = async () => getPayrollAccessRoster()
    ;(window as any).__PAYROLL_V6_ACCESS_USERS__ = async (params: any = {}) => listPayrollAssignableUsers(params)
    ;(window as any).__PAYROLL_V6_CREATE_ACCESS_ROLE__ = async (input: any) => createPayrollAccessRole(input)
    ;(window as any).__PAYROLL_V6_SAVE_ACCESS_ROLE__ = async (roleId: string, permissions: Record<string, boolean>, revision: number, description?: string) => savePayrollAccessRoleDraft(roleId, permissions, revision, description)
    ;(window as any).__PAYROLL_V6_ACTIVATE_ACCESS_ROLE__ = async (roleId: string, revision: number) => activatePayrollAccessRole(roleId, revision)
    ;(window as any).__PAYROLL_V6_SET_ACCESS_ROLE_STATUS__ = async (roleId: string, enabled: boolean, revision: number) => setPayrollAccessRoleStatus(roleId, enabled, revision)
    ;(window as any).__PAYROLL_V6_ASSIGN_ACCESS_ROLE__ = async (userId: string, roleId: string) => assignPayrollAccessRole(userId, roleId)
    ;(window as any).__PAYROLL_V6_REMOVE_ACCESS_ROLE__ = async (userId: string) => removePayrollAccessRole(userId)
    ;(window as any).__PAYROLL_V6_EXPORT_ACCESS__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Payroll access register exported", { description: filename })
      } catch (err: any) {
        toast.error("Payroll access export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_AUDIT__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        try { await recordPayrollAuditExport(kind) } catch (err: any) {
          toast.warning("Audit export completed, but the action could not be recorded", { description: err?.message || String(err) })
        }
        toast.success("Audit evidence exported", { description: filename })
      } catch (err: any) {
        toast.error("Audit export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_EXPORT_REPORT__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Compliance report exported", { description: filename })
      } catch (err: any) {
        toast.error("Report export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_GET_BANKS__ = async () => {
      const response: any = await cashbookApi.getCashbookBanks()
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
    }
    ;(window as any).__PAYROLL_V6_GET_PAYMENT__ = async (period: string, runName: string) => {
      const response: any = await cashbookApi.getCashbookEntries({ type: "PAYMENT", search: period, limit: 100 })
      const data = response?.data ?? response
      const entries = Array.isArray(data?.entries) ? data.entries : []
      const periodRef = `PAYROLL-PAY-${String(period).replace(/\s+/g, "-").toUpperCase()}-`
      const description = `Payroll Payment - Net Wages: ${runName} (${period})`
      return entries.find((entry: any) =>
        String(entry.reference || "").startsWith(periodRef) && String(entry.description || "") === description,
      ) ?? null
    }
    ;(window as any).__PAYROLL_V6_GET_RUN__ = (id: string) => getPayrollRun(id)
    ;(window as any).__PAYROLL_V6_EXPORT_ONBOARDING__ = async (
      kind: Ac52ExportKind,
      spec: Parameters<typeof downloadAc52Export>[1],
    ) => {
      try {
        const filename = await downloadPayrollExport(kind, spec)
        toast.success("Onboarding register exported", { description: filename })
      } catch (err: any) {
        toast.error("Onboarding export failed", { description: err?.message || String(err) })
      }
    }
    ;(window as any).__PAYROLL_V6_IMPORT_EMPLOYEES__ = async (records: Record<string, any>[]) => {
      const currencies = await listPayrollCurrencies()
      const results: Array<{ ok: boolean; credentialEmailSent?: boolean; message?: string; email: string; employeeNumber: string }> = []
      for (const row of records) {
        try {
          const currency = currencies.find((c) => row.currencyId ? c.id === row.currencyId : String(c.code || c.currencyCode || "").toUpperCase() === String(row.currencyCode || "").toUpperCase())
          const created: any = await createEmployeeWithUser({
            firstName: row.firstName, lastName: row.lastName, email: row.email,
            employeeNumber: row.employeeNumber, basicSalary: Number(row.basicSalary),
            departmentCode: row.departmentCode || null, position: row.position || null,
            contractEffectiveDate: row.startDate || undefined,
            currencyId: currency?.id || row.currencyId || null,
            salarySplitUsdPct: Number(row.salarySplitUsdPct || 100) / 100,
            salarySplitZigPct: Number(row.salarySplitZigPct || 0) / 100,
          })
          results.push({ ok: true, credentialEmailSent: created?.credentialEmailSent !== false, email: row.email, employeeNumber: row.employeeNumber })
        } catch (err: any) {
          results.push({ ok: false, email: row.email, employeeNumber: row.employeeNumber, message: err?.message || "Employee could not be created." })
        }
      }
      return results
    }

    const initialPage = pathToPr6Page(pathnameRef.current)
    apiRef.current = startPayrollV6Runtime(el, {
      shellHtml: PAYROLL_V6_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PR6_PAGE_TO_PATH[page] || "/payroll"
        if (pathnameRef.current === path) return false
        // This is a single embedded workspace with URL-addressable screens. A
        // Next navigation fetches the hidden page segment and can suspend its
        // shared layout, tearing down the runtime. Use the native History
        // method directly (bypassing Next's patched wrapper) and let goPage
        // render the target screen in-place. popstate below keeps Back/Forward
        // synchronized with the runtime.
        History.prototype.pushState.call(window.history, null, "", path)
        pathnameRef.current = path
        return false
      },
    })

    const loadLive = () => {
      const loadId = ++latestLoad
      void loadPayrollV6LiveData()
        .then((payload) => {
          // Strict Mode and explicit refreshes can overlap. Never let an older
          // request (especially a transient access-service failure) replace a
          // newer successful payload or update a runtime that has been torn down.
          if (disposed || loadId !== latestLoad) return
          liveRef.current = payload
          apiRef.current?.hydrate?.(payload)
          ;(window as any).MatanhoUI?.hydrate?.(payload)

          // Surface loader failures instead of rendering a quietly empty page.
          // A 403 is expected for screens the current role cannot see. A 404 from
          // the "employee/*" self-service sources means this account (e.g. an
          // admin/system login) has no linked payroll employee record, which is
          // just as expected -- every signed-in user gets a My Pay page attempt,
          // not every user is an employee. Both are notices, not failures.
          const hard = payload.errors.filter(
            (e) => e.status !== 403 && !(e.status === 404 && e.source.startsWith("employee/")),
          )
          if (hard.length) {
            toast.error(
              hard.length === 1
                ? `Could not load ${hard[0].source}`
                : `Could not load ${hard.length} payroll data sources`,
              { description: hard.map((e) => `${e.source}: ${e.message}`).slice(0, 4).join(" · ") },
            )
          }
        })
        .catch((err) => {
          if (disposed || loadId !== latestLoad) return
          apiRef.current?.failLiveLoad?.(err?.message ?? "Payroll data could not be loaded.")
          toast.error("Payroll data could not be loaded", {
            description: err?.message ?? "Unknown error",
          })
        })
    }
    loadLive()

    const onBeforeAction = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const action = String(detail.action || "")
      if (!API_ACTIONS.has(action)) return

      // Claim the action so the runtime's mock handler never runs for it.
      event.preventDefault()

      // Suspend/terminate confirm HERE, in the one dispatcher, not as an onclick on the
      // button: this listener is registered on `window` and the runtime's own
      // document-level `[data-action]` bridge runs in the CAPTURE phase (see
      // matanho-payroll-runtime.js's `matanho:before-action` wiring) — once it sees
      // preventDefault() was called for an allowlisted action, it calls
      // event.stopImmediatePropagation() on the original click before the event ever
      // reaches the button's own listeners, including an inline onclick. A first version
      // of this fix put the confirm() in the button's onclick attribute and it silently
      // never ran (verified live: Cancel didn't stop anything, the employee was
      // suspended immediately with no dialog ever appearing) for exactly that reason.
      if (action === "suspend-employee" || action === "terminate-employee") {
        const message =
          action === "suspend-employee"
            ? "Suspend this employee? They will not be paid in the next run until reinstated."
            : "Terminate this employee? This closes their record and cannot be undone from here."
        if (!window.confirm(message)) return
      }
      if (action === "delete-bank-template" && !window.confirm("Delete this bank payment file template? Payroll runs will no longer be able to generate files from it.")) return

      if (actionBusyRef.current) return
      actionBusyRef.current = true

      const live = liveRef.current
      if (action === "download-payslip" || action === "preview-payslip") {
        if (!live) {
          actionBusyRef.current = false
          toast.info("Payslip data is still loading — try again in a moment.")
          return
        }
        const payslips: any[] = live.mypay?.payslips ?? []
        const payslip = payslips.find((row) => String(row.id) === String(detail.dataset?.payslipId || ""))
        if (!payslip) {
          actionBusyRef.current = false
          toast.error("This payslip is no longer available. Refresh the page and try again.")
          return
        }
        void downloadBrandedPayslipPdf({
          period: String(detail.dataset?.period || payslip.period || "Payslip"),
          employeeName: String(detail.dataset?.employeeName || live.mypay?.self?.name || "Employee"),
          employeeNumber: String(live.mypay?.self?.employeeNumber || payslip.employeeNumber || "—"),
          department: String(live.mypay?.self?.department || "—"),
          paymentDate: String(payslip.payDate || "—").slice(0, 10),
          currency: String(payslip.currency || "USD").toUpperCase(),
          gross: Number(payslip.gross) || 0,
          deductions: Number(payslip.deductions) || 0,
          net: Number(payslip.net) || 0,
        }).then((filename) => {
          toast.success("Branded payslip downloaded", { description: filename })
        }).catch((err: any) => {
          toast.error("Payslip download failed", { description: err?.message || String(err) })
        }).finally(() => {
          actionBusyRef.current = false
        })
        return
      }
      if (!live && RUN_ACTIONS.has(action)) {
        actionBusyRef.current = false
        toast.info("Payroll data is still loading — try again in a moment.")
        return
      }
      // Each run action targets the newest run that is in the state that action works on (submit → a draft,
      // approve/reject → one awaiting approval, process → an approved one), not simply the newest by start date.
      // Taking runs[0] blindly acted on whichever run was dated latest — with a future-dated released run on
      // record, "Continue payroll run" answered "Only DRAFT runs can be submitted" about the wrong run.
      // Runs are newest first; falls back to the newest overall so the backend still gives its own refusal.
      const stateFor: Record<string, string> = {
        "continue-run": "DRAFT",
        "approve-payroll": "PENDING_APPROVAL",
        "reject-payroll": "PENDING_APPROVAL",
        "record-decision": "PENDING_APPROVAL",
        "commit-inputs": "APPROVED",
      }
      const runs: any[] = live?.payrollRuns ?? []
      const wanted = stateFor[action]
      const currentRunId =
        (wanted ? runs.find((r) => r.rawStatus === wanted)?.id : undefined) ?? runs[0]?.id ?? null
      const currencyId =
        (live?.employees?.[0] as any)?.currencyId ??
        (live?.reference?.bankTemplates?.[0] as any)?.currencyId ??
        null

      const actionDetail = action === "import-pay-components"
        ? { ...detail, rows: ((window as any).__payrollComponentImportRows ?? []) as Record<string, any>[] }
        : detail
      void handlePayrollV6Action(actionDetail, { currentRunId, currencyId })
        .then((result) => {
          actionBusyRef.current = false
          if (!result.handled) return

          if (result.error) {
            toast.error(result.error)
            return
          }
          if (result.download) {
            saveFile(result.download.filename, result.download.content, result.download.mime)
          }
          if (result.message) toast.success(result.message)
          if (action === "release-payroll" && result.data) {
            window.dispatchEvent(new CustomEvent("payroll-v6:payment-recorded", { detail: result.data }))
          }
          // A saved form closes with its drawer (the runtime closes both on Escape). Left open, the form kept
          // its chosen photo file and a second click on Save would upload it again.
          if (result.reload && ["save-run", "create-run", "record-decision", "save-employee", "save-onboarding", "complete-onboarding", "save-paygroup", "update-paygroup", "save-period", "save-pay-component", "import-pay-components", "save-component-assignment", "save-tax-rule", "save-statutory-bracket", "save-statutory-levy", "save-statutory-mapping", "save-leave-balance", "save-training-course", "save-training-assignment", "save-training-certification"].includes(action)) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
          }
          if (result.navigate) {
            const path = PR6_PAGE_TO_PATH[result.navigate] || "/payroll"
            if (pathnameRef.current !== path) {
              History.prototype.pushState.call(window.history, null, "", path)
              pathnameRef.current = path
            }
            apiRef.current?.setPage(result.navigate)
          }
          if (result.reload) {
            resetPayrollActionCache()
            loadLive()
          }
        })
        .catch((err) => {
          actionBusyRef.current = false
          toast.error(err?.message ?? "Payroll action failed")
        })
    }

    const onReload = () => loadLive()
    const onPopState = () => {
      const nextPath = window.location.pathname
      pathnameRef.current = nextPath
      apiRef.current?.setPage(pathToPr6Page(nextPath))
    }

    window.addEventListener("matanho:before-action", onBeforeAction)
    window.addEventListener("payroll-v6:reload-request", onReload)
    window.addEventListener("popstate", onPopState)

    return () => {
      disposed = true
      latestLoad += 1
      window.removeEventListener("matanho:before-action", onBeforeAction)
      window.removeEventListener("payroll-v6:reload-request", onReload)
      window.removeEventListener("popstate", onPopState)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.setPage(pathToPr6Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="payroll-v6-root h-full"
      data-theme="light"
    />
  )
}
