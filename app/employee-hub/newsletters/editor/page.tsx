import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { NewsletterEditorScreen } from "@/components/employee-hub-mock/screens/newsletter-editor-screen"

export default function NewsletterEditorPage() {
  return (
    <EhPage subModuleId="eh-newsletters">
      <NewsletterEditorScreen />
    </EhPage>
  )
}
