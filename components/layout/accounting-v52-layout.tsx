"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { AccountingV52App } from "@/components/accounting-v52-mock/accounting-v52-app"

export function AccountingV52Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="accounting-v52"
      backgroundClassName="bg-transparent"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Accounting…</div>}
      mockApp={<AccountingV52App />}
      hideThemeToggle
    >
      {children}
    </ClientDesignModuleShell>
  )
}
