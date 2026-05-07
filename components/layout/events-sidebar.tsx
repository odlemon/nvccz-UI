"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"

export function EventsSidebar() {
  const pathname = usePathname()

  const module = getModuleById("events-management")

  // Fix: Only highlight dashboard on exact match, others on startsWith
  const isPathActive = (path: string, isDashboard: boolean) => {
    const base = path.split("?")[0]
    if (isDashboard) {
      return pathname === base
    }
    return pathname.startsWith(base + "/") || pathname === base
  }

  if (!module) {
    return null
  }

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
            <h2 className="text-sm font-semibold text-gray-900">{module.name}</h2>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {module.subModules.map((subModule, idx) => {
            const Icon = subModule.icon
            // Assume dashboard is always the first subModule (adjust if needed)
            const isDashboard = idx === 0 || subModule.id === "dashboard"
            const active = isPathActive(subModule.path, isDashboard)
            return (
              <Link
                key={subModule.id}
                href={subModule.path}
                className={cn(
                  "flex items-center gap-3 h-9 cursor-pointer rounded-full transition-all duration-200 text-gray-800 px-3",
                  !active && "hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:rounded-full",
                  active && "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg rounded-full hover:from-purple-600 hover:to-purple-700",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-normal">{subModule.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
