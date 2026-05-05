"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { ProcurementDrawer } from "./procurement-drawer"
import { PODrawerContent } from "./po-drawer-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  setPurchaseOrders,
  addPurchaseOrder,
  updatePurchaseOrder,
  removePurchaseOrder,
  setPurchaseOrdersLoading,
  setPurchaseOrdersError,
  setSelectedPurchaseOrder
} from "@/lib/store/slices/procurementSlice"
import { procurementApi, PurchaseOrder } from "@/lib/api/procurement-api"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import { CiShop, CiCalendar, CiDollar, CiUser } from "react-icons/ci"
import { Building, CheckCircle, Clock, AlertCircle, Truck, Download, Send, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CreatePurchaseOrderModal } from "./create-purchase-order-modal"
import { CreateGRNModal } from "./create-grn-modal"
import { ApprovalDialog } from "./approval-dialog"

export function PurchaseOrders() {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const { purchaseOrders, purchaseOrdersLoading } = useAppSelector(state => state.procurement)
  const [selectedTab, setSelectedTab] = useState('all')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<PurchaseOrder | null>(null)
  const [poActionsLoading, setPoActionsLoading] = useState(false)
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false)
  const [preSelectedPOId, setPreSelectedPOId] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  const loadPurchaseOrders = async () => {
    try {
      dispatch(setPurchaseOrdersLoading(true))
      const response = await procurementApi.getPurchaseOrders()
      if (response.success && response.data) {
        dispatch(setPurchaseOrders(response.data))
      } else {
        dispatch(setPurchaseOrdersError('Failed to load purchase orders'))
        toast.error("Failed to load purchase orders")
      }
    } catch (error: any) {
      dispatch(setPurchaseOrdersError(error.message))
      toast.error("Error loading purchase orders", { description: error.message })
    } finally {
      dispatch(setPurchaseOrdersLoading(false))
    }
  }

  const handleView = (order: PurchaseOrder) => {
    setViewingOrder(order)
    dispatch(setSelectedPurchaseOrder(order))
    setIsDrawerOpen(true)
  }

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleEdit = (order: PurchaseOrder) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon")
  }

  const handleDelete = async (order: PurchaseOrder) => {
    if (!confirm(`Are you sure you want to delete purchase order ${order.purchaseOrderNumber}?`)) {
      return
    }

    try {
      // TODO: Implement delete API call
      dispatch(removePurchaseOrder(order.id))
      toast.success("Purchase order deleted successfully")
    } catch (error: any) {
      toast.error("Failed to delete purchase order", { description: error.message })
    }
  }

  const handleSendPO = async (orderId: string, orderNumber: string) => {
    setPoActionsLoading(true)
    try {
      const response = await procurementApiV2.sendPurchaseOrder(orderId)
      if (response.success) {
        toast.success(`Purchase order ${orderNumber} sent to vendor`)
        loadPurchaseOrders()
      } else {
        toast.error('Failed to send PO', { description: response.message })
      }
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to send purchase order'
      toast.error('Send failed', { description })
    } finally {
      setPoActionsLoading(false)
    }
  }

  const handleDownloadPOPDF = async (orderId: string, orderNumber: string) => {
    setPoActionsLoading(true)
    try {
      const blob = await procurementApiV2.downloadPOPDF(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF downloaded successfully')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to download PDF'
      toast.error('Download failed', { description })
    } finally {
      setPoActionsLoading(false)
    }
  }

  const handleConvertToBill = async (orderId: string) => {
    setPoActionsLoading(true)
    try {
      const response = await procurementApiV2.convertToBill(orderId)
      if (response.success) {
        toast.success('Purchase order converted to bill successfully')
        loadPurchaseOrders()
      } else {
        toast.error('Failed to convert to bill', { description: response.message })
      }
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to convert to bill'
      toast.error('Conversion failed', { description })
    } finally {
      setPoActionsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4" />
      case 'SENT': return <Truck className="w-4 h-4" />
      case 'ACKNOWLEDGED': return <CheckCircle className="w-4 h-4" />
      case 'PARTIALLY_RECEIVED': return <AlertCircle className="w-4 h-4" />
      case 'RECEIVED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'ACKNOWLEDGED': return 'bg-green-100 text-green-800'
      case 'PARTIALLY_RECEIVED': return 'bg-yellow-100 text-yellow-800'
      case 'RECEIVED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCurrentData = () => {
    if (selectedTab === 'all') return purchaseOrders
    if (selectedTab === 'sent') return purchaseOrders.filter(po => po.status === 'SENT')
    if (selectedTab === 'received') return purchaseOrders.filter(po => po.status === 'RECEIVED')
    if (selectedTab === 'paid') return purchaseOrders.filter(po => po.status === 'PAID')
    return purchaseOrders
  }

  const getTabCount = (status: string) => {
    if (status === 'all') return purchaseOrders.length
    return purchaseOrders.filter(po => po.status === status.toUpperCase()).length
  }

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'purchaseOrderNumber',
      label: 'PO Number',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <CiShop className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-600" />
          <span>{value?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getStatusColor(value)}>
          <div className="flex items-center gap-1">
            {getStatusIcon(value)}
            {value.replace('_', ' ')}
          </div>
        </Badge>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getPriorityColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiDollar className="w-4 h-4 text-green-600" />
          <span className="font-medium">${parseFloat(value || '0').toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'expectedDeliveryDate',
      label: 'Expected Delivery',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-purple-600" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
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
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
    { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
    { label: 'Received', value: 'RECEIVED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ]

  const filteredBulkActions = useMemo(() => {
    return [
      {
        label: 'Send to Vendor',
        value: 'send',
        icon: <Truck className="w-4 h-4 mr-1" />,
        show: permissions.canSendPurchaseOrder
      },
      {
        label: 'Cancel Orders',
        value: 'cancel',
        icon: <AlertCircle className="w-4 h-4 mr-1" />,
        show: permissions.canUpdatePurchaseOrder // Using Update for Cancel as it's not explicitly defined
      }
    ].filter(action => action.show)
  }, [permissions])

  const handleBulkAction = (selectedOrders: PurchaseOrder[], action: string) => {
    switch (action) {
      case 'send':
        toast.info(`Sending ${selectedOrders.length} purchase orders to vendors`)
        break
      case 'cancel':
        toast.info(`Cancelling ${selectedOrders.length} purchase orders`)
        break
      default:
        toast.info(`Bulk action: ${action}`)
    }
  }

  const handleExport = (data: PurchaseOrder[]) => {
    // TODO: Implement export functionality
    toast.success(`Exporting ${data.length} purchase orders`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage and track purchase orders</p>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="flex items-center justify-start gap-8 bg-transparent border-b rounded-none h-12 w-full px-0">
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">All Orders</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('all')}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="sent" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              <span className="font-medium">Sent</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('sent')}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span className="font-medium">Received</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('received')}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="paid" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <CiDollar className="w-5 h-5" />
              <span className="font-medium">Paid</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('paid')}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {/* Data Table */}
          <ProcurementDataTable
            data={getCurrentData()}
            columns={columns}
            title="Purchase Orders"
            searchPlaceholder="Search purchase orders..."
            filterOptions={filterOptions}
            onView={handleView}
            onEdit={permissions.canUpdatePurchaseOrder ? handleEdit : undefined}
            onDelete={permissions.canDeletePurchaseOrder ? handleDelete : undefined}
            onCreate={permissions.canCreatePurchaseOrder ? handleCreate : undefined}
            onBulkAction={handleBulkAction}
            bulkActions={filteredBulkActions}
            loading={purchaseOrdersLoading}
            onExport={handleExport}
            emptyMessage="No purchase orders found. Create your first purchase order to get started."
          />
        </TabsContent>
      </Tabs>

      {/* View Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={`Purchase Order: ${viewingOrder?.purchaseOrderNumber || ''}`}
        description="View purchase order details and manage status"
        size="xl"
      >
        {viewingOrder && (
          <PODrawerContent
            po={viewingOrder}
            onSuccess={() => {
              setIsDrawerOpen(false)
              loadPurchaseOrders()
            }}
            onCreateGRN={(poId) => {
              setPreSelectedPOId(poId)
              setIsGRNModalOpen(true)
            }}
          />
        )}
      </ProcurementDrawer>

      {/* Create Modal */}
      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadPurchaseOrders()
        }}
      />

      {/* Create GRN Modal Integration */}
      <CreateGRNModal
        isOpen={isGRNModalOpen}
        onClose={() => {
          setIsGRNModalOpen(false)
          setPreSelectedPOId(undefined)
        }}
        onSuccess={() => {
          setIsGRNModalOpen(false)
          setPreSelectedPOId(undefined)
          loadPurchaseOrders()
        }}
        initialPurchaseOrderId={preSelectedPOId}
      />

      {/* Approval Dialog */}
      <ApprovalDialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
        title="Send Purchase Order for Approval"
        description={`Are you sure you want to send purchase order ${selectedOrderForApproval?.purchaseOrderNumber} for approval?`}
        loading={approvalLoading}
        onConfirm={async () => {
          if (!selectedOrderForApproval) return
          setApprovalLoading(true)
          try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Purchase order sent for approval')
            setIsApprovalDialogOpen(false)
            loadPurchaseOrders()
          } catch (error) {
            toast.error('Failed to send purchase order for approval')
          } finally {
            setApprovalLoading(false)
          }
        }}
      />
    </div>
  )
}
