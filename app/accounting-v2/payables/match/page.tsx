import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { InvoiceMatchScreen } from "@/components/accounting-mock/screens/invoice-match-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-purchases">
      <InvoiceMatchScreen />
    </AcV2Page>
  )
}
