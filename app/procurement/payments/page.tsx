'use client'

import { useEffect, useState } from 'react'
import { ProcurementDataTable, Column } from '@/components/procurement/procurement-data-table'
import { ProcurementDrawer } from '@/components/procurement/procurement-drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { procurementApi } from '@/lib/api/procurement-api'
import { accountingApi } from '@/lib/api/accounting-api'
import { CiFileOn, CiDollar, CiCalendar, CiSearch, CiFilter } from 'react-icons/ci'
import { FileText, Banknote, CheckCircle, Building2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PaymentDrawerContent } from '@/components/procurement/payment-drawer-content'
import { ProcurementLayout } from '@/components/layout/procurement-layout'
import { format } from 'date-fns'
import { useProcurementPermissions } from '@/lib/hooks/useProcurementPermissions'
import { ModuleGuard } from '@/lib/permissions'

type TabConfig = {
  id: 'all' | 'paid' | 'partial'
  label: string
  icon: any
  gradient: string
}

const mainTabs: TabConfig[] = [
  {
    id: 'all',
    label: 'All Payments',
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'paid',
    label: 'Paid',
    icon: CheckCircle,
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'partial',
    label: 'Partially Paid',
    icon: Banknote,
    gradient: 'from-yellow-500 to-yellow-600'
  }
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'partial'>('all')
  const [totalCount, setTotalCount] = useState(0)
  const { permissions, moduleAccess, isLoading: permissionsLoading } = useProcurementPermissions()
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Vendors for filter
  const [vendors, setVendors] = useState<any[]>([])

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    loadPayments()
  }, [activeTab, paymentStatusFilter, paymentMethodFilter, vendorFilter, startDate, endDate, currentPage, pageSize])

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

  const loadPayments = async () => {
    try {
      setLoading(true)
      const params: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }

      if (paymentStatusFilter !== 'all') params.paymentStatus = paymentStatusFilter
      if (paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter
      if (vendorFilter !== 'all') params.vendorId = vendorFilter
      if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd')
      if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd')

      const response = await procurementApi.getPayments(params)
      
      if (response.success && response.data) {
        const paymentsData = response.data.payments || []
        setPayments(paymentsData)
        setTotalCount(response.data.total || paymentsData.length)
      }
    } catch (error: any) {
      toast.error('Error loading payments', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentData = () => {
    if (activeTab === 'paid') return payments.filter(p => p.paymentStatus === 'PAID')
    if (activeTab === 'partial') return payments.filter(p => p.paymentStatus === 'PARTIALLY_PAID')
    return payments
  }

  const getCurrentCount = () => {
    if (activeTab === 'paid') return payments.filter(p => p.paymentStatus === 'PAID').length
    if (activeTab === 'partial') return payments.filter(p => p.paymentStatus === 'PARTIALLY_PAID').length
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

  const handleView = (payment: any) => {
    setViewingPayment(payment)
    setIsDrawerOpen(true)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<any>[] = [
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
      key: 'paymentStatus',
      label: 'Payment Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getPaymentStatusColor(value)}>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {value?.replace('_', ' ')}
          </div>
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
          <span className="font-medium">{row.currency.symbol}{parseFloat(value || '0').toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'paymentReference',
      label: 'Reference',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-mono">{value || 'N/A'}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-gray-600" />
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
    <ModuleGuard moduleId="procurement" subModule="payments" fallback={
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Access Denied</p>
            <p className="text-sm text-gray-500">You don't have permission to view payments.</p>
          </div>
        </div>
      </ProcurementLayout>
    }>
    <ProcurementLayout>
      <div className="space-y-6 ">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-normal">Procurement Payments</h1>
            <p className="text-muted-foreground">View and manage all procurement payments</p>
          </div>
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
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
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

              {/* Payment Status Filter */}
              <Select
                value={paymentStatusFilter}
                onValueChange={(value) => {
                  setPaymentStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <CiFilter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Method Filter */}
              <Select
                value={paymentMethodFilter}
                onValueChange={(value) => {
                  setPaymentMethodFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <Banknote className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
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

              {/* Date Range Filters */}
              <div className="flex items-center gap-2">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Start Date</Label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Start date"
                    allowFutureDates={true}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">End Date</Label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="End date"
                    allowFutureDates={true}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || paymentStatusFilter !== 'all' || paymentMethodFilter !== 'all' || vendorFilter !== 'all' || startDate || endDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setPaymentStatusFilter('all')
                    setPaymentMethodFilter('all')
                    setVendorFilter('all')
                    setStartDate(undefined)
                    setEndDate(undefined)
                    setCurrentPage(1)
                  }}
                  className="rounded-full"
                >
                  Clear Filters
                </Button>
              )}
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
              emptyMessage="No payments found."
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
          title={`Payment: ${viewingPayment?.paymentReference || ''}`}
          description="View payment details"
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
          {viewingPayment && (
            <PaymentDrawerContent payment={viewingPayment} />
          )}
        </ProcurementDrawer>
      </div>
    </ProcurementLayout>
    </ModuleGuard>
  )
}
