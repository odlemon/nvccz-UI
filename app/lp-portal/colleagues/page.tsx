import { LpPortalLayout } from "@/components/layout/lp-portal-layout"
import { ColleaguesAccessGuard } from "@/components/lp-portal/colleagues-access-guard"
import { LpColleagues } from "@/components/lp-portal/lp-colleagues"

export default function LpColleaguesPage() {
  return (
    <LpPortalLayout>
      <ColleaguesAccessGuard>
        <LpColleagues />
      </ColleaguesAccessGuard>
    </LpPortalLayout>
  )
}
