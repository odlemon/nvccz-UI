"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { CiCirclePlus, CiCircleMinus, CiSettings } from "react-icons/ci"

export function PerformanceSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasSubModuleAccess, isLoading } = useRolePermissions()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const module = getModuleById("performance-management")

  const accessibleSubModules = useMemo(() => {
    if (!module) return []
    if (isLoading) return module.subModules
    return module.subModules.filter((s) =>
      hasSubModuleAccess("performance-management", s.id)
    )
  }, [module, hasSubModuleAccess, isLoading])

  const accessibleGroups = useMemo(() => {
    if (!module?.groups) return []
    return module.groups
      .map((g) => {
        if (Array.isArray(g.items) && g.items.length > 0) {
          const filtered = g.items.filter((i) =>
            hasSubModuleAccess("performance-management", i.id)
          )
          return filtered.length > 0 ? { ...g, items: filtered } : null
        }
        return g
      })
      .filter((g): g is NonNullable<typeof g> => g !== null)
  }, [module, hasSubModuleAccess])

  // Compute the SINGLE active item id by longest-path match.
  // This guarantees only one link is highlighted at a time — the dashboard
  // `/performance` link no longer also lights up on /performance/goals etc.
  const activeItemId = useMemo(() => {
    if (!module || !pathname) return null
    let bestId: string | null = null
    let bestScore = -1

    const consider = (path: string | undefined, id: string) => {
      if (!path) return
      const base = path.split("?")[0]
      if (pathname === base) {
        // Exact match wins outright
        if (Infinity > bestScore) {
          bestScore = Infinity
          bestId = id
        }
        return
      }
      // Only consider as a prefix match if base is not just "/" or empty
      if (base !== "/" && pathname.startsWith(base + "/")) {
        const score = base.length
        if (score > bestScore) {
          bestScore = score
          bestId = id
        }
      }
    }

    accessibleSubModules.forEach((s) => consider(s.path, s.id))
    accessibleGroups.forEach((g) => {
      ;(g.items || []).forEach((i) => consider(i.path, i.id))
    })
    return bestId
  }, [module, pathname, accessibleSubModules, accessibleGroups])

  // Auto-expand the group containing the active child; otherwise default expanded
  useEffect(() => {
    if (accessibleGroups.length === 0) return
    setCollapsedGroups((prev) => {
      const next = { ...prev }
      accessibleGroups.forEach((g) => {
        if (next[g.id] === undefined) {
          const hasActiveChild = (g.items || []).some((it) => it.id === activeItemId)
          next[g.id] = !hasActiveChild
        }
      })
      return next
    })
  }, [accessibleGroups, activeItemId])

  if (!module) return null

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
      <div className="p-4 space-y-4">
        {/* Module Header */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: module.color }}
          >
            <module.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base text-gray-900">{module.name}</h2>
          </div>
        </div>

        {/* Flat sub-modules */}
        <div className="space-y-1">
          {accessibleSubModules.map((subModule) => {
            const Icon = subModule.icon
            const active = activeItemId === subModule.id
            return (
              <button
                key={subModule.id}
                onClick={() => router.push(subModule.path)}
                className={cn(
                  "w-full flex items-center gap-3 h-10 cursor-pointer rounded-full transition-all duration-200 text-gray-800 px-3",
                  "hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100",
                  active &&
                    "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-normal text-left">{subModule.name}</span>
              </button>
            )
          })}
        </div>

        {/* Groups (collapsible) */}
        {accessibleGroups.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            {accessibleGroups.map((group) => {
              const collapsed = collapsedGroups[group.id]
              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                      {group.icon ? <group.icon className="w-5 h-5" /> : <CiSettings className="w-5 h-5" />}
                      <span className="text-left">{group.title}</span>
                    </span>
                    {collapsed ? (
                      <CiCirclePlus className="w-5 h-5 text-gray-500 ml-2" />
                    ) : (
                      <CiCircleMinus className="w-5 h-5 text-gray-500 ml-2" />
                    )}
                  </button>
                  {!collapsed && (
                    <div className="space-y-1 pl-5 border-l border-gray-200 ml-2">
                      {(group.items || []).map((item) => {
                        const Icon = item.icon
                        const active = activeItemId === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={cn(
                              "w-full flex items-center justify-start gap-3 h-9 cursor-pointer rounded-full transition-all duration-200 text-gray-700 px-3 text-left",
                              "hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100",
                              active &&
                                "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-[13px] text-left flex-1">{item.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
