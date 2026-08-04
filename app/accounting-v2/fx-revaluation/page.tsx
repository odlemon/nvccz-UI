import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { FxRevaluationScreen } from "@/components/accounting-mock/screens/fx-revaluation-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-fx">
      <FxRevaluationScreen />
    </AcV2Page>
  )
}
