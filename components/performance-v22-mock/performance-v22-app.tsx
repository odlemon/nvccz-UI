"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToPm22Page,
  PM22_PAGE_TO_PATH,
} from "@/lib/performance-v22-mock/nav"
import { startPerformanceV22Runtime } from "@/components/performance-v22-mock/matanho-performance-runtime"
import { PERFORMANCE_V22_SHELL_HTML } from "@/components/performance-v22-mock/shell"
import "@/components/performance-v22-mock/performance-v22.css"
import "@/components/performance-v22-mock/performance-v22-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function PerformanceV22App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPm22Page(pathnameRef.current)
    apiRef.current = startPerformanceV22Runtime(el, {
      shellHtml: PERFORMANCE_V22_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PM22_PAGE_TO_PATH[page] || "/performance-v22"
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
    apiRef.current?.setPage(pathToPm22Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="performance-v22-root h-full w-full"
    />
  )
}
