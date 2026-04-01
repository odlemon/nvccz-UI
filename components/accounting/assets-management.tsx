"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import type { Asset } from "@/lib/api/accounting-api"
import { fetchAssets, fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { AssetViewDrawer } from "./asset-view-drawer"
import { CreateAssetModal } from "./create-asset-modal"
import { accountingApi } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"
import { useRolePermissions } from "@/lib/permissions"

export function AssetsManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { canPerformAction } = useRolePermissions()

  // Permission checks
  // const canCreateAsset = canPerformAction('accounting', 'create')
  // const canEditAsset = canPerformAction('accounting', 'update')
  // const canDeleteAsset = canPerformAction('accounting', 'delete')

  const { permissions } = useAccountingPermissions()

  // Permission checks
  const canCreateAsset = permissions.canCreateAsset
  const canEditAsset = permissions.canUpdateAsset
  const canDeleteAsset = permissions.canDeleteAsset
  const canDisposeAsset = permissions.canDisposeAsset
  const canRevalueAsset = permissions.canRevalueAsset
  const canCalcDepreciation = permissions.canCalcDepreciation

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [assetsView, setAssetsView] = useState<"list" | "register">("list")
  const [registerData, setRegisterData] = useState<any[]>([])
  const [registerLoading, setRegisterLoading] = useState(false)

  // Pagination state
  const {
    assets,
    assetsLoading,
    assetsError,
    assetsTotal,
    assetsPage,
    assetsLimit,
    assetsTotalPages
  } = useSelector((state: RootState) => state.accounting)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  })

  useEffect(() => {
    dispatch(fetchAssets({
      page: pagination.page,
      limit: pagination.limit
    }))
  }, [dispatch, pagination])

  useEffect(() => {
    dispatch(fetchChartOfAccounts({ isActive: true }))
  }, [dispatch])

  useEffect(() => {
    if (assetsView === "register") {
      loadRegister()
    }
  }, [assetsView])

  const loadRegister = async () => {
    setRegisterLoading(true)
    try {
      const response = await accountingApi.getAssetRegister()
      if (response.success && response.data) {
        setRegisterData(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error: any) {
      toast.error("Failed to load asset register", { description: error.message })
    } finally {
      setRegisterLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit: number) => {
    setPagination({ page: 1, limit })
  }

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsViewDrawerOpen(true)
  }

  const handleEditAsset = (asset: Asset) => {
    // Edit functionality can be implemented later
    console.log('Edit asset:', asset.id)
  }

  const handleDeleteAsset = async (asset: Asset) => {
    // Use confirmation dialog instead of window.confirm
    // This can be implemented with ConfirmationDialog component
    console.log('Delete asset with confirmation dialog:', asset.id)
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return 'bg-green-100 text-green-800'
      case 'DISPOSED':
        return 'bg-red-100 text-red-800'
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return <CheckCircle className="w-3 h-3" />
      case 'DISPOSED':
        return <AlertTriangle className="w-3 h-3" />
      case 'UNDER_MAINTENANCE':
        return <Clock className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const formatRegisterAmount = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) : (val ?? 0)
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const registerColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Asset Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{row.name || row.assetName || "-"}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value, row) => <span>{row.category || row.assetCategory || "-"}</span>,
    },
    {
      key: 'purchaseDate',
      label: 'Purchase Date',
      sortable: true,
      render: (value) => value ? format(new Date(value as string), "dd/MM/yyyy") : "-",
    },
    {
      key: 'cost',
      label: 'Cost',
      sortable: true,
      render: (value, row) => (
        <span className="tabular-nums">{formatRegisterAmount(row.cost || row.purchaseCost)}</span>
      ),
    },
    {
      key: 'accumulatedDepreciation',
      label: 'Accum. Depreciation',
      sortable: true,
      render: (value) => <span className="tabular-nums">{formatRegisterAmount(value)}</span>,
    },
    {
      key: 'bookValue',
      label: 'Book Value',
      sortable: true,
      render: (value, row) => (
        <span className="tabular-nums font-medium">{formatRegisterAmount(row.bookValue || row.netBookValue)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge className={value === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
          {(value as string) || "N/A"}
        </Badge>
      ),
    },
  ]

  const columns: Column<Asset>[] = [
    {
      key: 'assetName',
      label: 'Asset Details',
      sortable: true,
      render: (value, row) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewAsset(row)
          }}
          title="Click to view asset details"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
              {getInitials(value)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
            <p className="text-xs text-gray-500 truncate font-mono" title={row.assetCode}>
              {row.assetCode}
            </p>
            <p className="text-xs text-gray-500 truncate" title={row.description}>
              {row.description}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location & Purchase',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewAsset(row)
          }}
          title="Click to view asset details"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span>{value || 'Not specified'}</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(row.purchaseDate), 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-bold">{formatCurrency(row.cost)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'depreciationMethod',
      label: 'Depreciation',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewAsset(row)
          }}
          title="Click to view asset details"
        >
          <div className="space-y-1">
            <div className="text-sm">{value.replace('_', ' ')}</div>
            <div className="text-xs text-gray-500">
              {row.usefulLifeYears} year{row.usefulLifeYears !== 1 ? 's' : ''} life
            </div>
            <div className="text-xs text-blue-600">
              {row.depreciationRecords.length} record{row.depreciationRecords.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'currentBookValue',
      label: 'Current Value',
      sortable: true,
      render: (value, row) => (
        <div
          className="text-right cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewAsset(row)
          }}
          title="Click to view asset details"
        >
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(value)}
          </div>
          <div className="text-xs text-gray-500">Book Value</div>
          <div className="text-xs text-gray-500">
            Salvage: <span className="font-bold">{formatCurrency(row.salvageValue)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors inline-block"
          onClick={(e) => {
            e.stopPropagation()
            handleViewAsset(row)
          }}
          title="Click to view asset details"
        >
          <Badge className={getStatusColor(value)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(value)}
              {value.replace('_', ' ')}
            </div>
          </Badge>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewAsset(row)
          }}
          title="Click to view asset details"
        >
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
          <div className="text-xs text-gray-500">
            by {row.createdBy.firstName} {row.createdBy.lastName}
          </div>
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'In Use', value: 'IN_USE' },
    { label: 'Disposed', value: 'DISPOSED' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' }
  ]

  const bulkActions = [
    {
      label: 'Mark as In Use',
      value: 'mark-in-use',
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )
    },
    {
      label: 'Mark for Maintenance',
      value: 'mark-maintenance',
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
          <Clock className="w-3 h-3 text-white" />
        </div>
      )
    }
  ]

  const handleBulkAction = async (selectedAssets: Asset[], action: string) => {
    try {
      // TODO: Implement bulk actions for assets
      console.log(`Bulk ${action} for`, selectedAssets.length, 'assets')
      toast.success(`${action} applied to ${selectedAssets.length} assets`)
    } catch (error: any) {
      console.error(`Failed to ${action} assets`, error)
      toast.error(`Failed to ${action} assets`)
    }
  }

  const handleExport = (data: Asset[]) => {
    const csvContent = [
      ['Asset Name', 'Asset Code', 'Location', 'Cost', 'Current Value', 'Status', 'Purchase Date', 'Created'].join(','),
      ...data.map(asset => [
        asset.assetName,
        asset.assetCode,
        asset.location || '',
        asset.cost,
        asset.currentBookValue,
        asset.status,
        new Date(asset.purchaseDate).toLocaleDateString(),
        new Date(asset.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assets.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${data.length} assets`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Asset Management</h1>
          <p className="text-muted-foreground">Manage fixed assets and depreciation</p>
        </div>
        {canCreateAsset && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            New Asset
          </Button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={assetsView === "list" ? "default" : "outline"}
          onClick={() => setAssetsView("list")}
          className="rounded-full"
          size="sm"
        >
          Asset List
        </Button>
        <Button
          variant={assetsView === "register" ? "default" : "outline"}
          onClick={() => setAssetsView("register")}
          className="rounded-full"
          size="sm"
        >
          Asset Register
        </Button>
      </div>

      {assetsView === "register" ? (
        <ProcurementDataTable
          data={registerData}
          columns={registerColumns}
          title="Asset Register"
          searchPlaceholder="Search asset register..."
          loading={registerLoading}
          emptyMessage="No asset register data available."
        />
      ) : (
      /* Assets Data Table */
      <ProcurementDataTable
        data={assets}
        columns={columns}
        title="Assets"
        searchPlaceholder="Search assets..."
        filterOptions={filterOptions}
        onView={handleViewAsset}
        onEdit={canEditAsset ? handleEditAsset : undefined}
        onDelete={canDeleteAsset ? handleDeleteAsset : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={assetsLoading}
        onExport={handleExport}
        emptyMessage="No assets found. Create your first asset to get started."
        usePagination="backend"
        paginationData={{
          total: assetsTotal,
          page: assetsPage,
          limit: assetsLimit,
          totalPages: assetsTotalPages
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
      )}

      {/* Asset View Drawer */}
      <AssetViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          setSelectedAsset(null)
        }}
        asset={selectedAsset}
        onAssetUpdated={() => {
          dispatch(fetchAssets())
          if (selectedAsset) {
            // Refresh the selected asset data
            setSelectedAsset(null)
            setTimeout(() => {
              const updatedAsset = assets.find(a => a.id === selectedAsset.id)
              if (updatedAsset) setSelectedAsset(updatedAsset)
            }, 100)
          }
        }}
      />

      {/* Create Asset Modal */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          dispatch(fetchAssets())
        }}
      />
    </div>
  )
}
