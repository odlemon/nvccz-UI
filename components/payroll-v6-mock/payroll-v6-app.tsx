"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToPr6Page,
  PR6_PAGE_TO_PATH,
} from "@/lib/payroll-v6-mock/nav"
import { startPayrollV6Runtime } from "@/components/payroll-v6-mock/matanho-payroll-runtime"
import { PAYROLL_V6_SHELL_HTML } from "@/components/payroll-v6-mock/shell"
import "@/components/payroll-v6-mock/payroll-v6.css"
import "@/components/payroll-v6-mock/payroll-v6-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function PayrollV6App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPr6Page(pathnameRef.current)
    apiRef.current = startPayrollV6Runtime(el, {
      shellHtml: PAYROLL_V6_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PR6_PAGE_TO_PATH[page] || "/payroll-v6"
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
    apiRef.current?.setPage(pathToPr6Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="payroll-v6-root"
      data-theme="light"
      style={{ minHeight: "calc(100vh - 5rem)", position: "relative" }}
    />
  )
}
