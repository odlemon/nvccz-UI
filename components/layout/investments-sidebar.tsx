"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { useAppSelector } from "@/lib/store"
import { Delta } from "@/components/investments/status-pills"

// Sidebar-local grouping only — does not touch lib/config/modules.ts, which is shared app-wide.
const GROUPS: { label: string; ids: string[] }[] = [
  { label: "Trading", ids: ["investments-terminal", "investments-trades"] },
  { label: "Market Data", ids: ["investments-market-data", "investments-securities"] },
  { label: "Setup", ids: ["investments-routing-config"] },
]

export function InvestmentsSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasSubModuleAccess, isLoading } = useRolePermissions()
  const { funds, fundsLoading, selectedFundId, pnl } = useAppSelector((s) => s.investments)
  const { user, userDetails } = useAppSelector((s) => s.auth)

  const module = getModuleById("investments")

  const handleItemClick = (path: string) => {
    router.push(path)
  }

  const activeSubModuleId = useMemo(() => {
    if (!pathname || !module?.subModules) return null
    let bestId: string | null = null
    let bestScore = -1

    for (const subModule of module.subModules) {
      const base = subModule.path.split("?")[0]
      if (pathname === base) return subModule.id
      if (base !== "/" && pathname.startsWith(base + "/")) {
        const score = base.length
        if (score > bestScore) {
          bestScore = score
          bestId = subModule.id
        }
      }
    }
    return bestId
  }, [pathname, module])

  const accessibleSubModules = useMemo(() => {
    if (!module) return []
    if (isLoading) return module.subModules
    return module.subModules.filter((subModule) => hasSubModuleAccess("investments", subModule.id))
  }, [module, hasSubModuleAccess, isLoading])

  const groupedNav = useMemo(() => {
    return GROUPS.map((group) => ({
      label: group.label,
      items: accessibleSubModules.filter((sm) => group.ids.includes(sm.id)),
    })).filter((group) => group.items.length > 0)
  }, [accessibleSubModules])

  const selectedFund = funds.find((f) => f.id === selectedFundId)
  const userInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : "U"
  const userName = user ? `${user.firstName} ${user.lastName}` : "User"
  const userRole = userDetails?.roleCode || userDetails?.role?.name || "User"

  if (!module) return null

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] sticky top-20 z-10 flex flex-col">
      {/* Brand header */}
      <div className="p-4 pb-0 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: module.color }}
          >
            <module.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{module.name}</h2>
          </div>
        </div>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {groupedNav.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1.5">{group.label}</p>
            {group.items.map((subModule) => {
              const Icon = subModule.icon
              const active = activeSubModuleId === subModule.id
              return (
                <Button
                  key={subModule.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-9 cursor-pointer rounded-full transition-all duration-200 text-gray-800",
                    !active && "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 hover:rounded-full",
                    active &&
                      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg rounded-full hover:from-emerald-600 hover:to-emerald-700",
                  )}
                  onClick={() => handleItemClick(subModule.path)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{subModule.name}</span>
                </Button>
              )
            })}
          </div>
        ))}

        {!isLoading && groupedNav.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No accessible features
          </div>
        )}
      </nav>

      {/* Account context */}
      <div className="shrink-0 px-4 pb-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Active Fund</p>
          {fundsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : selectedFund ? (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{selectedFund.name}</p>
              <p className="text-xs font-mono text-muted-foreground">
                NAV {selectedFund.base_currency} {selectedFund.nav?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}
              </p>
              {pnl?.unrealized && (
                <Delta value={pnl.unrealized.usd} suffix="" className="text-xs" />
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No fund selected</p>
          )}
        </div>
      </div>

      {/* User footer */}
      <div className="shrink-0 border-t border-border px-4 py-3 flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
          <p className="text-[10px] text-muted-foreground capitalize truncate">{userRole}</p>
        </div>
      </div>
    </aside>
  )
}
