'use client'

/**
 * Vendor invoice submission, opened from the "submit your invoice" link in a purchase order email.
 *
 * The link carries one signed PO_VENDOR_INVOICE token (backend `src/utils/vendorPortalToken.ts`).
 * The page resolves it through GET /procurement/vendor-portal/purchase-order, prefills the order's
 * lines, and posts to POST /procurement/invoices with the same token. The server sets the invoice
 * date, the invoice number and the VAT itself, so the form does not ask for them.
 */

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, FileText, Loader2, Package, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'
import { procurementApiV2, type VendorPortalPurchaseOrder } from '@/lib/api/procurement-api-v2'

interface InvoiceLine {
  itemName: string
  description: string
  quantity: string
  unit: string
  unitPrice: string
}

interface SubmittedInvoice {
  invoiceNumber: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  lines: number
}

const blankLine = (): InvoiceLine => ({ itemName: '', description: '', quantity: '1', unit: 'each', unitPrice: '' })

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysFromToday(days: number): Date {
  const d = startOfToday()
  d.setDate(d.getDate() + days)
  return d
}

/** "Net 30", "NET 45", "30 days" → the number of days; anything else → 30. */
function paymentTermDays(terms: string | null | undefined): number {
  const match = String(terms || '').match(/(\d{1,3})/)
  return match ? Number(match[1]) : 30
}

function money(amount: number, code: string): string {
  return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Mirrors VATService.calculateVAT: round(amount × rate, 2). */
function vatOn(subtotal: number, vatPercent: number): number {
  return Math.round(subtotal * (vatPercent / 100) * 100) / 100
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message || fallback
  }
  return fallback
}

function orgName(): string {
  return process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Arcus'
}

