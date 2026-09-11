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
      if (actionBusyRef.current) return
      actionBusyRef.current = true

      const live = liveRef.current
      // The newest run is the one the command centre and approval screens act on.
      const currentRunId = live?.payrollRuns?.[0]?.id ?? null
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
