import { LpPortalLayout } from "@/components/layout/lp-portal-layout"
import { LpDashboard } from "@/components/lp-portal/lp-dashboard"

export default function LpPortalPage() {
  return (
    <LpPortalLayout>
      <LpDashboard />
    </LpPortalLayout>
  )
}
