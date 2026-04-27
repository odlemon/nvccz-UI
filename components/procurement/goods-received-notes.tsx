"use client"

import { useEffect, useState, useMemo } from "react"
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { ProcurementDrawer } from "./procurement-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { procurementApiV2, GoodsReceivedNote } from "@/lib/api/procurement-api-v2"
import { CiViewTimeline, CiCalendar, CiShop, CiCircleCheck } from "react-icons/ci"
import { Package, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { CreateGRNModal } from "./create-grn-modal"
import { ApprovalDialog } from "./approval-dialog"

export function GoodsReceivedNotes() {
  const { permissions } = useProcurementPermissions()
  const [selectedTab, setSelectedTab] = useState('all')
  const [grns, setGRNs] = useState<GoodsReceivedNote[]>([])
  const [loading, setLoading] = useState(false)
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
      setLoading(true)
      const response = await procurementApiV2.getGRNs()
      if (response.success && response.data) {
        setGRNs(response.data)
      } else {
        toast.error("Failed to load goods received notes")
      }
    } catch (error: any) {
      toast.error("Error loading goods received notes", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentData = () => {
    if (selectedTab === 'all') return grns
    if (selectedTab === 'received') return grns.filter(grn => grn.status === 'RECEIVED')
    if (selectedTab === 'partial') return grns.filter(grn => grn.status === 'PARTIALLY_RECEIVED')
    if (selectedTab === 'approved') return grns.filter(grn => grn.status === 'APPROVED')
    return grns
  }

  const getTabCount = (status: string) => {
    if (status === 'all') return grns.length
    return grns.filter(grn => {
      if (status === 'received') return grn.status === 'RECEIVED'
      if (status === 'partial') return grn.status === 'PARTIALLY_RECEIVED'
      if (status === 'approved') return grn.status === 'APPROVED'
      return false
    }).length
  }

  const handleView = (grn: GoodsReceivedNote) => {
    setViewingGRN(grn)
    setIsDrawerOpen(true)
  }

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleEdit = (grn: GoodsReceivedNote) => {
    toast.info("Edit functionality coming soon")
  }

  const handleDelete = async (grn: GoodsReceivedNote) => {
    if (!confirm(`Are you sure you want to delete GRN ${grn.grnNumber}?`)) {
      return
    }

    try {
      // TODO: Implement delete API call
      setGRNs(grns.filter(g => g.id !== grn.id))
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
      render: (value) => (
        <div className="flex items-center gap-2">
          <CiViewTimeline className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'poNumber',
      label: 'Purchase Order',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <CiShop className="w-4 h-4 text-gray-600" />
          <span>{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      sortable: true,
      render: (value) => <span>{value || 'N/A'}</span>
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
      key: 'receivedItems',
      label: 'Items Received',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-3 h-3 text-blue-600" />
            <span>{value}/{row.totalItems} items</span>
          </div>
        </div>
      )
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
    { label: 'Received', value: 'RECEIVED' },
    { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' }
  ]

  const filteredBulkActions = useMemo(() => {
    return [
      {
        label: 'Approve',
        value: 'approve',
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        show: permissions.canApproveGRN
      },
      {
        label: 'Reject',
        value: 'reject',
        icon: <XCircle className="w-4 h-4 mr-1" />,
        show: permissions.canApproveGRN
      }
    ].filter(action => action.show)
  }, [permissions])

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

      {/* Status Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex gap-2">
            All
            <Badge variant="secondary">{getTabCount('all')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="received" className="flex gap-2">
            Received
            <Badge variant="secondary">{getTabCount('received')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="partial" className="flex gap-2">
            Partial
            <Badge variant="secondary">{getTabCount('partial')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex gap-2">
            Approved
            <Badge variant="secondary">{getTabCount('approved')}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {/* Data Table */}
          <ProcurementDataTable
            data={getCurrentData()}
            columns={columns}
            title="Goods Received Notes"
            searchPlaceholder="Search GRNs..."
            filterOptions={filterOptions}
            onView={handleView}
            onEdit={permissions.canUpdateGRN ? handleEdit : undefined}
            onDelete={permissions.canDeleteGRN ? handleDelete : undefined}
            onCreate={permissions.canCreateGRN ? handleCreate : undefined}
            onBulkAction={handleBulkAction}
            bulkActions={filteredBulkActions}
            loading={loading}
            onExport={handleExport}
            emptyMessage="No goods received notes found. Create your first GRN to get started."
          />
        </TabsContent>
      </Tabs>

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
                    <p className="font-medium">{viewingGRN.poNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor</label>
                    <p className="font-medium">{viewingGRN.vendorName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Received Date</label>
                    <p className="font-medium">
                      {new Date(viewingGRN.receivedDate).toLocaleDateString()}
                    </p>
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

            {/* Items Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Received Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {viewingGRN.items && viewingGRN.items.length > 0 ? (
                    viewingGRN.items.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.itemName}</h4>
                          <Badge className={item.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : item.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {item.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-gray-600">PO Quantity</label>
                            <p className="font-medium text-blue-600">{item.poQuantity}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Received</label>
                            <p className="font-medium text-green-600">{item.receivedQuantity}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Unit</label>
                            <p className="font-medium">{item.unit}</p>
                          </div>
                        </div>

                        {item.rejectionReason && (
                          <div>
                            <label className="text-sm text-gray-600">Rejection Reason</label>
                            <p className="text-sm bg-red-50 p-2 rounded mt-1 text-red-700">{item.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {viewingGRN.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{viewingGRN.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Close
              </Button>
              {viewingGRN.status === 'PENDING_APPROVAL' && permissions.canApproveGRN && (
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
        isInvestee={false}
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
