"use client"

import { useEffect, useState } from "react"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Landmark } from "lucide-react"
import { toast } from "sonner"
import { CreateBankAccountModal } from "./create-bank-account-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { cashbookApi, CashbookBank } from "@/lib/api/cashbook-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

export function BankAccountsManagement() {
  const { permissions } = useAccountingPermissions()

  const [banks, setBanks] = useState<CashbookBank[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedBankForEdit, setSelectedBankForEdit] = useState<CashbookBank | null>(null)
  const [selectedBankForDelete, setSelectedBankForDelete] = useState<CashbookBank | null>(null)

  useEffect(() => {
    loadBanks()
  }, [])

  const loadBanks = async () => {
    try {
      setBanksLoading(true)
      const response = await cashbookApi.getCashbookBanks({ includeInactive: true })
      if (response.success && response.data) {
        setBanks(response.data)
      } else {
        toast.error("Failed to load bank accounts")
      }
    } catch (error: any) {
      toast.error("Error loading bank accounts", { description: error.message })
    } finally {
      setBanksLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedBankForEdit(null)
    setIsCreateModalOpen(true)
  }

  const handleEdit = (bank: CashbookBank) => {
    setSelectedBankForEdit(bank)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (bank: CashbookBank) => {
    setSelectedBankForDelete(bank)
    setIsConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedBankForDelete) return

    try {
      const response = await cashbookApi.deleteCashbookBank(selectedBankForDelete.id)
      if (response.success) {
        setBanks(prev => prev.map(b =>
          b.id === selectedBankForDelete.id ? { ...b, isActive: false } : b
        ))
        toast.success("Bank account deactivated successfully")
      } else {
        throw new Error(response.error || 'Failed to delete bank account')
      }
    } catch (error: any) {
      toast.error("Failed to delete bank account", { description: error.message })
    }
  }

  const columns: Column<CashbookBank>[] = [
    {
      key: 'name',
      label: 'Bank Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-gray-500">{row.accountNumber}</p>
          </div>
        </div>
      )
    },
    {
      key: 'accountNumber',
      label: 'Account Number',
      sortable: true,
    },
    {
      key: 'currency',
      label: 'Currency',
      sortable: true,
      render: (value, row) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {row.currency?.code || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'glAccount',
      label: 'GL Account',
      sortable: false,
      render: (value, row) => (
        <span className="text-sm">
          {row.glAccount ? `${row.glAccount.accountNo} - ${row.glAccount.accountName}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {value ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <ProcurementDataTable
        columns={columns}
        data={banks}
        isLoading={banksLoading}
        emptyMessage="No bank accounts found"
        searchPlaceholder="Search bank accounts..."
        onView={handleEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Bank Account"
      />

      <CreateBankAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedBankForEdit(null)
        }}
        onSuccess={loadBanks}
        bank={selectedBankForEdit}
        isEditing={!!selectedBankForEdit}
      />

      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false)
          setSelectedBankForDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Deactivate Bank Account"
        description={`Are you sure you want to deactivate "${selectedBankForDelete?.name}"? This will soft-delete the bank account.`}
        confirmLabel="Deactivate"
      />
    </div>
  )
}
