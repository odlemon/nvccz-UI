'use client'

import { useEffect, useState } from 'react'
import { ProcurementDataTable, Column } from './procurement-data-table'
import { ProcurementDrawer } from './procurement-drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProcurementPermissions } from '@/lib/hooks/useProcurementPermissions'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { procurementApi, ProcurementInvoice } from '@/lib/api/procurement-api'
import { accountingApi } from '@/lib/api/accounting-api'
import { CiFileOn, CiDollar, CiCalendar, CiSearch, CiFilter } from 'react-icons/ci'
import { FileText, CheckCircle, Clock, AlertCircle, XCircle, Building2, Eye, X, Plus, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { InvoiceDrawerContent } from './invoice-drawer-content'
import { CreateInvoiceModal } from './create-invoice-modal'
import { ProcessPaymentModal } from './process-payment-modal'
import { format } from 'date-fns'

type TabConfig = {
  id: 'all' | 'received' | 'approved' | 'paid'
  label: string
  icon: any
  gradient: string
}

const mainTabs: TabConfig[] = [
  {
    id: 'all',
    label: 'All Invoices',
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'received',
    label: 'Received',
    icon: Clock,
    gradient: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'approved',
    label: 'Approved',
    icon: CheckCircle,
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'paid',
    label: 'Paid',
    icon: CheckCircle,
    gradient: 'from-purple-500 to-purple-600'
  }
]

export function ProcurementInvoices() {
  const { permissions } = useProcurementPermissions()
  const [invoices, setInvoices] = useState<ProcurementInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<ProcurementInvoice | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<ProcurementInvoice | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'approved' | 'paid'>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [matchingStatusFilter, setMatchingStatusFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Vendors for filter
  const [vendors, setVendors] = useState<any[]>([])

  useEffect(() => {
    // Dynamically import PDF components only on client
    import("@react-pdf/renderer").then((pdfModule) => {
      import("@/components/procurement/procurement-invoice-pdf").then((pdfComponent) => {
        setPDFComponents({
          PDFDownloadLink: pdfModule.PDFDownloadLink,
          ProcurementInvoicePDF: pdfComponent.default,
        })
      })
    })
    loadVendors()
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [activeTab, statusFilter, matchingStatusFilter, vendorFilter, currentPage, pageSize])

  const loadVendors = async () => {
    try {
      const response = await accountingApi.getVendors()
      if (response.success && response.data) {
        setVendors(response.data)
      }
    } catch (error) {
      console.error('Failed to load vendors:', error)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const params: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }

      if (statusFilter !== 'all') params.status = statusFilter
      if (matchingStatusFilter !== 'all') params.matchingStatus = matchingStatusFilter
      if (vendorFilter !== 'all') params.vendorId = vendorFilter

      const response = await procurementApi.getInvoices(params)

      if (response.success && response.data) {
        setInvoices(Array.isArray(response.data) ? response.data : [])
        setTotalCount((response as any).total || response.data.length)
      }
    } catch (error: any) {
      toast.error('Error loading invoices', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentData = () => {
    if (activeTab === 'received') return invoices.filter(inv => inv.status === 'RECEIVED')
    if (activeTab === 'approved') return invoices.filter(inv => inv.status === 'APPROVED')
    if (activeTab === 'paid') return invoices.filter(inv => inv.status === 'PAID')
    return invoices
  }

  const getCurrentCount = () => {
    if (activeTab === 'received') return invoices.filter(inv => inv.status === 'RECEIVED').length
    if (activeTab === 'approved') return invoices.filter(inv => inv.status === 'APPROVED').length
    if (activeTab === 'paid') return invoices.filter(inv => inv.status === 'PAID').length
    return totalCount
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

  const handleView = (invoice: ProcurementInvoice) => {
    setViewingInvoice(invoice)
    setIsDrawerOpen(true)
  }

  const handleCreate = () => {
    if (!permissions.canCreateInvoice) {
      toast.error("You do not have permission to create invoices")
      return
    }
    setIsCreateModalOpen(true)
  }

  const handleProcessPayment = (invoice: ProcurementInvoice) => {
    if (!permissions.canProcessPayment) {
      toast.error("You do not have permission to process payments")
      return
    }
    setSelectedInvoiceForPayment(invoice)
    setIsPaymentModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED': return <FileText className="w-4 h-4" />
      case 'PROCESSING': return <Clock className="w-4 h-4" />
      case 'MATCHED': return <CheckCircle className="w-4 h-4" />
      case 'DISCREPANCY': return <AlertCircle className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'PAID': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800'
      case 'MATCHED': return 'bg-green-100 text-green-800'
      case 'DISCREPANCY': return 'bg-orange-100 text-orange-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PAID': return 'bg-purple-100 text-purple-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchingStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      case 'MATCHED': return 'bg-green-100 text-green-800'
      case 'DISCREPANCY': return 'bg-red-100 text-red-800'
      case 'MANUAL_REVIEW': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<ProcurementInvoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice # / Vendor',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CiFileOn className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{value}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-gray-500" />
            <span className="text-sm text-muted-foreground">{row.vendor.name}</span>
          </div>
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
      key: 'matchingStatus',
      label: 'Matching',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getMatchingStatusColor(value)}>
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <CiDollar className="w-4 h-4 text-green-600" />
          <span className="font-medium">{row.currency?.symbol}{parseFloat(value || '0').toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{format(new Date(value), 'MMM dd, yyyy')}</span>
        </div>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value, row) => {
        const isOverdue = new Date(value) < new Date() && row.status !== 'PAID'
        return (
          <div className="flex items-center gap-1">
            <CiCalendar className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`} />
            <span className={cn('text-sm', isOverdue && 'text-red-600 font-medium')}>
              {format(new Date(value), 'MMM dd, yyyy')}
            </span>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-3xl font-normal">Procurement Invoices</h1>
          <p className="text-muted-foreground">Process and manage procurement invoices with OCR and AI matching</p>
        </div>
        {permissions.canCreateInvoice && (
          <Button
            onClick={handleCreate}
            className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Invoice
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
              const count = getCurrentCount()

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    'flex items-center gap-3 px-6 py-4 text-lg font-medium rounded-t-lg border-b-2 transition-all duration-200',
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200',
                    isActive ? tab.gradient : 'from-gray-300 to-gray-400'
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
                  placeholder="Search by invoice number..."
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
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="MATCHED">Matched</SelectItem>
                    <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Matching Status Filter */}
              <Select
                value={matchingStatusFilter}
                onValueChange={(value) => {
                  setMatchingStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <CiFilter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Matching status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matching</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                  <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
                </SelectContent>
              </Select>

              {/* Vendor Filter */}
              <Select
                value={vendorFilter}
                onValueChange={(value) => {
                  setVendorFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'all' || matchingStatusFilter !== 'all' || vendorFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setMatchingStatusFilter('all')
                    setVendorFilter('all')
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
            emptyMessage="No invoices found. Upload your first invoice to get started."
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
        title={`Invoice: ${viewingInvoice?.invoiceNumber || ''}`}
        description="View invoice details and manage processing status"
        size="xl"
        headerActions={
          <div className="flex items-center gap-2">
            {viewingInvoice && PDFComponents && (
              <PDFComponents.PDFDownloadLink
                document={<PDFComponents.ProcurementInvoicePDF invoice={viewingInvoice} />}
                fileName={`Invoice-${viewingInvoice.invoiceNumber}-${new Date().toISOString().split("T")[0]}.pdf`}
              >
                {({ loading: pdfLoading }: any) => (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pdfLoading}
                    className="h-8 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200"
                  >
                    <CiFileOn className={`w-4 h-4 mr-2 ${pdfLoading ? "animate-spin" : ""}`} />
                    {pdfLoading ? "..." : "Export PDF"}
                  </Button>
                )}
              </PDFComponents.PDFDownloadLink>
            )}
            {viewingInvoice && permissions.canApproveInvoice && (viewingInvoice.status === 'RECEIVED' || viewingInvoice.status === 'MATCHED') && (
              <Button
                size="sm"
                onClick={() => {
                  // This would trigger the approve dialog in the drawer content
                  // We'll need to pass this as a ref or use a different approach
                }}
                className="h-8 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
            {viewingInvoice && permissions.canProcessPayment && viewingInvoice.status === 'APPROVED' && (
              <Button
                size="sm"
                onClick={() => handleProcessPayment(viewingInvoice)}
                className="h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Banknote className="w-4 h-4 mr-2" />
                Payment
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
          </div>
        }
      >
        {viewingInvoice && (
          <InvoiceDrawerContent
            invoice={viewingInvoice}
            onUpdate={() => {
              loadInvoices()
              setIsDrawerOpen(false)
            }}
            onProcessPayment={handleProcessPayment}
            onClose={() => setIsDrawerOpen(false)}
          />
        )}
      </ProcurementDrawer>

      {/* Create Modal */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadInvoices()
        }}
      />

      {/* Process Payment Modal */}
      {selectedInvoiceForPayment && (
        <ProcessPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedInvoiceForPayment(null)
          }}
          invoice={selectedInvoiceForPayment}
          onSuccess={() => {
            setIsPaymentModalOpen(false)
            setSelectedInvoiceForPayment(null)
            loadInvoices()
          }}
        />
      )}
    </div>
  )
}
