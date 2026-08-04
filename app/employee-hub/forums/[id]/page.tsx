import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { ForumThreadScreen } from "@/components/employee-hub-mock/screens/forum-thread-screen"

export default async function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <EhPage subModuleId="eh-forums">
      <ForumThreadScreen id={id} />
    </EhPage>
  )
}
