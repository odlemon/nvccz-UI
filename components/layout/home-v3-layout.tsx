"use client"

import type React from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { HomeV3App } from "@/components/home-v3-mock/home-v3-app"

export function HomeV3Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientDesignModuleShell
      defaultModuleId="home-v3"
      backgroundClassName="bg-[#f5f7fb]"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Homepage…</div>}
      mockApp={<HomeV3App />}
      hideThemeToggle
    >
      {children}
    </ClientDesignModuleShell>
  )
}
