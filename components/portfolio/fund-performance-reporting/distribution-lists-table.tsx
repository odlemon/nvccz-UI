"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDistributionLists, deactivateDistributionList } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { ReportDistributionList } from "@/lib/api/fund-performance-reporting-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { FUND_REPORTING_ACTIONS } from "@/lib/config/role-permissions"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ActivePill } from "./status-badges"
import { NoFundSelected } from "./no-fund-selected"
import { DistributionListFormDialog } from "./distribution-list-form-dialog"
import { ProcurementDataTable, type Column } from "@/components/procurement/procurement-data-table"

function summarize(d: ReportDistributionList): string {
  if (d.sourceType === "ROLE_BOUND") {
    return d.roleCodes && d.roleCodes.length > 0 ? d.roleCodes.join(", ") : "No roles configured"
  }
  return d.cohortFilter ? JSON.stringify(d.cohortFilter) : "No filter configured"
}

export function DistributionListsTable() {
  const dispatch = useAppDispatch()
  const { selectedFundId, distributionLists, distributionListsLoading, distributionListsError } =
    useAppSelector((s) => s.fundPerformanceReporting)
  const { hasSpecificAction } = useRolePermissions()
  const canManage = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.MANAGE_DISTRIBUTION_LISTS)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ReportDistributionList | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<ReportDistributionList | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    if (selectedFundId) dispatch(fetchDistributionLists(selectedFundId))
  }, [dispatch, selectedFundId])

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (d: ReportDistributionList) => { setEditTarget(d); setFormOpen(true) }

  const confirmDeactivate = async () => {
    if (!deactivateTarget || !selectedFundId) return
    setDeactivating(true)
    try {
      await dispatch(deactivateDistributionList({ id: deactivateTarget.id, fundId: selectedFundId })).unwrap()
      toast.success("Distribution list deactivated")
      setDeactivateTarget(null)
    } catch (err: any) {
      toast.error("Failed to deactivate distribution list", { description: err?.message || String(err) })
    } finally {
      setDeactivating(false)
    }
  }

  if (!selectedFundId) return <NoFundSelected />

  const columns: Column<ReportDistributionList>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "sourceType",
      label: "Source Type",
      sortable: true,
      filterable: true,
      render: (value) => <Badge variant="outline">{String(value).replace(/_/g, " ")}</Badge>,
    },
    { key: "isActive", label: "Active", sortable: true, render: (value) => <ActivePill active={value} /> },
    {
      key: "id",
      label: "Configuration",
      render: (_value, d) => (
        <span className="text-xs text-gray-500 max-w-xs truncate font-mono block">{summarize(d)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {distributionListsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{distributionListsError}</div>
      )}

      <ProcurementDataTable
        data={distributionLists}
        columns={columns}
        title="Distribution Lists"
        searchPlaceholder="Search distribution lists…"
        filterOptions={[
          { label: "Commitment Cohort", value: "COMMITMENT_COHORT" },
          { label: "Role Bound", value: "ROLE_BOUND" },
        ]}
        onCreate={canManage ? openCreate : undefined}
        onEdit={canManage ? openEdit : undefined}
        onDelete={canManage ? (d) => setDeactivateTarget(d) : undefined}
        loading={distributionListsLoading}
        emptyMessage="No distribution lists found"
        exportable={false}
      />

      {canManage && (
        <>
          <DistributionListFormDialog open={formOpen} onOpenChange={setFormOpen} fundId={selectedFundId} target={editTarget} />

          <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Distribution List</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate <strong>{deactivateTarget?.name}</strong>? This soft-deletes the
                  list — it will no longer be selectable for schedules or manual runs.
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
