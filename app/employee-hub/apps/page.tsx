import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { AppsScreen } from "@/components/employee-hub-mock/screens/apps-screen"

export default function AppsPage() {
  return (
    <EhPage subModuleId="eh-apps">
      <AppsScreen />
    </EhPage>
  )
}
