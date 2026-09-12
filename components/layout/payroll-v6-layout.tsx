"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { PayrollV6App } from "@/components/payroll-v6-mock/payroll-v6-app"

export function PayrollV6Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="payroll-v6"
      backgroundClassName="bg-[#f3f6fb]"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Payroll…</div>}
      mockApp={<PayrollV6App />}
      hideThemeToggle
    >
      {children}
    </ClientDesignModuleShell>
  )
}
