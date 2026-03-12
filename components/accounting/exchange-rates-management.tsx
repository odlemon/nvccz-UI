"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Calendar } from "lucide-react"
import { toast } from "sonner"
import { CreateExchangeRateModal, ViewExchangeRateModal } from "./exchange-rate-modals"
import { fetchExchangeRates, createExchangeRate, updateExchangeRate, deleteExchangeRate } from "@/lib/store/slices/accountingSlice"
import { accountingApi, ExchangeRate } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

export function ExchangeRatesManagement() {
  const dispatch = useAppDispatch()
  const { exchangeRates, exchangeRatesLoading } = useAppSelector(s => s.accounting)
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateRate = permissions.canCreateExchangeRate
  const canEditRate = permissions.canUpdateExchangeRate
  const canDeleteRate = permissions.canDeleteExchangeRate
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<ExchangeRate | null>(null)

  useEffect(() => {
    dispatch(fetchExchangeRates())
  }, [dispatch])

  const handleCreate = () => {
    setSelected(null)
    setIsCreateOpen(true)
  }

  const handleView = (row: ExchangeRate) => {
    setSelected(row)
    setIsViewOpen(true)
  }

  const handleEdit = (row: ExchangeRate) => {
    setSelected(row)
    setIsCreateOpen(true)
  }

  const handleDelete = async (row: ExchangeRate) => {
    if (!confirm(`Delete exchange rate ${row.id}?`)) return
    try {
      await dispatch(deleteExchangeRate(row.id)).unwrap()
      toast.success("Exchange rate deleted")
    } catch (err: any) {
      toast.error("Failed to delete exchange rate")
    }
  }

  const columns: Column<ExchangeRate>[] = [
    {
      key: 'date',
      label: 'Effective Date',
      sortable: true,
      render: (v) => new Date(v).toLocaleDateString()
    },
    {
      key: 'fromCurrency',
      label: 'From',
      render: (_v, r) => r.fromCurrency ? `${r.fromCurrency.code} — ${r.fromCurrency.name}` : r.fromCurrencyId
    },
    {
      key: 'toCurrency',
      label: 'To',
      render: (_v, r) => r.toCurrency ? `${r.toCurrency.code} — ${r.toCurrency.name}` : r.toCurrencyId
    },
    {
      key: 'rate',
      label: 'Rate',
      sortable: true,
      render: (v) => v
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (v) => v ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge> : <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Inactive</Badge>
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (v) => new Date(v).toLocaleDateString()
    }
  ]

  const handleExport = (data: ExchangeRate[]) => {
    const rows = [
      ['From', 'To', 'Rate', 'EffectiveDate', 'Created'],
      ...data.map(d => [
        d.fromCurrency?.code || d.fromCurrencyId,
        d.toCurrency?.code || d.toCurrencyId,
        d.rate,
        d.date.split('T')[0],
        new Date(d.createdAt).toLocaleDateString()
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exchange-rates-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} exchange rates`)
  }

  return (
    <div className="space-y-6">
      <ProcurementDataTable
        data={exchangeRates}
        columns={columns}
        title="Exchange Rates"
        searchPlaceholder="Search exchange rates..."
        onView={(r: any) => handleView(r)}
        onEdit={canEditRate ? (r: any) => handleEdit(r) : undefined}
        onDelete={canDeleteRate ? (r: any) => handleDelete(r) : undefined}
        onCreate={canCreateRate ? handleCreate : undefined}
        loading={exchangeRatesLoading}
        onExport={handleExport}
        emptyMessage="No exchange rates found."
      />

      <CreateExchangeRateModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setSelected(null) }}
        initial={selected || undefined}
        onSuccess={() => dispatch(fetchExchangeRates())}
      />

      <ViewExchangeRateModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelected(null) }}
        exchangeRate={selected}
        onEdit={(ex) => { setIsViewOpen(false); setSelected(ex); setIsCreateOpen(true) }}
        onDelete={async (ex) => { setIsViewOpen(false); await handleDelete(ex) }}
      />
    </div>
  )
}
