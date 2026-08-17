"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { AccountingMockShell } from "@/components/accounting-mock/shell"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

export function AccountingV2Layout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("accounting-v2")
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

  return (
    <div className="h-dvh overflow-hidden bg-[#F5F8FC] flex flex-col">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <Suspense fallback={<div className="p-8 text-sm text-[#6B7280]">Loading Accounting…</div>}>
        <AccountingMockShell>{children}</AccountingMockShell>
      </Suspense>
    </div>
  )
}
