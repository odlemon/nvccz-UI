import { LpRequestsMessagesScreen } from "@/components/lp-portal/screens/lp-requests-messages-screen"

export default function RequestsPage({
  searchParams,
}: {
  searchParams?: { tab?: string }
}) {
  return <LpRequestsMessagesScreen initialTab={searchParams?.tab === "messages" ? "messages" : "requests"} />
}
