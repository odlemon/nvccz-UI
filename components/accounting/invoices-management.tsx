"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DollarSign,
  Plus,
  FileText,
  Calendar,
  Building,
  Send,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  CalendarIcon,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Info,
  User,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { InvoiceViewDrawer } from "./invoice-view-drawer"
import { CreateInvoiceModal } from "./create-invoice-modal"
import { accountingApi } from "@/lib/api/accounting-api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useInvoices } from "@/lib/hooks/use-invoices"
import { fetchCurrencies, fetchCreditNotes } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store"
import { Invoice } from "@/lib/api/accounting-api"
import { CreditNotesManagement } from "./credit-notes-management"
import { CustomersManagement } from "./customers-management"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"
import { CurrencyFilter } from "./CurrencyFilter"

interface MockInvoice {
  id: string
  customerId: string
  amount: string
  vatAmount: string
  totalAmount: string
  currencyId: string
  transactionDate: string
  description: string
  invoiceNumber: string
  items: Array<{
    description: string
    amount?: number
    category?: string
    taxRate?: number
    quantity?: number
    unitPrice?: number
  }>
  isTaxable: boolean
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  paymentMethod: string
  exchangeRateAtCreation: string | null
  paymentCurrencyId: string | null
  amountInPaymentCurrency: string | null
  paymentDate: string | null
  journalEntryId: string
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    taxNumber: string
    contactPerson: string
    email: string
    phone: string
    address: string
    paymentTerms: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
  journalEntry: {
    id: string
    referenceNumber: string
    status: string
  }
}

const mainTabs = [
  {
    id: "invoices",
    label: "Sales Invoices",
    icon: FileText,
    description: "Manage sales invoices",
    gradient: "from-blue-400 to-blue-600"
  },
  {
    id: "credit-notes",
    label: "Credit Notes",
    icon: CreditCard,
    description: "Manage credit notes",
    gradient: "from-red-400 to-red-600"
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    description: "Manage customer accounts",
    gradient: "from-orange-400 to-orange-600"
  }
]

const tabs = [
  {
    id: "all",
    label: "All Invoices",
    icon: FileText,
    description: "View all invoices",
    gradient: "from-blue-400 to-blue-600",
    status: undefined
  },
  {
    id: "draft",
    label: "Drafts",
    icon: Calendar,
    description: "Draft invoices",
    gradient: "from-gray-400 to-gray-600",
    status: "DRAFT"
  },
  {
    id: "sent",
    label: "Sent",
    icon: Send,
    description: "Sent invoices",
    gradient: "from-purple-400 to-purple-600",
    status: "SENT"
  },
  {
    id: "paid",
    label: "Paid",
    icon: DollarSign,
    description: "Paid invoices",
    gradient: "from-green-400 to-green-600",
    status: "PAID"
  },
  {
    id: "void",
    label: "Void",
    icon: CreditCard,
    description: "Voided invoices",
    gradient: "from-red-400 to-red-600",
    status: "VOID"
  }
]

