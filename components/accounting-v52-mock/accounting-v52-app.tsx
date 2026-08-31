"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToAc52Page,
  AC52_PAGE_TO_PATH,
} from "@/lib/accounting-v52-mock/nav"
import { startAccountingV52Runtime } from "@/components/accounting-v52-mock/matanho-accounting-runtime"
import { ACCOUNTING_V52_SHELL_HTML } from "@/components/accounting-v52-mock/shell"
import "@/components/accounting-v52-mock/accounting-v52.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function AccountingV52App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToAc52Page(pathnameRef.current)
    apiRef.current = startAccountingV52Runtime(el, {
      shellHtml: ACCOUNTING_V52_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = AC52_PAGE_TO_PATH[page] || "/accounting-v52"
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
    apiRef.current?.setPage(pathToAc52Page(pathname))
  }, [pathname])

  return <div ref={rootRef} className="accounting-v52-root h-full" />
}
