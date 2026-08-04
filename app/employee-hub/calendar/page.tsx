import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { CalendarScreen } from "@/components/employee-hub-mock/screens/calendar-screen"

export default function CalendarPage() {
  return (
    <EhPage subModuleId="eh-calendar">
      <CalendarScreen />
    </EhPage>
  )
}
