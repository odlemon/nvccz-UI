import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { NewsScreen } from "@/components/employee-hub-mock/screens/news-screen"

export default function NewsPage() {
  return (
    <EhPage subModuleId="eh-feed">
      <NewsScreen />
    </EhPage>
  )
}
