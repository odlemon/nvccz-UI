"use client"

import { useParams } from "next/navigation"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { EventsLayout } from "@/components/layout/events-layout"
import { EventDetailPage } from "@/components/events/event-detail-page"

export default function EventDetail() {
  const params = useParams()
  const eventId = params.id as string

  return (
    <ModuleGuard moduleId="events-management">
      <EventsLayout>
        <EventDetailPage eventId={eventId} />
      </EventsLayout>
    </ModuleGuard>
  )
}
