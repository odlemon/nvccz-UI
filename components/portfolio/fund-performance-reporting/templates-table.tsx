"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTemplates, deactivateTemplate } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { ReportTemplate } from "@/lib/api/fund-performance-reporting-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { FUND_REPORTING_ACTIONS } from "@/lib/config/role-permissions"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ActivePill } from "./status-badges"
import { fmtDate } from "./format"
import { NoFundSelected } from "./no-fund-selected"
import { TemplateFormDialog } from "./template-form-dialog"
import { TemplateViewDrawer } from "./template-view-drawer"
import { ProcurementDataTable, type Column } from "@/components/procurement/procurement-data-table"

export function TemplatesTable() {
  const dispatch = useAppDispatch()
  const { selectedFundId, templates, templatesLoading, templatesError } = useAppSelector((s) => s.fundPerformanceReporting)
  const { hasSpecificAction } = useRolePermissions()
  const canManage = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.MANAGE_TEMPLATES)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ReportTemplate | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<ReportTemplate | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<ReportTemplate | null>(null)

  useEffect(() => {
    if (selectedFundId) dispatch(fetchTemplates({ fundId: selectedFundId }))
  }, [dispatch, selectedFundId])

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (t: ReportTemplate) => { setEditTarget(t); setFormOpen(true) }
  const openView = (t: ReportTemplate) => { setViewTarget(t); setViewOpen(true) }

  const confirmDeactivate = async () => {
    if (!deactivateTarget || !selectedFundId) return
    setDeactivating(true)
    try {
      await dispatch(deactivateTemplate({ id: deactivateTarget.id, fundId: selectedFundId })).unwrap()
      toast.success("Template deactivated")
      setDeactivateTarget(null)
    } catch (err: any) {
      toast.error("Failed to deactivate template", { description: err?.message || String(err) })
    } finally {
      setDeactivating(false)
    }
  }

  if (!selectedFundId) return <NoFundSelected />

  const columns: Column<ReportTemplate>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (_value, t) => (
        <div>
          <p className="font-medium text-gray-900">{t.name}</p>
          {t.description && <p className="text-xs text-gray-400 truncate max-w-xs">{t.description}</p>}
        </div>
      ),
    },
    {
      key: "reportLevel",
      label: "Level",
      sortable: true,
      filterable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => fmtDate(value),
    },
    {
      key: "isActive",
      label: "Active",
      sortable: true,
      render: (value) => <ActivePill active={value} />,
    },
  ]

  return (
    <div className="space-y-4">
      {templatesError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{templatesError}</div>
      )}

      <ProcurementDataTable
        data={templates}
        columns={columns}
        title="Report Templates"
        searchPlaceholder="Search templates…"
        filterOptions={[
          { label: "Investor", value: "INVESTOR" },
          { label: "Board", value: "BOARD" },
        ]}
        onCreate={canManage ? openCreate : undefined}
        onEdit={canManage ? openEdit : undefined}
        onDelete={canManage ? (t) => setDeactivateTarget(t) : undefined}
        onView={openView}
        loading={templatesLoading}
        emptyMessage="No report templates found"
        exportable={false}
      />

      <TemplateViewDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        template={viewTarget}
        onEdit={() => { if (viewTarget) openEdit(viewTarget) }}
      />

      {canManage && (
        <>
          <TemplateFormDialog open={formOpen} onOpenChange={setFormOpen} fundId={selectedFundId} target={editTarget} />

          <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Template</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate <strong>{deactivateTarget?.name}</strong>? This soft-deletes the
                  template — it will no longer be selectable for schedules or manual runs, but its history is preserved.
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
