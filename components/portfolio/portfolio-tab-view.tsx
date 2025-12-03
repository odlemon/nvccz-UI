"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  Target 
} from "lucide-react"

export type PortfolioTabType = "performance" | "sectors" | "risk" | "benchmarks"

interface PortfolioTabViewProps {
  children: React.ReactNode
  activeTab?: PortfolioTabType
  onTabChange?: (tab: PortfolioTabType) => void
}

const tabs = [
  {
    id: "performance" as PortfolioTabType,
    label: "Performance",
    icon: BarChart3
  },
  {
    id: "sectors" as PortfolioTabType,
    label: "Sectors",
    icon: PieChart
  },
  {
    id: "risk" as PortfolioTabType,
    label: "Risk Analysis",
    icon: Activity
  },
  {
    id: "benchmarks" as PortfolioTabType,
    label: "Benchmarks",
    icon: Target
  }
]

export function PortfolioTabView({ children, activeTab: externalActiveTab, onTabChange }: PortfolioTabViewProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<PortfolioTabType>("performance")
  const activeTab = externalActiveTab || internalActiveTab
  
  const handleTabChange = (tab: PortfolioTabType) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-3 py-4 px-1 text-base font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              
              {/* Active tab underline */}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export { type PortfolioTabType }
