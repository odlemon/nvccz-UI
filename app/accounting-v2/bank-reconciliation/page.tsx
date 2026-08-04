import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { BankReconciliationScreen } from "@/components/accounting-mock/screens/bank-reconciliation-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-recon">
      <BankReconciliationScreen />
    </AcV2Page>
  )
}
