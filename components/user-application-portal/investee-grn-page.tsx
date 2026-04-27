"use client"

import { useState, useEffect } from "react"
import { procurementApiV2, GoodsReceivedNote } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { CreateGRNModal } from "@/components/procurement/create-grn-modal"
import { ProcurementDrawer } from "@/components/procurement/procurement-drawer"
import { Loader2, Package, TrendingUp, AlertCircle, Calendar } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export function InvesteeGRNPage() {
  const [grns, setGRNs] = useState<GoodsReceivedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingGRN, setViewingGRN] = useState<GoodsReceivedNote | null>(null)

  useEffect(() => {
    loadGRNs()
  }, [])

  const loadGRNs = async () => {
    try {
      setLoading(true)
      const response = await procurementApiV2.getGRNs()
      if (response.success && response.data) {
        setGRNs(response.data)
      }
    } catch (error) {
      toast.error("Failed to load GRNs")
    } finally {
      setLoading(false)
    }
  }

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
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'poNumber',
      label: 'PO Number',
      sortable: true,
      render: (value) => <span>{value || 'N/A'}</span>
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
    },
    {
      key: 'receivedItems',
      label: 'Items',
      render: (value, row) => `${value}/${row.totalItems}`
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
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All GRNs</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-end">
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
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ProcurementDataTable
            data={grns.filter(g => g.status === 'APPROVED')}
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
            data={grns.filter(g => g.status === 'RECEIVED' || g.status === 'PARTIALLY_RECEIVED')}
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GRN Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">GRN Number</label>
                    <p className="font-semibold">{viewingGRN.grnNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">PO Number</label>
                    <p className="font-semibold">{viewingGRN.poNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <Badge className={`${getStatusColor(viewingGRN.status)} mt-1`}>
                      {viewingGRN.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Received Date</label>
                    <p className="font-semibold">{format(new Date(viewingGRN.receivedDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Items Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {viewingGRN.items?.map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{item.itemName}</p>
                        <Badge className={item.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>PO: {item.poQuantity}</div>
                        <div>Received: {item.receivedQuantity}</div>
                        <div>Unit: {item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ProcurementDrawer>
    </div>
  )
}
