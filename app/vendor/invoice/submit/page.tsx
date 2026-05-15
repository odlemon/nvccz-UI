'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, Mail, FileText, DollarSign, Calendar, Package, CheckCircle2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'

interface InvoiceItem {
  itemName: string
  description: string
  quantity: number
  unit: string
  unitPrice: string
}

export default function VendorInvoiceSubmissionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quotationNumber = searchParams.get('quotationNumber')
  const vendorEmail = searchParams.get('vendorEmail') ? decodeURIComponent(searchParams.get('vendorEmail')!) : ''
  const rfqNumber = searchParams.get('rfqNumber')
  const token = searchParams.get('token')

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
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [taxPercentage, setTaxPercentage] = useState('0')
  const [paymentTerms, setPaymentTerms] = useState('NET 30')
  const [bankDetails, setBankDetails] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'pieces',
      unitPrice: ''
    }
  ])

  // Validation
  const missingRequiredParams = !quotationNumber || !vendorEmail || !rfqNumber

  const addItem = () => {
    setItems([...items, {
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'pieces',
      unitPrice: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    const unitPrice = parseFloat(item.unitPrice) || 0
    return (unitPrice * item.quantity).toFixed(2)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (unitPrice * item.quantity)
    }, 0).toFixed(2)
  }

  const calculateTax = () => {
    const subtotal = parseFloat(calculateSubtotal())
    const tax = subtotal * (parseFloat(taxPercentage) / 100)
    return tax.toFixed(2)
  }

  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal())
    const tax = parseFloat(calculateTax())
    return (subtotal + tax).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!invoiceNumber || !invoiceDate || !dueDate) {
      toast.error('Please fill in all required invoice details')
      return
    }

    if (items.some(item => !item.itemName || !item.quantity || !item.unitPrice)) {
      toast.error('Please complete all item details')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        quotationNumber,
        rfqNumber,
        vendorEmail,
        vendorPortalToken: token, // Added vendorPortalToken
        invoiceNumber,
        invoiceDate: invoiceDate?.toISOString(),
        dueDate: dueDate?.toISOString(),
        currencyCode,
        taxPercentage: parseFloat(taxPercentage),
        subtotal: parseFloat(calculateSubtotal()),
        taxAmount: parseFloat(calculateTax()),
        totalAmount: parseFloat(calculateTotal()),
        paymentTerms,
        bankDetails,
        notes,
        items: items.map(item => ({
          ...item,
          unitPrice: parseFloat(item.unitPrice)
        }))
      }

      const result = await procurementApiV2.createInvoice(payload)

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit invoice')
      }

      setSubmittedData({
        ...payload,
        submittedAt: new Date().toISOString()
      })
      setSubmitted(true)
      toast.success('Invoice submitted successfully!')
    } catch (error: any) {
      toast.error('Failed to submit invoice', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (missingRequiredParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-red-900 mb-2">Invalid Invoice Submission</h2>
                  <p className="text-red-700 mb-4">
                    This invoice submission link is invalid or missing required information.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                    <p className="text-sm text-red-800 mb-2">Required parameters missing:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {!quotationNumber && <li>• Quotation Number</li>}
                      {!vendorEmail && <li>• Vendor Email</li>}
                      {!rfqNumber && <li>• RFQ Number</li>}
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please request a new invoice submission link from the procurement team.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              <CardTitle className="text-3xl font-bold">Invoice Submitted Successfully!</CardTitle>
              <CardDescription className="text-green-50 text-lg">
                Thank you for submitting your invoice to {getOrgName()}
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
                      Your invoice has been received and is now under review by our accounts team.
                      You will be notified via email at <span className="font-medium">{submittedData.vendorEmail}</span> regarding the payment status.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reference Numbers */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Invoice Number</p>
                  <p className="text-lg font-bold text-blue-900">{submittedData.invoiceNumber}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-1">Quotation Number</p>
                  <p className="text-lg font-bold text-purple-900">{submittedData.quotationNumber}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium mb-1">RFQ Number</p>
                  <p className="text-lg font-bold text-orange-900">{submittedData.rfqNumber}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Invoice Details
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-medium">{new Date(submittedData.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(submittedData.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="font-medium">{submittedData.currencyCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Terms</p>
                    <p className="font-medium">{submittedData.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Invoice Items ({submittedData.items.length})
                </h3>
                <div className="space-y-3">
                  {submittedData.items.map((item: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <p className="text-sm text-gray-500 mt-2">Qty: <span className="font-medium text-gray-900">{item.quantity} {item.unit}</span></p>
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

              {/* Totals */}
              <div className="space-y-3 bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">{submittedData.currencyCode} {parseFloat(submittedData.subtotal).toFixed(2)}</span>
                </div>
                {submittedData.taxPercentage > 0 && (
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Vat ({submittedData.taxPercentage}%):</span>
                    <span className="font-medium">{submittedData.currencyCode} {parseFloat(submittedData.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount Due:</span>
                  <span className="text-2xl font-bold text-green-600">{submittedData.currencyCode} {parseFloat(submittedData.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Bank Details */}
              {submittedData.bankDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-2">Bank Details</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{submittedData.bankDetails}</p>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">What Happens Next?</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Our accounts team will verify your invoice details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>The invoice will be matched against the quotation and RFQ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You will receive a payment notification on the due date or sooner</span>
                  </li>
                </ul>
              </div>

              <div className="text-center pt-4">
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
    <div className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Logo Only */}
        <div className="flex justify-center mb-10">
          <div className="relative w-48 h-12">
            {!logoError ? (
              <Image
                src={getOrgLogo()}
                alt={getOrgName()}
                fill
                className="object-contain"
                priority
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                  {getOrgName().substring(0, 1)}
                </div>
                <span className="text-xl font-bold text-gray-900">{getOrgName()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-normal text-gray-900 mb-2">Submit Invoice</h1>
          <p className="text-gray-600">
            For Quotation: <Badge variant="outline" className="font-mono text-blue-600 border-blue-200">{quotationNumber}</Badge>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Basic Information */}
          <Card className="border-l-4 border-l-blue-500 shadow-none border-y border-r border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number <span className="text-red-500">*</span></Label>
                  <Input 
                    value={invoiceNumber} 
                    onChange={e => setInvoiceNumber(e.target.value)} 
                    placeholder="INV-001" 
                    required 
                    className="rounded-full h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date <span className="text-red-500">*</span></Label>
                  <DatePicker value={invoiceDate} onChange={setInvoiceDate} className="rounded-full h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Due Date <span className="text-red-500">*</span></Label>
                  <DatePicker value={dueDate} onChange={setDueDate} allowFutureDates={true} className="rounded-full h-11" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input 
                    value={paymentTerms} 
                    onChange={e => setPaymentTerms(e.target.value)} 
                    placeholder="e.g., Net 30"
                    className="rounded-full h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <div className="flex gap-2">
                    <select
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      className="flex h-11 w-full rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="ZWL">ZWL - Zimbabwe Dollar</option>
                      <option value="ZAR">ZAR - SA Rand</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-l-4 border-l-green-500 shadow-none border-y border-r border-gray-200">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Line Items
              </CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm" className="rounded-full h-9 px-4 border-green-200 text-green-700 hover:bg-green-50">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-3xl space-y-4 relative bg-gray-50/30 border-gray-100">
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 rounded-full">Item #{index + 1}</Badge>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name <span className="text-red-500">*</span></Label>
                      <Input 
                        value={item.itemName} 
                        onChange={e => updateItem(index, 'itemName', e.target.value)} 
                        required 
                        className="rounded-full h-11"
                        placeholder="Description of goods/services"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input 
                        value={item.unit} 
                        onChange={e => updateItem(index, 'unit', e.target.value)} 
                        className="rounded-full h-11"
                        placeholder="e.g., Each, Hours"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Detailed Description</Label>
                    <Textarea 
                      value={item.description} 
                      onChange={e => updateItem(index, 'description', e.target.value)} 
                      className="rounded-2xl resize-none"
                      rows={2}
                      placeholder="Additional details about this item..."
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity <span className="text-red-500">*</span></Label>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} 
                        required 
                        className="rounded-full h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price ({currencyCode}) <span className="text-red-500">*</span></Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={item.unitPrice} 
                        onChange={e => updateItem(index, 'unitPrice', e.target.value)} 
                        required 
                        className="rounded-full h-11"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-1 col-span-2">
                      <Label>Line Total</Label>
                      <div className="h-11 flex items-center px-4 bg-gray-100/50 rounded-full font-medium text-gray-700">
                        {currencyCode} {calculateItemTotal(item)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col items-end space-y-3 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="flex justify-between w-full max-w-xs text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">{currencyCode} {calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs items-center text-sm text-gray-600">
                  <span className="flex items-center gap-1">VAT Percentage:</span>
                  <div className="w-24">
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={taxPercentage} 
                        onChange={e => setTaxPercentage(e.target.value)}
                        className="h-9 text-right rounded-full pr-7"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between w-full max-w-xs text-sm text-gray-600">
                  <span>VAT Amount:</span>
                  <span className="font-medium text-blue-600">+{currencyCode} {calculateTax()}</span>
                </div>
                <div className="pt-3 mt-1 border-t w-full max-w-xs flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{currencyCode} {calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Notes */}
          <Card className="border-l-4 border-l-purple-500 shadow-none border-y border-r border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Payment & Additional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Details / Payment Instructions</Label>
                <Textarea 
                  value={bankDetails} 
                  onChange={e => setBankDetails(e.target.value)} 
                  placeholder="Beneficiary Name, Bank, Account Number, Branch Code, SWIFT/BIC..." 
                  rows={3} 
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Any other information for our accounts department..." 
                  rows={2} 
                  className="rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-7 rounded-full text-lg font-normal transition-all shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Processing Submission...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Final Invoice</span>
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
