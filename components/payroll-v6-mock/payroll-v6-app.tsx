"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  pathToPr6Page,
  PR6_PAGE_TO_PATH,
} from "@/lib/payroll-v6-mock/nav"
import { startPayrollV6Runtime } from "@/components/payroll-v6-mock/matanho-payroll-runtime"
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
  "commit-inputs",
  "release-payroll",
  "download-close-pack",
])

const API_ACTIONS = new Set([
  // Payroll run lifecycle
  "create-run",
  "continue-run",
  "approve-payroll",
  "reject-payroll",
  "commit-inputs",
  "release-payroll",
  "download-close-pack",
  // Employee lifecycle
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
  "terminate-employee",
  // Document vault: a real upload and the stored file, not an in-memory record and a
  // Word file generated in the browser (FINDING-017).
  "confirm-upload",
  "download-doc",
  // Pay calendar: periods persist through PUT /payroll/pay-groups/:id/periods.
  "save-period",
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
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  const actionBusyRef = useRef(false)
  const liveRef = useRef<PayrollV6LivePayload | null>(null)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPr6Page(pathnameRef.current)
    apiRef.current = startPayrollV6Runtime(el, {
      shellHtml: PAYROLL_V6_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PR6_PAGE_TO_PATH[page] || "/payroll"
        if (pathnameRef.current !== path) router.push(path)
      },
    })

    const loadLive = () => {
      void loadPayrollV6LiveData()
        .then((payload) => {
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

      if (actionBusyRef.current) return
      actionBusyRef.current = true

      const live = liveRef.current
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

      void handlePayrollV6Action(detail, { currentRunId, currencyId })
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
          // A saved form closes with its drawer (the runtime closes both on Escape). Left open, the form kept
          // its chosen photo file and a second click on Save would upload it again.
          if (result.reload && (action === "save-employee" || action === "complete-onboarding")) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
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

    window.addEventListener("matanho:before-action", onBeforeAction)
    window.addEventListener("payroll-v6:reload-request", onReload)

    return () => {
      window.removeEventListener("matanho:before-action", onBeforeAction)
      window.removeEventListener("payroll-v6:reload-request", onReload)
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
