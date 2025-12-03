import { EventsDashboard } from "@/components/events/events-dashboard"
import { EventsLayout } from "@/components/layout/events-layout"

export default function EventsPage() {
  return (
    <EventsLayout>
      <div className="p-6">
        <EventsDashboard />
      </div>
    </EventsLayout>
  )
}
