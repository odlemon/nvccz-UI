'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { procurementApi, ProcurementInvoice } from '@/lib/api/procurement-api'
import { DollarSign, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface ProcessPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: ProcurementInvoice
  onSuccess: () => void
}

export function ProcessPaymentModal({ isOpen, onClose, invoice, onSuccess }: ProcessPaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(invoice.totalAmount)
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date())
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH'>('BANK')
  const [bankAccountId, setBankAccountId] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadBankAccounts()
    }
  }, [isOpen])

  const loadBankAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const response = await fetch('http://31.220.82.129:3010/api/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filter for bank/cash accounts
        const accounts = (data.data || []).filter((account: any) => 
          account.type === 'ASSET' && (
            account.name.toLowerCase().includes('bank') ||
            account.name.toLowerCase().includes('cash')
          )
        )
        setBankAccounts(accounts)
        if (accounts.length > 0 && !bankAccountId) {
          setBankAccountId(accounts[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load bank accounts:', error)
      toast.error('Failed to load bank accounts')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofOfPayment(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!paymentDate) {
      toast.error('Please select a payment date')
      return
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (paymentMethod === 'BANK' && !bankAccountId) {
      toast.error('Please select a bank account')
      return
    }

    if (!paymentReference.trim()) {
      toast.error('Please enter a payment reference')
      return
    }

    try {
      setSubmitting(true)
      
      const formData = new FormData()
      formData.append('paymentAmount', paymentAmount)
      formData.append('paymentDate', paymentDate.toISOString())
      formData.append('paymentMethod', paymentMethod)
      if (paymentMethod === 'BANK') {
        formData.append('bankAccountId', bankAccountId)
      }
      formData.append('paymentReference', paymentReference)
      if (notes) {
        formData.append('notes', notes)
      }
      if (proofOfPayment) {
        formData.append('proofOfPayment', proofOfPayment)
      }

      await procurementApi.processInvoicePayment(invoice.id, formData)
      
      toast.success('Payment processed successfully')
      onSuccess()
    } catch (error: any) {
      toast.error('Failed to process payment', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const remainingAmount = parseFloat(invoice.totalAmount) - (invoice.paymentStatus === 'PARTIALLY_PAID' ? 0 : 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Process payment for invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-600 font-medium">Invoice Details</p>
                <p className="text-lg font-bold text-blue-900">{invoice.invoiceNumber}</p>
                <p className="text-sm text-blue-700">Vendor: {invoice.vendor.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">
                  {invoice.currency.symbol}{parseFloat(invoice.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <Label htmlFor="paymentAmount" className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              Payment Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter payment amount"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {invoice.currency.symbol}{parseFloat(invoice.totalAmount).toFixed(2)}
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <Label className="mb-2 block">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              value={paymentDate}
              onChange={setPaymentDate}
              placeholder="Select payment date"
              allowFutureDates={false}
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentMethod" className="mb-2 block">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: 'BANK' | 'CASH') => setPaymentMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK">Bank Transfer</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account - Only show if BANK method */}
          {paymentMethod === 'BANK' && (
            <div>
              <Label htmlFor="bankAccountId" className="mb-2 block">
                Bank Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={bankAccountId}
                onValueChange={setBankAccountId}
                disabled={loadingAccounts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAccounts ? 'Loading accounts...' : 'Select bank account'} />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountNumber} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Reference */}
          <div>
            <Label htmlFor="paymentReference" className="mb-2 block">
              Payment Reference <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paymentReference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g., TXN-12345-2025"
              required
            />
          </div>

          {/* Proof of Payment */}
          <div>
            <Label htmlFor="proofOfPayment" className="mb-2 block">
              Proof of Payment
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {proofOfPayment ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{proofOfPayment.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(proofOfPayment.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setProofOfPayment(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload proof of payment</span>
                  <span className="text-xs text-gray-500">PDF, PNG, JPG, CSV (Max 10MB)</span>
                  <input
                    id="proofOfPayment"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.csv"
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="mb-2 block">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional payment notes"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {submitting ? 'Processing...' : 'Process Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
