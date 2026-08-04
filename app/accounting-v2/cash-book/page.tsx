import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { CashBookScreen } from "@/components/accounting-mock/screens/cash-book-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-cash">
      <CashBookScreen />
    </AcV2Page>
  )
}
