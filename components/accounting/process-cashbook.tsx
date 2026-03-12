"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { X, Check, ChevronsUpDown, Plus, Trash2, Save, AlertTriangle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import * as yup from "yup"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { fetchCustomers, fetchVendors, fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store"
import { accountingApi } from "@/lib/api/accounting-api"
import { cashbookApi, OpenItem, Allocation } from "@/lib/api/cashbook-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

const entrySchema = yup.object({
  period: yup.string().required("Period is required"),
  date: yup.date().required("Date is required"),
  gcs: yup.string().required("GCS is required"),
  customerId: yup.string().default(""),
  vendorId: yup.string().default(""),
  glAccountId: yup.string().default(""),
  reconciled: yup.string().default(""),
  reference: yup.string().required("Reference is required"),
  description: yup.string().required("Description is required"),
  bankAmount: yup.number().required("Amount is required").min(0, "Amount must be at least 0"),
  discount: yup.number().default(0),
  vatCode: yup.string().default(""),
  projectCode: yup.string().default(""),
  allocations: yup.array().of(yup.object({
    openItemId: yup.string().required(),
    allocatedAmount: yup.number().required().min(0),
    discountAmount: yup.number().default(0),
    description: yup.string().default(""),
  })).default([]),
})

const formSchema = yup.object({
  entries: yup.array().of(entrySchema),
})

interface ProcessCashbookModalProps {
  isOpen: boolean
  onClose: () => void
  banks: any[]
  selectedBank: any
  onBankChange: (bank: any) => void
  onSuccess?: () => void
}

