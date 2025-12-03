"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CiGlobe, 
  CiMail, 
  CiChat1, 
  CiCalendar, 
  CiViewTable 
} from "react-icons/ci"

export type TabType = "feed" | "newsletter" | "calendar" | "dashboard"

interface TabViewProps {
  children: React.ReactNode
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

const tabs = [
  {
    id: "feed" as TabType,
    label: "Forum",
    icon: CiGlobe
  },
  {
    id: "newsletter" as TabType,
    label: "Newsletter", 
    icon: CiMail
  },
  {
    id: "calendar" as TabType,
    label: "Event Calendar",
    icon: CiCalendar
  },
  {
    id: "dashboard" as TabType,
    label: "Dashboard",
    icon: CiViewTable
  }
]

export function TabView({ children, activeTab: externalActiveTab, onTabChange }: TabViewProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>("feed")
  const activeTab = externalActiveTab || internalActiveTab
  
  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  return (
    <div className="space-y-0">
      {/* Tab Navigation - Sticky */}
      <div className="sticky top-40 z-20 bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex space-x-6 sm:space-x-8 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-1 text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              
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

      {/* Tab Content - Scrollable */}
      <div className="min-h-[400px] p-1">
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

export { type TabType }
