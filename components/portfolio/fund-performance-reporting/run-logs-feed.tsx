"use client"

import { useMemo, useState } from "react"
import { useAppSelector } from "@/lib/store"
import type { RunEventType } from "@/lib/api/fund-performance-reporting-api"
import { EventTypeBadge } from "./status-badges"
import { fmtDate } from "./format"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const EVENT_TYPES: RunEventType[] = ["SENT", "BOUNCE", "COMPLAINT", "DOWNLOAD"]

export function RunLogsFeed({ runId }: { runId: string }) {
  const logs = useAppSelector((s) => s.fundPerformanceReporting.runLogsById[runId]) ?? []
  const loading = useAppSelector((s) => s.fundPerformanceReporting.runLogsLoadingById[runId]) ?? false
  const [filter, setFilter] = useState<string>("ALL")

  const filtered = useMemo(() => (filter === "ALL" ? logs : logs.filter((l) => l?.eventType === filter)), [logs, filter])

  if (loading) return <p className="text-sm text-muted-foreground py-6">Loading logs…</p>

  return (
    <div className="mt-4 space-y-3">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="h-8 w-48 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Events</SelectItem>
          {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">No delivery events for this run.</p>
      ) : (
        <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl bg-white overflow-hidden">
          {filtered.map((log, idx) => (
            <div key={log?.id ?? idx} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <EventTypeBadge eventType={log?.eventType} />
                <span className="font-mono text-xs text-gray-600">{log?.recipientEmail ?? "—"}</span>
              </div>
              <span className="text-xs text-gray-400">{fmtDate(log?.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
