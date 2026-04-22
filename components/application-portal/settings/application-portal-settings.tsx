"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"
import { LetterheadSettingsTab } from "./letterhead-settings-tab"

const TABS = [
  {
    id: "letterhead",
    label: "Company Profile Letterhead",
    icon: FileText,
    gradient: "from-blue-500 to-purple-600",
  },
] as const

type TabId = (typeof TABS)[number]["id"]

export function ApplicationPortalSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("letterhead")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your portal settings</p>
      </div>

      <div className="flex items-center overflow-x-auto border-b border-border">
        <div className="flex space-x-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                  isActive
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                    isActive ? tab.gradient : "from-gray-300 to-gray-400"
                  )}
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === "letterhead" && <LetterheadSettingsTab />}
    </div>
  )
}
