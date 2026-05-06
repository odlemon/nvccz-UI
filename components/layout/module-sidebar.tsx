"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MODULE_CONFIG, getModuleById } from "@/lib/config/modules"
import { 
  CiViewList,
  CiWallet,
  CiShop,
  CiCirclePlus,
  CiCircleMinus
} from "react-icons/ci"

interface ModuleSidebarProps {
  currentModule: string
  activeItem: string
  onItemSelect: (item: string) => void
}

export function ModuleSidebar({ currentModule, activeItem, onItemSelect }: ModuleSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const module = getModuleById(currentModule)

  // compute single active item id (exact match wins, otherwise longest prefix)
  const activeItemId = useMemo(() => {
    if (!module || !pathname) return null
    let bestId: string | null = null
    let bestScore = -1

    const check = (path: string, id: string) => {
      if (!path) return
      if (path.includes("?")) {
        const full = pathname + (typeof window !== 'undefined' ? window.location.search : '')
        if (full === path) {
          bestId = id
          bestScore = Infinity
        }
        return
      }
      const base = path.split("?")[0]
      if (pathname === base) {
        bestId = id
        bestScore = Infinity
        return
      }
      if (base !== "/" && pathname.startsWith(base + "/")) {
        const score = base.length
        if (score > bestScore) {
          bestScore = score
          bestId = id
        }
      }
    }

    // groups first
    if (module.groups && module.groups.length > 0) {
      for (const g of module.groups) {
        if (Array.isArray(g.items)) {
          for (const it of g.items) {
            check(it.path, it.id)
            if (bestScore === Infinity) return bestId
          }
        } else if (g.path) {
          check(g.path, g.id)
          if (bestScore === Infinity) return bestId
        }
      }
    }

    // fallback to subModules
    if (module.subModules) {
      for (const s of module.subModules) {
        check(s.path, s.id)
        if (bestScore === Infinity) return bestId
      }
    }

    return bestId
  }, [module, pathname])

  // Initialize default: first group open, others collapsed
  useEffect(() => {
    if (module && module.groups && module.groups.length > 0 && Object.keys(collapsedGroups).length === 0) {
      const initial: Record<string, boolean> = {}
      module.groups.forEach((g, idx) => {
        initial[g.id] = idx === 0 ? false : true
      })
      setCollapsedGroups(initial)
    }
  }, [module, collapsedGroups])

  const handleItemClick = (path: string, id: string) => {
    router.push(path)
    onItemSelect(id)
  }

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const getGroupIcon = (groupId: string) => {
    switch (groupId) {
      case "applications":
        return CiViewList
      case "funds":
        return CiWallet
      case "companies":
        return CiShop
      default:
        return CiViewList
    }
  }

  if (currentModule === "homepage" || !module) {
    return null
  }

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
      <div className="p-4 space-y-4">
        {/* Module Header */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
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

        {/* Navigation Items */}
        <div className="space-y-4">
          {module.groups && module.groups.length > 0 ? (
            module.groups.map(group => {
              const GroupIcon = getGroupIcon(group.id)
              const collapsed = collapsedGroups[group.id]
              return (
                <div key={group.id} className="space-y-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <GroupIcon className="w-4 h-4" />
                      {group.title}
                    </span>
                    {collapsed ? (
                      <CiCirclePlus className="w-4 h-4 text-gray-500" />
                    ) : (
                      <CiCircleMinus className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {!collapsed && (
                    <div className="space-y-1 pl-5 border-l border-gray-200 ml-2">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const active = activeItemId === item.id
                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-8 cursor-pointer rounded-full transition-all duration-200 text-gray-700",
                              "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:rounded-full",
                              active && "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg rounded-full",
                            )}
                            onClick={() => handleItemClick(item.path, item.id)}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-xs">{item.name}</span>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="space-y-1">
              {module.subModules.map((subModule) => {
                const Icon = subModule.icon
                const active = activeItemId === subModule.id
                return (
                  <Button
                    key={subModule.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-9 cursor-pointer rounded-full transition-all duration-200 text-gray-800",
                      "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:rounded-full",
                      active && "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg rounded-full",
                    )}
                    onClick={() => handleItemClick(subModule.path, subModule.id)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{subModule.name}</span>
                  </Button>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </aside>
  )
}
