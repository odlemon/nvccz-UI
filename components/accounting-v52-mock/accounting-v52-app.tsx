"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToAc52Page,
  AC52_PAGE_TO_PATH,
} from "@/lib/accounting-v52-mock/nav"
import { startAccountingV52Runtime } from "@/components/accounting-v52-mock/matanho-accounting-runtime"
import { ACCOUNTING_V52_SHELL_HTML } from "@/components/accounting-v52-mock/shell"
import { loadAc52Scopes, scopesForAc52Page, type Ac52DataScope } from "@/lib/accounting-v52/live-loaders"
import { handleAccountingV52Action } from "@/lib/accounting-v52/actions"
import type { Ac52Account } from "@/lib/accounting-v52/types"
import "@/components/accounting-v52-mock/accounting-v52.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
  hydrate?: (payload: unknown) => void
  beginLiveLoad?: () => void
  endLiveLoad?: () => void
  failLiveLoad?: (message?: string) => void
  commitSuccess?: (title: string, message?: string, pageId?: string) => void
  commitError?: (err: unknown) => void
}

export function AccountingV52App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const loadedScopesRef = useRef<Set<Ac52DataScope>>(new Set())
  const accountsCacheRef = useRef<Ac52Account[]>([])
  const busyRef = useRef(false)
  const ensurePageDataRef = useRef<null | ((page: string) => Promise<void>)>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToAc52Page(pathnameRef.current)
    // The runtime fires a couple of internal render passes at startup before its
    // page state settles on `initialPage` (early version-layer setup code renders
    // against the constructor's default page first). Each render calls onNavigate,
    // so without this guard a deep link (initialPage !== 'overview') gets bounced
    // to the root route before the runtime ever shows the real page. Ignore nav
    // calls that don't match initialPage until we've seen one that does.
    let hasSettledOnInitialPage = initialPage === "overview"
    const runtime = startAccountingV52Runtime(el, {
      shellHtml: ACCOUNTING_V52_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        if (!hasSettledOnInitialPage) {
          if (page !== initialPage) return
          hasSettledOnInitialPage = true
        }
        // Pages with no entry (e.g. the V11 Period Close system's internal drill-down ids
        // like 'v11ws'/'v11task') are client-side-only sub-views nested inside a mapped
        // page's URL (e.g. '/accounting/close') — the runtime re-renders in place without
        // changing the Next.js route, so there's nothing to push here.
        const path = AC52_PAGE_TO_PATH[page]
        if (path && pathnameRef.current !== path) router.push(path)
        void ensurePageDataRef.current?.(page)
      },
    })
    apiRef.current = runtime

    ensurePageDataRef.current = async (page: string) => {
      const plan = scopesForAc52Page(page)
      const primary = plan.primary.filter((s) => !loadedScopesRef.current.has(s))
      if (!primary.length) return
      runtime.beginLiveLoad?.()
      try {
        const payload = await loadAc52Scopes(primary)
        if (apiRef.current !== runtime) return
        if (Array.isArray(payload.data?.accounts)) accountsCacheRef.current = payload.data!.accounts!
        runtime.hydrate?.(payload)
        for (const s of primary) loadedScopesRef.current.add(s)
        runtime.endLiveLoad?.()
        if (payload.meta.errors.length) {
          runtime.failLiveLoad?.(payload.meta.errors.join("; "))
        }
      } catch (err: any) {
        runtime.failLiveLoad?.(err?.message || "Failed to load live accounting data.")
      }
    }

    const onBeforeAction = (event: Event) => {
      const ce = event as CustomEvent
      const detail = ce.detail || {}
      const action = String(detail.action || "")
      const LIVE_ACTIONS = new Set(["coa-save", "upload-document", "close-task-complete", "timesheet-approve", "timesheet-return", "create-tax-pack", "approval-decision", "journal-submit"])
      if (!LIVE_ACTIONS.has(action)) return
      event.preventDefault()
      if (busyRef.current) return
      busyRef.current = true

      const payload = { ...(detail.payload || {}) }
      if (action === "coa-save" && payload.original) {
        const match = accountsCacheRef.current.find((a) => a.code === payload.original)
        if (match?.backendId) payload.backendId = match.backendId
      }

      void handleAccountingV52Action({ action, payload }).then(async (result) => {
        busyRef.current = false
        if (result.error) {
          runtime.commitError?.(new Error(result.error))
          return
        }
        if (!result.handled) return
        // Re-fetch so the UI reflects the authoritative saved row (server-assigned ids, validation-normalised fields).
        // A journal's status (submit/post/void) feeds many other pages that all read the same
        // ledger — Command Centre and General Ledger both list recent journals, Cash/Reconciliation
        // derive bank balances from posted lines, and Financial Reports/Trial Balance are built
        // from the full journal set. Any action that touches a journal must invalidate all of them,
        // not just the scope of the page the action was triggered from — a prior version of this
        // only invalidated "approvals" on approval-decision, leaving Command Centre showing a
        // journal as "Submitted" for the rest of the session after it had actually been voided.
        const JOURNAL_DEPENDENT_SCOPES: Ac52DataScope[] = ["journals", "approvals", "cash", "reconciliation", "statements"]
        const ACTION_SCOPE: Record<string, { scopes: Ac52DataScope[]; title: string }> = {
          "coa-save": { scopes: ["coa"], title: "Chart of Accounts updated" },
          "upload-document": { scopes: ["vault"], title: "Document uploaded" },
          "close-task-complete": { scopes: ["close"], title: "Close task completed" },
          "timesheet-approve": { scopes: ["timesheets"], title: "Timesheet approved" },
          "timesheet-return": { scopes: ["timesheets"], title: "Timesheet returned" },
          "create-tax-pack": { scopes: ["compliance"], title: "Tax pack created" },
          // Approving/rejecting can post or void a journal, execute a payment (cash/payables),
          // book an investment, or apply a CoA change — invalidate broadly rather than guess which.
          "approval-decision": { scopes: [...JOURNAL_DEPENDENT_SCOPES, "coa", "payables", "investments"], title: "Approval processed" },
          "journal-submit": { scopes: JOURNAL_DEPENDENT_SCOPES, title: "Journal submitted" },
        }
        const meta = ACTION_SCOPE[action] || { scopes: ["coa"] as Ac52DataScope[], title: "Updated" }
        for (const scope of meta.scopes) loadedScopesRef.current.delete(scope)
        await ensurePageDataRef.current?.(pathToAc52Page(pathnameRef.current))
        runtime.commitSuccess?.(meta.title, result.message, meta.scopes[0])
      })
    }

    window.addEventListener("matanho:before-action", onBeforeAction)
    void ensurePageDataRef.current(initialPage)

    return () => {
      window.removeEventListener("matanho:before-action", onBeforeAction)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const page = pathToAc52Page(pathname)
    apiRef.current?.setPage(page)
    void ensurePageDataRef.current?.(page)
  }, [pathname])

  return <div ref={rootRef} className="accounting-v52-root h-full" />
}
