import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { PerformanceScreen } from "@/components/employee-hub-mock/screens/performance-screen"

export default function EhPerformancePage() {
  return (
    <EhPage subModuleId="eh-performance">
      <PerformanceScreen />
    </EhPage>
  )
}
