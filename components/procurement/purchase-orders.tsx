"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { ProcurementDrawer } from "./procurement-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { CiShop, CiCalendar, CiDollar, CiUser } from "react-icons/ci"
import { Building, CheckCircle, Clock, AlertCircle, Truck } from "lucide-react"
import { toast } from "sonner"
import { CreatePurchaseOrderModal } from "./create-purchase-order-modal"
import { ApprovalDialog } from "./approval-dialog"

export function PurchaseOrders() {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const { purchaseOrders, purchaseOrdersLoading } = useAppSelector(state => state.procurement)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<PurchaseOrder | null>(null)

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

      {/* Data Table */}
      <ProcurementDataTable
        data={purchaseOrders}
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

      {/* View Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={`Purchase Order: ${viewingOrder?.purchaseOrderNumber || ''}`}
        description="View purchase order details and manage status"
        size="xl"
      >
        {viewingOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CiShop className="w-5 h-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">PO Number</label>
                    <p className="text-lg font-semibold">{viewingOrder.purchaseOrderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(viewingOrder.status)}>
                        {getStatusIcon(viewingOrder.status)}
                        {viewingOrder.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor</label>
                    <p className="font-medium">{viewingOrder.vendor?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(viewingOrder.priority)}>
                        {viewingOrder.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Amount</label>
                    <p className="text-lg font-semibold text-green-600">
                      ${parseFloat(viewingOrder.totalAmount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expected Delivery</label>
                    <p className="font-medium">
                      {new Date(viewingOrder.expectedDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {viewingOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.itemName}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} {item.unit} × ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: ${(parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString())).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )) || (
                      <p className="text-gray-500 text-center py-4">No items found</p>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Close
              </Button>
              {permissions.canUpdatePurchaseOrder && (
                <Button className="gradient-primary text-white">
                  Edit Order
                </Button>
              )}
              {viewingOrder?.status === 'DRAFT' && permissions.canApprovePurchaseOrder && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setSelectedOrderForApproval(viewingOrder)
                    setIsApprovalDialogOpen(true)
                  }}
                >
                  Send for Approval
                </Button>
              )}
            </div>
          </div>
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