export function InvoicesManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions } = useAccountingPermissions()
  
  // Use the custom hook for invoices management
  const {
    invoices,
    customers,
    selectedInvoice,
    loading: invoicesLoading,
    customersLoading,
    error,
    filters,
    stats,
    pagination,
    loadInvoices,
    loadCustomers,
    handleCreateInvoice,
    handleUpdateInvoice,
    handleSendInvoice,
    handleMarkAsPaid,
    handleVoidInvoice,
    refreshInvoice,
    updateFilters,
    resetFilters,
    selectInvoice,
    clearErrorState
  } = useInvoices()

  // Check permissions
  const canCreateInvoice = permissions.canCreateInvoice
  const canEditInvoice = permissions.canUpdateInvoice
  const canDeleteInvoice = permissions.canDeleteInvoice
  const canMarkPaid = permissions.canMarkInvoicePaid

  // Get currencies from accounting slice
  const currencies = useSelector((state: RootState) => state.accounting.currencies || [])

  // Get credit notes from Redux state
  const { creditNotes, creditNotesLoading, creditNotesError } = useSelector((state: RootState) => ({
    creditNotes: state.accounting.creditNotes || [],
    creditNotesLoading: state.accounting.creditNotesLoading || false,
    creditNotesError: state.accounting.creditNotesError || null
  }))
  const selectedCurrencyId = useSelector((state: RootState) => state.accounting.selectedCurrencyId)

  const [activeMainTab, setActiveMainTab] = useState("invoices")
  const [activeTab, setActiveTab] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>()
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>()
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null)
  const [currentFilters, setCurrentFilters] = useState<any>({})
  const [isCreateCreditNoteModalOpen, setIsCreateCreditNoteModalOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load currencies from Redux if not already loaded
        if (currencies.length === 0) {
          dispatch(fetchCurrencies())
        }

        // Load customers
        await loadCustomers()

        // Load invoices with pagination
        const statusFilter = activeTab !== 'all' ? tabs.find(t => t.id === activeTab)?.status : undefined
        await loadInvoices({ 
          status: statusFilter,
          currencyId: selectedCurrencyId || undefined,
          page: 1,
          limit: 10
        })

        // Load credit notes when on credit notes tab
        if (activeMainTab === 'credit-notes') {
          dispatch(fetchCreditNotes({ currencyId: selectedCurrencyId || undefined }))
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [dispatch, currencies.length, activeTab, activeMainTab, loadCustomers, loadInvoices, selectedCurrencyId])

  // Load credit notes when switching to credit notes tab
  useEffect(() => {
    if (activeMainTab === 'credit-notes') {
      dispatch(fetchCreditNotes({ currencyId: selectedCurrencyId || undefined }))
    }
  }, [activeMainTab, dispatch, selectedCurrencyId])

  // Handle tab change and filter by status
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const statusFilter = tabId !== 'all' ? 
      tabs.find(t => t.id === tabId)?.status : undefined
    
    loadInvoices({ 
      status: statusFilter,
      page: 1 // Reset to first page on tab change
    })
  }

  // Handle advanced filtering from filter form
  const handleAdvancedFilter = (newFilters: Record<string, any>) => {
    const currentTabStatus = activeTab !== 'all' ? 
      tabs.find(t => t.id === activeTab)?.status : undefined
    
    const updatedFilters = {
      ...currentFilters,
      ...newFilters,
      status: newFilters.status || currentTabStatus
    }
    
    setCurrentFilters(updatedFilters)
    updateFilters(updatedFilters)
    loadInvoices({ 
      ...updatedFilters,
      page: 1 // Reset to first page on filter change
    })
  }

  // Handle search from data table
  const handleSearch = (searchQuery: string) => {
    const updatedFilters = {
      ...currentFilters,
      search: searchQuery
    }
    
    setCurrentFilters(updatedFilters)
    updateFilters(updatedFilters)
    loadInvoices({ 
      ...updatedFilters,
      page: 1 // Reset to first page on search
    })
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    const statusFilter = activeTab !== 'all' ? 
      tabs.find(t => t.id === activeTab)?.status : undefined
    
    loadInvoices({ 
      ...currentFilters,
      status: statusFilter,
      page
    })
  }

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    const statusFilter = activeTab !== 'all' ? 
      tabs.find(t => t.id === activeTab)?.status : undefined
    
    loadInvoices({ 
      ...currentFilters,
      status: statusFilter,
      limit: pageSize,
      page: 1
    })
  }

  const handleCreateInvoiceClick = () => {
    setInvoiceToEdit(null)
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setInvoiceToEdit(null)
  }

  const handleCreateModalSuccess = async () => {
    closeCreateModal()
    // Refresh invoices list
    await loadInvoices({ 
      page: 1,
      limit: 10
    })
  }

  const handleViewInvoice = (invoice: Invoice) => {
    selectInvoice(invoice)
    setIsViewDrawerOpen(true)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice)
    setIsCreateModalOpen(true)
  }

  const handleDeleteInvoice = (invoice: Invoice) => {
    // TODO: Implement delete functionality
    console.log('Delete invoice:', invoice.id)
  }

  // Wrapper functions for drawer actions
  const handleSendInvoiceFromDrawer = async (invoice: Invoice): Promise<Invoice> => {
    return await handleSendInvoice(invoice)
  }

  const handleMarkAsPaidFromDrawer = async (invoice: Invoice, data: { paymentMethod: string; paymentCurrencyId: string }): Promise<Invoice> => {
    return await handleMarkAsPaid(invoice, data)
  }

  const handleVoidInvoiceFromDrawer = async (invoice: Invoice, data: { reason: string }): Promise<Invoice> => {
    return await handleVoidInvoice(invoice, data)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-3 h-3" />
      case 'SENT':
        return <Send className="w-3 h-3" />
      case 'DRAFT':
        return <Clock className="w-3 h-3" />
      case 'VOID':
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'SENT':
        return 'bg-purple-100 text-purple-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'VOID':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'bg-yellow-100 text-yellow-800'
      case 'BANK':
        return 'bg-blue-100 text-blue-800'
      case 'CARD':
        return 'bg-purple-100 text-purple-800'
      case 'CHEQUE':
        return 'bg-green-100 text-green-800'
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

  const columns: Column<Invoice>[] = [
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
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
              <FileText className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
            {/* <p
              className="text-xs text-gray-500 truncate"
              title={row.description || "No description"}
            >
              {row.description
                ? row.description.length > 80
                  ? `${row.description.slice(0, 80)}…`
                  : row.description
                : "No description"}
            </p> */}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <div className="cursor-pointer">
                <Avatar className="h-8 w-8 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-xs">
                    {getInitials(value?.name || 'UN')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="right">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                      {getInitials(value?.name || 'UN')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-lg">{value?.name}</h4>
                    <p className="text-sm text-gray-500">Customer Details</p>
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
          <div className="flex items-center gap-2 justify-end">
            <Badge variant="outline" className={getPaymentMethodColor(row.paymentMethod)}>
              {row.paymentMethod}
            </Badge>
          </div>
        </div>
      )
    },
    {
      key: 'transactionDate',
      label: 'Date',
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
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewInvoice(row)
          }}
          title="Click to view invoice details"
        >
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Void', value: 'VOID' }
  ]

  const customFilterOptions = [
    {
      key: 'customerId',
      label: 'Customer',
      type: 'select' as const,
      options: customers.map(customer => ({
        label: customer.name,
        value: customer.id
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
    }
  ]

  const bulkActions = [
    {
      label: 'Send Selected',
      value: 'send',
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
          <Send className="w-3 h-3 text-white" />
        </div>
      )
    },
    {
      label: 'Mark as Paid',
      value: 'mark-paid',
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )
    }
  ]

  const handleBulkAction = async (selectedInvoices: Invoice[], action: string) => {
    try {
      // TODO: Implement bulk actions for invoices
      console.log(`Bulk ${action} for`, selectedInvoices.length, 'invoices')
    } catch (error: any) {
      console.error(`Failed to ${action} invoices`, error)
    }
  }

  const handleExport = (data: Invoice[]) => {
    const csvContent = [
      ['Invoice Number', 'Customer', 'Amount', 'Currency', 'Date', 'Status', 'Created'].join(','),
      ...data.map(invoice => [
        invoice.invoiceNumber,
        invoice.customer?.name || '',
        invoice.totalAmount,
        invoice.currency?.code || '',
        new Date(invoice.transactionDate).toLocaleDateString(),
        invoice.status,
        new Date(invoice.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    console.log(`Exported ${data.length} invoices`)
  }

  return (
    <div className="space-y-6">
      {/* Main Tab Navigation - Moved to top */}
      <div className="flex items-center overflow-x-auto border-b">
        <div className="flex space-x-1 min-w-max">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeMainTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 text-lg font-medium rounded-t-lg border-b-2 transition-all duration-200",
                  isActive
                    ? "text-blue-600 border-blue-600 "
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
              </button>
            )
          })}
        </div>
      </div>

      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          {/* Tab-specific content */}
        </div>
        <div className="flex items-center gap-3">
          <CurrencyFilter />
          {activeMainTab === "invoices" && canCreateInvoice && (
            <Button
              onClick={handleCreateInvoiceClick}
              variant="gradient-create"
              className="rounded-full h-10 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          )}
          {activeMainTab === "credit-notes" && canCreateInvoice && (
            <Button
              onClick={() => setIsCreateCreditNoteModalOpen(true)}
              variant="gradient-danger"
              className="rounded-full h-10 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Credit Note
            </Button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeMainTab === "invoices" && (
          <>
            {/* Stats Cards - now using stats from the hook */}
            {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const count = tab.id === 'all' ? stats.total :
                  tab.id === 'draft' ? stats.draft :
                    tab.id === 'sent' ? stats.sent :
                      tab.id === 'paid' ? stats.paid : stats.void

                const totalAmount = tab.id === 'all' ? stats.totalAmount :
                  tab.id === 'draft' ? stats.draftAmount :
                    tab.id === 'sent' ? stats.sentAmount :
                      tab.id === 'paid' ? stats.paidAmount : stats.voidAmount

                return (
                  <Card
                    key={tab.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow h-[90px] border-gray-200 shadow-sm relative"
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <CardContent className="p-3 h-full flex items-center">
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
                          tab.gradient
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-semibold">{count}</p>
                          <p className="text-base font-semibold text-green-600 mt-1">
                            ${totalAmount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "absolute top-2 right-2 rounded-full text-xs border-0",
                        tab.id === 'all' ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700" :
                          tab.id === 'draft' ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700" :
                            tab.id === 'sent' ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700" :
                              tab.id === 'paid' ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700" :
                                "bg-gradient-to-r from-red-50 to-red-100 text-red-700"
                      )}>
                        {tab.label}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div> */}

            {/* Invoice Tab Navigation */}
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
                              ? "text-blue-600 border-blue-600"
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
                {/* Advanced Filters - Collapsible */}
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="mb-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-gray-500 transition-transform duration-200",
                            isFiltersOpen ? "rotate-180" : ""
                          )} />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {/* Search Input */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Search</Label>
                            <Input
                              placeholder="Search invoices..."
                              className="rounded-full text-sm"
                              onChange={(e) => handleAdvancedFilter({ search: e.target.value })}
                            />
                          </div>

                          {/* Customer Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Customer</Label>
                            <Select onValueChange={(value) => handleAdvancedFilter({ customerId: value === 'all' ? undefined : value })}>
                              <SelectTrigger className="rounded-full text-sm">
                                <SelectValue placeholder="All Customers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Currency Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Currency</Label>
                            <Select onValueChange={(value) => handleAdvancedFilter({ currencyId: value === 'all' ? undefined : value })}>
                              <SelectTrigger className="rounded-full text-sm">
                                <SelectValue placeholder="All Currencies" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Currencies</SelectItem>
                                {currencies.map((currency) => (
                                  <SelectItem key={currency.id} value={currency.id}>
                                    {currency.code} - {currency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Start Date Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal rounded-full text-sm h-9",
                                    !selectedStartDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedStartDate ? format(selectedStartDate, "MMM dd, yyyy") : "Select start date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedStartDate}
                                  onSelect={(date) => {
                                    setSelectedStartDate(date)
                                    if (date) {
                                      const formattedDate = format(date, "yyyy-MM-dd")
                                      handleAdvancedFilter({ startDate: formattedDate })
                                    } else {
                                      handleAdvancedFilter({ startDate: undefined })
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* End Date Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">End Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal rounded-full text-sm h-9",
                                    !selectedEndDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedEndDate ? format(selectedEndDate, "MMM dd, yyyy") : "Select end date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedEndDate}
                                  onSelect={(date) => {
                                    setSelectedEndDate(date)
                                    if (date) {
                                      const formattedDate = format(date, "yyyy-MM-dd")
                                      handleAdvancedFilter({ endDate: formattedDate })
                                    } else {
                                      handleAdvancedFilter({ endDate: undefined })
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Status: {activeTab !== 'all' ? tabs.find(t => t.id === activeTab)?.label : 'All'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentFilters({})
                              setSelectedStartDate(undefined)
                              setSelectedEndDate(undefined)
                              const statusFilter = activeTab !== 'all' ?
                                tabs.find(t => t.id === activeTab)?.status : undefined
                              loadInvoices({ status: statusFilter as 'DRAFT' | 'SENT' | 'PAID' | 'VOID' | undefined })
                            }}
                            className="rounded-full text-xs"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                <ProcurementDataTable
                  data={invoices}
                  columns={columns}
                  title="Sales Invoices"
                  filterOptions={filterOptions}
                  onView={handleViewInvoice}
                  onEdit={handleEditInvoice}
                  onDelete={handleDeleteInvoice}
                  onBulkAction={handleBulkAction}
                  bulkActions={bulkActions}
                  loading={invoicesLoading}
                  onExport={handleExport}
                  showSearch={false}
                  showFilters={false}
                  emptyMessage="No invoices found. Create your first invoice to get started."
                  usePagination="backend"
                  paginationData={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </CardContent>
            </div>
          </>
        )}

        {activeMainTab === "credit-notes" && (
          <CreditNotesManagement
            isCreateModalOpen={isCreateCreditNoteModalOpen}
            onCreateModalClose={() => setIsCreateCreditNoteModalOpen(false)}
          />
        )}

        {activeMainTab === "customers" && (
          <CustomersManagement />
        )}
      </div>

      {/* Invoice View Drawer */}
      <InvoiceViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          selectInvoice(null)
        }}
        invoice={selectedInvoice}
        onSend={handleSendInvoiceFromDrawer}
        onMarkAsPaid={handleMarkAsPaidFromDrawer}
        onVoid={handleVoidInvoiceFromDrawer}
        onEdit={handleEditInvoice}
        onRefresh={refreshInvoice}
        currencies={currencies}
      />

      {/* Create/Edit Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleCreateModalSuccess}
        onCustomerCreated={loadCustomers}
        currencies={currencies}
        customers={customers as any}
        invoice={invoiceToEdit}
      />
    </div>
  )
}