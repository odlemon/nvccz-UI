"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToPv11Page,
  PV11_PAGE_TO_PATH,
} from "@/lib/portfolio-v11-mock/nav"
import { startPortfolioV11Runtime } from "@/components/portfolio-v11-mock/matanho-portfolio-runtime"
import { PORTFOLIO_V11_SHELL_HTML } from "@/components/portfolio-v11-mock/shell"
import "@/components/portfolio-v11-mock/portfolio-v11.css"
import "@/components/portfolio-v11-mock/portfolio-v11-overrides.css"

type RuntimeApi = {
  setPage: (page: string, detail?: Record<string, string>) => void
  destroy: () => void
}

export function PortfolioV11App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPv11Page(pathnameRef.current)
    apiRef.current = startPortfolioV11Runtime(el, {
      shellHtml: PORTFOLIO_V11_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PV11_PAGE_TO_PATH[page] || "/portfolio-v11"
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
    apiRef.current?.setPage(pathToPv11Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="portfolio-v11-root"
      data-theme="light"
      style={{ minHeight: "calc(100vh - 5rem)", position: "relative" }}
    />
  )
}
