import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { FinancialReportsScreen } from "@/components/accounting-mock/screens/financial-reports-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-reports">
      <FinancialReportsScreen />
    </AcV2Page>
  )
}
