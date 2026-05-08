"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { InvoiceMarkPaidForm } from "./invoice-mark-paid-form"
import { InvoiceVoidForm } from "./invoice-void-form"
import { CreateCreditNoteModal } from "./create-credit-note-modal"
import { 
  FileText,
  Building,
  DollarSign,
  Calendar,
  CreditCard,
  Hash,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle
} from "lucide-react"
import { Invoice, AccountingCurrency } from "@/lib/api/accounting-api"
import { useActiveAddress } from "@/lib/hooks/useActiveAddress"

interface InvoiceViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onSend?: (invoice: Invoice) => Promise<Invoice>
  onMarkAsPaid?: (invoice: Invoice, data: { paymentMethod: string; paymentCurrencyId: string }) => Promise<Invoice>
  onVoid?: (invoice: Invoice, data: { reason: string }) => Promise<Invoice>
  onEdit?: (invoice: Invoice) => void
  onRefresh?: (invoiceId: string) => Promise<Invoice>
  currencies: AccountingCurrency[]
}

export function InvoiceViewDrawer({ 
  isOpen, 
  onClose, 
  invoice,
  onSend,
  onMarkAsPaid,
  onVoid,
  onEdit,
  onRefresh,
  currencies
}: InvoiceViewDrawerProps) {
  // Confirmation dialog states
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isMarkPaidFormOpen, setIsMarkPaidFormOpen] = useState(false)
  const [isVoidFormOpen, setIsVoidFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(invoice)
  const [isCreateCreditNoteOpen, setIsCreateCreditNoteOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<any>(null)
  const letterheadAddress = useActiveAddress()

  // Update current invoice when prop changes
  useEffect(() => {
    setCurrentInvoice(invoice)
  }, [invoice])

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer").then((pdfModule) => {
      import("./invoice-pdf").then((pdfComponent) => {
        setPDFComponents({
          PDFDownloadLink: pdfModule.PDFDownloadLink,
          InvoicePDF: pdfComponent.default,
        })
      })
    })
  }, [])

  if (!currentInvoice) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />
      case 'SENT':
        return <Send className="w-4 h-4" />
      case 'DRAFT':
        return <Clock className="w-4 h-4" />
      case 'VOID':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'SENT':
        return 'bg-purple-100 text-purple-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'VOID':
        return 'bg-red-100 text-red-800'
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

  const calculateItemTotal = (item: any) => {
    if (item.quantity && item.unitPrice) {
      return item.quantity * item.unitPrice
    }
    return item.amount || 0
  }

  const handleSendClick = () => {
    setIsSendDialogOpen(true)
  }

  const handleConfirmSend = async () => {
    if (!currentInvoice || !onSend) return
    
    setIsLoading(true)
    try {
      const updatedInvoice = await onSend(currentInvoice)
      setCurrentInvoice(updatedInvoice)
      setIsSendDialogOpen(false)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsPaidClick = () => {
    setIsMarkPaidFormOpen(true)
  }

  const handleConfirmMarkAsPaid = async (data: { paymentMethod: string; paymentCurrencyId: string }) => {
    if (!currentInvoice || !onMarkAsPaid) return
    
    setIsLoading(true)
    try {
      const updatedInvoice = await onMarkAsPaid(currentInvoice, data)
      setCurrentInvoice(updatedInvoice)
      setIsMarkPaidFormOpen(false)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoidClick = () => {
    setIsVoidFormOpen(true)
  }

  const handleConfirmVoid = async (data: { reason: string }) => {
    if (!currentInvoice || !onVoid) return
    
    setIsLoading(true)
    try {
      const updatedInvoice = await onVoid(currentInvoice, data)
      setCurrentInvoice(updatedInvoice)
      setIsVoidFormOpen(false)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl">Details</span>
                  <p className="text-sm text-gray-600 font-normal">
                    {currentInvoice.invoiceNumber}
                  </p>
                </div>
              </SheetTitle>
              
              {/* Action Buttons */}
              <div className="mt-4 flex justify-end gap-2 flex-wrap">
                {currentInvoice.status === 'DRAFT' && onSend && (
                  <Button
                    size="sm"
                    variant="gradient-info"
                    className="rounded-full h-8 px-4"
                    onClick={handleSendClick}
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                )}
                
                {currentInvoice.status === 'SENT' && onMarkAsPaid && (
                  <Button
                    size="sm"
                    variant="gradient-create"
                    className="rounded-full h-8 px-4"
                    onClick={handleMarkAsPaidClick}
                    disabled={isLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Paid
                  </Button>
                )}
                
                {(currentInvoice.status === 'DRAFT' || currentInvoice.status === 'SENT') && onVoid && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 px-4 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleVoidClick}
                    disabled={isLoading}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Void
                  </Button>
                )}
                
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 px-4"
                    onClick={() => onEdit(currentInvoice)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                )}

                {(invoice?.status === 'SENT' || invoice?.status === 'PAID') && (
                  <Button 
                    onClick={() => setIsCreateCreditNoteOpen(true)}
                    variant="gradient-danger"
                    className="rounded-full h-8 px-4"
                    size="sm"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Create Credit Note
                  </Button>
                )}

                {isClient && currentInvoice && PDFComponents && (
                  <PDFComponents.PDFDownloadLink
                    document={
                      <PDFComponents.InvoicePDF
                        invoice={currentInvoice}
                        letterheadAddress={letterheadAddress}
                      />
                    }
                    fileName={`${currentInvoice.status === 'PAID' ? 'RECEIPT' : currentInvoice.invoiceNumber}.pdf`}
                  >
                    {({ loading: pdfLoading }: any) => (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-8 px-4"
                        disabled={pdfLoading}
                      >
                        <FileText className={`w-4 h-4 mr-1 ${pdfLoading ? "animate-spin" : ""}`} />
                        {pdfLoading ? "Generating..." : `Download ${currentInvoice.status === 'PAID' ? 'Receipt' : 'PDF'}`}
                      </Button>
                    )}
                  </PDFComponents.PDFDownloadLink>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            {/* Status Transition Banner */}
            {isLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="font-medium text-blue-900">Processing...</p>
                  <p className="text-sm text-blue-700">Updating invoice status</p>
                </div>
              </div>
            )}

            {/* Invoice Header Information */}
            <div className="grid grid-cols-2 gap-6">
              {/* Invoice Details */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
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
                    <Badge className={getStatusColor(currentInvoice.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(currentInvoice.status)}
                        {currentInvoice.status}
                      </div>
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Transaction Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{new Date(currentInvoice.transactionDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {currentInvoice.paymentDate && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{new Date(currentInvoice.paymentDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-600" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                        {getInitials(currentInvoice.customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{currentInvoice.customer.name}</p>
                      {currentInvoice.customer.contactPerson && (
                        <p className="text-sm text-gray-600">{currentInvoice.customer.contactPerson}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentInvoice.customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{currentInvoice.customer.email}</span>
                      </div>
                    )}
                    
                    {currentInvoice.customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{currentInvoice.customer.phone}</span>
                      </div>
                    )}
                    
                    {currentInvoice.customer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm leading-relaxed">{currentInvoice.customer.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Items Table */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-4 font-medium text-gray-600">Description</th>
                        {currentInvoice.items.some(item => item.quantity) && (
                          <th className="text-right p-4 font-medium text-gray-600">Qty</th>
                        )}
                        {currentInvoice.items.some(item => item.unitPrice) && (
                          <th className="text-right p-4 font-medium text-gray-600">Unit Price</th>
                        )}
                        {currentInvoice.items.some(item => item.category) && (
                          <th className="text-left p-4 font-medium text-gray-600">Category</th>
                        )}
                        <th className="text-right p-4 font-medium text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInvoice.items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-4">
                            <p className="font-medium">{item.description}</p>
                          </td>
                          {currentInvoice.items.some(item => item.quantity) && (
                            <td className="p-4 text-right">
                              {item.quantity || '-'}
                            </td>
                          )}
                          {currentInvoice.items.some(item => item.unitPrice) && (
                            <td className="p-4 text-right">
                              {item.unitPrice ? `${currentInvoice.currency.symbol}${item.unitPrice}` : '-'}
                            </td>
                          )}
                          {currentInvoice.items.some(item => item.category) && (
                            <td className="p-4">
                              {item.category && (
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
                            </td>
                          )}
                          <td className="p-4 text-right font-medium">
                            {currentInvoice.currency.symbol}{calculateItemTotal(item)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Totals */}
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
                      {currentInvoice.currency.symbol}{currentInvoice.amount}
                    </span>
                  </div>
                  
                  {currentInvoice.isTaxable && currentInvoice.vatAmount && (
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

                  {currentInvoice.equivalentAtCreation && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm text-gray-500">Equivalent Amount:</span>
                      <span className="text-sm font-medium text-gray-700">
                        {currentInvoice.equivalentAtCreation.currency.symbol}
                        {parseFloat(currentInvoice.equivalentAtCreation.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs text-gray-500 ml-1">
                          ({currentInvoice.equivalentAtCreation.currency.code})
                        </span>
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Currency</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {currentInvoice.currency.code}
                        </span>
                        <span className="text-sm text-gray-600">{currentInvoice.currency.name}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {currentInvoice.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

      {/* Send Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onConfirm={handleConfirmSend}
        title="Send Invoice"
        description={
          <div className="space-y-3">
            <p>Are you sure you want to send this invoice?</p>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">{currentInvoice?.invoiceNumber}</p>
                  <p className="text-sm text-purple-700">{currentInvoice?.customer.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-purple-600 font-medium">Amount:</span>
                  <span className="ml-2 font-semibold">{currentInvoice?.currency.symbol}{currentInvoice?.totalAmount}</span>
                </div>
                <div>
                  <span className="text-purple-600 font-medium">Date:</span>
                  <span className="ml-2">{currentInvoice && new Date(currentInvoice.transactionDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Once sent, the invoice status will change to "Sent" and can be marked as paid or voided.
            </p>
          </div>
        }
        confirmText="Send Invoice"
        cancelText="Cancel"
        variant="default"
        isLoading={isLoading}
        icon={<Send className="w-6 h-6 text-purple-500" />}
      />

      {/* Mark as Paid Form */}
      <InvoiceMarkPaidForm
        isOpen={isMarkPaidFormOpen}
        onClose={() => setIsMarkPaidFormOpen(false)}
        onConfirm={handleConfirmMarkAsPaid}
        invoice={currentInvoice}
        currencies={currencies}
        isLoading={isLoading}
      />

      {/* Void Form */}
      <InvoiceVoidForm
        isOpen={isVoidFormOpen}
        onClose={() => setIsVoidFormOpen(false)}
        onConfirm={handleConfirmVoid}
        invoice={currentInvoice}
        isLoading={isLoading}
      />

      {/* Create Credit Note Modal */}
      <CreateCreditNoteModal
        isOpen={isCreateCreditNoteOpen}
        onClose={() => setIsCreateCreditNoteOpen(false)}
        onSuccess={() => {
          setIsCreateCreditNoteOpen(false)
          toast.success('Credit note created successfully')
        }}
        preSelectedInvoice={invoice}
      />
    </>
  )
}