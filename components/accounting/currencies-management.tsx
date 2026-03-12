"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Star
} from "lucide-react"
import { toast } from "sonner"
import { CreateCurrencyModal } from "./create-currency-modal"
import { ViewCurrencyModal } from "./view-currency-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { 
  setCurrencies, 
  setCurrenciesLoading, 
  setCurrenciesError,
  updateCurrency,
  removeCurrency,
  setSelectedCurrency
} from "@/lib/store/slices/accountingSlice"
import { accountingApi, AccountingCurrency, CreateCurrencyRequest } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

// Export the type for use in other components
export type { AccountingCurrency as Currency }

export function CurrenciesManagement() {
  const dispatch = useAppDispatch()
  const { currencies, currenciesLoading } = useAppSelector(state => state.accounting)
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateCurrency = permissions.canCreateCurrency
  const canEditCurrency = permissions.canUpdateCurrency
  const canDeleteCurrency = permissions.canDeleteCurrency
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmDrawerOpen, setIsConfirmDrawerOpen] = useState(false)
  const [selectedCurrencyForEdit, setSelectedCurrencyForEdit] = useState<AccountingCurrency | null>(null)
  const [selectedCurrencyForView, setSelectedCurrencyForView] = useState<AccountingCurrency | null>(null)
  const [selectedCurrencyForDelete, setSelectedCurrencyForDelete] = useState<AccountingCurrency | null>(null)

  useEffect(() => {
    loadCurrencies()
  }, [])

  const loadCurrencies = async () => {
    try {
      dispatch(setCurrenciesLoading(true))
      const response = await accountingApi.getCurrencies()
      if (response.success && response.data) {
        dispatch(setCurrencies(response.data))
      } else {
        dispatch(setCurrenciesError('Failed to load currencies'))
        toast.error("Failed to load currencies")
      }
    } catch (error: any) {
      dispatch(setCurrenciesError(error.message))
      toast.error("Error loading currencies", { description: error.message })
    } finally {
      dispatch(setCurrenciesLoading(false))
    }
  }

  const handleCreate = () => {
    setSelectedCurrencyForEdit(null)
    setIsCreateModalOpen(true)
  }

  const handleView = (currency: AccountingCurrency) => {
    setSelectedCurrencyForView(currency)
    setIsViewModalOpen(true)
  }

  const handleEdit = (currency: AccountingCurrency) => {
    setSelectedCurrencyForEdit(currency)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (currency: AccountingCurrency) => {
    setSelectedCurrencyForDelete(currency)
    setIsConfirmDrawerOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCurrencyForDelete) return

    try {
      const response = await accountingApi.deleteCurrency(selectedCurrencyForDelete.id)
      if (response.success) {
        dispatch(removeCurrency(selectedCurrencyForDelete.id))
        toast.success("Currency deleted successfully")
      } else {
        throw new Error(response.error || 'Failed to delete currency')
      }
    } catch (error: any) {
      toast.error("Failed to delete currency", { description: error.message })
    }
  }

  const handleToggleStatus = async (currency: AccountingCurrency) => {
    try {
      const response = await accountingApi.updateCurrency(currency.id, {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        isActive: !currency.isActive,
        isDefault: currency.isDefault
      })

      if (response.success && response.data) {
        dispatch(updateCurrency(response.data))
        toast.success(`Currency ${currency.isActive ? 'deactivated' : 'activated'} successfully`)
      } else {
        throw new Error(response.error || 'Failed to update currency')
      }
    } catch (error: any) {
      toast.error("Failed to update currency status", { description: error.message })
    }
  }

  const handleSetDefault = async (currency: AccountingCurrency) => {
    try {
      const response = await accountingApi.updateCurrency(currency.id, {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        isActive: currency.isActive,
        isDefault: true
      })

      if (response.success && response.data) {
        // Update all currencies to remove default from others
        loadCurrencies()
        toast.success("Default currency updated successfully")
      } else {
        throw new Error(response.error || 'Failed to set default currency')
      }
    } catch (error: any) {
      toast.error("Failed to set default currency", { description: error.message })
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const columns: Column<AccountingCurrency>[] = [
    {
      key: 'code',
      label: 'Currency Code',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
          {row.isDefault && (
            <div title="Default Currency">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Currency Name',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'symbol',
      label: 'Symbol',
      sortable: true,
      render: (value) => (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
          <span className="font-bold text-gray-700">{value}</span>
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
      key: 'isDefault',
      label: 'Default',
      sortable: true,
      filterable: true,
      render: (value) => (
        value ? (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Star className="w-3 h-3 mr-1" />
            Default
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
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

  const handleBulkAction = async (selectedCurrencies: AccountingCurrency[], action: string) => {
    try {
      const promises = selectedCurrencies.map(currency => {
        const newStatus = action === 'activate'
        return accountingApi.updateCurrency(currency.id, {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          isActive: newStatus,
          isDefault: currency.isDefault
        })
      })

      await Promise.all(promises)
      toast.success(`${selectedCurrencies.length} currencies ${action}d successfully`)
      loadCurrencies()
    } catch (error: any) {
      toast.error(`Failed to ${action} currencies`, { description: error.message })
    }
  }

  const handleExport = (data: AccountingCurrency[]) => {
    const csvContent = [
      ['Code', 'Name', 'Symbol', 'Status', 'Default', 'Created'].join(','),
      ...data.map(currency => [
        currency.code,
        currency.name,
        currency.symbol,
        currency.isActive ? 'Active' : 'Inactive',
        currency.isDefault ? 'Yes' : 'No',
        new Date(currency.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'currencies.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} currencies`)
  }

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <ProcurementDataTable
        data={currencies}
        columns={columns}
        title="Currencies"
        searchPlaceholder="Search currencies..."
        filterOptions={filterOptions}
        onView={handleView}
        onEdit={canEditCurrency ? handleEdit : undefined}
        onDelete={canDeleteCurrency ? handleDelete : undefined}
        onCreate={canCreateCurrency ? handleCreate : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={currenciesLoading}
        onExport={handleExport}
        emptyMessage="No currencies found. Create your first currency to get started."
      />

      {/* View Modal */}
      <ViewCurrencyModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedCurrencyForView(null)
        }}
        currency={selectedCurrencyForView}
      />

      {/* Create/Edit Modal */}
      <CreateCurrencyModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedCurrency(null)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setSelectedCurrency(null)
          loadCurrencies()
        }}
        currency={selectedCurrencyForEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDrawerOpen}
        onClose={() => {
          setIsConfirmDrawerOpen(false)
          setSelectedCurrencyForDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Currency"
        description={
          selectedCurrencyForDelete
            ? `Are you sure you want to delete ${selectedCurrencyForDelete.name} (${selectedCurrencyForDelete.code})? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}