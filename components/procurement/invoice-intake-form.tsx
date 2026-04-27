"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { procurementApiV2, InvoiceIntake, ExtractedInvoiceData } from "@/lib/api/procurement-api-v2"
import { Loader2, Upload, FileText, Zap, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface InvoiceIntakeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvoiceIntakeForm({ isOpen, onClose, onSuccess }: InvoiceIntakeFormProps) {
  const [step, setStep] = useState<'upload' | 'extract' | 'review'>('upload')
  const [loading, setLoading] = useState(false)
  const [extractLoading, setExtractLoading] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!documentUrl.trim()) {
      toast.error("Please enter a document URL")
      return
    }

    setLoading(true)
    try {
      const response = await procurementApiV2.createInvoiceIntake({
        documentUrl
      })

      if (response.success && response.data) {
        setIntakeId(response.data.id)
        setStep('extract')
        toast.success("Invoice intake created. Ready to extract data.")
      } else {
        toast.error("Failed to create intake")
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleExtract = async () => {
    if (!intakeId) return

    setExtractLoading(true)
    try {
      const response = await procurementApiV2.extractInvoiceData(intakeId)

      if (response.success && response.data) {
        setExtractedData(response.data)
        setStep('review')
        toast.success("Invoice data extracted successfully")
      } else {
        toast.error("Extraction failed")
      }
    } catch (error: any) {
      toast.error("Error extracting data", { description: error.message })
    } finally {
      setExtractLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!intakeId) return

    setLoading(true)
    try {
      const response = await procurementApiV2.verifyInvoiceIntake(intakeId)

      if (response.success) {
        toast.success("Invoice verified successfully")
        onSuccess()
        handleClose()
      } else {
        toast.error("Verification failed")
      }
    } catch (error: any) {
      toast.error("Error verifying intake", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBill = async () => {
    if (!intakeId) return

    setLoading(true)
    try {
      const response = await procurementApiV2.createDraftBillFromIntake(intakeId)

      if (response.success) {
        toast.success("Draft bill created successfully")
        onSuccess()
        handleClose()
      } else {
        toast.error("Failed to create bill")
      }
    } catch (error: any) {
      toast.error("Error creating bill", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setDocumentUrl("")
    setIntakeId(null)
    setExtractedData(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vendor Invoice Intake
          </DialogTitle>
          <DialogDescription>
            Upload, extract, and verify vendor invoice data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            {['upload', 'extract', 'review'].map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : ['upload', 'extract'].includes(step) && ['extract', 'review'].includes(s)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {['upload', 'extract'].includes(step) && ['extract', 'review'].includes(s) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="text-sm capitalize hidden sm:inline">{s}</span>
                {idx < 2 && <div className="w-8 h-px bg-gray-300 hidden sm:block" />}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Invoice Document</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="documentUrl">Document URL *</Label>
                    <Input
                      id="documentUrl"
                      type="url"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://example.com/invoice.pdf"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Provide a URL to a PDF or image of the vendor invoice
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="gradient-primary text-white">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload & Continue
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Extract */}
          {step === 'extract' && (
            <Card>
              <CardHeader>
                <CardTitle>Extract Invoice Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Click below to run OCR and AI-powered data extraction on the uploaded invoice.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={extractLoading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExtract}
                    disabled={extractLoading}
                    className="gradient-primary text-white"
                  >
                    {extractLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Run Extraction
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {step === 'review' && extractedData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Invoice Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Invoice Number</label>
                      <p className="font-semibold">{extractedData.invoiceNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Vendor</label>
                      <p className="font-semibold">{extractedData.vendorName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Invoice Date</label>
                      <p className="font-semibold">{extractedData.invoiceDate}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Due Date</label>
                      <p className="font-semibold">{extractedData.dueDate}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Total Amount</label>
                      <p className="text-2xl font-bold">
                        {extractedData.currency} {extractedData.totalAmount}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600 flex items-center gap-1">
                        Extraction Confidence
                        <Badge className="bg-blue-100 text-blue-800">{(extractedData.confidence * 100).toFixed(0)}%</Badge>
                      </label>
                    </div>
                  </div>

                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Line Items</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {extractedData.items.map((item, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.itemName}</p>
                                {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
                              </div>
                              <p className="font-semibold">{item.totalPrice}</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {item.quantity} {item.unit} @ {item.unitPrice}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Verify & Queue
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCreateBill}
                  disabled={loading}
                  className="gradient-primary text-white flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Create Draft Bill
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
