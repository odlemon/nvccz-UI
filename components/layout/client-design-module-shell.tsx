"use client"

import type React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { ClientDesignAppSwitcher } from "./client-design-app-switcher"
import { ArcusAppSwitcherProvider } from "./arcus-app-switcher-provider"
import { SharedTopbar } from "./shared-topbar"
import { getModuleByPath } from "@/lib/config/modules"
import { useClientDesignAuthBridge } from "@/lib/client-design-mock/auth-bridge"
import { useBrandLogoOverride } from "@/lib/client-design-mock/brand-logo-override"
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
  useBrandLogoOverride()
  const [currentModule, setCurrentModule] = useState(defaultModuleId)
  const pathname = usePathname()
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  // The mounted "-mock" module's own nav rail (".sidebar", per the shared
  // convention in home-v3/performance-v22/portfolio-v11's *-overrides.css) is
  // position:fixed to the viewport, so it paints outside this shell's normal
  // flow. SharedTopbar is this div's own child, not a descendant of the
  // mounted module, so it has no way to see that rail's width or read the
  // module-scoped --sidebar CSS variable that sizes it. Below ~1033px the
  // topbar's search field was drifting far enough left to render under the
  // rail (typed text invisible, matching a real repro). Rather than guess a
  // fixed reserved width (every module's rail is a different size, and it
  // changes with collapse state and breakpoint), measure the actual rendered
  // rail on a light poll and expose it as a CSS var the topbar can reserve
  // space for. `rect.left <= -1` covers the off-canvas mobile drawer state
  // (translateX(-100%)), where the rail's layout box is still full width but
  // not actually visible, so nothing should be reserved for it there.
  useEffect(() => {
    const shellEl = shellRef.current
    if (!shellEl) return
    const syncSidebarWidth = () => {
      const rail = shellEl.querySelector(".sidebar")
      if (!rail) {
        shellEl.style.setProperty("--reserved-sidebar-w", "0px")
        return
      }
      const rect = rail.getBoundingClientRect()
      const width = rect.left > -1 ? Math.round(rect.width) : 0
      shellEl.style.setProperty("--reserved-sidebar-w", `${width}px`)
    }
    syncSidebarWidth()
    const intervalId = window.setInterval(syncSidebarWidth, 400)
    window.addEventListener("resize", syncSidebarWidth)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("resize", syncSidebarWidth)
    }
  }, [pathname])

  useEffect(() => {
    const html = document.documentElement
    const { overflow: prevHtml } = html.style
    const { overflow: prevBody } = document.body.style
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"

    // Sync saved theme.
    //
    // hideThemeToggle marks a module as light-only. This block used to apply
    // dark regardless, which is a second writer of the same class as
    // SharedTopbar: the topbar cleared `dark` for these modules and this put it
    // straight back, leaving Home and Portfolio with a dark top bar above a
    // light page whenever the global preference was dark.
    //
    // As in the topbar, localStorage is deliberately left untouched so a real
    // dark preference survives for the modules that do support it.
    const saved = localStorage.getItem("arcus-theme")
    const wantsDark =
      saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    if (hideThemeToggle) {
      html.classList.remove("dark")
      html.setAttribute("data-theme", "light")
    } else if (wantsDark) {
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
  }, [hideThemeToggle])

  const handleModuleSelect = (_module: string) => {
    // Module switching handled by ArcusAppSwitcherProvider -> AppSwitcherDropdown
  }

  return (
    <ArcusAppSwitcherProvider currentModule={currentModule}>
      <div
        ref={shellRef}
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
