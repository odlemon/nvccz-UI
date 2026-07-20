import { redirect } from "next/navigation"

export default function InvestmentsCompatibilityPage({
  params,
}: {
  params: { path?: string[] }
}) {
  const destination = {
    commitment: "/lp-portal#capital-position",
    "capital-account": "/lp-portal/account-activity?structure=private-capital",
    "investor-account": "/lp-portal#open-ended-account",
    holdings: "/lp-portal/account-activity?structure=open-ended",
  }[params.path?.[0] ?? ""] ?? "/lp-portal"

  redirect(destination)
}
