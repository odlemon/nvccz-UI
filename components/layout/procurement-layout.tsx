"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { ProcurementSidebar } from "./procurement-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface ProcurementLayoutProps {
  children: React.ReactNode
}

export function ProcurementLayout({ children }: ProcurementLayoutProps) {
  const [currentModule, setCurrentModule] = useState("procurement")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    console.log('ProcurementLayout handleModuleSelect called with:', module)
    setCurrentModule(module)
    
    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      console.log('Navigating to:', moduleConfig.path)
      window.location.href = moduleConfig.path
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

      <div className="flex">
        <ProcurementSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
