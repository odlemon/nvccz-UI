"use client"

import { useEffect, useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CreditCard,
  Plus,
  FileText,
  Calendar,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Info,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { CreditNoteViewDrawer } from "./credit-note-view-drawer"
import { CreateCreditNoteModal } from "./create-credit-note-modal"
import { accountingApi, CreditNote } from "@/lib/api/accounting-api"
import { fetchCreditNotes } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { useCreditNotes } from "@/lib/hooks/use-credit-notes"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

const creditNoteTabs = [
  {
    id: "all",
    label: "All Credit Notes",
    icon: FileText,
    description: "View all credit notes",
    gradient: "from-red-400 to-red-600",
    status: undefined
  },
  {
    id: "draft",
    label: "Drafts",
    icon: Calendar,
    description: "Draft credit notes",
    gradient: "from-gray-400 to-gray-600",
    status: "DRAFT"
  },
  {
    id: "sent",
    label: "Sent",
    icon: Send,
    description: "Sent credit notes",
    gradient: "from-purple-400 to-purple-600",
    status: "SENT"
  },
  {
    id: "applied",
    label: "Applied",
    icon: CheckCircle,
    description: "Applied credit notes",
    gradient: "from-green-400 to-green-600",
    status: "APPLIED"
  }
]

interface CreditNotesManagementProps {
  isCreateModalOpen?: boolean
  onCreateModalClose?: () => void
}

export function CreditNotesManagement({ 
  isCreateModalOpen: externalCreateModalOpen, 
  onCreateModalClose 
}: CreditNotesManagementProps = {}) {
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateCreditNote = permissions.canCreateCreditNote
  const canEditCreditNote = permissions.canUpdateCreditNote
  const canDeleteCreditNote = permissions.canDeleteCreditNote
  
  // Use the custom hook instead of direct Redux/API calls
  const {
    creditNotes,
    loading: creditNotesLoading,
    error: creditNotesError,
    loadCreditNotes,
    handleDeleteCreditNote,
    selectCreditNote
  } = useCreditNotes()
  
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Use external modal state if provided, otherwise use internal state
  const modalOpen = externalCreateModalOpen !== undefined ? externalCreateModalOpen : isCreateModalOpen
  const closeModal = onCreateModalClose || (() => setIsCreateModalOpen(false))

  useEffect(() => {
    // Load credit notes using the hook
    loadCreditNotes()
  }, [loadCreditNotes])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Load credit notes with status filter if needed
    const statusFilter = creditNoteTabs.find(t => t.id === tabId)?.status
    loadCreditNotes(statusFilter ? { status: statusFilter } : undefined)
  }

  // Filter credit notes based on active tab
  const filteredCreditNotes = useMemo(() => {
    if (activeTab === 'all') {
      return creditNotes
    }
    
    const statusFilter = creditNoteTabs.find(t => t.id === activeTab)?.status
    if (statusFilter) {
      return creditNotes.filter(note => note.status === statusFilter)
    }
    
    return creditNotes
  }, [creditNotes, activeTab])

  const handleViewCreditNote = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote)
    selectCreditNote(creditNote)
    setIsViewDrawerOpen(true)
  }

  const handleEditCreditNote = (creditNote: CreditNote) => {
    console.log('Edit credit note:', creditNote.id)
  }

  const handleDeleteCreditNoteAction = async (creditNote: CreditNote) => {
    if (window.confirm(`Are you sure you want to delete credit note "${creditNote.creditNoteNumber}"?`)) {
      try {
        await handleDeleteCreditNote(creditNote)
        // Refresh will happen automatically via Redux state update
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }

  // Show error state if there's an error
  if (creditNotesError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-2">{creditNotesError}</div>
            <Button onClick={() => loadCreditNotes()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPLIED':
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
      case 'APPLIED':
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const columns: Column<CreditNote>[] = [
    {
      key: 'creditNoteNumber',
      label: 'Credit Note Details',
      sortable: true,
      render: (value, row) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewCreditNote(row)
          }}
          title="Click to view credit note details"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white text-xs">
              <CreditCard className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block" title={value}>
              {value}
            </span>
            <p className="text-xs text-gray-500 truncate" title={row.reason}>
              {row.reason}
            </p>
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
                <Avatar className="h-8 w-8 hover:ring-2 hover:ring-red-500 hover:ring-offset-2 transition-all">
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
                  {value?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{value.email}</p>
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
            <p className="text-xs text-gray-500 truncate" title={value?.email}>
              {value?.email}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'originalInvoice',
      label: 'Original Invoice',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewCreditNote(row)
          }}
          title="Click to view credit note details"
        >
          <div className="space-y-1">
            <div className="font-medium text-blue-600">{value?.invoiceNumber}</div>
            <div className="text-xs text-gray-500">
              Amount: {row.currency?.symbol}{value?.totalAmount}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Credit Amount',
      sortable: true,
      render: (value, row) => (
        <div
          className="text-right cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewCreditNote(row)
          }}
          title="Click to view credit note details"
        >
          <div className="text-lg font-bold text-red-600">
            -{row.currency?.symbol}{value}
          </div>
          <div className="text-xs text-gray-500">
            Remaining: {row.currency?.symbol}{row.remainingAmount}
          </div>
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
            handleViewCreditNote(row)
          }}
          title="Click to view credit note details"
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
            handleViewCreditNote(row)
          }}
          title="Click to view credit note details"
        >
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
          <div className="text-xs text-gray-500">
            by {row.createdBy.firstName} {row.createdBy.lastName}
          </div>
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Applied', value: 'APPLIED' },
    { label: 'Void', value: 'VOID' }
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
    }
  ]

  const handleBulkAction = async (selectedCreditNotes: CreditNote[], action: string) => {
    try {
      console.log(`Bulk ${action} for`, selectedCreditNotes.length, 'credit notes')
    } catch (error: any) {
      console.error(`Failed to ${action} credit notes`, error)
    }
  }

  const handleExport = (data: CreditNote[]) => {
    const csvContent = [
      ['Credit Note Number', 'Customer', 'Amount', 'Currency', 'Reason', 'Status', 'Created'].join(','),
      ...data.map(creditNote => [
        creditNote.creditNoteNumber,
        creditNote.customer?.name || '',
        creditNote.totalAmount,
        creditNote.currency?.code || '',
        creditNote.reason,
        creditNote.status,
        new Date(creditNote.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'credit-notes.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    console.log(`Exported ${data.length} credit notes`)
  }

  return (
    <div className="space-y-6">
      {/* Credit Notes Tab Navigation */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center overflow-x-auto border-b">
            <div className="flex space-x-1 min-w-max">
              {creditNoteTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                      isActive
                        ? "text-red-600 border-red-600"
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
            data={filteredCreditNotes}
            columns={columns}
            title="Credit Notes"
            filterOptions={filterOptions}
            onView={handleViewCreditNote}
            onEdit={canEditCreditNote ? handleEditCreditNote : undefined}
            onDelete={canDeleteCreditNote ? handleDeleteCreditNoteAction : undefined}
            onBulkAction={handleBulkAction}
            bulkActions={bulkActions}
            loading={creditNotesLoading}
            onExport={handleExport}
            emptyMessage="No credit notes found. Create your first credit note to get started."
          />
        </CardContent>
      </Card>

      {/* Credit Note View Drawer */}
      <CreditNoteViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          setSelectedCreditNote(null)
          selectCreditNote(null)
        }}
        creditNote={selectedCreditNote}
        onRefresh={() => loadCreditNotes()}
      />

      {/* Create Credit Note Modal */}
      <CreateCreditNoteModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={() => {
          closeModal()
          loadCreditNotes()
        }}
      />
    </div>
  )
}
