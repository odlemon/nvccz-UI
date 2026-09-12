"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { ProcurementV23App } from "@/components/procurement-v23-mock/procurement-v23-app"

export function ProcurementV23Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="procurement-v23"
      backgroundClassName="bg-[#f4f6fa]"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Procurement…</div>}
      mockApp={<ProcurementV23App />}
      hideThemeToggle
    >
      {children}
    </ClientDesignModuleShell>
  )
}
