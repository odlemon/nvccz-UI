import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { CommandCentreScreen } from "@/components/accounting-mock/screens/command-centre-screen"

export default function AccountingV2HomePage() {
  return (
    <AcV2Page subModuleId="ac-dashboard">
      <CommandCentreScreen />
    </AcV2Page>
  )
}
