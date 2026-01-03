"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Building,
  Calendar as CalendarIcon,
  DollarSign,
  Send,
  CheckCircle,
  Loader2,
  X,
  CreditCard,
  Package
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PurchaseInvoice, AccountingCurrency, SubmitPurchaseInvoiceRequest, PayPurchaseInvoiceRequest, PurchaseInvoiceBank, accountingApi } from "@/lib/api/accounting-api"
import { ChartOfAccount } from "@/lib/api/chart-of-accounts-api"

interface PurchaseInvoiceViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  invoice: PurchaseInvoice | null
  currencies: AccountingCurrency[]
  onSubmit: (invoice: PurchaseInvoice, data: SubmitPurchaseInvoiceRequest) => Promise<PurchaseInvoice>
  onPay: (invoice: PurchaseInvoice, data: PayPurchaseInvoiceRequest) => Promise<PurchaseInvoice>
  onRefresh: (invoiceId: string) => Promise<PurchaseInvoice>
}

export function PurchaseInvoiceViewDrawer({
  isOpen,
  onClose,
  invoice,
  currencies,
  onSubmit,
  onPay,
  onRefresh
}: PurchaseInvoiceViewDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  
  // Submit form state
  const [submitData, setSubmitData] = useState<SubmitPurchaseInvoiceRequest>({
    paymentMethod: 'BANK',
    expenseAccountId: '',
    bankId: ''
  })
  
  // Payment form state
  const [paymentData, setPaymentData] = useState<PayPurchaseInvoiceRequest>({
    paymentMethod: 'BANK',
    bankId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    notes: ''
  })

  // Load banks and expense accounts
  const [banks, setBanks] = useState<PurchaseInvoiceBank[]>([])
  const [expenseAccounts, setExpenseAccounts] = useState<ChartOfAccount[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  useEffect(() => {
    if (isOpen && invoice) {
      loadBanksAndAccounts()
    }
  }, [isOpen, invoice])

  const loadBanksAndAccounts = async () => {
    try {
      setLoadingBanks(true)
      setLoadingAccounts(true)
      
      const [banksResponse, accountsResponse] = await Promise.all([
        accountingApi.getPurchaseInvoiceBanks(),
        accountingApi.getPurchaseInvoiceExpenseAccounts()
      ])

      if (banksResponse.success && banksResponse.data) {
        setBanks(banksResponse.data)
      }
      
      if (accountsResponse.success && accountsResponse.data) {
        setExpenseAccounts(accountsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load banks and accounts:', error)
    } finally {
      setLoadingBanks(false)
      setLoadingAccounts(false)
    }
  }

  const handleSubmit = async () => {
    if (!invoice) return

    if (!submitData.expenseAccountId || !submitData.bankId) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(invoice, submitData)
      setShowSubmitForm(false)
      setSubmitData({
        paymentMethod: 'BANK',
        expenseAccountId: '',
        bankId: ''
      })
      await onRefresh(invoice.id)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePay = async () => {
    if (!invoice) return

    if (!paymentData.bankId || !paymentData.paymentDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsPaying(true)
    try {
      await onPay(invoice, paymentData)
      setShowPaymentForm(false)
      setPaymentData({
        paymentMethod: 'BANK',
        bankId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentReference: '',
        notes: ''
      })
      await onRefresh(invoice.id)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsPaying(false)
    }
  }

  if (!invoice) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>Purchase Invoice Details</span>
              <p className="text-sm font-normal text-gray-500">
                {invoice.invoiceNumber}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badges */}
          <div className="flex gap-2">
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
            <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
              {invoice.paymentStatus}
            </Badge>
          </div>

          {/* Vendor Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold">Vendor Information</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <Label className="text-xs text-gray-500">Vendor Name</Label>
                <p className="font-medium">{invoice.vendor.name}</p>
              </div>
              {invoice.vendor.contactPerson && (
                <div>
                  <Label className="text-xs text-gray-500">Contact Person</Label>
                  <p className="text-sm">{invoice.vendor.contactPerson}</p>
                </div>
              )}
              {invoice.vendor.email && (
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="text-sm">{invoice.vendor.email}</p>
                </div>
              )}
              {invoice.vendor.phone && (
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p className="text-sm">{invoice.vendor.phone}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold">Invoice Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Invoice Date</Label>
                <p className="text-sm">{format(new Date(invoice.invoiceDate), "PPP")}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Due Date</Label>
                <p className="text-sm">{format(new Date(invoice.dueDate), "PPP")}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Currency</Label>
                <p className="text-sm">{invoice.currency.code} - {invoice.currency.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
                <p className="text-sm">{format(new Date(invoice.createdAt), "PPP")}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <p className="text-sm">{invoice.description}</p>
            </div>
            {invoice.notes && (
              <div>
                <Label className="text-xs text-gray-500">Notes</Label>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Invoice Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold">Invoice Items</h3>
            </div>
            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <p className="font-semibold">
                      {invoice.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Qty: {item.quantity} {item.unit}</span>
                    <span>Unit Price: {invoice.currency.symbol}{item.unitPrice.toFixed(2)}</span>
                    <span>VAT: {item.vatRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold">Financial Summary</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-medium">{invoice.currency.symbol}{invoice.subtotal}</span>
              </div>
              {invoice.isTaxable && (
                <div className="flex justify-between">
                  <span className="text-sm">VAT Amount</span>
                  <span className="font-medium">{invoice.currency.symbol}{invoice.vatAmount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span className="text-green-600">{invoice.currency.symbol}{invoice.totalAmount}</span>
              </div>
              {invoice.paymentStatus === 'PAID' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Paid Amount</span>
                    <span className="text-green-600">{invoice.currency.symbol}{invoice.paidAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Outstanding</span>
                    <span>{invoice.currency.symbol}{invoice.outstandingAmount}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {invoice.paymentStatus === 'PAID' && invoice.paymentDate && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold">Payment Information</h3>
                </div>
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Method</span>
                    <Badge variant="outline">{invoice.paymentMethod}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Date</span>
                    <span className="text-sm">{format(new Date(invoice.paymentDate), "PPP")}</span>
                  </div>
                  {invoice.paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-sm">Reference</span>
                      <span className="text-sm">{invoice.paymentReference}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Submit Form */}
          {showSubmitForm && invoice.status === 'DRAFT' && (
            <>
              <Separator />
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold">Submit Invoice</h3>
                
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={submitData.paymentMethod}
                    onValueChange={(value: 'BANK' | 'CASH') => 
                      setSubmitData(prev => ({ ...prev, paymentMethod: value }))
                    }
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

                <div className="space-y-2">
                  <Label>Expense Account *</Label>
                  <Select
                    value={submitData.expenseAccountId}
                    onValueChange={(value) => 
                      setSubmitData(prev => ({ ...prev, expenseAccountId: value }))
                    }
                    disabled={loadingAccounts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingAccounts ? "Loading..." : "Select expense account"} />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountNo} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bank Account *</Label>
                  <Select
                    value={submitData.bankId}
                    onValueChange={(value) => 
                      setSubmitData(prev => ({ ...prev, bankId: value }))
                    }
                    disabled={loadingBanks}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingBanks ? "Loading..." : "Select bank account"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} - {bank.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Invoice
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitForm(false)}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Payment Form */}
          {showPaymentForm && invoice.status === 'POSTED' && invoice.paymentStatus === 'PENDING' && (
            <>
              <Separator />
              <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold">Record Payment</h3>
                
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={paymentData.paymentMethod}
                    onValueChange={(value: 'BANK' | 'CASH') => 
                      setPaymentData(prev => ({ ...prev, paymentMethod: value }))
                    }
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

                <div className="space-y-2">
                  <Label>Bank Account *</Label>
                  <Select
                    value={paymentData.bankId}
                    onValueChange={(value) => 
                      setPaymentData(prev => ({ ...prev, bankId: value }))
                    }
                    disabled={loadingBanks}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingBanks ? "Loading..." : "Select bank account"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} - {bank.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !paymentData.paymentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentData.paymentDate ? (
                          format(new Date(paymentData.paymentDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={paymentData.paymentDate ? new Date(paymentData.paymentDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setPaymentData(prev => ({ ...prev, paymentDate: format(date, "yyyy-MM-dd") }))
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Payment Reference</Label>
                  <Input
                    value={paymentData.paymentReference}
                    onChange={(e) => 
                      setPaymentData(prev => ({ ...prev, paymentReference: e.target.value }))
                    }
                    placeholder="Enter payment reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={paymentData.notes}
                    onChange={(e) => 
                      setPaymentData(prev => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePay}
                    disabled={isPaying}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Record Payment
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={isPaying}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {invoice.status === 'DRAFT' && !showSubmitForm && (
              <Button
                onClick={() => setShowSubmitForm(true)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Invoice
              </Button>
            )}
            
            {invoice.status === 'POSTED' && invoice.paymentStatus === 'PENDING' && !showPaymentForm && (
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
