"use client"

import { useEffect, useState } from "react"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { 
  Tag, 
  CheckCircle, 
  Clock, 
  FileText,
  Folder,
  FolderOpen
} from "lucide-react"
import { toast } from "sonner"
import { CreateExpenseCategoryModal } from "./create-expense-category-modal"
import { ViewExpenseCategoryModal } from "./view-expense-category-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { accountingApi, ExpenseCategory, CreateExpenseCategoryRequest } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

// Export the type for use in other components
export type { ExpenseCategory }

export function ExpenseCategoriesManagement() {
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateCategory = permissions.canCreateExpenseCategory
  const canEditCategory = permissions.canUpdateExpenseCategory
  const canDeleteCategory = permissions.canDeleteExpenseCategory
  
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [expenseCategoriesLoading, setExpenseCategoriesLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<ExpenseCategory | null>(null)
  const [selectedCategoryForView, setSelectedCategoryForView] = useState<ExpenseCategory | null>(null)
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState<ExpenseCategory | null>(null)

  useEffect(() => {
    loadExpenseCategories()
  }, [])

  const loadExpenseCategories = async () => {
    try {
      setExpenseCategoriesLoading(true)
      const response = await accountingApi.getExpenseCategories()
      if (response.success && response.data) {
        setExpenseCategories(response.data)
      } else {
        toast.error("Failed to load expense categories")
      }
    } catch (error: any) {
      toast.error("Error loading expense categories", { description: error.message })
    } finally {
      setExpenseCategoriesLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedCategoryForEdit(null)
    setIsCreateModalOpen(true)
  }

  const handleView = (category: ExpenseCategory) => {
    setSelectedCategoryForView(category)
    setIsViewModalOpen(true)
  }

  const handleEdit = (category: ExpenseCategory) => {
    setSelectedCategoryForEdit(category)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (category: ExpenseCategory) => {
    setSelectedCategoryForDelete(category)
    setIsConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCategoryForDelete) return

    try {
      const response = await accountingApi.deleteExpenseCategory(selectedCategoryForDelete.id)
      if (response.success) {
        setExpenseCategories(prev => prev.filter(category => category.id !== selectedCategoryForDelete.id))
        toast.success("Expense category deleted successfully")
      } else {
        throw new Error(response.error || 'Failed to delete expense category')
      }
    } catch (error: any) {
      toast.error("Failed to delete expense category", { description: error.message })
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category: ExpenseCategory) => {
    if (category.parentId) {
      return <Folder className="w-4 h-4 text-yellow-500" />
    }
    return <FolderOpen className="w-4 h-4 text-yellow-600" />
  }

  const columns: Column<ExpenseCategory>[] = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
            {row.parentId && (
              <p className="text-xs text-gray-500">Subcategory</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        value ? (
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700 line-clamp-2" title={value}>
              {value}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">No description</span>
        )
      )
    },
    {
      key: 'parentId',
      label: 'Type',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {getCategoryIcon(row)}
          <Badge variant="outline" className={value ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}>
            {value ? "Subcategory" : "Parent"}
          </Badge>
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getStatusColor(value)}>
          <div className="flex items-center gap-1">
            {getStatusIcon(value)}
            {value ? 'Active' : 'Inactive'}
          </div>
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    }
  ]

  const filterOptions = [
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
    { label: 'Parent Categories', value: 'parent' },
    { label: 'Subcategories', value: 'subcategory' }
  ]

  const bulkActions = [
    { 
      label: 'Activate', 
      value: 'activate', 
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )
    },
    { 
      label: 'Deactivate', 
      value: 'deactivate', 
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
          <Clock className="w-3 h-3 text-white" />
        </div>
      )
    }
  ]

  const handleBulkAction = async (selectedCategories: ExpenseCategory[], action: string) => {
    try {
      const promises = selectedCategories.map(category => {
        const newStatus = action === 'activate'
        return accountingApi.updateExpenseCategory(category.id, {
          name: category.name,
          description: category.description || undefined,
          parentId: category.parentId || undefined,
          isActive: newStatus
        })
      })

      await Promise.all(promises)
      toast.success(`${selectedCategories.length} categories ${action}d successfully`)
      loadExpenseCategories()
    } catch (error: any) {
      toast.error(`Failed to ${action} categories`, { description: error.message })
    }
  }

  const handleExport = (data: ExpenseCategory[]) => {
    const csvContent = [
      ['Name', 'Description', 'Type', 'Status', 'Created'].join(','),
      ...data.map(category => [
        category.name,
        category.description || '',
        category.parentId ? 'Subcategory' : 'Parent',
        category.isActive ? 'Active' : 'Inactive',
        new Date(category.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expense-categories.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} expense categories`)
  }

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <ProcurementDataTable
        data={expenseCategories}
        columns={columns}
        title="Expense Categories"
        searchPlaceholder="Search categories..."
        filterOptions={filterOptions}
        onView={handleView}
        onEdit={canEditCategory ? handleEdit : undefined}
        onDelete={canDeleteCategory ? handleDelete : undefined}
        onCreate={canCreateCategory ? handleCreate : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={expenseCategoriesLoading}
        onExport={handleExport}
        emptyMessage="No expense categories found. Create your first category to get started."
      />

      {/* View Modal */}
      <ViewExpenseCategoryModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedCategoryForView(null)
        }}
        category={selectedCategoryForView}
      />

      {/* Create/Edit Modal */}
      <CreateExpenseCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedCategoryForEdit(null)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setSelectedCategoryForEdit(null)
          loadExpenseCategories()
        }}
        category={selectedCategoryForEdit}
        categories={expenseCategories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false)
          setSelectedCategoryForDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Expense Category"
        description={
          selectedCategoryForDelete
            ? `Are you sure you want to delete ${selectedCategoryForDelete.name}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}