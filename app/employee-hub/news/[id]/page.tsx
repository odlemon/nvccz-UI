import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { NewsArticleScreen } from "@/components/employee-hub-mock/screens/news-article-screen"

export default async function NewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <EhPage subModuleId="eh-feed">
      <NewsArticleScreen id={id} />
    </EhPage>
  )
}
