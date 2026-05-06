"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { ProcurementDrawer } from "./procurement-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  fetchRequisitions,
  fetchMyRequisitions,
  fetchPendingApprovalRequisitions,
  fetchInvesteeRequisitions,
  fetchSlaBreachedRequisitions,
  setRequisitionFilters
} from "@/lib/store/slices/procurementV2Slice"
import { PurchaseRequisition } from "@/lib/api/procurement-api-v2"
import { CiFileOn, CiUser, CiDollar, CiCalendar, CiSearch, CiFilter } from "react-icons/ci"
import { FileText, CheckCircle, Clock, AlertCircle, Send, XCircle, Eye, Edit, X, ShoppingCart, Plus, Building2 } from "lucide-react"
import { CreateRequisitionModal } from "./create-requisition-modal"
import { CreateRFQModal } from "./create-rfq-modal"
import { RequisitionTimeline } from "./requisition-timeline"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type TabConfig = {
  id: 'all' | 'my' | 'pending' | 'investee'
  label: string
  icon: any
  gradient: string
}

const mainTabs: TabConfig[] = [
  {
    id: 'all',
    label: 'My Sent requisitions',
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'my',
    label: 'My Requisitions',
    icon: CiUser,
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'pending',
    label: 'Pending Approval',
    icon: Clock,
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'investee',
    label: 'Investee PRs',
    icon: Building2,
    gradient: 'from-violet-500 to-violet-600'
  },
]

