"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { RichDataTable, Column } from "./rich-data-table"
import { BankTemplatesForm } from "./bank-templates-form"
import { BankTemplateDrawer } from "./bank-template-drawer"
import { ConfirmationDialog } from "./confirmation-dialog"
import { BankTemplate } from "@/lib/api/payroll-api"
import { 
  setBankTemplates, 
  addBankTemplate, 
  updateBankTemplate, 
  removeBankTemplate,
  setBankTemplatesLoading,
  setBankTemplatesError
} from "@/lib/store/slices/payrollSlice"
import { bankTemplatesApi } from "@/lib/api/payroll-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiDollar, CiCalendar, CiUser } from "react-icons/ci"
import { Building, CheckCircle, XCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

export function BankTemplatesTable() {
  const dispatch = useAppDispatch()
  const { bankTemplates, loading } = useAppSelector(state => state.payroll)
  const { hasSpecificAction } = useRolePermissions()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BankTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<BankTemplate | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [deleteTemplate, setDeleteTemplate] = useState<BankTemplate | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permission checks
  const canCreateBankTemplate = hasSpecificAction(PAYROLL_ACTIONS.CREATE_BANK_TEMPLATE)
  const canUpdateBankTemplate = hasSpecificAction(PAYROLL_ACTIONS.UPDATE_BANK_TEMPLATE)
  const canDeleteBankTemplate = hasSpecificAction(PAYROLL_ACTIONS.DELETE_BANK_TEMPLATE)

  // Load bank templates on component mount
  useEffect(() => {
    loadBankTemplates()
  }, [])

  const loadBankTemplates = async () => {
    try {
      dispatch(setBankTemplatesLoading(true))
      const response = await bankTemplatesApi.getAll()
      if (response.success && response.data) {
        dispatch(setBankTemplates(response.data))
      } else {
        dispatch(setBankTemplatesError('Failed to load bank templates'))
        toast.error("Failed to load bank templates")
      }
    } catch (error) {
      dispatch(setBankTemplatesError('Failed to load bank templates'))
      toast.error("Failed to load bank templates")
    } finally {
      dispatch(setBankTemplatesLoading(false))
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setIsFormOpen(true)
  }

  const handleEdit = (template: BankTemplate) => {
    setEditingTemplate(template)
    setIsFormOpen(true)
  }

  const handleView = (template: BankTemplate) => {
    setViewingTemplate(template)
    setIsDrawerOpen(true)
  }

  const handleDeleteClick = (template: BankTemplate) => {
    setDeleteTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTemplate) return

    try {
      setIsDeleting(true)
      const response = await bankTemplatesApi.delete(deleteTemplate.id)
      
      if (response.success) {
        dispatch(removeBankTemplate(deleteTemplate.id))
        toast.success("Bank template deleted successfully")
        setIsDeleteDialogOpen(false)
        setDeleteTemplate(null)
      } else {
        throw new Error(response.message || 'Failed to delete bank template')
      }
    } catch (error) {
      console.error('Error deleting bank template:', error)
      dispatch(setBankTemplatesError(error instanceof Error ? error.message : 'Failed to delete bank template'))
      toast.error("Failed to delete bank template")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeleteTemplate(null)
  }

  const handleSubmit = async (data: any) => {
    try {
      dispatch(setBankTemplatesLoading(true))
      
      if (editingTemplate) {
        // Update existing template
        const response = await bankTemplatesApi.update(editingTemplate.id, data)
        if (response.success && response.data) {
          dispatch(updateBankTemplate(response.data))
          toast.success("Bank template updated successfully")
        } else {
          toast.error("Failed to update bank template")
        }
      } else {
        // Create new template
        const response = await bankTemplatesApi.create(data)
        if (response.success && response.data) {
          dispatch(addBankTemplate(response.data))
          toast.success("Bank template created successfully")
        } else {
          toast.error("Failed to create bank template")
        }
      }
      
      setIsFormOpen(false)
      setEditingTemplate(null)
    } catch (error) {
      toast.error("Failed to save bank template")
    } finally {
      dispatch(setBankTemplatesLoading(false))
    }
  }

  const getDelimiterBadge = (delimiter: string) => {
    const delimiterMap: { [key: string]: { label: string; color: string } } = {
      ',': { label: 'Comma', color: 'bg-blue-100 text-blue-800' },
      ';': { label: 'Semicolon', color: 'bg-green-100 text-green-800' },
      '|': { label: 'Pipe', color: 'bg-purple-100 text-purple-800' },
      '\t': { label: 'Tab', color: 'bg-orange-100 text-orange-800' }
    }
    
    const config = delimiterMap[delimiter] || { label: delimiter, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const columns: Column<BankTemplate>[] = [
    {
      key: 'name',
      label: 'Template Name',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'bankName',
      label: 'Bank Name',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-600" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'delimiter',
      label: 'Delimiter',
      sortable: true,
      render: (value) => getDelimiterBadge(value)
    },
    {
      key: 'hasHeader',
      label: 'Has Header',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    },
    {
      key: 'columnOrder',
      label: 'Columns',
      sortable: false,
      render: (value) => {
        const getColumnCount = () => {
          try {
            if (typeof value === 'string') {
              return JSON.parse(value).length
            }
            return Array.isArray(value) ? value.length : 0
          } catch (error) {
            return 0
          }
        }
        return (
          <span className="text-sm text-gray-600">
            {getColumnCount()} columns
          </span>
        )
      }
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

  const handleBulkAction = (selectedRows: BankTemplate[], action: string) => {
    // Implement bulk actions
    console.log('Bulk action:', action, selectedRows)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Bank Templates</h1>
            <p className="text-gray-600 font-normal">Manage bank file templates for different banks</p>
          </div>
          {canCreateBankTemplate && (
            <Button 
              onClick={handleCreate}
              className="rounded-full gradient-primary text-white font-normal"
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Bank Template
            </Button>
          )}
        </div>

        <RichDataTable
          data={bankTemplates}
          columns={columns}
          title=""
          searchPlaceholder="Search bank templates..."
          filterOptions={[
            { label: 'All Templates', value: 'all' },
            { label: 'With Header', value: 'true' },
            { label: 'No Header', value: 'false' }
          ]}
          onEdit={canUpdateBankTemplate ? handleEdit : undefined}
          onView={handleView}
          onDelete={canDeleteBankTemplate ? handleDeleteClick : undefined}
          onBulkAction={handleBulkAction}
          bulkActions={bulkActions}
          loading={loading.bankTemplates}
          exportable={true}
        />
      </div>

      <BankTemplatesForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingTemplate(null)
        }}
        onSubmit={handleSubmit}
        editingTemplate={editingTemplate}
        loading={loading.bankTemplates}
      />

      <BankTemplateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        bankTemplate={viewingTemplate}
        onEdit={handleEdit}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Bank Template"
        description={`Are you sure you want to delete "${deleteTemplate?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />
    </>
  )
}