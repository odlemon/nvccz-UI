"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchSchedules, fetchTemplates, fetchDistributionLists, deactivateSchedule } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { ReportSchedule } from "@/lib/api/fund-performance-reporting-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { FUND_REPORTING_ACTIONS } from "@/lib/config/role-permissions"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { ActivePill } from "./status-badges"
import { fmtDate } from "./format"
import { NoFundSelected } from "./no-fund-selected"
import { ScheduleFormDialog } from "./schedule-form-dialog"
import { ProcurementDataTable, type Column } from "@/components/procurement/procurement-data-table"

const PERIOD_TYPE_OPTIONS = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Semi Annual", value: "SEMI_ANNUAL" },
  { label: "Annual", value: "ANNUAL" },
]

export function SchedulesTable() {
  const dispatch = useAppDispatch()
  const { selectedFundId, schedules, schedulesLoading, schedulesError, templates, distributionLists } =
    useAppSelector((s) => s.fundPerformanceReporting)
  const { hasSpecificAction } = useRolePermissions()
  const canManage = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.MANAGE_SCHEDULES)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ReportSchedule | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<ReportSchedule | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    if (selectedFundId) {
      dispatch(fetchSchedules(selectedFundId))
      dispatch(fetchTemplates({ fundId: selectedFundId }))
      dispatch(fetchDistributionLists(selectedFundId))
    }
  }, [dispatch, selectedFundId])

  const templateName = (id: string) => templates.find((t) => t.id === id)?.name ?? id

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (s: ReportSchedule) => { setEditTarget(s); setFormOpen(true) }

  const confirmDeactivate = async () => {
    if (!deactivateTarget || !selectedFundId) return
    setDeactivating(true)
    try {
      await dispatch(deactivateSchedule({ id: deactivateTarget.id, fundId: selectedFundId })).unwrap()
      toast.success("Schedule deactivated")
      setDeactivateTarget(null)
    } catch (err: any) {
      toast.error("Failed to deactivate schedule", { description: err?.message || String(err) })
    } finally {
      setDeactivating(false)
    }
  }

  if (!selectedFundId) return <NoFundSelected />

  const columns: Column<ReportSchedule>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "periodType",
      label: "Period",
      sortable: true,
      filterable: true,
      render: (value) => <Badge variant="outline">{String(value).replace(/_/g, " ")}</Badge>,
    },
    { key: "nextRunAt", label: "Next Run", sortable: true, render: (value) => fmtDate(value) },
    { key: "isActive", label: "Active", sortable: true, render: (value) => <ActivePill active={value} /> },
    {
      key: "templateId",
      label: "Template",
      render: (value) => <span className="text-xs">{templateName(value)}</span>,
    },
    {
      key: "timezone",
      label: "Timezone",
      render: (value) => <span className="font-mono text-xs">{value}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      {schedulesError ? (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Backend error retrieving schedules for this fund</AlertTitle>
          <AlertDescription className="text-amber-800">
            This is a known backend issue, not a data problem: <span className="font-mono">{schedulesError}</span>
          </AlertDescription>
        </Alert>
      ) : (
        <ProcurementDataTable
          data={schedules}
          columns={columns}
          title="Report Schedules"
          searchPlaceholder="Search schedules…"
          filterOptions={PERIOD_TYPE_OPTIONS}
          onCreate={canManage ? openCreate : undefined}
          onEdit={canManage ? openEdit : undefined}
          onDelete={canManage ? (s) => setDeactivateTarget(s) : undefined}
          loading={schedulesLoading}
          emptyMessage="No report schedules found"
          exportable={false}
        />
      )}

      {canManage && (
        <>
          <ScheduleFormDialog open={formOpen} onOpenChange={setFormOpen} fundId={selectedFundId} target={editTarget} />

          <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Schedule</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate <strong>{deactivateTarget?.name}</strong>? This soft-deletes the
                  schedule and stops future automated runs; historical runs are preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deactivating}
                  onClick={(e) => { e.preventDefault(); if (!deactivating) confirmDeactivate() }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deactivating ? "Deactivating…" : "Deactivate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
