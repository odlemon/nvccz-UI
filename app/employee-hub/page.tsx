import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { EmployeeHomeScreen } from "@/components/employee-hub-mock/screens/employee-home-screen"

export default function EmployeeHubHomePage() {
  return (
    <EhPage subModuleId="eh-home">
      <EmployeeHomeScreen />
    </EhPage>
  )
}
