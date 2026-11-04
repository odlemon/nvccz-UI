"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"
import { CreateContraEntryModal } from "@/components/accounting/create-contra-entry-modal"
import { ContraEntryViewDrawer } from "@/components/accounting/contra-entry-view-drawer"
import { fetchContraConfigs } from "@/lib/store/slices/cashbookSlice"
import { format } from "date-fns"
import { CashbookExportControls } from "@/components/accounting/cashbook-export-controls"
import type { AppDispatch, RootState } from "@/lib/store"

export function ContraEntriesTab({ enhanced = false }: { enhanced?: boolean }) {
  const dispatch = useDispatch<AppDispatch>()
  const contraConfigs = useSelector((state: RootState) => state.cashbook.contraConfigs)
  const contraConfigsLoading = useSelector((state: RootState) => state.cashbook.contraConfigsLoading)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedContraConfig, setSelectedContraConfig] = useState(null)
  const [filters, setFilters] = useState({ 
    entryType: "", 
    isEnabled: undefined as boolean | undefined 
  })

  useEffect(() => {
    dispatch(fetchContraConfigs(filters))
  }, [dispatch, filters])

  const columns = [
    {
      key: "entryType",
      label: "Entry Type",
      render: (value: string) => (
        <Badge variant={value === 'RECEIPT' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "glAccount",
      label: "GL Account",
      render: (value: any) => value ? `${value.accountNo} - ${value.accountName}` : "N/A",
    },
    {
      key: "contraType",
      label: "Contra Type",
      sortable: true,
    },
    {
      key: "isEnabled",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: "createdBy",
      label: "Created By",
      render: (value: any) => value ? `${value.firstName} ${value.lastName}` : "N/A",
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (value: string) => format(new Date(value), "yyyy-MM-dd"),
      sortable: true,
    },
  ]

  return (
    <>
      <div className="flex gap-4 items-center mb-4">
        <Select
          value={filters.entryType || "all"}
          onValueChange={type => setFilters(f => ({ ...f, entryType: type === "all" ? "" : type }))}
        >
          <SelectTrigger className="w-48 rounded-full">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="RECEIPT">Receipt</SelectItem>
            <SelectItem value="PAYMENT">Payment</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.isEnabled === undefined ? "all" : filters.isEnabled.toString()}
          onValueChange={status => setFilters(f => ({ ...f, isEnabled: status === "all" ? undefined : status === "true" }))}
        >
          <SelectTrigger className="w-48 rounded-full">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Enabled</SelectItem>
            <SelectItem value="false">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProcurementDataTable
        accuratePagination={enhanced}
        exportControls={enhanced ? (rows: any[]) => <CashbookExportControls spec={{ title: "Contra Entry Configurations", filename: "cashbook-contra-entries", columns: ["Entry Type", "GL Account", "Contra Type", "Status", "Created By", "Created At"], rows: rows.map(row => [row.entryType || "", row.glAccount ? `${row.glAccount.accountNo} - ${row.glAccount.accountName}` : "", row.contraType || "", row.isEnabled ? "Enabled" : "Disabled", row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : "", row.createdAt ? format(new Date(row.createdAt), "yyyy-MM-dd") : ""]) }} /> : undefined}
        data={contraConfigs}
        columns={columns}
        title="Contra Entry Configurations"
        searchPlaceholder="Search contra entries..."
        onCreate={() => {
          setSelectedContraConfig(null)
          setIsModalOpen(true)
        }}
        onView={(config) => {
          setSelectedContraConfig(config)
          setIsDrawerOpen(true)
        }}
        onEdit={(config) => {
          setSelectedContraConfig(config)
          setIsModalOpen(true)
        }}
        loading={contraConfigsLoading}
        emptyMessage="No contra configurations found."
      />

      <CreateContraEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedContraConfig(null)
        }}
        contraConfig={selectedContraConfig}
      />

      <ContraEntryViewDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedContraConfig(null)
        }}
        contraConfig={selectedContraConfig}
      />
    </>
  )
}
