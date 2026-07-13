"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { FpaSidebar } from "./fpa-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface FpaLayoutProps {
  children: React.ReactNode
}

export function FpaLayout({ children }: FpaLayoutProps) {
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
    <div className="min-h-screen bg-[#f1f5f9]">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <div className="flex">
        <FpaSidebar />
        <main className="flex-1 overflow-auto min-h-[calc(100vh-5rem)] bg-[#f8fafc]">{children}</main>
      </div>
    </div>
  )
}
