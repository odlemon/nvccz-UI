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
  setGoodsReceivedNotes, 
  addGoodsReceivedNote, 
  updateGoodsReceivedNote, 
  removeGoodsReceivedNote,
  setGRNLoading,
  setGRNError,
  setSelectedGRN
} from "@/lib/store/slices/procurementSlice"
import { procurementApi, GoodsReceivedNote } from "@/lib/api/procurement-api"
import { CiViewTimeline, CiCalendar, CiShop, CiCircleCheck } from "react-icons/ci"
import { Package, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { CreateGRNModal } from "./create-grn-modal"
import { ApprovalDialog } from "./approval-dialog"

export function GoodsReceivedNotes() {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const { goodsReceivedNotes, grnLoading } = useAppSelector(state => state.procurement)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingGRN, setViewingGRN] = useState<GoodsReceivedNote | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [selectedGRNForApproval, setSelectedGRNForApproval] = useState<GoodsReceivedNote | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  useEffect(() => {
    loadGoodsReceivedNotes()
  }, [])

  const loadGoodsReceivedNotes = async () => {
    try {
      dispatch(setGRNLoading(true))
      const response = await procurementApi.getGoodsReceivedNotes()
      if (response.success && response.data) {
        dispatch(setGoodsReceivedNotes(response.data))
      } else {
        dispatch(setGRNError('Failed to load goods received notes'))
        toast.error("Failed to load goods received notes")
      }
    } catch (error: any) {
      dispatch(setGRNError(error.message))
      toast.error("Error loading goods received notes", { description: error.message })
    } finally {
      dispatch(setGRNLoading(false))
    }
  }

  const handleView = (grn: GoodsReceivedNote) => {
    setViewingGRN(grn)
    dispatch(setSelectedGRN(grn))
    setIsDrawerOpen(true)
  }

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleEdit = (grn: GoodsReceivedNote) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon")
  }

  const handleDelete = async (grn: GoodsReceivedNote) => {
    if (!confirm(`Are you sure you want to delete GRN ${grn.grnNumber}?`)) {
      return
    }

    try {
      // TODO: Implement delete API call
      dispatch(removeGoodsReceivedNote(grn.id))
      toast.success("GRN deleted successfully")
    } catch (error: any) {
      toast.error("Failed to delete GRN", { description: error.message })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<GoodsReceivedNote>[] = [
    {
      key: 'grnNumber',
      label: 'GRN Number',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <CiViewTimeline className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'purchaseOrder',
      label: 'Purchase Order',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <CiShop className="w-4 h-4 text-gray-600" />
          <span>{value?.purchaseOrderNumber || 'N/A'}</span>
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
      key: 'items',
      label: 'Items Summary',
      render: (items) => {
        if (!items || items.length === 0) return <span className="text-gray-500">No items</span>
        
        const totalReceived = items.reduce((sum: number, item: any) => sum + item.quantityReceived, 0)
        const totalAccepted = items.reduce((sum: number, item: any) => sum + item.quantityAccepted, 0)
        const totalRejected = items.reduce((sum: number, item: any) => sum + item.quantityRejected, 0)
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-3 h-3 text-blue-600" />
              <span>{totalReceived} received</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="text-green-600">{totalAccepted} accepted</span>
              {totalRejected > 0 && <span className="text-red-600">{totalRejected} rejected</span>}
            </div>
          </div>
        )
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' }
  ]

  const bulkActions = [
    { label: 'Approve', value: 'approve', icon: <CheckCircle className="w-4 h-4 mr-1" /> },
    { label: 'Reject', value: 'reject', icon: <XCircle className="w-4 h-4 mr-1" /> }
  ]

  const handleBulkAction = (selectedGRNs: GoodsReceivedNote[], action: string) => {
    switch (action) {
      case 'approve':
        toast.info(`Approving ${selectedGRNs.length} GRNs`)
        break
      case 'reject':
        toast.info(`Rejecting ${selectedGRNs.length} GRNs`)
        break
      default:
        toast.info(`Bulk action: ${action}`)
    }
  }

  const handleExport = (data: GoodsReceivedNote[]) => {
    // TODO: Implement export functionality
    toast.success(`Exporting ${data.length} GRNs`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Goods Received Notes</h1>
          <p className="text-muted-foreground">Track and manage received goods with quality control</p>
        </div>
      </div>

      {/* Data Table */}
      <ProcurementDataTable
        data={goodsReceivedNotes}
        columns={columns}
        title="Goods Received Notes"
        searchPlaceholder="Search GRNs..."
        filterOptions={filterOptions}
        onView={handleView}
        onEdit={permissions.canUpdateGRN ? handleEdit : undefined}
        onDelete={permissions.canDeleteGRN ? handleDelete : undefined}
        onCreate={permissions.canCreateGRN ? handleCreate : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={grnLoading}
        onExport={handleExport}
        emptyMessage="No goods received notes found. Create your first GRN to get started."
      />

      {/* View Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={`GRN: ${viewingGRN?.grnNumber || ''}`}
        description="View goods received note details and quality control information"
        size="xl"
      >
        {viewingGRN && (
          <div className="space-y-6">
            {/* GRN Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CiViewTimeline className="w-5 h-5" />
                  GRN Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">GRN Number</label>
                    <p className="text-lg font-semibold">{viewingGRN.grnNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(viewingGRN.status)}>
                        {getStatusIcon(viewingGRN.status)}
                        {viewingGRN.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Order</label>
                    <p className="font-medium">{viewingGRN.purchaseOrder?.purchaseOrderNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="font-medium">
                      {new Date(viewingGRN.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items with Quality Control */}
            <Card>
              <CardHeader>
                <CardTitle>Received Items & Quality Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {viewingGRN.items?.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        <Badge className={getQualityStatusColor(item.qualityStatus)}>
                          {item.qualityStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Quantity Received</label>
                          <p className="font-medium text-blue-600">{item.quantityReceived}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Quantity Accepted</label>
                          <p className="font-medium text-green-600">{item.quantityAccepted}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Quantity Rejected</label>
                          <p className="font-medium text-red-600">{item.quantityRejected}</p>
                        </div>
                      </div>

                      {item.qualityNotes && (
                        <div>
                          <label className="text-sm text-gray-600">Quality Notes</label>
                          <p className="text-sm bg-gray-50 p-2 rounded mt-1">{item.qualityNotes}</p>
                        </div>
                      )}
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
              {viewingGRN.status === 'PENDING_APPROVAL' && (
                <>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setSelectedGRNForApproval(viewingGRN)
                      setIsRejectDialogOpen(true)
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="gradient-primary text-white"
                    onClick={() => {
                      setSelectedGRNForApproval(viewingGRN)
                      setIsApprovalDialogOpen(true)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve GRN
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </ProcurementDrawer>

      {/* Create Modal */}
      <CreateGRNModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadGoodsReceivedNotes()
        }}
      />

      {/* Approval Dialog */}
      <ApprovalDialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
        title="Approve Goods Received Note"
        description={`Are you sure you want to approve GRN ${selectedGRNForApproval?.grnNumber}?`}
        loading={approvalLoading}
        onConfirm={async () => {
          if (!selectedGRNForApproval) return
          setApprovalLoading(true)
          try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('GRN approved successfully')
            setIsApprovalDialogOpen(false)
            loadGoodsReceivedNotes()
          } catch (error) {
            toast.error('Failed to approve GRN')
          } finally {
            setApprovalLoading(false)
          }
        }}
      />

      {/* Reject Dialog */}
      <ApprovalDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        title="Reject Goods Received Note"
        description={`Are you sure you want to reject GRN ${selectedGRNForApproval?.grnNumber}?`}
        loading={approvalLoading}
        onConfirm={async () => {
          if (!selectedGRNForApproval) return
          setApprovalLoading(true)
          try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('GRN rejected successfully')
            setIsRejectDialogOpen(false)
            loadGoodsReceivedNotes()
          } catch (error) {
            toast.error('Failed to reject GRN')
          } finally {
            setApprovalLoading(false)
          }
        }}
      />
    </div>
  )
}
