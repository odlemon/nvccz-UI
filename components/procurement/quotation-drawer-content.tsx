"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Quotation } from "@/lib/api/procurement-api-v2"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface QuotationDrawerContentProps {
  quotation: Quotation
  onUpdate?: () => void
}

export function QuotationDrawerContent({ quotation, onUpdate }: QuotationDrawerContentProps) {
  const { permissions } = useProcurementPermissions()
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAccept = async () => {
    if (!permissions.canAcceptQuotation) {
      toast.error('You do not have permission to accept quotations')
      return
    }
    try {
      setProcessing(true)
      await procurementApiV2.acceptQuotation(quotation.id)
      toast.success('Quotation accepted successfully')
      setShowAcceptDialog(false)
      onUpdate?.()
    } catch (error: any) {
      toast.error('Failed to accept quotation', { description: error.message })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    if (!permissions.canRejectQuotation) {
      toast.error('You do not have permission to reject quotations')
      return
    }

    try {
      setProcessing(true)
      await procurementApiV2.rejectQuotation(quotation.id, {
        rejectionReason,
        reviewNotes: reviewNotes || undefined
      })
      toast.success('Quotation rejected')
      setShowRejectDialog(false)
      onUpdate?.()
    } catch (error: any) {
      toast.error('Failed to reject quotation', { description: error.message })
    } finally {
      setProcessing(false)
    }
  }

  const canReview = quotation.status === 'SUBMITTED' || quotation.status === 'UNDER_REVIEW'

  return (
    <div className="space-y-6">
      {/* Status and Actions Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {quotation.quotationNumber}
              </h3>
              <p className="text-sm text-gray-500 mt-1">RFQ: {quotation.rfqNumber}</p>
            </div>
            <Badge className={`${getStatusColor(quotation.status)} text-base px-4 py-2`}>
              {quotation.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Action Buttons */}
          {canReview && (
            <div className="flex gap-3 pt-4 border-t">
              {permissions.canAcceptQuotation && (
                <Button
                  onClick={() => setShowAcceptDialog(true)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Quotation
                </Button>
              )}
              {permissions.canRejectQuotation && (
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
            </div>
          )}

          {quotation.status === 'REJECTED' && quotation.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                  <p className="text-sm text-red-700 mt-1">{quotation.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-purple-600" />
            Vendor Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Company Name</label>
              <p className="mt-1 font-semibold text-lg">{quotation.companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tax EIN</label>
              <p className="mt-1">{quotation.taxEIN || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="mt-1">{quotation.vendorEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <p className="mt-1">{quotation.phoneNumber || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              <p className="mt-1 text-gray-700">{quotation.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Contact Person</label>
              <p className="mt-1">{quotation.contactPerson || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Valid Until
              </label>
              <p className="mt-1 font-medium">{format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-blue-600" />
            Items & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      {item.brand && (
                        <p className="text-xs text-gray-500">Brand: {item.brand}</p>
                      )}
                      {item.model && (
                        <p className="text-xs text-gray-500">Model: {item.model}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 max-w-xs">
                    {item.description || '-'}
                  </TableCell>
                  <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right font-medium">
                    {quotation.currencyCode} {parseFloat(item.unitPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {quotation.currencyCode} {parseFloat(item.totalPrice).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{quotation.currencyCode} {parseFloat(quotation.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{quotation.currencyCode} {parseFloat(quotation.taxAmount).toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Grand Total:
              </span>
              <span className="text-green-600">
                {quotation.currencyCode} {parseFloat(quotation.totalAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Terms</label>
              <p className="mt-1 font-medium">{quotation.paymentTerms || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Time</label>
              <p className="mt-1 font-medium">{quotation.deliveryTime || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Delivery Terms</label>
              <p className="mt-1">{quotation.deliveryTerms || '-'}</p>
            </div>
          </div>

          {quotation.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="mt-2 text-gray-700">{quotation.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Accept Quotation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this quotation from {quotation.companyName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this acceptance..."
                rows={3}
              />
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Total Amount: </span>
                {quotation.currencyCode} {parseFloat(quotation.totalAmount).toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {processing ? 'Processing...' : 'Confirm Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Quotation
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation from {quotation.companyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this quotation is being rejected..."
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="reviewNotesReject">Additional Notes (Optional)</Label>
              <Textarea
                id="reviewNotesReject"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="destructive"
            >
              {processing ? 'Processing...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
