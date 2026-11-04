"use client"

import { PayablesManagement } from "@/components/accounting/payables-management"

/** The identical content subtree used by both Payables routes. */
export function PayablesLegacyContent({ enhanced = false }: { enhanced?: boolean }) {
  return <div className="p-6" data-payables-root><PayablesManagement enhanced={enhanced} /></div>
}
