"use client"

import { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CiCircleChevDown,
  CiCircleChevRight,
  CiGrid41,
  CiViewBoard,
  CiViewList,
  CiViewTable,
  CiViewTimeline,
  CiViewColumn,
  CiHome,
  CiFileOn,
  CiUser,
  CiCircleCheck,
  CiDollar,
  CiShop,
  CiSettings,
} from "react-icons/ci"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentModule: string
  activeItem: string
  onItemSelect: (item: string) => void
}

const routeMapping = {
  // Portfolio Management
  "portfolio-overview": "/portfolio",
  "performance-analytics": "/portfolio/analytics",
  "risk-assessment": "/portfolio/risk",

  // Applications
  "applications-dashboard": "/applications",
  "application-form": "/applications/form",
  "initial-screening": "/applications/screening",
  "due-diligence": "/applications/due-diligence",
  "board-review": "/applications/board-review",
  "term-sheet": "/applications/term-sheet",
  "fund-disbursement": "/applications/disbursement",

  // Companies
  "portfolio-companies": "/companies",
  "performance-dashboard": "/companies/performance",
  "quarterly-updates": "/companies/updates",

  // Funds
  "fund-management": "/funds",
  investors: "/funds/investors",
  "fund-analytics": "/funds/analytics",

  // Account & Performance
  "arcus-dashboard": "/account",
  "account-settings": "/account/settings",


}

const moduleMenus = {
  "portfolio-management": [
    { id: "portfolio-overview", label: "Portfolio Overview", icon: CiGrid41 },
    { id: "performance-analytics", label: "Performance Analytics", icon: CiViewBoard },
    { id: "risk-assessment", label: "Risk Assessment", icon: CiViewTable },
  ],
  applications: [
    { id: "applications-dashboard", label: "Applications Dashboard", icon: CiGrid41 },
    { id: "application-form", label: "Create Application", icon: CiViewList },
    { id: "initial-screening", label: "Initial Screening", icon: CiViewTable },
    { id: "due-diligence", label: "Due Diligence", icon: CiViewColumn },
    { id: "board-review", label: "Board Review", icon: CiViewBoard },
    { id: "term-sheet", label: "Term Sheet", icon: CiFileOn },
    { id: "fund-disbursement", label: "Fund Disbursement", icon: CiViewTimeline },
  ],
  companies: [
    { id: "portfolio-companies", label: "Portfolio Companies", icon: CiGrid41 },
    { id: "performance-dashboard", label: "Performance Dashboard", icon: CiViewBoard },
    { id: "quarterly-updates", label: "Quarterly Updates", icon: CiViewList },
  ],
  funds: [
    { id: "fund-management", label: "Fund Management", icon: CiGrid41 },
    { id: "investors", label: "Investors", icon: CiViewTable },
    { id: "fund-analytics", label: "Fund Analytics", icon: CiViewBoard },
  ],
  "account-performance": [
    { id: "arcus-dashboard", label: "Kyntaro Dashboard", icon: CiGrid41 },
    { id: "performance-analytics", label: "Performance Analytics", icon: CiViewBoard },
    { id: "account-settings", label: "Account Settings", icon: CiSettings },
  ],
}

const favoriteItems = [
  { id: "opportunity-stages", label: "Stages", icon: CiViewTimeline },
  { id: "key-metrics", label: "Metrics", icon: CiViewBoard },
  { id: "product-plan", label: "Plan", icon: CiViewTable },
]

export function Sidebar({ currentModule, activeItem, onItemSelect }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["favorites"])
  const router = useRouter()
  const pathname = usePathname()

  // compute active item based on routeMapping: exact match or longest matching prefix
  const activeItemIdComputed = useMemo(() => {
    if (!pathname) return null
    let bestId: string | null = null
    let bestScore = -1
    for (const [id, route] of Object.entries(routeMapping)) {
      if (!route) continue
      if (pathname === route) return id
      if (route !== "/" && pathname.startsWith(route + "/")) {
        const score = route.length
        if (score > bestScore) {
          bestScore = score
          bestId = id
        }
      }
    }
    return bestId
  }, [pathname])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleItemClick = (itemId: string) => {
    const route = routeMapping[itemId as keyof typeof routeMapping]
    if (route) {
      // router.push(route)
      //use js redirect
      window.location.href = route
      onItemSelect(itemId)
    }
  }

  const isItemActive = (itemId: string) => activeItemIdComputed === itemId

  const menuItems = moduleMenus[currentModule as keyof typeof moduleMenus] || []
  const showFundSwitcher = ["portfolio-management", "applications", "companies", "funds"].includes(currentModule)

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
      <div className="p-4 space-y-4">
        {/* Logo */}
      
        {/* Fund Switcher */}
        {/* {showFundSwitcher && (
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between bg-muted/40 cursor-pointer">
              <span className="text-base">Kyntaro Growth Fund I</span>
              <CiCircleChevDown className="w-4 h-4" />
            </Button>
          </div>
        )} */}

        {/* Main Navigation */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item.id)

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 cursor-pointer rounded-full transition-all duration-200",
                  "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:rounded-full",
                  isActive && "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg rounded-full",
                )}
                onClick={() => handleItemClick(item.id)}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-normal">{item.label}</span>
              </Button>
            )
          })}
        </div>

        
      </div>
    </aside>
  )
}