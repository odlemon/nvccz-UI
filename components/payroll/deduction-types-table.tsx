"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { RichDataTable, Column } from "./rich-data-table"
import { DeductionTypesForm } from "./deduction-types-form"
import { DeductionTypeDrawer } from "./deduction-type-drawer"
import { ConfirmationDialog } from "./confirmation-dialog"
import { DeductionType } from "@/lib/api/payroll-api"
import { 
  setDeductionTypes, 
  addDeductionType, 
  updateDeductionType, 
  removeDeductionType,
  setDeductionTypesLoading,
  setDeductionTypesError
} from "@/lib/store/slices/payrollSlice"
import { deductionTypesApi } from "@/lib/api/payroll-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiDollar, CiCalendar, CiUser } from "react-icons/ci"
import { Building, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

export function DeductionTypesTable() {
  const dispatch = useAppDispatch()
  const { deductionTypes, loading } = useAppSelector(state => state.payroll)
  const { hasSpecificAction } = useRolePermissions()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<DeductionType | null>(null)
  const [viewingType, setViewingType] = useState<DeductionType | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<DeductionType | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permission checks
  const canCreateDeductionType = hasSpecificAction('payroll', PAYROLL_ACTIONS.CREATE_DEDUCTION_TYPE)
  const canUpdateDeductionType = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_DEDUCTION_TYPE)
  const canDeleteDeductionType = hasSpecificAction('payroll', PAYROLL_ACTIONS.DELETE_DEDUCTION_TYPE)

  // Load deduction types on component mount
  useEffect(() => {
    loadDeductionTypes()
  }, [])

  const loadDeductionTypes = async () => {
    try {
      dispatch(setDeductionTypesLoading(true))
      const response = await deductionTypesApi.getAll()
      if (response.success && response.data) {
        dispatch(setDeductionTypes(response.data))
      } else {
        dispatch(setDeductionTypesError('Failed to load deduction types'))
        toast.error("Failed to load deduction types")
      }
    } catch (error) {
      dispatch(setDeductionTypesError('Failed to load deduction types'))
      toast.error("Failed to load deduction types")
    } finally {
      dispatch(setDeductionTypesLoading(false))
    }
  }

  const handleCreate = () => {
    setEditingType(null)
    setIsFormOpen(true)
  }

  const handleEdit = (type: DeductionType) => {
    setEditingType(type)
    setIsFormOpen(true)
  }

  const handleView = (type: DeductionType) => {
    setViewingType(type)
    setIsDrawerOpen(true)
  }

  const handleDeleteClick = (type: DeductionType) => {
    setDeleteType(type)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteType) return

    try {
      setIsDeleting(true)
      const response = await deductionTypesApi.delete(deleteType.id)
      
      if (response.success) {
        dispatch(removeDeductionType(deleteType.id))
        toast.success("Deduction type deleted successfully")
        setIsDeleteDialogOpen(false)
        setDeleteType(null)
      } else {
        throw new Error(response.message || 'Failed to delete deduction type')
      }
    } catch (error) {
      console.error('Error deleting deduction type:', error)
      dispatch(setDeductionTypesError(error instanceof Error ? error.message : 'Failed to delete deduction type'))
      toast.error("Failed to delete deduction type")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeleteType(null)
  }

  const handleSubmit = async (data: any) => {
    try {
      dispatch(setDeductionTypesLoading(true))
      
      if (editingType) {
        // Update existing type
        const response = await deductionTypesApi.update(editingType.id, data)
        if (response.success && response.data) {
          dispatch(updateDeductionType(response.data))
          toast.success("Deduction type updated successfully")
        } else {
          toast.error("Failed to update deduction type")
        }
      } else {
        // Create new type
        const response = await deductionTypesApi.create(data)
        if (response.success && response.data) {
          dispatch(addDeductionType(response.data))
          toast.success("Deduction type created successfully")
        } else {
          toast.error("Failed to create deduction type")
        }
      }
      
      setIsFormOpen(false)
      setEditingType(null)
    } catch (error) {
      toast.error("Failed to save deduction type")
    } finally {
      dispatch(setDeductionTypesLoading(false))
    }
  }

  const getStatutoryBadge = (isStatutory: boolean) => {
    return isStatutory ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Statutory
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Non-Statutory
      </Badge>
    )
  }

  const getTypeFromName = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('loan') || nameLower.includes('borrow')) return 'LOAN'
    if (nameLower.includes('pension') || nameLower.includes('retirement')) return 'PENSION'
    if (nameLower.includes('advance') || nameLower.includes('prepaid')) return 'ADVANCE'
    return 'OTHER'
  }

  const getTypeBadge = (name: string) => {
    const type = getTypeFromName(name)
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'LOAN': { label: 'Loan', color: 'bg-orange-100 text-orange-800' },
      'PENSION': { label: 'Pension', color: 'bg-blue-100 text-blue-800' },
      'ADVANCE': { label: 'Advance', color: 'bg-purple-100 text-purple-800' },
      'OTHER': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const columns: Column<DeductionType>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-red-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: '__type' as any,
      label: 'Type',
      sortable: true,
      filterable: true,
      render: (value, row) => getTypeBadge(row.name)
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      )
    },
    {
      key: 'isStatutory',
      label: 'Statutory',
      sortable: true,
      render: (value) => getStatutoryBadge(value)
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'createdBy',
      label: 'Created By',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiUser className="w-4 h-4 text-gray-400" />
          <span>{value?.firstName} {value?.lastName}</span>
        </div>
      )
    }
  ]

  const bulkActions = [
    { label: 'Activate', value: 'activate', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Deactivate', value: 'deactivate', icon: <XCircle className="w-4 h-4" /> },
    { label: 'Delete', value: 'delete', icon: <XCircle className="w-4 h-4" /> }
  ]

  const handleBulkAction = (selectedRows: DeductionType[], action: string) => {
    // Implement bulk actions
    console.log('Bulk action:', action, selectedRows)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Deduction Types</h1>
            <p className="text-gray-600 font-normal">Manage loans, pension, and other deductions</p>
          </div>
          {canCreateDeductionType && (
            <Button 
              onClick={handleCreate}
              className="rounded-full gradient-primary text-white font-normal"
            >
              <Building className="w-4 h-4 mr-2" />
              Create Deduction Type
            </Button>
          )}
        </div>

        <RichDataTable
          data={deductionTypes}
          columns={columns}
          title=""
          searchPlaceholder="Search deduction types..."
          filterOptions={[
            { label: 'All Types', value: 'all' },
            { label: 'Loan', value: 'LOAN' },
            { label: 'Pension', value: 'PENSION' },
            { label: 'Advance', value: 'ADVANCE' },
            { label: 'Other', value: 'OTHER' }
          ]}
          onEdit={canUpdateDeductionType ? handleEdit : undefined}
          onView={handleView}
          onDelete={canDeleteDeductionType ? handleDeleteClick : undefined}
          onBulkAction={handleBulkAction}
          bulkActions={bulkActions}
          loading={loading.deductionTypes}
          exportable={true}
        />
      </div>

      <DeductionTypesForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingType(null)
        }}
        onSubmit={handleSubmit}
        editingType={editingType}
        loading={loading.deductionTypes}
      />

      <DeductionTypeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        deductionType={viewingType}
        onEdit={handleEdit}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deduction Type"
        description={`Are you sure you want to delete "${deleteType?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />
    </>
  )
}