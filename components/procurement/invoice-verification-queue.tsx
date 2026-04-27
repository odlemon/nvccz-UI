"use client"

import { useState, useEffect } from "react"
import { procurementApiV2, InvoiceIntake } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProcurementDrawer } from "./procurement-drawer"
import { Loader2, CheckCircle, AlertCircle, FileText, Clock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export function InvoiceVerificationQueue() {
  const [queue, setQueue] = useState<InvoiceIntake[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedIntake, setSelectedIntake] = useState<InvoiceIntake | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    try {
      setLoading(true)
      const response = await procurementApiV2.getVerificationQueue(50)
      if (response.success && response.data) {
        setQueue(response.data)
      }
    } catch (error) {
      toast.error("Failed to load verification queue")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: string) => {
    setVerifyingId(id)
    try {
      const response = await procurementApiV2.verifyInvoiceIntake(id)
      if (response.success) {
        toast.success("Invoice verified")
        setQueue(queue.filter(q => q.id !== id))
        setIsDrawerOpen(false)
      } else {
        toast.error("Verification failed")
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setVerifyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {queue.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Queue Clear</h3>
            <p className="text-gray-500">All invoices verified and processed</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{queue.length} Invoices Pending Verification</h3>
              <p className="text-sm text-gray-600">Review extracted data and verify accuracy</p>
            </div>
            <Badge className="bg-amber-100 text-amber-800">{queue.length} Pending</Badge>
          </div>

          <div className="space-y-3">
            {queue.map((intake) => (
              <Card key={intake.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <p className="font-semibold">
                          {intake.extractedData?.invoiceNumber || 'Invoice'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {intake.extractedData?.vendorName || 'Unknown Vendor'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold">
                            {intake.extractedData?.currency} {intake.extractedData?.totalAmount || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Invoice Date</p>
                          <p className="font-semibold">
                            {intake.extractedData?.invoiceDate
                              ? format(new Date(intake.extractedData.invoiceDate), 'MMM dd, yyyy')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Confidence</p>
                          <p className="font-semibold">
                            {intake.extractedData
                              ? `${(intake.extractedData.confidence * 100).toFixed(0)}%`
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {intake.extractedData && intake.extractedData.confidence < 0.8 && (
                        <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            Low confidence extraction. Please review carefully.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntake(intake)
                          setIsDrawerOpen(true)
                        }}
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-primary text-white"
                        disabled={verifyingId === intake.id}
                        onClick={() => handleVerify(intake.id)}
                      >
                        {verifyingId === intake.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Invoice Details"
        description="Review extracted invoice data"
        size="lg"
      >
        {selectedIntake?.extractedData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Invoice Number</label>
                    <p className="font-semibold">{selectedIntake.extractedData.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Vendor</label>
                    <p className="font-semibold">{selectedIntake.extractedData.vendorName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Invoice Date</label>
                    <p className="font-semibold">
                      {format(new Date(selectedIntake.extractedData.invoiceDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Due Date</label>
                    <p className="font-semibold">
                      {format(new Date(selectedIntake.extractedData.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Total Amount</label>
                    <p className="text-2xl font-bold">
                      {selectedIntake.extractedData.currency} {selectedIntake.extractedData.totalAmount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedIntake.extractedData.items && selectedIntake.extractedData.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedIntake.extractedData.items.map((item, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                          </div>
                          <p className="font-semibold">{item.totalPrice}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.unit} @ {item.unitPrice} each
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)} className="flex-1">
                Close
              </Button>
              <Button
                className="gradient-primary text-white flex-1"
                disabled={verifyingId === selectedIntake.id}
                onClick={() => handleVerify(selectedIntake.id)}
              >
                {verifyingId === selectedIntake.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </ProcurementDrawer>
    </div>
  )
}
