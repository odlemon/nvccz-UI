"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Plus,
  FileText,
  Calendar,
  Send,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  CalendarIcon,
  Mail,
  Phone,
  MapPin,
  Info,
  User,
  DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { CreatePurchaseInvoiceModal } from "./create-purchase-invoice-modal"
import { PurchaseInvoiceViewDrawer } from "./purchase-invoice-view-drawer"
import { fetchCurrencies, fetchVendors } from "@/lib/store/slices/accountingSlice"
import { usePurchaseInvoices } from "@/lib/hooks/use-purchase-invoices"
import type { RootState, AppDispatch } from "@/lib/store"
import { PurchaseInvoice } from "@/lib/api/accounting-api"

const tabs = [
  {
    id: "all",
    label: "All Invoices",
    icon: FileText,
    description: "View all purchase invoices",
    gradient: "from-orange-400 to-orange-600",
    status: undefined,
    paymentStatus: undefined
  },
  {
    id: "draft",
    label: "Drafts",
    icon: Calendar,
    description: "Draft invoices",
    gradient: "from-gray-400 to-gray-600",
    status: "DRAFT",
    paymentStatus: undefined
  },
  {
    id: "posted",
    label: "Posted",
    icon: Send,
    description: "Posted invoices",
    gradient: "from-blue-400 to-blue-600",
    status: "POSTED",
    paymentStatus: undefined
  },
  {
    id: "pending",
    label: "Pending Payment",
    icon: Clock,
    description: "Awaiting payment",
    gradient: "from-yellow-400 to-yellow-600",
    status: undefined,
    paymentStatus: "PENDING"
  },
  {
    id: "paid",
    label: "Paid",
    icon: CheckCircle,
    description: "Paid invoices",
    gradient: "from-green-400 to-green-600",
    status: undefined,
    paymentStatus: "PAID"
  }
]

