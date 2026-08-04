import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { ExpensesScreen } from "@/components/accounting-mock/screens/expenses-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-expenses">
      <ExpensesScreen />
    </AcV2Page>
  )
}
