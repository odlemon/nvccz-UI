import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { DailyCoverScreen } from "@/components/employee-hub-mock/screens/daily-cover-screen"

export default function DailyCoverPage() {
  return (
    <EhPage subModuleId="eh-home">
      <DailyCoverScreen />
    </EhPage>
  )
}
