'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProcurementPermissions } from '@/lib/hooks/useProcurementPermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProcurementInvoice, procurementApi } from '@/lib/api/procurement-api'
import { Building2, Mail, Phone, MapPin, Calendar, FileText, DollarSign, CheckCircle, Banknote, AlertCircle, Download } from 'lucide-react'
import { CiFileOn } from 'react-icons/ci'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface InvoiceDrawerContentProps {
  invoice: ProcurementInvoice
  onUpdate: () => void
  onProcessPayment: (invoice: ProcurementInvoice) => void
  onClose?: () => void
  actionButtons?: React.ReactNode
}

export function InvoiceDrawerContent({ invoice, onUpdate, onProcessPayment, onClose, actionButtons }: InvoiceDrawerContentProps) {
  const { permissions } = useProcurementPermissions()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [isTaxable, setIsTaxable] = useState(true)
  const [approving, setApproving] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  const currencySymbol = invoice.currency?.symbol || '$'

  useEffect(() => {
    // Dynamically import PDF components only on client
    import("@react-pdf/renderer").then((pdfModule) => {
      import("@/components/procurement/procurement-invoice-pdf").then((pdfComponent) => {
        setPDFComponents({
          PDFDownloadLink: pdfModule.PDFDownloadLink,
          ProcurementInvoicePDF: pdfComponent.default,
        })
      })
    })
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800'
      case 'MATCHED': return 'bg-green-100 text-green-800'
      case 'DISCREPANCY': return 'bg-orange-100 text-orange-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PAID': return 'bg-purple-100 text-purple-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchingStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      case 'MATCHED': return 'bg-green-100 text-green-800'
      case 'DISCREPANCY': return 'bg-red-100 text-red-800'
      case 'MANUAL_REVIEW': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800'
      case 'UNPAID': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleApprove = async () => {
    try {
      setApproving(true)
      await procurementApi.approveInvoice(invoice.id, isTaxable)
      toast.success('Invoice approved successfully')
      setShowApproveDialog(false)
      onUpdate()
    } catch (error: any) {
      toast.error('Failed to approve invoice', { description: error.message })
    } finally {
      setApproving(false)
    }
  }

  const canApprove = invoice.status === 'RECEIVED' || invoice.status === 'MATCHED'
  const canProcessPayment = invoice.status === 'APPROVED'

  return (
    <div className="space-y-6">
      {/* Status Card at Top */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold">{invoice.invoiceNumber}</h3>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status.replace('_', ' ')}
              </Badge>
              <Badge className={getMatchingStatusColor(invoice.matchingStatus)}>
                {invoice.matchingStatus.replace('_', ' ')}
              </Badge>
              {invoice.paymentStatus && (
                <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                  {invoice.paymentStatus.replace('_', ' ')}
                </Badge>
              )}
            </div>
            {invoice.purchaseOrder && (
              <p className="text-sm text-gray-600">
                PO: {invoice.purchaseOrder.purchaseOrderNumber}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Vendor Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg font-semibold">
                {getInitials(invoice.vendor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{invoice.vendor.name}</p>
              </div>
              {invoice.vendor.email && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="font-medium">{invoice.vendor.email}</p>
                </div>
              )}
              {invoice.vendor.phone && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium">{invoice.vendor.phone}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Invoice Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-medium">{format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className={cn(
                'font-medium',
                new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID' && 'text-red-600'
              )}>
                {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                {new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID' && (
                  <span className="ml-2 text-xs">(Overdue)</span>
                )}
              </p>
            </div>
            {invoice.receivedDate && (
              <div>
                <p className="text-sm text-gray-500">Received Date</p>
                <p className="font-medium">{format(new Date(invoice.receivedDate), 'MMM dd, yyyy')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Items & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                  <TableCell className="text-right">
                    {currencySymbol}{parseFloat(item.unitPrice.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currencySymbol}{parseFloat(item.totalPrice?.toString() || '0').toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">
                {currencySymbol}{parseFloat(invoice.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-600">Tax Amount:</span>
              <span className="font-semibold">
                {currencySymbol}{parseFloat(invoice.taxAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <span className="flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Total Amount:
              </span>
              <span>{currencySymbol}{parseFloat(invoice.totalAmount).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      {invoice.paymentDate && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-purple-600" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="font-medium">{format(new Date(invoice.paymentDate), 'MMM dd, yyyy')}</p>
              </div>
              {invoice.paymentReference && (
                <div>
                  <p className="text-sm text-gray-500">Payment Reference</p>
                  <p className="font-medium">{invoice.paymentReference}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journal Entry */}
      {invoice.journalEntry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Journal Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Reference Number</p>
                <p className="font-medium">{invoice.journalEntry.referenceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge>{invoice.journalEntry.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve invoice {invoice.invoiceNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currencySymbol}{parseFloat(invoice.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxable}
                  onChange={(e) => setIsTaxable(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Invoice is taxable</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={approving}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              variant="gradient-create"
              className="rounded-full h-10 px-6 shadow-sm"
            >
              {approving ? 'Approving...' : 'Approve Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
