import { MyEventsPage } from "@/components/events/my-events-page"
import { EventsLayout } from "@/components/layout/events-layout"

export default function MyEvents() {
  return (
    <EventsLayout>
      <MyEventsPage />
    </EventsLayout>
  )
}
