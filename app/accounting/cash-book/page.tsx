"use client"

import { useEffect, useState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, BarChart3, TrendingUp, BookOpen, Settings, Lock, FileSignature, Download } from "lucide-react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import type { RootState, AppDispatch } from "@/lib/store/store"
import {
  fetchCashbookBanks,
  fetchCashbookEntries,
  setSelectedCashbookBank,
} from "@/lib/store/slices/accountingSlice"
import { CreateCashbookReceiptModal } from "@/components/accounting/create-cashbook-receipt-modal"
import { CreateCashbookPaymentModal } from "@/components/accounting/create-cashbook-payment-modal"
import { CashbookEntryViewDrawer } from "@/components/accounting/cashbook-entry-view-drawer"
import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { CashbookDataTable } from "@/components/accounting/CashbookDataTable"
import { ProcessCashbookModal } from "@/components/accounting/process-cashbook"
import { cashbookApi } from "@/lib/api/cashbook-api"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateCashbookTransferModal } from "@/components/accounting/create-cashbook-transfer-modal"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"
import { CashbookBatchViewDrawer } from "@/components/accounting/cashbook-batch-view-drawer"
import { CashbookTransferViewDrawer } from "@/components/accounting/cashbook-transfer-view-drawer"
import { EntryTypesTab } from "@/components/accounting/tabs/entry-types-tab"
import { PeriodLockoutTab } from "@/components/accounting/tabs/period-lockout-tab"
import { ContraEntriesTab } from "@/components/accounting/tabs/contra-entries-tab"
import { ExportCashbookAuditModal } from "@/components/accounting/export-cashbook-audit-modal"

function getWeekRange() {
  const now = new Date()
  return {
    startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  }
}

const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount)
}

const mainTabs = [
  { id: 'single', label: 'Single Entries', icon: FileText, gradient: 'from-blue-500 to-blue-600' },
  { id: 'batch', label: 'Batch', icon: BarChart3, gradient: 'from-green-500 to-green-600' },
  { id: 'transfers', label: 'Cashbook Transfers', icon: TrendingUp, gradient: 'from-purple-500 to-purple-600' },
  { id: 'entry-types', label: 'Entry Types', icon: Settings, gradient: 'from-orange-500 to-orange-600' },
  { id: 'period-lockout', label: 'Period Lockout', icon: Lock, gradient: 'from-red-500 to-red-600' },
  { id: 'contra-entries', label: 'Contra Entries', icon: FileSignature, gradient: 'from-indigo-500 to-indigo-600' },
]

