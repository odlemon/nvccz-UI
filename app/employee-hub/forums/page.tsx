import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { ForumsScreen } from "@/components/employee-hub-mock/screens/forums-screen"

export default function ForumsPage() {
  return (
    <EhPage subModuleId="eh-forums">
      <ForumsScreen />
    </EhPage>
  )
}
