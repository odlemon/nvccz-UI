"use client"

import { useState, useEffect } from "react"
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
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { RFQ, Quotation } from "@/lib/api/procurement-api-v2"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import { RFQClarifications } from "./rfq-clarifications"
import { RFQComparisonMatrix } from "./rfq-comparison-matrix"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, ChevronUp, Building2, Mail, Phone, MapPin, Package, DollarSign, Calendar, Clock, Globe, Copy, Check, BarChart2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAppDispatch } from "@/lib/store"
import { extendRFQDeadline } from "@/lib/store/slices/procurementV2Slice"

interface RFQDrawerContentProps {
  rfq: RFQ
}

export function RFQDrawerContent({ rfq }: RFQDrawerContentProps) {
  const dispatch = useAppDispatch()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loadingQuotations, setLoadingQuotations] = useState(false)
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({})
  const [extendDeadlineOpen, setExtendDeadlineOpen] = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendingDeadline, setExtendingDeadline] = useState(false)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadQuotations()
  }, [rfq.rfqNumber])

  const loadQuotations = async () => {
    try {
      setLoadingQuotations(true)
      const response = await procurementApiV2.getQuotationsByRFQ(rfq.rfqNumber)
      if (response.success && response.data) {
        setQuotations(response.data)
      }
    } catch (error: any) {
      console.error('Error loading quotations:', error)
      toast.error('Failed to load quotations')
    } finally {
      setLoadingQuotations(false)
    }
  }

  const toggleVendor = (vendorId: string) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }))
  }

  const handleExtendDeadline = async () => {
    if (!newDeadline.trim()) {
      toast.error('Please select a new deadline')
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
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
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

  const quotationColumns: Column<Quotation>[] = [
    {
      key: 'quotationNumber',
      label: 'Quote #',
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      )
    },
    {
      key: 'companyName',
      label: 'Vendor',
      render: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">{row.vendorEmail}</p>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold">{row.currencyCode} {parseFloat(value).toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge className={getQuotationStatusColor(value)}>
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'validUntil',
      label: 'Valid Until',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{format(new Date(value), 'MMM dd, yyyy')}</span>
        </div>
      )
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (value) => (
        <span className="text-sm text-gray-600">{format(new Date(value), 'MMM dd, yyyy')}</span>
      )
    }
  ]

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
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
                  <Building2 className="w-4 h-4" />
                  Title
                </label>
                <p className="mt-1 text-base font-semibold">{rfq.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={getStatusColor(rfq.status)}>
                    {rfq.status}
                  </Badge>
                  {rfq.status === 'SENT' && (
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
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-700">{rfq.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  RFQ Deadline
                </label>
                <p className="mt-1">{rfq.rfqDeadline ? format(new Date(rfq.rfqDeadline), 'MMM dd, yyyy') : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected Delivery
                </label>
                <p className="mt-1">{rfq.expectedDeliveryDate ? format(new Date(rfq.expectedDeliveryDate), 'MMM dd, yyyy') : '-'}</p>
              </div>
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
                  <label className="text-sm font-medium text-gray-500">Special Requirements</label>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyPublicLink}
                      className="gap-1 rounded-full h-8 px-3"
                    >
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
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Vendors ({rfq.vendors?.length || 0})
            </h3>
            <div className="space-y-3">
              {rfq.vendors?.map((vendor, index) => (
                <Collapsible key={index}>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVendor(vendor.id)}
                        className="rounded-full h-9"
                      >
                        {expandedVendors[vendor.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
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
      </TabsContent>

      {/* Items Tab */}
      <TabsContent value="items" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-gray-600">{item.description || '-'}</TableCell>
                    <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Quotations Tab */}
      <TabsContent value="quotations" className="space-y-4">
        {quotations.length > 0 && (rfq.status === 'SENT' || rfq.status === 'CLOSED') && (
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
              <ProcurementDataTable
                data={quotations as any}
                columns={quotationColumns as any}
                title=""
                showSearch={false}
                showFilters={false}
                emptyMessage="No quotations found"
              />
            )}
          </CardContent>
        </Card>
        <RFQComparisonMatrix rfqId={rfq.id} isOpen={matrixOpen} onClose={() => setMatrixOpen(false)} />
      </TabsContent>

      {/* Clarifications Tab */}
      <TabsContent value="clarifications" className="space-y-4">
        <RFQClarifications rfqId={rfq.id} />
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
