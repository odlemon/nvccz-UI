"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ModuleGuard } from "@/lib/permissions"
import { ConfigurationTabs } from "@/components/performance/configuration/configuration-tabs"
import { StrategicThemesManager } from "@/components/performance/configuration/strategic-themes-manager"
import { Settings } from "lucide-react"

export default function ConfigThemesPage() {
  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Performance Configuration
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure pillars, strategy cycles, and strategic themes.
            </p>
          </div>
          <ConfigurationTabs />
          <StrategicThemesManager />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
