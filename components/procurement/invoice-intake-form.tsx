"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { accountingApi, Vendor } from "@/lib/api/accounting-api"
import { procurementApiV2, ExtractedInvoiceData, GoodsReceivedNote, PurchaseOrder } from "@/lib/api/procurement-api-v2"
import { Loader2, Upload, FileText, Zap, Check } from "lucide-react"
import { toast } from "sonner"

interface InvoiceIntakeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvoiceIntakeForm({ isOpen, onClose, onSuccess }: InvoiceIntakeFormProps) {
  const [step, setStep] = useState<'upload' | 'extract' | 'review'>('upload')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [loadingRelations, setLoadingRelations] = useState(false)
  const [extractLoading, setExtractLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [sourcePurchaseOrderId, setSourcePurchaseOrderId] = useState("")
  const [goodsReceivedNoteId, setGoodsReceivedNoteId] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [goodsReceivedNotes, setGoodsReceivedNotes] = useState<GoodsReceivedNote[]>([])
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadVendors = async () => {
      setLoadingData(true)
      try {
        const vendorsResponse = await accountingApi.getVendors({ isActive: true })
        if (vendorsResponse.success && vendorsResponse.data) {
          setVendors(vendorsResponse.data)
        }
      } catch (error: any) {
        toast.error("Failed to load vendors", { description: error.message })
      } finally {
        setLoadingData(false)
      }
    }

    loadVendors()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    if (!vendorId) {
      setPurchaseOrders([])
      setGoodsReceivedNotes([])
      setSourcePurchaseOrderId("")
      setGoodsReceivedNoteId("")
      return
    }

    const loadVendorRelations = async () => {
      setLoadingRelations(true)
      try {
        const [poResponse, grnResponse] = await Promise.all([
          procurementApiV2.getPurchaseOrders({ vendorId }),
          procurementApiV2.getGRNs({ vendorId }),
        ])

        if (poResponse.success && poResponse.data) {
          setPurchaseOrders(poResponse.data)
        }

        if (grnResponse.success && grnResponse.data) {
          setGoodsReceivedNotes(grnResponse.data)
        }
      } catch (error: any) {
        toast.error("Failed to load purchase orders or GRNs", { description: error.message })
      } finally {
        setLoadingRelations(false)
      }
    }

    setSourcePurchaseOrderId("")
    setGoodsReceivedNoteId("")
    loadVendorRelations()
  }, [vendorId, isOpen])

  useEffect(() => {
    if (!isOpen) return

    if (!sourcePurchaseOrderId) {
      return
    }

    const loadGrnsByPo = async () => {
      setLoadingRelations(true)
      try {
        const response = await procurementApiV2.getGRNs({ purchaseOrderId: sourcePurchaseOrderId })
        if (response.success && response.data) {
          setGoodsReceivedNotes(response.data)
        }
      } catch (error: any) {
        toast.error("Failed to load GRNs", { description: error.message })
      } finally {
        setLoadingRelations(false)
      }
    }

    setGoodsReceivedNoteId("")
    loadGrnsByPo()
  }, [sourcePurchaseOrderId, isOpen])

  useEffect(() => {
    if (!sourcePurchaseOrderId && purchaseOrders.length === 1) {
      setSourcePurchaseOrderId(purchaseOrders[0].id)
    }
  }, [purchaseOrders, sourcePurchaseOrderId])

  useEffect(() => {
    if (!goodsReceivedNoteId && goodsReceivedNotes.length === 1) {
      setGoodsReceivedNoteId(goodsReceivedNotes[0].id)
    }
  }, [goodsReceivedNotes, goodsReceivedNoteId])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (uploadMode === 'file' && !documentFile) {
      toast.error("Please select an invoice document to upload")
      return
    }
    if (uploadMode === 'url' && !documentUrl.trim()) {
      toast.error("Please enter a document URL")
      return
    }

    if (!vendorId) {
      toast.error("Please select a vendor")
      return
    }

    setLoading(true)
    try {
      const payload: Parameters<typeof procurementApiV2.createInvoiceIntake>[0] = {
        vendorId,
      }
      if (uploadMode === 'file' && documentFile) {
        payload.documentFile = documentFile
      } else if (uploadMode === 'url') {
        payload.documentUrl = documentUrl
      }
      if (sourcePurchaseOrderId) payload.sourcePurchaseOrderId = sourcePurchaseOrderId
      if (goodsReceivedNoteId) payload.goodsReceivedNoteId = goodsReceivedNoteId

      const response = await procurementApiV2.createInvoiceIntake(payload)

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
    setUploadMode('file')
    setDocumentFile(null)
    setDocumentUrl("")
    setVendorId("")
    setSourcePurchaseOrderId("")
    setGoodsReceivedNoteId("")
    setIntakeId(null)
    setExtractedData(null)
    onClose()
  }

  const filteredPurchaseOrders = purchaseOrders
  const filteredGoodsReceivedNotes = sourcePurchaseOrderId
    ? goodsReceivedNotes.filter((grn) => grn.purchaseOrderId === sourcePurchaseOrderId)
    : goodsReceivedNotes

  useEffect(() => {
    if (!goodsReceivedNoteId && filteredGoodsReceivedNotes.length === 1) {
      setGoodsReceivedNoteId(filteredGoodsReceivedNotes[0].id)
    }
  }, [filteredGoodsReceivedNotes, goodsReceivedNoteId])

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
                  <div className="space-y-2">
                    <Label>Invoice Document *</Label>
                    <div className="inline-flex bg-gray-100 rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
                          uploadMode === 'file'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
                          uploadMode === 'url'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        From URL
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div>
                        <Input
                          id="documentFile"
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                        />
                        {documentFile ? (
                          <p className="text-xs text-gray-600 mt-1">
                            Selected: <span className="font-medium">{documentFile.name}</span>{' '}
                            ({(documentFile.size / 1024).toFixed(1)} KB)
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Choose a PDF or image of the vendor invoice
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Input
                          id="documentUrl"
                          type="url"
                          value={documentUrl}
                          onChange={(e) => setDocumentUrl(e.target.value)}
                          placeholder="https://example.com/invoice.pdf"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Public URL to a PDF or image of the vendor invoice
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vendorId">Vendor *</Label>
                      <Select
                        value={vendorId}
                        onValueChange={(value) => setVendorId(value)}
                      >
                        <SelectTrigger id="vendorId" className="rounded-lg">
                          <SelectValue placeholder={loadingData ? "Loading vendors..." : "Select vendor"} />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sourcePurchaseOrderId">Purchase Order</Label>
                      <Select
                        value={sourcePurchaseOrderId || "none"}
                        onValueChange={(value) => setSourcePurchaseOrderId(value === "none" ? "" : value)}
                        disabled={loadingRelations}
                      >
                        <SelectTrigger id="sourcePurchaseOrderId" className="rounded-lg">
                          <SelectValue
                            placeholder={
                              loadingRelations
                                ? "Loading purchase orders..."
                                : "Select purchase order"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {filteredPurchaseOrders.map((po) => (
                            <SelectItem key={po.id} value={po.id}>
                              {po.poNumber} - {po.vendorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="goodsReceivedNoteId">Goods Received Note</Label>
                      <Select
                        value={goodsReceivedNoteId || "none"}
                        onValueChange={(value) => setGoodsReceivedNoteId(value === "none" ? "" : value)}
                        disabled={loadingRelations || (!vendorId && !sourcePurchaseOrderId)}
                      >
                        <SelectTrigger id="goodsReceivedNoteId" className="rounded-lg">
                          <SelectValue
                            placeholder={
                              loadingRelations
                                ? "Loading GRNs..."
                                : "Select goods received note"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {filteredGoodsReceivedNotes.map((grn) => (
                            <SelectItem key={grn.id} value={grn.id}>
                              {grn.grnNumber} {grn.poNumber ? `- ${grn.poNumber}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-full h-10 px-6">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} variant="gradient-create" className="rounded-full h-10 px-6 shadow-sm">
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
                  <Button type="button" variant="outline" onClick={handleClose} disabled={extractLoading} className="rounded-full h-10 px-6">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExtract}
                    disabled={extractLoading}
                    variant="gradient-create"
                    className="rounded-full h-10 px-6 shadow-sm"
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
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-full h-10 px-6">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 rounded-full h-10 px-6"
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
                  variant="gradient-create"
                  className="flex-1 rounded-full h-10 px-6 shadow-sm"
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
