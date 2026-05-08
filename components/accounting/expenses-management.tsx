"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  Plus,
  Receipt,
  Calendar,
  Building,
  Tag,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CreateExpenseModal } from "./create-expense-modal"
import { ExpenseViewDrawer } from "./expense-view-drawer"
import { DeleteExpenseDialog } from "./delete-expense-dialog"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Info,
  User
} from "lucide-react"
import { 
  fetchExpenses, 
  fetchCurrencies, 
  fetchVendors, 
  fetchExpenseCategories,
  setSelectedExpense,
  deleteExpense
} from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store"
import { Expense } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"
import { CurrencyFilter } from "./CurrencyFilter"

const tabs = [
  {
    id: "all",
    label: "All Expenses",
    icon: Receipt,
    description: "View all expenses",
    gradient: "from-blue-400 to-blue-600",
    status: undefined
  },
  {
    id: "draft",
    label: "Drafts",
    icon: Calendar,
    description: "Draft expenses",
    gradient: "from-gray-400 to-gray-600",
    status: "DRAFT"
  },
  {
    id: "posted",
    label: "Posted",
    icon: DollarSign,
    description: "Posted expenses",
    gradient: "from-green-400 to-green-600",
    status: "POSTED"
  },
  {
    id: "void",
    label: "Void",
    icon: CreditCard,
    description: "Voided expenses",
    gradient: "from-red-400 to-red-600",
    status: "VOID"
  }
]

