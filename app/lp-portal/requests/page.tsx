import { LpRequestsMessagesScreen } from "@/components/lp-portal/screens/lp-requests-messages-screen"

export default function RequestsPage({
  searchParams,
}: {
  searchParams?: { tab?: string; ref?: string }
}) {
  return (
    <LpRequestsMessagesScreen
      initialTab={searchParams?.tab === "messages" ? "messages" : "requests"}
      initialRequestRef={searchParams?.ref}
    />
  )
}
