import { Button } from "@/components/ui/button"
import { Download, Loader2, Upload as UploadIcon, Calendar as CalendarIcon, Building2 } from "lucide-react"
import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchCashbookBanks } from "@/lib/store/slices/accountingSlice"
import { downloadAsCSV } from "@/lib/utils/export-utils"

export function BankReconciliationUploadModal({
  open,
  onClose,
  onUpload,
  loading
}: {
  open: boolean
  onClose: () => void
  onUpload: (payload: any) => Promise<void>
  loading: boolean
}) {
  const dispatch = useDispatch<AppDispatch>()
  const { cashbookBanks } = useSelector((state: RootState) => state.accounting)
  
  const [localLoading, setLocalLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [bankId, setBankId] = useState<string>("")
  const [statementDate, setStatementDate] = useState<Date | undefined>(new Date())
  const [openingBalance, setOpeningBalance] = useState<string>("0")
  const [closingBalance, setClosingBalance] = useState<string>("0")

  useEffect(() => {
    if (open) {
      dispatch(fetchCashbookBanks())
    }
  }, [open, dispatch])

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/)
    if (lines.length < 2) return []

    // Expecting headers: transactionDate, valueDate, reference, description, debitAmount, creditAmount, balance
    const headers = lines[0].split(',').map(h => h.trim())
    const items = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue
      const currentline = lines[i].split(',')
      if (currentline.length < headers.length) continue

      const item: any = {}
      headers.forEach((header, index) => {
        const val = currentline[index]?.trim() || ""
        if (['debitAmount', 'creditAmount', 'balance', 'openingBalance', 'closingBalance'].includes(header)) {
          item[header] = parseFloat(val) || 0
        } else {
          item[header] = val
        }
      })
      items.push(item)
    }
    return items
  }

  const handleDownloadSample = () => {
    const headers = ['transactionDate', 'valueDate', 'reference', 'description', 'debitAmount', 'creditAmount', 'balance']
    const sampleData = [
      {
        transactionDate: '2025-04-01',
        valueDate: '2025-04-01',
        reference: 'REF001',
        description: 'Sample Deposit',
        debitAmount: 0,
        creditAmount: 1000.00,
        balance: 1000.00
      },
      {
        transactionDate: '2025-04-02',
        valueDate: '2025-04-02',
        reference: 'REF002',
        description: 'Sample Withdrawal',
        debitAmount: 200.00,
        creditAmount: 0,
        balance: 800.00
      }
    ]
    downloadAsCSV(sampleData, headers, 'bank_reconciliation_template')
  }

  const handleUpload = async () => {
    if (!uploadFile || !bankId || !statementDate) {
      toast.error("Please fill in all fields and select a file")
      return
    }

    setLocalLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const items = parseCSV(text)

        if (items.length === 0) {
          toast.error("No valid transactions found in the CSV")
          setLocalLoading(false)
          return
        }

        const payload = {
          bankId,
          statementDate: format(statementDate, 'yyyy-MM-dd'),
          openingBalance: parseFloat(openingBalance),
          closingBalance: parseFloat(closingBalance),
          items
        }

        try {
          await onUpload(payload)
          toast.success("Bank statement uploaded successfully")
          setLocalLoading(false)
          onClose()
          setUploadFile(null)
          setBankId("")
          setOpeningBalance("0")
          setClosingBalance("0")
        } catch (err: any) {
          const msg = err?.message || err?.error || "Failed to upload file"
          toast.error(msg)
          setLocalLoading(false)
        }
      }
      reader.onerror = () => {
        toast.error("Failed to read file")
        setLocalLoading(false)
      }
      reader.readAsText(uploadFile)
    } catch (err: any) {
      toast.error("An error occurred during file processing")
      setLocalLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-lg border border-gray-200 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Upload Bank Statement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="bank">Select Bank</Label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger id="bank" className="rounded-xl">
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                {cashbookBanks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.bankName} ({bank.accountNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Statement Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl",
                    !statementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {statementDate ? format(statementDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={statementDate}
                  onSelect={setStatementDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening Balance</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closingBalance">Closing Balance</Label>
            <Input
              id="closingBalance"
              type="number"
              step="0.01"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">Upload CSV</Label>
          <label
            htmlFor="bank-statement-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:bg-blue-50 transition"
          >
            <UploadIcon className="w-10 h-10 text-blue-500 mb-2" />
            <span className="text-blue-700 font-medium">
              {uploadFile ? uploadFile.name : "Select CSV file to upload"}
            </span>
            <span className="text-xs text-gray-500 mt-1">Accepted: .csv only</span>
            <input
              id="bank-statement-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (!localLoading && !loading) {
                onClose()
              }
            }}
            className="rounded-full px-6"
            disabled={localLoading || loading}
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="rounded-full px-6 flex items-center"
              onClick={handleDownloadSample}
              type="button"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full px-8 flex items-center"
              onClick={handleUpload}
              disabled={localLoading || loading || !uploadFile || !bankId}
            >
              {(localLoading || loading) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UploadIcon className="w-4 h-4 mr-2" />
              )}
              {(localLoading || loading) ? "Uploading..." : "Upload & Reconcile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
