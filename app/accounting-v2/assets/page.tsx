import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { FixedAssetsScreen } from "@/components/accounting-mock/screens/fixed-assets-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-assets">
      <FixedAssetsScreen />
    </AcV2Page>
  )
}
