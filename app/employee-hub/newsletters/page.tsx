import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { NewslettersScreen } from "@/components/employee-hub-mock/screens/newsletters-screen"

export default function NewslettersPage() {
  return (
    <EhPage subModuleId="eh-newsletters">
      <NewslettersScreen />
    </EhPage>
  )
}
