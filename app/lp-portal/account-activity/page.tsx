import { LpAccountActivityScreen } from "@/components/lp-portal/screens/lp-account-activity-screen"

export default function AccountActivityPage({
  searchParams,
}: {
  searchParams?: { structure?: string }
}) {
  return <LpAccountActivityScreen initialStructure={searchParams?.structure} />
}
