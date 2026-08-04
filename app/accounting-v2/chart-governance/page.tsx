import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { ChartGovernanceScreen } from "@/components/accounting-mock/screens/chart-governance-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-settings">
      <ChartGovernanceScreen />
    </AcV2Page>
  )
}
