import { LpCapitalActivityScreen } from "@/components/lp-portal/screens/lp-capital-activity-screen"

export default function CapitalActivityPage({
  searchParams,
}: {
  searchParams?: { tab?: string }
}) {
  return <LpCapitalActivityScreen initialTab={searchParams?.tab === "distributions" ? "distributions" : "calls"} />
}
