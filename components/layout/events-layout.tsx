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
      {/* Sidebar first, topbar inside the right-hand column, so the sidebar runs
          the full height of the viewport and touches the top the way Portfolio's
          does. Previously the topbar spanned the full width above this row and
          pushed the sidebar down by 80px. Matches FP&A and Fundraising. */}
      <div className="flex">
        <EventsSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} hideThemeToggle />
          <main className="flex-1 overflow-auto min-h-[calc(100vh-5rem)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
