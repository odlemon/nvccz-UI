"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { PortfolioV11App } from "@/components/portfolio-v11-mock/portfolio-v11-app"

export function PortfolioV11Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="portfolio-v11"
      backgroundClassName="bg-[#f2f5f9]"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Portfolio…</div>}
      mockApp={<PortfolioV11App />}
      hideThemeToggle
    >
      {children}
    </ClientDesignModuleShell>
  )
}
