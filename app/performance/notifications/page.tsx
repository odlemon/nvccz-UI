"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { NotificationsFeedPage } from "@/components/performance/collaboration/notifications-feed-page"
import { ModuleGuard } from "@/lib/permissions"

export default function NotificationsPage() {
  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <div className="p-6">
          <NotificationsFeedPage />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
