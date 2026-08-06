"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { InvesteePortalV8App } from "@/components/investee-portal-v8-mock/investee-portal-v8-app"
import { getModuleByPath } from "@/lib/config/modules"

export function InvesteePortalV8Layout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("investee-portal-v8")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Investee Portal…</div>}>
        <InvesteePortalV8App />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
      <ClientDesignAppSwitcher currentModule={currentModule} showHeaderButton={false} />
    </div>
  )
}
