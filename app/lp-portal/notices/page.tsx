import { LpNoticesScreen } from "@/components/lp-portal/screens/lp-notices-screen"

export default function NoticesPage({
  searchParams,
}: {
  searchParams?: { id?: string }
}) {
  return <LpNoticesScreen initialNoticeId={searchParams?.id} />
}
