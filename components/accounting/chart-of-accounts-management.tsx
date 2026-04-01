"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calculator,
  CheckCircle,
  Clock,
  FileText,
  Hash,
  Upload
} from "lucide-react"
import { toast } from "sonner"
import { CreateAccountModal } from "./create-account-modal"
import { ViewAccountModal } from "./view-account-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
// TODO: Add Chart of Accounts to Redux state
// import { 
//   setChartOfAccounts, 
//   setChartOfAccountsLoading, 
//   setChartOfAccountsError,
//   updateChartOfAccount,
//   removeChartOfAccount
// } from "@/lib/store/slices/accountingSlice"
import { accountingApi, ChartOfAccount, CreateChartOfAccountRequest } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"
import { BulkImportCoaModal } from "./bulk-import-coa-modal"

// Export the type for use in other components
export type { ChartOfAccount as Account }

export function ChartOfAccountsManagement() {
  // const dispatch = useAppDispatch()
  // const { chartOfAccounts, chartOfAccountsLoading } = useAppSelector(state => state.accounting)
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateAccount = permissions.canCreateCOA
  const canEditAccount = permissions.canUpdateCOA
  const canDeleteAccount = permissions.canDeleteCOA
  
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
  const [chartOfAccountsLoading, setChartOfAccountsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<ChartOfAccount | null>(null)
  const [selectedAccountForView, setSelectedAccountForView] = useState<ChartOfAccount | null>(null)
  const [selectedAccountForDelete, setSelectedAccountForDelete] = useState<ChartOfAccount | null>(null)

  useEffect(() => {
    loadChartOfAccounts()
  }, [])

  const loadChartOfAccounts = async () => {
    try {
      setChartOfAccountsLoading(true)
      const response = await accountingApi.getChartOfAccounts()
      if (response.success && response.data) {
        setChartOfAccounts(response.data)
      } else {
        toast.error("Failed to load chart of accounts")
      }
    } catch (error: any) {
      toast.error("Error loading chart of accounts", { description: error.message })
    } finally {
      setChartOfAccountsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedAccountForEdit(null)
    setIsCreateModalOpen(true)
  }

  const handleView = (account: ChartOfAccount) => {
    setSelectedAccountForView(account)
    setIsViewModalOpen(true)
  }

  const handleEdit = (account: ChartOfAccount) => {
    setSelectedAccountForEdit(account)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (account: ChartOfAccount) => {
    setSelectedAccountForDelete(account)
    setIsConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedAccountForDelete) return

    try {
      const response = await accountingApi.deleteChartOfAccount(selectedAccountForDelete.id)
      if (response.success) {
        setChartOfAccounts(prev => prev.filter(account => account.id !== selectedAccountForDelete.id))
        toast.success("Account deleted successfully")
      } else {
        throw new Error(response.error || 'Failed to delete account')
      }
    } catch (error: any) {
      toast.error("Failed to delete account", { description: error.message })
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getAccountTypeColor = (accountType: string) => {
    const colorMap: Record<string, string> = {
      'Current Asset': 'bg-blue-100 text-blue-800',
      'Fixed Asset': 'bg-indigo-100 text-indigo-800',
      'Long-Term Asset': 'bg-purple-100 text-purple-800',
      'Current Liability': 'bg-red-100 text-red-800',
      'Long-Term Liability': 'bg-pink-100 text-pink-800',
      'Equity': 'bg-green-100 text-green-800',
      'Revenue': 'bg-emerald-100 text-emerald-800',
      'Expense': 'bg-yellow-100 text-yellow-800',
      'Income': 'bg-teal-100 text-teal-800',
      'Contra-Asset': 'bg-gray-100 text-gray-800'
    }
    return colorMap[accountType] || 'bg-gray-100 text-gray-800'
  }

  const columns: Column<ChartOfAccount>[] = [
    {
      key: 'accountNo',
      label: 'Account No',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-purple-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'accountName',
      label: 'Account Name',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'accountType',
      label: 'Account Type',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getAccountTypeColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'financialStatement',
      label: 'Financial Statement',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{value}</span>
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
    { label: 'Inactive', value: 'false' }
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

  const handleBulkAction = async (selectedAccounts: ChartOfAccount[], action: string) => {
    try {
      const promises = selectedAccounts.map(account => {
        const newStatus = action === 'activate'
        return accountingApi.updateChartOfAccount(account.id, {
          accountNo: account.accountNo,
          accountName: account.accountName,
          accountType: account.accountType,
          financialStatement: account.financialStatement,
          notes: account.notes || undefined,
          parentId: account.parentId || undefined,
          isActive: newStatus
        })
      })

      await Promise.all(promises)
      toast.success(`${selectedAccounts.length} accounts ${action}d successfully`)
      loadChartOfAccounts()
    } catch (error: any) {
      toast.error(`Failed to ${action} accounts`, { description: error.message })
    }
  }

  const handleExport = (data: ChartOfAccount[]) => {
    const csvContent = [
      ['Account No', 'Account Name', 'Account Type', 'Financial Statement', 'Status', 'Notes', 'Created'].join(','),
      ...data.map(account => [
        account.accountNo,
        account.accountName,
        account.accountType,
        account.financialStatement,
        account.isActive ? 'Active' : 'Inactive',
        account.notes || '',
        new Date(account.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chart-of-accounts.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} accounts`)
  }

  return (
    <div className="space-y-6">
      {/* Bulk Import Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setIsBulkImportOpen(true)}
          className="rounded-full"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </div>

      {/* Data Table */}
      <ProcurementDataTable
        data={chartOfAccounts}
        columns={columns}
        title="Chart of Accounts"
        searchPlaceholder="Search accounts..."
        filterOptions={filterOptions}
        onView={handleView}
        onEdit={canEditAccount ? handleEdit : undefined}
        onDelete={canDeleteAccount ? handleDelete : undefined}
        onCreate={canCreateAccount ? handleCreate : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={chartOfAccountsLoading}
        onExport={handleExport}
        emptyMessage="No accounts found. Create your first account to get started."
      />

      {/* View Modal */}
      <ViewAccountModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedAccountForView(null)
        }}
        account={selectedAccountForView}
      />

      {/* Create/Edit Modal */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedAccountForEdit(null)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setSelectedAccountForEdit(null)
          loadChartOfAccounts()
        }}
        account={selectedAccountForEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false)
          setSelectedAccountForDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Account"
        description={
          selectedAccountForDelete
            ? `Are you sure you want to delete ${selectedAccountForDelete.accountName} (${selectedAccountForDelete.accountNo})? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Bulk Import Modal */}
      <BulkImportCoaModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={loadChartOfAccounts}
      />
    </div>
  )
}