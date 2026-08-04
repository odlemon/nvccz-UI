import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { ServicesScreen } from "@/components/employee-hub-mock/screens/services-screen"

export default function ServicesPage() {
  return (
    <EhPage subModuleId="eh-services">
      <ServicesScreen />
    </EhPage>
  )
}
