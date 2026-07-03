"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

export function StreetRatesSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasSubModuleAccess, isLoading } = useRolePermissions()

  const module = getModuleById("street-rates")

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

  if (!module) return null

  const accessibleSubModules = useMemo(() => {
    if (isLoading) return module.subModules
    return module.subModules.filter((subModule) =>
      hasSubModuleAccess("street-rates", subModule.id)
    )
  }, [module.subModules, hasSubModuleAccess, isLoading])

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100">
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

        <div className="space-y-1">
          {accessibleSubModules.map((subModule) => {
            const Icon = subModule.icon
            const active = activeSubModuleId === subModule.id
            return (
              <Button
                key={subModule.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-9 cursor-pointer rounded-full transition-all duration-200 text-gray-800",
                  !active && "hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 hover:rounded-full",
                  active &&
                    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg rounded-full hover:from-amber-600 hover:to-amber-700",
                )}
                onClick={() => handleItemClick(subModule.path)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{subModule.name}</span>
              </Button>
            )
          })}
        </div>

        {!isLoading && accessibleSubModules.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No accessible features
          </div>
        )}
      </div>
    </aside>
  )
}
