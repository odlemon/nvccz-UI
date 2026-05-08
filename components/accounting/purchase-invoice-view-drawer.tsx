"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  FileText, 
  Building, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Package, 
  CreditCard,
  Send,
  CheckCircle,
  Trash2,
  Edit,
  AlertTriangle,
  Loader2,
  X,
  Hash,
  Mail,
  Phone,
  MapPin
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import type { RootState } from "@/lib/store"
import { useActiveAddress } from "@/lib/hooks/useActiveAddress"
import { 
  submitPurchaseInvoice, 
  payPurchaseInvoice, 
  deletePurchaseInvoice,
  fetchPurchaseInvoiceById 
} from "@/lib/store/slices/purchase-invoices-slice"
import type { 
  AccountingCurrency, 
  PurchaseInvoice, 
  SubmitPurchaseInvoiceRequest, 
  PayPurchaseInvoiceRequest,
  PurchaseInvoiceBank
} from "@/lib/api/accounting-api"
import type { ChartOfAccount } from "@/lib/api/chart-of-accounts-api"
import { accountingApi } from "@/lib/api/accounting-api"
import { CreatePurchaseInvoiceModal } from "./create-purchase-invoice-modal"

interface PurchaseInvoiceViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  invoice: PurchaseInvoice | null
  onEdit?: (invoice: PurchaseInvoice) => void
  currencies: AccountingCurrency[]
  vendors: any[]
}

