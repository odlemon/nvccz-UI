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
import { Package, CheckCircle, Clock, AlertCircle, XCircle, Building } from "lucide-react"
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

  const [filters, setFilters] = useState({
    status: 'all',
    purchaseOrderId: '',
    vendorId: '',
    qualityStatus: '',
    grnNumber: ''
  })

  useEffect(() => {
    loadGoodsReceivedNotes()
  }, [selectedTab, filters])

  const loadGoodsReceivedNotes = async () => {
    try {
      setLoading(true)
      const apiFilters: any = {
        limit: 50,
        offset: 0
      }
      if (selectedTab !== 'all') apiFilters.status = selectedTab.toUpperCase()
      if (filters.purchaseOrderId) apiFilters.purchaseOrderId = filters.purchaseOrderId
      if (filters.vendorId) apiFilters.vendorId = filters.vendorId
      if (filters.qualityStatus) apiFilters.qualityStatus = filters.qualityStatus
      if (filters.grnNumber) apiFilters.grnNumber = filters.grnNumber

      const response = await procurementApiV2.getGRNs(apiFilters)
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
          <span className="font-medium text-blue-600">{value}</span>
        </div>
      )
    },
    {
      key: 'poNumber',
      label: 'Purchase Order',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <CiShop className="w-4 h-4 text-gray-600" />
          <span className="font-medium">{row.purchaseOrder?.poNumber || value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      sortable: true,
      render: (value, row) => <span className="font-medium text-gray-700">{row.purchaseOrder?.vendor?.name || value || 'N/A'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
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
      key: 'qualityStatus',
      label: 'Quality',
      sortable: true,
      render: (value) => (
        <Badge className={getQualityStatusColor(value)}>
          {value || 'PENDING'}
        </Badge>
      )
    },
    {
      key: 'receivedDate',
      label: 'Received Date',
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
        <TabsList className="flex items-center justify-start gap-8 bg-transparent border-b rounded-none h-12 w-full px-0">
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <CiViewTimeline className="w-5 h-5" />
              <span className="font-medium">All GRNs</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('all')}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Received</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('received')}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="partial" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Partial</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('partial')}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Approved</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border-none">{getTabCount('approved')}</Badge>
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="flex items-center justify-start gap-8 bg-transparent border-b rounded-none h-12 w-full px-0 mb-6">
              <TabsTrigger 
                value="details" 
                className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
              >
                <CiViewTimeline className="w-5 h-5" />
                <span className="font-medium">GRN Details</span>
              </TabsTrigger>
              <TabsTrigger 
                value="items" 
                className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">Received Items</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* GRN & PO Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CiViewTimeline className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">GRN Number</p>
                        <p className="text-lg font-bold text-blue-900">{viewingGRN.grnNumber}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CiShop className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Purchase Order</p>
                        <p className="text-lg font-bold text-purple-900">{viewingGRN.purchaseOrder?.poNumber || viewingGRN.poNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Status</p>
                        <Badge className={getStatusColor(viewingGRN.status)}>
                          {getStatusIcon(viewingGRN.status)}
                          {viewingGRN.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      Vendor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Vendor Name</label>
                      <p className="font-semibold text-gray-900">{viewingGRN.purchaseOrder?.vendor?.name || viewingGRN.vendorName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Contact Email</label>
                      <p className="text-sm font-medium text-gray-700">{viewingGRN.purchaseOrder?.vendor?.email || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CiCalendar className="w-4 h-4 text-gray-500" />
                      Receipt Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Received Date</label>
                        <p className="font-medium text-gray-900">
                          {new Date(viewingGRN.receivedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Quality Status</label>
                        <div className="mt-1">
                          <Badge className={getQualityStatusColor(viewingGRN.qualityStatus)}>
                            {viewingGRN.qualityStatus || 'PENDING'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Received By</label>
                      <p className="font-medium text-gray-900">{viewingGRN.receivedBy ? `${viewingGRN.receivedBy.firstName} ${viewingGRN.receivedBy.lastName}` : 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {(viewingGRN.qualityNotes || viewingGRN.notes) && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Quality & Audit Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{viewingGRN.qualityNotes || viewingGRN.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              {viewingGRN.items && viewingGRN.items.length > 0 ? (
                viewingGRN.items.map((item, index) => (
                  <Card key={index} className="overflow-hidden border-l-4 border-l-blue-400">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="w-5 h-5 text-blue-500" />
                          </div>
                          <h4 className="font-bold text-gray-900">{item.purchaseOrderItem?.itemName || item.itemName || 'Unnamed Item'}</h4>
                        </div>
                        <Badge className={getQualityStatusColor(item.qualityStatus)}>
                          {item.qualityStatus}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-6 bg-gray-50 p-4 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Ordered</label>
                          <p className="font-bold text-gray-600 text-lg">{item.purchaseOrderItem?.quantity || item.quantityOrdered || '0'}</p>
                        </div>
                        <div className="space-y-1 border-l pl-6">
                          <label className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">Received</label>
                          <p className="font-bold text-blue-600 text-lg">{item.quantityReceived}</p>
                        </div>
                        <div className="space-y-1 border-l pl-6">
                          <label className="text-[10px] text-green-400 uppercase font-bold tracking-tighter">Accepted</label>
                          <p className="font-bold text-green-600 text-lg">{item.quantityAccepted || '0'}</p>
                        </div>
                        <div className="space-y-1 border-l pl-6">
                          <label className="text-[10px] text-red-400 uppercase font-bold tracking-tighter">Rejected</label>
                          <p className="font-bold text-red-600 text-lg">{item.quantityRejected || '0'}</p>
                        </div>
                      </div>

                      {item.qualityNotes && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">Quality Note</p>
                            <p className="text-sm text-amber-900 leading-snug">{item.qualityNotes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No items found in this receipt</p>
                </div>
              )}
            </TabsContent>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-6 border-t mt-6">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Close
              </Button>
              {viewingGRN.status === 'RECEIVED' && permissions.canApproveGRN && (
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
          </Tabs>
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
