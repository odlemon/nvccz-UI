// ============================================================================
// RFQ LIST PAGE (REFACTORED)
// Matches purchase-requisitions layout with filters, tabs, and data table
// ============================================================================

'use client'

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { ProcurementDrawer } from "@/components/procurement/procurement-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProcurementPermissions } from '@/lib/hooks/useProcurementPermissions'
import { ModuleGuard } from '@/lib/permissions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { fetchRfqs, selectAllRFQs, selectRFQsState } from '@/lib/store/slices/procurementV2Slice'
import { RFQ } from "@/lib/api/procurement-api-v2"
import { CiFileOn, CiUser, CiCalendar, CiSearch, CiFilter } from "react-icons/ci"
import { FileText, Users, Clock, CheckCircle, XCircle, Eye, Plus, X } from "lucide-react"
import { CreateRFQModal } from "@/components/procurement/create-rfq-modal"
import { RFQDrawerContent } from "@/components/procurement/rfq-drawer-content"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ProcurementLayout } from "@/components/layout/procurement-layout"

type TabConfig = {
  id: 'all' | 'sent' | 'closed'
  label: string
  icon: any
  gradient: string
}

const mainTabs: TabConfig[] = [
  {
    id: 'all',
    label: 'All RFQs',
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'sent',
    label: 'Sent',
    icon: Clock,
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'closed',
    label: 'Closed',
    icon: CheckCircle,
    gradient: 'from-gray-500 to-gray-600'
  },
]

export default function RFQPage() {
  const dispatch = useAppDispatch()
  const rfqs = useAppSelector(selectAllRFQs)
  const { rfqsLoading: loading, rfqsCount } = useAppSelector(selectRFQsState)
  const { permissions, moduleAccess, isLoading: permissionsLoading } = useProcurementPermissions()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingRFQ, setViewingRFQ] = useState<RFQ | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'closed'>('all')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load data when tab, filters, or pagination changes
  useEffect(() => {
    loadRFQs()
  }, [activeTab, searchTerm, statusFilter, currentPage, pageSize])

  const loadRFQs = async () => {
    try {
      const filters: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }

      if (searchTerm) filters.rfqNumber = searchTerm
      if (statusFilter !== 'all') filters.status = statusFilter

      await dispatch(fetchRfqs(filters)).unwrap()
    } catch (error: any) {
      toast.error("Error loading RFQs", { description: error.message })
    }
  }

  const getCurrentData = () => {
    if (activeTab === 'sent') return rfqs.filter(r => r.status === 'SENT')
    if (activeTab === 'closed') return rfqs.filter(r => r.status === 'CLOSED')
    return rfqs
  }

  const getCurrentCount = () => {
    if (activeTab === 'sent') return rfqs.filter(r => r.status === 'SENT').length
    if (activeTab === 'closed') return rfqs.filter(r => r.status === 'CLOSED').length
    return rfqsCount
  }

  const getPaginationData = () => {
    const total = getCurrentCount()
    return {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  const handleView = (rfq: RFQ) => {
    setViewingRFQ(rfq)
    setIsDrawerOpen(true)
  }

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />
      case 'SENT': return <Clock className="w-4 h-4" />
      case 'CLOSED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<RFQ>[] = [
    {
      key: 'rfqNumber',
      label: 'RFQ # / Title',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CiFileOn className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{value}</span>
          </div>
          <span className="text-sm text-muted-foreground">{row.title}</span>
        </div>
      )
    },
    {
      key: 'createdBy',
      label: 'Created By',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <CiUser className="w-4 h-4 text-gray-600" />
          <span>{value.firstName} {value.lastName}</span>
        </div>
      )
    },
    {
      key: 'vendors',
      label: 'Vendors',
      sortable: false,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-purple-600" />
          <span>{value?.length || 0} vendors</span>
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
            {value}
          </div>
        </Badge>
      )
    },
    {
      key: 'rfqDeadline',
      label: 'Deadline',
      sortable: true,
      render: (value) => (
        value ? (
          <div className="flex items-center gap-1">
            <CiCalendar className="w-4 h-4 text-orange-600" />
            <span className="text-sm">{format(new Date(value), 'MMM dd, yyyy')}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{format(new Date(value), 'MMM dd, yyyy')}</span>
        </div>
      )
    }
  ]

  if (permissionsLoading) {
    return (
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading permissions...</p>
          </div>
        </div>
      </ProcurementLayout>
    )
  }

  return (
    <ModuleGuard moduleId="procurement" subModule="rfq" fallback={
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Access Denied</p>
            <p className="text-sm text-gray-500">You don't have permission to view RFQs.</p>
          </div>
        </div>
      </ProcurementLayout>
    }>
      <ProcurementLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-3xl font-normal">Request for Quotations</h1>
              <p className="text-muted-foreground">Send RFQs to vendors and manage responses</p>
            </div>
            {permissions.canCreateRFQ && (
              <Button
                onClick={handleCreate}
                variant="gradient-create"
                className="rounded-full h-10 px-6 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create RFQ
              </Button>
            )}
          </div>

          {/* Tabs with new styling */}
          <div>
            <div className="flex items-center overflow-x-auto border-b">
              <div className="flex space-x-1 min-w-max">
                {mainTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  const count = tab.id === 'all' ? rfqsCount : tab.id === 'sent' ? rfqs.filter(r => r.status === 'SENT').length : rfqs.filter(r => r.status === 'CLOSED').length

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setCurrentPage(1)
                      }}
                      className={cn(
                        "flex items-center gap-3 px-6 py-4 text-lg font-medium rounded-t-lg border-b-2 transition-all duration-200",
                        isActive
                          ? "text-blue-600 border-blue-600"
                          : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                        isActive ? tab.gradient : "from-gray-300 to-gray-400"
                      )}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span>{tab.label}</span>
                      <Badge variant="secondary" className="ml-1">{count}</Badge>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filters Section */}
            <CardHeader className="pb-3 mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by RFQ number or title..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  {activeTab === 'all' && (
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <CiFilter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Clear Filters */}
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setCurrentPage(1)
                      }}
                      className="rounded-full h-9 px-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 mb-4">
              {/* Data Table */}
              <ProcurementDataTable
                data={getCurrentData() as any}
                columns={columns as any}
                title=""
                onView={handleView as any}
                loading={loading}
                emptyMessage="No RFQs found. Create your first RFQ to get started."
                showSearch={false}
                showFilters={false}
                usePagination="backend"
                paginationData={getPaginationData()}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
              />
            </CardContent>
          </div>

          {/* View Drawer */}
          <ProcurementDrawer
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            title={`RFQ: ${viewingRFQ?.rfqNumber || ''}`}
            description="View RFQ details, vendors, items, and quotations"
            size="xl"
            headerActions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            }
          >
            {viewingRFQ && <RFQDrawerContent rfq={viewingRFQ} />}
          </ProcurementDrawer>

          {/* Create Modal */}
          <CreateRFQModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              setIsCreateModalOpen(false)
              loadRFQs()
            }}
          />
        </div>
      </ProcurementLayout>
    </ModuleGuard>
  )
}
