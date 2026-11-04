import { redirect } from "next/navigation"

/** Group Consolidation lives under the Financial Reports tabs. Preserve old links. */
export default function Page() {
  redirect("/accounting/reports?tab=group-consolidation")
}
