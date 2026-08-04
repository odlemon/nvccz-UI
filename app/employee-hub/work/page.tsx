import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { WorkScreen } from "@/components/employee-hub-mock/screens/work-screen"

export default function WorkPage() {
  return (
    <EhPage subModuleId="eh-work">
      <WorkScreen />
    </EhPage>
  )
}
