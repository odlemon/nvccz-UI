"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchRunDetail, fetchRunLogs, fetchRunRecipients } from "@/lib/store/slices/fundPerformanceReportingSlice"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RunStatusBadge } from "./status-badges"
import { fmtDate } from "./format"
import { RunRecipientBoard } from "./run-recipient-board"
import { RunLogsFeed } from "./run-logs-feed"

interface RunDetailSheetProps {
  runId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="text-sm font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  )
}

export function RunDetailSheet({ runId, open, onOpenChange }: RunDetailSheetProps) {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState("overview")
  const run = useAppSelector((s) => (runId ? s.fundPerformanceReporting.runDetailById[runId] : undefined))
  const loading = useAppSelector((s) => (runId ? s.fundPerformanceReporting.runDetailLoadingById[runId] : false)) ?? false

  useEffect(() => {
    if (open && runId) {
      dispatch(fetchRunDetail(runId))
      setTab("overview")
    }
  }, [open, runId, dispatch])

  const handleTabChange = (value: string) => {
    setTab(value)
    if (!runId) return
    if (value === "recipients") dispatch(fetchRunRecipients(runId))
    if (value === "logs") dispatch(fetchRunLogs(runId))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[70vw] min-w-[1200px] sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Report Run Detail</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {!runId ? null : (
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-6">Loading…</p>
                ) : !run ? (
                  <p className="text-sm text-muted-foreground py-6">No detail available for this run.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    <StatCard label="Status" value={<RunStatusBadge status={run.status} />} />
                    <StatCard label="Progress" value={run.progress != null ? `${run.progress}%` : "—"} />
                    <StatCard label="Total Recipients" value={run.totalRecipients ?? "—"} />
                    <StatCard label="Sent" value={run.sentCount ?? "—"} />
                    <StatCard label="Failed" value={run.failedCount ?? "—"} />
                    <StatCard label="Period Start" value={fmtDate(run.periodStart)} />
                    <StatCard label="Period End" value={fmtDate(run.periodEnd)} />
                    <StatCard label="Created" value={fmtDate(run.createdAt)} />
                    <StatCard label="Completed" value={fmtDate(run.completedAt)} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recipients">
                <RunRecipientBoard runId={runId} />
              </TabsContent>

              <TabsContent value="logs">
                <RunLogsFeed runId={runId} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
