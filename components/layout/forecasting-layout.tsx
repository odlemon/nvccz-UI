"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { ForecastingSidebar } from "./forecasting-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface ForecastingLayoutProps {
  children: React.ReactNode
}

export function ForecastingLayout({ children }: ForecastingLayoutProps) {
  const [currentModule, setCurrentModule] = useState("forecasting")
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
        <ForecastingSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