export function PurchaseRequisitions() {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const {
    requisitions,
    myRequisitions,
    pendingApprovalRequisitions,
    investeeRequisitions,
    investeeRequisitionsCount,
    slaBreachedRequisitions,
    requisitionsLoading,
    investeeRequisitionsLoading,
    requisitionsCount,
    myRequisitionsCount,
    pendingApprovalCount,
    filters
  } = useAppSelector(state => state.procurementV2)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingRequisition, setViewingRequisition] = useState<PurchaseRequisition | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateRFQModalOpen, setIsCreateRFQModalOpen] = useState(false)
  const [selectedRequisitionForRFQ, setSelectedRequisitionForRFQ] = useState<string | null>(null)
  const [isInvesteeMode, setIsInvesteeMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'pending' | 'investee'>('all')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load data when tab, filters, or pagination changes
  useEffect(() => {
    loadRequisitions()
  }, [activeTab, searchTerm, statusFilter, priorityFilter, currentPage, pageSize])

  const loadRequisitions = async () => {
    try {
      const filters: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }

      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== 'all') filters.status = statusFilter
      if (priorityFilter !== 'all') filters.priority = priorityFilter

      await dispatch(fetchRequisitions(filters)).unwrap()
      await dispatch(fetchMyRequisitions()).unwrap()
      await dispatch(fetchPendingApprovalRequisitions()).unwrap()

      if (activeTab === 'investee') {
        await dispatch(fetchInvesteeRequisitions()).unwrap()
      }

      if (permissions.canApprovePurchaseRequisition) {
        await dispatch(fetchSlaBreachedRequisitions()).unwrap()
      }
    } catch (error: any) {
      toast.error("Error loading requisitions", { description: error.message })
    }
  }

  const getCurrentData = () => {
    if (activeTab === 'my') return myRequisitions
    if (activeTab === 'pending') return pendingApprovalRequisitions
    if (activeTab === 'investee') return investeeRequisitions
    return requisitions
  }

  const getCurrentCount = () => {
    if (activeTab === 'my') return myRequisitionsCount
    if (activeTab === 'pending') return pendingApprovalCount
    if (activeTab === 'investee') return investeeRequisitionsCount
    return requisitionsCount
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

  const handleView = (requisition: PurchaseRequisition) => {
    setViewingRequisition(requisition)
    setIsDrawerOpen(true)
  }

  const handleCreate = () => {
    setIsInvesteeMode(activeTab === 'investee')
    setIsCreateModalOpen(true)
  }

  const handleEdit = (requisition: PurchaseRequisition) => {
    if (!permissions.canUpdatePurchaseRequisition) {
      toast.error("You do not have permission to edit requisitions")
      return
    }
    setViewingRequisition(requisition)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (requisition: PurchaseRequisition) => {
    if (!permissions.canDeletePurchaseRequisition) {
      toast.error("You do not have permission to delete requisitions")
      return
    }
    if (!confirm(`Are you sure you want to delete requisition ${requisition.requisitionNumber}?`)) {
      return
    }

    try {
      // TODO: Implement delete API call
      toast.success("Requisition deleted successfully")
      loadRequisitions()
    } catch (error: any) {
      toast.error("Failed to delete requisition", { description: error.message })
    }
  }

  const handleCreateRFQ = async (requisitionId: string) => {
    if (!permissions.canCreateRFQ) {
      toast.error("You do not have permission to create RFQs")
      return
    }
    setSelectedRequisitionForRFQ(requisitionId)
    setIsCreateRFQModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />
      case 'PENDING_APPROVAL': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'CONVERTED_TO_PO': return <ShoppingCart className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'CONVERTED_TO_PO': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusProgress = (status: string) => {
    const statusOrder = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONVERTED_TO_PO', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(status)
    if (currentIndex === -1) return 0
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100)
  }

  const columns: Column<PurchaseRequisition>[] = [
    {
      key: 'requisitionNumber',
      label: 'Requisition # / Title',
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
      key: 'requestedBy',
      label: 'Requested By',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <CiUser className="w-4 h-4 text-gray-600" />
          <span>{value.firstName} {value.lastName}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status & Progress',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="space-y-2">
          <Badge className={getStatusColor(value)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(value)}
              {value.replace('_', ' ')}
            </div>
          </Badge>
          <div className="w-full">
            <Progress value={getStatusProgress(value)} className="h-1" />
            <span className="text-xs text-gray-500">{getStatusProgress(value)}%</span>
          </div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Total Items',
      sortable: false,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiFileOn className="w-4 h-4 text-green-600" />
          <span className="font-medium">{value?.length || 0} items</span>
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
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ]

  const filteredBulkActions = useMemo(() => {
    return [
      {
        label: 'Submit for Approval',
        value: 'submit',
        icon: <Send className="w-4 h-4 mr-1" />,
        show: permissions.canUpdatePurchaseRequisition
      },
      {
        label: 'Approve',
        value: 'approve',
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        show: permissions.canApprovePurchaseRequisition
      }
    ].filter(action => action.show)
  }, [permissions])

  const handleBulkAction = (selectedRequisitions: PurchaseRequisition[], action: string) => {
    toast.info(`Bulk action: ${action} on ${selectedRequisitions.length} requisitions`)
  }

  const handleExport = (data: PurchaseRequisition[]) => {
    toast.success(`Exporting ${data.length} requisitions`)
  }

  return (
    <div className="space-y-6">
      {/* SLA Breach Alert Banner */}
      {permissions.canApprovePurchaseRequisition && slaBreachedRequisitions.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">SLA Breach Alert</h3>
              <p className="text-sm text-amber-800 mt-1">
                {slaBreachedRequisitions.length} investee PR(s) have exceeded their VC review SLA (48 hours). Immediate action required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-3xl font-normal">Purchase Requisitions</h1>
          <p className="text-muted-foreground">Create and manage purchase requisitions with approval workflow</p>
        </div>
        {activeTab === 'investee' ? (
          <Button
            onClick={handleCreate}
            className="rounded-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Investee PR
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Requisition
          </Button>
        )}
      </div>

      {/* Tabs with new styling */}
      <div>
        <div className="flex items-center overflow-x-auto border-b ">
          <div className="flex space-x-1 min-w-max">
            {mainTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              let count = requisitionsCount
              if (tab.id === 'my') count = myRequisitionsCount
              else if (tab.id === 'pending') count = pendingApprovalCount
              else if (tab.id === 'investee') count = investeeRequisitionsCount
              const showTab = tab.id !== 'investee' || permissions.canApprovePurchaseRequisition

              if (!showTab) return null

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as 'all' | 'my' | 'pending' | 'investee')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                    isActive
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                    isActive ? tab.gradient : "from-gray-300 to-gray-400"
                  )}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span>{tab.label}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{count}</Badge>
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
                  placeholder="Search by requisition number, title, or description..."
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
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CONVERTED_TO_PO">Converted to PO</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Priority Filter */}
              {activeTab === 'all' && (
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => {
                    setPriorityFilter(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-48">
                    <CiFilter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setCurrentPage(1)
                  }}
                  className="rounded-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              onClick={() => handleExport(getCurrentData())}
              className="rounded-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Data Table */}
          <ProcurementDataTable
            data={getCurrentData()}
            columns={columns}
            title=""
            onView={handleView}
            onEdit={permissions.canUpdatePurchaseRequisition ? handleEdit : undefined}
            onDelete={permissions.canDeletePurchaseRequisition ? handleDelete : undefined}
            onBulkAction={handleBulkAction}
            bulkActions={filteredBulkActions}
            loading={requisitionsLoading}
            onExport={handleExport}
            emptyMessage="No requisitions found. Create your first purchase requisition to get started."
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
        title={`Requisition: ${viewingRequisition?.requisitionNumber || ''}`}
        description="View requisition details and manage approval workflow"
        size="xl"
        headerActions={
          <>
            {viewingRequisition?.status === 'DRAFT' && permissions.canUpdatePurchaseRequisition && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-3 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDrawerOpen(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </>
        }
      >
        {viewingRequisition && (
          <RequisitionTimeline
            requisitionId={viewingRequisition.id}
            onCreateRFQ={handleCreateRFQ}
            onSuccess={loadRequisitions}
          />
        )}
      </ProcurementDrawer>

      {/* Create Modal */}
      <CreateRequisitionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setIsInvesteeMode(false)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setIsInvesteeMode(false)
          loadRequisitions()
        }}
        isInvesteeMode={isInvesteeMode}
      />

      {/* Edit Modal */}
      {viewingRequisition && (
        <CreateRequisitionModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            loadRequisitions()
          }}
          editMode={true}
          requisitionId={viewingRequisition.id}
        />
      )}

      {/* Create RFQ Modal */}
      <CreateRFQModal
        isOpen={isCreateRFQModalOpen}
        onClose={() => {
          setIsCreateRFQModalOpen(false)
          setSelectedRequisitionForRFQ(null)
        }}
        onSuccess={() => {
          setIsCreateRFQModalOpen(false)
          setSelectedRequisitionForRFQ(null)
          setIsDrawerOpen(false)
          toast.success('RFQ created successfully')
          loadRequisitions()
        }}
        preSelectedRequisitionId={selectedRequisitionForRFQ || undefined}
      />
    </div>
  )
}
