import { redirect } from "next/navigation"

export default function DealingPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const type = searchParams?.type === "redemptions" ? "redemptions" : searchParams?.type === "subscriptions" ? "subscriptions" : undefined
  redirect(`/lp-portal/subscriptions-redemptions${type ? `?type=${type}` : ""}`)
}
