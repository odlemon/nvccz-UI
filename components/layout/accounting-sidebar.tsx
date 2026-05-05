"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { 
  CiGrid41
} from "react-icons/ci"

export function AccountingSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasSubModuleAccess, isLoading } = useRolePermissions()

  const module = getModuleById("accounting")

  const handleItemClick = (path: string) => {
    router.push(path)
  }

  // Determine single active subModule: prefer exact match, otherwise longest matching prefix
  const activeSubModuleId = useMemo(() => {
    if (!pathname || !module?.subModules) return null
    let bestId: string | null = null
    let bestScore = -1

    for (const subModule of module.subModules) {
      const base = subModule.path.split("?")[0]
      if (pathname === base) {
        // exact match — highest priority
        return subModule.id
      }
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

  if (!module) {
    return null
  }

  // Filter sub-modules based on user permissions
  const accessibleSubModules = useMemo(() => {
    if (isLoading) return module.subModules; // Show all while loading
    
    return module.subModules.filter((subModule) => {
      // Check if user has access to this sub-module
      return hasSubModuleAccess('accounting', subModule.id)
    })
  }, [module.subModules, hasSubModuleAccess, isLoading])

  return (
    <aside className="w-72 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
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
            <h2 className="text-lg text-gray-900">{module.name}</h2>
          </div>
        </div>

        {/* Navigation Items - Only show accessible sub-modules */}
        <div className="space-y-1">
          {accessibleSubModules.map((subModule) => {
            const Icon = subModule.icon
            const active = activeSubModuleId === subModule.id
            return (
              <Button
                key={subModule.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 cursor-pointer rounded-full transition-all duration-200 text-gray-800",
                  "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:rounded-full",
                  active && "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg rounded-full",
                )}
                onClick={() => handleItemClick(subModule.path)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-base">{subModule.name}</span>
              </Button>
            )
          })}
        </div>

        {/* Show message if no accessible modules */}
        {!isLoading && accessibleSubModules.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No accessible features
          </div>
        )}
      </div>
    </aside>
  )
}
