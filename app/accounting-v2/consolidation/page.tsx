import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { ConsolidationScreen } from "@/components/accounting-mock/screens/consolidation-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-consolidation">
      <ConsolidationScreen />
    </AcV2Page>
  )
}
