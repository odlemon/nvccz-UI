"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { sendPurchaseOrder, convertPOToBill } from "@/lib/store/slices/procurementV2Slice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PurchaseOrder } from "@/lib/api/procurement-api-v2"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import { PurchaseOrderTimeline } from "./purchase-order-timeline"
import { Loader2, DollarSign, Calendar, MapPin, Send, Download, RotateCcw, Trash2, Package, FileText, Clock } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"

interface PODrawerContentProps {
  po: PurchaseOrder
  onSuccess?: () => void
  onCreateGRN?: (poId: string) => void
}

export function PODrawerContent({ po, onSuccess, onCreateGRN }: PODrawerContentProps) {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const [sendingPO, setSendingPO] = useState(false)
  const [convertingBill, setConvertingBill] = useState(false)
  const [grnLoading, setGrnLoading] = useState(false)

  const handleSendPO = async () => {
    setSendingPO(true)
    try {
      await dispatch(sendPurchaseOrder(po.id)).unwrap()
      toast.success('PO sent to vendor successfully')
      onSuccess?.()
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to send PO'
      toast.error('Failed to send PO', { description })
    } finally {
      setSendingPO(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const blob = await procurementApiV2.downloadPOPDF(po.id)
      const url = window.URL.createObjectURL(blob as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PO-${po.poNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      toast.error('Failed to download PO PDF')
    }
  }

  const handleConvertToBill = async () => {
    setConvertingBill(true)
    try {
      await dispatch(convertPOToBill(po.id)).unwrap()
      toast.success('PO converted to bill successfully')
      onSuccess?.()
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to convert to bill'
      toast.error('Failed to convert to bill', { description })
    } finally {
      setConvertingBill(false)
    }
  }

  const handleGRNReturn = async () => {
    if (!confirm('Are you sure you want to return this PO to the vendor?')) {
      return
    }

    setGrnLoading(true)
    try {
      await procurementApiV2.createGRNReturn({ purchaseOrderId: po.id })
      toast.success('GRN return-to-vendor created successfully')
      onSuccess?.()
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to create GRN return'
      toast.error('Failed to create GRN return', { description })
    } finally {
      setGrnLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'RECEIVED': return 'bg-green-100 text-green-800'
      case 'PAID': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="flex items-center justify-start gap-8 bg-transparent border-b rounded-none h-12 w-full px-0 mb-6">
        <TabsTrigger
          value="details"
          className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Details</span>
        </TabsTrigger>
        <TabsTrigger
          value="lines"
          className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Line Items</span>
        </TabsTrigger>
        <TabsTrigger
          value="timeline"
          className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
        >
          <Clock className="w-5 h-5" />
          <span className="font-medium">Timeline</span>
        </TabsTrigger>
        <TabsTrigger
          value="actions"
          className="flex items-center gap-2 px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent transition-all"
        >
          <Send className="w-5 h-5" />
          <span className="font-medium">Actions</span>
        </TabsTrigger>
      </TabsList>

      {/* Details Tab */}
      <TabsContent value="details" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">PO Number</label>
                <p className="mt-1 text-lg font-semibold text-blue-600">{po.poNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(po.status)}>
                    {po.status}
                  </Badge>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Vendor</label>
                <div className="mt-1 space-y-1">
                  <p className="font-medium text-gray-900">{po.vendorName || 'Unknown Vendor'}</p>
                  {po.vendorEmail && <p className="text-sm text-gray-600">{po.vendorEmail}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created Date
                </label>
                <p className="mt-1 text-gray-700">
                  {po.createdAt ? format(new Date(po.createdAt), 'MMM dd, yyyy') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Sent Date
                </label>
                <p className="mt-1 text-gray-700">
                  {po.sentAt ? format(new Date(po.sentAt), 'MMM dd, yyyy') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected Delivery
                </label>
                <p className="mt-1 text-gray-700">
                  {po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy') : '-'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </label>
                <p className="mt-1 text-gray-700">{po.deliveryAddress || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Amount
                </label>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {po.currencyCode || 'USD'} {parseFloat(po.totalAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Line Items Tab */}
      <TabsContent value="lines" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {po.items && po.items.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      {po.status === 'DRAFT' && permissions.canUpdatePO && <TableHead className="w-[50px]">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          {po.currencyCode || 'USD'} {parseFloat(item.unitPrice || '0').toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {po.currencyCode || 'USD'} {(parseFloat(item.unitPrice || '0') * parseFloat(item.quantity || '0')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        {po.status === 'DRAFT' && permissions.canUpdatePO && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              title="Cancel this line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No line items
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline" className="space-y-4">
        <PurchaseOrderTimeline poId={po.id} />
      </TabsContent>

      {/* Actions Tab */}
      <TabsContent value="actions" className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            {po.status === 'DRAFT' && permissions.canCreatePO && (
              <Button
                onClick={handleSendPO}
                disabled={sendingPO}
                variant="gradient-info"
                className="w-full gap-2 rounded-full h-10 px-6 shadow-sm"
              >
                {sendingPO ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send PO to Vendor
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="w-full gap-2 rounded-full h-10 px-6"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>

            {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && permissions.canCreateGRN && (
              <Button
                onClick={() => onCreateGRN?.(po.id)}
                variant="gradient-create"
                className="w-full gap-2 rounded-full h-10 px-6 shadow-sm"
              >
                <Package className="w-4 h-4" />
                Create GRN
              </Button>
            )}

            {po.status === 'RECEIVED' && permissions.canCreatePO && (
              <Button
                onClick={handleConvertToBill}
                disabled={convertingBill}
                variant="outline"
                className="w-full gap-2 rounded-full h-10 px-6"
              >
                {convertingBill ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Convert to Bill
                  </>
                )}
              </Button>
            )}

            {po.status === 'RECEIVED' && permissions.canCreatePO && (
              <Button
                onClick={handleGRNReturn}
                disabled={grnLoading}
                variant="outline"
                className="w-full gap-2 text-red-600 border-red-300 hover:bg-red-50 rounded-full h-10 px-6"
              >
                {grnLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Return to Vendor
                  </>
                )}
              </Button>
            )}

            {Object.values({ sendingPO, convertingBill, grnLoading }).every(v => !v) && (
              <div className="text-sm text-gray-500 text-center pt-4">
                {po.status === 'DRAFT' && 'Send this PO to the vendor'}
                {po.status === 'SENT' && 'Awaiting vendor acknowledgment and goods delivery'}
                {po.status === 'RECEIVED' && 'Convert to bill or return to vendor'}
                {po.status === 'PAID' && 'This PO is fully paid'}
                {po.status === 'CANCELLED' && 'This PO has been cancelled'}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
