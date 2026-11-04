"use client"

import { InvoicesManagement } from "@/components/accounting/invoices-management"

/** Shared content tree for the standalone and restored Receivables routes. */
export function ReceivablesLegacyContent({ enhanced = false }: { enhanced?: boolean }) {
  return <div className="p-6" data-receivables-root><InvoicesManagement enhanced={enhanced} /></div>
}
