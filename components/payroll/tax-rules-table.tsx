"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { RichDataTable, Column } from "./rich-data-table"
import { TaxRulesForm } from "./tax-rules-form"
import { TaxRuleDrawer } from "./tax-rule-drawer"
import { ConfirmationDialog } from "./confirmation-dialog"
import { TaxRule } from "@/lib/api/payroll-api"
import { 
  setTaxRules, 
  addTaxRule, 
  updateTaxRule, 
  removeTaxRule,
  setTaxRulesLoading,
  setTaxRulesError
} from "@/lib/store/slices/payrollSlice"
import { taxRulesApi } from "@/lib/api/payroll-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiDollar, CiPercent, CiCalendar, CiUser } from "react-icons/ci"
import { Minus, Shield } from "lucide-react"
import { toast } from "sonner"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

export function TaxRulesTable() {
  const dispatch = useAppDispatch()
  const { taxRules, loading } = useAppSelector(state => state.payroll)
  const { hasSpecificAction } = useRolePermissions()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null)
  const [viewingRule, setViewingRule] = useState<TaxRule | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [deleteRule, setDeleteRule] = useState<TaxRule | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permission checks
  const canCreateTaxRule = hasSpecificAction('payroll', PAYROLL_ACTIONS.CREATE_TAX_RULE)
  const canUpdateTaxRule = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_TAX_RULE)
  const canDeleteTaxRule = hasSpecificAction('payroll', PAYROLL_ACTIONS.DELETE_TAX_RULE)

  // Load tax rules on component mount
  useEffect(() => {
    loadTaxRules()
  }, [])

  const loadTaxRules = async () => {
    try {
      dispatch(setTaxRulesLoading(true))
      const response = await taxRulesApi.getAll()
      if (response.success && response.data) {
        dispatch(setTaxRules(response.data))
      } else {
        dispatch(setTaxRulesError('Failed to load tax rules'))
        toast.error("Failed to load tax rules")
      }
    } catch (error) {
      dispatch(setTaxRulesError('Failed to load tax rules'))
      toast.error("Failed to load tax rules")
    } finally {
      dispatch(setTaxRulesLoading(false))
    }
  }

  const handleCreate = () => {
    setEditingRule(null)
    setIsFormOpen(true)
  }

  const handleEdit = (rule: TaxRule) => {
    setEditingRule(rule)
    setIsFormOpen(true)
  }

  const handleView = (rule: TaxRule) => {
    setViewingRule(rule)
    setIsDrawerOpen(true)
  }

  const handleDeleteClick = (rule: TaxRule) => {
    setDeleteRule(rule)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteRule) return

    try {
      setIsDeleting(true)
      const response = await taxRulesApi.delete(deleteRule.id)
      
      if (response.success) {
        dispatch(removeTaxRule(deleteRule.id))
        toast.success("Tax rule deleted successfully")
        setIsDeleteDialogOpen(false)
        setDeleteRule(null)
      } else {
        throw new Error(response.message || 'Failed to delete tax rule')
      }
    } catch (error) {
      console.error('Error deleting tax rule:', error)
      dispatch(setTaxRulesError(error instanceof Error ? error.message : 'Failed to delete tax rule'))
      toast.error("Failed to delete tax rule")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeleteRule(null)
  }

  const handleSubmit = async (data: any) => {
    try {
      dispatch(setTaxRulesLoading(true))
      
      if (editingRule) {
        // Update existing rule
        const response = await taxRulesApi.update(editingRule.id, data)
        if (response.success && response.data) {
          dispatch(updateTaxRule(response.data))
          toast.success("Tax rule updated successfully")
        } else {
          toast.error("Failed to update tax rule")
        }
      } else {
        // Create new rule
        const response = await taxRulesApi.create(data)
        if (response.success && response.data) {
          dispatch(addTaxRule(response.data))
          toast.success("Tax rule created successfully")
        } else {
          toast.error("Failed to create tax rule")
        }
      }
      
      setIsFormOpen(false)
      setEditingRule(null)
    } catch (error) {
      toast.error("Failed to save tax rule")
    } finally {
      dispatch(setTaxRulesLoading(false))
    }
  }

  const getTaxTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYE':
        return <CiDollar className="w-4 h-4 text-blue-600" />
      case 'NSSA':
        return <CiPercent className="w-4 h-4 text-green-600" />
      case 'AIDS_LEVY':
        return <Minus className="w-4 h-4 text-red-600" />
      case 'NEC':
        return <CiPercent className="w-4 h-4 text-purple-600" />
      case 'STANDARDS_LEVY':
        return <Shield className="w-4 h-4 text-orange-600" />
      case 'ZIMDEV':
        return <CiDollar className="w-4 h-4 text-yellow-600" />
      default:
        return <CiDollar className="w-4 h-4" />
    }
  }

  const getTaxTypeBadge = (type: string) => {
    switch (type) {
      case 'PAYE':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">PAYE</Badge>
      case 'NSSA':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">NSSA</Badge>
      case 'AIDS_LEVY':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">AIDS Levy</Badge>
      case 'NEC':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">NEC</Badge>
      case 'STANDARDS_LEVY':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Standards Levy</Badge>
      case 'ZIMDEV':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ZimDev</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const columns: Column<TaxRule>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {getTaxTypeIcon(row.type)}
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      filterable: true,
      render: (value) => getTaxTypeBadge(value as string)
    },
    {
      key: 'rate',
      label: 'Rate',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}%</span>
      )
    },
    {
      key: 'threshold',
      label: 'Threshold',
      sortable: true,
      render: (value) => (
        <span>{value ? `$${parseFloat(value).toLocaleString()}` : '-'}</span>
      )
    },
    {
      key: 'ceiling',
      label: 'Ceiling',
      sortable: true,
      render: (value) => (
        <span>{value ? `$${parseFloat(value).toLocaleString()}` : '-'}</span>
      )
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'currency',
      label: 'Currency',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value?.code}</span>
      )
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
    { label: 'Activate', value: 'activate', icon: <CiDollar className="w-4 h-4" /> },
    { label: 'Deactivate', value: 'deactivate', icon: <Minus className="w-4 h-4" /> },
    { label: 'Delete', value: 'delete', icon: <Minus className="w-4 h-4" /> }
  ]

  const handleBulkAction = (selectedRows: TaxRule[], action: string) => {
    // Implement bulk actions
    console.log('Bulk action:', action, selectedRows)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Tax Rules</h1>
            <p className="text-gray-600 font-normal">Manage PAYE, NSSA, and AIDS Levy tax rules</p>
          </div>
          {canCreateTaxRule && (
            <Button 
              onClick={handleCreate}
              variant="gradient-create"
              className="rounded-full h-10 px-6 shadow-sm font-normal"
            >
              <CiDollar className="w-4 h-4 mr-2" />
              Create Tax Rule
            </Button>
          )}
        </div>

        <RichDataTable
          data={taxRules}
          columns={columns}
          title=""
          searchPlaceholder="Search tax rules..."
          filterOptions={[
            { label: 'All Types', value: 'all' },
            { label: 'PAYE', value: 'PAYE' },
            { label: 'NSSA', value: 'NSSA' },
            { label: 'AIDS Levy', value: 'AIDS_LEVY' },
            { label: 'NEC', value: 'NEC' },
            { label: 'Standards Levy', value: 'STANDARDS_LEVY' },
            { label: 'ZimDev', value: 'ZIMDEV' }
          ]}
          onEdit={canUpdateTaxRule ? handleEdit : undefined}
          onView={handleView}
          onDelete={canDeleteTaxRule ? handleDeleteClick : undefined}
          onBulkAction={handleBulkAction}
          bulkActions={bulkActions}
          loading={loading.taxRules}
          exportable={true}
        />
      </div>

      <TaxRulesForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingRule(null)
        }}
        onSubmit={handleSubmit}
        editingRule={editingRule}
        loading={loading.taxRules}
      />

      <TaxRuleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        taxRule={viewingRule}
        onEdit={handleEdit}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Tax Rule"
        description={`Are you sure you want to delete "${deleteRule?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />
    </>
  )
}
