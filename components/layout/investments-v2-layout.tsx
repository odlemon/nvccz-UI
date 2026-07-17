"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { InvestmentsV2Sidebar } from "./investments-v2-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { InvestmentsThemeProvider } from "@/components/investments-v2/theme-provider"
import { ThemeToggle } from "@/components/investments-v2/theme-toggle"
import "@/app/investments-v2/globals.css"

interface InvestmentsV2LayoutProps {
  children: React.ReactNode
}

export function InvestmentsV2Layout({ children }: InvestmentsV2LayoutProps) {
  const [currentModule, setCurrentModule] = useState("investments-v2")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    console.log('InvestmentsV2Layout handleModuleSelect called with:', module)
    setCurrentModule(module)
    
    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      console.log('Navigating to:', moduleConfig.path)
      window.location.href = moduleConfig.path
    }
  }

  return (
    <InvestmentsThemeProvider>
      <div className="min-h-screen bg-background">
        <SharedTopbar
          onModuleSelect={handleModuleSelect}
          currentModule={currentModule}
          moduleActions={<ThemeToggle />}
        />

        <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
          <InvestmentsV2Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </InvestmentsThemeProvider>
  )
}
