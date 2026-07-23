"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  MessageSquare,
  Scale,
  FileBarChart,
  Settings,
  LineChart,
  PieChart,
  Coins,
  GitBranch,
  Building,
  Columns3,
  Network,
  SlidersHorizontal,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  MessageSquare,
  Scale,
  FileBarChart,
  Settings,
  LineChart,
  PieChart,
  Coins,
  GitBranch,
  Building,
  Columns3,
  Network,
  SlidersHorizontal,
  LayoutDashboard,
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] || LayoutGrid
  return <Icon className={className} strokeWidth={1.75} />
}

export function PerformanceMockSidebar() {
  const pathname = usePathname()
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

  const activeId = useMemo(() => {
    let best: { id: string; score: number } | null = null
    const consider = (href: string, id: string) => {
      const base = href.split("?")[0]
      if (pathname === base) {
        best = { id, score: Infinity }
        return
      }
      if (base !== "/" && pathname.startsWith(base + "/")) {
        const score = base.length
        if (!best || score > best.score) best = { id, score }
      }
    }
    PM_NAV_ITEMS.forEach((i) => consider(i.href, i.id))
    PM_NAV_GROUPS.forEach((g) => g.items.forEach((i) => consider(i.href, i.id)))
    return best?.id ?? null
  }, [pathname])

  useEffect(() => {
    setGroupsCollapsed((prev) => {
      const next = { ...prev }
      PM_NAV_GROUPS.forEach((g) => {
        if (next[g.id] === undefined) {
          const hasActive = g.items.some((i) => i.id === activeId)
          next[g.id] = !hasActive
        }
      })
      return next
    })
  }, [activeId])

  const go = (href: string) => router.push(href)

  return (
    <aside
      className={cn(
        "shrink-0 bg-white border-r border-[#E5E7EB] h-[calc(100vh-5rem)] sticky top-20 flex flex-col z-20 transition-[width] duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[212px]"
      )}
    >
      <div className={cn("pt-3 pb-2", sidebarCollapsed ? "px-2" : "px-3")}>
        <div className={cn("flex items-center gap-2", sidebarCollapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center shadow-sm shrink-0">
            <FileText className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <p className="text-sm font-semibold text-[#111827] leading-tight truncate">Performance</p>
          )}
        </div>
      </div>

      <nav className={cn("flex-1 overflow-y-auto pb-2 space-y-0.5", sidebarCollapsed ? "px-1.5" : "px-2")}>
        {PM_NAV_ITEMS.map((item) => {
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => go(item.href)}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 rounded-lg text-xs transition-colors text-left",
                sidebarCollapsed ? "justify-center px-0" : "px-2.5",
                active ? "bg-[#F5F3FF] text-[#6D28D9] font-semibold" : "text-[#475569] hover:bg-[#F9FAFB]"
              )}
            >
              <NavIcon name={item.icon} className={cn("h-3.5 w-3.5 shrink-0", active ? "text-[#6D28D9]" : "text-[#64748B]")} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}

        {PM_NAV_GROUPS.map((group) => {
          const open = !groupsCollapsed[group.id]
          return (
            <div key={group.id} className="pt-1.5">
              <div className="border-t border-[#E5E7EB] mb-1.5" />
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
                    return
                  }
                  setGroupsCollapsed((p) => ({ ...p, [group.id]: !p[group.id] }))
                }}
                className={cn(
                  "w-full flex items-center gap-2 py-1.5 rounded-lg text-xs text-[#475569] hover:bg-[#F9FAFB]",
                  sidebarCollapsed ? "justify-center px-0" : "px-2.5"
                )}
              >
                <NavIcon name={group.icon} className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left font-medium truncate">{group.title}</span>
                    {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                  </>
                )}
              </button>
              {!sidebarCollapsed && open && (
                <div className="ml-1.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.id === activeId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.href)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] text-left",
                          active ? "bg-[#F5F3FF] text-[#6D28D9] font-semibold" : "text-[#64748B] hover:bg-[#F9FAFB]"
                        )}
                      >
                        <NavIcon name={item.icon} className={cn("h-3 w-3 shrink-0", active ? "text-[#6D28D9]" : "")} />
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

      <div className={cn("shrink-0 border-t border-[#E5E7EB] p-1.5", sidebarCollapsed && "px-1")}>
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[11px] font-medium text-[#64748B] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827]",
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

/**
 * Page context trail only — search / notifications / profile live in SharedTopbar.
 * Kept as a named export so existing screens do not need a bulk rewrite.
 */
export function PerformanceMockTopChrome({
  breadcrumbs,
}: {
  breadcrumbs?: string[]
  /** @deprecated Ignored — global search is in SharedTopbar */
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

/** Optional link helper for in-screen navigation */
export function PmLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-sm font-medium text-[#7C3AED] hover:underline", className)}>
      {children}
    </Link>
  )
}
