"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchRuns, fetchTemplates, fetchDistributionLists } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { FundReportRun } from "@/lib/api/fund-performance-reporting-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { FUND_REPORTING_ACTIONS } from "@/lib/config/role-permissions"
import { RunStatusBadge } from "./status-badges"
import { fmtDate } from "./format"
import { NoFundSelected } from "./no-fund-selected"
import { TriggerRunDialog } from "./trigger-run-dialog"
import { RunDetailSheet } from "./run-detail-sheet"
import { ProcurementDataTable, type Column } from "@/components/procurement/procurement-data-table"

const RUN_STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
]

export function RunsTable() {
  const dispatch = useAppDispatch()
  const { selectedFundId, runs, runsLoading, runsError, templates } = useAppSelector((s) => s.fundPerformanceReporting)
  const { hasSpecificAction } = useRolePermissions()
  const canTrigger = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.TRIGGER_RUN)
  const canViewDetail = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.VIEW_RUN_DETAIL)

  const [triggerOpen, setTriggerOpen] = useState(false)
  const [detailRunId, setDetailRunId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedFundId) {
      dispatch(fetchRuns({ fundId: selectedFundId, limit: 50 }))
      dispatch(fetchTemplates({ fundId: selectedFundId }))
      dispatch(fetchDistributionLists(selectedFundId))
    }
  }, [dispatch, selectedFundId])

  const templateName = (id: string) => templates.find((t) => t.id === id)?.name ?? id

  if (!selectedFundId) return <NoFundSelected />

  const columns: Column<FundReportRun>[] = [
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (value) => <RunStatusBadge status={value} />,
    },
    {
      key: "templateId",
      label: "Template",
      render: (value) => <span className="text-gray-700">{templateName(value)}</span>,
    },
    {
      key: "periodStart",
      label: "Period",
      render: (_value, r) => (
        <span className="text-gray-600 text-xs">{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</span>
      ),
    },
    {
      key: "totalRecipients",
      label: "Recipients",
      sortable: true,
      render: (value) => value ?? "—",
    },
    {
      key: "sentCount",
      label: "Sent / Failed",
      render: (_value, r) => <span>{r.sentCount ?? "—"} / {r.failedCount ?? "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => <span className="text-gray-500 text-xs">{fmtDate(value)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      {runsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{runsError}</div>
      )}

      <ProcurementDataTable
        data={runs}
        columns={columns}
        title="Report Runs"
        searchPlaceholder="Search runs…"
        filterOptions={RUN_STATUS_OPTIONS}
        onCreate={canTrigger ? () => setTriggerOpen(true) : undefined}
        onView={canViewDetail ? (r) => setDetailRunId(r.id) : undefined}
        loading={runsLoading}
        emptyMessage="No report runs found"
        exportable={false}
      />

      {canTrigger && (
        <TriggerRunDialog open={triggerOpen} onOpenChange={setTriggerOpen} fundId={selectedFundId} />
      )}

      {canViewDetail && (
        <RunDetailSheet runId={detailRunId} open={!!detailRunId} onOpenChange={(v) => !v && setDetailRunId(null)} />
      )}
    </div>
  )
}
