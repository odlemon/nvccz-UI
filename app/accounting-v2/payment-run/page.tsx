import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { PaymentRunScreen } from "@/components/accounting-mock/screens/payment-run-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-payment-run">
      <PaymentRunScreen />
    </AcV2Page>
  )
}
