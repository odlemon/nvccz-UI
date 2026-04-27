'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, Mail, Phone, MapPin, User, FileText, DollarSign, Calendar, Package, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'

interface QuotationItem {
  itemName: string
  description: string
  quantity: number
  unit: string
  unitPrice: string
  specifications: Record<string, any>
  brand: string
  model: string
  warranty: string
}

export default function VendorQuotationSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rfqNumber = searchParams.get('rfqNumber') || (params.rfqNumber as string)
  const requisitionId = params.requisitionId as string

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [logoError, setLogoError] = useState(false)

  const getOrgLogo = () => {
    return process.env.NEXT_PUBLIC_ORGANIZATION_LOGO || '/logo.png'
  }

  const getOrgName = () => {
    return process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Arcus'
  }

  // Form state
  const [vendorName, setVendorName] = useState('')
  const [vendorEmail, setVendorEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [taxEIN, setTaxEIN] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined)
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<QuotationItem[]>([
    {
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'pieces',
      unitPrice: '',
      specifications: {},
      brand: '',
      model: '',
      warranty: ''
    }
  ])

  // Prefill form from query parameters
  useEffect(() => {
    const emailParam = searchParams.get('vendorEmail')
    const nameParam = searchParams.get('vendorName')

    if (emailParam) {
      setVendorEmail(decodeURIComponent(emailParam))
    }
    if (nameParam) {
      setVendorName(decodeURIComponent(nameParam))
      // Also set as company name if not already set
      setCompanyName(decodeURIComponent(nameParam))
    }
  }, [searchParams])

  const addItem = () => {
    setItems([...items, {
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'pieces',
      unitPrice: '',
      specifications: {},
      brand: '',
      model: '',
      warranty: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const calculateItemTotal = (item: QuotationItem) => {
    const unitPrice = parseFloat(item.unitPrice) || 0
    return (unitPrice * item.quantity).toFixed(2)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (unitPrice * item.quantity)
    }, 0).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!vendorName || !vendorEmail || !companyName || !phoneNumber || !validUntil) {
      toast.error('Please fill in all required fields')
      return
    }

    if (items.some(item => !item.itemName || !item.quantity || !item.unitPrice)) {
      toast.error('Please complete all item details')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        rfqNumber,
        requisitionId,
        vendorName,
        vendorEmail,
        companyName,
        taxEIN,
        contactPerson,
        phoneNumber,
        address,
        validUntil: validUntil?.toISOString(),
        currencyCode,
        paymentTerms,
        deliveryTerms,
        deliveryTime,
        notes,
        attachments: {},
        items: items.map(item => ({
          ...item,
          unitPrice: parseFloat(item.unitPrice),
          specifications: {}
        }))
      }

      const result = await procurementApiV2.submitQuotation(payload)

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit quotation')
      }
      setSubmittedData({
        ...payload,
        quotationNumber: result.data?.quotationNumber || 'PENDING',
        submittedAt: new Date().toISOString()
      })
      setSubmitted(true)
      toast.success('Quotation submitted successfully!')
    } catch (error: any) {
      toast.error('Failed to submit quotation', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted && submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-green-200 shadow-2xl">
            <CardHeader className="text-center space-y-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg pb-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-white rounded-full shadow-lg overflow-hidden relative">
                  {!logoError ? (
                    <Image
                      src={getOrgLogo()}
                      alt={getOrgName()}
                      width={80}
                      height={80}
                      className="rounded-full"
                      onError={() => setLogoError(true)}
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-sm font-bold text-blue-700">{getOrgName().substring(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Quotation Submitted Successfully!</CardTitle>
              <CardDescription className="text-green-50 text-lg">
                Thank you for submitting your quotation to {getOrgName()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Summary Header */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900">Submission Confirmed</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your quotation has been received and is now under review by our procurement team.
                      You will be notified via email at <span className="font-medium">{submittedData.vendorEmail}</span> regarding the status of your submission.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reference Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">RFQ Number</p>
                  <p className="text-lg font-bold text-blue-900">{submittedData.rfqNumber}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-1">Quotation Number</p>
                  <p className="text-lg font-bold text-purple-900">{submittedData.quotationNumber}</p>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium">{submittedData.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{submittedData.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{submittedData.vendorEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{submittedData.phoneNumber}</p>
                  </div>
                  {submittedData.taxEIN && (
                    <div>
                      <p className="text-sm text-gray-500">Tax EIN</p>
                      <p className="font-medium">{submittedData.taxEIN}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Items Quoted ({submittedData.items.length})
                </h3>
                <div className="space-y-3">
                  {submittedData.items.map((item: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-500">Qty: <span className="font-medium text-gray-900">{item.quantity} {item.unit}</span></span>
                            {item.brand && <span className="text-gray-500">Brand: <span className="font-medium text-gray-900">{item.brand}</span></span>}
                            {item.model && <span className="text-gray-500">Model: <span className="font-medium text-gray-900">{item.model}</span></span>}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-500">Unit Price</p>
                          <p className="font-medium text-gray-900">{submittedData.currencyCode} {item.unitPrice.toFixed(2)}</p>
                          <p className="text-sm text-gray-500 mt-1">Total</p>
                          <p className="text-lg font-bold text-green-600">{submittedData.currencyCode} {(item.unitPrice * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-100 mb-1">Total Quotation Amount</p>
                    <p className="text-3xl font-bold">
                      {submittedData.currencyCode} {submittedData.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-200" />
                </div>
              </div>

              {/* Terms */}
              {(submittedData.paymentTerms || submittedData.deliveryTerms) && (
                <div className="grid grid-cols-2 gap-4">
                  {submittedData.paymentTerms && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium mb-1">Payment Terms</p>
                      <p className="text-gray-900">{submittedData.paymentTerms}</p>
                    </div>
                  )}
                  {submittedData.deliveryTerms && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium mb-1">Delivery Terms</p>
                      <p className="text-gray-900">{submittedData.deliveryTerms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Valid Until */}
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Quote Valid Until</p>
                  <p className="font-semibold text-orange-900">{new Date(submittedData.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">What Happens Next?</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Our procurement team will review your quotation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You will receive an email notification about the review status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>If selected, we will contact you to proceed with the purchase order</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="text-center pt-4">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg rounded-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg border-4 border-blue-100 flex items-center justify-center overflow-hidden">
              {!logoError ? (
                <Image
                  src={getOrgLogo()}
                  alt={getOrgName()}
                  width={80}
                  height={80}
                  className="rounded-full"
                  onError={() => setLogoError(true)}
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                  <span className="text-sm font-bold text-blue-700">{getOrgName().substring(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Quotation to {getOrgName()}</h1>
          <p className="text-lg text-gray-600">Request for Quotation: <Badge variant="outline" className="text-base font-mono">{rfqNumber}</Badge></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Information */}
          <Card className="shadow-lg border-t-4 border-t-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Vendor Information
              </CardTitle>
              <CardDescription>Please provide your company and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., ABC Supplies Ltd"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taxEIN" className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    Tax EIN / Registration Number
                  </Label>
                  <Input
                    id="taxEIN"
                    value={taxEIN}
                    onChange={(e) => setTaxEIN(e.target.value)}
                    placeholder="e.g., 12-3456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName" className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Contact Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson" className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Alternative Contact
                  </Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorEmail" className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="e.g., john@vendor.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., +263771234567"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Business Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full business address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="shadow-lg border-t-4 border-t-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Quoted Items
                  </CardTitle>
                  <CardDescription>Provide pricing and details for each item</CardDescription>
                </div>
                <Button type="button" onClick={addItem} variant="outline" size="sm" className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Item #{index + 1}</Badge>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Item Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                        placeholder="e.g., Office Desk"
                        required
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Brand</Label>
                      <Input
                        value={item.brand}
                        onChange={(e) => updateItem(index, 'brand', e.target.value)}
                        placeholder="e.g., IKEA"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Detailed description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="mb-2 block">Quantity <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="e.g., pieces"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Unit Price <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Total</Label>
                      <Input
                        value={calculateItemTotal(item)}
                        disabled
                        className="bg-gray-50 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Model</Label>
                      <Input
                        value={item.model}
                        onChange={(e) => updateItem(index, 'model', e.target.value)}
                        placeholder="e.g., BEKANT"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Warranty</Label>
                      <Input
                        value={item.warranty}
                        onChange={(e) => updateItem(index, 'warranty', e.target.value)}
                        placeholder="e.g., 2 years"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex justify-end items-center gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <span className="text-lg font-semibold text-gray-700">Subtotal:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md font-medium"
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="ZAR">ZAR</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <span className="text-2xl font-bold text-green-600">{calculateSubtotal()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="shadow-lg border-t-4 border-t-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Terms & Conditions
              </CardTitle>
              <CardDescription>Specify your payment and delivery terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validUntil" className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Quote Valid Until <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    value={validUntil}
                    onChange={setValidUntil}
                    placeholder="Select validity date"
                    allowFutureDates={true}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTime" className="mb-2 block">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="e.g., 3-5 business days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentTerms" className="mb-2 block">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g., NET 30"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTerms" className="mb-2 block">Delivery Terms</Label>
                  <Input
                    id="deliveryTerms"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="e.g., FOB"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-2 block">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information or special conditions"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Submitting Quotation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Submit Quotation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
