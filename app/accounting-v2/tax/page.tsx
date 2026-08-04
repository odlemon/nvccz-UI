import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { TaxPackScreen } from "@/components/accounting-mock/screens/tax-pack-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-tax">
      <TaxPackScreen />
    </AcV2Page>
  )
}
