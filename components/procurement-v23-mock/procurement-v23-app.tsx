"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToPr23Page,
  PR23_PAGE_TO_PATH,
} from "@/lib/procurement-v23-mock/nav"
import { startProcurementV23Runtime } from "@/components/procurement-v23-mock/matanho-procurement-runtime"
import { PROCUREMENT_V23_SHELL_HTML } from "@/components/procurement-v23-mock/shell"
import "@/components/procurement-v23-mock/procurement-v23.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function ProcurementV23App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPr23Page(pathnameRef.current)
    apiRef.current = startProcurementV23Runtime(el, {
      shellHtml: PROCUREMENT_V23_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PR23_PAGE_TO_PATH[page] || "/procurement-v23"
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
    apiRef.current?.setPage(pathToPr23Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="procurement-v23-root h-full"
      data-theme="light"
    />
  )
}