// Confirmation Dialog Component
function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default",
  isLoading = false,
  icon
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmText: string
  cancelText: string
  variant?: "default" | "destructive"
  isLoading?: boolean
  icon?: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-4">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <div className="text-sm text-gray-600 mb-4">{description}</div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-full h-10 px-6"
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === "destructive" ? "gradient-danger" : "gradient-create"}
                onClick={onConfirm}
                disabled={isLoading}
                className="rounded-full h-10 px-6 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PurchaseInvoiceViewDrawer({
  isOpen,
  onClose,
  invoice,
  onEdit,
  currencies,
  vendors
}: PurchaseInvoiceViewDrawerProps) {
  const dispatch = useAppDispatch()
  const { loading } = useAppSelector((state: RootState) => state.purchaseInvoices)
  
  const [currentInvoice, setCurrentInvoice] = useState<PurchaseInvoice | null>(invoice)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<any>(null)
  const letterheadAddress = useActiveAddress()
  
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
    setCurrentInvoice(invoice)
  }, [invoice])

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer").then((pdfModule) => {
      import("./purchase-invoice-pdf").then((pdfComponent) => {
        setPDFComponents({
          PDFDownloadLink: pdfModule.PDFDownloadLink,
          PurchaseInvoicePDF: pdfComponent.default,
        })
      })
    })
  }, [])

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

  if (!currentInvoice) return null

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const handleSubmitClick = () => {
    onClose()
    setTimeout(() => setIsSubmitDialogOpen(true), 200)
  }

  const handleConfirmSubmit = async () => {
    if (!currentInvoice) return

    if (!submitData.expenseAccountId || !submitData.bankId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await dispatch(submitPurchaseInvoice({ 
        id: currentInvoice.id, 
        data: submitData 
      })).unwrap()
      
      if (result) {
        setCurrentInvoice(result)
      }
      setIsSubmitDialogOpen(false)
      setSubmitData({
        paymentMethod: 'BANK',
        expenseAccountId: '',
        bankId: ''
      })
      toast.success('Purchase invoice submitted successfully')
    } catch (error: any) {
      toast.error('Failed to submit purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
    }
  }

  const handlePayClick = () => {
    onClose()
    setTimeout(() => setIsPayDialogOpen(true), 200)
  }

  const handleConfirmPay = async () => {
    if (!currentInvoice) return

    if (!paymentData.bankId || !paymentData.paymentDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await dispatch(payPurchaseInvoice({ 
        id: currentInvoice.id, 
        data: paymentData 
      })).unwrap()
      
      if (result) {
        setCurrentInvoice(result)
      }
      setIsPayDialogOpen(false)
      setPaymentData({
        paymentMethod: 'BANK',
        bankId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentReference: '',
        notes: ''
      })
      toast.success('Payment recorded successfully')
    } catch (error: any) {
      toast.error('Failed to record payment', {
        description: error.message || 'Unknown error occurred'
      })
    }
  }

  const handleDeleteClick = () => {
    onClose()
    setTimeout(() => setIsDeleteDialogOpen(true), 200)
  }

  const handleConfirmDelete = async () => {
    if (!currentInvoice) return

    try {
      await dispatch(deletePurchaseInvoice(currentInvoice.id)).unwrap()
      toast.success('Purchase invoice deleted successfully')
      setIsDeleteDialogOpen(false)
      onClose()
    } catch (error: any) {
      toast.error('Failed to delete purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
    }
  }

  const handleEditClick = () => {
    if (currentInvoice) {
      setIsEditModalOpen(true)
    }
  }

  const handleEditSuccess = async () => {
    if (currentInvoice) {
      try {
        const result = await dispatch(fetchPurchaseInvoiceById(currentInvoice.id)).unwrap()
        if (result) {
          setCurrentInvoice(result)
        }
        setIsEditModalOpen(false)
        toast.success('Purchase invoice updated successfully')
      } catch (error) {
        console.error('Failed to refresh invoice:', error)
      }
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl">Purchase Invoice Details</span>
                  <p className="text-sm text-gray-600 font-normal">
                    {currentInvoice.invoiceNumber}
                  </p>
                </div>
              </SheetTitle>
              
              {/* Action Buttons */}
              <div className="mt-4 flex justify-end gap-2 flex-wrap">
                {currentInvoice.status === 'DRAFT' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 px-4"
                      onClick={handleEditClick}
                      disabled={loading}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 px-4 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleDeleteClick}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="gradient-info"
                      className="rounded-full h-8 px-4 shadow-sm"
                      onClick={handleSubmitClick}
                      disabled={loading}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Submit
                    </Button>
                  </>
                )}
                
                {currentInvoice.status === 'POSTED' && currentInvoice.paymentStatus === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="gradient-create"
                    className="rounded-full h-8 px-4 shadow-sm"
                    onClick={handlePayClick}
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Record Payment
                  </Button>
                )}

                {isClient && currentInvoice && PDFComponents && (
                  <PDFComponents.PDFDownloadLink
                    document={
                      <PDFComponents.PurchaseInvoicePDF
                        invoice={currentInvoice}
                        letterheadAddress={letterheadAddress}
                      />
                    }
                    fileName={`${currentInvoice.paymentStatus === 'PAID' ? 'RECEIPT' : currentInvoice.invoiceNumber}.pdf`}
                  >
                    {({ loading: pdfLoading }: any) => (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-8 px-4"
                        disabled={pdfLoading}
                      >
                        <FileText className={`w-4 h-4 mr-1 ${pdfLoading ? "animate-spin" : ""}`} />
                        {pdfLoading ? "Generating..." : `Download ${currentInvoice.paymentStatus === 'PAID' ? 'Receipt' : 'PDF'}`}
                      </Button>
                    )}
                  </PDFComponents.PDFDownloadLink>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            {/* Status Transition Banner */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="font-medium text-blue-900">Processing...</p>
                  <p className="text-sm text-blue-700">Updating purchase invoice</p>
                </div>
              </div>
            )}

            {/* Invoice Header Information */}
            <div className="grid grid-cols-2 gap-6">
              {/* Invoice Details */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Invoice Number</p>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <p className="font-mono text-sm">{currentInvoice.invoiceNumber}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(currentInvoice.status)}>
                        {currentInvoice.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(currentInvoice.paymentStatus)}>
                        {currentInvoice.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Invoice Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{format(new Date(currentInvoice.invoiceDate), "PPP")}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{format(new Date(currentInvoice.dueDate), "PPP")}</p>
                    </div>
                  </div>

                  {currentInvoice.paymentDate && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Date</p>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{format(new Date(currentInvoice.paymentDate), "PPP")}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vendor Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-600" />
                    Vendor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                        {getInitials(currentInvoice.vendor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{currentInvoice.vendor.name}</p>
                      {currentInvoice.vendor.contactPerson && (
                        <p className="text-sm text-gray-600">{currentInvoice.vendor.contactPerson}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentInvoice.vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{currentInvoice.vendor.email}</span>
                      </div>
                    )}
                    
                    {currentInvoice.vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{currentInvoice.vendor.phone}</span>
                      </div>
                    )}
                    
                    {currentInvoice.vendor.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm leading-relaxed">{currentInvoice.vendor.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {currentInvoice.description && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{currentInvoice.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Invoice Items */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Item</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Unit Price</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">VAT</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{item.itemName}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{item.quantity} {item.unit}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{currentInvoice.currency.symbol}{Number(item.unitPrice).toFixed(2)}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{(Number(item.vatRate) * 100).toFixed(0)}%</span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-semibold">
                              {currentInvoice.currency.symbol}{(item.quantity * Number(item.unitPrice)).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Summary */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {currentInvoice.currency.symbol}{currentInvoice.subtotal}
                    </span>
                  </div>
                  
                  {currentInvoice.isTaxable && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">VAT/Tax:</span>
                      <span className="font-medium">
                        {currentInvoice.currency.symbol}{currentInvoice.vatAmount}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {currentInvoice.currency.symbol}{currentInvoice.totalAmount}
                    </span>
                  </div>

                  {currentInvoice.paymentStatus === 'PAID' && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Paid Amount:</span>
                        <span className="text-green-600 font-medium">
                          {currentInvoice.currency.symbol}{currentInvoice.paidAmount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium">
                          {currentInvoice.currency.symbol}{currentInvoice.outstandingAmount}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Currency</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{currentInvoice.currency.code} - {currentInvoice.currency.name}</span>
                      </div>
                    </div>
                    
                    {currentInvoice.paymentMethod && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {currentInvoice.paymentMethod}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {currentInvoice.paymentStatus === 'PAID' && currentInvoice.paymentDate && (
              <Card className="shadow-sm border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Payment Method:</span>
                    <Badge variant="outline" className="bg-white">{currentInvoice.paymentMethod}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Payment Date:</span>
                    <span className="text-sm font-medium">{format(new Date(currentInvoice.paymentDate), "PPP")}</span>
                  </div>
                  {currentInvoice.paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Reference:</span>
                      <span className="text-sm font-medium">{currentInvoice.paymentReference}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {currentInvoice.notes && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{currentInvoice.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Journal Entry Information */}
            {currentInvoice.journalEntry && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Journal Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reference Number</p>
                      <p className="font-mono text-sm">{currentInvoice.journalEntry.referenceNumber}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      <Badge variant="outline">
                        {currentInvoice.journalEntry.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Submit Dialog with Form */}
      <ConfirmationDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Purchase Invoice"
        description={
          <div className="space-y-4">
            <p>Submit this purchase invoice for posting?</p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{currentInvoice?.invoiceNumber}</p>
                  <p className="text-sm text-blue-700">{currentInvoice?.vendor.name}</p>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-blue-600 font-medium">Amount:</span>
                <span className="ml-2 font-semibold">{currentInvoice?.currency.symbol}{currentInvoice?.totalAmount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
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
                  <SelectContent className="z-[110]">
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
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
                  <SelectContent className="z-[110]">
                    {expenseAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountNo} - {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
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
                  <SelectContent className="z-[110]">
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name} - {bank.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        }
        confirmText="Submit Invoice"
        cancelText="Cancel"
        variant="default"
        isLoading={loading}
        icon={<Send className="w-6 h-6 text-blue-500" />}
      />

      {/* Payment Dialog with Form */}
      <ConfirmationDialog
        isOpen={isPayDialogOpen}
        onClose={() => setIsPayDialogOpen(false)}
        onConfirm={handleConfirmPay}
        title="Record Payment"
        description={
          <div className="space-y-4">
            <p>Record payment for this purchase invoice?</p>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">{currentInvoice?.invoiceNumber}</p>
                  <p className="text-sm text-green-700">{currentInvoice?.vendor.name}</p>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-green-600 font-medium">Amount:</span>
                <span className="ml-2 font-semibold">{currentInvoice?.currency.symbol}{currentInvoice?.totalAmount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
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
                  <SelectContent className="z-[110]">
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
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
                  <SelectContent className="z-[110]">
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name} - {bank.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-full h-10 px-4",
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

              <div>
                <Label>Payment Reference</Label>
                <Input
                  value={paymentData.paymentReference}
                  onChange={(e) => 
                    setPaymentData(prev => ({ ...prev, paymentReference: e.target.value }))
                  }
                  placeholder="Enter payment reference"
                />
              </div>

              <div>
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
            </div>
          </div>
        }
        confirmText="Record Payment"
        cancelText="Cancel"
        variant="default"
        isLoading={loading}
        icon={<CheckCircle className="w-6 h-6 text-green-500" />}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Invoice"
        description={
          <div className="space-y-3">
            <p>Are you sure you want to delete this purchase invoice?</p>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">{currentInvoice?.invoiceNumber}</p>
                  <p className="text-sm text-red-700">{currentInvoice?.vendor.name}</p>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-red-600 font-medium">Amount:</span>
                <span className="ml-2 font-semibold">{currentInvoice?.currency.symbol}{currentInvoice?.totalAmount}</span>
              </div>
            </div>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete Invoice"
        cancelText="Cancel"
        variant="destructive"
        isLoading={loading}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      />

      {/* Edit Modal */}
      <CreatePurchaseInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        currencies={currencies}
        vendors={vendors}
        invoice={currentInvoice}
      />
    </>
  )
}
