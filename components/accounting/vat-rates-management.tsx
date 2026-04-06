"use client"

import { useEffect, useState } from "react"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Percent, Star } from "lucide-react"
import { toast } from "sonner"
import { accountingApi, VatRate } from "@/lib/api/accounting-api"
import { CreateVatRateModal } from "./create-vat-rate-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"

export function VatRatesManagement() {
  const [vatRates, setVatRates] = useState<VatRate[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedForEdit, setSelectedForEdit] = useState<VatRate | null>(null)
  const [selectedForDelete, setSelectedForDelete] = useState<VatRate | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  useEffect(() => { loadVatRates() }, [])

  const loadVatRates = async () => {
    setLoading(true)
    try {
      const response = await accountingApi.getVatRates()
      if (response.success && response.data) {
        setVatRates(response.data)
      } else {
        toast.error("Failed to load VAT rates")
      }
    } catch (error: any) {
      toast.error("Error loading VAT rates", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedForEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (vatRate: VatRate) => {
    setSelectedForEdit(vatRate)
    setIsModalOpen(true)
  }

  const handleDelete = (vatRate: VatRate) => {
    setSelectedForDelete(vatRate)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    // No delete endpoint provided — show info
    toast.info("Delete is not supported for VAT rates. Deactivate the rate instead.")
    setIsConfirmOpen(false)
    setSelectedForDelete(null)
  }

  const handleSetActive = async (vatRate: VatRate) => {
    try {
      const response = await accountingApi.setActiveVatRate(vatRate.id)
      if (response.success) {
        toast.success(`"${vatRate.name}" is now the active VAT rate`)
        loadVatRates()
      } else {
        throw new Error(response.error || "Failed to set active VAT rate")
      }
    } catch (error: any) {
      toast.error("Failed to set active VAT rate", { description: error.message })
    }
  }

  const fmtRate = (rateDecimal: string) =>
    `${(parseFloat(rateDecimal) * 100).toFixed(2)}%`

  const columns: Column<VatRate>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-orange-500" />
          <span className="font-medium">{value}</span>
          {row.isActive && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" title="Active rate" />
          )}
        </div>
      ),
    },
    {
      key: "rateDecimal",
      label: "Rate",
      sortable: true,
      render: (value) => (
        <span className="font-semibold tabular-nums text-gray-800">{fmtRate(value)}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
          <div className="flex items-center gap-1">
            {value ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {value ? "Active" : "Inactive"}
          </div>
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">{new Date(value).toLocaleDateString()}</span>
      ),
    },
    {
      key: "id",
      label: "Set Active",
      sortable: false,
      render: (_, row) => (
        row.isActive ? (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Current
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs rounded-full"
            onClick={e => { e.stopPropagation(); handleSetActive(row) }}
          >
            Set Active
          </Button>
        )
      ),
    },
  ]

  const filterOptions = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ]

  const handleExport = (data: VatRate[]) => {
    const csv = [
      ["Name", "Rate (%)", "Status", "Created"].join(","),
      ...data.map(r => [r.name, fmtRate(r.rateDecimal), r.isActive ? "Active" : "Inactive", new Date(r.createdAt).toLocaleDateString()].join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "vat-rates.csv"
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} VAT rates`)
  }

  return (
    <div className="space-y-6">
      <ProcurementDataTable
        data={vatRates}
        columns={columns}
        title="VAT Rates"
        searchPlaceholder="Search VAT rates..."
        filterOptions={filterOptions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        loading={loading}
        onExport={handleExport}
        emptyMessage="No VAT rates found. Create your first VAT rate to get started."
      />

      <CreateVatRateModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedForEdit(null) }}
        onSuccess={() => { setIsModalOpen(false); setSelectedForEdit(null); loadVatRates() }}
        vatRate={selectedForEdit}
      />

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setSelectedForDelete(null) }}
        onConfirm={confirmDelete}
        title="Remove VAT Rate"
        description={selectedForDelete ? `Are you sure you want to remove "${selectedForDelete.name}"? This action cannot be undone.` : ""}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
