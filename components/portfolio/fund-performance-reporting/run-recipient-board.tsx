"use client"

import { useAppSelector } from "@/lib/store"
import { TransportBadge } from "./status-badges"
import { fmtDate } from "./format"
import { Card } from "@/components/ui/card"

export function RunRecipientBoard({ runId }: { runId: string }) {
  const recipients = useAppSelector((s) => s.fundPerformanceReporting.runRecipientsById[runId]) ?? []
  const loading = useAppSelector((s) => s.fundPerformanceReporting.runRecipientsLoadingById[runId]) ?? false

  if (loading) return <p className="text-sm text-muted-foreground py-6">Loading recipients…</p>
  if (recipients.length === 0) return <p className="text-sm text-muted-foreground py-6">No recipients found for this run.</p>

  return (
    <Card className="bg-white border border-gray-200 shadow-none overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">LP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">PDF Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Transport</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Delivery</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sent At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recipients.map((r, idx) => (
              <tr key={r?.id ?? `${r?.clientId ?? "row"}-${idx}`}>
                <td className="px-4 py-3">{r?.lpLegalName ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{r?.email ?? "—"}</td>
                <td className="px-4 py-3">{r?.pdfStatus ?? "—"}</td>
                <td className="px-4 py-3"><TransportBadge method={r?.transportMethod} /></td>
                <td className="px-4 py-3">{r?.deliveryStatus ?? "—"}</td>
                <td className="px-4 py-3">{fmtDate(r?.sentAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
