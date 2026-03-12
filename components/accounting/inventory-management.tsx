"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  Search,
  Filter,
  ChevronDown,
  CalendarIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import type { InventoryItem, InventoryValuationResponse, ReorderAlertItem } from "@/lib/api/accounting-api"
import { fetchInventoryItems, fetchInventoryItem, setSelectedInventoryItem, fetchVendors, fetchChartOfAccounts /* removed fetchInventoryValuation, fetchReorderAlerts */ } from "@/lib/store/slices/accountingSlice"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { InventoryViewDrawer } from "./inventory-view-drawer"
import { CreateInventoryModal } from "./create-inventory-modal"
import { accountingApi } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

export function InventoryManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions } = useAccountingPermissions()
  
  const {
    inventoryItems,
    inventoryLoading,
    vendors,
    chartOfAccounts
  } = useSelector((state: RootState) => state.accounting)

  // Permission checks
  const canCreateInventory = permissions.canCreateInventory
  const canEditInventory = permissions.canUpdateInventory
  const canDeleteInventory = permissions.canDeleteInventory

  // Local state for Valuation & Reorder (avoid relying on thunk that caused runtime error)
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuationResponse | null>(null)
  const [valuationLoading, setValuationLoading] = useState(false)
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlertItem[]>([])
  const [reorderLoading, setReorderLoading] = useState(false)

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalItem, setModalItem] = useState<InventoryItem | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'items'|'valuation'|'levels'>('items')

  // Main / sub tab definitions (styled like invoices page)
  const mainTabs = [
    { id: "items", label: "Items", icon: Plus, description: "All items", gradient: "from-blue-400 to-blue-600" },
    { id: "valuation", label: "Valuation", icon: Download, description: "Inventory valuation", gradient: "from-green-400 to-green-600" },
    { id: "levels", label: "Reorder Levels", icon: AlertTriangle, description: "Reorder levels & alerts", gradient: "from-yellow-400 to-yellow-600" }
  ]

  // Basic stats computed from state
  const stats = {
    total: inventoryItems.length,
    valuationTotal: inventoryValuation?.totalValue || 0,
    valuationCount: inventoryValuation?.itemCount || 0,
    reorderCount: reorderAlerts.length,
    reorderLevelCount: inventoryItems.filter(i => {
      const rlNum = i.reorderLevel ? Number(i.reorderLevel) : 0
      return rlNum > 0
    }).length
  }

  useEffect(() => {
    dispatch(fetchInventoryItems())
    dispatch(fetchVendors())
    dispatch(fetchChartOfAccounts({ isActive: true }))
    // Fetch valuation and reorder alerts on initial load
    loadValuation()
    loadReorderAlerts()
  }, [dispatch])

  useEffect(() => {
    if (activeTab === 'valuation') {
      loadValuation()
    } else if (activeTab === 'levels') {
      loadReorderAlerts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadValuation = async () => {
    try {
      setValuationLoading(true)
      const res = await accountingApi.getInventoryValuation()
      if (res.success) {
        setInventoryValuation(res.data)
      } else {
        toast.error(res.error || 'Failed to fetch valuation')
      }
    } catch (err) {
      toast.error('Failed to fetch valuation')
    } finally {
      setValuationLoading(false)
    }
  }

  const loadReorderAlerts = async () => {
    try {
      setReorderLoading(true)
      const res = await accountingApi.getReorderAlerts()
      if (res.success) {
        setReorderAlerts(res.data || [])
      } else {
        toast.error(res.error || 'Failed to fetch reorder alerts')
      }
    } catch (err) {
      toast.error('Failed to fetch reorder alerts')
    } finally {
      setReorderLoading(false)
    }
  }

  const openView = async (id: string) => {
    await dispatch(fetchInventoryItem(id))
    setIsViewOpen(true)
  }

  const openCreateModal = () => {
    setModalItem(null)
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setModalItem(item)
    setIsEditMode(true)
    setIsModalOpen(true)
  }

  const handleDeleteItem = (item: InventoryItem) => {
    console.log('Delete inventory item (confirm):', item.id)
  }

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(typeof amount === 'string' ? parseFloat(amount) : amount)

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(w => w.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)

  const columns: Column<InventoryItem>[] = [
    {
      key: 'itemName',
      label: 'Item Details',
      sortable: true,
      render: (value, row) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => { e.stopPropagation(); openView(row.id) }}
          title="Click to view item"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
              {getInitials(value)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>{value}</span>
            <p className="text-xs text-gray-500 truncate font-mono" title={row.skuNumber || ''}>{row.skuNumber}</p>
            <p className="text-xs text-gray-500 truncate" title={row.description || ''}>{row.description}</p>
          </div>
        </div>
      )
    },
    {
      key: 'inventoryAssetAccount',
      label: 'Account',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => { e.stopPropagation(); openView(row.id) }}
          title="Inventory account"
        >
          <div className="text-sm">
            {row.inventoryAssetAccount ? `${row.inventoryAssetAccount.accountNo} - ${row.inventoryAssetAccount.accountName}` : '—'}
          </div>
          <div className="text-xs text-gray-500">
            Supplier: {row.supplier?.name || '—'}
          </div>
        </div>
      )
    },
    {
      key: 'quantityOnHand',
      label: 'Quantity',
      sortable: true,
      render: (value, row) => (
        <div
          className="text-right cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => { e.stopPropagation(); openView(row.id) }}
          title="Quantity on hand"
        >
          <div className="text-lg font-bold">{value}</div>
          <div className="text-xs text-gray-500">Unit: {row.unitOfMeasure || '—'}</div>
        </div>
      )
    },
    {
      key: 'costOfPurchase',
      label: 'Cost',
      sortable: true,
      render: (value, row) => (
        <div
          className="text-right cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => { e.stopPropagation(); openView(row.id) }}
          title="Cost of purchase"
        >
          <div className="text-lg font-bold text-green-600">{formatCurrency(value)}</div>
          <div className="text-xs text-gray-500">Reorder: {row.reorderLevel || '0'}</div>
        </div>
      )
    },
    {
      key: 'stockMovements',
      label: 'Movements',
      sortable: false,
      render: (_v, row) => (
        <div className="cursor-pointer -m-2 p-2 rounded" onClick={(e) => { e.stopPropagation(); openView(row.id) }}>
          <div className="text-sm text-blue-600">{row.stockMovements?.length || 0} movement{(row.stockMovements?.length || 0) !== 1 ? 's' : ''}</div>
          <div className="text-xs text-gray-500">Last: {row.stockMovements && row.stockMovements.length > 0 ? format(new Date(row.stockMovements[0].createdAt || row.createdAt), 'MMM dd, yyyy') : '—'}</div>
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
          onClick={(e) => { e.stopPropagation(); openView(row.id) }}
          title="Click to view"
        >
          <span className="text-sm text-gray-600">{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    }
  ]

  // Columns for valuation table (uses inventoryValuation.valuation items)
  const valuationColumns: Column<any>[] = [
    {
      key: 'itemName',
      label: 'Item',
      render: (value, row) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => openView(row.itemId)}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
              {getInitials(row.itemName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">{row.itemName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Qty',
      render: (value) => <div className="text-right font-medium">{value}</div>
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      render: (value) => <div className="text-right text-green-600 font-medium">{formatCurrency(value)}</div>
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      render: (value) => <div className="text-right font-bold">{formatCurrency(value)}</div>
    }
  ]

  // Columns for reorder alerts / levels table
  const reorderColumns: Column<any>[] = [
    {
      key: 'itemName',
      label: 'Item',
      render: (value, row) => (
        <div className="cursor-pointer" onClick={() => openView(row.itemId)}>
          <div className="font-medium">{row.itemName}</div>
        </div>
      )
    },
    {
      key: 'currentQuantity',
      label: 'Current Qty',
      render: (value) => <div className="text-right">{value}</div>
    },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      render: (value) => <div className="text-right">{value}</div>
    }
  ]

  const exportValuation = (data: any[]) => {
    const rows = [
      ['Item', 'Qty', 'Unit Cost', 'Total Value'],
      ...data.map(d => [d.itemName, String(d.quantity), String(d.unitCost), String(d.totalValue)])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valuation-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} valuation rows`)
  }

  const exportReorder = (data: any[]) => {
    const rows = [
      ['Item', 'Current Qty', 'Reorder Level'],
      ...data.map(d => [d.itemName, String(d.currentQuantity), String(d.reorderLevel)])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reorder-alerts-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} reorder rows`)
  }

  const filterOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]

  const bulkActions = [
    { label: 'Mark Active', value: 'mark-active', icon: <div className="w-6 h-6 mr-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div> },
    { label: 'Mark Inactive', value: 'mark-inactive', icon: <div className="w-6 h-6 mr-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center"><Clock className="w-3 h-3 text-white" /></div> }
  ]

  const handleBulkAction = async (selected: InventoryItem[], action: string) => {
    try {
      console.log(`Bulk ${action} for ${selected.length} items`)
      toast.success(`${action} applied to ${selected.length} items`)
    } catch (err) {
      toast.error('Bulk action failed')
    }
  }

  const handleExport = (data: InventoryItem[]) => {
    const csv = [
      ['Item', 'SKU', 'Qty', 'Cost', 'Supplier', 'Account', 'Created'],
      ...data.map(d => [
        d.itemName,
        d.skuNumber || '',
        d.quantityOnHand,
        d.costOfPurchase,
        d.supplier?.name || '',
        d.inventoryAssetAccount ? `${d.inventoryAssetAccount.accountNo} ${d.inventoryAssetAccount.accountName}` : '',
        new Date(d.createdAt).toLocaleDateString()
      ])
    ].map(r => r.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} items`)
  }

  const handleMainTabChange = (id: string) => {
    // future-proof: only one main tab now
  }

  const handleSubTabChange = (tabId: 'items'|'valuation'|'levels') => {
    setActiveTab(tabId)
    // load data if needed
    if (tabId === 'valuation') loadValuation()
    if (tabId === 'levels') loadReorderAlerts()
  }

  return (
    <div className="space-y-6">
      {/* Top-level tabs (Items / Valuation / Reorder Levels) */}
      <div className="flex items-center overflow-x-auto border-b px-6">
        <div className="flex space-x-1 min-w-max">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === (tab.id === 'items' ? 'items' : tab.id === 'valuation' ? 'valuation' : 'levels')
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id === 'items' ? 'items' : tab.id === 'valuation' ? 'valuation' : 'levels')}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 text-lg font-medium rounded-t-lg border-b-2 transition-all duration-200",
                  isActive ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-gray-900"
                )}
              >
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200", tab.gradient)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Header with Create Button */}
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-normal">Inventory</h1>
          <p className="text-muted-foreground">Manage inventory items, stock movements and accounts</p>
        </div>
        <div className="flex gap-3">
          {canCreateInventory && (
            <Button onClick={openCreateModal} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" /> New Item
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards (top-level tab summaries) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
        {mainTabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === (t.id === 'items' ? 'items' : t.id === 'valuation' ? 'valuation' : 'levels')
          const count = t.id === 'items' ? stats.total :
                        t.id === 'valuation' ? stats.valuationCount :
                        t.id === 'levels' ? stats.reorderLevelCount : 0
          const amount = t.id === 'valuation' ? stats.valuationTotal : undefined
          return (
            <Card key={t.id} className="cursor-pointer hover:shadow-sm transition-shadow h-[90px] border-gray-200 shadow-sm relative" onClick={() => setActiveTab(t.id === 'items' ? 'items' : t.id === 'valuation' ? 'valuation' : 'levels')}>
              <CardContent className="p-3 h-full flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br", t.gradient)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold">{count}</p>
                    {amount !== undefined && <p className="text-base font-semibold text-green-600 mt-1">{formatCurrency(amount)}</p>}
                  </div>
                </div>
                <Badge className="absolute top-2 right-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700">{t.label}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Data / Content for active top-level tab */}
      {activeTab === 'items' && (
        <ProcurementDataTable
          data={inventoryItems}
          columns={columns}
          title="Inventory Items"
          filterOptions={filterOptions}
          onView={openView}
          onEdit={openEditModal}
          onDelete={handleDeleteItem}
          onBulkAction={handleBulkAction}
          bulkActions={bulkActions}
          loading={inventoryLoading}
          onExport={handleExport}
          showSearch={false}
          showFilters={false}
          emptyMessage="No inventory items found. Create your first item to get started."
        />
      )}

      {/* Levels tab - show items that have a reorder level and current qty */}
      {activeTab === 'levels' && (
        <>
          <ProcurementDataTable
            data={reorderAlerts}
            columns={reorderColumns}
            title="Reorder Alerts"
            searchPlaceholder="Search reorder alerts..."
            loading={reorderLoading}
            onView={(row: any) => openView(row.itemId)}
            onExport={() => exportReorder(reorderAlerts)}
            showActions={false}
            emptyMessage="No reorder alerts"
          />
        </>
      )}

      {activeTab === 'valuation' && (
        <ProcurementDataTable
          data={inventoryValuation ? inventoryValuation.valuation : []}
          columns={valuationColumns}
          title="Inventory Valuation"
          searchPlaceholder="Search valuation..."
          loading={valuationLoading}
          onView={(row: any) => openView(row.itemId)}
          onExport={() => exportValuation(inventoryValuation?.valuation || [])}
          emptyMessage="No valuation data available."
          showActions={false}
        />
      )}

      {/* View Drawer */}
      <InventoryViewDrawer
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedItem(null); dispatch(fetchInventoryItems()) }}
        onItemUpdated={() => dispatch(fetchInventoryItems())}
      />

      {/* Create/Edit Modal */}
      <CreateInventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { setIsModalOpen(false); dispatch(fetchInventoryItems()) }}
        initialItem={modalItem || undefined}
        isEdit={isEditMode}
      />
    </div>
  )
}

/* Lightweight skeleton that mimics the datatable layout (used while loading) */
function PageSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-md shadow-sm">
            <div className="h-4 w-56 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded ml-auto"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded-full ml-4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