export function ExpensesManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions } = useAccountingPermissions()
  
  const { 
    expenses = [], 
    expensesLoading = false, 
    selectedExpense = null,
    currencies = [],
    vendors = [],
    expenseCategories = [],
    selectedCurrencyId
  } = useSelector((state: RootState) => state.accounting)
  
  // Permission checks
  const canCreateExpense = permissions.canCreateExpense
  const canEditExpense = permissions.canUpdateExpense
  const canDeleteExpense = permissions.canDeleteExpense
  
  const [activeTab, setActiveTab] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  useEffect(() => {
    // Load initial data
    dispatch(fetchExpenses({ currencyId: selectedCurrencyId || undefined }))
    dispatch(fetchCurrencies())
    dispatch(fetchVendors())
    dispatch(fetchExpenseCategories())
  }, [dispatch, selectedCurrencyId])

  useEffect(() => {
    // Fetch expenses when tab changes or currency changes
    const activeTabData = tabs.find(tab => tab.id === activeTab)
    if (activeTabData) {
      dispatch(fetchExpenses({ 
        status: activeTabData.status as any,
        currencyId: selectedCurrencyId || undefined
      }))
    }
  }, [activeTab, dispatch, selectedCurrencyId])

  const handleCreateExpense = () => {
    setIsCreateModalOpen(true)
  }

  const handleViewExpense = (expense: Expense) => {
    dispatch(setSelectedExpense(expense))
    setIsViewDrawerOpen(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense)
    setIsCreateModalOpen(true)
  }

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return

    setIsDeleting(true)
    try {
      await dispatch(deleteExpense(expenseToDelete.id)).unwrap()
      toast.success("Expense deleted successfully")
      setIsDeleteDialogOpen(false)
      setExpenseToDelete(null)
      dispatch(fetchExpenses())
    } catch (error: any) {
      toast.error("Failed to delete expense", {
        description: error.message || 'Unknown error occurred'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setExpenseToEdit(null)
  }

  const handleCreateModalSuccess = () => {
    closeCreateModal()
    dispatch(fetchExpenses())
  }

  const handleCloseViewDrawer = () => {
    setIsViewDrawerOpen(false)
    dispatch(setSelectedExpense(null))
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800'
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

  const columns: Column<Expense>[] = [
    {
      key: 'description',
      label: 'Expense Details',
      sortable: true,
      render: (value, row) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewExpense(row)
          }}
          title="Click to view expense details"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
              <Receipt className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
            {row.receiptNumber && (
              <p className="text-xs text-gray-500 truncate" title={row.receiptNumber}>
                #{row.receiptNumber}
              </p>
            )}
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
                <Avatar className="h-8 w-8 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white text-xs">
                    {getInitials(value?.name || 'UN')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="right">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white">
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
                  
                  {value?.taxNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Tax Number</p>
                        <p className="text-sm font-medium">{value.taxNumber}</p>
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
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <div className="cursor-pointer hover:ring-2 hover:ring-yellow-500 hover:ring-offset-2 transition-all rounded-full">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Tag className="w-3 h-3 text-white" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" side="right">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{value?.name}</h4>
                    <p className="text-sm text-gray-500">Category Details</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {value?.description && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm font-medium leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <Badge variant="outline" className={value?.parentId ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}>
                        {value?.parentId ? "Subcategory" : "Parent Category"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={value?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {value?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm font-medium">
                        {value?.createdAt ? new Date(value.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <span className="text-sm font-medium">{value?.name}</span>
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
            handleViewExpense(row)
          }}
          title="Click to view expense details"
        >
          <div className="flex items-center gap-1 mb-1 justify-end">
            <span className="text-lg font-semibold">
              {row.currency?.symbol}{value || row.amount}
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
            handleViewExpense(row)
          }}
          title="Click to view expense details"
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
            handleViewExpense(row)
          }}
          title="Click to view expense details"
        >
          <Badge className={getStatusColor(value)}>
            <div className="flex items-center gap-1">
              {value === 'POSTED' && <CheckCircle className="w-3 h-3" />}
              {value === 'DRAFT' && <Clock className="w-3 h-3" />}
              {value === 'VOID' && <XCircle className="w-3 h-3" />}
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
            handleViewExpense(row)
          }}
          title="Click to view expense details"
        >
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
    { label: 'Posted', value: 'POSTED' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Void', value: 'VOID' }
  ]

  const bulkActions = [
    { 
      label: 'Activate', 
      value: 'activate', 
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )
    },
    { 
      label: 'Deactivate', 
      value: 'deactivate', 
      icon: (
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
          <Clock className="w-3 h-3 text-white" />
        </div>
      )
    }
  ]

  const handleBulkAction = async (selectedExpenses: Expense[], action: string) => {
    try {
      // TODO: Implement bulk actions for expenses
      console.log(`Bulk ${action} for`, selectedExpenses.length, 'expenses')
    } catch (error: any) {
      console.error(`Failed to ${action} expenses`, error)
    }
  }

  const handleExport = (data: Expense[]) => {
    const csvContent = [
      ['Description', 'Vendor', 'Category', 'Amount', 'Currency', 'Date', 'Status', 'Created'].join(','),
      ...data.map(expense => [
        expense.description,
        expense.vendor?.name || '',
        expense.category?.name || '',
        expense.totalAmount || expense.amount,
        expense.currency?.code || '',
        new Date(expense.transactionDate).toLocaleDateString(),
        expense.status,
        new Date(expense.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    console.log(`Exported ${data.length} expenses`)
  }

  const handleDateRangeChange = (dateRange: { from: Date | undefined, to: Date | undefined }) => {
    console.log('Date range changed:', dateRange)
    const params: any = {}
    
    if (dateRange.from) {
      params.dateFrom = dateRange.from.toISOString().split('T')[0]
    }
    if (dateRange.to) {
      params.dateTo = dateRange.to.toISOString().split('T')[0]
    }
    
    // Fetch expenses with date range parameters
    dispatch(fetchExpenses(params))
  }

  const getExpenseStats = () => {
    const expensesArray = expenses || []
    return {
      total: expensesArray.length,
      draft: expensesArray.filter(e => e.status === 'DRAFT').length,
      posted: expensesArray.filter(e => e.status === 'POSTED').length,
      void: expensesArray.filter(e => e.status === 'VOID').length
    }
  }

  const stats = getExpenseStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your business expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencyFilter />
          {canCreateExpense && (
            <Button
                onClick={handleCreateExpense}
                variant="gradient-create"
                className="rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Expense
            </Button>
          )}
        </div>
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
                    onClick={() => setActiveTab(tab.id)}
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
          <ProcurementDataTable
            data={expenses}
            columns={columns}
            title="Expenses"
            searchPlaceholder="Search expenses by description..."
            filterOptions={filterOptions}
            onView={handleViewExpense}
            onEdit={canEditExpense ? handleEditExpense : undefined}
            onDelete={canDeleteExpense ? handleDeleteExpense : undefined}
            onBulkAction={handleBulkAction}
            bulkActions={bulkActions}
            loading={expensesLoading}
            onExport={handleExport}
            emptyMessage="No expenses found. Create your first expense to get started."
          />
        </CardContent>
      </div>

      {/* Create/Edit Modal */}
      <CreateExpenseModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleCreateModalSuccess}
        currencies={currencies}
        vendors={vendors}
        categories={expenseCategories}
        expense={expenseToEdit}
      />

      {/* View Drawer */}
      <ExpenseViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={handleCloseViewDrawer}
        expense={selectedExpense}
      />

      {/* Delete Dialog */}
      <DeleteExpenseDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setExpenseToDelete(null)
        }}
        onConfirm={confirmDeleteExpense}
        expense={expenseToDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}