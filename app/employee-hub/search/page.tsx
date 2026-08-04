import { Suspense } from "react"
import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { SearchScreen } from "@/components/employee-hub-mock/screens/search-screen"

export default function SearchPage() {
  return (
    <EhPage subModuleId="eh-search">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading search…</div>}>
        <SearchScreen />
      </Suspense>
    </EhPage>
  )
}
