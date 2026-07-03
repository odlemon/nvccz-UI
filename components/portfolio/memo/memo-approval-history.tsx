"use client"

import { format } from "date-fns"
import { CheckCircle2, XCircle, Send } from "lucide-react"
import type { ApprovalHistoryEntry } from "@/lib/api/investment-memo-api"
import { cn } from "@/lib/utils"

const ACTION_CONFIG: Record<string, { icon: any; bg: string; label: string }> = {
  SUBMITTED: { icon: Send, bg: "bg-amber-50 border-amber-100 text-amber-600", label: "Submitted for approval" },
  APPROVED: { icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-100 text-emerald-600", label: "Approved" },
  REJECTED: { icon: XCircle, bg: "bg-red-50 border-red-100 text-red-600", label: "Rejected" },
}

export function MemoApprovalHistory({ entries, loading }: { entries: ApprovalHistoryEntry[]; loading: boolean }) {
  if (loading) {
    return <div className="p-4 space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
    </div>
  }

  if (entries.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No approval activity yet.</div>
  }

  return (
    <div className="divide-y divide-gray-50">
      {entries.map((entry) => {
        const cfg = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.SUBMITTED
        const Icon = cfg.icon
        return (
          <div key={entry.id} className="flex items-start gap-3 py-3">
            <div className={cn("w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-800">{cfg.label}</span>
                <span className="text-xs text-muted-foreground">
                  v{entry.version.versionNumber} by {entry.actor.firstName} {entry.actor.lastName}
                </span>
              </div>
              {entry.comment && <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>}
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {format(new Date(entry.createdAt), "MMM d, HH:mm")}
            </span>
          </div>
        )
      })}
    </div>
  )
}
