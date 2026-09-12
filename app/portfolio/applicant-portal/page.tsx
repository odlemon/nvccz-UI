import { redirect } from "next/navigation"
import {
  APPLY_PORTAL_EXTERNAL_URL,
  shouldRedirectFundingApplicationToApplyPortal,
} from "@/lib/portal/config"

/** Applicant intake is the standalone apply portal — redirect staff deep-links. */
export default function PortfolioV11ApplicantPortalRedirect() {
  if (shouldRedirectFundingApplicationToApplyPortal()) {
    redirect(`${APPLY_PORTAL_EXTERNAL_URL.replace(/\/$/, "")}/funding-application`)
  }
  redirect("/funding-application")
}
