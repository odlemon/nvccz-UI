"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckCircle, Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Invoice, MarkAsPaidRequest, AccountingCurrency } from "@/lib/api/accounting-api"

interface MarkAsPaidModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: MarkAsPaidRequest) => void
  invoice: Invoice | null
  currencies: AccountingCurrency[]
  isLoading: boolean
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Credit/Debit Card' },
  { value: 'CHEQUE', label: 'Cheque' }
] as const

export function MarkAsPaidModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  invoice,
  currencies,
  isLoading 
}: MarkAsPaidModalProps) {
  const [formData, setFormData] = useState<MarkAsPaidRequest>({
    paymentMethod: 'BANK',
    paymentCurrencyId: invoice?.currencyId || ''
  })
  
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())

  if (!invoice) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(formData)
  }

  const handleInputChange = (field: keyof MarkAsPaidRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>Mark Invoice as Paid</span>
              <p className="text-sm text-gray-500 font-normal">
                {invoice.invoiceNumber} - {invoice.currency.symbol}{invoice.totalAmount}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange("paymentMethod", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Currency */}
          <div className="space-y-2">
            <Label htmlFor="paymentCurrencyId">Payment Currency *</Label>
            <Select
              value={formData.paymentCurrencyId}
              onValueChange={(value) => handleInputChange("paymentCurrencyId", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.filter(c => c.isActive).map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-full h-10",
                    !paymentDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full px-6 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              variant="gradient-update"
              className="rounded-full px-6 h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}