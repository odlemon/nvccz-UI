"use client"

import { useEffect, useState } from "react"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Building, 
  CheckCircle, 
  Clock, 
  Mail,
  Phone,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { CreateVendorModal } from "./create-vendor-modal"
import { ViewVendorModal } from "./view-vendor-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { accountingApi, Vendor, CreateVendorRequest } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

// Export the type for use in other components
export type { Vendor }

export function VendorsManagement() {
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateVendor = permissions.canCreateVendor
  const canEditVendor = permissions.canUpdateVendor
  const canDeleteVendor = permissions.canDeleteVendor
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<Vendor | null>(null)
  const [selectedVendorForView, setSelectedVendorForView] = useState<Vendor | null>(null)
  const [selectedVendorForDelete, setSelectedVendorForDelete] = useState<Vendor | null>(null)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setVendorsLoading(true)
      const response = await accountingApi.getVendors()
      if (response.success && response.data) {
        setVendors(response.data)
      } else {
        toast.error("Failed to load vendors")
      }
    } catch (error: any) {
      toast.error("Error loading vendors", { description: error.message })
    } finally {
      setVendorsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedVendorForEdit(null)
    setIsCreateModalOpen(true)
  }

  const handleView = (vendor: Vendor) => {
    setSelectedVendorForView(vendor)
    setIsViewModalOpen(true)
  }

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendorForEdit(vendor)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendorForDelete(vendor)
    setIsConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedVendorForDelete) return

    try {
      const response = await accountingApi.deleteVendor(selectedVendorForDelete.id)
      if (response.success) {
        setVendors(prev => prev.filter(vendor => vendor.id !== selectedVendorForDelete.id))
        toast.success("Vendor deleted successfully")
      } else {
        throw new Error(response.error || 'Failed to delete vendor')
      }
    } catch (error: any) {
      toast.error("Failed to delete vendor", { description: error.message })
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

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      label: 'Vendor',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white text-xs">
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

  const handleBulkAction = async (selectedVendors: Vendor[], action: string) => {
    try {
      const promises = selectedVendors.map(vendor => {
        const newStatus = action === 'activate'
        return accountingApi.updateVendor(vendor.id, {
          name: vendor.name,
          taxNumber: vendor.taxNumber || undefined,
          contactPerson: vendor.contactPerson || undefined,
          email: vendor.email || undefined,
          phone: vendor.phone || undefined,
          address: vendor.address || undefined,
          paymentTerms: vendor.paymentTerms || undefined,
          isActive: newStatus
        })
      })

      await Promise.all(promises)
      toast.success(`${selectedVendors.length} vendors ${action}d successfully`)
      loadVendors()
    } catch (error: any) {
      toast.error(`Failed to ${action} vendors`, { description: error.message })
    }
  }

  const handleExport = (data: Vendor[]) => {
    const csvContent = [
      ['Name', 'Tax Number', 'Contact Person', 'Email', 'Phone', 'Address', 'Status', 'Created'].join(','),
      ...data.map(vendor => [
        vendor.name,
        vendor.taxNumber || '',
        vendor.contactPerson || '',
        vendor.email || '',
        vendor.phone || '',
        vendor.address || '',
        vendor.isActive ? 'Active' : 'Inactive',
        new Date(vendor.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendors.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} vendors`)
  }

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <ProcurementDataTable
        data={vendors}
        columns={columns}
        title="Vendors"
        searchPlaceholder="Search vendors..."
        filterOptions={filterOptions}
        onView={handleView}
        onEdit={canEditVendor ? handleEdit : undefined}
        onDelete={canDeleteVendor ? handleDelete : undefined}
        onCreate={canCreateVendor ? handleCreate : undefined}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        loading={vendorsLoading}
        onExport={handleExport}
        emptyMessage="No vendors found. Create your first vendor to get started."
      />

      {/* View Modal */}
      <ViewVendorModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedVendorForView(null)
        }}
        vendor={selectedVendorForView}
      />

      {/* Create/Edit Modal */}
      <CreateVendorModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedVendorForEdit(null)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setSelectedVendorForEdit(null)
          loadVendors()
        }}
        vendor={selectedVendorForEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false)
          setSelectedVendorForDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        description={
          selectedVendorForDelete
            ? `Are you sure you want to delete ${selectedVendorForDelete.name}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}