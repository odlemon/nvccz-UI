"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { sendPurchaseOrder, convertPOToBill } from "@/lib/store/slices/procurementV2Slice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PurchaseOrder } from "@/lib/api/procurement-api"
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

export function PODrawerContent({ po: initialPo, onSuccess, onCreateGRN }: PODrawerContentProps) {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const [po, setPo] = useState<PurchaseOrder>(initialPo)
  const [loadingPO, setLoadingPO] = useState(false)
  const [sendingPO, setSendingPO] = useState(false)
  const [convertingBill, setConvertingBill] = useState(false)
  const [grnLoading, setGrnLoading] = useState(false)
  const [poRefreshCounter, setPoRefreshCounter] = useState(0)

  const refreshPO = async () => {
    if (!po.id) return
    try {
      const response = await procurementApiV2.getPurchaseOrderById(po.id)
      if (response.success && response.data) {
        setPo(response.data as any)
        setPoRefreshCounter((c) => c + 1)
      }
    } catch (_e) {
      // silent — caller already toasts
    }
  }

  // Fetch the latest single PO from the API on open / id change so the drawer
  // always shows fresh, fully-populated data (nested vendor / currency / items / requisition / quotation).
  useEffect(() => {
    let cancelled = false
    const fetchSinglePO = async () => {
      if (!initialPo?.id) return
      setLoadingPO(true)
      try {
        const response = await procurementApiV2.getPurchaseOrderById(initialPo.id)
        if (cancelled) return
        if (response.success && response.data) {
          setPo(response.data as any)
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error('Failed to load purchase order', {
            description: typeof error === 'string' ? error : error?.message,
          })
        }
      } finally {
        if (!cancelled) setLoadingPO(false)
      }
    }
    setPo(initialPo)
    fetchSinglePO()
    return () => { cancelled = true }
  }, [initialPo?.id])

  const currencyCode = po.currency?.code || 'USD'
  const currencySymbol = po.currency?.symbol || ''
  const formatAmount = (raw: string | number | null | undefined) => {
    const n = typeof raw === 'number' ? raw : parseFloat((raw as string) || '0')
    return `${currencySymbol || currencyCode + ' '}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleSendPO = async () => {
    setSendingPO(true)
    try {
      await dispatch(sendPurchaseOrder(po.id)).unwrap()
      toast.success('PO sent to vendor successfully')
      await refreshPO()
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
      await refreshPO()
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

  if (loadingPO && !po.items?.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading purchase order...</span>
      </div>
    )
  }

  const tabTriggerCls =
    "flex items-center gap-2 px-0 pb-3 bg-transparent shadow-none rounded-none border-b-2 border-transparent transition-all " +
    "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"

  return (
    <div className="w-full space-y-4">
      {/* Top-right action row */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {po.status === 'DRAFT' && permissions.canCreatePurchaseOrder && (
          <Button
            onClick={handleSendPO}
            disabled={sendingPO}
            variant="gradient-info"
            className="gap-2 rounded-full h-9 px-4 shadow-sm"
          >
            {sendingPO ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to Vendor
              </>
            )}
          </Button>
        )}

        {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && permissions.canCreateGRN && (
          <Button
            onClick={() => onCreateGRN?.(po.id)}
            variant="gradient-create"
            className="gap-2 rounded-full h-9 px-4 shadow-sm"
          >
            <Package className="w-4 h-4" />
            Create GRN
          </Button>
        )}

        {po.status === 'RECEIVED' && permissions.canCreatePurchaseOrder && (
          <Button
            onClick={handleConvertToBill}
            disabled={convertingBill}
            variant="gradient-create"
            className="gap-2 rounded-full h-9 px-4 shadow-sm"
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

        {po.status === 'RECEIVED' && permissions.canCreatePurchaseOrder && (
          <Button
            onClick={handleGRNReturn}
            disabled={grnLoading}
            variant="gradient-danger"
            className="gap-2 rounded-full h-9 px-4 shadow-sm"
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

        <Button
          onClick={handleDownloadPDF}
          variant="gradient-info"
          className="gap-2 rounded-full h-9 px-4 shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="flex items-center justify-start gap-8 bg-transparent border-b rounded-none h-12 w-full px-0 mb-6">
          <TabsTrigger value="details" className={tabTriggerCls}>
            <FileText className="w-5 h-5" />
            <span className="font-medium">Details</span>
          </TabsTrigger>
          <TabsTrigger value="lines" className={tabTriggerCls}>
            <Package className="w-5 h-5" />
            <span className="font-medium">Line Items</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className={tabTriggerCls}>
            <Clock className="w-5 h-5" />
            <span className="font-medium">Timeline</span>
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
                  <p className="font-medium text-gray-900">{po.vendor?.name || 'Unknown Vendor'}</p>
                  {po.vendor?.email && <p className="text-sm text-gray-600">{po.vendor.email}</p>}
                  {po.vendor?.phone && <p className="text-sm text-gray-600">{po.vendor.phone}</p>}
                </div>
              </div>
              {po.requisition && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Requisition</label>
                  <p className="mt-1 text-gray-700 font-mono text-sm">{po.requisition.requisitionNumber}</p>
                  {po.requisition.title && (
                    <p className="text-xs text-gray-500">{po.requisition.title}</p>
                  )}
                </div>
              )}
              {po.quotation && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Quotation</label>
                  <p className="mt-1 text-gray-700 font-mono text-sm">{po.quotation.quotationNumber}</p>
                  {po.quotation.rfqNumber && (
                    <p className="text-xs text-gray-500">RFQ: {po.quotation.rfqNumber}</p>
                  )}
                </div>
              )}
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
                  Shipping Address
                </label>
                <p className="mt-1 text-gray-700">{po.shippingAddress || '-'}</p>
              </div>
              {(po.paymentTerms || po.deliveryTerms) && (
                <>
                  {po.paymentTerms && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                      <p className="mt-1 text-gray-700">{po.paymentTerms}</p>
                    </div>
                  )}
                  {po.deliveryTerms && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Delivery Terms</label>
                      <p className="mt-1 text-gray-700">{po.deliveryTerms}</p>
                    </div>
                  )}
                </>
              )}
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Amount
                </label>
                <div className="mt-1 space-y-1">
                  {po.subtotal && (
                    <div className="flex justify-between text-sm text-gray-600 max-w-xs">
                      <span>Subtotal</span>
                      <span>{formatAmount(po.subtotal)}</span>
                    </div>
                  )}
                  {po.taxAmount && (
                    <div className="flex justify-between text-sm text-gray-600 max-w-xs">
                      <span>Tax</span>
                      <span>{formatAmount(po.taxAmount)}</span>
                    </div>
                  )}
                  <p className="text-2xl font-bold text-gray-900 pt-1">
                    {currencyCode} {parseFloat(po.totalAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                      {po.status === 'DRAFT' && permissions.canUpdatePurchaseOrder && <TableHead className="w-[50px]">Action</TableHead>}
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
                          {currencyCode} {parseFloat(String(item.unitPrice ?? '0')).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {currencyCode} {(parseFloat(String(item.unitPrice ?? '0')) * parseFloat(String(item.quantity ?? '0'))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        {po.status === 'DRAFT' && permissions.canUpdatePurchaseOrder && (
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
        <PurchaseOrderTimeline poId={po.id} refreshTrigger={poRefreshCounter} />
      </TabsContent>
      </Tabs>
    </div>
  )
}
