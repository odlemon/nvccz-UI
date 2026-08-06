"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { PortfolioV11App } from "@/components/portfolio-v11-mock/portfolio-v11-app"
import { getModuleByPath } from "@/lib/config/modules"

export function PortfolioV11Layout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("portfolio-v11")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f2f5f9]">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Portfolio…</div>}>
        <PortfolioV11App />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
      <ClientDesignAppSwitcher currentModule={currentModule} showHeaderButton={false} />
    </div>
  )
}
