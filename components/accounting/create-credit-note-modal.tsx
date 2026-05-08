"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState } from "@/lib/store/store"
import { accountingApi, Invoice } from "@/lib/api/accounting-api"

interface CreateCreditNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preSelectedInvoice?: Invoice
}

export function CreateCreditNoteModal({ isOpen, onClose, onSuccess, preSelectedInvoice }: CreateCreditNoteModalProps) {
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [creditNoteDate, setCreditNoteDate] = useState<Date>(new Date())
  
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    totalAmount: '',
    reason: '',
    description: ''
  })

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadInvoices()
      if (preSelectedInvoice) {
        setFormData(prev => ({
          ...prev,
          invoiceId: preSelectedInvoice.id
        }))
        setSelectedInvoice(preSelectedInvoice)
      }
    }
  }, [isOpen, preSelectedInvoice])

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const response = await accountingApi.getInvoices({ status: 'SENT' })
      if (response.success) {
        setInvoices(response.data.invoices)
      } else {
        toast.error('Failed to load invoices')
      }
    } catch (error) {
      toast.error('Failed to load invoices')
    } finally {
      setLoadingInvoices(false)
    }
  }

  const resetForm = () => {
    setFormData({
      invoiceId: '',
      amount: '',
      totalAmount: '',
      reason: '',
      description: ''
    })
    setCreditNoteDate(new Date())
    setSelectedInvoice(null)
  }

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    setSelectedInvoice(invoice || null)
    setFormData(prev => ({
      ...prev,
      invoiceId
    }))
  }

  const handleAmountChange = (amount: string) => {
    setFormData(prev => ({
      ...prev,
      amount,
      totalAmount: amount // For now, assuming no VAT calculation
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.invoiceId || !formData.amount || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount <= 0) {
      toast.error('Credit amount must be greater than zero')
      return
    }

    if (selectedInvoice && amount > parseFloat(selectedInvoice.totalAmount)) {
      toast.error('Credit amount cannot exceed invoice total')
      return
    }

    try {
      setLoading(true)
      
      const data = {
        invoiceId: formData.invoiceId,
        amount,
        totalAmount: parseFloat(formData.totalAmount),
        reason: formData.reason,
        description: formData.description,
        creditNoteDate: format(creditNoteDate, 'yyyy-MM-dd')
      }

      const response = await accountingApi.createCreditNote(data)
      
      if (response.success) {
        toast.success('Credit note created successfully')
        resetForm()
        onSuccess()
      } else {
        toast.error(response.error || 'Failed to create credit note')
      }
    } catch (error: any) {
      toast.error('Failed to create credit note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-600" />
            Create Credit Note
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Invoice *</Label>
              <Select 
                value={formData.invoiceId} 
                onValueChange={handleInvoiceSelect}
                disabled={loadingInvoices || !!preSelectedInvoice}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder={loadingInvoices ? "Loading invoices..." : "Select an invoice"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {invoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <span className="text-xs text-gray-500">
                          {invoice.customer?.name} - {invoice.currency?.symbol}{invoice.totalAmount}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Credit Note Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full h-10 px-4",
                      !creditNoteDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {creditNoteDate ? format(creditNoteDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={creditNoteDate}
                    onSelect={(date) => date && setCreditNoteDate(date)}
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Selected Invoice Details */}
          {selectedInvoice && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Invoice Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Customer:</span>
                  <p className="font-medium">{selectedInvoice.customer?.name}</p>
                </div>
                <div>
                  <span className="text-blue-700">Total Amount:</span>
                  <p className="font-bold text-green-600">
                    {selectedInvoice.currency?.symbol}{selectedInvoice.totalAmount}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Credit Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter credit amount"
                required
                className="rounded-full"
              />
              {selectedInvoice && formData.amount && (
                <p className="text-xs text-gray-500 mt-1">
                  Max: {selectedInvoice.currency?.symbol}{selectedInvoice.totalAmount}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="totalAmount">Total Credit Amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                placeholder="Total including VAT"
                required
                className="rounded-full"
              />
            </div>
          </div>

          <div>
            <Label>Reason for Credit Note *</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => setFormData({...formData, reason: value})}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Product return">Product Return</SelectItem>
                <SelectItem value="Service issue">Service Issue</SelectItem>
                <SelectItem value="Billing error">Billing Error</SelectItem>
                <SelectItem value="Damaged goods">Damaged Goods</SelectItem>
                <SelectItem value="Customer complaint">Customer Complaint</SelectItem>
                <SelectItem value="Price adjustment">Price Adjustment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Additional details about the credit note..."
              rows={3}
              className="rounded-2xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              variant="gradient-danger"
              className="rounded-full h-10 px-6"
            >
              {loading ? 'Creating...' : 'Create Credit Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