function Shell({ children }: { children: React.ReactNode }) {
  const [logoError, setLogoError] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-12">
            {!logoError ? (
              <Image
                src={process.env.NEXT_PUBLIC_ORGANIZATION_LOGO || '/logo.png'}
                alt={orgName()}
                fill
                className="object-contain"
                priority
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex items-center justify-center gap-2 h-full">
                <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                  {orgName().substring(0, 1)}
                </div>
                <span className="text-xl font-bold text-gray-900">{orgName()}</span>
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Notice({ tone, title, children }: { tone: 'error' | 'info'; title: string; children: React.ReactNode }) {
  const palette =
    tone === 'error'
      ? 'border-red-200 text-red-900 [&_p]:text-red-700'
      : 'border-amber-200 text-amber-900 [&_p]:text-amber-800'
  return (
    <Card className={`border-2 shadow-sm ${palette}`}>
      <CardContent className="p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className={`w-10 h-10 flex-shrink-0 mt-1 ${tone === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VendorInvoiceSubmissionPage() {
  const searchParams = useSearchParams()
  const token = (searchParams.get('token') || '').trim()

  const [po, setPo] = useState<VendorPortalPurchaseOrder | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [loadError, setLoadError] = useState<string | null>(null)

  const [lines, setLines] = useState<InvoiceLine[]>([blankLine()])
  const [dueDate, setDueDate] = useState<Date | undefined>(daysFromToday(30))
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<SubmittedInvoice | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    procurementApiV2
      .getVendorPortalPurchaseOrder(token)
      .then((res) => {
        if (cancelled) return
        if (!res?.success || !res.data) throw new Error(res?.message || 'Could not load this purchase order')
        const order = res.data
        setPo(order)
        setLines(
          order.items.length
            ? order.items.map((line) => ({
                itemName: line.itemName,
                description: line.description || '',
                // Invoice what was delivered once a goods receipt exists; otherwise what was ordered.
                quantity: String(line.quantityReceived > 0 ? line.quantityReceived : line.quantity),
                unit: line.unit || 'each',
                unitPrice: String(line.unitPrice),
              }))
            : [blankLine()],
        )
        setDueDate(daysFromToday(paymentTermDays(order.paymentTerms)))
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, 'Could not load this purchase order'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const currency = po?.currency?.code || 'USD'
  const vatPercent = po?.vatPercent ?? 0
  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const qty = Number(line.quantity)
        const price = Number(line.unitPrice)
        return Number.isFinite(qty) && Number.isFinite(price) ? sum + qty * price : sum
      }, 0),
    [lines],
  )
  const taxAmount = vatOn(subtotal, vatPercent)
  const total = subtotal + taxAmount

  const updateLine = (index: number, field: keyof InvoiceLine, value: string) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!po) return

    const items = lines.map((line) => ({
      itemName: line.itemName.trim(),
      description: line.description.trim() || undefined,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      unit: line.unit.trim() || undefined,
    }))
    const badLine = items.findIndex(
      (item) =>
        !item.itemName ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice < 0,
    )
    if (badLine >= 0) {
      toast.error(`Line ${badLine + 1} needs an item name, a quantity above zero and a unit price`)
      return
    }
    if (dueDate && dueDate.getTime() < startOfToday().getTime()) {
      toast.error('The due date cannot be earlier than today')
      return
    }

    setSubmitting(true)
    try {
      let documentPath: string | undefined
      if (documentFile) {
        const form = new FormData()
        form.append('document', documentFile)
        const upload = await procurementApiV2.uploadVendorInvoiceDocument(form)
        documentPath = upload?.data?.documentUrl
        if (!documentPath) throw new Error(upload?.message || 'The invoice PDF did not upload')
      }

      const res = await procurementApiV2.createInvoice({
        vendorPortalToken: token,
        dueDate: dueDate?.toISOString(),
        currencyId: po.currency?.id,
        documentPath,
        documentType: documentPath ? (/\.pdf$/i.test(documentFile?.name || '') ? 'PDF' : 'IMAGE') : undefined,
        items,
      })
      if (!res?.success) throw new Error(res?.message || 'Failed to submit invoice')

      const created: any = res.data || {}
      setSubmitted({
        invoiceNumber: String(created.invoiceNumber || ''),
        subtotal: Number(created.subtotal ?? subtotal),
        taxAmount: Number(created.taxAmount ?? taxAmount),
        totalAmount: Number(created.totalAmount ?? total),
        lines: items.length,
      })
      toast.success('Invoice submitted')
    } catch (err) {
      toast.error('Failed to submit invoice', { description: errorMessage(err, 'Please try again') })
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <Shell>
        <Notice tone="error" title="This invoice link is incomplete">
          <p>
            Open the link from your purchase order email again. If it still does not work, ask the procurement team to
            resend the purchase order.
          </p>
        </Notice>
      </Shell>
    )
  }

  if (loading) {
    return (
      <Shell>
        <Card className="shadow-sm">
          <CardContent className="p-10 flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading your purchase order…</span>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  if (loadError || !po) {
    return (
      <Shell>
        <Notice tone="error" title="We could not open this invoice link">
          <p>{loadError || 'Could not load this purchase order'}</p>
          <p className="text-sm">Ask the procurement team to resend the purchase order for a fresh link.</p>
        </Notice>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell>
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="text-center space-y-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg pb-8">
            <div className="flex justify-center">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <CardTitle className="text-2xl font-semibold">Invoice submitted</CardTitle>
            <CardDescription className="text-green-50">
              Thank you. {orgName()} has received your invoice against {po.poNumber}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Our invoice reference</p>
                <p className="text-lg font-bold text-blue-900 font-mono">{submitted.invoiceNumber || '—'}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">Purchase order</p>
                <p className="text-lg font-bold text-purple-900 font-mono">{po.poNumber}</p>
              </div>
            </div>
            <div className="space-y-2 bg-gray-50 p-5 rounded-lg border border-gray-200 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({submitted.lines} line{submitted.lines === 1 ? '' : 's'})</span>
                <span className="font-medium">{money(submitted.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT</span>
                <span className="font-medium">{money(submitted.taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-green-700">{money(submitted.totalAmount, currency)}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm text-blue-900 space-y-1">
              <p className="font-semibold">What happens next</p>
              <p>Our accounts team matches the invoice against the purchase order and the goods received note.</p>
              <p>Once it is approved it is scheduled for payment. Quote the reference above in any correspondence.</p>
            </div>
            <p className="text-center text-xs text-gray-500">You can close this tab.</p>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-normal text-gray-900">Submit invoice</h1>
        <p className="text-gray-600">
          Purchase order{' '}
          <Badge variant="outline" className="font-mono text-blue-600 border-blue-200">
            {po.poNumber}
          </Badge>
          {po.vendor?.name ? <> for {po.vendor.name}</> : null}
        </p>
      </div>

      <div className="space-y-6">
        <Card className="shadow-none border border-gray-200">
          <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order total</p>
              <p className="font-medium">{po.totalAmount == null ? '—' : money(po.totalAmount, currency)}</p>
            </div>
            <div>
              <p className="text-gray-500">Order date</p>
              <p className="font-medium">{po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment terms</p>
              <p className="font-medium">{po.paymentTerms || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Order status</p>
              <p className="font-medium">{po.status.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>

        {po.invoices.length > 0 && (
          <Card className="shadow-none border border-amber-200 bg-amber-50/40">
            <CardContent className="p-5 space-y-2 text-sm">
              <p className="font-medium text-amber-900">
                {po.invoices.length === 1 ? 'An invoice has' : `${po.invoices.length} invoices have`} already been
                submitted against this order
              </p>
              <ul className="space-y-1 text-amber-900">
                {po.invoices.map((inv) => (
                  <li key={inv.invoiceNumber} className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono">{inv.invoiceNumber}</span>
                    <span>{money(inv.totalAmount ?? 0, currency)}</span>
                    <span className="capitalize">{inv.status.replace(/_/g, ' ').toLowerCase()}</span>
                  </li>
                ))}
              </ul>
              {po.openForInvoice && (
                <p className="text-amber-800">Only submit another for a separate delivery or the remaining balance.</p>
              )}
            </CardContent>
          </Card>
        )}

        {!po.openForInvoice ? (
          <Notice tone="info" title="This purchase order is not taking invoices">
            <p>
              Its status is {po.status.replace(/_/g, ' ').toLowerCase()}. If you still need to invoice it, contact the
              procurement team.
            </p>
          </Notice>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-l-4 border-l-green-500 shadow-none border-y border-r border-gray-200">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Invoice lines
                </CardTitle>
                <Button
                  type="button"
                  onClick={() => setLines((current) => [...current, blankLine()])}
                  variant="outline"
                  size="sm"
                  className="rounded-full h-9 px-4 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add line
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-gray-500">
                  Prefilled from the purchase order{po.items.some((l) => l.quantityReceived > 0) ? ', at the quantities received' : ''}.
                  Adjust them to match your invoice.
                </p>
                {lines.map((line, index) => (
                  <div key={index} className="p-4 border rounded-3xl space-y-4 bg-gray-50/30 border-gray-100">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 rounded-full">
                        Line {index + 1}
                      </Badge>
                      {lines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove line ${index + 1}`}
                          onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                          className="text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Item <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={line.itemName}
                          onChange={(e) => updateLine(index, 'itemName', e.target.value)}
                          required
                          className="rounded-full h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input
                          value={line.unit}
                          onChange={(e) => updateLine(index, 'unit', e.target.value)}
                          className="rounded-full h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        className="rounded-2xl resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                          required
                          className="rounded-full h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Unit price ({currency}) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                          required
                          className="rounded-full h-11"
                        />
                      </div>
                      <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>Line total</Label>
                        <div className="h-11 flex items-center px-4 bg-gray-100/50 rounded-full font-medium text-gray-700">
                          {money((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col items-end space-y-2 p-6 bg-gray-50 rounded-3xl border border-gray-100 text-sm text-gray-600">
                  <div className="flex justify-between w-full max-w-xs">
                    <span>Subtotal</span>
                    <span className="font-medium">{money(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs">
                    <span>VAT ({vatPercent}%)</span>
                    <span className="font-medium">{money(taxAmount, currency)}</span>
                  </div>
                  <div className="pt-2 border-t w-full max-w-xs flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">{money(total, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-none border-y border-r border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Invoice details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <DatePicker value={dueDate} onChange={setDueDate} allowFutureDates={true} className="rounded-full h-11" />
                  <p className="text-xs text-gray-500">The invoice is dated the day you submit it.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-pdf">Your invoice document (optional)</Label>
                  <label
                    htmlFor="invoice-pdf"
                    className="flex h-11 items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 text-sm text-gray-600 cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="truncate">{documentFile ? documentFile.name : 'Attach your invoice: a PDF, or a scan or photo (up to 15 MB)'}</span>
                  </label>
                  <input
                    id="invoice-pdf"
                    type="file"
                    accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,image/tiff,.png,.jpg,.jpeg,.webp,.tif,.tiff"
                    className="sr-only"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-7 rounded-full text-lg font-normal shadow-md"
            >
              {submitting ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Submit invoice
                </span>
              )}
            </Button>
          </form>
        )}
      </div>
    </Shell>
  )
}
