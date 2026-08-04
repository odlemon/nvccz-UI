import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { PeopleScreen } from "@/components/employee-hub-mock/screens/people-screen"

export default function PeoplePage() {
  return (
    <EhPage subModuleId="eh-people">
      <PeopleScreen />
    </EhPage>
  )
}
