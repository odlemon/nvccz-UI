import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { ShortTermInvestmentsScreen } from "@/components/accounting-mock/screens/short-term-investments-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-sti">
      <ShortTermInvestmentsScreen />
    </AcV2Page>
  )
}
