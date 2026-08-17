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

  useEffect(() => {
    const html = document.documentElement
    const { overflow: prevHtml } = html.style
    const { overflow: prevBody } = document.body.style
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) {
      window.location.href = moduleConfig.path
    }
  }

  return (
    <InvestmentsThemeProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <SharedTopbar
          onModuleSelect={handleModuleSelect}
          currentModule={currentModule}
          moduleActions={<ThemeToggle />}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <InvestmentsV2Sidebar />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">{children}</main>
        </div>
      </div>
    </InvestmentsThemeProvider>
  )
}
