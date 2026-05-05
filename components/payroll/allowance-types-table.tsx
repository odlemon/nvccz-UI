"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { RichDataTable, Column } from "./rich-data-table"
import { AllowanceTypesForm } from "./allowance-types-form"
import { AllowanceTypeDrawer } from "./allowance-type-drawer"
import { ConfirmationDialog } from "./confirmation-dialog"
import { AllowanceType } from "@/lib/api/payroll-api"
import { 
  setAllowanceTypes, 
  addAllowanceType, 
  updateAllowanceType, 
  removeAllowanceType,
  setAllowanceTypesLoading,
  setAllowanceTypesError
} from "@/lib/store/slices/payrollSlice"
import { allowanceTypesApi } from "@/lib/api/payroll-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiDollar, CiCalendar, CiUser } from "react-icons/ci"
import { Building, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

export function AllowanceTypesTable() {
  const dispatch = useAppDispatch()
  const { allowanceTypes, loading } = useAppSelector(state => state.payroll)
  const { hasSpecificAction } = useRolePermissions()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<AllowanceType | null>(null)
  const [viewingType, setViewingType] = useState<AllowanceType | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<AllowanceType | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permission checks
  const canCreateAllowanceType = hasSpecificAction('payroll', PAYROLL_ACTIONS.CREATE_ALLOWANCE_TYPE)
  const canUpdateAllowanceType = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_ALLOWANCE_TYPE)
  const canDeleteAllowanceType = hasSpecificAction('payroll', PAYROLL_ACTIONS.DELETE_ALLOWANCE_TYPE)

  // Load allowance types on component mount
  useEffect(() => {
    loadAllowanceTypes()
  }, [])

  const loadAllowanceTypes = async () => {
    try {
      dispatch(setAllowanceTypesLoading(true))
      const response = await allowanceTypesApi.getAll()
      if (response.success && response.data) {
        dispatch(setAllowanceTypes(response.data))
      } else {
        dispatch(setAllowanceTypesError('Failed to load allowance types'))
        toast.error("Failed to load allowance types")
      }
    } catch (error) {
      dispatch(setAllowanceTypesError('Failed to load allowance types'))
      toast.error("Failed to load allowance types")
    } finally {
      dispatch(setAllowanceTypesLoading(false))
    }
  }

  const handleCreate = () => {
    setEditingType(null)
    setIsFormOpen(true)
  }

  const handleEdit = (type: AllowanceType) => {
    setEditingType(type)
    setIsFormOpen(true)
  }

  const handleView = (type: AllowanceType) => {
    setViewingType(type)
    setIsDrawerOpen(true)
  }

  const handleDeleteClick = (type: AllowanceType) => {
    setDeleteType(type)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteType) return

    try {
      setIsDeleting(true)
      const response = await allowanceTypesApi.delete(deleteType.id)
      
      if (response.success) {
        dispatch(removeAllowanceType(deleteType.id))
        toast.success("Allowance type deleted successfully")
        setIsDeleteDialogOpen(false)
        setDeleteType(null)
      } else {
        throw new Error(response.message || 'Failed to delete allowance type')
      }
    } catch (error) {
      console.error('Error deleting allowance type:', error)
      dispatch(setAllowanceTypesError(error instanceof Error ? error.message : 'Failed to delete allowance type'))
      toast.error("Failed to delete allowance type")
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
      dispatch(setAllowanceTypesLoading(true))
      
      if (editingType) {
        // Update existing type
        const response = await allowanceTypesApi.update(editingType.id, data)
        if (response.success && response.data) {
          dispatch(updateAllowanceType(response.data))
          toast.success("Allowance type updated successfully")
        } else {
          toast.error("Failed to update allowance type")
        }
      } else {
        // Create new type
        const response = await allowanceTypesApi.create(data)
        if (response.success && response.data) {
          dispatch(addAllowanceType(response.data))
          toast.success("Allowance type created successfully")
        } else {
          toast.error("Failed to create allowance type")
        }
      }
      
      setIsFormOpen(false)
      setEditingType(null)
    } catch (error) {
      toast.error("Failed to save allowance type")
    } finally {
      dispatch(setAllowanceTypesLoading(false))
    }
  }

  const getTaxableBadge = (isTaxable: boolean) => {
    return isTaxable ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Taxable
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Non-Taxable
      </Badge>
    )
  }

  const getTypeFromName = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('housing') || nameLower.includes('house')) return 'HOUSING'
    if (nameLower.includes('transport') || nameLower.includes('travel')) return 'TRANSPORT'
    if (nameLower.includes('medical') || nameLower.includes('health')) return 'MEDICAL'
    if (nameLower.includes('short-time') || nameLower.includes('short time') || nameLower.includes('shorttime')) return 'SHORT_TIME'
    if (nameLower.includes('sick leave') || nameLower.includes('sick') || nameLower.includes('illness')) return 'SICK_LEAVE'
    if (nameLower.includes('annual leave') || nameLower.includes('vacation') || nameLower.includes('holiday')) return 'ANNUAL_LEAVE'
    if (nameLower.includes('unpaid leave') || nameLower.includes('unpaid') || nameLower.includes('no pay')) return 'UNPAID_LEAVE'
    return 'OTHER'
  }

  const getTypeBadge = (name: string) => {
    const type = getTypeFromName(name)
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'HOUSING': { label: 'Housing', color: 'bg-blue-100 text-blue-800' },
      'TRANSPORT': { label: 'Transport', color: 'bg-green-100 text-green-800' },
      'MEDICAL': { label: 'Medical', color: 'bg-red-100 text-red-800' },
      'SHORT_TIME': { label: 'Short-time', color: 'bg-yellow-100 text-yellow-800' },
      'SICK_LEAVE': { label: 'Sick Leave', color: 'bg-pink-100 text-pink-800' },
      'ANNUAL_LEAVE': { label: 'Annual Leave', color: 'bg-indigo-100 text-indigo-800' },
      'UNPAID_LEAVE': { label: 'Unpaid Leave', color: 'bg-orange-100 text-orange-800' },
      'OTHER': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      filterable: false,
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
      key: 'isTaxable',
      label: 'Taxable',
      sortable: true,
      render: (value) => getTaxableBadge(value)
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

  const handleBulkAction = (selectedRows: AllowanceType[], action: string) => {
    // Implement bulk actions
    console.log('Bulk action:', action, selectedRows)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Allowance Types</h1>
            <p className="text-gray-600 font-normal">Manage housing, transport, and medical allowances</p>
          </div>
          {canCreateAllowanceType && (
            <Button 
              onClick={handleCreate}
              className="rounded-full gradient-primary text-white font-normal"
            >
              <Building className="w-4 h-4 mr-2" />
              Create Allowance Type
            </Button>
          )}
        </div>

        <RichDataTable
          data={allowanceTypes}
          columns={columns}
          title=""
          searchPlaceholder="Search allowance types..."
          filterOptions={[
            { label: 'All Types', value: 'all' },
            { label: 'Housing', value: 'HOUSING' },
            { label: 'Transport', value: 'TRANSPORT' },
            { label: 'Medical', value: 'MEDICAL' },
            { label: 'Short-time', value: 'SHORT_TIME' },
            { label: 'Sick Leave', value: 'SICK_LEAVE' },
            { label: 'Annual Leave', value: 'ANNUAL_LEAVE' },
            { label: 'Unpaid Leave', value: 'UNPAID_LEAVE' },
            { label: 'Other', value: 'OTHER' }
          ]}
          onEdit={canUpdateAllowanceType ? handleEdit : undefined}
          onView={handleView}
          onDelete={canDeleteAllowanceType ? handleDeleteClick : undefined}
          onBulkAction={handleBulkAction}
          bulkActions={bulkActions}
          loading={loading.allowanceTypes}
          exportable={true}
        />
      </div>

      <AllowanceTypesForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingType(null)
        }}
        onSubmit={handleSubmit}
        editingType={editingType}
        loading={loading.allowanceTypes}
      />

      <AllowanceTypeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        allowanceType={viewingType}
        onEdit={handleEdit}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Allowance Type"
        description={`Are you sure you want to delete "${deleteType?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />
    </>
  )
}