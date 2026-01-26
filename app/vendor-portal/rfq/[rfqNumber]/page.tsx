// ============================================================================
// VENDOR RFQ DETAILS & QUOTATION SUBMISSION
// Public page - no authentication, accessed via email link
// Updated to use procurement-api-v2
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Mail,
  Phone,
  MapPin,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { procurementApiV2, type RFQ, type SubmitQuotationRequest } from '@/lib/api/procurement-api-v2'

interface QuotationItemForm {
  itemName: string
  description: string
  quantity: number
  unit: string
  unitPrice: string
  brand: string
  model: string
  warranty: string
  specifications?: any
}

export default function VendorRFQDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const rfqNumber = params?.rfqNumber as string
  const requisitionId = searchParams?.get('requisitionId') || ''
  const vendorEmail = searchParams?.get('email') || ''

  const [loading, setLoading] = useState(true)
  const [rfqData, setRfqData] = useState<RFQ | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Vendor Information
  const [vendorName, setVendorName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [taxEIN, setTaxEIN] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')

  // Quotation Details
  const [validUntil, setValidUntil] = useState('')
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [notes, setNotes] = useState('')

  // Items
  const [items, setItems] = useState<QuotationItemForm[]>([])

  useEffect(() => {
    const fetchRFQDetails = async () => {
      try {
        setLoading(true)
        const response = await procurementApiV2.getRFQByNumber(rfqNumber)
        if (response.success && response.data) {
          setRfqData(response.data)

          // Initialize items from RFQ
          setItems(
            response.data.items.map((item: any) => ({
              itemName: item.itemName,
              description: item.description || '',
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: '',
              brand: '',
              model: '',
              warranty: '',
              specifications: item.specifications,
            }))
          )

          // Set default valid until (30 days from now)
          const defaultValidUntil = new Date()
          defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
          setValidUntil(format(defaultValidUntil, 'yyyy-MM-dd'))
        } else {
          setError('Failed to load RFQ details')
        }
      } catch (err) {
        console.error('Error fetching RFQ:', err)
        setError('Failed to load RFQ details')
      } finally {
        setLoading(false)
      }
    }

    if (rfqNumber) {
      fetchRFQDetails()
    }
  }, [rfqNumber])

  const updateItem = (index: number, field: keyof QuotationItemForm, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (unitPrice * item.quantity)
    }, 0)
  }

  const handleSubmit = async () => {
    // Validation
    if (!vendorName.trim() || !companyName.trim() || !vendorEmail.trim()) {
      setError('Please fill in all required vendor information')
      return
    }

    if (!paymentTerms.trim() || !deliveryTerms.trim()) {
      setError('Please provide payment and delivery terms')
      return
    }

    if (items.some(item => !item.unitPrice || parseFloat(item.unitPrice) <= 0)) {
      setError('Please provide valid unit prices for all items')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const quotationData: SubmitQuotationRequest = {
        rfqNumber,
        requisitionId,
        vendorName,
        vendorEmail,
        companyName,
        taxEIN: taxEIN || undefined,
        contactPerson: contactPerson || undefined,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        validUntil,
        currencyCode,
        paymentTerms,
        deliveryTerms,
        deliveryTime: deliveryTime || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: parseFloat(item.unitPrice),
          specifications: item.specifications,
          brand: item.brand || undefined,
          model: item.model || undefined,
          warranty: item.warranty || undefined,
        })),
      }

      const response = await procurementApiV2.submitQuotation(quotationData)

      if (response.success) {
        setSubmitted(true)
      } else {
        setError('Failed to submit quotation')
      }
    } catch (err) {
      console.error('Failed to submit quotation:', err)
      setError('Failed to submit quotation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return (
      vendorName.trim() !== '' &&
      companyName.trim() !== '' &&
      vendorEmail.trim() !== '' &&
      paymentTerms.trim() !== '' &&
      deliveryTerms.trim() !== '' &&
      items.every((item) => item.unitPrice && parseFloat(item.unitPrice) > 0)
    )
  }

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
              <Button variant="outline" className="rounded-full">
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
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quotation Submitted Successfully!</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for submitting your quotation for RFQ {rfqNumber}.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-left">
                      <p className="text-muted-foreground">RFQ Number</p>
                      <p className="font-medium">{rfqNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-medium text-lg">
                        {currencyCode} {calculateTotal().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  We have received your quotation and will review it shortly. You will be notified via email
                  at <span className="font-medium">{vendorEmail}</span> regarding the status of your submission.
                </p>
                <Link href="/vendor-portal">
                  <Button className="rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/vendor-portal">
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Button>
          </Link>

          {/* RFQ Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{rfqData.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="text-sm">
                      <FileText className="h-3 w-3 mr-1" />
                      {rfqData.rfqNumber}
                    </Badge>
                    {rfqData.rfqDeadline && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Deadline: {format(new Date(rfqData.rfqDeadline), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{rfqData.description}</p>
              </div>
              {rfqData.specialRequirements && (
                <div>
                  <Label className="text-muted-foreground">Special Requirements</Label>
                  <p className="mt-1">{rfqData.specialRequirements}</p>
                </div>
              )}
              {rfqData.deliveryAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-muted-foreground">Delivery Address</Label>
                    <p className="mt-1">{rfqData.deliveryAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RFQ Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Required Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Separator />

          {/* Vendor Information Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">
                    Vendor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendorEmail">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    value={vendorEmail}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxEIN">Tax ID / EIN</Label>
                  <Input
                    id="taxEIN"
                    value={taxEIN}
                    onChange={(e) => setTaxEIN(e.target.value)}
                    placeholder="Enter tax identification number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validUntil">
                    Valid Until <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency</Label>
                  <Input
                    id="currencyCode"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    placeholder="e.g., USD, EUR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="e.g., 7-10 business days"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">
                    Payment Terms <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g., Net 30, 50% upfront..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTerms">
                    Delivery Terms <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="deliveryTerms"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="e.g., FOB, CIF..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Item Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Item Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.itemName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} {item.unit}
                        </p>
                      </div>
                      <Badge variant="outline">Item {index + 1}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Unit Price <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Brand</Label>
                        <Input
                          value={item.brand}
                          onChange={(e) => updateItem(index, 'brand', e.target.value)}
                          placeholder="Brand name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                          value={item.model}
                          onChange={(e) => updateItem(index, 'model', e.target.value)}
                          placeholder="Model number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Warranty</Label>
                        <Input
                          value={item.warranty}
                          onChange={(e) => updateItem(index, 'warranty', e.target.value)}
                          placeholder="e.g., 1 year"
                        />
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded p-3 flex justify-between items-center">
                      <span className="text-sm font-medium">Total for this item:</span>
                      <span className="text-lg font-bold">
                        {currencyCode} {((parseFloat(item.unitPrice) || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Grand Total:</span>
                <span className="text-3xl font-bold text-primary">
                  {currencyCode} {calculateTotal().toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/vendor-portal">
              <Button variant="outline" className="rounded-full">Cancel</Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              size="lg"
              className="rounded-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit Quotation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
