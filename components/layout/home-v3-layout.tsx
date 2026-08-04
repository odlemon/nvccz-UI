"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { HomeV3App } from "@/components/home-v3-mock/home-v3-app"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface HomeV3LayoutProps {
  children: React.ReactNode
}

export function HomeV3Layout({ children }: HomeV3LayoutProps) {
  const [currentModule, setCurrentModule] = useState("home-v3")
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
    <div className="min-h-screen bg-[#f5f7fb]">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Home Version 3…</div>}>
        <HomeV3App />
      </Suspense>
      {/* Route segments exist for App Switcher / Next routing; UI is owned by HomeV3App */}
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  )
}
