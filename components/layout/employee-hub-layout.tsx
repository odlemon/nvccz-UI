"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { EmployeeHubShell } from "@/components/employee-hub-mock/shell"
import { getModuleByPath } from "@/lib/config/modules"

interface EmployeeHubLayoutProps {
  children: React.ReactNode
}

export function EmployeeHubLayout({ children }: EmployeeHubLayoutProps) {
  const [currentModule, setCurrentModule] = useState("employee-hub")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Employee Hub…</div>}>
        <EmployeeHubShell>{children}</EmployeeHubShell>
      </Suspense>
      <ClientDesignAppSwitcher currentModule={currentModule} />
    </div>
  )
}
