"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { PayrollV6App } from "@/components/payroll-v6-mock/payroll-v6-app"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

export function PayrollV6Layout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("payroll-v6")
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
    <div className="min-h-screen bg-[#f3f6fb]">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Payroll V6…</div>}>
        <PayrollV6App />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  )
}
