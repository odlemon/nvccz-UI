"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { PM_NAV_GROUPS, PM_NAV_ITEMS } from "@/lib/performance-mock/nav"
import {
  LayoutGrid,
  FileText,
  Layers,
  Medal,
  Target,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Building2,
  Users,
  Trophy,
  User,
  AlertTriangle,
  Clock,
  FileBarChart,
  Settings,
  LineChart,
  PieChart,
  Building,
  Columns3,
  Network,
  SlidersHorizontal,
  LayoutDashboard,
  Calendar,
  History,
  ChevronUp,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Headphones,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const SIDEBAR_STORAGE_KEY = "performance-mock-sidebar-collapsed"

const ICONS: Record<string, LucideIcon> = {
  LayoutGrid,
  FileText,
  Layers,
  Medal,
  Target,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Building2,
  Users,
  Trophy,
  User,
  AlertTriangle,
  Clock,
  FileBarChart,
  Settings,
  LineChart,
  PieChart,
  Building,
  Columns3,
  Network,
  SlidersHorizontal,
  LayoutDashboard,
  Calendar,
  History,
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] || LayoutGrid
  return <Icon className={className} strokeWidth={1.75} />
}

function hrefPath(href: string) {
  return href.split("?")[0]
}

function hrefView(href: string) {
  const q = href.split("?")[1]
  if (!q) return null
  return new URLSearchParams(q).get("view")
}

