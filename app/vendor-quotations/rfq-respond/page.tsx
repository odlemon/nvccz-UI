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
import { Building2, Mail, Phone, MapPin, User, FileText, DollarSign, Calendar, Package, CheckCircle2, Plus, Trash2, Loader2, AlertCircle, Paperclip, MessageSquare, Lock, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'
import { ORG_NAME, ORG_LOGO_PATH } from '@/lib/branding'

interface RfqInvitation {
  organisation: string | null
  rfqNumber: string
  title: string
  description: string | null
  status: string
  open: boolean
  closingAt: string | null
  envelopes?: 'ONE' | 'TWO'
  deliveryAddress: string | null
  expectedDeliveryDate: string | null
  specialRequirements: string | null
  currencyCode: string | null
  items: { itemName: string; description: string | null; quantity: number | string | null; unit: string | null }[]
  vendor: { name: string; email: string | null; contactPerson: string | null; phone: string | null; taxNumber: string | null; address: string | null }
  /** The supplier's own defaults from its vendor record. */
  vendorDefaults?: { currencyCode: string | null; paymentTerms: string | null }
  submission: { quotationNumber: string; status: string; statusLabel?: string; submittedAt: string | null } | null
}

interface StagedFile {
  id: string
  name: string
  envelope?: 'TECHNICAL' | 'COMMERCIAL'
}

interface Clarification {
  id: string
  from: 'Procurement' | 'You'
  body: string
  attachmentUrl: string | null
  createdAt: string
}

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
  const [quotationReference, setQuotationReference] = useState('')
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [deliveryPeriodDays, setDeliveryPeriodDays] = useState('')
  const [fileEnvelope, setFileEnvelope] = useState<'TECHNICAL' | 'COMMERCIAL'>('COMMERCIAL')
  // Supporting files staged with the supplier's own link, linked to the quotation on submission.
  const [files, setFiles] = useState<StagedFile[]>([])
  const [uploading, setUploading] = useState(false)
  // Final submission is deliberate: the form is reviewed first, then confirmed.
  const [reviewing, setReviewing] = useState(false)
  const [clarifications, setClarifications] = useState<Clarification[]>([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)

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
  // What the invited vendor is quoting for, read with their link's token: the RFQ, its lines, their own details.
  const [invitation, setInvitation] = useState<RfqInvitation | null>(null)

  useEffect(() => {
    if (!token || !rfqNumber) {
      setError('Missing RFQ details or security token.')
      setIsValidating(false)
      return
    }

    let cancelled = false
    procurementApiV2
      .getRfqInvitation(token)
      .then((res) => {
        const inv = res?.data
        if (cancelled || !inv) return
        setInvitation(inv)
        setCompanyName(inv.vendor?.name || '')
        setVendorName(inv.vendor?.contactPerson || '')
        setVendorEmail(inv.vendor?.email || '')
        setPhoneNumber(inv.vendor?.phone || '')
        setTaxEIN(inv.vendor?.taxNumber || '')
        setAddress(inv.vendor?.address || '')
        // Currency and payment terms start from what this supplier is set up with; the supplier states its own offer.
        setCurrencyCode(inv.vendorDefaults?.currencyCode || inv.currencyCode || 'USD')
        if (inv.vendorDefaults?.paymentTerms) setPaymentTerms(inv.vendorDefaults.paymentTerms)
        if (inv.items?.length) {
          setItems(inv.items.map((line: RfqInvitation['items'][number]) => ({
            itemName: line.itemName || '',
            description: line.description || '',
            quantity: Number(line.quantity) || 1,
            unit: line.unit || 'pieces',
            unitPrice: '',
            specifications: {},
            brand: '',
            model: '',
            warranty: ''
          })))
        }
      })
      .catch((e: any) => {
        if (cancelled) return
        // An expired or altered link cannot submit either, so say so now rather than after the vendor fills it in. A supplier
        // that is no longer eligible (403) is told to contact procurement, and nothing more.
        if (e?.status === 400 || e?.status === 403 || e?.status === 404) setError(e?.message || 'This quotation link is not valid.')
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, rfqNumber])

  const loadClarifications = () => {
    if (!token) return
    procurementApiV2
      .getPortalClarifications(token)
      .then((res) => setClarifications(res?.data || []))
      .catch(() => undefined)
  }
  useEffect(() => {
    if (invitation) loadClarifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation])

  const onPickFiles = async (list: FileList | null) => {
    if (!list || !token) return
    setUploading(true)
    try {
      for (const file of Array.from(list)) {
        const envelope = invitation?.envelopes === 'TWO' ? fileEnvelope : undefined
        const res = await procurementApiV2.uploadPortalAttachment(token, file, envelope)
        if (!res?.success || !res.data?.id) throw new Error(res?.message || 'Upload failed')
        setFiles((prev) => [...prev, { id: res.data!.id, name: res.data!.originalFileName || file.name, envelope }])
      }
    } catch (e: any) {
      toast.error('Could not upload the file', { description: e?.message })
    } finally {
      setUploading(false)
    }
  }

  const ask = async () => {
    if (!token || !question.trim()) return
    setAsking(true)
    try {
      const res = await procurementApiV2.askPortalClarification(token, question.trim())
      if (!res?.success) throw new Error(res?.message || 'Could not send your question')
      setQuestion('')
      loadClarifications()
      toast.success('Your question was sent to the procurement team.')
    } catch (e: any) {
      toast.error('Could not send your question', { description: e?.message })
    } finally {
      setAsking(false)
    }
  }

  const organisation = invitation?.organisation || null
  const closedFor = invitation && !invitation.open ? invitation : null
  const alreadySubmitted = invitation?.submission || null
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null)

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

  // Step 1: validate and show the review. Nothing is sent until the supplier confirms it.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!vendorName || !vendorEmail || !companyName || !phoneNumber || !validUntil) {
      toast.error('Please fill in all required fields')
      return
    }

    if (items.some(item => !item.itemName || !item.quantity || !(parseFloat(item.unitPrice) >= 0) || item.unitPrice === '')) {
      toast.error('Please complete all item details, with a price on every line')
      return
    }
    if (!/^[A-Za-z]{3}$/.test(currencyCode.trim())) {
      toast.error('Enter the currency as a three-letter code, e.g. USD')
      return
    }
    setReviewing(true)
  }

  // Step 2: the final submission.
  const confirmSubmit = async () => {
    setSubmitting(true)

    try {
      const payload = {
        rfqNumber: rfqNumber!,
        vendorPortalToken: token!, // Pass the token here
        vendorName,
        vendorEmail,
        companyName,
        taxEIN,
        contactPerson,
        phoneNumber,
        address,
        validUntil: validUntil?.toISOString(),
        currencyCode: currencyCode.trim().toUpperCase(),
        paymentTerms,
        deliveryTerms,
        deliveryTime,
        notes,
        quotationReference: quotationReference.trim() || undefined,
        quotationDate: quotationDate || undefined,
        deliveryPeriodDays: deliveryPeriodDays.trim() === '' ? undefined : Number(deliveryPeriodDays),
        attachments: {},
        attachmentIds: files.map((f) => f.id),
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
      const receipt: any = result.data || {}
      setSubmittedData({
        ...payload,
        quotationNumber: receipt.receiptNumber || receipt.quotationNumber || 'PENDING',
        submittedAt: receipt.submittedAt || new Date().toISOString(),
        statusLabel: receipt.statusLabel || 'Received',
        totalWithTax: receipt.totalAmount,
      })
      setReviewing(false)
      setSubmitted(true)
      toast.success('Quotation submitted successfully!')
    } catch (error: any) {
      setReviewing(false)
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
                src={ORG_LOGO_PATH}
                alt={ORG_NAME}
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
                {organisation ? `Thank you for submitting your quotation to ${organisation}` : 'Thank you for submitting your quotation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900">Submission Confirmed</h3>
                    <p className="text-sm text-green-700 mt-1">
                      This is your acknowledgement of receipt. It is not an award. Your quotation is with our procurement team, and a receipt has been emailed to
                      <span className="font-medium"> {submittedData.vendorEmail}</span>. Until the closing date you may submit a revised quotation, which replaces this one;
                      after it your submission is locked unless procurement formally reopens the event.
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
                  <p className="text-sm text-purple-600 font-medium mb-1">Receipt number</p>
                  <p className="text-lg font-bold text-purple-900" data-testid="receipt-number">{submittedData.quotationNumber}</p>
                  <p className="text-xs text-purple-700 mt-1">Received {new Date(submittedData.submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · Status: {submittedData.statusLabel}</p>
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

              <div className="text-center pt-8 space-y-3">
                <p className="text-sm font-medium text-gray-600">Submission complete: keep the receipt number above for your records.</p>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print receipt
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
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-16">
            <Image
              src={ORG_LOGO_PATH}
              alt={ORG_NAME}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-normal text-gray-900 mb-2">{organisation ? `Submit Quotation to ${organisation}` : 'Submit Quotation'}</h1>
          <p className="text-gray-600">RFQ: <Badge variant="outline" className="font-mono">{rfqNumber}</Badge></p>
        </div>

        {invitation && (
          <Card className="border-l-4 border-l-indigo-500 shadow-none mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">{invitation.title}</CardTitle>
              {invitation.description && <CardDescription className="whitespace-pre-line">{invitation.description}</CardDescription>}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4" /> Closing date</p>
                <p className="font-medium">{fmt(invitation.closingAt) || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500 flex items-center gap-1"><Package className="w-4 h-4" /> Delivery required by</p>
                <p className="font-medium">{fmt(invitation.expectedDeliveryDate) || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> Deliver to</p>
                <p className="font-medium">{invitation.deliveryAddress || 'To be confirmed'}</p>
              </div>
              {invitation.specialRequirements && (
                <div className="md:col-span-3">
                  <p className="text-gray-500">Special requirements</p>
                  <p className="font-medium whitespace-pre-line">{invitation.specialRequirements}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(closedFor || alreadySubmitted) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">
              {closedFor
                ? `This request for quotation is closed${closedFor.closingAt ? ` (it closed on ${fmt(closedFor.closingAt)})` : ''}. Submissions are locked${alreadySubmitted ? `; your quotation ${alreadySubmitted.quotationNumber} (${alreadySubmitted.statusLabel || 'Received'}) stands as submitted` : ''}. Only the procurement office can formally reopen it.`
                : `Your quotation ${alreadySubmitted.quotationNumber} (${alreadySubmitted.statusLabel || 'Received'}) was received${alreadySubmitted.submittedAt ? ` on ${fmt(alreadySubmitted.submittedAt)}` : ''}. You can still submit a revised quote below before the RFQ closes; it replaces this one.`}
            </p>
          </div>
        )}

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
                  <Label>Currency <span className="text-red-500">*</span></Label>
                  <Input name="currencyCode" value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase())} maxLength={3} placeholder="USD" className="rounded-lg uppercase" required />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input name="paymentTerms" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days from invoice" className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Period</Label>
                  <Input name="deliveryTime" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} placeholder="e.g. 14 days from order" className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Period in Days</Label>
                  <Input name="deliveryPeriodDays" type="number" min={0} step={1} value={deliveryPeriodDays} onChange={e => setDeliveryPeriodDays(e.target.value)} placeholder="e.g. 14" className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Your Quotation Reference</Label>
                  <Input name="quotationReference" value={quotationReference} onChange={e => setQuotationReference(e.target.value)} maxLength={64} placeholder="Your own quotation number" className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Quotation Date</Label>
                  <Input name="quotationDate" type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Delivery Terms</Label>
                  <Input name="deliveryTerms" value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} placeholder="e.g. Delivered to site, Incoterm DAP" className="rounded-lg" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Comments</Label>
                  <Textarea name="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={4000} placeholder="Anything procurement should know about this quotation" className="rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supporting documents */}
          <Card className="border-l-4 border-l-amber-500 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-amber-600" />
                Supporting documents
              </CardTitle>
              <CardDescription>Attach your quotation PDF, price list or technical submission (PDF or image).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitation?.envelopes === 'TWO' && (
                <div className="space-y-1">
                  <Label>These documents are</Label>
                  <select name="fileEnvelope" value={fileEnvelope} onChange={e => setFileEnvelope(e.target.value as 'TECHNICAL' | 'COMMERCIAL')} className="rounded-lg border px-3 py-2 text-sm">
                    <option value="TECHNICAL">Technical: opened first, without prices</option>
                    <option value="COMMERCIAL">Commercial: prices and terms</option>
                  </select>
                </div>
              )}
              <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" data-testid="portal-file-input" onChange={e => { onPickFiles(e.target.files); e.currentTarget.value = '' }} disabled={uploading || Boolean(closedFor)} />
              {uploading && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</p>}
              {files.length > 0 && (
                <ul className="text-sm divide-y border rounded-lg">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> {f.name}{f.envelope ? <span className="text-xs text-gray-500">({f.envelope === 'TECHNICAL' ? 'technical' : 'commercial'})</span> : null}</span>
                      <button type="button" className="text-red-600 text-xs" onClick={() => setFiles(files.filter((x) => x.id !== f.id))}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {closedFor ? (
            <div className="w-full rounded-full border border-gray-200 bg-gray-100 py-5 text-center text-gray-600 flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" /> Submissions are locked: this event is closed
            </div>
          ) : (
            <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-full text-lg font-normal shadow-sm">
              <CheckCircle2 className="mr-2" />
              {alreadySubmitted ? 'Review revised quotation' : 'Review and submit'}
            </Button>
          )}
        </form>

        {/* Clarifications: only what was sent to every invitee or to you, and your own questions. */}
        <Card className="border-l-4 border-l-teal-500 shadow-none mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Clarifications
            </CardTitle>
            <CardDescription>Answers the procurement team has shared, and your own questions. Other suppliers' questions are never shown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clarifications.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="no-clarifications">No clarifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {clarifications.map((c) => (
                  <li key={c.id} className={cn('rounded-lg border p-3 text-sm', c.from === 'You' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50')} data-testid="clarification">
                    <p className="text-xs text-gray-500 mb-1">{c.from} · {new Date(c.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p className="whitespace-pre-line">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {!closedFor && (
              <div className="space-y-2">
                <Label>Ask a question</Label>
                <Textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} maxLength={4000} data-testid="clarification-input" placeholder="Your question to the procurement team" className="rounded-lg" />
                <Button type="button" onClick={ask} disabled={asking || !question.trim()} variant="outline" className="rounded-full">
                  {asking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Send question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review before the final submission */}
        {reviewing && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Review your quotation">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
              <h2 className="text-xl font-medium">Review and confirm</h2>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">RFQ:</span> {rfqNumber}</p>
                <p><span className="text-gray-500">Total offered (before tax):</span> <strong>{currencyCode.toUpperCase()} {calculateSubtotal()}</strong></p>
                <p><span className="text-gray-500">Valid until:</span> {validUntil ? validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                <p><span className="text-gray-500">Payment terms:</span> {paymentTerms || 'Not stated'}</p>
                <p><span className="text-gray-500">Delivery:</span> {deliveryTime || 'Not stated'}</p>
                <p><span className="text-gray-500">Documents attached:</span> {files.length}</p>
              </div>
              <p className="text-xs text-gray-500">This is your final submission for this event. Until the closing date you can send a revised quotation, which replaces this one; after it, your submission is locked.</p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setReviewing(false)} disabled={submitting}>Back to edit</Button>
                <Button type="button" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmSubmit} disabled={submitting} data-testid="confirm-submission">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirm submission
                </Button>
              </div>
            </div>
          </div>
        )}
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
