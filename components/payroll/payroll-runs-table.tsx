"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RichDataTable } from "./rich-data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { PayrollRunForm } from "./payroll-run-form"
import { PayrollRunDrawer } from "./payroll-run-drawer"
import { PayrollRun, payrollRunsApi } from "@/lib/api/payroll-api"
import { Play, Plus, Calendar, DollarSign, Users, FileText, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/api-client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

export function PayrollRunsTable() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingRun, setEditingRun] = useState<PayrollRun | null>(null)
  const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null)
  const [periodStart, setPeriodStart] = useState<Date | null>(null)
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingRun, setDeletingRun] = useState<PayrollRun | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { hasSpecificAction } = useRolePermissions()

  // Permission checks
  const canCreateRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.CREATE_PAYROLL_RUN)
  const canUpdateRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_PAYROLL_RUN)
  const canDeleteRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.DELETE_PAYROLL_RUN)
  const canProcessRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.PROCESS_PAYROLL_RUN)
  const canApproveRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.APPROVE_PAYROLL_RUN)
  const canCompleteRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.COMPLETE_PAYROLL_RUN)

  // Load payroll runs
  const loadPayrollRuns = async () => {
    try {
      setLoading(true)
      const response = await payrollRunsApi.getAll()
      if (response.success && response.data) {
        setPayrollRuns(response.data)
      } else {
        toast.error('Failed to load payroll runs')
      }
    } catch (error) {
      console.error('Error loading payroll runs:', error)
      const message = error instanceof ApiError ? (error.response?.message || error.message) : 'Failed to load payroll runs'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayrollRuns()
  }, [])

  // Apply date range filtering (status and search are handled by the table internally)
  const filteredData = useMemo(() => {
    if (!periodStart && !periodEnd) return payrollRuns
    return payrollRuns.filter(run => {
      const start = new Date(run.startDate)
      const end = new Date(run.endDate)
      const afterStart = periodStart ? start >= new Date(periodStart.setHours(0,0,0,0)) : true
      const beforeEnd = periodEnd ? end <= new Date(periodEnd.setHours(23,59,59,999)) : true
      return afterStart && beforeEnd
    })
  }, [payrollRuns, periodStart, periodEnd])

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>
      case 'PROCESSING':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Processing</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Format currency amount
  const formatCurrency = (amount: string, currency?: { symbol: string } | null) => {
    const symbol = currency?.symbol || '$'
    const value = parseFloat(amount) || 0
    return `${symbol}${value.toLocaleString()}`
  }

  // Handle create
  const handleCreate = () => {
    setEditingRun(null)
    setIsFormOpen(true)
  }

  // Handle edit
  const handleEdit = (run: PayrollRun) => {
    if (run.status !== 'DRAFT') {
      toast.error('You can only edit a payroll run in Draft status')
      return
    }
    setEditingRun(run)
    setIsFormOpen(true)
  }

  // Handle view
  const handleView = (run: PayrollRun) => {
    setViewingRun(run)
    setIsDrawerOpen(true)
  }

  // Delete dialog
  const openDeleteDialog = (run: PayrollRun) => {
    setDeletingRun(run)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRun) return
    try {
      setIsDeleting(true)
      await payrollRunsApi.delete(deletingRun.id)
      toast.success('Payroll run deleted successfully')
      setIsDeleteOpen(false)
      setDeletingRun(null)
      loadPayrollRuns()
    } catch (error) {
      console.error('Error deleting payroll run:', error)
      const message = error instanceof ApiError ? (error.response?.message || error.message) : 'Failed to delete payroll run'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle process
  const handleProcess = async (run: PayrollRun, options?: { skipConfirm?: boolean }) => {
    if (run.status !== 'DRAFT') {
      toast.error('You can only process a payroll run in Draft status')
      return
    }
    try {
      await payrollRunsApi.process(run.id)
      toast.success('Payroll run processed successfully')
      loadPayrollRuns()
    } catch (error) {
      console.error('Error processing payroll run:', error)
      const message = error instanceof ApiError ? (error.response?.message || error.message) : 'Failed to process payroll run'
      toast.error(message)
    }
  }

  // Handle form submit
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingRun) {
        await payrollRunsApi.update(editingRun.id, data)
        toast.success('Payroll run updated successfully')
      } else {
        await payrollRunsApi.create(data)
        toast.success('Payroll run created successfully')
      }
      setIsFormOpen(false)
      setEditingRun(null)
      loadPayrollRuns()
    } catch (error) {
      console.error('Error saving payroll run:', error)
      const fallback = editingRun ? 'Failed to update payroll run' : 'Failed to create payroll run'
      const message = error instanceof ApiError ? (error.response?.message || error.message || fallback) : fallback
      toast.error(message)
      throw error
    }
  }

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingRun(null)
  }

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
    setViewingRun(null)
  }

  const columns = [
    {
      key: "name" as keyof PayrollRun,
      label: "Name",
      sortable: true,
      render: (value: string, row: PayrollRun) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.payPeriod}</div>
        </div>
      ),
    },
    {
      key: "status" as keyof PayrollRun,
      label: "Status",
      sortable: true,
      filterable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "startDate" as keyof PayrollRun,
      label: "Period",
      sortable: true,
      render: (value: string, row: PayrollRun) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {new Date(value).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </div>
          <div className="text-gray-500">
            to {new Date(row.endDate).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </div>
        </div>
      ),
    },
    {
      key: "totalGrossPay" as keyof PayrollRun,
      label: "Gross Pay",
      sortable: true,
      render: (value: string, row: PayrollRun) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: "totalNetPay" as keyof PayrollRun,
      label: "Net Pay",
      sortable: true,
      render: (value: string, row: PayrollRun) => (
        <span className="font-medium text-green-600">
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: "_count" as keyof PayrollRun,
      label: "Employees",
      sortable: false,
      render: (value: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          {value?.employeePayrolls || 0}
        </div>
      ),
    },
    {
      key: "createdAt" as keyof PayrollRun,
      label: "Created",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
        </span>
      ),
    }
  ]

  const filterOptions = [
    { value: "all", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PROCESSING", label: "Processing" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" }
  ]

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
            <Play className="w-6 h-6" />
            Payroll Runs
          </h1>
          <p className="text-gray-600 mt-1">
            Manage payroll runs and process employee payments
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-full gradient-primary text-white font-normal"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Payroll Run
        </Button>
      </div>

      {/* Table */}
      <RichDataTable
        data={filteredData}
        columns={columns}
        loading={loading}
        filterOptions={filterOptions}
        extraControls={(
          <>
            <DatePicker
              value={periodStart}
              onChange={setPeriodStart}
              placeholder="Period Start"
              allowFutureDates={true}
              className="h-10 w-[160px]"
            />
            <DatePicker
              value={periodEnd}
              onChange={setPeriodEnd}
              placeholder="Period End"
              allowFutureDates={true}
              className="h-10 w-[160px]"
            />
            {(periodStart || periodEnd) && (
              <Button variant="outline" onClick={() => { setPeriodStart(null); setPeriodEnd(null) }} className="rounded-full h-10">
                Clear
              </Button>
            )}
          </>
        )}
        searchPlaceholder="Search payroll runs..."
        title=""
        onView={handleView}
        onEdit={canUpdateRun ? handleEdit : undefined}
        onDelete={canDeleteRun ? openDeleteDialog : undefined}
        customActions={(row: PayrollRun) => (
          <div className="flex items-center gap-1">
            {row.status === 'DRAFT' && canProcessRun && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleProcess(row)
                }}
                className="h-8 px-3 text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                Process
              </Button>
            )}
          </div>
        )}
      />

      {/* Form Modal */}
      <PayrollRunForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editingRun={editingRun}
        loading={loading}
      />

      {/* View Drawer */}
      <PayrollRunDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        payrollRun={viewingRun}
        onEdit={handleEdit}
        onProcess={handleProcess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-normal">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Payroll Run
            </DialogTitle>
            <DialogDescription>
              {deletingRun ? (
                <>Are you sure you want to delete "{deletingRun.name}"? This action cannot be undone.</>
              ) : (
                <>Are you sure you want to delete this payroll run?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
