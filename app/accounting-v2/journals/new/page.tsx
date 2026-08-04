import { AcV2Page } from "@/components/accounting-mock/ac-page"
import { JournalEntryScreen } from "@/components/accounting-mock/screens/journal-entry-screen"

export default function Page() {
  return (
    <AcV2Page subModuleId="ac-journal">
      <JournalEntryScreen />
    </AcV2Page>
  )
}
