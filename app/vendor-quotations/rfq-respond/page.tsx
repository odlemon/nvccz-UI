'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, Mail, Phone, MapPin, User, FileText, DollarSign, Calendar, Package, CheckCircle2, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
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

function RFQRespondContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const rfqNumber = searchParams.get('rfqNumber')

  const [requisitionId, setRequisitionId] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

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

  useEffect(() => {
    if (!token || !rfqNumber) {
      setError('Missing RFQ details or security token.')
      setIsValidating(false)
      return
    }

    try {
      const payloadBase64 = token.split('.')[1]
      if (payloadBase64) {
        const decodedPayload = JSON.parse(atob(payloadBase64))
        const rId = decodedPayload.r
        if (rId) {
          setRequisitionId(rId)
        }
      }
    } catch (e) {
      console.error('Error decoding token:', e)
    } finally {
      setIsValidating(false)
    }
  }, [token, rfqNumber])

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
        rfqNumber: rfqNumber!,
        requisitionId: requisitionId!,
        vendorPortalToken: token!, // Pass the token here
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

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Validating RFQ information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 bg-gray-50 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Unable to load RFQ</h1>
        <p className="text-gray-600 max-w-md">{error}</p>
        <Button onClick={() => router.push('/login')} variant="outline" className="mt-4 rounded-full">
          Back to Login
        </Button>
      </div>
    )
  }

  if (submitted && submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-16">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <Card className="border-2 border-green-200 shadow-2xl">
            <CardHeader className="text-center space-y-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg pb-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Quotation Submitted Successfully!</CardTitle>
              <CardDescription className="text-green-50 text-lg">
                Thank you for submitting your quotation to Arcus
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
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
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg text-center">
                <p className="text-green-100 mb-1">Total Quotation Amount</p>
                <p className="text-4xl font-bold">
                  {submittedData.currencyCode} {submittedData.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}
                </p>
              </div>

              <div className="text-center pt-8">
                <p className="text-sm font-medium text-gray-600 mb-2">Submission Complete</p>
                <p className="text-xs text-gray-500">You may now safely close this browser tab.</p>
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
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-16">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-normal text-gray-900 mb-2">Submit Quotation to Arcus</h1>
          <p className="text-gray-600">RFQ: <Badge variant="outline" className="font-mono">{rfqNumber}</Badge></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Information */}
          <Card className="border-l-4 border-l-blue-500 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name <span className="text-red-500">*</span></Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Tax EIN / Registration</Label>
                  <Input value={taxEIN} onChange={e => setTaxEIN(e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person Name <span className="text-red-500">*</span></Label>
                  <Input value={vendorName} onChange={e => setVendorName(e.target.value)} required className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address <span className="text-red-500">*</span></Label>
                  <Input type="email" value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} required className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number <span className="text-red-500">*</span></Label>
                  <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-l-4 border-l-green-500 shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Quoted Items
              </CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm" className="rounded-full h-9 px-4">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-gray-50/50">
                  <div className="flex justify-between">
                    <Badge variant="secondary">Item #{index + 1}</Badge>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name <span className="text-red-500">*</span></Label>
                      <Input value={item.itemName} onChange={e => updateItem(index, 'itemName', e.target.value)} required className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={item.brand} onChange={e => updateItem(index, 'brand', e.target.value)} className="rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity <span className="text-red-500">*</span></Label>
                      <Input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} required className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price <span className="text-red-500">*</span></Label>
                      <Input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} required className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input value={calculateItemTotal(item)} disabled className="bg-gray-100 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="font-normal text-gray-700">Subtotal ({currencyCode}):</span>
                <span className="text-2xl font-bold text-green-600">{calculateSubtotal()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="border-l-4 border-l-purple-500 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quote Valid Until <span className="text-red-500">*</span></Label>
                  <DatePicker value={validUntil} onChange={setValidUntil} allowFutureDates={true} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Time</Label>
                  <Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} placeholder="e.g. 3 days" className="rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-full text-lg font-normal shadow-sm">
            {submitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
            Submit Quotation
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function RFQRespondPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
      <RFQRespondContent />
    </Suspense>
  )
}
