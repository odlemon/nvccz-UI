"use client"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RFQ, Quotation, RFQItem } from "@/lib/api/procurement-api-v2"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import { RFQClarifications } from "./rfq-clarifications"
import { RFQComparisonMatrix } from "./rfq-comparison-matrix"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ChevronDown, ChevronUp, Building2, Mail, Phone, MapPin, Package, DollarSign,
  Calendar, Clock, Globe, Copy, Check, BarChart2, FileText, User, Hash, Truck,
  StickyNote, Eye, EyeOff
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAppDispatch } from "@/lib/store"
import { extendRFQDeadline } from "@/lib/store/slices/procurementV2Slice"

interface RFQDrawerContentProps {
  rfq: RFQ
}

const toNumber = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  const parsed = parseFloat(val)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (val: string | number | null | undefined, currency = 'USD') => {
  return `${currency} ${toNumber(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RFQDrawerContent({ rfq: rfqProp }: RFQDrawerContentProps) {
  const dispatch = useAppDispatch()
  const [rfq, setRfq] = useState<RFQ>(rfqProp)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loadingQuotations, setLoadingQuotations] = useState(false)
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({})
  const [expandedQuotations, setExpandedQuotations] = useState<Record<string, boolean>>({})
  const [extendDeadlineOpen, setExtendDeadlineOpen] = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendingDeadline, setExtendingDeadline] = useState(false)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setRfq(rfqProp)
    loadQuotations()
  }, [rfqProp.rfqNumber])

  const loadQuotations = async () => {
    try {
      setLoadingQuotations(true)
      const response = await procurementApiV2.getQuotationsByRFQ(rfqProp.rfqNumber)
      if (response.success) {
        setQuotations(response.data ?? [])
        // Merge the richer RFQ snapshot returned by the API (has itemsSnapshot, closingAt, visibility, etc.)
        if (response.rfq) {
          setRfq(prev => ({ ...prev, ...response.rfq }))
        }
      }
    } catch (error: any) {
      console.error('Error loading quotations:', error)
      toast.error('Failed to load quotations')
    } finally {
      setLoadingQuotations(false)
    }
  }

  // Resolve items from either direct `items` field or `itemsSnapshot.items`
  const rfqItems: RFQItem[] = useMemo(() => {
    if (rfq.items && rfq.items.length > 0) return rfq.items
    if (rfq.itemsSnapshot?.items && rfq.itemsSnapshot.items.length > 0) return rfq.itemsSnapshot.items
    return []
  }, [rfq.items, rfq.itemsSnapshot])

  const closingDate = rfq.closingAt || rfq.rfqDeadline

  const toggleVendor = (vendorId: string) => {
    setExpandedVendors(prev => ({ ...prev, [vendorId]: !prev[vendorId] }))
  }

  const toggleQuotation = (id: string) => {
    setExpandedQuotations(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleExtendDeadline = async () => {
    if (!newDeadline.trim()) {
      toast.error('Please select a new deadline')
      return
    }
    if (!rfq.id) {
      toast.error('Cannot extend deadline: RFQ ID missing')
      return
    }
    setExtendingDeadline(true)
    try {
      await dispatch(extendRFQDeadline({ rfqId: rfq.id, newDeadline })).unwrap()
      toast.success('RFQ deadline extended successfully')
      setExtendDeadlineOpen(false)
      setNewDeadline('')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to extend deadline'
      toast.error('Failed to extend deadline', { description })
    } finally {
      setExtendingDeadline(false)
    }
  }

  const handleCopyPublicLink = async () => {
    const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/public-tenders/${rfq.rfqNumber}`
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Public tender link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'OPEN':
      case 'SENT': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOpen = rfq.status === 'OPEN' || rfq.status === 'SENT'

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="items">
          Items
          <Badge variant="secondary" className="ml-2">{rfqItems.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="quotations">
          Quotations
          <Badge variant="secondary" className="ml-2">{quotations.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="clarifications">Clarifications</TabsTrigger>
      </TabsList>

      {/* Details Tab */}
      <TabsContent value="details" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  RFQ Number
                </label>
                <p className="mt-1 text-base font-mono font-semibold">{rfq.rfqNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(rfq.status)}>{rfq.status}</Badge>
                  {rfq.visibility && (
                    <Badge variant="outline" className="gap-1">
                      {rfq.visibility === 'PUBLIC' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {rfq.visibility.replace('_', ' ')}
                    </Badge>
                  )}
                  {isOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExtendDeadlineOpen(true)}
                      className="gap-2 rounded-full h-9 px-4"
                    >
                      <Clock className="w-4 h-4" /> Extend
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Title
                </label>
                <p className="mt-1 text-base font-semibold">{rfq.title}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-700">{rfq.description || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Closing Date
                </label>
                <p className="mt-1">{closingDate ? format(new Date(closingDate), 'MMM dd, yyyy HH:mm') : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Expected Delivery
                </label>
                <p className="mt-1">{rfq.expectedDeliveryDate ? format(new Date(rfq.expectedDeliveryDate), 'MMM dd, yyyy') : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created
                </label>
                <p className="mt-1">{rfq.createdAt ? format(new Date(rfq.createdAt), 'MMM dd, yyyy') : '-'}</p>
              </div>
              {rfq.createdBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Created By
                  </label>
                  <p className="mt-1">{rfq.createdBy.firstName} {rfq.createdBy.lastName}</p>
                </div>
              )}
              {rfq.deliveryAddress && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </label>
                  <p className="mt-1 text-gray-700">{rfq.deliveryAddress}</p>
                </div>
              )}
              {rfq.specialRequirements && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Special Requirements
                  </label>
                  <p className="mt-1 text-gray-700">{rfq.specialRequirements}</p>
                </div>
              )}
              {rfq.status !== 'DRAFT' && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Public Tender URL
                  </label>
                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <code className="text-xs flex-1 truncate text-blue-600">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/public-tenders/{rfq.rfqNumber}
                    </code>
                    <Button size="sm" variant="ghost" onClick={handleCopyPublicLink} className="gap-1 rounded-full h-8 px-3">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-xs">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendors Section */}
        {rfq.vendors && rfq.vendors.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Vendors ({rfq.vendors.length})
              </h3>
              <div className="space-y-3">
                {rfq.vendors.map((vendor, index) => (
                  <Collapsible key={vendor.id ?? index}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-500 text-white font-semibold">
                            {getInitials(vendor.name || vendor.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {vendor.email}
                          </p>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => toggleVendor(vendor.id)} className="rounded-full h-9">
                          {expandedVendors[vendor.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2 ml-16 p-3 bg-white border rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="text-gray-500">Company</label>
                          <p className="font-medium">{vendor.name}</p>
                        </div>
                        <div>
                          <label className="text-gray-500">Email</label>
                          <p>{vendor.email}</p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Items Tab */}
      <TabsContent value="items" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {rfqItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No items found for this RFQ</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-gray-600">{item.description || '-'}</TableCell>
                      <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.unitPrice != null ? toNumber(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                      <TableCell className="text-right">{item.lineTotal != null ? toNumber(item.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Quotations Tab */}
      <TabsContent value="quotations" className="space-y-4">
        {quotations.length > 0 && (rfq.status === 'OPEN' || rfq.status === 'SENT' || rfq.status === 'CLOSED') && (
          <Button onClick={() => setMatrixOpen(true)} variant="gradient-info" className="gap-2 rounded-full h-10 px-6 shadow-sm">
            <BarChart2 className="w-4 h-4" /> View Comparison Matrix
          </Button>
        )}
        <Card>
          <CardContent className="pt-6">
            {loadingQuotations ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading quotations...</p>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No quotations received yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotations.map((quotation) => {
                  const isExpanded = !!expandedQuotations[quotation.id]
                  return (
                    <Collapsible key={quotation.id} open={isExpanded}>
                      <div className="border rounded-lg overflow-hidden">
                        {/* Header row */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-blue-500 text-white font-semibold">
                                {getInitials(quotation.companyName || quotation.vendorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold truncate">{quotation.companyName}</p>
                                <Badge variant="outline" className="font-mono text-xs">{quotation.quotationNumber}</Badge>
                                <Badge className={getQuotationStatusColor(quotation.status)}>
                                  {quotation.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {quotation.vendorEmail}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="font-bold text-green-700">{formatCurrency(quotation.totalAmount, quotation.currencyCode)}</p>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => toggleQuotation(quotation.id)} className="rounded-full h-9">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="p-4 space-y-4 bg-white border-t">
                            {/* Vendor & Contact Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Vendor Details
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <label className="text-gray-500">Contact Person</label>
                                  <p>{quotation.contactPerson || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                                  <p>{quotation.phoneNumber || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
                                  <p>{quotation.address || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-gray-500">Tax / EIN</label>
                                  <p>{quotation.taxEIN || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid Until</label>
                                  <p>{format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</p>
                                </div>
                              </div>
                            </div>

                            {/* Terms */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Terms
                              </h4>
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <label className="text-gray-500">Payment Terms</label>
                                  <p>{quotation.paymentTerms || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-gray-500">Delivery Terms</label>
                                  <p>{quotation.deliveryTerms || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-gray-500">Delivery Time</label>
                                  <p>{quotation.deliveryTime || '-'}</p>
                                </div>
                              </div>
                              {quotation.notes && (
                                <div className="mt-3 text-sm">
                                  <label className="text-gray-500">Notes</label>
                                  <p className="text-gray-700">{quotation.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* Line Items */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Package className="w-4 h-4" /> Line Items ({quotation.items?.length || 0})
                              </h4>
                              <div className="border rounded overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[40px]">#</TableHead>
                                      <TableHead>Item</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Brand</TableHead>
                                      <TableHead className="text-center">Qty</TableHead>
                                      <TableHead>Unit</TableHead>
                                      <TableHead className="text-right">Unit Price</TableHead>
                                      <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {quotation.items?.map((item, idx) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell className="font-medium">{item.itemName}</TableCell>
                                        <TableCell className="text-gray-600">{item.description || '-'}</TableCell>
                                        <TableCell>{item.brand || '-'}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell className="text-right">{toNumber(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-medium">{toNumber(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Financial Summary
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Subtotal</span>
                                  <span>{formatCurrency(quotation.subtotal, quotation.currencyCode)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tax</span>
                                  <span>{formatCurrency(quotation.taxAmount, quotation.currencyCode)}</span>
                                </div>
                                <div className="flex justify-between pt-2 mt-1 border-t font-semibold text-base">
                                  <span>Total</span>
                                  <span className="text-green-700">{formatCurrency(quotation.totalAmount, quotation.currencyCode)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Submission / Review */}
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 pt-2 border-t">
                              <div>
                                <label className="text-gray-500">Submitted At</label>
                                <p>{format(new Date(quotation.submittedAt), 'MMM dd, yyyy HH:mm')}</p>
                              </div>
                              {quotation.reviewedAt && (
                                <div>
                                  <label className="text-gray-500">Reviewed At</label>
                                  <p>{format(new Date(quotation.reviewedAt), 'MMM dd, yyyy HH:mm')}</p>
                                </div>
                              )}
                              {quotation.reviewNotes && (
                                <div className="col-span-2">
                                  <label className="text-gray-500">Review Notes</label>
                                  <p>{quotation.reviewNotes}</p>
                                </div>
                              )}
                              {quotation.rejectionReason && (
                                <div className="col-span-2">
                                  <label className="text-red-500">Rejection Reason</label>
                                  <p className="text-red-700">{quotation.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        {rfq.id && (
          <RFQComparisonMatrix rfqId={rfq.id} isOpen={matrixOpen} onClose={() => setMatrixOpen(false)} />
        )}
      </TabsContent>

      {/* Clarifications Tab */}
      <TabsContent value="clarifications" className="space-y-4">
        {rfq.id && <RFQClarifications rfqId={rfq.id} />}
      </TabsContent>

      {/* Extend Deadline Dialog */}
      <Dialog open={extendDeadlineOpen} onOpenChange={setExtendDeadlineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend RFQ Deadline</DialogTitle>
            <DialogDescription>
              Select a new closing date for this RFQ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">New Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setExtendDeadlineOpen(false)} className="rounded-full h-10 px-6">
                Cancel
              </Button>
              <Button
                onClick={handleExtendDeadline}
                disabled={extendingDeadline || !newDeadline}
                variant="gradient-create"
                className="rounded-full h-10 px-6 shadow-sm"
              >
                {extendingDeadline ? 'Extending...' : 'Extend Deadline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
