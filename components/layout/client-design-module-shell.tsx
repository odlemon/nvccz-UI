"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { ArcusAppSwitcherProvider } from "./arcus-app-switcher-provider"
import { getModuleByPath } from "@/lib/config/modules"
import "@/components/layout/arcus-header-overrides.css"

interface ClientDesignModuleShellProps {
  children: React.ReactNode
  defaultModuleId: string
  backgroundClassName?: string
  loadingFallback: React.ReactNode
  mockApp: React.ReactNode
}

/**
 * Client-design mock shell with a single Arcus app-switcher host (Investments-style modal).
 * Mock modules keep their own in-shell header; only the picker is shared.
 */
export function ClientDesignModuleShell({
  children,
  defaultModuleId,
  backgroundClassName = "bg-[#f4f7f6]",
  loadingFallback,
  mockApp,
}: ClientDesignModuleShellProps) {
  const [currentModule, setCurrentModule] = useState(defaultModuleId)
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  useEffect(() => {
    const html = document.documentElement
    const { overflow: prevHtml } = html.style
    const { overflow: prevBody } = document.body.style
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  return (
    <ArcusAppSwitcherProvider currentModule={currentModule}>
      <div className={`h-dvh overflow-hidden ${backgroundClassName}`}>
        <Suspense fallback={loadingFallback}>{mockApp}</Suspense>
        <div className="sr-only" aria-hidden>
          {children}
        </div>
        <ClientDesignAppSwitcher currentModule={currentModule} showHeaderButton={false} />
      </div>
    </ArcusAppSwitcherProvider>
  )
}
