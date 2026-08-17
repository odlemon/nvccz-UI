"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { InvesteePortalV8App } from "@/components/investee-portal-v8-mock/investee-portal-v8-app"

export function InvesteePortalV8Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="investee-portal-v8"
      backgroundClassName="bg-[#f3f6fb]"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Investee Portal…</div>}
      mockApp={<InvesteePortalV8App />}
    >
      {children}
    </ClientDesignModuleShell>
  )
}