export function ProcessCashbookModal({
  isOpen,
  onClose,
  banks,
  selectedBank,
  onBankChange,
  onSuccess,
}: ProcessCashbookModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateCashbook = permissions.canProcessCashbook
  const canEditCashbook = permissions.canProcessCashbook
  
  const customers = useSelector((state: RootState) => state.accounting.customers)
  const vendors = useSelector((state: RootState) => state.accounting.vendors)
  const chartOfAccounts = useSelector((state: RootState) => state.accounting.chartOfAccounts)

  const [activeTab, setActiveTab] = useState<"receipts" | "payments">("receipts")
  const [batchType, setBatchType] = useState("normal")
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: string } | null>(null)
  const [accountOpen, setAccountOpen] = useState<number | null>(null)
  const [customerOpen, setCustomerOpen] = useState<number | null>(null)
  const [vendorOpen, setVendorOpen] = useState<number | null>(null)
  const [glOpen, setGlOpen] = useState<number | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreviewCount, setImportPreviewCount] = useState<number | null>(null)
  const [matchingOpen, setMatchingOpen] = useState(false)
  const [currentEntryIndex, setCurrentEntryIndex] = useState<number | null>(null)
  const [openItems, setOpenItems] = useState<OpenItem[]>([])
  const [selectedAllocations, setSelectedAllocations] = useState<Allocation[]>([])
  const [isFetchingOpenItems, setIsFetchingOpenItems] = useState(false)

  // NEW: matching states for transactions
  const [transactions, setTransactions] = useState<any[]>([])
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [transactionDropdownOpen, setTransactionDropdownOpen] = useState(false)
  const [matchingSubmitting, setMatchingSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      entries: [
        {
          period: "07-",
          date: new Date(),
          gcs: "G",
          customerId: "",
          vendorId: "",
          glAccountId: "",
          reconciled: "",
          reference: "",
          description: "",
          bankAmount: 0,
          discount: 0,
          vatCode: "",
          projectCode: "",
        },
      ],
    },
  })

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: "entries",
  })

  const entries = watch("entries")
  const batchTotal = entries.reduce((sum, entry) => sum + (Number(entry.bankAmount) || 0), 0)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCustomers())
      dispatch(fetchVendors())
      dispatch(fetchChartOfAccounts())
    }
  }, [isOpen, dispatch])

  const handleAddRow = (index: number) => {
    insert(index + 1, {
      period: "07-",
      date: new Date(),
      gcs: "G",
      customerId: "",
      vendorId: "",
      glAccountId: "",
      reconciled: "",
      reference: "",
      description: "",
      bankAmount: 0,
      discount: 0,
      vatCode: "",
      projectCode: "",
    })
  }

  const handleDeleteRow = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    } else {
      toast.error("Cannot delete the last row")
    }
  }

  // Add keyboard shortcuts for Insert/Delete and Esc when modal is open.
  // Ctrl+D => delete last row, Ctrl+I => insert at end, Esc => close modal.
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const isTyping =
        !!active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)

      if (isTyping) return

      // Ctrl+D -> delete last row
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault()
        handleDeleteRow(fields.length - 1)
      }

      // Ctrl+I -> insert new row at end
      if ((e.ctrlKey || e.metaKey) && (e.key === "i" || e.key === "I")) {
        e.preventDefault()
        handleAddRow(fields.length - 1)
      }

      // F7 -> open matching modal
      if (e.key === "F7") {
        e.preventDefault()
        openMatchingModal()
      }

      // Esc -> close modal
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, fields.length, handleAddRow, handleDeleteRow, onClose])

  const handleSave = async (data: any) => {
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    const data = watch()
    try {
      await formSchema.validate(data, { abortEarly: false })
    } catch (validationErrors: any) {
      const errorMessages = validationErrors.inner.map((err: any) => err.message).join(", ")
      toast.error(`Validation errors: ${errorMessages}`)
      setConfirmOpen(false)
      return
    }
    if (!selectedBank) {
      toast.error("Please select a bank")
      setConfirmOpen(false)
      return
    }
    setSaving(true)
    console.log("Saving data:", data)
    if (data.entries.length === 1) {
      // Single entry submission
      const entry = data.entries[0]
      const isReceipt = activeTab === "receipts"
      let counterpartyType
      if (entry.gcs === "C") counterpartyType = "CUSTOMER"
      else if (entry.gcs === "V") counterpartyType = "VENDOR"
      else counterpartyType = "GL"
      const payload = {
        bankId: selectedBank.id,
        amount: entry.bankAmount,
        description: entry.description,
        reference: entry.reference,
        counterpartyType,
        customerId: entry.customerId || undefined,
        vendorId: entry.vendorId || undefined,
        glAccountId: entry.glAccountId || undefined,
        transactionDate: format(new Date(entry.date), "yyyy-MM-dd"),
        discount: entry.discount || 0,
        vatCode: entry.vatCode || undefined,
        projectCode: entry.projectCode || undefined,
      }
      try {
        const res = isReceipt ? await cashbookApi.createCashbookReceipt(payload) : await cashbookApi.createCashbookPayment(payload)
        if (res.success) {
          toast.success(`${activeTab.slice(0, -1)} saved`)
          setConfirmOpen(false)
          onClose()
          // After creating entry, match allocations if any
          if ((entry as any).allocations && (entry as any).allocations.length > 0) {
            try {
              await cashbookApi.matchOpenItems(res.data.id, (entry as any).allocations)
              toast.success("Allocations matched")
            } catch (matchError) {
              console.error("Matching error:", matchError)
              toast.error("Entry saved but matching failed")
            }
          }
          // Clear form
          reset({
            entries: [
              {
                period: "07-",
                date: new Date(),
                gcs: "G",
                customerId: "",
                vendorId: "",
                glAccountId: "",
                reconciled: "",
                reference: "",
                description: "",
                bankAmount: 0,
                discount: 0,
                vatCode: "",
                projectCode: "",
              },
            ],
          })
        } else {
          toast.error("Failed to save entry")
        }
      } catch (error) {
        console.error("Save error:", error)
        toast.error("Failed to save entry")
      }
    } else {
      // Batch submission via CSV
      const csv = generateCSV(data.entries)
      const timestamp = Date.now()
      const file = new File([csv], `batch-cashbook-${timestamp}.csv`, { type: "text/csv" })

      //download CSV for debugging
      // const url = URL.createObjectURL(file)
      // const a = document.createElement("a")
      // a.href = url
      // a.download = file.name
      // a.click()
      // URL.revokeObjectURL(url)


      try {
        const res = await cashbookApi.createCashbookBatchImport(file)
        if (res.success) {
          toast.success(`Batch imported: ${res.data.totalTransactions} transactions (${res.data.validTransactions} valid, ${res.data.invalidTransactions} invalid)`)
          
          // Show errors if any
          if (res.data.errors && res.data.errors.length > 0) {
            toast.warning(`Some transactions had errors: ${res.data.errors.slice(0, 3).join(", ")}${res.data.errors.length > 3 ? "..." : ""}`)
          }
          
          setConfirmOpen(false)
          onClose()
          
          // Call onSuccess callback to refresh batches
          onSuccess?.()
          
          // Clear form
          reset({
            entries: [
              {
                period: "07-",
                date: new Date(),
                gcs: "G",
                customerId: "",
                vendorId: "",
                glAccountId: "",
                reconciled: "",
                reference: "",
                description: "",
                bankAmount: 0,
                discount: 0,
                vatCode: "",
                projectCode: "",
              },
            ],
          })
        } else {
          toast.error("Failed to import batch")
        }
      } catch (error) {
        console.error("Batch import error:", error)
        toast.error("Failed to import batch")
      }
    }
    setSaving(false)
  }


  // Helper to generate CSV from entries (with headers matching new template)
  const generateCSV = (entries: any[]) => {
    const headers = ["bankName", "transactionDate", "description", "amount", "reference", "counterpartyType", "customerName", "vendorName", "glAccountNo", "vatCode", "projectCode", "discount"]
    
    // Helper to escape CSV field if it contains comma, quote, or newline
    const escapeField = (field: any): string => {
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    
    const rows = entries.map(entry => {
      let counterpartyType
      if (entry.gcs === "C") counterpartyType = "CUSTOMER"
      else if (entry.gcs === "V") counterpartyType = "VENDOR"
      else counterpartyType = "GL"
      
      // Get customer name
      const customerName = entry.customerId 
        ? customers.find((c: any) => c.id === entry.customerId)?.name || ""
        : ""
      
      // Get vendor name
      const vendorName = entry.vendorId
        ? vendors.find((v: any) => v.id === entry.vendorId)?.name || ""
        : ""
      
      // Get GL account number (use accountNo property)
      const glAccountNo = entry.glAccountId
        ? chartOfAccounts.find((acc: any) => acc.id === entry.glAccountId)?.accountNo || ""
        : ""
      
      return [
        selectedBank?.name || "",
        format(new Date(entry.date), "yyyy-MM-dd"),
        entry.description,
        parseFloat(entry.bankAmount),
        entry.reference,
        counterpartyType,
        customerName,
        vendorName,
        glAccountNo,
        entry.vatCode || "",
        entry.projectCode || "",
        parseFloat(entry.discount) || 0,
      ]
    })
    
    // Generate CSV with proper escaping only for fields that need it
    const csvLines = [
      headers.join(","),
      ...rows.map(row => row.map((cell, index) => {
        // For description field (index 2), always escape if contains special chars
        if (index === 2) return escapeField(cell)
        // Otherwise just convert to string
        return String(cell)
      }).join(","))
    ]
    
    return csvLines.join("\n")
  }

  const trimSpaces = (value: any): string => {
    return value?.toString().trim() || "";
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: selectedBank?.currency?.code || "ZAR",
    }).format(Number(amount) || 0)
  }

  // Basic CSV line splitter that supports quoted commas
  const splitCSVLine = (line: string) => {
    const re = /("([^"]*(?:""[^"]*)*)"|[^,]*)(?:,|$)/g
    const result: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      let val = m[1] ?? ""
      if (val.startsWith('"') && val.endsWith('"')) {
        // remove surrounding quotes and unescape double quotes
        val = val.slice(1, -1).replace(/""/g, '"')
      }
      result.push(val)
      if (m.index + m[0].length >= line.length) break
    }
    return result
  }

  const parseCSV = (csv: string) => {
    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length < 1) return []
    const headers = splitCSVLine(lines[0]).map(h => h.replace(/"/g, "").trim())
    const expectedHeaders = ["bankName", "transactionDate", "description", "amount", "reference", "counterpartyType", "customerName", "vendorName", "glAccountNo", "vatCode", "projectCode", "discount"]
    if (!expectedHeaders.every(h => headers.includes(h))) {
      throw new Error("CSV headers do not match expected format")
    }
    return lines.slice(1).map(line => {
      const values = splitCSVLine(line)
      const entry: any = {}
      headers.forEach((h, i) => {
        const val = values[i] || ""
        if (h === "transactionDate") entry.date = new Date(val)
        else if (h === "amount") entry.bankAmount = parseFloat(val) || 0
        else if (h === "discount") entry.discount = parseFloat(val) || 0
        else if (h === "counterpartyType") {
          entry.counterpartyType = val
          if (val === "CUSTOMER") entry.gcs = "C"
          else if (val === "SUPPLIER" || val === "VENDOR") entry.gcs = "V"
          else if (val === "GL") entry.gcs = "G"
        }
        else if (h === "customerName") {
          // Find customer by name and set customerId
          const customer = customers.find((c: any) => c.name === val)
          if (customer) entry.customerId = customer.id
        }
        else if (h === "vendorName") {
          // Find vendor by name and set vendorId
          const vendor = vendors.find((v: any) => v.name === val)
          if (vendor) entry.vendorId = vendor.id
        }
        else if (h === "glAccountNo") {
          // Find GL account by account number and set glAccountId
          const account = chartOfAccounts.find((acc: any) => acc.accountNo === val)
          if (account) entry.glAccountId = account.id
        }
        else if (h === "bankName") {
          // Store bank name for reference (not used in submission)
          entry.bankName = val
        }
        else {
          entry[h] = val
        }
      })
      entry.period = "07-" // Default period
      return entry
    })
  }

  const handleImport = async () => {
    if (!importFile) return
    try {
      const csv = await importFile.text()
      const parsedEntries = parseCSV(csv)
      setImportPreviewCount(parsedEntries.length)
      // Populate the form with parsed entries
      reset({ entries: parsedEntries.length > 0 ? parsedEntries : [/* default entry */] })
      setImportOpen(false)
      toast.success(`Imported ${parsedEntries.length} entries`)
    } catch (error: any) {
      toast.error("Failed to parse CSV: " + (error?.message || "Unknown error"))
    }
  }

  // UPDATED: Only set IDs. Do not fetch open items or open matching modal on selection.
  const handleCustomerVendorSelect = async (index: number, id: string, type: 'customer' | 'supplier') => {
    if (type === 'customer') setValue(`entries.${index}.customerId`, id)
    else setValue(`entries.${index}.vendorId`, id)
    // Removed: fetching open items and opening modal here
  }

  // NEW: Open custom matching modal and load posted payments
  const openMatchingModal = async () => {
    setMatchingOpen(true)
    setSelectedTransactionId(null)
    setOpenItems([])
    setSelectedAllocations([])
    setIsFetchingTransactions(true)
    try {
      const res = await cashbookApi.getCashbookTransactions({
        type: 'PAYMENT',
        status: 'POSTED',
        bankId: selectedBank?.id, // include bank filter
        limit: 100,
      })
      const list = (res as any)?.message?.reversals || (res as any)?.data?.reversals || []
      setTransactions(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error("Failed to fetch transactions", error)
      toast.error("Failed to fetch transactions")
    } finally {
      setIsFetchingTransactions(false)
    }
  }

  // NEW: When a payment is selected, fetch open items for its counterparty
  const handleTransactionSelect = async (transactionId: string) => {
    setSelectedTransactionId(transactionId)
    setTransactionDropdownOpen(false)
    const tx = transactions.find(t => t.id === transactionId)
    if (!tx) {
      toast.error("Transaction not found")
      return
    }
    const partyId = tx.customerId || tx.vendorId
    if (!partyId) {
      toast.info("No customer/vendor linked to this payment")
      setOpenItems([])
      return
    }
    setIsFetchingOpenItems(true)
    try {
      const apiMethod = tx.customerId ? cashbookApi.getOpenItemsForCustomer : cashbookApi.getOpenItemsForSupplier
      const res = await apiMethod(partyId)
      const items = (res as any)?.message || (res as any)?.data || []
      if (Array.isArray(items) && items.length > 0) {
        setOpenItems(items)
        setSelectedAllocations([])
      } else {
        setOpenItems([])
        toast.info("No open items found for selected payment")
      }
    } catch (error) {
      console.error("Failed to fetch open items", error)
      toast.error("Failed to fetch open items")
    } finally {
      setIsFetchingOpenItems(false)
    }
  }

  // NEW: Submit allocations to the matching API using selected paymentId
  const handleMatchingConfirm = async () => {
    if (!selectedTransactionId) {
      toast.error("Please select a payment")
      return
    }
    if (selectedAllocations.length === 0) {
      toast.error("Please select at least one item to allocate")
      return
    }
    const totalAllocated = selectedAllocations.reduce((sum, a) => sum + a.allocatedAmount + a.discountAmount, 0)
    if (totalAllocated <= 0) {
      toast.error("Allocated total must be greater than 0")
      return
    }
    try {
      setMatchingSubmitting(true)
      const res = await cashbookApi.matchOpenItems(selectedTransactionId, selectedAllocations)
      if ((res as any)?.success) {
        toast.success("Allocations matched successfully")
        setMatchingOpen(false)
        setSelectedTransactionId(null)
        setOpenItems([])
        setSelectedAllocations([])
      } else {
        toast.error("Failed to match allocations")
      }
    } catch (error) {
      console.error("Matching error:", error)
      toast.error("Failed to match allocations")
    } finally {
      setMatchingSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl md:max-w-full w-[90vw]  h-[calc(100vh-40px)] max-h-none p-0 m-4 bg-background flex flex-col">
          <div className="flex items-center justify-between from-slate-800 to-slate-700 px-8 py-4 border-b ">
            <h2 className="text-xl font-semibold">Process Cash Books</h2>
            {/* <Button variant="ghost" size="icon" className="text-white hover:bg-slate-600 rounded-full" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button> */}
          </div>

          <div className="flex items-center gap-8 px-8 py-5 bg-card border-b">
            <div className="flex flex-col  gap-3">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Cash Book</label>
              <Select
                value={selectedBank?.id || ""}
                onValueChange={(id) => {
                  const bank = banks.find((b) => b.id === id)
                  if (bank) onBankChange(bank)
                }}
              >
                <SelectTrigger className="w-[360px]">
                  <SelectValue placeholder="Select bank..." />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.accountNumber} - {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col  gap-3">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Batch Type</label>
              <Select value={batchType} onValueChange={setBatchType}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal batch entry</SelectItem>
                  <SelectItem value="recurring">Recurring batch</SelectItem>
                  <SelectItem value="adjustment">Adjustment batch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col  gap-3 ml-auto">
              <label className="text-sm font-medium text-muted-foreground">Balance</label>
              <Input
                value={formatCurrency(selectedBank?.balance || 0)}
                readOnly
                className="w-[180px] text-right font-mono bg-muted"
              />
            </div>


          </div>

          <div className="flex border-b bg-muted/30">
            <button
              onClick={() => setActiveTab("payments")}
              className={cn(
                "flex-1 py-3 text-center font-semibold transition-all duration-200",
                activeTab === "payments"
                  ? "bg-amber-50 text-amber-900 border-b-2 border-amber-500 shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab("receipts")}
              className={cn(
                "flex-1 py-3 text-center font-semibold transition-all duration-200",
                activeTab === "receipts"
                  ? "bg-blue-50 text-blue-900 border-b-2 border-blue-500 shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              Receipts
            </button>
          </div>

          <div
            className="flex-1 overflow-auto px3 py-6"
            style={{ backgroundColor: activeTab === "payments" ? "#fffbeb" : "#eff6ff" }}
          >
            <form onSubmit={handleSubmit(handleSave)} className="h-full flex flex-col">
              <div className="flex-1 overflow-x-auto bg-white  border min-w-full">
                <table className="w-full border-collapse min-w-max" style={{ fontFamily: "monospace" }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-24">Per</th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-36">Date</th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-20">GCS</th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-64">Account</th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-40">
                        Reference
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left min-w-[280px]">
                        Description
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-right w-40">
                        Bank Amount
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-right w-32">
                        Discount
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-40">
                        VAT Code
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-left w-40">Project Code</th>
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold text-center w-28">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="bg-white hover:bg-slate-50 transition-colors">
                        {/* Period */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Select
                            value={entries[index]?.period || "07-"}
                            onValueChange={(value) => setValue(`entries.${index}.period`, value)}
                          >
                            <SelectTrigger className="h-8 text-xs border-0 focus:ring-1 focus:ring-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => {
                                const month = String(i + 1).padStart(2, "0")
                                return (
                                  <SelectItem key={month} value={`${month}-`}>
                                    {month}-
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Date */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Popover
                            open={datePickerOpen === index}
                            onOpenChange={(open) => setDatePickerOpen(open ? index : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-full justify-start text-xs px-2 font-mono border-0 hover:bg-slate-100"
                              >
                                {entries[index]?.date ? format(new Date(entries[index].date), "dd/MM/yy") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={entries[index]?.date ? new Date(entries[index].date) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setValue(`entries.${index}.date`, date)
                                    setDatePickerOpen(null)
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </td>

                        {/* GCS */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Select
                            value={entries[index]?.gcs || "G"}
                            onValueChange={(value) => setValue(`entries.${index}.gcs`, value)}
                          >
                            <SelectTrigger className="h-8 text-xs border-0 focus:ring-1 focus:ring-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="G">G</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="V">V</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Account */}
                        <td className="border border-slate-200 px-1 py-1">
                          {entries[index]?.gcs === "C" && (
                            <Popover
                              open={customerOpen === index}
                              onOpenChange={(open) => setCustomerOpen(open ? index : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-full justify-between text-xs px-2 border-0 hover:bg-slate-100"
                                >
                                  <span className="truncate">
                                    {entries[index]?.customerId
                                      ? customers?.find((c) => c.id === entries[index].customerId)?.name ||
                                      entries[index].customerId
                                      : "Select customer..."}
                                  </span>
                                  <ChevronsUpDown className="w-3 h-3 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[320px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search customers..." className="h-9 text-xs" />
                                  <CommandList>
                                    {isFetchingOpenItems ? (
                                      <div className="flex items-center justify-center p-4">
                                        <Loader2 className="animate-spin w-4 h-4" />
                                        <span className="ml-2 text-sm">Loading open items...</span>
                                      </div>
                                    ) : (
                                      <>
                                        <CommandEmpty>No customers found.</CommandEmpty>
                                        <CommandGroup>
                                          {customers?.map((customer) => (
                                            <CommandItem
                                              key={customer.id}
                                              value={customer.id}
                                              onSelect={() => {
                                                handleCustomerVendorSelect(index, customer.id, 'customer')
                                                setCustomerOpen(null)
                                              }}
                                              className="text-xs"
                                            >
                                              {customer.name}
                                              <Check
                                                className={cn(
                                                  "ml-auto w-3 h-3",
                                                  entries[index]?.customerId === customer.id ? "opacity-100" : "opacity-0",
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                          {entries[index]?.gcs === "V" && (
                            <Popover
                              open={vendorOpen === index}
                              onOpenChange={(open) => setVendorOpen(open ? index : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-full justify-between text-xs px-2 border-0 hover:bg-slate-100"
                                >
                                  <span className="truncate">
                                    {entries[index]?.vendorId
                                      ? vendors?.find((v) => v.id === entries[index].vendorId)?.name ||
                                      entries[index].vendorId
                                      : "Select vendor..."}
                                  </span>
                                  <ChevronsUpDown className="w-3 h-3 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[320px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search vendors..." className="h-9 text-xs" />
                                  <CommandList>
                                    {isFetchingOpenItems ? (
                                      <div className="flex items-center justify-center p-4">
                                        <Loader2 className="animate-spin w-4 h-4" />
                                        <span className="ml-2 text-sm">Loading open items...</span>
                                      </div>
                                    ) : (
                                      <>
                                        <CommandEmpty>No vendors found.</CommandEmpty>
                                        <CommandGroup>
                                          {vendors?.map((vendor) => (
                                            <CommandItem
                                              key={vendor.id}
                                              value={vendor.id}
                                              onSelect={() => {
                                                handleCustomerVendorSelect(index, vendor.id, 'supplier')
                                                setVendorOpen(null)
                                              }}
                                              className="text-xs"
                                            >
                                              {vendor.name}
                                              <Check
                                                className={cn(
                                                  "ml-auto w-3 h-3",
                                                  entries[index]?.vendorId === vendor.id ? "opacity-100" : "opacity-0",
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                          {entries[index]?.gcs === "G" && (
                            <Popover
                              open={glOpen === index}
                              onOpenChange={(open) => setGlOpen(open ? index : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-full justify-between text-xs px-2 border-0 hover:bg-slate-100"
                                >
                                  <span className="truncate">
                                    {entries[index]?.glAccountId
                                      ? chartOfAccounts?.find((a) => a.id === entries[index].glAccountId)?.accountName ||
                                      entries[index].glAccountId
                                      : "Select GL account..."}
                                  </span>
                                  <ChevronsUpDown className="w-3 h-3 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[320px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search accounts..." className="h-9 text-xs" />
                                  <CommandList>
                                    <CommandEmpty>No accounts found.</CommandEmpty>
                                    <CommandGroup>
                                      {chartOfAccounts?.map((account) => (
                                        <CommandItem
                                          key={account.id}
                                          value={account.id}
                                          onSelect={() => {
                                            setValue(`entries.${index}.glAccountId`, account.id)
                                            setGlOpen(null)
                                          }}
                                          className="text-xs"
                                        >
                                          {account.accountCode} - {account.accountName}
                                          <Check
                                            className={cn(
                                              "ml-auto w-3 h-3",
                                              entries[index]?.glAccountId === account.id ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </td>

                        {/* Reference */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Controller
                            control={control}
                            name={`entries.${index}.reference`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                className="h-8 text-xs border-0 focus-visible:ring-1 focus-visible:ring-primary px-2 font-mono"
                                placeholder="REF001"
                              />
                            )}
                          />
                        </td>

                        {/* Description */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Controller
                            control={control}
                            name={`entries.${index}.description`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                className="h-8 text-xs border-0 focus-visible:ring-1 focus-visible:ring-primary px-2"
                                placeholder="Enter description..."
                              />
                            )}
                          />
                        </td>

                        {/* Bank Amount */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Controller
                            control={control}
                            name={`entries.${index}.bankAmount`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                className="h-8 text-xs border-0 focus-visible:ring-1 focus-visible:ring-primary px-2 text-right font-mono"
                                placeholder="0.00"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            )}
                          />
                        </td>

                        {/* Discount */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Controller
                            control={control}
                            name={`entries.${index}.discount`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                className="h-8 text-xs border-0 focus-visible:ring-1 focus-visible:ring-primary px-2 text-right font-mono"
                                placeholder="0.00"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            )}
                          />
                        </td>

                        {/* VAT Code */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Controller
                            control={control}
                            name={`entries.${index}.vatCode`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                className="h-8 text-xs border-0 focus-visible:ring-1 focus-visible:ring-primary px-2"
                                placeholder="15%"
                              />
                            )}
                          />
                        </td>

                        {/* Project Code */}
                        <td className="border border-slate-200 px-1 py-1">
                          <Controller
                            control={control}
                            name={`entries.${index}.projectCode`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                className="h-8 text-xs border-0 focus-visible:ring-1 focus-visible:ring-primary px-2"
                                placeholder="PROJ001"
                              />
                            )}
                          />
                        </td>

                        <td className="border border-slate-200 px-1 py-1">
                          <div className="flex gap-1 justify-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-green-100 hover:text-green-700"
                              onClick={() => handleAddRow(index)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-red-100 hover:text-red-700"
                              onClick={() => handleDeleteRow(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between bg-card px-8 py-5 gap-6">
                <div className="flex gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRow(fields.length - 1)}
                    className="gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full"
                  >
                    Delete <kbd className="px-2 py-1 text-xs bg-muted rounded text-black">Ctrl+D</kbd>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRow(fields.length - 1)}
                    className="gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full"
                  >
                    Insert <kbd className="px-2 py-1 text-xs bg-muted rounded text-black">Ctrl+I</kbd>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openMatchingModal}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full"
                  >
                    Match <kbd className="px-2 py-1 text-xs bg-muted rounded text-black">F7</kbd>
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full">
                    Reconcile <kbd className="px-2 py-1 text-xs bg-muted rounded text-black">F7</kbd>
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full">
                    Inc / Exc <kbd className="px-2 py-1 text-xs bg-muted rounded text-black">F9</kbd>
                  </Button>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold whitespace-nowrap">Batch Total</span>
                    <Input
                      value={formatCurrency(batchTotal)}
                      readOnly
                      className="w-[180px] text-right font-mono bg-muted font-semibold"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="whitespace-nowrap bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700" 
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = '/sample-cashbook-transactions.csv'
                      link.download = 'sample-cashbook-transactions.csv'
                      link.click()
                      toast.success('Template downloaded')
                    }}
                  >
                    Download Template
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="whitespace-nowrap bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full" onClick={() => setImportOpen(true)}>
                    Import Batch
                  </Button>
                  <Button type="button" onClick={handleSave} className="gap-2 whitespace-nowrap bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
                    <Save className="w-4 h-4" />
                    Save Batch
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Submission
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to submit {entries.length === 1 ? 'this entry' : `these ${entries.length} entries`}? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={saving} className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full">
              {saving ? "Submitting..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with the following headers: <strong>bankName, transactionDate, description, amount, reference, counterpartyType, customerName, vendorName, glAccountNo, vatCode, projectCode, discount</strong>
            </p>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Need a template?</strong> Download the sample CSV template to get started.
              </p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/sample-cashbook-transactions.csv'
                  link.download = 'sample-cashbook-transactions.csv'
                  link.click()
                  toast.success('Template downloaded')
                }}
              >
                Download Sample Template
              </Button>
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="rounded-full"
            />
            {importPreviewCount !== null && (
              <p className="text-sm mt-2">Preview: {importPreviewCount} entries will be imported.</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setImportOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importFile} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* REPLACED: Custom Allocate Payment to Open Items modal */}
      <Dialog open={matchingOpen} onOpenChange={setMatchingOpen}>
        <DialogContent className="max-w-6xl md:max-w-6xl w-[90vw] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Allocate Payment to Open Items</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Transaction Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Payment</label>
              <Popover open={transactionDropdownOpen} onOpenChange={setTransactionDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={isFetchingTransactions}
                  >
                    {isFetchingTransactions ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading payments...
                      </>
                    ) : selectedTransactionId ? (
                      <span className="truncate">
                        {(() => {
                          const tx = transactions.find(t => t.id === selectedTransactionId)
                          if (!tx) return "Select payment..."
                          const counterparty = tx.customer?.name || tx.vendor?.name || "N/A"
                          // Show reference - amount - status - date
                          return `${tx.reference} — ${formatCurrency(Number(tx.amount))} — ${tx.status} — ${format(new Date(tx.transactionDate), "dd/MM/yyyy")} — ${counterparty}`
                        })()}
                      </span>
                    ) : (
                      "Select payment..."
                    )}
                    <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[700px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search payments..." />
                    <CommandList className="max-h-[400px]">
                      <CommandEmpty>No payments found.</CommandEmpty>
                      <CommandGroup>
                        {transactions.map((tx) => {
                          const counterparty = tx.customer?.name || tx.vendor?.name || "N/A"
                          const displayText = `${tx.reference} | ${formatCurrency(Number(tx.amount))} | ${tx.status} | ${format(new Date(tx.transactionDate), "dd/MM/yyyy")} | ${counterparty}`
                          return (
                            <CommandItem
                              key={tx.id}
                              value={tx.id}
                              onSelect={() => handleTransactionSelect(tx.id)}
                              className="text-xs"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">{displayText}</span>
                                <Check
                                  className={cn(
                                    "ml-2 w-4 h-4 flex-shrink-0",
                                    selectedTransactionId === tx.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Open Items Table */}
            {isFetchingOpenItems ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading open items...</span>
              </div>
            ) : openItems.length > 0 ? (
              <div className="overflow-auto border rounded-lg max-h-[400px]">
                <table className="w-full border-collapse min-w-max">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border px-2 py-1.5 text-left text-[11px] font-normal">Select</th>
                      <th className="border px-2 py-1.5 text-left text-[11px] font-normal">Invoice #</th>
                      <th className="border px-2 py-1.5 text-left text-[11px] font-normal">Due Date</th>
                      <th className="border px-2 py-1.5 text-right text-[11px] font-normal">Outstanding</th>
                      <th className="border px-2 py-1.5 text-right text-[11px] font-normal w-24">Allocated</th>
                      <th className="border px-2 py-1.5 text-right text-[11px] font-normal w-24">Discount</th>
                      <th className="border px-2 py-1.5 text-left text-[11px] font-normal">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openItems.map((item) => {
                      const allocation = selectedAllocations.find(a => a.openItemId === item.id)
                      const isSelected = !!allocation
                      return (
                        <tr key={item.id} className={cn(isSelected && "bg-blue-50")}>
                          <td className="border p-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAllocations([...selectedAllocations, {
                                    openItemId: item.id,
                                    allocatedAmount: Number(item.outstandingAmount),
                                    discountAmount: 0,
                                    description: item.description,
                                  }])
                                } else {
                                  setSelectedAllocations(selectedAllocations.filter(a => a.openItemId !== item.id))
                                }
                              }}
                            />
                          </td>
                          <td className="border p-2">{item.invoiceNumber}</td>
                          <td className="border p-2">{format(new Date(item.dueDate), "dd/MM/yyyy")}</td>
                          <td className="border p-2 text-right font-mono">
                            {formatCurrency(Number(item.outstandingAmount))}
                          </td>
                          <td className="border p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={allocation?.allocatedAmount || 0}
                              onChange={(e) => {
                                const amount = parseFloat(e.target.value) || 0
                                if (isSelected) {
                                  setSelectedAllocations(selectedAllocations.map(a =>
                                    a.openItemId === item.id ? { ...a, allocatedAmount: amount } : a
                                  ))
                                } else {
                                  setSelectedAllocations([...selectedAllocations, {
                                    openItemId: item.id,
                                    allocatedAmount: amount,
                                    discountAmount: 0,
                                    description: item.description,
                                  }])
                                }
                              }}
                              className="h-8 text-xs w-24 text-right font-mono"
                              disabled={!isSelected}
                            />
                          </td>
                          <td className="border p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={allocation?.discountAmount || 0}
                              onChange={(e) => {
                                const discount = parseFloat(e.target.value) || 0
                                if (isSelected) {
                                  setSelectedAllocations(selectedAllocations.map(a =>
                                    a.openItemId === item.id ? { ...a, discountAmount: discount } : a
                                  ))
                                }
                              }}
                              className="h-8 text-xs w-24 text-right font-mono"
                              disabled={!isSelected}
                            />
                          </td>
                          <td className="border p-2">
                            <Input
                              value={allocation?.description || item.description}
                              onChange={(e) => {
                                const desc = e.target.value
                                if (isSelected) {
                                  setSelectedAllocations(selectedAllocations.map(a =>
                                    a.openItemId === item.id ? { ...a, description: desc } : a
                                  ))
                                }
                              }}
                              className="h-8 text-xs w-full"
                              disabled={!isSelected}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : selectedTransactionId ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                No open items found for selected payment
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                Select a payment to see open items
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t px-6 py-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Allocated:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(
                    selectedAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Discount:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(
                    selectedAllocations.reduce((sum, a) => sum + a.discountAmount, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span>Total Amount:</span>
                <span className="font-mono">
                  {formatCurrency(
                    selectedAllocations.reduce((sum, a) => sum + a.allocatedAmount + a.discountAmount, 0)
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setMatchingOpen(false)
                  setSelectedTransactionId(null)
                  setOpenItems([])
                  setSelectedAllocations([])
                }}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMatchingConfirm}
                disabled={!selectedTransactionId || selectedAllocations.length === 0 || matchingSubmitting}
                className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-70"
              >
                {matchingSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Matching...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Allocations
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
