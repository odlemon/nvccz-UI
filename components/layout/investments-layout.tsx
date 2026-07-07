"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { TerminalSidebar } from "@/components/investments/terminal/sidebar"
import { InvestmentsThemeProvider } from "@/components/investments/terminal/theme-provider"
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
      <InvestmentsThemeProvider>
        <div className="h-[calc(100vh-5rem)] flex overflow-hidden p-2 gap-2 bg-background">
          <TerminalSidebar />
          <main className="flex-1 flex flex-col overflow-hidden min-w-0 rounded-2xl border border-border bg-card">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </InvestmentsThemeProvider>
    </div>
  )
}
