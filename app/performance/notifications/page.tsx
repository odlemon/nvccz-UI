import { PerformanceLayout } from "@/components/layout/performance-layout"
import { NotificationsMockScreen } from "@/components/performance-mock/screens/notifications-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function NotificationsPage() {
  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <NotificationsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
