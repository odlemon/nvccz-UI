"use client"

import { useState, useEffect } from "react"
import { procurementApiV2, GoodsReceivedNote } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { CreateGRNModal } from "@/components/procurement/create-grn-modal"
import { ProcurementDrawer } from "@/components/procurement/procurement-drawer"
import { Loader2, Package, TrendingUp, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CiViewTimeline, CiCalendar } from "react-icons/ci"
import { Building, CheckCircle, Clock } from "lucide-react"

const STATUS_OPTIONS = ['DRAFT', 'RECEIVED', 'PARTIALLY_RECEIVED', 'APPROVED', 'REJECTED'] as const
const PAGE_SIZE = 50

export function InvesteeGRNPage() {
  const [grns, setGRNs] = useState<GoodsReceivedNote[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingGRN, setViewingGRN] = useState<GoodsReceivedNote | null>(null)

  const [selectedTab, setSelectedTab] = useState('all')
  const [purchaseOrderFilter, setPurchaseOrderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [offset, setOffset] = useState(0)

  // Reset to first page when tab/filters change
  useEffect(() => {
    setOffset(0)
  }, [selectedTab, purchaseOrderFilter, statusFilter])

  useEffect(() => {
    loadGRNs()
  }, [selectedTab, purchaseOrderFilter, statusFilter, offset])

  const loadGRNs = async () => {
    try {
      setLoading(true)
      // Tab takes precedence over the explicit status filter
      let status: string | undefined
      if (selectedTab === 'approved') status = 'APPROVED'
      else if (selectedTab === 'pending') status = 'RECEIVED'
      else if (statusFilter !== 'all') status = statusFilter

      const response = await procurementApiV2.getApplicantGRNs({
        limit: PAGE_SIZE,
        offset,
        purchaseOrderId: purchaseOrderFilter || undefined,
        status,
      })
      if (response.success && response.data) {
        setGRNs(response.data.items || [])
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      toast.error("Failed to load GRNs")
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'RECEIVED': return 'bg-blue-100 text-blue-800'
      case 'PARTIALLY_RECEIVED': return 'bg-amber-100 text-amber-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<GoodsReceivedNote>[] = [
    {
      key: 'grnNumber',
      label: 'GRN Number',
      sortable: true,
      render: (value) => <span className="font-medium text-blue-600">{value}</span>
    },
    {
      key: 'poNumber',
      label: 'PO Number',
      sortable: true,
      render: (value, row) => <span className="font-medium">{row.purchaseOrder?.poNumber || value || 'N/A'}</span>
    },
    {
      key: 'receivedDate',
      label: 'Received Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge className={getStatusColor(value)}>
          {value.replace('_', ' ')}
        </Badge>
      )
    }
  ]

  const stats = [
    {
      label: 'Total GRNs',
      value: grns.length,
      icon: Package,
      color: 'bg-blue-600'
    },
    {
      label: 'Approved',
      value: grns.filter(g => g.status === 'APPROVED').length,
      icon: TrendingUp,
      color: 'bg-green-600'
    },
    {
      label: 'Pending',
      value: grns.filter(g => g.status === 'RECEIVED' || g.status === 'PARTIALLY_RECEIVED').length,
      icon: AlertCircle,
      color: 'bg-amber-600'
    },
    {
      label: 'Rejected',
      value: grns.filter(g => g.status === 'REJECTED').length,
      icon: Package,
      color: 'bg-red-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Goods Received Notes</h1>
        <p className="text-gray-600 mt-2">Track goods received from approved purchase orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="flex items-center justify-start gap-8 bg-transparent border-b rounded-none h-12 w-full px-0 mb-6">
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <CiViewTimeline className="w-5 h-5" />
            <span className="font-medium">All Receipts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Approved</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Pending Review</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-3 justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Purchase Order</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by PO id..."
                    className="pl-9 h-10 w-64 rounded-full border-gray-200"
                    value={purchaseOrderFilter}
                    onChange={(e) => setPurchaseOrderFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={selectedTab !== 'all'}>
                  <SelectTrigger className="w-48 h-10 rounded-full border-gray-200">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(purchaseOrderFilter || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  className="h-10 rounded-full text-xs text-gray-600"
                  onClick={() => {
                    setPurchaseOrderFilter('')
                    setStatusFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="gradient-primary text-white">
              <Package className="w-4 h-4 mr-2" />
              Create GRN
            </Button>
          </div>

          <ProcurementDataTable
            data={grns}
            columns={columns}
            title="Goods Received Notes"
            searchPlaceholder="Search GRNs..."
            onView={(grn) => {
              setViewingGRN(grn)
              setIsDrawerOpen(true)
            }}
            loading={false}
            emptyMessage="No goods received notes created yet"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600 font-medium">
                Showing {offset + 1} to {Math.min(offset + PAGE_SIZE, total)} of {total} Entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  className={cn(
                    "rounded-full w-9 h-9 p-0",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    const isActive = currentPage === pageNum
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOffset((pageNum - 1) * PAGE_SIZE)}
                        className={cn(
                          "w-9 h-9 p-0 rounded-full",
                          isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  className={cn(
                    "rounded-full w-9 h-9 p-0",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ProcurementDataTable
            data={grns}
            columns={columns}
            title="Approved GRNs"
            searchPlaceholder="Search approved GRNs..."
            onView={(grn) => {
              setViewingGRN(grn)
              setIsDrawerOpen(true)
            }}
            loading={false}
            emptyMessage="No approved GRNs"
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <ProcurementDataTable
            data={grns}
            columns={columns}
            title="Pending GRNs"
            searchPlaceholder="Search pending GRNs..."
            onView={(grn) => {
              setViewingGRN(grn)
              setIsDrawerOpen(true)
            }}
            loading={false}
            emptyMessage="No pending GRNs"
          />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <CreateGRNModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadGRNs()
        }}
        isInvestee={true}
      />

      {/* View Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={`GRN: ${viewingGRN?.grnNumber || ''}`}
        description="View goods received note details"
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
                <span className="font-medium">Receipt Details</span>
              </TabsTrigger>
              <TabsTrigger 
                value="items" 
                className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">Items</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Header Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="pt-6">
                    <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Receipt #</p>
                    <p className="text-lg font-bold text-blue-900">{viewingGRN.grnNumber}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                  <CardContent className="pt-6">
                    <p className="text-[10px] text-purple-600 font-bold uppercase mb-1">Order #</p>
                    <p className="text-lg font-bold text-purple-900">{viewingGRN.purchaseOrder?.poNumber || viewingGRN.poNumber || 'N/A'}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                  <CardContent className="pt-6">
                    <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">Status</p>
                    <Badge className={getStatusColor(viewingGRN.status)}>
                      {viewingGRN.status.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-600">
                      <CiCalendar className="w-4 h-4" />
                      Receipt info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Date Received</label>
                      <p className="font-bold text-gray-900">{format(new Date(viewingGRN.receivedDate), 'MMMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Quality Verification</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          {viewingGRN.qualityStatus || 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-600">
                      <Building className="w-4 h-4" />
                      Vendor info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Vendor Name</label>
                      <p className="font-bold text-gray-900">{viewingGRN.purchaseOrder?.vendor?.name || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              {viewingGRN.items?.map((item, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Package className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="font-bold text-gray-900">{item.purchaseOrderItem?.itemName || item.itemName}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{item.qualityStatus || 'RECEIVED'}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Ordered</label>
                        <p className="font-bold text-gray-700 text-lg">{item.purchaseOrderItem?.quantity || item.quantityOrdered || '0'}</p>
                      </div>
                      <div className="space-y-1 border-l pl-6">
                        <label className="text-[10px] text-blue-400 uppercase font-bold">Received</label>
                        <p className="font-bold text-blue-600 text-lg">{item.receivedQuantity}</p>
                      </div>
                      <div className="space-y-1 border-l pl-6">
                        <label className="text-[10px] text-green-400 uppercase font-bold">Accepted</label>
                        <p className="font-bold text-green-600 text-lg">{item.quantityAccepted || '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </ProcurementDrawer>
    </div>
  )
}
