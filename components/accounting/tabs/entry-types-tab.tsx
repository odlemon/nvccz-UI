"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"
import { CreateEntryTypeModal } from "@/components/accounting/create-entry-type-modal"
import { EntryTypeViewDrawer } from "@/components/accounting/entry-type-view-drawer"
import { fetchEntryTypes } from "@/lib/store/slices/cashbookSlice"
import { format } from "date-fns"
import { CashbookExportControls } from "@/components/accounting/cashbook-export-controls"
import type { AppDispatch, RootState } from "@/lib/store"

export function EntryTypesTab({ enhanced = false }: { enhanced?: boolean }) {
  const dispatch = useDispatch<AppDispatch>()
  const entryTypes = useSelector((state: RootState) => state.cashbook.entryTypes)
  const entryTypesLoading = useSelector((state: RootState) => state.cashbook.entryTypesLoading)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedEntryType, setSelectedEntryType] = useState(null)
  const [filters, setFilters] = useState({ transactionType: "", isActive: undefined as boolean | undefined })

  useEffect(() => {
    dispatch(fetchEntryTypes(filters))
  }, [dispatch, filters])

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "transactionType",
      label: "Transaction Type",
      render: (value: string) => (
        <Badge variant={value === 'RECEIPT' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "counterpartyType",
      label: "Counterparty Type",
      sortable: true,
    },
    {
      key: "defaultGlAccount",
      label: "Default GL Account",
      render: (value: any, row: any) => (
        row.glAccount ? `${row.glAccount.accountNo} - ${row.glAccount.accountName}` : "N/A"
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
          value={filters.transactionType || "all"}
          onValueChange={type => setFilters(f => ({ ...f, transactionType: type === "all" ? "" : type }))}
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
          value={filters.isActive === undefined ? "all" : filters.isActive.toString()}
          onValueChange={status => setFilters(f => ({ ...f, isActive: status === "all" ? undefined : status === "true" }))}
        >
          <SelectTrigger className="w-48 rounded-full">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProcurementDataTable
        accuratePagination={enhanced}
        exportControls={enhanced ? (rows: any[]) => <CashbookExportControls spec={{ title: "Entry Types", filename: "cashbook-entry-types", columns: ["Name", "Transaction Type", "Counterparty Type", "Default GL Account", "Status", "Created At"], rows: rows.map(row => [row.name || "", row.transactionType || "", row.counterpartyType || "", row.glAccount ? `${row.glAccount.accountNo} - ${row.glAccount.accountName}` : "", row.isActive ? "Active" : "Inactive", row.createdAt ? format(new Date(row.createdAt), "yyyy-MM-dd") : ""]) }} /> : undefined}
        data={entryTypes}
        columns={columns}
        title="Entry Types"
        searchPlaceholder="Search entry types..."
        onCreate={() => {
          setSelectedEntryType(null)
          setIsModalOpen(true)
        }}
        onView={(entryType) => {
          setSelectedEntryType(entryType)
          setIsDrawerOpen(true)
        }}
        onEdit={(entryType) => {
          setSelectedEntryType(entryType)
          setIsModalOpen(true)
        }}
        loading={entryTypesLoading}
        emptyMessage="No entry types found."
      />

      <CreateEntryTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEntryType(null)
        }}
        entryType={selectedEntryType}
      />

      <EntryTypeViewDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedEntryType(null)
        }}
        entryType={selectedEntryType}
      />
    </>
  )
}
