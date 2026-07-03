import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { EventsDashboard } from "@/components/events/events-dashboard"
import { EventsLayout } from "@/components/layout/events-layout"

export default function EventsPage() {
  return (
    <ModuleGuard moduleId="events-management" subModuleId="events-dashboard">
      <EventsLayout>
        <div className="p-6">
          <EventsDashboard />
        </div>
      </EventsLayout>
    </ModuleGuard>
  )
}
