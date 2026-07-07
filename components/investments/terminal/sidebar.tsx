"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, LogOut, CandlestickChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getModuleById, type ModuleGroupConfig, type SubModuleConfig } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"

// Groups whose full feature set isn't built this phase — nav previews the
// target IA (per plan) but children are non-interactive, and there is a
// single shared placeholder page per group rather than N empty routes.
const DEFERRED_GROUP_IDS = new Set([
  "investments-reconciliation",
  "investments-valuation",
  "investments-reporting",
  "investments-documentation",
  "investments-accounting",
  "investments-setup",
])

export function TerminalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { hasSubModuleAccess, isLoading } = useRolePermissions()
  const { user, userDetails } = useAppSelector((s) => s.auth)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const module = getModuleById("investments")
  const groups = module?.groups ?? []

  const activeGroupId = useMemo(() => {
    if (!pathname) return null
    for (const group of groups) {
      const items = group.items ?? []
      if (items.some((item) => pathname === item.path || pathname.startsWith(item.path + "/"))) return group.id
      if (group.path && (pathname === group.path || pathname.startsWith(group.path + "/"))) return group.id
    }
    return null
  }, [pathname, groups])

  useEffect(() => {
    if (activeGroupId) setExpanded((prev) => new Set(prev).add(activeGroupId))
  }, [activeGroupId])

  const toggleGroup = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const accessibleDashboard = useMemo(() => {
    if (!module) return []
    if (isLoading) return module.subModules
    return module.subModules.filter((sm) => hasSubModuleAccess("investments", sm.id))
  }, [module, hasSubModuleAccess, isLoading])

  const visibleGroups = useMemo(() => {
    return groups
      .map((group) => {
        const deferred = DEFERRED_GROUP_IDS.has(group.id)
        const items = (group.items ?? []).filter((item) => isLoading || deferred || hasSubModuleAccess("investments", item.id))
        return { group, items, deferred }
      })
      .filter(({ group, items, deferred }) => deferred ? true : items.length > 0 || isLoading)
  }, [groups, hasSubModuleAccess, isLoading])

  const userInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : "U"
  const userName = user ? `${user.firstName} ${user.lastName}` : "User"
  const userRole = userDetails?.roleCode || userDetails?.role?.name || "User"

  if (!module) return null

  return (
    <aside className="w-60 flex flex-col rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary">
          <CandlestickChart className="size-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">Investments</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-0.5">
        {accessibleDashboard.map((item: SubModuleConfig) => {
          const Icon = item.icon
          const active = pathname === item.path
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.name}
            </button>
          )
        })}

        <div className="pt-2 space-y-0.5">
          {visibleGroups.map(({ group, items, deferred }: { group: ModuleGroupConfig; items: SubModuleConfig[]; deferred: boolean }) => {
            const isOpen = expanded.has(group.id)
            const GroupIcon = group.icon
            return (
              <div key={group.id}>
                <button
                  onClick={() => (deferred && group.path ? router.push(group.path) : toggleGroup(group.id))}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                    activeGroupId === group.id ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {GroupIcon && <GroupIcon className="size-4 shrink-0" />}
                  <span className="flex-1 truncate">{group.title}</span>
                  {deferred && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  )}
                  {isOpen ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                    {items.map((item) => {
                      const ItemIcon = item.icon
                      const active = pathname === item.path
                      if (deferred) {
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-sidebar-foreground/40 cursor-default"
                          >
                            <ItemIcon className="size-3.5 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={item.id}
                          onClick={() => router.push(item.path)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors",
                            active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <ItemIcon className="size-3.5 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-sidebar-border p-3 flex items-center gap-2.5">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-sidebar-foreground">{userName}</p>
          <p className="truncate text-[10.5px] capitalize text-sidebar-foreground/50">{userRole}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => dispatch(logoutUser())}
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>
    </aside>
  )
}
