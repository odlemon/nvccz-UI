"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { PerformanceV22App } from "@/components/performance-v22-mock/performance-v22-app"

export function PerformanceV22Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="performance-v22"
      backgroundClassName="bg-[#f5f6f8]"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Performance…</div>}
      mockApp={<PerformanceV22App />}
    >
      {children}
    </ClientDesignModuleShell>
  )
}
