"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToIp8Page,
  IP8_PAGE_TO_PATH,
} from "@/lib/investee-portal-v8-mock/nav"
import { startInvesteePortalV8Runtime } from "@/components/investee-portal-v8-mock/matanho-investee-portal-runtime"
import { INVESTEE_PORTAL_V8_SHELL_HTML } from "@/components/investee-portal-v8-mock/shell"
import { loadInvesteePortalLiveData } from "@/lib/investee-portal-v8/live-loaders"
import { handleInvesteePortalV8Action } from "@/lib/investee-portal-v8/actions"
import "@/components/investee-portal-v8-mock/investee-portal-v8.css"
import "@/components/investee-portal-v8-mock/investee-portal-v8-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
  hydrate?: (payload: unknown) => void
}

const API_ACTIONS = new Set([
  "complete-signature",
  "v15-apply-signature",
  "sign-term-sheet",
  "api-sign-term-sheet",
  "submit-period-kpis",
  "complete-kpi-submit",
  "download-template",
  "save-structured-report",
  "submit-structured-report",
  "final-submit-report",
  "upload-financial-report-file",
  "submit-financial-report-bundle",
  "save-settings",
  "delete-letterhead",
  "create-request",
  "submit-capital-request",
])

export function InvesteePortalV8App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  const actionBusyRef = useRef(false)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToIp8Page(pathnameRef.current)
    apiRef.current = startInvesteePortalV8Runtime(el, {
      shellHtml: INVESTEE_PORTAL_V8_SHELL_HTML,
      initialPage,
      liveOnly: true,
      onNavigate: (page: string) => {
        const path = IP8_PAGE_TO_PATH[page] || "/investee-portal-v8"
        if (pathnameRef.current !== path) router.push(path)
      },
    })

    const loadLive = () => {
      void loadInvesteePortalLiveData().then((payload) => {
        apiRef.current?.hydrate?.(payload)
        window.MatanhoInvesteeUI?.hydrate?.(payload)
      })
    }
    loadLive()

    const onBeforeAction = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const action = String(detail.action || "")
      if (!API_ACTIONS.has(action) && !action.startsWith("api-")) return
      event.preventDefault()
      if (actionBusyRef.current) return
      actionBusyRef.current = true
      window.MatanhoInvesteeUI?.notify?.("Working…", "Saving to the API.", "info")
      void handleInvesteePortalV8Action(detail).then((result) => {
        actionBusyRef.current = false
        if (result.error) {
          window.MatanhoInvesteeUI?.notify?.("Request failed", result.error, "error")
          return
        }
        if (!result.handled) return
        if (result.message) {
          window.MatanhoInvesteeUI?.notify?.(result.message, "Workspace refreshed from API.", "success")
        }
      })
    }

    window.addEventListener("investee:reload-request", loadLive)
    window.addEventListener("matanho:before-action", onBeforeAction)

    return () => {
      window.removeEventListener("investee:reload-request", loadLive)
      window.removeEventListener("matanho:before-action", onBeforeAction)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.setPage(pathToIp8Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="investee-portal-v8-root h-full"
      data-theme="light"
    />
  )
}
