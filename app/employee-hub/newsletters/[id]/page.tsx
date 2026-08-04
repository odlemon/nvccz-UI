import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { NewsletterReaderScreen } from "@/components/employee-hub-mock/screens/newsletter-reader-screen"

export default async function NewsletterReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <EhPage subModuleId="eh-newsletters">
      <NewsletterReaderScreen id={id} />
    </EhPage>
  )
}
