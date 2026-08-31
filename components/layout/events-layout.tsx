"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { EventsSidebar } from "./events-sidebar"

interface EventsLayoutProps {
  children: React.ReactNode
}

export function EventsLayout({ children }: EventsLayoutProps) {
  const [currentModule, setCurrentModule] = useState("events-management")
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
    <div className="min-h-screen bg-background" data-module="events">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} hideThemeToggle />

      <div className="flex">
        <EventsSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
