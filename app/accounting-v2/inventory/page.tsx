import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { InventoryScreen } from "@/components/accounting-mock/screens/inventory-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-inventory">
      <InventoryScreen />
    </AcV2Page>
  )
}
