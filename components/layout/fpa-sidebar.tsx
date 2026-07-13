"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

export function FpaSidebar() {
  const pathname = usePathname()
  const { hasSubModuleAccess, isLoading, hasModuleAccess } = useRolePermissions()
  const [collapsed, setCollapsed] = useState(false)
  const module = getModuleById("forecasting")

  const activeSubModuleId = useMemo(() => {
    if (!pathname || !module?.subModules) return null
    if (pathname.includes("/builder") || pathname.includes("/model-builder")) return "fpa-model-builder"
    if (pathname.includes("/worksheet")) return "fpa-models"

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
    // Admins / full module access: show all nav items so every tab is clickable
    if (hasModuleAccess("forecasting") && !isLoading) {
      const allFull = module.subModules.every((s) => hasSubModuleAccess("forecasting", s.id))
      if (allFull) return module.subModules
    }
    if (isLoading) return module.subModules
    return module.subModules.filter((subModule) => hasSubModuleAccess("forecasting", subModule.id))
  }, [module, hasSubModuleAccess, hasModuleAccess, isLoading])

  if (!module) return null

  return (
    <aside
      className={cn(
        "bg-[#f8fafc] border-r border-[#e2e8f0] h-[calc(100vh-5rem)] sticky top-20 z-10 flex flex-col transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[220px]",
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {accessibleSubModules.map((subModule) => {
          const Icon = subModule.icon
          const active = activeSubModuleId === subModule.id
          return (
            <Link
              key={subModule.id}
              href={subModule.path}
              title={subModule.name}
              prefetch
              className={cn(
                "flex items-center gap-3 h-10 rounded-md px-3 text-[13px] font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-[#e8f1ff] text-[#2563eb]"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]",
              )}
            >
              <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-[#2563eb]" : "text-[#94a3b8]")} />
              {!collapsed && <span className="truncate">{subModule.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-[#e2e8f0]">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "flex items-center gap-2 h-9 w-full rounded-lg px-3 text-[13px] text-[#64748b] hover:bg-[#f1f5f9]",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
