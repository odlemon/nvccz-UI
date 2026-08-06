"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { HomeV3App } from "@/components/home-v3-mock/home-v3-app"
import { getModuleByPath } from "@/lib/config/modules"

interface HomeV3LayoutProps {
  children: React.ReactNode
}

export function HomeV3Layout({ children }: HomeV3LayoutProps) {
  const [currentModule, setCurrentModule] = useState("home-v3")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Homepage…</div>}>
        <HomeV3App />
      </Suspense>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
      <ClientDesignAppSwitcher currentModule={currentModule} />
    </div>
  )
}
