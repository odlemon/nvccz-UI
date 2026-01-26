// ============================================================================
// VENDOR RFQ DETAILS & QUOTATION SUBMISSION
// Public page - no authentication, accessed via email link
// ============================================================================

'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Calendar,
  Package,
  FileText,
  DollarSign,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface QuotationItem {
  itemId: string
  itemName: string
  requestedQty: number
  unit: string
  unitPrice: string
  totalPrice: string
  notes: string
}

export default function VendorRFQDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const rfqNumber = params?.rfqNumber as string
  const email = searchParams?.get('email') || ''

  const [loading, setLoading] = useState(true)
  const [rfqData, setRfqData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [items, setItems] = useState<QuotationItem[]>([])
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [validityDays, setValidityDays] = useState('30')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    // Simulate API call to fetch RFQ details
    // In production, this would call: procurementApi.vendorPortal.getRFQDetails(rfqNumber, email)
    setTimeout(() => {
      const mockRFQ = {
        id: '1',
        rfqNumber: rfqNumber,
        title: 'Office Supplies Request',
        description: 'Procurement of office supplies for Q1 2024',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: 'All items must be brand new and include warranty where applicable.',
        items: [
          {
            id: '1',
            itemName: 'A4 Paper (500 sheets)',
            description: 'Premium quality A4 paper',
            quantity: 100,
            unit: 'Boxes',
          },
          {
            id: '2',
            itemName: 'Ballpoint Pens (Blue)',
            description: 'Standard ballpoint pens',
            quantity: 500,
            unit: 'Pieces',
          },
          {
            id: '3',
            itemName: 'Stapler (Heavy Duty)',
            description: 'Metal stapler with 100 sheet capacity',
            quantity: 25,
            unit: 'Pieces',
          },
        ],
        requisition: {
          requisitionNumber: 'REQ-2024-001',
          department: 'Administration',
        },
      }

      setRfqData(mockRFQ)
      setItems(
        mockRFQ.items.map((item) => ({
          itemId: item.id,
          itemName: item.itemName,
          requestedQty: item.quantity,
          unit: item.unit,
          unitPrice: '',
          totalPrice: '0',
          notes: '',
        }))
      )
      setLoading(false)
    }, 1000)
  }, [rfqNumber, email])

  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-calculate total price
    if (field === 'unitPrice') {
      const unitPrice = parseFloat(value) || 0
      const totalPrice = unitPrice * newItems[index].requestedQty
      newItems[index].totalPrice = totalPrice.toFixed(2)
    }

    setItems(newItems)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      // In production: procurementApi.vendorPortal.submitQuotation({ rfqNumber, email, items, ... })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSubmitted(true)
    } catch (error) {
      console.error('Failed to submit quotation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0)
  const isFormValid =
    items.every((item) => item.unitPrice && parseFloat(item.unitPrice) > 0) &&
    deliveryTerms.trim() !== '' &&
    paymentTerms.trim() !== ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-3">Loading RFQ details...</p>
        </div>
      </div>
    )
  }

  if (!rfqData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">RFQ Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The RFQ you're looking for doesn't exist or has been closed.
            </p>
            <Link href="/vendor-portal">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Vendor Portal</h1>
                <p className="text-sm text-muted-foreground">Arcus</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quotation Submitted Successfully!</h2>
                <p className="text-muted-foreground mb-6">
                  Your quotation for <span className="font-medium">{rfqData.rfqNumber}</span> has
                  been submitted and is now under review by the procurement team.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium mb-2">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• The procurement team will review all submitted quotations</li>
                    <li>• You will be notified via email about the status of your quotation</li>
                    <li>• If selected, you'll receive a purchase order</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Link href="/vendor-portal">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Return to Portal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const deadlineDate = new Date(rfqData.deadline)
  const isExpired = deadlineDate < new Date()
  const daysRemaining = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Vendor Portal</h1>
                <p className="text-sm text-muted-foreground">
                  Submit Quotation for {rfqData.rfqNumber}
                </p>
              </div>
            </div>
            <Link href="/vendor-portal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          {/* Status Banner */}
          {isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">This RFQ has expired</p>
                  <p className="text-sm">The deadline for submissions was {format(deadlineDate, 'PPP')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`border rounded-lg p-4 ${daysRemaining <= 2 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${daysRemaining <= 2 ? 'text-orange-600' : 'text-blue-600'}`} />
                <div>
                  <p className={`font-medium ${daysRemaining <= 2 ? 'text-orange-800' : 'text-blue-800'}`}>
                    {daysRemaining <= 2 ? 'Deadline Approaching!' : 'Active RFQ'}
                  </p>
                  <p className={`text-sm ${daysRemaining <= 2 ? 'text-orange-700' : 'text-blue-700'}`}>
                    Deadline: {format(deadlineDate, 'PPP p')} ({daysRemaining} days remaining)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RFQ Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{rfqData.title}</CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {rfqData.rfqNumber}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rfqData.description && (
                <p className="text-muted-foreground">{rfqData.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <span className="ml-2 font-medium">{rfqData.requisition.department}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Requisition:</span>
                  <span className="ml-2 font-medium">{rfqData.requisition.requisitionNumber}</span>
                </div>
              </div>

              {rfqData.requirements && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Special Requirements</Label>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{rfqData.requirements}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quotation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Your Quotation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your pricing and terms for each item
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Items */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <Card key={item.itemId}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h4 className="font-medium">{item.itemName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Requested: {item.requestedQty} {item.unit}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>
                            Unit Price ($) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            disabled={isExpired}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input value={`${item.requestedQty} ${item.unit}`} disabled />
                        </div>

                        <div className="space-y-2">
                          <Label>Total Price ($)</Label>
                          <Input
                            value={item.totalPrice}
                            disabled
                            className="font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          placeholder="Any additional notes about this item..."
                          value={item.notes}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          rows={2}
                          disabled={isExpired}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total */}
              <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Quotation Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryTerms">
                    Delivery Terms <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="deliveryTerms"
                    placeholder="e.g., Delivery within 14 days from PO receipt, FOB destination..."
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    rows={3}
                    disabled={isExpired}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">
                    Payment Terms <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="paymentTerms"
                    placeholder="e.g., Net 30 days from delivery, 2% discount for payment within 10 days..."
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    rows={3}
                    disabled={isExpired}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validityDays">
                    Quotation Validity (Days) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    disabled={isExpired}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days this quotation remains valid
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other relevant information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    disabled={isExpired}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting || isExpired}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Quotation
                    </>
                  )}
                </Button>
                {!isFormValid && !isExpired && (
                  <p className="text-xs text-destructive mt-2 text-center">
                    Please fill in all required fields
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
