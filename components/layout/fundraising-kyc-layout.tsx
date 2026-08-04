"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { FundraisingKycApp } from "@/components/fundraising-kyc-mock/fundraising-kyc-app"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

export function FundraisingKycLayout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("fundraising-kyc")
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
    <div className="min-h-screen bg-[#f4f7f6]">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Investor KYC…</div>}>
        <FundraisingKycApp />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  )
}
