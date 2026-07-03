"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { InvestmentsSidebar } from "./investments-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface InvestmentsLayoutProps {
  children: React.ReactNode
}

export function InvestmentsLayout({ children }: InvestmentsLayoutProps) {
  const [currentModule, setCurrentModule] = useState("investments")
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
    <div className="min-h-screen bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <div className="flex">
        <InvestmentsSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
