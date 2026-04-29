"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, FileText, Layers } from "lucide-react"

const TABS = [
  {
    id: "pillars",
    label: "BSC Pillars",
    icon: BarChart3,
    path: "/performance/configuration/pillars",
  },
  {
    id: "strategy",
    label: "Strategy",
    icon: FileText,
    path: "/performance/configuration/strategy",
  },
  {
    id: "themes",
    label: "Themes",
    icon: Layers,
    path: "/performance/configuration/themes",
  },
]

export function ConfigurationTabs() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-6">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = pathname.startsWith(t.path)
          return (
            <button
              key={t.id}
              onClick={() => router.push(t.path)}
              className={cn(
                "relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer",
                active
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
