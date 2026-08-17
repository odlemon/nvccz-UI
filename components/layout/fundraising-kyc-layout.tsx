"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { ArcusAppSwitcherProvider } from "./arcus-app-switcher-provider"
import { FundraisingKycApp } from "@/components/fundraising-kyc-mock/fundraising-kyc-app"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

export function FundraisingKycLayout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("fundraising-kyc")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
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
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) window.location.href = moduleConfig.path
  }

  return (
    <ArcusAppSwitcherProvider currentModule={currentModule}>
      <div className="flex h-dvh flex-col overflow-hidden bg-[#f4f7f6]">
        <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
        <div className="min-h-0 flex-1 overflow-hidden">
          <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Investor KYC…</div>}>
            <FundraisingKycApp />
          </Suspense>
        </div>
        <div className="sr-only" aria-hidden>
          {children}
        </div>
        <ClientDesignAppSwitcher currentModule={currentModule} showHeaderButton={false} />
      </div>
    </ArcusAppSwitcherProvider>
  )
}
