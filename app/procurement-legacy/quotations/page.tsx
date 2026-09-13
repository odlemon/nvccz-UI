// ============================================================================
// QUOTATIONS LIST PAGE (REFACTORED)
// Matches purchase-requisitions layout with filters, tabs, and data table
// ============================================================================

'use client'

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { ProcurementDrawer } from "@/components/procurement/procurement-drawer"
import { QuotationDrawerContent } from "@/components/procurement/quotation-drawer-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { fetchQuotations, selectAllQuotations, selectQuotationsState } from '@/lib/store/slices/procurementV2Slice'
import { Quotation } from "@/lib/api/procurement-api-v2"
import { CiFileOn, CiUser, CiDollar, CiCalendar, CiSearch, CiFilter } from "react-icons/ci"
import { FileText, Users, Clock, CheckCircle, XCircle, Building2, Eye, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ProcurementLayout } from "@/components/layout/procurement-layout"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { ModuleGuard } from "@/lib/permissions"

type TabConfig = {
  id: 'all' | 'submitted' | 'reviewed'
  label: string
  icon: any
  gradient: string
}

const mainTabs: TabConfig[] = [
  { 
    id: 'all', 
    label: 'All Quotations', 
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'submitted', 
    label: 'Submitted', 
    icon: Clock,
    gradient: 'from-yellow-500 to-yellow-600'
  },
  { 
    id: 'reviewed', 
    label: 'Reviewed', 
    icon: CheckCircle,
    gradient: 'from-green-500 to-green-600'
  },
]

export default function QuotationsPage() {
  const dispatch = useAppDispatch()
  const quotations = useAppSelector(selectAllQuotations)
  const { quotationsLoading: loading, quotationsCount } = useAppSelector(selectQuotationsState)
  const { permissions, moduleAccess, isLoading: permissionsLoading } = useProcurementPermissions()
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'reviewed'>('all')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load data when tab, filters, or pagination changes
  useEffect(() => {
    loadQuotations()
  }, [activeTab, searchTerm, statusFilter, currentPage, pageSize])

  const loadQuotations = async () => {
    try {
      const filters: any = { 
        limit: pageSize, 
        offset: (currentPage - 1) * pageSize 
      }
      
      if (searchTerm) filters.rfqNumber = searchTerm
      if (statusFilter !== 'all') filters.status = statusFilter

      await dispatch(fetchQuotations(filters)).unwrap()
    } catch (error: any) {
      toast.error("Error loading quotations", { description: error.message })
    }
  }

  const getCurrentData = () => {
    if (activeTab === 'submitted') return quotations.filter(q => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW')
    if (activeTab === 'reviewed') return quotations.filter(q => q.status === 'ACCEPTED' || q.status === 'REJECTED')
    return quotations
  }
  
  const getCurrentCount = () => {
    if (activeTab === 'submitted') return quotations.filter(q => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW').length
    if (activeTab === 'reviewed') return quotations.filter(q => q.status === 'ACCEPTED' || q.status === 'REJECTED').length
    return quotationsCount
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

  const handleView = (quotation: Quotation) => {
    setViewingQuotation(quotation)
    setIsDrawerOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <Clock className="w-4 h-4" />
      case 'UNDER_REVIEW': return <FileText className="w-4 h-4" />
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<Quotation>[] = [
    {
      key: 'quotationNumber',
      label: 'Quotation # / RFQ',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CiFileOn className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{value}</span>
          </div>
          <span className="text-sm text-muted-foreground">RFQ: {row.rfqNumber}</span>
        </div>
      )
    },
    {
      key: 'companyName',
      label: 'Vendor',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span className="font-medium">{value}</span>
          </div>
          <span className="text-xs text-muted-foreground">{row.vendorEmail}</span>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <CiDollar className="w-4 h-4 text-green-600" />
          <span className="font-medium">{row.currencyCode} {parseFloat(value).toLocaleString()}</span>
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
      key: 'validUntil',
      label: 'Valid Until',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-orange-600" />
          <span className="text-sm">{format(new Date(value), 'MMM dd, yyyy')}</span>
        </div>
      )
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
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
    <ModuleGuard moduleId="procurement" subModule="quotations" fallback={
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Access Denied</p>
            <p className="text-sm text-gray-500">You don't have permission to view quotations.</p>
          </div>
        </div>
      </ProcurementLayout>
    }>
    <ProcurementLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-3xl font-normal">Vendor Quotations</h1>
            <p className="text-muted-foreground">Review and compare quotations from vendors</p>
          </div>
        </div>

        {/* Tabs with new styling */}
        <div>
          <div className="flex items-center overflow-x-auto border-b">
            <div className="flex space-x-1 min-w-max">
              {mainTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const count = tab.id === 'all' ? quotationsCount : tab.id === 'submitted' ? quotations.filter(q => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW').length : quotations.filter(q => q.status === 'ACCEPTED' || q.status === 'REJECTED').length

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
                    placeholder="Search by RFQ number or vendor..."
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
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
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
                    className="rounded-full"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Data Table */}
            <ProcurementDataTable
              data={getCurrentData()}
              columns={columns}
              title=""
              onView={handleView}
              loading={loading}
              emptyMessage="No quotations found. Quotations will appear here once vendors submit them."
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
          title={`Quotation: ${viewingQuotation?.quotationNumber || ''}`}
          description="View quotation details and vendor information"
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
          {viewingQuotation && (
            <QuotationDrawerContent 
              quotation={viewingQuotation} 
              onUpdate={() => {
                loadQuotations()
                setIsDrawerOpen(false)
              }} 
            />
          )}
        </ProcurementDrawer>
      </div>
    </ProcurementLayout>
    </ModuleGuard>
  )
}