export function PerformanceMockSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [groupsCollapsed, setGroupsCollapsed] = useState<Record<string, boolean>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") setSidebarCollapsed(true)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const currentView = searchParams.get("view")

  const activeId = useMemo(() => {
    let best: { id: string; score: number } | null = null

    const consider = (href: string, id: string) => {
      const base = hrefPath(href)
      const view = hrefView(href)

      if (pathname !== base && !(base !== "/" && pathname.startsWith(base + "/"))) return

      // Query-backed siblings under the same path (Reports views)
      if (view) {
        if (pathname === base && currentView === view) {
          best = { id, score: Infinity }
        }
        return
      }

      // Exact path without view query — prefer when no view is active
      if (pathname === base) {
        if (!currentView) {
          best = { id, score: Infinity }
        } else if (!best || best.score < base.length) {
          // keep as weak fallback only if nothing better matched
          if (!best) best = { id, score: base.length }
        }
        return
      }

      if (base !== "/" && pathname.startsWith(base + "/")) {
        const score = base.length
        if (!best || score > best.score) best = { id, score }
      }
    }

    PM_NAV_ITEMS.forEach((i) => consider(i.href, i.id))
    PM_NAV_GROUPS.forEach((g) => g.items.forEach((i) => consider(i.href, i.id)))

    // Reports default: /performance/reports with no view → Performance Reports
    if (pathname === "/performance/reports" && !currentView) {
      return "performance-reports"
    }

    return best?.id ?? null
  }, [pathname, currentView])

  useEffect(() => {
    setGroupsCollapsed((prev) => {
      const next = { ...prev }
      PM_NAV_GROUPS.forEach((g) => {
        const hasActive = g.items.some((i) => i.id === activeId)
        if (hasActive) {
          next[g.id] = false
        } else if (next[g.id] === undefined) {
          next[g.id] = true
        }
      })
      return next
    })
  }, [activeId])

  const go = (href: string) => router.push(href)

  return (
    <aside
      className={cn(
        "shrink-0 bg-[#F8FAFC] border-r border-[#E5E7EB] h-[calc(100vh-5rem)] sticky top-20 flex flex-col z-20 transition-[width] duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[220px]"
      )}
    >
      <div className={cn("pt-4 pb-3", sidebarCollapsed ? "px-2" : "px-3.5")}>
        <div className={cn("flex items-center gap-2.5", sidebarCollapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-sm shrink-0 text-white text-sm font-bold">
            A
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#7C3AED] leading-none tracking-tight">Arcus</p>
              <p className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wide mt-0.5 truncate">
                Performance Management
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className={cn("flex-1 overflow-y-auto pb-2 space-y-0.5", sidebarCollapsed ? "px-1.5" : "px-2.5")}>
        {PM_NAV_ITEMS.map((item) => {
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => go(item.href)}
              className={cn(
                "w-full flex items-center gap-2.5 py-2 rounded-xl text-xs transition-colors text-left",
                sidebarCollapsed ? "justify-center px-0" : "px-2.5",
                active ? "bg-[#F5F3FF] text-[#7C3AED] font-semibold" : "text-[#475569] hover:bg-white/80"
              )}
            >
              <NavIcon name={item.icon} className={cn("h-4 w-4 shrink-0", active ? "text-[#7C3AED]" : "text-[#64748B]")} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}

        {PM_NAV_GROUPS.map((group) => {
          const open = !groupsCollapsed[group.id]
          const groupActive = group.items.some((i) => i.id === activeId)
          return (
            <div key={group.id} className="pt-1">
              <button
                type="button"
                title={sidebarCollapsed ? group.title : undefined}
                onClick={() => {
                  if (sidebarCollapsed) {
                    setSidebarCollapsed(false)
                    try {
                      localStorage.setItem(SIDEBAR_STORAGE_KEY, "0")
                    } catch {
                      /* ignore */
                    }
                    setGroupsCollapsed((p) => ({ ...p, [group.id]: false }))
                    if (group.href) go(group.href)
                    return
                  }
                  setGroupsCollapsed((p) => ({ ...p, [group.id]: !p[group.id] }))
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 py-2 rounded-xl text-xs transition-colors",
                  sidebarCollapsed ? "justify-center px-0" : "px-2.5",
                  groupActive ? "text-[#7C3AED] font-semibold" : "text-[#475569] hover:bg-white/80"
                )}
              >
                <NavIcon name={group.icon} className={cn("h-4 w-4 shrink-0", groupActive ? "text-[#7C3AED]" : "text-[#64748B]")} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left font-semibold truncate">{group.title}</span>
                    {open ? (
                      <ChevronUp className={cn("h-3.5 w-3.5 shrink-0", groupActive ? "text-[#7C3AED]" : "text-[#94A3B8]")} />
                    ) : (
                      <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", groupActive ? "text-[#7C3AED]" : "text-[#94A3B8]")} />
                    )}
                  </>
                )}
              </button>
              {!sidebarCollapsed && open && (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {group.items.map((item) => {
                    const active = item.id === activeId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.href)}
                        className={cn(
                          "w-full flex items-center gap-2 pl-5 pr-2.5 py-2 rounded-xl text-[11px] text-left transition-colors",
                          active
                            ? "bg-[#F5F3FF] text-[#7C3AED] font-semibold"
                            : "text-[#64748B] hover:bg-white/80"
                        )}
                      >
                        <NavIcon name={item.icon} className={cn("h-3.5 w-3.5 shrink-0", active ? "text-[#7C3AED]" : "text-[#94A3B8]")} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className={cn("shrink-0 p-2.5 space-y-2", sidebarCollapsed && "px-1.5")}>
        {!sidebarCollapsed && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111827]">Need help?</p>
                <a href="#" className="text-[11px] font-medium text-[#7C3AED] hover:underline" onClick={(e) => e.preventDefault()}>
                  Visit Arcus Support
                </a>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-xl px-2.5 text-[11px] font-medium text-[#64748B] transition-colors hover:bg-white hover:text-[#111827]",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          {sidebarCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export function PerformanceMockTopChrome({
  breadcrumbs,
}: {
  breadcrumbs?: string[]
  searchPlaceholder?: string
}) {
  const crumbs = breadcrumbs?.filter(Boolean) ?? []
  if (crumbs.length === 0) return null

  return (
    <div className="px-4 lg:px-5 pt-3">
      <nav aria-label="Breadcrumb" className="text-[11px] text-[#6B7280] truncate">
        {crumbs.map((b, i, arr) => (
          <span key={`${b}-${i}`}>
            {i > 0 && <span className="mx-1.5 text-[#D1D5DB]">›</span>}
            <span className={i === arr.length - 1 ? "text-[#111827] font-medium" : ""}>{b}</span>
          </span>
        ))}
      </nav>
    </div>
  )
}

export function PmLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-sm font-medium text-[#7C3AED] hover:underline", className)}>
      {children}
    </Link>
  )
}
