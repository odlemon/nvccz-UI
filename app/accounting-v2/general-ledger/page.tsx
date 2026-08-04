import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { GeneralLedgerScreen } from "@/components/accounting-mock/screens/general-ledger-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-gl">
      <GeneralLedgerScreen />
    </AcV2Page>
  )
}
