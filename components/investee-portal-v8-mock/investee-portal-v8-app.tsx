"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToIp8Page,
  IP8_PAGE_TO_PATH,
} from "@/lib/investee-portal-v8-mock/nav"
import { startInvesteePortalV8Runtime } from "@/components/investee-portal-v8-mock/matanho-investee-portal-runtime"
import { INVESTEE_PORTAL_V8_SHELL_HTML } from "@/components/investee-portal-v8-mock/shell"
import "@/components/investee-portal-v8-mock/investee-portal-v8.css"
import "@/components/investee-portal-v8-mock/investee-portal-v8-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function InvesteePortalV8App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToIp8Page(pathnameRef.current)
    apiRef.current = startInvesteePortalV8Runtime(el, {
      shellHtml: INVESTEE_PORTAL_V8_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = IP8_PAGE_TO_PATH[page] || "/investee-portal-v8"
        if (pathnameRef.current !== path) router.push(path)
      },
    })

    return () => {
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