function CashbookPage() {
  const dispatch = useDispatch<AppDispatch>()
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'transfers' | 'entry-types' | 'period-lockout' | 'contra-entries'>('single')
  const [isProcessCashbookOpen, setIsProcessCashbookOpen] = useState(false)
  const [isExportAuditModalOpen, setIsExportAuditModalOpen] = useState(false)
  const [singleSubTab, setSingleSubTab] = useState<'receipts' | 'payments'>('receipts')
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)

  const cashbookBanks = useSelector((state: RootState) => state.accounting.cashbookBanks)
  const cashbookBanksLoading = useSelector((state: RootState) => state.accounting.cashbookBanksLoading)
  const selectedCashbookBank = useSelector((state: RootState) => state.accounting.selectedCashbookBank)
  const cashbookEntries = useSelector((state: RootState) => state.accounting.cashbookEntries)
  const cashbookEntriesLoading = useSelector((state: RootState) => state.accounting.cashbookEntriesLoading)

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [batches, setBatches] = useState<any[]>([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false)
  const [transfers, setTransfers] = useState<any[]>([])
  const [transfersLoading, setTransfersLoading] = useState(false)
  const [transferFilters, setTransferFilters] = useState(() => {
    const { startDate, endDate } = getWeekRange()
    return { fromBankId: "", toBankId: "", dateFrom: startDate, dateTo: endDate, page: 1, limit: 50 }
  })
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false)

  const [entriesStartDate, setEntriesStartDate] = useState<Date | undefined>(new Date(getWeekRange().startDate))
  const [entriesEndDate, setEntriesEndDate] = useState<Date | undefined>(new Date(getWeekRange().endDate))

  const [filters, setFilters] = useState(() => {
    const { startDate, endDate } = getWeekRange()
    return { type: "", status: "", startDate, endDate, bankId: "" }
  })

  const isFetchingRef = useRef(false)

  // Sync date states with filters
  useEffect(() => {
    setFilters(f => ({
      ...f,
      startDate: entriesStartDate ? format(entriesStartDate, "yyyy-MM-dd") : "",
      endDate: entriesEndDate ? format(entriesEndDate, "yyyy-MM-dd") : ""
    }))
  }, [entriesStartDate, entriesEndDate])

  useEffect(() => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    dispatch(fetchCashbookBanks()).finally(() => {
      isFetchingRef.current = false
    })
  }, [dispatch])

  useEffect(() => {
    if (activeTab === 'single') {
      const timeoutId = setTimeout(() => {
        dispatch(fetchCashbookEntries({
          bankId: filters.bankId || '',
          type: filters.type,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate
        }))
      }, 300) // Debounce to prevent rapid re-fetches

      return () => clearTimeout(timeoutId)
    } else if (activeTab === 'batch') {
      const fetchBatches = async () => {
        setBatchesLoading(true)
        try {
          const res = await cashbookApi.getCashbookBatches()
          if (res.success) {
            setBatches(res.data?.batches)
          }
        } catch (error) {
          console.error("Failed to fetch batches", error)
        } finally {
          setBatchesLoading(false)
        }
      }
      fetchBatches()
    } else if (activeTab === 'transfers') {
      const fetchTransfers = async () => {
        setTransfersLoading(true)
        try {
          const res = await cashbookApi.getCashbookTransfers(transferFilters)
          if (res.success) {
            setTransfers(res.data?.transfers || res.message || [])
          }
        } catch (error) {
          console.error("Failed to fetch transfers", error)
        } finally {
          setTransfersLoading(false)
        }
      }

      const timeoutId = setTimeout(fetchTransfers, 300) // Debounce
      return () => clearTimeout(timeoutId)
    }
  }, [dispatch, activeTab, filters, transferFilters])

  const exportToCSV = (data: any[], filename: string) => {
    const headers = ["Date", "Description", "Reference", "Receipts (Dr)", "Payments (Cr)", "Balance", "Status"]
    const rows = data.map(entry => [
      format(new Date(entry.transactionDate || entry.date), "yyyy-MM-dd"),
      entry.description,
      entry.reference,
      entry.type === "RECEIPT" ? Number(entry.amount).toLocaleString() : "",
      entry.type === "PAYMENT" ? Number(entry.amount).toLocaleString() : "",
      "",
      entry.status
    ])
    let balance = 0
    rows.forEach(row => {
      if (row[3]) balance += parseFloat(row[3].replace(/,/g, ''))
      if (row[4]) balance -= parseFloat(row[4].replace(/,/g, ''))
      row[5] = balance.toLocaleString()
    })
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateBalance = (entries: any[]) => {
    let balance = 0
    return entries.map(entry => {
      if (entry.type === "RECEIPT") balance += Number(entry.amount)
      if (entry.type === "PAYMENT") balance -= Number(entry.amount)
      return { ...entry, balance }
    })
  }

  const entriesWithBalance = calculateBalance(cashbookEntries)

  const filteredEntries = entriesWithBalance.filter(entry => {
    if (singleSubTab === 'receipts') return entry.type === 'RECEIPT'
    if (singleSubTab === 'payments') return entry.type === 'PAYMENT'
    return true
  })

  const batchColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === 'POSTED' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
    { key: "totalAmount", label: "Total Amount", render: (value: number) => formatCurrency(value), sortable: true },
    { key: "createdAt", label: "Created At", render: (value: string) => format(new Date(value), "yyyy-MM-dd"), sortable: true },
  ]

  const transferColumns = [
    { key: "transferDate", label: "Transfer Date", render: (value: string) => format(new Date(value), "yyyy-MM-dd"), sortable: true },
    { key: "fromBank", label: "From Bank", render: (value: any) => value?.name || "N/A", sortable: true },
    { key: "toBank", label: "To Bank", render: (value: any) => value?.name || "N/A", sortable: true },
    { key: "amount", label: "Amount", render: (value: number) => formatCurrency(value), sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "reference", label: "Reference", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === 'COMPLETED' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
  ]

  const handleViewBatch = (batch: any) => {
    setSelectedBatch(batch)
    setIsBatchDrawerOpen(true)
  }

  const handleViewTransfer = (transfer: any) => {
    setSelectedTransfer(transfer)
    setIsTransferDrawerOpen(true)
  }

  const handleBatchUpdate = (updatedBatch: any) => {
    setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b))
  }

  const handleTransferUpdate = (updatedTransfer: any) => {
    setTransfers(prev => prev.map(t => t.id === updatedTransfer.id ? updatedTransfer : t))
  }

  return (
    <AccountingLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal">Cashbook Management</h1>
            <p className="text-muted-foreground">Manage receipts and payments for your cashbook</p>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              onClick={() => setIsExportAuditModalOpen(true)}
              variant="outline"
              className="rounded-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Cashbook Audit
            </Button>
            `<Button
              onClick={() => setIsProcessCashbookOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Process Cashbook
            </Button>`
          </div>
        </div>

        {/* Tab Navigation - Updated font and icon sizes */}
        <div className="flex items-center overflow-x-auto border-b px-6">
          <div className="flex space-x-1 min-w-max">
            {mainTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                    isActive ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-gray-900"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200", tab.gradient)}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' && (
          <>
            {/* Sub-tabs for Receipts and Payments */}
            <div className="flex border-b bg-muted/30">
              <button
                onClick={() => setSingleSubTab("receipts")}
                className={cn(
                  "flex-1 py-3 text-center font-semibold transition-all duration-200",
                  singleSubTab === "receipts"
                    ? "bg-blue-50 text-blue-900 border-b-2 border-blue-500 shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                Receipts
              </button>
              <button
                onClick={() => setSingleSubTab("payments")}
                className={cn(
                  "flex-1 py-3 text-center font-semibold transition-all duration-200",
                  singleSubTab === "payments"
                    ? "bg-amber-50 text-amber-900 border-b-2 border-amber-500 shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                Payments
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center mt-2">
              <Select
                value={filters.type || "all"}
                onValueChange={type => setFilters(f => ({ ...f, type: type === "all" ? "" : type }))}
              >
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RECEIPT">Receipts</SelectItem>
                  <SelectItem value="PAYMENT">Payments</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || "all"}
                onValueChange={status => setFilters(f => ({ ...f, status: status === "all" ? "" : status }))}
              >
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-48">
                <DatePicker
                  value={entriesStartDate}
                  onChange={setEntriesStartDate}
                  className="rounded-full w-full"
                />
              </div>
              <div className="w-48">
                <DatePicker
                  value={entriesEndDate}
                  onChange={setEntriesEndDate}
                  className="rounded-full w-full"
                />
              </div>
            </div>

            {/* Cashbook Table */}
            <CashbookDataTable
              entries={filteredEntries}
              loading={cashbookEntriesLoading}
              onAddReceipt={() => setIsReceiptModalOpen(true)}
              onAddPayment={() => setIsPaymentModalOpen(true)}
              onViewEntry={(entry) => {
                setSelectedEntry(entry)
                setIsViewDrawerOpen(true)
              }}
              onExport={() => exportToCSV(filteredEntries, 'cashbook-entries.csv')}
            />
          </>
        )}

        {activeTab === 'batch' && (
          <ProcurementDataTable
            data={batches}
            columns={batchColumns}
            title="Batch Entries"
            searchPlaceholder="Search batches..."
            onView={handleViewBatch}
            loading={batchesLoading}
            onExport={() => exportToCSV(batches, 'batches.csv')}
            emptyMessage="No batches found."
          />
        )}

        {activeTab === 'transfers' && (
          <>
            {/* Filters */}
            <div className="flex gap-4 items-center mt-2 flex-wrap">
              <Select
                value={transferFilters.fromBankId || ""}
                onValueChange={fromBankId => setTransferFilters(f => ({ ...f, fromBankId }))}
              >
                <SelectTrigger className="w-48 rounded-full truncate">
                  <SelectValue placeholder="From Bank" />
                </SelectTrigger>
                <SelectContent>
                  {cashbookBanksLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : Array.isArray(cashbookBanks) && cashbookBanks.length > 0 ? (
                    cashbookBanks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No banks available</div>
                  )}
                </SelectContent>
              </Select>
              <Select
                value={transferFilters.toBankId || ""}
                onValueChange={toBankId => setTransferFilters(f => ({ ...f, toBankId }))}
              >
                <SelectTrigger className="w-48 rounded-full truncate">
                  <SelectValue placeholder="To Bank" />
                </SelectTrigger>
                <SelectContent>
                  {cashbookBanksLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : Array.isArray(cashbookBanks) && cashbookBanks.length > 0 ? (
                    cashbookBanks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No banks available</div>
                  )}
                </SelectContent>
              </Select>
              <DatePicker
                value={transferFilters.dateFrom ? new Date(transferFilters.dateFrom) : undefined}
                onChange={(date) => setTransferFilters(f => ({ ...f, dateFrom: date ? format(date, "yyyy-MM-dd") : "" }))}
                className="w-48 rounded-full"
              />
              <DatePicker
                value={transferFilters.dateTo ? new Date(transferFilters.dateTo) : undefined}
                onChange={(date) => setTransferFilters(f => ({ ...f, dateTo: date ? format(date, "yyyy-MM-dd") : "" }))}
                className="w-48 rounded-full"
              />
              <Button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Transfer
              </Button>
            </div>

            {/* Transfers Table */}
            <ProcurementDataTable
              data={transfers}
              columns={transferColumns}
              title="Cashbook Transfers"
              searchPlaceholder="Search transfers..."
              onView={handleViewTransfer}
              loading={transfersLoading}
              onExport={() => exportToCSV(transfers, 'transfers.csv')}
              emptyMessage="No transfers found."
            />
          </>
        )}

        {activeTab === 'entry-types' && <EntryTypesTab />}
        {activeTab === 'period-lockout' && <PeriodLockoutTab />}
        {activeTab === 'contra-entries' && <ContraEntriesTab />}

        {/* Modals */}
        <CreateCashbookReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          bank={selectedCashbookBank}
          onSuccess={() => {
            setIsReceiptModalOpen(false)
            dispatch(fetchCashbookEntries({ ...filters }))
          }}
        />
        <CreateCashbookPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bank={selectedCashbookBank}
          onSuccess={() => {
            setIsPaymentModalOpen(false)
            dispatch(fetchCashbookEntries({ ...filters }))
          }}
        />

        <CashbookEntryViewDrawer
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false)
            setSelectedEntry(null)
          }}
          entry={selectedEntry}
        />

        <ProcessCashbookModal
          isOpen={isProcessCashbookOpen}
          onClose={() => setIsProcessCashbookOpen(false)}
          banks={cashbookBanks}
          selectedBank={selectedCashbookBank}
          onBankChange={(bank) => dispatch(setSelectedCashbookBank(bank))}
          onSuccess={() => {
            // Refresh batches after successful import
            if (activeTab === 'batch') {
              const fetchBatches = async () => {
                setBatchesLoading(true)
                try {
                  const res = await cashbookApi.getCashbookBatches()
                  if (res.success) {
                    setBatches(res.data?.batches)
                  }
                } catch (error) {
                  console.error("Failed to fetch batches", error)
                } finally {
                  setBatchesLoading(false)
                }
              }
              fetchBatches()
            }
          }}
        />

        <CashbookBatchViewDrawer
          isOpen={isBatchDrawerOpen}
          onClose={() => {
            setIsBatchDrawerOpen(false)
            setSelectedBatch(null)
          }}
          batch={selectedBatch}
          onBatchUpdate={handleBatchUpdate}
        />

        <CreateCashbookTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          banks={cashbookBanks}
          onSuccess={() => {
            setIsTransferModalOpen(false)
            // Refetch transfers
            const fetchTransfers = async () => {
              setTransfersLoading(true)
              try {
                const res = await cashbookApi.getCashbookTransfers(transferFilters)
                if (res.success) {
                  setTransfers(res.data?.transfers || res.message || [])
                }
              } catch (error) {
                console.error("Failed to fetch transfers", error)
              } finally {
                setTransfersLoading(false)
              }
            }
            fetchTransfers()
          }}
        />

        <CashbookTransferViewDrawer
          isOpen={isTransferDrawerOpen}
          onClose={() => {
            setIsTransferDrawerOpen(false)
            setSelectedTransfer(null)
          }}
          transfer={selectedTransfer}
          onTransferUpdate={handleTransferUpdate}
        />

        <ExportCashbookAuditModal
          isOpen={isExportAuditModalOpen}
          onClose={() => setIsExportAuditModalOpen(false)}
          banks={cashbookBanks}
        />
      </div>
    </AccountingLayout>
  )
}

// Wrap with permission guard
export default function CashbookPageWrapper() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="cash-book">
      <CashbookPage />
    </ModuleGuard>
  )
}
