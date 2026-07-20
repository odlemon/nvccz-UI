import { LpSubscriptionsRedemptionsScreen } from "@/components/lp-portal/screens/lp-subscriptions-redemptions-screen"

export default function SubscriptionsRedemptionsPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const highlight =
    searchParams?.type === "redemptions"
      ? "redemptions"
      : searchParams?.type === "subscriptions"
        ? "subscriptions"
        : undefined

  return <LpSubscriptionsRedemptionsScreen highlight={highlight} />
}
