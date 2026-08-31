"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { ArcusAppSwitcherProvider } from "./arcus-app-switcher-provider"
import { SharedTopbar } from "./shared-topbar"
import { getModuleByPath } from "@/lib/config/modules"
import { useClientDesignAuthBridge } from "@/lib/client-design-mock/auth-bridge"
import "@/components/layout/arcus-header-overrides.css"

interface ClientDesignModuleShellProps {
  children: React.ReactNode
  defaultModuleId: string
  backgroundClassName?: string
  loadingFallback: React.ReactNode
  mockApp: React.ReactNode
  /** When true, skip rendering the SharedTopbar (for modules that render their own). */
  skipTopbar?: boolean
  /** When true, hide the built-in theme toggle in SharedTopbar. */
  hideThemeToggle?: boolean
}

/**
 * Client-design mock shell — renders a shared React topbar above the mock app.
 * The mock app's own HTML topbar is hidden via CSS and the SharedTopbar
 * provides: theme switcher, app switcher, notifications (API), company switcher, avatar+logout.
 */
export function ClientDesignModuleShell({
  children,
  defaultModuleId,
  backgroundClassName = "bg-[#f4f7f6]",
  loadingFallback,
  mockApp,
  skipTopbar = false,
  hideThemeToggle = false,
}: ClientDesignModuleShellProps) {
  useClientDesignAuthBridge()
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

    // Sync saved theme
    const saved = localStorage.getItem("arcus-theme")
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      html.classList.add("dark")
      html.setAttribute("data-theme", "dark")
    }

    const handleThemeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const btn = target?.closest?.(
        '[data-action="toggle-theme"], [data-action="theme-toggle"], [data-action="theme"], #themeBtn, .theme-top, .theme-toggle'
      )
      if (!btn) return
      e.preventDefault()
      e.stopPropagation()
      const isDark = html.classList.toggle("dark")
      const mode = isDark ? "dark" : "light"
      html.setAttribute("data-theme", mode)
      localStorage.setItem("arcus-theme", mode)
      document
        .querySelectorAll(
          "#app, .app, .performance-v22-root, .portfolio-v11-root, .payroll-v6-root, .procurement-v23-root, .accounting-v52-root, .home-v3-root"
        )
        .forEach((el) => {
          el.setAttribute("data-theme", mode)
        })
    }

    document.addEventListener("click", handleThemeClick, true)
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      document.removeEventListener("click", handleThemeClick, true)
    }
  }, [])

  const handleModuleSelect = (_module: string) => {
    // Module switching handled by ArcusAppSwitcherProvider -> AppSwitcherDropdown
  }

  return (
    <ArcusAppSwitcherProvider currentModule={currentModule}>
      <div
        className={`flex flex-col h-dvh overflow-hidden ${backgroundClassName}`}
        data-arcus-shell
      >
        {!skipTopbar && (
          <SharedTopbar
            onModuleSelect={handleModuleSelect}
            currentModule={currentModule}
            hideThemeToggle={hideThemeToggle}
          />
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Suspense fallback={loadingFallback}>{mockApp}</Suspense>
        </div>
        <div className="sr-only" aria-hidden>
          {children}
        </div>
        <ClientDesignAppSwitcher currentModule={currentModule} showHeaderButton={false} />
      </div>
    </ArcusAppSwitcherProvider>
  )
}
