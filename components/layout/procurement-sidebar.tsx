"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { 
  CiGrid41
} from "react-icons/ci"

export function ProcurementSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const module = getModuleById("procurement")

  // navigate to submodule path
  const handleItemClick = (path: string) => {
    if (!path) return
    router.push(path)
  }

 const activeSubModuleId = useMemo(() => {
    if (!pathname || !module?.subModules) return null
    let bestId: string | null = null
    let bestScore = -1
    for (const subModule of module.subModules) {
      const path = subModule.path || ''
      if (path.includes("?")) {
        const full = pathname + (typeof window !== 'undefined' ? window.location.search : '')
        if (full === path) return subModule.id
        continue
      }
      const base = path.split("?")[0]
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

  if (!module) {
    return null
  }

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
      <div className="p-4 space-y-4">
        {/* Module Header */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
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

        {/* Navigation Items */}
        <div className="space-y-1">
          {module.subModules.map((subModule) => {
            const Icon = subModule.icon
            const active = activeSubModuleId === subModule.id
            return (
              <Button
                key={subModule.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 cursor-pointer rounded-full transition-all duration-200 text-gray-800",
                  "hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:rounded-full",
                  active && "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg rounded-full",
                )}
                onClick={() => handleItemClick(subModule.path)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{subModule.name}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
