"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { PayrollV6App } from "@/components/payroll-v6-mock/payroll-v6-app"
import { getModuleByPath } from "@/lib/config/modules"

export function PayrollV6Layout({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState("payroll-v6")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Payroll…</div>}>
        <PayrollV6App />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
      <ClientDesignAppSwitcher currentModule={currentModule} showHeaderButton={false} />
    </div>
  )
}
