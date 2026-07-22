"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { PerformanceMockSidebar } from "@/components/performance-mock/shell"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface PerformanceLayoutProps {
  children: React.ReactNode
}

export function PerformanceLayout({ children }: PerformanceLayoutProps) {
  const [currentModule, setCurrentModule] = useState("performance-management")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) {
      window.location.href = moduleConfig.path
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <div className="flex">
        <PerformanceMockSidebar />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
