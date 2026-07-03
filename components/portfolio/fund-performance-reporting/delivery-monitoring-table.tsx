"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchRuns, fetchRunLogs } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { RunEventType } from "@/lib/api/fund-performance-reporting-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { FUND_REPORTING_ACTIONS } from "@/lib/config/role-permissions"
import { EventTypeBadge } from "./status-badges"
import { fmtDate } from "./format"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { NoFundSelected } from "./no-fund-selected"
import { AccessDeniedCard } from "./access-denied-card"
import { ProcurementDataTable, type Column } from "@/components/procurement/procurement-data-table"

const MAX_RUNS = 10
const EVENT_TYPES: RunEventType[] = ["SENT", "BOUNCE", "COMPLAINT", "DOWNLOAD"]

interface DeliveryLogRow {
  id: string
  runId: string
  eventType?: RunEventType | string | null
  recipientEmail?: string | null
  jobId?: string | null
  createdAt?: string | null
}

export function DeliveryMonitoringTable() {
  const dispatch = useAppDispatch()
  const { selectedFundId, runs, runsLoading, runLogsById, runLogsLoadingById } = useAppSelector((s) => s.fundPerformanceReporting)
  const { hasSpecificAction } = useRolePermissions()
  const canView = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.VIEW_DELIVERY_MONITORING)

  const [eventFilter, setEventFilter] = useState("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    if (selectedFundId && canView) dispatch(fetchRuns({ fundId: selectedFundId, limit: MAX_RUNS }))
  }, [dispatch, selectedFundId, canView])

  const visibleRunIds = useMemo(() => runs.slice(0, MAX_RUNS).map((r) => r.id), [runs])
  const visibleRunIdsKey = visibleRunIds.join(",")

  useEffect(() => {
    if (!canView) return
    visibleRunIds.forEach((id) => dispatch(fetchRunLogs(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, visibleRunIdsKey, canView])

  const isLoadingAny = runsLoading || visibleRunIds.some((id) => runLogsLoadingById[id])

  const allLogs = useMemo(() => {
    return visibleRunIds.flatMap((id) => (runLogsById[id] ?? []).map((log) => ({ ...log, runId: id })))
  }, [visibleRunIds, runLogsById])

  const filtered = useMemo(() => {
    return allLogs
      .filter((log) => {
        if (eventFilter !== "ALL" && log.eventType !== eventFilter) return false
        if (fromDate && log.createdAt && new Date(log.createdAt) < new Date(fromDate)) return false
        if (toDate && log.createdAt && new Date(log.createdAt) > new Date(`${toDate}T23:59:59`)) return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
  }, [allLogs, eventFilter, fromDate, toDate])

  const tableRows: DeliveryLogRow[] = useMemo(
    () => filtered.map((log, idx) => ({ ...log, id: log.id ?? `${log.runId}-${idx}` })),
    [filtered]
  )

  if (!canView) return <AccessDeniedCard message="You do not have permission to view delivery monitoring." />
  if (!selectedFundId) return <NoFundSelected />

  const columns: Column<DeliveryLogRow>[] = [
    { key: "eventType", label: "Event", sortable: true, render: (value) => <EventTypeBadge eventType={value} /> },
    {
      key: "recipientEmail",
      label: "Recipient",
      render: (value) => <span className="font-mono text-xs">{value ?? "—"}</span>,
    },
    {
      key: "runId",
      label: "Run",
      render: (value) => <span className="font-mono text-xs text-gray-500">{value ? `${String(value).slice(0, 8)}…` : "—"}</span>,
    },
    {
      key: "jobId",
      label: "Job ID",
      render: (value) => <span className="font-mono text-xs text-gray-500">{value ?? "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Timestamp",
      sortable: true,
      render: (value) => <span className="text-xs text-gray-500">{fmtDate(value)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground italic">
        Fanned out from per-run delivery logs across the {Math.min(runs.length, MAX_RUNS)} most recent runs, pending a
        dedicated cross-run delivery monitoring endpoint.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="h-9 w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Events</SelectItem>
            {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-40 bg-white" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-40 bg-white" />
      </div>

      <ProcurementDataTable
        data={tableRows}
        columns={columns}
        title="Delivery Events"
        searchPlaceholder="Search recipient emails…"
        loading={isLoadingAny}
        showFilters={false}
        exportable={false}
        pageSize={20}
        emptyMessage="No delivery events match the current filters."
      />
    </div>
  )
}
