"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { PortfolioV11App } from "@/components/portfolio-v11-mock/portfolio-v11-app"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

export function PortfolioV11Layout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("portfolio-v11")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) window.location.href = moduleConfig.path
  }

  return (
    <div className="min-h-screen bg-[#f2f5f9]">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Portfolio V11…</div>}>
        <PortfolioV11App />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  )
}
