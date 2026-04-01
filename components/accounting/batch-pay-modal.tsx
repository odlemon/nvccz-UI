"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store/store"
import { accountingApi } from "@/lib/api/accounting-api"

interface BatchPayModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  selectedInvoices: any[]
}

const PAYMENT_METHODS = [
  { value: "BANK", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
]

export function BatchPayModal({ isOpen, onClose, onSuccess, selectedInvoices }: BatchPayModalProps) {
  const cashbookBanks = useSelector((state: RootState) => state.accounting.cashbookBanks)

  const [paymentMethod, setPaymentMethod] = useState("BANK")
  const [bankId, setBankId] = useState("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentReference, setPaymentReference] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("BANK")
      setBankId(cashbookBanks[0]?.id || "")
      setPaymentDate(new Date())
      setPaymentReference(`BATCH-${Date.now()}`)
      setNotes("")
    }
  }, [isOpen, cashbookBanks])

  const totalAmount = selectedInvoices.reduce((sum, inv) => {
    return sum + parseFloat(inv.totalAmount || inv.amount || "0")
  }, 0)

  const handleSubmit = async () => {
    if (!bankId && paymentMethod === "BANK") {
      toast.error("Please select a bank account")
      return
    }
    if (!paymentReference.trim()) {
      toast.error("Payment reference is required")
      return
    }

    setIsLoading(true)
    try {
      const response = await accountingApi.batchPayPurchaseInvoices({
        invoiceIds: selectedInvoices.map(inv => inv.id),
        paymentMethod,
        bankId,
        paymentDate: paymentDate.toISOString(),
        paymentReference,
        notes: notes || undefined,
      })

      if (response.success) {
        toast.success(`Successfully paid ${selectedInvoices.length} invoice(s)`)
        onSuccess()
        onClose()
      } else {
        throw new Error(response.error || "Batch payment failed")
      }
    } catch (error: any) {
      toast.error("Batch payment failed", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Batch Pay Invoices
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Invoices Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Selected Invoices</span>
              <Badge variant="outline">{selectedInvoices.length} invoice(s)</Badge>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{inv.invoiceNumber || inv.id.slice(0, 8)}</span>
                  <span className="font-mono">{parseFloat(inv.totalAmount || inv.amount || "0").toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-semibold text-green-700">{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account */}
          {paymentMethod === "BANK" && (
            <div className="space-y-2">
              <Label>Bank Account *</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {cashbookBanks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name} ({bank.accountNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(paymentDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label>Payment Reference *</Label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. BATCH-001"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="rounded-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Pay {selectedInvoices.length} Invoice(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
