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
        const path = AC52_PAGE_TO_PATH[page] || "/accounting-v52"
        if (pathnameRef.current !== path) router.push(path)
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
      const LIVE_ACTIONS = new Set(["coa-save"])
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
        loadedScopesRef.current.delete("coa")
        await ensurePageDataRef.current?.(pathToAc52Page(pathnameRef.current))
        runtime.commitSuccess?.("Chart of Accounts updated", result.message, "coa")
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
