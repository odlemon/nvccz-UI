"use client"

import { useEffect, useRef, useState } from "react"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Mail,
  Phone,
  MapPin,
  User,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { CreateCustomerModal } from "./create-customer-modal"
import { ViewCustomerModal } from "./view-customer-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { accountingApi, Customer, CreateCustomerRequest } from "@/lib/api/accounting-api"
import { CustomerViewDrawer } from "./customer-view-drawer"
import { AccountingExportControls } from "./accounting-export-controls"
import { BulkReceivablesUploadModal } from "./bulk-receivables-upload-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

// Export the type for use in other components
export type { Customer }

export function CustomersManagement({ enhanced = false }: { enhanced?: boolean }) {
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateCustomer = permissions.canCreateCustomer
  const canEditCustomer = permissions.canUpdateCustomer
  const canDeleteCustomer = permissions.canDeleteCustomer
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [search, setSearch] = useState("")
  const [bulkOpen, setBulkOpen] = useState(false)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const requestSeq = useRef(0)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null)
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<Customer | null>(null)
  const [selectedCustomerForDelete, setSelectedCustomerForDelete] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async (page = pagination.page, limit = pagination.limit, query = search) => {
    const seq = ++requestSeq.current
    try {
      setCustomersLoading(true)
      const response = await accountingApi.getCustomers(enhanced ? { page, limit, search: query || undefined } : { limit: 10000 })
      if (seq !== requestSeq.current) return
      if (response.success && response.data) {
        setCustomers(response.data.customers)
        if (enhanced) setPagination({ total: response.data.total, page: response.data.page, limit: response.data.limit, totalPages: response.data.totalPages })
      } else {
        toast.error("Failed to load customers")
      }
    } catch (error: any) {
      toast.error("Error loading customers", { description: error.message })
    } finally {
      if (seq === requestSeq.current) setCustomersLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedCustomerForEdit(null)
    setIsCreateModalOpen(true)
  }

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewDrawerOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setSelectedCustomerForEdit(customer)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    setSelectedCustomerForDelete(customer)
    setIsConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCustomerForDelete) return

    try {
      const response = await accountingApi.deleteCustomer(selectedCustomerForDelete.id)
      if (response.success) {
        setCustomers(prev => prev.filter(customer => customer.id !== selectedCustomerForDelete.id))
        toast.success("Customer deleted successfully")
      } else {
        throw new Error(response.error || 'Failed to delete customer')
      }
    } catch (error: any) {
      toast.error("Failed to delete customer", { description: error.message })
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs">
              {getInitials(value)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
            {row.contactPerson && (
              <p className="text-xs text-gray-500 truncate" title={row.contactPerson}>
                {row.contactPerson}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Contact',
      sortable: true,
      render: (value, row) => (
        <div className="space-y-1">
          {value && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-sm truncate" title={value}>{value}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-sm">{row.phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'taxNumber',
      label: 'Tax Number',
      sortable: true,
      render: (value) => (
        value ? (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-mono">{value}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getStatusColor(value)}>
          <div className="flex items-center gap-1">
            {getStatusIcon(value)}
            {value ? 'Active' : 'Inactive'}
          </div>
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    }
  ]

  const filterOptions = [
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' }
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

  const handleBulkAction = async (selectedCustomers: Customer[], action: string) => {
    try {
      const promises = selectedCustomers.map(customer => {
        const newStatus = action === 'activate'
        return accountingApi.updateCustomer(customer.id, {
          name: customer.name,
          taxNumber: customer.taxNumber || undefined,
          contactPerson: customer.contactPerson || undefined,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          address: customer.address || undefined,
          paymentTerms: customer.paymentTerms || undefined,
          isActive: newStatus
        })
      })

      await Promise.all(promises)
      toast.success(`${selectedCustomers.length} customers ${action}d successfully`)
      loadCustomers()
    } catch (error: any) {
      toast.error(`Failed to ${action} customers`, { description: error.message })
    }
  }

  const handleExport = (data: Customer[]) => {
    const csvContent = [
      ['Name', 'Tax Number', 'Contact Person', 'Email', 'Phone', 'Address', 'Payment Terms', 'Status', 'Created'].join(','),
      ...data.map(customer => [
        customer.name,
        customer.taxNumber || '',
        customer.contactPerson || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.paymentTerms || '',
        customer.isActive ? 'Active' : 'Inactive',
        new Date(customer.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} customers`)
  }

  const loadExport = async () => {
    const rows: Customer[] = []
    for (let page = 1; ; page++) {
      const response = await accountingApi.getCustomers({ page, limit: 100, search: search || undefined })
      if (!response.success || !response.data) throw new Error(response.error || 'Could not export customers')
      rows.push(...response.data.customers)
      if (page >= response.data.totalPages || response.data.customers.length < 100) break
    }
    return { title: 'Customers', filename: 'customers', columns: ['Name', 'Tax Number', 'Contact', 'Email', 'Phone', 'Address', 'Payment Terms', 'Status', 'Created'],
      rows: rows.map(x => [x.name, x.taxNumber || '', x.contactPerson || '', x.email || '', x.phone || '', x.address || '', x.paymentTerms || '', x.isActive ? 'Active' : 'Inactive', x.createdAt?.slice(0, 10) || '']), landscape: true }
  }

  return (
    <div className="space-y-6">
      {enhanced && <BulkReceivablesUploadModal kind="customers" isOpen={bulkOpen} onClose={() => setBulkOpen(false)} onSuccess={() => loadCustomers(1, pagination.limit, search)} customers={allCustomers} />}
      {/* Data Table */}
      <ProcurementDataTable
        data={customers}
        exportControls={enhanced ? () => <AccountingExportControls label="customers" spec={loadExport} /> : undefined}
        extraControls={enhanced ? <div className="flex items-center gap-2"><Input aria-label="Search customers" placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); void loadCustomers(1, pagination.limit, e.target.value) }} className="w-52" />{canCreateCustomer && <Button variant="outline" className="rounded-full" onClick={async () => { const response = await accountingApi.getCustomers({ limit: 10000 }); setAllCustomers(response.data?.customers || []); setBulkOpen(true) }}>Bulk Upload</Button>}</div> : undefined}
        columns={columns}
        title="Customers"
        searchPlaceholder="Search customers..."
        filterOptions={filterOptions}
        onView={handleView}
        onEdit={canEditCustomer ? handleEdit : undefined}
        onDelete={canDeleteCustomer ? handleDelete : undefined}
        onCreate={canCreateCustomer ? handleCreate : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={customersLoading}
        onExport={enhanced ? undefined : handleExport}
        showSearch={!enhanced}
        showFilters={!enhanced}
        usePagination={enhanced ? 'backend' : 'frontend'}
        paginationData={enhanced ? pagination : undefined}
        onPageChange={enhanced ? page => void loadCustomers(page, pagination.limit, search) : undefined}
        onPageSizeChange={enhanced ? limit => void loadCustomers(1, limit, search) : undefined}
        emptyMessage="No customers found. Create your first customer to get started."
      />

      {/* Customer View Drawer */}
      <CustomerViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onCustomerUpdated={loadCustomers}
      />

      {/* Create/Edit Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedCustomerForEdit(null)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setSelectedCustomerForEdit(null)
          loadCustomers()
        }}
        customer={selectedCustomerForEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false)
          setSelectedCustomerForDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description={
          selectedCustomerForDelete
            ? `Are you sure you want to delete ${selectedCustomerForDelete.name}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
