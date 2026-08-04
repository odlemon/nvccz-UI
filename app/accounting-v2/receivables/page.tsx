import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { ReceivablesScreen } from "@/components/accounting-mock/screens/receivables-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-sales">
      <ReceivablesScreen />
    </AcV2Page>
  )
}