export function PayablesManagement() {
  const dispatch = useDispatch<AppDispatch>()
  
  const {
    purchaseInvoices,
    selectedPurchaseInvoice,
    loading,
    error,
    filters,
    stats,
    pagination,
    loadPurchaseInvoices,
    handleSubmitPurchaseInvoice,
    handlePayPurchaseInvoice,
    refreshPurchaseInvoice,
    updateFilters,
    resetFilters,
    selectPurchaseInvoice,
    clearErrorState
  } = usePurchaseInvoices()

  const currencies = useSelector((state: RootState) => state.accounting.currencies || [])
  const vendors = useSelector((state: RootState) => state.accounting.vendors || [])

  const [activeTab, setActiveTab] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>()
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>()
  const [currentFilters, setCurrentFilters] = useState<any>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        if (currencies.length === 0) {
          dispatch(fetchCurrencies())
        }
        if (vendors.length === 0) {
          dispatch(fetchVendors())
        }

        const statusFilter = activeTab !== 'all' ? tabs.find(t => t.id === activeTab)?.status : undefined
        const paymentStatusFilter = activeTab !== 'all' ? tabs.find(t => t.id === activeTab)?.paymentStatus : undefined
        
        await loadPurchaseInvoices({ 
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          page: 1,
          limit: 10
        })
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [dispatch, currencies.length, vendors.length, activeTab, loadPurchaseInvoices])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const tab = tabs.find(t => t.id === tabId)
    
    loadPurchaseInvoices({ 
      status: tab?.status,
      paymentStatus: tab?.paymentStatus,
      page: 1
    })
  }

  const handleAdvancedFilter = (newFilters: Record<string, any>) => {
    const currentTab = tabs.find(t => t.id === activeTab)
    
    const updatedFilters = {
      ...currentFilters,
      ...newFilters,
      status: newFilters.status || currentTab?.status,
      paymentStatus: newFilters.paymentStatus || currentTab?.paymentStatus
    }
    
    setCurrentFilters(updatedFilters)
    updateFilters(updatedFilters)
    loadPurchaseInvoices({ 
      ...updatedFilters,
      page: 1
    })
  }

  const handleSearch = (searchQuery: string) => {
    const updatedFilters = {
      ...currentFilters,
      search: searchQuery
    }
    
    setCurrentFilters(updatedFilters)
    updateFilters(updatedFilters)
    loadPurchaseInvoices({ 
      ...updatedFilters,
      page: 1
    })
  }

  const handlePageChange = (page: number) => {
    const tab = tabs.find(t => t.id === activeTab)
    
    loadPurchaseInvoices({ 
      ...currentFilters,
      status: tab?.status,
      paymentStatus: tab?.paymentStatus,
      page
    })
  }

  const handlePageSizeChange = (pageSize: number) => {
    const tab = tabs.find(t => t.id === activeTab)
    
    loadPurchaseInvoices({ 
      ...currentFilters,
      status: tab?.status,
      paymentStatus: tab?.paymentStatus,
      limit: pageSize,
      page: 1
    })
  }

  const handleCreateInvoiceClick = () => {
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleCreateModalSuccess = async () => {
    closeCreateModal()
    await loadPurchaseInvoices({ 
      page: 1,
      limit: 10
    })
  }

  const handleViewInvoice = (invoice: PurchaseInvoice) => {
    selectPurchaseInvoice(invoice)
    setIsViewDrawerOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'POSTED':
        return <CheckCircle className="w-3 h-3" />
      case 'DRAFT':
        return <Clock className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const columns: Column<PurchaseInvoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice Details',
      sortable: true,
      render: (value, row) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs">
              <FileText className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <div className="cursor-pointer">
                <Avatar className="h-8 w-8 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xs">
                    {getInitials(value?.name || 'UN')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="right">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                      {getInitials(value?.name || 'UN')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-lg">{value?.name}</h4>
                    <p className="text-sm text-gray-500">Vendor Details</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {value?.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Contact Person</p>
                        <p className="text-sm font-medium">{value.contactPerson}</p>
                      </div>
                    </div>
                  )}

                  {value?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{value.email}</p>
                      </div>
                    </div>
                  )}

                  {value?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{value.phone}</p>
                      </div>
                    </div>
                  )}

                  {value?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium leading-relaxed">{value.address}</p>
                      </div>
                    </div>
                  )}

                  {value?.paymentTerms && (
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Payment Terms</p>
                        <Badge variant="outline" className="text-xs">
                          {value.paymentTerms}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value?.name}>
              {value?.name}
            </span>
            {value?.contactPerson && (
              <p className="text-xs text-gray-500 truncate" title={value.contactPerson}>
                {value.contactPerson}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => (
        <div
          className="text-right cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <div className="flex items-center gap-1 mb-1 justify-end">
            <span className="text-lg font-semibold">
              {row.currency?.symbol}{value}
            </span>
          </div>
          {row.paymentStatus === 'PAID' && (
            <div className="text-xs text-gray-500">
              Outstanding: {row.currency?.symbol}{row.outstandingAmount}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      sortable: true,
      render: (value, row) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value, row) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors inline-block"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <Badge className={getStatusColor(value)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(value)}
              {value}
            </div>
          </Badge>
        </div>
      )
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors inline-block"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <Badge className={getPaymentStatusColor(value)}>
            {value}
          </Badge>
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Posted', value: 'POSTED' }
  ]

  const paymentFilterOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Paid', value: 'PAID' }
  ]

  const customFilterOptions = [
    {
      key: 'vendorId',
      label: 'Vendor',
      type: 'select' as const,
      options: vendors.map(vendor => ({
        label: vendor.name,
        value: vendor.id
      }))
    },
    {
      key: 'currencyId',
      label: 'Currency',
      type: 'select' as const,
      options: currencies.map(currency => ({
        label: `${currency.code} - ${currency.name}`,
        value: currency.id
      }))
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date' as const
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'date' as const
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: filterOptions
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select' as const,
      options: paymentFilterOptions
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accounts Payable</h2>
          <p className="text-gray-500">Manage vendor purchase invoices</p>
        </div>
        <Button
          onClick={handleCreateInvoiceClick}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Purchase Invoice
        </Button>
      </div>

      {/* Tab Navigation */}
      <div>
        <CardHeader className="pb-0">
          <div className="flex items-center overflow-x-auto border-b">
            <div className="flex space-x-1 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                      isActive
                        ? "text-orange-600 border-orange-600"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                      isActive ? tab.gradient : "from-gray-300 to-gray-400"
                    )}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Advanced Filters */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="mb-6">
            <Card className="border border-gray-200 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-orange-600" />
                      <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-gray-500 transition-transform",
                      isFiltersOpen && "transform rotate-180"
                    )} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    {customFilterOptions.map((option) => (
                      <div key={option.key} className="space-y-2">
                        <Label className="text-xs">{option.label}</Label>
                        {option.type === 'select' && (
                          <Select
                            value={currentFilters[option.key] || ''}
                            onValueChange={(value) => {
                              handleAdvancedFilter({ [option.key]: value })
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={`Select ${option.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {option.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {option.type === 'date' && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-9 justify-start text-left font-normal",
                                  !currentFilters[option.key] && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentFilters[option.key] ? (
                                  format(new Date(currentFilters[option.key]), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={currentFilters[option.key] ? new Date(currentFilters[option.key]) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    handleAdvancedFilter({ [option.key]: format(date, "yyyy-MM-dd") })
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentFilters({})
                        resetFilters()
                        loadPurchaseInvoices({ page: 1 })
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Data Table */}
          <ProcurementDataTable
            data={purchaseInvoices}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search by invoice number, vendor..."
            usePagination="backend"
            paginationData={{
              total: pagination.total,
              page: pagination.page,
              limit: pagination.limit || 10,
              totalPages: pagination.totalPages
            }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            title="Purchase Invoices"
            showActions={false}
            showFilters={false}
          />
        </CardContent>
      </div>

      {/* Modals and Drawers */}
      <CreatePurchaseInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleCreateModalSuccess}
        currencies={currencies}
        vendors={vendors}
      />

      <PurchaseInvoiceViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        invoice={selectedPurchaseInvoice}
        currencies={currencies}
        onSubmit={handleSubmitPurchaseInvoice}
        onPay={handlePayPurchaseInvoice}
        onRefresh={refreshPurchaseInvoice}
      />
    </div>
  )
}
