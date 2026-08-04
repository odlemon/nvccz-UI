import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { MonthEndCloseScreen } from "@/components/accounting-mock/screens/month-end-close-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-close">
      <MonthEndCloseScreen />
    </AcV2Page>
  )
}
