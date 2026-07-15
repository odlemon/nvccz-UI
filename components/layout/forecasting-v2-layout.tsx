"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { ForecastingThemeProvider } from "@/components/fpna/theme-provider"
import "@/app/forecasting-v2/globals.css"

interface ForecastingV2LayoutProps {
  children: React.ReactNode
}

export function ForecastingV2Layout({ children }: ForecastingV2LayoutProps) {
  const [currentModule, setCurrentModule] = useState("forecasting-v2")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)

    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      window.location.href = moduleConfig.path
    }
  }

  return (
    <ForecastingThemeProvider>
      <div className="min-h-screen bg-background">
        <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

        <div style={{ height: 'calc(100vh - 80px)' }}>
          {children}
        </div>
      </div>
    </ForecastingThemeProvider>
  )
}
