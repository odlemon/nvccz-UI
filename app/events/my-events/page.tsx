import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { MyEventsPage } from "@/components/events/my-events-page"
import { EventsLayout } from "@/components/layout/events-layout"

export default function MyEvents() {
  return (
    <ModuleGuard moduleId="events-management" subModuleId="my-events">
      <EventsLayout>
        <MyEventsPage />
      </EventsLayout>
    </ModuleGuard>
  )
}
